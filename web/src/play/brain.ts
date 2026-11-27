import type { Sim } from '../sim/Sim'
import type { Agent, Step } from '../sim/Agent'
import { POINTS, roomAt } from '../data/layout'
import { PLACES } from './content'
import type { Play } from './Play'

const MACHINE = new Set(['laser', 'cnc', 'desktopCnc', 'pcb', 'printer', 'dronePilot', 'centrifuge', 'pcr', 'bsc', 'hood'])

export function playerBrain(play: Play) {
  return function* (s: Sim, a: Agent): Generator<Step, void, unknown> {
    a.doing = 'Arriving'
    yield { k: 'go', x: POINTS.entrance[0], z: POINTS.entrance[1] }
    yield { k: 'go', x: POINTS.entranceIn[0] - 1.2, z: POINTS.entranceIn[1] - 0.6 }
    a.doing = 'Deciding what to do'
    for (;;) {
      const job = play.queue.shift()
      if (!job) {
        yield { k: 'wait', min: 0.5, anim: a.slot ? a.slot.anim.replace('sitSolder', 'sit').replace('sitType', 'sit') as never : 'idle' }
        continue
      }
      play.begin(job)
      a.doing = job.verb
      // going home
      if (job.id === 'home') {
        const room = roomAt(a.x, a.z)
        if (room && !['cafe', 'parts', 'classroom'].includes(room.id)) yield { k: 'go', x: POINTS.gateOut[0], z: POINTS.gateOut[1] }
        yield { k: 'go', x: POINTS.entrance[0], z: POINTS.entrance[1] + 0.4 }
        yield { k: 'go', x: 20.6, z: 30.0 }
        play.finish(job)
        yield { k: 'leave' }
        return
      }
      // chat with someone
      if (job.target) {
        const o = s.byId.get(job.target)
        if (o && !o.gone) {
          const ang = o.rot + Math.PI / 2
          let tx = o.x + Math.sin(ang) * 0.8, tz = o.z + Math.cos(ang) * 0.8
          if (!s.world.nav.walkableAt(tx, tz)) { tx = o.x - Math.sin(o.rot) * 0.9; tz = o.z - Math.cos(o.rot) * 0.9 }
          yield { k: 'go', x: tx, z: tz }
          yield { k: 'face', x: o.x, z: o.z }
          if (!o.isSeated()) o.rot = Math.atan2(a.x - o.x, a.z - o.z)
          o.char.upperOverride = 'talk'
          yield { k: 'act', anim: 'talk', min: job.minutes, label: job.verb }
          o.char.upperOverride = null
        }
        play.finish(job)
        continue
      }
      // outdoor step (road test)
      if (job.place === 'street') {
        yield { k: 'go', x: POINTS.entrance[0], z: POINTS.entrance[1] }
        yield { k: 'go', x: 33, z: 30.3 }
        yield { k: 'act', anim: 'phone', min: job.minutes, label: job.verb, held: 'phone' }
        yield { k: 'go', x: POINTS.entranceIn[0], z: POINTS.entranceIn[1] }
        a.char.hold('none')
        play.finish(job)
        continue
      }
      let slot = job.slot ? s.slotFor(job.slot, a, (x) => !x.prop.state.fault && !(job.slot === 'printer' && x.prop.state.active)) : null
      if (slot) {
        yield { k: 'go', x: slot.wx, z: slot.wz, slot }
        yield { k: 'act', anim: job.anim ?? slot.anim, min: job.minutes, held: job.held, label: job.verb, prop: MACHINE.has(slot.kind) ? slot.prop : null }
      } else {
        const p = PLACES.find((x) => x.id === job.place)!
        const n = s.world.nav.nearestWalkable(p.pin[0], p.pin[1], 4)
        const [x, z] = n ? s.world.nav.toWorld(n[0], n[1]) : p.pin
        yield { k: 'go', x, z }
        yield { k: 'act', anim: job.anim && !job.anim.startsWith('sit') ? job.anim : 'standUse', min: job.minutes, held: job.held, label: job.verb }
      }
      a.char.hold('none')
      play.finish(job)
      slot = null
    }
  }
}
