---
description: Scan articles for em-dashes (—) and remove them by rewriting sentences naturally
---

# Remove Em-Dashes from Articles

This workflow scans markdown article files for em-dash characters (`—`) and removes them by rewriting sentences to flow naturally using commas, periods, or rephrased text.

## Steps

### 1. Identify the target file(s)

If the user specifies a file, use that. Otherwise, scan the `articles/` directory for all `.md` files:

```bash
find articles/ -name "*.md" -type f
```

### 2. Search for em-dashes

For each target file, search for the em-dash character:

```bash
grep -n "—" <file_path>
```

The em-dash character is Unicode U+2014 (`—`), which is different from:
- Regular hyphen: `-` (U+002D)
- En-dash: `–` (U+2013)

### 3. Review each occurrence

For each line containing an em-dash, determine the appropriate replacement:

| Pattern | Replacement Strategy |
|---------|---------------------|
| `word—word` (connecting two clauses) | Replace with `. ` (period + space) to create two sentences |
| `word—word, word, word—word` (parenthetical) | Replace both with `, ` (comma + space) |
| `word—word` (list/example intro) | Replace with `: ` (colon + space) |
| `header — subheader` (in titles) | Replace with `, ` (comma + space) |

### 4. Rewrite sentences

For each occurrence:
1. Read the full sentence context
2. Rewrite the sentence to flow naturally without the em-dash
3. Ensure grammatical correctness after replacement
4. Preserve the original meaning and tone

### 5. Verify no em-dashes remain

After all replacements, confirm no em-dashes exist:

```bash
grep -c "—" <file_path>
```

Expected output: `0` (or no matches found)

### 6. Report results

Provide a summary:
- Number of em-dashes found
- Number of replacements made
- Any lines that required special attention
