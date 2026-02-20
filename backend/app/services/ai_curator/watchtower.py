"""
Watchtower - Data Ingestion Module
Phase 6, Module 1: The Intelligence Layer

Listens to external data sources and detects signals for market generation.
"""

import logging
import asyncio
import random
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import httpx
import ccxt

from app.core.config import settings

logger = logging.getLogger(__name__)


class Signal:
    """Market generation signal"""
    def __init__(
        self,
        signal_type: str,
        category: str,
        data: Dict[str, Any],
        confidence: float,
        source: str,
        timestamp: datetime,
    ):
        self.signal_type = signal_type
        self.category = category
        self.data = data
        self.confidence = confidence
        self.source = source
        self.timestamp = timestamp


class Watchtower:
    """
    The Watchtower - Central data aggregation unit
    
    Listens to:
    - Crypto: Binance, CoinGecko, LunarCrush, Whale Alert
    - Finance: Economic calendars, stock data
    - Sports: SportRadar, Twitter journalists
    - Hype: TikTok, Google Trends, Twitter
    - Global: AP News, Reuters, court feeds
    """
    
    def __init__(self):
        self.is_running = False
        self.signals: List[Signal] = []
        self.exchange: Optional[ccxt.Exchange] = None
        
        # Initialize exchange (Binance)
        try:
            self.exchange = ccxt.binance({
                'apiKey': settings.BINANCE_API_KEY,
                'secret': settings.BINANCE_API_SECRET,
                'enableRateLimit': True,
            })
        except Exception as e:
            logger.warning(f"Failed to initialize Binance exchange: {e}")
    
    async def start(self):
        """Start the Watchtower"""
        if self.is_running:
            return
        
        logger.info("👁️ Starting Watchtower...")
        self.is_running = True
        
        # Start background monitoring tasks
        asyncio.create_task(self._monitor_crypto())
        asyncio.create_task(self._monitor_social())
        
        logger.info("✅ Watchtower started")
    
    async def stop(self):
        """Stop the Watchtower"""
        self.is_running = False
        logger.info("Watchtower stopped")
    
    async def get_signals(self) -> List[Signal]:
        """Get accumulated signals and clear the buffer"""
        signals = self.signals.copy()
        self.signals = []
        return signals
    
    async def _monitor_crypto(self):
        """Monitor crypto sources (15-minute cycle)"""
        while self.is_running:
            try:
                await self._check_crypto_signals()
                await asyncio.sleep(900)  # 15 minutes
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in crypto monitoring: {e}", exc_info=True)
                await asyncio.sleep(60)
    
    async def _monitor_social(self):
        """Monitor social sources (5-minute cycle)"""
        while self.is_running:
            try:
                await self._check_social_signals()
                await asyncio.sleep(300)  # 5 minutes
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in social monitoring: {e}", exc_info=True)
                await asyncio.sleep(60)
    
    async def _check_crypto_signals(self):
        """Check crypto data sources for signals"""
        logger.info("Checking crypto signals...")
        
        # Check BTC/ETH price movements
        try:
            if self.exchange:
                # Get BTC and ETH ticker data
                btc_ticker = await asyncio.to_thread(self.exchange.fetch_ticker, 'BTC/USDT')
                eth_ticker = await asyncio.to_thread(self.exchange.fetch_ticker, 'ETH/USDT')
                
                # Check for significant moves
                if btc_ticker['percentage'] and abs(btc_ticker['percentage']) > 3.0:
                    signal = Signal(
                        signal_type="PRICE_MOVEMENT",
                        category="CRYPTO",
                        data={
                            "asset": "BTC",
                            "price": btc_ticker['last'],
                            "change_pct": btc_ticker['percentage'],
                            "volume": btc_ticker['quoteVolume'],
                        },
                        confidence=0.8,
                        source="Binance",
                        timestamp=datetime.utcnow(),
                    )
                    self.signals.append(signal)
                    logger.info(f"Signal detected: BTC movement {btc_ticker['percentage']:.2f}%")
                
                if eth_ticker['percentage'] and abs(eth_ticker['percentage']) > 3.0:
                    signal = Signal(
                        signal_type="PRICE_MOVEMENT",
                        category="CRYPTO",
                        data={
                            "asset": "ETH",
                            "price": eth_ticker['last'],
                            "change_pct": eth_ticker['percentage'],
                            "volume": eth_ticker['quoteVolume'],
                        },
                        confidence=0.8,
                        source="Binance",
                        timestamp=datetime.utcnow(),
                    )
                    self.signals.append(signal)
                    logger.info(f"Signal detected: ETH movement {eth_ticker['percentage']:.2f}%")
        
        except Exception as e:
            logger.error(f"Error checking crypto signals: {e}")
    
    async def _check_social_signals(self):
        """
        Check social media sources for signals.

        CURRENTLY MOCK ONLY: No real Twitter/TikTok/Google Trends API is called.
        This adds a fake SOCIAL_TREND (HYPE) signal so the AI Curator pipeline
        can be tested. Real integration would use Twitter API, TikTok, etc.
        """
        logger.info("Checking social signals...")
        
        try:
            # MOCK: Add at most one social signal per run, and only if buffer is low,
            # so you don't get the same "Will a major market event occur?" draft every 5 min.
            if len(self.signals) >= 2:
                return
            topics = ("Crypto Trading", "Bitcoin ETF", "Fed rates", "Ethereum upgrade", "Meme coins")
            signal = Signal(
                signal_type="SOCIAL_TREND",
                category="HYPE",
                data={
                    "topic": random.choice(topics),
                    "mentions": random.randint(8000, 25000),
                    "growth_rate": round(random.uniform(2.0, 5.0), 1),
                    "platform": "Twitter",
                },
                confidence=round(0.5 + random.random() * 0.2, 2),
                source="Twitter API (mock)",
                timestamp=datetime.utcnow(),
            )
            self.signals.append(signal)
            logger.info("Signal detected: Social trend (mock)")
        except Exception as e:
            logger.error(f"Error checking social signals: {e}")
    
    async def _check_finance_signals(self):
        """Check finance data sources"""
        # TODO: Implement economic calendar checking
        # - Investing.com API
        # - Bloomberg Terminal API
        # - Fed announcements
        pass
    
    async def _check_sports_signals(self):
        """Check sports data sources"""
        # TODO: Implement sports monitoring
        # - SportRadar API
        # - Twitter journalist tracking
        # - Official club statements
        pass
    
    async def _check_global_signals(self):
        """Check global news sources"""
        # TODO: Implement news monitoring
        # - AP News API
        # - Reuters API
        # - SEC filings
        pass
