import * as THREE from 'three'
import {
  EffectComposer, RenderPass, EffectPass, BloomEffect, SMAAEffect, ToneMappingEffect, ToneMappingMode, VignetteEffect, SMAAPreset,
} from 'postprocessing'
import { N8AOPostPass } from 'n8ao'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js'
import { setMaxAniso } from './textures'

export type Quality = 'high' | 'medium' | 'low'

export function detectQuality(): Quality {
  const ua = navigator.userAgent
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && window.innerWidth < 1100)
  const mem = (navigator as any).deviceMemory ?? 8
  const q = new URLSearchParams(location.search).get('q') as Quality | null
  if (q) return q
  if (mobile) return mem >= 6 ? 'medium' : 'low'
  return 'high'
}

export class Renderer {
  renderer: THREE.WebGLRenderer
  composer: EffectComposer | null = null
  labels: CSS2DRenderer
  ao: any = null
  bloom: BloomEffect | null = null
  quality: Quality
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera

  constructor(public container: HTMLElement, scene: THREE.Scene, camera: THREE.PerspectiveCamera, quality: Quality) {
    this.scene = scene
    this.camera = camera
    this.quality = quality
    const r = new THREE.WebGLRenderer({
      antialias: quality === 'low',
      powerPreference: 'high-performance',
      stencil: false,
      preserveDrawingBuffer: new URLSearchParams(location.search).has('capture'),
    })
    const maxDpr = quality === 'high' ? 2 : quality === 'medium' ? 1.5 : 1.25
    r.setPixelRatio(Math.min(window.devicePixelRatio, maxDpr))
    r.setSize(container.clientWidth, container.clientHeight)
    r.shadowMap.enabled = true
    r.shadowMap.type = THREE.PCFShadowMap
    r.outputColorSpace = THREE.SRGBColorSpace
    container.appendChild(r.domElement)
    this.renderer = r
    setMaxAniso(Math.min(8, r.capabilities.getMaxAnisotropy()))

    const pmrem = new THREE.PMREMGenerator(r)
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environmentIntensity = 0.55

    if (quality !== 'low') {
      r.toneMapping = THREE.NoToneMapping
      const composer = new EffectComposer(r, { frameBufferType: THREE.HalfFloatType, multisampling: 0 })
      composer.addPass(new RenderPass(scene, camera))
      if (quality === 'high' || quality === 'medium') {
        const ao = new N8AOPostPass(scene, camera, container.clientWidth, container.clientHeight)
        ao.configuration.aoRadius = 1.1
        ao.configuration.distanceFalloff = 0.6
        ao.configuration.intensity = 2.6
        ao.configuration.gammaCorrection = false
        ao.configuration.halfRes = quality === 'medium'
        ao.setQualityMode(quality === 'high' ? 'Medium' : 'Performance')
        composer.addPass(ao)
        this.ao = ao
      }
      this.bloom = new BloomEffect({ luminanceThreshold: 0.82, luminanceSmoothing: 0.2, intensity: 0.55, mipmapBlur: true, radius: 0.7 })
      const tone = new ToneMappingEffect({ mode: ToneMappingMode.AGX })
      const vignette = new VignetteEffect({ darkness: 0.32, offset: 0.32 })
      const smaa = new SMAAEffect({ preset: SMAAPreset.HIGH })
      composer.addPass(new EffectPass(camera, this.bloom, tone, vignette))
      composer.addPass(new EffectPass(camera, smaa))
      this.composer = composer
    } else {
      r.toneMapping = THREE.AgXToneMapping
      r.toneMappingExposure = 1.0
    }

    this.labels = new CSS2DRenderer()
    this.labels.setSize(container.clientWidth, container.clientHeight)
    Object.assign(this.labels.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' })
    container.appendChild(this.labels.domElement)

    window.addEventListener('resize', () => this.resize())
  }

  resize() {
    const w = this.container.clientWidth
    const h = this.container.clientHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
    this.composer?.setSize(w, h)
    this.ao?.setSize(w, h)
    this.labels.setSize(w, h)
  }

  render(dt: number) {
    if (this.composer) this.composer.render(dt)
    else this.renderer.render(this.scene, this.camera)
    this.labels.render(this.scene, this.camera)
  }
}
