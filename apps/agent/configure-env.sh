#!/bin/bash

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

MODE=${1:-dev-aca}

echo -e "${BLUE}Configuring Agent Environment: $MODE${NC}"
echo ""

if [ "$MODE" = "dev-aca" ]; then
    echo "Fetching DEV configuration from Azure (ACA mode)..."
    
    RG_DEV="dev8-dev-rg"
    LOCATION=$(az group show --name $RG_DEV --query location -o tsv)
    STORAGE_NAME=$(az storage account list -g $RG_DEV --query '[0].name' -o tsv)
    STORAGE_KEY=$(az storage account keys list -g $RG_DEV -n $STORAGE_NAME --query '[0].value' -o tsv)
    REGISTRY_NAME=$(az acr list -g $RG_DEV --query '[0].name' -o tsv)
    REGISTRY_SERVER=$(az acr list -g $RG_DEV --query '[0].loginServer' -o tsv)
    REGISTRY_USER=$(az acr credential show -n $REGISTRY_NAME --query username -o tsv)
    REGISTRY_PASS=$(az acr credential show -n $REGISTRY_NAME --query 'passwords[0].value' -o tsv)
    ACA_ENV_NAME=$(az containerapp env list -g $RG_DEV --query '[0].name' -o tsv)
    ACA_ENV_ID=$(az containerapp env show --name $ACA_ENV_NAME -g $RG_DEV --query id -o tsv)
    SUB_ID=$(az account show --query id -o tsv)
    TENANT_ID=$(az account show --query tenantId -o tsv)
    
    # Preserve existing credentials if they exist
    CLIENT_ID=$(grep "^AZURE_CLIENT_ID=" .env 2>/dev/null | cut -d= -f2 || echo "")
    CLIENT_SECRET=$(grep "^AZURE_CLIENT_SECRET=" .env 2>/dev/null | cut -d= -f2 || echo "")
    
    # Create .env file
    cat > .env << ENVEOF
# Server Configuration
AGENT_PORT=8080
AGENT_HOST=0.0.0.0
ENVIRONMENT=development
LOG_LEVEL=info

# CORS Configuration
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# ============================================================================
# Azure Configuration (Auto-configured from Azure - fetched $(date))
# ============================================================================
AZURE_SUBSCRIPTION_ID=$SUB_ID
AZURE_TENANT_ID=$TENANT_ID
AZURE_CLIENT_ID=$CLIENT_ID
AZURE_CLIENT_SECRET=$CLIENT_SECRET
AZURE_RESOURCE_GROUP=$RG_DEV
AZURE_STORAGE_ACCOUNT=$STORAGE_NAME
AZURE_STORAGE_KEY=$STORAGE_KEY
AZURE_DEFAULT_REGION=$LOCATION

# ============================================================================
# Container Image Configuration
# ============================================================================
# Azure Container Registry (ACR)
AZURE_CONTAINER_REGISTRY=$REGISTRY_SERVER
CONTAINER_IMAGE_NAME=dev8-workspace:1.1
CONTAINER_IMAGE=vaibhavsing/dev8-workspace:latest
REGISTRY_SERVER=index.docker.io

# ACR Credentials (Auto-configured from Azure)
REGISTRY_USERNAME=$REGISTRY_USER
REGISTRY_PASSWORD=$REGISTRY_PASS

# Agent Configuration
AGENT_BASE_URL=http://localhost:8080

# ============================================================================
# Container Orchestration Provider - DEV (ACA)
# ============================================================================
# Currently using: Azure Container Apps (ACA) in $LOCATION
AZURE_DEPLOYMENT_MODE=aca

# Azure Container Apps (ACA) Configuration
# Auto-configured from: $ACA_ENV_NAME
AZURE_ACA_ENVIRONMENT_ID=$ACA_ENV_ID

# ============================================================================
# PROD Environment (ACI) - COMMENTED OUT
# ============================================================================
# Uncomment these when deploying to PROD with ACI
# AZURE_DEPLOYMENT_MODE=aci
# AZURE_RESOURCE_GROUP=dev8-prod-rg
# AZURE_DEFAULT_REGION=centralindia
# # PROD resources will be auto-configured when running: make config-prod-aci
ENVEOF

    echo -e "${GREEN}✓ .env configured for DEV with ACA${NC}"
    echo "  Region: $LOCATION"
    echo "  Resource Group: $RG_DEV"
    echo "  ACA Environment: $ACA_ENV_NAME"
    
elif [ "$MODE" = "prod-aci" ]; then
    echo -e "${YELLOW}⚠️  PROD ACI configuration is currently disabled${NC}"
    echo "This will be enabled after PROD infrastructure is deployed"
    echo ""
    echo "To enable PROD:"
    echo "  1. Deploy PROD infrastructure: cd ../../in/azure && make deploy-prod-aci"
    echo "  2. Run: make config-prod-aci"
    exit 1
else
    echo -e "${RED}Invalid mode: $MODE${NC}"
    echo "Usage: $0 {dev-aca|prod-aci}"
    exit 1
fi
