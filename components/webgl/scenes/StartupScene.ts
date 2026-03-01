/* Startup Scene — Rocket with trail, growth chart bars ascending */

import {
  Scene, PerspectiveCamera, Group, Mesh, ConeGeometry,
  CylinderGeometry, BoxGeometry, MeshStandardMaterial,
  AmbientLight, PointLight, Points, BufferGeometry,
  Float32BufferAttribute, PointsMaterial,
} from 'three'
import type { SceneInstance } from './types'

const BRAND_RED = 0xD0021B
const SAFFRON = 0xFF9933
const GREEN = 0x138808
const WHITE = 0xEEEEEE

export default function createStartupScene(isMobile: boolean): SceneInstance {
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0.3, 4.5)

  scene.add(new AmbientLight(0xffffff, 0.3))
  const topLight = new PointLight(SAFFRON, 1.2, 10)
  topLight.position.set(0, 3, 3)
  scene.add(topLight)
  const redLight = new PointLight(BRAND_RED, 0.5, 8)
  redLight.position.set(-2, 0, 2)
  scene.add(redLight)

  const group = new Group()
  scene.add(group)

  // Rocket body
  const rocketGroup = new Group()
  const bodyMat = new MeshStandardMaterial({ color: WHITE, emissive: WHITE, emissiveIntensity: 0.05, metalness: 0.3, roughness: 0.5 })
  const body = new Mesh(new CylinderGeometry(0.12, 0.14, 0.8, 8), bodyMat)
  rocketGroup.add(body)

  // Nose cone
  const noseMat = new MeshStandardMaterial({ color: BRAND_RED, emissive: BRAND_RED, emissiveIntensity: 0.3, metalness: 0.4, roughness: 0.4 })
  const nose = new Mesh(new ConeGeometry(0.12, 0.3, 8), noseMat)
  nose.position.y = 0.55
  rocketGroup.add(nose)

  // Fins
  const finMat = new MeshStandardMaterial({ color: SAFFRON, emissive: SAFFRON, emissiveIntensity: 0.15 })
  for (let i = 0; i < 3; i++) {
    const fin = new Mesh(new BoxGeometry(0.02, 0.2, 0.15), finMat)
    const angle = (i / 3) * Math.PI * 2
    fin.position.set(Math.cos(angle) * 0.14, -0.35, Math.sin(angle) * 0.14)
    fin.rotation.y = -angle
    rocketGroup.add(fin)
  }

  rocketGroup.position.set(-0.6, 0, 0)
  group.add(rocketGroup)

  // Trail particles (tricolor accents)
  const trailCount = isMobile ? 40 : 80
  const trailPos = new Float32Array(trailCount * 3)
  const trailColors = new Float32Array(trailCount * 3)
  const trailVelocities: number[] = []

  for (let i = 0; i < trailCount; i++) {
    trailPos[i * 3] = -0.6 + (Math.random() - 0.5) * 0.3
    trailPos[i * 3 + 1] = -0.6 - Math.random() * 1.5
    trailPos[i * 3 + 2] = (Math.random() - 0.5) * 0.3
    trailVelocities.push(0.01 + Math.random() * 0.02)
    // Alternate colors: saffron, white, green
    const colorChoice = i % 3
    if (colorChoice === 0) { trailColors[i * 3] = 1; trailColors[i * 3 + 1] = 0.6; trailColors[i * 3 + 2] = 0.2 }
    else if (colorChoice === 1) { trailColors[i * 3] = 0.9; trailColors[i * 3 + 1] = 0.9; trailColors[i * 3 + 2] = 0.9 }
    else { trailColors[i * 3] = 0.07; trailColors[i * 3 + 1] = 0.53; trailColors[i * 3 + 2] = 0.03 }
  }
  const trailGeo = new BufferGeometry()
  trailGeo.setAttribute('position', new Float32BufferAttribute(trailPos, 3))
  trailGeo.setAttribute('color', new Float32BufferAttribute(trailColors, 3))
  const trailMat = new PointsMaterial({ size: isMobile ? 0.05 : 0.035, transparent: true, opacity: 0.7, vertexColors: true })
  const trail = new Points(trailGeo, trailMat)
  group.add(trail)

  // Growth chart bars
  const barHeights = [0.3, 0.5, 0.45, 0.7, 0.6, 0.9, 1.1]
  const bars: { mesh: Mesh; targetH: number }[] = []
  barHeights.forEach((h, i) => {
    const geo = new BoxGeometry(0.1, 0.01, 0.1) // start small
    const isGreen = h > barHeights[Math.max(0, i - 1)]
    const mat = new MeshStandardMaterial({
      color: isGreen ? 0x10B981 : BRAND_RED,
      emissive: isGreen ? 0x10B981 : BRAND_RED,
      emissiveIntensity: 0.15,
      transparent: true,
      opacity: 0.6,
    })
    const mesh = new Mesh(geo, mat)
    mesh.position.set(0.6 + i * 0.18, -1 + 0.005, 0)
    mesh.scale.y = 0.01
    group.add(mesh)
    bars.push({ mesh, targetH: h })
  })

  let elapsed = 0

  function update(time: number, delta: number) {
    elapsed += delta

    // Rocket float
    rocketGroup.position.y = Math.sin(time * 1.2) * 0.15
    rocketGroup.rotation.z = Math.sin(time * 0.8) * 0.05

    // Trail particles
    const posArr = trailGeo.attributes.position.array as Float32Array
    for (let i = 0; i < trailCount; i++) {
      posArr[i * 3 + 1] -= trailVelocities[i]
      if (posArr[i * 3 + 1] < -2.5) {
        posArr[i * 3] = -0.6 + (Math.random() - 0.5) * 0.25
        posArr[i * 3 + 1] = rocketGroup.position.y - 0.5
        posArr[i * 3 + 2] = (Math.random() - 0.5) * 0.25
      }
    }
    trailGeo.attributes.position.needsUpdate = true

    // Chart bars animate in
    bars.forEach((b, i) => {
      const delay = i * 0.15
      if (elapsed > delay) {
        const progress = Math.min(1, (elapsed - delay) * 1.5)
        const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
        b.mesh.scale.y = eased * b.targetH * 100
        b.mesh.position.y = -1 + (eased * b.targetH) / 2
      }
    })

    group.rotation.y = Math.sin(time * 0.15) * 0.06
  }

  function dispose() {
    scene.traverse(obj => {
      if (obj instanceof Mesh || obj instanceof Points) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
    })
  }

  return { scene, camera, update, dispose }
}
