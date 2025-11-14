# Claude CLI

A command-line interface for interacting with Anthropic's Claude AI directly from your terminal.

## Example Usage

```json
{
  "features": {
    "ghcr.io/dev8-community/devcontainer-features/claude-cli:1": {
      "version": "1.0.0",
      "installShellCompletion": true
    }
  }
}
```

## Options

| Option                   | Type    | Default          | Description                               |
| ------------------------ | ------- | ---------------- | ----------------------------------------- |
| `version`                | string  | `1.0.0`          | Version of Claude CLI to install          |
| `installPath`            | string  | `/usr/local/bin` | Installation path for Claude CLI          |
| `installShellCompletion` | boolean | `true`           | Install shell completion for bash and zsh |

## What it does

The Claude CLI provides:

- **Direct API Access**: Interact with Claude AI from your terminal
- **Multiple Models**: Support for all Claude 3 models (Opus, Sonnet, Haiku)
- **Flexible Input**: Accept prompts as arguments or via stdin
- **System Prompts**: Customize Claude's behavior with system prompts
- **Shell Completion**: Tab completion for bash and zsh

## Usage

### Basic usage

```bash
claude "What is a DevContainer?"
```

### Pipe input

```bash
echo "Explain Docker" | claude
```

### Specify model

```bash
claude --model claude-3-opus-20240229 "Complex question"
```

### Use system prompt

```bash
claude --system "You are a helpful coding assistant" "Help me write Python"
```

### Available options

```bash
claude --help
```

## Configuration

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
# or
export CLAUDE_API_KEY="your-api-key-here"
```

Set default model:

```bash
export CLAUDE_MODEL="claude-3-5-sonnet-20241022"
```

## Available Models

- `claude-3-5-sonnet-20241022` (default) - Best balance of intelligence and speed
- `claude-3-opus-20240229` - Most capable model
- `claude-3-sonnet-20240229` - Balanced performance
- `claude-3-haiku-20240307` - Fastest model

## Examples

```bash
# Get code review
git diff | claude --system "You are a code reviewer" "Review this diff"

# Generate commit messages
git diff --staged | claude "Generate a commit message for these changes"

# Explain errors
npm test 2>&1 | claude "Explain these test failures"

# Interactive coding assistant
claude --system "You are a pair programming assistant" "How do I implement authentication?"
```

## Requirements

- `curl` - For making API requests
- `python3` - For JSON parsing
- Anthropic API key

## More Information

Get your API key at [console.anthropic.com](https://console.anthropic.com/)
