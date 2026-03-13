/* ─────────────────────────────────────────────────────────────
   Internal Chat Service — Shared between Staff & Admin portals

   Provides channel-based internal messaging with Supabase
   persistence + mock fallback when DB isn't available.
   ───────────────────────────────────────────────────────────── */

'use client'

import { supabase, isSupabaseConfigured } from './client'
import { subscribeToTable } from './realtimeSubscriptions'

// ── Types ────────────────────────────────────────────────────
export interface InternalChannel {
  id: string
  name: string
  description: string
  unread: number
}

export interface InternalMessage {
  id: string
  channel_id: string
  user_id: string
  user_name: string
  user_role: string
  message: string
  created_at: string
}

// ── Channels (hardcoded — no DB table needed) ────────────────
const INTERNAL_CHANNELS: InternalChannel[] = [
  { id: 'general', name: 'General', description: 'Company-wide discussions', unread: 0 },
  { id: 'announcements', name: 'Announcements', description: 'Official company announcements', unread: 0 },
  { id: 'compliance', name: 'Compliance', description: 'Compliance updates and discussions', unread: 0 },
  { id: 'sales-team', name: 'Sales Team', description: 'Sales team coordination', unread: 0 },
  { id: 'support', name: 'Support', description: 'Client support discussions', unread: 0 },
]

// ── Empty channel defaults (no fake seed messages in production) ──
const SEED_MESSAGES: Record<string, InternalMessage[]> = {
  general: [],
  announcements: [],
  compliance: [],
  'sales-team': [],
  support: [],
}

// ── Local message store (fallback when Supabase unavailable) ──
const localMessages: Record<string, InternalMessage[]> = { ...SEED_MESSAGES }

// ── API ──────────────────────────────────────────────────────

/** Get all internal channels */
export function getChannels(): InternalChannel[] {
  return INTERNAL_CHANNELS
}

/** Get messages for a channel */
export async function getChannelMessages(channelId: string): Promise<InternalMessage[]> {
  if (!isSupabaseConfigured()) {
    return localMessages[channelId] || SEED_MESSAGES[channelId] || []
  }

  try {
    const { data, error } = await (supabase as any)
      .from('internal_messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true })
      .limit(100)

    if (error || !data || data.length === 0) {
      // Fall back to seed messages if table empty or missing
      return localMessages[channelId] || SEED_MESSAGES[channelId] || []
    }

    return data as InternalMessage[]
  } catch {
    return localMessages[channelId] || SEED_MESSAGES[channelId] || []
  }
}

/** Send a message to a channel */
export async function sendInternalMessage(
  channelId: string,
  userId: string,
  userName: string,
  userRole: string,
  message: string
): Promise<InternalMessage | null> {
  const newMsg: InternalMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    channel_id: channelId,
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    message,
    created_at: new Date().toISOString(),
  }

  if (!isSupabaseConfigured()) {
    // Store locally
    if (!localMessages[channelId]) localMessages[channelId] = []
    localMessages[channelId].push(newMsg)
    return newMsg
  }

  try {
    const { data, error } = await (supabase as any)
      .from('internal_messages')
      .insert({
        channel_id: channelId,
        user_id: userId,
        user_name: userName,
        user_role: userRole,
        message,
      })
      .select()
      .single()

    if (error) {
      // Fallback to local if table doesn't exist
      if (!localMessages[channelId]) localMessages[channelId] = []
      localMessages[channelId].push(newMsg)
      return newMsg
    }

    return data as InternalMessage
  } catch {
    if (!localMessages[channelId]) localMessages[channelId] = []
    localMessages[channelId].push(newMsg)
    return newMsg
  }
}

/** Subscribe to new messages in a channel (realtime) */
export function onInternalMessage(channelId: string, handler: (payload: any) => void) {
  return subscribeToTable('internal_messages', 'INSERT', handler, `channel_id=eq.${channelId}`)
}

/** Subscribe to all internal messages across channels */
export function onAnyInternalMessage(handler: (payload: any) => void) {
  return subscribeToTable('internal_messages', 'INSERT', handler)
}
