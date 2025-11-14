package devcontainer

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
)

// ImageSelector selects the appropriate DevContainer base image based on repository analysis
type ImageSelector struct {
	// FeatureRegistry contains the GitHub Container Registry path for Dev8 features
	FeatureRegistry string
}

// NewImageSelector creates a new image selector
func NewImageSelector() *ImageSelector {
	return &ImageSelector{
		FeatureRegistry: "ghcr.io/dev8-community/devcontainer-features",
	}
}

// ImageSpec contains the selected image and features
type ImageSpec struct {
	// BaseImage is the Microsoft DevContainer image to use
	BaseImage string
	// Features are the Dev8 features to add
	Features []Feature
	// Language is the detected primary language
	Language string
}

// Feature represents a DevContainer feature
type Feature struct {
	// ID is the feature identifier (e.g., "supervisor", "claude-cli")
	ID string
	// Version is the feature version (e.g., "1", "latest")
	Version string
	// Options contains feature-specific configuration
	Options map[string]interface{}
}

// SelectImage analyzes repository metadata and selects the appropriate DevContainer image
func (s *ImageSelector) SelectImage(ctx context.Context, repoMetadata RepoMetadata) (*ImageSpec, error) {
	// Detect primary language from repository
	language := detectLanguage(repoMetadata)

	// Select base image based on language
	baseImage := s.selectBaseImage(language)

	// Build feature list (always include Dev8 core features)
	features := s.buildFeatureList(language)

	return &ImageSpec{
		BaseImage: baseImage,
		Features:  features,
		Language:  language,
	}, nil
}

// RepoMetadata contains repository analysis data
type RepoMetadata struct {
	// Files is a list of files in the repository root
	Files []string
	// PackageFiles contains package manager files (package.json, requirements.txt, etc.)
	PackageFiles map[string]string
	// Languages contains detected languages with their byte counts
	Languages map[string]int64
	// HasDevContainer indicates if a .devcontainer configuration already exists
	HasDevContainer bool
	// DevContainerConfig contains existing devcontainer.json if present
	DevContainerConfig map[string]interface{}
}

// detectLanguage determines the primary language from repository metadata
func detectLanguage(metadata RepoMetadata) string {
	// If explicit language data is provided, use it
	if len(metadata.Languages) > 0 {
		var maxBytes int64
		var primaryLang string
		for lang, bytes := range metadata.Languages {
			if bytes > maxBytes {
				maxBytes = bytes
				primaryLang = lang
			}
		}
		return normalizeLanguage(primaryLang)
	}

	// Fallback: detect from package files
	if _, hasPackageJSON := metadata.PackageFiles["package.json"]; hasPackageJSON {
		// Check if it's TypeScript or JavaScript
		for _, file := range metadata.Files {
			if strings.HasSuffix(file, ".ts") || strings.HasSuffix(file, "tsconfig.json") {
				return "typescript"
			}
		}
		return "javascript"
	}

	if _, hasPyProject := metadata.PackageFiles["pyproject.toml"]; hasPyProject {
		return "python"
	}
	if _, hasRequirements := metadata.PackageFiles["requirements.txt"]; hasRequirements {
		return "python"
	}
	if _, hasGoMod := metadata.PackageFiles["go.mod"]; hasGoMod {
		return "go"
	}
	if _, hasCargoToml := metadata.PackageFiles["Cargo.toml"]; hasCargoToml {
		return "rust"
	}

	// Default to universal image for unknown languages
	return "universal"
}

// normalizeLanguage normalizes language names to match Microsoft's image naming
func normalizeLanguage(lang string) string {
	lang = strings.ToLower(lang)
	switch lang {
	case "typescript", "javascript", "js", "ts":
		return "typescript"
	case "python", "py":
		return "python"
	case "go", "golang":
		return "go"
	case "rust", "rs":
		return "rust"
	case "c", "cpp", "c++":
		return "cpp"
	case "java":
		return "java"
	case "php":
		return "php"
	default:
		return "universal"
	}
}

// selectBaseImage returns the Microsoft DevContainer image for the given language
func (s *ImageSelector) selectBaseImage(language string) string {
	// Microsoft DevContainer images are published to mcr.microsoft.com
	baseRegistry := "mcr.microsoft.com/devcontainers"

	switch language {
	case "typescript", "javascript":
		return fmt.Sprintf("%s/typescript-node:1-20-bullseye", baseRegistry)
	case "python":
		return fmt.Sprintf("%s/python:1-3.11-bullseye", baseRegistry)
	case "go":
		return fmt.Sprintf("%s/go:1-1.22-bullseye", baseRegistry)
	case "rust":
		return fmt.Sprintf("%s/rust:1-bullseye", baseRegistry)
	case "cpp":
		return fmt.Sprintf("%s/cpp:1-bullseye", baseRegistry)
	case "java":
		return fmt.Sprintf("%s/java:1-17-bullseye", baseRegistry)
	case "php":
		return fmt.Sprintf("%s/php:1-8.2-bullseye", baseRegistry)
	case "universal":
		return fmt.Sprintf("%s/universal:2-linux", baseRegistry)
	default:
		// Fallback to base image
		return fmt.Sprintf("%s/base:1-bullseye", baseRegistry)
	}
}

// buildFeatureList returns the Dev8 features to install for the given language
func (s *ImageSelector) buildFeatureList(language string) []Feature {
	features := []Feature{
		// Always install supervisor
		{
			ID:      fmt.Sprintf("%s/supervisor", s.FeatureRegistry),
			Version: "1",
			Options: map[string]interface{}{
				"version": "latest",
			},
		},
		// Always install Claude CLI
		{
			ID:      fmt.Sprintf("%s/claude-cli", s.FeatureRegistry),
			Version: "1",
			Options: map[string]interface{}{
				"version":                "1.0.0",
				"installShellCompletion": true,
			},
		},
		// Always install AI tools bundle
		{
			ID:      fmt.Sprintf("%s/ai-tools", s.FeatureRegistry),
			Version: "1",
			Options: map[string]interface{}{
				"installGithubCLI":  true,
				"installCopilot":    true,
				"installAzureCLI":   true,
				"installYq":         true,
				"installTmux":       true,
				"setupShellAliases": true,
			},
		},
	}

	return features
}

// ToDevContainerJSON generates a devcontainer.json configuration
func (spec *ImageSpec) ToDevContainerJSON() (string, error) {
	config := map[string]interface{}{
		"name":  "Dev8 Workspace",
		"image": spec.BaseImage,
	}

	// Add features
	if len(spec.Features) > 0 {
		features := make(map[string]interface{})
		for _, feature := range spec.Features {
			key := fmt.Sprintf("%s:%s", feature.ID, feature.Version)
			if len(feature.Options) > 0 {
				features[key] = feature.Options
			} else {
				features[key] = map[string]interface{}{}
			}
		}
		config["features"] = features
	}

	// Standard Dev8 configuration
	config["customizations"] = map[string]interface{}{
		"vscode": map[string]interface{}{
			"extensions": []string{
				"ms-vscode.vscode-typescript-next",
				"dbaeumer.vscode-eslint",
				"esbenp.prettier-vscode",
			},
		},
	}

	// Mount workspace directory
	config["workspaceFolder"] = "/workspaces"
	config["workspaceMount"] = "source=/home/dev8/workspace,target=/workspaces,type=bind"

	// Post-create commands
	config["postCreateCommand"] = "echo 'Dev8 workspace ready!'"

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return "", fmt.Errorf("failed to marshal devcontainer config: %w", err)
	}

	return string(data), nil
}

// GetImageString returns the complete image string including features
// For now, we return just the base image and let the deployment handle features separately
func (spec *ImageSpec) GetImageString() string {
	return spec.BaseImage
}
