/* ================================================================
   ADMIN COMMAND CENTER — CONSTANTS & NAVIGATION CONFIG
   ================================================================ */

import type { AdminModule, Permission } from './adminTypes'

// ── Feature Flags ─────────────────────────────────────────────────
// AI_SUITE: Hidden per business decision. Set to true to re-enable.
export const FEATURE_FLAGS = {
  AI_SUITE_ENABLED: false,
}

// ── Sidebar Navigation Config ─────────────────────────────────────
// 2026-05-12: `id` was tightened to `AdminModule` originally, but the
// Super-Admin menu spec calls for multiple sidebar entries that map to
// the *same* underlying module (e.g. Investment + Leads + Referral
// all live under the `sales` module). Allowing `id` to be a string
// gives each sidebar row its own expansion + active-state keys without
// breaking permission checks (which use `permission`) or navigation
// (which uses sub-item `id` strings the AdminClient parses into a
// module + sub-tab pair).
export interface SidebarItem {
  id: string
  module: AdminModule
  label: string
  iconName: string
  badge?: number | string
  permission: Permission
  /** Optional navigation target for sidebar rows that have no sub-items but point at a specific sub-route. */
  navigateTo?: string
  subItems?: { id: string; label: string }[]
}

// ────────────────────────────────────────────────────────────────────
// Super-Admin sidebar — restructured 2026-05-12 to match the menu spec
// in "Super admin - Menu structure.pdf". Every PDF entry is linked to
// an existing route or a newly-added sub-tab; the underlying module
// routing (clients/sales/compliance/etc.) is preserved so existing
// bookmarks, ALL_ADMIN_TAB_PARAMS entries, and module sub-tab handlers
// keep working. Row-level Edit / Delete / View actions are honoured by
// the existing tables — every list view in the admin already exposes
// the kebab menu with these three actions.
// ────────────────────────────────────────────────────────────────────
export const ADMIN_SIDEBAR_ITEMS: SidebarItem[] = [
  // 1. Dashboard
  {
    id: 'overview',
    module: 'overview',
    label: 'Dashboard',
    iconName: 'LayoutDashboard',
    permission: 'view:overview',
  },
  // 2. Users
  {
    id: 'users',
    module: 'clients',
    label: 'Users',
    iconName: 'Users',
    permission: 'view:clients',
    subItems: [
      { id: 'clients', label: 'All Users' },
      { id: 'clients/channel-partners', label: 'Channel Partner' },
    ],
  },
  // 3. Investment
  {
    id: 'investment',
    module: 'sales',
    label: 'Investment',
    iconName: 'TrendingUp',
    permission: 'view:sales',
    subItems: [
      { id: 'sales/investment-plans', label: 'Plan' },
      { id: 'sales/bank-details', label: 'Bank detail' },
      { id: 'sales/fund-categories', label: 'Category' },
      { id: 'sales/investments', label: 'All investment' },
      { id: 'sales/investments-pending', label: 'Pending Investment' },
      { id: 'sales/investments-rejected', label: 'Rejected' },
      { id: 'sales/maturity-history', label: 'Maturity history' },
    ],
  },
  // 4. KYC
  {
    id: 'kyc',
    module: 'compliance',
    label: 'KYC',
    iconName: 'Shield',
    permission: 'view:compliance',
    subItems: [
      { id: 'compliance/kyc-approved', label: 'Approved' },
      { id: 'compliance', label: 'Pending' },
      { id: 'compliance/kyc-rejected', label: 'Rejected' },
    ],
  },
  // 5. Documents
  {
    id: 'documents',
    module: 'assets',
    label: 'Documents',
    iconName: 'FolderOpen',
    permission: 'view:assets',
    subItems: [
      { id: 'assets/documents', label: 'All Documents' },
      { id: 'assets/tracking', label: 'Tracking' },
      { id: 'assets', label: 'General' },
    ],
  },
  // 6. Finance payout
  {
    id: 'finance-payout',
    module: 'payouts',
    label: 'Finance payout',
    iconName: 'Banknote',
    permission: 'view:payouts',
    subItems: [
      { id: 'payouts/history', label: 'Monthly payout (All)' },
      { id: 'payouts', label: 'Current month payout' },
      { id: 'employees/payslips', label: 'Payslip' },
    ],
  },
  // 7. Referral
  {
    id: 'referral',
    module: 'sales',
    label: 'Referral',
    iconName: 'Users',
    permission: 'view:sales',
    subItems: [
      { id: 'sales/referrals', label: 'Referral Income History' },
      { id: 'sales/cp-referrals', label: 'CP Referral Income History' },
    ],
  },
  // 8. Contact
  {
    id: 'contact',
    module: 'comms',
    label: 'Contact',
    iconName: 'MessageSquare',
    permission: 'view:comms',
    navigateTo: 'comms/contact',
  },
  // 9. Support Ticket
  {
    id: 'support-ticket',
    module: 'content',
    label: 'Support Ticket',
    iconName: 'MessageSquare',
    permission: 'view:content',
    subItems: [
      { id: 'content/tickets', label: 'Pending' },
      { id: 'content/tickets-resolved', label: 'Resolved' },
      { id: 'content/tickets-rejected', label: 'Rejected' },
    ],
  },
  // 10. CMS
  {
    id: 'cms',
    module: 'content',
    label: 'CMS',
    iconName: 'Newspaper',
    permission: 'view:content',
    subItems: [
      { id: 'content', label: 'Blog' },
      { id: 'content/financial-iq', label: 'Financial IQ' },
      { id: 'content/faq', label: 'FAQ' },
      { id: 'content/broadcast', label: 'Broadcast' },
    ],
  },
  // 11. Employee
  {
    id: 'employee',
    module: 'employees',
    label: 'Employee',
    iconName: 'UserCheck',
    permission: 'view:employees',
    subItems: [
      { id: 'employees', label: 'All Employee' },
      { id: 'employees/assets', label: "Employee's Asset" },
      { id: 'employees/holidays', label: 'Company Holidays' },
    ],
  },
  // 12. Leads
  {
    id: 'leads',
    module: 'sales',
    label: 'Leads',
    iconName: 'TrendingUp',
    permission: 'view:sales',
    subItems: [
      { id: 'sales/leads', label: 'All leads' },
      { id: 'sales/lead-search', label: 'Lead Search' },
      { id: 'sales/bulk-upload', label: 'Bulk upload' },
      { id: 'sales/lead-statuses', label: 'Lead status' },
      { id: 'sales/lead-sources', label: 'Source' },
    ],
  },
  // 13. Notification
  {
    id: 'notification',
    module: 'comms',
    label: 'Notification',
    iconName: 'MessageSquare',
    permission: 'view:comms',
    subItems: [
      { id: 'comms/email', label: 'Email' },
      { id: 'comms/internal', label: 'Internal notification' },
    ],
  },
  // 14. Setting
  {
    id: 'setting',
    module: 'settings',
    label: 'Setting',
    iconName: 'Settings',
    permission: 'view:settings',
    subItems: [
      { id: 'settings', label: 'General' },
      { id: 'user-passwords', label: 'Users password' },
      { id: 'settings/permissions', label: 'Permission' },
      { id: 'settings/roles', label: 'Role' },
    ],
  },
]

// ── Module Labels ─────────────────────────────────────────────────
// 2026-05-12: Labels updated to match the Super-Admin menu spec.
// `clients` surfaces as "Users", `sales` as "Investment / Leads"
// depending on the sub-tab, `compliance` as "KYC", and so on. The
// underlying module IDs remain untouched so routing, RBAC, and
// existing ALL_ADMIN_TAB_PARAMS entries keep working.
export const MODULE_LABELS: Record<AdminModule, string> = {
  overview: 'Dashboard',
  clients: 'Users',
  sales: 'Investment & Leads',
  'realty-brokers': 'Realty Brokers',
  employees: 'Employees',
  assets: 'Documents',
  'ai-ops': 'AI Operations',
  compliance: 'KYC',
  financial: 'Finance',
  analytics: 'Analytics',
  comms: 'Notifications',
  marketing: 'Marketing',
  reports: 'Reports',
  settings: 'Settings',
  allotments: 'Allotments',
  payouts: 'Finance Payout',
  content: 'CMS & Support',
  'user-passwords': 'Users Password',
}

// ── All Admin Tab Slugs (for static generation) ───────────────────
export const ALL_ADMIN_TAB_PARAMS = [
  { tab: ['overview'] },
  { tab: ['clients'] },
  { tab: ['clients', 'kyc-queue'] },
  { tab: ['clients', 'analytics'] },
  { tab: ['clients', 'profile'] },
  { tab: ['clients', 'channel-partners'] },
  { tab: ['sales'] },
  { tab: ['sales', 'create-account'] },
  { tab: ['sales', 'pipeline'] },
  { tab: ['sales', 'leads'] },
  { tab: ['sales', 'referrals'] },
  { tab: ['sales', 'startup-applications'] },
  { tab: ['sales', 'nri-consultations'] },
  { tab: ['sales', 'commissions'] },
  { tab: ['sales', 'leaderboard'] },
  { tab: ['sales', 'investments'] },
  { tab: ['sales', 'lead-statuses'] },
  { tab: ['sales', 'lead-sources'] },
  { tab: ['sales', 'lead-companies'] },
  { tab: ['sales', 'bulk-upload'] },
  // 2026-05-12: Super-Admin menu spec routes
  { tab: ['sales', 'investment-plans'] },
  { tab: ['sales', 'bank-details'] },
  { tab: ['sales', 'fund-categories'] },
  { tab: ['sales', 'investments-pending'] },
  { tab: ['sales', 'investments-rejected'] },
  { tab: ['sales', 'maturity-history'] },
  { tab: ['sales', 'cp-referrals'] },
  { tab: ['sales', 'lead-search'] },
  { tab: ['realty-brokers'] },
  { tab: ['realty-brokers', 'inquiries'] },
  { tab: ['realty-brokers', 'analytics'] },
  { tab: ['employees'] },
  { tab: ['employees', 'announcements'] },
  { tab: ['employees', 'policies'] },
  { tab: ['employees', 'feedback'] },
  { tab: ['employees', 'applications'] },
  { tab: ['employees', 'attendance'] },
  { tab: ['employees', 'leave'] },
  { tab: ['employees', 'payslips'] },
  { tab: ['employees', 'performance'] },
  // 2026-05-12: Super-Admin menu spec routes
  { tab: ['employees', 'assets'] },
  { tab: ['employees', 'holidays'] },
  { tab: ['assets'] },
  { tab: ['assets', 'documents'] },
  { tab: ['assets', 'tracking'] },
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
  { tab: ['compliance', 'kyc-queue'] },
  { tab: ['compliance', 'approvals'] },
  { tab: ['compliance', 'grievances'] },
  { tab: ['compliance', 'risk-flags'] },
  { tab: ['compliance', 'audit-trail'] },
  { tab: ['compliance', 'audit'] },
  { tab: ['compliance', 'regulations'] },
  // 2026-05-12: Super-Admin menu spec routes
  { tab: ['compliance', 'kyc-approved'] },
  { tab: ['compliance', 'kyc-rejected'] },
  { tab: ['financial'] },
  { tab: ['financial', 'transactions'] },
  { tab: ['financial', 'revenue'] },
  { tab: ['financial', 'payouts'] },
  { tab: ['financial', 'invoices'] },
  { tab: ['financial', 'expenses'] },
  { tab: ['analytics'] },
  { tab: ['analytics', 'reports'] },
  { tab: ['analytics', 'forecasting'] },
  { tab: ['comms'] },
  { tab: ['comms', 'messages'] },
  { tab: ['comms', 'broadcast'] },
  { tab: ['comms', 'internal'] },
  { tab: ['comms', 'alerts'] },
  // 2026-05-12: Super-Admin menu spec routes
  { tab: ['comms', 'contact'] },
  { tab: ['comms', 'email'] },
  // ── Marketing routes (Hidden for later use) ──
  // { tab: ['marketing'] },
  // { tab: ['marketing', 'campaigns'] },
  // { tab: ['marketing', 'content'] },
  // { tab: ['marketing', 'audience'] },
  // { tab: ['marketing', 'outreach'] },
  // { tab: ['marketing', 'mkt-analytics'] },
  // { tab: ['marketing', 'ai-tools'] },
  // { tab: ['marketing', 'integrations'] },
  // { tab: ['marketing', 'mkt-settings'] },
  { tab: ['allotments'] },
  { tab: ['allotments', 'history'] },
  { tab: ['allotments', 'debenture-certificates'] },
  { tab: ['payouts'] },
  { tab: ['payouts', 'history'] },
  { tab: ['payouts', 'export'] },
  { tab: ['content'] },
  { tab: ['content', 'financial-iq'] },
  { tab: ['content', 'faq'] },
  { tab: ['content', 'tickets'] },
  { tab: ['content', 'broadcast'] },
  // 2026-05-12: Super-Admin menu spec routes
  { tab: ['content', 'tickets-resolved'] },
  { tab: ['content', 'tickets-rejected'] },
  { tab: ['reports'] },
  { tab: ['reports', 'builder'] },
  { tab: ['reports', 'financial'] },
  { tab: ['reports', 'marketing'] },
  { tab: ['reports', 'ai-advisor'] },
  { tab: ['reports', 'emailer'] },
  { tab: ['reports', 'dialer'] },
  { tab: ['reports', 'documents'] },
  { tab: ['reports', 'rpt-settings'] },
  { tab: ['settings'] },
  { tab: ['settings', 'permissions'] },
  { tab: ['settings', 'security'] },
  { tab: ['settings', 'integrations'] },
  { tab: ['settings', 'api-keys'] },
  { tab: ['settings', 'backups'] },
  { tab: ['settings', 'password-vault'] },
  // 2026-05-12: Super-Admin menu spec routes
  { tab: ['settings', 'roles'] },
  { tab: ['user-passwords'] },
]
