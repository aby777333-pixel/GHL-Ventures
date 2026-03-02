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

// ── Mock seed messages (shown when DB is empty) ──────────────
const SEED_MESSAGES: Record<string, InternalMessage[]> = {
  general: [
    { id: 'seed-g1', channel_id: 'general', user_id: 'sys', user_name: 'Rajesh Kumar', user_role: 'admin', message: 'Welcome to GHL Internal Chat! Use this channel for general discussions across the team.', created_at: '2026-02-28T09:00:00Z' },
    { id: 'seed-g2', channel_id: 'general', user_id: 'sys', user_name: 'Priya Sharma', user_role: 'admin', message: 'Reminder: Monthly all-hands meeting is scheduled for this Friday at 3 PM IST.', created_at: '2026-03-01T10:30:00Z' },
    { id: 'seed-g3', channel_id: 'general', user_id: 'sys', user_name: 'Ananya Singh', user_role: 'staff', message: 'Noted! Will the meeting be on Google Meet or in-person?', created_at: '2026-03-01T10:45:00Z' },
  ],
  announcements: [
    { id: 'seed-a1', channel_id: 'announcements', user_id: 'sys', user_name: 'Vikram Mehta', user_role: 'admin', message: '📢 Q4 results are out — GHL AIF Fund I delivered 18.2% returns. Congratulations to the entire team!', created_at: '2026-02-25T11:00:00Z' },
    { id: 'seed-a2', channel_id: 'announcements', user_id: 'sys', user_name: 'Rajesh Kumar', user_role: 'admin', message: 'New SEBI circular on AIF reporting — compliance team will brief everyone by EOD Friday.', created_at: '2026-03-01T14:00:00Z' },
  ],
  compliance: [
    { id: 'seed-c1', channel_id: 'compliance', user_id: 'sys', user_name: 'Priya Sharma', user_role: 'admin', message: 'Updated KYC checklist has been uploaded to the Policies section. Please review before next week.', created_at: '2026-02-27T09:15:00Z' },
    { id: 'seed-c2', channel_id: 'compliance', user_id: 'sys', user_name: 'Priya Sharma', user_role: 'admin', message: 'Reminder: All client communications must include the standard risk disclaimer. No exceptions.', created_at: '2026-03-01T16:00:00Z' },
  ],
  'sales-team': [
    { id: 'seed-s1', channel_id: 'sales-team', user_id: 'sys', user_name: 'Rahul Patel', user_role: 'staff', message: 'Just closed a ₹5 Cr commitment from a new HNI client in Pune. Documentation in progress.', created_at: '2026-02-28T15:30:00Z' },
    { id: 'seed-s2', channel_id: 'sales-team', user_id: 'sys', user_name: 'Ananya Singh', user_role: 'staff', message: 'Great work Rahul! I will start the KYC process for them today.', created_at: '2026-02-28T15:45:00Z' },
  ],
  support: [
    { id: 'seed-sup1', channel_id: 'support', user_id: 'sys', user_name: 'Ananya Singh', user_role: 'staff', message: 'Heads up — we have 3 pending KYC verifications that are past the 48-hour SLA. Prioritizing these today.', created_at: '2026-03-01T09:00:00Z' },
    { id: 'seed-sup2', channel_id: 'support', user_id: 'sys', user_name: 'Rajesh Kumar', user_role: 'admin', message: 'Please escalate any KYC delays beyond 72 hours to compliance directly.', created_at: '2026-03-01T09:30:00Z' },
  ],
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
