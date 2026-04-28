'use client'

/* ═══════════════════════════════════════════════════════════════
   INVESTMENT FLOW TAB — Full investment lifecycle matching
   the Investment and Document Flow PDF specification.

   Sub-tabs:
   1. Fund Details     — Fund info, key terms, term sheet download, "Invest" button
   2. Invest           — Amount entry, auto-calculate returns, submit
   3. My Investments   — History table (Commitment ID, Fund, Ref#, Amount, Action)
   4. Documents        — Post-approval docs (Acknowledgement, Agreement, Allotment, Certificate, TDS)
   5. Payment Schedule — Monthly tenure table (Date, Gross Interest, TDS, Net Interest, Appreciation, Debenture Value, Status)

   KYC Gate: Blocks entire flow if KYC not verified.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useMemo, useCallback, useEffect } from 'react'
import {
  Building2, FileText, Download, Upload, Eye, CheckCircle, Clock,
  Calendar, IndianRupee, CreditCard, ArrowRight, X, Info, Shield,
  TrendingUp, BarChart3, Briefcase, ChevronRight, AlertCircle,
  FileCheck, Receipt,
} from 'lucide-react'
import {
  calculatePaymentSchedule,
  submitInvestmentTransaction,
  uploadSignedDocument,
  fetchBankAccounts,
  submitInvestmentApplication,
  registerInterest,
  fetchInvestorPayouts,
} from '@/lib/supabase/dashboardDataService'
import {
  useInvestmentApplications,
  useInvestmentDocuments,
  useInvestmentTransactions,
} from '@/lib/supabase/dashboardDataHooks'

// ── Constants ──────────────────────────────────────────────
// Fund size ceiling enforced per testing report 2026-04-18 #1:
// "Capital amount not greater than fund size (10000000000)".
// 10,00,00,00,000 = 1000 Cr — matches SEBI AIF corpus cap for this vehicle.
const FUND_SIZE_CAP = 10_000_000_000

// ── Helpers ────────────────────────────────────────────────
function fmtINR(n: number): string { return new Intl.NumberFormat('en-IN').format(n) }
function fmtDate(d: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
function fmtDateTime(d: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })
}

// ── Glass Card ─────────────────────────────────────────────
function G({ children, className = '', theme }: { children: React.ReactNode; className?: string; theme: string }) {
  const d = theme === 'dark'
  return <div className={`rounded-2xl border backdrop-blur-sm ${d ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-gray-200/60 shadow-sm'} ${className}`}>{children}</div>
}

// ── Fund data ──────────────────────────────────────────────
const FUNDS = [
  {
    id: 'debenture',
    name: 'Alternate route to Invest in AIF via Debenture',
    fundType: 'Category II AIF (as per SEBI Alternative Investment Fund Regulations, 2012)',
    focus: 'Stressed and special situation real estate assets',
    minInvestment: 1000000,
    interest: 12, // 1% per month
    capitalAppreciation: 12,
    totalAssuredReturns: 24,
    tenure: 'Min 3 years, Max 10 years',
    strategy: [
      'Acquire industrial land, residential layouts, and commercial land at 30-50% below market value through bank auctions, distressed sales, and private deals.',
      'Monetize quickly by selling to industries, developers, or other end-users at less than fair market price.',
      'Short-to-medium term exits (usually 8-12 months) to generate attractive returns.',
    ],
    documents: ['Acknowledgment letter', 'Debenture Agreement', 'Debenture allotment letter', 'Debenture Certificate (physical or demat)', 'Investor portal access'],
    security: ['Debenture Trustee appointed as per the Companies Act', 'Mortgage/ Charge creation on company assets', 'CHG - 9 Form RBI with Ministry of Corporate Affairs'],
  },
  {
    id: 'direct-aif',
    name: 'Direct AIF Route',
    fundType: 'Category II AIF — Direct Investment',
    focus: 'SEBI-registered AIF with stressed RE and startup exposure',
    minInvestment: 10000000,
    interest: 18,
    capitalAppreciation: 15,
    totalAssuredReturns: 33,
    tenure: '5-10 Years',
    strategy: ['Direct participation in SEBI-regulated AIF scheme', 'Diversified portfolio across real estate and startups', 'Professional fund management with quarterly NAV updates'],
    documents: ['PPM (Private Placement Memorandum)', 'Contribution Agreement', 'Capital Call Notice', 'NAV Statement'],
    security: ['SEBI registered Category II AIF', 'Independent custodian for assets', 'Quarterly audited NAV'],
  },
  {
    id: 'llp',
    name: 'Alternate route to Invest in AIF via LLP',
    fundType: 'LLP-based co-investment structure',
    focus: 'Structured co-investment via LLP framework',
    minInvestment: 1000000,
    interest: 12,
    capitalAppreciation: 12,
    totalAssuredReturns: 24,
    tenure: 'Min 3 years, Max 10 years',
    strategy: ['Co-investment through LLP structure', 'Same asset pool as main AIF', 'Fixed return mechanism with capital protection'],
    documents: ['LLP Agreement', 'Supplementary Agreement', 'Capital Account Statement'],
    security: ['LLP registered with MCA', 'Charge creation on assets', 'Debenture trustee oversight'],
  },
]

// ── Props ──────────────────────────────────────────────────
interface InvestmentFlowTabProps {
  theme: string
  clientId: string | null
  userId: string | null
  userName: string
  userEmail: string
  userPhone: string
  kycStatus: string
  showToast: (msg: string, type?: string) => void
  navigateTab: (tab: string) => void
}

// ════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function InvestmentFlowTab({
  theme, clientId, userId, userName, userEmail, userPhone,
  kycStatus, showToast, navigateTab,
}: InvestmentFlowTabProps) {
  const d = theme === 'dark'
  const t = (dark: string, light: string) => d ? dark : light

  // Sub-tab state
  const [subTab, setSubTab] = useState<'funds' | 'invest' | 'history' | 'documents' | 'schedule'>('funds')
  const [selectedFund, setSelectedFund] = useState(FUNDS[0])
  const [investAmount, setInvestAmount] = useState(1000000)
  const [investTenure, setInvestTenure] = useState(3)
  const [selectedApp, setSelectedApp] = useState<any>(null)
  const [bankAccounts, setBankAccounts] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Data hooks
  const { data: investApps, refetch: refetchApps } = useInvestmentApplications(clientId ?? undefined)
  const { data: investDocs, refetch: refetchDocs } = useInvestmentDocuments(clientId ?? undefined)
  const { data: investTxns, refetch: refetchTxns } = useInvestmentTransactions(clientId ?? undefined)
  // Real payouts for the selected application, from monthly_payouts table.
  // When present, these supersede the computed `schedule` preview.
  const [investorPayouts, setInvestorPayouts] = useState<any[]>([])
  useEffect(() => {
    if (!clientId) { setInvestorPayouts([]); return }
    let cancelled = false
    ;(async () => {
      try {
        const rows = await fetchInvestorPayouts(clientId, selectedApp?.id)
        if (!cancelled) setInvestorPayouts(rows as any[])
      } catch { if (!cancelled) setInvestorPayouts([]) }
    })()
    return () => { cancelled = true }
  }, [clientId, selectedApp?.id])

  // Tests 28-04-2026 #8: when the investor has exactly one investment we
  // auto-select it so the schedule renders directly. With two or more,
  // the picker is shown first and no payouts render until a choice is
  // made — preventing the previous behaviour where both schedules were
  // concatenated into a single table.
  useEffect(() => {
    if (selectedApp) return
    if (subTab !== 'schedule') return
    const apps = investApps || []
    if (apps.length === 1) setSelectedApp(apps[0])
  }, [subTab, investApps, selectedApp])

  // Load bank accounts
  useEffect(() => {
    if (clientId) fetchBankAccounts(clientId).then((a: any) => setBankAccounts(a || []))
  }, [clientId])

  // Bug #14: Refetch on tab-focus so admin approvals/credit/doc uploads show
  // up in the investor panel without requiring a full page reload.
  useEffect(() => {
    const onFocus = () => { refetchApps(); refetchDocs(); refetchTxns() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [refetchApps, refetchDocs, refetchTxns])

  const kycVerified = kycStatus === 'verified' || kycStatus === 'approved'

  // ── KYC Gate ──────────────────────────────────────────────
  if (!kycVerified) {
    return (
      <div className="space-y-6">
        <G className="p-10 text-center" theme={theme}>
          <Shield className={`w-14 h-14 mx-auto mb-4 ${t('text-amber-400','text-amber-500')}`} />
          <h2 className={`text-xl font-bold mb-2 ${t('text-white','text-gray-900')}`}>KYC Verification Required</h2>
          <p className={`text-sm mb-6 max-w-lg mx-auto ${t('text-gray-500','text-gray-600')}`}>
            As per SEBI regulations, your KYC must be approved before you can make any investment.
            Please complete and submit your KYC documents for review.
          </p>
          <button onClick={() => navigateTab('kyc')} className="px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
            Complete KYC →
          </button>
          <p className={`text-xs mt-4 ${t('text-gray-600','text-gray-500')}`}>
            Current Status: <span className="font-bold text-amber-400 capitalize">{kycStatus}</span>
          </p>
        </G>
      </div>
    )
  }

  // ── Live return calc ──────────────────────────────────────
  const monthlyRate = selectedFund.interest / 100 / 12
  const monthlyInterest = Math.round(investAmount * monthlyRate)
  const tds = Math.round(monthlyInterest * 0.1)
  const netInterest = monthlyInterest - tds
  const yearlyReturns = monthlyInterest * 12
  const yearlyAppreciation = Math.round(investAmount * (selectedFund.capitalAppreciation / 100))
  const sumCapitalROI = investAmount + (yearlyReturns * investTenure) + (yearlyAppreciation * investTenure)

  // Payment schedule for selected app
  const schedule = useMemo(() => {
    if (!selectedApp) return []
    return calculatePaymentSchedule(
      Number(selectedApp.investment_amount) || investAmount,
      selectedApp.investment_date || selectedApp.created_at || new Date().toISOString(),
      Number(selectedApp.tenure_preference?.replace(/[^0-9]/g, '')) || investTenure,
      Number(selectedApp.interest_rate) || selectedFund.interest,
      Number(selectedApp.appreciation_rate) || selectedFund.capitalAppreciation,
      Number(selectedApp.tds_rate) || 10,
    )
  }, [selectedApp, investAmount, investTenure, selectedFund])

  // ── Submit investment ─────────────────────────────────────
  const handleSubmitInvestment = async () => {
    if (!clientId || !userId) { showToast('Please log in', 'error'); return }
    if (investAmount < selectedFund.minInvestment) { showToast(`Minimum investment is ₹${fmtINR(selectedFund.minInvestment)}`, 'error'); return }
    // Bug #1 (test 2026-04-18): Capital amount must not exceed the fund size.
    if (investAmount > FUND_SIZE_CAP) {
      showToast(`Investment cannot exceed the fund size of ₹${fmtINR(FUND_SIZE_CAP)}`, 'error')
      return
    }
    setSubmitting(true)
    const result = await submitInvestmentApplication({
      client_id: clientId,
      user_id: userId,
      fund_vehicle: selectedFund.name,
      investment_amount: investAmount,
      tenure_preference: `${investTenure} Years`,
      terms_accepted: true,
    })
    if (result) {
      showToast('Investment submitted! You will be redirected to your investment history.', 'success')
      refetchApps()
      setSubTab('history')
    } else {
      showToast('Failed to submit investment', 'error')
    }
    setSubmitting(false)
  }

  // ── Transaction submit ────────────────────────────────────
  const [txnForm, setTxnForm] = useState({ capitalAmount: '', transactionAmount: '', transactionId: '', proofUrl: '' })
  const [txnBank, setTxnBank] = useState('')
  const [txnSubmitting, setTxnSubmitting] = useState(false)

  // Sum of approved + pending transactions against the selected investment.
  // Pending counts too — the investor shouldn't double-submit while admin reviews.
  // Tests 2026-04-18 #3: once commitment is fully paid, no further transactions.
  const paidForSelectedApp = useMemo(() => {
    if (!selectedApp?.id) return 0
    return (investTxns || [])
      .filter((x: any) => x.investment_app_id === selectedApp.id && x.status !== 'rejected' && x.status !== 'cancelled')
      .reduce((sum: number, x: any) => sum + (Number(x.transaction_amount) || 0), 0)
  }, [investTxns, selectedApp])

  const selectedAppCapital = useMemo(() => {
    return Number(selectedApp?.investment_amount) || 0
  }, [selectedApp])

  const remainingForSelectedApp = Math.max(0, selectedAppCapital - paidForSelectedApp)
  const isFullyPaid = selectedAppCapital > 0 && remainingForSelectedApp <= 0

  const handleSubmitTransaction = async () => {
    if (!selectedApp || !clientId) return
    if (!txnForm.transactionAmount) { showToast('Transaction amount is required', 'error'); return }
    // Tests 2026-04-18 #2: Transaction must not exceed the committed capital amount.
    const capital = Number(txnForm.capitalAmount) || selectedAppCapital || 0
    const txnAmt = Number(txnForm.transactionAmount)
    if (!Number.isFinite(txnAmt) || txnAmt <= 0) { showToast('Transaction amount must be a positive number', 'error'); return }
    if (capital > 0 && txnAmt > capital) {
      showToast(`Transaction amount cannot exceed the capital amount (₹${fmtINR(capital)})`, 'error')
      return
    }
    // Tests 2026-04-18 #3: Block further transactions once commitment is fully paid.
    if (isFullyPaid) {
      showToast('This investment is already fully funded. No more transactions can be submitted.', 'warning')
      return
    }
    // And cap this single txn at what's still owed (includes pending ones).
    if (txnAmt > remainingForSelectedApp) {
      showToast(`Only ₹${fmtINR(remainingForSelectedApp)} remains on this commitment. Reduce the transaction amount.`, 'error')
      return
    }
    // Bug #11: Require proof upload before submission.
    if (!txnForm.proofUrl) { showToast('Please upload transaction proof before submitting', 'error'); return }
    setTxnSubmitting(true)
    const res = await submitInvestmentTransaction({
      investment_app_id: selectedApp.id,
      client_id: clientId,
      capital_amount: capital,
      transaction_amount: txnAmt,
      transaction_id: txnForm.transactionId || undefined,
      transaction_proof_url: txnForm.proofUrl,
      bank_account_id: txnBank || undefined,
    })
    if (res) {
      showToast('Transaction submitted for admin approval!', 'success')
      setTxnForm({ capitalAmount: '', transactionAmount: '', transactionId: '', proofUrl: '' })
      refetchTxns()
    } else { showToast('Failed to submit transaction', 'error') }
    setTxnSubmitting(false)
  }

  const handleUploadProof = async () => {
    try {
      const { pickAndUploadFiles } = await import('@/lib/supabase/storageService')
      // Route key is the literal 'general' so the file lands in the public
      // `uploads` bucket (admin + investor can both preview via the stored
      // public URL without signed-URL ceremony). The clientId is passed as
      // entityId so file_records still tracks ownership.
      const results = await pickAndUploadFiles('general', {
        accept: '.pdf,.jpg,.jpeg,.png',
        multiple: false,
        entityType: 'client',
        entityId: clientId || undefined,
        category: 'transaction-proof',
      })
      if (results?.[0]?.success && results[0].file) {
        setTxnForm(p => ({ ...p, proofUrl: results[0].file!.url }))
        showToast('Proof uploaded!', 'success')
      } else {
        showToast(`Upload failed${results?.[0]?.error ? ': ' + results[0].error : ''}`, 'error')
      }
    } catch (e: any) { showToast(`Upload failed: ${e?.message || 'unknown'}`, 'error') }
  }

  const handleUploadSigned = async (docId: string) => {
    try {
      const { pickAndUploadFiles } = await import('@/lib/supabase/storageService')
      const results = await pickAndUploadFiles('general', {
        accept: '.pdf,.jpg,.jpeg,.png',
        multiple: false,
        entityType: 'client',
        entityId: clientId || undefined,
        category: 'signed-document',
      })
      if (results?.[0]?.success && results[0].file) {
        await uploadSignedDocument(docId, results[0].file.url)
        showToast('Signed document uploaded!', 'success')
      } else {
        showToast(`Upload failed${results?.[0]?.error ? ': ' + results[0].error : ''}`, 'error')
      }
    } catch (e: any) { showToast(`Upload failed: ${e?.message || 'unknown'}`, 'error') }
  }

  // Testing 2026-04-18 #7: open a printable acknowledgement letter when no
  // admin-uploaded file is attached to an acknowledgement_letter row. The
  // investor can save it as PDF from the browser print dialog — no extra
  // storage round-trip required.
  const handleOpenAutoAcknowledgement = (app: any, doc: any) => {
    const commitment = app?.commitment_id || `GHL-CMT-${String(app?.id || doc?.investment_app_id || '').slice(0, 8).toUpperCase()}`
    const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n))
    const invDate = app?.investment_date || app?.created_at
    const invDateStr = invDate ? new Date(invDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
    const title = doc?.title || 'Acknowledgement Letter'
    const safe = (s: any) => String(s ?? '').replace(/[<>]/g, '')
    const html = `<!doctype html><html><head><title>${safe(title)} — ${safe(commitment)}</title>
      <style>
        body{font-family:Georgia,serif;padding:40px 48px;color:#111;line-height:1.6}
        h1{color:#8B0000;text-align:center;margin:0 0 6px}
        .sub{text-align:center;color:#666;font-size:12px;margin-bottom:28px}
        .meta{display:flex;justify-content:space-between;font-size:12px;margin-bottom:24px;color:#444}
        .box{border:1px solid #e1e1e1;padding:16px 20px;border-radius:6px;margin:16px 0;background:#faf7f5}
        .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}
        .row:last-child{border-bottom:0}
        .label{color:#666}
        .val{font-weight:600}
        .sig{margin-top:48px;font-size:12px;color:#555}
        @media print{.noprint{display:none}}
      </style></head><body>
      <h1>${safe(title)}</h1>
      <div class="sub">GHL India Ventures · SEBI-Registered Category II AIF</div>
      <div class="meta"><span>Date: ${today}</span><span>Commitment: ${safe(commitment)}</span></div>
      <p>Dear ${safe(userName || 'Investor')},</p>
      <p>We hereby acknowledge receipt of your investment commitment under <strong>${safe(app?.fund_vehicle || '—')}</strong>. Details are recorded below for your records.</p>
      <div class="box">
        <div class="row"><span class="label">Investor Name</span><span class="val">${safe(userName || '—')}</span></div>
        <div class="row"><span class="label">Email</span><span class="val">${safe(userEmail || '—')}</span></div>
        <div class="row"><span class="label">Fund Vehicle</span><span class="val">${safe(app?.fund_vehicle || '—')}</span></div>
        <div class="row"><span class="label">Commitment Amount</span><span class="val">₹ ${fmt(Number(app?.investment_amount) || 0)}</span></div>
        <div class="row"><span class="label">Tenure</span><span class="val">${safe(app?.tenure_preference || '—')}</span></div>
        <div class="row"><span class="label">Investment Date</span><span class="val">${invDateStr}</span></div>
        <div class="row"><span class="label">Reference</span><span class="val">${safe(app?.reference_number || commitment)}</span></div>
      </div>
      <p>This acknowledgement is generated electronically. Your formal agreement, allotment letter, and debenture certificate will be issued by our operations team and made available in your investor portal shortly.</p>
      <div class="sig">For GHL India Ventures Private Limited<br/>Investor Relations</div>
      <p class="noprint" style="margin-top:32px;text-align:center"><button onclick="window.print()" style="padding:8px 20px;background:#8B0000;color:#fff;border:0;border-radius:6px;cursor:pointer">Print / Save as PDF</button></p>
      </body></html>`
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    window.open(url, '_blank', 'noopener,noreferrer')
    // Release the blob URL after the new tab has had a moment to load it.
    setTimeout(() => URL.revokeObjectURL(url), 30_000)
  }

  const handleViewDoc = async (url: string) => {
    if (!url) { showToast('Document not available', 'info'); return }
    if (url.startsWith('http')) { window.open(url, '_blank'); return }
    try {
      const { getDownloadUrl } = await import('@/lib/supabase/storageService')
      const r = await getDownloadUrl(url, 'investment-documents')
      if (r?.success && r?.url) window.open(r.url, '_blank')
      else showToast('Document not available', 'info')
    } catch { showToast('Unable to load', 'error') }
  }

  const selectedBankDetails = bankAccounts.find((b: any) => b.id === txnBank) || bankAccounts[0]

  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════
  const TABS = [
    { id: 'funds' as const, label: 'Fund Details', icon: Building2 },
    { id: 'invest' as const, label: 'Invest', icon: TrendingUp },
    { id: 'history' as const, label: 'My Investments', icon: Briefcase },
    { id: 'documents' as const, label: 'Documents', icon: FileText },
    { id: 'schedule' as const, label: 'Payment Schedule', icon: Calendar },
  ]

  return (
    <div className="space-y-6">
      {/* Sub-tab navigation */}
      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => { setSubTab(tab.id); if (tab.id !== 'history' && tab.id !== 'schedule') setSelectedApp(null) }}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              subTab === tab.id
                ? 'text-white border border-brand-red/40' : t('text-gray-500 border border-white/[0.06] hover:text-white hover:bg-white/[0.04]','text-gray-600 border border-gray-200 hover:text-gray-900 hover:bg-gray-100')
            }`}
            style={subTab === tab.id ? { background: 'linear-gradient(135deg, rgba(208,2,27,0.2), rgba(139,0,0,0.2))' } : undefined}>
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>

      {/* ──────────────────────────────────────────────────────
          1. FUND DETAILS
          ────────────────────────────────────────────────────── */}
      {subTab === 'funds' && (
        <div className="space-y-4">
          {/* Fund selector */}
          <div className="flex flex-wrap gap-2">
            {FUNDS.map(f => (
              <button key={f.id} onClick={() => setSelectedFund(f)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${selectedFund.id === f.id ? 'bg-brand-red/20 text-white border border-brand-red/30' : t('bg-white/[0.03] text-gray-500 border border-white/[0.06]','bg-gray-100 text-gray-600 border border-gray-200')}`}>
                {f.name}
              </button>
            ))}
          </div>

          <G className="p-6" theme={theme}>
            {/* Header with buttons */}
            <div className="flex items-start justify-between mb-6">
              <h3 className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>{selectedFund.name}</h3>
              <div className="flex gap-2">
                <button onClick={() => setSubTab('invest')} className="px-4 py-2 rounded-lg text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>Investment List</button>
                <a
                  href="/downloads/investing-and-payment-terms.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-brand-red/80 hover:bg-brand-red flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> Download Terms
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Key terms table */}
              <div>
                <table className={`w-full text-sm ${t('','')}`}>
                  <tbody>
                    {[
                      { label: 'Fund Type', value: selectedFund.fundType },
                      { label: 'Focus', value: selectedFund.focus },
                    ].map((r, i) => (
                      <tr key={i} className={`border-b ${t('border-white/[0.06]','border-gray-200')}`}>
                        <td className={`py-3 pr-4 text-xs font-semibold ${t('text-gray-400','text-gray-600')}`}>{r.label}</td>
                        <td className={`py-3 text-xs ${t('text-gray-300','text-gray-800')}`}>{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <h4 className={`text-xs font-bold uppercase tracking-wider mt-4 mb-2 ${t('text-gray-500','text-gray-600')}`}>Key Investment Terms</h4>
                <table className={`w-full text-sm`}>
                  <tbody>
                    {[
                      { label: 'Investment', value: `starting from ₹${fmtINR(selectedFund.minInvestment)}` },
                      { label: 'Interest', value: `${selectedFund.interest / 12}% per month (means ${selectedFund.interest}% per annum)` },
                      { label: 'Capital Appreciation', value: `${selectedFund.capitalAppreciation}% per annum payable at redemption` },
                      { label: 'Total Assured Returns', value: `${selectedFund.totalAssuredReturns}% per annum` },
                      { label: 'Tenure', value: selectedFund.tenure },
                    ].map((r, i) => (
                      <tr key={i} className={`border-b ${t('border-white/[0.06]','border-gray-200')}`}>
                        <td className={`py-2.5 pr-4 text-xs font-semibold ${t('text-gray-400','text-gray-600')}`}>{r.label}</td>
                        <td className={`py-2.5 text-xs ${t('text-gray-300','text-gray-800')}`}>{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right: Strategy, Documents, Security */}
              <div className="space-y-4">
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${t('text-gray-500','text-gray-600')}`}>Investment Strategy</h4>
                  <ul className="space-y-1">
                    {selectedFund.strategy.map((s, i) => (
                      <li key={i} className={`text-xs leading-relaxed ${t('text-gray-400','text-gray-700')}`}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${t('text-gray-500','text-gray-600')}`}>Documents Provided</h4>
                  <ul className="space-y-1">
                    {selectedFund.documents.map((doc, i) => (
                      <li key={i} className={`text-xs ${t('text-gray-400','text-gray-700')}`}>• {doc}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${t('text-gray-500','text-gray-600')}`}>Security Structure</h4>
                  <ul className="space-y-1">
                    {selectedFund.security.map((s, i) => (
                      <li key={i} className={`text-xs ${t('text-gray-400','text-gray-700')}`}>• {s}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Invest button */}
            <div className="mt-6">
              <button onClick={() => setSubTab('invest')} className="px-8 py-3 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
                Invest
              </button>
            </div>
          </G>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────
          2. INVEST (Calculator + Submit)
          ────────────────────────────────────────────────────── */}
      {subTab === 'invest' && (
        <div className="space-y-4">
          <G className="p-6" theme={theme}>
            <h3 className={`text-lg font-bold text-center mb-6 ${t('text-white','text-gray-900')}`}>{selectedFund.name}</h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Return breakdown table */}
              <div>
                <table className="w-full">
                  <tbody>
                    {[
                      { label: 'MINIMUM INVESTMENT', value: `₹ ${fmtINR(selectedFund.minInvestment)}`, bold: true },
                      { label: 'CAPITAL INVESTED', value: `₹${fmtINR(investAmount)}`, bold: true },
                      { label: 'Locking Period', value: `${investTenure} years`, bold: false },
                      { label: 'MONTHLY RETURNS', value: `₹${fmtINR(monthlyInterest)}`, bold: true },
                      { label: 'NET INTEREST', value: `₹${fmtINR(netInterest)}`, bold: false },
                      { label: 'YEARLY RETURNS', value: `₹${fmtINR(yearlyReturns)}`, bold: true },
                      { label: 'YEARLY APPRECIATION', value: `₹${fmtINR(yearlyAppreciation)}`, bold: true },
                      { label: 'SUM OF CAPITAL & ROI', value: `₹${fmtINR(sumCapitalROI)}`, bold: true },
                    ].map((r, i) => (
                      <tr key={i} className={`border-b ${t('border-white/[0.06]','border-gray-200')}`}>
                        <td className={`py-3 pr-4 text-xs ${r.bold ? 'font-bold' : 'font-medium'} ${t('text-gray-300','text-gray-800')}`}>{r.label}</td>
                        <td className={`py-3 text-right text-sm ${r.bold ? 'font-bold' : 'font-medium'} ${t('text-white','text-gray-900')}`}>{r.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Right: Amount input + tenure selector + submit */}
              <div className="space-y-5">
                <h4 className={`text-base font-bold ${t('text-white','text-gray-900')}`}>Investment Amount</h4>
                <p className={`text-xs ${t('text-gray-500','text-gray-600')}`}>Enter or choose an amount to invest below</p>

                <input type="number" value={investAmount} onChange={e => {
                    const v = Number(e.target.value) || 0
                    setInvestAmount(Math.min(v, FUND_SIZE_CAP))
                  }}
                  className={`w-full px-4 py-3 rounded-xl text-lg font-bold ${t('bg-white/[0.04] border border-white/[0.08] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`}
                  min={selectedFund.minInvestment} max={FUND_SIZE_CAP} step={100000} />
                {investAmount > FUND_SIZE_CAP - 1 && (
                  <p className={`text-[11px] ${t('text-amber-400','text-amber-600')}`}>Capped at fund size (₹{fmtINR(FUND_SIZE_CAP)}).</p>
                )}

                <div className="flex gap-2 flex-wrap">
                  {[1000000, 2500000, 5000000, 10000000, 25000000].map(amt => (
                    <button key={amt} onClick={() => setInvestAmount(amt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${investAmount === amt ? 'bg-brand-red/20 text-brand-red border border-brand-red/30' : t('bg-white/[0.04] text-gray-500 border border-white/[0.06]','bg-gray-100 text-gray-600 border border-gray-200')}`}>
                      ₹{fmtINR(amt)}
                    </button>
                  ))}
                </div>

                <div>
                  <label className={`text-xs font-medium mb-1.5 block ${t('text-gray-400','text-gray-600')}`}>Tenure</label>
                  <select value={investTenure} onChange={e => setInvestTenure(Number(e.target.value))}
                    className={`w-full px-4 py-3 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.08] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`}>
                    {[3, 5, 7, 10].map(y => <option key={y} value={y} className={t('bg-neutral-900','bg-white')}>{y} Years</option>)}
                  </select>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => { setSubTab('schedule'); setSelectedApp({ investment_amount: investAmount, created_at: new Date().toISOString(), tenure_preference: `${investTenure} Years`, interest_rate: selectedFund.interest, appreciation_rate: selectedFund.capitalAppreciation, tds_rate: 10 }) }}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${t('bg-white/[0.06] text-white border border-white/[0.08] hover:bg-white/[0.1]','bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200')}`}>
                    Payment Schedule
                  </button>
                  <button onClick={handleSubmitInvestment} disabled={submitting}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white text-center disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
                    {submitting ? 'Submitting...' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </G>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────
          3. MY INVESTMENTS (History Table)
          ────────────────────────────────────────────────────── */}
      {subTab === 'history' && !selectedApp && (
        <G className="overflow-hidden" theme={theme}>
          {investApps.length === 0 ? (
            <div className="p-10 text-center">
              <Briefcase className={`w-10 h-10 mx-auto mb-3 ${t('text-gray-600','text-gray-400')}`} />
              <p className={`text-sm font-medium ${t('text-gray-400','text-gray-600')}`}>No investments yet</p>
              <p className={`text-xs mt-1 ${t('text-gray-600','text-gray-500')}`}>Your investment commitments will appear here.</p>
              <button onClick={() => setSubTab('funds')} className="mt-4 px-6 py-2 rounded-xl text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>Browse Funds</button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${t('border-white/[0.06] bg-white/[0.02]','border-gray-200 bg-gray-50')}`}>
                    {['COMMITMENT ID', 'FUND NAME', 'REFERENCE NUMBER', 'AMOUNT (₹)', 'ACTION'].map(h => (
                      <th key={h} className={`text-left text-xs font-bold uppercase tracking-wider py-4 px-5 ${t('text-gray-500','text-gray-600')}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {investApps.map((app: any, i: number) => (
                    <tr key={app.id || i} className={`border-b ${t('border-white/[0.04] hover:bg-white/[0.02]','border-gray-100 hover:bg-gray-50')}`}>
                      <td className={`py-4 px-5 text-xs ${t('text-gray-400','text-gray-600')}`}>{app.commitment_id || 'Not Generated'}</td>
                      <td className={`py-4 px-5 text-xs font-medium ${t('text-white','text-gray-900')}`}>{app.fund_vehicle || '—'}</td>
                      <td className={`py-4 px-5 text-xs ${t('text-gray-400','text-gray-600')}`}>{app.reference_number || 'Not Generated'}</td>
                      <td className={`py-4 px-5 text-xs font-bold ${t('text-white','text-gray-900')}`}>{fmtINR(Number(app.investment_amount) || 0)}</td>
                      <td className="py-4 px-5">
                        <button onClick={() => { setSelectedApp(app); setTxnForm({ capitalAmount: String(app.investment_amount || ''), transactionAmount: '', transactionId: '', proofUrl: '' }); if (bankAccounts[0]) setTxnBank(bankAccounts[0].id) }}
                          className="p-2 rounded-lg bg-brand-red text-white hover:bg-brand-red/80 transition-colors" title="View">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </G>
      )}

      {/* ── Investment Detail (when app selected from history) ── */}
      {subTab === 'history' && selectedApp && (
        <div className="space-y-4">
          <button onClick={() => setSelectedApp(null)} className={`flex items-center gap-1 text-xs font-semibold ${t('text-gray-400 hover:text-white','text-gray-600 hover:text-gray-900')} transition-colors`}>
            ← Back to My Investments
          </button>

          <G className="p-6" theme={theme}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-bold ${t('text-white','text-gray-900')}`}>{selectedApp.fund_vehicle}</h3>
              <div className="flex gap-2">
                <button onClick={() => setSubTab('schedule')} className={`px-4 py-2 rounded-lg text-xs font-bold ${t('bg-white/[0.06] text-white border border-white/[0.08]','bg-gray-100 text-gray-900 border border-gray-200')}`}>Payment Schedule</button>
                <button
                  onClick={() => {
                    // Open a printable investment summary the investor can save as PDF
                    const app = selectedApp
                    const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n))
                    const commitment = app?.commitment_id || `GHL-CMT-${String(app?.id || '').slice(0, 8).toUpperCase()}`
                    const rows = investorPayouts.length > 0
                      ? investorPayouts.map((p: any) => `<tr><td>${new Date(p.due_date).toLocaleDateString('en-IN')}</td><td>₹ ${fmt(Number(p.gross_amount)||0)}</td><td>₹ ${fmt(Number(p.tds_amount)||0)}</td><td>₹ ${fmt(Number(p.net_interest)||0)}</td><td>${p.payment_status||'pending'}</td></tr>`).join('')
                      : schedule.map((r: any) => `<tr><td>${new Date(r.date).toLocaleDateString('en-IN')}</td><td>₹ ${fmt(r.grossInterest)}</td><td>₹ ${fmt(r.tds)}</td><td>₹ ${fmt(r.netInterest)}</td><td>Due</td></tr>`).join('')
                    const html = `<!doctype html><html><head><title>Investment Summary — ${commitment}</title>
                      <style>
                        body{font-family:Georgia,serif;padding:40px 48px;color:#111;line-height:1.5}
                        h1{color:#8B0000;text-align:center;margin:0 0 6px}
                        .subhdr{text-align:center;color:#666;font-size:12px;margin-bottom:24px}
                        h2{color:#8B0000;font-size:16px;margin:24px 0 8px}
                        table{width:100%;border-collapse:collapse;font-size:12px;margin:8px 0}
                        th,td{border:1px solid #e1e1e1;padding:6px 10px;text-align:left}
                        th{background:#faf7f5;font-weight:600}
                        .facts td.l{background:#faf7f5;color:#555;font-weight:600;width:38%}
                        @media print{@page{margin:1.4cm}}
                      </style></head><body>
                      <h1>GHL INDIA VENTURES PRIVATE LIMITED</h1>
                      <div class="subhdr">Investment Summary · ${commitment}</div>
                      <table class="facts">
                        <tr><td class="l">Investor</td><td>${userName||'-'}</td></tr>
                        <tr><td class="l">Email</td><td>${userEmail||'-'}</td></tr>
                        <tr><td class="l">Fund / Vehicle</td><td>${app?.fund_vehicle||'-'}</td></tr>
                        <tr><td class="l">Investment Amount</td><td>₹ ${fmt(Number(app?.investment_amount)||0)}</td></tr>
                        <tr><td class="l">Tenure</td><td>${app?.tenure_preference||'-'}</td></tr>
                        <tr><td class="l">Interest Rate</td><td>${app?.interest_rate||selectedFund.interest}% p.a.</td></tr>
                        <tr><td class="l">Investment Date</td><td>${app?.investment_date?new Date(app.investment_date).toLocaleDateString('en-IN'):'-'}</td></tr>
                        <tr><td class="l">Status</td><td>${app?.status||'-'}</td></tr>
                      </table>
                      <h2>Payment Schedule</h2>
                      <table>
                        <thead><tr><th>Date</th><th>Gross</th><th>TDS</th><th>Net</th><th>Status</th></tr></thead>
                        <tbody>${rows||'<tr><td colspan=5 style="text-align:center;color:#888">No schedule generated yet</td></tr>'}</tbody>
                      </table>
                      <p style="margin-top:32px;font-size:10px;color:#888;text-align:center">System-generated document — ${new Date().toLocaleString('en-IN')}</p>
                      <script>window.onload=()=>window.print()</script>
                    </body></html>`
                    const w = window.open('', '_blank')
                    if (w) { w.document.write(html); w.document.close() }
                    else showToast('Please allow popups to export PDF', 'info')
                  }}
                  className={`px-4 py-2 rounded-lg text-xs font-bold ${t('bg-white/[0.06] text-white border border-white/[0.08]','bg-gray-100 text-gray-900 border border-gray-200')}`}>PDF</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Company Bank Account Details — for investor to transfer funds */}
              <div>
                <h4 className={`text-sm font-bold mb-3 ${t('text-white','text-gray-900')}`}>Bank Account Details</h4>
                <div className={`p-4 rounded-xl ${t('bg-white/[0.02] border border-white/[0.06]','bg-gray-50 border border-gray-200')}`}>
                  <p className={`text-xs font-bold mb-3 ${t('text-blue-400','text-blue-600')}`}>Transfer funds to the following account</p>
                  {[
                    { label: 'Account Holder Name', val: 'LANDMAXO PROPERTIES PVT LTD' },
                    { label: 'Account Number', val: '10090419033' },
                    { label: 'IFSC Code', val: 'IDFB0080105' },
                    { label: 'Bank Name', val: 'IDFC FIRST BANK' },
                    { label: 'Branch', val: 'ADYAR' },
                    { label: 'Account Type', val: 'Current Account' },
                  ].map((f, i) => (
                    <div key={i} className={`flex justify-between py-2 border-b last:border-0 ${t('border-white/[0.04]','border-gray-200')}`}>
                      <span className={`text-xs font-medium ${t('text-gray-500','text-gray-600')}`}>{f.label}</span>
                      <span className={`text-xs font-semibold ${t('text-white','text-gray-900')}`}>{f.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Form */}
              <div>
                <h4 className={`text-sm font-bold mb-3 ${t('text-white','text-gray-900')}`}>Transaction</h4>
                {selectedAppCapital > 0 && (
                  <div className={`mb-3 p-2.5 rounded-xl text-[11px] ${isFullyPaid ? t('bg-emerald-500/10 border border-emerald-500/20 text-emerald-400','bg-emerald-50 border border-emerald-200 text-emerald-700') : t('bg-white/[0.03] border border-white/[0.06] text-gray-400','bg-gray-50 border border-gray-200 text-gray-700')}`}>
                    {isFullyPaid ? (
                      <>Commitment fully funded — ₹{fmtINR(paidForSelectedApp)} of ₹{fmtINR(selectedAppCapital)} paid. No further transactions allowed.</>
                    ) : (
                      <>Paid ₹{fmtINR(paidForSelectedApp)} of ₹{fmtINR(selectedAppCapital)} · <span className="font-semibold">₹{fmtINR(remainingForSelectedApp)} remaining</span></>
                    )}
                  </div>
                )}
                <div className="space-y-3">
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Capital Amount*</label>
                    <input value={txnForm.capitalAmount} onChange={e => setTxnForm(p => ({ ...p, capitalAmount: e.target.value }))}
                      disabled={isFullyPaid}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm disabled:opacity-50 ${t('bg-white/[0.04] border border-white/[0.08] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Transaction Amount*</label>
                    <input type="number" value={txnForm.transactionAmount}
                      onChange={e => setTxnForm(p => ({ ...p, transactionAmount: e.target.value }))}
                      placeholder={remainingForSelectedApp > 0 ? `Up to ₹${fmtINR(remainingForSelectedApp)}` : 'Transaction Amount'}
                      disabled={isFullyPaid}
                      max={remainingForSelectedApp || undefined}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm disabled:opacity-50 ${t('bg-white/[0.04] border border-white/[0.08] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Transaction ID</label>
                    <input value={txnForm.transactionId} onChange={e => setTxnForm(p => ({ ...p, transactionId: e.target.value }))} placeholder="Transaction ID"
                      disabled={isFullyPaid}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm disabled:opacity-50 ${t('bg-white/[0.04] border border-white/[0.08] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`} />
                  </div>
                  {bankAccounts.length > 0 && (
                    <div>
                      <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Paid from (your bank)</label>
                      <select
                        value={txnBank}
                        onChange={e => setTxnBank(e.target.value)}
                        disabled={isFullyPaid}
                        className={`w-full px-3 py-2.5 rounded-xl text-sm disabled:opacity-50 ${t('bg-white/[0.04] border border-white/[0.08] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`}
                      >
                        {bankAccounts.map((b: any) => (
                          <option key={b.id} value={b.id} className="bg-neutral-900">
                            {[b.bank_name, b.account_number ? `••${String(b.account_number).slice(-4)}` : null].filter(Boolean).join(' — ') || 'Bank account'}
                          </option>
                        ))}
                      </select>
                      <p className={`text-[10px] mt-1 ${t('text-gray-600','text-gray-500')}`}>Helps ops match your wire transfer against your verified account.</p>
                    </div>
                  )}
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Transaction Proof*</label>
                    <button onClick={handleUploadProof} disabled={isFullyPaid}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${txnForm.proofUrl ? t('border-emerald-500/30 bg-emerald-500/10 text-emerald-400','border-emerald-300 bg-emerald-50 text-emerald-700') : t('border-white/[0.08] bg-white/[0.04] text-gray-400','border-gray-300 bg-gray-50 text-gray-600')}`}>
                      {txnForm.proofUrl ? <><CheckCircle className="w-4 h-4" /> Uploaded</> : <><Upload className="w-4 h-4" /> Choose File</>}
                    </button>
                  </div>
                  <button onClick={handleSubmitTransaction} disabled={txnSubmitting || isFullyPaid}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white text-center disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
                    {txnSubmitting ? 'Submitting...' : isFullyPaid ? 'Fully Paid' : 'Submit'}
                  </button>
                </div>
              </div>
            </div>
          </G>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────
          4. DOCUMENTS (Post-approval)
          ────────────────────────────────────────────────────── */}
      {subTab === 'documents' && (
        <div className="space-y-4">
          {investDocs.length === 0 ? (
            <G className="overflow-hidden" theme={theme}>
              <div className="p-10 text-center">
                <FileText className={`w-10 h-10 mx-auto mb-3 ${t('text-gray-600','text-gray-400')}`} />
                <p className={`text-sm font-medium ${t('text-gray-400','text-gray-600')}`}>No investment documents yet</p>
                <p className={`text-xs mt-1 ${t('text-gray-600','text-gray-500')}`}>Documents will appear here after your investment is approved by admin.</p>
              </div>
            </G>
          ) : (
            // Testing 2026-04-18 #9: split documents by investment application so
            // each commitment has its own doc pack (no more mixed rows across funds).
            (() => {
              const groupMap = new Map<string, any[]>()
              for (const doc of investDocs) {
                const key = doc.investment_app_id || 'orphan'
                if (!groupMap.has(key)) groupMap.set(key, [])
                groupMap.get(key)!.push(doc)
              }
              const appById = new Map(investApps.map((a: any) => [a.id, a]))
              const groups = Array.from(groupMap.entries()).sort((a, b) => {
                const at = new Date((a[1][0]?.created_at) || 0).getTime()
                const bt = new Date((b[1][0]?.created_at) || 0).getTime()
                return bt - at
              })
              // Types that support admin→investor→admin signing round-trip.
              // Testing Report 2 (2026-04-25 #6): only the Debenture Agreement
              // requires a signed copy back from the investor. The Debenture
              // Certificate, Allotment Letter and Acknowledgement no longer
              // show an Upload button on the investor side.
              const signableTypes = new Set([
                'debenture_agreement', 'agreement',
              ])
              const autoGenTypes = new Set(['acknowledgement_letter', 'acknowledgement'])
              return groups.map(([appId, docs]) => {
                const app: any = appById.get(appId) || docs[0] || {}
                const commitment = app.commitment_id || (appId !== 'orphan' ? `GHL-CMT-${String(appId).slice(0,8).toUpperCase()}` : 'Unassigned')
                const fund = app.fund_vehicle || docs[0]?.fund_vehicle || 'Investment Documents'
                return (
                  <G key={appId} className="overflow-hidden" theme={theme}>
                    <div className={`px-5 py-3 border-b flex items-center justify-between gap-3 ${t('border-white/[0.06]','border-gray-200')}`}>
                      <div className="min-w-0">
                        <h4 className={`text-sm font-bold truncate ${t('text-white','text-gray-900')}`}>{fund}</h4>
                        <p className={`text-[11px] ${t('text-gray-500','text-gray-600')}`}>Commitment: {commitment}{app.investment_amount ? ` · ₹${fmtINR(Number(app.investment_amount) || 0)}` : ''}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${t('bg-white/[0.04] text-gray-400','bg-gray-100 text-gray-600')}`}>{docs.length} doc{docs.length === 1 ? '' : 's'}</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className={`border-b ${t('border-white/[0.06] bg-white/[0.02]','border-gray-200 bg-gray-50')}`}>
                            {/* Testing Report 2 (2026-04-25 #5): drop the
                                Date column from the investor's docs table. */}
                            {['TITLE', 'DOCUMENT', 'SIGNED DOCUMENTS'].map(h => (
                              <th key={h} className={`text-left text-xs font-bold uppercase tracking-wider py-3 px-5 ${t('text-gray-500','text-gray-600')}`}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {docs.map((doc: any, i: number) => {
                            const docType = (doc.document_type || '').toLowerCase()
                            const isAutoAck = autoGenTypes.has(docType) && !doc.file_url
                            const isSignable = signableTypes.has(docType)
                            return (
                              <tr key={doc.id || i} className={`border-b ${t('border-white/[0.04]','border-gray-100')}`}>
                                <td className={`py-4 px-5 text-xs font-medium ${t('text-white','text-gray-900')}`}>{doc.title}</td>
                                <td className="py-4 px-5">
                                  {doc.file_url ? (
                                    <div className="flex gap-2">
                                      <button onClick={() => handleViewDoc(doc.file_url)} className="p-2 rounded-lg bg-brand-red text-white hover:bg-brand-red/80" title="View"><Eye className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => handleViewDoc(doc.file_url)} className="p-2 rounded-lg bg-brand-red text-white hover:bg-brand-red/80" title="Download"><Download className="w-3.5 h-3.5" /></button>
                                    </div>
                                  ) : isAutoAck ? (
                                    // Testing 2026-04-18 #7: auto-generate the acknowledgement
                                    // in a printable window when admin hasn't uploaded one.
                                    <button onClick={() => handleOpenAutoAcknowledgement(app, doc)} className="p-2 rounded-lg bg-brand-red text-white hover:bg-brand-red/80" title="Open auto-generated acknowledgement">
                                      <Eye className="w-3.5 h-3.5" />
                                    </button>
                                  ) : <span className={`text-xs ${t('text-gray-600','text-gray-400')}`}>-</span>}
                                </td>
                                <td className="py-4 px-5">
                                  {/* Testing 2026-04-18 #8: allow signed-copy upload on
                                      every contract-like document, not just the two
                                      original debenture types. */}
                                  {isSignable ? (
                                    doc.signed_copy_url ? (
                                      <button onClick={() => handleViewDoc(doc.signed_copy_url)} className="p-2 rounded-lg bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25" title="Signed"><CheckCircle className="w-3.5 h-3.5" /></button>
                                    ) : (
                                      <button onClick={() => handleUploadSigned(doc.id)} className="p-2 rounded-lg border border-white/10 text-gray-400 hover:text-white hover:bg-white/[0.06]" title="Upload Signed"><Upload className="w-3.5 h-3.5" /></button>
                                    )
                                  ) : <span className={`text-xs ${t('text-gray-600','text-gray-400')}`}>-</span>}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </G>
                )
              })
            })()
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────
          5. PAYMENT SCHEDULE
          ────────────────────────────────────────────────────── */}
      {subTab === 'schedule' && (
        <div className="space-y-4">
          {/* Testing 2026-04-18 #10: payouts must be scoped to one investment.
              When the investor arrives at Payment Schedule without choosing a
              specific investment, list their investments so they can pick. */}
          {!selectedApp && (
            <G className="overflow-hidden" theme={theme}>
              {investApps.length === 0 ? (
                <div className="p-10 text-center">
                  <Calendar className={`w-10 h-10 mx-auto mb-3 ${t('text-gray-600','text-gray-400')}`} />
                  <p className={`text-sm font-medium ${t('text-gray-400','text-gray-600')}`}>No investments yet</p>
                  <p className={`text-xs mt-1 ${t('text-gray-600','text-gray-500')}`}>Submit an investment first to see its payment schedule.</p>
                </div>
              ) : (
                <>
                  <div className={`px-5 py-3 border-b ${t('border-white/[0.06]','border-gray-200')}`}>
                    <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>Select an Investment</h4>
                    <p className={`text-[11px] mt-0.5 ${t('text-gray-500','text-gray-600')}`}>Payouts are scheduled per investment. Pick one to view its schedule.</p>
                  </div>
                  {/* Tests 28-04-2026 #8: visually separate each investment so the
                      investor can clearly tell them apart before picking one. */}
                  <div className="p-3 grid gap-3">
                    {investApps.map((app: any, idx: number) => (
                      <button key={app.id} onClick={() => setSelectedApp(app)}
                        className={`text-left px-4 py-3 rounded-xl border flex items-center justify-between gap-3 transition-colors ${t('bg-white/[0.02] border-white/[0.08] hover:bg-white/[0.05] hover:border-white/[0.16]','bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300')}`}>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-md text-[10px] font-bold ${t('bg-brand-red/20 text-brand-red','bg-brand-red/10 text-brand-red')}`}>{idx + 1}</span>
                            <p className={`text-sm font-semibold truncate ${t('text-white','text-gray-900')}`}>{app.fund_vehicle || '—'}</p>
                          </div>
                          <p className={`text-[11px] ${t('text-gray-500','text-gray-600')}`}>{app.commitment_id || `GHL-CMT-${String(app.id).slice(0,8).toUpperCase()}`} · ₹{fmtINR(Number(app.investment_amount) || 0)} · {fmtDate(app.investment_date || app.created_at)}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${t('text-gray-500','text-gray-400')}`} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </G>
          )}
          {selectedApp && (
            <G className="p-6" theme={theme}>
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <p className={`text-xs ${t('text-gray-500','text-gray-600')}`}>Fund: {selectedApp.fund_vehicle || selectedFund.name}{selectedApp.commitment_id ? ` · ${selectedApp.commitment_id}` : ''}</p>
                  <h3 className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>Investor Details</h3>
                </div>
                <div className="flex items-center gap-3">
                  <p className={`text-xs font-semibold ${t('text-gray-400','text-gray-600')}`}>Investment Date: {fmtDate(selectedApp.investment_date || selectedApp.created_at)}</p>
                  {investApps.length > 1 && (
                    <button onClick={() => setSelectedApp(null)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg ${t('bg-white/[0.06] text-gray-300 border border-white/[0.08] hover:bg-white/[0.1]','bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200')}`}>
                      Change Investment
                    </button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-2">
                <div><p className={`text-xs ${t('text-gray-500','text-gray-600')}`}>Name</p><p className={`text-sm font-medium ${t('text-white','text-gray-900')}`}>{userName}</p></div>
                <div><p className={`text-xs ${t('text-gray-500','text-gray-600')}`}>Email</p><p className={`text-sm font-medium ${t('text-white','text-gray-900')}`}>{userEmail}</p></div>
                <div><p className={`text-xs ${t('text-gray-500','text-gray-600')}`}>Phone</p><p className={`text-sm font-medium ${t('text-white','text-gray-900')}`}>{userPhone}</p></div>
              </div>
              <table className={`w-full text-sm mt-4`}>
                <tbody>
                  {[
                    { label: 'Investment Amount', value: `₹ ${fmtINR(Number(selectedApp.investment_amount) || investAmount)}` },
                    { label: 'Return / Annum', value: `${selectedApp.interest_rate || selectedFund.interest} %` },
                    { label: 'Appreciation / Annum', value: `${selectedApp.appreciation_rate || selectedFund.capitalAppreciation} %` },
                    { label: 'TDS', value: `${selectedApp.tds_rate || 10} %` },
                  ].map((r, i) => (
                    <tr key={i} className={`border-b ${t('border-white/[0.06]','border-gray-200')}`}>
                      <td className={`py-2.5 text-xs font-bold ${t('text-gray-300','text-gray-800')}`}>{r.label}</td>
                      <td className={`py-2.5 text-right text-sm font-bold ${t('text-white','text-gray-900')}`}>{r.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </G>
          )}

          {/* Tests 28-04-2026 #8: only render the payout schedule once a
              specific investment is chosen. With multiple investments this
              avoids stitching schedules together; with one it falls through
              automatically (auto-select effect above). */}
          {selectedApp && (
          <G className="overflow-hidden" theme={theme}>
            {/* When real payouts have been generated by the admin (AIF yearly /
                Debenture monthly) prefer those rows so the investor sees the
                actual schedule the accounts team will process. Fall back to
                the computed preview otherwise. */}
            {investorPayouts.length > 0 ? (
              <div className="overflow-x-auto">
                <div className={`px-4 py-2 text-[10px] uppercase tracking-wider ${t('text-emerald-400 bg-emerald-500/[0.06]','text-emerald-700 bg-emerald-50')}`}>
                  Schedule approved — {investorPayouts.length} payout{investorPayouts.length === 1 ? '' : 's'} ready for processing
                </div>
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b ${t('border-white/[0.06] bg-white/[0.02]','border-gray-200 bg-gray-50')}`}>
                      {['Due Date', 'Fund', 'Gross', 'TDS', 'Net Interest', 'Payment Status', 'Paid On'].map(h => (
                        <th key={h} className={`text-left font-bold uppercase tracking-wider py-3 px-4 ${t('text-gray-500','text-gray-600')}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {investorPayouts.map((p: any) => {
                      const status = (p.payment_status || 'pending').toLowerCase()
                      const pillCls = status === 'paid'
                        ? 'bg-emerald-500/15 text-emerald-500'
                        : status === 'overdue'
                          ? 'bg-red-500/15 text-red-500'
                          : 'bg-amber-500/15 text-amber-500'
                      return (
                        <tr key={p.id} className={`border-b ${t('border-white/[0.03] hover:bg-white/[0.02]','border-gray-100 hover:bg-gray-50')}`}>
                          <td className={`py-2.5 px-4 ${t('text-gray-400','text-gray-700')}`}>{fmtDate(p.due_date)}</td>
                          <td className={`py-2.5 px-4 ${t('text-gray-400','text-gray-700')}`}>{p.fund_type || '—'}</td>
                          <td className={`py-2.5 px-4 font-semibold ${t('text-white','text-gray-900')}`}>₹{fmtINR(Number(p.gross_amount) || 0)}</td>
                          <td className={`py-2.5 px-4 ${t('text-red-400','text-red-600')}`}>₹{fmtINR(Number(p.tds_amount) || 0)}</td>
                          <td className={`py-2.5 px-4 font-semibold ${t('text-emerald-400','text-emerald-700')}`}>₹{fmtINR(Number(p.net_interest) || 0)}</td>
                          <td className="py-2.5 px-4"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${pillCls}`}>{status}</span></td>
                          <td className={`py-2.5 px-4 ${t('text-gray-500','text-gray-600')}`}>{p.payment_date ? fmtDate(p.payment_date) : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className={`border-b ${t('border-white/[0.06] bg-white/[0.02]','border-gray-200 bg-gray-50')}`}>
                      {['Tentative Date', 'Gross Interest', 'TDS', 'Net Interest', 'Appreciation', 'Value Of Debenture', 'Payment Status'].map(h => (
                        <th key={h} className={`text-left font-bold uppercase tracking-wider py-3 px-4 ${t('text-gray-500','text-gray-600')}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.length === 0 ? (
                      <tr><td colSpan={7} className="py-8 text-center"><p className={`text-xs ${t('text-gray-500','text-gray-600')}`}>Select an investment from "My Investments" to view the payment schedule, or use the Invest tab to preview.</p></td></tr>
                    ) : schedule.map((row, i) => (
                      <tr key={i} className={`border-b ${t('border-white/[0.03] hover:bg-white/[0.02]','border-gray-100 hover:bg-gray-50')}`}>
                        <td className={`py-2.5 px-4 ${t('text-gray-400','text-gray-700')}`}>{fmtDate(row.date)}</td>
                        <td className={`py-2.5 px-4 font-semibold ${t('text-white','text-gray-900')}`}>₹{fmtINR(row.grossInterest)}</td>
                        <td className={`py-2.5 px-4 ${t('text-red-400','text-red-600')}`}>₹{fmtINR(row.tds)}</td>
                        <td className={`py-2.5 px-4 font-semibold ${t('text-emerald-400','text-emerald-700')}`}>₹{fmtINR(row.netInterest)}</td>
                        <td className={`py-2.5 px-4 ${row.appreciation > 0 ? t('text-blue-400','text-blue-700') : t('text-gray-600','text-gray-400')}`}>{row.appreciation > 0 ? `₹${fmtINR(row.appreciation)}` : '-'}</td>
                        <td className={`py-2.5 px-4 font-bold ${row.debentureValue > 0 ? t('text-white','text-gray-900') : t('text-gray-600','text-gray-400')}`}>{row.debentureValue > 0 ? `₹${fmtINR(row.debentureValue)}` : '-'}</td>
                        <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-500">Due</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </G>
          )}
        </div>
      )}
    </div>
  )
}
