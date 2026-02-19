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

// ============================================
// PHASE 5 & PHASE 6 TYPES
// ============================================

// Phase 5: Market Status
export type MarketStatus = 'DRAFT' | 'OPEN' | 'LOCKED' | 'SETTLING' | 'RESOLVED' | 'VOID';

export type MarketCategory = 'CRYPTO' | 'FINANCE' | 'SPORTS' | 'HYPE' | 'GLOBAL';

export type MarketBadge = 'NONE' | '🔥 HOT' | '💎 GEM' | '🚨 BREAKING' | '🐳 WHALE' | '🔥 VIRAL' | '⚖️ VERDICT' | '⚔️ RIVALRY' | '⚡ FLASH' | '🏆 FINAL';

export type XPPromoTag = 'NONE' | '✨ 2x XP EVENT';

export interface MarketOutcome {
  label: string;
  icon_url?: string;
}

export interface Market {
  market_id: string;
  title: string;
  category: MarketCategory;
  sub_tag?: string;
  status: MarketStatus;
  banner_image_url?: string;
  badge: MarketBadge;
  xp_promo_tag: XPPromoTag;
  outcome_a: MarketOutcome;
  outcome_b: MarketOutcome;
  start_time: string;
  lock_time: string;
  resolution_time: string;
  oracle_source_url: string;
  batch_id?: string;
  created_at: string;
  updated_at: string;
  created_by: string;
  source: 'AI' | 'ADMIN';
}

// Phase 6: AI Curator
export type AIMode = 'HUMAN_REVIEW' | 'FULL_CONTROL';

export type GameMode = 'FLASH_15M' | 'HIGH_JUMP_15M' | 'MARATHON_15M' | 'CLIMAX_30M' | 'DUO_30M' | 'CURATOR_1H' | 'CURATOR_4H' | 'CURATOR_12H' | 'CURATOR_24H';

export interface AICuratorConfig {
  enabled: boolean;
  mode: AIMode;
  interval_seconds: number;
  max_markets_per_hour: number;
  auto_publish: boolean;
  flash_15m_enabled: boolean;
  high_jump_15m_enabled: boolean;
  marathon_15m_enabled: boolean;
  climax_30m_enabled: boolean;
  duo_30m_enabled: boolean;
  curator_1h_enabled: boolean;
  curator_4h_enabled: boolean;
  curator_12h_enabled: boolean;
  curator_24h_enabled: boolean;
}

export interface AICuratorStatus {
  enabled: boolean;
  mode: AIMode;
  is_running: boolean;
  last_execution?: string;
  markets_created_today: number;
  markets_pending_approval: number;
  next_execution?: string;
}

export interface AIGeneratedMarketDraft {
  draft_id: string;
  question: string;
  category: MarketCategory;
  sub_tag: string;
  badge: MarketBadge;
  outcome_a_label: string;
  outcome_b_label: string;
  duration_hours: number;
  resolution_source: string;
  batch_id: string;
  image_prompt: string;
  confidence_score: number;
  trigger_data: Record<string, any>;
  created_at: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
}

// Treasury & Risk
export interface VaultComposition {
  total_value_locked: number;
  pocket_a_clob: number;
  pocket_b_house: number;
  insurance_fund: number;
}

export interface LiabilityScenario {
  scenario_name: string;
  events: string[];
  potential_payout: number;
  current_exposure: number;
  risk_level: string;
}

// Security
export interface SybilSuspect {
  user_id: string;
  wallet_address: string;
  detection_reason: string;
  detected_at: string;
  is_shadow_banned: boolean;
  total_trades: number;
  total_volume: number;
}

// Communications
export interface GlobalBanner {
  banner_id?: string;
  message: string;
  color: 'info_blue' | 'warning_yellow' | 'critical_red';
  action_link?: string;
  enabled: boolean;
  created_at?: string;
}
