'use client'

/* Records a view, then tracks how far and how long the reader
   actually got. Everything is best-effort and wrapped so that a
   failure can never surface to the reader. Also paints the
   reading-progress bar. */

import { useEffect, useRef, useState } from 'react'
import { getSessionId, recordReadProgress, recordView } from '@/lib/blog/cmsService'

export default function BlogAnalytics({ slug, showProgressBar = true }: { slug: string; showProgressBar?: boolean }) {
  const [progress, setProgress] = useState(0)
  const started = useRef<number>(Date.now())
  const maxScroll = useRef(0)
  const sent = useRef(false)

  useEffect(() => {
    if (!slug) return
    const sid = getSessionId()
    started.current = Date.now()
    maxScroll.current = 0
    sent.current = false

    recordView(slug, sid)

    const onScroll = () => {
      const doc = document.documentElement
      const total = doc.scrollHeight - window.innerHeight
      const pct = total > 0 ? Math.min(100, Math.max(0, (window.scrollY / total) * 100)) : 0
      setProgress(pct)
      if (pct > maxScroll.current) maxScroll.current = pct
    }

    const flush = () => {
      if (sent.current) return
      sent.current = true
      const secs = (Date.now() - started.current) / 1000
      if (secs > 2) recordReadProgress(slug, sid, secs, maxScroll.current)
    }

    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }

    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', flush)
    onScroll()

    return () => {
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [slug])

  if (!showProgressBar) return null
  return <div className="blog-progress" style={{ width: `${progress}%` }} aria-hidden="true" />
}
