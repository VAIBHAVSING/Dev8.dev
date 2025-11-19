# Agent Configuration Guide

## Overview

The agent can be configured to work with different Azure deployment modes:

- **DEV + ACA**: Development environment using Azure Container Apps (Central India)
- **PROD + ACI**: Production environment using Azure Container Instances (Central India) - Coming Soon

## Quick Start

### Configure for DEV (ACA)

```bash
cd apps/agent
make config-dev-aca
```

This will:

1. Fetch all configuration from Azure
2. Create/update `.env` file with:
   - Azure subscription and resource group info
   - Storage account credentials
   - Container registry credentials
   - ACA environment ID
3. Set deployment mode to `aca`

### Verify Configuration

```bash
make config-show
```

Output:

```
Current Agent Configuration:
==============================
Deployment Mode: aca
Resource Group: dev8-dev-rg
Region: centralindia
Storage Account: dev8devst3ttnbdco3yuv6
Container Registry: dev8devcr3ttnbdco3yuv6.azurecr.io
ACA Environment: dev8-dev-aca-env
```

### Validate Configuration

```bash
make config-validate
```

Checks:

- ✓ All required environment variables are set
- ✓ Deployment mode matches required variables
- ✓ ACA environment ID is set (for ACA mode)

---

## Environment Variables

### Server Configuration

```bash
AGENT_PORT=8080                    # Agent API port
AGENT_HOST=0.0.0.0                 # Bind address
ENVIRONMENT=development             # Environment name
LOG_LEVEL=info                     # Log level
```

### CORS Configuration

```bash
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### Azure Configuration

**Subscription & Authentication:**

```bash
AZURE_SUBSCRIPTION_ID=<from Azure>
AZURE_TENANT_ID=<from Azure>
AZURE_CLIENT_ID=<service principal>
AZURE_CLIENT_SECRET=<service principal secret>
```

**Resource Configuration:**

```bash
AZURE_RESOURCE_GROUP=dev8-dev-rg
AZURE_STORAGE_ACCOUNT=dev8devst3ttnbdco3yuv6
AZURE_STORAGE_KEY=<from Azure>
AZURE_DEFAULT_REGION=centralindia
```

### Container Configuration

**Azure Container Registry:**

```bash
AZURE_CONTAINER_REGISTRY=dev8devcr3ttnbdco3yuv6.azurecr.io
REGISTRY_USERNAME=dev8devcr3ttnbdco3yuv6
REGISTRY_PASSWORD=<from Azure>
```

**Container Images:**

```bash
CONTAINER_IMAGE_NAME=dev8-workspace:1.1
CONTAINER_IMAGE=vaibhavsing/dev8-workspace:latest
REGISTRY_SERVER=index.docker.io
```

### Deployment Mode

**For DEV (ACA):**

```bash
AZURE_DEPLOYMENT_MODE=aca
AZURE_ACA_ENVIRONMENT_ID=/subscriptions/.../dev8-dev-aca-env
```

**For PROD (ACI) - Coming Soon:**

```bash
# AZURE_DEPLOYMENT_MODE=aci
# AZURE_RESOURCE_GROUP=dev8-prod-rg
# AZURE_DEFAULT_REGION=centralindia
```

---

## Makefile Commands

| Command                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `make config-dev-aca`  | Configure for DEV with ACA (fetch from Azure)   |
| `make config-prod-aci` | Configure for PROD with ACI (not yet available) |
| `make config-show`     | Show current configuration                      |
| `make config-validate` | Validate .env configuration                     |

---

## Manual Configuration

If you need to manually configure the `.env` file:

1. Copy from example:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and set values

3. Validate:
   ```bash
   make config-validate
   ```

---

## Automatic Configuration from IaC

The agent is automatically configured when deploying infrastructure:

**From Azure IaC:**

```bash
cd ../../in/azure
make deploy-dev-aca
```

This automatically calls `make config-dev-aca` in the agent directory.

---

## Configuration Flow

```
Azure Infrastructure
        ↓
    IaC Deployment
        ↓
  Fetch Azure Config
        ↓
   Update .env File
        ↓
   Validate Config
        ↓
    Agent Ready
```

---

## Troubleshooting

### Issue: "Configuration not found"

**Solution:**

```bash
make config-dev-aca
```

### Issue: "Validation failed"

**Solution:**
Check which variables are missing:

```bash
make config-validate
```

Then run:

```bash
make config-dev-aca
```

### Issue: "Azure CLI not logged in"

**Solution:**

```bash
az login
az account set --subscription 761fc168-2c81-4826-bddf-a188d01d5003
```

### Issue: "Storage key not found"

**Solution:**
Ensure infrastructure is deployed:

```bash
cd ../../in/azure
make status
```

If not deployed:

```bash
make deploy-dev-aca
```

---

## Best Practices

1. **Never commit `.env` to git**
   - Already in `.gitignore`
   - Contains sensitive credentials

2. **Use `make config-dev-aca` after infrastructure changes**
   - Ensures configuration stays in sync
   - Fetches latest credentials

3. **Validate before running the agent**

   ```bash
   make config-validate && make dev
   ```

4. **For production**
   - Use separate `.env` file
   - Use Azure Key Vault for secrets
   - Enable managed identity

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Service Principal Credentials**
   - Store securely
   - Rotate regularly
   - Never commit to version control

2. **Storage Keys**
   - Auto-rotated by Azure
   - Fetched on-demand
   - Use managed identity in production

3. **Registry Passwords**
   - Auto-generated by Azure
   - Fetched when needed
   - Use ACR tasks in production

4. **Environment Files**
   - Never commit `.env`
   - Use different `.env` for dev/prod
   - Consider Azure Key Vault

---

## Next Steps

After configuration:

1. **Start the agent:**

   ```bash
   make dev
   ```

2. **Run tests:**

   ```bash
   make test
   ```

3. **Deploy workspaces:**
   ```bash
   cd ../../docker
   make prod-deploy
   ```

---

Last Updated: $(date)
