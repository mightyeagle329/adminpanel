"""
API v1 Router
Aggregates all API endpoints
"""

from fastapi import APIRouter

from app.api.v1.endpoints import (
    scraping,
    questions,
    ai_curator,
    markets,
    competitions,
    treasury,
    security,
    communications,
)

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    scraping.router,
    prefix="/scraping",
    tags=["Scraping"],
)

api_router.include_router(
    questions.router,
    prefix="/questions",
    tags=["Questions"],
)

api_router.include_router(
    ai_curator.router,
    prefix="/ai-curator",
    tags=["AI Curator"],
)

api_router.include_router(
    markets.router,
    prefix="/markets",
    tags=["Markets"],
)

api_router.include_router(
    competitions.router,
    prefix="/competitions",
    tags=["Competitions"],
)

api_router.include_router(
    treasury.router,
    prefix="/treasury",
    tags=["Treasury"],
)

api_router.include_router(
    security.router,
    prefix="/security",
    tags=["Security"],
)

api_router.include_router(
    communications.router,
    prefix="/communications",
    tags=["Communications"],
)
