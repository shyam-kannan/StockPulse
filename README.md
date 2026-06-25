# StockPulse

A real-time stock research dashboard that scrapes financial news, social media sentiment, and market data, then runs it through Claude AI to generate actionable analysis. Built as a personal project to learn full-stack development and explore how AI can synthesize scattered financial data into something actually useful for retail investors.

**Live site:** [frontend-lac-zeta-91.vercel.app](https://frontend-lac-zeta-91.vercel.app)

## What it does

**Dashboard** - Shows an AI-generated daily market briefing, trending tickers ranked by social + news mentions, a live news feed from Yahoo Finance, MarketWatch, CNBC, and Google News, and top stock picks with conviction ratings.

**Analysis** - Search any ticker to get a full AI breakdown: momentum analysis, fundamental valuation, price targets (bear/base/bull/stretched), a 30-day price chart, and social sentiment from Twitter/X and Reddit.

**Portfolio Builder** - Generates a diversified portfolio of individual stocks and ETFs based on current market conditions, with entry prices, targets, stop losses, sector allocation, and stocks to avoid.

**Learn** - Live market status with pre-market/regular/after-hours tracking, a stock market glossary, and educational content on order types, P/E ratios, short interest, and risk management.

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, Vite, Tailwind CSS v4, Framer Motion, Recharts, Lucide icons |
| Backend | Python, FastAPI, SQLite (aiosqlite), APScheduler |
| AI | Claude API (Anthropic) for analysis, Grok API (xAI) for social scraping |
| Data sources | Yahoo Finance API, RSS feeds (Yahoo, MarketWatch, CNBC, Google News, Investing.com), ApeWisdom, StockTwits |
| Hosting | Vercel (frontend), Railway (backend) |

## Architecture

```
Browser --> Vercel (React SPA) --> Railway (FastAPI)
                                      |
                                      +--> SQLite (scraped data + cache)
                                      +--> Claude API (analysis + briefing + portfolio)
                                      +--> Grok API (Twitter/X + Reddit social data)
                                      +--> Yahoo Finance (prices + charts)
                                      +--> RSS feeds (news)
                                      +--> ApeWisdom (Reddit mention counts)
                                      +--> StockTwits (sentiment)
```

The backend runs a scraper every 2 hours via APScheduler. After scraping, it pre-generates the daily briefing and portfolio recommendation so those endpoints return cached data instantly instead of making the user wait for a Claude API call.

## Setup (local development)

### Prerequisites

- Python 3.11+
- Node.js 18+
- An Anthropic API key (for Claude analysis)
- Optionally, an xAI API key (for Grok social scraping)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate     # Mac/Linux
# venv\Scripts\activate      # Windows

pip install -r requirements.txt

# Create .env from the example
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY
# Optionally add XAI_API_KEY for social data via Grok

python main.py
```

The backend starts on `http://localhost:8000`. On first startup it initializes the SQLite database and triggers an immediate scrape.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend automatically.

### Environment variables

**Backend (.env)**

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Claude API key for AI analysis |
| `XAI_API_KEY` | No | xAI/Grok API key for Twitter/X and Reddit scraping |
| `DATABASE_PATH` | No | SQLite file path (default: `./stockpulse.db`) |
| `ALLOWED_ORIGINS` | No | CORS origins, comma-separated (default: `*`) |

**Frontend (.env.production)**

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend URL for production (e.g. `https://your-app.up.railway.app`) |

## Deployment

### Backend (Railway)

1. Connect your GitHub repo to Railway
2. Set the root directory to `backend`
3. Add environment variables: `ANTHROPIC_API_KEY`, `XAI_API_KEY`, `ALLOWED_ORIGINS`
4. Railway auto-detects the `Procfile` and deploys

### Frontend (Vercel)

```bash
cd frontend
npx vercel --prod
```

Or connect the repo to Vercel with the root directory set to `frontend`.

## Known limitations and improvements needed

### Scraping

The scraping setup works but has real gaps:

- **No direct Reddit API access.** Reddit's Data API requires explicit approval, so social data comes from Grok (which can see public Reddit content) and ApeWisdom (which tracks mention counts). This means the "Social Activity" section on the dashboard is often empty because Grok's social posts don't always get stored correctly, and ApeWisdom only provides aggregate counts, not individual posts.

- **StockTwits rate limiting.** The StockTwits API aggressively rate-limits requests. The scraper fetches trending symbols (which works) but often gets blocked before it can pull individual post content for each ticker.

- **Grok dependency for social data.** If the xAI API key is missing or the API is down, there is zero Twitter/X data. A proper setup would use the Twitter/X API directly, but that requires a paid developer account.

- **RSS feeds are limited.** News comes from public RSS feeds which don't include every article and sometimes have sparse summaries. A proper news API (like NewsAPI or a Bloomberg terminal feed) would give much better coverage.

- **Yahoo Finance rate limiting.** Price data comes from Yahoo Finance's unofficial chart API. Under heavy load it can throttle requests, which means some trending tickers show no price data.

### Other improvements

- Add WebSocket support for real-time price updates instead of polling
- Add user accounts and saved watchlists (currently watchlist is localStorage only)
- Add historical analysis tracking to see how AI picks performed over time
- Add options flow data and institutional ownership
- Add earnings calendar integration
- Improve mobile responsiveness on the analysis page charts
- Add proper error boundaries and retry logic on the frontend
- Move from SQLite to PostgreSQL for production reliability

## Project structure

```
StockPulse/
  backend/
    main.py              # FastAPI app, routes, market status
    analysis.py           # Claude AI analysis, briefing, portfolio generation
    scrapers.py           # News, social, and market data scrapers
    scheduler.py          # APScheduler for periodic scraping
    database.py           # SQLite schema, queries, caching
    tickers.py            # S&P 500 ticker list and extraction
    requirements.txt
    Procfile              # Railway deployment
    .env.example
  frontend/
    src/
      pages/              # Dashboard, Analysis, Portfolio, Market pages
      components/         # UI components organized by feature
      utils/              # API client, formatters
      hooks/              # Custom React hooks
    .env.production
    vercel.json           # SPA routing config
```

## License

MIT
