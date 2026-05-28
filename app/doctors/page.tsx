'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useI18n, type Language } from '@/lib/i18n'
import { IconPlus, IconX, IconUserCircle } from '@tabler/icons-react'
import { SkeletonRow } from '@/components/Skeleton'

interface DoctorRow {
  id: string
  email: string
  created_at: string
  language?: string
}

const languageLabels: Record<Language, string> = {
  en: 'English',
  ru: 'Русский',
  lv: 'Latviešu',
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export default function DoctorsPage() {
  const { t } = useI18n()
  const [doctors, setDoctors] = useState<DoctorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteLang, setInviteLang] = useState<Language>('en')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    fetchDoctors()
  }, [])

  async function fetchDoctors() {
    setLoading(true)
    // Fetch users from auth.users via admin API — requires service role.
    // Here we call our own API route that uses the service role key.
    const res = await fetch('/api/doctors')
    if (res.ok) {
      const data = await res.json()
      setDoctors(data.doctors ?? [])
    }
    setLoading(false)
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setInviting(true)

    const res = await fetch('/api/doctors/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail, language: inviteLang }),
    })

    setInviting(false)

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? t.toast.error)
    } else {
      toast.success(t.toast.inviteSent)
      setInviteEmail('')
      setInviteOpen(false)
      fetchDoctors()
    }
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]/60 bg-white'

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">{t.doctors.title}</h1>
        <button
          onClick={() => setInviteOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] transition-colors"
        >
          <IconPlus size={15} strokeWidth={2} />
          {t.doctors.invite}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200/70 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100">
              {[t.doctors.email, t.doctors.language, t.doctors.invited].map((col) => (
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
              Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} cols={3} />)
            ) : doctors.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-4 py-12 text-center text-sm text-gray-400">
                  {t.doctors.noDoctors}
                </td>
              </tr>
            ) : (
              doctors.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <IconUserCircle
                        size={20}
                        className="text-gray-300 flex-shrink-0"
                        strokeWidth={1.5}
                      />
                      <span className="text-gray-800">{doc.email}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {doc.language ? languageLabels[doc.language as Language] ?? doc.language : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(doc.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {inviteOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setInviteOpen(false)}
        >
          <div
            className="bg-white rounded-2xl border border-gray-200 p-6 w-full max-w-sm shadow-xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-gray-900">{t.doctors.invite}</h3>
              <button
                onClick={() => setInviteOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <IconX size={16} strokeWidth={1.75} />
              </button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t.doctors.inviteEmail}
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className={inputClass}
                  placeholder="doctor@clinic.com"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t.doctors.inviteLanguage}
                </label>
                <select
                  value={inviteLang}
                  onChange={(e) => setInviteLang(e.target.value as Language)}
                  className={inputClass}
                >
                  <option value="en">English</option>
                  <option value="ru">Русский</option>
                  <option value="lv">Latviešu</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setInviteOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {t.actions.cancel}
                </button>
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] disabled:opacity-60"
                >
                  {inviting ? 'Sending…' : t.actions.send}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
