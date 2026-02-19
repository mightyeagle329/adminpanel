"""
Market-related schemas
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class MarketStatus(str, Enum):
    """Market status enum"""
    DRAFT = "DRAFT"
    OPEN = "OPEN"
    LOCKED = "LOCKED"
    SETTLING = "SETTLING"
    RESOLVED = "RESOLVED"
    VOID = "VOID"


class MarketCategory(str, Enum):
    """Market category enum"""
    CRYPTO = "CRYPTO"
    FINANCE = "FINANCE"
    SPORTS = "SPORTS"
    HYPE = "HYPE"
    GLOBAL = "GLOBAL"


class MarketBadge(str, Enum):
    """Market badge enum"""
    NONE = "NONE"
    HOT = "🔥 HOT"
    GEM = "💎 GEM"
    BREAKING = "🚨 BREAKING"
    WHALE = "🐳 WHALE"
    VIRAL = "🔥 VIRAL"
    VERDICT = "⚖️ VERDICT"
    RIVALRY = "⚔️ RIVALRY"
    FLASH = "⚡ FLASH"
    FINAL = "🏆 FINAL"


class XPPromoTag(str, Enum):
    """XP Promo tag enum"""
    NONE = "NONE"
    DOUBLE_XP = "✨ 2x XP EVENT"


class MarketOutcome(BaseModel):
    """Market outcome schema"""
    label: str = Field(..., description="Outcome label (e.g., 'YES', 'NO')")
    icon_url: Optional[str] = Field(None, description="Icon URL")


class MarketCreateRequest(BaseModel):
    """Request to create a market"""
    title: str = Field(..., min_length=10, max_length=500)
    category: MarketCategory
    sub_tag: Optional[str] = Field(None, description="Content chip / sub-niche")
    banner_image_url: Optional[str] = None
    badge: MarketBadge = MarketBadge.NONE
    xp_promo_tag: XPPromoTag = XPPromoTag.NONE
    outcome_a: MarketOutcome
    outcome_b: MarketOutcome
    start_time: datetime
    lock_time: datetime
    resolution_time: datetime
    oracle_source_url: HttpUrl
    duration_hours: Optional[int] = Field(None, ge=0, le=24)
    batch_id: Optional[str] = Field(None, description="CSV string of risk tags")
    image_prompt: Optional[str] = Field(None, description="AI image generation prompt")


class MarketUpdateRequest(BaseModel):
    """Request to update a market"""
    title: Optional[str] = None
    status: Optional[MarketStatus] = None
    banner_image_url: Optional[str] = None
    badge: Optional[MarketBadge] = None
    xp_promo_tag: Optional[XPPromoTag] = None
    sub_tag: Optional[str] = None


class MarketResolveRequest(BaseModel):
    """Request to resolve a market"""
    winning_outcome: int = Field(..., ge=0, le=1, description="0 for outcome A, 1 for outcome B")
    proof_data: Dict[str, Any] = Field(..., description="Evidence and proof of resolution")


class MarketVoidRequest(BaseModel):
    """Request to void a market"""
    reason: str = Field(..., min_length=10, max_length=500)
    admin_notes: Optional[str] = None


class MarketResponse(BaseModel):
    """Market response schema"""
    market_id: str
    title: str
    category: MarketCategory
    sub_tag: Optional[str]
    status: MarketStatus
    banner_image_url: Optional[str]
    badge: MarketBadge
    xp_promo_tag: XPPromoTag
    outcome_a: MarketOutcome
    outcome_b: MarketOutcome
    start_time: datetime
    lock_time: datetime
    resolution_time: datetime
    oracle_source_url: str
    batch_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    created_by: str
    source: str = Field(description="'AI' or 'ADMIN'")


class MarketListRequest(BaseModel):
    """Request to list markets"""
    status: Optional[MarketStatus] = None
    category: Optional[MarketCategory] = None
    source: Optional[str] = Field(None, description="Filter by 'AI' or 'ADMIN'")
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)


class MarketTemplate(BaseModel):
    """Market template for recurring events"""
    template_id: str
    name: str
    title_template: str
    category: MarketCategory
    sub_tag: Optional[str]
    badge: MarketBadge
    xp_promo_tag: XPPromoTag
    outcome_a: MarketOutcome
    outcome_b: MarketOutcome
    default_duration_hours: int
    created_at: datetime


class MarketTemplateCreateRequest(BaseModel):
    """Request to create a market template"""
    name: str = Field(..., min_length=3, max_length=100)
    title_template: str = Field(..., description="Market title template with variables")
    category: MarketCategory
    sub_tag: Optional[str] = None
    badge: MarketBadge = MarketBadge.NONE
    xp_promo_tag: XPPromoTag = XPPromoTag.NONE
    outcome_a: MarketOutcome
    outcome_b: MarketOutcome
    default_duration_hours: int = Field(24, ge=1, le=24)
