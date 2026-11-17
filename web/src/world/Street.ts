import * as THREE from 'three'
import { STREET, BUILDING } from '../data/layout'
import { mat, P } from '../engine/materials'
import { box, cyl } from '../engine/geom'
import { asphaltTex, pavingTex, lateriteTex, canvasTex, rng } from '../engine/textures'
import { BRAND } from '../brand'
import { buildKeke } from './props/misc'

export interface Vehicle {
  obj: THREE.Group
  kind: 'danfo' | 'keke' | 'okada' | 'car'
  lane: number // 0 eastbound, 1 westbound
  speed: number
  x: number
  stopAt?: number
  stopTimer: number
  wheels: THREE.Object3D[]
  onStop?: (v: Vehicle) => void
  stoppedHere?: boolean
}

function shopSignTex(text: string, bg: string, fg: string) {
  return canvasTex(512, 96, (c, w, h) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h)
    c.fillStyle = fg; c.font = 'bold 44px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'
    c.fillText(text, w / 2, h / 2 + 3)
  }, false)
}

function facadeTex(base: string, win: string, floors: number, seed: number) {
  return canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h)
    const r = rng(seed)
    const fh = h / floors
    for (let f = 0; f < floors; f++) {
      for (let i = 0; i < 5; i++) {
        const x = 20 + i * 98, y = f * fh + fh * 0.22
        c.fillStyle = win; c.fillRect(x, y, 62, fh * 0.5)
        c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x, y, 62, 6)
        if (r() > 0.6) { c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(x, y + fh * 0.5, 62, 8) }
      }
      c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(0, (f + 1) * fh - 6, w, 6)
    }
  }, false)
}

export class Street {
  group = new THREE.Group()
  vehicles: Vehicle[] = []
  private r = rng(99)

  constructor() {
    this.buildGround()
    this.buildNeighbours()
    for (let i = 0; i < 7; i++) this.spawnVehicle(i)
  }

  private buildGround() {
    const g = this.group
    // big ground
    const lat = lateriteTex()
    lat.repeat.set(30, 30)
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), new THREE.MeshStandardMaterial({ map: lat, roughness: 1 }))
    ground.rotation.x = -Math.PI / 2
    ground.position.set(20, -0.02, 20)
    ground.receiveShadow = true
    g.add(ground)
    // road
    const asp = asphaltTex()
    asp.repeat.set(30, 2)
    const [r0, r1] = STREET.roadZ
    const road = new THREE.Mesh(new THREE.PlaneGeometry(220, r1 - r0), new THREE.MeshStandardMaterial({ map: asp, roughness: 0.9 }))
    road.rotation.x = -Math.PI / 2
    road.position.set(20, 0.0, (r0 + r1) / 2)
    road.receiveShadow = true
    g.add(road)
    // lane dashes
    const dashM = mat('#EDE6CF', { rough: 0.7 })
    for (let x = -90; x < 130; x += 4) {
      const d = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.14), dashM)
      d.rotation.x = -Math.PI / 2
      d.position.set(x, 0.01, (r0 + r1) / 2)
      d.receiveShadow = true
      g.add(d)
    }
    // sidewalks with interlocking paving + curb + drain slabs
    const pav = pavingTex()
    for (const [z0, z1] of [STREET.sidewalkZ, STREET.farSidewalkZ]) {
      const t = pav.clone()
      t.needsUpdate = true
      t.repeat.set(110, (z1 - z0) / 2)
      const sw = new THREE.Mesh(new THREE.BoxGeometry(220, 0.16, z1 - z0), [
        mat('#9C968A'), mat('#9C968A'), new THREE.MeshStandardMaterial({ map: t, roughness: 0.85 }), mat('#9C968A'), mat('#B9B2A3'), mat('#B9B2A3'),
      ])
      sw.position.set(20, 0.08, (z0 + z1) / 2)
      sw.receiveShadow = true
      g.add(sw)
    }
    // drain slabs along the near curb
    for (let x = -60; x < 100; x += 1.2) box(g, 1.15, 0.03, 0.55, mat('#A9A296', { rough: 0.9 }), x, 0.16, STREET.sidewalkZ[1] - 0.35)
    // east side yard + back strip
    const yard = new THREE.Mesh(new THREE.PlaneGeometry(8, BUILDING.d + 3), mat('#A8A49B', { rough: 0.95 }))
    yard.rotation.x = -Math.PI / 2
    yard.position.set(BUILDING.w + 4, 0.01, BUILDING.d / 2 + 1.5)
    yard.receiveShadow = true
    g.add(yard)
    // perimeter fence of the yard (Lagos compound wall + gate)
    const wallM = mat('#E2D7C0', { rough: 0.9 })
    box(g, 0.25, 2.2, BUILDING.d - 3, wallM, BUILDING.w + 8, 0, (BUILDING.d - 3) / 2)
    box(g, 0.25, 2.2, 0.25, wallM, BUILDING.w + 8, 0, BUILDING.d - 0.2)
    const gate = box(g, 0.08, 2.0, 3.6, mat('#1F4E8C', { metal: 0.4, rough: 0.5 }), BUILDING.w + 8, 0, BUILDING.d - 2.1)
    gate.castShadow = true
    // bus stop sign
    cyl(g, 0.04, 0.04, 2.6, M_steel(), 20.6, 0.16, 30.4, 8)
    const bs = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.45), new THREE.MeshStandardMaterial({ map: shopSignTex('BUS STOP', BRAND.colors.yellow, '#111'), side: THREE.DoubleSide }))
    bs.position.set(20.6, 2.6, 30.4)
    g.add(bs)
  }

  private buildNeighbours() {
    const g = this.group
    const bldg = (x: number, z: number, w: number, d: number, h: number, base: string, floors: number, seed: number, faceZ = true) => {
      const tex = facadeTex(base, '#2a3a4a', floors, seed)
      const side = mat(base, { rough: 0.9 })
      const faceM = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 })
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), faceZ ? [side, side, mat('#7d756a'), side, faceM, faceM] : [faceM, faceM, mat('#7d756a'), side, side, side])
      m.position.set(x + w / 2, h / 2, z + d / 2)
      m.castShadow = true
      m.receiveShadow = true
      g.add(m)
      return m
    }
    bldg(-16, 2, 15.5, 26, 7.5, '#E8CFA8', 2, 1)
    bldg(48.5, 3, 14, 24, 9.5, '#CFE0D8', 3, 2)
    bldg(-30, 2, 13, 26, 6.2, '#E6B8A2', 2, 6)
    bldg(63, 2, 16, 26, 7.0, '#E9DFC9', 2, 7)
    // across the road: shops with signs
    const shops: [number, number, string, string, string, string, number][] = [
      [-18, 14, '#E9D7B8', 'MAMA T BUKA', '#C62828', '#fff', 2],
      [-3, 11, '#D8E4EA', 'PHONE REPAIRS', '#1F4E8C', '#fff', 3],
      [9, 12, '#EBDDC3', 'POS · TRANSFER · CASH', '#0E7A4F', '#F2C230', 2],
      [22, 13, '#E8C9C0', 'PHARMACY', '#2FA36B', '#fff', 3],
      [36, 12, '#DAD6EA', 'PRINT & BRANDING', '#7B5CD6', '#fff', 2],
      [49, 14, '#E2E6D2', 'SUPERMARKET', '#F07F2D', '#fff', 2],
      [64, 12, '#E9D7B8', 'GENERATOR REPAIRS', '#15171B', '#F2C230', 2],
    ]
    const zf = STREET.farSidewalkZ[1]
    for (const [x, w, base, sign, sbg, sfg, floors] of shops) {
      const h = 3.4 * floors
      const m = bldg(x, zf, w, 10, h, base, floors, Math.round(x + 40), true)
      void m
      const sp = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.7, 0.9), new THREE.MeshStandardMaterial({ map: shopSignTex(sign, sbg, sfg), roughness: 0.6 }))
      sp.position.set(x + w / 2, 3.1, zf - 0.02)
      sp.rotation.y = Math.PI
      g.add(sp)
      // awning
      box(g, w * 0.8, 0.08, 1.2, mat(sbg, { rough: 0.7 }), x + w / 2, 2.6, zf - 0.6)
    }
    // POS umbrella agent + a few parked things on the far sidewalk
    const umb = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.35, 10, 1, true), mat('#F2C230', { side: THREE.DoubleSide }))
    umb.position.set(12.5, 2.1, STREET.farSidewalkZ[0] + 1.2)
    g.add(umb)
    cyl(g, 0.02, 0.02, 2.0, M_steel(), 12.5, 0.16, STREET.farSidewalkZ[0] + 1.2, 6)
    box(g, 0.8, 0.75, 0.5, mat('#1F4E8C'), 12.5, 0.16, STREET.farSidewalkZ[0] + 1.6)
  }

  private makeVehicle(kind: Vehicle['kind']): { obj: THREE.Group; wheels: THREE.Object3D[] } {
    const g = new THREE.Group()
    const wheels: THREE.Object3D[] = []
    const wheel = (x: number, z: number, r = 0.33, w = 0.22) => {
      const m = cyl(g, r, r, w, mat('#1a1b1d', { rough: 0.8 }), x, 0, z, 14)
      m.rotation.x = Math.PI / 2
      m.position.y = r
      wheels.push(m)
    }
    if (kind === 'danfo') {
      const y = mat(BRAND.colors.yellow, { rough: 0.45 })
      box(g, 4.5, 1.25, 1.85, y, 0, 0.42, 0, 0.18)
      box(g, 4.3, 0.55, 1.75, y, -0.1, 1.62, 0, 0.18)
      box(g, 4.32, 0.42, 1.87, mat('#1d2a36', { rough: 0.1, metal: 0.3 }), -0.05, 1.55, 0, 0.08) // window band
      for (const s of [-1, 1]) {
        box(g, 4.52, 0.09, 0.02, mat('#111'), 0, 1.0, s * 0.935)
        box(g, 4.52, 0.09, 0.02, mat('#111'), 0, 1.2, s * 0.935)
      }
      box(g, 0.05, 0.5, 1.5, mat('#1d2a36', { rough: 0.1, metal: 0.3 }), 2.27, 1.45, 0)
      box(g, 0.1, 0.25, 1.86, mat('#d7d7d0', { metal: 0.5 }), 2.3, 0.45, 0) // bumper
      // roof rack with luggage
      box(g, 2.6, 0.06, 1.5, mat('#333'), -0.3, 2.2, 0)
      box(g, 0.7, 0.35, 0.6, mat('#7B5CD6'), -0.8, 2.26, 0.2, 0.05)
      box(g, 0.6, 0.3, 0.5, mat('#C8643B'), 0.1, 2.26, -0.2, 0.05)
      wheel(1.45, 0.92); wheel(1.45, -0.92); wheel(-1.45, 0.92); wheel(-1.45, -0.92)
    } else if (kind === 'keke') {
      const k = new THREE.Group()
      buildKeke(k)
      g.add(k)
    } else if (kind === 'okada') {
      box(g, 1.6, 0.35, 0.3, mat('#C62828', { rough: 0.4 }), 0, 0.5, 0, 0.08)
      box(g, 0.7, 0.12, 0.32, mat('#15171B'), -0.2, 0.85, 0)
      wheel(0.65, 0, 0.3, 0.1); wheel(-0.65, 0, 0.3, 0.1)
      // rider
      box(g, 0.32, 0.6, 0.38, mat(['#2E5C8A', '#C8643B', '#0E7A4F'][Math.floor(this.r() * 3)], { rough: 0.9 }), -0.15, 0.95, 0, 0.1)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), mat('#F2C230', { rough: 0.3 })) // helmet
      head.position.set(-0.1, 1.72, 0)
      g.add(head)
    } else {
      const c = ['#C9CED4', '#15171B', '#8B1E2B', '#F4F4F2', '#2E5C8A'][Math.floor(this.r() * 5)]
      box(g, 4.2, 0.7, 1.8, mat(c, { rough: 0.3, metal: 0.5 }), 0, 0.3, 0, 0.2)
      box(g, 2.3, 0.6, 1.65, mat('#1d2a36', { rough: 0.1, metal: 0.3 }), -0.2, 0.95, 0, 0.18)
      wheel(1.3, 0.85, 0.32); wheel(1.3, -0.85, 0.32); wheel(-1.3, 0.85, 0.32); wheel(-1.3, -0.85, 0.32)
    }
    g.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true } })
    return { obj: g, wheels }
  }

  spawnVehicle(i: number) {
    const kinds: Vehicle['kind'][] = ['danfo', 'keke', 'car', 'okada', 'danfo', 'car', 'keke']
    const kind = kinds[i % kinds.length]
    const { obj, wheels } = this.makeVehicle(kind)
    const lane = i % 2
    const speed = (kind === 'okada' ? 9 : kind === 'keke' ? 5.5 : kind === 'danfo' ? 7 : 8) * (0.85 + this.r() * 0.3)
    const x = -60 + this.r() * 170
    obj.position.set(x, 0, STREET.laneZ[lane])
    obj.rotation.y = lane === 0 ? 0 : Math.PI
    this.group.add(obj)
    this.vehicles.push({ obj, kind, lane, speed, x, stopTimer: 0, wheels, stopAt: kind === 'danfo' && lane === 0 ? 20.6 : undefined })
  }

  update(dt: number, simSpeed: number) {
    const sp = Math.min(simSpeed, 3)
    for (const v of this.vehicles) {
      if (v.stopTimer > 0) {
        v.stopTimer -= dt * sp
        if (v.stopTimer <= 0) v.stoppedHere = true
        continue
      }
      const dir = v.lane === 0 ? 1 : -1
      // gentle queueing: slow down if a vehicle is close ahead in the same lane
      let ahead = Infinity
      for (const o of this.vehicles) if (o !== v && o.lane === v.lane) {
        const d = (o.x - v.x) * dir
        if (d > 0 && d < ahead) ahead = d
      }
      const k = ahead < 6 ? Math.max(0, (ahead - 4.5) / 1.5) : 1
      const prev = v.x
      v.x += dir * v.speed * k * dt * sp
      if (v.stopAt !== undefined && !v.stoppedHere && (prev - v.stopAt) * (v.x - v.stopAt) <= 0) {
        v.x = v.stopAt
        v.stopTimer = 4
        v.onStop?.(v)
      }
      if (v.x > 130) { v.x = -70; v.stoppedHere = false }
      if (v.x < -70) { v.x = 130; v.stoppedHere = false }
      v.obj.position.x = v.x
      for (const w of v.wheels) w.rotation.y += v.speed * k * dt * sp * 2.5
    }
  }
}

function M_steel() {
  return mat(P.steel, { metal: 0.6, rough: 0.4 })
}
