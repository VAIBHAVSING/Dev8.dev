#!/bin/bash
set -e

# Dev8 Workspace Supervisor Installation Script
# This script installs the supervisor binary from GitHub releases

VERSION=${VERSION:-"latest"}
INSTALL_PATH=${INSTALLPATH:-"/usr/local/bin"}

echo "Installing Dev8 Workspace Supervisor..."

# Detect architecture
ARCH=$(uname -m)
case $ARCH in
    x86_64)
        ARCH="amd64"
        ;;
    aarch64|arm64)
        ARCH="arm64"
        ;;
    *)
        echo "Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

# Detect OS
OS=$(uname -s | tr '[:upper:]' '[:lower:]')

echo "Detected OS: $OS, Architecture: $ARCH"

# GitHub repository details
REPO="Dev8-Community/Dev8.dev"
BINARY_NAME="supervisor"

# Determine download URL
if [ "$VERSION" = "latest" ]; then
    echo "Fetching latest release version..."
    # For now, we'll build from source since releases may not exist yet
    # In production, this would fetch from GitHub releases
    
    # Check if Go is installed
    if ! command -v go &> /dev/null; then
        echo "Go is not installed. Installing Go..."
        # Download and install Go
        GO_VERSION="1.22.0"
        wget -q "https://go.dev/dl/go${GO_VERSION}.linux-${ARCH}.tar.gz"
        tar -C /usr/local -xzf "go${GO_VERSION}.linux-${ARCH}.tar.gz"
        export PATH=$PATH:/usr/local/go/bin
        rm "go${GO_VERSION}.linux-${ARCH}.tar.gz"
    fi
    
    # Build supervisor from source
    echo "Building supervisor from source..."
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # Clone the repository (or copy if we're in the repo)
    if [ -d "/workspaces/Dev8.dev" ]; then
        echo "Using local source code..."
        cd /workspaces/Dev8.dev/apps/supervisor
    else
        echo "Cloning repository..."
        git clone --depth 1 "https://github.com/${REPO}.git"
        cd "Dev8.dev/apps/supervisor"
    fi
    
    # Build the binary
    echo "Compiling supervisor..."
    cd cmd/supervisor
    go build -o "$BINARY_NAME" -ldflags="-s -w" .
    
    # Install the binary
    echo "Installing supervisor to $INSTALL_PATH..."
    install -m 755 "$BINARY_NAME" "$INSTALL_PATH/$BINARY_NAME"
    
    # Cleanup
    cd /
    rm -rf "$TEMP_DIR"
else
    # Download from GitHub releases
    DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${VERSION}/supervisor-${OS}-${ARCH}"
    echo "Downloading supervisor ${VERSION} from GitHub releases..."
    
    wget -q "$DOWNLOAD_URL" -O "$INSTALL_PATH/$BINARY_NAME"
    chmod +x "$INSTALL_PATH/$BINARY_NAME"
fi

# Verify installation
if command -v supervisor &> /dev/null; then
    echo "✓ Dev8 Workspace Supervisor installed successfully!"
    supervisor --version 2>/dev/null || echo "Version: $VERSION"
else
    echo "✗ Failed to install supervisor"
    exit 1
fi

# Create default configuration directory
mkdir -p /etc/dev8/supervisor
echo "✓ Created configuration directory at /etc/dev8/supervisor"

echo "Installation complete!"
