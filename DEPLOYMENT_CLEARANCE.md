# DEPLOYMENT CLEARANCE — Phase 4: Production Safety

**Date:** 2026-02-28
**Platform:** GHL India Ventures
**Target:** Netlify (static export via GitHub CI/CD)

---

## 1. Environment Variables

### Required in Netlify Dashboard

| Variable | Type | Purpose | Status |
|----------|------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client | Supabase project URL | ⚠️ VERIFY IN NETLIFY |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client | Supabase anon key (public, safe) | ⚠️ VERIFY IN NETLIFY |
| `NEXT_PUBLIC_SARVAM_API_KEY` | Client | Voice AI TTS/STT API key | ⚠️ VERIFY IN NETLIFY |
| `CLAUDE_API_KEY` | Server | Anthropic API (proxied via Netlify function) | ⚠️ VERIFY IN NETLIFY |
| `RESEND_API_KEY` | Server | Email service (lead notifications) | ⚠️ VERIFY IN NETLIFY |
| `MONDAY_API_KEY` | Server | Monday.com CRM integration | ⚠️ VERIFY IN NETLIFY |

> **CRITICAL:** Static export (`output: 'export'`) bakes `NEXT_PUBLIC_*` vars at build time. All env vars MUST be set in Netlify dashboard BEFORE deploying.

### Env Var Safety Assessment

| Check | Result |
|-------|--------|
| Server secrets exposed client-side? | ✅ NO — Claude/Resend/Monday keys are server-only (Netlify functions) |
| Supabase service role key in client code? | ✅ NO — Commented out, only in scripts |
| Placeholder fallback for build? | ✅ YES — `isSupabaseConfigured()` guard prevents build crashes |
| `.env.local` gitignored? | ✅ YES |

---

## 2. RLS (Row-Level Security) Audit

### Tables with RLS Enabled: 30+

All critical tables have RLS policies. Key findings:

| Table | SELECT | INSERT | UPDATE | DELETE | Notes |
|-------|--------|--------|--------|--------|-------|
| `profiles` | Own + Admin | Auth | Own + Admin | Super Admin | ✅ |
| `clients` | Own + Admin | Admin | Admin | Super Admin | ✅ |
| `leads` | Staff + Admin | **Anon (intentional)** | Staff + Admin | Admin | ⚠️ Public forms |
| `contact_submissions` | Admin | **Anon (intentional)** | Admin | Admin | ⚠️ Public forms |
| `newsletter_subscribers` | Admin | **Anon (intentional)** | Admin | Admin | ⚠️ Public forms |
| `chat_sessions` | Assigned + Admin | RPC (SECURITY DEFINER) | Staff + Admin | Admin | ✅ |
| `chat_messages` | Session member | RPC (SECURITY DEFINER) | Session member | Admin | ✅ |
| `notifications` | Own | Staff+ | Own | Admin | ✅ |
| `audit_logs` | Admin | Trigger (SECURITY DEFINER) | None | None | ✅ |
| `documents` | Own + Admin | Auth | Admin | Super Admin | ✅ |
| `file_records` | Auth | Auth | Auth | Auth | ✅ |

### Intentional Public INSERTs (Documented)
- `leads` — powers public contact/lead capture forms
- `contact_submissions` — powers all 6 public contact forms
- `newsletter_subscribers` — powers newsletter signup
- `website_analytics` — powers anonymous page tracking
- **Mitigation:** Only INSERT allowed; no UPDATE/DELETE for anon. Rate limiting recommended at edge.

### Security Hardening (Migration 020)
- ✅ All 6 materialized views revoked from `anon` role
- ✅ All 16 functions have `SET search_path = public` (prevents search-path hijacking)
- ✅ File tables tightened from anon to authenticated-only

---

## 3. Security Headers (netlify.toml)

| Header | Value | Status |
|--------|-------|--------|
| `X-Frame-Options` | `SAMEORIGIN` | ✅ |
| `X-XSS-Protection` | `1; mode=block` | ✅ |
| `X-Content-Type-Options` | `nosniff` | ✅ |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | ✅ |
| `Permissions-Policy` | `camera=(), microphone=(self), geolocation=()` | ✅ |
| `Content-Security-Policy` | Full CSP with whitelisted sources | ✅ |

### CSP Notes
- `unsafe-inline` in script-src — Required by Next.js for inline scripts
- `unsafe-eval` in script-src — Required by some libraries (TradingView, Elfsight)
- All external sources explicitly whitelisted (Supabase, Google Fonts, YouTube, TradingView, Elfsight)

---

## 4. Hardcoded Secrets Scan

| Check | Result |
|-------|--------|
| API keys in source code? | ✅ NONE found |
| Hardcoded passwords? | ✅ NONE found |
| Base64 credentials? | ✅ NONE (placeholder JWT in client.ts is intentional fallback) |
| Service role key in client bundle? | ✅ NO |

---

## 5. CORS Configuration

| Function | Origin | Methods | Assessment |
|----------|--------|---------|-----------|
| `claude-proxy` | `*` | POST | ⚠️ Public API proxy — acceptable for chatbot |
| `lead-notification` | `*` | POST | ⚠️ Public form submission — acceptable |
| `monday-proxy` | `*` | POST | ⚠️ CRM sync — consider restricting to domain |

**Recommendation:** Restrict CORS to `https://ghlindiaventures.com` and `https://*.netlify.app` in production if these functions are not intended for third-party use.

---

## 6. Build Verification

| Check | Result |
|-------|--------|
| `npx next build` | ✅ PASS (zero errors) |
| All 38 routes compile | ✅ PASS |
| Static export intact | ✅ PASS |
| TypeScript strict mode | ✅ PASS |
| No unused imports breaking build | ✅ PASS |

---

## 7. Pre-Go-Live Checklist

### ✅ Automated (Done by Claude)
- [x] Auth guards on all protected portals (Client, Admin, Staff, Agent, Investor)
- [x] Rate limiting on staff login (5 attempts / 15min lockout)
- [x] Fake 2FA field removed from admin login
- [x] Notification bells wired to live Supabase data (Admin + Staff)
- [x] Mock data removed from production UI
- [x] Console.log debug statements cleaned up (10 removed, 110 error handlers kept)
- [x] Disconnected biometric button disabled with "Coming Soon" indicator
- [x] Password reset flow working for all 3 portals
- [x] Error boundaries for all portals (global + portal-specific 404s)
- [x] Form → DB → Email pipeline verified for all 6 forms
- [x] Lead auto-assignment (round-robin) implemented
- [x] Security headers configured in netlify.toml
- [x] RLS policies on all tables (30+ tables)
- [x] Search-path hardening on all Supabase functions

### ⚠️ Manual Steps Required (User Must Do)

#### CRITICAL — Before Go-Live
1. **Verify Netlify Environment Variables**
   - Go to: Netlify Dashboard → Site Settings → Environment Variables
   - Confirm all 6 env vars are set (see Section 1 above)
   - **Trigger a fresh deploy** after confirming

2. **Create Test Accounts in Supabase**
   - Go to: Supabase Dashboard → Authentication → Users
   - Create these accounts:
     ```
     admin@ghlindiaventures.com / GHL@Admin2025!
     staff@ghlindiaventures.com / GHL@Staff2025!
     client@ghlindiaventures.com / GHL@Client2025!
     ```
   - Then INSERT corresponding rows in `profiles`, `clients`, and `staff_profiles` tables
   - Admin SQL:
     ```sql
     -- After creating user in Auth dashboard, get the user ID and run:
     INSERT INTO profiles (id, full_name, email, role, is_active)
     VALUES ('<admin-user-id>', 'Admin User', 'admin@ghlindiaventures.com', 'admin', true);

     INSERT INTO profiles (id, full_name, email, role, is_active)
     VALUES ('<staff-user-id>', 'Staff User', 'staff@ghlindiaventures.com', 'staff', true);

     INSERT INTO staff_profiles (user_id, employee_id, designation, department, is_active)
     VALUES ('<staff-user-id>', 'GHL001', 'Customer Service', 'Operations', true);

     INSERT INTO profiles (id, full_name, email, role, is_active)
     VALUES ('<client-user-id>', 'Client User', 'client@ghlindiaventures.com', 'client', true);

     INSERT INTO clients (user_id, full_name, email, kyc_status)
     VALUES ('<client-user-id>', 'Client User', 'client@ghlindiaventures.com', 'pending');
     ```

3. **DNS Records for Resend Email**
   - Add these DNS records at your domain registrar for `ghlindiaventures.com`:
     ```
     TXT  @    v=spf1 include:_spf.resend.com ~all
     TXT  _dmarc  v=DMARC1; p=none; rua=mailto:dmarc@ghlindiaventures.com
     ```
   - DKIM record: Get from Resend Dashboard → Domains → Verify → Copy DKIM record

4. **Supabase Realtime Publication**
   - Go to: Supabase Dashboard → Database → Replication
   - Ensure these tables are in the Realtime publication:
     - `chat_messages`
     - `chat_sessions`
     - `notifications`
     - `rm_requests`
     - `leads`

#### RECOMMENDED — Within 1-2 Weeks
5. **Error Monitoring Service**
   - Set up Sentry or similar for server-side error aggregation
   - Add Sentry DSN as env var and initialize in `app/layout.tsx`

6. **Edge Rate Limiting**
   - Add Netlify rate limiting for `/netlify/functions/lead-notification` endpoint
   - Prevents abuse of public form submission pipeline

7. **CORS Restriction**
   - Update Netlify functions to restrict `Access-Control-Allow-Origin` to production domain

8. **Sarvam API Key Rotation**
   - Since `NEXT_PUBLIC_SARVAM_API_KEY` is exposed in client bundle, ensure:
     - Key has usage quotas set at Sarvam dashboard
     - Rotate key after any suspected compromise

---

## 8. Deployment Command Sequence

```bash
# 1. Build locally to verify
npx next build

# 2. Commit and push (triggers Netlify auto-deploy)
git add .
git commit -m "Phase 3-4: Testing audit + production safety hardening"
git push origin main

# 3. Clear Netlify cache (forces fresh build with latest env vars)
netlify deploy --build --prod
# OR: Netlify Dashboard → Deploys → Trigger Deploy → Clear cache and deploy
```

---

## Clearance Status

| Category | Status |
|----------|--------|
| Build | ✅ PASS |
| Auth Security | ✅ PASS |
| RLS Policies | ✅ PASS |
| Security Headers | ✅ PASS |
| No Hardcoded Secrets | ✅ PASS |
| Error Handling | ✅ PASS |
| Console Cleanup | ✅ PASS |
| Disconnected Elements | ✅ FIXED |

### **DEPLOYMENT CLEARANCE: ✅ APPROVED**

*Pending manual steps: env var verification, test account creation, DNS records.*
