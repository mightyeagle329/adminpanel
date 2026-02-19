# 🚀 Quick Start Guide - Streak Admin Panel

Get your Streak Admin Panel running in 5 minutes!

## ⚡ Super Quick Setup

### 1. Backend Setup (2 minutes)

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate it
source venv/bin/activate  # Mac/Linux
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Start backend
python main.py
```

✅ Backend running at: `http://localhost:8000`  
✅ API Docs: `http://localhost:8000/docs`

### 2. Frontend Setup (2 minutes)

```bash
# Open new terminal, go to project root
cd ..

# Install dependencies
npm install

# Create .env.local
echo "NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000" > .env.local
echo "NEXT_PUBLIC_BACKEND_API_URL=http://62.171.153.189:8080" >> .env.local

# Start frontend
npm run dev
```

✅ Frontend running at: `http://localhost:3001`

### 3. Verify Installation (1 minute)

Open your browser:

1. **Frontend**: http://localhost:3001
2. **Backend Health**: http://localhost:8000/health
3. **API Docs**: http://localhost:8000/docs
4. **AI Curator Page**: http://localhost:3001/ai-curator

## 🎯 What Works Right Now

### ✅ Fully Functional

1. **Dashboard** - Overview and stats
2. **Questions** - AI-powered question generation
3. **Markets** - View markets from Rust backend
4. **AI Curator** - Phase 6 autonomous market generation
   - Status monitoring
   - Draft approval/rejection
   - Statistics dashboard
   - Configuration panel

### 🔌 All Backend APIs Ready

Every endpoint is ready to use:

- ✅ AI Curator Engine
- ✅ Data Scraping (Twitter, RSS, Polymarket)
- ✅ Question Generation
- ✅ Market Management
- ✅ Treasury & Risk
- ✅ Security & Sybil Detection
- ✅ Communications
- ✅ Competitions

Test them at: `http://localhost:8000/docs`

## 🛠️ Testing Without API Keys

The system works perfectly without any external API keys using **mock data**:

- **No OpenAI key?** → Mock questions generated
- **No Twitter key?** → Mock tweets provided
- **No Binance key?** → Mock crypto data
- **No Google Trends?** → Mock trends

**Everything works for development!**

## 📋 Add Real API Keys (Optional)

Edit `backend/.env`:

```bash
# OpenAI (for real AI generation)
OPENAI_API_KEY=sk-...

# Twitter (for real tweets)
TWITTER_BEARER_TOKEN=...

# Binance (for real crypto data)
BINANCE_API_KEY=...
BINANCE_API_SECRET=...
```

Restart backend after adding keys.

## 🎨 Create Remaining Pages

You need to create 6 more pages. Use the templates in `FRONTEND_PAGE_TEMPLATE.md`:

### Priority Order:

1. **Treasury & Risk** (`/treasury`) - 2-3 hours
   - Vault composition
   - Exposure metrics
   - Kill switch

2. **Market Wizard** (`/market-wizard`) - 2-3 hours
   - Multi-step wizard
   - Form validation

3. **Security** (`/security`) - 1-2 hours
   - Sybil suspects table
   - Action buttons

4. **Communications** (`/communications`) - 1-2 hours
   - Banner creation
   - Active banner display

5. **Competitions** (`/competitions`) - 1-2 hours
   - Competition creation
   - Economy tuning

6. **CRM** (`/crm`) - 1-2 hours
   - Ticket search
   - God Finger tools

### How to Create a Page:

1. Copy template from `FRONTEND_PAGE_TEMPLATE.md`
2. Create file in `app/your-page/page.tsx`
3. Update with your specific components
4. Test on desktop and mobile
5. Done!

## 🐛 Common Issues & Solutions

### Backend won't start

```bash
# Make sure Python 3.10+
python --version

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### Frontend won't start

```bash
# Clear cache
rm -rf .next

# Reinstall
rm -rf node_modules package-lock.json
npm install

# Try again
npm run dev
```

### "Module not found" error

```bash
# Frontend
npm install

# Backend
pip install -r requirements.txt
```

### Port already in use

```bash
# Kill process on port 8000 (backend)
# Mac/Linux:
lsof -ti:8000 | xargs kill -9

# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

### CORS errors

Check `.env.local`:
```bash
NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
```

And `backend/.env`:
```bash
CORS_ORIGINS=http://localhost:3001,http://localhost:3000
```

## 🧪 Test the System

### 1. Test Backend Health

```bash
curl http://localhost:8000/health
```

Should return:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "ai_curator_enabled": true,
  "ai_curator_status": "running"
}
```

### 2. Test AI Curator

1. Open: http://localhost:3001/ai-curator
2. Check if status shows "Running"
3. Look for any pending drafts
4. Try toggling AI mode

### 3. Test Scraping

1. Go to: http://localhost:3001
2. Click "Start Scraping"
3. Watch progress
4. Check scraped posts

### 4. Test Question Generation

1. Go to: http://localhost:3001/questions
2. Click "Generate with AI"
3. Wait for questions
4. Select some and click "Send to Backend"

## 📚 Documentation

- **Full Setup**: See `PROJECT_SETUP.md`
- **Page Templates**: See `FRONTEND_PAGE_TEMPLATE.md`
- **Backend README**: See `backend/README.md`
- **API Docs**: http://localhost:8000/docs

## 🔥 Pro Tips

1. **Use API Docs**: Test all endpoints at `/docs` before writing frontend code
2. **Check Logs**: Backend logs are in `backend/logs/backend.log`
3. **React DevTools**: Install for debugging React components
4. **Thunder Client**: VS Code extension for API testing
5. **Hot Reload**: Both frontend and backend auto-reload on code changes

## 🎯 Next Steps

After getting everything running:

1. **Create remaining pages** (6 pages, ~12-18 hours total)
2. **Test mobile responsive** (use Chrome DevTools)
3. **Run linting**: `npm run lint`
4. **Add chart libraries** (Chart.js or Recharts)
5. **Connect to Rust backend** (for wallet-verified operations)

## 🆘 Need Help?

1. Check the logs:
   - Backend: `backend/logs/backend.log`
   - Frontend: Browser console

2. Verify endpoints:
   - API Docs: http://localhost:8000/docs
   - Health: http://localhost:8000/health

3. Check environment:
   - Backend: `backend/.env`
   - Frontend: `.env.local`

## ✨ What You've Got

**Backend (100% Complete)**:
- ✅ Full AI Curator Engine with 4 modules
- ✅ Complete API with 50+ endpoints
- ✅ Data scraping from 4 sources
- ✅ AI question generation
- ✅ Mock data for development
- ✅ Comprehensive error handling
- ✅ Logging and monitoring

**Frontend (70% Complete)**:
- ✅ Core infrastructure
- ✅ AI Curator page (full-featured)
- ✅ Existing pages enhanced
- ✅ Safety Modal component
- ✅ FastAPI client
- ✅ Updated types
- 🟡 6 pages need creation (templates provided)

## 🎉 You're Ready!

Your development environment is set up. The backend is fully functional. Now just create the remaining frontend pages using the templates provided.

**Total estimated time to complete**: 15-20 hours

**Happy coding! 🚀**
