#!/bin/bash
set -e

# Dev8 AI Tools Bundle Installation Script
# Installs GitHub CLI, Copilot, Azure CLI, and other AI development tools

INSTALL_GITHUB_CLI=${INSTALLGITHUBCLI:-"true"}
INSTALL_COPILOT=${INSTALLCOPILOT:-"true"}
INSTALL_AZURE_CLI=${INSTALLAZURECLI:-"true"}
INSTALL_YQ=${INSTALLYQ:-"true"}
INSTALL_TMUX=${INSTALLTMUX:-"true"}
SETUP_SHELL_ALIASES=${SETUPSHELLALIASES:-"true"}

echo "Installing Dev8 AI Tools Bundle..."

###############################################################################
# Install GitHub CLI
###############################################################################
if [ "$INSTALL_GITHUB_CLI" = "true" ]; then
    echo "Installing GitHub CLI..."
    
    # Detect architecture
    ARCH=$(dpkg --print-architecture 2>/dev/null || echo "amd64")
    
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | \
        dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg 2>/dev/null
    chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
    
    echo "deb [arch=${ARCH} signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | \
        tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    
    apt-get update -qq
    apt-get install -y gh
    
    echo "✓ GitHub CLI installed"
fi

###############################################################################
# Install GitHub Copilot CLI extension
###############################################################################
if [ "$INSTALL_COPILOT" = "true" ] && [ "$INSTALL_GITHUB_CLI" = "true" ]; then
    echo "GitHub Copilot CLI will be available after authentication"
    echo "Run: gh extension install github/gh-copilot"
fi

###############################################################################
# Install Azure CLI
###############################################################################
if [ "$INSTALL_AZURE_CLI" = "true" ]; then
    echo "Installing Azure CLI..."
    curl -sL https://aka.ms/InstallAzureCLIDeb | bash > /dev/null 2>&1
    echo "✓ Azure CLI installed"
fi

###############################################################################
# Install yq (YAML processor)
###############################################################################
if [ "$INSTALL_YQ" = "true" ]; then
    echo "Installing yq..."
    
    # Detect architecture
    ARCH=$(uname -m)
    case $ARCH in
        x86_64)
            YQ_ARCH="amd64"
            ;;
        aarch64|arm64)
            YQ_ARCH="arm64"
            ;;
        *)
            echo "Unsupported architecture for yq: $ARCH"
            YQ_ARCH="amd64"
            ;;
    esac
    
    wget -q -O /usr/local/bin/yq \
        "https://github.com/mikefarah/yq/releases/latest/download/yq_linux_${YQ_ARCH}"
    chmod +x /usr/local/bin/yq
    
    echo "✓ yq installed"
fi

###############################################################################
# Install tmux with configuration
###############################################################################
if [ "$INSTALL_TMUX" = "true" ]; then
    echo "Installing tmux..."
    apt-get update -qq
    apt-get install -y tmux
    
    # Create a default tmux configuration
    mkdir -p /etc/skel
    cat > /etc/skel/.tmux.conf << 'TMUX_CONF'
# Dev8 tmux configuration

# Set prefix to Ctrl-a (easier than Ctrl-b)
unbind C-b
set-option -g prefix C-a
bind-key C-a send-prefix

# Split panes with | and -
bind | split-window -h
bind - split-window -v
unbind '"'
unbind %

# Switch panes with Alt-arrow without prefix
bind -n M-Left select-pane -L
bind -n M-Right select-pane -R
bind -n M-Up select-pane -U
bind -n M-Down select-pane -D

# Enable mouse mode
set -g mouse on

# Set easier window split keys
bind-key v split-window -h
bind-key h split-window -v

# Easy config reload
bind-key r source-file ~/.tmux.conf \; display-message "Config reloaded"

# Start windows and panes at 1, not 0
set -g base-index 1
setw -g pane-base-index 1

# History limit
set-option -g history-limit 10000

# Status bar
set -g status-style bg=colour235,fg=colour136
set -g status-left '#[fg=colour235,bg=colour136,bold] Dev8 '
set -g status-right '#[fg=colour136,bg=colour235] %Y-%m-%d %H:%M '
TMUX_CONF
    
    echo "✓ tmux installed with custom configuration"
fi

###############################################################################
# Setup AI tool helper scripts
###############################################################################
echo "Setting up AI tool helper scripts..."

# Create helpers directory
mkdir -p /usr/local/share/dev8-ai-tools

# GitHub Copilot helper
cat > /usr/local/share/dev8-ai-tools/setup-copilot.sh << 'COPILOT_SCRIPT'
#!/bin/bash
# GitHub Copilot CLI Setup Helper

if ! command -v gh &> /dev/null; then
    echo "Error: GitHub CLI (gh) is not installed"
    exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
    echo "GitHub CLI not authenticated."
    echo "Please authenticate with: gh auth login"
    exit 1
fi

# Install Copilot extension if not already installed
if ! gh extension list | grep -q "github/gh-copilot"; then
    echo "Installing GitHub Copilot CLI extension..."
    gh extension install github/gh-copilot
    echo "✓ GitHub Copilot CLI installed"
else
    echo "✓ GitHub Copilot CLI is already installed"
fi

echo ""
echo "GitHub Copilot CLI is ready!"
echo "Usage:"
echo "  gh copilot suggest 'create a function to sort an array'"
echo "  gh copilot explain 'git rebase -i HEAD~3'"
COPILOT_SCRIPT

chmod +x /usr/local/share/dev8-ai-tools/setup-copilot.sh

# GPT CLI helper (for OpenAI API)
cat > /usr/local/bin/gpt << 'GPT_SCRIPT'
#!/bin/bash
# Simple GPT CLI wrapper for OpenAI API

if [ -z "$OPENAI_API_KEY" ]; then
    echo "Error: OPENAI_API_KEY environment variable not set" >&2
    exit 1
fi

PROMPT="$*"
if [ -z "$PROMPT" ] && [ ! -t 0 ]; then
    PROMPT=$(cat)
fi

if [ -z "$PROMPT" ]; then
    echo "Usage: gpt <prompt>" >&2
    echo "   or: echo 'prompt' | gpt" >&2
    exit 1
fi

MODEL="${GPT_MODEL:-gpt-4}"

# Escape JSON
ESCAPED=$(echo "$PROMPT" | python3 -c 'import json, sys; print(json.dumps(sys.stdin.read()))')

curl -s https://api.openai.com/v1/chat/completions \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $OPENAI_API_KEY" \
    -d "{
        \"model\": \"$MODEL\",
        \"messages\": [{\"role\": \"user\", \"content\": $ESCAPED}]
    }" | python3 -c 'import json, sys; print(json.load(sys.stdin)["choices"][0]["message"]["content"])'
GPT_SCRIPT

chmod +x /usr/local/bin/gpt

# Gemini CLI helper (for Google AI)
cat > /usr/local/bin/gemini << 'GEMINI_SCRIPT'
#!/bin/bash
# Simple Gemini CLI wrapper for Google AI API

if [ -z "$GEMINI_API_KEY" ]; then
    echo "Error: GEMINI_API_KEY environment variable not set" >&2
    exit 1
fi

PROMPT="$*"
if [ -z "$PROMPT" ] && [ ! -t 0 ]; then
    PROMPT=$(cat)
fi

if [ -z "$PROMPT" ]; then
    echo "Usage: gemini <prompt>" >&2
    echo "   or: echo 'prompt' | gemini" >&2
    exit 1
fi

MODEL="${GEMINI_MODEL:-gemini-pro}"

# Escape JSON
ESCAPED=$(echo "$PROMPT" | python3 -c 'import json, sys; print(json.dumps(sys.stdin.read()))')

curl -s "https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${GEMINI_API_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
        \"contents\": [{
            \"parts\": [{\"text\": $ESCAPED}]
        }]
    }" | python3 -c 'import json, sys; print(json.load(sys.stdin)["candidates"][0]["content"]["parts"][0]["text"])'
GEMINI_SCRIPT

chmod +x /usr/local/bin/gemini

echo "✓ AI tool helpers installed"

###############################################################################
# Setup shell aliases
###############################################################################
if [ "$SETUP_SHELL_ALIASES" = "true" ]; then
    echo "Setting up shell aliases..."
    
    cat > /etc/profile.d/dev8-ai-tools.sh << 'ALIASES'
# Dev8 AI Tools Aliases

# Git helpers with AI
alias git-explain='git log --oneline --decorate | head -10 | claude "Explain this git history"'
alias commit-msg='git diff --staged | claude "Generate a concise commit message for these changes"'

# Code review
alias review='git diff | claude --system "You are a code reviewer. Provide constructive feedback." "Review this code"'

# Quick explanations
alias explain='claude --system "You are a helpful programming assistant. Explain things clearly and concisely."'

# Copilot shortcuts (if available)
if command -v gh &> /dev/null; then
    alias suggest='gh copilot suggest'
    alias ghx='gh copilot explain'
fi

# Azure shortcuts
if command -v az &> /dev/null; then
    alias azls='az resource list --output table'
    alias azlogin='az login'
fi
ALIASES
    
    echo "✓ Shell aliases configured"
fi

###############################################################################
# Cleanup
###############################################################################
apt-get clean
rm -rf /var/lib/apt/lists/*

###############################################################################
# Verify installations
###############################################################################
echo ""
echo "=== Verifying installations ==="

if [ "$INSTALL_GITHUB_CLI" = "true" ]; then
    gh --version | head -1 || echo "✗ GitHub CLI failed"
fi

if [ "$INSTALL_AZURE_CLI" = "true" ]; then
    az version --output tsv 2>/dev/null | head -1 || echo "✗ Azure CLI failed"
fi

if [ "$INSTALL_YQ" = "true" ]; then
    yq --version || echo "✗ yq failed"
fi

if [ "$INSTALL_TMUX" = "true" ]; then
    tmux -V || echo "✗ tmux failed"
fi

echo "✓ Dev8 AI Tools Bundle installed successfully!"
echo ""
echo "Available tools:"
[ "$INSTALL_GITHUB_CLI" = "true" ] && echo "  - gh (GitHub CLI)"
[ "$INSTALL_COPILOT" = "true" ] && echo "  - Run /usr/local/share/dev8-ai-tools/setup-copilot.sh to setup Copilot"
[ "$INSTALL_AZURE_CLI" = "true" ] && echo "  - az (Azure CLI)"
[ "$INSTALL_YQ" = "true" ] && echo "  - yq (YAML processor)"
[ "$INSTALL_TMUX" = "true" ] && echo "  - tmux (terminal multiplexer)"
echo "  - gpt (OpenAI GPT CLI wrapper)"
echo "  - gemini (Google Gemini CLI wrapper)"
echo "  - claude (Anthropic Claude CLI - install claude-cli feature)"
echo ""
echo "Set API keys as environment variables:"
echo "  - GITHUB_TOKEN (for GitHub CLI & Copilot)"
echo "  - OPENAI_API_KEY (for GPT CLI)"
echo "  - GEMINI_API_KEY (for Gemini CLI)"
echo "  - ANTHROPIC_API_KEY (for Claude CLI)"

echo "Installation complete!"
