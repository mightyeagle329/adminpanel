"""
Question generation service using OpenAI
"""

import logging
from typing import List
import uuid
from datetime import datetime
import openai

from app.core.config import settings
from app.schemas.question import QuestionResponse
from app.schemas.scraping import ScrapedPost

logger = logging.getLogger(__name__)


class QuestionGenerator:
    """Generates prediction questions from scraped posts"""
    
    def __init__(self):
        if settings.OPENAI_API_KEY:
            openai.api_key = settings.OPENAI_API_KEY
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY) if settings.OPENAI_API_KEY else None
    
    async def generate_questions(
        self,
        posts: List[ScrapedPost],
        min_questions: int = 10,
        max_questions: int = 50,
    ) -> List[QuestionResponse]:
        """
        Generate prediction questions from posts
        
        Args:
            posts: List of scraped posts
            min_questions: Minimum number of questions to generate
            max_questions: Maximum number of questions to generate
            
        Returns:
            List of generated questions
        """
        logger.info(f"Generating questions from {len(posts)} posts")
        
        if not self.client:
            logger.warning("OpenAI client not initialized. Returning mock questions.")
            return self._generate_mock_questions(min_questions)
        
        if not posts:
            logger.warning("No posts provided for question generation")
            return []
        
        # Prepare context from posts
        context = self._prepare_context(posts[:50])  # Limit to 50 posts
        
        # Generate questions using OpenAI
        try:
            response = await self.client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt(),
                    },
                    {
                        "role": "user",
                        "content": f"Generate {max_questions} binary prediction questions based on this context:\n\n{context}",
                    },
                ],
                temperature=settings.OPENAI_TEMPERATURE,
                max_tokens=settings.OPENAI_MAX_TOKENS,
            )
            
            questions_text = response.choices[0].message.content
            questions = self._parse_questions(questions_text, posts)
            
            logger.info(f"Generated {len(questions)} questions")
            return questions[:max_questions]
            
        except Exception as e:
            logger.error(f"Error generating questions with OpenAI: {e}", exc_info=True)
            return self._generate_mock_questions(min_questions)
    
    def _prepare_context(self, posts: List[ScrapedPost]) -> str:
        """Prepare context string from posts"""
        context_parts = []
        
        for post in posts[:30]:  # Limit to 30 posts
            source = f"[{post.source.value.upper()}]"
            title = f"{post.title}: " if post.title else ""
            text = post.text[:200]  # Limit text length
            context_parts.append(f"{source} {title}{text}")
        
        return "\n\n".join(context_parts)
    
    def _get_system_prompt(self) -> str:
        """Get system prompt for OpenAI"""
        return """You are an expert at creating binary prediction questions for a prediction market platform.

Rules:
1. Each question must be binary (YES/NO or Option A vs Option B)
2. Questions must be resolvable within 24 hours
3. Questions must be clear and unambiguous
4. Focus on crypto, finance, sports, politics, and trending topics
5. Make questions engaging and interesting
6. Each question should have a clear resolution source

Format each question on a new line, starting with a number:
1. [Question text]
2. [Question text]
..."""
    
    def _parse_questions(self, text: str, source_posts: List[ScrapedPost]) -> List[QuestionResponse]:
        """Parse questions from OpenAI response"""
        questions = []
        lines = text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Remove leading numbers and punctuation
            if line[0].isdigit():
                line = line.split('.', 1)[-1].strip()
            
            if len(line) < 10:  # Skip very short lines
                continue
            
            # Extract source IDs (simplified - use first few posts)
            source_ids = [post.id for post in source_posts[:3]]
            sources = list(set([post.source.value for post in source_posts[:5]]))
            
            question = QuestionResponse(
                id=str(uuid.uuid4()),
                question=line,
                source_ids=source_ids,
                sources=sources,
                selected=False,
                created_at=datetime.utcnow(),
            )
            questions.append(question)
        
        return questions
    
    def _generate_mock_questions(self, count: int) -> List[QuestionResponse]:
        """Generate mock questions for testing"""
        mock_questions = [
            "Will Bitcoin break $100,000 by the end of today?",
            "Will Ethereum reach a new all-time high this week?",
            "Will the S&P 500 close higher today?",
            "Will there be a major political announcement in the next 24 hours?",
            "Will a major tech company announce layoffs today?",
            "Will oil prices increase by more than 2% today?",
            "Will a new crypto token gain more than 50% in 24 hours?",
            "Will the Fed make an emergency rate decision this week?",
            "Will a celebrity make a controversial statement on social media today?",
            "Will a major sports trade be announced in the next 24 hours?",
        ]
        
        questions = []
        for i in range(min(count, len(mock_questions))):
            question = QuestionResponse(
                id=str(uuid.uuid4()),
                question=mock_questions[i],
                source_ids=[f"mock_source_{i}"],
                sources=["mock"],
                selected=False,
                created_at=datetime.utcnow(),
            )
            questions.append(question)
        
        return questions


# Global instance
question_generator = QuestionGenerator()
