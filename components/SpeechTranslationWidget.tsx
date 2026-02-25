'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Languages, Mic, MicOff, Volume2, X, ChevronDown, ArrowRightLeft, Loader2 } from 'lucide-react'
import {
  isSarvamConfigured, sarvamTranslateText, sarvamTTS, playSarvamAudio,
  toSarvamLangCode, isSarvamTTSLanguage, SARVAM_AVATAR_VOICES,
} from '@/lib/sarvamService'

// ─── Language codes for translation ───
const TRANSLATION_LANGUAGES = [
  { code: 'en', label: 'English', speechCode: 'en-US', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'hi', label: 'Hindi', speechCode: 'hi-IN', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'ta', label: 'Tamil', speechCode: 'ta-IN', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'te', label: 'Telugu', speechCode: 'te-IN', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'kn', label: 'Kannada', speechCode: 'kn-IN', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'ml', label: 'Malayalam', speechCode: 'ml-IN', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'bn', label: 'Bengali', speechCode: 'bn-IN', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'gu', label: 'Gujarati', speechCode: 'gu-IN', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'mr', label: 'Marathi', speechCode: 'mr-IN', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'pa', label: 'Punjabi', speechCode: 'pa-IN', flag: '\u{1F1EE}\u{1F1F3}' },
  { code: 'es', label: 'Spanish', speechCode: 'es-ES', flag: '\u{1F1EA}\u{1F1F8}' },
  { code: 'fr', label: 'French', speechCode: 'fr-FR', flag: '\u{1F1EB}\u{1F1F7}' },
  { code: 'de', label: 'German', speechCode: 'de-DE', flag: '\u{1F1E9}\u{1F1EA}' },
  { code: 'ar', label: 'Arabic', speechCode: 'ar-SA', flag: '\u{1F1F8}\u{1F1E6}' },
  { code: 'ja', label: 'Japanese', speechCode: 'ja-JP', flag: '\u{1F1EF}\u{1F1F5}' },
  { code: 'zh', label: 'Chinese', speechCode: 'zh-CN', flag: '\u{1F1E8}\u{1F1F3}' },
  { code: 'pt', label: 'Portuguese', speechCode: 'pt-BR', flag: '\u{1F1E7}\u{1F1F7}' },
  { code: 'ru', label: 'Russian', speechCode: 'ru-RU', flag: '\u{1F1F7}\u{1F1FA}' },
  { code: 'ko', label: 'Korean', speechCode: 'ko-KR', flag: '\u{1F1F0}\u{1F1F7}' },
  { code: 'it', label: 'Italian', speechCode: 'it-IT', flag: '\u{1F1EE}\u{1F1F9}' },
]

interface TranslationEntry {
  id: number
  original: string
  translated: string
  sourceLang: string
  targetLang: string
}

let entryCounter = 0

export default function SpeechTranslationWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [sourceLang, setSourceLang] = useState('en')
  const [targetLang, setTargetLang] = useState('hi')
  const [interimText, setInterimText] = useState('')
  const [history, setHistory] = useState<TranslationEntry[]>([])
  const [showSourcePicker, setShowSourcePicker] = useState(false)
  const [showTargetPicker, setShowTargetPicker] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState('')

  const recognitionRef = useRef<any>(null)
  const synthRef = useRef<SpeechSynthesis | null>(null)
  const historyEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
    synthRef.current = window.speechSynthesis
  }, [])

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const getSourceLang = useCallback(() => {
    return TRANSLATION_LANGUAGES.find(l => l.code === sourceLang) || TRANSLATION_LANGUAGES[0]
  }, [sourceLang])

  const getTargetLang = useCallback(() => {
    return TRANSLATION_LANGUAGES.find(l => l.code === targetLang) || TRANSLATION_LANGUAGES[1]
  }, [targetLang])

  // Indian language codes that Sarvam supports for translation
  const SARVAM_LANG_CODES = ['en', 'hi', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'mr', 'pa']

  // Translate using Sarvam AI for Indian languages, MyMemory for others
  const translate = useCallback(async (text: string): Promise<string> => {
    // Use Sarvam for Indian language pairs
    const bothIndian = SARVAM_LANG_CODES.includes(sourceLang) && SARVAM_LANG_CODES.includes(targetLang)
    if (bothIndian && isSarvamConfigured()) {
      try {
        const result = await sarvamTranslateText(text, targetLang, sourceLang)
        if (result) return result
      } catch {
        // Fall through to MyMemory
      }
    }

    // Fallback: MyMemory free API (for non-Indian language pairs)
    try {
      const langPair = `${sourceLang}|${targetLang}`
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`
      const res = await fetch(url)
      const data = await res.json()
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translated = data.responseData.translatedText
        if (translated === text.toUpperCase()) return text
        return translated
      }
      return `[Translation unavailable: ${data.responseStatus}]`
    } catch {
      return '[Network error - check connection]'
    }
  }, [sourceLang, targetLang])

  // Speak translated text — prefer Sarvam TTS for Indian languages
  const speakTranslation = useCallback(async (text: string) => {
    const tLang = getTargetLang()

    // Try Sarvam TTS for supported Indian languages
    if (isSarvamConfigured() && isSarvamTTSLanguage(tLang.code)) {
      try {
        const audio = await sarvamTTS({
          text,
          targetLanguage: toSarvamLangCode(tLang.code),
          speaker: SARVAM_AVATAR_VOICES.tina,
        })
        if (audio) {
          await playSarvamAudio(audio)
          return
        }
      } catch {
        // Fall through to native TTS
      }
    }

    // Fallback: Web Speech API
    if (!synthRef.current) return
    synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = tLang.speechCode
    utterance.rate = 0.9
    utterance.pitch = 1

    const voices = synthRef.current.getVoices()
    const langPrefix = tLang.speechCode.split('-')[0]
    let voice = voices.find(v => v.lang === tLang.speechCode)
    if (!voice) voice = voices.find(v => v.lang.replace('_', '-') === tLang.speechCode)
    if (!voice) voice = voices.find(v => v.lang.startsWith(langPrefix + '-') || v.lang.startsWith(langPrefix + '_'))
    if (!voice) voice = voices.find(v => v.lang === langPrefix)
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    }

    synthRef.current.speak(utterance)
  }, [getTargetLang])

  // Process final transcript
  const processTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return
    setIsTranslating(true)
    setError('')

    try {
      const translated = await translate(text)
      const entry: TranslationEntry = {
        id: ++entryCounter,
        original: text,
        translated,
        sourceLang: getSourceLang().label,
        targetLang: getTargetLang().label,
      }
      setHistory(prev => [...prev.slice(-19), entry]) // Keep last 20
      speakTranslation(translated)
    } catch {
      setError('Translation failed. Please try again.')
    } finally {
      setIsTranslating(false)
      setInterimText('')
    }
  }, [translate, speakTranslation, getSourceLang, getTargetLang])

  // Start speech recognition
  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) {
      setError('Speech recognition not supported in this browser.')
      return
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.abort() } catch {}
    }

    const recognition = new SR()
    const sLang = getSourceLang()
    recognition.lang = sLang.speechCode
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => {
      setIsListening(false)
      setInterimText('')
    }
    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        setError('Microphone access denied. Please allow mic in browser settings.')
        setIsListening(false)
      } else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        setError(`Mic error: ${e.error}`)
      }
    }

    recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1]
      const transcript = result[0].transcript
      if (result.isFinal) {
        processTranscript(transcript)
      } else {
        setInterimText(transcript)
      }
    }

    recognitionRef.current = recognition

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        stream.getTracks().forEach(track => track.stop())
        try { recognition.start() } catch { setError('Could not start recognition.') }
      })
      .catch(() => setError('Microphone access denied.'))
  }, [getSourceLang, processTranscript])

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop() } catch {}
    }
    setIsListening(false)
    setInterimText('')
  }, [])

  const toggleListening = useCallback(() => {
    if (isListening) stopListening()
    else startListening()
  }, [isListening, startListening, stopListening])

  const swapLanguages = () => {
    const s = sourceLang
    setSourceLang(targetLang)
    setTargetLang(s)
    if (isListening) {
      stopListening()
      setTimeout(startListening, 300)
    }
  }

  const handleClose = () => {
    stopListening()
    if (synthRef.current) synthRef.current.cancel()
    setIsOpen(false)
    setShowSourcePicker(false)
    setShowTargetPicker(false)
  }

  if (!mounted) return null

  return (
    <>
      {/* ── Floating Trigger Button ── */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed z-[9988] flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium transition-all duration-300 hover:scale-105 group"
          style={{
            bottom: '28px',
            left: '180px',
            background: 'rgba(10,10,10,0.85)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(99,102,241,0.25)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
          title="Live Speech Translation"
        >
          <Languages className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-gray-300 group-hover:text-white transition-colors">Translate</span>
        </button>
      )}

      {/* ── Translation Panel ── */}
      <div
        className={`fixed z-[9989] transition-all duration-300 ${
          isOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
        style={{ bottom: '60px', left: '16px', width: '340px', maxHeight: '520px' }}
      >
        <div
          className="rounded-2xl overflow-hidden flex flex-col"
          style={{
            background: 'rgba(10,10,10,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99,102,241,0.2)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Languages className="w-3 h-3 text-indigo-400" />
              </div>
              <span className="text-white text-xs font-bold tracking-wide">LIVE TRANSLATE</span>
              {isListening && (
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[9px] text-red-400 font-medium">LIVE</span>
                </span>
              )}
            </div>
            <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Language Selectors */}
          <div className="px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              {/* Source language */}
              <div className="flex-1 relative">
                <button
                  onClick={() => { setShowSourcePicker(!showSourcePicker); setShowTargetPicker(false) }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white hover:bg-white/10 transition-colors"
                >
                  <span>{getSourceLang().flag} {getSourceLang().label}</span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
                {showSourcePicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-white/10 rounded-lg max-h-[200px] overflow-y-auto z-10 shadow-xl">
                    {TRANSLATION_LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { setSourceLang(lang.code); setShowSourcePicker(false) }}
                        className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-white/10 transition-colors ${sourceLang === lang.code ? 'text-indigo-400 font-bold' : 'text-gray-300'}`}
                      >
                        {lang.flag} {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Swap button */}
              <button
                onClick={swapLanguages}
                className="shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 hover:bg-indigo-500/30 flex items-center justify-center text-indigo-400 transition-colors"
                title="Swap languages"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
              </button>

              {/* Target language */}
              <div className="flex-1 relative">
                <button
                  onClick={() => { setShowTargetPicker(!showTargetPicker); setShowSourcePicker(false) }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] text-white hover:bg-white/10 transition-colors"
                >
                  <span>{getTargetLang().flag} {getTargetLang().label}</span>
                  <ChevronDown className="w-3 h-3 text-gray-500" />
                </button>
                {showTargetPicker && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-gray-900 border border-white/10 rounded-lg max-h-[200px] overflow-y-auto z-10 shadow-xl">
                    {TRANSLATION_LANGUAGES.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => { setTargetLang(lang.code); setShowTargetPicker(false) }}
                        className={`w-full text-left px-3 py-1.5 text-[11px] hover:bg-white/10 transition-colors ${targetLang === lang.code ? 'text-indigo-400 font-bold' : 'text-gray-300'}`}
                      >
                        {lang.flag} {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Translation History */}
          <div
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-[120px] max-h-[250px]"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(99,102,241,0.4) transparent' }}
          >
            {history.length === 0 && !interimText && !isTranslating && (
              <div className="text-center py-6">
                <Languages className="w-8 h-8 text-indigo-400/30 mx-auto mb-2" />
                <p className="text-gray-500 text-[11px]">
                  Tap the mic and speak in {getSourceLang().label}.
                  <br />Translation will appear in {getTargetLang().label}.
                </p>
                <p className="text-gray-600 text-[9px] mt-2">
                  Sarvam AI + MyMemory Translation | 20 languages
                </p>
              </div>
            )}

            {history.map(entry => (
              <div key={entry.id} className="space-y-1 animate-fade-in">
                {/* Original */}
                <div className="flex items-start gap-2">
                  <span className="text-[9px] text-gray-500 mt-0.5 shrink-0 w-[40px]">{entry.sourceLang.slice(0, 4)}</span>
                  <p className="text-[12px] text-gray-300 leading-relaxed">{entry.original}</p>
                </div>
                {/* Translation */}
                <div className="flex items-start gap-2">
                  <span className="text-[9px] text-indigo-400 mt-0.5 shrink-0 w-[40px]">{entry.targetLang.slice(0, 4)}</span>
                  <div className="flex items-start gap-1 flex-1">
                    <p className="text-[12px] text-indigo-300 leading-relaxed font-medium flex-1">{entry.translated}</p>
                    <button
                      onClick={() => speakTranslation(entry.translated)}
                      className="shrink-0 p-1 rounded hover:bg-white/10 text-indigo-400/60 hover:text-indigo-400 transition-colors"
                      title="Speak translation"
                    >
                      <Volume2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Interim text */}
            {interimText && (
              <div className="flex items-start gap-2 opacity-60">
                <span className="text-[9px] text-gray-500 mt-0.5 shrink-0 w-[40px]">...</span>
                <p className="text-[12px] text-gray-400 leading-relaxed italic">{interimText}</p>
              </div>
            )}

            {/* Translating indicator */}
            {isTranslating && (
              <div className="flex items-center gap-2 text-indigo-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[11px]">Translating...</span>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-[11px] text-red-400 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <div ref={historyEndRef} />
          </div>

          {/* Mic Controls */}
          <div className="px-4 py-3 border-t border-white/10">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={toggleListening}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                  isListening
                    ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-500/30'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
                }`}
                title={isListening ? 'Stop listening' : 'Start listening'}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[9px] text-gray-600 text-center mt-2">
              {isListening ? `Listening in ${getSourceLang().label}... Speak now!` : `Tap mic to speak in ${getSourceLang().label}`}
            </p>
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-white/5 text-center">
            <p className="text-[8px] text-gray-600">
              Powered by Sarvam AI + Web Speech API | Voice-to-voice translation
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
