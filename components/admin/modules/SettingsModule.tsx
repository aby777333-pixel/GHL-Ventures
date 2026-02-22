'use client'

import { useState, useMemo } from 'react'
import {
  Settings, Shield, Users, Key, Database, Bell, Globe,
  Lock, Eye, EyeOff, CheckCircle2, AlertTriangle, Clock,
  Server, HardDrive, Wifi, RefreshCw, Download, Upload,
  Palette, Monitor, Mail, Smartphone, Copy, Trash2,
  Plus, Save, ToggleLeft, ToggleRight, ChevronRight,
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

// ── Sub-tabs ─────────────────────────────────────────────────────
const SETTINGS_TABS = [
  { id: 'general', label: 'General', icon: Settings },
  { id: 'permissions', label: 'Permissions', icon: Shield },
  { id: 'security', label: 'Security', icon: Lock },
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
  const roles = Object.keys(ROLE_LABELS) as AdminRole[]
  const modules = ['overview', 'clients', 'sales', 'employees', 'assets', 'ai-ops', 'compliance', 'financial', 'analytics', 'comms', 'settings']
  const actions = ['view', 'create', 'edit', 'approve', 'delete']

  return (
    <AdminGlass>
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-brand-red" />
        Role Permission Matrix
      </h3>
      <p className="text-xs text-gray-500 mb-4">Shows which permissions each role has across all modules</p>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr className="border-b border-white/[0.06]">
              <th className="text-left px-3 py-2 text-gray-500 uppercase tracking-wider font-medium sticky left-0 bg-black/40 backdrop-blur-sm z-10">Role</th>
              <th className="text-center px-2 py-2 text-gray-500 uppercase tracking-wider font-medium">Level</th>
              {modules.map(m => (
                <th key={m} className="text-center px-2 py-2 text-gray-500 uppercase tracking-wider font-medium whitespace-nowrap">
                  {m.replace('-', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {roles.map((role, i) => {
              const perms = ROLE_PERMISSIONS[role] || []
              const hasWildcard = perms.includes('*')
              return (
                <tr key={role} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                  <td className="px-3 py-2.5 font-medium text-white whitespace-nowrap sticky left-0 bg-black/40 backdrop-blur-sm z-10">
                    {ROLE_LABELS[role]}
                  </td>
                  <td className="text-center px-2 py-2.5">
                    <span className="text-gray-500">{i}</span>
                  </td>
                  {modules.map(mod => {
                    if (hasWildcard) {
                      return (
                        <td key={mod} className="text-center px-2 py-2.5">
                          <span className="text-emerald-400 font-bold">Full</span>
                        </td>
                      )
                    }
                    const modPerms = actions.filter(a => perms.includes(`${a}:${mod}` as never))
                    if (modPerms.length === 0) {
                      return <td key={mod} className="text-center px-2 py-2.5 text-gray-700">—</td>
                    }
                    return (
                      <td key={mod} className="text-center px-2 py-2.5">
                        <span className="text-blue-400">{modPerms.length > 3 ? 'Full' : modPerms.map(p => p.charAt(0).toUpperCase()).join('')}</span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-3 border-t border-white/[0.04] flex flex-wrap gap-3 text-[10px] text-gray-500">
        <span><span className="text-emerald-400 font-bold">Full</span> = All permissions (V/C/E/A/D)</span>
        <span><span className="text-blue-400 font-bold">V</span> = View</span>
        <span><span className="text-blue-400 font-bold">C</span> = Create</span>
        <span><span className="text-blue-400 font-bold">E</span> = Edit</span>
        <span><span className="text-blue-400 font-bold">A</span> = Approve</span>
        <span><span className="text-blue-400 font-bold">D</span> = Delete</span>
      </div>
    </AdminGlass>
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
            onClick={() => showToast('Manual backup initiated', 'success')}
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
                  onClick={() => showToast('Restore from backup coming soon', 'info')}
                  className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"
                  title="Restore"
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
