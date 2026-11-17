import * as THREE from 'three'
import { Renderer, detectQuality, type Quality } from './renderer'
import { CameraRig, type Shot } from './CameraRig'
import { Lighting } from '../world/Lighting'
import { World } from '../world/World'
import { Sim } from '../sim/Sim'
import { updateScreens } from './textures'
import { roomAt, ROOM_BY_ID, type ZoneId } from '../data/layout'
import type { WallMode } from '../world/Building'
import { useUI } from '../ui/store'
import { TOUR } from '../data/tour'
import { LINES } from '../sim/brains'

export type Selection = { kind: 'agent'; id: string } | { kind: 'prop'; id: string } | { kind: 'room'; id: string } | null

export const ZONE_SHOTS: Record<string, Shot> = {
  overview: { target: [20, 0, 14], dist: 56, az: 0.55, pol: 0.78 },
  cafe: { target: [22, 0.5, 23.6], dist: 17, az: 0.3, pol: 0.92 },
  bench: { target: [23.5, 0.6, 15.2], dist: 15, az: 0.62, pol: 0.86 },
  library: { target: [35.5, 0.6, 16], dist: 14, az: -0.55, pol: 0.9 },
  fab: { target: [18, 0.6, 4.2], dist: 16, az: 0.35, pol: 0.86 },
  drone: { target: [29.5, 1.2, 4], dist: 13, az: 0.65, pol: 0.95 },
  wetlab: { target: [5, 0.6, 4.6], dist: 13, az: -0.45, pol: 0.9 },
  studios: { target: [6.5, 0.6, 15.5], dist: 14, az: -0.5, pol: 0.86 },
  classroom: { target: [5, 0.6, 24], dist: 13, az: -0.25, pol: 0.92 },
  power: { target: [36.5, 0.8, 3], dist: 13, az: 0.85, pol: 0.88 },
  street: { target: [23, 2.6, 27.5], dist: 21, az: 0.78, pol: 1.32 },
}

export class Game {
  scene = new THREE.Scene()
  camera: THREE.PerspectiveCamera
  renderer: Renderer
  rig: CameraRig
  lighting: Lighting
  world: World
  sim: Sim
  quality: Quality
  selection: Selection = null
  private clock = new THREE.Timer()
  private lastPush = 0
  private ray = new THREE.Raycaster()
  private hoverAgent: string | null = null
  private down: { x: number; y: number; t: number } | null = null
  private tourTimer = 0
  private flicker = 0
  private t = 0
  private highlight: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>

  constructor(public container: HTMLElement) {
    this.quality = detectQuality()
    this.camera = new THREE.PerspectiveCamera(38, container.clientWidth / container.clientHeight, 0.3, 900)
    this.renderer = new Renderer(container, this.scene, this.camera, this.quality)
    this.rig = new CameraRig(this.camera, this.renderer.renderer.domElement)
    this.lighting = new Lighting(this.scene, this.quality)
    this.world = new World(this.scene)
    this.sim = new Sim(this.world, this.scene)
    this.sim.onOutage = (start) => this.onOutage(start)
    this.rig.setShot(ZONE_SHOTS.street)
    // zone highlight plane
    this.highlight = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#F2C230', transparent: true, opacity: 0.0, depthWrite: false }))
    this.highlight.rotation.x = -Math.PI / 2
    this.highlight.position.y = 0.02
    this.highlight.renderOrder = 2
    this.scene.add(this.highlight)
    // street: danfo drops people at the bus stop
    for (const v of this.world.street.vehicles) {
      if (v.kind === 'danfo') v.onStop = () => {
        const conductor = ['Yaba! Yaba! Enter with your change o!', 'Sabo, Yaba, Ojuelegba!', 'Owa! (Stop!)']
        void conductor
      }
    }
    this.bindInput()
    this.lighting.setTime(this.sim.minute)
    this.loop()
  }

  private bindInput() {
    const el = this.renderer.renderer.domElement
    el.addEventListener('pointerdown', (e) => { this.down = { x: e.clientX, y: e.clientY, t: performance.now() } })
    el.addEventListener('pointerup', (e) => {
      if (!this.down) return
      const moved = Math.hypot(e.clientX - this.down.x, e.clientY - this.down.y)
      const quick = performance.now() - this.down.t < 450
      this.down = null
      if (moved < 6 && quick && e.button === 0) this.click(e.clientX, e.clientY)
    })
    el.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return
      const a = this.pickAgent(e.clientX, e.clientY)
      const id = a?.id ?? null
      if (id !== this.hoverAgent) {
        if (this.hoverAgent) this.sim.byId.get(this.hoverAgent)?.showTag(this.selection?.kind === 'agent' && this.selection.id === this.hoverAgent)
        if (a) a.showTag(true)
        this.hoverAgent = id
        el.style.cursor = a ? 'pointer' : ''
      }
    })
  }

  private ndc(x: number, y: number) {
    const r = this.renderer.renderer.domElement.getBoundingClientRect()
    return new THREE.Vector2(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1)
  }

  pickAgent(x: number, y: number) {
    this.ray.setFromCamera(this.ndc(x, y), this.camera)
    let best = null as null | ReturnType<Sim['byId']['get']>
    let bd = Infinity
    const box = new THREE.Box3()
    const hit = new THREE.Vector3()
    for (const a of this.sim.agents) {
      if (a.gone) continue
      const s = a.char.root.scale.x
      const top = a.isSeated() ? 1.4 : 1.85
      box.min.set(a.x - 0.32, 0, a.z - 0.32)
      box.max.set(a.x + 0.32, top * s, a.z + 0.32)
      if (this.ray.ray.intersectBox(box, hit)) {
        const d = hit.distanceTo(this.camera.position)
        if (d < bd) { bd = d; best = a }
      }
    }
    return best ?? null
  }

  private click(x: number, y: number) {
    const a = this.pickAgent(x, y)
    if (a) return this.select({ kind: 'agent', id: a.id })
    this.ray.setFromCamera(this.ndc(x, y), this.camera)
    let bestId: string | null = null
    let bd = Infinity
    const hit = new THREE.Vector3()
    for (const [id, b] of this.world.boxes) {
      const p = this.world.byId.get(id)
      if (!p?.def.info) continue
      if (this.ray.ray.intersectBox(b, hit)) {
        const size = b.getSize(new THREE.Vector3())
        const d = hit.distanceTo(this.camera.position) + size.length() * 0.6
        if (d < bd) { bd = d; bestId = id }
      }
    }
    if (bestId) return this.select({ kind: 'prop', id: bestId })
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const p = new THREE.Vector3()
    if (this.ray.ray.intersectPlane(plane, p)) {
      const r = roomAt(p.x, p.z)
      if (r) return this.select({ kind: 'room', id: r.id })
    }
    this.select(null)
  }

  select(s: Selection, fly = false) {
    // clear old
    if (this.selection?.kind === 'agent') {
      const old = this.sim.byId.get(this.selection.id)
      old?.setSelected(false, this.scene)
      old?.showTag(false)
    }
    this.selection = s
    this.highlight.material.opacity = 0
    if (s?.kind === 'agent') {
      const a = this.sim.byId.get(s.id)
      a?.setSelected(true, this.scene)
      a?.showTag(true)
      if (fly && a) this.rig.flyTo({ target: [a.x, 0.9, a.z], dist: 9, az: this.rig.shot.az, pol: 0.95 }, 1.4, () => { this.rig.follow = a.char.root })
    } else if (s?.kind === 'room') {
      const r = ROOM_BY_ID[s.id]
      if (r) {
        this.highlight.scale.set(r.rect.w, r.rect.d, 1)
        this.highlight.position.set(r.rect.x + r.rect.w / 2, 0.02, r.rect.z + r.rect.d / 2)
        ;(this.highlight.material as THREE.MeshBasicMaterial).color.set(r.accent)
        this.highlight.material.opacity = 0.16
      }
    }
    this.pushUI(true)
  }

  followSelected() {
    if (this.selection?.kind !== 'agent') return
    const a = this.sim.byId.get(this.selection.id)
    if (a) this.rig.flyTo({ target: [a.x, 0.9, a.z], dist: 8.5, az: this.rig.shot.az, pol: 0.98 }, 1.3, () => { this.rig.follow = a.char.root })
  }

  flyZone(id: keyof typeof ZONE_SHOTS | ZoneId) {
    const shot = ZONE_SHOTS[id as string]
    if (shot) this.rig.flyTo(shot, 2)
  }

  setWalls(m: WallMode) {
    this.world.building.setMode(m)
    this.pushUI(true)
  }

  setSpeed(i: number) {
    this.sim.speedIdx = i
    this.pushUI(true)
  }

  jumpTo(minute: number) {
    const m = this.sim.minute % 1440
    let target = Math.floor(this.sim.minute / 1440) * 1440 + minute
    if (minute < m) target += 1440
    this.sim.minute = target - 0.01
    this.pushUI(true)
  }

  triggerOutage() {
    this.sim.triggerOutage()
  }

  // Advance the simulation without rendering (used for screenshots / deep links).
  fastForward(minutes: number) {
    const target = this.sim.minute + minutes
    const prev = this.sim.speedIdx
    this.sim.speedIdx = 3
    let guard = 0
    while (this.sim.minute < target && guard++ < 20000) {
      this.lighting.setTime(this.sim.minute % 1440)
      this.sim.update(0.12, this.lighting.elevation, 0)
      this.world.update(this.t, 0.12, this.lighting.night)
      this.t += 0.12
    }
    this.sim.speedIdx = prev
    this.world.building.roofLift = this.world.building.mode === 'up' ? 0 : 1
    this.pushUI(true)
  }

  private onOutage(start: boolean) {
    if (start) this.flicker = 0.6
    const present = this.sim.agents.filter((a) => !a.gone && a.checkedIn && a.info.role === 'member')
    const lines = [...(start ? LINES.outage : LINES.restore)].sort(() => Math.random() - 0.5)
    const who = [...present].sort(() => Math.random() - 0.5).slice(0, Math.min(3, lines.length))
    who.forEach((a, i) => setTimeout(() => a.say(lines[i], 3.5), 300 + i * 700))
  }

  // ── tour ──
  startTour(i = 0) {
    const ui = useUI.getState()
    ui.set({ mode: 'tour', tourIndex: i, dashboard: false })
    this.applyTourStop(i)
  }

  applyTourStop(i: number) {
    const stop = TOUR[i]
    if (!stop) return
    this.select(null)
    this.rig.follow = null
    this.world.building.setMode(stop.walls)
    if (stop.time !== undefined) this.jumpTo(stop.time)
    if (stop.speed !== undefined) this.sim.speedIdx = stop.speed
    this.rig.flyTo(stop.shot, stop.flyTime ?? 2.4, () => { if (stop.orbit) this.rig.autoOrbit = stop.orbit })
    if (stop.action === 'outage') setTimeout(() => this.triggerOutage(), 1600)
    if (stop.action === 'drone') {
      const cage = this.world.byId.get('cage')
      if (cage && !cage.state.active) {
        cage.state.active = true
        cage.state.progress = 1
        setTimeout(() => { if (cage.state.active) cage.state.active = false }, 14000)
      }
    }
    if (stop.room) setTimeout(() => this.select({ kind: 'room', id: stop.room! }), 600)
    if (stop.action === 'dashboard') useUI.getState().set({ dashboard: true })
    this.tourTimer = 0
    useUI.getState().set({ tourIndex: i })
  }

  endTour() {
    useUI.getState().set({ mode: 'live', dashboard: false })
    this.rig.autoOrbit = 0
    this.world.building.setMode('cutaway')
    this.select(null)
    this.rig.flyTo(ZONE_SHOTS.overview, 2)
  }

  // ── loop ──
  private loop = () => {
    requestAnimationFrame(this.loop)
    this.clock.update()
    const dt = Math.min(0.05, this.clock.getDelta())
    this.t += dt
    const sim = this.sim
    sim.update(dt, this.lighting.elevation, this.lighting.overcast)
    if (this.flicker > 0) {
      this.flicker -= dt
      this.lighting.powerFlicker = this.flicker > 0.35 ? (Math.random() > 0.5 ? 0.9 : 0.2) : 0
    } else this.lighting.powerFlicker = 0
    this.lighting.setTime(sim.minute % 1440)
    this.rig.update(dt)
    this.world.building.update(dt, this.camera, this.rig.controls.target)
    this.world.street.update(dt, sim.speed)
    this.world.update(this.t, dt, this.lighting.night)
    updateScreens(this.t, dt)
    const roofOn = this.world.building.roof.visible && this.world.building.roofLift < 0.6
    for (const a of this.sim.agents) {
      if (a.gone) continue
      const indoor = roofOn && a.x > 0 && a.x < 40 && a.z > 0 && a.z < 28
      a.bubble.element.style.visibility = indoor ? 'hidden' : ''
      a.tag.element.style.visibility = indoor ? 'hidden' : ''
    }
    // room labels fade by zoom
    const dist = this.camera.position.distanceTo(this.rig.controls.target)
    const show = dist > 30 && useUI.getState().labels
    for (const l of this.world.roomLabels) l.visible = show
    // tour auto-advance
    const ui = useUI.getState()
    if (ui.mode === 'tour' && ui.autoplay && !this.rig.flying) {
      this.tourTimer += dt
      const stop = TOUR[ui.tourIndex]
      if (stop && this.tourTimer > (stop.hold ?? 9)) {
        if (ui.tourIndex < TOUR.length - 1) this.applyTourStop(ui.tourIndex + 1)
        else ui.set({ autoplay: false })
      }
    }
    if (this.t - this.lastPush > 0.25) this.pushUI()
    this.renderer.render(dt)
  }

  pushUI(force = false) {
    this.lastPush = this.t
    useUI.getState().fromGame(this, force)
  }
}
