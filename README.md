# StockPulse

AI-powered stock research dashboard that scrapes Reddit and financial news, analyzes sentiment, and runs Claude AI analysis on any ticker.

## Features

- **Trending Dashboard** — Top 20 most-mentioned tickers across Reddit and financial news in the last 24 hours
- **AI Analysis** — 3 Claude-powered research prompts for any ticker:
  - Momentum Analysis (social narrative, catalysts, institutional view)
  - Fundamental Snapshot (P/E, growth, cash vs debt, fair value)
  - Price Target Framework (bear/base/bull/stretched bull with entry/trim/stop)
- **News Feed** — Live headlines from Yahoo Finance and MarketWatch RSS
- **Market Status** — Real-time NYSE open/closed indicator with market hours guide
- **Education** — Beginner-friendly stock market knowledge cards
- **Watchlist** — LocalStorage-persisted ticker watchlist

## Tech Stack

**Backend:** Python, FastAPI, SQLite (aiosqlite), APScheduler, yfinance, Anthropic Claude API, BeautifulSoup, feedparser, TextBlob

**Frontend:** React, Vite, Tailwind CSS v4, Recharts, React Router, Lucide React

**Deploy:** Railway (backend), Vercel (frontend)

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Anthropic API key

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Create .env from template
cp .env.example .env
# Edit .env and add your ANTHROPIC_API_KEY

python main.py
# Server starts at http://localhost:8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173 (proxies API to :8000)
```

## Deployment

### Backend → Railway

1. Connect this repo to Railway
2. Set root directory to `/backend`
3. Add environment variable: `ANTHROPIC_API_KEY`
4. Railway auto-detects the Procfile and deploys

### Frontend → Vercel

1. Connect this repo to Vercel
2. Set root directory to `/frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend.up.railway.app`
4. Vercel auto-detects Vite and deploys

## Environment Variables

| Variable | Required | Where | Description |
|----------|----------|-------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Backend | Claude API key |
| `DATABASE_PATH` | No | Backend | SQLite path (default: `./stockpulse.db`) |
| `ALLOWED_ORIGINS` | No | Backend | CORS origins (default: `*`) |
| `VITE_API_URL` | Yes (prod) | Frontend | Backend URL on Railway |

## Architecture

```
┌──────────────────┐     ┌───────────────────────────────────┐
│  React Frontend  │────▶│         FastAPI Backend            │
│  (Vercel)        │     │         (Railway)                  │
└──────────────────┘     │                                   │
                         │  ┌─────────┐  ┌──────────────┐   │
                         │  │Scheduler│  │ Claude API    │   │
                         │  │(2h loop)│  │ (3 prompts)   │   │
                         │  └────┬────┘  └──────────────┘   │
                         │       │                           │
                         │  ┌────▼────┐  ┌──────────────┐   │
                         │  │Scrapers │  │  yfinance     │   │
                         │  │Reddit   │  │  (prices)     │   │
                         │  │RSS News │  └──────────────┘   │
                         │  └────┬────┘                      │
                         │       │                           │
                         │  ┌────▼────┐                      │
                         │  │ SQLite  │                      │
                         │  │ (WAL)   │                      │
                         │  └─────────┘                      │
                         └───────────────────────────────────┘
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/trending` | Top 20 trending tickers (24h) |
| GET | `/api/stock/{ticker}` | Full AI analysis for a ticker |
| GET | `/api/feed` | Last 50 news items |
| GET | `/api/market-status` | NYSE market status + hours guide |
| GET | `/api/education` | Stock market education cards |
| GET | `/api/tickers/search?q=` | Ticker autocomplete search |
| POST | `/api/scrape` | Trigger manual data scrape |

---

*For educational purposes only. Not financial advice. Always do your own research.*
