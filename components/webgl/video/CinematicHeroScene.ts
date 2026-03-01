/* CinematicHeroScene — Hollywood-style 3D animated presentation
   for the home page hero. India + GHL investment themed.

   Features: India map outline with city markers, dramatic particle systems,
   golden rupee symbol, cityscape skyline, portfolio constellation,
   camera on spline path, dramatic lighting. */

import {
  Scene, PerspectiveCamera, Group, Mesh, Shape, ExtrudeGeometry,
  CylinderGeometry, BoxGeometry, SphereGeometry, TorusGeometry,
  ConeGeometry, MeshStandardMaterial, AmbientLight, PointLight,
  SpotLight, Points, BufferGeometry, Float32BufferAttribute,
  PointsMaterial, LineBasicMaterial, Line, Vector3,
  CatmullRomCurve3, Color,
} from 'three'

const R = 0xD0021B   // brand red
const G = 0xD4A843   // gold
const B = 0x3B82F6   // blue accent

export const HERO_DURATION = 60

export const HERO_SEGMENTS = [
  { name: 'india',     start: 0,  end: 10 },
  { name: 'brand',     start: 9,  end: 18 },
  { name: 'realestate',start: 17, end: 27 },
  { name: 'startup',   start: 26, end: 35 },
  { name: 'portfolio',  start: 34, end: 44 },
  { name: 'returns',   start: 43, end: 52 },
  { name: 'tagline',   start: 51, end: 60 },
]

export const HERO_OVERLAYS = [
  { title: 'India\u2019s Alternative Investment Frontier', subtitle: 'GHL India Ventures Trust', detail: 'SEBI Registered Category II AIF' },
  { title: 'GHL India Ventures', subtitle: 'Creating Wealth. Building Trust.', detail: 'IN/AIF2/2425/1517' },
  { title: 'Stressed Real Estate', subtitle: 'High-Alpha Distressed Assets', detail: 'NCLT Resolution \u2022 Value Unlocking' },
  { title: 'Early-Stage Startups', subtitle: 'India\u2019s Next Unicorns', detail: 'Deep Tech \u2022 FinTech \u2022 HealthTech' },
  { title: '6 Portfolio Companies', subtitle: '\u20B9200Cr+ Capital Deployed', detail: '25+ Years Combined Experience' },
  { title: '\u20B9500 Crore Target', subtitle: '18\u201322% Target IRR', detail: '5\u20137 Year Investment Horizon' },
  { title: 'Creating Wealth.', subtitle: 'Building Trust.', detail: 'Inspiring Growth.' },
]

function ss(e0: number, e1: number, x: number) {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}
function sv(t: number, s: number, e: number) {
  return Math.min(ss(s, s + 2, t), 1 - ss(e - 2, e, t))
}
function sg(g: Group, v: number) {
  g.visible = v > 0.01
  const s = Math.max(v, 0.001)
  g.scale.set(s, s, s)
}

// India outline coordinates (simplified)
const INDIA: [number, number][] = [
  [0.0, 1.4], [0.4, 1.35], [0.6, 1.2], [0.9, 1.3], [1.1, 1.1],
  [1.2, 0.9], [1.0, 0.6], [1.3, 0.4], [1.2, 0.1], [1.0, -0.2],
  [0.9, -0.5], [0.7, -0.8], [0.5, -1.1], [0.2, -1.3], [0.0, -1.4],
  [-0.2, -1.2], [-0.3, -0.9], [-0.5, -0.5], [-0.7, -0.2], [-0.9, 0.1],
  [-1.0, 0.4], [-0.9, 0.7], [-0.7, 1.0], [-0.5, 1.2], [-0.2, 1.35],
  [0.0, 1.4],
]
const CITIES = [
  { x: 0.6, y: -0.6, c: R },   // Chennai
  { x: -0.8, y: 0.2, c: G },   // Mumbai
  { x: -0.5, y: -0.05, c: B }, // Pune
  { x: 0.2, y: 0.8, c: 0xF59E0B }, // Delhi
]

export interface CinematicScene {
  scene: Scene
  camera: PerspectiveCamera
  update: (t: number) => void
  dispose: () => void
  getSegmentIndex: (t: number) => number
}

export function createCinematicScene(isMobile: boolean): CinematicScene {
  const scene = new Scene()
  const camera = new PerspectiveCamera(50, 1, 0.1, 120)
  camera.position.set(0, 0, 6)

  /* ── Lighting ── */
  scene.add(new AmbientLight(0xffffff, 0.15))
  const spot1 = new SpotLight(R, 2, 20, Math.PI / 4, 0.5)
  spot1.position.set(4, 4, 6)
  scene.add(spot1)
  const spot2 = new SpotLight(G, 1.5, 18, Math.PI / 4, 0.5)
  spot2.position.set(-4, 3, 5)
  scene.add(spot2)
  const spot3 = new SpotLight(B, 0.8, 15, Math.PI / 3, 0.5)
  spot3.position.set(0, -3, 5)
  scene.add(spot3)

  /* ── Background star field ── */
  const starN = isMobile ? 150 : 300
  const starArr = new Float32Array(starN * 3)
  for (let i = 0; i < starN; i++) {
    starArr[i * 3]     = (Math.random() - 0.5) * 16
    starArr[i * 3 + 1] = (Math.random() - 0.5) * 12
    starArr[i * 3 + 2] = -3 - Math.random() * 5
  }
  const starGeo = new BufferGeometry()
  starGeo.setAttribute('position', new Float32BufferAttribute(starArr, 3))
  scene.add(new Points(starGeo, new PointsMaterial({ color: G, size: 0.012, transparent: true, opacity: 0.4 })))

  /* ════════ SEG 1: India Map ════════ */
  const indiaG = new Group()
  scene.add(indiaG)

  // Map outline
  const mapPts = new Float32Array(INDIA.length * 3)
  INDIA.forEach(([x, y], i) => { mapPts[i*3]=x; mapPts[i*3+1]=y; mapPts[i*3+2]=0 })
  const mapGeo = new BufferGeometry()
  mapGeo.setAttribute('position', new Float32BufferAttribute(mapPts, 3))
  indiaG.add(new Line(mapGeo, new LineBasicMaterial({ color: G, transparent: true, opacity: 0.6 })))

  // Cities
  const cityMeshes: { dot: Mesh; glow: Mesh }[] = []
  CITIES.forEach(c => {
    const dot = new Mesh(new SphereGeometry(0.07, 10, 10),
      new MeshStandardMaterial({ color: c.c, emissive: c.c, emissiveIntensity: 0.8 }))
    dot.position.set(c.x, c.y, 0.05)
    indiaG.add(dot)
    const glow = new Mesh(new SphereGeometry(0.18, 10, 10),
      new MeshStandardMaterial({ color: c.c, emissive: c.c, emissiveIntensity: 0.3, transparent: true, opacity: 0.15 }))
    glow.position.set(c.x, c.y, 0.05)
    indiaG.add(glow)
    cityMeshes.push({ dot, glow })
  })

  // Connection arcs
  const arcData: Line[] = []
  for (let i = 0; i < CITIES.length; i++) {
    for (let j = i + 1; j < CITIES.length; j++) {
      const a = new Vector3(CITIES[i].x, CITIES[i].y, 0.05)
      const b = new Vector3(CITIES[j].x, CITIES[j].y, 0.05)
      const m = a.clone().add(b).multiplyScalar(0.5); m.z = 0.6
      const pts = new CatmullRomCurve3([a, m, b]).getPoints(20)
      const ag = new BufferGeometry().setFromPoints(pts)
      ag.setDrawRange(0, 0)
      const al = new Line(ag, new LineBasicMaterial({ color: R, transparent: true, opacity: 0.35 }))
      indiaG.add(al)
      arcData.push(al)
    }
  }

  // Map particles (fill the India shape)
  const mapPartN = isMobile ? 40 : 80
  const mpArr = new Float32Array(mapPartN * 3)
  for (let i = 0; i < mapPartN; i++) {
    const x = (Math.random() - 0.5) * 2.2
    const y = (Math.random() - 0.5) * 2.8
    mpArr[i*3] = x; mpArr[i*3+1] = y; mpArr[i*3+2] = (Math.random()-0.5)*0.3
  }
  const mpGeo = new BufferGeometry()
  mpGeo.setAttribute('position', new Float32BufferAttribute(mpArr, 3))
  indiaG.add(new Points(mpGeo, new PointsMaterial({ color: R, size: 0.02, transparent: true, opacity: 0.3 })))

  /* ════════ SEG 2: Brand ════════ */
  const brandG = new Group()
  scene.add(brandG)
  // Central emblem (golden shield-like hexagonal shape)
  const emblemMat = new MeshStandardMaterial({ color: G, emissive: G, emissiveIntensity: 0.3, metalness: 0.85, roughness: 0.15 })
  const emblem = new Mesh(new SphereGeometry(0.6, 6, 6), emblemMat) // hexagonal sphere
  brandG.add(emblem)
  // Outer ring
  const brandRing = new Mesh(new TorusGeometry(1.4, 0.025, 8, 48),
    new MeshStandardMaterial({ color: G, emissive: G, emissiveIntensity: 0.2, wireframe: true }))
  brandG.add(brandRing)
  const brandRing2 = new Mesh(new TorusGeometry(1.1, 0.02, 8, 48),
    new MeshStandardMaterial({ color: R, emissive: R, emissiveIntensity: 0.2, wireframe: true }))
  brandRing2.rotation.x = Math.PI / 4
  brandG.add(brandRing2)
  // Spiral particles
  const bpN = isMobile ? 40 : 80
  const bpArr = new Float32Array(bpN * 3)
  const bpPhases: number[] = []
  for (let i = 0; i < bpN; i++) {
    const a = (i/bpN)*Math.PI*6; const r = 0.8+(i/bpN)*1.5
    bpArr[i*3]=Math.cos(a)*r; bpArr[i*3+1]=(i/bpN-0.5)*3; bpArr[i*3+2]=Math.sin(a)*r
    bpPhases.push(a)
  }
  const bpGeo = new BufferGeometry()
  bpGeo.setAttribute('position', new Float32BufferAttribute(bpArr, 3))
  brandG.add(new Points(bpGeo, new PointsMaterial({ color: G, size: 0.025, transparent: true, opacity: 0.5 })))

  /* ════════ SEG 3: Real Estate Skyline ════════ */
  const reG = new Group()
  scene.add(reG)
  const bMat = new MeshStandardMaterial({ color: 0x1a1a2e, emissive: R, emissiveIntensity: 0.08, metalness: 0.4, roughness: 0.5 })
  const buildingData = [
    { x:-2.2, w:0.35, h:1.4 }, { x:-1.7, w:0.25, h:1.0 }, { x:-1.3, w:0.4, h:1.8 },
    { x:-0.8, w:0.2, h:0.7 }, { x:-0.4, w:0.3, h:1.3 }, { x:0.0, w:0.45, h:2.2 },
    { x:0.5, w:0.25, h:1.1 }, { x:0.9, w:0.35, h:1.6 }, { x:1.4, w:0.2, h:0.9 },
    { x:1.8, w:0.3, h:1.4 },
  ]
  const buildings: Mesh[] = []
  for (const b of buildingData) {
    const m = new Mesh(new BoxGeometry(b.w, b.h, 0.25), bMat.clone())
    m.position.set(b.x, -1.2+b.h/2, 0)
    reG.add(m)
    buildings.push(m)
  }
  // Window lights (tiny emissive points on buildings)
  const winN = isMobile ? 30 : 60
  const winArr = new Float32Array(winN * 3)
  for (let i = 0; i < winN; i++) {
    const bd = buildingData[i % buildingData.length]
    winArr[i*3] = bd.x + (Math.random()-0.5)*bd.w*0.8
    winArr[i*3+1] = -1.2 + Math.random()*bd.h*0.9
    winArr[i*3+2] = 0.14
  }
  const winGeo = new BufferGeometry()
  winGeo.setAttribute('position', new Float32BufferAttribute(winArr, 3))
  reG.add(new Points(winGeo, new PointsMaterial({ color: G, size: 0.03, transparent: true, opacity: 0.7 })))
  // Golden glow behind skyline
  const glowOrb = new Mesh(new SphereGeometry(1.5, 16, 16),
    new MeshStandardMaterial({ color: G, emissive: G, emissiveIntensity: 0.15, transparent: true, opacity: 0.1 }))
  glowOrb.position.set(0, 0.5, -1)
  reG.add(glowOrb)

  /* ════════ SEG 4: Startup ════════ */
  const startG = new Group()
  scene.add(startG)
  const rocket = new Mesh(new CylinderGeometry(0.12, 0.14, 0.8, 8),
    new MeshStandardMaterial({ color: 0xF8F7F5, emissive: 0xF8F7F5, emissiveIntensity: 0.1, metalness: 0.4 }))
  startG.add(rocket)
  const nose = new Mesh(new ConeGeometry(0.12, 0.25, 8),
    new MeshStandardMaterial({ color: R, emissive: R, emissiveIntensity: 0.3 }))
  nose.position.y = 0.525
  startG.add(nose)
  // Fins
  for (let i = 0; i < 3; i++) {
    const fin = new Mesh(new BoxGeometry(0.02, 0.2, 0.12),
      new MeshStandardMaterial({ color: R, emissive: R, emissiveIntensity: 0.2 }))
    const a = (i/3)*Math.PI*2
    fin.position.set(Math.cos(a)*0.14, -0.3, Math.sin(a)*0.14)
    startG.add(fin)
  }
  // Tricolor trail
  const trN = isMobile ? 30 : 60
  const trArr = new Float32Array(trN * 3)
  const trColors = new Float32Array(trN * 3)
  for (let i = 0; i < trN; i++) {
    trArr[i*3] = (Math.random()-0.5)*0.3
    trArr[i*3+1] = -0.6 - Math.random()*2
    trArr[i*3+2] = (Math.random()-0.5)*0.3
    // Saffron / white / green
    const c = i % 3 === 0 ? new Color(0xFF9933) : i % 3 === 1 ? new Color(0xFFFFFF) : new Color(0x138808)
    trColors[i*3]=c.r; trColors[i*3+1]=c.g; trColors[i*3+2]=c.b
  }
  const trGeo = new BufferGeometry()
  trGeo.setAttribute('position', new Float32BufferAttribute(trArr, 3))
  trGeo.setAttribute('color', new Float32BufferAttribute(trColors, 3))
  startG.add(new Points(trGeo, new PointsMaterial({ size: 0.04, transparent: true, opacity: 0.6, vertexColors: true })))
  // Growth chart bars
  const growthBars: Mesh[] = []
  const gbColors = [R, G, B, 0x10B981, 0x8B5CF6]
  const gbH = [0.5, 0.8, 0.6, 1.1, 0.9]
  for (let i = 0; i < 5; i++) {
    const bar = new Mesh(new BoxGeometry(0.15, gbH[i], 0.12),
      new MeshStandardMaterial({ color: gbColors[i], emissive: gbColors[i], emissiveIntensity: 0.15 }))
    bar.position.set(-0.8+i*0.35, -1+gbH[i]/2, 0.5)
    bar.scale.y = 0
    startG.add(bar)
    growthBars.push(bar)
  }

  /* ════════ SEG 5: Portfolio Constellation ════════ */
  const portG = new Group()
  scene.add(portG)
  const nodeColors = [R, G, B, 0x10B981, 0x8B5CF6, 0xF59E0B]
  const nodes: Mesh[] = []
  for (let i = 0; i < 6; i++) {
    const a = (i/6)*Math.PI*2
    const n = new Mesh(new SphereGeometry(0.14, 12, 12),
      new MeshStandardMaterial({ color: nodeColors[i], emissive: nodeColors[i], emissiveIntensity: 0.4, metalness: 0.5 }))
    n.position.set(Math.cos(a)*1.5, Math.sin(a)*1.5, 0)
    portG.add(n)
    nodes.push(n)
  }
  const hub = new Mesh(new SphereGeometry(0.25, 16, 16),
    new MeshStandardMaterial({ color: R, emissive: R, emissiveIntensity: 0.5, metalness: 0.7 }))
  portG.add(hub)
  const conLines: Line[] = []
  for (const n of nodes) {
    const l = new Line(new BufferGeometry().setFromPoints([new Vector3(), n.position.clone()]),
      new LineBasicMaterial({ color: G, transparent: true, opacity: 0.35 }))
    portG.add(l); conLines.push(l)
  }
  // Inter-node connections
  for (let i = 0; i < nodes.length; i++) {
    const j = (i+1) % nodes.length
    portG.add(new Line(new BufferGeometry().setFromPoints([nodes[i].position.clone(), nodes[j].position.clone()]),
      new LineBasicMaterial({ color: G, transparent: true, opacity: 0.15 })))
  }

  /* ════════ SEG 6: Returns ════════ */
  const retG = new Group()
  scene.add(retG)
  // Rupee symbol
  const rShape = new Shape()
  rShape.moveTo(-0.15,-0.5); rShape.lineTo(0,-0.5); rShape.lineTo(0.15,0)
  rShape.lineTo(0,0); rShape.lineTo(0,0.5); rShape.lineTo(-0.15,0.5)
  rShape.lineTo(-0.15,0); rShape.lineTo(-0.3,0); rShape.lineTo(-0.3,-0.08)
  rShape.lineTo(-0.15,-0.08); rShape.lineTo(-0.15,-0.5)
  const rMat = new MeshStandardMaterial({ color: G, emissive: G, emissiveIntensity: 0.25, metalness: 0.85, roughness: 0.15 })
  const rupee = new Mesh(new ExtrudeGeometry(rShape, { depth: 0.15, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2 }), rMat)
  rupee.scale.set(1.8, 1.8, 1.8)
  retG.add(rupee)
  const rBar1 = new Mesh(new BoxGeometry(1.2, 0.1, 0.15), rMat.clone())
  rBar1.position.set(-0.5, 0.7, 0.1); retG.add(rBar1)
  const rBar2 = new Mesh(new BoxGeometry(1.2, 0.1, 0.15), rMat.clone())
  rBar2.position.set(-0.5, 0.45, 0.1); retG.add(rBar2)
  // Growth arrow
  const arrowCurve = new CatmullRomCurve3([
    new Vector3(-1.5,-0.8,0.3), new Vector3(-0.5,-0.2,0.3),
    new Vector3(0.3,0.2,0.3), new Vector3(1.5,1.2,0.3)
  ])
  retG.add(new Line(new BufferGeometry().setFromPoints(arrowCurve.getPoints(30)),
    new LineBasicMaterial({ color: R, transparent: true, opacity: 0.8 })))
  const tip = new Mesh(new ConeGeometry(0.1, 0.2, 6),
    new MeshStandardMaterial({ color: R, emissive: R, emissiveIntensity: 0.4 }))
  tip.position.set(1.5, 1.2, 0.3); tip.rotation.z = -Math.PI/4; retG.add(tip)
  // Orbiting coins
  const coinN = isMobile ? 4 : 6
  const coinGeo = new CylinderGeometry(0.08, 0.08, 0.025, 10)
  const coinMat = new MeshStandardMaterial({ color: G, emissive: G, emissiveIntensity: 0.3, metalness: 0.9, roughness: 0.15 })
  const coins: { mesh: Mesh; a: number; r: number; sp: number; yOff: number }[] = []
  for (let i = 0; i < coinN; i++) {
    const m = new Mesh(coinGeo, coinMat); m.rotation.x = Math.PI/2; retG.add(m)
    coins.push({ mesh: m, a: (i/coinN)*Math.PI*2, r: 1.8+Math.random()*0.4, sp: 0.25+Math.random()*0.2, yOff: (Math.random()-0.5)*1.2 })
  }

  /* ════════ SEG 7: Tagline ════════ */
  const tagG = new Group()
  scene.add(tagG)
  const outN = isMobile ? 60 : 120
  const outArr = new Float32Array(outN * 3)
  const outDirs: Vector3[] = []
  for (let i = 0; i < outN; i++) {
    const th = Math.acos(2*Math.random()-1); const ph = Math.random()*Math.PI*2
    outDirs.push(new Vector3(Math.sin(th)*Math.cos(ph), Math.sin(th)*Math.sin(ph), Math.cos(th)))
  }
  const outGeo = new BufferGeometry()
  outGeo.setAttribute('position', new Float32BufferAttribute(outArr, 3))
  tagG.add(new Points(outGeo, new PointsMaterial({ color: G, size: 0.035, transparent: true, opacity: 0.6 })))
  const tagOrb = new Mesh(new SphereGeometry(0.5, 20, 20),
    new MeshStandardMaterial({ color: R, emissive: R, emissiveIntensity: 0.6, metalness: 0.7, roughness: 0.15 }))
  tagG.add(tagOrb)
  // Golden ring around outro
  tagG.add(new Mesh(new TorusGeometry(1.8, 0.015, 8, 60),
    new MeshStandardMaterial({ color: G, emissive: G, emissiveIntensity: 0.3, wireframe: true })))

  /* ── Init all hidden ── */
  const groups = [indiaG, brandG, reG, startG, portG, retG, tagG]
  groups.forEach(g => { g.scale.set(0.001,0.001,0.001); g.visible = false })

  /* ── Camera path (spline) ── */
  const camPath = new CatmullRomCurve3([
    new Vector3(0, 0, 6),
    new Vector3(0.5, 0.3, 5.5),
    new Vector3(-0.3, -0.2, 5.8),
    new Vector3(0.2, 0.5, 5.3),
    new Vector3(-0.4, 0.1, 5.6),
    new Vector3(0.3, -0.3, 5.4),
    new Vector3(0, 0, 6),
  ], true)

  let arcElapsed = 0

  function getSegmentIndex(t: number): number {
    const time = t % HERO_DURATION
    for (let i = HERO_SEGMENTS.length - 1; i >= 0; i--) {
      if (time >= HERO_SEGMENTS[i].start) return i
    }
    return 0
  }

  function update(t: number) {
    const time = t % HERO_DURATION
    arcElapsed = t

    // Star drift
    const sa = starGeo.attributes.position.array as Float32Array
    for (let i = 0; i < starN; i++) {
      sa[i*3+1] += Math.sin(time*0.1+i*0.05)*0.0005
    }
    starGeo.attributes.position.needsUpdate = true

    // Camera on spline
    const camT = (time / HERO_DURATION)
    const cp = camPath.getPoint(camT)
    camera.position.copy(cp)
    camera.lookAt(0, 0, 0)

    // Light movement
    spot1.position.x = 4 + Math.sin(time*0.2)*2
    spot1.position.y = 4 + Math.cos(time*0.15)*1.5
    spot2.position.x = -4 + Math.cos(time*0.18)*2
    spot3.position.y = -3 + Math.sin(time*0.25)*1

    // Segment visibility
    sg(indiaG,  sv(time, 0, 10))
    sg(brandG,  sv(time, 9, 18))
    sg(reG,     sv(time, 17, 27))
    sg(startG,  sv(time, 26, 35))
    sg(portG,   sv(time, 34, 44))
    sg(retG,    sv(time, 43, 52))
    sg(tagG,    sv(time, 51, 60))

    /* India */
    if (indiaG.visible) {
      cityMeshes.forEach((c, i) => {
        const p = 1+Math.sin(time*2.5+i*1.5)*0.2
        c.glow.scale.setScalar(p)
      })
      arcData.forEach((arc, i) => {
        const delay = i*0.4
        if (arcElapsed > delay) {
          const prog = Math.min(1, (arcElapsed - delay)*0.6)
          arc.geometry.setDrawRange(0, Math.floor(prog * arc.geometry.attributes.position.count))
        }
      })
      indiaG.rotation.y = Math.sin(time*0.08)*0.1
    }

    /* Brand */
    if (brandG.visible) {
      emblem.rotation.y = time*0.4
      brandRing.rotation.z = time*0.3
      brandRing2.rotation.z = -time*0.25
      const ba = bpGeo.attributes.position.array as Float32Array
      for (let i = 0; i < bpN; i++) {
        const a = bpPhases[i]+time*0.4; const r = 0.8+(i/bpN)*1.5
        ba[i*3]=Math.cos(a)*r; ba[i*3+2]=Math.sin(a)*r
      }
      bpGeo.attributes.position.needsUpdate = true
    }

    /* Real Estate */
    if (reG.visible) {
      const prog = ss(17, 21, time)
      buildings.forEach((b, i) => { b.scale.y = ss(0, 1, prog - i*0.06) })
      // Window twinkle
      const wa = winGeo.attributes.position.array as Float32Array
      for (let i = 0; i < winN; i++) {
        wa[i*3+2] = 0.14 + Math.sin(time*3+i*2.7)*0.01
      }
      winGeo.attributes.position.needsUpdate = true
    }

    /* Startup */
    if (startG.visible) {
      rocket.position.y = 0.4+Math.sin(time*1.5)*0.25
      nose.position.y = 0.925+Math.sin(time*1.5)*0.25
      const ta = trGeo.attributes.position.array as Float32Array
      for (let i = 0; i < trN; i++) {
        ta[i*3+1] = -0.6-Math.random()*2+Math.sin(time*1.5)*0.2
      }
      trGeo.attributes.position.needsUpdate = true
      const gProg = ss(26, 30, time)
      growthBars.forEach((b, i) => { b.scale.y = ss(0, 1, gProg-i*0.1) })
    }

    /* Portfolio */
    if (portG.visible) {
      const prog = ss(34, 37, time)
      nodes.forEach((n, i) => {
        const ns = ss(0, 1, prog-i*0.12)
        n.scale.setScalar(ns)
        const a = (i/6)*Math.PI*2+time*0.15
        n.position.set(Math.cos(a)*1.5, Math.sin(a)*1.5, 0)
      })
      const hs = 1+Math.sin(time*2)*0.12
      hub.scale.setScalar(hs)
      conLines.forEach((l, i) => {
        (l.geometry as BufferGeometry).setFromPoints([new Vector3(), nodes[i].position.clone()])
      })
    }

    /* Returns */
    if (retG.visible) {
      rupee.rotation.y = time*0.5
      coins.forEach(c => {
        c.a += c.sp*0.016
        c.mesh.position.set(Math.cos(c.a)*c.r, c.yOff+Math.sin(time+c.a)*0.15, Math.sin(c.a)*c.r-1)
        c.mesh.rotation.z += 0.006
      })
    }

    /* Tagline */
    if (tagG.visible) {
      const prog = ss(51, 54, time)
      const oa = outGeo.attributes.position.array as Float32Array
      for (let i = 0; i < outN; i++) {
        const r = prog*3
        oa[i*3]=outDirs[i].x*r; oa[i*3+1]=outDirs[i].y*r; oa[i*3+2]=outDirs[i].z*r
      }
      outGeo.attributes.position.needsUpdate = true
      const os = 1+Math.sin(time*3)*0.15
      tagOrb.scale.setScalar(os)
    }
  }

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
