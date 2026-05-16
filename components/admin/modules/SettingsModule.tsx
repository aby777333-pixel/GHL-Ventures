'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Settings, Shield, Users, Key, Database, Bell, Globe,
  Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, Clock,
  Server, HardDrive, Wifi, RefreshCw, Download, Upload,
  Palette, Monitor, Mail, Smartphone, Copy, Trash2,
  Plus, Save, ToggleLeft, ToggleRight, ChevronRight,
  Plug, Link2, Unlink, ArrowRightLeft, Loader2,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminBadge from '../shared/AdminBadge'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import AdminCRUDPlaceholder from '../shared/AdminCRUDPlaceholder'
import { fetchEmployees, getSystemHealth, fetchActivityFeed, fetchAdminUsers, createAdminUser, updateAdminUserRole, updateAdminUserPermissions, deleteAdminUser, fetchPermissionAuditLog, fetchCustomRoles, createCustomRole, updateCustomRole, deleteCustomRole, type AdminUserRow, type PermissionAuditRow, type AdminRoleRow } from '@/lib/supabase/adminDataService'
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'
import { ROLE_PERMISSIONS } from '@/lib/admin/adminRBAC'
import { ROLE_LABELS } from '@/lib/admin/adminAuth'
import { formatDate, useAdminAuth } from '@/lib/admin/adminHooks'
import type { AdminRole } from '@/lib/admin/adminTypes'
import { saveBlobAs } from '@/lib/supabase/storageService'
import AdminModal, { ModalButton } from '../shared/AdminModal'

// ── Sub-tabs ─────────────────────────────────────────────────────
// 2026-05-12: Super-Admin menu spec adds Settings → Role (role
// management). Permissions, Roles, and the User Passwords screen are
// kept distinct so the spec's three Setting sub-items map 1:1.
const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'system', label: 'System', icon: Server },
  // Testing Report 2 (2026-04-25 #9): super-admin-only "Password Vault"
  // sub-tab. The button is hidden for non-super-admins below, but the
  // entry must exist in the list so navigate() can resolve the URL.
  { id: 'password-vault', label: 'Password Vault', icon: Key },
] as const

type SettingsTab = typeof SETTINGS_TABS[number]['id']

interface SettingsModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function SettingsModule({ subTab, navigate, showToast }: SettingsModuleProps) {
  const activeTab = (SETTINGS_TABS.some(t => t.id === subTab) ? subTab : 'general') as SettingsTab
  // Hide the Password Vault sub-tab from non-super-admins. We still
  // resolve activeTab against the master list so URLs route correctly,
  // but the panel itself refuses to render for the wrong role.
  const { role } = useAdminAuth()
  const isSuperAdmin = role === 'super-admin'
  const visibleTabs = SETTINGS_TABS.filter(t => t.id !== 'password-vault' || isSuperAdmin)

  const [employees, setEmployees] = useState<any[]>([])
  const [systemHealth, setSystemHealth] = useState<any>({ uptime: 0, responseTime: 0, errorRate: 0, apiCalls24h: 0, storageUsed: 0, storageTotal: 100 })

  useEffect(() => {
    fetchEmployees().then(data => setEmployees(data))
  }, [])

  const handleTabClick = (tabId: string) => {
    navigate(tabId === 'general' ? 'settings' : `settings/${tabId}`)
  }

  return (
    <div className="space-y-6 admin-section-enter">
      <div>
        <h1 className="text-2xl font-bold text-white">System Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configuration, permissions, security, and system management</p>
      </div>

      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {visibleTabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                isActive ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="admin-tab-switch">
        {activeTab === 'general' && <GeneralTab showToast={showToast} />}
        {activeTab === 'permissions' && <PermissionsTab showToast={showToast} />}
        {activeTab === 'roles' && <RolesTab showToast={showToast} />}
        {activeTab === 'security' && <SecurityTab showToast={showToast} />}
        {activeTab === 'integrations' && <IntegrationsTab showToast={showToast} />}
        {activeTab === 'system' && <SystemTab showToast={showToast} systemHealth={systemHealth} />}
        {activeTab === 'password-vault' && (
          isSuperAdmin
            ? <PasswordVaultTab showToast={showToast} />
            : <AdminEmptyState
                icon={Lock}
                title="Restricted area"
                description="Password Vault is only available to Super Admin accounts."
              />
        )}
      </div>
    </div>
  )
}

// ── General Settings ────────────────────────────────────────────
const SETTINGS_KEY_MAP: Record<string, { dbKey: string; category: string; label: string }> = {
  companyName:         { dbKey: 'company_name',        category: 'general',      label: 'Company Name' },
  email:               { dbKey: 'admin_email',         category: 'general',      label: 'Admin Email' },
  phone:               { dbKey: 'contact_phone',       category: 'general',      label: 'Phone' },
  sebiReg:             { dbKey: 'sebi_registration',   category: 'compliance',   label: 'SEBI Registration' },
  timezone:            { dbKey: 'timezone',            category: 'general',      label: 'Timezone' },
  currency:            { dbKey: 'currency',            category: 'general',      label: 'Currency' },
  fiscalYear:          { dbKey: 'fiscal_year',         category: 'general',      label: 'Fiscal Year' },
  darkMode:            { dbKey: 'dark_mode',           category: 'preferences',  label: 'Dark Mode' },
  emailNotifications:  { dbKey: 'email_notifications', category: 'preferences',  label: 'Email Notifications' },
  smsAlerts:           { dbKey: 'sms_alerts',          category: 'preferences',  label: 'SMS Alerts' },
  autoBackup:          { dbKey: 'auto_backup',         category: 'preferences',  label: 'Auto Backup' },
  twoFactorAuth:       { dbKey: 'two_factor_auth',     category: 'security',     label: 'Two-Factor Auth' },
  sessionTimeout:      { dbKey: 'session_timeout',     category: 'security',     label: 'Session Timeout' },
  auditLogging:        { dbKey: 'audit_logging',       category: 'security',     label: 'Audit Logging' },
}

function GeneralTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [settings, setSettings] = useState({
    companyName: 'GHL India Ventures Pvt. Ltd.',
    email: 'admin@ghlindiaventures.com',
    phone: '+91 7200 255 252',
    sebiReg: 'IN/AIF2/24-25/1517',
    timezone: 'Asia/Kolkata (IST)',
    currency: 'INR (₹)',
    fiscalYear: 'April — March',
    darkMode: true,
    emailNotifications: true,
    smsAlerts: true,
    autoBackup: true,
    twoFactorAuth: true,
    sessionTimeout: '8 hours',
    auditLogging: true,
  })
  const [saving, setSaving] = useState(false)

  // Load persisted values from site_settings — falls back to the defaults above
  // for any keys that haven't been saved yet.
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const dbKeys = Object.values(SETTINGS_KEY_MAP).map(s => s.dbKey)
    ;(async () => {
      try {
        const sb = supabase as any
        const { data } = await sb.from('site_settings').select('key, value').in('key', dbKeys)
        if (!Array.isArray(data)) return
        const byDbKey = Object.fromEntries(data.map((r: any) => [r.key, r.value]))
        setSettings(prev => {
          const next = { ...prev }
          for (const [stateKey, meta] of Object.entries(SETTINGS_KEY_MAP)) {
            const stored = byDbKey[meta.dbKey]
            if (stored === undefined) continue
            const current = (prev as any)[stateKey]
            if (typeof current === 'boolean') (next as any)[stateKey] = stored === true || stored === 'true'
            else (next as any)[stateKey] = String(stored)
          }
          return next
        })
      } catch { /* non-blocking */ }
    })()
  }, [])

  const persistOne = async (stateKey: keyof typeof settings, value: unknown) => {
    if (!isSupabaseConfigured()) return false
    const meta = SETTINGS_KEY_MAP[stateKey as string]
    if (!meta) return false
    try {
      const sb = supabase as any
      const { data: { user } } = await sb.auth.getUser()
      const { error } = await sb.from('site_settings').upsert({
        key: meta.dbKey,
        value: typeof value === 'boolean' ? value : String(value),
        category: meta.category,
        label: meta.label,
        updated_by: user?.id || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' })
      return !error
    } catch { return false }
  }

  const saveAll = async () => {
    if (!isSupabaseConfigured()) { showToast('Database is not configured', 'error'); return }
    setSaving(true)
    try {
      const results = await Promise.all(
        (Object.keys(settings) as (keyof typeof settings)[]).map(k => persistOne(k, settings[k]))
      )
      const failed = results.filter(r => !r).length
      if (failed === 0) showToast('Settings saved', 'success')
      else showToast(`Saved with ${failed} failure(s) — check admin role`, 'warning')
    } finally {
      setSaving(false)
    }
  }

  const toggleSetting = async (key: keyof typeof settings) => {
    const next = !settings[key]
    setSettings(prev => ({ ...prev, [key]: next }))
    const ok = await persistOne(key, next)
    showToast(ok ? 'Setting updated' : 'Failed to save setting', ok ? 'success' : 'error')
  }

  return (
    <div className="space-y-4">
      {/* Company Info */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-brand-red" />
          Company Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {([
            { key: 'companyName' as const, label: 'Company Name', icon: Globe },
            { key: 'email' as const,       label: 'Admin Email',  icon: Mail },
            { key: 'phone' as const,       label: 'Phone',        icon: Smartphone },
            { key: 'sebiReg' as const,     label: 'SEBI Registration', icon: Shield },
            { key: 'timezone' as const,    label: 'Timezone',     icon: Clock },
            { key: 'currency' as const,    label: 'Currency',     icon: Key },
            { key: 'fiscalYear' as const,  label: 'Fiscal Year',  icon: Clock },
          ]).map(field => {
            const Icon = field.icon
            return (
              <div key={field.label} className="space-y-1.5">
                <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">{field.label}</label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <input
                    type="text"
                    value={settings[field.key] as string}
                    onChange={(e) => setSettings(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="flex-1 bg-transparent outline-none text-sm text-gray-200 placeholder:text-gray-600"
                  />
                </div>
              </div>
            )
          })}
        </div>
        <button
          onClick={saveAll}
          disabled={saving}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors admin-btn-press disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </AdminGlass>

      {/* Toggle Settings */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-brand-red" />
          Preferences
        </h3>
        <div className="space-y-1">
          {[
            { key: 'darkMode' as const, label: 'Dark Mode', desc: 'Use dark theme for admin dashboard', icon: Palette },
            { key: 'emailNotifications' as const, label: 'Email Notifications', desc: 'Receive email alerts for important events', icon: Mail },
            { key: 'smsAlerts' as const, label: 'SMS Alerts', desc: 'Receive SMS for critical compliance alerts', icon: Smartphone },
            { key: 'autoBackup' as const, label: 'Auto Backup', desc: 'Automatic daily backups at 2:00 AM IST', icon: Database },
            { key: 'twoFactorAuth' as const, label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin logins', icon: Lock },
            { key: 'auditLogging' as const, label: 'Audit Logging', desc: 'Log all admin actions for compliance', icon: Eye },
          ].map(item => {
            const Icon = item.icon
            const isOn = settings[item.key]
            return (
              <div key={item.key} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-sm text-white">{item.label}</p>
                    <p className="text-[11px] text-gray-500">{item.desc}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting(item.key)}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${isOn ? 'bg-brand-red' : 'bg-white/[0.1]'}`}
                >
                  <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${isOn ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            )
          })}
        </div>
      </AdminGlass>
    </div>
  )
}

// ── Permissions Matrix ──────────────────────────────────────────
type Toast = (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void

// Maps DB role values (snake_case) to UI role keys (kebab-case).
const ROLE_DB_TO_UI: Record<string, AdminRole> = {
  super_admin: 'super-admin',
  admin: 'admin',
  compliance_officer: 'compliance-officer',
  fund_manager: 'fund-manager',
  manager: 'manager',
  marketing_manager: 'marketing-manager',
  sales: 'sales',
  marketing_executive: 'marketing-executive',
  operations: 'operations',
  hr: 'hr',
  viewer: 'viewer',
}
const ROLE_UI_TO_DB: Record<string, string> = Object.fromEntries(
  Object.entries(ROLE_DB_TO_UI).map(([db, ui]) => [ui, db])
)

function PermissionsTab({ showToast }: { showToast: Toast }) {
  const [permView, setPermView] = useState<'roles' | 'users' | 'matrix' | 'audit' | 'presets'>('roles')
  const roles = Object.keys(ROLE_LABELS) as AdminRole[]
  const allModules = ['overview', 'clients', 'sales', 'realty-brokers', 'employees', 'assets', 'ai-ops', 'compliance', 'financial', 'analytics', 'comms', 'marketing', 'reports', 'settings']
  const allActions = ['view', 'create', 'edit', 'approve', 'delete', 'export', 'configure']
  const [expandedRole, setExpandedRole] = useState<AdminRole | null>(null)

  // ADMIN COMMAND CENTER 2026-05-15: live user list + audit log + Add User flow.
  const [adminUsers, setAdminUsers] = useState<AdminUserRow[]>([])
  const [auditRows, setAuditRows] = useState<PermissionAuditRow[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [editingRoleFor, setEditingRoleFor] = useState<AdminUserRow | null>(null)
  const [savingRole, setSavingRole] = useState(false)
  const [newRole, setNewRole] = useState<string>('admin')
  // 2026-05-15: per-user permission overrides (Super Admin grants module
  // access to a specific user beyond their role).
  const [editingPermsFor, setEditingPermsFor] = useState<AdminUserRow | null>(null)
  const [permsDraft, setPermsDraft] = useState<string[]>([])
  const [savingPerms, setSavingPerms] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    email: '', full_name: '', phone: '', role: 'admin', department: '', password: '',
  })
  // 2026-05-16: track caller's own user id so the Delete button on the admin
  // user list can hide for self (the RPC would happily nuke the current
  // session otherwise and lock the admin out mid-action).
  const [meId, setMeId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoadingData(true)
    const [users, audit] = await Promise.all([fetchAdminUsers(), fetchPermissionAuditLog()])
    setAdminUsers(users)
    setAuditRows(audit)
    setLoadingData(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  // Capture caller's user id once on mount so Delete-User can skip self.
  useEffect(() => {
    (async () => {
      try {
        const sb = supabase as any
        const { data: { user } } = await sb.auth.getUser()
        setMeId(user?.id || null)
      } catch { /* ignore */ }
    })()
  }, [])

  const userAssignments = useMemo(() => adminUsers.map(u => ({
    email: u.email,
    name: u.full_name || u.email,
    role: (ROLE_DB_TO_UI[u.role] || 'viewer') as AdminRole,
    dept: u.department || '—',
    lastActive: u.last_login_at || u.created_at,
    id: u.id,
  })), [adminUsers])

  const permAuditLog = useMemo(() => auditRows.map(r => {
    const a = r.action
    const friendly =
      a === 'create_admin_user' ? 'Created' :
      a === 'update_admin_role' ? 'Role Changed' :
      a === 'delete_admin_user' ? 'Revoked' :
      a === 'trash_client' ? 'Auto-Revoked' :
      a === 'restore_client' ? 'Granted' :
      'Permission Change'
    return {
      id: r.id,
      timestamp: r.created_at,
      user: r.actor_name || 'System',
      action: friendly,
      target: r.target ? String(r.target).slice(0, 8) + '…' : '—',
      detail: r.details ? JSON.stringify(r.details).slice(0, 120) : '',
      module: r.module || '—',
    }
  }), [auditRows])

  // 2026-05-15: Permission Presets — bundled permission tokens admins can
  // apply to a specific user (writes to profiles.permission_overrides) for
  // quick onboarding. Defaults are seeded statically; admins can add custom
  // presets which persist in localStorage so multiple users in the same
  // browser see them. Persisted in DB is out of scope for this pass.
  interface PermissionPreset { id: string; name: string; description: string; permissions: string[] }
  const DEFAULT_PRESETS: PermissionPreset[] = [
    { id: 'p-readonly', name: 'Read-Only Auditor', description: 'View-only access across every module — useful for auditors and observers.', permissions: ['view:overview', 'view:clients', 'view:sales', 'view:realty-brokers', 'view:employees', 'view:assets', 'view:compliance', 'view:financial', 'view:analytics', 'view:comms', 'view:marketing', 'view:reports'] },
    { id: 'p-approver', name: 'Compliance Approver', description: 'Approve KYC + compliance flags; read across finance and clients.', permissions: ['view:overview', 'view:clients', 'approve:clients', 'view:compliance', 'edit:compliance', 'approve:compliance', 'export:compliance', 'view:financial', 'view:reports', 'export:reports'] },
    { id: 'p-reports', name: 'Reports Only', description: 'Pull and export reports without touching the rest of the system.', permissions: ['view:overview', 'view:reports', 'create:reports', 'export:reports', 'view:analytics', 'export:analytics'] },
    { id: 'p-marketing', name: 'Marketing Lite', description: 'Run marketing campaigns + comms without finance or compliance access.', permissions: ['view:overview', 'view:clients', 'view:marketing', 'create:marketing', 'edit:marketing', 'export:marketing', 'view:comms', 'create:comms', 'view:analytics'] },
    { id: 'p-sales', name: 'Sales Lite', description: 'Lead and pipeline access plus client read.', permissions: ['view:overview', 'view:clients', 'view:sales', 'create:sales', 'edit:sales', 'export:sales', 'view:realty-brokers', 'view:marketing'] },
  ]

  const PRESETS_KEY = 'ghl-admin-permission-presets-v1'
  const [presets, setPresets] = useState<PermissionPreset[]>(DEFAULT_PRESETS)
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = localStorage.getItem(PRESETS_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed) && parsed.length) setPresets([...DEFAULT_PRESETS, ...parsed.filter((p: any) => p && p.id && Array.isArray(p.permissions))])
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  const persistCustom = (next: PermissionPreset[]) => {
    try {
      const custom = next.filter(p => !p.id.startsWith('p-')) // only persist user-created ones
      localStorage.setItem(PRESETS_KEY, JSON.stringify(custom))
    } catch { /* ignore */ }
  }

  const [presetCreateOpen, setPresetCreateOpen] = useState(false)
  const [presetForm, setPresetForm] = useState<{ name: string; description: string; permissions: string[] }>({ name: '', description: '', permissions: [] })
  const [applyPresetFor, setApplyPresetFor] = useState<PermissionPreset | null>(null)
  const [applyTargetId, setApplyTargetId] = useState('')
  const [applyingPreset, setApplyingPreset] = useState(false)
  const togglePresetDraftToken = (token: string) => setPresetForm(p => p.permissions.includes(token) ? { ...p, permissions: p.permissions.filter(t => t !== token) } : { ...p, permissions: [...p.permissions, token] })
  const handlePresetCreate = () => {
    if (!presetForm.name.trim()) { showToast('Preset name is required', 'error'); return }
    if (presetForm.permissions.length === 0) { showToast('Pick at least one permission', 'error'); return }
    const id = `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
    const next: PermissionPreset = { id, name: presetForm.name.trim(), description: presetForm.description.trim() || 'Custom preset', permissions: presetForm.permissions }
    const all = [...presets, next]
    setPresets(all)
    persistCustom(all)
    setPresetCreateOpen(false)
    setPresetForm({ name: '', description: '', permissions: [] })
    showToast(`Preset "${next.name}" created`, 'success')
  }
  const handlePresetDelete = (p: PermissionPreset) => {
    if (p.id.startsWith('p-')) { showToast('Default presets cannot be deleted.', 'warning'); return }
    if (!window.confirm(`Delete preset "${p.name}"?`)) return
    const next = presets.filter(x => x.id !== p.id)
    setPresets(next)
    persistCustom(next)
    showToast('Preset removed', 'success')
  }
  const handlePresetApply = async () => {
    if (!applyPresetFor || !applyTargetId) return
    setApplyingPreset(true)
    try {
      const target = adminUsers.find(u => u.id === applyTargetId)
      const existing = target?.permission_overrides || []
      const merged = Array.from(new Set([...existing, ...applyPresetFor.permissions]))
      const res = await updateAdminUserPermissions(applyTargetId, merged)
      if (res.ok) {
        showToast(`Applied "${applyPresetFor.name}" to ${target?.full_name || target?.email || 'user'}`, 'success')
        setApplyPresetFor(null)
        setApplyTargetId('')
        loadAll()
      } else {
        showToast(res.error || 'Apply failed', 'error')
      }
    } finally { setApplyingPreset(false) }
  }

  // Add User submit handler
  const handleCreateUser = async () => {
    if (!form.email.trim() || !form.full_name.trim() || !form.password.trim()) {
      showToast('Email, name and password are required', 'error')
      return
    }
    if (form.password.length < 8) {
      showToast('Password must be at least 8 characters', 'error')
      return
    }
    setSaving(true)
    // Snapshot form fields BEFORE the reset so the optimistic row we push
    // into adminUsers carries the values the admin actually typed (not the
    // blanks we set right after success).
    const snap = {
      email: form.email.trim().toLowerCase(),
      full_name: form.full_name.trim(),
      phone: form.phone.trim(),
      role: form.role,
      department: form.department.trim(),
    }
    try {
      const res = await createAdminUser({
        email: snap.email,
        full_name: snap.full_name,
        phone: snap.phone || undefined,
        role: snap.role,
        department: snap.department || undefined,
        password: form.password,
      })
      if (res.ok) {
        showToast(`Admin user "${snap.full_name}" created`, 'success')
        setAddOpen(false)
        setForm({ email: '', full_name: '', phone: '', role: 'admin', department: '', password: '' })
        // 2026-05-16: optimistically push the new user into the list so the
        // "No admin users yet" empty-state disappears instantly. The
        // subsequent loadAll() reconciles with the canonical DB shape (real
        // id, created_at, etc.) — the temporary id is replaced once that
        // resolves.
        if (res.userId) {
          setAdminUsers(prev => ([
            {
              id: res.userId!,
              email: snap.email,
              full_name: snap.full_name,
              phone: snap.phone || null,
              role: snap.role,
              department: snap.department || null,
              last_login_at: null,
              created_at: new Date().toISOString(),
              permission_overrides: [],
            },
            ...prev,
          ]))
        }
        loadAll()
      } else {
        showToast(res.error || 'Failed to create admin user', 'error')
      }
    } finally { setSaving(false) }
  }

  // Change-role submit handler
  const handleRoleChange = async () => {
    if (!editingRoleFor) return
    setSavingRole(true)
    try {
      const res = await updateAdminUserRole(editingRoleFor.id, newRole)
      if (res.ok) {
        showToast(`Role updated for ${editingRoleFor.full_name || editingRoleFor.email}`, 'success')
        setEditingRoleFor(null)
        loadAll()
      } else {
        showToast(res.error || 'Failed to update role', 'error')
      }
    } finally { setSavingRole(false) }
  }

  // Per-user permission overrides submit handler
  const openPermsEditor = (u: AdminUserRow) => {
    setEditingPermsFor(u)
    setPermsDraft(Array.isArray(u.permission_overrides) ? [...u.permission_overrides] : [])
  }
  const togglePermDraft = (token: string) => {
    setPermsDraft(prev => prev.includes(token) ? prev.filter(t => t !== token) : [...prev, token])
  }
  const handlePermsSave = async () => {
    if (!editingPermsFor) return
    setSavingPerms(true)
    try {
      const res = await updateAdminUserPermissions(editingPermsFor.id, permsDraft)
      if (res.ok) {
        showToast(`Permissions updated for ${editingPermsFor.full_name || editingPermsFor.email}`, 'success')
        setEditingPermsFor(null)
        loadAll()
      } else {
        showToast(res.error || 'Failed to update permissions', 'error')
      }
    } finally { setSavingPerms(false) }
  }

  // 2026-05-16: full-purge an admin user (auth + profile + clients + downstream).
  // Refuses to delete self, the last super_admin, or any super_admin unless
  // the caller is also a super_admin. The auto-created clients row (left over
  // from older signup paths that didn't set skip_client_row) is removed too,
  // which fixes orphan rows lingering in Client List after an admin user was
  // changed/removed elsewhere.
  const handleDeleteUser = async (target: { id: string; name: string; email: string; role: AdminRole }) => {
    if (!target?.id) return
    if (meId && target.id === meId) {
      showToast('You cannot delete your own admin account', 'error')
      return
    }
    const me = adminUsers.find(u => u.id === meId)
    const meRole = me?.role || ''
    const targetRow = adminUsers.find(u => u.id === target.id)
    const targetDbRole = targetRow?.role || ''
    if (targetDbRole === 'super_admin') {
      if (meRole !== 'super_admin') {
        showToast('Only a super admin can delete another super admin', 'error')
        return
      }
      const superAdminCount = adminUsers.filter(u => u.role === 'super_admin').length
      if (superAdminCount <= 1) {
        showToast('Cannot delete the last super admin', 'error')
        return
      }
    }
    const label = target.name || target.email
    if (!window.confirm(`Permanently delete admin user "${label}"?\n\nThis removes the auth account, profile, any client/investor record, and all downstream data. This cannot be undone.`)) return
    setDeletingUserId(target.id)
    try {
      const res = await deleteAdminUser(target.id)
      if (res.ok) {
        showToast(`Deleted "${label}"`, 'success')
        loadAll()
      } else {
        showToast(res.error || 'Delete failed', 'error')
      }
    } finally { setDeletingUserId(null) }
  }

  const PERM_VIEWS = [
    { id: 'roles' as const, label: 'Roles', icon: Users },
    { id: 'users' as const, label: 'Users', icon: Key },
    { id: 'matrix' as const, label: 'Matrix', icon: Shield },
    { id: 'audit' as const, label: 'Audit', icon: Clock },
    { id: 'presets' as const, label: 'Presets', icon: Copy },
  ]

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Total Roles" value={roles.length} icon={Shield} color="#DC2626" delay={0} />
        <AdminKPICard title="Active Users" value={userAssignments.length} icon={Users} color="#3B82F6" delay={50} />
        <AdminKPICard title="Permission Rules" value={Object.values(ROLE_PERMISSIONS).flat().length} icon={Key} color="#10B981" delay={100} />
        <AdminKPICard title="Audit Events (30d)" value={permAuditLog.length} icon={Eye} color="#8B5CF6" delay={150} />
      </div>

      {/* View switcher */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-x-auto">
        {PERM_VIEWS.map(v => {
          const Icon = v.icon
          return (
            <button
              key={v.id}
              onClick={() => setPermView(v.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all ${
                permView === v.id ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {v.label}
            </button>
          )
        })}
      </div>

      {/* ROLES OVERVIEW */}
      {permView === 'roles' && (
        <div className="space-y-3">
          {roles.map(role => {
            const perms = ROLE_PERMISSIONS[role] || []
            const hasWildcard = perms.includes('*')
            const userCount = userAssignments.filter(u => u.role === role).length
            const moduleCount = hasWildcard ? allModules.length : allModules.filter(m => perms.some(p => p.endsWith(`:${m}`))).length
            const isExpanded = expandedRole === role
            return (
              <AdminGlass key={role} className="!p-0 overflow-hidden">
                <button
                  onClick={() => setExpandedRole(isExpanded ? null : role)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-brand-red" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{ROLE_LABELS[role]}</p>
                      <p className="text-[11px] text-gray-500 truncate">{hasWildcard ? 'Full system access' : `${perms.length} permissions \u00b7 ${moduleCount} modules`}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[11px] text-gray-500 hidden sm:inline">{userCount} user{userCount !== 1 ? 's' : ''}</span>
                    <AdminBadge
                      label={hasWildcard ? 'Super' : moduleCount >= 10 ? 'Full' : moduleCount >= 5 ? 'Standard' : 'Limited'}
                      variant={hasWildcard ? 'error' : moduleCount >= 10 ? 'success' : moduleCount >= 5 ? 'info' : 'neutral'}
                    />
                    <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/[0.04]">
                    <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {allModules.map(mod => {
                        const modPerms = hasWildcard ? allActions : allActions.filter(a => perms.includes(`${a}:${mod}` as never))
                        const hasAccess = modPerms.length > 0
                        return (
                          <div key={mod} className={`p-2.5 rounded-lg border text-[11px] ${hasAccess ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white/[0.01] border-white/[0.03] opacity-40'}`}>
                            <p className="text-white font-medium capitalize mb-1">{mod.replace(/-/g, ' ')}</p>
                            {hasAccess ? (
                              <div className="flex flex-wrap gap-1">
                                {modPerms.map(a => (
                                  <span key={a} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] uppercase font-semibold">{a.charAt(0)}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-600 text-[10px]">No access</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {userCount > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/[0.04]">
                        <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Users with this role</p>
                        <div className="flex flex-wrap gap-2">
                          {userAssignments.filter(u => u.role === role).map(u => (
                            <span key={u.email} className="px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-gray-300">{u.name}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </AdminGlass>
            )
          })}
        </div>
      )}

      {/* USER ACCESS */}
      {permView === 'users' && (
        <AdminGlass>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-red" />
              User Role Assignments
              <span className="text-[10px] text-gray-500 font-normal ml-2">{userAssignments.length} user{userAssignments.length === 1 ? '' : 's'}</span>
            </h3>
            <button
              onClick={() => setAddOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 rounded-lg hover:bg-brand-red/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add User
            </button>
          </div>
          {loadingData ? (
            <div className="py-8 text-center text-xs text-gray-500"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading admin users…</div>
          ) : userAssignments.length === 0 ? (
            <AdminEmptyState
              icon={Users}
              title="No admin users yet"
              description="Click Add User to invite the first admin. Their role determines which modules they can access."
            />
          ) : (
            <div className="space-y-2">
              {userAssignments.map(user => (
                <div key={user.email} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {user.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white font-medium truncate">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email} &middot; {user.dept}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <AdminBadge
                      label={ROLE_LABELS[user.role] || user.role}
                      variant={user.role === 'super-admin' ? 'error' : user.role.includes('admin') ? 'warning' : 'info'}
                    />
                    <span className="text-[10px] text-gray-600 hidden sm:inline">{formatDate(user.lastActive)}</span>
                    <button
                      onClick={() => {
                        const row = adminUsers.find(u => u.id === user.id) || null
                        setEditingRoleFor(row)
                        setNewRole(row?.role || 'admin')
                      }}
                      className="px-2.5 py-1 rounded-md text-[10px] font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
                    >
                      Change Role
                    </button>
                    <button
                      onClick={() => {
                        const row = adminUsers.find(u => u.id === user.id)
                        if (row) openPermsEditor(row)
                      }}
                      className="px-2.5 py-1 rounded-md text-[10px] font-medium text-purple-300 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
                      title="Grant module-level permissions beyond the role"
                    >
                      Manage Permissions
                    </button>
                    {meId !== user.id && (
                      <button
                        onClick={() => handleDeleteUser(user)}
                        disabled={deletingUserId === user.id}
                        className="px-2.5 py-1 rounded-md text-[10px] font-medium text-red-300 bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                        title="Permanently remove this user (auth + profile + any client record)"
                      >
                        {deletingUserId === user.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminGlass>
      )}

      {/* PERMISSION MATRIX */}
      {permView === 'matrix' && (
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-red" />
            Permission Matrix
          </h3>
          <p className="text-[11px] text-gray-500 mb-4">{allModules.length} modules &middot; {allActions.length} actions &middot; {roles.length} roles</p>
          <div className="overflow-x-auto -mx-4 px-4 pb-2">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-2 py-2 text-gray-500 uppercase tracking-wider font-medium sticky left-0 bg-black/40 backdrop-blur-sm z-10 min-w-[110px]">Role</th>
                  {allModules.map(m => (
                    <th key={m} className="text-center px-1 py-2 text-gray-500 uppercase font-medium whitespace-nowrap" style={{ fontSize: '8px', letterSpacing: '0.05em' }}>
                      {m.replace(/-/g, ' ').replace('realty brokers', 'Brokers')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {roles.map((role, idx) => {
                  const perms = ROLE_PERMISSIONS[role] || []
                  const hasWildcard = perms.includes('*')
                  return (
                    <tr key={role} className={`border-b border-white/[0.03] ${idx % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                      <td className="px-2 py-1.5 font-medium text-white whitespace-nowrap sticky left-0 bg-black/40 backdrop-blur-sm z-10 text-[10px]">{ROLE_LABELS[role]}</td>
                      {allModules.map(mod => {
                        if (hasWildcard) return <td key={mod} className="text-center px-1 py-1.5"><span className="inline-block w-5 h-5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-bold leading-5">*</span></td>
                        const modPerms = allActions.filter(a => perms.includes(`${a}:${mod}` as never))
                        if (modPerms.length === 0) return <td key={mod} className="text-center px-1 py-1.5 text-gray-800">&mdash;</td>
                        return (
                          <td key={mod} className="text-center px-1 py-1.5">
                            <div className="flex gap-px justify-center flex-wrap">
                              {modPerms.map(a => (
                                <span key={a} className="w-3 h-3 rounded-sm bg-blue-500/20 text-blue-400 text-[7px] font-bold inline-flex items-center justify-center" title={`${a}:${mod}`}>{a.charAt(0).toUpperCase()}</span>
                              ))}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-3 pt-3 border-t border-white/[0.04] flex flex-wrap gap-3 text-[9px] text-gray-500">
            <span><span className="text-emerald-400 font-bold">*</span> = All</span>
            <span><span className="text-blue-400 font-bold">V</span> = View</span>
            <span><span className="text-blue-400 font-bold">C</span> = Create</span>
            <span><span className="text-blue-400 font-bold">E</span> = Edit</span>
            <span><span className="text-blue-400 font-bold">A</span> = Approve</span>
            <span><span className="text-blue-400 font-bold">D</span> = Delete</span>
            <span><span className="text-blue-400 font-bold">X</span> = Export</span>
            <span><span className="text-blue-400 font-bold">F</span> = Configure</span>
          </div>
        </AdminGlass>
      )}

      {/* AUDIT TRAIL */}
      {permView === 'audit' && (
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-red" />
            Permission Change Audit Trail
            <span className="text-[10px] text-gray-500 font-normal ml-2">{permAuditLog.length} event{permAuditLog.length === 1 ? '' : 's'}</span>
          </h3>
          {loadingData ? (
            <div className="py-8 text-center text-xs text-gray-500"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading audit log…</div>
          ) : permAuditLog.length === 0 ? (
            <AdminEmptyState icon={Clock} title="No permission events yet" description="Audit entries for admin-user creation, role changes, and client trash/restore will appear here." />
          ) : (
            <div className="space-y-2">
              {permAuditLog.map(entry => (
                <div key={entry.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    entry.action === 'Granted' ? 'bg-emerald-400' :
                    entry.action === 'Revoked' || entry.action === 'Auto-Revoked' ? 'bg-red-400' :
                    entry.action === 'Role Changed' ? 'bg-blue-400' :
                    entry.action === 'Created' ? 'bg-purple-400' : 'bg-amber-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-white font-medium">{entry.action}</span>
                      <span className="text-[11px] text-gray-400">&rarr; {entry.target}</span>
                      <AdminBadge label={entry.module} variant="neutral" />
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 break-all">{entry.detail}</p>
                    <p className="text-[10px] text-gray-600 mt-1">by {entry.user} &middot; {formatDate(entry.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminGlass>
      )}

      {/* PRESETS */}
      {permView === 'presets' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Copy className="w-4 h-4 text-brand-red" />
                Permission Presets
                <span className="text-[10px] text-gray-500 font-normal ml-2">{presets.length} preset{presets.length === 1 ? '' : 's'}</span>
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Pre-configured permission bundles. Apply to a user to grant the bundle on top of their role.</p>
            </div>
            <button
              onClick={() => { setPresetForm({ name: '', description: '', permissions: [] }); setPresetCreateOpen(true) }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 rounded-lg hover:bg-brand-red/30 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Preset
            </button>
          </div>
          {presets.map(preset => {
            const isDefault = preset.id.startsWith('p-')
            return (
              <AdminGlass key={preset.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{preset.name}{isDefault && <span className="ml-2 text-[9px] uppercase tracking-wider text-amber-300">Default</span>}</p>
                      <p className="text-[11px] text-gray-500 truncate">{preset.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-white font-medium">{preset.permissions.length} perms</p>
                    </div>
                    <button
                      onClick={() => { setApplyPresetFor(preset); setApplyTargetId('') }}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                      title="Apply this preset to a user"
                    >
                      Apply to User
                    </button>
                    {!isDefault && (
                      <button onClick={() => handlePresetDelete(preset)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 transition-colors" title="Delete preset">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </AdminGlass>
            )
          })}
        </div>
      )}

      {/* New Preset modal */}
      <AdminModal
        isOpen={presetCreateOpen}
        onClose={() => { setPresetCreateOpen(false); setPresetForm({ name: '', description: '', permissions: [] }) }}
        title="New Permission Preset"
        subtitle="Bundles save to this browser only. Apply to a user to copy the permissions into their permission_overrides."
        maxWidth="max-w-2xl"
        footer={
          <>
            <ModalButton onClick={() => { setPresetCreateOpen(false); setPresetForm({ name: '', description: '', permissions: [] }) }}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handlePresetCreate}>Save Preset</ModalButton>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Name *</label>
              <input value={presetForm.name} onChange={e => setPresetForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Finance Read-Only" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Description</label>
              <input value={presetForm.description} onChange={e => setPresetForm(p => ({ ...p, description: e.target.value }))} placeholder="What this preset grants" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Permissions ({presetForm.permissions.length})</span>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[50vh] overflow-y-auto pr-1">
              {allModules.map(mod => (
                <div key={mod} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-white capitalize">{mod.replace(/-/g, ' ')}</p>
                    <span className="text-[10px] text-gray-500">{allActions.filter(a => presetForm.permissions.includes(`${a}:${mod}`)).length} of {allActions.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allActions.map(action => {
                      const token = `${action}:${mod}`
                      const on = presetForm.permissions.includes(token)
                      return (
                        <button
                          key={token}
                          onClick={() => togglePresetDraftToken(token)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider transition-colors ${on ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-white/[0.03] text-gray-500 border border-white/[0.08] hover:bg-white/[0.06]'}`}
                        >
                          {action}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AdminModal>

      {/* Apply Preset modal */}
      <AdminModal
        isOpen={!!applyPresetFor}
        onClose={() => { setApplyPresetFor(null); setApplyTargetId('') }}
        title={applyPresetFor ? `Apply Preset · ${applyPresetFor.name}` : ''}
        subtitle="Pick an admin user. The preset's permissions are added on top of their role (no permissions are removed)."
        maxWidth="max-w-lg"
        footer={
          <>
            <ModalButton onClick={() => { setApplyPresetFor(null); setApplyTargetId('') }} disabled={applyingPreset}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handlePresetApply} disabled={applyingPreset || !applyTargetId}>{applyingPreset ? 'Applying…' : 'Apply'}</ModalButton>
          </>
        }
      >
        {applyPresetFor && (
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">User</label>
              <select value={applyTargetId} onChange={e => setApplyTargetId(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20">
                <option value="">Choose user…</option>
                {adminUsers.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name || u.email} — {ROLE_LABELS[ROLE_DB_TO_UI[u.role] || 'viewer']}</option>
                ))}
              </select>
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-3">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Permissions Granted</p>
              <div className="flex flex-wrap gap-1.5">
                {applyPresetFor.permissions.map(t => (
                  <span key={t} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 text-[10px] font-medium font-mono">{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Add User modal */}
      <AdminModal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add Admin User"
        subtitle="Creates an admin-side account (no client/investor record). The user can log in immediately at /admin/login."
        maxWidth="max-w-lg"
        footer={
          <>
            <ModalButton onClick={() => setAddOpen(false)} disabled={saving}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleCreateUser} disabled={saving}>
              {saving ? <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Creating…</span> : 'Create User'}
            </ModalButton>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Full Name *</label>
              <input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Department</label>
              <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Compliance, Sales" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Role *</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20">
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="compliance_officer">Compliance Officer</option>
                <option value="fund_manager">Fund Manager</option>
                <option value="manager">Manager</option>
                <option value="marketing_manager">Marketing Manager</option>
                <option value="sales">Sales</option>
                <option value="marketing_executive">Marketing Executive</option>
                <option value="operations">Operations</option>
                <option value="hr">HR</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">Temporary Password *</label>
              <input type="text" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="≥ 8 characters" className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 font-mono" />
            </div>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-200">
            <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <span>This creates a real auth user with the chosen role. Share the temporary password securely and instruct the user to change it on first login (Settings → Password Vault).</span>
          </div>
        </div>
      </AdminModal>

      {/* Change Role modal */}
      <AdminModal
        isOpen={!!editingRoleFor}
        onClose={() => setEditingRoleFor(null)}
        title={editingRoleFor ? `Change role · ${editingRoleFor.full_name || editingRoleFor.email}` : ''}
        subtitle="Updates the user's role in profiles. Module access is re-checked on every page navigation."
        maxWidth="max-w-md"
        footer={
          <>
            <ModalButton onClick={() => setEditingRoleFor(null)} disabled={savingRole}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleRoleChange} disabled={savingRole}>
              {savingRole ? 'Saving…' : 'Save Role'}
            </ModalButton>
          </>
        }
      >
        {editingRoleFor && (
          <div className="space-y-3">
            <div className="text-[11px] text-gray-400">
              <span className="uppercase tracking-wider text-gray-500">Current role:</span> {ROLE_LABELS[ROLE_DB_TO_UI[editingRoleFor.role] || 'viewer']}
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider text-gray-500 font-medium mb-1">New Role</label>
              <select value={newRole} onChange={e => setNewRole(e.target.value)} className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20">
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="compliance_officer">Compliance Officer</option>
                <option value="fund_manager">Fund Manager</option>
                <option value="manager">Manager</option>
                <option value="marketing_manager">Marketing Manager</option>
                <option value="sales">Sales</option>
                <option value="marketing_executive">Marketing Executive</option>
                <option value="operations">Operations</option>
                <option value="hr">HR</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Per-user permission overrides modal */}
      <AdminModal
        isOpen={!!editingPermsFor}
        onClose={() => setEditingPermsFor(null)}
        title={editingPermsFor ? `Manage permissions · ${editingPermsFor.full_name || editingPermsFor.email}` : ''}
        subtitle="Grants here are added on top of the user's role permissions. Useful when one user needs access to a module their role doesn't normally include."
        maxWidth="max-w-2xl"
        footer={
          <>
            <ModalButton onClick={() => setEditingPermsFor(null)} disabled={savingPerms}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handlePermsSave} disabled={savingPerms}>
              {savingPerms ? 'Saving…' : 'Save Permissions'}
            </ModalButton>
          </>
        }
      >
        {editingPermsFor && (
          <div className="space-y-3">
            <div className="text-[11px] text-gray-400">
              <span className="uppercase tracking-wider text-gray-500">Role:</span> {ROLE_LABELS[ROLE_DB_TO_UI[editingPermsFor.role] || 'viewer']}
              {' '}<span className="text-gray-600">·</span> {permsDraft.length} permission{permsDraft.length === 1 ? '' : 's'} granted
            </div>
            <div className="grid grid-cols-1 gap-2">
              {allModules.map(mod => (
                <div key={mod} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-2.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-white capitalize">{mod.replace(/-/g, ' ')}</p>
                    <span className="text-[10px] text-gray-500">{allActions.filter(a => permsDraft.includes(`${a}:${mod}`)).length} of {allActions.length}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allActions.map(action => {
                      const token = `${action}:${mod}`
                      const on = permsDraft.includes(token)
                      return (
                        <button
                          key={token}
                          onClick={() => togglePermDraft(token)}
                          className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider transition-colors ${
                            on
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-white/[0.03] text-gray-500 border border-white/[0.08] hover:bg-white/[0.06]'
                          }`}
                        >
                          {action}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  )
}

// ── Roles Tab ───────────────────────────────────────────────────
// 2026-05-16: built-in roles still live in adminRBAC.ts (one row per
// user_role enum value). Custom roles are stored in public.admin_roles
// and can be created/edited/deleted from the UI by a Super Admin. The
// list below merges both sources.
function RolesTab({ showToast }: { showToast: Toast }) {
  const builtInRoles = Object.keys(ROLE_LABELS) as AdminRole[]
  const allModules = ['overview', 'clients', 'sales', 'realty-brokers', 'employees', 'assets', 'ai-ops', 'compliance', 'financial', 'analytics', 'comms', 'marketing', 'reports', 'settings']
  const allActions = ['view', 'create', 'edit', 'approve', 'delete', 'export', 'configure']
  const [users, setUsers] = useState<AdminUserRow[]>([])
  const [customRoles, setCustomRoles] = useState<AdminRoleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedRoleKey, setExpandedRoleKey] = useState<string | null>(null)
  // Create / Edit role modal state.
  const [roleModalOpen, setRoleModalOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<AdminRoleRow | null>(null)
  const [roleForm, setRoleForm] = useState<{ name: string; description: string; permissions: string[] }>({ name: '', description: '', permissions: [] })
  const [savingRole, setSavingRole] = useState(false)
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    const [u, r] = await Promise.all([fetchAdminUsers(), fetchCustomRoles()])
    setUsers(u)
    setCustomRoles(r)
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  const usersByRole = useMemo(() => {
    const map: Record<string, AdminUserRow[]> = {}
    for (const u of users) {
      const uiRole = (ROLE_DB_TO_UI[u.role] || 'viewer') as AdminRole
      if (!map[uiRole]) map[uiRole] = []
      map[uiRole].push(u)
    }
    return map
  }, [users])

  const openCreateRole = () => {
    setEditingRole(null)
    setRoleForm({ name: '', description: '', permissions: [] })
    setRoleModalOpen(true)
  }

  const openEditRole = (r: AdminRoleRow) => {
    setEditingRole(r)
    setRoleForm({ name: r.name, description: r.description || '', permissions: [...r.permissions] })
    setRoleModalOpen(true)
  }

  const togglePerm = (token: string) => {
    setRoleForm(prev => prev.permissions.includes(token)
      ? { ...prev, permissions: prev.permissions.filter(p => p !== token) }
      : { ...prev, permissions: [...prev.permissions, token] })
  }

  const toggleModuleAll = (mod: string) => {
    const tokens = allActions.map(a => `${a}:${mod}`)
    const allOn = tokens.every(t => roleForm.permissions.includes(t))
    setRoleForm(prev => ({
      ...prev,
      permissions: allOn
        ? prev.permissions.filter(p => !tokens.includes(p))
        : Array.from(new Set([...prev.permissions, ...tokens])),
    }))
  }

  const saveRole = async () => {
    if (!roleForm.name.trim()) { showToast('Role name is required', 'error'); return }
    setSavingRole(true)
    try {
      if (editingRole) {
        const res = await updateCustomRole(editingRole.id, {
          name: roleForm.name.trim(),
          description: roleForm.description.trim() || null,
          permissions: roleForm.permissions,
        })
        if (res === true) {
          showToast('Role updated', 'success')
          setRoleModalOpen(false)
          await loadAll()
        } else {
          showToast(res, 'error')
        }
      } else {
        const res = await createCustomRole({
          name: roleForm.name.trim(),
          description: roleForm.description.trim(),
          permissions: roleForm.permissions,
        })
        if (typeof res === 'string') {
          showToast(res, 'error')
        } else {
          showToast(`Role "${res.name}" created`, 'success')
          setRoleModalOpen(false)
          await loadAll()
        }
      }
    } finally {
      setSavingRole(false)
    }
  }

  const removeRole = async (r: AdminRoleRow) => {
    if (!confirm(`Delete role "${r.name}"? Users currently linked to it will be detached.`)) return
    setDeletingRoleId(r.id)
    try {
      const res = await deleteCustomRole(r.id)
      if (res === true) {
        showToast(`Role "${r.name}" deleted`, 'success')
        await loadAll()
      } else {
        showToast(res, 'error')
      }
    } finally {
      setDeletingRoleId(null)
    }
  }

  return (
    <div className="space-y-4">
      <AdminGlass>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-red" />
              Roles
              <span className="text-[10px] text-gray-500 font-normal ml-2">{builtInRoles.length + customRoles.length} roles · {users.length} admin users</span>
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5 max-w-xl">
              Each admin user belongs to one role. Roles carry a default set of module permissions. Use <span className="text-purple-300">Settings → Permissions → Users → Manage Permissions</span> to grant a specific user extra access beyond their role.
            </p>
          </div>
          <button
            onClick={openCreateRole}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-brand-red/20 text-white border border-brand-red/30 hover:bg-brand-red/30 transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Create Role
          </button>
        </div>
      </AdminGlass>

      {loading ? (
        <div className="py-8 text-center text-xs text-gray-500"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Loading roles…</div>
      ) : (
        <div className="space-y-2">
          {builtInRoles.map(role => {
            const perms = ROLE_PERMISSIONS[role] || []
            const hasWildcard = perms.includes('*')
            const moduleCount = hasWildcard ? allModules.length : allModules.filter(m => perms.some(p => p.endsWith(`:${m}`))).length
            const list = usersByRole[role] || []
            const key = `builtin:${role}`
            const isExpanded = expandedRoleKey === key
            return (
              <AdminGlass key={key} className="!p-0 overflow-hidden">
                <button
                  onClick={() => setExpandedRoleKey(isExpanded ? null : key)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-brand-red/10 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-brand-red" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{ROLE_LABELS[role]}</p>
                      <p className="text-[11px] text-gray-500 truncate">
                        {hasWildcard ? 'Full system access' : `${perms.length} permissions · ${moduleCount} modules`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <span className="text-[11px] text-gray-500 hidden sm:inline">{list.length} user{list.length === 1 ? '' : 's'}</span>
                    <AdminBadge
                      label={hasWildcard ? 'Super' : moduleCount >= 10 ? 'Full' : moduleCount >= 5 ? 'Standard' : 'Limited'}
                      variant={hasWildcard ? 'error' : moduleCount >= 10 ? 'success' : moduleCount >= 5 ? 'info' : 'neutral'}
                    />
                    <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </button>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/[0.04]">
                    <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {allModules.map(mod => {
                        const modPerms = hasWildcard ? allActions : allActions.filter(a => perms.includes(`${a}:${mod}` as never))
                        const hasModule = modPerms.length > 0
                        return (
                          <div key={mod} className={`p-2.5 rounded-lg border text-[11px] ${hasModule ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white/[0.01] border-white/[0.03] opacity-40'}`}>
                            <p className="text-white font-medium capitalize mb-1">{mod.replace(/-/g, ' ')}</p>
                            {hasModule ? (
                              <div className="flex flex-wrap gap-1">
                                {modPerms.map(a => (
                                  <span key={a} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] uppercase font-semibold">{a.charAt(0)}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-600 text-[10px]">No access</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    {list.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/[0.04]">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">Users with this role</p>
                        <div className="flex flex-wrap gap-2">
                          {list.map(u => (
                            <span key={u.id} className="px-2 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-gray-300" title={u.email}>
                              {u.full_name || u.email}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </AdminGlass>
            )
          })}

          {/* ── Custom roles (DB-backed, editable) ────────────── */}
          {customRoles.map(role => {
            const perms = role.permissions || []
            const hasWildcard = perms.includes('*')
            const moduleCount = hasWildcard ? allModules.length : allModules.filter(m => perms.some(p => p.endsWith(`:${m}`))).length
            const key = `custom:${role.id}`
            const isExpanded = expandedRoleKey === key
            return (
              <AdminGlass key={key} className="!p-0 overflow-hidden">
                <div className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors">
                  <button
                    onClick={() => setExpandedRoleKey(isExpanded ? null : key)}
                    className="flex items-center gap-3 min-w-0 flex-1 text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{role.name}</p>
                        <AdminBadge label="Custom" variant="info" />
                      </div>
                      <p className="text-[11px] text-gray-500 truncate">
                        {role.description ? `${role.description} · ` : ''}{perms.length} permissions · {moduleCount} modules
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0 ml-2">
                    <button
                      onClick={() => openEditRole(role)}
                      className="px-2 py-1 rounded-lg text-[11px] font-medium bg-white/[0.04] text-gray-300 border border-white/[0.08] hover:bg-white/[0.08] transition-colors"
                      title="Edit role"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeRole(role)}
                      disabled={deletingRoleId === role.id}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                      title="Delete role"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight
                      className={`w-4 h-4 text-gray-500 transition-transform cursor-pointer ${isExpanded ? 'rotate-90' : ''}`}
                      onClick={() => setExpandedRoleKey(isExpanded ? null : key)}
                    />
                  </div>
                </div>
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/[0.04]">
                    <div className="pt-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {allModules.map(mod => {
                        const modPerms = hasWildcard ? allActions : allActions.filter(a => perms.includes(`${a}:${mod}` as never))
                        const hasModule = modPerms.length > 0
                        return (
                          <div key={mod} className={`p-2.5 rounded-lg border text-[11px] ${hasModule ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-white/[0.01] border-white/[0.03] opacity-40'}`}>
                            <p className="text-white font-medium capitalize mb-1">{mod.replace(/-/g, ' ')}</p>
                            {hasModule ? (
                              <div className="flex flex-wrap gap-1">
                                {modPerms.map(a => (
                                  <span key={a} className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] uppercase font-semibold">{a.charAt(0)}</span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-gray-600 text-[10px]">No access</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </AdminGlass>
            )
          })}
        </div>
      )}

      {/* ── Create / Edit Role Modal ────────────────────────────── */}
      <AdminModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
        title={editingRole ? `Edit Role: ${editingRole.name}` : 'Create Role'}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Role Name *</label>
              <input
                type="text"
                value={roleForm.name}
                onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Senior Analyst"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wider">Description</label>
              <input
                type="text"
                value={roleForm.description}
                onChange={e => setRoleForm(p => ({ ...p, description: e.target.value }))}
                placeholder="What does this role do?"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Permissions ({roleForm.permissions.length})</label>
              <span className="text-[10px] text-gray-500">Click a module title to toggle all actions</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-1">
              {allModules.map(mod => {
                const tokens = allActions.map(a => `${a}:${mod}`)
                const onCount = tokens.filter(t => roleForm.permissions.includes(t)).length
                const allOn = onCount === tokens.length
                return (
                  <div key={mod} className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-2.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <button
                        onClick={() => toggleModuleAll(mod)}
                        className={`text-sm font-medium capitalize transition-colors ${allOn ? 'text-emerald-300' : 'text-white hover:text-emerald-200'}`}
                      >
                        {mod.replace(/-/g, ' ')}
                      </button>
                      <span className="text-[10px] text-gray-500">{onCount} of {tokens.length}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {allActions.map(action => {
                        const token = `${action}:${mod}`
                        const on = roleForm.permissions.includes(token)
                        return (
                          <button
                            key={token}
                            onClick={() => togglePerm(token)}
                            className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider transition-colors ${
                              on
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'bg-white/[0.03] text-gray-500 border border-white/[0.08] hover:bg-white/[0.06]'
                            }`}
                          >
                            {action}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-white/[0.06]">
            <ModalButton variant="secondary" onClick={() => setRoleModalOpen(false)} disabled={savingRole}>
              Cancel
            </ModalButton>
            <ModalButton variant="primary" onClick={saveRole} disabled={savingRole || !roleForm.name.trim()}>
              {savingRole ? (<><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>) : (editingRole ? 'Update Role' : 'Create Role')}
            </ModalButton>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}

// ── Security Settings ───────────────────────────────────────────
function SecurityTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [securityEvents, setSecurityEvents] = useState<{ id: string; event: string; user: string; ip: string; time: string; status: string }[]>([])

  useEffect(() => {
    fetchActivityFeed().then(logs => {
      if (logs && logs.length > 0) {
        setSecurityEvents(logs.slice(0, 10).map((l: any) => ({
          id: l.id || `SE-${Math.random().toString(36).slice(2, 8)}`,
          event: l.action || 'System Event',
          user: l.user || 'system',
          ip: '-',
          time: l.timestamp || new Date().toISOString(),
          status: (l.action || '').toLowerCase().includes('fail') || (l.action || '').toLowerCase().includes('error') ? 'failed' : (l.action || '').toLowerCase().includes('logout') || (l.action || '').toLowerCase().includes('expire') ? 'info' : 'success',
        })))
      }
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-4">
      {/* Security Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Active Sessions" value={3} icon={Users} color="#3B82F6" delay={0} />
        <AdminKPICard title="Failed Logins (24h)" value={2} icon={AlertTriangle} color="#EF4444" delay={50} />
        <AdminKPICard title="2FA Enabled" value="100%" icon={Lock} color="#10B981" delay={100} />
        <AdminKPICard title="Last Backup" value="2h ago" icon={Database} color="#8B5CF6" delay={150} />
      </div>

      {/* Security Policies */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-brand-red" />
          Security Policies
        </h3>
        <div className="space-y-3">
          {[
            { label: 'Password Policy', value: 'Min 8 chars, 1 uppercase, 1 number, 1 special', status: 'Active' },
            { label: 'Session Timeout', value: '1 hour of inactivity', status: 'Active' },
            { label: 'Max Login Attempts', value: '5 attempts before lockout', status: 'Active' },
            { label: 'IP Whitelisting', value: 'Not configured', status: 'Inactive' },
            { label: 'Data Encryption', value: 'AES-256 at rest, TLS 1.3 in transit', status: 'Active' },
            { label: 'CORS Policy', value: 'Restricted to ghlindiaventures.com', status: 'Active' },
          ].map(policy => (
            <div key={policy.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div>
                <p className="text-sm text-white">{policy.label}</p>
                <p className="text-[11px] text-gray-500">{policy.value}</p>
              </div>
              <AdminBadge label={policy.status} variant={policy.status === 'Active' ? 'success' : 'neutral'} dot />
            </div>
          ))}
        </div>
      </AdminGlass>

      {/* Recent Security Events */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4 text-brand-red" />
          Recent Security Events
        </h3>
        <div className="space-y-2">
          {securityEvents.length === 0 && (
            <p className="text-xs text-gray-500 py-4 text-center">No recent security events</p>
          )}
          {securityEvents.map(event => (
            <div key={event.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  event.status === 'success' ? 'bg-emerald-400' :
                  event.status === 'failed' ? 'bg-red-400' : 'bg-blue-400'
                }`} />
                <div>
                  <p className="text-sm text-white">{event.event}</p>
                  <p className="text-[11px] text-gray-500">{event.user} • {event.ip}</p>
                </div>
              </div>
              <span className="text-[11px] text-gray-500">{formatDate(event.time)}</span>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ── Integrations Tab ────────────────────────────────────────────
// 2026-05-15: Monday.com integration removed per business decision —
// the lead pipeline now lives entirely in Supabase. Keeping the tab
// itself so the Settings sub-navigation doesn't lose a slot; rendering
// a clean placeholder makes room for future integrations without
// reviving the dead Monday wiring.
function IntegrationsTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  void showToast // reserved for future hooks
  return (
    <div className="space-y-4">
      <AdminGlass className="!border-dashed">
        <AdminEmptyState
          icon={Plug}
          title="No Integrations Active"
          description="Lead pipeline, KYC, payouts, and documents all run on Supabase. New third-party integrations will appear here once they are configured."
        />
      </AdminGlass>
    </div>
  )
}

// ── Legacy Integrations Tab (Monday.com) — RETIRED 2026-05-15 ──
// Kept as `_LegacyIntegrationsTab` purely so old in-page hashes and
// linked screenshots don't break the build by referencing removed
// symbols. Do NOT call this; routing skips it.
function _LegacyIntegrationsTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [mondayKey, setMondayKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [connected, setConnected] = useState<{ accountName: string; userName: string } | null>(null)
  const [boards, setBoards] = useState<{ id: string; name: string; items_count: number }[]>([])
  const [selectedBoard, setSelectedBoard] = useState('')
  const [loadingBoards, setLoadingBoards] = useState(false)
  const [mapping, setMapping] = useState<Record<string, string>>({
    email: '', phone: '', source: '', stage: '', value: '', assignedTo: '',
  })
  const [syncLog, setSyncLog] = useState<{ time: string; message: string; type: 'success' | 'error' | 'info' }[]>([])
  const [serverKeyConfigured, setServerKeyConfigured] = useState(false)
  const [boardColumns, setBoardColumns] = useState<{ id: string; title: string; type: string }[]>([])
  const [boardGroups, setBoardGroups] = useState<{ id: string; title: string }[]>([])
  const [selectedGroup, setSelectedGroup] = useState('')

  // Load persisted state on mount
  useState(() => {
    if (typeof window === 'undefined') return
    const { getMondayApiKey, isMondayConfigured, getSavedMappings } = require('@/lib/mondayService')

    // Check whether the server has MONDAY_API_KEY env var configured
    const { getAuthToken } = require('@/lib/supabase/client')
    getAuthToken().then((token: string) => fetch('/api/monday-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify({ query: '__check_config__' }),
    }))
      .then((r: any) => r.json())
      .then((d: any) => {
        if (d?.data?.serverKeyConfigured) {
          setServerKeyConfigured(true)
          // Auto-test with server key (no client key needed)
          handleTestConnection('__use_server_key__')
        }
      })
      .catch(() => {})

    const key = getMondayApiKey()
    if (key) {
      setMondayKey(key)
      // Auto-test on load
      handleTestConnection(key)
    }
    const mappings = getSavedMappings()
    if (mappings.length > 0) {
      const m = mappings[0]
      setSelectedBoard(m.boardId)
      setMapping(m.columnMappings || {})
    }
  })

  const handleTestConnection = async (keyOverride?: string) => {
    const key = keyOverride || mondayKey
    const isServerKeyOnly = key === '__use_server_key__'
    if (!isServerKeyOnly && !key.trim() && !serverKeyConfigured) {
      showToast('Please enter a Monday.com API key', 'error')
      return
    }
    setTesting(true)
    try {
      const { setMondayApiKey, testConnection } = await import('@/lib/mondayService')
      // If using server key only, clear any stale session key so the proxy uses env var
      if (isServerKeyOnly) {
        setMondayApiKey('')
      } else {
        setMondayApiKey(key.trim())
      }
      const result = await testConnection()
      if (result.success) {
        setConnected({ accountName: result.accountName || '', userName: result.userName || '' })
        showToast(`Connected to ${result.accountName}`, 'success')
        // Auto-load boards
        handleLoadBoards()
      } else {
        setConnected(null)
        if (!isServerKeyOnly) showToast(result.error || 'Connection failed', 'error')
      }
    } catch {
      setConnected(null)
      if (!isServerKeyOnly) showToast('Failed to connect to Monday.com', 'error')
    } finally {
      setTesting(false)
    }
  }

  const handleDisconnect = async () => {
    const { setMondayApiKey } = await import('@/lib/mondayService')
    setMondayApiKey('')
    setMondayKey('')
    setConnected(null)
    setBoards([])
    setSelectedBoard('')
    showToast('Disconnected from Monday.com', 'info')
  }

  const handleLoadBoards = async () => {
    setLoadingBoards(true)
    try {
      const { fetchBoards } = await import('@/lib/mondayService')
      const result = await fetchBoards()
      setBoards(result.map(b => ({ id: b.id, name: b.name, items_count: b.items_count })))
    } catch {
      showToast('Failed to load boards', 'error')
    } finally {
      setLoadingBoards(false)
    }
  }

  // Load columns & groups when a board is selected
  const handleBoardSelect = async (boardId: string) => {
    setSelectedBoard(boardId)
    if (!boardId) {
      setBoardColumns([])
      setBoardGroups([])
      return
    }
    try {
      const { fetchBoardColumns, fetchBoardGroups } = await import('@/lib/mondayService')
      const [cols, grps] = await Promise.all([
        fetchBoardColumns(boardId),
        fetchBoardGroups(boardId),
      ])
      setBoardColumns(cols.map(c => ({ id: c.id, title: c.title, type: c.type })))
      setBoardGroups(grps.map(g => ({ id: g.id, title: g.title })))
      // Auto-select first group
      if (grps.length > 0 && !selectedGroup) {
        setSelectedGroup(grps[0].id)
      }
    } catch {
      showToast('Failed to load board details', 'error')
    }
  }

  const handleSaveMapping = async () => {
    if (!selectedBoard) { showToast('Select a board first', 'error'); return }
    try {
      const { saveBoardMapping } = await import('@/lib/mondayService')
      const boardName = boards.find(b => b.id === selectedBoard)?.name || ''
      saveBoardMapping({
        boardId: selectedBoard,
        boardName,
        mappingType: 'leads',
        columnMappings: mapping,
        groupId: selectedGroup || undefined,
        syncDirection: 'push',
        lastSync: undefined,
      })
      showToast('Board mapping saved', 'success')
    } catch {
      showToast('Failed to save mapping', 'error')
    }
  }

  const handlePushLeads = async () => {
    if (!selectedBoard) { showToast('Select a board first', 'error'); return }
    const log = (message: string, type: 'success' | 'error' | 'info') =>
      setSyncLog(prev => [{ time: new Date().toLocaleTimeString(), message, type }, ...prev.slice(0, 19)])

    log('Starting lead sync to Monday.com...', 'info')
    try {
      const { pushLeadsToMonday, saveBoardMapping, getSavedMappings } = await import('@/lib/mondayService')
      const { fetchLeads } = await import('@/lib/supabase/adminDataService')
      const leadsData = await fetchLeads()
      const result = await pushLeadsToMonday(leadsData, selectedBoard, mapping, selectedGroup || undefined)
      if (result.success) {
        log(`Synced ${result.synced} leads successfully`, 'success')
        showToast(`${result.synced} leads synced to Monday.com`, 'success')
      } else {
        log(`Synced ${result.synced}, failed ${result.failed}`, 'error')
        result.errors.forEach(e => log(e, 'error'))
        showToast(`Sync completed with ${result.failed} errors`, 'warning')
      }
      // Update last sync timestamp
      const mappings = getSavedMappings()
      const existing = mappings.find(m => m.boardId === selectedBoard)
      if (existing) {
        saveBoardMapping({ ...existing, lastSync: result.timestamp })
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed'
      log(msg, 'error')
      showToast(msg, 'error')
    }
  }

  return (
    <div className="space-y-4">
      {/* Monday.com Connection */}
      <AdminGlass>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Link2 className="w-4 h-4 text-brand-red" />
            Monday.com Integration
          </h3>
          {connected && (
            <AdminBadge label={`Connected — ${connected.accountName}`} variant="success" dot />
          )}
        </div>

        {/* API Key Input */}
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5">API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  placeholder="Paste your Monday.com API key"
                  value={mondayKey}
                  onChange={e => setMondayKey(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 font-mono pr-10"
                />
                <button
                  onClick={() => setShowKey(s => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                onClick={() => handleTestConnection()}
                disabled={testing || (!mondayKey.trim() && !serverKeyConfigured)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 rounded-xl hover:bg-brand-red/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed admin-btn-press"
              >
                {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                {testing ? 'Testing…' : 'Test Connection'}
              </button>
              {connected && (
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors admin-btn-press"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-600 mt-1.5">
              {serverKeyConfigured ? (
                <span className="text-emerald-400/80">✓ Server API key configured via environment variable. This field is optional — leave blank to use the server key.</span>
              ) : (
                <>Find your key at monday.com → Avatar → Developers → My Access Tokens. Or set MONDAY_API_KEY in Netlify env vars.</>
              )}
            </p>
          </div>

          {/* Connection Status */}
          {connected && (
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-300">Connected as {connected.userName}</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1 ml-6">Workspace: {connected.accountName}</p>
            </div>
          )}
        </div>
      </AdminGlass>

      {/* Board Mapping — only shown when connected */}
      {connected && (
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-brand-red" />
            Board & Column Mapping
          </h3>

          <div className="space-y-4">
            {/* Board Selector */}
            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5">Target Board</label>
              <div className="flex gap-2">
                <select
                  value={selectedBoard}
                  onChange={e => handleBoardSelect(e.target.value)}
                  className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
                >
                  <option value="">Select a board…</option>
                  {boards.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.items_count} items)</option>
                  ))}
                </select>
                <button
                  onClick={handleLoadBoards}
                  disabled={loadingBoards}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-gray-300 bg-white/[0.04] border border-white/[0.08] rounded-xl hover:bg-white/[0.06] transition-colors disabled:opacity-40 admin-btn-press"
                >
                  {loadingBoards ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  Refresh
                </button>
              </div>
            </div>

            {/* Group Selector */}
            {selectedBoard && boardGroups.length > 0 && (
              <div>
                <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-1.5">Target Group</label>
                <select
                  value={selectedGroup}
                  onChange={e => setSelectedGroup(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
                >
                  {boardGroups.map(g => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>
                <p className="text-[10px] text-gray-600 mt-1">Items will be created in this group.</p>
              </div>
            )}

            {/* Column Mapping Table */}
            {selectedBoard && (
              <div>
                <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-2">
                  Column Mapping (GHL Field → Monday.com Column)
                  {boardColumns.length === 0 && <span className="text-gray-600 normal-case ml-1">— loading…</span>}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'source', label: 'Lead Source' },
                    { key: 'stage', label: 'Stage / Status' },
                    { key: 'value', label: 'Deal Value' },
                    { key: 'assignedTo', label: 'Assigned To' },
                  ].map(field => (
                    <div key={field.key} className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-24 shrink-0">{field.label}</span>
                      {boardColumns.length > 0 ? (
                        <select
                          value={mapping[field.key] || ''}
                          onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-brand-red/40"
                        >
                          <option value="">— skip —</option>
                          {boardColumns.filter(c => c.id !== 'name').map(col => (
                            <option key={col.id} value={col.id}>{col.title} ({col.type})</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="column_id"
                          value={mapping[field.key] || ''}
                          onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                          className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 font-mono"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 mt-2">Map GHL lead fields to your Monday.com board columns. Unmapped fields are skipped. The lead name is always used as the item name.</p>
                <button
                  onClick={handleSaveMapping}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors admin-btn-press"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save Mapping
                </button>
              </div>
            )}
          </div>
        </AdminGlass>
      )}

      {/* Sync Controls — only shown when board is selected */}
      {connected && selectedBoard && (
        <AdminGlass>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-brand-red" />
              Sync Controls
            </h3>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={handlePushLeads}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 rounded-xl hover:bg-brand-red/30 transition-colors admin-btn-press"
            >
              <Upload className="w-3.5 h-3.5" />
              Push All Leads to Monday.com
            </button>
          </div>

          {/* Sync Log */}
          {syncLog.length > 0 && (
            <div>
              <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2">Sync Log</p>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {syncLog.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px]">
                    <span className="text-gray-600 shrink-0 font-mono">{entry.time}</span>
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      entry.type === 'success' ? 'bg-emerald-400' : entry.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                    }`} />
                    <span className={entry.type === 'error' ? 'text-red-400' : 'text-gray-400'}>{entry.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </AdminGlass>
      )}

      {/* Placeholder for future integrations */}
      {!connected && (
        <AdminGlass className="!border-dashed">
          <AdminEmptyState
            icon={Plug}
            title="No Integrations Active"
            description="Connect Monday.com above to sync your lead pipeline, tasks, and project boards."
          />
        </AdminGlass>
      )}
    </div>
  )
}

// ── System Tab ──────────────────────────────────────────────────
function SystemTab({ showToast, systemHealth }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void; systemHealth: any }) {
  return (
    <div className="space-y-4">
      {/* System Health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Uptime" value={`${systemHealth.uptime}%`} icon={Wifi} color="#10B981" delay={0} />
        <AdminKPICard title="Response Time" value={`${systemHealth.responseTime}ms`} icon={Clock} color="#3B82F6" delay={50} />
        <AdminKPICard title="Error Rate" value={`${systemHealth.errorRate}%`} icon={AlertTriangle} color="#10B981" delay={100} />
        <AdminKPICard title="API Calls (24h)" value={systemHealth.apiCalls24h.toLocaleString()} icon={Server} color="#8B5CF6" delay={150} />
      </div>

      {/* Storage */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-brand-red" />
          Storage Usage
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-400">Used: {systemHealth.storageUsed} GB / {systemHealth.storageTotal} GB</span>
              <span className="text-white font-medium">{systemHealth.storageUsed}%</span>
            </div>
            <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${systemHealth.storageUsed}%`,
                  background: systemHealth.storageUsed > 80 ? '#EF4444' : systemHealth.storageUsed > 60 ? '#F59E0B' : '#10B981',
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {[
              { label: 'Documents', size: '28 GB', color: '#3B82F6' },
              { label: 'Backups', size: '22 GB', color: '#8B5CF6' },
              { label: 'Reports', size: '12 GB', color: '#10B981' },
              { label: 'System', size: '6 GB', color: '#F59E0B' },
            ].map(item => (
              <div key={item.label} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-xs text-gray-400">{item.label}</span>
                </div>
                <p className="text-sm font-semibold text-white">{item.size}</p>
              </div>
            ))}
          </div>
        </div>
      </AdminGlass>

      {/* Backups */}
      <AdminGlass>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-brand-red" />
            Backup Management
          </h3>
          <button
            onClick={async () => {
              showToast('Generating backup snapshot...', 'info')
              const snapshot = JSON.stringify({ exportedAt: new Date().toISOString(), platform: 'GHL India Ventures', settings: true, data: 'snapshot' }, null, 2)
              const blob = new Blob([snapshot], { type: 'application/json' })
              await saveBlobAs(blob, `GHL_Backup_${new Date().toISOString().slice(0,10)}.json`, showToast as any)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 rounded-lg hover:bg-brand-red/30 transition-colors admin-btn-press"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Backup Now
          </button>
        </div>
        <div className="space-y-2">
          {([] as { id: string; date: string; size: string; type: string; status: string }[]).map(backup => (
            <div key={backup.id} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm text-white">{formatDate(backup.date)}</p>
                  <p className="text-[11px] text-gray-500">{backup.size} • {backup.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AdminBadge label="Completed" variant="success" dot />
                <button
                  onClick={async () => {
                    showToast('Downloading backup file...', 'info')
                    const snapshot = JSON.stringify({ backupId: backup.id, date: backup.date, size: backup.size, type: backup.type }, null, 2)
                    const blob = new Blob([snapshot], { type: 'application/json' })
                    await saveBlobAs(blob, `GHL_Backup_${backup.id}.json`, showToast as any)
                  }}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"
                  title="Download Backup"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminGlass>

      {/* API Configuration */}
      <AdminGlass>
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Key className="w-4 h-4 text-brand-red" />
          API Configuration
        </h3>
        <div className="space-y-3">
          {[
            { label: 'API Endpoint', value: 'https://api.ghlindiaventures.com/v2', status: 'Active' },
            { label: 'Webhook URL', value: 'https://api.ghlindiaventures.com/webhooks', status: 'Active' },
            { label: 'Rate Limit', value: '1000 requests/min', status: 'Active' },
            { label: 'API Version', value: 'v2.0.0', status: 'Current' },
          ].map(api => (
            <div key={api.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <div>
                <p className="text-sm text-white">{api.label}</p>
                <p className="text-[11px] text-gray-500 font-mono">{api.value}</p>
              </div>
              <div className="flex items-center gap-2">
                <AdminBadge label={api.status} variant="success" />
                <button
                  onClick={() => { navigator.clipboard?.writeText(api.value); showToast('Copied to clipboard', 'success') }}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </AdminGlass>
    </div>
  )
}

// ── Password Vault Tab (Super Admin only) ────────────────────────
// Shows admin-set temporary passwords created via the
// admin-password-reset Netlify function. RLS limits SELECT to
// profiles.role='super_admin', so this query naturally returns [] for
// any non-super-admin even if the route is opened directly.
interface VaultRow {
  id: string
  target_user_id: string | null
  target_email: string
  target_name: string | null
  target_kind: string
  plaintext_password: string
  set_by_admin_email: string | null
  notes: string | null
  created_at: string
  expires_at: string
  view_count: number
}

function PasswordVaultTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [rows, setRows] = useState<VaultRow[]>([])
  const [loading, setLoading] = useState(true)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    if (!isSupabaseConfigured()) { setLoading(false); return }
    const sb: any = supabase
    const { data, error } = await sb
      .from('admin_password_vault')
      .select('id, target_user_id, target_email, target_name, target_kind, plaintext_password, set_by_admin_email, notes, created_at, expires_at, view_count')
      .order('created_at', { ascending: false })
      .limit(500)
    if (error) {
      console.warn('[settings/password-vault] load error:', error.message)
      showToast('Failed to load vault — your role may not permit it.', 'error')
    } else {
      setRows((data || []) as VaultRow[])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const toggleReveal = async (row: VaultRow) => {
    setRevealedIds(prev => {
      const next = new Set(prev)
      if (next.has(row.id)) next.delete(row.id)
      else next.add(row.id)
      return next
    })
    // Bump view_count + last_viewed_at on first reveal in this session.
    if (!revealedIds.has(row.id) && isSupabaseConfigured()) {
      try {
        const sb: any = supabase
        await sb.from('admin_password_vault')
          .update({ last_viewed_at: new Date().toISOString(), view_count: (row.view_count || 0) + 1 })
          .eq('id', row.id)
      } catch { /* non-fatal */ }
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showToast('Copied to clipboard', 'success')
    } catch {
      showToast('Copy failed — please select and copy manually', 'warning')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(r =>
      r.target_email.toLowerCase().includes(q) ||
      (r.target_name || '').toLowerCase().includes(q) ||
      (r.set_by_admin_email || '').toLowerCase().includes(q),
    )
  }, [rows, search])

  return (
    <div className="space-y-4">
      <AdminGlass padding="p-5">
        <div className="flex items-start gap-3">
          <Key className="w-5 h-5 text-amber-400 mt-0.5" />
          <div className="text-xs text-gray-300 space-y-1.5">
            <p>This vault stores <span className="font-semibold text-white">admin-set temporary passwords</span> only — passwords the user set themselves are bcrypt-hashed by Supabase Auth and cannot be displayed.</p>
            <p>Entries auto-expire after 90 days. Every reveal is recorded in <code className="text-amber-400">view_count</code> and <code className="text-amber-400">last_viewed_at</code>. Treat these credentials as sensitive — share them only through secure channels.</p>
          </div>
        </div>
      </AdminGlass>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by user email, name, or admin who set it…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20"
          />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-gray-300 hover:text-white transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <AdminGlass padding="p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 text-brand-red animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <AdminEmptyState
            icon={Key}
            title="No vault entries"
            description={rows.length === 0
              ? 'No admin-set temporary passwords have been recorded yet. They appear here automatically when admins set a temp password from a client/employee profile.'
              : 'No entries match your search.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase text-gray-500 border-b border-white/[0.06]">
                  <th className="text-left py-3 px-4">User</th>
                  <th className="text-left py-3 px-4">Kind</th>
                  <th className="text-left py-3 px-4">Temporary Password</th>
                  <th className="text-left py-3 px-4">Set By</th>
                  <th className="text-left py-3 px-4">Set At</th>
                  <th className="text-left py-3 px-4">Expires</th>
                  <th className="text-right py-3 px-4">Views</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(row => {
                  const revealed = revealedIds.has(row.id)
                  const isExpired = new Date(row.expires_at).getTime() < Date.now()
                  return (
                    <tr key={row.id} className={`border-b border-white/[0.04] ${isExpired ? 'opacity-50' : ''}`}>
                      <td className="py-3 px-4">
                        <div className="text-xs text-white font-medium">{row.target_name || row.target_email}</div>
                        <div className="text-[11px] text-gray-500">{row.target_email}</div>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-gray-400 capitalize">{row.target_kind}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <code className="px-2 py-1 rounded bg-black/40 text-xs text-white font-mono break-all min-w-[140px]">
                            {revealed ? row.plaintext_password : '•'.repeat(Math.min(16, row.plaintext_password.length))}
                          </code>
                          <button
                            type="button"
                            onClick={() => toggleReveal(row)}
                            className="p-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 hover:text-white"
                            title={revealed ? 'Hide' : 'Reveal'}
                          >
                            {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copy(row.plaintext_password)}
                            className="p-1.5 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-gray-300 hover:text-white"
                            title="Copy"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px] text-gray-400">{row.set_by_admin_email || '—'}</td>
                      <td className="py-3 px-4 text-[11px] text-gray-400">{formatDate(row.created_at)}</td>
                      <td className="py-3 px-4 text-[11px]">
                        <span className={isExpired ? 'text-red-400' : 'text-gray-400'}>
                          {isExpired ? 'Expired' : formatDate(row.expires_at)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-[11px] text-gray-400">{row.view_count}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminGlass>
    </div>
  )
}

