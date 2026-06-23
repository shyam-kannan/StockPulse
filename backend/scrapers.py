import time
import random
import hashlib
import asyncio
import traceback
from datetime import datetime

import httpx
import feedparser
from textblob import TextBlob

from tickers import extract_tickers
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

REDDIT_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 StockPulse/1.0",
    "Accept": "application/json",
    "Accept-Language": "en-US,en;q=0.9",
}

NEWS_FEEDS = {
    "yahoo": "https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC&region=US&lang=en-US",
    "marketwatch": "https://feeds.marketwatch.com/marketwatch/topstories",
}


def get_sentiment(text: str) -> float:
    try:
        if not text or len(text.strip()) < 5:
            return 0.0
        return round(TextBlob(text).sentiment.polarity, 3)
    except Exception:
        return 0.0


def scrape_reddit_subreddit(client: httpx.Client, subreddit: str) -> list[dict]:
    posts = []
    try:
        url = f"https://old.reddit.com/r/{subreddit}/hot.json?limit=25"
        resp = client.get(url, headers=REDDIT_HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        children = data.get("data", {}).get("children", [])
        for child in children:
            post_data = child.get("data", {})
            if not post_data.get("title"):
                continue
            if post_data.get("stickied"):
                continue

            title = post_data.get("title", "")
            selftext = post_data.get("selftext", "")[:2000]
            full_text = f"{title} {selftext}"

            tickers = extract_tickers(full_text)
            if not tickers:
                continue

            sentiment = get_sentiment(full_text)

            posts.append({
                "id": post_data.get("id", ""),
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

        print(f"  [Reddit] r/{subreddit}: {len(posts)} posts with ticker mentions")

    except httpx.HTTPStatusError as e:
        print(f"  [Reddit] r/{subreddit}: HTTP {e.response.status_code}")
    except Exception as e:
        print(f"  [Reddit] r/{subreddit}: Error - {e}")

    return posts


def scrape_reddit_comments(client: httpx.Client, subreddit: str, post_id: str) -> list[dict]:
    comments_data = []
    try:
        url = f"https://old.reddit.com/r/{subreddit}/comments/{post_id}.json?limit=10&depth=1"
        resp = client.get(url, headers=REDDIT_HEADERS, timeout=15)
        resp.raise_for_status()
        data = resp.json()

        if len(data) >= 2:
            comment_listing = data[1].get("data", {}).get("children", [])
            for comment in comment_listing[:10]:
                cdata = comment.get("data", {})
                body = cdata.get("body", "")
                if not body or len(body) < 10:
                    continue

                tickers = extract_tickers(body)
                if tickers:
                    sentiment = get_sentiment(body)
                    comments_data.append({
                        "tickers": tickers,
                        "sentiment": sentiment,
                        "text": body[:500],
                        "score": cdata.get("score", 0),
                        "created_utc": cdata.get("created_utc", time.time()),
                    })

    except Exception:
        pass

    return comments_data


def scrape_all_reddit() -> tuple[list[dict], list[dict]]:
    print("[Scraper] Starting Reddit scrape...")
    all_posts = []
    all_mentions = []

    with httpx.Client() as client:
        for subreddit in REDDIT_SUBREDDITS:
            posts = scrape_reddit_subreddit(client, subreddit)
            for post in posts:
                all_posts.append(post)
                for ticker in post["tickers"]:
                    all_mentions.append({
                        "ticker": ticker,
                        "source_type": "reddit",
                        "source_id": post["id"],
                        "source_title": post["title"][:200],
                        "mentioned_at": post["created_utc"],
                        "sentiment": post["sentiment"],
                    })

            # Grab comments from top 3 posts for deeper analysis
            for post in posts[:3]:
                time.sleep(random.uniform(1, 2))
                comments = scrape_reddit_comments(client, subreddit, post["id"])
                for comment in comments:
                    for ticker in comment["tickers"]:
                        all_mentions.append({
                            "ticker": ticker,
                            "source_type": "reddit",
                            "source_id": post["id"],
                            "source_title": f"[Comment] {comment['text'][:100]}",
                            "mentioned_at": comment["created_utc"],
                            "sentiment": comment["sentiment"],
                        })

            time.sleep(random.uniform(2, 5))

    print(f"[Scraper] Reddit complete: {len(all_posts)} posts, {len(all_mentions)} mentions")
    return all_posts, all_mentions


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

            print(f"  [News] {source}: {items_found} items, {sum(1 for m in all_mentions if m['source_type'] == 'news')} mentions")

        except Exception as e:
            print(f"  [News] {source}: Error - {e}")

        time.sleep(random.uniform(1, 3))

    print(f"[Scraper] News complete: {len(all_items)} items, {len(all_mentions)} mentions")
    return all_items, all_mentions


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
