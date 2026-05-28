'use client'

import Link from 'next/link'
import { IconChevronLeft } from '@tabler/icons-react'
import PatientForm from '@/components/PatientForm'
import { useI18n } from '@/lib/i18n'

export default function NewPatientPage() {
  const { t } = useI18n()

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-5">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
      >
        <IconChevronLeft size={16} strokeWidth={1.75} />
        {t.actions.back}
      </Link>

      <div className="bg-white rounded-xl border border-gray-200/70 p-6">
        <h1 className="text-lg font-semibold text-gray-900 mb-6">{t.form.newPatient}</h1>
        <PatientForm mode="create" />
      </div>
    </div>
  )
}
