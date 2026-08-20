import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'
import { redis } from '@/utils/redis'
import { getQuestionById } from '@/utils/questionCache'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, questionId, selectedOption, timeRemainingMs = 0 } = body

    if (!userId || !questionId || !selectedOption) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Fetch question name from fast cache or Supabase fallback
    let questionName: string | null = null;
    const cachedQ = await getQuestionById(Number(questionId));
    if (cachedQ) {
      questionName = cachedQ.name;
    } else {
      const { data: question } = await supabase
        .from('questions')
        .select('name')
        .eq('id', questionId)
        .single()
      if (question) {
        questionName = question.name;
      }
    }

    if (!questionName) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // 2. Determine correctness and score
    const isCorrect = questionName === selectedOption
    const scoreAwarded = isCorrect ? 10 : 0

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

    if (insertError && insertError.code === '23505') {
       return NextResponse.json({ error: 'You have already answered this question!' }, { status: 400 })
    }

    // 4. Update Upstash Redis Leaderboard IF correct
    if (isCorrect) {
      try {
        await redis.zincrby('leaderboard', scoreAwarded, userId)
      } catch (redisErr) {
        console.error('Redis zincrby error (non-fatal):', redisErr)
      }
    }

    return NextResponse.json({ 
      correct: isCorrect, 
      scoreAwarded,
      correctAnswer: questionName 
    }, { status: 200 })

  } catch (err) {
    console.error('Error in /api/submit:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
