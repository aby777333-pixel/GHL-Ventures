'use client'

/* ─────────────────────────────────────────────────────────────
   Blog CMS — admin module

   Single source of truth for ghlindiaventures.com/blog/ AND
   blog.ghlindiaventures.com. Anything published here appears on
   both immediately.
   ───────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  FileText, Plus, Search, Trash2, RotateCcw, Eye, EyeOff, Clock, Star,
  Bookmark, Pencil, Image as ImageIcon, FolderTree, Users, MessageSquare,
  BarChart3, Settings2, Mail, Loader2, ExternalLink, Check, X, ArrowUpRight,
  Download, ArrowLeftRight, TrendingUp, Archive as ArchiveIcon, AlertTriangle,
} from 'lucide-react'
import PostEditor from '../blog/PostEditor'
import MediaLibrary from '../blog/MediaLibrary'
import CmsSelect from '../blog/CmsSelect'
import {
  listPosts, getPostById, setPostStatus, trashPost, restorePost, deletePostForever,
  duplicatePost, listCategoriesAdmin, saveCategory, deleteCategory,
  listAuthorsAdmin, saveAuthor, deleteAuthor, listTags, deleteTag,
  listComments, moderateComment, deleteComment, listRedirects, saveRedirect,
  deleteRedirect, listReportsAdmin, saveReport, deleteReport, listReportLeads,
  listSubscribers, setSubscriberActive, getAnalyticsSummary, saveSetting,
  uploadMedia, slugify, type BlogAnalyticsSummary,
} from '@/lib/blog/adminService'
import { getBlogSettings, type CmsPost, type CmsCategory, type CmsAuthor } from '@/lib/blog/cmsService'

const SITE_URL = 'https://ghlindiaventures.com'

const TABS = [
  { id: 'posts',       label: 'Posts',       icon: FileText },
  { id: 'media',       label: 'Media',       icon: ImageIcon },
  { id: 'categories',  label: 'Categories',  icon: FolderTree },
  { id: 'authors',     label: 'Authors',     icon: Users },
  { id: 'comments',    label: 'Comments',    icon: MessageSquare },
  { id: 'reports',     label: 'Reports',     icon: Download },
  { id: 'subscribers', label: 'Subscribers', icon: Mail },
  { id: 'analytics',   label: 'Analytics',   icon: BarChart3 },
  { id: 'seo',         label: 'SEO',         icon: Settings2 },
  { id: 'trash',       label: 'Trash',       icon: Trash2 },
] as const

type TabId = typeof TABS[number]['id']

interface Props {
  subTab: string | null
  navigate: (module: string, subTab?: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void
  canEdit?: boolean
  canDelete?: boolean
  /** The standalone /cms console has its own sidebar, so it suppresses
   *  this module's internal tab strip rather than showing both. */
  hideTabs?: boolean
}

const card = 'rounded-xl border border-white/10 bg-white/[0.03]'
const input = 'cms-select w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-red transition-colors'
const label = 'block text-[11px] font-semibold uppercase tracking-wider text-white/45 mb-1.5'
const btnPrimary = 'px-4 py-2 rounded-lg bg-brand-red hover:bg-brand-red-deep disabled:opacity-60 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors'
const btnGhost = 'px-3 py-2 rounded-lg border border-white/10 text-white/70 hover:bg-white/10 hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors'

function istDate(iso?: string | null) {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

const STATUS_STYLE: Record<string, string> = {
  draft: 'bg-white/10 text-white/60',
  scheduled: 'bg-amber-500/15 text-amber-300',
  published: 'bg-emerald-500/15 text-emerald-300',
  archived: 'bg-white/5 text-white/35',
}

export default function BlogCMSModule({ subTab, navigate, showToast, canEdit = true, canDelete = true, hideTabs = false }: Props) {
  const active = (TABS.some((t) => t.id === subTab) ? subTab : 'posts') as TabId
  const [editing, setEditing] = useState<{ id: string | null; post: CmsPost | null } | null>(null)

  if (editing) {
    return (
      <PostEditor
        postId={editing.id}
        initialPost={editing.post}
        canDelete={canDelete}
        showToast={showToast}
        onBack={() => setEditing(null)}
        onSaved={(p) => setEditing({ id: p.id, post: p })}
      />
    )
  }

  return (
    <div className="pb-16 min-w-0 max-w-full">
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white">Blog CMS</h1>
          <p className="text-xs text-white/40 mt-0.5">
            One library powering <span className="text-white/60">ghlindiaventures.com/blog</span> and{' '}
            <span className="text-white/60">blog.ghlindiaventures.com</span>. Published changes appear on both immediately.
          </p>
        </div>
        {canEdit && (
          <button onClick={() => setEditing({ id: null, post: null })} className={btnPrimary}>
            <Plus className="w-4 h-4" /> New article
          </button>
        )}
      </div>

      {/* tabs */}
      <div className={`gap-1 mb-6 overflow-x-auto pb-1 -mx-1 px-1 ${hideTabs ? 'hidden' : 'flex'}`}>
        {TABS.map((t) => {
          const Icon = t.icon
          const on = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => navigate('blog', t.id === 'posts' ? undefined : t.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-colors ${
                on ? 'bg-brand-red text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          )
        })}
      </div>

      {active === 'posts' && <PostsTab onEdit={(id, post) => setEditing({ id, post })} showToast={showToast} canEdit={canEdit} canDelete={canDelete} />}
      {active === 'trash' && <TrashTab showToast={showToast} canDelete={canDelete} />}
      {active === 'media' && <div className={`${card} p-5`}><MediaLibrary mode="page" accept="image/*,application/pdf" showToast={showToast} /></div>}
      {active === 'categories' && <CategoriesTab showToast={showToast} canEdit={canEdit} />}
      {active === 'authors' && <AuthorsTab showToast={showToast} canEdit={canEdit} />}
      {active === 'comments' && <CommentsTab showToast={showToast} />}
      {active === 'reports' && <ReportsTab showToast={showToast} canEdit={canEdit} />}
      {active === 'subscribers' && <SubscribersTab showToast={showToast} />}
      {active === 'analytics' && <AnalyticsTab />}
      {active === 'seo' && <SeoTab showToast={showToast} />}
    </div>
  )
}

/* ═══════════════════════ Posts ═══════════════════════ */

function PostsTab({ onEdit, showToast, canEdit, canDelete }: {
  onEdit: (id: string, post: CmsPost) => void
  showToast: Props['showToast']
  canEdit: boolean
  canDelete: boolean
}) {
  const [posts, setPosts] = useState<CmsPost[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setPosts(await listPosts({ status, search }))
    setLoading(false)
  }, [status, search])

  useEffect(() => { const t = setTimeout(load, search ? 300 : 0); return () => clearTimeout(t) }, [load, search])

  async function act(id: string, fn: () => Promise<any>, msg: string) {
    setBusyId(id)
    const res = await fn()
    setBusyId(null)
    showToast(res?.ok ? msg : (res?.message || 'Action failed.'), res?.ok ? 'success' : 'error')
    if (res?.ok) load()
  }

  const counts = useMemo(() => ({
    all: posts.length,
    published: posts.filter((p) => p.status === 'published').length,
    draft: posts.filter((p) => p.status === 'draft').length,
    scheduled: posts.filter((p) => p.status === 'scheduled').length,
  }), [posts])

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title or slug…" className={`${input} pl-9`} />
        </div>
        <div className="sm:w-44 flex-shrink-0">
          <CmsSelect
            ariaLabel="Filter by status"
            value={status}
            onChange={setStatus}
            options={['all', 'published', 'draft', 'scheduled', 'archived'].map((s) => ({
              value: s, label: s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1),
            }))}
          />
        </div>
      </div>

      {status === 'all' && !loading && (
        <div className="flex gap-4 text-[11px] text-white/40">
          <span>{counts.all} total</span>
          <span className="text-emerald-300/70">{counts.published} published</span>
          <span>{counts.draft} drafts</span>
          {counts.scheduled > 0 && <span className="text-amber-300/70">{counts.scheduled} scheduled</span>}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}</div>
      ) : posts.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <FileText className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/50">No articles match this filter.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {posts.map((p) => (
            <div key={p.id} className={`${card} p-3 flex items-center gap-3 hover:border-white/20 transition-colors`}>
              <div className="w-14 h-14 rounded-lg bg-[#0B090A] overflow-hidden flex-shrink-0">
                {p.cover_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_image} alt="" className="w-full h-full object-cover" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center"><FileText className="w-5 h-5 text-white/15" /></div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLE[p.status]}`}>{p.status}</span>
                  {p.featured && <Star className="w-3 h-3 text-amber-400" aria-label="Featured" />}
                  {p.editors_pick && <Bookmark className="w-3 h-3 text-sky-400" aria-label="Editor's pick" />}
                  {p.content_format === 'component' && (
                    <span className="px-1.5 py-0.5 rounded bg-white/5 text-[9px] text-white/40 uppercase tracking-wider">custom layout</span>
                  )}
                </div>
                <button onClick={() => onEdit(p.id, p)} className="block text-left text-sm font-semibold text-white hover:text-brand-red transition-colors truncate w-full mt-0.5">
                  {p.title}
                </button>
                <p className="text-[11px] text-white/30 truncate">
                  /{p.slug} · {p.blog_categories?.name || p.category || 'uncategorised'} · {istDate(p.published_at || p.created_at)}
                  {p.status === 'scheduled' && p.scheduled_at && <span className="text-amber-300/70"> · goes live {istDate(p.scheduled_at)}</span>}
                  {' · '}{(p.views || 0).toLocaleString('en-IN')} views
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {busyId === p.id && <Loader2 className="w-4 h-4 animate-spin text-white/40 mr-1" />}
                <a href={`${SITE_URL}/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" title="Open on the site"
                  className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {canEdit && (
                  <>
                    <button onClick={() => onEdit(p.id, p)} title="Edit"
                      className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {p.status === 'published' ? (
                      <button onClick={() => act(p.id, () => setPostStatus(p.id, 'draft'), 'Unpublished.')} title="Unpublish"
                        className="p-2 rounded-lg text-white/40 hover:text-amber-300 hover:bg-white/10 transition-colors">
                        <EyeOff className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button onClick={() => act(p.id, () => setPostStatus(p.id, 'published'), 'Published — live on both domains.')} title="Publish"
                        className="p-2 rounded-lg text-white/40 hover:text-emerald-300 hover:bg-white/10 transition-colors">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
                {canDelete && (
                  <button
                    onClick={() => { if (window.confirm(`Move “${p.title}” to trash?`)) act(p.id, () => trashPost(p.id), 'Moved to trash.') }}
                    title="Move to trash"
                    className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════ Trash ═══════════════════════ */

function TrashTab({ showToast, canDelete }: { showToast: Props['showToast']; canDelete: boolean }) {
  const [posts, setPosts] = useState<CmsPost[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const all = await listPosts({ includeDeleted: true, status: 'all' })
    setPosts(all.filter((p) => !!p.deleted_at))
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-3">
      <p className="text-xs text-white/40">
        Deleted articles are kept here so they can be restored. Their URLs return not-found while trashed.
      </p>
      {loading ? (
        <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
      ) : posts.length === 0 ? (
        <div className={`${card} p-12 text-center`}>
          <Trash2 className="w-10 h-10 text-white/15 mx-auto mb-3" />
          <p className="text-sm text-white/50">Trash is empty.</p>
        </div>
      ) : posts.map((p) => (
        <div key={p.id} className={`${card} p-3 flex items-center gap-3`}>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white/70 truncate">{p.title}</p>
            <p className="text-[11px] text-white/30">/{p.slug} · deleted {istDate(p.deleted_at)}</p>
          </div>
          <button
            onClick={async () => {
              const r = await restorePost(p.id)
              showToast(r.ok ? 'Restored as a draft.' : (r.message || 'Restore failed.'), r.ok ? 'success' : 'error')
              if (r.ok) load()
            }}
            className={btnGhost}
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restore
          </button>
          {canDelete && (
            <button
              onClick={async () => {
                if (!window.confirm(`Permanently delete “${p.title}”? This cannot be undone.`)) return
                const r = await deletePostForever(p.id)
                showToast(r.ok ? 'Permanently deleted.' : (r.message || 'Delete failed.'), r.ok ? 'success' : 'error')
                if (r.ok) load()
              }}
              className="px-3 py-2 rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10 text-xs font-semibold transition-colors"
            >
              Delete forever
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

/* ═══════════════════════ Categories ═══════════════════════ */

function CategoriesTab({ showToast, canEdit }: { showToast: Props['showToast']; canEdit: boolean }) {
  const [cats, setCats] = useState<(CmsCategory & { post_count: number })[]>([])
  const [tags, setTags] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Partial<CmsCategory> & { id?: string }>({ name: '', slug: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const [c, t] = await Promise.all([listCategoriesAdmin(), listTags()])
    setCats(c); setTags(t); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const res = await saveCategory(draft)
    showToast(res.ok ? 'Category saved.' : (res.message || 'Save failed.'), res.ok ? 'success' : 'error')
    if (res.ok) { setDraft({ name: '', slug: '' }); load() }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_20rem] gap-5 items-start">
      <div className="min-w-0 space-y-2">
        {loading ? <div className="h-40 rounded-xl bg-white/5 animate-pulse" /> : cats.map((c) => (
          <div key={c.id} className={`${card} p-3 flex items-center gap-3`}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">
                {c.parent_id && <span className="text-white/25 mr-1">↳</span>}{c.name}
                <span className="ml-2 text-[11px] text-white/30">{c.post_count} post{c.post_count === 1 ? '' : 's'}</span>
              </p>
              <p className="text-[11px] text-white/30 truncate">/blog/category/{c.slug}{c.description ? ` · ${c.description}` : ''}</p>
            </div>
            {canEdit && (
              <>
                <button onClick={() => setDraft(c)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={async () => {
                    if (c.post_count > 0) { showToast(`Move the ${c.post_count} article(s) out of this category first.`, 'error'); return }
                    if (!window.confirm(`Delete category “${c.name}”?`)) return
                    const r = await deleteCategory(c.id)
                    showToast(r.ok ? 'Category deleted.' : (r.message || 'Delete failed.'), r.ok ? 'success' : 'error')
                    if (r.ok) load()
                  }}
                  className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors" title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ))}

        {tags.length > 0 && (
          <div className={`${card} p-4 mt-5`}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/45 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 text-[11px] text-white/70">
                  {t.name} <span className="text-white/25">{t.post_count}</span>
                  {canEdit && (
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Delete tag “${t.name}”?`)) return
                        const r = await deleteTag(t.id)
                        showToast(r.ok ? 'Tag deleted.' : (r.message || 'Delete failed.'), r.ok ? 'success' : 'error')
                        if (r.ok) load()
                      }}
                      className="text-white/25 hover:text-red-400 transition-colors" aria-label={`Delete ${t.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {canEdit && (
        <form onSubmit={submit} className={`${card} min-w-0 p-4 space-y-3`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">
            {draft.id ? 'Edit category' : 'New category'}
          </h3>
          <div>
            <label className={label}>Name</label>
            <input value={draft.name || ''} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} className={input} required />
          </div>
          <div>
            <label className={label}>Slug</label>
            <input value={draft.slug || ''} onChange={(e) => setDraft({ ...draft, slug: e.target.value })} className={input} required />
          </div>
          <div>
            <label className={label}>Description</label>
            <textarea value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} className={`${input} resize-y`} />
          </div>
          <div>
            <label className={label}>Parent category</label>
            <CmsSelect
              ariaLabel="Parent category"
              value={draft.parent_id || ''}
              onChange={(v) => setDraft({ ...draft, parent_id: v || null })}
              options={[
                { value: '', label: '— top level —' },
                ...cats.filter((c) => !c.parent_id && c.id !== draft.id).map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className={btnPrimary}>{draft.id ? 'Save changes' : 'Add category'}</button>
            {draft.id && <button type="button" onClick={() => setDraft({ name: '', slug: '' })} className={btnGhost}>Cancel</button>}
          </div>
        </form>
      )}
    </div>
  )
}

/* ═══════════════════════ Authors ═══════════════════════ */

function AuthorsTab({ showToast, canEdit }: { showToast: Props['showToast']; canEdit: boolean }) {
  const [authors, setAuthors] = useState<(CmsAuthor & { post_count: number })[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<Partial<CmsAuthor> & { id?: string }>({ name: '' })

  const load = useCallback(async () => { setLoading(true); setAuthors(await listAuthorsAdmin()); setLoading(false) }, [])
  useEffect(() => { load() }, [load])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const res = await saveAuthor(draft)
    showToast(res.ok ? 'Author saved.' : (res.message || 'Save failed.'), res.ok ? 'success' : 'error')
    if (res.ok) { setDraft({ name: '' }); load() }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_20rem] gap-5 items-start">
      <div className="min-w-0 space-y-2">
        {loading ? <div className="h-40 rounded-xl bg-white/5 animate-pulse" /> : authors.map((a) => (
          <div key={a.id} className={`${card} p-3 flex items-center gap-3`}>
            <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center overflow-hidden flex-shrink-0">
              {a.avatar_url
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={a.avatar_url} alt={a.name} className="w-full h-full object-cover" />
                : <Users className="w-4 h-4 text-brand-red" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{a.name} <span className="ml-1 text-[11px] text-white/30">{a.post_count} post{a.post_count === 1 ? '' : 's'}</span></p>
              <p className="text-[11px] text-white/30 truncate">{a.title || '—'} · /blog/author/{a.slug}</p>
            </div>
            {canEdit && (
              <>
                <button onClick={() => setDraft(a)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Edit">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={async () => {
                    if (a.post_count > 0) { showToast(`Reassign the ${a.post_count} article(s) first.`, 'error'); return }
                    if (!window.confirm(`Delete author “${a.name}”?`)) return
                    const r = await deleteAuthor(a.id)
                    showToast(r.ok ? 'Author deleted.' : (r.message || 'Delete failed.'), r.ok ? 'success' : 'error')
                    if (r.ok) load()
                  }}
                  className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors" title="Delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      {canEdit && (
        <form onSubmit={submit} className={`${card} min-w-0 p-4 space-y-3`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">{draft.id ? 'Edit author' : 'New author'}</h3>
          {([['name', 'Name'], ['title', 'Job title'], ['email', 'Email'], ['avatar_url', 'Avatar URL'], ['linkedin_url', 'LinkedIn URL'], ['twitter_url', 'X / Twitter URL']] as const).map(([k, l]) => (
            <div key={k}>
              <label className={label}>{l}</label>
              <input value={(draft as any)[k] || ''} onChange={(e) => setDraft({ ...draft, [k]: e.target.value })} className={input} required={k === 'name'} />
            </div>
          ))}
          <div>
            <label className={label}>Bio</label>
            <textarea value={draft.bio || ''} onChange={(e) => setDraft({ ...draft, bio: e.target.value })} rows={3} className={`${input} resize-y`} />
          </div>
          <div className="flex gap-2">
            <button type="submit" className={btnPrimary}>{draft.id ? 'Save changes' : 'Add author'}</button>
            {draft.id && <button type="button" onClick={() => setDraft({ name: '' })} className={btnGhost}>Cancel</button>}
          </div>
        </form>
      )}
    </div>
  )
}

/* ═══════════════════════ Comments ═══════════════════════ */

function CommentsTab({ showToast }: { showToast: Props['showToast'] }) {
  const [comments, setComments] = useState<any[]>([])
  const [filter, setFilter] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [commentsOn, setCommentsOn] = useState<boolean | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [c, s] = await Promise.all([listComments(filter), getBlogSettings()])
    setComments(c)
    setCommentsOn(!!s?.comments?.enabled)
    setLoading(false)
  }, [filter])
  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-4">
      <div className={`${card} p-4 flex items-center justify-between gap-4 flex-wrap`}>
        <div>
          <p className="text-sm font-semibold text-white">Comments are {commentsOn ? 'enabled' : 'disabled'} site-wide</p>
          <p className="text-[11px] text-white/35 mt-0.5">
            When disabled, the comment form is hidden on every article regardless of the per-article setting.
          </p>
        </div>
        <button
          onClick={async () => {
            const next = !commentsOn
            const r = await saveSetting('comments', { enabled: next, require_moderation: true })
            showToast(r.ok ? `Comments ${next ? 'enabled' : 'disabled'}.` : (r.message || 'Failed.'), r.ok ? 'success' : 'error')
            if (r.ok) setCommentsOn(next)
          }}
          className={commentsOn ? btnGhost : btnPrimary}
        >
          <ArrowLeftRight className="w-3.5 h-3.5" /> {commentsOn ? 'Disable comments' : 'Enable comments'}
        </button>
      </div>

      <div className="flex gap-1">
        {['pending', 'approved', 'spam', 'rejected', 'all'].map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              filter === s ? 'bg-brand-red text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
            }`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? <div className="h-24 rounded-xl bg-white/5 animate-pulse" />
        : comments.length === 0 ? (
          <div className={`${card} p-12 text-center`}>
            <MessageSquare className="w-10 h-10 text-white/15 mx-auto mb-3" />
            <p className="text-sm text-white/50">No {filter === 'all' ? '' : filter} comments.</p>
          </div>
        ) : comments.map((c) => (
          <div key={c.id} className={`${card} p-4`}>
            <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white">{c.author_name} <span className="text-[11px] text-white/30 font-normal">{c.author_email}</span></p>
                <p className="text-[11px] text-white/30">on “{c.blog_posts?.title || 'unknown'}” · {istDate(c.created_at)}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${c.status === 'approved' ? 'bg-emerald-500/15 text-emerald-300' : c.status === 'pending' ? 'bg-amber-500/15 text-amber-300' : 'bg-white/10 text-white/40'}`}>
                {c.status}
              </span>
            </div>
            <p className="text-sm text-white/70 whitespace-pre-wrap mb-3">{c.body}</p>
            <div className="flex gap-2 flex-wrap">
              {c.status !== 'approved' && (
                <button onClick={async () => { const r = await moderateComment(c.id, 'approved'); showToast(r.ok ? 'Approved.' : 'Failed.', r.ok ? 'success' : 'error'); if (r.ok) load() }} className={btnGhost}>
                  <Check className="w-3.5 h-3.5" /> Approve
                </button>
              )}
              {c.status !== 'spam' && (
                <button onClick={async () => { const r = await moderateComment(c.id, 'spam'); showToast(r.ok ? 'Marked as spam.' : 'Failed.', r.ok ? 'success' : 'error'); if (r.ok) load() }} className={btnGhost}>
                  <AlertTriangle className="w-3.5 h-3.5" /> Spam
                </button>
              )}
              <button onClick={async () => {
                if (!window.confirm('Delete this comment permanently?')) return
                const r = await deleteComment(c.id); showToast(r.ok ? 'Deleted.' : 'Failed.', r.ok ? 'success' : 'error'); if (r.ok) load()
              }} className="px-3 py-2 rounded-lg border border-red-500/20 text-red-300 hover:bg-red-500/10 text-xs font-semibold inline-flex items-center gap-1.5 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
    </div>
  )
}

/* ═══════════════════════ Reports ═══════════════════════ */

function ReportsTab({ showToast, canEdit }: { showToast: Props['showToast']; canEdit: boolean }) {
  const [reports, setReports] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState<any>({ title: '', status: 'draft', gated: true })
  const [uploading, setUploading] = useState(false)
  const [view, setView] = useState<'reports' | 'leads'>('reports')
  const [coverBusy, setCoverBusy] = useState(false)
  const [coverPicker, setCoverPicker] = useState(false)
  const coverRef = useRef<HTMLInputElement>(null)

  async function onCover(file?: File | null) {
    if (!file) return
    setCoverBusy(true)
    const res = await uploadMedia(file, 'covers')
    setCoverBusy(false)
    if (res.ok && res.data) {
      setDraft((d: any) => ({ ...d, cover_image: res.data!.public_url }))
      showToast('Cover image uploaded.', 'success')
    } else showToast(res.message || 'Upload failed.', 'error')
  }

  const load = useCallback(async () => {
    setLoading(true)
    const [r, l] = await Promise.all([listReportsAdmin(), listReportLeads()])
    setReports(r); setLeads(l); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  async function onPdf(file?: File | null) {
    if (!file) return
    setUploading(true)
    const res = await uploadMedia(file, 'reports')
    setUploading(false)
    if (res.ok && res.data) {
      setDraft((d: any) => ({ ...d, pdf_url: res.data!.public_url, pdf_filename: file.name }))
      showToast('PDF uploaded.', 'success')
    } else showToast(res.message || 'Upload failed.', 'error')
  }

  function exportLeads() {
    const rows = [['Name', 'Email', 'Phone', 'Report', 'Date']]
      .concat(leads.map((l) => [l.name, l.email, l.phone || '', l.blog_reports?.title || '', istDate(l.created_at)]))
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `blog-report-leads-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {(['reports', 'leads'] as const).map((v) => (
          <button key={v} onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
              view === v ? 'bg-brand-red text-white' : 'text-white/50 hover:text-white hover:bg-white/10'
            }`}>
            {v} {v === 'leads' && leads.length > 0 && <span className="opacity-60">({leads.length})</span>}
          </button>
        ))}
      </div>

      {coverPicker && (
        <MediaLibrary
          mode="picker"
          onPick={(url) => { setDraft((d: any) => ({ ...d, cover_image: url })); setCoverPicker(false) }}
          onClose={() => setCoverPicker(false)}
          showToast={showToast}
        />
      )}

      {view === 'leads' ? (
        <div className={`${card} overflow-hidden`}>
          <div className="flex items-center justify-between gap-3 p-4 border-b border-white/10">
            <p className="text-xs text-white/45">{leads.length} leads captured from gated report downloads</p>
            <button onClick={exportLeads} disabled={!leads.length} className={btnGhost}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>{['Name', 'Email', 'Phone', 'Report', 'Date'].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/40 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-white/35 text-sm">No leads yet.</td></tr>
                ) : leads.map((l) => (
                  <tr key={l.id} className="border-t border-white/5">
                    <td className="px-4 py-2.5 text-white/80 whitespace-nowrap">{l.name}</td>
                    <td className="px-4 py-2.5 text-white/60 whitespace-nowrap">{l.email}</td>
                    <td className="px-4 py-2.5 text-white/60 whitespace-nowrap">{l.phone || '—'}</td>
                    <td className="px-4 py-2.5 text-white/60">{l.blog_reports?.title || '—'}</td>
                    <td className="px-4 py-2.5 text-white/40 whitespace-nowrap">{istDate(l.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_20rem] gap-5 items-start">
          <div className="min-w-0 space-y-2">
            {loading ? <div className="h-40 rounded-xl bg-white/5 animate-pulse" /> : reports.map((r) => (
              <div key={r.id} className={`${card} p-3 flex items-center gap-3`}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">
                    {r.title}
                    <span className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${STATUS_STYLE[r.status] || STATUS_STYLE.draft}`}>{r.status}</span>
                  </p>
                  <p className="text-[11px] text-white/30 truncate min-w-0">{r.pdf_filename} · {r.download_count} downloads</p>
                </div>
                <a href={r.pdf_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Open PDF">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {canEdit && (
                  <>
                    <button onClick={() => setDraft(r)} className="p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors" title="Edit">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={async () => {
                      if (!window.confirm(`Delete report “${r.title}”?`)) return
                      const res = await deleteReport(r.id)
                      showToast(res.ok ? 'Report deleted.' : (res.message || 'Failed.'), res.ok ? 'success' : 'error')
                      if (res.ok) load()
                    }} className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-white/10 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {canEdit && (
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                const res = await saveReport(draft)
                showToast(res.ok ? 'Report saved.' : (res.message || 'Save failed.'), res.ok ? 'success' : 'error')
                if (res.ok) { setDraft({ title: '', status: 'draft', gated: true }); load() }
              }}
              className={`${card} min-w-0 p-4 space-y-3`}
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">{draft.id ? 'Edit report' : 'New report'}</h3>
              <div>
                <label className={label}>Title</label>
                <input value={draft.title || ''} onChange={(e) => setDraft({ ...draft, title: e.target.value, slug: draft.id ? draft.slug : slugify(e.target.value) })} className={input} required />
              </div>
              <div>
                <label className={label}>Description</label>
                <textarea value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} rows={2} className={`${input} resize-y`} />
              </div>
              <div>
                <label className={label}>PDF file</label>
                {draft.pdf_url && <p className="text-[11px] text-emerald-300 mb-1.5 truncate">✓ {draft.pdf_filename}</p>}
                <input type="file" accept="application/pdf" onChange={(e) => onPdf(e.target.files?.[0])} className="w-full text-xs text-white/60 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-white/10 file:text-white file:text-xs file:cursor-pointer" />
                {uploading && <p className="text-[11px] text-white/40 mt-1 inline-flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" /> Uploading…</p>}
              </div>
              <div>
                <label className={label}>Cover image</label>
                {draft.cover_image ? (
                  <div className="relative rounded-lg overflow-hidden border border-white/10 group mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={draft.cover_image} alt="Report cover" className="w-full h-24 object-cover" />
                    <button
                      type="button"
                      onClick={() => setDraft({ ...draft, cover_image: '' })}
                      className="absolute top-1 right-1 p-1 rounded bg-black/70 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remove cover image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => coverRef.current?.click()}
                    disabled={coverBusy}
                    className={`${btnGhost} flex-1 justify-center`}
                  >
                    {coverBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
                    {draft.cover_image ? 'Replace image' : 'Upload cover image'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoverPicker(true)}
                    className={`${btnGhost} flex-1 justify-center`}
                  >
                    <FolderTree className="w-3.5 h-3.5" /> Library
                  </button>
                </div>
                <input
                  ref={coverRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => onCover(e.target.files?.[0])}
                />
                <p className="mt-1.5 text-[10px] text-white/30">
                  Shown on the Reports page card. Landscape images work best.
                </p>
              </div>
              <div>
                <label className={label}>Status</label>
                <CmsSelect
                  ariaLabel="Report status"
                  value={draft.status || 'draft'}
                  onChange={(v) => setDraft({ ...draft, status: v })}
                  options={['draft', 'published', 'archived'].map((s) => ({
                    value: s, label: s.charAt(0).toUpperCase() + s.slice(1),
                  }))}
                />
              </div>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input type="checkbox" checked={draft.gated ?? true} onChange={(e) => setDraft({ ...draft, gated: e.target.checked })} className="w-4 h-4 rounded accent-[#BA181B]" />
                <span className="text-xs text-white/70">Capture a lead before download</span>
              </label>
              <div className="flex gap-2">
                <button type="submit" className={btnPrimary}>{draft.id ? 'Save changes' : 'Add report'}</button>
                {draft.id && <button type="button" onClick={() => setDraft({ title: '', status: 'draft', gated: true })} className={btnGhost}>Cancel</button>}
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════ Subscribers ═══════════════════════ */

function SubscribersTab({ showToast }: { showToast: Props['showToast'] }) {
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')

  const load = useCallback(async () => { setLoading(true); setSubs(await listSubscribers()); setLoading(false) }, [])
  useEffect(() => { load() }, [load])

  const filtered = subs.filter((s) => !q.trim() || String(s.email).toLowerCase().includes(q.toLowerCase()))

  function exportCsv() {
    const rows = [['Email', 'Name', 'Source', 'Active', 'Subscribed']]
      .concat(filtered.map((s) => [s.email, s.name || s.full_name || '', s.source || '', s.is_active ? 'yes' : 'no', istDate(s.created_at || s.subscribed_at)]))
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url; a.download = `newsletter-subscribers-${new Date().toISOString().slice(0, 10)}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`${card} overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 p-4 border-b border-white/10 flex-wrap">
        <div className="relative flex-1 min-w-[12rem]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email…" className={`${input} pl-9`} />
        </div>
        <span className="text-xs text-white/40">{filtered.filter((s) => s.is_active).length} active of {filtered.length}</span>
        <button onClick={exportCsv} disabled={!filtered.length} className={btnGhost}><Download className="w-3.5 h-3.5" /> Export CSV</button>
      </div>
      {loading ? <div className="h-40 bg-white/5 animate-pulse" /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/5">
              <tr>{['Email', 'Name', 'Source', 'Subscribed', ''].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/40 whitespace-nowrap">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-white/35 text-sm">No subscribers yet.</td></tr>
              ) : filtered.map((s) => (
                <tr key={s.id} className="border-t border-white/5">
                  <td className="px-4 py-2.5 text-white/80 whitespace-nowrap">{s.email}</td>
                  <td className="px-4 py-2.5 text-white/60">{s.name || s.full_name || '—'}</td>
                  <td className="px-4 py-2.5 text-white/50 whitespace-nowrap">{s.source || '—'}</td>
                  <td className="px-4 py-2.5 text-white/40 whitespace-nowrap">{istDate(s.created_at || s.subscribed_at)}</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={async () => {
                        const r = await setSubscriberActive(s.id, !s.is_active)
                        showToast(r.ok ? 'Updated.' : (r.message || 'Failed.'), r.ok ? 'success' : 'error')
                        if (r.ok) load()
                      }}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                        s.is_active ? 'bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' : 'bg-white/10 text-white/40 hover:bg-white/15'
                      }`}
                    >
                      {s.is_active ? 'Active' : 'Unsubscribed'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════ Analytics ═══════════════════════ */

function AnalyticsTab() {
  const [data, setData] = useState<BlogAnalyticsSummary | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => { let a = true; getAnalyticsSummary(days).then((d) => { if (a) setData(d) }); return () => { a = false } }, [days])

  if (!data) return <div className="h-64 rounded-xl bg-white/5 animate-pulse" />

  const peak = Math.max(1, ...data.daily.map((d) => d.count))
  const stats = [
    { label: 'Total views', value: data.totalViews.toLocaleString('en-IN'), icon: Eye },
    { label: `Views (${days}d)`, value: data.viewsLast30.toLocaleString('en-IN'), icon: TrendingUp },
    { label: 'Published', value: data.publishedPosts, icon: FileText },
    { label: 'Drafts', value: data.drafts, icon: Pencil },
    { label: 'Scheduled', value: data.scheduled, icon: Clock },
    { label: 'Subscribers', value: data.subscribers.toLocaleString('en-IN'), icon: Mail },
    { label: 'Avg read time', value: data.avgSecondsRead ? `${Math.floor(data.avgSecondsRead / 60)}m ${data.avgSecondsRead % 60}s` : '—', icon: Clock },
    { label: 'Avg scroll depth', value: data.avgScrollDepth ? `${data.avgScrollDepth}%` : '—', icon: ArrowUpRight },
  ]

  return (
    <div className="space-y-5">
      <div className="flex gap-1 justify-end">
        {[7, 30, 90].map((d) => (
          <button key={d} onClick={() => setDays(d)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${days === d ? 'bg-brand-red text-white' : 'text-white/50 hover:text-white hover:bg-white/10'}`}>
            {d}d
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className={`${card} p-4`}>
              <Icon className="w-4 h-4 text-brand-red mb-2" />
              <p className="text-xl font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-white/40 mt-0.5">{s.label}</p>
            </div>
          )
        })}
      </div>

      <div className={`${card} p-5`}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/45 mb-4">Views per day</h3>
        {data.viewsLast30 === 0 ? (
          <p className="text-xs text-white/35 py-8 text-center">
            No view data yet — tracking starts as soon as the updated site is live.
          </p>
        ) : (
          <div className="flex items-end gap-[2px] h-32">
            {data.daily.map((d) => (
              <div key={d.date} className="flex-1 bg-brand-red/70 hover:bg-brand-red rounded-t transition-colors min-h-[2px]"
                style={{ height: `${(d.count / peak) * 100}%` }}
                title={`${d.date}: ${d.count} view${d.count === 1 ? '' : 's'}`} />
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className={`${card} p-5 lg:col-span-1`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/45 mb-3">Traffic sources</h3>
          {data.sources.length === 0 ? <p className="text-xs text-white/30">No data yet.</p> : (
            <ul className="space-y-2">
              {data.sources.slice(0, 6).map((s) => (
                <li key={s.source} className="flex items-center justify-between gap-2 text-xs">
                  <span className="text-white/60 capitalize truncate">{s.source}</span>
                  <span className="text-white/40">{s.count}</span>
                </li>
              ))}
            </ul>
          )}
          {data.devices.length > 0 && (
            <>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white/45 mt-5 mb-3">Devices</h3>
              <ul className="space-y-2">
                {data.devices.map((d) => (
                  <li key={d.device} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-white/60 capitalize">{d.device}</span>
                    <span className="text-white/40">{d.count}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <div className={`${card} p-5 lg:col-span-2`}>
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/45 mb-3">Most-read articles</h3>
          <ol className="space-y-2.5">
            {data.topPosts.map((p, i) => (
              <li key={p.slug} className="flex items-center gap-3">
                <span className="text-sm font-bold text-white/15 w-5 flex-shrink-0">{String(i + 1).padStart(2, '0')}</span>
                <a href={`${SITE_URL}/blog/${p.slug}`} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-white/70 hover:text-brand-red truncate flex-1 transition-colors">{p.title}</a>
                <span className="text-xs text-white/40 flex-shrink-0">{p.views.toLocaleString('en-IN')}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════ SEO ═══════════════════════ */

function SeoTab({ showToast }: { showToast: Props['showToast'] }) {
  const [redirects, setRedirects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [draft, setDraft] = useState({ from_path: '', to_path: '' })
  const [settings, setSettings] = useState<Record<string, any>>({})

  const load = useCallback(async () => {
    setLoading(true)
    const [r, s] = await Promise.all([listRedirects(), getBlogSettings()])
    setRedirects(r); setSettings(s); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      <div className={`${card} p-5`}>
        <h3 className="text-xs font-bold uppercase tracking-wider text-white/45 mb-3">Feeds &amp; indexing</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {[
            { label: 'Sitemap', href: `${SITE_URL}/sitemap.xml`, note: 'Regenerated on every deploy' },
            { label: 'RSS feed', href: `${SITE_URL}/blog/rss.xml`, note: 'Latest 50 published articles' },
            { label: 'robots.txt', href: `${SITE_URL}/robots.txt`, note: 'Points crawlers at the sitemap' },
          ].map((f) => (
            <a key={f.label} href={f.href} target="_blank" rel="noopener noreferrer"
              className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group">
              <p className="text-sm font-semibold text-white flex items-center gap-1.5">
                {f.label} <ExternalLink className="w-3 h-3 text-white/30 group-hover:text-white/60" />
              </p>
              <p className="text-[11px] text-white/35 mt-0.5">{f.note}</p>
            </a>
          ))}
        </div>
        <p className="mt-4 text-[11px] text-white/30">
          Every article is served with an Article/BlogPosting schema, breadcrumbs, an author entity and an
          Organization block. Canonical URLs always point at <span className="text-white/50">ghlindiaventures.com/blog/…</span>,
          so the subdomain never competes with the main site in search.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_20rem] gap-5 items-start">
        <div className={`${card} min-w-0 overflow-hidden`}>
          <div className="p-4 border-b border-white/10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">301 redirects</h3>
            <p className="text-[11px] text-white/35 mt-1">
              Created automatically whenever an article&rsquo;s URL changes, so existing links and rankings survive.
            </p>
          </div>
          {loading ? <div className="h-32 bg-white/5 animate-pulse" /> : redirects.length === 0 ? (
            <p className="p-8 text-center text-sm text-white/35">No redirects yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>{['From', 'To', 'Hits', ''].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-white/40">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {redirects.map((r) => (
                    <tr key={r.id} className="border-t border-white/5">
                      <td className="px-4 py-2.5 text-white/70 font-mono text-xs">{r.from_path}</td>
                      <td className="px-4 py-2.5 text-white/50 font-mono text-xs">{r.to_path}</td>
                      <td className="px-4 py-2.5 text-white/40 text-xs">{r.hits}</td>
                      <td className="px-4 py-2.5 text-right">
                        <button onClick={async () => {
                          if (!window.confirm(`Delete the redirect from ${r.from_path}?`)) return
                          const res = await deleteRedirect(r.id)
                          showToast(res.ok ? 'Redirect deleted.' : (res.message || 'Failed.'), res.ok ? 'success' : 'error')
                          if (res.ok) load()
                        }} className="p-1.5 rounded text-white/30 hover:text-red-400 transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault()
            const res = await saveRedirect(draft)
            showToast(res.ok ? 'Redirect saved.' : (res.message || 'Save failed.'), res.ok ? 'success' : 'error')
            if (res.ok) { setDraft({ from_path: '', to_path: '' }); load() }
          }}
          className={`${card} p-4 space-y-3`}
        >
          <h3 className="text-xs font-bold uppercase tracking-wider text-white/45">Add a redirect</h3>
          <div>
            <label className={label}>From path</label>
            <input value={draft.from_path} onChange={(e) => setDraft({ ...draft, from_path: e.target.value })} placeholder="/blog/old-url" className={input} required />
          </div>
          <div>
            <label className={label}>To path</label>
            <input value={draft.to_path} onChange={(e) => setDraft({ ...draft, to_path: e.target.value })} placeholder="/blog/new-url" className={input} required />
          </div>
          <button type="submit" className={btnPrimary}>Add redirect</button>
        </form>
      </div>
    </div>
  )
}
