import { NextRequest, NextResponse } from 'next/server';
import { 
  getRSSFeeds, 
  addRSSFeed, 
  deleteRSSFeed,
  toggleRSSFeedEnabled 
} from '@/lib/db';

export async function GET() {
  try {
    const feeds = await getRSSFeeds();
    return NextResponse.json({ success: true, feeds });
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
    const { name, url, category = 'general', enabled = true } = body;

    if (!name || !url) {
      return NextResponse.json(
        { success: false, error: 'Name and URL are required' },
        { status: 400 }
      );
    }

    const feed = await addRSSFeed({
      name,
      url,
      category,
      enabled,
    });

    return NextResponse.json({ success: true, feed });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feed ID required' },
        { status: 400 }
      );
    }

    await deleteRSSFeed(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Feed ID required' },
        { status: 400 }
      );
    }

    if (action === 'toggle') {
      await toggleRSSFeedEnabled(id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
