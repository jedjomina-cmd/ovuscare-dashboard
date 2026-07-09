import Anthropic from '@anthropic-ai/sdk'
import { createSupabaseServerClient } from './supabase-server'
import type { Patient } from '@/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const FLAGGED_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'hopeless', 'can\'t go on',
  'депрессия', 'суицид', 'не могу жить', 'убить себя',
  'pašnāvība', 'nevaru dzīvot',
  'suicidio', 'no puedo más',
]

function isFlagged(message: string): boolean {
  const lower = message.toLowerCase()
  return FLAGGED_KEYWORDS.some((kw) => lower.includes(kw))
}

interface MatchedDocument {
  content: string
  metadata: Record<string, string>
}

async function matchDocuments(
  clinicId: string,
  embedding: number[]
): Promise<MatchedDocument[]> {
  const supabase = await createSupabaseServerClient()

  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_clinic_id: clinicId,
    match_count: 3,
  })

  if (error || !data) return []
  return data as MatchedDocument[]
}

async function embedText(text: string): Promise<number[]> {
  const res = await fetch('https://api.cohere.ai/v1/embed', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      texts: [text],
      model: 'embed-multilingual-v3.0',
      input_type: 'search_query',
    }),
  })

  if (!res.ok) throw new Error(`Cohere embed error: ${res.status}`)
  const json = await res.json() as { embeddings: number[][] }
  return json.embeddings[0]
}

export interface AnnaResponse {
  text: string
  flagged: boolean
}

export async function generateAnnaResponse({
  patient,
  userMessage,
  messageHistory,
}: {
  patient: Patient
  userMessage: string
  messageHistory: Array<{ role: 'patient' | 'anna'; content: string }>
}): Promise<AnnaResponse> {
  const flagged = isFlagged(userMessage)

  let ragContext = ''
  try {
    const embedding = await embedText(userMessage)
    const docs = await matchDocuments(patient.clinic_id ?? '', embedding)
    if (docs.length > 0) {
      ragContext = '\n\nRelevant clinical information:\n' + docs.map((d) => d.content).join('\n\n')
    }
  } catch {
    // RAG failure is non-blocking — Anna responds without context
  }

  const systemPrompt = `You are Anna, an AI care companion for IVF patients at a fertility clinic.

Your role is to:
- Provide emotional support and reassurance
- Answer general questions about IVF processes and what to expect
- Remind patients of their assignments and appointments
- Encourage patients to follow their doctor's recommendations

Patient information:
- Name: ${patient.display_name}
- Current stage: ${patient.stage ?? 'unknown'}
- Assignments: ${patient.assignments ?? 'none specified'}
- Second appointment: ${patient.second_appointment ?? 'not yet booked'}

Rules:
- You are NOT a doctor. You do NOT give medical diagnoses or change treatment plans.
- Always recommend the patient contact their doctor for medical questions.
- Be warm, empathetic, and encouraging.
- Keep responses concise (2-4 sentences unless more detail is needed).
- Respond in the same language the patient is using.
${ragContext}`

  const messages: Anthropic.MessageParam[] = [
    ...messageHistory.slice(-10).map((m) => ({
      role: (m.role === 'patient' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ]

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: systemPrompt,
    messages,
  })

  const text =
    response.content[0].type === 'text' ? response.content[0].text : ''

  return { text, flagged }
}
