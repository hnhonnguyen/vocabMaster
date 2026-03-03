import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// GET /api/words/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDatabase();
    const word = await db.getWordById(params.id);
    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }
    return NextResponse.json({ word });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/words/[id] - Update a word
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    const word = await db.updateWord(params.id, body);
    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }
    return NextResponse.json({ word });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/words/[id] - Delete a word
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDatabase();
    const deleted = await db.deleteWord(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
