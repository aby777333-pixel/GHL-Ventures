'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import {
  Mic, MicOff, X, ChevronUp, ChevronDown, Volume2, VolumeX,
  Globe, Navigation, Send, Phone, PhoneCall, Mail, MessageCircle,
  Video, Moon, Sun, Search, Zap, Power, ArrowLeft, ArrowRight,
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
  { code: 'en-US', label: 'English', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'hi-IN', label: 'Hindi', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'ta-IN', label: 'Tamil', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'te-IN', label: 'Telugu', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'kn-IN', label: 'Kannada', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'ml-IN', label: 'Malayalam', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'es-ES', label: 'Spanish', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'fr-FR', label: 'French', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'de-DE', label: 'German', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'ja-JP', label: 'Japanese', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'zh-CN', label: 'Chinese', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'ar-SA', label: 'Arabic', flag: '\u{1F1F8}\u{1F1E6}' },
]

// ─── Command parser ───
type CmdType = 'navigate' | 'scroll' | 'read' | 'stop' | 'help' | 'language'
  | 'call' | 'directcall' | 'email' | 'whatsapp' | 'telegram' | 'video' | 'dark' | 'light'
  | 'search' | 'close' | 'home' | 'back' | 'downloadapps' | 'callingsolutions'
  | 'openchat' | 'closechat' | 'refresh' | 'share' | 'print' | 'fullscreen'
  | 'time' | 'date' | 'ghlinfo' | 'sebi' | 'address' | 'officehours'
  | 'zoomin' | 'zoomout' | 'zoomreset' | 'fontup' | 'fontdown' | 'fontreset'
  | 'scrollleft' | 'scrollright' | 'scrollfast' | 'scrollslow'
  | 'nextsection' | 'prevsection' | 'highlight' | 'contrast'
  | 'bookmark' | 'openlivechat' | 'weather' | 'calculator'
  | 'forward' | 'selectall' | 'clearhistory' | 'focusmain'
  | 'unknown'

interface ParsedCommand {
  type: CmdType
  target?: string
  direction?: 'up' | 'down' | 'top' | 'bottom' | 'left' | 'right'
}

function parseCommand(input: string): ParsedCommand {
  const text = input.toLowerCase().trim()

  // Close widget
  if (/^(?:close|exit|bye|goodbye|shut|dismiss|hide|go away|stop listening)$/.test(text)) return { type: 'close' }

  // Home / back
  if (/^(?:go home|home page|take me home|homepage)$/.test(text)) return { type: 'home' }
  if (/^(?:go back|back|previous page|previous)$/.test(text)) return { type: 'back' }

  // Navigation commands
  const navPatterns = [
    /^(?:go to|open|navigate to|take me to|show me|visit)\s+(.+)$/,
    /^(.+?)\s+page$/,
  ]
  for (const pattern of navPatterns) {
    const match = text.match(pattern)
    if (match) return { type: 'navigate', target: match[1].trim() }
  }

  // Scroll commands — vertical
  if (/scroll\s*up|go\s*up|page\s*up|move\s*up|swipe\s*up/.test(text) && text.length < 25) return { type: 'scroll', direction: 'up' }
  if (/scroll\s*down|go\s*down|page\s*down|move\s*down|swipe\s*down/.test(text) && text.length < 25) return { type: 'scroll', direction: 'down' }
  if (/^up$/.test(text)) return { type: 'scroll', direction: 'up' }
  if (/^down$/.test(text)) return { type: 'scroll', direction: 'down' }
  if (/^move$/.test(text)) return { type: 'scroll', direction: 'down' }
  if (/scroll\s*(?:to\s*)?top|go\s*(?:to\s*)?top|beginning/.test(text) && text.length < 25) return { type: 'scroll', direction: 'top' }
  if (/scroll\s*(?:to\s*)?bottom|go\s*(?:to\s*)?bottom|^end$/.test(text) && text.length < 25) return { type: 'scroll', direction: 'bottom' }
  if (/^top$/.test(text)) return { type: 'scroll', direction: 'top' }
  if (/^bottom$/.test(text)) return { type: 'scroll', direction: 'bottom' }
  // Scroll commands — horizontal
  if (/scroll\s*left|go\s*left|move\s*left|swipe\s*left/.test(text) && text.length < 25) return { type: 'scroll', direction: 'left' }
  if (/scroll\s*right|go\s*right|move\s*right|swipe\s*right/.test(text) && text.length < 25) return { type: 'scroll', direction: 'right' }
  if (/^left$/.test(text)) return { type: 'scroll', direction: 'left' }
  if (/^right$/.test(text)) return { type: 'scroll', direction: 'right' }
  // Scroll speed
  if (/scroll\s*fast|fast\s*scroll|quick\s*scroll/.test(text)) return { type: 'scrollfast' }
  if (/scroll\s*slow|slow\s*scroll|gentle\s*scroll/.test(text)) return { type: 'scrollslow' }
  // Section navigation
  if (/next\s*section|next\s*part|scroll\s*next|next/.test(text) && text.length < 20) return { type: 'nextsection' }
  if (/previous\s*section|prev\s*section|scroll\s*prev|previous/.test(text) && text.length < 25) return { type: 'prevsection' }

  // Read aloud
  if (/^(?:read|read aloud|read this|read page|read out|read it|read the page|read content)/.test(text)) return { type: 'read' }

  // Stop speaking
  if (/^(?:stop|shut up|quiet|silence|cancel|pause|mute)/.test(text)) return { type: 'stop' }

  // Contact actions
  if (/(?:direct call|call us|phone numbers|office number|call ghl|phone call)/.test(text)) return { type: 'directcall' }
  if (/(?:download.*app|get.*calling.*app|install.*app|need.*calling|no.*app)/.test(text)) return { type: 'downloadapps' }
  if (/(?:calling solutions|web calling|click to call|webrtc|call integrations|call solutions)/.test(text)) return { type: 'callingsolutions' }
  if (/(?:call|phone|ring|dial)/.test(text)) return { type: 'call' }
  if (/(?:email|mail|send email|write email|send mail|email us|mail us)/.test(text)) return { type: 'email' }
  if (/(?:whatsapp|whats app|chat on whatsapp|message on whatsapp|whatsapp chat)/.test(text)) return { type: 'whatsapp' }
  if (/(?:telegram|tg|telegram chat)/.test(text)) return { type: 'telegram' }
  if (/(?:video call|video chat|video|webcam|start video|video meeting)/.test(text)) return { type: 'video' }

  // Chat/ARIA commands
  if (/(?:open chat|open aria|hey aria|talk to aria|start chat|chatbot)/.test(text)) return { type: 'openchat' }
  if (/(?:close chat|close aria|hide chat)/.test(text)) return { type: 'closechat' }

  // Theme commands
  if (/(?:dark mode|dark theme|night mode|go dark)/.test(text)) return { type: 'dark' }
  if (/(?:light mode|light theme|day mode|go light|bright)/.test(text)) return { type: 'light' }

  // Utility commands
  if (/(?:refresh|reload)/.test(text)) return { type: 'refresh' }
  if (/(?:share|copy link|share page|share this)/.test(text)) return { type: 'share' }
  if (/(?:print|print page)/.test(text)) return { type: 'print' }
  if (/(?:fullscreen|full screen|maximize)/.test(text)) return { type: 'fullscreen' }

  // Time & date
  if (/(?:what time|current time|time now|tell.*time)/.test(text)) return { type: 'time' }
  if (/(?:what date|current date|today|what day|tell.*date)/.test(text)) return { type: 'date' }

  // Zoom commands
  if (/(?:zoom in|zoom\s*\+|bigger|enlarge|magnify)/.test(text)) return { type: 'zoomin' }
  if (/(?:zoom out|zoom\s*-|smaller|shrink|reduce)/.test(text)) return { type: 'zoomout' }
  if (/(?:zoom reset|normal zoom|reset zoom|100%|actual size)/.test(text)) return { type: 'zoomreset' }

  // Font size commands
  if (/(?:font bigger|font up|increase font|larger text|bigger text|bigger font)/.test(text)) return { type: 'fontup' }
  if (/(?:font smaller|font down|decrease font|smaller text|smaller font)/.test(text)) return { type: 'fontdown' }
  if (/(?:font reset|reset font|normal font|default font)/.test(text)) return { type: 'fontreset' }

  // Accessibility
  if (/(?:high contrast|contrast mode|toggle contrast)/.test(text)) return { type: 'contrast' }
  if (/(?:highlight links|highlight|show links)/.test(text)) return { type: 'highlight' }
  if (/(?:focus main|focus content|skip to content|main content)/.test(text)) return { type: 'focusmain' }

  // Additional utility commands
  if (/(?:bookmark|save page|add bookmark)/.test(text)) return { type: 'bookmark' }
  if (/(?:live chat|open live chat|chat widgets|free chat)/.test(text)) return { type: 'openlivechat' }
  if (/(?:go forward|forward|next page)/.test(text)) return { type: 'forward' }
  if (/(?:select all|select everything)/.test(text)) return { type: 'selectall' }
  if (/(?:clear|clear history|clear chat|reset)/.test(text)) return { type: 'clearhistory' }
  if (/(?:calculator|calculate|calc|math)/.test(text)) return { type: 'calculator' }
  if (/(?:weather|temperature|forecast)/.test(text)) return { type: 'weather' }

  // Quick info
  if (/(?:what is ghl|about ghl|tell me about ghl|ghl info)/.test(text)) return { type: 'ghlinfo' }
  if (/(?:sebi|registration|sebi number|registered)/.test(text)) return { type: 'sebi' }
  if (/(?:address|location|where is ghl|office location|where are you)/.test(text)) return { type: 'address' }
  if (/(?:office hours|working hours|timings|business hours|when.*open)/.test(text)) return { type: 'officehours' }

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
  const [showPrompt, setShowPrompt] = useState(false)

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoMicTriggered = useRef(false)
  const intentionalStop = useRef(false)
  const widgetClosed = useRef(false)

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

    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  // ─── Auto-trigger: show "Speak to navigate" prompt, then open mic ───
  useEffect(() => {
    if (!mounted || autoMicTriggered.current) return
    autoMicTriggered.current = true

    // Show floating "Speak to navigate" prompt first
    const promptTimer = setTimeout(() => {
      setShowPrompt(true)
    }, 1500)

    // After 3s, auto-open widget and start continuous mic
    const openTimer = setTimeout(() => {
      setShowPrompt(false)
      setIsOpen(true)
      setShowPulse(false)
      widgetClosed.current = false
      setFeedback('Mic is ON. Say "help" for commands, or speak a page name. Say "close" to exit.')
      // Start continuous mic after panel renders
      setTimeout(() => {
        startContinuousMic()
      }, 600)
    }, 4000)

    return () => {
      clearTimeout(promptTimer)
      clearTimeout(openTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted])

  // Stop speaking on route change (but keep mic on)
  useEffect(() => {
    stopSpeaking()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  const stopSpeaking = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // ─── TTS Speak — with robust voice matching for selected language ───
  const speak = useCallback((text: string, lang?: string) => {
    if (!synthRef.current) return
    synthRef.current.cancel()
    const useLang = lang || language
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = useLang
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.volume = 1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)

    // ── Robust voice selection ──
    const voices = synthRef.current.getVoices()
    const langPrefix = useLang.split('-')[0] // e.g. 'ml' from 'ml-IN'

    // Priority 1: Exact match (e.g. 'ml-IN')
    let voice = voices.find(v => v.lang === useLang)
    // Priority 2: Same prefix with region variant (e.g. 'ml_IN' or 'ml')
    if (!voice) voice = voices.find(v => v.lang.replace('_', '-') === useLang)
    if (!voice) voice = voices.find(v => v.lang.startsWith(langPrefix + '-') || v.lang.startsWith(langPrefix + '_'))
    if (!voice) voice = voices.find(v => v.lang === langPrefix)
    // Priority 3: Voice name contains language name
    if (!voice) {
      const langLabel = LANGUAGES.find(l => l.code === useLang)?.label.toLowerCase() || ''
      if (langLabel) voice = voices.find(v => v.name.toLowerCase().includes(langLabel))
    }

    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang // Ensure lang matches the voice
    }

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
      const langName = LANGUAGES.find(l => l.code === language)?.label || 'English'
      setFeedback(`Reading page in ${langName}...`)
      speak(text.trim())
    } else {
      setFeedback('No readable content found on this page.')
    }
  }, [speak, language])

  // ─── Close the entire widget ───
  const closeWidget = useCallback(() => {
    widgetClosed.current = true
    intentionalStop.current = true
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    stopSpeaking()
    setIsListening(false)
    setIsOpen(false)
    setFeedback('')
    setInputText('')
    setShowLangPicker(false)
  }, [stopSpeaking])

  const executeCommand = useCallback((raw: string) => {
    const cmd = parseCommand(raw)

    switch (cmd.type) {
      case 'close': {
        setFeedback('Closing voice navigator. Goodbye!')
        speak('Goodbye!')
        setTimeout(() => closeWidget(), 800)
        break
      }
      case 'home': {
        setFeedback('Going to Home page...')
        speak('Going to Home page.')
        setTimeout(() => router.push('/'), 500)
        break
      }
      case 'back': {
        setFeedback('Going back...')
        speak('Going back.')
        setTimeout(() => window.history.back(), 500)
        break
      }
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
        const scrollMap = { up: -600, down: 600, left: 0, right: 0, top: 0, bottom: 0 }
        if (cmd.direction === 'up' || cmd.direction === 'down') {
          window.scrollBy({ top: scrollMap[cmd.direction], behavior: 'smooth' })
          setFeedback(`Scrolling ${cmd.direction}...`)
        } else if (cmd.direction === 'left') {
          window.scrollBy({ left: -400, behavior: 'smooth' })
          setFeedback('Scrolling left...')
        } else if (cmd.direction === 'right') {
          window.scrollBy({ left: 400, behavior: 'smooth' })
          setFeedback('Scrolling right...')
        } else if (cmd.direction === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setFeedback('Scrolling to top...')
        } else if (cmd.direction === 'bottom') {
          window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
          setFeedback('Scrolling to bottom...')
        }
        break
      }
      case 'scrollfast': {
        window.scrollBy({ top: 1500, behavior: 'smooth' })
        setFeedback('Fast scrolling down...')
        break
      }
      case 'scrollslow': {
        window.scrollBy({ top: 200, behavior: 'smooth' })
        setFeedback('Slow scrolling down...')
        break
      }
      case 'nextsection': {
        // Find the next heading below current viewport
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, section'))
        const viewTop = window.scrollY + 100
        const nextH = headings.find(h => (h as HTMLElement).offsetTop > viewTop)
        if (nextH) {
          (nextH as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' })
          setFeedback('Jumping to next section...')
        } else {
          setFeedback('No more sections below.')
        }
        break
      }
      case 'prevsection': {
        const headingsRev = Array.from(document.querySelectorAll('h1, h2, h3, section')).reverse()
        const viewTopRev = window.scrollY - 50
        const prevH = headingsRev.find(h => (h as HTMLElement).offsetTop < viewTopRev)
        if (prevH) {
          (prevH as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'start' })
          setFeedback('Jumping to previous section...')
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' })
          setFeedback('At the top — no previous sections.')
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
      case 'directcall': {
        setFeedback('Opening Direct Call widget...')
        speak('Opening direct call.')
        const directCallBtn = document.querySelector('[aria-label="Open Direct Call"]') as HTMLElement
        if (directCallBtn) directCallBtn.click()
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
        setTimeout(() => {
          // Use custom event (preferred, works with duplicate prevention)
          window.dispatchEvent(new CustomEvent('ghl-open-video-call'))
          // Fallback: also try direct button click
          const videoBtn = document.querySelector('[aria-label="Open Sales & Support Video Call"]') as HTMLElement
          if (videoBtn) videoBtn.click()
        }, 300)
        break
      }
      case 'downloadapps': {
        setFeedback('Opening calling app downloads...')
        speak('Opening download options for calling apps.')
        const dcBtn = document.querySelector('[aria-label="Open Direct Call"]') as HTMLElement
        if (dcBtn) dcBtn.click()
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('ghl-show-downloads'))
        }, 500)
        break
      }
      case 'callingsolutions': {
        setFeedback('Opening web calling solutions...')
        speak('Opening web calling solutions and integrations.')
        const dcBtn2 = document.querySelector('[aria-label="Open Direct Call"]') as HTMLElement
        if (dcBtn2) dcBtn2.click()
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('ghl-show-solutions'))
        }, 500)
        break
      }
      case 'openchat': {
        setFeedback('Opening ARIA chatbot...')
        speak('Opening ARIA chat assistant.')
        const chatBtn = document.querySelector('[aria-label="Open ARIA chatbot"]') as HTMLElement
        if (chatBtn) chatBtn.click()
        break
      }
      case 'closechat': {
        setFeedback('Closing ARIA chatbot...')
        speak('Closing chat.')
        const closeBtn = document.querySelector('[aria-label="Close chat"]') as HTMLElement
        if (closeBtn) closeBtn.click()
        break
      }
      case 'refresh': {
        setFeedback('Refreshing page...')
        speak('Refreshing the page.')
        setTimeout(() => window.location.reload(), 500)
        break
      }
      case 'share': {
        setFeedback('Copying page link...')
        if (navigator.share) {
          navigator.share({ title: document.title, url: window.location.href })
        } else {
          navigator.clipboard.writeText(window.location.href).then(() => {
            setFeedback('Link copied to clipboard!')
            speak('Link copied to clipboard.')
          })
        }
        break
      }
      case 'print': {
        setFeedback('Opening print dialog...')
        speak('Opening print dialog.')
        setTimeout(() => window.print(), 500)
        break
      }
      case 'fullscreen': {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {})
          setFeedback('Entered fullscreen mode.')
          speak('Entering fullscreen.')
        } else {
          document.exitFullscreen()
          setFeedback('Exited fullscreen mode.')
          speak('Exiting fullscreen.')
        }
        break
      }
      case 'time': {
        const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        setFeedback(`Current time: ${now}`)
        speak(`The current time is ${now}`)
        break
      }
      case 'date': {
        const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
        setFeedback(`Today: ${today}`)
        speak(`Today is ${today}`)
        break
      }
      case 'ghlinfo': {
        const info = 'GHL India Ventures is a SEBI registered Category 2 Alternative Investment Fund based in Chennai, specializing in stressed real estate and early-stage startup investments.'
        setFeedback(info)
        speak(info)
        break
      }
      case 'sebi': {
        const sebiInfo = 'GHL India Ventures SEBI registration number is IN/AIF2/2425/1517, registered as a Category 2 Alternative Investment Fund.'
        setFeedback('SEBI Reg: IN/AIF2/2425/1517')
        speak(sebiInfo)
        break
      }
      case 'address': {
        const addr = '2D, Queens Court, Number 6, Montieth Road, Egmore, Chennai, Tamil Nadu, PIN 600008'
        setFeedback(`Office: ${addr}`)
        speak(`GHL India Ventures is located at ${addr}`)
        break
      }
      case 'officehours': {
        const hours = 'Monday to Saturday, 9:30 AM to 6:30 PM IST'
        setFeedback(`Office Hours: ${hours}`)
        speak(`GHL India Ventures office hours are ${hours}`)
        break
      }
      case 'zoomin': {
        const currentZoom = parseFloat(document.documentElement.style.zoom || '1')
        const newZoom = Math.min(currentZoom + 0.1, 2)
        document.documentElement.style.zoom = String(newZoom)
        setFeedback(`Zoomed in to ${Math.round(newZoom * 100)}%`)
        speak(`Zoomed in to ${Math.round(newZoom * 100)} percent`)
        break
      }
      case 'zoomout': {
        const currentZ = parseFloat(document.documentElement.style.zoom || '1')
        const newZ = Math.max(currentZ - 0.1, 0.5)
        document.documentElement.style.zoom = String(newZ)
        setFeedback(`Zoomed out to ${Math.round(newZ * 100)}%`)
        speak(`Zoomed out to ${Math.round(newZ * 100)} percent`)
        break
      }
      case 'zoomreset': {
        document.documentElement.style.zoom = '1'
        setFeedback('Zoom reset to 100%')
        speak('Zoom reset to normal.')
        break
      }
      case 'fontup': {
        const root = document.documentElement
        const currentSize = parseFloat(getComputedStyle(root).fontSize)
        root.style.fontSize = `${Math.min(currentSize + 2, 28)}px`
        setFeedback(`Font size increased to ${Math.min(currentSize + 2, 28)}px`)
        speak('Font size increased.')
        break
      }
      case 'fontdown': {
        const rootEl = document.documentElement
        const curSize = parseFloat(getComputedStyle(rootEl).fontSize)
        rootEl.style.fontSize = `${Math.max(curSize - 2, 10)}px`
        setFeedback(`Font size decreased to ${Math.max(curSize - 2, 10)}px`)
        speak('Font size decreased.')
        break
      }
      case 'fontreset': {
        document.documentElement.style.fontSize = ''
        setFeedback('Font size reset to default.')
        speak('Font size reset.')
        break
      }
      case 'contrast': {
        const body = document.body
        if (body.classList.contains('ghl-high-contrast')) {
          body.classList.remove('ghl-high-contrast')
          body.style.filter = ''
          setFeedback('High contrast mode OFF.')
          speak('High contrast mode disabled.')
        } else {
          body.classList.add('ghl-high-contrast')
          body.style.filter = 'contrast(1.4) saturate(0.3)'
          setFeedback('High contrast mode ON.')
          speak('High contrast mode enabled.')
        }
        break
      }
      case 'highlight': {
        const links = document.querySelectorAll('a')
        const isHighlighted = document.body.classList.contains('ghl-links-highlighted')
        if (isHighlighted) {
          links.forEach(a => (a as HTMLElement).style.outline = '')
          document.body.classList.remove('ghl-links-highlighted')
          setFeedback('Link highlighting removed.')
          speak('Links no longer highlighted.')
        } else {
          links.forEach(a => (a as HTMLElement).style.outline = '2px solid #D0021B')
          document.body.classList.add('ghl-links-highlighted')
          setFeedback('All links highlighted!')
          speak('All links are now highlighted.')
        }
        break
      }
      case 'focusmain': {
        const mainContent = document.getElementById('main-content') || document.querySelector('main') || document.querySelector('[role="main"]')
        if (mainContent) {
          (mainContent as HTMLElement).tabIndex = -1
          ;(mainContent as HTMLElement).focus()
          mainContent.scrollIntoView({ behavior: 'smooth' })
          setFeedback('Focused on main content.')
          speak('Focused on main content area.')
        } else {
          setFeedback('No main content area found.')
        }
        break
      }
      case 'bookmark': {
        setFeedback('Bookmark shortcut: Press Ctrl+D (or Cmd+D on Mac) to bookmark this page.')
        speak('To bookmark this page, press Control D or Command D on Mac.')
        break
      }
      case 'openlivechat': {
        setFeedback('Opening ARIA with live chat info...')
        speak('Opening ARIA chat with live chat widget information.')
        const chatBtn = document.querySelector('[aria-label="Open ARIA chatbot"]') as HTMLElement
        if (chatBtn) chatBtn.click()
        break
      }
      case 'forward': {
        setFeedback('Going forward...')
        speak('Going forward.')
        setTimeout(() => window.history.forward(), 500)
        break
      }
      case 'selectall': {
        setFeedback('Selecting all text on page...')
        if (typeof window.getSelection !== 'undefined') {
          const range = document.createRange()
          const mainEl = document.getElementById('main-content') || document.body
          range.selectNodeContents(mainEl)
          const sel = window.getSelection()
          sel?.removeAllRanges()
          sel?.addRange(range)
        }
        speak('All text selected.')
        break
      }
      case 'clearhistory': {
        setFeedback('Feedback cleared.')
        setInputText('')
        break
      }
      case 'calculator': {
        setFeedback('Opening calculator...')
        speak('Opening web calculator.')
        window.open('https://www.google.com/search?q=calculator', '_blank')
        break
      }
      case 'weather': {
        setFeedback('Opening weather for Chennai...')
        speak('Opening weather forecast for Chennai.')
        window.open('https://www.google.com/search?q=weather+chennai', '_blank')
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
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, metaKey: true, bubbles: true }))
        break
      }
      case 'help': {
        const helpText = 'Commands: "Go to [page]", "Scroll up/down/left/right/top/bottom", "Move up/down", "Next/Previous section", "Scroll fast/slow", "Read page", "Stop", "Direct Call", "Call", "Email", "WhatsApp", "Telegram", "Video call", "Open chat", "Live chat", "Download app", "Calling solutions", "Dark/Light mode", "Zoom in/out/reset", "Font bigger/smaller/reset", "High contrast", "Highlight links", "Focus main", "Bookmark", "Calculator", "Weather", "Switch to [language]", "Search [query]", "What time", "What date", "SEBI", "Address", "Office hours", "Share", "Print", "Fullscreen", "Refresh", "Go back", "Go forward", "Home", "Select all", "Clear", "Close".'
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
          setFeedback(`"${raw}" - not recognized. Say "help" for commands.`)
        }
      }
    }
  }, [router, speak, readPageContent, stopSpeaking, language, closeWidget])

  // ─── Start CONTINUOUS mic — stays on until "close" or manual stop ───
  const startContinuousMic = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      setFeedback('Voice recognition not supported in this browser.')
      return
    }

    // Abort any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }

    intentionalStop.current = false

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US' // Always listen in English for commands
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onend = () => {
      // Auto-restart unless intentionally stopped or widget closed
      if (!intentionalStop.current && !widgetClosed.current) {
        try {
          setTimeout(() => {
            if (!intentionalStop.current && !widgetClosed.current && recognitionRef.current) {
              recognitionRef.current.start()
            }
          }, 300)
        } catch {}
      } else {
        setIsListening(false)
      }
    }

    recognition.onerror = (event: any) => {
      // For non-fatal errors, let onend handle restart
      if (event.error === 'aborted' || event.error === 'no-speech') {
        // These are fine — mic will auto-restart via onend
        return
      }
      if (event.error === 'not-allowed') {
        setIsListening(false)
        setFeedback('Microphone access denied. Please allow microphone in browser settings and refresh.')
        intentionalStop.current = true
      } else if (event.error === 'network') {
        setFeedback('Network error. Mic will retry...')
      }
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

    // Request mic permission first, then start
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop())
        try {
          recognition.start()
        } catch {
          setFeedback('Could not start voice recognition.')
        }
      })
      .catch((err: any) => {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setFeedback('Microphone access denied. Please allow mic in browser settings.')
        } else if (err.name === 'NotFoundError') {
          setFeedback('No microphone found. Please connect a microphone.')
        } else {
          setFeedback('Could not access microphone. Please type your command.')
        }
      })
  }, [executeCommand])

  // Manual mic toggle (for the button in the panel)
  const toggleMic = useCallback(() => {
    if (isListening) {
      intentionalStop.current = true
      if (recognitionRef.current) {
        try { recognitionRef.current.stop() } catch {}
      }
      setIsListening(false)
      setFeedback('Mic paused. Click mic button or say nothing to resume.')
    } else {
      startContinuousMic()
    }
  }, [isListening, startContinuousMic])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim()) {
      executeCommand(inputText.trim())
      setInputText('')
    }
  }

  const togglePanel = () => {
    if (isOpen) {
      // Closing
      closeWidget()
    } else {
      // Opening
      widgetClosed.current = false
      setIsOpen(true)
      setShowPulse(false)
      setShowPrompt(false)
      setFeedback('Mic is ON. Speak a command or say "help".')
      setTimeout(() => {
        inputRef.current?.focus()
        startContinuousMic()
      }, 400)
    }
  }

  if (!mounted) return null

  const currentLang = LANGUAGES.find(l => l.code === language)

  return (
    <>
      {/* ── "Speak to navigate" floating prompt ── */}
      {showPrompt && !isOpen && (
        <div
          className="fixed z-[9993] animate-fade-in"
          style={{
            bottom: '60px',
            left: '16px',
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium"
            style={{
              background: 'rgba(10,10,10,0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(208,2,27,0.3)',
              boxShadow: '0 8px 30px rgba(208,2,27,0.15), 0 4px 20px rgba(0,0,0,0.4)',
              animation: 'voice-prompt-bounce 2s ease-in-out infinite',
            }}
          >
            <Mic className="w-4 h-4 text-brand-red animate-pulse" />
            <span className="text-white font-semibold">Speak to navigate</span>
            <span className="text-gray-400 text-[10px] ml-1">or click to open</span>
          </div>
          <div
            className="absolute -bottom-1.5 left-6 w-3 h-3 rotate-45"
            style={{ background: 'rgba(10,10,10,0.92)', borderRight: '1px solid rgba(208,2,27,0.3)', borderBottom: '1px solid rgba(208,2,27,0.3)' }}
          />
        </div>
      )}

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
        title="Hey GHL \u2014 Voice Commands"
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
        style={{ bottom: '60px', left: '16px', width: '330px', maxHeight: '500px' }}
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
              {isListening && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] text-red-400 font-medium">LIVE</span>
                </span>
              )}
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
              <button onClick={closeWidget} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors" title="Close (or say &quot;close&quot;)">
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
                      setFeedback(`Language: ${lang.label}. TTS will read in ${lang.label}.`)
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
                { icon: <ChevronUp className="w-2.5 h-2.5" />, label: 'Up', action: () => executeCommand('scroll up') },
                { icon: <ChevronDown className="w-2.5 h-2.5" />, label: 'Down', action: () => executeCommand('scroll down') },
                { icon: <Navigation className="w-2.5 h-2.5" />, label: 'Top', action: () => executeCommand('scroll top') },
                { icon: <Navigation className="w-2.5 h-2.5 rotate-180" />, label: 'Bottom', action: () => executeCommand('scroll bottom') },
                { icon: <Volume2 className="w-2.5 h-2.5" />, label: 'Read', action: readPageContent },
                { icon: <Search className="w-2.5 h-2.5" />, label: 'Zoom+', action: () => executeCommand('zoom in') },
                { icon: <Search className="w-2.5 h-2.5" />, label: 'Zoom-', action: () => executeCommand('zoom out') },
                { icon: <Sun className="w-2.5 h-2.5" />, label: 'Contrast', action: () => executeCommand('high contrast') },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-[10px] transition-all">
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
            {/* Row 2: Contact shortcuts */}
            <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
              {[
                { icon: <PhoneCall className="w-2.5 h-2.5" />, label: 'Direct Call', color: 'text-green-400', action: () => executeCommand('direct call') },
                { icon: <Phone className="w-2.5 h-2.5" />, label: 'Call', color: 'text-green-300', action: () => executeCommand('call') },
                { icon: <Mail className="w-2.5 h-2.5" />, label: 'Email', color: 'text-blue-400', action: () => executeCommand('email') },
                { icon: <MessageCircle className="w-2.5 h-2.5" />, label: 'WhatsApp', color: 'text-emerald-400', action: () => executeCommand('whatsapp') },
                { icon: <Send className="w-2.5 h-2.5" />, label: 'Telegram', color: 'text-sky-400', action: () => executeCommand('telegram') },
                { icon: <Video className="w-2.5 h-2.5" />, label: 'Video', color: 'text-purple-400', action: () => executeCommand('video call') },
                { icon: <Phone className="w-2.5 h-2.5" />, label: 'Get App', color: 'text-cyan-400', action: () => executeCommand('download app') },
                { icon: <Power className="w-2.5 h-2.5" />, label: 'Solutions', color: 'text-indigo-400', action: () => executeCommand('calling solutions') },
                { icon: <MessageCircle className="w-2.5 h-2.5" />, label: 'Live Chat', color: 'text-pink-400', action: () => executeCommand('live chat') },
                { icon: <Moon className="w-2.5 h-2.5" />, label: 'Dark', color: 'text-gray-300', action: () => executeCommand('dark mode') },
                { icon: <Sun className="w-2.5 h-2.5" />, label: 'Light', color: 'text-yellow-400', action: () => executeCommand('light mode') },
              ].map(btn => (
                <button key={btn.label} onClick={btn.action} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 hover:bg-white/10 ${btn.color} text-[10px] transition-all`}>
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Pages list */}
          <div className="px-3 py-2 max-h-[150px] overflow-y-auto border-b border-white/10 scrollbar-thin">
            <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1.5 font-semibold">Quick Nav \u2014 all pages</p>
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
                {isListening && !isSpeaking && <Mic className="w-3 h-3 text-brand-red shrink-0 mt-0.5 animate-pulse" />}
                <span>{feedback}</span>
              </p>
            </div>
          )}

          {/* Input area */}
          <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5">
            <button
              type="button"
              onClick={toggleMic}
              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-brand-red text-white animate-pulse shadow-lg shadow-brand-red/30'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20 hover:text-white'
              }`}
              title={isListening ? 'Pause mic' : 'Resume mic'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={isListening ? 'Listening continuously...' : 'Type a command...'}
              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[11px] text-white placeholder-gray-500 outline-none focus:border-brand-red/50 transition-colors"
            />
            <button type="submit" className="shrink-0 w-8 h-8 rounded-full bg-brand-red/80 hover:bg-brand-red text-white flex items-center justify-center transition-all">
              <Send className="w-3 h-3" />
            </button>
          </form>

          {/* Bottom hint */}
          <div className="px-3 pb-2 text-center">
            <p className="text-[9px] text-gray-600">
              Mic stays on. Say <strong className="text-gray-400">&quot;close&quot;</strong> to exit or <strong className="text-gray-400">&quot;help&quot;</strong> for all commands.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
