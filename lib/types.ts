// TypeScript types for the multi-source admin panel

// ============================================
// SOURCE TYPES
// ============================================

export type SourceType = 'telegram' | 'polymarket' | 'twitter' | 'rss';

export interface TelegramChannel {
  id: string;
  url: string;
  username: string;
  addedAt: string;
  enabled: boolean;
}

export interface PolymarketTopic {
  id: string;
  name: string;
  keywords: string[];
  category: 'crypto' | 'politics' | 'financial' | 'sports' | 'other';
  addedAt: string;
  enabled: boolean;
}

export interface TwitterAccount {
  id: string;
  username: string;
  displayName: string;
  accountType: 'person' | 'organization' | 'news' | 'other';
  addedAt: string;
  enabled: boolean;
}

export interface RSSFeed {
  id: string;
  name: string;
  url: string;
  category: 'crypto' | 'politics' | 'financial' | 'general';
  addedAt: string;
  enabled: boolean;
}

// ============================================
// POST TYPES
// ============================================

// Legacy ScrapedPost (for backwards compatibility)
export interface ScrapedPost {
  id: string;
  channelTitle: string;
  username: string;
  messageId: string;
  dateIso: string;
  text: string;
  views?: number;
  forwards?: number;
  replies?: number;
  permalink: string;
}

// New unified post structure for all sources
export interface UnifiedPost {
  id: string;
  source: SourceType;
  sourceId: string;        // Channel username, account name, topic ID, or feed name
  sourceName: string;      // Display name
  title?: string;          // Optional title (for Polymarket events, RSS articles)
  text: string;            // Main content
  dateIso: string;         // ISO timestamp
  url: string;             // Permalink to original
  metadata: PostMetadata;
}

export interface PostMetadata {
  // Telegram
  views?: number;
  forwards?: number;
  replies?: number;
  
  // Polymarket
  volume?: number;
  probability?: number;
  endDate?: string;
  
  // Twitter
  likes?: number;
  retweets?: number;
  twitterReplies?: number;
  verified?: boolean;
  
  // RSS
  author?: string;
  categories?: string[];
  
  // General
  imageUrl?: string;
  videoUrl?: string;
}

// ============================================
// QUESTION TYPES
// ============================================

export interface GeneratedQuestion {
  id: string;
  question: string;
  sourceIds: string[];
  sources?: SourceType[];  // NEW: Track which source types used
  selected: boolean;
  createdAt: string;
}

// ============================================
// PROGRESS TYPES
// ============================================

export interface ScrapeProgress {
  status: 'idle' | 'scraping' | 'completed' | 'error';
  progress: number;
  total: number;
  currentSource?: string;
  currentChannel?: string;
  message?: string;
  sourceBreakdown?: {
    telegram: { completed: number; total: number };
    polymarket: { completed: number; total: number };
    twitter: { completed: number; total: number };
    rss: { completed: number; total: number };
  };
}

export interface QuestionGenerationProgress {
  status: 'idle' | 'generating' | 'completed' | 'error';
  progress: number;
  total: number;
  message?: string;
}

// ============================================
// DATABASE TYPES
// ============================================

export interface Database {
  // Source configurations (permanent)
  telegramChannels: TelegramChannel[];
  polymarketTopics: PolymarketTopic[];
  twitterAccounts: TwitterAccount[];
  rssFeeds: RSSFeed[];
  
  // Legacy compatibility
  channels: TelegramChannel[];  // Alias for telegramChannels
  
  // Scraped data (in-memory, temporary)
  posts: UnifiedPost[];
  
  // Generated questions (session + permanent files)
  questions: GeneratedQuestion[];
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PolymarketMarket {
  id: string;
  question: string;
  description: string;
  end_date_iso: string;
  active: boolean;
  volume: number;
  outcomes: Array<{
    outcome: string;
    price: number;
    probability: number;
  }>;
}

export interface TwitterTweet {
  id: string;
  text: string;
  created_at: string;
  user: {
    screen_name: string;
    name: string;
    verified: boolean;
  };
  favorite_count: number;
  retweet_count: number;
  reply_count: number;
}

export interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
  contentSnippet?: string;
  author?: string;
  categories?: string[];
}
