package azure

import (
	"context"
	"fmt"
	"strings"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore/to"
	armappcontainers "github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/appcontainers/armappcontainers/v2"
	armstorage "github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/storage/armstorage"
)

// ContainerAppSpec defines the specification for creating a container app
type ContainerAppSpec struct {
	WorkspaceID        string
	UserID             string
	Name               string
	Image              string
	CPUCores           float64
	MemoryGB           float64
	FileShareName      string
	StorageAccountName string

	// Optional secrets
	GitHubToken        string
	CodeServerPassword string
	SSHPublicKey       string
	GitUserName        string
	GitUserEmail       string
	AnthropicAPIKey    string
	OpenAIAPIKey       string
	GeminiAPIKey       string

	// Agent configuration
	AgentBaseURL string
}

// ContainerAppResponse contains the created container app details
type ContainerAppResponse struct {
	ID                 string
	Name               string
	FQDN               string
	URL                string
	LatestRevisionName string
}

// CreateContainerApp creates an Azure Container App for a workspace
func (c *Client) CreateContainerApp(ctx context.Context, region, resourceGroup, environmentID string, spec ContainerAppSpec) (*ContainerAppResponse, error) {
	// Initialize Container Apps client
	client, err := armappcontainers.NewContainerAppsClient(c.config.Azure.SubscriptionID, c.credential, nil)
	if err != nil {
		return nil, fmt.Errorf("workspace %s: failed to create container apps client: %w", spec.WorkspaceID, err)
	}

	// Register storage with ACA environment FIRST (if file share is specified)
	if spec.FileShareName != "" && spec.StorageAccountName != "" {
		err = c.RegisterStorageWithEnvironment(ctx, resourceGroup, environmentID, spec.FileShareName, spec.StorageAccountName)
		if err != nil {
			return nil, fmt.Errorf("workspace %s: failed to register storage with ACA environment: %w", spec.WorkspaceID, err)
		}
	}

	// Container App name (same naming convention as ACI)
	appName := fmt.Sprintf("aca-%s", spec.WorkspaceID)

	// Build secrets
	var secrets []*armappcontainers.Secret
	var envVars []*armappcontainers.EnvironmentVar

	// Always-present environment variables
	envVars = append(envVars,
		&armappcontainers.EnvironmentVar{Name: to.Ptr("WORKSPACE_ID"), Value: to.Ptr(spec.WorkspaceID)},
		&armappcontainers.EnvironmentVar{Name: to.Ptr("USER_ID"), Value: to.Ptr(spec.UserID)},
		&armappcontainers.EnvironmentVar{Name: to.Ptr("WORKSPACE_DIR"), Value: to.Ptr("/home/dev8/workspace")},
		&armappcontainers.EnvironmentVar{Name: to.Ptr("AGENT_ENABLED"), Value: to.Ptr("true")},
		&armappcontainers.EnvironmentVar{Name: to.Ptr("MONITOR_INTERVAL"), Value: to.Ptr("30s")},
	)

	if spec.AgentBaseURL != "" {
		envVars = append(envVars, &armappcontainers.EnvironmentVar{
			Name:  to.Ptr("AGENT_BASE_URL"),
			Value: to.Ptr(spec.AgentBaseURL),
		})
	}

	// Optional secrets and environment variables
	if spec.GitHubToken != "" {
		secrets = append(secrets, &armappcontainers.Secret{
			Name:  to.Ptr("github-token"),
			Value: to.Ptr(spec.GitHubToken),
		})
		envVars = append(envVars, &armappcontainers.EnvironmentVar{
			Name:      to.Ptr("GITHUB_TOKEN"),
			SecretRef: to.Ptr("github-token"),
		})
	}

	if spec.CodeServerPassword != "" {
		secrets = append(secrets, &armappcontainers.Secret{
			Name:  to.Ptr("code-server-password"),
			Value: to.Ptr(spec.CodeServerPassword),
		})
		envVars = append(envVars, &armappcontainers.EnvironmentVar{
			Name:      to.Ptr("CODE_SERVER_PASSWORD"),
			SecretRef: to.Ptr("code-server-password"),
		})
	}

	if spec.SSHPublicKey != "" {
		envVars = append(envVars, &armappcontainers.EnvironmentVar{
			Name:  to.Ptr("SSH_PUBLIC_KEY"),
			Value: to.Ptr(spec.SSHPublicKey),
		})
	}

	if spec.GitUserName != "" {
		envVars = append(envVars, &armappcontainers.EnvironmentVar{
			Name:  to.Ptr("GIT_USER_NAME"),
			Value: to.Ptr(spec.GitUserName),
		})
	}

	if spec.GitUserEmail != "" {
		envVars = append(envVars, &armappcontainers.EnvironmentVar{
			Name:  to.Ptr("GIT_USER_EMAIL"),
			Value: to.Ptr(spec.GitUserEmail),
		})
	}

	if spec.AnthropicAPIKey != "" {
		secrets = append(secrets, &armappcontainers.Secret{
			Name:  to.Ptr("anthropic-api-key"),
			Value: to.Ptr(spec.AnthropicAPIKey),
		})
		envVars = append(envVars, &armappcontainers.EnvironmentVar{
			Name:      to.Ptr("ANTHROPIC_API_KEY"),
			SecretRef: to.Ptr("anthropic-api-key"),
		})
	}

	if spec.OpenAIAPIKey != "" {
		secrets = append(secrets, &armappcontainers.Secret{
			Name:  to.Ptr("openai-api-key"),
			Value: to.Ptr(spec.OpenAIAPIKey),
		})
		envVars = append(envVars, &armappcontainers.EnvironmentVar{
			Name:      to.Ptr("OPENAI_API_KEY"),
			SecretRef: to.Ptr("openai-api-key"),
		})
	}

	if spec.GeminiAPIKey != "" {
		secrets = append(secrets, &armappcontainers.Secret{
			Name:  to.Ptr("gemini-api-key"),
			Value: to.Ptr(spec.GeminiAPIKey),
		})
		envVars = append(envVars, &armappcontainers.EnvironmentVar{
			Name:      to.Ptr("GEMINI_API_KEY"),
			SecretRef: to.Ptr("gemini-api-key"),
		})
	}

	// Volume mounts (Azure Files)
	var volumeMounts []*armappcontainers.VolumeMount
	var volumes []*armappcontainers.Volume

	if spec.FileShareName != "" {
		volumeMounts = append(volumeMounts, &armappcontainers.VolumeMount{
			VolumeName: to.Ptr("workspace-data"),
			MountPath:  to.Ptr("/home/dev8"),
		})

		volumes = append(volumes, &armappcontainers.Volume{
			Name:        to.Ptr("workspace-data"),
			StorageName: to.Ptr(spec.FileShareName),
			StorageType: to.Ptr(armappcontainers.StorageTypeAzureFile),
		})
	}

	// Memory size in Gi format
	memorySize := fmt.Sprintf("%.1fGi", spec.MemoryGB)

	// Create Container App
	containerApp := armappcontainers.ContainerApp{
		Location: to.Ptr(region),
		Tags: map[string]*string{
			"workspace-id": to.Ptr(spec.WorkspaceID),
			"user-id":      to.Ptr(spec.UserID),
			"managed-by":   to.Ptr("dev8-agent"),
			"environment":  to.Ptr("production"),
		},
		Properties: &armappcontainers.ContainerAppProperties{
			EnvironmentID: to.Ptr(environmentID),
			Configuration: &armappcontainers.Configuration{
				ActiveRevisionsMode: to.Ptr(armappcontainers.ActiveRevisionsModeSingle),
				Ingress: &armappcontainers.Ingress{
					External:      to.Ptr(true),
					TargetPort:    to.Ptr(int32(8080)),
					Transport:     to.Ptr(armappcontainers.IngressTransportMethodHTTP),
					AllowInsecure: to.Ptr(false),
					Traffic: []*armappcontainers.TrafficWeight{
						{
							LatestRevision: to.Ptr(true),
							Weight:         to.Ptr(int32(100)),
						},
					},
				},
				Secrets: secrets,
			},
			Template: &armappcontainers.Template{
				Containers: []*armappcontainers.Container{
					{
						Name:  to.Ptr("workspace"),
						Image: to.Ptr(spec.Image),
						Resources: &armappcontainers.ContainerResources{
							CPU:    to.Ptr(spec.CPUCores),
							Memory: to.Ptr(memorySize),
						},
						Env:          envVars,
						VolumeMounts: volumeMounts,
					},
				},
				Scale: &armappcontainers.Scale{
					MinReplicas: to.Ptr(int32(0)), // Scale to zero for cost savings
					MaxReplicas: to.Ptr(int32(1)), // Single instance per workspace
					Rules: []*armappcontainers.ScaleRule{
						{
							Name: to.Ptr("http-scaling"),
							HTTP: &armappcontainers.HTTPScaleRule{
								Metadata: map[string]*string{
									"concurrentRequests": to.Ptr("10"),
								},
							},
						},
					},
				},
				Volumes: volumes,
			},
		},
	}

	// Start creation
	poller, err := client.BeginCreateOrUpdate(ctx, resourceGroup, appName, containerApp, nil)
	if err != nil {
		return nil, fmt.Errorf("workspace %s: failed to begin container app creation: %w", spec.WorkspaceID, err)
	}

	// Wait for completion (typically 30-60 seconds)
	resp, err := poller.PollUntilDone(ctx, nil)
	if err != nil {
		return nil, fmt.Errorf("workspace %s: failed to create container app: %w", spec.WorkspaceID, err)
	}

	// Extract FQDN
	fqdn := ""
	latestRevision := ""
	if resp.Properties != nil {
		if resp.Properties.Configuration != nil && resp.Properties.Configuration.Ingress != nil && resp.Properties.Configuration.Ingress.Fqdn != nil {
			fqdn = *resp.Properties.Configuration.Ingress.Fqdn
		}
		if resp.Properties.LatestRevisionName != nil {
			latestRevision = *resp.Properties.LatestRevisionName
		}
	}

	return &ContainerAppResponse{
		ID:                 *resp.ID,
		Name:               *resp.Name,
		FQDN:               fqdn,
		URL:                fmt.Sprintf("https://%s", fqdn),
		LatestRevisionName: latestRevision,
	}, nil
}

// GetContainerApp retrieves a container app
func (c *Client) GetContainerApp(ctx context.Context, resourceGroup, appName string) (*armappcontainers.ContainerApp, error) {
	client, err := armappcontainers.NewContainerAppsClient(c.config.Azure.SubscriptionID, c.credential, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create container apps client: %w", err)
	}

	resp, err := client.Get(ctx, resourceGroup, appName, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get container app %s: %w", appName, err)
	}

	return &resp.ContainerApp, nil
}

// DeleteContainerApp deletes a container app
func (c *Client) DeleteContainerApp(ctx context.Context, resourceGroup, appName string) error {
	client, err := armappcontainers.NewContainerAppsClient(c.config.Azure.SubscriptionID, c.credential, nil)
	if err != nil {
		return fmt.Errorf("failed to create container apps client: %w", err)
	}

	poller, err := client.BeginDelete(ctx, resourceGroup, appName, nil)
	if err != nil {
		return fmt.Errorf("failed to begin container app deletion for %s: %w", appName, err)
	}

	// Wait for deletion (typically 10-30 seconds)
	_, err = poller.PollUntilDone(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to delete container app %s: %w", appName, err)
	}

	return nil
}

// StopContainerApp stops a container app using the native Azure API
// This immediately stops the container app (not scale-to-zero)
func (c *Client) StopContainerApp(ctx context.Context, resourceGroup, appName string) error {
	client, err := armappcontainers.NewContainerAppsClient(c.config.Azure.SubscriptionID, c.credential, nil)
	if err != nil {
		return fmt.Errorf("failed to create container apps client: %w", err)
	}

	// Use the native Stop API - this is an async operation
	poller, err := client.BeginStop(ctx, resourceGroup, appName, nil)
	if err != nil {
		return fmt.Errorf("failed to begin stop for container app %s: %w", appName, err)
	}

	// Wait for the stop operation to complete
	_, err = poller.PollUntilDone(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to stop container app %s: %w", appName, err)
	}

	return nil
}

// StartContainerApp starts a container app using the native Azure API
// This immediately starts the stopped container app
func (c *Client) StartContainerApp(ctx context.Context, resourceGroup, appName string) error {
	client, err := armappcontainers.NewContainerAppsClient(c.config.Azure.SubscriptionID, c.credential, nil)
	if err != nil {
		return fmt.Errorf("failed to create container apps client: %w", err)
	}

	// Use the native Start API - this is an async operation
	poller, err := client.BeginStart(ctx, resourceGroup, appName, nil)
	if err != nil {
		return fmt.Errorf("failed to begin start for container app %s: %w", appName, err)
	}

	// Wait for the start operation to complete
	_, err = poller.PollUntilDone(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to start container app %s: %w", appName, err)
	}

	return nil
}

// RegisterStorageWithEnvironment registers an Azure File Share with an ACA managed environment
// This MUST be called before creating container apps that reference the storage
func (c *Client) RegisterStorageWithEnvironment(ctx context.Context, resourceGroup, environmentID, fileShareName, storageAccountName string) error {
	// Parse environment name from ID
	// environmentID format: /subscriptions/{sub}/resourceGroups/{rg}/providers/Microsoft.App/managedEnvironments/{name}
	envName := environmentID
	if strings.Contains(environmentID, "/") {
		parts := strings.Split(environmentID, "/")
		envName = parts[len(parts)-1]
	}

	// Initialize Managed Environments Storages client (dedicated client for storage operations)
	storageClient, err := armappcontainers.NewManagedEnvironmentsStoragesClient(c.config.Azure.SubscriptionID, c.credential, nil)
	if err != nil {
		return fmt.Errorf("failed to create managed environments storages client: %w", err)
	}

	// Get storage account key
	storageKey, err := c.GetStorageAccountKey(ctx, resourceGroup, storageAccountName)
	if err != nil {
		return fmt.Errorf("file share %s: failed to get storage account key: %w", fileShareName, err)
	}

	// Storage configuration for the environment
	// The storageName (fileShareName) will be referenced by container apps
	storageConfig := armappcontainers.ManagedEnvironmentStorage{
		Properties: &armappcontainers.ManagedEnvironmentStorageProperties{
			AzureFile: &armappcontainers.AzureFileProperties{
				AccountName: to.Ptr(storageAccountName),
				AccountKey:  to.Ptr(storageKey),
				ShareName:   to.Ptr(fileShareName),
				AccessMode:  to.Ptr(armappcontainers.AccessModeReadWrite),
			},
		},
	}

	// Register storage with environment
	// The storageName parameter (fileShareName) is what container apps will reference in volumes
	_, err = storageClient.CreateOrUpdate(ctx, resourceGroup, envName, fileShareName, storageConfig, nil)
	if err != nil {
		return fmt.Errorf("file share %s: failed to register storage with environment: %w", fileShareName, err)
	}

	return nil
}

// GetStorageAccountKey retrieves the primary key for a storage account
func (c *Client) GetStorageAccountKey(ctx context.Context, resourceGroup, storageAccountName string) (string, error) {
	storageClient, err := armstorage.NewAccountsClient(c.config.Azure.SubscriptionID, c.credential, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create storage client: %w", err)
	}

	keys, err := storageClient.ListKeys(ctx, resourceGroup, storageAccountName, nil)
	if err != nil {
		return "", fmt.Errorf("failed to list storage keys: %w", err)
	}

	if len(keys.Keys) == 0 {
		return "", fmt.Errorf("no keys found for storage account %s", storageAccountName)
	}

	return *keys.Keys[0].Value, nil
}
