'use client'

/* ===============================================================
   PARTNER COMMISSION - Channel Partner / Master Channel Partner

   Identity lives on clients.ghl_id:
     CPLGHL*** / CPGHL***  -> Channel Partner
     MCPGHL***             -> Master Channel Partner
   Attribution walks clients.referred_by -> parent ghl_id.

   Month filter keys off the investment CREDIT date
   (final_investment_date -> credit_given_at -> investment_date
   -> created_at). The slab rate still reads LIFETIME sales, so a
   partner does not drop a slab just because you filtered a month.
   =============================================================== */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { RefreshCw, Download, Users } from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminEmptyState from '../shared/AdminEmptyState'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import { supabase } from '@/lib/supabase/client'

type ShowToast = (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void

const CP_SLAB_BREAK = 50000000
const CP_RATE_LOW = 3
const CP_RATE_HIGH = 4
const MCP_RATE = 0.5
const TDS_RATE = 2
const EM = '\u2014'

const QUALIFYING = new Set(['approved', 'credited', 'completed'])

const fmtINR = (n: number) =>
  '\u20B9' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n || 0))

const fmtDate = (d: any) => {
  if (!d) return EM
  const x = new Date(d)
  if (isNaN(x.getTime())) return EM
  return x.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

const monthKeyOf = (d: any) => {
  if (!d) return ''
  const x = new Date(d)
  if (isNaN(x.getTime())) return ''
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0')
}

const monthLabel = (k: string) => {
  const parts = k.split('-')
  const dt = new Date(Number(parts[0]), Number(parts[1]) - 1, 1)
  return dt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
}

const creditDateOf = (a: any) =>
  a?.final_investment_date || a?.credit_given_at || a?.investment_date || a?.created_at || null

const amountOf = (a: any) => Number(a?.final_investment_amount) || Number(a?.investment_amount) || 0

const cpRateFor = (total: number) => (total >= CP_SLAB_BREAK ? CP_RATE_HIGH : CP_RATE_LOW)

const codeOf = (c: any) => String(c?.ghl_id || c?.referral_code || '').trim().toUpperCase()
const parentOf = (c: any) => String(c?.referred_by || '').trim().toUpperCase()
const isMcpCode = (code: string) => code.startsWith('MCPGHL')
const isCpCode = (code: string) => !isMcpCode(code) && (code.startsWith('CPLGHL') || code.startsWith('CPGHL'))

interface InvestorLine {
  key: string
  name: string
  ghlId: string
  date: any
  amount: number
  via: string
}

interface PartnerRow {
  id: string
  code: string
  name: string
  email: string
  phone: string
  ghlId: string
  accountNumber: string
  ifsc: string
  bankName: string
  branch: string
  investorCount: number
  cpCount: number
  totalSales: number
  lifetimeSales: number
  rate: number
  commission: number
  tds: number
  net: number
  children: { name: string; code: string; amount: number }[]
  investors: InvestorLine[]
}

const csvCell = (v: any) => {
  const s = v === null || v === undefined ? '' : String(v)
  return '"' + s.replace(/"/g, '""') + '"'
}

export default function PartnerCommissionTab({
  tier,
  showToast,
}: {
  tier: 'cp' | 'mcp'
  showToast: ShowToast
}) {
  const [rows, setRows] = useState<PartnerRow[]>([])
  const [monthOptions, setMonthOptions] = useState<string[]>([])
  const [monthKey, setMonthKey] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PartnerRow | null>(null)
  const [investorsOf, setInvestorsOf] = useState<PartnerRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sb: any = supabase
      const [clientsRes, appsRes, baRes, kbRes] = await Promise.all([
        sb.from('clients')
          .select('id, full_name, email, phone, ghl_id, referral_code, referred_by')
          .is('deleted_at', null),
        sb.from('investment_applications')
          .select('client_id, investment_amount, final_investment_amount, status, final_investment_date, credit_given_at, investment_date, created_at'),
        sb.from('bank_accounts').select('client_id, account_number, ifsc_code, bank_name, branch_name'),
        sb.from('kyc_bank_details').select('client_id, account_number, ifsc_code, bank_name, branch_name'),
      ])

      const clients: any[] = clientsRes?.data || []
      const apps: any[] = appsRes?.data || []

      // Bank: a real bank_accounts row wins, KYC capture is the fallback.
      const bankBy = new Map<string, any>()
      for (const b of (kbRes?.data || [])) if (b?.client_id) bankBy.set(b.client_id, b)
      for (const b of (baRes?.data || [])) if (b?.client_id) bankBy.set(b.client_id, b)

      const qual = apps.filter(a => QUALIFYING.has(String(a.status || '').toLowerCase()))

      const monthsSet = new Set<string>()
      for (const a of qual) {
        const k = monthKeyOf(creditDateOf(a))
        if (k) monthsSet.add(k)
      }
      const months = Array.from(monthsSet).sort().reverse()
      setMonthOptions(months)

      const inMonth = (a: any) => monthKey === 'all' || monthKeyOf(creditDateOf(a)) === monthKey

      const lifetimeBy = new Map<string, number>()
      const monthBy = new Map<string, number>()
      const linesBy = new Map<string, { date: any; amount: number }[]>()
      for (const a of qual) {
        const amt = amountOf(a)
        lifetimeBy.set(a.client_id, (lifetimeBy.get(a.client_id) || 0) + amt)
        if (!inMonth(a)) continue
        monthBy.set(a.client_id, (monthBy.get(a.client_id) || 0) + amt)
        const arr = linesBy.get(a.client_id) || []
        arr.push({ date: creditDateOf(a), amount: amt })
        linesBy.set(a.client_id, arr)
      }

      const byParent = new Map<string, any[]>()
      for (const c of clients) {
        const p = parentOf(c)
        if (!p) continue
        if (!byParent.has(p)) byParent.set(p, [])
        byParent.get(p)!.push(c)
      }

      const isPartnerClient = (c: any) => {
        const k = codeOf(c)
        return isCpCode(k) || isMcpCode(k)
      }
      const investorsUnder = (code: string) =>
        (byParent.get(code) || []).filter(c => !isPartnerClient(c))

      const linesFor = (c: any, via: string): InvestorLine[] =>
        (linesBy.get(c.id) || []).map((l, i) => ({
          key: c.id + '-' + i,
          name: c.full_name || EM,
          ghlId: c.ghl_id || EM,
          date: l.date,
          amount: l.amount,
          via,
        }))

      const partners = clients.filter(c => {
        const code = codeOf(c)
        return tier === 'mcp' ? isMcpCode(code) : isCpCode(code)
      })

      const out: PartnerRow[] = partners.map(p => {
        const code = codeOf(p)
        const bank = bankBy.get(p.id) || {}
        const base = {
          id: p.id,
          code,
          name: p.full_name || EM,
          email: p.email || EM,
          phone: p.phone || EM,
          ghlId: p.ghl_id || EM,
          accountNumber: bank.account_number || '',
          ifsc: bank.ifsc_code || '',
          bankName: bank.bank_name || '',
          branch: bank.branch_name || '',
        }

        if (tier === 'cp') {
          const invs = investorsUnder(code)
          const children: { name: string; code: string; amount: number }[] = []
          const investors: InvestorLine[] = []
          let totalSales = 0
          let lifetimeSales = 0
          for (const c of invs) {
            lifetimeSales += lifetimeBy.get(c.id) || 0
            const amt = monthBy.get(c.id) || 0
            if (!(amt > 0)) continue
            totalSales += amt
            children.push({ name: c.full_name || EM, code: c.ghl_id || EM, amount: amt })
            investors.push(...linesFor(c, 'Direct'))
          }
          const rate = cpRateFor(lifetimeSales)
          const commission = totalSales * rate / 100
          const tds = commission * TDS_RATE / 100
          return {
            ...base,
            investorCount: children.length,
            cpCount: 0,
            totalSales,
            lifetimeSales,
            rate,
            commission,
            tds,
            net: commission - tds,
            children,
            investors,
          }
        }

        // Master partner: own direct investors PLUS every CP beneath them.
        const cps = (byParent.get(code) || []).filter(c => isCpCode(codeOf(c)))
        const seen = new Set<string>()
        const children: { name: string; code: string; amount: number }[] = []
        const investors: InvestorLine[] = []
        let totalSales = 0
        let lifetimeSales = 0
        let investorCount = 0

        for (const c of investorsUnder(code)) {
          if (seen.has(c.id)) continue
          seen.add(c.id)
          lifetimeSales += lifetimeBy.get(c.id) || 0
          const amt = monthBy.get(c.id) || 0
          if (!(amt > 0)) continue
          totalSales += amt
          investorCount += 1
          children.push({ name: (c.full_name || EM) + ' (direct)', code: c.ghl_id || EM, amount: amt })
          investors.push(...linesFor(c, 'Direct'))
        }

        for (const cp of cps) {
          const cpCode = codeOf(cp)
          const cpName = cp.full_name || cpCode
          let amount = 0
          for (const c of investorsUnder(cpCode)) {
            if (seen.has(c.id)) continue
            seen.add(c.id)
            lifetimeSales += lifetimeBy.get(c.id) || 0
            const amt = monthBy.get(c.id) || 0
            if (!(amt > 0)) continue
            amount += amt
            investorCount += 1
            investors.push(...linesFor(c, cpName))
          }
          totalSales += amount
          children.push({ name: cpName, code: cpCode, amount })
        }

        const commission = totalSales * MCP_RATE / 100
        const tds = commission * TDS_RATE / 100
        return {
          ...base,
          investorCount,
          cpCount: cps.length,
          totalSales,
          lifetimeSales,
          rate: MCP_RATE,
          commission,
          tds,
          net: commission - tds,
          children,
          investors,
        }
      })

      out.sort((a, b) => b.totalSales - a.totalSales)
      setRows(out)
    } catch (e: any) {
      showToast('Failed to load partners: ' + (e?.message || 'unknown'), 'error')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [tier, showToast, monthKey])

  useEffect(() => { load() }, [load])

  const totals = useMemo(() => ({
    partners: rows.length,
    sales: rows.reduce((s, r) => s + r.totalSales, 0),
    commission: rows.reduce((s, r) => s + r.commission, 0),
    net: rows.reduce((s, r) => s + r.net, 0),
  }), [rows])

  const periodLabel = monthKey === 'all' ? 'All months' : monthLabel(monthKey)

  const handleExport = () => {
    if (rows.length === 0) { showToast('Nothing to export', 'warning'); return }
    const head = [
      'Name', 'GHL ID', 'Phone', 'Email',
      'Account Number', 'IFSC', 'Bank Name', 'Branch',
      'Period', 'Total Investment', 'Rate %', 'Commission',
      'TDS ' + TDS_RATE + '%', 'Net Amount',
    ]
    const body = rows.map(r => [
      r.name, r.code, r.phone, r.email,
      r.accountNumber, r.ifsc, r.bankName, r.branch,
      periodLabel,
      Math.round(r.totalSales), r.rate, Math.round(r.commission),
      Math.round(r.tds), Math.round(r.net),
    ])
    const csv = '\uFEFF' + [head, ...body].map(line => line.map(csvCell).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = (tier === 'cp' ? 'channel-partner' : 'master-channel-partner') +
      '-commission-' + (monthKey === 'all' ? 'all' : monthKey) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
    showToast('Exported ' + rows.length + ' rows', 'success')
  }

  const columns: Column<PartnerRow>[] = [
    {
      key: 'name', label: tier === 'cp' ? 'Channel Partner' : 'Master Partner', sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-white">{row.name}</p>
          <p className="text-[11px] text-gray-500 font-mono">{row.code}</p>
        </div>
      ),
    },
    {
      key: 'email', label: 'Contact',
      render: (row) => (
        <div>
          <p className="text-xs text-gray-300">{row.email}</p>
          <p className="text-[11px] text-gray-500">{row.phone}</p>
        </div>
      ),
    },
    {
      key: 'bankName', label: 'Bank',
      render: (row) => (
        row.accountNumber || row.bankName ? (
          <div>
            <p className="text-xs text-gray-300">{row.bankName || EM}</p>
            <p className="text-[11px] text-gray-500 font-mono">{row.accountNumber || EM}{row.ifsc ? ' \u00B7 ' + row.ifsc : ''}</p>
          </div>
        ) : <span className="text-[11px] text-gray-600 italic">Not on file</span>
      ),
    },
    tier === 'mcp'
      ? { key: 'cpCount', label: 'CPs', sortable: true, width: '70px',
          render: (row) => <span className="text-xs text-gray-300">{row.cpCount}</span> }
      : { key: 'investorCount', label: 'Investors', sortable: true, width: '90px',
          render: (row) => <span className="text-xs text-gray-300">{row.investorCount}</span> },
    {
      key: 'totalSales', label: 'Total Investment', sortable: true,
      render: (row) => <span className="text-sm text-white font-semibold">{fmtINR(row.totalSales)}</span>,
    },
    {
      key: 'rate', label: 'Rate', sortable: true, width: '80px',
      render: (row) => (
        <AdminBadge
          label={row.rate + '%'}
          variant={row.rate >= CP_RATE_HIGH ? 'success' : 'info'}
          size="sm"
        />
      ),
    },
    {
      key: 'commission', label: 'Commission', sortable: true,
      render: (row) => <span className="text-sm text-gray-200 font-semibold">{fmtINR(row.commission)}</span>,
    },
    {
      key: 'net', label: 'Net (after ' + TDS_RATE + '% TDS)', sortable: true,
      render: (row) => (
        <div>
          <p className="text-sm text-emerald-400 font-semibold">{fmtINR(row.net)}</p>
          <p className="text-[10px] text-gray-500">TDS {fmtINR(row.tds)}</p>
        </div>
      ),
    },
    {
      key: 'actions', label: '', width: '170px',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setInvestorsOf(row) }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            <Users className="w-3 h-3" /> Investors
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setSelected(row) }}
            className="px-2 py-1 rounded-lg text-[11px] font-semibold text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
          >
            Breakdown
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">
            {tier === 'cp' ? 'Channel Partner Referral' : 'Master Channel Partner Referral'}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {tier === 'cp'
              ? 'Investors brought in directly by a channel partner. The slab rate reads lifetime credited sales.'
              : 'Their own direct investors plus everything the channel partners beneath them brought in, at a flat 0.5%.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-medium text-gray-200 bg-white/[0.03] border border-white/[0.08] focus:outline-none focus:border-white/20"
          >
            <option value="all" className="bg-[#1a1a1a]">All months</option>
            {monthOptions.map(m => (
              <option key={m} value={m} className="bg-[#1a1a1a]">{monthLabel(m)}</option>
            ))}
          </select>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
            {tier === 'cp' ? 'Channel Partners' : 'Master Partners'}
          </p>
          <p className="text-xl font-bold text-white mt-1">{totals.partners}</p>
        </AdminGlass>
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Investment ({periodLabel})</p>
          <p className="text-xl font-bold text-white mt-1">{fmtINR(totals.sales)}</p>
        </AdminGlass>
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Commission</p>
          <p className="text-xl font-bold text-white mt-1">{fmtINR(totals.commission)}</p>
        </AdminGlass>
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Net Payable</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{fmtINR(totals.net)}</p>
        </AdminGlass>
      </div>

      <AdminGlass padding="p-4">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Commission slab</p>
        {tier === 'cp' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
              <span className="text-gray-400">Up to {fmtINR(CP_SLAB_BREAK)}</span>
              <span className="text-white font-semibold">{CP_RATE_LOW}%</span>
            </div>
            <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2">
              <span className="text-gray-400">{fmtINR(CP_SLAB_BREAK)} and above</span>
              <span className="text-white font-semibold">{CP_RATE_HIGH}%</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-2 text-xs">
            <span className="text-gray-400">Anything they or the channel partners beneath them bring in</span>
            <span className="text-white font-semibold">{MCP_RATE}%</span>
          </div>
        )}
        <p className="text-[10px] text-gray-500 mt-2">
          Only applications that are approved, credited or completed count. The month filter uses the
          investment credit date; the slab rate still reads lifetime sales. TDS is deducted at {TDS_RATE}%.
        </p>
      </AdminGlass>

      {loading ? (
        <AdminGlass padding="p-10"><div className="text-center text-sm text-gray-500">Loading partners\u2026</div></AdminGlass>
      ) : rows.length === 0 ? (
        <AdminGlass>
          <AdminEmptyState
            title={tier === 'cp' ? 'No channel partners yet' : 'No master partners yet'}
            description={'A client becomes one once their GHL ID is set to ' + (tier === 'cp' ? 'CPLGHL' : 'MCPGHL') + '\u2026 on their profile.'}
          />
        </AdminGlass>
      ) : (
        <AdminDataTable<PartnerRow>
          columns={columns}
          data={rows}
          searchKeys={['name', 'code', 'email', 'phone', 'ghlId']}
          searchPlaceholder="Search by partner name, code, email\u2026"
          title={(tier === 'cp' ? 'Channel Partners' : 'Master Channel Partners') + ' \u00B7 ' + periodLabel}
          searchable
          emptyMessage="No matching partners"
        />
      )}

      <AdminModal
        isOpen={!!investorsOf}
        onClose={() => setInvestorsOf(null)}
        title={investorsOf ? investorsOf.name + ' \u2014 investors' : 'Investors'}
        subtitle={investorsOf ? investorsOf.code + ' \u00B7 ' + periodLabel : ''}
        maxWidth="max-w-3xl"
        footer={<ModalButton onClick={() => setInvestorsOf(null)}>Close</ModalButton>}
      >
        {investorsOf && (
          <div className="space-y-3">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Investors</p>
                <p className="text-sm text-white font-semibold mt-1">{investorsOf.investors.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Invested</p>
                <p className="text-sm text-white font-semibold mt-1">{fmtINR(investorsOf.totalSales)}</p>
              </div>
            </div>
            {investorsOf.investors.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No credited investments in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 text-[10px] text-gray-500 uppercase tracking-wider">Investor</th>
                      <th className="text-left py-2 text-[10px] text-gray-500 uppercase tracking-wider">GHL ID</th>
                      <th className="text-left py-2 text-[10px] text-gray-500 uppercase tracking-wider">Credit Date</th>
                      {tier === 'mcp' && <th className="text-left py-2 text-[10px] text-gray-500 uppercase tracking-wider">Via</th>}
                      <th className="text-right py-2 text-[10px] text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {investorsOf.investors.map(iv => (
                      <tr key={iv.key} className="border-b border-white/[0.04]">
                        <td className="py-2 text-gray-200">{iv.name}</td>
                        <td className="py-2 text-gray-500 font-mono text-[11px]">{iv.ghlId}</td>
                        <td className="py-2 text-gray-400">{fmtDate(iv.date)}</td>
                        {tier === 'mcp' && <td className="py-2 text-gray-400">{iv.via}</td>}
                        <td className="py-2 text-right text-white font-semibold">{fmtINR(iv.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </AdminModal>

      <AdminModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? selected.name + ' \u2014 breakdown' : 'Breakdown'}
        subtitle={selected ? selected.code + ' \u00B7 ' + periodLabel : ''}
        maxWidth="max-w-2xl"
        footer={<ModalButton onClick={() => setSelected(null)}>Close</ModalButton>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Investment</p>
                <p className="text-sm text-white font-semibold mt-1">{fmtINR(selected.totalSales)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Rate</p>
                <p className="text-sm text-white font-semibold mt-1">{selected.rate}%</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">TDS {TDS_RATE}%</p>
                <p className="text-sm text-white font-semibold mt-1">{fmtINR(selected.tds)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Net</p>
                <p className="text-sm text-emerald-400 font-semibold mt-1">{fmtINR(selected.net)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/[0.06]">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Bank</p>
                <p className="text-xs text-gray-200 mt-1">{selected.bankName || EM}</p>
                <p className="text-[11px] text-gray-500">{selected.branch || EM}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Account</p>
                <p className="text-xs text-gray-200 mt-1 font-mono">{selected.accountNumber || EM}</p>
                <p className="text-[11px] text-gray-500 font-mono">{selected.ifsc || EM}</p>
              </div>
            </div>

            {selected.children.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                {tier === 'cp'
                  ? 'No credited investors against this code in this period.'
                  : 'Nothing attributed to this master partner in this period.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left py-2 text-[10px] text-gray-500 uppercase tracking-wider">
                        {tier === 'cp' ? 'Investor' : 'Source'}
                      </th>
                      <th className="text-left py-2 text-[10px] text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="text-right py-2 text-[10px] text-gray-500 uppercase tracking-wider">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.children.map((ch, i) => (
                      <tr key={ch.code + '-' + i} className="border-b border-white/[0.04]">
                        <td className="py-2 text-gray-200">{ch.name}</td>
                        <td className="py-2 text-gray-500 font-mono text-[11px]">{ch.code}</td>
                        <td className="py-2 text-right text-white font-semibold">{fmtINR(ch.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </AdminModal>
    </div>
  )
}
