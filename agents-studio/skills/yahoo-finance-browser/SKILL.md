---
name: yahoo-finance-browser
description: Browser automation skill for adding stock holdings and lots to Yahoo Finance portfolios
---

# Yahoo Finance Browser Automation

This skill provides step-by-step instructions for automating interactions with Yahoo Finance's portfolio management UI using the browser subagent.

## Important Notes

- Yahoo Finance uses **React** with dynamically rendered content — always wait for elements to load
- CSS class names are **hashed/unstable** (e.g., `yf-1m8k7m7`) — never use them as selectors
- Use **visible text labels**, **button text**, and **`data-test` attributes** for element targeting
- Always **take screenshots** after critical actions to verify state
- **Dynamic waits** are essential — add 1-2 second pauses after clicks that trigger UI updates

---

## Procedure: Check Login State

**Goal:** Verify the user is logged into Yahoo Finance.

1. Navigate to `https://finance.yahoo.com/portfolios/`
2. Look for one of these indicators:
   - **Logged in:** The page shows a list of portfolios/watchlists, or a user avatar/icon in the top-right
   - **Not logged in:** A "Sign in" button is visible, or a login modal/redirect appears
3. If **not logged in**:
   - Stop the browser automation
   - Report to the orchestrator: "Yahoo Finance login required. Please log in manually and run again."
   - Do NOT attempt to automate Yahoo login (security risk, CAPTCHA, 2FA)

---

## Procedure: Navigate to Portfolio

**Goal:** Open a specific portfolio by its URL.

**Input:** `portfolioUrl` — the full URL from `portfolios.json`

1. Navigate to the `portfolioUrl` (e.g., `https://finance.yahoo.com/portfolio/abc123/view/v1`)
2. Wait 2 seconds for the portfolio grid to load
3. Take a screenshot to confirm the portfolio loaded
4. Verify the portfolio name is visible in the page header
5. If the page shows an error or redirects to login → report failure

---

## Procedure: Add Ticker to Portfolio

**Goal:** Add a stock ticker to the portfolio if it doesn't already exist.

**Input:** `ticker` — the stock symbol (e.g., `AAPL`, `VFV.TO`)

### Step 1: Check if ticker already exists

1. Scan the portfolio grid/table for the ticker text
2. If the **ticker is already present** → skip to "Add Lot" procedure
3. If not found → proceed to add it

### Step 2: Click "Add tickers" / "Add Symbol"

1. Look for a button with text containing **"Add"** and **"ticker"** or **"symbol"** (case-insensitive)
   - Common variations: "Add tickers", "Add Symbol", "Add to list", "+ Add"
2. Click the button
3. Wait 1 second for the search/input UI to appear

### Step 3: Search for the ticker

1. Look for a **text input** / **search box** that appeared after clicking Add
   - It may have placeholder text like "Search for symbols", "Search", or "Add ticker"
2. Click the input to focus it
3. Type the ticker symbol (e.g., `AAPL`)
4. Wait 1-2 seconds for the dropdown/autocomplete to populate

### Step 4: Select the ticker from results

1. Look for the ticker in the dropdown results
   - The dropdown item should contain the exact ticker text
   - For Canadian tickers (e.g., `VFV.TO`), look for the exchange suffix
2. Click the matching result
3. Wait 1 second

### Step 5: Confirm the ticker was added

1. Look for a confirmation button like "Add ticker", "Add", or "Done"
2. Click it if present
3. Wait 2 seconds for the portfolio to refresh
4. Take a screenshot
5. Verify the ticker now appears in the portfolio grid

**If the ticker cannot be found** in search results → report: `"❌ Ticker <ticker> not found on Yahoo Finance"`

---

## Procedure: Add Lot (Transaction)

**Goal:** Add a purchase lot for a ticker that already exists in the portfolio.

**Input:**
- `ticker` — the stock symbol
- `date` — trade date (convert to `YYYY-MM-DD` format for the HTML5 date input)
- `shares` — number of shares
- `price` — price paid per share

> **IMPORTANT FIELD DETAILS** (discovered via live testing):
> - Date field: `<input type="date" class="md yf-1tetplh">` — expects `YYYY-MM-DD`
> - Shares field: `<input type="number" class="sm yf-1tetplh" placeholder="1">`
> - Price field: `<input type="number" class="sm yf-1tetplh" placeholder="[current price]">`
> - Notes field: `<input type="text" class="left yf-1tetplh" placeholder="Add Note">`
> - **There is NO explicit Save button.** Lots are saved by pressing **Enter** key.

### Step 0: Switch to Holdings View

> ⚠️ **CRITICAL:** You MUST be on the **Holdings view** (`/view/v2`) for row expansion to work correctly. The Summary view (`/view/v1`) has buttons that trigger **delete modals** instead of expanding rows.

1. If the current URL ends with `/view/v1`, change it to `/view/v2`
   - Example: `https://finance.yahoo.com/portfolio/p_14/view/v2`
2. Alternatively, click the **"Holdings"** tab in the portfolio navigation
3. Wait 2 seconds for the Holdings view to load

### Step 1: Expand the ticker row

1. Find the row containing the ticker in the portfolio table
2. Click the **expand caret** (▶ arrow) on the left side of the row — this is a small clickable arrow, not a button with aria-label
3. Wait 1 second for the expanded section to appear
4. The expanded section shows three tabs: **Share Lots**, **Transactions**, **Dividends**

### Step 2: Click "Add Lot"

1. Ensure the **Share Lots** tab is active (it's the default)
2. Click the **"Add Lot"** button
3. Wait 1 second for the input row to appear with date/shares/price fields

### Step 3: Fill in the Trade Date

> ⚠️ **CRITICAL:** The date field is HTML5 `type="date"`. It has a built-in date picker that opens on click and can intercept keyboard events.

**Preferred approach: Use JavaScript to set the date value directly**

This avoids all date picker issues:
```javascript
(() => {
  const dateInput = document.querySelector('input[type="date"].yf-1tetplh');
  if (dateInput) {
    // React needs special value setting to register the change
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    nativeInputValueSetter.call(dateInput, 'YYYY-MM-DD'); // e.g., '2026-01-15'
    dateInput.dispatchEvent(new Event('input', { bubbles: true }));
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    return 'Date set to ' + dateInput.value;
  }
  return 'Date input not found';
})()
```

**Fallback approach: Keyboard entry**
If JavaScript doesn't work:
1. Click the date field
2. Press Escape to dismiss the date picker if it opens
3. Use Cmd+A to select all, then Backspace to clear
4. Type the date as `YYYY-MM-DD` (e.g., `2026-01-15`)
5. Press Tab to move to the next field

### Step 4: Fill in Shares

1. Click the shares input (or Tab from date field)
2. Select all (Cmd+A) and clear (Backspace)
3. Type the shares number (e.g., `10`)
4. Press Tab to move to the price field

### Step 5: Fill in Price

1. Click the price input (or Tab from shares field)  
2. Select all (Cmd+A) and clear (Backspace)
3. Type the price (e.g., `185.50`) — no currency symbol
4. **Do NOT press Enter yet** — first verify all fields

### Step 6: Verify before saving

1. Take a screenshot to verify all three fields show correct values
2. If the date field is wrong → re-set it using JavaScript
3. If shares or price are wrong → click the field and re-enter

### Step 7: Save the lot (Press Enter)

> **CRITICAL:** There is no Save button. The lot is saved by pressing **Enter**.

1. Make sure focus is on the **shares or price field** (NOT the date field — the date picker will intercept Enter)
2. Click the price/cost field to ensure focus is there
3. Press **Enter**
4. Wait 2 seconds
5. A **confirmation modal** may appear asking "Is this a new buy transaction?" — click **"Yes"** to confirm
6. Wait 2 seconds for the portfolio to update

### Step 8: Verify success

1. Take a screenshot
2. Look for:
   - The lot appearing in the Share Lots list with correct date, shares, and price
   - The ticker row showing the updated total shares count
   - No error messages visible
3. If successful → report: `"✅ <ticker>: <shares> shares @ $<price> on <date>"`
4. If an error appears → screenshot and report: `"❌ Failed to add lot for <ticker>: <error>"`

---

## Recommended: All-in-One JavaScript Entry

For maximum reliability, use this single script to fill all fields and trigger save:

```javascript
(() => {
  const inputs = document.querySelectorAll('input.yf-1tetplh');
  if (inputs.length < 3) return 'Lot form not open — click Add Lot first';
  
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  
  // Set date (input[0] = type="date")
  setter.call(inputs[0], 'YYYY-MM-DD');  // Replace with actual date
  inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
  inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
  
  // Set shares (input[1] = type="number")
  setter.call(inputs[1], 'SHARES');  // Replace with actual shares
  inputs[1].dispatchEvent(new Event('input', { bubbles: true }));
  inputs[1].dispatchEvent(new Event('change', { bubbles: true }));
  
  // Set price (input[2] = type="number")
  setter.call(inputs[2], 'PRICE');  // Replace with actual price
  inputs[2].dispatchEvent(new Event('input', { bubbles: true }));
  inputs[2].dispatchEvent(new Event('change', { bubbles: true }));
  
  return 'Fields set: ' + inputs[0].value + ', ' + inputs[1].value + ', ' + inputs[2].value;
})()
```

After running this script:
1. Click the price field to focus it
2. Press Enter to save
3. Handle the confirmation modal

---

## Error Recovery Patterns

### Login wall mid-session
If at any point during automation the page redirects to login:
1. Stop all browser actions
2. Report: "Yahoo Finance session expired. Please log in again."
3. Do not retry — let the orchestrator handle re-invocation

### Element not found
If an expected button or field can't be found after 5 seconds:
1. Take a screenshot of the current state
2. Report the missing element with the screenshot
3. Skip this entry and proceed to the next one

### Stale portfolio grid
If the portfolio grid doesn't update after adding a ticker or lot:
1. Refresh the page (navigate to the portfolio URL again)
2. Wait 3 seconds
3. Verify the entry was actually saved
4. If not saved → retry the entry once

### Date picker interferes
If pressing Enter opens/interferes with the date picker:
1. Press **Escape** to close the date picker
2. Click the **price** or **shares** field to move focus away from date
3. Press **Enter** from the price or shares field instead

### Confirmation modal
After pressing Enter to save, Yahoo Finance shows a modal:
- "Is this a new buy transaction?" → Click **"Yes"**
- "No, this is an edit" → Only click this if editing an existing lot
