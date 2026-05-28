'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { Patient } from '@/types'
import PatientForm from '@/components/PatientForm'
import { useI18n } from '@/lib/i18n'
import { IconChevronLeft } from '@tabler/icons-react'
import { SkeletonBlock } from '@/components/Skeleton'

export default function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const { t } = useI18n()
  const router = useRouter()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPatient() {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        toast.error('Patient not found')
        router.push('/')
        return
      }

      setPatient(data as Patient)
      setLoading(false)
    }
    fetchPatient()
  }, [id, router])

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <Link
        href={`/patients/${id}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <IconChevronLeft size={16} strokeWidth={1.75} />
        {t.actions.back}
      </Link>

      <div className="bg-white rounded-xl border border-gray-200/70 p-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">{t.form.editPatient}</h1>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBlock key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : patient ? (
          <PatientForm initialData={patient} patientId={id} mode="edit" />
        ) : null}
      </div>
    </div>
  )
}
