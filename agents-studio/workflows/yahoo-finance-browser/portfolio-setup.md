---
description: One-time setup to discover and map Yahoo Finance portfolios to account names
---

# Portfolio Discovery & Setup

This is a **one-time workflow** that maps your Yahoo Finance portfolio/watchlist names to account identifiers used in the order entry workflow. The resulting mapping is stored in `.agent/config/portfolios.json` and rarely (if ever) needs to change.

## Prerequisites

- You must be **logged into Yahoo Finance** in the browser before running this workflow.

## Steps

### 1. Open Yahoo Finance Portfolios

// turbo
Open the browser and navigate to `https://finance.yahoo.com/portfolios/`.

### 2. Verify Login

Check the page for signs of authentication:
- If prompted to log in → **stop** and ask the user to log in manually, then restart.
- If the portfolio list is visible → proceed.

### 3. Discover All Portfolios

Scan the portfolios page and extract:
- Portfolio/watchlist **name** (as shown in the sidebar or list)
- Portfolio **URL** (extract the portfolio ID from the URL pattern: `https://finance.yahoo.com/portfolio/<ID>/view/v1`)

Navigate through all portfolios/watchlists in the sidebar to capture every one.

### 4. Present Mapping to User

Display the discovered portfolios in a table and ask the user to assign each one an **account key** in `Person-Type` format:

```
I found these portfolios on your Yahoo Finance account:

| # | Yahoo Portfolio Name | URL |
|---|---|---|
| 1 | "Jonathan RRSP" | https://finance.yahoo.com/portfolio/abc123/view/v1 |
| 2 | "Janet TFSA" | https://finance.yahoo.com/portfolio/def456/view/v1 |
| ... | ... | ... |

Please confirm the mapping. For each portfolio, provide the account key 
(e.g., Jonathan-RRSP-1, Janet-TFSA) or type "skip" to exclude it from automation:
```

**Expected account keys based on known structure:**
- `Jonathan-RRSP-1`, `Jonathan-RRSP-2`
- `Jonathan-TFSA`
- `Jonathan-Margin`
- `Jonathan-GSU`
- `Janet-RRSP`
- `Janet-TFSA`
- `Janet-Margin`

### 5. Write portfolios.json

After user confirmation, write the mapping to `.agent/config/portfolios.json`:

```json
{
  "portfolios": {
    "<account-key>": {
      "person": "<Jonathan|Janet>",
      "type": "<RRSP|TFSA|Margin|GSU>",
      "yahoo_name": "<name as shown on Yahoo>",
      "url": "<full portfolio URL>"
    }
  }
}
```

Only include portfolios the user confirmed (skip any marked "skip").

### 6. Confirm Completion

Show the user the final `portfolios.json` contents and confirm:
> "✅ Portfolio mapping saved. You can now use `/yahoo-portfolio-entry` to add holdings."
