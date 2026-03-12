/* ================================================================
   Template System — Document Templates & Generation Engine

   Pre-built templates for reports, contracts, proposals, emails,
   and exports used across the admin platform.
   ================================================================ */

export type TemplateCategory = 'report' | 'contract' | 'proposal' | 'email' | 'compliance' | 'financial' | 'marketing' | 'hr'
export type TemplateFormat = 'pdf' | 'docx' | 'xlsx' | 'html' | 'email'

export interface DocumentTemplate {
  id: string
  name: string
  description: string
  category: TemplateCategory
  format: TemplateFormat
  icon: string
  variables: TemplateVariable[]
  lastUpdated: string
  version: string
  usageCount: number
  isActive: boolean
}

export interface TemplateVariable {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'currency' | 'select' | 'multiline'
  required: boolean
  defaultValue?: string
  options?: string[]  // for select type
  placeholder?: string
}

// ── Category Labels & Colors ──────────────────────────────────
export const TEMPLATE_CATEGORIES: Record<TemplateCategory, { label: string; color: string; icon: string }> = {
  report: { label: 'Reports', color: '#3B82F6', icon: 'FileBarChart' },
  contract: { label: 'Contracts', color: '#6366F1', icon: 'FileText' },
  proposal: { label: 'Proposals', color: '#10B981', icon: 'FileCheck' },
  email: { label: 'Emails', color: '#F59E0B', icon: 'Mail' },
  compliance: { label: 'Compliance', color: '#EF4444', icon: 'Shield' },
  financial: { label: 'Financial', color: '#8B5CF6', icon: 'IndianRupee' },
  marketing: { label: 'Marketing', color: '#EC4899', icon: 'Megaphone' },
  hr: { label: 'HR & Admin', color: '#14B8A6', icon: 'UserCircle' },
}

// ── Template Library ──────────────────────────────────────────
export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  // Reports
  {
    id: 'TPL-001', name: 'Quarterly NAV Report', description: 'Standard quarterly Net Asset Value report for investors with fund performance, asset allocation, and market commentary.',
    category: 'report', format: 'pdf', icon: 'FileBarChart',
    variables: [
      { key: 'quarter', label: 'Quarter', type: 'select', required: true, options: ['Q1', 'Q2', 'Q3', 'Q4'] },
      { key: 'year', label: 'Financial Year', type: 'text', required: true, defaultValue: '2025-26', placeholder: 'e.g. 2025-26' },
      { key: 'navValue', label: 'NAV per Unit', type: 'currency', required: true, placeholder: 'e.g. 1042.50' },
      { key: 'totalAUM', label: 'Total AUM', type: 'currency', required: true, placeholder: 'e.g. 250000000' },
      { key: 'commentary', label: 'Market Commentary', type: 'multiline', required: false, placeholder: 'Brief market overview...' },
    ],
    lastUpdated: '2026-02-15', version: '3.2', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-002', name: 'Annual Fund Performance Report', description: 'Comprehensive annual report covering fund metrics, IRR, portfolio holdings, and risk analytics.',
    category: 'report', format: 'pdf', icon: 'FileBarChart',
    variables: [
      { key: 'year', label: 'Financial Year', type: 'text', required: true },
      { key: 'irr', label: 'IRR (%)', type: 'number', required: true },
      { key: 'benchmark', label: 'Benchmark Return (%)', type: 'number', required: true },
      { key: 'totalInvestors', label: 'Total Investors', type: 'number', required: true },
    ],
    lastUpdated: '2026-01-20', version: '2.0', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-003', name: 'Investor Statement', description: 'Individual investor account statement with capital account, distributions, and fee breakdown.',
    category: 'report', format: 'pdf', icon: 'FileText',
    variables: [
      { key: 'investorName', label: 'Investor Name', type: 'text', required: true },
      { key: 'investorId', label: 'Investor ID', type: 'text', required: true },
      { key: 'period', label: 'Statement Period', type: 'text', required: true },
      { key: 'commitment', label: 'Capital Commitment', type: 'currency', required: true },
      { key: 'drawdown', label: 'Total Drawdown', type: 'currency', required: true },
    ],
    lastUpdated: '2026-02-01', version: '4.1', usageCount: 0, isActive: true,
  },

  // Contracts
  {
    id: 'TPL-004', name: 'Subscription Agreement', description: 'Standard subscription agreement for new AIF investors per SEBI regulations.',
    category: 'contract', format: 'docx', icon: 'FileText',
    variables: [
      { key: 'investorName', label: 'Investor Name', type: 'text', required: true },
      { key: 'panNumber', label: 'PAN', type: 'text', required: true },
      { key: 'commitmentAmount', label: 'Commitment Amount', type: 'currency', required: true },
      { key: 'investorClass', label: 'Investor Class', type: 'select', required: true, options: ['Individual', 'HUF', 'Corporate', 'Trust', 'NRI'] },
    ],
    lastUpdated: '2026-01-10', version: '5.0', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-005', name: 'Non-Disclosure Agreement', description: 'Mutual NDA for potential investors and business partners.',
    category: 'contract', format: 'docx', icon: 'Shield',
    variables: [
      { key: 'partyName', label: 'Party Name', type: 'text', required: true },
      { key: 'partyAddress', label: 'Registered Address', type: 'multiline', required: true },
      { key: 'duration', label: 'Duration (months)', type: 'number', required: true, defaultValue: '24' },
    ],
    lastUpdated: '2025-12-01', version: '2.3', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-006', name: 'Side Letter Agreement', description: 'Side letter for special terms with anchor/strategic investors.',
    category: 'contract', format: 'docx', icon: 'FileText',
    variables: [
      { key: 'investorName', label: 'Investor Name', type: 'text', required: true },
      { key: 'specialTerms', label: 'Special Terms', type: 'multiline', required: true },
      { key: 'managementFee', label: 'Management Fee (%)', type: 'number', required: true },
    ],
    lastUpdated: '2025-11-15', version: '1.5', usageCount: 0, isActive: true,
  },

  // Proposals
  {
    id: 'TPL-007', name: 'Investment Pitch Deck', description: 'Branded pitch deck for prospective investors with fund overview, strategy, and performance.',
    category: 'proposal', format: 'pdf', icon: 'Presentation',
    variables: [
      { key: 'prospectName', label: 'Prospect Name', type: 'text', required: false },
      { key: 'meetingDate', label: 'Meeting Date', type: 'date', required: false },
      { key: 'focusStrategy', label: 'Focus Strategy', type: 'select', required: true, options: ['Stressed Real Estate', 'Early-Stage Startups', 'Both'] },
    ],
    lastUpdated: '2026-02-20', version: '6.0', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-008', name: 'Deal Memo', description: 'Internal deal evaluation memo for investment committee review.',
    category: 'proposal', format: 'docx', icon: 'ClipboardList',
    variables: [
      { key: 'dealName', label: 'Deal Name', type: 'text', required: true },
      { key: 'sector', label: 'Sector', type: 'text', required: true },
      { key: 'proposedAmount', label: 'Proposed Investment', type: 'currency', required: true },
      { key: 'targetIRR', label: 'Target IRR (%)', type: 'number', required: true },
      { key: 'riskRating', label: 'Risk Rating', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Very High'] },
    ],
    lastUpdated: '2026-02-10', version: '3.0', usageCount: 0, isActive: true,
  },

  // Emails
  {
    id: 'TPL-009', name: 'Welcome Investor Email', description: 'Onboarding email for newly subscribed investors with portal access details.',
    category: 'email', format: 'email', icon: 'Mail',
    variables: [
      { key: 'investorName', label: 'Investor Name', type: 'text', required: true },
      { key: 'email', label: 'Email Address', type: 'text', required: true },
      { key: 'portalUrl', label: 'Portal URL', type: 'text', required: true, defaultValue: 'https://ghlindiaventures.com/dashboard' },
    ],
    lastUpdated: '2026-02-01', version: '2.1', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-010', name: 'Capital Call Notice', description: 'Formal drawdown notice to investors with payment instructions and deadline.',
    category: 'email', format: 'email', icon: 'Mail',
    variables: [
      { key: 'callNumber', label: 'Call Number', type: 'text', required: true },
      { key: 'amount', label: 'Call Amount', type: 'currency', required: true },
      { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
      { key: 'purpose', label: 'Purpose', type: 'multiline', required: true },
    ],
    lastUpdated: '2026-01-25', version: '3.0', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-011', name: 'Distribution Notice', description: 'Distribution payout notification to investors with tax details.',
    category: 'email', format: 'email', icon: 'Mail',
    variables: [
      { key: 'distributionDate', label: 'Distribution Date', type: 'date', required: true },
      { key: 'totalAmount', label: 'Total Distribution', type: 'currency', required: true },
      { key: 'taxWithheld', label: 'Tax Withheld', type: 'currency', required: true },
    ],
    lastUpdated: '2025-12-15', version: '2.0', usageCount: 0, isActive: true,
  },

  // Compliance
  {
    id: 'TPL-012', name: 'SEBI Annual Filing', description: 'Annual information memorandum and compliance filing for SEBI.',
    category: 'compliance', format: 'pdf', icon: 'Shield',
    variables: [
      { key: 'filingYear', label: 'Filing Year', type: 'text', required: true },
      { key: 'totalCorpus', label: 'Total Corpus', type: 'currency', required: true },
      { key: 'investorCount', label: 'Number of Investors', type: 'number', required: true },
    ],
    lastUpdated: '2026-01-30', version: '4.0', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-013', name: 'KYC Verification Report', description: 'Client KYC documentation and verification status report.',
    category: 'compliance', format: 'pdf', icon: 'UserCheck',
    variables: [
      { key: 'clientName', label: 'Client Name', type: 'text', required: true },
      { key: 'verificationType', label: 'Verification Type', type: 'select', required: true, options: ['Individual KYC', 'Corporate KYC', 'NRI KYC', 'Trust KYC'] },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['Approved', 'Pending', 'Rejected', 'Under Review'] },
    ],
    lastUpdated: '2026-02-12', version: '3.1', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-014', name: 'AML/CFT Compliance Report', description: 'Anti-Money Laundering and Counter-Terrorism Financing periodic report.',
    category: 'compliance', format: 'pdf', icon: 'ShieldCheck',
    variables: [
      { key: 'reportPeriod', label: 'Reporting Period', type: 'text', required: true },
      { key: 'suspiciousTransactions', label: 'STR Count', type: 'number', required: true, defaultValue: '0' },
    ],
    lastUpdated: '2026-01-15', version: '2.0', usageCount: 0, isActive: true,
  },

  // Financial
  {
    id: 'TPL-015', name: 'Invoice Template', description: 'Standard invoice for management fees, performance fees, and other charges.',
    category: 'financial', format: 'pdf', icon: 'Receipt',
    variables: [
      { key: 'invoiceNumber', label: 'Invoice Number', type: 'text', required: true },
      { key: 'clientName', label: 'Client Name', type: 'text', required: true },
      { key: 'amount', label: 'Amount', type: 'currency', required: true },
      { key: 'gstRate', label: 'GST Rate (%)', type: 'number', required: true, defaultValue: '18' },
      { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
    ],
    lastUpdated: '2026-02-18', version: '4.2', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-016', name: 'Expense Report', description: 'Monthly fund expense report with detailed breakdown by category.',
    category: 'financial', format: 'xlsx', icon: 'FileSpreadsheet',
    variables: [
      { key: 'month', label: 'Month', type: 'text', required: true },
      { key: 'year', label: 'Year', type: 'text', required: true },
    ],
    lastUpdated: '2026-02-05', version: '2.5', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-017', name: 'TDS Certificate (Form 16A)', description: 'Tax Deducted at Source certificate for investor distributions.',
    category: 'financial', format: 'pdf', icon: 'FileCheck',
    variables: [
      { key: 'investorName', label: 'Investor Name', type: 'text', required: true },
      { key: 'panNumber', label: 'PAN', type: 'text', required: true },
      { key: 'financialYear', label: 'Financial Year', type: 'text', required: true },
      { key: 'tdsAmount', label: 'TDS Amount', type: 'currency', required: true },
    ],
    lastUpdated: '2025-12-01', version: '1.0', usageCount: 0, isActive: true,
  },

  // Marketing
  {
    id: 'TPL-018', name: 'Investor Brochure', description: 'Branded fund brochure for distribution at events and meetings.',
    category: 'marketing', format: 'pdf', icon: 'BookOpen',
    variables: [
      { key: 'edition', label: 'Edition', type: 'text', required: true, defaultValue: 'February 2026' },
      { key: 'highlights', label: 'Key Highlights', type: 'multiline', required: false },
    ],
    lastUpdated: '2026-02-20', version: '6.1', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-019', name: 'Campaign Performance Report', description: 'Digital marketing campaign metrics and ROI analysis.',
    category: 'marketing', format: 'pdf', icon: 'BarChart',
    variables: [
      { key: 'campaignName', label: 'Campaign Name', type: 'text', required: true },
      { key: 'period', label: 'Period', type: 'text', required: true },
      { key: 'spend', label: 'Total Spend', type: 'currency', required: true },
      { key: 'leads', label: 'Leads Generated', type: 'number', required: true },
    ],
    lastUpdated: '2026-02-10', version: '2.0', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-020', name: 'Event Invitation', description: 'Branded email invitation for investor events and webinars.',
    category: 'marketing', format: 'email', icon: 'Calendar',
    variables: [
      { key: 'eventName', label: 'Event Name', type: 'text', required: true },
      { key: 'eventDate', label: 'Event Date', type: 'date', required: true },
      { key: 'venue', label: 'Venue / Link', type: 'text', required: true },
      { key: 'rsvpDeadline', label: 'RSVP Deadline', type: 'date', required: true },
    ],
    lastUpdated: '2026-02-15', version: '3.0', usageCount: 0, isActive: true,
  },

  // HR
  {
    id: 'TPL-021', name: 'Offer Letter', description: 'Standard employment offer letter with compensation and benefits details.',
    category: 'hr', format: 'docx', icon: 'UserPlus',
    variables: [
      { key: 'candidateName', label: 'Candidate Name', type: 'text', required: true },
      { key: 'designation', label: 'Designation', type: 'text', required: true },
      { key: 'department', label: 'Department', type: 'text', required: true },
      { key: 'ctc', label: 'Annual CTC', type: 'currency', required: true },
      { key: 'joiningDate', label: 'Joining Date', type: 'date', required: true },
    ],
    lastUpdated: '2026-01-20', version: '3.5', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-022', name: 'Experience Certificate', description: 'Employment experience and relieving certificate.',
    category: 'hr', format: 'docx', icon: 'Award',
    variables: [
      { key: 'employeeName', label: 'Employee Name', type: 'text', required: true },
      { key: 'designation', label: 'Last Designation', type: 'text', required: true },
      { key: 'joiningDate', label: 'Date of Joining', type: 'date', required: true },
      { key: 'relievingDate', label: 'Date of Relieving', type: 'date', required: true },
    ],
    lastUpdated: '2025-11-01', version: '2.0', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-023', name: 'Appraisal Form', description: 'Annual performance appraisal form with self-assessment and manager review.',
    category: 'hr', format: 'docx', icon: 'ClipboardCheck',
    variables: [
      { key: 'employeeName', label: 'Employee Name', type: 'text', required: true },
      { key: 'reviewPeriod', label: 'Review Period', type: 'text', required: true },
      { key: 'department', label: 'Department', type: 'text', required: true },
      { key: 'rating', label: 'Overall Rating', type: 'select', required: true, options: ['Outstanding', 'Exceeds Expectations', 'Meets Expectations', 'Below Expectations'] },
    ],
    lastUpdated: '2026-01-05', version: '2.0', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-024', name: 'Leave Application', description: 'Standard leave application form for all leave types.',
    category: 'hr', format: 'html', icon: 'Calendar',
    variables: [
      { key: 'employeeName', label: 'Employee Name', type: 'text', required: true },
      { key: 'leaveType', label: 'Leave Type', type: 'select', required: true, options: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Compensatory Off', 'Maternity/Paternity'] },
      { key: 'fromDate', label: 'From Date', type: 'date', required: true },
      { key: 'toDate', label: 'To Date', type: 'date', required: true },
      { key: 'reason', label: 'Reason', type: 'multiline', required: true },
    ],
    lastUpdated: '2025-10-15', version: '1.5', usageCount: 0, isActive: true,
  },
  {
    id: 'TPL-025', name: 'Board Resolution Template', description: 'Standard board resolution format for corporate actions and approvals.',
    category: 'compliance', format: 'docx', icon: 'Gavel',
    variables: [
      { key: 'resolutionTitle', label: 'Resolution Title', type: 'text', required: true },
      { key: 'meetingDate', label: 'Meeting Date', type: 'date', required: true },
      { key: 'resolutionType', label: 'Type', type: 'select', required: true, options: ['Ordinary', 'Special', 'Circular'] },
      { key: 'description', label: 'Resolution Description', type: 'multiline', required: true },
    ],
    lastUpdated: '2026-01-30', version: '2.0', usageCount: 0, isActive: true,
  },
]

// ── Template Stats ────────────────────────────────────────────
export function getTemplateStats() {
  const templates = DOCUMENT_TEMPLATES
  const categories = Object.keys(TEMPLATE_CATEGORIES) as TemplateCategory[]
  return {
    total: templates.length,
    active: templates.filter(t => t.isActive).length,
    totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0),
    byCategory: categories.map(cat => ({
      category: cat,
      ...TEMPLATE_CATEGORIES[cat],
      count: templates.filter(t => t.category === cat).length,
      usage: templates.filter(t => t.category === cat).reduce((s, t) => s + t.usageCount, 0),
    })),
  }
}
