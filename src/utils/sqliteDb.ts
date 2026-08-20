import path from 'path';
import fs from 'fs';
import os from 'os';

export interface ParticipantRecord {
  id: string;
  user_id: string;
  name: string;
  total_score: number;
  total_correct: number;
  total_attempted: number;
  created_at: string;
}

let dbInstance: any = null;

function getDbPath(): string {
  // Use /tmp on Vercel / Linux serverless functions, or local cwd on Windows
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join(os.tmpdir(), 'leaderboard.sqlite');
  }
  return path.join(process.cwd(), 'leaderboard.sqlite');
}

function getJsonPath(): string {
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return path.join(os.tmpdir(), 'leaderboard_store.json');
  }
  return path.join(process.cwd(), 'leaderboard_store.json');
}

function getSqliteDatabase() {
  if (dbInstance) return dbInstance;

  try {
    const Database = require('better-sqlite3');
    const dbPath = getDbPath();
    const db = new Database(dbPath);
    
    db.exec(`
      CREATE TABLE IF NOT EXISTS challenge_results (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        total_score INTEGER NOT NULL DEFAULT 0,
        total_correct INTEGER NOT NULL DEFAULT 0,
        total_attempted INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    dbInstance = {
      type: 'sqlite',
      saveResult: (record: Omit<ParticipantRecord, 'created_at'>) => {
        const stmt = db.prepare(`
          INSERT INTO challenge_results (id, user_id, name, total_score, total_correct, total_attempted, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET
            name = excluded.name,
            total_score = MAX(total_score, excluded.total_score),
            total_correct = MAX(total_correct, excluded.total_correct),
            total_attempted = MAX(total_attempted, excluded.total_attempted);
        `);
        stmt.run(
          record.id,
          record.user_id,
          record.name,
          record.total_score,
          record.total_correct,
          record.total_attempted,
          new Date().toISOString()
        );
      },
      getLeaderboard: (): ParticipantRecord[] => {
        const stmt = db.prepare(`
          SELECT 
            user_id,
            name,
            MAX(total_score) as total_score,
            MAX(total_correct) as total_correct,
            MAX(total_attempted) as total_attempted,
            MAX(created_at) as created_at
          FROM challenge_results
          GROUP BY user_id, name
          ORDER BY total_score DESC, total_correct DESC
          LIMIT 100
        `);
        return stmt.all() as ParticipantRecord[];
      },
      clear: () => {
        db.exec('DELETE FROM challenge_results');
      }
    };
    return dbInstance;
  } catch (err) {
    console.warn('SQLite native module warning, using JSON file fallback:', err);
    
    const jsonPath = getJsonPath();
    const readStore = (): ParticipantRecord[] => {
      try {
        if (fs.existsSync(jsonPath)) {
          const raw = fs.readFileSync(jsonPath, 'utf8');
          return JSON.parse(raw);
        }
      } catch (e) {
        console.error('Error reading JSON store', e);
      }
      return [];
    };

    const writeStore = (records: ParticipantRecord[]) => {
      try {
        fs.writeFileSync(jsonPath, JSON.stringify(records, null, 2), 'utf8');
      } catch (e) {
        console.error('Error writing JSON store', e);
      }
    };

    dbInstance = {
      type: 'json_fallback',
      saveResult: (record: Omit<ParticipantRecord, 'created_at'>) => {
        const store = readStore();
        const existingIdx = store.findIndex(r => r.user_id === record.user_id);
        const newRecord: ParticipantRecord = {
          ...record,
          created_at: new Date().toISOString()
        };

        if (existingIdx >= 0) {
          store[existingIdx] = {
            ...store[existingIdx],
            name: record.name,
            total_score: Math.max(store[existingIdx].total_score, record.total_score),
            total_correct: Math.max(store[existingIdx].total_correct, record.total_correct),
            total_attempted: Math.max(store[existingIdx].total_attempted, record.total_attempted),
            created_at: new Date().toISOString()
          };
        } else {
          store.push(newRecord);
        }
        writeStore(store);
      },
      getLeaderboard: (): ParticipantRecord[] => {
        const store = readStore();
        return store.sort((a, b) => b.total_score - a.total_score || b.total_correct - a.total_correct);
      },
      clear: () => {
        writeStore([]);
      }
    };
    return dbInstance;
  }
}

export function saveChallengeResult(record: { user_id: string; name: string; total_score: number; total_correct: number; total_attempted: number }) {
  const db = getSqliteDatabase();
  const id = `result_${record.user_id}`;
  db.saveResult({ id, ...record });
}

export function getSqliteLeaderboard(): ParticipantRecord[] {
  const db = getSqliteDatabase();
  return db.getLeaderboard();
}

export function clearSqliteLeaderboard() {
  const db = getSqliteDatabase();
  db.clear();
}

