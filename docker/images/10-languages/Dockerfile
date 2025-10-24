################################################################################
# Dev8.dev Language Runtimes - Layer 2
# Adds Node.js, Python, Go, and Rust language runtimes
################################################################################

FROM dev8-base:latest

USER root

###############################################################################
# Install Node.js 20 LTS
###############################################################################
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Install Node package managers
RUN npm install -g pnpm@latest yarn@latest && \
    npm cache clean --force

###############################################################################
# Install Python 3.11
###############################################################################
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3.11 \
    python3.11-dev \
    python3.11-venv \
    python3-pip \
    && rm -rf /var/lib/apt/lists/* && \
    apt-get clean && \
    update-alternatives --install /usr/bin/python python /usr/bin/python3.11 1 && \
    update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.11 1 && \
    python -m pip install --upgrade pip setuptools wheel

# Install Python development tools
RUN pip install --no-cache-dir \
    poetry \
    black \
    flake8 \
    pytest \
    requests \
    ipython

###############################################################################
# Install Go 1.21
###############################################################################
RUN wget -q https://go.dev/dl/go1.21.12.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go1.21.12.linux-amd64.tar.gz && \
    rm go1.21.12.linux-amd64.tar.gz

# Set up Go paths
ENV PATH="/usr/local/go/bin:$PATH" \
    GOPATH="/home/dev8/go"

###############################################################################
# Switch to dev8 user and setup user-level tools
###############################################################################
USER ${DEV8_USER}
WORKDIR /home/${DEV8_USER}

# Install Bun (JavaScript runtime)
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/home/dev8/.bun/bin:$PATH"

# Setup Go workspace
RUN mkdir -p "$GOPATH/bin" "$GOPATH/src" "$GOPATH/pkg"

# Install Rust for dev8 user (user-level toolchain)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | \
    sh -s -- -y --default-toolchain stable --profile minimal

# Update PATH for user tools
ENV PATH="$GOPATH/bin:/home/dev8/.cargo/bin:$PATH"

# Verify installations
RUN echo "=== Verifying Language Installations ===" && \
    node --version && \
    npm --version && \
    pnpm --version && \
    bun --version && \
    python --version && \
    pip --version && \
    go version && \
    rustc --version && \
    echo "=== All languages installed successfully! ==="

WORKDIR ${WORKSPACE_DIR}

# Labels
LABEL maintainer="Dev8.dev Team" \
      description="Dev8.dev with Node.js, Python, Go, Rust" \
      version="1.0.0" \
      layer="10-languages" \
      languages="nodejs,python,go,rust"

CMD ["/bin/bash"]
