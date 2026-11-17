import * as THREE from 'three'
import { mat, P, glassMat } from '../../engine/materials'
import { box, cyl, sph, markDynamic } from '../../engine/geom'
import { canvasTex, rng } from '../../engine/textures'
import { BRAND } from '../../brand'
import { M, chair, clutter, laptop, led, monitor, plantPot, screen, setLed, type PropBuilder, type PropDef, type SlotDef } from './common'

const FILAMENT = ['#F2C230', '#0E7A4F', '#E8546B', '#5BA4CF', '#F4F1EA', '#1C1F24', '#F07F2D', '#7B5CD6']

// ── 3D printers ──
export const printer3d: PropBuilder = (o) => {
  const g = new THREE.Group()
  const v = (o.variant as number) ?? 0
  const S = 0.44
  // frame + translucent panels so it reads from both sides of the glass wall
  box(g, S, 0.05, S, M.charcoal(), 0, 0, 0, 0.01)
  box(g, S, 0.03, S, M.charcoal(), 0, S - 0.03, 0, 0.01)
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) box(g, 0.03, S, 0.03, M.charcoal(), (sx * (S - 0.03)) / 2, 0, (sz * (S - 0.03)) / 2)
  const panel = glassMat('#9aa7b5', 0.22)
  for (const s of [-1, 1]) {
    const p = box(g, 0.012, S - 0.08, S - 0.04, panel, (s * (S - 0.02)) / 2, 0.05, 0)
    p.renderOrder = 3
    const q = box(g, S - 0.04, S - 0.08, 0.012, panel, 0, 0.05, (s * (S - 0.02)) / 2)
    q.renderOrder = 3
  }
  // bed
  box(g, S - 0.08, 0.015, S - 0.08, mat('#2a2d33', { rough: 0.3, metal: 0.4 }), 0, 0.09, 0)
  // light strip
  const strip = box(g, S - 0.08, 0.012, 0.02, new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#e8f4ff', emissiveIntensity: 1.5 }), 0, S - 0.06, -0.15)
  markDynamic(strip)
  // gantry + head (dynamic)
  const gantry = new THREE.Group()
  markDynamic(gantry)
  gantry.position.set(0, S - 0.1, 0)
  box(gantry, S - 0.06, 0.02, 0.025, M.alu(), 0, 0, 0)
  const head = new THREE.Group()
  box(head, 0.06, 0.07, 0.06, mat(v % 2 ? '#E9E9E9' : '#2B2F36', { rough: 0.4 }), 0, -0.04, 0, 0.01)
  cyl(head, 0.004, 0.008, 0.02, mat('#d6a24a', { metal: 0.8, rough: 0.3 }), 0, -0.06, 0, 6)
  gantry.add(head)
  g.add(gantry)
  // print object
  const color = FILAMENT[v % FILAMENT.length]
  const part = new THREE.Mesh(v % 3 === 0 ? new THREE.CylinderGeometry(0.06, 0.07, 1, 16) : new THREE.BoxGeometry(0.13, 1, 0.09), mat(color, { rough: 0.55 }))
  part.position.set(0, 0.1, 0)
  part.scale.y = 0.0001
  markDynamic(part)
  g.add(part)
  // spool on side
  const spool = new THREE.Group()
  spool.position.set(S / 2 + 0.035, S * 0.6, 0)
  spool.rotation.z = Math.PI / 2
  cyl(spool, 0.09, 0.09, 0.06, mat(color, { rough: 0.6 }), 0, -0.03, 0, 18)
  cyl(spool, 0.1, 0.1, 0.008, M.black(), 0, -0.035, 0, 18)
  cyl(spool, 0.1, 0.1, 0.008, M.black(), 0, 0.03, 0, 18)
  g.add(spool)
  const status = led(g, -S / 2 + 0.05, 0.03, S / 2 + 0.006)
  const status2 = led(g, -S / 2 + 0.05, 0.03, -S / 2 - 0.006)
  const def: PropDef = {
    group: g, w: S, d: S, noBlock: true,
    slots: [{ id: 'load', x: 0, z: 0.68, rot: 180, anim: 'standUse', kind: 'printer' }],
    info: { name: v === 99 ? 'Resin printer' : 'FDM 3D printer', category: 'Print farm', priceUSD: 1200, machine: true, desc: 'Enclosed CoreXY printer. Members queue jobs from their phone; the AI watches the camera feed and pauses on spaghetti.' },
    tick: (s, dt) => {
      const t = s.t
      if (s.active && !s.fault) {
        head.position.x = Math.sin(t * 5.3) * 0.13
        gantry.position.z = Math.sin(t * 1.7) * 0.12
        part.scale.y = Math.max(0.0001, s.progress * 0.2)
        part.position.y = 0.1 + part.scale.y / 2
        setLed(status, '#F2C230'); setLed(status2, '#F2C230')
      } else if (s.fault) {
        const on = Math.floor(t * 4) % 2 === 0
        setLed(status, '#ff3b3b', on); setLed(status2, '#ff3b3b', on)
      } else if (s.progress >= 1) {
        part.scale.y = 0.2
        part.position.y = 0.2
        setLed(status, '#3FE0B0'); setLed(status2, '#3FE0B0')
      } else {
        part.scale.y = 0.0001
        setLed(status, '#5BA4CF', false); setLed(status2, '#5BA4CF', false)
      }
      void dt
    },
  }
  return def
}

export const resinPrinter: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 0.42, 0.2, 0.4, mat('#E4E4E2', { rough: 0.35 }), 0, 0, 0, 0.03)
  const lid = box(g, 0.4, 0.42, 0.38, mat('#F07F2D', { rough: 0.1, opacity: 0.6 }), 0, 0.2, 0, 0.03)
  lid.renderOrder = 3
  const glow = box(g, 0.2, 0.02, 0.2, new THREE.MeshStandardMaterial({ color: '#7b3cff', emissive: '#7b3cff', emissiveIntensity: 0 }), 0, 0.21, 0)
  markDynamic(glow)
  screen(g, 0.12, 0.08, 'dash', 3, 0.1, 0.1, 0.205, 0, 1)
  return {
    group: g, w: 0.42, d: 0.4, noBlock: true,
    slots: [{ id: 'load', x: 0, z: 0.68, rot: 180, anim: 'standUse', kind: 'printer' }],
    info: { name: 'Resin (SLA) printer', category: 'Print farm', priceUSD: 4500, machine: true, desc: 'High-detail parts: enclosures, microfluidics, jewellery-grade prototypes.' },
    tick: (s) => {
      ;(glow.material as THREE.MeshStandardMaterial).emissiveIntensity = s.active ? 1.5 + Math.sin(s.t * 6) * 1.2 : 0
    },
  }
}

export const printerRack: PropBuilder = (o) => {
  const g = new THREE.Group()
  const idx = Number(String(o.id ?? 'pr0').replace(/\D/g, '')) || 0
  const W = 1.2, D = 0.6, H = 2.05
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.04, H, 0.04, M.dsteel(), (sx * (W - 0.04)) / 2, 0, (sz * (D - 0.04)) / 2)
  for (const y of [0.1, 0.78, 1.5]) box(g, W, 0.03, D, M.birch(), 0, y, 0)
  box(g, W, 0.03, D, M.dsteel(), 0, H - 0.03, 0)
  // spools + bins
  const r = rng(idx + 3)
  for (let i = 0; i < 4; i++) {
    const c = FILAMENT[Math.floor(r() * FILAMENT.length)]
    const sp = cyl(g, 0.09, 0.09, 0.07, mat(c, { rough: 0.6 }), -0.42 + i * 0.12, 0.13, 0.1, 16)
    sp.rotation.x = Math.PI / 2
    sp.position.y = 0.22
  }
  box(g, 0.5, 0.18, 0.4, mat(P.charcoal, { rough: 0.6 }), 0.3, 0.13, 0)
  const resin = idx === 4
  const children = resin
    ? [{ type: 'resinPrinter', x: -0.28, y: 0.81, z: 0, id: `rz${idx}a` }, { type: 'resinPrinter', x: 0.28, y: 1.53, z: 0, id: `rz${idx}b` }]
    : [{ type: 'printer3d', x: -0.3, y: 0.81, z: 0, id: `p${idx}a`, opts: { variant: idx * 2 } }, { type: 'printer3d', x: 0.3, y: 1.53, z: 0, id: `p${idx}b`, opts: { variant: idx * 2 + 1 } }]
  // label
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.1), new THREE.MeshStandardMaterial({ map: canvasTex(128, 40, (c, w, h) => { c.fillStyle = BRAND.colors.yellow; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(`P${idx + 1}`, w / 2, h / 2 + 2) }, false) }))
  lbl.position.set(-0.4, 0.55, D / 2 + 0.005)
  g.add(lbl)
  return { group: g, w: W, d: D, children }
}

// ── Electronics bench: 4 seats, double-sided ──
export const elecBench: PropBuilder = (o) => {
  const g = new THREE.Group()
  const seed = String(o.id ?? 'b').charCodeAt(1) * 7 + String(o.id ?? 'b00').charCodeAt(2)
  const W = 3.0, D = 1.5, H = 0.78
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.06, H, 0.06, M.dsteel(), sx * (W / 2 - 0.08), 0, sz * (D / 2 - 0.08))
  box(g, W - 0.1, 0.05, 0.05, M.dsteel(), 0, 0.15, D / 2 - 0.08)
  box(g, W - 0.1, 0.05, 0.05, M.dsteel(), 0, 0.15, -D / 2 + 0.08)
  box(g, W, 0.04, D, mat('#D7D9D6', { rough: 0.5 }), 0, H - 0.04, 0, 0.01)
  // ESD mats each side
  box(g, W - 0.1, 0.006, D / 2 - 0.25, M.esd(), 0, H, D / 4 + 0.08)
  box(g, W - 0.1, 0.006, D / 2 - 0.25, M.esd(), 0, H, -D / 4 - 0.08)
  // centre riser with instruments both sides
  box(g, W - 0.1, 0.03, 0.42, M.birch(), 0, H + 0.36, 0)
  for (const x of [-1.4, 0, 1.4]) box(g, 0.04, 0.36, 0.3, M.dsteel(), x, H, 0)
  box(g, W - 0.2, 0.06, 0.06, mat(P.charcoal), 0, H + 0.02, 0) // power strip
  // overhead light bar
  for (const x of [-1.4, 1.4]) box(g, 0.04, 1.4, 0.04, M.dsteel(), x, H + 0.39, 0)
  box(g, W - 0.2, 0.05, 0.12, M.dsteel(), 0, H + 1.78, 0)
  const lightBar = box(g, W - 0.3, 0.012, 0.09, new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#fff8ea', emissiveIntensity: 0.6 }), 0, H + 1.765, 0)
  lightBar.userData.nightGlow = 2.5
  markDynamic(lightBar)
  const r = rng(seed)
  const slots: SlotDef[] = []
  const seats: [number, number][] = [[-0.75, 1], [0.75, 1], [-0.75, -1], [0.75, -1]]
  seats.forEach(([sx, side], i) => {
    const zf = side * 0.5 // instrument facing side
    const rotY = side > 0 ? 0 : Math.PI
    // scope on riser
    const sc = new THREE.Group()
    sc.position.set(sx - 0.15, H + 0.39, side * 0.08)
    sc.rotation.y = rotY
    box(sc, 0.36, 0.18, 0.12, mat('#DADDE0', { rough: 0.4 }), 0, 0, 0, 0.012)
    screen(sc, 0.17, 0.11, 'scope', i + seed, -0.07, 0.095, 0.061, 0, 1.3)
    for (let k = 0; k < 6; k++) cyl(sc, 0.012, 0.012, 0.012, M.charcoal(), 0.06 + (k % 3) * 0.04, 0.05 + Math.floor(k / 3) * 0.06, 0.06, 8).rotation.x = Math.PI / 2
    g.add(sc)
    // bench PSU
    const ps = new THREE.Group()
    ps.position.set(sx + 0.25, H + 0.39, side * 0.08)
    ps.rotation.y = rotY
    box(ps, 0.2, 0.12, 0.12, mat('#2F3338', { rough: 0.5 }), 0, 0, 0, 0.01)
    const disp = box(ps, 0.12, 0.035, 0.005, new THREE.MeshStandardMaterial({ color: '#000', emissive: '#ff6a3d', emissiveIntensity: 1.4 }), -0.02, 0.07, 0.061)
    disp.userData.nightGlow = 1
    g.add(ps)
    // soldering station + iron stand
    box(g, 0.14, 0.08, 0.12, mat('#1F6FB2', { rough: 0.45 }), sx + 0.35, H, zf + side * 0.05, 0.01)
    cyl(g, 0.025, 0.03, 0.1, M.steel(), sx + 0.5, H, zf + side * 0.05, 8)
    // work: laptop or breadboard + PCB
    if (r() > 0.35) laptop(g, sx - 0.2, H, zf + side * 0.12, rotY, r() > 0.5 ? 'code' : 'pcb', i + seed)
    box(g, 0.16, 0.012, 0.055, mat('#F3F3F0', { rough: 0.5 }), sx + 0.12, H, zf + side * 0.18)
    box(g, 0.1, 0.01, 0.07, mat('#126B3F', { rough: 0.4 }), sx + 0.12, H + 0.012, zf + side * 0.08)
    clutter(g, sx - 0.05, H, zf + side * 0.02, seed + i * 11, 0.35)
    // fume extractor arm
    if (i % 2 === 0) {
      cyl(g, 0.012, 0.012, 0.35, M.charcoal(), sx + 0.6, H + 0.39, side * 0.05, 6)
      box(g, 0.13, 0.1, 0.08, M.charcoal(), sx + 0.6, H + 0.72, side * 0.12, 0.02)
    }
    // chair
    chair(g, sx, side * 1.05, side > 0 ? 180 : 0, 'office', i % 2 ? '#2E3B4E' : '#3A3F47')
    slots.push({ id: `seat${i}`, x: sx, z: side * 1.02, rot: side > 0 ? 180 : 0, anim: 'sitSolder', kind: 'benchSeat', y: 0.47 })
  })
  return {
    group: g, w: W, d: D, slots, pad: 0.12,
    info: { name: 'Electronics bench (4 seats)', category: 'Bench hall', priceUSD: 4800, desc: 'Per seat: 4-ch scope, bench supply, soldering station, ESD mat, fume extraction, 8 power outlets.' },
  }
}

export const toolCart: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 0.7, 0.85, 0.45, mat(BRAND.colors.clay, { rough: 0.45, metal: 0.3 }), 0, 0.08, 0, 0.02)
  for (let i = 0; i < 4; i++) box(g, 0.64, 0.01, 0.005, M.dsteel(), 0, 0.25 + i * 0.17, 0.226)
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) cyl(g, 0.04, 0.04, 0.06, M.black(), sx * 0.3, 0, sz * 0.18, 10).rotation.x = Math.PI / 2
  clutter(g, 0, 0.93, 0, 5, 0.5)
  return { group: g, w: 0.7, d: 0.45 }
}

function scribbleTex(seed: number) {
  return canvasTex(512, 280, (c, w, h) => {
    c.fillStyle = '#FBFBF8'; c.fillRect(0, 0, w, h)
    const r = rng(seed)
    const cols = ['#1F6FB2', '#C62828', '#1C1F24', '#0E7A4F']
    c.lineWidth = 3
    for (let i = 0; i < 6; i++) {
      c.strokeStyle = cols[i % 4]
      const x = 30 + r() * 380, y = 30 + r() * 200
      c.strokeRect(x, y, 60 + r() * 50, 30 + r() * 30)
      c.beginPath(); c.moveTo(x + 60, y + 15); c.lineTo(x + 120 + r() * 60, y + 15 + (r() - 0.5) * 80); c.stroke()
    }
    c.fillStyle = '#1C1F24'; c.font = 'bold 22px sans-serif'
    c.fillText(['SENSOR → ESP32 → LoRa', 'v2 enclosure: IP54?', 'BOM < ₦45k', 'pilot @ Mile 12'][seed % 4], 30, 30)
  }, false)
}

export const whiteboard: PropBuilder = (o) => {
  const g = new THREE.Group()
  box(g, 2.0, 1.15, 0.04, M.alu(), 0, 0.95, 0, 0.01)
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.92, 1.07), new THREE.MeshStandardMaterial({ map: scribbleTex(((o.seed as number) ?? 1) + 2), roughness: 0.25 }))
  face.position.set(0, 1.525, 0.022)
  g.add(face)
  box(g, 1.6, 0.03, 0.06, M.alu(), 0, 0.92, 0.04)
  return { group: g, w: 2.0, d: 0.1, noBlock: true }
}

export const whiteboardStand: PropBuilder = () => {
  const g = new THREE.Group()
  for (const sx of [-0.85, 0.85]) {
    box(g, 0.04, 1.9, 0.04, M.alu(), sx, 0, 0)
    box(g, 0.05, 0.03, 0.6, M.alu(), sx, 0.05, 0)
  }
  box(g, 1.8, 1.0, 0.03, M.alu(), 0, 0.85, 0)
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1.74, 0.94), new THREE.MeshStandardMaterial({ map: scribbleTex(3), roughness: 0.25 }))
  face.position.set(0, 1.35, 0.017)
  g.add(face)
  return { group: g, w: 1.8, d: 0.6 }
}

export const cadDesk: PropBuilder = (o) => {
  const g = new THREE.Group()
  const v = String(o.id ?? 'cad1').charCodeAt(3)
  box(g, 1.4, 0.04, 0.7, M.birch(), 0, 0.72, 0, 0.01)
  for (const sx of [-0.65, 0.65]) box(g, 0.05, 0.72, 0.6, M.charcoal(), sx, 0, 0)
  monitor(g, -0.28, 0.76, -0.2, 'cad', v, 0.58, 0.34)
  monitor(g, 0.32, 0.76, -0.2, v % 2 ? 'pcb' : 'code', v, 0.5, 0.3, -0.25)
  box(g, 0.42, 0.015, 0.13, M.charcoal(), 0, 0.76, 0.12, 0.005)
  box(g, 0.1, 0.04, 0.1, mat('#3a3f47'), 0.36, 0.76, 0.12, 0.02)
  chair(g, 0, 0.55, 180, 'office')
  return {
    group: g, w: 1.4, d: 0.7,
    slots: [{ id: 'seat', x: 0, z: 0.55, rot: 180, anim: 'sitType', kind: 'cadSeat', y: 0.47 }],
    info: { name: 'CAD workstation', category: 'Design', priceUSD: 2200, desc: 'GPU workstation with Fusion/KiCad/FreeCAD and a 3D mouse. Design here, fabricate next door.' },
  }
}

export const meetingTable: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 3.2, 0.05, 1.2, M.walnut(), 0, 0.73, 0, 0.02)
  for (const sx of [-1.2, 1.2]) box(g, 0.08, 0.73, 0.8, M.black(), sx, 0, 0)
  const slots: SlotDef[] = []
  ;[-1, 0, 1].forEach((k, i) => {
    chair(g, k * 0.95, 0.85, 180, 'office', '#2E3B4E')
    chair(g, k * 0.95, -0.85, 0, 'office', '#2E3B4E')
    slots.push({ id: `n${i}`, x: k * 0.95, z: -0.85, rot: 0, anim: 'sitTalk', kind: 'meetingSeat', y: 0.47 })
    slots.push({ id: `s${i}`, x: k * 0.95, z: 0.85, rot: 180, anim: 'sitTalk', kind: 'meetingSeat', y: 0.47 })
  })
  laptop(g, -0.9, 0.78, 0.25, Math.PI, 'dash', 1)
  laptop(g, 0.6, 0.78, -0.25, 0, 'cad', 2)
  cyl(g, 0.08, 0.08, 0.03, M.black(), 0, 0.78, 0, 16)
  return { group: g, w: 3.2, d: 1.2, slots, pad: 0.1 }
}

export const wallTV: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 1.7, 0.98, 0.05, M.black(), 0, 1.1, 0, 0.01)
  screen(g, 1.64, 0.92, 'tv', 0, 0, 1.59, 0.03, 0, 1.2)
  return { group: g, w: 1.7, d: 0.1, noBlock: true }
}

export const studioTable: PropBuilder = (o) => {
  const g = new THREE.Group()
  box(g, 2.4, 0.05, 1.2, M.birch(), 0, 0.73, 0, 0.02)
  for (const sx of [-1.1, 1.1]) for (const sz of [-0.5, 0.5]) box(g, 0.05, 0.73, 0.05, M.black(), sx, 0, sz)
  const slots: SlotDef[] = []
  ;[-0.6, 0.6].forEach((x, i) => {
    chair(g, x, 0.85, 180, 'office', '#C8643B')
    chair(g, x, -0.85, 0, 'office', '#C8643B')
    slots.push({ id: `s${i}`, x, z: 0.85, rot: 180, anim: 'sitType', kind: 'studioSeat', y: 0.47 })
    slots.push({ id: `n${i}`, x, z: -0.85, rot: 0, anim: 'sitType', kind: 'studioSeat', y: 0.47 })
  })
  laptop(g, -0.6, 0.78, 0.3, Math.PI, 'code', 3)
  laptop(g, 0.6, 0.78, -0.3, 0, 'cad', 4)
  if (o.proto === 'drone') {
    const d = new THREE.Group()
    d.position.set(0, 0.78, 0)
    box(d, 0.3, 0.04, 0.3, M.black(), 0, 0.02, 0, 0.02)
    for (let k = 0; k < 4; k++) {
      const a = Math.PI / 4 + (k * Math.PI) / 2
      const arm = box(d, 0.36, 0.02, 0.03, M.charcoal(), Math.cos(a) * 0.18, 0.03, Math.sin(a) * 0.18)
      arm.rotation.y = -a
      cyl(d, 0.1, 0.1, 0.005, mat('#333', { opacity: 0.6 }), Math.cos(a) * 0.34, 0.07, Math.sin(a) * 0.34, 16)
    }
    g.add(d)
  } else {
    box(g, 0.24, 0.14, 0.16, mat(BRAND.colors.green, { rough: 0.4 }), 0, 0.78, 0, 0.03)
    box(g, 0.08, 0.004, 0.08, mat('#0c1b2e', { rough: 0.2, metal: 0.3 }), 0.06, 0.92, 0)
  }
  return { group: g, w: 2.4, d: 1.2, slots, pad: 0.1 }
}

export const shelf: PropBuilder = () => {
  const g = new THREE.Group()
  for (const sx of [-0.95, 0.95]) box(g, 0.04, 1.8, 0.4, M.charcoal(), sx, 0, 0)
  for (const y of [0.05, 0.5, 0.95, 1.4, 1.78]) box(g, 1.94, 0.025, 0.4, M.birch(), 0, y, 0)
  const r = rng(9)
  const cols = [P.yellow, P.green, P.clay, P.sky, P.charcoal, P.white]
  for (let lvl = 0; lvl < 4; lvl++) for (let i = 0; i < 4; i++) if (r() > 0.25) box(g, 0.3, 0.15 + r() * 0.2, 0.3, mat(cols[(r() * cols.length) | 0], { rough: 0.6 }), -0.7 + i * 0.47, 0.08 + lvl * 0.45, 0, 0.01)
  return { group: g, w: 1.95, d: 0.4 }
}

// ── Component library ──
const AISLE_COL: Record<string, string> = { A: '#F2C230', B: '#5BA4CF', C: '#E8546B' }
export const binShelf: PropBuilder = (o) => {
  const g = new THREE.Group()
  const aisle = (o.aisle as string) ?? 'A'
  const W = 2.4, D = 0.6, H = 2.2
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.04, H, 0.04, M.dsteel(), (sx * (W - 0.04)) / 2, 0, (sz * (D - 0.04)) / 2)
  const levels = 6
  const binM = [mat(AISLE_COL[aisle], { rough: 0.5 }), mat('#F4F1EA', { rough: 0.5 }), mat('#2B2F36', { rough: 0.5 })]
  for (let l = 0; l < levels; l++) {
    const y = 0.12 + l * 0.34
    box(g, W, 0.02, D, M.alu(), 0, y, 0)
    for (const s of [-1, 1]) for (let i = 0; i < 8; i++) {
      const b = box(g, 0.25, 0.15, 0.26, binM[(i + l) % 7 === 0 ? 2 : (i + l) % 3 === 0 ? 1 : 0], -W / 2 + 0.17 + i * 0.295, y + 0.02, s * 0.14, 0.01)
      b.scale.x = 0.95
    }
    // label strips
    for (const s of [-1, 1]) box(g, W - 0.05, 0.03, 0.005, M.white(), 0, y - 0.03, s * (D / 2 + 0.003))
  }
  box(g, W, 0.02, D, M.dsteel(), 0, H - 0.02, 0)
  // aisle marker on top
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshStandardMaterial({
    map: canvasTex(128, 96, (c, w, h) => { c.fillStyle = AISLE_COL[aisle]; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = 'bold 70px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(aisle, w / 2, h / 2 + 4) }, false),
    side: THREE.DoubleSide,
  }))
  tag.position.set(-W / 2 + 0.3, H + 0.22, 0)
  g.add(tag)
  const slots: SlotDef[] = []
  for (const s of [-1, 1]) for (const x of [-0.8, 0, 0.8]) slots.push({ id: `pick${s > 0 ? 'f' : 'b'}${x}`, x, z: s * 0.75, rot: s > 0 ? 180 : 0, anim: 'reach', kind: 'libPick' })
  return {
    group: g, w: W, d: D, slots,
    info: { name: `Aisle ${aisle} shelving`, category: 'Component library', priceUSD: 700, desc: 'Every bin has a code. The ops app routes staff to Aisle, Bay and Bin, and counts stock as items leave.' },
  }
}

export const libraryDesk: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 1.6, 0.9, 0.6, M.white(), 0, 0, 0, 0.02)
  box(g, 1.66, 0.04, 0.66, mat('#EDE8DF', { rough: 0.3 }), 0, 0.9, 0)
  monitor(g, -0.35, 0.94, -0.1, 'dash', 2, 0.48, 0.3, Math.PI)
  box(g, 0.2, 0.12, 0.2, M.charcoal(), 0.45, 0.94, -0.05, 0.02) // label printer
  box(g, 0.14, 0.2, 0.05, M.black(), 0.15, 0.94, 0.1, 0.01) // scanner
  return {
    group: g, w: 1.6, d: 0.6,
    slots: [{ id: 'staff', x: 0, z: -0.62, rot: 0, anim: 'standType', kind: 'libraryStaff' }],
    info: { name: 'Library desk', category: 'Component library', priceUSD: 1500, desc: 'Requests arrive from the member app. The AI picks the nearest staff member and shows them where the part lives.' },
  }
}

export const pickCart: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 0.8, 0.04, 0.5, M.dsteel(), 0, 0.25, 0)
  box(g, 0.8, 0.04, 0.5, M.dsteel(), 0, 0.8, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.03, 0.85, 0.03, M.dsteel(), sx * 0.38, 0.05, sz * 0.23)
  box(g, 0.3, 0.14, 0.24, mat('#5BA4CF'), -0.18, 0.84, 0, 0.01)
  box(g, 0.3, 0.14, 0.24, mat('#F2C230'), 0.18, 0.84, 0, 0.01)
  return { group: g, w: 0.8, d: 0.5 }
}

// ── Parts shop ──
export const shopCounter: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 4.0, 0.95, 0.75, mat(BRAND.colors.violet, { rough: 0.5 }), 0, 0, 0, 0.02)
  const top = box(g, 4.0, 0.12, 0.75, glassMat('#ecf4ff', 0.35), 0, 0.95, 0)
  top.renderOrder = 2
  box(g, 4.06, 0.03, 0.8, M.black(), 0, 1.07, 0)
  const r = rng(31)
  const cols = ['#126B3F', '#1F6FB2', '#C62828', '#1C1F24']
  for (let i = 0; i < 14; i++) box(g, 0.1 + r() * 0.08, 0.015, 0.07, mat(cols[i % 4], { rough: 0.4 }), -1.8 + i * 0.27, 0.97, (r() - 0.5) * 0.3)
  box(g, 0.28, 0.2, 0.02, M.black(), 1.4, 1.1, 0.2).rotation.x = -0.5
  const slots: SlotDef[] = [
    { id: 'staff', x: 0, z: -0.75, rot: 0, anim: 'standType', kind: 'shopStaff' },
    { id: 'c1', x: -1.0, z: 0.8, rot: 180, anim: 'talk', kind: 'shopCustomer' },
    { id: 'c2', x: 1.0, z: 0.8, rot: 180, anim: 'talk', kind: 'shopCustomer' },
  ]
  return { group: g, w: 4.06, d: 0.8, slots, info: { name: 'Parts counter', category: 'Parts shop', priceUSD: 3000, desc: 'Open to the public. Genuine boards and sensors with tested stock, priced fairly, sold by the piece.' } }
}

export const displayShelf: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 1.9, 2.1, 0.4, mat('#F4F1EA', { rough: 0.6 }), 0, 0, -0.02, 0.01)
  const r = rng(77)
  const cols = [P.yellow, P.green, P.clay, P.sky, P.violet, '#1F6FB2', '#C62828', P.charcoal]
  for (let l = 0; l < 5; l++) {
    box(g, 1.86, 0.02, 0.4, M.birch(), 0, 0.15 + l * 0.4, 0.01)
    for (let i = 0; i < 7; i++) box(g, 0.18, 0.2 + r() * 0.1, 0.22, mat(cols[(r() * cols.length) | 0], { rough: 0.5 }), -0.78 + i * 0.26, 0.17 + l * 0.4, 0.05, 0.01)
  }
  return { group: g, w: 1.9, d: 0.42 }
}

export const displayTable: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 1.6, 0.85, 0.9, M.walnut(), 0, 0, 0, 0.02)
  const r = rng(13)
  const cols = [P.yellow, P.green, P.clay, P.sky]
  for (let i = 0; i < 8; i++) box(g, 0.28, 0.08 + r() * 0.06, 0.2, mat(cols[i % 4], { rough: 0.5 }), -0.55 + (i % 4) * 0.37, 0.85, i < 4 ? -0.2 : 0.2, 0.01)
  plantPot(g, 0.6, 0, 0.3, 0.85)
  return { group: g, w: 1.6, d: 0.9, slots: [{ id: 'browse', x: 0, z: 0.75, rot: 180, anim: 'stand', kind: 'browse' }] }
}

export const neonSign: PropBuilder = (o) => {
  const g = new THREE.Group()
  const text = (o.text as string) ?? 'PARTS'
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.45), new THREE.MeshStandardMaterial({
    map: canvasTex(512, 144, (c, w, h) => {
      c.clearRect(0, 0, w, h)
      c.fillStyle = 'rgba(20,10,40,0.95)'; c.fillRect(0, 0, w, h)
      c.font = 'bold 100px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'
      c.shadowColor = '#c9b8ff'; c.shadowBlur = 24; c.fillStyle = '#efe8ff'; c.fillText(text, w / 2, h / 2 + 6)
    }, false),
    emissive: '#ffffff', emissiveIntensity: 1.1, roughness: 0.4,
  }))
  ;(m.material as THREE.MeshStandardMaterial).emissiveMap = (m.material as THREE.MeshStandardMaterial).map
  m.position.set(0, 2.85, 0.03)
  m.userData.nightGlow = 2
  markDynamic(m)
  g.add(m)
  return { group: g, w: 1.6, d: 0.05, noBlock: true }
}

export const kidsTable: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 1.3, 0.04, 0.85, mat('#F4F1EA', { rough: 0.4 }), 0, 0.58, 0, 0.03)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(g, 0.025, 0.025, 0.58, mat(BRAND.colors.sky), sx * 0.55, 0, sz * 0.33, 8)
  const cols = [BRAND.colors.rose, BRAND.colors.yellow, BRAND.colors.teal, BRAND.colors.violet]
  const slots: SlotDef[] = []
  ;([[-0.35, 0.65, 180], [0.35, 0.65, 180], [-0.35, -0.65, 0], [0.35, -0.65, 0]] as const).forEach(([x, z, r], i) => {
    chair(g, x, z, r, 'kid', cols[i])
    slots.push({ id: `k${i}`, x, z, rot: r, anim: 'sitType', kind: 'classSeat', y: 0.36 })
  })
  // robot kit on table
  box(g, 0.22, 0.08, 0.16, mat(BRAND.colors.yellow), 0, 0.62, 0, 0.02)
  for (const s of [-1, 1]) cyl(g, 0.04, 0.04, 0.03, M.black(), s * 0.12, 0.66, 0, 12).rotation.z = Math.PI / 2
  return { group: g, w: 1.3, d: 0.85, slots, pad: 0.1 }
}

export const teacherScreen: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 2.0, 1.15, 0.06, M.black(), 0, 1.0, 0, 0.01)
  screen(g, 1.94, 1.08, 'class', 0, 0, 1.575, 0.035, 0, 1.1)
  plantPot(g, 1.3, 0.4, 0.6)
  return { group: g, w: 2.0, d: 0.2, slots: [{ id: 'teacher', x: 0.3, z: 1.0, rot: 90, anim: 'present', kind: 'teacher' }] }
}

export const kitShelf: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 2.0, 1.1, 0.4, mat('#F4F1EA', { rough: 0.6 }), 0, 0, 0, 0.02)
  const cols = [BRAND.colors.rose, BRAND.colors.yellow, BRAND.colors.teal, BRAND.colors.violet, BRAND.colors.sky]
  for (let l = 0; l < 2; l++) for (let i = 0; i < 6; i++) box(g, 0.28, 0.22, 0.3, mat(cols[(i + l) % 5], { rough: 0.5 }), -0.8 + i * 0.32, 0.12 + l * 0.5, 0.06, 0.02)
  return { group: g, w: 2.0, d: 0.4 }
}

export const wcStalls: PropBuilder = () => {
  const g = new THREE.Group()
  for (const x of [-0.75, 0.75]) {
    box(g, 0.04, 2.0, 1.4, mat('#9AA3AD', { rough: 0.4 }), x + 0.73, 0.1, 0)
    box(g, 0.45, 0.4, 0.6, M.white(), x, 0, -0.35, 0.08)
  }
  box(g, 2.9, 0.04, 0.5, mat('#EDE8DF'), 0, 0.85, 1.6)
  return { group: g, w: 2.9, d: 1.4, slots: [{ id: 'use', x: 0, z: 1.1, rot: 180, anim: 'stand', kind: 'wc' }] }
}

export const prayerMats: PropBuilder = () => {
  const g = new THREE.Group()
  const cols = ['#0E7A4F', '#7A1F2B', '#1F3A6B']
  for (let i = 0; i < 3; i++) {
    const m = box(g, 0.7, 0.012, 1.2, mat(cols[i], { rough: 0.95 }), -0.85 + i * 0.85, 0, 0)
    m.receiveShadow = true
  }
  box(g, 0.9, 0.35, 0.3, M.walnut(), 0.9, 0, 1.6) // shoe rack
  return { group: g, w: 2.6, d: 1.3, noBlock: true, slots: [{ id: 'p0', x: 0, z: 0.3, rot: 180, anim: 'pray', kind: 'prayer' }] }
}

export { plantPot }
