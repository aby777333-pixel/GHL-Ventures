'use client'

/* ═══════════════════════════════════════════════════════════════
   PARTNER COMMISSION — Channel Partner / Master Channel Partner

   Identity lives on clients.ghl_id:
     CPLGHL***  → Channel Partner
     MCPGHL***  → Master Channel Partner

   Attribution walks clients.referred_by:
     investor.referred_by  = CP code
     CP.referred_by        = MCP code

   Slabs (2026-10): a CP's rate follows their CUMULATIVE credited
   sales — under Rs 5 Cr pays 3%, Rs 5 Cr and above pays 4%. A master
   partner earns a flat 0.5% on everything the CPs beneath them bring,
   plus any investor they brought in directly.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Users, RefreshCw } from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminEmptyState from '../shared/AdminEmptyState'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import { supabase } from '@/lib/supabase/client'

type ShowToast = (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void

const CP_SLAB_BREAK = 50000000          // Rs 5,00,00,000
const CP_RATE_LOW = 3                   // below the break
const CP_RATE_HIGH = 4                  // at or above the break
const MCP_RATE = 0.5

const QUALIFYING = new Set(['approved', 'credited', 'completed'])

const fmtINR = (n: number) =>
  '\u20B9' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(Math.round(n || 0))

const cpRateFor = (total: number) => (total >= CP_SLAB_BREAK ? CP_RATE_HIGH : CP_RATE_LOW)

const codeOf = (c: any) => String(c?.ghl_id || c?.referral_code || '').trim().toUpperCase()
const parentOf = (c: any) => String(c?.referred_by || '').trim().toUpperCase()
const isMcpCode = (code: string) => code.startsWith('MCPGHL')
const isCpCode = (code: string) => !isMcpCode(code) && (code.startsWith('CPLGHL') || code.startsWith('CPGHL'))

interface PartnerRow {
  id: string
  code: string
  name: string
  email: string
  phone: string
  ghlId: string
  investorCount: number
  cpCount: number
  totalSales: number
  rate: number
  commission: number
  children: { name: string; code: string; amount: number }[]
}

export default function PartnerCommissionTab({
  tier,
  showToast,
}: {
  tier: 'cp' | 'mcp'
  showToast: ShowToast
}) {
  const [rows, setRows] = useState<PartnerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<PartnerRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const sb: any = supabase
      const [clientsRes, appsRes] = await Promise.all([
        sb.from('clients')
          .select('id, full_name, email, phone, ghl_id, referral_code, referred_by')
          .is('deleted_at', null),
        sb.from('investment_applications')
          .select('client_id, investment_amount, final_investment_amount, status'),
      ])

      const clients: any[] = clientsRes?.data || []
      const apps: any[] = appsRes?.data || []

      // Credited money per investor.
      const salesByClient = new Map<string, number>()
      for (const a of apps) {
        if (!QUALIFYING.has(String(a.status || '').toLowerCase())) continue
        const amt = Number(a.final_investment_amount) || Number(a.investment_amount) || 0
        salesByClient.set(a.client_id, (salesByClient.get(a.client_id) || 0) + amt)
      }

      // Everyone a given code brought in, keyed by that code.
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
      // Direct investors under a code. A sub-partner is not a sale.
      const investorsUnder = (code: string) =>
        (byParent.get(code) || []).filter(c => !isPartnerClient(c))

      const partners = clients.filter(c => {
        const code = codeOf(c)
        return tier === 'mcp' ? isMcpCode(code) : isCpCode(code)
      })

      const out: PartnerRow[] = partners.map(p => {
        const code = codeOf(p)
        const base = {
          id: p.id,
          code,
          name: p.full_name || '\u2014',
          email: p.email || '\u2014',
          phone: p.phone || '\u2014',
          ghlId: p.ghl_id || '\u2014',
        }

        if (tier === 'cp') {
          const children = investorsUnder(code).map(c => ({
            name: c.full_name || '\u2014',
            code: c.ghl_id || '\u2014',
            amount: salesByClient.get(c.id) || 0,
          })).filter(c => c.amount > 0)
          const totalSales = children.reduce((s, c) => s + c.amount, 0)
          const rate = cpRateFor(totalSales)
          return {
            ...base,
            investorCount: children.length,
            cpCount: 0,
            totalSales,
            rate,
            commission: totalSales * rate / 100,
            children,
          }
        }

        // Master partner: their own direct investors PLUS everything the
        // CPs beneath them brought in. Each investor counts once only.
        const cps = (byParent.get(code) || []).filter(c => isCpCode(codeOf(c)))
        const seen = new Set<string>()
        const children: { name: string; code: string; amount: number }[] = []
        let totalSales = 0
        let investorCount = 0

        for (const c of investorsUnder(code)) {
          if (seen.has(c.id)) continue
          seen.add(c.id)
          const amount = salesByClient.get(c.id) || 0
          if (amount <= 0) continue
          totalSales += amount
          investorCount += 1
          children.push({
            name: (c.full_name || '\u2014') + ' (direct)',
            code: c.ghl_id || '\u2014',
            amount,
          })
        }

        for (const cp of cps) {
          const cpCode = codeOf(cp)
          let amount = 0
          for (const c of investorsUnder(cpCode)) {
            if (seen.has(c.id)) continue
            seen.add(c.id)
            const a = salesByClient.get(c.id) || 0
            if (a <= 0) continue
            amount += a
            investorCount += 1
          }
          totalSales += amount
          children.push({ name: cp.full_name || '\u2014', code: cpCode, amount })
        }

        return {
          ...base,
          investorCount,
          cpCount: cps.length,
          totalSales,
          rate: MCP_RATE,
          commission: totalSales * MCP_RATE / 100,
          children,
        }
      })

      out.sort((a, b) => b.totalSales - a.totalSales)
      setRows(out)
    } catch (e: any) {
      showToast(`Failed to load partners: ${e?.message || 'unknown'}`, 'error')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [tier, showToast])

  useEffect(() => { load() }, [load])

  const totals = useMemo(() => ({
    partners: rows.length,
    sales: rows.reduce((s, r) => s + r.totalSales, 0),
    commission: rows.reduce((s, r) => s + r.commission, 0),
  }), [rows])

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
    tier === 'mcp'
      ? { key: 'cpCount', label: 'CPs', sortable: true, width: '70px',
          render: (row) => <span className="text-xs text-gray-300">{row.cpCount}</span> }
      : { key: 'investorCount', label: 'Investors', sortable: true, width: '90px',
          render: (row) => <span className="text-xs text-gray-300">{row.investorCount}</span> },
    {
      key: 'totalSales', label: 'Total Sales', sortable: true,
      render: (row) => <span className="text-sm text-white font-semibold">{fmtINR(row.totalSales)}</span>,
    },
    {
      key: 'rate', label: 'Rate', sortable: true, width: '90px',
      render: (row) => (
        <AdminBadge
          label={`${row.rate}%`}
          variant={row.rate >= CP_RATE_HIGH ? 'success' : 'info'}
          size="sm"
        />
      ),
    },
    {
      key: 'commission', label: 'Commission', sortable: true,
      render: (row) => <span className="text-sm text-emerald-400 font-semibold">{fmtINR(row.commission)}</span>,
    },
    {
      key: 'actions', label: '', width: '90px',
      render: (row) => (
        <button
          onClick={(e) => { e.stopPropagation(); setSelected(row) }}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-gray-300 bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:text-white transition-colors"
        >
          Breakdown
        </button>
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
              ? 'Investors brought in directly by a channel partner. The rate follows the partner\u2019s cumulative credited sales.'
              : 'Everything the channel partners beneath a master partner have brought in, at a flat 0.5%.'}
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-300 bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:text-white transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">
            {tier === 'cp' ? 'Channel Partners' : 'Master Partners'}
          </p>
          <p className="text-xl font-bold text-white mt-1">{totals.partners}</p>
        </AdminGlass>
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Attributed Sales</p>
          <p className="text-xl font-bold text-white mt-1">{fmtINR(totals.sales)}</p>
        </AdminGlass>
        <AdminGlass padding="p-4">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-medium">Commission Payable</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{fmtINR(totals.commission)}</p>
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
            <span className="text-gray-400">Any investment brought in by a channel partner beneath them</span>
            <span className="text-white font-semibold">{MCP_RATE}%</span>
          </div>
        )}
        <p className="text-[10px] text-gray-500 mt-2">
          The rate is read from each partner&rsquo;s cumulative credited sales, so it moves on its own as they cross a slab.
          Only applications that are approved, credited or completed count.
        </p>
      </AdminGlass>

      {loading ? (
        <AdminGlass padding="p-10"><div className="text-center text-sm text-gray-500">Loading partners\u2026</div></AdminGlass>
      ) : rows.length === 0 ? (
        <AdminGlass>
          <AdminEmptyState
            title={tier === 'cp' ? 'No channel partners yet' : 'No master partners yet'}
            description={`A client becomes one once their GHL ID is set to ${tier === 'cp' ? 'CPLGHL' : 'MCPGHL'}\u2026 on their profile.`}
          />
        </AdminGlass>
      ) : (
        <AdminDataTable<PartnerRow>
          columns={columns}
          data={rows}
          searchKeys={['name', 'code', 'email', 'phone', 'ghlId']}
          searchPlaceholder="Search by partner name, code, email\u2026"
          title={tier === 'cp' ? 'Channel Partners' : 'Master Channel Partners'}
          searchable
          exportable
          emptyMessage="No matching partners"
        />
      )}

      <AdminModal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected ? `${selected.name} \u2014 breakdown` : 'Breakdown'}
        subtitle={selected?.code}
        maxWidth="max-w-2xl"
        footer={<ModalButton onClick={() => setSelected(null)}>Close</ModalButton>}
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Sales</p>
                <p className="text-sm text-white font-semibold mt-1">{fmtINR(selected.totalSales)}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Rate</p>
                <p className="text-sm text-white font-semibold mt-1">{selected.rate}%</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider">Commission</p>
                <p className="text-sm text-emerald-400 font-semibold mt-1">{fmtINR(selected.commission)}</p>
              </div>
            </div>

            {selected.children.length === 0 ? (
              <p className="text-xs text-gray-500 italic">
                {tier === 'cp'
                  ? 'No credited investors against this code yet.'
                  : 'No channel partners sit beneath this master partner yet.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left font-semibold text-gray-500 py-2 pr-3">
                        {tier === 'cp' ? 'Investor' : 'Channel Partner'}
                      </th>
                      <th className="text-left font-semibold text-gray-500 py-2 pr-3">
                        {tier === 'cp' ? 'GHL ID' : 'Code'}
                      </th>
                      <th className="text-right font-semibold text-gray-500 py-2">Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.children.map((c, i) => (
                      <tr key={i} className="border-b border-white/[0.03]">
                        <td className="py-2 pr-3 text-white">{c.name}</td>
                        <td className="py-2 pr-3 text-gray-400 font-mono">{c.code}</td>
                        <td className="py-2 text-right text-gray-200">{fmtINR(c.amount)}</td>
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
