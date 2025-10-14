# Dev8.dev MVP Image - Complete Development Environment
# Most popular languages: Node.js, Python, Go (MVP essentials)
# With backup support for volume snapshots and object storage

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

# Install Python essentials and AWS CLI v2 (via pip to avoid urllib3 conflicts)
RUN pip install --no-cache-dir \
    poetry \
    black \
    flake8 \
    pytest \
    requests \
    awscli

# Install Azure CLI for backup support
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

USER dev8

# Install Bun for dev8 user
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/home/dev8/.bun/bin:$PATH"

# Setup Go workspace
RUN mkdir -p "$GOPATH/bin" "$GOPATH/src" "$GOPATH/pkg"
ENV PATH="$GOPATH/bin:$PATH"

# Create backup directories
RUN mkdir -p /home/dev8/.backups /home/dev8/.backup-scripts

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

# Configure VS Code settings for fullstack development
RUN mkdir -p /home/dev8/.local/share/code-server/User && \
    cat > /home/dev8/.local/share/code-server/User/settings.json <<'EOF'
{
  "workbench.colorTheme": "Default Dark+",
  "editor.fontSize": 14,
  "editor.formatOnSave": true,
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
    "editor.tabSize": 4
  },
  "[go]": {
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
    "go": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/__pycache__": true,
    "**/target": true,
    "**/.git": true
  }
}
EOF

# Copy backup script
COPY --chown=dev8:dev8 docker/mvp/backup.sh /home/dev8/.backup-scripts/backup.sh
RUN chmod +x /home/dev8/.backup-scripts/backup.sh

# Verify all installations
RUN echo "=== Verifying MVP Installations ===" && \
    node --version && \
    npm --version && \
    pnpm --version && \
    bun --version && \
    python --version && \
    pip --version && \
    go version && \
    code-server --version && \
    aws --version && \
    az version && \
    echo "=== All MVP languages and tools installed successfully! ==="

WORKDIR /workspace

# Labels
LABEL maintainer="Dev8.dev Team"
LABEL description="MVP development environment with popular languages, GitHub Copilot, and backup support"
LABEL version="1.0-mvp"
LABEL languages="nodejs,python,go,typescript,javascript"
LABEL features="copilot,backup,aws-cli,azure-cli"

# Expose ports
EXPOSE 8080 2222

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
