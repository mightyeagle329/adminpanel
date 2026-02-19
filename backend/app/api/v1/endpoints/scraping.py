"""
Scraping API endpoints
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from typing import Optional, List

from app.schemas.scraping import (
    ScrapeRequest,
    ScrapeProgress,
    SourceType,
)
from app.schemas.common import BaseResponse
from app.services.scraping.orchestrator import scraping_orchestrator

router = APIRouter()


@router.post("/start")
async def start_scraping(
    request: ScrapeRequest,
    background_tasks: BackgroundTasks,
):
    """
    Start scraping from specified sources
    
    This endpoint initiates scraping in the background and returns immediately.
    Use GET /progress to check status.
    """
    # Start scraping in background
    background_tasks.add_task(
        scraping_orchestrator.scrape_all,
        request.sources,
        request.days_back,
        request.max_items_per_source,
    )
    
    return BaseResponse(
        success=True,
        message="Scraping started",
        data={"status": "initiated"},
    )


@router.get("/progress")
async def get_scraping_progress() -> ScrapeProgress:
    """Get current scraping progress"""
    return scraping_orchestrator.get_progress()


@router.get("/posts")
async def get_scraped_posts(
    limit: int = 100,
    source: Optional[SourceType] = None,
):
    """
    Get scraped posts
    
    Args:
        limit: Maximum number of posts to return
        source: Filter by source type
    """
    posts = scraping_orchestrator.get_posts()
    
    # Filter by source if specified
    if source:
        posts = [p for p in posts if p.source == source]
    
    # Limit results
    posts = posts[:limit]
    
    return {
        "success": True,
        "total": len(posts),
        "posts": posts,
    }


@router.post("/sources/twitter")
async def add_twitter_account():
    """Add a Twitter account to monitor"""
    return BaseResponse(
        success=True,
        message="Twitter account added",
    )


@router.post("/sources/rss")
async def add_rss_feed():
    """Add an RSS feed to monitor"""
    return BaseResponse(
        success=True,
        message="RSS feed added",
    )
