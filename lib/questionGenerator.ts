// Question generator adapted for multi-source content
import OpenAI from 'openai';
import { UnifiedPost } from './types';

interface Post {
  id: string;
  channelTitle: string;
  username: string;
  dateIso: string;
  permalink: string;
  text: string;
  source?: string;
  sourceName?: string;
}

interface QuestionResult {
  sourceIds: string[];
  question: string;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function safeArray(v: any): any[] {
  return Array.isArray(v) ? v : [];
}

function coerceQuestionsObject(text: string): { questions: any[] } {
  const raw = String(text || '').trim();
  if (!raw) return { questions: [] };

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.questions)) return { questions: parsed.questions };
      if (Array.isArray(parsed)) return { questions: parsed };
    }
  } catch {}

  const start = raw.indexOf('{');
  if (start !== -1) {
    const candidate = raw.slice(start);
    for (let end = candidate.length; end > 0; end--) {
      const sub = candidate.slice(0, end);
      try {
        const parsed = JSON.parse(sub);
        if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.questions)) return { questions: parsed.questions };
        }
      } catch {}
    }
  }

  return { questions: [] };
}

function normalizeQuestionTimeframe(q: string): string {
  let s = String(q || '').trim();
  if (!s) return '';
  
  const lower = s.toLowerCase();
  if (lower.includes('24 hour') || lower.includes('24-hour') || lower.includes('by tomorrow')) {
    if (!s.endsWith('?')) s = s.replace(/[.!]+$/, '') + '?';
    return s;
  }
  
  s = s.replace(/\bby\s+([0-9]{1,2}:[0-9]{2})\s*(gmt|utc)\s+today\b/i, 'within the next 24 hours');
  if (!s.endsWith('?')) s = s.replace(/[.!]+$/, '') + '?';
  
  const l2 = s.toLowerCase();
  if (!(l2.includes('24 hour') || l2.includes('24-hour') || l2.includes('by tomorrow'))) {
    s = s.replace(/\?$/, '');
    s = `${s} within the next 24 hours?`;
  }
  return s;
}

function normalizeOneSentenceQuestion(s: string): string {
  const out = String(s ?? '').trim();
  if (!out) return '';
  
  let q = out
    .replace(/^"|"$/g, '')
    .replace(/^"|"$/g, '')
    .trim();
  
  q = q.replace(/\s+/g, ' ').trim();
  
  if (!q.endsWith('?')) q = q.replace(/[.!]+$/, '') + '?';
  return normalizeQuestionTimeframe(q);
}

export async function generatePredictionQuestionsBatch({
  posts,
  maxPostsPerRequest = 50,
  apiKey,
  model = 'gpt-4o',
}: {
  posts: Post[];
  maxPostsPerRequest?: number;
  apiKey: string;
  model?: string;
}): Promise<QuestionResult[]> {
  const client = new OpenAI({ apiKey });

  const usable = posts
    .map((p) => ({
      ...p,
      text: String(p.text ?? '').trim(),
    }))
    .filter((p) => p.text.length >= 20);

  const batches = chunkArray(usable, maxPostsPerRequest);
  const all: QuestionResult[] = [];

  for (const batch of batches) {
    const items = batch.map((p, idx) => ({
      id: p.id,
      source: p.source || 'telegram',
      sourceName: p.sourceName || p.channelTitle,
      channel: p.channelTitle,
      username: p.username,
      dateIso: p.dateIso,
      permalink: p.permalink,
      text: p.text.slice(0, 700),
      idx,
    }));

    const instructions = `You are generating short-horizon, objectively verifiable prediction questions derived from multi-source news content.

This is NOT investment advice. Do not recommend trading actions. Only write objectively checkable questions.

You will be given a list of recent posts from various sources (Telegram channels, Twitter accounts, Polymarket markets, and news feeds). Produce a list of candidate prediction questions.

Hard constraints:
- Each output must be ONE sentence and must end with a '?'.
- Each output must be resolvable within the next 24 hours.
- Each question MUST explicitly mention a 24-hour timeframe (e.g., "within the next 24 hours" or "by tomorrow (UTC)").
- Each output must be objectively checkable (yes/no, price crosses a specific level, exchange listing note, regulatory decision, product release, etc.).
- No violent/graphic/death/harm predictions. If a post is political/war/violence-related, ignore that aspect and focus on market/product/regulatory outcomes if possible.
- Avoid vague language: no "likely", "could", "might".
- Do NOT invent entities, tickers, numbers, or events not implied by the source text.

Quality bar:
- Prefer questions tied to well-known venues/metrics when possible (e.g., "BTC/USDT on Binance" or "official blog announcement"), but only if clearly implied by the post.
- Keep it concise and professional.

Output format (STRICT JSON):
{
  "questions": [
    {
      "sourceIds": ["<id>", "<id>"] ,
      "question": "... ?"
    }
  ]
}

Guidance:
- You do NOT need one question per post. Instead, propose the best set of distinct questions you can support from these posts.
- Analyze ALL posts in the batch and generate as many valid questions as possible (aim for 10-20 questions per batch if the content allows).
- Look for: 
  * Crypto: price predictions, exchange listings, product launches, token releases, network upgrades
  * Politics: Trump statements, Fed decisions, election predictions, policy announcements
  * Financial: economic indicators, stock movements, corporate announcements
  * Social: trending topics, viral events, public sentiment shifts
  * Polymarket: existing market questions can inspire new questions
- Combine related posts from multiple sources to create comprehensive questions.
- Pay attention to the source type (Telegram/Twitter/Polymarket/RSS) and adjust question style accordingly.
- You MUST return at least 10 questions if the batch contains significant news events.
- If you truly cannot form any safe 24-hour-verifiable questions, return {"questions":[]}.
`;

    const input = `Posts (JSON):\n${JSON.stringify(items, null, 2)}`;

    let parsedObj: any = null;
    let outputText = '';

    try {
      const response = await client.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: instructions },
          { role: 'user', content: input },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 1500,
      });

      outputText = response.choices[0]?.message?.content || '';
      parsedObj = coerceQuestionsObject(outputText);
    } catch (e) {
      console.error('Question generation failed:', e);
      parsedObj = { questions: [] };
    }

    const parsedQuestions = safeArray(parsedObj?.questions);
    const normalized = parsedQuestions
      .map((q) => {
        const sourceIds = Array.isArray(q.sourceIds) ? q.sourceIds : [];
        const question = normalizeOneSentenceQuestion(q.question);
        return { sourceIds, question };
      })
      .filter((q) => q.sourceIds.length > 0 && q.question.length > 0);

    all.push(...normalized);
  }

  return all;
}
