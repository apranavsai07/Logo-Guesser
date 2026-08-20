import { NextResponse } from 'next/server';
import { getSqliteLeaderboard } from '@/utils/sqliteDb';
import { redis } from '@/utils/redis';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userIdSearch = searchParams.get('userId');

    const leaderboardMap = new Map<string, { id: string; name: string; score: number; total_correct: number; total_attempted: number }>();

    // 1. Fetch from SQLite Database
    try {
      const sqliteRecords = getSqliteLeaderboard();
      for (const r of sqliteRecords) {
        leaderboardMap.set(r.user_id, {
          id: r.user_id,
          name: r.name,
          score: r.total_score,
          total_correct: r.total_correct,
          total_attempted: r.total_attempted
        });
      }
    } catch (e) {
      console.error('Error fetching SQLite leaderboard', e);
    }

    // 2. Fetch from Supabase PostgreSQL (submitting per-answer history)
    try {
      const { data: usersData } = await supabase.from('users').select('id, name');
      if (usersData && usersData.length > 0) {
        const userMap = new Map(usersData.map(u => [u.id, u.name]));
        const { data: subData } = await supabase.from('submissions').select('user_id, is_correct, score_awarded');

        if (subData) {
          const userStats = new Map<string, { score: number; correct: number; attempted: number }>();
          for (const s of subData) {
            const cur = userStats.get(s.user_id) || { score: 0, correct: 0, attempted: 0 };
            cur.score += s.score_awarded || 0;
            if (s.is_correct) cur.correct += 1;
            cur.attempted += 1;
            userStats.set(s.user_id, cur);
          }

          for (const [uid, stats] of userStats.entries()) {
            const uname = userMap.get(uid);
            if (uname) {
              const existing = leaderboardMap.get(uid);
              const finalScore = Math.max(existing?.score || 0, stats.score);
              const finalCorrect = Math.max(existing?.total_correct || 0, stats.correct);
              const finalAttempted = Math.max(existing?.total_attempted || 0, stats.attempted);

              leaderboardMap.set(uid, {
                id: uid,
                name: uname,
                score: finalScore,
                total_correct: finalCorrect,
                total_attempted: finalAttempted
              });
            }
          }
        }
      }
    } catch (supaErr) {
      console.error('Supabase leaderboard fetch warning (non-fatal):', supaErr);
    }

    // 3. Fetch from Upstash Redis if configured
    try {
      const result = await redis.zrange<string[]>('leaderboard', 0, 99, { rev: true, withScores: true });
      if (result && result.length > 0) {
        const redisUserIds: string[] = [];
        for (let i = 0; i < result.length; i += 2) {
          redisUserIds.push(result[i]);
        }
        const { data: rUsers } = await supabase.from('users').select('id, name').in('id', redisUserIds);
        const rNameMap = new Map((rUsers || []).map(u => [u.id, u.name]));

        for (let i = 0; i < result.length; i += 2) {
          const id = result[i];
          const redisScore = Number(result[i + 1]);
          const name = rNameMap.get(id) || leaderboardMap.get(id)?.name || 'Participant';
          const existing = leaderboardMap.get(id);

          const finalScore = Math.max(existing?.score || 0, redisScore);
          const finalCorrect = Math.max(existing?.total_correct || 0, Math.floor(redisScore / 10));

          leaderboardMap.set(id, {
            id,
            name,
            score: finalScore,
            total_correct: finalCorrect,
            total_attempted: existing?.total_attempted || finalCorrect
          });
        }
      }
    } catch (redisErr) {
      console.error('Redis fetch warning (non-fatal):', redisErr);
    }

    const leaderboardList = Array.from(leaderboardMap.values());
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
