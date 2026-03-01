'use client'

/* CinematicHeroVideo — Hollywood-style 3D animated video for home page hero.
   Enhanced version of WebGLVideoPresentation with India-themed cinematic scene,
   dramatic lighting, spline camera, and deeper ambient audio. */

import { useRef, useEffect, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import WebGLSceneRenderer from '../WebGLSceneRenderer'
import { useWebGLCapability } from '../useWebGLCapability'
import {
  createCinematicScene,
  HERO_DURATION,
  HERO_OVERLAYS,
  type CinematicScene,
} from './CinematicHeroScene'
import { PresentationAudio } from './PresentationAudio'

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`
}

let idC = 0

export default function CinematicHeroVideo({ className = '' }: { className?: string }) {
  const hasWebGL = useWebGLCapability()
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)
  const idRef = useRef(`hero-vid-${++idC}`)

  const sceneRef = useRef<CinematicScene | null>(null)
  const audioRef = useRef<PresentationAudio | null>(null)
  const ptRef = useRef(0) // playback time
  const playRef = useRef(false)
  const segRef = useRef(-1)

  const [started, setStarted] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(false)
  const [seg, setSeg] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: '200px' })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    if (!hasWebGL) return
    const id = idRef.current
    const renderer = WebGLSceneRenderer.getInstance()
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ps = createCinematicScene(renderer.mobile)
    sceneRef.current = ps

    const rect = container.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio, 1.5)
    const w = Math.round(rect.width * dpr)
    const h = Math.round(rect.height * dpr)

    const updateScene = (_t: number, delta: number) => {
      if (playRef.current) {
        ptRef.current += delta
        if (ptRef.current >= HERO_DURATION) ptRef.current = 0
      }
      ps.update(ptRef.current)

      if (progressRef.current)
        progressRef.current.style.width = `${(ptRef.current / HERO_DURATION) * 100}%`
      if (timeRef.current)
        timeRef.current.textContent = fmt(ptRef.current)

      const s = ps.getSegmentIndex(ptRef.current)
      if (s !== segRef.current) { segRef.current = s; setSeg(s) }
    }

    renderer.register(id, {
      scene: ps.scene, camera: ps.camera, canvas, width: w, height: h,
      visible: false, updateScene,
    })
    ps.camera.aspect = rect.width / rect.height
    ps.camera.updateProjectionMatrix()

    return () => { renderer.unregister(id); ps.dispose(); sceneRef.current = null }
  }, [hasWebGL])

  useEffect(() => {
    WebGLSceneRenderer.getInstance().setVisible(idRef.current, visible)
    if (!visible && playRef.current) { playRef.current = false; setPlaying(false) }
  }, [visible])

  useEffect(() => {
    const c = containerRef.current
    if (!c) return
    const ro = new ResizeObserver(entries => {
      const e = entries[0]; if (!e) return
      const { width, height } = e.contentRect
      const dpr = Math.min(window.devicePixelRatio, 1.5)
      WebGLSceneRenderer.getInstance().updateSize(idRef.current, Math.round(width * dpr), Math.round(height * dpr))
    })
    ro.observe(c)
    return () => ro.disconnect()
  }, [])

  useEffect(() => () => { audioRef.current?.stop() }, [])

  const doPlay = useCallback(async () => {
    if (!started) setStarted(true)
    playRef.current = true; setPlaying(true)
    if (!audioRef.current) {
      audioRef.current = new PresentationAudio()
      await audioRef.current.start()
    }
  }, [started])

  const doPause = useCallback(() => { playRef.current = false; setPlaying(false) }, [])
  const toggle = useCallback(() => { playRef.current ? doPause() : doPlay() }, [doPlay, doPause])
  const doMute = useCallback(() => { if (audioRef.current) setMuted(audioRef.current.toggleMute()) }, [])
  const doRestart = useCallback(() => { ptRef.current = 0; segRef.current = -1; setSeg(0) }, [])
  const doSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const t = trackRef.current; if (!t) return
    const r = t.getBoundingClientRect()
    ptRef.current = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * HERO_DURATION
  }, [])

  const ov = HERO_OVERLAYS[seg] || HERO_OVERLAYS[0]

  if (!hasWebGL) {
    return (
      <div className={`relative aspect-[21/9] bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 rounded-3xl overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <p className="text-white/90 text-2xl font-bold">GHL India Ventures Trust</p>
          <p className="text-white/60 text-base mt-2">India&apos;s Alternative Investment Frontier</p>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className={`relative aspect-video rounded-3xl overflow-hidden border border-white/10 bg-black ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ imageRendering: 'auto' }} />

      {/* Cinematic vignette */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.6) 100%)',
      }} />

      {/* Film grain */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")` }} />

      {/* Text Overlay */}
      {started && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-8">
          <div key={seg} className="animate-fadeSlideIn text-center">
            <p className="text-white/95 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight drop-shadow-lg">{ov.title}</p>
            <p className="text-white/75 text-sm sm:text-base md:text-lg mt-2 drop-shadow-md">{ov.subtitle}</p>
            <p className="text-white/50 text-xs sm:text-sm mt-1">{ov.detail}</p>
          </div>
        </div>
      )}

      {/* Controls */}
      {started && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 sm:p-5">
          <div ref={trackRef} className="w-full h-1.5 bg-white/15 rounded-full mb-3 cursor-pointer" onClick={doSeek}>
            <div ref={progressRef} className="h-full bg-brand-red rounded-full transition-none" style={{ width: '0%' }} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={toggle} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label={playing ? 'Pause' : 'Play'}>
                {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
              </button>
              <button onClick={doRestart} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label="Restart">
                <RotateCcw className="w-4 h-4 text-white" />
              </button>
            </div>
            <span ref={timeRef} className="text-white/50 text-xs font-mono">0:00</span>
            <button onClick={doMute} className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors" aria-label={muted ? 'Unmute' : 'Mute'}>
              {muted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      )}

      {/* Big play button */}
      {!started && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/40 cursor-pointer group" onClick={doPlay}>
          <div className="relative">
            <div className="absolute -inset-5 w-32 h-32 rounded-full bg-brand-red/15 animate-ping" style={{ animationDuration: '2.5s' }} />
            <div className="relative w-24 h-24 bg-brand-red/20 backdrop-blur-md rounded-full flex items-center justify-center group-hover:bg-brand-red/30 group-hover:scale-110 transition-all duration-300 shadow-2xl shadow-brand-red/30 border border-brand-red/20">
              <Play className="w-10 h-10 text-brand-red ml-1" />
            </div>
          </div>
          <p className="absolute bottom-8 text-white/40 text-xs tracking-widest uppercase">Watch the GHL India Ventures Story</p>
        </div>
      )}
    </div>
  )
}
