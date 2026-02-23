/* ─────────────────────────────────────────────────────────────
   Blog Service — CRUD for blog_posts table with mock fallback

   When Supabase is not configured, blog data comes from
   lib/constants.ts (BLOG_POSTS) which the blog pages already use.
   This service adds Supabase-powered CMS capability on top.

   Note: Uses `sb` (supabase as any) for mutation queries to
   avoid strict type inference issues with the Database generic.
   ───────────────────────────────────────────────────────────── */

import { supabase, isSupabaseConfigured } from './client'

// Untyped reference for mutations (avoids `never` inference on .insert/.update)
const sb = supabase as any

export interface BlogPost {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  category: string
  tags: string[]
  cover_image: string | null
  published: boolean
  featured: boolean
  read_time: number
  meta_title: string | null
  meta_description: string | null
  created_at: string
  updated_at: string
}

// ── Read ────────────────────────────────────────────────────

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await sb.from('blog_posts').select('*').order('created_at', { ascending: false })
  if (error || !data) { console.warn('[blog] Error fetching posts:', error?.message); return [] }
  return data as BlogPost[]
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await sb.from('blog_posts').select('*').eq('published', true).order('created_at', { ascending: false })
  if (error || !data) return []
  return data as BlogPost[]
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await sb.from('blog_posts').select('*').eq('slug', slug).single()
  if (error || !data) return null
  return data as BlogPost
}

export async function getFeaturedPosts(limit = 3): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await sb.from('blog_posts').select('*').eq('published', true).eq('featured', true).order('created_at', { ascending: false }).limit(limit)
  if (error || !data) return []
  return data as BlogPost[]
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await sb.from('blog_posts').select('*').eq('published', true).eq('category', category).order('created_at', { ascending: false })
  if (error || !data) return []
  return data as BlogPost[]
}

// ── Write (Admin CMS) ──────────────────────────────────────

export async function createBlogPost(
  post: Omit<BlogPost, 'id' | 'created_at' | 'updated_at'>
): Promise<BlogPost | null> {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await sb.from('blog_posts').insert(post).select().single()
  if (error) { console.warn('[blog] Create error:', error.message); return null }
  return data as BlogPost
}

export async function updateBlogPost(
  id: string,
  updates: Partial<Omit<BlogPost, 'id' | 'created_at'>>
): Promise<BlogPost | null> {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await sb.from('blog_posts').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) { console.warn('[blog] Update error:', error.message); return null }
  return data as BlogPost
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const { error } = await sb.from('blog_posts').delete().eq('id', id)
  if (error) { console.warn('[blog] Delete error:', error.message); return false }
  return true
}

export async function togglePublish(id: string, published: boolean): Promise<boolean> {
  if (!isSupabaseConfigured()) return false
  const { error } = await sb.from('blog_posts').update({ published, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) { console.warn('[blog] Toggle publish error:', error.message); return false }
  return true
}

// ── Slug helper ─────────────────────────────────────────────
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}
