import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  // Verify the calling user is authenticated
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    // If no service key configured, return empty list gracefully
    return NextResponse.json({ doctors: [] })
  }

  const adminClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data, error } = await adminClient.auth.admin.listUsers()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const doctors = (data.users ?? []).map((u) => ({
    id: u.id,
    email: u.email ?? '',
    created_at: u.created_at,
    language: u.user_metadata?.language ?? null,
  }))

  return NextResponse.json({ doctors })
}
