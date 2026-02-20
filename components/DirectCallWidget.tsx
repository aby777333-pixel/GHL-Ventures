'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Phone, X, PhoneCall, Clock, Wifi, WifiOff,
  Building2, MessageCircle, PhoneForwarded, Copy, Check,
  Monitor, Smartphone, PhoneIncoming, Send,
} from 'lucide-react'
import { BRAND } from '@/lib/constants'

interface PhoneLine {
  label: string
  number: string
  rawNumber: string
  telLink: string
  description: string
  icon: 'office' | 'mobile'
}

const PHONE_LINES: PhoneLine[] = [
  {
    label: 'GHL Main Office',
    number: BRAND.phone1,
    rawNumber: '+914428431043',
    telLink: 'tel:+914428431043',
    description: 'Landline \u2014 Chennai HQ',
    icon: 'office',
  },
  {
    label: 'GHL Direct Line',
    number: BRAND.phone2,
    rawNumber: '+917200255252',
    telLink: 'tel:+917200255252',
    description: 'Mobile \u2014 Sales & Support',
    icon: 'mobile',
  },
]

function isOfficeHours(): boolean {
  const now = new Date()
  const ist = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const day = ist.getDay()
  const hour = ist.getHours()
  const minute = ist.getMinutes()
  const timeVal = hour * 60 + minute
  return day >= 1 && day <= 5 && timeVal >= 570 && timeVal <= 1110
}

function detectMobile(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i.test(ua)
    || ('ontouchstart' in window && window.innerWidth < 768)
}

export default function DirectCallWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [online, setOnline] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [calling, setCalling] = useState<string | null>(null)
  const [showPulse, setShowPulse] = useState(true)
  const [callCount, setCallCount] = useState(0)
  const [copied, setCopied] = useState<string | null>(null)
  const [showCallback, setShowCallback] = useState(false)
  const [cbForm, setCbForm] = useState({ name: '', phone: '' })
  const [cbSent, setCbSent] = useState(false)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    setOnline(isOfficeHours())
    setIsMobile(detectMobile())
    const interval = setInterval(() => setOnline(isOfficeHours()), 60000)
    const pulseTimer = setTimeout(() => setShowPulse(false), 12000)
    return () => {
      clearInterval(interval)
      clearTimeout(pulseTimer)
    }
  }, [])

  // ── Mobile: direct tel: call ──
  const handleMobileCall = (line: PhoneLine) => {
    setCalling(line.label)
    setCallCount(prev => prev + 1)
    window.open(line.telLink, '_self')
    if (callTimerRef.current) clearTimeout(callTimerRef.current)
    callTimerRef.current = setTimeout(() => setCalling(null), 4000)
  }

  // ── Desktop: tel: link (opens Skype/Teams if registered) ──
  const handleDesktopCall = (line: PhoneLine) => {
    setCalling(line.label)
    setCallCount(prev => prev + 1)
    window.location.href = line.telLink
    if (callTimerRef.current) clearTimeout(callTimerRef.current)
    callTimerRef.current = setTimeout(() => setCalling(null), 4000)
  }

  // ── Desktop: WhatsApp call ──
  const handleWhatsAppCall = (line: PhoneLine) => {
    const num = line.rawNumber.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${num}`, '_blank')
  }

  // ── Copy number to clipboard ──
  const handleCopy = async (line: PhoneLine) => {
    try {
      await navigator.clipboard.writeText(line.rawNumber)
      setCopied(line.label)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      // Fallback
      const el = document.createElement('textarea')
      el.value = line.rawNumber
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(line.label)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  // ── Request callback ──
  const handleCallback = (e: React.FormEvent) => {
    e.preventDefault()
    if (!cbForm.name.trim() || !cbForm.phone.trim()) return
    const subject = encodeURIComponent('Callback Request from Website')
    const body = encodeURIComponent(
      `Hi GHL Team,\n\nA visitor has requested a callback.\n\nName: ${cbForm.name}\nPhone: ${cbForm.phone}\nTime: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}\n\nPlease call them back at your earliest convenience.`
    )
    window.open(`mailto:${BRAND.email}?subject=${subject}&body=${body}`, '_self')
    setCbSent(true)
    setTimeout(() => {
      setCbSent(false)
      setShowCallback(false)
      setCbForm({ name: '', phone: '' })
    }, 3000)
  }

  const handleOpen = () => {
    setIsOpen(prev => !prev)
    setShowPulse(false)
    setShowCallback(false)
  }

  if (!mounted) return null

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      <div className="fixed z-[9994] group" style={{ bottom: '28px', left: '30%', transform: 'translateX(-50%)' }}>
        {!isOpen && showPulse && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(34,197,94,0.25)' }} />
        )}
        {calling && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(34,197,94,0.4)' }} />
        )}
        <button
          onClick={handleOpen}
          className="relative flex items-center gap-2 px-3.5 py-2 rounded-full text-[11px] font-semibold transition-all duration-300 hover:scale-105"
          style={{
            background: isOpen ? 'rgba(34,197,94,0.9)' : calling ? 'rgba(34,197,94,0.7)' : 'rgba(10,10,10,0.88)',
            backdropFilter: 'blur(12px)',
            border: `1px solid ${isOpen ? 'rgba(34,197,94,0.4)' : calling ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: isOpen || calling ? '0 4px 20px rgba(34,197,94,0.3)' : '0 4px 20px rgba(0,0,0,0.3)',
          }}
          aria-label="Open Direct Call"
          title="Direct Call \u2014 Click to call GHL"
        >
          {calling ? (
            <PhoneForwarded className="w-3.5 h-3.5 text-white animate-pulse" />
          ) : (
            <PhoneCall className={`w-3.5 h-3.5 ${isOpen ? 'text-white' : 'text-green-400'} transition-colors`} />
          )}
          <span className={`${isOpen || calling ? 'text-white' : 'text-gray-300'} group-hover:text-white transition-colors`}>
            {calling ? 'Calling...' : isOpen ? 'Close' : 'Direct Call'}
          </span>
          {online && !isOpen && !calling && (
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* ── Call Panel ── */}
      <div
        className={`fixed z-[9995] transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ bottom: '64px', left: '30%', transform: 'translateX(-50%)', width: '340px', maxWidth: 'calc(100vw - 2rem)' }}
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
              <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                calling ? 'bg-green-500 animate-pulse' : 'bg-green-500/20'
              }`}>
                {calling ? <PhoneForwarded className="w-3.5 h-3.5 text-white" /> : <PhoneCall className="w-3.5 h-3.5 text-green-400" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs font-bold tracking-wide">
                    {calling ? 'CONNECTING...' : 'DIRECT CALL'}
                  </span>
                  {isMobile ? (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10 text-[8px] text-green-400 font-medium">
                      <Smartphone className="w-2.5 h-2.5" /> Mobile
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-[8px] text-blue-400 font-medium">
                      <Monitor className="w-2.5 h-2.5" /> Desktop
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {online ? (
                    <><Wifi className="w-2.5 h-2.5 text-green-400" /><span className="text-[9px] text-green-400 font-medium">Office Online</span></>
                  ) : (
                    <><WifiOff className="w-2.5 h-2.5 text-yellow-500" /><span className="text-[9px] text-yellow-500 font-medium">After Hours</span></>
                  )}
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Calling Banner */}
          {calling && (
            <div className="px-4 py-2.5 bg-green-500/10 border-b border-green-500/20">
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-green-300 text-[10px] font-medium">
                  {isMobile ? `Dialing ${calling}...` : `Opening calling app for ${calling}...`}
                </span>
              </div>
            </div>
          )}

          {/* ═══════ MOBILE VIEW — Simple tap-to-call ═══════ */}
          {isMobile && (
            <div className="p-3 space-y-2">
              {PHONE_LINES.map((line) => (
                <button
                  key={line.label}
                  onClick={() => handleMobileCall(line)}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 group/line ${
                    calling === line.label
                      ? 'bg-green-500/20 border border-green-500/30 scale-[1.02]'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 active:scale-[0.98]'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    calling === line.label ? 'bg-green-500 animate-pulse shadow-lg shadow-green-500/30' : 'bg-white/10'
                  }`}>
                    {line.icon === 'office'
                      ? <Building2 className={`w-4 h-4 ${calling === line.label ? 'text-white' : 'text-green-400'}`} />
                      : <Phone className={`w-4 h-4 ${calling === line.label ? 'text-white' : 'text-green-400'}`} />
                    }
                  </div>
                  <div className="flex-1 text-left">
                    <p className={`text-xs font-bold ${calling === line.label ? 'text-green-300' : 'text-white'}`}>{line.label}</p>
                    <p className="text-[11px] text-white/80 font-mono tracking-wide mt-0.5">{line.number}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">{line.description}</p>
                  </div>
                  <div className="shrink-0 w-9 h-9 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* ═══════ DESKTOP VIEW — Multiple calling options ═══════ */}
          {!isMobile && !showCallback && (
            <div className="p-3 space-y-3">
              {/* Tip banner */}
              <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/10">
                <p className="text-[10px] text-blue-300 leading-relaxed">
                  <Monitor className="w-3 h-3 inline mr-1 -mt-0.5" />
                  Desktop detected \u2014 choose how you&apos;d like to connect:
                </p>
              </div>

              {PHONE_LINES.map((line) => (
                <div key={line.label} className="rounded-xl bg-white/5 border border-white/5 overflow-hidden">
                  {/* Number header */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      {line.icon === 'office'
                        ? <Building2 className="w-3.5 h-3.5 text-green-400" />
                        : <Phone className="w-3.5 h-3.5 text-green-400" />
                      }
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-bold text-white">{line.label}</p>
                      <p className="text-[10px] text-white/70 font-mono">{line.number}</p>
                    </div>
                  </div>
                  {/* Action buttons row */}
                  <div className="flex border-t border-white/5">
                    {/* Open calling app */}
                    <button
                      onClick={() => handleDesktopCall(line)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[9px] font-medium text-green-400 hover:bg-green-500/10 transition-all border-r border-white/5"
                      title="Opens Skype, Teams, or your default calling app"
                    >
                      <PhoneForwarded className="w-3 h-3" />
                      <span>Call App</span>
                    </button>
                    {/* WhatsApp */}
                    <button
                      onClick={() => handleWhatsAppCall(line)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[9px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-all border-r border-white/5"
                      title="Open WhatsApp to call or message"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>
                    {/* Copy */}
                    <button
                      onClick={() => handleCopy(line)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[9px] font-medium text-gray-400 hover:bg-white/10 transition-all"
                      title="Copy number to clipboard"
                    >
                      {copied === line.label ? (
                        <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied!</span></>
                      ) : (
                        <><Copy className="w-3 h-3" /><span>Copy</span></>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ═══════ CALLBACK REQUEST FORM (desktop) ═══════ */}
          {!isMobile && showCallback && (
            <div className="p-4">
              {cbSent ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-3">
                    <Check className="w-6 h-6 text-green-400" />
                  </div>
                  <p className="text-white text-sm font-bold">Callback Requested!</p>
                  <p className="text-gray-400 text-[10px] mt-1">Our team will call you back shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleCallback} className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <PhoneIncoming className="w-4 h-4 text-green-400" />
                    <span className="text-white text-xs font-bold">Request a Callback</span>
                  </div>
                  <p className="text-gray-400 text-[10px] leading-relaxed">
                    Enter your details and our team will call you back during office hours.
                  </p>
                  <input
                    type="text"
                    required
                    placeholder="Your Name"
                    value={cbForm.name}
                    onChange={e => setCbForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-[11px] placeholder-gray-500 focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none"
                  />
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[10px] font-medium">+91</span>
                    <input
                      type="tel"
                      required
                      placeholder="Phone Number"
                      value={cbForm.phone}
                      onChange={e => setCbForm(p => ({ ...p, phone: e.target.value }))}
                      className="w-full pl-11 pr-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-[11px] placeholder-gray-500 focus:ring-1 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowCallback(false)}
                      className="flex-1 py-2.5 rounded-lg text-gray-400 text-[10px] font-medium bg-white/5 hover:bg-white/10 transition-all"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 rounded-lg text-white text-[10px] font-bold bg-green-600 hover:bg-green-700 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3 h-3" />
                      Request Call
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* Bottom Actions */}
          <div className="px-3 pb-2 border-t border-white/5 pt-2">
            <div className="flex gap-2">
              {/* WhatsApp fallback */}
              <a
                href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(BRAND.whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-600/15 text-emerald-400 text-[9px] font-medium transition-all"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp Chat</span>
              </a>
              {/* Request callback (desktop only) */}
              {!isMobile && (
                <button
                  onClick={() => setShowCallback(!showCallback)}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-[9px] font-medium transition-all ${
                    showCallback
                      ? 'bg-green-500/15 border-green-500/20 text-green-400'
                      : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <PhoneIncoming className="w-3 h-3" />
                  <span>Request Callback</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 pb-3 pt-1">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-[9px]">
              <Clock className="w-3 h-3" />
              <span>{BRAND.officeHours}</span>
            </div>
            {!online && (
              <p className="text-center text-[9px] text-yellow-500/70 mt-1">
                Office closed. Try WhatsApp for instant response.
              </p>
            )}
            {callCount > 0 && (
              <p className="text-center text-[8px] text-gray-600 mt-1">
                {callCount} call{callCount > 1 ? 's' : ''} initiated this session
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
