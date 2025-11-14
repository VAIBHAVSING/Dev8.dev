# DevContainer Package

This package provides image selection logic for the Dev8 agent, enabling automatic selection of appropriate Microsoft DevContainer base images with Dev8 custom features.

## Architecture

The package implements a strategy for migrating from custom-built Docker images to official Microsoft DevContainer images:

```
Previous Architecture:
┌─────────────────────────────┐
│ dev8-ai-tools:latest        │ ← Custom 4-layer build
│ (5-10 min build time)       │
└─────────────────────────────┘

New Architecture:
┌─────────────────────────────┐
│ mcr.microsoft.com/          │ ← Pre-built by Microsoft
│ devcontainers/python:1      │   (0 build time)
├─────────────────────────────┤
│ + Dev8 Features (installed  │
│   at container start):      │
│   - supervisor              │
│   - claude-cli              │
│   - ai-tools                │
└─────────────────────────────┘
```

## Components

### ImageSelector

Analyzes repository metadata and selects the appropriate DevContainer base image:

```go
selector := devcontainer.NewImageSelector()

metadata := devcontainer.RepoMetadata{
    Files: []string{"package.json", "tsconfig.json"},
    PackageFiles: map[string]string{
        "package.json": "{}",
    },
}

spec, err := selector.SelectImage(ctx, metadata)
// spec.BaseImage = "mcr.microsoft.com/devcontainers/typescript-node:1-20-bullseye"
// spec.Features = [supervisor, claude-cli, ai-tools]
```

### Supported Languages

The selector automatically detects and selects images for:

- **TypeScript/JavaScript**: `typescript-node` image
- **Python**: `python` image with Python 3.11
- **Go**: `go` image with Go 1.22
- **Rust**: `rust` image
- **C/C++**: `cpp` image
- **Java**: `java` image with Java 17
- **PHP**: `php` image with PHP 8.2
- **Universal**: Multi-language image for polyglot projects
- **Base**: Minimal Debian image for other languages

## Language Detection

Language detection follows this priority:

1. **Explicit language data** (from GitHub API or similar)
2. **Package manager files**:
   - `package.json` + `tsconfig.json` → TypeScript
   - `package.json` → JavaScript
   - `requirements.txt` or `pyproject.toml` → Python
   - `go.mod` → Go
   - `Cargo.toml` → Rust
3. **Fallback**: Universal image

## Dev8 Features

All workspaces include three core features:

### 1. Supervisor

- Monitors workspace activity
- Performs automated backups
- Reports health to agent
- Configurable via environment variables

### 2. Claude CLI

- Command-line interface for Anthropic's Claude
- Supports all Claude 3 models
- Shell completion included

### 3. AI Tools Bundle

- GitHub CLI with Copilot extension
- Azure CLI for infrastructure
- GPT and Gemini CLI wrappers
- tmux with custom configuration
- Productivity shell aliases

## Integration with Agent

The agent uses this package when creating new workspaces:

```go
// In environment service
selector := devcontainer.NewImageSelector()

// Analyze repository
metadata := analyzeRepository(repoURL)

// Select image
spec, err := selector.SelectImage(ctx, metadata)

// Deploy with selected image
deploymentSpec := services.ContainerDeploymentSpec{
    Image: spec.GetImageString(),
    // ... other config
}
```

## Benefits

1. **Zero Build Time**: Microsoft images are pre-built and cached
2. **Regular Updates**: Microsoft maintains and updates base images
3. **Standardization**: Consistent base across all workspaces
4. **Flexibility**: Features can be added/removed without rebuilds
5. **Compatibility**: Works with standard DevContainer tools

## Future Enhancements

- [ ] Support for custom user-defined features
- [ ] Automatic detection of framework-specific needs (Django, React, etc.)
- [ ] Integration with existing `.devcontainer/devcontainer.json`
- [ ] Feature version pinning per workspace
- [ ] Dynamic feature installation based on workspace activity

## Testing

Run tests with:

```bash
cd apps/agent
go test ./internal/devcontainer/...
```

## Related Documentation

- [DevContainer Features](../../../packages/devcontainer-features/)
- [Microsoft DevContainer Images](https://github.com/devcontainers/images)
- [DevContainer Specification](https://containers.dev/)
