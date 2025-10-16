# Dev8.dev Production Deployment Guide

**Complete roadmap to deploy Dev8.dev to Azure Container Instances for production**

Last Updated: October 16, 2025  
Estimated Time: 2-3 hours  
Cost: ~$50-100/month for MVP

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Phase 1: Azure Infrastructure Setup](#phase-1-azure-infrastructure-setup)
4. [Phase 2: Docker Images Build & Push](#phase-2-docker-images-build--push)
5. [Phase 3: Database Setup](#phase-3-database-setup)
6. [Phase 4: Go Agent Deployment](#phase-4-go-agent-deployment)
7. [Phase 5: Next.js Frontend Deployment](#phase-5-nextjs-frontend-deployment)
8. [Phase 6: Testing & Validation](#phase-6-testing--validation)
9. [Troubleshooting](#troubleshooting)
10. [Cost Monitoring](#cost-monitoring)

---

## Prerequisites

### Required Tools

```bash
# 1. Azure CLI (latest version)
az --version  # Should be 2.50.0+

# 2. Docker
docker --version  # Should be 20.10+

# 3. Node.js & pnpm
node --version  # Should be 18.x or 20.x
pnpm --version  # Should be 9.x

# 4. Go (for local agent build)
go version  # Should be 1.22+
```

### Azure Account Requirements

- Active Azure subscription
- Contributor access to create resources
- Credit card on file (free tier or pay-as-you-go)
- Estimated cost: $50-100/month

### Repository Setup

```bash
# Clone and navigate
cd /home/vsing/code/Dev8.dev

# Verify you're on correct branch
git branch  # Should show docker-setup or main

# Verify infrastructure folder exists
ls -la in/azure/
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      AZURE CLOUD                             │
│                                                              │
│  ┌────────────────┐         ┌──────────────────┐           │
│  │  Next.js App   │────────▶│  PostgreSQL DB   │           │
│  │  (Azure Web)   │         │  (Azure DB)      │           │
│  └────────┬───────┘         └──────────────────┘           │
│           │                                                  │
│           │ HTTP                                            │
│           ▼                                                  │
│  ┌────────────────┐                                         │
│  │  Go Agent API  │                                         │
│  │  (Container)   │                                         │
│  └────────┬───────┘                                         │
│           │ Azure SDK                                       │
│           ▼                                                  │
│  ┌─────────────────────────────────────────────┐           │
│  │         Azure Container Instances            │           │
│  │  ┌────────┐  ┌────────┐  ┌────────┐        │           │
│  │  │ User 1 │  │ User 2 │  │ User 3 │  ...   │           │
│  │  │ VSCode │  │ VSCode │  │ VSCode │        │           │
│  │  └───┬────┘  └────────┘  └────────┘        │           │
│  └──────┼───────────────────────────────────────┘           │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────────┐                                         │
│  │  Azure Files   │  (Persistent workspace storage)        │
│  └────────────────┘                                         │
│                                                              │
│  ┌────────────────────────┐                                 │
│  │  Container Registry    │  (Docker images)                │
│  └────────────────────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User** → Next.js Web App (creates environment)
2. **Next.js** → PostgreSQL (stores environment metadata)
3. **Next.js** → Go Agent API (requests ACI creation)
4. **Go Agent** → Azure SDK (creates container + file share)
5. **User** → ACI VSCode Server (directly via public IP/FQDN)

### Key Decision: Stateless Go Agent

- **Go Agent**: No database, pure Azure SDK orchestration
- **Next.js**: Handles ALL persistence (PostgreSQL)
- **Communication**: REST API between Next.js ↔ Go Agent

---

## Phase 1: Azure Infrastructure Setup

### 1.1 Login to Azure

```bash
az login

# Verify subscription
az account show

# Set default subscription if needed
az account set --subscription "YOUR_SUBSCRIPTION_ID"
```

### 1.2 Run Infrastructure Setup Script

```bash
cd in/azure/scripts

# Make scripts executable
chmod +x *.sh

# Run main setup (creates everything)
./setup-infrastructure.sh
```

**What this creates:**
- ✅ Resource Group: `dev8-mvp-rg`
- ✅ Storage Account: `dev8mvpstorageXXXX` (random suffix)
- ✅ Container Registry: `dev8mvpregistryXXXX`
- ✅ Service Principal: `dev8-mvp-sp`
- ✅ Cost Budget: $50/month with alerts
- ✅ Credentials file: `azure-credentials.json`

### 1.3 Configure Environment Variables

```bash
# Script generates .env.azure automatically
cat ../../.env.azure

# Copy to agent directory
cp ../../.env.azure ../../apps/agent/.env

# Add to Next.js app
cp ../../.env.azure ../../apps/web/.env.local
```

### 1.4 Verify Setup

```bash
./validate-setup.sh
```

**Expected output:**
```
✓ Resource group exists
✓ Storage account accessible
✓ Container registry accessible
✓ Service principal valid
✓ All systems operational
```

---

## Phase 2: Docker Images Build & Push

### 2.1 Fix Docker Build Context Issue

**Current Issue:** `docker/build.sh` uses wrong context

```bash
cd /home/vsing/code/Dev8.dev/docker
```

**Edit `build.sh` line 60:**
```bash
# BEFORE (BROKEN):
docker build -f base/Dockerfile ./base/

# AFTER (FIXED):
docker build -f base/Dockerfile .
```

**Do the same for line 77 (MVP image):**
```bash
# BEFORE (BROKEN):
docker build -f mvp/Dockerfile ./mvp/

# AFTER (FIXED):
docker build -f mvp/Dockerfile .
```

### 2.2 Build Docker Images Locally

```bash
cd /home/vsing/code/Dev8.dev/docker

# Set registry from Azure setup
export REGISTRY=$(az acr show --name dev8mvpregistryXXXX --query loginServer -o tsv)
export VERSION=1.0.0

# Build both images
BUILD_BASE=true BUILD_MVP=true ./build.sh
```

**Expected result:**
```
✓ Base image: dev8-base:1.0.0 (757MB)
✓ MVP image: dev8-mvp:1.0.0 (~3.5GB)
```

### 2.3 Login to Azure Container Registry

```bash
# Get registry name from setup
REGISTRY_NAME=$(grep AZURE_CONTAINER_REGISTRY ../../apps/agent/.env | cut -d= -f2)

# Login
az acr login --name $REGISTRY_NAME
```

### 2.4 Tag and Push Images

```bash
# Get full registry URL
REGISTRY_URL=$(az acr show --name $REGISTRY_NAME --query loginServer -o tsv)

# Tag images
docker tag dev8-base:1.0.0 ${REGISTRY_URL}/dev8-base:latest
docker tag dev8-mvp:1.0.0 ${REGISTRY_URL}/dev8-mvp:latest

# Push to ACR
docker push ${REGISTRY_URL}/dev8-base:latest
docker push ${REGISTRY_URL}/dev8-mvp:latest
```

### 2.5 Verify Images in Registry

```bash
az acr repository list --name $REGISTRY_NAME --output table
az acr repository show-tags --name $REGISTRY_NAME --repository dev8-mvp
```

---

## Phase 3: Database Setup

### 3.1 Create Azure Database for PostgreSQL

```bash
# Create database server
az postgres flexible-server create \
  --resource-group dev8-mvp-rg \
  --name dev8-postgres-server \
  --location eastus \
  --admin-user dev8admin \
  --admin-password "YOUR_SECURE_PASSWORD_HERE" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --storage-size 32 \
  --version 14 \
  --public-access 0.0.0.0-255.255.255.255

# Create database
az postgres flexible-server db create \
  --resource-group dev8-mvp-rg \
  --server-name dev8-postgres-server \
  --database-name dev8db
```

**Cost:** ~$12/month for Burstable B1ms

### 3.2 Get Connection String

```bash
# Get connection details
POSTGRES_HOST=$(az postgres flexible-server show \
  --resource-group dev8-mvp-rg \
  --name dev8-postgres-server \
  --query "fullyQualifiedDomainName" -o tsv)

# Build connection string
DATABASE_URL="postgresql://dev8admin:YOUR_SECURE_PASSWORD_HERE@${POSTGRES_HOST}:5432/dev8db?sslmode=require"

echo $DATABASE_URL
```

### 3.3 Run Prisma Migrations

```bash
cd /home/vsing/code/Dev8.dev/apps/web

# Set DATABASE_URL
export DATABASE_URL="postgresql://dev8admin:PASSWORD@HOST:5432/dev8db?sslmode=require"

# Run migrations
pnpm prisma migrate deploy

# Generate Prisma client
pnpm prisma generate
```

---

## Phase 4: Go Agent Deployment

### 4.1 Build Go Agent Binary

```bash
cd /home/vsing/code/Dev8.dev/apps/agent

# Build for Linux (since we're deploying to container)
GOOS=linux GOARCH=amd64 go build -o agent-linux main.go
```

### 4.2 Deploy Go Agent to Azure Container Instance

**Option A: Use existing ACI Bicep template**

```bash
cd /home/vsing/code/Dev8.dev/in/azure/bicep

# Create parameters file for agent
cat > parameters/agent.bicepparam << 'EOF'
using './modules/aci.bicep'

param containerGroupName = 'dev8-agent'
param location = 'eastus'
param containerImage = 'YOUR_REGISTRY.azurecr.io/dev8-agent:latest'
param cpuCores = '1'
param memoryInGb = '2'
param registryLoginServer = 'YOUR_REGISTRY.azurecr.io'
param registryUsername = 'YOUR_REGISTRY_NAME'
param registryPassword = 'YOUR_REGISTRY_PASSWORD'
param fileShareName = 'agent-data'
param storageAccountName = 'YOUR_STORAGE_ACCOUNT'
param storageAccountKey = 'YOUR_STORAGE_KEY'
param environmentVariables = [
  {
    name: 'AGENT_PORT'
    value: '8080'
  }
  {
    name: 'AZURE_SUBSCRIPTION_ID'
    value: 'YOUR_SUB_ID'
  }
  {
    name: 'AZURE_RESOURCE_GROUP'
    value: 'dev8-mvp-rg'
  }
  {
    name: 'AZURE_STORAGE_ACCOUNT'
    value: 'YOUR_STORAGE'
  }
  {
    name: 'AZURE_STORAGE_KEY'
    secureValue: 'YOUR_KEY'
  }
  {
    name: 'AZURE_CONTAINER_REGISTRY'
    value: 'YOUR_REGISTRY.azurecr.io'
  }
]
EOF

# Deploy
az deployment group create \
  --resource-group dev8-mvp-rg \
  --template-file modules/aci.bicep \
  --parameters parameters/agent.bicepparam
```

**Option B: Quick Deploy (Manual)**

```bash
# Get values from .env.azure
source /home/vsing/code/Dev8.dev/apps/agent/.env

# Deploy container
az container create \
  --resource-group dev8-mvp-rg \
  --name dev8-agent \
  --image ${AZURE_CONTAINER_REGISTRY}/dev8-agent:latest \
  --cpu 1 \
  --memory 2 \
  --registry-login-server ${AZURE_CONTAINER_REGISTRY} \
  --registry-username $(az acr credential show --name $REGISTRY_NAME --query username -o tsv) \
  --registry-password $(az acr credential show --name $REGISTRY_NAME --query passwords[0].value -o tsv) \
  --dns-name-label dev8-agent \
  --ports 8080 \
  --environment-variables \
    AGENT_PORT=8080 \
    AZURE_SUBSCRIPTION_ID=$AZURE_SUBSCRIPTION_ID \
    AZURE_RESOURCE_GROUP=$AZURE_RESOURCE_GROUP \
    AZURE_STORAGE_ACCOUNT=$AZURE_STORAGE_ACCOUNT \
    AZURE_CONTAINER_REGISTRY=$AZURE_CONTAINER_REGISTRY \
  --secure-environment-variables \
    AZURE_STORAGE_KEY=$AZURE_STORAGE_KEY
```

### 4.3 Get Agent URL

```bash
AGENT_FQDN=$(az container show \
  --resource-group dev8-mvp-rg \
  --name dev8-agent \
  --query "ipAddress.fqdn" -o tsv)

echo "Agent URL: http://${AGENT_FQDN}:8080"

# Test health endpoint
curl http://${AGENT_FQDN}:8080/health
```

**Expected response:**
```json
{"status":"healthy","timestamp":"2025-10-16T..."}
```

---

## Phase 5: Next.js Frontend Deployment

### 5.1 Configure Environment Variables

```bash
cd /home/vsing/code/Dev8.dev/apps/web

# Create production .env
cat > .env.production << EOF
# Database
DATABASE_URL="postgresql://dev8admin:PASSWORD@HOST:5432/dev8db?sslmode=require"

# Auth
NEXTAUTH_URL="https://dev8.azurewebsites.net"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
AUTH_SECRET="$(openssl rand -base64 32)"

# Agent API
AGENT_API_URL="http://dev8-agent.eastus.azurecontainer.io:8080"

# Azure
AZURE_SUBSCRIPTION_ID="your-sub-id"
AZURE_RESOURCE_GROUP="dev8-mvp-rg"
EOF
```

### 5.2 Build Next.js App

```bash
cd /home/vsing/code/Dev8.dev/apps/web

# Install dependencies
pnpm install

# Build production
pnpm build
```

### 5.3 Deploy to Azure Web App

**Option A: Azure Static Web Apps (Recommended for Next.js)**

```bash
# Install SWA CLI
npm install -g @azure/static-web-apps-cli

# Deploy
swa deploy \
  --app-location apps/web \
  --output-location .next \
  --resource-group dev8-mvp-rg \
  --app-name dev8-web
```

**Option B: Azure App Service**

```bash
# Create App Service Plan
az appservice plan create \
  --name dev8-app-plan \
  --resource-group dev8-mvp-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group dev8-mvp-rg \
  --plan dev8-app-plan \
  --name dev8-web \
  --runtime "NODE:20-lts"

# Deploy code
cd /home/vsing/code/Dev8.dev/apps/web
zip -r deploy.zip .next standalone package.json
az webapp deployment source config-zip \
  --resource-group dev8-mvp-rg \
  --name dev8-web \
  --src deploy.zip
```

### 5.4 Configure Web App Settings

```bash
# Set environment variables
az webapp config appsettings set \
  --resource-group dev8-mvp-rg \
  --name dev8-web \
  --settings \
    DATABASE_URL="$DATABASE_URL" \
    NEXTAUTH_URL="https://dev8-web.azurewebsites.net" \
    AGENT_API_URL="http://dev8-agent.eastus.azurecontainer.io:8080"
```

---

## Phase 6: Testing & Validation

### 6.1 Test Agent API Directly (Postman/curl)

```bash
# Health check
curl http://dev8-agent.eastus.azurecontainer.io:8080/health

# Create environment (test Azure integration)
curl -X POST http://dev8-agent.eastus.azurecontainer.io:8080/api/v1/environments \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "name": "Test Environment",
    "cloudProvider": "AZURE",
    "cloudRegion": "eastus",
    "cpuCores": 1,
    "memoryGB": 2,
    "storageGB": 20,
    "baseImage": "dev8mvpregistryXXXX.azurecr.io/dev8-mvp:latest"
  }'
```

### 6.2 Test Next.js Frontend

```bash
# Open in browser
open https://dev8-web.azurewebsites.net

# Register account
# Create environment via UI
# Verify ACI container spins up
```

### 6.3 Verify ACI Container Creation

```bash
# List all container groups
az container list \
  --resource-group dev8-mvp-rg \
  --output table

# Check specific container
az container show \
  --resource-group dev8-mvp-rg \
  --name env-XXXXX \
  --query "{FQDN:ipAddress.fqdn,State:instanceView.state,IP:ipAddress.ip}" \
  --output table
```

### 6.4 Access VS Code Server

```bash
# Get container FQDN
VSCODE_URL=$(az container show \
  --resource-group dev8-mvp-rg \
  --name env-XXXXX \
  --query "ipAddress.fqdn" -o tsv)

echo "VS Code Server: http://${VSCODE_URL}:8080"

# Open in browser
open http://${VSCODE_URL}:8080
```

### 6.5 Test SSH Access (if configured)

```bash
ssh dev8@${VSCODE_URL} -p 2222
```

---

## Troubleshooting

### Agent Won't Start

```bash
# Check logs
az container logs \
  --resource-group dev8-mvp-rg \
  --name dev8-agent

# Common issues:
# - Missing Azure credentials
# - Invalid subscription ID
# - Registry authentication failed
```

### Database Connection Failed

```bash
# Test connection
psql "$DATABASE_URL"

# Check firewall rules
az postgres flexible-server firewall-rule list \
  --resource-group dev8-mvp-rg \
  --name dev8-postgres-server

# Allow your IP
az postgres flexible-server firewall-rule create \
  --resource-group dev8-mvp-rg \
  --name dev8-postgres-server \
  --rule-name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

### Container Won't Create

```bash
# Check agent logs
az container logs --resource-group dev8-mvp-rg --name dev8-agent

# Verify registry credentials
az acr credential show --name $REGISTRY_NAME

# Test image pull manually
docker pull ${REGISTRY_URL}/dev8-mvp:latest
```

### Next.js Build Failed

```bash
# Check build logs
cd /home/vsing/code/Dev8.dev/apps/web

# Clear cache
rm -rf .next node_modules
pnpm install
pnpm build

# Check Prisma
pnpm prisma generate
```

---

## Cost Monitoring

### Set Up Alerts

```bash
# Monthly budget alert (already created by setup script)
az consumption budget show \
  --resource-group dev8-mvp-rg \
  --budget-name dev8-mvp-budget
```

### Monitor Daily Costs

```bash
# View current costs
az consumption usage list \
  --start-date $(date -d "30 days ago" +%Y-%m-%d) \
  --end-date $(date +%Y-%m-%d) \
  --query "[?contains(instanceName,'dev8')]" \
  --output table
```

### Expected Monthly Costs

| Resource | Config | Cost |
|----------|--------|------|
| PostgreSQL | B1ms | $12 |
| Container Registry | Basic | $5 |
| Storage Account | 50GB | $3 |
| Go Agent ACI | 1 CPU, 2GB, 24/7 | $30 |
| Web App | B1 | $13 |
| ACI Environments | 1 CPU, 2GB, 8hrs/day | $15/user |
| **Total (1 active user)** | | **~$78/month** |

---

## Next Steps

1. ✅ **Security Hardening**
   - Enable Azure AD authentication
   - Configure private endpoints
   - Set up Azure Key Vault for secrets

2. ✅ **CI/CD Pipeline**
   - GitHub Actions for automated deployment
   - Automated testing
   - Blue-green deployments

3. ✅ **Monitoring**
   - Application Insights
   - Azure Monitor alerts
   - Custom dashboards

4. ✅ **Scaling**
   - Auto-scaling for agent
   - Multi-region deployment
   - Load balancing

---

## Support

- **Documentation**: See `in/azure/docs/` for detailed guides
- **Azure Status**: https://status.azure.com
- **Cost Calculator**: https://azure.microsoft.com/pricing/calculator/

---

**🎉 Congratulations!** You now have a production-ready Dev8.dev deployment on Azure!
