# Azure Infrastructure Scripts

Automated scripts for managing Dev8.dev Azure infrastructure.

## Scripts Overview

| Script | Purpose | Usage |
|--------|---------|-------|
| `setup-infrastructure.sh` | Initial infrastructure setup | First-time setup |
| `configure-credentials.sh` | Configure service principal | After setup |
| `validate-setup.sh` | Verify configuration | After setup/changes |
| `cleanup-resources.sh` | Delete all resources | Testing/cleanup |

## Quick Start

### First-Time Setup

```bash
# 1. Login to Azure
az login

# 2. Run setup
./setup-infrastructure.sh

# 3. Configure credentials
./configure-credentials.sh

# 4. Validate
./validate-setup.sh
```

## Scripts Documentation

### setup-infrastructure.sh

**Purpose:** Creates all required Azure resources for Dev8.dev MVP

**What it does:**
1. Creates resource group `dev8-mvp-rg`
2. Creates storage account with random suffix
3. Creates container registry with random suffix
4. Creates service principal with Contributor role
5. Sets up cost management budget ($50/month)
6. Generates environment configuration files

**Usage:**
```bash
./setup-infrastructure.sh [resource-group] [location] [environment]

# Examples:
./setup-infrastructure.sh                                    # Use defaults
./setup-infrastructure.sh dev8-mvp-rg eastus dev            # Specify all
./setup-infrastructure.sh my-rg westus2                     # Custom RG and location
```

**Parameters:**
- `resource-group` - Azure resource group name (default: dev8-mvp-rg)
- `location` - Azure region (default: eastus)
- `environment` - Environment tag (default: dev)

**Output:**
- `../../azure-credentials.json` - Service principal credentials
- `../../.env.azure` - Root level environment variables
- `../../apps/agent/.env` - Go backend environment variables

**Exit Codes:**
- `0` - Success
- `1` - Error (Azure CLI not installed, not logged in, etc.)

**Example:**
```bash
$ ./setup-infrastructure.sh
==========================================
  Dev8.dev Azure Infrastructure Setup
==========================================

[INFO] Azure CLI is installed
[SUCCESS] Logged in to Azure subscription: My Subscription (xxx-xxx)

Configuration:
  Resource Group: dev8-mvp-rg
  Location: eastus
  Environment: dev
  Random Suffix: a1b2c3d4

[INFO] Creating resource group 'dev8-mvp-rg' in 'eastus'...
[SUCCESS] Resource group 'dev8-mvp-rg' created successfully
...
```

### configure-credentials.sh

**Purpose:** Configures service principal credentials in environment files

**What it does:**
1. Reads credentials from `azure-credentials.json`
2. Updates `.env.azure` with service principal info
3. Updates `apps/agent/.env` with service principal info
4. Tests service principal authentication

**Usage:**
```bash
./configure-credentials.sh
```

**Prerequisites:**
- `azure-credentials.json` must exist
- Either `jq` or `python3` must be installed

**Example:**
```bash
$ ./configure-credentials.sh
==========================================
  Azure Credentials Configuration
==========================================

[SUCCESS] Found azure-credentials.json
[INFO] Extracting credentials from azure-credentials.json...
[SUCCESS] Credentials extracted successfully
[INFO] Updating .env files with service principal credentials...
[SUCCESS] Updated .env.azure
[SUCCESS] Updated apps/agent/.env
[INFO] Testing service principal credentials...
[SUCCESS] Service principal authentication successful!
[INFO] Testing access to Azure resources...
[SUCCESS] Successfully accessed resource group: dev8-mvp-rg
...
```

### validate-setup.sh

**Purpose:** Validates that all Azure resources are properly configured

**What it does:**
1. Checks Azure CLI installation
2. Verifies Azure authentication
3. Checks environment files exist
4. Tests resource group access
5. Tests storage account access
6. Tests container registry access
7. Tests service principal credentials
8. Verifies environment variables
9. Tests storage operations
10. Tests registry operations

**Usage:**
```bash
./validate-setup.sh
```

**Output:**
- ✅ **PASS** - Test passed
- ❌ **FAIL** - Test failed (critical)
- ⚠️ **WARN** - Test failed (non-critical)

**Example:**
```bash
$ ./validate-setup.sh
==========================================
  Dev8.dev Azure Setup Validation
==========================================

[INFO] Testing: Azure CLI installation
[PASS] Azure CLI is installed (version: 2.50.0)

[INFO] Testing: Azure CLI authentication
[PASS] Authenticated to Azure (subscription: My Subscription)

[INFO] Testing: Environment configuration files
[PASS] .env.azure exists
[PASS] apps/agent/.env exists
[WARN] .env.azure.example not found (recommended)

...

==========================================
  Validation Summary
==========================================

Passed:   15
Failed:   0
Warnings: 2

[SUCCESS] All critical tests passed!

Your Azure infrastructure is properly configured.
You can proceed with the next steps of the MVP.
```

**Exit Codes:**
- `0` - All critical tests passed
- `1` - One or more critical tests failed

### cleanup-resources.sh

**Purpose:** Deletes all Azure resources (for testing/cleanup)

**⚠️ WARNING:** This is destructive! Use with caution.

**What it does:**
1. Confirms deletion with user
2. Deletes service principal
3. Deletes resource group (includes all resources)
4. Cleans up local configuration files

**Usage:**
```bash
./cleanup-resources.sh [resource-group] [--yes] [--wait]

# Examples:
./cleanup-resources.sh                           # Interactive (asks for confirmation)
./cleanup-resources.sh dev8-mvp-rg --yes        # Skip confirmation
./cleanup-resources.sh dev8-mvp-rg --yes --wait # Wait for completion
```

**Parameters:**
- `resource-group` - Resource group to delete (default: dev8-mvp-rg)
- `--yes` - Skip confirmation prompt
- `--wait` - Wait for deletion to complete (can take 5+ minutes)

**What gets deleted:**
- Resource group and ALL resources inside:
  - Storage account
  - Container registry
  - Container instances
  - Budgets
- Service principal
- Local files:
  - `azure-credentials.json`
  - `.env.azure`
  - `apps/agent/.env`

**Example:**
```bash
$ ./cleanup-resources.sh

==========================================
  Dev8.dev Azure Resource Cleanup
==========================================

[WARN] WARNING: This will DELETE the following:
  - Resource Group: dev8-mvp-rg
  - All resources within the resource group:
    * Storage Account
    * Container Registry
    * Any Container Instances
    * Cost Management Budgets
  - Service Principal (if exists)

[WARN] This action CANNOT be undone!

Are you sure you want to continue? (type 'yes' to confirm): yes

[INFO] Starting cleanup process...

[INFO] Checking for service principal 'dev8-mvp-sp'...
[INFO] Deleting service principal 'dev8-mvp-sp' (App ID: xxx)...
[SUCCESS] Service principal deleted

[INFO] Checking if resource group 'dev8-mvp-rg' exists...
[INFO] Deleting resource group 'dev8-mvp-rg' (this may take several minutes)...
[SUCCESS] Resource group deletion initiated
[INFO] Deletion is running in the background. Check Azure Portal for status.

[INFO] Cleaning up local configuration files...
[INFO] Removing ../../azure-credentials.json...
[INFO] Removing ../../.env.azure...
[INFO] Removing ../../apps/agent/.env...
[SUCCESS] Local configuration files cleaned up

==========================================
[SUCCESS] Cleanup completed!
==========================================
```

## Common Workflows

### Initial Setup

```bash
# Complete setup process
cd scripts/azure

# 1. Create infrastructure
./setup-infrastructure.sh

# 2. Configure credentials
./configure-credentials.sh

# 3. Validate everything works
./validate-setup.sh
```

### Verify Existing Setup

```bash
# Check if everything is configured correctly
./validate-setup.sh
```

### Clean Up and Start Fresh

```bash
# Delete everything and start over
./cleanup-resources.sh dev8-mvp-rg --yes

# Wait a few minutes, then setup again
./setup-infrastructure.sh
./configure-credentials.sh
./validate-setup.sh
```

### Credential Rotation

```bash
# Delete service principal to force recreation
az ad sp delete --id $AZURE_CLIENT_ID

# Run setup to create new credentials
./setup-infrastructure.sh

# Configure new credentials
./configure-credentials.sh
```

## Prerequisites

All scripts require:
- Bash shell (Linux/macOS/WSL)
- Azure CLI 2.50.0+
- Active Azure subscription
- Logged in to Azure (`az login`)

Some scripts also require:
- `jq` or `python3` (for JSON parsing)
- `openssl` (for random suffix generation)

## Environment Variables

Scripts generate these environment files:

### .env.azure (Root Level)
```bash
AZURE_SUBSCRIPTION_ID=xxx
AZURE_TENANT_ID=xxx
AZURE_CLIENT_ID=xxx
AZURE_CLIENT_SECRET=xxx
AZURE_RESOURCE_GROUP=dev8-mvp-rg
AZURE_STORAGE_ACCOUNT=dev8mvpstoragexxxxx
AZURE_CONTAINER_REGISTRY=dev8mvpregistryxxxxx
AZURE_REGION=eastus
AZURE_STORAGE_CONNECTION_STRING="xxx"
AZURE_STORAGE_KEY=xxx
AZURE_REGISTRY_LOGIN_SERVER=xxx.azurecr.io
AZURE_REGISTRY_USERNAME=xxx
AZURE_REGISTRY_PASSWORD=xxx
```

### apps/agent/.env (Go Backend)
Same as `.env.azure` plus application-specific variables.

## Troubleshooting

### Script Permission Denied

```bash
chmod +x scripts/azure/*.sh
```

### Azure CLI Not Found

Install Azure CLI:
- macOS: `brew install azure-cli`
- Ubuntu: `curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash`

### Not Logged In

```bash
az login
az account show
```

### Resource Already Exists

This usually means a previous run created resources. Options:
1. Use existing resources (scripts are idempotent)
2. Clean up and recreate: `./cleanup-resources.sh`
3. Use different resource group name

### Validation Failures

See detailed logs in script output. Common issues:
- Missing environment variables
- Incorrect permissions
- Resources not created
- Network issues

For more help, see:
- [docs/azure-troubleshooting.md](../../docs/azure-troubleshooting.md)
- [docs/azure-setup.md](../../docs/azure-setup.md)

## Security Notes

**Sensitive Files (DO NOT COMMIT):**
- `azure-credentials.json`
- `.env.azure`
- `apps/agent/.env`

**File Permissions:**
```bash
# All credential files should be 600 (owner read/write only)
chmod 600 azure-credentials.json
chmod 600 .env.azure
chmod 600 apps/agent/.env
```

**Best Practices:**
- Never commit credentials to git
- Rotate credentials every 90 days
- Use service principals, not personal accounts
- Monitor credential usage
- Delete unused credentials

## Support

For issues:
1. Check script output for error messages
2. Run `./validate-setup.sh` for diagnostics
3. Review [docs/azure-troubleshooting.md](../../docs/azure-troubleshooting.md)
4. Open GitHub issue with error details

---

**Last Updated:** 2024
**Shell:** Bash 4.0+
**Azure CLI:** 2.50+
