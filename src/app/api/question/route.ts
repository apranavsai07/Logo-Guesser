import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'
import { getValidQuestions, shuffleArray } from '@/utils/questionCache'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { excludeIds = [], userId } = await req.json().catch(() => ({}));
    
    const questions = await getValidQuestions();
    if (!questions || questions.length === 0) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    if (excludeIds.length === 0 && userId) {
      // Fire-and-forget user play_count update asynchronously
      (async () => {
        try {
          const { data: user } = await supabase.from('users').select('play_count').eq('id', userId).single();
          if (user) {
            await supabase.from('users').update({ play_count: (user.play_count || 0) + 1 }).eq('id', userId);
          }
        } catch (e) {
          console.error('Play count error', e);
        }
      })();
    }
    
    const availableQuestions = questions.filter(q => !excludeIds.includes(q.id));
    if (availableQuestions.length === 0) {
      return NextResponse.json({ gameOver: true }, { status: 200 });
    }

    const shuffledAvailable = shuffleArray(availableQuestions);
    const correctQuestion = shuffledAvailable[0];
    
    const otherOptionsPool = questions.filter(q => q.id !== correctQuestion.id);
    const shuffledOthers = shuffleArray(otherOptionsPool);
    
    const selected = [correctQuestion, ...shuffledOthers.slice(0, 3)];
    const options = shuffleArray(selected.map(q => q.name));
    
    return NextResponse.json({
      questionId: correctQuestion.id,
      imageUrl: `/logos/${correctQuestion.localLogoId}.svg`,
      options: options
    }, { status: 200 })
    
  } catch (err) {
    console.error('Error in /api/question:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
