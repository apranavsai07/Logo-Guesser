import { NextResponse } from 'next/server';
import { clearSqliteLeaderboard } from '@/utils/sqliteDb';
import { redis } from '@/utils/redis';
import { supabase } from '@/utils/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { passcode } = await req.json().catch(() => ({}));

    // Simple passcode check for extra security (default: "admin123")
    if (passcode !== 'admin123') {
      return NextResponse.json({ error: 'Unauthorized. Invalid passcode.' }, { status: 401 });
    }

    const status = {
      sqlite: false,
      redis: false,
      supabaseUsers: false,
      supabaseSubmissions: false,
    };

    // 1. Clear SQLite Leaderboard
    try {
      clearSqliteLeaderboard();
      status.sqlite = true;
    } catch (e) {
      console.error('Error clearing SQLite leaderboard:', e);
    }

    // 2. Clear Redis Leaderboard
    try {
      await redis.del('leaderboard');
      status.redis = true;
    } catch (e) {
      console.error('Error clearing Redis leaderboard:', e);
    }

    // 3. Clear Supabase Submissions (First, just to be safe, then users)
    try {
      const { error: subError } = await supabase
        .from('submissions')
        .delete()
        .neq('score_awarded', -999); // deletes all rows

      if (!subError) {
        status.supabaseSubmissions = true;
      } else {
        console.error('Supabase submissions clear error:', subError);
      }
    } catch (e) {
      console.error('Error clearing Supabase submissions:', e);
    }

    // 4. Clear Supabase Users
    try {
      const { error: userError } = await supabase
        .from('users')
        .delete()
        .neq('play_count', -999); // deletes all rows

      if (!userError) {
        status.supabaseUsers = true;
      } else {
        console.error('Supabase users clear error:', userError);
      }
    } catch (e) {
      console.error('Error clearing Supabase users:', e);
    }

    return NextResponse.json({
      success: true,
      message: 'Leaderboard database and caches cleared successfully.',
      status,
    }, { status: 200 });

  } catch (err) {
    console.error('Admin clear leaderboard internal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
