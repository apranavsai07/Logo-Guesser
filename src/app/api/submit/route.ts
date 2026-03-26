import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'
import { redis } from '@/utils/redis'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, questionId, selectedOption, timeRemainingMs } = body

    if (!userId || !questionId || !selectedOption) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Fetch the actual question to verify the answer
    const { data: question, error: qError } = await supabase
      .from('questions')
      .select('name')
      .eq('id', questionId)
      .single()

    if (qError || !question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // 2. Determine correctness and score
    const isCorrect = question.name === selectedOption
    let scoreAwarded = 0

    if (isCorrect) {
      scoreAwarded = 10;
    }

    // 3. Update PostgreSQL log
    const { error: insertError } = await supabase
      .from('submissions')
      .insert({
        user_id: userId,
        question_id: questionId,
        selected_option: selectedOption,
        is_correct: isCorrect,
        time_remaining_ms: timeRemainingMs,
        score_awarded: scoreAwarded
      })

    // If there's a unique constraint error (user already answered this question), handle it gracefully
    if (insertError && insertError.code === '23505') {
       return NextResponse.json({ error: 'You have already answered this question!' }, { status: 400 })
    }

    // 4. Update Upstash Redis Leaderboard IF correct
    if (isCorrect) {
      const { data: user } = await supabase
        .from('users')
        .select('name')
        .eq('id', userId)
        .single()
        
      if (user) {
        // ZINCRBY increments the score for the member (userId) instead of name
        await redis.zincrby('leaderboard', scoreAwarded, userId)
      }
    }

    return NextResponse.json({ 
      correct: isCorrect, 
      scoreAwarded,
      correctAnswer: question.name 
    }, { status: 200 })

  } catch (err) {
    console.error('Error in /api/submit:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
