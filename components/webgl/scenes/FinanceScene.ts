/* Finance Scene — Rotating ₹ symbol, floating gold coins, candlestick bars */

import {
  Scene, PerspectiveCamera, Group, Mesh, Shape, ExtrudeGeometry,
  CylinderGeometry, BoxGeometry, MeshStandardMaterial, AmbientLight,
  PointLight, InstancedMesh, Matrix4, Color, Object3D,
} from 'three'
import type { SceneInstance } from './types'

const BRAND_RED = 0xD0021B
const GOLD = 0xD4A843
const DARK = 0x0A0A0A

function createRupeeShape(): Shape {
  const s = new Shape()
  // Simplified ₹ glyph
  // Vertical stroke
  s.moveTo(-0.15, -0.5)
  s.lineTo(0.0, -0.5)
  s.lineTo(0.15, 0.0)
  s.lineTo(0.0, 0.0)
  s.lineTo(0.0, 0.5)
  s.lineTo(-0.15, 0.5)
  s.lineTo(-0.15, 0.0)
  s.lineTo(-0.3, 0.0)
  s.lineTo(-0.3, -0.08)
  s.lineTo(-0.15, -0.08)
  s.lineTo(-0.15, -0.5)
  // Top horizontal bars
  const bar1 = new Shape()
  bar1.moveTo(-0.35, 0.35)
  bar1.lineTo(0.35, 0.35)
  bar1.lineTo(0.35, 0.45)
  bar1.lineTo(-0.35, 0.45)
  bar1.lineTo(-0.35, 0.35)
  s.holes = []
  return s
}

export default function createFinanceScene(isMobile: boolean): SceneInstance {
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 4)

  // Lighting
  scene.add(new AmbientLight(0xffffff, 0.3))
  const pointLight = new PointLight(GOLD, 1.5, 10)
  pointLight.position.set(2, 2, 3)
  scene.add(pointLight)
  const redLight = new PointLight(BRAND_RED, 0.6, 8)
  redLight.position.set(-2, -1, 2)
  scene.add(redLight)

  const group = new Group()
  scene.add(group)

  // Rupee symbol
  const rupeeShape = createRupeeShape()
  const rupeeGeo = new ExtrudeGeometry(rupeeShape, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 2 })
  const rupeeMat = new MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.15, metalness: 0.8, roughness: 0.3 })
  const rupee = new Mesh(rupeeGeo, rupeeMat)
  rupee.position.set(-0.3, 0, 0)
  group.add(rupee)

  // Top bars for ₹
  const barGeo = new BoxGeometry(0.7, 0.08, 0.12)
  const barMat = new MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.1, metalness: 0.8, roughness: 0.3 })
  const bar1 = new Mesh(barGeo, barMat)
  bar1.position.set(-0.3, 0.4, 0.06)
  group.add(bar1)
  const bar2 = new Mesh(barGeo, barMat)
  bar2.position.set(-0.3, 0.22, 0.06)
  group.add(bar2)

  // Gold coins
  const coinCount = isMobile ? 5 : 8
  const coinGeo = new CylinderGeometry(0.12, 0.12, 0.04, 12)
  const coinMat = new MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.2, metalness: 0.9, roughness: 0.2 })
  const coins: { mesh: Mesh; phase: number; baseY: number }[] = []

  for (let i = 0; i < coinCount; i++) {
    const coin = new Mesh(coinGeo, coinMat)
    const angle = (i / coinCount) * Math.PI * 2
    const radius = 1.2 + Math.random() * 0.6
    coin.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 1.5, Math.sin(angle) * radius - 1)
    coin.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.4
    coin.rotation.z = Math.random() * Math.PI
    group.add(coin)
    coins.push({ mesh: coin, phase: Math.random() * Math.PI * 2, baseY: coin.position.y })
  }

  // Candlestick bars (background)
  const candleSticks: { body: Mesh; baseH: number }[] = []
  const candleColors = [0x10B981, BRAND_RED, 0x10B981, BRAND_RED, 0x10B981]
  for (let i = 0; i < 5; i++) {
    const h = 0.3 + Math.random() * 0.8
    const bodyGeo = new BoxGeometry(0.08, h, 0.08)
    const bodyMat = new MeshStandardMaterial({ color: candleColors[i], emissive: candleColors[i], emissiveIntensity: 0.15, transparent: true, opacity: 0.35 })
    const body = new Mesh(bodyGeo, bodyMat)
    body.position.set(1.0 + i * 0.2, -0.8 + h / 2, -1)
    group.add(body)
    candleSticks.push({ body, baseH: h })
  }

  function update(time: number) {
    group.rotation.y = Math.sin(time * 0.3) * 0.15
    rupee.rotation.y = time * 0.5

    coins.forEach(c => {
      c.mesh.position.y = c.baseY + Math.sin(time * 0.8 + c.phase) * 0.15
      c.mesh.rotation.z += 0.005
    })

    candleSticks.forEach((c, i) => {
      const scale = 0.9 + Math.sin(time * 0.5 + i * 0.8) * 0.1
      c.body.scale.y = scale
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
