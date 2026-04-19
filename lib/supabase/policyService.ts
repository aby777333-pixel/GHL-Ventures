/* ─────────────────────────────────────────────────────────────
   Policy Service — admin CRUD + staff read for company policies.

   Staff read active policies and can open the linked document
   (Storage path or external URL). Admins manage the catalogue.
   ───────────────────────────────────────────────────────────── */

'use client'

import { supabase, isSupabaseConfigured } from './client'

const db = supabase as any

export interface StaffPolicy {
  id: string
  title: string
  description: string | null
  version: string | null
  category: string | null
  icon: string | null
  bucket: string | null
  file_path: string | null
  external_url: string | null
  last_updated: string | null
  active: boolean
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface PolicyInput {
  title: string
  description?: string | null
  version?: string | null
  category?: string | null
  icon?: string | null
  bucket?: string | null
  file_path?: string | null
  external_url?: string | null
  last_updated?: string | null
  active?: boolean
  sort_order?: number
}

// ── Read ──────────────────────────────────────────────────
export async function fetchActivePolicies(): Promise<StaffPolicy[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await db
      .from('company_policies')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true })
    if (error || !data) return []
    return data as StaffPolicy[]
  } catch {
    return []
  }
}

export async function fetchAllPolicies(): Promise<StaffPolicy[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await db
      .from('company_policies')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true })
    if (error || !data) return []
    return data as StaffPolicy[]
  } catch {
    return []
  }
}

// ── Resolve a document link for the "View Document" button ──
export async function resolvePolicyDocumentUrl(policy: StaffPolicy): Promise<string | null> {
  if (policy.external_url) return policy.external_url
  if (!isSupabaseConfigured() || !policy.bucket || !policy.file_path) return null
  try {
    // Prefer a signed URL so private buckets still work for staff.
    const { data, error } = await db.storage.from(policy.bucket).createSignedUrl(policy.file_path, 600)
    if (!error && data?.signedUrl) return data.signedUrl
    const pub = db.storage.from(policy.bucket).getPublicUrl(policy.file_path)
    return pub?.data?.publicUrl || null
  } catch {
    return null
  }
}

// ── Mutations ─────────────────────────────────────────────
export async function createPolicy(input: PolicyInput): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Service unavailable' }
  try {
    const { data: auth } = await db.auth.getUser()
    const userId = auth?.user?.id || null
    const { data, error } = await db
      .from('company_policies')
      .insert({
        title: input.title,
        description: input.description || null,
        version: input.version || null,
        category: input.category || null,
        icon: input.icon || null,
        bucket: input.bucket || null,
        file_path: input.file_path || null,
        external_url: input.external_url || null,
        last_updated: input.last_updated || null,
        active: input.active !== false,
        sort_order: input.sort_order ?? 0,
        created_by: userId,
      })
      .select('id')
      .single()
    if (error) return { success: false, error: error.message }
    return { success: true, id: data?.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' }
  }
}

export async function updatePolicy(id: string, updates: Partial<PolicyInput>): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Service unavailable' }
  try {
    const payload: Record<string, any> = {}
    for (const k of Object.keys(updates) as (keyof PolicyInput)[]) {
      const v = updates[k]
      if (v !== undefined) payload[k] = v === '' ? null : v
    }
    const { error } = await db.from('company_policies').update(payload).eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' }
  }
}

export async function deletePolicy(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Service unavailable' }
  try {
    const { error } = await db.from('company_policies').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' }
  }
}
