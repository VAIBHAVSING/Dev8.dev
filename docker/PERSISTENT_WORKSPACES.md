# Persistent Workspaces Guide

Dev8.dev implements persistent workspaces similar to Coder, where user data survives container restarts and image updates.

## 🎯 Key Concept

**Problem:** User installs Java (or any tool not in the base image) - this needs to persist  
**Solution:** Mount `/home/dev8` as a named volume

## 📦 What Gets Persisted

### In `/home/dev8` Volume
- ✅ User-installed packages (apt, npm, pip, cargo, etc.)
- ✅ VS Code extensions and settings
- ✅ Shell configuration (.bashrc, .zshrc, etc.)
- ✅ Git configuration (.gitconfig)
- ✅ SSH keys (.ssh/)
- ✅ Language-specific caches (node_modules, __pycache__, etc.)
- ✅ Tool configurations (.config/, .local/, etc.)

### In `/workspace` Volume
- ✅ Project source code
- ✅ Repository files
- ✅ Build artifacts (if configured)

## 🚀 Usage

### Using Docker Compose (Recommended)

```bash
# Start workspace
cd docker
docker-compose up -d

# View logs
docker-compose logs -f workspace

# Stop workspace (data persists)
docker-compose down

# Rebuild image and restart (data persists!)
docker-compose up -d --build workspace
```

### Using Docker Run

```bash
docker run -d \
  -p 8080:8080 -p 2222:2222 -p 9000:9000 \
  -e GITHUB_TOKEN=your_token \
  -e ENVIRONMENT_ID=user-workspace-001 \
  -e CODE_SERVER_PASSWORD=mypassword \
  -v workspace-data:/workspace \
  -v user-home:/home/dev8 \
  --name dev8-workspace \
  dev8-workspace:latest
```

**Important:** Use named volumes (`user-home`) not bind mounts for `/home/dev8`

## 📋 Example: Installing Java

User installs Java in their workspace:

```bash
# Inside container
sudo apt update
sudo apt install -y openjdk-17-jdk maven

# Verify
java -version
mvn -version
```

**Result:** Java persists across:
- Container restarts (`docker restart dev8-workspace`)
- Image rebuilds (`docker-compose up -d --build`)
- Host reboots

## 🔄 Lifecycle Scenarios

### Scenario 1: Container Restart
```bash
docker restart dev8-workspace
```
**Result:** All data intact (both /home/dev8 and /workspace)

### Scenario 2: Image Update
```bash
# Pull new image
docker pull dev8registry.azurecr.io/dev8-workspace:latest

# Restart with new image
docker-compose up -d

# Or
docker stop dev8-workspace
docker rm dev8-workspace
docker run -d \
  -v user-home:/home/dev8 \
  -v workspace-data:/workspace \
  dev8registry.azurecr.io/dev8-workspace:latest
```
**Result:** User data persists, new image features available

### Scenario 3: Complete Cleanup
```bash
# Remove container
docker-compose down

# Remove volumes (⚠️ DESTRUCTIVE - loses all user data)
docker volume rm docker_dev8-home docker_workspace
```

## 🏗️ Architecture

```
Container (ephemeral)                Named Volumes (persistent)
┌──────────────────────┐            ┌─────────────────────┐
│  dev8-workspace      │            │   dev8-home         │
│  ┌────────────────┐  │            │  /home/dev8         │
│  │ Ubuntu 22.04   │  │            │  ├── .bashrc        │
│  │ Node.js        │  │◄───mount───│  ├── .local/        │
│  │ Python         │  │            │  ├── .config/       │
│  │ Go             │  │            │  ├── .ssh/          │
│  │ Rust           │  │            │  ├── .vscode-server/│
│  │ VS Code Server │  │            │  └── packages/      │
│  │ GitHub Copilot │  │            └─────────────────────┘
│  └────────────────┘  │            ┌─────────────────────┐
│                      │            │   workspace-data    │
│  Entrypoint:         │            │  /workspace         │
│  - Setup SSH         │◄───mount───│  ├── project/       │
│  - Start code-server │            │  ├── repo/          │
│  - Start supervisor  │            │  └── files/         │
└──────────────────────┘            └─────────────────────┘
```

## 💾 Volume Management

### List Volumes
```bash
docker volume ls | grep dev8
```

### Inspect Volume
```bash
docker volume inspect docker_dev8-home
```

### Backup Volume
```bash
# Backup home directory
docker run --rm \
  -v docker_dev8-home:/source:ro \
  -v $(pwd):/backup \
  ubuntu tar czf /backup/dev8-home-backup.tar.gz -C /source .

# Backup workspace
docker run --rm \
  -v docker_workspace:/source:ro \
  -v $(pwd):/backup \
  ubuntu tar czf /backup/workspace-backup.tar.gz -C /source .
```

### Restore Volume
```bash
# Restore home directory
docker run --rm \
  -v docker_dev8-home:/target \
  -v $(pwd):/backup \
  ubuntu tar xzf /backup/dev8-home-backup.tar.gz -C /target

# Restore workspace
docker run --rm \
  -v docker_workspace:/target \
  -v $(pwd):/backup \
  ubuntu tar xzf /backup/workspace-backup.tar.gz -C /target
```

## 🔐 Security Considerations

### Volume Permissions
Volumes are owned by UID 1000 (dev8 user) inside container:
```bash
# Check permissions
docker run --rm -v dev8-home:/data alpine ls -la /data
```

### SSH Keys
Mount SSH keys read-only:
```yaml
volumes:
  - ~/.ssh/id_rsa.pub:/home/dev8/.ssh/authorized_keys:ro
```

## 🚀 Production Deployment (Azure ACI)

### Container Group Definition
```json
{
  "properties": {
    "containers": [{
      "name": "workspace",
      "properties": {
        "image": "dev8registry.azurecr.io/dev8-workspace:latest",
        "resources": {
          "requests": {
            "cpu": 2,
            "memoryInGB": 4
          }
        },
        "ports": [
          {"port": 8080},
          {"port": 2222},
          {"port": 9000}
        ],
        "environmentVariables": [
          {"name": "ENVIRONMENT_ID", "value": "user-12345"},
          {"name": "GITHUB_TOKEN", "secureValue": "..."}
        ],
        "volumeMounts": [
          {
            "name": "home",
            "mountPath": "/home/dev8"
          },
          {
            "name": "workspace",
            "mountPath": "/workspace"
          }
        ]
      }
    }],
    "volumes": [
      {
        "name": "home",
        "azureFile": {
          "shareName": "user-12345-home",
          "storageAccountName": "dev8storage"
        }
      },
      {
        "name": "workspace",
        "azureFile": {
          "shareName": "user-12345-workspace",
          "storageAccountName": "dev8storage"
        }
      }
    ]
  }
}
```

## 📊 Storage Estimates

| Volume | Typical Size | Max Recommended |
|--------|--------------|-----------------|
| /home/dev8 | 2-5 GB | 20 GB |
| /workspace | 500 MB - 10 GB | 100 GB |

## 🐛 Troubleshooting

### Volume Not Persisting
```bash
# Check if using named volume (good)
docker inspect dev8-workspace | jq '.[0].Mounts'

# Should see:
# "Type": "volume"
# "Name": "dev8-home"
```

### Permission Denied
```bash
# Fix ownership
docker exec dev8-workspace sudo chown -R dev8:dev8 /home/dev8
```

### Volume Full
```bash
# Check usage
docker exec dev8-workspace df -h /home/dev8

# Clean package caches
docker exec dev8-workspace bash -c "
  npm cache clean --force
  pip cache purge
  cargo clean
  sudo apt clean
"
```

## 📖 Related Documentation

- [Docker Compose Reference](./docker-compose.yml)
- [Workspace Supervisor](../../apps/supervisor/)
- [Environment Variables](./README.md#environment-variables)

---

**Built for persistent cloud workspaces** 🚀
