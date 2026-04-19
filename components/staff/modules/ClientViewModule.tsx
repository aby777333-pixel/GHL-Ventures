'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  fetchTickets,
  fetchClientInteractions,
  fetchStaffClients,
  type StaffClientRecord,
} from '@/lib/supabase/staffDataService'
import type { Ticket, ClientInteraction, CommChannel } from '@/lib/staff/staffTypes'
import AdminGlass from '../../admin/shared/AdminGlass'
import AdminBadge from '../../admin/shared/AdminBadge'
import AdminDataTable, { type Column } from '../../admin/shared/AdminDataTable'
import {
  Search, Users, User, Hash, Clock, Ticket as TicketIcon, MessageSquare,
  Phone, Video, MessageCircle, Mail, Send, ChevronRight, ArrowUpRight,
  ArrowDownLeft, X, Activity, MapPin, IndianRupee, ShieldCheck,
} from 'lucide-react'

interface ClientViewModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

const KYC_VARIANT: Record<string, 'success' | 'warning' | 'error' | 'info' | 'neutral'> = {
  verified: 'success',
  approved: 'success',
  pending: 'warning',
  submitted: 'info',
  rejected: 'error',
}

function kycBadge(status: string) {
  const variant = KYC_VARIANT[(status || '').toLowerCase()] || 'neutral'
  const label = (status || 'pending').replace(/_/g, ' ')
  return <AdminBadge label={label} variant={variant} size="sm" />
}

function formatCurrency(n: number) {
  if (!n || Number.isNaN(n)) return '₹0'
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
}

const CHANNEL_CONFIG: Record<string, { icon: typeof Phone; color: string; badge: 'info' | 'purple' | 'success' | 'warning' }> = {
  call:     { icon: Phone,         color: 'text-blue-400',    badge: 'info' },
  video:    { icon: Video,         color: 'text-purple-400',  badge: 'purple' },
  chat:     { icon: MessageCircle, color: 'text-green-400',   badge: 'success' },
  whatsapp: { icon: MessageCircle, color: 'text-emerald-400', badge: 'success' },
  telegram: { icon: Send,          color: 'text-blue-400',    badge: 'info' },
  email:    { icon: Mail,          color: 'text-amber-400',   badge: 'warning' },
}

function ticketStatusBadge(status: string) {
  const v = status === 'resolved' || status === 'closed' ? 'success'
    : status === 'open' ? 'info'
    : status === 'in-progress' ? 'warning'
    : status.startsWith('awaiting') ? 'purple' : 'neutral'
  return <AdminBadge label={status.replace(/-/g, ' ')} variant={v} size="sm" />
}

function fmtDate(iso: string) {
  if (!iso) return '--'
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDateTime(iso: string) {
  if (!iso) return '--'
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function ClientViewModule({ subTab, navigate, showToast }: ClientViewModuleProps) {
  const tab = subTab || 'search'
  const [clients, setClients] = useState<StaffClientRecord[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [interactions, setInteractions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchStaffClients(),
      fetchTickets(),
      fetchClientInteractions(),
    ]).then(([clientData, ticketData, interactionData]) => {
      if (cancelled) return
      setClients(clientData || [])
      setTickets(ticketData || [])
      setInteractions(interactionData || [])
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [])

  if (tab === 'history') return <InteractionHistory interactions={interactions} clients={clients} />
  return (
    <ClientSearch
      clients={clients}
      tickets={tickets}
      interactions={interactions}
      loading={loading}
      navigate={navigate}
      showToast={showToast}
    />
  )
}

// ── Client Search ──────────────────────────────────────────────
function ClientSearch({
  clients, tickets, interactions, loading, navigate, showToast,
}: {
  clients: StaffClientRecord[]
  tickets: any[]
  interactions: any[]
  loading: boolean
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return clients
    const q = query.toLowerCase()
    return clients.filter(c =>
      (c.name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.clientCode || '').toLowerCase().includes(q) ||
      (c.pan || '').toLowerCase().includes(q) ||
      c.id.toLowerCase().includes(q)
    )
  }, [clients, query])

  const selectedClient = selectedId ? clients.find(c => c.id === selectedId) : null
  const clientTickets = useMemo(() => {
    if (!selectedId) return []
    return tickets
      .filter(t => (t.clientId || t.client_id) === selectedId)
      .map(t => ({
        ...t,
        idDisplay: t?.id?.slice?.(0, 8) || t?.id || '—',
        subject: t?.subject || t?.title || t?.description?.slice?.(0, 60) || '—',
        status: t?.status || 'open',
        priority: t?.priority || 'medium',
        updatedDate: t?.updatedDate || t?.updated_at || t?.created_at || '',
      }))
      .sort((a, b) => new Date(b.updatedDate || 0).getTime() - new Date(a.updatedDate || 0).getTime())
  }, [tickets, selectedId])
  const clientInteractions = useMemo(() => selectedId
    ? interactions.filter(i => (i.clientId || i.client_id) === selectedId)
    : [], [interactions, selectedId])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-400" />
          Client View
          <span className="text-xs text-gray-500 font-normal ml-1">({clients.length})</span>
        </h2>
        <p className="text-xs text-gray-500 mt-1">Look up client information and interaction history</p>
      </div>

      {/* Search bar */}
      <AdminGlass hover={false} padding="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by name, email, phone, client code or PAN..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20"
          />
        </div>
      </AdminGlass>

      {/* Client cards */}
      {loading ? (
        <AdminGlass hover={false} padding="p-8"><p className="text-xs text-gray-500 text-center">Loading clients…</p></AdminGlass>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(c => (
            <AdminGlass key={c.id} padding="p-4" className={selectedId === c.id ? 'ring-1 ring-teal-500/40' : ''}>
              <button
                onClick={() => setSelectedId(selectedId === c.id ? null : c.id)}
                className="w-full text-left space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-teal-500/15 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-teal-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{c.name || 'Unnamed'}</p>
                      <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate">
                        <Hash className="w-3 h-3" />{c.clientCode || c.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform shrink-0 ${selectedId === c.id ? 'rotate-90' : ''}`} />
                </div>
                <div className="space-y-1 text-[11px] text-gray-400 pt-1 border-t border-white/[0.06]">
                  {c.email && <div className="flex items-center gap-1.5 truncate"><Mail className="w-3 h-3 shrink-0" /><span className="truncate">{c.email}</span></div>}
                  {c.phone && <div className="flex items-center gap-1.5 truncate"><Phone className="w-3 h-3 shrink-0" /><span className="truncate">{c.phone}</span></div>}
                  {c.city && <div className="flex items-center gap-1.5 truncate"><MapPin className="w-3 h-3 shrink-0" /><span className="truncate">{c.city}</span></div>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {kycBadge(c.kycStatus)}
                  {c.ticketCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-gray-400">
                      <TicketIcon className="w-3 h-3" />{c.ticketCount}
                      {c.openTicketCount > 0 && <span className="text-amber-400">• {c.openTicketCount} open</span>}
                    </span>
                  )}
                  {c.totalInvested > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-teal-300">
                      <IndianRupee className="w-3 h-3" />{formatCurrency(c.totalInvested)}
                    </span>
                  )}
                </div>
              </button>
            </AdminGlass>
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-sm text-gray-500 py-8">
              {clients.length === 0 ? 'No clients yet. When admins add clients they will appear here.' : 'No clients found matching your search.'}
            </p>
          )}
        </div>
      )}

      {/* Client detail (inline) */}
      {selectedClient && (
        <AdminGlass hover={false} padding="p-5">
          <div className="space-y-5">
            {/* Info bar */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-teal-500/15 flex items-center justify-center">
                  <User className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedClient.name || 'Unnamed Client'}</h3>
                  <p className="text-[11px] text-gray-500">
                    {selectedClient.clientCode ? `Code: ${selectedClient.clientCode}` : `ID: ${selectedClient.id.slice(0, 8)}`} • {selectedClient.ticketCount} tickets • Joined {fmtDate(selectedClient.createdAt)}
                  </p>
                </div>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contact + KYC grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Email</p>
                <p className="text-xs text-gray-200 truncate">{selectedClient.email || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                <p className="text-xs text-gray-200">{selectedClient.phone || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">City</p>
                <p className="text-xs text-gray-200">{selectedClient.city || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1"><ShieldCheck className="w-3 h-3" />KYC</p>
                <div>{kycBadge(selectedClient.kycStatus)}</div>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">PAN</p>
                <p className="text-xs text-gray-200 font-mono">{selectedClient.pan || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Investor Type</p>
                <p className="text-xs text-gray-200">{selectedClient.investorType || '—'}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Invested</p>
                <p className="text-xs text-teal-300">{formatCurrency(selectedClient.totalInvested)}</p>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Current Value</p>
                <p className="text-xs text-emerald-300">{formatCurrency(selectedClient.currentValue)}</p>
              </div>
            </div>

            {/* Recent tickets */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <TicketIcon className="w-3.5 h-3.5 text-teal-400" /> Recent Tickets
              </h4>
              <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left px-3 py-2 text-[10px] text-gray-500 uppercase">ID</th>
                      <th className="text-left px-3 py-2 text-[10px] text-gray-500 uppercase">Subject</th>
                      <th className="text-left px-3 py-2 text-[10px] text-gray-500 uppercase">Priority</th>
                      <th className="text-left px-3 py-2 text-[10px] text-gray-500 uppercase">Status</th>
                      <th className="text-left px-3 py-2 text-[10px] text-gray-500 uppercase">Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientTickets.map(t => (
                      <tr key={t.id} className="border-b border-white/[0.04] cursor-pointer hover:bg-white/[0.03] transition-colors"
                        onClick={() => {
                          showToast(`Opening ticket ${t.idDisplay}: ${t.subject}`, 'info')
                          navigate('cs/tickets')
                        }}
                      >
                        <td className="px-3 py-2 text-teal-400 font-mono">{t.idDisplay}</td>
                        <td className="px-3 py-2 text-gray-300 max-w-[200px] truncate">{t.subject}</td>
                        <td className="px-3 py-2">
                          <AdminBadge label={t.priority} variant={t.priority === 'critical' ? 'error' : t.priority === 'high' ? 'warning' : t.priority === 'medium' ? 'info' : 'neutral'} size="sm" />
                        </td>
                        <td className="px-3 py-2">{ticketStatusBadge(t.status)}</td>
                        <td className="px-3 py-2 text-gray-500">{fmtDate(t.updatedDate)}</td>
                      </tr>
                    ))}
                    {clientTickets.length === 0 && (
                      <tr><td colSpan={5} className="text-center py-6 text-gray-500">No tickets found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent interactions */}
            <div>
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-teal-400" /> Recent Interactions
              </h4>
              <div className="space-y-2">
                {clientInteractions.length === 0 && <p className="text-xs text-gray-500 py-4 text-center">No interactions recorded</p>}
                {clientInteractions.map(i => {
                  const ch = CHANNEL_CONFIG[i.channel]
                  const Icon = ch?.icon ?? MessageCircle
                  return (
                    <div key={i.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                      <div className={`mt-0.5 ${ch?.color ?? 'text-gray-400'}`}><Icon className="w-4 h-4" /></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white truncate">{i.subject}</span>
                          {i.direction === 'inbound'
                            ? <ArrowDownLeft className="w-3 h-3 text-blue-400 shrink-0" />
                            : <ArrowUpRight className="w-3 h-3 text-emerald-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{i.summary}</p>
                        <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-600">
                          <span>{i.agentName}</span>
                          <span>{fmtDateTime(i.startTime)}</span>
                          {i.duration && <span>{i.duration}m</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </AdminGlass>
      )}
    </div>
  )
}

// ── Interaction History ─────────────────────────────────────────
const ALL_CHANNELS: CommChannel[] = ['call', 'video', 'chat', 'whatsapp', 'telegram', 'email']

function InteractionHistory({ interactions, clients }: { interactions: any[]; clients: StaffClientRecord[] }) {
  const [channelFilter, setChannelFilter] = useState<CommChannel | 'all'>('all')

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>()
    clients.forEach(c => map.set(c.id, c.name || c.clientCode || c.id.slice(0, 8)))
    return map
  }, [clients])

  const enriched = useMemo(() => {
    return (interactions || []).map((i: any) => ({
      ...i,
      clientName: i.clientName || i.client_name || clientNameById.get(i.client_id || i.clientId || '') || 'Unknown',
      channel: i.channel || i.type || 'chat',
      direction: i.direction || 'inbound',
      subject: i.subject || i.topic || i.summary?.slice?.(0, 60) || '—',
      agentName: i.agentName || i.agent_name || i.staff_name || '—',
      startTime: i.startTime || i.created_at || '',
      status: i.status || 'completed',
      duration: i.duration || i.duration_minutes || null,
    }))
  }, [interactions, clientNameById])

  const data = useMemo(() => {
    if (channelFilter === 'all') return enriched
    return enriched.filter(i => i.channel === channelFilter)
  }, [enriched, channelFilter])

  const columns: Column<ClientInteraction>[] = [
    { key: 'clientName', label: 'Client Name' },
    {
      key: 'channel', label: 'Channel',
      render: (row) => {
        const ch = CHANNEL_CONFIG[row.channel]
        return <AdminBadge label={row.channel} variant={ch?.badge ?? 'neutral'} size="sm" />
      },
    },
    {
      key: 'direction', label: 'Direction',
      render: (row) => (
        <span className="flex items-center gap-1 text-xs">
          {row.direction === 'inbound'
            ? <><ArrowDownLeft className="w-3 h-3 text-blue-400" /><span className="text-blue-400">Inbound</span></>
            : <><ArrowUpRight className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Outbound</span></>}
        </span>
      ),
    },
    { key: 'subject', label: 'Subject', render: (row) => <span className="text-gray-300 truncate max-w-[180px] block">{row.subject}</span> },
    {
      key: 'status', label: 'Status',
      render: (row) => <AdminBadge label={row.status} variant={row.status === 'completed' ? 'success' : row.status === 'active' ? 'info' : row.status === 'missed' ? 'error' : 'warning'} size="sm" />,
    },
    {
      key: 'startTime', label: 'Date',
      render: (row) => <span className="text-gray-500 text-xs">{fmtDateTime(row.startTime)}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-teal-400" />
          Interaction History
        </h2>
        <p className="text-xs text-gray-500 mt-1">Complete log of all client interactions across channels</p>
      </div>

      {/* Channel filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setChannelFilter('all')}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
            channelFilter === 'all'
              ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
              : 'bg-white/[0.04] text-gray-400 border-white/[0.08] hover:bg-white/[0.08]'
          }`}
        >
          All Channels
        </button>
        {ALL_CHANNELS.map(ch => {
          const cfg = CHANNEL_CONFIG[ch]
          const Icon = cfg?.icon ?? MessageCircle
          return (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-3 py-1.5 text-xs rounded-full border transition-colors flex items-center gap-1.5 ${
                channelFilter === ch
                  ? 'bg-teal-500/15 text-teal-400 border-teal-500/30'
                  : 'bg-white/[0.04] text-gray-400 border-white/[0.08] hover:bg-white/[0.08]'
              }`}
            >
              <Icon className="w-3 h-3" />
              {ch.charAt(0).toUpperCase() + ch.slice(1)}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <AdminGlass hover={false} padding="p-0">
        <div className="p-4">
          <AdminDataTable<ClientInteraction>
            columns={columns}
            data={data}
            pageSize={8}
            searchable
            searchPlaceholder="Search interactions..."
            searchKeys={['clientName', 'subject', 'agentName', 'channel']}
            emptyMessage="No interactions found"
          />
        </div>
      </AdminGlass>
    </div>
  )
}
