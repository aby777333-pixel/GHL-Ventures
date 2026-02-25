import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDA0MjAyNzEsImV4cCI6MjA4NzQyMDI3MX0.placeholder'

const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const rawKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '').trim()

// Only use real env vars if the URL looks like a valid HTTPS endpoint
const supabaseUrl = rawUrl.startsWith('https://') ? rawUrl : PLACEHOLDER_URL
const supabaseAnonKey = rawKey.length > 20 ? rawKey : PLACEHOLDER_KEY

// Supabase client — uses a placeholder during build when env vars are missing
// (static export bakes env vars at build time; isSupabaseConfigured() gates all calls)
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

// Check if Supabase is configured (env vars set)
export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl !== PLACEHOLDER_URL && supabaseAnonKey !== PLACEHOLDER_KEY)
