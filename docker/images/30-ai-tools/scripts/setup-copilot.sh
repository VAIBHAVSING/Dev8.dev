#!/bin/bash
################################################################################
# GitHub Copilot CLI Setup Script
################################################################################

setup_copilot_cli() {
    if ! gh auth status >/dev/null 2>&1; then
        echo "GitHub CLI not authenticated. Please set GITHUB_TOKEN."
        return 1
    fi
    
    # Install Copilot extension
    if ! gh extension list | grep -q "github/gh-copilot"; then
        gh extension install github/gh-copilot
    fi
    
    echo "GitHub Copilot CLI is ready!"
    echo "Usage:"
    echo "  gh copilot suggest 'create a function to sort an array'"
    echo "  gh copilot explain 'git rebase -i HEAD~3'"
}

# Run if executed directly
if [ "${BASH_SOURCE[0]}" -ef "$0" ]; then
    setup_copilot_cli
fi
