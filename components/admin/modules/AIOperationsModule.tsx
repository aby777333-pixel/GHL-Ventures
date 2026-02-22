'use client'

import { useState, useMemo } from 'react'
import {
  Sparkles, FileSearch, ShieldAlert, FileSignature, Presentation,
  TrendingUp, CheckSquare, Target, Mail, Lightbulb, Bot, Heart,
  AlertTriangle, Mic, Radar, UserMinus, Mic2, FileBarChart,
  BookOpen, Play, Pause, Clock, Zap, Brain, Activity,
  ArrowRight, Star, Settings, BarChart3, Search,
} from 'lucide-react'
import AdminGlass from '../shared/AdminGlass'
import AdminBadge from '../shared/AdminBadge'
import AdminModal, { ModalButton } from '../shared/AdminModal'
import AdminKPICard from '../shared/AdminKPICard'
import { AI_TOOLS } from '@/lib/admin/adminMockData'
import type { AITool } from '@/lib/admin/adminTypes'

// ── Icon Map ─────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileSearch, ShieldAlert, FileSignature, Presentation, TrendingUp,
  CheckSquare, Target, Mail, Lightbulb, Bot, Heart, AlertTriangle,
  Mic, Radar, UserMinus, Mic2, FileBarChart, BookOpen,
}

// ── Category Config ──────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  analysis: { label: 'Analysis', color: 'text-blue-400', bgColor: 'bg-blue-500/15 border-blue-500/20' },
  generation: { label: 'Generation', color: 'text-purple-400', bgColor: 'bg-purple-500/15 border-purple-500/20' },
  prediction: { label: 'Prediction', color: 'text-amber-400', bgColor: 'bg-amber-500/15 border-amber-500/20' },
  monitoring: { label: 'Monitoring', color: 'text-emerald-400', bgColor: 'bg-emerald-500/15 border-emerald-500/20' },
  automation: { label: 'Automation', color: 'text-red-400', bgColor: 'bg-red-500/15 border-red-500/20' },
}

// ── Mock AI Usage Stats ──────────────────────────────────────────
const AI_USAGE_STATS = {
  totalRuns: 1847,
  avgConfidence: 94.2,
  documentsProcessed: 342,
  timeSaved: '156 hrs',
  activeTools: 14,
  betaTools: 3,
}

interface AIOperationsModuleProps {
  subTab: string | null
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}

export default function AIOperationsModule({ subTab, navigate, showToast }: AIOperationsModuleProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // If subTab matches a tool ID, show that tool
  const activeTool = useMemo(() => {
    if (subTab) return AI_TOOLS.find(t => t.id === subTab) || null
    return null
  }, [subTab])

  const filteredTools = useMemo(() => {
    let tools = AI_TOOLS
    if (categoryFilter !== 'all') tools = tools.filter(t => t.category === categoryFilter)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      tools = tools.filter(t => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
    }
    return tools
  }, [categoryFilter, searchQuery])

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: AI_TOOLS.length }
    AI_TOOLS.forEach(t => { counts[t.category] = (counts[t.category] || 0) + 1 })
    return counts
  }, [])

  // If a specific tool is selected via URL
  if (activeTool) {
    return <AIToolDetailView tool={activeTool} navigate={navigate} showToast={showToast} />
  }

  return (
    <div className="space-y-6 admin-section-enter">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-brand-red" />
          AI Operations Suite
        </h1>
        <p className="text-sm text-gray-500 mt-1">18 AI-powered tools for intelligent operations management</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <AdminKPICard title="Total AI Runs" value={AI_USAGE_STATS.totalRuns.toLocaleString()} icon={Zap} color="#F59E0B" delay={0} />
        <AdminKPICard title="Avg Confidence" value={`${AI_USAGE_STATS.avgConfidence}%`} icon={Brain} color="#8B5CF6" delay={50} />
        <AdminKPICard title="Active Tools" value={`${AI_USAGE_STATS.activeTools}/${AI_TOOLS.length}`} icon={Activity} color="#10B981" delay={100} />
        <AdminKPICard title="Time Saved" value={AI_USAGE_STATS.timeSaved} icon={Clock} color="#DC2626" delay={150} />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search AI tools..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 admin-input-glow"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {['all', ...Object.keys(CATEGORY_CONFIG)].map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                categoryFilter === cat
                  ? 'bg-brand-red/20 text-white border-brand-red/30'
                  : 'bg-white/[0.03] text-gray-500 border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              {cat === 'all' ? `All (${categoryCounts.all})` : `${CATEGORY_CONFIG[cat]?.label} (${categoryCounts[cat] || 0})`}
            </button>
          ))}
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredTools.map((tool, i) => {
          const Icon = ICON_MAP[tool.icon] || Sparkles
          const catConfig = CATEGORY_CONFIG[tool.category]
          return (
            <AdminGlass
              key={tool.id}
              padding="p-4"
              className="cursor-pointer group admin-card-enter"
            >
              <div style={{ animationDelay: `${i * 40}ms` }}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl border ${catConfig?.bgColor || 'bg-white/[0.04] border-white/[0.06]'}`}>
                    <Icon className={`w-5 h-5 ${catConfig?.color || 'text-gray-400'}`} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <AdminBadge
                      label={tool.status === 'active' ? 'Active' : tool.status === 'beta' ? 'Beta' : 'Soon'}
                      variant={tool.status === 'active' ? 'success' : tool.status === 'beta' ? 'warning' : 'neutral'}
                      dot
                    />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-white group-hover:text-brand-red transition-colors">{tool.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{tool.description}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/[0.04]">
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${catConfig?.color || 'text-gray-500'}`}>
                    {catConfig?.label || tool.category}
                  </span>
                  <button
                    onClick={() => {
                      if (tool.status === 'coming-soon') {
                        showToast(`${tool.name} will be available soon`, 'info')
                      } else {
                        navigate(`ai-ops/${tool.id}`)
                      }
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      tool.status === 'coming-soon'
                        ? 'text-gray-600 bg-white/[0.02] cursor-not-allowed'
                        : 'text-brand-red bg-brand-red/10 hover:bg-brand-red/20'
                    }`}
                  >
                    {tool.status === 'coming-soon' ? 'Coming Soon' : 'Launch'}
                    {tool.status !== 'coming-soon' && <ArrowRight className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </AdminGlass>
          )
        })}
      </div>

      {filteredTools.length === 0 && (
        <AdminGlass className="text-center py-12">
          <Sparkles className="w-8 h-8 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No tools match your search</p>
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
  tool: AITool
  navigate: (path: string) => void
  showToast: (msg: string, type?: 'success' | 'error' | 'info' | 'warning') => void
}) {
  const Icon = ICON_MAP[tool.icon] || Sparkles
  const catConfig = CATEGORY_CONFIG[tool.category]
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const handleRun = () => {
    if (!input.trim()) { showToast('Please enter input data', 'warning'); return }
    setIsProcessing(true)
    setResult(null)
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false)
      setResult(`AI Analysis Complete for "${tool.name}":\n\n` +
        `Input processed: "${input.substring(0, 50)}${input.length > 50 ? '...' : ''}"\n\n` +
        `Confidence: ${(88 + Math.random() * 10).toFixed(1)}%\n` +
        `Processing time: ${(0.5 + Math.random() * 2).toFixed(1)}s\n\n` +
        `[Demo mode — This would return real AI-generated analysis in production]`)
      showToast(`${tool.name} analysis complete`, 'success')
    }, 2000 + Math.random() * 1000)
  }

  return (
    <div className="space-y-6 admin-section-enter">
      {/* Breadcrumb */}
      <button
        onClick={() => navigate('ai-ops')}
        className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
      >
        ← Back to AI Operations
      </button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl border ${catConfig?.bgColor || 'bg-white/[0.04] border-white/[0.06]'}`}>
          <Icon className={`w-6 h-6 ${catConfig?.color || 'text-gray-400'}`} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{tool.name}</h1>
            <AdminBadge
              label={tool.status === 'active' ? 'Active' : 'Beta'}
              variant={tool.status === 'active' ? 'success' : 'warning'}
              dot
            />
          </div>
          <p className="text-sm text-gray-400 mt-1">{tool.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input Area */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Play className="w-4 h-4 text-brand-red" />
            Input
          </h3>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Enter data for ${tool.name}...`}
            className="w-full h-40 bg-white/[0.03] border border-white/[0.08] rounded-xl p-3 text-sm text-white placeholder-gray-600 resize-none focus:outline-none focus:border-brand-red/40 focus:ring-1 focus:ring-brand-red/20 admin-input-glow"
          />
          <button
            onClick={handleRun}
            disabled={isProcessing}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-brand-red/20 border border-brand-red/30 hover:bg-brand-red/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed admin-btn-press"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run {tool.name}
              </>
            )}
          </button>
        </AdminGlass>

        {/* Output Area */}
        <AdminGlass>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Brain className="w-4 h-4 text-brand-red" />
            Output
          </h3>
          <div className="h-40 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 overflow-y-auto admin-scroll">
            {result ? (
              <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">{result}</pre>
            ) : isProcessing ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="w-8 h-8 border-2 border-brand-red/20 border-t-brand-red rounded-full animate-spin mb-3" />
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
                onClick={() => { navigator.clipboard?.writeText(result); showToast('Copied to clipboard', 'success') }}
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

      {/* Tool Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Runs', value: Math.floor(50 + Math.random() * 200).toString(), icon: BarChart3, color: '#3B82F6' },
          { label: 'Avg Confidence', value: `${(90 + Math.random() * 8).toFixed(1)}%`, icon: Star, color: '#F59E0B' },
          { label: 'Avg Time', value: `${(0.5 + Math.random() * 3).toFixed(1)}s`, icon: Clock, color: '#10B981' },
          { label: 'Category', value: catConfig?.label || tool.category, icon: Settings, color: '#8B5CF6' },
        ].map(stat => (
          <AdminKPICard key={stat.label} title={stat.label} value={stat.value} icon={stat.icon} color={stat.color} />
        ))}
      </div>
    </div>
  )
}
