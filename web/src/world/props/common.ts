import * as THREE from 'three'
import { mat, P, screenMat } from '../../engine/materials'
import { box, cyl, sph, markDynamic } from '../../engine/geom'
import { liveScreen, type ScreenKind } from '../../engine/textures'

export type AnimName =
  | 'idle' | 'walk' | 'sit' | 'sitType' | 'sitSolder' | 'sitTalk' | 'sitEat' | 'sitDrink' | 'stand' | 'standUse' | 'standType'
  | 'pipette' | 'reach' | 'carry' | 'talk' | 'drink' | 'cheer' | 'wave' | 'kneel' | 'sweep' | 'present' | 'clap' | 'phone'
  | 'barista' | 'think' | 'pray' | 'sitFloor'

export interface SlotDef {
  id: string
  x: number
  z: number
  rot: number // degrees, direction the person faces (0 = +z)
  anim: AnimName
  kind: string
  y?: number // seat height for sitting
}

export interface PropState {
  active: boolean // machine running / in use
  progress: number // 0..1 for jobs
  fault: boolean
  t: number
  light: number // 0 day … 1 night
  data: Record<string, unknown>
}

export interface PropDef {
  group: THREE.Group
  w: number
  d: number
  slots?: SlotDef[]
  noBlock?: boolean
  pad?: number
  info?: { name: string; category: string; priceUSD?: number; desc?: string; machine?: boolean }
  tick?: (s: PropState, dt: number) => void
  lights?: THREE.Object3D[] // emissive bits that glow at night
  children?: { type: string; x: number; y: number; z: number; rot?: number; id?: string; opts?: Record<string, unknown> }[]
}

export type PropBuilder = (opts: Record<string, unknown>) => PropDef

export const M = {
  wood: () => mat(P.oak, { rough: 0.55 }),
  walnut: () => mat(P.walnut, { rough: 0.5 }),
  birch: () => mat(P.birch, { rough: 0.6 }),
  ply: () => mat(P.plywood, { rough: 0.7 }),
  steel: () => mat(P.steel, { rough: 0.35, metal: 0.7 }),
  alu: () => mat(P.aluminium, { rough: 0.3, metal: 0.75 }),
  dsteel: () => mat(P.darkSteel, { rough: 0.45, metal: 0.6 }),
  black: () => mat(P.ink, { rough: 0.5 }),
  charcoal: () => mat(P.charcoal, { rough: 0.6 }),
  white: () => mat(P.white, { rough: 0.5 }),
  labWhite: () => mat(P.labWhite, { rough: 0.35 }),
  yellow: () => mat(P.yellow, { rough: 0.5 }),
  green: () => mat(P.green, { rough: 0.55 }),
  esd: () => mat(P.esdBlue, { rough: 0.85 }),
  rubber: () => mat('#26282C', { rough: 0.9 }),
  plastic: (c: string) => mat(c, { rough: 0.45 }),
  fabric: (c: string) => mat(c, { rough: 0.95 }),
}

export function screen(parent: THREE.Object3D, w: number, h: number, kind: ScreenKind, variant: number, x: number, y: number, z: number, rotY = 0, intensity = 1.2) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), screenMat(liveScreen(kind, variant), intensity))
  m.position.set(x, y, z)
  m.rotation.y = rotY
  parent.add(m)
  return m
}

export function monitor(parent: THREE.Object3D, x: number, y: number, z: number, kind: ScreenKind, variant: number, w = 0.6, h = 0.36, rotY = 0) {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  g.rotation.y = rotY
  box(g, 0.18, 0.015, 0.14, M.charcoal(), 0, 0, 0)
  box(g, 0.035, h * 0.55, 0.03, M.charcoal(), 0, 0.015, -0.03)
  box(g, w, h, 0.035, M.black(), 0, h * 0.42, -0.02, 0.008)
  screen(g, w - 0.03, h - 0.03, kind, variant, 0, h * 0.42 + h / 2, 0.0, 0)
  parent.add(g)
  return g
}

export function laptop(parent: THREE.Object3D, x: number, y: number, z: number, rotY = 0, kind: ScreenKind = 'code', variant = 0) {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  g.rotation.y = rotY
  box(g, 0.34, 0.018, 0.24, M.alu(), 0, 0, 0, 0.006)
  const lid = new THREE.Group()
  lid.position.set(0, 0.018, -0.115)
  lid.rotation.x = -0.28
  box(lid, 0.34, 0.22, 0.012, M.alu(), 0, 0, 0, 0.005)
  screen(lid, 0.31, 0.19, kind, variant, 0, 0.11, 0.008, 0, 1.0)
  g.add(lid)
  parent.add(g)
  return g
}

export type ChairKind = 'office' | 'cafe' | 'stool' | 'kid' | 'lab' | 'lounge'

export function chair(parent: THREE.Object3D, x: number, z: number, rotDeg: number, kind: ChairKind = 'office', color = P.charcoal) {
  const g = new THREE.Group()
  g.position.set(x, 0, z)
  g.rotation.y = (rotDeg * Math.PI) / 180
  const seatC = mat(color, { rough: 0.85 })
  switch (kind) {
    case 'office': {
      cyl(g, 0.03, 0.03, 0.38, M.dsteel(), 0, 0.06, 0, 8)
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2
        const leg = box(g, 0.05, 0.03, 0.3, M.black(), Math.sin(a) * 0.13, 0.04, Math.cos(a) * 0.13)
        leg.rotation.y = a
      }
      box(g, 0.48, 0.07, 0.46, seatC, 0, 0.44, 0, 0.03)
      box(g, 0.44, 0.48, 0.06, seatC, 0, 0.55, -0.24, 0.03)
      break
    }
    case 'lab':
    case 'stool': {
      const h = kind === 'lab' ? 0.62 : 0.72
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
        const leg = cyl(g, 0.016, 0.016, h, kind === 'lab' ? M.dsteel() : M.black(), sx * 0.13, 0, sz * 0.13, 6)
        leg.rotation.set(sz * 0.08, 0, -sx * 0.08)
      }
      cyl(g, 0.19, 0.19, 0.05, kind === 'lab' ? mat('#2E3B4E', { rough: 0.7 }) : M.wood(), 0, h, 0, 18)
      box(g, 0.3, 0.02, 0.02, M.black(), 0, h * 0.35, 0.14)
      break
    }
    case 'kid': {
      cyl(g, 0.15, 0.17, 0.36, mat(color, { rough: 0.5 }), 0, 0, 0, 14)
      break
    }
    case 'lounge': {
      box(g, 0.8, 0.4, 0.75, mat(color, { rough: 0.95 }), 0, 0.05, 0, 0.08)
      box(g, 0.8, 0.45, 0.18, mat(color, { rough: 0.95 }), 0, 0.4, -0.3, 0.08)
      for (const sx of [-0.4, 0.4]) box(g, 0.14, 0.3, 0.75, mat(color, { rough: 0.95 }), sx, 0.35, 0, 0.06)
      break
    }
    case 'cafe':
    default: {
      for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) cyl(g, 0.018, 0.015, 0.45, M.black(), sx * 0.17, 0, sz * 0.17, 6)
      box(g, 0.42, 0.04, 0.42, M.wood(), 0, 0.45, 0, 0.02)
      box(g, 0.4, 0.32, 0.03, M.wood(), 0, 0.5, -0.2, 0.012)
    }
  }
  parent.add(g)
  return g
}

export function plantPot(parent: THREE.Object3D, x: number, z: number, size = 1, y = 0) {
  const g = new THREE.Group()
  g.position.set(x, y, z)
  cyl(g, 0.22 * size, 0.17 * size, 0.42 * size, mat(P.terracotta, { rough: 0.8 }), 0, 0, 0, 14)
  const leafM = mat(P.plantGreen, { rough: 0.8 })
  const leafD = mat(P.plantDark, { rough: 0.8 })
  for (let i = 0; i < 7; i++) {
    const a = i * 2.4
    const l = sph(g, 0.2 * size, i % 2 ? leafM : leafD, Math.cos(a) * 0.14 * size, (0.6 + (i % 3) * 0.22) * size, Math.sin(a) * 0.14 * size, 8, 6)
    l.scale.set(1, 1.5, 0.6)
    l.rotation.y = a
  }
  parent.add(g)
  return g
}

// little glowing status LED that we can toggle
export function led(parent: THREE.Object3D, x: number, y: number, z: number, color = '#3FE0B0') {
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 3 }))
  m.position.set(x, y, z)
  markDynamic(m)
  parent.add(m)
  return m
}

export function setLed(m: THREE.Mesh, color: string, on = true) {
  const mm = m.material as THREE.MeshStandardMaterial
  mm.color.set(color)
  mm.emissive.set(color)
  mm.emissiveIntensity = on ? 3 : 0.2
}

// small box of random bits on a surface for clutter
export function clutter(parent: THREE.Object3D, x: number, y: number, z: number, seed: number, spread = 0.4) {
  const cols = [P.yellow, P.green, P.clay, P.sky, P.white, P.charcoal, P.violet]
  let s = seed
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  for (let i = 0; i < 4; i++) {
    const c = cols[Math.floor(r() * cols.length)]
    box(parent, 0.04 + r() * 0.1, 0.02 + r() * 0.05, 0.04 + r() * 0.08, mat(c, { rough: 0.5 }), x + (r() - 0.5) * spread, y, z + (r() - 0.5) * spread * 0.5)
  }
}
