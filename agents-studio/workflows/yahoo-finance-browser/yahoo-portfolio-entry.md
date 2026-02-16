---
description: Add stock holdings to Yahoo Finance portfolios from a markdown table of brokerage orders
---

# Yahoo Finance Portfolio Entry

Automates entering stock purchase data into Yahoo Finance portfolios. Accepts a markdown table of orders and uses browser automation to add each lot.

## Prerequisites

- Portfolio mapping must exist in `.agent/config/portfolios.json` (run `/portfolio-setup` first if it doesn't)
- User must be logged into Yahoo Finance in the browser
- Yahoo Finance MCP server should be configured (see `.agent/config/mcp-setup.md`) for validation

## Input Format

The user provides a **markdown table** with these columns:

```markdown
| Account | Ticker | Shares | Avg Price | Date |
|---|---|---|---|---|
| Jonathan-TFSA | AAPL | 10 | 185.50 | 2026-01-15 |
| Janet-RRSP | MSFT | 5 | 420.00 | 2026-01-15 |
| Jonathan-RRSP-1 | VFV.TO | 25 | 112.30 | 2026-01-15 |
```

**If no table is provided**, prompt the user with this template:

```
Please provide your orders in this markdown table format:

| Account | Ticker | Shares | Avg Price | Date |
|---|---|---|---|---|
| <account-key> | <ticker> | <shares> | <price> | <YYYY-MM-DD> |

Available account keys (from your portfolios.json):
<list account keys from .agent/config/portfolios.json>
```

## Workflow Steps

### 1. Parse Input Table

Parse the markdown table into structured entries. For each row extract:
- `account`: The account key (must match a key in `portfolios.json`)
- `ticker`: Stock ticker symbol (e.g., `AAPL`, `VFV.TO`)
- `shares`: Number of shares (must be positive number)
- `avgPrice`: Average price paid per share (must be positive number)
- `date`: Trade date (accept `YYYY-MM-DD`, `MM/DD/YYYY`, or `DD/MM/YYYY`)

### 2. Validate Entries (Validation Agent)

For each parsed entry, perform these checks:

**Using Yahoo Finance MCP server (if available):**
- **Ticker exists**: Call the MCP server to verify the ticker symbol is valid
- **Price sanity**: Get the historical closing price for the ticker on the trade date. If the user's avg price deviates more than **10%** from the actual closing price, flag as a ⚠️ warning (but don't block — brokerage fills can legitimately differ)
- **Date validity**: Confirm the market was open on that date (not a weekend or known holiday)

**Local validation (always):**
- **Account exists**: Verify the account key exists in `portfolios.json`
- **Shares positive**: Must be > 0
- **Price positive**: Must be > 0
- **Date parseable**: Must parse to a valid date
- **Date not in the future**: Trade date must not be after today
- **Duplicate detection**: Check if the same ticker + date + price combination appears multiple times

**Decision logic:**
- ✅ **All pass** → proceed to browser entry automatically (no user prompt)
- ⚠️ **Warnings only** (price deviation, possible duplicate) → show warnings, ask user: "Proceed anyway? (y/n)"
- ❌ **Errors found** (invalid ticker, bad account, negative shares) → show errors, skip bad entries, ask if user wants to proceed with the valid ones

### 3. Group Entries by Portfolio

Group validated entries by `account` key. This minimizes portfolio switching in the browser:

```
Jonathan-TFSA: [AAPL, MSFT]
Jonathan-RRSP-1: [VFV.TO]
Janet-RRSP: [MSFT]
```

### 4. Browser Entry (Per Portfolio Group)

For each portfolio group, use the `yahoo-finance-browser` skill:

1. **Navigate** to the portfolio URL from `portfolios.json`
2. **Check login** — if login wall detected, pause and ask user to authenticate
3. For each entry in the group:
   a. **Add ticker** if it doesn't already exist in the portfolio (use "Add tickers" button)
   b. **Expand** the ticker row
   c. **Add lot/transaction** with:
      - **Trade Date**: Normalized to `MM/DD/YYYY` format
      - **Shares**: As provided
      - **Price Paid**: As provided
   d. **Screenshot** after saving to verify the entry was accepted
   e. **Report** status: `✅ AAPL: 10 shares @ $185.50 on 01/15/2026 → Jonathan-TFSA`

4. **Wait 2-3 seconds** between entries to avoid rate limiting

### 5. Summary Report

After all entries are processed, provide a summary:

```
## Portfolio Entry Summary

✅ Successfully added: 4/5
⚠️ Skipped (user choice): 1
❌ Failed: 0

| Status | Account | Ticker | Shares | Price | Date |
|---|---|---|---|---|---|
| ✅ | Jonathan-TFSA | AAPL | 10 | 185.50 | 01/15/2026 |
| ✅ | Janet-RRSP | MSFT | 5 | 420.00 | 01/15/2026 |
| ⚠️ | Jonathan-RRSP-1 | VFV.TO | 25 | 112.30 | 01/15/2026 |
| ✅ | Jonathan-Margin | GOOGL | 3 | 180.25 | 01/15/2026 |
| ✅ | Janet-TFSA | XIC.TO | 50 | 34.80 | 01/15/2026 |
```

## Error Recovery

- If the browser encounters an error during entry, **screenshot** the error state
- **Skip** the failed entry and continue with the remaining entries
- Report all failures in the summary with screenshot evidence
- The user can re-run the workflow with just the failed entries
