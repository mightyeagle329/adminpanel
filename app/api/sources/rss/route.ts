// API route for RSS feeds – uses FastAPI backend when available
import { NextRequest, NextResponse } from 'next/server';
import {
  getRSSFeeds,
  addRSSFeed,
  deleteRSSFeed,
  toggleRSSFeedEnabled,
} from '@/lib/db';
import { fastApiClient } from '@/lib/fastApiClient';

const USE_FASTAPI = !!process.env.NEXT_PUBLIC_FASTAPI_URL;

function toFeedFrontend(f: Record<string, unknown>) {
  return {
    id: f.id,
    name: f.name,
    url: f.url,
    category: f.category,
    addedAt: (f as Record<string, string>).added_at ?? f.addedAt,
    enabled: f.enabled !== false,
  };
}

export async function GET() {
  try {
    if (USE_FASTAPI) {
      try {
        const list = await fastApiClient.getRSSFeeds();
        const feeds = (list || []).map(toFeedFrontend);
        return NextResponse.json({ success: true, feeds });
      } catch (e) {
        console.error('FastAPI RSS GET failed:', e);
      }
    }
    const feeds = await getRSSFeeds();
    return NextResponse.json({ success: true, feeds });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, category = 'general', enabled = true } = body;

    if (!name || !url) {
      return NextResponse.json({ success: false, error: 'Name and URL are required' }, { status: 400 });
    }

    if (USE_FASTAPI) {
      try {
        const feed = await fastApiClient.addRSSFeed({ name, url, category });
        return NextResponse.json({ success: true, feed: toFeedFrontend(feed as Record<string, unknown>) });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 400 });
      }
    }

    const feed = await addRSSFeed({ name, url, category, enabled });
    return NextResponse.json({ success: true, feed });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Feed ID required' }, { status: 400 });
    }

    if (USE_FASTAPI) {
      try {
        await fastApiClient.deleteRSSFeed(id);
        return NextResponse.json({ success: true });
      } catch (e) {
        return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
      }
    }

    await deleteRSSFeed(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Feed ID required' }, { status: 400 });
    }

    if (action === 'toggle') {
      if (USE_FASTAPI) {
        try {
          const f = await fastApiClient.toggleRSSFeed(id);
          return NextResponse.json({ success: true, feed: toFeedFrontend(f as Record<string, unknown>) });
        } catch (e) {
          return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
        }
      }
      await toggleRSSFeedEnabled(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
