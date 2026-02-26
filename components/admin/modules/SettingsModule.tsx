'use client'

import { useState, useMemo } from 'react'
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
import { EMPLOYEES_DATA, SYSTEM_HEALTH } from '@/lib/admin/adminMockData'
import { ROLE_PERMISSIONS } from '@/lib/admin/adminRBAC'
import { ROLE_LABELS } from '@/lib/admin/adminAuth'
import { formatDate } from '@/lib/admin/adminHooks'
import type { AdminRole } from '@/lib/admin/adminTypes'
import { saveBlobAs } from '@/lib/supabase/storageService'

// ── Sub-tabs ─────────────────────────────────────────────────────
const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'integrations', label: 'Integrations', icon: Plug },
  { id: 'system', label: 'System', icon: Server },
] as const

type SettingsTab = typeof SETTINGS_TABS[number]['id']

interface SettingsModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function SettingsModule({ subTab, navigate, showToast }: SettingsModuleProps) {
  const activeTab = (SETTINGS_TABS.some(t => t.id === subTab) ? subTab : 'general') as SettingsTab

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
        {SETTINGS_TABS.map(tab => {
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
        {activeTab === 'permissions' && <PermissionsTab />}
        {activeTab === 'security' && <SecurityTab showToast={showToast} />}
        {activeTab === 'integrations' && <IntegrationsTab showToast={showToast} />}
        {activeTab === 'system' && <SystemTab showToast={showToast} />}
      </div>
    </div>
  )
}

// ── General Settings ────────────────────────────────────────────
function GeneralTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [settings, setSettings] = useState({
    companyName: 'GHL India Ventures Pvt. Ltd.',
    email: 'admin@ghlindiaventures.com',
    phone: '+91 7200 255 252',
    sebiReg: 'IN/AIF2/2425/1517',
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

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
    showToast('Setting updated', 'success')
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
          {[
            { label: 'Company Name', value: settings.companyName, icon: Globe },
            { label: 'Admin Email', value: settings.email, icon: Mail },
            { label: 'Phone', value: settings.phone, icon: Smartphone },
            { label: 'SEBI Registration', value: settings.sebiReg, icon: Shield },
            { label: 'Timezone', value: settings.timezone, icon: Clock },
            { label: 'Currency', value: settings.currency, icon: Key },
            { label: 'Fiscal Year', value: settings.fiscalYear, icon: Clock },
          ].map(field => {
            const Icon = field.icon
            return (
              <div key={field.label} className="space-y-1.5">
                <label className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">{field.label}</label>
                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <Icon className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{field.value}</span>
                </div>
              </div>
            )
          })}
        </div>
        <button
          onClick={() => showToast('Settings saved (demo mode)', 'success')}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors admin-btn-press"
        >
          <Save className="w-4 h-4" />
          Save Changes
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
function PermissionsTab() {
  const [permView, setPermView] = useState<'roles' | 'users' | 'matrix' | 'audit' | 'presets'>('roles')
  const roles = Object.keys(ROLE_LABELS) as AdminRole[]
  const allModules = ['overview', 'clients', 'sales', 'realty-brokers', 'employees', 'assets', 'ai-ops', 'compliance', 'financial', 'analytics', 'comms', 'marketing', 'reports', 'settings']
  const allActions = ['view', 'create', 'edit', 'approve', 'delete', 'export', 'configure']
  const [expandedRole, setExpandedRole] = useState<AdminRole | null>(null)

  const userAssignments = [
    { email: 'admin@ghlindiaventures.com', name: 'Abe Thayil', role: 'super-admin' as AdminRole, dept: 'Executive', lastActive: '2026-02-24T10:00:00' },
    { email: 'compliance@ghlindiaventures.com', name: 'Meera Subramaniam', role: 'compliance-officer' as AdminRole, dept: 'Compliance', lastActive: '2026-02-24T09:30:00' },
    { email: 'manager@ghlindiaventures.com', name: 'Venkatesh Raghavan', role: 'fund-manager' as AdminRole, dept: 'Investments', lastActive: '2026-02-23T18:00:00' },
    { email: 'sales@ghlindiaventures.com', name: 'Priya Natarajan', role: 'sales' as AdminRole, dept: 'Sales', lastActive: '2026-02-24T08:45:00' },
    { email: 'viewer@ghlindiaventures.com', name: 'Rajiv Kumar', role: 'viewer' as AdminRole, dept: 'Reporting', lastActive: '2026-02-22T15:00:00' },
    { email: 'mktmgr@ghlindiaventures.com', name: 'Kavitha Rangan', role: 'marketing-manager' as AdminRole, dept: 'Marketing', lastActive: '2026-02-24T11:00:00' },
    { email: 'mktexec@ghlindiaventures.com', name: 'Arun Selvam', role: 'marketing-executive' as AdminRole, dept: 'Marketing', lastActive: '2026-02-24T07:30:00' },
  ]

  const permAuditLog = [
    { id: 'PA-001', timestamp: '2026-02-24T10:15:00', user: 'Abe Thayil', action: 'Granted', target: 'Priya Natarajan', detail: 'Added create:realty-brokers permission', module: 'Realty Brokers' },
    { id: 'PA-002', timestamp: '2026-02-23T16:40:00', user: 'Abe Thayil', action: 'Role Changed', target: 'Arun Selvam', detail: 'Changed from viewer to marketing-executive', module: 'User Roles' },
    { id: 'PA-003', timestamp: '2026-02-22T14:20:00', user: 'Abe Thayil', action: 'Revoked', target: 'Rajiv Kumar', detail: 'Removed export:financial permission', module: 'Financial' },
    { id: 'PA-004', timestamp: '2026-02-21T09:00:00', user: 'Abe Thayil', action: 'Created', target: 'Custom Role', detail: 'Created Marketing Manager role preset', module: 'System' },
    { id: 'PA-005', timestamp: '2026-02-20T11:30:00', user: 'Abe Thayil', action: 'Granted', target: 'Meera Subramaniam', detail: 'Added view:marketing permission', module: 'Marketing' },
    { id: 'PA-006', timestamp: '2026-02-19T15:10:00', user: 'Abe Thayil', action: 'Bulk Update', target: '3 users', detail: 'Applied Read-Only Analyst preset', module: 'System' },
    { id: 'PA-007', timestamp: '2026-02-18T08:45:00', user: 'Abe Thayil', action: 'Role Changed', target: 'Kavitha Rangan', detail: 'Changed from sales to marketing-manager', module: 'User Roles' },
    { id: 'PA-008', timestamp: '2026-02-17T17:00:00', user: 'System', action: 'Auto-Revoked', target: 'Former Employee', detail: 'Session expired and permissions cleared', module: 'System' },
  ]

  const presets = [
    { id: 'PR-001', name: 'Read-Only Analyst', description: 'View-only access to all reports and analytics modules', permCount: 6, usedBy: 2 },
    { id: 'PR-002', name: 'Sales Executive', description: 'Full CRM access with client view and basic reporting', permCount: 12, usedBy: 3 },
    { id: 'PR-003', name: 'Compliance Team', description: 'Full compliance access with client KYC approval rights', permCount: 14, usedBy: 1 },
    { id: 'PR-004', name: 'Marketing Power User', description: 'All marketing tools plus AI ops and analytics export', permCount: 18, usedBy: 2 },
    { id: 'PR-005', name: 'Department Head', description: 'Full departmental access with approval rights and exports', permCount: 20, usedBy: 1 },
  ]

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
            </h3>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 rounded-lg hover:bg-brand-red/30 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              Add User
            </button>
          </div>
          <div className="space-y-2">
            {userAssignments.map(user => (
              <div key={user.email} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-red/10 flex items-center justify-center text-white text-xs font-bold">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm text-white font-medium">{user.name}</p>
                    <p className="text-[11px] text-gray-500">{user.email} &middot; {user.dept}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <AdminBadge
                    label={ROLE_LABELS[user.role]}
                    variant={user.role === 'super-admin' ? 'error' : user.role.includes('admin') ? 'warning' : 'info'}
                  />
                  <span className="text-[10px] text-gray-600 hidden sm:inline">{formatDate(user.lastActive)}</span>
                </div>
              </div>
            ))}
          </div>
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
          </h3>
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
                  <p className="text-[11px] text-gray-500 mt-0.5">{entry.detail}</p>
                  <p className="text-[10px] text-gray-600 mt-1">by {entry.user} &middot; {formatDate(entry.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
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
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Pre-configured role templates for quick user setup</p>
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 rounded-lg hover:bg-brand-red/30 transition-colors">
              <Plus className="w-3.5 h-3.5" />
              New Preset
            </button>
          </div>
          {presets.map(preset => (
            <AdminGlass key={preset.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                    <Shield className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{preset.name}</p>
                    <p className="text-[11px] text-gray-500">{preset.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-white font-medium">{preset.permCount} perms</p>
                    <p className="text-[10px] text-gray-500">{preset.usedBy} user{preset.usedBy !== 1 ? 's' : ''}</p>
                  </div>
                  <button className="p-2 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors" title="Apply preset">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </AdminGlass>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Security Settings ───────────────────────────────────────────
function SecurityTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const securityEvents = [
    { id: 'SE-001', event: 'Successful Login', user: 'admin@ghlindiaventures.com', ip: '103.42.xx.xx', time: '2025-03-20T10:00:00', status: 'success' },
    { id: 'SE-002', event: 'Failed Login Attempt', user: 'unknown@test.com', ip: '185.220.xx.xx', time: '2025-03-20T08:15:00', status: 'failed' },
    { id: 'SE-003', event: 'Password Changed', user: 'sales@ghlindiaventures.com', ip: '103.42.xx.xx', time: '2025-03-19T16:30:00', status: 'success' },
    { id: 'SE-004', event: 'Session Expired', user: 'compliance@ghlindiaventures.com', ip: '103.42.xx.xx', time: '2025-03-19T14:00:00', status: 'info' },
    { id: 'SE-005', event: 'Failed Login (3 attempts)', user: 'unknown@domain.com', ip: '45.33.xx.xx', time: '2025-03-18T22:45:00', status: 'failed' },
  ]

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
            { label: 'Session Timeout', value: '8 hours of inactivity', status: 'Active' },
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
function IntegrationsTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
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

  // Load persisted state on mount
  useState(() => {
    if (typeof window === 'undefined') return
    const { getMondayApiKey, isMondayConfigured, getSavedMappings } = require('@/lib/mondayService')

    // Check whether the server has MONDAY_API_KEY env var configured
    fetch('/.netlify/functions/monday-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: '__check_config__' }),
    })
      .then(r => r.json())
      .then(d => {
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
      const { LEADS_DATA } = await import('@/lib/admin/adminMockData')
      const result = await pushLeadsToMonday(LEADS_DATA, selectedBoard, mapping)
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
                  onChange={e => setSelectedBoard(e.target.value)}
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

            {/* Column Mapping Table */}
            {selectedBoard && (
              <div>
                <label className="block text-[11px] text-gray-500 uppercase tracking-wider font-medium mb-2">Column Mapping (GHL Field → Monday.com Column ID)</label>
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
                      <input
                        type="text"
                        placeholder="column_id"
                        value={mapping[field.key] || ''}
                        onChange={e => setMapping(m => ({ ...m, [field.key]: e.target.value }))}
                        className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 font-mono"
                      />
                    </div>
                  ))}
                </div>
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
function SystemTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  return (
    <div className="space-y-4">
      {/* System Health */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Uptime" value={`${SYSTEM_HEALTH.uptime}%`} icon={Wifi} color="#10B981" delay={0} />
        <AdminKPICard title="Response Time" value={`${SYSTEM_HEALTH.responseTime}ms`} icon={Clock} color="#3B82F6" delay={50} />
        <AdminKPICard title="Error Rate" value={`${SYSTEM_HEALTH.errorRate}%`} icon={AlertTriangle} color="#10B981" delay={100} />
        <AdminKPICard title="API Calls (24h)" value={SYSTEM_HEALTH.apiCalls24h.toLocaleString()} icon={Server} color="#8B5CF6" delay={150} />
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
              <span className="text-gray-400">Used: {SYSTEM_HEALTH.storageUsed} GB / {SYSTEM_HEALTH.storageTotal} GB</span>
              <span className="text-white font-medium">{SYSTEM_HEALTH.storageUsed}%</span>
            </div>
            <div className="h-3 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${SYSTEM_HEALTH.storageUsed}%`,
                  background: SYSTEM_HEALTH.storageUsed > 80 ? '#EF4444' : SYSTEM_HEALTH.storageUsed > 60 ? '#F59E0B' : '#10B981',
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
          {[
            { id: 'BK-001', date: '2025-03-20T02:00:00', size: '2.4 GB', type: 'Automated', status: 'completed' },
            { id: 'BK-002', date: '2025-03-19T02:00:00', size: '2.3 GB', type: 'Automated', status: 'completed' },
            { id: 'BK-003', date: '2025-03-18T02:00:00', size: '2.3 GB', type: 'Automated', status: 'completed' },
            { id: 'BK-004', date: '2025-03-17T14:30:00', size: '2.3 GB', type: 'Manual', status: 'completed' },
            { id: 'BK-005', date: '2025-03-17T02:00:00', size: '2.2 GB', type: 'Automated', status: 'completed' },
          ].map(backup => (
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
