---
description: Version control and rollback system for articles
---

## Article Version Control Workflow

This workflow provides version control, rollback capabilities, and change tracking for articles. It creates safety checkpoints before major edits and enables recovery from mistakes.

---

## Core Concepts

### What Gets Versioned?
- The main article markdown file (`.md`)
- Automatically before SEO optimization
- Automatically before portfolio sync
- Manually on user request
- Before major content rewrites

### What Doesn't Get Versioned?
- Research notes (these rarely change after creation)
- Supporting assets (images, charts) unless specifically requested
- QA reports (these are dated snapshots already)

### Version Naming Convention
```
{{article-name}}-{{YYYYMMDD-HHMMSS}}-{{label}}.md
```

**Examples:**
- `yen-carry-trade-20260214-143022.md` (auto-versioned)
- `yen-carry-trade-20260214-143530-pre-seo.md` (labeled)
- `yen-carry-trade-20260214-150000-before-major-rewrite.md` (labeled)

---

## Available Actions

### 1. Create Version Snapshot

**Trigger:** User says "Create a version" or "Snapshot this article"

**Steps:**
1. Ask for category and slug (if not in context)
2. Ask for optional label:
   - "pre-seo" (before SEO optimization)
   - "before-edit" (before major changes)
   - "pre-sync" (before portfolio sync)
   - Custom label
3. Run versioning script:
   ```bash
   .agent/tools/version_article.sh {{category}}/{{slug}}/{{slug}}.md "{{label}}"
   ```
4. Report success and show version details

**Example:**
```
User: "Create a version of the yen carry trade article before I make major edits"

Agent:
✓ Version created: finance/yen-carry-trade/versions/yen-carry-trade-20260214-143022-before-major-edits.md
  Size: 24K
  Total versions: 5
```

---

### 2. Auto-Version Integration Points

**Automatically create versions at these workflow stages:**

#### Before SEO Optimization
Add to `optimize_seo.md` at step 2:
```markdown
2a. Create automatic version snapshot
    Run: .agent/tools/version_article.sh {{path}} "pre-seo"
    This preserves the article before SEO metadata changes
```

#### Before Portfolio Sync
Add to `sync_to_portfolio.md` at step 4:
```markdown
4a. Create automatic version snapshot
    Run: .agent/tools/version_article.sh {{path}} "pre-sync"
    This preserves the article before copying to portfolio
```

#### Before Major Edits
When user asks to "rewrite section" or "make major changes":
```markdown
1. Create version first
   Run: .agent/tools/version_article.sh {{path}} "before-edit"
2. Proceed with edits
```

---

### 3. View Version History

**Trigger:** User says "Show me version history" or "List versions"

**Steps:**
1. Ask for category and slug
2. List all versions:
   ```bash
   ls -lht {{category}}/{{slug}}/versions/*.md
   ```
3. Read version log:
   ```bash
   cat {{category}}/{{slug}}/versions/version-history.log
   ```
4. Present formatted list:

```markdown
# Version History: {{Title}}

## Available Versions (newest first)
1. **20260214-150000-pre-sync** (24K) - Created: 2026-02-14 15:00:00
   - Before portfolio sync

2. **20260214-143530-pre-seo** (23K) - Created: 2026-02-14 14:35:30
   - Before SEO optimization

3. **20260214-120000** (22K) - Created: 2026-02-14 12:00:00
   - Auto-snapshot

**Total versions:** 3
**Oldest version:** 2026-02-14 12:00:00
```

---

### 4. View Diff Between Versions

**Trigger:** User says "Show me what changed" or "Compare versions"

**Steps:**
1. List available versions (as above)
2. Ask which versions to compare:
   - "Compare current with latest version"
   - "Compare version X with version Y"
3. Use `diff` to show changes:
   ```bash
   diff -u {{version1}} {{version2}}
   ```
4. Present formatted diff highlighting:
   - Lines removed (red -)
   - Lines added (green +)
   - Context lines

**Example output:**
```diff
--- versions/yen-carry-trade-20260214-120000.md
+++ yen-carry-trade.md
@@ -45,7 +45,7 @@
 ## Impact on Gold Prices

-Gold has historically benefited from yen weakness.
+Gold has historically benefited from yen weakness, with prices rising 23% in 2024.

 The correlation between BOJ policy and gold markets...
```

---

### 5. Rollback to Previous Version

**Trigger:** User says "Rollback to version X" or "Restore previous version"

**⚠️ CRITICAL:** This is a destructive operation requiring confirmation.

**Steps:**
1. Show current version warning:
   ```
   ⚠️  WARNING: Rollback will REPLACE your current article!

   Current article will be backed up first, but this action is significant.
   Are you sure you want to proceed? (yes/no)
   ```

2. If user confirms "yes":
   a. Create emergency backup of current version:
      ```bash
      .agent/tools/version_article.sh {{path}} "pre-rollback-emergency"
      ```

   b. Identify target version:
      - By timestamp: "20260214-143530"
      - By label: "pre-seo"
      - By position: "2 versions ago"

   c. Copy target version over current article:
      ```bash
      cp {{category}}/{{slug}}/versions/{{target-version}}.md \
         {{category}}/{{slug}}/{{slug}}.md
      ```

   d. Update frontmatter date to indicate rollback:
      ```yaml
      date: {{original-date}}
      last_modified: {{today}}
      rollback_from: {{target-version-timestamp}}
      ```

3. Report success:
   ```
   ✓ Rollback complete!

   Restored version: 20260214-143530-pre-seo
   Current article replaced
   Emergency backup saved: yen-carry-trade-20260214-153000-pre-rollback-emergency.md

   You can now review the restored content.
   ```

4. Suggest next steps:
   - "Review the restored article"
   - "If incorrect, you can rollback again to the emergency backup"

---

### 6. Delete Old Versions

**Trigger:** User says "Clean up old versions" or "Delete versions older than X"

**Steps:**
1. Show current version stats:
   ```bash
   ls {{category}}/{{slug}}/versions/ | wc -l
   ```

2. Ask user what to delete:
   - "All versions older than X days"
   - "All except the most recent N versions"
   - "Specific versions by timestamp"

3. **Require confirmation:**
   ```
   ⚠️  You're about to delete X versions:
   - version1.md
   - version2.md

   This cannot be undone. Proceed? (yes/no)
   ```

4. If confirmed, delete:
   ```bash
   # Example: Keep only last 10 versions
   ls -t {{versions_dir}}/*.md | tail -n +11 | xargs rm
   ```

5. Update version log

**Note:** The version script auto-cleans when >20 versions exist.

---

## Best Practices

### When to Create Manual Versions

**Always version before:**
- 🔴 Major content rewrites or restructuring
- 🔴 Deleting substantial sections
- 🔴 Merging or splitting articles
- 🟡 Changing technical examples or code
- 🟡 Updating statistics or data
- 🟢 Minor typo fixes (optional)

### Version Retention Policy

**Keep forever:**
- First published version
- Versions before major milestones
- Versions specifically labeled by user

**Auto-delete:**
- Unlabeled versions older than 30 days
- Excess versions beyond the 20-version limit (keeps newest)

### Version Labels Best Practices

Use descriptive labels:
- ✅ "pre-seo", "before-major-rewrite", "published-version-1"
- ❌ "backup", "old", "test"

---

## Integration with Git

**Important:** Article versions are NOT git commits!

- **Versions:** Fine-grained, rapid snapshots within working directory
- **Git commits:** Coarse-grained, intentional checkpoints for portfolio

**Workflow:**
1. Work on article with multiple version snapshots
2. Once satisfied, sync to portfolio
3. Git commit the portfolio change

This gives you:
- Local version control (fast, granular)
- Portfolio version control (git, publishable states)

---

## Troubleshooting

### "No versions found"
- Likely first time working on this article
- Version directory will be created on first snapshot

### "Version script not found"
- Ensure you're in the workspace root directory
- Check: `.agent/tools/version_article.sh` exists and is executable

### "Too many versions"
- Normal! Script auto-cleans keeping 20 most recent
- Manually clean with delete workflow if needed

### "Can't rollback, version missing"
- Version may have been auto-cleaned
- Check version-history.log to see what existed
- Use git history to recover if article was synced to portfolio

---

## Example Usage Scenarios

### Scenario 1: Safe Editing
```
User: "I want to completely rewrite the introduction to my Kubernetes article"

Agent:
1. Creates version: kubernetes-gke/my-article/versions/my-article-20260214-pre-rewrite.md
2. User rewrites introduction
3. If user doesn't like new version: rollback to pre-rewrite snapshot
```

### Scenario 2: SEO Optimization
```
Agent runs optimize_seo.md:
1. Auto-creates version: "pre-seo"
2. Updates frontmatter with SEO fields
3. User can review changes
4. If SEO changes break something: rollback to pre-seo version
```

### Scenario 3: Emergency Recovery
```
User: "I accidentally deleted half my article! Help!"

Agent:
1. Shows version history
2. Identifies most recent complete version
3. Rollbacks to that version
4. Article restored
```

---

## Version Control Cheatsheet

| Command | Action |
|---------|--------|
| "Create version of X" | Manual snapshot |
| "Show version history" | List all versions |
| "What changed since last version?" | Show diff |
| "Rollback to version X" | Restore old version |
| "Clean up old versions" | Delete old snapshots |

---

## Future Enhancements

### Planned Features
- [ ] Automatic nightly versions of all active drafts
- [ ] Cloud backup of important versions
- [ ] Diff viewer in browser (HTML output)
- [ ] Version comparison by content similarity
- [ ] Restore specific sections (not whole file)
- [ ] Version branching (multiple draft variants)

---

**Remember:** Version control is your safety net. When in doubt, create a version before making changes!
