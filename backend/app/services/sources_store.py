"""
Sources store: single source of truth for Telegram channels, Twitter accounts,
RSS feeds, and Polymarket topics. Persisted as JSON under backend/data.
"""

import json
import logging
import re
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

# Default channels/accounts/feeds/topics used when store is empty (seeds)
DEFAULT_TELEGRAM_CHANNELS = [
    {"username": "coindesk", "url": "https://t.me/coindesk", "category": "crypto"},
    {"username": "DuetNews", "url": "https://t.me/DuetNews", "category": "news"},
    {"username": "Reuters", "url": "https://t.me/Reuters", "category": "news"},
]

DEFAULT_TWITTER_ACCOUNTS = [
    {"user_id": "44196397", "username": "elonmusk", "display_name": "Elon Musk", "account_type": "person"},
    {"user_id": "96479162", "username": "cz_binance", "display_name": "CZ Binance", "account_type": "person"},
    {"user_id": "357312062", "username": "VitalikButerin", "display_name": "Vitalik Buterin", "account_type": "person"},
    {"user_id": "1367531", "username": "Reuters", "display_name": "Reuters", "account_type": "news"},
    {"user_id": "51241574", "username": "AP", "display_name": "Associated Press", "account_type": "news"},
    {"user_id": "3108351", "username": "FabrizioRomano", "display_name": "Fabrizio Romano", "account_type": "news"},
]

DEFAULT_RSS_FEEDS = [
    {"name": "CoinDesk", "url": "https://www.coindesk.com/arc/outboundfeeds/rss/", "category": "crypto"},
    {"name": "CryptoSlate", "url": "https://cryptoslate.com/feed/", "category": "crypto"},
    {"name": "BBC News", "url": "http://feeds.bbci.co.uk/news/rss.xml", "category": "general"},
]

DEFAULT_POLYMARKET_TOPICS = [
    {"name": "Crypto", "keywords": ["bitcoin", "ethereum", "crypto"], "category": "crypto"},
    {"name": "Politics", "keywords": ["election", "president", "politics"], "category": "politics"},
    {"name": "Sports", "keywords": ["nfl", "nba", "football"], "category": "sports"},
]


def _sources_path() -> Path:
    base = Path(__file__).resolve().parent.parent.parent
    return base / "data" / "sources.json"


def _ensure_dir() -> None:
    _sources_path().parent.mkdir(parents=True, exist_ok=True)


def _load() -> Dict[str, Any]:
    _ensure_dir()
    path = _sources_path()
    if not path.exists():
        return {
            "telegram_channels": [],
            "twitter_accounts": [],
            "rss_feeds": [],
            "polymarket_topics": [],
        }
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning(f"Could not load sources.json: {e}")
        return {
            "telegram_channels": [],
            "twitter_accounts": [],
            "rss_feeds": [],
            "polymarket_topics": [],
        }


def _save(data: Dict[str, Any]) -> None:
    _ensure_dir()
    with open(_sources_path(), "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)


# ----- Telegram -----
def get_telegram_channels() -> List[Dict[str, Any]]:
    data = _load()
    channels = data.get("telegram_channels", [])
    if not channels:
        for i, ch in enumerate(DEFAULT_TELEGRAM_CHANNELS):
            channels.append({
                "id": f"tg_{int(datetime.utcnow().timestamp())}_{i}",
                "url": ch["url"],
                "username": ch["username"],
                "added_at": datetime.utcnow().isoformat() + "Z",
                "enabled": True,
            })
        data["telegram_channels"] = channels
        _save(data)
    return channels


def add_telegram_channel(url: str) -> Dict[str, Any]:
    data = _load()
    match = re.search(r"t\.me/([a-zA-Z0-9_]+)", url)
    username = match.group(1) if match else url.strip().strip("/").split("/")[-1]
    if not username:
        raise ValueError("Invalid Telegram URL")
    for ch in data.get("telegram_channels", []):
        if ch.get("username") == username:
            raise ValueError("Channel already exists")
    channel = {
        "id": f"tg_{int(datetime.utcnow().timestamp())}",
        "url": url if url.startswith("http") else f"https://t.me/{username}",
        "username": username,
        "added_at": datetime.utcnow().isoformat() + "Z",
        "enabled": True,
    }
    data.setdefault("telegram_channels", []).append(channel)
    _save(data)
    return channel


def delete_telegram_channel(id: str) -> None:
    data = _load()
    data["telegram_channels"] = [c for c in data.get("telegram_channels", []) if c.get("id") != id]
    _save(data)


def toggle_telegram_channel_enabled(id: str) -> Optional[Dict[str, Any]]:
    data = _load()
    for c in data.get("telegram_channels", []):
        if c.get("id") == id:
            c["enabled"] = not c.get("enabled", True)
            _save(data)
            return c
    return None


# ----- Twitter -----
def get_twitter_accounts() -> List[Dict[str, Any]]:
    data = _load()
    accounts = data.get("twitter_accounts", [])
    if not accounts:
        # Seed defaults so scraping works out of the box
        for i, acc in enumerate(DEFAULT_TWITTER_ACCOUNTS):
            accounts.append({
                "id": f"tw_{int(datetime.utcnow().timestamp())}_{i}",
                "username": acc["username"],
                "display_name": acc["display_name"],
                "account_type": acc.get("account_type", "person"),
                "user_id": acc.get("user_id"),
                "added_at": datetime.utcnow().isoformat() + "Z",
                "enabled": True,
            })
        data["twitter_accounts"] = accounts
        _save(data)
    return accounts


def add_twitter_account(
    username: str,
    display_name: Optional[str] = None,
    account_type: str = "person",
    user_id: Optional[str] = None,
    enabled: bool = True,
) -> Dict[str, Any]:
    data = _load()
    username = username.lstrip("@").strip()
    for a in data.get("twitter_accounts", []):
        if a.get("username", "").lower() == username.lower():
            raise ValueError("Account already exists")
    account = {
        "id": f"tw_{int(datetime.utcnow().timestamp())}",
        "username": username,
        "display_name": display_name or username,
        "account_type": account_type,
        "user_id": user_id,
        "added_at": datetime.utcnow().isoformat() + "Z",
        "enabled": enabled,
    }
    data.setdefault("twitter_accounts", []).append(account)
    _save(data)
    return account


def delete_twitter_account(id: str) -> None:
    data = _load()
    data["twitter_accounts"] = [a for a in data.get("twitter_accounts", []) if a.get("id") != id]
    _save(data)


def toggle_twitter_account_enabled(id: str) -> Optional[Dict[str, Any]]:
    data = _load()
    for a in data.get("twitter_accounts", []):
        if a.get("id") == id:
            a["enabled"] = not a.get("enabled", True)
            _save(data)
            return a
    return None


# ----- RSS -----
def get_rss_feeds() -> List[Dict[str, Any]]:
    data = _load()
    feeds = data.get("rss_feeds", [])
    if not feeds:
        for i, feed in enumerate(DEFAULT_RSS_FEEDS):
            feeds.append({
                "id": f"rss_{int(datetime.utcnow().timestamp())}_{i}",
                "name": feed["name"],
                "url": feed["url"],
                "category": feed["category"],
                "added_at": datetime.utcnow().isoformat() + "Z",
                "enabled": True,
            })
        data["rss_feeds"] = feeds
        _save(data)
    return feeds


def add_rss_feed(name: str, url: str, category: str = "general", enabled: bool = True) -> Dict[str, Any]:
    data = _load()
    url = url.strip()
    for f in data.get("rss_feeds", []):
        if f.get("url") == url:
            raise ValueError("RSS feed already exists")
    feed = {
        "id": f"rss_{int(datetime.utcnow().timestamp())}",
        "name": name,
        "url": url,
        "category": category,
        "added_at": datetime.utcnow().isoformat() + "Z",
        "enabled": enabled,
    }
    data.setdefault("rss_feeds", []).append(feed)
    _save(data)
    return feed


def delete_rss_feed(id: str) -> None:
    data = _load()
    data["rss_feeds"] = [f for f in data.get("rss_feeds", []) if f.get("id") != id]
    _save(data)


def toggle_rss_feed_enabled(id: str) -> Optional[Dict[str, Any]]:
    data = _load()
    for f in data.get("rss_feeds", []):
        if f.get("id") == id:
            f["enabled"] = not f.get("enabled", True)
            _save(data)
            return f
    return None


# ----- Polymarket -----
def get_polymarket_topics() -> List[Dict[str, Any]]:
    data = _load()
    topics = data.get("polymarket_topics", [])
    if not topics:
        for i, topic in enumerate(DEFAULT_POLYMARKET_TOPICS):
            topics.append({
                "id": f"pm_{int(datetime.utcnow().timestamp())}_{i}",
                "name": topic["name"],
                "keywords": topic["keywords"],
                "category": topic["category"],
                "added_at": datetime.utcnow().isoformat() + "Z",
                "enabled": True,
            })
        data["polymarket_topics"] = topics
        _save(data)
    return topics


def add_polymarket_topic(
    name: str,
    keywords: List[str],
    category: str = "other",
    enabled: bool = True,
) -> Dict[str, Any]:
    data = _load()
    topic = {
        "id": f"pm_{int(datetime.utcnow().timestamp())}",
        "name": name,
        "keywords": list(keywords),
        "category": category,
        "added_at": datetime.utcnow().isoformat() + "Z",
        "enabled": enabled,
    }
    data.setdefault("polymarket_topics", []).append(topic)
    _save(data)
    return topic


def delete_polymarket_topic(id: str) -> None:
    data = _load()
    data["polymarket_topics"] = [t for t in data.get("polymarket_topics", []) if t.get("id") != id]
    _save(data)


def toggle_polymarket_topic_enabled(id: str) -> Optional[Dict[str, Any]]:
    data = _load()
    for t in data.get("polymarket_topics", []):
        if t.get("id") == id:
            t["enabled"] = not t.get("enabled", True)
            _save(data)
            return t
    return None
