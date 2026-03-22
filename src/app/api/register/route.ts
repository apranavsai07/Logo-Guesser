import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, collegeId } = body

    if (!name || !collegeId) {
      return NextResponse.json({ error: 'Name and College ID are required' }, { status: 400 })
    }

    // Upsert user based on collegeId (which is unique)
    const { data, error } = await supabase
      .from('users')
      .upsert({ name, college_id: collegeId }, { onConflict: 'college_id' })
      .select()
      .single()

    if (error) {
      console.error('Error in /api/register:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ user: data }, { status: 200 })
  } catch (err) {
    console.error('Error in /api/register:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
