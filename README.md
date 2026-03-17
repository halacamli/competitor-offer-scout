# Competitor Offer Scout 🔍
> Automated competitor offer intelligence for Nordic markets

---

## What is Competitor Offer Scout?

Offer Scout is a competitive intelligence automation tool built for 
performance marketing teams operating in Sweden and the Nordic region.

It automatically scans competitor websites every morning and detects 
active campaigns, discounts, membership offers and urgency messaging — 
saving the results to Google Sheets for analysis.

The web interface allows manual on-demand analysis and direct export 
to Google Sheets with a single click.

---

## Why it matters for performance marketing

When a competitor launches a "-50% REA" campaign or a 
"3 månader gratis" offer, it directly affects your paid media performance:
- CTR drops because competitor ads are more compelling
- Conversion rate changes because landing page offers differ
- CPA increases without an obvious reason in your own data

Offer Scout gives your team the **"why"** behind performance shifts — 
before your weekly report, not after.

**Key use cases:**
- Morning briefing: what did competitors launch overnight?
- Campaign planning: are competitors more aggressive this week?
- Creative strategy: what offer formats and copy are working in market?
- Bid strategy: adjust spend when competitive pressure increases
- Client reporting: explain performance changes with market context

---

## How it works

### Automated daily scraping (primary mode)
A GitHub Actions workflow runs every morning at 08:00 Swedish time.
It scrapes each competitor's landing page, detects offer-related content
using multilingual keyword matching (Swedish, Norwegian, Danish, 
Finnish, German, English), and appends results to Google Sheets.

## Setup

Fill in `.env`:
```
VITE_APIFY_TOKEN=          # from apify.com
VITE_SUPABASE_URL=         # from supabase project settings
VITE_SUPABASE_ANON_KEY=    # from supabase project settings
VITE_APPS_SCRIPT_URL=      # from Google Apps Script deployment
VITE_GOOGLE_SHEETS_ID=     # from Google Sheets URL
```

### 3. Google Sheets setup
1. Create a new Google Sheet named "Offer Scout Results"
2. Add headers in row 1:
   `Date | Brand | URL | Found Text | Offer Type | Price Pattern | Matched Keyword`
3. Extensions → Apps Script → paste the script from `/scripts/apps-script.js`
4. Deploy as Web App → Execute as Me → Anyone can access
5. Copy the deployment URL → add to `VITE_APPS_SCRIPT_URL`

### 4. Run locally
```bash
npm run dev
```

### 5. Deploy to Vercel
Connect GitHub repo to Vercel, add all environment variables, deploy.

## Live Demo

> **Google Sheets Output**: [View Sample Data](YOUR_SHEETS_LINK_HERE)
> 
> *https://docs.google.com/spreadsheets/d/1xrF_zAwd60hedHNOwnwkcPT8ptcdOlvhSeKiulNfOss/edit?usp=sharing*

---

## GitHub Actions setup (daily automation)

Add these secrets to your GitHub repo (Settings → Secrets → Actions):

| Secret | Value |
|--------|-------|
| `VITE_APIFY_TOKEN` | Your Apify API token |
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_APPS_SCRIPT_URL` | Your Apps Script deployment URL |

The workflow runs daily at 07:00 UTC (08:00 Swedish winter time, 
09:00 summer time). It can also be triggered manually from the 
Actions tab in GitHub.

---

## Monitored sites (default)

| Brand | URL | Country |
|-------|-----|---------|
| Tele2 | tele2.se | SE |
| Telia | telia.se | SE |
| Telenor | telenor.se | SE |
| Tre | tre.se | SE |
| Comviq | comviq.se | SE |

Sites are configurable in `scraper/daily.js`.

---

## Tech stack

- **Frontend** — React + Vite + Tailwind CSS
- **Scraping** — Apify Playwright Scraper (residential proxies)
- **Automation** — GitHub Actions (free tier)
- **Storage** — Google Sheets via Apps Script
- **Deploy** — Vercel (free tier)

---

## Roadmap

- [ ] Image/banner OCR via Claude Vision API
- [ ] Meta Ads Library integration
- [ ] Slack/email alerts when new offers detected
- [ ] Historical trend charts
- [ ] Multi-market support (NO, DK, FI, DE)
- [ ] Competitor offer scoring & ranking

---

## Disclaimer

The brands, websites and sectors used in this project 
(Tele2, Telia, Telenor, Tre, Comviq) are **examples only** 
and are included solely for demonstration purposes.

This tool is sector-agnostic and can be configured for any 
industry or market by updating `scraper/daily.js` and the 
web interface inputs.

**Data & legal:**
- Offer Scout only accesses publicly available information 
  visible to any website visitor
- No authentication, login or private data is accessed
- All scraped content is already publicly indexed by search engines
- Web scraping of public data is legal under EU and Swedish law,
  consistent with Meta v. Bright Data (2024) and similar precedents
- Users are responsible for ensuring compliance with the terms 
  of service of any website they choose to monitor
- This tool does not store or redistribute copyrighted content — 
  it extracts and classifies short text snippets for 
  competitive intelligence purposes only

**No affiliation:**
This project has no affiliation with, endorsement from, or 
connection to any of the example brands mentioned.
