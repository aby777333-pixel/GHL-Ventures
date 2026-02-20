'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Mic, MicOff, X, ChevronUp, ChevronDown, Volume2, VolumeX,
  Globe, Navigation, BookOpen, Send,
} from 'lucide-react'
import { NAV_LINKS } from '@/lib/constants'

// ─── Flatten all nav links for navigation ───
interface NavItem { label: string; href: string }
function flattenNav(): NavItem[] {
  const items: NavItem[] = []
  for (const link of NAV_LINKS) {
    if ('children' in link && link.children) {
      for (const child of link.children) {
        items.push({ label: child.label, href: child.href })
      }
    } else {
      items.push({ label: link.label, href: link.href })
    }
  }
  return items
}

const ALL_PAGES = flattenNav()

// ─── Supported languages for TTS ───
const LANGUAGES = [
  { code: 'en-US', label: 'English' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'ta-IN', label: 'Tamil' },
  { code: 'te-IN', label: 'Telugu' },
  { code: 'kn-IN', label: 'Kannada' },
  { code: 'ml-IN', label: 'Malayalam' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'zh-CN', label: 'Chinese' },
  { code: 'ar-SA', label: 'Arabic' },
]

// ─── Command parser ───
interface ParsedCommand {
  type: 'navigate' | 'scroll' | 'read' | 'stop' | 'help' | 'unknown'
  target?: string
  direction?: 'up' | 'down' | 'top' | 'bottom'
}

function parseCommand(input: string): ParsedCommand {
  const text = input.toLowerCase().trim()

  // Navigation commands
  const navPatterns = [
    /^(?:go to|open|navigate to|take me to|show me|visit)\s+(.+)$/,
    /^(.+?)\s+page$/,
  ]
  for (const pattern of navPatterns) {
    const match = text.match(pattern)
    if (match) return { type: 'navigate', target: match[1].trim() }
  }

  // Scroll commands
  if (/scroll\s*up|go\s*up|page\s*up/.test(text)) return { type: 'scroll', direction: 'up' }
  if (/scroll\s*down|go\s*down|page\s*down/.test(text)) return { type: 'scroll', direction: 'down' }
  if (/scroll\s*(?:to\s*)?top|go\s*(?:to\s*)?top|beginning/.test(text)) return { type: 'scroll', direction: 'top' }
  if (/scroll\s*(?:to\s*)?bottom|go\s*(?:to\s*)?bottom|end/.test(text)) return { type: 'scroll', direction: 'bottom' }

  // Read aloud
  if (/^(?:read|read aloud|read this|read page|read out)/.test(text)) return { type: 'read' }

  // Stop speaking
  if (/^(?:stop|shut up|quiet|silence|cancel|pause)/.test(text)) return { type: 'stop' }

  // Help
  if (/^(?:help|commands|what can you do)/.test(text)) return { type: 'help' }

  // Try to match as a page name directly
  const directMatch = findPage(text)
  if (directMatch) return { type: 'navigate', target: text }

  return { type: 'unknown' }
}

function findPage(query: string): NavItem | null {
  const q = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  // Exact match
  let match = ALL_PAGES.find(p => p.label.toLowerCase() === q)
  if (match) return match
  // Partial match
  match = ALL_PAGES.find(p => p.label.toLowerCase().includes(q) || q.includes(p.label.toLowerCase()))
  if (match) return match
  // Fuzzy: check href
  match = ALL_PAGES.find(p => p.href.toLowerCase().includes(q.replace(/\s+/g, '-')))
  if (match) return match
  return null
}

export default function VoiceCommandWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [inputText, setInputText] = useState('')
  const [feedback, setFeedback] = useState('')
  const [language, setLanguage] = useState('en-US')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [showPulse, setShowPulse] = useState(true)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
    synthRef.current = window.speechSynthesis
    // Hide pulse after 10 seconds
    const t = setTimeout(() => setShowPulse(false), 10000)
    return () => clearTimeout(t)
  }, [])

  // Close panel on route change
  useEffect(() => {
    setIsOpen(false)
    stopSpeaking()
  }, [pathname])

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }, [])

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    // Try to find a voice for the selected language
    const voices = synthRef.current.getVoices()
    const voice = voices.find(v => v.lang === language) || voices.find(v => v.lang.startsWith(language.split('-')[0]))
    if (voice) utterance.voice = voice

    synthRef.current.speak(utterance)
  }, [language])

  const readPageContent = useCallback(() => {
    const main = document.getElementById('main-content')
    if (!main) {
      setFeedback('No content found to read.')
      return
    }
    // Extract visible text, limiting to ~2000 chars for TTS
    const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, null)
    let text = ''
    let node: Node | null
    while ((node = walker.nextNode()) && text.length < 2000) {
      const t = (node.textContent || '').trim()
      if (t.length > 2) text += t + '. '
    }
    if (text.trim()) {
      setFeedback('Reading page content aloud...')
      speak(text.trim())
    } else {
      setFeedback('No readable content found.')
    }
  }, [speak])

  const executeCommand = useCallback((raw: string) => {
    const cmd = parseCommand(raw)

    switch (cmd.type) {
      case 'navigate': {
        const page = findPage(cmd.target || '')
        if (page) {
          setFeedback(`Navigating to ${page.label}...`)
          speak(`Going to ${page.label}`)
          setTimeout(() => router.push(page.href), 500)
        } else {
          setFeedback(`Page "${cmd.target}" not found. Try: ${ALL_PAGES.slice(0, 4).map(p => p.label).join(', ')}...`)
          speak(`Sorry, I could not find that page.`)
        }
        break
      }
      case 'scroll': {
        if (cmd.direction === 'up') {
          window.scrollBy({ top: -600, behavior: 'smooth' })
          setFeedback('Scrolling up...')
        } else if (cmd.direction === 'down') {
          window.scrollBy({ top: 600, behavior: 'smooth' })
          setFeedback('Scrolling down...')
        } else if (cmd.direction === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setFeedback('Scrolling to top...')
        } else if (cmd.direction === 'bottom') {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
          setFeedback('Scrolling to bottom...')
        }
        break
      }
      case 'read': {
        readPageContent()
        break
      }
      case 'stop': {
        stopSpeaking()
        setFeedback('Stopped speaking.')
        break
      }
      case 'help': {
        const helpText = 'You can say: "Go to Fund", "Scroll down", "Read page", "Stop", or any page name like "NRI Invest", "Contact Us", "Insights".'
        setFeedback(helpText)
        speak(helpText)
        break
      }
      default: {
        // Try as direct page navigation
        const page = findPage(raw)
        if (page) {
          setFeedback(`Navigating to ${page.label}...`)
          speak(`Going to ${page.label}`)
          setTimeout(() => router.push(page.href), 500)
        } else {
          setFeedback('Command not recognized. Say "help" for available commands.')
          speak('Sorry, I did not understand that. Say help for commands.')
        }
      }
    }
  }, [router, speak, readPageContent, stopSpeaking])

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setFeedback('Voice recognition not supported in this browser. Please type your command.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => {
      setIsListening(false)
      setFeedback('Voice recognition error. Please try again or type your command.')
    }
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInputText(transcript)
      executeCommand(transcript)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [language, executeCommand])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      executeCommand(inputText.trim())
      setInputText('')
    }
  }

  const togglePanel = () => {
    setIsOpen(prev => {
      if (!prev) {
        setShowPulse(false)
        setTimeout(() => inputRef.current?.focus(), 200)
      } else {
        stopSpeaking()
        stopListening()
      }
      return !prev
    })
    setFeedback('')
  }

  if (!mounted) return null

  return (
    <>
      {/* Floating trigger button — positioned near the LiveVisitorCount */}
      <button
        onClick={togglePanel}
        className="fixed z-[9991] flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 hover:scale-105 group"
        style={{
          bottom: '28px',
          left: '16px',
          background: isOpen ? 'rgba(208,2,27,0.9)' : 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${isOpen ? 'rgba(208,2,27,0.3)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: isOpen ? '0 4px 20px rgba(208,2,27,0.3)' : '0 4px 20px rgba(0,0,0,0.3)',
        }}
        title="Hey GHL — Voice Commands"
      >
        {/* Pulse ring */}
        {showPulse && !isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(208,2,27,0.3)' }} />
        )}
        <Mic className={`w-3 h-3 ${isOpen ? 'text-white' : 'text-brand-red'} transition-colors`} />
        <span className="text-gray-300 group-hover:text-white transition-colors">
          {isOpen ? 'Close' : 'Hey GHL..'}
        </span>
      </button>

      {/* Command Panel */}
      <div
        ref={panelRef}
        className={`fixed z-[9992] transition-all duration-300 ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{
          bottom: '60px',
          left: '16px',
          width: '320px',
          maxHeight: '420px',
        }}
      >
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
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
              <div className="w-6 h-6 rounded-full bg-brand-red/20 flex items-center justify-center">
                <Navigation className="w-3 h-3 text-brand-red" />
              </div>
              <span className="text-white text-xs font-bold tracking-wide">GHL VOICE NAV</span>
            </div>
            <div className="flex items-center gap-1">
              {/* Language picker toggle */}
              <button
                onClick={() => setShowLangPicker(!showLangPicker)}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                title="Change language"
              >
                <Globe className="w-3.5 h-3.5" />
              </button>
              {/* TTS Stop */}
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-red-400 hover:text-red-300"
                  title="Stop speaking"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={togglePanel}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Language picker dropdown */}
          {showLangPicker && (
            <div className="px-3 py-2 border-b border-white/10 max-h-[140px] overflow-y-auto">
              <div className="grid grid-cols-3 gap-1">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setShowLangPicker(false); setFeedback(`Language: ${lang.label}`) }}
                    className={`text-[10px] px-2 py-1.5 rounded-lg transition-all ${
                      language === lang.code
                        ? 'bg-brand-red text-white font-bold'
                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="px-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => { window.scrollBy({ top: -600, behavior: 'smooth' }); setFeedback('Scrolling up...') }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] transition-all"
              >
                <ChevronUp className="w-2.5 h-2.5" /> Up
              </button>
              <button
                onClick={() => { window.scrollBy({ top: 600, behavior: 'smooth' }); setFeedback('Scrolling down...') }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] transition-all"
              >
                <ChevronDown className="w-2.5 h-2.5" /> Down
              </button>
              <button
                onClick={readPageContent}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] transition-all"
              >
                <Volume2 className="w-2.5 h-2.5" /> Read
              </button>
              <button
                onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setFeedback('Scrolling to top...') }}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] transition-all"
              >
                Top
              </button>
              <button
                onClick={() => executeCommand('help')}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] transition-all"
              >
                ?
              </button>
            </div>
          </div>

          {/* Pages list — scrollable */}
          <div className="px-3 py-2 max-h-[180px] overflow-y-auto border-b border-white/10 scrollbar-thin">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">Quick Nav</p>
            <div className="grid grid-cols-2 gap-1">
              {ALL_PAGES.map(page => {
                const isActive = pathname === page.href
                return (
                  <button
                    key={page.href}
                    onClick={() => {
                      setFeedback(`Navigating to ${page.label}...`)
                      speak(`Going to ${page.label}`)
                      setTimeout(() => router.push(page.href), 300)
                    }}
                    className={`text-left text-[10px] px-2.5 py-1.5 rounded-lg transition-all ${
                      isActive
                        ? 'bg-brand-red/20 text-brand-red font-bold'
                        : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {page.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Feedback area */}
          {feedback && (
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-[10px] text-gray-300 leading-relaxed flex items-start gap-2">
                {isSpeaking && <Volume2 className="w-3 h-3 text-brand-red shrink-0 mt-0.5 animate-pulse" />}
                <span>{feedback}</span>
              </p>
            </div>
          )}

          {/* Input area */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-brand-red text-white animate-pulse shadow-lg shadow-brand-red/30'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
              }`}
              title={isListening ? 'Stop listening' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={isListening ? 'Listening...' : 'Type command... (e.g. "go to Fund")'}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder-gray-500 outline-none focus:border-brand-red/50 transition-colors"
            />
            <button
              type="submit"
              className="shrink-0 w-8 h-8 rounded-full bg-brand-red/80 hover:bg-brand-red text-white flex items-center justify-center transition-all"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
