'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IconSearch, IconPlus } from '@tabler/icons-react'
import Link from 'next/link'
import type { Patient } from '@/types'
import ActivityDot from './ActivityDot'
import BotToggle from './BotToggle'
import { SkeletonRow } from './Skeleton'
import { useI18n } from '@/lib/i18n'

interface PatientTableProps {
  patients: Patient[]
  loading?: boolean
  onBotUpdate?: (id: string, value: boolean) => void
}

function formatLastReply(dateStr: string | null): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function PatientTable({ patients, loading, onBotUpdate }: PatientTableProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [search, setSearch] = useState('')

  const filtered = patients.filter(
    (p) =>
      p.display_name.toLowerCase().includes(search.toLowerCase()) ||
      p.patient_id.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200/70 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-100">
        <div className="relative flex-1 max-w-sm">
          <IconSearch
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.table.searchPlaceholder}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]/60 bg-gray-50/50"
          />
        </div>
        <Link
          href="/patients/new"
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] transition-colors"
        >
          <IconPlus size={15} strokeWidth={2} />
          {t.table.addPatient}
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {[
                t.table.name,
                t.table.id,
                t.table.stage,
                t.table.assignments,
                t.table.lastMessage,
                t.table.activity,
                t.table.bot,
              ].map((col) => (
                <th
                  key={col}
                  className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={7} />)
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-gray-400">
                  {search ? t.table.noPatients : t.empty.noPatients}
                </td>
              </tr>
            ) : (
              filtered.map((patient) => (
                <tr
                  key={patient.id}
                  onClick={() => router.push(`/patients/${patient.id}`)}
                  className="hover:bg-gray-50/60 cursor-pointer transition-colors group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#1D9E75]/10 flex items-center justify-center text-[#1D9E75] text-xs font-semibold flex-shrink-0">
                        {patient.display_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900 group-hover:text-[#1D9E75] transition-colors">
                        {patient.display_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                    {patient.patient_id || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {patient.stage ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {patient.stage}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">
                    {patient.assignments || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatLastReply(patient.last_reply)}
                  </td>
                  <td className="px-4 py-3">
                    <ActivityDot lastReply={patient.last_reply} />
                  </td>
                  <td className="px-4 py-3">
                    <BotToggle
                      patientId={patient.id}
                      initialValue={patient.ai_assistant_active}
                      onUpdate={(v) => onBotUpdate?.(patient.id, v)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
