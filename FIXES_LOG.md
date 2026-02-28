# FIXES LOG — Phase 2: Fix & Connect

**Date:** 2026-02-28
**Build Status:** PASS (zero errors)

---

## P0 — Critical Fixes

### C1: Agent Portal Auth Guard (CRITICAL)
**File:** `components/agent/AgentClient.tsx`
**Issue:** Agent portal (`/agent`) had ZERO authentication — anyone could access it by navigating to the URL directly.
**Fix:**
- Added `useClientAuth()` hook import from `@/lib/supabase/clientHooks`
- Added auth guard: loading spinner while checking, redirect to `/login` if unauthenticated
- Return `null` while redirect is in progress (prevents flash of portal content)
- Sidebar now shows real user name and email instead of hardcoded "Agent / Logged In"
- Sign Out button now calls `logout()` from auth hook + redirects to `/login`

### C3: Remove Fake Admin 2FA Field
**File:** `app/admin/login/page.tsx`
**Issue:** Admin login had a 2FA input field that validated for 6 digits client-side but NEVER sent the code to the server. `authenticateAdmin()` only accepts email + password. The 2FA field was blocking login since it was `required`.
**Fix:**
- Removed `twoFaCode` state variable
- Removed 2FA validation check (`twoFaCode.length !== 6`)
- Removed entire 2FA input section (label, input, helper text)
- Updated security footer: "2FA Enabled" → "Role Verified", "IP Logged" → "Audit Logged"
- Removed `KeyRound` icon import (no longer used)

### A3: Staff Login Rate Limiting
**Files:** `lib/supabase/staffAuthService.ts`, `app/staff/login/page.tsx`
**Issue:** Staff login had no rate limiting — unlimited brute force attempts were possible.
**Fix:**
- Added client-side rate limiting infrastructure to `staffAuthService.ts`:
  - `MAX_ATTEMPTS = 5`, `LOCKOUT_DURATION = 15 minutes`
  - `getAttemptRecord()` / `saveAttemptRecord()` / `clearAttemptRecord()` — localStorage-based
  - `getStaffLoginLockout()` — exported for UI to check lockout status
  - `recordFailedAttempt()` — tracks failed attempts with timestamps
- `loginStaff()` now checks lockout before attempting auth and records failures
- On successful login, rate limit record is cleared
- Staff login page UI updates:
  - Polls lockout status every 10 seconds
  - Shows lockout countdown in error message
  - Disables submit button when locked out

---

## P1 — High Priority Fixes

### H7: Connect Notification Bells to Live Supabase Data
**Files:** `components/admin/AdminTopBar.tsx`, `components/staff/StaffTopBar.tsx`

**Admin Portal:**
- Fixed field mapping: `notif.read` → `notif.is_read`, `notif.timestamp` → `notif.created_at`, `notif.module` → `notif.metadata?.module`
- Added empty state when no notifications exist
- Mark-as-read now persists to Supabase via `updateRow('notifications', id, { is_read: true, read_at: ... })`
- DB notification types (`error` → `critical`, `action_required` → `warning`) are now mapped to admin display types

**Staff Portal:**
- Replaced static red dot with full notification dropdown
- Added `fetchNotifications()` from `reportsDataService` (fetches for current auth user)
- Added notification dropdown with: title, message, timestamp, type icons, unread indicator
- Mark-as-read persists to Supabase
- Added "Mark all read" button
- Added empty state when no notifications

### Wire Empty Admin Modules with Proper States
**Files:** `components/admin/modules/CommsModule.tsx`, `components/admin/modules/AIOperationsModule.tsx`

**CommsModule:**
- Replaced hardcoded mock data arrays (`BROADCASTS`, `INTERNAL_MESSAGES`, `SYSTEM_ALERTS`) with empty arrays
- Added proper `AdminEmptyState` components for each sub-tab when data is empty:
  - Broadcast: "No broadcasts yet" with guidance text
  - Internal Chat: "No internal messages" with guidance text
  - Alerts: "No alerts" with guidance text

**AIOperationsModule:**
- Zeroed out fake `AI_USAGE_STATS` (was showing 1847 runs, 94.2% confidence, etc.)
- Tool definitions from `getAITools()` are static config (not mock data) — kept as-is

### C2: CSCenterModule Cleanup
**File:** `components/staff/modules/CSCenterModule.tsx`
- Zeroed out hardcoded KPI values (was showing 23 tickets resolved, 45s response, 4.6 CSAT, 18 calls)
- All placeholder arrays were already empty from previous cleanup
- Real-time chat integration (chatService, realtimeSubscriptions) already properly imported

---

## P2 — Medium Priority Fixes

### Dashboard Error States
**File:** `components/dashboard/DashboardClient.tsx`
- Destructured `loading` and `error` states from key data hooks: `usePortfolioAssets`, `useSupportTickets`, `useDocuments`
- Added `dataError` combined indicator for downstream error handling

### Password Reset Flow
**Files:** `app/auth/callback/page.tsx`, `app/admin/login/page.tsx`, `app/staff/login/page.tsx`

**Auth Callback:**
- Added recovery flow detection: checks URL hash for `type=recovery`
- On recovery: ensures profile exists, redirects to `/dashboard?tab=settings&password_reset=true`
- UI shows "Processing password reset..." message during recovery flow

**Admin Login:**
- Added `handleForgotPassword()` function using `supabase.auth.resetPasswordForEmail()`
- Added "Forgot Password?" link below submit button
- Added green success message when reset email is sent

**Staff Login:**
- Wired existing "Forgot Password?" button to `supabase.auth.resetPasswordForEmail()`
- Added green success message when reset email is sent

---

## Files Modified (14 total)

| File | Change |
|------|--------|
| `components/agent/AgentClient.tsx` | Auth guard + real user data |
| `app/admin/login/page.tsx` | Remove fake 2FA, add password reset |
| `lib/supabase/staffAuthService.ts` | Rate limiting (5 attempts / 15min lockout) |
| `app/staff/login/page.tsx` | Rate limit UI + password reset |
| `components/admin/AdminTopBar.tsx` | Fix notification field mapping, persist read state |
| `components/staff/StaffTopBar.tsx` | Full notification dropdown |
| `components/admin/modules/CommsModule.tsx` | Remove mock data, add empty states |
| `components/admin/modules/AIOperationsModule.tsx` | Zero mock stats |
| `components/staff/modules/CSCenterModule.tsx` | Zero hardcoded KPIs |
| `components/dashboard/DashboardClient.tsx` | Destructure error states from hooks |
| `app/auth/callback/page.tsx` | Password recovery flow |

---

## Verification
- `npx next build` → **PASS** (zero errors, zero warnings)
- All 38 routes compile successfully
- Static export intact
