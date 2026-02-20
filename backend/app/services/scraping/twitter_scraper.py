"""
Twitter scraper service using RapidAPI
"""

import logging
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import httpx
from app.core.config import settings
from app.schemas.scraping import ScrapedPost, SourceType

logger = logging.getLogger(__name__)


class TwitterScraper:
    """Twitter scraper using RapidAPI (twitter154). Uses accounts from sources store only (no hardcoded list)."""

    def __init__(self):
        self.api_key = settings.RAPIDAPI_KEY
        self.api_host = settings.RAPIDAPI_HOST
        self.base_url = f"https://{self.api_host}"
        self.headers = {
            "Content-Type": "application/json",
            "x-rapidapi-host": self.api_host,
            "x-rapidapi-key": self.api_key,
        }
    
    def _get_accounts(self) -> List[Dict[str, Any]]:
        """Load accounts from sources store (DB). Only enabled accounts with user_id are used for scraping."""
        try:
            from app.services import sources_store
            stored = sources_store.get_twitter_accounts()
            accounts = [
                {
                    "user_id": str(a["user_id"]),
                    "username": a["username"],
                    "display_name": a.get("display_name") or a["username"],
                }
                for a in stored
                if a.get("enabled", True) and a.get("user_id")
            ]
            return accounts
        except Exception as e:
            logger.warning(f"Could not load Twitter accounts from store: {e}")
            return []

    async def scrape(self, days_back: int, max_items: int) -> List[ScrapedPost]:
        """Scrape Twitter accounts using RapidAPI (accounts from sources store)."""
        accounts = self._get_accounts()
        logger.info(f"Scraping Twitter accounts: {len(accounts)}")
        
        if not self.api_key or self.api_key == "your_rapidapi_key_here":
            logger.warning("RapidAPI key not configured. Returning mock data.")
            return self._get_mock_data(days_back, max_items)
        
        all_posts = []
        from datetime import timezone
        cutoff_date = datetime.now(timezone.utc) - timedelta(days=days_back)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for account in accounts:
                try:
                    posts = await self._scrape_user_tweets(
                        client, 
                        account, 
                        cutoff_date, 
                        max_items
                    )
                    all_posts.extend(posts)
                    
                    if len(all_posts) >= max_items:
                        break
                        
                except Exception as e:
                    logger.error(f"Error scraping Twitter account {account['username']}: {e}")
        
        # Limit to max_items
        all_posts = all_posts[:max_items]
        logger.info(f"Scraped {len(all_posts)} Twitter posts")
        return all_posts
    
    async def _scrape_user_tweets(
        self, 
        client: httpx.AsyncClient, 
        account: Dict[str, str],
        cutoff_date: datetime,
        limit: int
    ) -> List[ScrapedPost]:
        """Scrape tweets from a specific user"""
        posts = []
        continuation_token = None
        page = 0
        max_pages = 3  # Limit pagination
        
        while page < max_pages and len(posts) < limit:
            try:
                # Build request payload
                payload = {
                    "user_id": account["user_id"],
                    "limit": min(20, limit - len(posts))
                }
                
                # Choose endpoint based on whether we have continuation token
                if continuation_token:
                    payload["continuation_token"] = continuation_token
                    endpoint = f"{self.base_url}/user/medias/continuation"
                else:
                    endpoint = f"{self.base_url}/user/medias"
                
                # Make API request
                response = await client.post(
                    endpoint,
                    headers=self.headers,
                    json=payload
                )
                
                if response.status_code != 200:
                    logger.error(f"API error {response.status_code}: {response.text}")
                    break
                
                data = response.json()
                
                # Parse tweets from response
                tweets = self._parse_tweets(data, account)
                
                for tweet in tweets:
                    if tweet.date_iso < cutoff_date:
                        return posts  # Stop if we've gone past cutoff date
                    posts.append(tweet)
                
                # Get continuation token for next page
                continuation_token = data.get("continuation_token")
                if not continuation_token:
                    break
                
                page += 1
                
            except Exception as e:
                logger.error(f"Error fetching tweets for {account['username']}: {e}")
                break
        
        return posts
    
    def _parse_tweets(self, data: Dict[str, Any], account: Dict[str, str]) -> List[ScrapedPost]:
        """Parse tweets from API response"""
        posts = []
        
        try:
            # The response has a simple structure: {"results": [...], "continuation_token": "..."}
            results = data.get("results", [])
            
            if not isinstance(results, list):
                logger.warning(f"Expected 'results' to be a list, got {type(results)}")
                return posts
            
            for tweet_data in results:
                post = self._parse_tweet_result(tweet_data, account)
                if post:
                    posts.append(post)
        
        except Exception as e:
            logger.error(f"Error parsing tweets: {e}")
        
        return posts
    
    def _parse_tweet_result(self, tweet: Dict[str, Any], account: Dict[str, str]) -> Optional[ScrapedPost]:
        """Parse a single tweet result from RapidAPI response"""
        try:
            # Extract fields from the simplified response structure
            tweet_id = tweet.get("tweet_id", "")
            text = tweet.get("text", "")
            created_at_str = tweet.get("creation_date", "")
            
            # Parse Twitter date format: "Tue Apr 08 20:40:19 +0000 2025"
            created_at = datetime.strptime(created_at_str, "%a %b %d %H:%M:%S %z %Y")
            
            # Get user data
            user_data = tweet.get("user", {})
            username = user_data.get("username", account.get("username", "unknown"))
            display_name = user_data.get("name", account.get("display_name", "Unknown"))
            
            # Get engagement metrics (these may not be in the response)
            likes = tweet.get("favorite_count", tweet.get("likes", 0))
            retweets = tweet.get("retweet_count", tweet.get("retweets", 0))
            replies = tweet.get("reply_count", tweet.get("replies", 0))
            views = tweet.get("view_count", tweet.get("views", 0))
            
            # Get media URLs if present
            media_urls = tweet.get("media_url", [])
            video_url = tweet.get("video_url")
            
            post = ScrapedPost(
                id=f"twitter_{tweet_id}",
                source=SourceType.TWITTER,
                source_id=username,
                source_name=display_name,
                title=None,
                text=text,
                date_iso=created_at,
                url=f"https://twitter.com/{username}/status/{tweet_id}",
                metadata={
                    "likes": likes,
                    "retweets": retweets,
                    "replies": replies,
                    "views": views,
                    "user_id": account.get("user_id", ""),
                    "media_urls": media_urls,
                    "video_url": video_url,
                },
            )
            
            return post
            
        except Exception as e:
            logger.error(f"Error parsing tweet result: {e}")
            return None
    
    
    def _get_mock_data(self, days_back: int, max_items: int) -> List[ScrapedPost]:
        """Get mock data for testing"""
        posts = []
        base_time = datetime.utcnow() - timedelta(hours=2)
        accounts = self._get_accounts()
        for i, account in enumerate(accounts[:min(len(accounts), max_items)]):
            post = ScrapedPost(
                id=f"twitter_mock_{i}",
                source=SourceType.TWITTER,
                source_id=account["username"],
                source_name=account["display_name"],
                title=None,
                text=f"Mock tweet from {account['display_name']} about crypto markets, breaking news, and trending topics #crypto #news",
                date_iso=base_time - timedelta(hours=i),
                url=f"https://twitter.com/{account['username']}/status/mock_{i}",
                metadata={
                    "likes": 1000 + i * 100,
                    "retweets": 50 + i * 10,
                    "replies": 20 + i * 5,
                    "views": 5000 + i * 500,
                    "user_id": account["user_id"],
                },
            )
            posts.append(post)
        
        return posts
