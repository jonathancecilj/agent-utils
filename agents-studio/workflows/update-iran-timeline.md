---
description: Incrementally update the US-Israel-Iran War Timeline with new daily content
---
# Update Iran Timeline Workflow

This workflow automates the process of adding a new day's update to the US-Israel-Iran War Timeline article while perfectly maintaining the existing aesthetic, components, and structure.

## Prerequisites
The user should provide a URL, text, or data source containing the events for the new day.

## Steps to Execute

### 1. Read New Content
Extract the required information from the provided source (using `read_url_content`, web search, or the user's provided text).

### 2. Analyze Existing Timeline State
Read `articles/stock-markets-policy/us-israel-iran-war-timeline/us-israel-iran-war-timeline.md` to see the current latest "Day" number (e.g., if the latest is Day 10, the new day is Day 11).

### 3. Generate New Markdown Content
Following the analysis of the new content, write a new markdown segment using the exact following structure. Replace bracketed placeholders with the new content:

```markdown
<div id="day-[NUMBER]" className="scroll-mt-24"></div>

## [Day of Week, Month Day, Year]

📝 **TL;DR**

[1-2 sentences summarizing the day. Include relevant emojis.]

<div className="my-8 overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-100 via-white to-slate-100 dark:from-indigo-900/20 dark:via-slate-900/50 dark:to-slate-900/50 p-[1px] shadow-sm">
  <div className="rounded-[15px] bg-white dark:bg-slate-950 p-6">
    <div className="flex items-center gap-3 mb-3">
      <div className="flex items-center justify-center text-indigo-600 dark:text-indigo-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13 5l7 7-7 7"/><path d="M5 5l7 7-7 7"/></svg>
      </div>
      <span className="text-[14px] font-bold uppercase tracking-widest text-slate-900 dark:text-slate-100 m-0 pt-[2px]">KEY FOCUS</span>
    </div>
    <div className="text-slate-600 dark:text-slate-400 text-[14.5px] leading-relaxed font-medium m-0">
      [1-2 sentences of the most critical analytical takeaway or warning from the day]
    </div>
  </div>
</div>

🚀 **Day [NUMBER] "[Short Catchy Title]"**

[Action Title]: [Bullet point with contextual emoji]

[Action Title]: [Bullet point with contextual emoji]

<div className="my-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-6 shadow-sm">

💰 **Perspectives from Major Economies**

*   [Flag Emoji] **[Country Name]:** [Perspective text]
*   [Flag Emoji] **[Country Name]:** [Perspective text]

</div>

<div className="my-8 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 p-6 shadow-sm">

🏘️ **Impact on Nearby Countries**

[Flag Emoji] **[Country Name]:** [Impact text]

[Flag Emoji] **[Country Name]:** [Impact text]

</div>

---
```

### 4. Inject Content into Markdown
Prepend the newly generated Markdown segment above the previous latest day in `articles/stock-markets-policy/us-israel-iran-war-timeline/us-israel-iran-war-timeline.md`.

### 5. Update Article Metadata
Update the `date` field in the frontmatter of `articles/stock-markets-policy/us-israel-iran-war-timeline/us-israel-iran-war-timeline.md` to the current date (YYYY-MM-DD) based on the context of the update.

### 6. Update the React Timeline Component
Open `apps/blog/components/charts/conflict-timeline.tsx`. 
Locate the `timelineEvents` array. Unshift/prepend a new event block at the top of the array:

```javascript
    {
        id: "day-[NUMBER]",
        shortDate: "[Mon DD]",
        title: "[Short Catchy Title]",
        tldr: "[A one-sentence summary of the day for the card]",
        hexColor: "#[Appropriate Tailwind Color Hex (e.g. amber, red, blue)]",
        textColor: "text-[color]-500",
        icon: "[Emoji representing the day]"
    },
```

### 7. Clean up Typography
Trigger the `/remove-em-dashes` workflow on the article to ensure no em-dashes (—) were introduced in the update and the text remains naturally phrased.

### 8. Verification
Ensure that the edits did not break syntax and that the Next.js dev server functions correctly. Report completion back to the user.
