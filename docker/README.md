# Dev8.dev Docker Images - Layered Architecture

Production-ready Docker infrastructure for Dev8.dev cloud workspaces with VS Code Server and AI CLI tools.

## 🏗️ Layered Architecture

```
supervisor-builder → 00-base → 10-languages → 20-vscode → 30-ai-tools
   (Go binary)      (1.5GB)      (2.5GB)        (3.0GB)    (3.5GB FINAL)
```

### Layer Structure

1. **00-base** - Foundation
   - Ubuntu 22.04 + system packages
   - SSH server (hardened, port 2222)
   - dev8 user + workspace directory
   - workspace-supervisor binary

2. **10-languages** - Runtimes
   - Node.js 20 LTS (npm, pnpm, yarn, bun)
   - Python 3.11 (pip, poetry, black)
   - Go 1.21
   - Rust (stable)

3. **20-vscode** - IDE
   - code-server (VS Code in browser)
   - Pre-configured settings
   - SSH + code-server entrypoint

4. **30-ai-tools** - AI CLIs (Final)
   - GitHub CLI + Copilot extension
   - Azure CLI (backup)
   - AI tool wrappers (Claude, Gemini)
   - Complete entrypoint

## 🚀 Quick Start

### Build

```bash
cd docker
make build-all
```

Or build individually:
```bash
make build-base        # Layer 1
make build-languages   # Layer 2
make build-vscode      # Layer 3
make build-ai-tools    # Layer 4 (final)
```

### Run Locally

```bash
make run-vscode
# Access at http://localhost:8080 (password: dev8dev)
```

## 📁 Directory Structure

```
docker/
├── images/                    # Layered image definitions
│   ├── 00-base/              # Base system
│   ├── 10-languages/         # Language runtimes
│   ├── 20-vscode/            # VS Code Server
│   │   ├── config/
│   │   │   └── settings.json
│   │   └── entrypoint.sh
│   └── 30-ai-tools/          # AI CLI tools (final)
│       ├── scripts/
│       │   ├── setup-copilot.sh
│       │   ├── setup-claude.sh
│       │   └── setup-gemini.sh
│       └── entrypoint.sh
├── shared/                    # Shared resources
│   └── scripts/
│       └── common.sh         # Shared bash functions
├── scripts/
│   └── build.sh              # Build orchestrator
├── Makefile                   # Build automation
├── .dockerignore             # Build context optimization
└── README.md                 # This file
```

## 🔑 Environment Variables

**Required:**
- `GITHUB_TOKEN` - GitHub personal access token

**Optional:**
- `CODE_SERVER_PASSWORD` - VS Code password (default: `dev8dev`)
- `SSH_PUBLIC_KEY` - SSH public key for access
- `GIT_USER_NAME` / `GIT_USER_EMAIL` - Git configuration
- `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` / `GEMINI_API_KEY` - AI APIs

## 🧪 Testing

```bash
make test              # Test all layers
make test-base         # Test base only
make test-languages    # Test languages only
make test-vscode       # Test VS Code only
```

## ⚡ Performance

| Layer | Fresh Build | Incremental | Size |
|-------|-------------|-------------|------|
| 00-base | ~3 min | - | ~1.5GB |
| 10-languages | ~5 min | ~2 min | ~2.5GB |
| 20-vscode | ~2 min | ~1 min | ~3.0GB |
| 30-ai-tools | ~2 min | ~1 min | ~3.5GB |
| **Total** | **~12 min** | **~3 min** | **3.5GB** |

## 🎯 Available Images

- `dev8-base:latest` - Base system only
- `dev8-languages:latest` - With language runtimes
- `dev8-vscode:latest` - With VS Code Server
- `dev8-workspace:latest` - Complete (recommended)

## 🔧 Makefile Commands

```bash
make help              # Show all commands
make build-all         # Build all 4 layers
make build-base        # Build base only
make build-languages   # Build languages only
make build-vscode      # Build VS Code only
make build-ai-tools    # Build AI tools only
make test              # Run all tests
make run-vscode        # Run locally
make clean             # Clean up images
```

## 🤖 Using AI Tools

### GitHub Copilot CLI
```bash
gh copilot suggest "create a REST API in Node.js"
gh copilot explain "docker run -d nginx"
```

### Claude API (if configured)
```bash
source /usr/local/share/ai-tools/setup-claude.sh
claude "Explain Docker layers"
```

## 📖 Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Architecture decisions
- [CHANGELOG.md](./CHANGELOG.md) - Version history  
- [MIGRATION.md](./MIGRATION.md) - Migration from old structure

## 📊 Key Improvements

| Aspect | Before | After |
|--------|--------|-------|
| Build time (fresh) | ~20 min | **~12 min** |
| Build time (incremental) | ~15 min | **~3 min** |
| Code duplication | High | **None** |
| Testing | Manual | **Automated** |
| Layers | Mixed | **4 clean layers** |

## 📄 License

Part of Dev8.dev - See [LICENSE](../LICENSE)

---

**Built for cloud development workspaces** 🚀

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
