#!/bin/bash

# Azure Credentials Configuration Script
# This script helps configure service principal credentials for the Go backend

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Function to check if credentials file exists
check_credentials_file() {
    local credentials_file="../../azure-credentials.json"
    
    if [ ! -f "$credentials_file" ]; then
        print_error "azure-credentials.json not found!"
        print_info "Please run setup-infrastructure.sh first or manually create a service principal."
        exit 1
    fi
    
    print_success "Found azure-credentials.json"
}

# Function to extract credentials from azure-credentials.json
extract_credentials() {
    local credentials_file="../../azure-credentials.json"
    
    print_info "Extracting credentials from azure-credentials.json..."
    
    # Extract values using jq or python
    if command -v jq &> /dev/null; then
        export AZURE_CLIENT_ID=$(jq -r '.clientId' "$credentials_file")
        export AZURE_CLIENT_SECRET=$(jq -r '.clientSecret' "$credentials_file")
        export AZURE_TENANT_ID=$(jq -r '.tenantId' "$credentials_file")
        export AZURE_SUBSCRIPTION_ID=$(jq -r '.subscriptionId' "$credentials_file")
    elif command -v python3 &> /dev/null; then
        export AZURE_CLIENT_ID=$(python3 -c "import json; print(json.load(open('$credentials_file'))['clientId'])")
        export AZURE_CLIENT_SECRET=$(python3 -c "import json; print(json.load(open('$credentials_file'))['clientSecret'])")
        export AZURE_TENANT_ID=$(python3 -c "import json; print(json.load(open('$credentials_file'))['tenantId'])")
        export AZURE_SUBSCRIPTION_ID=$(python3 -c "import json; print(json.load(open('$credentials_file'))['subscriptionId'])")
    else
        print_error "Neither jq nor python3 found. Please install one of them to extract credentials."
        exit 1
    fi
    
    print_success "Credentials extracted successfully"
}

# Function to update .env files with service principal credentials
update_env_files() {
    print_info "Updating .env files with service principal credentials..."
    
    # Update .env.azure if it exists
    if [ -f "../../.env.azure" ]; then
        # Add or update AZURE_CLIENT_ID
        if grep -q "AZURE_CLIENT_ID=" ../../.env.azure; then
            sed -i "s/^AZURE_CLIENT_ID=.*/AZURE_CLIENT_ID=${AZURE_CLIENT_ID}/" ../../.env.azure
        else
            echo "AZURE_CLIENT_ID=${AZURE_CLIENT_ID}" >> ../../.env.azure
        fi
        
        # Add or update AZURE_CLIENT_SECRET
        if grep -q "AZURE_CLIENT_SECRET=" ../../.env.azure; then
            sed -i "s/^AZURE_CLIENT_SECRET=.*/AZURE_CLIENT_SECRET=${AZURE_CLIENT_SECRET}/" ../../.env.azure
        else
            echo "AZURE_CLIENT_SECRET=${AZURE_CLIENT_SECRET}" >> ../../.env.azure
        fi
        
        print_success "Updated .env.azure"
    else
        print_warning ".env.azure not found. Skipping."
    fi
    
    # Update apps/agent/.env if it exists
    if [ -f "../../apps/agent/.env" ]; then
        # Add or update AZURE_CLIENT_ID
        if grep -q "AZURE_CLIENT_ID=" ../../apps/agent/.env; then
            sed -i "s/^AZURE_CLIENT_ID=.*/AZURE_CLIENT_ID=${AZURE_CLIENT_ID}/" ../../apps/agent/.env
        else
            echo "AZURE_CLIENT_ID=${AZURE_CLIENT_ID}" >> ../../apps/agent/.env
        fi
        
        # Add or update AZURE_CLIENT_SECRET
        if grep -q "AZURE_CLIENT_SECRET=" ../../apps/agent/.env; then
            sed -i "s/^AZURE_CLIENT_SECRET=.*/AZURE_CLIENT_SECRET=${AZURE_CLIENT_SECRET}/" ../../apps/agent/.env
        else
            echo "AZURE_CLIENT_SECRET=${AZURE_CLIENT_SECRET}" >> ../../apps/agent/.env
        fi
        
        print_success "Updated apps/agent/.env"
    else
        print_warning "apps/agent/.env not found. Skipping."
    fi
}

# Function to test credentials
test_credentials() {
    print_info "Testing service principal credentials..."
    
    # Login using service principal
    if az login --service-principal \
        -u "$AZURE_CLIENT_ID" \
        -p "$AZURE_CLIENT_SECRET" \
        --tenant "$AZURE_TENANT_ID" \
        --output none 2>&1; then
        print_success "Service principal authentication successful!"
        
        # Set the subscription
        az account set --subscription "$AZURE_SUBSCRIPTION_ID"
        
        # Test access to resources
        print_info "Testing access to Azure resources..."
        local resource_group=$(grep "AZURE_RESOURCE_GROUP=" ../../.env.azure 2>/dev/null | cut -d'=' -f2)
        
        if [ -n "$resource_group" ]; then
            if az group show --name "$resource_group" --output none 2>&1; then
                print_success "Successfully accessed resource group: $resource_group"
            else
                print_warning "Could not access resource group: $resource_group"
            fi
        fi
        
        # Logout to avoid confusion
        az logout --output none 2>&1
        print_info "Logged out from Azure CLI (service principal session)"
    else
        print_error "Service principal authentication failed!"
        print_info "Please verify the credentials in azure-credentials.json"
        exit 1
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "  Azure Credentials Configuration"
    echo "=========================================="
    echo ""
    
    check_credentials_file
    extract_credentials
    update_env_files
    test_credentials
    
    echo ""
    echo "=========================================="
    print_success "Credentials configured successfully!"
    echo "=========================================="
    echo ""
    echo "Service Principal Details:"
    echo "  Client ID: $AZURE_CLIENT_ID"
    echo "  Tenant ID: $AZURE_TENANT_ID"
    echo "  Subscription ID: $AZURE_SUBSCRIPTION_ID"
    echo ""
    echo "The credentials have been added to your .env files."
    echo "You can now use these credentials in your Go backend."
    echo ""
}

# Run main function
main "$@"
