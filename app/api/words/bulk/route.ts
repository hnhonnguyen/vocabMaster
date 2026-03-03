import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// POST /api/words/bulk - Add multiple words
export async function POST(request: NextRequest) {
  try {
    const { words } = await request.json();
    if (!Array.isArray(words) || words.length === 0) {
      return NextResponse.json({ error: 'Words array is required' }, { status: 400 });
    }
    const db = await getDatabase();
    const added = await db.addWords(words);
    return NextResponse.json({ words: added, count: added.length }, { status: 201 });
  } catch (error: any) {
    console.error('POST /api/words/bulk error:', error);
    return NextResponse.json({ error: error.message || 'Failed to bulk import' }, { status: 500 });
  }
}
