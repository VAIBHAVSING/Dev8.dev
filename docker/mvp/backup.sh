#!/bin/bash
###############################################################################
# Dev8.dev Workspace Backup Script
# Supports local snapshots, AWS S3, and Azure Blob Storage
###############################################################################

set -e

# Configuration
WORKSPACE_DIR="${WORKSPACE_DIR:-/workspace}"
BACKUP_DIR="${BACKUP_DIR:-/home/dev8/.backups}"
BACKUP_NAME="workspace-$(date +%Y%m%d-%H%M%S).tar.gz"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

###############################################################################
# Local Backup
###############################################################################
backup_local() {
    log_info "Creating local backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    # Create compressed archive
    tar -czf "$BACKUP_DIR/$BACKUP_NAME" \
        --exclude='node_modules' \
        --exclude='.next' \
        --exclude='__pycache__' \
        --exclude='.pytest_cache' \
        --exclude='target' \
        --exclude='dist' \
        --exclude='build' \
        -C "$(dirname "$WORKSPACE_DIR")" \
        "$(basename "$WORKSPACE_DIR")"
    
    local size=$(du -h "$BACKUP_DIR/$BACKUP_NAME" | cut -f1)
    log_success "Local backup created: $BACKUP_NAME ($size)"
    
    # Cleanup old backups
    find "$BACKUP_DIR" -name "workspace-*.tar.gz" -mtime +${RETENTION_DAYS} -delete
    log_info "Cleaned up backups older than ${RETENTION_DAYS} days"
}

###############################################################################
# AWS S3 Backup
###############################################################################
backup_to_s3() {
    log_info "Uploading backup to AWS S3..."
    
    if [ -z "$AWS_S3_BUCKET" ]; then
        log_error "AWS_S3_BUCKET not set"
        return 1
    fi
    
    local s3_path="s3://${AWS_S3_BUCKET}/${AWS_S3_PREFIX:-backups}/${BACKUP_NAME}"
    
    aws s3 cp "$BACKUP_DIR/$BACKUP_NAME" "$s3_path" \
        --storage-class STANDARD_IA \
        ${AWS_S3_EXTRA_ARGS}
    
    log_success "Backup uploaded to S3: $s3_path"
    
    # Cleanup old S3 backups
    if [ -n "$RETENTION_DAYS" ]; then
        log_info "Cleaning up old S3 backups..."
        local cutoff_date=$(date -d "${RETENTION_DAYS} days ago" +%Y%m%d)
        aws s3 ls "s3://${AWS_S3_BUCKET}/${AWS_S3_PREFIX:-backups}/" | \
        while read -r line; do
            local file=$(echo "$line" | awk '{print $4}')
            if [[ $file =~ workspace-([0-9]{8}) ]]; then
                local file_date="${BASH_REMATCH[1]}"
                if [ "$file_date" -lt "$cutoff_date" ]; then
                    aws s3 rm "s3://${AWS_S3_BUCKET}/${AWS_S3_PREFIX:-backups}/$file"
                    log_info "Deleted old backup: $file"
                fi
            fi
        done
    fi
}

###############################################################################
# Azure Blob Storage Backup
###############################################################################
backup_to_azure() {
    log_info "Uploading backup to Azure Blob Storage..."
    
    if [ -z "$AZURE_STORAGE_ACCOUNT" ] || [ -z "$AZURE_STORAGE_CONTAINER" ]; then
        log_error "AZURE_STORAGE_ACCOUNT or AZURE_STORAGE_CONTAINER not set"
        return 1
    fi
    
    local blob_path="${AZURE_BLOB_PREFIX:-backups}/${BACKUP_NAME}"
    
    az storage blob upload \
        --account-name "$AZURE_STORAGE_ACCOUNT" \
        --container-name "$AZURE_STORAGE_CONTAINER" \
        --name "$blob_path" \
        --file "$BACKUP_DIR/$BACKUP_NAME" \
        --tier Cool \
        ${AZURE_EXTRA_ARGS}
    
    log_success "Backup uploaded to Azure: $blob_path"
    
    # Cleanup old Azure backups
    if [ -n "$RETENTION_DAYS" ]; then
        log_info "Cleaning up old Azure backups..."
        local cutoff=$(date -d "${RETENTION_DAYS} days ago" -u +"%Y-%m-%dT%H:%M:%SZ")
        az storage blob list \
            --account-name "$AZURE_STORAGE_ACCOUNT" \
            --container-name "$AZURE_STORAGE_CONTAINER" \
            --prefix "${AZURE_BLOB_PREFIX:-backups}/" \
            --query "[?properties.creationTime<'$cutoff'].name" -o tsv | \
        while read -r blob; do
            az storage blob delete \
                --account-name "$AZURE_STORAGE_ACCOUNT" \
                --container-name "$AZURE_STORAGE_CONTAINER" \
                --name "$blob"
            log_info "Deleted old backup: $blob"
        done
    fi
}

###############################################################################
# Restore Functions
###############################################################################
restore_local() {
    local backup_file="${1:-$(ls -t "$BACKUP_DIR"/workspace-*.tar.gz | head -1)}"
    
    if [ ! -f "$backup_file" ]; then
        log_error "Backup file not found: $backup_file"
        return 1
    fi
    
    log_info "Restoring from: $backup_file"
    log_warning "This will overwrite existing workspace files!"
    
    tar -xzf "$backup_file" -C "$(dirname "$WORKSPACE_DIR")"
    log_success "Workspace restored successfully"
}

restore_from_s3() {
    local backup_name="${1}"
    
    if [ -z "$backup_name" ]; then
        log_error "Backup name required. List available backups with: list_s3_backups"
        return 1
    fi
    
    local s3_path="s3://${AWS_S3_BUCKET}/${AWS_S3_PREFIX:-backups}/${backup_name}"
    local temp_file="$BACKUP_DIR/restore-temp.tar.gz"
    
    log_info "Downloading from S3: $s3_path"
    aws s3 cp "$s3_path" "$temp_file"
    
    restore_local "$temp_file"
    rm -f "$temp_file"
}

restore_from_azure() {
    local backup_name="${1}"
    
    if [ -z "$backup_name" ]; then
        log_error "Backup name required. List available backups with: list_azure_backups"
        return 1
    fi
    
    local blob_path="${AZURE_BLOB_PREFIX:-backups}/${backup_name}"
    local temp_file="$BACKUP_DIR/restore-temp.tar.gz"
    
    log_info "Downloading from Azure: $blob_path"
    az storage blob download \
        --account-name "$AZURE_STORAGE_ACCOUNT" \
        --container-name "$AZURE_STORAGE_CONTAINER" \
        --name "$blob_path" \
        --file "$temp_file"
    
    restore_local "$temp_file"
    rm -f "$temp_file"
}

###############################################################################
# List Functions
###############################################################################
list_local_backups() {
    log_info "Local backups in $BACKUP_DIR:"
    ls -lh "$BACKUP_DIR"/workspace-*.tar.gz 2>/dev/null || log_warning "No local backups found"
}

list_s3_backups() {
    log_info "S3 backups in s3://${AWS_S3_BUCKET}/${AWS_S3_PREFIX:-backups}/:"
    aws s3 ls "s3://${AWS_S3_BUCKET}/${AWS_S3_PREFIX:-backups}/" | grep "workspace-"
}

list_azure_backups() {
    log_info "Azure backups in ${AZURE_STORAGE_CONTAINER}/${AZURE_BLOB_PREFIX:-backups}/:"
    az storage blob list \
        --account-name "$AZURE_STORAGE_ACCOUNT" \
        --container-name "$AZURE_STORAGE_CONTAINER" \
        --prefix "${AZURE_BLOB_PREFIX:-backups}/" \
        --query "[].{Name:name, Size:properties.contentLength, Modified:properties.lastModified}" \
        --output table
}

###############################################################################
# Main Execution
###############################################################################
main() {
    local command="${1:-backup}"
    
    case "$command" in
        backup)
            backup_local
            [ -n "$AWS_S3_BUCKET" ] && backup_to_s3
            [ -n "$AZURE_STORAGE_ACCOUNT" ] && backup_to_azure
            ;;
        backup-local)
            backup_local
            ;;
        backup-s3)
            backup_local && backup_to_s3
            ;;
        backup-azure)
            backup_local && backup_to_azure
            ;;
        restore)
            restore_local "${2}"
            ;;
        restore-s3)
            restore_from_s3 "${2}"
            ;;
        restore-azure)
            restore_from_azure "${2}"
            ;;
        list)
            list_local_backups
            ;;
        list-s3)
            list_s3_backups
            ;;
        list-azure)
            list_azure_backups
            ;;
        *)
            echo "Usage: $0 {backup|backup-local|backup-s3|backup-azure|restore|restore-s3|restore-azure|list|list-s3|list-azure} [backup-name]"
            echo ""
            echo "Commands:"
            echo "  backup         - Create local backup and upload to configured storage"
            echo "  backup-local   - Create local backup only"
            echo "  backup-s3      - Create local backup and upload to S3"
            echo "  backup-azure   - Create local backup and upload to Azure"
            echo "  restore        - Restore from local backup"
            echo "  restore-s3     - Restore from S3 backup"
            echo "  restore-azure  - Restore from Azure backup"
            echo "  list           - List local backups"
            echo "  list-s3        - List S3 backups"
            echo "  list-azure     - List Azure backups"
            exit 1
            ;;
    esac
}

main "$@"
