# Dev8.dev Docker Development Environment# Dev8.dev Docker Workspace

> Complete containerized development environment with VS Code Server, AI tools, and language support.Cloud development container with VS Code Server, multiple languages, and AI coding tools.

## Quick Start## 🏗️ Architecture

`bash`

# 1. Configure environment00-base → 10-languages → 20-vscode → 30-ai-tools (FINAL)

cp .env.example .env```

# Edit .env and set your GITHUB_TOKEN

**Layers:**

# 2. Build and start (one command)1. **00-base** - Ubuntu 22.04, SSH, system packages, SDKMAN, Homebrew

make up2. **10-languages** - Node.js, Python, Go, Rust

3. **20-vscode** - VS Code Server (code-server)

# 3. Access VS Code4. **30-ai-tools** - GitHub Copilot CLI, AI tool setup scripts

# Open browser: http://localhost:8080

# No password required by default## 🚀 Quick Start

````

### Build All Layers

**That's it!** You now have a complete development environment.

```bash

---cd docker



## Contents# Build all layers in correct order (REQUIRED)

make build-all

- [Architecture](#architecture)```

- [Configuration](#configuration)

- [Usage](#usage)**Note:** You must use `make build-all` because the layers must be built sequentially. Plain `docker compose build` won't work due to layer dependencies.

- [Production Deployment](#production-deployment)

- [Advanced Topics](#advanced-topics)### Run Locally



---```bash

# Start the workspace

## Architecturemake up



### Layer Structure# Or use docker compose directly

docker compose up -d workspace

````

00-base → Ubuntu + essential tools + dev8 user# Access:

10-languages → Go, Python, Node.js, Rust# - VS Code: http://localhost:8080 (password: dev8dev)

20-vscode → code-server (VS Code in browser)# - SSH: ssh -p 2222 dev8@localhost

30-ai-tools → GitHub Copilot, AI CLI tools

```# View logs

make logs

Each layer builds on the previous, allowing efficient caching.

# Stop

### Servicesmake down

```

- **VS Code Server** (port 8080): Browser-based VS Code

- **SSH** (port 2222): Optional shell access### Environment Variables

- **Supervisor API** (port 9000): Workspace monitoring

Create a `.env` file in the `docker/` directory:

### Volumes

```bash

- `dev8-home`: User home directory (~/.config, packages, etc.)# Required

- `dev8-workspace`: Your code and projectsGITHUB_TOKEN=ghp_xxx...



---# Optional

CODE_SERVER_PASSWORD=your_password

## ConfigurationANTHROPIC_API_KEY=sk-ant-xxx...

OPENAI_API_KEY=sk-xxx...

### Environment VariablesGEMINI_API_KEY=xxx...

```

**Required:**

````bash## 📦 Persistent User Packages

GITHUB_TOKEN=ghp_xxxxx  # GitHub token for Copilot

```Everything in `/home/dev8` persists across container restarts:



**Optional:**```

```bash/home/dev8/

# Authentication (default: none)├── .sdkman/           # Java, Kotlin, Scala (sdk install ...)

CODE_SERVER_AUTH=none           # or 'password'├── .linuxbrew/        # Ruby, PostgreSQL (brew install ...)

CODE_SERVER_PASSWORD=           # set if auth=password├── .npm/              # Node packages (npm install -g ...)

├── .local/            # Python packages (pip install --user ...)

# SSH (optional)├── .cargo/            # Rust packages (cargo install ...)

SSH_PASSWORD=                   # simple password auth└── .vscode-server/    # VS Code extensions

SSH_PUBLIC_KEY=                 # or public key auth```



# Git identity**Examples:**

GIT_USER_NAME=Your Name```bash

GIT_USER_EMAIL=you@example.com# Install Java

sdk install java 17.0.8-amzn

# AI API keys (optional)

ANTHROPIC_API_KEY=# Install Ruby

OPENAI_API_KEY=brew install ruby

GEMINI_API_KEY=

```# Install Node package

npm install -g typescript

### Security Notes

# Install Python package

- **Default**: No authentication (suitable for local development)pip install --user pytest

- **Production**: Set `CODE_SERVER_AUTH=password` and strong password

- **SSH**: Not required for VS Code access; only enable if needed# All persist in /home/dev8 volume!

````

---

## 🤖 AI Coding Tools

## Usage

### GitHub Copilot CLI

### Development (Local)```bash

gh copilot suggest "create a REST API in Node.js"

````bashgh copilot explain "docker run -d nginx"

# Start workspace```

make up

### AI APIs (if configured)

# View logs- Anthropic Claude API

make logs- OpenAI API

- Google Gemini API

# Stop workspace

make downSetup scripts in `/usr/local/share/ai-tools/`



# Rebuild after changes## � Services

make rebuild

```| Service | Port | Purpose |

|---------|------|---------|

### Accessing the Workspace| VS Code Server | 8080 | Web-based VS Code |

| SSH Server | 2222 | Terminal access |

**VS Code (Primary):**| Workspace Supervisor | 9000 | Monitoring |

- URL: http://localhost:8080

- No password required (default)## � Directory Structure



**SSH (Optional):**```

```bashdocker/

# If SSH_PASSWORD is set├── images/

ssh -p 2222 dev8@localhost│   ├── 00-base/              # Base system + SDKMAN + Homebrew

│   ├── 10-languages/         # Node, Python, Go, Rust

# If SSH_PUBLIC_KEY is set│   ├── 20-vscode/            # VS Code Server

ssh -p 2222 -i ~/.ssh/your_key dev8@localhost│   └── 30-ai-tools/          # AI CLI tools

```├── shared/

│   ├── config/               # Shared configs

### Common Tasks│   └── scripts/              # Helper scripts

├── docker-compose.yml        # Local development

**View running containers:**├── Makefile                  # Build shortcuts

```bash└── README.md                 # This file

docker compose ps```

````

## 🛠️ Development

**Execute command in container:**

```````bash### Build Individual Layers

docker exec -it dev8-workspace bash

``````bash

make build-base

**Check container health:**make build-languages

```bashmake build-vscode

docker compose logs workspace | tail -50make build-ai-tools

```````

---### Test

## Production Deployment```bash

# Start container

### Azure Container Instances (ACI)docker compose up -d workspace

**Quick Deploy:**# Check services

```bashdocker compose exec workspace supervisorctl status

# 1. Configure production environment

cp .env.prod.example .env.prod# View logs

# Edit .env.prod with your Azure settingsdocker compose logs -f workspace

```

# 2. Build and push image

make prod-build### Clean Up

make prod-push

```bash

# 3. Deploy to ACIdocker compose down -v  # Remove containers and volumes

make prod-deploymake clean              # Remove images

```

# 4. Check status

make prod-status## � Documentation

````

- **ARCHITECTURE.md** - Architecture decisions and design

### Production Configuration- **CONTAINER_CAPABILITIES.md** - What the container can do

- **CHANGELOG.md** - Version history

**Key differences from development:**

- Use pre-built images (no build context)## 📄 License

- Azure Files for persistence

- Resource limits enforcedPart of Dev8.dev - See [LICENSE](../LICENSE)

- Authentication recommended

**Environment setup:**
```bash
# Required
ENVIRONMENT_ID=dev8-prod-001
GITHUB_TOKEN=ghp_xxxxx
CONTAINER_REGISTRY=yourregistry.azurecr.io
AZURE_STORAGE_ACCOUNT=youraccount
AZURE_STORAGE_KEY=xxxxx

# Recommended
CODE_SERVER_AUTH=password
CODE_SERVER_PASSWORD=$(openssl rand -base64 32)
````

**Deploy script:**

```bash
./deploy-to-aci.sh
```

See [Production Deployment Details](#production-deployment-details) below.

---

## Advanced Topics

### Manual Layer Building

```bash
# Build individual layers (in order)
docker compose build base
docker compose build languages
docker compose build vscode
docker compose build workspace
```

### Custom Configuration

**Disable authentication:**

```bash
CODE_SERVER_AUTH=none
```

**Enable password protection:**

```bash
CODE_SERVER_AUTH=password
CODE_SERVER_PASSWORD=your_secure_password
```

**SSH with password:**

```bash
SSH_PASSWORD=your_ssh_password
```

**SSH with public key:**

```bash
SSH_PUBLIC_KEY="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAA..."
```

### Troubleshooting

**Container won't start:**

```bash
# Check logs
docker compose logs workspace

# Check environment
docker exec dev8-workspace env

# Restart
make rebuild
```

**Port conflicts:**

```bash
# Change ports in docker-compose.yml
ports:
  - "8081:8080"  # VS Code on 8081 instead
```

**Volume issues:**

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect dev8-workspace

# Clean rebuild
make clean
make up
```

---

## Production Deployment Details

### Prerequisites

1. **Azure Container Registry (ACR)**

   ```bash
   az acr create --name yourregistry --resource-group yourgroup --sku Basic
   ```

2. **Azure Storage Account**

   ```bash
   az storage account create --name yourstorage --resource-group yourgroup
   ```

3. **Azure File Shares**
   ```bash
   az storage share create --name dev8-home --account-name yourstorage
   az storage share create --name dev8-workspace --account-name yourstorage
   ```

### Deployment Process

**1. Build production image:**

```bash
docker build -t yourregistry.azurecr.io/dev8-workspace:latest -f images/30-ai-tools/Dockerfile .
```

**2. Push to registry:**

```bash
az acr login --name yourregistry
docker push yourregistry.azurecr.io/dev8-workspace:latest
```

**3. Deploy using script:**

```bash
./deploy-to-aci.sh
```

Or manually:

```bash
az container create \
  --resource-group yourgroup \
  --name dev8-workspace \
  --image yourregistry.azurecr.io/dev8-workspace:latest \
  --cpu 2 --memory 4 \
  --ports 8080 2222 9000 \
  --environment-variables \
    GITHUB_TOKEN=ghp_xxxxx \
    CODE_SERVER_AUTH=password \
    CODE_SERVER_PASSWORD=xxxxx
```

### Production Checklist

- [ ] Set strong passwords (use `openssl rand -base64 32`)
- [ ] Configure Azure Files for persistence
- [ ] Set up backup strategy
- [ ] Configure monitoring/logging
- [ ] Test failover scenarios
- [ ] Document access procedures
- [ ] Set resource limits
- [ ] Enable HTTPS (use Azure Application Gateway)

### Monitoring

```bash
# Check container status
az container show --resource-group yourgroup --name dev8-workspace

# View logs
az container logs --resource-group yourgroup --name dev8-workspace

# Restart container
az container restart --resource-group yourgroup --name dev8-workspace
```

---

## 📚 Documentation

- **[VOLUME_GUIDE.md](./VOLUME_GUIDE.md)** - Complete guide to volume management, package installation, and storage optimization
- **[CONTAINER_CAPABILITIES.md](./CONTAINER_CAPABILITIES.md)** - Whtalled and container features
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture and design decisions
- **[ACR_SETUP_GUIDE.md](./ACR_SETUP_GUIDE.md)** - Azure Container Registry setup
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history and changes

---

## File Reference

- `docker-compose.yml`: Local development configuration
- `docker-compose.prod.yml`: Production (ACI) configuration
- `.env.example`: Development environment template
- `.env.prod.example`: Production environment template
- `deploy-to-aci.sh`: Automated ACI deployment script
- `Makefile`: Common commands and shortcuts

---

## License

See [LICENSE](../LICENSE) for details.
