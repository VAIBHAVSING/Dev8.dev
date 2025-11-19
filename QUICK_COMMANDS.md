# Dev8.dev Quick Command Reference

## 🚀 Infrastructure Deployment

### Development (ACI)

```bash
cd in/azure
make deploy-dev-quick        # Non-interactive
make deploy-dev              # Interactive (default)
```

### Production (ACA)

```bash
cd in/azure
make deploy-prod-quick       # Non-interactive
make deploy-prod             # Interactive (default)
```

### Non-Interactive (CI/CD)

```bash
make deploy-dev INTERACTIVE=false
make deploy-prod INTERACTIVE=false
```

## 🔄 Deployment Mode Management

```bash
cd in/azure

# Show current mode
make show-mode

# Switch to ACI
make set-mode-aci

# Switch to ACA
make set-mode-aca
```

## 🐳 Container Deployment

```bash
cd docker

# Build images
make build-all

# Push to ACR
make prod-push

# Deploy (auto-detects mode from .env.prod)
make prod-deploy
```

## ✅ Validation & Status

```bash
cd in/azure

# Validate templates
make validate

# Check deployment status
make status

# List resources
make list-resources

# Preview changes
make what-if
```

## 📊 Monitoring

### ACI Logs

```bash
az container logs \
  --resource-group dev8-dev-rg \
  --name dev8-workspace-xyz \
  --follow
```

### ACA Logs

```bash
az containerapp logs show \
  --name aca-xyz \
  --resource-group dev8-prod-rg \
  --follow
```

## 🔧 Management

### Get Container Status (ACI)

```bash
az container show \
  --resource-group dev8-dev-rg \
  --name dev8-workspace-xyz \
  --query "{State:instanceView.state,FQDN:ipAddress.fqdn}"
```

### Get Container Status (ACA)

```bash
az containerapp show \
  --name aca-xyz \
  --resource-group dev8-prod-rg \
  --query "{Replicas:properties.runningStatus,FQDN:properties.configuration.ingress.fqdn}"
```

### Stop Container (ACI)

```bash
az container stop \
  --resource-group dev8-dev-rg \
  --name dev8-workspace-xyz
```

### Delete Container (ACI)

```bash
az container delete \
  --resource-group dev8-dev-rg \
  --name dev8-workspace-xyz \
  --yes
```

### Delete Container (ACA)

```bash
az containerapp delete \
  --name aca-xyz \
  --resource-group dev8-prod-rg \
  --yes
```

## 🧪 Testing

### Full Dev Deployment Test

```bash
# 1. Deploy infrastructure
cd in/azure && make deploy-dev-quick

# 2. Verify agent config
cd ../../apps/agent
grep AZURE_DEPLOYMENT_MODE .env

# 3. Deploy container
cd ../docker
make build-all && make prod-push && make prod-deploy
```

### Full Prod Deployment Test

```bash
# 1. Deploy infrastructure (includes ACA env)
cd in/azure && make deploy-prod-quick

# 2. Verify agent config
cd ../../apps/agent
grep AZURE_DEPLOYMENT_MODE .env
grep AZURE_ACA_ENVIRONMENT_ID .env

# 3. Deploy container
cd ../docker
make build-all && make prod-push && make prod-deploy
```

## 🗑️ Cleanup

### Delete Everything (Dev)

```bash
cd in/azure
make destroy
# Confirm: dev8-dev-rg
```

### Delete Everything (Prod)

```bash
cd in/azure
make destroy
# Confirm: dev8-prod-rg
```

## 📍 Important Files

### Configuration

- `apps/agent/.env` - Agent configuration (auto-configured)
- `docker/.env.prod` - Container deployment config
- `in/azure/bicep/parameters/dev.bicepparam` - Dev infrastructure params
- `in/azure/bicep/parameters/prod.bicepparam` - Prod infrastructure params

### Scripts

- `in/azure/Makefile` - Infrastructure automation
- `docker/Makefile` - Container automation
- `docker/deploy-to-azure.sh` - Container deployment script

### Documentation

- `DEPLOYMENT_GUIDE_ACI_ACA.md` - Full deployment guide
- `IMPLEMENTATION_SUMMARY_ACI_ACA.md` - Implementation details
- `in/azure/README.md` - Infrastructure docs
- `docker/README.md` - Container docs

## 🔐 Environment Variables

### Required (apps/agent/.env)

```bash
AZURE_SUBSCRIPTION_ID=...
AZURE_RESOURCE_GROUP=...
AZURE_STORAGE_ACCOUNT=...
AZURE_STORAGE_KEY=...
AZURE_CONTAINER_REGISTRY=...
AZURE_DEPLOYMENT_MODE=aci  # or "aca"
```

### ACA Mode Additional (apps/agent/.env)

```bash
AZURE_ACA_ENVIRONMENT_ID=/subscriptions/.../managedEnvironments/...
```

### Container Deployment (docker/.env.prod)

```bash
AZURE_DEPLOYMENT_MODE=aca  # or "aci"
ACA_ENVIRONMENT_ID=/subscriptions/.../managedEnvironments/...
RESOURCE_GROUP=dev8-prod-rg
LOCATION=centralindia
ACR_NAME=...
```

## 🆘 Troubleshooting

### Issue: Deploy hangs

```bash
# Use non-interactive mode
make deploy-dev INTERACTIVE=false
```

### Issue: ACA_ENVIRONMENT_ID not set

```bash
# Deploy prod first
make deploy-prod

# Or get manually
az containerapp env show \
  --name dev8-prod-aca-env \
  --resource-group dev8-prod-rg \
  --query id -o tsv
```

### Issue: Script not found

```bash
# Verify file exists
ls -la docker/deploy-to-azure.sh

# Make executable
chmod +x docker/deploy-to-azure.sh
```

### Issue: Credentials missing

```bash
# Re-run auto-config
cd in/azure
make _auto-configure-agent
```

## 📞 Help

```bash
# Show all available commands
cd in/azure
make help

cd docker
make help
```

---

**Quick Start:**

1. Deploy: `cd in/azure && make deploy-dev-quick`
2. Build: `cd ../../docker && make build-all`
3. Deploy Container: `make prod-deploy`

Done! 🎉
