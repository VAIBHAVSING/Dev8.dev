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

1. **Pre-built Binaries (Preferred)**: Downloads from consistent GitHub release URL
   - **Consistent URL**: Always downloads from `supervisor-latest` release tag
   - **No authentication required**: Public release URLs
   - Fast installation (<10 seconds)
   - Multi-architecture support (amd64, arm64)
   - URLs never change between builds

2. **Build from Source (Fallback)**: Compiles supervisor from source code
   - Used when download fails
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

## Binary Distribution

The supervisor binaries are built automatically by GitHub Actions on every commit to `main`:

- Workflow: `.github/workflows/build-supervisor.yml`
- Released with consistent tag: `supervisor-latest`
- Available for Linux AMD64 and ARM64
- URLs never change between builds

**Consistent Download URLs:**

- AMD64: `https://github.com/VAIBHAVSING/Dev8.dev/releases/download/supervisor-latest/supervisor-linux-amd64`
- ARM64: `https://github.com/VAIBHAVSING/Dev8.dev/releases/download/supervisor-latest/supervisor-linux-arm64`

These URLs always point to the latest build, so the DevContainer feature never needs updating!

## How It Works

When you install the feature:

1. The install script downloads from the **consistent release URL**
2. The `supervisor-latest` release tag is automatically updated on every merge to `main`
3. The URL never changes, but the binary content is always the latest version
4. If download fails, it automatically builds from source as fallback

This means **zero maintenance** - the feature always gets the latest supervisor binary without any updates needed!

## More Information

See the [supervisor documentation](https://github.com/VAIBHAVSING/Dev8.dev/tree/main/apps/supervisor) for detailed configuration options.
