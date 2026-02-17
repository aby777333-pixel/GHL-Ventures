'use client'

import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/translations'

interface LanguageSelectorProps {
  selectedLanguage: LanguageCode
  onLanguageChange: (code: LanguageCode) => void
  compact?: boolean
}

export default function LanguageSelector({
  selectedLanguage,
  onLanguageChange,
  compact = false,
}: LanguageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const selectedLang = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === selectedLanguage
  )

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (compact) {
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-white text-xs"
          aria-label="Select language"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="uppercase font-medium tracking-wide">
            {selectedLanguage}
          </span>
        </button>

        {isOpen && (
          <div className="absolute bottom-full left-0 mb-2 w-[200px] bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
            <div className="py-1 max-h-[280px] overflow-y-auto">
              {SUPPORTED_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                    selectedLanguage === lang.code
                      ? 'bg-[#C8102E] text-white'
                      : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span className="text-sm font-medium">{lang.native}</span>
                  <span className="text-xs text-white/50">{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-[#1a1a1a] border border-white/10 hover:border-white/20 transition-colors text-white text-sm"
        aria-label="Select language"
      >
        <Globe className="w-4 h-4 text-white/50" />
        <span className="flex-1 text-left">
          {selectedLang ? `${selectedLang.native} (${selectedLang.label})` : 'Select Language'}
        </span>
        <svg
          className={`w-4 h-4 text-white/50 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
          <div className="py-1 max-h-[320px] overflow-y-auto">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  onLanguageChange(lang.code)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  selectedLanguage === lang.code
                    ? 'bg-[#C8102E] text-white'
                    : 'text-white/80 hover:bg-white/10'
                }`}
              >
                <span className="text-sm font-medium">{lang.native}</span>
                <span className="text-xs text-white/50">{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
