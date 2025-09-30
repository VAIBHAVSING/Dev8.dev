#!/bin/bash

# Azure Resource Cleanup Script
# This script deletes all Azure resources created for Dev8.dev MVP
# USE WITH CAUTION - This will delete all resources!

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

# Default configuration
DEFAULT_RESOURCE_GROUP="dev8-mvp-rg"

# Function to check if Azure CLI is installed
check_azure_cli() {
    if ! command -v az &> /dev/null; then
        print_error "Azure CLI is not installed."
        exit 1
    fi
}

# Function to check if user is logged in
check_azure_login() {
    if ! az account show &> /dev/null; then
        print_error "Not logged in to Azure. Please run 'az login' first."
        exit 1
    fi
}

# Function to confirm deletion
confirm_deletion() {
    local resource_group=$1
    
    echo ""
    print_warning "WARNING: This will DELETE the following:"
    echo "  - Resource Group: $resource_group"
    echo "  - All resources within the resource group:"
    echo "    * Storage Account"
    echo "    * Container Registry"
    echo "    * Any Container Instances"
    echo "    * Cost Management Budgets"
    echo "  - Service Principal (if exists)"
    echo ""
    print_warning "This action CANNOT be undone!"
    echo ""
    
    read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation
    
    if [ "$confirmation" != "yes" ]; then
        print_info "Cleanup cancelled."
        exit 0
    fi
}

# Function to delete service principal
delete_service_principal() {
    local sp_name="dev8-mvp-sp"
    
    print_info "Checking for service principal '$sp_name'..."
    
    local app_id=$(az ad sp list --display-name "$sp_name" --query "[0].appId" -o tsv)
    
    if [ -n "$app_id" ]; then
        print_info "Deleting service principal '$sp_name' (App ID: $app_id)..."
        az ad sp delete --id "$app_id" --output none
        print_success "Service principal deleted"
    else
        print_info "Service principal '$sp_name' not found. Skipping."
    fi
}

# Function to delete resource group
delete_resource_group() {
    local resource_group=$1
    
    print_info "Checking if resource group '$resource_group' exists..."
    
    if ! az group show --name "$resource_group" &> /dev/null; then
        print_info "Resource group '$resource_group' does not exist. Nothing to delete."
        return 0
    fi
    
    print_info "Deleting resource group '$resource_group' (this may take several minutes)..."
    az group delete --name "$resource_group" --yes --no-wait --output none
    
    print_success "Resource group deletion initiated"
    print_info "Deletion is running in the background. Check Azure Portal for status."
}

# Function to clean up local files
cleanup_local_files() {
    print_info "Cleaning up local configuration files..."
    
    local files_to_remove=(
        "../../azure-credentials.json"
        "../../.env.azure"
        "../../apps/agent/.env"
    )
    
    for file in "${files_to_remove[@]}"; do
        if [ -f "$file" ]; then
            print_info "Removing $file..."
            rm -f "$file"
        fi
    done
    
    print_success "Local configuration files cleaned up"
}

# Function to wait for resource group deletion
wait_for_deletion() {
    local resource_group=$1
    local max_wait=300  # 5 minutes
    local elapsed=0
    
    print_info "Waiting for resource group deletion to complete..."
    print_info "(This can take several minutes. You can press Ctrl+C to stop waiting.)"
    
    while az group show --name "$resource_group" &> /dev/null; do
        if [ $elapsed -ge $max_wait ]; then
            print_warning "Deletion is taking longer than expected."
            print_info "The deletion is still in progress. Check Azure Portal for status."
            return 1
        fi
        
        echo -n "."
        sleep 10
        elapsed=$((elapsed + 10))
    done
    
    echo ""
    print_success "Resource group deletion completed"
}

# Main execution
main() {
    echo "=========================================="
    echo "  Dev8.dev Azure Resource Cleanup"
    echo "=========================================="
    echo ""
    
    # Parse command line arguments
    local resource_group="${1:-$DEFAULT_RESOURCE_GROUP}"
    local skip_confirmation="${2:-false}"
    local wait_for_completion="${3:-false}"
    
    # Pre-flight checks
    check_azure_cli
    check_azure_login
    
    # Confirm deletion unless explicitly skipped
    if [ "$skip_confirmation" != "--yes" ]; then
        confirm_deletion "$resource_group"
    fi
    
    echo ""
    print_info "Starting cleanup process..."
    echo ""
    
    # Delete resources
    delete_service_principal
    delete_resource_group "$resource_group"
    
    # Wait for deletion if requested
    if [ "$wait_for_completion" = "--wait" ]; then
        wait_for_deletion "$resource_group"
    fi
    
    # Clean up local files
    cleanup_local_files
    
    echo ""
    echo "=========================================="
    print_success "Cleanup completed!"
    echo "=========================================="
    echo ""
    
    if [ "$wait_for_completion" != "--wait" ]; then
        print_info "Resource deletion is running in the background."
        print_info "Check the Azure Portal to verify completion."
        echo ""
        print_info "To wait for deletion to complete, run:"
        echo "  ./scripts/azure/cleanup-resources.sh $resource_group --yes --wait"
    fi
    
    echo ""
}

# Run main function
main "$@"
