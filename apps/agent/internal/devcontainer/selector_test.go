package devcontainer

import (
	"context"
	"strings"
	"testing"
)

func TestDetectLanguage(t *testing.T) {
	tests := []struct {
		name     string
		metadata RepoMetadata
		want     string
	}{
		{
			name: "TypeScript from package.json and tsconfig",
			metadata: RepoMetadata{
				Files:        []string{"tsconfig.json", "package.json", "src/index.ts"},
				PackageFiles: map[string]string{"package.json": "{}"},
			},
			want: "typescript",
		},
		{
			name: "JavaScript from package.json only",
			metadata: RepoMetadata{
				Files:        []string{"package.json", "src/index.js"},
				PackageFiles: map[string]string{"package.json": "{}"},
			},
			want: "javascript",
		},
		{
			name: "Python from requirements.txt",
			metadata: RepoMetadata{
				Files:        []string{"requirements.txt", "main.py"},
				PackageFiles: map[string]string{"requirements.txt": "flask==2.0.0"},
			},
			want: "python",
		},
		{
			name: "Go from go.mod",
			metadata: RepoMetadata{
				Files:        []string{"go.mod", "main.go"},
				PackageFiles: map[string]string{"go.mod": "module example.com/app"},
			},
			want: "go",
		},
		{
			name: "Rust from Cargo.toml",
			metadata: RepoMetadata{
				Files:        []string{"Cargo.toml", "src/main.rs"},
				PackageFiles: map[string]string{"Cargo.toml": "[package]"},
			},
			want: "rust",
		},
		{
			name: "Universal for unknown",
			metadata: RepoMetadata{
				Files: []string{"README.md"},
			},
			want: "universal",
		},
		{
			name: "Language detection from bytes",
			metadata: RepoMetadata{
				Languages: map[string]int64{
					"Python":     1000,
					"JavaScript": 500,
				},
			},
			want: "python",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := detectLanguage(tt.metadata)
			if got != tt.want {
				t.Errorf("detectLanguage() = %v, want %v", got, tt.want)
			}
		})
	}
}

func TestSelectBaseImage(t *testing.T) {
	selector := NewImageSelector()

	tests := []struct {
		language string
		want     string
	}{
		{"typescript", "mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye"},
		{"python", "mcr.microsoft.com/devcontainers/python:1-3.11-bullseye"},
		{"go", "mcr.microsoft.com/devcontainers/go:1-1.22-bullseye"},
		{"rust", "mcr.microsoft.com/devcontainers/rust:1-bullseye"},
		{"universal", "mcr.microsoft.com/devcontainers/universal:2-linux"},
	}

	for _, tt := range tests {
		t.Run(tt.language, func(t *testing.T) {
			got := selector.selectBaseImage(tt.language)
			if got != tt.want {
				t.Errorf("selectBaseImage(%s) = %v, want %v", tt.language, got, tt.want)
			}
		})
	}
}

func TestSelectImage(t *testing.T) {
	selector := NewImageSelector()

	tests := []struct {
		name     string
		metadata RepoMetadata
		wantLang string
	}{
		{
			name: "TypeScript project",
			metadata: RepoMetadata{
				Files:        []string{"tsconfig.json", "package.json"},
				PackageFiles: map[string]string{"package.json": "{}"},
			},
			wantLang: "typescript",
		},
		{
			name: "Python project",
			metadata: RepoMetadata{
				Files:        []string{"requirements.txt"},
				PackageFiles: map[string]string{"requirements.txt": "flask"},
			},
			wantLang: "python",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			spec, err := selector.SelectImage(context.Background(), tt.metadata)
			if err != nil {
				t.Fatalf("SelectImage() error = %v", err)
			}

			if spec.Language != tt.wantLang {
				t.Errorf("Language = %v, want %v", spec.Language, tt.wantLang)
			}

			if spec.BaseImage == "" {
				t.Error("BaseImage should not be empty")
			}

			// Should always have 3 core features
			if len(spec.Features) != 3 {
				t.Errorf("Features length = %d, want 3", len(spec.Features))
			}
		})
	}
}

func TestBuildFeatureList(t *testing.T) {
	selector := NewImageSelector()
	features := selector.buildFeatureList("python")

	// Should always have supervisor, claude-cli, and ai-tools
	if len(features) != 3 {
		t.Errorf("Expected 3 features, got %d", len(features))
	}

	// Check that all expected features are present
	featureIDs := make(map[string]bool)
	for _, f := range features {
		// Extract feature name from full path
		parts := strings.Split(f.ID, "/")
		featureName := parts[len(parts)-1]
		featureIDs[featureName] = true
	}

	requiredFeatures := []string{"supervisor", "claude-cli", "ai-tools"}
	for _, required := range requiredFeatures {
		if !featureIDs[required] {
			t.Errorf("Missing required feature: %s", required)
		}
	}
}

func TestToDevContainerJSON(t *testing.T) {
	spec := &ImageSpec{
		BaseImage: "mcr.microsoft.com/devcontainers/python:1-3.11-bullseye",
		Language:  "python",
		Features: []Feature{
			{
				ID:      "ghcr.io/dev8-community/devcontainer-features/supervisor",
				Version: "1",
				Options: map[string]interface{}{"version": "latest"},
			},
		},
	}

	json, err := spec.ToDevContainerJSON()
	if err != nil {
		t.Fatalf("ToDevContainerJSON() error = %v", err)
	}

	if json == "" {
		t.Error("ToDevContainerJSON() should not return empty string")
	}

	// Check that it contains expected fields
	if !strings.Contains(json, spec.BaseImage) {
		t.Error("JSON should contain base image")
	}

	if !strings.Contains(json, "features") {
		t.Error("JSON should contain features")
	}
}
