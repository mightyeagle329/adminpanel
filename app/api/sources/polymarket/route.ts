import { NextRequest, NextResponse } from 'next/server';
import { 
  getPolymarketTopics, 
  addPolymarketTopic, 
  deletePolymarketTopic,
  togglePolymarketTopicEnabled 
} from '@/lib/db';

export async function GET() {
  try {
    const topics = await getPolymarketTopics();
    return NextResponse.json({ success: true, topics });
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
    const { name, keywords, category, enabled = true } = body;

    if (!name || !keywords || !Array.isArray(keywords)) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const topic = await addPolymarketTopic({
      name,
      keywords,
      category: category || 'other',
      enabled,
    });

    return NextResponse.json({ success: true, topic });
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
        { success: false, error: 'Topic ID required' },
        { status: 400 }
      );
    }

    await deletePolymarketTopic(id);
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
        { success: false, error: 'Topic ID required' },
        { status: 400 }
      );
    }

    if (action === 'toggle') {
      await togglePolymarketTopicEnabled(id);
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
