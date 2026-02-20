"""
Source configuration schemas (Telegram, Twitter, RSS, Polymarket)
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List


class TelegramChannelOut(BaseModel):
    id: str
    url: str
    username: str
    added_at: str
    enabled: bool = True


class TelegramChannelAdd(BaseModel):
    url: str = Field(..., min_length=1, description="e.g. https://t.me/channelname")


class TwitterAccountOut(BaseModel):
    id: str
    username: str
    display_name: str
    account_type: str = "person"
    user_id: Optional[str] = None  # RapidAPI requires user_id; optional, can be resolved later
    added_at: str
    enabled: bool = True


class TwitterAccountAdd(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    display_name: Optional[str] = None
    account_type: str = Field("person", description="person, organization, news, other")
    user_id: Optional[str] = None  # If provided, used for RapidAPI; else may be resolved or skipped


class RSSFeedOut(BaseModel):
    id: str
    name: str
    url: str
    category: str = "general"
    added_at: str
    enabled: bool = True


class RSSFeedAdd(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    url: str = Field(..., description="RSS feed URL")
    category: str = Field("general", description="crypto, politics, financial, general")


class PolymarketTopicOut(BaseModel):
    id: str
    name: str
    keywords: List[str]
    category: str = "other"
    added_at: str
    enabled: bool = True


class PolymarketTopicAdd(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    keywords: List[str] = Field(..., min_length=1)
    category: str = Field("other", description="crypto, politics, financial, sports, other")
