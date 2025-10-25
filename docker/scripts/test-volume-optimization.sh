#!/bin/bash
set -euo pipefail

# Test script to verify volume size optimization
# Run this after implementing the optimized Dockerfiles

echo "=== Dev8 Volume Size Optimization Test ==="
echo

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Stop and remove existing containers
echo "1. Cleaning up existing containers..."
docker compose -f docker/docker-compose.yml down -v 2>/dev/null || true
echo "   ✓ Cleaned up"
echo

# 2. Build optimized images
echo "2. Building optimized images..."
docker compose -f docker/docker-compose.yml build workspace
echo "   ✓ Build complete"
echo

# 3. Start container
echo "3. Starting container..."
docker compose -f docker/docker-compose.yml up -d workspace
sleep 10
echo "   ✓ Container started"
echo

# 4. Check volume sizes
echo "4. Checking volume sizes..."
echo
docker system df -v | grep -A 1 "VOLUME NAME" | grep -E "(VOLUME NAME|dev8)"
echo

# 5. Detailed breakdown of /home/dev8
echo "5. Analyzing /home/dev8 directory sizes..."
docker exec dev8-workspace du -sh /home/dev8/* 2>/dev/null | sort -hr || echo "   (container may need more time to start)"
echo

# 6. Check if tools are accessible
echo "6. Verifying pre-installed tools..."
echo -n "   Node.js: "
docker exec dev8-workspace node --version
echo -n "   Python: "
docker exec dev8-workspace python --version
echo -n "   Go: "
docker exec dev8-workspace go version | cut -d' ' -f3
echo -n "   Rust: "
docker exec dev8-workspace rustc --version | cut -d' ' -f2
echo -n "   Bun: "
docker exec dev8-workspace bun --version
echo

# 7. Test user package installation
echo "7. Testing user package installation..."
echo "   Installing a Rust package (cargo install should work)..."
docker exec dev8-workspace bash -c 'cargo install --quiet ripgrep 2>&1 | tail -5' || echo "   Note: This may take a while on first run"
echo

# 8. Check where packages were installed
echo "8. Verifying user package location..."
docker exec dev8-workspace bash -c 'which rg' 2>/dev/null && \
    echo "   ✓ ripgrep installed to user directory" || \
    echo "   Note: Package installation may still be in progress"
echo

# 9. Final volume size
echo "9. Final volume size after user package install..."
VOLUME_SIZE=$(docker system df -v | grep docker_dev8-home | awk '{print $3}')
echo -e "   docker_dev8-home: ${GREEN}${VOLUME_SIZE}${NC}"
echo

# 10. Compare with target
echo "=== Results Summary ==="
echo
TARGET_SIZE=100  # 100 MB target
CURRENT_SIZE=$(docker system df -v | grep docker_dev8-home | awk '{print $3}' | sed 's/MB//' | cut -d'.' -f1)

if [ -n "$CURRENT_SIZE" ] && [ "$CURRENT_SIZE" -lt 200 ]; then
    echo -e "${GREEN}✓ SUCCESS!${NC} Volume size is ${CURRENT_SIZE}MB (target: <200 MB)"
    echo "   Optimization is working correctly!"
elif [ -n "$CURRENT_SIZE" ] && [ "$CURRENT_SIZE" -lt 500 ]; then
    echo -e "${YELLOW}⚠ PARTIAL${NC} Volume size is ${CURRENT_SIZE}MB (target: <200 MB)"
    echo "   Some optimization is working, but there's room for improvement"
else
    echo -e "${RED}✗ FAILED${NC} Volume size is still large: ${CURRENT_SIZE}MB"
    echo "   Optimization may not be working correctly"
fi
echo

# 11. Cleanup option
read -p "Do you want to clean up test containers? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker compose -f docker/docker-compose.yml down
    echo "   ✓ Cleaned up"
else
    echo "   Container left running for inspection"
fi
