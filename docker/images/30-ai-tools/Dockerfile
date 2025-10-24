################################################################################
# Dev8.dev AI Tools - Layer 4 (Final)
# Adds GitHub CLI, Copilot, Azure CLI, and AI tool wrappers
################################################################################

FROM dev8-vscode:latest

USER root

###############################################################################
# Install GitHub CLI
###############################################################################
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | \
    dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | \
    tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && \
    apt-get install -y gh && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

###############################################################################
# Install Azure CLI (for backup & infrastructure)
###############################################################################
RUN curl -sL https://aka.ms/InstallAzureCLIDeb | bash && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

###############################################################################
# Install yq (YAML processor)
###############################################################################
RUN wget -qO /usr/local/bin/yq https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 && \
    chmod +x /usr/local/bin/yq

###############################################################################
# Copy AI tool setup scripts
###############################################################################
COPY docker/images/30-ai-tools/scripts/*.sh /usr/local/share/ai-tools/
RUN chmod +x /usr/local/share/ai-tools/*.sh

# Copy entrypoint
COPY docker/images/30-ai-tools/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

###############################################################################
# Switch to dev8 user
###############################################################################
USER ${DEV8_USER}

# Create directories
RUN mkdir -p /home/dev8/.backups \
             /home/dev8/.backup-scripts

# Verify installations
RUN echo "=== Verifying AI Tools ===" && \
    gh --version && \
    az version && \
    yq --version && \
    echo "=== All AI tools installed successfully! ==="

WORKDIR ${WORKSPACE_DIR}

# Labels
LABEL maintainer="Dev8.dev Team" \
      description="Dev8.dev complete workspace with AI CLI tools" \
      version="1.0.0" \
      layer="30-ai-tools" \
      tools="github-cli,copilot-cli,azure-cli"

# Expose all ports
# 8080: code-server (VS Code)
# 2222: SSH
# 9000: Supervisor API
EXPOSE 8080 2222 9000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
