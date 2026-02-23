/* ================================================================
   GHL INTELLIGENCE OS — UNIFIED REPORTS DATA LAYER
   Comprehensive simulated data engine for the Reports module.
   All data stored in LocalStorage, initialized with realistic seed data.
   ================================================================ */

import type {
  AIInsight, RevenueStream, ExpenseRecord, CampaignMetric,
  ScheduledReport, GeneratedReport, EmailDraft, CallLog,
  DocumentVaultItem, KPIAlert,
} from './adminTypes'

// ═══════════════════════════════════════════════════════════════
// USERS & STAFF
// ═══════════════════════════════════════════════════════════════

export interface ReportUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  portal: string
  department?: string
  status: 'active' | 'inactive'
}

export const REPORT_USERS: ReportUser[] = [
  { id: 'USR001', firstName: 'Abe', lastName: 'Thayil', email: 'abe@ghlindiaventures.com', role: 'super_admin', portal: 'admin', department: 'Executive', status: 'active' },
  { id: 'USR002', firstName: 'Priya', lastName: 'Krishnan', email: 'priya@ghlindiaventures.com', role: 'admin', portal: 'admin', department: 'Operations', status: 'active' },
  { id: 'USR003', firstName: 'Rajesh', lastName: 'Sundaram', email: 'rajesh@ghlindiaventures.com', role: 'staff', portal: 'staff', department: 'Fund Management', status: 'active' },
  { id: 'USR004', firstName: 'Meera', lastName: 'Iyer', email: 'meera@ghlindiaventures.com', role: 'staff', portal: 'staff', department: 'Compliance', status: 'active' },
  { id: 'USR005', firstName: 'Arjun', lastName: 'Reddy', email: 'arjun@ghlindiaventures.com', role: 'staff', portal: 'staff', department: 'Marketing', status: 'active' },
  { id: 'USR006', firstName: 'Kavitha', lastName: 'Nair', email: 'kavitha@ghlindiaventures.com', role: 'staff', portal: 'staff', department: 'Investor Relations', status: 'active' },
  { id: 'USR007', firstName: 'Suresh', lastName: 'Venkataraman', email: 'suresh@ghlindiaventures.com', role: 'staff', portal: 'staff', department: 'Technology', status: 'active' },
  { id: 'USR008', firstName: 'Ananya', lastName: 'Pillai', email: 'ananya@ghlindiaventures.com', role: 'staff', portal: 'staff', department: 'Client Success', status: 'active' },
  { id: 'USR009', firstName: 'Deepak', lastName: 'Naidu', email: 'deepak@ghlindiaventures.com', role: 'staff', portal: 'staff', department: 'Legal', status: 'active' },
  { id: 'USR010', firstName: 'Lakshmi', lastName: 'Ramachandran', email: 'lakshmi@ghlindiaventures.com', role: 'staff', portal: 'staff', department: 'HR', status: 'active' },
]

// ═══════════════════════════════════════════════════════════════
// CLIENTS (HNI / UHNI Investors)
// ═══════════════════════════════════════════════════════════════

export interface ReportClient {
  id: string
  name: string
  email: string
  phone: string
  tier: 1 | 2 | 3 | 4 | 5
  investmentAmount: number
  currentValue: number
  source: string
  assignedStaff: string
  city: string
  status: 'active' | 'dormant' | 'churned'
  joinedDate: string
  lastActive: string
}

export const REPORT_CLIENTS: ReportClient[] = [
  { id: 'CLT001', name: 'Vikram Malhotra', email: 'vikram.m@gmail.com', phone: '+91 98400 12345', tier: 5, investmentAmount: 250000000, currentValue: 287500000, source: 'Direct Referral', assignedStaff: 'USR006', city: 'Chennai', status: 'active', joinedDate: '2024-06-15', lastActive: '2025-02-20' },
  { id: 'CLT002', name: 'Anitha Rajan', email: 'anitha.r@outlook.com', phone: '+91 98841 23456', tier: 3, investmentAmount: 50000000, currentValue: 56250000, source: 'Google Ads', assignedStaff: 'USR006', city: 'Mumbai', status: 'active', joinedDate: '2024-08-22', lastActive: '2025-02-18' },
  { id: 'CLT003', name: 'Sanjay Gupta (NRI)', email: 'sanjay.g@nri.com', phone: '+1 650 555 1234', tier: 4, investmentAmount: 150000000, currentValue: 172500000, source: 'LinkedIn', assignedStaff: 'USR006', city: 'San Francisco', status: 'active', joinedDate: '2024-09-10', lastActive: '2025-02-19' },
  { id: 'CLT004', name: 'Ramesh Chandrasekhar', email: 'ramesh.c@yahoo.com', phone: '+91 99440 67890', tier: 2, investmentAmount: 30000000, currentValue: 33600000, source: 'Website Organic', assignedStaff: 'USR008', city: 'Bangalore', status: 'active', joinedDate: '2024-07-05', lastActive: '2025-02-15' },
  { id: 'CLT005', name: 'Divya Srinivasan', email: 'divya.s@hotmail.com', phone: '+91 98765 43210', tier: 1, investmentAmount: 5000000, currentValue: 5475000, source: 'Referral', assignedStaff: 'USR008', city: 'Chennai', status: 'active', joinedDate: '2024-10-01', lastActive: '2025-02-22' },
  { id: 'CLT006', name: 'Ashwin Krishnamurthy', email: 'ashwin.k@gmail.com', phone: '+91 94440 11223', tier: 3, investmentAmount: 75000000, currentValue: 84000000, source: 'LinkedIn', assignedStaff: 'USR006', city: 'Delhi', status: 'active', joinedDate: '2024-05-20', lastActive: '2025-02-21' },
  { id: 'CLT007', name: 'Nandini Pai', email: 'nandini.p@proton.me', phone: '+91 98801 44556', tier: 4, investmentAmount: 200000000, currentValue: 224000000, source: 'Event', assignedStaff: 'USR006', city: 'Hyderabad', status: 'active', joinedDate: '2024-04-12', lastActive: '2025-02-17' },
  { id: 'CLT008', name: 'Prakash Menon (NRI)', email: 'prakash.m@nri.ae', phone: '+971 50 555 6789', tier: 5, investmentAmount: 350000000, currentValue: 399000000, source: 'Direct Referral', assignedStaff: 'USR006', city: 'Dubai', status: 'active', joinedDate: '2024-03-01', lastActive: '2025-02-20' },
  { id: 'CLT009', name: 'Supriya Hegde', email: 'supriya.h@gmail.com', phone: '+91 98450 77889', tier: 2, investmentAmount: 15000000, currentValue: 16350000, source: 'Google Ads', assignedStaff: 'USR008', city: 'Bangalore', status: 'active', joinedDate: '2024-11-15', lastActive: '2025-02-14' },
  { id: 'CLT010', name: 'Karthik Ranganathan', email: 'karthik.r@outlook.com', phone: '+91 99001 55667', tier: 3, investmentAmount: 60000000, currentValue: 66600000, source: 'Meta Ads', assignedStaff: 'USR008', city: 'Chennai', status: 'active', joinedDate: '2024-07-30', lastActive: '2025-02-22' },
  { id: 'CLT011', name: 'Harini Balasubramanian', email: 'harini.b@yahoo.com', phone: '+91 98410 22334', tier: 1, investmentAmount: 7500000, currentValue: 8100000, source: 'WhatsApp', assignedStaff: 'USR008', city: 'Coimbatore', status: 'active', joinedDate: '2024-12-05', lastActive: '2025-02-10' },
  { id: 'CLT012', name: 'Mohan Lal Agarwal', email: 'mohan.a@gmail.com', phone: '+91 98110 33445', tier: 4, investmentAmount: 180000000, currentValue: 198000000, source: 'Event', assignedStaff: 'USR006', city: 'Delhi', status: 'active', joinedDate: '2024-06-28', lastActive: '2025-02-19' },
  { id: 'CLT013', name: 'Revathi Narayanan', email: 'revathi.n@proton.me', phone: '+91 98760 55667', tier: 2, investmentAmount: 25000000, currentValue: 27250000, source: 'LinkedIn', assignedStaff: 'USR008', city: 'Mumbai', status: 'dormant', joinedDate: '2024-04-18', lastActive: '2024-12-30' },
  { id: 'CLT014', name: 'Govind Sharma (NRI)', email: 'govind.s@nri.uk', phone: '+44 7700 900123', tier: 3, investmentAmount: 80000000, currentValue: 88800000, source: 'LinkedIn', assignedStaff: 'USR006', city: 'London', status: 'active', joinedDate: '2024-08-15', lastActive: '2025-02-16' },
  { id: 'CLT015', name: 'Padma Lakshmi', email: 'padma.l@gmail.com', phone: '+91 94430 66778', tier: 1, investmentAmount: 3000000, currentValue: 3180000, source: 'Website Organic', assignedStaff: 'USR008', city: 'Madurai', status: 'active', joinedDate: '2025-01-10', lastActive: '2025-02-21' },
  { id: 'CLT016', name: 'Arun Venkatesh', email: 'arun.v@hotmail.com', phone: '+91 97890 77889', tier: 2, investmentAmount: 12000000, currentValue: 12960000, source: 'Social Media', assignedStaff: 'USR008', city: 'Pune', status: 'active', joinedDate: '2024-10-20', lastActive: '2025-02-13' },
  { id: 'CLT017', name: 'Ranjit Singh (NRI)', email: 'ranjit.s@nri.sg', phone: '+65 8123 4567', tier: 5, investmentAmount: 500000000, currentValue: 565000000, source: 'Direct Referral', assignedStaff: 'USR006', city: 'Singapore', status: 'active', joinedDate: '2024-02-14', lastActive: '2025-02-22' },
  { id: 'CLT018', name: 'Indira Choudhury', email: 'indira.c@gmail.com', phone: '+91 98330 88990', tier: 1, investmentAmount: 5000000, currentValue: 5250000, source: 'Google Ads', assignedStaff: 'USR008', city: 'Kolkata', status: 'churned', joinedDate: '2024-05-10', lastActive: '2024-11-15' },
  { id: 'CLT019', name: 'Venkat Rajagopal', email: 'venkat.r@outlook.com', phone: '+91 98400 99001', tier: 3, investmentAmount: 100000000, currentValue: 113000000, source: 'Event', assignedStaff: 'USR006', city: 'Chennai', status: 'active', joinedDate: '2024-04-05', lastActive: '2025-02-21' },
  { id: 'CLT020', name: 'Meenakshi Devi', email: 'meenakshi.d@yahoo.com', phone: '+91 99440 10112', tier: 2, investmentAmount: 20000000, currentValue: 22000000, source: 'Referral', assignedStaff: 'USR008', city: 'Bangalore', status: 'active', joinedDate: '2024-09-25', lastActive: '2025-02-18' },
]

// ═══════════════════════════════════════════════════════════════
// REVENUE STREAMS (12 months)
// ═══════════════════════════════════════════════════════════════

export const REVENUE_STREAMS: RevenueStream[] = [
  // Jan 2025
  { id: 'REV001', clientId: 'CLT001', type: 'management_fee', amount: 5000000, period: '2025-01', source: 'AIF' },
  { id: 'REV002', clientId: 'CLT001', type: 'performance_fee', amount: 12500000, period: '2025-01', source: 'AIF' },
  { id: 'REV003', clientId: 'CLT002', type: 'advisory_fee', amount: 500000, period: '2025-01', source: 'Advisory' },
  { id: 'REV004', clientId: 'CLT003', type: 'management_fee', amount: 3000000, period: '2025-01', source: 'AIF' },
  { id: 'REV005', clientId: 'CLT008', type: 'management_fee', amount: 7000000, period: '2025-01', source: 'AIF' },
  { id: 'REV006', clientId: 'CLT017', type: 'management_fee', amount: 10000000, period: '2025-01', source: 'AIF' },
  { id: 'REV007', type: 'subscription', amount: 250000, period: '2025-01', source: 'Platform' },
  { id: 'REV008', type: 'referral_commission', amount: 800000, period: '2025-01', source: 'Partners' },
  // Feb 2025
  { id: 'REV009', clientId: 'CLT001', type: 'management_fee', amount: 5000000, period: '2025-02', source: 'AIF' },
  { id: 'REV010', clientId: 'CLT007', type: 'management_fee', amount: 4000000, period: '2025-02', source: 'AIF' },
  { id: 'REV011', clientId: 'CLT008', type: 'management_fee', amount: 7000000, period: '2025-02', source: 'AIF' },
  { id: 'REV012', clientId: 'CLT012', type: 'advisory_fee', amount: 1800000, period: '2025-02', source: 'Advisory' },
  { id: 'REV013', clientId: 'CLT017', type: 'management_fee', amount: 10000000, period: '2025-02', source: 'AIF' },
  { id: 'REV014', type: 'subscription', amount: 275000, period: '2025-02', source: 'Platform' },
  { id: 'REV015', clientId: 'CLT006', type: 'performance_fee', amount: 3750000, period: '2025-02', source: 'AIF' },
  { id: 'REV016', type: 'referral_commission', amount: 950000, period: '2025-02', source: 'Partners' },
]

// Monthly summary for charts
export const MONTHLY_REVENUE = [
  { month: 'Mar 24', revenue: 12500000, expenses: 3800000 },
  { month: 'Apr 24', revenue: 14200000, expenses: 4100000 },
  { month: 'May 24', revenue: 15800000, expenses: 3900000 },
  { month: 'Jun 24', revenue: 16500000, expenses: 4200000 },
  { month: 'Jul 24', revenue: 18000000, expenses: 4500000 },
  { month: 'Aug 24', revenue: 17200000, expenses: 4300000 },
  { month: 'Sep 24', revenue: 19500000, expenses: 4600000 },
  { month: 'Oct 24', revenue: 21000000, expenses: 4800000 },
  { month: 'Nov 24', revenue: 22500000, expenses: 5100000 },
  { month: 'Dec 24', revenue: 25000000, expenses: 5500000 },
  { month: 'Jan 25', revenue: 39050000, expenses: 5200000 },
  { month: 'Feb 25', revenue: 32775000, expenses: 5400000 },
]

export const REVENUE_BY_TYPE = [
  { type: 'Management Fee (2%)', amount: 51000000, percentage: 38.2 },
  { type: 'Performance Fee (20%)', amount: 32500000, percentage: 24.3 },
  { type: 'Advisory Fee', amount: 23000000, percentage: 17.2 },
  { type: 'Subscription Income', amount: 13750000, percentage: 10.3 },
  { type: 'Referral Commission', amount: 13500000, percentage: 10.1 },
]

export const REVENUE_BY_CITY = [
  { city: 'Chennai', amount: 45000000, clients: 8 },
  { city: 'Mumbai', amount: 28000000, clients: 4 },
  { city: 'Bangalore', amount: 18500000, clients: 5 },
  { city: 'Delhi', amount: 22000000, clients: 3 },
  { city: 'Hyderabad', amount: 12500000, clients: 2 },
  { city: 'NRI (US/UK/UAE/SG)', amount: 42000000, clients: 5 },
]

// ═══════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════

export const EXPENSE_RECORDS: ExpenseRecord[] = [
  { id: 'EXP001', category: 'Salaries', subCategory: 'Full-time Staff', department: 'Operations', amount: 850000, vendor: 'Payroll', month: '2025-01' },
  { id: 'EXP002', category: 'Marketing', subCategory: 'Google Ads', department: 'Marketing', amount: 250000, vendor: 'Google', month: '2025-01', campaignId: 'CMP001' },
  { id: 'EXP003', category: 'Marketing', subCategory: 'Meta Ads', department: 'Marketing', amount: 180000, vendor: 'Meta', month: '2025-01', campaignId: 'CMP002' },
  { id: 'EXP004', category: 'Technology', subCategory: 'Hosting & CDN', department: 'Technology', amount: 15000, vendor: 'Netlify + Cloudflare', month: '2025-01' },
  { id: 'EXP005', category: 'Compliance', subCategory: 'SEBI Filing Fees', department: 'Compliance', amount: 50000, vendor: 'SEBI', month: '2025-01' },
  { id: 'EXP006', category: 'Office', subCategory: 'Rent - Egmore Office', department: 'Operations', amount: 120000, vendor: 'Landlord', month: '2025-01' },
  { id: 'EXP007', category: 'Salaries', subCategory: 'Contractor Payments', department: 'Technology', amount: 200000, vendor: 'Contractors', month: '2025-01' },
  { id: 'EXP008', category: 'Legal', subCategory: 'Auditor Fees', department: 'Compliance', amount: 150000, vendor: 'Kumar & Associates', month: '2025-01' },
  { id: 'EXP009', category: 'Marketing', subCategory: 'LinkedIn Ads', department: 'Marketing', amount: 150000, vendor: 'LinkedIn', month: '2025-01', campaignId: 'CMP003' },
  { id: 'EXP010', category: 'Marketing', subCategory: 'Content Production', department: 'Marketing', amount: 75000, vendor: 'Freelancers', month: '2025-01' },
  { id: 'EXP011', category: 'Travel', subCategory: 'Client Meetings', department: 'IR', amount: 80000, vendor: 'Various', month: '2025-01' },
  { id: 'EXP012', category: 'Technology', subCategory: 'API Services', department: 'Technology', amount: 25000, vendor: 'Claude API + Others', month: '2025-01' },
  { id: 'EXP013', category: 'Banking', subCategory: 'Transaction Fees', department: 'Finance', amount: 35000, vendor: 'HDFC Bank', month: '2025-01' },
  { id: 'EXP014', category: 'Office', subCategory: 'Utilities & Internet', department: 'Operations', amount: 18000, vendor: 'Various', month: '2025-01' },
]

export const EXPENSE_SUMMARY = [
  { category: 'Salaries & Payroll', amount: 1050000, budget: 1200000, percentage: 42.0 },
  { category: 'Marketing & Ads', amount: 655000, budget: 700000, percentage: 26.2 },
  { category: 'Technology', amount: 240000, budget: 300000, percentage: 9.6 },
  { category: 'Office & Operations', amount: 138000, budget: 150000, percentage: 5.5 },
  { category: 'Legal & Compliance', amount: 200000, budget: 250000, percentage: 8.0 },
  { category: 'Travel & Events', amount: 80000, budget: 100000, percentage: 3.2 },
  { category: 'Banking & Fees', amount: 35000, budget: 50000, percentage: 1.4 },
  { category: 'Others', amount: 102000, budget: 150000, percentage: 4.1 },
]

// ═══════════════════════════════════════════════════════════════
// CAMPAIGNS
// ═══════════════════════════════════════════════════════════════

export const CAMPAIGN_METRICS: CampaignMetric[] = [
  { id: 'CMP001', platform: 'Google', name: 'HNI Chennai AIF Search', spend: 250000, impressions: 45000, clicks: 1800, conversions: 12, revenueGenerated: 5000000, startDate: '2025-01-01', endDate: '2025-01-31', status: 'active' },
  { id: 'CMP002', platform: 'Meta', name: 'Instagram HNI Wealth Stories', spend: 180000, impressions: 120000, clicks: 3200, conversions: 8, revenueGenerated: 2000000, startDate: '2025-01-01', endDate: '2025-01-31', status: 'active' },
  { id: 'CMP003', platform: 'LinkedIn', name: 'AIF Awareness - CXOs India', spend: 150000, impressions: 28000, clicks: 900, conversions: 5, revenueGenerated: 7500000, startDate: '2025-01-01', endDate: '2025-01-31', status: 'active' },
  { id: 'CMP004', platform: 'YouTube', name: 'AIF Explainer Video Series', spend: 120000, impressions: 85000, clicks: 4200, conversions: 3, revenueGenerated: 1500000, startDate: '2025-01-15', status: 'active' },
  { id: 'CMP005', platform: 'Google', name: 'NRI Investment India Search', spend: 180000, impressions: 32000, clicks: 1400, conversions: 6, revenueGenerated: 9000000, startDate: '2024-12-01', endDate: '2025-01-31', status: 'completed' },
  { id: 'CMP006', platform: 'Meta', name: 'Facebook HNI Retargeting', spend: 95000, impressions: 65000, clicks: 2800, conversions: 4, revenueGenerated: 1200000, startDate: '2025-01-10', status: 'active' },
  { id: 'CMP007', platform: 'LinkedIn', name: 'Thought Leadership - Stressed Assets', spend: 75000, impressions: 18000, clicks: 600, conversions: 2, revenueGenerated: 3000000, startDate: '2024-11-01', status: 'paused' },
  { id: 'CMP008', platform: 'Google', name: 'Brand - GHL India Ventures', spend: 50000, impressions: 22000, clicks: 800, conversions: 1, revenueGenerated: 500000, startDate: '2025-01-01', status: 'active' },
]

// ═══════════════════════════════════════════════════════════════
// LEADS
// ═══════════════════════════════════════════════════════════════

export interface ReportLead {
  id: string
  name: string
  email: string
  phone: string
  source: string
  campaignId?: string
  status: 'new' | 'contacted' | 'qualified' | 'pitched' | 'negotiating' | 'won' | 'lost'
  score: number
  city: string
  estimatedValue: number
  createdAt: string
}

export const REPORT_LEADS: ReportLead[] = [
  { id: 'LED001', name: 'Deepak Sharma', email: 'deepak.s@xyz.com', phone: '+91 99100 12345', source: 'Google Ads', campaignId: 'CMP001', status: 'qualified', score: 85, city: 'Chennai', estimatedValue: 10000000, createdAt: '2025-01-15' },
  { id: 'LED002', name: 'Padma Subramaniam', email: 'padma.sub@abc.com', phone: '+91 98760 23456', source: 'Website Organic', status: 'contacted', score: 72, city: 'Mumbai', estimatedValue: 5000000, createdAt: '2025-01-18' },
  { id: 'LED003', name: 'Anil Kapoor', email: 'anil.k@outlook.com', phone: '+91 98100 34567', source: 'LinkedIn', campaignId: 'CMP003', status: 'pitched', score: 91, city: 'Delhi', estimatedValue: 25000000, createdAt: '2025-01-08' },
  { id: 'LED004', name: 'Geeta Rajendran', email: 'geeta.r@gmail.com', phone: '+91 94440 45678', source: 'Referral', status: 'negotiating', score: 88, city: 'Chennai', estimatedValue: 15000000, createdAt: '2024-12-20' },
  { id: 'LED005', name: 'Nikhil Banerjee (NRI)', email: 'nikhil.b@nri.us', phone: '+1 408 555 5678', source: 'LinkedIn', campaignId: 'CMP003', status: 'qualified', score: 78, city: 'Cupertino', estimatedValue: 50000000, createdAt: '2025-01-22' },
  { id: 'LED006', name: 'Sunita Chadha', email: 'sunita.c@hotmail.com', phone: '+91 99200 56789', source: 'Meta Ads', campaignId: 'CMP002', status: 'new', score: 65, city: 'Bangalore', estimatedValue: 3000000, createdAt: '2025-02-05' },
  { id: 'LED007', name: 'Rajiv Mehta', email: 'rajiv.m@gmail.com', phone: '+91 98300 67890', source: 'Google Ads', campaignId: 'CMP005', status: 'won', score: 95, city: 'Mumbai', estimatedValue: 80000000, createdAt: '2024-12-01' },
  { id: 'LED008', name: 'Asha Raghunath', email: 'asha.r@yahoo.com', phone: '+91 97860 78901', source: 'Event', status: 'lost', score: 55, city: 'Hyderabad', estimatedValue: 7000000, createdAt: '2024-11-10' },
  { id: 'LED009', name: 'Manoj Tiwari', email: 'manoj.t@proton.me', phone: '+91 99500 89012', source: 'WhatsApp', status: 'contacted', score: 68, city: 'Pune', estimatedValue: 4000000, createdAt: '2025-02-10' },
  { id: 'LED010', name: 'Fatima Sheikh (NRI)', email: 'fatima.s@nri.ae', phone: '+971 55 555 9012', source: 'LinkedIn', status: 'qualified', score: 82, city: 'Abu Dhabi', estimatedValue: 100000000, createdAt: '2025-01-28' },
  { id: 'LED011', name: 'Vishal Deshpande', email: 'vishal.d@gmail.com', phone: '+91 98900 90123', source: 'Google Ads', campaignId: 'CMP001', status: 'new', score: 60, city: 'Chennai', estimatedValue: 2000000, createdAt: '2025-02-18' },
  { id: 'LED012', name: 'Nalini Krishnaswamy', email: 'nalini.k@outlook.com', phone: '+91 94430 01234', source: 'Website Organic', status: 'pitched', score: 75, city: 'Coimbatore', estimatedValue: 8000000, createdAt: '2025-01-05' },
]

// Funnel data
export const LEAD_FUNNEL = [
  { stage: 'Website Visitors', count: 12500, percentage: 100 },
  { stage: 'Lead Submissions', count: 485, percentage: 3.88 },
  { stage: 'Qualified Leads', count: 142, percentage: 29.3 },
  { stage: 'Advisor Calls', count: 89, percentage: 62.7 },
  { stage: 'Proposals Sent', count: 52, percentage: 58.4 },
  { stage: 'Committed', count: 28, percentage: 53.8 },
  { stage: 'Funded', count: 20, percentage: 71.4 },
]

// ═══════════════════════════════════════════════════════════════
// KPIs
// ═══════════════════════════════════════════════════════════════

export const REPORT_KPIS = {
  totalAUM: 2530000000,           // ₹253 Cr
  totalAUMChange: 14.6,
  totalClients: 20,
  activeClients: 17,
  newClientsMonth: 3,
  retentionRate: 94.7,
  monthlyRevenue: 32775000,       // ₹3.28 Cr
  revenueChange: 12.3,
  monthlyExpenses: 5200000,       // ₹52 Lakh
  expenseChange: -3.7,
  netProfit: 27575000,
  profitMargin: 84.1,
  cac: 125000,                    // ₹1.25 Lakh
  ltv: 8500000,                   // ₹85 Lakh
  ltvCacRatio: 6.8,
  leadConversionRate: 8.2,
  staffProductivityScore: 78,
  nps: 72,
  burnRate: 5200000,
  cashRunway: 36,
  websiteVisitors: 12500,
  websiteVisitorsChange: 18.5,
  bounceRate: 42.3,
  avgSessionDuration: '3m 24s',
  aiHealthScore: 87,
}

// ═══════════════════════════════════════════════════════════════
// AI INSIGHTS
// ═══════════════════════════════════════════════════════════════

export const AI_INSIGHTS: AIInsight[] = [
  { id: 'INS001', type: 'growth', summary: 'LinkedIn campaigns show 3.2x higher ROI than Meta for UHNI acquisition. Consider reallocating 20% of Meta budget to LinkedIn.', confidence: 0.87, priority: 'high', createdAt: '2025-02-20', actionable: true, impact: '₹15L additional quarterly revenue' },
  { id: 'INS002', type: 'risk', summary: 'Client retention in Tier 1 segment (₹25L-1Cr) dropped 12% this quarter. Exit interviews suggest competitors offering lower management fees.', confidence: 0.79, priority: 'high', createdAt: '2025-02-19', actionable: true, impact: '₹8L potential churn risk' },
  { id: 'INS003', type: 'anomaly', summary: 'Google Ads CPC for "AIF investment Chennai" spiked 45% in last 2 weeks. Likely due to new competitor bidding. Recommend switching to long-tail keywords.', confidence: 0.92, priority: 'medium', createdAt: '2025-02-18', actionable: true, impact: '₹2.5L monthly ad spend savings' },
  { id: 'INS004', type: 'opportunity', summary: 'NRI segment from UAE shows 4x conversion rate vs domestic. Zero dedicated campaigns running for UAE NRIs. Immediate opportunity.', confidence: 0.85, priority: 'high', createdAt: '2025-02-17', actionable: true, impact: '₹50L potential new investments' },
  { id: 'INS005', type: 'efficiency', summary: 'Staff response time to investor queries averages 6.2 hours. Industry benchmark is 2 hours. Auto-acknowledgment emails could close this gap.', confidence: 0.91, priority: 'medium', createdAt: '2025-02-16', actionable: true, impact: 'Improved NPS by 8-12 points' },
  { id: 'INS006', type: 'growth', summary: 'Stressed real estate content generates 3x more qualified leads than general AIF content. Double content output in this niche.', confidence: 0.84, priority: 'medium', createdAt: '2025-02-15', actionable: true, impact: '₹20L additional pipeline' },
  { id: 'INS007', type: 'risk', summary: 'SEBI circular on AIF valuation norms expected in Q2 2025. Current NAV reporting may need adjustment. Recommend proactive compliance review.', confidence: 0.76, priority: 'high', createdAt: '2025-02-14', actionable: true },
  { id: 'INS008', type: 'opportunity', summary: 'Top 5 clients (by AUM) contribute 67% of total revenue. A dedicated concierge program could increase their investment by 15-20%.', confidence: 0.88, priority: 'high', createdAt: '2025-02-13', actionable: true, impact: '₹1.2Cr additional AUM' },
  { id: 'INS009', type: 'anomaly', summary: 'Website traffic from organic search dropped 18% in the last week. Possible Google algorithm update affecting financial content.', confidence: 0.73, priority: 'medium', createdAt: '2025-02-12', actionable: true },
  { id: 'INS010', type: 'efficiency', summary: 'Report generation takes average 45 minutes per staff member. Automating the monthly board report could save 12 hours/month across the team.', confidence: 0.95, priority: 'low', createdAt: '2025-02-11', actionable: true, impact: '144 hours saved annually' },
]

// ═══════════════════════════════════════════════════════════════
// SCHEDULED & GENERATED REPORTS
// ═══════════════════════════════════════════════════════════════

export const SCHEDULED_REPORTS: ScheduledReport[] = [
  { id: 'RPT001', name: 'Monthly Investor Report', type: 'board', frequency: 'monthly', lastRun: '2025-01-31', nextRun: '2025-02-28', status: 'ready', owner: 'Abe Thayil', recipients: ['board@ghlindiaventures.com'], format: ['pdf'], createdDate: '2024-06-01' },
  { id: 'RPT002', name: 'Weekly Marketing Digest', type: 'marketing', frequency: 'weekly', lastRun: '2025-02-17', nextRun: '2025-02-24', status: 'scheduled', owner: 'Arjun Reddy', recipients: ['marketing@ghlindiaventures.com'], format: ['pdf', 'xlsx'], createdDate: '2024-09-15' },
  { id: 'RPT003', name: 'Quarterly Compliance Report', type: 'compliance', frequency: 'quarterly', lastRun: '2024-12-31', nextRun: '2025-03-31', status: 'scheduled', owner: 'Meera Iyer', recipients: ['compliance@ghlindiaventures.com', 'sebi@gov.in'], format: ['pdf'], createdDate: '2024-04-01' },
  { id: 'RPT004', name: 'Client Portfolio Summary', type: 'client', frequency: 'monthly', lastRun: '2025-01-31', nextRun: '2025-02-28', status: 'ready', owner: 'Kavitha Nair', recipients: ['clients@ghlindiaventures.com'], format: ['pdf'], createdDate: '2024-07-01' },
  { id: 'RPT005', name: 'Staff Productivity Report', type: 'staff', frequency: 'weekly', lastRun: '2025-02-17', nextRun: '2025-02-24', status: 'scheduled', owner: 'Priya Krishnan', recipients: ['hr@ghlindiaventures.com'], format: ['xlsx'], createdDate: '2024-08-01' },
  { id: 'RPT006', name: 'Revenue P&L Statement', type: 'financial', frequency: 'monthly', lastRun: '2025-01-31', nextRun: '2025-02-28', status: 'ready', owner: 'Abe Thayil', recipients: ['finance@ghlindiaventures.com'], format: ['pdf', 'xlsx'], createdDate: '2024-04-01' },
  { id: 'RPT007', name: 'Annual Review Pack', type: 'board', frequency: 'annual', lastRun: '2024-12-31', nextRun: '2025-12-31', status: 'sent', owner: 'Abe Thayil', recipients: ['board@ghlindiaventures.com', 'trustees@ghlindiaventures.com'], format: ['pdf'], createdDate: '2024-01-01' },
  { id: 'RPT008', name: 'Campaign ROI Analysis', type: 'marketing', frequency: 'monthly', lastRun: '2025-01-31', nextRun: '2025-02-28', status: 'generating', owner: 'Arjun Reddy', recipients: ['marketing@ghlindiaventures.com'], format: ['pdf', 'csv'], createdDate: '2024-10-01' },
]

export const GENERATED_REPORTS: GeneratedReport[] = [
  { id: 'GEN001', name: 'January 2025 Board Report', type: 'board', format: 'pdf', generatedAt: '2025-01-31T18:00:00', generatedBy: 'Abe Thayil', size: '2.4 MB', status: 'ready', downloadCount: 5 },
  { id: 'GEN002', name: 'January 2025 P&L Statement', type: 'financial', format: 'xlsx', generatedAt: '2025-01-31T17:30:00', generatedBy: 'Abe Thayil', size: '845 KB', status: 'ready', downloadCount: 3 },
  { id: 'GEN003', name: 'Q4 2024 Compliance Report', type: 'compliance', format: 'pdf', generatedAt: '2024-12-31T16:00:00', generatedBy: 'Meera Iyer', size: '3.1 MB', status: 'ready', downloadCount: 8 },
  { id: 'GEN004', name: 'Marketing Week 7 Digest', type: 'marketing', format: 'pdf', generatedAt: '2025-02-17T09:00:00', generatedBy: 'Arjun Reddy', size: '1.8 MB', status: 'ready', downloadCount: 2 },
  { id: 'GEN005', name: 'Staff Productivity Week 7', type: 'staff', format: 'xlsx', generatedAt: '2025-02-17T08:30:00', generatedBy: 'Priya Krishnan', size: '520 KB', status: 'ready', downloadCount: 4 },
]

// ═══════════════════════════════════════════════════════════════
// STAFF ACTIVITY
// ═══════════════════════════════════════════════════════════════

export interface StaffActivityItem {
  id: string
  staffId: string
  staffName: string
  action: string
  entity: string
  portal: string
  timestamp: string
}

export const STAFF_ACTIVITY: StaffActivityItem[] = [
  { id: 'ACT001', staffId: 'USR003', staffName: 'Rajesh Sundaram', action: 'Updated client portfolio', entity: 'Vikram Malhotra', portal: 'admin', timestamp: '2025-02-23T09:30:00' },
  { id: 'ACT002', staffId: 'USR005', staffName: 'Arjun Reddy', action: 'Published blog post', entity: 'NCLT Hidden Value', portal: 'admin', timestamp: '2025-02-23T10:15:00' },
  { id: 'ACT003', staffId: 'USR006', staffName: 'Kavitha Nair', action: 'Scheduled investor call', entity: 'Prakash Menon', portal: 'staff', timestamp: '2025-02-23T10:45:00' },
  { id: 'ACT004', staffId: 'USR004', staffName: 'Meera Iyer', action: 'Approved KYC document', entity: 'Karthik Ranganathan', portal: 'admin', timestamp: '2025-02-23T11:00:00' },
  { id: 'ACT005', staffId: 'USR008', staffName: 'Ananya Pillai', action: 'Resolved support ticket', entity: 'TKT-2025-0045', portal: 'staff', timestamp: '2025-02-23T11:30:00' },
  { id: 'ACT006', staffId: 'USR002', staffName: 'Priya Krishnan', action: 'Generated weekly report', entity: 'Staff Productivity', portal: 'admin', timestamp: '2025-02-23T12:00:00' },
  { id: 'ACT007', staffId: 'USR007', staffName: 'Suresh Venkataraman', action: 'Deployed platform update', entity: 'v2.1.4', portal: 'admin', timestamp: '2025-02-22T18:00:00' },
  { id: 'ACT008', staffId: 'USR003', staffName: 'Rajesh Sundaram', action: 'Created investment proposal', entity: 'Deepak Sharma', portal: 'admin', timestamp: '2025-02-22T16:30:00' },
  { id: 'ACT009', staffId: 'USR005', staffName: 'Arjun Reddy', action: 'Launched Google campaign', entity: 'HNI Chennai Q1', portal: 'admin', timestamp: '2025-02-22T14:00:00' },
  { id: 'ACT010', staffId: 'USR009', staffName: 'Deepak Naidu', action: 'Filed SEBI quarterly report', entity: 'Q4 FY2024', portal: 'admin', timestamp: '2025-02-22T11:00:00' },
]

// ═══════════════════════════════════════════════════════════════
// WEBSITE ANALYTICS (Simulated GA4)
// ═══════════════════════════════════════════════════════════════

export const WEBSITE_TRAFFIC = [
  { month: 'Sep 24', visitors: 8200, unique: 6100, pageviews: 24500 },
  { month: 'Oct 24', visitors: 9100, unique: 6800, pageviews: 27300 },
  { month: 'Nov 24', visitors: 10200, unique: 7600, pageviews: 30600 },
  { month: 'Dec 24', visitors: 9800, unique: 7200, pageviews: 29400 },
  { month: 'Jan 25', visitors: 11500, unique: 8600, pageviews: 34500 },
  { month: 'Feb 25', visitors: 12500, unique: 9300, pageviews: 37500 },
]

export const TRAFFIC_SOURCES = [
  { source: 'Organic Search', visitors: 4375, percentage: 35 },
  { source: 'Paid Search', visitors: 2750, percentage: 22 },
  { source: 'Direct', visitors: 2125, percentage: 17 },
  { source: 'Social Media', visitors: 1625, percentage: 13 },
  { source: 'Referral', visitors: 1000, percentage: 8 },
  { source: 'Email', visitors: 625, percentage: 5 },
]

export const TOP_PAGES = [
  { page: '/', title: 'Homepage', views: 8500, avgTime: '2m 15s', bounceRate: 35 },
  { page: '/fund', title: 'Fund Overview', views: 4200, avgTime: '4m 30s', bounceRate: 28 },
  { page: '/why-aifs', title: 'Why AIFs', views: 3100, avgTime: '5m 12s', bounceRate: 22 },
  { page: '/blog', title: 'Blog & Insights', views: 2800, avgTime: '3m 45s', bounceRate: 38 },
  { page: '/tools', title: 'Calculator Tools', views: 2400, avgTime: '6m 20s', bounceRate: 18 },
  { page: '/contact', title: 'Contact Us', views: 1900, avgTime: '1m 50s', bounceRate: 45 },
  { page: '/login', title: 'Investor Login', views: 1600, avgTime: '1m 10s', bounceRate: 30 },
  { page: '/about', title: 'About GHL', views: 1200, avgTime: '3m 05s', bounceRate: 32 },
]

// ═══════════════════════════════════════════════════════════════
// FORECASTS
// ═══════════════════════════════════════════════════════════════

export const REVENUE_FORECAST = [
  { month: 'Mar 25', projected: 35000000, lower: 32000000, upper: 38000000 },
  { month: 'Apr 25', projected: 37500000, lower: 34000000, upper: 41000000 },
  { month: 'May 25', projected: 40000000, lower: 36000000, upper: 44000000 },
  { month: 'Jun 25', projected: 42500000, lower: 38000000, upper: 47000000 },
  { month: 'Jul 25', projected: 45000000, lower: 40000000, upper: 50000000 },
  { month: 'Aug 25', projected: 48000000, lower: 42000000, upper: 54000000 },
]

export const AUM_FORECAST = {
  current: 2530000000,
  projectedGrowth: 0.15,
  target: 5000000000,
  timeline: [
    { month: 'Mar 25', aum: 2630000000 },
    { month: 'Jun 25', aum: 2900000000 },
    { month: 'Sep 25', aum: 3200000000 },
    { month: 'Dec 25', aum: 3500000000 },
    { month: 'Mar 26', aum: 3850000000 },
  ],
}

// ═══════════════════════════════════════════════════════════════
// EMAIL TEMPLATES
// ═══════════════════════════════════════════════════════════════

export const EMAIL_TEMPLATES = [
  { id: 'TPL001', name: 'Monthly Performance Update', subject: 'GHL India Ventures — {{month}} Performance Update', category: 'investor' },
  { id: 'TPL002', name: 'Quarterly NAV Report', subject: 'Q{{quarter}} NAV Report — GHL India Ventures AIF', category: 'investor' },
  { id: 'TPL003', name: 'New Opportunity Alert', subject: 'Exclusive: New Investment Opportunity — {{fund_name}}', category: 'marketing' },
  { id: 'TPL004', name: 'Compliance Notice', subject: 'Important: Compliance Update — {{notice_type}}', category: 'compliance' },
  { id: 'TPL005', name: 'Event Invitation', subject: 'You\'re Invited: {{event_name}} — GHL India Ventures', category: 'marketing' },
  { id: 'TPL006', name: 'Welcome Email', subject: 'Welcome to GHL India Ventures, {{client_name}}!', category: 'onboarding' },
  { id: 'TPL007', name: 'KYC Reminder', subject: 'Action Required: Complete Your KYC — {{client_name}}', category: 'compliance' },
  { id: 'TPL008', name: 'Board Communication', subject: '{{subject}} — Board of Directors', category: 'internal' },
]

// ═══════════════════════════════════════════════════════════════
// CALL LOGS
// ═══════════════════════════════════════════════════════════════

export const CALL_LOGS: CallLog[] = [
  { id: 'CALL001', contactName: 'Vikram Malhotra', contactPhone: '+91 98400 12345', direction: 'outbound', duration: 1200, outcome: 'connected', notes: 'Discussed Q1 performance. Interested in increasing allocation.', staffId: 'USR006', timestamp: '2025-02-22T14:30:00', followUpDate: '2025-02-28' },
  { id: 'CALL002', contactName: 'Deepak Sharma', contactPhone: '+91 99100 12345', direction: 'outbound', duration: 480, outcome: 'connected', notes: 'Qualified lead. Wants detailed PPM. Schedule advisor call.', staffId: 'USR006', timestamp: '2025-02-22T11:00:00', followUpDate: '2025-02-25' },
  { id: 'CALL003', contactName: 'Sanjay Gupta', contactPhone: '+1 650 555 1234', direction: 'inbound', duration: 900, outcome: 'connected', notes: 'NRI investor query on tax implications. Referred to Deepak Naidu.', staffId: 'USR008', timestamp: '2025-02-21T16:00:00' },
  { id: 'CALL004', contactName: 'Anil Kapoor', contactPhone: '+91 98100 34567', direction: 'outbound', duration: 0, outcome: 'voicemail', staffId: 'USR006', timestamp: '2025-02-21T15:00:00', followUpDate: '2025-02-23' },
  { id: 'CALL005', contactName: 'Fatima Sheikh', contactPhone: '+971 55 555 9012', direction: 'outbound', duration: 720, outcome: 'deal-progressed', notes: 'UAE NRI. Very interested in stressed asset fund. Sending proposal.', staffId: 'USR006', timestamp: '2025-02-21T12:00:00', followUpDate: '2025-02-26' },
  { id: 'CALL006', contactName: 'Geeta Rajendran', contactPhone: '+91 94440 45678', direction: 'outbound', duration: 600, outcome: 'callback-requested', notes: 'Busy in meeting. Requested callback at 5pm.', staffId: 'USR008', timestamp: '2025-02-20T10:30:00' },
  { id: 'CALL007', contactName: 'Padma Subramaniam', contactPhone: '+91 98760 23456', direction: 'outbound', duration: 360, outcome: 'connected', notes: 'Initial introduction call. Interested but cautious. Sending blog links.', staffId: 'USR008', timestamp: '2025-02-20T09:00:00', followUpDate: '2025-02-27' },
  { id: 'CALL008', contactName: 'Ranjit Singh', contactPhone: '+65 8123 4567', direction: 'inbound', duration: 1500, outcome: 'deal-progressed', notes: 'Singapore NRI. Wants to increase allocation by ₹2Cr. Discussing terms.', staffId: 'USR006', timestamp: '2025-02-19T17:00:00', followUpDate: '2025-02-24' },
]

// ═══════════════════════════════════════════════════════════════
// DOCUMENT VAULT
// ═══════════════════════════════════════════════════════════════

export const DOCUMENT_VAULT: DocumentVaultItem[] = [
  { id: 'DOC001', name: 'Private Placement Memorandum v3.2', folder: 'fund', type: 'pdf', size: '4.8 MB', uploadedBy: 'Abe Thayil', uploadDate: '2024-12-15', version: 3, tags: ['PPM', 'fund', 'legal'], accessRoles: ['super-admin', 'admin', 'compliance-officer', 'fund-manager'] },
  { id: 'DOC002', name: 'Contribution Notice — Jan 2025', folder: 'fund', type: 'pdf', size: '1.2 MB', uploadedBy: 'Rajesh Sundaram', uploadDate: '2025-01-05', version: 1, tags: ['contribution', 'notice'], accessRoles: ['super-admin', 'admin', 'fund-manager'] },
  { id: 'DOC003', name: 'Q4 2024 NAV Report', folder: 'fund', type: 'xlsx', size: '856 KB', uploadedBy: 'Rajesh Sundaram', uploadDate: '2025-01-15', version: 1, tags: ['NAV', 'quarterly'], accessRoles: ['super-admin', 'admin', 'fund-manager', 'compliance-officer'] },
  { id: 'DOC004', name: 'SEBI Annual Filing FY2024', folder: 'compliance', type: 'pdf', size: '3.2 MB', uploadedBy: 'Meera Iyer', uploadDate: '2024-09-30', version: 1, tags: ['SEBI', 'annual', 'filing'], accessRoles: ['super-admin', 'admin', 'compliance-officer'] },
  { id: 'DOC005', name: 'GHL Investment Brochure 2025', folder: 'marketing', type: 'pdf', size: '5.6 MB', uploadedBy: 'Arjun Reddy', uploadDate: '2025-01-20', version: 2, tags: ['brochure', 'marketing'], accessRoles: ['super-admin', 'admin', 'marketing-manager', 'marketing-executive', 'sales'] },
  { id: 'DOC006', name: 'Employee Handbook v2.1', folder: 'internal', type: 'pdf', size: '2.1 MB', uploadedBy: 'Lakshmi Ramachandran', uploadDate: '2024-11-01', version: 2, tags: ['HR', 'policy'], accessRoles: ['super-admin', 'admin', 'hr'] },
  { id: 'DOC007', name: 'Board Meeting Minutes — Jan 2025', folder: 'internal', type: 'pdf', size: '780 KB', uploadedBy: 'Abe Thayil', uploadDate: '2025-02-01', version: 1, tags: ['board', 'minutes'], accessRoles: ['super-admin', 'admin'] },
  { id: 'DOC008', name: 'Trustee Report Q4 2024', folder: 'compliance', type: 'pdf', size: '2.8 MB', uploadedBy: 'Meera Iyer', uploadDate: '2025-01-31', version: 1, tags: ['trustee', 'quarterly'], accessRoles: ['super-admin', 'admin', 'compliance-officer'] },
]

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/** Format number in Indian notation (lakhs/crores) */
export function formatINRCompact(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(1)}K`
  return `₹${amount.toLocaleString('en-IN')}`
}

/** Format full INR */
export function formatINRFull(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

/** Calculate totals from revenue array by period */
export function getTotalRevenueByPeriod(period: string): number {
  return REVENUE_STREAMS.filter(r => r.period === period).reduce((sum, r) => sum + r.amount, 0)
}

/** Calculate total expenses by period */
export function getTotalExpensesByMonth(month: string): number {
  return EXPENSE_RECORDS.filter(e => e.month === month).reduce((sum, e) => sum + e.amount, 0)
}

/** Get client tier label */
export function getTierLabel(tier: number): string {
  const labels: Record<number, string> = {
    1: '₹25L - ₹1Cr',
    2: '₹1Cr - ₹5Cr',
    3: '₹5Cr - ₹15Cr',
    4: '₹15Cr - ₹25Cr',
    5: '₹25Cr+',
  }
  return labels[tier] || 'Unknown'
}

/** Get clients by tier */
export function getClientsByTier(): { tier: number; label: string; count: number; totalInvestment: number }[] {
  const tiers = [1, 2, 3, 4, 5]
  return tiers.map(tier => ({
    tier,
    label: getTierLabel(tier),
    count: REPORT_CLIENTS.filter(c => c.tier === tier).length,
    totalInvestment: REPORT_CLIENTS.filter(c => c.tier === tier).reduce((sum, c) => sum + c.investmentAmount, 0),
  }))
}

/** Cross-portal data sync via LocalStorage events */
export function publishSync(entity: string, action: string, data: unknown): void {
  // BACKEND_HOOK: Replace with WebSocket or SSE for real-time sync
  if (typeof window !== 'undefined') {
    const sync = { entity, action, data, timestamp: Date.now(), source: 'reports' }
    localStorage.setItem('ghl_data_sync', JSON.stringify(sync))
  }
}

/** Listen for cross-portal sync events */
export function onSync(callback: (update: { entity: string; action: string; data: unknown }) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === 'ghl_data_sync' && e.newValue) {
      try {
        callback(JSON.parse(e.newValue))
      } catch { /* ignore */ }
    }
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}
