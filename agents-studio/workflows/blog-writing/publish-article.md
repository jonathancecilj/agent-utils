---
description: Publish a blog article with automated validation and visual verification.
---

# Publish Article Workflow

Follow these steps to safely publish an article.

1.  **Identify Article**:
    *   If the user provided a filename, use that.
    *   If not, find the most recently modified `.md` file in `articles/`.
    *   Confirm the file exists.

2.  **Static Validation**:
    *   Read the file content.
    *   Check Frontmatter:
        *   `title`: Must exist.
        *   `date`: Must be a valid date.
        *   `category`: Must be present.
        *   `status`: Check current value. If it is already `published`, warn the user.
    *   Check for `![alt](...)` images. If local paths are used, ensure they exist.

3.  **Visual Verification**:
    *   Ensure the dev server is running on `http://localhost:3001` (or 3000 if 3001 is busy). Start it if needed (use `npx turbo dev --filter=@repo/blog`).
    *   Construct the local URL: `http://localhost:3001/articles/<slug>`.
    *   **Action**: Use `browser_subagent` to:
        *   Navigate to the URL.
        *   Capture a **Screenshot**.
        *   Check for visible errors (console logs or "Internal Server Error" text).
        *   Verify basic typography (e.g., check if body font is Serif).

4.  **Review & Approval**:
    *   Present the findings:
        *   "Frontmatter: ✅ Valid"
        *   "Visual: ✅ No Errors"
        *   "Screenshot: [Link]"
    *   **STOP** and ask the user: "Ready to publish?" (Use `notify_user` with `BlockedOnUser: true` and `PathsToReview` including the screenshot if possible/relevant).

5.  **Publish**:
    *   **Edit File**: Change `status: draft` to `status: published` in the frontmatter.
    *   **Commit**:
        *   `git add <file>`
        *   `git commit -m "publish(blog): <title>"`
    *   **Push**: `git push origin main`

6.  **Confirmation**:
    *   Notify the user that the article is live (or deploying).
