import { NextResponse } from 'next/server';
import { saveChallengeResult } from '@/utils/sqliteDb';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, name, totalScore, totalCorrect, totalAttempted } = body;

    if (!userId || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Save to SQLite database
    saveChallengeResult({
      user_id: userId,
      name,
      total_score: Number(totalScore) || 0,
      total_correct: Number(totalCorrect) || 0,
      total_attempted: Number(totalAttempted) || 0
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error('Error saving challenge result to SQLite:', err);
    return NextResponse.json({ error: 'Failed to record result' }, { status: 500 });
  }
}
