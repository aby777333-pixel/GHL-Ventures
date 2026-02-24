'use client'

import { useState, useMemo } from 'react'
import {
  Shield, CheckCircle2, XCircle, Clock, AlertTriangle,
  Eye, FileText, Scale, History, Flag, ArrowUpRight,
  Filter, Search, Calendar, User, ChevronRight, AlertCircle,
  Gavel, BookOpen, ShieldAlert, ShieldCheck,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge, { getSeverityBadgeVariant } from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import AdminEmptyState from '../shared/AdminEmptyState'
import { APPROVALS_DATA, RISK_FLAGS_DATA, ACTIVITY_FEED } from '@/lib/admin/adminMockData'
import { formatDate, formatTimeAgo } from '@/lib/admin/adminHooks'
import type { Approval, RiskFlag, ApprovalStatus, AuditEntry } from '@/lib/admin/adminTypes'

// ── Mock Audit Trail ─────────────────────────────────────────────
const AUDIT_TRAIL: AuditEntry[] = [
  { id: 'AUD-001', timestamp: '2025-03-20T10:15:00', userId: 'EMP-003', userName: 'Meera Subramaniam', action: 'Approved KYC', module: 'compliance', details: 'KYC documents approved for client Rajesh Krishnan (GHL-INV-001)' },
  { id: 'AUD-002', timestamp: '2025-03-20T09:45:00', userId: 'EMP-004', userName: 'Priya Natarajan', action: 'Updated Lead Stage', module: 'sales', details: 'Lead Ramya Venkat moved from Qualified to Proposal' },
  { id: 'AUD-003', timestamp: '2025-03-19T17:00:00', userId: 'EMP-005', userName: 'Karthik Sundaram', action: 'Uploaded Document', module: 'assets', details: 'Q4 2024 performance report uploaded for all funds' },
  { id: 'AUD-004', timestamp: '2025-03-19T15:30:00', userId: 'EMP-006', userName: 'Divya Krishnamurthy', action: 'Sent Communication', module: 'comms', details: 'Portfolio review sent to Sunita Agarwal via email' },
  { id: 'AUD-005', timestamp: '2025-03-18T16:45:00', userId: 'EMP-004', userName: 'Priya Natarajan', action: 'Closed Deal', module: 'sales', details: 'Deal with Nandini Rao closed at 1.5 Cr' },
  { id: 'AUD-006', timestamp: '2025-03-18T14:00:00', userId: 'EMP-003', userName: 'Meera Subramaniam', action: 'Created Risk Flag', module: 'compliance', details: 'Flagged unusual transaction pattern for Deepak Patel' },
  { id: 'AUD-007', timestamp: '2025-03-17T10:30:00', userId: 'EMP-001', userName: 'Abe Thayil', action: 'Modified Permissions', module: 'settings', details: 'Updated role permissions for Sales team' },
  { id: 'AUD-008', timestamp: '2025-03-16T09:00:00', userId: 'EMP-002', userName: 'Venkatesh Raghavan', action: 'Updated NAV', module: 'financial', details: 'NAV updated for Phoenix Towers Fund — 1,247.50' },
]

// ── Sub-tabs ─────────────────────────────────────────────────────
const COMPLIANCE_TABS = [
  { id: 'approvals', label: 'Approvals', icon: CheckCircle2 },
  { id: 'risk-flags', label: 'Risk Flags', icon: Flag },
  { id: 'audit-trail', label: 'Audit Trail', icon: History },
  { id: 'regulations', label: 'Regulations', icon: Gavel },
] as const

type ComplianceTab = typeof COMPLIANCE_TABS[number]['id']

interface ComplianceModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function ComplianceModule({ subTab, navigate, showToast }: ComplianceModuleProps) {
  const activeTab = (COMPLIANCE_TABS.some(t => t.id === subTab) ? subTab : 'approvals') as ComplianceTab

  const kpis = useMemo(() => {
    const pending = APPROVALS_DATA.filter(a => a.status === 'pending').length
    const openRisks = RISK_FLAGS_DATA.filter(r => r.status === 'open' || r.status === 'investigating').length
    const critical = RISK_FLAGS_DATA.filter(r => r.severity === 'critical').length
    return { pending, openRisks, critical, auditEntries: AUDIT_TRAIL.length, complianceScore: 94 }
  }, [])

  const handleTabClick = (tabId: string) => {
    navigate(tabId === 'approvals' ? 'compliance' : `compliance/${tabId}`)
  }

  return (
    <div className="space-y-6 admin-section-enter">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Compliance & Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Approval workflows, risk management, and audit trails</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <AdminKPICard title="Compliance Score" value={`${kpis.complianceScore}%`} icon={ShieldCheck} color="#10B981" delay={0} />
        <AdminKPICard title="Pending Approvals" value={kpis.pending} icon={Clock} color="#F59E0B" delay={50} />
        <AdminKPICard title="Open Risk Flags" value={kpis.openRisks} icon={Flag} color="#EF4444" delay={100} />
        <AdminKPICard title="Critical Alerts" value={kpis.critical} icon={AlertTriangle} color="#DC2626" delay={150} />
        <AdminKPICard title="Audit Entries" value={kpis.auditEntries} icon={History} color="#3B82F6" delay={200} />
      </div>

      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {COMPLIANCE_TABS.map(tab => {
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
        {activeTab === 'approvals' && <ApprovalsTab showToast={showToast} />}
        {activeTab === 'risk-flags' && <RiskFlagsTab showToast={showToast} />}
        {activeTab === 'audit-trail' && <AuditTrailTab />}
        {activeTab === 'regulations' && <RegulationsTab />}
      </div>
    </div>
  )
}

// ── Approvals Tab ───────────────────────────────────────────────
function ApprovalsTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const [statusFilter, setStatusFilter] = useState<ApprovalStatus | 'all'>('all')
  const [reviewApproval, setReviewApproval] = useState<Approval | null>(null)
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null)

  const filtered = useMemo(() => {
    if (statusFilter === 'all') return APPROVALS_DATA
    return APPROVALS_DATA.filter(a => a.status === statusFilter)
  }, [statusFilter])

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'kyc': return ShieldCheck
      case 'investment': return ArrowUpRight
      case 'document': return FileText
      case 'payout': return Calendar
      default: return CheckCircle2
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(['all', 'pending', 'approved', 'rejected', 'escalated'] as const).map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              statusFilter === status
                ? 'bg-brand-red/20 text-white border-brand-red/30'
                : 'bg-white/[0.03] text-gray-500 border-white/[0.06] hover:bg-white/[0.06]'
            }`}
          >
            {status === 'all' ? `All (${APPROVALS_DATA.length})` : `${status.charAt(0).toUpperCase() + status.slice(1)} (${APPROVALS_DATA.filter(a => a.status === status).length})`}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(approval => {
          const TypeIcon = getTypeIcon(approval.type)
          return (
            <AdminGlass key={approval.id} padding="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl ${
                    approval.priority === 'critical' ? 'bg-red-500/15' :
                    approval.priority === 'high' ? 'bg-amber-500/15' :
                    'bg-blue-500/15'
                  }`}>
                    <TypeIcon className={`w-4 h-4 ${
                      approval.priority === 'critical' ? 'text-red-400' :
                      approval.priority === 'high' ? 'text-amber-400' :
                      'text-blue-400'
                    }`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{approval.description}</span>
                      <AdminBadge label={approval.type.toUpperCase()} variant="neutral" />
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500">
                      <span>Requested by {approval.requestedBy}</span>
                      <span>{formatDate(approval.date)}</span>
                      {approval.assignedReviewer && <span>Reviewer: {approval.assignedReviewer}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <AdminBadge label={approval.priority} variant={getSeverityBadgeVariant(approval.priority)} />
                  {approval.status === 'pending' ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => { setReviewApproval(approval); setReviewAction('approve') }}
                        className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-500 hover:text-emerald-400 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => { setReviewApproval(approval); setReviewAction('reject') }}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <AdminBadge
                      label={approval.status}
                      variant={approval.status === 'approved' ? 'success' : approval.status === 'rejected' ? 'error' : 'warning'}
                      dot
                    />
                  )}
                </div>
              </div>
            </AdminGlass>
          )
        })}
        {filtered.length === 0 && (
          <AdminGlass><AdminEmptyState title="No approvals" description="No approval requests match the selected filter." /></AdminGlass>
        )}
      </div>

      {/* ── Approval Review Confirmation Modal ── */}
      <AdminModal
        isOpen={!!reviewApproval && !!reviewAction}
        onClose={() => { setReviewApproval(null); setReviewAction(null) }}
        title={reviewAction === 'approve' ? 'Approve Request' : 'Reject Request'}
        maxWidth="max-w-md"
      >
        {reviewApproval && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-500">{reviewApproval.id}</span>
                <AdminBadge label={reviewApproval.priority} variant={getSeverityBadgeVariant(reviewApproval.priority)} />
              </div>
              <h3 className="text-sm font-medium text-white">{reviewApproval.description}</h3>
              <p className="text-xs text-gray-500 mt-1">Requested by {reviewApproval.requestedBy} on {formatDate(reviewApproval.date)}</p>
              <div className="flex items-center gap-2 mt-2">
                <AdminBadge label={reviewApproval.type.toUpperCase()} variant="neutral" />
                {reviewApproval.assignedReviewer && (
                  <span className="text-xs text-gray-500">Reviewer: {reviewApproval.assignedReviewer}</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Reviewer Notes</label>
              <textarea
                rows={3}
                placeholder="Add notes about this decision..."
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <button
                onClick={() => { setReviewApproval(null); setReviewAction(null) }}
                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  showToast(
                    reviewAction === 'approve'
                      ? `${reviewApproval.id} approved successfully`
                      : `${reviewApproval.id} rejected`,
                    reviewAction === 'approve' ? 'success' : 'error'
                  )
                  setReviewApproval(null)
                  setReviewAction(null)
                }}
                className={`px-5 py-2 rounded-xl text-sm font-medium text-white transition-colors ${
                  reviewAction === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  )
}

// ── Risk Flags Tab ──────────────────────────────────────────────
function RiskFlagsTab({ showToast }: { showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void }) {
  const columns: Column<RiskFlag>[] = [
    {
      key: 'severity',
      label: 'Severity',
      render: (row) => <AdminBadge label={row.severity} variant={getSeverityBadgeVariant(row.severity)} dot />,
    },
    {
      key: 'title',
      label: 'Issue',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.title}</p>
          <p className="text-[11px] text-gray-500 truncate max-w-[300px]">{row.description}</p>
        </div>
      ),
    },
    { key: 'affectedEntity', label: 'Affected', render: (row) => <span className="text-xs text-gray-300">{row.affectedEntity}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <AdminBadge
          label={row.status}
          variant={row.status === 'resolved' ? 'success' : row.status === 'investigating' ? 'warning' : row.status === 'escalated' ? 'error' : 'info'}
          dot
        />
      ),
    },
    { key: 'assignedTo', label: 'Assigned To', render: (row) => <span className="text-xs text-gray-400">{row.assignedTo || '—'}</span> },
    { key: 'createdDate', label: 'Created', render: (row) => <span className="text-xs text-gray-400">{formatDate(row.createdDate)}</span> },
    {
      key: 'actions',
      label: '',
      sortable: false,
      width: '80px',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); showToast(`Investigating ${row.title}`, 'info') }}
          className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-gray-400 bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] transition-colors"
        >
          Review
        </button>
      ),
    },
  ]

  return (
    <AdminGlass padding="p-4">
      <AdminDataTable<RiskFlag>
        columns={columns}
        data={RISK_FLAGS_DATA}
        searchKeys={['title', 'description', 'affectedEntity']}
        searchPlaceholder="Search risk flags..."
        title="Active Risk Flags"
      />
    </AdminGlass>
  )
}

// ── Audit Trail Tab ─────────────────────────────────────────────
function AuditTrailTab() {
  const columns: Column<AuditEntry>[] = [
    {
      key: 'timestamp',
      label: 'Time',
      render: (row) => (
        <div>
          <p className="text-xs text-gray-300">{formatDate(row.timestamp)}</p>
          <p className="text-[10px] text-gray-500">{new Date(row.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
      ),
    },
    { key: 'userName', label: 'User', render: (row) => <span className="text-sm font-medium text-white">{row.userName}</span> },
    {
      key: 'action',
      label: 'Action',
      render: (row) => <AdminBadge label={row.action} variant="info" />,
    },
    { key: 'module', label: 'Module', render: (row) => <AdminBadge label={row.module} variant="purple" /> },
    { key: 'details', label: 'Details', render: (row) => <span className="text-xs text-gray-400 truncate max-w-[300px] block">{row.details}</span> },
  ]

  return (
    <AdminGlass padding="p-4">
      <AdminDataTable<AuditEntry>
        columns={columns}
        data={AUDIT_TRAIL}
        searchKeys={['userName', 'action', 'module', 'details']}
        searchPlaceholder="Search audit trail..."
        exportable
        title="Audit Trail"
        emptyMessage="No audit entries found"
      />
    </AdminGlass>
  )
}

// ── Regulations Tab ─────────────────────────────────────────────
function RegulationsTab() {
  const regulations = [
    { id: 'REG-001', title: 'SEBI (AIF) Regulations 2012', status: 'Compliant', lastReview: '2025-02-15', nextReview: '2025-05-15', icon: Scale },
    { id: 'REG-002', title: 'Prevention of Money Laundering Act (PMLA)', status: 'Compliant', lastReview: '2025-01-20', nextReview: '2025-04-20', icon: Shield },
    { id: 'REG-003', title: 'Companies Act 2013 — Section 185/186', status: 'Review Due', lastReview: '2024-12-10', nextReview: '2025-03-31', icon: Gavel },
    { id: 'REG-004', title: 'RBI Master Directions on KYC', status: 'Compliant', lastReview: '2025-02-01', nextReview: '2025-05-01', icon: BookOpen },
    { id: 'REG-005', title: 'SEBI Circular on Investor Grievance Redressal', status: 'Compliant', lastReview: '2025-01-15', nextReview: '2025-04-15', icon: ShieldAlert },
    { id: 'REG-006', title: 'Income Tax Act — Section 115UB (AIF Taxation)', status: 'Compliant', lastReview: '2025-03-01', nextReview: '2025-06-01', icon: FileText },
  ]

  return (
    <AdminGlass>
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <Gavel className="w-4 h-4 text-brand-red" />
        Regulatory Compliance Status
      </h3>
      <div className="space-y-3">
        {regulations.map(reg => {
          const Icon = reg.icon
          const isReviewDue = reg.status === 'Review Due'
          return (
            <div key={reg.id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
              isReviewDue ? 'bg-amber-500/[0.05] border-amber-500/20' : 'bg-white/[0.02] border-white/[0.04]'
            } hover:bg-white/[0.04]`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isReviewDue ? 'bg-amber-500/15' : 'bg-emerald-500/10'}`}>
                  <Icon className={`w-4 h-4 ${isReviewDue ? 'text-amber-400' : 'text-emerald-400'}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{reg.title}</p>
                  <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5">
                    <span>Last reviewed: {formatDate(reg.lastReview)}</span>
                    <span>Next review: {formatDate(reg.nextReview)}</span>
                  </div>
                </div>
              </div>
              <AdminBadge
                label={reg.status}
                variant={isReviewDue ? 'warning' : 'success'}
                dot
              />
            </div>
          )
        })}
      </div>
    </AdminGlass>
  )
}
