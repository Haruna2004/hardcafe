import * as THREE from 'three'
import { mat, P } from '../../engine/materials'
import { box, cyl, sph, markDynamic } from '../../engine/geom'
import { canvasTex, rng } from '../../engine/textures'
import { BRAND, DANFO, NAIJA_GREEN } from '../../brand'
import { M, led, screen, setLed, type PropBuilder } from './common'

// ── Power room ──
export const inverterWall: PropBuilder = () => {
  const g = new THREE.Group()
  const leds: THREE.Mesh[] = []
  for (let i = 0; i < 3; i++) {
    const x = -0.9 + i * 0.9
    box(g, 0.55, 0.85, 0.22, mat('#F4F4F2', { rough: 0.35 }), x, 0.9, 0.11, 0.03)
    box(g, 0.55, 0.12, 0.23, mat(BRAND.colors.green, { rough: 0.4 }), x, 1.63, 0.11, 0.02)
    screen(g, 0.16, 0.1, 'dash', 7 + i, x, 1.35, 0.225, 0, 1.0)
    leds.push(led(g, x + 0.2, 1.2, 0.225, '#3FE0B0'))
    cyl(g, 0.025, 0.025, 0.9, M.charcoal(), x - 0.15, 0, 0.05, 8)
  }
  return {
    group: g, w: 2.6, d: 0.3,
    slots: [{ id: 'check', x: 0, z: 0.85, rot: 180, anim: 'standType', kind: 'powerCheck' }],
    info: { name: 'Hybrid inverters (3 × 30 kW)', category: 'Power', priceUSD: 15000, machine: true, desc: 'Switch from grid to battery in under 20 ms, so a grid outage never stops a print.' },
    tick: (s) => {
      const grid = (s.data.grid as boolean) ?? true
      leds.forEach((l, i) => setLed(l, grid ? '#3FE0B0' : i === 0 ? '#F2C230' : '#3FE0B0', grid || Math.floor(s.t * 3 + i) % 2 === 0))
    },
  }
}

export const batteryBank: PropBuilder = () => {
  const g = new THREE.Group()
  const bars: THREE.Mesh[] = []
  for (let i = 0; i < 4; i++) {
    const x = -1.05 + i * 0.7
    box(g, 0.6, 1.85, 0.6, mat('#E6E8EA', { rough: 0.4 }), x, 0, 0, 0.03)
    box(g, 0.6, 0.06, 0.61, mat(BRAND.colors.yellow), x, 1.7, 0)
    box(g, 0.08, 0.5, 0.01, M.black(), x + 0.18, 0.8, 0.305)
    const b = box(g, 0.06, 0.48, 0.012, new THREE.MeshStandardMaterial({ color: '#3FE0B0', emissive: '#3FE0B0', emissiveIntensity: 1.2 }), x + 0.18, 0.81, 0.308)
    markDynamic(b)
    bars.push(b)
  }
  return {
    group: g, w: 2.8, d: 0.6,
    info: { name: 'Lithium battery bank (~200 kWh)', category: 'Power', priceUSD: 48000, machine: true, desc: 'LFP cabinets. Covers the evening and most outages; the generator only runs in long blackouts.' },
    tick: (s) => {
      const soc = (s.data.soc as number) ?? 0.8
      for (const b of bars) {
        b.scale.y = Math.max(0.05, soc)
        b.position.y = 0.81 + (0.48 * b.scale.y) / 2 - 0.0
        const m = b.material as THREE.MeshStandardMaterial
        const c = soc > 0.5 ? '#3FE0B0' : soc > 0.25 ? '#F2C230' : '#ff5a3a'
        m.color.set(c); m.emissive.set(c)
      }
    },
  }
}

export const serverRack: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 0.6, 2.0, 0.9, M.black(), 0, 0, 0, 0.02)
  for (let i = 0; i < 8; i++) {
    box(g, 0.52, 0.08, 0.02, M.charcoal(), 0, 0.3 + i * 0.18, 0.455)
    led(g, 0.2, 0.34 + i * 0.18, 0.468, i % 3 ? '#3FE0B0' : '#5BA4CF')
  }
  return { group: g, w: 0.6, d: 0.9, info: { name: 'Network rack', category: 'Power & IT', priceUSD: 6000, desc: 'Fibre + Starlink failover, Wi-Fi 6 mesh, door access, cameras, and the local AI box for the ops agents.' } }
}

export const distBoard: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 1.0, 1.2, 0.18, mat('#D9DDE0', { rough: 0.45 }), 0, 0.8, 0.09, 0.02)
  box(g, 0.9, 0.04, 0.02, M.black(), 0, 1.6, 0.185)
  for (let i = 0; i < 12; i++) box(g, 0.05, 0.12, 0.03, M.black(), -0.35 + (i % 6) * 0.14, 1.2 - Math.floor(i / 6) * 0.3, 0.19)
  const t = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.12), new THREE.MeshStandardMaterial({ map: canvasTex(128, 48, (c, w, h) => { c.fillStyle = '#F2C230'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = 'bold 30px sans-serif'; c.fillText('⚡ 415V', 8, 36) }, false) }))
  t.position.set(0, 1.85, 0.185)
  g.add(t)
  return { group: g, w: 1.0, d: 0.2, noBlock: true }
}

// ── Store ──
export const palletRack: PropBuilder = () => {
  const g = new THREE.Group()
  const W = 3.4, D = 0.9
  for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) box(g, 0.07, 2.6, 0.07, mat('#1F4E8C', { metal: 0.4 }), sx * (W / 2 - 0.04), 0, (sz * (D - 0.07)) / 2)
  for (const y of [0.1, 0.95, 1.8]) {
    box(g, W, 0.08, 0.07, mat('#F07F2D', { metal: 0.3 }), 0, y, D / 2 - 0.04)
    box(g, W, 0.08, 0.07, mat('#F07F2D', { metal: 0.3 }), 0, y, -D / 2 + 0.04)
    const r = rng(Math.round(y * 10))
    for (let i = 0; i < 5; i++) if (r() > 0.2) box(g, 0.55, 0.3 + r() * 0.35, 0.65, mat(r() > 0.5 ? '#C8A274' : '#B48C5E', { rough: 0.9 }), -1.35 + i * 0.68, y + 0.08, 0, 0.01)
  }
  return { group: g, w: W, d: D }
}

export const boxStack: PropBuilder = (o) => {
  const g = new THREE.Group()
  const n = (o.n as number) ?? 3
  const r = rng(n * 7)
  for (let i = 0; i < n; i++) {
    const b = box(g, 0.6, 0.4, 0.5, mat(i % 2 ? '#C8A274' : '#B48C5E', { rough: 0.9 }), (r() - 0.5) * 0.1, i * 0.4, (r() - 0.5) * 0.1, 0.01)
    b.rotation.y = (r() - 0.5) * 0.3
  }
  return { group: g, w: 0.7, d: 0.6 }
}

// ── Exterior ──
export const generator: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 3.2, 0.15, 1.4, M.charcoal(), 0, 0, 0)
  box(g, 3.0, 1.55, 1.25, mat('#2E6E4F', { rough: 0.55, metal: 0.2 }), 0, 0.15, 0, 0.05)
  for (let i = 0; i < 8; i++) box(g, 0.25, 0.9, 0.02, M.charcoal(), -1.2 + i * 0.32, 0.45, 0.63)
  cyl(g, 0.07, 0.07, 0.6, M.dsteel(), 1.2, 1.7, -0.3, 10)
  const smoke = new THREE.Group()
  markDynamic(smoke)
  for (let i = 0; i < 4; i++) sph(smoke, 0.25 + i * 0.08, mat('#8d8d8d', { opacity: 0.35 }), 0, i * 0.35, 0, 10, 8)
  smoke.position.set(1.2, 2.4, -0.3)
  smoke.visible = false
  g.add(smoke)
  const lbl = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.25), new THREE.MeshStandardMaterial({ map: canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#F4F1EA'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = 'bold 30px sans-serif'; c.fillText('100 kVA · STANDBY', 12, 44) }, false) }))
  lbl.position.set(0, 1.4, 0.635)
  g.add(lbl)
  return {
    group: g, w: 3.2, d: 1.4,
    info: { name: 'Standby generator (100 kVA)', category: 'Power', priceUSD: 18000, machine: true, desc: 'Last resort only. Solar + battery carry most days; the AI starts the generator when battery drops below 25% during an outage.' },
    tick: (s) => {
      smoke.visible = s.active
      if (s.active) smoke.children.forEach((c, i) => { c.position.y = ((s.t * 0.6 + i * 0.35) % 1.4); (c as THREE.Mesh).scale.setScalar(0.6 + c.position.y) })
      g.position.x = s.active ? Math.sin(s.t * 60) * 0.003 : 0
    },
  }
}

export const acUnit: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 0.85, 0.65, 0.32, mat('#E9E9E6', { rough: 0.4 }), 0, 0.3, 0, 0.03)
  const fan = cyl(g, 0.22, 0.22, 0.02, M.charcoal(), -0.1, 0.62, 0.16, 18)
  fan.rotation.x = Math.PI / 2
  for (const sx of [-0.35, 0.35]) box(g, 0.04, 0.3, 0.3, M.dsteel(), sx, 0, 0)
  return { group: g, w: 0.9, d: 0.4 }
}

export const deliveryVan: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 4.6, 1.5, 1.9, mat('#F4F4F2', { rough: 0.35, metal: 0.2 }), 0, 0.45, 0, 0.12)
  box(g, 1.1, 0.9, 1.88, mat('#F4F4F2', { rough: 0.35, metal: 0.2 }), 2.2, 0.45, 0, 0.12)
  box(g, 0.05, 0.6, 1.6, mat('#1a2633', { rough: 0.1, metal: 0.4 }), 2.78, 1.0, 0)
  for (const sx of [-1.5, 1.6]) for (const sz of [-0.95, 0.95]) {
    const w = cyl(g, 0.34, 0.34, 0.24, M.black(), sx, 0.34, sz, 16)
    w.rotation.x = Math.PI / 2
    w.position.y = 0.34
  }
  const t = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.7), new THREE.MeshStandardMaterial({ map: canvasTex(512, 140, (c, w, h) => { c.fillStyle = '#F4F4F2'; c.fillRect(0, 0, w, h); c.fillStyle = BRAND.colors.green; c.font = 'bold 64px sans-serif'; c.fillText(BRAND.name, 10, 70); c.fillStyle = '#333'; c.font = '28px sans-serif'; c.fillText('parts delivery · Yaba', 14, 118) }, false) }))
  t.position.set(-0.4, 1.3, 0.96)
  g.add(t)
  return { group: g, w: 5.2, d: 2.0 }
}

export const palm: PropBuilder = () => {
  const g = new THREE.Group()
  const trunkM = mat('#8B6B4A', { rough: 0.9 })
  const segs = 8
  for (let i = 0; i < segs; i++) {
    const s = cyl(g, 0.14 - i * 0.008, 0.16 - i * 0.008, 0.62, trunkM, Math.sin(i * 0.2) * 0.15, i * 0.6, 0, 9)
    s.rotation.z = 0.04
  }
  const top = new THREE.Group()
  top.position.set(Math.sin(segs * 0.2) * 0.15, segs * 0.6, 0)
  const frond = mat('#3E8E4E', { rough: 0.8, side: THREE.DoubleSide })
  const frond2 = mat('#2D6B3B', { rough: 0.8, side: THREE.DoubleSide })
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2
    const f = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5, 6, 1), i % 2 ? frond : frond2)
    const pos = f.geometry.attributes.position
    for (let v = 0; v < pos.count; v++) {
      const x = pos.getX(v)
      pos.setY(v, pos.getY(v) * (1 - Math.abs(x) / 1.4))
      pos.setZ(v, -Math.pow((x + 1.2) / 2.4, 2) * 0.9)
    }
    f.geometry.computeVertexNormals()
    f.position.set(Math.cos(a) * 1.1, 0, Math.sin(a) * 1.1)
    f.rotation.set(Math.PI / 2 - 0.35, 0, -a)
    f.rotation.order = 'YXZ'
    f.rotation.y = -a
    f.rotation.x = -0.45
    top.add(f)
  }
  sph(top, 0.22, mat('#6b4f2a', { rough: 0.9 }), 0, 0, 0, 10, 8)
  g.add(top)
  return { group: g, w: 0.5, d: 0.5 }
}

export const streetLamp: PropBuilder = () => {
  const g = new THREE.Group()
  cyl(g, 0.06, 0.08, 5.5, M.dsteel(), 0, 0, 0, 10)
  box(g, 1.2, 0.06, 0.08, M.dsteel(), -0.55, 5.4, 0)
  const head = box(g, 0.5, 0.1, 0.25, M.charcoal(), -1.1, 5.32, 0, 0.03)
  void head
  const bulb = box(g, 0.4, 0.02, 0.18, new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#ffd9a0', emissiveIntensity: 0 }), -1.1, 5.3, 0)
  bulb.userData.nightGlow = 5
  bulb.userData.dayOff = true
  markDynamic(bulb)
  // little solar panel (Lagos streetlights are often solar)
  const sp = box(g, 0.6, 0.03, 0.4, mat('#1b2a4a', { rough: 0.3, metal: 0.5 }), 0, 5.6, 0)
  sp.rotation.x = -0.2
  return { group: g, w: 0.3, d: 0.3 }
}

export const vendorStall: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 1.2, 0.8, 0.6, M.walnut(), 0, 0, 0, 0.02)
  box(g, 1.25, 0.05, 0.65, mat('#ECE6D8'), 0, 0.8, 0)
  cyl(g, 0.02, 0.02, 2.2, M.dsteel(), 0, 0, 0, 6)
  const umb = new THREE.Mesh(new THREE.ConeGeometry(1.25, 0.45, 12, 1, true), mat('#C62828', { rough: 0.7, side: THREE.DoubleSide }))
  umb.position.set(0, 2.25, 0)
  g.add(umb)
  // stripes
  const umb2 = new THREE.Mesh(new THREE.ConeGeometry(1.26, 0.46, 12, 1, true, 0, Math.PI / 3), mat('#F4F1EA', { rough: 0.7, side: THREE.DoubleSide }))
  umb2.position.copy(umb.position)
  g.add(umb2)
  // akara & puff-puff tray + cooler
  cyl(g, 0.25, 0.22, 0.08, mat('#9aa0a6', { metal: 0.6 }), -0.25, 0.85, 0, 16)
  for (let i = 0; i < 7; i++) sph(g, 0.04, mat('#B06A2C', { rough: 0.7 }), -0.25 + Math.cos(i) * 0.12, 0.95, Math.sin(i) * 0.1, 8, 6)
  box(g, 0.35, 0.3, 0.3, mat('#1F6FB2'), 0.3, 0.85, 0, 0.04)
  return { group: g, w: 1.3, d: 0.7, slots: [{ id: 'seller', x: 0, z: -0.65, rot: 0, anim: 'stand', kind: 'vendor' }, { id: 'buy', x: 0.1, z: 0.75, rot: 180, anim: 'talk', kind: 'vendorBuy' }] }
}

export const kekeParked: PropBuilder = () => {
  const g = new THREE.Group()
  buildKeke(g)
  return { group: g, w: 2.6, d: 1.3 }
}

export function buildKeke(g: THREE.Object3D, color = DANFO) {
  // tricycle "keke napep": cabin with canvas roof
  box(g, 2.2, 0.35, 1.2, mat(color, { rough: 0.5 }), 0, 0.35, 0, 0.12)
  box(g, 0.6, 0.8, 1.15, mat(color, { rough: 0.5 }), 0.8, 0.6, 0, 0.12)
  box(g, 0.05, 0.55, 1.0, mat('#1a2633', { rough: 0.1, metal: 0.3 }), 1.1, 1.0, 0)
  box(g, 2.0, 0.08, 1.25, mat('#15171B', { rough: 0.8 }), -0.1, 1.75, 0, 0.04)
  for (const [x, z] of [[-0.9, 0.55], [-0.9, -0.55], [0.6, 0.55], [0.6, -0.55]]) box(g, 0.04, 1.1, 0.04, M.black(), x, 0.68, z)
  box(g, 0.8, 0.12, 1.0, mat('#15171B'), -0.4, 0.7, 0)
  for (const [x, z] of [[1.0, 0], [-0.8, 0.6], [-0.8, -0.6]]) {
    const w = cyl(g, 0.22, 0.22, 0.12, M.black(), x, 0.22, z, 14)
    w.rotation.x = Math.PI / 2
    w.position.y = 0.22
  }
  // green stripe (Lagos keke livery)
  box(g, 2.2, 0.06, 1.22, mat(NAIJA_GREEN), 0, 0.62, 0)
}

export const bikeRack: PropBuilder = () => {
  const g = new THREE.Group()
  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 6, 16, Math.PI), M.steel())
    t.position.set(-0.75 + i * 0.5, 0, 0)
    g.add(t)
  }
  return { group: g, w: 2.0, d: 0.3 }
}

export const planterBox: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 1.4, 0.45, 0.5, mat('#2B2F36', { rough: 0.8 }), 0, 0, 0, 0.02)
  for (let i = 0; i < 6; i++) sph(g, 0.22, mat(i % 2 ? '#3E8E4E' : '#2D6B3B', { rough: 0.8 }), -0.55 + i * 0.22, 0.6, (i % 2) * 0.08 - 0.04, 8, 6).scale.set(1, 1.2, 1)
  return { group: g, w: 1.4, d: 0.5 }
}

export { P, setLed }
