#!/bin/bash

# Azure Infrastructure Setup Script for Dev8.dev MVP
# This script creates all required Azure resources for the ACI MVP

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DEFAULT_RESOURCE_GROUP="dev8-mvp-rg"
DEFAULT_LOCATION="eastus"
DEFAULT_ENVIRONMENT="dev"

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to check if Azure CLI is installed
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed. Please install it first:"
        echo "  https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
        exit 1
    fi
    print_success "Azure CLI is installed"
}

# Function to check if user is logged in to Azure
check_azure_login() {
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
    
    local subscription_name=$(az account show --query name -o tsv)
    local subscription_id=$(az account show --query id -o tsv)
    print_success "Logged in to Azure subscription: $subscription_name ($subscription_id)"
}

# Function to generate random suffix for globally unique names
generate_random_suffix() {
    openssl rand -hex 4
}

# Function to create resource group
create_resource_group() {
    local rg_name=$1
    local location=$2
    
    print_info "Checking if resource group '$rg_name' exists..."
    
    if az group show --name "$rg_name" &> /dev/null; then
        print_warning "Resource group '$rg_name' already exists. Skipping creation."
        return 0
    fi
    
    print_info "Creating resource group '$rg_name' in '$location'..."
    az group create \
        --name "$rg_name" \
        --location "$location" \
        --tags Project=Dev8 Environment=MVP CostCenter=Development \
        --output none
    
    print_success "Resource group '$rg_name' created successfully"
}

# Function to create storage account
create_storage_account() {
    local rg_name=$1
    local location=$2
    local random_suffix=$3
    local storage_name="dev8mvpstorage${random_suffix}"
    
    print_info "Checking if storage account '$storage_name' exists..."
    
    if az storage account show --name "$storage_name" --resource-group "$rg_name" &> /dev/null; then
        print_warning "Storage account '$storage_name' already exists. Skipping creation."
        echo "$storage_name"
        return 0
    fi
    
    print_info "Creating storage account '$storage_name'..."
    az storage account create \
        --name "$storage_name" \
        --resource-group "$rg_name" \
        --location "$location" \
        --sku Standard_LRS \
        --kind StorageV2 \
        --min-tls-version TLS1_2 \
        --tags Project=Dev8 Environment=MVP \
        --output none
    
    print_success "Storage account '$storage_name' created successfully"
    echo "$storage_name"
}

# Function to create container registry
create_container_registry() {
    local rg_name=$1
    local location=$2
    local random_suffix=$3
    local registry_name="dev8mvpregistry${random_suffix}"
    
    print_info "Checking if container registry '$registry_name' exists..."
    
    if az acr show --name "$registry_name" --resource-group "$rg_name" &> /dev/null; then
        print_warning "Container registry '$registry_name' already exists. Skipping creation."
        echo "$registry_name"
        return 0
    fi
    
    print_info "Creating container registry '$registry_name'..."
    az acr create \
        --resource-group "$rg_name" \
        --name "$registry_name" \
        --sku Basic \
        --admin-enabled true \
        --location "$location" \
        --tags Project=Dev8 Environment=MVP \
        --output none
    
    print_success "Container registry '$registry_name' created successfully"
    echo "$registry_name"
}

# Function to create service principal
create_service_principal() {
    local rg_name=$1
    local subscription_id=$2
    local sp_name="dev8-mvp-sp"
    
    print_info "Checking if service principal '$sp_name' exists..."
    
    # Check if SP already exists
    local existing_sp=$(az ad sp list --display-name "$sp_name" --query "[0].appId" -o tsv)
    
    if [ -n "$existing_sp" ]; then
        print_warning "Service principal '$sp_name' already exists (App ID: $existing_sp)"
        print_warning "If you need new credentials, please delete the existing SP and re-run this script."
        return 0
    fi
    
    print_info "Creating service principal '$sp_name'..."
    
    local sp_output=$(az ad sp create-for-rbac \
        --name "$sp_name" \
        --role contributor \
        --scopes "/subscriptions/${subscription_id}/resourceGroups/${rg_name}" \
        --sdk-auth)
    
    # Save credentials to a secure file (not in git)
    local credentials_file="../../azure-credentials.json"
    echo "$sp_output" > "$credentials_file"
    chmod 600 "$credentials_file"
    
    print_success "Service principal '$sp_name' created successfully"
    print_warning "Credentials saved to: $credentials_file"
    print_warning "Keep these credentials secure and DO NOT commit them to git!"
}

# Function to create cost management budget
create_budget() {
    local rg_name=$1
    local budget_name="dev8-mvp-budget"
    
    print_info "Checking if budget '$budget_name' exists..."
    
    if az consumption budget show --budget-name "$budget_name" --resource-group "$rg_name" &> /dev/null 2>&1; then
        print_warning "Budget '$budget_name' already exists. Skipping creation."
        return 0
    fi
    
    print_info "Creating cost management budget '$budget_name'..."
    
    local start_date=$(date +%Y-%m-01)
    local end_date=$(date -d "1 year" +%Y-%m-01)
    
    # Note: Budget creation might fail if user doesn't have proper permissions
    if ! az consumption budget create \
        --budget-name "$budget_name" \
        --resource-group "$rg_name" \
        --amount 50 \
        --time-grain Monthly \
        --start-date "$start_date" \
        --end-date "$end_date" \
        --output none 2>&1; then
        print_warning "Failed to create budget. You may need additional permissions for cost management."
        print_info "You can create a budget manually in the Azure Portal."
        return 0
    fi
    
    print_success "Budget '$budget_name' created successfully"
}

# Function to generate environment file
generate_env_file() {
    local rg_name=$1
    local storage_name=$2
    local registry_name=$3
    local location=$4
    local subscription_id=$5
    
    print_info "Generating environment configuration files..."
    
    # Get storage connection string and key
    local storage_key=$(az storage account keys list \
        --resource-group "$rg_name" \
        --account-name "$storage_name" \
        --query "[0].value" -o tsv)
    
    local storage_connection_string=$(az storage account show-connection-string \
        --name "$storage_name" \
        --resource-group "$rg_name" \
        --query connectionString -o tsv)
    
    # Get registry credentials
    local registry_username=$(az acr credential show \
        --name "$registry_name" \
        --query username -o tsv)
    
    local registry_password=$(az acr credential show \
        --name "$registry_name" \
        --query "passwords[0].value" -o tsv)
    
    local registry_login_server=$(az acr show \
        --name "$registry_name" \
        --resource-group "$rg_name" \
        --query loginServer -o tsv)
    
    # Create .env.azure file at root
    cat > ../../.env.azure << EOF
# Azure Infrastructure Configuration
# Generated by setup-infrastructure.sh on $(date)
# DO NOT COMMIT THIS FILE TO GIT!

# Azure Authentication
AZURE_SUBSCRIPTION_ID=${subscription_id}
AZURE_TENANT_ID=$(az account show --query tenantId -o tsv)

# Azure Resources
AZURE_RESOURCE_GROUP=${rg_name}
AZURE_STORAGE_ACCOUNT=${storage_name}
AZURE_CONTAINER_REGISTRY=${registry_name}
AZURE_REGION=${location}

# Storage Connection
AZURE_STORAGE_CONNECTION_STRING="${storage_connection_string}"
AZURE_STORAGE_KEY=${storage_key}

# Container Registry
AZURE_REGISTRY_LOGIN_SERVER=${registry_login_server}
AZURE_REGISTRY_USERNAME=${registry_username}
AZURE_REGISTRY_PASSWORD=${registry_password}
EOF
    
    chmod 600 ../../.env.azure
    print_success "Environment file created: .env.azure"
    
    # Create apps/agent/.env file if apps/agent exists
    if [ -d "../../apps/agent" ]; then
        cat > ../../apps/agent/.env << EOF
# Azure Agent Configuration
# Generated by setup-infrastructure.sh on $(date)
# DO NOT COMMIT THIS FILE TO GIT!

# Azure Authentication
AZURE_SUBSCRIPTION_ID=${subscription_id}
AZURE_TENANT_ID=$(az account show --query tenantId -o tsv)

# Azure Resources
AZURE_RESOURCE_GROUP=${rg_name}
AZURE_STORAGE_ACCOUNT=${storage_name}
AZURE_CONTAINER_REGISTRY=${registry_name}
AZURE_REGION=${location}

# Storage Configuration
AZURE_STORAGE_CONNECTION_STRING="${storage_connection_string}"
AZURE_STORAGE_KEY=${storage_key}

# Container Registry Configuration
AZURE_REGISTRY_LOGIN_SERVER=${registry_login_server}
AZURE_REGISTRY_USERNAME=${registry_username}
AZURE_REGISTRY_PASSWORD=${registry_password}
EOF
        chmod 600 ../../apps/agent/.env
        print_success "Environment file created: apps/agent/.env"
    fi
    
    print_warning "Environment files contain sensitive information. Keep them secure!"
}

# Main execution
main() {
    echo "=========================================="
    echo "  Dev8.dev Azure Infrastructure Setup"
    echo "=========================================="
    echo ""
    
    # Parse command line arguments
    local resource_group="${1:-$DEFAULT_RESOURCE_GROUP}"
    local location="${2:-$DEFAULT_LOCATION}"
    local environment="${3:-$DEFAULT_ENVIRONMENT}"
    
    # Pre-flight checks
    check_azure_cli
    check_azure_login
    
    # Get subscription ID
    local subscription_id=$(az account show --query id -o tsv)
    
    # Generate random suffix for globally unique names
    local random_suffix=$(generate_random_suffix)
    
    print_info "Configuration:"
    echo "  Resource Group: $resource_group"
    echo "  Location: $location"
    echo "  Environment: $environment"
    echo "  Random Suffix: $random_suffix"
    echo ""
    
    # Create resources
    create_resource_group "$resource_group" "$location"
    
    local storage_name=$(create_storage_account "$resource_group" "$location" "$random_suffix")
    local registry_name=$(create_container_registry "$resource_group" "$location" "$random_suffix")
    
    create_service_principal "$resource_group" "$subscription_id"
    create_budget "$resource_group"
    
    generate_env_file "$resource_group" "$storage_name" "$registry_name" "$location" "$subscription_id"
    
    echo ""
    echo "=========================================="
    print_success "Azure infrastructure setup completed!"
    echo "=========================================="
    echo ""
    echo "Created resources:"
    echo "  - Resource Group: $resource_group"
    echo "  - Storage Account: $storage_name"
    echo "  - Container Registry: $registry_name"
    echo "  - Service Principal: dev8-mvp-sp"
    echo ""
    echo "Next steps:"
    echo "  1. Review the generated .env.azure file"
    echo "  2. Run './scripts/azure/validate-setup.sh' to verify the setup"
    echo "  3. Refer to docs/azure-setup.md for detailed usage instructions"
    echo ""
}

# Run main function
main "$@"
