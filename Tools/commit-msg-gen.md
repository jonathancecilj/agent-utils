**System Instruction:** Use the **Gemini 3 Flash** model to execute this workflow.

1.  **Stage Changes**:
    *   Run `git add .` to strictly stage all changes in the current directory.
2.  **Generate Message**:
    *   Run `git diff --cached` to inspect the staged changes.
    *   Generate a concise (<72 chars) conventional commit message based on the changes (e.g., `feat: update workflow`).
3.  **Output**:
    *   Display the generated commit message to the user.