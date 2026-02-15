#!/bin/bash

# Default to the directory where this script is located
DEFAULT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "-----------------------------------"
echo "       Setup Agent Utils"
echo "-----------------------------------"
echo ""

# Prompt for directory
read -p "Install location [$DEFAULT_DIR]: " INPUT_DIR

# Use default if input is empty
AGENT_UTILS_DIR="${INPUT_DIR:-$DEFAULT_DIR}"

SYNC_SCRIPT="$AGENT_UTILS_DIR/scripts/sync-agents.js"

# Verify script existence
if [ ! -f "$SYNC_SCRIPT" ]; then
    echo ""
    echo "❌ Error: Could not find 'scripts/sync-agents.js' in:"
    echo "   $AGENT_UTILS_DIR"
    echo ""
    echo "Please check the path and try again."
    exit 1
fi

echo ""
echo "✅ Installation path validated."
echo ""
# Detect shell config
SHELL_CONFIG=""
if [ -f "$HOME/.zshrc" ]; then
    SHELL_CONFIG="$HOME/.zshrc"
elif [ -f "$HOME/.bashrc" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
elif [ -f "$HOME/.bash_profile" ]; then
    SHELL_CONFIG="$HOME/.bash_profile"
fi

ALIAS_CMD="alias agent-utils=\"node '$SYNC_SCRIPT'\""

echo ""
if [ -n "$SHELL_CONFIG" ]; then
    read -p "Do you want to automatically add the alias to $SHELL_CONFIG? [y/N] " ADD_ALIAS
    if [[ "$ADD_ALIAS" =~ ^[Yy]$ ]]; then
        # Check if already exists
        if grep -q "alias agent-utils=" "$SHELL_CONFIG"; then
             echo "⚠️  Alias 'agent-utils' already exists in $SHELL_CONFIG."
        else
             echo "" >> "$SHELL_CONFIG"
             echo "# Agent Utils Alias" >> "$SHELL_CONFIG"
             echo "$ALIAS_CMD" >> "$SHELL_CONFIG"
             echo "✅ Alias added to $SHELL_CONFIG"
             echo "Run 'source $SHELL_CONFIG' to apply changes."
             exit 0
        fi
    fi
fi

echo ""
echo "To finish setup, add this alias to your shell profile (~/.zshrc or ~/.bashrc):"
echo ""
echo "  $ALIAS_CMD"
echo ""
echo "Then restart your terminal or run 'source <your-shell-config>' to apply changes."
