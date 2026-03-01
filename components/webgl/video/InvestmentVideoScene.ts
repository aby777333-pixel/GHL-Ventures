/* InvestmentVideoScene — Cinematic 3D animated presentation
   combining GHL India Ventures investment content.

   6 segments flow through: Intro → Fund Overview → Investment Pillars →
   Portfolio → Returns/Stats → Outro, with cross-fading transitions. */

import {
  Scene, PerspectiveCamera, Group, Mesh, Shape, ExtrudeGeometry,
  CylinderGeometry, BoxGeometry, SphereGeometry, TorusGeometry,
  ConeGeometry, MeshStandardMaterial, AmbientLight, PointLight,
  Points, BufferGeometry, Float32BufferAttribute, PointsMaterial,
  LineBasicMaterial, Line, Vector3, CatmullRomCurve3,
} from 'three'

const BRAND_RED = 0xD0021B
const GOLD = 0xD4A843

export const DURATION = 40 // seconds

export const SEGMENTS = [
  { name: 'intro',     start: 0,  end: 7 },
  { name: 'fund',      start: 6,  end: 14 },
  { name: 'pillars',   start: 13, end: 22 },
  { name: 'portfolio', start: 21, end: 30 },
  { name: 'stats',     start: 29, end: 38 },
  { name: 'outro',     start: 37, end: 40 },
]

export const OVERLAY_CONTENT = [
  {
    title: 'GHL India Ventures Trust',
    subtitle: 'Category II Alternative Investment Fund',
    detail: 'SEBI Registered \u2022 IN/AIF2/2425/1517',
  },
  {
    title: '\u20B9500 Crore',
    subtitle: 'Target Fund Size',
    detail: '18\u201322% Target IRR \u2022 5\u20137 Year Horizon',
  },
  {
    title: 'Two Investment Verticals',
    subtitle: 'Stressed Real Estate & Startup Equity',
    detail: 'Distressed Assets \u2022 Early-Stage Innovation',
  },
  {
    title: '6 Portfolio Companies',
    subtitle: '\u20B9200Cr+ Capital Deployed',
    detail: '25+ Years Combined Experience',
  },
  {
    title: 'Superior Risk-Adjusted Returns',
    subtitle: '2% Management Fee \u2022 20% Performance Fee',
    detail: 'Quarterly Reporting \u2022 Full Transparency',
  },
  {
    title: 'Creating Wealth.',
    subtitle: 'Building Trust.',
    detail: 'Inspiring Growth.',
  },
]

/* ─── Utility ─── */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)))
  return t * t * (3 - 2 * t)
}

function segVis(time: number, start: number, end: number): number {
  return Math.min(
    smoothstep(start, start + 1.5, time),
    1 - smoothstep(end - 1.5, end, time),
  )
}

function setGroupVis(g: Group, v: number) {
  g.visible = v > 0.01
  const s = Math.max(v, 0.001)
  g.scale.set(s, s, s)
}

/* ─── Main Factory ─── */
export interface PresentationScene {
  scene: Scene
  camera: PerspectiveCamera
  update: (playbackTime: number) => void
  dispose: () => void
  getSegmentIndex: (t: number) => number
}

export function createPresentationScene(isMobile: boolean): PresentationScene {
  const scene = new Scene()
  const camera = new PerspectiveCamera(45, 1, 0.1, 100)
  camera.position.set(0, 0, 6)

  /* ─── Lighting ─── */
  scene.add(new AmbientLight(0xffffff, 0.25))
  const mainLight = new PointLight(BRAND_RED, 1.2, 15)
  mainLight.position.set(3, 3, 5)
  scene.add(mainLight)
  const goldLight = new PointLight(GOLD, 0.8, 12)
  goldLight.position.set(-3, 2, 4)
  scene.add(goldLight)
  const fillLight = new PointLight(0x3B82F6, 0.4, 10)
  fillLight.position.set(0, -2, 3)
  scene.add(fillLight)

  /* ─── Background Particles (always visible) ─── */
  const bgN = isMobile ? 60 : 120
  const bgArr = new Float32Array(bgN * 3)
  for (let i = 0; i < bgN; i++) {
    bgArr[i * 3]     = (Math.random() - 0.5) * 10
    bgArr[i * 3 + 1] = (Math.random() - 0.5) * 8
    bgArr[i * 3 + 2] = (Math.random() - 0.5) * 6 - 2
  }
  const bgGeo = new BufferGeometry()
  bgGeo.setAttribute('position', new Float32BufferAttribute(bgArr, 3))
  scene.add(new Points(bgGeo, new PointsMaterial({ color: GOLD, size: 0.015, transparent: true, opacity: 0.3 })))

  /* ═══════ SEGMENT 1: Intro ═══════ */
  const introG = new Group()
  scene.add(introG)

  const orbMat = new MeshStandardMaterial({
    color: BRAND_RED, emissive: BRAND_RED, emissiveIntensity: 0.4,
    metalness: 0.6, roughness: 0.3, transparent: true, opacity: 0.9,
  })
  const orb = new Mesh(new SphereGeometry(0.5, 24, 24), orbMat)
  introG.add(orb)

  const ringMat = new MeshStandardMaterial({
    color: GOLD, emissive: GOLD, emissiveIntensity: 0.2,
    metalness: 0.8, roughness: 0.2, wireframe: true,
  })
  const ring1 = new Mesh(new TorusGeometry(1.2, 0.02, 8, 48), ringMat)
  ring1.rotation.x = Math.PI / 3
  introG.add(ring1)
  const ring2 = new Mesh(new TorusGeometry(1.0, 0.015, 8, 48), ringMat.clone())
  ring2.rotation.x = -Math.PI / 4
  ring2.rotation.z = Math.PI / 6
  introG.add(ring2)

  // Spiral particles
  const ipN = isMobile ? 30 : 60
  const ipPos = new Float32Array(ipN * 3)
  const ipPhases: number[] = []
  for (let i = 0; i < ipN; i++) {
    const a = (i / ipN) * Math.PI * 4
    const r = 0.8 + (i / ipN) * 1.5
    ipPos[i * 3] = Math.cos(a) * r
    ipPos[i * 3 + 1] = (i / ipN - 0.5) * 3
    ipPos[i * 3 + 2] = Math.sin(a) * r
    ipPhases.push(a)
  }
  const ipGeo = new BufferGeometry()
  ipGeo.setAttribute('position', new Float32BufferAttribute(ipPos, 3))
  introG.add(new Points(ipGeo, new PointsMaterial({ color: BRAND_RED, size: 0.03, transparent: true, opacity: 0.5 })))

  /* ═══════ SEGMENT 2: Fund Overview ═══════ */
  const fundG = new Group()
  scene.add(fundG)

  // ₹ symbol
  const rShape = new Shape()
  rShape.moveTo(-0.15, -0.5)
  rShape.lineTo(0.0, -0.5)
  rShape.lineTo(0.15, 0.0)
  rShape.lineTo(0.0, 0.0)
  rShape.lineTo(0.0, 0.5)
  rShape.lineTo(-0.15, 0.5)
  rShape.lineTo(-0.15, 0.0)
  rShape.lineTo(-0.3, 0.0)
  rShape.lineTo(-0.3, -0.08)
  rShape.lineTo(-0.15, -0.08)
  rShape.lineTo(-0.15, -0.5)
  const rMat = new MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.2, metalness: 0.85, roughness: 0.2 })
  const rupee = new Mesh(
    new ExtrudeGeometry(rShape, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }),
    rMat,
  )
  rupee.scale.set(1.5, 1.5, 1.5)
  fundG.add(rupee)

  // ₹ top bars
  const barGeo = new BoxGeometry(1.0, 0.1, 0.15)
  const topBar1 = new Mesh(barGeo, rMat.clone())
  topBar1.position.set(-0.45, 0.6, 0.1)
  fundG.add(topBar1)
  const topBar2 = new Mesh(barGeo, rMat.clone())
  topBar2.position.set(-0.45, 0.35, 0.1)
  fundG.add(topBar2)

  // Orbiting coins
  const coinN = isMobile ? 4 : 7
  const coinGeo = new CylinderGeometry(0.1, 0.1, 0.03, 10)
  const coinMat = new MeshStandardMaterial({ color: GOLD, emissive: GOLD, emissiveIntensity: 0.2, metalness: 0.9, roughness: 0.2 })
  const coins: { mesh: Mesh; angle: number; radius: number; speed: number; yOff: number }[] = []
  for (let i = 0; i < coinN; i++) {
    const m = new Mesh(coinGeo, coinMat)
    m.rotation.x = Math.PI / 2
    fundG.add(m)
    coins.push({
      mesh: m,
      angle: (i / coinN) * Math.PI * 2,
      radius: 1.5 + Math.random() * 0.5,
      speed: 0.3 + Math.random() * 0.2,
      yOff: (Math.random() - 0.5) * 1,
    })
  }

  /* ═══════ SEGMENT 3: Investment Pillars ═══════ */
  const pillarsG = new Group()
  scene.add(pillarsG)

  // Buildings (RE pillar)
  const bldgMat = new MeshStandardMaterial({ color: 0x1F2937, emissive: BRAND_RED, emissiveIntensity: 0.1, metalness: 0.3, roughness: 0.6 })
  const bldgData = [
    { x: -1.5, w: 0.3, h: 1.2 },
    { x: -1.1, w: 0.25, h: 0.9 },
    { x: -0.8, w: 0.35, h: 1.5 },
    { x: -0.4, w: 0.2, h: 0.7 },
  ]
  const buildings: Mesh[] = []
  for (const b of bldgData) {
    const m = new Mesh(new BoxGeometry(b.w, b.h, 0.25), bldgMat.clone())
    m.position.set(b.x, -0.5 + b.h / 2, 0)
    pillarsG.add(m)
    buildings.push(m)
  }

  // Rocket (startup pillar)
  const rocketBody = new Mesh(
    new CylinderGeometry(0.1, 0.12, 0.6, 8),
    new MeshStandardMaterial({ color: 0xF8F7F5, emissive: 0xF8F7F5, emissiveIntensity: 0.1, metalness: 0.3, roughness: 0.4 }),
  )
  rocketBody.position.set(1, 0, 0)
  pillarsG.add(rocketBody)
  const noseCone = new Mesh(
    new ConeGeometry(0.1, 0.2, 8),
    new MeshStandardMaterial({ color: BRAND_RED, emissive: BRAND_RED, emissiveIntensity: 0.2 }),
  )
  noseCone.position.set(1, 0.4, 0)
  pillarsG.add(noseCone)

  // Tricolour trail particles
  const trN = isMobile ? 20 : 40
  const trPos = new Float32Array(trN * 3)
  for (let i = 0; i < trN; i++) {
    trPos[i * 3] = 1 + (Math.random() - 0.5) * 0.2
    trPos[i * 3 + 1] = -0.5 - Math.random() * 1.5
    trPos[i * 3 + 2] = (Math.random() - 0.5) * 0.2
  }
  const trGeo = new BufferGeometry()
  trGeo.setAttribute('position', new Float32BufferAttribute(trPos, 3))
  pillarsG.add(new Points(trGeo, new PointsMaterial({ color: 0xFF9933, size: 0.04, transparent: true, opacity: 0.6 })))

  /* ═══════ SEGMENT 4: Portfolio ═══════ */
  const portfolioG = new Group()
  scene.add(portfolioG)

  const nodeColors = [BRAND_RED, GOLD, 0x3B82F6, 0x10B981, 0x8B5CF6, 0xF59E0B]
  const nodes: Mesh[] = []
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const m = new Mesh(
      new SphereGeometry(0.12, 12, 12),
      new MeshStandardMaterial({ color: nodeColors[i], emissive: nodeColors[i], emissiveIntensity: 0.3, metalness: 0.5, roughness: 0.3 }),
    )
    m.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0)
    portfolioG.add(m)
    nodes.push(m)
  }

  // Centre hub
  const hub = new Mesh(
    new SphereGeometry(0.2, 16, 16),
    new MeshStandardMaterial({ color: BRAND_RED, emissive: BRAND_RED, emissiveIntensity: 0.4, metalness: 0.6, roughness: 0.3 }),
  )
  portfolioG.add(hub)

  // Connection lines
  const lineMat = new LineBasicMaterial({ color: GOLD, transparent: true, opacity: 0.4 })
  const conLines: Line[] = []
  for (const n of nodes) {
    const lg = new BufferGeometry().setFromPoints([new Vector3(), n.position.clone()])
    const l = new Line(lg, lineMat.clone())
    portfolioG.add(l)
    conLines.push(l)
  }

  /* ═══════ SEGMENT 5: Stats / Returns ═══════ */
  const statsG = new Group()
  scene.add(statsG)

  const barColors = [BRAND_RED, GOLD, 0x3B82F6, 0x10B981, 0x8B5CF6]
  const barH = [0.8, 1.2, 0.6, 1.5, 1.0]
  const chartBars: { mesh: Mesh; target: number }[] = []
  for (let i = 0; i < 5; i++) {
    const m = new Mesh(
      new BoxGeometry(0.25, barH[i], 0.2),
      new MeshStandardMaterial({ color: barColors[i], emissive: barColors[i], emissiveIntensity: 0.15, metalness: 0.3, roughness: 0.5 }),
    )
    m.position.set(-1 + i * 0.5, -0.5 + barH[i] / 2, 0)
    m.scale.y = 0
    statsG.add(m)
    chartBars.push({ mesh: m, target: barH[i] })
  }

  // Growth arrow
  const arrowPts = [
    new Vector3(-1.2, -0.5, 0.3),
    new Vector3(-0.4, 0, 0.3),
    new Vector3(0.2, 0.3, 0.3),
    new Vector3(1.2, 1.2, 0.3),
  ]
  const arrowCurve = new CatmullRomCurve3(arrowPts)
  statsG.add(new Line(
    new BufferGeometry().setFromPoints(arrowCurve.getPoints(30)),
    new LineBasicMaterial({ color: BRAND_RED, transparent: true, opacity: 0.8 }),
  ))
  const arrowTip = new Mesh(
    new ConeGeometry(0.08, 0.15, 6),
    new MeshStandardMaterial({ color: BRAND_RED, emissive: BRAND_RED, emissiveIntensity: 0.3 }),
  )
  arrowTip.position.set(1.2, 1.2, 0.3)
  arrowTip.rotation.z = -Math.PI / 4
  statsG.add(arrowTip)

  /* ═══════ SEGMENT 6: Outro ═══════ */
  const outroG = new Group()
  scene.add(outroG)

  const outN = isMobile ? 40 : 80
  const outArr = new Float32Array(outN * 3)
  const outDirs: Vector3[] = []
  for (let i = 0; i < outN; i++) {
    const th = Math.acos(2 * Math.random() - 1)
    const ph = Math.random() * Math.PI * 2
    outDirs.push(new Vector3(Math.sin(th) * Math.cos(ph), Math.sin(th) * Math.sin(ph), Math.cos(th)))
  }
  const outGeo = new BufferGeometry()
  outGeo.setAttribute('position', new Float32BufferAttribute(outArr, 3))
  outroG.add(new Points(outGeo, new PointsMaterial({ color: GOLD, size: 0.04, transparent: true, opacity: 0.6 })))

  const outroOrb = new Mesh(
    new SphereGeometry(0.4, 20, 20),
    new MeshStandardMaterial({ color: BRAND_RED, emissive: BRAND_RED, emissiveIntensity: 0.5, metalness: 0.7, roughness: 0.2 }),
  )
  outroG.add(outroOrb)

  /* ─── Hide all segment groups initially ─── */
  ;[introG, fundG, pillarsG, portfolioG, statsG, outroG].forEach(g => {
    g.scale.set(0.001, 0.001, 0.001)
    g.visible = false
  })

  /* ─── Segment lookup ─── */
  function getSegmentIndex(t: number): number {
    const time = t % DURATION
    for (let i = SEGMENTS.length - 1; i >= 0; i--) {
      if (time >= SEGMENTS[i].start) return i
    }
    return 0
  }

  /* ─── Per-frame update ─── */
  function update(t: number) {
    const time = t % DURATION

    // Background drift
    const ba = bgGeo.attributes.position.array as Float32Array
    for (let i = 0; i < bgN; i++) {
      ba[i * 3 + 1] += Math.sin(time * 0.2 + i * 0.1) * 0.001
    }
    bgGeo.attributes.position.needsUpdate = true

    // Camera sway
    camera.position.x = Math.sin(time * 0.15) * 0.5
    camera.position.y = Math.cos(time * 0.1) * 0.3
    camera.lookAt(0, 0, 0)

    // Light motion
    mainLight.position.x = 3 + Math.sin(time * 0.3)
    mainLight.position.y = 3 + Math.cos(time * 0.2)

    // Visibility
    setGroupVis(introG,     segVis(time, 0, 7))
    setGroupVis(fundG,      segVis(time, 6, 14))
    setGroupVis(pillarsG,   segVis(time, 13, 22))
    setGroupVis(portfolioG, segVis(time, 21, 30))
    setGroupVis(statsG,     segVis(time, 29, 38))
    setGroupVis(outroG,     segVis(time, 37, 40))

    /* Intro */
    if (introG.visible) {
      const s = 1 + Math.sin(time * 2) * 0.1
      orb.scale.set(s, s, s)
      ring1.rotation.z = time * 0.5
      ring2.rotation.z = -time * 0.4
      const ia = ipGeo.attributes.position.array as Float32Array
      for (let i = 0; i < ipN; i++) {
        const a = ipPhases[i] + time * 0.5
        const r = 0.8 + (i / ipN) * 1.5
        ia[i * 3] = Math.cos(a) * r
        ia[i * 3 + 2] = Math.sin(a) * r
      }
      ipGeo.attributes.position.needsUpdate = true
    }

    /* Fund */
    if (fundG.visible) {
      rupee.rotation.y = time * 0.6
      coins.forEach(c => {
        c.angle += c.speed * 0.016
        c.mesh.position.x = Math.cos(c.angle) * c.radius
        c.mesh.position.z = Math.sin(c.angle) * c.radius - 1
        c.mesh.position.y = c.yOff + Math.sin(time + c.angle) * 0.15
        c.mesh.rotation.z += 0.008
      })
    }

    /* Pillars */
    if (pillarsG.visible) {
      const prog = smoothstep(13, 16, time)
      buildings.forEach((b, i) => { b.scale.y = smoothstep(0, 1, prog - i * 0.1) })
      rocketBody.position.y = 0.3 + Math.sin(time * 1.5) * 0.2
      noseCone.position.y = 0.7 + Math.sin(time * 1.5) * 0.2
      const ta = trGeo.attributes.position.array as Float32Array
      for (let i = 0; i < trN; i++) {
        ta[i * 3 + 1] = -0.3 - Math.random() * 1.5 + Math.sin(time * 1.5) * 0.2
      }
      trGeo.attributes.position.needsUpdate = true
    }

    /* Portfolio */
    if (portfolioG.visible) {
      const prog = smoothstep(21, 24, time)
      nodes.forEach((n, i) => {
        const ns = smoothstep(0, 1, prog - i * 0.15)
        n.scale.set(ns, ns, ns)
        const a = (i / 6) * Math.PI * 2 + time * 0.2
        n.position.set(Math.cos(a) * 1.3, Math.sin(a) * 1.3, 0)
      })
      const hs = 1 + Math.sin(time * 2) * 0.1
      hub.scale.set(hs, hs, hs)
      conLines.forEach((l, i) => {
        (l.geometry as BufferGeometry).setFromPoints([new Vector3(), nodes[i].position.clone()])
      })
    }

    /* Stats */
    if (statsG.visible) {
      const prog = smoothstep(29, 33, time)
      chartBars.forEach((b, i) => { b.mesh.scale.y = smoothstep(0, 1, prog - i * 0.15) })
    }

    /* Outro */
    if (outroG.visible) {
      const prog = smoothstep(37, 39, time)
      const oa = outGeo.attributes.position.array as Float32Array
      for (let i = 0; i < outN; i++) {
        const r = prog * 2.5
        oa[i * 3]     = outDirs[i].x * r
        oa[i * 3 + 1] = outDirs[i].y * r
        oa[i * 3 + 2] = outDirs[i].z * r
      }
      outGeo.attributes.position.needsUpdate = true
      const os = 1 + Math.sin(time * 3) * 0.15
      outroOrb.scale.set(os, os, os)
    }
  }

  /* ─── Disposal ─── */
  function dispose() {
    scene.traverse(obj => {
      if ('geometry' in obj && (obj as Mesh).geometry) (obj as Mesh).geometry.dispose()
      if ('material' in obj) {
        const mat = (obj as Mesh).material
        if (Array.isArray(mat)) mat.forEach(m => m.dispose())
        else if (mat && typeof (mat as MeshStandardMaterial).dispose === 'function') (mat as MeshStandardMaterial).dispose()
      }
    })
  }

  return { scene, camera, update, dispose, getSegmentIndex }
}
