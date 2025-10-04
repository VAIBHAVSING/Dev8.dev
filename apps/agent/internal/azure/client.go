package azure

import (
	"context"
	"fmt"

	"github.com/Azure/azure-sdk-for-go/sdk/azcore"
	"github.com/Azure/azure-sdk-for-go/sdk/azcore/to"
	"github.com/Azure/azure-sdk-for-go/sdk/azidentity"
	"github.com/Azure/azure-sdk-for-go/sdk/resourcemanager/containerinstance/armcontainerinstance/v2"
	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/config"
)

// Client provides Azure service operations
type Client struct {
	config     *config.Config
	credential azcore.TokenCredential
	aciClients map[string]*armcontainerinstance.ContainerGroupsClient
}

// NewClient creates a new Azure client
func NewClient(cfg *config.Config) (*Client, error) {
	// Create Azure credential using DefaultAzureCredential
	// This supports multiple authentication methods:
	// 1. Environment variables (AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET)
	// 2. Managed Identity (when running in Azure)
	// 3. Azure CLI (for local development)
	cred, err := azidentity.NewDefaultAzureCredential(nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create Azure credential: %w", err)
	}

	client := &Client{
		config:     cfg,
		credential: cred,
		aciClients: make(map[string]*armcontainerinstance.ContainerGroupsClient),
	}

	// Initialize ACI clients for all enabled regions
	for _, region := range cfg.Azure.Regions {
		if region.Enabled {
			if err := client.initACIClient(region.Name); err != nil {
				return nil, fmt.Errorf("failed to initialize ACI client for region %s: %w", region.Name, err)
			}
		}
	}

	return client, nil
}

// initACIClient initializes ACI client for a specific region
func (c *Client) initACIClient(region string) error {
	if _, exists := c.aciClients[region]; exists {
		return nil // Already initialized
	}

	client, err := armcontainerinstance.NewContainerGroupsClient(
		c.config.Azure.SubscriptionID,
		c.credential,
		nil,
	)
	if err != nil {
		return fmt.Errorf("failed to create ACI client: %w", err)
	}

	c.aciClients[region] = client
	return nil
}

// GetACIClient returns the ACI client for the specified region
func (c *Client) GetACIClient(region string) (*armcontainerinstance.ContainerGroupsClient, error) {
	client, exists := c.aciClients[region]
	if !exists {
		return nil, fmt.Errorf("ACI client not found for region: %s", region)
	}
	return client, nil
}

// CreateContainerGroup creates an ACI container group
func (c *Client) CreateContainerGroup(ctx context.Context, region, resourceGroup, name string, spec ContainerGroupSpec) error {
	client, err := c.GetACIClient(region)
	if err != nil {
		return err
	}

	// Build volumes if file share is specified
	var volumes []*armcontainerinstance.Volume
	var volumeMounts []*armcontainerinstance.VolumeMount

	if spec.FileShareName != "" && spec.StorageAccountName != "" && spec.StorageAccountKey != "" {
		volumes = []*armcontainerinstance.Volume{
			{
				Name: to.Ptr("workspace"),
				AzureFile: &armcontainerinstance.AzureFileVolume{
					ShareName:          to.Ptr(spec.FileShareName),
					StorageAccountName: to.Ptr(spec.StorageAccountName),
					StorageAccountKey:  to.Ptr(spec.StorageAccountKey),
				},
			},
		}
		volumeMounts = []*armcontainerinstance.VolumeMount{
			{
				Name:      to.Ptr("workspace"),
				MountPath: to.Ptr("/workspace"),
			},
		}
	}

	// Build container group configuration
	containerGroup := armcontainerinstance.ContainerGroup{
		Location: to.Ptr(region),
		Properties: &armcontainerinstance.ContainerGroupPropertiesProperties{
			OSType: to.Ptr(armcontainerinstance.OperatingSystemTypesLinux),
			Containers: []*armcontainerinstance.Container{
				{
					Name: to.Ptr(spec.ContainerName),
					Properties: &armcontainerinstance.ContainerProperties{
						Image: to.Ptr(spec.Image),
						Resources: &armcontainerinstance.ResourceRequirements{
							Requests: &armcontainerinstance.ResourceRequests{
								CPU:        to.Ptr(float64(spec.CPUCores)),
								MemoryInGB: to.Ptr(float64(spec.MemoryGB)),
							},
						},
						Ports: []*armcontainerinstance.ContainerPort{
							{Port: to.Ptr(int32(8080)), Protocol: to.Ptr(armcontainerinstance.ContainerNetworkProtocolTCP)},
						},
						VolumeMounts: volumeMounts,
					},
				},
			},
			IPAddress: &armcontainerinstance.IPAddress{
				Type: to.Ptr(armcontainerinstance.ContainerGroupIPAddressTypePublic),
				Ports: []*armcontainerinstance.Port{
					{Port: to.Ptr(int32(8080)), Protocol: to.Ptr(armcontainerinstance.ContainerGroupNetworkProtocolTCP)},
				},
				DNSNameLabel: to.Ptr(spec.DNSNameLabel),
			},
			RestartPolicy: to.Ptr(armcontainerinstance.ContainerGroupRestartPolicyOnFailure),
			Volumes:       volumes,
		},
		Tags: map[string]*string{
			"environment": to.Ptr(spec.EnvironmentID),
			"userId":      to.Ptr(spec.UserID),
			"managed-by":  to.Ptr("dev8-agent"),
		},
	}

	// Start the container group creation
	poller, err := client.BeginCreateOrUpdate(ctx, resourceGroup, name, containerGroup, nil)
	if err != nil {
		return fmt.Errorf("failed to begin container group creation: %w", err)
	}

	// Wait for the operation to complete
	_, err = poller.PollUntilDone(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to create container group: %w", err)
	}

	return nil
}

// GetContainerGroup retrieves an ACI container group
func (c *Client) GetContainerGroup(ctx context.Context, region, resourceGroup, name string) (*armcontainerinstance.ContainerGroup, error) {
	client, err := c.GetACIClient(region)
	if err != nil {
		return nil, err
	}

	resp, err := client.Get(ctx, resourceGroup, name, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to get container group: %w", err)
	}

	return &resp.ContainerGroup, nil
}

// DeleteContainerGroup deletes an ACI container group
func (c *Client) DeleteContainerGroup(ctx context.Context, region, resourceGroup, name string) error {
	client, err := c.GetACIClient(region)
	if err != nil {
		return err
	}

	poller, err := client.BeginDelete(ctx, resourceGroup, name, nil)
	if err != nil {
		return fmt.Errorf("failed to begin container group deletion: %w", err)
	}

	_, err = poller.PollUntilDone(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to delete container group: %w", err)
	}

	return nil
}

// StartContainerGroup starts a stopped ACI container group
func (c *Client) StartContainerGroup(ctx context.Context, region, resourceGroup, name string) error {
	_, err := c.GetACIClient(region)
	if err != nil {
		return err
	}

	// Note: ACI v2 SDK doesn't have Start/Stop methods
	// Container groups auto-start when created
	// To "start", we can check if it exists and is stopped, then recreate if needed
	// For MVP, we'll return not implemented error
	return fmt.Errorf("start operation not supported in ACI v2 SDK - container groups auto-start on creation")
}

// StopContainerGroup stops a running ACI container group
func (c *Client) StopContainerGroup(ctx context.Context, region, resourceGroup, name string) error {
	client, err := c.GetACIClient(region)
	if err != nil {
		return err
	}

	_, err = client.Stop(ctx, resourceGroup, name, nil)
	if err != nil {
		return fmt.Errorf("failed to stop container group: %w", err)
	}

	return nil
}

// ContainerGroupSpec defines the specification for creating a container group
type ContainerGroupSpec struct {
	ContainerName      string
	Image              string
	CPUCores           int
	MemoryGB           int
	DNSNameLabel       string
	FileShareName      string
	StorageAccountName string
	StorageAccountKey  string
	EnvironmentID      string
	UserID             string
}
