import * as THREE from 'three'
import { mat, P, glassMat } from '../../engine/materials'
import { box, cyl, sph, markDynamic } from '../../engine/geom'
import { menuTex, canvasTex } from '../../engine/textures'
import { BRAND } from '../../brand'
import { M, chair, plantPot, screen, type PropBuilder, type SlotDef } from './common'

function pendant(parent: THREE.Object3D, x: number, z: number, top = 3.5, drop = 1.1, color = '#15171B') {
  cyl(parent, 0.004, 0.004, drop, M.black(), x, top - drop, z, 4)
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.22, 18, 1, true), mat(color, { rough: 0.5, side: THREE.DoubleSide }))
  shade.position.set(x, top - drop - 0.05, z)
  parent.add(shade)
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), new THREE.MeshStandardMaterial({ color: '#fff4d6', emissive: '#ffcf7a', emissiveIntensity: 1.5 }))
  bulb.position.set(x, top - drop - 0.14, z)
  bulb.userData.nightGlow = 4
  markDynamic(bulb)
  parent.add(bulb)
  return bulb
}

export const cafeBar: PropBuilder = () => {
  const g = new THREE.Group()
  const lights: THREE.Object3D[] = []
  // body with vertical slats
  box(g, 4.0, 0.95, 0.9, M.walnut(), 0, 0, 0, 0.02)
  for (let i = 0; i < 26; i++) box(g, 0.07, 0.86, 0.03, mat('#8A5E3C', { rough: 0.5 }), -1.9 + i * 0.152, 0.04, 0.46)
  box(g, 4.0, 0.08, 0.92, M.black(), 0, -0.0, 0)
  // stone top
  box(g, 4.15, 0.05, 1.05, mat('#EDE8DF', { rough: 0.25 }), 0, 0.95, 0, 0.01)
  // espresso machine
  const em = new THREE.Group()
  em.position.set(-0.9, 1.0, -0.15)
  box(em, 0.72, 0.42, 0.46, mat('#D8DCDF', { rough: 0.2, metal: 0.85 }), 0, 0, 0, 0.04)
  box(em, 0.74, 0.06, 0.48, mat('#1F1F29', { rough: 0.4 }), 0, 0.42, 0, 0.02)
  for (const sx of [-0.18, 0.18]) {
    cyl(em, 0.04, 0.05, 0.1, M.black(), sx, 0.12, 0.26, 10)
    box(em, 0.06, 0.02, 0.18, M.black(), sx, 0.11, 0.33)
    cyl(em, 0.035, 0.03, 0.07, M.white(), sx, 0.0, 0.26, 10)
  }
  box(em, 0.6, 0.02, 0.2, M.steel(), 0, 0.0, 0.25)
  g.add(em)
  // grinder
  cyl(g, 0.08, 0.1, 0.32, M.black(), -0.3, 1.0, -0.2, 12)
  cyl(g, 0.11, 0.06, 0.2, mat('#5a3a22', { rough: 0.3, opacity: 0.85 }), -0.3, 1.32, -0.2, 12)
  // pastry display case
  box(g, 1.0, 0.04, 0.5, M.black(), 0.75, 1.0, 0.15)
  const glass = box(g, 1.0, 0.36, 0.5, glassMat('#e8f6fa', 0.25), 0.75, 1.04, 0.15)
  glass.renderOrder = 2
  const pie = mat('#D99A4E', { rough: 0.6 }), puff = mat('#9B5A2B', { rough: 0.7 })
  for (let i = 0; i < 5; i++) {
    const p = box(g, 0.14, 0.05, 0.1, pie, 0.4 + i * 0.17, 1.06, 0.08, 0.03)
    p.rotation.y = 0.1 * i
    sph(g, 0.035, puff, 0.42 + i * 0.17, 1.12, 0.26, 8, 6)
    sph(g, 0.035, puff, 0.47 + i * 0.17, 1.12, 0.29, 8, 6)
  }
  // cups + POS tablet
  for (let i = 0; i < 4; i++) cyl(g, 0.04, 0.035, 0.09, M.white(), 0.05 + i * 0.1, 1.0, -0.32, 10)
  const pos = box(g, 0.24, 0.16, 0.02, M.black(), 1.6, 1.02, 0.3)
  pos.rotation.x = -0.6
  // jar of chin-chin
  cyl(g, 0.08, 0.08, 0.2, glassMat('#fff', 0.35), 1.85, 1.0, -0.1, 12)
  cyl(g, 0.07, 0.07, 0.12, mat('#C98A3E', { rough: 0.8 }), 1.85, 1.0, -0.1, 12)
  // pendants
  for (const x of [-1.4, 0, 1.4]) lights.push(pendant(g, x, 0, 3.45, 1.15, BRAND.colors.ink))
  const slots: SlotDef[] = [
    { id: 'barista', x: -0.6, z: -0.95, rot: 0, anim: 'barista', kind: 'barista' },
    { id: 'barista2', x: 0.9, z: -0.95, rot: 0, anim: 'barista', kind: 'barista' },
    { id: 'order1', x: -0.7, z: 0.95, rot: 180, anim: 'stand', kind: 'barOrder' },
    { id: 'order2', x: 0.6, z: 0.95, rot: 180, anim: 'stand', kind: 'barOrder' },
  ]
  return { group: g, w: 4.15, d: 1.05, slots, lights, info: { name: 'Coffee bar', category: 'Café', priceUSD: 9000, desc: 'Espresso machine, grinder, pastry case. Café revenue funds the free Wi-Fi and pulls walk-ins into the lab.' } }
}

export const menuBoard: PropBuilder = () => {
  const g = new THREE.Group()
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.95), new THREE.MeshStandardMaterial({ map: menuTex(), roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.25 }))
  ;(m.material as THREE.MeshStandardMaterial).emissiveMap = (m.material as THREE.MeshStandardMaterial).map
  m.position.set(0, 2.85, 0.0)
  m.rotation.y = Math.PI
  g.add(m)
  const back = box(g, 1.96, 1.0, 0.04, M.black(), 0, 2.35, 0.03)
  back.castShadow = false
  for (const x of [-0.8, 0.8]) cyl(g, 0.004, 0.004, 0.4, M.black(), x, 3.3, 0.02, 4)
  // front-facing copy for customers
  const m2 = m.clone()
  m2.rotation.y = 0
  m2.position.z = 0.055
  g.add(m2)
  return { group: g, w: 0.1, d: 0.1, noBlock: true }
}

export const checkinKiosk: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 0.36, 0.04, 0.36, M.black(), 0, 0, 0, 0.02)
  box(g, 0.12, 1.0, 0.12, M.charcoal(), 0, 0.04, 0, 0.02)
  const head = new THREE.Group()
  head.position.set(0, 1.08, 0.04)
  head.rotation.x = -0.55
  box(head, 0.42, 0.3, 0.04, M.black(), 0, -0.15, 0, 0.02)
  screen(head, 0.38, 0.26, 'kiosk', 0, 0, 0, 0.025, 0, 1.3)
  g.add(head)
  box(g, 0.14, 0.14, 0.03, mat(BRAND.colors.yellow), 0, 0.85, 0.075)
  return {
    group: g, w: 0.4, d: 0.4,
    slots: [{ id: 'use', x: 0, z: 0.55, rot: 180, anim: 'standUse', kind: 'kiosk' }],
    info: { name: 'Check-in kiosk', category: 'Front of house', priceUSD: 900, desc: 'Members tap a card or scan a QR. Day passes paid by card or bank transfer in seconds.' },
  }
}

export const receptionDesk: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 2.2, 0.75, 0.75, M.white(), 0, 0, -0.05, 0.03)
  box(g, 2.2, 0.32, 0.3, M.walnut(), 0, 0.75, 0.2, 0.02)
  box(g, 2.26, 0.04, 0.36, mat('#EDE8DF', { rough: 0.25 }), 0, 1.07, 0.2, 0.01)
  box(g, 2.25, 0.04, 0.8, mat('#EDE8DF', { rough: 0.25 }), 0, 0.75, -0.05, 0.01)
  // logo strip
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.26), new THREE.MeshStandardMaterial({
    map: canvasTex(512, 96, (c, w, h) => { c.fillStyle = BRAND.colors.yellow; c.fillRect(0, 0, w, h); c.fillStyle = BRAND.colors.ink; c.font = 'bold 60px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(`${BRAND.name} ${BRAND.city}`, w / 2, h / 2 + 3) }, false),
  }))
  strip.position.set(0, 0.48, 0.355)
  g.add(strip)
  const mon = new THREE.Group()
  mon.position.set(-0.4, 0.79, -0.2)
  box(mon, 0.5, 0.32, 0.03, M.black(), 0, 0.12, 0, 0.01)
  screen(mon, 0.47, 0.29, 'dash', 0, 0, 0.28, -0.017, Math.PI, 1.1)
  box(mon, 0.04, 0.12, 0.04, M.charcoal(), 0, 0, 0)
  g.add(mon)
  plantPot(g, 0.85, -0.2, 0.35, 0.77)
  return {
    group: g, w: 2.26, d: 0.95,
    slots: [
      { id: 'staff', x: 0, z: -0.8, rot: 0, anim: 'standType', kind: 'reception' },
      { id: 'visitor', x: 0.3, z: 0.75, rot: 180, anim: 'talk', kind: 'receptionVisitor' },
    ],
    info: { name: 'Reception', category: 'Front of house', priceUSD: 2500, desc: 'Hosts welcome first-timers, run inductions and hand out locker keys.' },
  }
}

export const cafeTable4: PropBuilder = () => {
  const g = new THREE.Group()
  cyl(g, 0.22, 0.26, 0.03, M.black(), 0, 0, 0, 18)
  cyl(g, 0.035, 0.035, 0.72, M.black(), 0, 0.03, 0, 8)
  cyl(g, 0.5, 0.5, 0.04, M.wood(), 0, 0.74, 0, 28)
  const slots: SlotDef[] = []
  const seats = [[0, 0.72, 180], [0.72, 0, 270], [0, -0.72, 0], [-0.72, 0, 90]] as const
  seats.forEach(([x, z, r], i) => {
    chair(g, x, z, r, 'cafe')
    slots.push({ id: `s${i}`, x, z, rot: r, anim: 'sitDrink', kind: 'cafeSeat', y: 0.47 })
  })
  cyl(g, 0.045, 0.04, 0.09, M.white(), 0.18, 0.78, 0.1, 10)
  return { group: g, w: 1.0, d: 1.0, slots, pad: 0.15 }
}

export const cafeTable2: PropBuilder = () => {
  const g = new THREE.Group()
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) cyl(g, 0.02, 0.02, 0.74, M.black(), sx * 0.3, 0, sz * 0.3, 6)
  box(g, 0.72, 0.04, 0.72, M.wood(), 0, 0.74, 0, 0.015)
  const slots: SlotDef[] = []
  ;([[0, 0.62, 180], [0, -0.62, 0]] as const).forEach(([x, z, r], i) => {
    chair(g, x, z, r, 'cafe')
    slots.push({ id: `s${i}`, x, z, rot: r, anim: 'sitType', kind: 'cafeSeat', y: 0.47 })
  })
  return { group: g, w: 0.75, d: 0.75, slots, pad: 0.15 }
}

export const sofaSet: PropBuilder = () => {
  const g = new THREE.Group()
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.8), new THREE.MeshStandardMaterial({
    map: canvasTex(256, 180, (c, w, h) => {
      c.fillStyle = '#C8643B'; c.fillRect(0, 0, w, h)
      c.strokeStyle = '#F2C230'; c.lineWidth = 6; c.strokeRect(10, 10, w - 20, h - 20)
      c.fillStyle = '#15171B'; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(30 + i * 36, h / 2); c.lineTo(48 + i * 36, h / 2 - 18); c.lineTo(66 + i * 36, h / 2); c.lineTo(48 + i * 36, h / 2 + 18); c.fill() }
    }, false), roughness: 0.95,
  }))
  rug.rotation.x = -Math.PI / 2
  rug.position.y = 0.012
  g.add(rug)
  chair(g, -0.72, 0, 90, 'lounge', '#2E5C8A')
  chair(g, 0.72, 0, 270, 'lounge', '#0E7A4F')
  cyl(g, 0.32, 0.32, 0.38, M.walnut(), 0, 0, 0, 20)
  box(g, 0.22, 0.03, 0.16, mat(P.clay), 0.05, 0.38, 0)
  return {
    group: g, w: 0.75, d: 0.75,
    slots: [
      { id: 'a', x: -0.72, z: 0, rot: 90, anim: 'sitTalk', kind: 'sofa', y: 0.42 },
      { id: 'b', x: 0.72, z: 0, rot: 270, anim: 'sitTalk', kind: 'sofa', y: 0.42 },
    ],
  }
}

export const windowBar: PropBuilder = () => {
  const g = new THREE.Group()
  const L = 6.8
  box(g, L, 0.05, 0.42, M.wood(), 0, 1.02, 0, 0.01)
  for (let i = 0; i < 5; i++) box(g, 0.05, 1.02, 0.05, M.black(), -L / 2 + 0.2 + (i * (L - 0.4)) / 4, 0, 0.1)
  const slots: SlotDef[] = []
  for (let i = 0; i < 6; i++) {
    const x = -L / 2 + 0.6 + i * ((L - 1.2) / 5)
    chair(g, x, -0.48, 0, 'stool')
    slots.push({ id: `w${i}`, x, z: -0.5, rot: 0, anim: i % 2 ? 'sitType' : 'sitDrink', kind: 'windowSeat', y: 0.74 })
  }
  return { group: g, w: L, d: 0.45, slots }
}

export const stage: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 4.2, 0.3, 2.4, M.charcoal(), 0, 0, 0, 0.02)
  box(g, 4.2, 0.02, 2.4, mat('#3a2a1e', { rough: 0.6 }), 0, 0.3, 0)
  // big screen on the wall behind
  box(g, 3.3, 1.9, 0.08, M.black(), 0, 1.25, -1.15, 0.02)
  const s = screen(g, 3.2, 1.8, 'stage', 0, 0, 2.15, -1.1, 0, 1.4)
  s.userData.nightGlow = 1
  // speakers + mic
  for (const sx of [-1.85, 1.85]) box(g, 0.4, 0.7, 0.35, M.black(), sx, 0.3, -0.8, 0.03)
  cyl(g, 0.012, 0.012, 1.3, M.black(), 0.6, 0.3, 0.3, 6)
  sph(g, 0.04, M.charcoal(), 0.6, 1.62, 0.3, 8, 6)
  // string lights
  const bulbM = new THREE.MeshStandardMaterial({ color: '#fff3c4', emissive: '#ffd27a', emissiveIntensity: 2 })
  for (let i = 0; i < 14; i++) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), bulbM)
    const t = i / 13
    b.position.set(-2.0 + t * 4.0, 3.1 - Math.sin(t * Math.PI) * 0.35, 0.9)
    markDynamic(b)
    b.userData.nightGlow = 3
    g.add(b)
  }
  const slots: SlotDef[] = [{ id: 'presenter', x: 0.2, z: 0.1, rot: 0, anim: 'present', kind: 'presenter', y: 0.3 }]
  for (let i = 0; i < 10; i++) {
    const row = Math.floor(i / 5)
    slots.push({ id: `aud${i}`, x: -1.8 + (i % 5) * 0.9, z: 2.0 + row * 0.9, rot: 180, anim: 'clap', kind: 'audience' })
  }
  return {
    group: g, w: 4.2, d: 2.4, slots, noBlock: true,
    info: { name: 'Demo stage', category: 'Café', priceUSD: 6000, desc: 'Friday demo nights: teams show prototypes to the community, press and investors.' },
  }
}

export const plant: PropBuilder = (o) => {
  const g = new THREE.Group()
  plantPot(g, 0, 0, (o.size as number) ?? 1)
  return { group: g, w: 0.5, d: 0.5 }
}
