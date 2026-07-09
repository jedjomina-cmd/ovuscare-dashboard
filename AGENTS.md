# OvusCare Dashboard — Agent Instructions

## Product context

OvusCare is a B2B SaaS platform for IVF (fertility) clinics. The AI care companion "Anna" engages patients via WhatsApp between clinic visits, reducing dropout and supporting treatment continuation.

- **Customers**: fertility clinic staff (doctors, coordinators)
- **End users**: IVF patients (they interact via WhatsApp, never directly with this dashboard)
- **Domains**: `app.ovuscare.com` (this app), `ovuscare.com` (landing page)

## This is NOT the Next.js you know

Next.js 16 App Router — APIs and conventions differ from training data:
- `params` in dynamic routes is `Promise<{id: string}>` — use `React.use(params)` in client components
- `cookies()` is async — `await cookies()` in server components/API routes
- Server Route Handlers replace `pages/api/` entirely
- Read `node_modules/next/dist/docs/` if unsure about an API

## Architecture — data flow

```
Patient sends WhatsApp message
  → Meta webhook POST → /api/webhook/whatsapp
  → Find patient by phone in Supabase (patients table)
  → Log message in dialogs_log (user_message field)
  → Call lib/anna.ts:
      embed message via Cohere
      → match_documents() pgvector similarity search
      → build Claude prompt with patient context + RAG chunks
      → call Anthropic API → get response text + flagged boolean
  → Log Anna's response in dialogs_log (ai_response field)
  → Send response via lib/whatsapp.ts
  → If flagged: send email via lib/email.ts to clinic staff
```

## Supabase join pattern (critical)

`patients.id` = UUID (used for routing: `/patients/[id]`)
`patients.patient_id` = text "P001" (FK in `dialogs_log.patient_id` and `sent_log.patient_id`)

**Always fetch patient first, then use `patient.patient_id` to query child tables.**
Do NOT join on UUID — `dialogs_log.patient_id` stores "P001", not a UUID.

## Key files

| File | Purpose |
|------|---------|
| `lib/supabase.ts` | Browser client (cookies-based, SSR-compatible) |
| `lib/supabase-server.ts` | Server client for API routes |
| `lib/anna.ts` | Anna AI response logic (Cohere + Claude) |
| `lib/whatsapp.ts` | WhatsApp Cloud API helpers |
| `lib/email.ts` | Nodemailer SMTP notifications |
| `middleware.ts` | Auth protection — all routes except /login |
| `lib/i18n.tsx` | i18n context — EN/RU/LV/ES |

## Coding rules

- TypeScript strict — no `any`, no `@ts-ignore`
- Brand: primary `#1A2B2B`, accent `#0D9488` (teal)
- All pages fetch real data from Supabase — no mock/hardcoded data
- Anna = "AI care companion" or "AI assistant" — never "doctor", "medical AI", "diagnosis tool"
- No medical claims in UI copy
- **GDPR**: no PII (patient names, phones, emails) in `console.log` or error messages
- Do not use `Math.random()` in JSX — causes hydration mismatch; use static index-based arrays

## What NOT to do

- No `console.log` with patient data
- No describing Anna as giving medical advice or diagnoses
- No `Math.random()` in JSX (hydration mismatch)
- No `any` types
- No skipping middleware auth
- No localStorage for sessions — use cookies (`@supabase/ssr`)

## Database tables

```
clinics        (id, name, plan, pilot_expires_at, whatsapp_number)
patients       (id[UUID], clinic_id, patient_id[P001], display_name, patient_phone,
                stage, assignments, ai_assistant_active, last_reply, second_appointment)
dialogs_log    (id, patient_id[P001], user_message, ai_response, date, flagged)
sent_log       (id, patient_id[P001], caption, sent_at)
content        (id, clinic_id, title, type, stage, language, url)
documents      (id, clinic_id, content, embedding[vector(1024)], metadata[jsonb])
```

## Running migrations

1. Supabase SQL Editor: Dashboard → SQL Editor → New query
2. Run files from `supabase/migrations/` in chronological order
3. Verify: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;`

## Testing WhatsApp webhook locally

```bash
# 1. Start dev server
npm run dev

# 2. Expose via ngrok (in separate terminal)
npx ngrok http 3000

# 3. Set webhook in Meta Business Manager:
#    URL: https://your-ngrok-url.ngrok.io/api/webhook/whatsapp
#    Verify token: value of WHATSAPP_VERIFY_TOKEN

# 4. Test verification handshake:
curl "http://localhost:3000/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
# Expected: test123

# 5. Simulate incoming message:
curl -X POST http://localhost:3000/api/webhook/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "+37120000000",
            "text": { "body": "Hello, I have a question" },
            "type": "text",
            "id": "test_msg_1",
            "timestamp": "1234567890"
          }]
        }
      }]
    }]
  }'
```
