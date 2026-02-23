/* ─────────────────────────────────────────────────────────────
   Dashboard Data Service — Client portal data with mock fallback

   Extracts inline mock data from DashboardClient.tsx into a
   service layer. When Supabase is configured, fetches real
   data scoped to the logged-in client.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

// Untyped reference for queries
const sb = supabase as any

// ── Mock Data (extracted from DashboardClient.tsx) ──────────

const MOCK_PORTFOLIO_ASSETS = [
  { name: 'Phoenix Towers - NCLT Recovery', type: 'Stressed Real Estate', invested: 2500000, current: 3125000, returnPct: 25.0, status: 'active', milestone: 75 },
  { name: 'GHL Co-Invest Series A', type: 'Startup Equity', invested: 1000000, current: 1320000, returnPct: 32.0, status: 'active', milestone: 40 },
  { name: 'NBFC Debenture Pool', type: 'Fixed Income', invested: 3000000, current: 3180000, returnPct: 12.0, status: 'active', milestone: 90 },
  { name: 'Emerald Bay - Goa', type: 'Direct Real Estate', invested: 5000000, current: 5500000, returnPct: 10.0, status: 'active', milestone: 55 },
]

const MOCK_NAV_HISTORY = [
  { month: 'Apr 24', nav: 100.0, benchmark: 100.0 },
  { month: 'May 24', nav: 102.3, benchmark: 101.5 },
  { month: 'Jun 24', nav: 105.1, benchmark: 103.2 },
  { month: 'Jul 24', nav: 103.8, benchmark: 102.8 },
  { month: 'Aug 24', nav: 107.2, benchmark: 104.5 },
  { month: 'Sep 24', nav: 109.5, benchmark: 106.0 },
  { month: 'Oct 24', nav: 108.1, benchmark: 105.2 },
  { month: 'Nov 24', nav: 111.3, benchmark: 107.8 },
  { month: 'Dec 24', nav: 114.2, benchmark: 109.5 },
  { month: 'Jan 25', nav: 112.8, benchmark: 108.2 },
  { month: 'Feb 25', nav: 116.5, benchmark: 110.8 },
  { month: 'Mar 25', nav: 118.9, benchmark: 112.3 },
]

const MOCK_ALLOCATION = [
  { name: 'Stressed RE', value: 45, color: '#D0021B' },
  { name: 'Startups', value: 20, color: '#F59E0B' },
  { name: 'Fixed Income', value: 25, color: '#3B82F6' },
  { name: 'Direct RE', value: 10, color: '#10B981' },
]

const MOCK_TRANSACTIONS = [
  { id: 'T001', date: '15 Mar 2025', type: 'Investment', amount: 1500000, fund: 'GHL Co-Invest Series A', status: 'completed' },
  { id: 'T002', date: '01 Mar 2025', type: 'Distribution', amount: -250000, fund: 'NBFC Debenture Pool', status: 'completed' },
  { id: 'T003', date: '15 Feb 2025', type: 'Investment', amount: 2000000, fund: 'Emerald Bay - Goa', status: 'completed' },
  { id: 'T004', date: '01 Feb 2025', type: 'Distribution', amount: -180000, fund: 'Phoenix Towers NCLT', status: 'completed' },
  { id: 'T005', date: '20 Jan 2025', type: 'Investment', amount: 1000000, fund: 'Phoenix Towers NCLT', status: 'completed' },
  { id: 'T006', date: '05 Jan 2025', type: 'Fee', amount: -62500, fund: 'Management Fee Q4', status: 'completed' },
  { id: 'T007', date: '20 Dec 2024', type: 'Investment', amount: 500000, fund: 'GHL Co-Invest Series A', status: 'completed' },
]

const MOCK_MESSAGES = [
  { id: 1, from: 'Relationship Manager', subject: 'Q4 Portfolio Review Summary', preview: 'Dear Investor, Your Q4 portfolio performance...', time: '2h ago', read: false, avatar: 'RM' },
  { id: 2, from: 'Compliance Team', subject: 'KYC Annual Renewal Reminder', preview: 'Your KYC documents are due for renewal by...', time: '1d ago', read: false, avatar: 'CT' },
  { id: 3, from: 'Fund Operations', subject: 'Distribution Notice - NBFC Pool', preview: 'We are pleased to inform you of a quarterly...', time: '3d ago', read: true, avatar: 'FO' },
  { id: 4, from: 'GHL Research', subject: 'Market Insight: Real Estate Opportunities', preview: 'Our latest research report on stressed assets...', time: '5d ago', read: true, avatar: 'GR' },
]

const MOCK_SUPPORT_TICKETS = [
  { id: 'TKT-001', subject: 'Tax Certificate for FY2024', status: 'resolved', date: '10 Mar 2025', priority: 'medium' },
  { id: 'TKT-002', subject: 'Update bank account details', status: 'open', date: '18 Mar 2025', priority: 'high' },
]

const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Q4 NAV Report Published', desc: 'Latest quarterly NAV report is now available', time: '2h ago', type: 'report', read: false },
  { id: 2, title: 'Distribution Credited', desc: '₹2.5L credited to your bank account', time: '1d ago', type: 'finance', read: false },
  { id: 3, title: 'New Investment Opportunity', desc: 'GHL Series B fund is now open for subscription', time: '2d ago', type: 'opportunity', read: true },
  { id: 4, title: 'KYC Renewal Due', desc: 'Annual KYC verification due by April 30', time: '3d ago', type: 'compliance', read: true },
  { id: 5, title: 'Tax Statement Ready', desc: 'FY2024 capital gains statement is ready', time: '5d ago', type: 'document', read: true },
]

const MOCK_KYC_STEPS = [
  { id: 'personal', label: 'Personal Details', status: 'completed' },
  { id: 'identity', label: 'Identity Verification', status: 'completed' },
  { id: 'address', label: 'Address Proof', status: 'completed' },
  { id: 'bank', label: 'Bank Verification', status: 'in-review' },
  { id: 'risk', label: 'Risk Assessment', status: 'pending' },
  { id: 'agreement', label: 'Agreement Signing', status: 'pending' },
]

const MOCK_DOCUMENTS = [
  { name: 'PAN Card', status: 'verified', date: '15 Jan 2025', type: 'identity' },
  { name: 'Aadhaar Card', status: 'verified', date: '15 Jan 2025', type: 'identity' },
  { name: 'Bank Statement', status: 'verified', date: '01 Mar 2025', type: 'financial' },
  { name: 'Passport Photo', status: 'verified', date: '15 Jan 2025', type: 'identity' },
  { name: 'Cancelled Cheque', status: 'verified', date: '15 Jan 2025', type: 'financial' },
  { name: 'Address Proof', status: 'pending', date: '-', type: 'address' },
  { name: 'Q4 NAV Report', status: 'available', date: '18 Mar 2025', type: 'report' },
  { name: 'Annual Statement FY24', status: 'available', date: '01 Apr 2025', type: 'report' },
  { name: 'TDS Certificate', status: 'available', date: '15 Mar 2025', type: 'tax' },
]

const MOCK_ADMIN_NEWS = [
  { id: 1, title: 'GHL Fund Manager Commentary - Q4 2024', excerpt: 'Our quarterly review of fund performance and market outlook...', date: '18 Mar 2025', pinned: true, category: 'Fund Update' },
  { id: 2, title: 'New AIF Category II Fund Launch', excerpt: 'We are excited to announce our new stressed assets fund...', date: '15 Mar 2025', pinned: false, category: 'New Fund' },
  { id: 3, title: 'Regulatory Update: SEBI AIF Guidelines', excerpt: 'Key changes to SEBI AIF regulations effective April 2025...', date: '10 Mar 2025', pinned: false, category: 'Regulatory' },
  { id: 4, title: 'Investor Meet - Mumbai, April 12', excerpt: 'Join us for our quarterly investor meet and portfolio review...', date: '05 Mar 2025', pinned: false, category: 'Event' },
]

// ── Service Functions ───────────────────────────────────────

export async function fetchPortfolioAssets(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return MOCK_PORTFOLIO_ASSETS
  const { data, error } = await sb.from('investments').select('*').eq('client_id', clientId)
  if (error || !data) return MOCK_PORTFOLIO_ASSETS
  return data
}

export async function fetchNAVHistory(clientId?: string) {
  if (!isSupabaseConfigured()) return MOCK_NAV_HISTORY
  // NAV history would come from a nav_history table — for now, mock
  return MOCK_NAV_HISTORY
}

export function getAllocation() { return MOCK_ALLOCATION }

export async function fetchTransactions(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return MOCK_TRANSACTIONS
  const { data, error } = await sb.from('transactions').select('*').eq('client_id', clientId).order('date', { ascending: false })
  if (error || !data) return MOCK_TRANSACTIONS
  return data
}

export async function fetchMessages(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return MOCK_MESSAGES
  const { data, error } = await sb.from('messages').select('*').eq('to_id', clientId).order('created_at', { ascending: false })
  if (error || !data) return MOCK_MESSAGES
  return data
}

export async function fetchSupportTickets(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return MOCK_SUPPORT_TICKETS
  const { data, error } = await sb.from('tickets').select('*').eq('client_id', clientId).order('created_at', { ascending: false })
  if (error || !data) return MOCK_SUPPORT_TICKETS
  return data
}

export async function fetchNotifications(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return MOCK_NOTIFICATIONS
  const { data, error } = await sb.from('notifications').select('*').eq('user_id', clientId).order('created_at', { ascending: false }).limit(20)
  if (error || !data) return MOCK_NOTIFICATIONS
  return data
}

export function getKYCSteps() { return MOCK_KYC_STEPS }

export async function fetchDocuments(clientId?: string) {
  if (!isSupabaseConfigured() || !clientId) return MOCK_DOCUMENTS
  const { data, error } = await sb.from('documents').select('*').eq('client_id', clientId).order('uploaded_at', { ascending: false })
  if (error || !data) return MOCK_DOCUMENTS
  return data
}

export function getAdminNews() { return MOCK_ADMIN_NEWS }

// ── CRUD ────────────────────────────────────────────────────

export async function createSupportTicket(ticket: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await sb.from('tickets').insert(ticket).select().single()
  if (error) { console.warn('[dashboard] Create ticket error:', error.message); return null }
  return data
}

export async function sendMessage(message: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await sb.from('messages').insert(message).select().single()
  if (error) { console.warn('[dashboard] Send message error:', error.message); return null }
  return data
}

export async function markNotificationRead(notificationId: string) {
  if (!isSupabaseConfigured()) return false
  const { error } = await sb.from('notifications').update({ read: true }).eq('id', notificationId)
  if (error) return false
  return true
}

export async function uploadDocument(doc: Record<string, any>) {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await sb.from('documents').insert(doc).select().single()
  if (error) { console.warn('[dashboard] Upload doc error:', error.message); return null }
  return data
}
