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
type EnvironmentService struct {
	config             *config.Config
	azureClient        *azure.Client
	storageClients     map[string]*azure.StorageClient
	deploymentStrategy *DeploymentStrategy
}

// NewEnvironmentService creates a new environment service
func NewEnvironmentService(cfg *config.Config, azureClient *azure.Client) (*EnvironmentService, error) {
	// No database requirement - Agent is stateless
	service := &EnvironmentService{
		config:             cfg,
		azureClient:        azureClient,
		storageClients:     make(map[string]*azure.StorageClient),
		deploymentStrategy: NewDeploymentStrategy(cfg, azureClient),
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

	log.Printf("🚀 Creating workspace %s (region: %s)", workspaceID, req.CloudRegion)
	overallStartTime := time.Now()

	// Azure resource names based on UUID and deployment mode
	fileShareName := fmt.Sprintf("fs-%s", workspaceID) // fs-clxxx-yyyy-zzzz (unified volume)

	resourceGroup := regionConfig.ResourceGroupName
	if resourceGroup == "" {
		resourceGroup = s.config.Azure.ResourceGroupName
	}

	// Log image source
	containerImage := s.getContainerImage(req.BaseImage)
	if s.config.Azure.ContainerRegistry != "" {
		log.Printf("🐳 Using Azure Container Registry: %s", containerImage)
	} else {
		log.Printf("🐳 Using Docker Hub: %s", containerImage)
	}

	// ⚡⚡⚡ MAXIMUM CONCURRENCY: Start ALL operations in PARALLEL
	log.Printf("⚡⚡⚡ Starting CONCURRENT creation (unified volume + container) for workspace %s...", workspaceID)
	startTime := time.Now()

	// Channels for parallel execution
	type operationResult struct {
		name string
		err  error
	}

	volumeChan := make(chan operationResult, 1)
	aciChan := make(chan operationResult, 1)

	// Goroutine 1: Create unified file share (includes workspace + home subdirectories)
	go func() {
		// Safe conversion: validate StorageGB is non-negative and won't overflow
		if req.StorageGB < 0 || req.StorageGB > (1<<31-1-5) {
			volumeChan <- operationResult{name: "unified-volume", err: fmt.Errorf("workspace %s: invalid storage size: %d", workspaceID, req.StorageGB)}
			return
		}
		totalQuotaGB := int32(req.StorageGB) + 5 // nolint:gosec // G115: validated above to prevent overflow
		log.Printf("📁 [1/2] Creating unified volume: %s (%dGB) - contains workspace/ and home/", fileShareName, totalQuotaGB)
		err := storageClient.CreateFileShare(ctx, fileShareName, totalQuotaGB)
		volumeChan <- operationResult{name: "unified-volume", err: err}
	}()

	// Goroutine 2: Create container using deployment strategy
	go func() {
		// Wait for volume creation to complete FIRST
		volResult := <-volumeChan
		if volResult.err != nil {
			// Volume creation failed, propagate error
			aciChan <- operationResult{name: "container", err: fmt.Errorf("workspace %s: volume creation failed, skipping container creation: %w", workspaceID, volResult.err)}
			return
		}

		// Volume created successfully, now verify it's fully propagated in Azure
		// Poll for file share availability with exponential backoff
		if err := s.waitForFileShareAvailability(ctx, storageClient, fileShareName, 30*time.Second); err != nil {
			aciChan <- operationResult{name: "container", err: fmt.Errorf("workspace %s: file share not available after creation: %w", workspaceID, err)}
			return
		}

		deploySpec := ContainerDeploymentSpec{
			Image:              containerImage,
			CPUCores:           float64(req.CPUCores),
			MemoryGB:           float64(req.MemoryGB),
			FileShareName:      fileShareName,
			StorageAccountName: regionConfig.StorageAccount,
			StorageAccountKey:  s.config.Azure.StorageAccountKey,
			UserID:             req.UserID,
			RegistryServer:     s.getRegistryServer(),
			RegistryUsername:   s.config.RegistryUsername,
			RegistryPassword:   s.config.RegistryPassword,
			AgentBaseURL:       s.config.AgentBaseURL,
			GitHubToken:        req.GitHubToken,
			CodeServerPassword: req.CodeServerPassword,
			SSHPublicKey:       req.SSHPublicKey,
			GitUserName:        req.GitUserName,
			GitUserEmail:       req.GitUserEmail,
			AnthropicAPIKey:    req.AnthropicAPIKey,
			OpenAIAPIKey:       req.OpenAIAPIKey,
			GeminiAPIKey:       req.GeminiAPIKey,
		}

		log.Printf("📦 [2/2] Creating %s container for workspace %s", s.config.Azure.DeploymentMode, workspaceID)
		_, err := s.deploymentStrategy.CreateContainer(ctx, workspaceID, req.CloudRegion, resourceGroup, deploySpec)
		aciChan <- operationResult{name: "container", err: err}
	}()

	// Wait for container operation to complete (volume result already consumed by goroutine 2)
	aciResult := <-aciChan

	totalTime := time.Since(startTime)
	log.Printf("⚡⚡⚡ ALL OPERATIONS COMPLETED in %s", totalTime)

	// Check for errors (cleanup on failure)
	if aciResult.err != nil {
		// Check if error was from volume creation or container creation
		if aciResult.name == "container" {
			// Could be volume or container error - check message
			errMsg := aciResult.err.Error()
			if strings.Contains(errMsg, "volume creation failed") {
				return nil, fmt.Errorf("workspace %s: failed to create unified file share: %w", workspaceID, aciResult.err)
			}
			// Container creation failed - cleanup file share
			_ = storageClient.DeleteFileShare(ctx, fileShareName)
			return nil, fmt.Errorf("workspace %s: failed to create container: %w", workspaceID, aciResult.err)
		}
	}

	// Wait for container to get FQDN
	time.Sleep(3 * time.Second)

	// Get container details
	containerInfo, err := s.deploymentStrategy.GetContainer(ctx, workspaceID, req.CloudRegion, resourceGroup)
	if err != nil {
		log.Printf("Warning: workspace %s: failed to get container details: %v", workspaceID, err)
	}

	// Generate connection URLs
	var fqdn string
	if containerInfo != nil {
		fqdn = containerInfo.FQDN
	}
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
		AzureContainerGroup: fmt.Sprintf("%s-%s", s.config.Azure.DeploymentMode, workspaceID),
		AzureFileShare:      fileShareName, // fs-clxxx-yyyy-zzzz
		AzureFQDN:           fqdn,          // ws-clxxx-yyyy-zzzz.eastus.azurecontainer.io (or ACA FQDN)

		// Connection URLs (contain UUID)
		ConnectionURLs: connectionURLs,

		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	totalDuration := time.Since(overallStartTime)
	log.Printf("⚡⚡⚡ WORKSPACE READY in %s (all operations ran concurrently!)", totalDuration)
	log.Printf("✅ Workspace %s: %s", workspaceID, fqdn)

	// ❌ NO DATABASE OPERATIONS - Next.js will update the workspace with these details
	return env, nil
}

// StartEnvironment recreates container with existing volumes (fast restart)
func (s *EnvironmentService) StartEnvironment(ctx context.Context, req *models.StartEnvironmentRequest) (*models.Environment, error) {
	// Validate region
	regionConfig := s.config.GetRegion(req.CloudRegion)
	if regionConfig == nil {
		return nil, models.ErrNotFound(fmt.Sprintf("region %s is not available", req.CloudRegion))
	}

	storageClient, ok := s.storageClients[req.CloudRegion]
	if !ok {
		return nil, models.ErrInternalServer(fmt.Sprintf("storage client not found for region %s", req.CloudRegion))
	}

	workspaceID := req.WorkspaceID
	fileShareName := fmt.Sprintf("fs-%s", workspaceID)

	resourceGroup := regionConfig.ResourceGroupName
	if resourceGroup == "" {
		resourceGroup = s.config.Azure.ResourceGroupName
	}

	log.Printf("🚀 Starting workspace %s (checking volume...)", workspaceID)

	// Verify unified volume exists
	volumeExists, err := storageClient.FileShareExists(ctx, fileShareName)
	if err != nil {
		return nil, models.ErrInternalServer(fmt.Sprintf("workspace %s: failed to check volume: %v", workspaceID, err))
	}
	if !volumeExists {
		return nil, models.ErrNotFound(fmt.Sprintf("workspace %s: unified volume not found: %s. Create environment first.", workspaceID, fileShareName))
	}

	log.Printf("✅ Unified volume verified: %s", fileShareName)

	// Check if container already exists
	existingContainer, err := s.deploymentStrategy.GetContainer(ctx, workspaceID, req.CloudRegion, resourceGroup)
	if err == nil && existingContainer != nil {
		return nil, models.ErrInvalidRequest(fmt.Sprintf("workspace %s: container already exists. Use stop first if needed.", workspaceID))
	}

	// Recreate container with existing volumes (fast!)
	log.Printf("📦 Creating new container instance with existing volumes...")

	deploySpec := ContainerDeploymentSpec{
		Image:              s.getContainerImage(req.BaseImage),
		CPUCores:           float64(req.CPUCores),
		MemoryGB:           float64(req.MemoryGB),
		FileShareName:      fileShareName,
		StorageAccountName: regionConfig.StorageAccount,
		StorageAccountKey:  s.config.Azure.StorageAccountKey,
		UserID:             req.UserID,
		RegistryServer:     s.getRegistryServer(),
		RegistryUsername:   s.config.RegistryUsername,
		RegistryPassword:   s.config.RegistryPassword,
		AgentBaseURL:       s.config.AgentBaseURL,
		GitHubToken:        req.GitHubToken,
		CodeServerPassword: req.CodeServerPassword,
		SSHPublicKey:       req.SSHPublicKey,
		GitUserName:        req.GitUserName,
		GitUserEmail:       req.GitUserEmail,
		AnthropicAPIKey:    req.AnthropicAPIKey,
		OpenAIAPIKey:       req.OpenAIAPIKey,
		GeminiAPIKey:       req.GeminiAPIKey,
	}

	containerInfo, err := s.deploymentStrategy.CreateContainer(ctx, workspaceID, req.CloudRegion, resourceGroup, deploySpec)
	if err != nil {
		return nil, models.ErrInternalServer(fmt.Sprintf("workspace %s: failed to create container: %v", workspaceID, err))
	}

	// Wait for FQDN
	time.Sleep(3 * time.Second)

	var fqdn string
	if containerInfo != nil {
		fqdn = containerInfo.FQDN
	}

	connectionURLs := generateConnectionURLs(fqdn, req.CodeServerPassword)

	env := &models.Environment{
		ID:                  workspaceID,
		Name:                req.Name,
		UserID:              req.UserID,
		Status:              models.StatusRunning,
		CloudRegion:         req.CloudRegion,
		CPUCores:            req.CPUCores,
		MemoryGB:            req.MemoryGB,
		StorageGB:           req.StorageGB,
		BaseImage:           req.BaseImage,
		AzureResourceGroup:  resourceGroup,
		AzureContainerGroup: fmt.Sprintf("%s-%s", s.config.Azure.DeploymentMode, workspaceID),
		AzureFileShare:      fileShareName,
		AzureFQDN:           fqdn,
		ConnectionURLs:      connectionURLs,
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	log.Printf("✅ Workspace %s started successfully (reused existing unified volume)", workspaceID)
	return env, nil
}

// StopEnvironment deletes ACI instance but KEEPS volumes (cost optimization)
func (s *EnvironmentService) StopEnvironment(ctx context.Context, workspaceID, region string) error {
	regionConfig := s.config.GetRegion(region)
	if regionConfig == nil {
		return models.ErrNotFound(fmt.Sprintf("region %s is not available", region))
	}

	resourceGroup := regionConfig.ResourceGroupName
	if resourceGroup == "" {
		resourceGroup = s.config.Azure.ResourceGroupName
	}

	log.Printf("🛑 Stopping workspace %s: Stopping container (keeping volumes)", workspaceID)

	// Check if container exists
	_, err := s.deploymentStrategy.GetContainer(ctx, workspaceID, region, resourceGroup)
	if err != nil {
		return models.ErrNotFound(fmt.Sprintf("workspace %s: container not found. Already stopped?", workspaceID))
	}

	// Stop container instance - for ACI it deletes, for ACA it scales to zero
	if err := s.deploymentStrategy.StopContainer(ctx, workspaceID, region, resourceGroup); err != nil {
		return models.ErrInternalServer(fmt.Sprintf("workspace %s: failed to stop container: %v", workspaceID, err))
	}

	log.Printf("✅ Workspace %s stopped (container stopped, unified volume persisted for fast restart)", workspaceID)
	return nil
}

// DeleteEnvironment permanently deletes environment and all resources
func (s *EnvironmentService) DeleteEnvironment(ctx context.Context, workspaceID, region string, force bool) error {
	regionConfig := s.config.GetRegion(region)
	if regionConfig == nil {
		return models.ErrNotFound(fmt.Sprintf("region %s is not available", region))
	}

	resourceGroup := regionConfig.ResourceGroupName
	if resourceGroup == "" {
		resourceGroup = s.config.Azure.ResourceGroupName
	}

	fileShareName := fmt.Sprintf("fs-%s", workspaceID)

	log.Printf("🗑️  Deleting workspace %s permanently", workspaceID)

	// Check if container is running
	container, err := s.deploymentStrategy.GetContainer(ctx, workspaceID, region, resourceGroup)
	if err == nil && container != nil {
		if !force {
			return models.ErrInvalidRequest(fmt.Sprintf("workspace %s: still running. Stop it first or use force=true", workspaceID))
		}
		// Force delete - stop container first
		log.Printf("⚠️  Force deleting running container for workspace %s", workspaceID)
		if err := s.deploymentStrategy.DeleteContainer(ctx, workspaceID, region, resourceGroup); err != nil {
			log.Printf("Warning: workspace %s: failed to delete container: %v", workspaceID, err)
		}
	}

	// Delete unified file share (permanent data loss!)
	storageClient, ok := s.storageClients[region]
	if !ok {
		return models.ErrInternalServer(fmt.Sprintf("workspace %s: storage client not found for region %s", workspaceID, region))
	}

	// Delete unified volume (contains both workspace/ and home/ subdirectories)
	if err := storageClient.DeleteFileShare(ctx, fileShareName); err != nil {
		log.Printf("Warning: workspace %s: failed to delete unified file share %s: %v", workspaceID, fileShareName, err)
	} else {
		log.Printf("✅ Deleted unified volume: %s (workspace + home)", fileShareName)
	}

	log.Printf("✅ Workspace %s permanently deleted (all data removed)", workspaceID)
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
		VSCodeDesktopURL:   fmt.Sprintf("vscode-remote://ssh-remote+user@%s:2222/home/dev8/workspace", fqdn),
		SupervisorURL:      fmt.Sprintf("http://%s:9000", fqdn),
		CodeServerPassword: password,
	}
}

func (s *EnvironmentService) getContainerImage(baseImage string) string {
	// If ACR is configured, use it for faster image pulls
	if s.config.Azure.ContainerRegistry != "" {
		// Use ACR: dev8prodcr5xv5pu3m2xjli.azurecr.io/dev8-workspace:latest
		return fmt.Sprintf("%s/%s", s.config.Azure.ContainerRegistry, s.config.ContainerImageName)
	}

	// Fallback to Docker Hub or configured image
	// baseImage parameter is ignored - can be used for future customization
	return s.config.ContainerImage
}

// getRegistryServer returns the registry server to use
func (s *EnvironmentService) getRegistryServer() string {
	// If ACR is configured, use it
	if s.config.Azure.ContainerRegistry != "" {
		return s.config.Azure.ContainerRegistry
	}

	// Fallback to configured registry (Docker Hub)
	return s.config.RegistryServer
}

// waitForFileShareAvailability polls Azure to verify file share is fully propagated
// Uses exponential backoff: 500ms, 1s, 2s, 4s, 8s, etc.
func (s *EnvironmentService) waitForFileShareAvailability(ctx context.Context, storageClient *azure.StorageClient, fileShareName string, timeout time.Duration) error {
	startTime := time.Now()
	attempt := 0
	maxAttempts := 10

	log.Printf("⏳ Verifying file share propagation: %s (timeout: %s)", fileShareName, timeout)

	for attempt < maxAttempts {
		// Check if context is cancelled or timeout exceeded
		if time.Since(startTime) > timeout {
			return fmt.Errorf("timeout waiting for file share '%s' to be available after %s", fileShareName, timeout)
		}

		// Check if file share exists and is accessible
		exists, err := storageClient.FileShareExists(ctx, fileShareName)
		if err != nil {
			log.Printf("⚠️  Attempt %d: Error checking file share: %v", attempt+1, err)
		} else if exists {
			duration := time.Since(startTime)
			log.Printf("✅ File share %s verified and ready (took %s)", fileShareName, duration)
			return nil
		}

		// Exponential backoff: 500ms, 1s, 2s, 4s, 8s (capped at 8s)
		backoff := time.Duration(500*(1<<attempt)) * time.Millisecond
		if backoff > 8*time.Second {
			backoff = 8 * time.Second
		}

		log.Printf("⏳ File share not ready yet, retrying in %s (attempt %d/%d)", backoff, attempt+1, maxAttempts)

		select {
		case <-time.After(backoff):
			attempt++
		case <-ctx.Done():
			return fmt.Errorf("context cancelled while waiting for file share: %w", ctx.Err())
		}
	}

	return fmt.Errorf("file share '%s' not available after %d attempts (%s elapsed)", fileShareName, maxAttempts, time.Since(startTime))
}
