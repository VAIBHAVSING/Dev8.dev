package services

import (
	"context"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/azure"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/config"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/models"
)

// EnvironmentService handles environment lifecycle operations
// This service is stateless and only orchestrates Azure resources
// All data persistence is handled by Next.js + PostgreSQL
type EnvironmentService struct {
	config         *config.Config
	azureClient    *azure.Client
	storageClients map[string]*azure.StorageClient
}

// NewEnvironmentService creates a new environment service
func NewEnvironmentService(cfg *config.Config, azureClient *azure.Client) (*EnvironmentService, error) {
	service := &EnvironmentService{
		config:         cfg,
		azureClient:    azureClient,
		storageClients: make(map[string]*azure.StorageClient),
	}

	// Initialize storage clients for all regions
	for _, region := range cfg.Azure.Regions {
		if region.Enabled && region.StorageAccount != "" {
			storageClient, err := azure.NewStorageClient(region.StorageAccount, cfg.Azure.StorageAccountKey)
			if err != nil {
				return nil, fmt.Errorf("failed to create storage client for region %s: %w", region.Name, err)
			}
			service.storageClients[region.Name] = storageClient
		}
	}

	return service, nil
}

// Close releases service resources.
// No-op for stateless service - kept for compatibility
func (s *EnvironmentService) Close() {
	// No resources to clean up - service is stateless
}

// CreateEnvironment creates a new cloud development environment
func (s *EnvironmentService) CreateEnvironment(ctx context.Context, req *models.CreateEnvironmentRequest) (*models.Environment, error) {
	// Validate request
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Validate region
	regionConfig := s.config.GetRegion(req.CloudRegion)
	if regionConfig == nil {
		return nil, models.ErrInvalidRequest(fmt.Sprintf("region %s is not available", req.CloudRegion))
	}

	// Generate unique identifiers
	envID := generateEnvironmentID()
	fileShareName := generateFileShareName(req.UserID, envID)
	containerGroupName := generateContainerGroupName(envID)
	dnsLabel := generateDNSLabel(envID)

	// Create environment object
	env := &models.Environment{
		ID:                  envID,
		UserID:              req.UserID,
		Name:                req.Name,
		Status:              models.StatusCreating,
		CloudProvider:       models.ProviderAzure,
		CloudRegion:         req.CloudRegion,
		CPUCores:            req.CPUCores,
		MemoryGB:            req.MemoryGB,
		StorageGB:           req.StorageGB,
		BaseImage:           req.BaseImage,
		AzureFileShareName:  fileShareName,
		ACIContainerGroupID: containerGroupName,
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
		LastAccessedAt:      time.Now(),
	}

	// Step 1: Create Azure File Share for persistent storage
	storageClient, ok := s.storageClients[req.CloudRegion]
	if !ok {
		return nil, models.ErrInternalServer(fmt.Sprintf("storage client not found for region %s", req.CloudRegion))
	}

	if err := storageClient.CreateFileShare(ctx, fileShareName, int32(req.StorageGB)); err != nil {
		return nil, fmt.Errorf("failed to create file share: %w", err)
	}

	// Step 2: Create ACI Container Group with VS Code Server
	containerSpec := azure.ContainerGroupSpec{
		ContainerName:      "vscode-server",
		Image:              s.getContainerImage(req.BaseImage),
		CPUCores:           req.CPUCores,
		MemoryGB:           req.MemoryGB,
		DNSNameLabel:       dnsLabel,
		FileShareName:      fileShareName,
		StorageAccountName: regionConfig.StorageAccount,
		StorageAccountKey:  s.config.Azure.StorageAccountKey,
		EnvironmentID:      envID,
		UserID:             req.UserID,
	}

	resourceGroup := regionConfig.ResourceGroupName
	if resourceGroup == "" {
		resourceGroup = s.config.Azure.ResourceGroupName
	}

	if err := s.azureClient.CreateContainerGroup(ctx, req.CloudRegion, resourceGroup, containerGroupName, containerSpec); err != nil {
		// Cleanup: Delete file share if container creation fails
		if cleanupErr := storageClient.DeleteFileShare(ctx, fileShareName); cleanupErr != nil {
			fmt.Printf("Warning: failed to cleanup file share during error handling: %v\n", cleanupErr)
		}
		return nil, fmt.Errorf("failed to create container group: %w", err)
	}

	// Step 3: Get container group details to populate URLs
	containerGroup, err := s.azureClient.GetContainerGroup(ctx, req.CloudRegion, resourceGroup, containerGroupName)
	if err != nil {
		return nil, fmt.Errorf("failed to get container group details: %w", err)
	}

	// Update environment with container details
	if containerGroup.Properties != nil && containerGroup.Properties.IPAddress != nil {
		if containerGroup.Properties.IPAddress.IP != nil {
			env.ACIPublicIP = *containerGroup.Properties.IPAddress.IP
		}
		if containerGroup.Properties.IPAddress.Fqdn != nil {
			fqdn := *containerGroup.Properties.IPAddress.Fqdn
			env.VSCodeURL = fmt.Sprintf("http://%s:8080", fqdn)
			// Add SSH URL for terminal access
			env.SSHURL = fmt.Sprintf("ssh://workspace@%s:2222", fqdn)
		}
	}

	// Add resource group information for Next.js to use in Start/Stop/Delete operations
	env.ResourceGroup = resourceGroup
	env.Status = models.StatusRunning
	env.UpdatedAt = time.Now()

	return env, nil
}

// StartEnvironment starts a stopped environment
// Next.js provides the Azure resource identifiers from its database
func (s *EnvironmentService) StartEnvironment(ctx context.Context, region, resourceGroup, containerGroupName string) error {
	// Validate inputs
	if region == "" || resourceGroup == "" || containerGroupName == "" {
		return models.ErrInvalidRequest("region, resourceGroup, and containerGroupName are required")
	}

	// Validate region
	regionConfig := s.config.GetRegion(region)
	if regionConfig == nil {
		return models.ErrInvalidRequest(fmt.Sprintf("region %s is not available", region))
	}

	// Start the container group
	if err := s.azureClient.StartContainerGroup(ctx, region, resourceGroup, containerGroupName); err != nil {
		return fmt.Errorf("failed to start container group: %w", err)
	}

	return nil
}

// StopEnvironment stops a running environment
// Next.js provides the Azure resource identifiers from its database
func (s *EnvironmentService) StopEnvironment(ctx context.Context, region, resourceGroup, containerGroupName string) error {
	// Validate inputs
	if region == "" || resourceGroup == "" || containerGroupName == "" {
		return models.ErrInvalidRequest("region, resourceGroup, and containerGroupName are required")
	}

	// Validate region
	regionConfig := s.config.GetRegion(region)
	if regionConfig == nil {
		return models.ErrInvalidRequest(fmt.Sprintf("region %s is not available", region))
	}

	// Stop the container group
	if err := s.azureClient.StopContainerGroup(ctx, region, resourceGroup, containerGroupName); err != nil {
		return fmt.Errorf("failed to stop container group: %w", err)
	}

	return nil
}

// DeleteEnvironment deletes an environment and all associated resources
// Next.js provides the Azure resource identifiers from its database
func (s *EnvironmentService) DeleteEnvironment(ctx context.Context, region, resourceGroup, containerGroupName, fileShareName string) error {
	// Validate inputs
	if region == "" || resourceGroup == "" || containerGroupName == "" {
		return models.ErrInvalidRequest("region, resourceGroup, and containerGroupName are required")
	}

	// Validate region
	regionConfig := s.config.GetRegion(region)
	if regionConfig == nil {
		return models.ErrInvalidRequest(fmt.Sprintf("region %s is not available", region))
	}

	// Delete container group
	if err := s.azureClient.DeleteContainerGroup(ctx, region, resourceGroup, containerGroupName); err != nil {
		// Log error but continue with cleanup
		log.Printf("Warning: failed to delete container group: %v", err)
	}

	// Delete file share if specified
	if fileShareName != "" {
		storageClient, ok := s.storageClients[region]
		if ok {
			if err := storageClient.DeleteFileShare(ctx, fileShareName); err != nil {
				// Log error but continue
				log.Printf("Warning: failed to delete file share: %v", err)
			}
		}
	}

	return nil
}

// RecordActivity logs activity from the workspace supervisor
// In a stateless architecture, this just logs the activity
// In the future, this could forward to a Next.js webhook
func (s *EnvironmentService) RecordActivity(ctx context.Context, report *models.ActivityReport) error {
	if report == nil {
		return models.ErrInvalidRequest("activity payload is required")
	}

	// Log activity for observability
	log.Printf("Activity recorded for environment %s: IDE=%d, SSH=%d, timestamp=%s",
		report.EnvironmentID,
		report.Snapshot.ActiveIDE,
		report.Snapshot.ActiveSSH,
		report.Timestamp.Format(time.RFC3339))

	// TODO: Forward to Next.js webhook for persistence
	// This would allow Next.js to update the database with activity information

	return nil
}

// Helper functions

func generateEnvironmentID() string {
	// In production, use a more robust ID generation (e.g., UUID)
	return fmt.Sprintf("env-%d", time.Now().UnixNano())
}

func generateFileShareName(userID, envID string) string {
	// Azure File Share names must be lowercase and alphanumeric with hyphens
	cleanUserID := strings.ToLower(strings.ReplaceAll(userID, "_", "-"))
	cleanEnvID := strings.ToLower(strings.ReplaceAll(envID, "_", "-"))

	// Ensure we don't exceed string bounds
	userIDPart := cleanUserID
	if len(cleanUserID) > 8 {
		userIDPart = cleanUserID[:8]
	}

	envIDPart := cleanEnvID
	if len(cleanEnvID) > 12 {
		envIDPart = cleanEnvID[4:12]
	} else if len(cleanEnvID) > 4 {
		envIDPart = cleanEnvID[4:]
	}

	return fmt.Sprintf("workspace-%s-%s", userIDPart, envIDPart)
}

func generateContainerGroupName(envID string) string {
	return fmt.Sprintf("aci-%s", envID)
}

func generateDNSLabel(envID string) string {
	// DNS labels must be lowercase and alphanumeric with hyphens
	return fmt.Sprintf("dev8-%s", strings.ToLower(envID))
}

func (s *EnvironmentService) getContainerImage(baseImage string) string {
	// Map base image names to actual container registry images
	registry := s.config.Azure.ContainerRegistry

	imageMap := map[string]string{
		"node":   fmt.Sprintf("%s/vscode-node:latest", registry),
		"python": fmt.Sprintf("%s/vscode-python:latest", registry),
		"go":     fmt.Sprintf("%s/vscode-go:latest", registry),
		"rust":   fmt.Sprintf("%s/vscode-rust:latest", registry),
		"java":   fmt.Sprintf("%s/vscode-java:latest", registry),
	}

	if image, ok := imageMap[baseImage]; ok {
		return image
	}

	// Default to Node.js image
	return fmt.Sprintf("%s/vscode-node:latest", registry)
}
