/**
 * Polymarket Scraper
 * 
 * Scrapes prediction market data from Polymarket
 */

import { UnifiedPost, PolymarketTopic } from '../types';
import { fetchFilteredMarkets } from '../apis/polymarket';

/**
 * Scrape Polymarket markets based on configured topics
 */
export async function scrapePolymarket(
  topics: PolymarketTopic[],
  daysBack: number = 2,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<UnifiedPost[]> {
  const allPosts: UnifiedPost[] = [];
  const enabledTopics = topics.filter(t => t.enabled);

  if (enabledTopics.length === 0) {
    return [];
  }

  for (let i = 0; i < enabledTopics.length; i++) {
    const topic = enabledTopics[i];
    
    if (onProgress) {
      onProgress(i + 1, enabledTopics.length, `Fetching Polymarket: ${topic.name}`);
    }

    try {
      // Fetch markets filtered by topic keywords
      const markets = await fetchFilteredMarkets(topic.keywords, daysBack);
      console.log(`Polymarket topic "${topic.name}": Found ${markets.length} markets`);

      // Transform to UnifiedPost
      const posts = markets.map(market => transformPolymarketToPost(market, topic));
      allPosts.push(...posts);
    } catch (error: any) {
      console.error(`Error scraping Polymarket topic "${topic.name}":`, error);
      // Continue with other topics
    }
  }

  return allPosts;
}

/**
 * Transform Polymarket market to UnifiedPost
 */
function transformPolymarketToPost(
  market: any,
  topic: PolymarketTopic
): UnifiedPost {
  const yesOutcome = market.outcomes?.find((o: any) => o.outcome === 'Yes');
  const probability = yesOutcome?.probability || 0;

  return {
    id: `polymarket_${market.id}`,
    source: 'polymarket',
    sourceId: topic.id,
    sourceName: topic.name,
    title: market.question,
    text: market.description || market.question,
    dateIso: new Date().toISOString(), // Polymarket doesn't always have creation date
    url: `https://polymarket.com/event/${market.id}`,
    metadata: {
      volume: market.volume,
      probability: probability,
      endDate: market.end_date_iso,
    },
  };
}

/**
 * Get sample Polymarket topics for initial setup
 */
export function getDefaultPolymarketTopics(): PolymarketTopic[] {
  return [
    {
      id: `pm_crypto_${Date.now()}`,
      name: 'Crypto Markets',
      keywords: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency', 'solana', 'cardano'],
      category: 'crypto',
      addedAt: new Date().toISOString(),
      enabled: true,
    },
    {
      id: `pm_trump_${Date.now() + 1}`,
      name: 'Trump & Politics',
      keywords: ['trump', 'donald trump', 'election', 'republican', 'president', 'maga'],
      category: 'politics',
      addedAt: new Date().toISOString(),
      enabled: true,
    },
    {
      id: `pm_financial_${Date.now() + 2}`,
      name: 'Economy & Fed',
      keywords: ['fed', 'federal reserve', 'powell', 'inflation', 'interest rate', 'economy'],
      category: 'financial',
      addedAt: new Date().toISOString(),
      enabled: true,
    },
  ];
}
