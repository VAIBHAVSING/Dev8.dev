# Agent Configuration - Quick Reference

## 🚀 Quick Commands

```bash
# Configure for DEV with ACA
make config-dev-aca

# Show current config
make config-show

# Validate configuration
make config-validate

# Run agent
make dev
```

## 📋 Current Setup

**Environment**: DEV  
**Mode**: ACA (Azure Container Apps)  
**Region**: Central India  
**Resource Group**: dev8-dev-rg  
**ACA Environment**: dev8-dev-aca-env

## 🔧 Configuration Files

| File               | Purpose                                 |
| ------------------ | --------------------------------------- |
| `.env`             | Environment variables (auto-configured) |
| `.env.example`     | Template                                |
| `configure-env.sh` | Configuration script                    |
| `CONFIGURATION.md` | Full documentation                      |

## 🎯 Key Environment Variables

### Azure Resources (Auto-configured)

- `AZURE_DEPLOYMENT_MODE=aca`
- `AZURE_RESOURCE_GROUP=dev8-dev-rg`
- `AZURE_DEFAULT_REGION=centralindia`
- `AZURE_STORAGE_ACCOUNT=dev8devst3ttnbdco3yuv6`
- `AZURE_CONTAINER_REGISTRY=dev8devcr3ttnbdco3yuv6.azurecr.io`
- `AZURE_ACA_ENVIRONMENT_ID=/subscriptions/.../dev8-dev-aca-env`

### PROD Configuration (Commented Out)

```bash
# AZURE_DEPLOYMENT_MODE=aci
# AZURE_RESOURCE_GROUP=dev8-prod-rg
# AZURE_DEFAULT_REGION=centralindia
```

## 🔄 Reconfiguration

When infrastructure changes:

```bash
cd apps/agent
make config-dev-aca
make config-validate
```

## ⚠️ Important

- Never commit `.env` to git
- PROD/ACI is commented out for now
- Run `make config-dev-aca` after infrastructure updates
- All values fetched directly from Azure

## 📖 More Info

See `CONFIGURATION.md` for complete documentation.
