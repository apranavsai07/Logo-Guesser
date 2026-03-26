import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, collegeId } = body

    if (!name || !collegeId) {
      return NextResponse.json({ error: 'Name and College ID are required' }, { status: 400 })
    }

    const rollRegex = /^\d{4}-\d{2}-\d{3}-\d{3}$/
    if (!rollRegex.test(collegeId)) {
      return NextResponse.json({ error: 'Invalid College ID format. Must be xxxx-xx-xxx-xxx' }, { status: 400 })
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

    if (data.play_count >= 3) {
      return NextResponse.json({ error: 'Your chances are over. Maximum 3 plays allowed.' }, { status: 403 })
    }

    return NextResponse.json({ user: data }, { status: 200 })
  } catch (err) {
    console.error('Error in /api/register:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
