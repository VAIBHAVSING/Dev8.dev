# Dev8 AI Tools Bundle

A comprehensive bundle of AI development tools including GitHub CLI, GitHub Copilot, Azure CLI, and convenient CLI wrappers for popular AI APIs.

## Example Usage

```json
{
  "features": {
    "ghcr.io/dev8-community/devcontainer-features/ai-tools:1": {
      "installGithubCLI": true,
      "installCopilot": true,
      "installAzureCLI": true,
      "installYq": true,
      "installTmux": true,
      "setupShellAliases": true
    }
  }
}
```

## Options

| Option              | Type    | Default | Description                            |
| ------------------- | ------- | ------- | -------------------------------------- |
| `installGithubCLI`  | boolean | `true`  | Install GitHub CLI (gh)                |
| `installCopilot`    | boolean | `true`  | Install GitHub Copilot CLI extension   |
| `installAzureCLI`   | boolean | `true`  | Install Azure CLI (az)                 |
| `installYq`         | boolean | `true`  | Install yq YAML processor              |
| `installTmux`       | boolean | `true`  | Install tmux with custom configuration |
| `setupShellAliases` | boolean | `true`  | Setup convenient shell aliases         |

## What it includes

### Core Tools

- **GitHub CLI (gh)** - Official GitHub command-line tool
- **GitHub Copilot CLI** - AI-powered code suggestions and explanations
- **Azure CLI (az)** - Microsoft Azure command-line interface
- **yq** - YAML processor for configuration management
- **tmux** - Terminal multiplexer with custom Dev8 configuration

### AI CLI Wrappers

- **gpt** - CLI wrapper for OpenAI's GPT models
- **gemini** - CLI wrapper for Google's Gemini AI
- **claude** - Use with the `claude-cli` feature for Anthropic's Claude

### Shell Aliases

Convenient aliases for common AI-assisted workflows:

```bash
git-explain     # Explain recent git history with AI
commit-msg      # Generate commit messages from staged changes
review          # Get AI code review of current changes
explain         # Quick explanations from Claude
suggest         # GitHub Copilot suggestions
ghx             # GitHub Copilot explanations
```

## Usage Examples

### GitHub CLI & Copilot

```bash
# Authenticate GitHub CLI
gh auth login

# Setup Copilot
/usr/local/share/dev8-ai-tools/setup-copilot.sh

# Use Copilot
gh copilot suggest "create a REST API endpoint"
gh copilot explain "docker-compose up -d"
```

### OpenAI GPT

```bash
export OPENAI_API_KEY="your-key"
export GPT_MODEL="gpt-4"  # optional, defaults to gpt-4

gpt "Explain Docker containers"
echo "def hello():" | gpt "Complete this Python function"
```

### Google Gemini

```bash
export GEMINI_API_KEY="your-key"
export GEMINI_MODEL="gemini-pro"  # optional

gemini "What are DevContainers?"
cat code.py | gemini "Review this code"
```

### Azure CLI

```bash
# Login to Azure
az login

# List resources
azls  # alias for: az resource list --output table

# Deploy resources
az group create --name myResourceGroup --location eastus
```

### tmux

```bash
# Start tmux session
tmux

# Keyboard shortcuts (custom config):
# Ctrl-a |  - Split horizontally
# Ctrl-a -  - Split vertically
# Alt-Arrow - Navigate panes
# Ctrl-a r  - Reload config
```

## AI-Assisted Workflows

### Generate commit messages

```bash
# Stage your changes
git add .

# Generate and preview commit message
commit-msg

# Or manually:
git diff --staged | claude "Generate a commit message"
```

### Code review

```bash
# Review uncommitted changes
review

# Review a specific diff
git diff main...feature-branch | claude --system "You are a code reviewer" "Review this"
```

### Explain git history

```bash
git-explain

# Or manually:
git log --oneline -10 | claude "Explain this git history"
```

## Configuration

### API Keys

Set these environment variables in your `.bashrc`, `.zshrc`, or DevContainer configuration:

```bash
export GITHUB_TOKEN="ghp_..."
export OPENAI_API_KEY="sk-..."
export GEMINI_API_KEY="..."
export ANTHROPIC_API_KEY="sk-ant-..."
```

### tmux customization

Edit `~/.tmux.conf` to customize tmux behavior. The default configuration includes:

- Mouse support enabled
- Prefix key: `Ctrl-a`
- Easy pane splitting
- Status bar with timestamp

## Requirements

- Debian/Ubuntu-based container
- Internet access for API calls
- API keys for respective services

## Integration with Other Features

This feature works well with:

- `ghcr.io/dev8-community/devcontainer-features/supervisor:1` - Workspace monitoring
- `ghcr.io/dev8-community/devcontainer-features/claude-cli:1` - Enhanced Claude CLI

## More Information

- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub Copilot CLI](https://githubnext.com/projects/copilot-cli/)
- [Azure CLI Documentation](https://docs.microsoft.com/en-us/cli/azure/)
- [OpenAI API](https://platform.openai.com/docs)
- [Google Gemini API](https://ai.google.dev/)
