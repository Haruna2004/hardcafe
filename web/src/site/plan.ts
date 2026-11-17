import { ROOMS, WALLS, PROPS, BUILDING, type Access } from '../data/layout'

// Approximate furniture footprints (m) for the plan drawing.
const FP: Record<string, [number, number, 'rect' | 'circle' | 'dash']> = {
  cafeBar: [4.15, 1.05, 'rect'], checkinKiosk: [0.4, 0.4, 'rect'], receptionDesk: [2.26, 0.95, 'rect'], cafeTable4: [1.0, 1.0, 'circle'],
  cafeTable2: [0.72, 0.72, 'rect'], sofaSet: [2.2, 1.2, 'rect'], windowBar: [6.8, 0.45, 'rect'], stage: [4.2, 2.4, 'rect'], printerRack: [1.2, 0.6, 'rect'],
  elecBench: [3.0, 1.5, 'rect'], toolCart: [0.7, 0.45, 'rect'], whiteboardStand: [1.8, 0.4, 'rect'], cadDesk: [1.4, 0.7, 'rect'], meetingTable: [3.2, 1.2, 'rect'],
  studioTable: [2.4, 1.2, 'rect'], shelf: [1.95, 0.4, 'rect'], binShelf: [2.4, 0.6, 'rect'], libraryDesk: [1.6, 0.6, 'rect'], pickCart: [0.8, 0.5, 'rect'],
  shopCounter: [4.06, 0.8, 'rect'], displayShelf: [1.9, 0.42, 'rect'], displayTable: [1.6, 0.9, 'rect'], kidsTable: [1.3, 0.85, 'rect'], kitShelf: [2.0, 0.4, 'rect'],
  wcStalls: [2.9, 1.4, 'rect'], laserCO2: [1.9, 1.05, 'rect'], laserDesktop: [1.3, 0.85, 'rect'], cncRouter: [3.4, 2.1, 'rect'], desktopCNC: [0.95, 0.85, 'rect'],
  pcbBench: [1.8, 0.75, 'rect'], workbench: [2.4, 0.9, 'rect'], materialRack: [2.0, 0.55, 'rect'], bandsaw: [0.6, 0.6, 'rect'], drillPress: [0.5, 0.6, 'rect'],
  assemblyTable: [2.0, 1.0, 'rect'], dustCollector: [0.7, 0.7, 'circle'], droneCage: [6.2, 6.4, 'dash'], droneTable: [1.8, 0.8, 'rect'], fumeHood: [1.8, 0.9, 'rect'],
  bioCabinet: [1.5, 0.8, 'rect'], labFridge: [0.75, 0.72, 'rect'], labFreezer: [0.75, 0.72, 'rect'], labWallBench: [4.0, 0.7, 'rect'], labIsland: [3.65, 1.55, 'rect'],
  labSideBench: [2.6, 0.7, 'rect'], labSink: [1.4, 0.6, 'rect'], chemCabinet: [1.1, 0.55, 'rect'], inverterWall: [2.6, 0.3, 'rect'], batteryBank: [2.8, 0.6, 'rect'],
  serverRack: [0.6, 0.9, 'rect'], palletRack: [3.4, 0.9, 'rect'], boxStack: [0.7, 0.6, 'rect'], plant: [0.5, 0.5, 'circle'],
}

export const ACCESS_LABEL: Record<Access, string> = { public: 'Public', member: 'Members', controlled: 'Inducted members', staff: 'Staff' }

export function planSVG(opts: { compact?: boolean } = {}) {
  const S = 22 // px per metre
  const pad = 46
  const W = BUILDING.w * S + pad * 2
  const H = BUILDING.d * S + pad * 2 + 40
  const X = (x: number) => pad + x * S
  const Y = (z: number) => pad + z * S
  const o: string[] = []
  o.push(`<svg viewBox="0 0 ${W} ${H}" class="plan" role="img" aria-label="Ground floor plan">`)
  o.push(`<defs><pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" class="hatch"/></pattern></defs>`)
  // rooms
  for (const r of ROOMS) {
    const { x, z, w, d } = r.rect
    o.push(`<rect x="${X(x)}" y="${Y(z)}" width="${w * S}" height="${d * S}" fill="${r.accent}" fill-opacity="${r.id === 'labstreet' || r.id === 'westhall' ? 0.06 : 0.13}" class="room" data-room="${r.id}"><title>${r.name} · ${(w * d).toFixed(0)} m²</title></rect>`)
  }
  // furniture
  for (const p of PROPS) {
    const f = FP[p.type]
    if (!f) continue
    const rot = p.rot ?? 0
    const [w, d, kind] = f
    if (kind === 'circle') o.push(`<circle cx="${X(p.x)}" cy="${Y(p.z)}" r="${(w / 2) * S}" class="furn"/>`)
    else o.push(`<rect x="${-w / 2 * S}" y="${-d / 2 * S}" width="${w * S}" height="${d * S}" rx="2" class="${kind === 'dash' ? 'furn dash' : 'furn'}" transform="translate(${X(p.x)} ${Y(p.z)}) rotate(${-rot})"/>`)
  }
  // walls
  for (const w of WALLS) {
    const [ax, az] = w.a, [bx, bz] = w.b
    const L = Math.hypot(bx - ax, bz - az)
    const ux = (bx - ax) / L, uz = (bz - az) / L
    const ops = [...(w.openings ?? [])].sort((p, q) => p.at - q.at)
    const cls = w.kind === 'ext' ? 'wall ext' : w.kind === 'glass' ? 'wall glass' : 'wall'
    let t = 0
    const seg = (t0: number, t1: number, c = cls) => {
      if (t1 - t0 < 0.01) return
      o.push(`<line x1="${X(ax + ux * t0)}" y1="${Y(az + uz * t0)}" x2="${X(ax + ux * t1)}" y2="${Y(az + uz * t1)}" class="${c}"/>`)
    }
    for (const op of ops) {
      seg(t, op.at)
      if (op.kind === 'window') seg(op.at, op.at + op.w, 'wall window')
      else if (op.kind === 'counter') seg(op.at, op.at + op.w, 'wall counter')
      else if (op.kind === 'door' || op.kind === 'gate') {
        // door swing arc
        const hx = X(ax + ux * op.at), hy = Y(az + uz * op.at)
        const r = op.w * S
        const nx = -uz, nz = ux
        const ex = hx + ux * r, ey = hy + uz * r
        const sx = hx + nx * r, sy = hy + nz * r
        o.push(`<path d="M${hx},${hy} L${sx},${sy} A${r},${r} 0 0 ${ux * nz - uz * nx > 0 ? 1 : 0} ${ex},${ey}" class="door"/>`)
      } else if (op.kind === 'roller') seg(op.at, op.at + op.w, 'wall roller')
      t = op.at + op.w
    }
    seg(t, L)
  }
  // labels
  if (!opts.compact) {
    for (const r of ROOMS) {
      if (['labstreet', 'westhall', 'wc', 'prayer'].includes(r.id)) continue
      const { x, z, w, d } = r.rect
      const cx = X(x + w / 2), cy = Y(z + d / 2)
      const name = r.name.replace(' (BSL-1)', '')
      o.push(`<text x="${cx}" y="${cy - 3}" class="rl">${name}</text><text x="${cx}" y="${cy + 12}" class="ra">${(w * d).toFixed(0)} m²</text>`)
    }
    o.push(`<text x="${X(20)}" y="${Y(10.25)}" class="ra">LAB STREET</text>`)
  }
  // street + title block
  o.push(`<line x1="${X(-1)}" y1="${Y(BUILDING.d) + 30}" x2="${X(BUILDING.w + 1)}" y2="${Y(BUILDING.d) + 30}" class="street"/>`)
  o.push(`<text x="${X(BUILDING.w / 2)}" y="${Y(BUILDING.d) + 46}" class="ra">STREET · main entrance</text>`)
  o.push(`<polygon points="${X(22) - 7},${Y(BUILDING.d) + 22} ${X(22) + 7},${Y(BUILDING.d) + 22} ${X(22)},${Y(BUILDING.d) + 10}" class="arrow"/>`)
  // north arrow + scale bar
  const nx = W - pad + 18, ny = pad + 6
  o.push(`<g class="north"><circle cx="${nx}" cy="${ny + 14}" r="14"/><path d="M${nx},${ny} L${nx + 6},${ny + 20} L${nx},${ny + 15} L${nx - 6},${ny + 20} Z"/><text x="${nx}" y="${ny - 6}">N</text></g>`)
  const sx = pad, sy = H - 14
  for (let i = 0; i < 5; i++) o.push(`<rect x="${sx + i * S}" y="${sy - 6}" width="${S}" height="6" class="${i % 2 ? 'sb' : 'sb dark'}"/>`)
  o.push(`<text x="${sx + 5 * S + 8}" y="${sy}" class="ra" text-anchor="start">5 m</text>`)
  o.push(`</svg>`)
  return o.join('')
}
