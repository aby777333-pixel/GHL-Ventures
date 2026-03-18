/* ─────────────────────────────────────────────────────────────
   Site Settings Service — Editable site config stored in Supabase

   When Supabase is not configured, returns defaults from BRAND
   constant (lib/constants.ts). Admin can override via CMS.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

// Untyped reference for queries (avoids strict type inference issues)
const sb = supabase as any

export interface SiteSettings {
  id: string
  key: string
  value: string
  category: 'general' | 'seo' | 'social' | 'contact' | 'appearance' | 'legal'
  label: string
  description: string | null
  updated_at: string
}

// Default settings — matches BRAND constant structure
const DEFAULT_SETTINGS: Record<string, string> = {
  'site_name': 'GHL India Ventures',
  'site_tagline': 'Redefining Wealth. Reimagining Futures.',
  'site_description': 'India\'s premier wealth management, real estate, and investment firm.',
  'meta_title': 'GHL India Ventures — Wealth Management & Investment Solutions',
  'meta_description': 'GHL India Ventures offers expert wealth management, real estate investment, and financial planning services across India.',
  'og_image': '/og-image.jpg',
  'contact_email': 'info@ghlindiaventures.com',
  'contact_phone': '+91 22 4000 1234',
  'contact_address': 'One BKC, Bandra Kurla Complex, Mumbai 400051',
  'social_linkedin': 'https://www.linkedin.com/company/ghl-india-ventures-fund/',
  'social_twitter': 'https://x.com/ghlindiaventure',
  'social_instagram': 'https://www.instagram.com/ghl_india_venture/',
  'social_facebook': 'https://www.facebook.com/ghlindiaofficial/',
  'footer_text': '© 2025 GHL India Ventures. All rights reserved.',
  'primary_color': '#D0021B',
  'google_analytics_id': '',
  'google_tag_manager_id': '',
}

// ── Read ────────────────────────────────────────────────────

export async function getAllSettings(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured()) return { ...DEFAULT_SETTINGS }

  try {
    const { data, error } = await sb.from('site_settings').select('key, value')
    if (error || !data || data.length === 0) {
      console.warn('[settings] Falling back to defaults:', error?.message)
      return { ...DEFAULT_SETTINGS }
    }
    const settings = { ...DEFAULT_SETTINGS }
    data.forEach((row: any) => { settings[row.key] = row.value })
    return settings
  } catch { return { ...DEFAULT_SETTINGS } }
}

export async function getSetting(key: string): Promise<string> {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS[key] || ''
  try {
    const { data, error } = await sb.from('site_settings').select('value').eq('key', key).single()
    if (error || !data) return DEFAULT_SETTINGS[key] || ''
    return data.value
  } catch { return DEFAULT_SETTINGS[key] || '' }
}

export async function getSettingsByCategory(
  category: SiteSettings['category']
): Promise<SiteSettings[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await sb.from('site_settings').select('*').eq('category', category).order('key')
    if (error || !data) return []
    return data as SiteSettings[]
  } catch { return [] }
}

// ── Write (Admin only) ─────────────────────────────────────

export async function updateSetting(key: string, value: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const { error } = await sb.from('site_settings').upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    if (error) { console.warn('[settings] Update error:', error.message); return false }
    return true
  } catch { return false }
}

export async function updateSettings(
  settings: Record<string, string>
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const rows = Object.entries(settings).map(([key, value]) => ({
      key, value, updated_at: new Date().toISOString(),
    }))
    const { error } = await sb.from('site_settings').upsert(rows, { onConflict: 'key' })
    if (error) { console.warn('[settings] Bulk update error:', error.message); return false }
    return true
  } catch { return false }
}

// ── Seed defaults ───────────────────────────────────────────
export async function seedDefaultSettings(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  try {
    const rows = Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({
      key, value, category: categorizeKey(key), label: formatLabel(key), description: null,
    }))
    const { error } = await sb.from('site_settings').upsert(rows, { onConflict: 'key' })
    if (error) { console.warn('[settings] Seed error:', error.message); return false }
    return true
  } catch { return false }
}

// ── Helpers ─────────────────────────────────────────────────
function categorizeKey(key: string): SiteSettings['category'] {
  if (key.startsWith('meta_') || key.startsWith('og_')) return 'seo'
  if (key.startsWith('social_')) return 'social'
  if (key.startsWith('contact_')) return 'contact'
  if (key.startsWith('primary_') || key.startsWith('google_')) return 'appearance'
  if (key.startsWith('footer_')) return 'legal'
  return 'general'
}

function formatLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
}
