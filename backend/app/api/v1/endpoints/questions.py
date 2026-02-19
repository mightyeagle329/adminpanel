"""
Question generation API endpoints
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks

from app.schemas.question import (
    QuestionGenerateRequest,
    QuestionBatchResponse,
)
from app.services.question_generator import question_generator
from app.services.scraping.orchestrator import scraping_orchestrator

router = APIRouter()


@router.post("/generate", response_model=QuestionBatchResponse)
async def generate_questions(request: QuestionGenerateRequest):
    """
    Generate prediction questions from scraped posts
    
    Uses OpenAI to generate binary prediction questions based on
    recent scraped content.
    """
    # Get scraped posts
    posts = scraping_orchestrator.get_posts()
    
    if not posts and request.use_recent_posts:
        raise HTTPException(
            status_code=400,
            detail="No scraped posts available. Run scraping first.",
        )
    
    # Generate questions
    questions = await question_generator.generate_questions(
        posts=posts if request.use_recent_posts else [],
        min_questions=request.min_questions,
        max_questions=request.max_questions,
    )
    
    return QuestionBatchResponse(
        success=True,
        questions=questions,
        total=len(questions),
        message=f"Generated {len(questions)} questions",
    )


@router.get("/list")
async def list_questions():
    """List all generated questions"""
    # In production, this would fetch from database
    return {
        "success": True,
        "questions": [],
        "total": 0,
    }
