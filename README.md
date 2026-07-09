# OvusCare Dashboard

Clinic-facing dashboard for the OvusCare AI patient retention platform. Deployed at [app.ovuscare.com](https://app.ovuscare.com).

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4
- Supabase (Postgres + Auth + pgvector)
- Anthropic Claude API (Anna's responses)
- Cohere (RAG embeddings)
- WhatsApp Cloud API (patient messaging)
- n8n (workflow automation)
- Nodemailer SMTP (staff notifications)

## Folder structure

```
app/
  page.tsx                    # Dashboard home — stats + patient table
  login/page.tsx              # Auth (email/password)
  analytics/page.tsx          # Charts + videos sent
  dialogues/page.tsx          # All conversations feed
  doctors/page.tsx            # Team management
  settings/page.tsx           # Language + preferences
  patients/
    new/page.tsx              # Add patient
    [id]/page.tsx             # Patient card
    [id]/edit/page.tsx        # Edit patient
  content/page.tsx            # Content bank (videos, FAQs)
  billing/page.tsx            # Plan + pilot status
  api/
    doctors/route.ts          # List clinic doctors
    doctors/invite/route.ts   # Invite by email
    patients/route.ts         # CRUD patients
    patients/[id]/route.ts    # Single patient CRUD
    content/route.ts          # Content bank CRUD
    analytics/route.ts        # Aggregate metrics
    webhook/whatsapp/route.ts # WhatsApp incoming messages
components/
lib/
  supabase.ts                 # Browser Supabase client
  supabase-server.ts          # Server Supabase client
  i18n.tsx                    # i18n context (EN/RU/LV/ES)
  anna.ts                     # Anna AI response logic
  whatsapp.ts                 # WhatsApp message helpers
  email.ts                    # Nodemailer notification emails
locales/
  en.ts / ru.ts / lv.ts / es.ts
supabase/
  migrations/                 # SQL migrations (run in order)
types/
  index.ts                    # TypeScript types
middleware.ts                 # Auth protection for all routes
```

## Local setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

### 3. Supabase

- Create a project at [supabase.com](https://supabase.com)
- Enable `pgvector` extension: Database → Extensions → vector
- Run all files in `supabase/migrations/` via the SQL Editor in order
- Auth settings: disable email confirmation for MVP (Auth → Settings → Email)

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — redirects to `/login` if unauthenticated.

## Authentication

Clinic accounts are created manually in Supabase Auth (no self-registration). Middleware protects all routes and redirects unauthenticated users to `/login`.

## WhatsApp webhook

Configure in Meta Business Manager:
- **Callback URL**: `https://app.ovuscare.com/api/webhook/whatsapp`
- **Verify token**: value of `WHATSAPP_VERIFY_TOKEN` env var

Test locally with ngrok — see `AGENTS.md` for full instructions.

## Environment variables

See `.env.example` for the full list with descriptions.

## Supabase tables

| Table | Purpose |
|-------|---------|
| `clinics` | Clinic profile and subscription plan |
| `patients` | Patient records |
| `dialogs_log` | WhatsApp conversation history |
| `sent_log` | Videos/content sent to patients |
| `content` | Content bank (videos, FAQs) |
| `documents` | RAG knowledge base chunks (pgvector) |

## Brand

- Primary: `#1A2B2B` (dark green)
- Accent: `#0D9488` (teal)
- Anna = "AI care companion" — never "medical AI", "doctor", "diagnosis tool"
- No PII in logs. GDPR compliant, EU data storage.
