'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Patient, DialogLog, SentLog } from '@/types'
import { useI18n } from '@/lib/i18n'
import MessagesBarChart from '@/components/charts/MessagesBarChart'
import StatsCard from '@/components/StatsCard'

interface ChartPoint {
  date: string
  label: string
  count: number
}

function buildChart(dialogs: Pick<DialogLog, 'date'>[], days: number): ChartPoint[] {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (days - 1 - i))
    const dateStr = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const count = dialogs.filter((x) => x.date?.startsWith(dateStr)).length
    return { date: dateStr, label, count }
  })
}

function formatSentAt(d: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  const date = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const time = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
}

function truncate(text: string | null, max = 40): string {
  if (!text) return '—'
  return text.length > max ? text.slice(0, max) + '…' : text
}

export default function AnalyticsPage() {
  const { t } = useI18n()
  const [patients, setPatients] = useState<Patient[]>([])
  const [dialogs, setDialogs] = useState<Pick<DialogLog, 'patient_id' | 'date'>[]>([])
  const [sentLogs, setSentLogs] = useState<SentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState('')

  useEffect(() => {
    async function fetchData() {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      const [pr, dr, sr] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase
          .from('dialogs_log')
          .select('patient_id, date')
          .gte('date', thirtyDaysAgo),
        supabase
          .from('sent_log')
          .select('id, patient_id, caption, sent_at')
          .order('sent_at', { ascending: false }),
      ])
      if (pr.data) setPatients(pr.data as Patient[])
      if (dr.data) setDialogs(dr.data)
      if (sr.data) setSentLogs(sr.data as SentLog[])
      setLoading(false)
    }
    fetchData()
  }, [])

  const uniquePatientIds = Array.from(new Set(sentLogs.map((r) => r.patient_id))).sort()
  const filteredSentLogs =
    selectedPatient === '' ? sentLogs : sentLogs.filter((r) => r.patient_id === selectedPatient)

  const chart30 = buildChart(dialogs, 30)
  const totalMessages = dialogs.length
  const activePatientsCount = new Set(dialogs.map((d) => d.patient_id)).size
  const eveningPct =
    totalMessages > 0
      ? (
          (dialogs.filter((d) => d.date && new Date(d.date).getHours() >= 18).length /
            totalMessages) *
          100
        ).toFixed(1)
      : '0'

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-6">
      <h1 className="text-lg font-semibold text-gray-900">{t.analytics.title}</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard label={t.stats.totalEnrolled} value={patients.length} loading={loading} />
        <StatsCard label="Active patients (30d)" value={activePatientsCount} loading={loading} />
        <StatsCard label="Total messages (30d)" value={totalMessages} loading={loading} />
        <StatsCard label={t.charts.afterEvening} value={`${eveningPct}%`} loading={loading} />
        <StatsCard
          label={t.analytics.totalVideosSent}
          value={sentLogs.length}
          loading={loading}
        />
      </div>

      {/* Messages bar chart */}
      <div className="bg-white rounded-xl border border-gray-200/70 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Messages — last 30 days</h2>
        <MessagesBarChart data={chart30} loading={loading} emptyLabel={t.charts.noData} />
      </div>

      {/* Videos Sent table */}
      <div className="bg-white rounded-xl border border-gray-200/70 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold text-gray-700">{t.analytics.videosSent}</h2>
          <select
            value={selectedPatient}
            onChange={(e) => setSelectedPatient(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 disabled:opacity-40"
            disabled={loading || uniquePatientIds.length === 0}
          >
            <option value="">All Patients</option>
            {uniquePatientIds.map((pid) => (
              <option key={pid} value={pid}>
                {pid}
              </option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[t.analytics.videoPatient, t.analytics.videoCaption, t.analytics.videoSentAt].map(
                  (col) => (
                    <th
                      key={col}
                      className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-5 py-3"
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {[75, 85, 60].map((w, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-200 rounded" style={{ width: `${w}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredSentLogs.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-5 py-12 text-center text-sm text-gray-400">
                    {t.analytics.noVideos}
                  </td>
                </tr>
              ) : (
                filteredSentLogs.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50/40 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">
                      {row.patient_id}
                    </td>
                    <td className="px-5 py-3 text-gray-700 max-w-sm">
                      {truncate(row.caption)}
                    </td>
                    <td className="px-5 py-3 text-gray-500 whitespace-nowrap text-xs">
                      {formatSentAt(row.sent_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
