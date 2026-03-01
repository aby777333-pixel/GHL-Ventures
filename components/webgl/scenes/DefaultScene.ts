/* Default Scene — Particle vortex with floating geometric shapes */

import {
  Scene, PerspectiveCamera, Group, Mesh, IcosahedronGeometry,
  OctahedronGeometry, TorusGeometry, MeshStandardMaterial,
  AmbientLight, PointLight, Points, BufferGeometry,
  Float32BufferAttribute, PointsMaterial,
} from 'three'
import type { SceneInstance } from './types'

const BRAND_RED = 0xD0021B

export default function createDefaultScene(isMobile: boolean): SceneInstance {
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 4)

  scene.add(new AmbientLight(0xffffff, 0.3))
  const redLight = new PointLight(BRAND_RED, 1, 10)
  redLight.position.set(1, 2, 3)
  scene.add(redLight)
  const blueLight = new PointLight(0x3B82F6, 0.5, 8)
  blueLight.position.set(-2, -1, 2)
  scene.add(blueLight)

  const group = new Group()
  scene.add(group)

  // Floating shapes
  const shapes: { mesh: Mesh; rotSpeed: [number, number, number]; floatPhase: number }[] = []

  const mat1 = new MeshStandardMaterial({ color: BRAND_RED, emissive: BRAND_RED, emissiveIntensity: 0.2, metalness: 0.4, roughness: 0.5, wireframe: true })
  const ico = new Mesh(new IcosahedronGeometry(0.3, 0), mat1)
  ico.position.set(-0.6, 0.4, 0)
  group.add(ico)
  shapes.push({ mesh: ico, rotSpeed: [0.3, 0.5, 0], floatPhase: 0 })

  const mat2 = new MeshStandardMaterial({ color: 0x3B82F6, emissive: 0x3B82F6, emissiveIntensity: 0.15, metalness: 0.4, roughness: 0.5, wireframe: true })
  const oct = new Mesh(new OctahedronGeometry(0.25, 0), mat2)
  oct.position.set(0.7, -0.3, -0.5)
  group.add(oct)
  shapes.push({ mesh: oct, rotSpeed: [0, 0.4, 0.3], floatPhase: 1.5 })

  const mat3 = new MeshStandardMaterial({ color: 0xD4A843, emissive: 0xD4A843, emissiveIntensity: 0.1, metalness: 0.3, roughness: 0.5, wireframe: true })
  const torus = new Mesh(new TorusGeometry(0.2, 0.06, 8, isMobile ? 16 : 24), mat3)
  torus.position.set(0.1, -0.6, 0.3)
  group.add(torus)
  shapes.push({ mesh: torus, rotSpeed: [0.2, 0, 0.4], floatPhase: 3 })

  if (!isMobile) {
    const mat4 = new MeshStandardMaterial({ color: 0x10B981, emissive: 0x10B981, emissiveIntensity: 0.1, metalness: 0.4, roughness: 0.5, wireframe: true })
    const ico2 = new Mesh(new IcosahedronGeometry(0.18, 0), mat4)
    ico2.position.set(-0.4, -0.5, -0.3)
    group.add(ico2)
    shapes.push({ mesh: ico2, rotSpeed: [0.4, 0.2, 0.1], floatPhase: 4.5 })
  }

  // Particle vortex
  const particleCount = isMobile ? 80 : 150
  const pPos = new Float32Array(particleCount * 3)
  const pPhases: number[] = []
  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 6
    const radius = 0.3 + (i / particleCount) * 1.5
    pPos[i * 3] = Math.cos(angle) * radius
    pPos[i * 3 + 1] = (i / particleCount - 0.5) * 2.5
    pPos[i * 3 + 2] = Math.sin(angle) * radius
    pPhases.push(angle)
  }
  const pGeo = new BufferGeometry()
  pGeo.setAttribute('position', new Float32BufferAttribute(pPos, 3))
  const pMat = new PointsMaterial({ color: BRAND_RED, size: isMobile ? 0.025 : 0.02, transparent: true, opacity: 0.4 })
  const particles = new Points(pGeo, pMat)
  group.add(particles)

  function update(time: number) {
    // Rotate shapes
    shapes.forEach(s => {
      s.mesh.rotation.x += s.rotSpeed[0] * 0.01
      s.mesh.rotation.y += s.rotSpeed[1] * 0.01
      s.mesh.rotation.z += s.rotSpeed[2] * 0.01
      s.mesh.position.y += Math.sin(time * 0.8 + s.floatPhase) * 0.002
    })

    // Vortex rotation
    const pArr = pGeo.attributes.position.array as Float32Array
    for (let i = 0; i < particleCount; i++) {
      const angle = pPhases[i] + time * 0.3
      const radius = 0.3 + (i / particleCount) * 1.5
      pArr[i * 3] = Math.cos(angle) * radius
      pArr[i * 3 + 2] = Math.sin(angle) * radius
    }
    pGeo.attributes.position.needsUpdate = true

    group.rotation.y = time * 0.05
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
