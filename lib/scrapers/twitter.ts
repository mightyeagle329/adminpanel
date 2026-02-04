/**
 * Twitter Scraper
 * 
 * Scrapes tweets from specified Twitter accounts
 */

import { UnifiedPost, TwitterAccount } from '../types';
import { fetchUserTweets, filterTweetsByDate, transformTweet } from '../apis/twitter';

/**
 * Scrape tweets from configured Twitter accounts
 */
export async function scrapeTwitter(
  accounts: TwitterAccount[],
  daysBack: number = 2,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<UnifiedPost[]> {
  const allPosts: UnifiedPost[] = [];
  const enabledAccounts = accounts.filter(a => a.enabled);

  if (enabledAccounts.length === 0) {
    return [];
  }

  for (let i = 0; i < enabledAccounts.length; i++) {
    const account = enabledAccounts[i];
    
    if (onProgress) {
      onProgress(i + 1, enabledAccounts.length, `Fetching tweets: @${account.username}`);
    }

    try {
      // Fetch tweets from account
      const tweets = await fetchUserTweets(account.username, 50);
      console.log(`Twitter @${account.username}: Found ${tweets.length} tweets`);

      // Filter by date (last N days)
      const recentTweets = filterTweetsByDate(tweets, daysBack);
      console.log(`Twitter @${account.username}: ${recentTweets.length} tweets in last ${daysBack} days`);

      // Transform to UnifiedPost
      const posts = recentTweets.map(tweet => 
        transformTwitterToPost(tweet, account)
      );
      
      allPosts.push(...posts);
    } catch (error: any) {
      console.error(`Error scraping Twitter @${account.username}:`, error);
      // Continue with other accounts
    }
  }

  return allPosts;
}

/**
 * Transform Twitter tweet to UnifiedPost
 */
function transformTwitterToPost(
  tweet: any,
  account: TwitterAccount
): UnifiedPost {
  const transformed = transformTweet(tweet);

  return {
    id: `twitter_${transformed.id}`,
    source: 'twitter',
    sourceId: account.username,
    sourceName: `@${account.username}`,
    title: undefined,
    text: transformed.text,
    dateIso: transformed.created_at,
    url: `https://twitter.com/${transformed.user.screen_name}/status/${transformed.id}`,
    metadata: {
      likes: transformed.favorite_count,
      retweets: transformed.retweet_count,
      twitterReplies: transformed.reply_count,
      verified: transformed.user.verified,
    },
  };
}

/**
 * Get sample Twitter accounts for initial setup
 */
export function getDefaultTwitterAccounts(): TwitterAccount[] {
  return [
    {
      id: `tw_elon_${Date.now()}`,
      username: 'elonmusk',
      displayName: 'Elon Musk',
      accountType: 'person',
      addedAt: new Date().toISOString(),
      enabled: true,
    },
    {
      id: `tw_trump_${Date.now() + 1}`,
      username: 'realDonaldTrump',
      displayName: 'Donald Trump',
      accountType: 'person',
      addedAt: new Date().toISOString(),
      enabled: true,
    },
    {
      id: `tw_fed_${Date.now() + 2}`,
      username: 'federalreserve',
      displayName: 'Federal Reserve',
      accountType: 'organization',
      addedAt: new Date().toISOString(),
      enabled: true,
    },
    {
      id: `tw_vitalik_${Date.now() + 3}`,
      username: 'VitalikButerin',
      displayName: 'Vitalik Buterin',
      accountType: 'person',
      addedAt: new Date().toISOString(),
      enabled: true,
    },
    {
      id: `tw_coindesk_${Date.now() + 4}`,
      username: 'CoinDesk',
      displayName: 'CoinDesk',
      accountType: 'news',
      addedAt: new Date().toISOString(),
      enabled: true,
    },
  ];
}
