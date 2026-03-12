'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Mic, MicOff, Loader2, Globe } from 'lucide-react'
import { speechToText, SARVAM_LANGUAGES, type SarvamLanguageCode } from '@/lib/sarvam/sarvamService'

interface VoiceInputProps {
  /** Called with transcribed text */
  onTranscript: (text: string) => void
  /** Optional language code (auto-detect if not set) */
  language?: SarvamLanguageCode
  /** Show language selector */
  showLanguageSelector?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Additional className */
  className?: string
  /** Theme: dark or teal */
  theme?: 'dark' | 'teal'
  /** Compact mode (icon only) */
  compact?: boolean
}

export default function VoiceInput({
  onTranscript,
  language: defaultLanguage,
  showLanguageSelector = false,
  placeholder = 'Press to speak...',
  className = '',
  theme = 'dark',
  compact = false,
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [language, setLanguage] = useState<SarvamLanguageCode>(defaultLanguage || 'en-IN')
  const [error, setError] = useState<string | null>(null)
  const [showLangDropdown, setShowLangDropdown] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const accentColor = theme === 'teal' ? 'teal' : 'red'

  const startRecording = useCallback(async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop())
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })

        if (audioBlob.size < 100) {
          setError('Recording too short')
          return
        }

        setIsProcessing(true)
        try {
          const result = await speechToText(audioBlob, { language_code: language })
          if (result.transcript) {
            onTranscript(result.transcript)
          } else {
            setError('No speech detected')
          }
        } catch (err: any) {
          setError(err.message || 'Speech recognition failed')
        } finally {
          setIsProcessing(false)
        }
      }

      mediaRecorder.start(250)
      setIsRecording(true)
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setError('Microphone access denied')
      } else {
        setError('Microphone not available')
      }
    }
  }, [language, onTranscript])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  // Auto-stop after 30 seconds
  useEffect(() => {
    if (!isRecording) return
    const timer = setTimeout(stopRecording, 30000)
    return () => clearTimeout(timer)
  }, [isRecording, stopRecording])

  const selectedLang = (SARVAM_LANGUAGES as readonly { code: string; name: string; nativeName: string }[]).find(l => l.code === language)

  if (compact) {
    return (
      <div className={`relative inline-flex items-center gap-1 ${className}`}>
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`p-2 rounded-lg transition-all ${
            isRecording
              ? `bg-${accentColor}-500/20 text-${accentColor}-400 animate-pulse ring-2 ring-${accentColor}-500/40`
              : isProcessing
                ? 'bg-white/[0.06] text-gray-500 cursor-wait'
                : `hover:bg-white/[0.08] text-gray-400 hover:text-${accentColor}-400`
          }`}
          title={isRecording ? 'Stop recording' : isProcessing ? 'Processing...' : `Voice input (${selectedLang?.name || 'English'})`}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </button>
        {error && (
          <span className="text-[10px] text-red-400 absolute -bottom-4 left-0 whitespace-nowrap">{error}</span>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        {/* Record Button */}
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            isRecording
              ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500/40 animate-pulse'
              : isProcessing
                ? 'bg-white/[0.06] text-gray-500 cursor-wait'
                : `bg-white/[0.06] text-gray-300 hover:bg-white/[0.10] hover:text-white`
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
          <span>
            {isRecording ? 'Stop' : isProcessing ? 'Processing...' : placeholder}
          </span>
        </button>

        {/* Language selector */}
        {showLanguageSelector && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs text-gray-400 bg-white/[0.04] border border-white/[0.08] hover:border-white/[0.15] transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>{selectedLang?.nativeName || selectedLang?.name}</span>
            </button>
            {showLangDropdown && (
              <div className="absolute bottom-full left-0 mb-1 w-56 max-h-[240px] overflow-y-auto bg-[#111] border border-white/[0.10] rounded-xl shadow-2xl z-50">
                {(SARVAM_LANGUAGES as readonly { code: string; name: string; nativeName: string }[]).map(lang => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => { setLanguage(lang.code as SarvamLanguageCode); setShowLangDropdown(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-white/[0.06] ${
                      language === lang.code ? 'text-white bg-white/[0.04]' : 'text-gray-400'
                    }`}
                  >
                    <span className="font-medium">{lang.nativeName}</span>
                    <span className="text-gray-600 ml-auto">{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Recording indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          Recording... speak now
        </div>
      )}
    </div>
  )
}
