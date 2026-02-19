"""
Twitter scraper service
"""

import logging
from typing import List
from datetime import datetime, timedelta
import tweepy
from app.core.config import settings
from app.schemas.scraping import ScrapedPost, SourceType

logger = logging.getLogger(__name__)


class TwitterScraper:
    """Twitter scraper"""
    
    def __init__(self):
        self.accounts = [
            {"username": "elonmusk", "display_name": "Elon Musk"},
            {"username": "FabrizioRomano", "display_name": "Fabrizio Romano"},
            {"username": "Reuters", "display_name": "Reuters"},
            {"username": "AP", "display_name": "Associated Press"},
        ]
        
        # Initialize Twitter API client if credentials available
        self.client = None
        if settings.TWITTER_BEARER_TOKEN:
            try:
                self.client = tweepy.Client(bearer_token=settings.TWITTER_BEARER_TOKEN)
            except Exception as e:
                logger.warning(f"Failed to initialize Twitter client: {e}")
    
    async def scrape(self, days_back: int, max_items: int) -> List[ScrapedPost]:
        """Scrape Twitter accounts"""
        logger.info(f"Scraping Twitter accounts: {len(self.accounts)}")
        
        if not self.client:
            logger.warning("Twitter client not initialized. Returning mock data.")
            return self._get_mock_data(days_back, max_items)
        
        posts = []
        cutoff_date = datetime.utcnow() - timedelta(days=days_back)
        
        for account in self.accounts[:max_items]:
            try:
                # Fetch recent tweets
                response = self.client.get_users_tweets(
                    username=account["username"],
                    max_results=min(100, max_items),
                    tweet_fields=["created_at", "public_metrics", "entities"],
                )
                
                if not response.data:
                    continue
                
                for tweet in response.data:
                    created_at = datetime.fromisoformat(tweet.created_at.replace('Z', '+00:00'))
                    
                    if created_at < cutoff_date:
                        continue
                    
                    post = ScrapedPost(
                        id=f"twitter_{tweet.id}",
                        source=SourceType.TWITTER,
                        source_id=account["username"],
                        source_name=account["display_name"],
                        title=None,
                        text=tweet.text,
                        date_iso=created_at,
                        url=f"https://twitter.com/{account['username']}/status/{tweet.id}",
                        metadata={
                            "likes": tweet.public_metrics.get("like_count", 0),
                            "retweets": tweet.public_metrics.get("retweet_count", 0),
                            "replies": tweet.public_metrics.get("reply_count", 0),
                        },
                    )
                    posts.append(post)
                    
            except Exception as e:
                logger.error(f"Error scraping Twitter account {account['username']}: {e}")
        
        logger.info(f"Scraped {len(posts)} Twitter posts")
        return posts
    
    def _get_mock_data(self, days_back: int, max_items: int) -> List[ScrapedPost]:
        """Get mock data for testing"""
        posts = []
        base_time = datetime.utcnow() - timedelta(hours=2)
        
        for i, account in enumerate(self.accounts[:min(len(self.accounts), max_items)]):
            post = ScrapedPost(
                id=f"twitter_mock_{i}",
                source=SourceType.TWITTER,
                source_id=account["username"],
                source_name=account["display_name"],
                title=None,
                text=f"Mock tweet from {account['display_name']} about crypto markets and trending topics",
                date_iso=base_time - timedelta(hours=i),
                url=f"https://twitter.com/{account['username']}/status/mock_{i}",
                metadata={
                    "likes": 1000 + i * 100,
                    "retweets": 50 + i * 10,
                    "replies": 20 + i * 5,
                },
            )
            posts.append(post)
        
        return posts
