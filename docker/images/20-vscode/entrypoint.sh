#!/bin/bash
set -e

################################################################################
# Dev8.dev VS Code Server Entrypoint
# Handles SSH, code-server, and workspace initialization
################################################################################

echo "🚀 Dev8.dev VS Code Server Starting..."
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
# Start code-server
###############################################################################
start_code_server() {
    log_info "Starting code-server (VS Code)..."
    
    # Configure code-server
    mkdir -p "$HOME/.config/code-server"
    
    local AUTH_TYPE="${CODE_SERVER_AUTH:-password}"
    local PASSWORD="${CODE_SERVER_PASSWORD:-dev8dev}"
    
    cat > "$HOME/.config/code-server/config.yaml" <<EOF
bind-addr: 0.0.0.0:8080
auth: ${AUTH_TYPE}
password: ${PASSWORD}
cert: false
EOF
    
    # Start in background
    nohup code-server --bind-addr 0.0.0.0:8080 "$WORKSPACE_DIR" \
        --auth "${AUTH_TYPE}" \
        --disable-telemetry \
        --disable-update-check \
        > "$HOME/.code-server.log" 2>&1 &
    
    log_success "code-server started on http://0.0.0.0:8080"
    if [ "$AUTH_TYPE" = "password" ]; then
        log_info "Password: ${PASSWORD}"
    fi
}

###############################################################################
# Main Execution
###############################################################################
main() {
    log_info "Initializing Dev8.dev VS Code Server..."
    
    # Execute setup functions
    setup_ssh
    setup_github
    start_code_server
    SUPERVISOR_PID=$(start_supervisor)
    
    # Display info
    echo ""
    echo "=================================================="
    echo "✅ Dev8.dev VS Code Server Ready!"
    echo "=================================================="
    echo ""
    echo "🔗 Connection Information:"
    echo "   VS Code:  http://<host>:8080"
    echo "   SSH:      ssh -p 2222 dev8@<host>"
    echo ""
    echo "📝 Workspace: $WORKSPACE_DIR"
    echo "=================================================="
    
    # Keep container running
    if [ $# -eq 0 ]; then
        if [ -n "$SUPERVISOR_PID" ] && [ "$SUPERVISOR_PID" != "0" ]; then
            wait "$SUPERVISOR_PID"
        else
            tail -f /dev/null
        fi
    else
        exec "$@"
    fi
}

# Run main
main "$@"
