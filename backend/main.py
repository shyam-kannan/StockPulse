import os
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

ET = ZoneInfo("America/New_York")

NYSE_HOLIDAYS_2025 = {
    (1, 1), (1, 20), (2, 17), (4, 18), (5, 26),
    (6, 19), (7, 4), (9, 1), (11, 27), (12, 25),
}
NYSE_HOLIDAYS_2026 = {
    (1, 1), (1, 19), (2, 16), (4, 3), (5, 25),
    (6, 19), (7, 3), (9, 7), (11, 26), (12, 25),
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    from database import init_db
    from scheduler import start_scheduler, stop_scheduler

    print("StockPulse backend starting up...")
    await init_db()
    start_scheduler()
    yield
    stop_scheduler()
    print("StockPulse backend shutting down...")


app = FastAPI(title="StockPulse API", version="0.1.0", lifespan=lifespan)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok", "timestamp": time.time(), "version": "0.1.0"}


@app.post("/api/scrape")
async def trigger_scrape():
    from scheduler import trigger_manual_scrape
    trigger_manual_scrape()
    return {"status": "scraping started", "timestamp": time.time()}


@app.get("/api/trending")
async def get_trending():
    from database import get_trending_tickers
    from tickers import get_company_name

    tickers = await get_trending_tickers(hours=24, limit=20)

    enriched = []
    for t in tickers:
        ticker_sym = t["ticker"]
        enriched.append({
            "ticker": ticker_sym,
            "company_name": get_company_name(ticker_sym),
            "mention_count": t["mention_count"],
            "avg_sentiment": t["avg_sentiment"],
            "sources": t["sources"],
            "current_price": None,
            "price_change_pct": None,
        })

    # Batch fetch prices via yfinance in a thread to avoid blocking
    if enriched:
        import asyncio
        loop = asyncio.get_event_loop()
        try:
            prices = await loop.run_in_executor(None, _fetch_batch_prices, [e["ticker"] for e in enriched])
            for item in enriched:
                pdata = prices.get(item["ticker"], {})
                item["current_price"] = pdata.get("price")
                item["price_change_pct"] = pdata.get("change_pct")
                item["market_cap"] = pdata.get("market_cap")
        except Exception as e:
            print(f"Error fetching batch prices: {e}")

    return enriched


def _fetch_batch_prices(tickers: list[str]) -> dict:
    import httpx

    prices = {}
    # Primary: direct Yahoo Finance chart API — fast, reliable, no library overhead
    with httpx.Client() as hc:
        hc.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
        for ticker in tickers[:20]:
            try:
                resp = hc.get(
                    f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}",
                    params={"interval": "1d", "range": "5d"},
                    timeout=10,
                )
                if resp.status_code == 200:
                    chart = resp.json().get("chart", {}).get("result", [{}])[0]
                    meta = chart.get("meta", {})
                    price = meta.get("regularMarketPrice")
                    prev = meta.get("chartPreviousClose")
                    if price and prev:
                        change = round(((price - prev) / prev) * 100, 2)
                        prices[ticker] = {"price": round(price, 2), "change_pct": change}
            except Exception:
                continue

    return prices


@app.get("/api/feed")
async def get_feed():
    from database import get_recent_news
    items = await get_recent_news(limit=50)
    return items


@app.get("/api/market-status")
async def get_market_status():
    now_et = datetime.now(ET)
    today = now_et.date()
    weekday = now_et.weekday()

    is_holiday = (today.month, today.day) in NYSE_HOLIDAYS_2025 or \
                 (today.month, today.day) in NYSE_HOLIDAYS_2026

    regular_open = now_et.replace(hour=9, minute=30, second=0, microsecond=0)
    regular_close = now_et.replace(hour=16, minute=0, second=0, microsecond=0)
    premarket_open = now_et.replace(hour=4, minute=0, second=0, microsecond=0)
    afterhours_close = now_et.replace(hour=20, minute=0, second=0, microsecond=0)

    is_weekday = weekday < 5

    if is_weekday and not is_holiday:
        if premarket_open <= now_et < regular_open:
            status = "pre_market"
            is_open = False
        elif regular_open <= now_et < regular_close:
            status = "open"
            is_open = True
        elif regular_close <= now_et < afterhours_close:
            status = "after_hours"
            is_open = False
        else:
            status = "closed"
            is_open = False
    else:
        status = "closed"
        is_open = False

    # Calculate next open/close
    if is_open:
        next_close = regular_close.isoformat()
        next_open = None
    else:
        next_open_date = today
        if weekday >= 5:
            next_open_date = today + timedelta(days=(7 - weekday))
        elif now_et >= regular_close:
            next_open_date = today + timedelta(days=1)
            if next_open_date.weekday() >= 5:
                next_open_date += timedelta(days=(7 - next_open_date.weekday()))

        next_open_dt = datetime(
            next_open_date.year, next_open_date.month, next_open_date.day,
            9, 30, 0, tzinfo=ET
        )
        next_open = next_open_dt.isoformat()
        next_close = None

    return {
        "is_open": is_open,
        "status": status,
        "current_time_et": now_et.isoformat(),
        "next_open": next_open,
        "next_close": next_close,
        "market_hours": {
            "pre_market": {"start": "4:00 AM ET", "end": "9:30 AM ET"},
            "regular": {"start": "9:30 AM ET", "end": "4:00 PM ET"},
            "after_hours": {"start": "4:00 PM ET", "end": "8:00 PM ET"},
        },
        "guide": {
            "regular_hours": "The NYSE and NASDAQ are open 9:30 AM to 4:00 PM Eastern Time, Monday through Friday.",
            "pre_market": "Pre-market trading runs from 4:00 AM to 9:30 AM ET. Liquidity is lower, spreads are wider, and prices can be more volatile.",
            "after_hours": "After-hours trading runs from 4:00 PM to 8:00 PM ET. Same caveats as pre-market: lower volume and wider spreads.",
            "volatility_warning": "Trading outside regular hours carries higher risk due to lower volume. Price swings can be larger and may not reflect where the stock opens the next day.",
            "best_times": "For beginners: the first 30 minutes (9:30-10:00 AM) and last 30 minutes (3:30-4:00 PM) of regular trading see the highest volume and tightest spreads. Avoid the first 15 minutes if you're not comfortable with volatility.",
            "settlement": "T+1 settlement: when you sell a stock, the cash settles in your account the next business day. You can trade with unsettled funds in a margin account, but not in a cash account without risking a violation.",
        },
    }


@app.get("/api/education")
async def get_education():
    return [
        {
            "id": "when-to-buy",
            "title": "When to Buy: Time of Day Matters",
            "category": "Timing",
            "summary": "The best times to trade are the first and last 30 minutes of the regular session. Avoid the first 15 minutes.",
            "details": "Market opens at 9:30 AM ET with a flood of overnight orders. The first 15 minutes are chaotic — prices gap up or down as orders fill. Wait until 9:45-10:00 AM for the dust to settle. The last 30 minutes (3:30-4:00 PM) also see heavy volume as institutional traders rebalance. Mid-day (11:30 AM - 2:00 PM) is often the lowest volume period — spreads widen and stocks can drift. If you're a beginner, place your trades between 9:45-11:00 AM or 3:30-3:55 PM.",
        },
        {
            "id": "order-types",
            "title": "Order Types: Always Use Limit Orders",
            "category": "Execution",
            "summary": "Market orders fill immediately at whatever price is available. Limit orders let you set the max price you'll pay.",
            "details": "A market order says 'buy at any price' — dangerous during volatile moments when the price can spike between when you click and when the order fills (slippage). A limit order says 'buy at $X or better.' You might not get filled if the price moves past your limit, but you'll never overpay. Rule of thumb: always use limit orders. Set your limit a few cents above the current ask for buys, or a few cents below the bid for sells, to increase fill probability while still protecting yourself.",
        },
        {
            "id": "momentum",
            "title": "Reading Stock Momentum",
            "category": "Analysis",
            "summary": "Volume confirms price moves. A stock rising on high volume is stronger than one rising on low volume.",
            "details": "Momentum = price direction + volume confirmation. If a stock jumps 5% on 3x its average volume, that's strong momentum — lots of buyers agree on the new price. If it jumps 5% on low volume, it might reverse quickly. Key indicators: RSI (Relative Strength Index) above 70 = overbought, below 30 = oversold. MACD crossover above the signal line = bullish momentum. The 50-day and 200-day moving averages act as support/resistance — a stock above both is in an uptrend.",
        },
        {
            "id": "pe-ratio",
            "title": "P/E Ratio in Plain English",
            "category": "Fundamentals",
            "summary": "P/E tells you how many years of current earnings you're paying for. Lower isn't always better.",
            "details": "Price-to-Earnings ratio = Stock Price ÷ Earnings Per Share. If a stock is $100 with $5 EPS, the P/E is 20 — you're paying 20 years of earnings. The S&P 500 average P/E is around 20-25. A P/E of 10 might mean the stock is cheap OR that growth is declining. A P/E of 50 might mean it's expensive OR that investors expect massive growth. Compare P/E to: (1) the stock's own historical P/E, (2) its sector average, (3) its growth rate. A P/E of 30 with 30% growth (PEG ratio of 1.0) is reasonably valued. A P/E of 30 with 5% growth is expensive.",
        },
        {
            "id": "earnings",
            "title": "Why Earnings Dates Matter",
            "category": "Events",
            "summary": "Stocks can swing 5-20% on earnings reports. Know the date, know the expectations, have a plan.",
            "details": "Every quarter, companies report revenue and earnings. The stock price reacts to results vs. expectations, not absolute numbers. A company can report record revenue and still drop 10% if analysts expected more. Before earnings: IV (implied volatility) on options spikes, making options expensive. After earnings: IV crushes and options lose value fast. Strategy for beginners: don't hold options through earnings unless you understand IV crush. For stock positions, decide before earnings if you'll hold through or sell before. The earnings call (conference call after results) often matters more than the numbers themselves.",
        },
        {
            "id": "short-interest",
            "title": "Short Interest Explained",
            "category": "Analysis",
            "summary": "Short interest tells you what percentage of shares are being bet against. High short interest can fuel explosive rallies.",
            "details": "Short selling = borrowing shares to sell them, hoping to buy back cheaper later. Short interest = the percentage of a company's float (tradeable shares) that are currently sold short. Below 5% = normal. 10-20% = elevated bearish sentiment. Above 20% = heavily shorted. A short squeeze happens when a heavily shorted stock rises, forcing shorts to buy back shares to limit losses, which pushes the price higher, triggering more buybacks. GME in January 2021 went from $20 to $480 partly due to a short squeeze. Check short interest on finviz.com or your broker's platform. Days to cover = short interest ÷ average daily volume. Higher days to cover = more squeeze potential.",
        },
        {
            "id": "stop-loss",
            "title": "Stop Losses: Your Safety Net",
            "category": "Risk Management",
            "summary": "A stop loss automatically sells your position if the stock drops to a certain price. Always use one.",
            "details": "A stop loss order triggers a market sell when the stock hits your stop price. Example: you buy at $100, set a stop loss at $90 — if it drops to $90, it auto-sells to limit your loss to ~10%. Types: (1) Stop market — triggers a market order at the stop price. Can fill below your stop in a fast drop. (2) Stop limit — triggers a limit order. Won't fill below your limit, but might not fill at all in a crash. (3) Trailing stop — moves up with the stock price. A 10% trailing stop on a stock that rises from $100 to $150 would trigger at $135. Rule of thumb: risk no more than 1-2% of your portfolio on any single trade. If your portfolio is $10,000, don't risk more than $100-200 per trade.",
        },
        {
            "id": "diversification",
            "title": "Diversification: Don't Put All Eggs in One Basket",
            "category": "Risk Management",
            "summary": "Spread your money across different stocks, sectors, and asset types to reduce risk.",
            "details": "Diversification means if one investment drops, your whole portfolio doesn't tank. Basic rules: (1) Don't put more than 5-10% of your portfolio in a single stock. (2) Spread across sectors — tech, healthcare, finance, energy, consumer. (3) Include different asset types — stocks, bonds, international. (4) ETFs like SPY (S&P 500) or QQQ (Nasdaq 100) give instant diversification. A portfolio of 5 tech stocks is NOT diversified even though it's 5 stocks — they'll all drop together if tech sells off. Aim for 15-25 individual positions or a mix of ETFs and individual picks.",
        },
    ]


@app.get("/api/daily-briefing")
async def get_daily_briefing(refresh: bool = False):
    from analysis import generate_daily_briefing
    try:
        result = await generate_daily_briefing(force_refresh=refresh)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Briefing failed: {str(e)}")


@app.get("/api/portfolio-recommendation")
async def get_portfolio_recommendation(refresh: bool = False):
    from analysis import generate_portfolio_recommendation
    try:
        result = await generate_portfolio_recommendation(force_refresh=refresh)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portfolio recommendation failed: {str(e)}")


@app.get("/api/reddit-activity")
async def get_reddit_activity():
    from database import get_recent_reddit_posts
    posts = await get_recent_reddit_posts(limit=40)
    return posts


@app.get("/api/stock/{ticker}")
async def get_stock(ticker: str):
    ticker = ticker.upper().strip()
    if not ticker.isalpha() or len(ticker) > 5 or len(ticker) < 1:
        raise HTTPException(status_code=400, detail="Invalid ticker format. Use 1-5 letters.")

    from analysis import get_stock_analysis
    try:
        result = await get_stock_analysis(ticker)
        return result
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.get("/api/tickers/search")
async def search_tickers(q: str = Query("", min_length=1, max_length=10)):
    from tickers import search_tickers
    return search_tickers(q, limit=10)


@app.get("/api/debug/db-stats")
async def db_stats():
    from database import get_db
    db = await get_db()
    try:
        tables = ["reddit_posts", "news_items", "ticker_mentions", "analysis_cache"]
        counts = {}
        for table in tables:
            cursor = await db.execute(f"SELECT COUNT(*) FROM {table}")
            row = await cursor.fetchone()
            counts[table] = row[0]
        return counts
    finally:
        await db.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
