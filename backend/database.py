import os
import json
import time
import hashlib
import aiosqlite

DATABASE_PATH = os.getenv("DATABASE_PATH", "./stockpulse.db")

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS reddit_posts (
    id TEXT PRIMARY KEY,
    subreddit TEXT NOT NULL,
    title TEXT NOT NULL,
    selftext TEXT DEFAULT '',
    score INTEGER DEFAULT 0,
    num_comments INTEGER DEFAULT 0,
    author TEXT DEFAULT '',
    url TEXT DEFAULT '',
    created_utc REAL NOT NULL,
    scraped_at REAL NOT NULL,
    sentiment REAL DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS idx_reddit_posts_created ON reddit_posts(created_utc);
CREATE INDEX IF NOT EXISTS idx_reddit_posts_subreddit ON reddit_posts(subreddit);

CREATE TABLE IF NOT EXISTS news_items (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    title TEXT NOT NULL,
    link TEXT NOT NULL,
    summary TEXT DEFAULT '',
    published_at REAL,
    scraped_at REAL NOT NULL,
    sentiment REAL DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS idx_news_items_published ON news_items(published_at);
CREATE INDEX IF NOT EXISTS idx_news_items_source ON news_items(source);

CREATE TABLE IF NOT EXISTS ticker_mentions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_id TEXT NOT NULL,
    source_title TEXT DEFAULT '',
    mentioned_at REAL NOT NULL,
    sentiment REAL DEFAULT 0.0
);

CREATE INDEX IF NOT EXISTS idx_ticker_mentions_ticker ON ticker_mentions(ticker);
CREATE INDEX IF NOT EXISTS idx_ticker_mentions_time ON ticker_mentions(mentioned_at);
CREATE INDEX IF NOT EXISTS idx_ticker_mentions_composite ON ticker_mentions(ticker, mentioned_at);

CREATE TABLE IF NOT EXISTS analysis_cache (
    ticker TEXT PRIMARY KEY,
    momentum_json TEXT,
    fundamental_json TEXT,
    price_target_json TEXT,
    yfinance_json TEXT,
    created_at REAL NOT NULL,
    expires_at REAL NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analysis_cache_expires ON analysis_cache(expires_at);
"""


async def get_db():
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    await db.execute("PRAGMA journal_mode=WAL")
    await db.execute("PRAGMA busy_timeout=5000")
    return db


async def init_db():
    db = await get_db()
    try:
        await db.executescript(SCHEMA_SQL)
        await db.commit()
        print(f"Database initialized at {DATABASE_PATH}")
    finally:
        await db.close()


async def insert_reddit_post(post: dict):
    db = await get_db()
    try:
        await db.execute(
            """INSERT OR IGNORE INTO reddit_posts
               (id, subreddit, title, selftext, score, num_comments, author, url, created_utc, scraped_at, sentiment)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                post["id"],
                post["subreddit"],
                post["title"],
                post.get("selftext", ""),
                post.get("score", 0),
                post.get("num_comments", 0),
                post.get("author", ""),
                post.get("url", ""),
                post["created_utc"],
                time.time(),
                post.get("sentiment", 0.0),
            ),
        )
        await db.commit()
        return True
    except Exception as e:
        print(f"Error inserting reddit post: {e}")
        return False
    finally:
        await db.close()


async def insert_news_item(item: dict):
    item_id = hashlib.md5(
        (item["source"] + item["link"]).encode()
    ).hexdigest()
    db = await get_db()
    try:
        await db.execute(
            """INSERT OR IGNORE INTO news_items
               (id, source, title, link, summary, published_at, scraped_at, sentiment)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                item_id,
                item["source"],
                item["title"],
                item["link"],
                item.get("summary", ""),
                item.get("published_at"),
                time.time(),
                item.get("sentiment", 0.0),
            ),
        )
        await db.commit()
        return item_id
    except Exception as e:
        print(f"Error inserting news item: {e}")
        return None
    finally:
        await db.close()


async def insert_ticker_mention(mention: dict):
    db = await get_db()
    try:
        await db.execute(
            """INSERT INTO ticker_mentions
               (ticker, source_type, source_id, source_title, mentioned_at, sentiment)
               VALUES (?, ?, ?, ?, ?, ?)""",
            (
                mention["ticker"],
                mention["source_type"],
                mention["source_id"],
                mention.get("source_title", ""),
                mention["mentioned_at"],
                mention.get("sentiment", 0.0),
            ),
        )
        await db.commit()
    except Exception as e:
        print(f"Error inserting ticker mention: {e}")
    finally:
        await db.close()


async def batch_insert_ticker_mentions(mentions: list):
    if not mentions:
        return
    db = await get_db()
    try:
        await db.executemany(
            """INSERT INTO ticker_mentions
               (ticker, source_type, source_id, source_title, mentioned_at, sentiment)
               VALUES (?, ?, ?, ?, ?, ?)""",
            [
                (
                    m["ticker"],
                    m["source_type"],
                    m["source_id"],
                    m.get("source_title", ""),
                    m["mentioned_at"],
                    m.get("sentiment", 0.0),
                )
                for m in mentions
            ],
        )
        await db.commit()
    except Exception as e:
        print(f"Error batch inserting ticker mentions: {e}")
    finally:
        await db.close()


async def get_trending_tickers(hours: int = 24, limit: int = 20):
    cutoff = time.time() - (hours * 3600)
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT
                 ticker,
                 COUNT(*) as mention_count,
                 AVG(sentiment) as avg_sentiment,
                 GROUP_CONCAT(DISTINCT source_type) as sources
               FROM ticker_mentions
               WHERE mentioned_at > ?
               GROUP BY ticker
               ORDER BY mention_count DESC
               LIMIT ?""",
            (cutoff, limit),
        )
        rows = await cursor.fetchall()
        return [
            {
                "ticker": row["ticker"],
                "mention_count": row["mention_count"],
                "avg_sentiment": round(row["avg_sentiment"] or 0, 3),
                "sources": (row["sources"] or "").split(","),
            }
            for row in rows
        ]
    finally:
        await db.close()


async def get_ticker_mentions(ticker: str, hours: int = 24, limit: int = 20):
    cutoff = time.time() - (hours * 3600)
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT source_type, source_id, source_title, mentioned_at, sentiment
               FROM ticker_mentions
               WHERE ticker = ? AND mentioned_at > ?
               ORDER BY mentioned_at DESC
               LIMIT ?""",
            (ticker, cutoff, limit),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


async def get_recent_news(limit: int = 50):
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT id, source, title, link, summary, published_at, scraped_at, sentiment
               FROM news_items
               ORDER BY COALESCE(published_at, scraped_at) DESC
               LIMIT ?""",
            (limit,),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


async def get_reddit_posts_for_ticker(ticker: str, hours: int = 24, limit: int = 20):
    cutoff = time.time() - (hours * 3600)
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT DISTINCT rp.id, rp.subreddit, rp.title, rp.score,
                      rp.num_comments, rp.url, rp.created_utc, rp.sentiment
               FROM reddit_posts rp
               JOIN ticker_mentions tm ON tm.source_id = rp.id AND tm.source_type = 'reddit'
               WHERE tm.ticker = ? AND rp.created_utc > ?
               ORDER BY rp.score DESC
               LIMIT ?""",
            (ticker, cutoff, limit),
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        await db.close()


async def get_cached_analysis(ticker: str):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM analysis_cache WHERE ticker = ? AND expires_at > ?",
            (ticker, time.time()),
        )
        row = await cursor.fetchone()
        if row:
            return {
                "ticker": row["ticker"],
                "momentum": json.loads(row["momentum_json"]) if row["momentum_json"] else None,
                "fundamentals": json.loads(row["fundamental_json"]) if row["fundamental_json"] else None,
                "price_targets": json.loads(row["price_target_json"]) if row["price_target_json"] else None,
                "yfinance": json.loads(row["yfinance_json"]) if row["yfinance_json"] else None,
                "created_at": row["created_at"],
                "expires_at": row["expires_at"],
            }
        return None
    finally:
        await db.close()


async def set_cached_analysis(ticker: str, data: dict, ttl_hours: int = 4):
    now = time.time()
    db = await get_db()
    try:
        await db.execute(
            """INSERT OR REPLACE INTO analysis_cache
               (ticker, momentum_json, fundamental_json, price_target_json, yfinance_json, created_at, expires_at)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (
                ticker,
                json.dumps(data.get("momentum")),
                json.dumps(data.get("fundamentals")),
                json.dumps(data.get("price_targets")),
                json.dumps(data.get("yfinance")),
                now,
                now + (ttl_hours * 3600),
            ),
        )
        await db.commit()
    except Exception as e:
        print(f"Error caching analysis: {e}")
    finally:
        await db.close()


async def cleanup_old_data(days: int = 7):
    cutoff = time.time() - (days * 86400)
    db = await get_db()
    try:
        await db.execute("DELETE FROM reddit_posts WHERE created_utc < ?", (cutoff,))
        await db.execute(
            "DELETE FROM news_items WHERE COALESCE(published_at, scraped_at) < ?",
            (cutoff,),
        )
        await db.execute("DELETE FROM ticker_mentions WHERE mentioned_at < ?", (cutoff,))
        await db.execute("DELETE FROM analysis_cache WHERE expires_at < ?", (time.time(),))
        await db.commit()
        print(f"Cleaned up data older than {days} days")
    except Exception as e:
        print(f"Error during cleanup: {e}")
    finally:
        await db.close()
