---
description: Citation management, reference generation, and link archival for articles
---

## Citation Manager Workflow

This workflow helps maintain proper citations, generates bibliographies, validates sources, and archives important references. It ensures your articles are properly sourced and credible.

---

## Core Functions

### 1. Extract & Inventory Citations
### 2. Generate Bibliography
### 3. Validate Links
### 4. Archive Sources
### 5. Add In-Text Citations
### 6. Format References

---

## When to Use This Workflow

- **During drafting:** When adding sources and references
- **Before QA check:** To ensure all claims are properly cited
- **Before publication:** Final citation validation
- **After research:** Convert research notes into proper citations

---

## Workflow Steps

### Step 1: Identify Article & Research

**Ask user for:**
- Category and slug
- Which citation action to perform:
  1. Generate bibliography from research notes
  2. Validate all citations
  3. Archive important sources
  4. Format existing citations
  5. Full citation audit (all of the above)

**Paths:**
- Article: `{{category}}/{{slug}}/{{slug}}.md`
- Research: `{{category}}/{{slug}}/research_notes/*.md`

---

## Action 1: Generate Bibliography from Research Notes

**Goal:** Convert URLs and sources from research notes into formatted citations.

### Steps:

#### 1A. Extract URLs from Research Notes

```bash
# Find all URLs in research notes
grep -oE 'https?://[^[:space:]]+' {{category}}/{{slug}}/research_notes/*.md | sort -u
```

**Example output:**
```
https://www.bankofengland.org/monetary-policy/the-interest-rate-bank-rate
https://www.reuters.com/markets/asia/japan-bond-yields-2024-01-15/
https://www.federalreserve.gov/monetarypolicy/fomc.htm
```

#### 1B. Fetch Metadata for Each URL

For each URL, extract:
- Page title
- Author (if available)
- Publication date
- Publisher/site name

**Python script:**
```python
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from urllib.parse import urlparse

def fetch_citation_metadata(url):
    """Fetch metadata for citation formatting"""
    try:
        response = requests.get(url, timeout=10, headers={
            'User-Agent': 'Mozilla/5.0 (Citation Manager)'
        })

        if response.status_code != 200:
            return None

        soup = BeautifulSoup(response.content, 'html.parser')

        # Try to extract metadata
        metadata = {
            'url': url,
            'title': None,
            'author': None,
            'date': None,
            'publisher': None,
            'accessed': datetime.now().strftime('%Y-%m-%d')
        }

        # Title (try multiple sources)
        title_tag = soup.find('meta', property='og:title') or \
                   soup.find('meta', attrs={'name': 'title'}) or \
                   soup.find('title')

        if title_tag:
            metadata['title'] = title_tag.get('content') or title_tag.text.strip()

        # Author
        author_tag = soup.find('meta', attrs={'name': 'author'}) or \
                    soup.find('meta', property='article:author')

        if author_tag:
            metadata['author'] = author_tag.get('content')

        # Publication date
        date_tag = soup.find('meta', property='article:published_time') or \
                  soup.find('meta', attrs={'name': 'date'})

        if date_tag:
            metadata['date'] = date_tag.get('content')

        # Publisher (from domain if not found)
        publisher_tag = soup.find('meta', property='og:site_name')
        if publisher_tag:
            metadata['publisher'] = publisher_tag.get('content')
        else:
            # Extract from domain
            domain = urlparse(url).netloc
            metadata['publisher'] = domain.replace('www.', '').split('.')[0].title()

        return metadata

    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None
```

#### 1C. Format Citations

Support multiple citation styles:

**Chicago/Turabian (Default for Medium/Blog):**
```
Author. "Title." Publisher, Publication Date. URL. Accessed: Date.
```

**Example:**
```
Reuters. "Japan Bond Yields Rise to 15-Year High." Reuters, January 15, 2024.
https://www.reuters.com/markets/asia/japan-bond-yields-2024-01-15/. Accessed: February 14, 2026.
```

**APA Style:**
```
Author. (Year). Title. Publisher. URL
```

**MLA Style:**
```
Author. "Title." Publisher, Date. Web. Accessed Date.
```

#### 1D. Generate Bibliography Section

Create formatted bibliography and append to article:

```markdown
---

## References

1. Reuters. "Japan Bond Yields Rise to 15-Year High." Reuters, January 15, 2024. https://www.reuters.com/markets/asia/japan-bond-yields-2024-01-15/. Accessed: February 14, 2026.

2. Bank of England. "The Interest Rate Bank Rate." Bank of England, 2024. https://www.bankofengland.org/monetary-policy/the-interest-rate-bank-rate. Accessed: February 14, 2026.

3. Federal Reserve. "Federal Open Market Committee." Federal Reserve, 2024. https://www.federalreserve.gov/monetarypolicy/fomc.htm. Accessed: February 14, 2026.

---

*Note: All web references were verified as accessible on the date listed.*
```

---

## Action 2: Validate All Citations

**Goal:** Check that all external links are live and properly formatted.

### Steps:

#### 2A. Extract All Links from Article

```python
import re

def extract_links_from_markdown(md_content):
    """Extract all markdown links [text](url)"""
    pattern = r'\[([^\]]+)\]\(([^)]+)\)'
    links = re.findall(pattern, md_content)
    return [(text, url) for text, url in links]
```

#### 2B. Validate Each Link

```python
def validate_link(url, timeout=5):
    """Check if link is accessible"""
    try:
        response = requests.head(url, timeout=timeout, allow_redirects=True)
        return {
            'url': url,
            'status': response.status_code,
            'ok': response.status_code == 200,
            'final_url': response.url,  # After redirects
            'redirect': response.url != url
        }
    except requests.Timeout:
        return {'url': url, 'status': 'TIMEOUT', 'ok': False}
    except requests.RequestException as e:
        return {'url': url, 'status': 'ERROR', 'ok': False, 'error': str(e)}
```

#### 2C. Generate Validation Report

```markdown
## Citation Validation Report
**Article:** {{title}}
**Date:** {{date}}

### Link Health Summary
- ✅ **Live links:** 12/15 (80%)
- ❌ **Broken links:** 2/15 (13%)
- ⚠️ **Redirected:** 1/15 (7%)

### Issues Detected

#### 🔴 Broken Links (CRITICAL)
1. Line 45: https://example.com/old-article → **404 Not Found**
   - Recommendation: Find updated URL or remove citation

2. Line 89: https://deprecated-api.com/docs → **403 Forbidden**
   - Recommendation: Check if content moved to new domain

#### 🟡 Warnings
1. Line 67: https://short-url.ly/abc123 → Redirects to https://final-destination.com/article
   - Recommendation: Replace with final URL for stability

### ✅ Valid Citations
- Line 12: https://reuters.com/article → **200 OK**
- Line 34: https://federalreserve.gov/policy → **200 OK**
- (10 more...)

### Recommendations
1. Fix 2 broken links before publication
2. Replace shortened URL with final destination
3. Consider archiving all external sources (see Action 3)
```

---

## Action 3: Archive Important Sources

**Goal:** Save snapshots of important sources to Wayback Machine to prevent link rot.

### Why Archive?

- Protects against link rot (sites going offline)
- Preserves evidence of claims
- Creates permanent records of time-sensitive content
- Required for academic/professional credibility

### Steps:

#### 3A. Identify Critical Sources

**Critical sources are:**
- Primary sources (original research, data, announcements)
- News articles (may be paywalled later)
- Statistics and data (sites may update/remove)
- Policy documents (governments may reorganize sites)
- Technical documentation (APIs change)

**Less critical:**
- Major organization homepages (wikipedia.org, github.com)
- Permanent documentation (RFCs, academic papers with DOIs)

#### 3B. Archive to Wayback Machine

**Python script:**
```python
import requests
import time

def archive_url(url):
    """Submit URL to Wayback Machine for archiving"""
    archive_api = "https://web.archive.org/save/"

    try:
        response = requests.get(archive_api + url, timeout=30)

        if response.status_code == 200:
            # Extract archive URL from response
            archive_url = f"https://web.archive.org/web/{time.strftime('%Y%m%d')}/{url}"
            return {
                'success': True,
                'original_url': url,
                'archive_url': archive_url,
                'archived_date': time.strftime('%Y-%m-%d')
            }
        else:
            return {'success': False, 'url': url, 'error': f'Status {response.status_code}'}

    except Exception as e:
        return {'success': False, 'url': url, 'error': str(e)}
```

#### 3C. Update Article with Archive Links

**Add archive links to references:**

```markdown
## References

1. Reuters. "Japan Bond Yields Rise to 15-Year High." Reuters, January 15, 2024.
   https://www.reuters.com/markets/asia/japan-bond-yields-2024-01-15/
   [Archive](https://web.archive.org/web/20260214/https://www.reuters.com/markets/asia/japan-bond-yields-2024-01-15/)
   Accessed: February 14, 2026.
```

**Or create archive footnote:**
```markdown
[^1]: Archived version available at https://web.archive.org/web/20260214/...
```

#### 3D. Track Archived Sources

Create archive log:
```
{{category}}/{{slug}}/research_notes/archived-sources.md
```

**Content:**
```markdown
# Archived Sources
List of external sources archived to Wayback Machine

## Archive Log

### 2026-02-14
- https://reuters.com/article → https://web.archive.org/web/20260214/...
- https://federalreserve.gov/policy → https://web.archive.org/web/20260214/...

**Total archived:** 12 sources
**Last updated:** 2026-02-14
```

---

## Action 4: Add In-Text Citations

**Goal:** Add citation markers in the article body pointing to bibliography.

### Citation Styles

#### Numbered Citations (Recommended for web)
```markdown
Japan's bond yields reached 1.5% in January 2024 [1], marking the highest level since 2009.

## References
[1] Reuters. "Japan Bond Yields..." (full citation)
```

#### Parenthetical Citations (Academic style)
```markdown
Japan's bond yields reached 1.5% in January 2024 (Reuters, 2024).

## References
Reuters. (2024). Japan Bond Yields... (full citation)
```

#### Footnote Citations (Traditional)
```markdown
Japan's bond yields reached 1.5% in January 2024.[^1]

[^1]: Reuters. "Japan Bond Yields..." (full citation)
```

### Steps:

#### 4A. Identify Uncited Claims

Scan article for:
- Statistics (numbers, percentages)
- Dates and events
- Direct quotes
- Technical specifications
- Policy statements

**Flag uncited claims:**
```markdown
## Uncited Claims Report

Line 45: "70% of companies use Kubernetes"
  → ❌ No citation found
  → Recommendation: Add [source] or find supporting data in research notes

Line 67: "AWS Lambda launched in 2014"
  → ✅ General knowledge, citation optional but recommended

Line 89: Quote from Jane Doe
  → ❌ No source link
  → Recommendation: Add link to original interview/article
```

#### 4B. Match Claims to Sources

Cross-reference with research notes:
```python
def find_supporting_source(claim, research_notes):
    """Search research notes for claim support"""
    # Simple keyword matching
    claim_keywords = extract_keywords(claim)

    for note_file in research_notes:
        note_content = read_file(note_file)
        if any(keyword in note_content.lower() for keyword in claim_keywords):
            return note_file

    return None
```

#### 4C. Insert Citation Markers

Add numbered citations:
```markdown
Before: Japan's bond yields reached 1.5% in January 2024.
After:  Japan's bond yields reached 1.5% in January 2024 [1].
```

Maintain citation numbering consistency throughout document.

---

## Action 5: Format References Section

**Goal:** Ensure bibliography follows consistent format and style.

### Reference Section Structure

```markdown
---

## References

### Primary Sources
1. [Primary source citations...]

### Academic & Research
2. [Academic citations...]

### News & Analysis
3. [News article citations...]

### Technical Documentation
4. [API docs, technical specs...]

---

## Further Reading
- Related articles in this publication
- Additional resources not directly cited
```

### Citation Formatting Checklist

For each citation verify:
- [ ] Author/publisher listed
- [ ] Title in quotes or italics
- [ ] Publication date included
- [ ] URL is complete and working
- [ ] Access date noted
- [ ] Consistent formatting across all references

---

## Full Citation Audit (Action 5)

**Comprehensive check combining all actions:**

### Audit Steps:

1. **Extract** all citations from article
2. **Validate** all links (Action 2)
3. **Archive** critical sources (Action 3)
4. **Generate** bibliography from research notes (Action 1)
5. **Verify** in-text citations match bibliography (Action 4)
6. **Format** references section (Action 5)
7. **Report** findings and recommendations

### Audit Report Template

```markdown
# Citation Audit Report
**Article:** {{title}}
**Date:** {{date}}
**Auditor:** Citation Manager

---

## Executive Summary
- **Total citations:** 15
- **Valid citations:** 12 ✅
- **Broken citations:** 2 ❌
- **Missing citations:** 3 ⚠️
- **Archived sources:** 10 📦

---

## Issues Found

### 🔴 Critical (Must Fix)
1. Line 45: Unsupported statistic - no citation
2. Line 89: Broken link (404)

### 🟡 Warnings
1. Line 34: Citation format inconsistent
2. Line 67: Should add archive link

### 🟢 Recommendations
1. Add 3 more sources to strengthen claims
2. Consider archiving all news sources

---

## Actions Taken
- ✅ Generated bibliography from research notes
- ✅ Validated all 15 links
- ✅ Archived 10 critical sources
- ✅ Added in-text citation markers
- ✅ Formatted references section

## Next Steps
1. Fix 2 broken citations
2. Add sources for 3 uncited claims
3. Re-run validation after fixes

---

**Audit completed:** {{timestamp}}
**Status:** ⚠️ NEEDS ATTENTION (2 critical issues)
```

---

## Helper Tools & Scripts

### Install Dependencies

```bash
# Python packages
pip install requests beautifulsoup4 lxml --break-system-packages

# Optional: For academic citations
pip install habanero crossref-commons --break-system-packages
```

### Quick Citation Tool

Create: `.agent/tools/quick_cite.py`

```python
#!/usr/bin/env python3
"""
Quick citation generator
Usage: python quick_cite.py <url>
"""

import sys
import requests
from bs4 import BeautifulSoup
from datetime import datetime

def quick_cite(url):
    # Fetch metadata (as shown in Action 1B)
    metadata = fetch_citation_metadata(url)

    if not metadata:
        return f"Error: Could not fetch metadata for {url}"

    # Format as Chicago style
    citation = f"{metadata['publisher']}. \"{metadata['title']}.\""

    if metadata['date']:
        citation += f" {metadata['date']}."

    citation += f" {metadata['url']}."
    citation += f" Accessed: {metadata['accessed']}."

    return citation

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python quick_cite.py <url>")
        sys.exit(1)

    url = sys.argv[1]
    print(quick_cite(url))
```

**Usage:**
```bash
python .agent/tools/quick_cite.py "https://reuters.com/article"
# Output: Reuters. "Article Title." January 15, 2024. https://... Accessed: Feb 14, 2026.
```

---

## Integration with Other Workflows

### With Quality Check
```markdown
# quality_check.md - Check #4: Citation Audit

Invoke Citation Manager:
1. Run full citation audit
2. Verify all claims have sources
3. Check all links are valid
4. Ensure references section exists
```

### With Draft New Article
```markdown
# draft_new_article.md - Step 7

After creating draft, remind user:
"When adding facts and data, use the Citation Manager to:
- Track sources in research notes
- Generate bibliography
- Validate citations"
```

### With SEO Optimization
```markdown
# optimize_seo.md - After Step 3

Run citation check:
1. Validate external links (affects SEO score)
2. Ensure proper reference structure
3. Archive sources for long-term SEO value
```

---

## Best Practices

### Citation Guidelines

**Always cite:**
- 🔴 Statistics and data points
- 🔴 Direct quotes
- 🔴 Technical specifications
- 🔴 Policy statements
- 🔴 Research findings

**Optional citation:**
- 🟢 Common knowledge facts
- 🟢 Your own original analysis
- 🟢 General industry trends

**Never cite:**
- ❌ Your own previously published work (link instead)
- ❌ Paywalled content (find open alternatives)
- ❌ Broken or inaccessible sources

### Archive Everything Important

Archive these source types:
- ✅ News articles (may move behind paywalls)
- ✅ Technical documentation (versions change)
- ✅ Government reports (sites reorganize)
- ✅ Statistics from dashboards (data updates)
- ✅ Blog posts (may be deleted)

Don't waste time archiving:
- ❌ Wikipedia (already archived)
- ❌ Academic papers with DOIs (permanent)
- ❌ RFCs and standards (stable)
- ❌ Major institution homepages

---

## Success Metrics

Track over time:
- Average citations per article
- Percentage of broken links
- Time to generate bibliography
- Number of sources archived
- Citation-to-claim ratio

**Target metrics:**
- 100% of statistics cited
- 0% broken links at publication
- All critical sources archived
- Bibliography generated in <5 minutes

---

**Remember:** Proper citations build credibility and protect you from accusations of plagiarism or misinformation!
