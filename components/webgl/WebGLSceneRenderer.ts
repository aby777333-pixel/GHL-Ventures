/* ─────────────────────────────────────────────────────────────
   WebGLSceneRenderer — Singleton offscreen renderer manager

   Maintains a SINGLE WebGLRenderer that renders all registered
   scenes to an offscreen canvas, then blits each frame to the
   target visible <canvas> elements via drawImage().

   This avoids browser WebGL context limits (8-16 max).
   ───────────────────────────────────────────────────────────── */

import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Color,
} from 'three'

export interface RenderTarget {
  scene: Scene
  camera: PerspectiveCamera
  canvas: HTMLCanvasElement
  width: number
  height: number
  visible: boolean
  updateScene: (time: number, delta: number) => void
}

const FPS_CAP = 30
const FRAME_TIME = 1000 / FPS_CAP

class WebGLSceneRenderer {
  private static instance: WebGLSceneRenderer | null = null
  private renderer: WebGLRenderer | null = null
  private renderQueue = new Map<string, RenderTarget>()
  private rafId: number | null = null
  private lastFrameTime = 0
  private isMobile = false

  private constructor() {
    if (typeof window !== 'undefined') {
      this.isMobile = window.matchMedia('(max-width: 768px)').matches
    }
  }

  static getInstance(): WebGLSceneRenderer {
    if (!WebGLSceneRenderer.instance) {
      WebGLSceneRenderer.instance = new WebGLSceneRenderer()
    }
    return WebGLSceneRenderer.instance
  }

  get mobile(): boolean {
    return this.isMobile
  }

  private ensureRenderer(): WebGLRenderer | null {
    if (this.renderer) return this.renderer
    try {
      const canvas = document.createElement('canvas')
      this.renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !this.isMobile,
        powerPreference: 'low-power',
      })
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
      this.renderer.setClearColor(new Color(0x000000), 0)
    } catch {
      return null
    }
    return this.renderer
  }

  register(id: string, target: RenderTarget): void {
    this.renderQueue.set(id, target)
    if (this.rafId === null) this.startLoop()
  }

  unregister(id: string): void {
    this.renderQueue.delete(id)
    if (this.renderQueue.size === 0) this.stopLoop()
  }

  setVisible(id: string, visible: boolean): void {
    const t = this.renderQueue.get(id)
    if (t) t.visible = visible
  }

  updateSize(id: string, width: number, height: number): void {
    const t = this.renderQueue.get(id)
    if (t) {
      t.width = width
      t.height = height
      t.camera.aspect = width / height
      t.camera.updateProjectionMatrix()
    }
  }

  private startLoop(): void {
    const tick = (now: number) => {
      this.rafId = requestAnimationFrame(tick)

      if (now - this.lastFrameTime < FRAME_TIME) return
      const delta = (now - this.lastFrameTime) / 1000
      this.lastFrameTime = now

      const renderer = this.ensureRenderer()
      if (!renderer) return

      this.renderQueue.forEach((target) => {
        if (!target.visible || target.width === 0 || target.height === 0) return

        target.updateScene(now / 1000, delta)

        renderer.setSize(target.width, target.height, false)
        renderer.render(target.scene, target.camera)

        const ctx = target.canvas.getContext('2d')
        if (ctx) {
          target.canvas.width = target.width
          target.canvas.height = target.height
          ctx.clearRect(0, 0, target.width, target.height)
          ctx.drawImage(renderer.domElement, 0, 0)
        }
      })
    }

    this.rafId = requestAnimationFrame(tick)
  }

  private stopLoop(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
      this.rafId = null
    }
  }

  dispose(): void {
    this.stopLoop()
    this.renderQueue.clear()
    if (this.renderer) {
      this.renderer.dispose()
      this.renderer = null
    }
    WebGLSceneRenderer.instance = null
  }
}

export default WebGLSceneRenderer
