---
description: Sync a finished article to the portfolio directory for publishing.
---

1. Ask the user which **Category** and **Article Slug** they want to sync to the portfolio.
   - Example: `finance` / `yen-carry-trade`

2. Verify that the source file exists: `{{Category}}/{{Slug}}/{{Slug}}.md`.

3. **Check for Supporting Assets:**
   - List the contents of `{{Category}}/{{Slug}}/` directory.
   - Identify any supporting assets:
     - **Visualizations:** `.html` files (e.g., `charts.html`)
     - **Data files:** Files in `research_notes/` (e.g., `visualization-data.md`, research data)
     - **Images:** Any `.png`, `.jpg`, `.svg` files
   - Ask the user: "**Include supporting assets?** (visualizations, data files, images) [Y/N]"

4. **Ensure Destination Structure:**
   - Create parent directory if it doesn't exist: `portfolio/articles/{{Category}}/`
   - If including assets, also create: `portfolio/articles/{{Category}}/{{Slug}}/`

5. **Perform Sync (Copying):**
   - **Always copy:** `{{Category}}/{{Slug}}/{{Slug}}.md` ➔ `portfolio/articles/{{Category}}/{{Slug}}.md`
   - **If including assets:**
     - Copy `.html` files ➔ `portfolio/articles/{{Category}}/{{Slug}}/`
     - Copy data files from `research_notes/` ➔ `portfolio/articles/{{Category}}/{{Slug}}/`
       - **Exclude:** `vercel-blog-integration-feedback.md` (internal notes only)
     - Copy images ➔ `portfolio/articles/{{Category}}/{{Slug}}/`

6. **Final Instruction:**
   - Notify the user of what was synced:
     ```
     ✅ Synced to portfolio:
     - portfolio/articles/{{Category}}/{{Slug}}.md (main article)
     - portfolio/articles/{{Category}}/{{Slug}}/ (X supporting files)
     ```
   - Remind them: "You can now switch to the `portfolio` workspace to review, commit, and push to GitHub/Vercel at your own pace."

---

## Example Output

**Without assets:**
```
portfolio/articles/finance/
└── yen-carry-trade.md
```

**With assets:**
```
portfolio/articles/canada/
├── employment-analysis.md
└── employment-analysis/
    ├── charts.html
    ├── labour-force-survey-data.md
    └── visualization-data.md
```
