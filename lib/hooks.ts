'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

export function useIntersectionObserver(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    const current = ref.current
    if (current) observer.observe(current)
    return () => { if (current) observer.unobserve(current) }
  }, [threshold])

  return { ref, isVisible }
}

export function useCountUp(end: number, duration = 2000, start = 0) {
  const [count, setCount] = useState(start)
  const [hasStarted, setHasStarted] = useState(false)

  const startCounting = useCallback(() => {
    if (hasStarted) return
    setHasStarted(true)
    const startTime = Date.now()
    const tick = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(start + (end - start) * eased))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [end, duration, start, hasStarted])

  return { count, startCounting }
}

export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return progress
}
