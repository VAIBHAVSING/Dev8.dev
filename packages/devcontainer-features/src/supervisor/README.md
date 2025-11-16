# Dev8 Workspace Supervisor

This DevContainer feature installs the Dev8 workspace supervisor - a Go binary that monitors workspace activity, performs backups, and reports health status.

## Example Usage

```json
{
  "features": {
    "ghcr.io/dev8-community/devcontainer-features/supervisor:1": {
      "version": "latest"
    }
  }
}
```

## Options

| Option        | Type   | Default          | Description                                                                                                                       |
| ------------- | ------ | ---------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `version`     | string | `latest`         | Version of supervisor to install. Use `latest` for the most recent build, or specify a GitHub Actions run ID for a specific build |
| `installPath` | string | `/usr/local/bin` | Installation path for supervisor binary                                                                                           |

## What it does

The supervisor provides:

- **Activity Monitoring**: Tracks CPU, memory, and disk usage
- **Automated Backups**: Periodic workspace backups to Azure Files
- **Health Reporting**: Reports workspace status to the Dev8 agent
- **HTTP API**: Exposes health endpoints for monitoring

## Installation Methods

The feature supports multiple installation methods:

1. **Pre-built Binaries (Preferred)**: Downloads pre-built binaries from GitHub Actions artifacts
   - Requires `GITHUB_TOKEN` environment variable for private repositories
   - Fast installation (<10 seconds)
   - Multi-architecture support (amd64, arm64)

2. **Build from Source (Fallback)**: Compiles supervisor from source code
   - Used when GitHub token is not available
   - Requires Go 1.22+ (automatically installed if missing)
   - Takes 2-3 minutes

## Configuration

After installation, configure the supervisor by creating `/etc/dev8/supervisor/config.yaml`:

```yaml
workspace_dir: /workspaces
monitor_interval: 30s
backup:
  enabled: true
  interval: 1h
  retention: 7d
agent:
  enabled: true
  url: http://agent:8080
```

## Running the Supervisor

The supervisor is typically started automatically by the Dev8 platform. To run manually:

```bash
supervisor
```

## Authentication

For private repositories, the installation requires a GitHub token with artifact read access:

```json
{
  "containerEnv": {
    "GITHUB_TOKEN": "${localEnv:GITHUB_TOKEN}"
  },
  "features": {
    "ghcr.io/dev8-community/devcontainer-features/supervisor:1": {}
  }
}
```

## Binary Distribution

The supervisor binaries are built automatically by GitHub Actions on every commit to `main`:

- Workflow: `.github/workflows/build-supervisor.yml`
- Artifacts are stored for 90 days
- Available for Linux AMD64 and ARM64
- Not published as public releases (internal tool)

## Development

To test with a specific build:

```json
{
  "features": {
    "ghcr.io/dev8-community/devcontainer-features/supervisor:1": {
      "version": "1234567890"
    }
  }
}
```

Where `1234567890` is the GitHub Actions run ID.

## More Information

See the [supervisor documentation](https://github.com/VAIBHAVSING/Dev8.dev/tree/main/apps/supervisor) for detailed configuration options.
