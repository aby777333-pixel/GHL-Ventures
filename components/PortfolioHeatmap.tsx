'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, TrendingUp, TrendingDown, Activity, Maximize2, Minimize2 } from 'lucide-react'

interface Sector {
  id: string
  name: string
  shortName: string
  change: number
  marketCap: string
  weight: number // relative tile size
  subsectors: string[]
}

const INITIAL_SECTORS: Sector[] = [
  { id: 'realestate', name: 'Stressed Real Estate', shortName: 'RE', change: 3.2, marketCap: '₹142Cr', weight: 18, subsectors: ['NCLT Assets', 'Distressed Debt', 'Restructuring'] },
  { id: 'startups', name: 'Early-Stage Startups', shortName: 'SU', change: 5.8, marketCap: '₹98Cr', weight: 14, subsectors: ['SaaS', 'HealthTech', 'FinTech'] },
  { id: 'infra', name: 'Infrastructure', shortName: 'IN', change: -1.4, marketCap: '₹86Cr', weight: 12, subsectors: ['Roads', 'Power', 'Urban Dev'] },
  { id: 'healthcare', name: 'Healthcare', shortName: 'HC', change: 2.1, marketCap: '₹74Cr', weight: 11, subsectors: ['MedTech', 'Hospitals', 'Pharma'] },
  { id: 'fintech', name: 'FinTech', shortName: 'FT', change: 4.6, marketCap: '₹68Cr', weight: 10, subsectors: ['Payments', 'Lending', 'InsurTech'] },
  { id: 'consumer', name: 'Consumer', shortName: 'CN', change: -0.8, marketCap: '₹55Cr', weight: 9, subsectors: ['D2C', 'Retail', 'FMCG'] },
  { id: 'greentech', name: 'Green Energy', shortName: 'GE', change: 6.3, marketCap: '₹52Cr', weight: 8, subsectors: ['Solar', 'EV', 'Battery'] },
  { id: 'edtech', name: 'EdTech', shortName: 'ED', change: -2.5, marketCap: '₹38Cr', weight: 6, subsectors: ['K-12', 'Upskilling', 'AI Tutoring'] },
  { id: 'logistics', name: 'Logistics', shortName: 'LG', change: 1.9, marketCap: '₹34Cr', weight: 6, subsectors: ['Warehousing', 'Last Mile', 'Cold Chain'] },
  { id: 'deeptech', name: 'Deep Tech', shortName: 'DT', change: 7.1, marketCap: '₹28Cr', weight: 6, subsectors: ['AI/ML', 'Semiconductor', 'Quantum'] },
]

function getColor(change: number): string {
  if (change >= 5) return 'from-emerald-500 to-emerald-600'
  if (change >= 2) return 'from-emerald-600 to-emerald-700'
  if (change >= 0) return 'from-emerald-800 to-emerald-900'
  if (change >= -2) return 'from-red-900 to-red-800'
  return 'from-red-700 to-red-600'
}

function getGlow(change: number): string {
  if (change >= 5) return '0 0 20px rgba(16,185,129,0.5)'
  if (change >= 2) return '0 0 12px rgba(16,185,129,0.3)'
  if (change >= 0) return '0 0 8px rgba(16,185,129,0.15)'
  if (change >= -2) return '0 0 8px rgba(239,68,68,0.15)'
  return '0 0 16px rgba(239,68,68,0.4)'
}

function getTextColor(change: number): string {
  if (change >= 2) return 'text-emerald-200'
  if (change >= 0) return 'text-emerald-300'
  if (change >= -2) return 'text-red-300'
  return 'text-red-200'
}

export default function PortfolioHeatmap() {
  const [isOpen, setIsOpen] = useState(false)
  const [sectors, setSectors] = useState(INITIAL_SECTORS)
  const [hoveredSector, setHoveredSector] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Simulate live updates every 3 seconds
  useEffect(() => {
    if (!isOpen) return
    const interval = setInterval(() => {
      setSectors(prev =>
        prev.map(s => ({
          ...s,
          change: Math.round((s.change + (Math.random() - 0.48) * 0.6) * 100) / 100,
        }))
      )
    }, 3000)
    return () => clearInterval(interval)
  }, [isOpen])

  const totalPositive = sectors.filter(s => s.change > 0).length
  const avgChange = sectors.reduce((a, s) => a + s.change, 0) / sectors.length

  return (
    <>
      {/* Trigger button in hero area — or as a floating action */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-[9992] flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 hover:scale-105 group"
          style={{
            top: '140px',
            left: '16px',
            background: 'rgba(10,10,10,0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
          title="View live portfolio heatmap"
        >
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-gray-500 leading-none mb-0.5">Portfolio</p>
            <p className="text-[11px] text-gray-300 group-hover:text-white transition-colors font-medium">
              Heatmap Live
            </p>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        </button>
      )}

      {/* Heatmap Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
        >
          <div
            className={`relative bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden transition-all duration-300 ${
              isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-4xl'
            }`}
            style={{ boxShadow: '0 24px 80px rgba(0,0,0,0.8)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-white text-sm font-bold flex items-center gap-2">
                    GHL Portfolio Heatmap
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-emerald-400 font-normal">LIVE</span>
                  </h2>
                  <p className="text-[11px] text-gray-500">Simulated real-time sector performance</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Summary pills */}
                <div className="hidden sm:flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                    {totalPositive}/{sectors.length} sectors up
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium ${
                    avgChange >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    Avg {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
                  </span>
                </div>
                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => { setIsOpen(false); setIsFullscreen(false) }}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Heatmap Grid */}
            <div className={`p-4 ${isFullscreen ? 'h-[calc(100%-120px)]' : ''}`}>
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 auto-rows-fr" style={{ minHeight: isFullscreen ? '100%' : '340px' }}>
                {sectors
                  .sort((a, b) => b.weight - a.weight)
                  .map(sector => {
                    const isHovered = hoveredSector === sector.id
                    return (
                      <div
                        key={sector.id}
                        className={`relative rounded-xl bg-gradient-to-br ${getColor(sector.change)} cursor-pointer transition-all duration-500 group flex flex-col justify-between p-3 overflow-hidden ${
                          sector.weight >= 14 ? 'col-span-2 row-span-2' :
                          sector.weight >= 10 ? 'col-span-2' :
                          'col-span-1'
                        }`}
                        style={{
                          boxShadow: isHovered ? getGlow(sector.change) : 'none',
                          transform: isHovered ? 'scale(1.02)' : 'scale(1)',
                        }}
                        onMouseEnter={() => setHoveredSector(sector.id)}
                        onMouseLeave={() => setHoveredSector(null)}
                      >
                        {/* Animated shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{ transform: 'skewX(-20deg)', animation: isHovered ? 'shimmer 2s infinite' : 'none' }}
                        />

                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white/90 text-xs font-bold truncate">{sector.shortName}</span>
                            {sector.change >= 0 ? (
                              <TrendingUp className="w-3 h-3 text-emerald-200" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-200" />
                            )}
                          </div>
                          <p className="text-white/60 text-[9px] truncate">{sector.name}</p>
                        </div>

                        <div className="relative z-10 mt-auto">
                          <p className={`text-lg font-black ${getTextColor(sector.change)}`}>
                            {sector.change >= 0 ? '+' : ''}{sector.change.toFixed(1)}%
                          </p>
                          <p className="text-white/40 text-[9px]">{sector.marketCap}</p>
                        </div>

                        {/* Expanded tooltip on hover */}
                        {isHovered && sector.weight >= 10 && (
                          <div className="absolute bottom-2 right-2 z-20">
                            <div className="flex flex-wrap gap-1">
                              {sector.subsectors.map(sub => (
                                <span key={sub} className="px-1.5 py-0.5 rounded text-[8px] bg-black/30 text-white/60">
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between">
              <span className="text-[10px] text-gray-600">
                Simulated data · Updates every 3s · Not financial advice
              </span>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="w-3 h-2 rounded-sm bg-emerald-500" />
                  <span className="text-[9px] text-gray-500">Positive</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-3 h-2 rounded-sm bg-red-500" />
                  <span className="text-[9px] text-gray-500">Negative</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shimmer keyframe */}
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-20deg); }
          100% { transform: translateX(200%) skewX(-20deg); }
        }
      `}</style>
    </>
  )
}
