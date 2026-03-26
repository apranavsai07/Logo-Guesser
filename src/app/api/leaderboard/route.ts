import { NextResponse } from 'next/server'
import { redis } from '@/utils/redis'

import { supabase } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const userIdSearch = searchParams.get('userId')

    // Fetch top 50 users from Redis Leaderboard
    const result = await redis.zrange<string[]>('leaderboard', 0, 49, { rev: true, withScores: true })

    const topUserIds: string[] = []
    
    for (let i = 0; i < result.length; i += 2) {
      topUserIds.push(result[i])
    }

    let userRank = null
    let userScoreStr = null
    
    if (userIdSearch) {
       userRank = await redis.zrevrank('leaderboard', userIdSearch)
       userScoreStr = await redis.zscore('leaderboard', userIdSearch)
       
       if (userRank !== null && userRank >= 50 && !topUserIds.includes(userIdSearch)) {
         topUserIds.push(userIdSearch)
       }
    }

    let usersData: any[] = []
    if (topUserIds.length > 0) {
      const { data } = await supabase.from('users').select('id, name, college_id').in('id', topUserIds)
      if (data) usersData = data
    }

    const leaderboard = []
    for (let i = 0; i < result.length; i += 2) {
      const id = result[i]
      const score = Number(result[i + 1])
      const u = usersData.find(x => x.id === id)
      if (u) {
        leaderboard.push({ id, name: u.name, collegeId: u.college_id, score })
      }
    }
    
    let userSpecific = null
    if (userIdSearch && userRank !== null) {
      const u = usersData.find(x => x.id === userIdSearch)
      if (u) {
         userSpecific = {
           id: userIdSearch,
           name: u.name,
           collegeId: u.college_id,
           score: Number(userScoreStr),
           rank: userRank + 1 // 1-indexed
         }
      }
    }

    return NextResponse.json({ leaderboard, userSpecific }, { status: 200 })
  } catch (err) {
    console.error('Error in /api/leaderboard:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
