import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

export interface Shot { target: [number, number, number]; dist: number; az: number; pol: number }

// Sims-style camera: drag to pan, right-drag to rotate, wheel/pinch to zoom.
export class CameraRig {
  controls: OrbitControls
  private keys = new Set<string>()
  private fly: { from: Shot; to: Shot; t: number; dur: number; done?: () => void } | null = null
  follow: THREE.Object3D | null = null
  bounds = new THREE.Box3(new THREE.Vector3(-14, 0, -8), new THREE.Vector3(56, 12, 46))
  autoOrbit = 0

  constructor(public camera: THREE.PerspectiveCamera, dom: HTMLElement) {
    const c = new OrbitControls(camera, dom)
    c.enableDamping = true
    c.dampingFactor = 0.085
    c.screenSpacePanning = false
    c.minDistance = 4
    c.maxDistance = 95
    c.minPolarAngle = 0.28
    c.maxPolarAngle = 1.32
    c.zoomSpeed = 1.1
    c.panSpeed = 1.15
    c.rotateSpeed = 0.6
    c.mouseButtons = { LEFT: THREE.MOUSE.PAN, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.ROTATE }
    c.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }
    c.zoomToCursor = true
    this.controls = c
    c.addEventListener('start', () => {
      this.fly = null
      this.follow = null
      this.autoOrbit = 0
    })
    window.addEventListener('keydown', (e) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
      this.keys.add(e.key.toLowerCase())
    })
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()))
    window.addEventListener('blur', () => this.keys.clear())
  }

  get shot(): Shot {
    const off = this.camera.position.clone().sub(this.controls.target)
    const s = new THREE.Spherical().setFromVector3(off)
    return { target: this.controls.target.toArray() as [number, number, number], dist: s.radius, az: s.theta, pol: s.phi }
  }

  setShot(s: Shot) {
    this.controls.target.set(...s.target)
    const off = new THREE.Vector3().setFromSpherical(new THREE.Spherical(s.dist, s.pol, s.az))
    this.camera.position.copy(this.controls.target).add(off)
    this.camera.lookAt(this.controls.target)
  }

  cut(s: Shot) {
    this.fly = null
    this.follow = null
    this.setShot(s)
  }

  flyTo(to: Shot, dur = 2.2, done?: () => void) {
    this.follow = null
    const from = this.shot
    // shortest azimuth path
    let daz = to.az - from.az
    while (daz > Math.PI) daz -= Math.PI * 2
    while (daz < -Math.PI) daz += Math.PI * 2
    this.fly = { from, to: { ...to, az: from.az + daz }, t: 0, dur, done }
  }

  get flying() {
    return !!this.fly
  }

  update(dt: number) {
    const c = this.controls
    if (this.fly) {
      const f = this.fly
      f.t += dt / f.dur
      const k = ease(Math.min(1, f.t))
      const lerp = (a: number, b: number) => a + (b - a) * k
      // arc the distance a little for a nicer move
      const arc = Math.sin(Math.PI * k) * Math.min(12, Math.abs(f.to.dist - f.from.dist) * 0.25 + 4)
      this.setShot({
        target: [lerp(f.from.target[0], f.to.target[0]), lerp(f.from.target[1], f.to.target[1]), lerp(f.from.target[2], f.to.target[2])],
        dist: lerp(f.from.dist, f.to.dist) + arc,
        az: lerp(f.from.az, f.to.az),
        pol: lerp(f.from.pol, f.to.pol),
      })
      if (f.t >= 1) {
        this.fly = null
        f.done?.()
      }
      return
    }
    if (this.follow) {
      const p = new THREE.Vector3()
      this.follow.getWorldPosition(p)
      p.y = 0.9
      const delta = p.sub(c.target).multiplyScalar(1 - Math.exp(-dt * 4))
      c.target.add(delta)
      this.camera.position.add(delta)
    }
    if (this.autoOrbit) {
      const off = this.camera.position.clone().sub(c.target)
      off.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.autoOrbit * dt)
      this.camera.position.copy(c.target).add(off)
    }
    // WASD / arrows pan, Q/E rotate
    const k = this.keys
    if (k.size) {
      const dist = this.camera.position.distanceTo(c.target)
      const sp = dist * 0.9 * dt
      const fwd = new THREE.Vector3().subVectors(c.target, this.camera.position).setY(0).normalize()
      const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0))
      const mv = new THREE.Vector3()
      if (k.has('w') || k.has('arrowup')) mv.add(fwd)
      if (k.has('s') || k.has('arrowdown')) mv.sub(fwd)
      if (k.has('d') || k.has('arrowright')) mv.add(right)
      if (k.has('a') || k.has('arrowleft')) mv.sub(right)
      if (mv.lengthSq()) {
        mv.normalize().multiplyScalar(sp)
        c.target.add(mv)
        this.camera.position.add(mv)
        this.follow = null
      }
      const rot = (k.has('q') ? 1 : 0) - (k.has('e') ? 1 : 0)
      if (rot) {
        const off = this.camera.position.clone().sub(c.target)
        off.applyAxisAngle(new THREE.Vector3(0, 1, 0), rot * dt * 1.4)
        this.camera.position.copy(c.target).add(off)
      }
    }
    // clamp target
    const before = c.target.clone()
    c.target.clamp(this.bounds.min, this.bounds.max)
    c.target.y = Math.min(c.target.y, 3)
    this.camera.position.add(c.target.clone().sub(before))
    c.update()
  }
}
