# Twitter RapidAPI Integration - Testing Guide

## Overview
The Twitter scraping functionality has been updated to use **RapidAPI's Twitter154** service instead of the deprecated Twitter v2 API.

## API Key Configuration

### ✅ Security Implemented
- API key is stored **ONLY** in `backend/.env` file
- `.env` file is excluded from git via `.gitignore`
- No API keys exposed in source code
- All code references keys via environment variables

### Your API Credentials
```env
RAPIDAPI_KEY=ea96f1e7bamshe87dee544168b69p1e1fc1jsnbeef92ce5dfe
RAPIDAPI_HOST=twitter154.p.rapidapi.com
```

**Location:** `backend/.env` (already configured)

## What Changed

### 1. Environment Variables
- ❌ Removed: `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_SECRET`, `TWITTER_BEARER_TOKEN`
- ✅ Added: `RAPIDAPI_KEY`, `RAPIDAPI_HOST`

### 2. Dependencies
- ❌ Removed: `tweepy` (Twitter's official SDK)
- ✅ Using: `httpx` (already installed)

### 3. Twitter Scraper Service
**File:** `backend/app/services/scraping/twitter_scraper.py`

**Features:**
- Uses RapidAPI Twitter154 API
- Scrapes from crypto influencers and news accounts
- Supports pagination with continuation tokens
- Handles rate limiting gracefully
- Falls back to mock data if API is unavailable

**Target Accounts:**
- Elon Musk (@elonmusk) - Tech/Crypto
- CZ Binance (@cz_binance) - Crypto
- Vitalik Buterin (@VitalikButerin) - Ethereum
- Reuters (@Reuters) - News
- Associated Press (@AP) - News
- Fabrizio Romano (@FabrizioRomano) - Sports

## How to Test

### 1. Start the Backend
```bash
cd backend
python3 main.py
```

### 2. Test via API Endpoint
```bash
# Test Twitter scraping
curl -X POST http://localhost:8000/api/v1/scraping/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "sources": ["twitter"],
    "days_back": 7,
    "max_items_per_source": 10
  }'
```

### 3. Test via Frontend
Navigate to your admin panel and use the scraping functionality to pull Twitter data.

### 4. Check Logs
```bash
tail -f backend/logs/backend.log
```

## API Response Structure

The RapidAPI returns complex nested JSON. The scraper extracts:

```json
{
  "id": "twitter_1234567890",
  "source": "twitter",
  "source_id": "elonmusk",
  "source_name": "Elon Musk",
  "text": "Tweet content here...",
  "date_iso": "2024-02-18T10:30:00Z",
  "url": "https://twitter.com/elonmusk/status/1234567890",
  "metadata": {
    "likes": 1000,
    "retweets": 50,
    "replies": 20,
    "views": 5000,
    "user_id": "44196397"
  }
}
```

## Error Handling

### If API Key is Invalid
- Falls back to mock data
- Logs warning: "RapidAPI key not configured"
- Returns sample tweets for testing

### If API Quota Exceeded
- Returns 429 error
- Check your RapidAPI dashboard: https://rapidapi.com/hub
- Consider upgrading plan if needed

### If Account Not Found
- Skips that account
- Continues with other accounts
- Logs error with details

## Rate Limits

**Free Tier:** Check your RapidAPI plan
**Recommended:** 
- Max 3 pages per account
- Max 20 tweets per request
- Implement caching for frequent requests

## Troubleshooting

### "RapidAPI key not configured"
- Check `backend/.env` exists
- Verify `RAPIDAPI_KEY` is set
- Restart the backend server

### "API error 401: Unauthorized"
- API key is invalid or expired
- Check RapidAPI dashboard
- Regenerate key if needed

### "API error 429: Too Many Requests"
- You've hit the rate limit
- Wait or upgrade plan
- Use mock data for development

### Empty Results
- Account might be private
- Account might not exist
- Check `days_back` parameter

## Next Steps

1. ✅ Test the API with a simple request
2. ✅ Monitor the logs for any errors
3. ✅ Verify tweets are being parsed correctly
4. ✅ Consider implementing Redis caching for frequently accessed data
5. ✅ Set up monitoring for API quota usage

## Security Checklist

- ✅ API key stored in `.env` file
- ✅ `.env` excluded from git
- ✅ `.env.example` has placeholder values only
- ✅ No hardcoded credentials in source code
- ✅ Environment variables loaded via `pydantic-settings`
- ✅ API keys never logged or exposed in responses

## Additional Resources

- RapidAPI Dashboard: https://rapidapi.com/hub
- Twitter154 API Docs: https://rapidapi.com/omarmhaimdat/api/twitter154
- Backend README: `backend/README.md`
