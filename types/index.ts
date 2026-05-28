export type Patient = {
  id: string
  patient_id: string
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
