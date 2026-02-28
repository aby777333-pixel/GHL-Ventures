# GHL India Ventures 2025 — Codebase Audit

**Date:** 2026-02-28
**Auditor:** Claude Code (automated)
**Repository:** GHL-Ventures (GitHub)
**Live URL:** https://ghl-india-ventures-2025.netlify.app/

---

## 1. Framework & Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript + React 18 |
| Styling | Tailwind CSS |
| Auth | Supabase Auth (OAuth, Email/OTP, 2FA) |
| Database | Supabase PostgreSQL |
| Realtime | Supabase Realtime (PostgreSQL Changes) |
| Hosting | Netlify (Static Export) |
| Email | Resend (via Netlify Function) |
| AI | Claude API (via Netlify proxy) |
| Build | `output: 'export'` (static HTML) |

## 2. Directory Structure

```
app/
  page.tsx              # Landing page
  login/                # Client login (OAuth, Email, OTP)
  register/             # Client registration
  auth/callback/        # OAuth callback + ensureProfile()
  dashboard/            # Client portal
  admin/                # Admin portal (15 modules)
  staff/                # Staff portal
  agent/                # Agent portal
  investor/             # Investor portal
  contact/              # 5 public forms (contact, careers, refer, startup-apply, grievance)
  fund/                 # Fund information pages
  blog/                 # Blog articles
  about/, education/, portfolio/, tools/, etc.

components/
  dashboard/DashboardClient.tsx    # Client dashboard (2200+ lines)
  investor/InvestorClient.tsx       # Investor portal
  agent/AgentClient.tsx            # Agent portal
  admin/AdminClient.tsx            # Admin portal shell
  staff/StaffClient.tsx            # Staff portal shell
  chat/ChatWidget.tsx              # Live chat widget
  VideoCallWidget.tsx              # Video call UI
  DirectCallWidget.tsx             # Direct call UI
  Navbar.tsx, Footer.tsx, Logo.tsx

lib/supabase/
  client.ts                        # Supabase client + isSupabaseConfigured()
  clientAuthService.ts             # Client auth (OAuth, email, OTP)
  adminAuthService.ts              # Admin auth (2FA, role mapping)
  staffAuthService.ts              # Staff auth (employee code)
  dashboardDataService.ts          # Client data queries
  dashboardDataHooks.ts            # React hooks for client data
  adminDataService.ts              # Admin data queries
  adminDataHooks.ts                # React hooks for admin data
  staffDataService.ts              # Staff data queries
  staffDataHooks.ts                # React hooks for staff data
  chatService.ts                   # Chat session management
  realtimeSubscriptions.ts         # Supabase Realtime subscriptions
  storageService.ts                # File upload/download
  reportsDataService.ts            # Form submission + lead creation

netlify/functions/
  lead-notification.ts             # Resend email on form submission
  claude-proxy.ts                  # Claude API proxy
  monday-proxy.ts                  # Monday.com integration
```

## 3. Supabase Tables (49 total)

### Core Identity
- `profiles` — User profiles (role, full_name, avatar, phone, city)
- `roles` — Role definitions
- `staff_profiles` — Staff metadata (department, designation, employee_id)
- `clients` — Client metadata (assigned_rm, kyc_status, risk_profile, bank details)
- `client_assignments` — RM-to-client assignments

### Leads & Forms
- `leads` — Website form submissions (source, status, assigned_to)
- `lead_source_tracking` — UTM attribution data
- `lead_folder_mappings` — Auto-created document folders
- `lead_activities` — Lead timeline events
- `staff_lead_notifications` — Assignment alerts
- `contact_submissions` — Raw form data backup
- `newsletter_subscribers` — Email subscriptions

### Communication
- `chat_sessions` — Live chat sessions (visitor → staff)
- `chat_messages` — Individual messages per session
- `messages` — Internal messaging system
- `rm_requests` — Client RM callback/chat/video requests
- `tickets` — Support tickets
- `emails`, `calls`, `sms_messages` — Communication logs

### Business & Finance
- `investments`, `nav_history`, `transactions` — Client portfolio data
- `campaigns`, `subscriptions`, `revenue_streams` — Business data
- `expenses`, `payroll`, `forecasts`, `kpis` — Financial tracking

### Documents
- `documents`, `file_records`, `folders` — Document management
- `file_permissions`, `file_shares` — Access control
- `document_versions`, `document_audit_log` — Versioning

### System
- `audit_logs` — Activity trail
- `notifications` — In-app notifications
- `website_analytics` — Page tracking
- `api_tokens` — API key management

## 4. Authentication Setup

| Portal | Method | Service File | Guard |
|--------|--------|-------------|-------|
| Client | Google OAuth, Email/Pass, OTP | clientAuthService.ts | useClientAuth() hook |
| Admin | Email/Pass + 2FA code | adminAuthService.ts | useAdminAuth() hook |
| Staff | Email/Pass + Employee Code | staffAuthService.ts | useStaffAuth() hook |

- OAuth callback: `/auth/callback/` → `ensureProfile()` creates profiles + clients rows
- Session: 8-hour expiry for clients
- Route guards: Client-side shell components (no middleware.ts)

## 5. Forms on Main Website

| # | Form | Path | DB Tables |
|---|------|------|-----------|
| 1 | Contact/Consultation | /contact | contact_submissions + leads |
| 2 | Career Application | /contact/careers | contact_submissions + leads |
| 3 | Refer an Investor | /contact/refer | contact_submissions + leads |
| 4 | Startup Application | /contact/startup-apply | contact_submissions + leads |
| 5 | Grievance Redressal | /contact/grievance | contact_submissions + leads |

All forms use `submitContactForm()` + `submitLead()` from `reportsDataService.ts`.
Post-submission: Netlify function `lead-notification.ts` sends Resend emails.

## 6. API Endpoints / Serverless Functions

| Function | Purpose | Trigger |
|----------|---------|---------|
| lead-notification.ts | Send email via Resend | POST from form submission |
| claude-proxy.ts | Claude API for AI features | POST from chat/AI widgets |
| monday-proxy.ts | Monday.com CRM sync | POST |

## 7. Realtime Subscriptions

File: `lib/supabase/realtimeSubscriptions.ts`

- `onNewChatSession()` — New chat sessions (INSERT)
- `onMyChatSessionUpdate(repId)` — Rep's sessions updated
- `onChatMessage(sessionId)` — Messages in a session
- `onAnyChatMessage()` — All new messages (admin)
- `onRMRequest(rmId)` — RM's client requests
- `onAllRMRequests()` — Admin oversight
- `onChatSessionStatusChange()` — Status monitor

## 8. Email Setup

- **Service:** Resend (API key in env vars)
- **From:** noreply@ghlindiaventures.com
- **Recipients:** ghlindiaventures@gmail.com, leads@ghlindiaventures.com, aby777333@gmail.com
- **Templates:** Team notification (HTML), Client confirmation (HTML)
- **DNS:** Requires SPF, DKIM, DMARC records at domain registrar

## 9. Mock/Placeholder Data Status

| File | Status |
|------|--------|
| lib/admin/adminMockData.ts | NOT imported — orphaned, safe to delete |
| lib/staff/staffMockData.ts | NOT imported — orphaned, safe to delete |
| lib/admin/fileRepositoryData.ts | Used for folder structure reference |
| components/dashboard/DashboardClient.tsx | CLEANED — all mock data removed |
| components/investor/InvestorClient.tsx | CLEANED — wired to Supabase |
| components/agent/AgentClient.tsx | CLEANED — shows empty states |

## 10. Known Issues & Gaps

1. **No lead auto-assignment** — leads created as 'new', require manual assignment
2. **No browser notification API** — staff portal doesn't request permission
3. **No notification sound files** — uses embedded base64 WAV only
4. **Video call is simulated** — no WebRTC/Twilio backend
5. **Direct call = tel: links** — no click-to-call backend
6. **Logo sizing** — could be 30-40% larger
7. **Test credentials** — need to be created in Supabase Auth
8. **DNS records** — not yet configured for Resend domain verification
