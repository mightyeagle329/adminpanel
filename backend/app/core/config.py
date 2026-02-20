"""
Application configuration
Loads settings from environment variables
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Union
from pydantic import field_validator, BeforeValidator
from typing_extensions import Annotated
import os


class Settings(BaseSettings):
    """Application settings"""
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
        env_parse_none_str="null",
    )
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = True
    
    # API Configuration
    API_TITLE: str = "Streak Admin Panel Backend"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = "FastAPI backend for Streak Admin Panel"
    
    # CORS - accepts comma-separated string or list
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:3001,http://localhost:3000"
    
    def _parse_cors(self) -> List[str]:
        """Parse CORS_ORIGINS to list"""
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(',') if origin.strip()]
        return self.CORS_ORIGINS
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-4-turbo-preview"
    OPENAI_MAX_TOKENS: int = 2000
    OPENAI_TEMPERATURE: float = 0.7
    
    # Twitter/X (RapidAPI)
    RAPIDAPI_KEY: str = ""
    RAPIDAPI_HOST: str = "twitter154.p.rapidapi.com"
    
    # RSS
    RSS_FETCH_TIMEOUT: int = 30
    RSS_MAX_ITEMS: int = 100
    
    # Crypto APIs
    BINANCE_API_KEY: str = ""
    BINANCE_API_SECRET: str = ""
    COINGECKO_API_KEY: str = ""
    LUNARCRUSH_API_KEY: str = ""
    
    # Finance APIs
    ALPHA_VANTAGE_API_KEY: str = ""
    INVESTING_COM_API_KEY: str = ""
    
    # Sports APIs
    SPORTRADAR_API_KEY: str = ""
    
    # Database
    DATABASE_URL: str = "sqlite:///./streak_admin.db"
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    
    # Redis
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: str = ""
    
    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"
    
    # AI Curator
    AI_CURATOR_ENABLED: bool = True
    AI_CURATOR_INTERVAL_SECONDS: int = 300
    AI_CURATOR_MAX_MARKETS_PER_HOUR: int = 10
    
    # Market Generation
    MARKET_MIN_LIQUIDITY: float = 50000.0
    MARKET_MAX_DURATION_HOURS: int = 24
    MARKET_AUTO_PUBLISH: bool = False
    
    # External APIs
    API_REQUEST_TIMEOUT: int = 30
    API_MAX_RETRIES: int = 3
    API_RETRY_DELAY: int = 1
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "logs/backend.log"
    
    # Rust Backend Integration
    RUST_BACKEND_URL: str = "http://62.171.153.189:8080"
    RUST_BACKEND_TIMEOUT: int = 30
    
    @property
    def redis_url(self) -> str:
        """Get Redis URL"""
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"


# Create settings instance
settings = Settings()
