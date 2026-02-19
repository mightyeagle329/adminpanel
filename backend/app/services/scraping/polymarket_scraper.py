"""
Polymarket scraper service
"""

import logging
from typing import List
from datetime import datetime, timedelta
import httpx

from app.schemas.scraping import ScrapedPost, SourceType

logger = logging.getLogger(__name__)


class PolymarketScraper:
    """Polymarket scraper"""
    
    def __init__(self):
        self.base_url = "https://gamma-api.polymarket.com"
        self.topics = [
            {"name": "Crypto", "keywords": ["bitcoin", "ethereum", "crypto"]},
            {"name": "Politics", "keywords": ["election", "president", "politics"]},
            {"name": "Sports", "keywords": ["nfl", "nba", "football"]},
        ]
    
    async def scrape(self, days_back: int, max_items: int) -> List[ScrapedPost]:
        """Scrape Polymarket markets"""
        logger.info("Scraping Polymarket markets")
        
        posts = []
        cutoff_date = datetime.utcnow() - timedelta(days=days_back)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for topic in self.topics[:max_items]:
                try:
                    # Fetch markets (simplified - adjust based on actual API)
                    response = await client.get(
                        f"{self.base_url}/markets",
                        params={
                            "limit": min(20, max_items),
                            "active": True,
                        }
                    )
                    
                    if response.status_code != 200:
                        logger.warning(f"Failed to fetch Polymarket markets: {response.status_code}")
                        continue
                    
                    data = response.json()
                    markets = data if isinstance(data, list) else data.get("markets", [])
                    
                    for market in markets[:min(10, max_items)]:
                        try:
                            # Parse market data
                            end_date = datetime.fromisoformat(
                                market.get("end_date_iso", datetime.utcnow().isoformat()).replace('Z', '+00:00')
                            )
                            
                            post = ScrapedPost(
                                id=f"polymarket_{market.get('id', hash(market.get('question', '')))}",
                                source=SourceType.POLYMARKET,
                                source_id=topic["name"],
                                source_name=f"Polymarket - {topic['name']}",
                                title=market.get("question", "No title"),
                                text=market.get("description", market.get("question", "")),
                                date_iso=datetime.utcnow(),
                                url=f"https://polymarket.com/event/{market.get('slug', '')}",
                                metadata={
                                    "volume": market.get("volume", 0),
                                    "end_date": end_date.isoformat(),
                                    "active": market.get("active", False),
                                },
                            )
                            posts.append(post)
                            
                        except Exception as e:
                            logger.error(f"Error parsing Polymarket market: {e}")
                    
                except Exception as e:
                    logger.error(f"Error scraping Polymarket topic {topic['name']}: {e}")
        
        logger.info(f"Scraped {len(posts)} Polymarket posts")
        return posts
