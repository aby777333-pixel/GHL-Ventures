'use client'

/* WebGLVideoPresentation — Cinematic 3D animated investment overview.
   Replaces video placeholders with a WebGL-driven "AI video"
   combining GHL India Ventures investment content + ambient audio. */

import { useRef, useEffect, useState, useCallback } from 'react'
import { Play, Pause, Volume2, VolumeX, RotateCcw } from 'lucide-react'
import WebGLSceneRenderer from '../WebGLSceneRenderer'
import { useWebGLCapability } from '../useWebGLCapability'
import {
  createPresentationScene,
  DURATION,
  OVERLAY_CONTENT,
  type PresentationScene,
} from './InvestmentVideoScene'
import { PresentationAudio } from './PresentationAudio'

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

let idCounter = 0

interface Props {
  className?: string
  aspectRatio?: string
}

export default function WebGLVideoPresentation({
  className = '',
  aspectRatio = 'aspect-video',
}: Props) {
  const hasWebGL = useWebGLCapability()

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)
  const progressTrackRef = useRef<HTMLDivElement>(null)
  const timeRef = useRef<HTMLSpanElement>(null)
  const idRef = useRef(`webgl-video-${++idCounter}`)

  const sceneRef = useRef<PresentationScene | null>(null)
  const audioRef = useRef<PresentationAudio | null>(null)
  const playbackTimeRef = useRef(0)
  const isPlayingRef = useRef(false)
  const currentSegRef = useRef(-1)

  const [hasStarted, setHasStarted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentSegment, setCurrentSegment] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  /* ── IntersectionObserver ── */
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: '150px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  /* ── Scene init + register with singleton renderer ── */
  useEffect(() => {
    if (!hasWebGL) return
    let cancelled = false
    const id = idRef.current
    const renderer = WebGLSceneRenderer.getInstance()
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ps = createPresentationScene(renderer.mobile)
    sceneRef.current = ps

    const rect = container.getBoundingClientRect()
    const dpr = Math.min(window.devicePixelRatio, 1.5)
    const w = Math.round(rect.width * dpr)
    const h = Math.round(rect.height * dpr)

    // Wrapper: the renderer calls this each frame
    const updateScene = (_time: number, delta: number) => {
      if (isPlayingRef.current) {
        playbackTimeRef.current += delta
        if (playbackTimeRef.current >= DURATION) playbackTimeRef.current = 0
      }

      ps.update(playbackTimeRef.current)

      // Direct DOM update for progress (no React re-render)
      if (progressBarRef.current) {
        progressBarRef.current.style.width = `${(playbackTimeRef.current / DURATION) * 100}%`
      }
      if (timeRef.current) {
        timeRef.current.textContent = formatTime(playbackTimeRef.current)
      }

      // Segment change (triggers React re-render only when segment changes)
      const seg = ps.getSegmentIndex(playbackTimeRef.current)
      if (seg !== currentSegRef.current) {
        currentSegRef.current = seg
        setCurrentSegment(seg)
      }
    }

    renderer.register(id, {
      scene: ps.scene,
      camera: ps.camera,
      canvas,
      width: w,
      height: h,
      visible: false,
      updateScene,
    })

    ps.camera.aspect = rect.width / rect.height
    ps.camera.updateProjectionMatrix()

    return () => {
      cancelled = true
      renderer.unregister(id)
      ps.dispose()
      sceneRef.current = null
    }
  }, [hasWebGL])

  /* ── Visibility toggle ── */
  useEffect(() => {
    WebGLSceneRenderer.getInstance().setVisible(idRef.current, isVisible)
    // Auto-pause when off-screen
    if (!isVisible && isPlayingRef.current) {
      isPlayingRef.current = false
      setIsPlaying(false)
    }
  }, [isVisible])

  /* ── Resize ── */
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
        Math.round(height * dpr),
      )
    })
    ro.observe(container)
    return () => ro.disconnect()
  }, [])

  /* ── Cleanup audio on unmount ── */
  useEffect(() => {
    return () => { audioRef.current?.stop() }
  }, [])

  /* ── Controls ── */
  const handlePlay = useCallback(async () => {
    if (!hasStarted) setHasStarted(true)
    isPlayingRef.current = true
    setIsPlaying(true)
    // Start audio on first play (needs user gesture)
    if (!audioRef.current) {
      audioRef.current = new PresentationAudio()
      await audioRef.current.start()
    }
  }, [hasStarted])

  const handlePause = useCallback(() => {
    isPlayingRef.current = false
    setIsPlaying(false)
  }, [])

  const handleTogglePlay = useCallback(() => {
    if (isPlayingRef.current) handlePause()
    else handlePlay()
  }, [handlePlay, handlePause])

  const handleMuteToggle = useCallback(() => {
    if (audioRef.current) {
      const muted = audioRef.current.toggleMute()
      setIsMuted(muted)
    }
  }, [])

  const handleRestart = useCallback(() => {
    playbackTimeRef.current = 0
    currentSegRef.current = -1
    setCurrentSegment(0)
  }, [])

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const track = progressTrackRef.current
    if (!track) return
    const rect = track.getBoundingClientRect()
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    playbackTimeRef.current = pct * DURATION
  }, [])

  const overlay = OVERLAY_CONTENT[currentSegment] || OVERLAY_CONTENT[0]

  /* ── No WebGL fallback ── */
  if (!hasWebGL) {
    return (
      <div className={`relative ${aspectRatio} bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 rounded-2xl overflow-hidden ${className}`}>
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
          <p className="text-white/80 text-lg font-bold">GHL India Ventures Trust</p>
          <p className="text-white/60 text-sm mt-2">Category II AIF | SEBI Registered</p>
          <p className="text-white/40 text-xs mt-4">Video presentation requires WebGL support</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${aspectRatio} bg-black rounded-2xl overflow-hidden border border-white/10 ${className}`}
    >
      {/* WebGL Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: 'auto' }}
      />

      {/* Noise overlay for premium feel */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)' }}
      />

      {/* Text Overlay */}
      {hasStarted && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-6">
          <div
            key={currentSegment}
            className="animate-fadeSlideIn text-center"
          >
            <p className="text-white/90 text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
              {overlay.title}
            </p>
            <p className="text-white/70 text-sm sm:text-base md:text-lg mt-2">
              {overlay.subtitle}
            </p>
            <p className="text-white/50 text-xs sm:text-sm mt-1">
              {overlay.detail}
            </p>
          </div>
        </div>
      )}

      {/* Controls bar (visible after first play) */}
      {hasStarted && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent p-3 sm:p-4">
          {/* Progress track */}
          <div
            ref={progressTrackRef}
            className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer group"
            onClick={handleSeek}
          >
            <div
              ref={progressBarRef}
              className="h-full bg-brand-red rounded-full transition-none"
              style={{ width: '0%' }}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={handleTogglePlay}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying
                  ? <Pause className="w-3.5 h-3.5 text-white" />
                  : <Play className="w-3.5 h-3.5 text-white ml-0.5" />}
              </button>
              <button
                onClick={handleRestart}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                aria-label="Restart"
              >
                <RotateCcw className="w-3.5 h-3.5 text-white" />
              </button>
            </div>

            <span ref={timeRef} className="text-white/60 text-xs font-mono">
              0:00
            </span>

            <button
              onClick={handleMuteToggle}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted
                ? <VolumeX className="w-3.5 h-3.5 text-white" />
                : <Volume2 className="w-3.5 h-3.5 text-white" />}
            </button>
          </div>
        </div>
      )}

      {/* Initial big play button */}
      {!hasStarted && (
        <div
          className="absolute inset-0 flex items-center justify-center z-30 bg-black/30 cursor-pointer group"
          onClick={handlePlay}
        >
          <div className="w-20 h-20 bg-brand-red/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-brand-red/30 group-hover:scale-110 transition-all duration-300 shadow-lg shadow-brand-red/20">
            <Play className="w-8 h-8 text-brand-red ml-1" />
          </div>
          <p className="absolute bottom-6 text-white/50 text-xs">Click to play investment overview</p>
        </div>
      )}
    </div>
  )
}
