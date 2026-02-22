/* ================================================================
   ADMIN COMMAND CENTER — CONSTANTS & NAVIGATION CONFIG
   ================================================================ */

import type { AdminModule, Permission } from './adminTypes'

// ── Sidebar Navigation Config ─────────────────────────────────────
export interface SidebarItem {
  id: AdminModule
  label: string
  iconName: string
  badge?: number | string
  permission: Permission
  subItems?: { id: string; label: string }[]
}

export const ADMIN_SIDEBAR_ITEMS: SidebarItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    iconName: 'LayoutDashboard',
    permission: 'view:overview',
  },
  {
    id: 'clients',
    label: 'Clients',
    iconName: 'Users',
    badge: 3,
    permission: 'view:clients',
    subItems: [
      { id: 'clients', label: 'All Clients' },
      { id: 'clients/kyc-queue', label: 'KYC Queue' },
    ],
  },
  {
    id: 'sales',
    label: 'Sales & CRM',
    iconName: 'TrendingUp',
    permission: 'view:sales',
    subItems: [
      { id: 'sales', label: 'Dashboard' },
      { id: 'sales/pipeline', label: 'Pipeline' },
      { id: 'sales/leads', label: 'Leads' },
      { id: 'sales/commissions', label: 'Commissions' },
      { id: 'sales/leaderboard', label: 'Leaderboard' },
    ],
  },
  {
    id: 'employees',
    label: 'People & HR',
    iconName: 'UserCheck',
    permission: 'view:employees',
    subItems: [
      { id: 'employees', label: 'Directory' },
      { id: 'employees/attendance', label: 'Attendance' },
      { id: 'employees/leave', label: 'Leave' },
      { id: 'employees/performance', label: 'Performance' },
    ],
  },
  {
    id: 'assets',
    label: 'Assets & Docs',
    iconName: 'FolderOpen',
    permission: 'view:assets',
    subItems: [
      { id: 'assets', label: 'Inventory' },
      { id: 'assets/documents', label: 'Documents' },
    ],
  },
  {
    id: 'ai-ops',
    label: 'AI Operations',
    iconName: 'Sparkles',
    badge: 'AI',
    permission: 'view:ai-ops',
    subItems: [
      { id: 'ai-ops', label: 'AI Hub' },
      { id: 'ai-ops/doc-analyzer', label: 'Document Analyzer' },
      { id: 'ai-ops/risk-engine', label: 'Risk Engine' },
      { id: 'ai-ops/contract-gen', label: 'Contract Generator' },
      { id: 'ai-ops/proposal-builder', label: 'Proposal Builder' },
      { id: 'ai-ops/projections', label: 'Projections' },
      { id: 'ai-ops/compliance-checker', label: 'Compliance Check' },
      { id: 'ai-ops/portfolio-optimizer', label: 'Portfolio Optimizer' },
      { id: 'ai-ops/email-composer', label: 'Email Composer' },
      { id: 'ai-ops/insights', label: 'Insights' },
      { id: 'ai-ops/assistant', label: 'AI Assistant' },
      { id: 'ai-ops/sentiment', label: 'Sentiment Analysis' },
      { id: 'ai-ops/anomaly-detector', label: 'Anomaly Detection' },
      { id: 'ai-ops/meeting-intelligence', label: 'Meeting Intelligence' },
      { id: 'ai-ops/regulatory-radar', label: 'Regulatory Radar' },
      { id: 'ai-ops/churn-predictor', label: 'Churn Predictor' },
      { id: 'ai-ops/voice-command', label: 'Voice Command' },
      { id: 'ai-ops/auto-reporter', label: 'Auto Reports' },
      { id: 'ai-ops/knowledge-base', label: 'Knowledge Base' },
    ],
  },
  {
    id: 'compliance',
    label: 'Compliance',
    iconName: 'Shield',
    badge: 5,
    permission: 'view:compliance',
    subItems: [
      { id: 'compliance', label: 'Dashboard' },
      { id: 'compliance/approvals', label: 'Approvals' },
      { id: 'compliance/risk-flags', label: 'Risk Flags' },
      { id: 'compliance/audit', label: 'Audit Trail' },
    ],
  },
  {
    id: 'financial',
    label: 'Finance',
    iconName: 'IndianRupee',
    permission: 'view:financial',
    subItems: [
      { id: 'financial', label: 'Dashboard' },
      { id: 'financial/revenue', label: 'Revenue' },
      { id: 'financial/payouts', label: 'Payouts' },
      { id: 'financial/invoices', label: 'Invoices' },
      { id: 'financial/expenses', label: 'Expenses' },
    ],
  },
  {
    id: 'analytics',
    label: 'Analytics',
    iconName: 'BarChart3',
    permission: 'view:analytics',
    subItems: [
      { id: 'analytics', label: 'Dashboard' },
      { id: 'analytics/reports', label: 'Reports' },
      { id: 'analytics/forecasting', label: 'Forecasting' },
    ],
  },
  {
    id: 'comms',
    label: 'Communications',
    iconName: 'MessageSquare',
    badge: 2,
    permission: 'view:comms',
    subItems: [
      { id: 'comms', label: 'Hub' },
      { id: 'comms/broadcast', label: 'Broadcast' },
      { id: 'comms/internal', label: 'Internal Chat' },
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    iconName: 'Settings',
    permission: 'view:settings',
    subItems: [
      { id: 'settings', label: 'General' },
      { id: 'settings/permissions', label: 'Permissions' },
      { id: 'settings/security', label: 'Security' },
      { id: 'settings/api-keys', label: 'API Keys' },
      { id: 'settings/backups', label: 'Backups' },
    ],
  },
]

// ── Module Labels ─────────────────────────────────────────────────
export const MODULE_LABELS: Record<AdminModule, string> = {
  overview: 'Master Control Overview',
  clients: 'Client Management',
  sales: 'Sales & CRM',
  employees: 'People & HR',
  assets: 'Assets & Documents',
  'ai-ops': 'AI Operations',
  compliance: 'Compliance & Approvals',
  financial: 'Financial Controls',
  analytics: 'Analytics & Reporting',
  comms: 'Communications',
  settings: 'System Settings',
}

// ── All Admin Tab Slugs (for static generation) ───────────────────
export const ALL_ADMIN_TAB_PARAMS = [
  { tab: ['overview'] },
  { tab: ['clients'] },
  { tab: ['clients', 'kyc-queue'] },
  { tab: ['clients', 'profile'] },
  { tab: ['sales'] },
  { tab: ['sales', 'pipeline'] },
  { tab: ['sales', 'leads'] },
  { tab: ['sales', 'commissions'] },
  { tab: ['sales', 'leaderboard'] },
  { tab: ['employees'] },
  { tab: ['employees', 'attendance'] },
  { tab: ['employees', 'leave'] },
  { tab: ['employees', 'performance'] },
  { tab: ['assets'] },
  { tab: ['assets', 'documents'] },
  { tab: ['ai-ops'] },
  { tab: ['ai-ops', 'doc-analyzer'] },
  { tab: ['ai-ops', 'risk-engine'] },
  { tab: ['ai-ops', 'contract-gen'] },
  { tab: ['ai-ops', 'proposal-builder'] },
  { tab: ['ai-ops', 'projections'] },
  { tab: ['ai-ops', 'compliance-checker'] },
  { tab: ['ai-ops', 'portfolio-optimizer'] },
  { tab: ['ai-ops', 'email-composer'] },
  { tab: ['ai-ops', 'insights'] },
  { tab: ['ai-ops', 'assistant'] },
  { tab: ['ai-ops', 'sentiment'] },
  { tab: ['ai-ops', 'anomaly-detector'] },
  { tab: ['ai-ops', 'meeting-intelligence'] },
  { tab: ['ai-ops', 'regulatory-radar'] },
  { tab: ['ai-ops', 'churn-predictor'] },
  { tab: ['ai-ops', 'voice-command'] },
  { tab: ['ai-ops', 'auto-reporter'] },
  { tab: ['ai-ops', 'knowledge-base'] },
  { tab: ['compliance'] },
  { tab: ['compliance', 'approvals'] },
  { tab: ['compliance', 'risk-flags'] },
  { tab: ['compliance', 'audit'] },
  { tab: ['financial'] },
  { tab: ['financial', 'revenue'] },
  { tab: ['financial', 'payouts'] },
  { tab: ['financial', 'invoices'] },
  { tab: ['financial', 'expenses'] },
  { tab: ['analytics'] },
  { tab: ['analytics', 'reports'] },
  { tab: ['analytics', 'forecasting'] },
  { tab: ['comms'] },
  { tab: ['comms', 'broadcast'] },
  { tab: ['comms', 'internal'] },
  { tab: ['settings'] },
  { tab: ['settings', 'permissions'] },
  { tab: ['settings', 'security'] },
  { tab: ['settings', 'api-keys'] },
  { tab: ['settings', 'backups'] },
]
