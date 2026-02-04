// API route for scraping Telegram channels
import { NextResponse } from 'next/server';
import { getChannels, savePosts } from '@/lib/db';
import { scrapeChannelRecentPosts, prepareChannel } from '@/lib/scraper';
import { ScrapedPost } from '@/lib/types';

export async function POST() {
  try {
    const channels = await getChannels();

    if (channels.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No channels found' },
        { status: 400 }
      );
    }

    const allPosts: ScrapedPost[] = [];
    let completed = 0;

    for (const channel of channels) {
      const preparedChannel = prepareChannel(channel.url, channel.username);
      
      const result = await scrapeChannelRecentPosts({
        channel: preparedChannel,
        daysBack: 2,
        maxPages: 20,
        requestDelayMs: 800,
      });

      for (const post of result.posts) {
        allPosts.push({
          id: `${channel.username}/${post.messageId}`,
          channelTitle: result.channelTitle,
          username: channel.username,
          messageId: post.messageId,
          dateIso: post.date.toISOString(),
          text: post.text,
          views: post.views,
          forwards: post.forwards,
          replies: post.replies,
          permalink: post.permalink,
        });
      }

      completed++;
    }

    await savePosts(allPosts);

    return NextResponse.json({
      success: true,
      postsCount: allPosts.length,
      channelsScraped: completed,
    });
  } catch (error: any) {
    console.error('Scraping error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const channels = await getChannels();
    return NextResponse.json({
      success: true,
      channelsCount: channels.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
