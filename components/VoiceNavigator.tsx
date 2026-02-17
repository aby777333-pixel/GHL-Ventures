'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff, X, Volume2, Loader2, Navigation, Search, Phone, Mail, Calculator, HelpCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface VoiceCommand {
  keywords: string[]
  action: string
  description: string
  icon: React.ElementType
  handler: () => void
}

export default function VoiceNavigator() {
  const [isListening, setIsListening] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showWidget, setShowWidget] = useState(false)
  const [pulseRing, setPulseRing] = useState(false)
  const recognitionRef = useRef<any>(null)
  const router = useRouter()

  useEffect(() => {
    const timer = setTimeout(() => setShowWidget(true), 6000)
    return () => clearTimeout(timer)
  }, [])

  const commands: VoiceCommand[] = [
    { keywords: ['home', 'go home', 'main page'], action: 'Navigate Home', description: 'Go to homepage', icon: Navigation, handler: () => router.push('/') },
    { keywords: ['about', 'about us', 'who are you', 'team'], action: 'About Us', description: 'Learn about GHL', icon: Navigation, handler: () => router.push('/about') },
    { keywords: ['fund', 'funds', 'investment fund', 'aif'], action: 'Our Fund', description: 'View fund details', icon: Navigation, handler: () => router.push('/fund') },
    { keywords: ['blog', 'articles', 'insights', 'news'], action: 'Blog', description: 'Read our insights', icon: Navigation, handler: () => router.push('/blog') },
    { keywords: ['contact', 'reach out', 'get in touch', 'talk'], action: 'Contact', description: 'Contact us', icon: Phone, handler: () => router.push('/contact') },
    { keywords: ['portfolio', 'companies', 'investments'], action: 'Portfolio', description: 'View portfolio', icon: Navigation, handler: () => router.push('/portfolio') },
    { keywords: ['download', 'downloads', 'brochure', 'documents'], action: 'Downloads', description: 'Get documents', icon: Navigation, handler: () => router.push('/downloads') },
    { keywords: ['financial', 'learn', 'education', 'iq'], action: 'Financial IQ', description: 'Financial education', icon: HelpCircle, handler: () => router.push('/financial-iq') },
    { keywords: ['calculator', 'calculate', 'returns', 'how much'], action: 'Calculator', description: 'Open calculator', icon: Calculator, handler: () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })) } },
    { keywords: ['call', 'phone', 'ring'], action: 'Call Us', description: 'Phone call', icon: Phone, handler: () => { window.open('tel:+917200255252', '_self') } },
    { keywords: ['email', 'mail', 'write to'], action: 'Email', description: 'Send email', icon: Mail, handler: () => { window.open('mailto:info@ghlindiaventures.com', '_self') } },
    { keywords: ['whatsapp', 'chat', 'message'], action: 'WhatsApp', description: 'Open WhatsApp', icon: Phone, handler: () => { window.open('https://wa.me/917200255252', '_blank') } },
    { keywords: ['dark', 'dark mode', 'night mode'], action: 'Dark Mode', description: 'Toggle theme', icon: Navigation, handler: () => { document.querySelector<HTMLButtonElement>('[aria-label="Toggle theme"]')?.click() } },
    { keywords: ['search', 'find', 'look for'], action: 'Search', description: 'Open search', icon: Search, handler: () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true })) } },
    { keywords: ['scroll up', 'go up', 'top', 'back to top'], action: 'Scroll Top', description: 'Go to top', icon: Navigation, handler: () => { window.scrollTo({ top: 0, behavior: 'smooth' }) } },
    { keywords: ['scroll down', 'go down'], action: 'Scroll Down', description: 'Scroll down', icon: Navigation, handler: () => { window.scrollBy({ top: 500, behavior: 'smooth' }) } },
    { keywords: ['debenture', 'ncd', 'debt'], action: 'Debenture Route', description: 'View debentures', icon: Navigation, handler: () => router.push('/fund/debenture-route') },
    { keywords: ['direct', 'direct aif', 'direct fund'], action: 'Direct AIF', description: 'View Direct AIF', icon: Navigation, handler: () => router.push('/fund/direct-aif') },
    { keywords: ['login', 'sign in', 'log in'], action: 'Login', description: 'Investor login', icon: Navigation, handler: () => router.push('/login') },
  ]

  const processTranscript = useCallback((text: string) => {
    const lower = text.toLowerCase().trim()
    setIsProcessing(true)

    // Find matching command
    let bestMatch: VoiceCommand | null = null
    let bestScore = 0

    for (const cmd of commands) {
      for (const keyword of cmd.keywords) {
        if (lower.includes(keyword)) {
          const score = keyword.length
          if (score > bestScore) {
            bestScore = score
            bestMatch = cmd
          }
        }
      }
    }

    setTimeout(() => {
      if (bestMatch) {
        setFeedback(`✓ ${bestMatch.action}`)
        setTimeout(() => {
          bestMatch!.handler()
          setTimeout(() => {
            setIsOpen(false)
            setIsListening(false)
            setTranscript('')
            setFeedback('')
            setIsProcessing(false)
          }, 500)
        }, 800)
      } else {
        setFeedback('Sorry, I didn\'t understand. Try saying a page name like "blog" or "contact".')
        setIsProcessing(false)
      }
    }, 600)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])

  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setFeedback('Voice recognition not supported in this browser. Try Chrome.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = 'en-IN'

    recognition.onstart = () => {
      setIsListening(true)
      setPulseRing(true)
      setFeedback('Listening...')
    }

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const text = result[0].transcript
      setTranscript(text)

      if (result.isFinal) {
        setIsListening(false)
        setPulseRing(false)
        processTranscript(text)
      }
    }

    recognition.onerror = (event: any) => {
      setIsListening(false)
      setPulseRing(false)
      if (event.error === 'not-allowed') {
        setFeedback('Microphone access denied. Please allow microphone access.')
      } else {
        setFeedback('Could not hear you. Please try again.')
      }
    }

    recognition.onend = () => {
      setIsListening(false)
      setPulseRing(false)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [processTranscript])

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
    setPulseRing(false)
  }

  const handleClose = () => {
    stopListening()
    setIsOpen(false)
    setTranscript('')
    setFeedback('')
    setIsProcessing(false)
  }

  if (!showWidget) return null

  return (
    <>
      {/* Floating trigger pill */}
      {!isOpen && (
        <button
          onClick={() => { setIsOpen(true); setTimeout(startListening, 300) }}
          className="fixed z-[9992] flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 hover:scale-105 group"
          style={{
            top: '192px',
            left: '16px',
            background: 'rgba(10,10,10,0.9)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
          title="Voice Navigation — say a command"
        >
          <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center shrink-0">
            <Mic className="w-3.5 h-3.5 text-violet-400" />
          </div>
          <div className="text-left">
            <p className="text-[10px] text-gray-500 leading-none mb-0.5">Voice Nav</p>
            <p className="text-[11px] text-gray-300 group-hover:text-white transition-colors font-medium">
              &quot;Hey GHL&quot;
            </p>
          </div>
        </button>
      )}

      {/* Voice Command Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
        >
          <div className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(10,10,10,0.95)',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}
          >
            {/* Close button */}
            <button onClick={handleClose} className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
              <X className="w-4 h-4" />
            </button>

            {/* Main content */}
            <div className="flex flex-col items-center pt-10 pb-8 px-6">
              {/* Microphone button with rings */}
              <div className="relative mb-6">
                {/* Pulsing rings */}
                {pulseRing && (
                  <>
                    <div className="absolute inset-0 rounded-full bg-violet-500/20 animate-ping" style={{ animationDuration: '1.5s' }} />
                    <div className="absolute -inset-3 rounded-full bg-violet-500/10 animate-ping" style={{ animationDuration: '2s' }} />
                    <div className="absolute -inset-6 rounded-full bg-violet-500/5 animate-ping" style={{ animationDuration: '2.5s' }} />
                  </>
                )}

                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isListening
                      ? 'bg-violet-500 shadow-[0_0_40px_rgba(139,92,246,0.5)]'
                      : 'bg-white/10 hover:bg-violet-500/30'
                  }`}
                >
                  {isProcessing ? (
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                  ) : isListening ? (
                    <Mic className="w-8 h-8 text-white" />
                  ) : (
                    <MicOff className="w-8 h-8 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Title */}
              <h3 className="text-white text-lg font-bold mb-1">
                {isListening ? 'Listening...' : isProcessing ? 'Processing...' : 'Voice Navigation'}
              </h3>
              <p className="text-gray-500 text-xs mb-4">
                {isListening ? 'Speak a command now' : 'Tap the mic and say where you want to go'}
              </p>

              {/* Transcript display */}
              {transcript && (
                <div className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 mb-4">
                  <p className="text-[10px] text-gray-500 mb-1 flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> You said:
                  </p>
                  <p className="text-white text-sm font-medium">&quot;{transcript}&quot;</p>
                </div>
              )}

              {/* Feedback */}
              {feedback && (
                <div className={`w-full px-4 py-3 rounded-xl mb-4 ${
                  feedback.startsWith('✓')
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : feedback.startsWith('Sorry')
                    ? 'bg-red-500/10 border border-red-500/20'
                    : 'bg-violet-500/10 border border-violet-500/20'
                }`}>
                  <p className={`text-sm font-medium ${
                    feedback.startsWith('✓') ? 'text-emerald-400' :
                    feedback.startsWith('Sorry') ? 'text-red-400' : 'text-violet-400'
                  }`}>{feedback}</p>
                </div>
              )}

              {/* Quick command suggestions */}
              <div className="w-full">
                <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-2 px-1">Try saying:</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: '"Go to blog"', desc: 'Read insights' },
                    { label: '"Contact"', desc: 'Get in touch' },
                    { label: '"Show calculator"', desc: 'Investment calc' },
                    { label: '"Open WhatsApp"', desc: 'Chat with us' },
                    { label: '"About us"', desc: 'Learn more' },
                    { label: '"Portfolio"', desc: 'Our companies' },
                    { label: '"Back to top"', desc: 'Scroll up' },
                    { label: '"Dark mode"', desc: 'Toggle theme' },
                  ].map(suggestion => (
                    <button
                      key={suggestion.label}
                      onClick={() => {
                        const text = suggestion.label.replace(/"/g, '')
                        setTranscript(text)
                        processTranscript(text)
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left group"
                    >
                      <div>
                        <p className="text-[11px] text-gray-300 group-hover:text-white font-medium">{suggestion.label}</p>
                        <p className="text-[9px] text-gray-600">{suggestion.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/5 text-center">
              <p className="text-[9px] text-gray-600">
                🎤 Uses Web Speech API · Works best in Chrome · English (India)
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
