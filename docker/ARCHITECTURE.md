# 🏗️ Docker Images Architecture

**Production-ready multi-image architecture with workspace supervisor**

## 📊 Image Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     Ubuntu 22.04 LTS                         │
│                    (Official Base Image)                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ FROM ubuntu:22.04
                       ↓
┌─────────────────────────────────────────────────────────────┐
│                    dev8-base:latest                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ STAGE 1: Build Supervisor (golang:1.22-bullseye)      │ │
│  │  - Compiles apps/supervisor/ → workspace-supervisor    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ STAGE 2: Base Image (ubuntu:22.04)                    │ │
│  │  ✅ Essential system packages                          │ │
│  │  ✅ SSH server (configured, hardened)                  │ │
│  │  ✅ GitHub CLI                                          │ │
│  │  ✅ Workspace supervisor binary (from STAGE 1)         │ │
│  │  ✅ Entrypoint script                                   │ │
│  │  ✅ Non-root user (dev8)                                │ │
│  └────────────────────────────────────────────────────────┘ │
│  Size: ~1.2GB                                                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       │ FROM dev8-base:latest
                       ↓
┌─────────────────────────────────────────────────────────────┐
│              dev8-workspace:latest (MVP)                     │
│  (Inherits everything from base, then adds:)                │
│  ✅ Node.js 20 LTS + pnpm, yarn                              │
│  ✅ Python 3.11 + pip, poetry, black, pytest                 │
│  ✅ Go 1.21                                                   │
│  ✅ Rust (stable) + rustfmt, clippy                          │
│  ✅ Bun (latest)                                              │
│  ✅ code-server (VS Code in browser)                         │
│  ✅ AWS CLI v2                                                │
│  ✅ Azure CLI                                                 │
│  ✅ AI agent helper scripts (Claude, Gemini, OpenAI)         │
│  ✅ Backup scripts                                            │
│  Size: ~3.5GB                                                │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Design Rationale

### Why Multi-Stage Build in Base?

**Problem**: The workspace supervisor is written in Go and needs to be compiled.

**Solution**: Use multi-stage build in `docker/base/Dockerfile`:

```dockerfile
# STAGE 1: Build supervisor binary
FROM golang:1.22-bullseye AS supervisor-build
COPY apps/supervisor/ ./
RUN go build -o workspace-supervisor ./cmd/supervisor

# STAGE 2: Slim runtime image
FROM ubuntu:22.04
COPY --from=supervisor-build /build/workspace-supervisor /usr/local/bin/
```

**Benefits**:

- ✅ Final image doesn't include Go compiler (~700MB savings)
- ✅ Clean separation of build vs runtime
- ✅ Supervisor binary is compiled once, inherited by all child images

### Why Separate Base + Workspace Images?

**Option A: Single Monolithic Image** ❌

```dockerfile
FROM ubuntu:22.04
# Install EVERYTHING in one Dockerfile
```

- ❌ 30+ minute build time on every change
- ❌ 10% cache hit rate
- ❌ No flexibility for different language stacks

**Option B: Base + Language Images** ✅

```dockerfile
# base/Dockerfile - Foundation
FROM ubuntu:22.04
# SSH, supervisor, GitHub CLI, entrypoint

# mvp/Dockerfile - Languages
FROM dev8-base:latest
# Node.js, Python, Go, Rust, tools
```

- ✅ 3-8 minute incremental build time
- ✅ 80-90% cache hit rate
- ✅ Can create specialized images (nodejs-only, python-only)
- ✅ Easy to maintain and update

## 🚀 Build Process

### Local Build

```bash
# From repository root (IMPORTANT!)
cd /path/to/Dev8.dev

# Build all images
./docker/build.sh

# Build only base
BUILD_MVP=false ./docker/build.sh

# Build only workspace (assumes base exists)
BUILD_BASE=false ./docker/build.sh
```

**Why from repo root?**
The Dockerfile needs `apps/supervisor/` in the build context to compile the Go binary!

### CI/CD Build

The GitHub Actions workflow (`.github/workflows/docker-images.yml`) automatically:

1. **Checks what changed** - Only rebuilds affected images
2. **Builds base first** - If base changes, rebuilds workspace too
3. **Uses repo root as context** - Ensures `apps/supervisor/` is accessible
4. **Runs tests** - Verifies all components installed correctly
5. **Scans for vulnerabilities** - Trivy security scan

Example workflow:

```yaml
- name: Build base image (with supervisor)
  run: |
    docker build \
      -t dev8-base:latest \
      -f ./docker/base/Dockerfile \
      .  # ← Build context = repo root!

- name: Build workspace image
  run: |
    docker build \
      --build-arg BASE_IMAGE=dev8-base:latest \
      -t dev8-workspace:latest \
      -f ./docker/mvp/Dockerfile \
      .  # ← Also from repo root
```

## 📦 Image Contents

### dev8-base (~1.2GB)

**System Packages**:

- ca-certificates, curl, wget, git, git-lfs
- openssh-server, openssh-client
- vim, neovim, nano, tmux, screen, zsh
- jq, yq, unzip, zip, tar
- build-essential, cmake, pkg-config
- htop, procps, netcat
- fuse3, cifs-utils, nfs-common
- ripgrep, fd-find, bat

**Configured Services**:

- SSH server on port 2222 (key-only auth, root disabled)
- GitHub CLI (gh) installed
- Non-root user `dev8` with sudo access

**Supervisor**:

- `/usr/local/bin/workspace-supervisor` binary
- Monitors workspace activity
- Handles backup to Azure/AWS storage
- HTTP API on port 9000 (internal)

**Entrypoint**:

- `/usr/local/bin/entrypoint.sh`
- Sets up SSH keys, GitHub auth, AI CLIs
- Starts SSH server and supervisor daemon

### dev8-workspace (~3.5GB)

**Everything from base, PLUS**:

**Languages**:

- Node.js 20 LTS + npm, pnpm, yarn
- Python 3.11 + pip, poetry, pipenv, black, pytest, ipython, jupyterlab
- Go 1.21 + GOPATH configured
- Rust (stable) + cargo, rustfmt, clippy, rust-analyzer
- Bun (latest)

**Development Tools**:

- code-server (VS Code in browser)
- AWS CLI v2
- Azure CLI
- Git LFS

**AI Agent Scripts**:

- `/home/dev8/.local/bin/claude` - Claude CLI wrapper
- `/home/dev8/.local/bin/gemini` - Gemini CLI wrapper
- `/home/dev8/.local/bin/gpt` - OpenAI/GPT CLI wrapper
- GitHub Copilot CLI (via `gh copilot`)

**Configuration**:

- VS Code settings pre-configured for AI agents
- Backup script at `/home/dev8/.backup-scripts/backup.sh`

## 🔧 Usage Examples

### Run Workspace Container

```bash
docker run -it --rm \
  -p 8080:8080 -p 2222:2222 -p 9000:9000 \
  -e GITHUB_TOKEN=$GITHUB_TOKEN \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -e GOOGLE_API_KEY=$GOOGLE_API_KEY \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e SSH_PUBLIC_KEY="$(cat ~/.ssh/id_rsa.pub)" \
  -v $(pwd)/workspace:/workspace \
  -v $(pwd)/azure-volume:/mnt/azure-volume \
  dev8-workspace:latest
```

**Access**:

- VS Code: http://localhost:8080
- SSH: `ssh -p 2222 dev8@localhost`
- Supervisor API: http://localhost:9000 (internal only)

### Environment Variables

**Required**:

- `GITHUB_TOKEN` or `GH_TOKEN` - GitHub authentication
- `SSH_PUBLIC_KEY` - Your public key for SSH access

**Optional AI Agents**:

- `ANTHROPIC_API_KEY` - Claude CLI
- `GOOGLE_API_KEY` or `GEMINI_API_KEY` - Gemini CLI
- `OPENAI_API_KEY` - GPT CLI

**Supervisor Configuration**:

- `SUPERVISOR_ENABLED=true` - Enable supervisor daemon
- `BACKUP_ENABLED=true` - Enable automatic backups
- `SUPERVISOR_BACKUP_INTERVAL=300s` - Backup interval
- `SUPERVISOR_BACKUP_MOUNT_PATH=/mnt/azure-volume` - Backup destination
- `SUPERVISOR_HTTP_ENABLED=true` - Enable HTTP status API
- `SUPERVISOR_HTTP_ADDR=127.0.0.1:9000` - API listen address

**Azure Blob Storage** (for persistent backups):

- `AZURE_BLOB_ACCOUNT_NAME`
- `AZURE_BLOB_ACCOUNT_KEY`
- `AZURE_BLOB_CONTAINER`

**AWS S3** (alternative backup):

- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`

## 🧪 Testing

### Verify Base Image

```bash
# Test supervisor binary exists
docker run --rm dev8-base:latest test -f /usr/local/bin/workspace-supervisor && echo "✅ Supervisor installed"

# Test GitHub CLI
docker run --rm dev8-base:latest gh --version

# Test SSH server configured
docker run --rm dev8-base:latest grep "Port 2222" /etc/ssh/sshd_config
```

### Verify Workspace Image

```bash
# Test all languages
docker run --rm dev8-workspace:latest node --version
docker run --rm dev8-workspace:latest python --version
docker run --rm dev8-workspace:latest go version
docker run --rm dev8-workspace:latest rustc --version
docker run --rm dev8-workspace:latest bun --version

# Test code-server
docker run --rm dev8-workspace:latest code-server --version

# Test cloud CLIs
docker run --rm dev8-workspace:latest aws --version
docker run --rm dev8-workspace:latest az version
```

## 🔒 Security

**Hardened SSH**:

- Port 2222 (not default 22)
- Key-only authentication (passwords disabled)
- Root login disabled
- MaxAuthTries: 3

**Non-Root Execution**:

- All services run as `dev8` user (UID 1000)
- Sudo available for package installation only

**Secret Management**:

- Secrets passed via environment variables (never in image)
- API keys stored in user home with 600 permissions
- No secrets in image layers or history

**Vulnerability Scanning**:

- Trivy scans run in CI on every build
- SARIF reports uploaded to GitHub Security

## 📈 Performance

**Build Times** (with cache):

- Base image: 3-5 minutes
- Workspace image: 8-12 minutes
- **Total**: ~10-15 minutes

**Build Times** (clean):

- Base image: 10-15 minutes
- Workspace image: 20-25 minutes
- **Total**: ~30-40 minutes

**Runtime**:

- Cold start: 30-45 seconds
- Warm start: 8-12 seconds
- Idle memory: 400-600MB
- With code-server: 1-2GB

## 🔄 Maintenance

### Update Base Image

When you need to update system packages, SSH config, or supervisor:

```bash
# Edit docker/base/Dockerfile
# Then rebuild both images:
./docker/build.sh
```

### Update Languages/Tools

When you need to update Node.js, Python, etc.:

```bash
# Edit docker/mvp/Dockerfile
# Then rebuild workspace only:
BUILD_BASE=false ./docker/build.sh
```

### Update Supervisor

When supervisor code changes:

```bash
# Just rebuild (it will recompile from apps/supervisor/):
./docker/build.sh
```

## 🚀 Future Enhancements

**Phase 2** - Specialized images:

- `dev8-nodejs` - Base + Node.js only (~1.8GB)
- `dev8-python` - Base + Python only (~2.0GB)
- `dev8-go` - Base + Go only (~1.5GB)
- `dev8-rust` - Base + Rust only (~2.5GB)

**Phase 3** - Advanced features:

- GPU support for ML workloads
- Kubernetes deployment configs
- Auto-scaling based on load
- Multi-region container registry

## 📚 Related Documentation

- [docker/README.md](README.md) - User guide and deployment
- [docker/build.sh](build.sh) - Build script
- [DOCKER_ARCHITECTURE_SOLUTION.md](../DOCKER_ARCHITECTURE_SOLUTION.md) - Detailed design
- [MVP_DOCKER_PLAN.md](../MVP_DOCKER_PLAN.md) - MVP implementation
- [WORKSPACE_MANAGER_PLAN.md](../WORKSPACE_MANAGER_PLAN.md) - Supervisor design

---

**Built with ❤️ by the Dev8.dev Team**
