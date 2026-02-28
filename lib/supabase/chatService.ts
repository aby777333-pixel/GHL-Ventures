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

// Helper: bypass Supabase strict types for new tables not yet in types.ts
// These tables (chat_sessions, chat_messages, rm_requests) are defined in
// migration 022 but not yet added to the generated TypeScript types.
const db = supabase as any

// ── Startup Diagnostic (dev only) ─────────────────────────────
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const configured = isSupabaseConfigured()
  console.log(
    `[chatService] Supabase configured: ${configured}`,
    configured ? '✅' : '❌ (using mock data — env vars missing in build)'
  )
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

// ── Mock Data (fallback when Supabase unavailable) ────────────

const MOCK_SESSIONS: ChatSession[] = []
const MOCK_MESSAGES: ChatMessage[] = []

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
  clientId?: string
  pageUrl?: string
  channel?: string
}): Promise<ChatSession | null> {
  if (!isSupabaseConfigured()) {
    const mock: ChatSession = {
      id: `mock-session-${Date.now()}`,
      visitor_id: getOrCreateVisitorId(),
      visitor_name: input.visitorName,
      visitor_email: input.visitorEmail || null,
      client_id: input.clientId || null,
      assigned_rep_id: null,
      status: 'waiting',
      channel: input.channel || 'web_chat',
      priority: 0,
      page_url: input.pageUrl || null,
      assigned_at: null,
      first_response_at: null,
      resolved_at: null,
      last_message_at: new Date().toISOString(),
      csat_rating: null,
      metadata: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    MOCK_SESSIONS.push(mock)
    return mock
  }

  // Use RPC to create session — direct insert + .select() fails for
  // anonymous visitors because RLS blocks the SELECT after INSERT
  const { data, error } = await db.rpc('create_visitor_chat_session', {
    p_visitor_id: getOrCreateVisitorId(),
    p_visitor_name: input.visitorName,
    p_visitor_email: input.visitorEmail || null,
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
  if (!isSupabaseConfigured()) {
    const visitorId = getOrCreateVisitorId()
    return MOCK_SESSIONS.find(s => s.visitor_id === visitorId && !['resolved', 'closed'].includes(s.status)) || null
  }

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
  if (!isSupabaseConfigured()) {
    const mock: ChatMessage = {
      id: `mock-msg-${Date.now()}`,
      session_id: input.sessionId,
      sender_type: input.senderType,
      sender_id: input.senderId || null,
      sender_name: input.senderName || null,
      message: input.message,
      attachments: [],
      metadata: {},
      created_at: new Date().toISOString(),
    }
    MOCK_MESSAGES.push(mock)
    return mock
  }

  // For visitor/system messages, use RPC to avoid RLS blocking the
  // select-after-insert. Agent messages use direct insert (they're authenticated).
  if (input.senderType === 'visitor' || input.senderType === 'system' || input.senderType === 'bot') {
    const { data, error } = await db.rpc('send_visitor_chat_message', {
      p_session_id: input.sessionId,
      p_sender_type: input.senderType,
      p_sender_name: input.senderName || null,
      p_message: input.message,
    })

    if (error) {
      console.error('[chatService] RPC send_visitor_chat_message failed:', error.message)
      return null
    }

    const msg = (Array.isArray(data) ? data[0] : data) as ChatMessage
    return msg
  }

  // Agent messages — authenticated staff, RLS allows
  const { data, error } = await db
    .from('chat_messages')
    .insert({
      session_id: input.sessionId,
      sender_type: input.senderType,
      sender_id: input.senderId || null,
      sender_name: input.senderName || null,
      message: input.message,
    })
    .select()
    .single()

  if (error) {
    console.error('[chatService] Failed to send message:', error.message)
    return null
  }

  return data as ChatMessage
}

/** Fetch message history for a chat session */
export async function getChatMessages(sessionId: string): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_MESSAGES.filter(m => m.session_id === sessionId)
  }

  const { data, error } = await db
    .from('chat_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('[chatService] Failed to fetch messages:', error.message)
    return []
  }

  return (data || []) as ChatMessage[]
}

/** Fetch message history using RPC — for anonymous visitors (bypasses RLS) */
export async function getVisitorChatMessages(sessionId: string): Promise<ChatMessage[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_MESSAGES.filter(m => m.session_id === sessionId)
  }

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

/** Fetch all active chat sessions (for CS Dashboard overview) */
export async function getActiveChatSessions(repId?: string): Promise<ChatSession[]> {
  if (!isSupabaseConfigured()) return MOCK_SESSIONS

  let query = db
    .from('chat_sessions')
    .select('*')
    .in('status', ['waiting', 'assigned', 'active', 'queued'])
    .order('priority', { ascending: false })
    .order('last_message_at', { ascending: false })

  if (repId) {
    query = query.eq('assigned_rep_id', repId)
  }

  const { data, error } = await query

  if (error) {
    console.error('[chatService] Failed to fetch sessions:', error.message)
    return []
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
