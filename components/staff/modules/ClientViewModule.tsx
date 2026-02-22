'use client'

import { useState, useMemo } from 'react'
import { TICKETS_DATA, CLIENT_INTERACTIONS_DATA } from '@/lib/staff/staffMockData'
import type { Ticket, ClientInteraction, CommChannel } from '@/lib/staff/staffTypes'
import AdminGlass from '../../admin/shared/AdminGlass'
import AdminBadge from '../../admin/shared/AdminBadge'
import AdminDataTable, { type Column } from '../../admin/shared/AdminDataTable'
import {
  Search, Users, User, Hash, Clock, Ticket as TicketIcon, MessageSquare,
  Phone, Video, MessageCircle, Mail, Send, ChevronRight, ArrowUpRight,
  ArrowDownLeft, X, Activity,
} from 'lucide-react'

interface ClientViewModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

interface ClientSummary {
  clientId: string
  clientName: string
  totalTickets: number
  lastInteraction: string
  latestStatus: string
}

function buildClientList(): ClientSummary[] {
  const map = new Map<string, { name: string; tickets: Ticket[] }>()
  for (const t of TICKETS_DATA) {
    if (!map.has(t.clientId)) map.set(t.clientId, { name: t.clientName, tickets: [] })
    map.get(t.clientId)!.tickets.push(t)
  }
  return Array.from(map.entries()).map(([id, { name, tickets }]) => {
    const sorted = [...tickets].sort((a, b) => new Date(b.updatedDate).getTime() - new Date(a.updatedDate).getTime())
    return {
      clientId: id,
      clientName: name,
      totalTickets: tickets.length,
      lastInteraction: sorted[0]?.updatedDate ?? '',
      latestStatus: sorted[0]?.status ?? 'unknown',
    }
  })
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

export default function ClientViewModule({ subTab }: ClientViewModuleProps) {
  const tab = subTab || 'search'
  if (tab === 'history') return <InteractionHistory />
  return <ClientSearch />
}

// ── Client Search ──────────────────────────────────────────────
function ClientSearch() {
  const clients = useMemo(buildClientList, [])
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return clients
    const q = query.toLowerCase()
    return clients.filter(c => c.clientName.toLowerCase().includes(q) || c.clientId.toLowerCase().includes(q))
  }, [clients, query])

  const selectedClient = selectedId ? clients.find(c => c.clientId === selectedId) : null
  const clientTickets = selectedId ? TICKETS_DATA.filter(t => t.clientId === selectedId) : []
  const clientInteractions = selectedId ? CLIENT_INTERACTIONS_DATA.filter(i => i.clientId === selectedId) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-teal-400" />
          Client View
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
            placeholder="Search by client name or ID..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20"
          />
        </div>
      </AdminGlass>

      {/* Client cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(c => (
          <AdminGlass key={c.clientId} padding="p-4" className={selectedId === c.clientId ? 'ring-1 ring-teal-500/40' : ''}>
            <button
              onClick={() => setSelectedId(selectedId === c.clientId ? null : c.clientId)}
              className="w-full text-left space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-teal-500/15 flex items-center justify-center">
                    <User className="w-4 h-4 text-teal-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{c.clientName}</p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1"><Hash className="w-3 h-3" />{c.clientId}</p>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 text-gray-500 transition-transform ${selectedId === c.clientId ? 'rotate-90' : ''}`} />
              </div>
              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-white/[0.06]">
                <span className="flex items-center gap-1"><TicketIcon className="w-3 h-3" />{c.totalTickets} tickets</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDate(c.lastInteraction)}</span>
              </div>
              <div>{ticketStatusBadge(c.latestStatus)}</div>
            </button>
          </AdminGlass>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-full text-center text-sm text-gray-500 py-8">No clients found matching your search.</p>
        )}
      </div>

      {/* Client detail (inline) */}
      {selectedClient && (
        <AdminGlass hover={false} padding="p-5">
          <div className="space-y-5">
            {/* Info bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500/15 flex items-center justify-center">
                  <User className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{selectedClient.clientName}</h3>
                  <p className="text-[11px] text-gray-500">ID: {selectedClient.clientId} | {selectedClient.totalTickets} tickets | Last: {fmtDate(selectedClient.lastInteraction)}</p>
                </div>
              </div>
              <button onClick={() => setSelectedId(null)} className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
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
                      <tr key={t.id} className="border-b border-white/[0.04]">
                        <td className="px-3 py-2 text-teal-400 font-mono">{t.id}</td>
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

function InteractionHistory() {
  const [channelFilter, setChannelFilter] = useState<CommChannel | 'all'>('all')

  const data = useMemo(() => {
    if (channelFilter === 'all') return CLIENT_INTERACTIONS_DATA
    return CLIENT_INTERACTIONS_DATA.filter(i => i.channel === channelFilter)
  }, [channelFilter])

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
