/* ─────────────────────────────────────────────────────────────
   Realtime Subscriptions — Supabase Realtime for live updates

   Provides subscription functions for cross-portal data sync.
   Key flows:
   - Admin edits client → Staff sees it → Client sees it
   - Client creates ticket → Staff gets it → Admin monitors
   - Staff updates KYC → Client dashboard reflects
   ───────────────────────────────────────────────────────────── */

'use client'

import { supabase, isSupabaseConfigured } from './client'
import type { RealtimeChannel } from '@supabase/supabase-js'

type ChangeHandler = (payload: any) => void

// ── Active channels registry ────────────────────────────────
const activeChannels = new Map<string, RealtimeChannel>()

// ── Subscribe to table changes ──────────────────────────────
export function subscribeToTable(
  table: string,
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
  handler: ChangeHandler,
  filter?: string
): (() => void) | null {
  if (!isSupabaseConfigured()) return null

  const channelName = `${table}-${event}-${filter || 'all'}`

  // Prevent duplicate subscriptions
  if (activeChannels.has(channelName)) {
    activeChannels.get(channelName)?.unsubscribe()
  }

  const channelConfig: any = {
    event,
    schema: 'public',
    table,
  }

  if (filter) {
    channelConfig.filter = filter
  }

  const channel = supabase
    .channel(channelName)
    .on('postgres_changes', channelConfig, handler)
    .subscribe()

  activeChannels.set(channelName, channel)

  // Return unsubscribe function
  return () => {
    channel.unsubscribe()
    activeChannels.delete(channelName)
  }
}

// ── Portal-Specific Subscriptions ───────────────────────────

/** Admin: Subscribe to new tickets from clients */
export function onNewTicket(handler: ChangeHandler) {
  return subscribeToTable('tickets', 'INSERT', handler)
}

/** Admin: Subscribe to all notification changes */
export function onNotificationChange(handler: ChangeHandler) {
  return subscribeToTable('notifications', '*', handler)
}

/** Staff: Subscribe to tickets assigned to a specific staff member */
export function onMyTicketUpdate(staffId: string, handler: ChangeHandler) {
  return subscribeToTable('tickets', '*', handler, `assigned_to=eq.${staffId}`)
}

/** Staff: Subscribe to new task assignments */
export function onNewTask(staffId: string, handler: ChangeHandler) {
  return subscribeToTable('tasks', 'INSERT', handler, `assigned_to=eq.${staffId}`)
}

/** Client: Subscribe to their own notification updates */
export function onClientNotification(clientId: string, handler: ChangeHandler) {
  return subscribeToTable('notifications', 'INSERT', handler, `user_id=eq.${clientId}`)
}

/** Client: Subscribe to their ticket status changes */
export function onClientTicketUpdate(clientId: string, handler: ChangeHandler) {
  return subscribeToTable('tickets', 'UPDATE', handler, `client_id=eq.${clientId}`)
}

/** Client: Subscribe to new messages */
export function onNewMessage(clientId: string, handler: ChangeHandler) {
  return subscribeToTable('messages', 'INSERT', handler, `to_id=eq.${clientId}`)
}

/** Client: Subscribe to investment/portfolio updates */
export function onInvestmentUpdate(clientId: string, handler: ChangeHandler) {
  return subscribeToTable('investments', 'UPDATE', handler, `client_id=eq.${clientId}`)
}

/** Admin: Subscribe to audit log entries */
export function onAuditEvent(handler: ChangeHandler) {
  return subscribeToTable('audit_log', 'INSERT', handler)
}

/** Admin/Staff: Subscribe to new leads (website form submissions) */
export function onNewLead(handler: ChangeHandler) {
  return subscribeToTable('leads', 'INSERT', handler)
}

/** Admin/Staff: Subscribe to all lead changes */
export function onLeadChange(handler: ChangeHandler) {
  return subscribeToTable('leads', '*', handler)
}

/** Admin/Staff: Subscribe to new contact form submissions */
export function onNewContactSubmission(handler: ChangeHandler) {
  return subscribeToTable('contact_submissions', 'INSERT', handler)
}

/** Admin: Subscribe to KYC document status changes */
export function onKYCStatusChange(handler: ChangeHandler) {
  return subscribeToTable('kyc_documents', 'UPDATE', handler)
}

// ── Chat & RM Subscriptions (Cross-Portal Wiring) ───────────

/** CS Dashboard: Subscribe to new chat sessions waiting for assignment */
export function onNewChatSession(handler: ChangeHandler) {
  return subscribeToTable('chat_sessions', 'INSERT', handler)
}

/** CS Dashboard: Subscribe to chat sessions assigned to a specific rep */
export function onMyChatSessionUpdate(repId: string, handler: ChangeHandler) {
  return subscribeToTable('chat_sessions', '*', handler, `assigned_rep_id=eq.${repId}`)
}

/** CS Dashboard: Subscribe to new chat messages in a specific session */
export function onChatMessage(sessionId: string, handler: ChangeHandler) {
  return subscribeToTable('chat_messages', 'INSERT', handler, `session_id=eq.${sessionId}`)
}

/** CS Dashboard: Subscribe to all new chat messages (for active rep) */
export function onAnyChatMessage(handler: ChangeHandler) {
  return subscribeToTable('chat_messages', 'INSERT', handler)
}

/** Staff/RM: Subscribe to RM requests assigned to this RM */
export function onRMRequest(rmId: string, handler: ChangeHandler) {
  return subscribeToTable('rm_requests', '*', handler, `rm_id=eq.${rmId}`)
}

/** Admin: Subscribe to all RM requests (oversight) */
export function onAllRMRequests(handler: ChangeHandler) {
  return subscribeToTable('rm_requests', 'INSERT', handler)
}

/** Admin: Subscribe to chat session status changes (oversight) */
export function onChatSessionStatusChange(handler: ChangeHandler) {
  return subscribeToTable('chat_sessions', 'UPDATE', handler)
}


/** Staff: Subscribe to staff presence changes */
export function onStaffPresenceChange(handler: ChangeHandler) {
  return subscribeToTable('staff_presence', '*', handler)
}

/** Admin/CS: Subscribe to new document downloads (live activity feed) */
export function onNewDownload(handler: ChangeHandler) {
  return subscribeToTable('download_logs', 'INSERT', handler)
}

// ── Cleanup ─────────────────────────────────────────────────

/** Unsubscribe from all active channels */
export function unsubscribeAll() {
  activeChannels.forEach(channel => channel.unsubscribe())
  activeChannels.clear()
}

/** Get count of active subscriptions */
export function getActiveSubscriptionCount(): number {
  return activeChannels.size
}
