# Dev8.dev Docker Images

> **Production-ready cloud workspace alternative with AI agents, supervisor monitoring, and persistent storage**

## 🎯 Overview

This directory contains Docker images for Dev8.dev's cloud-based development workspace platform. Each image provides a complete development environment with code-server (browser-based VS Code), SSH access, multiple AI agent CLIs, supervisor monitoring, and automatic authentication/backup support.

## 📦 Available Images

| Image              | Size    | Languages                  | AI Agents                               | Use Case                       |
| ------------------ | ------- | -------------------------- | --------------------------------------- | ------------------------------ |
| **dev8-base**      | ~1.2GB  | None                       | GitHub CLI, SSH, Supervisor             | Foundation for all images      |
| **dev8-workspace** | ~3.5GB  | Node.js, Python, Go, Rust  | Copilot, Claude, Gemini, OpenAI         | Production workspace           |

## 🚀 Quick Start

### Build Images Locally

```bash
cd docker
./build.sh
```

### Test Production Workspace

```bash
docker run -it --rm \
  -p 8080:8080 \
  -p 2222:2222 \
  -e GITHUB_TOKEN="ghp_your_token_here" \
  -e ANTHROPIC_API_KEY="sk-ant-your-key" \
  -e GOOGLE_API_KEY="your-google-key" \
  -e OPENAI_API_KEY="sk-your-openai-key" \
  -e SSH_PUBLIC_KEY="$(cat ~/.ssh/id_rsa.pub)" \
  -e GIT_USER_NAME="Your Name" \
  -e GIT_USER_EMAIL="your@email.com" \
  -v $(pwd)/workspace:/workspace \
  -v $(pwd)/azure-volume:/mnt/azure-volume \
  dev8-workspace:latest
```

Then access:

- **VS Code**: http://localhost:8080 (password: `dev8dev`)
- **SSH**: `ssh -p 2222 dev8@localhost`
- **Supervisor API**: http://localhost:9000 (internal only)

## 🤖 AI Agent Features

Each workspace image includes multiple AI agent CLIs with automatic configuration:

### 1. **GitHub Copilot CLI**
```bash
gh copilot suggest "list all docker containers"
gh copilot explain "docker ps -a"
```

### 2. **Claude CLI (Anthropic)**
```bash
claude "explain kubernetes in simple terms"
claude "write a python function to parse JSON"
```

### 3. **Gemini CLI (Google)**
```bash
gemini "best practices for Go error handling"
gemini "optimize this SQL query"
```

### 4. **GPT CLI (OpenAI)**
```bash
gpt "create a REST API with Express.js"
gpt "debug this TypeScript error"
```

### Helper Commands
```bash
ai-tools              # List all available AI tools
copilot="gh copilot suggest"   # Alias
explain="gh copilot explain"   # Alias
```

## 🔑 Environment Variables

### Required

- `GITHUB_TOKEN` or `GH_TOKEN` - GitHub personal access token with Copilot scope

### Optional - Git Configuration

- `GIT_USER_NAME` - Your Git commit name
- `GIT_USER_EMAIL` - Your Git commit email
- `SSH_PUBLIC_KEY` - Public SSH key for authentication
- `SSH_PRIVATE_KEY` - Private SSH key for Git operations

### Optional - Code Server

- `CODE_SERVER_PASSWORD` - Password for code-server (default: `dev8dev`)
- `CODE_SERVER_AUTH` - Authentication method: `password` or `none`

### Optional - AI Tools

- `ANTHROPIC_API_KEY` - Claude CLI API key
- `OPENAI_API_KEY` - OpenAI/GPT API key
- `GOOGLE_API_KEY` or `GEMINI_API_KEY` - Google Gemini API key

### Optional - Supervisor & Backup

- `SUPERVISOR_ENABLED` - Enable supervisor daemon (default: `true`)
- `BACKUP_ENABLED` - Enable automatic backups (default: `true`)
- `SUPERVISOR_MONITOR_INTERVAL` - File monitoring interval (default: `30s`)
- `SUPERVISOR_BACKUP_INTERVAL` - Backup interval (default: `300s`)
- `SUPERVISOR_BACKUP_MOUNT_PATH` - Mount path for backups (default: `/mnt/azure-volume`)

### Optional - Azure Storage

- `AZURE_BLOB_ACCOUNT_NAME` - Azure storage account name
- `AZURE_BLOB_ACCOUNT_KEY` - Azure storage account key
- `AZURE_BLOB_CONTAINER` - Azure blob container name
- `AZURE_STORAGE_ACCOUNT` - Azure storage account for backups
- `AZURE_STORAGE_CONTAINER` - Azure container for backups

### Optional - AWS S3

- `AWS_S3_BUCKET` - S3 bucket for backups
- `AWS_S3_PREFIX` - S3 prefix for backup files
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key

## 🏗️ Architecture

```
Container Startup
    ↓
[Dev8.dev Workspace Agent - entrypoint.sh]
    ├── 1. Setup SSH keys
    ├── 2. Authenticate GitHub CLI
    ├── 3. Install Copilot CLI
    ├── 4. Setup Claude CLI
    ├── 5. Setup Gemini CLI
    ├── 6. Setup OpenAI CLI
    ├── 7. Configure VS Code
    ├── 8. Start code-server (port 8080)
    ├── 9. Start SSH server (port 2222)
    ├── 10. Start supervisor daemon
    └── 11. Monitor & refresh auth
    ↓
[Services Running]
    ├── workspace-supervisor (monitoring & backup)
    ├── code-server (VS Code in browser)
    ├── SSH server (terminal access)
    └── Background auth monitor
    ↓
[Persistent Storage]
    ├── /workspace (user projects)
    ├── /mnt/azure-volume (persistent backup)
    └── ~/.backups (local snapshots)
```

## 📝 Image Details

### dev8-base

**Base image** with Ubuntu 22.04, essential tools, supervisor, and AI agent infrastructure.

```dockerfile
FROM ubuntu:22.04
# Includes: git, ssh, gh cli, vim, neovim, tmux, supervisor
# Features: Non-root user, hardened SSH, workspace supervisor binary
```

**Key Features:**
- Non-root user (`dev8`)
- Hardened SSH configuration (key-only, port 2222)
- GitHub CLI pre-installed
- Workspace supervisor daemon
- AI agent helper scripts

### dev8-workspace (Production)

**Full-stack development** with all major languages and AI agents.

```dockerfile
FROM dev8-base:latest
# Adds: Node.js 20, Python 3.11, Go 1.21, Rust, Bun
# Adds: code-server, AI CLIs, cloud CLIs (AWS, Azure)
```

**Pre-installed Languages:**
- Node.js 20 LTS + pnpm, yarn, Bun
- Python 3.11 + poetry, black, pytest, jupyterlab
- Go 1.21
- Rust (latest stable) + rustfmt, clippy, rust-analyzer

**Pre-installed Tools:**
- code-server with AI extensions
- GitHub CLI + Copilot extension
- AWS CLI v2
- Azure CLI
- Claude, Gemini, GPT helper scripts

**Perfect for:**
- Full-stack development
- Multi-language projects
- AI-assisted coding
- Production workloads
- Team collaboration

## 🔧 Build Configuration

### Build Specific Image

```bash
# Build only base image
BUILD_BASE=true BUILD_MVP=false ./build.sh

# Build with custom version
VERSION=v1.0.0 ./build.sh

# Build with custom registry
DOCKER_REGISTRY=myregistry.azurecr.io ./build.sh
```

### CI/CD Integration

Images are automatically built on:
- Push to `main` branch
- Pull requests
- Release tags

See `.github/workflows/docker-images.yml` for details.

## 🧪 Testing

### Test Locally with All AI Agents

```bash
# Create .env file with your API keys
cp .env.example .env
# Edit .env with your credentials

# Run with all AI features
docker run -it --rm \
  -p 8080:8080 -p 2222:2222 \
  --env-file .env \
  -v $(pwd)/workspace:/workspace \
  dev8-workspace:latest
```

### Verify Features

1. **GitHub CLI**: `gh auth status`
2. **Copilot CLI**: `gh copilot suggest "list files"`
3. **Claude CLI**: `claude "hello"`
4. **Gemini CLI**: `gemini "test"`
5. **GPT CLI**: `gpt "test"`
6. **Git**: `git config --list`
7. **Code Server**: Open http://localhost:8080
8. **SSH**: `ssh -p 2222 dev8@localhost`
9. **Supervisor**: Check logs at `/var/log/workspace-supervisor.log`

## 🔒 Security

### Production Best Practices

1. **Non-root execution**: All processes run as `dev8` user
2. **SSH hardening**: Key-only auth, no passwords, custom port 2222
3. **Secret management**: Tokens via environment variables (never in image)
4. **Minimal attack surface**: Only essential packages installed
5. **Regular updates**: Base images rebuilt weekly
6. **Telemetry disabled**: VS Code and code-server telemetry off

### Required Token Scopes

Your `GITHUB_TOKEN` needs:
- `repo` - Full repository access
- `read:org` - Read organization data
- `copilot` - GitHub Copilot access

## 📊 Performance

### Startup Times

| Image          | Cold Start | Warm Start | With AI Setup |
| -------------- | ---------- | ---------- | ------------- |
| dev8-base      | 10-15s     | 3-5s       | 8-12s         |
| dev8-workspace | 30-45s     | 8-12s      | 15-25s        |

### Resource Usage

| Workload   | Memory      | CPU     | Disk       |
| ---------- | ----------- | ------- | ---------- |
| Idle       | 400-600MB   | <5%     | ~3.5GB     |
| Light work | 1-2GB       | 10-30%  | +variable  |
| Heavy work | 2-4GB       | 50-100% | +variable  |

## 🐛 Troubleshooting

### GitHub CLI Not Authenticated

```bash
# Check auth status
docker exec -it container_name gh auth status

# Re-authenticate
docker exec -it container_name bash
echo "$GITHUB_TOKEN" | gh auth login --with-token
```

### AI CLI Not Working

```bash
# Check if API key is set
docker exec -it container_name env | grep API_KEY

# Test Claude CLI
docker exec -it container_name claude "test"

# Test Gemini CLI
docker exec -it container_name gemini "test"

# Test GPT CLI
docker exec -it container_name gpt "test"
```

### Code Server Not Starting

```bash
# Check logs
docker exec -it container_name cat /home/dev8/.code-server.log

# Restart code-server
docker exec -it container_name pkill code-server
# Container will auto-restart it via entrypoint
```

### Supervisor Not Running

```bash
# Check supervisor status
docker exec -it container_name pgrep workspace-supervisor

# View supervisor logs
docker exec -it container_name cat /var/log/workspace-supervisor.log

# Check supervisor configuration
docker exec -it container_name env | grep SUPERVISOR
```

### SSH Connection Refused

```bash
# Check SSH server
docker exec -it container_name sudo service ssh status

# Verify port mapping
docker port container_name 2222

# Test SSH connection
ssh -v -p 2222 dev8@localhost
```

## 🚢 Deployment to Azure Container Instances

### Deploy with Persistent Volume

```bash
# Create Azure file share
az storage share create \
  --name dev8-workspace \
  --account-name mystorageaccount

# Deploy container
az container create \
  --resource-group dev8-rg \
  --name dev8-workspace-001 \
  --image dev8registry.azurecr.io/dev8-workspace:latest \
  --cpu 2 --memory 4 \
  --ports 8080 2222 \
  --dns-name-label dev8-workspace-001 \
  --environment-variables \
    GITHUB_TOKEN=$GITHUB_TOKEN \
    ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
    GOOGLE_API_KEY=$GOOGLE_API_KEY \
  --azure-file-volume-account-name mystorageaccount \
  --azure-file-volume-account-key $STORAGE_KEY \
  --azure-file-volume-share-name dev8-workspace \
  --azure-file-volume-mount-path /mnt/azure-volume
```

## 📚 Related Documentation

- [DOCKER_ARCHITECTURE_SOLUTION.md](../DOCKER_ARCHITECTURE_SOLUTION.md) - Detailed architecture
- [WORKSPACE_MANAGER_PLAN.md](../WORKSPACE_MANAGER_PLAN.md) - Supervisor design
- [MVP_DOCKER_PLAN.md](../MVP_DOCKER_PLAN.md) - Implementation plan
- [Issue #21](https://github.com/VAIBHAVSING/Dev8.dev/issues/21) - GitHub issue

## 🤝 Contributing

Contributions welcome! Please:

1. Test changes locally
2. Update documentation
3. Run security scans
4. Submit PR with description

## 📄 License

MIT License - see [../LICENSE](../LICENSE)

---

**Built with ❤️ by the Dev8.dev Team**

For support: https://github.com/VAIBHAVSING/Dev8.dev/issues

## 🚀 Quick Start

### Build Images Locally

```bash
cd docker
./build.sh
```

### Test an Image

```bash
docker run -it --rm \
  -p 8080:8080 \
  -p 2222:2222 \
  -e GITHUB_TOKEN="ghp_your_token_here" \
  -e SSH_PUBLIC_KEY="$(cat ~/.ssh/id_rsa.pub)" \
  -e GIT_USER_NAME="Your Name" \
  -e GIT_USER_EMAIL="your@email.com" \
  -v $(pwd)/workspace:/workspace \
  dev8-nodejs:latest
```

Then access:

- **VS Code**: http://localhost:8080
- **SSH**: `ssh -p 2222 dev8@localhost`

## 🔐 DevCopilot Agent Features

Each image includes the **DevCopilot Agent** that automatically:

1. ✅ **Authenticates to GitHub CLI** using provided token
2. ✅ **Installs GitHub Copilot CLI** extension
3. ✅ **Configures Git credentials** for push/pull operations
4. ✅ **Sets up SSH keys** for secure access
5. ✅ **Configures VS Code** with Copilot extensions
6. ✅ **Monitors authentication** and refreshes tokens
7. ✅ **Starts code-server** for browser-based IDE

## 🔑 Environment Variables

### Required

- `GITHUB_TOKEN` or `GH_TOKEN` - GitHub personal access token with Copilot scope

### Optional - Git Configuration

- `GIT_USER_NAME` - Your Git commit name
- `GIT_USER_EMAIL` - Your Git commit email
- `SSH_PUBLIC_KEY` - Public SSH key for authentication
- `SSH_PRIVATE_KEY` - Private SSH key for Git operations

### Optional - Code Server

- `CODE_SERVER_PASSWORD` - Password for code-server (default: `dev8dev`)
- `CODE_SERVER_AUTH` - Authentication method: `password` or `none`

### Optional - AI Tools

- `ANTHROPIC_API_KEY` - Claude CLI API key
- `OPENAI_API_KEY` - OpenAI API key

## 🏗️ Architecture

```
Container Startup
    ↓
[DevCopilot Agent - entrypoint.sh]
    ├── 1. Setup SSH keys
    ├── 2. Authenticate GitHub CLI
    ├── 3. Install Copilot CLI
    ├── 4. Configure VS Code
    ├── 5. Start code-server (port 8080)
    ├── 6. Start SSH server (port 2222)
    └── 7. Monitor & refresh auth
    ↓
[Services Running]
    ├── code-server (VS Code in browser)
    ├── SSH server (terminal access)
    └── Background auth monitor
```

## 📝 Image Details

### dev8-base

**Base image** with Ubuntu 22.04, essential tools, and DevCopilot Agent.

```dockerfile
FROM ubuntu:22.04
# Includes: git, ssh, gh cli, vim, neovim, tmux
```

**Features:**

- Non-root user (`dev8`)
- Hardened SSH configuration
- GitHub CLI pre-installed
- DevCopilot Agent entrypoint

### dev8-nodejs

**Node.js development** with modern JavaScript tooling.

```dockerfile
FROM dev8-base:latest
# Adds: Node.js 20, pnpm, yarn, Bun, code-server
```

**Pre-installed:**

- Node.js 20 LTS
- pnpm, yarn, Bun
- code-server with extensions:
  - GitHub Copilot & Copilot Chat
  - ESLint, Prettier
  - TypeScript support
  - Tailwind CSS IntelliSense

**Perfect for:**

- React, Next.js, Vue, Svelte projects
- TypeScript development
- Node.js backends
- Full-stack JavaScript

### dev8-python

**Python development** with data science tools.

```dockerfile
FROM dev8-base:latest
# Adds: Python 3.11, pip, poetry, code-server
```

**Pre-installed:**

- Python 3.11
- Poetry, pipenv
- Black, flake8, pylint, mypy
- pytest
- JupyterLab
- numpy, pandas (essentials)
- code-server with extensions:
  - GitHub Copilot & Copilot Chat
  - Python, Pylance
  - Jupyter support

**Perfect for:**

- Python web apps (FastAPI, Django)
- Data science & ML
- Scripting & automation
- Jupyter notebooks

### dev8-fullstack

**Polyglot development** with all languages.

```dockerfile
FROM dev8-base:latest
# Adds: Node.js, Python, Go, Rust, Bun, code-server
```

**Pre-installed:**

- Node.js 20 + Bun
- Python 3.11
- Go 1.21
- Rust (stable)
- All language-specific extensions

**Perfect for:**

- Microservices (mixed languages)
- Full-stack development
- Learning multiple languages
- Polyglot projects

## 🔧 Build Configuration

### Build Specific Image

```bash
# Build only Node.js image
BUILD_NODEJS=true BUILD_PYTHON=false BUILD_FULLSTACK=false ./build.sh

# Build with custom version
VERSION=v1.2.3 ./build.sh

# Build with custom registry
DOCKER_REGISTRY=myregistry.azurecr.io ./build.sh
```

### CI/CD Integration

Images are automatically built on:

- Push to `main` branch
- Pull requests
- Release tags

See `.github/workflows/docker-images.yml` for details.

## 🧪 Testing

### Test Locally

```bash
# Test Node.js image
docker run -it --rm \
  -p 8080:8080 -p 2222:2222 \
  -e GITHUB_TOKEN="$GITHUB_TOKEN" \
  dev8-nodejs:latest

# Test with workspace mount
docker run -it --rm \
  -p 8080:8080 -p 2222:2222 \
  -e GITHUB_TOKEN="$GITHUB_TOKEN" \
  -v $(pwd)/test-workspace:/workspace \
  dev8-nodejs:latest
```

### Verify Features

1. **GitHub CLI**: `gh auth status`
2. **Copilot CLI**: `gh copilot suggest "list files"`
3. **Git**: `git config --list`
4. **Code Server**: Open http://localhost:8080
5. **SSH**: `ssh -p 2222 dev8@localhost`

## 🔒 Security

### Best Practices

1. **Non-root execution**: All processes run as `dev8` user
2. **SSH hardening**: Key-only auth, no passwords, custom port
3. **Secret management**: Tokens via environment variables (never in image)
4. **Minimal attack surface**: Only essential packages installed
5. **Regular updates**: Base images rebuilt weekly

### Token Scopes

Your `GITHUB_TOKEN` needs these scopes:

- `repo` - Full repository access
- `read:org` - Read organization data
- `copilot` - GitHub Copilot access (if using Copilot)

## 📊 Performance

### Startup Times

| Image          | Cold Start | Warm Start |
| -------------- | ---------- | ---------- |
| dev8-base      | 10-15s     | 3-5s       |
| dev8-nodejs    | 20-30s     | 5-10s      |
| dev8-python    | 25-35s     | 5-10s      |
| dev8-fullstack | 35-45s     | 8-12s      |

### Resource Usage

| Image      | Memory      | CPU     |
| ---------- | ----------- | ------- |
| Idle       | 300-500MB   | <5%     |
| Light work | 800MB-1.5GB | 10-30%  |
| Heavy work | 2-4GB       | 50-100% |

## 🐛 Troubleshooting

### GitHub CLI Not Authenticated

```bash
# Check auth status
docker exec -it container_name gh auth status

# Re-authenticate
docker exec -it container_name bash
echo "$GITHUB_TOKEN" | gh auth login --with-token
```

### Code Server Not Starting

```bash
# Check logs
docker exec -it container_name cat /home/dev8/.code-server.log

# Restart code-server
docker exec -it container_name pkill code-server
# Container will auto-restart it via entrypoint
```

### SSH Connection Refused

```bash
# Check SSH server
docker exec -it container_name sudo service ssh status

# Verify port mapping
docker port container_name 2222
```

### Copilot Not Working

1. Ensure `GITHUB_TOKEN` has `copilot` scope
2. Check Copilot subscription: https://github.com/settings/copilot
3. Restart code-server after token update
4. Try manual OAuth: `gh auth login --web`

## 📚 Related Documentation

- [DOCKER_ARCHITECTURE_SOLUTION.md](../DOCKER_ARCHITECTURE_SOLUTION.md) - Detailed architecture
- [WORKSPACE_MANAGER_PLAN.md](../WORKSPACE_MANAGER_PLAN.md) - Supervisor design
- [MVP_DOCKER_PLAN.md](../MVP_DOCKER_PLAN.md) - Implementation plan
- [Issue #21](https://github.com/VAIBHAVSING/Dev8.dev/issues/21) - GitHub issue

## 🤝 Contributing

Contributions welcome! Please:

1. Test changes locally
2. Update documentation
3. Run security scans
4. Submit PR with description

## 📄 License

MIT License - see [../LICENSE](../LICENSE)

---

**Built with ❤️ by the Dev8.dev Team**

For support: https://github.com/VAIBHAVSING/Dev8.dev/issues
