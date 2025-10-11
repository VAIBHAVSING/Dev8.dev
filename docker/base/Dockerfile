# Dev8.dev Base Image - Ubuntu 22.04 with essential tools
# Optimized for security, performance, and GitHub Copilot integration

FROM golang:1.22-bullseye as supervisor-build
WORKDIR /src

COPY apps/supervisor/go.mod ./
COPY apps/supervisor/go.sum ./
RUN go mod download

COPY apps/supervisor/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o workspace-supervisor ./cmd/supervisor

FROM ubuntu:22.04 as base

# Avoid interactive prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive \
    # Set locale
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8 \
    # Workspace directory
    WORKSPACE_DIR=/workspace \
    # Dev8 user
    DEV8_USER=dev8 \
    DEV8_UID=1000 \
    DEV8_GID=1000

# Create non-root user for security
RUN groupadd -g ${DEV8_GID} ${DEV8_USER} && \
    useradd -m -s /bin/bash -u ${DEV8_UID} -g ${DEV8_GID} ${DEV8_USER} && \
    mkdir -p ${WORKSPACE_DIR} /home/${DEV8_USER}/.config /home/${DEV8_USER}/.ssh /home/${DEV8_USER}/.local/bin && \
    chown -R ${DEV8_USER}:${DEV8_USER} ${WORKSPACE_DIR} /home/${DEV8_USER}

# Install essential system packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Core utilities
    ca-certificates \
    curl \
    wget \
    git \
    openssh-server \
    sudo \
    nano \
    vim \
    neovim \
    less \
    jq \
    unzip \
    zip \
    tar \
    gzip \
    # Build tools
    build-essential \
    pkg-config \
    # Network tools
    netcat \
    iputils-ping \
    net-tools \
    # Process management
    procps \
    htop \
    fuse3 \
    # Locale support
    locales \
    # Terminal multiplexer
    tmux \
    screen \
    # File tools
    rsync \
    tree \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Configure locale
RUN locale-gen en_US.UTF-8 && \
    update-locale LANG=en_US.UTF-8

# Configure SSH Server with security hardening
RUN mkdir -p /run/sshd /home/${DEV8_USER}/.ssh && \
    chmod 700 /home/${DEV8_USER}/.ssh && \
    chown ${DEV8_USER}:${DEV8_USER} /home/${DEV8_USER}/.ssh && \
    # Security hardening
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && \
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config && \
    sed -i 's/#UsePAM yes/UsePAM yes/' /etc/ssh/sshd_config && \
    sed -i 's/X11Forwarding yes/X11Forwarding no/' /etc/ssh/sshd_config && \
    echo "ClientAliveInterval 60" >> /etc/ssh/sshd_config && \
    echo "ClientAliveCountMax 3" >> /etc/ssh/sshd_config

# Grant sudo access for package installation
RUN echo "${DEV8_USER} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Install GitHub CLI (latest version)
RUN curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg && \
    chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null && \
    apt-get update && \
    apt-get install -y gh && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Copy entrypoint script
COPY --chown=${DEV8_USER}:${DEV8_USER} docker/base/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Copy workspace supervisor binary
COPY --from=supervisor-build /src/workspace-supervisor /usr/local/bin/workspace-supervisor
RUN chmod +x /usr/local/bin/workspace-supervisor

# Switch to dev8 user
USER ${DEV8_USER}
WORKDIR ${WORKSPACE_DIR}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ps aux | grep -E '(sshd|code-server)' || exit 1

# Expose ports
EXPOSE 8080 2222

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["bash"]
