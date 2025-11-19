#!/bin/bash
###############################################################################
# Dev8.dev Docker Images Build Script
# Builds layered Docker images with proper dependencies
###############################################################################

set -e

# Configuration
REGISTRY="${DOCKER_REGISTRY:-dev8registry.azurecr.io}"
VERSION="${VERSION:-latest}"
BUILD_CONTEXT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed"
    exit 1
fi

###############################################################################
# Build Layer Functions
###############################################################################

build_layer_00_base() {
    log_info "Building Layer 0: Base System..."
    
    docker build \
        -t dev8-base:${VERSION} \
        -t ${REGISTRY}/dev8-base:${VERSION} \
        -t ${REGISTRY}/dev8-base:latest \
        -f docker/images/00-base/Dockerfile \
        --build-arg VERSION=${VERSION} \
        "${BUILD_CONTEXT}"
    
    log_success "Base layer built successfully"
    log_info "Size: $(docker images dev8-base:${VERSION} --format "{{.Size}}")"
}

build_layer_10_languages() {
    log_info "Building Layer 1: Language Runtimes..."
    
    docker build \
        -t dev8-languages:${VERSION} \
        -t ${REGISTRY}/dev8-languages:${VERSION} \
        -t ${REGISTRY}/dev8-languages:latest \
        -f docker/images/10-languages/Dockerfile \
        --build-arg VERSION=${VERSION} \
        "${BUILD_CONTEXT}"
    
    log_success "Language layer built successfully"
    log_info "Size: $(docker images dev8-languages:${VERSION} --format "{{.Size}}")"
}

build_layer_20_vscode() {
    log_info "Building Layer 2: VS Code Server..."
    
    docker build \
        -t dev8-vscode:${VERSION} \
        -t ${REGISTRY}/dev8-vscode:${VERSION} \
        -t ${REGISTRY}/dev8-vscode:latest \
        -f docker/images/20-vscode/Dockerfile \
        --build-arg VERSION=${VERSION} \
        "${BUILD_CONTEXT}"
    
    log_success "VS Code layer built successfully"
    log_info "Size: $(docker images dev8-vscode:${VERSION} --format "{{.Size}}")"
}

build_layer_30_ai_tools() {
    log_info "Building Layer 3: AI Tools (Final)..."
    
    docker build \
        -t dev8-workspace:${VERSION} \
        -t ${REGISTRY}/dev8-workspace:${VERSION} \
        -t ${REGISTRY}/dev8-workspace:latest \
        -f docker/images/30-ai-tools/Dockerfile \
        --build-arg VERSION=${VERSION} \
        "${BUILD_CONTEXT}"
    
    log_success "AI Tools layer built successfully (FINAL IMAGE)"
    log_info "Size: $(docker images dev8-workspace:${VERSION} --format "{{.Size}}")"
}

###############################################################################
# Main
###############################################################################

main() {
    log_info "=================================================="
    log_info "Building Dev8.dev Docker Images"
    log_info "Registry: $REGISTRY"
    log_info "Version: $VERSION"
    log_info "Build Context: $BUILD_CONTEXT"
    log_info "=================================================="
    echo ""
    
    # Parse arguments
    case "${1:-all}" in
        base)
            build_layer_00_base
            ;;
        languages)
            build_layer_10_languages
            ;;
        vscode)
            build_layer_20_vscode
            ;;
        ai-tools)
            build_layer_30_ai_tools
            ;;
        all)
            build_layer_00_base
            build_layer_10_languages
            build_layer_20_vscode
            build_layer_30_ai_tools
            ;;
        *)
            log_error "Unknown layer: $1"
            echo "Usage: $0 [base|languages|vscode|ai-tools|all]"
            exit 1
            ;;
    esac
    
    echo ""
    log_info "=================================================="
    log_success "Build completed successfully!"
    log_info "=================================================="
    echo ""
    log_info "Built images:"
    docker images | grep -E "dev8-(base|languages|vscode|workspace)" | grep -E "${VERSION}|latest" || true
    echo ""
    log_info "To test VS Code Server locally:"
    echo "  docker run -it --rm -p 8080:8080 -p 2222:2222 -p 9000:9000 \\"
    echo "    -e GITHUB_TOKEN=your_token \\"
    echo "    -e CODE_SERVER_PASSWORD=mypassword \\"
    echo "    -v \$(pwd)/workspace:/workspace \\"
    echo "    dev8-workspace:${VERSION}"
    echo ""
}

main "$@"
