/* Location Scene — India map outline, glowing city markers, connection arcs */

import {
  Scene, PerspectiveCamera, Group, Mesh, SphereGeometry,
  MeshStandardMaterial, AmbientLight, PointLight, Line,
  BufferGeometry, Float32BufferAttribute, LineBasicMaterial,
  Points, PointsMaterial, CatmullRomCurve3, Vector3,
} from 'three'
import type { SceneInstance } from './types'

const BRAND_RED = 0xD0021B
const EMERALD = 0x10B981

// Simplified India outline (normalized -1.5 to 1.5)
const INDIA_OUTLINE: [number, number][] = [
  [0.0, 1.4], [0.4, 1.35], [0.6, 1.2], [0.9, 1.3], [1.1, 1.1],
  [1.2, 0.9], [1.0, 0.6], [1.3, 0.4], [1.2, 0.1], [1.0, -0.2],
  [0.9, -0.5], [0.7, -0.8], [0.5, -1.1], [0.2, -1.3], [0.0, -1.4],
  [-0.2, -1.2], [-0.3, -0.9], [-0.5, -0.5], [-0.7, -0.2], [-0.9, 0.1],
  [-1.0, 0.4], [-0.9, 0.7], [-0.7, 1.0], [-0.5, 1.2], [-0.2, 1.35],
  [0.0, 1.4],
]

// Cities (normalized coordinates)
const CITIES: { name: string; pos: [number, number]; color: number }[] = [
  { name: 'Chennai', pos: [0.6, -0.6], color: BRAND_RED },
  { name: 'Mumbai', pos: [-0.8, 0.2], color: 0xF59E0B },
  { name: 'Pune', pos: [-0.5, -0.05], color: EMERALD },
]

export default function createLocationScene(isMobile: boolean): SceneInstance {
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 4)

  scene.add(new AmbientLight(0xffffff, 0.25))
  const mainLight = new PointLight(BRAND_RED, 0.8, 10)
  mainLight.position.set(0, 2, 3)
  scene.add(mainLight)

  const group = new Group()
  scene.add(group)

  // India outline
  const outlinePositions = new Float32Array(INDIA_OUTLINE.length * 3)
  INDIA_OUTLINE.forEach(([x, y], i) => {
    outlinePositions[i * 3] = x
    outlinePositions[i * 3 + 1] = y
    outlinePositions[i * 3 + 2] = 0
  })
  const outlineGeo = new BufferGeometry()
  outlineGeo.setAttribute('position', new Float32BufferAttribute(outlinePositions, 3))
  const outlineMat = new LineBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.5 })
  const outline = new Line(outlineGeo, outlineMat)
  group.add(outline)

  // City markers
  const cityMeshes: { mesh: Mesh; glow: Mesh; pos: [number, number] }[] = []
  CITIES.forEach(city => {
    const dotGeo = new SphereGeometry(0.06, 8, 8)
    const dotMat = new MeshStandardMaterial({ color: city.color, emissive: city.color, emissiveIntensity: 0.6 })
    const dot = new Mesh(dotGeo, dotMat)
    dot.position.set(city.pos[0], city.pos[1], 0.05)
    group.add(dot)

    const glowGeo = new SphereGeometry(0.14, 8, 8)
    const glowMat = new MeshStandardMaterial({ color: city.color, emissive: city.color, emissiveIntensity: 0.3, transparent: true, opacity: 0.2 })
    const glow = new Mesh(glowGeo, glowMat)
    glow.position.set(city.pos[0], city.pos[1], 0.05)
    group.add(glow)

    cityMeshes.push({ mesh: dot, glow, pos: city.pos })
  })

  // Connection arcs between cities
  const arcLines: Line[] = []
  for (let i = 0; i < CITIES.length; i++) {
    for (let j = i + 1; j < CITIES.length; j++) {
      const start = new Vector3(CITIES[i].pos[0], CITIES[i].pos[1], 0.05)
      const end = new Vector3(CITIES[j].pos[0], CITIES[j].pos[1], 0.05)
      const mid = start.clone().add(end).multiplyScalar(0.5)
      mid.z = 0.5 // arc height
      const curve = new CatmullRomCurve3([start, mid, end])
      const points = curve.getPoints(isMobile ? 20 : 30)
      const arcPositions = new Float32Array(points.length * 3)
      points.forEach((p, k) => {
        arcPositions[k * 3] = p.x
        arcPositions[k * 3 + 1] = p.y
        arcPositions[k * 3 + 2] = p.z
      })
      const arcGeo = new BufferGeometry()
      arcGeo.setAttribute('position', new Float32BufferAttribute(arcPositions, 3))
      const arcMat = new LineBasicMaterial({ color: BRAND_RED, transparent: true, opacity: 0.3 })
      const arc = new Line(arcGeo, arcMat)
      arc.geometry.setDrawRange(0, 0)
      group.add(arc)
      arcLines.push(arc)
    }
  }

  let elapsed = 0

  function update(time: number, delta: number) {
    elapsed += delta

    // City markers pulse
    cityMeshes.forEach((c, i) => {
      const pulse = 1 + Math.sin(time * 2 + i * 1.5) * 0.15
      c.glow.scale.setScalar(pulse)
      const mat = c.glow.material as MeshStandardMaterial
      mat.opacity = 0.15 + Math.sin(time * 2 + i * 1.5) * 0.1
    })

    // Arc draw animation
    arcLines.forEach((arc, i) => {
      const delay = i * 0.3
      if (elapsed > delay) {
        const progress = Math.min(1, (elapsed - delay) * 0.8)
        const totalPoints = arc.geometry.attributes.position.count
        arc.geometry.setDrawRange(0, Math.floor(progress * totalPoints))
      }
    })

    group.rotation.y = Math.sin(time * 0.1) * 0.08
  }

  function dispose() {
    scene.traverse(obj => {
      if (obj instanceof Mesh || obj instanceof Line || obj instanceof Points) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
    })
  }

  return { scene, camera, update, dispose }
}
