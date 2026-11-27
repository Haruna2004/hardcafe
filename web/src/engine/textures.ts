import * as THREE from 'three'
import { BRAND } from '../brand'

export function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export let MAX_ANISO = 4
export function setMaxAniso(n: number) { MAX_ANISO = n }

export function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, repeat = true) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  draw(g, w, h)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = MAX_ANISO
  if (repeat) {
    t.wrapS = THREE.RepeatWrapping
    t.wrapT = THREE.RepeatWrapping
  }
  return t
}

function speckle(g: CanvasRenderingContext2D, w: number, h: number, n: number, colors: string[], rmin: number, rmax: number, alpha: number, seed: number) {
  const r = rng(seed)
  g.globalAlpha = alpha
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[(r() * colors.length) | 0]
    const s = rmin + r() * (rmax - rmin)
    g.fillRect(r() * w, r() * h, s, s)
  }
  g.globalAlpha = 1
}

// 1 texture tile = 2m x 2m unless stated
export const FloorTex = {
  wood() {
    return canvasTex(512, 512, (g, w, h) => {
      const r = rng(7)
      const plankH = h / 8
      for (let i = 0; i < 8; i++) {
        const offset = (i % 2) * (w / 3) + r() * 60
        for (let x = -w; x < w * 2; x += w / 1.5) {
          const shade = 0.86 + r() * 0.2
          const base = [200, 150, 102].map((c) => Math.min(255, c * shade))
          g.fillStyle = `rgb(${base[0]},${base[1]},${base[2]})`
          g.fillRect(x + offset, i * plankH, w / 1.5, plankH)
          // grain
          g.strokeStyle = `rgba(110,70,40,${0.08 + r() * 0.08})`
          g.lineWidth = 1
          for (let k = 0; k < 6; k++) {
            g.beginPath()
            const yy = i * plankH + 4 + r() * (plankH - 8)
            g.moveTo(x + offset, yy)
            g.bezierCurveTo(x + offset + 80, yy + r() * 6 - 3, x + offset + 200, yy + r() * 6 - 3, x + offset + w / 1.5, yy)
            g.stroke()
          }
          g.fillStyle = 'rgba(70,40,20,0.35)'
          g.fillRect(x + offset, i * plankH, 2, plankH)
        }
        g.fillStyle = 'rgba(70,40,20,0.3)'
        g.fillRect(0, i * plankH, w, 2)
      }
    })
  },
  concrete(base = '#B9B6AE', seed = 3) {
    return canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = base
      g.fillRect(0, 0, w, h)
      speckle(g, w, h, 9000, ['#8f8c85', '#d6d3cb', '#a7a49c'], 1, 3, 0.18, seed)
      speckle(g, w, h, 400, ['#7d7a73', '#e0ddd5'], 4, 14, 0.05, seed + 1)
      // saw cut joints
      g.strokeStyle = 'rgba(80,78,72,0.35)'
      g.lineWidth = 2
      g.strokeRect(1, 1, w - 2, h - 2)
    })
  },
  epoxy(base = '#C9CCC7', seed = 11) {
    return canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = base
      g.fillRect(0, 0, w, h)
      speckle(g, w, h, 5000, ['#ffffff', '#9aa09a', '#6c726c'], 1, 2.2, 0.22, seed)
    })
  },
  terrazzo() {
    return canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#E8E2D6'
      g.fillRect(0, 0, w, h)
      const r = rng(21)
      const cols = ['#C8643B', '#0E7A4F', '#F2C230', '#1C1F24', '#9AA3AD', '#7B5CD6']
      for (let i = 0; i < 900; i++) {
        g.fillStyle = cols[(r() * cols.length) | 0]
        g.globalAlpha = 0.65
        g.beginPath()
        const x = r() * w, y = r() * h, s = 2 + r() * 7
        g.moveTo(x, y)
        for (let k = 0; k < 5; k++) g.lineTo(x + (r() - 0.5) * s * 2, y + (r() - 0.5) * s * 2)
        g.fill()
      }
      g.globalAlpha = 1
    })
  },
  tile() {
    return canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#D9DEE2'
      g.fillRect(0, 0, w, h)
      g.strokeStyle = '#b4bcc3'
      g.lineWidth = 3
      for (let i = 0; i <= 8; i++) {
        g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.stroke()
        g.beginPath(); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke()
      }
    })
  },
  carpet(base = '#5E6772', seed = 5) {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = base
      g.fillRect(0, 0, w, h)
      speckle(g, w, h, 6000, ['#000000', '#ffffff'], 1, 1.6, 0.06, seed)
    })
  },
  rubber() {
    return canvasTex(256, 256, (g, w, h) => {
      g.fillStyle = '#34383E'
      g.fillRect(0, 0, w, h)
      g.fillStyle = '#2a2d32'
      for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) {
        g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill()
      }
      speckle(g, w, h, 1500, ['#ffffff'], 1, 1.5, 0.05, 9)
    })
  },
  kids() {
    return canvasTex(512, 512, (g, w, h) => {
      const cols = ['#F2C230', '#5BA4CF', '#E8546B', '#3FB6A8', '#F07F2D', '#7B5CD6']
      const r = rng(4)
      const n = 4
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        g.fillStyle = cols[(r() * cols.length) | 0]
        g.fillRect(i * w / n, j * h / n, w / n, h / n)
        // puzzle nub hint
        g.fillStyle = 'rgba(255,255,255,0.12)'
        g.beginPath(); g.arc(i * w / n + w / n / 2, j * h / n, 14, 0, Math.PI); g.fill()
      }
      speckle(g, w, h, 3000, ['#000000', '#ffffff'], 1, 2, 0.05, 4)
    })
  },
  shop() {
    return canvasTex(512, 512, (g, w, h) => {
      g.fillStyle = '#8F8C86'
      g.fillRect(0, 0, w, h)
      speckle(g, w, h, 9000, ['#6f6c66', '#b2afa8', '#7d7a73'], 1, 3, 0.2, 31)
      g.fillStyle = 'rgba(40,40,40,0.035)'
      for (let i = 0; i < 8; i++) {
        const r = rng(i + 50)
        g.beginPath(); g.ellipse(r() * w, r() * h, 20 + r() * 50, 10 + r() * 30, r() * 3, 0, Math.PI * 2); g.fill()
      }
    })
  },
}

export function asphaltTex() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#3B3D40'
    g.fillRect(0, 0, w, h)
    speckle(g, w, h, 14000, ['#2a2c2e', '#55575b', '#47494d'], 1, 2.5, 0.35, 77)
    g.fillStyle = 'rgba(20,20,20,0.15)'
    const r = rng(78)
    for (let i = 0; i < 10; i++) { g.beginPath(); g.ellipse(r() * w, r() * h, 30 + r() * 60, 10 + r() * 20, r() * 3, 0, Math.PI * 2); g.fill() }
  })
}

export function pavingTex() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#BDB5A6'
    g.fillRect(0, 0, w, h)
    const r = rng(12)
    // interlocking paving stones, very common in Lagos
    for (let y = 0; y < h; y += 32) for (let x = ((y / 32) % 2) * 32; x < w; x += 64) {
      const s = 0.85 + r() * 0.2
      g.fillStyle = `rgb(${180 * s},${170 * s},${152 * s})`
      g.fillRect(x + 2, y + 2, 60, 28)
    }
    speckle(g, w, h, 3000, ['#8d8577', '#d9d1c2'], 1, 2, 0.2, 13)
  })
}

export function lateriteTex() {
  return canvasTex(512, 512, (g, w, h) => {
    g.fillStyle = '#A48469'
    g.fillRect(0, 0, w, h)
    speckle(g, w, h, 12000, ['#8f6f55', '#b8987a', '#7a5d47', '#c4a688', '#8a8a70'], 1, 3, 0.35, 41)
  })
}

// ── Signs & graphics ──
export function signTex(lines: { text: string; font: string; color: string; y: number }[], bg: string, w = 1024, h = 256, border?: string) {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg
    g.fillRect(0, 0, w, h)
    if (border) {
      g.strokeStyle = border
      g.lineWidth = 10
      g.strokeRect(5, 5, w - 10, h - 10)
    }
    g.textAlign = 'center'
    g.textBaseline = 'middle'
    for (const l of lines) {
      g.fillStyle = l.color
      g.font = l.font
      g.fillText(l.text, w / 2, l.y * h)
    }
  }, false)
}

export function brandSignTex() {
  return canvasTex(1024, 256, (g, w, h) => {
    g.fillStyle = '#FEFFFC'
    g.fillRect(0, 0, w, h)
    g.strokeStyle = '#DEE2DE'
    g.lineWidth = 3
    g.strokeRect(10, 10, w - 20, h - 20)
    // mark: nucleus + tilted orbit
    const cx = 150, cy = h / 2
    g.save(); g.translate(cx, cy); g.rotate(-0.49)
    g.strokeStyle = '#2C2C2C'; g.lineWidth = 6
    g.beginPath(); g.ellipse(0, 0, 82, 34, 0, 0, Math.PI * 2); g.stroke()
    g.restore()
    g.fillStyle = '#41A1CF'; g.beginPath(); g.arc(cx, cy, 17, 0, Math.PI * 2); g.fill()
    g.textBaseline = 'middle'; g.textAlign = 'left'
    g.fillStyle = '#2C2C2C'
    g.font = '400 150px "Instrument Serif", Georgia, serif'
    g.fillText('Atoms', 270, h * 0.53)
    const nameW = g.measureText('Atoms').width
    g.font = '500 28px "Geist Variable", Arial, sans-serif'
    g.fillStyle = '#646464'
    g.fillText('Café, workshop and lab', 270 + nameW + 36, h * 0.6)
  }, false)
}

const ANKARA_SETS = [
  ['#F2C230', '#0E7A4F', '#C8643B', '#1C1F24'],
  ['#E8546B', '#F2C230', '#2E5C8A', '#F6F3EC'],
  ['#7B5CD6', '#F07F2D', '#3FB6A8', '#1C1F24'],
  ['#0E7A4F', '#F6F3EC', '#C8643B', '#F2C230'],
  ['#2E5C8A', '#F2C230', '#E8546B', '#F6F3EC'],
  ['#C8643B', '#1C1F24', '#F2C230', '#3FB6A8'],
]

const ankaraCache = new Map<number, THREE.Texture>()
export function ankaraTex(seed: number) {
  const k = seed % 12
  if (ankaraCache.has(k)) return ankaraCache.get(k)!
  const cols = ANKARA_SETS[k % ANKARA_SETS.length]
  const style = Math.floor(k / ANKARA_SETS.length)
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = cols[0]
    g.fillRect(0, 0, w, h)
    const s = 64
    for (let y = 0; y < h; y += s) for (let x = 0; x < w; x += s) {
      if (style === 0) {
        g.fillStyle = cols[1]
        g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.36, 0, Math.PI * 2); g.fill()
        g.fillStyle = cols[2]
        g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.22, 0, Math.PI * 2); g.fill()
        g.fillStyle = cols[3]
        g.beginPath(); g.arc(x + s / 2, y + s / 2, s * 0.08, 0, Math.PI * 2); g.fill()
        g.fillStyle = cols[3]
        g.fillRect(x, y, 6, 6); g.fillRect(x + s - 6, y + s - 6, 6, 6)
      } else {
        g.fillStyle = cols[1]
        g.beginPath(); g.moveTo(x + s / 2, y + 4); g.lineTo(x + s - 4, y + s / 2); g.lineTo(x + s / 2, y + s - 4); g.lineTo(x + 4, y + s / 2); g.closePath(); g.fill()
        g.fillStyle = cols[2]
        g.beginPath(); g.moveTo(x + s / 2, y + 16); g.lineTo(x + s - 16, y + s / 2); g.lineTo(x + s / 2, y + s - 16); g.lineTo(x + 16, y + s / 2); g.closePath(); g.fill()
        g.strokeStyle = cols[3]
        g.lineWidth = 3
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + s, y + s); g.moveTo(x + s, y); g.lineTo(x, y + s); g.stroke()
      }
    }
  })
  t.repeat.set(2, 2)
  ankaraCache.set(k, t)
  return t
}

// ── Animated screens ──
export type ScreenKind = 'scope' | 'code' | 'cad' | 'dash' | 'kiosk' | 'stage' | 'tv' | 'menu' | 'class' | 'pcb' | 'lab'

interface LiveScreen { kind: ScreenKind; canvas: HTMLCanvasElement; tex: THREE.CanvasTexture; seed: number; draw: (g: CanvasRenderingContext2D, t: number) => void; every: number }

const screens: LiveScreen[] = []
const screenCache = new Map<string, THREE.CanvasTexture>()

const CODE = [
  'void loop() {', '  float t = ds18b20.read();', '  if (t > THRESH) alert();', '  lora.send(pack(t, rh));', '  sleep_ms(60000);', '}',
  '#include <esp_now.h>', 'pid.update(err, dt);', 'motor.set(throttle);', 'imu.calibrate();', '// TODO: debounce', 'ble.advertise("SENSE-01");',
  'struct Packet { u16 id; i16 t; };', 'adc_read(CH0) * 3.3 / 4095;', 'mqtt.publish("farm/temp", t);', 'for (i = 0; i < N; i++) {',
]

function makeDraw(kind: ScreenKind, seed: number): (g: CanvasRenderingContext2D, t: number) => void {
  const W = 256, H = 160
  const r = rng(seed)
  switch (kind) {
    case 'scope':
      return (g, t) => {
        g.fillStyle = '#05140d'; g.fillRect(0, 0, W, H)
        g.strokeStyle = 'rgba(80,200,140,0.18)'; g.lineWidth = 1
        for (let i = 1; i < 10; i++) { g.beginPath(); g.moveTo(i * W / 10, 0); g.lineTo(i * W / 10, H); g.stroke() }
        for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(0, i * H / 8); g.lineTo(W, i * H / 8); g.stroke() }
        g.lineWidth = 2.5
        g.strokeStyle = '#F2C230'
        g.beginPath()
        for (let x = 0; x <= W; x += 2) {
          const y = H * 0.35 + Math.sin(x * 0.06 + t * 4 + seed) * 22 * (1 + 0.2 * Math.sin(t))
          x ? g.lineTo(x, y) : g.moveTo(x, y)
        }
        g.stroke()
        g.strokeStyle = '#3FE0B0'
        g.beginPath()
        for (let x = 0; x <= W; x += 2) {
          const ph = (x * 0.04 + t * 3 + seed) % (Math.PI * 2)
          const y = H * 0.72 + (ph < Math.PI ? -16 : 16)
          x ? g.lineTo(x, y) : g.moveTo(x, y)
        }
        g.stroke()
        g.fillStyle = '#9fd'; g.font = '11px monospace'; g.fillText('CH1 2.00V  CH2 5.00V  1kHz', 6, 12)
      }
    case 'code':
      return (g, t) => {
        g.fillStyle = '#0f1420'; g.fillRect(0, 0, W, H)
        g.font = '11px monospace'
        const off = Math.floor(t * 1.5 + seed) % CODE.length
        for (let i = 0; i < 11; i++) {
          const line = CODE[(i + off) % CODE.length]
          g.fillStyle = '#4a5468'; g.fillText(String(i + 12 + off), 4, 14 + i * 13.5)
          g.fillStyle = i % 3 === 0 ? '#F2C230' : i % 3 === 1 ? '#8fd3ff' : '#c6f0c2'
          g.fillText(line, 28, 14 + i * 13.5)
        }
        if (Math.floor(t * 2) % 2) { g.fillStyle = '#fff'; g.fillRect(28 + 7 * 14, 14 + 10 * 13.5 - 9, 6, 11) }
      }
    case 'cad':
      return (g, t) => {
        g.fillStyle = '#20252e'; g.fillRect(0, 0, W, H)
        g.fillStyle = '#2b323d'; g.fillRect(0, 0, 40, H); g.fillRect(0, 0, W, 16)
        g.save(); g.translate(W / 2 + 16, H / 2 + 8)
        const a = t * 0.5 + seed
        const pts: [number, number, number][] = [[-1, -1, -0.6], [1, -1, -0.6], [1, 1, -0.6], [-1, 1, -0.6], [-1, -1, 0.6], [1, -1, 0.6], [1, 1, 0.6], [-1, 1, 0.6]]
        const P = pts.map(([x, y, z]) => {
          const X = x * Math.cos(a) - y * Math.sin(a), Y = x * Math.sin(a) + y * Math.cos(a)
          return [X * 40, Y * 18 - z * 34] as [number, number]
        })
        const E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]
        g.fillStyle = 'rgba(91,164,207,0.35)'
        g.beginPath(); [4, 5, 6, 7].forEach((i, k) => (k ? g.lineTo(...P[i]) : g.moveTo(...P[i]))); g.fill()
        g.strokeStyle = '#8fd3ff'; g.lineWidth = 1.5
        for (const [i, j] of E) { g.beginPath(); g.moveTo(...P[i]); g.lineTo(...P[j]); g.stroke() }
        g.restore()
        g.fillStyle = '#F2C230'; g.fillRect(6, 24, 26, 6); g.fillStyle = '#5a6475'; for (let i = 0; i < 6; i++) g.fillRect(6, 40 + i * 14, 26, 6)
      }
    case 'pcb':
      return (g) => {
        g.fillStyle = '#0d3b23'; g.fillRect(0, 0, W, H)
        g.strokeStyle = '#d4a845'; g.lineWidth = 3
        for (let i = 0; i < 18; i++) {
          g.beginPath(); const x = r() * W, y = r() * H; g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 120, y); g.lineTo(x + (r() - 0.5) * 120, y + (r() - 0.5) * 80); g.stroke()
        }
        g.fillStyle = '#1c1f24'; g.fillRect(100, 50, 50, 50)
        g.fillStyle = '#d4a845'; for (let i = 0; i < 30; i++) { g.beginPath(); g.arc(r() * W, r() * H, 3, 0, 7); g.fill() }
      }
    case 'dash':
      return (g, t) => {
        g.fillStyle = '#10141b'; g.fillRect(0, 0, W, H)
        g.fillStyle = '#F2C230'; g.font = 'bold 13px sans-serif'; g.fillText(`${BRAND.name} OPS`, 8, 16)
        for (let i = 0; i < 8; i++) {
          const v = 0.3 + 0.6 * Math.abs(Math.sin(i * 1.7 + t * 0.3))
          g.fillStyle = i % 2 ? '#3FB6A8' : '#5BA4CF'
          g.fillRect(10 + i * 30, H - 16 - v * 90, 20, v * 90)
        }
        g.fillStyle = '#9aa3ad'; g.font = '10px sans-serif'; g.fillText('utilisation by zone', 8, 32)
      }
    case 'kiosk':
      return (g, t) => {
        g.fillStyle = '#FEFFFC'; g.fillRect(0, 0, W, H)
        g.fillStyle = '#DEE2DE'; g.fillRect(0, 34, W, 1)
        g.fillStyle = '#2C2C2C'; g.font = '20px Georgia, serif'; g.fillText(`${BRAND.name}`, 10, 24)
        g.fillStyle = '#333'; g.font = '13px sans-serif'; g.fillText('Tap your card or scan QR', 10, 60)
        g.strokeStyle = BRAND.colors.ink; g.lineWidth = 2
        const s = 54 + Math.sin(t * 3) * 3
        g.strokeRect(W / 2 - s / 2, 80 + (54 - s) / 2, s, s)
        g.fillStyle = '#41A1CF'; g.fillRect(10, 140, W - 20, 3)
      }
    case 'stage':
      return (g, t) => {
        const slide = Math.floor(t / 6 + seed) % 3
        g.fillStyle = slide === 1 ? '#FEFFFC' : '#1F1F29'
        g.fillRect(0, 0, W, H)
        g.fillStyle = slide === 1 ? '#2C2C2C' : '#FEFFFC'; g.font = '26px Georgia, serif'
        g.fillText(slide === 0 ? 'Demo Night' : slide === 1 ? 'Made in Yaba' : 'Ship it', 14, 46)
        g.fillStyle = slide === 1 ? '#646464' : '#B4B8B4'; g.font = '13px sans-serif'
        g.fillText(slide === 0 ? 'Fridays, 6pm, free entry' : slide === 1 ? '14 prototypes this month' : 'Show what you built', 14, 76)
        g.fillStyle = 'rgba(128,128,128,0.25)'; g.fillRect(14, 100, W - 28, 3); g.fillStyle = '#41A1CF'; g.fillRect(14, 100, ((t % 6) / 6) * (W - 28), 6)
      }
    case 'tv':
      return (g, t) => {
        g.fillStyle = '#141820'; g.fillRect(0, 0, W, H)
        const cols = ['#C8643B', '#5BA4CF', '#3FB6A8', '#7B5CD6']
        for (let i = 0; i < 4; i++) {
          const x = (i % 2) * W / 2, y = Math.floor(i / 2) * H / 2
          g.fillStyle = '#222833'; g.fillRect(x + 3, y + 3, W / 2 - 6, H / 2 - 6)
          g.fillStyle = cols[i]; g.beginPath(); g.arc(x + W / 4, y + H / 4 - 4, 14, 0, 7); g.fill()
          g.fillRect(x + W / 4 - 20, y + H / 4 + 12, 40, 20)
          if (Math.floor(t * 2 + i) % 5 === 0) { g.strokeStyle = '#3FE0B0'; g.lineWidth = 3; g.strokeRect(x + 4, y + 4, W / 2 - 8, H / 2 - 8) }
        }
      }
    case 'class':
      return (g) => {
        g.fillStyle = '#fff'; g.fillRect(0, 0, W, H)
        g.fillStyle = '#2C2C2C'; g.font = '22px Georgia, serif'; g.fillText('Robotics Saturday', 10, 30)
        g.fillStyle = '#333'; g.font = '13px sans-serif'; g.fillText('1. Wire the motor driver', 10, 60); g.fillText('2. Line-follow sensor', 10, 80); g.fillText('3. Race!', 10, 100)
        g.fillStyle = BRAND.colors.sky; g.fillRect(160, 50, 80, 60)
      }
    case 'lab':
      return (g, t) => {
        g.fillStyle = '#0d1a1c'; g.fillRect(0, 0, W, H)
        g.strokeStyle = '#3FB6A8'; g.lineWidth = 2; g.beginPath()
        for (let x = 0; x < W; x += 3) { const y = H - 20 - (H - 50) / (1 + Math.exp(-(x - 60 - ((t * 10) % 100)) / 14)); x ? g.lineTo(x, y) : g.moveTo(x, y) }
        g.stroke(); g.fillStyle = '#9fe'; g.font = '11px monospace'; g.fillText('qPCR  cycle ' + (Math.floor(t) % 40), 6, 14)
      }
    case 'menu':
    default:
      return () => {}
  }
}

export function liveScreen(kind: ScreenKind, variant = 0): THREE.CanvasTexture {
  const key = `${kind}:${variant}`
  if (screenCache.has(key)) return screenCache.get(key)!
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 160
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  const seed = variant * 13 + kind.length
  const draw = makeDraw(kind, seed)
  const ls: LiveScreen = { kind, canvas, tex, seed, draw, every: kind === 'scope' ? 0.08 : kind === 'pcb' ? 1e9 : 0.5 }
  draw(canvas.getContext('2d')!, 0)
  tex.needsUpdate = true
  screens.push(ls)
  screenCache.set(key, tex)
  return tex
}

let accum = 0
export function updateScreens(t: number, dt: number) {
  accum += dt
  if (accum < 0.08) return
  accum = 0
  for (const s of screens) {
    if (s.every > 100) continue
    const last = (s as any)._last ?? -1
    if (t - last < s.every) continue
    ;(s as any)._last = t
    s.draw(s.canvas.getContext('2d')!, t)
    s.tex.needsUpdate = true
  }
}

export function menuTex() {
  return canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#1C1F24'; g.fillRect(0, 0, w, h)
    g.fillStyle = '#FEFFFC'; g.font = '34px Georgia, serif'; g.fillText('Menu', 22, 44)
    const items = [['Espresso', '2,500'], ['Cappuccino', '3,500'], ['Zobo (chilled)', '1,500'], ['Chapman', '2,500'], ['Jollof + chicken', '6,500'], ['Meat pie', '1,800'], ['Puff-puff (6)', '1,200']]
    g.font = '19px sans-serif'
    items.forEach(([n, p], i) => {
      const col = i < 4 ? 0 : 1
      const row = i < 4 ? i : i - 4
      g.fillStyle = '#F6F3EC'; g.fillText(n, 22 + col * 250, 84 + row * 40)
      g.fillStyle = '#9FD3EC'; g.fillText('₦' + p, 170 + col * 250, 84 + row * 40)
    })
  }, false)
}

export function posterTex(title: string, sub: string, bg: string, fg = '#ffffff', accent = BRAND.colors.yellow) {
  return canvasTex(256, 360, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h)
    g.fillStyle = accent; g.beginPath(); g.arc(w * 0.7, h * 0.35, 70, 0, 7); g.fill()
    g.fillStyle = fg; g.font = 'bold 34px sans-serif'
    title.split('\n').forEach((l, i) => g.fillText(l, 18, h - 110 + i * 38))
    g.font = '16px sans-serif'; g.fillText(sub, 18, h - 24)
  }, false)
}

export function textLabelTex(text: string, bg: string, fg: string, w = 256, h = 64, font = 'bold 30px sans-serif') {
  return canvasTex(w, h, (g) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h)
    g.fillStyle = fg; g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'
    g.fillText(text, w / 2, h / 2 + 2)
  }, false)
}
