/* ─────────────────────────────────────────────────────────────
   Announcement Service — Admin CRUD for staff announcements.

   Table: public.announcements
   RLS   : Admins manage (ALL), Staff read (SELECT).
   ───────────────────────────────────────────────────────────── */

'use client'

import { supabase, isSupabaseConfigured } from './client'

const db = supabase as any

export type AnnouncementType =
  | 'policy-update'
  | 'process-change'
  | 'event'
  | 'achievement'
  | 'general'

export interface AdminAnnouncement {
  id: string
  title: string
  content: string
  type: AnnouncementType
  pinned: boolean
  active: boolean
  department: string | null
  posted_by: string | null
  posted_by_name?: string
  created_at: string
}

export interface AnnouncementInput {
  title: string
  content: string
  type: AnnouncementType
  pinned?: boolean
  active?: boolean
  department?: string | null
}

// ── List ──────────────────────────────────────────────────
export async function fetchAllAnnouncements(): Promise<AdminAnnouncement[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await db
      .from('announcements')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (error || !data) return []

    const posterIds = Array.from(new Set((data as any[]).map((a: any) => a.posted_by).filter(Boolean)))
    const posterMap: Record<string, string> = {}
    if (posterIds.length > 0) {
      const { data: posters } = await db.from('profiles').select('id, full_name').in('id', posterIds)
      ;(posters || []).forEach((p: any) => { posterMap[p.id] = p.full_name || '' })
    }

    return (data as any[]).map((a: any) => ({
      id: a.id,
      title: a.title || '',
      content: a.content || '',
      type: (a.type as AnnouncementType) || 'general',
      pinned: !!a.pinned,
      active: a.active !== false,
      department: a.department || null,
      posted_by: a.posted_by || null,
      posted_by_name: posterMap[a.posted_by] || 'GHL Admin',
      created_at: a.created_at || '',
    }))
  } catch (err) {
    console.warn('[announcementService] list failed:', err)
    return []
  }
}

// ── Create ────────────────────────────────────────────────
export async function createAnnouncement(input: AnnouncementInput): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Service unavailable' }
  try {
    const { data: userData } = await db.auth.getUser()
    const userId = userData?.user?.id || null

    const { data, error } = await db
      .from('announcements')
      .insert({
        title: input.title,
        content: input.content,
        type: input.type,
        pinned: !!input.pinned,
        active: input.active !== false,
        department: input.department || null,
        posted_by: userId,
      })
      .select('id')
      .single()

    if (error) return { success: false, error: error.message }
    return { success: true, id: data?.id }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' }
  }
}

// ── Update ────────────────────────────────────────────────
export async function updateAnnouncement(id: string, updates: Partial<AnnouncementInput>): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Service unavailable' }
  try {
    const payload: Record<string, any> = {}
    if (updates.title !== undefined) payload.title = updates.title
    if (updates.content !== undefined) payload.content = updates.content
    if (updates.type !== undefined) payload.type = updates.type
    if (updates.pinned !== undefined) payload.pinned = !!updates.pinned
    if (updates.active !== undefined) payload.active = !!updates.active
    if (updates.department !== undefined) payload.department = updates.department || null

    const { error } = await db.from('announcements').update(payload).eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' }
  }
}

// ── Delete ────────────────────────────────────────────────
export async function deleteAnnouncement(id: string): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { success: false, error: 'Service unavailable' }
  try {
    const { error } = await db.from('announcements').delete().eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error' }
  }
}
