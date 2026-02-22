'use client'

import { useState, useMemo } from 'react'
import {
  MessageSquareText, ShieldCheck, BarChart3, Brain, Zap, Target, MapPin, Compass,
  Camera, Mic, TrendingUp, Globe, Sparkles, Search, Filter, Play, Bot, FileText,
  Users, Shield, Activity, Eye, Lightbulb, Route, Building2, Volume2, Handshake,
  Map, ArrowRight, ArrowLeft,
} from 'lucide-react'
import AdminGlass from '../../admin/shared/AdminGlass'
import AdminBadge from '../../admin/shared/AdminBadge'
import { STAFF_AI_TOOLS } from '@/lib/staff/staffMockData'
import type { StaffRole, StaffAITool } from '@/lib/staff/staffTypes'

// ── Icon Map ─────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  MessageSquareText, ShieldCheck, BarChart3, Brain, Zap, Target, MapPin, Compass,
  Camera, Mic, TrendingUp, Globe, Sparkles, Bot, FileText, Users, Shield, Activity,
  Eye, Lightbulb, Route, Building2, Volume2, Handshake, Map,
}

// ── Category Config ──────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  'cs-assist': { label: 'CS Assist', color: 'text-blue-400 bg-blue-500/15 border-blue-500/20' },
  'quality': { label: 'Quality', color: 'text-purple-400 bg-purple-500/15 border-purple-500/20' },
  'analytics': { label: 'Analytics', color: 'text-cyan-400 bg-cyan-500/15 border-cyan-500/20' },
  'compliance': { label: 'Compliance', color: 'text-amber-400 bg-amber-500/15 border-amber-500/20' },
  'automation': { label: 'Automation', color: 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20' },
  'field-ops': { label: 'Field Ops', color: 'text-orange-400 bg-orange-500/15 border-orange-500/20' },
  'intelligence': { label: 'Intelligence', color: 'text-pink-400 bg-pink-500/15 border-pink-500/20' },
}

const CATEGORY_KEYS = Object.keys(CATEGORY_CONFIG)

// ── Props ────────────────────────────────────────────────────────
interface AIToolsModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
  role: StaffRole
}

// ── Main Export ──────────────────────────────────────────────────
export default function AIToolsModule({ subTab, navigate, showToast, role }: AIToolsModuleProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Tools visible to this role
  const roleTools = useMemo(
    () => STAFF_AI_TOOLS.filter(t => t.forRoles.includes(role)),
    [role],
  )

  // If subTab matches a tool id, show the detail view
  const activeTool = useMemo(() => {
    if (subTab && subTab !== 'ai') return roleTools.find(t => t.id === subTab) || null
    return null
  }, [subTab, roleTools])

  const filteredTools = useMemo(() => {
    let tools = roleTools
    if (categoryFilter !== 'all') tools = tools.filter(t => t.category === categoryFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      tools = tools.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    }
    return tools
  }, [roleTools, categoryFilter, searchQuery])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: roleTools.length }
    roleTools.forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1 })
    return counts
  }, [roleTools])

  // ── Individual Tool View ──────────────────────────────────────
  if (activeTool) {
    return (
      <AIToolDetailView
        tool={activeTool}
        navigate={navigate}
        showToast={showToast}
      />
    )
  }

  // ── Hub View ──────────────────────────────────────────────────
  return (
    <div className="space-y-6 admin-section-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-teal-400" />
          AI Tools Hub
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {roleTools.length} AI-powered tools for CS and Field operations
        </p>
      </div>

      {/* Search + Category Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search AI tools..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20"
          />
        </div>

        {/* Category Chips */}
        <div className="flex flex-wrap gap-1.5">
          {['all', ...CATEGORY_KEYS].map(cat => {
            const count = categoryCounts[cat] || 0
            if (cat !== 'all' && count === 0) return null
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  categoryFilter === cat
                    ? 'bg-teal-500/20 text-white border-teal-500/30'
                    : 'bg-white/[0.03] text-gray-500 border-white/[0.06] hover:bg-white/[0.06]'
                }`}
              >
                {cat === 'all'
                  ? `All (${categoryCounts.all})`
                  : `${CATEGORY_CONFIG[cat]?.label} (${count})`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTools.map((tool, i) => {
          const Icon = ICON_MAP[tool.icon] || Sparkles
          const catConfig = CATEGORY_CONFIG[tool.category]
          const colorParts = catConfig?.color.split(' ') || []
          const textColor = colorParts[0] || 'text-gray-400'
          const bgBorder = colorParts.slice(1).join(' ') || 'bg-white/[0.04] border-white/[0.06]'

          return (
            <AdminGlass
              key={tool.id}
              padding="p-4"
              className="cursor-pointer group admin-card-enter"
            >
              <div style={{ animationDelay: `${i * 40}ms` }}>
                {/* Top: icon + status */}
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border ${bgBorder}`}>
                    <Icon className={`w-5 h-5 ${textColor}`} />
                  </div>
                  <AdminBadge
                    label={tool.status === 'active' ? 'Active' : 'Beta'}
                    variant={tool.status === 'active' ? 'success' : 'purple'}
                    dot
                  />
                </div>

                {/* Name + Description */}
                <h3 className="text-sm font-semibold text-white group-hover:text-teal-400 transition-colors">
                  {tool.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tool.description}</p>

                {/* Footer: category + launch */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${textColor}`}>
                    {catConfig?.label || tool.category}
                  </span>
                  <button
                    onClick={() => navigate(`ai/${tool.id}`)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 transition-colors"
                  >
                    Launch
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </AdminGlass>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredTools.length === 0 && (
        <AdminGlass className="text-center py-12">
          <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No AI tools match your search</p>
          <button
            onClick={() => { setSearchQuery(''); setCategoryFilter('all') }}
            className="mt-3 text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            Clear filters
          </button>
        </AdminGlass>
      )}
    </div>
  )
}

// ── AI Tool Detail View ─────────────────────────────────────────
function AIToolDetailView({
  tool,
  navigate,
  showToast,
}: {
  tool: StaffAITool
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const Icon = ICON_MAP[tool.icon] || Sparkles
  const catConfig = CATEGORY_CONFIG[tool.category]
  const colorParts = catConfig?.color.split(' ') || []
  const textColor = colorParts[0] || 'text-gray-400'
  const bgBorder = colorParts.slice(1).join(' ') || 'bg-white/[0.04] border-white/[0.06]'

  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleGenerate = () => {
    if (!input.trim()) {
      showToast('Please enter input data', 'warning')
      return
    }
    setIsProcessing(true)
    setResult(null)
    setTimeout(() => {
      setIsProcessing(false)
      setResult(
        `AI Analysis Complete for "${tool.name}":\n\n` +
        `Input processed: "${input.substring(0, 60)}${input.length > 60 ? '...' : ''}"\n\n` +
        `Confidence: ${(88 + Math.random() * 10).toFixed(1)}%\n` +
        `Processing time: ${(0.5 + Math.random() * 2).toFixed(1)}s\n\n` +
        `[Demo mode -- Real AI-generated output would appear here in production]`
      )
      showToast(`${tool.name} completed successfully`, 'success')
    }, 1800 + Math.random() * 1200)
  }

  return (
    <div className="space-y-6 admin-section-enter">
      {/* Back Button */}
      <button
        onClick={() => navigate('ai')}
        className="text-xs text-gray-500 hover:text-teal-400 transition-colors flex items-center gap-1"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to AI Tools Hub
      </button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl border ${bgBorder}`}>
          <Icon className={`w-6 h-6 ${textColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-bold text-white">{tool.name}</h1>
            <AdminBadge
              label={tool.status === 'active' ? 'Active' : 'Beta'}
              variant={tool.status === 'active' ? 'success' : 'purple'}
              dot
            />
            <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full border ${catConfig?.color || 'text-gray-500 bg-white/[0.04] border-white/[0.06]'}`}>
              {catConfig?.label || tool.category}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">{tool.description}</p>
        </div>
      </div>

      {/* Input / Output Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Area */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-teal-400" />
            Input
          </h3>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Enter data for ${tool.name}...`}
            className="w-full h-40 bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20"
          />
          <button
            onClick={handleGenerate}
            disabled={isProcessing}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-500/20 border border-teal-500/30 hover:bg-teal-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Generate
              </>
            )}
          </button>
        </AdminGlass>

        {/* Output Area */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-teal-400" />
            Output
          </h3>
          <div className="h-40 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 overflow-y-auto">
            {result ? (
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{result}</pre>
            ) : isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-teal-500/20 border-t-teal-400 rounded-full animate-spin mb-3" />
                <p className="text-xs text-gray-500">AI is processing your request...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-600">
                <Sparkles className="w-6 h-6 mb-2" />
                <p className="text-xs">Results will appear here</p>
              </div>
            )}
          </div>
          {result && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(result)
                  showToast('Copied to clipboard', 'success')
                }}
                className="flex-1 py-2 rounded-lg text-xs font-medium text-gray-400 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                Copy Result
              </button>
              <button
                onClick={() => { setResult(null); setInput('') }}
                className="flex-1 py-2 rounded-lg text-xs font-medium text-gray-400 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                Clear
              </button>
            </div>
          )}
        </AdminGlass>
      </div>
    </div>
  )
}
