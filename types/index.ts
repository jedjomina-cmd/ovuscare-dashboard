export type Patient = {
  id: string
  patient_id: string
  clinic_id?: string
  display_name: string
  patient_phone: string | null
  telegram_chat_id: string | null
  initial_stage: string | null
  stage: string | null
  stage_start_date: string | null
  assignments: string | null
  ai_assistant_active: boolean
  last_reply: string | null
  second_appointment: string | null
}

export type DialogLog = {
  id: string
  patient_id: string
  user_message: string | null
  ai_response: string | null
  date: string | null
  flagged?: boolean
}

export type SentLog = {
  id: string
  patient_id: string
  caption: string | null
  sent_at: string | null
}

export type Doctor = {
  id: string
  email: string
  created_at: string
  raw_user_meta_data?: {
    language?: string
  }
}

export type Clinic = {
  id: string
  name: string
  plan: 'pilot' | 'starter' | 'growth' | 'enterprise'
  pilot_expires_at: string | null
  whatsapp_number: string | null
  created_at: string
}

export type User = {
  id: string
  email: string
  clinic_id: string
  role: 'admin' | 'doctor' | 'coordinator'
  language: string
  created_at: string
}

export type ContentItem = {
  id: string
  clinic_id: string
  title: string
  type: 'video' | 'faq' | 'text'
  stage: string | null
  language: string
  url: string | null
  created_at: string
}

export type Document = {
  id: string
  clinic_id: string
  content: string
  embedding?: number[]
  metadata: Record<string, string>
  created_at: string
}
