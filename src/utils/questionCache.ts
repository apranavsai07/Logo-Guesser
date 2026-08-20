import { supabase } from './supabase';
import fs from 'fs';
import path from 'path';

export interface ValidQuestion {
  id: number;
  name: string;
  image_url: string;
  localLogoId: number;
}

let CACHED_QUESTIONS: ValidQuestion[] | null = null;
let QUESTION_MAP: Map<number, ValidQuestion> = new Map();
let LAST_FETCH_TIME = 0;
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

let LOGOS_MAP: Map<string, number> | null = null;

function getLogosMap(): Map<string, number> {
  if (!LOGOS_MAP) {
    LOGOS_MAP = new Map();
    try {
      const logosJsonPath = path.join(process.cwd(), 'logos.json');
      if (fs.existsSync(logosJsonPath)) {
        const logosData = JSON.parse(fs.readFileSync(logosJsonPath, 'utf8'));
        for (const l of logosData) {
          if (l.name && l.id) {
            LOGOS_MAP.set(l.name.toLowerCase(), l.id);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load logos.json in cache utility', e);
    }
  }
  return LOGOS_MAP;
}

export async function getValidQuestions(): Promise<ValidQuestion[]> {
  if (CACHED_QUESTIONS && (Date.now() - LAST_FETCH_TIME < CACHE_TTL_MS)) {
    return CACHED_QUESTIONS;
  }

  try {
    const { data: questions, error } = await supabase.from('questions').select('*');
    if (error || !questions || questions.length === 0) {
      return CACHED_QUESTIONS || [];
    }

    const logosMap = getLogosMap();
    const valid: ValidQuestion[] = [];
    const map = new Map<number, ValidQuestion>();

    for (const q of questions) {
      const logoId = logosMap.get(q.name.toLowerCase());
      if (logoId !== undefined) {
        const item = { ...q, localLogoId: logoId };
        valid.push(item);
        map.set(q.id, item);
      }
    }

    if (valid.length > 0) {
      CACHED_QUESTIONS = valid;
      QUESTION_MAP = map;
      LAST_FETCH_TIME = Date.now();
      return valid;
    }
  } catch (err) {
    console.error('Error building question cache:', err);
  }

  return CACHED_QUESTIONS || [];
}

export async function getQuestionById(id: number): Promise<ValidQuestion | null> {
  if (QUESTION_MAP.has(id)) {
    return QUESTION_MAP.get(id)!;
  }
  const questions = await getValidQuestions();
  return QUESTION_MAP.get(id) || null;
}

// Fisher-Yates fast random shuffle helper
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
