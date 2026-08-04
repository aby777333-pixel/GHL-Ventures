'use client'

/* ────────────────────────────────────────────────────────────────
   ImageZoom — click-to-zoom lightbox for article images.

   Wraps a subtree and delegates clicks on any <img> inside it, so it
   works for the cover image, CMS-authored <img> tags inside
   .article-body (which are injected as raw HTML and therefore cannot
   carry React props) and the gallery — without touching any of them.

   Dependency-free and portalled to <body>: the article sits inside
   positioned/stacked ancestors, and the site has a fixed navbar plus
   the floating Smarty widget, so an in-place overlay would render
   underneath them.
   ──────────────────────────────────────────────────────────────── */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ZoomIn, ZoomOut, X, RotateCcw } from 'lucide-react'

const MIN_SCALE = 1
const MAX_SCALE = 6
const STEP = 0.5

interface Shot {
  src: string
  alt: string
}

interface Props {
  children: React.ReactNode
  /** Skip images smaller than this (icons, avatars, inline logos). */
  minWidth?: number
}

export default function ImageZoom({ children, minWidth = 200 }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const [shot, setShot] = useState<Shot | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null)
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null)

  useEffect(() => setMounted(true), [])

  const reset = useCallback(() => {
    setScale(1)
    setOffset({ x: 0, y: 0 })
  }, [])

  const close = useCallback(() => {
    setShot(null)
    reset()
  }, [reset])

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => {
      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(s + delta).toFixed(2)))
      if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
      return next
    })
  }, [])

  // ── Delegate clicks on images inside the wrapped subtree ──────
  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    const eligible = (img: HTMLImageElement) => {
      // Linked images keep their link; tiny images are chrome, not content.
      if (img.closest('a')) return false
      const w = img.naturalWidth || img.clientWidth
      return w >= minWidth
    }

    const onClick = (e: MouseEvent) => {
      const img = (e.target as HTMLElement)?.closest?.('img') as HTMLImageElement | null
      if (!img || !host.contains(img) || !eligible(img)) return
      e.preventDefault()
      setShot({ src: img.currentSrc || img.src, alt: img.alt || 'Article image' })
      setScale(1)
      setOffset({ x: 0, y: 0 })
    }

    // Affordance: only mark images we would actually open.
    const mark = () => {
      host.querySelectorAll('img').forEach((img) => {
        const el = img as HTMLImageElement
        el.style.cursor = eligible(el) ? 'zoom-in' : ''
      })
    }

    host.addEventListener('click', onClick)
    mark()
    // CMS HTML and lazy images settle after mount, so re-mark on changes.
    const mo = new MutationObserver(mark)
    mo.observe(host, { childList: true, subtree: true })
    const t = window.setTimeout(mark, 800)

    return () => {
      host.removeEventListener('click', onClick)
      mo.disconnect()
      window.clearTimeout(t)
    }
  }, [minWidth])

  // ── Keyboard + body scroll lock while open ────────────────────
  useEffect(() => {
    if (!shot) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === '+' || e.key === '=') zoomBy(STEP)
      else if (e.key === '-' || e.key === '_') zoomBy(-STEP)
      else if (e.key === '0') reset()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [shot, close, zoomBy, reset])

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    zoomBy(e.deltaY < 0 ? STEP : -STEP)
  }

  const onPointerDown = (e: React.PointerEvent) => {
    if (scale <= 1) return
    ;(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId)
    dragRef.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current
    if (!d) return
    setOffset({ x: d.ox + (e.clientX - d.x), y: d.oy + (e.clientY - d.y) })
  }
  const onPointerUp = () => { dragRef.current = null }

  // Two-finger pinch on touch devices.
  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 2) return
    const [a, b] = [e.touches[0], e.touches[1]]
    pinchRef.current = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), scale }
  }
  const onTouchMove = (e: React.TouchEvent) => {
    const p = pinchRef.current
    if (!p || e.touches.length !== 2) return
    const [a, b] = [e.touches[0], e.touches[1]]
    const dist = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, +(p.scale * (dist / p.dist)).toFixed(2)))
    setScale(next)
    if (next === MIN_SCALE) setOffset({ x: 0, y: 0 })
  }
  const onTouchEnd = () => { pinchRef.current = null }

  const btn: React.CSSProperties = {
    width: 38,
    height: 38,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    background: 'rgba(255,255,255,0.12)',
    color: '#FFFFFF',
    border: '1px solid rgba(255,255,255,0.18)',
    cursor: 'pointer',
  }

  const overlay = shot && (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={shot.alt}
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10050,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
    >
      {/* Controls */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ position: 'fixed', top: 16, right: 16, display: 'flex', gap: 8, zIndex: 1 }}
      >
        <button type="button" onClick={() => zoomBy(-STEP)} style={btn} aria-label="Zoom out" title="Zoom out (−)">
          <ZoomOut style={{ width: 18, height: 18 }} />
        </button>
        <button type="button" onClick={() => zoomBy(STEP)} style={btn} aria-label="Zoom in" title="Zoom in (+)">
          <ZoomIn style={{ width: 18, height: 18 }} />
        </button>
        <button type="button" onClick={reset} style={btn} aria-label="Reset zoom" title="Reset (0)">
          <RotateCcw style={{ width: 17, height: 17 }} />
        </button>
        <button type="button" onClick={close} style={btn} aria-label="Close" title="Close (Esc)">
          <X style={{ width: 19, height: 19 }} />
        </button>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onDoubleClick={() => (scale > 1 ? reset() : setScale(2.5))}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          touchAction: 'none',
          cursor: scale > 1 ? (dragRef.current ? 'grabbing' : 'grab') : 'zoom-in',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={shot.src}
          alt={shot.alt}
          draggable={false}
          style={{
            maxWidth: '94vw',
            maxHeight: '88vh',
            objectFit: 'contain',
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transition: dragRef.current ? 'none' : 'transform 140ms ease-out',
            userSelect: 'none',
          }}
        />
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 16,
          left: 0,
          right: 0,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.55)',
          fontSize: 11,
          pointerEvents: 'none',
        }}
      >
        {Math.round(scale * 100)}% · scroll or +/− to zoom · drag to pan · Esc to close
      </div>
    </div>
  )

  return (
    <div ref={hostRef}>
      {children}
      {mounted && overlay ? createPortal(overlay, document.body) : null}
    </div>
  )
}
