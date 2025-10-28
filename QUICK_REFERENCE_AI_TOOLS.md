# Quick Reference: AI Tools in Dev8.dev

**Last Updated:** October 24, 2025  
**Full Plan:** [VSCODE_SERVER_AI_CLI_INTEGRATION_PLAN.md](VSCODE_SERVER_AI_CLI_INTEGRATION_PLAN.md)

---

## 🚀 Quick Start

```bash
# Run container with all AI tools
docker run -it --rm \
  -p 8080:8080 -p 2222:2222 \
  -e GITHUB_TOKEN="ghp_yourtoken" \
  -e GEMINI_API_KEY="AIzaSy_yourkey" \
  -e ANTHROPIC_API_KEY="sk-ant_yourkey" \
  -e OPENAI_API_KEY="sk_yourkey" \
  -e SSH_PUBLIC_KEY="$(cat ~/.ssh/id_rsa.pub)" \
  -v $(pwd)/workspace:/workspace \
  dev8-workspace:latest
```

**Access:**

- VS Code: http://localhost:8080
- SSH: `ssh -p 2222 dev8@localhost`

---

## 🤖 AI Tools Quick Reference

### 1. GitHub Copilot CLI

```bash
# Suggest commands
gh copilot suggest "list all files"
gh copilot suggest "install nodejs"

# Explain commands
gh copilot explain "docker run -it ubuntu"
gh copilot explain "git rebase -i HEAD~5"
```

**Auth:** `GITHUB_TOKEN` (with copilot scope)

---

### 2. Gemini CLI

```bash
# Interactive mode
gemini

# Non-interactive
gemini -p "Explain this codebase"

# Specific model
gemini -m gemini-2.5-flash -p "Write tests"

# JSON output (for scripting)
gemini -p "Run tests" --output-format json
```

**Auth Options:**

- `GEMINI_API_KEY` - API key
- OR `GOOGLE_CLOUD_PROJECT` - Code Assist
- OR OAuth (browser login)

---

### 3. Claude (API Wrapper)

```bash
# Simple query
claude "Explain this code"

# With file content
claude "Debug this: $(cat error.log)"

# Custom model
CLAUDE_MODEL=claude-opus-4 claude "Complex algorithm"
```

**Auth:** `ANTHROPIC_API_KEY`

---

### 4. OpenAI Codex CLI

```bash
# Interactive mode
codex

# With prompt
codex "explain this codebase"

# With image
codex -i screenshot.png "Explain this error"

# Non-interactive (exec mode)
codex exec "fix the CI failure"

# Specific model
codex --model gpt-5-codex
```

**Auth Options:**

- `OPENAI_API_KEY` - API key
- OR ChatGPT Plus/Pro account

---

## 🔑 Environment Variables

| Variable               | Required? | Purpose               |
| ---------------------- | --------- | --------------------- |
| `GITHUB_TOKEN`         | ⭐ Yes    | Copilot + Copilot CLI |
| `SSH_PUBLIC_KEY`       | ⭐ Yes    | SSH access            |
| `GEMINI_API_KEY`       | Optional  | Gemini CLI            |
| `ANTHROPIC_API_KEY`    | Optional  | Claude wrapper        |
| `OPENAI_API_KEY`       | Optional  | Codex CLI             |
| `CODE_SERVER_PASSWORD` | Optional  | VS Code password      |

---

## 📚 Get API Keys

| Service      | URL                                         |
| ------------ | ------------------------------------------- |
| GitHub Token | https://github.com/settings/tokens          |
| Gemini API   | https://aistudio.google.com/apikey          |
| Claude API   | https://console.anthropic.com/settings/keys |
| OpenAI API   | https://platform.openai.com/api-keys        |

---

## 🧪 Quick Test

```bash
# Test all AI CLIs
gh copilot --version
gemini --version
claude "hello"
codex --version
```

---

## 📖 Full Documentation

See [VSCODE_SERVER_AI_CLI_INTEGRATION_PLAN.md](VSCODE_SERVER_AI_CLI_INTEGRATION_PLAN.md) for:

- Complete installation guide
- Authentication setup
- Troubleshooting
- Advanced usage
- Implementation timeline
