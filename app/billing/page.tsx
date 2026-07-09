'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Clinic } from '@/types'
import { IconCalendar, IconExternalLink } from '@tabler/icons-react'
import { SkeletonBlock } from '@/components/Skeleton'

const PLAN_LABELS: Record<string, string> = {
  pilot: 'Pilot',
  starter: 'Starter',
  growth: 'Growth',
  enterprise: 'Enterprise',
}

const PLAN_COLORS: Record<string, string> = {
  pilot: 'bg-amber-50 text-amber-700 border-amber-200',
  starter: 'bg-blue-50 text-blue-700 border-blue-200',
  growth: 'bg-[#0D9488]/10 text-[#0D9488] border-[#0D9488]/20',
  enterprise: 'bg-[#1A2B2B]/10 text-[#1A2B2B] border-[#1A2B2B]/20',
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function daysUntil(d: string | null): number | null {
  if (!d) return null
  const diff = new Date(d).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

export default function BillingPage() {
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchClinic() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { data } = await supabase
        .from('clinics')
        .select('*')
        .limit(1)
        .single()

      setClinic(data as Clinic | null)
      setLoading(false)
    }
    fetchClinic()
  }, [])

  const pilotDays = clinic ? daysUntil(clinic.pilot_expires_at) : null

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <h1 className="text-lg font-semibold text-gray-900">Billing & Plan</h1>

      {loading ? (
        <SkeletonBlock className="h-48 w-full" />
      ) : (
        <>
          {/* Current plan card */}
          <div className="bg-white rounded-xl border border-gray-200/70 p-6 space-y-4">
            <h2 className="text-sm font-semibold text-gray-700">Current plan</h2>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${PLAN_COLORS[clinic?.plan ?? 'pilot'] ?? PLAN_COLORS.pilot}`}>
                {PLAN_LABELS[clinic?.plan ?? 'pilot'] ?? clinic?.plan ?? 'Pilot'}
              </span>
            </div>

            {clinic?.plan === 'pilot' && clinic.pilot_expires_at && (
              <div className="flex items-start gap-2.5 p-4 rounded-lg bg-amber-50 border border-amber-100">
                <IconCalendar size={16} className="text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={1.75} />
                <div>
                  <p className="text-sm font-medium text-amber-800">
                    Pilot expires {formatDate(clinic.pilot_expires_at)}
                  </p>
                  {pilotDays !== null && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      {pilotDays > 0 ? `${pilotDays} days remaining` : 'Pilot period has ended'}
                    </p>
                  )}
                </div>
              </div>
            )}

            <dl className="space-y-3 pt-2">
              <div>
                <dt className="text-xs text-gray-400">Clinic</dt>
                <dd className="text-sm font-medium text-gray-800 mt-0.5">{clinic?.name ?? '—'}</dd>
              </div>
              {clinic?.pilot_expires_at && (
                <div>
                  <dt className="text-xs text-gray-400">Pilot expiry</dt>
                  <dd className="text-sm font-medium text-gray-800 mt-0.5">
                    {formatDate(clinic.pilot_expires_at)}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Upgrade CTA */}
          <div className="bg-[#1A2B2B] rounded-xl p-6 space-y-3">
            <h2 className="text-sm font-semibold text-white">Ready to continue after the pilot?</h2>
            <p className="text-sm text-white/60">
              Book a call to discuss pricing and features that fit your clinic's needs.
            </p>
            <a
              href="https://calendly.com/je-djomina/ovuscare-demo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0D9488] text-white text-sm font-medium rounded-lg hover:bg-[#0b837a] transition-colors"
            >
              Book a call to upgrade
              <IconExternalLink size={14} strokeWidth={1.75} />
            </a>
          </div>
        </>
      )}
    </div>
  )
}
