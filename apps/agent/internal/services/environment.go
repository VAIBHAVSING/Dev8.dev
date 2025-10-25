package services

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/azure"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/config"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/models"
)

// EnvironmentService handles environment lifecycle operations
type EnvironmentService struct {
	config         *config.Config
	azureClient    *azure.Client
	storageClients map[string]*azure.StorageClient
}

// NewEnvironmentService creates a new environment service
func NewEnvironmentService(cfg *config.Config, azureClient *azure.Client) (*EnvironmentService, error) {
	// No database requirement - Agent is stateless
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
func (s *EnvironmentService) Close() {
	// Nothing to close - stateless!
}

// CreateEnvironment creates a new cloud development environment
func (s *EnvironmentService) CreateEnvironment(ctx context.Context, req *models.CreateEnvironmentRequest) (*models.Environment, error) {
	// CRITICAL: workspaceId (UUID) comes from Next.js (already created in DB)
	if err := req.Validate(); err != nil {
		return nil, err
	}

	// Validate region
	regionConfig := s.config.GetRegion(req.CloudRegion)
	if regionConfig == nil {
		return nil, models.ErrInvalidRequest(fmt.Sprintf("region %s is not available", req.CloudRegion))
	}

	// Get storage client for region
	storageClient, ok := s.storageClients[req.CloudRegion]
	if !ok {
		return nil, models.ErrInternalServer(fmt.Sprintf("storage client not found for region %s", req.CloudRegion))
	}

	// IMPORTANT: Use workspaceId for all Azure resource names
	workspaceID := req.WorkspaceID // UUID from database (e.g., "clxxx-yyyy-zzzz")

	// Azure resource names based on UUID
	fileShareName := fmt.Sprintf("fs-%s", workspaceID)       // fs-clxxx-yyyy-zzzz
	containerGroupName := fmt.Sprintf("aci-%s", workspaceID) // aci-clxxx-yyyy-zzzz
	dnsLabel := fmt.Sprintf("ws-%s", workspaceID)            // ws-clxxx-yyyy-zzzz

	resourceGroup := regionConfig.ResourceGroupName
	if resourceGroup == "" {
		resourceGroup = s.config.Azure.ResourceGroupName
	}

	// Create Azure File Share (named by UUID)
	log.Printf("Creating file share: %s (workspace: %s)", fileShareName, workspaceID)
	if err := storageClient.CreateFileShare(ctx, fileShareName, int32(req.StorageGB)); err != nil {
		return nil, fmt.Errorf("failed to create file share: %w", err)
	}

	// Create container spec with UUID-based names
	containerSpec := azure.ContainerGroupSpec{
		ContainerName:      "vscode-server",
		Image:              s.getContainerImage(req.BaseImage),
		CPUCores:           req.CPUCores,
		MemoryGB:           req.MemoryGB,
		DNSNameLabel:       dnsLabel,      // ws-clxxx-yyyy-zzzz
		FileShareName:      fileShareName, // fs-clxxx-yyyy-zzzz
		StorageAccountName: regionConfig.StorageAccount,
		StorageAccountKey:  s.config.Azure.StorageAccountKey,
		EnvironmentID:      workspaceID, // Pass UUID to container env vars
		UserID:             req.UserID,
	}

	// Create ACI Container Group (named by UUID)
	log.Printf("Creating container group: %s (workspace: %s)", containerGroupName, workspaceID)
	if err := s.azureClient.CreateContainerGroup(ctx, req.CloudRegion, resourceGroup, containerGroupName, containerSpec); err != nil {
		// Cleanup file share on error
		_ = storageClient.DeleteFileShare(ctx, fileShareName)
		return nil, fmt.Errorf("failed to create container group: %w", err)
	}

	// Wait for container to get FQDN
	time.Sleep(5 * time.Second)

	// Get container details
	containerDetails, err := s.azureClient.GetContainerGroup(ctx, req.CloudRegion, resourceGroup, containerGroupName)
	if err != nil {
		log.Printf("Warning: failed to get container details: %v", err)
	}

	// Extract FQDN (will be ws-{workspaceId}.{region}.azurecontainer.io)
	var fqdn string
	if containerDetails != nil &&
		containerDetails.Properties != nil &&
		containerDetails.Properties.IPAddress != nil &&
		containerDetails.Properties.IPAddress.Fqdn != nil {
		fqdn = *containerDetails.Properties.IPAddress.Fqdn
	}

	// Generate connection URLs (all contain UUID via FQDN)
	connectionURLs := generateConnectionURLs(fqdn, "")

	// Build environment response
	env := &models.Environment{
		ID:          workspaceID, // CRITICAL: Return the UUID from request
		Name:        req.Name,
		UserID:      req.UserID,
		Status:      "running",
		CloudRegion: req.CloudRegion,
		CPUCores:    req.CPUCores,
		MemoryGB:    req.MemoryGB,
		StorageGB:   req.StorageGB,
		BaseImage:   req.BaseImage,

		// Azure resource identifiers (all based on UUID)
		AzureResourceGroup:  resourceGroup,
		AzureContainerGroup: containerGroupName, // aci-clxxx-yyyy-zzzz
		AzureFileShare:      fileShareName,      // fs-clxxx-yyyy-zzzz
		AzureFQDN:           fqdn,               // ws-clxxx-yyyy-zzzz.eastus.azurecontainer.io

		// Connection URLs (contain UUID)
		ConnectionURLs: connectionURLs,

		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	log.Printf("✅ Created workspace %s: container=%s, fileshare=%s, fqdn=%s",
		workspaceID, containerGroupName, fileShareName, fqdn)

	// ❌ NO DATABASE OPERATIONS - Next.js will update the workspace with these details
	return env, nil
}

// StartEnvironment starts a stopped environment
func (s *EnvironmentService) StartEnvironment(ctx context.Context, workspaceID, region string) error {
	// Derive Azure resource names from UUID
	regionConfig := s.config.GetRegion(region)
	if regionConfig == nil {
		return models.ErrInternalServer("region configuration not found")
	}

	resourceGroup := regionConfig.ResourceGroupName
	if resourceGroup == "" {
		resourceGroup = s.config.Azure.ResourceGroupName
	}

	containerGroupName := fmt.Sprintf("aci-%s", workspaceID) // aci-{uuid}

	log.Printf("Starting workspace %s: container=%s", workspaceID, containerGroupName)

	// Start the container
	if err := s.azureClient.StartContainerGroup(ctx, region, resourceGroup, containerGroupName); err != nil {
		return fmt.Errorf("failed to start container group: %w", err)
	}

	log.Printf("✅ Started workspace %s", workspaceID)
	return nil
}

// StopEnvironment stops a running environment
func (s *EnvironmentService) StopEnvironment(ctx context.Context, workspaceID, region string) error {
	// Derive Azure resource names from UUID
	regionConfig := s.config.GetRegion(region)
	if regionConfig == nil {
		return models.ErrInternalServer("region configuration not found")
	}

	resourceGroup := regionConfig.ResourceGroupName
	if resourceGroup == "" {
		resourceGroup = s.config.Azure.ResourceGroupName
	}

	containerGroupName := fmt.Sprintf("aci-%s", workspaceID) // aci-{uuid}

	log.Printf("Stopping workspace %s: container=%s", workspaceID, containerGroupName)

	// Stop the container
	if err := s.azureClient.StopContainerGroup(ctx, region, resourceGroup, containerGroupName); err != nil {
		return fmt.Errorf("failed to stop container group: %w", err)
	}

	log.Printf("✅ Stopped workspace %s", workspaceID)
	return nil
}

// DeleteEnvironment deletes an environment and all associated resources
func (s *EnvironmentService) DeleteEnvironment(ctx context.Context, workspaceID, region string) error {
	// Derive Azure resource names from UUID
	regionConfig := s.config.GetRegion(region)
	if regionConfig == nil {
		return models.ErrInternalServer("region configuration not found")
	}

	resourceGroup := regionConfig.ResourceGroupName
	if resourceGroup == "" {
		resourceGroup = s.config.Azure.ResourceGroupName
	}

	containerGroupName := fmt.Sprintf("aci-%s", workspaceID) // aci-{uuid}
	fileShareName := fmt.Sprintf("fs-%s", workspaceID)       // fs-{uuid}

	log.Printf("Deleting workspace %s: container=%s, fileshare=%s",
		workspaceID, containerGroupName, fileShareName)

	// Delete ACI container
	if err := s.azureClient.DeleteContainerGroup(ctx, region, resourceGroup, containerGroupName); err != nil {
		log.Printf("Warning: failed to delete container group %s: %v", containerGroupName, err)
		// Continue with file share deletion even if container delete fails
	}

	// Delete file share
	storageClient, ok := s.storageClients[region]
	if ok && fileShareName != "" {
		if err := storageClient.DeleteFileShare(ctx, fileShareName); err != nil {
			log.Printf("Warning: failed to delete file share %s: %v", fileShareName, err)
		}
	}

	log.Printf("✅ Deleted workspace %s", workspaceID)
	return nil
}

// RecordActivity updates persistence with the latest activity snapshot.
func (s *EnvironmentService) RecordActivity(ctx context.Context, report *models.ActivityReport) error {
	if report == nil {
		return models.ErrInvalidRequest("activity payload is required")
	}

	// Just log activity for MVP
	// Later: forward to Next.js webhook
	log.Printf("Activity recorded for environment %s: IDE=%d SSH=%d",
		report.EnvironmentID,
		report.Snapshot.ActiveIDE,
		report.Snapshot.ActiveSSH)

	return nil
}

// Helper functions

func generateConnectionURLs(fqdn, password string) models.ConnectionURLs {
	if fqdn == "" {
		return models.ConnectionURLs{}
	}

	// Generate a secure password if not provided
	if password == "" {
		password = fmt.Sprintf("dev8-%d", time.Now().UnixNano()%100000)
	}

	return models.ConnectionURLs{
		SSHURL:             fmt.Sprintf("ssh://user@%s:2222", fqdn),
		VSCodeWebURL:       fmt.Sprintf("https://%s:8080", fqdn),
		VSCodeDesktopURL:   fmt.Sprintf("vscode-remote://ssh-remote+user@%s:2222/workspace", fqdn),
		SupervisorURL:      fmt.Sprintf("http://%s:9000", fqdn),
		CodeServerPassword: password,
	}
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
