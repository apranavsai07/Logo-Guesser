import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function resetLeaderboard() {
  try {
    console.log("Connecting to Upstash Redis...");
    await redis.del('leaderboard');
    console.log("✅ Successfully cleared the Upstash leaderboard data!");

    console.log("Resetting play counts in Supabase...");
    // We update every user's play_count to 0
    const { error: usersError } = await supabase
      .from('users')
      .update({ play_count: 0 })
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (usersError) throw usersError;
    console.log("✅ Successfully reset all user play counts!");

    console.log("Clearing all question submissions in Supabase...");
    // Clear all submissions so people can answer questions again
    const { error: subError } = await supabase
      .from('submissions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
      
    if (subError) throw subError;
    console.log("✅ Successfully cleared all game submissions!");

  } catch (error) {
    console.error("❌ Failed to clear data:", error);
  }
}

resetLeaderboard();
