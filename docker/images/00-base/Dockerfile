################################################################################
# Dev8.dev Base Image - Layer 1
# Foundation image with system packages, SSH, and workspace supervisor
################################################################################

###############################################################################
# STAGE 1: Build Workspace Supervisor
###############################################################################
FROM golang:1.22-bullseye AS supervisor-builder

WORKDIR /build

# Copy go module files first for better caching
COPY apps/supervisor/go.mod apps/supervisor/go.sum ./
RUN go mod download

# Copy source and build
COPY apps/supervisor/ ./
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags="-s -w" \
    -o workspace-supervisor \
    ./cmd/supervisor

###############################################################################
# STAGE 2: Base System Image
###############################################################################
FROM ubuntu:22.04

# Prevent interactive prompts
ENV DEBIAN_FRONTEND=noninteractive \
    LANG=en_US.UTF-8 \
    LANGUAGE=en_US:en \
    LC_ALL=en_US.UTF-8 \
    TZ=UTC

# Install system essentials
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
    # Build essentials
    build-essential \
    pkg-config \
    libssl-dev \
    # Network tools
    netcat \
    iputils-ping \
    net-tools \
    dnsutils \
    # Process management
    procps \
    htop \
    # Storage
    fuse3 \
    # Locale
    locales \
    # Terminal
    tmux \
    screen \
    # File tools
    rsync \
    tree \
    && locale-gen en_US.UTF-8 \
    && update-locale LANG=en_US.UTF-8 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create dev8 user and workspace
ENV DEV8_USER=dev8 \
    DEV8_UID=1000 \
    DEV8_GID=1000 \
    WORKSPACE_DIR=/workspace

RUN groupadd -g ${DEV8_GID} ${DEV8_USER} && \
    useradd -m -s /bin/bash -u ${DEV8_UID} -g ${DEV8_GID} ${DEV8_USER} && \
    mkdir -p ${WORKSPACE_DIR} \
             /home/${DEV8_USER}/.config \
             /home/${DEV8_USER}/.ssh \
             /home/${DEV8_USER}/.local/bin && \
    chown -R ${DEV8_USER}:${DEV8_USER} ${WORKSPACE_DIR} /home/${DEV8_USER} && \
    echo "${DEV8_USER} ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Configure SSH with security hardening
RUN mkdir -p /run/sshd && \
    sed -i 's/#PermitRootLogin prohibit-password/PermitRootLogin no/' /etc/ssh/sshd_config && \
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config && \
    sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config && \
    sed -i 's/#Port 22/Port 2222/' /etc/ssh/sshd_config && \
    sed -i 's/#UsePAM yes/UsePAM yes/' /etc/ssh/sshd_config && \
    sed -i 's/X11Forwarding yes/X11Forwarding no/' /etc/ssh/sshd_config && \
    echo "ClientAliveInterval 60" >> /etc/ssh/sshd_config && \
    echo "ClientAliveCountMax 3" >> /etc/ssh/sshd_config

# Copy workspace supervisor binary from builder
COPY --from=supervisor-builder /build/workspace-supervisor /usr/local/bin/workspace-supervisor
RUN chmod +x /usr/local/bin/workspace-supervisor

# Copy shared scripts
COPY docker/shared/scripts/common.sh /usr/local/share/common.sh
RUN chmod +x /usr/local/share/common.sh

# Install user-space package managers for persistent installations
# Switch to dev8 user for installations
USER ${DEV8_USER}

# Install SDKMAN (Java, Kotlin, Scala, Gradle, Maven, etc.)
# Installed to /home/dev8/.sdkman - persists in volume
RUN curl -s "https://get.sdkman.io" | bash && \
    bash -c "source /home/dev8/.sdkman/bin/sdkman-init.sh && sdk version"

# Install Homebrew on Linux (alternative package manager)
# Installed to /home/dev8/.linuxbrew - persists in volume
RUN /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" && \
    echo 'eval "$(/home/dev8/.linuxbrew/bin/brew shellenv)"' >> /home/dev8/.bashrc

# Add package manager paths to PATH
RUN echo 'export PATH="/home/dev8/.local/bin:/home/dev8/.sdkman/bin:$PATH"' >> /home/dev8/.bashrc && \
    echo 'source /home/dev8/.sdkman/bin/sdkman-init.sh 2>/dev/null || true' >> /home/dev8/.bashrc

WORKDIR ${WORKSPACE_DIR}

# Labels
LABEL maintainer="Dev8.dev Team" \
      description="Dev8.dev base image with supervisor and SSH" \
      version="1.0.0" \
      layer="00-base"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD ps aux | grep -E '(sshd|workspace-supervisor)' || exit 1

# Expose SSH port
EXPOSE 2222

CMD ["/bin/bash"]
