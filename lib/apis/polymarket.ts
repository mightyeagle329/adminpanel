/**
 * Polymarket API Client
 * 
 * Fetches prediction market data from Polymarket's free public API
 */

import { PolymarketMarket } from '../types';

// const POLYMARKET_API_URL = process.env.POLYMARKET_API_URL || 'https://clob.polymarket.com';

export interface PolymarketApiResponse {
  data: any[];
  count: number;
  next_cursor?: string;
}

/**
 * Fetch all active markets from Polymarket
 * Tries multiple API endpoints for better compatibility
 */
export async function fetchPolymarketMarkets(): Promise<any[]> {
  // Try multiple Polymarket API endpoints
  // Request active markets (not closed)
  const endpoints = [
    'https://gamma-api.polymarket.com/markets?closed=false&limit=500',
    'https://gamma-api.polymarket.com/markets?active=true&limit=500',
    'https://strapi-matic.poly.market/markets?active=true&_limit=500',
    'https://gamma-api.polymarket.com/markets?limit=500',
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`Trying Polymarket: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        console.warn(`Polymarket ${endpoint}: ${response.status}`);
        continue;
      }

      const data = await response.json();
      
      // Handle different response formats
      let markets: any[] = [];
      
      if (Array.isArray(data)) {
        markets = data;
      } else if (data.markets && Array.isArray(data.markets)) {
        markets = data.markets;
      } else if (data.data && Array.isArray(data.data)) {
        markets = data.data;
      }
      
      if (markets.length > 0) {
        console.log(`✅ Polymarket: Found ${markets.length} markets from ${endpoint}`);
        return markets;
      }
    } catch (error: any) {
      console.warn(`Polymarket endpoint ${endpoint} failed:`, error.message);
      continue;
    }
  }

  console.warn('⚠️ All Polymarket endpoints returned no data');
  return [];
}

/**
 * Filter markets by keywords
 */
export function filterMarketsByKeywords(
  markets: any[],
  keywords: string[]
): any[] {
  if (keywords.length === 0) {
    return markets;
  }

  const lowerKeywords = keywords.map(k => k.toLowerCase());

  return markets.filter(market => {
    const question = (market.question || '').toLowerCase();
    const description = (market.description || '').toLowerCase();
    const searchText = `${question} ${description}`;

    return lowerKeywords.some(keyword => searchText.includes(keyword));
  });
}

/**
 * Filter markets by date (last N days)
 * More lenient - includes markets that are active OR updated recently
 */
export function filterMarketsByDate(
  markets: any[],
  daysBack: number
): any[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return markets.filter(market => {
    // Check multiple date fields (created, updated, or end date in future)
    const createdAt = market.created_at || market.start_date_iso || market.createdAt;
    const updatedAt = market.updated_at || market.last_updated || market.updatedAt;
    const endDate = market.end_date_iso || market.end_time || market.endDate;
    
    // Include if created recently
    if (createdAt) {
      const marketDate = new Date(createdAt);
      if (marketDate >= cutoffDate) return true;
    }
    
    // Include if updated recently
    if (updatedAt) {
      const updateDate = new Date(updatedAt);
      if (updateDate >= cutoffDate) return true;
    }
    
    // Include if still active (end date in future) - these are relevant
    if (endDate) {
      const end = new Date(endDate);
      if (end > new Date()) return true;
    }

    return false;
  });
}

/**
 * Get active/relevant markets
 * Focus on markets that are live and tradeable
 */
export function filterActiveMarkets(markets: any[]): any[] {
  const now = new Date();
  
  return markets.filter(market => {
    // Skip archived markets
    if (market.archived === true) {
      return false;
    }

    // Skip if explicitly closed (but be lenient)
    if (market.closed === true) {
      return false;
    }

    // Check end date is in the future
    const endDate = market.endDate || market.end_date_iso || market.endDateIso || market.end_date;
    if (endDate) {
      const end = new Date(endDate);
      if (end <= now) {
        return false; // Already ended
      }
    }

    // If market is active, include it
    if (market.active === true || market.active === undefined) {
      return true;
    }

    return false;
  });
}

type OutcomeItem = { outcome: string; price: number; probability: number };

/**
 * Parse outcomes and outcomePrices from Gamma API (can be JSON strings or arrays)
 */
function parseOutcomesArray(market: any): OutcomeItem[] {
  const rawOutcomes = market.outcomes;
  const rawPrices = market.outcomePrices ?? market.prices;

  // Already an array of objects with outcome/price
  if (Array.isArray(rawOutcomes) && rawOutcomes.length > 0) {
    const first = rawOutcomes[0];
    if (first && typeof first === 'object' && ('outcome' in first || 'price' in first)) {
      return rawOutcomes.map((o: any) => {
        const p = parseFloat(o.probability ?? o.price ?? 0);
        const price = p <= 1 && p >= 0 ? p : p / 100;
        const probability = p <= 1 && p >= 0 ? p * 100 : p;
        return {
          outcome: o.outcome ?? (o.token_id ? 'Yes' : 'No'),
          price,
          probability,
        };
      });
    }
  }

  // Gamma API: outcomes and outcomePrices as JSON strings e.g. "[\"Yes\", \"No\"]" and "[\"0.65\", \"0.35\"]"
  let outcomesList: string[] = [];
  let pricesList: string[] = [];

  if (typeof rawOutcomes === 'string') {
    try {
      outcomesList = JSON.parse(rawOutcomes) as string[];
    } catch {
      outcomesList = rawOutcomes.split(',').map((s: string) => s.trim());
    }
  } else if (Array.isArray(rawOutcomes)) {
    outcomesList = rawOutcomes.map(String);
  }

  if (typeof rawPrices === 'string') {
    try {
      pricesList = JSON.parse(rawPrices) as string[];
    } catch {
      pricesList = rawPrices.split(',').map((s: string) => s.trim());
    }
  } else if (Array.isArray(rawPrices)) {
    pricesList = rawPrices.map(String);
  }

  if (outcomesList.length === 0 && market.tokens?.length) {
    return market.tokens.map((t: any, i: number) => {
      const price = parseFloat(t.price ?? 0);
      return {
        outcome: t.outcome || (i === 0 ? 'Yes' : 'No'),
        price,
        probability: price * 100,
      };
    });
  }

  return outcomesList.map((outcome: string, i: number) => {
    const price = parseFloat(pricesList[i] ?? '0');
    return {
      outcome,
      price,
      probability: price * 100,
    };
  });
}

/**
 * Transform Polymarket market to standardized format
 */
export function transformPolymarketMarket(market: any): PolymarketMarket {
  const outcomes = parseOutcomesArray(market);
  return {
    id: market.condition_id || market.id,
    question: market.question || market.title || '',
    description: market.description || '',
    end_date_iso: market.end_date_iso || market.end_time || '',
    active: market.active !== false && !market.closed,
    volume: parseFloat(market.volume || market.volume_24h || 0),
    outcomes,
  };
}

/**
 * Fetch and filter markets by keywords and date
 */
export async function fetchFilteredMarkets(
  keywords: string[],
  _daysBack: number = 2
): Promise<PolymarketMarket[]> {
  try {
    // Fetch all markets
    const allMarkets = await fetchPolymarketMarkets();
    console.log(`Polymarket: Fetched ${allMarkets.length} total markets`);

    // Apply filters in order
    let filtered = allMarkets;
    
    // 1. Filter by active status (NOT closed, end date in future)
    filtered = filterActiveMarkets(filtered);
    console.log(`Polymarket: ${filtered.length} active markets (after filtering closed)`);
    
    // 2. Filter by keywords (if any)
    if (keywords.length > 0) {
      const beforeKeywords = filtered.length;
      filtered = filterMarketsByKeywords(filtered, keywords);
      console.log(`Polymarket: ${filtered.length} markets match keywords (was ${beforeKeywords})`);
    }
    
    // 3. Skip date filter - use all active markets regardless of creation date
    // Active markets are relevant even if created months ago
    // filtered = filterMarketsByDate(filtered, daysBack);

    // Transform to standardized format
    const result = filtered.map(transformPolymarketMarket);
    console.log(`Polymarket: Returning ${result.length} markets`);
    return result;
  } catch (error: any) {
    console.error('Error in fetchFilteredMarkets:', error);
    return []; // Return empty instead of throwing
  }
}

/**
 * Test Polymarket API connection
 */
export async function testPolymarketConnection(): Promise<boolean> {
  try {
    const markets = await fetchPolymarketMarkets();
    return markets.length > 0;
  } catch (error) {
    console.error('Polymarket connection test failed:', error);
    return false;
  }
}
