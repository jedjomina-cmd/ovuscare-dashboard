import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { data: patient, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
  }

  const [dialogsRes, sentRes] = await Promise.all([
    supabase
      .from('dialogs_log')
      .select('*')
      .eq('patient_id', patient.patient_id)
      .order('date', { ascending: false })
      .limit(50),
    supabase
      .from('sent_log')
      .select('*')
      .eq('patient_id', patient.patient_id)
      .order('sent_at', { ascending: false }),
  ])

  return NextResponse.json({
    patient,
    dialogues: dialogsRes.data ?? [],
    sentLog: sentRes.data ?? [],
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()
  const body = await request.json() as Record<string, unknown>

  const { data, error } = await supabase
    .from('patients')
    .update(body)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ patient: data })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseServerClient()

  const { error } = await supabase.from('patients').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
