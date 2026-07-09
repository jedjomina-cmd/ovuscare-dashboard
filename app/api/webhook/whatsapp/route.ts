import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { generateAnnaResponse } from '@/lib/anna'
import { sendWhatsAppMessage } from '@/lib/whatsapp'
import { sendFlaggedMessageAlert } from '@/lib/email'
import type { Patient, DialogLog } from '@/types'

// GET — WhatsApp webhook verification handshake
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 })
  }

  return new Response('Forbidden', { status: 403 })
}

interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  type: string
  text?: { body: string }
}

interface WhatsAppWebhookPayload {
  object: string
  entry: Array<{
    changes: Array<{
      value: {
        messages?: WhatsAppMessage[]
      }
    }>
  }>
}

// POST — incoming WhatsApp message
export async function POST(request: Request) {
  const body = await request.json() as WhatsAppWebhookPayload

  if (body.object !== 'whatsapp_business_account') {
    return NextResponse.json({ ok: true })
  }

  const messages: WhatsAppMessage[] = []
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const msg of change.value.messages ?? []) {
        messages.push(msg)
      }
    }
  }

  if (messages.length === 0) {
    return NextResponse.json({ ok: true })
  }

  const supabase = await createSupabaseServerClient()

  for (const msg of messages) {
    if (msg.type !== 'text' || !msg.text?.body) continue

    const userMessage = msg.text.body
    const senderPhone = msg.from

    // Find patient by phone number
    const { data: patientData } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_phone', senderPhone)
      .eq('ai_assistant_active', true)
      .single()

    if (!patientData) continue

    const patient = patientData as Patient

    // Fetch recent message history for context
    const { data: historyData } = await supabase
      .from('dialogs_log')
      .select('user_message, ai_response')
      .eq('patient_id', patient.patient_id)
      .order('date', { ascending: false })
      .limit(10)

    const messageHistory = ((historyData ?? []) as Pick<DialogLog, 'user_message' | 'ai_response'>[])
      .reverse()
      .flatMap((d) => {
        const turns: Array<{ role: 'patient' | 'anna'; content: string }> = []
        if (d.user_message) turns.push({ role: 'patient', content: d.user_message })
        if (d.ai_response) turns.push({ role: 'anna', content: d.ai_response })
        return turns
      })

    // Generate Anna's response
    let annaText = ''
    let flagged = false
    try {
      const result = await generateAnnaResponse({ patient, userMessage, messageHistory })
      annaText = result.text
      flagged = result.flagged
    } catch {
      annaText = "I'm sorry, I couldn't process your message right now. Please contact your clinic directly."
    }

    const now = new Date().toISOString()

    // Log conversation to Supabase
    await supabase.from('dialogs_log').insert([{
      patient_id: patient.patient_id,
      user_message: userMessage,
      ai_response: annaText,
      date: now,
      flagged,
    }])

    // Update patient's last_reply timestamp
    await supabase
      .from('patients')
      .update({ last_reply: now })
      .eq('id', patient.id)

    // Send response via WhatsApp
    if (annaText) {
      try {
        await sendWhatsAppMessage(senderPhone, annaText)
      } catch {
        // Log failure without PII
        console.error('WhatsApp send failed for patient_id:', patient.patient_id)
      }
    }

    // Email clinic if message is flagged
    if (flagged) {
      try {
        await sendFlaggedMessageAlert({
          patientDisplayName: patient.display_name,
          message: userMessage,
          clinicEmail: 'info@ovuscare.com',
        })
      } catch {
        console.error('Failed to send flagged message alert for patient_id:', patient.patient_id)
      }
    }
  }

  return NextResponse.json({ ok: true })
}
