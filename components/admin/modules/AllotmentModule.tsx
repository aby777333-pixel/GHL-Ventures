'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  FileText, CheckCircle2, Clock, History, Filter,
  Calendar, IndianRupee, Hash, ArrowUpRight, Layers,
  Eye, AlertTriangle, Search, Download, Send,
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
import { sendDocumentToClient } from '@/lib/admin/sendToClient'

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
  // 08-06-2026: rows are now aggregated PER INVESTOR for the selected window —
  // multiple investments by one investor are summed into a single row.
  investment_id: string      // representative investment id (= investment_ids[0])
  investment_ids: string[]   // every investment_applications.id aggregated here
  client_id: string
  investor_name: string
  email: string
  pan: string
  address: string            // from KYC (kyc_identity_details), for the letter
  total_investment: number   // SUM of this investor's investments in the window
  investment_count: number
  folio_number: string       // existing folio for this investor (one-time, reused)
  investment_date?: string   // representative (latest) investment date
  interest_rate?: string     // e.g. "1% per month" — for the allotment letter
  tenure?: string            // e.g. "3 years"
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
  // Enriched at read time (not stored on the allotments row) so the letter /
  // certificate can show full investor + terms detail.
  address?: string
  interest_rate?: string
  tenure?: string
  certificate_number?: string  // from debenture_certificates (DC tab), if issued
}

// ── HTML generators ──────────────────────────────────────────────
// Extracted so both "Generate PDF" (opens print preview) and "Send to
// Client" (uploads + logs to documents table) use the identical markup.

// 08-06-2026: Allotment Letter reformatted to the spec (To + address, subject,
// body and a single details table with Distinctive From/To, Amount Received,
// Fund Type, Rate of Interest and Tenure). No signature block — the document
// explicitly states it does not require a signature.
function buildAllotmentLetterHTML(row: AllotmentRecord): string {
  const inr = (n: number) => Number.isFinite(n) ? new Intl.NumberFormat('en-IN').format(n) : '0'
  const longDate = (d?: string) => {
    const dt = new Date(d || row.allotment_date || row.created_at)
    return isNaN(dt.getTime()) ? '-' : dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  }
  const perValue = Number(row.per_debenture_value) || 10
  const rate = row.interest_rate || '1% (per month)'
  const tenure = row.tenure || '3 years'
  const noDeb = Number(row.no_of_debentures) || 0
  const fund = row.fund_type || 'Alternate route to Invest in AIF via Debenture'
  return `<!doctype html><html><head><meta charset="utf-8"><title>Allotment Letter — ${row.folio_number || row.id}</title>
    <style>
      body { font-family: Georgia, 'Times New Roman', serif; padding: 44px 56px; color: #111; line-height: 1.6; font-size: 14px; }
      .top { display: flex; justify-content: space-between; align-items: flex-start; }
      .addr { font-size: 13px; color: #222; }
      .addr .name { font-weight: 700; }
      .date { font-size: 13px; color: #222; white-space: nowrap; }
      h2.subject { text-align: center; font-size: 15px; margin: 26px 0 18px; text-decoration: underline; }
      p { margin: 12px 0; }
      table.facts { width: 100%; border-collapse: collapse; margin: 16px 0 8px; font-size: 12.5px; }
      table.facts th, table.facts td { padding: 7px 9px; border: 1px solid #333; text-align: center; vertical-align: middle; }
      table.facts th { background: #f4efe9; font-weight: 700; }
      .note { font-size: 12px; color: #444; margin-top: 22px; }
      .gen { font-size: 11px; color: #777; text-align: center; margin-top: 28px; font-style: italic; }
      @media print { @page { margin: 1.5cm; } }
    </style>
  </head>
  <body>
    <div class="top">
      <div class="addr">
        To<br/>
        <span class="name">${row.investor_name || 'Investor'},</span><br/>
        ${(row.address || '').replace(/\n/g, '<br/>') || '&nbsp;'}
      </div>
      <div class="date">Date : ${longDate(row.allotment_date)}</div>
    </div>

    <h2 class="subject">Subject : Allotment of ${fund}</h2>

    <p>Dear ${row.investor_name || 'Investor'},</p>

    <p>This is with reference to your investment, I am directed by the Board of Directors to inform you
    that you have been allotted <strong>${inr(noDeb)}</strong> ${fund} of Rs.${perValue}/- each.
    The tenure of debentures is for ${tenure}.</p>

    <p>These debentures are allotted to you as per the resolution passed at the Board meeting held on
    ${longDate(row.allotment_date)} and as per the terms and conditions of Articles of Association of the company.</p>

    <p>Details of allotment are as follows:</p>

    <table class="facts">
      <tr>
        <th rowspan="2">Folio No</th>
        <th rowspan="2">No Of Debentures</th>
        <th colspan="2">Distinctive Nos.</th>
        <th rowspan="2">Amount Received in Rs</th>
        <th rowspan="2">Fund Type</th>
        <th rowspan="2">Rate Of Interest</th>
        <th rowspan="2">Tenure</th>
      </tr>
      <tr><th>From</th><th>To</th></tr>
      <tr>
        <td>${row.folio_number || '-'}</td>
        <td>${inr(noDeb)}</td>
        <td>${inr(Number(row.dis_from) || 0)}</td>
        <td>${inr(Number(row.dis_to) || 0)}</td>
        <td>${inr(Number(row.investment_amount) || 0)}</td>
        <td>${fund}</td>
        <td>${rate}</td>
        <td>${tenure}</td>
      </tr>
    </table>

    <p class="note">Duly signed and executed debenture certificate will be sent to you.</p>
    <p class="gen">* This is a computer generated document and does not require signature. *</p>
    <script>window.onload = () => window.print()</script>
  </body></html>`
}

// Indian-system number-to-words (whole rupees) so the certificate can show
// "(One Lakh Only)" / "(Ten Lakh Rupees Only)" style amounts like the spec.
function numToWordsIndian(num: number): string {
  const n = Math.floor(Math.abs(Number(num) || 0))
  if (n === 0) return 'Zero'
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
  const two = (x: number): string => {
    if (x < 20) return ones[x]
    return `${tens[Math.floor(x / 10)]}${x % 10 ? ' ' + ones[x % 10] : ''}`
  }
  const three = (x: number): string => {
    const h = Math.floor(x / 100), r = x % 100
    return `${h ? ones[h] + ' Hundred' + (r ? ' ' : '') : ''}${r ? two(r) : ''}`
  }
  const parts: string[] = []
  const crore = Math.floor(n / 10000000)
  const lakh = Math.floor((n % 10000000) / 100000)
  const thousand = Math.floor((n % 100000) / 1000)
  const hundred = n % 1000
  if (crore) parts.push(`${two(crore)} Crore`)
  if (lakh) parts.push(`${two(lakh)} Lakh`)
  if (thousand) parts.push(`${two(thousand)} Thousand`)
  if (hundred) parts.push(three(hundred))
  return parts.join(' ').trim()
}

// 08-06-2026: Debenture Certificate reformatted to the LANDMAXO PROPERTIES
// PRIVATE LIMITED certificate in the spec — nominal value, folio + certificate
// number, registered holder, no. of debentures, distinctive nos (both
// inclusive), total value (in words) and the director / authorised-signatory
// block.
function buildDebentureCertificateHTML(row: AllotmentRecord): string {
  const inr = (n: number) => Number.isFinite(n) ? new Intl.NumberFormat('en-IN').format(n) : '0'
  const face = Number(row.per_debenture_value) || 10
  const noDeb = Number(row.no_of_debentures) || 0
  const totalValue = Number(row.investment_amount) || (noDeb * face)
  const issue = new Date(row.allotment_date || row.created_at)
  const issueStr = isNaN(issue.getTime())
    ? '-'
    : issue.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  return `<!doctype html><html><head><meta charset="utf-8"><title>Debenture Certificate — ${row.folio_number || row.id}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 0; padding: 28px; }
      .cert { border: 10px solid #8B0000; border-radius: 6px; padding: 34px 40px; position: relative; max-width: 820px; margin: 0 auto; }
      .cert::before { content: ''; position: absolute; inset: 6px; border: 1px solid #c79a3a; pointer-events: none; }
      h1 { text-align: center; letter-spacing: 2px; font-size: 22px; margin: 0 0 14px; }
      .brand { text-align: center; font-size: 30px; font-weight: 800; letter-spacing: 4px; color: #111; margin: 6px 0 2px; }
      .brand .x { color: #8B0000; }
      .company { text-align: center; font-size: 18px; font-weight: 800; margin: 10px 0 2px; }
      .meta { text-align: center; font-size: 11px; color: #333; line-height: 1.5; }
      .body { font-size: 12.5px; line-height: 1.6; margin: 18px 0; text-align: justify; }
      .nominal { text-align: center; font-weight: 700; font-size: 13px; margin: 14px 0; line-height: 1.7; }
      .grid { font-size: 13px; line-height: 2.0; margin-top: 8px; }
      .grid .line { display: flex; justify-content: space-between; gap: 24px; }
      .grid .full { margin-top: 6px; }
      .lbl { color: #333; }
      .val { font-weight: 700; }
      .uline { border-bottom: 1px dotted #555; padding: 0 6px; }
      .given { margin: 22px 0 30px; font-size: 12.5px; }
      .sign { display: flex; justify-content: space-between; margin-top: 46px; font-size: 12px; }
      .sign div { width: 30%; }
      @media print { @page { margin: 1cm; } body { padding: 0; } }
    </style>
  </head>
  <body>
    <div class="cert">
      <h1>DEBENTURE CERTIFICATE</h1>
      <div class="brand">LANDMA<span class="x">X</span>O</div>
      <div class="company">LANDMAXO PROPERTIES PRIVATE LIMITED</div>
      <div class="meta">
        (CIN: U70109TN2022PTC151180) | (Incorporated under the Companies Act, 2013)<br/>
        Reg. Office: 2D, 2nd Floor, Queens Court, No. 6 Montieth Road, Egmore, Chennai - 600008, Tamil Nadu, India
      </div>

      <p class="body">This is to certify that the person(s) named in this Certificate is/are the Registered/Beneficial
      Holder(s) of the within mentioned debenture(s) bearing the distinctive number(s) herein specified in the
      above-named Company subject to the Memorandum and Articles of Association of the Company and that the amount
      endorsed herein has been paid up on each such share.</p>

      <div class="nominal">
        DEBENTURE EACH OF RUPEES ${face}/-(Nominal Value)<br/>
        AMOUNT PAID-UPPER DEBENTURE RUPEES ${face}/-[Rupees ${numToWordsIndian(face)} Only]
      </div>

      <div class="grid">
        <div class="line">
          <span><span class="lbl">Regd. Folio No.</span> <span class="val">${row.folio_number || '-'}</span></span>
          <span><span class="lbl">Certificate No.</span> <span class="val">${row.certificate_number || '-'}</span></span>
        </div>
        <div class="full"><span class="lbl">Name(s) of the Registered<br/>Debenture holder(s)</span>
          &nbsp; <span class="val uline">${row.investor_name || '-'}</span></div>
        <div class="full"><span class="lbl">No. of Debenture(s) held</span>
          &nbsp; <span class="val">${inr(noDeb)} (${numToWordsIndian(noDeb)} Only)</span></div>
        <div class="full"><span class="lbl">Distinctive No.(s)</span>
          &nbsp; <span class="val">${inr(Number(row.dis_from) || 0)} to ${inr(Number(row.dis_to) || 0)} (Both inclusive)</span></div>
        <div class="full"><span class="lbl">Total Value of debenture(s)</span>
          &nbsp; <span class="val">${inr(totalValue)} (${numToWordsIndian(totalValue)} Rupees Only)</span></div>
      </div>

      <p class="given">GIVEN under the common seal of the Company this ${issueStr}</p>

      <div class="sign">
        <div>Director</div>
        <div style="text-align:center">Director</div>
        <div style="text-align:right">Authorised Signatory</div>
      </div>
    </div>
    <script>window.onload = () => window.print()</script>
  </body></html>`
}

// ── Component ────────────────────────────────────────────────────
export default function AllotmentModule({ subTab, navigate, showToast }: AllotmentModuleProps) {
  const activeTab = (ALLOTMENT_TABS.some(t => t.id === subTab) ? subTab : 'create') as AllotmentTab

  // ── Filter state ───────────────────────────────────────────────
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [fundType, setFundType] = useState('')
  // Pending 30-04-2026 #4: default Per Debenture Value to ₹10 (face value
  // per the debenture agreement / certificate templates).
  const [perDebentureValue, setPerDebentureValue] = useState<number>(10)
  // Distinctive numbers continue from the last allotment of this fund. Captured
  // on fetch so the preview shows the real range (Dis. From = baseDisTo + 1).
  const [baseDisTo, setBaseDisTo] = useState<number>(0)

  // ── Data state ─────────────────────────────────────────────────
  const [investments, setInvestments] = useState<InvestmentRow[]>([])
  const [allotmentHistory, setAllotmentHistory] = useState<AllotmentRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  // Per-row in-flight state for Send-to-Client actions (prevents double-sends).
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set())
  // Rows for which the doc has already been delivered to the client's Documents tab.
  // Keys: `${row.id}` for allotment letters, `cert-${row.id}` for debenture certs.
  // Seeded from the documents table on history load so the Sent state survives reloads.
  const [sentIds, setSentIds] = useState<Set<string>>(new Set())

  // ── Folio number entries (client_id -> folio_number) ───────────
  const [folioEntries, setFolioEntries] = useState<Record<string, string>>({})

  // ── Debenture certificate numbers (Step 5) ─────────────────────
  // certEntries: editable input per allotment id. certMap: already-issued
  // certificate numbers (allotment_id -> certificate_number) loaded from
  // debenture_certificates — a one-time entry, locked + reused thereafter.
  const [certEntries, setCertEntries] = useState<Record<string, string>>({})
  const [certMap, setCertMap] = useState<Record<string, string>>({})
  const [generatingCertId, setGeneratingCertId] = useState<string | null>(null)

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
      const allotmentIds = rows.map((r: any) => r.id).filter(Boolean)
      let clientMap: Map<string, string> = new Map()
      let addrMap: Map<string, string> = new Map()
      if (clientIds.length > 0) {
        const [{ data: clients }, { data: kyc }] = await Promise.all([
          supabase.from('clients').select('id, full_name').in('id', clientIds),
          supabase.from('kyc_identity_details').select('client_id, address, courier_address, city, state, pincode').in('client_id', clientIds),
        ])
        clientMap = new Map((clients || []).map((c: any) => [c.id, c.full_name as string]))
        addrMap = new Map((kyc || []).map((k: any) => {
          const base = (k.address || k.courier_address || '').trim()
          const tail = [k.city, k.state, k.pincode].filter(Boolean).join(', ')
          return [k.client_id, [base, tail].filter(Boolean).join(', ')]
        }))
      }
      // Load already-issued debenture certificate numbers (one per allotment).
      let certByAllot: Record<string, string> = {}
      if (allotmentIds.length > 0) {
        const { data: certs } = await supabase
          .from('debenture_certificates')
          .select('allotment_id, certificate_number')
          .in('allotment_id', allotmentIds)
        for (const c of (certs || []) as any[]) {
          if (c.allotment_id && c.certificate_number) certByAllot[c.allotment_id] = c.certificate_number
        }
      }
      setCertMap(certByAllot)
      setCertEntries(prev => ({ ...certByAllot, ...prev }))
      const enrichedRows = rows.map((r: any) => ({
        ...r,
        investor_name: clientMap.get(r.client_id) || 'Unknown',
        address: addrMap.get(r.client_id) || '',
        certificate_number: certByAllot[r.id] || undefined,
      }))
      setAllotmentHistory(enrichedRows)

      // Seed sent-to-client state from documents table so the Sent indicator
      // persists across reloads. Match on file_name which is deterministic per row.
      if (enrichedRows.length > 0) {
        const letterNames = enrichedRows.map((r: any) => `allotment-letter-${r.folio_number || r.id}.html`)
        const certNames = enrichedRows.map((r: any) => `debenture-certificate-${r.folio_number || r.id}.html`)
        const { data: sentDocs } = await supabase
          .from('documents')
          .select('file_name')
          .in('file_name', [...letterNames, ...certNames])
        const sentFiles = new Set<string>((sentDocs || []).map((d: any) => d.file_name as string))
        const sent = new Set<string>()
        for (const r of enrichedRows) {
          const folio = r.folio_number || r.id
          if (sentFiles.has(`allotment-letter-${folio}.html`)) sent.add(r.id)
          if (sentFiles.has(`debenture-certificate-${folio}.html`)) sent.add(`cert-${r.id}`)
        }
        setSentIds(sent)
      } else {
        setSentIds(new Set())
      }
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
      // Candidate investments in the window for this fund. Investment date must
      // fall between from/to. (column is `investment_amount`; fund identifier is
      // `fund_vehicle`.)
      const { data: invData, error } = await supabase
        .from('investment_applications')
        .select('id, client_id, investment_amount, final_investment_amount, fund_vehicle, investment_date, folio_number, status, created_at, interest_rate, tenure_preference')
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

      // Allotment is "given monthly once": exclude investments already covered
      // by an existing allotment, and capture each investor's existing folio so
      // it's reused (one-time entry) instead of re-asked.
      const { data: priorAllot } = await supabase
        .from('allotments')
        .select('client_id, folio_number, investment_id, investment_ids, dis_to')
        .eq('fund_type', fundType)
      const allottedInvIds = new Set<string>()
      const clientFolioMap = new Map<string, string>()
      let maxDisTo = 0
      for (const a of (priorAllot || []) as any[]) {
        if (a.investment_id) allottedInvIds.add(a.investment_id)
        for (const iid of (a.investment_ids || [])) allottedInvIds.add(iid)
        if (a.client_id && a.folio_number && !clientFolioMap.has(a.client_id)) {
          clientFolioMap.set(a.client_id, a.folio_number)
        }
        if (Number(a.dis_to) > maxDisTo) maxDisTo = Number(a.dis_to)
      }
      setBaseDisTo(maxDisTo)

      const candidates = (invData as any[]).filter(inv => !allottedInvIds.has(inv.id))
      if (candidates.length === 0) {
        setInvestments([])
        showToast('All matching investments in this period have already been allotted.', 'info')
        setLoading(false)
        return
      }

      // Batch-fetch client details + KYC address (for the allotment letter).
      const clientIds = Array.from(new Set(candidates.map((r: any) => r.client_id).filter(Boolean)))
      const [{ data: clientRows }, { data: kycRows }] = await Promise.all([
        clientIds.length > 0
          ? supabase.from('clients').select('id, full_name, email, pan').in('id', clientIds)
          : Promise.resolve({ data: [] as any[] }),
        clientIds.length > 0
          ? supabase.from('kyc_identity_details').select('client_id, address, courier_address, city, state, pincode').in('client_id', clientIds)
          : Promise.resolve({ data: [] as any[] }),
      ])
      const clientMap = new Map((clientRows || []).map((c: any) => [c.id, c]))
      const kycMap = new Map((kycRows || []).map((k: any) => [k.client_id, k]))
      const buildAddress = (k: any): string => {
        if (!k) return ''
        const base = (k.address || k.courier_address || '').trim()
        const tail = [k.city, k.state, k.pincode].filter(Boolean).join(', ')
        return [base, tail].filter(Boolean).join(', ')
      }

      // Aggregate PER INVESTOR — sum the amounts of all their investments in the
      // window, collect every investment id, and keep the latest date + a
      // representative rate/tenure for the letter.
      const byClient = new Map<string, InvestmentRow>()
      for (const inv of candidates) {
        const client: any = clientMap.get(inv.client_id) || {}
        const amount = Number(inv.final_investment_amount) || Number(inv.investment_amount) || 0
        const rate = inv.interest_rate != null && inv.interest_rate !== ''
          ? `${inv.interest_rate}% (per month)` : ''
        const existing = byClient.get(inv.client_id)
        if (existing) {
          existing.total_investment += amount
          existing.investment_ids.push(inv.id)
          existing.investment_count += 1
          // keep the latest investment date + its rate/tenure
          if ((inv.investment_date || '') > (existing.investment_date || '')) {
            existing.investment_date = inv.investment_date
            if (rate) existing.interest_rate = rate
            if (inv.tenure_preference) existing.tenure = String(inv.tenure_preference)
          }
        } else {
          byClient.set(inv.client_id, {
            investment_id: inv.id,
            investment_ids: [inv.id],
            client_id: inv.client_id,
            investor_name: client.full_name || 'Unknown',
            email: client.email || '',
            pan: client.pan || '',
            address: buildAddress(kycMap.get(inv.client_id)),
            total_investment: amount,
            investment_count: 1,
            folio_number: clientFolioMap.get(inv.client_id) || inv.folio_number || '',
            investment_date: inv.investment_date,
            interest_rate: rate || undefined,
            tenure: inv.tenure_preference ? String(inv.tenure_preference) : undefined,
          })
        }
      }
      const result = Array.from(byClient.values())
      setInvestments(result)

      // Folio entries keyed by client_id (one folio per investor).
      const folios: Record<string, string> = {}
      for (const row of result) folios[row.client_id] = row.folio_number || ''
      setFolioEntries(folios)

      const totalInvCount = result.reduce((s, r) => s + r.investment_count, 0)
      showToast(`Found ${totalInvCount} investment(s) from ${result.length} investor(s)`, 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch investments', 'error')
    } finally {
      setLoading(false)
    }
  }

  // ── Build allotment preview ────────────────────────────────────
  const allotmentPreview = useMemo((): AllotmentPreview[] => {
    if (investments.length === 0 || perDebentureValue <= 0) return []

    // Distinctive numbers continue from the last allotment of this fund
    // (baseDisTo, captured on fetch). Confirm re-reads the DB max to stay safe
    // against concurrent allotments.
    let currentDisFrom = baseDisTo + 1
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
  }, [investments, perDebentureValue, baseDisTo])

  // ── Generate preview ───────────────────────────────────────────
  const handlePreview = () => {
    // Folio numbers are one per investor (keyed by client_id).
    const missingFolios = investments.filter(inv => !folioEntries[inv.client_id]?.trim())
    if (missingFolios.length > 0) {
      showToast(`Please enter folio numbers for all investors (${missingFolios.length} missing)`, 'warning')
      return
    }
    setPreviewMode(true)
    showToast('Preview generated. Review and confirm allotment.', 'info')
  }

  // ── Per-row allotment letter preview (spec: "after enter folio need to
  // preview the allotment for review"). Builds a provisional record from the
  // computed preview values + the entered folio and opens the letter.
  const handlePreviewLetter = (inv: InvestmentRow) => {
    const folio = folioEntries[inv.client_id]?.trim()
    if (!folio) {
      showToast('Enter a folio number for this investor first', 'warning')
      return
    }
    const p = allotmentPreview.find(r => r.client_id === inv.client_id)
    if (!p || p.no_of_debentures <= 0) {
      showToast('Nothing to preview for this investor', 'warning')
      return
    }
    const today = new Date().toISOString().split('T')[0]
    const record: AllotmentRecord = {
      id: inv.client_id,
      folio_number: folio,
      investor_name: inv.investor_name,
      client_id: inv.client_id,
      investment_amount: inv.total_investment,
      no_of_debentures: p.no_of_debentures,
      dis_from: p.dis_from,
      dis_to: p.dis_to,
      fund_type: fundType,
      per_debenture_value: perDebentureValue,
      allotment_date: today,
      from_date: fromDate,
      to_date: toDate,
      created_at: today,
      address: inv.address,
      interest_rate: inv.interest_rate,
      tenure: inv.tenure,
    }
    const html = buildAllotmentLetterHTML(record)
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
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
        const folioNumber = folioEntries[inv.client_id]?.trim() || ''

        // One allotment row per INVESTOR — aggregates this investor's
        // investments in the window. investment_ids records every covered
        // investment so the next run can exclude them; investment_id keeps the
        // representative (first) id for backward-compatible lineage.
        records.push({
          folio_number: folioNumber,
          client_id: inv.client_id,
          investment_id: inv.investment_id,
          investment_ids: inv.investment_ids,
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

      // Backfill the folio onto every aggregated investment_applications row for
      // the investor, so the one-time folio is reused on future allotments.
      for (const inv of investments) {
        const folio = folioEntries[inv.client_id]?.trim()
        if (folio) {
          await supabase
            .from('investment_applications')
            .update({ folio_number: folio })
            .in('id', inv.investment_ids)
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

  // ── Generate / preview a Debenture Certificate (Step 5) ────────
  // Certificate number is a one-time entry per allotment. On first generate we
  // persist a debenture_certificates row (so it's reused + locked next time),
  // then open the LANDMAXO certificate for that allotment.
  const handleGenerateDC = async (row: AllotmentRecord) => {
    const existing = certMap[row.id]
    const certNo = (existing || certEntries[row.id] || '').trim()
    if (!certNo) {
      showToast('Enter a certificate number for this allotment first', 'warning')
      return
    }
    if (!existing) {
      if (!isSupabaseConfigured()) { showToast('Supabase is not configured', 'error'); return }
      setGeneratingCertId(row.id)
      try {
        const { error } = await supabase.from('debenture_certificates').insert({
          allotment_id: row.id,
          client_id: row.client_id,
          certificate_number: certNo,
          folio_number: row.folio_number,
          no_of_debentures: row.no_of_debentures,
          dis_from: row.dis_from,
          dis_to: row.dis_to,
          face_value: row.per_debenture_value,
          total_value: row.investment_amount,
          issue_date: new Date().toISOString().split('T')[0],
          status: 'active',
        })
        if (error) { showToast(error.message || 'Failed to save certificate', 'error'); return }
        setCertMap(prev => ({ ...prev, [row.id]: certNo }))
        showToast('Certificate number saved', 'success')
      } finally {
        setGeneratingCertId(null)
      }
    }
    const html = buildDebentureCertificateHTML({ ...row, certificate_number: certNo })
    const w = window.open('', '_blank')
    if (w) { w.document.write(html); w.document.close() }
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
    { key: 'fund_type', label: 'Fund Type', sortable: true, width: 'w-44',
      render: (row) => (
        <span className="inline-block px-2 py-1 rounded-md text-[11px] font-medium leading-snug text-blue-300 bg-blue-500/10 border border-blue-500/20">
          {row.fund_type || 'N/A'}
        </span>
      ),
    },
    { key: 'allotment_date', label: 'Allotment Date', sortable: true, width: 'w-32',
      render: (row) => <span className="text-xs text-gray-400">{formatDate(row.allotment_date)}</span>
    },
    {
      key: 'pdf_action' as any,
      label: 'Allotment Letter',
      width: 'w-72',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const html = buildAllotmentLetterHTML(row)
              const w = window.open('', '_blank')
              if (w) { w.document.write(html); w.document.close() }
            }}
            className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors whitespace-nowrap leading-none"
          >
            <Download className="w-3 h-3" />
            Generate PDF
          </button>
          <button
            onClick={async () => {
              if (!row.client_id) {
                showToast('Missing client id for this allotment', 'error')
                return
              }
              if (sendingIds.has(row.id)) return
              setSendingIds(prev => new Set(prev).add(row.id))
              try {
                const html = buildAllotmentLetterHTML(row)
                const res = await sendDocumentToClient({
                  clientId: row.client_id,
                  html,
                  fileName: `allotment-letter-${row.folio_number || row.id}.html`,
                  title: `Allotment Letter — Folio ${row.folio_number || row.id}`,
                  category: 'agreement',
                })
                if (res.ok) {
                  setSentIds(prev => new Set(prev).add(row.id))
                  showToast('Allotment letter sent to client Documents', 'success')
                  // Open the rendered HTML directly for admin verification (avoids
                  // any browser data-URL navigation restrictions). This mirrors the
                  // Generate PDF flow.
                  const w = window.open('', '_blank')
                  if (w) { w.document.write(html); w.document.close() }
                } else {
                  showToast(res.error || 'Failed to send to client', 'error')
                }
              } finally {
                setSendingIds(prev => { const n = new Set(prev); n.delete(row.id); return n })
              }
            }}
            disabled={sendingIds.has(row.id)}
            className={`inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium text-white border transition-colors disabled:opacity-50 whitespace-nowrap leading-none ${
              sentIds.has(row.id)
                ? 'bg-emerald-500/30 border-emerald-400/50 hover:bg-emerald-500/40'
                : 'bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/30'
            }`}
            title={sentIds.has(row.id)
              ? "Already delivered to client's Documents tab — click to re-send"
              : "Send this allotment letter to the client's Documents tab"}
          >
            {sendingIds.has(row.id) ? (
              <><Send className="w-3 h-3" />Sending…</>
            ) : sentIds.has(row.id) ? (
              <><CheckCircle2 className="w-3 h-3" />Sent to Client</>
            ) : (
              <><Send className="w-3 h-3" />Send to Client</>
            )}
          </button>
        </div>
      ),
    },
  ]

  // ── Preview table columns ──────────────────────────────────────
  const previewColumns: Column<AllotmentPreview>[] = [
    { key: 'folio_number', label: 'Folio No.', width: 'w-32',
      render: (row) => (
        <span className="font-mono text-xs text-white">{folioEntries[row.client_id] || '-'}</span>
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
    { key: 'fund_type', label: 'Fund Type', width: 'w-44',
      render: () => (
        <span className="inline-block px-2 py-1 rounded-md text-[11px] font-medium leading-snug text-blue-300 bg-blue-500/10 border border-blue-500/20">
          {fundType || 'N/A'}
        </span>
      ),
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
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Investor Name</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500">Investment Date</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500">Investment Amount</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500">Per Debenture Value</th>
                      <th className="text-right py-3 px-3 text-xs font-medium text-gray-500">No. of Debentures</th>
                      <th className="text-left py-3 px-3 text-xs font-medium text-gray-500 w-44">Folio No.</th>
                      <th className="text-center py-3 px-3 text-xs font-medium text-gray-500">Allotment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investments.map((inv) => {
                      const noDeb = perDebentureValue > 0 ? Math.floor(inv.total_investment / perDebentureValue) : 0
                      return (
                      <tr key={inv.client_id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3">
                          <div>
                            <div className="text-white font-medium">{inv.investor_name}</div>
                            <div className="text-xs text-gray-500">
                              {inv.email}
                              {inv.investment_count > 1 && (
                                <span className="ml-1 text-amber-400/80">· {inv.investment_count} investments summed</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-xs text-gray-300">{inv.investment_date ? formatDate(inv.investment_date) : '-'}</td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-semibold">{formatINR(inv.total_investment)}</td>
                        <td className="py-3 px-3 text-right text-gray-300">{formatINR(perDebentureValue)}</td>
                        <td className="py-3 px-3 text-right font-mono text-white">{noDeb.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3">
                          <input
                            type="text"
                            value={folioEntries[inv.client_id] || ''}
                            onChange={(e) => setFolioEntries(prev => ({ ...prev, [inv.client_id]: e.target.value }))}
                            placeholder={inv.folio_number ? inv.folio_number : 'Enter folio no.'}
                            disabled={!!inv.folio_number}
                            title={inv.folio_number ? 'Folio already assigned to this investor (reused automatically)' : 'First-time folio entry for this investor'}
                            className="w-full px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs focus:outline-none focus:border-brand-red/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed placeholder-gray-600"
                          />
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handlePreviewLetter(inv)}
                            className="inline-flex items-center justify-center gap-1.5 h-7 px-3 rounded-lg text-[11px] font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors whitespace-nowrap"
                          >
                            <Eye className="w-3 h-3" /> Preview
                          </button>
                        </td>
                      </tr>
                      )
                    })}
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
              description="Debenture certificates can be generated once debentures are allotted. Create an allotment first."
              action={{ label: 'Create Allotment', onClick: () => handleTabClick('create') }}
            />
          ) : (
            <AdminDataTable
              columns={[
                { key: 'allotment_date', label: 'Allotment Date', sortable: true, width: 'w-32',
                  render: (row: AllotmentRecord) => <span className="text-xs text-gray-400">{formatDate(row.allotment_date)}</span> },
                { key: 'folio_number', label: 'Folio No.', sortable: true, width: 'w-24',
                  render: (row: AllotmentRecord) => <span className="font-mono text-xs text-white">{row.folio_number || '-'}</span> },
                { key: 'investor_name', label: 'Investor Name', sortable: true,
                  render: (row: AllotmentRecord) => <span className="text-sm text-white font-medium">{row.investor_name}</span> },
                { key: 'investment_amount', label: 'Total Investment', sortable: true, width: 'w-36',
                  render: (row: AllotmentRecord) => <span className="text-sm text-emerald-400 font-semibold">{formatINR(row.investment_amount)}</span> },
                { key: 'no_of_debentures', label: 'Total Debentures', sortable: true, width: 'w-32',
                  render: (row: AllotmentRecord) => <span className="font-mono text-sm text-white">{(row.no_of_debentures || 0).toLocaleString('en-IN')}</span> },
                { key: 'dis_from', label: 'Distinctive From', sortable: true, width: 'w-28',
                  render: (row: AllotmentRecord) => <span className="font-mono text-xs text-gray-300">{(row.dis_from || 0).toLocaleString('en-IN')}</span> },
                { key: 'dis_to', label: 'Distinctive To', sortable: true, width: 'w-28',
                  render: (row: AllotmentRecord) => <span className="font-mono text-xs text-gray-300">{(row.dis_to || 0).toLocaleString('en-IN')}</span> },
                { key: 'certificate_number', label: 'Certificate No.', sortable: false, width: 'w-40',
                  render: (row: AllotmentRecord) => {
                    const locked = !!certMap[row.id]
                    return (
                      <input
                        type="text"
                        value={locked ? certMap[row.id] : (certEntries[row.id] || '')}
                        onChange={(e) => setCertEntries(prev => ({ ...prev, [row.id]: e.target.value }))}
                        placeholder="Enter cert no."
                        disabled={locked}
                        title={locked ? 'Certificate number already issued (reused automatically)' : 'One-time certificate number entry'}
                        className="w-32 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-xs font-mono focus:outline-none focus:border-brand-red/50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed placeholder-gray-600"
                      />
                    )
                  },
                },
                {
                  key: 'certificate_action' as any,
                  label: 'Debenture Certificate',
                  sortable: false,
                  width: 'w-72',
                  render: (row: AllotmentRecord) => (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleGenerateDC(row)}
                        disabled={generatingCertId === row.id}
                        className="inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors disabled:opacity-50 whitespace-nowrap leading-none"
                      >
                        {generatingCertId === row.id ? <Send className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        Preview
                      </button>
                      <button
                        onClick={async () => {
                          if (!row.client_id) { showToast('Missing client id for this certificate', 'error'); return }
                          if (!certMap[row.id]) { showToast('Preview/generate the certificate first to assign its number', 'warning'); return }
                          const sendKey = `cert-${row.id}`
                          if (sendingIds.has(sendKey)) return
                          setSendingIds(prev => new Set(prev).add(sendKey))
                          try {
                            const html = buildDebentureCertificateHTML({ ...row, certificate_number: certMap[row.id] })
                            const res = await sendDocumentToClient({
                              clientId: row.client_id,
                              html,
                              fileName: `debenture-certificate-${row.folio_number || row.id}.html`,
                              title: `Debenture Certificate — Folio ${row.folio_number || row.id}`,
                              category: 'agreement',
                            })
                            if (res.ok) {
                              setSentIds(prev => new Set(prev).add(sendKey))
                              showToast('Debenture certificate sent to client Documents', 'success')
                            } else {
                              showToast(res.error || 'Failed to send to client', 'error')
                            }
                          } finally {
                            setSendingIds(prev => { const n = new Set(prev); n.delete(sendKey); return n })
                          }
                        }}
                        disabled={sendingIds.has(`cert-${row.id}`)}
                        className={`inline-flex items-center justify-center gap-1.5 h-7 px-2.5 rounded-lg text-[11px] font-medium text-white border transition-colors disabled:opacity-50 whitespace-nowrap leading-none ${
                          sentIds.has(`cert-${row.id}`)
                            ? 'bg-emerald-500/30 border-emerald-400/50 hover:bg-emerald-500/40'
                            : 'bg-emerald-500/20 border-emerald-500/30 hover:bg-emerald-500/30'
                        }`}
                        title={sentIds.has(`cert-${row.id}`)
                          ? "Already delivered to client's Documents tab — click to re-send"
                          : "Send this certificate to the client's Documents tab"}
                      >
                        {sendingIds.has(`cert-${row.id}`) ? (
                          <><Send className="w-3 h-3" />Sending…</>
                        ) : sentIds.has(`cert-${row.id}`) ? (
                          <><CheckCircle2 className="w-3 h-3" />Sent</>
                        ) : (
                          <><Send className="w-3 h-3" />Send to Client</>
                        )}
                      </button>
                    </div>
                  ),
                },
              ]}
              data={allotmentHistory}
              searchable
              searchPlaceholder="Search by investor, folio, certificate no..."
              searchKeys={['investor_name', 'folio_number', 'certificate_number']}
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
