import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

let CACHED_QUESTIONS: any[] | null = null;
let LAST_FETCH_TIME = 0;
const CACHE_TTL_MS = 1000 * 60 * 10;

function getValidQuestions() {
  if (CACHED_QUESTIONS && (Date.now() - LAST_FETCH_TIME < CACHE_TTL_MS)) {
    return CACHED_QUESTIONS;
  }
  return null;
}

async function buildQuestionCache() {
  const { data: questions, error } = await supabase.from('questions').select('*')
  if (error || !questions || questions.length === 0) {
    return null;
  }

  const logosJsonPath = path.join(process.cwd(), 'logos.json');
  const logosData = JSON.parse(fs.readFileSync(logosJsonPath, 'utf8'));
  
  const validQuestions = questions
    .map(q => {
      const logoDef = logosData.find((l: any) => l.name === q.name);
      if (!logoDef) return null;
      const svgPath = path.join(process.cwd(), 'public', 'logos', `${logoDef.id}.svg`);
      if (!fs.existsSync(svgPath)) return null;
      return { ...q, localLogoId: logoDef.id };
    })
    .filter(Boolean);

  CACHED_QUESTIONS = validQuestions;
  LAST_FETCH_TIME = Date.now();
  return validQuestions;
}

export async function POST(req: Request) {
  try {
    const { excludeIds = [], userId } = await req.json().catch(() => ({}));
    
    let questions = getValidQuestions();
    if (!questions) {
      questions = await buildQuestionCache();
      if (!questions || questions.length === 0) {
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
      }
    }

    if (excludeIds.length === 0 && userId) {
      const { data: user } = await supabase.from('users').select('play_count').eq('id', userId).single()
      if (user) {
        await supabase.from('users').update({ play_count: (user.play_count || 0) + 1 }).eq('id', userId)
      }
    }
    
    const availableQuestions = questions.filter(q => !excludeIds.includes(q.id));
    if (availableQuestions.length === 0) {
      return NextResponse.json({ gameOver: true }, { status: 200 });
    }

    const shuffledAvailable = [...availableQuestions].sort(() => Math.random() - 0.5)
    const correctQuestion = shuffledAvailable[0]
    
    const otherOptionsPool = questions.filter(q => q.id !== correctQuestion.id).sort(() => Math.random() - 0.5);
    const selected = [correctQuestion, ...otherOptionsPool.slice(0, 3)];
    const options = selected.map(q => q.name).sort(() => Math.random() - 0.5)
    
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
