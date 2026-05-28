import { createBrowserClient } from '@supabase/ssr'

// Use @supabase/ssr's browser client so the session is stored in cookies,
// making it readable by the Next.js middleware (which also uses @supabase/ssr).
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)