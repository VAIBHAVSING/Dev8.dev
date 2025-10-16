# Dev8.dev Base Image - Ubuntu 22.04 with essential tools
# Production-ready workspace alternative with supervisor and AI agent integration
# Optimized for security, performance, and persistent volume storage

FROM golang:1.22-bullseye as supervisor-build
WORKDIR /src

COPY apps/supervisor/go.mod ./
COPY apps/supervisor/go.sum ./
RUN go mod download

COPY apps/supervisor/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags="-s -w -X main.version=1.0.0" -o workspace-supervisor ./cmd/supervisor

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
    DEV8_GID=1000 \
    # Supervisor configuration
    SUPERVISOR_ENABLED=true \
    BACKUP_ENABLED=true \
    # Ports
    CODE_SERVER_PORT=8080 \
    SSH_PORT=2222 \
    SUPERVISOR_API_PORT=9000

# Create non-root user for security with additional directories for backups and AI tools
RUN groupadd -g ${DEV8_GID} ${DEV8_USER} && \
    useradd -m -s /bin/bash -u ${DEV8_UID} -g ${DEV8_GID} ${DEV8_USER} && \
    mkdir -p ${WORKSPACE_DIR} \
             /home/${DEV8_USER}/.config \
             /home/${DEV8_USER}/.ssh \
             /home/${DEV8_USER}/.local/bin \
             /home/${DEV8_USER}/.backups \
             /home/${DEV8_USER}/.ai-agents \
             /mnt/azure-volume && \
    chown -R ${DEV8_USER}:${DEV8_USER} ${WORKSPACE_DIR} /home/${DEV8_USER} /mnt/azure-volume

# Install essential system packages (enhanced for production)
RUN apt-get update && apt-get install -y --no-install-recommends \
    # Core utilities
    ca-certificates \
    curl \
    wget \
    git \
    git-lfs \
    openssh-server \
    openssh-client \
    sudo \
    nano \
    vim \
    neovim \
    less \
    jq \
    yq \
    unzip \
    zip \
    tar \
    gzip \
    bzip2 \
    xz-utils \
    # Build tools
    build-essential \
    pkg-config \
    cmake \
    autoconf \
    automake \
    libtool \
    # Network tools
    netcat \
    iputils-ping \
    net-tools \
    dnsutils \
    traceroute \
    # Process management
    procps \
    htop \
    supervisor \
    # File systems
    fuse3 \
    cifs-utils \
    nfs-common \
    # Locale support
    locales \
    # Terminal multiplexer
    tmux \
    screen \
    zsh \
    # File tools
    rsync \
    tree \
    ripgrep \
    fd-find \
    bat \
    # SSL/TLS
    openssl \
    gnupg2 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Configure locale
RUN locale-gen en_US.UTF-8 && \
    update-locale LANG=en_US.UTF-8

# Configure SSH Server with security hardening (production-ready)
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
    echo "ClientAliveCountMax 3" >> /etc/ssh/sshd_config && \
    echo "MaxAuthTries 3" >> /etc/ssh/sshd_config && \
    echo "MaxSessions 10" >> /etc/ssh/sshd_config && \
    echo "AllowUsers ${DEV8_USER}" >> /etc/ssh/sshd_config

# Grant sudo access for package installation
RUN echo "${DEV8_USER} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/${DEV8_USER} && \
    chmod 0440 /etc/sudoers.d/${DEV8_USER}

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

# Health check - verify supervisor and critical services
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD pgrep -f "workspace-supervisor|sshd" || exit 1

# Expose ports
EXPOSE 8080 2222 9000

# Volume mount points for persistent storage
VOLUME ["${WORKSPACE_DIR}", "/mnt/azure-volume", "/home/${DEV8_USER}/.backups"]

# Set entrypoint
ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["bash"]
