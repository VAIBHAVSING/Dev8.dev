# 🐳 Docker Container Capabilities

**Updated:** October 24, 2025  
**Status:** ✅ Ready for Production

---

## 🎯 What This Container Does

✅ **Development Environment**
- VS Code Server on port 8080
- SSH Server on port 2222  
- Workspace Supervisor on port 9000

✅ **Pre-installed Languages**
- Node.js 20 (npm, pnpm, yarn, bun)
- Python 3.11 (pip, poetry)
- Go 1.21
- Rust (stable)

✅ **User Package Managers**
- **SDKMAN** - Java, Kotlin, Scala, Gradle, Maven
- **Homebrew** - Ruby, PostgreSQL, Redis, etc.
- All packages saved to `/home/dev8` volume

✅ **AI Coding Tools**
- GitHub Copilot CLI (`gh copilot`)
- Anthropic Claude API support
- OpenAI API support
- Google Gemini API support

---

## 📦 Persistent Storage

Two Docker volumes must be mounted:

```
/home/dev8     → User packages, configs, tools
/workspace     → User code and projects
```

**What persists in `/home/dev8`:**
```
.sdkman/           # Java, Kotlin, Scala
.linuxbrew/        # Ruby, PostgreSQL, etc.
.npm/              # Node global packages
.local/            # Python user packages
.cargo/            # Rust packages
.vscode-server/    # VS Code extensions
.config/           # Tool configurations
.ssh/              # SSH keys
```

---

## 🔑 Environment Variables

**Required:**
```bash
GITHUB_TOKEN=ghp_xxx...
```

**Optional:**
```bash
CODE_SERVER_PASSWORD=your_password
SSH_PUBLIC_KEY="ssh-rsa AAAA..."
GIT_USER_NAME="Your Name"
GIT_USER_EMAIL="you@example.com"

# AI API Keys (optional)
ANTHROPIC_API_KEY=sk-ant-xxx...
OPENAI_API_KEY=sk-xxx...
GEMINI_API_KEY=xxx...
```

---

## 🚀 How Users Install Packages

### Java/JVM Languages (SDKMAN)
```bash
sdk install java 17.0.8-amzn
sdk install kotlin
sdk install gradle
# Installed to /home/dev8/.sdkman/ → persists!
```

### System Packages (Homebrew)
```bash
brew install ruby
brew install postgresql
brew install redis
# Installed to /home/dev8/.linuxbrew/ → persists!
```

### Node.js Packages
```bash
npm install -g typescript ts-node
# Installed to /home/dev8/.npm/ → persists!
```

### Python Packages
```bash
pip install --user pytest requests
# Installed to /home/dev8/.local/ → persists!
```

### Rust Packages
```bash
cargo install ripgrep bat fd-find
# Installed to /home/dev8/.cargo/ → persists!
```

---

## 🎯 Container Architecture
│     - Upload to Azure Blob Storage                          │
│  4. Control Plane: Deletes ACI container (cost savings)     │
│  5. OPTIONAL: Delete Azure Files shares (more savings)      │
│     - Backup in Blob is source of truth                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    3. RESTART                                │
├─────────────────────────────────────────────────────────────┤
│  1. User starts workspace again                             │
│  2. Control Plane: Recreates Azure Files shares             │
│  3. Control Plane: Downloads backup from Blob               │
│  4. Control Plane: Extracts to Azure Files shares           │
│  5. Control Plane: Creates ACI container with volumes       │
│  6. Container starts → User continues seamlessly!           │
│  7. All previous packages, configs, code intact! ✅          │
└─────────────────────────────────────────────────────────────┘
```

### Key Simplification: Backup/Restore Outside Container

**Old Approach (Complex):**
- Container runs Azure CLI inside
- Container creates tar.gz inside
- Container uploads to Blob
- Requires Azure credentials in container
- Slow and error-prone

**New Approach (Simple & Fast):**
- Control Plane handles all backup/restore
- Container just runs user's code
- Uses Docker volume operations

```
Container Layer Structure:
┌──────────────────────────────────────┐
│   30-ai-tools (Final - Port 8080)   │
│   GitHub Copilot, AI APIs            │
├──────────────────────────────────────┤
│   20-vscode (Port 8080)              │
│   code-server + SSH (2222)           │
├──────────────────────────────────────┤
│   10-languages                        │
│   Node.js, Python, Go, Rust          │
├──────────────────────────────────────┤
│   00-base                             │
│   Ubuntu 22.04 + SDKMAN + Homebrew   │
└──────────────────────────────────────┘
```

---

## 🔌 Ports

| Port | Service | Access |
|------|---------|--------|
| 8080 | VS Code Server | `http://localhost:8080` |
| 2222 | SSH Server | `ssh -p 2222 dev8@localhost` |
| 9000 | Workspace Supervisor | Health checks only |

---

## 🛠️ Pre-installed Tools

### Development Tools
- Git, GitHub CLI
- Vim, Neovim
- tmux, screen
- curl, wget, jq

### Language Runtimes
- **Node.js 20** (npm, pnpm, yarn, bun)
- **Python 3.11** (pip, poetry)
- **Go 1.21**
- **Rust** (stable, cargo)

### Package Managers for User Installations
- **SDKMAN** - Java, Kotlin, Scala, Gradle, Maven, etc.
- **Homebrew** - Ruby, PostgreSQL, Redis, etc.

### AI Coding Tools
- GitHub Copilot CLI
- Claude API support
- OpenAI API support
- Gemini API support

---

## 📖 Documentation

- **README.md** - Quick start and usage
- **ARCHITECTURE.md** - Architecture decisions
- **CHANGELOG.md** - Version history

---

## ✅ Ready to Use

The container is complete and ready for local development or cloud deployment. Mount the two volumes (`/home/dev8` and `/workspace`) and start coding!

java -version    # ✅ Still works!
tree --version   # ✅ Still works!
pip list         # ✅ requests still there!
```

### Test backup/restore (using control plane scripts):

```bash
# Stop workspace
docker compose -f docker/docker-compose.yml down

# Backup volume (simulating control plane)
docker run --rm \
  -v docker_dev8-home:/source:ro \
  alpine tar czf - -C /source . > /tmp/backup.tar.gz

echo "Backup size: $(du -h /tmp/backup.tar.gz | cut -f1)"

# Delete volume (simulate fresh start)
docker volume rm docker_dev8-home

# Create new volume
docker volume create docker_dev8-home

# Restore from backup
docker run --rm \
  -v docker_dev8-home:/target \
  -v /tmp/backup.tar.gz:/backup.tar.gz:ro \
  alpine tar xzf /backup.tar.gz -C /target

# Start container
docker compose -f docker/docker-compose.yml up -d workspace

# Verify - everything restored!
docker exec -it dev8-workspace bash
java -version    # ✅ Restored!
tree --version   # ✅ Restored!
```

---

## 📝 Summary

Your Docker containers are **fully capable** for Azure ACI deployment with:

1. ✅ **Persistent user installations** via user-space package managers (SDKMAN, Homebrew)
2. ✅ **Simple volume architecture** - Control plane handles backup/restore
3. ✅ **AI agentic coding CLI** support (Copilot, Claude, OpenAI)
4. ✅ **Multiple IDE access** (VS Code Server, SSH)
5. ✅ **Clean separation** - Container runs code, control plane manages lifecycle

**Container is simple and focused:**
- Runs VS Code Server
- Runs SSH Server
- Runs Workspace Supervisor  
- Mounts volumes and persists user data
- No complex backup logic needed!

**Control plane handles:**
- Create/stop ACI containers
- Backup volumes to Azure Blob (using Docker volume tar)
- Restore volumes from Azure Blob (using Docker volume extract)
- Manage Azure Files shares
- Full lifecycle orchestration

**See `docker/CONTROL_PLANE_BACKUP.md` for backup/restore scripts and examples!** 🚀
