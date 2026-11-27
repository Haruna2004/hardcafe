import * as THREE from 'three'
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js'
import { Character, type Held, type Look } from './Character'
import type { AnimName } from '../world/props/common'
import type { WorldSlot, PropInstance } from '../world/props'

export type Role = 'member' | 'staff' | 'public' | 'shopper' | 'kid' | 'parent' | 'player'

export type Step =
  | { k: 'go'; x: number; z: number; slot?: WorldSlot | null; run?: boolean; carry?: boolean }
  | { k: 'act'; anim: AnimName; min: number; prop?: PropInstance | null; label?: string; held?: Held; progress?: (f: number) => void }
  | { k: 'wait'; min: number; anim?: AnimName }
  | { k: 'until'; cond: () => boolean; anim?: AnimName; maxMin?: number }
  | { k: 'face'; x: number; z: number }
  | { k: 'leave' }

export interface Needs { energy: number; hunger: number; social: number; focus: number; bladder: number }

export interface AgentInfo {
  id: string
  name: string
  role: Role
  title: string
  team?: string
  project?: string
  bio?: string
  persona: string
  look: Look
  sector?: string
  plan?: string
}

let SEQ = 0

export class Agent {
  id: string
  info: AgentInfo
  char: Character
  x = 0
  z = 0
  rot = 0
  path: [number, number][] | null = null
  speed = 1.35
  slot: WorldSlot | null = null
  homeSlot: WorldSlot | null = null
  brain: Generator<Step, void, unknown> | null = null
  step: Step | null = null
  stepT = 0
  needs: Needs = { energy: 1, hunger: 0.25, social: 0.6, focus: 0.9, bladder: 0.2 }
  doing = 'Arriving'
  present = true
  gone = false
  spentToday = 0
  minutesIn = 0
  progress = 0 // project progress 0..1
  arrivedAt = 0
  bubble: CSS2DObject
  private bubbleEl: HTMLDivElement
  private bubbleT = 0
  tag: CSS2DObject
  private tagEl: HTMLDivElement
  inbox: string[] = []
  log: { t: number; text: string }[] = []
  checkedIn = false
  waiting = false // waiting on a delivery
  selectedRing: THREE.Mesh | null = null
  stuck = 0

  constructor(info: AgentInfo, x: number, z: number) {
    this.id = info.id || `a${SEQ++}`
    this.info = info
    this.char = new Character(info.look, SEQ * 31 + info.name.length)
    this.x = x
    this.z = z
    this.char.root.position.set(x, 0, z)
    this.char.root.userData.agentId = this.id
    // speech bubble
    this.bubbleEl = document.createElement('div')
    this.bubbleEl.className = 'bubble'
    this.bubble = new CSS2DObject(this.bubbleEl)
    this.bubble.position.set(0, 2.15, 0)
    this.bubble.visible = false
    this.char.root.add(this.bubble)
    // name tag (shown on hover/selection)
    this.tagEl = document.createElement('div')
    this.tagEl.className = 'nametag'
    this.tagEl.textContent = info.name
    this.tag = new CSS2DObject(this.tagEl)
    this.tag.position.set(0, 2.0, 0)
    this.tag.visible = false
    this.char.root.add(this.tag)
  }

  static live = 0
  say(text: string, sec = 4, force = false) {
    if (!force && (Agent.live >= 2 || this.bubbleT > 0)) return
    if (this.bubbleT <= 0) Agent.live++
    this.bubbleEl.textContent = text
    this.bubble.visible = true
    this.bubbleT = sec
    this.bubbleEl.classList.remove('pop')
    void this.bubbleEl.offsetWidth
    this.bubbleEl.classList.add('pop')
  }

  note(t: number, text: string) {
    this.log.unshift({ t, text })
    if (this.log.length > 30) this.log.pop()
  }

  showTag(on: boolean) {
    this.tag.visible = on
  }

  setSelected(on: boolean, scene: THREE.Scene) {
    if (on && !this.selectedRing) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.42, 0.52, 40),
        new THREE.MeshBasicMaterial({ color: '#F2C230', transparent: true, opacity: 0.95, depthWrite: false }),
      )
      ring.rotation.x = -Math.PI / 2
      ring.renderOrder = 5
      this.selectedRing = ring
      scene.add(ring)
    } else if (!on && this.selectedRing) {
      scene.remove(this.selectedRing)
      this.selectedRing = null
    }
  }

  updateVisual(dt: number, simDt: number) {
    const lift = this.slot && this.slot.y && !this.isSeated() && this.slot.kind === 'presenter' ? this.slot.y : 0
    this.char.root.position.set(this.x, lift, this.z)
    // smooth facing
    const cur = this.char.root.rotation.y
    let d = this.rot - cur
    while (d > Math.PI) d -= Math.PI * 2
    while (d < -Math.PI) d += Math.PI * 2
    this.char.root.rotation.y = cur + d * (1 - Math.exp(-dt * 10))
    this.char.update(dt)
    void simDt
    if (this.bubbleT > 0) {
      this.bubbleT -= dt
      if (this.bubbleT <= 0) { this.bubble.visible = false; Agent.live = Math.max(0, Agent.live - 1) }
    }
    if (this.selectedRing) {
      this.selectedRing.position.set(this.x, 0.03, this.z)
      const s = 1 + Math.sin(performance.now() / 300) * 0.06
      this.selectedRing.scale.setScalar(s)
    }
  }

  isSeated() {
    const a = this.char.anim
    return a.startsWith('sit')
  }

  setAnim(a: AnimName) {
    this.char.anim = a
  }
}
