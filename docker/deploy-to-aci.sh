#!/bin/bash
set -euo pipefail

################################################################################
# Azure Container Instances Deployment Script
# This script automates the deployment of Dev8.dev workspace to ACI
################################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

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

# Validate required variables
required_vars=(
    "RESOURCE_GROUP"
    "LOCATION"
    "ACR_NAME"
    "STORAGE_ACCOUNT"
    "GITHUB_TOKEN"
    "CODE_SERVER_PASSWORD"
    "ENVIRONMENT_ID"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
        log_error "Required variable $var is not set"
        exit 1
    fi
done

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
# Deploy Container Instance
################################################################################

log_info "Deploying to Azure Container Instances..."

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

################################################################################
# Get Deployment Info
################################################################################

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

################################################################################
# Display Results
################################################################################

echo ""
echo "=========================================================================="
echo "✅ Deployment Complete!"
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
echo "🛑 Stop container:"
echo "  az container stop --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME"
echo ""
echo "🗑️  Delete deployment:"
echo "  az container delete --resource-group $RESOURCE_GROUP --name $CONTAINER_NAME --yes"
echo "=========================================================================="

# Save deployment info
cat > deployment-info.txt <<EOF
Deployment Information
======================
Container: $CONTAINER_NAME
FQDN: $FQDN
Public IP: $PUBLIC_IP
VS Code: http://$FQDN:8080
SSH: ssh -p 2222 dev8@$FQDN
Password: $CODE_SERVER_PASSWORD
Resource Group: $RESOURCE_GROUP
Region: $LOCATION
Deployed: $(date)
EOF

log_info "Deployment info saved to deployment-info.txt"
