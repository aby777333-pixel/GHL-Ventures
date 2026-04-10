'use client'

import { useState, useMemo } from 'react'
import {
  FileText, Download, Upload, Eye, CheckCircle, Clock, AlertCircle,
  Calendar, IndianRupee, Building2, CreditCard, ArrowRight, X, Info,
} from 'lucide-react'
import {
  calculatePaymentSchedule,
  submitInvestmentTransaction,
  uploadSignedDocument,
  type PaymentScheduleRow,
} from '@/lib/supabase/dashboardDataService'

// ── Helpers ──────────────────────────────────────────────────
function formatINR(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n)
}

function formatDate(d: string): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Glass wrapper (re-usable) ────────────────────────────────
function Glass({ children, className = '', theme }: { children: React.ReactNode; className?: string; theme: string }) {
  const isDark = theme === 'dark'
  return (
    <div className={`rounded-2xl border backdrop-blur-sm ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white/80 border-gray-200/50 shadow-sm'} ${className}`}>
      {children}
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  1. INVESTMENT HISTORY TABLE
// ════════════════════════════════════════════════════════════════
interface InvestmentHistoryProps {
  applications: any[]
  theme: string
  onViewDetails: (app: any) => void
  showToast: (msg: string, type?: string) => void
}

export function InvestmentHistory({ applications, theme, onViewDetails, showToast }: InvestmentHistoryProps) {
  const isDark = theme === 'dark'
  const t = (dark: string, light: string) => isDark ? dark : light

  if (applications.length === 0) {
    return (
      <Glass className="p-8 text-center" theme={theme}>
        <Building2 className={`w-10 h-10 mx-auto mb-3 ${t('text-gray-600','text-gray-400')}`} />
        <p className={`text-sm font-medium ${t('text-gray-400','text-gray-600')}`}>No investment applications yet</p>
        <p className={`text-xs mt-1 ${t('text-gray-600','text-gray-500')}`}>Your investment commitments will appear here after you apply.</p>
      </Glass>
    )
  }

  return (
    <Glass className="overflow-hidden" theme={theme}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${t('border-white/[0.06]','border-gray-200/50')}`}>
              {['Commitment ID', 'Fund Name', 'Reference Number', 'Amount (₹)', 'Status', 'Action'].map(h => (
                <th key={h} className={`text-left text-xs font-semibold py-3 px-5 ${t('text-gray-500','text-gray-600')}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {applications.map((app: any, i: number) => {
              const statusColor = app.status === 'approved' ? 'text-emerald-400 bg-emerald-500/15' : app.status === 'rejected' ? 'text-red-400 bg-red-500/15' : 'text-amber-400 bg-amber-500/15'
              return (
                <tr key={app.id || i} className={`border-b transition-colors ${t('border-white/[0.03] hover:bg-white/[0.02]','border-gray-100 hover:bg-gray-50')}`}>
                  <td className={`py-3 px-5 text-xs font-mono ${t('text-gray-400','text-gray-600')}`}>{app.commitment_id || 'Not Generated'}</td>
                  <td className={`py-3 px-5 text-xs font-medium ${t('text-white','text-gray-900')}`}>{app.fund_vehicle || '—'}</td>
                  <td className={`py-3 px-5 text-xs font-mono ${t('text-gray-400','text-gray-600')}`}>{app.reference_number || 'Not Generated'}</td>
                  <td className={`py-3 px-5 text-xs font-semibold ${t('text-white','text-gray-900')}`}>₹{formatINR(Number(app.investment_amount) || 0)}</td>
                  <td className="py-3 px-5">
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                      {app.status === 'approved' ? <CheckCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {(app.status || 'pending').charAt(0).toUpperCase() + (app.status || 'pending').slice(1)}
                    </span>
                  </td>
                  <td className="py-3 px-5">
                    <button
                      onClick={() => onViewDetails(app)}
                      className="p-2 rounded-lg bg-brand-red/15 text-brand-red hover:bg-brand-red/25 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Glass>
  )
}

// ════════════════════════════════════════════════════════════════
//  2. INVESTMENT DETAIL + TRANSACTION FORM
// ════════════════════════════════════════════════════════════════
interface InvestmentDetailProps {
  application: any
  bankAccounts: any[]
  theme: string
  clientId: string
  showToast: (msg: string, type?: string) => void
  onClose: () => void
}

export function InvestmentDetail({ application, bankAccounts, theme, clientId, showToast, onClose }: InvestmentDetailProps) {
  const isDark = theme === 'dark'
  const t = (dark: string, light: string) => isDark ? dark : light
  const [activeView, setActiveView] = useState<'details' | 'schedule' | 'transaction'>('details')
  const [txnForm, setTxnForm] = useState({ capitalAmount: String(application.investment_amount || ''), transactionAmount: '', transactionId: '', proofUrl: '' })
  const [selectedBank, setSelectedBank] = useState<string>(bankAccounts[0]?.id || '')
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)

  const schedule = useMemo(() => {
    return calculatePaymentSchedule(
      Number(application.investment_amount) || 1000000,
      application.investment_date || application.created_at || new Date().toISOString(),
      Number(application.tenure_preference?.replace(/[^0-9]/g, '')) || 3,
      Number(application.interest_rate) || 12,
      Number(application.appreciation_rate) || 12,
      Number(application.tds_rate) || 10,
    )
  }, [application])

  const selectedBankDetails = bankAccounts.find((b: any) => b.id === selectedBank)

  const handleSubmitTransaction = async () => {
    if (!txnForm.transactionAmount) { showToast('Transaction amount is required', 'error'); return }
    setSubmitting(true)
    const result = await submitInvestmentTransaction({
      investment_app_id: application.id,
      client_id: clientId,
      capital_amount: Number(txnForm.capitalAmount) || 0,
      transaction_amount: Number(txnForm.transactionAmount) || 0,
      transaction_id: txnForm.transactionId || undefined,
      transaction_proof_url: txnForm.proofUrl || undefined,
      bank_account_id: selectedBank || undefined,
    })
    if (result) {
      showToast('Transaction submitted for admin approval!', 'success')
      onClose()
    } else {
      showToast('Failed to submit transaction', 'error')
    }
    setSubmitting(false)
  }

  const handleUploadProof = async () => {
    try {
      setUploading(true)
      const { pickAndUploadFiles } = await import('@/lib/supabase/storageService')
      const results = await pickAndUploadFiles(`client/transactions/${clientId}`, {
        accept: '.pdf,.jpg,.jpeg,.png',
        multiple: false,
      })
      if (results && results.length > 0 && results[0].success && results[0].file) {
        setTxnForm(prev => ({ ...prev, proofUrl: results[0].file!.url || results[0].file!.path || '' }))
        showToast('Proof uploaded!', 'success')
      }
    } catch { showToast('Upload failed', 'error') }
    setUploading(false)
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border p-6 ${t('bg-[#111] border-white/10','bg-white border-gray-200 shadow-2xl')}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className={`text-lg font-bold ${t('text-white','text-gray-900')}`}>{application.fund_vehicle || 'Investment Details'}</h3>
            <p className={`text-xs ${t('text-gray-500','text-gray-600')}`}>Amount: ₹{formatINR(Number(application.investment_amount) || 0)}</p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-xl ${t('hover:bg-white/10 text-gray-400','hover:bg-gray-100 text-gray-600')}`}><X className="w-5 h-5" /></button>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: 'details', label: 'Investment Info', icon: Info },
            { id: 'schedule', label: 'Payment Schedule', icon: Calendar },
            { id: 'transaction', label: 'Submit Transaction', icon: CreditCard },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveView(tab.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${activeView === tab.id ? 'bg-brand-red/20 text-brand-red border border-brand-red/30' : t('bg-white/[0.04] text-gray-500 border border-white/[0.06]','bg-gray-100 text-gray-600 border border-gray-200')}`}>
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          ))}
        </div>

        {/* Details View */}
        {activeView === 'details' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Investment Amount', value: `₹${formatINR(Number(application.investment_amount) || 0)}` },
                { label: 'Return / Annum', value: `${application.interest_rate || 12}%` },
                { label: 'Appreciation / Annum', value: `${application.appreciation_rate || 12}%` },
                { label: 'TDS', value: `${application.tds_rate || 10}%` },
                { label: 'Tenure', value: application.tenure_preference || '3 Years' },
                { label: 'Status', value: (application.status || 'pending').toUpperCase() },
                { label: 'Investment Date', value: formatDate(application.investment_date || application.created_at) },
                { label: 'Commitment ID', value: application.commitment_id || 'Not Generated' },
              ].map((f, i) => (
                <div key={i} className={`p-3 rounded-xl ${t('bg-white/[0.03] border border-white/[0.06]','bg-gray-50 border border-gray-200')}`}>
                  <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${t('text-gray-600','text-gray-500')}`}>{f.label}</p>
                  <p className={`text-sm font-bold ${t('text-white','text-gray-900')}`}>{f.value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Schedule */}
        {activeView === 'schedule' && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className={`border-b ${t('border-white/[0.06]','border-gray-200')}`}>
                  {['Tentative Date', 'Gross Interest', 'TDS', 'Net Interest', 'Appreciation', 'Value of Debenture', 'Payment Status'].map(h => (
                    <th key={h} className={`text-left py-2 px-3 font-semibold ${t('text-gray-500','text-gray-600')}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, i) => (
                  <tr key={i} className={`border-b ${t('border-white/[0.02] hover:bg-white/[0.02]','border-gray-100 hover:bg-gray-50')}`}>
                    <td className={`py-2 px-3 ${t('text-gray-400','text-gray-700')}`}>{formatDate(row.date)}</td>
                    <td className={`py-2 px-3 font-medium ${t('text-white','text-gray-900')}`}>₹{formatINR(row.grossInterest)}</td>
                    <td className={`py-2 px-3 ${t('text-red-400','text-red-600')}`}>₹{formatINR(row.tds)}</td>
                    <td className={`py-2 px-3 font-medium ${t('text-emerald-400','text-emerald-700')}`}>₹{formatINR(row.netInterest)}</td>
                    <td className={`py-2 px-3 ${row.appreciation > 0 ? t('text-blue-400','text-blue-700') : t('text-gray-600','text-gray-400')}`}>{row.appreciation > 0 ? `₹${formatINR(row.appreciation)}` : '-'}</td>
                    <td className={`py-2 px-3 font-semibold ${row.debentureValue > 0 ? t('text-white','text-gray-900') : t('text-gray-600','text-gray-400')}`}>{row.debentureValue > 0 ? `₹${formatINR(row.debentureValue)}` : '-'}</td>
                    <td className="py-2 px-3"><span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-500">{row.paymentStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Transaction Submission */}
        {activeView === 'transaction' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Bank Details */}
            <div>
              <h4 className={`text-sm font-bold mb-3 ${t('text-white','text-gray-900')}`}>Bank Account Details</h4>
              {bankAccounts.length > 0 ? (
                <>
                  <select value={selectedBank} onChange={e => setSelectedBank(e.target.value)}
                    className={`w-full px-3 py-2 rounded-xl text-sm mb-3 ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`}>
                    {bankAccounts.map((b: any) => (
                      <option key={b.id} value={b.id} className={t('bg-neutral-900','bg-white')}>{b.bank_name} - {b.account_number?.slice(-4)}</option>
                    ))}
                  </select>
                  {selectedBankDetails && (
                    <div className={`p-4 rounded-xl space-y-2 ${t('bg-white/[0.03] border border-white/[0.06]','bg-gray-50 border border-gray-200')}`}>
                      {[
                        { label: 'Account Holder', val: selectedBankDetails.account_holder_name },
                        { label: 'Account Number', val: selectedBankDetails.account_number },
                        { label: 'IFSC Code', val: selectedBankDetails.ifsc_code || selectedBankDetails.swift_iban_code },
                        { label: 'Bank Name', val: selectedBankDetails.bank_name },
                      ].map((f, i) => (
                        <div key={i} className="flex justify-between">
                          <span className={`text-xs ${t('text-gray-500','text-gray-600')}`}>{f.label}</span>
                          <span className={`text-xs font-medium ${t('text-white','text-gray-900')}`}>{f.val || '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className={`text-xs ${t('text-gray-500','text-gray-600')}`}>No bank accounts found. Please add one in KYC.</p>
              )}
            </div>

            {/* Transaction Form */}
            <div>
              <h4 className={`text-sm font-bold mb-3 ${t('text-white','text-gray-900')}`}>Transaction</h4>
              <div className="space-y-3">
                <div>
                  <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Capital Amount *</label>
                  <input value={txnForm.capitalAmount} onChange={e => setTxnForm(p => ({ ...p, capitalAmount: e.target.value }))} placeholder="10,00,000"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`} />
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Transaction Amount *</label>
                  <input value={txnForm.transactionAmount} onChange={e => setTxnForm(p => ({ ...p, transactionAmount: e.target.value }))} placeholder="Transaction Amount"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`} />
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Transaction ID (UTR/Ref)</label>
                  <input value={txnForm.transactionId} onChange={e => setTxnForm(p => ({ ...p, transactionId: e.target.value }))} placeholder="Transaction ID"
                    className={`w-full px-3 py-2.5 rounded-xl text-sm ${t('bg-white/[0.04] border border-white/[0.06] text-white','bg-gray-100 border border-gray-200 text-gray-900')}`} />
                </div>
                <div>
                  <label className={`text-xs font-medium mb-1 block ${t('text-gray-400','text-gray-600')}`}>Transaction Proof *</label>
                  <button onClick={handleUploadProof} disabled={uploading}
                    className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium border border-dashed transition-colors ${txnForm.proofUrl ? t('border-emerald-500/30 bg-emerald-500/10 text-emerald-400','border-emerald-300 bg-emerald-50 text-emerald-700') : t('border-white/[0.12] bg-white/[0.04] text-gray-400 hover:border-white/[0.2]','border-gray-300 bg-gray-50 text-gray-600 hover:border-gray-400')}`}>
                    {txnForm.proofUrl ? <><CheckCircle className="w-4 h-4" /> Proof Uploaded</> : <><Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload Proof'}</>}
                  </button>
                </div>
                <button onClick={handleSubmitTransaction} disabled={submitting}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-[1.01] disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #D0021B, #8B0000)' }}>
                  {submitting ? 'Submitting...' : 'Submit Transaction'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════
//  3. INVESTMENT DOCUMENTS (post-approval)
// ════════════════════════════════════════════════════════════════
interface InvestmentDocumentsProps {
  documents: any[]
  theme: string
  showToast: (msg: string, type?: string) => void
  clientId: string
}

export function InvestmentDocumentsSection({ documents, theme, showToast, clientId }: InvestmentDocumentsProps) {
  const isDark = theme === 'dark'
  const t = (dark: string, light: string) => isDark ? dark : light
  const [uploading, setUploading] = useState<string | null>(null)

  const DOCUMENT_TYPES = [
    { type: 'acknowledgement', label: 'Acknowledgement Letter', icon: FileText },
    { type: 'debenture_agreement', label: 'Debenture Agreement', icon: FileText },
    { type: 'allotment_letter', label: 'Allotment Letter', icon: FileText },
    { type: 'debenture_certificate', label: 'Debenture Certificate', icon: FileText },
    { type: 'tds', label: 'TDS Certificate', icon: FileText },
  ]

  const handleViewDoc = async (doc: any) => {
    const url = doc.file_url || doc.signed_copy_url
    if (url) {
      if (url.startsWith('http')) {
        window.open(url, '_blank')
      } else {
        try {
          const { getDownloadUrl } = await import('@/lib/supabase/storageService')
          const result = await getDownloadUrl(url, 'investment-documents')
          if (result?.success && result?.url) window.open(result.url, '_blank')
          else showToast('Document not available', 'info')
        } catch { showToast('Unable to load document', 'error') }
      }
    } else {
      showToast('Document not uploaded yet', 'info')
    }
  }

  const handleUploadSigned = async (docId: string) => {
    try {
      setUploading(docId)
      const { pickAndUploadFiles } = await import('@/lib/supabase/storageService')
      const results = await pickAndUploadFiles(`client/signed/${clientId}`, {
        accept: '.pdf,.jpg,.jpeg,.png',
        multiple: false,
      })
      if (results && results.length > 0 && results[0].success && results[0].file) {
        await uploadSignedDocument(docId, results[0].file.url || results[0].file.path || '')
        showToast('Signed document uploaded successfully!', 'success')
      }
    } catch { showToast('Upload failed', 'error') }
    setUploading(null)
  }

  if (documents.length === 0) {
    return (
      <Glass className="p-8 text-center" theme={theme}>
        <FileText className={`w-10 h-10 mx-auto mb-3 ${t('text-gray-600','text-gray-400')}`} />
        <p className={`text-sm font-medium ${t('text-gray-400','text-gray-600')}`}>No investment documents yet</p>
        <p className={`text-xs mt-1 ${t('text-gray-600','text-gray-500')}`}>Documents will appear here after your investment is approved by admin.</p>
      </Glass>
    )
  }

  return (
    <Glass className="overflow-hidden" theme={theme}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className={`border-b ${t('border-white/[0.06]','border-gray-200/50')}`}>
              {['Date', 'Title', 'Document', 'Signed Documents'].map(h => (
                <th key={h} className={`text-left text-xs font-semibold py-3 px-5 ${t('text-gray-500','text-gray-600')}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {documents.map((doc: any, i: number) => (
              <tr key={doc.id || i} className={`border-b ${t('border-white/[0.03] hover:bg-white/[0.02]','border-gray-100 hover:bg-gray-50')}`}>
                <td className={`py-3 px-5 text-xs ${t('text-gray-400','text-gray-600')}`}>{formatDate(doc.created_at)}</td>
                <td className={`py-3 px-5 text-xs font-medium ${t('text-white','text-gray-900')}`}>{doc.title}</td>
                <td className="py-3 px-5">
                  <div className="flex items-center gap-2">
                    {doc.file_url && (
                      <>
                        <button onClick={() => handleViewDoc(doc)} className="p-1.5 rounded-lg bg-brand-red/15 text-brand-red hover:bg-brand-red/25 transition-colors" title="View"><Eye className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleViewDoc(doc)} className="p-1.5 rounded-lg bg-brand-red/15 text-brand-red hover:bg-brand-red/25 transition-colors" title="Download"><Download className="w-3.5 h-3.5" /></button>
                      </>
                    )}
                    {!doc.file_url && <span className={`text-[10px] ${t('text-gray-600','text-gray-400')}`}>-</span>}
                  </div>
                </td>
                <td className="py-3 px-5">
                  {doc.document_type === 'debenture_agreement' || doc.document_type === 'debenture_certificate' ? (
                    doc.signed_copy_url ? (
                      <button onClick={() => handleViewDoc({ file_url: doc.signed_copy_url })} className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 transition-colors" title="View Signed"><CheckCircle className="w-3.5 h-3.5" /></button>
                    ) : (
                      <button onClick={() => handleUploadSigned(doc.id)} disabled={uploading === doc.id}
                        className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 transition-colors" title="Upload Signed Copy">
                        <Upload className="w-3.5 h-3.5" />
                      </button>
                    )
                  ) : (
                    <span className={`text-[10px] ${t('text-gray-600','text-gray-400')}`}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Glass>
  )
}
