# Agent Utils

This repository serves as the **central source of truth** for all Agent Personas and Skills used across your personal and professional projects.

## Directory Structure

*   **`agents-studio/`**: Contains core Agent Personas (e.g., `technical-writer.md`, `seo-specialist.md`).
*   **`skills-studio/`**: Contains reusable Skills (e.g., `web-scraping/SKILL.md`).
*   **`scripts/`**: Maintenance tools (including the synchronization script).

## Installation

To use these agents in any project, you need to set up the global `agent-sync` alias. Run this command **once** in your terminal:

```bash
source ~/Documents/Development/agent-utils/setup.sh
```

*(Recommended: Add the output alias command to your `~/.zshrc` or `~/.bashrc` to make it permanent.)*

## Usage

### 1. Syncing Agents to a Project (Downstream)

To use specific agents in a project (e.g., `Medium` or `Portfolio`):

1.  Create an `agent-manifest.json` file in the root of your project:
    ```json
    {
      "agents": [
        "engineering/ai-engineer",
        "writing/technical-writer"
      ],
      "skills": [
         "web-scraping"
      ]
    }
    ```

2.  Run the sync command:
    ```bash
    agent-sync sync
    ```

    This will copy the requested agents into your project's `.agent/personas/` and `.agent/skills/` directories.

### 2. Promoting New Agents (Upstream)

If you create or improve an agent within a project and want to save it back to this central repository:

1.  Draft and test the agent locally in your project (e.g., `.agent/personas/new-agent.md`).
2.  Run the promote command:
    ```bash
    agent-sync promote ./path/to/new-agent.md
    ```

    This will copy the file back to `agents-studio/` (or `skills-studio/`) in this repository.

## Contribution Rules

*   **Always Checked First**: Before creating a new agent, check this repo (via `agent-sync sync` or browsing) specific to your needs.
*   **Draft Local, Promote Global**: Always test new agents in a specific project context before promoting them here.
