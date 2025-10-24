#!/bin/bash
################################################################################
# Dev8.dev Common Functions
# Shared functions used across all entrypoint scripts
################################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

################################################################################
# SSH Setup
################################################################################
setup_ssh() {
    log_info "Setting up SSH..."
    
    mkdir -p "$HOME/.ssh"
    chmod 700 "$HOME/.ssh"
    
    # Set user password for SSH if provided
    if [ -n "$SSH_PASSWORD" ]; then
        echo "dev8:$SSH_PASSWORD" | sudo chpasswd
        log_success "SSH password authentication configured"
    fi
    
    # Configure SSH public key if provided
    if [ -n "$SSH_PUBLIC_KEY" ]; then
        printf '%s\n' "$SSH_PUBLIC_KEY" > "$HOME/.ssh/authorized_keys"
        chmod 600 "$HOME/.ssh/authorized_keys"
        log_success "SSH public key configured"
    fi
    
    # Configure SSH private key if provided (optional)
    if [ -n "$SSH_PRIVATE_KEY" ]; then
        umask 077
        printf '%s\n' "$SSH_PRIVATE_KEY" > "$HOME/.ssh/id_rsa"
        chmod 600 "$HOME/.ssh/id_rsa"
        ssh-keygen -y -f "$HOME/.ssh/id_rsa" > "$HOME/.ssh/id_rsa.pub" 2>/dev/null || true
        log_success "SSH private key configured"
    fi
    
    # Configure sshd to allow password authentication if SSH_PASSWORD is set
    if [ -n "$SSH_PASSWORD" ]; then
        sudo sed -i 's/^#*PasswordAuthentication.*/PasswordAuthentication yes/' /etc/ssh/sshd_config
        log_info "Enabled password authentication in sshd_config"
    fi
    
    # Start SSH server
    sudo /usr/sbin/sshd -D -e &
    log_success "SSH server started on port 2222"
    
    # Show access info
    if [ -n "$SSH_PASSWORD" ]; then
        log_info "SSH login: ssh -p 2222 dev8@<host>"
    elif [ -n "$SSH_PUBLIC_KEY" ]; then
        log_info "SSH login: ssh -p 2222 -i <private-key> dev8@<host>"
    else
        log_warning "No SSH_PASSWORD or SSH_PUBLIC_KEY provided - SSH access disabled"
    fi
}

################################################################################
# GitHub CLI Authentication
################################################################################
setup_github() {
    log_info "Configuring GitHub CLI..."
    
    if [ -n "$GITHUB_TOKEN" ] || [ -n "$GH_TOKEN" ]; then
        local TOKEN="${GITHUB_TOKEN:-$GH_TOKEN}"
        
        # Skip test tokens
        if [ "$TOKEN" = "test_token" ]; then
            log_warning "Test token detected - skipping GitHub authentication"
            return 0
        fi
        
        # Authenticate
        if echo "$TOKEN" | gh auth login --with-token 2>/dev/null; then
            log_success "GitHub CLI authenticated"
            
            # Configure git
            gh auth setup-git 2>/dev/null && log_success "Git configured with GitHub CLI"
            
            # Set git user info
            [ -n "$GIT_USER_NAME" ] && git config --global user.name "$GIT_USER_NAME" && log_info "Git user.name: $GIT_USER_NAME"
            [ -n "$GIT_USER_EMAIL" ] && git config --global user.email "$GIT_USER_EMAIL" && log_info "Git user.email: $GIT_USER_EMAIL"
        else
            log_warning "GitHub CLI authentication failed"
            export GH_TOKEN="$TOKEN"
        fi
    else
        log_warning "No GITHUB_TOKEN provided"
    fi
}

################################################################################
# Workspace Supervisor
################################################################################
start_supervisor() {
    if command -v workspace-supervisor >/dev/null 2>&1; then
        log_info "Starting workspace supervisor..."
        
        # Configure supervisor environment
        export WORKSPACE_BACKUP_ENABLED="${WORKSPACE_BACKUP_ENABLED:-false}"
        export WORKSPACE_BACKUP_INTERVAL="${WORKSPACE_BACKUP_INTERVAL:-3600}"
        export AZURE_STORAGE_ACCOUNT="${AZURE_STORAGE_ACCOUNT:-}"
        export AZURE_STORAGE_KEY="${AZURE_STORAGE_KEY:-}"
        
        # Start in background
        nohup workspace-supervisor > "$HOME/.supervisor.log" 2>&1 &
        local SUPERVISOR_PID=$!
        log_success "Workspace supervisor started (PID: $SUPERVISOR_PID)"
        log_info "Supervisor API: http://localhost:9000"
        echo $SUPERVISOR_PID
    else
        log_warning "workspace-supervisor not found"
        echo 0
    fi
}

################################################################################
# Display System Info
################################################################################
display_info() {
    echo ""
    echo "=================================================="
    echo "✅ Dev8.dev Workspace Ready!"
    echo "=================================================="
    echo ""
    echo "📝 Workspace: $WORKSPACE_DIR"
    echo "🏠 Home: $HOME"
    echo ""
}

# Export functions
export -f log_info log_success log_warning log_error
export -f setup_ssh setup_github start_supervisor display_info
