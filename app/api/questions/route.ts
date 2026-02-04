// API route for managing questions
import { NextRequest, NextResponse } from 'next/server';
import { getQuestions, updateQuestion, getSelectedQuestions } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const selectedOnly = searchParams.get('selected') === 'true';

    const questions = selectedOnly ? await getSelectedQuestions() : await getQuestions();
    return NextResponse.json({ success: true, questions });
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
    const { id, selected } = body;

    if (!id || typeof selected !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'ID and selected status required' },
        { status: 400 }
      );
    }

    await updateQuestion(id, { selected });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
