#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────
   One-time migration: "GHL Blogs" project  →  central CMS

   Copies the blog.ghlindiaventures.com content out of the
   standalone Supabase project (xktbkmadjhynualgrbeb) into the
   main GHL India Ventures project, which is now the single
   source of truth for both domains.

     • blog_posts   → public.blog_posts   (origin='legacy-subdomain')
     • pdf_reports  → public.blog_reports
     • leads        → public.blog_report_leads
     • every referenced storage asset is COPIED into the main
       project's public `ghl-media` bucket under blog/ and the
       URLs are rewritten, so nothing keeps pointing at the old
       project.

   Idempotent — safe to re-run. Existing slugs are updated, not
   duplicated. Nothing is deleted from the source project.

   Usage:  node scripts/migrate-blog-subdomain-to-cms.mjs [--dry-run]
   ───────────────────────────────────────────────────────────── */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DRY = process.argv.includes('--dry-run')

// ── env ──────────────────────────────────────────────────────
function loadEnv() {
  const out = { ...process.env }
  for (const f of ['.env.local', '.env']) {
    try {
      const txt = readFileSync(resolve(__dirname, '..', f), 'utf8')
      for (const line of txt.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
        if (m && !out[m[1]]) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    } catch { /* optional */ }
  }
  return out
}
const env = loadEnv()

const SRC_URL = 'https://xktbkmadjhynualgrbeb.supabase.co'
const SRC_KEY =
  env.BLOG_SOURCE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrdGJrbWFkamh5bnVhbGdyYmViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTYyNzUsImV4cCI6MjA5MDQzMjI3NX0.AhtRZfA8Gw42C_ZPCnbyiIKVc-lcfFsRAqNqB8VH71Q'

const DST_URL = env.NEXT_PUBLIC_SUPABASE_URL
const DST_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!DST_URL || !DST_KEY) {
  console.error('✖ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (.env.local).')
  process.exit(1)
}

const src = createClient(SRC_URL, SRC_KEY, { auth: { persistSession: false } })
const dst = createClient(DST_URL, DST_KEY, { auth: { persistSession: false } })

const BUCKET = 'ghl-media'
const PREFIX = 'blog'

// ── asset copying ────────────────────────────────────────────
const assetCache = new Map() // oldUrl -> newUrl

function safeName(url) {
  const base = decodeURIComponent(url.split('/').pop() || 'file')
  return base.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(-120)
}

async function copyAsset(oldUrl) {
  if (!oldUrl || typeof oldUrl !== 'string') return oldUrl
  if (!oldUrl.includes('xktbkmadjhynualgrbeb.supabase.co')) return oldUrl
  if (assetCache.has(oldUrl)) return assetCache.get(oldUrl)

  // /storage/v1/object/public/<bucket>/<path>
  const m = oldUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/)
  const folder = m ? m[1] : 'misc'
  const dstPath = `${PREFIX}/${folder}/${safeName(oldUrl)}`

  if (DRY) {
    const url = `${DST_URL}/storage/v1/object/public/${BUCKET}/${dstPath}`
    assetCache.set(oldUrl, url)
    console.log(`   · [dry] would copy ${folder}/${safeName(oldUrl)}`)
    return url
  }

  // already there?
  const { data: existing } = await dst.storage.from(BUCKET)
    .list(dstPath.split('/').slice(0, -1).join('/'), { search: dstPath.split('/').pop() })
  if (existing && existing.length) {
    const { data: pub } = dst.storage.from(BUCKET).getPublicUrl(dstPath)
    assetCache.set(oldUrl, pub.publicUrl)
    return pub.publicUrl
  }

  const res = await fetch(oldUrl)
  if (!res.ok) {
    console.warn(`   ! could not fetch ${oldUrl} (${res.status}) — leaving URL as-is`)
    assetCache.set(oldUrl, oldUrl)
    return oldUrl
  }
  const buf = Buffer.from(await res.arrayBuffer())
  const contentType = res.headers.get('content-type') || 'application/octet-stream'

  const { error } = await dst.storage.from(BUCKET).upload(dstPath, buf, {
    contentType, upsert: true, cacheControl: '31536000',
  })
  if (error) {
    console.warn(`   ! upload failed for ${dstPath}: ${error.message} — leaving URL as-is`)
    assetCache.set(oldUrl, oldUrl)
    return oldUrl
  }
  const { data: pub } = dst.storage.from(BUCKET).getPublicUrl(dstPath)
  assetCache.set(oldUrl, pub.publicUrl)
  console.log(`   ✓ copied ${dstPath} (${(buf.length / 1024).toFixed(0)} KB)`)
  return pub.publicUrl
}

/** Rewrite every old-project storage URL found inside an HTML blob. */
async function rewriteHtmlAssets(html) {
  if (!html) return html
  const urls = [...new Set(
    (html.match(/https:\/\/xktbkmadjhynualgrbeb\.supabase\.co\/storage\/v1\/object\/public\/[^"'\s)<>\\]+/g) || [])
  )]
  let out = html
  for (const u of urls) {
    const nu = await copyAsset(u)
    if (nu !== u) out = out.split(u).join(nu)
  }
  return out
}

// ── helpers ──────────────────────────────────────────────────
const slugify = (s) => String(s || '')
  .toLowerCase().trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 100)

function readingTime(html) {
  const words = String(html || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 220))
}

function excerptFrom(html, fallback) {
  if (fallback && fallback.trim()) return fallback.trim()
  const text = String(html || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
  return text.slice(0, 200) + (text.length > 200 ? '…' : '')
}

async function main() {
  console.log(`\n── Blog subdomain → central CMS ${DRY ? '(DRY RUN)' : ''}\n`)

  // ── 1. category map ────────────────────────────────────────
  const { data: srcCats, error: catErr } = await src.from('blog_categories').select('*')
  if (catErr) throw new Error(`source categories: ${catErr.message}`)

  const { data: dstCats } = await dst.from('blog_categories').select('id, slug, name')
  const dstBySlug = new Map((dstCats || []).map((c) => [c.slug, c]))
  const dstByName = new Map((dstCats || []).map((c) => [c.name.toLowerCase(), c]))

  const catMap = new Map() // srcId -> dstId
  for (const c of srcCats || []) {
    let hit = dstBySlug.get(c.slug) || dstByName.get(String(c.name).toLowerCase())
    if (!hit && !DRY) {
      const { data: made, error } = await dst.from('blog_categories')
        .insert({ slug: c.slug, name: c.name, description: c.description, sort_order: 200 })
        .select('id, slug, name').single()
      if (error) throw new Error(`create category ${c.slug}: ${error.message}`)
      hit = made
      dstBySlug.set(hit.slug, hit)
      console.log(`   + category ${c.name}`)
    }
    if (hit) catMap.set(c.id, hit.id)
  }
  console.log(`✓ categories mapped: ${catMap.size}`)

  // ── 2. author ──────────────────────────────────────────────
  const { data: author } = await dst.from('blog_authors')
    .select('id').eq('slug', 'ghl-india-ventures').maybeSingle()
  const authorId = author?.id || null

  // ── 3. posts ───────────────────────────────────────────────
  const { data: posts, error: postErr } = await src.from('blog_posts').select('*')
  if (postErr) throw new Error(`source posts: ${postErr.message}`)
  console.log(`\n▸ ${posts.length} posts to migrate`)

  let created = 0, updated = 0
  for (const p of posts) {
    console.log(`\n  • ${p.slug}`)
    const content = await rewriteHtmlAssets(p.content)
    const cover = await copyAsset(p.cover_image)

    const row = {
      slug: p.slug,
      title: p.title,
      excerpt: excerptFrom(content, p.excerpt),
      content,
      content_format: 'html',
      cover_image: cover || null,
      og_image: cover || null,
      category_id: catMap.get(p.category_id) || null,
      category: (srcCats || []).find((c) => c.id === p.category_id)?.name || null,
      author_id: authorId,
      author: 'GHL India Ventures',
      status: p.status === 'published' ? 'published' : (p.status === 'archived' ? 'archived' : 'draft'),
      meta_title: p.meta_title || `${p.title} | GHL India Ventures`,
      meta_description: p.meta_description || excerptFrom(content, p.excerpt),
      meta_keywords: p.meta_keywords || null,
      tags: Array.isArray(p.tags) ? p.tags : [],
      read_time: p.reading_time || readingTime(content),
      views: p.views || 0,
      published_at: p.published_at,
      created_at: p.created_at,
      origin: 'legacy-subdomain',
    }

    if (DRY) { console.log(`   [dry] upsert ${row.status} · ${row.read_time} min · ${content.length} chars`); continue }

    const { data: existing } = await dst.from('blog_posts')
      .select('id').eq('slug', p.slug).maybeSingle()

    if (existing) {
      const { error } = await dst.from('blog_posts').update(row).eq('id', existing.id)
      if (error) throw new Error(`update ${p.slug}: ${error.message}`)
      updated++
      console.log('   ↻ updated')
    } else {
      const { error } = await dst.from('blog_posts').insert(row)
      if (error) throw new Error(`insert ${p.slug}: ${error.message}`)
      created++
      console.log('   + created')
    }
  }
  console.log(`\n✓ posts — ${created} created, ${updated} updated`)

  // ── 4. PDF reports ─────────────────────────────────────────
  const { data: reports, error: repErr } = await src.from('pdf_reports').select('*')
  if (repErr) throw new Error(`source reports: ${repErr.message}`)
  console.log(`\n▸ ${reports.length} PDF reports`)

  const reportMap = new Map() // srcId -> dstId
  for (const r of reports) {
    console.log(`\n  • ${r.slug}`)
    const pdfUrl = await copyAsset(r.pdf_url)
    const cover = await copyAsset(r.cover_image)
    const row = {
      slug: r.slug,
      title: String(r.title || '').trim(),
      description: r.description,
      cover_image: cover || null,
      pdf_url: pdfUrl,
      pdf_filename: r.pdf_filename,
      category_id: catMap.get(r.category_id) || null,
      status: r.status || 'draft',
      download_count: r.download_count || 0,
      created_at: r.created_at,
    }
    if (DRY) { console.log('   [dry] upsert report'); continue }

    const { data: existing } = await dst.from('blog_reports')
      .select('id').eq('slug', r.slug).maybeSingle()
    if (existing) {
      const { error } = await dst.from('blog_reports').update(row).eq('id', existing.id)
      if (error) throw new Error(`update report ${r.slug}: ${error.message}`)
      reportMap.set(r.id, existing.id)
      console.log('   ↻ updated')
    } else {
      const { data: made, error } = await dst.from('blog_reports').insert(row).select('id').single()
      if (error) throw new Error(`insert report ${r.slug}: ${error.message}`)
      reportMap.set(r.id, made.id)
      console.log('   + created')
    }
  }

  // ── 5. leads ───────────────────────────────────────────────
  const { data: leads, error: leadErr } = await src.from('leads').select('*')
  if (leadErr) {
    console.warn(`\n! leads not readable with the anon key (${leadErr.message}) — skipping; migrate them manually if needed.`)
  } else if (leads?.length) {
    console.log(`\n▸ ${leads.length} report leads`)
    for (const l of leads) {
      if (DRY) continue
      const { data: dupe } = await dst.from('blog_report_leads')
        .select('id').eq('email', l.email).eq('created_at', l.created_at).maybeSingle()
      if (dupe) continue
      const { error } = await dst.from('blog_report_leads').insert({
        name: l.name, email: l.email, phone: l.phone,
        report_id: reportMap.get(l.pdf_report_id) || null,
        source: l.source || 'pdf_download',
        created_at: l.created_at,
      })
      if (error) console.warn(`   ! lead ${l.email}: ${error.message}`)
    }
    console.log('✓ leads migrated')
  }

  // ── 6. legacy subdomain URLs → canonical paths ─────────────
  if (!DRY) {
    const redirects = []
    for (const p of posts) redirects.push({ from_path: `/blog/${p.slug}`, to_path: `/blog/${p.slug}`, reason: 'subdomain cutover' })
    // Only the non-/blog subdomain routes actually need a redirect.
    const extra = [
      { from_path: '/insights', to_path: '/blog', reason: 'subdomain cutover' },
      { from_path: '/reports', to_path: '/blog/reports', reason: 'subdomain cutover' },
    ]
    for (const r of extra) {
      const { error } = await dst.from('blog_redirects').upsert(r, { onConflict: 'from_path' })
      if (error) console.warn(`   ! redirect ${r.from_path}: ${error.message}`)
    }
    console.log('\n✓ subdomain route redirects registered')
  }

  console.log(`\n── done ${DRY ? '(nothing was written)' : ''}\n`)
}

main().catch((e) => { console.error('\n✖ migration failed:', e.message); process.exit(1) })
