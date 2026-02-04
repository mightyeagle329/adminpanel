// API route for generating prediction questions
import { NextResponse } from 'next/server';
import { getPosts, saveQuestions } from '@/lib/db';
import { generatePredictionQuestionsBatch } from '@/lib/questionGenerator';
import { saveQuestionsToFile } from '@/lib/questionFileManager';
import { GeneratedQuestion } from '@/lib/types';

export async function POST() {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'OPENAI_API_KEY not configured' },
        { status: 500 }
      );
    }

    const posts = await getPosts();

    if (posts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No posts found. Please scrape channels first.' },
        { status: 400 }
      );
    }

    const questions = await generatePredictionQuestionsBatch({
      posts,
      apiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4o',
    });

    const generatedQuestions: GeneratedQuestion[] = questions.map((q, idx) => ({
      id: `q_${Date.now()}_${idx}`,
      question: q.question,
      sourceIds: q.sourceIds,
      selected: false,
      createdAt: new Date().toISOString(),
    }));

    // Save to database for current session
    await saveQuestions(generatedQuestions);
    
    // Save to permanent timestamped file
    const filename = await saveQuestionsToFile(generatedQuestions);

    return NextResponse.json({
      success: true,
      questionsCount: generatedQuestions.length,
      questions: generatedQuestions,
      savedToFile: filename,
    });
  } catch (error: any) {
    console.error('Question generation error:', error);
    
    // Check for specific OpenAI errors
    let errorMessage = error.message || 'Unknown error occurred';
    
    if (error.status === 429) {
      if (error.code === 'billing_not_active') {
        errorMessage = 'OpenAI API Error: Your account is not active. Please check your billing details at https://platform.openai.com/account/billing';
      } else if (error.code === 'rate_limit_exceeded') {
        errorMessage = 'OpenAI API Error: Rate limit exceeded. Please try again in a few moments.';
      } else {
        errorMessage = 'OpenAI API Error: Too many requests. Please try again later.';
      }
    } else if (error.status === 401) {
      errorMessage = 'OpenAI API Error: Invalid API key. Please check your OPENAI_API_KEY in .env.local';
    } else if (error.status === 500) {
      errorMessage = 'OpenAI API Error: Server error. Please try again later.';
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: error.status || 500 }
    );
  }
}
