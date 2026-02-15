# Agent Utils

This repository serves as the **central source of truth** for all Agent Personas and Skills used across your personal and professional projects.

## Directory Structure

*   **`agents-studio/`**: Contains core Agent Personas (e.g., `technical-writer.md`, `seo-specialist.md`).
*   **`skills-studio/`**: Contains reusable Skills (e.g., `web-scraping/SKILL.md`).
*   **`scripts/`**: Maintenance tools (including the synchronization script and `install.sh`).

## Installation

1.  Clone this repository:
    ```bash
    git clone https://github.com/jonathancecilj/agent-utils.git
    cd agent-utils
    ```

2.  Run the installation script:
    ```bash
    ./install.sh
    ```

    This script will:
    *   Automatically detect the installation directory.
    *   Prompt you to confirm or change the location.
    *   Provide the alias command to add to your shell profile (`~/.zshrc` or `~/.bashrc`).

## Usage

### 1. Syncing Agents to a Project (Downstream)

To use specific agents in a project (e.g., `Medium` or `Portfolio`):

### 1. Import Agents (Interactive)

The easiest way to get started is to use the interactive `import` command. This will help you select agents and automatically create your `agent-manifest.json` file.

```bash
agent-utils import
```

Follow the prompts to select the agents and skills you want to add to your project.

### 2. Manual Setup (Optional)

If you prefer to configure manually:

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
    agent-utils sync
    ```

    This will copy the requested agents into your project's `.agent/personas/` and `.agent/skills/` directories.

### 2. Validating Changes (Pre-Check)

Before promoting, you can check which agents have changed locally compared to the central repository:

```bash
agent-utils validate
```

This will scan your `.agent/` directory and report the status of each file:
- **[Synced]**: File matches the central repo exactly.
- **[Modified]**: File has local changes.
- **[New]**: File exists locally but not in the central repo.
- **[Duplicate]**: File content matches an existing agent, even if named differently (renamed).

### 3. Promoting New Agents (Upstream)

If you create or improve an agent within a project and want to save it back to this central repository:

1.  Draft and test the agent locally in your project (e.g., `.agent/personas/engineering/new-agent.md`).
2.  Run the promote command:
    ```bash
    agent-utils promote
    ```

    This command is **interactive** and **smart**:
    - It runs `validate` first to find all changes.
    - It prompts you `(y/n)` for each file before promoting.
    - **Smart Placement**: It automatically mirrors your local folder structure.
      - Local: `.agent/personas/engineering/new-agent.md`
      - Central: `agents-studio/engineering/new-agent.md`

## Contribution Rules

*   **Always Checked First**: Before creating a new agent, check this repo (via `agent-utils sync` or browsing) specific to your needs.
*   **Draft Local, Promote Global**: Always test new agents in a specific project context before promoting them here.
