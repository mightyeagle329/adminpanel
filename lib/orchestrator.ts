/**
 * Scraper Orchestrator
 * 
 * Coordinates all scraping sources and manages the scraping process
 */

import { UnifiedPost, ScrapeProgress } from './types';
import { getChannels } from './db';
import { getPolymarketTopics } from './db';
import { getTwitterAccounts } from './db';
import { getRSSFeeds } from './db';
import { scrapeChannelRecentPosts } from './scraper';
import { scrapePolymarket } from './scrapers/polymarket';
import { scrapeTwitter } from './scrapers/twitter';
import { scrapeRSS } from './scrapers/rss';

export interface OrchestratorOptions {
  daysBack?: number;
  sources?: {
    telegram?: boolean;
    polymarket?: boolean;
    twitter?: boolean;
    rss?: boolean;
  };
  onProgress?: (progress: ScrapeProgress) => void;
}

export interface ScrapeResult {
  success: boolean;
  posts: UnifiedPost[];
  errors: Array<{ source: string; error: string }>;
  stats: {
    telegram: number;
    polymarket: number;
    twitter: number;
    rss: number;
    total: number;
  };
}

/**
 * Main orchestrator function - scrapes all enabled sources
 */
export async function scrapeAllSources(
  options: OrchestratorOptions = {}
): Promise<ScrapeResult> {
  const {
    daysBack = 2,
    sources = { telegram: true, polymarket: true, twitter: true, rss: true },
    onProgress,
  } = options;

  const allPosts: UnifiedPost[] = [];
  const errors: Array<{ source: string; error: string }> = [];
  const stats = { telegram: 0, polymarket: 0, twitter: 0, rss: 0, total: 0 };

  let totalSources = 0;
  let completedSources = 0;

  // Count enabled sources
  if (sources.telegram) totalSources++;
  if (sources.polymarket) totalSources++;
  if (sources.twitter) totalSources++;
  if (sources.rss) totalSources++;

  // Helper to update progress
  const updateProgress = (message: string) => {
    if (onProgress) {
      onProgress({
        status: 'scraping',
        progress: completedSources,
        total: totalSources,
        message,
        sourceBreakdown: {
          telegram: { completed: stats.telegram, total: 0 },
          polymarket: { completed: stats.polymarket, total: 0 },
          twitter: { completed: stats.twitter, total: 0 },
          rss: { completed: stats.rss, total: 0 },
        },
      });
    }
  };

  // ============================================
  // 1. Scrape Telegram
  // ============================================
  if (sources.telegram) {
    try {
      updateProgress('📺 Scraping Telegram channels...');
      
      const channels = await getChannels();
      const enabledChannels = channels.filter(ch => ch.enabled !== false); // Default to enabled if not specified

      console.log(`Telegram: Found ${channels.length} channels, ${enabledChannels.length} enabled`);

      if (enabledChannels.length > 0) {
        // Import prepareChannel helper
        const { prepareChannel } = await import('./scraper');
        
        // Scrape each channel
        const telegramPostsRaw: any[] = [];
        
        for (const ch of enabledChannels) {
          try {
            const channel = prepareChannel(ch.url, ch.username);
            console.log(`Scraping Telegram: @${ch.username}`);
            const result = await scrapeChannelRecentPosts({
              channel,
              daysBack,
            });
            console.log(`Telegram @${ch.username}: Found ${result.posts.length} posts`);
            telegramPostsRaw.push(...result.posts);
          } catch (error: any) {
            console.error(`Error scraping Telegram channel ${ch.username}:`, error.message);
          }
        }

        // Convert to UnifiedPost format
        const telegramPosts: UnifiedPost[] = telegramPostsRaw.map((post, index) => ({
          id: `telegram_${post.id || `${post.username}_${Date.now()}_${index}`}`,
          source: 'telegram' as const,
          sourceId: post.username || 'unknown',
          sourceName: post.channelTitle || post.username || 'Unknown Channel',
          text: post.text || '',
          dateIso: post.dateIso || new Date().toISOString(),
          url: post.permalink || `https://t.me/${post.username}`,
          metadata: {
            views: post.views || 0,
            forwards: post.forwards || 0,
            replies: post.replies || 0,
          },
        }));

        allPosts.push(...telegramPosts);
        stats.telegram = telegramPosts.length;
      }

      completedSources++;
    } catch (error: any) {
      errors.push({ source: 'telegram', error: error.message });
      completedSources++;
    }
  }

  // ============================================
  // 2. Scrape Polymarket
  // ============================================
  if (sources.polymarket) {
    try {
      updateProgress('📊 Scraping Polymarket markets...');
      
      const topics = await getPolymarketTopics();
      console.log(`Polymarket: Found ${topics.length} topics`);
      
      const polymarketPosts = await scrapePolymarket(topics, daysBack);
      console.log(`Polymarket: Scraped ${polymarketPosts.length} posts`);
      
      allPosts.push(...polymarketPosts);
      stats.polymarket = polymarketPosts.length;
      
      completedSources++;
    } catch (error: any) {
      errors.push({ source: 'polymarket', error: error.message });
      completedSources++;
    }
  }

  // ============================================
  // 3. Scrape Twitter
  // ============================================
  if (sources.twitter) {
    try {
      updateProgress('🐦 Scraping Twitter accounts...');
      
      const accounts = await getTwitterAccounts();
      console.log(`Twitter: Found ${accounts.length} accounts`);
      
      const twitterPosts = await scrapeTwitter(accounts, daysBack);
      console.log(`Twitter: Scraped ${twitterPosts.length} posts`);
      
      allPosts.push(...twitterPosts);
      stats.twitter = twitterPosts.length;
      
      completedSources++;
    } catch (error: any) {
      errors.push({ source: 'twitter', error: error.message });
      completedSources++;
    }
  }

  // ============================================
  // 4. Scrape RSS Feeds
  // ============================================
  if (sources.rss) {
    try {
      updateProgress('📰 Scraping RSS feeds...');
      
      const feeds = await getRSSFeeds();
      const rssPosts = await scrapeRSS(feeds, daysBack);
      
      allPosts.push(...rssPosts);
      stats.rss = rssPosts.length;
      
      completedSources++;
    } catch (error: any) {
      errors.push({ source: 'rss', error: error.message });
      completedSources++;
    }
  }

  // ============================================
  // Calculate total
  // ============================================
  stats.total = allPosts.length;

  // Sort by date (newest first)
  allPosts.sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime());

  // Final progress update
  if (onProgress) {
    onProgress({
      status: 'completed',
      progress: totalSources,
      total: totalSources,
      message: `Completed! Found ${stats.total} posts from ${totalSources} sources`,
      sourceBreakdown: {
        telegram: { completed: stats.telegram, total: stats.telegram },
        polymarket: { completed: stats.polymarket, total: stats.polymarket },
        twitter: { completed: stats.twitter, total: stats.twitter },
        rss: { completed: stats.rss, total: stats.rss },
      },
    });
  }

  return {
    success: errors.length === 0,
    posts: allPosts,
    errors,
    stats,
  };
}

/**
 * Initialize default sources if database is empty
 */
export async function initializeDefaultSources(): Promise<void> {
  const { 
    addPolymarketTopic, 
    addTwitterAccount, 
    addRSSFeed 
  } = await import('./db');
  
  const { getDefaultPolymarketTopics } = await import('./scrapers/polymarket');
  const { getDefaultTwitterAccounts } = await import('./scrapers/twitter');
  const { getDefaultRSSFeeds } = await import('./scrapers/rss');

  // Check if sources already exist
  const polymarketTopics = await getPolymarketTopics();
  const twitterAccounts = await getTwitterAccounts();
  const rssFeeds = await getRSSFeeds();

  // Add default Polymarket topics if none exist
  if (polymarketTopics.length === 0) {
    const defaultTopics = getDefaultPolymarketTopics();
    for (const topic of defaultTopics) {
      try {
        await addPolymarketTopic({
          name: topic.name,
          keywords: topic.keywords,
          category: topic.category,
          enabled: topic.enabled,
        });
      } catch (error) {
        console.error('Error adding default Polymarket topic:', error);
      }
    }
  }

  // Add default Twitter accounts if none exist
  if (twitterAccounts.length === 0) {
    const defaultAccounts = getDefaultTwitterAccounts();
    for (const account of defaultAccounts) {
      try {
        await addTwitterAccount({
          username: account.username,
          displayName: account.displayName,
          accountType: account.accountType,
          enabled: account.enabled,
        });
      } catch (error) {
        console.error('Error adding default Twitter account:', error);
      }
    }
  }

  // Add default RSS feeds if none exist
  if (rssFeeds.length === 0) {
    const defaultFeeds = getDefaultRSSFeeds();
    for (const feed of defaultFeeds) {
      try {
        await addRSSFeed({
          name: feed.name,
          url: feed.url,
          category: feed.category,
          enabled: feed.enabled,
        });
      } catch (error) {
        console.error('Error adding default RSS feed:', error);
      }
    }
  }
}
