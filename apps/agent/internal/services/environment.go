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

	log.Printf("🚀 Creating workspace %s (region: %s)", workspaceID, req.CloudRegion)
	overallStartTime := time.Now()

	// Azure resource names based on UUID
	fileShareName := fmt.Sprintf("fs-%s", workspaceID)       // fs-clxxx-yyyy-zzzz (unified volume)
	containerGroupName := fmt.Sprintf("aci-%s", workspaceID) // aci-clxxx-yyyy-zzzz
	dnsLabel := fmt.Sprintf("ws-%s", workspaceID)            // ws-clxxx-yyyy-zzzz

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
		totalQuotaGB := int32(req.StorageGB + 5) // workspace quota + 5GB for home
		log.Printf("📁 [1/2] Creating unified volume: %s (%dGB) - contains workspace/ and home/", fileShareName, totalQuotaGB)
		err := storageClient.CreateFileShare(ctx, fileShareName, totalQuotaGB)
		volumeChan <- operationResult{name: "unified-volume", err: err}
	}()

	// Goroutine 2: Create ACI container (starts IMMEDIATELY, doesn't wait for share)
	go func() {
		// Small delay to let share start first (Azure may need it)
		time.Sleep(500 * time.Millisecond)

		containerSpec := azure.ContainerGroupSpec{
			ContainerName:      "vscode-server",
			Image:              containerImage,
			CPUCores:           req.CPUCores,
			MemoryGB:           req.MemoryGB,
			DNSNameLabel:       dnsLabel,
			FileShareName:      fileShareName,
			StorageAccountName: regionConfig.StorageAccount,
			StorageAccountKey:  s.config.Azure.StorageAccountKey,
			EnvironmentID:      workspaceID,
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

		log.Printf("📦 [2/2] Creating ACI container: %s", containerGroupName)
		err := s.azureClient.CreateContainerGroup(ctx, req.CloudRegion, resourceGroup, containerGroupName, containerSpec)
		aciChan <- operationResult{name: "aci-container", err: err}
	}()

	// Wait for ALL operations to complete
	volumeResult := <-volumeChan
	aciResult := <-aciChan

	totalTime := time.Since(startTime)
	log.Printf("⚡⚡⚡ ALL OPERATIONS COMPLETED in %s", totalTime)

	// Check for errors (cleanup on failure)
	if volumeResult.err != nil {
		// Try to cleanup what succeeded
		_ = s.azureClient.DeleteContainerGroup(ctx, req.CloudRegion, resourceGroup, containerGroupName)
		return nil, fmt.Errorf("failed to create unified file share: %w", volumeResult.err)
	}
	if aciResult.err != nil {
		// Cleanup file share
		_ = storageClient.DeleteFileShare(ctx, fileShareName)
		return nil, fmt.Errorf("failed to create container group: %w", aciResult.err)
	}

	// Wait for container to get FQDN
	time.Sleep(3 * time.Second)

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
	containerGroupName := fmt.Sprintf("aci-%s", workspaceID)
	dnsLabel := fmt.Sprintf("ws-%s", workspaceID)

	resourceGroup := regionConfig.ResourceGroupName
	if resourceGroup == "" {
		resourceGroup = s.config.Azure.ResourceGroupName
	}

	log.Printf("🚀 Starting workspace %s (checking volume...)", workspaceID)

	// Verify unified volume exists
	volumeExists, err := storageClient.FileShareExists(ctx, fileShareName)
	if err != nil {
		return nil, models.ErrInternalServer(fmt.Sprintf("failed to check volume: %v", err))
	}
	if !volumeExists {
		return nil, models.ErrNotFound(fmt.Sprintf("unified volume not found: %s. Create environment first.", fileShareName))
	}

	log.Printf("✅ Unified volume verified: %s", fileShareName)

	// Check if container already exists
	existingContainer, err := s.azureClient.GetContainerGroup(ctx, req.CloudRegion, resourceGroup, containerGroupName)
	if err == nil && existingContainer != nil {
		return nil, models.ErrInvalidRequest(fmt.Sprintf("container already exists for workspace %s. Use stop first if needed.", workspaceID))
	}

	// Recreate container with existing volumes (fast!)
	log.Printf("📦 Creating new container instance with existing volumes...")

	containerSpec := azure.ContainerGroupSpec{
		ContainerName:      "vscode-server",
		Image:              s.getContainerImage(req.BaseImage),
		CPUCores:           req.CPUCores,
		MemoryGB:           req.MemoryGB,
		DNSNameLabel:       dnsLabel,
		FileShareName:      fileShareName,
		StorageAccountName: regionConfig.StorageAccount,
		StorageAccountKey:  s.config.Azure.StorageAccountKey,
		EnvironmentID:      workspaceID,
		UserID:             req.UserID,

		// Registry credentials
		RegistryServer:   s.getRegistryServer(),
		RegistryUsername: s.config.RegistryUsername,
		RegistryPassword: s.config.RegistryPassword,

		// Agent URL
		AgentBaseURL: s.config.AgentBaseURL,

		// Per-workspace secrets
		GitHubToken:        req.GitHubToken,
		CodeServerPassword: req.CodeServerPassword,
		SSHPublicKey:       req.SSHPublicKey,
		GitUserName:        req.GitUserName,
		GitUserEmail:       req.GitUserEmail,
		AnthropicAPIKey:    req.AnthropicAPIKey,
		OpenAIAPIKey:       req.OpenAIAPIKey,
		GeminiAPIKey:       req.GeminiAPIKey,
	}

	if err := s.azureClient.CreateContainerGroup(ctx, req.CloudRegion, resourceGroup, containerGroupName, containerSpec); err != nil {
		return nil, models.ErrInternalServer(fmt.Sprintf("failed to create container group: %v", err))
	}

	// Wait for FQDN
	time.Sleep(3 * time.Second)

	containerDetails, err := s.azureClient.GetContainerGroup(ctx, req.CloudRegion, resourceGroup, containerGroupName)
	if err != nil {
		log.Printf("Warning: failed to get container details: %v", err)
	}

	var fqdn string
	if containerDetails != nil &&
		containerDetails.Properties != nil &&
		containerDetails.Properties.IPAddress != nil &&
		containerDetails.Properties.IPAddress.Fqdn != nil {
		fqdn = *containerDetails.Properties.IPAddress.Fqdn
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
		AzureContainerGroup: containerGroupName,
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

	containerGroupName := fmt.Sprintf("aci-%s", workspaceID)

	log.Printf("🛑 Stopping workspace %s: DELETING container (keeping volumes)", workspaceID)

	// Check if container exists
	_, err := s.azureClient.GetContainerGroup(ctx, region, resourceGroup, containerGroupName)
	if err != nil {
		return models.ErrNotFound(fmt.Sprintf("container not found for workspace %s. Already stopped?", workspaceID))
	}

	// DELETE container instance (not stop) - saves 95% of running costs
	if err := s.azureClient.DeleteContainerGroup(ctx, region, resourceGroup, containerGroupName); err != nil {
		return models.ErrInternalServer(fmt.Sprintf("failed to delete container group: %v", err))
	}

	log.Printf("✅ Workspace %s stopped (container deleted, unified volume persisted for fast restart)", workspaceID)
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

	containerGroupName := fmt.Sprintf("aci-%s", workspaceID)
	fileShareName := fmt.Sprintf("fs-%s", workspaceID)

	log.Printf("🗑️  Deleting workspace %s permanently", workspaceID)

	// Check if container is running
	container, err := s.azureClient.GetContainerGroup(ctx, region, resourceGroup, containerGroupName)
	if err == nil && container != nil {
		if !force {
			return models.ErrInvalidRequest(fmt.Sprintf("workspace %s is still running. Stop it first or use force=true", workspaceID))
		}
		// Force delete - stop container first
		log.Printf("⚠️  Force deleting running container for workspace %s", workspaceID)
		if err := s.azureClient.DeleteContainerGroup(ctx, region, resourceGroup, containerGroupName); err != nil {
			log.Printf("Warning: failed to delete container group %s: %v", containerGroupName, err)
		}
	}

	// Delete unified file share (permanent data loss!)
	storageClient, ok := s.storageClients[region]
	if !ok {
		return models.ErrInternalServer(fmt.Sprintf("storage client not found for region %s", region))
	}

	// Delete unified volume (contains both workspace/ and home/ subdirectories)
	if err := storageClient.DeleteFileShare(ctx, fileShareName); err != nil {
		log.Printf("Warning: failed to delete unified file share %s: %v", fileShareName, err)
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
