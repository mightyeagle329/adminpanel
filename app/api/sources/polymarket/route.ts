// API route for Polymarket topics – uses FastAPI backend when available
import { NextRequest, NextResponse } from 'next/server';
import {
  getPolymarketTopics,
  addPolymarketTopic,
  deletePolymarketTopic,
  togglePolymarketTopicEnabled,
} from '@/lib/db';
import { fastApiClient } from '@/lib/fastApiClient';

const USE_FASTAPI = !!process.env.NEXT_PUBLIC_FASTAPI_URL;

function toTopicFrontend(t: Record<string, unknown>) {
  return {
    id: t.id,
    name: t.name,
    keywords: t.keywords,
    category: t.category,
    addedAt: (t as Record<string, string>).added_at ?? t.addedAt,
    enabled: t.enabled !== false,
  };
}

export async function GET() {
  try {
    if (USE_FASTAPI) {
      try {
        const list = await fastApiClient.getPolymarketTopics();
        const topics = (list || []).map(toTopicFrontend);
        return NextResponse.json({ success: true, topics });
      } catch (e) {
        console.error('FastAPI polymarket GET failed:', e);
      }
    }
    const topics = await getPolymarketTopics();
    return NextResponse.json({ success: true, topics });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, keywords, category = 'other', enabled = true } = body;

    if (!name || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    if (USE_FASTAPI) {
      try {
        const topic = await fastApiClient.addPolymarketTopic({ name, keywords, category });
        return NextResponse.json({ success: true, topic: toTopicFrontend(topic as Record<string, unknown>) });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 400 });
      }
    }

    const topic = await addPolymarketTopic({ name, keywords, category, enabled });
    return NextResponse.json({ success: true, topic });
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
      return NextResponse.json({ success: false, error: 'Topic ID required' }, { status: 400 });
    }

    if (USE_FASTAPI) {
      try {
        await fastApiClient.deletePolymarketTopic(id);
        return NextResponse.json({ success: true });
      } catch (e) {
        return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
      }
    }

    await deletePolymarketTopic(id);
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
      return NextResponse.json({ success: false, error: 'Topic ID required' }, { status: 400 });
    }

    if (action === 'toggle') {
      if (USE_FASTAPI) {
        try {
          const t = await fastApiClient.togglePolymarketTopic(id);
          return NextResponse.json({ success: true, topic: toTopicFrontend(t as Record<string, unknown>) });
        } catch (e) {
          return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
        }
      }
      await togglePolymarketTopicEnabled(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
