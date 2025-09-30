# Azure Infrastructure Troubleshooting Guide

Common issues and solutions for Dev8.dev Azure infrastructure.

## Table of Contents

- [Setup Issues](#setup-issues)
- [Authentication Issues](#authentication-issues)
- [Resource Creation Issues](#resource-creation-issues)
- [Container Registry Issues](#container-registry-issues)
- [Storage Account Issues](#storage-account-issues)
- [Container Instance Issues](#container-instance-issues)
- [Cost Management Issues](#cost-management-issues)
- [Debugging Tips](#debugging-tips)

## Setup Issues

### Azure CLI Not Installed

**Symptoms:**
```
bash: az: command not found
```

**Solution:**
Install Azure CLI:
- macOS: `brew install azure-cli`
- Ubuntu: `curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash`
- Windows: Download from https://aka.ms/installazurecliwindows

**Verify installation:**
```bash
az --version
```

### Script Permission Denied

**Symptoms:**
```
bash: ./setup-infrastructure.sh: Permission denied
```

**Solution:**
```bash
chmod +x scripts/azure/*.sh
```

### Missing Dependencies

**Symptoms:**
```
jq: command not found
openssl: command not found
```

**Solution:**
Install missing tools:
```bash
# macOS
brew install jq openssl

# Ubuntu/Debian
sudo apt-get install jq openssl

# Check alternatives
python3 --version  # Can substitute for jq
```

## Authentication Issues

### Not Logged In to Azure

**Symptoms:**
```
ERROR: Please run 'az login' to setup account.
```

**Solution:**
```bash
az login
az account show  # Verify login
```

**For CI/CD:**
```bash
az login --service-principal \
  -u $AZURE_CLIENT_ID \
  -p $AZURE_CLIENT_SECRET \
  --tenant $AZURE_TENANT_ID
```

### Wrong Subscription Selected

**Symptoms:**
- Resources not appearing
- Permission denied errors
- Wrong subscription ID in output

**Solution:**
```bash
# List all subscriptions
az account list --output table

# Set the correct subscription
az account set --subscription "Your Subscription Name"

# Verify
az account show
```

### Service Principal Authentication Failed

**Symptoms:**
```
ERROR: AADSTS7000215: Invalid client secret provided
```

**Solutions:**

1. **Check credentials:**
```bash
# Verify environment variables
echo $AZURE_CLIENT_ID
echo $AZURE_TENANT_ID
# Don't echo CLIENT_SECRET for security
```

2. **Regenerate credentials:**
```bash
# Delete existing service principal
az ad sp delete --id $AZURE_CLIENT_ID

# Re-run setup
./scripts/azure/setup-infrastructure.sh
```

3. **Check expiration:**
```bash
# Service principal credentials expire
# Check in Azure Portal → App Registrations → Certificates & secrets
```

### Insufficient Permissions

**Symptoms:**
```
ERROR: The client does not have authorization to perform action
```

**Solution:**

1. **Check your role:**
```bash
az role assignment list --assignee $(az account show --query user.name -o tsv)
```

2. **Required roles:**
   - **Contributor** role on subscription or resource group
   - **User Access Administrator** for creating service principals

3. **Contact your admin:**
   - If you lack permissions, ask Azure administrator
   - Provide specific resource group name

## Resource Creation Issues

### Resource Name Already Exists

**Symptoms:**
```
ERROR: The storage account named 'dev8mvpstorage12345678' is already taken.
```

**Causes:**
- Names must be globally unique across Azure
- Previous failed cleanup
- Name collision with another Azure customer

**Solutions:**

1. **Use different random suffix:**
```bash
# Generate new random suffix
RANDOM_SUFFIX=$(openssl rand -hex 4)
echo $RANDOM_SUFFIX

# Use in resource names
STORAGE_NAME="dev8mvpstorage${RANDOM_SUFFIX}"
```

2. **Clean up old resources:**
```bash
./scripts/azure/cleanup-resources.sh
```

3. **Check resource availability:**
```bash
# Check if storage name is available
az storage account check-name --name dev8mvpstorage12345678
```

### Resource Group Already Exists

**Symptoms:**
```
ERROR: Resource group 'dev8-mvp-rg' already exists in location 'eastus'
```

**Solution:**

This is usually fine - the script will use existing resource group.

To force recreation:
```bash
# Delete existing group
az group delete --name dev8-mvp-rg --yes

# Re-run setup
./scripts/azure/setup-infrastructure.sh
```

### Quota Exceeded

**Symptoms:**
```
ERROR: Operation could not be completed as it results in exceeding approved quota
```

**Solutions:**

1. **Check current usage:**
```bash
az vm list-usage --location eastus --output table
```

2. **Request quota increase:**
   - Azure Portal → Quotas
   - Select service (e.g., Container Instances)
   - Request increase

3. **Use different region:**
```bash
./scripts/azure/setup-infrastructure.sh dev8-mvp-rg westus
```

### Location Not Available

**Symptoms:**
```
ERROR: The location 'xxx' is not available for resource type 'Microsoft.ContainerInstance'
```

**Solution:**

Check available locations:
```bash
# For Container Instances
az provider show --namespace Microsoft.ContainerInstance \
  --query "resourceTypes[?resourceType=='containerGroups'].locations"

# Common regions: eastus, westus2, westeurope, southeastasia
```

## Container Registry Issues

### Registry Name Invalid

**Symptoms:**
```
ERROR: Registry name must be between 5 and 50 characters, alphanumeric only
```

**Rules:**
- 5-50 characters
- Alphanumeric only (no hyphens, underscores)
- Globally unique

**Solution:**
```bash
REGISTRY_NAME="dev8mvpregistry$(openssl rand -hex 4)"
# Result: dev8mvpregistryab12cd34 (valid)
```

### Cannot Login to Registry

**Symptoms:**
```
ERROR: Access denied when trying to login to registry
```

**Solutions:**

1. **Using admin credentials:**
```bash
az acr credential show --name $REGISTRY_NAME

# Login
az acr login --name $REGISTRY_NAME
```

2. **Using service principal:**
```bash
az acr login --name $REGISTRY_NAME \
  --username $AZURE_CLIENT_ID \
  --password $AZURE_CLIENT_SECRET
```

3. **Enable admin user:**
```bash
az acr update --name $REGISTRY_NAME --admin-enabled true
```

### Cannot Push Image

**Symptoms:**
```
ERROR: denied: requested access to the resource is denied
```

**Solutions:**

1. **Check authentication:**
```bash
az acr login --name $REGISTRY_NAME
```

2. **Verify image tag:**
```bash
# Correct format
docker tag myimage:latest $REGISTRY_NAME.azurecr.io/myimage:latest

# Push
docker push $REGISTRY_NAME.azurecr.io/myimage:latest
```

3. **Check permissions:**
```bash
# Service principal needs AcrPush role
az role assignment create \
  --assignee $AZURE_CLIENT_ID \
  --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerRegistry/registries/$REGISTRY_NAME \
  --role AcrPush
```

## Storage Account Issues

### Storage Name Invalid

**Symptoms:**
```
ERROR: Storage account name must be between 3 and 24 characters, lowercase letters and numbers only
```

**Rules:**
- 3-24 characters
- Lowercase letters and numbers only
- No hyphens or special characters
- Globally unique

**Solution:**
```bash
# Invalid: dev8-mvp-storage (has hyphens)
# Valid: dev8mvpstorage12345678
STORAGE_NAME="dev8mvpstorage$(openssl rand -hex 4)"
```

### Cannot Access Storage Account

**Symptoms:**
```
ERROR: The specified storage account does not exist
```

**Solutions:**

1. **Verify name:**
```bash
az storage account list --query "[].name" -o table
```

2. **Check resource group:**
```bash
az storage account show \
  --name $STORAGE_NAME \
  --resource-group $RESOURCE_GROUP
```

3. **Verify connection string:**
```bash
az storage account show-connection-string \
  --name $STORAGE_NAME \
  --resource-group $RESOURCE_GROUP
```

### File Share Creation Failed

**Symptoms:**
```
ERROR: The specified share already exists
```

**Solutions:**

1. **List existing shares:**
```bash
az storage share list \
  --account-name $STORAGE_NAME \
  --account-key $STORAGE_KEY
```

2. **Delete old share:**
```bash
az storage share delete \
  --name myshare \
  --account-name $STORAGE_NAME \
  --account-key $STORAGE_KEY
```

3. **Use unique names:**
```bash
# Pattern: user-{userId}-env-{envId}
SHARE_NAME="user-123-env-456"
```

## Container Instance Issues

### Container Creation Failed

**Symptoms:**
```
ERROR: Container group provisioning failed
```

**Common Causes:**

1. **Image pull failure:**
```bash
# Check registry credentials in ACI deployment
# Verify image exists in registry
az acr repository list --name $REGISTRY_NAME
```

2. **Resource constraints:**
```bash
# Reduce CPU/Memory requirements
# Or use different region with more capacity
```

3. **Network issues:**
```bash
# Check network security rules
# Verify DNS name label is unique
```

**Debugging:**
```bash
# Get container logs
az container logs \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME

# Get container events
az container show \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --query instanceView.events
```

### Cannot Access Container

**Symptoms:**
- Container created but not accessible
- Connection timeout

**Solutions:**

1. **Check container status:**
```bash
az container show \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --query provisioningState
```

2. **Verify IP address:**
```bash
az container show \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --query ipAddress
```

3. **Check port mapping:**
```bash
# Ensure port 8080 is exposed and mapped correctly
az container show \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --query ipAddress.ports
```

4. **Test connectivity:**
```bash
# Get FQDN
FQDN=$(az container show \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_NAME \
  --query ipAddress.fqdn -o tsv)

# Test
curl http://$FQDN:8080
```

### Volume Mount Failed

**Symptoms:**
```
ERROR: Failed to mount Azure File share
```

**Solutions:**

1. **Verify file share exists:**
```bash
az storage share show \
  --name $SHARE_NAME \
  --account-name $STORAGE_NAME
```

2. **Check storage credentials:**
```bash
# Verify storage account key
az storage account keys list \
  --resource-group $RESOURCE_GROUP \
  --account-name $STORAGE_NAME
```

3. **Create file share if missing:**
```bash
az storage share create \
  --name $SHARE_NAME \
  --account-name $STORAGE_NAME \
  --account-key $STORAGE_KEY
```

## Cost Management Issues

### Cannot Create Budget

**Symptoms:**
```
ERROR: Insufficient permissions to create budget
```

**Solutions:**

1. **Check permissions:**
   - Need **Cost Management Contributor** role
   - Or **Contributor** on subscription

2. **Use Azure Portal:**
   - Go to Cost Management + Billing
   - Click Budgets
   - Create budget manually

3. **Skip budget creation:**
```bash
# Edit setup script to skip budget creation
# Or ignore this error (budget is optional for MVP)
```

### Budget Alerts Not Received

**Symptoms:**
- Budget created but no alerts received
- Exceeded budget without notification

**Solutions:**

1. **Add email addresses:**
```bash
az consumption budget create \
  --budget-name dev8-mvp-budget \
  --resource-group $RESOURCE_GROUP \
  --amount 50 \
  --contact-emails your-email@example.com
```

2. **Check alert thresholds:**
```bash
# Verify thresholds are set (50%, 75%, 90%, 100%)
az consumption budget show \
  --budget-name dev8-mvp-budget \
  --resource-group $RESOURCE_GROUP
```

3. **Check spam folder:**
   - Azure emails might be filtered
   - Whitelist azure-noreply@microsoft.com

## Debugging Tips

### Enable Verbose Logging

```bash
# Azure CLI debug mode
az configure --defaults debug=true

# Or for single command
az <command> --debug
```

### Check Resource Status

```bash
# List all resources in resource group
az resource list \
  --resource-group $RESOURCE_GROUP \
  --output table

# Get detailed resource info
az resource show --ids <resource-id>
```

### Export Resource Configuration

```bash
# Export entire resource group as ARM template
az group export \
  --name $RESOURCE_GROUP \
  --output json > exported-template.json
```

### View Activity Logs

```bash
# Recent operations
az monitor activity-log list \
  --resource-group $RESOURCE_GROUP \
  --offset 1d

# Filter by failed operations
az monitor activity-log list \
  --resource-group $RESOURCE_GROUP \
  --status Failed
```

### Network Troubleshooting

```bash
# Test DNS resolution
nslookup $REGISTRY_NAME.azurecr.io

# Test network connectivity
curl -v https://$REGISTRY_NAME.azurecr.io/v2/

# Ping container FQDN
ping $CONTAINER_FQDN
```

### Clean State and Retry

Often the best solution is to start fresh:

```bash
# 1. Clean up everything
./scripts/azure/cleanup-resources.sh

# 2. Wait for deletion to complete (check portal)

# 3. Run setup again
./scripts/azure/setup-infrastructure.sh

# 4. Validate
./scripts/azure/validate-setup.sh
```

## Getting Help

### Documentation Resources

- [Azure CLI Documentation](https://docs.microsoft.com/cli/azure/)
- [Azure Container Instances Docs](https://docs.microsoft.com/azure/container-instances/)
- [Azure Storage Docs](https://docs.microsoft.com/azure/storage/)
- [Azure Container Registry Docs](https://docs.microsoft.com/azure/container-registry/)

### Support Channels

1. **GitHub Issues:**
   - Report problems at https://github.com/VAIBHAVSING/Dev8.dev/issues
   - Include error messages and steps to reproduce

2. **Azure Support:**
   - Azure Portal → Help + Support
   - Community forums: https://docs.microsoft.com/answers/

3. **Stack Overflow:**
   - Tag questions with `azure`, `azure-cli`, `azure-container-instances`

### Information to Include When Asking for Help

```bash
# Gather diagnostic information
echo "Azure CLI Version:"
az --version

echo "\nSubscription:"
az account show

echo "\nResource Group Status:"
az group show --name $RESOURCE_GROUP

echo "\nResources:"
az resource list --resource-group $RESOURCE_GROUP --output table

echo "\nRecent Activity:"
az monitor activity-log list \
  --resource-group $RESOURCE_GROUP \
  --offset 1h \
  --query "[].{Time:eventTimestamp, Status:status.value, Operation:operationName.localizedValue}"
```

---

**Last Updated:** 2024
**Version:** 1.0.0

**Found an issue not listed here?** Please contribute by opening a PR!
