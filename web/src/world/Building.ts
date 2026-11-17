import * as THREE from 'three'
import { BUILDING, ROOMS, WALLS, type Wall, type FloorKind } from '../data/layout'
import { FloorTex, brandSignTex, canvasTex, posterTex } from '../engine/textures'
import { mat, glassMat, P } from '../engine/materials'
import { box, boxGeo } from '../engine/geom'
import { BRAND } from '../brand'

export type WallMode = 'up' | 'cutaway' | 'down'

interface Piece {
  inst: THREE.InstancedMesh
  idx: number
  cx: number
  cz: number
  len: number
  thick: number
  y0: number
  y1: number
  rotY: number
  cut: number // current visible top
  ext: boolean
  nx: number
  nz: number
  facade?: boolean
}

const CUT_H = 0.75

const floorTexCache = new Map<string, THREE.Texture>()
function floorMat(kind: FloorKind, w: number, d: number) {
  const make = (): THREE.Texture => {
    switch (kind) {
      case 'wood': return FloorTex.wood()
      case 'concrete': return FloorTex.concrete()
      case 'epoxy': return FloorTex.epoxy('#C3CBC6', 11)
      case 'epoxyLab': return FloorTex.epoxy('#D5E4E1', 12)
      case 'tile': return FloorTex.tile()
      case 'carpet': return FloorTex.carpet('#58606B')
      case 'rubber': return FloorTex.rubber()
      case 'shop': return FloorTex.shop()
      case 'kids': return FloorTex.kids()
      case 'terrazzo': return FloorTex.terrazzo()
    }
  }
  let base = floorTexCache.get(kind)
  if (!base) {
    base = make()
    floorTexCache.set(kind, base)
  }
  const t = base.clone()
  t.needsUpdate = true
  const tile = kind === 'kids' ? 4 : kind === 'carpet' ? 1.5 : 2.5
  t.repeat.set(w / tile, d / tile)
  return new THREE.MeshStandardMaterial({
    map: t,
    roughness: kind === 'epoxy' || kind === 'epoxyLab' || kind === 'terrazzo' ? 0.35 : kind === 'wood' ? 0.55 : 0.85,
    metalness: 0,
  })
}

export class Building {
  group = new THREE.Group()
  floors = new THREE.Group()
  roof = new THREE.Group()
  facade = new THREE.Group()
  pieces: Piece[] = []
  mode: WallMode = 'cutaway'
  roofLift = 0
  private dummy = new THREE.Object3D()

  constructor() {
    this.group.name = 'building'
    this.group.add(this.floors, this.roof, this.facade)
    this.buildFloors()
    this.buildWalls()
    this.buildRoof()
    this.buildFacade()
  }

  private buildFloors() {
    // base slab
    const slab = new THREE.Mesh(boxGeo(BUILDING.w + 0.6, 0.3, BUILDING.d + 0.6), mat('#8D8A84', { rough: 0.9 }))
    slab.position.set(BUILDING.w / 2, -0.15, BUILDING.d / 2)
    slab.receiveShadow = true
    this.floors.add(slab)
    for (const r of ROOMS) {
      const { x, z, w, d } = r.rect
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), floorMat(r.floor, w, d))
      m.rotation.x = -Math.PI / 2
      m.position.set(x + w / 2, 0.004 + (r.id === 'labstreet' ? 0 : 0.001), z + d / 2)
      m.receiveShadow = true
      m.userData.room = r.id
      this.floors.add(m)
    }
    // hazard floor tape around big machines + lab street centre line
    const tape = mat(P.yellow, { rough: 0.6 })
    const line = (x0: number, z0: number, x1: number, z1: number, wdt = 0.06) => {
      const len = Math.hypot(x1 - x0, z1 - z0)
      const m = new THREE.Mesh(new THREE.PlaneGeometry(len, wdt), tape)
      m.rotation.x = -Math.PI / 2
      m.rotation.z = -Math.atan2(z1 - z0, x1 - x0)
      m.position.set((x0 + x1) / 2, 0.008, (z0 + z1) / 2)
      m.receiveShadow = true
      this.floors.add(m)
    }
    const rectLine = (x0: number, z0: number, x1: number, z1: number) => {
      line(x0, z0, x1, z0); line(x1, z0, x1, z1); line(x1, z1, x0, z1); line(x0, z1, x0, z0)
    }
    rectLine(18.1, 0.8, 22.5, 4.0) // CNC
    rectLine(11.2, 0.5, 13.6, 2.9) // laser
    rectLine(26.3, 0.3, 32.7, 6.9) // drone net footprint
    for (let x = 0.5; x < 40; x += 1.6) line(x, 10, x + 0.8, 10, 0.08)
    // accent border inside each zone: makes zones legible from above and adds colour
    for (const r of ROOMS) {
      if (['labstreet', 'westhall', 'wc', 'prayer'].includes(r.id)) continue
      const m = mat(r.accent, { rough: 0.6 })
      const { x, z, w, d } = r.rect
      const inset = 0.22, bw = 0.12
      const strip = (cx: number, cz: number, sw: number, sd: number) => {
        const p = new THREE.Mesh(new THREE.PlaneGeometry(sw, sd), m)
        p.rotation.x = -Math.PI / 2
        p.position.set(cx, 0.007, cz)
        p.receiveShadow = true
        this.floors.add(p)
      }
      strip(x + w / 2, z + inset, w - inset * 2, bw)
      strip(x + w / 2, z + d - inset, w - inset * 2, bw)
      strip(x + inset, z + d / 2, bw, d - inset * 2)
      strip(x + w - inset, z + d / 2, bw, d - inset * 2)
    }
  }

  private buildWalls() {
    type Spec = { cx: number; cz: number; len: number; thick: number; y0: number; y1: number; rotY: number; ext: boolean; nx: number; nz: number; facade?: boolean }
    const opaque: Spec[] = []
    const extSpecs: Spec[] = []
    const glass: Spec[] = []
    const frames: Spec[] = []
    const plinth: Spec[] = []
    const band: Spec[] = []
    const cx = BUILDING.w / 2, cz = BUILDING.d / 2

    const piece = (w: Wall, t0: number, t1: number, y0: number, y1: number, thick: number, list: Spec[], offset = 0) => {
      const [ax, az] = w.a, [bx, bz] = w.b
      const L = Math.hypot(bx - ax, bz - az)
      const ux = (bx - ax) / L, uz = (bz - az) / L
      const mid = (t0 + t1) / 2
      // normal (perp), pointing away from building centre for exterior walls
      let nx = -uz, nz = ux
      const px = ax + ux * mid, pz = az + uz * mid
      if ((px - cx) * nx + (pz - cz) * nz < 0) { nx = -nx; nz = -nz }
      const ext = w.kind === 'ext'
      list.push({
        cx: px + nx * offset, cz: pz + nz * offset, len: t1 - t0, thick, y0, y1,
        rotY: -Math.atan2(uz, ux), ext, nx, nz,
      })
    }

    for (const w of WALLS) {
      const ext = w.kind === 'ext'
      const isGlass = w.kind === 'glass'
      const H = ext ? BUILDING.extH : BUILDING.wallH
      const T = ext ? 0.3 : isGlass ? 0.06 : 0.16
      const L = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1])
      const ops = [...(w.openings ?? [])].sort((p, q) => p.at - q.at)
      let cur = 0
      const solid = (t0: number, t1: number, y0 = 0, y1 = H) => {
        if (t1 - t0 < 0.01) return
        if (isGlass) {
          // glass run with mullions
          piece(w, t0, t1, y0 + 0.08, Math.min(y1, 2.9), 0.03, glass)
          piece(w, t0, t1, 0, 0.08, 0.08, frames)
          piece(w, t0, t1, 2.9, 3.0, 0.08, frames)
          if (y1 > 3.0) piece(w, t0, t1, 3.0, y1, T, opaque)
          const n = Math.max(1, Math.round((t1 - t0) / 1.25))
          for (let i = 0; i <= n; i++) {
            const t = t0 + ((t1 - t0) * i) / n
            piece(w, Math.max(t0, t - 0.03), Math.min(t1, t + 0.03), 0, 2.95, 0.08, frames)
          }
        } else {
          piece(w, t0, t1, y0, y1, T, ext ? extSpecs : opaque)
          if (ext) {
            piece(w, t0, t1, y0, Math.min(y1, 0.55), 0.04, plinth, T / 2 + 0.02)
            if (y1 >= H - 0.01) piece(w, t0, t1, H - 0.55, H, 0.04, band, T / 2 + 0.02)
          }
        }
      }
      for (const o of ops) {
        solid(cur, o.at)
        const t0 = o.at, t1 = o.at + o.w
        switch (o.kind) {
          case 'door':
          case 'gate': {
            const head = 2.35
            if (isGlass) { piece(w, t0, t1, 2.9, 3.0, 0.08, frames); piece(w, t0, t1, head, 2.9, 0.03, glass); piece(w, t0, t1, head - 0.05, head, 0.08, frames) }
            else solid(t0, t1, head, H)
            // frame posts
            piece(w, t0 - 0.04, t0 + 0.04, 0, head, T + 0.04, frames)
            piece(w, t1 - 0.04, t1 + 0.04, 0, head, T + 0.04, frames)
            break
          }
          case 'window': {
            const sill = o.sill ?? 0.9, head = o.head ?? 2.6
            solid(t0, t1, 0, sill)
            solid(t0, t1, head, H)
            piece(w, t0, t1, sill, head, 0.03, glass)
            const n = Math.max(1, Math.round((t1 - t0) / 1.5))
            for (let i = 0; i <= n; i++) {
              const t = t0 + ((t1 - t0) * i) / n
              piece(w, Math.max(t0, t - 0.035), Math.min(t1, t + 0.035), sill, head, T * 0.6, frames)
            }
            piece(w, t0, t1, sill - 0.04, sill, T + 0.08, frames)
            piece(w, t0, t1, head, head + 0.05, T * 0.6, frames)
            break
          }
          case 'roller':
            solid(t0, t1, 3.4, H)
            piece(w, t0, t1, 2.4, 3.4, 0.12, frames) // rolled shutter box
            break
          case 'counter':
            solid(t0, t1, 0, o.sill ?? 1.05)
            solid(t0, t1, 2.4, H)
            break
          case 'open':
            if (!isGlass) solid(t0, t1, 2.6, H)
            break
        }
        cur = t1
      }
      solid(cur, L)
    }

    const mk = (specs: Spec[], m: THREE.Material, cast = true) => {
      const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), m, specs.length)
      inst.castShadow = cast
      inst.receiveShadow = true
      inst.frustumCulled = false
      specs.forEach((s, i) => this.pieces.push({ inst, idx: i, ...s, cut: s.y1 }))
      this.group.add(inst)
      return inst
    }
    const caps: Spec[] = [...opaque, ...extSpecs]
    mk(opaque, mat(P.wallWhite, { rough: 0.9 }))
    mk(extSpecs, mat('#EFE8DA', { rough: 0.92 }))
    mk(glass, glassMat('#D4EEF2', 0.16), false)
    mk(frames, mat('#2B2F36', { rough: 0.5, metal: 0.4 }))
    mk(plinth, mat('#2B2F36', { rough: 0.85 }))
    mk(band, mat(BRAND.colors.yellow, { rough: 0.6 }))
    // wall top caps (dark, Sims-like cut edge)
    const capSpecs = caps.map((s) => ({ ...s, thick: s.thick + 0.005 }))
    const capInst = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), mat('#3A3F47', { rough: 0.8 }), capSpecs.length)
    capInst.frustumCulled = false
    capInst.receiveShadow = true
    capSpecs.forEach((s, i) => this.pieces.push({ inst: capInst, idx: i, ...s, cut: s.y1, facade: true } as Piece & { facade: boolean }))
    ;(capInst as any).isCap = true
    this.group.add(capInst)
    this.applyPieces(true)
  }

  private buildRoof() {
    const { w, d, roofY } = BUILDING
    const slab = new THREE.Mesh(boxGeo(w - 0.3, 0.25, d - 0.3), mat('#9C998F', { rough: 0.95 }))
    slab.position.set(w / 2, roofY, d / 2)
    slab.castShadow = true
    slab.receiveShadow = true
    this.roof.add(slab)
    // skylights over the bench hall
    for (let i = 0; i < 3; i++) {
      const sk = new THREE.Mesh(boxGeo(3.2, 0.35, 1.6, 0.05), glassMat('#a8d8e8', 0.55))
      sk.position.set(18.7 + i * 4.8, roofY + 0.3, 15)
      this.roof.add(sk)
    }
    // solar array: tilted panels, facing south (sun path in Lagos is near-overhead, slight south tilt)
    const panelTex = canvasTex(128, 256, (g, cw, ch) => {
      g.fillStyle = '#1b2a4a'; g.fillRect(0, 0, cw, ch)
      g.strokeStyle = '#7f93b8'; g.lineWidth = 1.2
      for (let x = 0; x <= cw; x += cw / 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, ch); g.stroke() }
      for (let y = 0; y <= ch; y += ch / 10) { g.beginPath(); g.moveTo(0, y); g.lineTo(cw, y); g.stroke() }
      g.strokeStyle = '#c8ced6'; g.lineWidth = 4; g.strokeRect(0, 0, cw, ch)
    }, false)
    const pm = new THREE.MeshStandardMaterial({ map: panelTex, roughness: 0.25, metalness: 0.5 })
    const cols = 15, rows = 6
    const inst = new THREE.InstancedMesh(boxGeo(1.13, 0.04, 2.28), pm, cols * rows)
    const leg = new THREE.InstancedMesh(boxGeo(0.05, 0.4, 0.05), mat(P.aluminium, { metal: 0.6, rough: 0.4 }), cols * rows * 2)
    const o = new THREE.Object3D()
    let i = 0, j = 0
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = 4 + c * 1.2 + (c >= 8 ? 6.5 : 0)
      const z = 2.5 + r * 3.6 + (r >= 3 ? 2.2 : 0)
      o.position.set(x, roofY + 0.55, z)
      o.rotation.set(-0.17, 0, 0)
      o.updateMatrix()
      inst.setMatrixAt(i++, o.matrix)
      for (const dz of [-0.9, 0.9]) {
        o.position.set(x, roofY + 0.32, z + dz)
        o.rotation.set(0, 0, 0)
        o.updateMatrix()
        leg.setMatrixAt(j++, o.matrix)
      }
    }
    inst.castShadow = true
    inst.receiveShadow = true
    this.roof.add(inst, leg)
    // water tanks (the classic Lagos rooftop tanks)
    const tankM = mat('#1E5FA8', { rough: 0.55 })
    for (const [x, z] of [[37.5, 2.2], [38.9, 2.2]]) {
      box(this.roof, 0.9, 0.9, 0.9, mat(P.darkSteel, { metal: 0.5, rough: 0.5 }), x, roofY + 0.12, z)
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.3, 20), tankM)
      t.position.set(x, roofY + 1.67, z)
      t.castShadow = true
      this.roof.add(t)
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, 0.12, 16), tankM)
      lid.position.set(x, roofY + 2.38, z)
      this.roof.add(lid)
    }
    // starlink dish
    const dish = box(this.roof, 0.6, 0.04, 0.38, mat('#F4F4F4', { rough: 0.4 }), 38.6, roofY + 0.75, 25.8, 0.02)
    dish.rotation.x = -0.6
    box(this.roof, 0.05, 0.6, 0.05, mat(P.steel), 38.6, roofY + 0.12, 25.9)
    // rooftop AC
    for (let k = 0; k < 4; k++) box(this.roof, 1.0, 0.75, 0.45, mat('#E4E4E0', { rough: 0.5 }), 26 + k * 1.3, roofY + 0.12, 26.6, 0.04)
    this.roof.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true } })
  }

  private buildFacade() {
    const f = this.facade
    const z = BUILDING.d + 0.17
    // brand sign over café
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), new THREE.MeshStandardMaterial({ map: brandSignTex(), roughness: 0.5, emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.0 }))
    sign.material.emissiveMap = sign.material.map
    sign.position.set(22, 3.55, z + 0.1)
    sign.name = 'brandSign'
    f.add(sign)
    box(f, 7.5, 2.0, 0.08, mat('#15171B'), 22, 2.55, z - 0.01)
    // canopy over the café glass and entrance
    const canopy = new THREE.Group()
    box(canopy, 17.6, 0.12, 1.8, mat('#15171B', { rough: 0.6 }), 0, 0, 0)
    for (let i = 0; i < 18; i++) box(canopy, 0.48, 0.03, 1.81, mat(i % 2 ? BRAND.colors.yellow : '#15171B', { rough: 0.6 }), -8.5 + i * 1.0, 0.12, 0)
    canopy.position.set(22.2, 3.18, z + 0.9)
    f.add(canopy)
    for (const x of [13.8, 30.6]) box(f, 0.06, 0.06, 1.8, mat(P.steel, { metal: 0.6 }), x, 3.1, z + 0.9)
    // projecting blade sign
    const blade = new THREE.Mesh(boxGeo(0.12, 1.6, 0.9), new THREE.MeshStandardMaterial({ color: BRAND.colors.green }))
    blade.position.set(12.9, 3.0, z + 0.5)
    f.add(blade)
    const bladeTex = canvasTex(128, 256, (g, w, h) => {
      g.fillStyle = BRAND.colors.green; g.fillRect(0, 0, w, h)
      g.fillStyle = BRAND.colors.yellow; g.font = 'bold 30px sans-serif'; g.textAlign = 'center'
      'LAB'.split('').forEach((ch, i) => g.fillText(ch, w / 2, 70 + i * 52))
    }, false)
    for (const s of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 1.58), new THREE.MeshStandardMaterial({ map: bladeTex }))
      p.position.set(12.9 + s * 0.065, 3.8, z + 0.5)
      p.rotation.y = (s * Math.PI) / 2
      f.add(p)
    }
    // classroom mural
    const mural = new THREE.Mesh(new THREE.PlaneGeometry(9.4, 1.2), new THREE.MeshStandardMaterial({ map: canvasTex(1024, 128, (g, w, h) => {
      const cols = [BRAND.colors.rose, BRAND.colors.sky, BRAND.colors.yellow, BRAND.colors.teal, BRAND.colors.violet]
      for (let i = 0; i < 26; i++) { g.fillStyle = cols[i % cols.length]; g.beginPath(); g.arc(i * 42 + 10, h / 2 + Math.sin(i) * 20, 28, 0, 7); g.fill() }
      g.fillStyle = '#fff'; g.font = 'bold 54px sans-serif'; g.fillText('ROBOTICS SATURDAYS', 220, h / 2 + 18)
    }, false) }))
    mural.position.set(5, 3.4, z + 0.02)
    f.add(mural)
    // parts shop neon-ish sign
    const ps = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 0.7), new THREE.MeshStandardMaterial({ map: canvasTex(512, 96, (g, w, h) => {
      g.fillStyle = '#1a1230'; g.fillRect(0, 0, w, h)
      g.fillStyle = '#c9b8ff'; g.font = 'bold 56px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PARTS · KITS · SENSORS', w / 2, h / 2 + 3)
    }, false), emissive: new THREE.Color('#ffffff'), emissiveIntensity: 0.4 }))
    ;(ps.material as THREE.MeshStandardMaterial).emissiveMap = (ps.material as THREE.MeshStandardMaterial).map
    ps.position.set(35.9, 3.45, z + 0.02)
    f.add(ps)
    // posters inside (visible through glass)
    const posters: [string, string, string, number, number, number, number][] = [
      ['MAKE IN\nNIGERIA', 'Prototype → product', BRAND.colors.green, 16.2, 2.0, 11.08, 0],
      ['NO\nWAHALA', 'Book a bench in 30s', BRAND.colors.clay, 30.85, 2.0, 12.6, -Math.PI / 2],
    ]
    for (const [t, s, bg, x, y, zz, ry] of posters) {
      const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 1.05), new THREE.MeshStandardMaterial({ map: posterTex(t, s, bg) }))
      pm.position.set(x, y, zz)
      pm.rotation.y = ry
      this.group.add(pm)
    }
    f.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true } })
  }

  setMode(m: WallMode) {
    this.mode = m
  }

  private applyPieces(force = false) {
    const touched = new Set<THREE.InstancedMesh>()
    for (const p of this.pieces) {
      const top = Math.min(p.y1, p.cut)
      const vis = top > p.y0 + 0.01
      const isCap = (p.inst as any).isCap
      const d = this.dummy
      if (isCap) {
        d.position.set(p.cx, (vis ? top : -10) + 0.012, p.cz)
        d.scale.set(p.len, 0.024, p.thick)
      } else {
        d.position.set(p.cx, vis ? (p.y0 + top) / 2 : -10, p.cz)
        d.scale.set(p.len, vis ? top - p.y0 : 0.001, p.thick)
      }
      d.rotation.set(0, p.rotY, 0)
      d.updateMatrix()
      p.inst.setMatrixAt(p.idx, d.matrix)
      touched.add(p.inst)
    }
    for (const i of touched) i.instanceMatrix.needsUpdate = true
    void force
  }

  update(dt: number, camera: THREE.Camera, target: THREE.Vector3) {
    const fwd = new THREE.Vector3().subVectors(target, camera.position).setY(0).normalize()
    let changed = false
    let southFrac = 1
    for (const p of this.pieces) {
      let goal = p.y1
      if (this.mode === 'down') goal = CUT_H
      else if (this.mode === 'cutaway') {
        const dx = p.cx - target.x, dz = p.cz - target.z
        const along = dx * fwd.x + dz * fwd.z
        const facing = p.ext ? -(p.nx * fwd.x + p.nz * fwd.z) : 0
        if (along < -0.8 || (p.ext && facing > 0.25)) goal = CUT_H
      }
      const next = p.cut + (goal - p.cut) * (1 - Math.exp(-dt * 7))
      if (Math.abs(next - p.cut) > 0.0005) {
        p.cut = Math.abs(goal - next) < 0.002 ? goal : next
        changed = true
      }
      if (p.ext && p.nz > 0.9 && !(p.inst as any).isCap) southFrac = Math.min(southFrac, (Math.min(p.y1, p.cut)) / p.y1)
    }
    if (changed) this.applyPieces()
    // façade dressing only when south wall stands
    this.facade.visible = southFrac > 0.6
    // roof lifts away when not in 'up' mode
    const roofGoal = this.mode === 'up' ? 0 : 1
    this.roofLift += (roofGoal - this.roofLift) * (1 - Math.exp(-dt * 3))
    this.roof.position.y = this.roofLift * 14
    this.roof.visible = this.roofLift < 0.97
  }
}
