################################################################################
# Dev8.dev Language Runtimes - Layer 2 (OPTIMIZED)
# Adds Node.js, Python, Go, and Rust language runtimes
# 
# OPTIMIZATION: Pre-installed tools moved to /opt/ to reduce volume size
# - Rust: /opt/rust (instead of /home/dev8/.cargo/)
# - Bun: /opt/bun (instead of /home/dev8/.bun/)
# - Users can still install packages to /home/dev8/.cargo/bin and use Bun
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

# Install Node package managers (system-wide)
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

# Set up Go paths (system binary)
ENV PATH="/usr/local/go/bin:$PATH"

###############################################################################
# Install Bun to system path (OPTIMIZED)
# Location: /opt/bun (not /home/dev8/.bun/)
# Saves: ~100 MB per volume
###############################################################################
ENV BUN_INSTALL="/opt/bun"
RUN curl -fsSL https://bun.sh/install | bash && \
    chmod -R 755 "$BUN_INSTALL"
ENV PATH="$BUN_INSTALL/bin:$PATH"

###############################################################################
# Install Rust to system path (OPTIMIZED)
# Location: /opt/rust (not /home/dev8/.cargo/)
# Saves: ~400 MB per volume
###############################################################################
ENV RUSTUP_HOME=/opt/rust
ENV CARGO_HOME=/opt/rust
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | \
    sh -s -- -y --default-toolchain stable --profile minimal --no-modify-path && \
    chmod -R 755 /opt/rust
ENV PATH="/opt/rust/bin:$PATH"

###############################################################################
# Switch to dev8 user and setup user package directories
###############################################################################
USER ${DEV8_USER}
WORKDIR /home/${DEV8_USER}

# Configure npm for user-level global packages
# This allows users to run "npm install -g <package>" without sudo
# Packages install to /home/dev8/.npm-global/ (in volume, persists!)
RUN mkdir -p /home/dev8/.npm-global && \
    npm config set prefix '/home/dev8/.npm-global' && \
    echo 'export PATH="/home/dev8/.npm-global/bin:$PATH"' >> /home/dev8/.bashrc
ENV PATH="/home/dev8/.npm-global/bin:$PATH"

# Create user Go workspace (GOPATH for user packages)
ENV GOPATH="/home/dev8/go"
ENV GOMODCACHE="/home/dev8/.go-mod"
RUN mkdir -p "$GOPATH/bin" "$GOPATH/src" "$GOPATH/pkg" "$GOMODCACHE"
ENV PATH="$GOPATH/bin:$PATH"

# Create user Cargo directory (for user-installed Rust binaries)
# System Rust is at /opt/rust, user packages go to /home/dev8/.cargo/bin
RUN mkdir -p /home/dev8/.cargo/bin
ENV PATH="/home/dev8/.cargo/bin:$PATH"

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
      description="Dev8.dev with Node.js, Python, Go, Rust (optimized)" \
      version="2.0.0" \
      layer="10-languages" \
      languages="nodejs,python,go,rust" \
      optimization="system-paths"

CMD ["/bin/bash"]
