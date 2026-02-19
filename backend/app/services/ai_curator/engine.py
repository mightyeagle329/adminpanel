"""
AI Curator Engine - Main orchestration
Phase 6: Autonomous market generation system
"""

import logging
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

from app.core.config import settings
from app.schemas.ai_curator import (
    AICuratorConfig,
    AICuratorStatus,
    AIMode,
    AIGeneratedMarketDraft,
)
from app.services.ai_curator.watchtower import Watchtower
from app.services.ai_curator.architect import MarketArchitect
from app.services.ai_curator.judge import MarketJudge
from app.services.ai_curator.lifecycle_manager import LifecycleManager

logger = logging.getLogger(__name__)


class AICuratorEngine:
    """
    AI Curator Engine - The Content Factory
    
    Autonomous agent that listens to external data sources and converts
    them into binary market formats.
    
    Components:
    - Watchtower: Data ingestion from multiple sources
    - Architect: Market generation logic
    - Judge: Settlement and resolution logic
    - Lifecycle Manager: Time-based market management
    """
    
    def __init__(self):
        self.config = AICuratorConfig()
        self.is_running = False
        self.last_execution: Optional[datetime] = None
        self.markets_created_today = 0
        self.pending_drafts: List[AIGeneratedMarketDraft] = []
        
        # Initialize components
        self.watchtower = Watchtower()
        self.architect = MarketArchitect()
        self.judge = MarketJudge()
        self.lifecycle_manager = LifecycleManager()
        
        # Background task
        self._task: Optional[asyncio.Task] = None
    
    async def start(self):
        """Start the AI Curator Engine"""
        if self.is_running:
            logger.warning("AI Curator Engine is already running")
            return
        
        logger.info("🤖 Starting AI Curator Engine...")
        self.is_running = True
        
        # Start components
        await self.watchtower.start()
        await self.lifecycle_manager.start()
        
        # Start main loop
        self._task = asyncio.create_task(self._run_loop())
        
        logger.info("✅ AI Curator Engine started successfully")
    
    async def stop(self):
        """Stop the AI Curator Engine"""
        if not self.is_running:
            return
        
        logger.info("🛑 Stopping AI Curator Engine...")
        self.is_running = False
        
        # Cancel main loop
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        
        # Stop components
        await self.watchtower.stop()
        await self.lifecycle_manager.stop()
        
        logger.info("✅ AI Curator Engine stopped")
    
    async def _run_loop(self):
        """Main execution loop"""
        logger.info(f"AI Curator loop started (interval: {self.config.interval_seconds}s)")
        
        while self.is_running:
            try:
                await self._execute_cycle()
                await asyncio.sleep(self.config.interval_seconds)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in AI Curator loop: {e}", exc_info=True)
                await asyncio.sleep(60)  # Wait before retry
    
    async def _execute_cycle(self):
        """Execute one cycle of market generation"""
        logger.info("🔄 Executing AI Curator cycle...")
        
        self.last_execution = datetime.utcnow()
        
        # Check if we've hit the hourly limit
        if self.markets_created_today >= self.config.max_markets_per_hour:
            logger.info(f"Market creation limit reached: {self.markets_created_today}/{self.config.max_markets_per_hour}")
            return
        
        # 1. Get signals from Watchtower
        signals = await self.watchtower.get_signals()
        
        if not signals:
            logger.info("No signals detected in this cycle")
            return
        
        logger.info(f"Received {len(signals)} signals from Watchtower")
        
        # 2. Generate market drafts using Architect
        for signal in signals[:5]:  # Process up to 5 signals per cycle
            try:
                draft = await self.architect.generate_market_draft(signal)
                
                if draft:
                    self.pending_drafts.append(draft)
                    self.markets_created_today += 1
                    
                    logger.info(f"Created market draft: {draft.question}")
                    
                    # Auto-publish if in FULL_CONTROL mode
                    if self.config.mode == AIMode.FULL_CONTROL and self.config.auto_publish:
                        await self._publish_draft(draft)
                    else:
                        logger.info(f"Draft pending admin approval: {draft.draft_id}")
                
            except Exception as e:
                logger.error(f"Error generating market draft: {e}", exc_info=True)
        
        logger.info(f"✅ Cycle complete. Pending drafts: {len(self.pending_drafts)}")
    
    async def _publish_draft(self, draft: AIGeneratedMarketDraft):
        """Publish a market draft (auto-publish in FULL_CONTROL mode)"""
        logger.info(f"Auto-publishing market: {draft.question}")
        
        try:
            # TODO: Send to Rust backend for actual market creation
            # For now, just log
            logger.info(f"Market published: {draft.draft_id}")
            
            # Remove from pending drafts
            self.pending_drafts = [d for d in self.pending_drafts if d.draft_id != draft.draft_id]
            
        except Exception as e:
            logger.error(f"Error publishing draft: {e}", exc_info=True)
    
    def get_status(self) -> AICuratorStatus:
        """Get current status"""
        return AICuratorStatus(
            enabled=self.config.enabled,
            mode=self.config.mode,
            is_running=self.is_running,
            last_execution=self.last_execution,
            markets_created_today=self.markets_created_today,
            markets_pending_approval=len(self.pending_drafts),
            next_execution=self.last_execution + timedelta(seconds=self.config.interval_seconds) if self.last_execution else None,
        )
    
    def get_pending_drafts(self) -> List[AIGeneratedMarketDraft]:
        """Get pending market drafts awaiting approval"""
        return self.pending_drafts
    
    async def approve_draft(self, draft_id: str, modifications: Optional[Dict[str, Any]] = None) -> bool:
        """Approve and publish a market draft"""
        draft = next((d for d in self.pending_drafts if d.draft_id == draft_id), None)
        
        if not draft:
            logger.warning(f"Draft not found: {draft_id}")
            return False
        
        # Apply modifications if provided
        if modifications:
            logger.info(f"Applying modifications to draft {draft_id}: {modifications}")
            # TODO: Apply modifications to draft
        
        # Publish the draft
        await self._publish_draft(draft)
        
        return True
    
    async def reject_draft(self, draft_id: str) -> bool:
        """Reject a market draft"""
        self.pending_drafts = [d for d in self.pending_drafts if d.draft_id != draft_id]
        logger.info(f"Draft rejected: {draft_id}")
        return True
    
    def update_config(self, config: AICuratorConfig):
        """Update AI Curator configuration"""
        self.config = config
        logger.info(f"Configuration updated: mode={config.mode}, interval={config.interval_seconds}s")
    
    def reset_daily_counter(self):
        """Reset the daily market creation counter"""
        self.markets_created_today = 0
        logger.info("Daily market counter reset")
