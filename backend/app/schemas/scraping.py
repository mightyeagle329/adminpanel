"""
Scraping-related schemas
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class SourceType(str, Enum):
    """Source type enum"""
    TELEGRAM = "telegram"
    TWITTER = "twitter"
    RSS = "rss"
    POLYMARKET = "polymarket"


class ScrapeRequest(BaseModel):
    """Request to start scraping"""
    sources: Optional[List[SourceType]] = Field(None, description="Specific sources to scrape, or all if None")
    days_back: int = Field(2, ge=1, le=30)
    max_items_per_source: int = Field(100, ge=10, le=500)


class ScrapeProgress(BaseModel):
    """Scraping progress status"""
    status: str = Field(..., description="idle, scraping, completed, error")
    progress: int = Field(0, ge=0, le=100)
    current_source: Optional[str] = None
    message: Optional[str] = None
    stats: Optional[Dict[str, int]] = None


class ScrapedPost(BaseModel):
    """Scraped post schema"""
    id: str
    source: SourceType
    source_id: str
    source_name: str
    title: Optional[str] = None
    text: str
    date_iso: datetime
    url: str
    metadata: Dict[str, Any] = Field(default_factory=dict)


class TwitterAccountAdd(BaseModel):
    """Add Twitter account request"""
    username: str = Field(..., min_length=1, max_length=100)
    display_name: Optional[str] = None
    account_type: str = Field("person", description="person, organization, news, other")


class RSSFeedAdd(BaseModel):
    """Add RSS feed request"""
    name: str = Field(..., min_length=1, max_length=200)
    url: HttpUrl
    category: str = Field("general", description="crypto, politics, financial, general")


class TelegramChannelAdd(BaseModel):
    """Add Telegram channel request"""
    username: str = Field(..., min_length=1, max_length=100)
    url: HttpUrl


class PolymarketTopicAdd(BaseModel):
    """Add Polymarket topic request"""
    name: str = Field(..., min_length=1, max_length=200)
    keywords: List[str] = Field(..., min_items=1)
    category: str = Field("other", description="crypto, politics, financial, sports, other")
