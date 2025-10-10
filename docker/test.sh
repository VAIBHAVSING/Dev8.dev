#!/bin/bash
###############################################################################
# Dev8.dev Docker Images Test Script
# Automated testing for Docker images
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Test configuration
TEST_GITHUB_TOKEN="${GITHUB_TOKEN:-test_token}"
TEST_SSH_KEY="${SSH_PUBLIC_KEY:-ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC... test@dev8.dev}"

###############################################################################
# Test base image
###############################################################################
test_base() {
    log_info "Testing dev8-base image..."
    
    # Test basic functionality
    docker run --rm dev8-base:latest bash -c "echo 'Base test passed'" || {
        log_error "Base image basic test failed"
        return 1
    }
    
    # Test SSH server
    docker run --rm dev8-base:latest bash -c "which sshd" || {
        log_error "SSH server not found"
        return 1
    }
    
    # Test GitHub CLI
    docker run --rm dev8-base:latest bash -c "gh --version" || {
        log_error "GitHub CLI not found"
        return 1
    }
    
    log_success "Base image tests passed"
}

###############################################################################
# Test Node.js image
###############################################################################
test_nodejs() {
    log_info "Testing dev8-nodejs image..."
    
    # Test Node.js
    docker run --rm dev8-nodejs:latest node --version || {
        log_error "Node.js not found"
        return 1
    }
    
    # Test pnpm
    docker run --rm dev8-nodejs:latest pnpm --version || {
        log_error "pnpm not found"
        return 1
    }
    
    # Test Bun
    docker run --rm dev8-nodejs:latest bun --version || {
        log_error "Bun not found"
        return 1
    }
    
    # Test code-server
    docker run --rm dev8-nodejs:latest code-server --version || {
        log_error "code-server not found"
        return 1
    }
    
    # Test Copilot extension
    docker run --rm dev8-nodejs:latest code-server --list-extensions | grep -q "GitHub.copilot" || {
        log_warning "GitHub Copilot extension not installed"
    }
    
    log_success "Node.js image tests passed"
}

###############################################################################
# Test Python image
###############################################################################
test_python() {
    log_info "Testing dev8-python image..."
    
    # Test Python
    docker run --rm dev8-python:latest python --version || {
        log_error "Python not found"
        return 1
    }
    
    # Test pip
    docker run --rm dev8-python:latest pip --version || {
        log_error "pip not found"
        return 1
    }
    
    # Test poetry
    docker run --rm dev8-python:latest poetry --version || {
        log_error "poetry not found"
        return 1
    }
    
    # Test black
    docker run --rm dev8-python:latest black --version || {
        log_error "black not found"
        return 1
    }
    
    # Test pytest
    docker run --rm dev8-python:latest pytest --version || {
        log_error "pytest not found"
        return 1
    }
    
    # Test code-server
    docker run --rm dev8-python:latest code-server --version || {
        log_error "code-server not found"
        return 1
    }
    
    log_success "Python image tests passed"
}

###############################################################################
# Test Fullstack image
###############################################################################
test_fullstack() {
    log_info "Testing dev8-fullstack image..."
    
    # Test Node.js
    docker run --rm dev8-fullstack:latest node --version || {
        log_error "Node.js not found"
        return 1
    }
    
    # Test Python
    docker run --rm dev8-fullstack:latest python --version || {
        log_error "Python not found"
        return 1
    }
    
    # Test Go
    docker run --rm dev8-fullstack:latest go version || {
        log_error "Go not found"
        return 1
    }
    
    # Test Rust
    docker run --rm dev8-fullstack:latest rustc --version || {
        log_error "Rust not found"
        return 1
    }
    
    # Test code-server
    docker run --rm dev8-fullstack:latest code-server --version || {
        log_error "code-server not found"
        return 1
    }
    
    log_success "Fullstack image tests passed"
}

###############################################################################
# Test DevCopilot Agent
###############################################################################
test_devcopilot_agent() {
    log_info "Testing DevCopilot Agent functionality..."
    
    local image="${1:-dev8-nodejs:latest}"
    local container_name="test-devcopilot-$$"
    
    # Start container with environment variables
    docker run -d --rm \
        --name "$container_name" \
        -e GITHUB_TOKEN="$TEST_GITHUB_TOKEN" \
        -e SSH_PUBLIC_KEY="$TEST_SSH_KEY" \
        -e GIT_USER_NAME="Test User" \
        -e GIT_USER_EMAIL="test@dev8.dev" \
        "$image" \
        tail -f /dev/null
    
    sleep 10  # Wait for initialization
    
    # Test SSH configuration
    docker exec "$container_name" bash -c "test -f /home/dev8/.ssh/authorized_keys" || {
        log_error "SSH keys not configured"
        docker rm -f "$container_name"
        return 1
    }
    
    # Test Git configuration
    docker exec "$container_name" bash -c "git config --global user.name" || {
        log_error "Git not configured"
        docker rm -f "$container_name"
        return 1
    }
    
    # Cleanup
    docker rm -f "$container_name"
    
    log_success "DevCopilot Agent tests passed"
}

###############################################################################
# Test security
###############################################################################
test_security() {
    log_info "Running security tests..."
    
    local image="${1:-dev8-nodejs:latest}"
    
    # Test non-root user
    local user=$(docker run --rm "$image" whoami)
    if [ "$user" != "dev8" ]; then
        log_error "Container not running as dev8 user (running as: $user)"
        return 1
    fi
    
    # Test SSH configuration
    docker run --rm "$image" bash -c "grep 'PermitRootLogin no' /etc/ssh/sshd_config" || {
        log_error "SSH root login not disabled"
        return 1
    }
    
    docker run --rm "$image" bash -c "grep 'PasswordAuthentication no' /etc/ssh/sshd_config" || {
        log_error "SSH password authentication not disabled"
        return 1
    }
    
    log_success "Security tests passed"
}

###############################################################################
# Integration test - full workflow
###############################################################################
test_integration() {
    log_info "Running integration test..."
    
    local image="${1:-dev8-nodejs:latest}"
    local container_name="test-integration-$$"
    local test_workspace="$(pwd)/test-workspace-$$"
    
    mkdir -p "$test_workspace"
    
    # Create a simple project
    cat > "$test_workspace/test.js" <<EOF
console.log('Hello from Dev8.dev!');
EOF
    
    # Start container
    docker run -d --rm \
        --name "$container_name" \
        -p 8080:8080 \
        -p 2222:2222 \
        -e GITHUB_TOKEN="$TEST_GITHUB_TOKEN" \
        -v "$test_workspace:/workspace" \
        "$image"
    
    sleep 15  # Wait for services to start
    
    # Test code-server is running
    if curl -f -s http://localhost:8080/healthz > /dev/null 2>&1; then
        log_success "code-server is accessible"
    else
        log_warning "code-server health check failed (may need more time)"
    fi
    
    # Test workspace mount
    docker exec "$container_name" bash -c "test -f /workspace/test.js" || {
        log_error "Workspace not mounted correctly"
        docker rm -f "$container_name"
        rm -rf "$test_workspace"
        return 1
    }
    
    # Test Node.js execution
    docker exec "$container_name" bash -c "node /workspace/test.js" || {
        log_error "Failed to execute Node.js code"
        docker rm -f "$container_name"
        rm -rf "$test_workspace"
        return 1
    }
    
    # Cleanup
    docker rm -f "$container_name"
    rm -rf "$test_workspace"
    
    log_success "Integration test passed"
}

###############################################################################
# Main test runner
###############################################################################
main() {
    log_info "Starting Dev8.dev Docker Images Tests"
    log_info "=================================================="
    echo ""
    
    local failed=0
    
    # Test base image
    if docker images | grep -q "dev8-base"; then
        test_base || failed=$((failed + 1))
        test_security "dev8-base:latest" || failed=$((failed + 1))
    else
        log_warning "dev8-base image not found, skipping tests"
    fi
    
    echo ""
    
    # Test Node.js image
    if docker images | grep -q "dev8-nodejs"; then
        test_nodejs || failed=$((failed + 1))
        test_devcopilot_agent "dev8-nodejs:latest" || failed=$((failed + 1))
        test_security "dev8-nodejs:latest" || failed=$((failed + 1))
        test_integration "dev8-nodejs:latest" || failed=$((failed + 1))
    else
        log_warning "dev8-nodejs image not found, skipping tests"
    fi
    
    echo ""
    
    # Test Python image
    if docker images | grep -q "dev8-python"; then
        test_python || failed=$((failed + 1))
        test_security "dev8-python:latest" || failed=$((failed + 1))
    else
        log_warning "dev8-python image not found, skipping tests"
    fi
    
    echo ""
    
    # Test Fullstack image
    if docker images | grep -q "dev8-fullstack"; then
        test_fullstack || failed=$((failed + 1))
        test_security "dev8-fullstack:latest" || failed=$((failed + 1))
    else
        log_warning "dev8-fullstack image not found, skipping tests"
    fi
    
    echo ""
    log_info "=================================================="
    
    if [ $failed -eq 0 ]; then
        log_success "All tests passed! ✅"
        exit 0
    else
        log_error "$failed test(s) failed ❌"
        exit 1
    fi
}

# Run tests
main
