/* Portfolio Scene — 3D exploded pie chart (asset allocation) */

import {
  Scene, PerspectiveCamera, Group, Mesh, CylinderGeometry,
  MeshStandardMaterial, AmbientLight, PointLight,
} from 'three'
import type { SceneInstance } from './types'

const BRAND_RED = 0xD0021B
const GOLD = 0xD4A843

// Allocation segments: [label, percentage, color]
const SEGMENTS: [string, number, number][] = [
  ['Stressed RE', 0.35, 0xD0021B],
  ['Startups', 0.25, 0x7C3AED],
  ['Fixed Income', 0.20, 0x3B82F6],
  ['Direct RE', 0.15, 0x10B981],
  ['Cash', 0.05, 0x6B7280],
]

export default function createPortfolioScene(isMobile: boolean): SceneInstance {
  const scene = new Scene()
  const camera = new PerspectiveCamera(40, 1, 0.1, 100)
  camera.position.set(0, 2, 4)
  camera.lookAt(0, 0, 0)

  scene.add(new AmbientLight(0xffffff, 0.35))
  const topLight = new PointLight(GOLD, 1, 10)
  topLight.position.set(2, 3, 2)
  scene.add(topLight)
  const redLight = new PointLight(BRAND_RED, 0.4, 8)
  redLight.position.set(-2, 1, 1)
  scene.add(redLight)

  const group = new Group()
  scene.add(group)

  const slices: { mesh: Mesh; isExploded: boolean; baseY: number; angle: number }[] = []
  let currentAngle = 0

  SEGMENTS.forEach(([, pct, color], i) => {
    const thetaLength = pct * Math.PI * 2
    const geo = new CylinderGeometry(1, 1, 0.25, isMobile ? 16 : 24, 1, false, currentAngle, thetaLength)
    const mat = new MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.15,
      metalness: 0.3,
      roughness: 0.5,
    })
    const mesh = new Mesh(geo, mat)
    const isExploded = i === 0 // Largest segment pops out
    mesh.position.y = isExploded ? 0.2 : 0
    group.add(mesh)
    slices.push({ mesh, isExploded, baseY: isExploded ? 0.2 : 0, angle: currentAngle + thetaLength / 2 })
    currentAngle += thetaLength
  })

  // Slight tilt for 3D perspective
  group.rotation.x = -0.3

  function update(time: number) {
    group.rotation.y = time * 0.25

    slices.forEach(s => {
      if (s.isExploded) {
        s.mesh.position.y = s.baseY + Math.sin(time * 1.5) * 0.08
      }
    })
  }

  function dispose() {
    scene.traverse(obj => {
      if (obj instanceof Mesh) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
    })
  }

  return { scene, camera, update, dispose }
}
