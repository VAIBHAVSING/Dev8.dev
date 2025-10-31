package services

import (
	"testing"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/config"
)

func TestGetContainerImage(t *testing.T) {
	service := &EnvironmentService{
		config: &config.Config{
			Azure: config.AzureConfig{
				ContainerRegistry: "myregistry.azurecr.io",
			},
		},
	}

	tests := []struct {
		baseImage string
		want      string
	}{
		{
			baseImage: "node",
			want:      "myregistry.azurecr.io/vscode-node:latest",
		},
		{
			baseImage: "python",
			want:      "myregistry.azurecr.io/vscode-python:latest",
		},
		{
			baseImage: "go",
			want:      "myregistry.azurecr.io/vscode-go:latest",
		},
		{
			baseImage: "rust",
			want:      "myregistry.azurecr.io/vscode-rust:latest",
		},
		{
			baseImage: "java",
			want:      "myregistry.azurecr.io/vscode-java:latest",
		},
		{
			baseImage: "unknown",
			want:      "myregistry.azurecr.io/vscode-node:latest", // Default
		},
	}

	for _, tt := range tests {
		t.Run(tt.baseImage, func(t *testing.T) {
			got := service.getContainerImage(tt.baseImage)
			if got != tt.want {
				t.Errorf("getContainerImage(%v) = %v, want %v", tt.baseImage, got, tt.want)
			}
		})
	}
}
