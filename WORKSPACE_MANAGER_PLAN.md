# 🚀 Workspace/Supervisor Manager Implementation Plan
**Comprehensive Plan for Issue #21 Enhancement**

> **Status:** 📝 Planning Complete  
> **Priority:** 🔴 CRITICAL  
> **Estimated Effort:** 3-4 weeks (1-2 developers)  
> **Created:** 2024-10-06  
> **Author:** Dev8.dev Team

---

## 📑 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Docker Images Strategy](#docker-images-strategy)
4. [Workspace Manager (Supervisor)](#workspace-manager-supervisor)
5. [Secret Management](#secret-management)
6. [Integration Guide](#integration-guide)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Testing Strategy](#testing-strategy)
9. [Security & Monitoring](#security--monitoring)
10. [Reference Documentation](#reference-documentation)

---

## 📋 Executive Summary

This plan transforms Issue #21 from a simple Docker image creation task into a **comprehensive workspace management system** that serves as the foundation of Dev8.dev's cloud IDE platform.

### What We're Building

1. **Optimized Multistage Docker Images**
   - Base image (~800MB) with code-server and essentials
   - Language-specific images (Node.js, Python, Go, Rust)
   - < 3GB per language image
   - Multi-stage builds for optimization

2. **Workspace/Supervisor Manager (Golang)**
   - Process orchestration (code-server + SSH server)
   - Secret injection from Azure Key Vault
   - Health monitoring with auto-recovery
   - Management API for the Go agent
   - ~10MB binary, < 20MB RAM usage

3. **Unified Connection Support**
   - Browser-based VS Code (code-server on port 8080)
   - SSH terminal access (OpenSSH on port 2222)
   - VS Code Remote-SSH extension support
   - Persistent workspaces via Azure Files

### Why This Matters

- ✅ **MVP Readiness**: Complete the core platform functionality
- ✅ **Production-Grade**: Health monitoring, auto-recovery, observability
- ✅ **Developer Experience**: GitHub, Copilot, SSH keys auto-configured
- ✅ **Scalability**: Supports 1000+ concurrent environments
- ✅ **Security**: Non-root execution, Key Vault integration, secret rotation

---

## 🏗️ Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                   User Connections Layer                         │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │   Browser    │  │   Terminal   │  │  VS Code Remote-SSH │  │
│  │ → VS Code    │  │   → SSH      │  │      → SSH          │  │
│  └──────────────┘  └──────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│            Azure Container Instance (ACI)                        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐│
│  │   Workspace Manager (Supervisor) - Golang Binary (PID 1)   ││
│  │   • Process Manager         • Secret Injector              ││
│  │   • Health Monitor           • Connection Tracker          ││
│  │   • Management API (Port 9000) - Internal                  ││
│  └────────────────────────────────────────────────────────────┘│
│                                 ↓                                │
│  ┌────────────────────────────────────────────────────────────┐│
│  │              Services Managed by Supervisor                 ││
│  │  ┌──────────────────────┐  ┌───────────────────────────┐  ││
│  │  │  code-server         │  │  SSH Server (OpenSSH)     │  ││
│  │  │  Port: 8080          │  │  Port: 2222               │  ││
│  │  │  User: dev8          │  │  Auth: Key-based only     │  ││
│  │  └──────────────────────┘  └───────────────────────────┘  ││
│  └────────────────────────────────────────────────────────────┘│
│                                 ↓                                │
│  ┌────────────────────────────────────────────────────────────┐│
│  │      Azure Files Volume Mount - /workspace                  ││
│  │  • User projects & code                                     ││
│  │  • VS Code settings & extensions (.vscode, .config)         ││
│  │  • SSH keys & git config (.ssh, .gitconfig)                ││
│  │  • Language-specific packages (node_modules, venv, etc.)   ││
│  └────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                                 ↓
┌─────────────────────────────────────────────────────────────────┐
│              Azure Key Vault (Secrets Management)                │
│  • github-token-{userId}                                         │
│  • copilot-token-{userId}                                        │
│  • ssh-private-key-{userId}                                      │
│  • ssh-public-key-{userId}                                       │
│  • custom-env-vars-{userId}                                      │
└─────────────────────────────────────────────────────────────────┘
```

### Component Interactions

```
[Container Startup]
    ↓
[Supervisor Starts as PID 1]
    ↓
[Read Config] ← Environment Variables (ENVIRONMENT_ID, USER_ID, etc.)
    ↓
[Connect to Azure Key Vault] ← Azure SDK with Managed Identity
    ↓
[Fetch Secrets] → GitHub Token, Copilot Key, SSH Keys
    ↓
[Inject Secrets] → Write to ~/.gitconfig, ~/.ssh/, ~/.config/
    ↓
[Start Services]
    ├─→ [Start code-server] → Port 8080
    └─→ [Start SSH Server] → Port 2222
    ↓
[Monitor Health] ← Periodic checks every 30s
    ├─→ Check process status
    ├─→ HTTP health checks
    └─→ Auto-restart on failure
    ↓
[Expose Management API] → Port 9000 (internal only)
    ├─→ GET /health
    ├─→ GET /status
    └─→ GET /connections
```

---

## 🐳 Docker Images Strategy

### Image Hierarchy

```
dev8-base (800MB)
    ├── dev8-nodejs (1.2GB)
    ├── dev8-python (1.5GB)
    ├── dev8-golang (1.3GB)
    └── dev8-rust (2.5GB)
```

### 1. Base Image: dev8-base

**File:** `docker/base/Dockerfile`

**Contents:**
- Ubuntu 22.04 LTS (slim variant)
- code-server 4.19.1
- OpenSSH server configured for key-based auth
- Essential tools: git, curl, ca-certificates, bash
- Workspace Manager (supervisor) - Golang binary
- dev8 user (UID 1000, non-root)
- Pre-configured SSH settings (port 2222, no password auth)

**Size Target:** ~800MB

**Key Optimizations:**
- Multi-stage build (build supervisor separately)
- Remove apt cache after installation
- Use --no-install-recommends
- Minimize layers

**Example Dockerfile:**

```dockerfile
# Stage 1: Build supervisor
FROM golang:1.21-alpine AS supervisor-builder
WORKDIR /build
COPY apps/supervisor/ .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
    go build -ldflags="-w -s" -o supervisor ./cmd/supervisor

# Stage 2: Final base image
FROM ubuntu:22.04

# Install essential packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates git openssh-server sudo bash \
    && rm -rf /var/lib/apt/lists/*

# Create dev8 user
RUN useradd -m -s /bin/bash -u 1000 dev8 && \
    echo "dev8 ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Install code-server
RUN curl -fsSL https://code-server.dev/install.sh | sh -s -- --version=4.19.1

# Copy and configure supervisor
COPY --from=supervisor-builder /build/supervisor /usr/local/bin/supervisor
RUN chmod +x /usr/local/bin/supervisor

# SSH configuration
RUN mkdir /var/run/sshd && \
    sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && \
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Workspace setup
RUN mkdir -p /workspace && chown -R dev8:dev8 /workspace
VOLUME ["/workspace"]

USER dev8
WORKDIR /workspace

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:9000/health || exit 1

EXPOSE 8080 2222 9000

ENTRYPOINT ["/usr/local/bin/supervisor"]
CMD ["--config", "/etc/dev8/supervisor.yaml"]
```

### 2. Node.js Image: dev8-nodejs

**File:** `docker/nodejs/Dockerfile`

**Additional Tools:**
- Node.js 20 LTS (via NodeSource)
- npm, pnpm, yarn package managers
- TypeScript, tsx (for TypeScript execution)
- PM2, nodemon (process management)
- Common VS Code extensions pre-installed

**Size Target:** ~1.2GB

**Pre-installed VS Code Extensions:**
- `dbaeumer.vscode-eslint` - ESLint
- `esbenp.prettier-vscode` - Prettier
- `bradlc.vscode-tailwindcss` - Tailwind CSS IntelliSense

### 3. Python Image: dev8-python

**File:** `docker/python/Dockerfile`

**Additional Tools:**
- Python 3.11
- pip, pipenv, poetry (package managers)
- Black, flake8, pytest (code quality & testing)
- IPython, Jupyter (interactive development)
- build-essential (for compiling native extensions)

**Size Target:** ~1.5GB

**Pre-installed VS Code Extensions:**
- `ms-python.python` - Python
- `ms-python.vscode-pylance` - Pylance

### 4. Go Image: dev8-golang

**File:** `docker/golang/Dockerfile`

**Additional Tools:**
- Go 1.21
- gopls (language server)
- delve (debugger)
- staticcheck (linter)

**Size Target:** ~1.3GB

**Pre-installed VS Code Extensions:**
- `golang.go` - Go

### 5. Rust Image: dev8-rust

**File:** `docker/rust/Dockerfile`

**Additional Tools:**
- Rust stable toolchain
- rustfmt, clippy (formatting & linting)
- rust-analyzer (language server)
- cargo (package manager)

**Size Target:** ~2.5GB (Rust toolchain is large)

**Pre-installed VS Code Extensions:**
- `rust-lang.rust-analyzer` - Rust Analyzer

---

## 🔧 Workspace Manager (Supervisor)

### Overview

The Workspace Manager (internally called "supervisor") is a **Golang-based orchestrator** that runs as PID 1 inside containers and manages the entire workspace lifecycle.

### Why Golang?

| Criterion | Golang | TypeScript/Node.js |
|-----------|--------|-------------------|
| Binary size | ~10MB | ~50MB (with runtime) |
| Startup time | <100ms | 1-2 seconds |
| Memory usage | 5-10MB | 30-50MB |
| Azure SDK | Excellent | Good |
| Process management | Native | Via child_process |
| Deployment | Single binary | Runtime required |

**Decision:** ✅ Golang

### Project Structure

```
apps/supervisor/
├── cmd/
│   └── supervisor/
│       └── main.go                     # Entry point
├── internal/
│   ├── config/
│   │   ├── config.go                  # Configuration struct & validation
│   │   └── loader.go                  # YAML/env config loader
│   ├── process/
│   │   ├── manager.go                 # Process lifecycle manager
│   │   ├── codeserver.go              # VS Code server wrapper
│   │   └── ssh.go                     # SSH server wrapper
│   ├── secrets/
│   │   ├── provider.go                # Secret provider interface
│   │   ├── azure.go                   # Azure Key Vault client
│   │   └── injector.go                # Secret injection logic
│   ├── health/
│   │   ├── checker.go                 # Health check implementation
│   │   └── monitor.go                 # Continuous health monitoring
│   ├── api/
│   │   ├── server.go                  # HTTP API server
│   │   └── handlers.go                # API request handlers
│   └── connection/
│       └── tracker.go                 # Active connection tracking
├── pkg/
│   └── types/
│       └── types.go                   # Shared types & structs
├── configs/
│   └── supervisor.yaml                # Default configuration
├── Dockerfile                         # Supervisor build
├── Makefile                           # Build automation
├── go.mod
├── go.sum
└── README.md                          # Documentation
```

### Core Responsibilities

#### 1. Process Management

**Manages:**
- code-server (VS Code in browser)
- SSH server (OpenSSH daemon)

**Features:**
- Start/stop/restart services
- Monitor process health
- Auto-restart on failure (with max retry limit)
- Graceful shutdown handling (SIGTERM/SIGINT)
- Process status reporting

**Implementation Highlights:**

```go
type ProcessManager struct {
    processes map[string]*Process
    config    *Config
    mu        sync.RWMutex
}

func (pm *ProcessManager) StartCodeServer(ctx context.Context) error {
    cmd := exec.CommandContext(ctx, "code-server",
        "--bind-addr", "0.0.0.0:8080",
        "--auth", "none",  // Auth handled by supervisor/proxy
        "--disable-telemetry",
        "/workspace")
    
    if err := cmd.Start(); err != nil {
        return err
    }
    
    pm.registerProcess("code-server", cmd)
    go pm.monitorProcess("code-server", cmd)
    
    return nil
}
```

#### 2. Secret Injection

**Secrets Managed:**
- GitHub personal access token
- GitHub Copilot authentication token
- User SSH keys (private & public)
- Custom environment variables

**Injection Targets:**
- `~/.gitconfig` - Git user configuration
- `~/.git-credentials` - Git credential helper
- `~/.config/gh/hosts.yml` - GitHub CLI configuration
- `~/.config/github-copilot/hosts.json` - Copilot authentication
- `~/.ssh/id_rsa` - SSH private key
- `~/.ssh/id_rsa.pub` - SSH public key

**Flow:**

```
Container starts
    ↓
Read env vars: ENVIRONMENT_ID, USER_ID, AZURE_KEY_VAULT_NAME
    ↓
Create Azure Key Vault client (with managed identity)
    ↓
Fetch secrets:
    - github-token-{userId}
    - copilot-token-{userId} (optional)
    - ssh-private-key-{userId} (optional)
    - ssh-public-key-{userId} (optional)
    ↓
Write secrets to filesystem:
    ~/.gitconfig
    ~/.git-credentials
    ~/.config/gh/hosts.yml
    ~/.config/github-copilot/hosts.json
    ~/.ssh/id_rsa (chmod 600)
    ~/.ssh/id_rsa.pub (chmod 644)
    ↓
Set file permissions and ownership
    ↓
Secrets ready for code-server and SSH
```

**Security Features:**
- Secrets fetched once at startup (with periodic refresh option)
- Secrets never logged
- Secrets written with correct permissions (600 for private keys)
- Support for zero-downtime secret rotation

#### 3. Health Monitoring

**Health Checks:**
- Process status (running/stopped/failed)
- code-server HTTP endpoint (`/healthz`)
- SSH server socket availability
- Container resource usage (memory, CPU)

**Monitoring Interval:** 30 seconds (configurable)

**Auto-Recovery:**
- Restart failed processes automatically
- Max restarts: 5 (configurable)
- Backoff strategy: 5 seconds between restarts

**Health API:**

```bash
# Check overall health
curl http://localhost:9000/health

# Response
{
  "healthy": true,
  "lastCheck": "2024-10-06T10:30:00Z",
  "services": {
    "code-server": "running",
    "ssh": "running"
  },
  "uptime": "2h30m15s"
}
```

#### 4. Management API

**Endpoints:**

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health status & service states |
| GET | `/status` | Detailed environment status |
| GET | `/connections` | Active connection count |
| POST | `/restart/:service` | Restart specific service |
| GET | `/metrics` | Prometheus-compatible metrics |

**Port:** 9000 (internal only, not exposed publicly)

**Authentication:** Internal API, no authentication required (accessed only by Go agent via internal network)

---

## 🔐 Secret Management

### Secret Storage: Azure Key Vault

**Why Azure Key Vault?**
- ✅ Native Azure integration
- ✅ Managed Identity support (no credentials needed)
- ✅ Automatic encryption at rest
- ✅ Fine-grained access control (RBAC)
- ✅ Audit logging
- ✅ Secret versioning & rotation

### Secret Naming Convention

```
Pattern: {secret-type}-{userId}

Examples:
- github-token-user_abc123
- copilot-token-user_abc123
- ssh-private-key-user_abc123
- ssh-public-key-user_abc123
- custom-env-vars-user_abc123
```

### Secret Injection Process

#### Step 1: Fetch from Key Vault

```go
// Fetch GitHub token
token, err := secretProvider.GetSecret(ctx, fmt.Sprintf("github-token-%s", userID))
if err != nil {
    return fmt.Errorf("failed to fetch GitHub token: %w", err)
}
```

#### Step 2: Inject into Filesystem

**GitHub Token:**

```bash
# ~/.gitconfig
[user]
    name = John Doe
    email = john@example.com
[credential]
    helper = store

# ~/.git-credentials
https://{token}:x-oauth-basic@github.com
```

**GitHub CLI:**

```yaml
# ~/.config/gh/hosts.yml
github.com:
    oauth_token: {token}
    user: johndoe
    git_protocol: https
```

**GitHub Copilot:**

```json
// ~/.config/github-copilot/hosts.json
{
  "github_token": "{copilot-token}"
}
```

**SSH Keys:**

```bash
# ~/.ssh/id_rsa (chmod 600)
-----BEGIN OPENSSH PRIVATE KEY-----
{private-key-content}
-----END OPENSSH PRIVATE KEY-----

# ~/.ssh/id_rsa.pub (chmod 644)
ssh-rsa AAAAB3NzaC... user@host
```

### Secret Rotation

**Strategy:** Zero-downtime rotation

```
Periodic check (every 1 hour)
    ↓
Fetch latest secret versions
    ↓
Compare with current secrets (version check)
    ↓
If changed:
    ├─→ Update filesystem
    ├─→ Reload services (if needed)
    └─→ Log rotation event
    ↓
Continue monitoring
```

**No Restart Required:**
- Git operations pick up new credentials automatically
- SSH keys loaded on connection (not at startup)
- VS Code extensions check tokens dynamically

---

## 🔗 Integration Guide

### Integration with Go Agent

The Go agent creates containers with the new images and passes necessary environment variables.

#### Container Creation

```go
// apps/agent/internal/azure/container.go

func (c *Client) CreateEnvironmentContainer(ctx context.Context, req EnvironmentRequest) error {
    // Map base images to Docker image names
    imageMap := map[string]string{
        "node":   "dev8registry.azurecr.io/dev8-nodejs:latest",
        "python": "dev8registry.azurecr.io/dev8-python:latest",
        "go":     "dev8registry.azurecr.io/dev8-golang:latest",
        "rust":   "dev8registry.azurecr.io/dev8-rust:latest",
    }

    containerGroup := armcontainerinstance.ContainerGroup{
        Location: to.Ptr(req.Region),
        Properties: &armcontainerinstance.ContainerGroupPropertiesProperties{
            Containers: []*armcontainerinstance.Container{
                {
                    Name: to.Ptr("workspace"),
                    Properties: &armcontainerinstance.ContainerProperties{
                        Image: to.Ptr(imageMap[req.BaseImage]),
                        
                        // Environment variables for supervisor
                        EnvironmentVariables: []*armcontainerinstance.EnvironmentVariable{
                            {
                                Name:  to.Ptr("ENVIRONMENT_ID"),
                                Value: to.Ptr(req.EnvironmentID),
                            },
                            {
                                Name:  to.Ptr("USER_ID"),
                                Value: to.Ptr(req.UserID),
                            },
                            {
                                Name:  to.Ptr("AZURE_KEY_VAULT_NAME"),
                                Value: to.Ptr(c.config.KeyVaultName),
                            },
                            {
                                Name:        to.Ptr("AZURE_TENANT_ID"),
                                SecureValue: to.Ptr(c.config.TenantID),
                            },
                            {
                                Name:        to.Ptr("AZURE_CLIENT_ID"),
                                SecureValue: to.Ptr(c.config.ClientID),
                            },
                            {
                                Name:        to.Ptr("AZURE_CLIENT_SECRET"),
                                SecureValue: to.Ptr(c.config.ClientSecret),
                            },
                        },
                        
                        // Exposed ports
                        Ports: []*armcontainerinstance.ContainerPort{
                            {Port: to.Ptr[int32](8080)}, // code-server
                            {Port: to.Ptr[int32](2222)}, // SSH
                        },
                        
                        // Azure Files volume mount
                        VolumeMounts: []*armcontainerinstance.VolumeMount{
                            {
                                Name:      to.Ptr("workspace"),
                                MountPath: to.Ptr("/workspace"),
                            },
                        },
                        
                        // Resource limits
                        Resources: &armcontainerinstance.ResourceRequirements{
                            Requests: &armcontainerinstance.ResourceRequests{
                                CPU:        to.Ptr[float64](req.CPUCores),
                                MemoryInGB: to.Ptr[float64](req.MemoryGB)),
                            },
                        },
                    },
                },
            },
            
            // Public IP configuration
            IPAddress: &armcontainerinstance.IPAddress{
                Type: to.Ptr(armcontainerinstance.ContainerGroupIPAddressTypePublic),
                Ports: []*armcontainerinstance.Port{
                    {Port: to.Ptr[int32](8080)},
                    {Port: to.Ptr[int32](2222)},
                },
                DNSNameLabel: to.Ptr(fmt.Sprintf("dev8-%s", req.EnvironmentID)),
            },
            
            // Azure Files volume
            Volumes: []*armcontainerinstance.Volume{
                {
                    Name: to.Ptr("workspace"),
                    AzureFile: &armcontainerinstance.AzureFileVolume{
                        ShareName:          to.Ptr(req.FileShareName),
                        StorageAccountName: to.Ptr(c.config.StorageAccountName),
                        StorageAccountKey:  to.Ptr(c.config.StorageAccountKey),
                    },
                },
            },
        },
        
        // Tags for resource management
        Tags: map[string]*string{
            "environment-id": to.Ptr(req.EnvironmentID),
            "user-id":        to.Ptr(req.UserID),
            "base-image":     to.Ptr(req.BaseImage),
            "managed-by":     to.Ptr("dev8-agent"),
        },
    }
    
    // Create container group
    poller, err := c.aciClient.BeginCreateOrUpdate(
        ctx,
        c.config.ResourceGroupName,
        req.ContainerGroupName,
        containerGroup,
        nil,
    )
    if err != nil {
        return fmt.Errorf("failed to create container: %w", err)
    }
    
    // Wait for completion
    _, err = poller.PollUntilDone(ctx, nil)
    return err
}
```

#### Health Check Integration

```go
// apps/agent/internal/services/environment.go

func (s *EnvironmentService) CheckEnvironmentHealth(ctx context.Context, envID string) (*HealthStatus, error) {
    env, err := s.getEnvironment(envID)
    if err != nil {
        return nil, err
    }

    // Call supervisor health endpoint (internal network)
    healthURL := fmt.Sprintf("http://%s:9000/health", env.ACIPublicIP)
    
    resp, err := http.Get(healthURL)
    if err != nil {
        return &HealthStatus{
            Healthy: false,
            Error:   err.Error(),
        }, nil
    }
    defer resp.Body.Close()

    var health HealthStatus
    if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
        return nil, err
    }

    return &health, nil
}
```

---

## 📅 Implementation Roadmap

### Phase 1: Foundation (Week 1) - 5-8 hours

**Goal:** Set up project structure and base image

**Tasks:**
- [ ] Create supervisor project structure
  - Create Go module: `apps/supervisor`
  - Set up directory layout
  - Initialize go.mod with dependencies
- [ ] Implement configuration system
  - YAML config parser
  - Environment variable override
  - Validation logic
- [ ] Create base Dockerfile
  - Multi-stage build setup
  - Install code-server
  - Configure SSH server
  - User setup (dev8)
- [ ] Build and test base image locally
  - Test code-server startup
  - Test SSH server
  - Verify permissions

**Deliverable:** Working base image that can be built and run locally

### Phase 2: Core Supervisor Features (Week 2) - 12-15 hours

**Goal:** Implement process management and secret injection

**Tasks:**
- [ ] Implement process manager
  - Start/stop/restart logic
  - Process monitoring
  - Auto-restart on failure
  - Graceful shutdown handling
- [ ] Add Azure Key Vault integration
  - Azure SDK setup
  - Managed Identity authentication
  - Secret fetching logic
- [ ] Implement secret injector
  - GitHub token injection
  - Copilot token injection
  - SSH key injection
  - File permission management
- [ ] Add health monitoring
  - Process status checks
  - HTTP endpoint checks
  - Auto-recovery logic
- [ ] Create management API
  - HTTP server on port 9000
  - Health endpoint
  - Status endpoint
  - Metrics endpoint

**Deliverable:** Functioning supervisor that manages processes and injects secrets

### Phase 3: Language Images (Week 2-3) - 8-10 hours

**Goal:** Build language-specific images

**Tasks:**
- [ ] Build Node.js image
  - Install Node.js 20 LTS
  - Install npm, pnpm, yarn
  - Install TypeScript tooling
  - Pre-install VS Code extensions
- [ ] Build Python image
  - Install Python 3.11
  - Install pip, pipenv, poetry
  - Install development tools
  - Pre-install VS Code extensions
- [ ] Build Go image
  - Install Go 1.21
  - Install gopls, delve
  - Pre-install VS Code extension
- [ ] Build Rust image
  - Install Rust toolchain
  - Install rust-analyzer
  - Pre-install VS Code extension
- [ ] Optimize image sizes
  - Review layer caching
  - Remove unnecessary files
  - Compress where possible

**Deliverable:** 4 language-specific images ready for deployment

### Phase 4: Integration (Week 3) - 8-10 hours

**Goal:** Integrate with Go agent and test end-to-end

**Tasks:**
- [ ] Update Go agent
  - Add image map configuration
  - Update container creation logic
  - Add environment variable passing
  - Implement health check calls
- [ ] Test container creation
  - Create test environments
  - Verify supervisor starts correctly
  - Check secret injection
  - Test process management
- [ ] Test connections
  - Browser VS Code access
  - SSH terminal access
  - VS Code Remote-SSH
- [ ] Test persistence
  - Create files in workspace
  - Stop/start container
  - Verify files persist
- [ ] Test health monitoring
  - Kill processes manually
  - Verify auto-restart
  - Check health API responses

**Deliverable:** Working end-to-end integration with Go agent

### Phase 5: Testing & Quality (Week 3-4) - 10-12 hours

**Goal:** Comprehensive testing and documentation

**Tasks:**
- [ ] Unit tests
  - Process manager tests
  - Secret injector tests (with mocks)
  - Health checker tests
  - Configuration tests
- [ ] Integration tests
  - Azure Key Vault integration
  - Full supervisor lifecycle
  - Container deployment
- [ ] E2E tests
  - Create environment → connect → code → persist
  - Multiple concurrent environments
  - Secret rotation
  - Failure recovery
- [ ] Load testing
  - 100+ concurrent environments
  - Resource usage monitoring
  - Performance benchmarking
- [ ] Security audit
  - Review secret handling
  - Check file permissions
  - Verify network isolation
  - Test privilege escalation

**Deliverable:** Test coverage > 80%, all critical paths tested

### Phase 6: Documentation (Week 4) - 6-8 hours

**Goal:** Comprehensive documentation for users and developers

**Tasks:**
- [ ] User documentation
  - How to connect via browser
  - How to connect via SSH
  - How to configure GitHub Copilot
  - How to manage secrets
  - Troubleshooting guide
- [ ] Developer documentation
  - Architecture overview
  - Supervisor internals
  - Building custom images
  - Extending functionality
  - API reference
- [ ] Operations documentation
  - Deployment procedures
  - Monitoring setup
  - Backup & restore
  - Scaling guidelines
  - Incident response

**Deliverable:** Complete documentation published

### Phase 7: Production Deployment (Week 4) - 4-6 hours

**Goal:** Deploy to production and monitor

**Tasks:**
- [ ] Push images to Azure Container Registry
  - Tag with version numbers
  - Update latest tags
- [ ] Deploy to staging
  - Create test environments
  - Run smoke tests
  - Verify monitoring
- [ ] Deploy to production
  - Gradual rollout
  - Monitor error rates
  - Check performance metrics
- [ ] Set up monitoring
  - Configure alerts
  - Set up dashboards
  - Enable logging
- [ ] Post-deployment tasks
  - Performance tuning
  - Bug fixes
  - User feedback collection

**Deliverable:** Production deployment complete, system stable

---

## 🧪 Testing Strategy

### Unit Tests

**Coverage Target:** 80%+

**Key Areas:**
- Configuration parsing and validation
- Process lifecycle management
- Secret injection logic
- Health check logic
- API handlers

**Tools:**
- Go testing package (`testing`)
- testify for assertions
- Mock Azure Key Vault client

**Example:**

```go
func TestProcessManager_StartCodeServer(t *testing.T) {
    pm := process.NewManager(mockConfig)
    
    err := pm.StartCodeServer(context.Background())
    assert.NoError(t, err)
    
    status := pm.GetStatus()
    assert.Equal(t, process.StatusRunning, status["code-server"])
}
```

### Integration Tests

**Key Scenarios:**
- Supervisor + Azure Key Vault (test environment)
- Supervisor + mock services
- Full container lifecycle
- Secret rotation

**Environment:**
- Azure test subscription
- Test Key Vault with sample secrets
- Docker test containers

### E2E Tests

**Critical Flows:**
1. Create environment → inject secrets → connect via SSH → run commands
2. Create environment → connect via browser → edit code → save
3. Create environment → stop → start → verify persistence
4. Secret rotation → verify no downtime
5. Process failure → verify auto-restart

**Tools:**
- Playwright for browser automation
- SSH client library for SSH tests
- Custom test scripts

### Load Testing

**Metrics:**
- Container startup time
- Health check latency
- Secret injection time
- Resource usage per container
- Maximum concurrent environments

**Tool:** Go-based load testing script

**Target:**
- Support 1000+ concurrent environments
- < 30s startup time
- < 100ms health check response

### Performance Benchmarks

```
Metric                          Target      Measured
─────────────────────────────────────────────────────
Container startup time          < 30s       TBD
Supervisor binary size          < 15MB      TBD
Supervisor memory usage         < 20MB      TBD
Base image size                 < 800MB     TBD
Node.js image size              < 1.2GB     TBD
Health check response time      < 100ms     TBD
Secret injection time           < 5s        TBD
Process auto-restart time       < 30s       TBD
```

---

## 🔐 Security & Monitoring

### Security Features

#### 1. Non-Root Execution
- All processes run as `dev8` user (UID 1000)
- No root login via SSH
- Sudo access only for specific commands

#### 2. Authentication
- SSH: Key-based only, no passwords
- code-server: Authentication handled by proxy/supervisor
- Secrets: Fetched from Azure Key Vault with Managed Identity

#### 3. Network Security
- Supervisor API (port 9000): Internal only, not exposed publicly
- code-server (port 8080): Public, but requires authentication
- SSH (port 2222): Public, key-based auth only

#### 4. Secret Management
- Secrets never logged or printed
- Secrets stored in Azure Key Vault (encrypted at rest)
- Secret rotation support
- Least privilege access (RBAC)

#### 5. Container Isolation
- Each environment runs in separate container
- Resource limits enforced (CPU, memory)
- Network isolation between environments

### Monitoring & Observability

#### Metrics to Collect

**Process Metrics:**
- Process uptime
- Restart count
- Memory usage
- CPU usage

**Connection Metrics:**
- Active SSH connections
- Active VS Code sessions
- Connection duration
- Failed connection attempts

**Secret Metrics:**
- Secret injection success/failure rate
- Secret rotation events
- Time since last secret update

**Health Metrics:**
- Health check pass/fail rate
- Health check latency
- Service availability percentage

#### Logging

**Log Format:** Structured JSON

**Log Levels:**
- DEBUG: Detailed execution trace
- INFO: Normal operations
- WARN: Recoverable issues
- ERROR: Errors that don't stop service
- FATAL: Critical errors that stop service

**Example Log:**

```json
{
  "timestamp": "2024-10-06T10:30:15Z",
  "level": "info",
  "message": "Process started successfully",
  "environment_id": "env-abc123",
  "user_id": "user-xyz789",
  "process": "code-server",
  "pid": 42
}
```

**Log Destinations:**
- stdout/stderr (captured by Azure)
- Azure Log Analytics (optional)
- Custom logging service (optional)

#### Alerting

**Critical Alerts:**
- Process restart exceeded max retries
- Health check failures > 3 consecutive
- Secret injection failed
- Container out of memory
- CPU throttling

**Warning Alerts:**
- Process restarted
- High memory usage (> 80%)
- High CPU usage (> 80%)
- Slow health check response (> 500ms)

#### Dashboards

**Supervisor Dashboard:**
- Environment count
- Active processes
- Health status
- Resource usage
- Error rate

**User Dashboard:**
- My environments
- Connection status
- Resource usage
- Cost tracking

---

## 📚 Reference Documentation

### Documentation to Create

1. **SUPERVISOR_ARCHITECTURE.md**
   - Detailed architecture explanation
   - Component interactions
   - Data flow diagrams
   - Decision rationale

2. **DOCKER_IMAGES.md**
   - Image descriptions
   - Customization guide
   - Size optimization tips
   - Troubleshooting

3. **SECRET_MANAGEMENT.md**
   - How secrets are stored
   - Secret injection process
   - Secret rotation procedure
   - Security best practices

4. **DEVELOPMENT_GUIDE.md**
   - Local development setup
   - Building supervisor
   - Building Docker images
   - Testing procedures

5. **TROUBLESHOOTING.md**
   - Common issues & solutions
   - Debugging techniques
   - Log analysis
   - Support escalation

6. **API_REFERENCE.md**
   - Supervisor management API
   - Request/response examples
   - Error codes
   - Authentication

### External References

- [code-server Documentation](https://github.com/coder/code-server)
- [Azure SDK for Go](https://github.com/Azure/azure-sdk-for-go)
- [Azure Key Vault](https://docs.microsoft.com/azure/key-vault/)
- [Docker Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [OpenSSH Server](https://www.openssh.com/manual.html)
- [GitHub CLI](https://cli.github.com/)
- [GitHub Copilot](https://github.com/features/copilot)
- [Azure Container Instances](https://docs.microsoft.com/azure/container-instances/)
- [Azure Files](https://docs.microsoft.com/azure/storage/files/)

---

## ✅ Success Criteria

### Performance Targets

- ✅ Container startup time < 30 seconds
- ✅ Base image size < 800MB
- ✅ Language images < 3GB
- ✅ Supervisor binary < 15MB
- ✅ Supervisor memory usage < 20MB
- ✅ Health check response < 100ms
- ✅ Secret injection time < 5 seconds

### Reliability Targets

- ✅ 100% success rate for secret injection (under normal conditions)
- ✅ Auto-recovery from process failures within 30s
- ✅ Support 1000+ concurrent environments
- ✅ 99.9% uptime for supervisor service
- ✅ Zero-downtime secret rotation

### Functional Requirements

- ✅ Browser-based VS Code access works
- ✅ SSH terminal access works
- ✅ VS Code Remote-SSH extension works
- ✅ GitHub CLI configured automatically
- ✅ GitHub Copilot works (when configured)
- ✅ Files persist across container restarts
- ✅ Process failures auto-recover

### Security Requirements

- ✅ Non-root execution
- ✅ SSH key-only authentication
- ✅ Secrets encrypted in Key Vault
- ✅ Secrets never logged
- ✅ Network isolation enforced
- ✅ Audit logging enabled

---

## 🔄 Future Enhancements

### Phase 2: Multi-IDE Support

- Add JetBrains Projector support
- Add Jupyter Notebook server
- Add Vim/Neovim server with LSP
- Add Emacs server

### Phase 3: Advanced Features

- Workspace snapshots (point-in-time backup)
- Collaborative editing (multiple users)
- GPU support for ML/AI workloads
- Custom Docker layers (user-defined)
- Environment templates marketplace

### Phase 4: Platform Expansion

- AWS ECS/Fargate support
- GCP Cloud Run support
- Kubernetes orchestration
- Multi-cloud load balancing
- Hybrid cloud support

### Phase 5: Developer Experience

- VS Code extension for Dev8.dev
- CLI tool for environment management
- Desktop app (Electron-based)
- Mobile app (view-only mode)

---

## 📞 Support & Contribution

### Getting Help

- **Documentation:** See `docs/` directory
- **Issues:** https://github.com/VAIBHAVSING/Dev8.dev/issues
- **Discord:** https://discord.gg/xE2u4b8S8g
- **Email:** support@dev8.dev

### Contributing

We welcome contributions! See:
- `CONTRIBUTING.md` for guidelines
- `CODE_OF_CONDUCT.md` for community standards
- Open issues labeled `good first issue`

### Maintainers

- @VAIBHAVSING - Project Lead
- @dev8-team - Core Team

---

**Last Updated:** 2024-10-06  
**Version:** 1.0  
**Status:** ✅ Planning Complete - Ready for Implementation

---

<div align="center">
  <strong>Built with ❤️ by the Dev8.dev Team</strong>
</div>
