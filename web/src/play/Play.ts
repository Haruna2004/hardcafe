import { ACTIONS, PROJECTS, PLACES, MORNING_EVENTS, START_MONEY, SKILLS, levelOf, OPEN, CLOSE, type Action, type Skill, type PlaceId, type Gain } from './content'

export interface Recap { day: number; earned: number; spent: number; xp: Partial<Record<Skill, number>>; progress: number; notes: string[] }

export interface PlayState {
  v: 1
  name: string
  look: string
  project: string
  money: number
  energy: number // 0..100
  fed: number // 0..100
  xp: Record<Skill, number>
  unlocks: string[]
  items: string[]
  steps: string[]
  done: string[]
  progress: number
  rep: number
  memberUntil: number
  passDay: number
  day: number
  today: Recap
  history: Recap[]
  grant: number
  raised: number
  ended: boolean
}

export const DAY = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const KEY = 'atoms.play.v1'
const WEEKLY_LIVING = 25000

export type Check = { ok: true } | { ok: false; why: string }

export interface Moment { kind: 'good' | 'bad' | 'info'; text: string; money?: number }

export class Play {
  s: PlayState
  queue: Action[] = []
  current: Action | null = null
  moments: Moment[] = []
  onChange?: () => void
  onPitch?: (ok: boolean) => void

  constructor(init?: Partial<PlayState>) {
    this.s = {
      v: 1, name: 'Ada', look: 'a', project: 'cold', money: START_MONEY, energy: 100, fed: 80,
      xp: { electronics: 0, making: 0, bio: 0, business: 0 }, unlocks: [], items: [], steps: [], done: [],
      progress: 0, rep: 0, memberUntil: -1, passDay: -1, day: 0, today: blank(0), history: [], grant: 0, raised: 0, ended: false,
      ...init,
    }
  }

  static load(): Play | null {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return null
      const s = JSON.parse(raw) as PlayState
      if (s.v !== 1) return null
      return new Play(s)
    } catch { return null }
  }
  save() { try { localStorage.setItem(KEY, JSON.stringify(this.s)) } catch { /* private mode */ } }
  static clear() { try { localStorage.removeItem(KEY) } catch { /* ignore */ } }

  get project() { return PROJECTS.find((p) => p.id === this.s.project)! }
  level(k: Skill) { return levelOf(this.s.xp[k]) }
  get hasAccess() { return this.s.passDay === this.s.day || this.s.memberUntil >= this.s.day }
  get mood(): { label: string; tone: 'good' | 'ok' | 'low' } {
    const s = this.s
    if (s.money < 20000) return { label: 'Sapa', tone: 'low' }
    if (s.energy < 20) return { label: 'Drained', tone: 'low' }
    if (s.fed < 25) return { label: 'Hungry', tone: 'low' }
    if (s.money >= 200000 && s.energy > 60) return { label: 'Soft life', tone: 'good' }
    return { label: 'Focused', tone: 'ok' }
  }

  actionsFor(place: PlaceId): Action[] {
    const proj = this.project.steps.filter((a) => a.place === place)
    const base = ACTIONS.filter((a) => a.place === place && (!a.once || !this.s.done.includes(a.id)))
    return [...proj.filter((a) => !this.s.steps.includes(a.id)), ...base]
  }

  nextStep(): Action | null {
    return this.project.steps.find((a) => !this.s.steps.includes(a.id)) ?? null
  }

  // What the player should do next, in plain words
  goal(): { text: string; place: PlaceId; action?: Action } {
    const s = this.s
    if (!this.hasAccess) return { text: 'Get a day pass at the front desk', place: 'desk', action: ACTIONS.find((a) => a.id === 'pass') }
    if (s.progress >= 100 && !s.done.includes('pitch')) return { text: s.day % 7 === 4 ? 'Pitch at Demo Night, 6pm today' : 'Pitch at Demo Night on Friday', place: 'stage', action: ACTIONS.find((a) => a.id === 'pitch') }
    if (s.unlocks.includes('pitched') && !s.done.includes('investors')) return { text: 'Meet the investors in the boardroom', place: 'boardroom', action: ACTIONS.find((a) => a.id === 'investors') }
    const step = this.nextStep()
    if (!step) return { text: 'Polish your pitch for Friday', place: 'classroom' }
    const c = this.check(step, minuteNow())
    if (!c.ok) {
      if (c.why.startsWith('Needs Electronics')) return { text: 'Level up Electronics in the classroom', place: 'classroom' }
      if (c.why.startsWith('Needs Making')) return { text: 'Level up Making with a CAD class', place: 'classroom' }
      if (c.why.startsWith('Needs Bio')) return { text: 'Level up Bio with a lab class', place: 'classroom' }
      if (c.why.includes('induction')) {
        const p = step.req?.unlock?.[0]
        return { text: 'Do the safety induction first', place: p === 'wet' ? 'wetlab' : p === 'drone' ? 'drone' : p === 'print' ? 'print' : 'fab' }
      }
    }
    return { text: step.label, place: step.place, action: step }
  }

  check(a: Action, minute: number): Check {
    const s = this.s
    const r = a.req ?? {}
    const place = PLACES.find((p) => p.id === a.place)!
    if (minute < OPEN - 10 || minute >= CLOSE) return { ok: false, why: 'Atoms is open 8am to 8pm' }
    if (place.lab && !this.hasAccess && a.id !== 'pass' && a.id !== 'member') return { ok: false, why: 'Get a pass at the front desk' }
    if ((a.id === 'pass' || a.id === 'member') && this.hasAccess && (a.id === 'pass' || s.memberUntil >= s.day)) return { ok: false, why: 'You already have access today' }
    if (r.day && !r.day.includes(s.day % 7)) return { ok: false, why: `Only on ${r.day.map((d) => DAY[d]).join(', ')}` }
    if (r.from !== undefined && minute < r.from) return { ok: false, why: `Opens at ${fmt(r.from)}` }
    if (r.to !== undefined && minute > r.to) return { ok: false, why: `Closed after ${fmt(r.to)}` }
    for (const [k, lvl] of Object.entries(r.skill ?? {})) if (this.level(k as Skill) < (lvl as number)) return { ok: false, why: `Needs ${SKILLS.find((x) => x.id === k)!.name} ${lvl}` }
    for (const u of r.unlock ?? []) if (!s.unlocks.includes(u)) return { ok: false, why: u === 'pitched' ? 'Pitch at Demo Night first' : u === 'print' ? 'Needs the printer walkthrough' : 'Needs the safety induction' }
    for (const it of r.items ?? []) if (!s.items.includes(it)) return { ok: false, why: 'Order the parts first' }
    for (const st of r.steps ?? []) if (!s.steps.includes(st)) return { ok: false, why: `First: ${this.project.steps.find((x) => x.id === st)?.label ?? 'earlier step'}` }
    if (r.progress !== undefined && s.progress < r.progress) return { ok: false, why: r.progress >= 100 ? 'Finish your prototype first' : `Needs a ${r.progress}% built prototype` }
    if (a.cost > s.money) return { ok: false, why: 'Not enough money' }
    if (a.energy > 0 && a.energy > s.energy) return { ok: false, why: 'Too tired. Get a coffee' }
    if (minute + a.minutes > CLOSE + 5 && a.place !== 'street') return { ok: false, why: 'Not enough time before closing' }
    return { ok: true }
  }

  enqueue(a: Action) {
    if (this.current || this.queue.length) return false
    this.queue.push(a)
    this.onChange?.()
    return true
  }

  begin(a: Action) {
    this.current = a
    if (a.cost) this.spend(a.cost)
    this.onChange?.()
  }

  finish(a: Action) {
    const s = this.s
    this.current = null
    s.energy = clamp(s.energy - a.energy, 0, 100)
    if (a.id === 'lunch') s.fed = 100
    if (a.id === 'coffee') s.fed = Math.min(100, s.fed + 10)
    if (a.id === 'pitch') return this.resolvePitch()
    if (a.id === 'investors') return this.resolveInvestors()
    if (a.risk) {
      const [k, need] = Object.entries(a.req?.skill ?? {})[0] ?? ['electronics', 1]
      const margin = this.level(k as Skill) - (need as number)
      const fail = Math.max(0.05, a.risk - 0.12 * margin)
      if (Math.random() < fail) {
        const half: Gain = { xp: Object.fromEntries(Object.entries(a.gain.xp ?? {}).map(([x, v]) => [x, Math.round((v as number) / 2)])) }
        this.applyGain(half)
        this.moments.push({ kind: 'bad', text: `${a.label} did not work this time. You learned something. Try again.` })
        this.save()
        this.onChange?.()
        return
      }
    }
    this.applyGain(a.gain)
    if (a.step) s.steps.push(a.step)
    if (a.once) s.done.push(a.id)
    if (a.gig) this.moments.push({ kind: 'good', text: `Paid for: ${a.label.toLowerCase()}`, money: a.gain.money })
    if (a.step) this.moments.push({ kind: 'good', text: `${this.project.name}: ${s.progress}% built` })
    if (s.progress >= 100 && a.step) this.moments.push({ kind: 'info', text: 'Prototype ready. Pitch at Demo Night on Friday at 6pm.' })
    this.save()
    this.onChange?.()
  }

  applyGain(g: Gain) {
    const s = this.s
    if (g.money) this.earn(g.money)
    if (g.energy) s.energy = clamp(s.energy + g.energy, 0, 100)
    if (g.progress) { s.progress = Math.min(100, s.progress + g.progress); s.today.progress += g.progress }
    if (g.unlock && !s.unlocks.includes(g.unlock)) s.unlocks.push(g.unlock)
    if (g.item && !s.items.includes(g.item)) s.items.push(g.item)
    if (g.member) { s.memberUntil = s.day + g.member - 1 }
    if (g.pass) s.passDay = s.day
    if (g.rep) s.rep += g.rep
    for (const [k, v] of Object.entries(g.xp ?? {})) {
      const before = this.level(k as Skill)
      s.xp[k as Skill] += v as number
      s.today.xp[k as Skill] = (s.today.xp[k as Skill] ?? 0) + (v as number)
      const after = this.level(k as Skill)
      if (after > before) this.moments.push({ kind: 'good', text: `${SKILLS.find((x) => x.id === k)!.name} level ${after}` })
    }
  }

  private resolvePitch() {
    const s = this.s
    const chance = Math.min(0.95, 0.3 + 0.15 * (this.level("business") - 1) + 0.02 * s.rep)
    const ok = Math.random() < chance
    if (ok) {
      const g = this.project.grant
      s.grant = g
      this.earn(g)
      s.unlocks.push('pitched')
      s.done.push('pitch')
      s.rep += 5
      this.moments.push({ kind: 'good', text: `The room loved it. You won a ${fmtN(g)} prototype grant.`, money: g })
    } else {
      this.applyGain({ xp: { business: 60 } })
      this.moments.push({ kind: 'bad', text: 'Tough questions on stage. Sharpen the pitch and try again next Friday.' })
    }
    this.onPitch?.(ok)
    this.save()
    this.onChange?.()
  }

  private resolveInvestors() {
    const s = this.s
    s.done.push('investors')
    s.raised = 15000000
    this.earn(s.raised)
    s.ended = true
    this.moments.push({ kind: 'good', text: 'You raised a ₦15m pre-seed round. Atoms alumni now.', money: s.raised })
    this.save()
    this.onChange?.()
  }

  spend(n: number) { this.s.money -= n; this.s.today.spent += n }
  earn(n: number) { this.s.money += n; this.s.today.earned += n }

  // called each sim minute while the player is in the building
  tick(dMin: number, busy: boolean) {
    const s = this.s
    s.fed = clamp(s.fed - dMin * (5 / 60), 0, 100)
    if (!busy) s.energy = clamp(s.energy - dMin * (1 / 60), 0, 100)
    if (s.fed < 15) s.energy = clamp(s.energy - dMin * (2 / 60), 0, 100)
  }

  endDay(): Recap {
    const s = this.s
    const recap = { ...s.today }
    s.history.push(recap)
    s.day += 1
    if (s.day % 7 === 6) s.day += 1 // Sunday rest
    s.energy = 100
    s.fed = 80
    s.today = blank(s.day)
    const notes: string[] = []
    if (s.day % 7 === 0) { this.spend(WEEKLY_LIVING); notes.push(`Rent and transport this week: ${fmtN(WEEKLY_LIVING)}`) }
    const ev = MORNING_EVENTS[(s.day * 7 + s.project.length) % MORNING_EVENTS.length]
    notes.push(ev.text)
    if (ev.gain) this.applyGain(ev.gain)
    s.today.notes = notes
    this.save()
    return recap
  }

  commute(kind: 'walk' | 'danfo' | 'bolt') {
    const s = this.s
    if (kind === 'danfo') { this.spend(500); s.energy = clamp(s.energy - 8, 0, 100) }
    if (kind === 'walk') s.energy = clamp(s.energy - 15, 0, 100)
    if (kind === 'bolt') this.spend(4500)
    this.save()
    this.onChange?.()
  }
}

function blank(day: number): Recap { return { day, earned: 0, spent: 0, xp: {}, progress: 0, notes: [] } }
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
export const fmt = (m: number) => { const h = Math.floor(m / 60), n = Math.floor(m % 60); return `${h % 12 === 0 ? 12 : h % 12}:${String(n).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'}` }
export const fmtN = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG')
let nowFn: () => number = () => 9 * 60
export function setMinuteSource(f: () => number) { nowFn = f }
export const minuteNow = () => nowFn()
