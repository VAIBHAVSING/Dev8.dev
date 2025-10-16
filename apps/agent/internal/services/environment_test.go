package services

import (
	"testing"

	"github.com/VAIBHAVSING/Dev8.dev/apps/agent/internal/config"
)

func TestGenerateEnvironmentID(t *testing.T) {
	id1 := generateEnvironmentID()
	id2 := generateEnvironmentID()

	if id1 == "" {
		t.Error("generateEnvironmentID() returned empty string")
	}

	if id1 == id2 {
		t.Error("generateEnvironmentID() should generate unique IDs")
	}

	if len(id1) < 5 {
		t.Error("generateEnvironmentID() should generate reasonable length ID")
	}
}

func TestGenerateFileShareName(t *testing.T) {
	tests := []struct {
		name   string
		userID string
		envID  string
	}{
		{
			name:   "normal IDs",
			userID: "user123",
			envID:  "env-456",
		},
		{
			name:   "long IDs",
			userID: "very-long-user-id-that-exceeds-limit",
			envID:  "very-long-environment-id-that-exceeds-limit",
		},
		{
			name:   "IDs with underscores",
			userID: "user_with_underscores",
			envID:  "env_with_underscores",
		},
		{
			name:   "mixed case IDs",
			userID: "UserMixedCase",
			envID:  "EnvMixedCase",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			shareName := generateFileShareName(tt.userID, tt.envID)

			if shareName == "" {
				t.Error("generateFileShareName() returned empty string")
			}

			// Azure File Share name restrictions
			if len(shareName) > 63 {
				t.Errorf("generateFileShareName() = %v, length %d exceeds 63 chars", shareName, len(shareName))
			}

			// Should be lowercase
			for _, c := range shareName {
				if c >= 'A' && c <= 'Z' {
					t.Errorf("generateFileShareName() = %v contains uppercase characters", shareName)
					break
				}
			}

			// Should not contain underscores
			for _, c := range shareName {
				if c == '_' {
					t.Errorf("generateFileShareName() = %v contains underscores", shareName)
					break
				}
			}
		})
	}
}

func TestGenerateContainerGroupName(t *testing.T) {
	envID := "env-12345"
	name := generateContainerGroupName(envID)

	if name == "" {
		t.Error("generateContainerGroupName() returned empty string")
	}

	expectedPrefix := "aci-"
	if len(name) < len(expectedPrefix) {
		t.Error("generateContainerGroupName() name too short")
	}
}

func TestGenerateDNSLabel(t *testing.T) {
	envID := "ENV-12345"
	label := generateDNSLabel(envID)

	if label == "" {
		t.Error("generateDNSLabel() returned empty string")
	}

	// Should be lowercase
	for _, c := range label {
		if c >= 'A' && c <= 'Z' {
			t.Errorf("generateDNSLabel() = %v contains uppercase characters", label)
			break
		}
	}

	// Should start with expected prefix
	expectedPrefix := "dev8-"
	if len(label) < len(expectedPrefix) {
		t.Error("generateDNSLabel() name too short")
	}
}

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
