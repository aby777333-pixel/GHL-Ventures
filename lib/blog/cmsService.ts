/* ─────────────────────────────────────────────────────────────
   Blog CMS — data access layer

   Single source of truth for BOTH ghlindiaventures.com/blog/ and
   blog.ghlindiaventures.com (which now serves from this same app).

   Safe to call from the server (build-time generateStaticParams /
   generateMetadata) and from the browser — it is plain PostgREST
   over fetch, gated by isSupabaseConfigured() so a missing env var
   degrades to an empty list rather than throwing.
   ───────────────────────────────────────────────────────────── */

import { supabase as _sb, isSupabaseConfigured } from '@/lib/supabase/client'

const sb = _sb as any

export const BLOG_SITE_URL = 'https://ghlindiaventures.com'
export const BLOG_BASE = '/blog'
export const POSTS_PER_PAGE = 9

// ── Types ───────────────────────────────────────────────────
export type PostStatus = 'draft' | 'scheduled' | 'published' | 'archived'
export type ContentFormat = 'html' | 'markdown' | 'paragraphs' | 'component'

export interface CmsPost {
  id: string
  slug: string
  title: string
  subtitle: string | null
  excerpt: string | null
  content: string | null
  content_format: ContentFormat
  legacy_component: string | null
  author: string | null
  author_id: string | null
  category: string | null
  category_id: string | null
  tags: string[] | null
  cover_image: string | null
  thumbnail_image: string | null
  og_image: string | null
  gallery: { url: string; alt?: string; caption?: string }[] | null
  video_url: string | null
  status: PostStatus
  published: boolean
  featured: boolean
  editors_pick: boolean
  allow_comments: boolean
  noindex: boolean
  canonical_url: string | null
  read_time: number | null
  views: number
  meta_title: string | null
  meta_description: string | null
  meta_keywords: string | null
  published_at: string | null
  scheduled_at: string | null
  created_at: string
  updated_at: string
  /** set when the post is in Trash — soft-deleted, recoverable */
  deleted_at?: string | null
  archived_at?: string | null
  /** joined */
  blog_categories?: CmsCategory | null
  blog_authors?: CmsAuthor | null
}

export interface CmsCategory {
  id: string
  slug: string
  name: string
  description: string | null
  parent_id: string | null
  seo_title: string | null
  seo_description: string | null
  sort_order: number
  is_active: boolean
}

export interface CmsAuthor {
  id: string
  slug: string
  name: string
  title: string | null
  bio: string | null
  avatar_url: string | null
  email: string | null
  linkedin_url: string | null
  twitter_url: string | null
  is_active: boolean
}

export interface CmsTag { id: string; slug: string; name: string }

export interface CmsReport {
  id: string
  slug: string
  title: string
  description: string | null
  cover_image: string | null
  pdf_url: string
  pdf_filename: string | null
  status: string
  gated: boolean
  download_count: number
}

// ── Shared select lists ─────────────────────────────────────
const CARD_FIELDS =
  'id, slug, title, subtitle, excerpt, category, category_id, author, author_id, cover_image, thumbnail_image, ' +
  'tags, featured, editors_pick, read_time, views, published_at, created_at, status, content_format'

const FULL_FIELDS = '*'

const JOINS =
  'blog_categories:category_id ( id, slug, name, description, parent_id ), ' +
  'blog_authors:author_id ( id, slug, name, title, bio, avatar_url, linkedin_url, twitter_url )'

/** Every read of published content goes through this so status,
 *  soft-deletes and scheduling are handled in exactly one place. */
function publishedQuery(fields: string = CARD_FIELDS) {
  return sb
    .from('blog_posts')
    .select(`${fields}, ${JOINS}`)
    .eq('status', 'published')
    .is('deleted_at', null)
}

function normalise(row: any): CmsPost | null {
  if (!row) return null
  return {
    ...row,
    tags: Array.isArray(row.tags) ? row.tags : [],
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    views: row.views ?? 0,
  } as CmsPost
}

function normaliseAll(rows: any[] | null): CmsPost[] {
  return (rows || []).map(normalise).filter(Boolean) as CmsPost[]
}

/** Flip any post whose scheduled_at has passed. pg_cron does this
 *  every minute too; this is the belt-and-braces path so scheduling
 *  still works if cron is ever paused. Fire-and-forget. */
let lastSweep = 0
export function sweepScheduled(): void {
  if (!isSupabaseConfigured()) return
  const now = Date.now()
  if (now - lastSweep < 60_000) return
  lastSweep = now
  try { sb.rpc('publish_due_blog_posts').then(() => {}, () => {}) } catch { /* non-fatal */ }
}

// ── Posts ───────────────────────────────────────────────────

export async function getPublishedPosts(limit?: number): Promise<CmsPost[]> {
  if (!isSupabaseConfigured()) return []
  sweepScheduled()
  try {
    let q = publishedQuery().order('published_at', { ascending: false, nullsFirst: false })
    if (limit) q = q.limit(limit)
    const { data, error } = await q
    if (error) { console.warn('[cms] getPublishedPosts:', error.message); return [] }
    return normaliseAll(data)
  } catch { return [] }
}

export async function getPostBySlug(slug: string, opts?: { allowDraft?: boolean }): Promise<CmsPost | null> {
  if (!isSupabaseConfigured() || !slug) return null
  try {
    let q = sb.from('blog_posts').select(`${FULL_FIELDS}, ${JOINS}`).eq('slug', slug).is('deleted_at', null)
    if (!opts?.allowDraft) q = q.eq('status', 'published')
    const { data, error } = await q.maybeSingle()
    if (error || !data) return null
    return normalise(data)
  } catch { return null }
}

/** Used by generateStaticParams — slugs only, cheap. */
export async function getAllPublishedSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await sb
      .from('blog_posts').select('slug').eq('status', 'published').is('deleted_at', null)
    if (error || !data) return []
    return data.map((r: any) => r.slug).filter(Boolean)
  } catch { return [] }
}

export async function getFeaturedPost(): Promise<CmsPost | null> {
  if (!isSupabaseConfigured()) return null
  try {
    const { data } = await publishedQuery().eq('featured', true)
      .order('published_at', { ascending: false, nullsFirst: false }).limit(1)
    if (data?.length) return normalise(data[0])
    // fall back to the most recent post so the hero is never empty
    const { data: latest } = await publishedQuery()
      .order('published_at', { ascending: false, nullsFirst: false }).limit(1)
    return latest?.length ? normalise(latest[0]) : null
  } catch { return null }
}

export async function getEditorsPicks(limit = 4): Promise<CmsPost[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data } = await publishedQuery().eq('editors_pick', true)
      .order('published_at', { ascending: false, nullsFirst: false }).limit(limit)
    return normaliseAll(data)
  } catch { return [] }
}

export async function getPopularPosts(limit = 5): Promise<CmsPost[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data } = await publishedQuery().order('views', { ascending: false }).limit(limit)
    return normaliseAll(data)
  } catch { return [] }
}

export async function getPostsByCategorySlug(catSlug: string): Promise<CmsPost[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const cat = await getCategoryBySlug(catSlug)
    if (!cat) return []
    // include direct subcategories
    const { data: kids } = await sb.from('blog_categories').select('id').eq('parent_id', cat.id)
    const ids = [cat.id, ...((kids || []).map((k: any) => k.id))]
    const { data } = await publishedQuery().in('category_id', ids)
      .order('published_at', { ascending: false, nullsFirst: false })
    return normaliseAll(data)
  } catch { return [] }
}

export async function getPostsByAuthorSlug(authorSlug: string): Promise<CmsPost[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const author = await getAuthorBySlug(authorSlug)
    if (!author) return []
    const { data } = await publishedQuery().eq('author_id', author.id)
      .order('published_at', { ascending: false, nullsFirst: false })
    return normaliseAll(data)
  } catch { return [] }
}

export async function getPostsByTagSlug(tagSlug: string): Promise<CmsPost[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data: tag } = await sb.from('blog_tags').select('id, name').eq('slug', tagSlug).maybeSingle()
    if (!tag) return []
    const { data: links } = await sb.from('blog_post_tags').select('post_id').eq('tag_id', tag.id)
    const ids = (links || []).map((l: any) => l.post_id)
    if (!ids.length) return []
    const { data } = await publishedQuery().in('id', ids)
      .order('published_at', { ascending: false, nullsFirst: false })
    return normaliseAll(data)
  } catch { return [] }
}

export async function searchPosts(term: string): Promise<CmsPost[]> {
  if (!isSupabaseConfigured() || !term?.trim()) return []
  const q = term.trim().replace(/[%,()]/g, ' ')
  try {
    const { data } = await publishedQuery()
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%,category.ilike.%${q}%`)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(60)
    return normaliseAll(data)
  } catch { return [] }
}

/** Related: manual picks first, then same category, then shared tags. */
export async function getRelatedPosts(post: CmsPost, limit = 3): Promise<CmsPost[]> {
  if (!isSupabaseConfigured() || !post) return []
  const out: CmsPost[] = []
  const seen = new Set<string>([post.id])

  try {
    const { data: manual } = await sb
      .from('blog_related_posts')
      .select('related_id, sort_order')
      .eq('post_id', post.id)
      .order('sort_order')
    const manualIds = (manual || []).map((m: any) => m.related_id)
    if (manualIds.length) {
      const { data } = await publishedQuery().in('id', manualIds)
      for (const p of normaliseAll(data)) { if (!seen.has(p.id)) { out.push(p); seen.add(p.id) } }
    }
  } catch { /* ignore */ }

  if (out.length < limit && post.category_id) {
    try {
      const { data } = await publishedQuery()
        .eq('category_id', post.category_id).neq('id', post.id)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(limit * 2)
      for (const p of normaliseAll(data)) {
        if (out.length >= limit) break
        if (!seen.has(p.id)) { out.push(p); seen.add(p.id) }
      }
    } catch { /* ignore */ }
  }

  if (out.length < limit) {
    try {
      const { data } = await publishedQuery().neq('id', post.id)
        .order('published_at', { ascending: false, nullsFirst: false })
        .limit(limit * 2)
      for (const p of normaliseAll(data)) {
        if (out.length >= limit) break
        if (!seen.has(p.id)) { out.push(p); seen.add(p.id) }
      }
    } catch { /* ignore */ }
  }

  return out.slice(0, limit)
}

/** Posts grouped by year/month for the archive page. */
export async function getArchiveIndex(): Promise<{ year: number; months: { month: number; label: string; count: number; posts: CmsPost[] }[] }[]> {
  const posts = await getPublishedPosts()
  const byYear = new Map<number, Map<number, CmsPost[]>>()
  for (const p of posts) {
    const d = new Date(p.published_at || p.created_at)
    if (Number.isNaN(d.getTime())) continue
    const y = d.getFullYear(), m = d.getMonth()
    if (!byYear.has(y)) byYear.set(y, new Map())
    const mm = byYear.get(y)!
    if (!mm.has(m)) mm.set(m, [])
    mm.get(m)!.push(p)
  }
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return Array.from(byYear.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, months]) => ({
      year,
      months: Array.from(months.entries())
        .sort((a, b) => b[0] - a[0])
        .map(([month, ps]) => ({ month, label: MONTHS[month], count: ps.length, posts: ps })),
    }))
}

// ── Taxonomy ────────────────────────────────────────────────

export async function getCategories(opts?: { withCounts?: boolean }): Promise<(CmsCategory & { post_count?: number })[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data, error } = await sb.from('blog_categories').select('*')
      .eq('is_active', true).order('sort_order').order('name')
    if (error || !data) return []
    if (!opts?.withCounts) return data
    const posts = await getPublishedPosts()
    return data.map((c: CmsCategory) => ({
      ...c,
      post_count: posts.filter((p) => p.category_id === c.id).length,
    }))
  } catch { return [] }
}

export async function getCategoryBySlug(slug: string): Promise<CmsCategory | null> {
  if (!isSupabaseConfigured() || !slug) return null
  try {
    const { data } = await sb.from('blog_categories').select('*').eq('slug', slug).maybeSingle()
    return data || null
  } catch { return null }
}

export async function getTags(opts?: { withCounts?: boolean }): Promise<(CmsTag & { post_count?: number })[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data } = await sb.from('blog_tags').select('*').order('name')
    if (!data) return []
    if (!opts?.withCounts) return data
    const { data: links } = await sb.from('blog_post_tags').select('tag_id')
    const counts = new Map<string, number>()
    for (const l of links || []) counts.set(l.tag_id, (counts.get(l.tag_id) || 0) + 1)
    return data.map((t: CmsTag) => ({ ...t, post_count: counts.get(t.id) || 0 }))
  } catch { return [] }
}

export async function getAuthors(): Promise<CmsAuthor[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data } = await sb.from('blog_authors').select('*').eq('is_active', true).order('sort_order')
    return data || []
  } catch { return [] }
}

export async function getAuthorBySlug(slug: string): Promise<CmsAuthor | null> {
  if (!isSupabaseConfigured() || !slug) return null
  try {
    const { data } = await sb.from('blog_authors').select('*').eq('slug', slug).maybeSingle()
    return data || null
  } catch { return null }
}

// ── Reports ─────────────────────────────────────────────────

export async function getReports(): Promise<CmsReport[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data } = await sb.from('blog_reports').select('*')
      .eq('status', 'published').order('sort_order').order('created_at', { ascending: false })
    return data || []
  } catch { return [] }
}

// ── Settings ────────────────────────────────────────────────

export async function getBlogSettings(): Promise<Record<string, any>> {
  if (!isSupabaseConfigured()) return {}
  try {
    const { data } = await sb.from('blog_settings').select('key, value')
    const out: Record<string, any> = {}
    for (const r of data || []) out[r.key] = r.value
    return out
  } catch { return {} }
}

// ── Engagement ──────────────────────────────────────────────

export function recordView(slug: string, sessionId: string): void {
  if (!isSupabaseConfigured() || typeof window === 'undefined') return
  try {
    sb.rpc('increment_blog_post_view', {
      p_slug: slug,
      p_session: sessionId,
      p_referrer: document.referrer || null,
      p_host: window.location.host,
      p_device: window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop',
    }).then(() => {}, () => {})
  } catch { /* analytics must never break the page */ }
}

export function recordReadProgress(slug: string, sessionId: string, seconds: number, scrollPct: number): void {
  if (!isSupabaseConfigured() || typeof window === 'undefined') return
  try {
    sb.rpc('record_blog_read_progress', {
      p_slug: slug, p_session: sessionId,
      p_seconds: Math.round(seconds), p_scroll: Math.round(scrollPct),
    }).then(() => {}, () => {})
  } catch { /* ignore */ }
}

export async function subscribeToNewsletter(email: string, name?: string, source = 'blog'): Promise<{ ok: boolean; message: string }> {
  if (!isSupabaseConfigured()) return { ok: false, message: 'Subscriptions are temporarily unavailable.' }
  const clean = (email || '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) return { ok: false, message: 'Please enter a valid email address.' }
  try {
    const { error } = await sb.from('newsletter_subscribers').upsert(
      { email: clean, name: name?.trim() || null, full_name: name?.trim() || null, source, is_active: true },
      { onConflict: 'email' },
    )
    if (error) {
      // a duplicate is a success from the reader's point of view
      if (/duplicate|conflict/i.test(error.message)) return { ok: true, message: 'You are already subscribed — thank you.' }
      return { ok: false, message: 'Could not subscribe right now. Please try again.' }
    }
    return { ok: true, message: 'Thank you — you are subscribed.' }
  } catch { return { ok: false, message: 'Could not subscribe right now. Please try again.' } }
}

// ── Comments ────────────────────────────────────────────────

export async function getApprovedComments(postId: string) {
  if (!isSupabaseConfigured() || !postId) return []
  try {
    const { data } = await sb.from('blog_comments').select('*')
      .eq('post_id', postId).eq('status', 'approved').order('created_at', { ascending: true })
    return data || []
  } catch { return [] }
}

export async function submitComment(postId: string, name: string, email: string, body: string) {
  if (!isSupabaseConfigured()) return { ok: false, message: 'Comments are unavailable.' }
  if (!name?.trim() || !body?.trim()) return { ok: false, message: 'Name and comment are required.' }
  try {
    const { error } = await sb.from('blog_comments').insert({
      post_id: postId, author_name: name.trim(), author_email: email?.trim() || null,
      body: body.trim(), status: 'pending',
    })
    if (error) return { ok: false, message: 'Could not post your comment.' }
    return { ok: true, message: 'Thank you — your comment is awaiting moderation.' }
  } catch { return { ok: false, message: 'Could not post your comment.' } }
}

// ── Helpers shared by the pages ─────────────────────────────

export function postUrl(slug: string) { return `${BLOG_BASE}/${slug}` }

export function canonicalFor(post: Pick<CmsPost, 'slug' | 'canonical_url'>) {
  return post.canonical_url?.trim() || `${BLOG_SITE_URL}${BLOG_BASE}/${post.slug}`
}

export function formatDate(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

export function formatShortDate(value?: string | null) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

export function readTimeLabel(post: Pick<CmsPost, 'read_time' | 'content'>) {
  if (post.read_time) return `${post.read_time} min read`
  const words = String(post.content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
  return `${Math.max(1, Math.ceil(words / 220))} min read`
}

export function excerptOf(post: Pick<CmsPost, 'excerpt' | 'content'>, max = 180) {
  const raw = post.excerpt?.trim() || String(post.content || '').replace(/<[^>]*>/g, ' ')
  const text = raw.replace(/\s+/g, ' ').trim()
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text
}

/** Stable per-browser id so repeat views by the same reader are
 *  distinguishable from unique ones in the analytics dashboard. */
export function getSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    const KEY = 'ghl_blog_sid'
    let id = window.localStorage.getItem(KEY)
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
      window.localStorage.setItem(KEY, id)
    }
    return id
  } catch { return '' }
}
