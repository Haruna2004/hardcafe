import type { Sim } from './Sim'
import type { Agent, Step } from './Agent'
import type { CastMember, Persona } from '../data/cast'
import { TEAMS } from '../data/cast'
import { POINTS } from '../data/layout'
import { PRICES } from '../data/pricing'
import type { WorldSlot } from '../world/props'
import type { AnimName } from '../world/props/common'
import { roomAt } from '../data/layout'

type Brain = Generator<Step, void, unknown>
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const first = (a: Agent) => a.info.name.replace(/^(Dr\.|Engr\.)\s*/, '').split(' ')[0]

const LINES = {
  arrive: ['Good morning o!', 'How far, Bola?', 'Morning! Light dey?', 'Oya, today we ship.', 'Traffic for Third Mainland no easy 😮‍💨'],
  solder: ['This joint no clean. Again.', 'Who get flux?', 'E don work!! 🎉', 'Abeg nobody touch my scope settings', 'Oya, continuity test…'],
  thanks: ['Thanks Musa, you too fast!', 'Ah, na exactly this one. Thank you!', 'Correct! Thanks o', 'You be legend 🙌'],
  coffee: ['One cappuccino abeg', 'Kemi, the usual!', 'Make it strong today', 'Chapman please, cold'],
  lunch: ['Jollof time 🍛', 'Abeg, extra plantain', 'I deserve this one'],
  chat: ['How did the field test go?', 'Your PCB don come back?', 'Try a 10k pull-up there', 'Show me the enclosure!', 'Investor call went well 👀'],
  print: ['Printing the enclosure, v3', 'Overnight print loading…', 'PLA or PETG? PETG for the sun.'],
  laser: ['Cutting the acrylic lid', 'Engraving the logo'],
  cnc: ['Cutting the frame plates', 'Spindle on. Ear defenders on.'],
  drone: ['Hover test. Fingers crossed 🤞', 'PID still dey wobble small', 'Stable! Stable!!'],
  wet: ['Gloves on, coat on.', 'Plates into the incubator', 'Running the PCR now'],
  bye: ['See you tomorrow!', 'Off to beat traffic', 'Bye Bola!'],
}

function* go(a: Agent, x: number, z: number, carry = false): Brain {
  yield { k: 'go', x, z, carry }
}

function* goSlot(s: Sim, a: Agent, slot: WorldSlot | null): Generator<Step, boolean, unknown> {
  if (!slot) return false
  slot.reserved = a.id
  yield { k: 'go', x: slot.wx, z: slot.wz, slot }
  return a.slot === slot
}

function* use(s: Sim, a: Agent, slot: WorldSlot | null, min: number, label: string, anim?: AnimName, machine = false): Brain {
  const ok = yield* goSlot(s, a, slot)
  if (!ok || !slot) { yield { k: 'wait', min: 2 }; return }
  yield { k: 'act', anim: anim ?? slot.anim, min, prop: machine ? slot.prop : null, label }
}

function* arrive(s: Sim, a: Agent, payable: () => void): Brain {
  a.doing = 'Arriving'
  yield* go(a, POINTS.entrance[0] + rand(-0.6, 0.6), POINTS.entrance[1])
  yield* go(a, POINTS.entranceIn[0], POINTS.entranceIn[1])
  const kiosk = s.world.slots.find((x) => x.kind === 'kiosk')!
  if (kiosk.occupant) yield { k: 'until', cond: () => !kiosk.occupant, anim: 'idle', maxMin: 3 }
  yield* goSlot(s, a, kiosk)
  yield { k: 'act', anim: 'standUse', min: 1, label: 'Checking in' }
  payable()
  s.checkins++
  a.checkedIn = true
  if (Math.random() < 0.12) a.say(pick(LINES.arrive), 3)
  const host = s.byId.get('bola')
  if (host && !host.gone && Math.random() < 0.15) host.say(`Welcome, ${first(a)}!`, 2.5)
  yield* go(a, POINTS.gateIn[0], POINTS.gateIn[1])
}

function* depart(s: Sim, a: Agent, viaGate = true): Brain {
  a.doing = 'Heading home'
  if (a.char.look.labCoat) { a.char.look.labCoat = false; a.char.setLook(a.char.look) }
  if (Math.random() < 0.4) a.say(pick(LINES.bye), 3)
  const room = roomAt(a.x, a.z)
  if (viaGate && room && room.id !== 'cafe' && room.id !== 'parts' && room.id !== 'classroom') yield* go(a, POINTS.gateOut[0], POINTS.gateOut[1])
  yield* go(a, POINTS.entrance[0], POINTS.entrance[1] + 0.4)
  const out = Math.random() > 0.5 ? POINTS.spawnWest : POINTS.spawnEast
  if (Math.random() < 0.3) yield* go(a, 20.6, 29.9) // bus stop
  else yield* go(a, out[0], out[1] + rand(-0.4, 0.4))
  yield { k: 'leave' }
}

// ── shared activities ──
function* coffee(s: Sim, a: Agent, item: 'coffee' | 'jollof' | 'snack' = 'coffee', sitInCafe = true): Brain {
  const slot = s.slotFor('barOrder', a)
  if (!slot) { yield { k: 'wait', min: 3 }; return }
  a.doing = item === 'jollof' ? 'Getting lunch' : 'Getting coffee'
  yield* goSlot(s, a, slot)
  const order = { id: Date.now(), agent: a, item, served: false }
  s.orders.push(order)
  if (Math.random() < 0.5) a.say(item === 'jollof' ? pick(LINES.lunch) : pick(LINES.coffee), 3)
  yield { k: 'until', cond: () => order.served, anim: 'idle', maxMin: 8 }
  const price = item === 'jollof' ? PRICES.jollof : item === 'snack' ? PRICES.snack : PRICES.coffee
  s.earn('cafe', price, `${first(a)} — ${item === 'jollof' ? 'jollof + chicken' : item === 'snack' ? 'meat pie' : 'coffee'}`, item === 'jollof' ? '🍛' : '☕', a)
  if (item === 'coffee') a.needs.energy = Math.min(1, a.needs.energy + 0.4)
  else { a.needs.hunger = 0.05; a.needs.energy = Math.min(1, a.needs.energy + 0.15) }
  const held = item === 'jollof' ? 'plate' : 'cup'
  a.char.hold(held)
  if (sitInCafe || !a.homeSlot) {
    const seat = s.slotFor(Math.random() < 0.5 ? 'cafeSeat' : 'windowSeat', a) ?? s.slotFor('cafeSeat', a) ?? s.slotFor('sofa', a)
    if (seat) {
      yield* goSlot(s, a, seat)
      yield { k: 'act', anim: item === 'jollof' ? 'sitEat' : 'sitDrink', min: item === 'jollof' ? rand(18, 28) : rand(8, 16), held, label: item === 'jollof' ? 'Eating jollof' : 'Coffee break' }
    }
  }
  a.char.hold('none')
}

function* restroom(s: Sim, a: Agent): Brain {
  a.doing = 'Restroom'
  yield* go(a, POINTS.wcDoor[0], POINTS.wcDoor[1])
  const wc = s.world.slots.find((x) => x.kind === 'wc')
  if (wc) yield* go(a, wc.wx, wc.wz)
  yield { k: 'wait', min: rand(2, 4) }
  a.needs.bladder = 0
  yield* go(a, POINTS.wcDoor[0], POINTS.wcDoor[1])
}

function* chat(s: Sim, a: Agent): Brain {
  const others = s.agents.filter((o) => o !== a && !o.gone && o.checkedIn && o.info.role === 'member' && o.slot && Math.hypot(o.x - a.x, o.z - a.z) < 18)
  if (!others.length) { yield { k: 'wait', min: 2 }; return }
  const o = pick(others)
  a.doing = `Chatting with ${first(o)}`
  const ang = o.rot + Math.PI / 2 * (Math.random() > 0.5 ? 1 : -1)
  let tx = o.x + Math.sin(ang) * 0.8, tz = o.z + Math.cos(ang) * 0.8
  if (!s.world.nav.walkableAt(tx, tz)) { tx = o.x + Math.sin(o.rot + Math.PI) * 0.9; tz = o.z + Math.cos(o.rot + Math.PI) * 0.9 }
  yield* go(a, tx, tz)
  yield { k: 'face', x: o.x, z: o.z }
  a.say(pick(LINES.chat), 3.5)
  o.char.upperOverride = o.isSeated() ? null : 'talk'
  if (o.isSeated()) { o.char.anim = 'sitTalk' }
  yield { k: 'act', anim: 'talk', min: rand(5, 10), label: `Chatting with ${first(o)}` }
  o.char.upperOverride = null
  if (o.slot) o.char.anim = o.slot.anim
  a.needs.social = Math.min(1, a.needs.social + 0.45)
  o.needs.social = Math.min(1, o.needs.social + 0.3)
}

function* homeWork(s: Sim, a: Agent, anim: AnimName, minA: number, minB: number, label: string): Brain {
  let seat = a.homeSlot
  if (!seat || (seat.occupant && seat.occupant !== a.id) || (seat.reserved && seat.reserved !== a.id)) {
    seat = s.slotFor('benchSeat', a)
    if (seat) a.homeSlot = seat
  }
  if (!seat) { yield { k: 'wait', min: 3 }; return }
  yield* goSlot(s, a, seat)
  if (Math.random() < 0.05) a.say(pick(LINES.solder), 3)
  yield { k: 'act', anim, min: rand(minA, minB), label, progress: () => { a.progress = Math.min(1, a.progress + 0.0004) } }
}

function* requestParts(s: Sim, a: Agent): Brain {
  const items = s.pickSkus(a.info.persona)
  if (!items.length) return
  const atSeat = a.homeSlot
  if (atSeat && Math.random() < 0.7) {
    yield* goSlot(s, a, atSeat)
    a.doing = 'Ordering parts in the app'
    yield { k: 'act', anim: 'sitType', min: 1.5, held: 'phone', label: 'Ordering parts in the app' }
    a.waiting = true
    const req = s.requestParts(a, items, [atSeat.wx, atSeat.wz])
    yield { k: 'act', anim: atSeat.anim, min: 2, label: 'Working (parts on the way)' }
    yield { k: 'until', cond: () => req.status === 'done', anim: atSeat.anim, maxMin: 45 }
    if (req.status === 'done') a.say(pick(LINES.thanks), 3)
  } else {
    a.doing = 'Getting parts at the counter'
    yield* go(a, POINTS.libCounterOut[0], POINTS.libCounterOut[1])
    yield { k: 'face', x: POINTS.libCounterIn[0], z: POINTS.libCounterIn[1] }
    a.waiting = true
    const req = s.requestParts(a, items, [POINTS.libCounterOut[0], POINTS.libCounterOut[1]])
    yield { k: 'until', cond: () => req.status === 'done', anim: 'idle', maxMin: 30 }
    if (req.status === 'done') a.say(pick(LINES.thanks), 3)
  }
  a.waiting = false
}

function* print3d(s: Sim, a: Agent): Brain {
  // collect a finished job first
  const mine = s.jobs.find((j) => j.owner === a && !j.collected && j.prop.state.progress >= 1)
  if (mine) {
    const slot = mine.prop.slots[0]
    a.doing = 'Collecting a print'
    yield* go(a, slot.wx, slot.wz)
    yield { k: 'face', x: mine.prop.x, z: mine.prop.z }
    yield { k: 'act', anim: 'reach', min: 2, label: 'Collecting a print' }
    mine.collected = true
    mine.prop.state.progress = 0
    a.char.hold('box')
    a.say('Clean print 👌', 2.5)
    return
  }
  if (s.jobs.some((j) => j.owner === a && !j.collected)) return
  const slot = s.slotFor('printer', a, (x) => !x.prop.state.active && x.prop.state.progress === 0 && !x.prop.state.fault)
  if (!slot) return
  if (Math.random() < 0.1) a.say(pick(LINES.print), 3)
  yield* use(s, a, slot, 3, 'Starting a 3D print', 'standUse')
  s.startPrint(slot.prop, a)
}

function* machine(s: Sim, a: Agent, kind: string, minA: number, minB: number, label: string, priceFn: (min: number) => number, lines?: string[]): Brain {
  const slot = s.slotFor(kind, a, (x) => !x.prop.state.fault)
  if (!slot) return
  if (lines && Math.random() < 0.5) a.say(pick(lines), 3)
  const min = rand(minA, minB)
  yield* use(s, a, slot, min, label, undefined, true)
  if (a.slot === slot) {
    s.earn('machines', priceFn(min), `${first(a)} — ${label.toLowerCase()}`, kind === 'laser' ? '🔥' : '⚙️', a)
    if (Math.random() < 0.08) s.openTicket(slot.prop, kind === 'laser' ? 'lens power down 18%. Clean optics' : 'spindle vibration above baseline', kind === 'laser' ? 'Wipe lens + mirror 2 with IPA (photo guide, 6 steps).' : 'Check collet tightness, re-seat bit (video, 4 min).')
  }
}

function* droneTest(s: Sim, a: Agent): Brain {
  const cage = s.world.byId.get('cage')!
  if (cage.state.active) return
  const table = s.world.slots.find((x) => x.kind === 'droneTable')!
  yield* use(s, a, table.occupant ? null : table, rand(6, 10), 'Prepping drone + LiPo check', 'standUse')
  const pilot = s.world.slots.find((x) => x.kind === 'dronePilot')!
  if (pilot.occupant || cage.state.active) return
  yield* goSlot(s, a, pilot)
  a.say(pick(LINES.drone), 3)
  const min = rand(12, 20)
  yield { k: 'act', anim: 'phone', min, prop: cage, held: 'controller', label: 'Test flight in the cage' }
  a.char.hold('none')
  s.earn('machines', (min / 60) * PRICES.droneCagePerHour, `${first(a)} — drone cage`, '🛸', a)
}

function* wetlab(s: Sim, a: Agent, steps = 3): Brain {
  a.doing = 'Gowning up for the wet lab'
  yield* go(a, 8.2, 9.6)
  yield* go(a, 9.0, 8.25)
  yield { k: 'act', anim: 'reach', min: 1, label: 'Putting on lab coat' }
  a.char.look.labCoat = true
  a.char.setLook(a.char.look)
  if (a.info.plan?.includes('day pass')) s.earn('lab', PRICES.wetBenchDay, `${first(a)} — wet-lab bench day`, '🧪', a)
  if (Math.random() < 0.5) a.say(pick(LINES.wet), 3)
  const menu: [string, number, number, string][] = [
    ['labIsland', 18, 35, 'Pipetting samples'], ['bsc', 15, 30, 'Sterile work in the biosafety cabinet'], ['centrifuge', 6, 10, 'Spinning samples'],
    ['pcr', 4, 6, 'Starting a PCR run'], ['microscope', 10, 18, 'Reading slides'], ['hood', 12, 22, 'Prep in the fume hood'], ['incubator', 2, 4, 'Plates into the incubator'], ['labBench', 12, 25, 'Bench work'],
  ]
  for (let i = 0; i < steps; i++) {
    const [kind, mA, mB, label] = pick(menu)
    const slot = s.slotFor(kind, a)
    if (!slot) continue
    yield* use(s, a, slot, rand(mA, mB), label, undefined, ['centrifuge', 'pcr', 'bsc', 'hood'].includes(kind))
    a.progress = Math.min(1, a.progress + 0.01)
  }
  const sink = s.world.slots.find((x) => x.kind === 'sink')!
  yield* use(s, a, sink.occupant ? null : sink, 2, 'Washing hands', 'standUse')
  yield* go(a, 9.0, 8.25)
  yield { k: 'act', anim: 'reach', min: 0.6, label: 'Hanging up lab coat' }
  a.char.look.labCoat = false
  a.char.setLook(a.char.look)
}

function* teamMeeting(s: Sim, a: Agent): Brain {
  const team = a.info.team
  if (!team) return
  const table = team === 'coldchain' ? 'stA' : team === 'skyfarm' ? 'stB' : 'board'
  const seat = s.slotFor(table === 'board' ? 'meetingSeat' : 'studioSeat', a, (x) => x.prop.id === table)
  if (!seat) return
  for (const o of s.agents) if (o !== a && !o.gone && o.info.team === team && o.checkedIn) o.inbox.push(`meet:${table}`)
  yield* goSlot(s, a, seat)
  a.say(`${TEAMS[team]?.name ?? 'Team'} stand-up!`, 2.5)
  yield { k: 'act', anim: 'sitTalk', min: rand(20, 35), label: `${TEAMS[team]?.name ?? 'Team'} meeting` }
  a.needs.social = 1
}

function* joinMeeting(s: Sim, a: Agent, table: string): Brain {
  const seat = s.slotFor(table === 'board' ? 'meetingSeat' : 'studioSeat', a, (x) => x.prop.id === table)
  if (!seat) return
  yield* goSlot(s, a, seat)
  yield { k: 'act', anim: 'sitTalk', min: rand(15, 25), label: 'Team meeting' }
  a.needs.social = 1
}

function* demoNight(s: Sim, a: Agent): Brain {
  a.doing = 'Demo Night'
  const slotP = s.world.slots.find((x) => x.kind === 'presenter')!
  const mineIdx = s.demo.schedule.find((x) => x.id === a.id)
  while (s.demo.active) {
    const now = s.minute % 1440
    if (mineIdx && now >= mineIdx.start && now < mineIdx.end) {
      yield* go(a, slotP.wx, slotP.wz)
      a.rot = slotP.wrot
      a.say(`Hi everyone, I'm ${first(a)} from ${TEAMS[a.info.team ?? '']?.name ?? 'the lab'}!`, 4)
      yield { k: 'until', cond: () => s.minute % 1440 >= mineIdx.end || !s.demo.active, anim: 'present', maxMin: 20 }
      a.say('Thank you! 🙏', 2.5)
      for (const o of s.agents) if (!o.gone && o.doing === 'Demo Night' && o !== a && Math.random() < 0.6) o.say(pick(['👏👏👏', 'Ehen!!', 'Brilliant!', '🔥🔥']), 2)
      continue
    }
    const seat = s.slotFor('audience', a) ?? s.slotFor('cafeSeat', a) ?? s.slotFor('windowSeat', a)
    if (!seat) { yield { k: 'wait', min: 3, anim: 'clap' }; continue }
    yield* goSlot(s, a, seat)
    if (seat.kind === 'audience') a.rot = Math.atan2(slotP.wx - a.x, slotP.wz - a.z)
    const next = s.demo.schedule.find((x) => x.start > s.minute % 1440)
    const until = mineIdx && mineIdx.start > s.minute % 1440 ? mineIdx.start : next ? next.start + 10 : s.demo.end
    yield { k: 'until', cond: () => s.minute % 1440 >= until || !s.demo.active, anim: seat.kind === 'audience' ? 'idle' : seat.anim, maxMin: 30 }
    if (seat.kind === 'audience') yield { k: 'act', anim: 'clap', min: 1.2, label: 'Demo Night' }
  }
}

function* mentorRounds(s: Sim, a: Agent): Brain {
  const seated = s.agents.filter((o) => o !== a && !o.gone && o.info.role === 'member' && o.slot && (o.slot.kind === 'benchSeat' || o.slot.kind === 'cadSeat' || o.slot.kind === 'studioSeat'))
  if (!seated.length) { yield { k: 'wait', min: 4, anim: 'idle' }; return }
  const o = pick(seated)
  a.doing = `Helping ${first(o)}`
  const tx = o.x + Math.sin(o.rot + Math.PI / 2) * 0.75, tz = o.z + Math.cos(o.rot + Math.PI / 2) * 0.75
  yield* go(a, s.world.nav.walkableAt(tx, tz) ? tx : o.x - Math.sin(o.rot) * 0.9, s.world.nav.walkableAt(tx, tz) ? tz : o.z - Math.cos(o.rot) * 0.9)
  yield { k: 'face', x: o.x, z: o.z }
  a.say(pick(['Show me the schematic', 'Check your ground plane', 'Try decoupling caps there', 'Nice! Now test it in the heat', 'What does the scope say?']), 3)
  yield { k: 'act', anim: Math.random() < 0.5 ? 'talk' : 'think', min: rand(6, 14), label: `Helping ${first(o)}` }
  o.progress = Math.min(1, o.progress + 0.03)
}

// ── persona brains ──
function choose(s: Sim, a: Agent, opts: [number, () => Brain][]): Brain {
  let total = 0
  for (const [w] of opts) total += Math.max(0, w)
  let r = Math.random() * total
  for (const [w, f] of opts) {
    r -= Math.max(0, w)
    if (r <= 0) return f()
  }
  return opts[0][1]()
}

function memberBrain(c: CastMember) {
  return function* (s: Sim, a: Agent): Brain {
    const p = a.info.plan ?? ''
    yield* arrive(s, a, () => {
      if (p.includes('Student day')) s.earn('passes', PRICES.studentDay, `${first(a)} — student day pass`, '🎟️', a)
      else if (p === 'Day pass') s.earn('passes', PRICES.dayPass, `${first(a)} — day pass`, '🎟️', a)
      else if (p.includes('Miva')) s.earn('training', 6000, `${first(a)} — Miva practical session (sponsored)`, '🎓', a)
      else s.emit('🎟️', `${first(a)} checked in (${p})`, { kind: 'social' })
    })
    const persona = a.info.persona as Persona
    if (['hardware', 'student', 'ev', 'designer', 'drone'].includes(persona)) a.homeSlot = s.slotFor('benchSeat', a)
    if (a.homeSlot) a.homeSlot.reserved = null
    let leave = c.leave + rand(-20, 20)
    if (s.day % 7 === 4 && (a.info.team || Math.random() < 0.6)) leave = Math.max(leave, s.demo.end + rand(5, 30))
    let n = 0
    while (s.minute % 1440 < leave || (s.demo.active && a.info.team)) {
      n++
      const hr = (s.minute % 1440) / 60
      if (s.demo.active && hr < 20) { yield* demoNight(s, a); continue }
      const meet = a.inbox.find((m) => m.startsWith('meet:'))
      if (meet) { a.inbox = a.inbox.filter((m) => m !== meet); yield* joinMeeting(s, a, meet.slice(5)); continue }
      const N = a.needs
      const lunchTime = hr > 12.3 && hr < 14.5 && N.hunger > 0.45
      const w = (x: number) => x
      const opts: [number, () => Brain][] = [
        [lunchTime ? 9 : 0, () => coffee(s, a, Math.random() < 0.8 ? 'jollof' : 'snack')],
        [N.energy < 0.45 ? 5 : 0.4, () => coffee(s, a, 'coffee', Math.random() < 0.5)],
        [N.bladder > 0.75 ? 8 : 0, () => restroom(s, a)],
        [N.social < 0.35 ? 3 : 0.6, () => chat(s, a)],
      ]
      switch (persona) {
        case 'hardware':
          opts.push([w(5), () => homeWork(s, a, Math.random() < 0.6 ? 'sitSolder' : 'sitType', 30, 70, pick(['Soldering the sensor board', 'Debugging firmware', 'Testing the LoRa link', 'Probing with the scope']))])
          opts.push([n < 3 ? 3 : 1.4, () => requestParts(s, a)])
          opts.push([1.6, () => print3d(s, a)])
          opts.push([0.8, () => machine(s, a, 'desktopCnc', 25, 45, 'Milling a PCB', () => PRICES.pcbMillPerBoard)])
          opts.push([0.7, () => machine(s, a, 'pcb', 20, 35, 'Assembling boards on the SMT line', () => PRICES.smtPerBoard * 4)])
          opts.push([0.8, () => use(s, a, s.slotFor('cadSeat', a), rand(25, 50), 'Laying out the PCB')])
          opts.push([a.info.team && hr > 9.5 && hr < 16 ? 1.2 : 0, () => teamMeeting(s, a)])
          break
        case 'drone':
          opts.push([3, () => homeWork(s, a, 'sitSolder', 25, 55, pick(['Wiring the flight controller', 'Tuning the gimbal', 'Swapping ESCs']))])
          opts.push([3, () => droneTest(s, a)])
          opts.push([1, () => machine(s, a, 'cnc', 25, 50, 'Cutting carbon frame plates', (m) => (m / 60) * PRICES.cncPerHour, LINES.cnc)])
          opts.push([1, () => print3d(s, a)])
          opts.push([1.2, () => requestParts(s, a)])
          opts.push([1, () => use(s, a, s.slotFor('studioSeat', a, (x) => x.prop.id === 'stB'), rand(25, 45), 'Training the vision model', 'sitType')])
          opts.push([hr > 9.5 && hr < 16 ? 1 : 0, () => teamMeeting(s, a)])
          break
        case 'ev':
          opts.push([3, () => use(s, a, s.slotFor('workbench', a), rand(30, 55), 'Fitting the motor mount', 'standUse')])
          opts.push([2, () => machine(s, a, 'cnc', 30, 55, 'Cutting aluminium brackets', (m) => (m / 60) * PRICES.cncPerHour, LINES.cnc)])
          opts.push([2, () => homeWork(s, a, 'sitSolder', 30, 60, 'Building the motor controller')])
          opts.push([0.8, () => machine(s, a, 'bandsaw', 8, 15, 'Cutting stock on the bandsaw', () => 2000)])
          opts.push([0.8, () => machine(s, a, 'drill', 6, 12, 'Drilling mounting holes', () => 1500)])
          opts.push([1, () => requestParts(s, a)])
          opts.push([0.8, () => use(s, a, s.slotFor('assembly', a), rand(20, 40), 'Assembling the battery pack', 'sitSolder')])
          break
        case 'bio':
          opts.push([6, () => wetlab(s, a, 2 + Math.floor(Math.random() * 3))])
          opts.push([1, () => use(s, a, s.slotFor('cadSeat', a), rand(20, 40), 'Writing up results', 'sitType')])
          opts.push([0.8, () => homeWork(s, a, 'sitSolder', 20, 40, 'Building the reader optics')])
          opts.push([a.info.team && hr > 10 && hr < 16 ? 0.8 : 0, () => teamMeeting(s, a)])
          break
        case 'student':
          opts.push([3, () => homeWork(s, a, Math.random() < 0.5 ? 'sitSolder' : 'sitType', 25, 55, pick(['Breadboarding the circuit', 'Coding the Arduino', 'Following the lab worksheet']))])
          opts.push([2, () => machine(s, a, 'laser', 10, 25, 'Laser-cutting parts', (m) => m * PRICES.laserPerMin, LINES.laser)])
          opts.push([1.5, () => print3d(s, a)])
          opts.push([1, () => requestParts(s, a)])
          opts.push([1.2, () => chat(s, a)])
          break
        case 'designer':
          opts.push([4, () => use(s, a, s.slotFor('cadSeat', a), rand(30, 60), pick(['Modelling the enclosure', 'Routing the PCB', 'Rendering for the client']), 'sitType')])
          opts.push([3, () => print3d(s, a)])
          opts.push([1, () => machine(s, a, 'laser', 8, 20, 'Laser-cutting a prototype', (m) => m * PRICES.laserPerMin, LINES.laser)])
          opts.push([1, () => homeWork(s, a, 'sitType', 25, 45, 'Testing fit and finish')])
          opts.push([a.info.team && hr > 9.5 && hr < 16 ? 0.8 : 0, () => teamMeeting(s, a)])
          break
        case 'mentor':
          opts.push([6, () => mentorRounds(s, a)])
          opts.push([1, () => coffee(s, a, 'coffee', true)])
          break
      }
      yield* choose(s, a, opts)
      a.char.hold('none')
    }
    yield* depart(s, a)
  }
}

function cafeBrain(c: CastMember) {
  return function* (s: Sim, a: Agent): Brain {
    a.doing = 'Coming for coffee'
    yield* go(a, POINTS.entrance[0] + rand(-0.6, 0.6), POINTS.entrance[1])
    yield* go(a, POINTS.entranceIn[0], POINTS.entranceIn[1])
    const hr = (s.minute % 1440) / 60
    yield* coffee(s, a, hr > 12 && hr < 14.5 ? 'jollof' : Math.random() < 0.8 ? 'coffee' : 'snack', false)
    const seat = s.slotFor(Math.random() < 0.6 ? 'windowSeat' : 'cafeSeat', a) ?? s.slotFor('sofa', a)
    if (seat) {
      yield* goSlot(s, a, seat)
      const stay = Math.max(15, c.leave - (s.minute % 1440))
      yield { k: 'act', anim: seat.anim === 'sitDrink' ? 'sitDrink' : 'sitType', min: stay, held: Math.random() < 0.5 ? 'cup' : 'none', label: Math.random() < 0.5 ? 'Working on a laptop' : 'Coffee with a view of the print wall' }
      if (Math.random() < 0.25) a.say(pick(['Wait, is that a laser cutter?', 'How much is a day pass here?', 'This place is mad 🔥']), 3)
    }
    a.char.hold('none')
    yield* depart(s, a, false)
  }
}

function shopperBrain() {
  return function* (s: Sim, a: Agent): Brain {
    a.doing = 'Buying parts'
    yield* go(a, POINTS.partsDoor[0], POINTS.partsDoor[1])
    const slot = s.slotFor('shopCustomer', a)
    if (slot) {
      yield* goSlot(s, a, slot)
      a.say(pick(['Una get ESP32?', 'I need relay module, 4 channel', 'How much for the Pi?', 'Abeg, original ones only']), 3)
      yield { k: 'act', anim: 'talk', min: rand(3, 6), label: 'Asking about parts' }
      const amt = Math.round(rand(6, 70)) * 1000
      s.earn('parts', amt, `${first(a)} — walk-in parts purchase`, '🛍️', a)
      const clerk = s.byId.get('ife')
      if (clerk && !clerk.gone) clerk.say('Tested and working. Thank you!', 2.5)
    }
    const browse = s.slotFor('browse', a)
    if (browse && Math.random() < 0.5) yield* use(s, a, browse, 2, 'Browsing kits', 'stand')
    a.doing = 'Leaving'
    yield* go(a, POINTS.partsDoor[0], POINTS.partsDoor[1])
    yield* go(a, POINTS.spawnEast[0], POINTS.spawnEast[1])
    yield { k: 'leave' }
  }
}

function kidBrain(c: CastMember) {
  return function* (s: Sim, a: Agent): Brain {
    a.doing = 'Robotics Saturday'
    yield* go(a, POINTS.classroomDoor[0], POINTS.classroomDoor[1])
    const seat = s.slotFor('classSeat', a)
    if (seat) {
      yield* goSlot(s, a, seat)
      yield { k: 'until', cond: () => s.minute % 1440 > c.leave, anim: 'sitType', maxMin: 200 }
      if (Math.random() < 0.3) a.say(pick(['My robot moved!!', 'Again! Again!', 'Mine is faster 😤']), 3)
    }
    yield* go(a, POINTS.classroomDoor[0], POINTS.classroomDoor[1])
    yield* go(a, POINTS.spawnWest[0], POINTS.spawnWest[1])
    yield { k: 'leave' }
  }
}

// ── staff ──
function postBrain(c: CastMember, kind: string, anim: AnimName, label: string, onIdle?: (s: Sim, a: Agent) => Brain | null) {
  return function* (s: Sim, a: Agent): Brain {
    yield* go(a, POINTS.entrance[0], POINTS.entrance[1])
    const slot = s.world.slots.find((x) => x.kind === kind && !x.occupant && !x.reserved)
    while (s.minute % 1440 < c.leave) {
      const extra = onIdle?.(s, a)
      if (extra) { yield* extra; continue }
      if (slot && a.slot !== slot) yield* goSlot(s, a, slot)
      yield { k: 'act', anim, min: 2, label }
    }
    yield* depart(s, a, false)
  }
}

function baristaBrain(c: CastMember) {
  return postBrain(c, 'barista', 'barista', 'Making coffee', (s, a) => {
    const o = s.orders.find((x) => !x.served)
    if (!o) return null
    return (function* (): Brain {
      a.doing = `Serving ${first(o.agent)}`
      yield { k: 'act', anim: 'barista', min: o.item === 'jollof' ? 2 : 1.4, label: `Serving ${first(o.agent)}` }
      o.served = true
      s.orders = s.orders.filter((x) => x !== o)
    })()
  })
}

function runnerBrain(c: CastMember) {
  return function* (s: Sim, a: Agent): Brain {
    yield* go(a, POINTS.entrance[0], POINTS.entrance[1])
    yield* go(a, POINTS.gateIn[0], POINTS.gateIn[1])
    while (s.minute % 1440 < c.leave) {
      const t = s.tickets.find((x) => x.status === 'open')
      if (t) {
        t.status = 'fixing'
        t.assignee = a
        a.doing = `Fixing ${t.prop.def.info?.name ?? 'machine'} (AI guide)`
        a.char.hold('tablet')
        const sl = t.prop.slots[0]
        yield* go(a, sl ? sl.wx : t.prop.x, sl ? sl.wz + 0.01 : t.prop.z + 1)
        yield { k: 'face', x: t.prop.x, z: t.prop.z }
        yield { k: 'act', anim: 'standUse', min: rand(6, 14), held: 'tablet', label: `Fixing ${t.prop.def.info?.name ?? 'machine'} with the AI guide` }
        s.closeTicket(t)
        a.char.hold('none')
        continue
      }
      const r = s.requests.find((x) => x.status === 'queued')
      if (r) {
        r.status = 'picking'
        r.assignee = a
        const it = r.items[0]
        a.doing = `Fetching ${it.sku.name} → Aisle ${it.sku.aisle}, bin ${it.sku.bin}`
        s.emit('🤖', `AI routed ${first(a)}: Aisle ${it.sku.aisle} · Bin ${it.sku.bin} → ${first(r.member)} (${r.member.slot?.kind === 'benchSeat' ? 'bench hall' : 'counter'})`, { kind: 'ai' })
        a.char.hold('tablet')
        const shelf = s.world.slots.filter((x) => x.kind === 'libPick' && x.prop.def.info?.name?.includes(`Aisle ${it.sku.aisle}`))
        const ps = shelf.length ? pick(shelf) : null
        if (ps) {
          yield* go(a, ps.wx, ps.wz)
          a.rot = ps.wrot
          yield { k: 'act', anim: 'reach', min: rand(1, 2), held: 'tablet', label: `Picking ${it.sku.name}` }
        }
        r.status = 'delivering'
        a.char.hold('box')
        yield* go(a, r.deliverTo[0] + 0.4, r.deliverTo[1] + (r.deliverTo[1] > 15 ? -0.7 : 0.7), true)
        yield { k: 'face', x: r.member.x, z: r.member.z }
        yield { k: 'act', anim: 'talk', min: 0.8, held: 'box', label: `Handing over to ${first(r.member)}` }
        a.char.hold('none')
        s.completeRequest(r)
        continue
      }
      // low stock restock run
      const low = s.inventory.find((x) => x.stock <= x.min)
      if (low && Math.random() < 0.15) {
        a.doing = `Restocking ${low.name}`
        yield* go(a, 36.5, 7.2)
        yield { k: 'act', anim: 'reach', min: 1.5, label: 'Taking stock from stores' }
        a.char.hold('box')
        const ps = s.world.slots.find((x) => x.kind === 'libPick' && x.prop.def.info?.name?.includes(`Aisle ${low.aisle}`))
        if (ps) yield* go(a, ps.wx, ps.wz, true)
        yield { k: 'act', anim: 'reach', min: 2, held: 'box', label: `Restocking ${low.name}` }
        a.char.hold('none')
        low.stock += 20
        s.emit('📦', `${first(a)} restocked ${low.name} (+20)`, { kind: 'ops' })
        continue
      }
      // idle at the library desk with the ops app
      const desk = s.world.slots.find((x) => x.kind === 'libraryStaff')
      if (desk && !desk.occupant && Math.random() < 0.6) {
        yield* goSlot(s, a, desk)
        yield { k: 'act', anim: 'standType', min: 3, label: 'Watching the request queue' }
      } else {
        const benches = s.world.slots.filter((x) => x.kind === 'libPick')
        const b = pick(benches)
        yield* go(a, b.wx, b.wz)
        a.rot = b.wrot
        yield { k: 'act', anim: 'reach', min: 2, label: 'Tidying bins' }
      }
    }
    yield* depart(s, a)
  }
}

function facilitiesBrain(c: CastMember) {
  return function* (s: Sim, a: Agent): Brain {
    yield* go(a, POINTS.entrance[0], POINTS.entrance[1])
    const spots: [number, number][] = [[22, 24.5], [21.5, 15], [26, 18.5], [18, 6.5], [5, 6], [36, 17], [27, 10], [12, 18.5], [35, 25]]
    while (s.minute % 1440 < c.leave) {
      const [x, z] = pick(spots)
      a.doing = 'Cleaning'
      yield* go(a, x + rand(-1, 1), z + rand(-0.5, 0.5))
      yield { k: 'act', anim: 'sweep', min: rand(5, 10), held: 'broom', label: 'Sweeping (AI rota: busiest zone next)' }
      a.char.hold('none')
      if (Math.random() < 0.2) yield { k: 'wait', min: 4 }
    }
    yield* depart(s, a, false)
  }
}

function labManagerBrain(c: CastMember) {
  return function* (s: Sim, a: Agent): Brain {
    yield* go(a, POINTS.entrance[0], POINTS.entrance[1])
    yield* go(a, POINTS.gateIn[0], POINTS.gateIn[1])
    while (s.minute % 1440 < c.leave) {
      if (s.demo.active) { yield* demoNight(s, a); continue }
      const r = Math.random()
      if (r < 0.55) yield* mentorRounds(s, a)
      else if (r < 0.75) {
        a.doing = 'Safety walk: fab shop'
        yield* go(a, rand(13, 23), rand(4.5, 7.5))
        yield { k: 'act', anim: 'think', min: rand(3, 6), label: 'Safety walk: fab shop' }
      } else if (r < 0.9) yield* coffee(s, a, 'coffee', false)
      else {
        a.doing = 'Induction for a new member'
        const laser = s.world.slots.find((x) => x.kind === 'laser')
        if (laser) { yield* go(a, laser.wx + 0.8, laser.wz); yield { k: 'act', anim: 'present', min: rand(8, 12), label: 'Laser induction for a new member' } }
      }
    }
    yield* depart(s, a)
  }
}

function scienceLeadBrain(c: CastMember) {
  return function* (s: Sim, a: Agent): Brain {
    yield* go(a, POINTS.entrance[0], POINTS.entrance[1])
    yield* go(a, POINTS.gateIn[0], POINTS.gateIn[1])
    yield* go(a, 9.0, 8.25)
    yield { k: 'act', anim: 'reach', min: 1, label: 'Putting on lab coat' }
    a.char.look.labCoat = true
    a.char.setLook(a.char.look)
    while (s.minute % 1440 < c.leave) {
      const r = Math.random()
      if (r < 0.35) {
        const f = s.world.slots.find((x) => x.kind === 'fridge')!
        yield* use(s, a, f.occupant ? null : f, 2, 'Checking reagent stock', 'reach')
      } else if (r < 0.7) {
        const kinds = ['labIsland', 'bsc', 'hood', 'labBench']
        yield* use(s, a, s.slotFor(pick(kinds), a), rand(10, 25), pick(['Prepping media', 'Biosafety check', 'Calibrating pipettes', 'Training a new member']), undefined, false)
      } else if (s.demo.active) yield* demoNight(s, a)
      else {
        a.doing = 'Lab rounds'
        yield* go(a, rand(2, 8), rand(6, 7.5))
        yield { k: 'act', anim: 'think', min: rand(3, 6), label: 'Lab rounds' }
      }
    }
    yield* depart(s, a)
  }
}

export function brainFor(persona: Persona, c: CastMember): (s: Sim, a: Agent) => Brain {
  switch (persona) {
    case 'cafe': return cafeBrain(c)
    case 'shopper': return shopperBrain()
    case 'kid': return kidBrain(c)
    case 'barista': return baristaBrain(c)
    case 'host': return postBrain(c, 'reception', 'standType', 'Front desk')
    case 'clerk': return postBrain(c, 'shopStaff', 'standType', 'Parts counter')
    case 'runner': return runnerBrain(c)
    case 'facilities': return facilitiesBrain(c)
    case 'labManager': return labManagerBrain(c)
    case 'scienceLead': return scienceLeadBrain(c)
    default: return memberBrain(c)
  }
}

export { LINES }
