// Grid navigation with A* + line-of-sight smoothing.
export class Nav {
  readonly cell = 0.25
  readonly x0 = -24
  readonly z0 = -6
  readonly nx: number
  readonly nz: number
  cost: Uint8Array // 0 = blocked, 1 normal, >1 discouraged
  private g: Float32Array
  private parent: Int32Array
  private gen: Uint32Array
  private closed: Uint32Array
  private curGen = 1

  constructor(width = 96, depth = 52) {
    this.nx = Math.ceil(width / this.cell)
    this.nz = Math.ceil(depth / this.cell)
    const n = this.nx * this.nz
    this.cost = new Uint8Array(n).fill(1)
    this.g = new Float32Array(n)
    this.parent = new Int32Array(n)
    this.gen = new Uint32Array(n)
    this.closed = new Uint32Array(n)
  }

  idx(i: number, j: number) {
    return j * this.nx + i
  }
  toCell(x: number, z: number): [number, number] {
    return [Math.floor((x - this.x0) / this.cell), Math.floor((z - this.z0) / this.cell)]
  }
  toWorld(i: number, j: number): [number, number] {
    return [this.x0 + (i + 0.5) * this.cell, this.z0 + (j + 0.5) * this.cell]
  }
  inside(i: number, j: number) {
    return i >= 0 && j >= 0 && i < this.nx && j < this.nz
  }
  walkable(i: number, j: number) {
    return this.inside(i, j) && this.cost[this.idx(i, j)] > 0
  }
  walkableAt(x: number, z: number) {
    const [i, j] = this.toCell(x, z)
    return this.walkable(i, j)
  }

  // Fill a rotated rectangle (centre cx,cz; half sizes hw,hd; rotation rot radians) with value v
  fillRect(cx: number, cz: number, hw: number, hd: number, rot: number, v: number) {
    const c = Math.cos(rot), s = Math.sin(rot)
    const ex = Math.abs(hw * c) + Math.abs(hd * s)
    const ez = Math.abs(hw * s) + Math.abs(hd * c)
    const [i0, j0] = this.toCell(cx - ex, cz - ez)
    const [i1, j1] = this.toCell(cx + ex, cz + ez)
    for (let j = Math.max(0, j0); j <= Math.min(this.nz - 1, j1); j++) {
      for (let i = Math.max(0, i0); i <= Math.min(this.nx - 1, i1); i++) {
        const [wx, wz] = this.toWorld(i, j)
        const dx = wx - cx, dz = wz - cz
        // inverse rotate into local frame (three.js y-rotation convention)
        const lx = dx * c - dz * s
        const lz = dx * s + dz * c
        if (Math.abs(lx) <= hw && Math.abs(lz) <= hd) this.cost[this.idx(i, j)] = v
      }
    }
  }

  fillDisc(cx: number, cz: number, r: number, v: number) {
    const [i0, j0] = this.toCell(cx - r, cz - r)
    const [i1, j1] = this.toCell(cx + r, cz + r)
    for (let j = Math.max(0, j0); j <= Math.min(this.nz - 1, j1); j++)
      for (let i = Math.max(0, i0); i <= Math.min(this.nx - 1, i1); i++) {
        const [wx, wz] = this.toWorld(i, j)
        if ((wx - cx) ** 2 + (wz - cz) ** 2 <= r * r) this.cost[this.idx(i, j)] = v
      }
  }

  nearestWalkable(x: number, z: number, maxR = 3): [number, number] | null {
    const [ci, cj] = this.toCell(x, z)
    if (this.walkable(ci, cj)) return [ci, cj]
    const R = Math.ceil(maxR / this.cell)
    for (let r = 1; r <= R; r++)
      for (let dj = -r; dj <= r; dj++)
        for (let di = -r; di <= r; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue
          if (this.walkable(ci + di, cj + dj)) return [ci + di, cj + dj]
        }
    return null
  }

  private los(a: [number, number], b: [number, number]): boolean {
    // supercover-ish DDA between cell centres, checking walkable + low cost
    let [x0, y0] = a
    const [x1, y1] = b
    const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0)
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1
    let err = dx - dy
    const base = this.cost[this.idx(a[0], a[1])]
    for (;;) {
      const c = this.cost[this.idx(x0, y0)]
      if (c === 0 || c > Math.max(base, 1) + 1) return false
      if (x0 === x1 && y0 === y1) return true
      const e2 = 2 * err
      if (e2 > -dy) { err -= dy; x0 += sx }
      if (e2 < dx) { err += dx; y0 += sy }
      // corner check
      if (!this.walkable(x0, y0)) return false
    }
  }

  find(fx: number, fz: number, tx: number, tz: number): [number, number][] | null {
    const s = this.nearestWalkable(fx, fz)
    const t = this.nearestWalkable(tx, tz)
    if (!s || !t) return null
    const gen = ++this.curGen
    const start = this.idx(s[0], s[1])
    const goal = this.idx(t[0], t[1])
    const heap = new MinHeap()
    this.g[start] = 0
    this.gen[start] = gen
    this.parent[start] = -1
    const h = (i: number, j: number) => {
      const dx = Math.abs(i - t[0]), dz = Math.abs(j - t[1])
      return (dx + dz + (Math.SQRT2 - 2) * Math.min(dx, dz))
    }
    heap.push(start, h(s[0], s[1]))
    let found = false
    let iter = 0
    while (heap.size) {
      const cur = heap.pop()
      if (this.closed[cur] === gen) continue
      this.closed[cur] = gen
      if (cur === goal) { found = true; break }
      if (++iter > 60000) break
      const ci = cur % this.nx, cj = (cur / this.nx) | 0
      for (let dj = -1; dj <= 1; dj++)
        for (let di = -1; di <= 1; di++) {
          if (!di && !dj) continue
          const ni = ci + di, nj = cj + dj
          if (!this.inside(ni, nj)) continue
          const n = this.idx(ni, nj)
          const c = this.cost[n]
          if (!c) continue
          if (di && dj && (!this.cost[this.idx(ci + di, cj)] || !this.cost[this.idx(ci, cj + dj)])) continue
          const ng = this.g[cur] + (di && dj ? Math.SQRT2 : 1) * c
          if (this.gen[n] !== gen || ng < this.g[n]) {
            this.gen[n] = gen
            this.g[n] = ng
            this.parent[n] = cur
            heap.push(n, ng + h(ni, nj))
          }
        }
    }
    if (!found) return null
    const cells: [number, number][] = []
    for (let c = goal; c !== -1; c = this.parent[c]) cells.push([c % this.nx, (c / this.nx) | 0])
    cells.reverse()
    // smooth
    const out: [number, number][] = []
    let anchor = 0
    out.push(cells[0])
    for (let i = 2; i < cells.length; i++) {
      if (!this.los(cells[anchor], cells[i])) {
        out.push(cells[i - 1])
        anchor = i - 1
      }
    }
    if (cells.length > 1) out.push(cells[cells.length - 1])
    const pts = out.map(([i, j]) => this.toWorld(i, j))
    // replace endpoints with exact positions where walkable
    pts[pts.length - 1] = [tx, tz]
    return pts.slice(1)
  }
}

class MinHeap {
  private ids: number[] = []
  private ks: number[] = []
  get size() {
    return this.ids.length
  }
  push(id: number, k: number) {
    const ids = this.ids, ks = this.ks
    let i = ids.length
    ids.push(id)
    ks.push(k)
    while (i > 0) {
      const p = (i - 1) >> 1
      if (ks[p] <= k) break
      ids[i] = ids[p]; ks[i] = ks[p]
      i = p
    }
    ids[i] = id
    ks[i] = k
  }
  pop(): number {
    const ids = this.ids, ks = this.ks
    const top = ids[0]
    const lastId = ids.pop()!
    const lastK = ks.pop()!
    if (ids.length) {
      let i = 0
      const n = ids.length
      for (;;) {
        const l = 2 * i + 1, r = l + 1
        let m = i
        let mk = lastK
        if (l < n && ks[l] < mk) { m = l; mk = ks[l] }
        if (r < n && ks[r] < mk) { m = r; mk = ks[r] }
        if (m === i) break
        ids[i] = ids[m]; ks[i] = ks[m]
        i = m
      }
      ids[i] = lastId
      ks[i] = lastK
    }
    return top
  }
}
