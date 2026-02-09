// Mock question generator for testing without OpenAI
import { NextResponse } from 'next/server';
import { getPosts, saveQuestions } from '@/lib/db';
import { saveQuestionsToFile } from '@/lib/questionFileManager';
import { GeneratedQuestion } from '@/lib/types';

// Mock questions based on common crypto news patterns
const mockQuestionTemplates = [
  'Will Bitcoin reach ${price} within the next 24 hours?',
  'Will Ethereum surpass ${price} by tomorrow (UTC)?',
  'Will ${token} be listed on a major exchange within 24 hours?',
  'Will ${exchange} announce a new token listing within the next 24 hours?',
  'Will the total crypto market cap exceed ${amount} trillion within 24 hours?',
  'Will ${token} increase by more than ${percent}% within the next 24 hours?',
  'Will ${project} release their mainnet upgrade within 24 hours?',
  'Will ${token} experience a price surge above ${price} by tomorrow?',
  'Will a major partnership be announced in the crypto space within 24 hours?',
  'Will ${exchange} launch futures trading for ${token} within the next 24 hours?',
  'Will the ${token} network see increased activity by more than ${percent}% within 24 hours?',
  'Will a major crypto influencer endorse ${token} within the next 24 hours?',
  'Will ${token} break its all-time high within the next 24 hours?',
  'Will trading volume for ${token} exceed ${amount} billion within 24 hours?',
  'Will a major crypto protocol announce a security update within the next 24 hours?',
];

const tokens = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOGE', 'MATIC', 'DOT', 'LINK', 'UNI'];
const exchanges = ['Binance', 'Coinbase', 'Kraken', 'OKX', 'Bybit'];
const projects = ['Ethereum', 'Solana', 'Cardano', 'Polkadot', 'Avalanche'];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomPrice(): string {
  const prices = ['$50,000', '$60,000', '$70,000', '$80,000', '$90,000', '$100,000', '$3,000', '$4,000', '$5,000'];
  return getRandomElement(prices);
}

function generateRandomPercent(): string {
  const percents = ['5', '10', '15', '20', '25'];
  return getRandomElement(percents);
}

function generateRandomAmount(): string {
  const amounts = ['1', '2', '3', '5', '10'];
  return getRandomElement(amounts);
}

function generateMockQuestion(_postIds: string[]): string {
  const template = getRandomElement(mockQuestionTemplates);
  
  return template
    .replace(/\${token}/g, getRandomElement(tokens))
    .replace(/\${exchange}/g, getRandomElement(exchanges))
    .replace(/\${project}/g, getRandomElement(projects))
    .replace(/\${price}/g, generateRandomPrice())
    .replace(/\${percent}/g, generateRandomPercent())
    .replace(/\${amount}/g, generateRandomAmount());
}

export async function POST() {
  try {
    const posts = await getPosts();

    if (posts.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No posts found. Please scrape channels first.' },
        { status: 400 }
      );
    }

    // Generate 10-15 mock questions
    const questionCount = Math.floor(Math.random() * 6) + 10; // 10-15 questions
    const generatedQuestions: GeneratedQuestion[] = [];

    for (let i = 0; i < questionCount; i++) {
      // Randomly select 1-3 posts as sources
      const sourceCount = Math.floor(Math.random() * 3) + 1;
      const sourceIds: string[] = [];
      
      for (let j = 0; j < sourceCount; j++) {
        const randomPost = posts[Math.floor(Math.random() * posts.length)];
        if (!sourceIds.includes(randomPost.id)) {
          sourceIds.push(randomPost.id);
        }
      }

      generatedQuestions.push({
        id: `q_${Date.now()}_${i}`,
        question: generateMockQuestion(sourceIds),
        sourceIds,
        selected: false,
        createdAt: new Date().toISOString(),
      });

      // Small delay to ensure unique timestamps
      await new Promise(resolve => setTimeout(resolve, 2));
    }

    // Save to database for current session
    await saveQuestions(generatedQuestions);
    
    // Save to permanent timestamped file
    const filename = await saveQuestionsToFile(generatedQuestions);

    return NextResponse.json({
      success: true,
      questionsCount: generatedQuestions.length,
      questions: generatedQuestions,
      mock: true,
      message: 'Mock questions generated for testing (OpenAI not used)',
      savedToFile: filename,
    });
  } catch (error: any) {
    console.error('Mock question generation error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
