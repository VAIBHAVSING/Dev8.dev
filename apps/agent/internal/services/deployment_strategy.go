package services

import (
	"context"
	"fmt"
	"log"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/azure"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/config"
)

// DeploymentStrategy handles container deployment using either ACI or ACA
type DeploymentStrategy struct {
	config      *config.Config
	azureClient *azure.Client
}

// ContainerInfo contains the result of a container creation
type ContainerInfo struct {
	Name string
	FQDN string
	ID   string
}

// NewDeploymentStrategy creates a new deployment strategy
func NewDeploymentStrategy(cfg *config.Config, azureClient *azure.Client) *DeploymentStrategy {
	return &DeploymentStrategy{
		config:      cfg,
		azureClient: azureClient,
	}
}

// CreateContainer creates a container using the configured deployment mode (ACI or ACA)
func (d *DeploymentStrategy) CreateContainer(ctx context.Context, workspaceID, region, resourceGroup string, spec ContainerDeploymentSpec) (*ContainerInfo, error) {
	mode := d.config.Azure.DeploymentMode

	log.Printf("📦 Creating container using %s mode for workspace %s", mode, workspaceID)

	switch mode {
	case "aca":
		return d.createWithACA(ctx, workspaceID, region, resourceGroup, spec)
	case "aci":
		return d.createWithACI(ctx, workspaceID, region, resourceGroup, spec)
	default:
		return nil, fmt.Errorf("workspace %s: invalid deployment mode: %s (must be 'aci' or 'aca')", workspaceID, mode)
	}
}

// GetContainer gets container details using the configured deployment mode
func (d *DeploymentStrategy) GetContainer(ctx context.Context, workspaceID, region, resourceGroup string) (*ContainerInfo, error) {
	mode := d.config.Azure.DeploymentMode

	switch mode {
	case "aca":
		return d.getWithACA(ctx, workspaceID, resourceGroup)
	case "aci":
		return d.getWithACI(ctx, workspaceID, region, resourceGroup)
	default:
		return nil, fmt.Errorf("workspace %s: invalid deployment mode: %s", workspaceID, mode)
	}
}

// DeleteContainer deletes a container using the configured deployment mode
func (d *DeploymentStrategy) DeleteContainer(ctx context.Context, workspaceID, region, resourceGroup string) error {
	mode := d.config.Azure.DeploymentMode

	switch mode {
	case "aca":
		return d.deleteWithACA(ctx, workspaceID, resourceGroup)
	case "aci":
		return d.deleteWithACI(ctx, workspaceID, region, resourceGroup)
	default:
		return fmt.Errorf("workspace %s: invalid deployment mode: %s", workspaceID, mode)
	}
}

// StopContainer stops a container using the configured deployment mode
func (d *DeploymentStrategy) StopContainer(ctx context.Context, workspaceID, region, resourceGroup string) error {
	mode := d.config.Azure.DeploymentMode

	switch mode {
	case "aca":
		return d.stopWithACA(ctx, workspaceID, resourceGroup)
	case "aci":
		return d.stopWithACI(ctx, workspaceID, region, resourceGroup)
	default:
		return fmt.Errorf("workspace %s: invalid deployment mode: %s", workspaceID, mode)
	}
}

// ContainerDeploymentSpec contains the specification for deploying a container
type ContainerDeploymentSpec struct {
	Image              string
	CPUCores           float64
	MemoryGB           float64
	FileShareName      string
	StorageAccountName string
	StorageAccountKey  string
	UserID             string

	// Registry credentials
	RegistryServer   string
	RegistryUsername string
	RegistryPassword string

	// Environment variables
	AgentBaseURL       string
	GitHubToken        string
	CodeServerPassword string
	SSHPublicKey       string
	GitUserName        string
	GitUserEmail       string
	AnthropicAPIKey    string
	OpenAIAPIKey       string
	GeminiAPIKey       string
}

// createWithACI creates a container using Azure Container Instances
func (d *DeploymentStrategy) createWithACI(ctx context.Context, workspaceID, region, resourceGroup string, spec ContainerDeploymentSpec) (*ContainerInfo, error) {
	containerGroupName := fmt.Sprintf("aci-%s", workspaceID)
	dnsLabel := fmt.Sprintf("ws-%s", workspaceID)

	aciSpec := azure.ContainerGroupSpec{
		ContainerName:      "vscode-server",
		Image:              spec.Image,
		CPUCores:           int(spec.CPUCores),
		MemoryGB:           int(spec.MemoryGB),
		DNSNameLabel:       dnsLabel,
		FileShareName:      spec.FileShareName,
		StorageAccountName: spec.StorageAccountName,
		StorageAccountKey:  spec.StorageAccountKey,
		EnvironmentID:      workspaceID,
		UserID:             spec.UserID,
		RegistryServer:     spec.RegistryServer,
		RegistryUsername:   spec.RegistryUsername,
		RegistryPassword:   spec.RegistryPassword,
		AgentBaseURL:       spec.AgentBaseURL,
		GitHubToken:        spec.GitHubToken,
		CodeServerPassword: spec.CodeServerPassword,
		SSHPublicKey:       spec.SSHPublicKey,
		GitUserName:        spec.GitUserName,
		GitUserEmail:       spec.GitUserEmail,
		AnthropicAPIKey:    spec.AnthropicAPIKey,
		OpenAIAPIKey:       spec.OpenAIAPIKey,
		GeminiAPIKey:       spec.GeminiAPIKey,
	}

	if err := d.azureClient.CreateContainerGroup(ctx, region, resourceGroup, containerGroupName, aciSpec); err != nil {
		return nil, err
	}

	// Get details
	containerDetails, err := d.azureClient.GetContainerGroup(ctx, region, resourceGroup, containerGroupName)
	if err != nil {
		log.Printf("Warning: workspace %s: failed to get container details: %v", workspaceID, err)
		return &ContainerInfo{Name: containerGroupName}, nil
	}

	// Extract FQDN
	var fqdn string
	if containerDetails != nil &&
		containerDetails.Properties != nil &&
		containerDetails.Properties.IPAddress != nil &&
		containerDetails.Properties.IPAddress.Fqdn != nil {
		fqdn = *containerDetails.Properties.IPAddress.Fqdn
	}

	return &ContainerInfo{
		Name: containerGroupName,
		FQDN: fqdn,
		ID:   containerGroupName,
	}, nil
}

// createWithACA creates a container using Azure Container Apps
func (d *DeploymentStrategy) createWithACA(ctx context.Context, workspaceID, region, resourceGroup string, spec ContainerDeploymentSpec) (*ContainerInfo, error) {
	containerAppName := fmt.Sprintf("aca-%s", workspaceID)

	// Get ACA environment ID
	acaEnvironmentID := d.config.Azure.ContainerAppsEnvironmentID
	if acaEnvironmentID == "" {
		return nil, fmt.Errorf("workspace %s: ACA environment ID not configured", workspaceID)
	}

	acaSpec := azure.ContainerAppSpec{
		WorkspaceID:        workspaceID,
		UserID:             spec.UserID,
		Name:               containerAppName,
		Image:              spec.Image,
		CPUCores:           spec.CPUCores,
		MemoryGB:           spec.MemoryGB,
		FileShareName:      spec.FileShareName,
		StorageAccountName: spec.StorageAccountName,
		GitHubToken:        spec.GitHubToken,
		CodeServerPassword: spec.CodeServerPassword,
		SSHPublicKey:       spec.SSHPublicKey,
		GitUserName:        spec.GitUserName,
		GitUserEmail:       spec.GitUserEmail,
		AnthropicAPIKey:    spec.AnthropicAPIKey,
		OpenAIAPIKey:       spec.OpenAIAPIKey,
		GeminiAPIKey:       spec.GeminiAPIKey,
		AgentBaseURL:       spec.AgentBaseURL,
	}

	resp, err := d.azureClient.CreateContainerApp(ctx, region, resourceGroup, acaEnvironmentID, acaSpec)
	if err != nil {
		return nil, err
	}

	return &ContainerInfo{
		Name: containerAppName,
		FQDN: resp.FQDN,
		ID:   resp.ID,
	}, nil
}

// getWithACI gets container details using ACI
func (d *DeploymentStrategy) getWithACI(ctx context.Context, workspaceID, region, resourceGroup string) (*ContainerInfo, error) {
	containerGroupName := fmt.Sprintf("aci-%s", workspaceID)

	containerDetails, err := d.azureClient.GetContainerGroup(ctx, region, resourceGroup, containerGroupName)
	if err != nil {
		return nil, err
	}

	var fqdn string
	if containerDetails != nil &&
		containerDetails.Properties != nil &&
		containerDetails.Properties.IPAddress != nil &&
		containerDetails.Properties.IPAddress.Fqdn != nil {
		fqdn = *containerDetails.Properties.IPAddress.Fqdn
	}

	return &ContainerInfo{
		Name: containerGroupName,
		FQDN: fqdn,
		ID:   containerGroupName,
	}, nil
}

// getWithACA gets container details using ACA
func (d *DeploymentStrategy) getWithACA(ctx context.Context, workspaceID, resourceGroup string) (*ContainerInfo, error) {
	containerAppName := fmt.Sprintf("aca-%s", workspaceID)

	containerApp, err := d.azureClient.GetContainerApp(ctx, resourceGroup, containerAppName)
	if err != nil {
		return nil, err
	}

	var fqdn string
	if containerApp != nil &&
		containerApp.Properties != nil &&
		containerApp.Properties.Configuration != nil &&
		containerApp.Properties.Configuration.Ingress != nil &&
		containerApp.Properties.Configuration.Ingress.Fqdn != nil {
		fqdn = *containerApp.Properties.Configuration.Ingress.Fqdn
	}

	return &ContainerInfo{
		Name: containerAppName,
		FQDN: fqdn,
		ID:   containerAppName,
	}, nil
}

// deleteWithACI deletes a container using ACI
func (d *DeploymentStrategy) deleteWithACI(ctx context.Context, workspaceID, region, resourceGroup string) error {
	containerGroupName := fmt.Sprintf("aci-%s", workspaceID)
	return d.azureClient.DeleteContainerGroup(ctx, region, resourceGroup, containerGroupName)
}

// deleteWithACA deletes a container using ACA
func (d *DeploymentStrategy) deleteWithACA(ctx context.Context, workspaceID, resourceGroup string) error {
	containerAppName := fmt.Sprintf("aca-%s", workspaceID)
	return d.azureClient.DeleteContainerApp(ctx, resourceGroup, containerAppName)
}

// stopWithACI stops a container using ACI (deletes it)
func (d *DeploymentStrategy) stopWithACI(ctx context.Context, workspaceID, region, resourceGroup string) error {
	containerGroupName := fmt.Sprintf("aci-%s", workspaceID)
	return d.azureClient.DeleteContainerGroup(ctx, region, resourceGroup, containerGroupName)
}

// stopWithACA stops a container using ACA (scales to zero)
func (d *DeploymentStrategy) stopWithACA(ctx context.Context, workspaceID, resourceGroup string) error {
	containerAppName := fmt.Sprintf("aca-%s", workspaceID)
	return d.azureClient.StopContainerApp(ctx, resourceGroup, containerAppName)
}
