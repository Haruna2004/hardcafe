import * as THREE from 'three'
import { Agent, type AgentInfo, type Step } from './Agent'
import type { World } from '../world/World'
import type { WorldSlot, PropInstance } from '../world/props'
import { PRICES, SKUS, type Stream, type Sku } from '../data/pricing'
import { POINTS, roomAt } from '../data/layout'
import { STAFF, MEMBERS, randomPerson, type CastMember, type Persona } from '../data/cast'
import { brainFor } from './brains'
import { NAIRA } from '../brand'

export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
export const SPEEDS = [0, 1, 3, 8]

export interface Ticker { id: number; t: number; icon: string; text: string; amount?: number; stream?: Stream; kind?: 'money' | 'ops' | 'power' | 'social' | 'ai' }
export interface PartsRequest { id: number; member: Agent; items: { sku: Sku; qty: number }[]; status: 'queued' | 'picking' | 'delivering' | 'done'; assignee?: Agent; created: number; done?: number; deliverTo: [number, number] }
export interface Ticket { id: number; prop: PropInstance; issue: string; status: 'open' | 'fixing' | 'done'; assignee?: Agent; created: number; done?: number; guide: string }
export interface Order { id: number; agent: Agent; item: 'coffee' | 'jollof' | 'snack'; served: boolean }
export interface PrintJob { prop: PropInstance; owner: Agent; start: number; end: number; grams: number; collected: boolean }

const rand = (a: number, b: number) => a + Math.random() * (b - a)

export class Sim {
  agents: Agent[] = []
  byId = new Map<string, Agent>()
  minute = 7 * 60 + 40
  day = 4 // Friday
  speedIdx = 1
  minPerSec = 2.2
  ticker: Ticker[] = []
  private tickId = 1
  requests: PartsRequest[] = []
  tickets: Ticket[] = []
  orders: Order[] = []
  jobs: PrintJob[] = []
  revenue: Record<Stream, number> = { passes: 0, members: 0, machines: 0, parts: 0, cafe: 0, studios: 0, lab: 0, training: 0, events: 0 }
  revenueByHour: number[] = new Array(24).fill(0)
  occupancyByHour: number[] = new Array(24).fill(0)
  checkins = 0
  fetchTimes: number[] = []
  fixTimes: number[] = []
  printsDone = 0
  machineMinutes = 0
  power = { grid: true, soc: 0.82, solarKw: 0, loadKw: 0, gen: false, outages: 0, outageMin: 0, nextOutage: Infinity, outageEnd: 0, genMinutes: 0, dieselSavedL: 0 }
  demo: { active: boolean; start: number; end: number; schedule: { id: string; start: number; end: number }[] } = { active: false, start: 18 * 60, end: 19 * 60 + 10, schedule: [] }
  inventory: Sku[] = SKUS.map((s) => ({ ...s }))
  spawned = new Set<string>()
  private nextPublic = 8 * 60
  private nextShopper = 9 * 60
  private nextGeneric = 8 * 60 + 15
  genericCount = 0
  listeners = new Set<() => void>()
  player: Agent | null = null
  onPlayerTick?: (dMin: number) => void
  onOutage?: (start: boolean) => void
  version = 0

  constructor(public world: World, public scene: THREE.Scene) {
    this.planDemo()
  }

  get speed() {
    return SPEEDS[this.speedIdx]
  }
  get dayName() {
    return DAY_NAMES[this.day % 7]
  }
  get clock() {
    const m = Math.floor(this.minute) % 1440
    const hh = Math.floor(m / 60)
    const mm = m % 60
    const ap = hh >= 12 ? 'pm' : 'am'
    const h12 = hh % 12 === 0 ? 12 : hh % 12
    return `${h12}:${String(mm).padStart(2, '0')}${ap}`
  }
  get totalToday() {
    return Object.values(this.revenue).reduce((a, b) => a + b, 0)
  }
  get present() {
    return this.agents.filter((a) => !a.gone && a.present)
  }
  get inside() {
    return this.agents.filter((a) => !a.gone && roomAt(a.x, a.z) && a.info.role !== 'staff')
  }

  emit(icon: string, text: string, extra: Partial<Ticker> = {}) {
    this.ticker.unshift({ id: this.tickId++, t: this.minute, icon, text, ...extra })
    if (this.ticker.length > 80) this.ticker.pop()
  }

  earn(stream: Stream, amount: number, text: string, icon = '₦', who?: Agent) {
    this.revenue[stream] += amount
    this.revenueByHour[Math.floor(this.minute / 60) % 24] += amount
    if (who) who.spentToday += amount
    this.emit(icon, `${text} · ${NAIRA(amount)}`, { amount, stream, kind: 'money' })
  }

  // ── spawning ──
  spawn(info: AgentInfo, at: [number, number], brain: (s: Sim, a: Agent) => Generator<Step, void, unknown>) {
    const a = new Agent(info, at[0], at[1])
    a.arrivedAt = this.minute
    this.agents.push(a)
    this.byId.set(a.id, a)
    this.scene.add(a.char.root)
    a.brain = brain(this, a)
    return a
  }

  castInfo(c: CastMember, role: AgentInfo['role']): AgentInfo {
    const base = randomPerson(c.seed, c.persona)
    return {
      id: c.id, name: c.name, role, title: c.title, team: c.team, project: c.project, bio: c.bio, persona: c.persona, sector: c.sector, plan: c.plan,
      look: { ...base.look, ...c.look, labCoat: false } as AgentInfo['look'],
    }
  }

  private director() {
    const m = this.minute
    const weekend = this.day % 7 >= 5
    // staff + named members
    for (const c of STAFF) {
      if (!this.spawned.has(c.id) && m >= c.arrive && m < c.leave - 30) {
        this.spawned.add(c.id)
        const info = this.castInfo(c, 'staff')
        this.spawn(info, Math.random() > 0.5 ? POINTS.spawnWest : POINTS.spawnEast, brainFor(c.persona, c))
      }
    }
    if (!weekend || this.day % 7 === 5) {
      for (const c of MEMBERS) {
        if (weekend && !['dayo', 'obinna', 'kunle', 'adaeze', 'emeka'].includes(c.id)) continue
        const arrive = c.arrive + ((c.seed * 37) % 23) - 11
        if (!this.spawned.has(c.id) && m >= arrive && m < c.leave - 60) {
          this.spawned.add(c.id)
          const info = this.castInfo(c, 'member')
          const fromBus = Math.random() < 0.35
          const a = this.spawn(info, fromBus ? [20.6, 30.0] : Math.random() > 0.5 ? POINTS.spawnWest : POINTS.spawnEast, brainFor(c.persona, c))
          if (fromBus) a.note(m, 'Arrived by danfo')
        }
      }
    }
    // generic day-pass members
    if (m >= this.nextGeneric && m < 14 * 60 && this.genericCount < (weekend ? 4 : 9)) {
      this.nextGeneric = m + rand(25, 60)
      this.genericCount++
      const persona: Persona = (['hardware', 'student', 'designer', 'hardware', 'student'] as Persona[])[Math.floor(Math.random() * 5)]
      const seed = Math.floor(Math.random() * 100000)
      const p = randomPerson(seed, persona)
      const info: AgentInfo = { id: `g${seed}`, name: p.name, role: 'member', title: persona === 'student' ? 'Student · day pass' : 'Maker · day pass', persona, look: p.look, plan: persona === 'student' ? 'Student day pass' : 'Day pass', bio: 'Walk-in member.' }
      const c: CastMember = { id: info.id, name: p.name, title: info.title, persona, bio: '', plan: info.plan!, arrive: m, leave: m + rand(180, 420), look: {}, seed }
      this.spawn(info, Math.random() > 0.5 ? POINTS.spawnWest : POINTS.spawnEast, brainFor(persona, c))
    }
    // café public
    if (m >= this.nextPublic && m < 19 * 60 + 15) {
      const hr = m / 60
      const busy = (hr > 8 && hr < 10) || (hr > 12 && hr < 14.5) || (hr > 17 && hr < 19.5)
      this.nextPublic = m + rand(busy ? 6 : 14, busy ? 16 : 32)
      if (this.agents.filter((a) => !a.gone && a.info.role === 'public').length < 9) {
        const seed = Math.floor(Math.random() * 100000)
        const p = randomPerson(seed, 'cafe')
        const info: AgentInfo = { id: `c${seed}`, name: p.name, role: 'public', title: 'Café guest', persona: 'cafe', look: p.look, bio: 'Came for coffee and Wi-Fi.' }
        const c: CastMember = { id: info.id, name: p.name, title: 'Café guest', persona: 'cafe', bio: '', plan: 'Café', arrive: m, leave: m + rand(25, 100), look: {}, seed }
        this.spawn(info, Math.random() > 0.5 ? POINTS.spawnWest : POINTS.spawnEast, brainFor('cafe', c))
      }
    }
    // parts shoppers
    if (m >= this.nextShopper && m < 18 * 60 + 45) {
      this.nextShopper = m + rand(16, 40)
      if (this.agents.filter((a) => !a.gone && a.info.role === 'shopper').length < 3) {
        const seed = Math.floor(Math.random() * 100000)
        const p = randomPerson(seed, 'shopper')
        const info: AgentInfo = { id: `s${seed}`, name: p.name, role: 'shopper', title: 'Parts customer', persona: 'shopper', look: p.look, bio: 'Walked in from the street for parts.' }
        const c: CastMember = { id: info.id, name: p.name, title: 'Parts customer', persona: 'shopper', bio: '', plan: '', arrive: m, leave: m + 30, look: {}, seed }
        this.spawn(info, Math.random() > 0.5 ? POINTS.spawnWest : POINTS.spawnEast, brainFor('shopper', c))
      }
    }
    // Saturday robotics class
    if (this.day % 7 === 5 && m >= 9 * 60 + 40 && !this.spawned.has('kids')) {
      this.spawned.add('kids')
      for (let i = 0; i < 12; i++) {
        const seed = 500 + i * 13 + this.day
        const kid = randomPerson(seed, 'kid')
        const info: AgentInfo = { id: `k${i}`, name: kid.name, role: 'kid', title: 'Robotics Saturday', persona: 'kid', look: kid.look, bio: 'Age 9–13. Building a line-following robot.' }
        const c: CastMember = { id: info.id, name: kid.name, title: '', persona: 'kid', bio: '', plan: '', arrive: m, leave: 12 * 60 + 10, look: {}, seed }
        this.spawn(info, [POINTS.spawnWest[0] - i * 0.6, POINTS.spawnWest[1]], brainFor('kid', c))
        this.earn('training', PRICES.kidsSession, `${kid.name} — Robotics Saturday`, '🤖')
      }
    }
  }

  private planDemo() {
    const s = 18 * 60
    const ids = ['adaeze', 'emeka', 'ngozi', 'femi']
    this.demo.schedule = ids.map((id, i) => ({ id, start: s + 5 + i * 15, end: s + 5 + i * 15 + 12 }))
    this.demo.start = s
    this.demo.end = s + 5 + ids.length * 15
  }

  // ── requests / orders / tickets ──
  requestParts(member: Agent, items: { sku: Sku; qty: number }[], deliverTo: [number, number]) {
    const r: PartsRequest = { id: this.tickId++, member, items, status: 'queued', created: this.minute, deliverTo }
    this.requests.push(r)
    const names = items.map((i) => `${i.qty}× ${i.sku.name}`).join(', ')
    this.emit('📲', `${member.info.name.split(' ')[0]} requested ${names}`, { kind: 'ops' })
    return r
  }

  pickSkus(persona: string): { sku: Sku; qty: number }[] {
    const pool: Record<string, string[]> = {
      hardware: ['esp32s3', 'lora', 'ds18b20', 'bme280', 'resistors', 'caps', 'solar10', 'mosfet'],
      drone: ['motor', 'esc', 'lipo', 'gps', 'mpu6050', 'rp2040'],
      ev: ['mosfet', 'caps', 'resistors', 'esp32s3', 'motor'],
      bio: ['tips', 'agar'],
      student: ['uno', 'rp2040', 'resistors', 'mpu6050', 'esp32s3'],
      designer: ['pla', 'acrylic', 'esp32s3'],
    }
    const ids = pool[persona] ?? pool.hardware
    const n = 1 + Math.floor(Math.random() * 2)
    const out: { sku: Sku; qty: number }[] = []
    for (let i = 0; i < n; i++) {
      const id = ids[Math.floor(Math.random() * ids.length)]
      const sku = this.inventory.find((s) => s.id === id)!
      if (!out.find((o) => o.sku === sku)) out.push({ sku, qty: 1 + Math.floor(Math.random() * 3) })
    }
    return out
  }

  completeRequest(r: PartsRequest) {
    r.status = 'done'
    r.done = this.minute
    this.fetchTimes.push(r.done - r.created)
    let total = 0
    for (const it of r.items) {
      it.sku.stock = Math.max(0, it.sku.stock - it.qty)
      total += it.sku.price * it.qty
      if (it.sku.stock <= it.sku.min) this.emit('🤖', `AI: ${it.sku.name} below ${it.sku.min}. Draft PO sent to supplier for approval.`, { kind: 'ai' })
    }
    this.earn('parts', total, `${r.member.info.name.split(' ')[0]} — parts from the library`, '🔩', r.member)
    r.member.waiting = false
  }

  openTicket(prop: PropInstance, issue: string, guide: string) {
    if (this.tickets.find((t) => t.prop === prop && t.status !== 'done')) return
    prop.state.fault = true
    const t: Ticket = { id: this.tickId++, prop, issue, status: 'open', created: this.minute, guide }
    this.tickets.push(t)
    this.emit('🤖', `AI flagged ${prop.def.info?.name ?? prop.type}: ${issue}`, { kind: 'ai' })
  }

  closeTicket(t: Ticket) {
    t.status = 'done'
    t.done = this.minute
    t.prop.state.fault = false
    this.fixTimes.push(t.done - t.created)
    this.emit('🛠️', `${t.assignee?.info.name.split(' ')[0] ?? 'Staff'} fixed ${t.prop.def.info?.name ?? t.prop.type} with the step-by-step guide`, { kind: 'ops' })
  }

  startPrint(prop: PropInstance, owner: Agent) {
    const dur = rand(80, 220)
    const grams = Math.round(rand(35, 240))
    prop.state.active = true
    prop.state.progress = 0
    prop.state.fault = false
    const job: PrintJob = { prop, owner, start: this.minute, end: this.minute + dur, grams, collected: false }
    this.jobs.push(job)
    this.earn('machines', grams * PRICES.print3dPerGram, `${owner.info.name.split(' ')[0]} — 3D print (${grams} g)`, '🖨️', owner)
    if (Math.random() < 0.12) setTimeout(() => this.openTicket(prop, 'spaghetti detected on camera, job paused', 'Clear the bed, swap the 0.4 mm nozzle (video, 3 min), resume from layer.'), 400)
    return job
  }

  // ── power ──
  private updatePower(dMin: number, elevation: number, overcast: number) {
    const p = this.power
    const m = this.minute
    if (p.grid && m >= p.nextOutage && m < 21 * 60) {
      p.grid = false
      p.outages++
      p.outageEnd = m + rand(25, 110)
      this.emit('⚡', 'Grid power cut. Inverters switched to battery in 18 ms. Nothing stopped.', { kind: 'power' })
      this.onOutage?.(true)
    } else if (!p.grid && m >= p.outageEnd) {
      p.grid = true
      p.nextOutage = m + rand(150, 360)
      this.emit('💡', 'Grid is back ("Up NEPA!"). Battery recharging from solar first.', { kind: 'power' })
      this.onOutage?.(false)
    }
    if (!p.grid) p.outageMin += dMin
    const sun = Math.max(0, Math.sin((Math.max(0, elevation) * Math.PI) / 180))
    p.solarKw = 49.5 * sun * (1 - overcast * 0.7) * 0.82
    const people = this.present.length
    const busyMachines = this.world.props.filter((x) => x.state.active && x.def.info?.machine).length
    const hr = m / 60
    const open = hr > 7 && hr < 22
    p.loadKw = (open ? 7.5 : 2.5) + people * 0.18 + busyMachines * 0.9 + (open && hr > 10 && hr < 18 ? 6 : 2)
    const net = p.solarKw - p.loadKw // kW
    const kwh = (net * dMin) / 60
    const CAP = 200
    if (p.grid) {
      if (net > 0) p.soc = Math.min(0.95, p.soc + kwh / CAP)
      else if (p.soc < 0.6) p.soc = Math.min(0.95, p.soc + (8 * dMin) / 60 / CAP) // slow grid top-up
      p.gen = false
    } else {
      if (p.gen) {
        p.soc = Math.min(0.95, p.soc + ((30 + Math.max(0, net)) * dMin) / 60 / CAP)
        p.genMinutes += dMin
        if (p.soc > 0.6) { p.gen = false; this.emit('🔋', 'Battery back to 60%. Generator off.', { kind: 'power' }) }
      } else {
        p.soc = Math.max(0, p.soc + kwh / CAP)
        if (net < 0) p.dieselSavedL += ((-net * dMin) / 60) * 0.3
        if (p.soc < 0.25) { p.gen = true; this.emit('🛢️', 'Battery at 25% during outage. AI started the generator.', { kind: 'power' }) }
      }
    }
    const genProp = this.world.byId.get('genset')
    if (genProp) genProp.state.active = p.gen
    for (const id of ['inverters', 'battery']) {
      const pr = this.world.byId.get(id)
      if (pr) { pr.state.data.grid = p.grid; pr.state.data.soc = p.soc }
    }
  }

  // ── main update ──
  update(dtReal: number, elevation: number, overcast: number) {
    const speed = this.speed
    let dMin = dtReal * this.minPerSec * speed
    // overnight fast-forward
    const m = this.minute % 1440
    if (speed > 0 && (m > 20 * 60 + 15 || m < 7 * 60 + 30) && this.agents.every((a) => a.gone || a.info.role === 'player')) dMin = dtReal * 90
    const prevDay = Math.floor(this.minute / 1440)
    this.minute += dMin
    if (Math.floor(this.minute / 1440) !== prevDay) this.newDay()
    if (dMin > 0) {
      this.director()
      this.updatePower(dMin, elevation, overcast)
      // print jobs
      for (const j of this.jobs) {
        if (j.collected) continue
        const pr = j.prop
        if (pr.state.fault) { j.end += dMin; continue }
        pr.state.progress = Math.min(1, (this.minute - j.start) / (j.end - j.start))
        if (pr.state.progress >= 1 && pr.state.active) {
          pr.state.active = false
          this.printsDone++
          this.emit('✅', `Print finished for ${j.owner.info.name.split(' ')[0]} (${j.grams} g)`, { kind: 'ops' })
        }
      }
      // hourly occupancy
      const h = Math.floor(this.minute / 60) % 24
      this.occupancyByHour[h] = Math.max(this.occupancyByHour[h], this.inside.length)
      // studio rent accrues daily at opening
      // demo night
      const dm = this.minute % 1440
      const isFri = this.day % 7 === 4
      const wasActive = this.demo.active
      this.demo.active = isFri && dm >= this.demo.start && dm < this.demo.end
      if (this.demo.active && !wasActive) this.emit('🎤', 'Demo Night is starting on the café stage. Free entry.', { kind: 'social' })
      if (!this.demo.active && wasActive) this.emit('👏', 'Demo Night done: 4 teams showed prototypes to 30+ people.', { kind: 'social' })
    }
    if (dMin > 0 && this.player && !this.player.gone) this.onPlayerTick?.(dMin)
    // agents
    const moveDt = dtReal * Math.max(speed, 0)
    for (const a of this.agents) {
      if (a.gone) continue
      if (speed > 0) this.stepAgent(a, dMin, moveDt)
      a.updateVisual(speed > 0 ? dtReal * Math.min(speed, 3) : dtReal * 0.3, dMin)
    }
    // cleanup
    if (this.agents.some((a) => a.gone && a.char.root.parent)) {
      for (const a of this.agents) if (a.gone && a.char.root.parent) {
        a.char.root.parent.remove(a.char.root)
        a.char.root.remove(a.bubble)
        a.char.root.remove(a.tag)
        a.setSelected(false, this.scene)
      }
    }
    this.version++
  }

  // Clear everyone and start a fresh day at the given time (used by play mode)
  reset(day: number, minuteOfDay: number) {
    for (const a of this.agents) {
      a.char.root.parent?.remove(a.char.root)
      a.char.root.remove(a.bubble)
      a.char.root.remove(a.tag)
      a.setSelected(false, this.scene)
      this.release(a)
    }
    Agent.live = 0
    for (const sl of this.world.slots) { sl.occupant = null; sl.reserved = null }
    for (const p of this.world.props) { p.state.active = false; p.state.progress = 0; p.state.fault = false; p.usage = 0 }
    this.agents = []
    this.byId.clear()
    this.requests = []; this.tickets = []; this.orders = []; this.jobs = []
    this.player = null
    this.minute = Math.floor(this.minute / 1440 + 1) * 1440 + minuteOfDay
    this.day = day - 1
    this.newDay()
  }

  private newDay() {
    this.day++
    this.revenue = { passes: 0, members: 0, machines: 0, parts: 0, cafe: 0, studios: 0, lab: 0, training: 0, events: 0 }
    this.ticker = []
    this.revenueByHour.fill(0)
    this.occupancyByHour.fill(0)
    this.checkins = 0
    this.spawned.clear()
    this.genericCount = 0
    this.nextPublic = 8 * 60
    this.nextShopper = 9 * 60
    this.nextGeneric = 8 * 60 + 15
    this.agents = this.agents.filter((a) => !a.gone)
    for (const p of this.world.props) p.usage = 0
    this.earn('studios', (PRICES.studioMonthly * 2) / 30, 'Team studios (daily accrual, 2 leased)', '🔑')
    this.emit('🌅', `${this.dayName}. Doors open at 8am.`, { kind: 'social' })
  }

  // ── agent stepping ──
  private stepAgent(a: Agent, dMin: number, moveDt: number) {
    a.minutesIn += dMin
    const n = a.needs
    n.energy = Math.max(0, n.energy - dMin * 0.0011)
    n.hunger = Math.min(1, n.hunger + dMin * 0.0015)
    n.social = Math.max(0, n.social - dMin * 0.0009)
    n.bladder = Math.min(1, n.bladder + dMin * 0.0016)
    n.focus = Math.max(0, Math.min(1, n.focus + (a.char.anim.startsWith('sit') ? -0.0006 : 0.0004) * dMin))
    let guard = 0
    while (guard++ < 4) {
      if (!a.step) {
        const r = a.brain!.next()
        if (r.done) { a.gone = true; this.release(a); return }
        a.step = r.value
        a.stepT = 0
        a.path = null
        if (a.step.k === 'go') this.release(a)
      }
      const done = this.exec(a, a.step, dMin, moveDt)
      if (!done) break
      a.step = null
      dMin = 0
    }
  }

  release(a: Agent) {
    if (a.slot) {
      if (a.slot.occupant === a.id) a.slot.occupant = null
      a.slot = null
    }
  }

  private exec(a: Agent, s: Step, dMin: number, moveDt: number): boolean {
    switch (s.k) {
      case 'go': {
        if (!a.path) {
          const p = this.world.nav.find(a.x, a.z, s.x, s.z)
          if (!p) {
            a.stuck++
            if (s.slot) s.slot.reserved = null
            return true
          }
          a.path = p
          a.setAnim('walk')
          a.char.upperOverride = s.carry ? 'carry' : null
        }
        let remain = a.speed * moveDt * (s.run ? 1.6 : 1)
        while (remain > 0 && a.path.length) {
          const [tx, tz] = a.path[0]
          const dx = tx - a.x, dz = tz - a.z
          const d = Math.hypot(dx, dz)
          if (d < 1e-4) { a.path.shift(); continue }
          a.rot = Math.atan2(dx, dz)
          if (d <= remain) {
            a.x = tx; a.z = tz
            remain -= d
            a.path.shift()
          } else {
            a.x += (dx / d) * remain
            a.z += (dz / d) * remain
            remain = 0
          }
          a.char.phase += (a.speed * moveDt * (s.run ? 1.6 : 1)) * 5.2 / Math.max(1, a.path.length ? 1 : 1)
        }
        if (a.path.length) return false
        a.char.upperOverride = null
        if (s.slot) {
          a.x = s.slot.wx
          a.z = s.slot.wz
          a.rot = s.slot.wrot
          s.slot.reserved = null
          if (!s.slot.occupant) s.slot.occupant = a.id
          a.slot = s.slot
          a.char.seatY = s.slot.y ?? 0.47
        }
        a.setAnim('idle')
        return true
      }
      case 'act': {
        if (a.stepT === 0) {
          a.setAnim(s.anim)
          a.char.hold(s.held ?? 'none')
          if (s.label) a.doing = s.label
          if (s.prop) { s.prop.state.active = true; s.prop.state.progress = 0 }
        }
        a.stepT += dMin
        // interrupt for demo night
        if (this.demo.active && !a.info.id.startsWith('k') && a.info.role === 'member' && a.doing !== 'Demo Night' && s.min > 5 && !s.prop) a.stepT = s.min
        if (s.prop) {
          s.prop.state.progress = Math.min(1, a.stepT / s.min)
          s.prop.usage += dMin
          if (s.prop.def.info?.machine) this.machineMinutes += dMin
        }
        s.progress?.(Math.min(1, a.stepT / s.min))
        if (a.stepT >= s.min) {
          if (s.prop && s.prop.type !== 'printer3d' && s.prop.type !== 'resinPrinter') { s.prop.state.active = false; s.prop.state.progress = 0 }
          return true
        }
        return false
      }
      case 'wait': {
        if (a.stepT === 0) a.setAnim(s.anim ?? 'idle')
        a.stepT += dMin
        return a.stepT >= s.min
      }
      case 'until': {
        if (a.stepT === 0 && s.anim) a.setAnim(s.anim)
        a.stepT += dMin
        return s.cond() || a.stepT >= (s.maxMin ?? 30)
      }
      case 'face':
        a.rot = Math.atan2(s.x - a.x, s.z - a.z)
        return true
      case 'leave':
        a.gone = true
        this.release(a)
        return true
    }
  }

  slotFor(kind: string, a: Agent, filter?: (s: WorldSlot) => boolean) {
    const s = this.world.freeSlot(kind, [a.x, a.z], filter)
    if (s) s.reserved = a.id
    return s
  }

  subscribe(fn: () => void) {
    this.listeners.add(fn)
    return () => this.listeners.delete(fn)
  }
}
