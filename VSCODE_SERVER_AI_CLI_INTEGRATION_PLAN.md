# VS Code Server with AI CLI Tools Integration Plan

**Created:** October 24, 2025  
**Status:** Planning Phase  
**Priority:** High  
**Related:** [VSCODE_SERVER_COPILOT_RESEARCH.md](VSCODE_SERVER_COPILOT_RESEARCH.md)

---

## 📋 Executive Summary

This document outlines the comprehensive plan to integrate VS Code Server with SSH support and multiple AI-powered CLI tools (GitHub Copilot CLI, Gemini CLI, Claude API, and OpenAI Codex CLI) into the Dev8.dev Docker environment. The plan focuses on installation and configuration of all tools, with credential injection mechanisms deferred for future implementation.

---

## 🎯 Goals and Objectives

### Primary Goals
1. ✅ **VS Code Server with SSH** - Browser-based VS Code accessible via SSH
2. ✅ **GitHub Copilot & Copilot CLI** - AI pair programming in IDE and terminal
3. ✅ **Gemini CLI** - Google's AI agent in terminal
4. ✅ **Claude API Integration** - Anthropic's Claude via API (CLI wrapper)
5. ✅ **OpenAI Codex CLI** - OpenAI's coding agent
6. ✅ **Proper Documentation** - Clean, consolidated docs in docker/

### Non-Goals (Future Work)
- ❌ Automatic credential injection (will use environment variables for MVP)
- ❌ Secret rotation/management (manual for now)
- ❌ Multi-user authentication system
- ❌ Integration with external secret vaults

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Dev8 Docker Container                        │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              VS Code Server (Port 8080)                     │ │
│  │  - Browser-based VS Code UI                                 │ │
│  │  - GitHub Copilot Extension                                 │ │
│  │  - GitHub Copilot Chat Extension                            │ │
│  │  - SSH access on Port 2222                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                   AI CLI Tools Layer                        │ │
│  │                                                              │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │ GitHub       │  │ Gemini CLI   │  │ OpenAI Codex    │  │ │
│  │  │ Copilot CLI  │  │              │  │ CLI             │  │ │
│  │  │              │  │              │  │                 │  │ │
│  │  │ `gh copilot` │  │ `gemini`     │  │ `codex`         │  │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘  │ │
│  │                                                              │ │
│  │  ┌──────────────────────────────────────────────────────┐  │ │
│  │  │ Claude API Wrapper (Custom Script)                   │  │ │
│  │  │ `claude` - Shell script calling Anthropic API        │  │ │
│  │  └──────────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Authentication & Credentials                   │ │
│  │                                                              │ │
│  │  Environment Variables:                                     │ │
│  │  - GITHUB_TOKEN          (Copilot + Copilot CLI)           │ │
│  │  - GEMINI_API_KEY        (Gemini CLI)                      │ │
│  │  - ANTHROPIC_API_KEY     (Claude API)                      │ │
│  │  - OPENAI_API_KEY        (Codex CLI)                       │ │
│  │  - SSH_PUBLIC_KEY        (SSH access)                      │ │
│  └────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
```

---

## 🔍 Research Summary

### VS Code Server Approaches

Based on research, there are multiple VS Code Server implementations:

| Solution | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| **Official VS Code Server** (via `code tunnel`) | ✅ Official Microsoft binary<br>✅ Full extension support<br>✅ Copilot compatible | ⚠️ Requires Microsoft account<br>⚠️ License restrictions | 🟡 Good for individual users |
| **code-server** (coder/code-server) | ✅ Popular & mature<br>✅ Docker-ready<br>✅ Copilot working (4.9.1+) | ⚠️ Manual VSIX install for Copilot<br>⚠️ Not all extensions work | ✅ **RECOMMENDED** for Dev8.dev |
| **nerasse/my-code-server** | ✅ Uses official VS Code binary<br>✅ Docker-native<br>✅ Full Copilot support | ⚠️ Less popular (92 stars)<br>⚠️ Single maintainer | 🟡 Alternative option |

**Decision:** Use **code-server** (coder/code-server) as the primary solution due to:
- Proven track record in production environments
- Active community support (65k+ stars)
- Working GitHub Copilot support
- Compatible with Dev8.dev's existing architecture

---

## 🛠️ Component Installation Guide

### 1. VS Code Server (code-server)

**Official Docs:** https://github.com/coder/code-server  
**Installation Method:** Docker image or standalone binary

#### Installation Steps
```dockerfile
# In docker/mvp/Dockerfile or new docker/vscode-server/Dockerfile

# Install code-server
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Or use specific version
RUN export VERSION=4.96.2 && \
    curl -fOL https://github.com/coder/code-server/releases/download/v${VERSION}/code-server_${VERSION}_amd64.deb && \
    dpkg -i code-server_${VERSION}_amd64.deb && \
    rm code-server_${VERSION}_amd64.deb
```

#### Configuration
```bash
# Config file location: ~/.config/code-server/config.yaml
bind-addr: 0.0.0.0:8080
auth: password
password: ${CODE_SERVER_PASSWORD:-dev8dev}
cert: false
```

#### Extensions to Pre-install
```bash
# GitHub Copilot (requires manual VSIX download)
code-server --install-extension GitHub.copilot
code-server --install-extension GitHub.copilot-chat

# Essential extensions
code-server --install-extension ms-python.python
code-server --install-extension dbaeumer.vscode-eslint
code-server --install-extension esbenp.prettier-vscode
```

---

### 2. GitHub Copilot CLI

**Official Docs:** https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli  
**Prerequisites:** Node.js 22+, npm 10+, GitHub Copilot subscription

#### Installation Steps
```dockerfile
# Ensure Node.js 20+ is installed (already in dev8-workspace)
RUN npm install -g @github/copilot
```

#### Authentication
```bash
# Method 1: GitHub CLI auth (RECOMMENDED)
echo "$GITHUB_TOKEN" | gh auth login --with-token

# Copilot CLI uses gh auth automatically
gh copilot suggest "list all files"
gh copilot explain "docker run command"
```

#### Environment Variables Needed
- `GITHUB_TOKEN` - Personal access token with `copilot` scope

---

### 3. Gemini CLI

**Official Repo:** https://github.com/google-gemini/gemini-cli  
**Installation:** npm, Homebrew, or npx  
**Prerequisites:** Node.js 20+

#### Installation Steps
```dockerfile
# Global installation
RUN npm install -g @google/gemini-cli

# Or use Homebrew (if available in container)
RUN brew install gemini-cli
```

#### Authentication Options
```bash
# Option 1: OAuth with Google Account (RECOMMENDED)
gemini  # Will prompt for browser login

# Option 2: Gemini API Key
export GEMINI_API_KEY="your-api-key"
gemini

# Option 3: Vertex AI (Enterprise)
export GOOGLE_API_KEY="your-api-key"
export GOOGLE_GENAI_USE_VERTEXAI=true
gemini
```

#### Environment Variables Needed
- `GEMINI_API_KEY` - API key from https://aistudio.google.com/apikey
- OR `GOOGLE_CLOUD_PROJECT` - For Code Assist license
- OR `GOOGLE_API_KEY` + `GOOGLE_GENAI_USE_VERTEXAI=true` - For Vertex AI

#### Usage Examples
```bash
# Interactive mode
gemini

# Non-interactive
gemini -p "Explain this codebase"

# With specific model
gemini -m gemini-2.5-flash

# JSON output for scripting
gemini -p "Run tests" --output-format json
```

---

### 4. Claude CLI (Custom Wrapper)

**Official API Docs:** https://docs.anthropic.com/en/docs/get-started  
**Note:** No official CLI exists; we'll create a wrapper script

#### Installation Steps
```bash
# Create wrapper script at /usr/local/bin/claude
cat > /usr/local/bin/claude << 'EOF'
#!/bin/bash
# Claude CLI Wrapper - Calls Anthropic API

set -e

API_KEY="${ANTHROPIC_API_KEY}"
MODEL="${CLAUDE_MODEL:-claude-sonnet-4-5}"
MAX_TOKENS="${CLAUDE_MAX_TOKENS:-4000}"

if [ -z "$API_KEY" ]; then
    echo "Error: ANTHROPIC_API_KEY not set" >&2
    exit 1
fi

if [ -z "$1" ]; then
    echo "Usage: claude <prompt>" >&2
    echo "Example: claude 'Explain this code'" >&2
    exit 1
fi

PROMPT="$*"

curl -s https://api.anthropic.com/v1/messages \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d "{
    \"model\": \"$MODEL\",
    \"max_tokens\": $MAX_TOKENS,
    \"messages\": [
      {
        \"role\": \"user\",
        \"content\": \"$PROMPT\"
      }
    ]
  }" | jq -r '.content[0].text'
EOF

chmod +x /usr/local/bin/claude
```

#### Environment Variables Needed
- `ANTHROPIC_API_KEY` - API key from https://console.anthropic.com/settings/keys
- `CLAUDE_MODEL` (optional) - Default: `claude-sonnet-4-5`
- `CLAUDE_MAX_TOKENS` (optional) - Default: `4000`

#### Usage Examples
```bash
claude "Explain this code"
claude "Debug this error: $(cat error.log)"

# With custom model
CLAUDE_MODEL=claude-opus-4 claude "Write a complex algorithm"
```

---

### 5. OpenAI Codex CLI

**Official Docs:** https://developers.openai.com/codex/cli/  
**Prerequisites:** Node.js 20+, npm, OpenAI API key or ChatGPT account

#### Installation Steps
```dockerfile
# Install via npm
RUN npm install -g @openai/codex

# Or via Homebrew
RUN brew install codex
```

#### Authentication Options
```bash
# Option 1: ChatGPT Account (RECOMMENDED)
codex  # Will prompt for browser login

# Option 2: API Key
export OPENAI_API_KEY="your-api-key"
codex --model gpt-5-codex
```

#### Environment Variables Needed
- `OPENAI_API_KEY` - API key from https://platform.openai.com/api-keys
- OR ChatGPT Plus/Pro/Team/Enterprise subscription

#### Usage Examples
```bash
# Interactive mode
codex

# With prompt
codex "explain this codebase"

# With image input
codex -i screenshot.png "Explain this error"

# Non-interactive (scripting)
codex exec "fix the CI failure"

# Specific model
codex --model gpt-5-codex
```

---

## 🏗️ Implementation Plan

### Phase 1: VS Code Server Setup (Week 1)

**Goal:** Get code-server running with SSH access in Docker

#### Tasks
- [ ] 1.1 Create new `docker/vscode-server/Dockerfile` (or update `docker/mvp/Dockerfile`)
- [ ] 1.2 Install code-server binary
- [ ] 1.3 Configure SSH server on port 2222
- [ ] 1.4 Set up entrypoint script for initialization
- [ ] 1.5 Test code-server access via browser (port 8080)
- [ ] 1.6 Test SSH access (port 2222)
- [ ] 1.7 Create docker-compose.yml entry

#### Deliverables
```dockerfile
# docker/vscode-server/Dockerfile
FROM dev8-base:latest

# Install code-server
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Configure SSH
RUN mkdir -p /home/dev8/.ssh && \
    chown -R dev8:dev8 /home/dev8/.ssh && \
    chmod 700 /home/dev8/.ssh

# Install basic extensions
USER dev8
RUN code-server --install-extension ms-python.python && \
    code-server --install-extension dbaeumer.vscode-eslint

EXPOSE 8080 2222

ENTRYPOINT ["/usr/local/bin/vscode-entrypoint.sh"]
```

---

### Phase 2: GitHub Copilot Integration (Week 2)

**Goal:** Get Copilot and Copilot CLI working in container

#### Tasks
- [ ] 2.1 Install GitHub Copilot extension (manual VSIX if needed)
- [ ] 2.2 Install Copilot Chat extension
- [ ] 2.3 Install `@github/copilot` npm package (Copilot CLI)
- [ ] 2.4 Set up GitHub CLI authentication in entrypoint
- [ ] 2.5 Test Copilot in VS Code UI
- [ ] 2.6 Test `gh copilot` commands in terminal
- [ ] 2.7 Document authentication flow

#### Authentication Flow
```bash
# In entrypoint script
if [ -n "$GITHUB_TOKEN" ]; then
    echo "Authenticating GitHub CLI..."
    echo "$GITHUB_TOKEN" | gh auth login --with-token
    
    # Verify Copilot CLI
    gh copilot --version || npm install -g @github/copilot
fi
```

#### Required Environment Variables
- `GITHUB_TOKEN` - Token with `repo` and `copilot` scopes

---

### Phase 3: Gemini CLI Integration (Week 3)

**Goal:** Add Google Gemini CLI to container

#### Tasks
- [ ] 3.1 Install Gemini CLI via npm
- [ ] 3.2 Set up authentication in entrypoint (API key or OAuth)
- [ ] 3.3 Test interactive mode
- [ ] 3.4 Test non-interactive/scripting mode
- [ ] 3.5 Create usage examples
- [ ] 3.6 Document authentication options

#### Installation in Dockerfile
```dockerfile
# Install Gemini CLI
RUN npm install -g @google/gemini-cli
```

#### Entrypoint Configuration
```bash
# In entrypoint script
if [ -n "$GEMINI_API_KEY" ]; then
    echo "Gemini CLI configured with API key"
    export GEMINI_API_KEY
elif [ -n "$GOOGLE_CLOUD_PROJECT" ]; then
    echo "Gemini CLI configured with Code Assist license"
    export GOOGLE_CLOUD_PROJECT
fi
```

---

### Phase 4: Claude & Codex CLI Integration (Week 4)

**Goal:** Add Claude wrapper and Codex CLI

#### Tasks - Claude
- [ ] 4.1 Create `/usr/local/bin/claude` wrapper script
- [ ] 4.2 Test Claude API calls
- [ ] 4.3 Add jq dependency for JSON parsing
- [ ] 4.4 Create usage examples
- [ ] 4.5 Document API key setup

#### Tasks - Codex
- [ ] 4.6 Install OpenAI Codex CLI via npm
- [ ] 4.7 Set up authentication (API key or ChatGPT account)
- [ ] 4.8 Test interactive mode
- [ ] 4.9 Test exec mode (non-interactive)
- [ ] 4.10 Document usage patterns

#### Installation in Dockerfile
```dockerfile
# Install jq for Claude wrapper
RUN apt-get update && apt-get install -y jq

# Install Codex CLI
RUN npm install -g @openai/codex

# Add Claude wrapper
COPY scripts/claude.sh /usr/local/bin/claude
RUN chmod +x /usr/local/bin/claude
```

---

### Phase 5: Documentation & Testing (Week 5)

**Goal:** Clean documentation and comprehensive testing

#### Tasks - Documentation
- [ ] 5.1 Create `docker/vscode-server/README.md` with full guide
- [ ] 5.2 Update main `docker/README.md` with VS Code Server section
- [ ] 5.3 Remove excessive/redundant READMEs
- [ ] 5.4 Create AI CLI usage guide in `docker/docs/AI_CLI_GUIDE.md`
- [ ] 5.5 Document all environment variables in one place
- [ ] 5.6 Create troubleshooting guide

#### Tasks - Testing
- [ ] 5.7 Test all AI CLIs in container
- [ ] 5.8 Test VS Code Server with extensions
- [ ] 5.9 Test SSH access
- [ ] 5.10 Create automated test script
- [ ] 5.11 Test with different authentication methods
- [ ] 5.12 Document common issues and solutions

#### Documentation Structure
```
docker/
├── README.md                    # Main overview (updated)
├── ARCHITECTURE.md              # Architecture (updated)
├── vscode-server/
│   ├── Dockerfile
│   ├── README.md                # NEW: VS Code Server specific guide
│   ├── entrypoint.sh
│   └── docker-compose.yml
├── docs/                        # NEW: Consolidated docs
│   ├── AI_CLI_GUIDE.md          # NEW: AI tools usage guide
│   ├── ENVIRONMENT_VARS.md      # NEW: All env vars reference
│   ├── TROUBLESHOOTING.md       # NEW: Common issues
│   └── SSH_ACCESS.md            # NEW: SSH configuration
└── scripts/
    └── claude.sh                # NEW: Claude API wrapper
```

---

## 📦 Dockerfile Structure

### Option A: Single Unified Image (RECOMMENDED)

Extend existing `docker/mvp/Dockerfile` to include VS Code Server + AI CLIs

**Pros:**
- ✅ Single image to maintain
- ✅ Consistent with current architecture
- ✅ All tools pre-installed

**Cons:**
- ⚠️ Larger image size (~4.5GB)
- ⚠️ Longer build time

```dockerfile
# docker/mvp/Dockerfile (updated)
FROM dev8-base:latest

# ... existing Node, Python, Go, Rust installation ...

# Install VS Code Server
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Install AI CLI tools
RUN npm install -g @github/copilot \
                   @google/gemini-cli \
                   @openai/codex

# Install dependencies for Claude wrapper
RUN apt-get update && apt-get install -y jq

# Copy Claude wrapper
COPY docker/scripts/claude.sh /usr/local/bin/claude
RUN chmod +x /usr/local/bin/claude

# ... rest of existing setup ...
```

### Option B: Separate VS Code Server Image

Create new `docker/vscode-server/Dockerfile` that builds on `dev8-base`

**Pros:**
- ✅ Modular architecture
- ✅ Can be used independently
- ✅ Faster iteration during development

**Cons:**
- ⚠️ More images to maintain
- ⚠️ Need to decide which image to use

```dockerfile
# docker/vscode-server/Dockerfile
FROM dev8-base:latest

# Install code-server
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Install Node.js 20 (if not in base)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install AI CLI tools
RUN npm install -g @github/copilot \
                   @google/gemini-cli \
                   @openai/codex

# Install jq for Claude
RUN apt-get update && apt-get install -y jq && rm -rf /var/lib/apt/lists/*

# Copy scripts
COPY docker/scripts/claude.sh /usr/local/bin/claude
COPY docker/vscode-server/entrypoint.sh /usr/local/bin/vscode-entrypoint.sh
RUN chmod +x /usr/local/bin/claude /usr/local/bin/vscode-entrypoint.sh

# Configure code-server
RUN mkdir -p /home/dev8/.config/code-server
COPY docker/vscode-server/config.yaml /home/dev8/.config/code-server/config.yaml
RUN chown -R dev8:dev8 /home/dev8/.config

USER dev8
WORKDIR /workspace

EXPOSE 8080 2222

ENTRYPOINT ["/usr/local/bin/vscode-entrypoint.sh"]
```

**Decision:** Recommend **Option A** (unified image) to maintain consistency with existing architecture.

---

## 🔐 Environment Variables Reference

### Required Variables

| Variable | Purpose | Example | Where to Get |
|----------|---------|---------|--------------|
| `GITHUB_TOKEN` | GitHub Copilot + Copilot CLI | `ghp_xxxxxxxxxxxx` | https://github.com/settings/tokens |
| `SSH_PUBLIC_KEY` | SSH access to container | `ssh-rsa AAAAB3...` | `cat ~/.ssh/id_rsa.pub` |

### Optional AI CLI Variables

| Variable | Purpose | Example | Where to Get |
|----------|---------|---------|--------------|
| `GEMINI_API_KEY` | Gemini CLI (API auth) | `AIzaSyXXXXXXXX` | https://aistudio.google.com/apikey |
| `GOOGLE_CLOUD_PROJECT` | Gemini CLI (Code Assist) | `my-project-id` | Google Cloud Console |
| `ANTHROPIC_API_KEY` | Claude API wrapper | `sk-ant-XXXXXXXX` | https://console.anthropic.com/settings/keys |
| `OPENAI_API_KEY` | Codex CLI (API auth) | `sk-XXXXXXXXXXXX` | https://platform.openai.com/api-keys |

### Optional Configuration Variables

| Variable | Purpose | Default |
|----------|---------|---------|
| `CODE_SERVER_PASSWORD` | code-server web UI password | `dev8dev` |
| `CODE_SERVER_AUTH` | Auth method: `password` or `none` | `password` |
| `CLAUDE_MODEL` | Claude model version | `claude-sonnet-4-5` |
| `CLAUDE_MAX_TOKENS` | Claude response length | `4000` |

### Usage Example

```bash
docker run -it --rm \
  -p 8080:8080 \
  -p 2222:2222 \
  -e GITHUB_TOKEN="ghp_yourtoken" \
  -e GEMINI_API_KEY="AIzaSy_yourkey" \
  -e ANTHROPIC_API_KEY="sk-ant_yourkey" \
  -e OPENAI_API_KEY="sk_yourkey" \
  -e SSH_PUBLIC_KEY="$(cat ~/.ssh/id_rsa.pub)" \
  -e CODE_SERVER_PASSWORD="your_secure_password" \
  -v $(pwd)/workspace:/workspace \
  dev8-workspace:latest
```

---

## 🧪 Testing Strategy

### Manual Testing Checklist

#### VS Code Server Tests
- [ ] Access code-server at http://localhost:8080
- [ ] Authenticate with configured password
- [ ] Open workspace folder
- [ ] Create and edit a file
- [ ] Test terminal access in VS Code
- [ ] Verify extensions are installed
- [ ] Test GitHub Copilot suggestions
- [ ] Test Copilot Chat

#### SSH Access Tests
- [ ] SSH into container: `ssh -p 2222 dev8@localhost`
- [ ] Verify user permissions
- [ ] Test file creation/modification
- [ ] Run commands as dev8 user

#### AI CLI Tests
```bash
# GitHub Copilot CLI
gh copilot suggest "list all files"
gh copilot explain "docker run -it ubuntu"

# Gemini CLI
gemini -p "Explain this codebase"
gemini  # Interactive mode

# Claude wrapper
claude "What is Docker?"
claude "Explain this error: $(cat error.log)"

# Codex CLI
codex "explain this codebase"
codex exec "run tests"
```

### Automated Test Script

```bash
#!/bin/bash
# docker/test-ai-tools.sh

set -e

echo "Testing VS Code Server + AI CLI Integration"
echo "==========================================="

# Test 1: VS Code Server running
echo "Test 1: VS Code Server is running..."
curl -s http://localhost:8080 > /dev/null && echo "✅ PASS" || echo "❌ FAIL"

# Test 2: SSH access
echo "Test 2: SSH access..."
ssh -p 2222 -o StrictHostKeyChecking=no dev8@localhost "echo 'SSH OK'" && echo "✅ PASS" || echo "❌ FAIL"

# Test 3: GitHub Copilot CLI
echo "Test 3: GitHub Copilot CLI..."
gh copilot --version > /dev/null 2>&1 && echo "✅ PASS" || echo "❌ FAIL"

# Test 4: Gemini CLI
echo "Test 4: Gemini CLI..."
command -v gemini > /dev/null 2>&1 && echo "✅ PASS" || echo "❌ FAIL"

# Test 5: Claude wrapper
echo "Test 5: Claude wrapper..."
command -v claude > /dev/null 2>&1 && echo "✅ PASS" || echo "❌ FAIL"

# Test 6: Codex CLI
echo "Test 6: Codex CLI..."
command -v codex > /dev/null 2>&1 && echo "✅ PASS" || echo "❌ FAIL"

echo ""
echo "All tests completed!"
```

---

## 📚 Documentation Cleanup Plan

### Current State
- Multiple redundant README files scattered across docker/
- Inconsistent documentation style
- Missing comprehensive guides
- No single source of truth for configuration

### Target State
```
docker/
├── README.md                              # Main overview & quick start
├── ARCHITECTURE.md                        # System architecture
├── CHANGELOG.md                           # Version history
├── vscode-server/
│   ├── Dockerfile
│   ├── README.md                          # VS Code Server specific setup
│   ├── config.yaml
│   ├── entrypoint.sh
│   └── docker-compose.yml
├── docs/                                  # Consolidated documentation
│   ├── AI_CLI_GUIDE.md                    # How to use all AI CLIs
│   ├── ENVIRONMENT_VARS.md                # Complete env var reference
│   ├── TROUBLESHOOTING.md                 # Common issues & solutions
│   ├── SSH_CONFIGURATION.md               # SSH setup guide
│   └── EXTENSION_INSTALLATION.md          # VS Code extensions guide
└── scripts/
    ├── claude.sh                          # Claude API wrapper
    └── test-ai-tools.sh                   # Automated tests
```

### Files to Remove/Consolidate
- [ ] `docker/DOCKER_BUILD_FIX_SUMMARY.md` → Archive or remove
- [ ] `docker/DOCKER_COMPOSE_FIX.md` → Archive or remove
- [ ] `docker/DOCKER_SUCCESS_SUMMARY.md` → Archive or remove
- [ ] Multiple implementation summaries → Consolidate into CHANGELOG.md

### Documentation Principles
1. **Single Source of Truth** - Each topic documented in one place
2. **Clear Hierarchy** - Main README → Specific guides → Reference docs
3. **Practical Examples** - Every feature with working example
4. **Troubleshooting First** - Common issues prominently documented
5. **Keep Updated** - Version numbers, links, commands all current

---

## 🚀 Future Enhancements (Post-MVP)

### Phase 6: Credential Injection (Future)
- [ ] Integration with HashiCorp Vault
- [ ] Azure Key Vault support
- [ ] AWS Secrets Manager integration
- [ ] Automatic credential rotation
- [ ] Secure credential storage in container

### Phase 7: Advanced Features (Future)
- [ ] VS Code Server remote tunneling
- [ ] Multi-user support with separate workspaces
- [ ] Persistent settings sync
- [ ] Custom extension marketplace
- [ ] Integration with Dev8.dev web UI
- [ ] Workspace templates with pre-configured AI tools

### Phase 8: Security Hardening (Future)
- [ ] Non-root user enforcement
- [ ] Network policies for AI API calls
- [ ] Rate limiting for AI CLI usage
- [ ] Audit logging for all AI interactions
- [ ] Compliance scanning (SOC2, GDPR)

---

## 📊 Success Criteria

### MVP Success Metrics
- ✅ VS Code Server accessible via browser with <2s load time
- ✅ SSH access working on port 2222
- ✅ All 5 AI CLI tools installed and functional
- ✅ GitHub Copilot providing suggestions in VS Code
- ✅ Authentication working for all AI services
- ✅ Documentation consolidated and complete
- ✅ Docker image builds successfully in <15 minutes
- ✅ Image size <5GB
- ✅ All tests passing

### User Experience Goals
- 🎯 One-command container startup
- 🎯 Clear error messages for missing credentials
- 🎯 Comprehensive troubleshooting guide
- 🎯 Working examples for every AI CLI
- 🎯 Fast container startup (<30 seconds warm)

---

## 🔗 References

### Official Documentation
- **VS Code Server:** https://code.visualstudio.com/docs/remote/vscode-server
- **code-server:** https://github.com/coder/code-server
- **GitHub Copilot CLI:** https://docs.github.com/en/copilot/how-tos/set-up/install-copilot-cli
- **Gemini CLI:** https://github.com/google-gemini/gemini-cli
- **Claude API:** https://docs.anthropic.com/en/docs/get-started
- **OpenAI Codex CLI:** https://developers.openai.com/codex/cli/

### Related Dev8.dev Documents
- [VSCODE_SERVER_COPILOT_RESEARCH.md](VSCODE_SERVER_COPILOT_RESEARCH.md)
- [docker/README.md](docker/README.md)
- [docker/ARCHITECTURE.md](docker/ARCHITECTURE.md)
- [WORKSPACE_MANAGER_PLAN.md](WORKSPACE_MANAGER_PLAN.md)

### Community Resources
- code-server Copilot discussion: https://github.com/coder/code-server/discussions/4363
- nerasse/my-code-server: https://github.com/nerasse/my-code-server
- VS Code Remote Development: https://code.visualstudio.com/docs/remote/remote-overview

---

## 📅 Timeline Summary

| Phase | Duration | Focus | Status |
|-------|----------|-------|--------|
| Phase 1 | Week 1 | VS Code Server + SSH | 📋 Planned |
| Phase 2 | Week 2 | GitHub Copilot Integration | 📋 Planned |
| Phase 3 | Week 3 | Gemini CLI Integration | 📋 Planned |
| Phase 4 | Week 4 | Claude + Codex CLI | 📋 Planned |
| Phase 5 | Week 5 | Documentation & Testing | 📋 Planned |
| **Total** | **5 weeks** | **Full MVP** | 📋 Planned |

---

## ✅ Next Steps

1. **Review this plan** with the team
2. **Create GitHub issues** for each phase
3. **Set up project board** for tracking
4. **Begin Phase 1** implementation
5. **Establish testing cadence** (daily smoke tests)

---

**Document Status:** ✅ Complete  
**Last Updated:** October 24, 2025  
**Version:** 1.0  
**Author:** Dev8.dev Team (via AI Research)
