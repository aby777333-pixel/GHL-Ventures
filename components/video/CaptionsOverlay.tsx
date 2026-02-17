'use client'

import { useState, useEffect, useCallback } from 'react'
import { CONVERSATION_SCRIPT, type LanguageCode } from '@/lib/translations'

interface CaptionsOverlayProps {
  isActive: boolean
  languageCode: LanguageCode
}

export default function CaptionsOverlay({
  isActive,
  languageCode,
}: CaptionsOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  const cycleCaption = useCallback(() => {
    setIsVisible(false)
    const fadeTimeout = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % CONVERSATION_SCRIPT.length)
      setIsVisible(true)
    }, 400)
    return fadeTimeout
  }, [])

  useEffect(() => {
    if (!isActive) return

    const interval = setInterval(() => {
      cycleCaption()
    }, 4000)

    return () => clearInterval(interval)
  }, [isActive, cycleCaption])

  useEffect(() => {
    if (isActive) {
      setCurrentIndex(0)
      setIsVisible(true)
    }
  }, [isActive])

  if (!isActive) return null

  const entry = CONVERSATION_SCRIPT[currentIndex]
  if (!entry) return null

  const speakerLabel = entry.speaker === 'advisor' ? 'GHL Advisor' : 'Investor'
  const translatedText = entry.translations[languageCode] || entry.translations.en

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20">
      <div className="bg-black/70 backdrop-blur-sm px-4 py-3">
        <div
          className="max-w-[600px] mx-auto transition-opacity duration-300 ease-in-out"
          style={{ opacity: isVisible ? 1 : 0 }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                entry.speaker === 'advisor'
                  ? 'text-[#C8102E]'
                  : 'text-blue-400'
              }`}
            >
              {speakerLabel}
            </span>
            <span className="text-[10px] text-white/40 font-mono">
              {entry.time}
            </span>
          </div>
          <p className="text-[13px] text-white leading-relaxed">
            {translatedText}
          </p>
        </div>
        <div className="absolute bottom-1 right-3">
          <span className="text-[8px] text-white/30">
            Powered by AI Translation
          </span>
        </div>
      </div>
    </div>
  )
}
