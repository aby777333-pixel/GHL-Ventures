'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FileText, BookOpen, HelpCircle, Ticket, Plus, Edit, Trash2,
  Save,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminDataTable, { type Column } from '../shared/AdminDataTable'
import AdminBadge from '../shared/AdminBadge'
import AdminKPICard from '../shared/AdminKPICard'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminEmptyState from '../shared/AdminEmptyState'
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
  status: 'open' | 'in-progress' | 'awaiting-client' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  user_id: string
  created_at: string
  updated_at: string
  profiles?: { full_name: string; email: string } | null
}

// ── Sub-tabs ────────────────────────────────────────────────────
const CONTENT_TABS = [
  { id: 'blog', label: 'Blog Posts', icon: FileText },
  { id: 'fiq', label: 'Financial IQ', icon: BookOpen },
  { id: 'faq', label: 'FAQ', icon: HelpCircle },
  { id: 'tickets', label: 'Support Tickets', icon: Ticket },
] as const

type ContentTab = typeof CONTENT_TABS[number]['id']

const BLOG_CATEGORIES = ['Market Updates', 'Investment Tips', 'Company News', 'Economy', 'Real Estate', 'Mutual Funds', 'Insurance']
const FIQ_CATEGORIES = ['Basics', 'Advanced', 'Tax Planning', 'Retirement', 'Insurance', 'Real Estate', 'Mutual Funds']
const FAQ_CATEGORIES = ['General', 'Account', 'Investments', 'KYC', 'Payments', 'Returns', 'Support']
const TICKET_STATUSES = ['open', 'in-progress', 'awaiting-client', 'resolved', 'closed'] as const

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

  // ── Data Fetching ──────────────────────────────────────────
  const fetchBlogs = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    setLoading(true)
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { showToast(`Failed to load blogs: ${error.message}`, 'error') }
    else {
      // Map DB column 'published' to interface field 'is_published'
      const mapped = (data || []).map((b: any) => ({ ...b, is_published: b.published ?? b.is_published ?? false }))
      setBlogs(mapped as BlogPost[])
    }
    setLoading(false)
  }, [showToast])

  const fetchFIQ = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    setLoading(true)
    const { data, error } = await supabase
      .from('financial_iq_posts')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) { showToast(`Failed to load Financial IQ posts: ${error.message}`, 'error') }
    else { setFiqPosts((data as FinancialIQPost[]) ?? []) }
    setLoading(false)
  }, [showToast])

  const fetchFAQs = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    setLoading(true)
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) { showToast(`Failed to load FAQs: ${error.message}`, 'error') }
    else { setFaqs((data as FAQ[]) ?? []) }
    setLoading(false)
  }, [showToast])

  const fetchTickets = useCallback(async () => {
    if (!isSupabaseConfigured()) return
    setLoading(true)
    let ticketData: any[] = []
    const { data, error } = await supabase
      .from('tickets')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
    if (error) {
      // Fallback: fetch without join
      const { data: plain, error: e2 } = await supabase.from('tickets').select('*').order('created_at', { ascending: false })
      if (e2) { showToast(`Failed to load tickets: ${e2.message}`, 'error') }
      else { ticketData = plain || [] }
    } else { ticketData = data || [] }
    setTickets(ticketData as SupportTicket[])
    setLoading(false)
  }, [showToast])

  // Load ALL data on mount for KPI counts, then reload active tab on switch
  useEffect(() => {
    fetchBlogs(); fetchFIQ(); fetchFAQs(); fetchTickets()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (activeTab === 'blog') fetchBlogs()
    else if (activeTab === 'fiq') fetchFIQ()
    else if (activeTab === 'faq') fetchFAQs()
    else if (activeTab === 'tickets') fetchTickets()
  }, [activeTab, fetchBlogs, fetchFIQ, fetchFAQs, fetchTickets])

  // ── Editor Helpers ─────────────────────────────────────────
  const resetForm = () => {
    setFormTitle(''); setFormSlug(''); setFormContent(''); setFormExcerpt('')
    setFormCategory(''); setFormCoverImage(''); setFormAuthor(''); setFormTags('')
    setFormPublished(false); setFormQuestion(''); setFormAnswer('')
    setFormSortOrder(0); setFormActive(true); setEditingItem(null)
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
    }
    setEditorOpen(true)
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
    const payload = {
      title: formTitle,
      slug,
      content: formContent,
      excerpt: formExcerpt,
      category: formCategory,
      cover_image: formCoverImage,
      author: formAuthor,
      tags: formTags.split(',').map(t => t.trim()).filter(Boolean),
      is_published: formPublished,
      published_at: formPublished ? new Date().toISOString() : null,
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
  const updateTicketStatus = async (id: string, status: string) => {
    if (!isSupabaseConfigured()) return
    const { error } = await supabase.from('tickets').update({ status }).eq('id', id)
    if (error) { showToast(`Status update failed: ${error.message}`, 'error'); return }
    showToast(`Ticket status updated to ${status}`, 'success')
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
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in-progress').length

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
    { key: 'is_published', label: 'Status', sortable: true, render: (r) => (
      <AdminBadge label={r.is_published ? 'Published' : 'Draft'} variant={r.is_published ? 'success' : 'neutral'} dot />
    )},
    { key: 'created_at', label: 'Created', sortable: true, render: (r) => (
      <span className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString()}</span>
    )},
    { key: 'actions', label: '', width: '120px', render: (r) => (
      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); openFIQEditor(r) }}
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
        <p className="text-sm text-white">{r.profiles?.full_name || 'Unknown'}</p>
        <p className="text-[11px] text-gray-500">{r.profiles?.email || ''}</p>
      </div>
    )},
    { key: 'status', label: 'Status', sortable: true, render: (r) => {
      const v = r.status === 'resolved' || r.status === 'closed' ? 'success'
        : r.status === 'in-progress' ? 'warning'
        : r.status === 'awaiting-client' ? 'info' : 'error'
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
    { key: 'actions', label: '', width: '180px', render: (r) => (
      <div className="flex items-center gap-1">
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
  const renderArticleEditor = (type: 'blog' | 'fiq') => {
    const categories = type === 'blog' ? BLOG_CATEGORIES : FIQ_CATEGORIES
    return (
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Title</label>
          <input value={formTitle} onChange={e => setFormTitle(e.target.value)}
            placeholder="Enter post title..." className={inputClass} />
        </div>
        {type === 'fiq' && (
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
          <label className={labelClass}>Cover Image URL</label>
          <input value={formCoverImage} onChange={e => setFormCoverImage(e.target.value)}
            placeholder="https://..." className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Tags (comma-separated)</label>
          <input value={formTags} onChange={e => setFormTags(e.target.value)}
            placeholder="investing, finance, tips" className={inputClass} />
        </div>
        <div className="flex items-center gap-3 pt-1">
          <button onClick={() => setFormPublished(!formPublished)}
            className={`relative w-10 h-5 rounded-full transition-colors ${formPublished ? 'bg-brand-red' : 'bg-white/10'}`}>
            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${formPublished ? 'translate-x-5' : ''}`} />
          </button>
          <span className="text-sm text-gray-300">{formPublished ? 'Published' : 'Draft'}</span>
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
              onClick={() => navigate(`/admin/content-manager/${tab.id}`)}
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
        {activeTab === 'fiq' && (
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
      {activeTab === 'fiq' && (
        <AdminModal
          isOpen={editorOpen}
          onClose={() => { setEditorOpen(false); resetForm() }}
          title={editingItem ? 'Edit Financial IQ Post' : 'New Financial IQ Post'}
          subtitle="Educational content for the Financial IQ section"
          maxWidth="max-w-3xl"
          footer={
            <>
              <ModalButton variant="secondary" onClick={() => { setEditorOpen(false); resetForm() }}>Cancel</ModalButton>
              <ModalButton variant="primary" onClick={saveFIQ} disabled={!formTitle.trim() || !formContent.trim()}>
                <span className="flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> {editingItem ? 'Update' : 'Publish'}</span>
              </ModalButton>
            </>
          }
        >
          {renderArticleEditor('fiq')}
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
              else if (activeTab === 'fiq') deleteFIQ(deleteConfirmId)
              else if (activeTab === 'faq') deleteFAQ(deleteConfirmId)
              else if (activeTab === 'tickets') deleteTicket(deleteConfirmId)
            }}>
              <span className="flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete</span>
            </ModalButton>
          </>
        }
      >
        <p className="text-sm text-gray-300">
          Are you sure you want to delete this {activeTab === 'blog' ? 'blog post' : activeTab === 'fiq' ? 'Financial IQ post' : activeTab === 'faq' ? 'FAQ' : 'ticket'}?
          This will permanently remove it from the database.
        </p>
      </AdminModal>
    </div>
  )
}
