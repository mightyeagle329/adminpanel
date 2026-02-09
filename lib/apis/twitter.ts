/**
 * Twitter API Client (The Old Bird V2)
 * 
 * Fetches tweets from Twitter using RapidAPI
 */

import { TwitterTweet } from '../types';

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY || '';
const RAPIDAPI_HOST = process.env.RAPIDAPI_TWITTER_HOST || 'twitter-v24.p.rapidapi.com';

/**
 * Rate limiter for Twitter API
 */
class TwitterRateLimiter {
  private lastRequest: number = 0;
  private minInterval: number = 1000; // 1 second between requests

  async wait(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    
    if (timeSinceLastRequest < this.minInterval) {
      const waitTime = this.minInterval - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequest = Date.now();
  }
}

const rateLimiter = new TwitterRateLimiter();

/**
 * Make request to Twitter API with error handling
 */
async function makeTwitterRequest(endpoint: string, params?: Record<string, string>): Promise<any> {
  await rateLimiter.wait();

  const url = new URL(`https://${RAPIDAPI_HOST}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': RAPIDAPI_HOST,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      
      // Handle specific error cases
      if (response.status === 403) {
        console.warn('Twitter API: Not subscribed or API key invalid');
        return { data: [], timeline: [], tweets: [] };
      }
      
      if (response.status === 429) {
        console.warn('Twitter API: Rate limit exceeded');
        return { data: [], timeline: [], tweets: [] };
      }
      
      throw new Error(`Twitter API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('Twitter API request failed:', error);
    // Return empty data instead of throwing
    return { data: [], timeline: [], tweets: [] };
  }
}

/**
 * Fetch tweets from a user by screen name
 */
export async function fetchUserTweets(
  username: string,
  count: number = 20
): Promise<any[]> {
  try {
    // Remove @ if present
    const cleanUsername = username.replace('@', '');

    // Different APIs might have different endpoint structures
    // Try multiple possible endpoints
    const possibleEndpoints = [
      `/user/tweets`,
      `/timeline`,
      `/user/timeline`,
    ];

    for (const endpoint of possibleEndpoints) {
      try {
        const data = await makeTwitterRequest(endpoint, {
          screen_name: cleanUsername,
          count: count.toString(),
        });

        // Handle different response structures
        if (data.timeline && Array.isArray(data.timeline) && data.timeline.length > 0) return data.timeline;
        if (data.tweets && Array.isArray(data.tweets) && data.tweets.length > 0) return data.tweets;
        if (data.data && Array.isArray(data.data) && data.data.length > 0) return data.data;
        if (Array.isArray(data) && data.length > 0) return data;
      } catch {
        // Try next endpoint
        continue;
      }
    }

    // If no endpoint worked, return empty array (graceful degradation)
    console.warn(`No tweets found for @${username} (API may not be subscribed)`);
    return [];
  } catch (error: any) {
    console.error(`Error fetching tweets for @${username}:`, error);
    // Return empty instead of throwing
    return [];
  }
}

/**
 * Search tweets by keyword
 */
export async function searchTweets(
  query: string,
  count: number = 20
): Promise<any[]> {
  try {
    const data = await makeTwitterRequest('/search', {
      q: query,
      count: count.toString(),
    });

    // Handle different response structures
    if (data.timeline) return data.timeline;
    if (data.tweets) return data.tweets;
    if (data.data) return data.data;
    if (data.statuses) return data.statuses;
    if (Array.isArray(data)) return data;

    return [];
  } catch (error: any) {
    console.error(`Error searching tweets for "${query}":`, error);
    throw new Error(`Failed to search tweets: ${error.message}`);
  }
}

/**
 * Get user information
 */
export async function getUserInfo(username: string): Promise<any> {
  try {
    const cleanUsername = username.replace('@', '');
    
    const data = await makeTwitterRequest('/user/details', {
      screen_name: cleanUsername,
    });

    return data.user || data.data || data;
  } catch (error: any) {
    console.error(`Error fetching user info for @${username}:`, error);
    throw new Error(`Failed to fetch user info: ${error.message}`);
  }
}

/**
 * Filter tweets by date
 */
export function filterTweetsByDate(
  tweets: any[],
  daysBack: number
): any[] {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  return tweets.filter(tweet => {
    const tweetDate = new Date(tweet.created_at || tweet.timestamp || tweet.date);
    return tweetDate >= cutoffDate;
  });
}

/**
 * Transform Twitter API response to standardized format
 */
export function transformTweet(tweet: any): TwitterTweet {
  return {
    id: tweet.id_str || tweet.id || '',
    text: tweet.full_text || tweet.text || '',
    created_at: tweet.created_at || tweet.timestamp || new Date().toISOString(),
    user: {
      screen_name: tweet.user?.screen_name || tweet.screen_name || '',
      name: tweet.user?.name || tweet.name || '',
      verified: tweet.user?.verified || tweet.verified || false,
    },
    favorite_count: tweet.favorite_count || tweet.likes || 0,
    retweet_count: tweet.retweet_count || tweet.retweets || 0,
    reply_count: tweet.reply_count || tweet.replies || 0,
  };
}

/**
 * Test Twitter API connection
 */
export async function testTwitterConnection(): Promise<boolean> {
  try {
    // Try to fetch tweets from a known account
    const tweets = await fetchUserTweets('elonmusk', 1);
    return tweets.length > 0;
  } catch {
    console.error('Twitter connection test failed');
    return false;
  }
}

/**
 * Validate Twitter API configuration
 */
export function validateTwitterConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!RAPIDAPI_KEY) {
    errors.push('RAPIDAPI_KEY is not configured');
  }

  if (!RAPIDAPI_HOST) {
    errors.push('RAPIDAPI_TWITTER_HOST is not configured');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
