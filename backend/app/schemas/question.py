"""
Question generation schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class QuestionGenerateRequest(BaseModel):
    """Request to generate questions"""
    min_questions: int = Field(10, ge=1, le=100)
    max_questions: int = Field(50, ge=1, le=100)
    use_recent_posts: bool = Field(True, description="Use recent scraped posts")
    days_back: int = Field(2, ge=1, le=30)


class QuestionResponse(BaseModel):
    """Question response schema"""
    id: str
    question: str
    source_ids: List[str]
    sources: List[str]
    selected: bool
    created_at: datetime


class QuestionBatchResponse(BaseModel):
    """Batch of generated questions"""
    success: bool
    questions: List[QuestionResponse]
    total: int
    message: Optional[str] = None
