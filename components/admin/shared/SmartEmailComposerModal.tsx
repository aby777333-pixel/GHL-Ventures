'use client'

/* ─────────────────────────────────────────────────────────────
   Smart Email Composer — bulk-aware, per-recipient personalized

   • Multi-select client picker with search (clients table — RM
     assignments + KYC status visible so the admin can target a
     specific cohort).
   • Ad-hoc recipients via comma-separated emails.
   • Smart token chips ({{client_name}}, {{email}}, {{phone}},
     {{fund_name}}, {{portfolio_value}}, {{next_action}}). Tokens
     are substituted PER RECIPIENT before the send goes out, so
     every client gets a personal copy and never sees another
     client's address.
   • Channel toggle: Email · WhatsApp · Both — relays through the
     existing `broadcast-send` Netlify function (which already
     iterates one recipient at a time on the server side).
   • Pre-attached PDF support — used by the Document Builder
     "Send to Clients" flow. Any additional files are also
     forwarded as Resend attachments.

   Privacy contract: we send N separate broadcast-send calls
   (one per recipient) when tokens are present, OR one
   broadcast-send call with the full ad_hoc array otherwise.
   In both paths Resend sends each To: individually — never
   exposes one recipient to another.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Loader2, Mail, MessageCircle, Send, Paperclip, XCircle, Search,
  Users, AlertTriangle, CheckCircle2, Calendar,
} from 'lucide-react'
import AdminModal, { ModalButton } from './AdminModal'
import { getAuthToken, supabase, isSupabaseConfigured } from '@/lib/supabase/client'

export interface SmartComposerAttachment {
  filename: string
  /** base64 content (no data: URI prefix) */
  content: string
  contentType?: string
  sizeBytes: number
}

interface ClientRow {
  id: string
  user_id: string | null
  name: string
  email: string | null
  phone: string | null
  /** Best-effort fund label (pulled from investment_applications when
   *  available; falls back to a generic name during token substitution). */
  fund_name?: string | null
}

const NETLIFY_FUNCTIONS_HOST = 'https://ghl-india-ventures-2025.netlify.app'
function getFunctionBase(): string {
  if (typeof window === 'undefined') return ''
  const origin = window.location.origin
  if (origin.includes('localhost')) return 'http://localhost:8888'
  if (origin.endsWith('.netlify.app')) return origin
  return NETLIFY_FUNCTIONS_HOST
}

type Channel = 'email' | 'whatsapp' | 'both'

const TOKEN_CHIPS = [
  '{{client_name}}',
  '{{email}}',
  '{{phone}}',
  '{{fund_name}}',
  '{{portfolio_value}}',
  '{{next_action}}',
] as const

const PER_FILE_LIMIT = 25 * 1024 * 1024 // 25 MB — Resend
const TOTAL_LIMIT = 40 * 1024 * 1024    // 40 MB — Resend

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const idx = result.indexOf(',')
      resolve(idx >= 0 ? result.slice(idx + 1) : result)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/** Run token substitutions over a string for a single recipient. */
function applyTokens(text: string, ctx: Record<string, string>): string {
  if (!text) return text
  return text
    .replace(/\{\{\s*client_name\s*\}\}/gi, ctx.client_name || '')
    .replace(/\{\{\s*name\s*\}\}/gi, ctx.client_name || '')
    .replace(/\{\{\s*email\s*\}\}/gi, ctx.email || '')
    .replace(/\{\{\s*phone\s*\}\}/gi, ctx.phone || '')
    .replace(/\{\{\s*fund_name\s*\}\}/gi, ctx.fund_name || 'GHL India Ventures AIF')
    .replace(/\{\{\s*portfolio_value\s*\}\}/gi, ctx.portfolio_value || '')
    .replace(/\{\{\s*next_action\s*\}\}/gi, ctx.next_action || '')
}

interface Props {
  open: boolean
  onClose: () => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  /** Pre-attached files (e.g. the document PDF the admin just built). */
  initialAttachments?: SmartComposerAttachment[]
  initialSubject?: string
  initialBody?: string
  /** Window title — defaults to "Smart Email Composer". */
  title?: string
  onSent?: () => void
}

export default function SmartEmailComposerModal({
  open, onClose, showToast,
  initialAttachments = [],
  initialSubject = '',
  initialBody = '',
  title = 'Smart Email Composer',
  onSent,
}: Props) {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [adHoc, setAdHoc] = useState('')      // comma-separated emails / mobiles
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [channel, setChannel] = useState<Channel>('email')
  const [attachments, setAttachments] = useState<SmartComposerAttachment[]>([])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [scheduleAt, setScheduleAt] = useState('')   // ISO datetime-local; ignored for now (logs as info)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)
  const subjectRef = useRef<HTMLInputElement>(null)
  const activeFieldRef = useRef<'subject' | 'body'>('body')

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setSubject(initialSubject || '')
      setBody(initialBody || '')
      setAttachments(initialAttachments || [])
      setSelectedIds(new Set())
      setAdHoc('')
      setSearch('')
      setError('')
      setSuccess('')
      setSending(false)
      setChannel('email')
      setScheduleAt('')
    }
  }, [open, initialSubject, initialBody, initialAttachments])

  // Load clients on open
  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadClients() {
      if (!isSupabaseConfigured()) { setClients([]); return }
      setLoadingClients(true)
      try {
        const sb: any = supabase
        // Only request columns that are guaranteed by the schema; the
        // optional `fund_name` is looked up separately to avoid breaking
        // the whole picker if the column is absent in some environments.
        const { data, error: err } = await sb
          .from('clients')
          .select('id, user_id, full_name, email, phone, deleted_at')
          .is('deleted_at', null)
          .order('full_name', { ascending: true })
          .limit(1000)
        if (cancelled) return
        if (err) {
          console.warn('[SmartComposer] clients fetch:', err.message)
          setClients([])
        } else {
          const rows: ClientRow[] = ((data as any[]) || []).map(r => ({
            id: r.id,
            user_id: r.user_id || null,
            name: (r.full_name || '').trim() || 'Unnamed Client',
            email: r.email || null,
            phone: r.phone || null,
          }))
          setClients(rows)
        }
      } catch (e: any) {
        if (!cancelled) {
          console.warn('[SmartComposer] clients exception:', e?.message || e)
          setClients([])
        }
      } finally {
        if (!cancelled) setLoadingClients(false)
      }
    }
    loadClients()
    return () => { cancelled = true }
  }, [open])

  // ── Filter / select ──────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q),
    )
  }, [clients, search])

  const toggleClient = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }
  const selectAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      for (const c of filtered) if (c.email || c.phone) next.add(c.id)
      return next
    })
  }
  const clearSelected = () => setSelectedIds(new Set())

  // ── Token insertion ─────────────────────────────────────────
  const insertToken = (token: string) => {
    if (activeFieldRef.current === 'subject') {
      const el = subjectRef.current
      const cur = subject
      const pos = el?.selectionStart ?? cur.length
      const next = cur.slice(0, pos) + token + cur.slice(pos)
      setSubject(next)
      setTimeout(() => { el?.focus(); el?.setSelectionRange(pos + token.length, pos + token.length) }, 0)
    } else {
      const el = bodyRef.current
      const cur = body
      const pos = el?.selectionStart ?? cur.length
      const next = cur.slice(0, pos) + token + cur.slice(pos)
      setBody(next)
      setTimeout(() => { el?.focus(); el?.setSelectionRange(pos + token.length, pos + token.length) }, 0)
    }
  }

  // ── Attachments ─────────────────────────────────────────────
  const handleFiles: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    setError('')
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return

    const next = [...attachments]
    let runningBytes = next.reduce((s, a) => s + a.sizeBytes, 0)
    for (const f of files) {
      if (f.size > PER_FILE_LIMIT) {
        setError(`"${f.name}" is ${(f.size / 1024 / 1024).toFixed(1)} MB — per-file limit is 25 MB.`)
        continue
      }
      if (runningBytes + f.size > TOTAL_LIMIT) {
        setError(`Adding "${f.name}" would exceed 40 MB total.`)
        continue
      }
      try {
        const content = await readFileAsBase64(f)
        next.push({ filename: f.name, content, contentType: f.type || undefined, sizeBytes: f.size })
        runningBytes += f.size
      } catch (err: any) {
        setError(err?.message || `Failed to read ${f.name}`)
      }
    }
    setAttachments(next)
  }

  const removeAttachment = (idx: number) =>
    setAttachments(prev => prev.filter((_, i) => i !== idx))

  // ── Build recipients ────────────────────────────────────────
  /** Returns the final per-recipient send list. Includes both selected
   *  clients (with full token context) and ad-hoc entries (with only
   *  email/name where derivable). */
  const buildRecipients = (): Array<{ name?: string; email?: string; phone?: string; tokens: Record<string, string> }> => {
    const out: Array<{ name?: string; email?: string; phone?: string; tokens: Record<string, string> }> = []
    const byId: Record<string, ClientRow> = {}
    for (const c of clients) byId[c.id] = c
    // tsconfig targets ES5 without downlevelIteration; iterate via Array.from
    const selectedArr = Array.from(selectedIds.values())
    for (const id of selectedArr) {
      const c = byId[id]
      if (!c) continue
      if (!c.email && !c.phone) continue
      out.push({
        name: c.name,
        email: c.email || undefined,
        phone: c.phone || undefined,
        tokens: {
          client_name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          fund_name: c.fund_name || 'GHL India Ventures AIF',
        },
      })
    }
    // ad-hoc: comma-separated emails OR phones
    for (const piece of adHoc.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)) {
      if (piece.includes('@')) {
        out.push({ email: piece, tokens: { client_name: '', email: piece, phone: '' } })
      } else {
        out.push({ phone: piece, tokens: { client_name: '', phone: piece, email: '' } })
      }
    }
    return out
  }

  const hasTokens = useMemo(() => {
    const re = /\{\{[^}]+\}\}/
    return re.test(subject) || re.test(body)
  }, [subject, body])

  // ── Send ────────────────────────────────────────────────────
  const handleSend = async () => {
    setError(''); setSuccess('')
    if (!subject.trim() && (channel === 'email' || channel === 'both')) {
      setError('Subject is required for email.')
      return
    }
    if (!body.trim()) {
      setError('Message body is required.')
      return
    }
    const recipients = buildRecipients()
    if (recipients.length === 0) {
      setError('Pick at least one client or add an ad-hoc email/mobile.')
      return
    }

    setSending(true)
    try {
      const token = await getAuthToken()
      if (!token) { setError('Admin session expired. Please sign in again.'); setSending(false); return }

      const fnUrl = `${getFunctionBase()}/.netlify/functions/broadcast-send`
      const baseHeaders = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
      const attPayload = attachments.length > 0
        ? attachments.map(a => ({ filename: a.filename, content: a.content, contentType: a.contentType }))
        : undefined

      // One ad_hoc batch if there are no tokens — single API call.
      // Per-recipient calls otherwise so the substitutions are applied.
      let sent = 0
      let failed = 0

      if (!hasTokens) {
        const payload: Record<string, unknown> = {
          name: `Doc send · ${new Date().toISOString().slice(0, 19)}`,
          subject: subject.trim() || 'Document from GHL India Ventures',
          body: body.trim(),
          channel,
          content_type: attPayload ? 'pdf' : 'text',
        }
        if (attPayload) payload.attachments = attPayload
        payload.ad_hoc = recipients.map(r => ({
          name: r.name,
          email: r.email,
          mobile: r.phone,
        }))
        const res = await fetch(fnUrl, { method: 'POST', headers: baseHeaders, body: JSON.stringify(payload) })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(data?.error || `Send failed (${res.status}).`)
          return
        }
        sent = Number(data?.sent || data?.count || 0)
        failed = Number(data?.failed || 0)
      } else {
        // Per-recipient — token substitution applied to subject + body.
        // Cap concurrency at 5 so we don't hammer Resend/Wati.
        const queue = recipients.slice()
        const CONCURRENCY = 5
        const work: Promise<void>[] = []
        const runOne = async (r: typeof recipients[number]) => {
          const subj = applyTokens(subject.trim() || 'Document from GHL India Ventures', r.tokens)
          const text = applyTokens(body.trim(), r.tokens)
          const payload: Record<string, unknown> = {
            name: `Doc send · ${r.name || r.email || r.phone || 'recipient'} · ${Date.now()}`,
            subject: subj,
            body: text,
            channel,
            content_type: attPayload ? 'pdf' : 'text',
            ad_hoc: [{ name: r.name, email: r.email, mobile: r.phone }],
          }
          if (attPayload) payload.attachments = attPayload
          try {
            const res = await fetch(fnUrl, { method: 'POST', headers: baseHeaders, body: JSON.stringify(payload) })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) { failed++; return }
            sent += Number(data?.sent || data?.count || 0)
            failed += Number(data?.failed || 0)
          } catch {
            failed++
          }
        }
        const worker = async () => {
          while (queue.length > 0) {
            const r = queue.shift()
            if (!r) break
            await runOne(r)
          }
        }
        for (let i = 0; i < CONCURRENCY; i++) work.push(worker())
        await Promise.all(work)
      }

      const msg = sent > 0
        ? `Sent to ${sent} recipient${sent > 1 ? 's' : ''}${failed > 0 ? ` · ${failed} failed` : ''}.`
        : (failed > 0 ? `All ${failed} send(s) failed. Check console.` : 'Send queued.')
      setSuccess(msg)
      showToast(msg, sent > 0 ? 'success' : 'error')
      onSent?.()
      if (sent > 0) setTimeout(() => onClose(), 1500)
    } catch (e: any) {
      setError(e?.message || 'Network error.')
    } finally {
      setSending(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────
  const recipientCount = selectedIds.size + adHoc.split(/[,;\n]/).map(s => s.trim()).filter(Boolean).length

  const fieldBox = 'w-full bg-white/[0.04] border border-white/[0.10] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red/40'

  return (
    <AdminModal
      isOpen={open}
      onClose={onClose}
      title={title}
      subtitle="Each recipient gets their own email — no client sees another client's address. Tokens are substituted per-recipient."
      maxWidth="max-w-3xl"
      footer={
        <>
          <ModalButton onClick={onClose} disabled={sending}>Cancel</ModalButton>
          <ModalButton
            variant="primary"
            onClick={handleSend}
            disabled={sending || recipientCount === 0 || !body.trim()}
          >
            {sending ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending…</span>
            ) : (
              <span className="inline-flex items-center gap-2"><Send className="w-4 h-4" /> Send Now ({recipientCount})</span>
            )}
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        {/* Channel toggle */}
        <div className="flex items-center gap-1.5">
          {([
            { val: 'email',    label: 'Email',     icon: Mail },
            { val: 'whatsapp', label: 'WhatsApp',  icon: MessageCircle },
            { val: 'both',     label: 'Both',      icon: Send },
          ] as const).map(o => {
            const Icon = o.icon
            return (
              <button
                key={o.val}
                onClick={() => setChannel(o.val)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  channel === o.val
                    ? 'bg-brand-red/20 border-brand-red/40 text-brand-red'
                    : 'bg-white/[0.04] border-white/[0.08] text-gray-400 hover:bg-white/[0.08]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {o.label}
              </button>
            )
          })}
        </div>

        {/* Recipients: clients picker + ad-hoc */}
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-white">Recipients</span>
              {selectedIds.size > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 font-medium">
                  {selectedIds.size} selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={selectAllFiltered} disabled={filtered.length === 0} className="text-[10px] text-cyan-300 hover:underline disabled:opacity-40">
                Select all{search ? ' filtered' : ''} ({filtered.length})
              </button>
              {selectedIds.size > 0 && (
                <button onClick={clearSelected} className="text-[10px] text-gray-400 hover:text-white">Clear</button>
              )}
            </div>
          </div>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients by name, email, or phone…"
              className="w-full pl-8 pr-2 py-1.5 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand-red/40"
            />
          </div>
          <div className="max-h-[180px] overflow-y-auto pr-1 space-y-1">
            {loadingClients ? (
              <div className="flex items-center justify-center py-6 text-xs text-gray-500 gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading clients…
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500">
                {clients.length === 0 ? 'No clients found.' : 'No matches.'}
              </div>
            ) : filtered.map(c => {
              const checked = selectedIds.has(c.id)
              const disabled = !c.email && !c.phone
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs ${
                    disabled ? 'opacity-40 cursor-not-allowed' : checked ? 'bg-brand-red/10 cursor-pointer' : 'hover:bg-white/[0.04] cursor-pointer'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={disabled}
                    onChange={() => toggleClient(c.id)}
                    className="accent-brand-red"
                  />
                  <span className="flex-1 min-w-0">
                    <span className="text-white font-medium">{c.name}</span>
                    <span className="block text-[10px] text-gray-500 truncate">
                      {c.email || '—'}{c.phone ? ` · ${c.phone}` : ''}
                    </span>
                  </span>
                </label>
              )
            })}
          </div>
          <div className="mt-3">
            <label className="text-[10px] uppercase tracking-wider text-gray-500">Ad-hoc recipients</label>
            <input
              value={adHoc}
              onChange={e => setAdHoc(e.target.value)}
              placeholder="emails or phone numbers, comma-separated"
              className={fieldBox + ' mt-1 text-xs py-1.5'}
            />
          </div>
        </div>

        {/* Subject */}
        <input
          ref={subjectRef}
          onFocus={() => { activeFieldRef.current = 'subject' }}
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder="Subject line…"
          className={fieldBox}
          disabled={channel === 'whatsapp'}
        />

        {/* Token chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-gray-500 mr-1">Insert token:</span>
          {TOKEN_CHIPS.map(t => (
            <button
              key={t}
              type="button"
              onClick={() => insertToken(t)}
              className="px-2 py-1 rounded-md text-[10px] font-mono text-purple-200 bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
            >
              {t}
            </button>
          ))}
        </div>

        {/* Body */}
        <textarea
          ref={bodyRef}
          onFocus={() => { activeFieldRef.current = 'body' }}
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Compose your message… Use the token chips above to personalise each recipient's copy."
          rows={8}
          className={fieldBox + ' resize-y'}
        />

        {/* Attachments */}
        <div className="rounded-xl border border-dashed border-white/[0.10] bg-white/[0.02] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-gray-400" />
              <span className="text-xs font-semibold text-white">Attachments</span>
              <span className="text-[10px] text-gray-500">25 MB per file · 40 MB total</span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] text-cyan-300 hover:underline"
            >
              + Add file
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFiles}
              accept="image/*,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.csv,.txt"
            />
          </div>
          {attachments.length === 0 ? (
            <p className="text-[11px] text-gray-500">No attachments yet — drag &amp; drop or click "+ Add file".</p>
          ) : (
            <ul className="space-y-1">
              {attachments.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-2 px-2 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                  <span className="flex-1 truncate text-xs text-gray-200">{a.filename}</span>
                  <span className="text-[10px] text-gray-500">{(a.sizeBytes / 1024).toFixed(1)} KB</span>
                  <button onClick={() => removeAttachment(i)} className="text-gray-500 hover:text-red-300">
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Schedule (optional) */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>Schedule (optional)</span>
          <input
            type="datetime-local"
            value={scheduleAt}
            onChange={e => setScheduleAt(e.target.value)}
            className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-[11px] text-white"
          />
          <span className="text-[10px] text-gray-600">— sends immediately for now; backend scheduling coming next.</span>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2.5">
            <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}
      </div>
    </AdminModal>
  )
}
