const { Redis } = require('@upstash/redis');
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
async function run() {
  await redis.zadd('leaderboard', { score: 10, member: 'alice' });
  const res = await redis.zrange('leaderboard', 0, 10, { withScores: true, rev: true });
  console.log(JSON.stringify(res));
  process.exit(0);
}
run().catch(console.error);
