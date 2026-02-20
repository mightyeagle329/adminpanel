// API route for Telegram channels – uses FastAPI backend when available
import { NextRequest, NextResponse } from 'next/server';
import { addChannel, getChannels, deleteChannel } from '@/lib/db';
import { fastApiClient } from '@/lib/fastApiClient';

const USE_FASTAPI = !!process.env.NEXT_PUBLIC_FASTAPI_URL;

function toChannelFrontend(ch: Record<string, unknown>) {
  return {
    id: ch.id,
    url: ch.url,
    username: ch.username,
    addedAt: (ch as Record<string, string>).added_at ?? ch.addedAt,
    enabled: ch.enabled !== false,
  };
}

export async function GET() {
  try {
    if (USE_FASTAPI) {
      try {
        const list = await fastApiClient.getTelegramChannels();
        const channels = (list || []).map(toChannelFrontend);
        return NextResponse.json({ success: true, channels });
      } catch (e) {
        console.error('FastAPI channels GET failed:', e);
      }
    }
    const channels = await getChannels();
    return NextResponse.json({ success: true, channels });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: 'URL is required' }, { status: 400 });
    }

    if (USE_FASTAPI) {
      try {
        const ch = await fastApiClient.addTelegramChannel(url);
        const channel = toChannelFrontend(ch as Record<string, unknown>);
        return NextResponse.json({ success: true, channel });
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        return NextResponse.json({ success: false, error: message }, { status: 400 });
      }
    }

    const channel = await addChannel(url);
    const { saveChannelToFile } = await import('@/lib/channelLoader');
    await saveChannelToFile(url);
    return NextResponse.json({ success: true, channel });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    if (USE_FASTAPI) {
      try {
        await fastApiClient.deleteTelegramChannel(id);
        return NextResponse.json({ success: true });
      } catch (e) {
        console.error('FastAPI channels DELETE failed:', e);
        return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
      }
    }

    await deleteChannel(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
