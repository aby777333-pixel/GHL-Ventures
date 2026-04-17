'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  FileText, CheckCircle2, Clock, History, Filter,
  Calendar, IndianRupee, Hash, ArrowUpRight, Layers,
  Eye, AlertTriangle, Search, Download,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminKPICard from '../shared/AdminKPICard'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminEmptyState from '../shared/AdminEmptyState'
import { supabase as _supabase, isSupabaseConfigured } from '@/lib/supabase/client'
const supabase = _supabase as any
import { formatINR, formatDate } from '@/lib/admin/adminHooks'

// ── Sub-tabs ─────────────────────────────────────────────────────
const ALLOTMENT_TABS = [
  { id: 'create', label: 'Create Allotment', icon: FileText },
  { id: 'history', label: 'Allotment History', icon: History },
  { id: 'debenture-certificates', label: 'Debenture Certificates', icon: FileText },
] as const

type AllotmentTab = typeof ALLOTMENT_TABS[number]['id']

interface AllotmentModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// ── Types ────────────────────────────────────────────────────────
// Bug #8: One row per investment application so each investment gets its
// own allotment + distinctive-number range + PDF (no more client-level
// merging that produced a single allotment for multiple investments).
interface InvestmentRow {
  investment_id: string      // investment_applications.id (unique per row)
  client_id: string
  investor_name: string
  email: string
  pan: string
  total_investment: number
  investment_count: number
  folio_number: string
  investment_date?: string
}

interface AllotmentPreview extends InvestmentRow {
  no_of_debentures: number
  dis_from: number
  dis_to: number
}

interface AllotmentRecord {
  id: string
  folio_number: string
  investor_name: string
  client_id: string
  investment_amount: number
  no_of_debentures: number
  dis_from: number
  dis_to: number
  fund_type: string
  per_debenture_value: number
  allotment_date: string
  from_date: string
  to_date: string
  created_at: string
}

// ── Component ────────────────────────────────────────────────────
export default function AllotmentModule({ subTab, navigate, showToast }: AllotmentModuleProps) {
  const activeTab = (ALLOTMENT_TABS.some(t => t.id === subTab) ? subTab : 'create') as AllotmentTab

  // ── Filter state ───────────────────────────────────────────────
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [fundType, setFundType] = useState('')
  const [perDebentureValue, setPerDebentureValue] = useState<number>(100)

  // ── Data state ─────────────────────────────────────────────────
  const [investments, setInvestments] = useState<InvestmentRow[]>([])
  const [allotmentHistory, setAllotmentHistory] = useState<AllotmentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)

  // ── Folio number entries (client_id -> folio_number) ───────────
  const [folioEntries, setFolioEntries] = useState<Record<string, string>>({})

  // ── Fund types ─────────────────────────────────────────────────
  const [fundTypes, setFundTypes] = useState<string[]>([])

  // ── Load fund types on mount (from approved/credited investments) ──
  useEffect(() => {
    if (!isSupabaseConfigured()) return
    const loadFundTypes = async () => {
      const { data } = await supabase
        .from('investment_applications')
        .select('fund_vehicle')
        .in('status', ['approved', 'credited'])
      if (data) {
        const unique = Array.from(new Set(data.map((d: any) => d.fund_vehicle).filter(Boolean)))
        setFundTypes(unique as string[])
      }
    }
    loadFundTypes()
  }, [])

  // ── Load allotment history ─────────────────────────────────────
  const loadHistory = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setHistoryLoading(false)
      return
    }
    setHistoryLoading(true)
    try {
      const { data, error } = await supabase
        .from('allotments')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      // Bug #20: `investor_name` isn't a column on `allotments` — enrich at read time
      // by joining to `clients.full_name` via client_id.
      const rows = (data as any[]) || []
      const clientIds = Array.from(new Set(rows.map((r: any) => r.client_id).filter(Boolean)))
      let clientMap: Map<string, string> = new Map()
      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from('clients')
          .select('id, full_name')
          .in('id', clientIds)
        clientMap = new Map((clients || []).map((c: any) => [c.id, c.full_name as string]))
      }
      setAllotmentHistory(rows.map((r: any) => ({ ...r, investor_name: clientMap.get(r.client_id) || 'Unknown' })))
    } catch (err: any) {
      showToast(err.message || 'Failed to load allotment history', 'error')
    } finally {
      setHistoryLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'debenture-certificates') loadHistory()
  }, [activeTab, loadHistory])

  // ── Get max distinctive number from existing allotments ────────
  const getMaxDistinctiveNumber = async (selectedFundType: string): Promise<number> => {
    const { data } = await supabase
      .from('allotments')
      .select('dis_to')
      .eq('fund_type', selectedFundType)
      .order('dis_to', { ascending: false })
      .limit(1)
    return data && data.length > 0 ? data[0].dis_to : 0
  }

  // ── Fetch investments for allotment ────────────────────────────
  const handleFetchInvestments = async () => {
    if (!fromDate || !toDate) {
      showToast('Please select both From Date and To Date', 'warning')
      return
    }
    if (!fundType) {
      showToast('Please select a Fund Type', 'warning')
      return
    }
    if (perDebentureValue <= 0) {
      showToast('Per Debenture Value must be greater than 0', 'warning')
      return
    }
    if (!isSupabaseConfigured()) {
      showToast('Supabase is not configured', 'error')
      return
    }

    setLoading(true)
    setPreviewMode(false)
    try {
      // Fetch investment applications (bug #20: column is `investment_amount`, not `amount`,
      // and fund identifier column is `fund_vehicle`).
      const { data: invData, error } = await supabase
        .from('investment_applications')
        .select('id, client_id, investment_amount, final_investment_amount, fund_vehicle, investment_date, folio_number, status, created_at')
        .eq('fund_vehicle', fundType)
        .gte('investment_date', fromDate)
        .lte('investment_date', toDate)
        .in('status', ['approved', 'credited'])

      if (error) throw error

      if (!invData || invData.length === 0) {
        setInvestments([])
        showToast('No matching investments found for the selected criteria', 'info')
        setLoading(false)
        return
      }

      // Batch-fetch client details
      const clientIds = Array.from(new Set(invData.map((r: any) => r.client_id).filter(Boolean)))
      const { data: clientRows } = clientIds.length > 0
        ? await supabase.from('clients').select('id, full_name, email, pan').in('id', clientIds)
        : { data: [] }
      const clientMap = new Map((clientRows || []).map((c: any) => [c.id, c]))

      // Bug #8: One row per investment application (no grouping by client).
      const result: InvestmentRow[] = (invData as any[]).map((inv) => {
        const client: any = clientMap.get(inv.client_id) || {}
        return {
          investment_id: inv.id,
          client_id: inv.client_id,
          investor_name: client.full_name || 'Unknown',
          email: client.email || '',
          pan: client.pan || '',
          total_investment: Number(inv.final_investment_amount) || Number(inv.investment_amount) || 0,
          investment_count: 1,
          folio_number: inv.folio_number || '',
          investment_date: inv.investment_date,
        }
      })
      setInvestments(result)

      // Pre-fill folio entries keyed by investment_id (so each investment has
      // its own folio input)
      const folios: Record<string, string> = {}
      for (const row of result) {
        folios[row.investment_id] = row.folio_number || ''
      }
      setFolioEntries(folios)

      showToast(`Found ${result.length} investment(s) from ${new Set(result.map(r => r.client_id)).size} investor(s)`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch investments', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── Build allotment preview ────────────────────────────────────
  const allotmentPreview = useMemo((): AllotmentPreview[] => {
    if (investments.length === 0 || perDebentureValue <= 0) return []

    // We compute dis numbers here for preview; actual values come from DB on confirm
    let currentDisFrom = 1 // will be overridden on confirm with actual DB max
    const preview: AllotmentPreview[] = []

    for (const inv of investments) {
      const noOfDebentures = Math.floor(inv.total_investment / perDebentureValue)
      if (noOfDebentures <= 0) continue
      const disFrom = currentDisFrom
      const disTo = disFrom + noOfDebentures - 1

      preview.push({
        ...inv,
        no_of_debentures: noOfDebentures,
        dis_from: disFrom,
        dis_to: disTo,
      })
      currentDisFrom = disTo + 1
    }
    return preview
  }, [investments, perDebentureValue])

  // ── Generate preview ───────────────────────────────────────────
  const handlePreview = () => {
    // Bug #8: folio numbers are now per-investment
    const missingFolios = investments.filter(inv => !folioEntries[inv.investment_id]?.trim())
    if (missingFolios.length > 0) {
      showToast(`Please enter folio numbers for all investments (${missingFolios.length} missing)`, 'warning')
      return
    }
    setPreviewMode(true)
    showToast('Preview generated. Review and confirm allotment.', 'info')
  }

  // ── Confirm and save allotment ─────────────────────────────────
  const handleConfirmAllotment = async () => {
    if (!isSupabaseConfigured()) {
      showToast('Supabase is not configured', 'error')
      return
    }

    setSubmitting(true)
    try {
      // Get the current max distinctive number from the DB for this fund
      const maxDisTo = await getMaxDistinctiveNumber(fundType)
      let currentDisFrom = maxDisTo + 1

      const allotmentDate = new Date().toISOString().split('T')[0]
      // Bug #20: `allotments` table has no `investor_name` column — send only
      // columns that actually exist in the DB. Investor name is resolved via
      // client_id join at read time.
      const records: Record<string, any>[] = []

      for (const inv of investments) {
        const noOfDebentures = Math.floor(inv.total_investment / perDebentureValue)
        if (noOfDebentures <= 0) continue

        const disFrom = currentDisFrom
        const disTo = disFrom + noOfDebentures - 1
        const folioNumber = folioEntries[inv.investment_id]?.trim() || ''

        // Bug #8: one allotment row per investment_applications row. Links
        // via investment_id so the history + PDF can show full lineage.
        records.push({
          folio_number: folioNumber,
          client_id: inv.client_id,
          investment_id: inv.investment_id,
          investment_amount: inv.total_investment,
          per_debenture_value: perDebentureValue,
          no_of_debentures: noOfDebentures,
          dis_from: disFrom,
          dis_to: disTo,
          fund_type: fundType,
          allotment_date: allotmentDate,
          from_date: fromDate,
          to_date: toDate,
          status: 'active',
        })

        currentDisFrom = disTo + 1
      }

      if (records.length === 0) {
        showToast('No valid allotments to create', 'warning')
        setSubmitting(false)
        return
      }

      const { error } = await supabase.from('allotments').insert(records)
      if (error) throw error

      // Bug #8: Update folio on the specific investment application (not by
      // client/fund anymore — that would overwrite the wrong row when one
      // client has multiple investments in the same fund).
      for (const inv of investments) {
        const folio = folioEntries[inv.investment_id]?.trim()
        if (folio && !inv.folio_number) {
          await supabase
            .from('investment_applications')
            .update({ folio_number: folio })
            .eq('id', inv.investment_id)
        }
      }

      showToast(`Successfully created ${records.length} allotment(s)`, 'success')
      setConfirmModalOpen(false)
      setPreviewMode(false)
      setInvestments([])
      setFolioEntries({})
      setFromDate('')
      setToDate('')
    } catch (err: any) {
      showToast(err.message || 'Failed to create allotments', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // ── KPIs ───────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalAllotments = allotmentHistory.length
    const totalDebentures = allotmentHistory.reduce((s, a) => s + (a.no_of_debentures || 0), 0)
    const totalInvested = allotmentHistory.reduce((s, a) => s + (a.investment_amount || 0), 0)
    const uniqueInvestors = new Set(allotmentHistory.map(a => a.client_id)).size
    return { totalAllotments, totalDebentures, totalInvested, uniqueInvestors }
  }, [allotmentHistory])

  // ── Tab Navigation ─────────────────────────────────────────────
  const handleTabClick = (tabId: string) => {
    navigate(tabId === 'create' ? 'allotments' : `allotments/${tabId}`)
  }

  // ── History table columns ──────────────────────────────────────
  const historyColumns: Column<AllotmentRecord>[] = [
    { key: 'folio_number', label: 'Folio No.', sortable: true, width: 'w-24',
      render: (row) => <span className="font-mono text-xs text-white">{row.folio_number || '-'}</span>
    },
    { key: 'investor_name', label: 'Investor Name', sortable: true,
      render: (row) => <span className="text-sm text-white font-medium">{row.investor_name}</span>
    },
    { key: 'investment_amount', label: 'Investment (Rs.)', sortable: true, width: 'w-36',
      render: (row) => <span className="text-sm text-emerald-400 font-semibold">{formatINR(row.investment_amount)}</span>
    },
    { key: 'no_of_debentures', label: 'No. of Debentures', sortable: true, width: 'w-36',
      render: (row) => <span className="font-mono text-sm text-white">{row.no_of_debentures.toLocaleString('en-IN')}</span>
    },
    { key: 'dis_from', label: 'Dis. From', sortable: true, width: 'w-28',
      render: (row) => <span className="font-mono text-xs text-gray-300">{row.dis_from.toLocaleString('en-IN')}</span>
    },
    { key: 'dis_to', label: 'Dis. To', sortable: true, width: 'w-28',
      render: (row) => <span className="font-mono text-xs text-gray-300">{row.dis_to.toLocaleString('en-IN')}</span>
    },
    { key: 'fund_type', label: 'Fund Type', sortable: true, width: 'w-32',
      render: (row) => <AdminBadge label={row.fund_type || 'N/A'} variant="info" />
    },
    { key: 'allotment_date', label: 'Allotment Date', sortable: true, width: 'w-32',
      render: (row) => <span className="text-xs text-gray-400">{formatDate(row.allotment_date)}</span>
    },
    {
      key: 'pdf_action' as any,
      label: 'Allotment Letter',
      width: 'w-40',
      render: (row) => (
        <button
          onClick={() => {
            // Bug #22: Generate a printable per-investment allotment letter.
            // Opens a printable HTML document the admin can save as PDF.
            const amountWords = (n: number) => {
              if (!Number.isFinite(n)) return ''
              return new Intl.NumberFormat('en-IN').format(n)
            }
            const html = `<!doctype html><html><head><title>Allotment Letter — ${row.folio_number || row.id}</title>
              <style>
                body { font-family: Georgia, 'Times New Roman', serif; padding: 48px 56px; color: #111; line-height: 1.55; }
                .hdr { text-align: center; border-bottom: 2px solid #8B0000; padding-bottom: 12px; margin-bottom: 28px; }
                .hdr h1 { color: #8B0000; margin: 0; font-size: 26px; letter-spacing: 1px; }
                .hdr p  { color: #555; margin: 4px 0 0; font-size: 13px; }
                h2 { color: #8B0000; font-size: 18px; text-align: center; margin: 20px 0 16px; }
                .ref { display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-bottom: 20px; }
                p.body { font-size: 14px; margin: 12px 0; }
                table.facts { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
                table.facts td { padding: 8px 12px; border: 1px solid #e1e1e1; }
                table.facts td.label { background: #faf7f5; color: #555; width: 38%; font-weight: 600; }
                .sign { margin-top: 56px; display: flex; justify-content: space-between; font-size: 12px; }
                .sign .cell { border-top: 1px solid #999; padding-top: 8px; width: 40%; text-align: center; color: #555; }
                .footer { margin-top: 60px; font-size: 10px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 12px; }
                @media print { @page { margin: 1.6cm; } }
              </style>
            </head>
            <body>
              <div class="hdr">
                <h1>GHL INDIA VENTURES PRIVATE LIMITED</h1>
                <p>SEBI Registered Category II AIF · Alternative Investment Fund</p>
              </div>
              <div class="ref">
                <span>Folio: <strong>${row.folio_number || '-'}</strong></span>
                <span>Allotment Ref: <strong>AL-${String(row.id).slice(0, 8).toUpperCase()}</strong></span>
                <span>Date: <strong>${new Date(row.allotment_date || row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong></span>
              </div>
              <h2>Letter of Allotment</h2>
              <p class="body">Dear <strong>${row.investor_name || 'Investor'}</strong>,</p>
              <p class="body">With reference to your application for subscription to units/debentures of
              <strong>${row.fund_type || 'GHL India Ventures AIF'}</strong>, we are pleased to confirm that the Company
              has allotted the below-mentioned debentures to you in accordance with the SEBI (AIF) Regulations, 2012
              and the terms of the Private Placement Memorandum.</p>
              <table class="facts">
                <tr><td class="label">Investor Name</td><td>${row.investor_name || '-'}</td></tr>
                <tr><td class="label">Folio Number</td><td>${row.folio_number || '-'}</td></tr>
                <tr><td class="label">Fund / Scheme</td><td>${row.fund_type || '-'}</td></tr>
                <tr><td class="label">Investment Amount</td><td>₹ ${amountWords(Number(row.investment_amount) || 0)} /-</td></tr>
                <tr><td class="label">No. of Debentures Allotted</td><td>${(row.no_of_debentures || 0).toLocaleString('en-IN')}</td></tr>
                <tr><td class="label">Distinctive Numbers</td><td>${row.dis_from?.toLocaleString('en-IN') || '-'} to ${row.dis_to?.toLocaleString('en-IN') || '-'}</td></tr>
                <tr><td class="label">Allotment Date</td><td>${new Date(row.allotment_date || row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</td></tr>
              </table>
              <p class="body">Please preserve this letter safely. Your debenture certificate and investor portal
              access will be issued separately. For any clarification, please contact our Investor Relations team.</p>
              <p class="body" style="margin-top: 20px;">Thanking you,<br/>For <strong>GHL India Ventures Private Limited</strong>,</p>
              <div class="sign">
                <div class="cell">Authorised Signatory<br/><span style="font-size:10px">(Investment Manager)</span></div>
                <div class="cell">Company Seal</div>
              </div>
              <div class="footer">
                GHL India Ventures Private Limited · Registered Office: Chennai, Tamil Nadu, India ·
                SEBI Registration No. IN/AIF2/24/2425/1517 · This is a system-generated document.
              </div>
              <script>window.onload = () => window.print()</script>
            </body></html>`
            const w = window.open('', '_blank')
            if (w) { w.document.write(html); w.document.close() }
          }}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Generate PDF
        </button>
      ),
    },
  ]

  // ── Preview table columns ──────────────────────────────────────
  const previewColumns: Column<AllotmentPreview>[] = [
    { key: 'folio_number', label: 'Folio No.', width: 'w-32',
      render: (row) => (
        <span className="font-mono text-xs text-white">{folioEntries[row.investment_id] || '-'}</span>
      ),
    },
    { key: 'investor_name', label: 'Investor Name',
      render: (row) => <span className="text-sm text-white font-medium">{row.investor_name}</span>
    },
    { key: 'total_investment', label: 'Investment (Rs.)', width: 'w-36',
      render: (row) => <span className="text-sm text-emerald-400 font-semibold">{formatINR(row.total_investment)}</span>
    },
    { key: 'no_of_debentures', label: 'No. of Debentures', width: 'w-36',
      render: (row) => <span className="font-mono text-sm text-white">{row.no_of_debentures.toLocaleString('en-IN')}</span>
    },
    { key: 'dis_from', label: 'Dis. From', width: 'w-28',
      render: (row) => <span className="font-mono text-xs text-gray-300">{row.dis_from.toLocaleString('en-IN')}</span>
    },
    { key: 'dis_to', label: 'Dis. To', width: 'w-28',
      render: (row) => <span className="font-mono text-xs text-gray-300">{row.dis_to.toLocaleString('en-IN')}</span>
    },
    { key: 'fund_type', label: 'Fund Type', width: 'w-32',
      render: () => <AdminBadge label={fundType || 'N/A'} variant="info" />
    },
  ]

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 admin-section-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Allotment Management</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage monthly debenture allotments</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Total Allotments" value={kpis.totalAllotments} icon={Layers} color="#3B82F6" delay={0} />
        <AdminKPICard title="Total Debentures" value={kpis.totalDebentures.toLocaleString('en-IN')} icon={Hash} color="#10B981" delay={50} />
        <AdminKPICard title="Total Invested" value={formatINR(kpis.totalInvested)} icon={IndianRupee} color="#F59E0B" delay={100} />
        <AdminKPICard title="Unique Investors" value={kpis.uniqueInvestors} icon={FileText} color="#8B5CF6" delay={150} />
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-white/[0.03] rounded-xl border border-white/[0.06] w-fit">
        {ALLOTMENT_TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium transition-all duration-300 ${
                isActive ? 'bg-brand-red/20 text-white border border-brand-red/30' : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Create Allotment Tab ──────────────────────────────────── */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {/* Filter Form */}
          <AdminGlass>
            <div className="flex items-center gap-2 mb-5">
              <Filter className="w-4 h-4 text-brand-red" />
              <h2 className="text-sm font-semibold text-white">Filter Investments</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">From Date</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand-red/50 transition-colors [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">To Date</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand-red/50 transition-colors [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Fund Type</label>
                <select
                  value={fundType}
                  onChange={(e) => setFundType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand-red/50 transition-colors appearance-none"
                >
                  <option value="" className="bg-zinc-900">Select Fund Type</option>
                  {fundTypes.map(ft => (
                    <option key={ft} value={ft} className="bg-zinc-900">{ft}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Per Debenture Value (Rs.)</label>
                <input
                  type="number"
                  value={perDebentureValue}
                  onChange={(e) => setPerDebentureValue(Number(e.target.value))}
                  min={1}
                  className="w-full px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white text-sm focus:outline-none focus:border-brand-red/50 transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-end mt-5">
              <button
                onClick={handleFetchInvestments}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Fetch Investments
              </button>
            </div>
          </AdminGlass>

          {/* Investment Results / Folio Entry */}
          {investments.length > 0 && !previewMode && (
            <AdminGlass>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-red" />
                  <h2 className="text-sm font-semibold text-white">
                    Matching Investments ({investments.length} investor{investments.length !== 1 ? 's' : ''})
                  </h2>
                </div>
                <button
                  onClick={handlePreview}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Generate Preview
                </button>
              </div>

              <div className="overflow-x-auto admin-scroll">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Investor</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">PAN</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500">Total Investment</th>
                      <th className="text-center py-3 px-3 text-xs font-medium text-gray-500">Investment Ref</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 w-48">Folio Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((inv) => (
                      <tr key={inv.investment_id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3">
                          <div>
                            <div className="text-white font-medium">{inv.investor_name}</div>
                            <div className="text-xs text-gray-500">{inv.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-xs text-gray-300">{inv.pan || '-'}</td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-semibold">{formatINR(inv.total_investment)}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="text-[10px] text-gray-500 font-mono">{inv.investment_id.slice(0, 8).toUpperCase()}</span>
                        </td>
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={folioEntries[inv.investment_id] || ''}
                            onChange={(e) => setFolioEntries(prev => ({ ...prev, [inv.investment_id]: e.target.value }))}
                            placeholder={inv.folio_number ? inv.folio_number : 'Enter folio no.'}
                            disabled={!!inv.folio_number}
                            className="w-full px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-brand-red/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed placeholder-gray-600"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AdminGlass>
          )}

          {/* Preview Table */}
          {previewMode && allotmentPreview.length > 0 && (
            <AdminGlass>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">Allotment Preview</h2>
                  <AdminBadge label="Review before confirming" variant="warning" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPreviewMode(false)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-gray-400 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
                  >
                    Back to Edit
                  </button>
                  <button
                    onClick={() => setConfirmModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium text-white bg-emerald-500/20 border border-emerald-500/30 hover:bg-emerald-500/30 transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Confirm Allotment
                  </button>
                </div>
              </div>

              {/* Summary row */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-xs text-gray-500">Total Investment</div>
                  <div className="text-lg font-bold text-emerald-400 mt-0.5">
                    {formatINR(allotmentPreview.reduce((s, p) => s + p.total_investment, 0))}
                  </div>
                </div>
                <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-xs text-gray-500">Total Debentures</div>
                  <div className="text-lg font-bold text-white mt-0.5">
                    {allotmentPreview.reduce((s, p) => s + p.no_of_debentures, 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <div className="text-xs text-gray-500">Distinctive Range</div>
                  <div className="text-lg font-bold text-white mt-0.5 font-mono">
                    {allotmentPreview.length > 0
                      ? `${allotmentPreview[0].dis_from.toLocaleString('en-IN')} - ${allotmentPreview[allotmentPreview.length - 1].dis_to.toLocaleString('en-IN')}`
                      : '-'}
                  </div>
                </div>
              </div>

              <AdminDataTable
                columns={previewColumns}
                data={allotmentPreview}
                searchable={false}
                pageSize={20}
                emptyMessage="No allotments to preview"
              />
            </AdminGlass>
          )}

          {/* Empty state when no investments loaded */}
          {!loading && investments.length === 0 && (
            <AdminGlass hover={false}>
              <AdminEmptyState
                icon={Calendar}
                title="No investments loaded"
                description="Use the filter above to fetch investments for the selected date range and fund type."
              />
            </AdminGlass>
          )}
        </div>
      )}

      {/* ── Allotment History Tab ─────────────────────────────────── */}
      {activeTab === 'history' && (
        <AdminGlass>
          {historyLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-6 h-6 border-2 border-white/20 border-t-brand-red rounded-full animate-spin" />
            </div>
          ) : allotmentHistory.length === 0 ? (
            <AdminEmptyState
              icon={History}
              title="No allotment history"
              description="Allotments will appear here once created via the Create Allotment tab."
              action={{ label: 'Create Allotment', onClick: () => handleTabClick('create') }}
            />
          ) : (
            <AdminDataTable
              columns={historyColumns}
              data={allotmentHistory}
              searchable
              searchPlaceholder="Search by investor, folio, fund type..."
              searchKeys={['investor_name', 'folio_number', 'fund_type']}
              pageSize={15}
              exportable
              title="Allotment History"
              emptyMessage="No allotments found"
            />
          )}
        </AdminGlass>
      )}

      {/* ── Debenture Certificates Tab (bug #21) ──────────────────── */}
      {activeTab === 'debenture-certificates' && (
        <AdminGlass>
          {historyLoading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-6 h-6 border-2 border-white/20 border-t-brand-red rounded-full animate-spin" />
            </div>
          ) : allotmentHistory.length === 0 ? (
            <AdminEmptyState
              icon={FileText}
              title="No debenture certificates"
              description="Certificates are generated automatically once debentures are allotted."
              action={{ label: 'Create Allotment', onClick: () => handleTabClick('create') }}
            />
          ) : (
            <AdminDataTable
              columns={[
                ...historyColumns,
                {
                  key: 'certificate_action' as any,
                  label: 'Certificate',
                  width: 'w-36',
                  render: (row: AllotmentRecord) => (
                    <button
                      onClick={() => {
                        // Open a printable certificate view in a new tab using allotment details
                        const html = `<!doctype html><html><head><title>Debenture Certificate — ${row.folio_number || row.id}</title>
                          <style>body{font-family:Georgia,serif;padding:40px;color:#111}
                          h1{text-align:center;color:#8B0000}
                          .row{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee}
                          .label{color:#555} .val{font-weight:600}</style></head>
                          <body><h1>Debenture Certificate</h1>
                          <p style="text-align:center;color:#666">GHL India Ventures Private Limited</p>
                          <div style="margin-top:32px">
                          <div class="row"><span class="label">Folio No.</span><span class="val">${row.folio_number || '-'}</span></div>
                          <div class="row"><span class="label">Investor</span><span class="val">${row.investor_name || '-'}</span></div>
                          <div class="row"><span class="label">Fund Type</span><span class="val">${row.fund_type || '-'}</span></div>
                          <div class="row"><span class="label">Investment Amount</span><span class="val">₹ ${(row.investment_amount || 0).toLocaleString('en-IN')}</span></div>
                          <div class="row"><span class="label">No. of Debentures</span><span class="val">${(row.no_of_debentures || 0).toLocaleString('en-IN')}</span></div>
                          <div class="row"><span class="label">Distinctive Nos.</span><span class="val">${row.dis_from} – ${row.dis_to}</span></div>
                          <div class="row"><span class="label">Allotment Date</span><span class="val">${new Date(row.allotment_date || row.created_at).toLocaleDateString('en-IN')}</span></div>
                          </div>
                          <p style="margin-top:48px;text-align:right">Authorised Signatory</p>
                          <script>window.onload=()=>window.print()</script>
                          </body></html>`
                        const w = window.open('', '_blank')
                        if (w) { w.document.write(html); w.document.close() }
                      }}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      View / Print
                    </button>
                  ),
                },
              ]}
              data={allotmentHistory}
              searchable
              searchPlaceholder="Search by investor, folio, fund type..."
              searchKeys={['investor_name', 'folio_number', 'fund_type']}
              pageSize={15}
              exportable
              title="Debenture Certificates"
              emptyMessage="No certificates available"
            />
          )}
        </AdminGlass>
      )}

      {/* ── Confirm Allotment Modal ───────────────────────────────── */}
      <AdminModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Confirm Allotment"
        subtitle={`${allotmentPreview.length} investor(s) - ${fundType} - ${formatDate(fromDate)} to ${formatDate(toDate)}`}
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </ModalButton>
            <ModalButton variant="primary" onClick={handleConfirmAllotment} disabled={submitting}>
              {submitting ? 'Processing...' : 'Confirm & Create'}
            </ModalButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-amber-300 font-medium">Please review carefully</p>
              <p className="text-xs text-amber-400/70 mt-1">
                This action will create allotment records for {allotmentPreview.length} investor(s).
                Distinctive numbers will be assigned sequentially based on existing allotments in the database.
                This action cannot be undone easily.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Fund Type</span>
              <span className="text-white font-medium">{fundType}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Period</span>
              <span className="text-white font-medium">{formatDate(fromDate)} - {formatDate(toDate)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Per Debenture Value</span>
              <span className="text-white font-medium">{formatINR(perDebentureValue)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Investors</span>
              <span className="text-white font-medium">{allotmentPreview.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Investment</span>
              <span className="text-emerald-400 font-semibold">{formatINR(allotmentPreview.reduce((s, p) => s + p.total_investment, 0))}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Total Debentures</span>
              <span className="text-white font-semibold">{allotmentPreview.reduce((s, p) => s + p.no_of_debentures, 0).toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </AdminModal>
    </div>
  )
}
