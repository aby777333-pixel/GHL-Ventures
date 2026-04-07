'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Video, VideoOff, Mic, MicOff, PhoneOff, X, Phone,
  Clock, User, Headphones, Sparkles,
  Subtitles, FileText
} from 'lucide-react'
import LanguageSelector from '@/components/video/LanguageSelector'
import CaptionsOverlay from '@/components/video/CaptionsOverlay'
import TranscriptPanel from '@/components/video/TranscriptPanel'
import type { LanguageCode } from '@/lib/translations'

type CallState = 'idle' | 'connecting' | 'active'

export default function VideoCallWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [callState, setCallState] = useState<CallState>('idle')
  const [showBadge, setShowBadge] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [callDuration, setCallDuration] = useState(0)
  const [form, setForm] = useState({ name: '', phone: '', topic: '' })
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Multilingual state
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('en')
  const [showCaptions, setShowCaptions] = useState(true)
  const [showTranscript, setShowTranscript] = useState(false)
  const [captionIndex, setCaptionIndex] = useState(0)

  // Load saved language preference
  useEffect(() => {
    const saved = localStorage.getItem('ghl-video-lang') as LanguageCode | null
    if (saved) setSelectedLanguage(saved)
  }, [])

  const handleLanguageChange = (code: LanguageCode) => {
    setSelectedLanguage(code)
    localStorage.setItem('ghl-video-lang', code)
  }

  // Track caption index for transcript sync
  useEffect(() => {
    if (callState !== 'active') {
      setCaptionIndex(0)
      return
    }
    const interval = setInterval(() => {
      setCaptionIndex(prev => prev + 1)
    }, 4000)
    return () => clearInterval(interval)
  }, [callState])

  // Listen for external open events (from ARIA chatbot, Voice widget, etc.)
  useEffect(() => {
    const handleExternalOpen = () => {
      // Prevent duplicate: if already open, just bring to focus
      if (isOpen) {
        // Widget is already open — scroll into view / pulse effect
        const panel = document.querySelector('[aria-label="Close"]')?.closest('.fixed.z-\\[9997\\]') as HTMLElement
        if (panel) {
          panel.style.animation = 'none'
          panel.offsetHeight // force reflow
          panel.style.animation = 'ghlPulseHighlight 0.6s ease'
        }
        return
      }
      setIsOpen(true)
      setShowBadge(false)
    }
    window.addEventListener('ghl-open-video-call', handleExternalOpen)
    return () => window.removeEventListener('ghl-open-video-call', handleExternalOpen)
  }, [isOpen])

  // Show notification badge after 30s
  useEffect(() => {
    const t = setTimeout(() => {
      if (!isOpen) setShowBadge(true)
    }, 30000)
    return () => clearTimeout(t)
  }, [isOpen])

  // Call duration timer
  useEffect(() => {
    if (callState === 'active') {
      timerRef.current = setInterval(() => {
        setCallDuration(d => d + 1)
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
      setCallDuration(0)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [callState])

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const handleStartCall = (e: React.FormEvent) => {
    e.preventDefault()
    setCallState('connecting')
    setTimeout(() => setCallState('active'), 3000)
  }

  const handleEndCall = () => {
    setCallState('idle')
    setIsMuted(false)
    setIsCameraOff(false)
    setShowTranscript(false)
    setCaptionIndex(0)
  }

  const handleOpen = () => {
    setIsOpen(true)
    setShowBadge(false)
  }

  const panelWidth = showTranscript && callState === 'active' ? 'w-[650px]' : 'w-[370px]'

  return (
    <div id="ghl-video-widget" data-ghl-widget="video" style={{ pointerEvents: 'none' }}>
      {/* ── Floating Trigger Button — bottom center ── */}
      <div className="fixed z-[9996] group" style={{ bottom: '24px', left: '50%', transform: 'translateX(-50%)', pointerEvents: 'auto' }}>
        {/* Pulse rings */}
        {!isOpen && (
          <>
            <span className="absolute inset-0 rounded-full bg-indigo-500/30 animate-ping opacity-20" />
            <span className="absolute inset-0 rounded-full bg-indigo-500/20 animate-pulse-ring" />
          </>
        )}
        <button
          onClick={handleOpen}
          className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform duration-300 hover:scale-110"
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #6366F1 100%)',
          }}
          aria-label="Open Sales & Support Video Call"
        >
          <Headphones className="w-6 h-6 text-white" />
          {/* Notification badge */}
          {showBadge && !isOpen && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-brand-red rounded-full flex items-center justify-center text-white text-[10px] font-bold animate-bounce">
              1
            </span>
          )}
        </button>

        {/* Tooltip — above button */}
        {!isOpen && (
          <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap">
            <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-xl">
              Sales &amp; Support Call
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        )}
      </div>

      {/* ── Call Panel ── */}
      {isOpen && (
        <div
          className={`fixed z-[9997] ${panelWidth} max-w-[calc(100vw-3rem)] rounded-2xl shadow-2xl overflow-hidden transition-all duration-500`}
          style={{
            bottom: '96px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(10, 10, 10, 0.95)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
              >
                <Video className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-white text-sm font-bold">Sales &amp; Support</h3>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-400 text-[10px] font-medium">Team Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { setIsOpen(false); handleEndCall() }}
              className="text-gray-500 hover:text-white transition-colors p-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body — flex row for transcript */}
          <div className={`flex ${callState === 'active' && showTranscript ? 'h-[420px]' : ''}`}>
            {/* Main content */}
            <div className="flex-1 p-5">
              {callState === 'idle' && (
                <div>
                  <div className="text-center mb-5">
                    <Sparkles className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                    <h4 className="text-white text-base font-bold mb-1">Connect with Our Team</h4>
                    <p className="text-gray-400 text-xs leading-relaxed">
                      Get personalized guidance on AIF investments, fund structure, and onboarding
                    </p>
                  </div>

                  <form onSubmit={handleStartCall} className="space-y-3">
                    <input
                      type="text"
                      required
                      placeholder="Your Name"
                      value={form.name}
                      onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none"
                    />
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-medium">+91</span>
                      <input
                        type="tel"
                        required
                        placeholder="Phone Number"
                        value={form.phone}
                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                        className="w-full pl-12 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <select
                      required
                      value={form.topic}
                      onChange={e => setForm(p => ({ ...p, topic: e.target.value }))}
                      className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:ring-1 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none"
                    >
                      <option value="" className="bg-gray-900">Select Topic</option>
                      <option value="general" className="bg-gray-900">General Inquiry</option>
                      <option value="fund" className="bg-gray-900">Fund Information</option>
                      <option value="onboard" className="bg-gray-900">Investment Onboarding</option>
                      <option value="support" className="bg-gray-900">Technical Support</option>
                    </select>

                    {/* Language Selector in idle form */}
                    <LanguageSelector
                      selectedLanguage={selectedLanguage}
                      onLanguageChange={handleLanguageChange}
                    />

                    <button
                      type="submit"
                      className="w-full py-3 rounded-lg text-white text-sm font-bold flex items-center justify-center space-x-2 transition-all duration-300 hover:opacity-90 hover:shadow-lg"
                      style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Video Call</span>
                    </button>
                  </form>

                  <div className="mt-4 text-center">
                    <p className="text-gray-500 text-[10px] mb-2">Or call us directly</p>
                    <a
                      href="tel:+917200255252"
                      className="inline-flex items-center space-x-1.5 text-indigo-400 text-xs font-medium hover:text-indigo-300 transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>+91 7200 255 252</span>
                    </a>
                  </div>

                  <div className="mt-3 flex items-center justify-center space-x-1.5 text-gray-600 text-[10px]">
                    <Clock className="w-3 h-3" />
                    <span>Mon-Fri, 9:30 AM - 6:30 PM IST</span>
                  </div>
                </div>
              )}

              {callState === 'connecting' && (
                <div className="text-center py-8">
                  {/* Simulated video area */}
                  <div className="w-full aspect-video rounded-xl mb-5 flex items-center justify-center overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
                  >
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-3 animate-pulse">
                        <User className="w-8 h-8 text-indigo-400" />
                      </div>
                      <p className="text-white/60 text-xs">Connecting</p>
                      <div className="flex items-center justify-center space-x-1 mt-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-400 text-sm">Connecting you with a GHL advisor...</p>
                </div>
              )}

              {callState === 'active' && (
                <div>
                  {/* Video area with captions */}
                  <div className="w-full aspect-video rounded-xl mb-4 relative overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' }}
                  >
                    {/* Advisor "video" */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-2 shadow-lg">
                          <span className="text-white text-2xl font-bold">GHL</span>
                        </div>
                        <p className="text-white text-sm font-semibold">GHL Support Team</p>
                        <p className="text-green-400 text-[10px] mt-0.5">Connected</p>
                      </div>
                    </div>

                    {/* Self preview (small) */}
                    <div className="absolute bottom-3 right-3 w-20 h-16 rounded-lg bg-gray-800 border border-white/10 flex items-center justify-center overflow-hidden z-10">
                      {isCameraOff ? (
                        <VideoOff className="w-4 h-4 text-gray-500" />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>

                    {/* Duration badge */}
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-1.5 z-10">
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-white text-[11px] font-mono">{formatDuration(callDuration)}</span>
                    </div>

                    {/* Captions overlay */}
                    {showCaptions && (
                      <CaptionsOverlay
                        isActive={callState === 'active'}
                        languageCode={selectedLanguage}
                      />
                    )}

                    {/* AI Translation watermark */}
                    <div className="absolute top-3 right-3 z-10">
                      <span className="text-[8px] text-white/30 bg-black/30 px-1.5 py-0.5 rounded">
                        🌐 AI Translation
                      </span>
                    </div>
                  </div>

                  {/* Call controls — expanded with CC, Transcript, Language */}
                  <div className="flex items-center justify-center space-x-2.5 mb-3">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      aria-label={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => setIsCameraOff(!isCameraOff)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isCameraOff ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      aria-label={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
                    >
                      {isCameraOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
                    </button>

                    {/* CC toggle */}
                    <button
                      onClick={() => setShowCaptions(!showCaptions)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        showCaptions ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      aria-label={showCaptions ? 'Hide captions' : 'Show captions'}
                      title="Captions"
                    >
                      <Subtitles className="w-4 h-4" />
                    </button>

                    {/* Transcript toggle */}
                    <button
                      onClick={() => setShowTranscript(!showTranscript)}
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        showTranscript ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/10 text-white hover:bg-white/20'
                      }`}
                      aria-label={showTranscript ? 'Hide transcript' : 'Show transcript'}
                      title="Transcript"
                    >
                      <FileText className="w-4 h-4" />
                    </button>

                    {/* Language selector (compact) */}
                    <LanguageSelector
                      selectedLanguage={selectedLanguage}
                      onLanguageChange={handleLanguageChange}
                      compact
                    />

                    {/* End call */}
                    <button
                      onClick={handleEndCall}
                      className="w-12 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-all text-white shadow-lg shadow-red-500/30"
                      aria-label="End call"
                    >
                      <PhoneOff className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Demo note */}
                  <p className="text-gray-600 text-[9px] text-center leading-relaxed">
                    Demo mode — In production, connects to your video conferencing backend
                  </p>
                </div>
              )}
            </div>

            {/* Transcript Panel (right side) */}
            {callState === 'active' && showTranscript && (
              <TranscriptPanel
                isOpen={showTranscript}
                languageCode={selectedLanguage}
                currentIndex={captionIndex}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
