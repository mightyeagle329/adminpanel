// Save questions to timestamped files
import fs from 'fs/promises';
import path from 'path';
import { GeneratedQuestion } from './types';

const QUESTIONS_DIR = path.join(process.cwd(), 'saved-questions');

async function ensureQuestionsDir() {
  await fs.mkdir(QUESTIONS_DIR, { recursive: true });
}

export async function saveQuestionsToFile(questions: GeneratedQuestion[]): Promise<string> {
  await ensureQuestionsDir();
  
  // Create filename with timestamp
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').split('T');
  const date = timestamp[0]; // YYYY-MM-DD
  const time = timestamp[1].split('.')[0]; // HH-MM-SS
  const filename = `questions_${date}_${time}.json`;
  
  const filePath = path.join(QUESTIONS_DIR, filename);
  
  // Save questions to file
  const data = {
    generatedAt: now.toISOString(),
    count: questions.length,
    questions: questions,
  };
  
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  
  return filename;
}

export async function listQuestionFiles(): Promise<string[]> {
  await ensureQuestionsDir();
  
  try {
    const files = await fs.readdir(QUESTIONS_DIR);
    return files.filter(f => f.startsWith('questions_') && f.endsWith('.json'))
      .sort()
      .reverse(); // Newest first
  } catch (error) {
    return [];
  }
}

export async function loadQuestionFile(filename: string): Promise<any> {
  const filePath = path.join(QUESTIONS_DIR, filename);
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content);
}

export async function deleteQuestionFile(filename: string): Promise<void> {
  const filePath = path.join(QUESTIONS_DIR, filename);
  await fs.unlink(filePath);
}
