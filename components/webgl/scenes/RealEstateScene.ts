/* Real Estate Scene — 3D cityscape skyline, rising tower, golden particles */

import {
  Scene, PerspectiveCamera, Group, Mesh, BoxGeometry,
  MeshStandardMaterial, AmbientLight, PointLight, Points,
  BufferGeometry, Float32BufferAttribute, PointsMaterial,
} from 'three'
import type { SceneInstance } from './types'

const BRAND_RED = 0xD0021B
const GOLD = 0xD4A843
const DARK_GRAY = 0x1A1A1A

export default function createRealEstateScene(isMobile: boolean): SceneInstance {
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0.5, 5)

  scene.add(new AmbientLight(0xffffff, 0.25))
  const mainLight = new PointLight(BRAND_RED, 1.2, 12)
  mainLight.position.set(0, 3, 3)
  scene.add(mainLight)
  const goldLight = new PointLight(GOLD, 0.6, 10)
  goldLight.position.set(-2, 1, 2)
  scene.add(goldLight)

  const group = new Group()
  scene.add(group)

  // Buildings
  const buildingMat = new MeshStandardMaterial({ color: DARK_GRAY, emissive: BRAND_RED, emissiveIntensity: 0.08, metalness: 0.4, roughness: 0.6 })
  const towerMat = new MeshStandardMaterial({ color: 0x222222, emissive: BRAND_RED, emissiveIntensity: 0.25, metalness: 0.5, roughness: 0.4 })

  const heights = [0.8, 1.2, 0.6, 1.8, 0.9, 1.4, 0.7]
  const buildings: Mesh[] = []
  const towerIdx = 3 // tallest

  heights.forEach((h, i) => {
    const w = 0.25 + Math.random() * 0.15
    const geo = new BoxGeometry(w, h, w)
    const mat = i === towerIdx ? towerMat : buildingMat
    const mesh = new Mesh(geo, mat)
    mesh.position.set((i - 3) * 0.55, -1 + h / 2, (Math.random() - 0.5) * 0.6)
    group.add(mesh)
    buildings.push(mesh)
  })

  // Ground plane
  const groundGeo = new BoxGeometry(5, 0.05, 2)
  const groundMat = new MeshStandardMaterial({ color: 0x111111, emissive: BRAND_RED, emissiveIntensity: 0.05 })
  const ground = new Mesh(groundGeo, groundMat)
  ground.position.y = -1
  group.add(ground)

  // Golden particles
  const particleCount = isMobile ? 40 : 80
  const positions = new Float32Array(particleCount * 3)
  const velocities: number[] = []
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 3
    positions[i * 3 + 1] = Math.random() * 3 - 1
    positions[i * 3 + 2] = (Math.random() - 0.5) * 2
    velocities.push(0.002 + Math.random() * 0.005)
  }
  const particleGeo = new BufferGeometry()
  particleGeo.setAttribute('position', new Float32BufferAttribute(positions, 3))
  const particleMat = new PointsMaterial({ color: GOLD, size: isMobile ? 0.04 : 0.03, transparent: true, opacity: 0.6 })
  const particles = new Points(particleGeo, particleMat)
  group.add(particles)

  // Tower rise animation state
  let towerScale = 0
  const targetScale = 1

  function update(time: number) {
    // Tower rising
    if (towerScale < targetScale) {
      towerScale = Math.min(targetScale, towerScale + 0.015)
      buildings[towerIdx].scale.y = towerScale
    } else {
      buildings[towerIdx].scale.y = 1 + Math.sin(time * 1.2) * 0.02
    }

    // Particles drift up
    const posArr = particleGeo.attributes.position.array as Float32Array
    for (let i = 0; i < particleCount; i++) {
      posArr[i * 3 + 1] += velocities[i]
      if (posArr[i * 3 + 1] > 2.5) {
        posArr[i * 3 + 1] = -1
        posArr[i * 3] = (Math.random() - 0.5) * 3
      }
    }
    particleGeo.attributes.position.needsUpdate = true

    // Subtle camera sway
    group.rotation.y = Math.sin(time * 0.2) * 0.08
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
