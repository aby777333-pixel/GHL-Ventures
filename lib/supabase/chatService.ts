/* ─────────────────────────────────────────────────────────────
   Chat Service — Real-time chat between website visitors/clients
   and CS Dashboard agents. Handles session creation, message
   sending, auto-assignment, and RM request routing.

   Cross-portal wires served:
   • Website ChatWidget → CS Dashboard (live chat)
   • Client Dashboard "Talk with RM" → CS Dashboard (RM queue)
   • Admin Dashboard → CS Dashboard (chat oversight & reassignment)
   ───────────────────────────────────────────────────────────── */

'use client'

import { supabase, isSupabaseConfigured } from './client'

/** Encode HTML entities to prevent stored XSS */
function sanitizeStr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
}

// Helper: bypass Supabase strict types for new tables not yet in types.ts
// These tables (chat_sessions, chat_messages, rm_requests) are defined in
// migration 022 but not yet added to the generated TypeScript types.
const db = supabase as any

// ── Startup Diagnostic (dev only) ─────────────────────────────
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const configured = isSupabaseConfigured()
  if (!configured) console.warn('[chatService] Supabase not configured — chat features unavailable')
}

// ── Types ─────────────────────────────────────────────────────

export interface ChatSession {
  id: string
  visitor_id: string | null
  visitor_name: string
  visitor_email: string | null
  client_id: string | null
  assigned_rep_id: string | null
  status: 'waiting' | 'assigned' | 'active' | 'resolved' | 'closed' | 'queued'
  channel: string
  priority: number
  page_url: string | null
  assigned_at: string | null
  first_response_at: string | null
  resolved_at: string | null
  last_message_at: string
  csat_rating: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  session_id: string
  sender_type: 'visitor' | 'agent' | 'system' | 'bot'
  sender_id: string | null
  sender_name: string | null
  message: string
  attachments: string[]
  metadata: Record<string, any>
  created_at: string
}

export interface RMRequest {
  id: string
  client_id: string
  client_name: string
  rm_id: string | null
  request_type: 'chat' | 'call' | 'video' | 'callback'
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'missed' | 'cancelled'
  priority: number
  notes: string | null
  accepted_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// ── Helper: generate visitor ID ───────────────────────────────

function getOrCreateVisitorId(): string {
  if (typeof window === 'undefined') return 'server-visitor'
  let id = localStorage.getItem('ghl-visitor-id')
  if (!id) {
    id = `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    localStorage.setItem('ghl-visitor-id', id)
  }
  return id
}

// ════════════════════════════════════════════════════════════════
// CHAT SESSION OPERATIONS
// ════════════════════════════════════════════════════════════════

/** Create a new chat session for a website visitor or authenticated client */
export async function createChatSession(input: {
  visitorName: string
  visitorEmail?: string
  visitorPhone?: string
  clientId?: string
  pageUrl?: string
  channel?: string
}): Promise<ChatSession | null> {
  if (!isSupabaseConfigured()) return null

  // Use RPC to create session — direct insert + .select() fails for
  // anonymous visitors because RLS blocks the SELECT after INSERT
  const { data, error } = await db.rpc('create_visitor_chat_session', {
    p_visitor_id: getOrCreateVisitorId(),
    p_visitor_name: sanitizeStr(input.visitorName),
    p_visitor_email: input.visitorEmail ? sanitizeStr(input.visitorEmail) : null,
    p_client_id: input.clientId || null,
    p_page_url: input.pageUrl || null,
    p_channel: input.channel || 'web_chat',
  })

  if (error || !data || (Array.isArray(data) && data.length === 0)) {
    console.error('[chatService] Failed to create session:', error?.message || 'no data returned')
    return null
  }

  const session = (Array.isArray(data) ? data[0] : data) as ChatSession

  // Trigger auto-assignment via SECURITY DEFINER RPC
  // (This runs server-side in Postgres, bypassing RLS)
  const { data: repId, error: assignErr } = await db.rpc('auto_assign_visitor_chat', {
    p_session_id: session.id,
  })
  if (assignErr) {
    console.error('[chatService] Auto-assign RPC failed:', assignErr.message)
  }

  // Re-fetch session to get updated assignment info
  const { data: updated } = await db.rpc('get_visitor_active_session', {
    p_visitor_id: getOrCreateVisitorId(),
  })
  if (updated && (Array.isArray(updated) ? updated.length > 0 : updated)) {
    const final = (Array.isArray(updated) ? updated[0] : updated) as ChatSession
    return final
  }

  return session
}

/** Fetch active chat session for current visitor (if any) — uses RPC to bypass RLS */
export async function getActiveSessionForVisitor(): Promise<ChatSession | null> {
  if (!isSupabaseConfigured()) return null

  const visitorId = getOrCreateVisitorId()
  const { data, error } = await db.rpc('get_visitor_active_session', {
    p_visitor_id: visitorId,
  })

  if (error) {
    console.error('[chatService] get_visitor_active_session error:', error.message)
    return null
  }
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return null
  }
  const session = (Array.isArray(data) ? data[0] : data) as ChatSession
  return session
}

/** Auto-assign a chat session to the least-busy available CS rep.
 *  Uses SECURITY DEFINER RPC — safe to call from anonymous visitor context. */
export async function autoAssignChat(sessionId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null

  const { data, error } = await db.rpc('auto_assign_visitor_chat', {
    p_session_id: sessionId,
  })

  if (error) {
    console.error('[chatService] Auto-assign RPC failed:', error.message)
    return null
  }

  return data as string | null
}

/** Admin: manually reassign a chat to a different rep */
export async function reassignChat(sessionId: string, newRepId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false

  const { error } = await db
    .from('chat_sessions')
    .update({
      assigned_rep_id: newRepId,
      assigned_at: new Date().toISOString(),
      status: 'assigned',
    })
    .eq('id', sessionId)

  if (error) {
    console.error('[chatService] Reassign failed:', error.message)
    return false
  }

  // Notify new rep
  await db.from('notifications').insert({
    user_id: newRepId,
    type: 'action_required',
    title: 'Chat Reassigned to You',
    message: 'An active chat has been reassigned to you by admin.',
    link: '/staff/cs/chat',
    metadata: { session_id: sessionId },
  })

  return true
}

/** Transfer a chat session to an RM (Relationship Manager).
 *  Called when agent clicks "Connect to RM" — finds an available RM
 *  (team leader / relationship manager), reassigns the session,
 *  and sends a system message. */
export async function transferChatToRM(sessionId: string, agentName: string): Promise<{ success: boolean; rmName: string | null }> {
  if (!isSupabaseConfigured()) return { success: false, rmName: null }

  // Find an available RM (team leader or relationship manager)
  const { data: rmData, error: rmErr } = await db.rpc('find_available_rm_for_transfer')

  if (rmErr || !rmData) {
    console.error('[chatService] find_available_rm_for_transfer failed:', rmErr?.message)
    return { success: false, rmName: null }
  }

  const rm = Array.isArray(rmData) ? rmData[0] : rmData
  if (!rm || !rm.user_id) {
    return { success: false, rmName: null }
  }

  // Reassign the session to the RM
  const { error: updateErr } = await db.rpc('transfer_chat_to_rm', {
    p_session_id: sessionId,
    p_rm_user_id: rm.user_id,
    p_agent_name: agentName,
    p_rm_name: rm.full_name,
  })

  if (updateErr) {
    console.error('[chatService] transfer_chat_to_rm failed:', updateErr.message)
    return { success: false, rmName: null }
  }

  return { success: true, rmName: rm.full_name }
}

/** Resolve/close a chat session */
export async function resolveChatSession(sessionId: string, rating?: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true

  // Use RPC for visitor-initiated resolve (anonymous can't UPDATE via RLS)
  const { error } = await db.rpc('resolve_visitor_chat_session', {
    p_session_id: sessionId,
    p_rating: rating || null,
  })

  return !error
}

// ════════════════════════════════════════════════════════════════
// CHAT MESSAGE OPERATIONS
// ════════════════════════════════════════════════════════════════

/** Send a message in a chat session */
export async function sendChatMessage(input: {
  sessionId: string
  senderType: 'visitor' | 'agent' | 'system' | 'bot'
  senderId?: string
  senderName?: string
  message: string
}): Promise<ChatMessage | null> {
  if (!isSupabaseConfigured()) return null

  // All messages (visitor, agent, system, bot) go through the SECURITY DEFINER
  // RPC to bypass RLS. Direct inserts fail when the staff user's SELECT policy
  // blocks the RETURNING clause, rolling back the INSERT entirely.
  const { data, error } = await db.rpc('send_visitor_chat_message', {
    p_session_id: input.sessionId,
    p_sender_type: input.senderType,
    p_sender_name: input.senderName ? sanitizeStr(input.senderName) : null,
    p_message: sanitizeStr(input.message),
  })

  if (error) {
    console.error('[chatService] RPC send_visitor_chat_message failed:', error.message)
    return null
  }

  // Also update last_message_at on the session (the DB trigger handles this,
  // but update status to 'active' if agent sent the first reply)
  if (input.senderType === 'agent') {
    await db.rpc('mark_chat_session_active', {
      p_session_id: input.sessionId,
    }).catch(() => {}) // Non-critical — trigger handles the core update
  }

  // The RPC may return the inserted row or null/void — either way,
  // no error means the message was inserted successfully.
  // Build a local echo so the UI can render immediately
  const row = data ? (Array.isArray(data) ? data[0] : data) as ChatMessage : null
  return row ?? {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    session_id: input.sessionId,
    sender_type: input.senderType,
    sender_id: null,
    sender_name: input.senderName || null,
    message: input.message,
    attachments: [],
    metadata: {},
    created_at: new Date().toISOString(),
  } as ChatMessage
}

/** Fetch message history for a chat session.
 *  Uses RPC (SECURITY DEFINER) to bypass RLS — works for both
 *  anonymous visitors and staff regardless of auth state. */
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured()) return []

  // Use the same RPC as visitors — it's SECURITY DEFINER and returns all messages
  const { data, error } = await db.rpc('get_visitor_chat_messages', {
    p_session_id: sessionId,
  })

  if (error) {
    console.error('[chatService] Failed to fetch messages:', error.message)
    return []
  }

  return (data || []) as ChatMessage[]
}

/** Fetch message history using RPC — for anonymous visitors (bypasses RLS) */
export async function getVisitorChatMessages(sessionId: string): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await db.rpc('get_visitor_chat_messages', {
    p_session_id: sessionId,
  })

  if (error) {
    console.error('[chatService] RPC get_visitor_chat_messages failed:', error.message)
    return []
  }

  return (data || []) as ChatMessage[]
}

/** Poll for new agent messages since a timestamp — for visitor polling */
export async function pollNewMessages(sessionId: string, since: string): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await db.rpc('get_visitor_new_messages', {
    p_session_id: sessionId,
    p_since: since,
  })

  if (error) {
    console.error('[chatService] Poll failed:', error.message)
    return []
  }

  return (data || []) as ChatMessage[]
}

// ════════════════════════════════════════════════════════════════
// RM REQUEST OPERATIONS (Client "Talk with RM")
// ════════════════════════════════════════════════════════════════

/** Client: create a request to talk with their assigned RM */
export async function createRMRequest(input: {
  clientId: string
  clientName: string
  requestType?: 'chat' | 'call' | 'video' | 'callback'
  notes?: string
}): Promise<RMRequest | null> {
  if (!isSupabaseConfigured()) {
    const mock: RMRequest = {
      id: `mock-rm-${Date.now()}`,
      client_id: input.clientId,
      client_name: input.clientName,
      rm_id: null,
      request_type: input.requestType || 'chat',
      status: 'pending',
      priority: 1,
      notes: input.notes || null,
      accepted_at: null,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    return mock
  }

  // Look up assigned RM from client_assignments
  const { data: assignment } = await db
    .from('client_assignments')
    .select('staff_id')
    .eq('client_id', input.clientId)
    .eq('role', 'relationship_manager')
    .limit(1)
    .single()

  // Also try the clients table assigned_rm field
  let rmUserId = assignment?.staff_id || null
  if (!rmUserId) {
    const { data: client } = await db
      .from('clients')
      .select('assigned_rm')
      .eq('user_id', input.clientId)
      .single()
    rmUserId = client?.assigned_rm || null
  }

  const { data, error } = await db
    .from('rm_requests')
    .insert({
      client_id: input.clientId,
      client_name: input.clientName,
      rm_id: rmUserId,
      request_type: input.requestType || 'chat',
      priority: 1, // Client-initiated = high priority (pushes to top of queue)
      notes: input.notes || null,
    })
    .select()
    .single()

  if (error) {
    console.error('[chatService] Failed to create RM request:', error.message)
    return null
  }

  // Notify the RM
  if (rmUserId) {
    await db.from('notifications').insert({
      user_id: rmUserId,
      type: 'action_required',
      title: `${input.clientName} wants to talk`,
      message: `Client ${input.clientName} has requested a ${input.requestType || 'chat'}. This is a priority request.`,
      link: '/staff/cs/chat',
      metadata: { rm_request_id: data.id, client_id: input.clientId },
    })
  }

  return data as RMRequest
}

/** RM: accept a client request */
export async function acceptRMRequest(requestId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true

  const { error } = await db
    .from('rm_requests')
    .update({
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  return !error
}

/** RM: complete a client request */
export async function completeRMRequest(requestId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true

  const { error } = await db
    .from('rm_requests')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  return !error
}

/** Fetch pending RM requests for a specific RM (sorted by priority) */
export async function getRMRequests(rmId: string): Promise<RMRequest[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await db
    .from('rm_requests')
    .select('*')
    .eq('rm_id', rmId)
    .in('status', ['pending', 'accepted', 'in_progress'])
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[chatService] Failed to fetch RM requests:', error.message)
    return []
  }

  return (data || []) as RMRequest[]
}

// ════════════════════════════════════════════════════════════════
// CS DASHBOARD QUERIES
// ════════════════════════════════════════════════════════════════

/** Fetch all active chat sessions (for CS Dashboard overview).
 *  Uses SECURITY DEFINER RPC to bypass RLS — ensures staff
 *  always see incoming chats regardless of auth state. */
export async function getActiveChatSessions(repId?: string): Promise<ChatSession[]> {
  if (!isSupabaseConfigured()) return []

  const { data, error } = await db.rpc('get_active_chat_sessions_staff', {
    p_rep_id: repId || null,
  })

  if (error) {
    console.error('[chatService] RPC get_active_chat_sessions_staff failed:', error.message)
    // Fallback to direct query (works when staff IS authenticated)
    const { data: fallback, error: fbErr } = await db
      .from('chat_sessions')
      .select('*')
      .in('status', ['waiting', 'assigned', 'active', 'queued'])
      .order('priority', { ascending: false })
      .order('last_message_at', { ascending: false })

    if (fbErr) {
      console.error('[chatService] Fallback also failed:', fbErr.message)
      return []
    }
    return (fallback || []) as ChatSession[]
  }

  return (data || []) as ChatSession[]
}

/** Admin: get chat overview stats */
export async function getChatOverviewStats(): Promise<{
  activeSessions: number
  waitingCount: number
  avgWaitTime: number
  repLoads: { repId: string; name: string; load: number }[]
}> {
  if (!isSupabaseConfigured()) {
    return { activeSessions: 0, waitingCount: 0, avgWaitTime: 0, repLoads: [] }
  }

  const { count: activeCount } = await db
    .from('chat_sessions')
    .select('id', { count: 'exact', head: true })
    .in('status', ['assigned', 'active'])

  const { count: waitingCount } = await db
    .from('chat_sessions')
    .select('id', { count: 'exact', head: true })
    .in('status', ['waiting', 'queued'])

  return {
    activeSessions: activeCount || 0,
    waitingCount: waitingCount || 0,
    avgWaitTime: 0, // Would need time-series calculation
    repLoads: [],
  }
}


// ════════════════════════════════════════════════════════════════
// STAFF PRESENCE OPERATIONS
// ════════════════════════════════════════════════════════════════

export interface StaffPresence {
  user_id: string
  status: 'online' | 'away' | 'busy' | 'offline'
  display_name: string | null
  role: string | null
  active_chats: number
  max_chats: number
  last_seen: string
}

export interface CannedResponse {
  id: string
  shortcut: string
  title: string
  message: string
  category: string | null
}

/** Set staff presence status (online/away/busy/offline) */
export async function upsertStaffPresence(input: {
  userId: string
  status?: string
  displayName?: string
  role?: string
}): Promise<void> {
  if (!isSupabaseConfigured()) return
  await db.rpc('upsert_staff_presence', {
    p_user_id: input.userId,
    p_status: input.status || 'online',
    p_display_name: input.displayName || null,
    p_role: input.role || null,
  }).catch((e: any) => console.error('[chatService] upsertStaffPresence:', e.message))
}

/** Update staff status only */
export async function updateStaffStatus(userId: string, status: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await db.rpc('update_staff_status', { p_user_id: userId, p_status: status })
    .catch((e: any) => console.error('[chatService] updateStaffStatus:', e.message))
}

/** Staff heartbeat — update last_seen */
export async function staffHeartbeat(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await db.rpc('staff_heartbeat', { p_user_id: userId })
    .catch(() => {}) // Silent — non-critical
}

/** Get all online staff members */
export async function getOnlineStaff(): Promise<StaffPresence[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await db.rpc('get_online_staff')
  if (error) {
    console.error('[chatService] get_online_staff failed:', error.message)
    return []
  }
  return (data || []) as StaffPresence[]
}

/** Get canned responses from database */
export async function getCannedResponses(): Promise<CannedResponse[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await db.rpc('get_canned_responses')
  if (error) {
    console.error('[chatService] get_canned_responses failed:', error.message)
    return []
  }
  return (data || []) as CannedResponse[]
}

/** Save CSAT rating for a chat session */
export async function saveCsatRating(sessionId: string, score: number, feedback?: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true
  const { error } = await db.rpc('save_csat_rating', {
    p_session_id: sessionId,
    p_score: score,
    p_feedback: feedback || null,
  })
  if (error) console.error('[chatService] saveCsatRating:', error.message)
  return !error
}

/** Resolve a chat session from the staff side */
export async function resolveSessionFromStaff(sessionId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return true
  const { error } = await db
    .from('chat_sessions')
    .update({ status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', sessionId)
  if (error) {
    console.error('[chatService] resolveSessionFromStaff:', error.message)
    return false
  }
  await sendChatMessage({
    sessionId,
    senderType: 'system',
    message: 'This chat has been resolved by the agent. Thank you for contacting GHL India Ventures.',
  })
  return true
}
