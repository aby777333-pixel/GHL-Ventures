/* Analytics Scene — 3D bar chart with animated data, line overlay */

import {
  Scene, PerspectiveCamera, Group, Mesh, BoxGeometry,
  MeshStandardMaterial, AmbientLight, PointLight, Line,
  BufferGeometry, Float32BufferAttribute, LineBasicMaterial,
  Points, PointsMaterial,
} from 'three'
import type { SceneInstance } from './types'

const BRAND_RED = 0xD0021B
const CYAN = 0x06B6D4
const EMERALD = 0x10B981

export default function createAnalyticsScene(isMobile: boolean): SceneInstance {
  const scene = new Scene()
  const camera = new PerspectiveCamera(40, 1, 0.1, 100)
  camera.position.set(0, 0.5, 5)

  scene.add(new AmbientLight(0xffffff, 0.3))
  const topLight = new PointLight(CYAN, 1, 10)
  topLight.position.set(1, 3, 3)
  scene.add(topLight)
  const sideLight = new PointLight(BRAND_RED, 0.6, 8)
  sideLight.position.set(-2, 0, 2)
  scene.add(sideLight)

  const group = new Group()
  group.position.set(-1.2, -0.8, 0)
  scene.add(group)

  // Data
  const values = [0.35, 0.52, 0.44, 0.68, 0.58, 0.75, 0.82, 0.7, 0.95, 1.1]
  const barWidth = 0.18
  const gap = 0.08

  // Bars
  const bars: { mesh: Mesh; targetH: number }[] = []
  values.forEach((v, i) => {
    const geo = new BoxGeometry(barWidth, 0.01, barWidth)
    const isUp = i === 0 || v >= values[i - 1]
    const mat = new MeshStandardMaterial({
      color: isUp ? EMERALD : BRAND_RED,
      emissive: isUp ? EMERALD : BRAND_RED,
      emissiveIntensity: 0.2,
      metalness: 0.3,
      roughness: 0.5,
    })
    const mesh = new Mesh(geo, mat)
    mesh.position.set(i * (barWidth + gap), 0, 0)
    mesh.scale.y = 0.01
    group.add(mesh)
    bars.push({ mesh, targetH: v * 2 })
  })

  // Grid base
  const gridMat = new MeshStandardMaterial({ color: 0x111111, emissive: CYAN, emissiveIntensity: 0.03 })
  const gridBase = new Mesh(new BoxGeometry(values.length * (barWidth + gap), 0.02, barWidth + 0.5), gridMat)
  gridBase.position.set((values.length * (barWidth + gap)) / 2 - (barWidth + gap) / 2, -0.01, 0)
  group.add(gridBase)

  // Line chart overlay
  const linePositions = new Float32Array(values.length * 3)
  const lineGeo = new BufferGeometry()
  lineGeo.setAttribute('position', new Float32BufferAttribute(linePositions, 3))
  const lineMat = new LineBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.5 })
  const lineChart = new Line(lineGeo, lineMat)
  group.add(lineChart)

  // Floating data points
  const dotCount = isMobile ? 8 : 15
  const dotPositions = new Float32Array(dotCount * 3)
  for (let i = 0; i < dotCount; i++) {
    dotPositions[i * 3] = Math.random() * 3
    dotPositions[i * 3 + 1] = 1.5 + Math.random() * 1.5
    dotPositions[i * 3 + 2] = (Math.random() - 0.5) * 1.5
  }
  const dotGeo = new BufferGeometry()
  dotGeo.setAttribute('position', new Float32BufferAttribute(dotPositions, 3))
  const dotMat = new PointsMaterial({ color: CYAN, size: 0.04, transparent: true, opacity: 0.5 })
  const dots = new Points(dotGeo, dotMat)
  group.add(dots)

  let elapsed = 0

  function update(time: number, delta: number) {
    elapsed += delta

    // Animate bars rising
    const lineArr = lineGeo.attributes.position.array as Float32Array
    bars.forEach((b, i) => {
      const delay = i * 0.1
      if (elapsed > delay) {
        const progress = Math.min(1, (elapsed - delay) * 1.2)
        const eased = 1 - Math.pow(1 - progress, 3)
        const h = eased * b.targetH
        b.mesh.scale.y = Math.max(0.01, h * 100)
        b.mesh.position.y = h / 2
      }
      // Update line positions
      lineArr[i * 3] = b.mesh.position.x
      lineArr[i * 3 + 1] = b.mesh.position.y + b.mesh.scale.y * 0.005
      lineArr[i * 3 + 2] = barWidth / 2 + 0.1
    })
    lineGeo.attributes.position.needsUpdate = true

    // Floating dots drift
    const dotArr = dotGeo.attributes.position.array as Float32Array
    for (let i = 0; i < dotCount; i++) {
      dotArr[i * 3 + 1] += 0.003
      if (dotArr[i * 3 + 1] > 3.5) dotArr[i * 3 + 1] = 1
    }
    dotGeo.attributes.position.needsUpdate = true

    group.rotation.y = Math.sin(time * 0.15) * 0.12
    group.rotation.x = -0.15
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
