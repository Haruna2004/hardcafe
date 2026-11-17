import { create } from 'zustand'
import type { Game } from '../engine/Game'
import type { Ticker } from '../sim/Sim'
import type { Stream } from '../data/pricing'
import { ROOM_BY_ID } from '../data/layout'
import { TEAMS } from '../data/cast'

export interface SelView {
  kind: 'agent' | 'prop' | 'room'
  id: string
  title: string
  subtitle: string
  body?: string
  accent?: string
  rows: [string, string][]
  needs?: [string, number][]
  doing?: string
  progress?: number
  log?: { t: number; text: string }[]
  team?: { name: string; sector: string; pitch: string; color: string }
  status?: { label: string; tone: 'ok' | 'busy' | 'warn' | 'idle' }
}

export interface Snap {
  time: string
  day: string
  minute: number
  speedIdx: number
  walls: string
  grid: boolean
  soc: number
  solar: number
  load: number
  gen: boolean
  outages: number
  people: number
  staff: number
  checkins: number
  revenue: Record<Stream, number>
  total: number
  byHour: number[]
  occHour: number[]
  ticker: Ticker[]
  reqOpen: number
  reqDone: number
  avgFetch: number
  ticketsOpen: number
  ticketsDone: number
  avgFix: number
  printsActive: number
  printsDone: number
  machinesActive: number
  machinesTotal: number
  benchUsed: number
  benchTotal: number
  demo: boolean
  lowStock: { name: string; stock: number; min: number }[]
  queue: { who: string; what: string; state: string }[]
}

interface UIState {
  ready: boolean
  mode: 'intro' | 'tour' | 'live'
  tourIndex: number
  autoplay: boolean
  dashboard: boolean
  labels: boolean
  plan: boolean
  snap: Snap | null
  sel: SelView | null
  game: Game | null
  set: (p: Partial<UIState>) => void
  fromGame: (g: Game, force: boolean) => void
}

const fmtMin = (m: number) => {
  const mm = Math.floor(m) % 1440
  const h = Math.floor(mm / 60), n = mm % 60
  return `${h % 12 === 0 ? 12 : h % 12}:${String(n).padStart(2, '0')}${h >= 12 ? 'pm' : 'am'}`
}

export const useUI = create<UIState>((set, get) => ({
  ready: false,
  mode: 'intro',
  tourIndex: 0,
  autoplay: true,
  dashboard: false,
  labels: true,
  plan: false,
  snap: null,
  sel: null,
  game: null,
  set: (p) => set(p),
  fromGame: (g) => {
    const s = g.sim
    const avg = (a: number[]) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0)
    const machines = g.world.props.filter((p) => p.def.info?.machine)
    const bench = g.world.slots.filter((x) => x.kind === 'benchSeat')
    const snap: Snap = {
      time: s.clock,
      day: s.dayName,
      minute: s.minute % 1440,
      speedIdx: s.speedIdx,
      walls: g.world.building.mode,
      grid: s.power.grid,
      soc: s.power.soc,
      solar: s.power.solarKw,
      load: s.power.loadKw,
      gen: s.power.gen,
      outages: s.power.outages,
      people: s.inside.length,
      staff: s.agents.filter((a) => !a.gone && a.info.role === 'staff').length,
      checkins: s.checkins,
      revenue: { ...s.revenue },
      total: s.totalToday,
      byHour: [...s.revenueByHour],
      occHour: [...s.occupancyByHour],
      ticker: s.ticker.slice(0, 40),
      reqOpen: s.requests.filter((r) => r.status !== 'done').length,
      reqDone: s.requests.filter((r) => r.status === 'done').length,
      avgFetch: avg(s.fetchTimes),
      ticketsOpen: s.tickets.filter((t) => t.status !== 'done').length,
      ticketsDone: s.tickets.filter((t) => t.status === 'done').length,
      avgFix: avg(s.fixTimes),
      printsActive: s.jobs.filter((j) => j.prop.state.active).length,
      printsDone: s.printsDone,
      machinesActive: machines.filter((p) => p.state.active).length,
      machinesTotal: machines.length,
      benchUsed: bench.filter((x) => x.occupant).length,
      benchTotal: bench.length,
      demo: s.demo.active,
      lowStock: s.inventory.filter((x) => x.stock <= x.min).map((x) => ({ name: x.name, stock: x.stock, min: x.min })),
      queue: [
        ...s.requests.filter((r) => r.status !== 'done').map((r) => ({ who: r.assignee?.info.name.split(' ')[0] ?? 'Unassigned', what: `${r.items.map((i) => i.sku.name).join(', ')} → ${r.member.info.name.split(' ')[0]}`, state: r.status })),
        ...s.tickets.filter((t) => t.status !== 'done').map((t) => ({ who: t.assignee?.info.name.split(' ')[0] ?? 'Unassigned', what: `${t.prop.def.info?.name}: ${t.issue}`, state: t.status })),
      ].slice(0, 6),
    }
    let sel: SelView | null = null
    const cur = g.selection
    if (cur?.kind === 'agent') {
      const a = s.byId.get(cur.id)
      if (a && !a.gone) {
        const team = a.info.team ? TEAMS[a.info.team] : undefined
        sel = {
          kind: 'agent', id: a.id, title: a.info.name, subtitle: a.info.title, body: a.info.bio, team,
          doing: a.doing,
          rows: [
            ['Plan', a.info.plan ?? '—'],
            ...(a.info.project ? [['Working on', a.info.project] as [string, string]] : []),
            ['In since', fmtMin(a.arrivedAt)],
            ['Spent today', '₦' + Math.round(a.spentToday).toLocaleString('en-NG')],
          ],
          needs: a.info.role === 'staff' ? undefined : [['Energy', a.needs.energy], ['Fed', 1 - a.needs.hunger], ['Social', a.needs.social], ['Focus', a.needs.focus]],
          progress: a.info.role === 'member' ? a.progress : undefined,
          log: a.log.slice(0, 5),
        }
      } else g.selection = null
    } else if (cur?.kind === 'prop') {
      const p = g.world.byId.get(cur.id)
      if (p?.def.info) {
        const st = p.state
        const status: SelView['status'] = st.fault ? { label: 'Needs attention (AI ticket open)', tone: 'warn' } : st.active ? { label: 'In use', tone: 'busy' } : st.progress >= 1 ? { label: 'Job done, awaiting pickup', tone: 'ok' } : { label: 'Available', tone: 'idle' }
        sel = {
          kind: 'prop', id: p.id, title: p.def.info.name, subtitle: p.def.info.category, body: p.def.info.desc, status,
          rows: [
            ...(p.def.info.priceUSD ? [['Est. cost', `$${p.def.info.priceUSD.toLocaleString()} (≈₦${Math.round((p.def.info.priceUSD * 1354) / 1e6 * 10) / 10}m)`] as [string, string]] : []),
            ['Zone', ROOM_BY_ID[p.zone]?.name ?? p.zone],
            ['Used today', `${Math.round(p.usage)} min`],
          ],
          progress: st.active ? st.progress : undefined,
        }
      }
    } else if (cur?.kind === 'room') {
      const r = ROOM_BY_ID[cur.id]
      if (r) {
        const people = s.agents.filter((a) => !a.gone && a.x >= r.rect.x && a.x <= r.rect.x + r.rect.w && a.z >= r.rect.z && a.z <= r.rect.z + r.rect.d).length
        sel = {
          kind: 'room', id: r.id, title: r.name, subtitle: `${(r.rect.w * r.rect.d).toFixed(0)} m² · ${r.access} access`, body: r.blurb, accent: r.accent,
          rows: [['People here now', String(people)], ...(r.capacity ? [['Capacity', String(r.capacity)] as [string, string]] : [])],
        }
      }
    }
    set({ snap, sel, game: g })
    void get
  },
}))
