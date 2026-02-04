import { NextRequest, NextResponse } from 'next/server';
import { scrapeAllSources } from '@/lib/orchestrator';
import { saveUnifiedPosts } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for Vercel

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      daysBack = 2,
      sources = { telegram: true, polymarket: true, twitter: true, rss: true }
    } = body;

    // Scrape all sources
    const result = await scrapeAllSources({
      daysBack,
      sources,
    });

    // Save to in-memory storage
    await saveUnifiedPosts(result.posts);

    return NextResponse.json({
      success: result.success,
      stats: result.stats,
      errors: result.errors,
      message: `Scraped ${result.stats.total} posts from ${Object.keys(sources).filter(k => sources[k as keyof typeof sources]).length} sources`,
    });
  } catch (error: any) {
    console.error('Error in scrape-all:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
