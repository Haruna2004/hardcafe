import * as THREE from 'three'
import { mat, P, glassMat } from '../../engine/materials'
import { box, cyl, sph, markDynamic } from '../../engine/geom'
import { canvasTex, rng } from '../../engine/textures'
import { BRAND } from '../../brand'
import { M, chair, clutter, led, screen, setLed, type PropBuilder } from './common'

function beam(): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), new THREE.MeshStandardMaterial({ color: '#ff5a2a', emissive: '#ff4a1a', emissiveIntensity: 0 }))
  markDynamic(m)
  return m
}

function duct(parent: THREE.Object3D, x: number, y0: number, z0: number, zWall: number, top = 3.3) {
  cyl(parent, 0.09, 0.09, top - y0, mat('#C9CED4', { rough: 0.3, metal: 0.8 }), x, y0, z0, 12)
  const h = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, Math.abs(z0 - zWall), 12), mat('#C9CED4', { rough: 0.3, metal: 0.8 }))
  h.rotation.x = Math.PI / 2
  h.position.set(x, top, (z0 + zWall) / 2)
  parent.add(h)
}

export const laserCO2: PropBuilder = () => {
  const g = new THREE.Group()
  const W = 1.9, D = 1.05
  box(g, W, 0.82, D, mat('#E6E7E3', { rough: 0.45 }), 0, 0, 0, 0.02)
  box(g, W, 0.06, D, M.black(), 0, 0, 0)
  // lid (dark frame + orange window)
  const lid = new THREE.Group()
  lid.position.set(0, 0.82, 0)
  box(lid, W, 0.22, D, M.charcoal(), 0, 0, 0, 0.02)
  const win = box(lid, W - 0.5, 0.012, D - 0.3, mat('#F07F2D', { rough: 0.1, opacity: 0.55 }), -0.12, 0.215, 0)
  win.renderOrder = 3
  g.add(lid)
  // control panel
  const cp = box(g, 0.3, 0.05, 0.4, M.black(), W / 2 - 0.2, 1.05, 0.05)
  cp.rotation.x = -0.2
  screen(g, 0.16, 0.1, 'dash', 5, W / 2 - 0.2, 1.11, 0.08, 0, 1.1).rotation.x = -Math.PI / 2 + 0.2
  // honeycomb bed + material
  box(g, W - 0.55, 0.01, D - 0.35, mat('#9aa0a6', { metal: 0.6, rough: 0.5 }), -0.12, 0.8, 0)
  box(g, 0.9, 0.006, 0.6, mat(P.plywood), -0.12, 0.812, 0)
  // gantry + head (visible through lid)
  const gantry = new THREE.Group()
  markDynamic(gantry)
  gantry.position.set(-0.12, 0.95, 0)
  box(gantry, W - 0.6, 0.03, 0.04, M.alu(), 0, 0, 0)
  const head = new THREE.Group()
  box(head, 0.06, 0.08, 0.06, M.black(), 0, -0.04, 0)
  const b = beam()
  b.position.set(0, -0.1, 0)
  head.add(b)
  gantry.add(head)
  g.add(gantry)
  duct(g, -0.7, 1.04, -0.45, -1.4, 3.3)
  const st = led(g, W / 2 - 0.05, 0.75, D / 2 + 0.006)
  return {
    group: g, w: W, d: D + 0.2,
    slots: [{ id: 'op', x: 0.2, z: 0.85, rot: 180, anim: 'standUse', kind: 'laser' }],
    info: { name: '100 W CO₂ laser cutter (1300×900)', category: 'Fabrication', priceUSD: 7500, machine: true, desc: 'Cuts 10 mm acrylic and plywood, engraves anodised aluminium. Ducted extraction with filter.' },
    tick: (s) => {
      if (s.active && !s.fault) {
        head.position.x = Math.sin(s.t * 3.1) * 0.55
        gantry.position.z = Math.sin(s.t * 0.9) * 0.28
        ;(b.material as THREE.MeshStandardMaterial).emissiveIntensity = 6 + Math.random() * 4
        setLed(st, '#F2C230')
      } else {
        ;(b.material as THREE.MeshStandardMaterial).emissiveIntensity = 0
        setLed(st, s.fault ? '#ff3b3b' : '#3FE0B0', !s.fault || Math.floor(s.t * 4) % 2 === 0)
      }
    },
  }
}

export const laserDesktop: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 1.3, 0.72, 0.85, M.birch(), 0, 0, 0, 0.02)
  box(g, 1.25, 0.04, 0.8, M.charcoal(), 0, 0.12, 0)
  const body = new THREE.Group()
  body.position.set(0, 0.72, 0)
  box(body, 1.05, 0.22, 0.68, mat('#2B2F36', { rough: 0.4 }), 0, 0, 0, 0.03)
  const lid = box(body, 0.95, 0.1, 0.6, mat('#3a1d0a', { rough: 0.1, opacity: 0.7 }), 0, 0.22, 0, 0.02)
  lid.renderOrder = 3
  const head = new THREE.Group()
  markDynamic(head)
  head.position.set(0, 0.26, 0)
  box(head, 0.06, 0.06, 0.06, M.alu(), 0, 0, 0)
  const b = beam()
  b.position.set(0, -0.02, 0)
  head.add(b)
  body.add(head)
  g.add(body)
  return {
    group: g, w: 1.3, d: 0.85,
    slots: [{ id: 'op', x: 0, z: 0.7, rot: 180, anim: 'standUse', kind: 'laser' }],
    info: { name: 'Desktop diode/CO₂ laser', category: 'Fabrication', priceUSD: 5000, machine: true, desc: 'Beginner-friendly laser for engraving, stickers, leather and thin wood. First machine most members learn.' },
    tick: (s) => {
      if (s.active && !s.fault) {
        head.position.x = Math.sin(s.t * 4) * 0.35
        head.position.z = Math.cos(s.t * 1.3) * 0.2
        ;(b.material as THREE.MeshStandardMaterial).emissiveIntensity = 5 + Math.random() * 3
      } else (b.material as THREE.MeshStandardMaterial).emissiveIntensity = 0
    },
  }
}

export const cncRouter: PropBuilder = () => {
  const g = new THREE.Group()
  const W = 3.4, D = 2.1, H = 0.82
  // frame
  for (const sx of [-1, 1]) for (const sz of [-1, 0, 1]) box(g, 0.1, H, 0.1, mat('#1F4E8C', { rough: 0.5, metal: 0.4 }), sx * (W / 2 - 0.1), 0, sz * (D / 2 - 0.1))
  box(g, W, 0.12, D, mat('#1F4E8C', { rough: 0.5, metal: 0.4 }), 0, H - 0.12, 0)
  box(g, W - 0.15, 0.06, D - 0.15, mat('#B7A27D', { rough: 0.85 }), 0, H, 0) // MDF spoilboard
  box(g, 2.44, 0.018, 1.22, mat(P.plywood, { rough: 0.7 }), -0.2, H + 0.06, 0)
  // rails
  for (const sx of [-1, 1]) box(g, 0.08, 0.1, D, M.alu(), sx * (W / 2 - 0.05), H, 0)
  // gantry
  const gantry = new THREE.Group()
  markDynamic(gantry)
  gantry.position.set(0, H, 0)
  for (const sx of [-1, 1]) box(gantry, 0.06, 0.62, 0.32, mat('#1F4E8C', { rough: 0.45, metal: 0.4 }), sx * (W / 2 - 0.05), 0.1, 0, 0.02)
  box(gantry, W - 0.05, 0.16, 0.14, M.alu(), 0, 0.6, 0)
  const car = new THREE.Group()
  car.position.set(0, 0.6, 0.11)
  box(car, 0.24, 0.3, 0.1, mat('#1F4E8C', { rough: 0.45, metal: 0.4 }), 0, -0.1, 0)
  const spindle = new THREE.Group()
  spindle.position.set(0, -0.14, 0.09)
  cyl(spindle, 0.055, 0.055, 0.26, mat('#E4E4E2', { metal: 0.5, rough: 0.3 }), 0, -0.2, 0, 16)
  cyl(spindle, 0.1, 0.12, 0.08, mat('#222', { opacity: 0.7 }), 0, -0.36, 0, 16) // dust shoe
  cyl(spindle, 0.006, 0.006, 0.08, M.steel(), 0, -0.42, 0, 6)
  car.add(spindle)
  gantry.add(car)
  g.add(gantry)
  // control cabinet + pendant
  box(g, 0.5, 1.4, 0.4, mat('#E6E7E3', { rough: 0.45 }), W / 2 + 0.35, 0, -0.5, 0.02)
  screen(g, 0.3, 0.2, 'dash', 6, W / 2 + 0.35, 1.15, -0.29, 0, 1.1)
  // dust hose
  const hose = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.04, 8, 24, Math.PI), mat('#2a2d33', { rough: 0.8 }))
  hose.position.set(W / 2 - 0.3, H + 1.2, -0.6)
  hose.rotation.y = Math.PI / 2
  g.add(hose)
  const st = led(g, W / 2 + 0.35, 1.36, -0.29)
  return {
    group: g, w: W + 0.8, d: D,
    slots: [{ id: 'op', x: 1.0, z: 1.35, rot: 180, anim: 'standUse', kind: 'cnc' }],
    info: { name: '4×8 ft CNC router', category: 'Fabrication', priceUSD: 14000, machine: true, desc: 'Full-sheet plywood and aluminium. Furniture, drone frames, agro-processing jigs, signage.' },
    tick: (s) => {
      if (s.active && !s.fault) {
        gantry.position.z = Math.sin(s.t * 0.6) * 0.5
        car.position.x = Math.sin(s.t * 1.4) * 1.1 - 0.2
        spindle.rotation.y += 1.4
        setLed(st, '#F2C230')
      } else setLed(st, s.fault ? '#ff3b3b' : '#3FE0B0', !s.fault || Math.floor(s.t * 4) % 2 === 0)
    },
  }
}

export const desktopCNC: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 0.95, 0.7, 0.85, M.charcoal(), 0, 0, 0, 0.02) // cart
  const body = new THREE.Group()
  body.position.set(0, 0.7, 0)
  box(body, 0.9, 0.06, 0.8, M.black(), 0, 0, 0)
  box(body, 0.9, 0.06, 0.8, M.black(), 0, 0.72, 0)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(body, 0.05, 0.72, 0.05, mat('#F07F2D', { rough: 0.4 }), sx * 0.42, 0.03, sz * 0.37)
  const pan = glassMat('#ffd8b0', 0.28)
  box(body, 0.84, 0.66, 0.01, pan, 0, 0.06, 0.39).renderOrder = 3
  box(body, 0.01, 0.66, 0.74, pan, 0.44, 0.06, 0).renderOrder = 3
  box(body, 0.01, 0.66, 0.74, pan, -0.44, 0.06, 0).renderOrder = 3
  box(body, 0.6, 0.02, 0.5, M.alu(), 0, 0.12, 0)
  box(body, 0.2, 0.02, 0.14, mat('#C9A227', { metal: 0.6, rough: 0.35 }), 0, 0.14, 0) // copper PCB blank
  const head = new THREE.Group()
  markDynamic(head)
  head.position.set(0, 0.5, 0)
  box(head, 0.1, 0.14, 0.1, M.alu(), 0, 0, 0)
  cyl(head, 0.004, 0.004, 0.08, M.steel(), 0, -0.08, 0, 6)
  body.add(head)
  const lamp = box(body, 0.6, 0.01, 0.03, new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#fff', emissiveIntensity: 1 }), 0, 0.7, -0.3)
  markDynamic(lamp)
  g.add(body)
  return {
    group: g, w: 0.95, d: 0.85,
    slots: [{ id: 'op', x: 0, z: 0.75, rot: 180, anim: 'standUse', kind: 'desktopCnc' }],
    info: { name: 'Desktop CNC / PCB mill', category: 'Fabrication', priceUSD: 6500, machine: true, desc: 'Mills two-layer PCBs in under an hour, plus aluminium brackets and small moulds.' },
    tick: (s) => {
      if (s.active && !s.fault) {
        head.position.x = Math.sin(s.t * 2.7) * 0.2
        head.position.z = Math.cos(s.t * 1.9) * 0.15
        head.position.y = 0.38 + Math.abs(Math.sin(s.t * 6)) * 0.02
      }
    },
  }
}

export const pcbBench: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 1.8, 0.04, 0.75, M.birch(), 0, 0.86, 0, 0.01)
  for (const sx of [-0.85, 0.85]) box(g, 0.05, 0.86, 0.7, M.dsteel(), sx, 0, 0)
  // reflow oven
  box(g, 0.45, 0.28, 0.4, M.charcoal(), -0.55, 0.9, -0.08, 0.02)
  const win = box(g, 0.3, 0.12, 0.01, new THREE.MeshStandardMaterial({ color: '#331100', emissive: '#ff7a1a', emissiveIntensity: 0 }), -0.6, 0.96, 0.125)
  markDynamic(win)
  // pick and place
  const pnp = new THREE.Group()
  pnp.position.set(0.2, 0.9, -0.05)
  box(pnp, 0.6, 0.04, 0.45, M.alu(), 0, 0, 0)
  for (const sx of [-1, 1]) box(pnp, 0.03, 0.3, 0.03, M.alu(), sx * 0.28, 0.04, -0.2)
  box(pnp, 0.6, 0.04, 0.04, M.alu(), 0, 0.32, -0.2)
  const ph = new THREE.Group()
  markDynamic(ph)
  ph.position.set(0, 0.28, -0.12)
  box(ph, 0.06, 0.08, 0.06, M.black(), 0, 0, 0)
  pnp.add(ph)
  box(pnp, 0.18, 0.006, 0.12, mat('#126B3F', { rough: 0.4 }), 0, 0.04, 0.05)
  g.add(pnp)
  // microscope
  cyl(g, 0.08, 0.1, 0.03, M.black(), 0.72, 0.9, 0.1, 14)
  cyl(g, 0.02, 0.02, 0.35, M.black(), 0.72, 0.93, 0.0, 8)
  box(g, 0.08, 0.12, 0.16, M.charcoal(), 0.72, 1.18, 0.05, 0.02)
  chair(g, 0.3, 0.6, 180, 'lab')
  return {
    group: g, w: 1.8, d: 0.75,
    slots: [{ id: 'op', x: 0.2, z: 0.62, rot: 180, anim: 'standUse', kind: 'pcb' }],
    info: { name: 'SMT line: pick-and-place + reflow', category: 'Fabrication', priceUSD: 4500, machine: true, desc: 'Small-batch PCB assembly so teams can make their first 50 units in-house before going to a contract manufacturer.' },
    tick: (s) => {
      ;(win.material as THREE.MeshStandardMaterial).emissiveIntensity = s.active ? 1.6 + Math.sin(s.t * 2) * 0.4 : 0
      if (s.active) { ph.position.x = Math.sin(s.t * 5) * 0.2; ph.position.z = -0.12 + Math.cos(s.t * 3) * 0.1 }
    },
  }
}

export const workbench: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 2.4, 0.09, 0.9, mat('#B88A5A', { rough: 0.6 }), 0, 0.84, 0, 0.01)
  for (const sx of [-1.1, 1.1]) for (const sz of [-0.38, 0.38]) box(g, 0.09, 0.84, 0.09, mat('#9C7148', { rough: 0.6 }), sx, 0, sz)
  box(g, 2.2, 0.03, 0.75, mat('#9C7148'), 0, 0.2, 0)
  // vise
  box(g, 0.2, 0.12, 0.25, mat('#1F4E8C', { metal: 0.5, rough: 0.4 }), 0.9, 0.93, 0.35, 0.01)
  clutter(g, -0.3, 0.93, 0, 17, 1.2)
  return {
    group: g, w: 2.4, d: 0.9,
    slots: [{ id: 'a', x: -0.5, z: 0.75, rot: 180, anim: 'standUse', kind: 'workbench' }, { id: 'b', x: 0.6, z: 0.75, rot: 180, anim: 'standUse', kind: 'workbench' }],
    info: { name: 'Assembly workbench', category: 'Fabrication', priceUSD: 900, desc: 'Hand tools, vise, crimpers, heat gun. Where prototypes come together.' },
  }
}

export const pegboard: PropBuilder = () => {
  const g = new THREE.Group()
  const t = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#E9E4D8'; c.fillRect(0, 0, w, h)
    c.fillStyle = '#b9b2a2'
    for (let y = 8; y < h; y += 16) for (let x = 8; x < w; x += 16) { c.beginPath(); c.arc(x, y, 2.4, 0, 7); c.fill() }
    c.strokeStyle = '#1C1F24'; c.lineWidth = 3
    const r = rng(2)
    for (let i = 0; i < 12; i++) { const x = 30 + i * 38, y = 40 + r() * 40; c.strokeRect(x, y, 14, 70 + r() * 60) }
  }, false)
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8 }))
  m.position.set(0, 1.6, 0.02)
  g.add(m)
  const tc = [P.clay, '#1F4E8C', P.yellow, P.charcoal]
  for (let i = 0; i < 9; i++) box(g, 0.05, 0.22 + (i % 3) * 0.06, 0.04, mat(tc[i % 4], { rough: 0.4 }), -1.0 + i * 0.25, 1.3, 0.05)
  return { group: g, w: 2.4, d: 0.1, noBlock: true }
}

export const materialRack: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 2.0, 0.08, 0.55, M.dsteel(), 0, 0, 0)
  for (const x of [-0.95, 0, 0.95]) box(g, 0.05, 1.6, 0.05, M.dsteel(), x, 0, -0.22)
  const cols = [P.plywood, P.plywood, '#E8546B', '#5BA4CF', '#F2F2F2', P.birch, '#1C1F24', P.plywood]
  for (let i = 0; i < 8; i++) {
    const s = box(g, 1.9, 1.2, 0.012, mat(cols[i], { rough: i > 1 && i < 6 ? 0.2 : 0.75, opacity: i === 4 ? 0.7 : 1 }), 0, 0.08, -0.15 + i * 0.045)
    s.rotation.x = -0.12
  }
  return { group: g, w: 2.0, d: 0.55 }
}

export const bandsaw: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 0.55, 0.55, 0.5, M.charcoal(), 0, 0, 0, 0.02)
  box(g, 0.5, 0.04, 0.5, M.steel(), 0, 0.95, 0.05)
  box(g, 0.12, 0.4, 0.4, M.charcoal(), 0, 0.55, -0.1)
  box(g, 0.5, 0.75, 0.16, mat('#2E6E4F', { rough: 0.45 }), -0.05, 0.99, -0.12, 0.05)
  box(g, 0.5, 0.42, 0.16, mat('#2E6E4F', { rough: 0.45 }), -0.05, 0.53, -0.12, 0.05)
  return {
    group: g, w: 0.6, d: 0.6,
    slots: [{ id: 'op', x: 0, z: 0.6, rot: 180, anim: 'standUse', kind: 'bandsaw' }],
    info: { name: 'Bandsaw', category: 'Fabrication', priceUSD: 1400, machine: true, desc: 'Wood, plastics and soft metals. Induction required.' },
  }
}

export const drillPress: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 0.45, 0.06, 0.55, M.charcoal(), 0, 0, 0)
  cyl(g, 0.04, 0.04, 1.6, M.steel(), 0, 0.06, -0.15, 10)
  box(g, 0.3, 0.03, 0.3, M.charcoal(), 0, 0.85, 0.05)
  box(g, 0.24, 0.3, 0.5, mat('#C8643B', { rough: 0.45 }), 0, 1.35, 0.02, 0.04)
  cyl(g, 0.03, 0.03, 0.15, M.steel(), 0, 1.2, 0.15, 8)
  return {
    group: g, w: 0.5, d: 0.6,
    slots: [{ id: 'op', x: 0, z: 0.6, rot: 180, anim: 'standUse', kind: 'drill' }],
    info: { name: 'Drill press', category: 'Fabrication', priceUSD: 700, machine: true },
  }
}

export const assemblyTable: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 2.0, 0.05, 1.0, mat('#E9E4D8', { rough: 0.5 }), 0, 0.88, 0, 0.01)
  for (const sx of [-0.95, 0.95]) for (const sz of [-0.45, 0.45]) box(g, 0.05, 0.88, 0.05, M.dsteel(), sx, 0, sz)
  clutter(g, 0, 0.93, 0, 41, 1.4)
  // a drone frame in progress
  box(g, 0.5, 0.02, 0.06, mat('#1C1F24'), 0.3, 0.93, -0.15).rotation.y = 0.8
  box(g, 0.5, 0.02, 0.06, mat('#1C1F24'), 0.3, 0.93, -0.15).rotation.y = -0.8
  chair(g, -0.5, 0.75, 180, 'stool')
  chair(g, 0.5, -0.75, 0, 'stool')
  return {
    group: g, w: 2.0, d: 1.0,
    slots: [
      { id: 'a', x: -0.5, z: 0.75, rot: 180, anim: 'sitSolder', kind: 'assembly', y: 0.74 },
      { id: 'b', x: 0.5, z: -0.75, rot: 0, anim: 'sitSolder', kind: 'assembly', y: 0.74 },
    ],
  }
}

export const dustCollector: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 0.7, 0.1, 0.7, M.charcoal(), 0, 0, 0)
  cyl(g, 0.3, 0.3, 0.6, mat('#1F4E8C', { rough: 0.45 }), 0, 0.1, 0, 18)
  cyl(g, 0.28, 0.28, 0.9, mat('#E4E4E2', { rough: 0.95 }), 0, 0.7, 0, 18)
  return { group: g, w: 0.7, d: 0.7 }
}

export const safetyStation: PropBuilder = () => {
  const g = new THREE.Group()
  const t = canvasTex(256, 192, (c, w, h) => {
    c.fillStyle = '#0E7A4F'; c.fillRect(0, 0, w, h)
    c.fillStyle = '#fff'; c.font = 'bold 26px sans-serif'; c.fillText('SAFETY FIRST', 20, 40)
    c.font = '18px sans-serif'; c.fillText('Glasses · Ear defenders', 20, 80); c.fillText('First aid · Fire blanket', 20, 110); c.fillText('Ask a host: induction', 20, 140)
  }, false)
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.75), new THREE.MeshStandardMaterial({ map: t }))
  m.position.set(0, 1.6, 0.02)
  g.add(m)
  box(g, 0.35, 0.3, 0.12, mat('#C62828'), 0.7, 1.4, 0.06, 0.02)
  return { group: g, w: 1.0, d: 0.1, noBlock: true }
}

// ── Drone cage ──
export const droneCage: PropBuilder = () => {
  const g = new THREE.Group()
  const W = 6.2, D = 6.4, H = 3.9
  const post = mat('#2B2F36', { rough: 0.5, metal: 0.5 })
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(g, 0.08, H, 0.08, post, (sx * W) / 2, 0, (sz * D) / 2)
  for (const sx of [-1, 1]) box(g, 0.06, 0.06, D, post, (sx * W) / 2, H - 0.06, 0)
  for (const sz of [-1, 1]) box(g, W, 0.06, 0.06, post, 0, H - 0.06, (sz * D) / 2)
  const netTex = canvasTex(128, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h)
    c.strokeStyle = 'rgba(30,30,30,0.9)'; c.lineWidth = 2
    for (let i = 0; i <= w; i += 16) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i, h); c.stroke(); c.beginPath(); c.moveTo(0, i); c.lineTo(w, i); c.stroke() }
  })
  netTex.repeat.set(10, 6)
  const netM = new THREE.MeshStandardMaterial({ map: netTex, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, roughness: 0.9 })
  const walls: [number, number, number, number][] = [[0, D / 2, W, 0], [0, -D / 2, W, 0], [W / 2, 0, D, Math.PI / 2], [-W / 2, 0, D, Math.PI / 2]]
  for (const [x, z, L, ry] of walls) {
    const n = new THREE.Mesh(new THREE.PlaneGeometry(L, H), netM)
    n.position.set(x, H / 2, z)
    n.rotation.y = ry
    n.renderOrder = 4
    markDynamic(n)
    g.add(n)
  }
  // landing pad
  const pad = new THREE.Mesh(new THREE.CircleGeometry(0.75, 32), new THREE.MeshStandardMaterial({
    map: canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#F2C230'; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, 7); c.fill()
      c.fillStyle = '#15171B'; c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 14, 0, 7); c.fill()
      c.fillStyle = '#F2C230'; c.font = 'bold 150px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', w / 2, h / 2 + 8)
    }, false),
  }))
  pad.rotation.x = -Math.PI / 2
  pad.position.y = 0.012
  g.add(pad)
  // the drone
  const drone = new THREE.Group()
  markDynamic(drone)
  box(drone, 0.26, 0.07, 0.26, mat('#E9E9E9', { rough: 0.35 }), 0, 0, 0, 0.03)
  box(drone, 0.12, 0.05, 0.1, M.black(), 0, -0.05, 0.08, 0.01)
  const props: THREE.Mesh[] = []
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + (k * Math.PI) / 2
    const arm = box(drone, 0.34, 0.025, 0.035, M.charcoal(), Math.cos(a) * 0.17, 0.02, Math.sin(a) * 0.17)
    arm.rotation.y = -a
    cyl(drone, 0.03, 0.03, 0.04, M.black(), Math.cos(a) * 0.33, 0.02, Math.sin(a) * 0.33, 10)
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.004, 20), mat('#333', { opacity: 0.45 }))
    p.position.set(Math.cos(a) * 0.33, 0.07, Math.sin(a) * 0.33)
    drone.add(p)
    props.push(p)
  }
  const dl = led(drone, 0, 0.0, 0.135, '#3FE0B0')
  drone.position.set(0, 0.08, 0)
  g.add(drone)
  return {
    group: g, w: W + 0.1, d: D + 0.1, noBlock: true,
    slots: [{ id: 'pilot', x: 1.6, z: 3.9, rot: 180, anim: 'phone', kind: 'dronePilot' }],
    info: { name: 'Drone flight cage', category: 'Drone & robotics', priceUSD: 6000, machine: true, desc: 'Netted 6×6×4 m volume for safe indoor test flights: tuning PID loops, payload drops, autonomy tests.' },
    tick: (s) => {
      if (s.active) {
        const t = s.t
        const up = Math.min(1, s.progress * 6)
        drone.position.set(Math.sin(t * 0.7) * 1.6 * up, 0.08 + up * (1.6 + Math.sin(t * 1.3) * 0.4), Math.cos(t * 0.5) * 1.4 * up)
        drone.rotation.y = t * 0.4
        drone.rotation.z = Math.sin(t * 0.7) * 0.12 * up
        for (const p of props) p.rotation.y += 1.9
        setLed(dl, '#3FE0B0', true)
      } else {
        drone.position.set(0, 0.08, 0)
        drone.rotation.set(0, 0, 0)
        setLed(dl, '#5BA4CF', false)
      }
    },
  }
}

export const droneTable: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 1.8, 0.04, 0.8, mat('#E9E4D8'), 0, 0.86, 0, 0.01)
  for (const sx of [-0.85, 0.85]) box(g, 0.05, 0.86, 0.7, M.dsteel(), sx, 0, 0)
  box(g, 0.5, 0.3, 0.35, mat('#C62828', { rough: 0.5 }), -0.55, 0.9, -0.1, 0.02) // LiPo safe box
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.1), new THREE.MeshStandardMaterial({ map: canvasTex(128, 32, (c, w, h) => { c.fillStyle = '#fff'; c.fillRect(0, 0, w, h); c.fillStyle = '#C62828'; c.font = 'bold 20px sans-serif'; c.fillText('LiPo SAFE', 14, 23) }, false) }))
  lbl.position.set(-0.55, 1.08, 0.08)
  g.add(lbl)
  box(g, 0.3, 0.06, 0.3, mat('#E9E9E9'), 0.3, 0.9, 0, 0.02)
  box(g, 0.25, 0.15, 0.04, M.black(), 0.7, 0.9, 0.1, 0.01)
  return { group: g, w: 1.8, d: 0.8, slots: [{ id: 'prep', x: 0, z: 0.65, rot: 180, anim: 'standUse', kind: 'droneTable' }] }
}

export const fireExt: PropBuilder = () => {
  const g = new THREE.Group()
  cyl(g, 0.08, 0.08, 0.5, mat('#C62828', { rough: 0.35 }), 0, 0.3, 0, 12)
  cyl(g, 0.03, 0.03, 0.08, M.black(), 0, 0.8, 0, 8)
  return { group: g, w: 0.2, d: 0.2, noBlock: true }
}

export { BRAND, sph }
