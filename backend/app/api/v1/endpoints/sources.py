"""
Sources API: CRUD for Telegram channels, Twitter accounts, RSS feeds, Polymarket topics.
All source config is stored in the FastAPI backend (data/sources.json).
"""

from fastapi import APIRouter, HTTPException

from app.schemas.sources import (
    TelegramChannelOut,
    TelegramChannelAdd,
    TwitterAccountOut,
    TwitterAccountAdd,
    RSSFeedOut,
    RSSFeedAdd,
    PolymarketTopicOut,
    PolymarketTopicAdd,
)
from app.services import sources_store

router = APIRouter()


# ----- Telegram -----
@router.get("/telegram", response_model=list)
async def list_telegram_channels():
    return sources_store.get_telegram_channels()


@router.post("/telegram", response_model=dict)
async def add_telegram_channel(body: TelegramChannelAdd):
    try:
        return sources_store.add_telegram_channel(body.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/telegram/{channel_id}")
async def delete_telegram_channel(channel_id: str):
    sources_store.delete_telegram_channel(channel_id)
    return {"success": True}


@router.patch("/telegram/{channel_id}/toggle")
async def toggle_telegram_channel(channel_id: str):
    ch = sources_store.toggle_telegram_channel_enabled(channel_id)
    if not ch:
        raise HTTPException(status_code=404, detail="Channel not found")
    return ch


# ----- Twitter -----
@router.get("/twitter", response_model=list)
async def list_twitter_accounts():
    return sources_store.get_twitter_accounts()


@router.post("/twitter", response_model=dict)
async def add_twitter_account(body: TwitterAccountAdd):
    try:
        return sources_store.add_twitter_account(
            username=body.username,
            display_name=body.display_name,
            account_type=body.account_type,
            user_id=body.user_id,
            enabled=True,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/twitter/{account_id}")
async def delete_twitter_account(account_id: str):
    sources_store.delete_twitter_account(account_id)
    return {"success": True}


@router.patch("/twitter/{account_id}/toggle")
async def toggle_twitter_account(account_id: str):
    acc = sources_store.toggle_twitter_account_enabled(account_id)
    if not acc:
        raise HTTPException(status_code=404, detail="Account not found")
    return acc


# ----- RSS -----
@router.get("/rss", response_model=list)
async def list_rss_feeds():
    return sources_store.get_rss_feeds()


@router.post("/rss", response_model=dict)
async def add_rss_feed(body: RSSFeedAdd):
    try:
        return sources_store.add_rss_feed(
            name=body.name,
            url=body.url,
            category=body.category,
            enabled=True,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/rss/{feed_id}")
async def delete_rss_feed(feed_id: str):
    sources_store.delete_rss_feed(feed_id)
    return {"success": True}


@router.patch("/rss/{feed_id}/toggle")
async def toggle_rss_feed(feed_id: str):
    f = sources_store.toggle_rss_feed_enabled(feed_id)
    if not f:
        raise HTTPException(status_code=404, detail="Feed not found")
    return f


# ----- Polymarket -----
@router.get("/polymarket", response_model=list)
async def list_polymarket_topics():
    return sources_store.get_polymarket_topics()


@router.post("/polymarket", response_model=dict)
async def add_polymarket_topic(body: PolymarketTopicAdd):
    return sources_store.add_polymarket_topic(
        name=body.name,
        keywords=body.keywords,
        category=body.category,
        enabled=True,
    )


@router.delete("/polymarket/{topic_id}")
async def delete_polymarket_topic(topic_id: str):
    sources_store.delete_polymarket_topic(topic_id)
    return {"success": True}


@router.patch("/polymarket/{topic_id}/toggle")
async def toggle_polymarket_topic(topic_id: str):
    t = sources_store.toggle_polymarket_topic_enabled(topic_id)
    if not t:
        raise HTTPException(status_code=404, detail="Topic not found")
    return t
