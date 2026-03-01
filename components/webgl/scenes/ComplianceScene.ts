/* Compliance Scene — Shield with checkmark, protective rings */

import {
  Scene, PerspectiveCamera, Group, Mesh, Shape, ExtrudeGeometry,
  TorusGeometry, MeshStandardMaterial, AmbientLight, PointLight,
  TubeGeometry, CatmullRomCurve3, Vector3,
} from 'three'
import type { SceneInstance } from './types'

const BRAND_RED = 0xD0021B
const EMERALD = 0x10B981

export default function createComplianceScene(isMobile: boolean): SceneInstance {
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 3.8)

  scene.add(new AmbientLight(0xffffff, 0.3))
  const mainLight = new PointLight(EMERALD, 1, 10)
  mainLight.position.set(1, 2, 3)
  scene.add(mainLight)
  const redLight = new PointLight(BRAND_RED, 0.5, 8)
  redLight.position.set(-1, -1, 2)
  scene.add(redLight)

  const group = new Group()
  scene.add(group)

  // Shield shape
  const shieldShape = new Shape()
  shieldShape.moveTo(0, -0.8)
  shieldShape.quadraticCurveTo(-0.8, -0.2, -0.7, 0.3)
  shieldShape.quadraticCurveTo(-0.5, 0.7, 0, 0.85)
  shieldShape.quadraticCurveTo(0.5, 0.7, 0.7, 0.3)
  shieldShape.quadraticCurveTo(0.8, -0.2, 0, -0.8)

  const shieldGeo = new ExtrudeGeometry(shieldShape, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 })
  const shieldMat = new MeshStandardMaterial({ color: 0x1a1a2e, emissive: EMERALD, emissiveIntensity: 0.15, metalness: 0.5, roughness: 0.4 })
  const shield = new Mesh(shieldGeo, shieldMat)
  shield.position.z = 0.05
  group.add(shield)

  // Checkmark
  const checkCurve = new CatmullRomCurve3([
    new Vector3(-0.25, 0.0, 0.15),
    new Vector3(-0.08, -0.25, 0.15),
    new Vector3(0.3, 0.3, 0.15),
  ])
  const checkGeo = new TubeGeometry(checkCurve, 12, 0.04, 6, false)
  const checkMat = new MeshStandardMaterial({ color: EMERALD, emissive: EMERALD, emissiveIntensity: 0.5 })
  const check = new Mesh(checkGeo, checkMat)
  check.position.set(0, -0.05, 0)
  group.add(check)

  // Animated draw range
  const checkVertexCount = checkGeo.index ? checkGeo.index.count : checkGeo.attributes.position.count
  checkGeo.setDrawRange(0, 0)

  // Protective rings
  const ringCount = isMobile ? 2 : 3
  const rings: { mesh: Mesh; baseScale: number }[] = []
  for (let i = 0; i < ringCount; i++) {
    const ringGeo = new TorusGeometry(1.0 + i * 0.25, 0.015, 6, isMobile ? 24 : 32)
    const ringMat = new MeshStandardMaterial({
      color: BRAND_RED,
      emissive: BRAND_RED,
      emissiveIntensity: 0.2,
      transparent: true,
      opacity: 0.25 - i * 0.06,
    })
    const ring = new Mesh(ringGeo, ringMat)
    group.add(ring)
    rings.push({ mesh: ring, baseScale: 1 + i * 0.25 })
  }

  let elapsed = 0

  function update(time: number, delta: number) {
    elapsed += delta

    // Shield gentle rotation
    shield.rotation.y = Math.sin(time * 0.4) * 0.2

    // Checkmark draw-in
    const drawProgress = Math.min(1, elapsed * 0.5)
    const drawCount = Math.floor(drawProgress * checkVertexCount)
    checkGeo.setDrawRange(0, drawCount)

    // Rings pulse
    rings.forEach((r, i) => {
      const pulse = 1 + Math.sin(time * 1.5 + i * 1.2) * 0.05
      r.mesh.scale.setScalar(pulse)
      const mat = r.mesh.material as MeshStandardMaterial
      mat.opacity = (0.25 - i * 0.06) * (0.7 + Math.sin(time * 1.5 + i * 1.2) * 0.3)
      r.mesh.rotation.z = time * 0.2 + i * 0.5
    })

    group.rotation.y = Math.sin(time * 0.12) * 0.08
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
