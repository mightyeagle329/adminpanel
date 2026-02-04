/**
 * RSS Feed Parser
 * 
 * Fetches and parses RSS feeds from various news sources
 */

import Parser from 'rss-parser';
import { RSSItem } from '../types';

const parser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)',
  },
});

/**
 * Predefined RSS feed sources
 */
export const RSS_FEEDS = {
  crypto: [
    {
      name: 'CoinDesk',
      url: 'https://www.coindesk.com/arc/outboundfeeds/rss/',
      category: 'crypto' as const,
    },
    {
      name: 'Cointelegraph',
      url: 'https://cointelegraph.com/rss',
      category: 'crypto' as const,
    },
    {
      name: 'CryptoSlate',
      url: 'https://cryptoslate.com/feed/',
      category: 'crypto' as const,
    },
    {
      name: 'Decrypt',
      url: 'https://decrypt.co/feed',
      category: 'crypto' as const,
    },
  ],
  financial: [
    {
      name: 'Reuters Business',
      url: 'https://www.reuters.com/rssfeed/businessNews',
      category: 'financial' as const,
    },
    {
      name: 'Bloomberg Markets',
      url: 'https://feeds.bloomberg.com/markets/news.rss',
      category: 'financial' as const,
    },
    {
      name: 'CNBC',
      url: 'https://www.cnbc.com/id/100003114/device/rss/rss.html',
      category: 'financial' as const,
    },
  ],
  politics: [
    {
      name: 'The Hill',
      url: 'https://thehill.com/feed/',
      category: 'politics' as const,
    },
    {
      name: 'Politico',
      url: 'https://www.politico.com/rss/politics08.xml',
      category: 'politics' as const,
    },
    {
      name: 'CNN Politics',
      url: 'http://rss.cnn.com/rss/cnn_allpolitics.rss',
      category: 'politics' as const,
    },
  ],
};

/**
 * Fetch and parse a single RSS feed
 */
export async function fetchRSSFeed(url: string, feedName: string): Promise<RSSItem[]> {
  try {
    const feed = await parser.parseURL(url);

    return feed.items.map(item => ({
      title: item.title || '',
      link: item.link || '',
      pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
      content: item.content || item['content:encoded'] || '',
      contentSnippet: item.contentSnippet || '',
      author: item.creator || item.author || feedName,
      categories: item.categories || [],
    }));
  } catch (error: any) {
    console.error(`Error fetching RSS feed ${feedName}:`, error);
    throw new Error(`Failed to fetch ${feedName}: ${error.message}`);
  }
}

/**
 * Fetch multiple RSS feeds in parallel
 */
export async function fetchMultipleRSSFeeds(
  feeds: Array<{ name: string; url: string; category: string }>
): Promise<Array<{ feedName: string; items: RSSItem[]; category: string }>> {
  const results = await Promise.allSettled(
    feeds.map(async feed => {
      const items = await fetchRSSFeed(feed.url, feed.name);
      return {
        feedName: feed.name,
        items,
        category: feed.category,
      };
    })
  );

  return results
    .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
    .map(result => result.value);
}

/**
 * Filter RSS items by date
 */
export function filterRSSByDate(
  items: RSSItem[],
  daysBack: number
): RSSItem[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return items.filter(item => {
    const itemDate = new Date(item.pubDate);
    return itemDate >= cutoffDate;
  });
}

/**
 * Filter RSS items by keywords
 */
export function filterRSSByKeywords(
  items: RSSItem[],
  keywords: string[]
): RSSItem[] {
  if (keywords.length === 0) {
    return items;
  }

  const lowerKeywords = keywords.map(k => k.toLowerCase());

  return items.filter(item => {
    const title = (item.title || '').toLowerCase();
    const content = (item.contentSnippet || item.content || '').toLowerCase();
    const searchText = `${title} ${content}`;

    return lowerKeywords.some(keyword => searchText.includes(keyword));
  });
}

/**
 * Fetch all predefined feeds by category
 */
export async function fetchFeedsByCategory(
  category: 'crypto' | 'financial' | 'politics',
  daysBack: number = 2
): Promise<Array<{ feedName: string; items: RSSItem[]; category: string }>> {
  const feeds = RSS_FEEDS[category];
  const results = await fetchMultipleRSSFeeds(feeds);

  // Filter by date
  return results.map(result => ({
    ...result,
    items: filterRSSByDate(result.items, daysBack),
  }));
}

/**
 * Test RSS feed connection
 */
export async function testRSSConnection(): Promise<boolean> {
  try {
    const items = await fetchRSSFeed(RSS_FEEDS.crypto[0].url, RSS_FEEDS.crypto[0].name);
    return items.length > 0;
  } catch (error) {
    console.error('RSS connection test failed:', error);
    return false;
  }
}
