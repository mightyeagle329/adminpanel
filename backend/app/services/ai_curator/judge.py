"""
Market Judge - Settlement Logic
Phase 6, Module 3: The Judge

Handles market resolution and proof verification.
"""

import logging
from typing import Dict, Any, Optional
from datetime import datetime
import httpx
import ccxt

from app.core.config import settings

logger = logging.getLogger(__name__)


class MarketJudge:
    """
    The Judge - Settlement and Resolution Logic
    
    Responsibilities:
    - Flash markets: Close vs Open price verification
    - Climax markets: High timestamp detection
    - Duo markets: Consecutive candle color matching
    - Event markets: External proof verification
    - Oracle bypass: Implied probability validation
    """
    
    def __init__(self):
        self.exchange: Optional[ccxt.Exchange] = None
        
        try:
            self.exchange = ccxt.binance({
                'apiKey': settings.BINANCE_API_KEY,
                'secret': settings.BINANCE_API_SECRET,
                'enableRateLimit': True,
            })
        except Exception as e:
            logger.warning(f"Failed to initialize exchange: {e}")
    
    async def resolve_flash_market(
        self,
        asset: str,
        timeframe_start: datetime,
        timeframe_end: datetime,
    ) -> Dict[str, Any]:
        """
        Resolve FLASH market (Green vs Red candle)
        
        Args:
            asset: Trading pair (e.g., 'BTC/USDT')
            timeframe_start: Candle start time
            timeframe_end: Candle end time
            
        Returns:
            Resolution data with winning outcome
        """
        logger.info(f"Resolving FLASH market: {asset} [{timeframe_start} - {timeframe_end}]")
        
        if not self.exchange:
            return {"error": "Exchange not initialized"}
        
        try:
            # Fetch OHLCV data for the specific timeframe
            since = int(timeframe_start.timestamp() * 1000)
            ohlcv = await self._fetch_ohlcv(asset, '15m', since, limit=1)
            
            if not ohlcv:
                return {"error": "No candle data found"}
            
            candle = ohlcv[0]
            open_price = candle[1]
            close_price = candle[4]
            
            # Determine outcome (with epsilon check)
            tick_size = 0.01  # Minimum price movement
            if abs(close_price - open_price) < tick_size:
                outcome = "VOID"  # Refund - too close
                logger.info("Market VOID: Price difference < tick size")
            elif close_price > open_price:
                outcome = "GREEN"
                logger.info(f"Market resolved: GREEN (Open: {open_price}, Close: {close_price})")
            else:
                outcome = "RED"
                logger.info(f"Market resolved: RED (Open: {open_price}, Close: {close_price})")
            
            return {
                "outcome": outcome,
                "open_price": open_price,
                "close_price": close_price,
                "change_pct": ((close_price - open_price) / open_price) * 100,
                "proof_url": f"https://www.binance.com/en/trade/{asset.replace('/', '_')}",
                "timestamp_checked": datetime.utcnow().isoformat(),
            }
        
        except Exception as e:
            logger.error(f"Error resolving FLASH market: {e}", exc_info=True)
            return {"error": str(e)}
    
    async def resolve_climax_market(
        self,
        asset: str,
        timeframe_start: datetime,
        timeframe_end: datetime,
    ) -> Dict[str, Any]:
        """
        Resolve CLIMAX market (First Half vs Second Half peak timing)
        
        Args:
            asset: Trading pair
            timeframe_start: 30m candle start
            timeframe_end: 30m candle end
            
        Returns:
            Resolution data indicating which half hit the peak
        """
        logger.info(f"Resolving CLIMAX market: {asset}")
        
        if not self.exchange:
            return {"error": "Exchange not initialized"}
        
        try:
            # Fetch two 15m candles that make up the 30m period
            since = int(timeframe_start.timestamp() * 1000)
            ohlcv = await self._fetch_ohlcv(asset, '15m', since, limit=2)
            
            if len(ohlcv) < 2:
                return {"error": "Insufficient candle data"}
            
            first_half_high = ohlcv[0][2]  # High of first 15m
            second_half_high = ohlcv[1][2]  # High of second 15m
            
            if first_half_high >= second_half_high:
                outcome = "FIRST_HALF"
                logger.info(f"CLIMAX resolved: FIRST_HALF (High: {first_half_high})")
            else:
                outcome = "SECOND_HALF"
                logger.info(f"CLIMAX resolved: SECOND_HALF (High: {second_half_high})")
            
            return {
                "outcome": outcome,
                "first_half_high": first_half_high,
                "second_half_high": second_half_high,
                "proof_url": f"https://www.binance.com/en/trade/{asset.replace('/', '_')}",
                "timestamp_checked": datetime.utcnow().isoformat(),
            }
        
        except Exception as e:
            logger.error(f"Error resolving CLIMAX market: {e}", exc_info=True)
            return {"error": str(e)}
    
    async def resolve_duo_market(
        self,
        asset: str,
        timeframe_start: datetime,
    ) -> Dict[str, Any]:
        """
        Resolve DUO market (Same vs Mixed consecutive candle colors)
        
        Args:
            asset: Trading pair
            timeframe_start: Start of first candle
            
        Returns:
            Resolution data indicating SAME or MIXED
        """
        logger.info(f"Resolving DUO market: {asset}")
        
        if not self.exchange:
            return {"error": "Exchange not initialized"}
        
        try:
            # Fetch two consecutive 15m candles
            since = int(timeframe_start.timestamp() * 1000)
            ohlcv = await self._fetch_ohlcv(asset, '15m', since, limit=2)
            
            if len(ohlcv) < 2:
                return {"error": "Insufficient candle data"}
            
            # Determine colors
            candle1_open = ohlcv[0][1]
            candle1_close = ohlcv[0][4]
            candle2_open = ohlcv[1][1]
            candle2_close = ohlcv[1][4]
            
            color1 = "GREEN" if candle1_close > candle1_open else "RED"
            color2 = "GREEN" if candle2_close > candle2_open else "RED"
            
            if color1 == color2:
                outcome = "SAME"
                logger.info(f"DUO resolved: SAME ({color1} + {color2})")
            else:
                outcome = "MIXED"
                logger.info(f"DUO resolved: MIXED ({color1} + {color2})")
            
            return {
                "outcome": outcome,
                "candle1_color": color1,
                "candle2_color": color2,
                "proof_url": f"https://www.binance.com/en/trade/{asset.replace('/', '_')}",
                "timestamp_checked": datetime.utcnow().isoformat(),
            }
        
        except Exception as e:
            logger.error(f"Error resolving DUO market: {e}", exc_info=True)
            return {"error": str(e)}
    
    async def verify_external_proof(
        self,
        proof_url: str,
        expected_outcome: str,
    ) -> Dict[str, Any]:
        """
        Verify external proof for event markets
        
        Args:
            proof_url: URL to verification source
            expected_outcome: Expected outcome based on AI analysis
            
        Returns:
            Verification result
        """
        logger.info(f"Verifying external proof: {proof_url}")
        
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(proof_url)
                
                if response.status_code != 200:
                    return {
                        "verified": False,
                        "error": f"HTTP {response.status_code}",
                    }
                
                # In production: parse HTML/JSON to verify outcome
                # For now: return mock verification
                
                return {
                    "verified": True,
                    "outcome": expected_outcome,
                    "proof_url": proof_url,
                    "timestamp_checked": datetime.utcnow().isoformat(),
                }
        
        except Exception as e:
            logger.error(f"Error verifying external proof: {e}", exc_info=True)
            return {
                "verified": False,
                "error": str(e),
            }
    
    async def _fetch_ohlcv(
        self,
        symbol: str,
        timeframe: str,
        since: int,
        limit: int = 1,
    ) -> list:
        """Fetch OHLCV data from exchange"""
        try:
            import asyncio
            ohlcv = await asyncio.to_thread(
                self.exchange.fetch_ohlcv,
                symbol,
                timeframe,
                since,
                limit
            )
            return ohlcv
        except Exception as e:
            logger.error(f"Error fetching OHLCV: {e}")
            return []
