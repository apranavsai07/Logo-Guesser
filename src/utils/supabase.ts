import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY! // Using service role to bypass RLS for API routes

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials are not fully set in .env.local")
}

export const supabase = createClient(supabaseUrl, supabaseKey)
