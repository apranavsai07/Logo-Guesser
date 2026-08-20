import { NextResponse } from 'next/server'
import { supabase } from '@/utils/supabase'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Insert new user with name only
    const { data, error } = await supabase
      .from('users')
      .insert({ name })
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