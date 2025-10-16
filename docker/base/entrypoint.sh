#!/bin/bash
set -e

###############################################################################
# Dev8.dev Workspace Agent - Automated Setup & AI Integration
# Handles authentication, secret injection, AI agents, and service initialization
# Production-ready with supervisor monitoring and persistent storage
###############################################################################

echo "🚀 Dev8.dev Workspace Agent Starting..."
echo "=================================================="

# Configuration
export HOME=/home/dev8
export PATH="$HOME/.local/bin:$HOME/.cargo/bin:$HOME/.bun/bin:$HOME/go/bin:$PATH"
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
# 4. SETUP CLAUDE CLI (Anthropic)
###############################################################################
setup_claude() {
    echo "🧠 Setting up Claude CLI..."
    
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        mkdir -p "$HOME/.config/claude"
        cat > "$HOME/.config/claude/config.json" <<EOF
{
  "api_key": "$ANTHROPIC_API_KEY",
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 4096
}
EOF
        chmod 600 "$HOME/.config/claude/config.json"
        
        # Create helper script for Claude CLI
        cat > "$HOME/.local/bin/claude" <<'CLAUDE_SCRIPT'
#!/bin/bash
# Claude CLI wrapper
CONFIG_FILE="$HOME/.config/claude/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Claude config not found at $CONFIG_FILE"
    exit 1
fi

API_KEY=$(jq -r '.api_key' "$CONFIG_FILE")
MODEL=$(jq -r '.model // "claude-3-5-sonnet-20241022"' "$CONFIG_FILE")
MAX_TOKENS=$(jq -r '.max_tokens // 4096' "$CONFIG_FILE")

PROMPT="$*"
if [ -z "$PROMPT" ]; then
    echo "Usage: claude <your question or prompt>"
    exit 1
fi

curl -s https://api.anthropic.com/v1/messages \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -H "content-type: application/json" \
    -d "{
        \"model\": \"$MODEL\",
        \"max_tokens\": $MAX_TOKENS,
        \"messages\": [{\"role\": \"user\", \"content\": \"$PROMPT\"}]
    }" | jq -r '.content[0].text'
CLAUDE_SCRIPT
        chmod +x "$HOME/.local/bin/claude"
        
        echo "✅ Claude CLI configured"
        echo "    Usage: claude 'your question here'"
    else
        echo "⚠️  ANTHROPIC_API_KEY not provided - Claude CLI unavailable"
        echo "    Set ANTHROPIC_API_KEY environment variable to enable"
    fi
}

###############################################################################
# 5. SETUP GEMINI CLI (Google)
###############################################################################
setup_gemini() {
    echo "💎 Setting up Gemini CLI..."
    
    if [ -n "$GOOGLE_API_KEY" ] || [ -n "$GEMINI_API_KEY" ]; then
        local API_KEY="${GOOGLE_API_KEY:-$GEMINI_API_KEY}"
        
        mkdir -p "$HOME/.config/gemini"
        cat > "$HOME/.config/gemini/config.json" <<EOF
{
  "api_key": "$API_KEY",
  "model": "gemini-pro"
}
EOF
        chmod 600 "$HOME/.config/gemini/config.json"
        
        # Create helper script for Gemini CLI
        cat > "$HOME/.local/bin/gemini" <<'GEMINI_SCRIPT'
#!/bin/bash
# Gemini CLI wrapper
CONFIG_FILE="$HOME/.config/gemini/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: Gemini config not found at $CONFIG_FILE"
    exit 1
fi

API_KEY=$(jq -r '.api_key' "$CONFIG_FILE")
MODEL=$(jq -r '.model // "gemini-pro"' "$CONFIG_FILE")

PROMPT="$*"
if [ -z "$PROMPT" ]; then
    echo "Usage: gemini <your question or prompt>"
    exit 1
fi

curl -s "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{\"contents\": [{\"parts\": [{\"text\": \"$PROMPT\"}]}]}" | \
    jq -r '.candidates[0].content.parts[0].text'
GEMINI_SCRIPT
        chmod +x "$HOME/.local/bin/gemini"
        
        echo "✅ Gemini CLI configured"
        echo "    Usage: gemini 'your question here'"
    else
        echo "⚠️  GOOGLE_API_KEY or GEMINI_API_KEY not provided - Gemini CLI unavailable"
        echo "    Set GOOGLE_API_KEY environment variable to enable"
    fi
}

###############################################################################
# 6. SETUP OPENAI/CODEX CLI
###############################################################################
setup_openai() {
    echo "🔮 Setting up OpenAI CLI..."
    
    if [ -n "$OPENAI_API_KEY" ]; then
        mkdir -p "$HOME/.config/openai"
        cat > "$HOME/.config/openai/config.json" <<EOF
{
  "api_key": "$OPENAI_API_KEY",
  "model": "gpt-4",
  "max_tokens": 2048
}
EOF
        chmod 600 "$HOME/.config/openai/config.json"
        
        # Create helper script for OpenAI CLI
        cat > "$HOME/.local/bin/gpt" <<'OPENAI_SCRIPT'
#!/bin/bash
# OpenAI CLI wrapper
CONFIG_FILE="$HOME/.config/openai/config.json"
if [ ! -f "$CONFIG_FILE" ]; then
    echo "Error: OpenAI config not found at $CONFIG_FILE"
    exit 1
fi

API_KEY=$(jq -r '.api_key' "$CONFIG_FILE")
MODEL=$(jq -r '.model // "gpt-4"' "$CONFIG_FILE")
MAX_TOKENS=$(jq -r '.max_tokens // 2048' "$CONFIG_FILE")

PROMPT="$*"
if [ -z "$PROMPT" ]; then
    echo "Usage: gpt <your question or prompt>"
    exit 1
fi

curl -s https://api.openai.com/v1/chat/completions \
    -H "Authorization: Bearer $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
        \"model\": \"$MODEL\",
        \"messages\": [{\"role\": \"user\", \"content\": \"$PROMPT\"}],
        \"max_tokens\": $MAX_TOKENS
    }" | jq -r '.choices[0].message.content'
OPENAI_SCRIPT
        chmod +x "$HOME/.local/bin/gpt"
        
        echo "✅ OpenAI CLI configured"
        echo "    Usage: gpt 'your question here'"
    else
        echo "⚠️  OPENAI_API_KEY not provided - OpenAI CLI unavailable"
        echo "    Set OPENAI_API_KEY environment variable to enable"
    fi
}

###############################################################################
# 7. CONFIGURE VS CODE / COPILOT INTEGRATION
###############################################################################
setup_vscode_copilot() {
    echo "💻 Configuring VS Code / AI integration..."
    
    mkdir -p "$HOME/.config/Code/User"
    mkdir -p "$HOME/.vscode-server/data/Machine"
    mkdir -p "$HOME/.local/share/code-server/User"
    
    # Configure VS Code with AI enhancements
    cat > "$HOME/.config/Code/User/settings.json" <<EOF
{
  "github.copilot.enable": {
    "*": true,
    "yaml": true,
    "plaintext": true,
    "markdown": true,
    "javascript": true,
    "typescript": true,
    "python": true,
    "go": true,
    "rust": true
  },
  "github.copilot.inlineSuggest.enable": true,
  "github.copilot.advanced": {},
  "editor.inlineSuggest.enabled": true,
  "editor.quickSuggestions": {
    "other": true,
    "comments": true,
    "strings": true
  },
  "terminal.integrated.defaultProfile.linux": "bash",
  "terminal.integrated.profiles.linux": {
    "bash": {
      "path": "/bin/bash",
      "icon": "terminal-bash"
    },
    "zsh": {
      "path": "/bin/zsh"
    }
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/objects/**": true,
    "**/.git/subtree-cache/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/__pycache__/**": true,
    "**/target/**": true
  },
  "extensions.autoUpdate": true,
  "update.mode": "none",
  "telemetry.telemetryLevel": "off"
}
EOF

    # Copy settings to code-server user directory as well
    cp -f "$HOME/.config/Code/User/settings.json" "$HOME/.local/share/code-server/User/settings.json"
    
    echo "✅ VS Code settings configured"
}

###############################################################################
# 8. SETUP ADDITIONAL CLI TOOLS (Enhanced)
###############################################################################
setup_ai_clis() {
    echo "🧠 Setting up AI CLI tools environment..."
    
    # Export API keys to environment
    if [ -n "$ANTHROPIC_API_KEY" ]; then
        echo "export ANTHROPIC_API_KEY='$ANTHROPIC_API_KEY'" >> "$HOME/.bashrc"
        echo "✅ Anthropic API key exported"
    fi
    
    if [ -n "$OPENAI_API_KEY" ]; then
        echo "export OPENAI_API_KEY='$OPENAI_API_KEY'" >> "$HOME/.bashrc"
        echo "✅ OpenAI API key exported"
    fi
    
    if [ -n "$GOOGLE_API_KEY" ]; then
        echo "export GOOGLE_API_KEY='$GOOGLE_API_KEY'" >> "$HOME/.bashrc"
        echo "✅ Google API key exported"
    fi
    
    if [ -n "$GEMINI_API_KEY" ]; then
        echo "export GEMINI_API_KEY='$GEMINI_API_KEY'" >> "$HOME/.bashrc"
        echo "✅ Gemini API key exported"
    fi
    
    # Add AI CLI aliases to bashrc
    cat >> "$HOME/.bashrc" <<'BASHRC_AI'

# AI Agent CLI Aliases
alias copilot='gh copilot suggest'
alias explain='gh copilot explain'
alias ai-claude='claude'
alias ai-gemini='gemini'
alias ai-gpt='gpt'

# Helper function to list available AI tools
ai-tools() {
    echo "🤖 Available AI Tools:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    command -v gh >/dev/null && gh auth status >/dev/null 2>&1 && echo "✅ GitHub Copilot: gh copilot suggest/explain"
    [ -f "$HOME/.local/bin/claude" ] && echo "✅ Claude CLI: claude <prompt>"
    [ -f "$HOME/.local/bin/gemini" ] && echo "✅ Gemini CLI: gemini <prompt>"
    [ -f "$HOME/.local/bin/gpt" ] && echo "✅ OpenAI/GPT: gpt <prompt>"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}
BASHRC_AI
}

###############################################################################
# 9. START CODE-SERVER (IF INSTALLED)
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
disable-telemetry: true
disable-update-check: true
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
# 10. MONITOR & REFRESH TOKENS (BACKGROUND TASK)
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
    echo "Dev8.dev Workspace Agent - Initializing Environment"
    echo "=================================================="
    
    # Execute setup functions
    setup_ssh
    setup_github
    setup_copilot
    setup_claude
    setup_gemini
    setup_openai
    setup_vscode_copilot
    setup_ai_clis
    start_code_server
    
    # Start background auth monitor
    monitor_auth &

    # Launch workspace supervisor daemon if available
    if command -v workspace-supervisor >/dev/null 2>&1; then
        echo "🛡️  Starting workspace supervisor daemon..."
        
        # Set supervisor environment variables if not already set
        export SUPERVISOR_MONITOR_INTERVAL="${SUPERVISOR_MONITOR_INTERVAL:-30s}"
        export SUPERVISOR_BACKUP_INTERVAL="${SUPERVISOR_BACKUP_INTERVAL:-300s}"
        export SUPERVISOR_BACKUP_MOUNT_PATH="${SUPERVISOR_BACKUP_MOUNT_PATH:-/mnt/azure-volume}"
        export SUPERVISOR_HTTP_ENABLED="${SUPERVISOR_HTTP_ENABLED:-true}"
        export SUPERVISOR_HTTP_ADDR="${SUPERVISOR_HTTP_ADDR:-127.0.0.1:9000}"
        export SUPERVISOR_AGENT_ENABLED="${SUPERVISOR_AGENT_ENABLED:-false}"
        
        workspace-supervisor &
        SUPERVISOR_PID=$!
        echo "✅ Supervisor daemon started (PID: $SUPERVISOR_PID)"
    else
        echo "⚠️  workspace-supervisor binary not found in PATH; backup and monitoring daemon disabled"
    fi
    
    echo "=================================================="
    echo "✅ Dev8.dev Workspace Ready!"
    echo "=================================================="
    echo ""
    echo "🔗 Connection Information:"
    echo "   SSH: ssh -p 2222 dev8@<host>"
    echo "   VS Code: http://<host>:8080"
    echo ""
    echo "🤖 AI Agent Commands:"
    command -v gh >/dev/null && gh auth status >/dev/null 2>&1 && echo "   GitHub Copilot: gh copilot suggest 'command description'"
    [ -f "$HOME/.local/bin/claude" ] && echo "   Claude: claude 'your question'"
    [ -f "$HOME/.local/bin/gemini" ] && echo "   Gemini: gemini 'your question'"
    [ -f "$HOME/.local/bin/gpt" ] && echo "   GPT: gpt 'your question'"
    echo ""
    echo "📝 Workspace: $WORKSPACE_DIR"
    echo "💾 Persistent Storage: /mnt/azure-volume"
    echo "🔄 Backup: $([ "$BACKUP_ENABLED" = "true" ] && echo "Enabled" || echo "Disabled")"
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
