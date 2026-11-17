import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { ankaraTex, rng } from '../engine/textures'
import type { AnimName } from '../world/props/common'
import { BRAND } from '../brand'

export type Hair = 'fade' | 'afro' | 'braids' | 'locs' | 'bun' | 'gele' | 'hijab' | 'cap' | 'bald' | 'twists' | 'puff'
export type Top = 'tee' | 'shirt' | 'polo' | 'ankara' | 'hoodie' | 'blouse'
export type Bottom = 'trousers' | 'jeans' | 'skirt' | 'shorts' | 'dress'

export interface Look {
  skin: string
  hair: Hair
  hairColor: string
  top: Top
  topColor: string
  bottom: Bottom
  bottomColor: string
  shoes: string
  height: number // scale ~0.92-1.08
  build: number // width ~0.9-1.15
  ankaraSeed: number
  glasses: boolean
  labCoat: boolean
  apron?: string
  beard: boolean
  child?: boolean
}

const SKINS = ['#3F2A1D', '#4E3222', '#5A3825', '#6B4430', '#7A4E36', '#8D5B3E', '#A06A48', '#5F3B28']
const TOPCOLS = ['#F4F1EA', '#1C1F24', '#2E5C8A', '#C8643B', '#0E7A4F', '#7B5CD6', '#E8546B', '#F2C230', '#5BA4CF', '#9AA3AD', '#3FB6A8', '#8B1E2B']
const BOTCOLS = ['#1C1F24', '#2B3A55', '#3A3F47', '#6B5B4B', '#2E4B6E', '#C9B79C', '#4A3B2F']
const HAIRCOLS = ['#120D0B', '#1B120E', '#241812', '#120D0B', '#5a1a24', '#120D0B']

export function randomLook(seed: number, opts: Partial<Look> & { fem?: boolean } = {}): Look {
  const r = rng(seed)
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)]
  const fem = opts.fem ?? r() > 0.5
  const hair: Hair = fem ? pick(['braids', 'bun', 'puff', 'gele', 'hijab', 'twists', 'locs', 'braids', 'afro']) : pick(['fade', 'fade', 'afro', 'locs', 'cap', 'bald', 'twists', 'fade'])
  const top: Top = fem ? pick(['blouse', 'tee', 'ankara', 'shirt', 'ankara', 'hoodie']) : pick(['tee', 'shirt', 'polo', 'ankara', 'hoodie', 'tee'])
  const bottom: Bottom = fem ? pick(['jeans', 'skirt', 'trousers', 'dress', 'jeans']) : pick(['trousers', 'jeans', 'jeans', 'trousers', 'shorts'])
  return {
    skin: pick(SKINS),
    hair,
    hairColor: hair === 'braids' && r() > 0.7 ? pick(['#5a1a24', '#7a4a20']) : pick(HAIRCOLS),
    top,
    topColor: pick(TOPCOLS),
    bottom,
    bottomColor: pick(BOTCOLS),
    shoes: pick(['#F4F4F2', '#1C1F24', '#6B4430', '#F4F4F2', '#C62828']),
    height: fem ? 0.93 + r() * 0.08 : 0.97 + r() * 0.09,
    build: 0.92 + r() * 0.2,
    ankaraSeed: Math.floor(r() * 12),
    glasses: r() > 0.75,
    labCoat: false,
    beard: !fem && r() > 0.6,
    ...opts,
  }
}

// ── Skeleton definition (bind pose: standing, facing +z, origin at feet) ──
const BONES = [
  ['root', -1, 0, 0, 0],
  ['hips', 0, 0, 0.95, 0],
  ['spine', 1, 0, 0.17, 0],
  ['chest', 2, 0, 0.2, 0],
  ['neck', 3, 0, 0.18, 0],
  ['head', 4, 0, 0.08, 0],
  ['eyes', 5, 0, 0.1, 0.12],
  ['uArmL', 3, 0.2, 0.11, 0],
  ['lArmL', 7, 0, -0.27, 0],
  ['handL', 8, 0, -0.25, 0],
  ['uArmR', 3, -0.2, 0.11, 0],
  ['lArmR', 10, 0, -0.27, 0],
  ['handR', 11, 0, -0.25, 0],
  ['uLegL', 1, 0.095, -0.03, 0],
  ['lLegL', 13, 0, -0.42, 0],
  ['footL', 14, 0, -0.42, 0],
  ['uLegR', 1, -0.095, -0.03, 0],
  ['lLegR', 16, 0, -0.42, 0],
  ['footR', 17, 0, -0.42, 0],
] as const
type BoneName = (typeof BONES)[number][0]
const BI: Record<string, number> = Object.fromEntries(BONES.map((b, i) => [b[0], i]))

// absolute bind positions
const ABS: THREE.Vector3[] = []
BONES.forEach((b, i) => {
  const p = new THREE.Vector3(b[2], b[3], b[4])
  if (b[1] >= 0) p.add(ABS[b[1]])
  ABS[i] = p
})

const baseMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.78, metalness: 0 })
const ankaraMats = new Map<number, THREE.MeshStandardMaterial>()
function ankaraMat(seed: number) {
  let m = ankaraMats.get(seed)
  if (!m) {
    m = new THREE.MeshStandardMaterial({ map: ankaraTex(seed), roughness: 0.85, vertexColors: true })
    ankaraMats.set(seed, m)
  }
  return m
}

interface Part { geo: THREE.BufferGeometry; bone: number; color: THREE.Color; ankara?: boolean }

function prep(geo: THREE.BufferGeometry, bone: number, color: string | THREE.Color, m: THREE.Matrix4, ankara = false): Part {
  let g = geo.clone()
  g.applyMatrix4(m)
  if (g.index) g = g.toNonIndexed()
  for (const n of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(n)) g.deleteAttribute(n)
  return { geo: g, bone, color: new THREE.Color(color), ankara }
}

const T = (x: number, y: number, z: number, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) =>
  new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz))

const G = {
  sphere: new THREE.SphereGeometry(1, 16, 12),
  sphereLo: new THREE.SphereGeometry(1, 10, 8),
  cap: (r: number, l: number) => new THREE.CapsuleGeometry(r, l, 4, 10),
  rbox: (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 2, r),
  cyl: (rt: number, rb: number, h: number, s = 12, open = false) => new THREE.CylinderGeometry(rt, rb, h, s, 1, open),
  torus: new THREE.TorusGeometry(1, 0.32, 8, 18),
}

function buildParts(L: Look): Part[] {
  const parts: Part[] = []
  const b = L.build
  const skin = L.skin
  const top = L.labCoat ? '#FAFAFA' : L.topColor
  const ank = !L.labCoat && L.top === 'ankara'
  const longSleeve = L.labCoat || L.top === 'shirt' || L.top === 'hoodie'
  const add = (g: THREE.BufferGeometry, bone: string, color: string, m: THREE.Matrix4, ankara = false) => parts.push(prep(g, BI[bone], color, m, ankara))

  // torso
  add(G.rbox(0.33 * b, 0.22, 0.21, 0.08), 'hips', L.bottom === 'dress' ? top : L.bottomColor, T(0, 0.93, 0), L.bottom === 'dress' && ank)
  add(G.rbox(0.31 * b, 0.22, 0.2, 0.08), 'spine', top, T(0, 1.11, 0), ank)
  add(G.rbox(0.37 * b, 0.27, 0.22, 0.09), 'chest', top, T(0, 1.31, 0), ank)
  if (L.top === 'polo' || L.top === 'shirt') add(G.rbox(0.16, 0.05, 0.16, 0.02), 'chest', top, T(0, 1.46, 0.0))
  if (L.top === 'hoodie') add(G.torus, 'chest', top, T(0, 1.45, -0.04, 0.12, 0.12, 0.1, Math.PI / 2.2))
  if (L.apron) add(G.rbox(0.34 * b, 0.6, 0.02, 0.01), 'spine', L.apron, T(0, 1.06, 0.11))
  if (L.labCoat) {
    add(G.cyl(0.2 * b, 0.25 * b, 0.42, 14, true), 'hips', '#FAFAFA', T(0, 0.77, 0))
    add(G.rbox(0.05, 0.3, 0.01, 0.005), 'chest', '#d8dde3', T(0.07, 1.3, 0.115))
  }
  // neck + head
  add(G.cyl(0.05, 0.055, 0.12), 'neck', skin, T(0, 1.5, 0))
  add(G.sphere, 'head', skin, T(0, 1.66, 0.005, 0.125, 0.14, 0.13))
  add(G.sphereLo, 'head', skin, T(0, 1.64, 0.13, 0.022, 0.022, 0.02)) // nose
  for (const s of [-1, 1]) add(G.sphereLo, 'head', skin, T(s * 0.124, 1.655, 0, 0.022, 0.032, 0.02)) // ears
  // eyes (own bone so they can blink)
  for (const s of [-1, 1]) {
    add(G.sphereLo, 'eyes', '#ffffff', T(s * 0.046, 1.685, 0.112, 0.024, 0.02, 0.012))
    add(G.sphereLo, 'eyes', '#120c0a', T(s * 0.046, 1.685, 0.122, 0.014, 0.016, 0.008))
    add(G.rbox(0.045, 0.01, 0.01, 0.004), 'head', L.hairColor, T(s * 0.048, 1.715, 0.122, 1, 1, 1, 0, 0, -s * 0.12)) // brows
  }
  add(G.rbox(0.04, 0.008, 0.01, 0.003), 'head', '#3a1f17', T(0, 1.6, 0.125)) // mouth
  if (L.glasses) {
    for (const s of [-1, 1]) add(G.torus, 'head', '#1C1F24', T(s * 0.046, 1.685, 0.132, 0.026, 0.026, 0.02))
    add(G.rbox(0.03, 0.006, 0.006, 0.002), 'head', '#1C1F24', T(0, 1.688, 0.135))
  }
  if (L.beard) add(G.sphere, 'head', L.hairColor, T(0, 1.585, 0.06, 0.105, 0.07, 0.085))
  // hair styles
  const hc = L.hairColor
  switch (L.hair) {
    case 'fade': add(G.sphere, 'head', hc, T(0, 1.705, -0.005, 0.13, 0.11, 0.135)); break
    case 'afro': add(G.sphere, 'head', hc, T(0, 1.75, -0.02, 0.19, 0.17, 0.18)); break
    case 'puff': add(G.sphere, 'head', hc, T(0, 1.7, -0.01, 0.13, 0.1, 0.135)); add(G.sphere, 'head', hc, T(0, 1.83, -0.06, 0.1, 0.09, 0.1)); break
    case 'bun': add(G.sphere, 'head', hc, T(0, 1.7, -0.01, 0.132, 0.11, 0.137)); add(G.sphere, 'head', hc, T(0, 1.76, -0.13, 0.07, 0.07, 0.07)); break
    case 'twists':
      add(G.sphere, 'head', hc, T(0, 1.71, -0.01, 0.14, 0.12, 0.145))
      for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; add(G.cap(0.018, 0.06), 'head', hc, T(Math.cos(a) * 0.1, 1.79, Math.sin(a) * 0.1 - 0.02, 1, 1, 1, Math.sin(a) * 0.5, 0, -Math.cos(a) * 0.5)) }
      break
    case 'braids':
    case 'locs': {
      add(G.sphere, 'head', hc, T(0, 1.705, -0.01, 0.135, 0.115, 0.14))
      const n = L.hair === 'locs' ? 9 : 12
      const len = L.hair === 'locs' ? 0.22 : 0.3
      for (let i = 0; i < n; i++) {
        const a = Math.PI * 0.15 + (i / (n - 1)) * Math.PI * 0.7
        const x = Math.cos(a) * 0.12, z = -Math.sin(a) * 0.12
        add(G.cap(L.hair === 'locs' ? 0.022 : 0.014, len), 'head', hc, T(x, 1.6 - len / 2 + 0.08, z - 0.01))
      }
      break
    }
    case 'gele': {
      const c = ['#F2C230', '#0E7A4F', '#7B5CD6', '#E8546B', '#5BA4CF'][L.ankaraSeed % 5]
      add(G.sphere, 'head', c, T(0, 1.75, -0.02, 0.16, 0.12, 0.16))
      add(G.torus, 'head', c, T(0, 1.79, -0.02, 0.15, 0.15, 0.12, Math.PI / 2 - 0.3))
      add(G.sphere, 'head', c, T(0.05, 1.86, -0.05, 0.11, 0.08, 0.1, 0, 0, 0.5))
      break
    }
    case 'hijab': {
      const c = ['#0E7A4F', '#2B3A55', '#8B1E2B', '#C9B79C', '#1C1F24', '#7B5CD6'][L.ankaraSeed % 6]
      add(G.sphere, 'head', c, T(0, 1.67, -0.015, 0.15, 0.165, 0.15))
      add(G.cyl(0.13, 0.2, 0.2, 14), 'neck', c, T(0, 1.46, -0.01))
      break
    }
    case 'cap': {
      const c = ['#15171B', BRAND.colors.yellow, '#C62828', '#2E5C8A'][L.ankaraSeed % 4]
      add(G.sphere, 'head', c, T(0, 1.71, -0.005, 0.135, 0.1, 0.14))
      add(G.rbox(0.18, 0.012, 0.11, 0.004), 'head', c, T(0, 1.72, 0.15))
      break
    }
    case 'bald': break
  }
  // arms
  for (const s of [1, -1]) {
    const side = s > 0 ? 'L' : 'R'
    const x = s * 0.2 * (0.95 + (b - 1) * 0.6)
    add(G.cap(0.052, 0.2), `uArm${side}`, longSleeve || L.top === 'tee' || L.top === 'polo' || L.top === 'ankara' || L.top === 'blouse' ? top : skin, T(x, 1.32, 0), ank)
    add(G.cap(0.045, 0.19), `lArm${side}`, longSleeve ? top : skin, T(x, 1.05, 0), ank && longSleeve)
    add(G.sphere, `hand${side}`, skin, T(x, 0.855, 0.005, 0.045, 0.06, 0.035))
  }
  // legs
  const showShin = L.bottom === 'shorts' || L.bottom === 'skirt' || L.bottom === 'dress'
  for (const s of [1, -1]) {
    const side = s > 0 ? 'L' : 'R'
    const x = s * 0.095
    add(G.cap(0.075 * Math.min(1.1, b), 0.28), `uLeg${side}`, L.bottom === 'skirt' ? skin : L.bottom === 'dress' ? skin : L.bottomColor, T(x, 0.71, 0))
    add(G.cap(0.06, 0.3), `lLeg${side}`, showShin ? skin : L.bottomColor, T(x, 0.3, 0))
    add(G.rbox(0.105, 0.08, 0.25, 0.035), `foot${side}`, L.shoes, T(x, 0.045, 0.045))
  }
  if (L.bottom === 'skirt' || L.bottom === 'dress') {
    add(G.cyl(0.17 * b, 0.26 * b, 0.42, 16, true), 'hips', L.bottom === 'dress' ? top : L.bottomColor, T(0, 0.72, 0), L.bottom === 'dress' && ank)
  }
  return parts
}

function buildGeometry(L: Look): { geo: THREE.BufferGeometry; mats: THREE.Material[] } {
  const parts = buildParts(L)
  const make = (ps: Part[]) => {
    const geos = ps.map((p) => {
      const n = p.geo.attributes.position.count
      const col = new Float32Array(n * 3)
      const si = new Uint16Array(n * 4)
      const sw = new Float32Array(n * 4)
      for (let i = 0; i < n; i++) {
        col[i * 3] = p.color.r; col[i * 3 + 1] = p.color.g; col[i * 3 + 2] = p.color.b
        si[i * 4] = p.bone
        sw[i * 4] = 1
      }
      p.geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3))
      p.geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4))
      p.geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4))
      return p.geo
    })
    return mergeGeometries(geos, false)!
  }
  const plain = parts.filter((p) => !p.ankara)
  const ank = parts.filter((p) => p.ankara)
  if (!ank.length) return { geo: make(plain), mats: [baseMat] }
  const geo = mergeGeometries([make(plain), make(ank)], true)!
  return { geo, mats: [baseMat, ankaraMat(L.ankaraSeed)] }
}

// ── Poses ──
type Rot = [number, number, number]
type Pose = Partial<Record<BoneName, Rot>> & { hipY?: number; hipZ?: number }

const sin = Math.sin
const cos = Math.cos

function seated(extra: Pose = {}, seatY = 0.47): Pose {
  return {
    hipY: seatY + 0.11 - 0.95,
    uLegL: [-1.5, 0, 0.04], uLegR: [-1.5, 0, -0.04],
    lLegL: [1.45, 0, 0], lLegR: [1.45, 0, 0],
    footL: [0.05, 0, 0], footR: [0.05, 0, 0],
    ...extra,
  }
}

export function poseFor(anim: AnimName, t: number, phase: number, seatY: number, seed: number): Pose {
  const s1 = sin(t * 1.3 + seed), s2 = sin(t * 2.1 + seed * 2)
  const breathe = sin(t * 1.6 + seed) * 0.02
  switch (anim) {
    case 'walk': {
      const p = phase
      return {
        hipY: Math.abs(cos(p)) * 0.025 - 0.012,
        hips: [0, sin(p) * 0.08, 0],
        spine: [0.05, -sin(p) * 0.05, 0],
        chest: [0.02, -sin(p) * 0.06, 0],
        uLegL: [-sin(p) * 0.55, 0, 0.02], uLegR: [sin(p) * 0.55, 0, -0.02],
        lLegL: [Math.max(0, sin(p + 1.4)) * 0.9 + 0.08, 0, 0], lLegR: [Math.max(0, sin(p + 1.4 + Math.PI)) * 0.9 + 0.08, 0, 0],
        footL: [sin(p) * 0.15, 0, 0], footR: [-sin(p) * 0.15, 0, 0],
        uArmL: [sin(p) * 0.45, 0, 0.08], uArmR: [-sin(p) * 0.45, 0, -0.08],
        lArmL: [-0.3 - Math.max(0, sin(p)) * 0.25, 0, 0], lArmR: [-0.3 - Math.max(0, -sin(p)) * 0.25, 0, 0],
        head: [0.02, sin(p) * 0.04, 0],
      }
    }
    case 'carry':
      return { uArmL: [-0.85, 0, -0.25], uArmR: [-0.85, 0, 0.25], lArmL: [-0.7, 0, 0], lArmR: [-0.7, 0, 0], chest: [-0.05, 0, 0] }
    case 'sit':
      return seated({ uArmL: [-0.35, 0, 0.1], uArmR: [-0.35, 0, -0.1], lArmL: [-0.7, 0, 0], lArmR: [-0.7, 0, 0], chest: [breathe, 0, 0], head: [0.05 + s1 * 0.04, s2 * 0.2, 0] }, seatY)
    case 'sitType':
      return seated({
        spine: [0.08, 0, 0], chest: [0.06 + breathe, 0, 0], head: [0.2 + s1 * 0.03, s2 * 0.08, 0],
        uArmL: [-0.55, 0, 0.12], uArmR: [-0.55, 0, -0.12], lArmL: [-1.0 + sin(t * 9 + seed) * 0.05, 0, -0.15], lArmR: [-1.0 + sin(t * 9.7 + seed) * 0.05, 0, 0.15],
      }, seatY)
    case 'sitSolder':
      return seated({
        spine: [0.2, 0, 0], chest: [0.12 + breathe, 0, 0], head: [0.42, s2 * 0.05, 0],
        uArmL: [-0.65, 0, 0.15], lArmL: [-1.25, 0.1, -0.1],
        uArmR: [-0.8 + sin(t * 2.3 + seed) * 0.06, 0, -0.18], lArmR: [-1.35 + sin(t * 3.1 + seed) * 0.08, 0, 0.1],
      }, seatY)
    case 'sitTalk':
      return seated({
        chest: [breathe, s1 * 0.12, 0], head: [0.0, sin(t * 0.7 + seed) * 0.35, 0],
        uArmL: [-0.4 + s1 * 0.2, 0, 0.15], lArmL: [-0.9 + s2 * 0.3, 0, 0], uArmR: [-0.4 - s2 * 0.2, 0, -0.15], lArmR: [-0.9 + s1 * 0.3, 0, 0],
      }, seatY)
    case 'sitEat':
    case 'sitDrink': {
      const sip = Math.max(0, sin(t * 0.7 + seed)) ** 6
      return seated({
        chest: [breathe, 0, 0], head: [0.05 - sip * 0.15, s2 * 0.15, 0],
        uArmL: [-0.45, 0, 0.12], lArmL: [-0.9, 0, -0.1],
        uArmR: [-0.5 - sip * 0.55, 0, -0.1], lArmR: [-0.9 - sip * 1.2, 0, 0.15],
      }, seatY)
    }
    case 'sitFloor':
    case 'pray':
      return { hipY: -0.7, uLegL: [-1.5, 0.6, 0.6], uLegR: [-1.5, -0.6, -0.6], lLegL: [2.2, 0, 0], lLegR: [2.2, 0, 0], spine: [0.3, 0, 0], head: [0.4, 0, 0], uArmL: [-0.3, 0, 0.1], uArmR: [-0.3, 0, -0.1], lArmL: [-0.8, 0, 0], lArmR: [-0.8, 0, 0] }
    case 'standUse':
      return {
        spine: [0.1, 0, 0], chest: [0.05 + breathe, 0, 0], head: [0.3, s2 * 0.1, 0],
        uArmL: [-0.65 + s1 * 0.08, 0, 0.12], lArmL: [-0.7 + s2 * 0.15, 0, 0], uArmR: [-0.7 - s2 * 0.08, 0, -0.12], lArmR: [-0.6 + s1 * 0.15, 0, 0],
        uLegL: [0, 0, 0.03], uLegR: [0, 0, -0.03],
      }
    case 'standType':
    case 'barista':
      return {
        spine: [0.06, 0, 0], chest: [breathe, anim === 'barista' ? s1 * 0.2 : 0, 0], head: [0.25, s2 * 0.15, 0],
        uArmL: [-0.5 + (anim === 'barista' ? s2 * 0.2 : 0), 0, 0.15], lArmL: [-1.0 + sin(t * 8 + seed) * 0.05, 0, -0.1],
        uArmR: [-0.5 + (anim === 'barista' ? s1 * 0.2 : 0), 0, -0.15], lArmR: [-1.0 + sin(t * 8.5 + seed) * 0.05, 0, 0.1],
      }
    case 'pipette': {
      const press = Math.max(0, sin(t * 2.2 + seed)) ** 8
      return {
        spine: [0.12, 0, 0], chest: [0.05 + breathe, 0, 0], head: [0.38, 0, 0],
        uArmR: [-0.95, 0, -0.2], lArmR: [-1.2 - press * 0.1, 0, 0.3], handR: [press * 0.3, 0, 0],
        uArmL: [-0.7, 0, 0.18], lArmL: [-1.3, 0, -0.25],
      }
    }
    case 'reach': {
      const up = 0.5 + 0.5 * sin(t * 1.5 + seed)
      return { chest: [-0.1, 0, 0], head: [-0.25 * up, 0, 0], uArmR: [-1.6 - up * 0.9, 0, -0.1], lArmR: [-0.3, 0, 0], uArmL: [-0.4, 0, 0.1], lArmL: [-0.6, 0, 0] }
    }
    case 'phone':
      return { head: [0.42, 0, 0], uArmL: [-0.45, 0, 0.32], uArmR: [-0.45, 0, -0.32], lArmL: [-1.2, 0, -0.35], lArmR: [-1.2, 0, 0.35], chest: [breathe, 0, 0] }
    case 'talk':
      return {
        chest: [breathe, s1 * 0.08, 0], head: [-0.03 + sin(t * 3 + seed) * 0.05, s1 * 0.2, 0],
        uArmL: [-0.25 + s2 * 0.25, 0, 0.12], lArmL: [-0.7 + s1 * 0.4, 0, 0], uArmR: [-0.2 - s1 * 0.25, 0, -0.12], lArmR: [-0.6 + s2 * 0.4, 0, 0],
      }
    case 'present':
      return {
        chest: [breathe, sin(t * 0.6 + seed) * 0.35, 0], head: [-0.05, sin(t * 0.6 + seed) * 0.5, 0],
        uArmR: [-0.6, 0, -0.5 - Math.max(0, s1) * 0.6], lArmR: [-0.5, 0, 0], uArmL: [-0.35, 0, 0.12], lArmL: [-0.9 + s2 * 0.3, 0, 0],
      }
    case 'drink': {
      const sip = Math.max(0, sin(t * 0.8 + seed)) ** 6
      return { head: [-sip * 0.15, 0, 0], uArmR: [-0.4 - sip * 0.6, 0, -0.1], lArmR: [-1.0 - sip * 1.2, 0, 0.15], uArmL: [0, 0, 0.06], lArmL: [-0.2, 0, 0] }
    }
    case 'cheer': {
      const j = Math.abs(sin(t * 6 + seed))
      return { hipY: j * 0.06, uArmL: [-2.7, 0, 0.35], uArmR: [-2.7, 0, -0.35], lArmL: [-0.2, 0, 0], lArmR: [-0.2, 0, 0], head: [-0.2, 0, 0] }
    }
    case 'clap': {
      const c = sin(t * 9 + seed)
      return { uArmL: [-0.8, 0, -0.15 + c * 0.12], uArmR: [-0.8, 0, 0.15 - c * 0.12], lArmL: [-0.9, 0, -0.3], lArmR: [-0.9, 0, 0.3], head: [-0.05, 0, 0] }
    }
    case 'wave':
      return { uArmR: [0, 0, -2.5], lArmR: [0, 0, -0.5 + sin(t * 8) * 0.5], uArmL: [0, 0, 0.06], head: [-0.05, 0, 0.1] }
    case 'kneel':
      return { hipY: -0.42, uLegL: [-1.7, 0, 0.12], lLegL: [2.3, 0, 0], uLegR: [-0.5, 0, -0.1], lLegR: [1.5, 0, 0], spine: [0.25, 0, 0], head: [0.3, 0, 0], uArmL: [-0.9, 0, 0.1], lArmL: [-0.5 + s1 * 0.2, 0, 0], uArmR: [-0.9, 0, -0.1], lArmR: [-0.5 + s2 * 0.2, 0, 0] }
    case 'sweep':
      return { spine: [0.15, sin(t * 2) * 0.3, 0], head: [0.2, 0, 0], uArmL: [-0.6, 0, 0.3], lArmL: [-0.8, 0, -0.3], uArmR: [-0.8, 0, -0.1], lArmR: [-0.6, 0, 0.2] }
    case 'think':
      return { head: [0.1, 0.2, 0.05], uArmR: [-0.6, 0, -0.1], lArmR: [-2.2, 0, 0.35], uArmL: [-0.3, 0, 0.35], lArmL: [-1.5, 0, -0.5] }
    case 'stand':
    case 'idle':
    default:
      return {
        hips: [0, 0, sin(t * 0.5 + seed) * 0.025], chest: [breathe, 0, 0], head: [0.03, sin(t * 0.4 + seed) * 0.3, 0],
        uArmL: [0.02, 0, 0.07], uArmR: [0.02, 0, -0.07], lArmL: [-0.15, 0, 0], lArmR: [-0.15, 0, 0],
        uLegL: [0, 0, 0.02], uLegR: [0, 0, -0.02],
      }
  }
}

export type Held = 'none' | 'tablet' | 'cup' | 'box' | 'broom' | 'phone' | 'controller' | 'plate'

const heldMats = {
  tablet: new THREE.MeshStandardMaterial({ color: '#15171B', roughness: 0.4 }),
  screen: new THREE.MeshStandardMaterial({ color: '#000', emissive: '#7fd4ff', emissiveIntensity: 1.2 }),
  cup: new THREE.MeshStandardMaterial({ color: '#F4F1EA', roughness: 0.4 }),
  box: new THREE.MeshStandardMaterial({ color: '#C8A274', roughness: 0.9 }),
  broom: new THREE.MeshStandardMaterial({ color: '#C8643B', roughness: 0.7 }),
  bristle: new THREE.MeshStandardMaterial({ color: '#2a2a2a', roughness: 0.9 }),
  plate: new THREE.MeshStandardMaterial({ color: '#F4F1EA', roughness: 0.4 }),
  rice: new THREE.MeshStandardMaterial({ color: '#D9611E', roughness: 0.8 }),
}

export class Character {
  root = new THREE.Group()
  mesh: THREE.SkinnedMesh
  bones: THREE.Bone[] = []
  look: Look
  anim: AnimName = 'idle'
  seatY = 0.47
  phase = 0
  t = Math.random() * 100
  private cur: Record<string, THREE.Euler> = {}
  private hipY = 0
  private blinkT = 2 + Math.random() * 3
  private heldObj: THREE.Object3D | null = null
  held: Held = 'none'
  upperOverride: AnimName | null = null
  seed: number

  constructor(look: Look, seed = Math.floor(Math.random() * 1000)) {
    this.look = look
    this.seed = seed % 97
    const { geo, mats } = buildGeometry(look)
    const mesh = new THREE.SkinnedMesh(geo, mats.length === 1 ? mats[0] : mats)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.frustumCulled = false
    // bones
    BONES.forEach((b, i) => {
      const bone = new THREE.Bone()
      bone.name = b[0]
      bone.position.set(b[2], b[3], b[4])
      if (b[1] >= 0) this.bones[b[1]].add(bone)
      this.bones[i] = bone
      this.cur[b[0]] = new THREE.Euler()
    })
    mesh.add(this.bones[0])
    mesh.updateMatrixWorld(true)
    mesh.bind(new THREE.Skeleton(this.bones))
    this.mesh = mesh
    const s = look.child ? 0.62 : look.height
    this.root.scale.setScalar(s)
    this.root.add(mesh)
  }

  setLook(look: Look) {
    this.look = look
    const { geo, mats } = buildGeometry(look)
    this.mesh.geometry.dispose()
    this.mesh.geometry = geo
    this.mesh.material = mats.length === 1 ? mats[0] : mats
  }

  hold(h: Held) {
    if (h === this.held) return
    this.held = h
    if (this.heldObj) { this.heldObj.parent?.remove(this.heldObj); this.heldObj = null }
    if (h === 'none') return
    const g = new THREE.Group()
    const hand = this.bones[BI.handR]
    let parent: THREE.Object3D = hand
    switch (h) {
      case 'tablet':
      case 'phone':
      case 'controller': {
        const w = h === 'tablet' ? 0.2 : 0.08, d = h === 'tablet' ? 0.14 : 0.15
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, 0.012, d), heldMats.tablet)
        const sc = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, d * 0.85), heldMats.screen)
        sc.rotation.x = -Math.PI / 2
        sc.position.y = 0.007
        m.add(sc)
        m.position.set(0.08, -0.07, 0.05)
        m.rotation.set(-0.4, 0, 0)
        g.add(m)
        break
      }
      case 'cup': {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.034, 0.1, 10), heldMats.cup)
        m.position.set(0, -0.07, 0.03)
        g.add(m)
        break
      }
      case 'plate': {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.02, 14), heldMats.plate)
        const r = new THREE.Mesh(new THREE.SphereGeometry(0.08, 10, 6), heldMats.rice)
        r.scale.y = 0.35
        r.position.y = 0.02
        m.add(r)
        m.position.set(0.02, -0.08, 0.08)
        g.add(m)
        break
      }
      case 'box': {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.28), heldMats.box)
        m.position.set(0.2, -0.08, 0.14)
        g.add(m)
        break
      }
      case 'broom': {
        const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.3, 6), heldMats.broom)
        stick.position.set(0, -0.35, 0.05)
        stick.rotation.x = 0.35
        const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.06), heldMats.bristle)
        b.position.set(0, -0.62, 0)
        stick.add(b)
        g.add(stick)
        break
      }
    }
    parent.add(g)
    this.heldObj = g
  }

  update(dt: number) {
    this.t += dt
    const lower = poseFor(this.anim, this.t, this.phase, this.seatY, this.seed)
    const upper = this.upperOverride ? poseFor(this.upperOverride, this.t, this.phase, this.seatY, this.seed) : null
    const k = 1 - Math.exp(-dt * 10)
    for (let i = 1; i < BONES.length; i++) {
      const name = BONES[i][0]
      let target: Rot | undefined = lower[name]
      if (upper && (name.startsWith('uArm') || name.startsWith('lArm') || name.startsWith('hand') || name === 'chest')) target = upper[name] ?? target
      const tr = target ?? [0, 0, 0]
      const e = this.cur[name]
      e.x += (tr[0] - e.x) * k
      e.y += (tr[1] - e.y) * k
      e.z += (tr[2] - e.z) * k
      this.bones[i].rotation.copy(e)
    }
    const hy = lower.hipY ?? 0
    this.hipY += (hy - this.hipY) * k
    this.bones[BI.hips].position.y = 0.95 + this.hipY
    // blink
    this.blinkT -= dt
    const eyes = this.bones[BI.eyes]
    if (this.blinkT < 0) {
      eyes.scale.y = 0.1
      if (this.blinkT < -0.12) { this.blinkT = 2.5 + Math.random() * 3.5; eyes.scale.y = 1 }
    }
  }
}

export const HEAD_Y = 1.95
