"""
Streak Admin Panel - FastAPI Backend
Main application entry point

Handles:
- Data scraping from multiple sources
- AI question generation
- AI Curator engine (Phase 6)
- Admin operations without wallet verification
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging
from typing import AsyncGenerator

from app.core.config import settings
from app.core.logging_config import setup_logging
from app.api.v1.router import api_router
from app.services.ai_curator.engine import AICuratorEngine

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)

# Global AI Curator instance
ai_curator_engine: AICuratorEngine | None = None


def get_ai_curator() -> AICuratorEngine | None:
    """Get the AI Curator engine instance"""
    return ai_curator_engine


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator:
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info("🚀 Starting Streak Admin Panel Backend...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Debug Mode: {settings.DEBUG}")
    
    # Initialize AI Curator Engine
    global ai_curator_engine
    if settings.AI_CURATOR_ENABLED:
        logger.info("🤖 Initializing AI Curator Engine...")
        ai_curator_engine = AICuratorEngine()
        await ai_curator_engine.start()
        logger.info("✅ AI Curator Engine started successfully")
    
    logger.info("✅ Backend started successfully")
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Streak Admin Panel Backend...")
    
    if ai_curator_engine:
        await ai_curator_engine.stop()
        logger.info("✅ AI Curator Engine stopped")
    
    logger.info("✅ Backend shutdown complete")


# Create FastAPI application
app = FastAPI(
    title=settings.API_TITLE,
    version=settings.API_VERSION,
    description=settings.API_DESCRIPTION,
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Store AI Curator getter in app state
app.state.get_ai_curator = get_ai_curator

# CORS Middleware
cors_origins = settings._parse_cors() if hasattr(settings, '_parse_cors') else (
    settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else 
    [origin.strip() for origin in settings.CORS_ORIGINS.split(',')]
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": settings.API_VERSION,
        "ai_curator_enabled": settings.AI_CURATOR_ENABLED,
        "ai_curator_status": "running" if ai_curator_engine and ai_curator_engine.is_running else "stopped",
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Streak Admin Panel Backend API",
        "version": settings.API_VERSION,
        "docs": "/docs" if settings.DEBUG else "Documentation disabled in production",
    }


# Include API router
app.include_router(api_router, prefix="/api/v1")


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else "An error occurred",
        },
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.RELOAD,
        log_level=settings.LOG_LEVEL.lower(),
    )
