#!/bin/bash

# Hardcoded path to ensure reliability across different shells (zsh/bash) and sourcing methods
AGENT_UTILS_DIR="/Users/jonathancecilj/Documents/Development/agent-utils"
SYNC_SCRIPT="$AGENT_UTILS_DIR/scripts/sync-agents.js"

echo "To configure 'agent-sync', add the following line to your shell profile (~/.zshrc or ~/.bashrc):"
echo ""
echo "alias agent-sync=\"node '$SYNC_SCRIPT'\""
echo ""
echo "Then restart your terminal or run 'source ~/.zshrc'"
