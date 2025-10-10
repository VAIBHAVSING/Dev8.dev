#!/bin/bash
###############################################################################
# Dev8.dev Docker Images Build Script
# Builds all Docker images with proper tagging and registry management
###############################################################################

set -e

# Configuration
REGISTRY="${DOCKER_REGISTRY:-dev8registry.azurecr.io}"
VERSION="${VERSION:-latest}"
BUILD_BASE="${BUILD_BASE:-true}"
BUILD_MVP="${BUILD_MVP:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed or not in PATH"
    exit 1
fi

log_info "Docker version: $(docker --version)"
log_info "Registry: $REGISTRY"
log_info "Version: $VERSION"
log_info ""

###############################################################################
# Build Base Image
###############################################################################
build_base() {
    log_info "Building base image..."
    
    docker build \
        -t dev8-base:${VERSION} \
        -t ${REGISTRY}/dev8-base:${VERSION} \
        -t ${REGISTRY}/dev8-base:latest \
        -f base/Dockerfile \
        --build-arg VERSION=${VERSION} \
        ./base/
    
    log_success "Base image built successfully"
    log_info "Image size: $(docker images dev8-base:${VERSION} --format "{{.Size}}")"
    echo ""
}

###############################################################################
# Build MVP Image (Node.js + Python + Go)
###############################################################################
build_mvp() {
    log_info "Building MVP image (Node.js + Python + Go + Backup Support)..."
    
    docker build \
        -t dev8-mvp:${VERSION} \
        -t ${REGISTRY}/dev8-mvp:${VERSION} \
        -t ${REGISTRY}/dev8-mvp:latest \
        -f mvp/Dockerfile \
        --build-arg BASE_IMAGE=dev8-base:${VERSION} \
        --build-arg VERSION=${VERSION} \
        ./mvp/
    
    log_success "MVP image built successfully"
    log_info "Image size: $(docker images dev8-mvp:${VERSION} --format "{{.Size}}")"
    echo ""
}

###############################################################################
# Main Build Flow
###############################################################################
main() {
    log_info "Starting Dev8.dev Docker images build..."
    log_info "=================================================="
    echo ""
    
    # Build images in dependency order
    if [ "$BUILD_BASE" = "true" ]; then
        build_base
    else
        log_warning "Skipping base image build"
    fi
    
    if [ "$BUILD_MVP" = "true" ]; then
        build_mvp
    else
        log_warning "Skipping MVP image build"
    fi
    
    # Summary
    log_info "=================================================="
    log_success "Build completed successfully!"
    log_info "=================================================="
    echo ""
    log_info "Built images:"
    docker images | grep -E "dev8-(base|mvp)" | grep -E "${VERSION}|latest"
    echo ""
    log_info "To test an image locally:"
    echo "  docker run -it --rm -p 8080:8080 -p 2222:2222 \\"
    echo "    -e GITHUB_TOKEN=your_token \\"
    echo "    -e SSH_PUBLIC_KEY=\"\$(cat ~/.ssh/id_rsa.pub)\" \\"
    echo "    dev8-mvp:${VERSION}"
    echo ""
    log_info "To push to registry:"
    echo "  docker push ${REGISTRY}/dev8-base:${VERSION}"
    echo "  docker push ${REGISTRY}/dev8-mvp:${VERSION}"
}

# Run main function
main
