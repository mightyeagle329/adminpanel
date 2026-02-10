import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

type SnapshotBody = {
  status: string;
  page: number;
  limit: number;
  total: number;
  markets: any[];
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as SnapshotBody;

    if (!Array.isArray(body.markets)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload: markets must be an array' },
        { status: 400 }
      );
    }

    const snapshot = {
      status: body.status,
      page: body.page,
      limit: body.limit,
      total: body.total,
      markets: body.markets,
      savedAt: new Date().toISOString(),
    };

    const filePath = path.join(process.cwd(), 'data', 'markets-snapshot.json');

    // Ensure data directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    await fs.writeFile(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');

    return NextResponse.json({ success: true, file: 'data/markets-snapshot.json' });
  } catch (error: any) {
    console.error('Error saving markets snapshot:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
