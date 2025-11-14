#!/bin/bash
set -e

# Claude CLI Installation Script
# Provides a command-line interface for Anthropic's Claude AI

VERSION=${VERSION:-"1.0.0"}
INSTALL_PATH=${INSTALLPATH:-"/usr/local/bin"}
INSTALL_SHELL_COMPLETION=${INSTALLSHELLCOMPLETION:-"true"}

echo "Installing Claude CLI..."

# Create the claude CLI wrapper script
cat > "$INSTALL_PATH/claude" << 'CLAUDE_SCRIPT'
#!/bin/bash
# Claude CLI - Command-line interface for Anthropic's Claude AI
# Version: 1.0.0

set -e

CLAUDE_API_KEY="${CLAUDE_API_KEY:-${ANTHROPIC_API_KEY}}"
CLAUDE_MODEL="${CLAUDE_MODEL:-claude-3-5-sonnet-20241022}"
CLAUDE_API_URL="${CLAUDE_API_URL:-https://api.anthropic.com/v1/messages}"

show_help() {
    cat << EOF
Claude CLI - Command-line interface for Anthropic's Claude AI

Usage:
  claude [OPTIONS] <prompt>
  echo "prompt" | claude [OPTIONS]

Options:
  -m, --model MODEL       Claude model to use (default: $CLAUDE_MODEL)
  -t, --temperature N     Temperature for responses (0.0-1.0, default: 1.0)
  -k, --api-key KEY       Anthropic API key (or set CLAUDE_API_KEY env var)
  --max-tokens N          Maximum tokens in response (default: 4096)
  --system TEXT           System prompt to guide Claude's behavior
  -h, --help              Show this help message

Environment Variables:
  CLAUDE_API_KEY          Anthropic API key
  ANTHROPIC_API_KEY       Alternative API key variable
  CLAUDE_MODEL            Default model to use
  CLAUDE_API_URL          API endpoint URL

Examples:
  claude "What is DevContainer?"
  echo "Explain Docker" | claude
  claude --model claude-3-opus-20240229 "Complex question"
  claude --system "You are a helpful coding assistant" "Help with Python"

EOF
}

# Parse arguments
PROMPT=""
TEMPERATURE="1.0"
MAX_TOKENS="4096"
SYSTEM_PROMPT=""
API_KEY="$CLAUDE_API_KEY"

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -m|--model)
            CLAUDE_MODEL="$2"
            shift 2
            ;;
        -t|--temperature)
            TEMPERATURE="$2"
            shift 2
            ;;
        -k|--api-key)
            API_KEY="$2"
            shift 2
            ;;
        --max-tokens)
            MAX_TOKENS="$2"
            shift 2
            ;;
        --system)
            SYSTEM_PROMPT="$2"
            shift 2
            ;;
        -*)
            echo "Unknown option: $1" >&2
            echo "Use --help for usage information" >&2
            exit 1
            ;;
        *)
            PROMPT="$1"
            shift
            ;;
    esac
done

# Read from stdin if no prompt provided
if [ -z "$PROMPT" ] && [ ! -t 0 ]; then
    PROMPT=$(cat)
fi

# Validate inputs
if [ -z "$PROMPT" ]; then
    echo "Error: No prompt provided" >&2
    echo "Use --help for usage information" >&2
    exit 1
fi

if [ -z "$API_KEY" ]; then
    echo "Error: API key not found" >&2
    echo "Set CLAUDE_API_KEY or ANTHROPIC_API_KEY environment variable, or use --api-key option" >&2
    exit 1
fi

# Escape JSON strings
json_escape() {
    python3 -c 'import json, sys; print(json.dumps(sys.stdin.read()))'
}

# Build JSON payload
ESCAPED_PROMPT=$(echo "$PROMPT" | json_escape)

if [ -n "$SYSTEM_PROMPT" ]; then
    ESCAPED_SYSTEM=$(echo "$SYSTEM_PROMPT" | json_escape)
    JSON_PAYLOAD=$(cat <<EOF
{
  "model": "$CLAUDE_MODEL",
  "max_tokens": $MAX_TOKENS,
  "temperature": $TEMPERATURE,
  "system": $ESCAPED_SYSTEM,
  "messages": [
    {
      "role": "user",
      "content": $ESCAPED_PROMPT
    }
  ]
}
EOF
)
else
    JSON_PAYLOAD=$(cat <<EOF
{
  "model": "$CLAUDE_MODEL",
  "max_tokens": $MAX_TOKENS,
  "temperature": $TEMPERATURE,
  "messages": [
    {
      "role": "user",
      "content": $ESCAPED_PROMPT
    }
  ]
}
EOF
)
fi

# Make API request
RESPONSE=$(curl -s -w "\n%{http_code}" "$CLAUDE_API_URL" \
    -H "Content-Type: application/json" \
    -H "x-api-key: $API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -d "$JSON_PAYLOAD")

# Extract HTTP status code
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

# Check for errors
if [ "$HTTP_CODE" != "200" ]; then
    echo "Error: API request failed with status $HTTP_CODE" >&2
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY" >&2
    exit 1
fi

# Extract and display the response
echo "$BODY" | python3 -c '
import json, sys
try:
    data = json.load(sys.stdin)
    if "content" in data and len(data["content"]) > 0:
        print(data["content"][0]["text"])
    else:
        print("Error: Unexpected response format", file=sys.stderr)
        print(json.dumps(data, indent=2), file=sys.stderr)
        sys.exit(1)
except Exception as e:
    print(f"Error parsing response: {e}", file=sys.stderr)
    sys.exit(1)
'
CLAUDE_SCRIPT

# Make the script executable
chmod +x "$INSTALL_PATH/claude"

echo "✓ Claude CLI installed to $INSTALL_PATH/claude"

# Install shell completion if requested
if [ "$INSTALL_SHELL_COMPLETION" = "true" ]; then
    # Bash completion
    BASH_COMPLETION_DIR="/etc/bash_completion.d"
    if [ -d "$BASH_COMPLETION_DIR" ]; then
        cat > "$BASH_COMPLETION_DIR/claude" << 'BASH_COMPLETION'
# Claude CLI bash completion
_claude_completion() {
    local cur prev opts
    COMPREPLY=()
    cur="${COMP_WORDS[COMP_CWORD]}"
    prev="${COMP_WORDS[COMP_CWORD-1]}"
    opts="-h --help -m --model -t --temperature -k --api-key --max-tokens --system"

    case "${prev}" in
        -m|--model)
            COMPREPLY=( $(compgen -W "claude-3-5-sonnet-20241022 claude-3-opus-20240229 claude-3-sonnet-20240229 claude-3-haiku-20240307" -- ${cur}) )
            return 0
            ;;
        -k|--api-key|--max-tokens|--system|-t|--temperature)
            return 0
            ;;
        *)
            ;;
    esac

    COMPREPLY=( $(compgen -W "${opts}" -- ${cur}) )
    return 0
}
complete -F _claude_completion claude
BASH_COMPLETION
        echo "✓ Bash completion installed"
    fi

    # Zsh completion
    ZSH_COMPLETION_DIR="/usr/local/share/zsh/site-functions"
    mkdir -p "$ZSH_COMPLETION_DIR"
    cat > "$ZSH_COMPLETION_DIR/_claude" << 'ZSH_COMPLETION'
#compdef claude

_claude() {
    local -a opts
    opts=(
        '(-h --help)'{-h,--help}'[Show help message]'
        '(-m --model)'{-m,--model}'[Claude model to use]:model:(claude-3-5-sonnet-20241022 claude-3-opus-20240229 claude-3-sonnet-20240229 claude-3-haiku-20240307)'
        '(-t --temperature)'{-t,--temperature}'[Temperature for responses]:temperature:'
        '(-k --api-key)'{-k,--api-key}'[Anthropic API key]:api-key:'
        '--max-tokens[Maximum tokens in response]:max-tokens:'
        '--system[System prompt]:system prompt:'
    )
    _arguments $opts
}

_claude "$@"
ZSH_COMPLETION
    echo "✓ Zsh completion installed"
fi

# Verify installation
if command -v claude &> /dev/null; then
    echo "✓ Claude CLI installed successfully!"
    echo ""
    echo "Usage: claude \"Your prompt here\""
    echo "Set CLAUDE_API_KEY or ANTHROPIC_API_KEY environment variable to use"
    echo "Run 'claude --help' for more information"
else
    echo "✗ Failed to install Claude CLI"
    exit 1
fi

echo "Installation complete!"
