import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const PLACEHOLDER_URL = ''
const PLACEHOLDER_KEY = ''

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

// Only use real env vars if the URL looks like a valid HTTPS endpoint
const supabaseUrl = rawUrl.startsWith('https://') ? rawUrl : PLACEHOLDER_URL
const supabaseAnonKey = rawKey.length > 20 ? rawKey : PLACEHOLDER_KEY

// Warn at runtime when placeholders are being used
if (typeof window !== 'undefined' && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('[supabase/client] Supabase credentials are not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.')
}

// Supabase client — uses empty placeholder during build when env vars are missing
// (static export bakes env vars at build time; isSupabaseConfigured() gates all calls)
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

// Check if Supabase is configured (env vars set) — robust check
export const isSupabaseConfigured = () => {
  if (!supabaseUrl || !supabaseAnonKey) return false
  if (!supabaseUrl.startsWith('https://') || supabaseUrl.includes('placeholder')) return false
  if (supabaseAnonKey.length < 30 || supabaseAnonKey.includes('placeholder')) return false
  return true
}

/** Get current Supabase auth token for passing to Netlify functions */
export async function getAuthToken(): Promise<string> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token || ''
  } catch { return '' }
}

