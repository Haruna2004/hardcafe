import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import type { Game } from '../engine/Game'
import { Play, setMinuteSource, type Recap } from './Play'
import { PLACES, LOOKS, ACTIONS, CLOSE, type Action, type PlaceId } from './content'
import { playerBrain } from './brain'
import { ICONS } from './icons'
import { randomLook } from '../sim/Character'
import { useUI } from '../ui/store'
import type { AgentInfo } from '../sim/Agent'

export class PlayDirector {
  play: Play | null = null
  active = false
  pins: { id: PlaceId; obj: CSS2DObject; el: HTMLButtonElement }[] = []
  userPaused = false
  recap: Recap | null = null
  private warned = -1
  private tiredWarned = -1

  constructor(public game: Game) {}

  begin(play: Play) {
    this.play = play
    this.active = true
    setMinuteSource(() => this.game.sim.minute % 1440)
    play.onChange = () => this.game.pushUI(true)
    play.onPitch = () => this.game.pushUI(true)
    this.game.sim.onPlayerTick = (d) => play.tick(d, !!play.current)
    this.makePins()
    this.game.select(null)
    this.game.world.building.setMode('cutaway')
    this.game.rig.autoOrbit = 0
    if (play.s.ended) return useUI.getState().set({ mode: 'play', modal: 'end' })
    this.morning()
  }

  stop() {
    this.active = false
    for (const p of this.pins) p.obj.parent?.remove(p.obj)
    this.pins = []
    this.game.sim.onPlayerTick = undefined
  }

  morning() {
    const g = this.game
    g.sim.reset(this.play!.s.day, 7 * 60 + 54)
    g.sim.speedIdx = 1
    g.rig.flyTo({ target: [22, 1.2, 25.5], dist: 20, az: 0.45, pol: 1.02 }, 2)
    useUI.getState().set({ mode: 'play', modal: 'morning', sheet: null })
    g.pushUI(true)
  }

  startDay(kind: 'walk' | 'danfo' | 'bolt') {
    const g = this.game
    const play = this.play!
    play.commute(kind)
    const L = LOOKS.find((l) => l.id === play.s.look) ?? LOOKS[0]
    const look = randomLook(play.s.name.length * 31 + 7, { fem: L.fem, skin: L.skin, hair: L.hair as never, topColor: L.top, top: L.hair === 'hijab' ? 'blouse' : 'tee' })
    const info: AgentInfo = { id: 'you', name: play.s.name, role: 'player', title: play.project.name, persona: 'player', look, plan: 'You', bio: play.project.pitch }
    const from: [number, number] = kind === 'walk' ? [-4, 29.8] : [20.6, 30.0]
    const a = g.sim.spawn(info, from, playerBrain(play))
    a.speed = 1.5
    g.sim.player = a
    a.showTag(true)
    g.rig.flyTo({ target: [a.x, 0.9, a.z - 2], dist: 15, az: 0.4, pol: 0.98 }, 1.6, () => { g.rig.follow = a.char.root })
    useUI.getState().set({ modal: null })
    g.pushUI(true)
  }

  findMe() {
    const a = this.game.sim.player
    if (!a || a.gone) return
    this.game.rig.flyTo({ target: [a.x, 0.9, a.z], dist: 14, az: this.game.rig.shot.az, pol: 0.98 }, 1.1, () => { this.game.rig.follow = a.char.root })
  }

  doAction(a: Action) {
    const play = this.play!
    const c = play.check(a, this.game.sim.minute % 1440)
    if (!c.ok) return c
    if (!play.enqueue(a)) return { ok: false as const, why: 'Finish what you are doing first' }
    useUI.getState().set({ sheet: null })
    this.findMe()
    return c
  }

  chatWith(agentId: string) {
    const o = this.game.sim.byId.get(agentId)
    if (!o || !this.play) return
    const technical = ['tunde', 'hauwa', 'okon'].includes(o.id)
    const a: Action = {
      id: 'chat', place: 'cafe', label: `Chat with ${o.info.name}`, verb: `Chatting with ${o.info.name.replace(/^(Dr\.|Engr\.)\s*/, '').split(' ')[0]}`,
      minutes: 15, cost: 0, energy: 2, target: o.id,
      gain: { xp: technical ? { business: 10, electronics: 15 } : { business: 15 }, rep: 1 },
    }
    if (this.play.current || this.play.queue.length) return
    this.play.enqueue(a)
    this.game.select(null)
  }

  goHome() {
    const home = ACTIONS.find((x) => x.id === 'home')!
    if (this.play && !this.play.current && !this.play.queue.length) this.play.enqueue(home)
  }

  nextDay() {
    this.recap = null
    this.morning()
  }

  private makePins() {
    for (const p of this.pins) p.obj.parent?.remove(p.obj)
    this.pins = []
    for (const place of PLACES) {
      const el = document.createElement('button')
      el.className = 'pin'
      el.innerHTML = `${ICONS[place.icon]}<span>${place.name}</span>`
      el.addEventListener('pointerdown', (e) => e.stopPropagation())
      el.addEventListener('click', (e) => { e.stopPropagation(); useUI.getState().set({ sheet: place.id }) })
      const obj = new CSS2DObject(el)
      obj.position.set(place.pin[0], place.id === 'street' ? 1.2 : 2.9, place.pin[1])
      this.game.scene.add(obj)
      this.pins.push({ id: place.id, obj, el })
    }
  }

  update() {
    if (!this.active || !this.play) return
    const g = this.game
    const play = this.play
    const a = g.sim.player
    const m = g.sim.minute % 1440
    // pins: highlight the goal, hide while walking in from the street
    const goal = play.goal().place
    const ui = useUI.getState()
    for (const p of this.pins) {
      p.el.classList.toggle('goal', p.id === goal)
      p.obj.visible = !!a && !a.gone && ui.modal === null
    }
    // time speed follows what the player is doing
    if (!this.userPaused && a && !a.gone) {
      const acting = !!play.current && a.step?.k === 'act'
      const walking = !!play.current && a.step?.k === 'go'
      g.sim.speedIdx = acting ? 3 : walking ? 2 : 1
    }
    if (ui.modal) g.sim.speedIdx = ui.modal === 'morning' ? 1 : 0
    // closing time
    if (a && !a.gone && m >= CLOSE - 15 && this.warned !== play.s.day) {
      this.warned = play.s.day
      play.moments.push({ kind: 'info', text: 'Atoms closes at 8pm. Finish up and head home.' })
    }
    if (a && !a.gone && m >= CLOSE && !play.current && !play.queue.length) this.goHome()
    if (a && !a.gone && play.s.energy <= 0 && this.tiredWarned !== play.s.day) {
      this.tiredWarned = play.s.day
      play.moments.push({ kind: 'bad', text: 'You are running on empty. Grab a coffee or head home.' })
    }
    // day over
    if (a && a.gone && !this.recap) {
      g.sim.player = null
      this.recap = play.endDay()
      ui.set({ modal: 'recap', sheet: null })
      g.pushUI(true)
    }
  }
}
