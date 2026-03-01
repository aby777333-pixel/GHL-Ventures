'use client'

/* WebGLPlaceholderInner — Visible canvas component that registers with
   the singleton WebGLSceneRenderer. Loaded via next/dynamic { ssr: false }. */

import { useRef, useEffect, useState, useCallback } from 'react'
import WebGLSceneRenderer from './WebGLSceneRenderer'
import { loadScene } from './scenes'
import type { SceneInstance } from './scenes/types'

// Gradient fallback backgrounds (same as original PlaceholderImage)
const GRADIENTS: Record<string, string> = {
  'real-estate': 'from-amber-900/60 via-red-900/40 to-gray-900/80',
  'startup': 'from-indigo-900/60 via-purple-900/40 to-gray-900/80',
  'finance': 'from-emerald-900/60 via-teal-900/40 to-gray-900/80',
  'team': 'from-slate-700/60 via-gray-800/40 to-gray-900/80',
  'analytics': 'from-blue-900/60 via-cyan-900/40 to-gray-900/80',
  'compliance': 'from-red-900/60 via-rose-900/40 to-gray-900/80',
  'education': 'from-violet-900/60 via-purple-900/40 to-gray-900/80',
  'portfolio': 'from-orange-900/60 via-amber-900/40 to-gray-900/80',
  'location': 'from-green-900/60 via-emerald-900/40 to-gray-900/80',
  'fund': 'from-yellow-900/60 via-amber-900/40 to-gray-900/80',
  'default': 'from-gray-800/60 via-gray-900/40 to-black/80',
}

interface Props {
  theme?: string
  aspectRatio?: string
  label?: string
  className?: string
  overlay?: boolean
}

let idCounter = 0

export default function WebGLPlaceholderInner({
  theme = 'default',
  aspectRatio = 'aspect-video',
  label,
  className = '',
  overlay = true,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sceneRef = useRef<SceneInstance | null>(null)
  const idRef = useRef(`webgl-${++idCounter}`)
  const [loaded, setLoaded] = useState(false)

  const gradient = GRADIENTS[theme] || GRADIENTS.default

  // Intersection observer for visibility
  const [isVisible, setIsVisible] = useState(false)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '150px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Load scene and register with renderer
  useEffect(() => {
    let cancelled = false
    const id = idRef.current
    const renderer = WebGLSceneRenderer.getInstance()

    async function init() {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const factory = await loadScene(theme)
      if (cancelled) return

      const instance = factory(renderer.mobile)
      sceneRef.current = instance

      const rect = container.getBoundingClientRect()
      const width = Math.round(rect.width * Math.min(window.devicePixelRatio, 1.5))
      const height = Math.round(rect.height * Math.min(window.devicePixelRatio, 1.5))

      renderer.register(id, {
        scene: instance.scene,
        camera: instance.camera,
        canvas,
        width,
        height,
        visible: false, // will be set by visibility effect
        updateScene: instance.update,
      })

      // Update camera aspect
      instance.camera.aspect = rect.width / rect.height
      instance.camera.updateProjectionMatrix()

      setLoaded(true)
    }

    init()

    return () => {
      cancelled = true
      renderer.unregister(id)
      sceneRef.current?.dispose()
    }
  }, [theme])

  // Visibility toggle
  useEffect(() => {
    WebGLSceneRenderer.getInstance().setVisible(idRef.current, isVisible)
  }, [isVisible])

  // Resize observer
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const ro = new ResizeObserver(entries => {
      const entry = entries[0]
      if (!entry) return
      const { width, height } = entry.contentRect
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      WebGLSceneRenderer.getInstance().updateSize(
        idRef.current,
        Math.round(width * dpr),
        Math.round(height * dpr)
      )
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      ref={containerRef}
      className={`relative ${aspectRatio} bg-gradient-to-br ${gradient} rounded-lg overflow-hidden ${className}`}
    >
      {/* Canvas for WebGL output */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ imageRendering: 'auto' }}
      />

      {/* Subtle noise overlay for premium feel */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette edge */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)',
      }} />

      {/* Label */}
      {label && overlay && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 z-10">
          <p className="text-white/70 text-xs font-medium">{label}</p>
        </div>
      )}
    </div>
  )
}
