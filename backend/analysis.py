import os
import json
import time
import asyncio
import traceback

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


MODEL = "claude-sonnet-4-20250514"


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

    try:
        t = yf.Ticker(ticker)
        info = t.info

        result.update({
            "company_name": info.get("longName") or info.get("shortName") or get_company_name(ticker),
            "current_price": info.get("currentPrice") or info.get("regularMarketPrice"),
            "previous_close": info.get("previousClose"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "forward_pe": info.get("forwardPE"),
            "ev_to_revenue": info.get("enterpriseToRevenue"),
            "ev_to_ebitda": info.get("enterpriseToEbitda"),
            "revenue_growth": info.get("revenueGrowth"),
            "earnings_growth": info.get("earningsGrowth"),
            "profit_margin": info.get("profitMargins"),
            "total_cash": info.get("totalCash"),
            "total_debt": info.get("totalDebt"),
            "shares_outstanding": info.get("sharesOutstanding"),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
            "avg_volume": info.get("averageVolume"),
            "beta": info.get("beta"),
            "dividend_yield": info.get("dividendYield"),
            "sector": info.get("sector"),
            "industry": info.get("industry"),
            "eps_trailing": info.get("trailingEps"),
            "eps_forward": info.get("forwardEps"),
            "revenue": info.get("totalRevenue"),
        })

    except Exception as e:
        print(f"[yfinance] Error fetching info for {ticker}: {e}")

    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="1mo")
        if not hist.empty:
            result["history"] = [
                {
                    "date": d.strftime("%Y-%m-%d"),
                    "open": round(float(row["Open"]), 2),
                    "high": round(float(row["High"]), 2),
                    "low": round(float(row["Low"]), 2),
                    "close": round(float(row["Close"]), 2),
                    "volume": int(row["Volume"]),
                }
                for d, row in hist.iterrows()
            ]
    except Exception as e:
        print(f"[yfinance] Error fetching history for {ticker}: {e}")

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

    reddit_text = "\n".join([
        f"- [r/{p['subreddit']}] (score:{p['score']}, {p['num_comments']} comments) {p['title'][:150]}"
        for p in reddit_posts
    ]) or "No Reddit posts found."

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

    # Fetch yfinance data in thread pool (sync library)
    loop = asyncio.get_event_loop()
    yf_data = await loop.run_in_executor(None, fetch_yfinance_data, ticker)

    # Fetch recent mentions and Reddit posts from DB
    mentions = await get_ticker_mentions(ticker, hours=48)
    reddit_posts = await get_reddit_posts_for_ticker(ticker, hours=48)

    # Run all 3 Claude analyses in parallel
    try:
        momentum, fundamentals, price_targets = await asyncio.gather(
            analyze_momentum(ticker, yf_data, mentions, reddit_posts),
            analyze_fundamentals(ticker, yf_data),
            analyze_price_targets(ticker, yf_data),
            return_exceptions=True,
        )
    except Exception as e:
        print(f"[Analysis] gather error: {e}")
        traceback.print_exc()
        momentum = {"error": str(e)}
        fundamentals = {"error": str(e)}
        price_targets = {"error": str(e)}

    if isinstance(momentum, Exception):
        momentum = {"error": str(momentum), "narrative": "Analysis failed"}
    if isinstance(fundamentals, Exception):
        fundamentals = {"error": str(fundamentals), "valuation_summary": "Analysis failed"}
    if isinstance(price_targets, Exception):
        price_targets = {"error": str(price_targets)}

    result = {
        "ticker": ticker,
        "company_name": yf_data.get("company_name", ticker),
        "yfinance": yf_data,
        "momentum": momentum,
        "fundamentals": fundamentals,
        "price_targets": price_targets,
        "mentions": [dict(m) for m in mentions[:20]],
        "reddit_posts": reddit_posts[:10],
        "analyzed_at": time.time(),
        "from_cache": False,
    }

    # Cache for 4 hours
    await set_cached_analysis(ticker, result, ttl_hours=4)

    return result
