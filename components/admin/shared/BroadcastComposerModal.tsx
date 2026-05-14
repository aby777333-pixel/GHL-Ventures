'use client'

/* ─────────────────────────────────────────────────────────────
   Broadcast / Email Composer Modal

   Wraps the existing `broadcast-send` Netlify function in a typed
   form. Supports email + WhatsApp + both, audience targeting
   (all leads / specific lead ids / ad-hoc recipients), and the
   five content types the server already handles (text, html,
   image, video, pdf, link, blog).

   Opens via the parent's `open` prop. Also self-mounts when
   `sessionStorage.comms-open-compose` is set to 'broadcast' or
   'email' on first render — this is how the "New Broadcast" and
   "Compose Email" entry points in CommsModule hand the modal off.
   The flag is cleared immediately after consumption.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Mail, MessageCircle, Send, AlertTriangle, CheckCircle2, Paperclip, XCircle } from 'lucide-react'
import AdminModal, { ModalButton } from './AdminModal'
import { getAuthToken } from '@/lib/supabase/client'
import { uploadFile } from '@/lib/supabase/storageService'

// Public bucket used to host broadcast attachments. The broadcast-send
// function emails the URL to the recipient so it must be reachable
// without auth. `marketing-assets` is public and accepts image / video /
// PDF — exactly the content types we support for attachments.
const BROADCAST_ATTACHMENT_BUCKET = 'marketing-assets'

// Map content type → accept attribute on the <input type=file>. Plain
// text and html don't need an upload control at all.
const ACCEPT_BY_CONTENT_TYPE: Record<string, string> = {
  image: 'image/*',
  video: 'video/*',
  pdf: 'application/pdf',
  link: '*/*',
  blog: '*/*',
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
type ContentType = 'text' | 'html' | 'image' | 'video' | 'pdf' | 'link' | 'blog'

export interface BroadcastPrefill {
  name?: string
  subject?: string
  body?: string
  channel?: Channel
  contentType?: ContentType
  attachmentUrl?: string
  /** Recipients to pre-populate the ad-hoc table with. */
  recipients?: string[]
}

interface Props {
  open: boolean
  /** Optional preset — 'email' arrives from the Email Notification tab, 'broadcast' from the Hub header. */
  initialMode?: 'broadcast' | 'email'
  /** Optional pre-filled values (e.g. when the admin clicks Re-send on an existing email log). */
  prefill?: BroadcastPrefill | null
  onClose: () => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  onSent?: () => void
}

export default function BroadcastComposerModal({ open, initialMode = 'broadcast', prefill = null, onClose, showToast, onSent }: Props) {
  const [name, setName] = useState('')
  const [channel, setChannel] = useState<Channel>(initialMode === 'email' ? 'email' : 'email')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [contentType, setContentType] = useState<ContentType>('text')
  const [attachmentUrl, setAttachmentUrl] = useState('')
  const [audience, setAudience] = useState<'all_leads' | 'ad_hoc'>('all_leads')
  const [adHocRows, setAdHocRows] = useState<{ name: string; email: string; mobile: string }[]>([
    { name: '', email: '', mobile: '' },
  ])
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadedFileName, setUploadedFileName] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  // Broadcast Attachments 2026-05-14: real Resend attachments (multi-file,
  // base64-encoded client side) and additional link rows rendered as
  // call-to-action buttons in the email body.
  type ResendAttachment = { filename: string; content: string; contentType?: string; sizeBytes: number }
  const [emailAttachments, setEmailAttachments] = useState<ResendAttachment[]>([])
  const [attachError, setAttachError] = useState('')
  const attachInputRef = useRef<HTMLInputElement>(null)
  const [extraLinks, setExtraLinks] = useState<{ label: string; url: string }[]>([])

  // Reset transient state when the modal closes / opens fresh.
  useEffect(() => {
    if (!open) {
      setName(''); setSubject(''); setBody(''); setContentType('text')
      setAttachmentUrl(''); setAudience('all_leads')
      setAdHocRows([{ name: '', email: '', mobile: '' }])
      setError(''); setSuccess(''); setSending(false)
      setUploading(false); setUploadError(''); setUploadedFileName('')
      setChannel('email')
      setEmailAttachments([]); setAttachError(''); setExtraLinks([])
    } else {
      // Seed from prefill when provided (Re-send flow); otherwise start with
      // the default email channel and let the admin switch channels inside
      // the modal.
      setName(prefill?.name || '')
      setSubject(prefill?.subject || '')
      setBody(prefill?.body || '')
      setContentType(prefill?.contentType || 'text')
      setAttachmentUrl(prefill?.attachmentUrl || '')
      setChannel(prefill?.channel || 'email')
      if (prefill?.recipients && prefill.recipients.length > 0) {
        setAudience('ad_hoc')
        setAdHocRows(prefill.recipients.map(r => ({ name: '', email: r.includes('@') ? r : '', mobile: r.includes('@') ? '' : r })))
      } else {
        setAudience('all_leads')
        setAdHocRows([{ name: '', email: '', mobile: '' }])
      }
      setError(''); setSuccess(''); setSending(false)
    }
  }, [open, initialMode, prefill])

  const isWhatsAppOnly = channel === 'whatsapp'
  const needsSubject = channel === 'email' || channel === 'both'
  const showAttachment = ['image', 'video', 'pdf', 'link', 'blog'].includes(contentType)

  const audienceValid = useMemo(() => {
    if (audience === 'all_leads') return true
    return adHocRows.some(r => r.email.trim() || r.mobile.trim())
  }, [audience, adHocRows])

  // ── Upload attachment ──────────────────────────────────────────
  // Stores the picked file in the public marketing-assets bucket so the
  // emailed URL is openable without auth. broadcast-send already pastes
  // attachment_url into the email body, so once we set attachmentUrl
  // the rest of the flow is unchanged.
  const handleFilePicked: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    setUploadError('')
    const file = e.target.files?.[0]
    e.target.value = '' // allow re-pick of the same file after clear
    if (!file) return

    // Guardrail mirroring the bucket's file_size_limit (~50 MB).
    if (file.size > 50 * 1024 * 1024) {
      setUploadError(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB — bucket limit is 50 MB.`)
      return
    }

    setUploading(true)
    try {
      const res = await uploadFile(file, 'broadcast/attachments', {
        bucket: BROADCAST_ATTACHMENT_BUCKET,
        accessLevel: 'public',
        category: 'marketing',
        tags: ['broadcast-attachment', contentType],
        description: `Attachment for broadcast "${name || subject || 'untitled'}"`,
        trackRecord: false,
      })
      const url = res.file?.url || ''
      if (!res.success || !url) {
        setUploadError(res.error || 'Upload failed.')
        return
      }
      setAttachmentUrl(url)
      setUploadedFileName(file.name)
    } catch (err: any) {
      setUploadError(err?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const clearAttachment = () => {
    setAttachmentUrl('')
    setUploadedFileName('')
    setUploadError('')
  }

  // Broadcast Attachments 2026-05-14: file → base64 helper. Used for real
  // email attachments (forwarded to Resend) — distinct from the embedded
  // media URL above. Strips the data: URI prefix so the function gets a
  // clean base64 payload.
  const readFileAsBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const idx = result.indexOf(',')
      resolve(idx >= 0 ? result.slice(idx + 1) : result)
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })

  const handleAttachmentsPicked: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    setAttachError('')
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return

    const PER_FILE_LIMIT = 25 * 1024 * 1024 // 25 MB — Resend per-file
    const TOTAL_LIMIT = 40 * 1024 * 1024    // 40 MB — Resend total

    const next: ResendAttachment[] = [...emailAttachments]
    let runningBytes = next.reduce((acc, a) => acc + a.sizeBytes, 0)
    for (const f of files) {
      if (f.size > PER_FILE_LIMIT) {
        setAttachError(`"${f.name}" is ${(f.size / 1024 / 1024).toFixed(1)} MB — the per-file limit is 25 MB.`)
        continue
      }
      if (runningBytes + f.size > TOTAL_LIMIT) {
        setAttachError(`Adding "${f.name}" would exceed the 40 MB total attachment limit.`)
        continue
      }
      try {
        const content = await readFileAsBase64(f)
        next.push({ filename: f.name, content, contentType: f.type || undefined, sizeBytes: f.size })
        runningBytes += f.size
      } catch (err: any) {
        setAttachError(err?.message || `Failed to read ${f.name}`)
      }
    }
    setEmailAttachments(next)
  }

  const removeAttachment = (idx: number) => {
    setEmailAttachments(prev => prev.filter((_, i) => i !== idx))
    if (attachError) setAttachError('')
  }

  const handleSend = async () => {
    setError(''); setSuccess('')

    if (!name.trim()) { setError('Campaign label is required.'); return }
    if (needsSubject && !subject.trim()) { setError('Subject is required for email broadcasts.'); return }
    if (!body.trim()) { setError('Message body is required.'); return }
    if (!audienceValid) { setError('Add at least one ad-hoc recipient or pick "All leads".'); return }

    try {
      setSending(true)
      const token = await getAuthToken()
      if (!token) { setError('Your admin session has expired. Please sign in again.'); setSending(false); return }

      const payload: Record<string, unknown> = {
        name: name.trim(),
        body: body.trim(),
        channel,
        content_type: contentType,
      }
      if (needsSubject) payload.subject = subject.trim()
      if (showAttachment && attachmentUrl.trim()) payload.attachment_url = attachmentUrl.trim()
      // Broadcast Attachments 2026-05-14: ship real file attachments (Resend
      // forwards as MIME parts) and any additional links rendered as buttons.
      if (emailAttachments.length > 0) {
        payload.attachments = emailAttachments.map(a => ({
          filename: a.filename,
          content: a.content,
          contentType: a.contentType,
        }))
      }
      const cleanLinks = extraLinks
        .map(l => ({ label: l.label.trim() || undefined, url: l.url.trim() }))
        .filter(l => !!l.url)
      if (cleanLinks.length > 0) payload.links = cleanLinks
      if (audience === 'all_leads') payload.all_leads = true
      else payload.ad_hoc = adHocRows
        .map(r => ({ name: r.name.trim() || undefined, email: r.email.trim() || undefined, mobile: r.mobile.trim() || undefined }))
        .filter(r => r.email || r.mobile)

      const res = await fetch(`${getFunctionBase()}/.netlify/functions/broadcast-send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data?.error || `Send failed (${res.status}). Check console for details.`)
        return
      }
      const sentCount = Number(data?.sent || data?.count || 0)
      const failed = Number(data?.failed || 0)
      const msg = sentCount > 0
        ? `Broadcast sent to ${sentCount} recipient${sentCount > 1 ? 's' : ''}${failed > 0 ? ` (${failed} failed)` : ''}.`
        : 'Broadcast queued.'
      setSuccess(msg)
      showToast(msg, 'success')
      onSent?.()
      // Auto-close after a short pause so the success toast remains visible.
      setTimeout(() => onClose(), 1200)
    } catch (err: any) {
      setError(err?.message || 'Network error.')
    } finally {
      setSending(false)
    }
  }

  return (
    <AdminModal
      isOpen={open}
      onClose={onClose}
      title={
        channel === 'whatsapp' ? 'New WhatsApp Broadcast'
        : channel === 'both' ? 'New Email + WhatsApp Broadcast'
        : initialMode === 'email' ? 'Compose Email'
        : 'New Email Broadcast'
      }
      subtitle="Sends via Resend (email) and/or Wati (WhatsApp). Audience and content type are server-validated."
      maxWidth="max-w-2xl"
      footer={
        <>
          <ModalButton onClick={onClose} disabled={sending}>Cancel</ModalButton>
          <ModalButton variant="primary" onClick={handleSend} disabled={sending}>
            {sending ? (
              <span className="inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending…</span>
            ) : (
              <span className="inline-flex items-center gap-2"><Send className="w-4 h-4" /> Send Broadcast</span>
            )}
          </ModalButton>
        </>
      }
    >
      <div className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-200">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200">
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Campaign label */}
        <Labelled label="Campaign label *" hint="Used internally to find this broadcast later.">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. June Newsletter — Active Investors" className={inputCls} />
        </Labelled>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Labelled label="Channel">
            <div className="grid grid-cols-3 gap-2">
              {([['email', 'Email', Mail], ['whatsapp', 'WhatsApp', MessageCircle], ['both', 'Both', Send]] as const).map(([id, label, Icon]) => {
                const active = channel === id
                return (
                  <button key={id} type="button" onClick={() => setChannel(id)}
                    className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium border transition-colors ${
                      active ? 'bg-brand-red/15 text-white border-brand-red/40' : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                )
              })}
            </div>
          </Labelled>

          <Labelled label="Content type">
            <select value={contentType} onChange={e => setContentType(e.target.value as ContentType)} className={inputCls}>
              <option value="text">Plain text</option>
              <option value="html">HTML (raw)</option>
              <option value="image">Text + Image</option>
              <option value="video">Text + Video</option>
              <option value="pdf">Text + PDF</option>
              <option value="link">Text + Link</option>
              <option value="blog">Text + Blog</option>
            </select>
          </Labelled>
        </div>

        {needsSubject && (
          <Labelled label="Email subject *">
            <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Monthly Portfolio Update — June 2026" className={inputCls} />
          </Labelled>
        )}

        <Labelled label="Body *" hint={contentType === 'html' ? 'HTML allowed — raw HTML is rendered as-is.' : 'Newlines are preserved.'}>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={8}
            placeholder={contentType === 'html' ? '<p>Hello {{name}},</p>' : 'Hello {{name}},\n\nYour debenture interest for June has been credited.'}
            className={inputCls + ' resize-none font-mono text-[12px]'} />
        </Labelled>

        {showAttachment && (
          <Labelled
            label="Attachment / link URL"
            hint={
              ['link', 'blog'].includes(contentType)
                ? 'Paste the article / external link URL.'
                : 'Upload the file (it lands in the public marketing-assets bucket) or paste a public URL the recipient can open.'
            }
          >
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  value={attachmentUrl}
                  onChange={e => { setAttachmentUrl(e.target.value); if (uploadedFileName) setUploadedFileName('') }}
                  placeholder="https://…"
                  className={inputCls + ' flex-1'}
                />
                {!['link', 'blog'].includes(contentType) && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ACCEPT_BY_CONTENT_TYPE[contentType] || '*/*'}
                      onChange={handleFilePicked}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors disabled:opacity-60"
                    >
                      {uploading
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
                        : <><Paperclip className="w-3.5 h-3.5" /> Upload {contentType === 'pdf' ? 'PDF' : contentType === 'image' ? 'Image' : contentType === 'video' ? 'Video' : 'File'}</>
                      }
                    </button>
                  </>
                )}
              </div>

              {/* Status: uploaded file name + clear, OR upload error */}
              {uploadedFileName && !uploadError && (
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-200">
                  <span className="inline-flex items-center gap-1.5 truncate">
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">Uploaded: {uploadedFileName}</span>
                  </span>
                  <button type="button" onClick={clearAttachment} className="text-emerald-300 hover:text-white" title="Remove attachment">
                    <XCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              {uploadError && (
                <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-200">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {uploadError}
                </div>
              )}
            </div>
          </Labelled>
        )}

        {/* Broadcast Attachments 2026-05-14: real Resend attachments. Works
            for any content type so admins can attach a brochure + an image
            alongside a plain-text body. Resend limits: 25 MB / file, 40 MB
            total — enforced here AND in broadcast-send.ts. */}
        {!isWhatsAppOnly && (
          <Labelled
            label="Email Attachments"
            hint="Attach files (images, PDFs, etc.) directly to the email. Limit: 25 MB per file · 40 MB total."
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  ref={attachInputRef}
                  type="file"
                  multiple
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip"
                  onChange={handleAttachmentsPicked}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => attachInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5" /> Add files
                </button>
                {emailAttachments.length > 0 && (
                  <span className="text-[10px] text-gray-400">
                    {emailAttachments.length} file{emailAttachments.length === 1 ? '' : 's'}
                    {' · '}
                    {(emailAttachments.reduce((acc, a) => acc + a.sizeBytes, 0) / 1024 / 1024).toFixed(1)} MB
                  </span>
                )}
              </div>

              {emailAttachments.length > 0 && (
                <ul className="space-y-1">
                  {emailAttachments.map((a, i) => (
                    <li key={i} className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-[11px] text-gray-200">
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <Paperclip className="w-3 h-3 flex-shrink-0 text-gray-500" />
                        <span className="truncate">{a.filename}</span>
                        <span className="text-gray-500 shrink-0">· {(a.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="text-gray-400 hover:text-red-400"
                        title="Remove attachment"
                        aria-label={`Remove ${a.filename}`}
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {attachError && (
                <div className="flex items-start gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-[11px] text-red-200">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /> {attachError}
                </div>
              )}
            </div>
          </Labelled>
        )}

        {/* Additional Links — rendered as call-to-action buttons inside the
            email body. WhatsApp recipients receive the URLs appended to the
            text body (one per line). */}
        <Labelled
          label="Additional Links"
          hint="Optional buttons added to the email body — e.g. a Calendly link, brochure URL, or article."
        >
          <div className="space-y-2">
            {extraLinks.length === 0 ? (
              <p className="text-[11px] italic text-gray-500">No links yet. Click &quot;Add link&quot; to include one.</p>
            ) : (
              extraLinks.map((l, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto] gap-2">
                  <input
                    value={l.label}
                    onChange={e => setExtraLinks(prev => prev.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                    placeholder="Button label (optional)"
                    className={inputCls}
                  />
                  <input
                    value={l.url}
                    onChange={e => setExtraLinks(prev => prev.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                    placeholder="https://…"
                    className={inputCls}
                    type="url"
                  />
                  <button
                    type="button"
                    onClick={() => setExtraLinks(prev => prev.filter((_, j) => j !== i))}
                    className="px-3 py-2 rounded-xl text-xs text-gray-400 bg-white/[0.04] border border-white/[0.06] hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
            <button
              type="button"
              onClick={() => setExtraLinks(prev => [...prev, { label: '', url: '' }])}
              className="text-[11px] text-brand-red hover:underline"
            >
              + Add link
            </button>
          </div>
        </Labelled>

        <Labelled label="Audience">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button type="button" onClick={() => setAudience('all_leads')}
              className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                audience === 'all_leads' ? 'bg-brand-red/15 text-white border-brand-red/40' : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >All leads (broadcast list)</button>
            <button type="button" onClick={() => setAudience('ad_hoc')}
              className={`py-2 rounded-xl text-xs font-medium border transition-colors ${
                audience === 'ad_hoc' ? 'bg-brand-red/15 text-white border-brand-red/40' : 'bg-white/[0.03] text-gray-400 border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >Ad-hoc recipients</button>
          </div>

          {audience === 'ad_hoc' && (
            <div className="space-y-2">
              {adHocRows.map((r, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input value={r.name} onChange={e => setAdHocRows(rows => rows.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Name (optional)" className={inputCls} />
                  <input value={r.email} onChange={e => setAdHocRows(rows => rows.map((x, j) => j === i ? { ...x, email: e.target.value } : x))} placeholder="Email" className={inputCls} type="email" />
                  <input value={r.mobile} onChange={e => setAdHocRows(rows => rows.map((x, j) => j === i ? { ...x, mobile: e.target.value } : x))} placeholder="Mobile (+91…)" className={inputCls} type="tel" />
                </div>
              ))}
              <button type="button" onClick={() => setAdHocRows(rows => [...rows, { name: '', email: '', mobile: '' }])}
                className="text-[11px] text-brand-red hover:underline">+ Add another recipient</button>
            </div>
          )}
        </Labelled>
      </div>
    </AdminModal>
  )
}

const inputCls = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20'

function Labelled({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-gray-300 mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[10px] text-gray-500">{hint}</p>}
    </div>
  )
}
