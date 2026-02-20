'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Mic, MicOff, X, ChevronUp, ChevronDown, Volume2, VolumeX,
  Globe, Navigation, Send, Phone, Mail, MessageCircle,
  Video, Moon, Sun, Search, Zap,
} from 'lucide-react'
import { NAV_LINKS, BRAND } from '@/lib/constants'

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
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'hi-IN', label: 'Hindi', flag: '🇮🇳' },
  { code: 'ta-IN', label: 'Tamil', flag: '🇮🇳' },
  { code: 'te-IN', label: 'Telugu', flag: '🇮🇳' },
  { code: 'kn-IN', label: 'Kannada', flag: '🇮🇳' },
  { code: 'ml-IN', label: 'Malayalam', flag: '🇮🇳' },
  { code: 'es-ES', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fr-FR', label: 'French', flag: '🇫🇷' },
  { code: 'de-DE', label: 'German', flag: '🇩🇪' },
  { code: 'ja-JP', label: 'Japanese', flag: '🇯🇵' },
  { code: 'zh-CN', label: 'Chinese', flag: '🇨🇳' },
  { code: 'ar-SA', label: 'Arabic', flag: '🇸🇦' },
]

// ─── Command parser ───
type CmdType = 'navigate' | 'scroll' | 'read' | 'stop' | 'help' | 'language'
  | 'call' | 'email' | 'whatsapp' | 'telegram' | 'video' | 'dark' | 'light' | 'search' | 'unknown'

interface ParsedCommand {
  type: CmdType
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
  if (/scroll\s*up|go\s*up|page\s*up|up/.test(text) && text.length < 15) return { type: 'scroll', direction: 'up' }
  if (/scroll\s*down|go\s*down|page\s*down|down/.test(text) && text.length < 15) return { type: 'scroll', direction: 'down' }
  if (/scroll\s*(?:to\s*)?top|go\s*(?:to\s*)?top|beginning|top/.test(text) && text.length < 20) return { type: 'scroll', direction: 'top' }
  if (/scroll\s*(?:to\s*)?bottom|go\s*(?:to\s*)?bottom|end|bottom/.test(text) && text.length < 20) return { type: 'scroll', direction: 'bottom' }

  // Read aloud
  if (/^(?:read|read aloud|read this|read page|read out|read it)/.test(text)) return { type: 'read' }

  // Stop speaking
  if (/^(?:stop|shut up|quiet|silence|cancel|pause|mute)/.test(text)) return { type: 'stop' }

  // Contact actions
  if (/(?:call|phone|ring|dial)/.test(text)) return { type: 'call' }
  if (/(?:email|mail|send email|write email)/.test(text)) return { type: 'email' }
  if (/(?:whatsapp|whats app|chat on whatsapp|message on whatsapp)/.test(text)) return { type: 'whatsapp' }
  if (/(?:telegram|tg)/.test(text)) return { type: 'telegram' }
  if (/(?:video call|video chat|video|webcam)/.test(text)) return { type: 'video' }

  // Theme commands
  if (/(?:dark mode|dark theme|night mode|go dark)/.test(text)) return { type: 'dark' }
  if (/(?:light mode|light theme|day mode|go light|bright)/.test(text)) return { type: 'light' }

  // Language switch
  if (/(?:switch to|speak in|change language|set language|language)\s+(.+)/.test(text)) {
    const m = text.match(/(?:switch to|speak in|change language|set language|language)\s+(.+)/)
    return { type: 'language', target: m ? m[1].trim() : '' }
  }

  // Search
  if (/^(?:search|find|look for)\s+(.+)/.test(text)) return { type: 'search', target: text.replace(/^(?:search|find|look for)\s+/, '') }

  // Help
  if (/^(?:help|commands|what can you do|menu)/.test(text)) return { type: 'help' }

  // Try to match as a page name directly
  const directMatch = findPage(text)
  if (directMatch) return { type: 'navigate', target: text }

  return { type: 'unknown' }
}

function findPage(query: string): NavItem | null {
  const q = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  let match = ALL_PAGES.find(p => p.label.toLowerCase() === q)
  if (match) return match
  match = ALL_PAGES.find(p => p.label.toLowerCase().includes(q) || q.includes(p.label.toLowerCase()))
  if (match) return match
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
  const [voicesLoaded, setVoicesLoaded] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoMicTriggered = useRef(false)

  const router = useRouter()
  const pathname = usePathname()

  // ─── Mount + load voices ───
  useEffect(() => {
    setMounted(true)
    synthRef.current = window.speechSynthesis

    // Voices load async in Chrome — wait for them
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) setVoicesLoaded(true)
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    const t = setTimeout(() => setShowPulse(false), 10000)
    return () => clearTimeout(t)
  }, [])

  // ─── Auto-trigger mic on page load (after 2s delay) ───
  useEffect(() => {
    if (!mounted || autoMicTriggered.current) return
    autoMicTriggered.current = true

    const timer = setTimeout(() => {
      // Auto-open the panel and start listening
      setIsOpen(true)
      setShowPulse(false)
      setFeedback('Say "help" for commands, or speak a page name.')
      // Auto-start mic after a brief delay for the panel to render
      setTimeout(() => {
        autoStartMic()
      }, 600)
    }, 2500)

    return () => clearTimeout(timer)
  }, [mounted])

  // Close panel on route change
  useEffect(() => {
    stopSpeaking()
  }, [pathname])

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }, [])

  const speak = useCallback((text: string, lang?: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const useLang = lang || language
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = useLang
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    // Find best voice for selected language
    const voices = synthRef.current.getVoices()
    const langPrefix = useLang.split('-')[0]
    // Prefer native voices, then any matching voice
    const voice = voices.find(v => v.lang === useLang && !v.localService === false)
      || voices.find(v => v.lang === useLang)
      || voices.find(v => v.lang.startsWith(langPrefix))
    if (voice) utterance.voice = voice

    synthRef.current.speak(utterance)
  }, [language])

  const readPageContent = useCallback(() => {
    const main = document.getElementById('main-content')
    if (!main) {
      setFeedback('No content found to read.')
      return
    }

    const selectors = 'h1, h2, h3, h4, p, li, td, blockquote, figcaption, [role="heading"]'
    const elements = Array.from(main.querySelectorAll(selectors))
    const seen = new Set<string>()
    let text = ''

    for (const el of elements) {
      if (text.length > 2500) break
      const style = window.getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') continue
      if (el.closest('nav, footer, button, form, [aria-hidden="true"], script, style, noscript')) continue

      const raw = (el as HTMLElement).innerText || ''
      const cleaned = raw.replace(/\s+/g, ' ').trim()
      if (cleaned.length < 4) continue
      if (/^https?:\/\//.test(cleaned)) continue
      if (/^[A-Z0-9]{2,4}$/.test(cleaned)) continue
      if (seen.has(cleaned)) continue
      seen.add(cleaned)
      text += cleaned + '. '
    }

    if (text.trim()) {
      setFeedback(`Reading page in ${LANGUAGES.find(l => l.code === language)?.label || 'English'}...`)
      speak(text.trim())
    } else {
      setFeedback('No readable content found on this page.')
    }
  }, [speak, language])

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
          speak('Sorry, I could not find that page.')
        }
        break
      }
      case 'scroll': {
        const scrollMap = { up: -600, down: 600 }
        if (cmd.direction === 'up' || cmd.direction === 'down') {
          window.scrollBy({ top: scrollMap[cmd.direction], behavior: 'smooth' })
          setFeedback(`Scrolling ${cmd.direction}...`)
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
      case 'call': {
        setFeedback('Opening phone dialer...')
        speak('Calling GHL India Ventures.')
        window.open(`tel:${BRAND.mobile}`, '_self')
        break
      }
      case 'email': {
        setFeedback('Opening email client...')
        speak('Opening email.')
        window.open(`mailto:${BRAND.email}?subject=Investment%20Inquiry`, '_self')
        break
      }
      case 'whatsapp': {
        setFeedback('Opening WhatsApp...')
        speak('Opening WhatsApp chat.')
        window.open(`https://wa.me/${BRAND.whatsapp}?text=${encodeURIComponent(BRAND.whatsappMessage)}`, '_blank')
        break
      }
      case 'telegram': {
        setFeedback('Opening Telegram...')
        speak('Opening Telegram.')
        window.open('https://t.me/ghlindia', '_blank')
        break
      }
      case 'video': {
        setFeedback('Opening video call widget...')
        speak('Opening video call.')
        // Trigger the VideoCallWidget by clicking its button
        const videoBtn = document.querySelector('[aria-label="Open Sales & Support Video Call"]') as HTMLElement
        if (videoBtn) videoBtn.click()
        break
      }
      case 'dark': {
        setFeedback('Switching to dark mode...')
        speak('Switching to dark mode.')
        document.documentElement.classList.add('dark')
        localStorage.setItem('ghl-theme', 'dark')
        break
      }
      case 'light': {
        setFeedback('Switching to light mode...')
        speak('Switching to light mode.')
        document.documentElement.classList.remove('dark')
        localStorage.setItem('ghl-theme', 'light')
        break
      }
      case 'language': {
        const target = (cmd.target || '').toLowerCase()
        const found = LANGUAGES.find(l => l.label.toLowerCase().includes(target))
        if (found) {
          setLanguage(found.code)
          setFeedback(`Language set to ${found.label}. TTS will now speak in ${found.label}.`)
          speak(`Language changed to ${found.label}.`, found.code)
        } else {
          setFeedback(`Language "${cmd.target}" not found. Available: ${LANGUAGES.map(l => l.label).join(', ')}`)
        }
        break
      }
      case 'search': {
        setFeedback(`Searching for "${cmd.target}"...`)
        // Open command palette with search query
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true, bubbles: true }))
        break
      }
      case 'help': {
        const helpText = 'Commands: "Go to Fund", "Scroll up", "Scroll down", "Read page", "Stop", "Call", "Email", "WhatsApp", "Telegram", "Video call", "Dark mode", "Light mode", "Switch to Hindi", "Search [query]", or say any page name.'
        setFeedback(helpText)
        speak(helpText)
        break
      }
      default: {
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
  }, [router, speak, readPageContent, stopSpeaking, language])

  // ─── Auto-start mic helper (no permission popup on auto) ───
  const autoStartMic = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setFeedback('Listening... speak now.')
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript
      if (result.isFinal) {
        setInputText(transcript)
        setFeedback(`Heard: "${transcript}"`)
        executeCommand(transcript)
      } else {
        setInputText(transcript)
        setFeedback(`Hearing: "${transcript}"...`)
      }
    }

    recognitionRef.current = recognition
    try { recognition.start() } catch {}
  }, [language, executeCommand])

  const startListening = useCallback(async () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setFeedback('Voice recognition not supported. Please type your command.')
      return
    }

    // Request mic permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(track => track.stop())
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setFeedback('Microphone access denied. Please allow microphone in browser settings.')
      } else if (err.name === 'NotFoundError') {
        setFeedback('No microphone found. Please connect a microphone.')
      } else {
        setFeedback('Could not access microphone. Please type your command.')
      }
      return
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }

    const recognition = new SpeechRecognition()
    recognition.lang = language
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
      setFeedback('Listening... speak now.')
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = (event: any) => {
      setIsListening(false)
      const errorMap: Record<string, string> = {
        'not-allowed': 'Microphone access denied.',
        'no-speech': 'No speech detected. Try again.',
        'audio-capture': 'No microphone found.',
        'network': 'Network error. Check connection.',
        'aborted': '',
      }
      const msg = errorMap[event.error] || `Voice error: ${event.error}`
      if (msg) setFeedback(msg)
    }
    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript
      if (result.isFinal) {
        setInputText(transcript)
        setFeedback(`Heard: "${transcript}"`)
        executeCommand(transcript)
      } else {
        setInputText(transcript)
        setFeedback(`Hearing: "${transcript}"...`)
      }
    }

    recognitionRef.current = recognition
    try { recognition.start() } catch {
      setIsListening(false)
      setFeedback('Could not start voice recognition.')
    }
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

  const currentLang = LANGUAGES.find(l => l.code === language)

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={togglePanel}
        className="fixed z-[9991] flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 hover:scale-105 group"
        style={{
          bottom: '28px',
          left: '16px',
          background: isOpen ? 'rgba(208,2,27,0.9)' : isListening ? 'rgba(208,2,27,0.7)' : 'rgba(10,10,10,0.85)',
          backdropFilter: 'blur(12px)',
          border: `1px solid ${isOpen ? 'rgba(208,2,27,0.3)' : isListening ? 'rgba(208,2,27,0.5)' : 'rgba(255,255,255,0.08)'}`,
          boxShadow: isListening ? '0 4px 20px rgba(208,2,27,0.4)' : '0 4px 20px rgba(0,0,0,0.3)',
        }}
        title="Hey GHL — Voice Commands"
      >
        {showPulse && !isOpen && (
          <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(208,2,27,0.3)' }} />
        )}
        {isListening && !isOpen && (
          <span className="absolute inset-0 rounded-full animate-pulse" style={{ background: 'rgba(208,2,27,0.2)' }} />
        )}
        <Mic className={`w-3 h-3 ${isOpen || isListening ? 'text-white' : 'text-brand-red'} transition-colors`} />
        <span className="text-gray-300 group-hover:text-white transition-colors">
          {isListening && !isOpen ? 'Listening...' : isOpen ? 'Close' : 'Hey GHL..'}
        </span>
      </button>

      {/* Command Panel */}
      <div
        className={`fixed z-[9992] transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ bottom: '60px', left: '16px', width: '330px', maxHeight: '480px' }}
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
                <Zap className="w-3 h-3 text-brand-red" />
              </div>
              <span className="text-white text-xs font-bold tracking-wide">GHL VOICE NAV</span>
              <span className="text-[9px] text-gray-500">{currentLang?.flag} {currentLang?.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setShowLangPicker(!showLangPicker)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Change language">
                <Globe className="w-3.5 h-3.5" />
              </button>
              {isSpeaking && (
                <button onClick={stopSpeaking} className="p-1.5 rounded-lg hover:bg-white/10 text-red-400 hover:text-red-300 transition-colors" title="Stop speaking">
                  <VolumeX className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={togglePanel} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Language picker */}
          {showLangPicker && (
            <div className="px-3 py-2 border-b border-white/10 max-h-[140px] overflow-y-auto">
              <div className="grid grid-cols-3 gap-1">
                {LANGUAGES.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code)
                      setShowLangPicker(false)
                      setFeedback(`Language: ${lang.label}. TTS and voice input will use ${lang.label}.`)
                      speak(`Language changed to ${lang.label}.`, lang.code)
                    }}
                    className={`text-[10px] px-2 py-1.5 rounded-lg transition-all ${
                      language === lang.code ? 'bg-brand-red text-white font-bold' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {lang.flag} {lang.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Actions — row 1: scroll + read */}
          <div className="px-3 py-2 border-b border-white/10">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { icon: <ChevronUp className="w-2.5 h-2.5" />, label: 'Up', action: () => { window.scrollBy({ top: -600, behavior: 'smooth' }); setFeedback('Scrolling up...') } },
                { icon: <ChevronDown className="w-2.5 h-2.5" />, label: 'Down', action: () => { window.scrollBy({ top: 600, behavior: 'smooth' }); setFeedback('Scrolling down...') } },
                { icon: <Volume2 className="w-2.5 h-2.5" />, label: 'Read', action: readPageContent },
                { icon: <Navigation className="w-2.5 h-2.5" />, label: 'Top', action: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); setFeedback('Scrolling to top...') } },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] transition-all">
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
            {/* Row 2: Contact shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              {[
                { icon: <Phone className="w-2.5 h-2.5" />, label: 'Call', color: 'text-green-400', action: () => executeCommand('call') },
                { icon: <Mail className="w-2.5 h-2.5" />, label: 'Email', color: 'text-blue-400', action: () => executeCommand('email') },
                { icon: <MessageCircle className="w-2.5 h-2.5" />, label: 'WhatsApp', color: 'text-emerald-400', action: () => executeCommand('whatsapp') },
                { icon: <Send className="w-2.5 h-2.5" />, label: 'Telegram', color: 'text-sky-400', action: () => executeCommand('telegram') },
                { icon: <Video className="w-2.5 h-2.5" />, label: 'Video', color: 'text-purple-400', action: () => executeCommand('video call') },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 ${btn.color} text-[10px] transition-all`}>
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pages list */}
          <div className="px-3 py-2 max-h-[150px] overflow-y-auto border-b border-white/10 scrollbar-thin">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">Quick Nav — all pages</p>
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
                      isActive ? 'bg-brand-red/20 text-brand-red font-bold' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {page.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-[10px] text-gray-300 leading-relaxed flex items-start gap-2">
                {isSpeaking && <Volume2 className="w-3 h-3 text-brand-red shrink-0 mt-0.5 animate-pulse" />}
                {isListening && <Mic className="w-3 h-3 text-brand-red shrink-0 mt-0.5 animate-pulse" />}
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
              placeholder={isListening ? 'Listening...' : 'Say or type a command...'}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder-gray-500 outline-none focus:border-brand-red/50 transition-colors"
            />
            <button type="submit" className="shrink-0 w-8 h-8 rounded-full bg-brand-red/80 hover:bg-brand-red text-white flex items-center justify-center transition-all">
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
