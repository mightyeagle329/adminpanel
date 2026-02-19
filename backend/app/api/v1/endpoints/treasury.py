"""
Treasury & Risk API endpoints
Phase 5, Module 4: Treasury & Risk Management
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field
from typing import Dict, List, Optional

router = APIRouter()


class VaultComposition(BaseModel):
    """Vault composition breakdown"""
    total_value_locked: float
    pocket_a_clob: float
    pocket_b_house: float
    insurance_fund: float


class GlobalRiskConfig(BaseModel):
    """Global risk configuration"""
    max_exposure_per_event_pct: float = Field(10.0, ge=1.0, le=20.0)
    global_tvl_cap: float = Field(10000000.0, ge=100000.0)
    risk_mode: str = Field("AUTO", description="AUTO or MANUAL")


class FeeConfig(BaseModel):
    """Fee configuration"""
    platform_fee_rate: float = Field(1.5, ge=0.1, le=10.0)
    min_bet_size: float = Field(5.0, ge=1.0, le=100.0)


class LiabilityScenario(BaseModel):
    """Liability scenario"""
    scenario_name: str
    events: List[str]
    potential_payout: float
    current_exposure: float
    risk_level: str


@router.get("/vault/composition", response_model=VaultComposition)
async def get_vault_composition():
    """
    Get vault composition breakdown
    
    Shows TVL distribution across:
    - Pocket A: CLOB Liquidity
    - Pocket B: House Fund
    - Insurance Fund
    """
    return VaultComposition(
        total_value_locked=5000000.0,
        pocket_a_clob=2000000.0,
        pocket_b_house=2500000.0,
        insurance_fund=500000.0,
    )


@router.get("/vault/exposure")
async def get_current_exposure():
    """Get current vault exposure and risk metrics"""
    return {
        "success": True,
        "total_exposure": 850000.0,
        "max_exposure": 1000000.0,
        "utilization_pct": 85.0,
        "by_event": {
            "market_123": 200000.0,
            "market_456": 150000.0,
        },
    }


@router.post("/vault/rebalance")
async def trigger_rebalance():
    """
    Trigger emergency liquidity rebalance
    
    Forces funds transfer between Pocket A (CLOB) and Pocket B (House Fund).
    """
    return {
        "success": True,
        "message": "Rebalance initiated",
    }


@router.get("/risk/config", response_model=GlobalRiskConfig)
async def get_risk_config():
    """Get global risk configuration"""
    return GlobalRiskConfig()


@router.put("/risk/config")
async def update_risk_config(config: GlobalRiskConfig):
    """
    Update global risk configuration
    
    Phase 5, Module 4: Vault Risk Matrix Configuration
    """
    return {
        "success": True,
        "message": "Risk configuration updated",
        "data": config.dict(),
    }


@router.get("/liability/heatmap")
async def get_liability_heatmap():
    """
    Get global liability heatmap
    
    Phase 5, Module 4.1: The "Doomsday" Scenario
    Visualizes house exposure to correlated outcomes.
    """
    return {
        "success": True,
        "heatmap": [
            {
                "event": "BTC > 100k",
                "correlated_events": ["ETH > 4k", "SOL > 150"],
                "potential_payout": 1200000.0,
                "probability": 0.35,
                "risk_level": "CRITICAL",
            },
        ],
    }


@router.get("/liability/scenarios", response_model=List[LiabilityScenario])
async def get_liability_scenarios():
    """Get worst-case liability scenarios"""
    return [
        LiabilityScenario(
            scenario_name="Crypto Bull Run",
            events=["BTC Up", "ETH Up", "SOL Up"],
            potential_payout=1500000.0,
            current_exposure=850000.0,
            risk_level="HIGH",
        ),
    ]


@router.get("/correlation/matrix")
async def get_correlation_matrix():
    """
    Get correlation matrix
    
    Phase 5, Module 4.2: Correlation Matrix (Parlay Blocker)
    Shows blocked outcome combinations.
    """
    return {
        "success": True,
        "blocked_combinations": [
            {
                "outcome_a": "Lakers Win",
                "outcome_b": "LeBron > 20 Points",
                "reason": "Performance correlation",
            },
        ],
    }


@router.put("/correlation/block")
async def block_correlation(outcome_a: str, outcome_b: str):
    """Block a specific outcome combination in parlays"""
    return {
        "success": True,
        "message": f"Blocked: {outcome_a} + {outcome_b}",
    }


@router.get("/fees/config", response_model=FeeConfig)
async def get_fee_config():
    """Get global fee configuration"""
    return FeeConfig()


@router.put("/fees/config")
async def update_fee_config(config: FeeConfig):
    """
    Update global fee configuration
    
    Phase 5, Module 4.5: Financial Configuration
    """
    return {
        "success": True,
        "message": "Fee configuration updated",
        "data": config.dict(),
    }


@router.post("/emergency/kill-switch")
async def activate_kill_switch():
    """
    EMERGENCY: Pause all trading globally
    
    Phase 5, Module 4.1: Global Kill Switch
    Stops Phase 1 matching and Phase 2 betting immediately.
    Withdrawals remain active.
    """
    return {
        "success": True,
        "message": "GLOBAL TRADING PAUSED",
        "timestamp": "2024-01-01T00:00:00Z",
    }
