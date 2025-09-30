# Azure Infrastructure Setup Guide

Complete step-by-step guide for setting up the Azure infrastructure for Dev8.dev MVP.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Manual Setup](#manual-setup)
- [Configuration](#configuration)
- [Verification](#verification)
- [Next Steps](#next-steps)
- [Troubleshooting](#troubleshooting)

## Prerequisites

Before starting, ensure you have:

1. **Azure Account**
   - Active Azure subscription
   - Sufficient permissions to create resources
   - Access to Azure Portal

2. **Azure CLI**
   - Version 2.50.0 or later
   - Installation: https://docs.microsoft.com/en-us/cli/azure/install-azure-cli

3. **Required Tools**
   - Bash shell (Linux/macOS/WSL)
   - `jq` or `python3` (for credential parsing)
   - `openssl` (for generating random suffixes)

### Install Azure CLI

**macOS:**
```bash
brew update && brew install azure-cli
```

**Ubuntu/Debian:**
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
```

**Windows (WSL/Git Bash):**
```bash
# Follow instructions at https://aka.ms/installazurecliwindows
```

### Verify Installation

```bash
az --version
az login
```

## Quick Start

The fastest way to set up your Azure infrastructure:

### 1. Login to Azure

```bash
az login
```

This will open a browser window for authentication. After login, verify your subscription:

```bash
az account show
```

### 2. Run Setup Script

```bash
cd scripts/azure
./setup-infrastructure.sh
```

This script will:
- Create resource group `dev8-mvp-rg`
- Create storage account with random suffix
- Create container registry with random suffix
- Create service principal for programmatic access
- Set up cost management budget ($50/month)
- Generate `.env.azure` configuration file

### 3. Configure Credentials

```bash
./configure-credentials.sh
```

This adds service principal credentials to your environment files.

### 4. Validate Setup

```bash
./validate-setup.sh
```

This verifies all resources are properly configured.

## Manual Setup

If you prefer to create resources manually or customize the setup:

### Step 1: Create Resource Group

```bash
az group create \
  --name dev8-mvp-rg \
  --location eastus \
  --tags Project=Dev8 Environment=MVP
```

### Step 2: Create Storage Account

Generate a unique name (storage names must be globally unique):

```bash
STORAGE_NAME="dev8mvpstorage$(openssl rand -hex 4)"

az storage account create \
  --name $STORAGE_NAME \
  --resource-group dev8-mvp-rg \
  --location eastus \
  --sku Standard_LRS \
  --kind StorageV2 \
  --min-tls-version TLS1_2 \
  --tags Project=Dev8 Environment=MVP
```

### Step 3: Create Container Registry

Generate a unique name (registry names must be globally unique):

```bash
REGISTRY_NAME="dev8mvpregistry$(openssl rand -hex 4)"

az acr create \
  --resource-group dev8-mvp-rg \
  --name $REGISTRY_NAME \
  --sku Basic \
  --admin-enabled true \
  --location eastus \
  --tags Project=Dev8 Environment=MVP
```

### Step 4: Create Service Principal

Get your subscription ID:

```bash
SUBSCRIPTION_ID=$(az account show --query id -o tsv)

az ad sp create-for-rbac \
  --name dev8-mvp-sp \
  --role contributor \
  --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/dev8-mvp-rg \
  --sdk-auth > azure-credentials.json

chmod 600 azure-credentials.json
```

**Important:** Keep `azure-credentials.json` secure and never commit it to git!

### Step 5: Create Cost Management Budget

```bash
az consumption budget create \
  --budget-name dev8-mvp-budget \
  --resource-group dev8-mvp-rg \
  --amount 50 \
  --time-grain Monthly \
  --start-date $(date +%Y-%m-01) \
  --end-date $(date -d "1 year" +%Y-%m-01)
```

Note: You may need additional permissions for cost management. If this fails, you can create budgets manually in the Azure Portal.

## Configuration

### Environment Variables

After setup, you'll have these files:

- `.env.azure` - Root level Azure configuration
- `apps/agent/.env` - Go backend Azure configuration
- `azure-credentials.json` - Service principal credentials

### Example `.env.azure`

```bash
# Azure Authentication
AZURE_SUBSCRIPTION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_TENANT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
AZURE_CLIENT_SECRET=your-secret-here

# Azure Resources
AZURE_RESOURCE_GROUP=dev8-mvp-rg
AZURE_STORAGE_ACCOUNT=dev8mvpstorage12345678
AZURE_CONTAINER_REGISTRY=dev8mvpregistry12345678
AZURE_REGION=eastus

# Storage Connection
AZURE_STORAGE_CONNECTION_STRING="DefaultEndpointsProtocol=https;..."
AZURE_STORAGE_KEY=your-storage-key-here

# Container Registry
AZURE_REGISTRY_LOGIN_SERVER=dev8mvpregistry12345678.azurecr.io
AZURE_REGISTRY_USERNAME=dev8mvpregistry12345678
AZURE_REGISTRY_PASSWORD=your-registry-password-here
```

### Retrieve Credentials Later

If you need to retrieve credentials after setup:

**Storage Account Key:**
```bash
az storage account keys list \
  --resource-group dev8-mvp-rg \
  --account-name $STORAGE_NAME \
  --query "[0].value" -o tsv
```

**Container Registry Credentials:**
```bash
az acr credential show \
  --name $REGISTRY_NAME \
  --query "{username:username, password:passwords[0].value}"
```

## Verification

### Automated Verification

Run the validation script:

```bash
cd scripts/azure
./validate-setup.sh
```

Expected output:
```
✓ Azure CLI is installed
✓ Authenticated to Azure
✓ .env.azure exists
✓ Resource group 'dev8-mvp-rg' exists
✓ Storage account is accessible
✓ Container registry is accessible
✓ Service principal credentials are configured
```

### Manual Verification

**List all resources:**
```bash
az resource list --resource-group dev8-mvp-rg --output table
```

**Check storage account:**
```bash
az storage account show \
  --name $STORAGE_NAME \
  --resource-group dev8-mvp-rg
```

**Check container registry:**
```bash
az acr show \
  --name $REGISTRY_NAME \
  --resource-group dev8-mvp-rg
```

**Test registry login:**
```bash
az acr login --name $REGISTRY_NAME
```

## Next Steps

After completing the Azure setup:

1. **Build VS Code Server Images**
   - Follow instructions in Issue #21
   - Create Node.js, Python, and Go development images
   - Push images to Azure Container Registry

2. **Develop Go Backend**
   - Follow instructions in Issue #15
   - Implement Azure SDK integration
   - Create environment management API

3. **Test Container Deployment**
   - Deploy test ACI container
   - Verify Azure Files mounting
   - Test VS Code access

## Using Infrastructure as Code (Bicep)

For reproducible deployments, use the Bicep templates:

### Deploy to Development

```bash
cd azure-infrastructure

# Create resource group first
az group create --name dev8-mvp-rg --location eastus

# Deploy using parameter file
az deployment group create \
  --resource-group dev8-mvp-rg \
  --template-file main.bicep \
  --parameters parameters/dev.bicepparam
```

### Deploy to Production

```bash
az deployment group create \
  --resource-group dev8-prod-rg \
  --template-file main.bicep \
  --parameters parameters/prod.bicepparam
```

### View Deployment Outputs

```bash
az deployment group show \
  --resource-group dev8-mvp-rg \
  --name main \
  --query properties.outputs
```

## Troubleshooting

See [azure-troubleshooting.md](./azure-troubleshooting.md) for common issues and solutions.

### Quick Fixes

**"Resource name already exists":**
- Resource names must be globally unique
- Run cleanup script and try again with new random suffix

**"Insufficient permissions":**
- Verify you have Contributor role on subscription
- Contact your Azure administrator

**"az: command not found":**
- Install Azure CLI (see Prerequisites)
- Restart your terminal

**"Not logged in to Azure":**
```bash
az login
az account set --subscription "Your Subscription Name"
```

## Security Best Practices

1. **Never commit sensitive files:**
   - `.env.azure`
   - `azure-credentials.json`
   - Any files containing keys or passwords

2. **Rotate credentials regularly:**
   - Service principal secrets should be rotated every 90 days
   - Storage keys should be regenerated periodically

3. **Use RBAC in production:**
   - Disable admin user on container registry
   - Use managed identities where possible
   - Follow least-privilege principle

4. **Monitor costs:**
   - Review Azure Cost Management dashboard weekly
   - Set up budget alerts
   - Delete unused resources promptly

## Cost Estimation

See [azure-costs.md](./azure-costs.md) for detailed cost analysis.

**MVP Monthly Estimate:**
- Storage Account: $1-2
- Container Registry (Basic): $5
- Container Instances: $10-30 (depends on usage)
- **Total: ~$20-40/month**

## Support

- **Documentation:** See other guides in `docs/`
- **Issues:** Report problems in GitHub Issues
- **Azure Support:** https://azure.microsoft.com/support/

---

**Last Updated:** 2024
**Version:** 1.0.0
**Status:** Production Ready
