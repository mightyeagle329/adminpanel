"""
Lifecycle Manager - Time-based market management
Phase 6, Module 3: Dynamic Time Management

Manages market lifecycles for different timeframes:
- 15-minute markets (Flash, High Jump, Marathon)
- 30-minute markets (Climax, Duo)
- 1, 4, 12, 24-hour markets (Curator events)
"""

import logging
import asyncio
from typing import Dict, Any, List
from datetime import datetime, timedelta
import schedule

logger = logging.getLogger(__name__)


class LifecycleManager:
    """
    Lifecycle Manager - Time-based market orchestration
    
    Manages multiple state machines for different market durations.
    """
    
    def __init__(self):
        self.is_running = False
        self.active_markets: Dict[str, Dict[str, Any]] = {}
    
    async def start(self):
        """Start the lifecycle manager"""
        if self.is_running:
            return
        
        logger.info("⏱️ Starting Lifecycle Manager...")
        self.is_running = True
        
        # Start scheduler loop
        asyncio.create_task(self._run_scheduler())
        
        logger.info("✅ Lifecycle Manager started")
    
    async def stop(self):
        """Stop the lifecycle manager"""
        self.is_running = False
        logger.info("Lifecycle Manager stopped")
    
    async def _run_scheduler(self):
        """Run the scheduler loop"""
        # Schedule jobs for different timeframes
        
        # 15-minute markets: trigger every 15 minutes
        schedule.every(15).minutes.do(self._check_15m_markets)
        
        # 30-minute markets: trigger every 30 minutes
        schedule.every(30).minutes.do(self._check_30m_markets)
        
        # Hourly markets
        schedule.every().hour.do(self._check_1h_markets)
        
        # Daily counter reset
        schedule.every().day.at("00:00").do(self._reset_daily_counters)
        
        while self.is_running:
            try:
                schedule.run_pending()
                await asyncio.sleep(60)  # Check every minute
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}", exc_info=True)
                await asyncio.sleep(60)
    
    def _check_15m_markets(self):
        """Check and manage 15-minute markets"""
        logger.info("Checking 15-minute markets...")
        
        current_time = datetime.utcnow()
        
        # Check if it's on the 15-minute mark (:00, :15, :30, :45)
        if current_time.minute % 15 == 0:
            logger.info(f"15-minute trigger at {current_time.strftime('%H:%M')}")
            
            # Generate Flash markets (BTC and ETH)
            self._trigger_flash_market("BTC/USDT", current_time)
            self._trigger_flash_market("ETH/USDT", current_time)
            
            # Generate High Jump market (every 30 mins at :00 and :30)
            if current_time.minute % 30 == 0:
                self._trigger_high_jump_market(current_time)
            
            # Generate Marathon market (every 30 mins at :15 and :45)
            if current_time.minute % 30 == 15:
                self._trigger_marathon_market(current_time)
    
    def _check_30m_markets(self):
        """Check and manage 30-minute markets"""
        logger.info("Checking 30-minute markets...")
        
        current_time = datetime.utcnow()
        
        # Climax market (alternates between BTC and ETH)
        asset = "BTC/USDT" if current_time.minute == 0 else "ETH/USDT"
        self._trigger_climax_market(asset, current_time)
        
        # Duo market (opposite asset)
        duo_asset = "ETH/USDT" if current_time.minute == 0 else "BTC/USDT"
        self._trigger_duo_market(duo_asset, current_time)
    
    def _check_1h_markets(self):
        """Check and manage 1-hour markets"""
        logger.info("Checking 1-hour markets...")
        # TODO: Implement hourly market checks
    
    def _reset_daily_counters(self):
        """Reset daily counters"""
        logger.info("Resetting daily counters...")
        # TODO: Implement daily counter reset
    
    def _trigger_flash_market(self, asset: str, timestamp: datetime):
        """Trigger a Flash market (Green vs Red)"""
        market_id = f"flash_{asset.replace('/', '_')}_{timestamp.strftime('%Y%m%d_%H%M')}"
        
        logger.info(f"Triggering Flash market: {market_id}")
        
        self.active_markets[market_id] = {
            "type": "FLASH",
            "asset": asset,
            "start_time": timestamp,
            "end_time": timestamp + timedelta(minutes=15),
            "status": "OPEN",
        }
    
    def _trigger_high_jump_market(self, timestamp: datetime):
        """Trigger a High Jump market (BTC vs ETH peak)"""
        market_id = f"highjump_{timestamp.strftime('%Y%m%d_%H%M')}"
        
        logger.info(f"Triggering High Jump market: {market_id}")
        
        self.active_markets[market_id] = {
            "type": "HIGH_JUMP",
            "assets": ["BTC/USDT", "ETH/USDT"],
            "start_time": timestamp,
            "end_time": timestamp + timedelta(minutes=30),
            "status": "OPEN",
        }
    
    def _trigger_marathon_market(self, timestamp: datetime):
        """Trigger a Marathon market (BTC vs ETH close performance)"""
        market_id = f"marathon_{timestamp.strftime('%Y%m%d_%H%M')}"
        
        logger.info(f"Triggering Marathon market: {market_id}")
        
        self.active_markets[market_id] = {
            "type": "MARATHON",
            "assets": ["BTC/USDT", "ETH/USDT"],
            "start_time": timestamp,
            "end_time": timestamp + timedelta(minutes=30),
            "status": "OPEN",
        }
    
    def _trigger_climax_market(self, asset: str, timestamp: datetime):
        """Trigger a Climax market (First Half vs Second Half peak)"""
        market_id = f"climax_{asset.replace('/', '_')}_{timestamp.strftime('%Y%m%d_%H%M')}"
        
        logger.info(f"Triggering Climax market: {market_id}")
        
        self.active_markets[market_id] = {
            "type": "CLIMAX",
            "asset": asset,
            "start_time": timestamp,
            "end_time": timestamp + timedelta(minutes=30),
            "status": "OPEN",
        }
    
    def _trigger_duo_market(self, asset: str, timestamp: datetime):
        """Trigger a Duo market (Same vs Mixed consecutive candles)"""
        market_id = f"duo_{asset.replace('/', '_')}_{timestamp.strftime('%Y%m%d_%H%M')}"
        
        logger.info(f"Triggering Duo market: {market_id}")
        
        self.active_markets[market_id] = {
            "type": "DUO",
            "asset": asset,
            "start_time": timestamp,
            "end_time": timestamp + timedelta(minutes=30),
            "status": "OPEN",
        }
    
    def get_active_markets(self) -> List[Dict[str, Any]]:
        """Get list of active markets"""
        return list(self.active_markets.values())
