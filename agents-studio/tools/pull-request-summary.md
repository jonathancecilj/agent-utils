---
description: Generate a Pull Request summary from conversation history
---

# Pull Request Summary Workflow

This workflow reviews the **ENTIRE conversation history**, identifies ALL commit generation invocations, and produces a comprehensive Pull Request summary in markdown format.

## Critical Instructions

> **IMPORTANT**: You MUST scan the ENTIRE conversation thread from the beginning to the end. Do NOT only look at the most recent commit. Look for EVERY instance where:
> - `/Commit-gen` was invoked
> - A commit message was generated
> - Changes were staged with `git add`
> - A `git diff --cached` was reviewed
> 
> Each of these represents a distinct set of changes that MUST be included in the PR summary.

## Steps

### Step 1: Scan Full Conversation History
Search through the ENTIRE conversation for:
1. All `git status` outputs that show file changes
2. All `git diff --cached` outputs
3. All generated commit messages (look for patterns like `feat:`, `fix:`, `refactor:`, `docs:`, etc.)
4. All file modification summaries

**Create a list of ALL commits found in chronological order.**

### Step 2: Extract Details for Each Commit
For EACH commit found, extract:
- The generated commit message
- The list of files that were staged
- The summary of what was changed in each file
- The category (feature, fix, refactor, docs, etc.)

> **FILE FORMAT RULE - CRITICAL**: 
> - Use **bold text** for filenames: **accounts/views/auth.py**
> - Do NOT use backticks around filenames (they may auto-link)
> - Do NOT create markdown links like [filename](url)
> - Do NOT include any paths starting with /Users/, C:\, file://, or cci:
> - Keep filenames as simple relative paths from project root
> 
> ✅ CORRECT: **accounts/views/auth.py** - Description here
> ❌ WRONG: `accounts/views/auth.py` (may create links)
> ❌ WRONG: [accounts/views/auth.py](any-url)
> ❌ WRONG: Any reference containing /Users/ or file://

### Step 3: Categorize All Changes
Group ALL the changes (from ALL commits) into categories:
- 🚀 **Features**: New functionality added (feat: commits)
- 🐛 **Bug Fixes**: Issues resolved (fix: commits)
- ♻️ **Refactoring**: Code improvements (refactor: commits)
- 📚 **Documentation**: Doc updates (docs: commits)
- 🔒 **Security**: Security-related changes
- 🧪 **Tests**: Test additions or modifications (test: commits)
- 🔧 **Configuration**: Config/infrastructure changes (chore:, build: commits)

### Step 4: Generate Comprehensive PR Summary
Use this template, ensuring ALL commits are represented:

```markdown
## Pull Request Summary

### 🎯 Overview
[High-level description covering ALL changes across ALL commits]

### 📝 Changes Made

#### 🚀 Features
- **feat: commit message here**
  - **accounts/views/auth.py** - Description of change
  - **accounts/forms.py** - Description of change
  
- **feat: another commit message**
  - **templates/some_file.html** - Description of change

#### ♻️ Refactoring
- **refactor: commit message here**
  - **templates/legal/terms.html** - Description of change

[Continue for all categories with commits...]

### 📊 Summary Statistics
| Metric | Count |
|--------|-------|
| Total Commits | X |
| Files Added | X |
| Files Modified | X |
| Files Deleted | X |

### 🧪 Testing
- [ ] All existing tests pass
- [ ] New tests added for new functionality
- [ ] Manual testing completed

### 📋 Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated (if applicable)
- [ ] No new warnings introduced

### 🔗 Related Issues
- Closes #[issue_number] (if applicable)

### 📸 Screenshots (if applicable)
[Add screenshots for UI changes]
```

## Validation Checklist
Before presenting the summary, verify:
- [ ] ALL commit messages from the conversation are included
- [ ] Changes are properly categorized
- [ ] No commits were missed or skipped
- [ ] File changes are accurately described

## Output Format - CRITICAL

> **IMPORTANT**: The final PR summary MUST be wrapped in a markdown code block so the user can easily copy it with the copy button.

Output the summary like this:

~~~
```markdown
## Pull Request Summary

[... entire PR summary content here ...]
```
~~~

This ensures the user sees a **copy button** on the code block, allowing them to click once and paste directly into GitHub's PR description field.

**Do NOT** output the summary as raw markdown - always wrap it in a code block with the `markdown` language identifier.

## Notes
- **NEVER** skip commits - every invocation of Commit-gen must be reflected
- If the conversation is truncated, note that some earlier commits may be summarized from context
- Prioritize accuracy over brevity - include all relevant details
- Always use the code block format for the final output
