'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import type { Patient } from '@/types'
import { useI18n } from '@/lib/i18n'

type FormData = Omit<Patient, 'id'>

interface PatientFormProps {
  initialData?: Partial<Patient>
  patientId?: string // UUID, for edit mode
  mode: 'create' | 'edit'
}

const EMPTY_FORM: FormData = {
  patient_id: '',
  display_name: '',
  patient_phone: '',
  telegram_chat_id: '',
  initial_stage: '',
  stage: '',
  stage_start_date: '',
  assignments: '',
  ai_assistant_active: true,
  last_reply: null,
  second_appointment: '',
}

export default function PatientForm({ initialData, patientId, mode }: PatientFormProps) {
  const { t } = useI18n()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<FormData>({
    ...EMPTY_FORM,
    ...initialData,
  })

  const set = (field: keyof FormData, value: string | boolean | null) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.display_name.trim()) {
      toast.error('Display name is required')
      return
    }
    setSaving(true)

    const payload = {
      ...form,
      stage_start_date: form.stage_start_date || null,
      second_appointment: form.second_appointment || null,
      patient_phone: form.patient_phone || null,
      telegram_chat_id: form.telegram_chat_id || null,
      initial_stage: form.initial_stage || null,
      stage: form.stage || null,
      assignments: form.assignments || null,
    }

    let error

    if (mode === 'create') {
      const result = await supabase.from('patients').insert([payload])
      error = result.error
    } else {
      const result = await supabase
        .from('patients')
        .update(payload)
        .eq('id', patientId!)
      error = result.error
    }

    setSaving(false)

    if (error) {
      toast.error(t.toast.error)
    } else {
      toast.success(mode === 'create' ? t.toast.patientAdded : t.toast.saved)
      router.push(mode === 'create' ? '/' : `/patients/${patientId}`)
      router.refresh()
    }
  }

  const fieldClass =
    'w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/30 focus:border-[#1D9E75]/60 transition bg-white placeholder:text-gray-400'
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Display name */}
        <div>
          <label className={labelClass}>{t.form.displayName} *</label>
          <input
            type="text"
            value={form.display_name}
            onChange={(e) => set('display_name', e.target.value)}
            className={fieldClass}
            placeholder="Anna Kowalski"
            required
          />
        </div>

        {/* Patient ID */}
        <div>
          <label className={labelClass}>{t.patient.patientId}</label>
          <input
            type="text"
            value={form.patient_id}
            onChange={(e) => set('patient_id', e.target.value)}
            className={fieldClass}
            placeholder="PAT-001"
          />
        </div>

        {/* Phone */}
        <div>
          <label className={labelClass}>{t.form.phone}</label>
          <input
            type="tel"
            value={form.patient_phone ?? ''}
            onChange={(e) => set('patient_phone', e.target.value)}
            className={fieldClass}
            placeholder="+371 20000000"
          />
        </div>

        {/* Telegram */}
        <div>
          <label className={labelClass}>{t.form.telegramId}</label>
          <input
            type="text"
            value={form.telegram_chat_id ?? ''}
            onChange={(e) => set('telegram_chat_id', e.target.value)}
            className={fieldClass}
            placeholder="12345678"
          />
        </div>

        {/* Initial stage */}
        <div>
          <label className={labelClass}>{t.form.initialStage}</label>
          <input
            type="text"
            value={form.initial_stage ?? ''}
            onChange={(e) => set('initial_stage', e.target.value)}
            className={fieldClass}
            placeholder="Stimulation"
          />
        </div>

        {/* Current stage */}
        <div>
          <label className={labelClass}>{t.form.currentStage}</label>
          <input
            type="text"
            value={form.stage ?? ''}
            onChange={(e) => set('stage', e.target.value)}
            className={fieldClass}
            placeholder="Transfer"
          />
        </div>

        {/* Stage start date */}
        <div>
          <label className={labelClass}>{t.form.stageStartDate}</label>
          <input
            type="date"
            value={form.stage_start_date ?? ''}
            onChange={(e) => set('stage_start_date', e.target.value)}
            className={fieldClass}
          />
        </div>

        {/* Second appointment */}
        <div>
          <label className={labelClass}>{t.form.secondAppointment}</label>
          <input
            type="date"
            value={form.second_appointment ?? ''}
            onChange={(e) => set('second_appointment', e.target.value)}
            className={fieldClass}
          />
        </div>

        {/* Assignments */}
        <div className="sm:col-span-2">
          <label className={labelClass}>{t.form.assignments}</label>
          <textarea
            value={form.assignments ?? ''}
            onChange={(e) => set('assignments', e.target.value)}
            className={`${fieldClass} resize-none`}
            rows={3}
            placeholder="Progesterone 200mg, Estradiol 2mg…"
          />
        </div>
      </div>

      {/* AI toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
        <span className="text-sm font-medium text-gray-700">{t.form.aiActive}</span>
        <button
          type="button"
          onClick={() => set('ai_assistant_active', !form.ai_assistant_active)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#1D9E75]/40 ${
            form.ai_assistant_active ? 'bg-[#1D9E75]' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={form.ai_assistant_active}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              form.ai_assistant_active ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          {t.actions.cancel}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-5 py-2 text-sm font-medium text-white bg-[#1D9E75] rounded-lg hover:bg-[#178a65] transition-colors disabled:opacity-60"
        >
          {saving ? 'Saving…' : t.actions.save}
        </button>
      </div>
    </form>
  )
}
