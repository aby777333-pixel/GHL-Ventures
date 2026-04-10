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
} from '@/lib/supabase/dashboardDataService'
import {
  useInvestmentApplications,
  useInvestmentDocuments,
  useInvestmentTransactions,
} from '@/lib/supabase/dashboardDataHooks'

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
    tenure: '5-7 Years',
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
  const { data: investDocs } = useInvestmentDocuments(clientId ?? undefined)
  const { data: investTxns } = useInvestmentTransactions(clientId ?? undefined)

  // Load bank accounts
  useEffect(() => {
    if (clientId) fetchBankAccounts(clientId).then((a: any) => setBankAccounts(a || []))
  }, [clientId])

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

  const handleSubmitTransaction = async () => {
    if (!selectedApp || !clientId) return
    if (!txnForm.transactionAmount) { showToast('Transaction amount is required', 'error'); return }
    setTxnSubmitting(true)
    const res = await submitInvestmentTransaction({
      investment_app_id: selectedApp.id,
      client_id: clientId,
      capital_amount: Number(txnForm.capitalAmount) || Number(selectedApp.investment_amount),
      transaction_amount: Number(txnForm.transactionAmount),
      transaction_id: txnForm.transactionId || undefined,
      transaction_proof_url: txnForm.proofUrl || undefined,
      bank_account_id: txnBank || undefined,
    })
    if (res) {
      showToast('Transaction submitted for admin approval!', 'success')
      setTxnForm({ capitalAmount: '', transactionAmount: '', transactionId: '', proofUrl: '' })
    } else { showToast('Failed to submit transaction', 'error') }
    setTxnSubmitting(false)
  }

  const handleUploadProof = async () => {
    try {
      const { pickAndUploadFiles } = await import('@/lib/supabase/storageService')
      const results = await pickAndUploadFiles(`client/transactions/${clientId}`, { accept: '.pdf,.jpg,.jpeg,.png', multiple: false })
      if (results?.[0]?.success && results[0].file) {
        setTxnForm(p => ({ ...p, proofUrl: results[0].file!.url }))
        showToast('Proof uploaded!', 'success')
      }
    } catch { showToast('Upload failed', 'error') }
  }

  const handleUploadSigned = async (docId: string) => {
    try {
      const { pickAndUploadFiles } = await import('@/lib/supabase/storageService')
      const results = await pickAndUploadFiles(`client/signed/${clientId}`, { accept: '.pdf,.jpg,.jpeg,.png', multiple: false })
      if (results?.[0]?.success && results[0].file) {
        await uploadSignedDocument(docId, results[0].file.url)
        showToast('Signed document uploaded!', 'success')
      }
    } catch { showToast('Upload failed', 'error') }
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
                <a href="/downloads" target="_blank" className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-brand-red/80 hover:bg-brand-red flex items-center gap-1"><Download className="w-3 h-3" /> Download Terms</a>
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

                <input type="number" value={investAmount} onChange={e => setInvestAmount(Number(e.target.value) || 0)}
                  className={`w-full px-4 py-3 rounded-xl text-lg font-bold ${t('bg-white/[0.04] border border-white/[0.08] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`}
                  min={selectedFund.minInvestment} step={100000} />

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
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
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
                <button onClick={() => showToast('PDF export coming soon', 'info')} className={`px-4 py-2 rounded-lg text-xs font-bold ${t('bg-white/[0.06] text-white border border-white/[0.08]','bg-gray-100 text-gray-900 border border-gray-200')}`}>PDF</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Bank Account Details */}
              <div>
                <h4 className={`text-sm font-bold mb-3 ${t('text-white','text-gray-900')}`}>Bank Account Details</h4>
                {selectedBankDetails ? (
                  <div className={`p-4 rounded-xl ${t('bg-white/[0.02] border border-white/[0.06]','bg-gray-50 border border-gray-200')}`}>
                    <p className={`text-xs font-bold mb-3 ${t('text-blue-400','text-blue-600')}`}>{selectedBankDetails.bank_name || 'Bank'}</p>
                    {[
                      { label: 'Account Holder Name', val: selectedBankDetails.account_holder_name },
                      { label: 'Account Number', val: selectedBankDetails.account_number },
                      { label: 'IFSC Code', val: selectedBankDetails.ifsc_code || selectedBankDetails.swift_iban_code },
                      { label: 'Branch Name', val: selectedBankDetails.branch_name || '—' },
                      { label: 'Bank Name', val: selectedBankDetails.bank_name },
                    ].map((f, i) => (
                      <div key={i} className={`flex justify-between py-2 border-b last:border-0 ${t('border-white/[0.04]','border-gray-200')}`}>
                        <span className={`text-xs font-medium ${t('text-gray-500','text-gray-600')}`}>{f.label}</span>
                        <span className={`text-xs font-semibold ${t('text-white','text-gray-900')}`}>{f.val || '—'}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-xs ${t('text-gray-500','text-gray-600')}`}>No bank account on file. Please add one in KYC.</p>
                )}
              </div>

              {/* Transaction Form */}
              <div>
                <h4 className={`text-sm font-bold mb-3 ${t('text-white','text-gray-900')}`}>Transaction</h4>
                <div className="space-y-3">
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Capital Amount*</label>
                    <input value={txnForm.capitalAmount} onChange={e => setTxnForm(p => ({ ...p, capitalAmount: e.target.value }))}
                      className={`w-full px-3 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.08] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Transaction Amount*</label>
                    <input value={txnForm.transactionAmount} onChange={e => setTxnForm(p => ({ ...p, transactionAmount: e.target.value }))} placeholder="Transaction Amount"
                      className={`w-full px-3 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.08] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Transaction ID</label>
                    <input value={txnForm.transactionId} onChange={e => setTxnForm(p => ({ ...p, transactionId: e.target.value }))} placeholder="Transaction ID"
                      className={`w-full px-3 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.08] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Transaction Proof*</label>
                    <button onClick={handleUploadProof}
                      className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-colors ${txnForm.proofUrl ? t('border-emerald-500/30 bg-emerald-500/10 text-emerald-400','border-emerald-300 bg-emerald-50 text-emerald-700') : t('border-white/[0.08] bg-white/[0.04] text-gray-400','border-gray-300 bg-gray-50 text-gray-600')}`}>
                      {txnForm.proofUrl ? <><CheckCircle className="w-4 h-4" /> Uploaded</> : <><Upload className="w-4 h-4" /> Choose File</>}
                    </button>
                  </div>
                  <button onClick={handleSubmitTransaction} disabled={txnSubmitting}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
                    {txnSubmitting ? 'Submitting...' : 'Submit'}
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
        <G className="overflow-hidden" theme={theme}>
          {investDocs.length === 0 ? (
            <div className="p-10 text-center">
              <FileText className={`w-10 h-10 mx-auto mb-3 ${t('text-gray-600','text-gray-400')}`} />
              <p className={`text-sm font-medium ${t('text-gray-400','text-gray-600')}`}>No investment documents yet</p>
              <p className={`text-xs mt-1 ${t('text-gray-600','text-gray-500')}`}>Documents will appear here after your investment is approved by admin.</p>
            </div>
          ) : (
            <>
              <div className={`px-5 py-3 border-b ${t('border-white/[0.06]','border-gray-200')}`}>
                <h4 className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>{investDocs[0]?.fund_vehicle || 'Investment Documents'}</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b ${t('border-white/[0.06] bg-white/[0.02]','border-gray-200 bg-gray-50')}`}>
                      {['DATE', 'TITLE', 'DOCUMENT', 'SIGNED DOCUMENTS'].map(h => (
                        <th key={h} className={`text-left text-xs font-bold uppercase tracking-wider py-3 px-5 ${t('text-gray-500','text-gray-600')}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {investDocs.map((doc: any, i: number) => (
                      <tr key={doc.id || i} className={`border-b ${t('border-white/[0.04]','border-gray-100')}`}>
                        <td className={`py-4 px-5 text-xs ${t('text-gray-400','text-gray-600')}`}>{fmtDateTime(doc.created_at)}</td>
                        <td className={`py-4 px-5 text-xs font-medium ${t('text-white','text-gray-900')}`}>{doc.title}</td>
                        <td className="py-4 px-5">
                          {doc.file_url ? (
                            <div className="flex gap-2">
                              <button onClick={() => handleViewDoc(doc.file_url)} className="p-2 rounded-lg bg-brand-red text-white hover:bg-brand-red/80" title="View"><Eye className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleViewDoc(doc.file_url)} className="p-2 rounded-lg bg-brand-red text-white hover:bg-brand-red/80" title="Download"><Download className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : <span className={`text-xs ${t('text-gray-600','text-gray-400')}`}>-</span>}
                        </td>
                        <td className="py-4 px-5">
                          {(doc.document_type === 'debenture_agreement' || doc.document_type === 'debenture_certificate') ? (
                            doc.signed_copy_url ? (
                              <button onClick={() => handleViewDoc(doc.signed_copy_url)} className="p-2 rounded-lg bg-emerald-500/15 text-emerald-500 hover:bg-emerald-500/25" title="Signed"><CheckCircle className="w-3.5 h-3.5" /></button>
                            ) : (
                              <button onClick={() => handleUploadSigned(doc.id)} className="p-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100" title="Upload Signed"><Upload className="w-3.5 h-3.5" /></button>
                            )
                          ) : <span className={`text-xs ${t('text-gray-600','text-gray-400')}`}>-</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </G>
      )}

      {/* ──────────────────────────────────────────────────────
          5. PAYMENT SCHEDULE
          ────────────────────────────────────────────────────── */}
      {subTab === 'schedule' && (
        <div className="space-y-4">
          {selectedApp && (
            <G className="p-6" theme={theme}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className={`text-xs ${t('text-gray-500','text-gray-600')}`}>Fund: {selectedApp.fund_vehicle || selectedFund.name}</p>
                  <h3 className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>Investor Details</h3>
                </div>
                <p className={`text-xs font-semibold ${t('text-gray-400','text-gray-600')}`}>Investment Date: {fmtDate(selectedApp.investment_date || selectedApp.created_at)}</p>
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

          <G className="overflow-hidden" theme={theme}>
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
          </G>
        </div>
      )}
    </div>
  )
}
