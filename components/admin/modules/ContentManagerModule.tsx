'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, BookOpen, HelpCircle, Ticket, Plus, Edit, Trash2,
  Save, Send, Upload, Loader2, Radio,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminKPICard from '../shared/AdminKPICard'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminEmptyState from '../shared/AdminEmptyState'
import FIQBroadcastModal from './FIQBroadcastModal'
import BroadcastTab from './BroadcastTab'
import { resolveFIQCoverImage } from '@/lib/fiqFallbackImages'
import { supabase as _supabase, isSupabaseConfigured } from '@/lib/supabase/client'
const supabase = _supabase as any

// ── Types ───────────────────────────────────────────────────────
interface BlogPost {
  id: string
  title: string
  content: string
  excerpt: string
  category: string
  cover_image: string
  author: string
  tags: string[]
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
}

interface FinancialIQPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  category: string
  cover_image: string
  author: string
  tags: string[]
  is_published: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  scheduled_for?: string | null
  email_sent_at?: string | null
  meta_title?: string | null
  meta_description?: string | null
  read_time?: number | null
}

interface FAQ {
  id: string
  question: string
  answer: string
  category: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface SupportTicket {
  id: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'waiting' | 'escalated' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  user_id: string
  created_at: string
  updated_at: string
  profiles?: { full_name: string; email: string } | null
}

// ── Sub-tabs ────────────────────────────────────────────────────
// Tab IDs MUST match sidebar navigation sub-item IDs from adminConstants.ts:
// 'content' → blog, 'content/financial-iq' → financial-iq, 'content/faq' → faq, 'content/tickets' → tickets
const CONTENT_TABS = [
  { id: 'blog', label: 'Blog Posts', icon: FileText },
  { id: 'financial-iq', label: 'Financial IQ', icon: BookOpen },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'tickets', label: 'Support Tickets', icon: Ticket },
  { id: 'broadcast', label: 'Broadcast', icon: Radio },
] as const

type ContentTab = typeof CONTENT_TABS[number]['id']

const BLOG_CATEGORIES = ['Market Updates', 'Investment Tips', 'Company News', 'Economy', 'Real Estate', 'Mutual Funds', 'Insurance']
const FIQ_CATEGORIES = ['Basics', 'Advanced', 'Strategy', 'Education', 'Tax Planning', 'Retirement', 'Insurance', 'Real Estate', 'Mutual Funds', 'Startups']
const FAQ_CATEGORIES = ['General', 'Account', 'Investments', 'KYC', 'Payments', 'Returns', 'Support']
// Match the DB CHECK constraint on public.tickets.status exactly.
const TICKET_STATUSES = ['open', 'in_progress', 'waiting', 'escalated', 'resolved', 'closed'] as const

// ── Props ───────────────────────────────────────────────────────
interface ContentManagerModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

// ── Component ───────────────────────────────────────────────────
export default function ContentManagerModule({ subTab, navigate, showToast }: ContentManagerModuleProps) {
  const activeTab = (CONTENT_TABS.some(t => t.id === subTab) ? subTab : 'blog') as ContentTab

  // ── State ───────────────────────────────────────────────────
  const [blogs, setBlogs] = useState<BlogPost[]>([])
  const [fiqPosts, setFiqPosts] = useState<FinancialIQPost[]>([])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(false)

  // Editor state
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<BlogPost | FinancialIQPost | FAQ | SupportTicket | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  // Bug #26: ticket detail view
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null)

  // Blog / FIQ form fields
  const [formTitle, setFormTitle] = useState('')
  const [formSlug, setFormSlug] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formExcerpt, setFormExcerpt] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formCoverImage, setFormCoverImage] = useState('')
  const [formAuthor, setFormAuthor] = useState('')
  const [formTags, setFormTags] = useState('')
  const [formPublished, setFormPublished] = useState(false)

  // FAQ form fields
  const [formQuestion, setFormQuestion] = useState('')
  const [formAnswer, setFormAnswer] = useState('')
  const [formSortOrder, setFormSortOrder] = useState(0)
  const [formActive, setFormActive] = useState(true)

  // Financial IQ extras: SEO + scheduled publish + manual broadcast + cover image upload
  const [formMetaTitle, setFormMetaTitle] = useState('')
  const [formMetaDescription, setFormMetaDescription] = useState('')
  const [formScheduledFor, setFormScheduledFor] = useState('')
  const [formReadTime, setFormReadTime] = useState<number | ''>('')
  const [broadcastTarget, setBroadcastTarget] = useState<FinancialIQPost | null>(null)
  const [coverUploading, setCoverUploading] = useState(false)

  // Upload a cover image to the public `ghl-media` Supabase Storage bucket
  // and wire the resulting URL into formCoverImage. Called from the file
  // input on the editor. Accepts common image types up to 5 MB.
  const uploadCoverImage = async (file: File) => {
    if (!isSupabaseConfigured()) {
      showToast('Supabase not configured', 'error')
      return
    }
    if (!file.type.startsWith('image/')) {
      showToast('File must be an image (jpg, png, webp, gif)', 'error')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5 MB', 'error')
      return
    }
    setCoverUploading(true)
    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg'
      const filename = `fiq-covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
      const { error: upErr } = await supabase.storage.from('ghl-media').upload(filename, file, {
        cacheControl: '3600', upsert: false, contentType: file.type,
      })
      if (upErr) { showToast(`Upload failed: ${upErr.message}`, 'error'); setCoverUploading(false); return }
      const { data: pub } = supabase.storage.from('ghl-media').getPublicUrl(filename)
      if (pub?.publicUrl) {
        setFormCoverImage(pub.publicUrl)
        showToast('Cover image uploaded', 'success')
      } else {
        showToast('Upload succeeded but public URL was empty', 'warning')
      }
    } catch (e: any) {
      showToast(`Upload error: ${e?.message || 'unknown'}`, 'error')
    }
    setCoverUploading(false)
  }

  // ── Data Fetching — single bulk loader ─────────────────────
  const loadAllContent = useCallback(async () => {
    if (!isSupabaseConfigured()) { setLoading(false); return }
    setLoading(true)
    try {
      const [blogRes, fiqRes, faqRes, ticketRes] = await Promise.all([
        supabase.from('blog_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('financial_iq_posts').select('*').order('created_at', { ascending: false }),
        supabase.from('faqs').select('*').order('sort_order', { ascending: true }),
        supabase.from('tickets').select('*').order('created_at', { ascending: false }),
      ])
      if (blogRes.data) {
        const mapped = blogRes.data.map((b: any) => ({ ...b, is_published: b.published ?? b.is_published ?? false }))
        setBlogs(mapped as BlogPost[])
      }
      if (fiqRes.data) setFiqPosts(fiqRes.data as FinancialIQPost[])
      if (faqRes.data) setFaqs(faqRes.data as FAQ[])
      if (ticketRes.data) setTickets(ticketRes.data as SupportTicket[])
    } catch (e) {
      console.error('Content load error:', e)
    }
    setLoading(false)
  }, [])

  // Convenience single-table reloaders (for after CRUD ops)
  const fetchBlogs = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
    if (data) {
      const mapped = data.map((b: any) => ({ ...b, is_published: b.published ?? b.is_published ?? false }))
      setBlogs(mapped as BlogPost[])
    }
  }, [])

  const fetchFIQ = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    const { data } = await supabase.from('financial_iq_posts').select('*').order('created_at', { ascending: false })
    if (data) setFiqPosts(data as FinancialIQPost[])
  }, [])

  const fetchFAQs = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    const { data } = await supabase.from('faqs').select('*').order('sort_order', { ascending: true })
    if (data) setFaqs(data as FAQ[])
  }, [])

  const fetchTickets = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false })
    if (data) setTickets(data as SupportTicket[])
  }, [])

  // Load everything on mount
  useEffect(() => { loadAllContent() }, [loadAllContent])

  // ── Editor Helpers ─────────────────────────────────────────
  const resetForm = () => {
    setFormTitle(''); setFormSlug(''); setFormContent(''); setFormExcerpt('')
    setFormCategory(''); setFormCoverImage(''); setFormAuthor(''); setFormTags('')
    setFormPublished(false); setFormQuestion(''); setFormAnswer('')
    setFormSortOrder(0); setFormActive(true); setEditingItem(null)
    setFormMetaTitle(''); setFormMetaDescription(''); setFormScheduledFor(''); setFormReadTime('')
  }

  const openBlogEditor = (item?: BlogPost) => {
    resetForm()
    if (item) {
      setEditingItem(item)
      setFormTitle(item.title); setFormContent(item.content); setFormExcerpt(item.excerpt)
      setFormCategory(item.category); setFormCoverImage(item.cover_image || '')
      setFormAuthor(item.author); setFormTags((item.tags || []).join(', '))
      setFormPublished(item.is_published)
    }
    setEditorOpen(true)
  }

  const openFIQEditor = (item?: FinancialIQPost) => {
    resetForm()
    if (item) {
      setEditingItem(item)
      setFormTitle(item.title); setFormSlug(item.slug); setFormContent(item.content)
      setFormExcerpt(item.excerpt); setFormCategory(item.category)
      setFormCoverImage(item.cover_image || ''); setFormAuthor(item.author)
      setFormTags((item.tags || []).join(', ')); setFormPublished(item.is_published)
      setFormMetaTitle(item.meta_title || '')
      setFormMetaDescription(item.meta_description || '')
      setFormScheduledFor(item.scheduled_for ? toDatetimeLocal(item.scheduled_for) : '')
      setFormReadTime(item.read_time ?? '')
    }
    setEditorOpen(true)
  }

  // Convert an ISO timestamp (with timezone) to the value format expected
  // by <input type="datetime-local"> — "YYYY-MM-DDTHH:mm" in local time.
  function toDatetimeLocal(iso: string) {
    const d = new Date(iso)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const openFAQEditor = (item?: FAQ) => {
    resetForm()
    if (item) {
      setEditingItem(item)
      setFormQuestion(item.question); setFormAnswer(item.answer)
      setFormCategory(item.category); setFormSortOrder(item.sort_order)
      setFormActive(item.is_active)
    }
    setEditorOpen(true)
  }

  // ── CRUD: Blog ─────────────────────────────────────────────
  const saveBlog = async () => {
    if (!isSupabaseConfigured()) return
    const slug = formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const payload = {
      title: formTitle,
      slug,
      content: formContent,
      excerpt: formExcerpt,
      category: formCategory,
      cover_image: formCoverImage || `https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80`,
      author: formAuthor || 'GHL Research Team',
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      published: formPublished,
      read_time: Math.max(3, Math.ceil((formContent || '').split(/\s+/).length / 200)),
      published_at: formPublished ? new Date().toISOString() : null,
    }
    if (editingItem) {
      const { error } = await supabase.from('blog_posts').update(payload).eq('id', editingItem.id)
      if (error) { showToast(`Update failed: ${error.message}`, 'error'); return }
      showToast('Blog post updated', 'success')
    } else {
      const { error } = await supabase.from('blog_posts').insert(payload)
      if (error) { showToast(`Create failed: ${error.message}`, 'error'); return }
      showToast('Blog post created', 'success')
    }
    setEditorOpen(false); resetForm(); fetchBlogs()
  }

  const deleteBlog = async (id: string) => {
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.from('blog_posts').delete().eq('id', id)
    if (error) { showToast(`Delete failed: ${error.message}`, 'error'); return }
    showToast('Blog post deleted', 'success')
    setDeleteConfirmId(null); fetchBlogs()
  }

  // ── CRUD: Financial IQ ────────────────────────────────────
  const saveFIQ = async () => {
    if (!isSupabaseConfigured()) return
    const slug = formSlug || formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    const prev = editingItem as FinancialIQPost | null
    // Preserve an existing published_at when the admin is just editing a
    // published article (don't reset it each save).
    const wasPublished = !!prev?.is_published
    const publishedAt = formPublished
      ? (wasPublished && prev?.published_at ? prev.published_at : new Date().toISOString())
      : null
    // When the admin leaves Cover Image blank, auto-fill a category-
    // appropriate royalty-free Unsplash image so every article has
    // visual presence on the hub + detail pages without extra work.
    const resolvedCover = formCoverImage.trim()
      ? formCoverImage.trim()
      : resolveFIQCoverImage(null, formCategory)
    const payload = {
      title: formTitle,
      slug,
      content: formContent,
      excerpt: formExcerpt,
      category: formCategory,
      cover_image: resolvedCover,
      author: formAuthor,
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      is_published: formPublished,
      published_at: publishedAt,
      scheduled_for: formScheduledFor ? new Date(formScheduledFor).toISOString() : null,
      meta_title: formMetaTitle || null,
      meta_description: formMetaDescription || null,
      read_time: typeof formReadTime === 'number' && formReadTime > 0 ? formReadTime : null,
    }
    if (editingItem) {
      const { error } = await supabase.from('financial_iq_posts').update(payload).eq('id', editingItem.id)
      if (error) { showToast(`Update failed: ${error.message}`, 'error'); return }
      showToast('Financial IQ post updated', 'success')
    } else {
      const { error } = await supabase.from('financial_iq_posts').insert(payload)
      if (error) { showToast(`Create failed: ${error.message}`, 'error'); return }
      showToast('Financial IQ post created', 'success')
    }
    setEditorOpen(false); resetForm(); fetchFIQ()
  }

  const deleteFIQ = async (id: string) => {
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.from('financial_iq_posts').delete().eq('id', id)
    if (error) { showToast(`Delete failed: ${error.message}`, 'error'); return }
    showToast('Financial IQ post deleted', 'success')
    setDeleteConfirmId(null); fetchFIQ()
  }

  // ── CRUD: FAQ ─────────────────────────────────────────────
  const saveFAQ = async () => {
    if (!isSupabaseConfigured()) return
    const payload = {
      question: formQuestion,
      answer: formAnswer,
      category: formCategory,
      sort_order: formSortOrder,
      is_active: formActive,
    }
    if (editingItem) {
      const { error } = await supabase.from('faqs').update(payload).eq('id', editingItem.id)
      if (error) { showToast(`Update failed: ${error.message}`, 'error'); return }
      showToast('FAQ updated', 'success')
    } else {
      const { error } = await supabase.from('faqs').insert(payload)
      if (error) { showToast(`Create failed: ${error.message}`, 'error'); return }
      showToast('FAQ created', 'success')
    }
    setEditorOpen(false); resetForm(); fetchFAQs()
  }

  const deleteFAQ = async (id: string) => {
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.from('faqs').delete().eq('id', id)
    if (error) { showToast(`Delete failed: ${error.message}`, 'error'); return }
    showToast('FAQ deleted', 'success')
    setDeleteConfirmId(null); fetchFAQs()
  }

  // ── Ticket Status Update ──────────────────────────────────
  // Bug #23: Admin must provide an answer/response before updating ticket status.
  // The response is appended to tickets.metadata.admin_responses[] and the
  // status update only proceeds if a non-empty response is supplied.
  const updateTicketStatus = async (id: string, status: string) => {
    if (!isSupabaseConfigured()) return
    const ticket = tickets.find(t => t.id === id)
    if (!ticket) { showToast('Ticket not found', 'error'); return }
    const response = window.prompt(
      `Please enter your response to the investor before updating ticket status to "${status}":`,
      ''
    )
    if (response === null) return // user cancelled
    const trimmed = response.trim()
    if (!trimmed) { showToast('Response is required before updating status', 'warning'); return }
    const prevMeta = ((ticket as any).metadata && typeof (ticket as any).metadata === 'object') ? (ticket as any).metadata : {}
    const prevResponses = Array.isArray(prevMeta.admin_responses) ? prevMeta.admin_responses : []
    const nextMeta = {
      ...prevMeta,
      admin_responses: [...prevResponses, { response: trimmed, status, at: new Date().toISOString() }],
    }
    const { error } = await supabase.from('tickets').update({ status, metadata: nextMeta, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { showToast(`Status update failed: ${error.message}`, 'error'); return }
    showToast(`Ticket status updated to ${status} — response saved`, 'success')
    fetchTickets()
  }

  const deleteTicket = async (id: string) => {
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.from('tickets').delete().eq('id', id)
    if (error) { showToast(`Delete failed: ${error.message}`, 'error'); return }
    showToast('Ticket deleted', 'success')
    setDeleteConfirmId(null); fetchTickets()
  }

  // ── KPI Counts ─────────────────────────────────────────────
  const publishedBlogs = blogs.filter(b => b.is_published).length
  const publishedFIQ = fiqPosts.filter(f => f.is_published).length
  const activeFAQs = faqs.filter(f => f.is_active).length
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length

  // ── Table Columns ──────────────────────────────────────────
  const blogColumns: Column<BlogPost>[] = [
    { key: 'title', label: 'Title', sortable: true, render: (r) => (
      <div className="max-w-[260px]">
        <p className="text-sm text-white font-medium truncate">{r.title}</p>
        <p className="text-[11px] text-gray-500 truncate">{r.excerpt}</p>
      </div>
    )},
    { key: 'category', label: 'Category', sortable: true, render: (r) => (
      <AdminBadge label={r.category || 'Uncategorized'} variant="info" />
    )},
    { key: 'author', label: 'Author', sortable: true },
    { key: 'is_published', label: 'Status', sortable: true, render: (r) => (
      <AdminBadge label={r.is_published ? 'Published' : 'Draft'} variant={r.is_published ? 'success' : 'neutral'} dot />
    )},
    { key: 'created_at', label: 'Created', sortable: true, render: (r) => (
      <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
    )},
    { key: 'actions', label: '', width: '120px', render: (r) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); openBlogEditor(r) }}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors">
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(r.id) }}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )},
  ]

  const fiqColumns: Column<FinancialIQPost>[] = [
    { key: 'title', label: 'Title', sortable: true, render: (r) => (
      <div className="max-w-[260px]">
        <p className="text-sm text-white font-medium truncate">{r.title}</p>
        <p className="text-[11px] text-gray-500 truncate">{r.slug}</p>
      </div>
    )},
    { key: 'category', label: 'Category', sortable: true, render: (r) => (
      <AdminBadge label={r.category || 'Uncategorized'} variant="purple" />
    )},
    { key: 'author', label: 'Author', sortable: true },
    { key: 'is_published', label: 'Status', sortable: true, render: (r) => {
      if (r.is_published) return <AdminBadge label="Published" variant="success" dot />
      if (r.scheduled_for) {
        const future = new Date(r.scheduled_for).getTime() > Date.now()
        return <AdminBadge label={future ? 'Scheduled' : 'Due'} variant={future ? 'info' : 'warning'} dot />
      }
      return <AdminBadge label="Draft" variant="neutral" dot />
    }},
    { key: 'scheduled_for', label: 'Scheduled', sortable: true, render: (r) => (
      <span className="text-xs text-gray-400">{r.scheduled_for ? new Date(r.scheduled_for).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}</span>
    )},
    { key: 'email_sent_at', label: 'Email', sortable: true, render: (r) => (
      r.email_sent_at
        ? <span title={new Date(r.email_sent_at).toLocaleString('en-IN')} className="text-[11px] text-green-400">Sent</span>
        : <span className="text-[11px] text-gray-500">—</span>
    )},
    { key: 'actions', label: '', width: '160px', render: (r) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); setBroadcastTarget(r) }}
          title="Send to clients"
          className="p-1.5 rounded-lg hover:bg-brand-red/10 text-gray-500 hover:text-brand-red transition-colors">
          <Send className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); openFIQEditor(r) }}
          title="Edit"
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors">
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(r.id) }}
          title="Delete"
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )},
  ]

  const faqColumns: Column<FAQ>[] = [
    { key: 'question', label: 'Question', sortable: true, render: (r) => (
      <p className="text-sm text-white max-w-[320px] truncate">{r.question}</p>
    )},
    { key: 'category', label: 'Category', sortable: true, render: (r) => (
      <AdminBadge label={r.category || 'General'} variant="info" />
    )},
    { key: 'sort_order', label: 'Order', sortable: true, render: (r) => (
      <span className="text-xs text-gray-400 font-mono">{r.sort_order}</span>
    )},
    { key: 'is_active', label: 'Status', sortable: true, render: (r) => (
      <AdminBadge label={r.is_active ? 'Active' : 'Inactive'} variant={r.is_active ? 'success' : 'neutral'} dot />
    )},
    { key: 'actions', label: '', width: '120px', render: (r) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); openFAQEditor(r) }}
          className="p-1.5 rounded-lg hover:bg-white/[0.06] text-gray-500 hover:text-white transition-colors">
          <Edit className="w-3.5 h-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(r.id) }}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )},
  ]

  const ticketColumns: Column<SupportTicket>[] = [
    { key: 'id', label: 'Ticket ID', width: '100px', render: (r) => (
      <span className="text-xs text-gray-400 font-mono">#{r.id.slice(0, 8)}</span>
    )},
    { key: 'subject', label: 'Subject', sortable: true, render: (r) => (
      <p className="text-sm text-white max-w-[220px] truncate">{r.subject}</p>
    )},
    { key: 'user', label: 'Investor', sortable: true, render: (r) => (
      <div>
        <p className="text-sm text-white">{(r as any).client_name || r.profiles?.full_name || 'Unknown'}</p>
        <p className="text-[11px] text-gray-500">{(r as any).ticket_number || r.profiles?.email || ''}</p>
      </div>
    )},
    { key: 'status', label: 'Status', sortable: true, render: (r) => {
      const v = r.status === 'resolved' || r.status === 'closed' ? 'success'
        : r.status === 'in_progress' ? 'warning'
        : r.status === 'waiting' ? 'info'
        : r.status === 'escalated' ? 'error' : 'error'
      return <AdminBadge label={r.status} variant={v} dot />
    }},
    { key: 'priority', label: 'Priority', sortable: true, render: (r) => {
      const v = r.priority === 'critical' ? 'error' : r.priority === 'high' ? 'warning'
        : r.priority === 'medium' ? 'info' : 'neutral'
      return <AdminBadge label={r.priority} variant={v} />
    }},
    { key: 'created_at', label: 'Created', sortable: true, render: (r) => (
      <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
    )},
    { key: 'updated_at', label: 'Updated', sortable: true, render: (r) => (
      <span className="text-xs text-gray-400">{new Date(r.updated_at).toLocaleDateString()}</span>
    )},
    { key: 'actions', label: '', width: '220px', render: (r) => (
      <div className="flex items-center gap-1">
        {/* Bug #26: Admin "View" button opens full ticket details + response history */}
        <button onClick={(e) => { e.stopPropagation(); setViewingTicket(r) }}
          title="View ticket"
          className="p-1.5 rounded-lg hover:bg-blue-500/10 text-gray-500 hover:text-blue-400 transition-colors">
          <FileText className="w-3.5 h-3.5" />
        </button>
        <select
          value={r.status}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => updateTicketStatus(r.id, e.target.value)}
          className="text-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1 text-gray-300 focus:outline-none focus:border-brand-red/50"
        >
          {TICKET_STATUSES.map(s => (
            <option key={s} value={s} className="bg-brand-black">{s}</option>
          ))}
        </select>
        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(r.id) }}
          className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 transition-colors">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )},
  ]

  // ── Shared form input style ────────────────────────────────
  const inputClass = 'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-red/50 transition-colors'
  const labelClass = 'block text-xs text-gray-400 font-medium mb-1.5'

  // ── Blog/FIQ Editor Form ───────────────────────────────────
  const renderArticleEditor = (type: 'blog' | 'financial-iq') => {
    const categories = type === 'blog' ? BLOG_CATEGORIES : FIQ_CATEGORIES
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input value={formTitle} onChange={e => setFormTitle(e.target.value)}
            placeholder="Enter post title..." className={inputClass} />
        </div>
        {type === 'financial-iq' && (
          <div>
            <label className={labelClass}>Slug</label>
            <input value={formSlug} onChange={e => setFormSlug(e.target.value)}
              placeholder="auto-generated-from-title" className={inputClass} />
          </div>
        )}
        <div>
          <label className={labelClass}>Content</label>
          <textarea value={formContent} onChange={e => setFormContent(e.target.value)}
            rows={12} placeholder="Write your content here..."
            className={`${inputClass} resize-y min-h-[200px]`} />
        </div>
        <div>
          <label className={labelClass}>Excerpt</label>
          <textarea value={formExcerpt} onChange={e => setFormExcerpt(e.target.value)}
            rows={3} placeholder="Brief summary for preview..."
            className={`${inputClass} resize-y`} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Category</label>
            <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
              className={inputClass}>
              <option value="" className="bg-brand-black">Select category</option>
              {categories.map(c => (
                <option key={c} value={c} className="bg-brand-black">{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Author</label>
            <input value={formAuthor} onChange={e => setFormAuthor(e.target.value)}
              placeholder="Author name" className={inputClass} />
          </div>
        </div>
        <div>
          <label className={labelClass}>Cover Image</label>
          <div className="flex items-start gap-3">
            {/* Preview thumbnail — also shown when an image is pasted as URL */}
            {formCoverImage && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={formCoverImage}
                alt="Cover preview"
                className="w-20 h-20 rounded-lg object-cover border border-white/[0.08] shrink-0"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
              />
            )}
            <div className="flex-1 space-y-2">
              <input
                value={formCoverImage}
                onChange={e => setFormCoverImage(e.target.value)}
                placeholder="Paste URL or click Upload →"
                className={inputClass}
              />
              {type === 'financial-iq' && (
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-xs text-gray-300 hover:bg-white/[0.08] cursor-pointer transition-colors">
                    {coverUploading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    {coverUploading ? 'Uploading…' : 'Upload image'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      disabled={coverUploading}
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) uploadCoverImage(f)
                        e.currentTarget.value = ''
                      }}
                    />
                  </label>
                  {formCoverImage && (
                    <button
                      type="button"
                      onClick={() => setFormCoverImage('')}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          {type === 'financial-iq' && (
            <p className="text-[10px] text-gray-500 mt-1.5">
              Upload a JPG/PNG/WEBP (≤5 MB) or paste a URL from{' '}
              <a href="https://unsplash.com/s/photos/finance" target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline">Unsplash</a>
              {' / '}
              <a href="https://www.pexels.com/search/finance/" target="_blank" rel="noopener noreferrer" className="text-brand-red hover:underline">Pexels</a>.
              Leave blank and a topic-matched fallback is auto-selected from the article&apos;s category.
            </p>
          )}
        </div>
        <div>
          <label className={labelClass}>Tags (comma-separated)</label>
          <input value={formTags} onChange={e => setFormTags(e.target.value)}
            placeholder="investing, finance, tips" className={inputClass} />
        </div>

        {type === 'financial-iq' && (
          <>
            <div className="pt-3 mt-3 border-t border-white/[0.06]">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-2">SEO &amp; scheduling</p>
            </div>
            <div>
              <label className={labelClass}>Meta title <span className="text-gray-600">(optional, for search engines)</span></label>
              <input value={formMetaTitle} onChange={e => setFormMetaTitle(e.target.value)}
                placeholder={formTitle || 'Defaults to article title'} maxLength={70} className={inputClass} />
              <p className="text-[10px] text-gray-500 mt-1">{formMetaTitle.length}/70 characters</p>
            </div>
            <div>
              <label className={labelClass}>Meta description <span className="text-gray-600">(optional, 150-160 chars ideal)</span></label>
              <textarea value={formMetaDescription} onChange={e => setFormMetaDescription(e.target.value)}
                rows={2} placeholder={formExcerpt || 'Defaults to excerpt'} maxLength={180}
                className={`${inputClass} resize-y`} />
              <p className="text-[10px] text-gray-500 mt-1">{formMetaDescription.length}/180 characters</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Schedule for <span className="text-gray-600">(auto-publish)</span></label>
                <input type="datetime-local" value={formScheduledFor} onChange={e => setFormScheduledFor(e.target.value)}
                  className={inputClass} />
                <p className="text-[10px] text-gray-500 mt-1">Leave empty to publish manually. Weekly cron runs Mondays 10:00 IST.</p>
              </div>
              <div>
                <label className={labelClass}>Read time (minutes)</label>
                <input type="number" min={1} max={60} value={formReadTime}
                  onChange={e => setFormReadTime(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Auto-calculated if left blank" className={inputClass} />
              </div>
            </div>
          </>
        )}

        <div className="flex items-center gap-3 pt-1">
          <button onClick={() => setFormPublished(!formPublished)}
            className={`relative w-10 h-5 rounded-full transition-colors ${formPublished ? 'bg-brand-red' : 'bg-white/10'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${formPublished ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-sm text-gray-300">{formPublished ? 'Published' : 'Draft'}</span>
          {type === 'financial-iq' && formScheduledFor && !formPublished && (
            <span className="text-xs text-amber-400 ml-3">⏰ will auto-publish on schedule</span>
          )}
        </div>
      </div>
    )
  }

  // ── FAQ Editor Form ────────────────────────────────────────
  const renderFAQEditor = () => (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Question</label>
        <input value={formQuestion} onChange={e => setFormQuestion(e.target.value)}
          placeholder="Enter the question..." className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Answer</label>
        <textarea value={formAnswer} onChange={e => setFormAnswer(e.target.value)}
          rows={6} placeholder="Write the answer..."
          className={`${inputClass} resize-y min-h-[120px]`} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Category</label>
          <select value={formCategory} onChange={e => setFormCategory(e.target.value)}
            className={inputClass}>
            <option value="" className="bg-brand-black">Select category</option>
            {FAQ_CATEGORIES.map(c => (
              <option key={c} value={c} className="bg-brand-black">{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Sort Order</label>
          <input type="number" value={formSortOrder} onChange={e => setFormSortOrder(Number(e.target.value))}
            className={inputClass} min={0} />
        </div>
      </div>
      <div className="flex items-center gap-3 pt-1">
        <button onClick={() => setFormActive(!formActive)}
          className={`relative w-10 h-5 rounded-full transition-colors ${formActive ? 'bg-brand-red' : 'bg-white/10'}`}>
          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${formActive ? 'translate-x-5' : ''}`} />
        </button>
        <span className="text-sm text-gray-300">{formActive ? 'Active' : 'Inactive'}</span>
      </div>
    </div>
  )

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Sub-tab Navigation */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {CONTENT_TABS.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.id === 'blog' ? 'content' : `content/${tab.id}`)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-brand-red/20 text-brand-red border border-brand-red/30'
                  : 'text-gray-500 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Broadcast Tab renders its own layout (KPIs + sub-views) so it bypasses
          the shared content-area KPI cards + AdminGlass wrapper below. */}
      {activeTab === 'broadcast' ? (
        <BroadcastTab showToast={showToast} />
      ) : (
      <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminKPICard title="Blog Posts" value={blogs.length} subtitle={`${publishedBlogs} published`} icon={FileText} color="#3B82F6" delay={0} />
        <AdminKPICard title="Financial IQ" value={fiqPosts.length} subtitle={`${publishedFIQ} published`} icon={BookOpen} color="#8B5CF6" delay={50} />
        <AdminKPICard title="FAQs" value={faqs.length} subtitle={`${activeFAQs} active`} icon={HelpCircle} color="#10B981" delay={100} />
        <AdminKPICard title="Open Tickets" value={openTickets} subtitle={`${tickets.length} total`} icon={Ticket} color="#D0021B" delay={150} />
      </div>

      {/* Content Area */}
      <AdminGlass>
        {/* Blog Tab */}
        {activeTab === 'blog' && (
          <>
            {blogs.length === 0 && !loading ? (
              <AdminEmptyState icon={FileText} title="No blog posts yet" description="Create your first blog post to share with investors."
                action={{ label: 'Create Blog Post', onClick: () => openBlogEditor() }} />
            ) : (
              <AdminDataTable
                columns={blogColumns}
                data={blogs}
                searchable
                searchPlaceholder="Search blog posts..."
                searchKeys={['title', 'category', 'author']}
                title="Blog Posts"
                actions={
                  <button onClick={() => openBlogEditor()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-red/20 text-brand-red border border-brand-red/30 hover:bg-brand-red/30 text-sm font-medium transition-colors">
                    <Plus className="w-3.5 h-3.5" /> New Post
                  </button>
                }
              />
            )}
          </>
        )}

        {/* Financial IQ Tab */}
        {activeTab === 'financial-iq' && (
          <>
            {fiqPosts.length === 0 && !loading ? (
              <AdminEmptyState icon={BookOpen} title="No Financial IQ posts yet" description="Create educational content for your investors."
                action={{ label: 'Create FIQ Post', onClick: () => openFIQEditor() }} />
            ) : (
              <AdminDataTable
                columns={fiqColumns}
                data={fiqPosts}
                searchable
                searchPlaceholder="Search Financial IQ posts..."
                searchKeys={['title', 'category', 'author', 'slug']}
                title="Financial IQ Posts"
                actions={
                  <button onClick={() => openFIQEditor()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-red/20 text-brand-red border border-brand-red/30 hover:bg-brand-red/30 text-sm font-medium transition-colors">
                    <Plus className="w-3.5 h-3.5" /> New Post
                  </button>
                }
              />
            )}
          </>
        )}

        {/* FAQ Tab */}
        {activeTab === 'faq' && (
          <>
            {faqs.length === 0 && !loading ? (
              <AdminEmptyState icon={HelpCircle} title="No FAQs yet" description="Add frequently asked questions for your investors."
                action={{ label: 'Create FAQ', onClick: () => openFAQEditor() }} />
            ) : (
              <AdminDataTable
                columns={faqColumns}
                data={faqs}
                searchable
                searchPlaceholder="Search FAQs..."
                searchKeys={['question', 'category']}
                title="Frequently Asked Questions"
                actions={
                  <button onClick={() => openFAQEditor()}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand-red/20 text-brand-red border border-brand-red/30 hover:bg-brand-red/30 text-sm font-medium transition-colors">
                    <Plus className="w-3.5 h-3.5" /> New FAQ
                  </button>
                }
              />
            )}
          </>
        )}

        {/* Support Tickets Tab */}
        {activeTab === 'tickets' && (
          <>
            {tickets.length === 0 && !loading ? (
              <AdminEmptyState icon={Ticket} title="No support tickets" description="Tickets submitted by investors will appear here." />
            ) : (
              <AdminDataTable
                columns={ticketColumns}
                data={tickets}
                searchable
                searchPlaceholder="Search tickets..."
                searchKeys={['subject', 'status', 'priority']}
                title="Support Tickets"
              />
            )}
          </>
        )}
      </AdminGlass>
      </>
      )}

      {/* Editor Modal: Blog */}
      {activeTab === 'blog' && (
        <AdminModal
          isOpen={editorOpen}
          onClose={() => { setEditorOpen(false); resetForm() }}
          title={editingItem ? 'Edit Blog Post' : 'New Blog Post'}
          subtitle="Changes will reflect on the investor dashboard"
          maxWidth="max-w-3xl"
          footer={
            <>
              <ModalButton variant="secondary" onClick={() => { setEditorOpen(false); resetForm() }}>Cancel</ModalButton>
              <ModalButton variant="primary" onClick={saveBlog} disabled={!formTitle.trim() || !formContent.trim()}>
                <span className="flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> {editingItem ? 'Update' : 'Publish'}</span>
              </ModalButton>
            </>
          }
        >
          {renderArticleEditor('blog')}
        </AdminModal>
      )}

      {/* Editor Modal: Financial IQ */}
      {activeTab === 'financial-iq' && (
        <AdminModal
          isOpen={editorOpen}
          onClose={() => { setEditorOpen(false); resetForm() }}
          title={editingItem ? 'Edit Financial IQ Post' : 'New Financial IQ Post'}
          subtitle="Educational content for the Financial IQ section"
          maxWidth="max-w-3xl"
          footer={
            <>
              <ModalButton variant="secondary" onClick={() => { setEditorOpen(false); resetForm() }}>Cancel</ModalButton>
              {editingItem && (editingItem as FinancialIQPost).is_published && (
                <ModalButton variant="secondary" onClick={() => { setBroadcastTarget(editingItem as FinancialIQPost); setEditorOpen(false) }}>
                  <span className="flex items-center gap-1.5"><Send className="w-3.5 h-3.5" /> Send to clients</span>
                </ModalButton>
              )}
              <ModalButton variant="primary" onClick={saveFIQ} disabled={!formTitle.trim() || !formContent.trim()}>
                <span className="flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> {editingItem ? 'Update' : 'Save'}</span>
              </ModalButton>
            </>
          }
        >
          {renderArticleEditor('financial-iq')}
        </AdminModal>
      )}

      {/* Editor Modal: FAQ */}
      {activeTab === 'faq' && (
        <AdminModal
          isOpen={editorOpen}
          onClose={() => { setEditorOpen(false); resetForm() }}
          title={editingItem ? 'Edit FAQ' : 'New FAQ'}
          subtitle="Manage frequently asked questions"
          maxWidth="max-w-2xl"
          footer={
            <>
              <ModalButton variant="secondary" onClick={() => { setEditorOpen(false); resetForm() }}>Cancel</ModalButton>
              <ModalButton variant="primary" onClick={saveFAQ} disabled={!formQuestion.trim() || !formAnswer.trim()}>
                <span className="flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> {editingItem ? 'Update' : 'Save'}</span>
              </ModalButton>
            </>
          }
        >
          {renderFAQEditor()}
        </AdminModal>
      )}

      {/* Delete Confirmation Modal */}
      <AdminModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        title="Confirm Delete"
        subtitle="This action cannot be undone"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</ModalButton>
            <ModalButton variant="danger" onClick={() => {
              if (!deleteConfirmId) return
              if (activeTab === 'blog') deleteBlog(deleteConfirmId)
              else if (activeTab === 'financial-iq') deleteFIQ(deleteConfirmId)
              else if (activeTab === 'faq') deleteFAQ(deleteConfirmId)
              else if (activeTab === 'tickets') deleteTicket(deleteConfirmId)
            }}>
              <span className="flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</span>
            </ModalButton>
          </>
        }
      >
        <p className="text-sm text-gray-300">
          Are you sure you want to delete this {activeTab === 'blog' ? 'blog post' : activeTab === 'financial-iq' ? 'Financial IQ post' : activeTab === 'faq' ? 'FAQ' : 'ticket'}?
          This will permanently remove it from the database.
        </p>
      </AdminModal>

      {/* Financial IQ broadcast modal — manual bulk/individual send */}
      <FIQBroadcastModal
        post={broadcastTarget}
        onClose={() => setBroadcastTarget(null)}
        showToast={showToast}
      />

      {/* Bug #26: Ticket detail modal — admins can see the full message + reply history */}
      <AdminModal
        isOpen={!!viewingTicket}
        onClose={() => setViewingTicket(null)}
        title={viewingTicket ? `Ticket ${(viewingTicket as any).ticket_number || '#' + viewingTicket.id.slice(0, 8)}` : 'Ticket'}
        subtitle={viewingTicket?.subject}
        maxWidth="max-w-2xl"
      >
        {viewingTicket && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Investor</p>
                <p className="text-xs text-white">{(viewingTicket as any).client_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Status</p>
                <p className="text-xs text-white capitalize">{viewingTicket.status}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Priority</p>
                <p className="text-xs text-white capitalize">{viewingTicket.priority || 'Medium'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Category</p>
                <p className="text-xs text-white">{(viewingTicket as any).category || 'General'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Created</p>
                <p className="text-xs text-white">{new Date(viewingTicket.created_at).toLocaleString('en-IN')}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500">Last Updated</p>
                <p className="text-xs text-white">{new Date(viewingTicket.updated_at).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Investor's Message</p>
              <p className="text-xs leading-relaxed text-gray-200 bg-white/[0.03] border border-white/[0.06] rounded-lg p-3 whitespace-pre-wrap">
                {viewingTicket.description || '(no description)'}
              </p>
            </div>

            {(() => {
              const meta: any = (viewingTicket as any).metadata || {}
              const responses = Array.isArray(meta.admin_responses) ? meta.admin_responses : []
              if (responses.length === 0) {
                return <p className="text-xs italic text-gray-500">No admin responses yet. Changing status will require you to enter a response.</p>
              }
              return (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5">Admin Response History ({responses.length})</p>
                  <div className="space-y-2">
                    {responses.map((r: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                        <div className="flex items-center justify-between mb-1 text-[10px] text-gray-500">
                          <span className="font-semibold">Status → {r.status}</span>
                          <span>{r.at ? new Date(r.at).toLocaleString('en-IN') : ''}</span>
                        </div>
                        <p className="text-xs text-gray-200 whitespace-pre-wrap">{r.response}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            <div className="flex justify-end pt-3 border-t border-white/[0.06]">
              <ModalButton variant="secondary" onClick={() => setViewingTicket(null)}>Close</ModalButton>
            </div>
          </div>
        )}
      </AdminModal>
    </div>
  )
}
