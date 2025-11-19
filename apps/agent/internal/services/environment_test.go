package services

import (
	"testing"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/config"
)

func TestGetContainerImage(t *testing.T) {
	tests := []struct {
		name               string
		containerRegistry  string
		containerImage     string
		containerImageName string
		baseImage          string
		want               string
	}{
		{
			name:               "ACR configured - uses ACR path",
			containerRegistry:  "myregistry.azurecr.io",
			containerImageName: "dev8-workspace:latest",
			containerImage:     "vaibhavsing/dev8-workspace:latest",
			baseImage:          "node",
			want:               "myregistry.azurecr.io/dev8-workspace:latest",
		},
		{
			name:               "ACR configured - ignores baseImage parameter",
			containerRegistry:  "myregistry.azurecr.io",
			containerImageName: "dev8-workspace:latest",
			containerImage:     "vaibhavsing/dev8-workspace:latest",
			baseImage:          "python",
			want:               "myregistry.azurecr.io/dev8-workspace:latest",
		},
		{
			name:               "No ACR - uses Docker Hub fallback",
			containerRegistry:  "",
			containerImageName: "dev8-workspace:latest",
			containerImage:     "vaibhavsing/dev8-workspace:latest",
			baseImage:          "go",
			want:               "vaibhavsing/dev8-workspace:latest",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			service := &EnvironmentService{
				config: &config.Config{
					Azure: config.AzureConfig{
						ContainerRegistry: tt.containerRegistry,
					},
					ContainerImage:     tt.containerImage,
					ContainerImageName: tt.containerImageName,
				},
			}

			got := service.getContainerImage(tt.baseImage)
			if got != tt.want {
				t.Errorf("getContainerImage(%v) = %v, want %v", tt.baseImage, got, tt.want)
			}
		})
	}
}
