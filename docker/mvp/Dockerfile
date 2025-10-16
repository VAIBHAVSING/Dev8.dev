# Dev8.dev Production Workspace Image - Complete Development Environment
# Languages: Node.js, Python, Go, Rust + Bun
# AI Agents: GitHub Copilot, Claude, Gemini, OpenAI/Codex
# Features: code-server, SSH, supervisor, persistent volume backup support

ARG BASE_IMAGE=dev8-base:latest
FROM ${BASE_IMAGE}

USER root

###############################################################################
# INSTALL ALL LANGUAGE RUNTIMES
###############################################################################

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Install pnpm and yarn
RUN npm install -g pnpm@latest yarn@latest && \
    npm cache clean --force

# Install Python 3.11 and dev tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3.11-dev \
    python3.11-venv \
    python3-pip \
    && rm -rf /var/lib/apt/lists/* && \
    apt-get clean && \
    update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 && \
    python -m pip install --upgrade pip

# Install Go 1.21
RUN wget -q https://go.dev/dl/go1.21.12.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.21.12.linux-amd64.tar.gz && \
    rm go1.21.12.linux-amd64.tar.gz

# Add language paths to system
ENV PATH="/usr/local/go/bin:$PATH" \
    GOPATH="/home/dev8/go"

# Install Python essentials and cloud CLIs
RUN pip install --no-cache-dir \
    poetry \
    pipenv \
    black \
    flake8 \
    pylint \
    mypy \
    pytest \
    pytest-cov \
    ipython \
    jupyterlab \
    numpy \
    pandas \
    requests \
    awscli

# Install Azure CLI for backup support
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Install AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf aws awscliv2.zip

USER dev8

# Install Bun for dev8 user
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/home/dev8/.bun/bin:$PATH"

# Setup Go workspace
RUN mkdir -p "$GOPATH/bin" "$GOPATH/src" "$GOPATH/pkg"
ENV PATH="$GOPATH/bin:$PATH"

# Install Rust via rustup
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y && \
    . "$HOME/.cargo/env" && \
    rustup component add rustfmt clippy rust-analyzer
ENV PATH="/home/dev8/.cargo/bin:$PATH"

# Create backup directories
RUN mkdir -p /home/dev8/.backups /home/dev8/.backup-scripts /home/dev8/.ai-agents

# Install code-server
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Note: Extensions can be installed at runtime via code-server UI or CLI
# Uncomment below to pre-install extensions (requires network during build)
# RUN code-server --install-extension dbaeumer.vscode-eslint && \
#     code-server --install-extension esbenp.prettier-vscode && \
#     code-server --install-extension GitHub.copilot && \
#     code-server --install-extension GitHub.copilot-chat && \
#     code-server --install-extension ms-python.python && \
#     code-server --install-extension ms-python.vscode-pylance && \
#     code-server --install-extension ms-python.black-formatter && \
#     code-server --install-extension golang.go && \
#     code-server --install-extension ms-vscode.vscode-typescript-next

# Configure VS Code settings for AI-enhanced fullstack development
RUN mkdir -p /home/dev8/.local/share/code-server/User && \
    cat > /home/dev8/.local/share/code-server/User/settings.json <<'EOF'
{
  "workbench.colorTheme": "Default Dark+",
  "editor.fontSize": 14,
  "editor.lineHeight": 1.6,
  "editor.fontLigatures": true,
  "editor.formatOnSave": true,
  "editor.minimap.enabled": true,
  "editor.suggest.preview": true,
  "editor.inlineSuggest.enabled": true,
  "editor.quickSuggestions": {
    "other": true,
    "comments": true,
    "strings": true
  },
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.organizeImports": "explicit"
  },
  "[javascript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.tabSize": 2
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.tabSize": 2
  },
  "[python]": {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "editor.tabSize": 4,
    "editor.formatOnSave": true
  },
  "[go]": {
    "editor.formatOnSave": true,
    "editor.tabSize": 4
  },
  "[rust]": {
    "editor.formatOnSave": true,
    "editor.tabSize": 4
  },
  "go.toolsManagement.autoUpdate": true,
  "python.defaultInterpreterPath": "/usr/bin/python3",
  "github.copilot.enable": {
    "*": true,
    "javascript": true,
    "typescript": true,
    "python": true,
    "go": true,
    "rust": true,
    "markdown": true,
    "yaml": true
  },
  "github.copilot.inlineSuggest.enable": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/__pycache__": true,
    "**/target": true,
    "**/.git": false
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/.git/objects/**": true,
    "**/dist/**": true,
    "**/build/**": true,
    "**/__pycache__/**": true,
    "**/target/**": true
  },
  "telemetry.telemetryLevel": "off",
  "extensions.autoUpdate": true,
  "update.mode": "none"
}
EOF

# Copy backup script
COPY --chown=dev8:dev8 docker/mvp/backup.sh /home/dev8/.backup-scripts/backup.sh
RUN chmod +x /home/dev8/.backup-scripts/backup.sh

# Verify all installations
RUN echo "=== Verifying Production Workspace Installations ===" && \
    node --version && \
    npm --version && \
    pnpm --version && \
    bun --version && \
    python --version && \
    pip --version && \
    go version && \
    rustc --version && \
    cargo --version && \
    code-server --version && \
    aws --version && \
    az version --output tsv | head -n1 && \
    echo "=== All languages and tools installed successfully! ==="

WORKDIR /workspace

# Labels
LABEL maintainer="Dev8.dev Team"
LABEL description="Production workspace environment with AI agents (Copilot, Claude, Gemini, GPT), multiple languages, supervisor monitoring, and persistent volume support"
LABEL version="1.0.0"
LABEL languages="nodejs,python,go,rust,typescript,javascript,bun"
LABEL features="copilot,claude,gemini,openai,supervisor,backup,code-server,ssh,azure-cli,aws-cli"

# Expose ports
EXPOSE 8080 2222 9000

# Volume mount points for persistent storage
VOLUME ["/workspace", "/mnt/azure-volume", "/home/dev8/.backups"]

# Health check - verify services and supervisor
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD pgrep -f "workspace-supervisor|code-server|sshd" || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
