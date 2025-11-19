#!/bin/bash
# Handle errors explicitly without strict mode

################################################################################
# Dev8.dev Complete Workspace Entrypoint
# Handles SSH, code-server, AI CLIs, and workspace initialization
################################################################################

echo "🚀 Dev8.dev Complete Workspace Starting..."
echo "=================================================="

# Source common functions
source /usr/local/share/common.sh

# Configuration
export HOME=/home/dev8
export PATH="$HOME/.local/bin:$HOME/.bun/bin:$HOME/.cargo/bin:$GOPATH/bin:/usr/local/go/bin:$PATH"
export WORKSPACE_DIR="${WORKSPACE_DIR:-/workspace}"

# Ensure workspace exists
mkdir -p "$WORKSPACE_DIR"
cd "$WORKSPACE_DIR"

###############################################################################
# GitHub Copilot CLI Setup
###############################################################################
setup_copilot() {
    log_info "Setting up GitHub Copilot CLI..."
    
    # Skip if not authenticated
    if ! gh auth status >/dev/null 2>&1; then
        log_warning "GitHub CLI not authenticated - skipping Copilot setup"
        return 0
    fi
    
    # Install Copilot extension if not present
    if ! gh extension list 2>/dev/null | grep -q "github/gh-copilot"; then
        log_info "Installing GitHub Copilot CLI extension..."
        if gh extension install github/gh-copilot 2>/dev/null; then
            log_success "GitHub Copilot CLI extension installed"
        else
            log_warning "Failed to install Copilot CLI - can install manually"
            return 0
        fi
    fi
    
    # Verify
    if gh copilot --version >/dev/null 2>&1; then
        log_success "GitHub Copilot CLI is ready"
    fi
}

###############################################################################
# AI CLI Tools Setup
###############################################################################
setup_ai_clis() {
    log_info "Setting up AI CLI tools..."
    
    # Claude API
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        echo "export ANTHROPIC_API_KEY='$ANTHROPIC_API_KEY'" >> "$HOME/.bashrc"
        log_success "Claude API key configured"
    fi
    
    # OpenAI API
    if [ -n "$OPENAI_API_KEY" ]; then
        echo "export OPENAI_API_KEY='$OPENAI_API_KEY'" >> "$HOME/.bashrc"
        log_success "OpenAI API key configured"
    fi
    
    # Gemini API
    if [ -n "$GEMINI_API_KEY" ]; then
        echo "export GEMINI_API_KEY='$GEMINI_API_KEY'" >> "$HOME/.bashrc"
        log_success "Gemini API key configured"
    fi
}

###############################################################################
# Start code-server
###############################################################################
start_code_server() {
    log_info "Starting code-server (VS Code)..."
    
    mkdir -p "$HOME/.config/code-server"
    
    local AUTH_TYPE="${CODE_SERVER_AUTH:-password}"
    local PASSWORD="${CODE_SERVER_PASSWORD:-}"
    
    # Generate default password if not set and auth is password
    if [ "$AUTH_TYPE" = "password" ] && [ -z "$PASSWORD" ]; then
        PASSWORD="dev8dev"
        log_warning "CODE_SERVER_PASSWORD not set, using default: dev8dev"
    fi
    
    cat > "$HOME/.config/code-server/config.yaml" <<EOF
bind-addr: 0.0.0.0:8080
auth: ${AUTH_TYPE}
password: ${PASSWORD}
cert: false
EOF
    
    nohup code-server --bind-addr 0.0.0.0:8080 "$WORKSPACE_DIR" \
        --auth "${AUTH_TYPE}" \
        --disable-telemetry \
        --disable-update-check \
        > "$HOME/.code-server.log" 2>&1 &
    
    log_success "code-server started on http://0.0.0.0:8080"
    if [ "$AUTH_TYPE" = "password" ]; then
        log_info "Authentication: password"
        log_info "Password: ${PASSWORD}"
    elif [ "$AUTH_TYPE" = "none" ]; then
        log_warning "Authentication: DISABLED - Anyone can access!"
    fi
}

###############################################################################
# Monitor authentication
###############################################################################
monitor_auth() {
    while true; do
        sleep 300  # Check every 5 minutes
        
        if ! gh auth status >/dev/null 2>&1; then
            log_warning "GitHub CLI authentication lost - attempting refresh..."
            
            if [ -n "$GITHUB_TOKEN" ] || [ -n "$GH_TOKEN" ]; then
                local TOKEN="${GITHUB_TOKEN:-$GH_TOKEN}"
                echo "$TOKEN" | gh auth login --with-token 2>/dev/null && \
                    log_success "GitHub CLI authentication refreshed"
            fi
        fi
    done
}

###############################################################################
# Main Execution
###############################################################################
main() {
    log_info "Initializing Dev8.dev Complete Workspace..."
    
    # Execute all setup functions
    setup_ssh
    setup_github
    setup_copilot
    setup_ai_clis
    start_code_server
    SUPERVISOR_PID=$(start_supervisor)
    
    # Start background auth monitor
    monitor_auth &
    
    # Display complete info
    echo ""
    echo "=================================================="
    echo "✅ Dev8.dev Complete Workspace Ready!"
    echo "=================================================="
    echo ""
    echo "🔗 Connection Information:"
    echo "   VS Code:  http://<host>:8080"
    echo "   SSH:      ssh -p 2222 dev8@<host>"
    echo "   API:      http://<host>:9000 (supervisor)"
    echo ""
    echo "🤖 GitHub Copilot CLI:"
    echo "   gh copilot suggest 'your task'"
    echo "   gh copilot explain 'command'"
    echo ""
    echo "🧠 AI CLI Tools Available:"
    [ -n "$ANTHROPIC_API_KEY" ] && echo "   ✓ Claude API configured"
    [ -n "$OPENAI_API_KEY" ] && echo "   ✓ OpenAI API configured"
    [ -n "$GEMINI_API_KEY" ] && echo "   ✓ Gemini API configured"
    echo ""
    echo "📝 Workspace: $WORKSPACE_DIR"
    echo "=================================================="
    
    # Keep container running by waiting for all background processes
    if [ $# -eq 0 ]; then
        # Keep container alive indefinitely
        log_info "Container running - press Ctrl+C to stop"
        tail -f /dev/null
    else
        exec "$@"
    fi
}

# Run main
main "$@"
