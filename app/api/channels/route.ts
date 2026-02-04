// API route for managing Telegram channels
import { NextRequest, NextResponse } from 'next/server';
import { addChannel, getChannels, deleteChannel } from '@/lib/db';

export async function GET() {
  try {
    const channels = await getChannels();
    return NextResponse.json({ success: true, channels });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'URL is required' },
        { status: 400 }
      );
    }

    const channel = await addChannel(url);
    
    // Also save to tel_channel_links.txt
    const { saveChannelToFile } = await import('@/lib/channelLoader');
    await saveChannelToFile(url);
    
    return NextResponse.json({ success: true, channel });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    await deleteChannel(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
