import { NextResponse } from 'next/server'
import { redis } from '@/utils/redis'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Fetch top 50 users from Redis Leaderboard
    // withScores returns [member1, score1, member2, score2, ...]
    const result = await redis.zrange<string[]>('leaderboard', 0, 49, { rev: true, withScores: true })

    // Parse result into an array of objects
    const leaderboard = []
    for (let i = 0; i < result.length; i += 2) {
      leaderboard.push({
        name: result[i],
        score: Number(result[i + 1])
      })
    }

    return NextResponse.json({ leaderboard }, { status: 200 })
  } catch (err) {
    console.error('Error in /api/leaderboard:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
