# 🔧 Azure Container Registry Setup Guide

This guide will help you set up Azure Container Registry (ACR) for the Docker CD pipeline.

---

## Prerequisites

- Azure CLI installed: `az --version`
- Azure subscription active
- GitHub repository access with admin rights

---

## 1️⃣ Login to Azure

```bash
# Login to Azure account
az login

# List subscriptions
az account list --output table

# Set active subscription (if you have multiple)
az account set --subscription "Your-Subscription-Name"

# Verify
az account show
```

---

## 2️⃣ Create Resource Group

```bash
# Create resource group for Dev8.dev
az group create \
  --name dev8-rg \
  --location eastus

# Verify
az group show --name dev8-rg
```

**Available Locations:**
```bash
# List all available locations
az account list-locations --output table

# Common options:
# - eastus
# - westus2
# - centralus
# - westeurope
# - eastasia
```

---

## 3️⃣ Create Azure Container Registry

```bash
# Create ACR with Basic SKU (cost-effective for MVP)
az acr create \
  --resource-group dev8-rg \
  --name dev8registry \
  --sku Basic \
  --admin-enabled true

# For production, use Standard or Premium:
# --sku Standard  # Recommended for production
# --sku Premium   # For geo-replication, content trust
```

**SKU Comparison:**

| Feature | Basic | Standard | Premium |
|---------|-------|----------|---------|
| Storage | 10 GB | 100 GB | 500 GB |
| Throughput | Good | Better | Best |
| Geo-replication | ❌ | ❌ | ✅ |
| Content trust | ❌ | ❌ | ✅ |
| Price | $ | $$ | $$$ |

---

## 4️⃣ Get ACR Credentials

```bash
# Get login server
az acr show \
  --name dev8registry \
  --query loginServer \
  --output tsv

# Output: dev8registry.azurecr.io

# Get admin credentials
az acr credential show \
  --name dev8registry \
  --output table

# Output:
# USERNAME          PASSWORD                                 PASSWORD2
# --------------    ------------------------------------    ------------------------------------
# dev8registry      Abc123...                               Xyz789...
```

**Save these credentials securely!** You'll need them for GitHub Secrets.

---

## 5️⃣ Configure GitHub Secrets

### Add Secrets to Repository

1. Go to GitHub repository: https://github.com/VAIBHAVSING/Dev8.dev
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**

### Add these secrets:

**Secret 1: ACR_USERNAME**
```
Name: ACR_USERNAME
Value: dev8registry
```

**Secret 2: ACR_PASSWORD**
```
Name: ACR_PASSWORD
Value: <paste PASSWORD from step 4>
```

### Verify Secrets

You should see:
- ✅ `ACR_USERNAME`
- ✅ `ACR_PASSWORD`

---

## 6️⃣ Test ACR Connection

```bash
# Login to ACR from local machine
az acr login --name dev8registry

# Should see: "Login Succeeded"

# Alternatively, use Docker login
docker login dev8registry.azurecr.io \
  --username dev8registry \
  --password <your-password>
```

---

## 7️⃣ Test Push & Pull

```bash
# Tag a test image
docker pull hello-world
docker tag hello-world dev8registry.azurecr.io/hello-world:test

# Push to ACR
docker push dev8registry.azurecr.io/hello-world:test

# List images in ACR
az acr repository list --name dev8registry --output table

# Show tags
az acr repository show-tags \
  --name dev8registry \
  --repository hello-world \
  --output table

# Pull from ACR
docker pull dev8registry.azurecr.io/hello-world:test

# Clean up test image
az acr repository delete \
  --name dev8registry \
  --repository hello-world \
  --yes
```

---

## 8️⃣ Configure Webhook (Optional)

Set up webhook to trigger deployments when images are pushed:

```bash
# Create webhook
az acr webhook create \
  --registry dev8registry \
  --name dev8webhook \
  --actions push \
  --uri https://your-deployment-service.com/webhook \
  --scope dev8-workspace:*

# List webhooks
az acr webhook list \
  --registry dev8registry \
  --output table

# Test webhook
az acr webhook ping \
  --registry dev8registry \
  --name dev8webhook
```

---

## 9️⃣ Enable Diagnostic Logging (Optional)

For monitoring and troubleshooting:

```bash
# Create Log Analytics workspace
az monitor log-analytics workspace create \
  --resource-group dev8-rg \
  --workspace-name dev8-logs

# Get workspace ID
WORKSPACE_ID=$(az monitor log-analytics workspace show \
  --resource-group dev8-rg \
  --workspace-name dev8-logs \
  --query id \
  --output tsv)

# Enable diagnostic settings
az monitor diagnostic-settings create \
  --name dev8-acr-diagnostics \
  --resource $(az acr show --name dev8registry --query id --output tsv) \
  --workspace $WORKSPACE_ID \
  --logs '[{"category": "ContainerRegistryRepositoryEvents", "enabled": true}]' \
  --metrics '[{"category": "AllMetrics", "enabled": true}]'
```

---

## 🔟 Cost Management

### View Current Costs

```bash
# View ACR costs
az consumption usage list \
  --start-date 2024-10-01 \
  --end-date 2024-10-31 \
  | jq '.[] | select(.instanceName | contains("dev8registry"))'
```

### Set Budget Alert

```bash
# Create budget (e.g., $50/month)
az consumption budget create \
  --budget-name dev8-acr-budget \
  --amount 50 \
  --time-grain Monthly \
  --start-date 2024-10-01 \
  --end-date 2025-10-01 \
  --resource-group dev8-rg
```

### Cost Optimization Tips

1. **Use Basic SKU for development**
   ```bash
   # Already done: --sku Basic
   ```

2. **Clean up old images regularly**
   ```bash
   # Delete images older than 30 days
   az acr repository show-tags \
     --name dev8registry \
     --repository dev8-workspace \
     --orderby time_desc \
     --output tsv | tail -n +30 | while read -r tag; do
       az acr repository delete \
         --name dev8registry \
         --image dev8-workspace:$tag \
         --yes
   done
   ```

3. **Use retention policies (Premium only)**
   ```bash
   # Requires Premium SKU
   az acr config retention update \
     --registry dev8registry \
     --status enabled \
     --days 30 \
     --type UntaggedManifests
   ```

---

## 🔒 Security Best Practices

### 1. Disable Admin User (Production)

For production, use Azure AD authentication instead of admin credentials:

```bash
# Disable admin user
az acr update \
  --name dev8registry \
  --admin-enabled false

# Use service principal instead
az ad sp create-for-rbac \
  --name dev8-acr-sp \
  --role acrpush \
  --scopes $(az acr show --name dev8registry --query id --output tsv)
```

### 2. Enable Content Trust (Premium)

```bash
# Requires Premium SKU
az acr update \
  --name dev8registry \
  --sku Premium

# Enable content trust
az acr config content-trust update \
  --registry dev8registry \
  --status enabled
```

### 3. Restrict Network Access

```bash
# Add firewall rule to allow only your IP
az acr network-rule add \
  --name dev8registry \
  --ip-address <your-ip-address>

# Deny all other traffic
az acr update \
  --name dev8registry \
  --default-action Deny
```

### 4. Enable Azure Defender

```bash
# Enable Azure Defender for container registries
az security pricing create \
  --name ContainerRegistry \
  --tier Standard
```

---

## 🧪 Verify Pipeline Integration

### 1. Trigger CI Pipeline

```bash
# Create test PR
git checkout -b test/ci-pipeline
echo "# Test" >> docker/README.md
git commit -am "test: Trigger CI pipeline"
git push origin test/ci-pipeline

# Create PR on GitHub to main branch
# CI pipeline should run automatically
```

### 2. Trigger CD Pipeline

```bash
# After PR is merged to main, deploy to production
git checkout production
git pull origin production
git merge main
git push origin production

# CD pipeline should run and push to ACR
```

### 3. Verify Images in ACR

```bash
# List all repositories
az acr repository list \
  --name dev8registry \
  --output table

# Expected output:
# - dev8-base
# - dev8-languages
# - dev8-vscode
# - dev8-workspace

# Show tags for workspace
az acr repository show-tags \
  --name dev8registry \
  --repository dev8-workspace \
  --output table

# Expected tags:
# - latest
# - production
# - v20241024-a1b2c3d
```

---

## 🐛 Troubleshooting

### Error: Registry not found

```bash
Error: The Resource 'Microsoft.ContainerRegistry/registries/dev8registry' 
under resource group 'dev8-rg' was not found.
```

**Solution:**
```bash
# Check if registry exists
az acr list --output table

# Recreate if needed
az acr create --resource-group dev8-rg --name dev8registry --sku Basic
```

### Error: Unauthorized

```bash
Error: unauthorized: authentication required
```

**Solution:**
```bash
# Verify admin is enabled
az acr update --name dev8registry --admin-enabled true

# Get new credentials
az acr credential show --name dev8registry

# Update GitHub secrets with new password
```

### Error: Name already exists

```bash
Error: The registry dev8registry is already in use.
```

**Solution:**
```bash
# Registry names are globally unique
# Use a different name, e.g.:
az acr create --name dev8registry2024 --resource-group dev8-rg --sku Basic
```

### Error: Insufficient quota

```bash
Error: Operation could not be completed as it results in exceeding quota.
```

**Solution:**
```bash
# Check current quota
az vm list-usage --location eastus --output table

# Request quota increase
# Azure Portal → Subscriptions → Usage + quotas → Request increase
```

---

## 📚 Next Steps

1. ✅ ACR is now configured
2. ✅ GitHub Secrets are set
3. ✅ Pipelines are ready to run

### Deploy your first image:

```bash
# Merge a PR to main
# Then merge main to production
git checkout production
git merge main
git push origin production

# Monitor pipeline
# GitHub → Actions → Docker CD - Production Deploy

# Verify deployment
az acr repository show-tags --name dev8registry --repository dev8-workspace
```

---

## 📖 Additional Resources

- [Azure Container Registry Docs](https://docs.microsoft.com/en-us/azure/container-registry/)
- [ACR Best Practices](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-best-practices)
- [ACR Authentication](https://docs.microsoft.com/en-us/azure/container-registry/container-registry-authentication)
- [ACR Pricing](https://azure.microsoft.com/en-us/pricing/details/container-registry/)

---

## 💰 Cost Estimate (Basic SKU)

| Component | Monthly Cost |
|-----------|-------------|
| ACR Basic SKU | ~$5 |
| Storage (per GB over 10 GB) | ~$0.10/GB |
| Build & Task minutes | $0.0001/second |
| **Estimated Total** | **$5-15/month** |

For production, consider Standard SKU (~$20/month) for better performance.

---

**Setup completed!** 🎉

Your Azure Container Registry is now ready for the Docker CD pipeline.
