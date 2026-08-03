'use client'

/* ─────────────────────────────────────────────────────────────
   Blog CMS — post editor

   Create / edit / preview / publish / unpublish / schedule /
   archive / delete, with autosave, revision history, SEO panel
   with live search + social previews, media pickers and internal
   link suggestions.

   Scheduling is entered and displayed in IST (Asia/Kolkata) and
   stored as an absolute timestamptz, so the publish moment is
   unambiguous regardless of where the server runs.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Save, Send, EyeOff, Clock, Archive, Trash2, ExternalLink, Loader2,
  ArrowLeft, ImagePlus, X, History, RotateCcw, Search as SearchIcon,
  Link2, Sparkles, ChevronDown, ChevronUp, Star, Bookmark, MessageSquare,
  Copy, AlertTriangle, Check,
} from 'lucide-react'
import RichTextEditor, { sanitizeEditorHtml } from './RichTextEditor'
import MediaLibrary from './MediaLibrary'
import {
  createPost, updatePost, setPostStatus, trashPost, autosavePost, clearAutosave,
  listRevisions, restoreRevision, suggestInternalLinks, slugify, estimateReadTime,
  duplicatePost, listCategoriesAdmin, listAuthorsAdmin,
} from '@/lib/blog/adminService'
import type { CmsPost, CmsCategory, CmsAuthor } from '@/lib/blog/cmsService'

const SITE_URL = 'https://ghlindiaventures.com'
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000

function istLocalToUtcIso(local: string): string | null {
  if (!local) return null
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return null
  const [, y, mo, d, h, mi] = m.map(Number) as unknown as number[]
  return new Date(Date.UTC(y, mo - 1, d, h, mi) - IST_OFFSET_MS).toISOString()
}

function utcIsoToIstLocal(iso?: string | null): string {
  if (!iso) return ''
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return ''
  return new Date(dt.getTime() + IST_OFFSET_MS).toISOString().slice(0, 16)
}

function istLabel(iso?: string | null): string {
  if (!iso) return ''
  const dt = new Date(iso)
  if (Number.isNaN(dt.getTime())) return ''
  return `${dt.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' })} IST`
}

const EMPTY: Partial<CmsPost> = {
  title: '', slug: '', subtitle: '', excerpt: '', content: '', content_format: 'html',
  category_id: null, author_id: null, tags: [], cover_image: null, thumbnail_image: null,
  og_image: null, gallery: [], video_url: null, status: 'draft', featured: false,
  editors_pick: false, allow_comments: true, noindex: false, canonical_url: null,
  meta_title: '', meta_description: '', meta_keywords: '',
}

/* Collapsible sidebar panel.

   Defined at module scope, NOT inside PostEditor. When it lived inside the
   component it got a fresh function identity on every render, so React saw a
   different component type each time and tore down + rebuilt the whole panel
   subtree — which destroyed the button being clicked before its handler could
   settle. That is why "Choose from library" appeared to do nothing. */
function Panel({
  id, title, icon: Icon, open, onToggle, children,
}: {
  id: string
  title: string
  icon: React.ElementType
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`panel-${id}`}
        className="w-full flex justify-between items-center gap-2 px-4 py-3 text-left hover:bg-white/5 transition-colors"
      >
        <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/70">
          <Icon className="w-3.5 h-3.5 text-brand-red" /> {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-white/40" /> : <ChevronDown className="w-4 h-4 text-white/40" />}
      </button>
      {open && <div id={`panel-${id}`} className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

interface Props {
  postId: string | null
  onBack: () => void
  onSaved: (post: CmsPost) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
  initialPost?: CmsPost | null
  canDelete: boolean
}

export default function PostEditor({ postId, onBack, onSaved, showToast, initialPost, canDelete }: Props) {
  const [form, setForm] = useState<Partial<CmsPost>>(initialPost || EMPTY)
  const [id, setId] = useState<string | null>(postId)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(!!initialPost)

  const [categories, setCategories] = useState<CmsCategory[]>([])
  const [authors, setAuthors] = useState<CmsAuthor[]>([])
  const [tagInput, setTagInput] = useState('')

  const [picker, setPicker] = useState<null | { onPick: (url: string, alt: string) => void }>(null)
  const [scheduleAt, setScheduleAt] = useState(utcIsoToIstLocal(initialPost?.scheduled_at))
  const [revisions, setRevisions] = useState<any[]>([])
  const [showRevisions, setShowRevisions] = useState(false)
  const [links, setLinks] = useState<{ slug: string; title: string; reason: string }[]>([])
  const [openPanel, setOpenPanel] = useState<string | null>('seo')
  const [copied, setCopied] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const titleRef = useRef<HTMLInputElement>(null)
  const excerptRef = useRef<HTMLTextAreaElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isComponentPost = form.content_format === 'component'

  // ── load reference data ──────────────────────────────────
  useEffect(() => {
    let alive = true
    Promise.all([listCategoriesAdmin(), listAuthorsAdmin()]).then(([c, a]) => {
      if (!alive) return
      setCategories(c); setAuthors(a)
    })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    if (!id) return
    listRevisions(id).then(setRevisions)
  }, [id])

  // ── warn before losing unsaved work ──────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return
      e.preventDefault(); e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  // ── autosave the body every 20s while dirty ──────────────
  useEffect(() => {
    if (!id || !dirty) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      autosavePost(id, form.content || '')
      setLastSaved(`Draft autosaved ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`)
    }, 20_000)
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current) }
  }, [id, dirty, form.content])

  const set = useCallback(<K extends keyof CmsPost>(key: K, value: any) => {
    setForm((f) => ({ ...f, [key]: value }))
    setDirty(true)
    setErrors((prev) => {
      if (!prev[key as string]) return prev
      const next = { ...prev }
      delete next[key as string]
      return next
    })
  }, [])

  // auto-slug from title until the slug is edited by hand
  useEffect(() => {
    if (slugTouched || !form.title) return
    setForm((f) => ({ ...f, slug: slugify(String(f.title || '')) }))
  }, [form.title, slugTouched])

  const wordCount = useMemo(
    () => String(form.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length,
    [form.content],
  )

  /** Plain text of the body, so `<p><br></p>` from the editor does not
   *  count as content. */
  const bodyText = useMemo(
    () => String(form.content || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
    [form.content],
  )

  /** Required fields differ by intent: a draft only needs a headline, but
   *  going live also needs a body. Returns a field → message map. */
  function validate(intent: 'draft' | 'live'): Record<string, string> {
    const e: Record<string, string> = {}
    if (!String(form.title || '').trim()) e.title = 'A headline is required.'
    if (intent === 'live' && !isComponentPost && !bodyText) {
      e.content = 'Write the article body before publishing.'
    }
    return e
  }

  function focusFirstError(e: Record<string, string>) {
    if (e.title) { titleRef.current?.focus(); titleRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    if (e.excerpt) { excerptRef.current?.focus(); excerptRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); return }
    if (e.content) bodyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // ── save ─────────────────────────────────────────────────
  async function save(nextStatus?: CmsPost['status']): Promise<CmsPost | null> {
    const intent: 'draft' | 'live' =
      nextStatus === 'published' || nextStatus === 'scheduled' ? 'live' : 'draft'

    const errs = validate(intent)
    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      const list = Object.values(errs)
      showToast(
        list.length === 1
          ? list[0]
          : `${list.length} fields need attention before ${intent === 'live' ? 'publishing' : 'saving'}.`,
        'error',
      )
      focusFirstError(errs)
      return null
    }

    setSaving(true)

    const payload: Partial<CmsPost> = {
      ...form,
      content: isComponentPost ? form.content : sanitizeEditorHtml(String(form.content || '')),
      slug: slugify(String(form.slug || form.title || '')),
      read_time: estimateReadTime(String(form.content || '')) || form.read_time || 5,
      ...(nextStatus ? { status: nextStatus } : {}),
    }

    if (nextStatus === 'scheduled') {
      const iso = istLocalToUtcIso(scheduleAt)
      if (!iso) { setSaving(false); showToast('Pick a date and time to schedule.', 'error'); return null }
      if (new Date(iso).getTime() <= Date.now()) {
        setSaving(false); showToast('Scheduled time must be in the future.', 'error'); return null
      }
      payload.scheduled_at = iso
      payload.published_at = null
    }
    if (nextStatus === 'published') payload.scheduled_at = null

    const res = id ? await updatePost(id, payload) : await createPost(payload)
    setSaving(false)

    if (!res.ok || !res.data) { showToast(res.message || 'Could not save.', 'error'); return null }

    setId(res.data.id)
    setForm(res.data)
    setDirty(false)
    setLastSaved(`Saved ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`)
    clearAutosave(res.data.id)
    listRevisions(res.data.id).then(setRevisions)
    onSaved(res.data)

    const verb = nextStatus === 'published' ? 'published'
      : nextStatus === 'scheduled' ? `scheduled for ${istLabel(payload.scheduled_at)}`
      : nextStatus === 'draft' ? 'unpublished'
      : nextStatus === 'archived' ? 'archived' : 'saved'
    showToast(`Article ${verb}.`, 'success')
    return res.data
  }

  async function onTrash() {
    if (!id) return
    if (!window.confirm('Move this article to trash? It can be restored from the Trash tab for 30 days.')) return
    const res = await trashPost(id)
    if (res.ok) { showToast('Moved to trash.', 'success'); onBack() }
    else showToast(res.message || 'Could not delete.', 'error')
  }

  async function onDuplicate() {
    if (!id) return
    const res = await duplicatePost(id)
    if (res.ok && res.data) { showToast('Duplicated as a new draft.', 'success'); onSaved(res.data) }
    else showToast(res.message || 'Could not duplicate.', 'error')
  }

  async function loadLinkSuggestions() {
    const s = await suggestInternalLinks({
      id: id || undefined,
      title: String(form.title || ''),
      content: String(form.content || ''),
      category_id: form.category_id,
      tags: form.tags,
    })
    setLinks(s)
    if (!s.length) showToast('No obvious internal links to suggest yet.', 'info')
  }

  async function onRestoreRevision(revId: string) {
    if (!id) return
    if (!window.confirm('Restore this revision? The current version is saved to history first.')) return
    const res = await restoreRevision(id, revId)
    if (!res.ok) { showToast(res.message || 'Restore failed.', 'error'); return }
    showToast('Revision restored.', 'success')
    const { getPostById } = await import('@/lib/blog/adminService')
    const fresh = await getPostById(id)
    if (fresh) { setForm(fresh); setDirty(false) }
    listRevisions(id).then(setRevisions)
  }

  const previewUrl = id ? `${SITE_URL}/blog/${form.slug}` : ''
  const metaTitle = String(form.meta_title || form.title || '')
  const metaDesc = String(form.meta_description || form.excerpt || '')

  const statusChip: Record<string, string> = {
    draft: 'bg-white/10 text-white/70',
    scheduled: 'bg-amber-500/15 text-amber-300 border border-amber-500/25',
    published: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/25',
    archived: 'bg-white/5 text-white/40 border border-white/10',
  }

  const inputCls = 'cms-select w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-red transition-colors'
  const labelCls = 'block text-[11px] font-semibold uppercase tracking-wider text-white/45 mb-1.5'

  return (
    <div className="pb-24">
      {/* ── sticky action bar ─────────────────────────────── */}
      <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-[#0B090A]/95 backdrop-blur border-b border-white/10 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={onBack} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors" title="Back to all posts">
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">
              {form.title || 'Untitled article'}
            </p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${statusChip[String(form.status)] || statusChip.draft}`}>
                {form.status}
              </span>
              {form.status === 'scheduled' && form.scheduled_at && (
                <span className="text-[10px] text-amber-300/70">→ {istLabel(form.scheduled_at)}</span>
              )}
              {Object.keys(errors).length > 0 && (
                <span className="text-[10px] text-red-400 inline-flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {Object.keys(errors).length} field{Object.keys(errors).length === 1 ? '' : 's'} need attention
                </span>
              )}
              {dirty && <span className="text-[10px] text-amber-300">Unsaved changes</span>}
              {!dirty && lastSaved && <span className="text-[10px] text-white/30">{lastSaved}</span>}
              <span className="text-[10px] text-white/25">{wordCount.toLocaleString('en-IN')} words</span>
            </div>
          </div>

          {id && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
              title={form.status === 'published' ? 'Open the live article' : 'Preview — drafts render for admins via the direct URL'}
            >
              <ExternalLink className="w-3.5 h-3.5" /> Preview
            </a>
          )}

          <button
            onClick={() => save()}
            disabled={saving}
            className="px-3 py-2 rounded-lg border border-white/10 text-white/80 hover:bg-white/10 disabled:opacity-50 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save draft
          </button>

          {form.status === 'published' ? (
            <button
              onClick={() => save('draft')}
              disabled={saving}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <EyeOff className="w-3.5 h-3.5" /> Unpublish
            </button>
          ) : (
            <button
              onClick={() => save('published')}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-brand-red hover:bg-brand-red-deep disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Send className="w-3.5 h-3.5" /> Publish
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_22rem] gap-6 items-start">
        {/* ── main column ─────────────────────────────────── */}
        <div className="min-w-0 space-y-4">
          <div>
            <input
              ref={titleRef}
              value={String(form.title || '')}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Article headline *"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'err-title' : undefined}
              className={`w-full px-0 py-1 bg-transparent border-0 border-b text-2xl font-bold text-white placeholder-white/20 focus:outline-none transition-colors ${
                errors.title ? 'border-red-500' : 'border-white/10 focus:border-brand-red'
              }`}
            />
            {errors.title && (
              <p id="err-title" className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.title}
              </p>
            )}
          </div>

          <input
            value={String(form.subtitle || '')}
            onChange={(e) => set('subtitle', e.target.value)}
            placeholder="Standfirst / subtitle (optional)"
            className="w-full px-0 py-1 bg-transparent border-0 text-base text-white/70 placeholder-white/20 focus:outline-none"
          />

          <div className="flex items-center gap-2 text-xs text-white/40 flex-wrap">
            <span className="text-white/30">{SITE_URL}/blog/</span>
            <input
              value={String(form.slug || '')}
              onChange={(e) => { setSlugTouched(true); set('slug', e.target.value) }}
              placeholder="url-slug"
              className="flex-1 min-w-[12rem] px-2 py-1 rounded bg-white/5 border border-white/10 text-white font-mono text-xs focus:outline-none focus:border-brand-red"
            />
            {initialPost?.slug && form.slug !== initialPost.slug && (
              <span className="text-[10px] text-amber-300 inline-flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> a 301 from the old URL is created automatically
              </span>
            )}
          </div>

          <div>
            <label className={labelCls}>Excerpt / summary</label>
            <textarea
              ref={excerptRef}
              value={String(form.excerpt || '')}
              onChange={(e) => set('excerpt', e.target.value)}
              rows={2}
              placeholder="One or two sentences shown on cards, search results and social shares."
              className={`${inputCls} resize-y`}
            />
          </div>

          {isComponentPost ? (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-white/70 space-y-2">
                  <p className="font-semibold text-white">This article is rendered by a custom-built page.</p>
                  <p>
                    Its body lives in the component <code className="text-amber-300">{form.legacy_component}</code>,
                    which contains bespoke charts and tables that the standard editor cannot reproduce.
                    Everything else here — headline, summary, category, SEO, featured status, scheduling —
                    is fully editable and takes effect immediately.
                  </p>
                  <p className="text-white/45 text-xs">
                    To move the body into the editor, clear the format below. The custom layout will be replaced
                    by standard rich text, so only do this if you intend to rewrite it.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm('Convert to a standard editable article? The bespoke layout will no longer be used.')) return
                      set('content_format', 'html'); set('legacy_component', null)
                    }}
                    className="text-xs font-semibold text-amber-300 hover:underline"
                  >
                    Convert to standard article
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between gap-3 mb-1.5 flex-wrap">
                <label className={`${labelCls} mb-0`}>Article body *</label>
                {form.content_format === 'paragraphs' && (
                  <span className="text-[10px] text-white/35">
                    Plain-text article — saving from the editor upgrades it to rich text.
                  </span>
                )}
              </div>
              <div ref={bodyRef} className={errors.content ? 'rounded-xl ring-1 ring-red-500' : undefined}>
                <RichTextEditor
                  value={String(form.content || '')}
                  onChange={(html) => {
                    set('content', html)
                    if (form.content_format === 'paragraphs') set('content_format', 'html')
                  }}
                  onRequestMedia={(insert) => setPicker({ onPick: (url, alt) => { insert(url, alt); setPicker(null) } })}
                />
              </div>
              {errors.content && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {errors.content}
                </p>
              )}
            </div>
          )}

          {/* internal links */}
          <Panel id="links" title="Internal link suggestions" icon={Link2} open={openPanel === 'links'} onToggle={() => setOpenPanel(openPanel === 'links' ? null : 'links')}>
            <button
              type="button"
              onClick={loadLinkSuggestions}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" /> Suggest links for this article
            </button>
            {links.length > 0 && (
              <ul className="space-y-2 mt-2">
                {links.map((l) => (
                  <li key={l.slug} className="flex items-start justify-between gap-3 p-2.5 rounded-lg bg-white/5">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white truncate">{l.title}</p>
                      <p className="text-[10px] text-white/35">{l.reason}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        set('content', `${form.content || ''}\n<p>Related reading: <a href="/blog/${l.slug}">${l.title}</a></p>`)
                        showToast('Link appended to the end of the article — move it where it fits.', 'info')
                      }}
                      className="text-[10px] font-semibold text-brand-red hover:underline whitespace-nowrap flex-shrink-0"
                    >
                      Insert
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        {/* ── sidebar ─────────────────────────────────────── */}
        <aside className="space-y-3">
          {/* publishing */}
          <Panel id="publish" title="Publishing" icon={Send} open={openPanel === 'publish'} onToggle={() => setOpenPanel(openPanel === 'publish' ? null : 'publish')}>
            <div>
              <label className={labelCls}>Schedule for (IST)</label>
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
                className={inputCls}
              />
              <button
                type="button"
                onClick={() => save('scheduled')}
                disabled={saving || !scheduleAt}
                className="mt-2 w-full px-3 py-2 rounded-lg bg-amber-500/15 border border-amber-500/25 text-amber-200 hover:bg-amber-500/25 disabled:opacity-40 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Clock className="w-3.5 h-3.5" /> Schedule publication
              </button>
              <p className="mt-1.5 text-[10px] text-white/30">
                Scheduled posts go live automatically within a minute of the chosen time.
              </p>
            </div>

            <div className="pt-2 border-t border-white/10 space-y-2">
              <button
                type="button"
                onClick={() => save('archived')}
                disabled={saving}
                className="w-full px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/10 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Archive className="w-3.5 h-3.5" /> Archive
              </button>
              {id && (
                <button
                  type="button"
                  onClick={onDuplicate}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/10 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Copy className="w-3.5 h-3.5" /> Duplicate
                </button>
              )}
              {id && canDelete && (
                <button
                  type="button"
                  onClick={onTrash}
                  className="w-full px-3 py-2 rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Move to trash
                </button>
              )}
            </div>
          </Panel>

          {/* organisation */}
          <Panel id="organise" title="Organisation" icon={Bookmark} open={openPanel === 'organise'} onToggle={() => setOpenPanel(openPanel === 'organise' ? null : 'organise')}>
            <div>
              <label className={labelCls}>Category</label>
              <select
                value={form.category_id || ''}
                onChange={(e) => {
                  const cid = e.target.value || null
                  set('category_id', cid)
                  const c = categories.find((x) => x.id === cid)
                  set('category', c?.name || null)
                }}
                className={inputCls}
              >
                <option value="" className="bg-[#161A1D]">— none —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#161A1D]">
                    {c.parent_id ? '— ' : ''}{c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Author</label>
              <select
                value={form.author_id || ''}
                onChange={(e) => {
                  const aid = e.target.value || null
                  set('author_id', aid)
                  const a = authors.find((x) => x.id === aid)
                  set('author', a?.name || null)
                }}
                className={inputCls}
              >
                <option value="" className="bg-[#161A1D]">— none —</option>
                {authors.map((a) => <option key={a.id} value={a.id} className="bg-[#161A1D]">{a.name}</option>)}
              </select>
            </div>

            <div>
              <label className={labelCls}>Tags</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(form.tags || []).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-brand-red/15 text-brand-red text-[11px]">
                    {t}
                    <button
                      type="button"
                      onClick={() => set('tags', (form.tags || []).filter((x) => x !== t))}
                      className="hover:text-white"
                      aria-label={`Remove ${t}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    const v = tagInput.trim().replace(/,$/, '')
                    if (v && !(form.tags || []).includes(v)) set('tags', [...(form.tags || []), v])
                    setTagInput('')
                  }
                }}
                placeholder="Type a tag and press Enter"
                className={inputCls}
              />
            </div>

            <div className="space-y-2 pt-1">
              {([
                ['featured', 'Featured article', Star],
                ['editors_pick', "Editor's pick", Bookmark],
                ['allow_comments', 'Allow comments', MessageSquare],
              ] as const).map(([key, label, Icon]) => (
                <label key={key} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form[key]}
                    onChange={(e) => set(key as any, e.target.checked)}
                    className="w-4 h-4 rounded accent-[#BA181B]"
                  />
                  <Icon className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-xs text-white/70">{label}</span>
                </label>
              ))}
            </div>
          </Panel>

          {/* media */}
          <Panel id="media" title="Images & video" icon={ImagePlus} open={openPanel === 'media'} onToggle={() => setOpenPanel(openPanel === 'media' ? null : 'media')}>
            {([
              ['cover_image', 'Featured image'],
              ['thumbnail_image', 'Thumbnail (card)'],
              ['og_image', 'Social share image'],
            ] as const).map(([key, label]) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                {form[key] ? (
                  <div className="relative rounded-lg overflow-hidden border border-white/10 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={String(form[key])} alt={label} className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => set(key as any, null)}
                      className="absolute top-1 right-1 p-1 rounded bg-black/70 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`Remove ${label}`}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPicker({ onPick: (url) => { set(key as any, url); setPicker(null) } })}
                    className="w-full py-4 rounded-lg border border-dashed border-white/15 text-white/40 hover:text-white hover:border-brand-red text-xs inline-flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <ImagePlus className="w-4 h-4" /> Choose from library
                  </button>
                )}
              </div>
            ))}
            <div>
              <label className={labelCls}>Video embed URL</label>
              <input
                value={String(form.video_url || '')}
                onChange={(e) => set('video_url', e.target.value || null)}
                placeholder="https://www.youtube.com/embed/…"
                className={inputCls}
              />
            </div>
          </Panel>

          {/* SEO */}
          <Panel id="seo" title="SEO & social" icon={SearchIcon} open={openPanel === 'seo'} onToggle={() => setOpenPanel(openPanel === 'seo' ? null : 'seo')}>
            <div>
              <label className={labelCls}>
                SEO title <span className={metaTitle.length > 60 ? 'text-amber-300' : 'text-white/25'}>({metaTitle.length}/60)</span>
              </label>
              <input
                value={String(form.meta_title || '')}
                onChange={(e) => set('meta_title', e.target.value)}
                placeholder={String(form.title || 'Page title for Google')}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>
                Meta description <span className={metaDesc.length > 160 ? 'text-amber-300' : 'text-white/25'}>({metaDesc.length}/160)</span>
              </label>
              <textarea
                value={String(form.meta_description || '')}
                onChange={(e) => set('meta_description', e.target.value)}
                rows={3}
                placeholder={String(form.excerpt || 'Description shown under the title in search results')}
                className={`${inputCls} resize-y`}
              />
            </div>
            <div>
              <label className={labelCls}>Focus keywords</label>
              <input
                value={String(form.meta_keywords || '')}
                onChange={(e) => set('meta_keywords', e.target.value)}
                placeholder="category ii aif, stressed real estate india"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Canonical URL</label>
              <input
                value={String(form.canonical_url || '')}
                onChange={(e) => set('canonical_url', e.target.value || null)}
                placeholder={`${SITE_URL}/blog/${form.slug || 'slug'}`}
                className={inputCls}
              />
              <p className="mt-1 text-[10px] text-white/30">
                Leave blank to use the default. Both domains already point search engines here.
              </p>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={!!form.noindex}
                onChange={(e) => set('noindex', e.target.checked)}
                className="w-4 h-4 rounded accent-[#BA181B]"
              />
              <span className="text-xs text-white/70">Hide from search engines (noindex)</span>
            </label>

            {/* google preview */}
            <div className="pt-2 border-t border-white/10">
              <p className={labelCls}>Google preview</p>
              <div className="rounded-lg bg-white p-3">
                <p className="text-[11px] text-[#202124] truncate">{SITE_URL}/blog/{form.slug || 'slug'}</p>
                <p className="text-[15px] text-[#1a0dab] leading-snug truncate">{metaTitle || 'Article title'}</p>
                <p className="text-[12px] text-[#4d5156] leading-snug blog-clamp-2">
                  {metaDesc || 'Add a meta description to control what appears here.'}
                </p>
              </div>
            </div>

            {/* social preview */}
            <div>
              <p className={labelCls}>Social share preview</p>
              <div className="rounded-lg overflow-hidden border border-white/10 bg-white">
                {(form.og_image || form.cover_image) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={String(form.og_image || form.cover_image)} alt="" className="w-full h-28 object-cover" />
                ) : (
                  <div className="w-full h-28 bg-gray-200 flex items-center justify-center text-[11px] text-gray-500">
                    No share image set
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-gray-400">ghlindiaventures.com</p>
                  <p className="text-[13px] font-semibold text-gray-900 blog-clamp-2 leading-snug">{metaTitle || 'Article title'}</p>
                  <p className="text-[11px] text-gray-500 blog-clamp-2">{metaDesc}</p>
                </div>
              </div>
            </div>

            {id && (
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(previewUrl)
                  setCopied(true); setTimeout(() => setCopied(false), 1800)
                }}
                className="w-full px-3 py-2 rounded-lg border border-white/10 text-white/60 hover:bg-white/10 text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Link2 className="w-3.5 h-3.5" />}
                {copied ? 'Link copied' : 'Copy preview link'}
              </button>
            )}
          </Panel>

          {/* revisions */}
          {id && (
            <Panel id="revisions" title={`Revision history (${revisions.length})`} icon={History} open={openPanel === 'revisions'} onToggle={() => setOpenPanel(openPanel === 'revisions' ? null : 'revisions')}>
              {revisions.length === 0 ? (
                <p className="text-xs text-white/35">No revisions yet — they are captured automatically on each save.</p>
              ) : (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                  {revisions.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5">
                      <div className="min-w-0">
                        <p className="text-[11px] text-white/70 truncate">v{r.revision_no} · {r.title}</p>
                        <p className="text-[10px] text-white/30">{istLabel(r.created_at)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRestoreRevision(r.id)}
                        title="Restore this version"
                        className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 flex-shrink-0 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )}
        </aside>
      </div>

      {picker && (
        <MediaLibrary
          mode="picker"
          onPick={picker.onPick}
          onClose={() => setPicker(null)}
          showToast={showToast}
        />
      )}
    </div>
  )
}
