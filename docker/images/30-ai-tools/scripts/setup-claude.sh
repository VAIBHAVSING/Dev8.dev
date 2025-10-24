#!/bin/bash
################################################################################
# Claude CLI Wrapper Script
# Simple wrapper for Claude API using curl
################################################################################

claude() {
    if [ -z "$ANTHROPIC_API_KEY" ]; then
        echo "Error: ANTHROPIC_API_KEY not set"
        return 1
    fi
    
    local prompt="$*"
    
    curl https://api.anthropic.com/v1/messages \
        -H "x-api-key: $ANTHROPIC_API_KEY" \
        -H "anthropic-version: 2023-06-01" \
        -H "content-type: application/json" \
        -d "{
            \"model\": \"claude-3-sonnet-20240229\",
            \"max_tokens\": 1024,
            \"messages\": [{
                \"role\": \"user\",
                \"content\": \"$prompt\"
            }]
        }" 2>/dev/null | jq -r '.content[0].text'
}

# Export function
export -f claude

# Run if executed directly
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
    claude "$@"
fi
