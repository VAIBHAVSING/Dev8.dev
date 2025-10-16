# Dev8.dev Docker Deployment Guide

**Complete guide for local development and production deployment on Azure Container Instances**

---

## 📑 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Setup](#local-development-setup)
4. [Building Docker Images](#building-docker-images)
5. [Production Deployment on Azure](#production-deployment-on-azure)
6. [Environment Configuration](#environment-configuration)
7. [Supervisor Management](#supervisor-management)
8. [Monitoring & Health Checks](#monitoring--health-checks)
9. [Backup & Persistence](#backup--persistence)
10. [Troubleshooting](#troubleshooting)
11. [Security Best Practices](#security-best-practices)

---

## 🎯 Overview

Dev8.dev provides production-ready Docker images optimized for Azure Container Instances (ACI). The architecture includes:

```
┌─────────────────────────────────────────────────────────┐
│        User Access Layer (Browser/SSH/VS Code)          │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│              Azure Container Instance                    │
│  ┌────────────────────────────────────────────────┐    │
│  │  Workspace Supervisor (PID 1)                  │    │
│  │  • Resource Management & Optimization          │    │
│  │  • Health Monitoring & Auto-Recovery           │    │
│  │  • Automated Backups                           │    │
│  │  • Activity Reporting                          │    │
│  └────────────────────────────────────────────────┘    │
│                      ↓                                   │
│  ┌────────────────────────────────────────────────┐    │
│  │  Services:                                      │    │
│  │  • code-server (Port 8080) - VS Code in Browser│    │
│  │  • SSH Server (Port 2222) - Terminal Access    │    │
│  │  • Health API (Port 9000) - Metrics            │    │
│  └────────────────────────────────────────────────┘    │
│                      ↓                                   │
│  ┌────────────────────────────────────────────────┐    │
│  │  Languages & Tools:                             │    │
│  │  • Node.js 20 + Bun + pnpm/yarn                │    │
│  │  • Python 3.11 + poetry + pip                  │    │
│  │  • Go 1.21 + standard toolchain                │    │
│  │  • Rust + cargo + rustup                       │    │
│  │  • GitHub Copilot + AI CLIs                    │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Azure Files (Persistent Storage) - /workspace          │
│  • User code and projects                               │
│  • Configuration files                                  │
│  • Installed packages and dependencies                  │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│  Azure Blob Storage (Backups) or AWS S3                │
│  • Automated workspace snapshots                        │
│  • Version history and restore points                   │
└─────────────────────────────────────────────────────────┘
```

### Image Architecture

**Base Image** (`dev8-base:latest`) ~800MB
- Ubuntu 22.04 LTS
- Essential system tools
- SSH server (hardened, port 2222)
- GitHub CLI
- Workspace supervisor binary

**Production Image** (`dev8-production:latest`) ~3.5GB
- All base image features
- Node.js 20 LTS + Bun runtime
- Python 3.11 + poetry
- Go 1.21 toolchain
- Rust stable + cargo
- code-server (VS Code)
- Azure CLI + AWS CLI
- Pre-installed VS Code extensions
- Production-optimized configuration

---

## 🔧 Prerequisites

### For Local Development

- Docker Desktop 20.10+ or Docker Engine
- 8GB RAM minimum (16GB recommended)
- 50GB disk space
- Git

### For Production Deployment

- Azure subscription with Container Instances enabled
- Azure Container Registry (ACR) or Docker Hub account
- Azure Files storage account (for persistent workspaces)
- Azure Blob Storage (for backups) or AWS S3
- Azure CLI installed locally

```bash
# Install Azure CLI (Linux/macOS)
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash

# Or via Homebrew (macOS)
brew install azure-cli

# Login to Azure
az login
```

---

## 🚀 Local Development Setup

### Step 1: Clone Repository

```bash
git clone https://github.com/VAIBHAVSING/Dev8.dev.git
cd Dev8.dev
```

### Step 2: Build Base Image

```bash
cd docker

# Build base image (includes supervisor)
docker build -t dev8-base:latest -f base/Dockerfile ..

# Verify base image
docker images | grep dev8-base
```

### Step 3: Build Production Image

```bash
# Build production image with all languages
docker build -t dev8-production:latest -f mvp/Dockerfile ..

# Verify production image
docker images | grep dev8-production
```

### Step 4: Run Container Locally

```bash
# Create a test workspace directory
mkdir -p ~/dev8-workspace

# Run production container
docker run -it --rm \
  --name dev8-local \
  -p 8080:8080 \
  -p 2222:2222 \
  -p 9000:9000 \
  -e GITHUB_TOKEN="ghp_your_github_token_here" \
  -e GIT_USER_NAME="Your Name" \
  -e GIT_USER_EMAIL="your@email.com" \
  -e SSH_PUBLIC_KEY="$(cat ~/.ssh/id_rsa.pub)" \
  -v ~/dev8-workspace:/workspace \
  dev8-production:latest
```

### Step 5: Access Your Workspace

**Via Browser (VS Code):**
```
http://localhost:8080
Password: dev8dev (default, can be changed via CODE_SERVER_PASSWORD env var)
```

**Via SSH:**
```bash
ssh -p 2222 dev8@localhost
```

**Health Check:**
```bash
curl http://localhost:9000/health
```

### Step 6: Test Supervisor Features

```bash
# SSH into container
ssh -p 2222 dev8@localhost

# Check supervisor status
curl localhost:9000/health

# View supervisor logs
cat ~/.logs/supervisor.log

# Test backup (if configured)
~/.backup-scripts/backup.sh
```

---

## 🔨 Building Docker Images

### Using Build Script

```bash
cd docker

# Build all images
./build.sh

# Build specific image
./build.sh --image production

# Build with custom tag
./build.sh --tag v1.0.0

# Build and push to registry
./build.sh --push --registry myregistry.azurecr.io
```

### Manual Build Process

```bash
# Build base image
docker build \
  -t myregistry.azurecr.io/dev8-base:latest \
  -f docker/base/Dockerfile \
  .

# Build production image
docker build \
  -t myregistry.azurecr.io/dev8-production:latest \
  -f docker/mvp/Dockerfile \
  .

# Multi-platform build for ARM/AMD64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t myregistry.azurecr.io/dev8-production:latest \
  -f docker/mvp/Dockerfile \
  --push \
  .
```

### Build Optimization Tips

1. **Layer Caching**: Build base image first, then production
2. **BuildKit**: Enable for faster builds
   ```bash
   export DOCKER_BUILDKIT=1
   ```
3. **Multi-stage**: Images already use multi-stage builds for optimization
4. **Size Reduction**: 
   - Remove apt cache after installs ✅
   - Use --no-install-recommends ✅
   - Clean up temporary files ✅

---

## ☁️ Production Deployment on Azure

### Architecture Overview

```
Production Deployment Architecture:

┌──────────────────────────────────────────────────────────┐
│  Dev8.dev Platform (apps/web + apps/agent)              │
│  • User management                                       │
│  • Environment creation API                              │
└──────────────────────────────────────────────────────────┘
                          ↓ Create Container
┌──────────────────────────────────────────────────────────┐
│  Azure Container Registry                                │
│  • dev8registry.azurecr.io/dev8-base:latest             │
│  • dev8registry.azurecr.io/dev8-production:latest       │
└──────────────────────────────────────────────────────────┘
                          ↓ Pull Image
┌──────────────────────────────────────────────────────────┐
│  Azure Container Instance (per user workspace)           │
│  • Resource Group: dev8-environments                     │
│  • CPU: 2 cores, Memory: 4GB (configurable)             │
│  • Public IP with DNS label                              │
│  • Environment variables (secrets via SecureValue)       │
└──────────────────────────────────────────────────────────┘
                          ↓ Mount Volume
┌──────────────────────────────────────────────────────────┐
│  Azure Files Share (per user)                            │
│  • Storage Account: dev8storage                          │
│  • Share: workspace-{userId}                             │
│  • Persistent across container restarts                  │
└──────────────────────────────────────────────────────────┘
                          ↓ Backup To
┌──────────────────────────────────────────────────────────┐
│  Azure Blob Storage or AWS S3                            │
│  • Container/Bucket: dev8-backups                        │
│  • Automated snapshots every 6 hours                     │
│  • Retention: 7 days                                     │
└──────────────────────────────────────────────────────────┘
```

### Step 1: Create Azure Resources

```bash
# Set variables
RESOURCE_GROUP="dev8-production"
LOCATION="eastus"
ACR_NAME="dev8registry"
STORAGE_ACCOUNT="dev8storage"

# Create resource group
az group create \
  --name $RESOURCE_GROUP \
  --location $LOCATION

# Create Azure Container Registry
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $ACR_NAME \
  --sku Basic \
  --admin-enabled true

# Create storage account for Azure Files
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --kind StorageV2

# Create storage container for backups
az storage container create \
  --account-name $STORAGE_ACCOUNT \
  --name dev8-backups \
  --auth-mode login
```

### Step 2: Push Images to ACR

```bash
# Login to ACR
az acr login --name $ACR_NAME

# Tag images
docker tag dev8-base:latest $ACR_NAME.azurecr.io/dev8-base:latest
docker tag dev8-production:latest $ACR_NAME.azurecr.io/dev8-production:latest

# Push images
docker push $ACR_NAME.azurecr.io/dev8-base:latest
docker push $ACR_NAME.azurecr.io/dev8-production:latest

# Verify images in registry
az acr repository list --name $ACR_NAME --output table
```

### Step 3: Create Azure Files Share (Per User)

```bash
# Get storage account key
STORAGE_KEY=$(az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_ACCOUNT \
  --query "[0].value" -o tsv)

# Create file share for user
USER_ID="user123"
az storage share create \
  --account-name $STORAGE_ACCOUNT \
  --account-key $STORAGE_KEY \
  --name "workspace-$USER_ID" \
  --quota 10  # 10GB quota
```

### Step 4: Deploy Container Instance

#### Option A: Azure CLI

```bash
# Get ACR credentials
ACR_USERNAME=$(az acr credential show --name $ACR_NAME --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv)

# Deploy container
az container create \
  --resource-group $RESOURCE_GROUP \
  --name "dev8-workspace-$USER_ID" \
  --image $ACR_NAME.azurecr.io/dev8-production:latest \
  --registry-login-server $ACR_NAME.azurecr.io \
  --registry-username $ACR_USERNAME \
  --registry-password $ACR_PASSWORD \
  --cpu 2 \
  --memory 4 \
  --ports 8080 2222 \
  --dns-name-label "dev8-$USER_ID" \
  --environment-variables \
    ENVIRONMENT_ID="env-$USER_ID" \
    USER_ID="$USER_ID" \
    AGENT_URL="https://api.dev8.dev" \
    AZURE_STORAGE_ACCOUNT="$STORAGE_ACCOUNT" \
    AZURE_FILE_SHARE="workspace-$USER_ID" \
  --secure-environment-variables \
    GITHUB_TOKEN="ghp_user_github_token" \
    AZURE_STORAGE_KEY="$STORAGE_KEY" \
  --azure-file-volume-account-name $STORAGE_ACCOUNT \
  --azure-file-volume-account-key $STORAGE_KEY \
  --azure-file-volume-share-name "workspace-$USER_ID" \
  --azure-file-volume-mount-path /workspace

# Get container details
az container show \
  --resource-group $RESOURCE_GROUP \
  --name "dev8-workspace-$USER_ID" \
  --query "{FQDN:ipAddress.fqdn,IP:ipAddress.ip,Status:instanceView.state}" \
  --output table
```

#### Option B: Go Agent Integration (Recommended)

Update `apps/agent/internal/azure/client.go`:

```go
func (c *Client) CreateWorkspace(ctx context.Context, req WorkspaceRequest) (*Workspace, error) {
    containerGroup := armcontainerinstance.ContainerGroup{
        Location: to.Ptr(c.config.Location),
        Properties: &armcontainerinstance.ContainerGroupPropertiesProperties{
            Containers: []*armcontainerinstance.Container{
                {
                    Name: to.Ptr("workspace"),
                    Properties: &armcontainerinstance.ContainerProperties{
                        Image: to.Ptr(fmt.Sprintf("%s.azurecr.io/dev8-production:latest", 
                            c.config.RegistryName)),
                        
                        Resources: &armcontainerinstance.ResourceRequirements{
                            Requests: &armcontainerinstance.ResourceRequests{
                                CPU:        to.Ptr[float64](2.0),
                                MemoryInGB: to.Ptr[float64](4.0),
                            },
                        },
                        
                        Ports: []*armcontainerinstance.ContainerPort{
                            {Port: to.Ptr[int32](8080)},  // code-server
                            {Port: to.Ptr[int32](2222)},  // SSH
                        },
                        
                        EnvironmentVariables: []*armcontainerinstance.EnvironmentVariable{
                            {Name: to.Ptr("ENVIRONMENT_ID"), Value: to.Ptr(req.EnvironmentID)},
                            {Name: to.Ptr("USER_ID"), Value: to.Ptr(req.UserID)},
                            {Name: to.Ptr("AGENT_URL"), Value: to.Ptr(c.config.AgentURL)},
                            {Name: to.Ptr("AZURE_STORAGE_ACCOUNT"), Value: to.Ptr(c.config.StorageAccount)},
                            {Name: to.Ptr("AZURE_FILE_SHARE"), Value: to.Ptr(req.FileShare)},
                            {Name: to.Ptr("GITHUB_TOKEN"), SecureValue: to.Ptr(req.GitHubToken)},
                            {Name: to.Ptr("GIT_USER_NAME"), Value: to.Ptr(req.GitUserName)},
                            {Name: to.Ptr("GIT_USER_EMAIL"), Value: to.Ptr(req.GitUserEmail)},
                        },
                        
                        VolumeMounts: []*armcontainerinstance.VolumeMount{
                            {
                                Name:      to.Ptr("workspace"),
                                MountPath: to.Ptr("/workspace"),
                            },
                        },
                    },
                },
            },
            
            OSType: to.Ptr(armcontainerinstance.OperatingSystemTypesLinux),
            RestartPolicy: to.Ptr(armcontainerinstance.ContainerGroupRestartPolicyOnFailure),
            
            IPAddress: &armcontainerinstance.IPAddress{
                Type: to.Ptr(armcontainerinstance.ContainerGroupIPAddressTypePublic),
                Ports: []*armcontainerinstance.Port{
                    {Port: to.Ptr[int32](8080), Protocol: to.Ptr(armcontainerinstance.ContainerGroupNetworkProtocolTCP)},
                    {Port: to.Ptr[int32](2222), Protocol: to.Ptr(armcontainerinstance.ContainerGroupNetworkProtocolTCP)},
                },
                DNSNameLabel: to.Ptr(fmt.Sprintf("dev8-%s", req.EnvironmentID)),
            },
            
            Volumes: []*armcontainerinstance.Volume{
                {
                    Name: to.Ptr("workspace"),
                    AzureFile: &armcontainerinstance.AzureFileVolume{
                        ShareName:          to.Ptr(req.FileShare),
                        StorageAccountName: to.Ptr(c.config.StorageAccount),
                        StorageAccountKey:  to.Ptr(c.config.StorageKey),
                    },
                },
            },
        },
        
        Tags: map[string]*string{
            "environment-id": to.Ptr(req.EnvironmentID),
            "user-id":        to.Ptr(req.UserID),
            "managed-by":     to.Ptr("dev8-agent"),
        },
    }
    
    poller, err := c.aciClient.BeginCreateOrUpdate(
        ctx,
        c.config.ResourceGroup,
        req.ContainerName,
        containerGroup,
        nil,
    )
    if err != nil {
        return nil, fmt.Errorf("failed to create container: %w", err)
    }
    
    resp, err := poller.PollUntilDone(ctx, nil)
    if err != nil {
        return nil, fmt.Errorf("failed to wait for container creation: %w", err)
    }
    
    return &Workspace{
        ID:          req.EnvironmentID,
        FQDN:        *resp.Properties.IPAddress.Fqdn,
        IP:          *resp.Properties.IPAddress.IP,
        Status:      string(*resp.Properties.InstanceView.State),
        VSCodeURL:   fmt.Sprintf("http://%s:8080", *resp.Properties.IPAddress.Fqdn),
        SSHURL:      fmt.Sprintf("ssh://dev8@%s:2222", *resp.Properties.IPAddress.Fqdn),
    }, nil
}
```

### Step 5: Configure Networking (Production)

For production, use Virtual Network integration:

```bash
# Create virtual network
az network vnet create \
  --resource-group $RESOURCE_GROUP \
  --name dev8-vnet \
  --address-prefix 10.0.0.0/16 \
  --subnet-name containers \
  --subnet-prefix 10.0.1.0/24

# Create network profile for ACI
az network profile create \
  --resource-group $RESOURCE_GROUP \
  --name dev8-network-profile \
  --vnet-name dev8-vnet \
  --subnet containers

# Deploy container with VNet integration
# (Add --vnet and --subnet flags to az container create)
```

---

## ⚙️ Environment Configuration

### Required Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ENVIRONMENT_ID` | Unique environment identifier | `env-abc123` | Yes |
| `USER_ID` | User identifier | `user-xyz789` | Yes |
| `AGENT_URL` | Dev8.dev agent API URL | `https://api.dev8.dev` | Yes |

### Optional Environment Variables

#### Git Configuration
| Variable | Description | Example |
|----------|-------------|---------|
| `GITHUB_TOKEN` | GitHub personal access token | `ghp_xxxxx` |
| `GIT_USER_NAME` | Git commit author name | `John Doe` |
| `GIT_USER_EMAIL` | Git commit author email | `john@example.com` |
| `SSH_PUBLIC_KEY` | SSH public key for access | `ssh-rsa AAAA...` |
| `SSH_PRIVATE_KEY` | SSH private key for Git | `-----BEGIN...` |

#### Code Server
| Variable | Description | Default |
|----------|-------------|---------|
| `CODE_SERVER_PASSWORD` | VS Code access password | `dev8dev` |
| `CODE_SERVER_AUTH` | Authentication method | `password` |

#### Azure Backup
| Variable | Description | Example |
|----------|-------------|---------|
| `AZURE_STORAGE_ACCOUNT` | Storage account name | `dev8storage` |
| `AZURE_STORAGE_KEY` | Storage account key | `xxx==` |
| `AZURE_FILE_SHARE` | File share name | `workspace-user123` |

#### AWS Backup
| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `xxx` |
| `S3_BUCKET` | S3 bucket name | `dev8-backups` |
| `AWS_REGION` | AWS region | `us-east-1` |

#### AI Tools
| Variable | Description | Example |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Claude API key | `sk-ant-...` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |

### Configuration Examples

#### Development Environment
```bash
docker run -it --rm \
  -p 8080:8080 -p 2222:2222 \
  -e ENVIRONMENT_ID="local-dev" \
  -e USER_ID="dev-user" \
  -e AGENT_URL="http://localhost:8000" \
  -e GITHUB_TOKEN="ghp_dev_token" \
  -e GIT_USER_NAME="Dev User" \
  -e GIT_USER_EMAIL="dev@localhost" \
  -v ~/workspace:/workspace \
  dev8-production:latest
```

#### Production Environment (via ACI)
```bash
# Secrets passed as SecureValue environment variables
# Configuration via supervisor config file
# See Step 4 deployment examples above
```

---

## 🛡️ Supervisor Management

The workspace supervisor manages resources, monitoring, and backups.

### Supervisor Configuration

Location: `/home/dev8/.config/supervisor/config.yaml`

```yaml
# Core settings
workspace_dir: /workspace
monitor_interval: 30s
log_file_path: /home/dev8/.logs/supervisor.log

# HTTP health server (internal)
http:
  enabled: true
  addr: :9000

# Activity reporting to agent
agent:
  enabled: true
  url: "${AGENT_URL}"
  environment_id: "${ENVIRONMENT_ID}"
  interval: 60s

# Automated backups
backup:
  enabled: true
  interval: 6h
  retention_count: 7
  provider: azure  # or s3
  azure:
    account_name: "${AZURE_STORAGE_ACCOUNT}"
    container_name: "workspaces"
  s3:
    bucket: "${S3_BUCKET}"
    region: "${AWS_REGION}"

# Volume mount management
mount:
  enabled: true
  azure_files:
    account_name: "${AZURE_STORAGE_ACCOUNT}"
    share_name: "${AZURE_FILE_SHARE}"
```

### Supervisor API Endpoints

**Health Check**
```bash
curl http://localhost:9000/health

# Response
{
  "status": "healthy",
  "uptime": "2h30m15s",
  "services": {
    "code-server": "running",
    "ssh": "running"
  },
  "workspace": {
    "size": "1.2GB",
    "files": 1234
  }
}
```

**Status Information**
```bash
curl http://localhost:9000/status

# Response
{
  "environment_id": "env-abc123",
  "user_id": "user-xyz789",
  "uptime": "2h30m15s",
  "cpu_usage": "15.2%",
  "memory_usage": "2.1GB / 4GB",
  "disk_usage": "1.2GB / 10GB",
  "last_backup": "2024-01-10T10:00:00Z",
  "next_backup": "2024-01-10T16:00:00Z"
}
```

**Metrics (Prometheus format)**
```bash
curl http://localhost:9000/metrics

# Response
supervisor_uptime_seconds 9015
supervisor_cpu_usage_percent 15.2
supervisor_memory_usage_bytes 2252341248
supervisor_disk_usage_bytes 1288490188
supervisor_last_backup_timestamp 1704880800
```

### Manual Supervisor Operations

```bash
# SSH into container
ssh -p 2222 dev8@your-container.eastus.azurecontainer.io

# Check supervisor status
curl localhost:9000/health

# View supervisor logs
tail -f ~/.logs/supervisor.log

# Trigger manual backup
~/.backup-scripts/backup.sh

# Check workspace usage
du -sh /workspace
df -h /workspace
```

---

## 📊 Monitoring & Health Checks

### Health Check Strategy

**3-Layer Health Checks:**

1. **Container Level** (Docker/ACI)
   ```dockerfile
   HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
       CMD curl -f http://localhost:9000/health || exit 1
   ```

2. **Supervisor Level** (Internal)
   - Monitors code-server process
   - Monitors SSH daemon
   - Checks resource usage
   - Reports to agent

3. **Platform Level** (Dev8.dev Agent)
   - Polls supervisor health endpoint
   - Tracks user activity
   - Manages auto-shutdown
   - Collects metrics

### Monitoring from Go Agent

```go
// apps/agent/internal/services/monitoring.go

func (s *MonitoringService) CheckWorkspaceHealth(ctx context.Context, envID string) error {
    workspace, err := s.getWorkspace(envID)
    if err != nil {
        return err
    }
    
    healthURL := fmt.Sprintf("http://%s:9000/health", workspace.InternalIP)
    
    ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
    defer cancel()
    
    req, err := http.NewRequestWithContext(ctx, "GET", healthURL, nil)
    if err != nil {
        return err
    }
    
    resp, err := s.httpClient.Do(req)
    if err != nil {
        return fmt.Errorf("health check failed: %w", err)
    }
    defer resp.Body.Close()
    
    if resp.StatusCode != http.StatusOK {
        return fmt.Errorf("unhealthy status: %d", resp.StatusCode)
    }
    
    var health HealthResponse
    if err := json.NewDecoder(resp.Body).Decode(&health); err != nil {
        return err
    }
    
    // Update workspace status in database
    return s.updateWorkspaceHealth(envID, health)
}
```

### Metrics Collection

Integrate with Azure Monitor or Prometheus:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'dev8-workspaces'
    static_configs:
      - targets:
        - 'workspace1.eastus.azurecontainer.io:9000'
        - 'workspace2.eastus.azurecontainer.io:9000'
```

---

## 💾 Backup & Persistence

### Backup Strategy

**Automated Backups:**
- Frequency: Every 6 hours (configurable)
- Retention: 7 snapshots (configurable)
- Destinations: Azure Blob Storage or AWS S3
- Compression: gzip
- Incremental: Supported

### Manual Backup

```bash
# SSH into container
ssh -p 2222 dev8@your-workspace.eastus.azurecontainer.io

# Run manual backup
~/.backup-scripts/backup.sh

# Backup to Azure Blob
export AZURE_STORAGE_ACCOUNT="dev8storage"
export AZURE_STORAGE_KEY="your_key"
~/.backup-scripts/backup.sh --destination azure

# Backup to AWS S3
export S3_BUCKET="dev8-backups"
export AWS_REGION="us-east-1"
~/.backup-scripts/backup.sh --destination s3

# List backups
~/.backup-scripts/backup.sh --list

# Restore from backup
~/.backup-scripts/backup.sh --restore backup-2024-01-10-10-00.tar.gz
```

### Backup Script Features

The backup script (`docker/mvp/backup.sh`) provides:

- ✅ Volume snapshot creation
- ✅ Upload to Azure Blob or S3
- ✅ Automatic cleanup of old backups
- ✅ Compression and encryption
- ✅ Verification after backup
- ✅ Restore functionality
- ✅ Logging and notifications

### Persistence Configuration

**Azure Files Mount:**
```yaml
# Persistent across container restarts
volumes:
  - name: workspace
    azureFile:
      shareName: workspace-user123
      storageAccountName: dev8storage
      storageAccountKey: ${STORAGE_KEY}

volumeMounts:
  - name: workspace
    mountPath: /workspace
```

**What Persists:**
- `/workspace/*` - All user code and projects
- `/workspace/.vscode` - VS Code settings
- `/workspace/.config` - Application configurations
- `/workspace/.ssh` - SSH keys
- `/workspace/.gitconfig` - Git configuration
- `/workspace/node_modules` - Installed packages
- `/workspace/venv` - Python virtual environments

**What Doesn't Persist (Recreated):**
- `/home/dev8/.logs` - Supervisor logs (ephemeral)
- Running processes (restarted on boot)
- Temporary files in `/tmp`

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Container Won't Start

**Symptoms:** Container stuck in "Creating" state

**Diagnosis:**
```bash
az container show \
  --resource-group dev8-production \
  --name dev8-workspace-user123 \
  --query "instanceView.events" \
  --output table
```

**Solutions:**
- Check image exists in registry
- Verify ACR credentials
- Check resource quotas
- Review container logs

#### 2. Cannot Access VS Code (Port 8080)

**Symptoms:** Browser connection refused or timeout

**Diagnosis:**
```bash
# Check container is running
az container show \
  --resource-group dev8-production \
  --name dev8-workspace-user123 \
  --query "instanceView.state"

# Check ports are exposed
az container show \
  --resource-group dev8-production \
  --name dev8-workspace-user123 \
  --query "ipAddress.ports"

# Test from container
az container exec \
  --resource-group dev8-production \
  --name dev8-workspace-user123 \
  --exec-command "curl -v http://localhost:8080"
```

**Solutions:**
- Ensure port 8080 is in container group definition
- Check firewall/NSG rules
- Verify code-server is running: `ps aux | grep code-server`
- Check code-server logs: `cat ~/.code-server.log`

#### 3. SSH Connection Refused (Port 2222)

**Symptoms:** SSH connection times out or refused

**Diagnosis:**
```bash
# Test SSH connectivity
telnet your-workspace.eastus.azurecontainer.io 2222

# Check SSH server in container
az container exec \
  --resource-group dev8-production \
  --name dev8-workspace-user123 \
  --exec-command "ps aux | grep sshd"
```

**Solutions:**
- Verify SSH_PUBLIC_KEY is set
- Check SSH daemon is running: `sudo service ssh status`
- Review SSH logs: `sudo tail /var/log/auth.log`
- Verify port 2222 is exposed

#### 4. Supervisor Not Starting

**Symptoms:** Health check fails, supervisor logs missing

**Diagnosis:**
```bash
# Check if supervisor binary exists
az container exec \
  --resource-group dev8-production \
  --name dev8-workspace-user123 \
  --exec-command "which workspace-supervisor"

# Check supervisor logs
az container exec \
  --resource-group dev8-production \
  --name dev8-workspace-user123 \
  --exec-command "cat ~/.logs/supervisor.log"
```

**Solutions:**
- Ensure supervisor binary is in PATH
- Check supervisor config is valid
- Verify environment variables are set
- Review entrypoint script logs

#### 5. Backup Failures

**Symptoms:** Backups not appearing in storage

**Diagnosis:**
```bash
# Check backup logs
cat ~/.logs/backup.log

# Test Azure storage access
az storage blob list \
  --account-name dev8storage \
  --container-name workspaces \
  --auth-mode login

# Test AWS S3 access
aws s3 ls s3://dev8-backups/
```

**Solutions:**
- Verify storage credentials
- Check network connectivity
- Ensure sufficient disk space
- Review backup script permissions

#### 6. High Resource Usage

**Symptoms:** Container using too much CPU/memory

**Diagnosis:**
```bash
# Check resource usage
curl http://localhost:9000/status

# Inside container
htop
df -h
du -sh /workspace/*
```

**Solutions:**
- Clean up node_modules: `find /workspace -name node_modules -type d -prune -exec du -sh {} \;`
- Remove build artifacts: `find /workspace -name target -o -name dist -o -name build`
- Check for runaway processes: `ps aux --sort=-%mem | head`
- Increase container resources

### Debug Mode

Enable verbose logging:

```bash
# Set debug environment variable
docker run -it --rm \
  -e DEBUG=true \
  -e LOG_LEVEL=debug \
  ... \
  dev8-production:latest

# Or in ACI
az container create \
  ... \
  --environment-variables \
    DEBUG=true \
    LOG_LEVEL=debug \
  ...
```

### Log Locations

| Component | Log Location |
|-----------|-------------|
| Supervisor | `~/.logs/supervisor.log` |
| code-server | `~/.code-server.log` |
| SSH | `/var/log/auth.log` (sudo access required) |
| Backup | `~/.logs/backup.log` |
| Entrypoint | Container stdout (view with `az container logs`) |

---

## 🔒 Security Best Practices

### 1. Image Security

**✅ Implemented:**
- Non-root user execution (dev8:1000)
- Minimal base image (Ubuntu 22.04 LTS)
- No hardcoded secrets
- Regular security updates
- Multi-stage builds

**🔄 Recommended:**
```bash
# Scan images for vulnerabilities
docker scout quickview dev8-production:latest
docker scout cves dev8-production:latest

# Or use Trivy
trivy image dev8-production:latest
```

### 2. Network Security

**✅ Implemented:**
- SSH key-only authentication
- Non-standard SSH port (2222)
- Password-protected code-server

**🔄 Recommended for Production:**
```bash
# Use Virtual Network integration
az container create \
  --vnet dev8-vnet \
  --subnet containers \
  ...

# Limit access with Network Security Groups
az network nsg rule create \
  --resource-group dev8-production \
  --nsg-name dev8-nsg \
  --name allow-ssh \
  --priority 100 \
  --source-address-prefixes "1.2.3.4/32" \
  --destination-port-ranges 2222 \
  --access Allow
```

### 3. Secret Management

**✅ Implemented:**
- Secrets via SecureValue environment variables
- No secrets in image layers
- Secrets never logged

**🔄 Recommended for Production:**
```bash
# Use Azure Key Vault
az keyvault secret set \
  --vault-name dev8-keyvault \
  --name github-token-user123 \
  --value "ghp_xxx"

# Reference in container
az container create \
  --secrets vault=dev8-keyvault \
  ...
```

### 4. Access Control

**✅ Implemented:**
- Managed Identity for Azure resources
- RBAC for storage access
- SSH key authentication

**🔄 Recommended:**
```bash
# Assign managed identity to container
az container create \
  --assign-identity \
  --role Contributor \
  ...

# Grant minimal permissions
az role assignment create \
  --assignee <managed-identity> \
  --role "Storage Blob Data Contributor" \
  --scope /subscriptions/.../resourceGroups/dev8-production
```

### 5. Data Encryption

**✅ Implemented:**
- HTTPS for code-server (via proxy)
- SSH for terminal access
- Encrypted storage at rest (Azure)

**🔄 Recommended:**
```bash
# Enable customer-managed keys
az storage account update \
  --name dev8storage \
  --encryption-key-source Microsoft.Keyvault \
  --encryption-key-vault https://dev8-keyvault.vault.azure.net/ \
  --encryption-key-name storage-key
```

### 6. Compliance & Auditing

**Logging:**
```bash
# Enable Azure Monitor
az monitor diagnostic-settings create \
  --resource <container-id> \
  --name dev8-diagnostics \
  --logs '[{"category":"ContainerInstanceLog","enabled":true}]' \
  --workspace <log-analytics-workspace-id>
```

**Audit Trail:**
```bash
# Review activity logs
az monitor activity-log list \
  --resource-group dev8-production \
  --start-time 2024-01-01 \
  --query "[?contains(operationName.value, 'Microsoft.ContainerInstance')]"
```

---

## 📚 Additional Resources

### Documentation

- [Docker Architecture Solution](../DOCKER_ARCHITECTURE_SOLUTION.md)
- [Workspace Manager Plan](../WORKSPACE_MANAGER_PLAN.md)
- [MVP Docker Plan](../MVP_DOCKER_PLAN.md)
- [Implementation Summary](../IMPLEMENTATION_SUMMARY.md)

### External Links

- [Azure Container Instances Docs](https://docs.microsoft.com/azure/container-instances/)
- [Azure Files Documentation](https://docs.microsoft.com/azure/storage/files/)
- [code-server GitHub](https://github.com/coder/code-server)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

### Support

- **GitHub Issues:** https://github.com/VAIBHAVSING/Dev8.dev/issues
- **Discord Community:** https://discord.gg/xE2u4b8S8g
- **Email:** support@dev8.dev

---

## 🎯 Quick Reference

### Local Development
```bash
# Build and run
cd docker
docker build -t dev8-production:latest -f mvp/Dockerfile ..
docker run -it --rm -p 8080:8080 -p 2222:2222 dev8-production:latest

# Access
# VS Code: http://localhost:8080
# SSH: ssh -p 2222 dev8@localhost
```

### Production Deployment
```bash
# Push to ACR
az acr login --name dev8registry
docker tag dev8-production:latest dev8registry.azurecr.io/dev8-production:latest
docker push dev8registry.azurecr.io/dev8-production:latest

# Deploy container
az container create \
  --resource-group dev8-production \
  --name dev8-workspace-user123 \
  --image dev8registry.azurecr.io/dev8-production:latest \
  --cpu 2 --memory 4 \
  --ports 8080 2222 \
  --dns-name-label dev8-user123 \
  --environment-variables ENVIRONMENT_ID=env123 USER_ID=user123 \
  --azure-file-volume-account-name dev8storage \
  --azure-file-volume-share-name workspace-user123 \
  --azure-file-volume-mount-path /workspace
```

### Health Checks
```bash
# Supervisor health
curl http://container:9000/health

# Container logs
az container logs --resource-group dev8-production --name dev8-workspace-user123
```

---

**Last Updated:** 2024-01-10  
**Version:** 1.0  
**Maintained by:** Dev8.dev Team

**Built with ❤️ for developers**
