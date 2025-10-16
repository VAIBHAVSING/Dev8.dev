#!/bin/bash
###############################################################################
# Dev8.dev Docker Images Build Script
# Builds production-ready workspace images with AI agents and supervisor
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
    log_info "Building base image with AI agents and supervisor..."
    
    # Build from project root to include supervisor code
    docker build \
        -t dev8-base:${VERSION} \
        -t ${REGISTRY}/dev8-base:${VERSION} \
        -t ${REGISTRY}/dev8-base:latest \
        -f docker/base/Dockerfile \
        --build-arg VERSION=${VERSION} \
        .
    
    log_success "Base image built successfully"
    log_info "Image size: $(docker images dev8-base:${VERSION} --format "{{.Size}}")"
    echo ""
}

###############################################################################
# Build Production Workspace Image (Node.js + Python + Go + Rust + AI Agents)
###############################################################################
build_mvp() {
    log_info "Building production workspace image..."
    log_info "  Languages: Node.js, Python, Go, Rust, Bun"
    log_info "  AI Agents: GitHub Copilot, Claude, Gemini, OpenAI"
    log_info "  Features: code-server, SSH, supervisor, persistent storage"
    
    # Build from project root
    docker build \
        -t dev8-workspace:${VERSION} \
        -t dev8-mvp:${VERSION} \
        -t ${REGISTRY}/dev8-workspace:${VERSION} \
        -t ${REGISTRY}/dev8-workspace:latest \
        -t ${REGISTRY}/dev8-mvp:${VERSION} \
        -t ${REGISTRY}/dev8-mvp:latest \
        -f docker/mvp/Dockerfile \
        --build-arg BASE_IMAGE=dev8-base:${VERSION} \
        --build-arg VERSION=${VERSION} \
        .
    
    log_success "Production workspace image built successfully"
    log_info "Image size: $(docker images dev8-workspace:${VERSION} --format "{{.Size}}")"
    echo ""
}

###############################################################################
# Main Build Flow
###############################################################################
main() {
    log_info "Starting Dev8.dev Docker images build..."
    log_info "=================================================="
    echo ""
    
    # Change to docker directory
    cd "$(dirname "$0")"
    
    # Build images in dependency order
    if [ "$BUILD_BASE" = "true" ]; then
        build_base
    else
        log_warning "Skipping base image build"
    fi
    
    if [ "$BUILD_MVP" = "true" ]; then
        build_mvp
    else
        log_warning "Skipping production workspace image build"
    fi
    
    # Summary
    log_info "=================================================="
    log_success "Build completed successfully!"
    log_info "=================================================="
    echo ""
    log_info "Built images:"
    docker images | grep -E "dev8-(base|workspace|mvp)" | grep -E "${VERSION}|latest"
    echo ""
    log_info "🚀 Quick Test:"
    echo "  docker run -it --rm -p 8080:8080 -p 2222:2222 \\"
    echo "    -e GITHUB_TOKEN=\$GITHUB_TOKEN \\"
    echo "    -e ANTHROPIC_API_KEY=\$ANTHROPIC_API_KEY \\"
    echo "    -e GOOGLE_API_KEY=\$GOOGLE_API_KEY \\"
    echo "    -e OPENAI_API_KEY=\$OPENAI_API_KEY \\"
    echo "    -e SSH_PUBLIC_KEY=\"\$(cat ~/.ssh/id_rsa.pub)\" \\"
    echo "    -v \$(pwd)/workspace:/workspace \\"
    echo "    dev8-workspace:${VERSION}"
    echo ""
    log_info "🌐 Access:"
    echo "  VS Code: http://localhost:8080"
    echo "  SSH: ssh -p 2222 dev8@localhost"
    echo ""
    log_info "📤 Push to registry:"
    echo "  docker push ${REGISTRY}/dev8-base:${VERSION}"
    echo "  docker push ${REGISTRY}/dev8-workspace:${VERSION}"
}

# Run main function
main
