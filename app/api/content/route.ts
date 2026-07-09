import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient()
  const { searchParams } = new URL(request.url)
  const stage = searchParams.get('stage')
  const language = searchParams.get('language')

  let query = supabase
    .from('content')
    .select('*')
    .order('created_at', { ascending: false })

  if (stage) query = query.eq('stage', stage)
  if (language) query = query.eq('language', language)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ items: data })
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const body = await request.json() as Record<string, unknown>

  const { data, error } = await supabase
    .from('content')
    .insert([body])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ item: data }, { status: 201 })
}
