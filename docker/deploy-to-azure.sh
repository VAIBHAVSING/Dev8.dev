#!/bin/bash
set -euo pipefail

################################################################################
# Azure Deployment Script (ACI & ACA)
# This script automates the deployment of Dev8.dev workspace to Azure
# Supports: Azure Container Instances (ACI) and Azure Container Apps (ACA)
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step() { echo -e "${BLUE}[STEP]${NC} $1"; }

################################################################################
# Configuration
################################################################################

# Load environment variables
if [ -f .env.prod ]; then
    log_info "Loading production environment from .env.prod"
    set -a
    source .env.prod
    set +a
else
    log_error "Missing .env.prod file. Copy .env.prod.example and configure."
    exit 1
fi

# Detect deployment mode from environment or default to ACI
DEPLOYMENT_MODE="${AZURE_DEPLOYMENT_MODE:-aci}"
log_info "Deployment mode: $DEPLOYMENT_MODE"

# Validate required variables based on mode
required_vars=(
    "RESOURCE_GROUP"
    "LOCATION"
    "ACR_NAME"
    "STORAGE_ACCOUNT"
    "GITHUB_TOKEN"
    "CODE_SERVER_PASSWORD"
    "ENVIRONMENT_ID"
)

# Add ACA-specific validation
if [ "$DEPLOYMENT_MODE" = "aca" ]; then
    if [ -z "${ACA_ENVIRONMENT_ID:-}" ]; then
        log_error "ACA_ENVIRONMENT_ID is required when AZURE_DEPLOYMENT_MODE=aca"
        log_info "Get it from: az containerapp env show --name <env-name> --resource-group <rg> --query id -o tsv"
        exit 1
    fi
    log_info "ACA Environment ID: $ACA_ENVIRONMENT_ID"
fi

for var in "${required_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
        log_error "Required variable $var is not set"
        exit 1
    fi
done

case $DEPLOYMENT_MODE in
    aci)
        log_info "✓ Using Azure Container Instances (ACI)"
        ;;
    aca)
        log_info "✓ Using Azure Container Apps (ACA)"
        ;;
    *)
        log_error "Invalid AZURE_DEPLOYMENT_MODE: $DEPLOYMENT_MODE (must be 'aci' or 'aca')"
        exit 1
        ;;
esac

################################################################################
# Azure Login Check
################################################################################

log_info "Checking Azure CLI authentication..."
if ! az account show &>/dev/null; then
    log_error "Not logged in to Azure. Run: az login"
    exit 1
fi

SUBSCRIPTION_NAME=$(az account show --query "name" -o tsv)
log_info "Using subscription: $SUBSCRIPTION_NAME"

################################################################################
# Create Resource Group
################################################################################

log_info "Creating resource group: $RESOURCE_GROUP"
az group create \
    --name "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --tags \
        Environment=Production \
        Project=Dev8 \
        DeployedBy="$(whoami)" \
        DeployedAt="$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    || log_warn "Resource group may already exist"

################################################################################
# Create Azure Container Registry
################################################################################

log_info "Creating Azure Container Registry: $ACR_NAME"
az acr create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$ACR_NAME" \
    --sku Standard \
    --admin-enabled true \
    || log_warn "ACR may already exist"

# Get ACR credentials
log_info "Getting ACR credentials..."
ACR_USERNAME=$(az acr credential show --name "$ACR_NAME" --query "username" -o tsv)
ACR_PASSWORD=$(az acr credential show --name "$ACR_NAME" --query "passwords[0].value" -o tsv)
ACR_LOGIN_SERVER=$(az acr show --name "$ACR_NAME" --query "loginServer" -o tsv)

log_info "ACR Login Server: $ACR_LOGIN_SERVER"

################################################################################
# Build and Push Docker Image
################################################################################

log_info "Building Docker image..."
cd ..
make build-all
cd docker

log_info "Tagging image for ACR..."
IMAGE_TAG="${IMAGE_TAG:-latest}"
docker tag dev8-workspace:latest "$ACR_LOGIN_SERVER/dev8-workspace:$IMAGE_TAG"
docker tag dev8-workspace:latest "$ACR_LOGIN_SERVER/dev8-workspace:latest"

log_info "Logging in to ACR..."
az acr login --name "$ACR_NAME"

log_info "Pushing image to ACR..."
docker push "$ACR_LOGIN_SERVER/dev8-workspace:$IMAGE_TAG"
docker push "$ACR_LOGIN_SERVER/dev8-workspace:latest"

log_info "Verifying image in ACR..."
az acr repository show --name "$ACR_NAME" --repository dev8-workspace

################################################################################
# Create Storage Account and File Shares
################################################################################

log_info "Creating storage account: $STORAGE_ACCOUNT"
az storage account create \
    --name "$STORAGE_ACCOUNT" \
    --resource-group "$RESOURCE_GROUP" \
    --location "$LOCATION" \
    --sku Standard_LRS \
    --kind StorageV2 \
    || log_warn "Storage account may already exist"

# Get storage key
log_info "Getting storage account key..."
STORAGE_KEY=$(az storage account keys list \
    --resource-group "$RESOURCE_GROUP" \
    --account-name "$STORAGE_ACCOUNT" \
    --query "[0].value" -o tsv)

# Create single file share for all persistent data (home + workspace)
log_info "Creating Azure File share for all persistent data..."
az storage share create \
    --name dev8-data \
    --account-name "$STORAGE_ACCOUNT" \
    --account-key "$STORAGE_KEY" \
    --quota 200 \
    || log_warn "Share dev8-data may already exist"

log_info "Note: Workspace will be stored in /home/dev8/workspace subdirectory"

# Create backup container
log_info "Creating backup container..."
az storage container create \
    --name "${AZURE_STORAGE_CONTAINER:-dev8-backups}" \
    --account-name "$STORAGE_ACCOUNT" \
    --account-key "$STORAGE_KEY" \
    || log_warn "Container may already exist"

################################################################################
# Deployment Functions
################################################################################

deploy_to_aci() {
    log_step "Deploying to Azure Container Instances (ACI)..."
    
    CONTAINER_NAME="${CONTAINER_NAME:-dev8-workspace-$ENVIRONMENT_ID}"
    DNS_NAME="dev8-${ENVIRONMENT_ID}"
    
    # Check if container already exists
    if az container show --resource-group "$RESOURCE_GROUP" --name "$CONTAINER_NAME" &>/dev/null; then
        log_warn "Container $CONTAINER_NAME already exists. Deleting..."
        az container delete \
            --resource-group "$RESOURCE_GROUP" \
            --name "$CONTAINER_NAME" \
            --yes
        log_info "Waiting for deletion to complete..."
        sleep 10
    fi
    
    log_info "Creating new container instance..."
    az container create \
    --resource-group "$RESOURCE_GROUP" \
    --name "$CONTAINER_NAME" \
    --image "$ACR_LOGIN_SERVER/dev8-workspace:$IMAGE_TAG" \
    --cpu "${CPU_LIMIT:-2}" \
    --memory "${MEMORY_LIMIT:-4}" \
    --registry-login-server "$ACR_LOGIN_SERVER" \
    --registry-username "$ACR_USERNAME" \
    --registry-password "$ACR_PASSWORD" \
    --dns-name-label "$DNS_NAME" \
    --ports 8080 2222 9000 \
    --environment-variables \
        ENVIRONMENT_ID="$ENVIRONMENT_ID" \
        GIT_USER_NAME="$GIT_USER_NAME" \
        GIT_USER_EMAIL="$GIT_USER_EMAIL" \
        CODE_SERVER_AUTH="${CODE_SERVER_AUTH:-password}" \
        SUPERVISOR_PORT="${SUPERVISOR_PORT:-9000}" \
        AZURE_STORAGE_ACCOUNT="$STORAGE_ACCOUNT" \
        AZURE_STORAGE_CONTAINER="${AZURE_STORAGE_CONTAINER:-dev8-backups}" \
        WORKSPACE_BACKUP_ENABLED="${WORKSPACE_BACKUP_ENABLED:-true}" \
        WORKSPACE_BACKUP_INTERVAL="${WORKSPACE_BACKUP_INTERVAL:-3600}" \
        LOG_LEVEL="${LOG_LEVEL:-info}" \
    --secure-environment-variables \
        GITHUB_TOKEN="$GITHUB_TOKEN" \
        CODE_SERVER_PASSWORD="$CODE_SERVER_PASSWORD" \
        AZURE_STORAGE_KEY="$STORAGE_KEY" \
        ANTHROPIC_API_KEY="${ANTHROPIC_API_KEY:-}" \
        OPENAI_API_KEY="${OPENAI_API_KEY:-}" \
        GEMINI_API_KEY="${GEMINI_API_KEY:-}" \
    --azure-file-volume-account-name "$STORAGE_ACCOUNT" \
    --azure-file-volume-account-key "$STORAGE_KEY" \
    --azure-file-volume-share-name dev8-data \
    --azure-file-volume-mount-path /home/dev8 \
    --restart-policy Always
    
    # Get deployment info
    log_info "Waiting for container to start..."
    sleep 15
    
    FQDN=$(az container show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$CONTAINER_NAME" \
        --query "ipAddress.fqdn" -o tsv)
    
    PUBLIC_IP=$(az container show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$CONTAINER_NAME" \
        --query "ipAddress.ip" -o tsv)
    
    STATUS=$(az container show \
        --resource-group "$RESOURCE_GROUP" \
        --name "$CONTAINER_NAME" \
        --query "instanceView.state" -o tsv)
    
    # Display results
    display_results_aci
}

deploy_to_aca() {
    log_step "Deploying to Azure Container Apps (ACA)..."
    
    CONTAINER_NAME="aca-${ENVIRONMENT_ID}"
    
    # Check if container app already exists
    if az containerapp show --name "$CONTAINER_NAME" --resource-group "$RESOURCE_GROUP" &>/dev/null; then
        log_warn "Container app $CONTAINER_NAME already exists. Updating..."
        UPDATE_MODE=true
    else
        log_info "Creating new container app..."
        UPDATE_MODE=false
    fi
    
    # Prepare environment variables
    ENV_VARS="ENVIRONMENT_ID=$ENVIRONMENT_ID"
    ENV_VARS="$ENV_VARS GIT_USER_NAME=$GIT_USER_NAME"
    ENV_VARS="$ENV_VARS GIT_USER_EMAIL=$GIT_USER_EMAIL"
    ENV_VARS="$ENV_VARS CODE_SERVER_AUTH=${CODE_SERVER_AUTH:-password}"
    ENV_VARS="$ENV_VARS SUPERVISOR_PORT=${SUPERVISOR_PORT:-9000}"
    ENV_VARS="$ENV_VARS AZURE_STORAGE_ACCOUNT=$STORAGE_ACCOUNT"
    ENV_VARS="$ENV_VARS LOG_LEVEL=${LOG_LEVEL:-info}"
    
    # Prepare secrets
    SECRETS="github-token=$GITHUB_TOKEN"
    SECRETS="$SECRETS code-server-password=$CODE_SERVER_PASSWORD"
    SECRETS="$SECRETS storage-key=$STORAGE_KEY"
    
    if [ -n "${ANTHROPIC_API_KEY:-}" ]; then
        SECRETS="$SECRETS anthropic-api-key=$ANTHROPIC_API_KEY"
    fi
    if [ -n "${OPENAI_API_KEY:-}" ]; then
        SECRETS="$SECRETS openai-api-key=$OPENAI_API_KEY"
    fi
    if [ -n "${GEMINI_API_KEY:-}" ]; then
        SECRETS="$SECRETS gemini-api-key=$GEMINI_API_KEY"
    fi
    
    # Create or update container app
    if [ "$UPDATE_MODE" = false ]; then
        az containerapp create \
            --name "$CONTAINER_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --environment "$ACA_ENVIRONMENT_ID" \
            --image "$ACR_LOGIN_SERVER/dev8-workspace:$IMAGE_TAG" \
            --registry-server "$ACR_LOGIN_SERVER" \
            --registry-username "$ACR_USERNAME" \
            --registry-password "$ACR_PASSWORD" \
            --cpu "${CPU_LIMIT:-2.0}" \
            --memory "${MEMORY_LIMIT:-4.0}Gi" \
            --min-replicas 0 \
            --max-replicas 1 \
            --target-port 8080 \
            --ingress external \
            --env-vars $ENV_VARS \
            --secrets $SECRETS
    else
        az containerapp update \
            --name "$CONTAINER_NAME" \
            --resource-group "$RESOURCE_GROUP" \
            --image "$ACR_LOGIN_SERVER/dev8-workspace:$IMAGE_TAG"
    fi
    
    # Get deployment info
    log_info "Waiting for container app to be ready..."
    sleep 10
    
    FQDN=$(az containerapp show \
        --name "$CONTAINER_NAME" \
        --resource-group "$RESOURCE_GROUP" \
        --query "properties.configuration.ingress.fqdn" -o tsv)
    
    # Display results
    display_results_aca
}

display_results_aci() {
    echo ""
    echo "=========================================================================="
    echo "✅ ACI Deployment Complete!"
    echo "=========================================================================="
    echo ""
    echo "Container: $CONTAINER_NAME"
    echo "Status: $STATUS"
    echo "FQDN: $FQDN"
    echo "Public IP: $PUBLIC_IP"
    echo ""
    echo "🔗 Access URLs:"
    echo "  VS Code Server: http://$FQDN:8080"
    echo "  SSH Access:     ssh -p 2222 dev8@$FQDN"
    echo "  Supervisor API: http://$FQDN:9000"
    echo ""
    echo "🔐 Credentials:"
    echo "  VS Code Password: $CODE_SERVER_PASSWORD"
    echo ""
    echo "📊 View logs:"
    echo "  az container logs --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --follow"
    echo ""
    echo "=========================================================================="
}

display_results_aca() {
    echo ""
    echo "=========================================================================="
    echo "✅ ACA Deployment Complete!"
    echo "=========================================================================="
    echo ""
    echo "Container App: $CONTAINER_NAME"
    echo "FQDN: $FQDN"
    echo ""
    echo "🔗 Access URL:"
    echo "  VS Code Server: https://$FQDN"
    echo ""
    echo "🔐 Credentials:"
    echo "  VS Code Password: $CODE_SERVER_PASSWORD"
    echo ""
    echo "📊 View logs:"
    echo "  az containerapp logs show --name $CONTAINER_NAME --resource-group $RESOURCE_GROUP --follow"
    echo ""
    echo "💡 Scale-to-zero enabled: Container will auto-stop when inactive"
    echo "=========================================================================="
}

################################################################################
# Main Deployment Logic
################################################################################

if [ "$DEPLOYMENT_MODE" = "aca" ]; then
    deploy_to_aca
else
    deploy_to_aci
fi

# Save deployment info
cat > deployment-info.txt <<EOF
Deployment Information
======================
Mode: $DEPLOYMENT_MODE
Container: $CONTAINER_NAME
FQDN: $FQDN
Resource Group: $RESOURCE_GROUP
Region: $LOCATION
Deployed: $(date)
EOF

log_info "Deployment info saved to deployment-info.txt"

