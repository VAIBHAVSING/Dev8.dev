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
	"github.com/jackc/pgx/v5/pgxpool"
)

// EnvironmentService handles environment lifecycle operations
type EnvironmentService struct {
	config         *config.Config
	azureClient    *azure.Client
	storageClients map[string]*azure.StorageClient
	db             *pgxpool.Pool
}

// NewEnvironmentService creates a new environment service
func NewEnvironmentService(cfg *config.Config, azureClient *azure.Client) (*EnvironmentService, error) {
	if cfg.DatabaseURL == "" {
		return nil, fmt.Errorf("DATABASE_URL must be configured")
	}

	pool, err := pgxpool.New(context.Background(), cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create database pool: %w", err)
	}

	service := &EnvironmentService{
		config:         cfg,
		azureClient:    azureClient,
		storageClients: make(map[string]*azure.StorageClient),
		db:             pool,
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
	if s.db != nil {
		s.db.Close()
	}
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
			env.VSCodeURL = fmt.Sprintf("http://%s:8080", *containerGroup.Properties.IPAddress.Fqdn)
		}
	}

	env.Status = models.StatusRunning
	env.UpdatedAt = time.Now()

	return env, nil
}

// GetEnvironment retrieves an environment by ID
func (s *EnvironmentService) GetEnvironment(ctx context.Context, envID, userID string) (*models.Environment, error) {
	// In a real implementation, this would fetch from database
	// For now, we'll return a not found error
	return nil, models.ErrNotFound("environment not found")
}

// StartEnvironment starts a stopped environment
func (s *EnvironmentService) StartEnvironment(ctx context.Context, envID, userID string) error {
	// Get environment details (from database in real implementation)
	env, err := s.GetEnvironment(ctx, envID, userID)
	if err != nil {
		return err
	}

	if env.Status != models.StatusStopped {
		return models.ErrInvalidRequest("environment is not in stopped state")
	}

	// Get region configuration
	regionConfig := s.config.GetRegion(env.CloudRegion)
	if regionConfig == nil {
		return models.ErrInternalServer("region configuration not found")
	}

	resourceGroup := regionConfig.ResourceGroupName
	if resourceGroup == "" {
		resourceGroup = s.config.Azure.ResourceGroupName
	}

	// Start the container group
	if err := s.azureClient.StartContainerGroup(ctx, env.CloudRegion, resourceGroup, env.ACIContainerGroupID); err != nil {
		return fmt.Errorf("failed to start container group: %w", err)
	}

	// Update status (in database in real implementation)
	env.Status = models.StatusRunning
	env.UpdatedAt = time.Now()

	return nil
}

// StopEnvironment stops a running environment
func (s *EnvironmentService) StopEnvironment(ctx context.Context, envID, userID string) error {
	// Get environment details (from database in real implementation)
	env, err := s.GetEnvironment(ctx, envID, userID)
	if err != nil {
		return err
	}

	if env.Status != models.StatusRunning {
		return models.ErrInvalidRequest("environment is not in running state")
	}

	// Get region configuration
	regionConfig := s.config.GetRegion(env.CloudRegion)
	if regionConfig == nil {
		return models.ErrInternalServer("region configuration not found")
	}

	resourceGroup := regionConfig.ResourceGroupName
	if resourceGroup == "" {
		resourceGroup = s.config.Azure.ResourceGroupName
	}

	// Stop the container group
	if err := s.azureClient.StopContainerGroup(ctx, env.CloudRegion, resourceGroup, env.ACIContainerGroupID); err != nil {
		return fmt.Errorf("failed to stop container group: %w", err)
	}

	// Update status (in database in real implementation)
	env.Status = models.StatusStopped
	env.UpdatedAt = time.Now()

	return nil
}

// DeleteEnvironment deletes an environment and all associated resources
func (s *EnvironmentService) DeleteEnvironment(ctx context.Context, envID, userID string) error {
	// Get environment details (from database in real implementation)
	env, err := s.GetEnvironment(ctx, envID, userID)
	if err != nil {
		return err
	}

	// Get region configuration
	regionConfig := s.config.GetRegion(env.CloudRegion)
	if regionConfig == nil {
		return models.ErrInternalServer("region configuration not found")
	}

	resourceGroup := regionConfig.ResourceGroupName
	if resourceGroup == "" {
		resourceGroup = s.config.Azure.ResourceGroupName
	}

	// Delete container group
	if err := s.azureClient.DeleteContainerGroup(ctx, env.CloudRegion, resourceGroup, env.ACIContainerGroupID); err != nil {
		// Log error but continue with cleanup
		fmt.Printf("Warning: failed to delete container group: %v\n", err)
	}

	// Delete file share
	storageClient, ok := s.storageClients[env.CloudRegion]
	if ok && env.AzureFileShareName != "" {
		if err := storageClient.DeleteFileShare(ctx, env.AzureFileShareName); err != nil {
			// Log error but continue
			fmt.Printf("Warning: failed to delete file share: %v\n", err)
		}
	}

	// Update status (in database in real implementation)
	env.Status = models.StatusDeleting
	env.UpdatedAt = time.Now()

	return nil
}

// RecordActivity updates persistence with the latest activity snapshot.
func (s *EnvironmentService) RecordActivity(ctx context.Context, report *models.ActivityReport) error {
	if report == nil {
		return models.ErrInvalidRequest("activity payload is required")
	}

	if s.db == nil {
		return models.ErrInternalServer("database connection not configured")
	}

	cmdTag, err := s.db.Exec(ctx, `
		UPDATE environments
		SET last_accessed_at = $2,
			updated_at = NOW()
		WHERE id = $1
	`, report.EnvironmentID, report.Timestamp)
	if err != nil {
		return fmt.Errorf("update environment activity: %w", err)
	}

	if cmdTag.RowsAffected() == 0 {
		return models.ErrNotFound("environment not found")
	}

	// Optional: log metrics for observability
	log.Printf("environment %s activity recorded: ide=%d ssh=%d", report.EnvironmentID, report.Snapshot.ActiveIDE, report.Snapshot.ActiveSSH)

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
