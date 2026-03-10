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

### 2. Search for em-dashes and hyphens in compound words/quotes

For each target file, search for the em-dash character (`—`) and regular hyphens (`-`) used in compound words or phrases in quotes:

```bash
# Search for em-dashes
grep -n "—" <file_path>

# Advanced search for ANY hyphenated words/phrases inside text 
# This regex catches:
# 1. Standard word-word (e.g., now-blocked)
# 2. Acronyms with periods (e.g., U.S.-Israeli)
# 3. Multi-hyphen phrases (e.g., four-to-five)
# 4. Words ending in hyphens connecting to other words (e.g., Islands-flagged)
grep -nE "\b[a-zA-Z0-9\.]+(?:-[a-zA-Z0-9\.]+)+\b" <file_path>
```

### 3. Review each occurrence

Determine the appropriate replacement:

**For Em-Dashes (`—`):**
| Pattern | Replacement Strategy |
|---------|---------------------|
| `word—word` (connecting two clauses) | Replace with `. ` (period + space) to create two sentences |
| `word—word, word, word—word` (parenthetical) | Replace both with `, ` (comma + space) |
| `word—word` (list/example intro) | Replace with `: ` (colon + space) |
| `header — subheader` (in titles) | Replace with `, ` (comma + space) |

**For Hyphens (`-`):**
| Pattern | Replacement Strategy |
|---------|---------------------|
| `"word-word"` (quoted hyphenated phrase) | Remove hyphen, keeping words separate e.g., `"risk off"` |
| `word-word` (compound adjective/noun) | Remove hyphen or combine if applicable e.g., `full scale` or `preemptive` |
| `- item` (markdown list) | Do not change. |
| `word-word` (in code/URLs/Frontmatter) | Do not change. |

### 4. Rewrite sentences

For each occurrence:
1. Read the full sentence context
2. Rewrite the sentence to flow naturally without the em-dash or unwanted hyphen
3. Ensure grammatical correctness and consistent formatting after replacement
4. Preserve the original meaning and tone

### 5. Verify replacements

After all replacements, confirm no em-dashes exist, and no unwanted compound hyphens remain.

### 6. Report results

Provide a summary:
- Number of em-dashes found and replaced
- Number of hyphens in compound words/quotes found and replaced
- Any lines that required special attention
