# Dev8.dev Node.js Image - Full JavaScript/TypeScript Development Environment
# Based on dev8-base with Node.js, Bun, pnpm, and code-server

ARG BASE_IMAGE=dev8-base:latest
FROM ${BASE_IMAGE}

USER root

# Install Node.js 20 LTS
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Install pnpm globally
RUN npm install -g pnpm@latest && \
    npm install -g yarn@latest && \
    npm cache clean --force

# Install Bun (modern JavaScript runtime)
RUN curl -fsSL https://bun.sh/install | bash && \
    ln -s /root/.bun/bin/bun /usr/local/bin/bun || true

# Make Bun available for dev8 user
ENV BUN_INSTALL="/home/dev8/.bun"
RUN mkdir -p "$BUN_INSTALL/bin" && \
    chown -R dev8:dev8 "$BUN_INSTALL"

USER dev8

# Install Bun for dev8 user
RUN curl -fsSL https://bun.sh/install | bash

# Update PATH for Bun
ENV PATH="/home/dev8/.bun/bin:$PATH"

# Install code-server
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Pre-install essential VS Code extensions for JavaScript/TypeScript
RUN code-server --install-extension dbaeumer.vscode-eslint && \
    code-server --install-extension esbenp.prettier-vscode && \
    code-server --install-extension GitHub.copilot && \
    code-server --install-extension GitHub.copilot-chat && \
    code-server --install-extension ms-vscode.vscode-typescript-next && \
    code-server --install-extension bradlc.vscode-tailwindcss && \
    code-server --install-extension formulahendry.auto-rename-tag && \
    code-server --install-extension christian-kohler.path-intellisense && \
    code-server --install-extension streetsidesoftware.code-spell-checker

# Configure default settings for Node.js development
RUN mkdir -p /home/dev8/.local/share/code-server/User && \
    cat > /home/dev8/.local/share/code-server/User/settings.json <<'EOF'
{
  "workbench.colorTheme": "Default Dark+",
  "editor.fontSize": 14,
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "javascript.updateImportsOnFileMove.enabled": "always",
  "typescript.updateImportsOnFileMove.enabled": "always",
  "npm.packageManager": "pnpm",
  "github.copilot.enable": {
    "*": true,
    "javascript": true,
    "typescript": true,
    "javascriptreact": true,
    "typescriptreact": true
  },
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/build": true,
    "**/.next": true
  }
}
EOF

# Verify installations
RUN node --version && \
    npm --version && \
    pnpm --version && \
    bun --version && \
    code-server --version

WORKDIR /workspace

# Labels
LABEL maintainer="Dev8.dev Team"
LABEL description="Node.js development environment with code-server and GitHub Copilot"
LABEL version="1.0"
LABEL languages="nodejs,typescript,javascript"

# Expose ports
EXPOSE 8080 2222

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
