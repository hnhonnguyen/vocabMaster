import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

// GET /api/stats
export async function GET() {
  try {
    const db = await getDatabase();
    const stats = await db.getStats();
    return NextResponse.json({ stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/stats
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const db = await getDatabase();
    const stats = await db.updateStats(body);
    return NextResponse.json({ stats });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
