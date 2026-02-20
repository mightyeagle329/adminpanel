"""
RSS scraper service
"""

import logging
from typing import List
from datetime import datetime, timedelta
import feedparser
from app.schemas.scraping import ScrapedPost, SourceType

logger = logging.getLogger(__name__)


class RSSScraper:
    """RSS feed scraper. Uses feeds from sources store."""
    
    def _get_feeds(self):
        """Load feeds from sources store."""
        try:
            from app.services import sources_store
            stored = sources_store.get_rss_feeds()
            return [f for f in stored if f.get("enabled", True)]
        except Exception as e:
            logger.warning(f"Could not load RSS feeds from store: {e}")
            return [
                {"name": "CoinDesk", "url": "https://www.coindesk.com/arc/outboundfeeds/rss/", "category": "crypto"},
                {"name": "BBC News", "url": "http://feeds.bbci.co.uk/news/rss.xml", "category": "general"},
            ]
    
    async def scrape(self, days_back: int, max_items: int) -> List[ScrapedPost]:
        """Scrape RSS feeds (from sources store)."""
        feeds = self._get_feeds()
        logger.info(f"Scraping RSS feeds: {len(feeds)}")
        
        posts = []
        cutoff_date = datetime.utcnow() - timedelta(days=days_back)
        
        for feed_config in feeds[:max_items]:
            try:
                # Parse feed
                feed = feedparser.parse(feed_config["url"])
                
                if not feed.entries:
                    logger.warning(f"No entries found in feed: {feed_config['name']}")
                    continue
                
                for entry in feed.entries[:min(20, max_items)]:
                    try:
                        # Parse date
                        if hasattr(entry, 'published_parsed') and entry.published_parsed:
                            pub_date = datetime(*entry.published_parsed[:6])
                        elif hasattr(entry, 'updated_parsed') and entry.updated_parsed:
                            pub_date = datetime(*entry.updated_parsed[:6])
                        else:
                            pub_date = datetime.utcnow()
                        
                        if pub_date < cutoff_date:
                            continue
                        
                        # Extract text content
                        text = entry.get('summary', '') or entry.get('description', '')
                        if not text:
                            text = entry.get('title', '')
                        
                        post = ScrapedPost(
                            id=f"rss_{feed_config['name']}_{entry.get('id', hash(entry.link))}",
                            source=SourceType.RSS,
                            source_id=feed_config["name"],
                            source_name=feed_config["name"],
                            title=entry.get('title', 'No title'),
                            text=text[:1000],  # Limit text length
                            date_iso=pub_date,
                            url=entry.get('link', ''),
                            metadata={
                                "category": feed_config["category"],
                                "author": entry.get('author', ''),
                            },
                        )
                        posts.append(post)
                        
                    except Exception as e:
                        logger.error(f"Error parsing RSS entry: {e}")
                
            except Exception as e:
                logger.error(f"Error scraping RSS feed {feed_config['name']}: {e}")
        
        logger.info(f"Scraped {len(posts)} RSS posts")
        return posts
