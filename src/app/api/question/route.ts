import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'
import fs from 'fs'
import path from 'path'

export const dynamic = 'force-dynamic'

// Cache the questions in memory during high traffic to avoid hitting Postgres limit
let CACHED_QUESTIONS: any[] | null = null;
let LAST_FETCH_TIME = 0;
const CACHE_TTL_MS = 1000 * 60 * 5; // 5 minutes

export async function POST(req: Request) {
  try {
    const { excludeIds = [] } = await req.json().catch(() => ({}));
    const now = Date.now();
    
    // Refresh cache if empty or expired
    if (!CACHED_QUESTIONS || (now - LAST_FETCH_TIME > CACHE_TTL_MS)) {
      const { data: questions, error } = await supabase.from('questions').select('*')
      if (error || !questions || questions.length === 0) {
        return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
      }

      // Load logos.json to map name -> local id appropriately and filter missing ones
      const logosJsonPath = path.join(process.cwd(), 'logos.json');
      const logosData = JSON.parse(fs.readFileSync(logosJsonPath, 'utf8'));
      
      CACHED_QUESTIONS = questions.filter(q => {
        const logoDef = logosData.find((l: any) => l.name === q.name);
        if (!logoDef) return false;
        
        const svgPath = path.join(process.cwd(), 'public', 'logos', `${logoDef.id}.svg`);
        return fs.existsSync(svgPath);
      }).map(q => {
        const logoDef = logosData.find((l: any) => l.name === q.name);
        return {
          ...q,
          localLogoId: logoDef.id
        }
      });
      LAST_FETCH_TIME = now;
    }
    
    // Filter available correctly
    const availableQuestions = CACHED_QUESTIONS.filter(q => !excludeIds.includes(q.id));
    if (availableQuestions.length === 0) {
      return NextResponse.json({ gameOver: true }, { status: 200 });
    }

    // Pick 1 correct answer from unseen pool
    const shuffledAvailable = [...availableQuestions].sort(() => 0.5 - Math.random())
    const correctQuestion = shuffledAvailable[0]
    
    // Pick 3 random alternative options from ANY question
    const otherOptionsPool = CACHED_QUESTIONS.filter(q => q.id !== correctQuestion.id).sort(() => 0.5 - Math.random());
    const selected = [correctQuestion, ...otherOptionsPool.slice(0, 3)];
    
    // Shuffle the options so the correct answer isn't always first
    const options = selected.map(q => q.name).sort(() => 0.5 - Math.random())
    
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
