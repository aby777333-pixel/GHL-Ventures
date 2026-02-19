'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  ChevronUp,
  ChevronDown,
  X,
  Globe,
  IndianRupee,
  Clock,
  AlertTriangle,
  TrendingUp,
  Landmark,
  BarChart3,
  Banknote,
  Factory,
  ShoppingCart,
  Briefcase,
  Wheat,
} from 'lucide-react'

type Impact = 'high' | 'medium' | 'low'
type Region = 'india' | 'global'

interface CalendarEvent {
  id: number
  date: string
  time: string
  event: string
  region: Region
  impact: Impact
  previous?: string
  forecast?: string
  icon: React.ElementType
}

// Upcoming economic events — simulated realistic data
const CALENDAR_EVENTS: CalendarEvent[] = [
  // Global Events
  { id: 1, date: 'Feb 18', time: '19:30 IST', event: 'US Retail Sales (MoM)', region: 'global', impact: 'high', previous: '0.4%', forecast: '0.3%', icon: ShoppingCart },
  { id: 2, date: 'Feb 19', time: '20:00 IST', event: 'FOMC Meeting Minutes', region: 'global', impact: 'high', previous: '-', forecast: '-', icon: Landmark },
  { id: 3, date: 'Feb 20', time: '14:30 IST', event: 'ECB Monetary Policy Statement', region: 'global', impact: 'high', previous: '-', forecast: '-', icon: Landmark },
  { id: 4, date: 'Feb 20', time: '19:00 IST', event: 'US Initial Jobless Claims', region: 'global', impact: 'medium', previous: '213K', forecast: '218K', icon: Briefcase },
  { id: 5, date: 'Feb 21', time: '15:30 IST', event: 'UK GDP Growth Rate (QoQ)', region: 'global', impact: 'high', previous: '0.0%', forecast: '0.1%', icon: BarChart3 },
  { id: 6, date: 'Feb 21', time: '20:45 IST', event: 'US Manufacturing PMI (Flash)', region: 'global', impact: 'medium', previous: '51.2', forecast: '51.5', icon: Factory },
  { id: 7, date: 'Feb 24', time: '05:30 IST', event: 'Japan CPI (YoY)', region: 'global', impact: 'medium', previous: '3.6%', forecast: '3.4%', icon: ShoppingCart },
  { id: 8, date: 'Feb 25', time: '20:00 IST', event: 'US Consumer Confidence Index', region: 'global', impact: 'medium', previous: '104.1', forecast: '105.0', icon: TrendingUp },
  { id: 9, date: 'Feb 27', time: '19:00 IST', event: 'US GDP (QoQ) Second Estimate', region: 'global', impact: 'high', previous: '3.3%', forecast: '3.2%', icon: BarChart3 },
  { id: 10, date: 'Feb 28', time: '19:00 IST', event: 'US Core PCE Price Index (MoM)', region: 'global', impact: 'high', previous: '0.2%', forecast: '0.3%', icon: Banknote },
  // Indian Events
  { id: 11, date: 'Feb 18', time: '17:30 IST', event: 'India WPI Inflation (YoY)', region: 'india', impact: 'medium', previous: '2.37%', forecast: '2.50%', icon: TrendingUp },
  { id: 12, date: 'Feb 19', time: '17:30 IST', event: 'SEBI Board Meeting — AIF Regulations', region: 'india', impact: 'high', previous: '-', forecast: '-', icon: Landmark },
  { id: 13, date: 'Feb 20', time: '12:00 IST', event: 'India Trade Balance', region: 'india', impact: 'medium', previous: '-$22.1B', forecast: '-$20.8B', icon: BarChart3 },
  { id: 14, date: 'Feb 21', time: '17:30 IST', event: 'RBI Weekly Statistical Supplement', region: 'india', impact: 'low', previous: '-', forecast: '-', icon: Landmark },
  { id: 15, date: 'Feb 24', time: '12:00 IST', event: 'India Manufacturing PMI (Flash)', region: 'india', impact: 'high', previous: '57.5', forecast: '57.8', icon: Factory },
  { id: 16, date: 'Feb 25', time: '17:30 IST', event: 'India GDP Q3 FY26 (Advance)', region: 'india', impact: 'high', previous: '7.6%', forecast: '7.2%', icon: BarChart3 },
  { id: 17, date: 'Feb 26', time: '10:00 IST', event: 'India Infrastructure Output (YoY)', region: 'india', impact: 'medium', previous: '4.3%', forecast: '4.6%', icon: Factory },
  { id: 18, date: 'Feb 27', time: '12:00 IST', event: 'India Fiscal Deficit (Jan)', region: 'india', impact: 'medium', previous: '₹9.2T', forecast: '₹9.5T', icon: Banknote },
  { id: 19, date: 'Feb 28', time: '17:30 IST', event: 'India Forex Reserves Weekly', region: 'india', impact: 'low', previous: '$624.3B', forecast: '-', icon: Banknote },
  { id: 20, date: 'Mar 3', time: '17:30 IST', event: 'India CPI Inflation (Feb)', region: 'india', impact: 'high', previous: '4.31%', forecast: '4.40%', icon: ShoppingCart },
  { id: 21, date: 'Mar 5', time: '09:30 IST', event: 'India Services PMI (Feb)', region: 'india', impact: 'medium', previous: '56.5', forecast: '56.8', icon: Briefcase },
  { id: 22, date: 'Mar 7', time: '10:00 IST', event: 'RBI Monetary Policy Decision', region: 'india', impact: 'high', previous: '6.25%', forecast: '6.00%', icon: Landmark },
]

const impactColors: Record<Impact, { bg: string; text: string; dot: string }> = {
  high: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400' },
  medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400' },
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400' },
}

export default function EconomicCalendar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [tab, setTab] = useState<'india' | 'global'>('india')
  const [showWidget, setShowWidget] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowWidget(true), 5500)
    return () => clearTimeout(timer)
  }, [])

  const filtered = CALENDAR_EVENTS.filter(e => e.region === tab)

  // Group events by date
  const grouped = filtered.reduce<Record<string, CalendarEvent[]>>((acc, evt) => {
    if (!acc[evt.date]) acc[evt.date] = []
    acc[evt.date].push(evt)
    return acc
  }, {})

  if (!showWidget) return null

  // Collapsed pill — bottom-right
  if (!isOpen) {
    const nextHigh = CALENDAR_EVENTS.find(e => e.impact === 'high')
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-[9993] flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 hover:scale-[1.02] group"
        style={{
          bottom: '24px',
          right: '24px',
          maxWidth: '280px',
          background: 'rgba(10,10,10,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
        }}
        title="Click to expand economic calendar"
      >
        <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[10px] text-gray-500 leading-none mb-0.5">
            Upcoming · {nextHigh?.date}
          </p>
          <p className="text-[11px] text-gray-300 truncate leading-tight group-hover:text-white transition-colors">
            {nextHigh?.event}
          </p>
        </div>
        <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
      </button>
    )
  }

  // Expanded panel — anchored at bottom, grows upward
  return (
    <div
      className="fixed z-[9993] rounded-2xl transition-all duration-300"
      style={{
        bottom: '24px',
        right: '24px',
        width: '310px',
        background: 'rgba(10,10,10,0.95)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
        overflow: 'hidden',
      }}
    >
      {/* Content area — only shows when not minimized */}
      {!isMinimized && (
        <>
          {/* Region tabs + impact legend */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5">
            <button
              onClick={() => setTab('india')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                tab === 'india'
                  ? 'bg-orange-500/20 text-orange-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <IndianRupee className="w-2.5 h-2.5" />
              India
            </button>
            <button
              onClick={() => setTab('global')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                tab === 'global'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              <Globe className="w-2.5 h-2.5" />
              Global
            </button>

            {/* Impact legend */}
            <div className="ml-auto flex items-center gap-2">
              {(['high', 'medium', 'low'] as Impact[]).map(lvl => (
                <div key={lvl} className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${impactColors[lvl].dot}`} />
                  <span className="text-[8px] text-gray-600 capitalize">{lvl}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar events grouped by date — scrollable */}
          <div
            className="overflow-y-auto px-2 py-1"
            style={{ maxHeight: '340px', scrollbarWidth: 'thin', scrollbarColor: 'rgba(208,2,27,0.3) transparent' }}
          >
            {Object.entries(grouped).map(([date, events]) => (
              <div key={date} className="mb-2">
                {/* Date header */}
                <div className="flex items-center gap-2 px-2 py-1.5 sticky top-0" style={{ background: 'rgba(10,10,10,0.95)' }}>
                  <Calendar className="w-3 h-3 text-gray-500" />
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{date}</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* Events for this date */}
                {events.map(evt => {
                  const colors = impactColors[evt.impact]
                  const Icon = evt.icon
                  return (
                    <div
                      key={evt.id}
                      className="flex items-start gap-2.5 px-2 py-2 rounded-lg hover:bg-white/5 transition-colors group"
                    >
                      {/* Impact dot + icon */}
                      <div className={`w-7 h-7 rounded-lg ${colors.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                        <Icon className={`w-3 h-3 ${colors.text}`} />
                      </div>

                      {/* Event details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-gray-300 leading-snug group-hover:text-white transition-colors font-medium">
                          {evt.event}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-0.5 text-[9px] text-gray-500">
                            <Clock className="w-2.5 h-2.5" />
                            {evt.time}
                          </span>
                          {evt.impact === 'high' && (
                            <span className="flex items-center gap-0.5 text-[8px] text-red-400">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              High Impact
                            </span>
                          )}
                        </div>
                        {/* Previous / Forecast */}
                        {(evt.previous !== '-' || evt.forecast !== '-') && (
                          <div className="flex items-center gap-3 mt-1">
                            {evt.previous && evt.previous !== '-' && (
                              <span className="text-[9px] text-gray-600">
                                Prev: <span className="text-gray-400">{evt.previous}</span>
                              </span>
                            )}
                            {evt.forecast && evt.forecast !== '-' && (
                              <span className="text-[9px] text-gray-600">
                                Fcst: <span className="text-amber-400/80">{evt.forecast}</span>
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Impact indicator */}
                      <span className={`w-2 h-2 rounded-full ${colors.dot} shrink-0 mt-1.5`} />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Simulated note */}
          <div className="px-3 py-1.5 border-t border-white/5 text-center">
            <span className="text-[9px] text-gray-600">
              Simulated · Times in IST · {tab === 'india' ? '🇮🇳' : '🌍'} {filtered.length} events
            </span>
          </div>
        </>
      )}

      {/* Header bar — always at the bottom of the panel */}
      <div className="flex items-center justify-between px-3 py-2.5 border-t border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-500/20 flex items-center justify-center">
            <Calendar className="w-3 h-3 text-amber-400" />
          </div>
          <span className="text-white text-xs font-semibold">Economic Calendar</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title={isMinimized ? 'Expand' : 'Collapse'}
          >
            {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={() => { setIsOpen(false); setIsMinimized(false) }}
            className="w-6 h-6 rounded-md flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
