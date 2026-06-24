import os
import json
import time
import random
import hashlib
import asyncio
import traceback
from datetime import datetime

import httpx
import feedparser
from textblob import TextBlob

from tickers import extract_tickers, get_company_name
from database import (
    insert_reddit_post,
    insert_news_item,
    batch_insert_ticker_mentions,
    cleanup_old_data,
)

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
]

NEWS_FEEDS = {
    "yahoo": "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US",
    "marketwatch": "https://feeds.marketwatch.com/marketwatch/topstories",
    "google_business": "https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtVnVHZ0pWVXlnQVAB?hl=en-US&gl=US&ceid=US:en",
    "cnbc": "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
    "investing_com": "https://www.investing.com/rss/news.rss",
}


def _get_headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
        "Accept-Encoding": "gzip, deflate",
        "Connection": "keep-alive",
    }


def get_sentiment(text: str) -> float:
    try:
        if not text or len(text.strip()) < 5:
            return 0.0
        return round(TextBlob(text).sentiment.polarity, 3)
    except Exception:
        return 0.0


# ── Grok social scraper (Twitter/X + Reddit via xAI API) ─────────
# Reddit's Data API policy requires explicit approval for API access,
# so we use Grok (which has native X access and web access to public
# Reddit) instead of direct Reddit API scraping. ApeWisdom provides
# the quantitative Reddit mention counts separately.

def _parse_grok_json(text: str) -> list:
    """Extract JSON array from Grok response, handling markdown fences."""
    text = text.strip()
    if "```" in text:
        start = text.find("```")
        end = text.rfind("```")
        inner = text[start:end]
        first_newline = inner.find("\n")
        if first_newline != -1:
            text = inner[first_newline + 1:]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        bracket_start = text.find("[")
        bracket_end = text.rfind("]")
        if bracket_start != -1 and bracket_end != -1:
            try:
                return json.loads(text[bracket_start:bracket_end + 1])
            except json.JSONDecodeError:
                pass
    return []


def _grok_request(api_key: str, system: str, prompt: str) -> list:
    """Make a single Grok API call and parse the JSON array response."""
    with httpx.Client() as client:
        resp = client.post(
            "https://api.x.ai/v1/chat/completions",
            json={
                "model": "grok-3-mini",
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
            },
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            timeout=90,
        )
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        return _parse_grok_json(content)


def scrape_social_via_grok() -> tuple[list[dict], list[dict]]:
    """Use Grok to find trending stock discussions on both X/Twitter AND Reddit.
    One API call covers both platforms — Grok has native X access and can
    see public Reddit content."""
    print("[Scraper] Starting social scrape via Grok (X + Reddit)...")

    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        print("  [Grok] XAI_API_KEY not set, skipping social scrape")
        return [], []

    all_posts = []
    all_mentions = []

    system = (
        "You are a financial market analyst with real-time access to X/Twitter "
        "and public Reddit communities (r/wallstreetbets, r/stocks, r/investing, "
        "r/StockMarket, r/options, r/pennystocks, r/RobinHoodPennyStocks, "
        "r/energy_stocks, r/Daytrading, r/smallstreetbets). Report only on stocks "
        "and tickers that are genuinely being discussed right now. Be accurate about sentiment."
    )

    prompt = (
        "Search BOTH X (Twitter) AND Reddit right now for the most popular investing "
        "and stock market conversations from the last 24 hours.\n\n"
        "For X/Twitter: focus on posts from FinTwit accounts, traders, analysts.\n"
        "For Reddit: focus on r/wallstreetbets, r/stocks, r/investing, r/StockMarket, "
        "r/options, r/pennystocks, r/RobinHoodPennyStocks, r/energy_stocks, r/Daytrading.\n\n"
        "IMPORTANT: Include a mix of:\n"
        "- Large-cap tech/growth stocks people are discussing\n"
        "- Penny stocks and micro-caps that are trending on Reddit\n"
        "- Energy sector stocks (oil, gas, solar, nuclear)\n"
        "- Any other lowkey or under-the-radar stocks getting attention\n\n"
        "Return a JSON array of the top 25 most discussed stocks/tickers:\n"
        "[\n"
        '  {\n'
        '    "ticker": "AAPL",\n'
        '    "company": "Apple Inc.",\n'
        '    "platform": "twitter",\n'
        '    "mentions": 1500,\n'
        '    "sentiment": "bullish",\n'
        '    "narrative": "Why this stock is trending right now",\n'
        '    "posts": [\n'
        '      "Summary of a notable post/conversation about this stock",\n'
        '      "Another notable post"\n'
        '    ]\n'
        '  }\n'
        "]\n\n"
        "Rules:\n"
        "- platform must be exactly: twitter or reddit\n"
        "- Include stocks from BOTH platforms (roughly half and half)\n"
        "- sentiment must be exactly: bullish, bearish, or neutral\n"
        "- posts array: 2-3 summaries of actual conversations on that platform\n"
        "- mentions: estimated number of posts/comments mentioning this ticker today\n"
        "- Only include real tickers actively being discussed RIGHT NOW\n"
        "- Return ONLY the JSON array, no other text"
    )

    try:
        stocks = _grok_request(api_key, system, prompt)
        sentiment_map = {"bullish": 0.5, "bearish": -0.5, "neutral": 0.0}

        for stock in stocks:
            ticker = stock.get("ticker", "").upper()
            if not ticker:
                continue

            platform = stock.get("platform", "twitter").lower()
            sentiment_val = sentiment_map.get(stock.get("sentiment", "neutral"), 0.0)
            company = stock.get("company", ticker)
            narrative = stock.get("narrative", "trending")
            est_mentions = stock.get("mentions", 0)

            if platform == "reddit":
                source_label = "Reddit"
                source_type = "reddit"
                subreddit_val = "Reddit"
                url = f"https://www.reddit.com/search/?q=%24{ticker}&type=link&sort=new"
            else:
                source_label = "X/Twitter"
                source_type = "twitter"
                subreddit_val = "X/Twitter"
                url = f"https://x.com/search?q=%24{ticker}"

            for i, post_summary in enumerate(stock.get("posts", [])[:3]):
                post_id = f"grok_{platform}_{ticker}_{int(time.time())}_{i}"
                all_posts.append({
                    "id": post_id,
                    "subreddit": subreddit_val,
                    "title": post_summary[:200],
                    "selftext": "",
                    "score": est_mentions,
                    "num_comments": 0,
                    "author": "",
                    "url": url,
                    "created_utc": time.time(),
                    "sentiment": sentiment_val,
                    "tickers": [ticker],
                })

            all_mentions.append({
                "ticker": ticker,
                "source_type": source_type,
                "source_id": f"grok_{platform}_{ticker}",
                "source_title": f"[{source_label}] {company} — {narrative} (~{est_mentions} posts)",
                "mentioned_at": time.time(),
                "sentiment": sentiment_val,
            })

        x_count = sum(1 for s in stocks if s.get("platform", "").lower() != "reddit")
        r_count = sum(1 for s in stocks if s.get("platform", "").lower() == "reddit")
        print(f"  [Grok] Found {len(stocks)} tickers ({x_count} from X, {r_count} from Reddit), {len(all_posts)} posts")

    except Exception as e:
        print(f"  [Grok] Error: {e}")

    return all_posts, all_mentions


def search_social_for_ticker(ticker: str, company_name: str) -> list:
    """Search Twitter/X and Reddit for real-time discussions about a specific stock."""
    api_key = os.getenv("XAI_API_KEY")
    if not api_key:
        return []

    print(f"[Grok] Searching social for ${ticker} ({company_name})...")

    system = (
        "You are a financial social media analyst with real-time access to X/Twitter "
        "and public Reddit. Search for real, current discussions about specific stocks. "
        "Report what people are actually saying right now."
    )

    prompt = (
        f"Search X (Twitter) and Reddit for the most recent discussions about "
        f"${ticker} ({company_name}) from the last 48 hours.\n\n"
        "Find real posts, tweets, and threads discussing this stock.\n\n"
        "Return a JSON array of 10-12 posts:\n"
        "[\n"
        '  {\n'
        '    "platform": "twitter",\n'
        '    "subreddit": "X/Twitter",\n'
        '    "author": "@username or u/username",\n'
        '    "content": "Summary of the post (max 200 chars)",\n'
        '    "engagement": 150,\n'
        '    "sentiment": "bullish"\n'
        '  }\n'
        "]\n\n"
        "Rules:\n"
        '- platform: "twitter" or "reddit"\n'
        '- subreddit: "X/Twitter" for tweets, actual subreddit name for Reddit '
        '(e.g. "wallstreetbets", "stocks", "investing")\n'
        '- sentiment: "bullish", "bearish", or "neutral"\n'
        "- engagement: estimated likes/upvotes\n"
        "- Include posts from BOTH platforms\n"
        "- Focus on substantive analysis, not just ticker mentions\n"
        "- Return ONLY the JSON array"
    )

    try:
        posts = _grok_request(api_key, system, prompt)
        formatted = []
        sentiment_map = {"bullish": 0.5, "bearish": -0.5, "neutral": 0.0}

        for i, post in enumerate(posts):
            platform = post.get("platform", "twitter")
            subreddit = post.get("subreddit", "X/Twitter")
            if platform == "reddit" and subreddit == "X/Twitter":
                subreddit = "stocks"

            url = (
                f"https://x.com/search?q=%24{ticker}"
                if platform == "twitter"
                else f"https://www.reddit.com/search/?q={ticker}&sort=new"
            )

            formatted.append({
                "id": f"grok_search_{ticker}_{platform}_{i}",
                "subreddit": subreddit,
                "title": post.get("content", "")[:200],
                "selftext": "",
                "score": post.get("engagement", 0),
                "num_comments": 0,
                "author": post.get("author", ""),
                "url": url,
                "created_utc": time.time(),
                "sentiment": sentiment_map.get(post.get("sentiment", "neutral"), 0.0),
                "tickers": [ticker],
            })

        print(f"[Grok] Found {len(formatted)} social posts for ${ticker}")
        return formatted
    except Exception as e:
        print(f"[Grok] Error searching for {ticker}: {e}")
        return []


# ── ApeWisdom (Reddit mention tracker, free, no auth) ─────────────

def scrape_apewisdom() -> list[dict]:
    print("[Scraper] Starting ApeWisdom scrape...")
    all_mentions = []

    filters = [
        "all-stocks", "wallstreetbets", "stocks", "pennystocks",
        "investing", "StockMarket", "options", "Daytrading",
    ]
    seen_tickers = set()

    with httpx.Client() as client:
        for filter_name in filters:
            try:
                url = f"https://apewisdom.io/api/v1.0/filter/{filter_name}/page/1"
                resp = client.get(url, headers=_get_headers(), timeout=15)
                resp.raise_for_status()
                data = resp.json()

                results = data.get("results", [])
                for item in results[:30]:
                    ticker = item.get("ticker", "").upper()
                    if not ticker or ticker in seen_tickers:
                        continue
                    seen_tickers.add(ticker)

                    mentions_count = item.get("mentions", 0)
                    rank = item.get("rank", 0)
                    name = item.get("name", get_company_name(ticker))

                    for _ in range(min(mentions_count, 5)):
                        all_mentions.append({
                            "ticker": ticker,
                            "source_type": "reddit",
                            "source_id": f"apewisdom_{ticker}_{filter_name}",
                            "source_title": f"[ApeWisdom #{rank}] {name} - {mentions_count} mentions across Reddit",
                            "mentioned_at": time.time(),
                            "sentiment": 0.1,
                        })

                print(f"  [ApeWisdom] {filter_name}: {len(results)} tickers found")

            except Exception as e:
                print(f"  [ApeWisdom] {filter_name}: Error - {e}")

            time.sleep(random.uniform(1, 2))

    print(f"[Scraper] ApeWisdom complete: {len(all_mentions)} mentions")
    return all_mentions


# ── StockTwits (free sentiment data, no auth) ─────────────────────

def scrape_stocktwits_trending() -> tuple[list[dict], list[dict]]:
    print("[Scraper] Starting StockTwits scrape...")
    all_posts = []
    all_mentions = []

    with httpx.Client() as client:
        try:
            resp = client.get(
                "https://api.stocktwits.com/api/2/trending/symbols.json",
                headers=_get_headers(),
                timeout=15,
            )
            resp.raise_for_status()
            data = resp.json()

            symbols = data.get("symbols", [])
            for sym in symbols[:20]:
                ticker = sym.get("symbol", "")
                title = sym.get("title", "")

                all_mentions.append({
                    "ticker": ticker,
                    "source_type": "stocktwits",
                    "source_id": f"st_trending_{ticker}",
                    "source_title": f"[StockTwits Trending] {title}",
                    "mentioned_at": time.time(),
                    "sentiment": 0.0,
                })

            print(f"  [StockTwits] Trending: {len(symbols)} symbols")

        except Exception as e:
            print(f"  [StockTwits] Trending error: {e}")

        time.sleep(random.uniform(1, 2))

        top_tickers = [
            "AAPL", "TSLA", "NVDA", "AMD", "SPY", "QQQ", "AMZN", "MSFT", "META", "GOOGL",
            "XOM", "CVX", "OXY", "NEE", "FSLR", "ENPH", "SMR", "CEG", "VST",
            "PLTR", "SOFI", "MARA", "RIOT", "COIN",
        ]
        for ticker in top_tickers:
            try:
                resp = client.get(
                    f"https://api.stocktwits.com/api/2/streams/symbol/{ticker}.json",
                    headers=_get_headers(),
                    timeout=15,
                )
                if resp.status_code == 429:
                    print(f"  [StockTwits] Rate limited, stopping ticker scrape")
                    break
                resp.raise_for_status()
                data = resp.json()

                messages = data.get("messages", [])
                bullish = sum(1 for m in messages if m.get("entities", {}).get("sentiment", {}).get("basic") == "Bullish")
                bearish = sum(1 for m in messages if m.get("entities", {}).get("sentiment", {}).get("basic") == "Bearish")
                total = bullish + bearish
                sentiment = ((bullish - bearish) / total) if total > 0 else 0.0

                for msg in messages[:5]:
                    body = msg.get("body", "")
                    msg_sentiment = 0.0
                    s = msg.get("entities", {}).get("sentiment", {}).get("basic", "")
                    if s == "Bullish":
                        msg_sentiment = 0.5
                    elif s == "Bearish":
                        msg_sentiment = -0.5

                    all_posts.append({
                        "id": f"st_{msg.get('id', '')}",
                        "subreddit": "StockTwits",
                        "title": body[:200],
                        "selftext": "",
                        "score": msg.get("likes", {}).get("total", 0),
                        "num_comments": msg.get("conversation", {}).get("replies", 0),
                        "author": msg.get("user", {}).get("username", ""),
                        "url": f"https://stocktwits.com/symbol/{ticker}",
                        "created_utc": time.time(),
                        "sentiment": msg_sentiment,
                        "tickers": [ticker],
                    })

                    all_mentions.append({
                        "ticker": ticker,
                        "source_type": "stocktwits",
                        "source_id": f"st_{msg.get('id', '')}",
                        "source_title": body[:200],
                        "mentioned_at": time.time(),
                        "sentiment": msg_sentiment,
                    })

                print(f"  [StockTwits] {ticker}: {len(messages)} msgs, sentiment {sentiment:+.2f} ({bullish}B/{bearish}B)")

            except Exception as e:
                print(f"  [StockTwits] {ticker}: Error - {e}")

            time.sleep(random.uniform(2, 4))

    print(f"[Scraper] StockTwits complete: {len(all_posts)} posts, {len(all_mentions)} mentions")
    return all_posts, all_mentions


# ── Finviz scraper (social sentiment + news) ─────────────────────

def scrape_finviz_news(client: httpx.Client) -> tuple[list[dict], list[dict]]:
    """Scrape finviz news headlines for top-mentioned tickers."""
    all_items = []
    all_mentions = []

    top_tickers = [
        "AAPL", "TSLA", "NVDA", "AMD", "MSFT", "AMZN", "META", "GOOGL",
        "XOM", "CVX", "OXY", "NEE", "FSLR", "CEG", "VST", "PLTR", "SOFI",
    ]

    for ticker in top_tickers:
        try:
            url = f"https://finviz.com/quote.ashx?t={ticker}"
            resp = client.get(url, headers={
                "User-Agent": random.choice(USER_AGENTS),
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            }, timeout=15)

            if resp.status_code == 429 or resp.status_code == 403:
                print(f"  [Finviz] {ticker}: Blocked ({resp.status_code}), skipping")
                break

            resp.raise_for_status()

            from bs4 import BeautifulSoup
            soup = BeautifulSoup(resp.text, "html.parser")

            news_table = soup.find("table", {"id": "news-table"})
            if not news_table:
                continue

            rows = news_table.find_all("tr")
            count = 0
            for row in rows[:10]:
                link_tag = row.find("a")
                if not link_tag:
                    continue

                title = link_tag.get_text(strip=True)
                link = link_tag.get("href", "")
                source_tag = row.find("span")
                source = source_tag.get_text(strip=True) if source_tag else "finviz"

                item_id = hashlib.md5((f"finviz_{ticker}_{link}").encode()).hexdigest()
                sentiment = get_sentiment(title)

                item = {
                    "id": item_id,
                    "source": f"finviz_{source}",
                    "title": f"[{ticker}] {title}",
                    "link": link,
                    "summary": title,
                    "published_at": time.time(),
                    "sentiment": sentiment,
                }
                all_items.append(item)
                count += 1

                all_mentions.append({
                    "ticker": ticker,
                    "source_type": "news",
                    "source_id": item_id,
                    "source_title": title[:200],
                    "mentioned_at": time.time(),
                    "sentiment": sentiment,
                })

            print(f"  [Finviz] {ticker}: {count} news headlines")

        except Exception as e:
            print(f"  [Finviz] {ticker}: Error - {e}")

        time.sleep(random.uniform(2, 4))

    return all_items, all_mentions


# ── News RSS ──────────────────────────────────────────────────────

def scrape_all_news() -> tuple[list[dict], list[dict]]:
    print("[Scraper] Starting news scrape...")
    all_items = []
    all_mentions = []

    for source, feed_url in NEWS_FEEDS.items():
        try:
            feed = feedparser.parse(feed_url)
            items_found = 0

            for entry in feed.entries[:30]:
                title = entry.get("title", "")
                summary = entry.get("summary", entry.get("description", ""))[:500]
                link = entry.get("link", "")
                full_text = f"{title} {summary}"

                tickers = extract_tickers(full_text)

                published = entry.get("published_parsed")
                published_ts = None
                if published:
                    try:
                        published_ts = time.mktime(published)
                    except Exception:
                        published_ts = time.time()

                sentiment = get_sentiment(full_text)
                item_id = hashlib.md5((source + link).encode()).hexdigest()

                item = {
                    "id": item_id,
                    "source": source,
                    "title": title,
                    "link": link,
                    "summary": summary,
                    "published_at": published_ts,
                    "sentiment": sentiment,
                }
                all_items.append(item)
                items_found += 1

                for ticker in tickers:
                    all_mentions.append({
                        "ticker": ticker,
                        "source_type": "news",
                        "source_id": item_id,
                        "source_title": title[:200],
                        "mentioned_at": published_ts or time.time(),
                        "sentiment": sentiment,
                    })

            print(f"  [News] {source}: {items_found} items")

        except Exception as e:
            print(f"  [News] {source}: Error - {e}")

        time.sleep(random.uniform(1, 3))

    # Finviz news scrape
    with httpx.Client() as client:
        try:
            finviz_items, finviz_mentions = scrape_finviz_news(client)
            all_items.extend(finviz_items)
            all_mentions.extend(finviz_mentions)
        except Exception as e:
            print(f"  [Finviz] Error: {e}")

    print(f"[Scraper] News complete: {len(all_items)} items, {len(all_mentions)} mentions")
    return all_items, all_mentions


# ── Save + orchestrate ────────────────────────────────────────────

async def save_scrape_results(posts, post_mentions, news_items, news_mentions):
    for post in posts:
        await insert_reddit_post(post)

    for item in news_items:
        await insert_news_item(item)

    await batch_insert_ticker_mentions(post_mentions + news_mentions)


def run_all_scrapers():
    print(f"\n{'='*60}")
    print(f"[Scraper] Starting full scrape at {datetime.now().isoformat()}")
    print(f"{'='*60}")

    try:
        # Grok covers both Twitter/X and Reddit in one call
        social_posts, social_mentions = scrape_social_via_grok()

        news_items, news_mentions = scrape_all_news()

        # ApeWisdom for quantitative Reddit mention counts (no API key needed)
        apewisdom_mentions = scrape_apewisdom()
        social_mentions.extend(apewisdom_mentions)

        # StockTwits for additional social data (no API key needed)
        st_posts, st_mentions = scrape_stocktwits_trending()
        social_posts.extend(st_posts)
        social_mentions.extend(st_mentions)

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(
                save_scrape_results(social_posts, social_mentions, news_items, news_mentions)
            )
            loop.run_until_complete(cleanup_old_data(days=7))
        finally:
            loop.close()

        total_mentions = len(social_mentions) + len(news_mentions)
        print(f"\n[Scraper] Complete! {len(social_posts)} posts, {len(news_items)} news, {total_mentions} total mentions")

    except Exception as e:
        print(f"[Scraper] FATAL ERROR: {e}")
        traceback.print_exc()

    print(f"{'='*60}\n")
