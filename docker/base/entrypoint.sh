#!/bin/bash
set -e

###############################################################################
# DevCopilot Agent - Automated GitHub & Copilot Authentication
# Handles authentication, secret injection, and service initialization
###############################################################################

echo "🚀 DevCopilot Agent Starting..."
echo "=================================================="

# Configuration
export HOME=/home/dev8
export PATH="$HOME/.local/bin:$PATH"
export WORKSPACE_DIR="${WORKSPACE_DIR:-/workspace}"

# Ensure workspace directory exists
mkdir -p "$WORKSPACE_DIR"

###############################################################################
# 1. CHECK & INJECT SSH KEYS
###############################################################################
setup_ssh() {
    echo "🔐 Setting up SSH..."
    
    # Create .ssh directory if it doesn't exist
    mkdir -p "$HOME/.ssh"
    chmod 700 "$HOME/.ssh"
    
    if [ -n "$SSH_PUBLIC_KEY" ]; then
        printf '%s\n' "$SSH_PUBLIC_KEY" > "$HOME/.ssh/authorized_keys"
        chmod 600 "$HOME/.ssh/authorized_keys"
        echo "✅ SSH public key configured"
    else
        echo "⚠️  No SSH_PUBLIC_KEY provided - SSH access will be limited"
    fi
    
    if [ -n "$SSH_PRIVATE_KEY" ]; then
        umask 077
        printf '%s\n' "$SSH_PRIVATE_KEY" > "$HOME/.ssh/id_rsa"
        chmod 600 "$HOME/.ssh/id_rsa"
        ssh-keygen -y -f "$HOME/.ssh/id_rsa" > "$HOME/.ssh/id_rsa.pub" 2>/dev/null || true
        echo "✅ SSH private key configured"
    fi
    
    # Start SSH server
    sudo /usr/sbin/sshd -D -e &
    echo "✅ SSH server started on port 2222"
}

###############################################################################
# 2. AUTHENTICATE TO GITHUB CLI
###############################################################################
setup_github() {
    echo "🔧 Configuring GitHub CLI..."
    
    # Check for GitHub token
    if [ -n "$GITHUB_TOKEN" ] || [ -n "$GH_TOKEN" ]; then
        local TOKEN="${GITHUB_TOKEN:-$GH_TOKEN}"
        
        # Skip authentication if using test token
        if [ "$TOKEN" = "test_token" ]; then
            echo "⚠️  Test token detected - skipping GitHub authentication"
            return 0
        fi
        
        # Try to authenticate with token
        if echo "$TOKEN" | gh auth login --with-token 2>/dev/null; then
            echo "✅ GitHub CLI authenticated successfully"
            
            # Configure git with GitHub credentials
            if gh auth setup-git 2>/dev/null; then
                echo "✅ Git configured to use GitHub CLI credentials"
            fi
            
            # Set git user info if provided
            if [ -n "$GIT_USER_NAME" ]; then
                git config --global user.name "$GIT_USER_NAME"
                echo "✅ Git user.name: $GIT_USER_NAME"
            fi
            
            if [ -n "$GIT_USER_EMAIL" ]; then
                git config --global user.email "$GIT_USER_EMAIL"
                echo "✅ Git user.email: $GIT_USER_EMAIL"
            fi
        else
            echo "⚠️  GitHub CLI authentication failed - continuing without auth"
            # Set token as env var for git operations
            export GH_TOKEN="$TOKEN"
        fi
    else
        echo "⚠️  No GITHUB_TOKEN or GH_TOKEN provided"
        echo "    GitHub operations will require manual authentication"
    fi
}

###############################################################################
# 3. SETUP GITHUB COPILOT CLI
###############################################################################
setup_copilot() {
    echo "🤖 Setting up GitHub Copilot CLI..."
    
    # Skip if not authenticated to GitHub
    if ! gh auth status >/dev/null 2>&1; then
        echo "⚠️  GitHub CLI not authenticated - skipping Copilot setup"
        return 0
    fi
    
    # Check if gh copilot is available
    if ! gh extension list 2>/dev/null | grep -q "github/gh-copilot"; then
        echo "📦 Installing GitHub Copilot CLI extension..."
        if gh extension install github/gh-copilot 2>/dev/null; then
            echo "✅ GitHub Copilot CLI extension installed"
        else
            echo "⚠️  Failed to install Copilot CLI extension"
            echo "    You can install it manually: gh extension install github/gh-copilot"
            return 0
        fi
    fi
    
    # Verify Copilot CLI is working
    if gh copilot --version >/dev/null 2>&1; then
        echo "✅ GitHub Copilot CLI is ready"
        echo "    Usage: gh copilot suggest 'command description'"
        echo "    Usage: gh copilot explain 'command to explain'"
    else
        echo "⚠️  Copilot CLI may need OAuth authentication"
        echo "    Run: gh auth login --web -h github.com"
        echo "    Then: gh copilot suggest --help"
    fi
}

###############################################################################
# 4. CONFIGURE VS CODE / COPILOT INTEGRATION
###############################################################################
setup_vscode_copilot() {
    echo "💻 Configuring VS Code / Copilot integration..."
    
    mkdir -p "$HOME/.config/Code/User"
    mkdir -p "$HOME/.vscode-server/data/Machine"
    mkdir -p "$HOME/.local/share/code-server/User"
    
    # Configure VS Code to use GitHub CLI for authentication
    cat > "$HOME/.config/Code/User/settings.json" <<EOF
{
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "plaintext": true,
    "markdown": true
  },
  "github.copilot.advanced": {},
  "terminal.integrated.defaultProfile.linux": "bash",
  "terminal.integrated.profiles.linux": {
    "bash": {
      "path": "/bin/bash",
      "icon": "terminal-bash"
    }
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/dist/**": true,
    "**/build/**": true
  },
  "extensions.autoUpdate": true,
  "update.mode": "none"
}
EOF

    # Copy settings to code-server user directory as well
    cp -f "$HOME/.config/Code/User/settings.json" "$HOME/.local/share/code-server/User/settings.json"
    
    echo "✅ VS Code settings configured"
}

###############################################################################
# 5. SETUP ADDITIONAL CLI TOOLS (CLAUDE, GEMINI, ETC.)
###############################################################################
setup_ai_clis() {
    echo "🧠 Setting up AI CLI tools..."
    
    # Claude CLI (if API key provided)
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        mkdir -p "$HOME/.config/claude"
        echo "export ANTHROPIC_API_KEY='$ANTHROPIC_API_KEY'" >> "$HOME/.bashrc"
        echo "✅ Claude API key configured"
    fi
    
    # Other AI CLI tools can be added here
    if [ -n "$OPENAI_API_KEY" ]; then
        echo "export OPENAI_API_KEY='$OPENAI_API_KEY'" >> "$HOME/.bashrc"
        echo "✅ OpenAI API key configured"
    fi
}

###############################################################################
# 6. START CODE-SERVER (IF INSTALLED)
###############################################################################
start_code_server() {
    if command -v code-server >/dev/null 2>&1; then
        echo "🌐 Starting code-server..."
        
        # Configure code-server
        mkdir -p "$HOME/.config/code-server"
        cat > "$HOME/.config/code-server/config.yaml" <<EOF
bind-addr: 0.0.0.0:8080
auth: ${CODE_SERVER_AUTH:-password}
password: ${CODE_SERVER_PASSWORD:-dev8dev}
cert: false
EOF
        
        # Start code-server in background
        code-server --bind-addr 0.0.0.0:8080 "$WORKSPACE_DIR" \
            --auth "${CODE_SERVER_AUTH:-password}" \
            --disable-telemetry \
            --disable-update-check \
            > "$HOME/.code-server.log" 2>&1 &
        
        echo "✅ code-server started on http://0.0.0.0:8080"
        echo "    Password: ${CODE_SERVER_PASSWORD:-dev8dev}"
    fi
}

###############################################################################
# 7. MONITOR & REFRESH TOKENS (BACKGROUND TASK)
###############################################################################
monitor_auth() {
    while true; do
        sleep 300  # Check every 5 minutes
        
        # Check GitHub CLI auth status
        if ! gh auth status >/dev/null 2>&1; then
            echo "⚠️  GitHub CLI authentication lost - attempting refresh..."
            
            if [ -n "$GITHUB_TOKEN" ] || [ -n "$GH_TOKEN" ]; then
                local TOKEN="${GITHUB_TOKEN:-$GH_TOKEN}"
                echo "$TOKEN" | gh auth login --with-token 2>/dev/null && \
                    echo "✅ GitHub CLI authentication refreshed"
            fi
        fi
    done
}

###############################################################################
# MAIN EXECUTION
###############################################################################
main() {
    echo "=================================================="
    echo "DevCopilot Agent - Initializing Environment"
    echo "=================================================="
    
    # Execute setup functions
    setup_ssh
    setup_github
    setup_copilot
    setup_vscode_copilot
    setup_ai_clis
    start_code_server
    
    # Start background auth monitor
    monitor_auth &

    # Launch workspace supervisor daemon if available
    if command -v workspace-supervisor >/dev/null 2>&1; then
        echo "🛡️  Starting workspace supervisor daemon..."
        workspace-supervisor &
        SUPERVISOR_PID=$!
    else
        echo "⚠️  workspace-supervisor binary not found in PATH; backup and monitoring daemon disabled"
    fi
    
    echo "=================================================="
    echo "✅ DevCopilot Agent Ready!"
    echo "=================================================="
    echo ""
    echo "🔗 Connection Information:"
    echo "   SSH: ssh -p 2222 dev8@<host>"
    echo "   VS Code: http://<host>:8080"
    echo ""
    echo "🤖 GitHub Copilot Commands:"
    echo "   gh copilot suggest 'what you want to do'"
    echo "   gh copilot explain 'command to explain'"
    echo ""
    echo "📝 Workspace: $WORKSPACE_DIR"
    echo "=================================================="
    
    # Keep container running and execute command if provided
    if [ $# -eq 0 ]; then
        # No command provided, wait on supervisor daemon to keep container alive
        if [ -n "$SUPERVISOR_PID" ]; then
            wait "$SUPERVISOR_PID"
        else
            tail -f /dev/null
        fi
    else
        # Execute provided command
        exec "$@"
    fi
}

# Run main function
main "$@"
