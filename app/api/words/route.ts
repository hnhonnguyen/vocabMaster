import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// GET /api/words - Get all words
export async function GET() {
  try {
    const db = await getDatabase();
    const words = await db.getAllWords();
    return NextResponse.json({ words });
  } catch (error: any) {
    console.error('GET /api/words error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch words' }, { status: 500 });
  }
}

// POST /api/words - Add a single word
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    const word = await db.addWord(body);
    return NextResponse.json({ word }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/words error:', error);
    return NextResponse.json({ error: error.message || 'Failed to add word' }, { status: 500 });
  }
}
