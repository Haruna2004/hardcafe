import * as THREE from 'three'

// Shared material cache so hundreds of props reuse a few dozen materials.
const cache = new Map<string, THREE.Material>()

export interface MatOpts {
  rough?: number
  metal?: number
  emissive?: string
  emissiveIntensity?: number
  opacity?: number
  side?: THREE.Side
  flat?: boolean
}

export function mat(color: string, o: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = `${color}|${o.rough ?? 0.7}|${o.metal ?? 0}|${o.emissive ?? ''}|${o.emissiveIntensity ?? 1}|${o.opacity ?? 1}|${o.side ?? 0}|${o.flat ? 1 : 0}`
  let m = cache.get(key) as THREE.MeshStandardMaterial | undefined
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.rough ?? 0.7,
      metalness: o.metal ?? 0,
      flatShading: o.flat ?? false,
    })
    if (o.emissive) {
      m.emissive = new THREE.Color(o.emissive)
      m.emissiveIntensity = o.emissiveIntensity ?? 1
    }
    if (o.opacity !== undefined && o.opacity < 1) {
      m.transparent = true
      m.opacity = o.opacity
      m.depthWrite = false
    }
    if (o.side !== undefined) m.side = o.side
    cache.set(key, m)
  }
  return m
}

// Named palette used across props — tuned to read well under warm light.
export const P = {
  white: '#F4F1EA',
  offwhite: '#E9E4D8',
  wallWhite: '#EEEAE1',
  ink: '#1C1F24',
  charcoal: '#2B2F36',
  graphite: '#3A3F47',
  steel: '#9AA3AD',
  aluminium: '#C9CED4',
  darkSteel: '#5B636D',
  oak: '#C89B6A',
  walnut: '#7A5235',
  birch: '#E2C9A0',
  plywood: '#D8B98A',
  yellow: '#F2C230',
  green: '#0E7A4F',
  greenLight: '#2FA36B',
  clay: '#C8643B',
  sky: '#5BA4CF',
  violet: '#7B5CD6',
  teal: '#3FB6A8',
  rose: '#E8546B',
  orange: '#F07F2D',
  esdBlue: '#2E5C8A',
  esdGrey: '#6F7B86',
  labWhite: '#F7F8F8',
  plantGreen: '#3E8E4E',
  plantDark: '#2D6B3B',
  terracotta: '#B4573A',
  glassTint: '#BFE3EA',
  screen: '#0B1220',
}

export function glassMat(tint = '#CFEDF2', opacity = 0.18) {
  const key = `glass|${tint}|${opacity}`
  let m = cache.get(key) as THREE.MeshPhysicalMaterial | undefined
  if (!m) {
    m = new THREE.MeshPhysicalMaterial({
      color: tint,
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMapIntensity: 1.2,
    })
    cache.set(key, m)
  }
  return m
}

export function texMat(tex: THREE.Texture, o: MatOpts & { color?: string } = {}) {
  const m = new THREE.MeshStandardMaterial({
    map: tex,
    color: o.color ?? '#ffffff',
    roughness: o.rough ?? 0.7,
    metalness: o.metal ?? 0,
  })
  if (o.emissive) {
    m.emissive = new THREE.Color(o.emissive)
    m.emissiveMap = tex
    m.emissiveIntensity = o.emissiveIntensity ?? 1
  }
  return m
}

// Screen material: emissive canvas texture, glows a little at night.
const screenCache = new Map<string, THREE.MeshStandardMaterial>()
export function screenMat(tex: THREE.Texture, intensity = 1.25) {
  const key = tex.uuid + '|' + intensity
  const hit = screenCache.get(key)
  if (hit) return hit
  const m = new THREE.MeshStandardMaterial({
    map: tex,
    emissive: new THREE.Color('#ffffff'),
    emissiveMap: tex,
    emissiveIntensity: intensity,
    roughness: 0.35,
    metalness: 0,
    color: '#000000',
  })
  screenCache.set(key, m)
  return m
}
