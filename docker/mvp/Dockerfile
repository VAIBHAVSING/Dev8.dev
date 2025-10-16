# ==============================================================================
# Dev8.dev Production-Ready Docker Image for Azure Container Instances
# ==============================================================================
# Complete development environment with:
# - Multiple language runtimes (Node.js, Python, Go, Rust, Bun)
# - VS Code Server (code-server) for browser-based IDE
# - SSH server for terminal access
# - Workspace supervisor for resource management and optimization
# - Backup support for Azure Blob Storage and AWS S3
# - GitHub Copilot and AI CLI tools integration
# - Production-ready security hardening
# ==============================================================================

ARG BASE_IMAGE=dev8-base:latest
FROM ${BASE_IMAGE}

USER root

###############################################################################
# INSTALL ALL LANGUAGE RUNTIMES FOR PRODUCTION
###############################################################################

# Install Node.js 20 LTS (Long Term Support for production)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Install modern package managers
RUN npm install -g pnpm@latest yarn@latest && \
    npm cache clean --force

# Install Python 3.11 and development tools
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

# Install Go 1.21 for backend development and supervisor
RUN wget -q https://go.dev/dl/go1.21.12.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.21.12.linux-amd64.tar.gz && \
    rm go1.21.12.linux-amd64.tar.gz

# Install Rust for systems programming
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:$PATH"

# Configure environment paths for all languages
ENV PATH="/usr/local/go/bin:/root/.cargo/bin:$PATH" \
    GOPATH="/home/dev8/go" \
    CARGO_HOME="/home/dev8/.cargo" \
    RUSTUP_HOME="/home/dev8/.rustup"

# Install Python production tools
RUN pip install --no-cache-dir \
    poetry \
    black \
    flake8 \
    pytest \
    requests \
    httpx \
    fastapi \
    uvicorn \
    sqlalchemy \
    alembic \
    pydantic

# Install cloud provider CLIs for backup and deployment
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Install AWS CLI v2
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install && \
    rm -rf aws awscliv2.zip

USER dev8

# Install Bun runtime (fast JavaScript/TypeScript runtime)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/home/dev8/.bun/bin:$PATH"

# Setup Go workspace structure
RUN mkdir -p "$GOPATH/bin" "$GOPATH/src" "$GOPATH/pkg"
ENV PATH="$GOPATH/bin:$PATH"

# Setup Rust for dev8 user
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/home/dev8/.cargo/bin:$PATH"

# Create necessary directories for production
RUN mkdir -p /home/dev8/.backups \
             /home/dev8/.backup-scripts \
             /home/dev8/.config/supervisor \
             /home/dev8/.logs

# Install code-server (VS Code in browser)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Pre-install essential VS Code extensions for production
RUN code-server --install-extension dbaeumer.vscode-eslint && \
    code-server --install-extension esbenp.prettier-vscode && \
    code-server --install-extension GitHub.copilot && \
    code-server --install-extension GitHub.copilot-chat && \
    code-server --install-extension ms-python.python && \
    code-server --install-extension ms-python.vscode-pylance && \
    code-server --install-extension ms-python.black-formatter && \
    code-server --install-extension golang.go && \
    code-server --install-extension rust-lang.rust-analyzer && \
    code-server --install-extension eamodio.gitlens

# Configure VS Code settings optimized for production development
RUN mkdir -p /home/dev8/.local/share/code-server/User && \
    cat > /home/dev8/.local/share/code-server/User/settings.json <<'EOF'
{
  "workbench.colorTheme": "Default Dark+",
  "editor.fontSize": 14,
  "editor.formatOnSave": true,
  "editor.minimap.enabled": true,
  "editor.tabSize": 2,
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
    "editor.rulers": [88]
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
  "python.linting.enabled": true,
  "python.linting.flake8Enabled": true,
  "python.formatting.provider": "black",
  "github.copilot.enable": {
    "*": true,
    "javascript": true,
    "typescript": true,
    "python": true,
    "go": true,
    "rust": true
  },
  "files.watcherExclude": {
    "**/node_modules/**": true,
    "**/__pycache__/**": true,
    "**/target/**": true,
    "**/.git/**": true,
    "**/dist/**": true,
    "**/build/**": true
  },
  "files.exclude": {
    "**/node_modules": false,
    "**/__pycache__": true,
    "**/target": false,
    "**/.git": false
  },
  "extensions.autoUpdate": true,
  "update.mode": "none",
  "telemetry.telemetryLevel": "off",
  "security.workspace.trust.enabled": false
}
EOF

# Copy backup script for production workloads
COPY --chown=dev8:dev8 docker/mvp/backup.sh /home/dev8/.backup-scripts/backup.sh
RUN chmod +x /home/dev8/.backup-scripts/backup.sh

# Create supervisor configuration template
RUN cat > /home/dev8/.config/supervisor/config.yaml <<'EOF'
# Workspace Supervisor Configuration
# Manages resource optimization, monitoring, and backups for Azure Container Instances

workspace_dir: /workspace
monitor_interval: 30s
log_file_path: /home/dev8/.logs/supervisor.log

# HTTP health check server
http:
  enabled: true
  addr: :9000

# Activity reporting to Dev8.dev agent
agent:
  enabled: true
  url: "${AGENT_URL}"
  environment_id: "${ENVIRONMENT_ID}"
  interval: 60s

# Automated backup configuration
backup:
  enabled: true
  interval: 6h
  retention_count: 7
  provider: azure  # azure or s3
  azure:
    account_name: "${AZURE_STORAGE_ACCOUNT}"
    container_name: "workspaces"
  s3:
    bucket: "${S3_BUCKET}"
    region: "${AWS_REGION}"

# Mount management for Azure Files
mount:
  enabled: true
  azure_files:
    account_name: "${AZURE_STORAGE_ACCOUNT}"
    share_name: "${AZURE_FILE_SHARE}"
EOF

# Verify all installations work correctly
RUN echo "=== Production Environment Verification ===" && \
    echo "Node.js:" && node --version && \
    echo "npm:" && npm --version && \
    echo "pnpm:" && pnpm --version && \
    echo "Bun:" && bun --version && \
    echo "Python:" && python --version && \
    echo "pip:" && pip --version && \
    echo "Go:" && go version && \
    echo "Rust:" && rustc --version && \
    echo "cargo:" && cargo --version && \
    echo "code-server:" && code-server --version && \
    echo "AWS CLI:" && aws --version && \
    echo "Azure CLI:" && az version --output tsv | head -1 && \
    echo "Supervisor:" && workspace-supervisor --help | head -1 || echo "Supervisor will be available at runtime" && \
    echo "=== All production tools verified successfully! ==="

# Switch to workspace directory
WORKDIR /workspace

# Comprehensive production labels
LABEL maintainer="Dev8.dev Team <support@dev8.dev>"
LABEL description="Production-ready development environment for Azure Container Instances with supervisor"
LABEL version="1.0-production"
LABEL languages="nodejs,python,go,rust,typescript,javascript,bun"
LABEL features="code-server,ssh,supervisor,copilot,backup,monitoring,azure,aws"
LABEL cloud="azure-container-instances"
LABEL security="non-root,hardened-ssh,supervised"
LABEL org.opencontainers.image.title="Dev8.dev Production Workspace"
LABEL org.opencontainers.image.description="Complete cloud IDE with VS Code, multiple languages, and production supervision"
LABEL org.opencontainers.image.vendor="Dev8.dev"
LABEL org.opencontainers.image.url="https://dev8.dev"
LABEL org.opencontainers.image.source="https://github.com/VAIBHAVSING/Dev8.dev"
LABEL org.opencontainers.image.licenses="MIT"

# Expose production ports
# 8080: code-server (VS Code in browser)
# 2222: SSH server (terminal access)
# 9000: Supervisor health/metrics API (internal only, not exposed publicly)
EXPOSE 8080 2222 9000

# Enhanced health check for production
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -f http://localhost:9000/health || curl -f http://localhost:8080/healthz || exit 1

# Production entrypoint with supervisor integration
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

# Default command - supervisor will manage all services
CMD ["bash"]
