"""
Competitions & SRS API endpoints
Phase 5, Module 3: SRS & Competition Wizard
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

router = APIRouter()


class CompetitionCreate(BaseModel):
    """Create competition request"""
    title: str = Field(..., min_length=5, max_length=200)
    prize_text: str
    prize_image_url: Optional[str] = None
    type: str = Field(..., description="RECURRING_WEEKLY or ONE_TIME")
    start_date: datetime
    end_date: datetime


class EconomyTuning(BaseModel):
    """SRS economy tuning parameters"""
    base_trade_xp: int = Field(200, ge=0)
    volume_ratio: float = Field(1.0, ge=0.1, le=10.0)
    relief_multiplier: float = Field(5.0, ge=1.0, le=10.0)
    xp_inflation_cap_multiplier: int = Field(1500, ge=500, le=5000)
    streak_freeze_cost: int = Field(1000, ge=100, le=10000)
    god_mode_multiplier: float = Field(2.0, ge=1.0, le=5.0)


class AllianceConfig(BaseModel):
    """Alliance (referral) configuration"""
    global_boost_multiplier: float = Field(1.20, ge=1.0, le=2.0)


@router.post("/create")
async def create_competition(request: CompetitionCreate):
    """Create a new competition"""
    return {
        "success": True,
        "message": "Competition created",
        "data": {
            "competition_id": "comp_123",
            "title": request.title,
        },
    }


@router.get("/list")
async def list_competitions(active_only: bool = False):
    """List all competitions"""
    return {
        "success": True,
        "competitions": [],
        "total": 0,
    }


@router.get("/{competition_id}")
async def get_competition(competition_id: str):
    """Get competition details"""
    raise HTTPException(status_code=404, detail="Competition not found")


@router.post("/{competition_id}/reset")
async def force_reset_leaderboard(competition_id: str):
    """Force reset weekly leaderboard"""
    return {
        "success": True,
        "message": "Leaderboard reset triggered",
    }


@router.get("/economy/config", response_model=EconomyTuning)
async def get_economy_config():
    """Get current SRS economy configuration"""
    return EconomyTuning()


@router.put("/economy/config")
async def update_economy_config(config: EconomyTuning):
    """
    Update SRS economy parameters
    
    Phase 5, Module 3: Economy Tuning (No Code Required)
    Dynamically adjust the SRS math without code deployment.
    """
    return {
        "success": True,
        "message": "Economy configuration updated",
        "data": config.dict(),
    }


@router.get("/alliance/config", response_model=AllianceConfig)
async def get_alliance_config():
    """Get alliance (referral) configuration"""
    return AllianceConfig()


@router.put("/alliance/config")
async def update_alliance_config(config: AllianceConfig):
    """
    Update alliance boost configuration
    
    Adjust the global referral bonus multiplier.
    """
    return {
        "success": True,
        "message": "Alliance configuration updated",
        "data": config.dict(),
    }


@router.get("/alliance/tree/{user_id}")
async def get_referral_tree(user_id: str):
    """
    Get referral tree for a user
    
    Visualizes the chain of inviters and invitees.
    Helps detect bot farms.
    """
    return {
        "success": True,
        "user_id": user_id,
        "tree": [],
        "total_referrals": 0,
    }
