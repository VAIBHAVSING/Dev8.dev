#!/bin/bash

# Azure Infrastructure Validation Script
# This script validates that all Azure resources are properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0
WARNINGS=0

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    FAILED=$((FAILED + 1))
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    PASSED=$((PASSED + 1))
}

print_test() {
    echo -e "${BLUE}Testing:${NC} $1"
}

# Function to check Azure CLI installation
test_azure_cli() {
    print_test "Azure CLI installation"
    
    if command -v az &> /dev/null; then
        local version=$(az version --query \"azure-cli\" -o tsv)
        print_success "Azure CLI is installed (version: $version)"
    else
        print_error "Azure CLI is not installed"
    fi
}

# Function to check Azure authentication
test_azure_auth() {
    print_test "Azure CLI authentication"
    
    if az account show &> /dev/null; then
        local subscription=$(az account show --query name -o tsv)
        print_success "Authenticated to Azure (subscription: $subscription)"
    else
        print_error "Not authenticated to Azure"
    fi
}

# Function to load environment variables
load_env_vars() {
    if [ -f "../../.env.azure" ]; then
        export $(grep -v '^#' ../../.env.azure | xargs)
        return 0
    fi
    return 1
}

# Function to check environment files
test_env_files() {
    print_test "Environment configuration files"
    
    if [ -f "../../.env.azure" ]; then
        print_success ".env.azure exists"
    else
        print_error ".env.azure not found"
    fi
    
    if [ -f "../../apps/agent/.env" ]; then
        print_success "apps/agent/.env exists"
    else
        print_warning "apps/agent/.env not found (optional)"
    fi
    
    if [ -f "../../.env.azure.example" ]; then
        print_success ".env.azure.example exists"
    else
        print_warning ".env.azure.example not found (recommended)"
    fi
}

# Function to check resource group
test_resource_group() {
    print_test "Resource group existence"
    
    if [ -z "$AZURE_RESOURCE_GROUP" ]; then
        print_error "AZURE_RESOURCE_GROUP not set in environment"
        return
    fi
    
    if az group show --name "$AZURE_RESOURCE_GROUP" &> /dev/null; then
        print_success "Resource group '$AZURE_RESOURCE_GROUP' exists"
    else
        print_error "Resource group '$AZURE_RESOURCE_GROUP' not found"
    fi
}

# Function to check storage account
test_storage_account() {
    print_test "Storage account accessibility"
    
    if [ -z "$AZURE_STORAGE_ACCOUNT" ]; then
        print_error "AZURE_STORAGE_ACCOUNT not set in environment"
        return
    fi
    
    if az storage account show --name "$AZURE_STORAGE_ACCOUNT" --resource-group "$AZURE_RESOURCE_GROUP" &> /dev/null; then
        print_success "Storage account '$AZURE_STORAGE_ACCOUNT' is accessible"
        
        # Test storage connection string
        if [ -n "$AZURE_STORAGE_CONNECTION_STRING" ]; then
            print_success "Storage connection string is configured"
        else
            print_warning "Storage connection string not set"
        fi
        
        # Test storage key
        if [ -n "$AZURE_STORAGE_KEY" ]; then
            print_success "Storage key is configured"
        else
            print_warning "Storage key not set"
        fi
    else
        print_error "Storage account '$AZURE_STORAGE_ACCOUNT' not accessible"
    fi
}

# Function to check container registry
test_container_registry() {
    print_test "Container registry accessibility"
    
    if [ -z "$AZURE_CONTAINER_REGISTRY" ]; then
        print_error "AZURE_CONTAINER_REGISTRY not set in environment"
        return
    fi
    
    if az acr show --name "$AZURE_CONTAINER_REGISTRY" --resource-group "$AZURE_RESOURCE_GROUP" &> /dev/null; then
        print_success "Container registry '$AZURE_CONTAINER_REGISTRY' is accessible"
        
        # Check if admin is enabled
        local admin_enabled=$(az acr show --name "$AZURE_CONTAINER_REGISTRY" --query adminUserEnabled -o tsv)
        if [ "$admin_enabled" = "true" ]; then
            print_success "Admin user is enabled on registry"
        else
            print_warning "Admin user is not enabled on registry"
        fi
        
        # Test registry credentials
        if [ -n "$AZURE_REGISTRY_USERNAME" ] && [ -n "$AZURE_REGISTRY_PASSWORD" ]; then
            print_success "Registry credentials are configured"
        else
            print_warning "Registry credentials not fully configured"
        fi
    else
        print_error "Container registry '$AZURE_CONTAINER_REGISTRY' not accessible"
    fi
}

# Function to check service principal
test_service_principal() {
    print_test "Service principal configuration"
    
    if [ -f "../../azure-credentials.json" ]; then
        print_success "azure-credentials.json exists"
    else
        print_warning "azure-credentials.json not found"
    fi
    
    if [ -n "$AZURE_CLIENT_ID" ] && [ -n "$AZURE_CLIENT_SECRET" ]; then
        print_success "Service principal credentials are configured"
        
        # Try to authenticate with service principal (without changing current session)
        if az login --service-principal \
            -u "$AZURE_CLIENT_ID" \
            -p "$AZURE_CLIENT_SECRET" \
            --tenant "$AZURE_TENANT_ID" \
            --allow-no-subscriptions \
            --output none 2>&1; then
            print_success "Service principal authentication successful"
            az logout --output none 2>&1
        else
            print_error "Service principal authentication failed"
        fi
    else
        print_warning "Service principal credentials not configured in environment"
    fi
}

# Function to check required environment variables
test_environment_variables() {
    print_test "Required environment variables"
    
    local required_vars=(
        "AZURE_SUBSCRIPTION_ID"
        "AZURE_TENANT_ID"
        "AZURE_RESOURCE_GROUP"
        "AZURE_STORAGE_ACCOUNT"
        "AZURE_CONTAINER_REGISTRY"
        "AZURE_REGION"
    )
    
    for var in "${required_vars[@]}"; do
        if [ -n "${!var}" ]; then
            print_success "$var is set"
        else
            print_error "$var is not set"
        fi
    done
}

# Function to check cost management
test_cost_management() {
    print_test "Cost management configuration"
    
    if [ -z "$AZURE_RESOURCE_GROUP" ]; then
        print_warning "Cannot check cost management (AZURE_RESOURCE_GROUP not set)"
        return
    fi
    
    if az consumption budget show --budget-name "dev8-mvp-budget" --resource-group "$AZURE_RESOURCE_GROUP" &> /dev/null 2>&1; then
        print_success "Cost management budget exists"
    else
        print_warning "Cost management budget not found (may require additional permissions)"
    fi
}

# Function to test storage operations
test_storage_operations() {
    print_test "Storage account operations"
    
    if [ -z "$AZURE_STORAGE_ACCOUNT" ] || [ -z "$AZURE_RESOURCE_GROUP" ]; then
        print_warning "Skipping storage operations test (missing configuration)"
        return
    fi
    
    # Try to list file shares
    if az storage share list --account-name "$AZURE_STORAGE_ACCOUNT" --connection-string "$AZURE_STORAGE_CONNECTION_STRING" --output none 2>&1; then
        print_success "Can list file shares in storage account"
    else
        print_warning "Cannot list file shares (may need proper permissions)"
    fi
}

# Function to test registry operations
test_registry_operations() {
    print_test "Container registry operations"
    
    if [ -z "$AZURE_CONTAINER_REGISTRY" ]; then
        print_warning "Skipping registry operations test (missing configuration)"
        return
    fi
    
    # Try to list repositories
    if az acr repository list --name "$AZURE_CONTAINER_REGISTRY" --output none 2>&1; then
        print_success "Can list repositories in container registry"
    else
        print_warning "Cannot list repositories (registry may be empty)"
    fi
}

# Function to print summary
print_summary() {
    echo ""
    echo "=========================================="
    echo "  Validation Summary"
    echo "=========================================="
    echo ""
    echo -e "${GREEN}Passed:${NC}   $PASSED"
    echo -e "${RED}Failed:${NC}   $FAILED"
    echo -e "${YELLOW}Warnings:${NC} $WARNINGS"
    echo ""
    
    if [ $FAILED -eq 0 ]; then
        print_success "All critical tests passed!"
        echo ""
        echo "Your Azure infrastructure is properly configured."
        echo "You can proceed with the next steps of the MVP."
        return 0
    else
        print_error "Some critical tests failed!"
        echo ""
        echo "Please review the failed tests and fix the issues."
        echo "Refer to docs/azure-troubleshooting.md for help."
        return 1
    fi
}

# Main execution
main() {
    echo "=========================================="
    echo "  Dev8.dev Azure Setup Validation"
    echo "=========================================="
    echo ""
    
    # Basic checks (don't require env vars)
    test_azure_cli
    test_azure_auth
    test_env_files
    
    echo ""
    
    # Load environment variables
    if load_env_vars; then
        print_info "Loaded environment variables from .env.azure"
    else
        print_warning "Could not load .env.azure. Some tests may fail."
    fi
    
    echo ""
    
    # Resource checks
    test_environment_variables
    echo ""
    test_resource_group
    test_storage_account
    test_container_registry
    test_service_principal
    echo ""
    
    # Optional checks
    test_cost_management
    test_storage_operations
    test_registry_operations
    
    # Print summary and exit
    echo ""
    print_summary
}

# Run main function
main "$@"
