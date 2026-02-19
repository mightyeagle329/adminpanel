# Streak Admin Panel - FastAPI Backend

FastAPI backend for the Streak Admin Panel that handles:

- **Data Scraping**: Multi-source content aggregation (Twitter, RSS, Polymarket)
- **AI Question Generation**: OpenAI-powered prediction question creation
- **AI Curator Engine (Phase 6)**: Autonomous market generation system
- **Admin Operations**: Market management, treasury, security, competitions

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- pip
- Virtual environment (recommended)

### Installation

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Linux/Mac:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env and add your API keys
```

### Running the Server

```bash
# Development mode (with auto-reload)
python main.py

# Or using uvicorn directly
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📁 Project Structure

```
backend/
├── main.py                          # Application entry point
├── requirements.txt                  # Python dependencies
├── .env.example                     # Environment variables template
├── app/
│   ├── core/
│   │   ├── config.py                # Configuration management
│   │   └── logging_config.py        # Logging setup
│   ├── api/
│   │   └── v1/
│   │       ├── router.py            # API router
│   │       └── endpoints/           # API endpoints
│   │           ├── scraping.py      # Scraping endpoints
│   │           ├── questions.py     # Question generation
│   │           ├── ai_curator.py    # Phase 6: AI Curator
│   │           ├── markets.py       # Phase 5: Markets
│   │           ├── competitions.py  # Phase 5: SRS & Competitions
│   │           ├── treasury.py      # Phase 5: Treasury & Risk
│   │           ├── security.py      # Phase 5: Security
│   │           └── communications.py # Phase 5: Live Ops
│   ├── schemas/                     # Pydantic schemas
│   │   ├── common.py
│   │   ├── scraping.py
│   │   ├── question.py
│   │   ├── market.py
│   │   └── ai_curator.py
│   └── services/                    # Business logic
│       ├── scraping/                # Scraping services
│       │   ├── orchestrator.py
│       │   ├── twitter_scraper.py
│       │   ├── rss_scraper.py
│       │   └── polymarket_scraper.py
│       ├── question_generator.py    # Question generation
│       └── ai_curator/              # Phase 6: AI Curator
│           ├── engine.py            # Main orchestration
│           ├── watchtower.py        # Data ingestion
│           ├── architect.py         # Market generation
│           ├── judge.py             # Settlement logic
│           └── lifecycle_manager.py # Time-based management
└── logs/                            # Application logs
```

## 🔧 Configuration

### Environment Variables

Key configuration in `.env`:

```bash
# OpenAI (for question generation & AI Curator)
OPENAI_API_KEY=your_key_here

# Twitter/X
TWITTER_BEARER_TOKEN=your_token_here

# Crypto Data
BINANCE_API_KEY=your_key_here
BINANCE_API_SECRET=your_secret_here

# AI Curator Settings
AI_CURATOR_ENABLED=True
AI_CURATOR_INTERVAL_SECONDS=300
MARKET_AUTO_PUBLISH=False
```

## 📚 API Documentation

### Main Endpoints

#### Scraping
- `POST /api/v1/scraping/start` - Start scraping
- `GET /api/v1/scraping/progress` - Get scraping progress
- `GET /api/v1/scraping/posts` - Get scraped posts

#### Question Generation
- `POST /api/v1/questions/generate` - Generate questions from posts

#### AI Curator (Phase 6)
- `GET /api/v1/ai-curator/status` - Get AI Curator status
- `PUT /api/v1/ai-curator/config` - Update configuration
- `POST /api/v1/ai-curator/toggle` - Toggle AI mode
- `GET /api/v1/ai-curator/drafts` - Get pending drafts
- `POST /api/v1/ai-curator/drafts/{id}/approve` - Approve draft
- `GET /api/v1/ai-curator/stats` - Get generation stats

#### Markets (Phase 5)
- `POST /api/v1/markets/create` - Create market
- `GET /api/v1/markets/list` - List markets
- `POST /api/v1/markets/{id}/resolve` - Resolve market
- `POST /api/v1/markets/{id}/void` - Void market

#### Treasury & Risk (Phase 5)
- `GET /api/v1/treasury/vault/composition` - Get vault breakdown
- `GET /api/v1/treasury/liability/heatmap` - Get liability heatmap
- `POST /api/v1/treasury/emergency/kill-switch` - Emergency pause

See full API documentation at `/docs` when server is running.

## 🤖 AI Curator Engine (Phase 6)

The AI Curator is an autonomous market generation system with four main components:

1. **Watchtower**: Monitors data sources (crypto, social, news)
2. **Architect**: Converts signals into binary markets
3. **Judge**: Handles market resolution and proof verification
4. **Lifecycle Manager**: Manages time-based market states

### Operating Modes

- **HUMAN_REVIEW**: AI generates drafts, admin must approve (default)
- **FULL_CONTROL**: AI auto-publishes markets (God Mode)

### Market Types

- **15-minute**: Flash (Green/Red), High Jump, Marathon
- **30-minute**: Climax (timing), Duo (patterns)
- **1-24 hour**: Curator-generated event markets

## 🔒 Security

- API key authentication for external integrations
- Request rate limiting
- Input validation with Pydantic
- Comprehensive audit logging
- Fat Finger Protection for dangerous operations

## 🧪 Development

### Adding New Endpoints

1. Create endpoint file in `app/api/v1/endpoints/`
2. Add router to `app/api/v1/router.py`
3. Define schemas in `app/schemas/`
4. Implement business logic in `app/services/`

### Testing

```bash
# Run tests (when implemented)
pytest

# Test specific module
pytest tests/test_scraping.py
```

## 📝 Logging

Logs are stored in `logs/backend.log` with automatic rotation.

Log levels:
- DEBUG: Detailed information
- INFO: General information
- WARNING: Warning messages
- ERROR: Error messages
- CRITICAL: Critical failures

## 🚀 Deployment

### Production Checklist

- [ ] Set `DEBUG=False` in .env
- [ ] Configure production database (PostgreSQL)
- [ ] Set up Redis for caching
- [ ] Configure CORS origins
- [ ] Set up SSL/TLS
- [ ] Configure monitoring and alerts
- [ ] Set up log aggregation
- [ ] Configure backups

### Docker Deployment (Optional)

```dockerfile
FROM python:3.10-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 📖 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [OpenAI API](https://platform.openai.com/docs/)

## 🤝 Support

For issues or questions, please contact the development team.
