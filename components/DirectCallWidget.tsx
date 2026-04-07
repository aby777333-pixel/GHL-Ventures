'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Phone, X, PhoneCall, Clock, Wifi, WifiOff,
  Building2, MessageCircle, PhoneForwarded, Copy, Check,
  Monitor, Smartphone, PhoneIncoming, Send,
  Download, ExternalLink, ArrowLeft, RefreshCw,
  Plug, Globe, Shield, Zap,
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

const CALLING_APPS = [
  {
    name: 'Skype',
    desc: 'Free calling app by Microsoft',
    color: 'bg-sky-500/15 border-sky-500/20',
    textColor: 'text-sky-400',
    hoverBg: 'hover:bg-sky-500/25',
    url: 'https://www.skype.com/en/get-skype/',
    icon: '\uD83D\uDD35',
  },
  {
    name: 'Microsoft Teams',
    desc: 'Free for personal use',
    color: 'bg-indigo-500/15 border-indigo-500/20',
    textColor: 'text-indigo-400',
    hoverBg: 'hover:bg-indigo-500/25',
    url: 'https://www.microsoft.com/en-in/microsoft-teams/download-app',
    icon: '\uD83D\uDFE3',
  },
  {
    name: 'Zoom',
    desc: 'Free video & phone calling',
    color: 'bg-blue-500/15 border-blue-500/20',
    textColor: 'text-blue-400',
    hoverBg: 'hover:bg-blue-500/25',
    url: 'https://zoom.us/download',
    icon: '\uD83D\uDD37',
  },
  {
    name: 'WhatsApp Desktop',
    desc: 'Call via WhatsApp on PC',
    color: 'bg-emerald-500/15 border-emerald-500/20',
    textColor: 'text-emerald-400',
    hoverBg: 'hover:bg-emerald-500/25',
    url: 'https://www.whatsapp.com/download',
    icon: '\uD83D\uDFE2',
  },
]

// ─── Click-to-Call / Web Calling Solutions ───
interface CallingSolution {
  name: string
  desc: string
  color: string
  textColor: string
  hoverBg: string
  url: string
  icon: string
  status: 'not_installed' | 'installed' | 'active'
  type: 'click-to-call' | 'webrtc' | 'sdk'
}

const WEB_CALLING_SOLUTIONS: CallingSolution[] = [
  {
    name: 'Zadarma Click-to-Call',
    desc: 'Free browser-based click-to-call widget with callback & CRM integration',
    color: 'bg-orange-500/15 border-orange-500/20',
    textColor: 'text-orange-400',
    hoverBg: 'hover:bg-orange-500/25',
    url: 'https://zadarma.com/en/services/click-to-call/',
    icon: '\uD83D\uDFE0',
    status: 'not_installed',
    type: 'click-to-call',
  },
  {
    name: 'Twilio Voice JS SDK',
    desc: 'Programmable Voice SDK for WebRTC calls directly in the browser',
    color: 'bg-red-500/15 border-red-500/20',
    textColor: 'text-red-400',
    hoverBg: 'hover:bg-red-500/25',
    url: 'https://www.twilio.com/docs/voice/sdks/javascript',
    icon: '\uD83D\uDD34',
    status: 'not_installed',
    type: 'sdk',
  },
  {
    name: 'CallPage Click-to-Call',
    desc: 'Automated callback widget — connects visitors with your team in 28 seconds',
    color: 'bg-teal-500/15 border-teal-500/20',
    textColor: 'text-teal-400',
    hoverBg: 'hover:bg-teal-500/25',
    url: 'https://www.callpage.io/',
    icon: '\uD83D\uDFE2',
    status: 'not_installed',
    type: 'click-to-call',
  },
  {
    name: 'Web-Phone.org Free SDK',
    desc: 'Free open-source WebRTC softphone SDK for browser-based SIP calling',
    color: 'bg-violet-500/15 border-violet-500/20',
    textColor: 'text-violet-400',
    hoverBg: 'hover:bg-violet-500/25',
    url: 'https://www.web-phone.org/',
    icon: '\uD83D\uDFE3',
    status: 'not_installed',
    type: 'sdk',
  },
  {
    name: 'Elfsight Call Widget',
    desc: 'No-code call button widget with customizable design and click-to-call',
    color: 'bg-amber-500/15 border-amber-500/20',
    textColor: 'text-amber-400',
    hoverBg: 'hover:bg-amber-500/25',
    url: 'https://elfsight.com/callback-widget/',
    icon: '\uD83D\uDFE1',
    status: 'not_installed',
    type: 'click-to-call',
  },
  {
    name: 'Wildix Kite WebRTC',
    desc: 'Enterprise WebRTC platform for browser-based voice, video & chat',
    color: 'bg-cyan-500/15 border-cyan-500/20',
    textColor: 'text-cyan-400',
    hoverBg: 'hover:bg-cyan-500/25',
    url: 'https://www.wildix.com/kite/',
    icon: '\uD83D\uDD35',
    status: 'not_installed',
    type: 'webrtc',
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
  const [showDownloads, setShowDownloads] = useState(false)
  const [showSolutions, setShowSolutions] = useState(false)
  const [activeCallingApp, setActiveCallingApp] = useState<string | null>(null)
  const [pendingCallLine, setPendingCallLine] = useState<PhoneLine | null>(null)
  const [cbForm, setCbForm] = useState({ name: '', phone: '' })
  const [cbSent, setCbSent] = useState(false)
  const callTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    setMounted(true)
    setOnline(isOfficeHours())
    setIsMobile(detectMobile())
    const interval = setInterval(() => setOnline(isOfficeHours()), 60000)
    const pulseTimer = setTimeout(() => setShowPulse(false), 12000)

    // Listen for voice widget "download apps" command
    const handleShowDownloads = () => {
      setIsOpen(true)
      setShowDownloads(true)
      setShowCallback(false)
      setShowSolutions(false)
    }
    window.addEventListener('ghl-show-downloads', handleShowDownloads)

    // Listen for voice widget "calling solutions" command
    const handleShowSolutions = () => {
      setIsOpen(true)
      setShowSolutions(true)
      setShowCallback(false)
      setShowDownloads(false)
    }
    window.addEventListener('ghl-show-solutions', handleShowSolutions)

    // Listen for ARIA Connect "Call Us" — open in default phone view
    const handleOpenDirectCall = () => {
      setIsOpen(true)
      setShowSolutions(false)
      setShowCallback(false)
      setShowDownloads(false)
    }
    window.addEventListener('ghl-open-direct-call', handleOpenDirectCall)

    // Detect which calling app is currently active/installed (browser-based check)
    const detectCallingApp = () => {
      // Check if tel: protocol handler is registered (indicates Skype/Teams/etc.)
      const hasProtocol = 'registerProtocolHandler' in navigator
      // Check for common calling extensions via user agent or installed PWAs
      const ua = navigator.userAgent || ''
      if (ua.includes('Teams')) setActiveCallingApp('Microsoft Teams')
      else if (ua.includes('Skype')) setActiveCallingApp('Skype')
      else setActiveCallingApp(null) // No specific app detected
    }
    detectCallingApp()

    return () => {
      clearInterval(interval)
      clearTimeout(pulseTimer)
      window.removeEventListener('ghl-show-downloads', handleShowDownloads)
      window.removeEventListener('ghl-show-solutions', handleShowSolutions)
      window.removeEventListener('ghl-open-direct-call', handleOpenDirectCall)
    }
  }, [])

  // Mobile: direct tel: call
  const handleMobileCall = (line: PhoneLine) => {
    setCalling(line.label)
    setCallCount(prev => prev + 1)
    window.open(line.telLink, '_self')
    if (callTimerRef.current) clearTimeout(callTimerRef.current)
    callTimerRef.current = setTimeout(() => setCalling(null), 4000)
  }

  // Desktop: tel: link (opens Skype/Teams if registered) then show download options
  const handleDesktopCall = (line: PhoneLine) => {
    setCalling(line.label)
    setCallCount(prev => prev + 1)
    setPendingCallLine(line)
    window.location.href = line.telLink
    if (callTimerRef.current) clearTimeout(callTimerRef.current)
    callTimerRef.current = setTimeout(() => {
      setCalling(null)
      setShowDownloads(true)
    }, 3000)
  }

  // Desktop: WhatsApp call
  const handleWhatsAppCall = (line: PhoneLine) => {
    const num = line.rawNumber.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${num}`, '_blank')
  }

  // Copy number to clipboard
  const handleCopy = async (line: PhoneLine) => {
    try {
      await navigator.clipboard.writeText(line.rawNumber)
      setCopied(line.label)
      setTimeout(() => setCopied(null), 2000)
    } catch {
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

  // Request callback
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
    setShowDownloads(false)
    setShowSolutions(false)
    setPendingCallLine(null)
  }

  if (!mounted) return null

  return (
    <div id="ghl-direct-widget" data-ghl-widget="direct" style={{ pointerEvents: 'none' }}>
      {/* Floating Trigger Button */}
      <div className="fixed z-[9994] group" style={{ bottom: '28px', left: '30%', transform: 'translateX(-50%)', pointerEvents: 'auto' }}>
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

      {/* Call Panel */}
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
                    {calling ? 'CONNECTING...' : showSolutions ? 'WEB CALLING SOLUTIONS' : showDownloads ? 'GET CALLING APP' : 'DIRECT CALL'}
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
                  {activeCallingApp && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-[8px] text-emerald-400 font-medium">
                      <Zap className="w-2.5 h-2.5" /> {activeCallingApp}
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

          {/* MOBILE VIEW */}
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

          {/* DESKTOP VIEW — Phone numbers + calling options */}
          {!isMobile && !showCallback && !showDownloads && !showSolutions && (
            <div className="p-3 space-y-3">
              <div className="px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/10">
                <p className="text-[10px] text-blue-300 leading-relaxed">
                  <Monitor className="w-3 h-3 inline mr-1 -mt-0.5" />
                  Desktop detected &mdash; choose how you&apos;d like to connect:
                </p>
              </div>

              {PHONE_LINES.map((line) => (
                <div key={line.label} className="rounded-xl bg-white/5 border border-white/5 overflow-hidden">
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
                  <div className="flex border-t border-white/5">
                    <button
                      onClick={() => handleDesktopCall(line)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[9px] font-medium text-green-400 hover:bg-green-500/10 transition-all border-r border-white/5"
                      title="Opens Skype, Teams, or your default calling app"
                    >
                      <PhoneForwarded className="w-3 h-3" />
                      <span>Call App</span>
                    </button>
                    <button
                      onClick={() => handleWhatsAppCall(line)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2.5 text-[9px] font-medium text-emerald-400 hover:bg-emerald-500/10 transition-all border-r border-white/5"
                      title="Open WhatsApp to call or message"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>
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

              {/* Link to download calling apps */}
              <button
                onClick={() => setShowDownloads(true)}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] text-gray-400 hover:text-white font-medium transition-all"
              >
                <Download className="w-3 h-3" />
                <span>No calling app? Download one free</span>
              </button>

              {/* Link to web calling solutions */}
              <button
                onClick={() => { setShowSolutions(true); setShowDownloads(false) }}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/15 text-[9px] text-indigo-400 hover:text-indigo-300 font-medium transition-all"
              >
                <Plug className="w-3 h-3" />
                <span>Web Calling Solutions &amp; Integrations</span>
              </button>
            </div>
          )}

          {/* DOWNLOAD CALLING APPS + WEB SOLUTIONS PANEL (desktop) */}
          {!isMobile && showDownloads && !showCallback && !showSolutions && (
            <div className="p-3 space-y-2.5">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => { setShowDownloads(false); setPendingCallLine(null) }}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <Download className="w-4 h-4 text-blue-400" />
                <span className="text-white text-xs font-bold">Calling Apps &amp; Web Solutions</span>
              </div>

              <div className="max-h-[340px] overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.3) transparent' }}>
                {/* ── Section: Desktop Calling Apps ── */}
                <div className="flex items-center gap-1.5 px-1">
                  <Monitor className="w-3 h-3 text-blue-400" />
                  <span className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Desktop Apps</span>
                  <div className="flex-1 h-px bg-blue-500/15" />
                </div>

                {CALLING_APPS.map(app => (
                  <a
                    key={app.name}
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${app.color} ${app.hoverBg}`}
                  >
                    <span className="text-base shrink-0">{app.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-bold text-white">{app.name}</p>
                        <span className="px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider bg-blue-500/15 text-blue-400">App</span>
                      </div>
                      <p className="text-[9px] text-gray-400">{app.desc}</p>
                    </div>
                    <div className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-[8px] font-medium ${app.textColor}`}>
                      <ExternalLink className="w-2.5 h-2.5" />
                      Download
                    </div>
                  </a>
                ))}

                {/* ── Section: Web Calling Solutions ── */}
                <div className="flex items-center gap-1.5 px-1 pt-1.5">
                  <Globe className="w-3 h-3 text-indigo-400" />
                  <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">Web Calling Solutions</span>
                  <div className="flex-1 h-px bg-indigo-500/15" />
                </div>

                {WEB_CALLING_SOLUTIONS.map(solution => (
                  <a
                    key={solution.name}
                    href={solution.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${solution.color} ${solution.hoverBg}`}
                  >
                    <span className="text-base shrink-0">{solution.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[11px] font-bold text-white">{solution.name}</p>
                        <span className={`px-1 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider ${
                          solution.type === 'click-to-call' ? 'bg-green-500/15 text-green-400' :
                          solution.type === 'webrtc' ? 'bg-blue-500/15 text-blue-400' :
                          'bg-purple-500/15 text-purple-400'
                        }`}>
                          {solution.type === 'click-to-call' ? 'Click-to-Call' : solution.type === 'webrtc' ? 'WebRTC' : 'SDK'}
                        </span>
                      </div>
                      <p className="text-[9px] text-gray-400 mt-0.5">{solution.desc}</p>
                    </div>
                    <div className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded-md bg-white/5 text-[8px] font-medium ${solution.textColor}`}>
                      <ExternalLink className="w-2.5 h-2.5" />
                      Setup
                    </div>
                  </a>
                ))}
              </div>

              {/* Try again after downloading */}
              {pendingCallLine && (
                <button
                  onClick={() => {
                    setShowDownloads(false)
                    handleDesktopCall(pendingCallLine)
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 mt-1 rounded-lg bg-green-600/20 hover:bg-green-600/30 border border-green-500/20 text-green-400 text-[10px] font-bold transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Installed? Try calling {pendingCallLine.label} again</span>
                </button>
              )}

              <p className="text-[8px] text-gray-600 text-center px-2 leading-relaxed">
                Desktop apps connect via tel: protocol. Web solutions run in your browser &mdash; no install needed.
              </p>
            </div>
          )}

          {/* WEB CALLING SOLUTIONS PANEL (desktop) */}
          {!isMobile && showSolutions && !showCallback && !showDownloads && (
            <div className="p-3 space-y-2.5">
              <div className="flex items-center gap-2 mb-1">
                <button
                  onClick={() => setShowSolutions(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <Plug className="w-4 h-4 text-indigo-400" />
                <span className="text-white text-xs font-bold">Web Calling Solutions</span>
              </div>

              <p className="text-gray-400 text-[10px] leading-relaxed px-1">
                Click-to-call &amp; WebRTC solutions for browser-based calling integration:
              </p>

              {/* Active calling app indicator */}
              <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
                <div className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                  <div>
                    <p className="text-[10px] text-emerald-300 font-medium">
                      Active Browser Calling: {activeCallingApp || 'Native tel: handler (default)'}
                    </p>
                    <p className="text-[8px] text-emerald-400/60 mt-0.5">
                      {activeCallingApp
                        ? `${activeCallingApp} is handling click-to-call on this device`
                        : 'Using system default tel: protocol handler for calls'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Solutions list */}
              <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.3) transparent' }}>
                {WEB_CALLING_SOLUTIONS.map(solution => (
                  <div
                    key={solution.name}
                    className={`rounded-xl border overflow-hidden transition-all ${solution.color}`}
                  >
                    <div className="flex items-start gap-3 px-3 py-2.5">
                      <span className="text-base shrink-0 mt-0.5">{solution.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-[11px] font-bold text-white">{solution.name}</p>
                          <span className={`px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wider ${
                            solution.type === 'click-to-call' ? 'bg-green-500/15 text-green-400' :
                            solution.type === 'webrtc' ? 'bg-blue-500/15 text-blue-400' :
                            'bg-purple-500/15 text-purple-400'
                          }`}>
                            {solution.type === 'click-to-call' ? 'Click-to-Call' : solution.type === 'webrtc' ? 'WebRTC' : 'SDK'}
                          </span>
                        </div>
                        <p className="text-[9px] text-gray-400 mt-0.5 leading-relaxed">{solution.desc}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          {/* Integration status */}
                          <span className={`flex items-center gap-1 text-[8px] font-medium ${
                            solution.status === 'active' ? 'text-green-400' :
                            solution.status === 'installed' ? 'text-yellow-400' :
                            'text-gray-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              solution.status === 'active' ? 'bg-green-400 animate-pulse' :
                              solution.status === 'installed' ? 'bg-yellow-400' :
                              'bg-gray-600'
                            }`} />
                            {solution.status === 'active' ? 'Active' :
                             solution.status === 'installed' ? 'Installed' :
                             'Not Installed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Action buttons */}
                    <div className="flex border-t border-white/5">
                      <a
                        href={solution.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 text-[9px] font-medium ${solution.textColor} hover:bg-white/5 transition-all`}
                      >
                        {solution.status === 'not_installed' ? (
                          <><Download className="w-3 h-3" /><span>Download / Setup</span></>
                        ) : (
                          <><ExternalLink className="w-3 h-3" /><span>Open Dashboard</span></>
                        )}
                      </a>
                      <a
                        href={solution.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 text-[9px] font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-all border-l border-white/5"
                      >
                        <Globe className="w-3 h-3" />
                        <span>Docs</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[8px] text-gray-600 text-center px-2 leading-relaxed">
                These solutions enable browser-based calling without requiring users to install desktop apps.
              </p>
            </div>
          )}

          {/* CALLBACK REQUEST FORM (desktop) */}
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
              <a
                href={`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(BRAND.whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-600/15 text-emerald-400 text-[9px] font-medium transition-all"
              >
                <MessageCircle className="w-3 h-3" />
                <span>WhatsApp Chat</span>
              </a>
              {!isMobile && (
                <button
                  onClick={() => { setShowCallback(!showCallback); setShowDownloads(false) }}
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
    </div>
  )
}
