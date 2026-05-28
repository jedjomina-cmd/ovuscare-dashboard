'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Patient, DialogLog, SentLog } from '@/types'
import { useI18n } from '@/lib/i18n'
import ActivityDot from '@/components/ActivityDot'
import BotToggle from '@/components/BotToggle'
import ConfirmDialog from '@/components/ConfirmDialog'
import { SkeletonText, SkeletonBlock } from '@/components/Skeleton'
import {
  IconChevronLeft,
  IconId,
  IconPhone,
  IconBrandTelegram,
  IconEdit,
  IconTrash,
  IconCalendar,
  IconRobot,
} from '@tabler/icons-react'

function formatDate(d: string | null) {
  if (!d) return null
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

function formatSentAt(d: string | null): string {
  if (!d) return '—'
  const dt = new Date(d)
  const date = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const time = dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

export default function PatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { t } = useI18n()
  const router = useRouter()

  const [patient, setPatient] = useState<Patient | null>(null)
  const [dialogs, setDialogs] = useState<DialogLog[]>([])
  const [sentLogs, setSentLogs] = useState<SentLog[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [bookDate, setBookDate] = useState('')
  const [bookingLoading, setBookingLoading] = useState(false)

  useEffect(() => {
    async function fetchData() {
      // Fetch patient first — we need patient.patient_id ("P001") to join dialogs_log,
      // because dialogs_log.patient_id stores that human-readable ID, not the UUID.
      const patientRes = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

      if (patientRes.error || !patientRes.data) {
        toast.error('Patient not found')
        router.push('/')
        return
      }

      const fetchedPatient = patientRes.data as Patient
      setPatient(fetchedPatient)

      // Fetch dialogs and sent_log in parallel — both use the human-readable patient_id
      const [dialogsRes, sentRes] = await Promise.all([
        supabase
          .from('dialogs_log')
          .select('*')
          .eq('patient_id', fetchedPatient.patient_id)
          .order('date', { ascending: false })
          .limit(20),
        supabase
          .from('sent_log')
          .select('id, caption, sent_at')
          .eq('patient_id', fetchedPatient.patient_id)
          .order('sent_at', { ascending: false })
          .limit(5),
      ])

      setDialogs((dialogsRes.data ?? []) as DialogLog[])
      setSentLogs((sentRes.data ?? []) as SentLog[])
      setLoading(false)
    }
    fetchData()
  }, [id, router])

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await supabase.from('patients').delete().eq('id', id)
    setDeleting(false)
    if (error) {
      toast.error(t.toast.error)
    } else {
      toast.success(t.toast.deleted)
      router.push('/')
    }
  }

  const handleBookAppointment = async () => {
    if (!bookDate) return
    setBookingLoading(true)
    const { error } = await supabase
      .from('patients')
      .update({ second_appointment: bookDate })
      .eq('id', id)
    setBookingLoading(false)
    if (error) {
      toast.error(t.toast.error)
    } else {
      toast.success(t.toast.appointmentBooked)
      setPatient((p) => (p ? { ...p, second_appointment: bookDate } : p))
      setBookingOpen(false)
    }
  }

  const handleBotUpdate = (value: boolean) => {
    setPatient((p) => (p ? { ...p, ai_assistant_active: value } : p))
    toast.success(t.toast.botUpdated)
  }

  // Compute bot engagement stats — skip rows where date is null
  const datedDialogs = dialogs.filter((d) => d.date !== null)
  const totalMessages = dialogs.length
  const eveningMessages = datedDialogs.filter(
    (d) => new Date(d.date!).getHours() >= 18
  ).length
  const pctEvening =
    totalMessages > 0 ? ((eveningMessages / totalMessages) * 100).toFixed(0) : '0'
  const activeDays = new Set(datedDialogs.map((d) => d.date!.split('T')[0])).size
  const sortedDialogs = [...datedDialogs].sort(
    (a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime()
  )
  const firstMsg = sortedDialogs[0]?.date ?? null
  const lastMsg = sortedDialogs[sortedDialogs.length - 1]?.date ?? null

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-5">
        <SkeletonText className="w-24" />
        <SkeletonBlock className="h-36 w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 space-y-4">
            <SkeletonBlock className="h-64 w-full" />
            <SkeletonBlock className="h-40 w-full" />
          </div>
          <SkeletonBlock className="lg:col-span-2 h-96 w-full" />
        </div>
      </div>
    )
  }

  if (!patient) return null

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <IconChevronLeft size={16} strokeWidth={1.75} />
        {t.actions.back}
      </Link>

      {/* Header card */}
      <div className="bg-white rounded-xl border border-gray-200/70 p-5">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-full bg-[#1D9E75]/15 flex items-center justify-center text-[#1D9E75] text-xl font-bold flex-shrink-0">
            {getInitials(patient.display_name)}
          </div>

          {/* Name + info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-[20px] font-[500] text-gray-900 leading-tight">
              {patient.display_name}
            </h1>

            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <IconId size={15} strokeWidth={1.75} className="text-gray-400 flex-shrink-0" />
                {patient.patient_id || '—'}
              </div>
              {patient.patient_phone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <IconPhone size={15} strokeWidth={1.75} className="text-gray-400 flex-shrink-0" />
                  {patient.patient_phone}
                </div>
              )}
              {patient.telegram_chat_id && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <IconBrandTelegram
                    size={15}
                    strokeWidth={1.75}
                    className="text-gray-400 flex-shrink-0"
                  />
                  {patient.telegram_chat_id}
                </div>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {patient.stage && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {patient.stage}
                </span>
              )}
              <span
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  patient.ai_assistant_active
                    ? 'bg-[#1D9E75]/10 text-[#1D9E75]'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                <IconRobot size={12} strokeWidth={1.75} />
                {patient.ai_assistant_active ? t.patient.botActive : t.patient.botPaused}
              </span>
              <span className="flex items-center gap-1.5">
                <ActivityDot lastReply={patient.last_reply} />
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <button
              onClick={() => {
                setBookDate(patient.second_appointment ?? '')
                setBookingOpen(true)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <IconCalendar size={14} strokeWidth={1.75} />
              {t.actions.book2nd}
            </button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg">
              <IconRobot size={14} strokeWidth={1.75} />
              <BotToggle
                patientId={patient.id}
                initialValue={patient.ai_assistant_active}
                onUpdate={handleBotUpdate}
              />
            </div>

            <Link
              href={`/patients/${patient.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <IconEdit size={14} strokeWidth={1.75} />
              {t.actions.edit}
            </Link>

            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-100 bg-red-50/50 rounded-lg hover:bg-red-100/50 transition-colors"
            >
              <IconTrash size={14} strokeWidth={1.75} />
              {t.actions.delete}
            </button>
          </div>
        </div>
      </div>

      {/* Content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          {/* Patient info */}
          <div className="bg-white rounded-xl border border-gray-200/70 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              {t.patient.patientInfo}
            </h2>
            <dl className="space-y-3">
              {[
                { label: t.patient.initialStage, value: patient.initial_stage },
                { label: t.patient.currentStage, value: patient.stage },
                {
                  label: t.patient.stageStartDate,
                  value: formatDate(patient.stage_start_date),
                },
                { label: t.patient.assignments, value: patient.assignments },
                { label: t.patient.lastMessage, value: formatDate(patient.last_reply) },
                {
                  label: t.patient.secondAppointment,
                  value: formatDate(patient.second_appointment) ?? t.patient.notBooked,
                },
              ].map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs text-gray-400">{label}</dt>
                  <dd className="text-sm text-gray-800 mt-0.5 font-medium">
                    {value || '—'}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Bot engagement */}
          <div className="bg-white rounded-xl border border-gray-200/70 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              {t.patient.botEngagement}
            </h2>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: t.patient.totalMessages, value: totalMessages },
                { label: t.patient.afterEvening, value: `${pctEvening}%` },
                { label: t.patient.daysActive, value: activeDays },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-2 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">{value}</div>
                  <div className="text-xs text-gray-500 leading-tight mt-0.5">{label}</div>
                </div>
              ))}
            </div>

            <dl className="space-y-2">
              <div>
                <dt className="text-xs text-gray-400">{t.patient.firstMessage}</dt>
                <dd className="text-sm text-gray-800 font-medium">
                  {formatDate(firstMsg) ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-gray-400">{t.patient.lastMessage}</dt>
                <dd className="text-sm text-gray-800 font-medium">
                  {formatDate(lastMsg) ?? '—'}
                </dd>
              </div>
            </dl>
          </div>

          {/* Videos sent */}
          <div className="bg-white rounded-xl border border-gray-200/70 p-5">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
              {t.analytics.videosSent}
            </h2>
            {sentLogs.length === 0 ? (
              <p className="text-sm text-gray-400">{t.analytics.noVideos}</p>
            ) : (
              <ul className="space-y-3">
                {sentLogs.map((v) => (
                  <li key={v.id} className="flex flex-col gap-0.5">
                    <span className="text-sm text-gray-800 leading-snug line-clamp-2">
                      {v.caption || '—'}
                    </span>
                    <span className="text-xs text-gray-400">{formatSentAt(v.sent_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right column — chat */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200/70 p-5 flex flex-col">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            {t.patient.chat}
          </h2>

          {dialogs.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm text-gray-400">
              {t.patient.noChatHistory}
            </div>
          ) : (
            <div className="space-y-5 overflow-y-auto max-h-[540px] pr-1">
              {[...dialogs]
                .sort((a, b) => {
                  if (!a.date) return 1
                  if (!b.date) return -1
                  return new Date(b.date).getTime() - new Date(a.date).getTime()
                })
                .slice(0, 20) // newest 20 exchanges
                .map((msg) => (
                  <div key={msg.id} className="space-y-2">
                    {/* Timestamp */}
                    <p className="text-xs text-gray-400 text-center">
                      {msg.date ? `${formatDate(msg.date)} · ${formatTime(msg.date)}` : '—'}
                    </p>

                    {/* Patient message (right, green) */}
                    {msg.user_message && (
                      <div className="flex justify-end">
                        <div className="max-w-[75%] px-3.5 py-2.5 bg-[#1D9E75] text-white text-sm rounded-2xl rounded-br-sm shadow-sm">
                          {msg.user_message}
                        </div>
                      </div>
                    )}

                    {/* Bot response (left, gray) */}
                    {msg.ai_response && (
                      <div className="flex justify-start">
                        <div className="max-w-[75%] px-3.5 py-2.5 bg-gray-100 text-gray-800 text-sm rounded-2xl rounded-bl-sm shadow-sm">
                          {msg.ai_response}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={deleteOpen}
        title={t.confirm.deletePatient}
        message={t.confirm.deletePatientMessage}
        confirmLabel={t.confirm.confirm}
        cancelLabel={t.confirm.cancel}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={deleting}
      />

      {/* Book 2nd appointment modal */}
      {bookingOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setBookingOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-sm shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-gray-900 mb-4">{t.actions.book2nd}</h3>
            <input
              type="date"
              value={bookDate}
              onChange={(e) => setBookDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setBookingOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                {t.actions.cancel}
              </button>
              <button
                onClick={handleBookAppointment}
                disabled={!bookDate || bookingLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] disabled:opacity-50"
              >
                {bookingLoading ? 'Saving…' : t.actions.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
