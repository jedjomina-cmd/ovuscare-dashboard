import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('display_name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ patients: data })
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient()
  const body = await request.json() as Record<string, unknown>

  const { data, error } = await supabase
    .from('patients')
    .insert([body])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ patient: data }, { status: 201 })
}
