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
BUILD_NODEJS="${BUILD_NODEJS:-true}"
BUILD_PYTHON="${BUILD_PYTHON:-true}"
BUILD_FULLSTACK="${BUILD_FULLSTACK:-true}"

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
# Build Node.js Image
###############################################################################
build_nodejs() {
    log_info "Building Node.js image..."
    
    docker build \
        -t dev8-nodejs:${VERSION} \
        -t ${REGISTRY}/dev8-nodejs:${VERSION} \
        -t ${REGISTRY}/dev8-nodejs:latest \
        -f nodejs/Dockerfile \
        --build-arg BASE_IMAGE=dev8-base:${VERSION} \
        --build-arg VERSION=${VERSION} \
        ./nodejs/
    
    log_success "Node.js image built successfully"
    log_info "Image size: $(docker images dev8-nodejs:${VERSION} --format "{{.Size}}")"
    echo ""
}

###############################################################################
# Build Python Image
###############################################################################
build_python() {
    log_info "Building Python image..."
    
    docker build \
        -t dev8-python:${VERSION} \
        -t ${REGISTRY}/dev8-python:${VERSION} \
        -t ${REGISTRY}/dev8-python:latest \
        -f python/Dockerfile \
        --build-arg BASE_IMAGE=dev8-base:${VERSION} \
        --build-arg VERSION=${VERSION} \
        ./python/
    
    log_success "Python image built successfully"
    log_info "Image size: $(docker images dev8-python:${VERSION} --format "{{.Size}}")"
    echo ""
}

###############################################################################
# Build Fullstack Image
###############################################################################
build_fullstack() {
    log_info "Building Fullstack image..."
    
    docker build \
        -t dev8-fullstack:${VERSION} \
        -t ${REGISTRY}/dev8-fullstack:${VERSION} \
        -t ${REGISTRY}/dev8-fullstack:latest \
        -f fullstack/Dockerfile \
        --build-arg BASE_IMAGE=dev8-base:${VERSION} \
        --build-arg VERSION=${VERSION} \
        ./fullstack/
    
    log_success "Fullstack image built successfully"
    log_info "Image size: $(docker images dev8-fullstack:${VERSION} --format "{{.Size}}")"
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
    
    if [ "$BUILD_NODEJS" = "true" ]; then
        build_nodejs
    else
        log_warning "Skipping Node.js image build"
    fi
    
    if [ "$BUILD_PYTHON" = "true" ]; then
        build_python
    else
        log_warning "Skipping Python image build"
    fi
    
    if [ "$BUILD_FULLSTACK" = "true" ]; then
        build_fullstack
    else
        log_warning "Skipping Fullstack image build"
    fi
    
    # Summary
    log_info "=================================================="
    log_success "Build completed successfully!"
    log_info "=================================================="
    echo ""
    log_info "Built images:"
    docker images | grep -E "dev8-(base|nodejs|python|fullstack)" | grep -E "${VERSION}|latest"
    echo ""
    log_info "To test an image locally:"
    echo "  docker run -it --rm -p 8080:8080 -p 2222:2222 \\"
    echo "    -e GITHUB_TOKEN=your_token \\"
    echo "    -e SSH_PUBLIC_KEY=\"\$(cat ~/.ssh/id_rsa.pub)\" \\"
    echo "    dev8-nodejs:${VERSION}"
    echo ""
    log_info "To push to registry:"
    echo "  docker push ${REGISTRY}/dev8-base:${VERSION}"
    echo "  docker push ${REGISTRY}/dev8-nodejs:${VERSION}"
    echo "  docker push ${REGISTRY}/dev8-python:${VERSION}"
    echo "  docker push ${REGISTRY}/dev8-fullstack:${VERSION}"
}

# Run main function
main
