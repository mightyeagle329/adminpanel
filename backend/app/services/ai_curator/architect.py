"""
Market Architect - Market Generation Logic
Phase 6, Module 2: The Binary Prism

Converts signals into structured binary market formats.
"""

import logging
import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import openai

from app.core.config import settings
from app.schemas.ai_curator import AIGeneratedMarketDraft
from app.schemas.market import MarketCategory, MarketBadge
from app.services.ai_curator.watchtower import Signal

logger = logging.getLogger(__name__)


class MarketArchitect:
    """
    The Architect - Market Generation Logic
    
    Converts raw signals into structured market proposals using:
    1. Template matching (Token Saver)
    2. Anti-manipulation filters (Anti-Rigging Shield)
    3. Binary formatting (Binary Prism)
    4. AI-powered question generation
    """
    
    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
        
        # Category mapping
        self.category_keywords = {
            MarketCategory.CRYPTO: ["bitcoin", "btc", "ethereum", "eth", "crypto", "token", "defi"],
            MarketCategory.FINANCE: ["stock", "fed", "rate", "inflation", "earnings", "market"],
            MarketCategory.SPORTS: ["football", "basketball", "nba", "nfl", "transfer", "match"],
            MarketCategory.HYPE: ["viral", "trending", "tiktok", "twitter", "social", "meme"],
            MarketCategory.GLOBAL: ["election", "politics", "court", "legal", "war", "crisis"],
        }
    
    async def generate_market_draft(self, signal: Signal) -> Optional[AIGeneratedMarketDraft]:
        """
        Generate a market draft from a signal
        
        Args:
            signal: Market generation signal
            
        Returns:
            AIGeneratedMarketDraft or None if filters reject
        """
        logger.info(f"Generating market draft for signal: {signal.signal_type}")
        
        # Step 1: Template Matching (Token Saver)
        if not self._passes_template_match(signal):
            logger.info("Signal rejected by template match")
            return None
        
        # Step 2: Anti-Rigging Shield
        if not self._passes_manipulation_check(signal):
            logger.info("Signal rejected by manipulation check")
            return None
        
        # Step 3: Generate question using AI
        question_data = await self._generate_question(signal)
        
        if not question_data:
            logger.warning("Failed to generate question")
            return None
        
        # Step 4: Create draft
        draft = AIGeneratedMarketDraft(
            draft_id=str(uuid.uuid4()),
            question=question_data["question"],
            category=self._determine_category(signal),
            sub_tag=question_data.get("sub_tag", ""),
            badge=self._determine_badge(signal),
            outcome_a_label=question_data["option_a"],
            outcome_b_label=question_data["option_b"],
            duration_hours=question_data.get("duration_hours", 24),
            resolution_source=question_data["resolution_source"],
            batch_id=question_data.get("batch_id", ""),
            image_prompt=question_data.get("image_prompt", ""),
            confidence_score=signal.confidence,
            trigger_data=signal.data,
            created_at=datetime.utcnow(),
            status="PENDING_APPROVAL",
        )
        
        logger.info(f"Draft created: {draft.question}")
        return draft
    
    def _passes_template_match(self, signal: Signal) -> bool:
        """Template matching filter (Token Saver)"""
        # For crypto price movements, use template
        if signal.signal_type == "PRICE_MOVEMENT":
            return True
        
        # For social trends, check if it matches known patterns
        if signal.signal_type == "SOCIAL_TREND":
            return True
        
        return False
    
    def _passes_manipulation_check(self, signal: Signal) -> bool:
        """Anti-manipulation filter"""
        # Liquidity rule: Check minimum volume
        if signal.signal_type == "PRICE_MOVEMENT":
            volume = signal.data.get("volume", 0)
            if volume < settings.MARKET_MIN_LIQUIDITY:
                logger.info(f"Signal rejected: volume too low ({volume} < {settings.MARKET_MIN_LIQUIDITY})")
                return False
        
        # Subjectivity rule: Ensure measurable outcomes
        # (In production, would check if resolution source is valid)
        
        return True
    
    async def _generate_question(self, signal: Signal) -> Optional[Dict[str, Any]]:
        """Generate question using AI"""
        
        if not self.client:
            # Fallback to template-based generation
            return self._template_question(signal)
        
        try:
            system_prompt = self._get_system_prompt()
            user_prompt = self._format_signal_for_ai(signal)
            
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.7,
                max_tokens=500,
            )
            
            result_text = response.choices[0].message.content
            return self._parse_ai_response(result_text, signal)
            
        except Exception as e:
            logger.error(f"Error generating question with AI: {e}")
            return self._template_question(signal)
    
    def _template_question(self, signal: Signal) -> Dict[str, Any]:
        """Template-based question generation (fallback)"""
        if signal.signal_type == "PRICE_MOVEMENT":
            asset = signal.data.get("asset", "BTC")
            price = signal.data.get("price", 0)
            change_pct = signal.data.get("change_pct", 0)
            
            direction = "break above" if change_pct > 0 else "fall below"
            threshold = price * 1.02 if change_pct > 0 else price * 0.98
            
            return {
                "question": f"Will {asset} {direction} ${threshold:.0f} within 24 hours?",
                "option_a": "YES",
                "option_b": "NO",
                "duration_hours": 24,
                "resolution_source": "https://www.binance.com/en/trade/BTC_USDT",
                "sub_tag": "Crypto Volatility",
                "batch_id": f"{asset}_PREDICT_{datetime.utcnow().strftime('%Y%m%d')}, {asset}_DIRECTIONAL",
                "image_prompt": f"3D render of {asset} coin with price chart, dramatic lighting",
            }
        
        return {
            "question": "Will a major market event occur in the next 24 hours?",
            "option_a": "YES",
            "option_b": "NO",
            "duration_hours": 24,
            "resolution_source": "https://www.reuters.com",
            "sub_tag": "General",
            "batch_id": "GENERAL_EVENT_" + datetime.utcnow().strftime('%Y%m%d'),
            "image_prompt": "Abstract market visualization",
        }
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for AI"""
        return """You are the Market Curator for Streak, a prediction market platform.

Convert the signal into a binary prediction market using this EXACT JSON format:

{
  "question": "Clear binary question with timeframe",
  "option_a": "YES or specific option",
  "option_b": "NO or opposite option",
  "duration_hours": 24,
  "resolution_source": "https://verifiable-source.com",
  "sub_tag": "Category chip",
  "batch_id": "ASSET_PREDICT_DATE, ASSET_DIRECTIONAL",
  "image_prompt": "Visual description for market banner"
}

Rules:
1. Question must be resolvable within 24 hours max
2. Must be binary (2 options only)
3. Must have verifiable proof source
4. Avoid subjective outcomes
5. Use measurable metrics only"""
    
    def _format_signal_for_ai(self, signal: Signal) -> str:
        """Format signal for AI prompt"""
        return f"""Signal Type: {signal.signal_type}
Category: {signal.category}
Source: {signal.source}
Data: {signal.data}
Confidence: {signal.confidence}

Generate a binary prediction market for this signal."""
    
    def _parse_ai_response(self, text: str, signal: Signal) -> Optional[Dict[str, Any]]:
        """Parse AI JSON response"""
        import json
        
        try:
            # Extract JSON from response
            start = text.find('{')
            end = text.rfind('}') + 1
            if start >= 0 and end > start:
                json_str = text[start:end]
                data = json.loads(json_str)
                return data
        except Exception as e:
            logger.error(f"Error parsing AI response: {e}")
        
        # Fallback to template
        return self._template_question(signal)
    
    def _determine_category(self, signal: Signal) -> MarketCategory:
        """Determine market category"""
        category_map = {
            "CRYPTO": MarketCategory.CRYPTO,
            "FINANCE": MarketCategory.FINANCE,
            "SPORTS": MarketCategory.SPORTS,
            "HYPE": MarketCategory.HYPE,
            "GLOBAL": MarketCategory.GLOBAL,
        }
        return category_map.get(signal.category, MarketCategory.CRYPTO)
    
    def _determine_badge(self, signal: Signal) -> MarketBadge:
        """Determine market badge"""
        if signal.signal_type == "PRICE_MOVEMENT":
            return MarketBadge.HOT
        elif signal.signal_type == "SOCIAL_TREND":
            return MarketBadge.VIRAL
        elif signal.signal_type == "BREAKING_NEWS":
            return MarketBadge.BREAKING
        
        return MarketBadge.NONE
