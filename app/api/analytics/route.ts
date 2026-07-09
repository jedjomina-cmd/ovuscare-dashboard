import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

  const [patientsRes, recentDialogsRes, flaggedRes, last14Res] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase
      .from('dialogs_log')
      .select('id', { count: 'exact', head: true })
      .gte('date', sevenDaysAgo),
    supabase
      .from('dialogs_log')
      .select('id', { count: 'exact', head: true })
      .eq('flagged', true)
      .gte('date', sevenDaysAgo),
    supabase
      .from('dialogs_log')
      .select('date')
      .gte('date', fourteenDaysAgo)
      .order('date'),
  ])

  // Build 14-day messages-per-day array
  const messagesPerDay = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const dateStr = d.toISOString().split('T')[0]
    const count = (last14Res.data ?? []).filter(
      (r: { date: string | null }) => r.date?.startsWith(dateStr)
    ).length
    return {
      date: dateStr,
      label: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      count,
    }
  })

  return NextResponse.json({
    totalPatients: patientsRes.count ?? 0,
    messagesLast7Days: recentDialogsRes.count ?? 0,
    flaggedCount: flaggedRes.count ?? 0,
    messagesPerDay,
  })
}
