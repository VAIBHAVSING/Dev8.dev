# Dev8 Agent Service

Go-based **stateless** backend service for orchestrating cloud development environments on Azure Container Instances (ACI).

## 🎯 Features

- ✅ **Docker Hub Integration**: Uses `vaibhavsing/dev8-workspace:latest` from Docker Hub
- ✅ **Dynamic Configuration**: Per-workspace secrets and API keys from API requests
- ✅ **Azure ACI Integration**: Direct integration with Azure Container Instances
- ✅ **Multi-Region Support**: Deploy environments across multiple Azure regions
- ✅ **Persistent Storage**: Azure Files integration for workspace persistence
- ✅ **Environment Lifecycle**: Create, start, stop, delete cloud environments
- ✅ **RESTful API**: Complete HTTP API for environment management
- ✅ **Health Monitoring**: Built-in health check and readiness endpoints
- ✅ **Graceful Shutdown**: Proper shutdown handling for production
- ✅ **Stateless Design**: No database - pure infrastructure orchestration

## 📚 Architecture

> **Important**: This service is **stateless** and does NOT have a database.

- **Database**: All data lives in Next.js (PostgreSQL + Prisma)
- **Communication**: REST/HTTP (not gRPC)
- **Responsibility**: Azure infrastructure orchestration only

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

### Quick Architecture Overview

```
Next.js (Port 3000)                     Go Agent (Port 8080)
├─ PostgreSQL (Prisma ORM)              ├─ Stateless HTTP API
├─ User Authentication                   ├─ Azure SDK Client
├─ Environment Metadata                  ├─ Multi-Region Support
└─ Business Logic                        └─ Resource Orchestration
         │                                        │
         └────── HTTP REST/JSON ─────────────────┘
                  (No gRPC)
```

## 🚀 Quick Start

```bash
# Install dependencies
go mod download

# Copy environment template
cp .env.example .env

# Run the service
go run main.go
```

## 📡 API Endpoints

### Environment Management

- `POST /api/v1/environments` - Create new environment
- `GET /api/v1/environments` - List all environments (placeholder)
- `GET /api/v1/environments/{id}` - Get environment details (placeholder)
- `POST /api/v1/environments/{id}/start` - Start environment
- `POST /api/v1/environments/{id}/stop` - Stop environment
- `DELETE /api/v1/environments/{id}` - Delete environment

**Note**: List/Get endpoints are placeholders. Next.js handles data queries from PostgreSQL.

See full documentation in [API_DOCUMENTATION.md](./API_DOCUMENTATION.md).

## 🐳 Docker Hub Configuration

The Agent deploys workspaces using the Docker Hub image: `vaibhavsing/dev8-workspace:latest`

### Static Configuration (Environment Variables)

Set in the Agent's `.env` file:

```bash
# Container Image Configuration
CONTAINER_IMAGE=vaibhavsing/dev8-workspace:latest
REGISTRY_SERVER=index.docker.io

# Optional: For private Docker Hub repositories
REGISTRY_USERNAME=your-dockerhub-username
REGISTRY_PASSWORD=your-dockerhub-token

# Agent's public URL (used by workspaces for callbacks)
AGENT_BASE_URL=http://dev8-agent.eastus.azurecontainer.io:8080
```

### Dynamic Configuration (Per-Workspace)

Passed in the `POST /api/v1/environments` request body:

```json
{
  "name": "my-workspace",
  "cloudProvider": "AZURE",
  "cloudRegion": "eastus",
  "cpuCores": 2,
  "memoryGB": 4,
  "storageGB": 20,
  
  // Optional dynamic values
  "githubToken": "ghp_xxxxxxxxxxxx",
  "gitUserName": "John Doe",
  "gitUserEmail": "john@example.com",
  "sshPublicKey": "ssh-rsa AAAAB3...",
  "codeServerPassword": "secure-password",
  "anthropicApiKey": "sk-ant-xxx",
  "openaiApiKey": "sk-proj-xxx",
  "geminiApiKey": "AIza..."
}
```

**Security:**
- All dynamic secrets are passed as `SecureValue` to Azure Container Instances
- Secrets are not visible in logs or container inspection
- Each workspace can have different credentials


