/* Education Scene — Open book with fluttering pages, knowledge particles */

import {
  Scene, PerspectiveCamera, Group, Mesh, PlaneGeometry,
  BoxGeometry, MeshStandardMaterial, AmbientLight, PointLight,
  Points, BufferGeometry, Float32BufferAttribute, PointsMaterial,
  DoubleSide,
} from 'three'
import type { SceneInstance } from './types'

const BRAND_RED = 0xD0021B
const VIOLET = 0x7C3AED

export default function createEducationScene(isMobile: boolean): SceneInstance {
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0.8, 3.5)

  scene.add(new AmbientLight(0xffffff, 0.3))
  const topLight = new PointLight(VIOLET, 1, 10)
  topLight.position.set(0, 2, 2)
  scene.add(topLight)
  const warmLight = new PointLight(0xFFA500, 0.5, 8)
  warmLight.position.set(-1, 0, 3)
  scene.add(warmLight)

  const group = new Group()
  scene.add(group)

  // Book spine
  const spineMat = new MeshStandardMaterial({ color: BRAND_RED, emissive: BRAND_RED, emissiveIntensity: 0.2, metalness: 0.3, roughness: 0.6 })
  const spine = new Mesh(new BoxGeometry(0.06, 1.2, 0.9), spineMat)
  group.add(spine)

  // Pages (left and right)
  const pageMat = new MeshStandardMaterial({ color: 0xF5F0E8, emissive: 0xF5F0E8, emissiveIntensity: 0.05, side: DoubleSide })
  const pageGeo = new PlaneGeometry(0.7, 0.9, 8, 6)

  const leftPage = new Mesh(pageGeo.clone(), pageMat.clone())
  leftPage.position.set(-0.38, 0, 0)
  leftPage.rotation.y = 0.3
  group.add(leftPage)

  const rightPage = new Mesh(pageGeo.clone(), pageMat.clone())
  rightPage.position.set(0.38, 0, 0)
  rightPage.rotation.y = -0.3
  group.add(rightPage)

  // Additional page layers
  const pageCount = isMobile ? 3 : 5
  const pages: Mesh[] = [leftPage, rightPage]
  for (let i = 0; i < pageCount; i++) {
    const offset = (i + 1) * 0.015
    const lp = new Mesh(pageGeo.clone(), pageMat.clone())
    lp.position.set(-0.38, offset * 3, -offset)
    lp.rotation.y = 0.3 + (i * 0.02)
    group.add(lp)
    pages.push(lp)

    const rp = new Mesh(pageGeo.clone(), pageMat.clone())
    rp.position.set(0.38, offset * 3, -offset)
    rp.rotation.y = -0.3 - (i * 0.02)
    group.add(rp)
    pages.push(rp)
  }

  // Knowledge particles rising from pages
  const particleCount = isMobile ? 25 : 50
  const particlePos = new Float32Array(particleCount * 3)
  const particleVel: number[] = []
  for (let i = 0; i < particleCount; i++) {
    particlePos[i * 3] = (Math.random() - 0.5) * 1.2
    particlePos[i * 3 + 1] = Math.random() * 1.5
    particlePos[i * 3 + 2] = (Math.random() - 0.5) * 0.8
    particleVel.push(0.003 + Math.random() * 0.006)
  }
  const pGeo = new BufferGeometry()
  pGeo.setAttribute('position', new Float32BufferAttribute(particlePos, 3))
  const pMat = new PointsMaterial({ color: VIOLET, size: 0.03, transparent: true, opacity: 0.5 })
  const particles = new Points(pGeo, pMat)
  group.add(particles)

  // Tilt book slightly
  group.rotation.x = -0.4

  function update(time: number) {
    // Page flutter
    pages.forEach((p, i) => {
      const posArray = p.geometry.attributes.position.array as Float32Array
      for (let v = 0; v < posArray.length; v += 3) {
        const xLocal = posArray[v]
        posArray[v + 2] = Math.sin(time * 2 + xLocal * 3 + i * 0.5) * 0.02
      }
      p.geometry.attributes.position.needsUpdate = true
    })

    // Particles drift up
    const pArr = pGeo.attributes.position.array as Float32Array
    for (let i = 0; i < particleCount; i++) {
      pArr[i * 3 + 1] += particleVel[i]
      if (pArr[i * 3 + 1] > 2) {
        pArr[i * 3 + 1] = 0.2
        pArr[i * 3] = (Math.random() - 0.5) * 1.2
      }
    }
    pGeo.attributes.position.needsUpdate = true

    // Book gentle rock
    group.rotation.z = Math.sin(time * 0.3) * 0.04
    group.rotation.y = Math.sin(time * 0.15) * 0.1
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
