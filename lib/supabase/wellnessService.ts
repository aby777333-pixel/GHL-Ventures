/* ─────────────────────────────────────────────────────────────
   Wellness Service — staff mood check-ins.
   Table: public.wellness_checkins
   RLS   : Staff insert own + read own. Admins read all.
   ───────────────────────────────────────────────────────────── */

'use client'

import { supabase, isSupabaseConfigured } from './client'

const db = supabase as any

export interface WellnessCheckin {
  id: string
  staff_id: string | null
  mood: string
  mood_label: string | null
  note: string | null
  created_at: string
}

export async function recordWellnessCheckin(input: {
  staffId: string | null
  mood: string
  moodLabel?: string | null
  note?: string | null
}): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Service unavailable' }
  try {
    const { data, error } = await db
      .from('wellness_checkins')
      .insert({
        staff_id: input.staffId,
        mood: input.mood,
        mood_label: input.moodLabel || null,
        note: input.note || null,
      })
      .select('id')
      .single()
    if (error) return { success: false, error: error.message }
    return { success: true, id: data?.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' }
  }
}

export async function fetchWellnessCheckins(opts?: { staffId?: string; limit?: number }): Promise<WellnessCheckin[]> {
  if (!isSupabaseConfigured()) return []
  try {
    let query = db
      .from('wellness_checkins')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(opts?.limit ?? 100)
    if (opts?.staffId) query = query.eq('staff_id', opts.staffId)
    const { data, error } = await query
    if (error || !data) return []
    return data as WellnessCheckin[]
  } catch {
    return []
  }
}
