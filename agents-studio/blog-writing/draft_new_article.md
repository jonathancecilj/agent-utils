---
description: Draft a new Medium article tailored for specific categories
---

1. Ask the user to select a category:
   - Kubernetes and GKE (`kubernetes-gke`)
   - Reliability Engineering (`reliability-engineering`)
   - Finance (`finance`)
   - Agentic Coding (`agentic-coding`)
   - Stock Markets and Policy (`stock-markets-policy`)

2. Ask for the **Title** of the article.

3. Generate a safe filename slug from the title (lowercase, kebab-case, e.g., `yen-carry-trade`).

4. Ask for a short **Concept** or **Abstract** of what the article is about.

5. **Create the Directory Structure:**
   - Create a directory for the article: `{{Category}}/{{Slug}}/`
   - Create a research notes directory: `{{Category}}/{{Slug}}/research_notes/`

6. Prompt the user to conduct **External Research** from at least two different sources (e.g., utilizing Deep Research agents).
   - Ask them to save their findings into the newly created folder: `{{Category}}/{{Slug}}/research_notes/`
   - Wait for the user to confirm they have completed this step and provided the filename(s) of their research.

7. Create the article draft file `{{Category}}/{{Slug}}/{{Slug}}.md` with the following template:

   ```markdown
   ---
   title: {{Title}}
   date: {{Date}}
   category: {{Category}}
   tags: []
   status: draft
   research_source: {{ResearchFilename}}
   ---

   # {{Title}}

   ## Abstract
   {{Abstract}}

   ## Research Notes
   [Link to Research]({{ResearchFilename}})

   ## Introduction
   
   ## Core Concepts

   ## Conclusion
   ```

8. Open the file for the user to view.

9. **Human Editor Review:**
   - Remind the user to run the **Human Editor** persona (`.agent/personas/human-editor.md`) on the draft to validate "Human Touch" and "Dual-Audience Comprehension."
