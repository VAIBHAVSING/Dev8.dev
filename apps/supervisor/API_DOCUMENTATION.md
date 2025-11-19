# Dev8 Supervisor API Documentation

## Overview

The Dev8 Supervisor is a lightweight monitoring and management service that runs inside each development environment container. It monitors workspace activity, manages backups, and reports status to the Dev8 Agent.

**Base URL:** `http://<container-ip>:<port>`  
**Default Port:** `9090`  
**Version:** `1.0.0`

## Table of Contents

- [Architecture](#architecture)
- [Health Check Endpoints](#health-check-endpoints)
- [Status Endpoints](#status-endpoints)
- [Internal Services](#internal-services)
- [Configuration](#configuration)
- [Data Models](#data-models)

---

## Architecture

The supervisor runs as a background service within each development environment and performs the following tasks:

1. **Activity Monitoring** - Tracks IDE and SSH connections
2. **Backup Management** - Performs periodic workspace backups to Azure File Share
3. **Status Reporting** - Reports activity to the Dev8 Agent
4. **Health Monitoring** - Provides health and status endpoints

---

## Health Check Endpoints

### GET /health

Returns the health status of the supervisor service.

**Response:**

```json
{
  "healthy": true,
  "uptimeSeconds": 7890.45,
  "activeIDEConnections": 1,
  "activeSSHConnections": 0
}
```

**Response Fields:**

- `healthy` (boolean): Overall health status
- `uptimeSeconds` (number): Service uptime in seconds
- `activeIDEConnections` (integer): Number of active IDE connections
- `activeSSHConnections` (integer): Number of active SSH connections

**Status Codes:**

- `200 OK` - Always returns 200 if the service is running

**Example:**

```bash
curl http://localhost:9090/health
```

---

### GET /status

Returns detailed status information about the supervisor and workspace.

**Response:**

```json
{
  "uptime": "2h11m30s",
  "startedAt": "2025-10-24T09:00:00Z",
  "lastIDEActivity": "2025-10-24T11:10:00Z",
  "lastSSHActivity": "2025-10-24T10:00:00Z",
  "activeIDEConnections": 1,
  "activeSSHConnections": 0
}
```

**Response Fields:**

- `uptime` (string): Human-readable uptime duration
- `startedAt` (timestamp): Service start time in RFC3339 format
- `lastIDEActivity` (timestamp): Last detected IDE activity
- `lastSSHActivity` (timestamp): Last detected SSH activity
- `activeIDEConnections` (integer): Number of active IDE connections
- `activeSSHConnections` (integer): Number of active SSH connections

**Status Codes:**

- `200 OK` - Always returns 200 if the service is running

**Example:**

```bash
curl http://localhost:9090/status
```

---

## Internal Services

The supervisor includes several internal services that operate automatically:

### Activity Monitor

Monitors workspace activity by tracking:

- IDE connections (VS Code Server processes)
- SSH connections (active SSH sessions)
- Connection timestamps and counts

**Configuration:**

- `MONITOR_INTERVAL` - Monitoring interval (default: 30s)

**How it works:**

1. Periodically scans for active processes
2. Updates internal state with connection counts
3. Tracks last activity timestamps
4. Reports to the Dev8 Agent if configured

---

### Backup Manager

Manages automatic workspace backups to Azure File Share.

**Configuration:**

- `BACKUP_ENABLED` - Enable/disable backups (default: true)
- `BACKUP_INTERVAL` - Backup interval (default: 1h)
- `BACKUP_RETENTION_DAYS` - Backup retention period (default: 7)
- `WORKSPACE_DIR` - Directory to backup (default: /workspace)

**Backup Process:**

1. Creates timestamped backup directory
2. Syncs workspace files to Azure File Share
3. Prunes old backups based on retention policy
4. Logs backup status and errors

**Backup Structure:**

```
/mnt/workspace-backup/
├── backup-2025-10-24T09-00-00/
├── backup-2025-10-24T10-00-00/
├── backup-2025-10-24T11-00-00/
└── .latest -> backup-2025-10-24T11-00-00/
```

---

### Activity Reporter

Reports workspace activity to the Dev8 Agent.

**Configuration:**

- `AGENT_ENABLED` - Enable/disable agent reporting (default: true)
- `AGENT_URL` - Agent API endpoint (e.g., http://agent:8080)
- `AGENT_REPORT_INTERVAL` - Reporting interval (default: 60s)
- `ENVIRONMENT_ID` - Environment identifier

**Report Payload:**

```json
{
  "environmentId": "env-abc123",
  "snapshot": {
    "lastIDEActivity": "2025-10-24T11:10:00Z",
    "lastSSHActivity": "2025-10-24T10:00:00Z",
    "activeIDEConnections": 1,
    "activeSSHConnections": 0
  },
  "timestamp": "2025-10-24T11:10:00Z"
}
```

**Destination:** `POST {AGENT_URL}/api/v1/environments/{ENVIRONMENT_ID}/activity`

---

### Mount Manager

Manages the Azure File Share mount for workspace persistence.

**Configuration:**

- `MOUNT_ENABLED` - Enable/disable mounting (default: true)
- `MOUNT_STORAGE_ACCOUNT` - Azure storage account name
- `MOUNT_FILE_SHARE` - Azure file share name
- `MOUNT_POINT` - Local mount point (default: /mnt/workspace-backup)

**Features:**

- Automatic mount on startup
- Mount health checking
- Automatic remount on failure
- Uses Azure Storage credentials from environment

---

## Configuration

### Environment Variables

The supervisor can be configured using the following environment variables:

#### HTTP Server

- `HTTP_ENABLED` - Enable HTTP status server (default: true)
- `HTTP_ADDR` - HTTP server address (default: :9090)

#### Monitoring

- `MONITOR_INTERVAL` - Activity monitoring interval (default: 30s)

#### Backup

- `BACKUP_ENABLED` - Enable automatic backups (default: true)
- `BACKUP_INTERVAL` - Backup interval (default: 1h)
- `BACKUP_RETENTION_DAYS` - Days to keep backups (default: 7)
- `WORKSPACE_DIR` - Workspace directory path (default: /workspace)

#### Agent Integration

- `AGENT_ENABLED` - Enable agent reporting (default: true)
- `AGENT_URL` - Agent API base URL
- `AGENT_REPORT_INTERVAL` - Report interval (default: 60s)
- `ENVIRONMENT_ID` - Environment identifier

#### Azure Mount

- `MOUNT_ENABLED` - Enable Azure File Share mount (default: true)
- `MOUNT_STORAGE_ACCOUNT` - Azure storage account name
- `MOUNT_STORAGE_KEY` - Azure storage account key (**Security Note:** This is a sensitive credential. In production environments, use secure secrets management systems like Kubernetes Secrets, Azure Key Vault, or similar solutions. Never commit this value to source control.)
- `MOUNT_FILE_SHARE` - Azure file share name
- `MOUNT_POINT` - Mount point path (default: /mnt/workspace-backup)

#### Logging

- `LOG_FILE_PATH` - Log file path (default: /var/log/supervisor.log)
- `LOG_LEVEL` - Log level: debug, info, warn, error (default: info)

---

## Data Models

### Activity Snapshot

Represents a point-in-time snapshot of workspace activity.

```go
type ActivitySnapshot struct {
    LastIDEActivity time.Time `json:"lastIDEActivity"`
    LastSSHActivity time.Time `json:"lastSSHActivity"`
    ActiveIDE       int       `json:"activeIDEConnections"`
    ActiveSSH       int       `json:"activeSSHConnections"`
}
```

**Fields:**

- `lastIDEActivity` - Timestamp of last IDE activity
- `lastSSHActivity` - Timestamp of last SSH activity
- `activeIDEConnections` - Current number of IDE connections
- `activeSSHConnections` - Current number of SSH connections

---

### Activity Report

Full activity report sent to the Dev8 Agent.

```go
type ActivityReport struct {
    EnvironmentID string           `json:"environmentId"`
    Snapshot      ActivitySnapshot `json:"snapshot"`
    Timestamp     time.Time        `json:"timestamp"`
}
```

**Fields:**

- `environmentId` - Unique environment identifier
- `snapshot` - Current activity snapshot
- `timestamp` - Report generation timestamp

---

### Health Status

Health check response format.

```json
{
  "healthy": true,
  "uptimeSeconds": 7890.45,
  "activeIDEConnections": 1,
  "activeSSHConnections": 0
}
```

---

### Status Response

Detailed status response format.

```json
{
  "uptime": "2h11m30s",
  "startedAt": "2025-10-24T09:00:00Z",
  "lastIDEActivity": "2025-10-24T11:10:00Z",
  "lastSSHActivity": "2025-10-24T10:00:00Z",
  "activeIDEConnections": 1,
  "activeSSHConnections": 0
}
```

---

## Logging

The supervisor logs all activities to both stdout and a log file.

### Log Levels

- `DEBUG` - Detailed diagnostic information
- `INFO` - General informational messages
- `WARN` - Warning messages for non-critical issues
- `ERROR` - Error messages for failures

### Log Format

```
2025-10-24T11:10:00Z INFO workspace supervisor starting workspace=/workspace monitorInterval=30s backupEnabled=true
2025-10-24T11:10:01Z INFO activity monitor started interval=30s
2025-10-24T11:10:01Z INFO backup manager started interval=1h retention=7d
2025-10-24T11:10:01Z INFO http server started addr=:9090
2025-10-24T11:10:30Z INFO activity detected ide=1 ssh=0
2025-10-24T11:11:00Z INFO activity reported environmentId=env-abc123
```

---

## Startup and Shutdown

### Startup Sequence

1. Load configuration from environment variables
2. Validate configuration
3. Initialize logger
4. Create monitor state
5. Start activity monitor loop
6. Start backup manager (if enabled)
7. Start HTTP status server (if enabled)
8. Wait for shutdown signal

### Graceful Shutdown

The supervisor handles `SIGINT` and `SIGTERM` signals for graceful shutdown:

1. Receive shutdown signal
2. Stop accepting new HTTP requests
3. Complete in-flight backup operations
4. Flush logs to disk
5. Exit cleanly

**Shutdown timeout:** 5 seconds for HTTP server

---

## Error Handling

### HTTP Errors

All HTTP endpoints return JSON responses with appropriate status codes. For consistency with the Dev8 Agent API, error responses follow a standardized format.

**Error Response Format:**

```json
{
  "error": "Human-readable error message",
  "message": "Detailed error description"
}
```

**Example Error Response:**

```json
{
  "error": "Service unavailable",
  "message": "Unable to connect to backup storage"
}
```

### Internal Errors

Internal errors are logged but do not stop the service:

- **Mount failures**: Logged and retried
- **Backup failures**: Logged, service continues
- **Reporting failures**: Logged, will retry on next interval
- **Monitor errors**: Logged, monitoring continues

---

## Integration with Dev8 Agent

The supervisor integrates with the Dev8 Agent through activity reporting:

### Reporting Flow

```
┌─────────────┐         ┌──────────────┐         ┌────────────┐
│  Supervisor │         │    Monitor   │         │ Dev8 Agent │
│   Service   │────────▶│   Activity   │────────▶│    API     │
└─────────────┘         └──────────────┘         └────────────┘
      │                        │                        │
      │  Monitor processes     │                        │
      │───────────────────────▶│                        │
      │                        │  Report activity       │
      │                        │───────────────────────▶│
      │                        │                        │
      │                        │  Update environment    │
      │                        │◀───────────────────────│
```

### Configuration Example

```bash
# Enable agent reporting
AGENT_ENABLED=true
AGENT_URL=http://dev8-agent:8080
AGENT_REPORT_INTERVAL=60s
ENVIRONMENT_ID=env-abc123

# Configure monitoring
MONITOR_INTERVAL=30s
```

---

## Monitoring and Observability

### Process Detection

The supervisor monitors the following processes:

**IDE Connections (VS Code Server):**

- Process name patterns: `code-server`, `node.*openvscode-server`
- Connection tracking: Active WebSocket connections

**SSH Connections:**

- Process name patterns: `sshd.*pts`
- Connection tracking: Active TTY sessions

### Health Checks

**Kubernetes Liveness Probe:**

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 9090
  initialDelaySeconds: 10
  periodSeconds: 30
```

**Kubernetes Readiness Probe:**

```yaml
readinessProbe:
  httpGet:
    path: /health
    port: 9090
  initialDelaySeconds: 5
  periodSeconds: 10
```

---

## Examples

### Check Supervisor Health

```bash
curl http://localhost:9090/health
```

**Response:**

```json
{
  "healthy": true,
  "uptimeSeconds": 3600.0,
  "activeIDEConnections": 1,
  "activeSSHConnections": 0
}
```

---

### Get Detailed Status

```bash
curl http://localhost:9090/status
```

**Response:**

```json
{
  "uptime": "1h0m0s",
  "startedAt": "2025-10-24T10:00:00Z",
  "lastIDEActivity": "2025-10-24T11:00:00Z",
  "lastSSHActivity": "2025-10-24T10:30:00Z",
  "activeIDEConnections": 1,
  "activeSSHConnections": 0
}
```

---

### Manual Backup Trigger

While there's no HTTP endpoint for manual backup, you can trigger it via signal:

```bash
# Send SIGUSR1 to trigger immediate backup
kill -SIGUSR1 $(pidof supervisor)
```

---

## Security Considerations

### Access Control

**⚠️ CRITICAL SECURITY NOTICE:**

The Supervisor API **does not implement authentication** and is designed as an **internal-only service**. This design choice has significant security implications:

- **The HTTP server listens on all interfaces (0.0.0.0) by default** - This means it's accessible from any network interface
- **No authentication or authorization** - Any client that can reach the service can access all endpoints
- **Exposes sensitive operational data** - Activity metrics, workspace status, and configuration details

**Required Security Measures for Production:**

1. **Network Isolation (MANDATORY):**
   - Deploy the supervisor in a private container network
   - Use Kubernetes NetworkPolicies to restrict access to the supervisor pod
   - Only allow traffic from authorized services (e.g., the Dev8 Agent)
   - **Never expose the supervisor API to public networks or untrusted zones**

2. **Firewall Rules:**
   - Configure firewall rules to block external access to port 9090
   - Use cloud provider security groups or network ACLs
   - Implement defense-in-depth strategies

3. **Service Mesh (Recommended):**
   - Consider using a service mesh (Istio, Linkerd) for mutual TLS
   - Enforce service-to-service authentication
   - Implement fine-grained access policies

4. **Monitoring:**
   - Monitor for unauthorized access attempts
   - Set up alerts for unexpected traffic patterns
   - Log all API requests for audit purposes

**Example Kubernetes NetworkPolicy:**

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: supervisor-network-policy
spec:
  podSelector:
    matchLabels:
      app: dev8-supervisor
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: dev8-agent
      ports:
        - protocol: TCP
          port: 9090
```

### Credentials

- **Azure Storage credentials** are loaded from environment variables
- **MOUNT_STORAGE_KEY is highly sensitive** - Use Kubernetes Secrets, Azure Key Vault, or similar secure storage
- Mount credentials are passed securely via environment (never via command-line arguments)
- No credentials are logged or exposed via API endpoints
- **Best Practice:** Rotate storage keys regularly and use Azure Managed Identities where possible

### Process Monitoring

- Only monitors own container processes
- No access to host system processes
- Isolated within container namespace

---

## Troubleshooting

### Supervisor Not Starting

**Check logs:**

```bash
tail -f /var/log/supervisor.log
```

**Common issues:**

- Invalid configuration
- Missing environment variables
- Azure mount failure

---

### Backups Not Working

**Check mount status:**

```bash
mount | grep workspace-backup
```

**Verify credentials:**

- `MOUNT_STORAGE_ACCOUNT`
- `MOUNT_STORAGE_KEY`
- `MOUNT_FILE_SHARE`

---

### Activity Not Reporting

**Check agent connectivity:**

```bash
curl -v http://$AGENT_URL/health
```

**Verify configuration:**

- `AGENT_ENABLED=true`
- `AGENT_URL` is correct
- `ENVIRONMENT_ID` is set

---

## Performance

### Resource Usage

**CPU:** < 5% (idle), < 20% (during backup)  
**Memory:** ~50MB  
**Disk I/O:** Minimal (except during backup)  
**Network:** Minimal (periodic reporting)

### Scaling Considerations

- One supervisor per environment container
- No clustering or horizontal scaling needed
- Stateless design (state is in-memory only)

---

## Development

### Building

```bash
cd apps/supervisor
go build -o supervisor ./cmd/supervisor
```

### Testing

```bash
go test ./...
```

### Running Locally

```bash
export HTTP_ENABLED=true
export HTTP_ADDR=:9090
export MONITOR_INTERVAL=30s
export BACKUP_ENABLED=false
export AGENT_ENABLED=false
export WORKSPACE_DIR=/tmp/test-workspace

./supervisor
```

---

## Version History

### v1.0.0 (Current)

- Initial release
- Activity monitoring
- Backup management
- Agent reporting
- HTTP status endpoints

---

## Support

For issues or questions about the supervisor service:

1. Check the logs: `/var/log/supervisor.log`
2. Review environment configuration
3. Verify Azure connectivity
4. Check agent API availability

---

## Notes

- All timestamps are in ISO 8601 format (RFC3339)
- All durations use Go duration format (e.g., 30s, 1h, 1h30m)
- All JSON responses use 2-space indentation for readability
- The supervisor is designed to be resilient and self-recovering
