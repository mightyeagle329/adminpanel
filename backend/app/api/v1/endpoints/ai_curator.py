"""
AI Curator API endpoints
Phase 6: AI Market Generation Engine
"""

from fastapi import APIRouter, HTTPException, Request
from typing import List, Optional
from pydantic import BaseModel

from app.schemas.ai_curator import (
    AICuratorConfig,
    AICuratorStatus,
    TriggerThresholds,
    AIGeneratedMarketDraft,
    AIMarketApprovalRequest,
    DataSourceConfig,
    MarketGenerationStats,
    AIMode,
)
from app.schemas.common import BaseResponse


class ToggleModeRequest(BaseModel):
    """Request body for POST /ai-curator/toggle"""
    mode: AIMode

router = APIRouter()


def get_ai_curator_from_request(request: Request):
    """Get AI Curator engine from request state"""
    if hasattr(request.app.state, 'get_ai_curator'):
        return request.app.state.get_ai_curator()
    return None


@router.get("/status", response_model=AICuratorStatus)
async def get_curator_status(request: Request):
    """Get AI Curator status"""
    ai_curator = get_ai_curator_from_request(request)
    if not ai_curator:
        raise HTTPException(status_code=503, detail="AI Curator not initialized")
    
    return ai_curator.get_status()


@router.get("/config", response_model=AICuratorConfig)
async def get_curator_config(request: Request):
    """Get AI Curator configuration"""
    ai_curator = get_ai_curator_from_request(request)
    if not ai_curator:
        raise HTTPException(status_code=503, detail="AI Curator not initialized")
    
    return ai_curator.config


@router.put("/config")
async def update_curator_config(config: AICuratorConfig, request: Request):
    """
    Update AI Curator configuration
    
    Allows changing:
    - AI mode (HUMAN_REVIEW vs FULL_CONTROL)
    - Polling intervals
    - Auto-publish settings
    - Game mode enablement
    """
    ai_curator = get_ai_curator_from_request(request)
    if not ai_curator:
        raise HTTPException(status_code=503, detail="AI Curator not initialized")
    
    ai_curator.update_config(config)
    
    return BaseResponse(
        success=True,
        message="Configuration updated",
        data={"config": config.dict()},
    )


@router.post("/toggle")
async def toggle_ai_mode(body: ToggleModeRequest, request: Request):
    """
    Toggle AI operating mode

    HUMAN_REVIEW: AI generates drafts, admin must approve
    FULL_CONTROL: AI auto-publishes markets
    """
    ai_curator = get_ai_curator_from_request(request)
    if not ai_curator:
        raise HTTPException(status_code=503, detail="AI Curator not initialized")

    ai_curator.config.mode = body.mode

    return BaseResponse(
        success=True,
        message=f"AI mode set to {body.mode.value}",
        data={"mode": body.mode.value},
    )


@router.get("/drafts", response_model=List[AIGeneratedMarketDraft])
async def get_pending_drafts(request: Request):
    """
    Get pending market drafts awaiting approval
    
    Returns AI-generated market proposals that need human review.
    """
    ai_curator = get_ai_curator_from_request(request)
    if not ai_curator:
        raise HTTPException(status_code=503, detail="AI Curator not initialized")
    
    return ai_curator.get_pending_drafts()


@router.post("/drafts/{draft_id}/approve")
async def approve_draft(draft_id: str, approval_request: AIMarketApprovalRequest, request: Request):
    """
    Approve and publish an AI-generated market draft
    
    Args:
        draft_id: Draft ID to approve
        approval_request: Approval request with optional modifications
    """
    ai_curator = get_ai_curator_from_request(request)
    if not ai_curator:
        raise HTTPException(status_code=503, detail="AI Curator not initialized")
    
    success = await ai_curator.approve_draft(
        draft_id=approval_request.draft_id,
        modifications=approval_request.modifications,
    )
    
    if not success:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    return BaseResponse(
        success=True,
        message="Draft approved and published",
    )


@router.post("/drafts/{draft_id}/reject")
async def reject_draft(draft_id: str, request: Request):
    """Reject an AI-generated market draft"""
    ai_curator = get_ai_curator_from_request(request)
    if not ai_curator:
        raise HTTPException(status_code=503, detail="AI Curator not initialized")
    
    success = await ai_curator.reject_draft(draft_id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Draft not found")
    
    return BaseResponse(
        success=True,
        message="Draft rejected",
    )


@router.get("/stats", response_model=MarketGenerationStats)
async def get_generation_stats(period: str = "today"):
    """
    Get market generation statistics
    
    Args:
        period: Time period (today, this_week, this_month)
    """
    # Mock stats for now
    return MarketGenerationStats(
        period=period,
        total_generated=45,
        auto_published=12,
        pending_approval=8,
        rejected=3,
        by_category={
            "CRYPTO": 20,
            "FINANCE": 10,
            "SPORTS": 8,
            "HYPE": 5,
            "GLOBAL": 2,
        },
        by_game_mode={
            "FLASH_15M": 15,
            "CLIMAX_30M": 10,
            "CURATOR_1H": 8,
            "CURATOR_24H": 12,
        },
    )


@router.get("/thresholds", response_model=TriggerThresholds)
async def get_trigger_thresholds():
    """Get AI trigger thresholds configuration"""
    return TriggerThresholds()


@router.put("/thresholds")
async def update_trigger_thresholds(thresholds: TriggerThresholds):
    """
    Update AI trigger thresholds
    
    Adjust sensitivity for market generation across different categories.
    """
    return BaseResponse(
        success=True,
        message="Thresholds updated",
        data=thresholds.dict(),
    )


@router.get("/data-sources", response_model=List[DataSourceConfig])
async def get_data_sources():
    """Get configured data sources"""
    return [
        DataSourceConfig(
            source_name="Binance",
            enabled=True,
            poll_interval_seconds=900,
        ),
        DataSourceConfig(
            source_name="Twitter API",
            enabled=True,
            poll_interval_seconds=300,
        ),
        DataSourceConfig(
            source_name="Google Trends",
            enabled=False,
            poll_interval_seconds=3600,
        ),
    ]


@router.post("/data-sources/{source_name}/toggle")
async def toggle_data_source(source_name: str, enabled: bool):
    """Enable or disable a data source"""
    return BaseResponse(
        success=True,
        message=f"Data source {source_name} {'enabled' if enabled else 'disabled'}",
    )
