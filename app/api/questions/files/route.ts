// API route for managing saved question files
import { NextRequest, NextResponse } from 'next/server';
import { listQuestionFiles, loadQuestionFile, deleteQuestionFile } from '@/lib/questionFileManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const filename = searchParams.get('file');
    
    if (filename) {
      // Load specific file
      const data = await loadQuestionFile(filename);
      return NextResponse.json({ success: true, data });
    } else {
      // List all files
      const files = await listQuestionFiles();
      return NextResponse.json({ success: true, files });
    }
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
    const filename = searchParams.get('file');
    
    if (!filename) {
      return NextResponse.json(
        { success: false, error: 'Filename is required' },
        { status: 400 }
      );
    }
    
    await deleteQuestionFile(filename);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
