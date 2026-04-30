'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Banknote, Calendar, ChevronLeft, ChevronRight, Download,
  CheckCircle2, Clock, AlertCircle, IndianRupee, FileText,
  Search, Filter, RefreshCw, Eye, CreditCard, FileSpreadsheet,
  Printer, Users, ArrowUpRight, Send, Loader2,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminKPICard from '../shared/AdminKPICard'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminEmptyState from '../shared/AdminEmptyState'
import { supabase as _supabase, isSupabaseConfigured } from '@/lib/supabase/client'
const supabase = _supabase as any
import { sendDocumentToClient } from '@/lib/admin/sendToClient'

// ── Helpers ──────────────────────────────────────────────────────
const formatINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

const formatDate = (d: string | null) => {
  if (!d) return '-'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const getMonthLabel = (date: Date) =>
  date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start: start.toISOString(), end: end.toISOString() }
}

// ── Types ────────────────────────────────────────────────────────
interface PayoutRecord {
  id: string
  client_id: string | null
  investment_date: string | null
  ghl_id: string
  client_name: string
  email: string
  phone: string
  fund_type: string
  due_date: string | null
  investment_amount: number
  gross_interest: number
  tds_amount: number
  net_interest: number
  payment_status: 'pending' | 'paid' | 'overdue' | 'processing'
  payment_date: string | null
  account_number: string
  account_holder_name: string
  bank_name: string
  ifsc_code: string
  aadhar_number: string
  pan_number: string
}

// ── Payout receipt HTML (used by Send-to-Client) ─────────────────
// Mirrors the allotment letter styling so the client sees a consistent
// branded document in their Documents tab. Auto-prints when opened.
function buildPayoutReceiptHTML(row: {
  id: string
  ghl_id: string
  client_name: string
  fund_type: string
  due_date: string | null
  investment_amount: number
  gross_interest: number
  tds_amount: number
  net_interest: number
  payment_status: string
  payment_date: string | null
  account_number: string
  account_holder_name: string
  bank_name: string
  ifsc_code: string
}): string {
  const dueDateLabel = row.due_date
    ? new Date(row.due_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '-'
  const paymentDateLabel = row.payment_date
    ? new Date(row.payment_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : '-'
  const monthLabel = row.due_date
    ? new Date(row.due_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : '-'
  return `<!doctype html><html><head><title>Payout Statement — ${monthLabel}</title>
    <style>
      body { font-family: Georgia, 'Times New Roman', serif; padding: 48px 56px; color: #111; line-height: 1.55; }
      .hdr { text-align: center; border-bottom: 2px solid #8B0000; padding-bottom: 12px; margin-bottom: 28px; }
      .hdr h1 { color: #8B0000; margin: 0; font-size: 26px; letter-spacing: 1px; }
      .hdr p  { color: #555; margin: 4px 0 0; font-size: 13px; }
      h2 { color: #8B0000; font-size: 18px; text-align: center; margin: 20px 0 16px; }
      .ref { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 20px; }
      p.body { font-size: 14px; margin: 12px 0; }
      table.facts { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px; }
      table.facts td { padding: 8px 12px; border: 1px solid #e1e1e1; }
      table.facts td.label { background: #faf7f5; color: #555; width: 38%; font-weight: 600; }
      .sign { margin-top: 56px; display: flex; justify-content: space-between; font-size: 12px; }
      .sign .cell { border-top: 1px solid #999; padding-top: 8px; width: 40%; text-align: center; color: #555; }
      .footer { margin-top: 60px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
      .section-title { font-size: 13px; color: #8B0000; margin: 18px 0 6px; text-transform: uppercase; letter-spacing: 0.6px; font-weight: 600; }
      @media print { @page { margin: 1.6cm; } }
    </style>
  </head>
  <body>
    <div class="hdr">
      <h1>GHL INDIA VENTURES PRIVATE LIMITED</h1>
      <p>SEBI Registered Category II AIF · Alternative Investment Fund</p>
    </div>
    <div class="ref">
      <span>GHL ID: <strong>${row.ghl_id || '-'}</strong></span>
      <span>Statement Ref: <strong>PO-${String(row.id).slice(0, 8).toUpperCase()}</strong></span>
      <span>Period: <strong>${monthLabel}</strong></span>
    </div>
    <h2>Monthly Payout Statement</h2>
    <p class="body">Dear <strong>${row.client_name || 'Investor'}</strong>,</p>
    <p class="body">This statement confirms the interest / distribution computation for your investment
    in <strong>${row.fund_type || 'GHL India Ventures AIF'}</strong> for the period ending
    <strong>${dueDateLabel}</strong>.</p>

    <div class="section-title">Payout Summary</div>
    <table class="facts">
      <tr><td class="label">Investor</td><td>${row.client_name || '-'}</td></tr>
      <tr><td class="label">Fund / Scheme</td><td>${row.fund_type || '-'}</td></tr>
      <tr><td class="label">Investment Amount</td><td>₹ ${(row.investment_amount || 0).toLocaleString('en-IN')}</td></tr>
      <tr><td class="label">Gross Interest</td><td>₹ ${(row.gross_interest || 0).toLocaleString('en-IN')}</td></tr>
      <tr><td class="label">TDS @ 10%</td><td>₹ ${(row.tds_amount || 0).toLocaleString('en-IN')}</td></tr>
      <tr><td class="label">Net Payout</td><td><strong>₹ ${(row.net_interest || 0).toLocaleString('en-IN')}</strong></td></tr>
      <tr><td class="label">Status</td><td>${(row.payment_status || '-').toUpperCase()}</td></tr>
      <tr><td class="label">Payment Date</td><td>${paymentDateLabel}</td></tr>
    </table>

    <div class="section-title">Remittance Account</div>
    <table class="facts">
      <tr><td class="label">Bank</td><td>${row.bank_name || '-'}</td></tr>
      <tr><td class="label">Account Holder</td><td>${row.account_holder_name || '-'}</td></tr>
      <tr><td class="label">Account No.</td><td>${row.account_number || '-'}</td></tr>
      <tr><td class="label">IFSC</td><td>${row.ifsc_code || '-'}</td></tr>
    </table>

    <p class="body" style="margin-top: 20px;">If any of the above details require correction, please
    reach out to our Investor Relations team promptly.</p>
    <p class="body">Thanking you,<br/>For <strong>GHL India Ventures Private Limited</strong>,</p>
    <div class="sign">
      <div class="cell">Authorised Signatory<br/><span style="font-size:10px">(Finance)</span></div>
      <div class="cell">Company Seal</div>
    </div>
    <div class="footer">
      GHL India Ventures Private Limited · Registered Office: Chennai, Tamil Nadu, India ·
      SEBI Registration No. IN/AIF2/24/2425/1517 · This is a system-generated document.
    </div>
    <script>window.onload = () => window.print()</script>
  </body></html>`
}

// ── Sub-tabs ─────────────────────────────────────────────────────
const PAYOUT_TABS = [
  { id: 'monthly', label: 'Monthly Payouts', icon: Calendar },
  { id: 'history', label: 'Payout History', icon: Clock },
  { id: 'export', label: 'Export', icon: Download },
] as const

type PayoutTab = typeof PAYOUT_TABS[number]['id']

interface PayoutModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// ── Main Component ───────────────────────────────────────────────
export default function PayoutModule({ subTab, navigate, showToast }: PayoutModuleProps) {
  const activeTab = (PAYOUT_TABS.some(t => t.id === subTab) ? subTab : 'monthly') as PayoutTab

  // ── State ────────────────────────────────────────────────────
  const [payouts, setPayouts] = useState<PayoutRecord[]>([])
  const [allPaidHistory, setAllPaidHistory] = useState<PayoutRecord[]>([])
  const [loading, setLoading] = useState(true)
  // Pending Testing 30-04-2026 (re-fix): start at false so the History
  // table or empty-state shows immediately if the fetch has any
  // initialisation hiccup. fetchAllPaidHistory still flips it true→false
  // around the network call, so the spinner appears while loading.
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  // Set to true once we've auto-jumped to the nearest month with data
  // (or confirmed today already has data) so subsequent renders don't
  // override the user's manual month navigation.
  const [initialMonthResolved, setInitialMonthResolved] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [updateModalOpen, setUpdateModalOpen] = useState(false)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedPayout, setSelectedPayout] = useState<PayoutRecord | null>(null)
  const [newStatus, setNewStatus] = useState<string>('paid')
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [updating, setUpdating] = useState(false)
  const [historyFilter, setHistoryFilter] = useState<string>('all')
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | 'pdf'>('csv')
  // Pending 30-04-2026 follow-up: scope picker on the Export tab.
  const [exportScope, setExportScope] = useState<'monthly' | 'paid_history' | 'all'>('monthly')
  const [generating, setGenerating] = useState(false)
  // Per-row in-flight state for Send-to-Client actions (prevents double-sends).
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set())

  // ── Data Fetch ───────────────────────────────────────────────
  const fetchPayouts = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setPayouts(getDemoData())
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const { start, end } = getMonthRange(selectedMonth)

      // Step 1: Fetch payouts for the month
      const { data: payoutRows, error } = await supabase
        .from('monthly_payouts')
        .select('*')
        .gte('due_date', start)
        .lte('due_date', end)
        .order('due_date', { ascending: true })

      if (error) throw error
      if (!payoutRows || payoutRows.length === 0) { setPayouts([]); setLoading(false); return }

      // Step 2: Batch-fetch client, bank, and identity details
      const clientIds = Array.from(new Set(payoutRows.map((r: any) => r.client_id).filter(Boolean)))
      const [clientsRes, bankRes, identityRes] = await Promise.all([
        clientIds.length > 0 ? supabase.from('clients').select('id, ghl_id, full_name, email, phone').in('id', clientIds) : { data: [] },
        clientIds.length > 0 ? supabase.from('kyc_bank_details').select('client_id, account_number, account_holder_name, bank_name, ifsc_code').in('client_id', clientIds) : { data: [] },
        clientIds.length > 0 ? supabase.from('kyc_identity_details').select('client_id, pan_number, aadhar_number').in('client_id', clientIds) : { data: [] },
      ])

      const clientMap = new Map((clientsRes.data || []).map((c: any) => [c.id, c]))
      const bankMap = new Map((bankRes.data || []).map((b: any) => [b.client_id, b]))
      const idMap = new Map((identityRes.data || []).map((i: any) => [i.client_id, i]))

      const mapped: PayoutRecord[] = payoutRows.map((row: any) => {
        const client: any = clientMap.get(row.client_id) || {}
        const bank: any = bankMap.get(row.client_id) || {}
        const identity: any = idMap.get(row.client_id) || {}
        return {
          id: row.id,
          client_id: row.client_id || null,
          investment_date: row.investment_date,
          ghl_id: row.ghl_id || client.ghl_id || '-',
          client_name: client.full_name || '-',
          email: client.email || '-',
          phone: client.phone || '-',
          fund_type: row.fund_type || '-',
          due_date: row.due_date,
          investment_amount: row.investment_amount || 0,
          gross_interest: row.gross_amount || 0,
          tds_amount: row.tds_amount || 0,
          net_interest: row.net_interest || 0,
          payment_status: row.payment_status || 'pending',
          payment_date: row.payment_date,
          account_number: row.account_number || bank.account_number || '-',
          account_holder_name: row.account_holder_name || bank.account_holder_name || '-',
          bank_name: row.bank_name || bank.bank_name || '-',
          ifsc_code: row.ifsc_code || bank.ifsc_code || '-',
          aadhar_number: identity.aadhar_number || '-',
          pan_number: identity.pan_number || '-',
        }
      })

      setPayouts(mapped)
    } catch (err) {
      console.error('Error fetching payouts:', err)
      showToast('Failed to fetch payout data', 'error')
      setPayouts(getDemoData())
    } finally {
      setLoading(false)
    }
  }, [selectedMonth, showToast])

  useEffect(() => { fetchPayouts() }, [fetchPayouts])

  // Pending 30-04-2026 follow-up: dedicated all-time fetch for the
  // Payout History tab. The monthly fetch above is scoped to the
  // selectedMonth, so without this the History tab only ever showed
  // paid payouts inside the current month — which looked broken.
  const fetchAllPaidHistory = useCallback(async () => {
    setHistoryError(null)
    if (!isSupabaseConfigured()) {
      setAllPaidHistory(getDemoData().filter(p => p.payment_status === 'paid'))
      setHistoryLoading(false)
      return
    }
    setHistoryLoading(true)
    try {
      // Pending Testing 30-04-2026 (re-fix): use a defensive cap (5000)
      // and explicit returning so the result is always a valid array.
      const { data: payoutRows, error } = await supabase
        .from('monthly_payouts')
        .select('*')
        .eq('payment_status', 'paid')
        .order('payment_date', { ascending: false })
        .limit(5000)
      if (error) {
        console.error('[PayoutHistory] fetch error:', error)
        setHistoryError(error.message || 'Failed to load payment history')
        setAllPaidHistory([])
        return
      }
      const rows = (payoutRows as any[]) || []
      console.log(`[PayoutHistory] fetched ${rows.length} paid rows`)
      if (rows.length === 0) {
        setAllPaidHistory([])
        return
      }

      const clientIds = Array.from(new Set(rows.map((r: any) => r.client_id).filter(Boolean)))
      let clientMap = new Map<string, any>()
      let bankMap = new Map<string, any>()
      let idMap = new Map<string, any>()
      try {
        const [clientsRes, bankRes, identityRes] = await Promise.all([
          clientIds.length > 0 ? supabase.from('clients').select('id, ghl_id, full_name, email, phone').in('id', clientIds) : Promise.resolve({ data: [] as any[] }),
          clientIds.length > 0 ? supabase.from('kyc_bank_details').select('client_id, account_number, account_holder_name, bank_name, ifsc_code').in('client_id', clientIds) : Promise.resolve({ data: [] as any[] }),
          clientIds.length > 0 ? supabase.from('kyc_identity_details').select('client_id, pan_number, aadhar_number').in('client_id', clientIds) : Promise.resolve({ data: [] as any[] }),
        ])
        clientMap = new Map(((clientsRes as any).data || []).map((c: any) => [c.id, c]))
        bankMap = new Map(((bankRes as any).data || []).map((b: any) => [b.client_id, b]))
        idMap = new Map(((identityRes as any).data || []).map((i: any) => [i.client_id, i]))
      } catch (joinErr) {
        // Joins are decorative — if they fail (RLS on KYC tables for
        // example) we still render the payouts using whatever the
        // monthly_payouts row already has.
        console.warn('[PayoutHistory] client/bank/identity join failed (non-fatal):', joinErr)
      }

      const mapped: PayoutRecord[] = rows.map((row: any) => {
        const client: any = clientMap.get(row.client_id) || {}
        const bank: any = bankMap.get(row.client_id) || {}
        const identity: any = idMap.get(row.client_id) || {}
        return {
          id: row.id,
          client_id: row.client_id || null,
          investment_date: row.investment_date,
          ghl_id: row.ghl_id || client.ghl_id || '-',
          client_name: client.full_name || row.account_holder_name || '-',
          email: client.email || '-',
          phone: client.phone || '-',
          fund_type: row.fund_type || '-',
          due_date: row.due_date,
          investment_amount: row.investment_amount || 0,
          gross_interest: row.gross_amount || 0,
          tds_amount: row.tds_amount || 0,
          net_interest: row.net_interest || 0,
          payment_status: row.payment_status || 'pending',
          payment_date: row.payment_date,
          account_number: row.account_number || bank.account_number || '-',
          account_holder_name: row.account_holder_name || bank.account_holder_name || '-',
          bank_name: row.bank_name || bank.bank_name || '-',
          ifsc_code: row.ifsc_code || bank.ifsc_code || '-',
          aadhar_number: identity.aadhar_number || '-',
          pan_number: identity.pan_number || '-',
        }
      })
      setAllPaidHistory(mapped)
    } catch (err: any) {
      console.error('[PayoutHistory] unexpected error:', err)
      setHistoryError(err?.message || 'Failed to load payment history')
      setAllPaidHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [])

  // Load history once on mount AND every time the History or Export
  // tab is opened. Mounting on every page entry guarantees the data
  // is ready even if the user lands directly on /admin/payouts/history
  // via URL (vs clicking the tab from Monthly Payouts).
  useEffect(() => {
    fetchAllPaidHistory()
  }, [fetchAllPaidHistory])

  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'export') {
      fetchAllPaidHistory()
    }
  }, [activeTab, fetchAllPaidHistory])

  // ── Filtered Data ────────────────────────────────────────────
  const filteredPayouts = useMemo(() => {
    if (statusFilter === 'all') return payouts
    return payouts.filter(p => p.payment_status === statusFilter)
  }, [payouts, statusFilter])

  // Pending 30-04-2026 follow-up: history now reads from the dedicated
  // all-time paid set, not the monthly slice. Filter still applies.
  const historyPayouts = useMemo(() => {
    const paid = allPaidHistory
    if (historyFilter === 'all') return paid
    return paid.filter(p => (p.fund_type || '').toLowerCase().includes(historyFilter.toLowerCase()))
  }, [allPaidHistory, historyFilter])

  // Build the fund-type filter options from the data we actually have
  // (legacy hard-coded "Gold Fund / Real Estate Fund / Fixed Income"
  // didn't match what the DB stores, so the dropdown silently filtered
  // everything away).
  const historyFundOptions = useMemo(() => {
    const set = new Set<string>()
    for (const p of allPaidHistory) {
      if (p.fund_type && p.fund_type !== '-') set.add(p.fund_type)
    }
    return Array.from(set).sort()
  }, [allPaidHistory])

  // ── KPIs ─────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalGross = payouts.reduce((s, p) => s + p.gross_interest, 0)
    const totalTDS = payouts.reduce((s, p) => s + p.tds_amount, 0)
    const totalNet = payouts.reduce((s, p) => s + p.net_interest, 0)
    const paidCount = payouts.filter(p => p.payment_status === 'paid').length
    const pendingCount = payouts.filter(p => p.payment_status === 'pending').length
    const overdueCount = payouts.filter(p => p.payment_status === 'overdue').length
    const paidAmount = payouts.filter(p => p.payment_status === 'paid').reduce((s, p) => s + p.net_interest, 0)
    const pendingAmount = payouts.filter(p => p.payment_status === 'pending').reduce((s, p) => s + p.net_interest, 0)
    return { totalGross, totalTDS, totalNet, paidCount, pendingCount, overdueCount, paidAmount, pendingAmount, total: payouts.length }
  }, [payouts])

  // ── Month Navigation ─────────────────────────────────────────
  const navigateMonth = (dir: -1 | 1) => {
    setSelectedMonth(prev => {
      const d = new Date(prev)
      d.setMonth(d.getMonth() + dir)
      return d
    })
  }

  const goToCurrentMonth = () => setSelectedMonth(new Date())

  const isCurrentMonth = useMemo(() => {
    const now = new Date()
    return selectedMonth.getFullYear() === now.getFullYear() && selectedMonth.getMonth() === now.getMonth()
  }, [selectedMonth])

  // ── Bug #22: Generate Monthly Payouts (refreshed Apr 2026) ──────
  // Builds the FULL payout schedule for every approved/credited investment
  // using the correct frequency per fund type: AIF pays yearly, Debenture /
  // LLP pay monthly. Delegates to generateFullPayoutSchedule() in
  // adminDataService so both this bulk button and the auto-generation on
  // approval/credit stay in sync. Idempotent.
  const generatePayouts = useCallback(async () => {
    if (!isSupabaseConfigured()) { showToast('Supabase is not configured', 'error'); return }
    setGenerating(true)
    try {
      const { generateFullPayoutSchedule } = await import('@/lib/supabase/adminDataService')
      const { data: apps, error: appErr } = await supabase
        .from('investment_applications')
        .select('*')
        .in('status', ['approved', 'credited'])
      if (appErr) throw appErr
      if (!apps || apps.length === 0) {
        showToast('No approved investments to generate payouts for', 'info')
        setGenerating(false)
        return
      }

      // Bug #24: Auto-backfill investment_date / maturity_date for any approved
      // app that's missing them so the payout schedule always generates.
      const needsBackfill = (apps as any[]).filter(a => !a.investment_date || !a.maturity_date)
      if (needsBackfill.length > 0) {
        const today = new Date()
        for (const a of needsBackfill) {
          const tenureYears = Number(String(a.tenure_preference || '').replace(/[^0-9]/g, '')) || 3
          const invDate = a.investment_date ? new Date(a.investment_date) : today
          const matDate = new Date(invDate)
          matDate.setFullYear(matDate.getFullYear() + tenureYears)
          const patch: Record<string, any> = {
            investment_date: a.investment_date || invDate.toISOString().split('T')[0],
            maturity_date: a.maturity_date || matDate.toISOString().split('T')[0],
            interest_rate: a.interest_rate || (a.fund_vehicle === 'Direct AIF Route' ? 18 : 12),
            appreciation_rate: a.appreciation_rate || (a.fund_vehicle === 'Direct AIF Route' ? 15 : 12),
            tds_rate: a.tds_rate || 10,
          }
          await (supabase as any).from('investment_applications').update(patch).eq('id', a.id)
          Object.assign(a, patch)
        }
      }

      let totalCreated = 0
      for (const app of apps as any[]) {
        const created = await generateFullPayoutSchedule(app)
        totalCreated += created
      }

      if (totalCreated === 0) {
        showToast('All eligible investments already have their full payout schedule.', 'info')
      } else {
        showToast(`Generated ${totalCreated} payout row(s) across ${apps.length} investment(s)`, 'success')
      }
      fetchPayouts()
    } catch (err: any) {
      console.error('[payouts] generate error:', err)
      showToast(err?.message || 'Failed to generate payouts', 'error')
    } finally {
      setGenerating(false)
    }
  }, [showToast, fetchPayouts])

  // ── Status Update ────────────────────────────────────────────
  const openStatusModal = (payout: PayoutRecord) => {
    setSelectedPayout(payout)
    setNewStatus(payout.payment_status === 'paid' ? 'paid' : 'paid')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setUpdateModalOpen(true)
  }

  const handleStatusUpdate = async () => {
    if (!selectedPayout) return
    setUpdating(true)
    try {
      if (isSupabaseConfigured()) {
        const { error } = await supabase
          .from('monthly_payouts')
          .update({
            payment_status: newStatus,
            payment_date: newStatus === 'paid' ? paymentDate : null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', selectedPayout.id)

        if (error) throw error
      }

      setPayouts(prev =>
        prev.map(p =>
          p.id === selectedPayout.id
            ? { ...p, payment_status: newStatus as any, payment_date: newStatus === 'paid' ? paymentDate : null }
            : p
        )
      )
      showToast(`Payment status updated to ${newStatus}`, 'success')
      setUpdateModalOpen(false)

      // Pending 30-04-2026 #12.f: WhatsApp the investor on every
      // payout status change. Best-effort — never blocks the update.
      try {
        const sb: any = supabase
        const { data: client } = await sb
          .from('clients')
          .select('full_name, phone')
          .eq('id', selectedPayout.client_id)
          .maybeSingle()
        if (client?.phone) {
          const { notifyPayoutStatusInvestor } = await import('@/lib/notifications/notify')
          await notifyPayoutStatusInvestor({
            investorPhone: client.phone,
            investorName: client.full_name || 'Investor',
            amount: Number(selectedPayout.net_interest) || 0,
            status: newStatus,
            dueDate: selectedPayout.due_date || undefined,
            fundType: selectedPayout.fund_type || undefined,
          })
        }
      } catch (_e) { /* non-blocking */ }
    } catch (err) {
      console.error('Error updating status:', err)
      showToast('Failed to update payment status', 'error')
    } finally {
      setUpdating(false)
    }
  }

  // ── Detail View ──────────────────────────────────────────────
  const openDetailModal = (payout: PayoutRecord) => {
    setSelectedPayout(payout)
    setDetailModalOpen(true)
  }

  // ── Export Functions ──────────────────────────────────────────
  const generateCSV = (data: PayoutRecord[]) => {
    const headers = [
      'Investment Date', 'GHL ID', 'Name', 'Email', 'Phone', 'Fund Type',
      'Due Date', 'Investment Amount', 'Gross Interest', 'TDS (10%)',
      'Net Interest', 'Status', 'Payment Date', 'Account Number',
      'Account Holder', 'Bank Name', 'IFSC', 'Aadhar', 'PAN',
    ]
    const rows = data.map(p => [
      formatDate(p.investment_date), p.ghl_id, p.client_name, p.email, p.phone,
      p.fund_type, formatDate(p.due_date), p.investment_amount, p.gross_interest,
      p.tds_amount, p.net_interest, p.payment_status, formatDate(p.payment_date),
      p.account_number, p.account_holder_name, p.bank_name, p.ifsc_code,
      p.aadhar_number, p.pan_number,
    ])
    return [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  }

  // Pending 30-04-2026 follow-up: export now respects a scope selector
  // on the Export tab (Current Month / All Paid / All Records). The
  // legacy Export button on the Monthly Payouts tab keeps the old
  // behaviour (filteredPayouts || payouts) for backwards compat.
  const handleExport = (
    format: 'csv' | 'excel' | 'pdf',
    scope: 'monthly' | 'paid_history' | 'all' = 'monthly',
  ) => {
    let data: PayoutRecord[]
    let labelSuffix: string
    if (scope === 'paid_history') {
      data = allPaidHistory
      labelSuffix = 'paid_history'
    } else if (scope === 'all') {
      // Combine the current monthly view + all paid history, dedupe by id.
      const seen = new Set<string>()
      data = [...payouts, ...allPaidHistory].filter(p => {
        if (seen.has(p.id)) return false
        seen.add(p.id)
        return true
      })
      labelSuffix = 'all'
    } else {
      data = filteredPayouts.length > 0 ? filteredPayouts : payouts
      labelSuffix = getMonthLabel(selectedMonth).replace(' ', '_')
    }

    if (data.length === 0) {
      showToast('No data to export', 'warning')
      return
    }

    if (format === 'csv' || format === 'excel') {
      const csv = generateCSV(data)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `payouts_${labelSuffix}.${format === 'excel' ? 'xlsx' : 'csv'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      showToast(`Exported ${data.length} record${data.length === 1 ? '' : 's'} as ${format.toUpperCase()}`, 'success')
    } else if (format === 'pdf') {
      const printContent = buildPrintHTML(data, scope)
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(printContent)
        printWindow.document.close()
        printWindow.print()
        showToast(`PDF print view opened (${data.length} record${data.length === 1 ? '' : 's'})`, 'success')
      } else {
        showToast('Popup blocked — allow popups for this site', 'error')
      }
    }
  }

  const buildPrintHTML = (data: PayoutRecord[], scope: 'monthly' | 'paid_history' | 'all' = 'monthly') => {
    const heading = scope === 'paid_history'
      ? 'All Paid Payouts'
      : scope === 'all'
        ? 'All Payout Records'
        : getMonthLabel(selectedMonth)
    const month = heading
    const rows = data.map(p => `
      <tr>
        <td>${p.ghl_id}</td><td>${p.client_name}</td><td>${p.fund_type}</td>
        <td>${formatDate(p.due_date)}</td><td style="text-align:right">${formatINR(p.investment_amount)}</td>
        <td style="text-align:right">${formatINR(p.gross_interest)}</td>
        <td style="text-align:right">${formatINR(p.tds_amount)}</td>
        <td style="text-align:right">${formatINR(p.net_interest)}</td>
        <td>${p.payment_status.toUpperCase()}</td>
      </tr>
    `).join('')

    return `<!DOCTYPE html><html><head><title>Payouts - ${month}</title>
      <style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;font-size:11px}
      th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}th{background:#f5f5f5;font-weight:bold}
      h1{font-size:18px;margin-bottom:4px}h2{font-size:13px;color:#666;margin-bottom:16px;font-weight:normal}</style>
      </head><body><h1>GHL India Ventures - Monthly Payouts</h1><h2>${month}</h2>
      <table><thead><tr><th>GHL ID</th><th>Name</th><th>Fund</th><th>Due Date</th>
      <th>Investment</th><th>Gross</th><th>TDS</th><th>Net</th><th>Status</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p style="margin-top:16px;font-size:11px;color:#999">Total Records: ${data.length} |
      Total Net Payout: ${formatINR(data.reduce((s, p) => s + p.net_interest, 0))}</p></body></html>`
  }

  // ── Status Badge Variant ─────────────────────────────────────
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <AdminBadge label="Paid" variant="success" dot />
      case 'pending': return <AdminBadge label="Pending" variant="warning" dot />
      case 'overdue': return <AdminBadge label="Overdue" variant="error" dot />
      case 'processing': return <AdminBadge label="Processing" variant="info" dot />
      default: return <AdminBadge label={status} variant="neutral" />
    }
  }

  // ── Table Columns ────────────────────────────────────────────
  const payoutColumns: Column<PayoutRecord>[] = [
    { key: 'ghl_id', label: 'GHL ID', width: '90px', sortable: true },
    { key: 'client_name', label: 'Name', sortable: true, render: (row) => (
      <div>
        <p className="text-white font-medium text-sm">{row.client_name}</p>
        <p className="text-gray-500 text-[10px]">{row.email}</p>
      </div>
    )},
    { key: 'fund_type', label: 'Fund', sortable: true, width: '100px' },
    { key: 'due_date', label: 'Due Date', sortable: true, width: '100px', render: (row) => (
      <span className="text-gray-300 text-xs">{formatDate(row.due_date)}</span>
    )},
    { key: 'investment_amount', label: 'Investment', sortable: true, width: '120px', render: (row) => (
      <span className="text-white font-medium text-xs">{formatINR(row.investment_amount)}</span>
    )},
    { key: 'gross_interest', label: 'Gross', sortable: true, width: '100px', render: (row) => (
      <span className="text-emerald-400 text-xs">{formatINR(row.gross_interest)}</span>
    )},
    { key: 'tds_amount', label: 'TDS (10%)', sortable: true, width: '90px', render: (row) => (
      <span className="text-amber-400 text-xs">{formatINR(row.tds_amount)}</span>
    )},
    { key: 'net_interest', label: 'Net Payout', sortable: true, width: '110px', render: (row) => (
      <span className="text-white font-semibold text-xs">{formatINR(row.net_interest)}</span>
    )},
    // Bug 2026-04-18: surface every bank field ops needs to disburse —
    // bank name, account holder name, full account number, IFSC — inline so
    // admins don't open the modal for every row.
    { key: 'bank_name', label: 'Bank', sortable: true, width: '180px', render: (row) => (
      <div className="min-w-0">
        <p className="text-gray-200 text-xs font-medium truncate">{row.bank_name || '—'}</p>
        <p className="text-[10px] text-gray-500 truncate" title={row.account_holder_name || ''}>
          {row.account_holder_name || '—'}
        </p>
      </div>
    )},
    { key: 'account_number', label: 'Account No.', sortable: true, width: '160px', render: (row) => (
      <span className="text-gray-300 text-xs font-mono">{row.account_number || '—'}</span>
    )},
    { key: 'ifsc_code', label: 'IFSC', sortable: true, width: '110px', render: (row) => (
      <span className="text-gray-300 text-xs font-mono">{row.ifsc_code || '—'}</span>
    )},
    { key: 'payment_status', label: 'Status', width: '100px', sortable: true, render: (row) => getStatusBadge(row.payment_status) },
    { key: 'actions', label: '', width: '150px', render: (row) => {
      const sending = sendingIds.has(row.id)
      return (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openDetailModal(row) }}
            className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors"
            title="View details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openStatusModal(row) }}
            className="p-1.5 rounded-lg hover:bg-brand-red/20 text-gray-500 hover:text-brand-red transition-colors"
            title="Update status"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={async (e) => {
              e.stopPropagation()
              if (!row.client_id) {
                showToast('Missing client id — cannot send to demo row', 'error')
                return
              }
              if (sending) return
              setSendingIds(prev => new Set(prev).add(row.id))
              try {
                const html = buildPayoutReceiptHTML(row)
                const monthTag = row.due_date
                  ? new Date(row.due_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }).replace(/\s+/g, '-')
                  : 'current'
                const res = await sendDocumentToClient({
                  clientId: row.client_id,
                  html,
                  fileName: `payout-statement-${monthTag}-${row.ghl_id || row.id}.html`,
                  title: `Payout Statement — ${row.due_date ? new Date(row.due_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Current Month'}`,
                  category: 'report',
                })
                if (res.ok) {
                  showToast('Payout statement sent to client Documents', 'success')
                  // Open the rendered HTML directly for admin verification.
                  const w = window.open('', '_blank')
                  if (w) { w.document.write(html); w.document.close() }
                } else {
                  showToast(res.error || 'Failed to send to client', 'error')
                }
              } finally {
                setSendingIds(prev => { const n = new Set(prev); n.delete(row.id); return n })
              }
            }}
            disabled={sending}
            className="inline-flex items-center justify-center gap-1 h-7 px-2 rounded-lg text-[10px] font-medium text-white bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 whitespace-nowrap leading-none"
            title="Send payout statement to client Documents"
          >
            <Send className="w-3 h-3" />
            {sending ? 'Sending…' : 'Send'}
          </button>
        </div>
      )
    }},
  ]

  const historyColumns: Column<PayoutRecord>[] = [
    { key: 'ghl_id', label: 'GHL ID', width: '90px', sortable: true },
    { key: 'client_name', label: 'Name', sortable: true },
    { key: 'fund_type', label: 'Fund', sortable: true, width: '100px' },
    { key: 'investment_amount', label: 'Investment', sortable: true, width: '120px', render: (row) => (
      <span className="text-white text-xs">{formatINR(row.investment_amount)}</span>
    )},
    { key: 'net_interest', label: 'Net Paid', sortable: true, width: '110px', render: (row) => (
      <span className="text-emerald-400 font-medium text-xs">{formatINR(row.net_interest)}</span>
    )},
    { key: 'payment_date', label: 'Paid On', sortable: true, width: '110px', render: (row) => (
      <span className="text-gray-300 text-xs">{formatDate(row.payment_date)}</span>
    )},
    { key: 'bank_name', label: 'Bank', sortable: true, width: '120px' },
    { key: 'payment_status', label: 'Status', width: '90px', render: () => <AdminBadge label="Paid" variant="success" dot /> },
  ]

  // ── Render Sub-tab Content ───────────────────────────────────
  const renderMonthlyPayouts = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard
          title="Total Payouts"
          value={formatINR(kpis.totalNet)}
          subtitle={`${kpis.total} investors`}
          icon={IndianRupee}
          color="#DC2626"
          delay={0}
        />
        <AdminKPICard
          title="Paid"
          value={formatINR(kpis.paidAmount)}
          subtitle={`${kpis.paidCount} paid`}
          icon={CheckCircle2}
          color="#10B981"
          delay={100}
        />
        <AdminKPICard
          title="Pending"
          value={formatINR(kpis.pendingAmount)}
          subtitle={`${kpis.pendingCount} pending`}
          icon={Clock}
          color="#F59E0B"
          delay={200}
        />
        <AdminKPICard
          title="TDS Deducted"
          value={formatINR(kpis.totalTDS)}
          subtitle="10% TDS"
          icon={CreditCard}
          color="#8B5CF6"
          delay={300}
        />
      </div>

      {/* Month Navigation + Filters */}
      <AdminGlass>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors border border-white/[0.06]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center min-w-[160px]">
              <p className="text-white font-semibold text-sm">{getMonthLabel(selectedMonth)}</p>
              {!isCurrentMonth && (
                <button onClick={goToCurrentMonth} className="text-[10px] text-brand-red hover:underline mt-0.5">
                  Go to current month
                </button>
              )}
            </div>
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors border border-white/[0.06]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-white/[0.04] rounded-xl p-1 border border-white/[0.06]">
              {['all', 'pending', 'paid', 'overdue'].map(status => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-brand-red/20 text-brand-red'
                      : 'text-gray-500 hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Bug #22: Generate Monthly Payouts button */}
            <button
              onClick={generatePayouts}
              disabled={generating || loading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-red/20 hover:bg-brand-red/30 text-white text-xs font-medium transition-colors border border-brand-red/30 disabled:opacity-50"
              title="Generate payouts for all approved investments for the selected month"
            >
              {generating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Banknote className="w-3.5 h-3.5" />}
              {generating ? 'Generating...' : 'Generate Payouts'}
            </button>

            {/* Refresh */}
            <button
              onClick={fetchPayouts}
              disabled={loading}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors border border-white/[0.06] disabled:opacity-50"
              title="Refresh data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </AdminGlass>

      {/* Data Table */}
      {loading ? (
        <AdminGlass>
          <div className="flex items-center justify-center py-16">
            <RefreshCw className="w-6 h-6 text-brand-red animate-spin" />
            <span className="ml-3 text-gray-400 text-sm">Loading payouts...</span>
          </div>
        </AdminGlass>
      ) : filteredPayouts.length === 0 ? (
        <AdminEmptyState
          icon={Banknote}
          title="No payouts found"
          description={`No payout records for ${getMonthLabel(selectedMonth)} with the selected filter.`}
          action={{ label: 'Reset Filter', onClick: () => setStatusFilter('all') }}
        />
      ) : (
        <AdminDataTable
          columns={payoutColumns}
          data={filteredPayouts}
          pageSize={15}
          searchable
          searchPlaceholder="Search by name, GHL ID, email..."
          searchKeys={['ghl_id', 'client_name', 'email', 'phone', 'fund_type']}
          onRowClick={openDetailModal}
          title={`${getMonthLabel(selectedMonth)} Payouts`}
          actions={
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white text-xs transition-colors border border-white/[0.06]"
            >
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          }
        />
      )}
    </div>
  )

  const renderPayoutHistory = () => {
    // Pending 30-04-2026 follow-up: history KPIs were derived from
    // the *monthly* slice, which made them look broken whenever the
    // selected month had zero paid rows. They now reflect the true
    // all-time paid history so the strip matches the table below.
    const histKpis = (() => {
      const totalPaid = allPaidHistory.reduce((s, p) => s + p.net_interest, 0)
      const count = allPaidHistory.length
      const investors = new Set(allPaidHistory.map(p => p.client_id).filter(Boolean)).size
      return {
        totalPaid,
        count,
        investors,
        avgPayout: count > 0 ? Math.round(totalPaid / count) : 0,
      }
    })()
    return (
    <div className="space-y-6">
      {/* History Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminKPICard
          title="Total Disbursed"
          value={formatINR(histKpis.totalPaid)}
          subtitle={`${histKpis.count} payment${histKpis.count === 1 ? '' : 's'}`}
          icon={Banknote}
          color="#10B981"
          delay={0}
        />
        <AdminKPICard
          title="Investors Paid"
          value={String(histKpis.investors)}
          subtitle="unique recipients"
          icon={Users}
          color="#3B82F6"
          delay={100}
        />
        <AdminKPICard
          title="Avg. Net Payout"
          value={formatINR(histKpis.avgPayout)}
          subtitle="Per payment"
          icon={ArrowUpRight}
          color="#8B5CF6"
          delay={200}
        />
      </div>

      {/* History filter — shows real fund_type values from the data,
          and a Refresh button so admin can re-pull after marking
          payouts paid in the Monthly tab. The legacy month-arrow
          selector was misleading here (history is all-time), so it's
          gone. */}
      <AdminGlass>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400">
              Showing <span className="text-white font-semibold">{historyPayouts.length}</span>
              {' '}paid payout{historyPayouts.length === 1 ? '' : 's'}
              {' '}({formatINR(historyPayouts.reduce((s, p) => s + p.net_interest, 0))} net)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={historyFilter}
              onChange={e => setHistoryFilter(e.target.value)}
              className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none focus:border-brand-red/40 max-w-[260px]"
            >
              <option value="all">All Funds</option>
              {historyFundOptions.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <button
              onClick={fetchAllPaidHistory}
              disabled={historyLoading}
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition-colors border border-white/[0.06] disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </AdminGlass>

      {/* History Table */}
      {historyError ? (
        <AdminGlass>
          <div className="p-6 text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="font-semibold mb-1">Couldn&apos;t load payment history</p>
            <p className="text-xs text-red-400 break-words">{historyError}</p>
            <button
              onClick={fetchAllPaidHistory}
              className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-red hover:bg-brand-red/80 transition-colors inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        </AdminGlass>
      ) : historyLoading ? (
        <AdminGlass>
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-5 h-5 text-brand-red animate-spin" />
          </div>
        </AdminGlass>
      ) : historyPayouts.length === 0 ? (
        <AdminEmptyState
          icon={Clock}
          title="No payment history"
          description={`Completed payments will appear here once admin marks payouts as paid.${allPaidHistory.length > 0 ? ` (${allPaidHistory.length} records loaded but filtered out — try changing the fund filter.)` : ''}`}
        />
      ) : (
        <AdminDataTable
          columns={historyColumns}
          data={historyPayouts}
          pageSize={15}
          searchable
          searchPlaceholder="Search payment history..."
          searchKeys={['ghl_id', 'client_name', 'bank_name']}
          title="Payment History"
        />
      )}
    </div>
    )
  }

  const renderExport = () => {
    // Pending 30-04-2026 follow-up: scope selector + counts so admin
    // can choose what to export (current month / paid history / all).
    const exportScopeData =
      exportScope === 'paid_history' ? allPaidHistory
        : exportScope === 'all'
          ? (() => {
              const seen = new Set<string>()
              return [...payouts, ...allPaidHistory].filter(p => {
                if (seen.has(p.id)) return false; seen.add(p.id); return true
              })
            })()
          : (filteredPayouts.length > 0 ? filteredPayouts : payouts)
    const exportNetTotal = exportScopeData.reduce((s, p) => s + p.net_interest, 0)

    return (
    <div className="space-y-6">
      {/* Scope selector */}
      <AdminGlass>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-gray-400 mb-1">Export Scope</p>
            <div className="flex items-center gap-1.5 flex-wrap">
              {([
                { id: 'monthly' as const, label: `Current Month (${getMonthLabel(selectedMonth)})` },
                { id: 'paid_history' as const, label: 'All Paid History' },
                { id: 'all' as const, label: 'All Records' },
              ]).map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setExportScope(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    exportScope === opt.id
                      ? 'bg-brand-red/15 text-white border-brand-red/40'
                      : 'bg-white/[0.04] text-gray-400 border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider text-gray-500">Selected</p>
            <p className="text-white text-sm font-semibold">
              {exportScopeData.length} record{exportScopeData.length === 1 ? '' : 's'}
            </p>
            <p className="text-[11px] text-emerald-400">{formatINR(exportNetTotal)} net</p>
          </div>
        </div>
      </AdminGlass>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CSV */}
        <AdminGlass hover>
          <div className="flex flex-col items-center text-center py-6 px-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 mb-4">
              <FileSpreadsheet className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">CSV Export</h3>
            <p className="text-gray-500 text-xs mb-4">Comma-separated values file compatible with Excel, Google Sheets, and other tools.</p>
            <button
              onClick={() => handleExport('csv', exportScope)}
              disabled={exportScopeData.length === 0}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 inline mr-2" />Export CSV
            </button>
          </div>
        </AdminGlass>

        {/* Excel */}
        <AdminGlass hover>
          <div className="flex flex-col items-center text-center py-6 px-4">
            <div className="p-4 rounded-2xl bg-blue-500/10 mb-4">
              <FileText className="w-8 h-8 text-blue-400" />
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">Excel Export</h3>
            <p className="text-gray-500 text-xs mb-4">Download as an Excel-compatible spreadsheet file for detailed analysis.</p>
            <button
              onClick={() => handleExport('excel', exportScope)}
              disabled={exportScopeData.length === 0}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4 inline mr-2" />Export Excel
            </button>
          </div>
        </AdminGlass>

        {/* PDF */}
        <AdminGlass hover>
          <div className="flex flex-col items-center text-center py-6 px-4">
            <div className="p-4 rounded-2xl bg-red-500/10 mb-4">
              <Printer className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">PDF / Print</h3>
            <p className="text-gray-500 text-xs mb-4">Generate a printable view of the payout data. Use your browser&apos;s print dialog to save as PDF.</p>
            <button
              onClick={() => handleExport('pdf', exportScope)}
              disabled={exportScopeData.length === 0}
              className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Printer className="w-4 h-4 inline mr-2" />Print / PDF
            </button>
          </div>
        </AdminGlass>
      </div>

      {/* Export Preview Info */}
      <AdminGlass>
        <div className="flex items-start gap-3 p-1">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white font-medium">
              {exportScope === 'paid_history'
                ? 'Export includes every paid payout to date.'
                : exportScope === 'all'
                  ? 'Export includes the current month plus all paid history (deduped).'
                  : `Export includes data for ${getMonthLabel(selectedMonth)}.`}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {exportScopeData.length} record{exportScopeData.length === 1 ? '' : 's'} will be exported.
              {' '}Includes investor details, fund info, payout amounts, TDS deductions, bank details, and KYC information.
              {exportScope === 'monthly' ? ' Apply status filters on the Monthly Payouts tab to narrow the subset.' : ''}
            </p>
          </div>
        </div>
      </AdminGlass>
    </div>
    )
  }

  // ── Main Render ──────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1 bg-white/[0.03] rounded-2xl p-1.5 border border-white/[0.06] w-fit">
        {PAYOUT_TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => navigate(`/admin/payouts/${tab.id}`)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-brand-red/15 text-brand-red border border-brand-red/20'
                  : 'text-gray-500 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'monthly' && renderMonthlyPayouts()}
      {activeTab === 'history' && renderPayoutHistory()}
      {activeTab === 'export' && renderExport()}

      {/* ── Status Update Modal ──────────────────────────────── */}
      <AdminModal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        title="Update Payment Status"
        subtitle={selectedPayout ? `${selectedPayout.client_name} - ${selectedPayout.ghl_id}` : ''}
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setUpdateModalOpen(false)}>Cancel</ModalButton>
            <ModalButton variant="primary" onClick={handleStatusUpdate} disabled={updating}>
              {updating ? 'Updating...' : 'Update Status'}
            </ModalButton>
          </>
        }
      >
        {selectedPayout && (
          <div className="space-y-5">
            {/* Current Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-gray-500 uppercase tracking-wider">Current Status</label>
                <div className="mt-1.5">{getStatusBadge(selectedPayout.payment_status)}</div>
              </div>
              <div>
                <label className="text-[11px] text-gray-500 uppercase tracking-wider">Net Payout</label>
                <p className="text-white font-semibold mt-1.5">{formatINR(selectedPayout.net_interest)}</p>
              </div>
            </div>

            {/* New Status */}
            <div>
              <label className="text-[11px] text-gray-500 uppercase tracking-wider block mb-2">New Status</label>
              <div className="flex gap-2">
                {['paid', 'pending', 'processing', 'overdue'].map(status => (
                  <button
                    key={status}
                    onClick={() => setNewStatus(status)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      newStatus === status
                        ? 'bg-brand-red/20 text-brand-red border-brand-red/30'
                        : 'bg-white/[0.04] text-gray-400 border-white/[0.08] hover:bg-white/[0.08]'
                    }`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Date (shown when status = paid) */}
            {newStatus === 'paid' && (
              <div>
                <label className="text-[11px] text-gray-500 uppercase tracking-wider block mb-2">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-brand-red/40 transition-colors"
                />
              </div>
            )}

            {/* Bank Details Summary */}
            <div className="bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">Bank Details</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-gray-500">Account:</span> <span className="text-gray-300 ml-1">{selectedPayout.account_number}</span></div>
                <div><span className="text-gray-500">Holder:</span> <span className="text-gray-300 ml-1">{selectedPayout.account_holder_name}</span></div>
                <div><span className="text-gray-500">Bank:</span> <span className="text-gray-300 ml-1">{selectedPayout.bank_name}</span></div>
                <div><span className="text-gray-500">IFSC:</span> <span className="text-gray-300 ml-1">{selectedPayout.ifsc_code}</span></div>
              </div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* ── Detail Modal ──────────────────────────────────────── */}
      <AdminModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title="Payout Details"
        subtitle={selectedPayout ? `${selectedPayout.client_name} | ${selectedPayout.ghl_id}` : ''}
        maxWidth="max-w-3xl"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setDetailModalOpen(false)}>Close</ModalButton>
            <ModalButton variant="primary" onClick={() => { setDetailModalOpen(false); if (selectedPayout) openStatusModal(selectedPayout) }}>
              Update Status
            </ModalButton>
          </>
        }
      >
        {selectedPayout && (
          <div className="space-y-6">
            {/* Investor Info */}
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">Investor Information</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'GHL ID', value: selectedPayout.ghl_id },
                  { label: 'Name', value: selectedPayout.client_name },
                  { label: 'Email', value: selectedPayout.email },
                  { label: 'Phone', value: selectedPayout.phone },
                  { label: 'Fund Type', value: selectedPayout.fund_type },
                  { label: 'Investment Date', value: formatDate(selectedPayout.investment_date) },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[10px] text-gray-600 uppercase">{item.label}</p>
                    <p className="text-sm text-white mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Info */}
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">Financial Details</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                  <p className="text-[10px] text-gray-600 uppercase">Investment</p>
                  <p className="text-base text-white font-semibold mt-1">{formatINR(selectedPayout.investment_amount)}</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                  <p className="text-[10px] text-gray-600 uppercase">Gross Interest</p>
                  <p className="text-base text-emerald-400 font-semibold mt-1">{formatINR(selectedPayout.gross_interest)}</p>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
                  <p className="text-[10px] text-gray-600 uppercase">TDS (10%)</p>
                  <p className="text-base text-amber-400 font-semibold mt-1">{formatINR(selectedPayout.tds_amount)}</p>
                </div>
                <div className="bg-brand-red/5 rounded-xl p-3 border border-brand-red/10">
                  <p className="text-[10px] text-gray-600 uppercase">Net Payout</p>
                  <p className="text-base text-brand-red font-bold mt-1">{formatINR(selectedPayout.net_interest)}</p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">Payment Status</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-[10px] text-gray-600 uppercase">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedPayout.payment_status)}</div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase">Due Date</p>
                  <p className="text-sm text-white mt-0.5">{formatDate(selectedPayout.due_date)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase">Payment Date</p>
                  <p className="text-sm text-white mt-0.5">{formatDate(selectedPayout.payment_date)}</p>
                </div>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">Bank Details</p>
              <div className="grid grid-cols-2 gap-4 bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                {[
                  { label: 'Account Number', value: selectedPayout.account_number },
                  { label: 'Account Holder', value: selectedPayout.account_holder_name },
                  { label: 'Bank Name', value: selectedPayout.bank_name },
                  { label: 'IFSC Code', value: selectedPayout.ifsc_code },
                ].map(item => (
                  <div key={item.label}>
                    <p className="text-[10px] text-gray-600 uppercase">{item.label}</p>
                    <p className="text-sm text-white mt-0.5 font-mono">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* KYC Details */}
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-3">KYC / Identity</p>
              <div className="grid grid-cols-2 gap-4 bg-white/[0.03] rounded-xl p-4 border border-white/[0.06]">
                <div>
                  <p className="text-[10px] text-gray-600 uppercase">PAN Number</p>
                  <p className="text-sm text-white mt-0.5 font-mono">{selectedPayout.pan_number}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-600 uppercase">Aadhar Number</p>
                  <p className="text-sm text-white mt-0.5 font-mono">{selectedPayout.aadhar_number}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  )
}

// ── Demo Data ────────────────────────────────────────────────────
function getDemoData(): PayoutRecord[] {
  const funds = ['Gold Fund', 'Real Estate Fund', 'Fixed Income', 'Hybrid Fund']
  const statuses: PayoutRecord['payment_status'][] = ['paid', 'pending', 'overdue', 'processing']
  const banks = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra Bank']
  const names = [
    'Rajesh Kumar', 'Priya Sharma', 'Amit Patel', 'Sneha Gupta', 'Vikram Singh',
    'Anita Desai', 'Suresh Reddy', 'Kavita Joshi', 'Manoj Tiwari', 'Deepa Nair',
    'Rahul Verma', 'Sunita Rao', 'Arun Mehta', 'Pooja Chauhan', 'Nitin Agarwal',
  ]

  return names.map((name, i) => {
    const inv = (Math.floor(Math.random() * 40) + 10) * 100000
    const gross = Math.round(inv * (0.08 + Math.random() * 0.04) / 12)
    const tds = Math.round(gross * 0.1)
    const net = gross - tds
    const status = statuses[i % statuses.length]
    const now = new Date()

    return {
      id: `payout_${i + 1}`,
      client_id: null,
      investment_date: new Date(now.getFullYear(), now.getMonth() - (Math.floor(Math.random() * 12) + 1), Math.floor(Math.random() * 28) + 1).toISOString(),
      ghl_id: `GHL${String(1000 + i).padStart(5, '0')}`,
      client_name: name,
      email: `${name.toLowerCase().replace(' ', '.')}@email.com`,
      phone: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
      fund_type: funds[i % funds.length],
      due_date: new Date(now.getFullYear(), now.getMonth(), Math.min(i + 5, 28)).toISOString(),
      investment_amount: inv,
      gross_interest: gross,
      tds_amount: tds,
      net_interest: net,
      payment_status: status,
      payment_date: status === 'paid' ? new Date(now.getFullYear(), now.getMonth(), Math.min(i + 3, 28)).toISOString() : null,
      account_number: `${Math.floor(Math.random() * 9000000000) + 1000000000}${Math.floor(Math.random() * 100)}`,
      account_holder_name: name,
      bank_name: banks[i % banks.length],
      ifsc_code: `${banks[i % banks.length].replace(/\s/g, '').substring(0, 4).toUpperCase()}0${String(Math.floor(Math.random() * 9000) + 1000)}`,
      aadhar_number: `${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000} ${Math.floor(Math.random() * 9000) + 1000}`,
      pan_number: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}P${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 9000) + 1000}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
    }
  })
}
