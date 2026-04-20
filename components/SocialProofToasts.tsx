'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname } from 'next/navigation'
import { X, User, CheckCircle } from 'lucide-react'

interface SocialProofEntry {
  city: string
  action: string
  timeAgo: string
}

// Mock data removed (2026-04-20) — previously seeded fake visitor-activity
// toasts to look socially active. Now an empty array; the widget renders
// nothing until a real activity feed is wired in.
const SOCIAL_PROOF_DATA: SocialProofEntry[] = []

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const SESSION_STORAGE_KEY = 'ghl-toast-count'
const MAX_TOASTS_PER_SESSION = 6

const PORTAL_PREFIXES = ['/staff', '/admin', '/dashboard']

export default function SocialProofToasts() {
  const pathname = usePathname()
  const isPortal = PORTAL_PREFIXES.some(p => pathname.startsWith(p))

  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [sessionCount, setSessionCount] = useState(0)
  const [shuffledData, setShuffledData] = useState<SocialProofEntry[]>([])
  const [isSliding, setIsSliding] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setShuffledData(shuffleArray(SOCIAL_PROOF_DATA))
    const stored = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (stored) {
      setSessionCount(parseInt(stored, 10))
    }
  }, [])

  const showToast = useCallback(() => {
    setIsSliding(true)
    setIsVisible(true)
    setDismissed(false)
  }, [])

  const hideToast = useCallback(() => {
    setIsSliding(false)
    setTimeout(() => {
      setIsVisible(false)
      setDismissed(false)
    }, 300)
  }, [])

  useEffect(() => {
    if (shuffledData.length === 0) return
    if (sessionCount >= MAX_TOASTS_PER_SESSION) return

    const initialDelay = setTimeout(() => {
      showToast()

      const newCount = sessionCount + 1
      setSessionCount(newCount)
      sessionStorage.setItem(SESSION_STORAGE_KEY, String(newCount))
    }, 15000)

    return () => clearTimeout(initialDelay)
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffledData])

  useEffect(() => {
    if (!isVisible) return

    const hideTimeout = setTimeout(() => {
      hideToast()
    }, 5000)

    return () => clearTimeout(hideTimeout)
  }, [isVisible, currentIndex, hideToast])

  useEffect(() => {
    if (isVisible) return
    if (shuffledData.length === 0) return
    if (sessionCount >= MAX_TOASTS_PER_SESSION) return
    if (currentIndex === 0 && sessionCount <= 1) return

    const randomDelay = 25000 + Math.random() * 15000

    const nextTimeout = setTimeout(() => {
      const nextIndex = (currentIndex + 1) % shuffledData.length
      setCurrentIndex(nextIndex)
      showToast()

      const newCount = sessionCount + 1
      setSessionCount(newCount)
      sessionStorage.setItem(SESSION_STORAGE_KEY, String(newCount))
    }, randomDelay)

    return () => clearTimeout(nextTimeout)
  }, [isVisible, currentIndex, sessionCount, shuffledData, showToast])

  const handleDismiss = () => {
    setDismissed(true)
    hideToast()
  }

  if (isPortal || !isVisible || shuffledData.length === 0) return null

  const entry = shuffledData[currentIndex]
  if (!entry || dismissed) return null

  return (
    <div
      className={`fixed z-[9990] transition-transform duration-300 ease-out ${
        isSliding ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
      }`}
      style={{ bottom: '216px', left: '24px' }}
    >
      <div className="relative bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl min-w-[300px] max-w-[360px] border border-gray-100 dark:border-white/10 overflow-hidden">
        {/* Left red accent border */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#C8102E]" />

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-3 h-3 text-gray-400 dark:text-white/40" />
        </button>

        <div className="flex items-start gap-3 pl-4 pr-8 py-3">
          {/* Avatar */}
          <div className="shrink-0 w-9 h-9 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
            <User className="w-4 h-4 text-gray-400 dark:text-white/40" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                An investor from {entry.city}
              </p>
              <CheckCircle className="w-[10px] h-[10px] text-green-500 shrink-0" />
            </div>
            <p className="text-xs text-gray-500 dark:text-white/50 mt-0.5">
              {entry.action}
            </p>
            <p className="text-xs text-gray-400 dark:text-white/30 mt-0.5">
              {entry.timeAgo}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
