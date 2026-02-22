/* ================================================================
   ADMIN COMMAND CENTER — MOCK DATA
   Centralized data store. Replace with API calls in production.
   ================================================================ */

import type {
  Client, Lead, Employee, KYCDocument, Commission, LeaveRequest,
  Asset, Approval, AuditEntry, RiskFlag, Invoice, Expense,
  AdminNotification, ActivityItem, AITool,
  RealtyBroker, BrokerInquiry,
  MarketingCampaign, MarketingKPIs, ContentItem, AudienceSegment,
  OutreachSequence, MarketingAITool, IntegrationService,
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
  { id: 'voice-command', name: 'Voice Command', description: 'Voice-activated admin dashboard control', icon: 'Mic2', category: 'automation', status: 'active' },
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

// ── Realty Brokers ───────────────────────────────────────────────
export const REALTY_BROKERS_DATA: RealtyBroker[] = [
  { id: 'BRK-001', name: 'Suresh Balakrishnan', email: 'suresh.b@realtychennai.com', phone: '+91 98410 55501', company: 'Chennai Realty Partners', reraId: 'TN/RERA/2023/0542', specialization: 'residential', city: 'Chennai', status: 'active', totalDeals: 12, totalValue: 48_00_00_000, commission: 96_00_000, rating: 4.8, joinDate: '2023-04-10', lastActive: '2025-03-19', assignedRM: 'Priya Natarajan', tags: ['premium', 'south-chennai', 'villa-specialist'] },
  { id: 'BRK-002', name: 'Lakshmi Venkataraman', email: 'lakshmi.v@propertyworld.in', phone: '+91 98410 55502', company: 'PropertyWorld India', reraId: 'TN/RERA/2022/1287', specialization: 'commercial', city: 'Chennai', status: 'active', totalDeals: 8, totalValue: 85_00_00_000, commission: 1_70_00_000, rating: 4.6, joinDate: '2022-11-15', lastActive: '2025-03-20', assignedRM: 'Venkatesh Raghavan', tags: ['commercial', 'IT-corridor', 'office-spaces'] },
  { id: 'BRK-003', name: 'Rajkumar Pandian', email: 'rajkumar.p@landbrokers.co', phone: '+91 98410 55503', company: 'South India Land Brokers', specialization: 'land', city: 'Coimbatore', status: 'active', totalDeals: 15, totalValue: 32_00_00_000, commission: 64_00_000, rating: 4.3, joinDate: '2023-07-01', lastActive: '2025-03-18', tags: ['land', 'agricultural', 'coimbatore'] },
  { id: 'BRK-004', name: 'Preethi Shankar', email: 'preethi.s@luxuryestates.in', phone: '+91 98410 55504', company: 'Luxury Estates India', reraId: 'TN/RERA/2024/0089', specialization: 'residential', city: 'Chennai', status: 'active', totalDeals: 6, totalValue: 1_20_00_00_000, commission: 3_60_00_000, rating: 4.9, joinDate: '2024-01-20', lastActive: '2025-03-20', assignedRM: 'Priya Natarajan', tags: ['luxury', 'HNI', 'beach-road', 'premium'] },
  { id: 'BRK-005', name: 'Murugan Selvam', email: 'murugan.s@industrialzone.com', phone: '+91 98410 55505', company: 'Industrial Zone Realty', specialization: 'industrial', city: 'Hosur', status: 'pending-verification', totalDeals: 3, totalValue: 22_00_00_000, commission: 44_00_000, rating: 4.1, joinDate: '2024-10-05', lastActive: '2025-03-10', tags: ['industrial', 'warehousing', 'hosur'] },
  { id: 'BRK-006', name: 'Deepa Raghunathan', email: 'deepa.r@mixeddev.co', phone: '+91 98410 55506', company: 'MixedDev Properties', reraId: 'KA/RERA/2023/0845', specialization: 'mixed-use', city: 'Bangalore', status: 'active', totalDeals: 9, totalValue: 65_00_00_000, commission: 1_30_00_000, rating: 4.5, joinDate: '2023-05-12', lastActive: '2025-03-17', assignedRM: 'Venkatesh Raghavan', tags: ['mixed-use', 'bangalore', 'township'] },
]

export const BROKER_INQUIRIES_DATA: BrokerInquiry[] = [
  { id: 'BIQ-001', brokerName: 'New Broker - Karthik M', source: 'website', type: 'realty', subject: 'Partnership for OMR corridor projects', message: 'We have 3 upcoming residential projects in OMR and are looking for investment partners.', status: 'new', priority: 'high', createdDate: '2025-03-20', lastUpdated: '2025-03-20', propertyType: 'Residential Apartment', location: 'Chennai - OMR', estimatedValue: 15_00_00_000 },
  { id: 'BIQ-002', brokerId: 'BRK-003', brokerName: 'Rajkumar Pandian', source: 'direct', type: 'land', subject: '50 acres agricultural land in Pollachi', message: 'Prime agricultural land available near Pollachi with road access and water source.', status: 'contacted', priority: 'medium', assignedTo: 'Venkatesh Raghavan', createdDate: '2025-03-18', lastUpdated: '2025-03-19', propertyType: 'Agricultural Land', location: 'Pollachi, Coimbatore', estimatedValue: 8_00_00_000 },
  { id: 'BIQ-003', brokerName: 'Aruna Devi', source: 'website', type: 'land', subject: 'Land parcel near upcoming metro station', message: 'I am a land broker with a 2-acre plot near the upcoming Chennai metro extension.', status: 'new', priority: 'high', createdDate: '2025-03-19', lastUpdated: '2025-03-19', propertyType: 'Commercial Land', location: 'Chennai - Poonamallee', estimatedValue: 12_00_00_000 },
  { id: 'BIQ-004', brokerId: 'BRK-001', brokerName: 'Suresh Balakrishnan', source: 'referral', type: 'realty', subject: 'Distressed villa project in ECR', message: 'A villa project on ECR is stalled - developer looking for financial rescue or takeover.', status: 'in-progress', priority: 'high', assignedTo: 'Priya Natarajan', createdDate: '2025-03-15', lastUpdated: '2025-03-20', propertyType: 'Villa Project', location: 'Chennai - ECR', estimatedValue: 45_00_00_000 },
  { id: 'BIQ-005', brokerName: 'Vinod Kumar', source: 'event', type: 'partnership', subject: 'JV proposal for Trichy commercial hub', message: 'Proposing a joint venture for a commercial hub development in Trichy.', status: 'contacted', priority: 'medium', assignedTo: 'Venkatesh Raghavan', createdDate: '2025-03-12', lastUpdated: '2025-03-16', propertyType: 'Commercial Complex', location: 'Trichy', estimatedValue: 25_00_00_000 },
  { id: 'BIQ-006', brokerId: 'BRK-004', brokerName: 'Preethi Shankar', source: 'direct', type: 'listing', subject: 'Listing request - Besant Nagar luxury apartment', message: 'Exclusive listing for a 4BHK sea-facing apartment in Besant Nagar.', status: 'converted', priority: 'low', assignedTo: 'Priya Natarajan', createdDate: '2025-03-01', lastUpdated: '2025-03-10', propertyType: 'Luxury Apartment', location: 'Chennai - Besant Nagar', estimatedValue: 5_50_00_000 },
]

// ── Marketing Module Data ────────────────────────────────────────
export const MARKETING_KPIS: MarketingKPIs = {
  totalLeads: 234,
  leadsTrend: 18.5,
  campaignROI: 285,
  emailOpenRate: 32.4,
  socialEngagement: 4.7,
  marketingSpend: 8_50_000,
  marketingBudget: 12_00_000,
  websiteTraffic: 24680,
  trafficTrend: 22.3,
}

export const MARKETING_CAMPAIGNS_DATA: MarketingCampaign[] = [
  { id: 'MC-001', name: 'Q1 Investor Outreach', type: 'email', channels: ['email'], status: 'live', startDate: '2025-01-15', endDate: '2025-03-31', budget: 2_00_000, spend: 1_45_000, leads: 67, roi: 340, owner: 'Kavya Sharma', description: 'Targeted email campaign for HNI investors in South India' },
  { id: 'MC-002', name: 'LinkedIn Thought Leadership', type: 'social', channels: ['linkedin'], status: 'live', startDate: '2025-02-01', budget: 1_50_000, spend: 82_000, leads: 34, roi: 220, owner: 'Arun Selvam', description: 'Weekly LinkedIn posts establishing GHL as AIF thought leader' },
  { id: 'MC-003', name: 'Google Ads - AIF Investment', type: 'google-ads', channels: ['google-ads'], status: 'live', startDate: '2025-01-01', budget: 3_00_000, spend: 2_15_000, leads: 89, roi: 310, owner: 'Kavya Sharma', description: 'Search ads targeting "alternative investment fund" keywords' },
  { id: 'MC-004', name: 'Chennai Investor Seminar', type: 'event', channels: ['email', 'linkedin', 'whatsapp'], status: 'scheduled', startDate: '2025-04-15', budget: 5_00_000, spend: 1_20_000, leads: 0, roi: 0, owner: 'Kavya Sharma', description: 'In-person seminar at ITC Grand Chola for 100 HNI prospects' },
  { id: 'MC-005', name: 'WhatsApp Fund Updates', type: 'whatsapp', channels: ['whatsapp'], status: 'live', startDate: '2025-01-01', budget: 50_000, spend: 18_000, leads: 12, roi: 450, owner: 'Arun Selvam', description: 'Monthly fund performance updates via WhatsApp Business' },
  { id: 'MC-006', name: 'Meta Ads - Wealth Creation', type: 'meta-ads', channels: ['facebook', 'instagram'], status: 'paused', startDate: '2025-02-15', endDate: '2025-03-15', budget: 1_00_000, spend: 95_000, leads: 28, roi: 180, owner: 'Arun Selvam', description: 'Instagram and Facebook ads for wealth creation awareness' },
  { id: 'MC-007', name: 'Telegram Investors Club', type: 'telegram', channels: ['telegram'], status: 'live', startDate: '2024-11-01', budget: 25_000, spend: 8_000, leads: 15, roi: 520, owner: 'Kavya Sharma', description: 'Exclusive Telegram community for existing and prospective investors' },
  { id: 'MC-008', name: 'Real Estate Fund Launch', type: 'multi-channel', channels: ['email', 'linkedin', 'google-ads', 'whatsapp', 'telegram'], status: 'draft', startDate: '2025-05-01', budget: 8_00_000, spend: 0, leads: 0, roi: 0, owner: 'Kavya Sharma', description: 'Multi-channel campaign for new ₹200Cr stressed real estate fund' },
]

export const MARKETING_CONTENT_DATA: ContentItem[] = [
  { id: 'CNT-001', title: 'Why Category II AIFs Outperform FDs', type: 'blog', channel: 'email', status: 'published', publishedDate: '2025-03-15', author: 'Kavya Sharma', engagement: 1240 },
  { id: 'CNT-002', title: 'Q4 2024 Fund Performance Report', type: 'infographic', channel: 'linkedin', status: 'published', publishedDate: '2025-03-18', author: 'Arun Selvam', engagement: 856 },
  { id: 'CNT-003', title: 'Investor Seminar Teaser Video', type: 'video', channel: 'instagram', status: 'scheduled', scheduledDate: '2025-04-01', author: 'Arun Selvam' },
  { id: 'CNT-004', title: '5 Reasons HNIs Choose AIFs', type: 'social-post', channel: 'linkedin', status: 'review', author: 'Kavya Sharma' },
  { id: 'CNT-005', title: 'Chennai Real Estate Market Report', type: 'brochure', channel: 'email', status: 'draft', author: 'Kavya Sharma' },
  { id: 'CNT-006', title: 'NRI Investment Guide Landing Page', type: 'landing-page', channel: 'google-ads', status: 'published', publishedDate: '2025-03-10', author: 'Arun Selvam', engagement: 3200 },
]

export const AUDIENCE_SEGMENTS_DATA: AudienceSegment[] = [
  { id: 'SEG-001', name: 'Chennai HNIs', description: 'High net-worth individuals in Chennai with ₹5Cr+ investable assets', contactCount: 1240, type: 'dynamic', criteria: 'City=Chennai, NetWorth>5Cr, Status=Active', lastUsed: '2025-03-19', createdBy: 'Kavya Sharma' },
  { id: 'SEG-002', name: 'South India Business Owners', description: 'Business owners across TN, KA, KL, AP with investment interest', contactCount: 3450, type: 'dynamic', criteria: 'State IN (TN,KA,KL,AP), Profession=Business Owner', lastUsed: '2025-03-18', createdBy: 'Kavya Sharma' },
  { id: 'SEG-003', name: 'NRI Investors', description: 'Non-resident Indians interested in India-based alternative investments', contactCount: 890, type: 'dynamic', criteria: 'Residency=NRI, Interest=AIF', lastUsed: '2025-03-15', createdBy: 'Arun Selvam' },
  { id: 'SEG-004', name: 'Event Attendees 2024', description: 'All attendees from 2024 investor events and webinars', contactCount: 456, type: 'static', criteria: 'EventAttended IN 2024', createdBy: 'Kavya Sharma' },
  { id: 'SEG-005', name: 'Cold Leads - Re-engagement', description: 'Leads with no activity in 90+ days needing re-engagement', contactCount: 678, type: 'dynamic', criteria: 'LastActivity > 90 days, Status != Converted', lastUsed: '2025-03-10', createdBy: 'Kavya Sharma' },
  { id: 'SEG-006', name: 'Real Estate Investors', description: 'Contacts specifically interested in real estate fund opportunities', contactCount: 1850, type: 'dynamic', criteria: 'Interest=Real Estate OR Fund=Stressed Assets', lastUsed: '2025-03-20', createdBy: 'Arun Selvam' },
]

export const OUTREACH_SEQUENCES_DATA: OutreachSequence[] = [
  { id: 'SEQ-001', name: 'HNI Cold Outreach', channel: 'email', steps: 7, enrolled: 450, completed: 312, responseRate: 24.5, status: 'active' },
  { id: 'SEQ-002', name: 'Event Follow-up', channel: 'email', steps: 5, enrolled: 120, completed: 98, responseRate: 42.3, status: 'active' },
  { id: 'SEQ-003', name: 'Investment Education Nurture', channel: 'email', steps: 10, enrolled: 890, completed: 456, responseRate: 18.7, status: 'active' },
  { id: 'SEQ-004', name: 'WhatsApp Welcome Series', channel: 'whatsapp', steps: 4, enrolled: 234, completed: 201, responseRate: 67.8, status: 'active' },
  { id: 'SEQ-005', name: 'Telegram Onboarding', channel: 'telegram', steps: 3, enrolled: 156, completed: 142, responseRate: 78.2, status: 'active' },
  { id: 'SEQ-006', name: 'Re-engagement Campaign', channel: 'multi-channel', steps: 3, enrolled: 678, completed: 0, responseRate: 0, status: 'draft' },
]

export const MARKETING_AI_TOOLS: MarketingAITool[] = [
  { id: 'mkt-copywriter', name: 'AI Copywriter', description: 'Generate marketing copy for any channel with GHL brand voice', icon: 'PenTool', category: 'content', status: 'active' },
  { id: 'mkt-ab-test', name: 'A/B Test Optimizer', description: 'Intelligent A/B testing with auto-optimization', icon: 'SplitSquareVertical', category: 'optimization', status: 'active' },
  { id: 'mkt-audience-predictor', name: 'Audience Predictor', description: 'Predict which prospects are most likely to convert', icon: 'UserCheck', category: 'analytics', status: 'active' },
  { id: 'mkt-seo-optimizer', name: 'Content SEO Optimizer', description: 'Optimize content for search engines and rankings', icon: 'Search', category: 'optimization', status: 'active' },
  { id: 'mkt-brand-voice', name: 'Brand Voice Guardian', description: 'Ensure marketing content matches GHL brand voice', icon: 'ShieldCheck', category: 'content', status: 'active' },
  { id: 'mkt-competitor-intel', name: 'Competitor Intelligence', description: 'Automated competitor monitoring and strategic analysis', icon: 'Eye', category: 'intelligence', status: 'active' },
  { id: 'mkt-campaign-strategist', name: 'Campaign Strategist', description: 'AI plans entire campaigns from a single brief', icon: 'Target', category: 'automation', status: 'active' },
  { id: 'mkt-hashtag-optimizer', name: 'Hashtag Optimizer', description: 'Optimize hashtags and keywords for social media reach', icon: 'Hash', category: 'optimization', status: 'active' },
  { id: 'mkt-visual-gen', name: 'Visual Generator', description: 'AI-assisted visual content and creative generation', icon: 'Image', category: 'content', status: 'active' },
  { id: 'mkt-budget-optimizer', name: 'Budget Optimizer', description: 'Optimize marketing spend allocation across channels', icon: 'PieChart', category: 'optimization', status: 'active' },
  { id: 'mkt-persona-builder', name: 'Persona Builder', description: 'Build data-driven buyer personas from client data', icon: 'Users', category: 'intelligence', status: 'active' },
  { id: 'mkt-smart-reply', name: 'Smart Reply Assistant', description: 'AI contextual response generation across channels', icon: 'MessageCircle', category: 'automation', status: 'active' },
  { id: 'mkt-landing-page', name: 'Landing Page Generator', description: 'Generate high-converting landing pages from a brief', icon: 'Layout', category: 'content', status: 'active' },
  { id: 'mkt-reputation', name: 'Reputation Manager', description: 'Monitor and manage online reputation and reviews', icon: 'Star', category: 'intelligence', status: 'active' },
  { id: 'mkt-send-time', name: 'Predictive Send-Time', description: 'Optimal time to send messages to each contact', icon: 'Clock', category: 'optimization', status: 'active' },
  { id: 'mkt-repurposer', name: 'Content Repurposer', description: 'Turn one content piece into multi-channel suite', icon: 'Repeat', category: 'content', status: 'active' },
  { id: 'mkt-video-script', name: 'Video Script Generator', description: 'Create video scripts and storyboards from concept', icon: 'Video', category: 'content', status: 'active' },
  { id: 'mkt-multilingual', name: 'Multilingual Adapter', description: 'Adapt campaigns for Indian multilingual audience', icon: 'Globe', category: 'automation', status: 'active' },
]

export const INTEGRATION_SERVICES_DATA: IntegrationService[] = [
  { id: 'int-google', name: 'Google Ads + GA4 + GSC', icon: 'Chrome', status: 'connected', lastSync: '2025-03-20T09:00:00', dataFlowing: 'Campaigns, Analytics, Search data', category: 'advertising' },
  { id: 'int-meta', name: 'Meta (Facebook + Instagram)', icon: 'Facebook', status: 'connected', lastSync: '2025-03-20T08:45:00', dataFlowing: 'Ad campaigns, Page insights', category: 'advertising' },
  { id: 'int-linkedin', name: 'LinkedIn Ads', icon: 'Linkedin', status: 'connected', lastSync: '2025-03-20T09:15:00', dataFlowing: 'Sponsored content, Lead Gen', category: 'advertising' },
  { id: 'int-youtube', name: 'YouTube', icon: 'Youtube', status: 'connected', lastSync: '2025-03-20T07:00:00', dataFlowing: 'Channel analytics, Video stats', category: 'social' },
  { id: 'int-twitter', name: 'Twitter / X', icon: 'Twitter', status: 'connected', lastSync: '2025-03-20T08:30:00', dataFlowing: 'Posts, Engagement, Ads', category: 'social' },
  { id: 'int-whatsapp', name: 'WhatsApp Business', icon: 'MessageCircle', status: 'connected', lastSync: '2025-03-20T09:30:00', dataFlowing: 'Messages, Templates', category: 'messaging' },
  { id: 'int-telegram', name: 'Telegram Business', icon: 'Send', status: 'connected', lastSync: '2025-03-20T09:25:00', dataFlowing: 'Channels, Bot commands', category: 'messaging' },
  { id: 'int-apollo', name: 'Apollo.io', icon: 'Compass', status: 'connected', lastSync: '2025-03-19T23:00:00', dataFlowing: 'Contact enrichment data', category: 'crm' },
  { id: 'int-google-biz', name: 'Google Business Profile', icon: 'MapPin', status: 'connected', lastSync: '2025-03-20T06:00:00', dataFlowing: 'Reviews, Insights', category: 'social' },
  { id: 'int-calendly', name: 'Calendly', icon: 'Calendar', status: 'connected', lastSync: '2025-03-20T09:00:00', dataFlowing: 'Bookings, Availability', category: 'scheduling' },
  { id: 'int-crm-sync', name: 'CRM Sync (Zoho)', icon: 'RefreshCw', status: 'pending', dataFlowing: 'Pending configuration', category: 'crm' },
  { id: 'int-zapier', name: 'Zapier + Webhooks', icon: 'Zap', status: 'connected', lastSync: '2025-03-20T09:00:00', dataFlowing: '12 active Zaps', category: 'automation' },
  { id: 'int-pixels', name: 'Pixels & Tag Manager', icon: 'Code', status: 'connected', lastSync: '2025-03-20T08:00:00', dataFlowing: 'GTM, Meta Pixel, LinkedIn', category: 'analytics' },
  { id: 'int-smtp', name: 'Email SMTP', icon: 'Mail', status: 'connected', lastSync: '2025-03-20T09:35:00', dataFlowing: 'Transactional + Marketing', category: 'messaging' },
]

export const CHANNEL_PERFORMANCE_DATA = [
  { channel: 'Email', leads: 67, spend: 145000, color: '#3B82F6' },
  { channel: 'Google Ads', leads: 89, spend: 215000, color: '#F59E0B' },
  { channel: 'LinkedIn', leads: 34, spend: 82000, color: '#0A66C2' },
  { channel: 'Meta Ads', leads: 28, spend: 95000, color: '#E1306C' },
  { channel: 'WhatsApp', leads: 12, spend: 18000, color: '#25D366' },
  { channel: 'Telegram', leads: 15, spend: 8000, color: '#0088CC' },
  { channel: 'Events', leads: 23, spend: 120000, color: '#8B5CF6' },
  { channel: 'Referrals', leads: 18, spend: 0, color: '#10B981' },
  { channel: 'Organic Social', leads: 11, spend: 0, color: '#6366F1' },
]
