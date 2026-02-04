/**
 * RSS Feed Scraper
 * 
 * Scrapes news from RSS feeds
 */

import { UnifiedPost, RSSFeed } from '../types';
import { fetchMultipleRSSFeeds, filterRSSByDate, RSS_FEEDS } from '../apis/rss';

/**
 * Scrape RSS feeds based on configured sources
 */
export async function scrapeRSS(
  feeds: RSSFeed[],
  daysBack: number = 2,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<UnifiedPost[]> {
  const allPosts: UnifiedPost[] = [];
  const enabledFeeds = feeds.filter(f => f.enabled);

  if (enabledFeeds.length === 0) {
    return [];
  }

  if (onProgress) {
    onProgress(0, enabledFeeds.length, 'Fetching RSS feeds...');
  }

  try {
    // Fetch all feeds in parallel
    const results = await fetchMultipleRSSFeeds(
      enabledFeeds.map(f => ({
        name: f.name,
        url: f.url,
        category: f.category,
      }))
    );

    // Transform all items to UnifiedPost
    results.forEach((result, index) => {
      const feed = enabledFeeds[index];
      
      if (onProgress) {
        onProgress(index + 1, enabledFeeds.length, `Processing: ${result.feedName}`);
      }

      // Filter by date
      const recentItems = filterRSSByDate(result.items, daysBack);

      // Transform to UnifiedPost with index to ensure unique IDs
      const posts = recentItems.map((item, itemIndex) => 
        transformRSSToPost(item, feed, result.feedName, itemIndex)
      );
      
      allPosts.push(...posts);
    });
  } catch (error: any) {
    console.error('Error scraping RSS feeds:', error);
  }

  return allPosts;
}

/**
 * Transform RSS item to UnifiedPost (overload without index - kept for compatibility)
 */
function transformRSSToPost(
  item: any,
  feed: RSSFeed,
  feedName: string,
  index?: number
): UnifiedPost {
  // Create a *truly* unique ID to avoid duplicates across many items.
  // NOTE: Previously we truncated the base64 string which caused different
  // items to collapse to the same ID (and then be de-duped in the UI),
  // leading to mismatched counts between the scrape stats and All Data page.
  const timestamp = new Date(item.pubDate || item.isoDate || Date.now()).getTime();
  const linkHash = item.link ? Buffer.from(item.link).toString('base64') : '';
  const idx = index !== undefined ? index : Math.floor(Math.random() * 10000);
  const rawId = `${feed.id || feed.name}__${linkHash || 'nolink'}__${timestamp}__${idx}`;
  // Keep full base64 (no substring) so collisions are extremely unlikely
  const postId = Buffer.from(rawId).toString('base64').replace(/=+$/g, '');

  return {
    id: `rss_${postId}`,
    source: 'rss',
    sourceId: feed.id || feed.name,
    sourceName: feedName,
    title: item.title || '',
    text: item.contentSnippet || item.content || item.description || item.title || '',
    dateIso: item.isoDate || (item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()),
    url: item.link || '',
    metadata: {
      author: item.author || item.creator || '',
      categories: item.categories || [],
    },
  };
}

/**
 * Get default RSS feeds for initial setup
 */
export function getDefaultRSSFeeds(): RSSFeed[] {
  const allFeeds: RSSFeed[] = [];
  let idCounter = 0;

  // Add crypto feeds
  RSS_FEEDS.crypto.forEach(feed => {
    allFeeds.push({
      id: `rss_${feed.category}_${idCounter++}`,
      name: feed.name,
      url: feed.url,
      category: feed.category,
      addedAt: new Date().toISOString(),
      enabled: true,
    });
  });

  // Add financial feeds
  RSS_FEEDS.financial.forEach(feed => {
    allFeeds.push({
      id: `rss_${feed.category}_${idCounter++}`,
      name: feed.name,
      url: feed.url,
      category: feed.category,
      addedAt: new Date().toISOString(),
      enabled: true,
    });
  });

  // Add politics feeds
  RSS_FEEDS.politics.forEach(feed => {
    allFeeds.push({
      id: `rss_${feed.category}_${idCounter++}`,
      name: feed.name,
      url: feed.url,
      category: feed.category,
      addedAt: new Date().toISOString(),
      enabled: true,
    });
  });

  return allFeeds;
}
