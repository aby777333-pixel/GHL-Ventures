'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { X, Mic, MicOff, Send, Volume2, VolumeX, Globe, ChevronDown, Minimize2 } from 'lucide-react'
import { LANGUAGES, getTranslations, getTimeGreeting, detectLanguageFromRegion } from '@/lib/avatarTranslations'
import type { LangCode } from '@/lib/avatarTranslations'
import { generateResponse } from '@/lib/avatarKnowledge'
import type { AvatarResponse } from '@/lib/avatarKnowledge'
import {
  isSarvamConfigured, sarvamTTS, playSarvamAudio,
  toSarvamLangCode, isSarvamTTSLanguage, SARVAM_AVATAR_VOICES,
} from '@/lib/sarvamService'

// ─── Types ───
type Phase = 'hidden' | 'greeting' | 'langPick' | 'capabilities' | 'chat' | 'minimized'
type AvatarAnim = 'idle' | 'speaking' | 'listening' | 'waving' | 'thinking'

interface ChatMsg {
  id: string
  speaker: 'abe' | 'tina' | 'user' | 'system'
  text: string
  timestamp: Date
}

// ─── Avatar SVG Components ───
function AbeAvatar({ anim, size = 90 }: { anim: AvatarAnim; size?: number }) {
  const isSpeaking = anim === 'speaking'
  const isWaving = anim === 'waving'
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Glow ring */}
      <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
        isSpeaking ? 'shadow-[0_0_20px_rgba(208,2,27,0.4)]' : ''
      }`} />
      <svg viewBox="0 0 100 120" className="w-full h-full" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
        {/* Body - Charcoal suit */}
        <ellipse cx="50" cy="110" rx="32" ry="18" fill="#2D2D2D" />
        <rect x="24" y="85" width="52" height="30" rx="8" fill="#333" />
        {/* White shirt collar */}
        <polygon points="40,86 50,95 60,86 58,82 50,88 42,82" fill="#F5F5F5" />
        {/* Maroon tie */}
        <polygon points="48,88 50,104 52,88" fill="#8B1A2B" />
        <circle cx="50" cy="88" r="2" fill="#8B1A2B" />
        {/* Gold lapel pin */}
        <circle cx="36" cy="90" r="1.5" fill="#C9A84C" />
        {/* Neck */}
        <rect x="44" y="72" width="12" height="16" rx="4" fill="#B07840" />
        {/* Head */}
        <ellipse cx="50" cy="50" rx="22" ry="26" fill="#B87A4B" />
        {/* Hair */}
        <ellipse cx="50" cy="34" rx="22" ry="14" fill="#1A1A1A" />
        <rect x="28" y="30" width="6" height="14" rx="3" fill="#1A1A1A" />
        <rect x="66" y="30" width="6" height="14" rx="3" fill="#1A1A1A" />
        {/* Ears */}
        <ellipse cx="28" cy="52" rx="4" ry="6" fill="#A06B3C" />
        <ellipse cx="72" cy="52" rx="4" ry="6" fill="#A06B3C" />
        {/* Eyes */}
        <g className={anim === 'idle' ? 'animate-[blink_4s_infinite]' : ''}>
          <ellipse cx="40" cy="50" rx="4" ry="4.5" fill="white" />
          <ellipse cx="60" cy="50" rx="4" ry="4.5" fill="white" />
          <circle cx="40" cy="50" r="2.5" fill="#2D1B0E" />
          <circle cx="60" cy="50" r="2.5" fill="#2D1B0E" />
          <circle cx="41" cy="49" r="1" fill="white" />
          <circle cx="61" cy="49" r="1" fill="white" />
        </g>
        {/* Eyebrows */}
        <path d="M34,42 Q40,39 46,42" stroke="#1A1A1A" strokeWidth="1.5" fill="none" className={isSpeaking ? 'animate-[eyebrowRaise_2s_infinite]' : ''} />
        <path d="M54,42 Q60,39 66,42" stroke="#1A1A1A" strokeWidth="1.5" fill="none" />
        {/* Nose */}
        <path d="M48,54 Q50,58 52,54" stroke="#8C6239" strokeWidth="1" fill="none" />
        {/* Mouth */}
        <g className={isSpeaking ? 'animate-[mouthMove_0.4s_infinite]' : ''}>
          {isSpeaking ? (
            <ellipse cx="50" cy="64" rx="5" ry="3" fill="#8B3A3A" />
          ) : (
            <path d="M43,63 Q50,68 57,63" stroke="#8B3A3A" strokeWidth="1.5" fill="none" />
          )}
        </g>
        {/* Warm smile lines */}
        <path d="M36,60 Q38,62 40,60" stroke="#A06B3C" strokeWidth="0.5" fill="none" opacity="0.5" />
        <path d="M60,60 Q62,62 64,60" stroke="#A06B3C" strokeWidth="0.5" fill="none" opacity="0.5" />
        {/* Wave hand for greeting */}
        {isWaving && (
          <g className="animate-[wave_1s_ease-in-out_2]" style={{ transformOrigin: '80px 75px' }}>
            <ellipse cx="82" cy="70" rx="5" ry="7" fill="#B87A4B" />
            <rect x="80" y="60" width="2.5" height="8" rx="1" fill="#B87A4B" transform="rotate(-10 81 64)" />
            <rect x="83" y="59" width="2.5" height="9" rx="1" fill="#B87A4B" transform="rotate(0 84 63)" />
            <rect x="86" y="60" width="2.5" height="8" rx="1" fill="#B87A4B" transform="rotate(10 87 64)" />
          </g>
        )}
      </svg>
      {/* Breathing animation */}
      <style jsx>{`
        @keyframes blink { 0%,96%,100% { opacity:1 } 97%,99% { opacity:0 } }
        @keyframes mouthMove { 0%,100% { ry:2 } 50% { ry:4 } }
        @keyframes eyebrowRaise { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-1.5px) } }
        @keyframes wave { 0%,100% { transform:rotate(0deg) } 25% { transform:rotate(20deg) } 75% { transform:rotate(-10deg) } }
      `}</style>
    </div>
  )
}

function TinaAvatar({ anim, size = 90 }: { anim: AvatarAnim; size?: number }) {
  const isSpeaking = anim === 'speaking'
  const isWaving = anim === 'waving'
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div className={`absolute inset-0 rounded-full transition-all duration-1000 ${
        isSpeaking ? 'shadow-[0_0_20px_rgba(208,2,27,0.4)]' : ''
      }`} />
      <svg viewBox="0 0 100 120" className="w-full h-full" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}>
        {/* Body - Navy blazer */}
        <ellipse cx="50" cy="110" rx="30" ry="16" fill="#1B2A4A" />
        <rect x="26" y="85" width="48" height="28" rx="8" fill="#1F3461" />
        {/* Cream blouse */}
        <path d="M40,85 L50,96 L60,85" fill="#F5E6D0" />
        <polygon points="42,85 50,92 58,85 56,83 50,88 44,83" fill="#F0DCC4" />
        {/* GHL brooch */}
        <circle cx="37" cy="90" r="2" fill="#C9A84C" />
        <circle cx="37" cy="90" r="1" fill="#D0021B" />
        {/* Pearl earrings */}
        <circle cx="26" cy="54" r="2.5" fill="#F5E6D0" />
        <circle cx="26" cy="54" r="1.5" fill="#FFF8EE" opacity="0.8" />
        <circle cx="74" cy="54" r="2.5" fill="#F5E6D0" />
        <circle cx="74" cy="54" r="1.5" fill="#FFF8EE" opacity="0.8" />
        {/* Neck */}
        <rect x="44" y="72" width="12" height="15" rx="4" fill="#C4915A" />
        {/* Gold bracelet */}
        <rect x="44" y="84" width="12" height="1.5" rx="0.5" fill="#C9A84C" opacity="0.6" />
        {/* Head */}
        <ellipse cx="50" cy="48" rx="21" ry="25" fill="#C4915A" />
        {/* Hair - shoulder length */}
        <ellipse cx="50" cy="34" rx="23" ry="16" fill="#1A1A1A" />
        <path d="M27,38 Q24,55 26,70" stroke="#1A1A1A" strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M73,38 Q76,55 74,70" stroke="#1A1A1A" strokeWidth="8" fill="none" strokeLinecap="round" />
        <rect x="24" y="32" width="8" height="20" rx="4" fill="#1A1A1A" />
        <rect x="68" y="32" width="8" height="20" rx="4" fill="#1A1A1A" />
        {/* Eyes */}
        <g className={anim === 'idle' ? 'animate-[tBlink_5s_infinite]' : ''}>
          <ellipse cx="40" cy="48" rx="4.5" ry="5" fill="white" />
          <ellipse cx="60" cy="48" rx="4.5" ry="5" fill="white" />
          <circle cx="40" cy="48" r="2.8" fill="#3D2B1F" />
          <circle cx="60" cy="48" r="2.8" fill="#3D2B1F" />
          <circle cx="41" cy="47" r="1.2" fill="white" />
          <circle cx="61" cy="47" r="1.2" fill="white" />
          {/* Eyelashes */}
          <path d="M36,44 L35,42" stroke="#1A1A1A" strokeWidth="0.7" />
          <path d="M44,44 L45,42" stroke="#1A1A1A" strokeWidth="0.7" />
          <path d="M56,44 L55,42" stroke="#1A1A1A" strokeWidth="0.7" />
          <path d="M64,44 L65,42" stroke="#1A1A1A" strokeWidth="0.7" />
        </g>
        {/* Eyebrows */}
        <path d="M34,40 Q40,37 46,40" stroke="#2A1A0A" strokeWidth="1.2" fill="none" />
        <path d="M54,40 Q60,37 66,40" stroke="#2A1A0A" strokeWidth="1.2" fill="none" />
        {/* Nose */}
        <path d="M48,52 Q50,56 52,52" stroke="#A67A4B" strokeWidth="0.8" fill="none" />
        {/* Mouth */}
        <g className={isSpeaking ? 'animate-[tMouth_0.35s_infinite]' : ''}>
          {isSpeaking ? (
            <ellipse cx="50" cy="62" rx="4.5" ry="3" fill="#C75050" />
          ) : (
            <path d="M43,61 Q50,66 57,61" stroke="#C75050" strokeWidth="1.5" fill="none" />
          )}
        </g>
        {/* Smile blush */}
        <circle cx="34" cy="56" r="4" fill="#D4836B" opacity="0.2" />
        <circle cx="66" cy="56" r="4" fill="#D4836B" opacity="0.2" />
        {/* Wave */}
        {isWaving && (
          <g className="animate-[tWave_1s_ease-in-out_2]" style={{ transformOrigin: '82px 75px' }}>
            <ellipse cx="84" cy="68" rx="4.5" ry="6" fill="#C4915A" />
            <rect x="82" y="58" width="2" height="7" rx="1" fill="#C4915A" transform="rotate(-10 83 62)" />
            <rect x="85" y="57" width="2" height="8" rx="1" fill="#C4915A" />
            <rect x="88" y="58" width="2" height="7" rx="1" fill="#C4915A" transform="rotate(10 89 62)" />
          </g>
        )}
      </svg>
      <style jsx>{`
        @keyframes tBlink { 0%,94%,100% { opacity:1 } 95%,99% { opacity:0 } }
        @keyframes tMouth { 0%,100% { ry:2 } 50% { ry:4 } }
        @keyframes tWave { 0%,100% { transform:rotate(0deg) } 25% { transform:rotate(20deg) } 75% { transform:rotate(-10deg) } }
      `}</style>
    </div>
  )
}

// ─── Mini Avatar Thumbnails ───
function MiniAbe() {
  return (
    <div className="w-11 h-11 rounded-full bg-[#333] border-2 border-white/10 overflow-hidden flex items-center justify-center">
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="16" r="8" fill="#B87A4B" />
        <ellipse cx="20" cy="10" rx="8" ry="5" fill="#1A1A1A" />
        <circle cx="17" cy="16" r="1.2" fill="#2D1B0E" />
        <circle cx="23" cy="16" r="1.2" fill="#2D1B0E" />
        <path d="M18,20 Q20,22 22,20" stroke="#8B3A3A" strokeWidth="0.8" fill="none" />
        <rect x="10" y="28" width="20" height="12" rx="4" fill="#333" />
        <polygon points="18,28 20,32 22,28" fill="#8B1A2B" />
      </svg>
    </div>
  )
}

function MiniTina() {
  return (
    <div className="w-11 h-11 rounded-full bg-[#1F3461] border-2 border-white/10 overflow-hidden flex items-center justify-center">
      <svg viewBox="0 0 40 40" className="w-8 h-8">
        <circle cx="20" cy="15" r="8" fill="#C4915A" />
        <ellipse cx="20" cy="10" rx="9" ry="6" fill="#1A1A1A" />
        <path d="M11,12 Q9,20 11,26" stroke="#1A1A1A" strokeWidth="3" fill="none" />
        <path d="M29,12 Q31,20 29,26" stroke="#1A1A1A" strokeWidth="3" fill="none" />
        <circle cx="17" cy="15" r="1.2" fill="#3D2B1F" />
        <circle cx="23" cy="15" r="1.2" fill="#3D2B1F" />
        <path d="M18,19 Q20,21 22,19" stroke="#C75050" strokeWidth="0.8" fill="none" />
        <rect x="11" y="27" width="18" height="12" rx="4" fill="#1F3461" />
        <circle cx="14" cy="20" r="1" fill="#F5E6D0" />
        <circle cx="26" cy="20" r="1" fill="#F5E6D0" />
      </svg>
    </div>
  )
}

// ─── Page context helper ───
function getCurrentPageContext(): string {
  if (typeof window === 'undefined') return 'home'
  const path = window.location.pathname
  if (path.includes('/about')) return 'about'
  if (path.includes('/fund/debenture')) return 'debenture'
  if (path.includes('/fund/direct')) return 'direct-aif'
  if (path.includes('/fund')) return 'fund'
  if (path.includes('/blog')) return 'blog'
  if (path.includes('/portfolio')) return 'portfolio'
  if (path.includes('/contact')) return 'contact'
  if (path.includes('/downloads')) return 'downloads'
  if (path.includes('/financial-iq')) return 'financial-iq'
  return 'home'
}

// ─── Main Component ───
export default function AvatarConcierge() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('hidden')
  const [lang, setLang] = useState<LangCode>('en')
  const [detectedLang, setDetectedLang] = useState<LangCode>('en')
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [inputText, setInputText] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [ttsEnabled, setTtsEnabled] = useState(true)
  const [abeAnim, setAbeAnim] = useState<AvatarAnim>('idle')
  const [tinaAnim, setTinaAnim] = useState<AvatarAnim>('idle')
  const [visitorName, setVisitorName] = useState<string>('')
  const [showLangPicker, setShowLangPicker] = useState(false)
  const [typewriterText, setTypewriterText] = useState('')
  const [typewriterDone, setTypewriterDone] = useState(false)
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt')
  const chatEndRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoListenRef = useRef(false)

  const t = getTranslations(lang)
  const isRtl = lang === 'ar'

  // ── Phase 1: Page load → IP detection → Greeting ──
  useEffect(() => {
    const timer = setTimeout(async () => {
      let detected: LangCode = 'en'
      try {
        const res = await fetch('https://ipinfo.io/json?token=')
        if (res.ok) {
          const data = await res.json()
          detected = detectLanguageFromRegion(data.region || '', data.country || '')
        }
      } catch {
        // Fallback to browser language
        const navLang = navigator.language?.substring(0, 2) as LangCode
        if (['hi','ta','te','kn','ml','es','fr','de','ar','zh','ja','pt','ru'].includes(navLang)) {
          detected = navLang
        }
      }
      setDetectedLang(detected)
      setLang(detected)
      setPhase('greeting')
      setAbeAnim('waving')
      setTinaAnim('waving')
      setTimeout(() => { setAbeAnim('idle'); setTinaAnim('idle') }, 2500)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  // ── Typewriter effect for greeting ──
  useEffect(() => {
    if (phase !== 'greeting') return
    const hour = new Date().getHours()
    const greet = getTimeGreeting(lang, hour)
    const fullText = `${greet}! ${t.welcomeMessage}`
    let i = 0
    setTypewriterText('')
    setTypewriterDone(false)
    const interval = setInterval(() => {
      if (i < fullText.length) {
        setTypewriterText(fullText.substring(0, i + 1))
        i++
      } else {
        setTypewriterDone(true)
        clearInterval(interval)
      }
    }, 25)
    // TTS — try Sarvam for Indian languages, fallback to Web Speech API
    if (ttsEnabled && typeof window !== 'undefined') {
      setTimeout(() => {
        if (isSarvamConfigured() && isSarvamTTSLanguage(lang)) {
          setAbeAnim('speaking')
          sarvamTTS({
            text: fullText,
            targetLanguage: toSarvamLangCode(lang),
            speaker: SARVAM_AVATAR_VOICES.abe,
          }).then(audio => {
            if (audio) return playSarvamAudio(audio)
            // Fallback to native
            speakGreetingNative(fullText)
          }).catch(() => speakGreetingNative(fullText))
            .finally(() => setAbeAnim('idle'))
        } else if (window.speechSynthesis) {
          speakGreetingNative(fullText)
        }
      }, 500)
    }

    function speakGreetingNative(txt: string) {
      const utter = new SpeechSynthesisUtterance(txt)
      utter.lang = lang === 'en' ? 'en-IN' : lang
      utter.rate = 0.9
      utter.onstart = () => setAbeAnim('speaking')
      utter.onend = () => setAbeAnim('idle')
      window.speechSynthesis.speak(utter)
    }
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, lang])

  // ── Auto-scroll chat ──
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── TTS helper — Sarvam AI for Indian languages, Web Speech API fallback ──
  const speak = useCallback((text: string, speaker: 'abe' | 'tina') => {
    if (!ttsEnabled || typeof window === 'undefined') return
    window.speechSynthesis?.cancel()

    const langCode = lang === 'en' ? 'en-IN' : lang
    const sarvamSpeaker = speaker === 'tina' ? SARVAM_AVATAR_VOICES.tina : SARVAM_AVATAR_VOICES.abe

    // Try Sarvam TTS for Indian languages
    if (isSarvamConfigured() && isSarvamTTSLanguage(lang)) {
      setIsSpeaking(true)
      if (speaker === 'abe') setAbeAnim('speaking')
      else setTinaAnim('speaking')

      sarvamTTS({
        text,
        targetLanguage: toSarvamLangCode(lang),
        speaker: sarvamSpeaker,
      }).then(audio => {
        if (audio) {
          return playSarvamAudio(audio)
        }
        // Sarvam failed — fall through to native
        speakNative(text, langCode, speaker)
      }).catch(() => {
        speakNative(text, langCode, speaker)
      }).finally(() => {
        setIsSpeaking(false)
        setAbeAnim('idle')
        setTinaAnim('idle')
      })
      return
    }

    // Fallback: Web Speech API
    speakNative(text, langCode, speaker)
  }, [lang, ttsEnabled])

  // Native Web Speech API TTS (fallback)
  const speakNative = useCallback((text: string, langCode: string, speaker: 'abe' | 'tina') => {
    if (!window.speechSynthesis) return

    const chunks = text.match(/[^.!?]+[.!?]*/g) || [text]
    let chunkIndex = 0

    const speakChunk = () => {
      if (chunkIndex >= chunks.length) {
        setIsSpeaking(false)
        setAbeAnim('idle')
        setTinaAnim('idle')
        return
      }
      const chunk = chunks[chunkIndex++].trim()
      if (!chunk) { speakChunk(); return }

      const utter = new SpeechSynthesisUtterance(chunk)
      utter.lang = langCode

      const voices = window.speechSynthesis.getVoices()
      const langVoices = voices.filter(v => v.lang.startsWith(langCode.split('-')[0]))
      if (langVoices.length > 0) {
        const isTina = speaker === 'tina'
        const preferred = langVoices.find(v =>
          isTina
            ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('woman')
            : v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('man')
        )
        utter.voice = preferred || langVoices[0]
      }

      utter.rate = speaker === 'tina' ? 1.0 : 0.92
      utter.pitch = speaker === 'tina' ? 1.08 : 0.9
      utter.volume = 1

      utter.onstart = () => {
        setIsSpeaking(true)
        if (speaker === 'abe') setAbeAnim('speaking')
        else setTinaAnim('speaking')
      }
      utter.onend = speakChunk
      utter.onerror = speakChunk
      window.speechSynthesis.speak(utter)
    }

    speakChunk()
  }, [])

  // ── Add message to chat ──
  const addMsg = useCallback((speaker: ChatMsg['speaker'], text: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString() + Math.random(), speaker, text, timestamp: new Date() }])
  }, [])

  // ── Handle Yes/No from greeting ──
  const handleGreetingYes = () => {
    setPhase('langPick')
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
  }
  const handleGreetingNo = () => {
    setPhase('minimized')
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel()
    speak(t.dismissMessage, 'abe')
  }

  // ── Handle language selection ──
  const handleLangSelect = (code: LangCode) => {
    setLang(code)
    setPhase('capabilities')
    const newT = getTranslations(code)
    // Add capabilities as messages
    setTimeout(() => {
      addMsg('tina', newT.capabilitiesIntro)
      speak(newT.capabilitiesIntro, 'tina')
    }, 300)
    setTimeout(() => {
      newT.capabilities.forEach((cap, i) => {
        setTimeout(() => addMsg('tina', cap), i * 200)
      })
    }, 800)
    setTimeout(() => {
      addMsg('abe', newT.abeInputPrompt)
      setPhase('chat')
    }, 2500)
  }

  // ── Process user input ──
  const processInput = useCallback((text: string) => {
    if (!text.trim()) return
    addMsg('user', text)
    setInputText('')

    // Check if user is providing their name
    if (!visitorName && messages.some(m => m.text.includes(t.askName))) {
      const name = text.trim().split(' ')[0]
      setVisitorName(name)
      addMsg('abe', `${t.niceToMeet}, ${name}! 🙏`)
      speak(`${t.niceToMeet}, ${name}!`, 'abe')
      return
    }

    // Show thinking
    setAbeAnim('thinking')
    setTimeout(() => {
      const responses = generateResponse(text, visitorName, getCurrentPageContext())
      setAbeAnim('idle')
      responses.forEach((resp, i) => {
        setTimeout(() => {
          addMsg(resp.speaker, resp.text)
          speak(resp.text, resp.speaker)
          // Handle actions
          if (resp.action === 'navigate' && resp.actionData) {
            setTimeout(() => router.push(resp.actionData!), 1000)
          } else if (resp.action === 'whatsapp') {
            setTimeout(() => window.open('https://wa.me/917200255252', '_blank'), 800)
          } else if (resp.action === 'call') {
            setTimeout(() => window.open('tel:+917200255252', '_self'), 800)
          } else if (resp.action === 'email') {
            setTimeout(() => window.open('mailto:info@ghlindia.com', '_self'), 800)
          } else if (resp.action === 'quiz') {
            setTimeout(() => {
              const quizBtn = document.querySelector('[data-quiz-trigger]') as HTMLButtonElement
              quizBtn?.click()
            }, 800)
          } else if (resp.action === 'calculator') {
            setTimeout(() => {
              const calcBtn = document.querySelector('[data-calc-trigger]') as HTMLButtonElement
              calcBtn?.click()
            }, 800)
          }
        }, i * 600)
      })

      // Ask name after first interaction if not known
      if (!visitorName && messages.length < 3) {
        setTimeout(() => {
          addMsg('tina', t.askName)
          speak(t.askName, 'tina')
        }, responses.length * 600 + 1500)
      }
    }, 800)
  }, [addMsg, messages, visitorName, speak, t, router])

  // ── Check mic permission on mount ──
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.permissions) return
    navigator.permissions.query({ name: 'microphone' as PermissionName }).then(result => {
      setMicPermission(result.state as 'granted' | 'denied' | 'prompt')
      result.onchange = () => setMicPermission(result.state as 'granted' | 'denied' | 'prompt')
    }).catch(() => {})
  }, [])

  // ── Auto-start listening when entering chat phase ──
  useEffect(() => {
    if (phase === 'chat' && ttsEnabled && !autoListenRef.current) {
      autoListenRef.current = true
      // Small delay to let TTS finish and UI settle
      const timer = setTimeout(() => {
        if (!isSpeaking && micPermission !== 'denied') {
          // Request mic permission silently if already granted, else skip
          if (micPermission === 'granted') {
            startListening()
          } else {
            navigator.mediaDevices?.getUserMedia({ audio: true }).then(() => {
              setMicPermission('granted')
              startListening()
            }).catch(() => {
              setMicPermission('denied')
            })
          }
        }
      }, 3000)
      return () => clearTimeout(timer)
    }
    if (phase !== 'chat') autoListenRef.current = false
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isSpeaking])

  // ── Voice input ──
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return

    // Stop any existing recognition
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }

    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.lang = lang === 'en' ? 'en-IN' : lang

    recognition.onstart = () => {
      setIsListening(true)
      setAbeAnim('listening')
      setTinaAnim('listening')
    }
    recognition.onresult = (e: any) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript
        if (e.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }
      setInputText(finalTranscript || interimTranscript)
      if (finalTranscript) {
        setIsListening(false)
        setAbeAnim('idle')
        setTinaAnim('idle')
        processInput(finalTranscript.trim())
      }
    }
    recognition.onerror = (e: any) => {
      setIsListening(false)
      setAbeAnim('idle')
      setTinaAnim('idle')
      if (e.error === 'not-allowed') {
        setMicPermission('denied')
      }
      // Auto-restart on recoverable errors after a delay
      if (e.error === 'network' || e.error === 'audio-capture') {
        setTimeout(() => {
          if (phase === 'chat' && ttsEnabled && !isSpeaking) startListening()
        }, 2000)
      }
    }
    recognition.onend = () => {
      setIsListening(false)
      setAbeAnim('idle')
      setTinaAnim('idle')
      // Auto-restart listening if in chat mode and voice enabled
      if (phase === 'chat' && ttsEnabled && !isSpeaking && micPermission === 'granted') {
        setTimeout(() => {
          if (phase === 'chat' && ttsEnabled && !isSpeaking) startListening()
        }, 1500)
      }
    }
    recognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
      // Already started - ignore
    }
  }, [lang, processInput, phase, ttsEnabled, isSpeaking, micPermission])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
      recognitionRef.current = null
    }
    setIsListening(false)
    setAbeAnim('idle')
    setTinaAnim('idle')
  }, [])

  const handleSend = () => {
    if (inputText.trim()) processInput(inputText)
  }

  // ── Hidden state ──
  if (phase === 'hidden') return null

  // ── Minimized state ──
  if (phase === 'minimized') {
    return (
      <div className="fixed z-[9995] flex flex-col gap-2" style={{ bottom: '200px', left: '24px' }}>
        <button
          onClick={() => setPhase('chat')}
          className="relative group"
          title={t.needHelp}
        >
          <div className="absolute inset-0 rounded-full bg-brand-red/20 animate-ping" style={{ animationDuration: '3s' }} />
          <MiniAbe />
        </button>
        <button
          onClick={() => setPhase('chat')}
          className="relative group"
          title={t.needHelp}
        >
          <MiniTina />
        </button>
        <span className="text-[8px] text-gray-500 text-center">{t.needHelp}</span>
      </div>
    )
  }

  // ── Greeting state ──
  if (phase === 'greeting') {
    return (
      <div className="fixed z-[9997] flex flex-col items-start gap-3 p-4" style={{ bottom: '200px', left: '16px', maxWidth: '380px' }}>
        {/* Avatars */}
        <div className="flex items-end gap-2">
          <AbeAvatar anim={abeAnim} size={100} />
          <TinaAvatar anim={tinaAnim} size={95} />
        </div>
        {/* Speech bubble */}
        <div className="rounded-2xl px-5 py-4 text-sm text-white leading-relaxed"
          style={{
            background: 'rgba(10,10,10,0.94)',
            backdropFilter: 'blur(28px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(208,2,27,0.1)',
          }}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <p className="text-gray-300 text-[13px] leading-relaxed whitespace-pre-wrap">
            {typewriterText}
            {!typewriterDone && <span className="animate-pulse">|</span>}
          </p>
          {typewriterDone && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleGreetingYes}
                className="flex-1 px-4 py-2.5 rounded-xl bg-brand-red hover:bg-red-700 text-white text-xs font-semibold transition-colors"
              >
                ✅ {t.yesHelp}
              </button>
              <button
                onClick={handleGreetingNo}
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 text-xs font-medium transition-colors border border-white/10"
              >
                🔕 {t.noThanks}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Language picker ──
  if (phase === 'langPick') {
    return (
      <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
      >
        <div className="w-full max-w-md rounded-3xl p-6"
          style={{
            background: 'rgba(10,10,10,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex items-center gap-3 mb-5">
            <Globe className="w-5 h-5 text-brand-red" />
            <h3 className="text-white text-lg font-bold">{t.chooseLang}</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => handleLangSelect(l.code)}
                className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  l.code === detectedLang
                    ? 'bg-brand-red/15 border-brand-red/40 ring-1 ring-brand-red/30'
                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                } border`}
              >
                <span className="text-lg">{l.flag}</span>
                <div>
                  <p className="text-xs text-white font-medium">{l.native}</p>
                  <p className="text-[10px] text-gray-500">{l.name}</p>
                </div>
                {l.code === detectedLang && (
                  <span className="ml-auto text-[8px] text-brand-red font-bold uppercase">{t.detectedForYou}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Full Chat Panel (capabilities + chat phases) ──
  return (
    <div
      className="fixed z-[9997] flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        bottom: '24px',
        left: '24px',
        width: '400px',
        maxWidth: 'calc(100vw - 48px)',
        height: '600px',
        maxHeight: 'calc(100vh - 48px)',
        background: 'rgba(10,10,10,0.94)',
        backdropFilter: 'blur(28px)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6), 0 0 40px rgba(208,2,27,0.1)',
      }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            <div className="w-7 h-7 rounded-full bg-[#333] border border-white/10 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 20 20" className="w-5 h-5"><circle cx="10" cy="8" r="4" fill="#B87A4B" /><ellipse cx="10" cy="5" rx="4" ry="2.5" fill="#1A1A1A" /></svg>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#1F3461] border border-white/10 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 20 20" className="w-5 h-5"><circle cx="10" cy="8" r="4" fill="#C4915A" /><ellipse cx="10" cy="5" rx="4.5" ry="3" fill="#1A1A1A" /></svg>
            </div>
          </div>
          <div>
            <span className="text-white text-xs font-bold">Abe & Tina</span>
            <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Language switcher */}
          <button
            onClick={() => setShowLangPicker(!showLangPicker)}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            title="Change language"
          >
            <Globe className="w-3.5 h-3.5" />
          </button>
          {/* TTS toggle */}
          <button
            onClick={() => { setTtsEnabled(!ttsEnabled); if (isSpeaking) window.speechSynthesis?.cancel() }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            {ttsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
          {/* Minimize */}
          <button onClick={() => { stopListening(); window.speechSynthesis?.cancel(); setPhase('minimized') }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          {/* Close */}
          <button onClick={() => { stopListening(); window.speechSynthesis?.cancel(); setPhase('hidden') }}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Inline language picker dropdown */}
      {showLangPicker && (
        <div className="absolute top-12 left-12 z-50 rounded-xl p-2 grid grid-cols-2 gap-1"
          style={{ background: 'rgba(10,10,10,0.98)', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
        >
          {LANGUAGES.map(l => (
            <button key={l.code} onClick={() => { setLang(l.code); setShowLangPicker(false) }}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] transition-colors ${
                l.code === lang ? 'bg-brand-red/20 text-brand-red' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{l.flag}</span>
              <span>{l.native}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Avatar viewport ── */}
      <div className="flex items-end justify-center gap-4 py-3 px-4 border-b border-white/5 shrink-0"
        style={{ background: 'linear-gradient(180deg, rgba(208,2,27,0.05) 0%, transparent 100%)' }}
      >
        <AbeAvatar anim={abeAnim} size={80} />
        <TinaAvatar anim={tinaAnim} size={75} />
      </div>

      {/* ── Chat area ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(208,2,27,0.2) transparent' }}>
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex gap-2 animate-[slideUp_0.3s_ease-out] ${msg.speaker === 'user' ? 'flex-row-reverse' : ''}`}
          >
            {/* Avatar icon */}
            {msg.speaker !== 'user' && (
              <div className="w-6 h-6 rounded-full shrink-0 mt-1 overflow-hidden flex items-center justify-center"
                style={{ background: msg.speaker === 'abe' ? '#333' : '#1F3461' }}
              >
                <span className="text-[8px] text-white font-bold">{msg.speaker === 'abe' ? 'A' : 'T'}</span>
              </div>
            )}
            {/* Bubble */}
            <div className={`max-w-[80%] rounded-xl px-3 py-2 ${
              msg.speaker === 'user'
                ? 'bg-brand-red/15 border border-brand-red/20 text-white'
                : 'bg-white/5 border border-white/5 text-gray-300'
            }`}>
              {msg.speaker !== 'user' && (
                <p className="text-[9px] text-gray-500 font-semibold mb-0.5 capitalize">{msg.speaker}</p>
              )}
              <p className="text-[12px] leading-relaxed">{msg.text}</p>
              {/* Replay speaker */}
              {msg.speaker !== 'user' && ttsEnabled && (
                <button onClick={() => speak(msg.text, msg.speaker as 'abe' | 'tina')}
                  className="mt-1 text-[9px] text-gray-600 hover:text-brand-red transition-colors flex items-center gap-0.5"
                >
                  <Volume2 className="w-2.5 h-2.5" /> Replay
                </button>
              )}
            </div>
          </div>
        ))}
        {/* Thinking indicator */}
        {abeAnim === 'thinking' && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-full bg-[#333] shrink-0 mt-1 flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">A</span>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* ── Quick actions ── */}
      {messages.length < 3 && (
        <div className="flex flex-wrap gap-1.5 px-3 py-2 border-t border-white/5 shrink-0">
          {t.quickActions.map(action => (
            <button
              key={action}
              onClick={() => processInput(action)}
              className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[10px] text-gray-400 hover:text-white transition-colors border border-white/5"
            >
              {action}
            </button>
          ))}
        </div>
      )}

      {/* ── Input bar ── */}
      <div className="flex items-center gap-2 px-3 py-3 border-t border-white/5 shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend() }}
          placeholder={t.typeOrSpeak}
          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand-red/40 transition-colors"
          dir={isRtl ? 'rtl' : 'ltr'}
        />
        {/* Mic button */}
        <button
          onClick={isListening ? stopListening : startListening}
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
            isListening
              ? 'bg-brand-red text-white shadow-[0_0_16px_rgba(208,2,27,0.5)] animate-pulse'
              : 'bg-brand-red/20 text-brand-red hover:bg-brand-red/30 hover:text-white border border-brand-red/30'
          }`}
        >
          <Mic className="w-4 h-4" />
        </button>
        {/* Send */}
        <button
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="w-9 h-9 rounded-xl flex items-center justify-center bg-brand-red hover:bg-red-700 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* ── Footer disclaimer ── */}
      <div className="px-3 py-1.5 border-t border-white/5 text-center shrink-0">
        <span className="text-[8px] text-gray-600">
          ⚠️ {t.disclaimer} · SEBI Reg: IN/AIF2/2425/1517 · {t.privacyPolicy}
        </span>
      </div>

      {/* Global animations */}
      <style jsx>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(8px) } to { opacity:1; transform:translateY(0) } }
      `}</style>
    </div>
  )
}
