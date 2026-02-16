---
description: Find hardcoded email addresses in the codebase
---

# Email Finder Workflow

This workflow scans the codebase for hardcoded email addresses and generates a report of findings.

## Steps

1. Run a grep search for email patterns in the codebase:
```bash
grep -rn --include="*.py" --include="*.html" --include="*.js" --include="*.md" -E "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}" . --exclude-dir=".git" --exclude-dir="node_modules" --exclude-dir="venv" --exclude-dir=".venv" --exclude-dir="__pycache__"
```

2. Review the output and categorize findings:
   - **Configuration emails**: Emails in settings or environment files (acceptable if using env vars)
   - **Template emails**: Emails in HTML/email templates (often legitimate)
   - **Code emails**: Hardcoded emails in Python/JS code (should be reviewed)
   - **Documentation emails**: Emails in README/docs (usually acceptable)

3. Generate a findings summary with:
   - File path
   - Line number
   - The hardcoded email found
   - Recommendation (keep, move to config, or remove)

## Output Format

```markdown
## Hardcoded Email Findings

| File | Line | Email | Category | Recommendation |
|------|------|-------|----------|----------------|
| path/to/file.py | 42 | example@domain.com | Code | Move to settings |
```
