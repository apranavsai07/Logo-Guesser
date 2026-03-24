import { Redis } from '@upstash/redis';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

async function resetLeaderboard() {
  try {
    console.log("Connecting to Upstash Redis...");
    await redis.del('leaderboard');
    console.log("✅ Successfully cleared the leaderboard data!");
  } catch (error) {
    console.error("❌ Failed to clear leaderboard:", error);
  }
}

resetLeaderboard();
