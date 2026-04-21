'use client'

/**
 * FIQ Broadcast Modal
 * -----------------------------------------------------------------
 * Sends a Financial IQ article to clients via email and/or WhatsApp.
 *
 * - Email:    handed to `netlify/functions/fiq-broadcast` which
 *             calls Resend per recipient and logs each send in
 *             `fiq_broadcasts` audit table.
 * - WhatsApp: if env `WHATSAPP_API_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`
 *             are set, the function sends via WhatsApp Cloud API.
 *             Otherwise it returns one `wa.me` click-to-chat link
 *             per recipient so the admin can open them in tabs.
 *
 * Broadcasts are additive — they do NOT flip `is_published` or
 * `email_sent_at` on the post. That is the weekly cron's job.
 * This modal is for manual, one-off or targeted sends.
 */

import { useEffect, useMemo, useState } from 'react'
import { Search, Send, Users, Mail, MessageCircle, AlertTriangle, CheckCircle, Loader2, ExternalLink, Bell } from 'lucide-react'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import { supabase as _sb, isSupabaseConfigured } from '@/lib/supabase/client'

const sb = _sb as any

interface FIQPostForBroadcast {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  cover_image: string | null
}

interface ClientRow {
  id: string
  user_id: string | null
  full_name: string
  email: string | null
  phone: string | null
  newsletter_opt_out: boolean
  is_active: boolean
}

interface BroadcastResult {
  channel: 'email' | 'whatsapp'
  recipient: string
  client_id: string | null
  status: 'sent' | 'failed' | 'skipped'
  error?: string
  wa_link?: string
}

interface Props {
  post: FIQPostForBroadcast | null
  onClose: () => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function FIQBroadcastModal({ post, onClose, showToast }: Props) {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [search, setSearch] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [sendWhatsApp, setSendWhatsApp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [results, setResults] = useState<BroadcastResult[] | null>(null)
  const [dashboardNotified, setDashboardNotified] = useState(0)

  useEffect(() => {
    if (!post || !isSupabaseConfigured()) return
    setLoading(true)
    sb.from('clients')
      .select('id, user_id, full_name, email, phone, newsletter_opt_out, is_active')
      .eq('is_active', true)
      .order('full_name', { ascending: true })
      .then(({ data }: any) => {
        if (data) setClients(data as ClientRow[])
        setLoading(false)
      })
  }, [post])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      (c.full_name || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    )
  }, [clients, search])

  const toggle = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      filtered.forEach(c => next.add(c.id))
      return next
    })
  }
  const clearSelection = () => setSelectedIds(new Set())

  // Stats for the footer
  const selectedList = clients.filter(c => selectedIds.has(c.id))
  const emailCount = selectedList.filter(c => sendEmail && c.email && !c.newsletter_opt_out).length
  const waCount = selectedList.filter(c => sendWhatsApp && c.phone).length
  const optedOut = selectedList.filter(c => c.newsletter_opt_out).length
  const dashboardCount = selectedList.filter(c => !!c.user_id).length

  // Dashboard alerts are always posted for selected clients with an auth
  // account, so we allow Send even when neither email nor WhatsApp is
  // ticked (dashboard-only broadcast).
  const canSend = !!post && selectedIds.size > 0 && !sending

  const handleSend = async () => {
    if (!post) return
    setSending(true)
    setResults(null)
    try {
      const res = await fetch('/.netlify/functions/fiq-broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          post_id: post.id,
          client_ids: Array.from(selectedIds),
          channels: [sendEmail && 'email', sendWhatsApp && 'whatsapp'].filter(Boolean),
          trigger: 'manual',
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        showToast(json.error || `Broadcast failed (${res.status})`, 'error')
        setSending(false)
        return
      }
      setResults(json.results || [])
      setDashboardNotified(typeof json.dashboard_notified === 'number' ? json.dashboard_notified : 0)
      const sent = (json.results || []).filter((r: BroadcastResult) => r.status === 'sent').length
      const failed = (json.results || []).filter((r: BroadcastResult) => r.status === 'failed').length
      const dashN = json.dashboard_notified || 0
      const channelsUsed = sendEmail || sendWhatsApp
      const dashMsg = dashN ? ` · ${dashN} dashboard alert${dashN === 1 ? '' : 's'}` : ''
      if (!channelsUsed) {
        // Dashboard-only broadcast
        if (dashN > 0) {
          showToast(`Posted ${dashN} dashboard alert${dashN === 1 ? '' : 's'}`, 'success')
        } else {
          showToast(`No recipients had a dashboard account — nothing posted`, 'warning')
        }
      } else if (failed === 0 && sent > 0) {
        showToast(`Broadcast sent to ${sent} recipient${sent === 1 ? '' : 's'}${dashMsg}`, 'success')
      } else if (sent > 0) {
        showToast(`Sent ${sent}, ${failed} failed${dashMsg} — see details below`, 'warning')
      } else if (dashN > 0) {
        showToast(`Email/WhatsApp failed, but ${dashN} dashboard alert${dashN === 1 ? '' : 's'} posted`, 'warning')
      } else {
        showToast(`Broadcast failed for all recipients`, 'error')
      }
    } catch (e: any) {
      showToast(`Broadcast error: ${e?.message || 'network'}`, 'error')
    }
    setSending(false)
  }

  const handleClose = () => {
    setSelectedIds(new Set())
    setSearch('')
    setResults(null)
    setDashboardNotified(0)
    setSending(false)
    setSendEmail(true)
    setSendWhatsApp(false)
    onClose()
  }

  return (
    <AdminModal
      isOpen={!!post}
      onClose={handleClose}
      title="Send Article to Clients"
      subtitle={post ? post.title : ''}
      maxWidth="max-w-3xl"
      footer={
        <>
          <ModalButton variant="secondary" onClick={handleClose} disabled={sending}>
            {results ? 'Close' : 'Cancel'}
          </ModalButton>
          {!results && (
            <ModalButton variant="primary" onClick={handleSend} disabled={!canSend}>
              <span className="flex items-center gap-1.5">
                {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {sending ? 'Sending…' : `Send to ${selectedIds.size || 0}`}
              </span>
            </ModalButton>
          )}
        </>
      }
    >
      {!post ? null : (
        <div className="space-y-4">
          {/* Dashboard-alert notice — always on */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30">
            <Bell className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="text-white font-medium">Dashboard alert posted to every selected client</p>
              <p className="text-gray-400 mt-0.5">In-app notification is always delivered (clients without an auth account are skipped). Email and WhatsApp below are additional channels.</p>
            </div>
          </div>

          {/* Channels */}
          <div className="grid grid-cols-2 gap-3">
            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${sendEmail ? 'bg-brand-red/10 border-brand-red/40' : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]'}`}>
              <input
                type="checkbox"
                checked={sendEmail}
                onChange={e => setSendEmail(e.target.checked)}
                className="w-4 h-4 accent-brand-red"
              />
              <Mail className="w-4 h-4 text-brand-red" />
              <div>
                <p className="text-sm text-white font-medium">Email</p>
                <p className="text-[11px] text-gray-400">Uses Resend. Respects newsletter opt-out.</p>
              </div>
            </label>
            <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${sendWhatsApp ? 'bg-green-500/10 border-green-500/40' : 'bg-white/[0.03] border-white/[0.08] hover:bg-white/[0.06]'}`}>
              <input
                type="checkbox"
                checked={sendWhatsApp}
                onChange={e => setSendWhatsApp(e.target.checked)}
                className="w-4 h-4 accent-green-500"
              />
              <MessageCircle className="w-4 h-4 text-green-500" />
              <div>
                <p className="text-sm text-white font-medium">WhatsApp</p>
                <p className="text-[11px] text-gray-400">Uses WA Cloud API if configured, else wa.me links.</p>
              </div>
            </label>
          </div>

          {/* Preview */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Preview</p>
            <p className="text-sm text-white font-medium">{post.title}</p>
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{post.excerpt}</p>
            <p className="text-[11px] text-gray-500 mt-2">Link: /financial-iq/{post.slug}</p>
          </div>

          {/* Client picker */}
          {!results && (
            <>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by name, email, phone"
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red/50"
                  />
                </div>
                <button
                  onClick={selectAllVisible}
                  className="px-3 py-2 text-xs text-gray-300 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition-colors whitespace-nowrap"
                >
                  <Users className="w-3.5 h-3.5 inline mr-1" /> Select all {filtered.length > 0 ? `(${filtered.length})` : ''}
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={clearSelection}
                    className="px-3 py-2 text-xs text-gray-300 bg-white/[0.04] border border-white/[0.08] rounded-lg hover:bg-white/[0.08] transition-colors whitespace-nowrap"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto rounded-xl border border-white/[0.06] divide-y divide-white/[0.04]">
                {loading ? (
                  <div className="p-6 text-center text-sm text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> Loading clients…
                  </div>
                ) : filtered.length === 0 ? (
                  <div className="p-6 text-center text-sm text-gray-500">No clients match your search.</div>
                ) : (
                  filtered.map(c => {
                    const isSelected = selectedIds.has(c.id)
                    const emailOK = !!c.email && !c.newsletter_opt_out
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors ${isSelected ? 'bg-brand-red/10' : 'hover:bg-white/[0.03]'}`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggle(c.id)}
                          className="w-4 h-4 accent-brand-red shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{c.full_name}</p>
                          <p className="text-[11px] text-gray-500 truncate">
                            {c.email || '— no email —'}
                            {c.phone ? ` · ${c.phone}` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {c.newsletter_opt_out && (
                            <span title="Unsubscribed from newsletter" className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">opt-out</span>
                          )}
                          {!c.user_id && (
                            <span title="No investor dashboard account yet — dashboard alert will be skipped" className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/20">no dashboard</span>
                          )}
                          {sendEmail && !emailOK && (
                            <span title={c.email ? 'Opted out' : 'No email on file'} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/20">no email</span>
                          )}
                          {sendWhatsApp && !c.phone && (
                            <span title="No phone on file" className="text-[10px] px-1.5 py-0.5 rounded bg-gray-500/10 text-gray-400 border border-gray-500/20">no phone</span>
                          )}
                        </div>
                      </label>
                    )
                  })
                )}
              </div>

              {/* Summary */}
              <div className="flex items-center flex-wrap gap-3 text-xs text-gray-400">
                <span>Selected: <span className="text-white font-medium">{selectedIds.size}</span></span>
                <span>· Dashboard alerts: <span className="text-white font-medium">{dashboardCount}</span></span>
                {sendEmail && <span>· Email: <span className="text-white font-medium">{emailCount}</span></span>}
                {sendWhatsApp && <span>· WhatsApp: <span className="text-white font-medium">{waCount}</span></span>}
                {optedOut > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="w-3 h-3" /> {optedOut} opted out — email skipped
                  </span>
                )}
              </div>
            </>
          )}

          {/* Results */}
          {results && (
            <div className="space-y-3">
              {/* Resend setup banner when we detect the test-mode restriction */}
              {results.some(r => r.channel === 'email' && r.status === 'failed' && /testing emails|verified domain/i.test(r.error || '')) && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs">
                    <p className="text-white font-medium">Email is in Resend test mode</p>
                    <p className="text-gray-300 mt-0.5 leading-relaxed">
                      Resend&apos;s default sender (<code className="text-amber-300">onboarding@resend.dev</code>) only delivers to the Resend account owner&apos;s mailbox — that&apos;s why real client addresses fail. To unlock client sends:
                    </p>
                    <ol className="text-gray-300 list-decimal list-inside mt-2 space-y-0.5">
                      <li>Verify <code className="text-amber-300">ghlindiaventures.com</code> at <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">resend.com/domains</a>.</li>
                      <li>In Netlify, set <code className="text-amber-300">RESEND_FROM_EMAIL=noreply@ghlindiaventures.com</code>.</li>
                      <li>Redeploy — no code change needed.</li>
                    </ol>
                    <p className="text-gray-400 mt-2">Dashboard alerts and WhatsApp click-to-chat links are unaffected and already working.</p>
                  </div>
                </div>
              )}

              <div className="max-h-96 overflow-y-auto rounded-xl border border-white/[0.06]">
              <div className="p-3 bg-white/[0.03] border-b border-white/[0.06] flex items-center gap-2 flex-wrap">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-xs text-white">
                  Sent: {results.filter(r => r.status === 'sent').length} ·
                  Failed: {results.filter(r => r.status === 'failed').length} ·
                  Skipped: {results.filter(r => r.status === 'skipped').length}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] text-blue-400 ml-auto">
                  <Bell className="w-3 h-3" /> Dashboard alerts: {dashboardNotified}
                </span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {results.map((r, i) => (
                  <div key={i} className="p-2.5 text-xs flex items-center gap-2">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${r.status === 'sent' ? 'bg-green-400' : r.status === 'failed' ? 'bg-red-400' : 'bg-gray-500'}`} />
                    <span className="text-gray-400 uppercase text-[10px] w-16">{r.channel}</span>
                    <span className="text-white truncate flex-1">{r.recipient}</span>
                    {r.wa_link && (
                      <a href={r.wa_link} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline inline-flex items-center gap-1">
                        Open <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {r.error && <span className="text-red-400 text-[11px] truncate max-w-xs" title={r.error}>{r.error}</span>}
                  </div>
                ))}
              </div>
              </div>
            </div>
          )}
        </div>
      )}
    </AdminModal>
  )
}
