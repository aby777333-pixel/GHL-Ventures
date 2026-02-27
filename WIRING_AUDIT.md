# Cross-Portal Wiring Audit

> Last updated: 2026-02-27
> Build status: PASSING

---

## Summary of Changes

This audit documents all cross-portal data flows in GHL India Ventures, what was broken, and what was fixed during the Feb 2026 wiring sprint.

### Root Cause

The `messages`, `tickets`, and `tasks` tables were defined in TypeScript types (`lib/supabase/types.ts`) but **never created in any SQL migration**. The entire inter-portal communication layer was running on mock/demo data only. Additionally, `chat_sessions`, `chat_messages`, and `rm_requests` tables did not exist at all.

### What Was Created

| File | Purpose |
|------|---------|
| `supabase/migrations/022_cross_portal_wiring.sql` | Creates 6 missing tables: `messages`, `tickets`, `tasks`, `chat_sessions`, `chat_messages`, `rm_requests` with RLS, indexes, triggers, and Realtime |
| `lib/supabase/chatService.ts` | Service layer for chat sessions, messages, RM requests, auto-assignment, and CS dashboard queries |

### What Was Modified

| File | Changes |
|------|---------|
| `lib/supabase/realtimeSubscriptions.ts` | Added 7 new subscription functions for chat & RM real-time events |
| `components/chat/ChatWidget.tsx` | Converted from simulated responses to Supabase-backed real-time chat |
| `components/dashboard/DashboardClient.tsx` | RM card buttons now create real `rm_requests` via Supabase |
| `components/staff/modules/CSCenterModule.tsx` | CS ChatView now loads real sessions, subscribes to real-time messages, sends agent replies via Supabase |
| `app/layout.tsx` | Re-enabled ChatWidget (was commented out) |

---

## Cross-Portal Connection Matrix

### 1. Website Visitor -> CS Dashboard (Live Chat)

| Step | Component | Status |
|------|-----------|--------|
| Visitor opens chat widget | `ChatWidget.tsx` | WIRED |
| Session created in Supabase | `chatService.createChatSession()` | WIRED |
| Auto-assignment to least-busy rep | `chatService.autoAssignChat()` | WIRED |
| Rep notification created | `notifications` table insert | WIRED |
| CS Dashboard shows new session | `CSCenterModule.tsx` + `onNewChatSession()` | WIRED |
| Visitor sends message | `chatService.sendChatMessage()` | WIRED |
| Agent sees message in real-time | `onChatMessage(sessionId)` subscription | WIRED |
| Agent replies | `chatService.sendChatMessage()` (sender_type: 'agent') | WIRED |
| Visitor sees reply in real-time | `onChatMessage(sessionId)` subscription | WIRED |
| Session resolved + rating | `chatService.resolveChatSession()` | WIRED |

### 2. Client Dashboard -> RM (Talk with RM)

| Step | Component | Status |
|------|-----------|--------|
| Client clicks "Talk with RM" | `DashboardClient.tsx` | WIRED |
| RM request created | `chatService.createRMRequest()` | WIRED |
| RM looked up from `client_assignments` | `chatService.createRMRequest()` fallback to `clients.assigned_rm` | WIRED |
| RM notification sent | `notifications` table insert | WIRED |
| RM sees request in queue | `chatService.getRMRequests()` | WIRED |
| RM accepts request | `chatService.acceptRMRequest()` | WIRED |
| RM completes request | `chatService.completeRMRequest()` | WIRED |
| Real-time updates | `onRMRequest(rmId)` subscription | WIRED |

### 3. Client -> Support Tickets -> CS -> Admin

| Step | Component | Status |
|------|-----------|--------|
| Client creates ticket | Service layer (existing) | WIRED (table now exists) |
| CS agent sees ticket | `onNewTicket()` subscription + RLS | WIRED |
| CS updates ticket status | RLS policy allows CS roles | WIRED |
| Admin oversight | RLS `is_admin_or_above()` | WIRED |
| Real-time updates | `onClientTicketUpdate()`, `onMyTicketUpdate()` | WIRED |

### 4. Internal Messaging (Client <-> RM)

| Step | Component | Status |
|------|-----------|--------|
| Message table exists | Migration 022 | WIRED |
| RLS: sender/recipient or admin | `messages_select_own` policy | WIRED |
| Real-time delivery | `onNewMessage(clientId)` subscription | WIRED |

### 5. Internal Tasks (Staff)

| Step | Component | Status |
|------|-----------|--------|
| Task table exists | Migration 022 | WIRED |
| Task assignment | `assigned_to`, `assigned_by` columns | WIRED |
| Real-time updates | `onNewTask(staffId)` subscription | WIRED |
| RLS | Assigned user, assigner, or admin | WIRED |

### 6. Admin -> CS Dashboard (Chat Oversight)

| Step | Component | Status |
|------|-----------|--------|
| View all sessions | `getActiveChatSessions()` (no repId filter) | WIRED |
| Reassign chats | `chatService.reassignChat()` | WIRED |
| Monitor stats | `chatService.getChatOverviewStats()` | WIRED |
| Real-time status changes | `onChatSessionStatusChange()` subscription | WIRED |

---

## Google OAuth Status

| Item | Status |
|------|--------|
| Login page `signInWithOAuth()` | CODE CORRECT |
| Register page `signInWithOAuth()` | CODE CORRECT |
| `/auth/callback/` handler | CODE CORRECT |
| `ensureProfile()` for new OAuth users | CODE CORRECT |
| Supabase Dashboard URL config | NEEDS MANUAL CONFIG |
| Google Cloud Console redirect URI | NEEDS MANUAL CONFIG |

### Required Configuration

1. **Supabase Dashboard** (`obugyxjgwnwijhsfyfxp`):
   - Site URL: `https://ghl-india-ventures-2025.netlify.app`
   - Redirect URLs: include `https://ghl-india-ventures-2025.netlify.app/auth/callback/`

2. **Google Cloud Console** (OAuth 2.0 Client):
   - Authorized redirect URI: `https://obugyxjgwnwijhsfyfxp.supabase.co/auth/v1/callback`
   - Authorized JS origin: `https://ghl-india-ventures-2025.netlify.app`

---

## Email Verification Status

Supabase Auth handles email verification natively. Toggle "Confirm email" in Supabase Dashboard > Authentication > Settings. No custom code required.

---

## Database Migration Checklist

Migration `022_cross_portal_wiring.sql` must be run on Supabase before these features work in production:

```bash
# Option 1: Supabase CLI
supabase db push

# Option 2: Copy SQL into Supabase Dashboard > SQL Editor and execute
```

Tables created:
- `messages` — Client <-> RM secure messaging
- `tickets` — Support ticket lifecycle
- `tasks` — Internal staff task management
- `chat_sessions` — Live chat session tracking
- `chat_messages` — Individual chat messages
- `rm_requests` — Client "Talk with RM" queue

All tables have:
- Row Level Security enabled
- Appropriate RLS policies per role
- `updated_at` auto-update triggers
- Supabase Realtime publication enabled

---

## Realtime Subscriptions Reference

| Function | Table | Event | Filter | Used By |
|----------|-------|-------|--------|---------|
| `onNewChatSession` | `chat_sessions` | INSERT | none | CS Dashboard |
| `onMyChatSessionUpdate` | `chat_sessions` | * | `assigned_rep_id=eq.{repId}` | CS Agent |
| `onChatMessage` | `chat_messages` | INSERT | `session_id=eq.{sessionId}` | ChatWidget, CS Agent |
| `onAnyChatMessage` | `chat_messages` | INSERT | none | CS Dashboard overview |
| `onRMRequest` | `rm_requests` | * | `rm_id=eq.{rmId}` | RM Staff |
| `onAllRMRequests` | `rm_requests` | INSERT | none | Admin oversight |
| `onChatSessionStatusChange` | `chat_sessions` | UPDATE | none | Admin oversight |
| `onNewTicket` | `tickets` | INSERT | none | Admin/CS |
| `onMyTicketUpdate` | `tickets` | * | `assigned_to=eq.{staffId}` | CS Agent |
| `onNewTask` | `tasks` | INSERT | `assigned_to=eq.{staffId}` | Staff |
| `onClientNotification` | `notifications` | INSERT | `user_id=eq.{clientId}` | Client |
| `onClientTicketUpdate` | `tickets` | UPDATE | `client_id=eq.{clientId}` | Client |
| `onNewMessage` | `messages` | INSERT | `to_id=eq.{clientId}` | Client |

---

## Auto-Assignment Algorithm

When a new chat session is created:

1. Query `staff_profiles` for active staff with designation in: `cs-agent`, `senior-cs-agent`, `cs-lead`, `relationship-manager`
2. For each rep, count their active sessions (status `assigned` or `active`)
3. Sort by load ascending (least busy first)
4. Assign session to rep with lowest load
5. Create notification for assigned rep
6. If no reps available, set session status to `queued`

---

## Post-Deploy Verification Checklist

- [ ] Run migration 022 on Supabase
- [ ] Configure Google OAuth (Supabase URL config + Google Cloud Console)
- [ ] Enable email verification in Supabase Auth settings
- [ ] Test: Open ChatWidget on website, send message, verify it appears in CS Dashboard
- [ ] Test: Client clicks "Talk with RM", verify RM gets notification
- [ ] Test: CS agent replies to chat, verify visitor sees reply in real-time
- [ ] Test: Admin can view all active sessions and reassign
- [ ] Test: Chat session resolves correctly with CSAT rating
- [ ] Verify Netlify env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
