'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { DialogLog, Patient } from '@/types'
import { useI18n } from '@/lib/i18n'
import { IconSearch, IconChevronDown, IconChevronUp } from '@tabler/icons-react'
import { SkeletonRow } from '@/components/Skeleton'

interface EnrichedDialog extends DialogLog {
  patient_name?: string
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function DialoguesPage() {
  const { t } = useI18n()
  const [dialogs, setDialogs] = useState<EnrichedDialog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    async function fetchData() {
      const [dialogsRes, patientsRes] = await Promise.all([
        supabase
          .from('dialogs_log')
          .select('*')
          .order('date', { ascending: false })
          .limit(20),
        // Select patient_id (the human-readable "P001" field) as the join key
        supabase.from('patients').select('patient_id, display_name'),
      ])

      // Key the map on patient_id ("P001") — that's what dialogs_log.patient_id stores
      const patientMap = new Map<string, string>(
        (patientsRes.data ?? []).map(
          (p: Pick<Patient, 'patient_id' | 'display_name'>) => [p.patient_id, p.display_name]
        )
      )

      const enriched: EnrichedDialog[] = (dialogsRes.data ?? []).map((d: DialogLog) => ({
        ...d,
        patient_name: patientMap.get(d.patient_id),
      }))

      setDialogs(enriched)
      setLoading(false)
    }
    fetchData()
  }, [])

  const toggleRow = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const filtered = dialogs.filter(
    (d) =>
      (d.patient_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (d.user_message ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (d.ai_response ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <h1 className="text-lg font-semibold text-gray-900">{t.dialogues.title}</h1>

      {/* Search */}
      <div className="relative max-w-sm">
        <IconSearch
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          strokeWidth={1.75}
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t.dialogues.search}
          className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 bg-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200/70 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {[
                  t.dialogues.date,
                  t.dialogues.patient,
                  t.dialogues.userMessage,
                  t.dialogues.aiResponse,
                  '',
                ].map((col, i) => (
                  <th
                    key={i}
                    className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={5} />)
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-gray-400">
                    {t.dialogues.noDialogues}
                  </td>
                </tr>
              ) : (
                filtered.map((d) => {
                  const expanded = expandedIds.has(d.id)
                  return (
                    <tr
                      key={d.id}
                      onClick={() => toggleRow(d.id)}
                      className={`cursor-pointer align-top transition-colors ${
                        expanded ? 'bg-gray-50/70' : 'hover:bg-gray-50/40'
                      }`}
                    >
                      {/* Date */}
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {d.date ? formatDateTime(d.date) : '—'}
                      </td>

                      {/* Patient */}
                      <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                        {d.patient_name ?? (
                          <span className="text-gray-400 font-normal font-mono text-xs">
                            {d.patient_id}
                          </span>
                        )}
                      </td>

                      {/* User message */}
                      <td className="px-4 py-3 text-gray-600 max-w-xs">
                        {expanded ? (
                          <p className="whitespace-pre-wrap">{d.user_message ?? '—'}</p>
                        ) : (
                          <p className="line-clamp-3">{d.user_message ?? '—'}</p>
                        )}
                      </td>

                      {/* AI response */}
                      <td className="px-4 py-3 text-gray-600 max-w-xs">
                        {expanded ? (
                          <p className="whitespace-pre-wrap">{d.ai_response ?? '—'}</p>
                        ) : (
                          <p className="line-clamp-3">{d.ai_response ?? '—'}</p>
                        )}
                      </td>

                      {/* Expand toggle */}
                      <td className="px-4 py-3 text-gray-400 w-8">
                        {expanded ? (
                          <IconChevronUp size={14} strokeWidth={1.75} />
                        ) : (
                          <IconChevronDown size={14} strokeWidth={1.75} />
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
