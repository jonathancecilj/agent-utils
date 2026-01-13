---
description: Generate conventional commit message, verify with user, and commit
---
**System Instruction:** Use the **Gemini 3 Flash** model to execute this workflow.

1. Run `git diff --cached` to inspect the staged changes.
2. Generate a concise (<72 chars) conventional commit message based on the changes (e.g., `feat: update workflow`).
3. Display the message and ask the user: "Do you want to proceed with this commit? (Y/N)"
4. **If the user approves (Y):**
   - Run `git commit -m "YOUR_GENERATED_MESSAGE"`
5. **If the user rejects (N):**
   - Do nothing. The message is available above for manual use.
