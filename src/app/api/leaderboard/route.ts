import { NextResponse } from 'next/server';
import { getSqliteLeaderboard } from '@/utils/sqliteDb';
import { redis } from '@/utils/redis';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdSearch = searchParams.get('userId');

    // 1. Primary Source: SQLite Database
    const sqliteRecords = getSqliteLeaderboard();

    let leaderboardList = sqliteRecords.map(r => ({
      id: r.user_id,
      name: r.name,
      score: r.total_score,
      total_correct: r.total_correct,
      total_attempted: r.total_attempted
    }));

    // 2. Fallback to Redis / Supabase if SQLite database has no records yet
    if (leaderboardList.length === 0) {
      try {
        const result = await redis.zrange<string[]>('leaderboard', 0, 49, { rev: true, withScores: true });
        const topUserIds: string[] = [];
        for (let i = 0; i < result.length; i += 2) {
          topUserIds.push(result[i]);
        }

        if (topUserIds.length > 0) {
          const { data: usersData } = await supabase.from('users').select('id, name').in('id', topUserIds);
          const uMap = new Map((usersData || []).map(u => [u.id, u.name]));

          for (let i = 0; i < result.length; i += 2) {
            const id = result[i];
            const score = Number(result[i + 1]);
            const name = uMap.get(id) || 'Anonymous';
            leaderboardList.push({
              id,
              name,
              score,
              total_correct: Math.floor(score / 10),
              total_attempted: Math.floor(score / 10)
            });
          }
        }
      } catch (redisErr) {
        console.error('Redis fallback error (non-fatal):', redisErr);
      }
    }

    // Sort leaderboard by score DESC, then total_correct DESC
    leaderboardList.sort((a, b) => b.score - a.score || b.total_correct - a.total_correct);

    let userSpecific = null;
    if (userIdSearch) {
      const userIndex = leaderboardList.findIndex(u => u.id === userIdSearch);
      if (userIndex >= 0) {
        userSpecific = {
          ...leaderboardList[userIndex],
          rank: userIndex + 1
        };
      }
    }

    return NextResponse.json({ leaderboard: leaderboardList, userSpecific }, { status: 200 });
  } catch (err) {
    console.error('Error in /api/leaderboard:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
