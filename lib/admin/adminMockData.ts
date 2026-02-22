/* ================================================================
   ADMIN COMMAND CENTER — MOCK DATA
   Centralized data store. Replace with API calls in production.
   ================================================================ */

import type {
  Client, Lead, Employee, KYCDocument, Commission, LeaveRequest,
  Asset, Approval, AuditEntry, RiskFlag, Invoice, Expense,
  AdminNotification, ActivityItem, AITool,
} from './adminTypes'

// ── Overview KPIs ─────────────────────────────────────────────────
export const OVERVIEW_KPIS = {
  totalAUM: 247_00_00_000,        // ₹247 Cr
  aumChange: 12.4,
  activeClients: 342,
  clientGrowth: 8.2,
  monthlyRevenue: 1_85_00_000,    // ₹1.85 Cr
  revenueChange: 15.7,
  pendingApprovals: 12,
  complianceScore: 94,
  activeLeads: 47,
  leadConversion: 23.5,
  documentsProcessed: 156,
  tasksCompleted: 89,
}

// ── AUM Growth Chart Data ─────────────────────────────────────────
export const AUM_GROWTH_DATA = [
  { month: 'Apr 24', aum: 168, target: 165 },
  { month: 'May 24', aum: 175, target: 172 },
  { month: 'Jun 24', aum: 182, target: 180 },
  { month: 'Jul 24', aum: 189, target: 187 },
  { month: 'Aug 24', aum: 195, target: 195 },
  { month: 'Sep 24', aum: 204, target: 202 },
  { month: 'Oct 24', aum: 212, target: 210 },
  { month: 'Nov 24', aum: 220, target: 217 },
  { month: 'Dec 24', aum: 228, target: 225 },
  { month: 'Jan 25', aum: 235, target: 232 },
  { month: 'Feb 25', aum: 241, target: 238 },
  { month: 'Mar 25', aum: 247, target: 245 },
]

// ── Revenue Breakdown ─────────────────────────────────────────────
export const REVENUE_BREAKDOWN = [
  { month: 'Oct 24', management: 95, performance: 42, placement: 18, advisory: 12 },
  { month: 'Nov 24', management: 98, performance: 45, placement: 22, advisory: 10 },
  { month: 'Dec 24', management: 102, performance: 55, placement: 15, advisory: 14 },
  { month: 'Jan 25', management: 105, performance: 48, placement: 20, advisory: 11 },
  { month: 'Feb 25', management: 108, performance: 52, placement: 25, advisory: 13 },
  { month: 'Mar 25', management: 112, performance: 58, placement: 28, advisory: 15 },
]

// ── Clients ───────────────────────────────────────────────────────
export const CLIENTS_DATA: Client[] = [
  { id: 'GHL-INV-001', name: 'Rajesh Krishnan', email: 'rajesh.k@email.com', phone: '+91 98412 34567', pan: 'ABCPK1234A', kycStatus: 'approved', accountStatus: 'active', riskProfile: 'moderate', aum: 68_50_000, investedAmount: 58_00_000, currentValue: 68_50_000, joinDate: '2023-06-15', lastActive: '2025-03-20', assignedRM: 'Priya Natarajan' },
  { id: 'GHL-INV-002', name: 'Sunita Agarwal', email: 'sunita.a@email.com', phone: '+91 98765 43210', pan: 'DEFPA5678B', kycStatus: 'approved', accountStatus: 'active', riskProfile: 'aggressive', aum: 1_25_00_000, investedAmount: 1_00_00_000, currentValue: 1_25_00_000, joinDate: '2023-03-10', lastActive: '2025-03-19', assignedRM: 'Venkatesh Raghavan' },
  { id: 'GHL-INV-003', name: 'Vikram Mehta', email: 'vikram.m@email.com', phone: '+91 87654 32109', pan: 'GHIPM9012C', kycStatus: 'under-review', accountStatus: 'active', riskProfile: 'conservative', aum: 45_00_000, investedAmount: 42_00_000, currentValue: 45_00_000, joinDate: '2024-01-20', lastActive: '2025-03-18', assignedRM: 'Priya Natarajan' },
  { id: 'GHL-INV-004', name: 'Ananya Sharma', email: 'ananya.s@email.com', phone: '+91 76543 21098', pan: 'JKLPS3456D', kycStatus: 'pending', accountStatus: 'active', riskProfile: 'moderate', aum: 32_00_000, investedAmount: 30_00_000, currentValue: 32_00_000, joinDate: '2024-06-05', lastActive: '2025-03-17', assignedRM: 'Priya Natarajan' },
  { id: 'GHL-INV-005', name: 'Deepak Patel', email: 'deepak.p@email.com', phone: '+91 65432 10987', pan: 'MNOPD7890E', kycStatus: 'approved', accountStatus: 'active', riskProfile: 'aggressive', aum: 2_10_00_000, investedAmount: 1_75_00_000, currentValue: 2_10_00_000, joinDate: '2022-11-12', lastActive: '2025-03-20', assignedRM: 'Venkatesh Raghavan' },
  { id: 'GHL-INV-006', name: 'Lakshmi Iyer', email: 'lakshmi.i@email.com', phone: '+91 54321 09876', pan: 'PQRSL1234F', kycStatus: 'approved', accountStatus: 'frozen', riskProfile: 'conservative', aum: 55_00_000, investedAmount: 50_00_000, currentValue: 55_00_000, joinDate: '2023-09-08', lastActive: '2025-01-15', assignedRM: 'Venkatesh Raghavan' },
  { id: 'GHL-INV-007', name: 'Arjun Reddy', email: 'arjun.r@email.com', phone: '+91 43210 98765', pan: 'STUVA5678G', kycStatus: 'rejected', accountStatus: 'suspended', riskProfile: 'speculative', aum: 0, investedAmount: 0, currentValue: 0, joinDate: '2024-08-22', lastActive: '2024-09-10', assignedRM: 'Priya Natarajan' },
  { id: 'GHL-INV-008', name: 'Kavitha Raman', email: 'kavitha.r@email.com', phone: '+91 32109 87654', pan: 'VWXYK9012H', kycStatus: 'approved', accountStatus: 'active', riskProfile: 'moderate', aum: 95_00_000, investedAmount: 80_00_000, currentValue: 95_00_000, joinDate: '2023-01-25', lastActive: '2025-03-19', assignedRM: 'Venkatesh Raghavan' },
]

// ── KYC Documents ─────────────────────────────────────────────────
export const KYC_DOCUMENTS: KYCDocument[] = [
  { id: 'KYC-001', clientId: 'GHL-INV-003', clientName: 'Vikram Mehta', type: 'PAN Card', fileName: 'vikram_pan.pdf', uploadDate: '2025-03-15', status: 'under-review', reviewer: 'Meera Subramaniam' },
  { id: 'KYC-002', clientId: 'GHL-INV-003', clientName: 'Vikram Mehta', type: 'Aadhaar', fileName: 'vikram_aadhaar.pdf', uploadDate: '2025-03-15', status: 'under-review', reviewer: 'Meera Subramaniam' },
  { id: 'KYC-003', clientId: 'GHL-INV-004', clientName: 'Ananya Sharma', type: 'PAN Card', fileName: 'ananya_pan.pdf', uploadDate: '2025-03-12', status: 'pending' },
  { id: 'KYC-004', clientId: 'GHL-INV-004', clientName: 'Ananya Sharma', type: 'Bank Statement', fileName: 'ananya_bank.pdf', uploadDate: '2025-03-12', status: 'pending' },
  { id: 'KYC-005', clientId: 'GHL-INV-007', clientName: 'Arjun Reddy', type: 'Address Proof', fileName: 'arjun_address.pdf', uploadDate: '2024-09-01', status: 'rejected', notes: 'Document expired. Please upload current utility bill.' },
]

// ── Leads ─────────────────────────────────────────────────────────
export const LEADS_DATA: Lead[] = [
  { id: 'L-001', name: 'Suresh Kumar', email: 'suresh.k@corp.com', phone: '+91 98400 11111', source: 'website', stage: 'qualified', value: 50_00_000, probability: 65, aiScore: 78, assignedTo: 'Priya Natarajan', createdDate: '2025-03-01', lastTouched: '2025-03-18', nextFollowUp: '2025-03-22' },
  { id: 'L-002', name: 'Ramya Venkat', email: 'ramya.v@biz.com', phone: '+91 98400 22222', source: 'referral', stage: 'proposal', value: 1_00_00_000, probability: 80, aiScore: 92, assignedTo: 'Priya Natarajan', createdDate: '2025-02-15', lastTouched: '2025-03-19' },
  { id: 'L-003', name: 'Mohan Das', email: 'mohan.d@tech.com', phone: '+91 98400 33333', source: 'event', stage: 'contacted', value: 25_00_000, probability: 30, aiScore: 45, assignedTo: 'Priya Natarajan', createdDate: '2025-03-10', lastTouched: '2025-03-15' },
  { id: 'L-004', name: 'Padma Lakshmi', email: 'padma.l@fin.com', phone: '+91 98400 44444', source: 'cold-outreach', stage: 'new', value: 75_00_000, probability: 15, aiScore: 35, assignedTo: 'Priya Natarajan', createdDate: '2025-03-18', lastTouched: '2025-03-18' },
  { id: 'L-005', name: 'Ganesh Iyer', email: 'ganesh.i@invest.com', phone: '+91 98400 55555', source: 'website', stage: 'negotiation', value: 2_00_00_000, probability: 90, aiScore: 95, assignedTo: 'Priya Natarajan', createdDate: '2025-01-20', lastTouched: '2025-03-20' },
  { id: 'L-006', name: 'Nandini Rao', email: 'nandini.r@wealth.com', phone: '+91 98400 66666', source: 'referral', stage: 'won', value: 1_50_00_000, probability: 100, aiScore: 98, assignedTo: 'Priya Natarajan', createdDate: '2025-01-05', lastTouched: '2025-03-10' },
]

// ── Employees ─────────────────────────────────────────────────────
export const EMPLOYEES_DATA: Employee[] = [
  { id: 'EMP-001', name: 'Abe Thayil', email: 'admin@ghlindiaventures.com', phone: '+91 7200 255 252', role: 'Founder & CEO', department: 'Executive', status: 'active', joinDate: '2022-01-01' },
  { id: 'EMP-002', name: 'Venkatesh Raghavan', email: 'venkatesh@ghlindia.com', phone: '+91 44 2843 1051', role: 'Chief Investment Officer', department: 'Investments', status: 'active', joinDate: '2022-03-15' },
  { id: 'EMP-003', name: 'Meera Subramaniam', email: 'compliance@ghlindiaventures.com', phone: '+91 44 2843 1050', role: 'Head of Compliance', department: 'Compliance', status: 'active', joinDate: '2022-06-01' },
  { id: 'EMP-004', name: 'Priya Natarajan', email: 'sales@ghlindiaventures.com', phone: '+91 44 2843 1052', role: 'VP Sales & Distribution', department: 'Sales', status: 'active', joinDate: '2022-09-10' },
  { id: 'EMP-005', name: 'Karthik Sundaram', email: 'karthik@ghlindia.com', phone: '+91 44 2843 1053', role: 'Senior Fund Analyst', department: 'Investments', status: 'active', joinDate: '2023-01-15' },
  { id: 'EMP-006', name: 'Divya Krishnamurthy', email: 'divya@ghlindia.com', phone: '+91 44 2843 1054', role: 'Relationship Manager', department: 'Client Services', status: 'active', joinDate: '2023-04-01' },
  { id: 'EMP-007', name: 'Rahul Menon', email: 'rahul@ghlindia.com', phone: '+91 44 2843 1055', role: 'Operations Manager', department: 'Operations', status: 'on-leave', joinDate: '2023-06-15' },
  { id: 'EMP-008', name: 'Sowmya Rajan', email: 'sowmya@ghlindia.com', phone: '+91 44 2843 1056', role: 'Legal Counsel', department: 'Legal', status: 'active', joinDate: '2023-09-01' },
  { id: 'EMP-009', name: 'Arjun Menon', email: 'viewer@ghlindiaventures.com', phone: '+91 44 2843 1060', role: 'External Auditor', department: 'Audit', status: 'active', joinDate: '2024-01-10' },
]

// ── Commissions ───────────────────────────────────────────────────
export const COMMISSIONS_DATA: Commission[] = [
  { id: 'COM-001', salesRep: 'Priya Natarajan', dealId: 'L-006', clientName: 'Nandini Rao', dealValue: 1_50_00_000, commissionRate: 1.5, commissionAmount: 2_25_000, status: 'paid', period: 'Q4 2024' },
  { id: 'COM-002', salesRep: 'Priya Natarajan', dealId: 'L-005', clientName: 'Ganesh Iyer', dealValue: 2_00_00_000, commissionRate: 1.5, commissionAmount: 3_00_000, status: 'approved', period: 'Q1 2025' },
  { id: 'COM-003', salesRep: 'Priya Natarajan', dealId: 'L-002', clientName: 'Ramya Venkat', dealValue: 1_00_00_000, commissionRate: 1.5, commissionAmount: 1_50_000, status: 'pending', period: 'Q1 2025' },
]

// ── Approvals Queue ───────────────────────────────────────────────
export const APPROVALS_DATA: Approval[] = [
  { id: 'APR-001', type: 'kyc', requestedBy: 'Vikram Mehta', description: 'KYC documents submitted for review', date: '2025-03-15', priority: 'high', assignedReviewer: 'Meera Subramaniam', status: 'pending' },
  { id: 'APR-002', type: 'investment', requestedBy: 'Sunita Agarwal', description: 'Additional ₹50L investment in Phoenix Towers', date: '2025-03-18', priority: 'medium', status: 'pending' },
  { id: 'APR-003', type: 'kyc', requestedBy: 'Ananya Sharma', description: 'Initial KYC submission', date: '2025-03-12', priority: 'high', status: 'pending' },
  { id: 'APR-004', type: 'document', requestedBy: 'Karthik Sundaram', description: 'Q4 2024 fund performance report for publishing', date: '2025-03-10', priority: 'medium', assignedReviewer: 'Meera Subramaniam', status: 'pending' },
  { id: 'APR-005', type: 'payout', requestedBy: 'Priya Natarajan', description: 'Q1 2025 commission payout request', date: '2025-03-19', priority: 'low', status: 'pending' },
]

// ── Risk Flags ────────────────────────────────────────────────────
export const RISK_FLAGS_DATA: RiskFlag[] = [
  { id: 'RF-001', severity: 'critical', title: 'KYC Expiry Alert', description: '3 client KYC documents expiring within 30 days', affectedEntity: 'Multiple Clients', createdDate: '2025-03-15', status: 'open', assignedTo: 'Meera Subramaniam' },
  { id: 'RF-002', severity: 'high', title: 'Unusual Transaction Pattern', description: 'Client GHL-INV-005 shows irregular withdrawal requests', affectedEntity: 'Deepak Patel', createdDate: '2025-03-18', status: 'investigating', assignedTo: 'Meera Subramaniam' },
  { id: 'RF-003', severity: 'medium', title: 'Overdue Invoice', description: '2 management fee invoices overdue by 30+ days', affectedEntity: 'Finance', createdDate: '2025-03-10', status: 'open' },
  { id: 'RF-004', severity: 'low', title: 'Staff Access Review', description: 'Quarterly access review due for operations team', affectedEntity: 'Operations', createdDate: '2025-03-01', status: 'open' },
]

// ── Notifications ─────────────────────────────────────────────────
export const ADMIN_NOTIFICATIONS: AdminNotification[] = [
  { id: 'N-001', type: 'critical', title: 'KYC Documents Expiring', message: '3 clients have KYC documents expiring within 30 days', module: 'compliance', timestamp: '2025-03-20T09:30:00', read: false },
  { id: 'N-002', type: 'warning', title: 'Pending Approvals', message: '5 investment approvals pending for over 48 hours', module: 'compliance', timestamp: '2025-03-20T08:15:00', read: false },
  { id: 'N-003', type: 'success', title: 'New Client Onboarded', message: 'Nandini Rao (₹1.5 Cr) successfully onboarded', module: 'clients', timestamp: '2025-03-19T16:45:00', read: false },
  { id: 'N-004', type: 'info', title: 'Monthly Report Ready', message: 'February 2025 investor report has been auto-generated', module: 'analytics', timestamp: '2025-03-19T10:00:00', read: true },
  { id: 'N-005', type: 'warning', title: 'Lead Follow-up Overdue', message: '3 leads have not been contacted in 7+ days', module: 'sales', timestamp: '2025-03-18T14:30:00', read: true },
  { id: 'N-006', type: 'info', title: 'System Backup Complete', message: 'Daily backup completed successfully (2.4 GB)', module: 'settings', timestamp: '2025-03-18T02:00:00', read: true },
]

// ── Activity Feed ─────────────────────────────────────────────────
export const ACTIVITY_FEED: ActivityItem[] = [
  { id: 'ACT-001', user: 'Meera Subramaniam', action: 'approved KYC for', target: 'Rajesh Krishnan', module: 'compliance', timestamp: '2025-03-20T10:15:00' },
  { id: 'ACT-002', user: 'Priya Natarajan', action: 'moved lead to Proposal stage:', target: 'Ramya Venkat', module: 'sales', timestamp: '2025-03-20T09:45:00' },
  { id: 'ACT-003', user: 'Venkatesh Raghavan', action: 'updated NAV for', target: 'Phoenix Towers Fund', module: 'financial', timestamp: '2025-03-20T09:30:00' },
  { id: 'ACT-004', user: 'Karthik Sundaram', action: 'uploaded Q4 report for', target: 'All Funds', module: 'assets', timestamp: '2025-03-19T17:00:00' },
  { id: 'ACT-005', user: 'Divya Krishnamurthy', action: 'sent portfolio review to', target: 'Sunita Agarwal', module: 'comms', timestamp: '2025-03-19T15:30:00' },
  { id: 'ACT-006', user: 'System', action: 'auto-generated monthly report for', target: 'February 2025', module: 'analytics', timestamp: '2025-03-19T10:00:00' },
  { id: 'ACT-007', user: 'Priya Natarajan', action: 'closed deal with', target: 'Nandini Rao (₹1.5 Cr)', module: 'sales', timestamp: '2025-03-18T16:45:00' },
  { id: 'ACT-008', user: 'Meera Subramaniam', action: 'flagged unusual activity for', target: 'Deepak Patel', module: 'compliance', timestamp: '2025-03-18T14:00:00' },
]

// ── AI Tools Registry ─────────────────────────────────────────────
export const AI_TOOLS: AITool[] = [
  { id: 'doc-analyzer', name: 'Document Analyzer', description: 'Extract key data from documents using AI', icon: 'FileSearch', category: 'analysis', status: 'active' },
  { id: 'risk-engine', name: 'Risk Scoring Engine', description: 'AI-powered client and portfolio risk assessment', icon: 'ShieldAlert', category: 'analysis', status: 'active' },
  { id: 'contract-gen', name: 'Contract Generator', description: 'Generate investment agreements and NDAs', icon: 'FileSignature', category: 'generation', status: 'active' },
  { id: 'proposal-builder', name: 'Proposal Builder', description: 'Build branded investment proposals', icon: 'Presentation', category: 'generation', status: 'active' },
  { id: 'projections', name: 'Financial Projections', description: 'AI-powered return projections and modeling', icon: 'TrendingUp', category: 'prediction', status: 'active' },
  { id: 'compliance-checker', name: 'Compliance Checker', description: 'Check documents against SEBI/RBI regulations', icon: 'CheckSquare', category: 'analysis', status: 'active' },
  { id: 'portfolio-optimizer', name: 'Portfolio Optimizer', description: 'AI portfolio rebalancing recommendations', icon: 'Target', category: 'prediction', status: 'active' },
  { id: 'email-composer', name: 'Email Composer', description: 'AI-powered professional email drafting', icon: 'Mail', category: 'generation', status: 'active' },
  { id: 'insights', name: 'Business Insights', description: 'AI-generated operational intelligence', icon: 'Lightbulb', category: 'analysis', status: 'active' },
  { id: 'assistant', name: 'AI Assistant', description: 'Internal conversational AI for queries', icon: 'Bot', category: 'automation', status: 'active' },
  { id: 'sentiment', name: 'Sentiment Analysis', description: 'Analyze client communication sentiment', icon: 'Heart', category: 'analysis', status: 'active' },
  { id: 'anomaly-detector', name: 'Anomaly Detection', description: 'Real-time fraud and anomaly monitoring', icon: 'AlertTriangle', category: 'monitoring', status: 'active' },
  { id: 'meeting-intelligence', name: 'Meeting Intelligence', description: 'Transcribe meetings and extract actions', icon: 'Mic', category: 'automation', status: 'beta' },
  { id: 'regulatory-radar', name: 'Regulatory Radar', description: 'Track SEBI/RBI regulatory changes', icon: 'Radar', category: 'monitoring', status: 'active' },
  { id: 'churn-predictor', name: 'Churn Predictor', description: 'Predict client disengagement risk', icon: 'UserMinus', category: 'prediction', status: 'beta' },
  { id: 'voice-command', name: 'Voice Command', description: 'Voice-activated admin dashboard control', icon: 'Mic2', category: 'automation', status: 'coming-soon' },
  { id: 'auto-reporter', name: 'Auto Report Generator', description: 'Scheduled intelligent report creation', icon: 'FileBarChart', category: 'automation', status: 'active' },
  { id: 'knowledge-base', name: 'Knowledge Base', description: 'AI-powered internal knowledge repository', icon: 'BookOpen', category: 'automation', status: 'beta' },
]

// ── Invoices ──────────────────────────────────────────────────────
export const INVOICES_DATA: Invoice[] = [
  { id: 'INV-2025-001', clientName: 'Rajesh Krishnan', amount: 1_37_000, gst: 24_660, total: 1_61_660, date: '2025-03-01', dueDate: '2025-03-31', status: 'sent', type: 'Management Fee' },
  { id: 'INV-2025-002', clientName: 'Sunita Agarwal', amount: 2_50_000, gst: 45_000, total: 2_95_000, date: '2025-03-01', dueDate: '2025-03-31', status: 'paid', type: 'Management Fee' },
  { id: 'INV-2025-003', clientName: 'Deepak Patel', amount: 4_20_000, gst: 75_600, total: 4_95_600, date: '2025-03-01', dueDate: '2025-03-31', status: 'overdue', type: 'Performance Fee' },
]

// ── Expenses ──────────────────────────────────────────────────────
export const EXPENSES_DATA: Expense[] = [
  { id: 'EXP-001', description: 'Cloud hosting - AWS', category: 'technology', amount: 45_000, submittedBy: 'Rahul Menon', date: '2025-03-05', status: 'approved' },
  { id: 'EXP-002', description: 'SEBI registration renewal', category: 'legal', amount: 1_50_000, submittedBy: 'Sowmya Rajan', date: '2025-03-10', status: 'paid' },
  { id: 'EXP-003', description: 'Client event - Chennai', category: 'marketing', amount: 2_75_000, submittedBy: 'Priya Natarajan', date: '2025-03-12', status: 'pending' },
  { id: 'EXP-004', description: 'Office supplies Q1', category: 'operations', amount: 18_500, submittedBy: 'Rahul Menon', date: '2025-03-15', status: 'approved' },
]

// ── System Health ─────────────────────────────────────────────────
export const SYSTEM_HEALTH = {
  uptime: 99.97,
  responseTime: 142,
  storageUsed: 68,
  storageTotal: 100,
  activeUsers: 6,
  apiCalls24h: 12450,
  errorRate: 0.02,
  lastBackup: '2025-03-20T02:00:00',
}

// ── Upcoming Deadlines ────────────────────────────────────────────
export const UPCOMING_DEADLINES = [
  { id: 'DL-001', title: 'SEBI Annual Filing', date: '2025-03-31', priority: 'critical' as const, module: 'compliance' },
  { id: 'DL-002', title: 'Q4 Investor Report', date: '2025-04-15', priority: 'high' as const, module: 'analytics' },
  { id: 'DL-003', title: 'KYC Re-verification (3 clients)', date: '2025-04-20', priority: 'high' as const, module: 'clients' },
  { id: 'DL-004', title: 'Fund Closing - Series B', date: '2025-05-01', priority: 'medium' as const, module: 'financial' },
  { id: 'DL-005', title: 'Annual Compliance Audit', date: '2025-06-15', priority: 'medium' as const, module: 'compliance' },
]

// ── Assets ────────────────────────────────────────────────────────
export const ASSETS_DATA: Asset[] = [
  { id: 'AST-001', name: 'ghlindia.com Domain', category: 'digital', status: 'active', purchaseDate: '2022-01-01', expiryDate: '2026-01-01', value: 5000 },
  { id: 'AST-002', name: 'SSL Certificate (Wildcard)', category: 'certificate', status: 'active', purchaseDate: '2024-06-01', expiryDate: '2025-06-01', value: 12000 },
  { id: 'AST-003', name: 'Microsoft 365 Business (10 seats)', category: 'license', status: 'active', purchaseDate: '2024-01-01', expiryDate: '2025-01-01', value: 96000, assignedTo: 'All Staff' },
  { id: 'AST-004', name: 'MacBook Pro 16" M3', category: 'physical', serialNumber: 'MBP-2024-001', status: 'active', purchaseDate: '2024-03-15', value: 250000, assignedTo: 'Abe Thayil' },
  { id: 'AST-005', name: 'Tally ERP License', category: 'license', status: 'active', purchaseDate: '2024-04-01', expiryDate: '2025-04-01', value: 54000, assignedTo: 'Finance Team' },
]
