// API route for getting posts with pagination and filtering
import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedPosts } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('source');
    const sourceId = searchParams.get('sourceId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    let posts = await getUnifiedPosts();
    
    // Filter by source type if specified
    if (source && source !== 'all') {
      posts = posts.filter(post => post.source === source);
    }
    
    // Filter by sourceId (channel/account) if specified
    if (sourceId && sourceId !== 'all') {
      posts = posts.filter(post => post.sourceId === sourceId);
    }
    
    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime());
    
    // Pagination
    const total = posts.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedPosts = posts.slice(start, end);
    
    return NextResponse.json({
      success: true,
      posts: paginatedPosts,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
