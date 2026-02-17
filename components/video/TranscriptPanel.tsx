'use client'

import { useRef, useEffect } from 'react'
import { CONVERSATION_SCRIPT, SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/translations'

interface TranscriptPanelProps {
  isOpen: boolean
  languageCode: LanguageCode
  currentIndex: number
}

export default function TranscriptPanel({
  isOpen,
  languageCode,
  currentIndex,
}: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const selectedLang = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === languageCode
  )

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      })
    }
  }, [currentIndex])

  if (!isOpen) return null

  const visibleEntries = CONVERSATION_SCRIPT.slice(0, currentIndex + 1)

  return (
    <div
      className="w-[280px] bg-[#0d0d0d] border-l border-white/10 flex flex-col h-full transition-transform duration-300 ease-in-out"
      style={{
        transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
      }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between shrink-0">
        <h3 className="text-white text-sm font-semibold">Live Transcript</h3>
        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#C8102E]/20 text-[#C8102E] font-medium border border-[#C8102E]/30">
          {selectedLang?.native || languageCode.toUpperCase()}
        </span>
      </div>

      {/* Transcript entries */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 space-y-4"
      >
        {visibleEntries.map((entry, index) => {
          const translatedText =
            entry.translations[languageCode] || entry.translations.en
          const englishText = entry.translations.en

          return (
            <div key={index} className="group">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-[#C8102E]">
                  {entry.time}
                </span>
                <span
                  className={`text-[10px] font-semibold uppercase tracking-wider ${
                    entry.speaker === 'advisor'
                      ? 'text-white/70'
                      : 'text-blue-400/70'
                  }`}
                >
                  {entry.speaker === 'advisor' ? 'Advisor' : 'Investor'}
                </span>
              </div>
              {languageCode !== 'en' && (
                <p className="text-[11px] text-white/40 leading-relaxed mb-0.5">
                  {englishText}
                </p>
              )}
              <p className="text-[12px] text-white font-medium leading-relaxed">
                {translatedText}
              </p>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 shrink-0">
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[10px] text-white/40">
            AI-Powered Translation
          </span>
        </div>
      </div>
    </div>
  )
}
