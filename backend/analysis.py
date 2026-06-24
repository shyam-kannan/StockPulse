import os
import json
import time
import asyncio
import traceback

import httpx
import yfinance as yf
from anthropic import AsyncAnthropic

from database import (
    get_cached_analysis,
    set_cached_analysis,
    get_ticker_mentions,
    get_reddit_posts_for_ticker,
    get_trending_tickers,
    get_recent_reddit_posts,
    get_recent_news,
    get_briefing_cache,
    set_briefing_cache,
)
from tickers import get_company_name

_client = None


def get_client() -> AsyncAnthropic:
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        _client = AsyncAnthropic(api_key=api_key)
    return _client


MODEL = "claude-sonnet-4-6"


def _fetch_price_via_grok(ticker: str, company_name: str) -> dict:
    """Use Grok for real-time price data when yfinance is rate-limited."""
    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        return {}

    prompt = (
        f"What is the current stock price and key data for {ticker} ({company_name})? "
        "Return ONLY valid JSON, no other text:\n"
        '{"price": 123.45, "previous_close": 122.30, "market_cap_billions": 3500, '
        '"pe_ratio": 28.5, "sector": "Technology", "week52_high": 199.62, '
        '"week52_low": 164.08, "company_name": "Apple Inc."}'
    )

    try:
        with httpx.Client() as client:
            resp = client.post(
                "https://api.x.ai/v1/chat/completions",
                json={
                    "model": "grok-3-mini",
                    "messages": [
                        {"role": "system", "content": "You are a stock data provider. Return ONLY valid JSON with current market data. No markdown, no explanation."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0,
                },
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                timeout=20,
            )
            resp.raise_for_status()
            content = resp.json()["choices"][0]["message"]["content"].strip()
            if "```" in content:
                lines = content.split("\n")
                content = "\n".join(l for l in lines if not l.strip().startswith("```"))
            data = json.loads(content)
            print(f"[Grok] Price fallback for {ticker}: ${data.get('price')}")
            return data
    except Exception as e:
        print(f"[Grok] Price fallback failed for {ticker}: {e}")
        return {}


def _fetch_yahoo_direct(ticker: str) -> dict:
    """Direct Yahoo Finance chart API call — bypasses yfinance library entirely."""
    try:
        with httpx.Client() as client:
            client.headers.update({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            })
            resp = client.get(
                f"https://query1.finance.yahoo.com/v8/finance/chart/{ticker}",
                params={"interval": "1d", "range": "1mo", "includePrePost": "false"},
                timeout=15,
            )
            if resp.status_code != 200:
                print(f"[yahoo-direct] {ticker} status {resp.status_code}")
                return {}
            body = resp.json()
            chart = body.get("chart", {}).get("result", [{}])[0]
            meta = chart.get("meta", {})
            ts = chart.get("timestamp", [])
            quotes = chart.get("indicators", {}).get("quote", [{}])[0]

            price = meta.get("regularMarketPrice")
            prev = meta.get("chartPreviousClose") or meta.get("previousClose")

            history = []
            closes = quotes.get("close", [])
            opens = quotes.get("open", [])
            highs = quotes.get("high", [])
            lows = quotes.get("low", [])
            vols = quotes.get("volume", [])
            from datetime import datetime, timezone
            for i, t in enumerate(ts):
                if i < len(closes) and closes[i] is not None:
                    dt = datetime.fromtimestamp(t, tz=timezone.utc)
                    history.append({
                        "date": dt.strftime("%Y-%m-%d"),
                        "open": round(float(opens[i] or 0), 2),
                        "high": round(float(highs[i] or 0), 2),
                        "low": round(float(lows[i] or 0), 2),
                        "close": round(float(closes[i]), 2),
                        "volume": int(vols[i] or 0),
                    })

            result = {}
            if price:
                result["current_price"] = round(float(price), 2)
            if prev:
                result["previous_close"] = round(float(prev), 2)
            if history:
                result["history"] = history
            result["company_name"] = meta.get("longName") or meta.get("shortName")
            result["currency"] = meta.get("currency")
            result["fifty_two_week_high"] = meta.get("fiftyTwoWeekHigh")
            result["fifty_two_week_low"] = meta.get("fiftyTwoWeekLow")
            if result.get("current_price"):
                print(f"[yahoo-direct] {ticker}: ${result['current_price']}, {len(history)} days")
            return result
    except Exception as e:
        print(f"[yahoo-direct] {ticker} failed: {e}")
        return {}


def _download_with_retry(ticker: str, period: str = "1mo", retries: int = 2):
    """Download price data with retry on rate limit."""
    import pandas as pd
    for attempt in range(retries):
        try:
            dl = yf.download(ticker, period=period, progress=False, timeout=15)
            if not dl.empty:
                return dl
        except Exception as e:
            print(f"[yfinance] download attempt {attempt+1} for {ticker}: {e}")
        if attempt < retries - 1:
            time.sleep(3)
    return None


def _parse_download_history(dl) -> list:
    """Convert yf.download DataFrame to history list."""
    rows = []
    for d, row in dl.iterrows():
        try:
            rows.append({
                "date": d.strftime("%Y-%m-%d"),
                "open": round(float(row["Open"]), 2),
                "high": round(float(row["High"]), 2),
                "low": round(float(row["Low"]), 2),
                "close": round(float(row["Close"]), 2),
                "volume": int(row["Volume"]),
            })
        except Exception:
            continue
    return rows


def fetch_yfinance_data(ticker: str) -> dict:
    result = {
        "ticker": ticker,
        "company_name": get_company_name(ticker),
        "current_price": None,
        "previous_close": None,
        "market_cap": None,
        "pe_ratio": None,
        "forward_pe": None,
        "ev_to_revenue": None,
        "ev_to_ebitda": None,
        "revenue_growth": None,
        "earnings_growth": None,
        "profit_margin": None,
        "total_cash": None,
        "total_debt": None,
        "shares_outstanding": None,
        "fifty_two_week_high": None,
        "fifty_two_week_low": None,
        "avg_volume": None,
        "beta": None,
        "dividend_yield": None,
        "sector": None,
        "industry": None,
        "eps_trailing": None,
        "eps_forward": None,
        "revenue": None,
        "history": [],
    }

    # Step 1: Direct Yahoo Finance API — single HTTP call, bypasses yfinance library
    direct = _fetch_yahoo_direct(ticker)
    if direct.get("current_price"):
        result["current_price"] = direct["current_price"]
        result["previous_close"] = direct.get("previous_close") or result["previous_close"]
        if direct.get("history"):
            result["history"] = direct["history"]
        if direct.get("company_name"):
            result["company_name"] = direct["company_name"]
        if direct.get("fifty_two_week_high"):
            result["fifty_two_week_high"] = direct["fifty_two_week_high"]
        if direct.get("fifty_two_week_low"):
            result["fifty_two_week_low"] = direct["fifty_two_week_low"]

    # Step 2: yf.download() as fallback if direct API failed
    if result["current_price"] is None:
        dl = _download_with_retry(ticker, period="1mo")
        if dl is not None and not dl.empty:
            result["history"] = _parse_download_history(dl)
            closes = dl["Close"].dropna()
            if len(closes) >= 1:
                result["current_price"] = round(float(closes.iloc[-1]), 2)
            if len(closes) >= 2:
                result["previous_close"] = round(float(closes.iloc[-2]), 2)
            highs = dl["High"].dropna()
            lows = dl["Low"].dropna()
            if len(highs) > 0:
                result["fifty_two_week_high"] = round(float(highs.max()), 2)
            if len(lows) > 0:
                result["fifty_two_week_low"] = round(float(lows.min()), 2)
            print(f"[yfinance] {ticker} download OK: {len(dl)} days, price=${result['current_price']}")

    # Step 3: Try t.info for fundamentals (separate API path, may rate-limit independently)
    time.sleep(1)
    try:
        t = yf.Ticker(ticker)
        info = t.info
        if info and isinstance(info, dict) and len(info) > 5:
            result["company_name"] = info.get("longName") or info.get("shortName") or result["company_name"]
            if info.get("currentPrice"):
                result["current_price"] = info["currentPrice"]
            elif info.get("regularMarketPrice") and result["current_price"] is None:
                result["current_price"] = info["regularMarketPrice"]
            if info.get("previousClose"):
                result["previous_close"] = info["previousClose"]
            for key, field in {
                "marketCap": "market_cap",
                "trailingPE": "pe_ratio",
                "forwardPE": "forward_pe",
                "enterpriseToRevenue": "ev_to_revenue",
                "enterpriseToEbitda": "ev_to_ebitda",
                "revenueGrowth": "revenue_growth",
                "earningsGrowth": "earnings_growth",
                "profitMargins": "profit_margin",
                "totalCash": "total_cash",
                "totalDebt": "total_debt",
                "sharesOutstanding": "shares_outstanding",
                "fiftyTwoWeekHigh": "fifty_two_week_high",
                "fiftyTwoWeekLow": "fifty_two_week_low",
                "averageVolume": "avg_volume",
                "beta": "beta",
                "dividendYield": "dividend_yield",
                "sector": "sector",
                "industry": "industry",
                "trailingEps": "eps_trailing",
                "forwardEps": "eps_forward",
                "totalRevenue": "revenue",
            }.items():
                val = info.get(key)
                if val is not None:
                    result[field] = val
            print(f"[yfinance] {ticker} info OK: pe={result['pe_ratio']}, sector={result['sector']}")
    except Exception as e:
        print(f"[yfinance] {ticker} info failed (non-fatal): {e}")

    # Step 4: If all above failed, try Ticker.history as last resort
    if result["current_price"] is None:
        time.sleep(2)
        try:
            t = yf.Ticker(ticker)
            hist = t.history(period="5d")
            if not hist.empty:
                result["current_price"] = round(float(hist["Close"].iloc[-1]), 2)
                if len(hist) >= 2:
                    result["previous_close"] = round(float(hist["Close"].iloc[-2]), 2)
                if not result["history"]:
                    result["history"] = _parse_download_history(hist)
                print(f"[yfinance] {ticker} history fallback: price=${result['current_price']}")
        except Exception as e:
            print(f"[yfinance] {ticker} history fallback failed: {e}")

    # Step 5: Grok fallback — always returns data when yfinance is rate-limited
    if result["current_price"] is None:
        grok_data = _fetch_price_via_grok(ticker, result["company_name"])
        if grok_data:
            result["current_price"] = grok_data.get("price")
            result["previous_close"] = grok_data.get("previous_close") or result["previous_close"]
            if grok_data.get("market_cap_billions"):
                result["market_cap"] = grok_data["market_cap_billions"] * 1e9
            result["pe_ratio"] = grok_data.get("pe_ratio") or result["pe_ratio"]
            result["sector"] = grok_data.get("sector") or result["sector"]
            result["fifty_two_week_high"] = grok_data.get("week52_high") or result["fifty_two_week_high"]
            result["fifty_two_week_low"] = grok_data.get("week52_low") or result["fifty_two_week_low"]
            if grok_data.get("company_name"):
                result["company_name"] = grok_data["company_name"]

    print(f"[yfinance] {ticker} FINAL: price={result['current_price']}, mcap={result['market_cap']}, history={len(result['history'])} days")
    return result


def _format_number(n) -> str:
    if n is None:
        return "N/A"
    if abs(n) >= 1e12:
        return f"${n/1e12:.1f}T"
    if abs(n) >= 1e9:
        return f"${n/1e9:.1f}B"
    if abs(n) >= 1e6:
        return f"${n/1e6:.1f}M"
    return f"${n:,.0f}"


def _format_pct(n) -> str:
    if n is None:
        return "N/A"
    return f"{n*100:.1f}%" if abs(n) < 1 else f"{n:.1f}%"


def _parse_json_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        start = 1
        end = len(lines)
        for i, line in enumerate(lines[1:], 1):
            if line.strip().startswith("```"):
                end = i
                break
        text = "\n".join(lines[start:end])

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        try:
            start = text.index("{")
            end = text.rindex("}") + 1
            return json.loads(text[start:end])
        except (ValueError, json.JSONDecodeError):
            return {"raw_response": text[:2000], "parse_error": True}


async def analyze_momentum(ticker: str, yf_data: dict, mentions: list, reddit_posts: list) -> dict:
    client = get_client()

    reddit_context = "\n".join([
        f"- [r/{p.get('subreddit', '?')}] (score:{p.get('score', 0)}) {p.get('title', '')[:120]}"
        for p in reddit_posts[:15]
    ]) or "No recent Reddit mentions found."

    news_context = "\n".join([
        f"- [{m.get('source_type', '?')}] {m.get('source_title', '')[:120]}"
        for m in mentions if m.get("source_type") == "news"
    ][:10]) or "No recent news mentions found."

    price = yf_data.get("current_price", "N/A")
    prev = yf_data.get("previous_close", "N/A")
    high52 = yf_data.get("fifty_two_week_high", "N/A")
    low52 = yf_data.get("fifty_two_week_low", "N/A")
    sector = yf_data.get("sector", "N/A")

    prompt = f"""Analyze the current momentum and social sentiment for {ticker} ({yf_data.get('company_name', ticker)}).

Current Data:
- Price: ${price}
- Previous Close: ${prev}
- 52-Week Range: ${low52} - ${high52}
- Sector: {sector}

Recent Reddit Discussions ({len(reddit_posts)} posts in 24h):
{reddit_context}

Recent News Headlines:
{news_context}

Provide analysis in this exact JSON format:
{{
  "narrative": "2-3 sentence summary of the dominant social media narrative around this stock right now",
  "catalyst": "The specific catalyst driving recent interest - be specific with numbers, dates, events",
  "institutional_view": "What professional analysts are likely saying - recent upgrades, downgrades, target changes",
  "sentiment_score": 0.0,
  "momentum_rating": "Strong Bullish|Bullish|Neutral|Bearish|Strong Bearish",
  "key_levels": {{"support": 0.0, "resistance": 0.0}},
  "one_liner": "The stock is moving because [X], but [Y] is the part nobody is talking about."
}}

Return ONLY valid JSON."""

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=1000,
            system="You are a senior equity research analyst. Be specific, direct, and concise. Use real numbers.",
            messages=[{"role": "user", "content": prompt}],
            timeout=30,
        )
        return _parse_json_response(response.content[0].text)
    except Exception as e:
        print(f"[Claude] Momentum analysis error for {ticker}: {e}")
        return {"error": str(e), "narrative": "Analysis unavailable"}


async def analyze_fundamentals(ticker: str, yf_data: dict) -> dict:
    client = get_client()

    prompt = f"""For {ticker} ({yf_data.get('company_name', ticker)}), give a fundamental snapshot.

Current Data:
- Price: ${yf_data.get('current_price', 'N/A')}
- Market Cap: {_format_number(yf_data.get('market_cap'))}
- Trailing P/E: {yf_data.get('pe_ratio', 'N/A')}
- Forward P/E: {yf_data.get('forward_pe', 'N/A')}
- EV/Revenue: {yf_data.get('ev_to_revenue', 'N/A')}
- EV/EBITDA: {yf_data.get('ev_to_ebitda', 'N/A')}
- Revenue Growth (QoQ): {_format_pct(yf_data.get('revenue_growth'))}
- Earnings Growth: {_format_pct(yf_data.get('earnings_growth'))}
- Profit Margin: {_format_pct(yf_data.get('profit_margin'))}
- Total Cash: {_format_number(yf_data.get('total_cash'))}
- Total Debt: {_format_number(yf_data.get('total_debt'))}
- Shares Outstanding: {_format_number(yf_data.get('shares_outstanding'))}
- Beta: {yf_data.get('beta', 'N/A')}
- Sector: {yf_data.get('sector', 'N/A')}
- Industry: {yf_data.get('industry', 'N/A')}

Provide analysis in this exact JSON format:
{{
  "valuation_summary": "1-2 sentences on current valuation vs sector/history",
  "growth_assessment": "1-2 sentences on revenue and earnings trajectory",
  "balance_sheet": "1 sentence on cash vs debt position and dilution risk",
  "fair_value_assessment": "above_fair_value|at_fair_value|below_fair_value",
  "fair_value_reasoning": "1 paragraph showing math - compare P/E to growth, EV/Revenue to sector, etc.",
  "key_metrics": {{
    "pe_vs_sector": "How the P/E compares to sector average",
    "growth_quality": "High|Medium|Low - based on revenue + earnings trajectory",
    "financial_health": "Strong|Adequate|Weak - based on cash vs debt"
  }}
}}

Return ONLY valid JSON."""

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=1000,
            system="You are a senior equity research analyst. Show your math. Be direct.",
            messages=[{"role": "user", "content": prompt}],
            timeout=30,
        )
        return _parse_json_response(response.content[0].text)
    except Exception as e:
        print(f"[Claude] Fundamental analysis error for {ticker}: {e}")
        return {"error": str(e), "valuation_summary": "Analysis unavailable"}


async def analyze_price_targets(ticker: str, yf_data: dict) -> dict:
    client = get_client()

    price = yf_data.get("current_price", 0)
    eps = yf_data.get("eps_trailing") or yf_data.get("eps_forward") or "N/A"
    revenue = yf_data.get("revenue")
    market_cap = yf_data.get("market_cap")
    pe = yf_data.get("pe_ratio") or yf_data.get("forward_pe") or "N/A"

    prompt = f"""For {ticker} ({yf_data.get('company_name', ticker)}) currently at ${price}, build a 4-scenario price target framework.

Current Data:
- Price: ${price}
- EPS (TTM): {eps}
- Forward P/E: {yf_data.get('forward_pe', 'N/A')}
- Revenue: {_format_number(revenue)}
- Market Cap: {_format_number(market_cap)}
- 52-Week High: ${yf_data.get('fifty_two_week_high', 'N/A')}
- 52-Week Low: ${yf_data.get('fifty_two_week_low', 'N/A')}
- Revenue Growth: {_format_pct(yf_data.get('revenue_growth'))}
- Sector: {yf_data.get('sector', 'N/A')}

Provide analysis in this exact JSON format:
{{
  "bear_case": {{
    "price": 0.0,
    "timeframe": "3-6 months",
    "reasoning": "1-2 sentences with math (multiple x EPS or revenue)"
  }},
  "base_case": {{
    "price": 0.0,
    "timeframe": "6-12 months",
    "reasoning": "1-2 sentences with math"
  }},
  "bull_case": {{
    "price": 0.0,
    "timeframe": "12-18 months",
    "reasoning": "1-2 sentences with math"
  }},
  "stretched_bull": {{
    "price": 0.0,
    "timeframe": "24 months",
    "reasoning": "1-2 sentences with math"
  }},
  "entry_zone": {{
    "low": 0.0,
    "high": 0.0,
    "reasoning": "Where to buy"
  }},
  "trim_levels": [0.0, 0.0],
  "hard_stop": {{
    "price": 0.0,
    "reasoning": "Where the thesis breaks"
  }}
}}

Use real multiples and math. Return ONLY valid JSON."""

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=1200,
            system="You are a senior equity research analyst building a price target model. Show your math for each scenario.",
            messages=[{"role": "user", "content": prompt}],
            timeout=30,
        )
        return _parse_json_response(response.content[0].text)
    except Exception as e:
        print(f"[Claude] Price target analysis error for {ticker}: {e}")
        return {"error": str(e), "bear_case": {"price": 0, "reasoning": "Analysis unavailable"}}


async def generate_daily_briefing() -> dict:
    cached = await get_briefing_cache()
    if cached:
        cached["from_cache"] = True
        return cached

    trending = await get_trending_tickers(hours=24, limit=20)
    reddit_posts = await get_recent_reddit_posts(limit=60)
    news = await get_recent_news(limit=30)

    trending_text = "\n".join([
        f"- {t['ticker']} ({get_company_name(t['ticker'])}): {t['mention_count']} mentions, sentiment {t['avg_sentiment']:+.2f}, sources: {','.join(t['sources'])}"
        for t in trending
    ]) or "No trending tickers found."

    reddit_items = []
    twitter_items = []
    for p in reddit_posts:
        sub = p['subreddit']
        if sub == 'X/Twitter':
            twitter_items.append(f"- [X] {p['title'][:150]}")
        elif sub == 'StockTwits':
            twitter_items.append(f"- [StockTwits] (score:{p['score']}) {p['title'][:150]}")
        else:
            reddit_items.append(f"- [r/{sub}] (score:{p['score']}, {p['num_comments']} comments) {p['title'][:150]}")

    reddit_text = "\n".join(reddit_items) or "No Reddit posts found."
    twitter_text = "\n".join(twitter_items) or "No Twitter/X data found."

    news_text = "\n".join([
        f"- [{n['source']}] {n['title'][:150]}"
        for n in news
    ]) or "No news found."

    client = get_client()
    prompt = f"""You are an AI financial advisor for retail investors. Analyze today's market data and provide actionable insights.

TRENDING STOCKS (by social media + news mentions in last 24h):
{trending_text}

RECENT REDDIT DISCUSSIONS (from r/wallstreetbets, r/stocks, r/investing, r/StockMarket, etc.):
{reddit_text}

RECENT TWITTER/X & STOCKTWITS CONVERSATIONS:
{twitter_text}

RECENT FINANCIAL NEWS:
{news_text}

Provide a comprehensive daily briefing in this exact JSON format:
{{
  "market_overview": "2-3 sentence summary of today's market mood, what's driving sentiment, and the overall direction",
  "themes": [
    {{
      "title": "Theme name (e.g., 'AI Infrastructure Boom', 'Energy for Data Centers', 'Semiconductor Supply Chain')",
      "description": "2-3 sentences explaining this theme - what's happening, why it matters, and the investment thesis",
      "tickers": ["TICKER1", "TICKER2", "TICKER3"],
      "sentiment": "bullish|bearish|mixed"
    }}
  ],
  "top_picks": [
    {{
      "ticker": "TICKER",
      "company": "Company Name",
      "action": "BUY|WATCH|AVOID",
      "conviction": "high|medium|low",
      "reason": "2-3 sentence specific reason why - mention catalysts, valuation, momentum, or risk",
      "risk": "1 sentence key risk"
    }}
  ],
  "reddit_narrative": "2-3 sentences summarizing what retail investors on Reddit are most excited or worried about right now. What are the dominant narratives and contrarian takes?",
  "risk_warnings": [
    "Specific risk or warning based on current data"
  ],
  "tldr": "One punchy sentence summarizing today's takeaway for investors"
}}

Rules:
- Identify 3-5 major themes from the data
- Pick exactly 5 top stocks with actionable ratings
- Be specific with company names and catalysts, not generic
- If Reddit is buzzing about a sector (AI, energy, etc.), highlight it as a theme
- Include contrarian warnings, not just hype
- Return ONLY valid JSON"""

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=2500,
            system="You are a senior financial advisor who provides actionable, data-driven market insights to retail investors. You analyze social sentiment, news flow, and market data to identify the best opportunities and risks. Be specific, use real numbers, and don't hedge every statement.",
            messages=[{"role": "user", "content": prompt}],
            timeout=60,
        )
        result = _parse_json_response(response.content[0].text)
        result["generated_at"] = time.time()
        result["from_cache"] = False
        await set_briefing_cache(result, ttl_hours=2)
        return result
    except Exception as e:
        print(f"[Claude] Daily briefing error: {e}")
        traceback.print_exc()
        return {
            "error": str(e),
            "market_overview": "Daily briefing unavailable. Make sure ANTHROPIC_API_KEY is set.",
            "themes": [],
            "top_picks": [],
            "reddit_narrative": "",
            "risk_warnings": [],
            "tldr": "Briefing generation failed.",
            "generated_at": time.time(),
            "from_cache": False,
        }


async def get_stock_analysis(ticker: str) -> dict:
    ticker = ticker.upper().strip()

    # Check cache first
    cached = await get_cached_analysis(ticker)
    if cached:
        cached["from_cache"] = True
        return cached

    loop = asyncio.get_event_loop()

    # Fetch yfinance data in thread pool (sync library)
    yf_data = await loop.run_in_executor(None, fetch_yfinance_data, ticker)

    # Fetch recent mentions and Reddit posts from DB
    mentions = await get_ticker_mentions(ticker, hours=48)
    reddit_posts = await get_reddit_posts_for_ticker(ticker, hours=48)

    # Run all 3 Claude analyses + Grok social search in parallel
    from scrapers import search_social_for_ticker

    try:
        momentum, fundamentals, price_targets, social_posts = await asyncio.gather(
            analyze_momentum(ticker, yf_data, mentions, reddit_posts),
            analyze_fundamentals(ticker, yf_data),
            analyze_price_targets(ticker, yf_data),
            loop.run_in_executor(
                None, search_social_for_ticker, ticker,
                yf_data.get("company_name", ticker)
            ),
            return_exceptions=True,
        )
    except Exception as e:
        print(f"[Analysis] gather error: {e}")
        traceback.print_exc()
        momentum = {"error": str(e)}
        fundamentals = {"error": str(e)}
        price_targets = {"error": str(e)}
        social_posts = []

    if isinstance(momentum, Exception):
        momentum = {"error": str(momentum), "narrative": "Analysis failed"}
    if isinstance(fundamentals, Exception):
        fundamentals = {"error": str(fundamentals), "valuation_summary": "Analysis failed"}
    if isinstance(price_targets, Exception):
        price_targets = {"error": str(price_targets)}
    if isinstance(social_posts, Exception):
        print(f"[Analysis] Social search error: {social_posts}")
        social_posts = []

    # Merge Grok social results with DB posts, deduplicate
    all_social = (social_posts or []) + reddit_posts[:5]

    result = {
        "ticker": ticker,
        "company_name": yf_data.get("company_name", ticker),
        "yfinance": yf_data,
        "momentum": momentum,
        "fundamentals": fundamentals,
        "price_targets": price_targets,
        "mentions": [dict(m) for m in mentions[:20]],
        "reddit_posts": all_social[:15],
        "analyzed_at": time.time(),
        "from_cache": False,
    }

    # Cache for 4 hours
    await set_cached_analysis(ticker, result, ttl_hours=4)

    return result


async def generate_portfolio_recommendation() -> dict:
    """Generate AI-powered portfolio recommendations based on current market data."""
    trending = await get_trending_tickers(hours=24, limit=25)
    recent_news = await get_recent_news(limit=20)
    reddit = await get_recent_reddit_posts(limit=30)

    trending_text = "\n".join([
        f"- {t['ticker']} ({get_company_name(t['ticker'])}): {t['mention_count']} mentions, "
        f"sentiment {t['avg_sentiment']:+.2f}"
        for t in trending
    ]) or "No trending data."

    news_text = "\n".join([
        f"- [{n['source']}] {n['title'][:120]}"
        for n in recent_news
    ]) or "No news."

    reddit_text = "\n".join([
        f"- [r/{p.get('subreddit', '?')}] {p.get('title', '')[:120]}"
        for p in reddit
    ]) or "No social data."

    # Fetch prices for trending tickers
    price_data = {}
    if trending:
        loop = asyncio.get_event_loop()
        top_tickers = [t["ticker"] for t in trending[:15]]
        try:
            from main import _fetch_batch_prices
            price_data = await loop.run_in_executor(None, _fetch_batch_prices, top_tickers)
        except Exception as e:
            print(f"[Portfolio] Price fetch error: {e}")

    price_text = "\n".join([
        f"- {tk}: ${pd.get('price', 'N/A')} ({pd.get('change_pct', 0):+.1f}% today)"
        for tk, pd in price_data.items()
    ]) or "Price data unavailable."

    client = get_client()
    prompt = f"""You are building a recommended stock portfolio for a retail investor.
Analyze current market conditions, trending stocks, and recent news to recommend
a diversified portfolio of 8-12 stocks.

TRENDING STOCKS (by social + news mentions):
{trending_text}

CURRENT PRICES:
{price_text}

RECENT NEWS:
{news_text}

SOCIAL SENTIMENT:
{reddit_text}

Build a portfolio recommendation in this exact JSON format:
{{
  "strategy": "1-2 sentence overall strategy description",
  "risk_level": "conservative|moderate|aggressive",
  "market_outlook": "1-2 sentences on current market conditions",
  "positions": [
    {{
      "ticker": "AAPL",
      "company": "Apple Inc.",
      "action": "BUY|HOLD|WATCH",
      "conviction": "high|medium|low",
      "allocation_pct": 12,
      "entry_price": 185.00,
      "target_price": 210.00,
      "stop_loss": 170.00,
      "sector": "Technology",
      "reasoning": "2-3 sentences explaining why this stock, what the catalyst is, and when to enter",
      "risk": "1 sentence key risk"
    }}
  ],
  "sector_breakdown": [
    {{"sector": "Technology", "pct": 40}},
    {{"sector": "Healthcare", "pct": 20}}
  ],
  "avoid_list": [
    {{
      "ticker": "XYZ",
      "company": "Company Name",
      "reason": "Why to avoid this stock right now"
    }}
  ],
  "timing_notes": "When to execute - is now a good time? Should you wait for a pullback?",
  "warnings": [
    "Specific risk warning about current market conditions"
  ]
}}

Rules:
- Recommend 8-12 positions that sum to ~100% allocation
- Include at least 3 different sectors for diversification
- Use REAL current prices from the data provided for entry/target/stop
- Be specific about WHY each stock and WHEN to buy
- Include 2-3 stocks to actively AVOID with reasoning
- Consider both momentum (social buzz) and fundamentals
- Return ONLY valid JSON"""

    try:
        response = await client.messages.create(
            model=MODEL,
            max_tokens=6000,
            system=(
                "You are a senior portfolio strategist at a top investment bank. "
                "Build actionable, diversified portfolios for retail investors. "
                "Use real data, specific price levels, and clear reasoning. "
                "No generic advice — every recommendation must have a specific catalyst."
            ),
            messages=[{"role": "user", "content": prompt}],
            timeout=120,
        )
        raw = response.content[0].text
        result = _parse_json_response(raw)
        if result.get("parse_error"):
            # Try fixing truncated JSON by finding the last complete position
            try:
                text = raw.strip()
                if text.startswith("```"):
                    lines = text.split("\n")
                    text = "\n".join(l for l in lines if not l.strip().startswith("```"))
                # Find the positions array start and try to close it
                pos_idx = text.find('"positions"')
                if pos_idx >= 0:
                    # Find opening bracket of positions array
                    bracket = text.find("[", pos_idx)
                    if bracket >= 0:
                        # Try progressively shorter substrings
                        for end_idx in range(len(text), bracket + 10, -1):
                            chunk = text[:end_idx]
                            # Count open/close brackets to close properly
                            opens = chunk.count("{") - chunk.count("}")
                            open_arr = chunk.count("[") - chunk.count("]")
                            suffix = "]" * open_arr + "}" * opens
                            try:
                                result = json.loads(chunk + suffix)
                                print(f"[Portfolio] Recovered truncated JSON (cut at {end_idx}/{len(text)})")
                                break
                            except json.JSONDecodeError:
                                continue
            except Exception as repair_err:
                print(f"[Portfolio] JSON repair failed: {repair_err}")
        result["generated_at"] = time.time()
        result["from_cache"] = False
        return result
    except Exception as e:
        print(f"[Claude] Portfolio recommendation error: {e}")
        traceback.print_exc()
        return {
            "error": str(e),
            "strategy": "Portfolio recommendation unavailable.",
            "positions": [],
            "sector_breakdown": [],
            "avoid_list": [],
            "warnings": [],
            "generated_at": time.time(),
            "from_cache": False,
        }
