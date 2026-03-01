import type { Scene, PerspectiveCamera } from 'three'

export interface SceneInstance {
  scene: Scene
  camera: PerspectiveCamera
  update: (time: number, delta: number) => void
  dispose: () => void
}

export type SceneFactory = (isMobile: boolean) => SceneInstance
