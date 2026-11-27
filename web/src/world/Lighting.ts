import * as THREE from 'three'
import type { Quality } from '../engine/renderer'

const LAT = 6.5 * (Math.PI / 180)
const DECL = -19 * (Math.PI / 180) // mid-November
const SOLAR_NOON = 12 * 60 + 31 // minutes, Lagos in November

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}
const lerpC = (a: THREE.Color, b: THREE.Color, t: number) => a.clone().lerp(b, t)

const SKY = {
  dayTop: new THREE.Color('#5E9BD1'), dayHor: new THREE.Color('#D7E8F2'),
  duskTop: new THREE.Color('#3E5A8C'), duskHor: new THREE.Color('#F4A35E'),
  nightTop: new THREE.Color('#070C18'), nightHor: new THREE.Color('#1B2640'),
}

export class Lighting {
  sun: THREE.DirectionalLight
  hemi: THREE.HemisphereLight
  ambient: THREE.AmbientLight
  sky: THREE.Mesh
  skyU: { top: { value: THREE.Color }; hor: { value: THREE.Color } }
  interior: THREE.PointLight[] = []
  night = 0 // 0 day, 1 night
  elevation = 0
  overcast = 0 // rain/cloud dimming
  powerFlicker = 0

  constructor(public scene: THREE.Scene, quality: Quality) {
    const sun = new THREE.DirectionalLight('#fff2dc', 2.4)
    sun.castShadow = true
    const res = quality === 'high' ? 4096 : quality === 'medium' ? 2048 : 1024
    sun.shadow.mapSize.set(res, res)
    const cam = sun.shadow.camera
    cam.left = -42; cam.right = 42; cam.top = 42; cam.bottom = -42
    cam.near = 1; cam.far = 160
    sun.shadow.bias = -0.0004
    sun.shadow.normalBias = 0.03
    sun.shadow.radius = 3
    sun.target.position.set(22, 0, 18)
    scene.add(sun, sun.target)
    this.sun = sun

    this.hemi = new THREE.HemisphereLight('#cfe5ff', '#d9c3a5', 1.0)
    scene.add(this.hemi)
    this.ambient = new THREE.AmbientLight('#ffffff', 0.05)
    scene.add(this.ambient)

    // sky dome
    this.skyU = { top: { value: SKY.dayTop.clone() }, hor: { value: SKY.dayHor.clone() } }
    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyU,
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: `varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform vec3 top; uniform vec3 hor; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.05,0.0,1.0); gl_FragColor = vec4(mix(hor, top, pow(h,0.8)),1.0); }`,
    })
    this.sky = new THREE.Mesh(new THREE.SphereGeometry(400, 24, 16), skyMat)
    this.sky.frustumCulled = false
    scene.add(this.sky)
    scene.fog = new THREE.Fog('#D7E8F2', 90, 300)

    // warm interior fill lights (no shadows) — fade in at night
    const spots: [number, number, number, string, number][] = [
      [17, 2.8, 24, '#ffcf8a', 14], [27, 2.8, 24, '#ffcf8a', 14], [20, 3.0, 15, '#fff4e0', 16], [28, 3.0, 15, '#fff4e0', 14],
      [17, 3.0, 4.5, '#fff1db', 16], [5, 3.0, 4.5, '#eafffb', 12], [35.5, 3.0, 15.5, '#f1ecff', 10], [4, 3.0, 15.5, '#ffe9d0', 10],
      [5, 3.0, 24, '#fff1db', 10], [35.5, 3.0, 24, '#e9e0ff', 9], [29.5, 3.2, 4, '#ffffff', 9],
    ]
    for (const [x, y, z, c, d] of quality === 'low' ? spots.slice(0, 4) : spots) {
      const l = new THREE.PointLight(c, 0, d, 1.4)
      l.position.set(x, y, z)
      scene.add(l)
      this.interior.push(l)
    }
  }

  // minutes since midnight
  setTime(min: number) {
    const H = ((min - SOLAR_NOON) / 4) * (Math.PI / 180)
    const east = -Math.cos(DECL) * Math.sin(H)
    const north = Math.sin(DECL) * Math.cos(LAT) - Math.cos(DECL) * Math.cos(H) * Math.sin(LAT)
    const up = Math.sin(DECL) * Math.sin(LAT) + Math.cos(DECL) * Math.cos(H) * Math.cos(LAT)
    const dir = new THREE.Vector3(east, up, -north).normalize()
    this.elevation = Math.asin(up) * (180 / Math.PI)
    const el = this.elevation
    const day = smooth(-4, 12, el)
    const dusk = 1 - Math.abs(smooth(-6, 22, el) * 2 - 1) // peaks near horizon
    this.night = 1 - smooth(-7, 4, el)

    // sun light: keep it above horizon for shadows; moonlight at night
    const d = dir.clone()
    if (d.y < 0.15) d.y = 0.15
    const isMoon = this.night > 0.6
    const lightDir = isMoon ? new THREE.Vector3(-0.4, 0.8, 0.45).normalize() : d.normalize()
    this.sun.position.copy(this.sun.target.position).addScaledVector(lightDir, 80)
    const sunCol = lerpC(new THREE.Color('#ffd2a0'), new THREE.Color('#fff4e6'), smooth(2, 30, el))
    this.sun.color.copy(isMoon ? new THREE.Color('#9db4ff') : sunCol)
    const ov = 1 - this.overcast * 0.55
    this.sun.intensity = (isMoon ? 0.25 : 2.6 * day) * ov

    this.hemi.intensity = (0.35 + 0.75 * day) * (1 - this.overcast * 0.2)
    this.hemi.color.copy(lerpC(new THREE.Color('#4a5f8f'), new THREE.Color('#cfe5ff'), day))
    this.hemi.groundColor.copy(lerpC(new THREE.Color('#2b2620'), new THREE.Color('#d9c3a5'), day))

    let top = lerpC(SKY.nightTop, SKY.dayTop, day)
    let hor = lerpC(SKY.nightHor, SKY.dayHor, day)
    top = lerpC(top, SKY.duskTop, dusk * 0.6)
    hor = lerpC(hor, SKY.duskHor, dusk * 0.85)
    if (this.overcast > 0) {
      const grey = new THREE.Color('#8e979f')
      top.lerp(grey, this.overcast * 0.6)
      hor.lerp(grey, this.overcast * 0.5)
    }
    this.skyU.top.value.copy(top)
    this.skyU.hor.value.copy(hor)
    ;(this.scene.fog as THREE.Fog).color.copy(hor)

    const inside = Math.max(this.night, this.overcast * 0.5) * (1 - this.powerFlicker)
    for (const l of this.interior) l.intensity = inside * 22
  }
}
