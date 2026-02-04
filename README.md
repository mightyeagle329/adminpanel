# Crypto News Admin Panel

A modern, beautiful admin panel built with Next.js, TypeScript, and Tailwind CSS for managing Telegram crypto news channels and generating 24-hour prediction questions using AI.

## Features

- 📡 **Channel Management**: Add and manage Telegram channel URLs
- 🔍 **News Scraping**: Scrape posts from the last 2 days from all channels
- ✨ **AI Question Generation**: Generate prediction questions using OpenAI GPT-4
- ✅ **Question Selection**: Select questions one by one for submission
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 📊 **Progress Tracking**: Real-time progress display during scraping

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
Create a `.env.local` file with:
```
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
DAYS_BACK=2
MAX_PAGES=20
REQUEST_DELAY_MS=800
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### 1. Add Telegram Channels
- Enter a Telegram URL (e.g., `t.me/crypto_news`)
- Click "Add" to save the channel

### 2. Scrape News
- Click "Start Scraping" to collect posts from all channels
- Progress will be displayed in real-time
- Posts from the last 2 days will be collected

### 3. Generate Questions
- Click "Generate New Questions" to use AI to create prediction questions
- Questions are generated based on scraped news posts
- Each question is designed to be verifiable within 24 hours

### 4. Select Questions
- Click on questions to select/deselect them
- Selected questions are highlighted in blue
- The counter shows how many questions are selected

### 5. Send to Backend
- Click "Send Selected Questions to Backend"
- Currently shows a placeholder - provide your backend API endpoint to complete this feature

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: Custom components with Lucide React icons
- **AI**: OpenAI GPT-4
- **Web Scraping**: Cheerio + Undici
- **Database**: JSON file-based (easily upgradeable to SQL/NoSQL)

## API Routes

- `GET /api/channels` - Get all channels
- `POST /api/channels` - Add a new channel
- `DELETE /api/channels?id={id}` - Delete a channel
- `POST /api/scrape` - Start scraping all channels
- `POST /api/questions/generate` - Generate questions from posts
- `GET /api/questions` - Get all questions
- `PATCH /api/questions` - Update question selection status

## Project Structure

```
admin-panel/
├── app/
│   ├── api/
│   │   ├── channels/
│   │   │   └── route.ts
│   │   ├── scrape/
│   │   │   └── route.ts
│   │   └── questions/
│   │       ├── route.ts
│   │       └── generate/
│   │           └── route.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── db.ts              # Database utilities
│   ├── types.ts           # TypeScript type definitions
│   ├── scraper.ts         # Telegram scraping logic
│   └── questionGenerator.ts # AI question generation
├── data/
│   └── db.json            # JSON database file
└── package.json
```

## Future Enhancements

- Add proper database (PostgreSQL, MongoDB, etc.)
- Implement authentication and user management
- Add backend API integration
- Implement real-time updates with WebSockets
- Add analytics and reporting
- Export questions to various formats (CSV, JSON)
- Add question editing capabilities
- Implement question history and versioning

## License

ISC
