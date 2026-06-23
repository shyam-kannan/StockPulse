import os
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

REDDIT_SUBREDDITS = [
    "wallstreetbets",
    "stocks",
    "investing",
    "StockMarket",
    "SecurityAnalysis",
    "options",
    "Daytrading",
]

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


# ── AsyncPRAW Reddit scraping (primary method) ──────────────────

async def scrape_reddit_asyncpraw() -> tuple[list[dict], list[dict]]:
    """Primary Reddit scraper using AsyncPRAW (Reddit OAuth, 100 req/min)."""
    try:
        import asyncpraw
    except ImportError:
        print("  [Reddit] asyncpraw not installed, skipping PRAW method")
        return [], []

    client_id = os.getenv("REDDIT_CLIENT_ID")
    client_secret = os.getenv("REDDIT_CLIENT_SECRET")

    if not client_id or not client_secret:
        print("  [Reddit] REDDIT_CLIENT_ID / REDDIT_CLIENT_SECRET not set, skipping PRAW")
        return [], []

    all_posts = []
    all_mentions = []

    try:
        reddit = asyncpraw.Reddit(
            client_id=client_id,
            client_secret=client_secret,
            user_agent="StockPulse/1.0 (financial sentiment tracker)",
        )

        for sub_name in REDDIT_SUBREDDITS:
            try:
                subreddit = await reddit.subreddit(sub_name)
                count = 0
                async for submission in subreddit.hot(limit=25):
                    if submission.stickied:
                        continue

                    title = submission.title or ""
                    selftext = (submission.selftext or "")[:2000]
                    full_text = f"{title} {selftext}"

                    tickers = extract_tickers(full_text)
                    if not tickers:
                        continue

                    sentiment = get_sentiment(full_text)

                    post = {
                        "id": submission.id,
                        "subreddit": sub_name,
                        "title": title,
                        "selftext": selftext,
                        "score": submission.score,
                        "num_comments": submission.num_comments,
                        "author": str(submission.author) if submission.author else "",
                        "url": f"https://reddit.com{submission.permalink}",
                        "created_utc": submission.created_utc,
                        "sentiment": sentiment,
                        "tickers": tickers,
                    }
                    all_posts.append(post)
                    count += 1

                    for ticker in tickers:
                        all_mentions.append({
                            "ticker": ticker,
                            "source_type": "reddit",
                            "source_id": submission.id,
                            "source_title": title[:200],
                            "mentioned_at": submission.created_utc,
                            "sentiment": sentiment,
                        })

                print(f"  [Reddit/PRAW] r/{sub_name}: {count} posts with ticker mentions")

            except Exception as e:
                print(f"  [Reddit/PRAW] r/{sub_name}: Error - {e}")

        await reddit.close()

    except Exception as e:
        print(f"  [Reddit/PRAW] Fatal error: {e}")

    return all_posts, all_mentions


# ── PullPush API fallback (archival Reddit data, no auth) ────────

def scrape_pullpush(client: httpx.Client) -> tuple[list[dict], list[dict]]:
    """Fallback Reddit scraper using PullPush.io API (no auth needed)."""
    all_posts = []
    all_mentions = []

    for sub_name in REDDIT_SUBREDDITS:
        try:
            url = f"https://api.pullpush.io/reddit/search/submission/?subreddit={sub_name}&sort=score&sort_type=desc&size=25"
            resp = client.get(url, headers=_get_headers(), timeout=20)

            if resp.status_code == 429:
                print(f"  [PullPush] r/{sub_name}: Rate limited, skipping")
                time.sleep(2)
                continue

            resp.raise_for_status()
            data = resp.json()
            posts = data.get("data", [])
            count = 0

            for post_data in posts:
                title = post_data.get("title", "")
                selftext = (post_data.get("selftext", "") or "")[:2000]
                if selftext == "[removed]" or selftext == "[deleted]":
                    selftext = ""
                full_text = f"{title} {selftext}"

                tickers = extract_tickers(full_text)
                if not tickers:
                    continue

                sentiment = get_sentiment(full_text)
                post_id = post_data.get("id", "")

                post = {
                    "id": f"pp_{post_id}",
                    "subreddit": sub_name,
                    "title": title,
                    "selftext": selftext,
                    "score": post_data.get("score", 0),
                    "num_comments": post_data.get("num_comments", 0),
                    "author": post_data.get("author", ""),
                    "url": f"https://reddit.com{post_data.get('permalink', '')}",
                    "created_utc": post_data.get("created_utc", time.time()),
                    "sentiment": sentiment,
                    "tickers": tickers,
                }
                all_posts.append(post)
                count += 1

                for ticker in tickers:
                    all_mentions.append({
                        "ticker": ticker,
                        "source_type": "reddit",
                        "source_id": f"pp_{post_id}",
                        "source_title": title[:200],
                        "mentioned_at": post_data.get("created_utc", time.time()),
                        "sentiment": sentiment,
                    })

            print(f"  [PullPush] r/{sub_name}: {count} posts with ticker mentions")

        except Exception as e:
            print(f"  [PullPush] r/{sub_name}: Error - {e}")

        time.sleep(random.uniform(1, 2))

    return all_posts, all_mentions


# ── old.reddit.com JSON (last-resort fallback) ──────────────────

def scrape_reddit_json(client: httpx.Client) -> tuple[list[dict], list[dict]]:
    """Last resort: scrape old.reddit.com JSON. Frequently rate-limited."""
    all_posts = []
    all_mentions = []

    for subreddit in REDDIT_SUBREDDITS[:3]:
        try:
            url = f"https://old.reddit.com/r/{subreddit}/hot.json?limit=15"
            resp = client.get(url, headers=_get_headers(), timeout=15)

            if resp.status_code == 429:
                print(f"  [Reddit/JSON] r/{subreddit}: Rate limited (429)")
                continue

            resp.raise_for_status()
            data = resp.json()
            children = data.get("data", {}).get("children", [])
            count = 0

            for child in children:
                post_data = child.get("data", {})
                if not post_data.get("title") or post_data.get("stickied"):
                    continue

                title = post_data.get("title", "")
                selftext = post_data.get("selftext", "")[:2000]
                full_text = f"{title} {selftext}"

                tickers = extract_tickers(full_text)
                if not tickers:
                    continue

                sentiment = get_sentiment(full_text)
                pid = post_data.get("id", "")

                all_posts.append({
                    "id": pid,
                    "subreddit": subreddit,
                    "title": title,
                    "selftext": selftext,
                    "score": post_data.get("score", 0),
                    "num_comments": post_data.get("num_comments", 0),
                    "author": post_data.get("author", ""),
                    "url": f"https://reddit.com{post_data.get('permalink', '')}",
                    "created_utc": post_data.get("created_utc", time.time()),
                    "sentiment": sentiment,
                    "tickers": tickers,
                })
                count += 1

                for ticker in tickers:
                    all_mentions.append({
                        "ticker": ticker,
                        "source_type": "reddit",
                        "source_id": pid,
                        "source_title": title[:200],
                        "mentioned_at": post_data.get("created_utc", time.time()),
                        "sentiment": sentiment,
                    })

            print(f"  [Reddit/JSON] r/{subreddit}: {count} posts")

        except Exception as e:
            print(f"  [Reddit/JSON] r/{subreddit}: Error - {e}")

        time.sleep(random.uniform(3, 6))

    return all_posts, all_mentions


# ── Reddit orchestrator (tries methods in order) ────────────────

def scrape_all_reddit() -> tuple[list[dict], list[dict]]:
    print("[Scraper] Starting Reddit scrape...")

    # 1. Try AsyncPRAW first (best quality, 100 req/min)
    loop = asyncio.new_event_loop()
    try:
        posts, mentions = loop.run_until_complete(scrape_reddit_asyncpraw())
    except Exception as e:
        print(f"  [Reddit/PRAW] Failed: {e}")
        posts, mentions = [], []
    finally:
        loop.close()

    if len(posts) >= 5:
        print(f"[Scraper] Reddit (PRAW) complete: {len(posts)} posts, {len(mentions)} mentions")
        return posts, mentions

    # 2. Fallback to PullPush API
    print("  [Reddit] PRAW yielded few results, trying PullPush fallback...")
    with httpx.Client() as client:
        pp_posts, pp_mentions = scrape_pullpush(client)
        posts.extend(pp_posts)
        mentions.extend(pp_mentions)

    if len(posts) >= 5:
        print(f"[Scraper] Reddit (PullPush) complete: {len(posts)} posts, {len(mentions)} mentions")
        return posts, mentions

    # 3. Last resort: old.reddit.com JSON
    print("  [Reddit] PullPush yielded few results, trying old.reddit.com JSON...")
    with httpx.Client() as client:
        json_posts, json_mentions = scrape_reddit_json(client)
        posts.extend(json_posts)
        mentions.extend(json_mentions)

    print(f"[Scraper] Reddit complete: {len(posts)} posts, {len(mentions)} mentions")
    return posts, mentions


# ── ApeWisdom (Reddit mention tracker, free, no auth) ─────────────

def scrape_apewisdom() -> list[dict]:
    print("[Scraper] Starting ApeWisdom scrape...")
    all_mentions = []

    filters = ["all-stocks", "wallstreetbets", "stocks"]
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

        top_tickers = ["AAPL", "TSLA", "NVDA", "AMD", "SPY", "QQQ", "AMZN", "MSFT", "META", "GOOGL"]
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

    top_tickers = ["AAPL", "TSLA", "NVDA", "AMD", "MSFT", "AMZN", "META", "GOOGL"]

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
        reddit_posts, reddit_mentions = scrape_all_reddit()
        news_items, news_mentions = scrape_all_news()

        # Additional data sources
        apewisdom_mentions = scrape_apewisdom()
        reddit_mentions.extend(apewisdom_mentions)

        st_posts, st_mentions = scrape_stocktwits_trending()
        reddit_posts.extend(st_posts)
        reddit_mentions.extend(st_mentions)

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            loop.run_until_complete(
                save_scrape_results(reddit_posts, reddit_mentions, news_items, news_mentions)
            )
            loop.run_until_complete(cleanup_old_data(days=7))
        finally:
            loop.close()

        total_mentions = len(reddit_mentions) + len(news_mentions)
        print(f"\n[Scraper] Complete! {len(reddit_posts)} posts, {len(news_items)} news, {total_mentions} total mentions")

    except Exception as e:
        print(f"[Scraper] FATAL ERROR: {e}")
        traceback.print_exc()

    print(f"{'='*60}\n")
