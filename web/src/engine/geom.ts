import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

const gcache = new Map<string, THREE.BufferGeometry>()
const k = (n: number) => Math.round(n * 1000)

export function boxGeo(w: number, h: number, d: number, r = 0): THREE.BufferGeometry {
  const key = `b${k(w)},${k(h)},${k(d)},${k(r)}`
  let g = gcache.get(key)
  if (!g) {
    g = r > 0 ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)) : new THREE.BoxGeometry(w, h, d)
    gcache.set(key, g)
  }
  return g
}

export function cylGeo(rt: number, rb: number, h: number, seg = 16, open = false): THREE.BufferGeometry {
  const key = `c${k(rt)},${k(rb)},${k(h)},${seg},${open}`
  let g = gcache.get(key)
  if (!g) {
    g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)
    gcache.set(key, g)
  }
  return g
}

export function sphGeo(r: number, ws = 16, hs = 12): THREE.BufferGeometry {
  const key = `s${k(r)},${ws},${hs}`
  let g = gcache.get(key)
  if (!g) {
    g = new THREE.SphereGeometry(r, ws, hs)
    gcache.set(key, g)
  }
  return g
}

export function capGeo(r: number, len: number, seg = 10): THREE.BufferGeometry {
  const key = `p${k(r)},${k(len)},${seg}`
  let g = gcache.get(key)
  if (!g) {
    g = new THREE.CapsuleGeometry(r, len, 4, seg)
    gcache.set(key, g)
  }
  return g
}

// Add a box to a parent with its BOTTOM at y.
export function box(parent: THREE.Object3D, w: number, h: number, d: number, m: THREE.Material, x = 0, y = 0, z = 0, r = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(boxGeo(w, h, d, r), m)
  mesh.position.set(x, y + h / 2, z)
  parent.add(mesh)
  return mesh
}

export function cyl(parent: THREE.Object3D, rt: number, rb: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0, seg = 16): THREE.Mesh {
  const mesh = new THREE.Mesh(cylGeo(rt, rb, h, seg), m)
  mesh.position.set(x, y + h / 2, z)
  parent.add(mesh)
  return mesh
}

export function sph(parent: THREE.Object3D, r: number, m: THREE.Material, x = 0, y = 0, z = 0, ws = 16, hs = 12): THREE.Mesh {
  const mesh = new THREE.Mesh(sphGeo(r, ws, hs), m)
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

export function plane(parent: THREE.Object3D, w: number, h: number, m: THREE.Material, x = 0, y = 0, z = 0): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m)
  mesh.position.set(x, y, z)
  parent.add(mesh)
  return mesh
}

export function markDynamic(o: THREE.Object3D) {
  o.userData.dynamic = true
  return o
}

function isDynamic(o: THREE.Object3D, stop: THREE.Object3D): boolean {
  let p: THREE.Object3D | null = o
  while (p && p !== stop) {
    if (p.userData.dynamic) return true
    p = p.parent
  }
  return false
}

// Merge every static mesh under `root` into one mesh per material.
// Returns the merged meshes (already added to `target`).
export function batchStatic(root: THREE.Object3D, target: THREE.Object3D, opts: { cast?: boolean; receive?: boolean } = {}) {
  root.updateMatrixWorld(true)
  const byMat = new Map<THREE.Material, { geos: THREE.BufferGeometry[]; cast: boolean; receive: boolean }>()
  const victims: THREE.Mesh[] = []
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh || isDynamic(m, root) || Array.isArray(m.material)) return
    if ((m as any).isSkinnedMesh || (m as any).isInstancedMesh) return
    let g = m.geometry.clone()
    g.applyMatrix4(m.matrixWorld)
    if (g.index) g = g.toNonIndexed()
    for (const name of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(name)) g.deleteAttribute(name)
    if (!g.attributes.uv) {
      const n = g.attributes.position.count
      g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(n * 2), 2))
    }
    if (!g.attributes.normal) g.computeVertexNormals()
    const mat = m.material as THREE.Material
    let e = byMat.get(mat)
    if (!e) {
      e = { geos: [], cast: false, receive: false }
      byMat.set(mat, e)
    }
    e.geos.push(g)
    e.cast ||= m.castShadow || (opts.cast ?? true)
    e.receive ||= m.receiveShadow || (opts.receive ?? true)
    victims.push(m)
  })
  for (const v of victims) v.parent?.remove(v)
  const out: THREE.Mesh[] = []
  for (const [mat, e] of byMat) {
    // split into chunks to keep buffers reasonable
    const CH = 400
    for (let i = 0; i < e.geos.length; i += CH) {
      const merged = mergeGeometries(e.geos.slice(i, i + CH), false)
      if (!merged) continue
      merged.computeBoundingSphere()
      const mesh = new THREE.Mesh(merged, mat)
      const transparent = (mat as any).transparent
      mesh.castShadow = !transparent && e.cast
      mesh.receiveShadow = e.receive
      mesh.matrixAutoUpdate = false
      target.add(mesh)
      out.push(mesh)
    }
  }
  return out
}

export function enableShadows(o: THREE.Object3D, cast = true, receive = true) {
  o.traverse((c) => {
    const m = c as THREE.Mesh
    if (m.isMesh) {
      m.castShadow = cast && !(m.material as any).transparent
      m.receiveShadow = receive
    }
  })
}

export const DEG = Math.PI / 180
