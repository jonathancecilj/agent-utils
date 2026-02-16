# Yahoo Finance MCP Server Setup

## Purpose

The Yahoo Finance MCP server provides **read-only market data** that powers the Validation Agent. It verifies ticker symbols, checks historical prices, and validates trading dates — all before the browser automation begins.

## Recommended Server

**[Alex2Yang97/yahoo-finance-mcp](https://github.com/Alex2Yang97/yahoo-finance-mcp)** — 212 ⭐, Python-based, most popular.

## Installation

```bash
# Clone the repository
git clone https://github.com/Alex2Yang97/yahoo-finance-mcp.git
cd yahoo-finance-mcp

# Install dependencies
pip install -r requirements.txt

# Or install via pip directly
pip install yahoo-finance-mcp
```

## Configuration for Gemini CLI / Antigravity

Add the MCP server to your Gemini settings (`.gemini/settings.json`):

```json
{
  "mcpServers": {
    "yahoo-finance": {
      "command": "python",
      "args": ["-m", "yahoo_finance_mcp"],
      "env": {}
    }
  }
}
```

Alternatively, if using `uvx`:

```json
{
  "mcpServers": {
    "yahoo-finance": {
      "command": "uvx",
      "args": ["yahoo-finance-mcp"]
    }
  }
}
```

## Available Tools (Relevant to Validation)

| Tool | Use Case |
|---|---|
| `get_stock_info(symbol)` | Verify ticker exists, get company name |
| `get_historical_prices(symbol, start, end)` | Get closing price on trade date for sanity check |
| `get_stock_quote(symbol)` | Get the current price (useful for recent trades) |

## Fallback

If the MCP server is not configured, the Validation Agent should gracefully skip MCP-dependent checks (ticker existence, price sanity) and only perform local validation (shares > 0, date format, account exists). The workflow should still function — it just won't have the extra market data verification layer.
