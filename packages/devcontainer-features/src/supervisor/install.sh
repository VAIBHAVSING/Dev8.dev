#!/bin/bash
set -e

# Dev8 Workspace Supervisor Installation Script
# Downloads pre-built supervisor binary from consistent GitHub release URL

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
REPO="VAIBHAVSING/Dev8.dev"
BINARY_NAME="supervisor"
PLATFORM="${OS}-${ARCH}"

# Consistent release URL (never changes!)
RELEASE_TAG="supervisor-latest"
DOWNLOAD_URL="https://github.com/${REPO}/releases/download/${RELEASE_TAG}/supervisor-${PLATFORM}"
CHECKSUM_URL="https://github.com/${REPO}/releases/download/${RELEASE_TAG}/supervisor-${PLATFORM}.sha256"

echo "Downloading supervisor from consistent release URL..."
echo "URL: $DOWNLOAD_URL"

# Function to download from GitHub release
download_from_release() {
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # Download binary
    if wget -q --show-progress "$DOWNLOAD_URL" -O "$BINARY_NAME" 2>/dev/null; then
        echo "✓ Binary downloaded successfully"
    else
        echo "✗ Failed to download binary"
        cd /
        rm -rf "$TEMP_DIR"
        return 1
    fi
    
    # Download and verify checksum if available
    if wget -q "$CHECKSUM_URL" -O checksum.sha256 2>/dev/null; then
        echo "Verifying checksum..."
        if sha256sum -c checksum.sha256 2>/dev/null; then
            echo "✓ Checksum verification passed"
        else
            echo "⚠ Checksum verification failed, but continuing..."
        fi
    else
        echo "⚠ Checksum not available, skipping verification"
    fi
    
    # Install the binary
    install -m 755 "$BINARY_NAME" "$INSTALL_PATH/$BINARY_NAME"
    
    cd /
    rm -rf "$TEMP_DIR"
    return 0
}

# Function to build from source (fallback)
build_from_source() {
    echo "Building supervisor from source..."
    
    # Check if Go is installed
    if ! command -v go &> /dev/null; then
        echo "Go is not installed. Installing Go..."
        GO_VERSION="1.22.0"
        wget -q --show-progress "https://go.dev/dl/go${GO_VERSION}.linux-${ARCH}.tar.gz"
        tar -C /usr/local -xzf "go${GO_VERSION}.linux-${ARCH}.tar.gz"
        export PATH=$PATH:/usr/local/go/bin
        rm "go${GO_VERSION}.linux-${ARCH}.tar.gz"
    fi
    
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    # Clone the repository
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
    CGO_ENABLED=0 go build -o "$BINARY_NAME" -ldflags="-s -w" .
    
    # Install the binary
    echo "Installing supervisor to $INSTALL_PATH..."
    install -m 755 "$BINARY_NAME" "$INSTALL_PATH/$BINARY_NAME"
    
    # Cleanup
    cd /
    rm -rf "$TEMP_DIR"
}

# Main installation logic
if download_from_release; then
    echo "✓ Installed supervisor from GitHub release"
else
    echo "Failed to download from release, falling back to build from source..."
    build_from_source
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

echo ""
echo "Installation complete!"
echo "Binary location: $INSTALL_PATH/$BINARY_NAME"
echo "Downloaded from: $DOWNLOAD_URL"
