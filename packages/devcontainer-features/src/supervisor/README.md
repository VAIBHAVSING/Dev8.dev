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

| Option        | Type   | Default          | Description                             |
| ------------- | ------ | ---------------- | --------------------------------------- |
| `version`     | string | `latest`         | Version of supervisor to install        |
| `installPath` | string | `/usr/local/bin` | Installation path for supervisor binary |

## What it does

The supervisor provides:

- **Activity Monitoring**: Tracks CPU, memory, and disk usage
- **Automated Backups**: Periodic workspace backups to Azure Files
- **Health Reporting**: Reports workspace status to the Dev8 agent
- **HTTP API**: Exposes health endpoints for monitoring

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

## More Information

See the [supervisor documentation](https://github.com/Dev8-Community/Dev8.dev/tree/main/apps/supervisor) for detailed configuration options.
