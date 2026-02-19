"""
Scraping orchestrator
Coordinates scraping from multiple sources
"""

import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio

from app.schemas.scraping import SourceType, ScrapedPost, ScrapeProgress
from app.services.scraping.twitter_scraper import TwitterScraper
from app.services.scraping.rss_scraper import RSSScraper
from app.services.scraping.polymarket_scraper import PolymarketScraper

logger = logging.getLogger(__name__)


class ScrapingOrchestrator:
    """Orchestrates scraping from multiple sources"""
    
    def __init__(self):
        self.twitter_scraper = TwitterScraper()
        self.rss_scraper = RSSScraper()
        self.polymarket_scraper = PolymarketScraper()
        
        self.progress = ScrapeProgress(
            status="idle",
            progress=0,
            current_source=None,
            message=None,
            stats=None,
        )
        
        self.posts: List[ScrapedPost] = []
    
    async def scrape_all(
        self,
        sources: Optional[List[SourceType]] = None,
        days_back: int = 2,
        max_items_per_source: int = 100,
    ) -> Dict[str, Any]:
        """
        Scrape from all specified sources
        
        Args:
            sources: List of sources to scrape, or None for all
            days_back: Number of days to look back
            max_items_per_source: Maximum items per source
            
        Returns:
            Dictionary with scraping results and stats
        """
        logger.info(f"Starting scraping operation: sources={sources}, days_back={days_back}")
        
        self.progress.status = "scraping"
        self.progress.progress = 0
        self.posts = []
        
        # Determine which sources to scrape
        if sources is None:
            sources = [SourceType.TWITTER, SourceType.RSS, SourceType.POLYMARKET]
        
        stats = {source.value: 0 for source in sources}
        errors = []
        
        total_sources = len(sources)
        
        for idx, source in enumerate(sources):
            try:
                self.progress.current_source = source.value
                self.progress.message = f"Scraping {source.value}..."
                
                if source == SourceType.TWITTER:
                    posts = await self.twitter_scraper.scrape(days_back, max_items_per_source)
                elif source == SourceType.RSS:
                    posts = await self.rss_scraper.scrape(days_back, max_items_per_source)
                elif source == SourceType.POLYMARKET:
                    posts = await self.polymarket_scraper.scrape(days_back, max_items_per_source)
                else:
                    logger.warning(f"Unknown source: {source}")
                    continue
                
                self.posts.extend(posts)
                stats[source.value] = len(posts)
                
                logger.info(f"Scraped {len(posts)} posts from {source.value}")
                
            except Exception as e:
                logger.error(f"Error scraping {source.value}: {e}", exc_info=True)
                errors.append({
                    "source": source.value,
                    "error": str(e),
                })
            
            self.progress.progress = int(((idx + 1) / total_sources) * 100)
        
        self.progress.status = "completed"
        self.progress.progress = 100
        self.progress.current_source = None
        self.progress.message = f"Scraping complete. Total posts: {len(self.posts)}"
        self.progress.stats = stats
        
        return {
            "success": True,
            "total": len(self.posts),
            "stats": stats,
            "errors": errors if errors else None,
        }
    
    def get_progress(self) -> ScrapeProgress:
        """Get current scraping progress"""
        return self.progress
    
    def get_posts(self) -> List[ScrapedPost]:
        """Get scraped posts"""
        return self.posts


# Global instance
scraping_orchestrator = ScrapingOrchestrator()
