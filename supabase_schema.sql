-- Supabase PostgreSQL Schema for Logo Guesser

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table
-- Stores participants, their college ID acts as a unique identifier.
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  college_id VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Questions / Logos Table
-- Stores the valid logos that will be sourced from our logos.json script.
CREATE TABLE IF NOT EXISTS public.questions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  image_url TEXT NOT NULL
);

-- 3. Submissions Table
-- Audits every single answer submitted to calculate final score accurately
-- and prevent cheating/double submissions.
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  question_id INTEGER REFERENCES public.questions(id) NOT NULL,
  selected_option VARCHAR(100) NOT NULL,
  is_correct BOOLEAN NOT NULL,
  time_remaining_ms INTEGER NOT NULL,
  score_awarded INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure a user can only answer a specific question once
  UNIQUE (user_id, question_id)
);

-- Create Index for fast lookups per user
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);

-- Enable Row Level Security (RLS) but allow anonymous inserts for the fest API
-- Warning: In a real-world secure app, you'd use authenticated roles. 
-- For high-traffic edge APIs, we often interact with the service role key from the server.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Allow entirely server-side access (service_role)
DROP POLICY IF EXISTS "Enable all for service role on users" ON public.users;
DROP POLICY IF EXISTS "Enable all for service role on questions" ON public.questions;
DROP POLICY IF EXISTS "Enable all for service role on submissions" ON public.submissions;

CREATE POLICY "Enable all for service role on users" ON public.users FOR ALL USING (true);
CREATE POLICY "Enable all for service role on questions" ON public.questions FOR ALL USING (true);
CREATE POLICY "Enable all for service role on submissions" ON public.submissions FOR ALL USING (true);
