'use client'

import { useState, useEffect, useRef } from 'react'
import { Phone, X, PhoneCall, Clock, ChevronRight, Wifi, WifiOff, Building2 } from 'lucide-react'
import { BRAND } from '@/lib/constants'

interface PhoneLine {
  label: string
  number: string
  telLink: string
  description: string
  icon: 'office' | 'mobile'
}

const PHONE_LINES: PhoneLine[] = [
  {
    label: 'GHL Main Office',
    number: BRAND.phone1,
    telLink: `tel:+914428431043`,
    description: 'Landline \u2014 Chennai HQ',
    icon: 'office',
  },
  {
    label: 'GHL Direct Line',
    number: BRAND.phone2,
    telLink: `tel:+917200255252`,
    description: 'Mobile \u2014 Sales & Support',
    icon: 'mobile',
  },
]

function isOfficeHours(): boolean {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = ist.getDay() // 0=Sun, 6=Sat
  const hour = ist.getHours()
  const minute = ist.getMinutes()
  const timeVal = hour * 60 + minute
  // Mon-Fri 9:30 AM - 6:30 PM IST
  return day >= 1 && day <= 5 && timeVal >= 570 && timeVal <= 1110
}

export default function DirectCallWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [online, setOnline] = useState(false)
  const [calling, setCalling] = useState<string | null>(null)
  const [showPulse, setShowPulse] = useState(true)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    setOnline(isOfficeHours())
    // Check office hours every minute
    const interval = setInterval(() => setOnline(isOfficeHours()), 60000)
    const pulseTimer = setTimeout(() => setShowPulse(false), 12000)
    return () => {
      clearInterval(interval)
      clearTimeout(pulseTimer)
    }
  }, [])

  const handleCall = (line: PhoneLine) => {
    setCalling(line.label)
    // Open the phone dialer
    window.open(line.telLink, '_self')
    // Reset calling state after 3s
    if (callTimerRef.current) clearTimeout(callTimerRef.current)
    callTimerRef.current = setTimeout(() => setCalling(null), 3000)
  }

  const handleOpen = () => {
    setIsOpen(true)
    setShowPulse(false)
  }

  if (!mounted) return null

  return (
    <>
      {/* ── Floating Trigger Button — bottom right ── */}
      <div className="fixed z-[9994] group" style={{ bottom: '28px', right: '16px' }}>
        {/* Pulse ring */}
        {!isOpen && showPulse && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(34,197,94,0.25)' }} />
        )}
        <button
          onClick={handleOpen}
          className="relative flex items-center gap-2 px-3.5 py-2 rounded-full text-[11px] font-semibold transition-all duration-300 hover:scale-105"
          style={{
            background: isOpen ? 'rgba(34,197,94,0.9)' : calling ? 'rgba(34,197,94,0.7)' : 'rgba(10,10,10,0.88)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isOpen ? 'rgba(34,197,94,0.4)' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: isOpen ? '0 4px 20px rgba(34,197,94,0.3)' : '0 4px 20px rgba(0,0,0,0.3)',
          }}
          aria-label="Open Direct Call"
          title="Direct Call \u2014 Click to call GHL"
        >
          <PhoneCall className={`w-3.5 h-3.5 ${isOpen ? 'text-white' : 'text-green-400'} transition-colors`} />
          <span className={`${isOpen ? 'text-white' : 'text-gray-300'} group-hover:text-white transition-colors`}>
            {calling ? 'Calling...' : isOpen ? 'Close' : 'Direct Call'}
          </span>
          {/* Online indicator */}
          {online && !isOpen && (
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* ── Call Panel ── */}
      <div
        className={`fixed z-[9995] transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ bottom: '64px', right: '16px', width: '320px' }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(10,10,10,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center">
                <PhoneCall className="w-3.5 h-3.5 text-green-400" />
              </div>
              <div>
                <span className="text-white text-xs font-bold tracking-wide">DIRECT CALL</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {online ? (
                    <>
                      <Wifi className="w-2.5 h-2.5 text-green-400" />
                      <span className="text-[9px] text-green-400 font-medium">Office Online</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-2.5 h-2.5 text-yellow-500" />
                      <span className="text-[9px] text-yellow-500 font-medium">After Hours</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Phone Lines */}
          <div className="p-3 space-y-2">
            {PHONE_LINES.map((line) => (
              <button
                key={line.label}
                onClick={() => handleCall(line)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group/line ${
                  calling === line.label
                    ? 'bg-green-500/20 border border-green-500/30'
                    : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  calling === line.label ? 'bg-green-500 animate-pulse' : 'bg-white/10 group-hover/line:bg-green-500/20'
                } transition-all`}>
                  {line.icon === 'office' ? (
                    <Building2 className={`w-4 h-4 ${calling === line.label ? 'text-white' : 'text-green-400'}`} />
                  ) : (
                    <Phone className={`w-4 h-4 ${calling === line.label ? 'text-white' : 'text-green-400'}`} />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className={`text-xs font-bold ${calling === line.label ? 'text-green-300' : 'text-white'}`}>
                    {line.label}
                  </p>
                  <p className="text-[11px] text-white/80 font-mono tracking-wide mt-0.5">
                    {line.number}
                  </p>
                  <p className="text-[9px] text-gray-500 mt-0.5">{line.description}</p>
                </div>
                <ChevronRight className={`w-4 h-4 ${
                  calling === line.label ? 'text-green-400' : 'text-gray-600 group-hover/line:text-green-400'
                } transition-colors`} />
              </button>
            ))}
          </div>

          {/* Footer info */}
          <div className="px-4 pb-3 pt-1 border-t border-white/5">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-[9px]">
              <Clock className="w-3 h-3" />
              <span>{BRAND.officeHours}</span>
            </div>
            {!online && (
              <p className="text-center text-[9px] text-yellow-500/70 mt-1.5">
                Office is closed. You can still reach us on WhatsApp.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
