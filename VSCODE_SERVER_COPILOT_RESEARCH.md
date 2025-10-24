# Docker VS Code Server with GitHub Copilot Support - Research Summary

**Date:** October 20, 2025  
**Research Tool:** Firecrawl MCP

## Executive Summary

Running GitHub Copilot in a Docker-based VS Code Server environment is **possible but requires specific approaches**. The main challenge is that Microsoft's official VS Code extensions (including Copilot) are typically restricted to official VS Code installations.

## Solutions Overview

### 1. **Official VS Code Server Approach (Recommended)**
**Repository:** https://github.com/nerasse/my-code-server

This solution uses the **official VS Code Server binary** rather than third-party implementations:

- ✅ **Full Copilot Support** - Including Copilot Chat
- ✅ **All Extensions Working** - Uses official VS Code Server
- ✅ **Docker-based** - Easy deployment with Docker/Docker Compose
- ✅ **Production-ready** - 92 stars, actively maintained

**Key Features:**
- Base image: Debian (lightweight and stable)
- Uses VS Code's `serve-web` feature
- Includes Dockerfile and docker-compose.yml
- Supports authentication via tokens
- Reverse proxy compatible (Nginx examples provided)

**Setup:**
```bash
# Pull pre-built image
docker pull ghcr.io/nerasse/my-code-server:main

# Or build yourself
docker build -t my-code-server:main .

# Run with Docker
docker run -d -p 8585:8585 -e PORT=8585 -e TOKEN=sometoken my-code-server:main
```

**Access:**
```
http://host:8585?tkn=sometoken
```

### 2. **Code-Server (coder/code-server) Approach**

The popular `code-server` project has GitHub Copilot working **as of version 4.2.0+**:

**Status:** ✅ **Working** (as of latest versions)

**Installation Method:**
1. Download Copilot VSIX from VS Code Marketplace
2. Install via: `code-server --install-extension GitHub.copilot`
3. Or drag-and-drop VSIX file into code-server file tree and install

**Authentication:**
- Modern versions (4.9.1+) support standard GitHub auth flow
- No token extraction tricks needed anymore
- Follow normal sign-in prompts for GitHub 2FA

**Important Notes:**
- Copilot doesn't appear in the marketplace search
- Must manually install VSIX file
- Version 4.1.0 had auth issues (use 4.0.2, 4.2.0, or 4.9.1+)
- May need to remove conflicting GitHub-related extensions

### 3. **OpenVSCode Server**

**Repository:** https://github.com/gitpod-io/openvscode-server

- Maintained by Gitpod
- Runs upstream VS Code on remote machine
- Similar challenges with proprietary extensions
- Less documentation on Copilot support specifically

## Technical Challenges

### Extension Marketplace Restrictions
- GitHub Copilot is a **proprietary Microsoft extension**
- Not available in third-party extension marketplaces
- Requires manual VSIX installation

### Authentication Methods
Historical approaches (mostly deprecated):
1. ❌ Manual token extraction from desktop VS Code
2. ❌ URL manipulation with state tokens
3. ✅ **Current:** Standard OAuth flow (works in modern versions)

## Comparison Table

| Solution | Copilot Support | Ease of Setup | Docker Ready | Extension Compatibility |
|----------|----------------|---------------|--------------|------------------------|
| nerasse/my-code-server | ✅ Full | ⭐⭐⭐⭐⭐ | ✅ Yes | ✅ All extensions |
| coder/code-server | ✅ Yes (manual) | ⭐⭐⭐⭐ | ✅ Yes | ⚠️ Most extensions |
| OpenVSCode Server | ⚠️ Limited docs | ⭐⭐⭐ | ✅ Yes | ⚠️ Most extensions |

## Recommended Approach for Dev8.dev

For a project requiring Docker + VS Code Server + GitHub Copilot:

**Use `nerasse/my-code-server`** because:

1. **Official VS Code Server** - Most compatible with extensions
2. **Proven Copilot Support** - Tested with Copilot Chat
3. **Docker-native** - Already containerized
4. **Well-documented** - Clear setup instructions
5. **Actively maintained** - Latest update: August 2025
6. **WebSocket support** - Important for Copilot real-time features

## Implementation Example

```dockerfile
# Using nerasse's approach
FROM debian:bookworm

# Install VS Code Server official binary
RUN wget -O- https://aka.ms/install-vscode-server/setup.sh | sh

# Configure for web access
CMD ["code-server", "serve-web", "--host", "0.0.0.0", "--port", "8585"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  vscode-server:
    image: ghcr.io/nerasse/my-code-server:main
    ports:
      - "8585:8585"
    environment:
      - PORT=8585
      - TOKEN=your-secure-token
    volumes:
      - ./workspace:/workspace
    networks:
      - vscode-network

networks:
  vscode-network:
    driver: bridge
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server listening port | 8585 |
| HOST | Host interface | 0.0.0.0 |
| TOKEN | Authentication token | None |
| TOKEN_FILE | Path to token file | - |
| SERVER_DATA_DIR | Server data directory | - |
| VERBOSE | Enable verbose output | false |
| LOG_LEVEL | Log level | info |

## Nginx Reverse Proxy (for SSL)

```nginx
server {
    listen 443 ssl;
    server_name code.yourdomain.com;

    ssl_certificate /path/to/cert.crt;
    ssl_certificate_key /path/to/key.key;

    location / {
        proxy_pass http://vscode-server:8585;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # WebSocket support (critical for Copilot)
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Security Considerations

1. **Use strong authentication tokens**
2. **Deploy behind HTTPS/SSL**
3. **Keep VS Code Server updated**
4. **Restrict network access** where possible
5. **Review Copilot ToS** - Ensure compliance with GitHub's terms

## Legal/Licensing Notes

- GitHub Copilot is a **paid Microsoft service**
- Requires valid Copilot subscription
- Using Copilot outside official VS Code *may* have ToS implications
- The workarounds use official VS Code Server, so should be compliant
- **Recommendation:** Review GitHub Copilot Terms of Service

## References

1. **nerasse/my-code-server**: https://github.com/nerasse/my-code-server
2. **coder/code-server Discussion**: https://github.com/coder/code-server/discussions/4363
3. **VS Code Copilot Docs**: https://code.visualstudio.com/docs/copilot/overview
4. **Docker Copilot Docs**: https://docs.docker.com/copilot/

## Conclusion

✅ **Docker VS Code Server with GitHub Copilot IS achievable**

The best approach is to use the official VS Code Server binary (as demonstrated by nerasse/my-code-server) rather than third-party implementations. This ensures maximum compatibility with all VS Code extensions including GitHub Copilot and Copilot Chat.

For Dev8.dev, integrating this solution would provide:
- Full IDE experience in browser
- AI-assisted coding via Copilot
- Containerized development environment
- Team-friendly deployment options
