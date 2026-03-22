import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export const dynamic = 'force-dynamic'

// Cache the questions in memory during high traffic to avoid hitting Postgres limit
let CACHED_QUESTIONS: any[] | null = null;
let LAST_FETCH_TIME = 0;
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();
    
    // Refresh cache if empty or expired
    if (!CACHED_QUESTIONS || (now - LAST_FETCH_TIME > CACHE_TTL_MS)) {
      const { data: questions, error } = await supabase.from('questions').select('*')
      if (error || !questions || questions.length === 0) {
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
      }
      CACHED_QUESTIONS = questions;
      LAST_FETCH_TIME = now;
    }
    
    // Pick 4 unique random questions
    const shuffled = [...CACHED_QUESTIONS].sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, 4)
    
    // The first one will be the "correct" answer
    const correctQuestion = selected[0]
    
    // Shuffle the options so the correct answer isn't always first
    const options = selected.map(q => q.name).sort(() => 0.5 - Math.random())
    
    // NOTE: In a highly competitive environment, returning the direct image URL from simpleicons 
    // might allow cheating if the user inspects network tab (as the URL contains the slug).
    // A future enhancement could be to serve an opaque /api/image route.
    return NextResponse.json({
      questionId: correctQuestion.id,
      imageUrl: correctQuestion.image_url,
      options: options
    }, { status: 200 })
    
  } catch (err) {
    console.error('Error in /api/question:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
