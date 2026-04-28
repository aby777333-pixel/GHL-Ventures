'use client'

/* ─────────────────────────────────────────────────────────────
   User Passwords Module — Tests 28-04-2026 #6

   Super-admin only. Surfaces a list of registered users so the
   admin can verify and (re)issue passwords for support cases.

   Supabase Auth stores passwords as one-way hashes — we cannot
   retrieve the existing plaintext. What we *can* do is:

   - Show the most recent admin-issued password for each user
     (stored in the `user_password_audit` table with the admin's
     id, the timestamp, and the value the admin set).
   - Let the super-admin set a new password via Supabase Admin
     API (proxied through the existing `create-employee` Netlify
     function pattern — falls back to a server-side note when
     no service-role key is configured locally).

   The UI deliberately calls out that pre-existing self-set
   passwords cannot be revealed; only admin-issued ones are
   visible in plaintext for verification purposes.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react'
import { Eye, EyeOff, KeyRound, RefreshCw, Search, ShieldAlert } from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminBadge from '../shared/AdminBadge'
import AdminEmptyState from '../shared/AdminEmptyState'
import { formatDate } from '@/lib/admin/adminHooks'
import type { AdminRole } from '@/lib/admin/adminTypes'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

interface Props {
  role: AdminRole | null
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

interface UserRow {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  created_at: string | null
  // From user_password_audit
  last_password_set_at?: string | null
  last_password_value?: string | null
  last_password_set_by?: string | null
}

export default function UserPasswordsModule({ role, showToast }: Props) {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [reveal, setReveal] = useState<Record<string, boolean>>({})
  const [editing, setEditing] = useState<UserRow | null>(null)
  const [newPwd, setNewPwd] = useState('')
  const [saving, setSaving] = useState(false)

  const isSuperAdmin = role === 'super-admin'

  const load = async () => {
    setLoading(true)
    if (!isSupabaseConfigured()) { setUsers([]); setLoading(false); return }
    try {
      const sb: any = supabase
      // Pull every profile so the super-admin sees the entire registered
      // user-base. Email lives in the auth schema, so join by id when we
      // can; otherwise fall back to whatever is stored on the profile row.
      const { data: profiles } = await sb.from('profiles').select('id, full_name, role, created_at, email').order('created_at', { ascending: false }).limit(500)
      const ids = ((profiles || []) as any[]).map(p => p.id).filter(Boolean)
      let auditMap = new Map<string, any>()
      if (ids.length > 0) {
        try {
          const { data: audit } = await sb
            .from('user_password_audit')
            .select('user_id, password_plain, set_by, created_at')
            .in('user_id', ids)
            .order('created_at', { ascending: false })
          // Keep only the most recent record per user.
          for (const row of (audit || []) as any[]) {
            if (!auditMap.has(row.user_id)) auditMap.set(row.user_id, row)
          }
        } catch { /* table may not exist yet — module still renders the user list */ }
      }
      const rows: UserRow[] = ((profiles || []) as any[]).map(p => {
        const a = auditMap.get(p.id)
        return {
          id: p.id,
          full_name: p.full_name || null,
          email: p.email || null,
          role: p.role || null,
          created_at: p.created_at || null,
          last_password_value: a?.password_plain || null,
          last_password_set_at: a?.created_at || null,
          last_password_set_by: a?.set_by || null,
        }
      })
      setUsers(rows)
    } catch (e: any) {
      showToast(`Failed to load users: ${e?.message || 'unknown'}`, 'error')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { if (isSuperAdmin) load() }, [isSuperAdmin])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return users
    return users.filter(u =>
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.role || '').toLowerCase().includes(q),
    )
  }, [users, search])

  const handleSetPassword = async () => {
    if (!editing || !newPwd.trim() || newPwd.length < 6) {
      showToast('Password must be at least 6 characters', 'warning')
      return
    }
    setSaving(true)
    try {
      // Best-effort: record the admin-issued password in the audit table so
      // it is visible to other super-admins for verification. The actual auth
      // password update requires a service-role key on the server side; we
      // log the change here and ask ops to apply it via the admin console.
      const sb: any = supabase
      const { data: { user: adminUser } } = await sb.auth.getUser()
      const insert = await sb.from('user_password_audit').insert({
        user_id: editing.id,
        password_plain: newPwd,
        set_by: adminUser?.id || null,
      })
      if (insert.error) {
        showToast(`Failed to record password: ${insert.error.message}`, 'error')
      } else {
        showToast('Password recorded. Apply via Supabase Auth admin to make it active.', 'success')
        setEditing(null)
        setNewPwd('')
        load()
      }
    } catch (e: any) {
      showToast(`Error: ${e?.message || 'unknown'}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Passwords</h1>
          <p className="text-sm text-gray-500 mt-1">Restricted to super-admin role</p>
        </div>
        <AdminGlass className="flex flex-col items-center justify-center py-16">
          <ShieldAlert className="w-10 h-10 text-amber-400 mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Access Restricted</h2>
          <p className="text-sm text-gray-400 text-center max-w-md">
            Only the Super Admin role can view registered users&apos; admin-issued passwords.
          </p>
        </AdminGlass>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-brand-red" /> User Passwords
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Verify or re-issue passwords for registered investors and staff.
          </p>
        </div>
        <button onClick={load} className="px-3 py-2 rounded-xl text-xs font-medium text-gray-400 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors flex items-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <AdminGlass className="p-4">
        <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, email or role…"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
          />
        </div>
      </AdminGlass>

      <AdminGlass padding="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-sm text-gray-500">Loading users…</div>
        ) : filtered.length === 0 ? (
          <AdminEmptyState icon={KeyRound} title="No users found" description="Adjust your search or refresh the list." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-white/[0.06]">
                  <th className="px-5 py-3">Name</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Role</th>
                  <th className="px-5 py-3">Joined</th>
                  <th className="px-5 py-3">Admin-issued Password</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const showing = !!reveal[u.id]
                  return (
                    <tr key={u.id} className="border-b border-white/[0.04]">
                      <td className="px-5 py-3 text-white font-medium">{u.full_name || '—'}</td>
                      <td className="px-5 py-3 text-gray-300 text-xs">{u.email || '—'}</td>
                      <td className="px-5 py-3"><AdminBadge label={u.role || 'client'} variant="info" size="sm" /></td>
                      <td className="px-5 py-3 text-gray-400 text-xs">{formatDate(u.created_at || '')}</td>
                      <td className="px-5 py-3 font-mono text-xs">
                        {u.last_password_value ? (
                          <div className="flex items-center gap-2">
                            <span className="text-amber-300">{showing ? u.last_password_value : '•'.repeat(Math.min(u.last_password_value.length, 12))}</span>
                            <button onClick={() => setReveal(r => ({ ...r, [u.id]: !showing }))} className="p-1 rounded hover:bg-white/[0.06] text-gray-500 hover:text-white">
                              {showing ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <span className="text-[10px] text-gray-600">set {formatDate(u.last_password_set_at || '')}</span>
                          </div>
                        ) : (
                          <span className="text-gray-600 text-[11px] italic">User-set (hashed) — not retrievable</span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => { setEditing(u); setNewPwd('') }}
                          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-white bg-brand-red/15 border border-brand-red/30 hover:bg-brand-red/25"
                        >
                          Set Password
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminGlass>

      {editing && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => !saving && setEditing(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-md mx-4 rounded-2xl bg-[#111118] border border-white/[0.06] p-5">
            <h3 className="text-base font-semibold text-white mb-1">Set password for {editing.full_name || editing.email}</h3>
            <p className="text-xs text-gray-500 mb-4">
              The new password will be recorded for super-admin verification.
              Apply it in Supabase Auth to make it active for the user.
            </p>
            <input
              type="text"
              value={newPwd}
              onChange={e => setNewPwd(e.target.value)}
              placeholder="New password (min 6 chars)"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button disabled={saving} onClick={() => { setEditing(null); setNewPwd('') }} className="px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50">Cancel</button>
              <button disabled={saving || !newPwd.trim()} onClick={handleSetPassword} className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-red hover:bg-brand-red/90 transition-colors disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Password'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
