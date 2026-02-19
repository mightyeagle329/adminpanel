"""
AI Curator schemas for Phase 6
"""

from pydantic import BaseModel, Field, HttpUrl
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

from app.schemas.market import MarketCategory, MarketBadge


class AIMode(str, Enum):
    """AI operating mode"""
    HUMAN_REVIEW = "HUMAN_REVIEW"
    FULL_CONTROL = "FULL_CONTROL"


class GameMode(str, Enum):
    """Game mode types"""
    FLASH_15M = "FLASH_15M"
    HIGH_JUMP_15M = "HIGH_JUMP_15M"
    MARATHON_15M = "MARATHON_15M"
    CLIMAX_30M = "CLIMAX_30M"
    DUO_30M = "DUO_30M"
    CURATOR_1H = "CURATOR_1H"
    CURATOR_4H = "CURATOR_4H"
    CURATOR_12H = "CURATOR_12H"
    CURATOR_24H = "CURATOR_24H"


class AICuratorConfig(BaseModel):
    """AI Curator configuration"""
    enabled: bool = Field(True, description="Enable/disable AI Curator")
    mode: AIMode = Field(AIMode.HUMAN_REVIEW, description="AI operating mode")
    interval_seconds: int = Field(300, ge=60, le=3600, description="Polling interval")
    max_markets_per_hour: int = Field(10, ge=1, le=50)
    auto_publish: bool = Field(False, description="Auto-publish markets without human review")
    
    # Game modes enabled
    flash_15m_enabled: bool = True
    high_jump_15m_enabled: bool = True
    marathon_15m_enabled: bool = True
    climax_30m_enabled: bool = True
    duo_30m_enabled: bool = True
    curator_1h_enabled: bool = True
    curator_4h_enabled: bool = True
    curator_12h_enabled: bool = True
    curator_24h_enabled: bool = True


class AICuratorStatus(BaseModel):
    """AI Curator status"""
    enabled: bool
    mode: AIMode
    is_running: bool
    last_execution: Optional[datetime]
    markets_created_today: int
    markets_pending_approval: int
    next_execution: Optional[datetime]


class TriggerThresholds(BaseModel):
    """Trigger thresholds for AI Curator"""
    
    # Crypto
    crypto_volume_spike_multiplier: float = Field(3.0, description="Volume spike threshold (e.g., 3x)")
    crypto_social_mentions_threshold: int = Field(10000, description="Social mentions per hour")
    crypto_whale_transfer_threshold: float = Field(10000000, description="Whale transfer in USD")
    crypto_min_market_cap: float = Field(50000000, description="Minimum market cap for tokens")
    crypto_min_24h_volume: float = Field(1000000, description="Minimum 24h volume")
    crypto_min_token_age_hours: int = Field(48, description="Minimum token age in hours")
    
    # Finance
    finance_impact_stars: int = Field(3, ge=1, le=3, description="Economic calendar importance")
    finance_earnings_move_threshold: float = Field(5.0, description="Pre-market move % for earnings")
    
    # Sports
    sports_tier_1_only: bool = Field(True, description="Only tier-1 journalist confirmations")
    
    # Hype/Viral
    hype_hashtag_velocity_threshold: float = Field(5.0, description="Hashtag velocity multiplier")
    hype_tiktok_velocity_threshold: float = Field(5.0, description="TikTok velocity multiplier")
    hype_google_breakout_threshold: float = Field(50.0, description="Google trends breakout multiplier")
    
    # Global
    global_cross_verification_required: bool = Field(True, description="Require AP + Reuters confirmation")


class AIGeneratedMarketDraft(BaseModel):
    """AI-generated market draft"""
    draft_id: str
    question: str
    category: MarketCategory
    sub_tag: str
    badge: MarketBadge
    outcome_a_label: str
    outcome_b_label: str
    duration_hours: int
    resolution_source: HttpUrl
    batch_id: str
    image_prompt: str
    confidence_score: float = Field(..., ge=0, le=1)
    trigger_data: Dict[str, Any]
    created_at: datetime
    status: str = Field("PENDING_APPROVAL", description="PENDING_APPROVAL, APPROVED, REJECTED")


class AIMarketApprovalRequest(BaseModel):
    """Request to approve/reject AI-generated market"""
    draft_id: str
    approved: bool
    admin_notes: Optional[str] = None
    modifications: Optional[Dict[str, Any]] = Field(None, description="Modifications to apply before publishing")


class DataSourceConfig(BaseModel):
    """Data source configuration"""
    source_name: str
    enabled: bool
    api_key: Optional[str] = None
    poll_interval_seconds: Optional[int] = None
    rate_limit: Optional[int] = None


class MarketGenerationStats(BaseModel):
    """Market generation statistics"""
    period: str = Field(..., description="today, this_week, this_month")
    total_generated: int
    auto_published: int
    pending_approval: int
    rejected: int
    by_category: Dict[str, int]
    by_game_mode: Dict[str, int]
