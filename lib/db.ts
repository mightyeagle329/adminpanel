// Simple JSON file-based database
import fs from 'fs/promises';
import path from 'path';
import { 
  Database, 
  TelegramChannel, 
  UnifiedPost, 
  GeneratedQuestion,
  PolymarketTopic,
  TwitterAccount,
  RSSFeed,
} from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const defaultDb: Database = {
  // Source configurations (permanent)
  telegramChannels: [],
  polymarketTopics: [],
  twitterAccounts: [],
  rssFeeds: [],
  
  // Legacy compatibility
  channels: [],
  
  // Temporary data (in-memory only)
  posts: [],
  questions: [],
};

async function ensureDbFile() {
  const dir = path.dirname(DB_PATH);
  await fs.mkdir(dir, { recursive: true });
  
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(defaultDb, null, 2));
  }
}

export async function readDb(): Promise<Database> {
  await ensureDbFile();
  const data = await fs.readFile(DB_PATH, 'utf-8');
  const db = JSON.parse(data);
  
  // Migrate old channels to add enabled field
  const migratedChannels = (db.telegramChannels || db.channels || []).map((ch: any) => ({
    ...ch,
    enabled: ch.enabled !== undefined ? ch.enabled : true, // Default to true for old channels
  }));
  
  // Ensure all new fields exist (for migration)
  return {
    ...defaultDb,
    ...db,
    telegramChannels: migratedChannels,
    channels: migratedChannels, // Keep compatibility
    polymarketTopics: (db.polymarketTopics || []).map((t: any) => ({
      ...t,
      enabled: t.enabled !== undefined ? t.enabled : true,
    })),
    twitterAccounts: (db.twitterAccounts || []).map((a: any) => ({
      ...a,
      enabled: a.enabled !== undefined ? a.enabled : true,
    })),
    rssFeeds: (db.rssFeeds || []).map((f: any) => ({
      ...f,
      enabled: f.enabled !== undefined ? f.enabled : true,
    })),
  };
}

export async function writeDb(db: Database): Promise<void> {
  await ensureDbFile();
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2));
}

// ============================================
// TELEGRAM CHANNEL OPERATIONS
// ============================================

export async function addChannel(url: string, skipDuplicateCheck = false): Promise<TelegramChannel> {
  const db = await readDb();
  
  // Extract username from URL
  const urlMatch = url.match(/t\.me\/([a-zA-Z0-9_]+)/);
  if (!urlMatch) {
    throw new Error('Invalid Telegram URL');
  }
  
  const username = urlMatch[1];
  
  // Check if channel already exists
  if (!skipDuplicateCheck && db.telegramChannels.some(ch => ch.username === username)) {
    throw new Error('Channel already exists');
  }
  
  // If skipDuplicateCheck and exists, return existing
  if (skipDuplicateCheck) {
    const existing = db.telegramChannels.find(ch => ch.username === username);
    if (existing) return existing;
  }
  
  const channel: TelegramChannel = {
    id: `tg_${Date.now()}`,
    url,
    username,
    addedAt: new Date().toISOString(),
    enabled: true,
  };
  
  db.telegramChannels.push(channel);
  db.channels = db.telegramChannels; // Keep compatibility
  await writeDb(db);
  
  return channel;
}

export async function getChannels(): Promise<TelegramChannel[]> {
  const db = await readDb();
  return db.telegramChannels;
}

export async function deleteChannel(id: string): Promise<void> {
  const db = await readDb();
  db.telegramChannels = db.telegramChannels.filter(ch => ch.id !== id);
  db.channels = db.telegramChannels; // Keep compatibility
  await writeDb(db);
}

export async function toggleChannelEnabled(id: string): Promise<void> {
  const db = await readDb();
  const channel = db.telegramChannels.find(ch => ch.id === id);
  if (channel) {
    channel.enabled = !channel.enabled;
    db.channels = db.telegramChannels;
    await writeDb(db);
  }
}

// ============================================
// POLYMARKET TOPIC OPERATIONS
// ============================================

export async function addPolymarketTopic(topic: Omit<PolymarketTopic, 'id' | 'addedAt'>): Promise<PolymarketTopic> {
  const db = await readDb();
  
  const newTopic: PolymarketTopic = {
    ...topic,
    id: `pm_${Date.now()}`,
    addedAt: new Date().toISOString(),
  };
  
  db.polymarketTopics.push(newTopic);
  await writeDb(db);
  
  return newTopic;
}

export async function getPolymarketTopics(): Promise<PolymarketTopic[]> {
  const db = await readDb();
  return db.polymarketTopics || [];
}

export async function deletePolymarketTopic(id: string): Promise<void> {
  const db = await readDb();
  db.polymarketTopics = db.polymarketTopics.filter(t => t.id !== id);
  await writeDb(db);
}

export async function togglePolymarketTopicEnabled(id: string): Promise<void> {
  const db = await readDb();
  const topic = db.polymarketTopics.find(t => t.id === id);
  if (topic) {
    topic.enabled = !topic.enabled;
    await writeDb(db);
  }
}

// ============================================
// TWITTER ACCOUNT OPERATIONS
// ============================================

export async function addTwitterAccount(account: Omit<TwitterAccount, 'id' | 'addedAt'>): Promise<TwitterAccount> {
  const db = await readDb();
  
  // Check if account already exists
  if (db.twitterAccounts.some(a => a.username.toLowerCase() === account.username.toLowerCase())) {
    throw new Error('Twitter account already exists');
  }
  
  const newAccount: TwitterAccount = {
    ...account,
    id: `tw_${Date.now()}`,
    addedAt: new Date().toISOString(),
  };
  
  db.twitterAccounts.push(newAccount);
  await writeDb(db);
  
  return newAccount;
}

export async function getTwitterAccounts(): Promise<TwitterAccount[]> {
  const db = await readDb();
  return db.twitterAccounts || [];
}

export async function deleteTwitterAccount(id: string): Promise<void> {
  const db = await readDb();
  db.twitterAccounts = db.twitterAccounts.filter(a => a.id !== id);
  await writeDb(db);
}

export async function toggleTwitterAccountEnabled(id: string): Promise<void> {
  const db = await readDb();
  const account = db.twitterAccounts.find(a => a.id === id);
  if (account) {
    account.enabled = !account.enabled;
    await writeDb(db);
  }
}

// ============================================
// RSS FEED OPERATIONS
// ============================================

export async function addRSSFeed(feed: Omit<RSSFeed, 'id' | 'addedAt'>): Promise<RSSFeed> {
  const db = await readDb();
  
  // Check if feed already exists
  if (db.rssFeeds.some(f => f.url === feed.url)) {
    throw new Error('RSS feed already exists');
  }
  
  const newFeed: RSSFeed = {
    ...feed,
    id: `rss_${Date.now()}`,
    addedAt: new Date().toISOString(),
  };
  
  db.rssFeeds.push(newFeed);
  await writeDb(db);
  
  return newFeed;
}

export async function getRSSFeeds(): Promise<RSSFeed[]> {
  const db = await readDb();
  return db.rssFeeds || [];
}

export async function deleteRSSFeed(id: string): Promise<void> {
  const db = await readDb();
  db.rssFeeds = db.rssFeeds.filter(f => f.id !== id);
  await writeDb(db);
}

export async function toggleRSSFeedEnabled(id: string): Promise<void> {
  const db = await readDb();
  const feed = db.rssFeeds.find(f => f.id === id);
  if (feed) {
    feed.enabled = !feed.enabled;
    await writeDb(db);
  }
}

// ============================================
// POST OPERATIONS (Temporary File Storage)
// ============================================

// Posts are stored in a temporary file (not permanent database)
// This allows sharing between API routes (Next.js runs in different processes)
const TEMP_POSTS_PATH = path.join(process.cwd(), 'data', 'temp-posts.json');

async function ensureTempPostsFile() {
  const dir = path.dirname(TEMP_POSTS_PATH);
  await fs.mkdir(dir, { recursive: true });
  
  try {
    await fs.access(TEMP_POSTS_PATH);
  } catch {
    await fs.writeFile(TEMP_POSTS_PATH, JSON.stringify([], null, 2));
  }
}

export async function saveUnifiedPosts(posts: UnifiedPost[]): Promise<void> {
  await ensureTempPostsFile();
  await fs.writeFile(TEMP_POSTS_PATH, JSON.stringify(posts, null, 2));
  console.log(`✅ Saved ${posts.length} posts to temp storage`);
}

export async function getUnifiedPosts(): Promise<UnifiedPost[]> {
  await ensureTempPostsFile();
  try {
    const data = await fs.readFile(TEMP_POSTS_PATH, 'utf-8');
    const posts = JSON.parse(data);
    console.log(`📖 Loaded ${posts.length} posts from temp storage`);
    return posts;
  } catch (error) {
    console.error('Error reading temp posts:', error);
    return [];
  }
}

export async function clearUnifiedPosts(): Promise<void> {
  await ensureTempPostsFile();
  await fs.writeFile(TEMP_POSTS_PATH, JSON.stringify([], null, 2));
  console.log('🗑️ Cleared temp posts');
}

// Legacy functions for backwards compatibility
export async function savePosts(posts: any[]): Promise<void> {
  await saveUnifiedPosts(posts as any);
}

export async function getPosts(): Promise<any[]> {
  return await getUnifiedPosts();
}

// Question operations
export async function saveQuestions(questions: GeneratedQuestion[]): Promise<void> {
  const db = await readDb();
  db.questions = questions;
  await writeDb(db);
}

export async function getQuestions(): Promise<GeneratedQuestion[]> {
  const db = await readDb();
  return db.questions;
}

export async function clearQuestions(): Promise<void> {
  const db = await readDb();
  db.questions = [];
  await writeDb(db);
}

export async function updateQuestion(id: string, updates: Partial<GeneratedQuestion>): Promise<void> {
  const db = await readDb();
  const index = db.questions.findIndex(q => q.id === id);
  if (index !== -1) {
    db.questions[index] = { ...db.questions[index], ...updates };
    await writeDb(db);
  }
}

export async function getSelectedQuestions(): Promise<GeneratedQuestion[]> {
  const db = await readDb();
  return db.questions.filter(q => q.selected);
}
