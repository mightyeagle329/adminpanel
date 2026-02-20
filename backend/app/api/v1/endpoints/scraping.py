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


@router.post("/scrape")
async def scrape_sync(request: ScrapeRequest):
    """
    Run scraping synchronously and return posts.
    Use this when the client needs posts in a single request (e.g. frontend scrape-all).
    """
    result = await scraping_orchestrator.scrape_all(
        request.sources,
        request.days_back,
        request.max_items_per_source,
    )
    # Include posts in response for sync usage
    posts_data = [p.model_dump(mode="json") for p in scraping_orchestrator.get_posts()]
    return {
        "success": result.get("success", True),
        "total": result.get("total", 0),
        "stats": result.get("stats", {}),
        "errors": result.get("errors"),
        "posts": posts_data,
    }


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
