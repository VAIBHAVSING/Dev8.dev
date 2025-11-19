################################################################################
# Dev8.dev VS Code Server - Layer 3
# Adds code-server (VS Code in browser) with configuration
################################################################################

FROM dev8-languages:latest

USER ${DEV8_USER}
WORKDIR /home/${DEV8_USER}

###############################################################################
# Install code-server
###############################################################################
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Create code-server directories
RUN mkdir -p /home/dev8/.local/share/code-server/User \
             /home/dev8/.config/code-server

# Copy VS Code settings
COPY --chown=dev8:dev8 docker/images/20-vscode/config/settings.json \
     /home/dev8/.local/share/code-server/User/settings.json

# Copy entrypoint script
USER root
COPY docker/images/20-vscode/entrypoint.sh /usr/local/bin/entrypoint-vscode.sh
RUN chmod +x /usr/local/bin/entrypoint-vscode.sh

USER ${DEV8_USER}
WORKDIR ${WORKSPACE_DIR}

# Verify code-server installation
RUN code-server --version

# Labels
LABEL maintainer="Dev8.dev Team" \
      description="Dev8.dev with VS Code Server" \
      version="1.0.0" \
      layer="20-vscode" \
      ide="code-server"

# Expose code-server port
EXPOSE 8080 2222

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint-vscode.sh"]
CMD ["/bin/bash"]
