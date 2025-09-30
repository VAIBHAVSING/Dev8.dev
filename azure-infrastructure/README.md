# Azure Infrastructure as Code (Bicep)

Infrastructure as Code templates for deploying Dev8.dev Azure resources.

## Overview

This directory contains Bicep templates for reproducible deployment of Azure infrastructure:

- **main.bicep** - Main orchestration template
- **modules/** - Reusable resource modules
- **parameters/** - Environment-specific parameters

## Structure

```
azure-infrastructure/
├── main.bicep                    # Main deployment template
├── modules/
│   ├── storage.bicep            # Storage account + Azure Files
│   ├── registry.bicep           # Container registry
│   ├── aci.bicep                # Container instance template
│   └── monitoring.bicep         # Cost management & alerts
└── parameters/
    ├── dev.bicepparam           # Development environment
    └── prod.bicepparam          # Production environment
```

## Quick Start

### Prerequisites

- Azure CLI 2.50.0 or later
- Bicep CLI (installed with Azure CLI)
- Active Azure subscription

### Deploy to Development

```bash
# Create resource group
az group create --name dev8-mvp-rg --location eastus

# Deploy infrastructure
az deployment group create \
  --resource-group dev8-mvp-rg \
  --template-file main.bicep \
  --parameters parameters/dev.bicepparam
```

### Deploy to Production

```bash
# Create resource group
az group create --name dev8-prod-rg --location eastus

# Deploy infrastructure
az deployment group create \
  --resource-group dev8-prod-rg \
  --template-file main.bicep \
  --parameters parameters/prod.bicepparam
```

## Modules

### Storage Module

**File:** `modules/storage.bicep`

Creates:
- Storage Account (StorageV2)
- File Service with retention policy
- Blob Service with soft delete

**Parameters:**
- `storageAccountName` - Globally unique name
- `location` - Azure region
- `sku` - Storage redundancy (Standard_LRS, Standard_GRS)

### Registry Module

**File:** `modules/registry.bicep`

Creates:
- Azure Container Registry
- Admin credentials (optional)
- Retention policies

**Parameters:**
- `registryName` - Globally unique name
- `location` - Azure region
- `sku` - Registry tier (Basic, Standard, Premium)
- `adminUserEnabled` - Enable admin user

### ACI Module

**File:** `modules/aci.bicep`

Template for deploying container instances (used by Go backend).

**Parameters:**
- `containerGroupName` - Container group name
- `containerImage` - Docker image from ACR
- `cpuCores` - CPU allocation
- `memoryInGb` - Memory allocation
- `fileShareName` - Azure Files share for persistence

### Monitoring Module

**File:** `modules/monitoring.bicep`

Creates:
- Cost management budget
- Alert rules (50%, 75%, 90%, 100%)
- Email notifications

**Parameters:**
- `budgetName` - Budget identifier
- `budgetAmount` - Monthly limit in USD
- `contactEmails` - Alert recipients

## Parameters

### Development (dev.bicepparam)

```bicep
environment = 'dev'
location = 'eastus'
storageSku = 'Standard_LRS'
registrySku = 'Basic'
budgetAmount = 50
```

### Production (prod.bicepparam)

```bicep
environment = 'prod'
location = 'eastus'
storageSku = 'Standard_GRS'        // Geo-redundant
registrySku = 'Standard'           // Higher tier
budgetAmount = 500                 // Higher budget
```

## Customization

### Creating New Environments

```bash
# Copy parameter file
cp parameters/dev.bicepparam parameters/staging.bicepparam

# Edit parameters
# Update environment = 'staging'

# Deploy
az deployment group create \
  --resource-group dev8-staging-rg \
  --template-file main.bicep \
  --parameters parameters/staging.bicepparam
```

### Overriding Parameters

```bash
# Override on command line
az deployment group create \
  --resource-group dev8-mvp-rg \
  --template-file main.bicep \
  --parameters parameters/dev.bicepparam \
  --parameters budgetAmount=100
```

## Validation

### Validate Templates

```bash
# Validate syntax
az bicep build --file main.bicep

# Validate deployment (what-if)
az deployment group what-if \
  --resource-group dev8-mvp-rg \
  --template-file main.bicep \
  --parameters parameters/dev.bicepparam
```

### Viewing Outputs

```bash
# Show deployment outputs
az deployment group show \
  --resource-group dev8-mvp-rg \
  --name main \
  --query properties.outputs
```

## Updating Infrastructure

### Apply Changes

```bash
# Bicep is idempotent - re-run to update
az deployment group create \
  --resource-group dev8-mvp-rg \
  --template-file main.bicep \
  --parameters parameters/dev.bicepparam
```

### Incremental vs Complete Mode

```bash
# Incremental (default) - only updates changed resources
--mode Incremental

# Complete - deletes resources not in template
--mode Complete  # ⚠️ Use with caution!
```

## Exporting Existing Resources

```bash
# Export resource group as Bicep
az bicep decompile --file exported.json

# Export resource group as ARM
az group export --name dev8-mvp-rg > exported.json
```

## Best Practices

1. **Version Control**
   - Commit all Bicep files to git
   - Use branches for infrastructure changes
   - Review changes in pull requests

2. **Parameter Files**
   - One parameter file per environment
   - Keep sensitive values in Key Vault
   - Document all parameters

3. **Naming Conventions**
   - Use consistent naming patterns
   - Include environment in names
   - Ensure global uniqueness

4. **Testing**
   - Validate before deploying
   - Use what-if to preview changes
   - Test in dev before prod

5. **Documentation**
   - Comment complex logic
   - Document dependencies
   - Keep README updated

## Troubleshooting

### Template Validation Failed

```bash
# Check syntax errors
az bicep build --file main.bicep

# View detailed errors
az deployment group create ... --debug
```

### Resource Already Exists

```bash
# Use existing resources with 'existing' keyword
resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' existing = {
  name: existingStorageName
}
```

### Deployment Failed

```bash
# View deployment logs
az deployment group show \
  --resource-group dev8-mvp-rg \
  --name main \
  --query properties.error

# View activity log
az monitor activity-log list \
  --resource-group dev8-mvp-rg \
  --status Failed
```

## Resources

- [Bicep Documentation](https://docs.microsoft.com/azure/azure-resource-manager/bicep/)
- [Bicep Examples](https://github.com/Azure/bicep/tree/main/docs/examples)
- [Azure Resource Reference](https://docs.microsoft.com/azure/templates/)
- [Bicep Playground](https://aka.ms/bicepdemo)

## Support

For issues with templates:
1. Check [azure-troubleshooting.md](../docs/azure-troubleshooting.md)
2. Open GitHub issue
3. Contact team in Slack

---

**Last Updated:** 2024
**Bicep Version:** 0.x
**Azure CLI Version:** 2.50+
