"""
Common schemas used across the application
"""

from pydantic import BaseModel, Field
from typing import Any, Dict, List, Optional
from datetime import datetime
from enum import Enum


class ResponseStatus(str, Enum):
    """Response status enum"""
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"


class BaseResponse(BaseModel):
    """Base response schema"""
    success: bool
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None


class PaginatedResponse(BaseModel):
    """Paginated response schema"""
    success: bool
    data: List[Any]
    total: int
    page: int
    limit: int
    pages: int


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
