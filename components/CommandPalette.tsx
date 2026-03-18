'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, ArrowRight, Home, Users, Briefcase, BookOpen,
  FileText, Phone, Download, GraduationCap, Calculator,
  Sparkles, X, Command, TrendingUp
} from 'lucide-react'

interface PaletteItem {
  id: string
  label: string
  description: string
  href?: string
  action?: string
  icon: React.ElementType
  category: 'Navigation' | 'Tools' | 'Articles' | 'Actions'
}

const PALETTE_ITEMS: PaletteItem[] = [
  // Navigation
  { id: 'home', label: 'Home', description: 'Go to homepage', href: '/', icon: Home, category: 'Navigation' },
  { id: 'about', label: 'About Us', description: 'Our team & story', href: '/about', icon: Users, category: 'Navigation' },
  { id: 'fund', label: 'Fund Overview', description: 'Investment fund details', href: '/fund', icon: Briefcase, category: 'Navigation' },
  { id: 'blog', label: 'Blog & Insights', description: 'Articles & market analysis', href: '/blog', icon: BookOpen, category: 'Navigation' },
  { id: 'portfolio', label: 'Portfolio', description: 'Companies we back', href: '/portfolio', icon: TrendingUp, category: 'Navigation' },
  { id: 'financial-iq', label: 'Financial IQ', description: 'Learn & grow', href: '/financial-iq', icon: GraduationCap, category: 'Navigation' },
  { id: 'downloads', label: 'Downloads', description: 'Brochures & documents', href: '/downloads', icon: Download, category: 'Navigation' },
  { id: 'contact', label: 'Contact Us', description: 'Get in touch', href: '/contact', icon: Phone, category: 'Navigation' },
  { id: 'debenture', label: 'SEBI Co-Invest Framework', description: 'SEBI-regulated co-invest option', href: '/fund/debenture-route', icon: FileText, category: 'Navigation' },
  { id: 'direct-aif', label: 'Direct AIF', description: 'Category II AIF investment', href: '/fund/direct-aif', icon: Briefcase, category: 'Navigation' },

  // Tools
  { id: 'calculator', label: 'Investment Calculator', description: 'Model returns across routes', action: 'open-calculator', icon: Calculator, category: 'Tools' },
  { id: 'quiz', label: 'Risk Assessment Quiz', description: 'Find your ideal investment route', action: 'open-quiz', icon: Sparkles, category: 'Tools' },

  // Actions
  { id: 'whatsapp', label: 'Chat on WhatsApp', description: '+91 7200 255 252', action: 'open-whatsapp', icon: Phone, category: 'Actions' },
  { id: 'email', label: 'Email Us', description: 'info@ghlindiaventures.com', action: 'open-email', icon: FileText, category: 'Actions' },
]

interface CommandPaletteProps {
  onOpenQuiz?: () => void
  onOpenCalc?: () => void
}

export default function CommandPalette({ onOpenQuiz, onOpenCalc }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Filtered items
  const filtered = useMemo(() => {
    if (!query) return PALETTE_ITEMS
    const q = query.toLowerCase()
    return PALETTE_ITEMS.filter(
      item =>
        item.label.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    )
  }, [query])

  // Grouped items
  const grouped = useMemo(() => {
    const groups: Record<string, PaletteItem[]> = {}
    filtered.forEach(item => {
      if (!groups[item.category]) groups[item.category] = []
      groups[item.category].push(item)
    })
    return groups
  }, [filtered])

  // Keyboard navigation
  const handleKeyNav = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault()
      handleSelect(filtered[selectedIndex])
    }
  }

  const handleSelect = (item: PaletteItem) => {
    setIsOpen(false)
    if (item.href) {
      router.push(item.href)
    } else if (item.action === 'open-calculator' && onOpenCalc) {
      onOpenCalc()
    } else if (item.action === 'open-quiz' && onOpenQuiz) {
      onOpenQuiz()
    } else if (item.action === 'open-whatsapp') {
      window.open('https://wa.me/917200255252?text=Hi%2C%20I%27d%20like%20to%20learn%20more%20about%20GHL%20India%20Ventures.', '_blank')
    } else if (item.action === 'open-email') {
      window.location.href = 'mailto:info@ghlindiaventures.com?subject=Investment%20Inquiry'
    }
  }

  // Scroll selected into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!isOpen) return null

  let flatIndex = -1

  return (
    <div className="fixed inset-0 z-[99999] flex items-start justify-center pt-[15vh]" onClick={() => setIsOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: 'rgba(10,10,10,0.96)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 100px rgba(0,0,0,0.7), 0 0 60px rgba(208,2,27,0.15)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center px-4 py-3 border-b border-white/10">
          <Search className="w-5 h-5 text-gray-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelectedIndex(0) }}
            onKeyDown={handleKeyNav}
            placeholder="Search pages, tools, actions..."
            className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-500"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white/10 text-[10px] text-gray-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto py-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(208,2,27,0.4) transparent' }}>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <div className="px-4 pt-3 pb-1">
                  <span className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest">{category}</span>
                </div>
                {items.map(item => {
                  flatIndex++
                  const idx = flatIndex
                  return (
                    <button
                      key={item.id}
                      data-index={idx}
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                        selectedIndex === idx
                          ? 'bg-brand-red/15 text-white'
                          : 'text-gray-300 hover:bg-white/5'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        selectedIndex === idx ? 'bg-brand-red/20' : 'bg-white/5'
                      }`}>
                        <item.icon className={`w-4 h-4 ${selectedIndex === idx ? 'text-brand-red' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <p className="text-[11px] text-gray-500 truncate">{item.description}</p>
                      </div>
                      <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${selectedIndex === idx ? 'text-brand-red' : 'text-gray-600'}`} />
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-white/10 flex items-center justify-between text-[10px] text-gray-600">
          <span className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">↑↓</kbd> Navigate
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono">↵</kbd> Select
          </span>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" />K to toggle
          </span>
        </div>
      </div>
    </div>
  )
}
