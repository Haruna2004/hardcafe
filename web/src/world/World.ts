import * as THREE from 'three'
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { Building } from './Building'
import { Street } from './Street'
import { buildProp, type PropInstance, type WorldSlot } from './props'
import { PROPS, EXTERIOR_PROPS, ROOMS, WALLS, BUILDING, STREET, POINTS } from '../data/layout'
import { batchStatic } from '../engine/geom'
import { Nav } from '../engine/Nav'

interface Glow { mat: THREE.MeshStandardMaterial; base: number; k: number; dayOff: boolean }

export class World {
  root = new THREE.Group()
  building = new Building()
  street = new Street()
  props: PropInstance[] = []
  byId = new Map<string, PropInstance>()
  slots: WorldSlot[] = []
  nav = new Nav()
  glows: Glow[] = []
  boxes = new Map<string, THREE.Box3>()
  roomLabels: CSS2DObject[] = []
  private staticGroup = new THREE.Group()

  constructor(scene: THREE.Scene) {
    scene.add(this.root)
    this.root.add(this.street.group, this.building.group, this.staticGroup)
    const propsRoot = new THREE.Group()
    propsRoot.name = 'props'
    this.root.add(propsRoot)
    for (const p of [...PROPS, ...EXTERIOR_PROPS]) buildProp(p, propsRoot, this.props)
    for (const p of this.props) {
      this.byId.set(p.id, p)
      this.slots.push(...p.slots)
    }
    propsRoot.updateMatrixWorld(true)
    // pick boxes for top-level props (children get their own)
    for (const p of this.props) {
      const b = new THREE.Box3().setFromObject(p.def.group)
      if (!b.isEmpty()) this.boxes.set(p.id, b)
    }
    // collect glowing materials before batching
    const seen = new Set<THREE.Material>()
    propsRoot.traverse((o) => {
      const m = o as THREE.Mesh
      if (!m.isMesh || o.userData.nightGlow === undefined) return
      const mm = m.material as THREE.MeshStandardMaterial
      if (seen.has(mm)) return
      seen.add(mm)
      this.glows.push({ mat: mm, base: mm.emissiveIntensity, k: o.userData.nightGlow, dayOff: !!o.userData.dayOff })
    })
    this.building.group.traverse((o) => {
      if (o.name === 'brandSign') {
        const mm = (o as THREE.Mesh).material as THREE.MeshStandardMaterial
        this.glows.push({ mat: mm, base: 0, k: 0.9, dayOff: true })
      }
    })
    // merge static geometry → far fewer draw calls
    batchStatic(propsRoot, this.staticGroup)
    // dynamic leftovers: cast shadows when meaningful
    propsRoot.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) {
        const tr = (m.material as THREE.Material).transparent
        m.castShadow = !tr
        m.receiveShadow = true
      }
    })
    this.buildNav()
    this.buildRoomLabels()
  }

  private buildNav() {
    const nav = this.nav
    // exterior: neighbours + yard wall + road discouraged
    nav.fillRect(-16 + 7.75, 2 + 13, 7.75 + 0.2, 13 + 0.2, 0, 0)
    nav.fillRect(-30 + 6.5, 2 + 13, 6.7, 13.2, 0, 0)
    nav.fillRect(48.5 + 7, 3 + 12, 7.2, 12.2, 0, 0)
    nav.fillRect(63 + 8, 2 + 13, 8.2, 13.2, 0, 0)
    nav.fillRect(20, (STREET.roadZ[0] + STREET.roadZ[1]) / 2, 60, (STREET.roadZ[1] - STREET.roadZ[0]) / 2, 0, 6)
    nav.fillRect(20, STREET.farSidewalkZ[1] + 6, 70, 6, 0, 0)
    nav.fillRect(BUILDING.w + 8, (BUILDING.d - 3) / 2, 0.3, (BUILDING.d - 3) / 2 + 0.2, 0, 0)
    nav.fillRect(20, -3.5, 60, 2.5, 0, 0) // behind the building
    // building walls
    const R = 0.22
    for (const w of WALLS) {
      const [ax, az] = w.a, [bx, bz] = w.b
      const L = Math.hypot(bx - ax, bz - az)
      const ux = (bx - ax) / L, uz = (bz - az) / L
      const thick = w.kind === 'ext' ? 0.3 : w.kind === 'glass' ? 0.06 : 0.16
      for (let t = 0; t <= L; t += 0.08) {
        const open = (w.openings ?? []).some((o) => ['door', 'gate', 'open', 'roller'].includes(o.kind) && t > o.at + 0.08 && t < o.at + o.w - 0.08)
        if (open) continue
        nav.fillDisc(ax + ux * t, az + uz * t, thick / 2 + R, 0)
      }
    }
    // props
    for (const p of this.props) {
      if (p.def.noBlock || p.parent) continue
      const pad = (p.def.pad ?? 0.08) + 0.12
      nav.fillRect(p.x, p.z, p.def.w / 2 + pad, p.def.d / 2 + pad, p.rot, 0)
    }
    // carve slot access (people need to reach chairs and machine fronts)
    for (const s of this.slots) nav.fillDisc(s.wx, s.wz, 0.22, 1)
    // make sure doors stay open after carving neighbours
    for (const w of WALLS) for (const o of w.openings ?? []) {
      if (!['door', 'gate', 'open', 'roller'].includes(o.kind)) continue
      const [ax, az] = w.a, [bx, bz] = w.b
      const L = Math.hypot(bx - ax, bz - az)
      const ux = (bx - ax) / L, uz = (bz - az) / L
      const mid = o.at + o.w / 2
      nav.fillRect(ax + ux * mid, az + uz * mid, Math.abs(ux) * (o.w / 2 - 0.15) + Math.abs(uz) * 0.4, Math.abs(uz) * (o.w / 2 - 0.15) + Math.abs(ux) * 0.4, 0, 1)
    }
    // reachability: flood fill from the street; slots nobody can reach are disabled
    const seen = new Uint8Array(nav.nx * nav.nz)
    const [si, sj] = nav.toCell(POINTS.entrance[0], POINTS.entrance[1])
    const stack = [nav.idx(si, sj)]
    seen[stack[0]] = 1
    while (stack.length) {
      const c = stack.pop()!
      const i = c % nav.nx, j = (c / nav.nx) | 0
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj
        if (!nav.walkable(ni, nj)) continue
        const n = nav.idx(ni, nj)
        if (seen[n]) continue
        seen[n] = 1
        stack.push(n)
      }
    }
    let off = 0
    for (const s of this.slots) {
      const [i, j] = nav.toCell(s.wx, s.wz)
      if (!nav.inside(i, j) || !seen[nav.idx(i, j)]) { s.disabled = true; off++ }
    }
    if (off) console.info(`[nav] ${off} unreachable slots disabled:`, this.slots.filter((s) => s.disabled).map((s) => s.uid).join(', '))
  }

  private buildRoomLabels() {
    for (const r of ROOMS) {
      if (['wc', 'labstreet', 'westhall', 'prayer'].includes(r.id)) continue
      const el = document.createElement('div')
      el.className = 'room-label'
      el.innerHTML = `<span class="dot" style="background:${r.accent}"></span>${r.name}`
      const o = new CSS2DObject(el)
      o.position.set(r.rect.x + r.rect.w / 2, 0.2, r.rect.z + r.rect.d / 2)
      o.userData.room = r.id
      this.root.add(o)
      this.roomLabels.push(o)
    }
  }

  slotsOf(kind: string) {
    return this.slots.filter((s) => s.kind === kind)
  }

  freeSlot(kind: string, near?: [number, number], filter?: (s: WorldSlot) => boolean): WorldSlot | null {
    let best: WorldSlot | null = null
    let bd = Infinity
    for (const s of this.slots) {
      if (s.kind !== kind || s.occupant || s.reserved || s.disabled) continue
      if (filter && !filter(s)) continue
      if (!this.nav.walkableAt(s.wx, s.wz)) continue
      const d = near ? (s.wx - near[0]) ** 2 + (s.wz - near[1]) ** 2 + Math.random() * 6 : Math.random()
      if (d < bd) { bd = d; best = s }
    }
    return best
  }

  update(t: number, dt: number, night: number) {
    for (const g of this.glows) g.mat.emissiveIntensity = g.dayOff ? night * g.k : g.base + night * g.k
    for (const p of this.props) {
      if (!p.def.tick) continue
      p.state.t = t
      p.state.light = night
      p.def.tick(p.state, dt)
    }
  }
}
