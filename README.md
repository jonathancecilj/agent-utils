# Agent Utils

This repository contains a collection of specialized agent personas and utility workflows designed to enhance development processes.

## Usage

To access these agents and workflows in any of your project workspaces, you can symlink them into your project's `.agent/workflows` directory.

Run the following command in your target project root:

```bash
mkdir -p .agent/workflows && ln -s /Users/jonathancecilj/Documents/Development/agent-utils/* .agent/workflows/
```

This will make all the agent personas (from `studio-agents/`) and tools (from `Tools/`) available to your AI assistant in that project.
