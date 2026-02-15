# Agent and Skill Maintenance Strategy

## Overview
This repository (`agent-utils`) serves as the **central source of truth** for all Agent Personas and Skills used across your projects.

## Directory Structure
- **`agents-studio/`**: Contains Agent Personas (e.g., `technical-writer.md`).
- **`skills-studio/`**: Contains reusable Skills (e.g., `web-scraping/SKILL.md`).
- **`scripts/`**: Maintenance and synchronization scripts.

## Workflow
We use a **Sync Script** (`agent-sync`) to manage agents in consumer repositories.

### 1. Sync (Downstream)
To pull agents into a project (e.g., `Medium`, `Portfolio`):
1.  Create an `agent-manifest.json` in your project root:
    ```json
    {
      "agents": ["technical-writer", "seo-specialist"],
      "skills": ["web-scraping"]
    }
    ```
2.  Run `agent-sync sync`.
3.  The script copies the requested files to `.agent/personas/` and `.agent/skills/`.

### 2. Promote (Upstream)
To save a new agent back to this central repo:
1.  Draft the agent locally in your project.
2.  Run `agent-sync promote ./path/to/new-agent.md`.
3.  The script copies it to `agents-studio/` in this repo.

## Rules
> **Rule: New Agent Creation**
> When creating a new agent or persona, ALWAYS:
> 1.  Check `agent-utils` first via `agent-sync sync`.
> 2.  If creating new, draft locally, then use `agent-sync promote <file>` to upstream it.
