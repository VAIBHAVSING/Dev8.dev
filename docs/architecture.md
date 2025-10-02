# Dev8.dev Architecture (High-Level)

**Public Documentation - Implementation details are proprietary**

## System Overview

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────┐
│  Next.js Web    │ (Open Source)
│   Frontend      │
└────────┬────────┘
         │ API
         ▼
┌─────────────────┐
│   Go Backend    │ (Open Source)
│ Environment Mgr │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Cloud Provider  │ (Enterprise: Azure/AWS/GCP)
│  - Containers   │
│  - Storage      │
│  - Networking   │
└─────────────────┘
```

## Components

### Frontend (Open Source)
- **Technology:** Next.js 14, React, TypeScript
- **Features:**
  - User dashboard
  - Environment management UI
  - Real-time status updates
  - VS Code/CLI iframe embedding
- **Repository:** Public

### Backend (Open Source)
- **Technology:** Go, Gin framework
- **Features:**
  - Environment lifecycle management
  - User authentication
  - Resource provisioning API
  - WebSocket for real-time updates
- **Repository:** Public

### Infrastructure (Enterprise Only)
- **Technology:** Bicep, Terraform, Docker
- **Features:**
  - Azure/AWS/GCP templates
  - Cost-optimized configurations
  - Security hardening
  - Multi-environment setup
- **Repository:** Private

## Multi-CLI Support

Dev8.dev supports multiple development environments:

| CLI | Description | Port |
|-----|-------------|------|
| VS Code Server | Full-featured VS Code | 8080 |
| Claude Code CLI | Anthropic AI assistant | 8081 |
| GitHub Copilot CLI | GitHub AI assistant | 8082 |
| Gemini CLI | Google AI assistant | 8083 |

## Deployment Models

### Community Edition (Free)
- Bring your own infrastructure
- Deploy application code yourself
- Self-managed

### Professional+ ($99/month)
- Fully managed infrastructure
- All CLI types supported
- Automated deployments

### Enterprise ($499/month)
- Everything in Professional+
- Access to infrastructure code
- Custom deployments
- Private cloud options

## Technology Stack

**Frontend:**
- Next.js 14
- React 18
- TypeScript
- TailwindCSS

**Backend:**
- Go 1.21+
- Gin web framework
- PostgreSQL
- Redis

**Infrastructure:** (Enterprise)
- Azure Container Instances
- Azure Files
- Azure Container Registry
- Docker

## Security

- TLS 1.2+ encryption
- JWT authentication
- Role-based access control
- Network isolation
- Secret management

## Scaling

The platform can scale from single users to thousands:
- Horizontal container scaling
- Multi-region deployment (Enterprise)
- Load balancing
- Auto-scaling policies

---

**For detailed infrastructure documentation, see Enterprise tier.**

**Questions?** Open an issue or join our community discussions.
