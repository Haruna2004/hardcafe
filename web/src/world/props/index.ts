import * as THREE from 'three'
import type { PropBuilder, PropDef, PropState, SlotDef } from './common'
import * as cafe from './cafe'
import * as lab from './lab'
import * as fab from './fab'
import * as wet from './wet'
import * as misc from './misc'
import type { PropPlacement } from '../../data/layout'
import { roomAt } from '../../data/layout'

const REGISTRY: Record<string, PropBuilder> = {}
for (const mod of [cafe, lab, fab, wet, misc] as Record<string, unknown>[]) {
  for (const [k, v] of Object.entries(mod)) if (typeof v === 'function' && k !== 'plantPot' && k !== 'buildKeke') REGISTRY[k] = v as PropBuilder
}

export interface WorldSlot extends SlotDef {
  uid: string
  prop: PropInstance
  wx: number
  wz: number
  wrot: number // radians, facing
  occupant: string | null
  reserved: string | null
  disabled?: boolean
}

export interface PropInstance {
  id: string
  type: string
  def: PropDef
  x: number
  z: number
  y: number
  rot: number // radians
  state: PropState
  slots: WorldSlot[]
  zone: string
  parent?: PropInstance
  usage: number // minutes in use today
}

let autoId = 0

export function buildProp(p: PropPlacement & { y?: number }, parentGroup: THREE.Object3D, out: PropInstance[], parent?: PropInstance): PropInstance | null {
  const builder = REGISTRY[p.type]
  if (!builder) {
    console.warn('unknown prop', p.type)
    return null
  }
  const id = p.id ?? `${p.type}_${autoId++}`
  const def = builder({ ...(p.opts ?? {}), id })
  const rot = ((p.rot ?? 0) * Math.PI) / 180
  const g = def.group
  g.name = id
  g.position.set(p.x, p.y ?? 0, p.z)
  g.rotation.y = rot
  g.userData.propId = id
  parentGroup.add(g)
  // world transform for children/slots
  g.updateMatrixWorld(true)
  const wpos = new THREE.Vector3()
  g.getWorldPosition(wpos)
  const wq = new THREE.Quaternion()
  g.getWorldQuaternion(wq)
  const wrot = new THREE.Euler().setFromQuaternion(wq, 'YXZ').y
  const room = roomAt(wpos.x, wpos.z)
  const inst: PropInstance = {
    id, type: p.type, def, x: wpos.x, z: wpos.z, y: wpos.y, rot: wrot,
    state: { active: false, progress: 0, fault: false, t: 0, light: 0, data: {} },
    slots: [], zone: room?.id ?? 'outside', parent, usage: 0,
  }
  const c = Math.cos(wrot), s = Math.sin(wrot)
  for (const sd of def.slots ?? []) {
    const wx = wpos.x + sd.x * c + sd.z * s
    const wz = wpos.z - sd.x * s + sd.z * c
    inst.slots.push({ ...sd, uid: `${id}:${sd.id}`, prop: inst, wx, wz, wrot: wrot + (sd.rot * Math.PI) / 180, occupant: null, reserved: null })
  }
  out.push(inst)
  for (const ch of def.children ?? []) {
    buildProp({ type: ch.type, x: ch.x, z: ch.z, y: ch.y, rot: ch.rot, id: ch.id, opts: ch.opts }, g, out, inst)
  }
  return inst
}

export type { PropDef, PropState, SlotDef }
