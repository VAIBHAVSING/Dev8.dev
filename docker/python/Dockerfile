# Dev8.dev Python Image - Full Python Development Environment
# Based on dev8-base with Python, pip, poetry, and code-server

ARG BASE_IMAGE=dev8-base:latest
FROM ${BASE_IMAGE}

USER root

# Install Python 3.11 and development tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3.11-dev \
    python3.11-venv \
    python3-pip \
    python3-setuptools \
    python3-wheel \
    # Additional Python development tools
    python3-opencv \
    # Scientific computing dependencies
    libopenblas-dev \
    liblapack-dev \
    gfortran \
    && rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Set Python 3.11 as default
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1

# Upgrade pip
RUN python -m pip install --upgrade pip setuptools wheel

# Install essential Python development tools globally
RUN pip install --no-cache-dir \
    # Package managers
    poetry \
    pipenv \
    # Code quality tools
    black \
    flake8 \
    pylint \
    mypy \
    isort \
    # Testing frameworks
    pytest \
    pytest-cov \
    pytest-asyncio \
    # Jupyter
    jupyterlab \
    notebook \
    ipykernel \
    # Popular frameworks (lightweight versions)
    requests \
    httpx \
    fastapi \
    uvicorn \
    # Data science essentials
    numpy \
    pandas

USER dev8

# Install code-server for dev8 user
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Pre-install essential VS Code extensions for Python
RUN code-server --install-extension ms-python.python && \
    code-server --install-extension ms-python.vscode-pylance && \
    code-server --install-extension ms-python.black-formatter && \
    code-server --install-extension ms-python.isort && \
    code-server --install-extension GitHub.copilot && \
    code-server --install-extension GitHub.copilot-chat && \
    code-server --install-extension ms-toolsai.jupyter && \
    code-server --install-extension charliermarsh.ruff

# Configure default settings for Python development
RUN mkdir -p /home/dev8/.local/share/code-server/User && \
    cat > /home/dev8/.local/share/code-server/User/settings.json <<'EOF'
{
  "workbench.colorTheme": "Default Dark+",
  "editor.fontSize": 14,
  "editor.tabSize": 4,
  "editor.insertSpaces": true,
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "ms-python.black-formatter",
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit"
  },
  "python.defaultInterpreterPath": "/usr/bin/python3",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "python.linting.flake8Enabled": true,
  "python.testing.pytestEnabled": true,
  "python.testing.unittestEnabled": false,
  "python.analysis.typeCheckingMode": "basic",
  "github.copilot.enable": {
    "*": true,
    "python": true,
    "jupyter": true
  },
  "files.exclude": {
    "**/__pycache__": true,
    "**/.pytest_cache": true,
    "**/.git": true,
    "**/*.pyc": true,
    "**/.mypy_cache": true,
    "**/venv": true,
    "**/.venv": true
  },
  "search.exclude": {
    "**/__pycache__": true,
    "**/.pytest_cache": true,
    "**/*.pyc": true,
    "**/venv": true,
    "**/.venv": true
  },
  "jupyter.interactiveWindow.creationMode": "single"
}
EOF

# Create virtual environment directory
RUN mkdir -p /home/dev8/.venvs

# Verify installations
RUN python --version && \
    pip --version && \
    poetry --version && \
    black --version && \
    pytest --version && \
    code-server --version

WORKDIR /workspace

# Labels
LABEL maintainer="Dev8.dev Team"
LABEL description="Python development environment with code-server and GitHub Copilot"
LABEL version="1.0"
LABEL languages="python"

# Expose ports
EXPOSE 8080 2222 8888

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/healthz || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
