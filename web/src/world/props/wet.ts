import * as THREE from 'three'
import { mat, P, glassMat } from '../../engine/materials'
import { box, cyl, sph, markDynamic } from '../../engine/geom'
import { canvasTex } from '../../engine/textures'
import { M, chair, led, screen, setLed, type PropBuilder, type SlotDef } from './common'

const labBenchTop = () => mat('#2E3338', { rough: 0.35 }) // epoxy resin top
const cabinet = () => mat('#F1F3F2', { rough: 0.45 })

function glassware(parent: THREE.Object3D, x: number, y: number, z: number, n = 4, seed = 1) {
  const liquids = ['#3FB6A8', '#F2C230', '#E8546B', '#7B5CD6', '#5BA4CF']
  for (let i = 0; i < n; i++) {
    const c = liquids[(i + seed) % liquids.length]
    const xx = x + i * 0.11
    if ((i + seed) % 3 === 0) {
      // erlenmeyer
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 14, 1, true), glassMat('#ffffff', 0.35))
      f.position.set(xx, y + 0.06, z)
      parent.add(f)
      const liq = new THREE.Mesh(new THREE.ConeGeometry(0.042, 0.05, 14), mat(c, { rough: 0.2, opacity: 0.8 }))
      liq.position.set(xx, y + 0.025, z)
      parent.add(liq)
    } else {
      cyl(parent, 0.03, 0.03, 0.12, glassMat('#ffffff', 0.35), xx, y, z, 12)
      cyl(parent, 0.026, 0.026, 0.06, mat(c, { rough: 0.2, opacity: 0.8 }), xx, y, z, 12)
    }
  }
}

export const fumeHood: PropBuilder = () => {
  const g = new THREE.Group()
  const W = 1.8, D = 0.9
  box(g, W, 0.86, D, cabinet(), 0, 0, 0, 0.02)
  box(g, W, 0.04, D, labBenchTop(), 0, 0.86, 0)
  box(g, 0.08, 1.4, D, cabinet(), -W / 2 + 0.04, 0.9, 0)
  box(g, 0.08, 1.4, D, cabinet(), W / 2 - 0.04, 0.9, 0)
  box(g, W, 1.4, 0.06, cabinet(), 0, 0.9, -D / 2 + 0.03)
  box(g, W, 0.5, D, cabinet(), 0, 2.3, 0, 0.02)
  // sash (sliding glass)
  const sash = box(g, W - 0.16, 0.65, 0.025, glassMat('#dff4f0', 0.35), 0, 1.45, D / 2 - 0.05)
  sash.renderOrder = 3
  box(g, W - 0.16, 0.05, 0.05, M.black(), 0, 1.42, D / 2 - 0.04)
  // airflow monitor
  const mon = box(g, 0.14, 0.09, 0.02, M.black(), W / 2 - 0.2, 2.42, D / 2 + 0.005)
  void mon
  const ok = led(g, W / 2 - 0.2, 2.5, D / 2 + 0.02, '#3FE0B0')
  glassware(g, -0.5, 0.9, -0.1, 5, 1)
  // exhaust duct
  cyl(g, 0.14, 0.14, 0.8, mat('#C9CED4', { rough: 0.3, metal: 0.8 }), 0, 2.8, -0.1, 14)
  const lamp = box(g, W - 0.3, 0.015, 0.06, new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#f4fffc', emissiveIntensity: 1.2 }), 0, 2.27, 0.1)
  markDynamic(lamp)
  return {
    group: g, w: W, d: D,
    slots: [{ id: 'op', x: 0, z: 0.8, rot: 180, anim: 'pipette', kind: 'hood' }],
    info: { name: 'Chemical fume hood (ducted)', category: 'Wet lab', priceUSD: 9000, machine: true, desc: 'For solvents, acids and anything that smells. Airflow alarm wired into the ops dashboard.' },
    tick: (s) => setLed(ok, s.fault ? '#ff3b3b' : '#3FE0B0'),
  }
}

export const bioCabinet: PropBuilder = () => {
  const g = new THREE.Group()
  const W = 1.5, D = 0.8
  box(g, W, 0.7, D, M.dsteel(), 0, 0, 0, 0.02)
  box(g, W, 1.25, D, mat('#E8ECEB', { rough: 0.4 }), 0, 0.72, 0, 0.03)
  const glass = box(g, W - 0.2, 0.55, 0.02, glassMat('#dff4f0', 0.4), 0, 1.0, D / 2 + 0.005)
  glass.renderOrder = 3
  box(g, W - 0.2, 0.25, 0.02, mat('#1F6FB2', { rough: 0.4 }), 0, 1.7, D / 2 + 0.005)
  const uv = box(g, W - 0.3, 0.012, 0.05, new THREE.MeshStandardMaterial({ color: '#fff', emissive: '#c9b8ff', emissiveIntensity: 0.4 }), 0, 1.58, 0.1)
  markDynamic(uv)
  screen(g, 0.2, 0.1, 'lab', 1, W / 2 - 0.25, 1.82, D / 2 + 0.012, 0, 1.0)
  glassware(g, -0.4, 0.74, 0.0, 3, 2)
  return {
    group: g, w: W, d: D,
    slots: [{ id: 'op', x: 0, z: 0.75, rot: 180, anim: 'pipette', kind: 'bsc', y: 0 }],
    info: { name: 'Class II biosafety cabinet', category: 'Wet lab', priceUSD: 11000, machine: true, desc: 'Sterile work for cell culture, microbiology and diagnostics prototyping at BSL-1 and BSL-2.' },
  }
}

export const labFridge: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 0.75, 1.9, 0.72, mat('#F4F6F6', { rough: 0.3 }), 0, 0, 0, 0.03)
  const door = box(g, 0.7, 1.75, 0.02, glassMat('#e8f6ff', 0.4), 0, 0.08, 0.36)
  door.renderOrder = 3
  for (let l = 0; l < 4; l++) for (let i = 0; i < 4; i++) box(g, 0.12, 0.12, 0.2, mat(['#5BA4CF', '#3FB6A8', '#F2C230', '#E8546B'][(i + l) % 4], { rough: 0.5 }), -0.22 + i * 0.15, 0.25 + l * 0.42, 0.05, 0.01)
  const disp = box(g, 0.14, 0.05, 0.01, new THREE.MeshStandardMaterial({ color: '#000', emissive: '#3FE0B0', emissiveIntensity: 1.5 }), 0.15, 1.8, 0.375)
  disp.userData.nightGlow = 1
  return { group: g, w: 0.75, d: 0.72, slots: [{ id: 'op', x: 0, z: 0.75, rot: 180, anim: 'reach', kind: 'fridge' }], info: { name: '4 °C lab fridge', category: 'Wet lab', priceUSD: 2500, desc: 'Reagents and samples. Temperature logged every minute; alerts go to the on-call staff phone.' } }
}

export const labFreezer: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 0.75, 1.9, 0.72, mat('#E6EEF5', { rough: 0.3 }), 0, 0, 0, 0.03)
  box(g, 0.02, 0.5, 0.04, M.steel(), 0.3, 0.9, 0.37)
  const disp = box(g, 0.14, 0.05, 0.01, new THREE.MeshStandardMaterial({ color: '#000', emissive: '#5BA4CF', emissiveIntensity: 1.5 }), 0.15, 1.8, 0.365)
  disp.userData.nightGlow = 1
  return { group: g, w: 0.75, d: 0.72, info: { name: '−20 °C freezer', category: 'Wet lab', priceUSD: 2200 } }
}

export const labWallBench: PropBuilder = () => {
  const g = new THREE.Group()
  const W = 4.0, D = 0.7
  box(g, W, 0.86, D, cabinet(), 0, 0, 0, 0.02)
  box(g, W, 0.04, D, labBenchTop(), 0, 0.86, 0)
  box(g, W, 0.025, 0.3, M.birch(), 0, 1.5, -0.2) // reagent shelf
  for (let i = 0; i < 10; i++) cyl(g, 0.04, 0.04, 0.16, mat(['#7a4b2a', '#ffffff', '#1F6FB2'][i % 3], { rough: 0.3, opacity: i % 3 === 1 ? 0.5 : 1 }), -1.8 + i * 0.4, 1.525, -0.2, 10)
  // centrifuge
  cyl(g, 0.2, 0.22, 0.25, mat('#E8ECEB', { rough: 0.35 }), -1.2, 0.9, 0.05, 20)
  const cl = cyl(g, 0.17, 0.17, 0.03, mat('#1F6FB2', { rough: 0.3 }), -1.2, 1.15, 0.05, 20)
  markDynamic(cl)
  // PCR thermocycler
  box(g, 0.3, 0.22, 0.38, mat('#DADDE0', { rough: 0.4 }), -0.4, 0.9, 0.05, 0.02)
  screen(g, 0.15, 0.09, 'lab', 2, -0.4, 1.06, 0.245, 0, 1.1)
  // microscope
  box(g, 0.2, 0.05, 0.28, M.black(), 0.5, 0.9, 0.05, 0.01)
  box(g, 0.05, 0.35, 0.05, M.black(), 0.5, 0.95, -0.05)
  cyl(g, 0.03, 0.03, 0.18, M.black(), 0.5, 1.12, 0.06, 10).rotation.x = -0.6
  box(g, 0.24, 0.15, 0.14, M.charcoal(), 0.5, 1.25, -0.04, 0.02)
  glassware(g, 1.1, 0.9, 0.0, 6, 3)
  const slots: SlotDef[] = [
    { id: 'centrifuge', x: -1.2, z: 0.7, rot: 180, anim: 'standUse', kind: 'centrifuge' },
    { id: 'pcr', x: -0.4, z: 0.7, rot: 180, anim: 'standUse', kind: 'pcr' },
    { id: 'scope', x: 0.5, z: 0.75, rot: 180, anim: 'sitType', kind: 'microscope', y: 0.62 },
    { id: 'bench', x: 1.3, z: 0.7, rot: 180, anim: 'pipette', kind: 'labBench' },
  ]
  chair(g, 0.5, 0.75, 180, 'lab')
  return {
    group: g, w: W, d: D, slots,
    info: { name: 'Instrument bench', category: 'Wet lab', priceUSD: 14000, machine: true, desc: 'Centrifuge, PCR thermocycler, microscope with camera, analytical balance.' },
    tick: (s) => { if (s.active) cl.rotation.y += 0.9 },
  }
}

export const labIsland: PropBuilder = () => {
  const g = new THREE.Group()
  const W = 3.6, D = 1.5
  box(g, W, 0.86, D, cabinet(), 0, 0, 0, 0.02)
  box(g, W + 0.05, 0.04, D + 0.05, labBenchTop(), 0, 0.86, 0)
  // central reagent rack with service spine
  box(g, W - 0.2, 0.5, 0.2, mat('#DADDE0', { rough: 0.4 }), 0, 0.9, 0)
  box(g, W - 0.2, 0.025, 0.36, M.birch(), 0, 1.45, 0)
  for (let i = 0; i < 8; i++) {
    cyl(g, 0.035, 0.035, 0.14, mat(['#ffffff', '#7a4b2a', '#3FB6A8', '#F2C230'][i % 4], { rough: 0.3, opacity: i % 4 === 0 ? 0.5 : 1 }), -1.5 + i * 0.42, 1.475, 0.08, 10)
  }
  glassware(g, -1.4, 0.9, 0.45, 5, 4)
  glassware(g, 0.6, 0.9, -0.45, 5, 1)
  // pipette stands
  for (const [x, z] of [[-0.2, 0.5], [0.9, -0.5]]) {
    box(g, 0.1, 0.02, 0.1, M.charcoal(), x, 0.9, z)
    for (let k = 0; k < 3; k++) cyl(g, 0.012, 0.008, 0.22, mat(['#F2C230', '#5BA4CF', '#E8546B'][k], { rough: 0.4 }), x - 0.03 + k * 0.03, 0.92, z, 6)
  }
  // balance
  box(g, 0.25, 0.1, 0.3, M.white(), 1.4, 0.9, 0.4, 0.02)
  box(g, 0.22, 0.2, 0.22, glassMat('#fff', 0.3), 1.4, 1.0, 0.4)
  const slots: SlotDef[] = []
  for (const x of [-1.1, 0, 1.1]) {
    slots.push({ id: `f${x}`, x, z: 1.05, rot: 180, anim: 'pipette', kind: 'labIsland' })
    slots.push({ id: `b${x}`, x, z: -1.05, rot: 0, anim: 'pipette', kind: 'labIsland' })
  }
  return { group: g, w: W + 0.05, d: D + 0.05, slots, info: { name: 'Shared lab island', category: 'Wet lab', priceUSD: 6500, desc: 'Six bookable bench spots with gas, vacuum and power. Rented by the hour or by the month.' } }
}

export const labSideBench: PropBuilder = () => {
  const g = new THREE.Group()
  const W = 2.6, D = 0.7
  box(g, W, 0.86, D, cabinet(), 0, 0, 0, 0.02)
  box(g, W, 0.04, D, labBenchTop(), 0, 0.86, 0)
  // autoclave
  box(g, 0.6, 0.55, 0.55, mat('#E4E4E2', { rough: 0.3, metal: 0.4 }), -0.8, 0.9, 0, 0.04)
  cyl(g, 0.2, 0.2, 0.04, M.steel(), -0.8, 1.18, 0.29, 20).rotation.x = Math.PI / 2
  // CO2 incubator
  box(g, 0.65, 0.7, 0.6, M.white(), 0.1, 0.9, 0, 0.03)
  screen(g, 0.14, 0.08, 'lab', 3, 0.3, 1.45, 0.305, 0, 1.0)
  // shaker
  box(g, 0.45, 0.15, 0.4, mat('#1F6FB2', { rough: 0.4 }), 0.9, 0.9, 0, 0.02)
  glassware(g, 0.75, 1.05, 0.0, 3, 0)
  return {
    group: g, w: W, d: D,
    slots: [{ id: 'auto', x: -0.8, z: 0.7, rot: 180, anim: 'standUse', kind: 'autoclave' }, { id: 'inc', x: 0.3, z: 0.7, rot: 180, anim: 'reach', kind: 'incubator' }],
    info: { name: 'Autoclave + CO₂ incubator', category: 'Wet lab', priceUSD: 12000, desc: 'Sterilisation and controlled culture. Booked through the app; usage logged automatically.' },
  }
}

export const labSink: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 1.4, 0.86, 0.6, cabinet(), 0, 0, 0, 0.02)
  box(g, 1.4, 0.04, 0.6, labBenchTop(), 0, 0.86, 0)
  box(g, 0.6, 0.02, 0.4, mat('#9aa0a6', { metal: 0.5, rough: 0.3 }), -0.2, 0.87, 0)
  cyl(g, 0.015, 0.015, 0.35, M.steel(), -0.2, 0.9, -0.22, 8)
  // eyewash
  box(g, 0.2, 0.06, 0.2, mat('#2FA36B', { rough: 0.4 }), 0.45, 0.9, 0, 0.02)
  cyl(g, 0.03, 0.03, 0.12, mat('#2FA36B', { rough: 0.4 }), 0.4, 0.96, 0, 8)
  cyl(g, 0.03, 0.03, 0.12, mat('#2FA36B', { rough: 0.4 }), 0.5, 0.96, 0, 8)
  return { group: g, w: 1.4, d: 0.6, slots: [{ id: 'wash', x: -0.2, z: 0.62, rot: 180, anim: 'standUse', kind: 'sink' }] }
}

export const safetyShower: PropBuilder = () => {
  const g = new THREE.Group()
  cyl(g, 0.03, 0.03, 2.3, mat('#2FA36B', { rough: 0.4 }), 0, 0, 0, 8)
  cyl(g, 0.15, 0.12, 0.06, mat('#2FA36B', { rough: 0.4 }), 0.2, 2.25, 0, 14)
  box(g, 0.3, 0.03, 0.03, mat('#2FA36B', { rough: 0.4 }), 0.1, 2.27, 0)
  return { group: g, w: 0.3, d: 0.3, noBlock: true }
}

export const chemCabinet: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 1.1, 1.65, 0.55, mat('#F2C230', { rough: 0.45 }), 0, 0, 0, 0.02)
  box(g, 0.01, 1.5, 0.02, M.black(), 0, 0.07, 0.28)
  const t = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.3), new THREE.MeshStandardMaterial({ map: canvasTex(256, 110, (c, w, h) => { c.fillStyle = '#F2C230'; c.fillRect(0, 0, w, h); c.fillStyle = '#C62828'; c.font = 'bold 30px sans-serif'; c.fillText('FLAMMABLE', 20, 45); c.fillText('KEEP FIRE AWAY', 20, 88) }, false) }))
  t.position.set(0, 1.35, 0.28)
  g.add(t)
  return { group: g, w: 1.1, d: 0.55 }
}

export const coatHooks: PropBuilder = () => {
  const g = new THREE.Group()
  box(g, 0.8, 0.06, 0.04, M.walnut(), 0, 1.7, 0)
  for (let i = 0; i < 3; i++) {
    box(g, 0.24, 0.8, 0.08, mat('#FAFAFA', { rough: 0.8 }), -0.26 + i * 0.26, 0.9, 0.05, 0.03)
  }
  return { group: g, w: 0.8, d: 0.15, noBlock: true }
}

export { sph }
