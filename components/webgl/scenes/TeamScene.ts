/* Team Scene — Connected nodes network with glowing connections */

import {
  Scene, PerspectiveCamera, Group, Mesh, SphereGeometry,
  MeshStandardMaterial, AmbientLight, PointLight, Line,
  BufferGeometry, Float32BufferAttribute, LineBasicMaterial,
} from 'three'
import type { SceneInstance } from './types'

const BRAND_RED = 0xD0021B
const SOFT_WHITE = 0xCCCCCC

export default function createTeamScene(isMobile: boolean): SceneInstance {
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 3.5)

  scene.add(new AmbientLight(0xffffff, 0.35))
  const centerLight = new PointLight(BRAND_RED, 0.8, 8)
  centerLight.position.set(0, 0, 2)
  scene.add(centerLight)
  const backLight = new PointLight(0x3B82F6, 0.4, 6)
  backLight.position.set(-2, 1, -1)
  scene.add(backLight)

  const group = new Group()
  scene.add(group)

  // Nodes
  const nodeCount = isMobile ? 6 : 10
  const nodeGeo = new SphereGeometry(0.06, 10, 10)
  const glowGeo = new SphereGeometry(0.12, 8, 8)

  interface NodeData { mesh: Mesh; glow: Mesh; basePos: [number, number, number]; phase: number }
  const nodes: NodeData[] = []

  for (let i = 0; i < nodeCount; i++) {
    const angle = (i / nodeCount) * Math.PI * 2
    const radius = 0.7 + (i % 2) * 0.4
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius * 0.6
    const z = (Math.random() - 0.5) * 0.4

    const mat = new MeshStandardMaterial({ color: SOFT_WHITE, emissive: BRAND_RED, emissiveIntensity: 0.3, metalness: 0.2, roughness: 0.5 })
    const mesh = new Mesh(nodeGeo, mat)
    mesh.position.set(x, y, z)
    group.add(mesh)

    const glowMat = new MeshStandardMaterial({ color: BRAND_RED, emissive: BRAND_RED, emissiveIntensity: 0.2, transparent: true, opacity: 0.15 })
    const glow = new Mesh(glowGeo, glowMat)
    glow.position.set(x, y, z)
    group.add(glow)

    nodes.push({ mesh, glow, basePos: [x, y, z], phase: Math.random() * Math.PI * 2 })
  }

  // Connection lines
  const lines: Line[] = []
  const lineGeos: BufferGeometry[] = []
  for (let i = 0; i < nodeCount; i++) {
    for (let j = i + 1; j < nodeCount; j++) {
      const dx = nodes[i].basePos[0] - nodes[j].basePos[0]
      const dy = nodes[i].basePos[1] - nodes[j].basePos[1]
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 1.2) {
        const geo = new BufferGeometry()
        const pos = new Float32Array(6)
        geo.setAttribute('position', new Float32BufferAttribute(pos, 3))
        const lineMat = new LineBasicMaterial({ color: BRAND_RED, transparent: true, opacity: 0.2 })
        const line = new Line(geo, lineMat)
        group.add(line)
        lines.push(line)
        lineGeos.push(geo)
      }
    }
  }

  // Pulse state
  let pulseNode = 0
  let pulseTimer = 0

  function update(time: number, delta: number) {
    // Float nodes
    nodes.forEach(n => {
      n.mesh.position.x = n.basePos[0] + Math.sin(time * 0.6 + n.phase) * 0.05
      n.mesh.position.y = n.basePos[1] + Math.cos(time * 0.5 + n.phase) * 0.05
      n.glow.position.copy(n.mesh.position)
    })

    // Update lines
    let lineIdx = 0
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const dx = nodes[i].basePos[0] - nodes[j].basePos[0]
        const dy = nodes[i].basePos[1] - nodes[j].basePos[1]
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 1.2 && lineIdx < lineGeos.length) {
          const arr = lineGeos[lineIdx].attributes.position.array as Float32Array
          arr[0] = nodes[i].mesh.position.x
          arr[1] = nodes[i].mesh.position.y
          arr[2] = nodes[i].mesh.position.z
          arr[3] = nodes[j].mesh.position.x
          arr[4] = nodes[j].mesh.position.y
          arr[5] = nodes[j].mesh.position.z
          lineGeos[lineIdx].attributes.position.needsUpdate = true
          lineIdx++
        }
      }
    }

    // Pulse effect
    pulseTimer += delta
    if (pulseTimer > 2) {
      pulseTimer = 0
      pulseNode = (pulseNode + 1) % nodeCount
    }
    nodes.forEach((n, i) => {
      const isPulsing = i === pulseNode && pulseTimer < 0.5
      const glowMat = n.glow.material as MeshStandardMaterial
      glowMat.opacity = isPulsing ? 0.3 + Math.sin(pulseTimer * 12) * 0.15 : 0.1
      const scale = isPulsing ? 1.3 : 1
      n.glow.scale.setScalar(scale)
    })

    group.rotation.y = Math.sin(time * 0.15) * 0.1
    group.rotation.x = Math.sin(time * 0.1) * 0.03
  }

  function dispose() {
    scene.traverse(obj => {
      if (obj instanceof Mesh || obj instanceof Line) {
        obj.geometry.dispose()
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose())
        else obj.material.dispose()
      }
    })
  }

  return { scene, camera, update, dispose }
}
