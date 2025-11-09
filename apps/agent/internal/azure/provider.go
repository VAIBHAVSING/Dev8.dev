package azure

import (
	"context"
	"fmt"
)

// ContainerResponse contains common container information across providers
type ContainerResponse struct {
	ID                string
	Name              string
	FQDN              string
	URL               string
	ProvisioningState string
}

// CreateContainer creates a container using the configured provider (ACI or ACA)
func (c *Client) CreateContainer(ctx context.Context, region, resourceGroup, name string, spec ContainerGroupSpec) (*ContainerResponse, error) {
	mode := c.config.Azure.DeploymentMode

	switch mode {
	case "aca":
		// Validate ACA environment ID
		if c.config.Azure.ContainerAppsEnvironmentID == "" {
			return nil, fmt.Errorf("AZURE_ACA_ENVIRONMENT_ID is required when AZURE_DEPLOYMENT_MODE=aca")
		}

		// Convert spec to ACA spec
		acaSpec := ContainerAppSpec{
			WorkspaceID:        spec.EnvironmentID,
			UserID:             spec.UserID,
			Name:               name,
			Image:              spec.Image,
			CPUCores:           float64(spec.CPUCores),
			MemoryGB:           float64(spec.MemoryGB),
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

		result, err := c.CreateContainerApp(ctx, region, resourceGroup, c.config.Azure.ContainerAppsEnvironmentID, acaSpec)
		if err != nil {
			return nil, err
		}

		return &ContainerResponse{
			ID:                result.ID,
			Name:              result.Name,
			FQDN:              result.FQDN,
			URL:               result.URL,
			ProvisioningState: "Succeeded",
		}, nil

	case "aci", "":
		// Default to ACI
		if err := c.CreateContainerGroup(ctx, region, resourceGroup, name, spec); err != nil {
			return nil, err
		}

		// Get container details
		details, err := c.GetContainerGroup(ctx, region, resourceGroup, name)
		if err != nil {
			return nil, fmt.Errorf("created container but failed to get details: %w", err)
		}

		var fqdn, state string
		if details != nil && details.Properties != nil {
			if details.Properties.IPAddress != nil && details.Properties.IPAddress.Fqdn != nil {
				fqdn = *details.Properties.IPAddress.Fqdn
			}
			if details.Properties.ProvisioningState != nil {
				state = *details.Properties.ProvisioningState
			}
		}

		return &ContainerResponse{
			Name:              name,
			FQDN:              fqdn,
			URL:               fmt.Sprintf("https://%s", fqdn),
			ProvisioningState: state,
		}, nil

	default:
		return nil, fmt.Errorf("unsupported deployment mode: %s (must be 'aci' or 'aca')", mode)
	}
}

// DeleteContainer deletes a container using the configured provider (ACI or ACA)
func (c *Client) DeleteContainer(ctx context.Context, region, resourceGroup, name string) error {
	mode := c.config.Azure.DeploymentMode

	switch mode {
	case "aca":
		return c.DeleteContainerApp(ctx, resourceGroup, name)
	case "aci", "":
		return c.DeleteContainerGroup(ctx, region, resourceGroup, name)
	default:
		return fmt.Errorf("unsupported deployment mode: %s", mode)
	}
}

// GetContainer gets container details using the configured provider (ACI or ACA)
func (c *Client) GetContainer(ctx context.Context, region, resourceGroup, name string) (*ContainerResponse, error) {
	mode := c.config.Azure.DeploymentMode

	switch mode {
	case "aca":
		result, err := c.GetContainerApp(ctx, resourceGroup, name)
		if err != nil {
			return nil, err
		}

		var fqdn string
		if result.Properties != nil && result.Properties.Configuration != nil && result.Properties.Configuration.Ingress != nil && result.Properties.Configuration.Ingress.Fqdn != nil {
			fqdn = *result.Properties.Configuration.Ingress.Fqdn
		}

		return &ContainerResponse{
			Name:              *result.Name,
			FQDN:              fqdn,
			URL:               fmt.Sprintf("https://%s", fqdn),
			ProvisioningState: "Succeeded",
		}, nil

	case "aci", "":
		details, err := c.GetContainerGroup(ctx, region, resourceGroup, name)
		if err != nil {
			return nil, err
		}

		var fqdn, state string
		if details != nil && details.Properties != nil {
			if details.Properties.IPAddress != nil && details.Properties.IPAddress.Fqdn != nil {
				fqdn = *details.Properties.IPAddress.Fqdn
			}
			if details.Properties.ProvisioningState != nil {
				state = *details.Properties.ProvisioningState
			}
		}

		return &ContainerResponse{
			Name:              name,
			FQDN:              fqdn,
			URL:               fmt.Sprintf("https://%s", fqdn),
			ProvisioningState: state,
		}, nil

	default:
		return nil, fmt.Errorf("unsupported deployment mode: %s", mode)
	}
}
