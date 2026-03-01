/* Fund Scene — Vault door, stacking gold bars, growth arrow */

import {
  Scene, PerspectiveCamera, Group, Mesh, CylinderGeometry,
  BoxGeometry, TorusGeometry, MeshStandardMaterial,
  AmbientLight, PointLight, Points, BufferGeometry,
  Float32BufferAttribute, PointsMaterial,
} from 'three'
import type { SceneInstance } from './types'

const BRAND_RED = 0xD0021B
const GOLD = 0xD4A843
const DARK = 0x1A1A1A

export default function createFundScene(isMobile: boolean): SceneInstance {
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0.3, 4)

  scene.add(new AmbientLight(0xffffff, 0.3))
  const goldLight = new PointLight(GOLD, 1.2, 10)
  goldLight.position.set(0, 2, 3)
  scene.add(goldLight)
  const redLight = new PointLight(BRAND_RED, 0.4, 8)
  redLight.position.set(-2, 0, 2)
  scene.add(redLight)

  const group = new Group()
  scene.add(group)

  // Vault door (thick disc)
  const vaultGeo = new CylinderGeometry(0.9, 0.9, 0.15, isMobile ? 16 : 24)
  const vaultMat = new MeshStandardMaterial({ color: 0x2A2A2A, emissive: GOLD, emissiveIntensity: 0.08, metalness: 0.7, roughness: 0.3 })
  const vault = new Mesh(vaultGeo, vaultMat)
  vault.rotation.x = Math.PI / 2
  vault.position.set(-0.5, 0, 0)
  group.add(vault)

  // Vault handle
  const handleGeo = new TorusGeometry(0.25, 0.03, 8, isMobile ? 16 : 24)
  const handleMat = new MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.2, metalness: 0.9, roughness: 0.2 })
  const handle = new Mesh(handleGeo, handleMat)
  handle.position.set(-0.5, 0, 0.1)
  group.add(handle)

  // Cross bars on vault
  const crossMat = new MeshStandardMaterial({ color: 0x333333, emissive: GOLD, emissiveIntensity: 0.05, metalness: 0.6 })
  for (let i = 0; i < 4; i++) {
    const barGeo = new BoxGeometry(0.04, 1.4, 0.02)
    const bar = new Mesh(barGeo, crossMat)
    bar.rotation.z = (i / 4) * Math.PI
    bar.position.set(-0.5, 0, 0.08)
    group.add(bar)
  }

  // Gold bars (pyramid stack)
  const goldBars: { mesh: Mesh; targetY: number; delay: number }[] = []
  const goldBarGeo = new BoxGeometry(0.25, 0.1, 0.15)
  const goldBarMat = new MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.25, metalness: 0.9, roughness: 0.15 })

  // Bottom row (3 bars)
  for (let i = 0; i < 3; i++) {
    const bar = new Mesh(goldBarGeo, goldBarMat)
    const targetY = -0.6
    bar.position.set(0.7 + i * 0.28, -2, 0)
    group.add(bar)
    goldBars.push({ mesh: bar, targetY, delay: i * 0.2 })
  }
  // Top row (2 bars)
  for (let i = 0; i < 2; i++) {
    const bar = new Mesh(goldBarGeo, goldBarMat)
    const targetY = -0.48
    bar.position.set(0.84 + i * 0.28, -2, 0)
    group.add(bar)
    goldBars.push({ mesh: bar, targetY, delay: 0.6 + i * 0.2 })
  }
  // Crown (1 bar)
  const crownBar = new Mesh(goldBarGeo, goldBarMat)
  crownBar.position.set(0.98, -2, 0)
  group.add(crownBar)
  goldBars.push({ mesh: crownBar, targetY: -0.36, delay: 1.0 })

  // Golden glow particles behind vault
  const particleCount = isMobile ? 20 : 40
  const pPos = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    pPos[i * 3] = -0.5 + (Math.random() - 0.5) * 1.5
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 1.5
    pPos[i * 3 + 2] = -0.3 - Math.random() * 0.5
  }
  const pGeo = new BufferGeometry()
  pGeo.setAttribute('position', new Float32BufferAttribute(pPos, 3))
  const pMat = new PointsMaterial({ color: GOLD, size: 0.04, transparent: true, opacity: 0.4 })
  const glow = new Points(pGeo, pMat)
  group.add(glow)

  let elapsed = 0

  function update(time: number, delta: number) {
    elapsed += delta

    // Vault slowly rotates (opening effect)
    vault.rotation.z = Math.sin(time * 0.3) * 0.15
    handle.rotation.z = time * 0.5

    // Gold bars stack in
    goldBars.forEach(b => {
      if (elapsed > b.delay) {
        const progress = Math.min(1, (elapsed - b.delay) * 1.5)
        const eased = 1 - Math.pow(1 - progress, 3)
        // Bounce effect
        const bounce = progress > 0.7 ? Math.sin((progress - 0.7) * 10) * 0.02 * (1 - progress) : 0
        b.mesh.position.y = b.targetY * eased + bounce - (1 - eased) * 2
      }
    })

    // Glow particles shimmer
    const pArr = pGeo.attributes.position.array as Float32Array
    for (let i = 0; i < particleCount; i++) {
      pArr[i * 3 + 1] += Math.sin(time + i) * 0.001
    }
    pGeo.attributes.position.needsUpdate = true

    group.rotation.y = Math.sin(time * 0.12) * 0.08
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
