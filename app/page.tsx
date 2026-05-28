'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Patient, DialogLog } from '@/types'
import StatsCard from '@/components/StatsCard'
import PatientTable from '@/components/PatientTable'
import MessagesBarChart from '@/components/charts/MessagesBarChart'
import EngagementMetrics from '@/components/charts/EngagementMetrics'
import { useI18n } from '@/lib/i18n'

interface ChartPoint {
  date: string
  label: string
  count: number
}

function buildLast14DaysChart(dialogs: Pick<DialogLog, 'date'>[]): ChartPoint[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (13 - i))
    const dateStr = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
    const count = dialogs.filter((x) => x.date?.startsWith(dateStr)).length
    return { date: dateStr, label, count }
  })
}

function computeEngagement(
  dialogs: Pick<DialogLog, 'patient_id' | 'date'>[],
  patients: Patient[]
) {
  if (dialogs.length === 0) return { avgMessages: '0', percentEvening: '0', avgDays: '0' }

  const uniquePatients = new Set(dialogs.map((d) => d.patient_id)).size
  const avgMessages = uniquePatients > 0 ? (dialogs.length / uniquePatients).toFixed(1) : '0'

  const eveningCount = dialogs.filter((d) => d.date && new Date(d.date).getHours() >= 18).length
  const percentEvening = ((eveningCount / dialogs.length) * 100).toFixed(1)

  const today = new Date()
  const withLastReply = patients.filter((p) => p.last_reply)
  const avgDays =
    withLastReply.length > 0
      ? (
          withLastReply.reduce((sum, p) => {
            return sum + (today.getTime() - new Date(p.last_reply!).getTime()) / 86400000
          }, 0) / withLastReply.length
        ).toFixed(1)
      : '0'

  return { avgMessages, percentEvening, avgDays }
}

export default function DashboardPage() {
  const { t } = useI18n()
  const [patients, setPatients] = useState<Patient[]>([])
  const [dialogs, setDialogs] = useState<Pick<DialogLog, 'patient_id' | 'date'>[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const [patientsRes, dialogsRes] = await Promise.all([
      supabase.from('patients').select('*').order('display_name'),
      supabase
        .from('dialogs_log')
        .select('patient_id, date')
        .gte('date', fourteenDaysAgo)
        .order('date'),
    ])

    if (patientsRes.data) setPatients(patientsRes.data as Patient[])
    if (dialogsRes.data) setDialogs(dialogsRes.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleBotUpdate = (id: string, value: boolean) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ai_assistant_active: value } : p))
    )
  }

  const totalEnrolled = patients.length
  const botActive = patients.filter((p) => p.ai_assistant_active).length
  const wroteToBot = patients.filter((p) => p.last_reply !== null).length
  const secondAppt = patients.filter((p) => p.second_appointment !== null).length

  const chartData = buildLast14DaysChart(dialogs)
  const { avgMessages, percentEvening, avgDays } = computeEngagement(dialogs, patients)

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard label={t.stats.totalEnrolled} value={totalEnrolled} loading={loading} />
        <StatsCard label={t.stats.botActive} value={botActive} loading={loading} />
        <StatsCard label={t.stats.wroteToBot} value={wroteToBot} loading={loading} />
        <StatsCard label={t.stats.secondAppointment} value={secondAppt} loading={loading} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Messages bar chart — spans 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/70 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {t.charts.messagesLast14Days}
          </h2>
          <MessagesBarChart data={chartData} loading={loading} emptyLabel={t.charts.noData} />
        </div>

        {/* Engagement metrics */}
        <div className="bg-white rounded-xl border border-gray-200/70 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            {t.charts.engagementMetrics}
          </h2>
          <EngagementMetrics
            avgMessages={avgMessages}
            percentEvening={percentEvening}
            avgDaysSinceLast={avgDays}
            labels={{
              avgMessages: t.charts.avgMessages,
              afterEvening: t.charts.afterEvening,
              daysSinceLast: t.charts.daysSinceLast,
            }}
            loading={loading}
          />
        </div>
      </div>

      {/* Patients table */}
      <PatientTable patients={patients} loading={loading} onBotUpdate={handleBotUpdate} />
    </div>
  )
}
