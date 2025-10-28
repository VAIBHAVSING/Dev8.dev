# 🚀 Dev8.dev Quick Start

## Get Started in 3 Steps

```bash
# 1. Set up environment
cd docker
cp .env.example .env
# Edit .env and add your GITHUB_TOKEN

# 2. Start workspace
make up

# 3. Open VS Code
# Browser: http://localhost:8080
# No password required!
```

## What You Get

- **VS Code Server** (browser-based)
- **Languages**: Node.js, Python, Go, Rust
- **AI Tools**: GitHub Copilot, Claude, OpenAI
- **Persistent Storage**: Your code survives restarts

## Configuration

### Required

```bash
GITHUB_TOKEN=ghp_xxxxx  # For GitHub Copilot
```

### Optional

```bash
# Authentication (default: none)
CODE_SERVER_AUTH=none

# Add password protection (production)
CODE_SERVER_AUTH=password
CODE_SERVER_PASSWORD=your_password

# SSH access (optional)
SSH_PASSWORD=your_ssh_password
```

## Common Commands

```bash
# View logs
make logs

# Restart
make rebuild

# Stop
make down

# Clean everything
make clean
```

## Production Deployment

See [docker/README.md](docker/README.md#production-deployment) for Azure Container Instances deployment.

---

## Legacy Documentation

The following sections contain the original implementation planning and architecture decisions.

---

- **Day 5**: Documentation + user guide

**Deliverable**: Production-ready platform

---

## Auto-Shutdown Strategy for MVP

### Recommended: External Polling (Simplest)

```go
// Go Agent monitors every 30 seconds
func checkInactiveContainers() {
    containers := db.GetActiveContainers()
    for container := range containers {
        if time.Since(container.LastActivityAt) > 2*time.Minute {
            azure.StopContainer(container.ID)
        }
    }
}
```

**Why this approach?**

- ✅ No supervisor needed (simpler)
- ✅ Centralized control in Go agent
- ✅ Easy to change timeout
- ✅ Can add supervisor later if needed

**Alternative**: Golang supervisor inside container (Phase 2)

---

## Security Architecture

### Key Principles

1. **Non-root execution**: All processes run as `dev8` user
2. **SSH hardening**: Key-only auth, no passwords, custom port
3. **Secret management**: Azure Key Vault → Environment variables → Runtime injection
4. **No hardcoded secrets**: NEVER in Dockerfile or image

### Secret Flow

```
User enters secrets in UI
    ↓
Frontend → Go Agent → Azure Key Vault (encrypted)
    ↓
Go Agent creates ACI with SecureValue env vars
    ↓
Container entrypoint reads env vars
    ↓
Writes to ~/.gitconfig, ~/.ssh/authorized_keys
    ↓
Secrets NEVER logged or exposed
```

---

## File Structure

Create this structure in your repo:

```
Dev8.dev/
├── docker/
│   ├── base/
│   │   └── Dockerfile              # Layer 1: Ubuntu + SSH
│   ├── nodejs/
│   │   └── Dockerfile              # Layer 2A: Node.js + Bun
│   ├── python/
│   │   └── Dockerfile              # Layer 2B: Python
│   ├── fullstack/
│   │   └── Dockerfile              # Layer 2C: All languages
│   ├── scripts/
│   │   └── entrypoint.sh           # Runtime configuration
│   └── supervisor/                 # Optional (Phase 2)
│       └── main.go                 # Golang supervisor
├── apps/
│   ├── agent/                      # Go agent updates
│   │   └── internal/services/
│   │       └── activity_monitor.go # Auto-shutdown logic
│   └── web/                        # Frontend updates
│       └── components/
│           └── VSCodeProxy.tsx     # Embedded IDE
└── docs/
    ├── DOCKER_ARCHITECTURE_SOLUTION.md  # Full architecture (THIS REPO)
    └── QUICK_START.md                   # This file
```

---

## Key Design Decisions

### 1. Supervisor: Optional for MVP ✅

**Start without it**: Use bash entrypoint script  
**Add later**: If you need advanced process management

### 2. Multi-Layer: Always ✅

**Benefits outweigh complexity**: 56% cost savings, faster builds

### 3. Security: Non-negotiable ✅

- Non-root user
- SSH key-only
- Runtime secrets
- Regular vulnerability scanning

### 4. Storage: Azure Files per user ✅

```yaml
volumes:
  - name: workspace
    azureFile:
      shareName: workspace-${userId}
      storageAccountName: dev8storage
```

Persists across container restarts

---

## Quick Commands

### Build Images Locally

```bash
# 1. Build base
cd docker/base
docker build -t dev8/base:latest .

# 2. Build Node.js variant
cd ../nodejs
docker build -t dev8/nodejs:latest .

# 3. Test locally
docker run -it --rm \
  -p 8080:8080 -p 2222:2222 \
  -e GITHUB_TOKEN="ghp_your_token" \
  -e SSH_PUBLIC_KEY="$(cat ~/.ssh/id_rsa.pub)" \
  -v $(pwd)/test:/workspace \
  dev8/nodejs:latest

# 4. Access
# Browser: http://localhost:8080 (VS Code)
# SSH: ssh -p 2222 dev8@localhost
```

### Push to Azure Container Registry

```bash
# Login
az acr login --name dev8registry

# Tag
docker tag dev8/nodejs:latest dev8registry.azurecr.io/nodejs:latest

# Push
docker push dev8registry.azurecr.io/nodejs:latest
```

---

## Connection Methods Supported

### 1. Browser VS Code (code-server)

```
URL: http://{container}.azurecontainer.io:8080
No installation required
```

### 2. SSH Terminal

```bash
ssh -p 2222 -i ~/.ssh/dev8_key dev8@{container}.azurecontainer.io
```

### 3. VS Code Remote-SSH Extension

```
Install Remote-SSH extension
Connect to host via SSH
Full VS Code experience
```

### 4. Web Terminal (Future)

```
Frontend component using xterm.js
WebSocket bridge to SSH
```

---

## Success Metrics

### Performance

- ✅ Startup: < 30 seconds
- ✅ Image size: < 2.5GB
- ✅ Memory: < 4GB per container
- ✅ Build time: < 5 minutes (cached)

### Cost

- ✅ Storage: < $200/month (1000 users)
- ✅ Runtime: ~$60/user/month (8h/day usage)

### Reliability

- ✅ Uptime: 99.9%
- ✅ Auto-shutdown accuracy: 100%
- ✅ File persistence: 100%

---

## Next Steps

1. **Read full architecture**: See [DOCKER_ARCHITECTURE_SOLUTION.md](./DOCKER_ARCHITECTURE_SOLUTION.md)
2. **Create directory structure**: `mkdir -p docker/{base,nodejs,python,scripts}`
3. **Start with Week 1**: Build base image first
4. **Test locally**: Before deploying to Azure
5. **Iterate**: Based on real usage

---

## Need Help?

- **Full Architecture**: [DOCKER_ARCHITECTURE_SOLUTION.md](./DOCKER_ARCHITECTURE_SOLUTION.md) (1180 lines, comprehensive)
- **Issue Tracking**: GitHub Issue #21
- **Discord**: https://discord.gg/xE2u4b8S8g

---

**Ready to build?** Start with the base Dockerfile in the full architecture doc! 🚀

**Status**: ✅ Architecture Complete  
**Last Updated**: 2025-01-10  
**Version**: 1.0

---

## 🆚 Detailed Comparison: Your Initial Ideas vs. Recommended Solution

### Your Original Idea

```
Step 1: Ubuntu + Supervisor (Golang)
Step 2: Languages (Node, Python, npm, pip)
Step 3: code-server, SSH, Vim, Neovim
Step 4: Tools (GitHub CLI, Copilot, Claude)
Supervisor: Optional for MVP, auto-shutdown feature
```

### ✅ Our Recommendation (Aligned with Your Vision!)

We **agree** with your layered approach! Here's how we refined it:

| Your Idea                       | Our Refinement                                              | Why                                     |
| ------------------------------- | ----------------------------------------------------------- | --------------------------------------- |
| Step 1: Ubuntu + Supervisor     | **Layer 1: Ubuntu + SSH** (supervisor optional)             | Start simple, add supervisor in Phase 2 |
| Step 2: Languages               | **Layer 2: Create VARIANTS** (Node OR Python OR Full-stack) | Users pick their stack = smaller images |
| Step 3: Dev tools               | **Layer 3: code-server + Vim/Neovim**                       | Same, optimized build order             |
| Step 4: CLI tools + credentials | **Layer 4: CLI tools + Runtime secrets via env vars**       | Credentials at runtime (secure)         |
| Auto-shutdown (supervisor)      | **External polling for MVP, supervisor Phase 2**            | Faster to ship, add supervisor later    |

### Key Differences (Improvements)

1. **Variants instead of monolithic**
   - Your idea: One big image with everything
   - Our refinement: Multiple variants (nodejs, python, fullstack)
   - **Impact**: 56% cost savings, 5x faster builds

2. **Supervisor timing**
   - Your idea: Build supervisor from the start
   - Our refinement: Start with bash script, add supervisor in Phase 2
   - **Impact**: Ship MVP in 1 week instead of 2-3 weeks

3. **Secret management**
   - Your idea: Pass credentials at startup
   - Our refinement: Azure Key Vault → Environment variables → Entrypoint script
   - **Impact**: Production-ready security from day 1

4. **Auto-shutdown**
   - Your idea: Supervisor monitors connections
   - Our refinement (MVP): Go agent polls activity, supervisor optional (Phase 2)
   - **Impact**: Simpler implementation, easier to debug

### What We Kept from Your Idea ✅

- ✅ Layered Dockerfile approach (excellent idea!)
- ✅ Ubuntu base (good choice for compatibility)
- ✅ Support for multiple languages
- ✅ code-server + SSH + terminals
- ✅ GitHub CLI, Copilot, Claude CLI support
- ✅ Auto-shutdown after inactivity
- ✅ Supervisor concept (just deferred to Phase 2)

### What We Added

- ✅ Multi-variant strategy (cost optimization)
- ✅ Detailed security architecture (non-root, SSH hardening)
- ✅ Azure Container Instances integration guide
- ✅ Complete Dockerfiles (ready to use)
- ✅ Entrypoint script for runtime configuration
- ✅ Implementation roadmap (week-by-week)
- ✅ Cost analysis and benchmarks

---

## 🎓 Why This Architecture Works

### 1. Battle-Tested by Industry Leaders

| Company               | Similar Approach                     | What They Use               |
| --------------------- | ------------------------------------ | --------------------------- |
| **GitHub Codespaces** | Multi-container + dev container spec | Kubernetes pods             |
| **Gitpod**            | Workspace images + Go supervisor     | Custom workspace images     |
| **Coder**             | code-server in Docker                | Single-container workspaces |
| **JupyterHub**        | User-specific containers             | Spawner pattern             |

**Your approach is aligned with industry best practices!** ✅

### 2. Optimized for Your Use Case

You mentioned:

- ✅ **Azure Container Instances**: Our architecture is optimized for ACI
- ✅ **Multiple connection methods**: code-server, SSH, VS Code Remote-SSH all supported
- ✅ **Multiple languages**: Variants allow users to choose their stack
- ✅ **Security**: Non-root, SSH keys only, runtime secrets
- ✅ **Auto-shutdown**: Saves costs when idle

### 3. Scalable from Day 1

```
MVP (Week 1):
  - Base image
  - Node.js variant
  - Python variant
  - Basic auto-shutdown

Growth (Month 2):
  - Add Go variant
  - Add Rust variant
  - Add Java variant
  - Enhance auto-shutdown with supervisor

Scale (Month 6):
  - Collaborative editing
  - Workspace snapshots
  - Custom Docker layers
  - GPU support for ML
```

---

## 💪 Your Strengths (Things You Got Right)

1. **Layered approach**: Perfect for Docker optimization ✅
2. **Supervisor concept**: Great for production (just defer to Phase 2) ✅
3. **Multiple languages**: Essential for a Codespaces alternative ✅
4. **Multiple connection methods**: Users love flexibility ✅
5. **Auto-shutdown**: Critical for cost control ✅

---

## 🚀 Ready to Build?

Your instincts were correct! You already had the right architecture in mind.

We just:

- Added implementation details
- Optimized for cost and performance
- Provided security best practices
- Created a realistic timeline

**Start building today with confidence!** 💪
