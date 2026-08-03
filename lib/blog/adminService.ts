/* ─────────────────────────────────────────────────────────────
   Blog CMS — admin data layer

   All writes are RLS-gated on the server by public.is_blog_editor()
   (profiles.role in admin / super_admin), so a non-admin session
   cannot mutate content even if the UI were bypassed.
   ───────────────────────────────────────────────────────────── */

import { supabase as _sb, isSupabaseConfigured } from '@/lib/supabase/client'
import type { CmsPost, CmsCategory, CmsAuthor, CmsTag, CmsReport } from './cmsService'

const sb = _sb as any

export interface AdminResult<T = any> { ok: boolean; message?: string; data?: T }

const fail = (message: string): AdminResult => ({ ok: false, message })
const ok = <T,>(data?: T): AdminResult<T> => ({ ok: true, data })

function guard(): AdminResult | null {
  if (!isSupabaseConfigured()) return fail('Supabase is not configured.')
  return null
}

// ── Slug helpers ────────────────────────────────────────────

export function slugify(value: string): string {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

/** Returns a slug that is not already taken (appends -2, -3, …). */
export async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  const root = slugify(base) || 'post'
  let candidate = root
  for (let i = 2; i < 60; i++) {
    const { data } = await sb.from('blog_posts').select('id').eq('slug', candidate).maybeSingle()
    if (!data || (ignoreId && data.id === ignoreId)) return candidate
    candidate = `${root}-${i}`
  }
  return `${root}-${Date.now().toString(36)}`
}

export function estimateReadTime(content: string): number {
  const words = String(content || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}

// ── Posts ───────────────────────────────────────────────────

export interface AdminPostFilters {
  status?: string
  categoryId?: string
  authorId?: string
  search?: string
  includeDeleted?: boolean
}

const ADMIN_JOINS =
  'blog_categories:category_id ( id, slug, name ), ' +
  'blog_authors:author_id ( id, slug, name, avatar_url )'

export async function listPosts(filters: AdminPostFilters = {}): Promise<CmsPost[]> {
  if (!isSupabaseConfigured()) return []
  try {
    let q = sb.from('blog_posts').select(`*, ${ADMIN_JOINS}`)
    if (!filters.includeDeleted) q = q.is('deleted_at', null)
    if (filters.status && filters.status !== 'all') q = q.eq('status', filters.status)
    if (filters.categoryId) q = q.eq('category_id', filters.categoryId)
    if (filters.authorId) q = q.eq('author_id', filters.authorId)
    if (filters.search?.trim()) {
      const s = filters.search.trim().replace(/[%,()]/g, ' ')
      q = q.or(`title.ilike.%${s}%,slug.ilike.%${s}%,excerpt.ilike.%${s}%`)
    }
    const { data, error } = await q.order('updated_at', { ascending: false }).limit(500)
    if (error) { console.warn('[cms/admin] listPosts:', error.message); return [] }
    return (data || []) as CmsPost[]
  } catch { return [] }
}

export async function getPostById(id: string): Promise<CmsPost | null> {
  if (!isSupabaseConfigured() || !id) return null
  try {
    const { data } = await sb.from('blog_posts').select(`*, ${ADMIN_JOINS}`).eq('id', id).maybeSingle()
    return data || null
  } catch { return null }
}

/** Columns the editor is allowed to write. Anything else is ignored
 *  so a stray field can never corrupt a row. */
const WRITABLE = [
  'slug', 'title', 'subtitle', 'excerpt', 'content', 'content_format',
  'category_id', 'author_id', 'author', 'category', 'tags', 'cover_image',
  'thumbnail_image', 'og_image', 'gallery', 'video_url', 'status',
  'featured', 'editors_pick', 'allow_comments', 'noindex', 'canonical_url',
  'read_time', 'meta_title', 'meta_description', 'meta_keywords',
  'published_at', 'scheduled_at', 'legacy_component',
] as const

function pickWritable(input: Record<string, any>) {
  const out: Record<string, any> = {}
  for (const k of WRITABLE) if (k in input) out[k] = input[k]
  return out
}

export async function createPost(input: Partial<CmsPost>): Promise<AdminResult<CmsPost>> {
  const g = guard(); if (g) return g
  try {
    const payload = pickWritable(input as any)
    payload.slug = await uniqueSlug(payload.slug || payload.title || 'untitled')
    payload.status = payload.status || 'draft'
    payload.origin = 'cms'
    if (!payload.read_time) payload.read_time = estimateReadTime(payload.content || '')

    const { data, error } = await sb.from('blog_posts').insert(payload).select('*').single()
    if (error) return fail(error.message)
    await syncPostTags(data.id, (payload.tags as string[]) || [])
    return ok(data as CmsPost)
  } catch (e: any) { return fail(e?.message || 'Could not create the post.') }
}

export async function updatePost(id: string, input: Partial<CmsPost>): Promise<AdminResult<CmsPost>> {
  const g = guard(); if (g) return g
  try {
    const payload = pickWritable(input as any)
    if (payload.slug) payload.slug = await uniqueSlug(payload.slug, id)
    if (payload.content !== undefined && !payload.read_time) {
      payload.read_time = estimateReadTime(payload.content || '')
    }
    const { data, error } = await sb.from('blog_posts').update(payload).eq('id', id).select('*').single()
    if (error) return fail(error.message)
    if (payload.tags) await syncPostTags(id, payload.tags as string[])
    return ok(data as CmsPost)
  } catch (e: any) { return fail(e?.message || 'Could not save the post.') }
}

/** Lightweight autosave — writes to a side column so the live post
 *  is never altered by an in-progress draft. */
export async function autosavePost(id: string, content: string): Promise<void> {
  if (!isSupabaseConfigured() || !id) return
  try {
    await sb.from('blog_posts')
      .update({ autosave_content: content, autosave_at: new Date().toISOString() })
      .eq('id', id)
  } catch { /* autosave must never surface an error */ }
}

export async function clearAutosave(id: string): Promise<void> {
  if (!isSupabaseConfigured() || !id) return
  try { await sb.from('blog_posts').update({ autosave_content: null, autosave_at: null }).eq('id', id) } catch { /* ignore */ }
}

export async function setPostStatus(
  id: string,
  status: 'draft' | 'scheduled' | 'published' | 'archived',
  scheduledAt?: string | null,
): Promise<AdminResult> {
  const g = guard(); if (g) return g
  try {
    const patch: Record<string, any> = { status }
    if (status === 'scheduled') {
      if (!scheduledAt) return fail('Pick a date and time to schedule.')
      patch.scheduled_at = scheduledAt
      patch.published_at = null
    }
    if (status === 'published') patch.scheduled_at = null
    const { error } = await sb.from('blog_posts').update(patch).eq('id', id)
    if (error) return fail(error.message)
    return ok()
  } catch (e: any) { return fail(e?.message || 'Could not change the status.') }
}

/** Soft delete → Trash. Recoverable. */
export async function trashPost(id: string): Promise<AdminResult> {
  const g = guard(); if (g) return g
  try {
    const { error } = await sb.from('blog_posts')
      .update({ deleted_at: new Date().toISOString(), status: 'archived' }).eq('id', id)
    if (error) return fail(error.message)
    return ok()
  } catch (e: any) { return fail(e?.message || 'Could not move the post to trash.') }
}

export async function restorePost(id: string): Promise<AdminResult> {
  const g = guard(); if (g) return g
  try {
    const { error } = await sb.from('blog_posts')
      .update({ deleted_at: null, status: 'draft' }).eq('id', id)
    if (error) return fail(error.message)
    return ok()
  } catch (e: any) { return fail(e?.message || 'Could not restore the post.') }
}

/** Irreversible. Only offered from the Trash view. */
export async function deletePostForever(id: string): Promise<AdminResult> {
  const g = guard(); if (g) return g
  try {
    const { error } = await sb.from('blog_posts').delete().eq('id', id)
    if (error) return fail(error.message)
    return ok()
  } catch (e: any) { return fail(e?.message || 'Could not delete the post.') }
}

export async function duplicatePost(id: string): Promise<AdminResult<CmsPost>> {
  const g = guard(); if (g) return g
  try {
    const src = await getPostById(id)
    if (!src) return fail('Post not found.')
    const copy: Record<string, any> = pickWritable(src as any)
    copy.title = `${src.title} (copy)`
    copy.slug = await uniqueSlug(`${src.slug}-copy`)
    copy.status = 'draft'
    copy.published_at = null
    copy.scheduled_at = null
    copy.featured = false
    copy.editors_pick = false
    const { data, error } = await sb.from('blog_posts').insert(copy).select('*').single()
    if (error) return fail(error.message)
    return ok(data as CmsPost)
  } catch (e: any) { return fail(e?.message || 'Could not duplicate the post.') }
}

// ── Tags ────────────────────────────────────────────────────

async function syncPostTags(postId: string, tagNames: string[]): Promise<void> {
  try {
    const clean = (tagNames || []).map((t) => String(t).trim()).filter(Boolean)
    const ids: string[] = []
    for (const name of clean) {
      const slug = slugify(name)
      if (!slug) continue
      let { data: tag } = await sb.from('blog_tags').select('id').eq('slug', slug).maybeSingle()
      if (!tag) {
        const { data: made } = await sb.from('blog_tags').insert({ slug, name }).select('id').single()
        tag = made
      }
      if (tag?.id) ids.push(tag.id)
    }
    await sb.from('blog_post_tags').delete().eq('post_id', postId)
    if (ids.length) {
      await sb.from('blog_post_tags').insert(ids.map((tag_id) => ({ post_id: postId, tag_id })))
    }
  } catch { /* tags are secondary — never block the save */ }
}

export async function listTags(): Promise<(CmsTag & { post_count: number })[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const [{ data: tags }, { data: links }] = await Promise.all([
      sb.from('blog_tags').select('*').order('name'),
      sb.from('blog_post_tags').select('tag_id'),
    ])
    const counts = new Map<string, number>()
    for (const l of links || []) counts.set(l.tag_id, (counts.get(l.tag_id) || 0) + 1)
    return (tags || []).map((t: CmsTag) => ({ ...t, post_count: counts.get(t.id) || 0 }))
  } catch { return [] }
}

/** Create a tag up front. Tags are normally created implicitly when an
 *  author types one into an article; this lets the vocabulary be curated
 *  in advance and gives a way back after one is deleted. */
export async function createTag(name: string): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const clean = (name || '').trim()
  if (!clean) return fail('Enter a tag name.')
  const slug = slugify(clean)
  if (!slug) return fail('That name has no usable characters.')
  try {
    const { data: existing } = await sb.from('blog_tags').select('id').eq('slug', slug).maybeSingle()
    if (existing) return fail('That tag already exists.')
    const { error } = await sb.from('blog_tags').insert({ slug, name: clean })
    return error ? fail(error.message) : ok()
  } catch (e: any) { return fail(e?.message || 'Could not create the tag.') }
}

export async function deleteTag(id: string): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const { error } = await sb.from('blog_tags').delete().eq('id', id)
  return error ? fail(error.message) : ok()
}

// ── Categories ──────────────────────────────────────────────

export async function listCategoriesAdmin(): Promise<(CmsCategory & { post_count: number })[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const [{ data: cats }, { data: posts }] = await Promise.all([
      sb.from('blog_categories').select('*').order('sort_order').order('name'),
      sb.from('blog_posts').select('category_id').is('deleted_at', null),
    ])
    const counts = new Map<string, number>()
    for (const p of posts || []) if (p.category_id) counts.set(p.category_id, (counts.get(p.category_id) || 0) + 1)
    return (cats || []).map((c: CmsCategory) => ({ ...c, post_count: counts.get(c.id) || 0 }))
  } catch { return [] }
}

export async function saveCategory(input: Partial<CmsCategory> & { id?: string }): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const payload: Record<string, any> = {
    name: input.name, slug: input.slug || slugify(input.name || ''),
    description: input.description ?? null,
    parent_id: input.parent_id || null,
    seo_title: input.seo_title ?? null,
    seo_description: input.seo_description ?? null,
    sort_order: input.sort_order ?? 100,
    is_active: input.is_active ?? true,
    updated_at: new Date().toISOString(),
  }
  if (!payload.name || !payload.slug) return fail('Name is required.')
  const { error } = input.id
    ? await sb.from('blog_categories').update(payload).eq('id', input.id)
    : await sb.from('blog_categories').insert(payload)
  return error ? fail(error.message) : ok()
}

export async function deleteCategory(id: string): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const { error } = await sb.from('blog_categories').delete().eq('id', id)
  return error ? fail(error.message) : ok()
}

// ── Authors ─────────────────────────────────────────────────

export async function listAuthorsAdmin(): Promise<(CmsAuthor & { post_count: number })[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const [{ data: authors }, { data: posts }] = await Promise.all([
      sb.from('blog_authors').select('*').order('sort_order').order('name'),
      sb.from('blog_posts').select('author_id').is('deleted_at', null),
    ])
    const counts = new Map<string, number>()
    for (const p of posts || []) if (p.author_id) counts.set(p.author_id, (counts.get(p.author_id) || 0) + 1)
    return (authors || []).map((a: CmsAuthor) => ({ ...a, post_count: counts.get(a.id) || 0 }))
  } catch { return [] }
}

export async function saveAuthor(input: Partial<CmsAuthor> & { id?: string }): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const payload: Record<string, any> = {
    name: input.name, slug: input.slug || slugify(input.name || ''),
    title: input.title ?? null, bio: input.bio ?? null,
    avatar_url: input.avatar_url ?? null, email: input.email ?? null,
    linkedin_url: input.linkedin_url ?? null, twitter_url: input.twitter_url ?? null,
    is_active: input.is_active ?? true,
    updated_at: new Date().toISOString(),
  }
  if (!payload.name || !payload.slug) return fail('Name is required.')
  const { error } = input.id
    ? await sb.from('blog_authors').update(payload).eq('id', input.id)
    : await sb.from('blog_authors').insert(payload)
  return error ? fail(error.message) : ok()
}

export async function deleteAuthor(id: string): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const { error } = await sb.from('blog_authors').delete().eq('id', id)
  return error ? fail(error.message) : ok()
}

// ── Media library ───────────────────────────────────────────

export interface MediaItem {
  id: string
  file_name: string
  public_url: string
  storage_path: string
  mime_type: string | null
  file_size: number | null
  alt_text: string | null
  folder: string
  created_at: string
}

const MEDIA_BUCKET = 'ghl-media'

export async function listMedia(folder?: string): Promise<MediaItem[]> {
  if (!isSupabaseConfigured()) return []
  try {
    let q = sb.from('blog_media').select('*').order('created_at', { ascending: false }).limit(400)
    if (folder && folder !== 'all') q = q.eq('folder', folder)
    const { data } = await q
    return data || []
  } catch { return [] }
}

export async function uploadMedia(file: File, folder = 'general', altText = ''): Promise<AdminResult<MediaItem>> {
  const g = guard(); if (g) return g
  try {
    const safe = file.name.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-100)
    const path = `blog/${folder}/${Date.now()}-${safe}`

    // Re-wrap the File so Storage sees an explicit mime type: it reads
    // the Blob's own .type, not the contentType option.
    const blob = new Blob([file], { type: file.type || 'application/octet-stream' })

    const { error: upErr } = await sb.storage.from(MEDIA_BUCKET)
      .upload(path, blob, { contentType: file.type || undefined, upsert: false, cacheControl: '31536000' })
    if (upErr) return fail(upErr.message)

    const { data: pub } = sb.storage.from(MEDIA_BUCKET).getPublicUrl(path)

    const row = {
      file_name: safe, original_name: file.name, storage_path: path,
      public_url: pub.publicUrl, mime_type: file.type || null,
      file_size: file.size, folder, alt_text: altText || null,
    }
    const { data, error } = await sb.from('blog_media').insert(row).select('*').single()
    if (error) return fail(error.message)
    return ok(data as MediaItem)
  } catch (e: any) { return fail(e?.message || 'Upload failed.') }
}

export async function deleteMedia(item: MediaItem): Promise<AdminResult> {
  const g = guard(); if (g) return g
  try {
    await sb.storage.from(MEDIA_BUCKET).remove([item.storage_path])
    const { error } = await sb.from('blog_media').delete().eq('id', item.id)
    return error ? fail(error.message) : ok()
  } catch (e: any) { return fail(e?.message || 'Could not delete the file.') }
}

export async function updateMediaAlt(id: string, alt: string): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const { error } = await sb.from('blog_media').update({ alt_text: alt }).eq('id', id)
  return error ? fail(error.message) : ok()
}

// ── Revisions ───────────────────────────────────────────────

export async function listRevisions(postId: string) {
  if (!isSupabaseConfigured() || !postId) return []
  try {
    const { data } = await sb.from('blog_revisions').select('*')
      .eq('post_id', postId).order('revision_no', { ascending: false }).limit(30)
    return data || []
  } catch { return [] }
}

export async function restoreRevision(postId: string, revisionId: string): Promise<AdminResult> {
  const g = guard(); if (g) return g
  try {
    const { data: rev } = await sb.from('blog_revisions').select('*').eq('id', revisionId).maybeSingle()
    if (!rev) return fail('Revision not found.')
    const { error } = await sb.from('blog_posts').update({
      title: rev.title, subtitle: rev.subtitle, excerpt: rev.excerpt,
      content: rev.content, content_format: rev.content_format,
      cover_image: rev.cover_image, meta_title: rev.meta_title,
      meta_description: rev.meta_description, meta_keywords: rev.meta_keywords,
    }).eq('id', postId)
    return error ? fail(error.message) : ok()
  } catch (e: any) { return fail(e?.message || 'Could not restore that revision.') }
}

// ── Comments ────────────────────────────────────────────────

export async function listComments(status = 'all') {
  if (!isSupabaseConfigured()) return []
  try {
    let q = sb.from('blog_comments').select('*, blog_posts:post_id ( title, slug )')
      .order('created_at', { ascending: false }).limit(300)
    if (status !== 'all') q = q.eq('status', status)
    const { data } = await q
    return data || []
  } catch { return [] }
}

export async function moderateComment(id: string, status: 'approved' | 'rejected' | 'spam' | 'pending'): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const { error } = await sb.from('blog_comments')
    .update({ status, moderated_at: new Date().toISOString() }).eq('id', id)
  return error ? fail(error.message) : ok()
}

export async function deleteComment(id: string): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const { error } = await sb.from('blog_comments').delete().eq('id', id)
  return error ? fail(error.message) : ok()
}

// ── Redirects ───────────────────────────────────────────────

export async function listRedirects() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data } = await sb.from('blog_redirects').select('*').order('created_at', { ascending: false }).limit(300)
    return data || []
  } catch { return [] }
}

export async function saveRedirect(input: { id?: string; from_path: string; to_path: string; is_active?: boolean }): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const from_path = input.from_path.trim().startsWith('/') ? input.from_path.trim() : `/${input.from_path.trim()}`
  const to_path = input.to_path.trim().startsWith('/') ? input.to_path.trim() : `/${input.to_path.trim()}`
  if (from_path === to_path) return fail('A redirect cannot point at itself.')
  const payload = { from_path, to_path, is_active: input.is_active ?? true, reason: 'manual' }
  const { error } = input.id
    ? await sb.from('blog_redirects').update(payload).eq('id', input.id)
    : await sb.from('blog_redirects').upsert(payload, { onConflict: 'from_path' })
  return error ? fail(error.message) : ok()
}

export async function deleteRedirect(id: string): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const { error } = await sb.from('blog_redirects').delete().eq('id', id)
  return error ? fail(error.message) : ok()
}

// ── Reports ─────────────────────────────────────────────────

export async function listReportsAdmin(): Promise<CmsReport[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data } = await sb.from('blog_reports').select('*').order('created_at', { ascending: false })
    return data || []
  } catch { return [] }
}

export async function saveReport(input: Partial<CmsReport> & { id?: string }): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const payload: Record<string, any> = {
    title: input.title, slug: input.slug || slugify(input.title || ''),
    description: input.description ?? null, cover_image: input.cover_image ?? null,
    pdf_url: input.pdf_url, pdf_filename: input.pdf_filename ?? null,
    status: input.status || 'draft', gated: input.gated ?? true,
    updated_at: new Date().toISOString(),
  }
  if (!payload.title) return fail('Title is required.')
  if (!payload.pdf_url) return fail('Upload a PDF first.')
  const { error } = input.id
    ? await sb.from('blog_reports').update(payload).eq('id', input.id)
    : await sb.from('blog_reports').insert(payload)
  return error ? fail(error.message) : ok()
}

export async function deleteReport(id: string): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const { error } = await sb.from('blog_reports').delete().eq('id', id)
  return error ? fail(error.message) : ok()
}

export async function listReportLeads() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data } = await sb.from('blog_report_leads')
      .select('*, blog_reports:report_id ( title )')
      .order('created_at', { ascending: false }).limit(500)
    return data || []
  } catch { return [] }
}

// ── Subscribers ─────────────────────────────────────────────

export async function listSubscribers() {
  if (!isSupabaseConfigured()) return []
  try {
    const { data } = await sb.from('newsletter_subscribers').select('*')
      .order('created_at', { ascending: false }).limit(1000)
    return data || []
  } catch { return [] }
}

export async function setSubscriberActive(id: string, active: boolean): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const { error } = await sb.from('newsletter_subscribers')
    .update({ is_active: active, unsubscribed_at: active ? null : new Date().toISOString() })
    .eq('id', id)
  return error ? fail(error.message) : ok()
}

// ── Settings ────────────────────────────────────────────────

export async function saveSetting(key: string, value: any): Promise<AdminResult> {
  const g = guard(); if (g) return g
  const { error } = await sb.from('blog_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  return error ? fail(error.message) : ok()
}

// ── Analytics ───────────────────────────────────────────────

export interface BlogAnalyticsSummary {
  totalViews: number
  viewsLast30: number
  totalPosts: number
  publishedPosts: number
  drafts: number
  scheduled: number
  subscribers: number
  pendingComments: number
  avgSecondsRead: number
  avgScrollDepth: number
  topPosts: { slug: string; title: string; views: number }[]
  sources: { source: string; count: number }[]
  daily: { date: string; count: number }[]
  devices: { device: string; count: number }[]
}

export async function getAnalyticsSummary(days = 30): Promise<BlogAnalyticsSummary> {
  const empty: BlogAnalyticsSummary = {
    totalViews: 0, viewsLast30: 0, totalPosts: 0, publishedPosts: 0, drafts: 0,
    scheduled: 0, subscribers: 0, pendingComments: 0, avgSecondsRead: 0,
    avgScrollDepth: 0, topPosts: [], sources: [], daily: [], devices: [],
  }
  if (!isSupabaseConfigured()) return empty

  try {
    const since = new Date(Date.now() - days * 86400_000).toISOString()

    const [postsRes, viewsRes, subsRes, commentsRes] = await Promise.all([
      sb.from('blog_posts').select('slug, title, views, status').is('deleted_at', null),
      sb.from('blog_post_views').select('created_at, traffic_source, device, seconds_read, scroll_depth')
        .gte('created_at', since).limit(20000),
      sb.from('newsletter_subscribers').select('id', { count: 'exact', head: true }).eq('is_active', true),
      sb.from('blog_comments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    ])

    const posts = postsRes.data || []
    const views = viewsRes.data || []

    const bucket = (arr: any[], key: string) => {
      const m = new Map<string, number>()
      for (const r of arr) {
        const k = r[key] || 'unknown'
        m.set(k, (m.get(k) || 0) + 1)
      }
      return Array.from(m.entries()).map(([k, count]) => ({ k, count })).sort((a, b) => b.count - a.count)
    }

    const dayMap = new Map<string, number>()
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10)
      dayMap.set(d, 0)
    }
    for (const v of views) {
      const d = String(v.created_at).slice(0, 10)
      if (dayMap.has(d)) dayMap.set(d, (dayMap.get(d) || 0) + 1)
    }

    const readSecs = views.map((v: any) => v.seconds_read).filter((n: any) => typeof n === 'number' && n > 0)
    const scrolls = views.map((v: any) => v.scroll_depth).filter((n: any) => typeof n === 'number' && n > 0)

    return {
      totalViews: posts.reduce((n: number, p: any) => n + (p.views || 0), 0),
      viewsLast30: views.length,
      totalPosts: posts.length,
      publishedPosts: posts.filter((p: any) => p.status === 'published').length,
      drafts: posts.filter((p: any) => p.status === 'draft').length,
      scheduled: posts.filter((p: any) => p.status === 'scheduled').length,
      subscribers: subsRes.count || 0,
      pendingComments: commentsRes.count || 0,
      avgSecondsRead: readSecs.length ? Math.round(readSecs.reduce((a: number, b: number) => a + b, 0) / readSecs.length) : 0,
      avgScrollDepth: scrolls.length ? Math.round(scrolls.reduce((a: number, b: number) => a + b, 0) / scrolls.length) : 0,
      topPosts: [...posts].sort((a: any, b: any) => (b.views || 0) - (a.views || 0)).slice(0, 10)
        .map((p: any) => ({ slug: p.slug, title: p.title, views: p.views || 0 })),
      sources: bucket(views, 'traffic_source').map((r) => ({ source: r.k, count: r.count })),
      devices: bucket(views, 'device').map((r) => ({ device: r.k, count: r.count })),
      daily: Array.from(dayMap.entries()).map(([date, count]) => ({ date, count })),
    }
  } catch { return empty }
}

// ── Internal linking suggestions ────────────────────────────

/** Suggests other published posts worth linking to from this draft,
 *  scored on shared category, shared tags and title-term overlap. */
export async function suggestInternalLinks(
  post: { id?: string; title: string; content: string; category_id?: string | null; tags?: string[] | null },
  limit = 6,
): Promise<{ slug: string; title: string; reason: string; score: number }[]> {
  if (!isSupabaseConfigured()) return []
  try {
    const { data } = await sb.from('blog_posts')
      .select('id, slug, title, category_id, tags')
      .eq('status', 'published').is('deleted_at', null).limit(300)

    const STOP = new Set(['the','and','for','with','from','that','this','into','your','are','how','why','what','a','an','of','in','to','is','on','it','as','india','indian','ghl'])
    const terms = (s: string) => new Set(
      String(s || '').toLowerCase().replace(/<[^>]*>/g, ' ')
        .split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP.has(w)),
    )

    const mine = terms(`${post.title} ${post.content}`)
    const myTags = new Set((post.tags || []).map((t) => String(t).toLowerCase()))
    const body = String(post.content || '').toLowerCase()

    const scored = (data || [])
      .filter((p: any) => p.id !== post.id)
      // don't suggest a link that already exists in the body
      .filter((p: any) => !body.includes(`/blog/${p.slug}`))
      .map((p: any) => {
        let score = 0
        const reasons: string[] = []
        if (post.category_id && p.category_id === post.category_id) { score += 3; reasons.push('same category') }
        const shared = (p.tags || []).filter((t: string) => myTags.has(String(t).toLowerCase()))
        if (shared.length) { score += shared.length * 2; reasons.push(`shares ${shared.join(', ')}`) }
        const theirs = terms(p.title)
        let overlap = 0
        theirs.forEach((t) => { if (mine.has(t)) overlap++ })
        if (overlap) { score += overlap; reasons.push(`${overlap} shared topic term${overlap === 1 ? '' : 's'}`) }
        return { slug: p.slug, title: p.title, score, reason: reasons.join(' · ') || 'related coverage' }
      })
      .filter((r: any) => r.score > 0)
      .sort((a: any, b: any) => b.score - a.score)
      .slice(0, limit)

    return scored
  } catch { return [] }
}
