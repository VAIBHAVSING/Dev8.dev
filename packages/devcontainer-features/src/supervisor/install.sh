#!/bin/bash
set -e

# Dev8 Workspace Supervisor Installation Script
# This script downloads the pre-built supervisor binary from GitHub Actions artifacts
# The binary is built by the CI pipeline and stored as workflow artifacts

VERSION=${VERSION:-"latest"}
INSTALL_PATH=${INSTALLPATH:-"/usr/local/bin"}
GITHUB_TOKEN=${GITHUB_TOKEN:-""}

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

# Function to download from GitHub Actions artifacts
download_from_artifacts() {
    local run_id=$1
    local artifact_name="supervisor-${PLATFORM}-${VERSION}"
    
    echo "Attempting to download from GitHub Actions artifacts..."
    echo "Run ID: $run_id"
    echo "Artifact: $artifact_name"
    
    # If GITHUB_TOKEN is not provided, try to build from source as fallback
    if [ -z "$GITHUB_TOKEN" ]; then
        echo "Warning: GITHUB_TOKEN not set. Cannot download from private artifacts."
        echo "Falling back to building from source..."
        return 1
    fi
    
    # Get artifact download URL using GitHub API
    ARTIFACT_URL=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
        "https://api.github.com/repos/${REPO}/actions/runs/${run_id}/artifacts" \
        | grep -o "\"archive_download_url\".*\"https://[^\"]*\"" \
        | grep "$artifact_name" \
        | cut -d'"' -f4 \
        | head -1)
    
    if [ -z "$ARTIFACT_URL" ]; then
        echo "Error: Could not find artifact ${artifact_name}"
        return 1
    fi
    
    # Download and extract artifact
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    curl -L -H "Authorization: Bearer $GITHUB_TOKEN" \
        -o artifact.zip \
        "$ARTIFACT_URL"
    
    unzip -q artifact.zip
    
    # Install the binary
    if [ -f "supervisor-${PLATFORM}" ]; then
        install -m 755 "supervisor-${PLATFORM}" "$INSTALL_PATH/$BINARY_NAME"
        cd /
        rm -rf "$TEMP_DIR"
        return 0
    else
        echo "Error: Binary not found in artifact"
        cd /
        rm -rf "$TEMP_DIR"
        return 1
    fi
}

# Function to build from source (fallback)
build_from_source() {
    echo "Building supervisor from source..."
    
    # Check if Go is installed
    if ! command -v go &> /dev/null; then
        echo "Go is not installed. Installing Go..."
        GO_VERSION="1.22.0"
        wget -q "https://go.dev/dl/go${GO_VERSION}.linux-${ARCH}.tar.gz"
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
if [ "$VERSION" = "latest" ]; then
    # Try to get the latest successful workflow run
    if [ -n "$GITHUB_TOKEN" ]; then
        echo "Fetching latest successful build from GitHub Actions..."
        LATEST_RUN_ID=$(curl -s -H "Authorization: Bearer $GITHUB_TOKEN" \
            "https://api.github.com/repos/${REPO}/actions/workflows/build-supervisor.yml/runs?status=success&per_page=1" \
            | grep -o '"id":[0-9]*' \
            | head -1 \
            | cut -d':' -f2)
        
        if [ -n "$LATEST_RUN_ID" ]; then
            echo "Found latest run: $LATEST_RUN_ID"
            if download_from_artifacts "$LATEST_RUN_ID"; then
                echo "✓ Downloaded pre-built binary from GitHub Actions"
            else
                build_from_source
            fi
        else
            echo "No successful workflow runs found, building from source..."
            build_from_source
        fi
    else
        # No token provided, build from source
        build_from_source
    fi
else
    # Specific version requested
    # For now, treat as build from source or specific run ID
    if [[ "$VERSION" =~ ^[0-9]+$ ]]; then
        # Version is a run ID
        if download_from_artifacts "$VERSION"; then
            echo "✓ Downloaded pre-built binary from GitHub Actions"
        else
            build_from_source
        fi
    else
        # Try to find a run with this version
        build_from_source
    fi
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
