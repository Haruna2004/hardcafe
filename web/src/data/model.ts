// Financial model for the first site. All money in naira unless named USD.
// Inputs cite research/02-economics.md (Nov 2026). Items marked (E) are our estimates.

export const FX = 1355 // ₦/US$, NFEM 16 Nov 2026

export type Space = 'lease' | 'partner'
export type Power = 'own' | 'lease'
export type Scope = 'full' | 'lean'
export type Case = 'low' | 'base' | 'high'

export interface Options { space: Space; power: Power; scope: Scope; case: Case }

export interface Line { label: string; usd: number; note?: string; group: string }

const LANDED = 1.2 // duty + 7.5% VAT + freight + clearing on imported kit (E; confirm per HS code)

export function capex(o: Options): Line[] {
  const full = o.scope === 'full'
  const L: Line[] = []
  const add = (group: string, label: string, usd: number, note?: string) => L.push({ group, label, usd: Math.round(usd), note })
  // Equipment (list price × landed factor)
  add('Equipment', full ? 'Print farm: 16 FDM + 2 resin printers' : 'Print farm: 10 FDM + 1 resin printer', (full ? 16 * 1203 + 2 * 2625 + 1000 : 10 * 1203 + 2625 + 500) * LANDED, 'Prusa CORE One+ $1,203; Form 4 $2,625')
  add('Equipment', full ? 'Fabrication: CO₂ + desktop laser, 4×8 CNC, Carvera, SMT, saws' : 'Fabrication: CO₂ + desktop laser, Carvera, hand tools', (full ? 7000 + 3000 + 9000 + 5269 + 3300 + 5900 + 1500 : 7000 + 3000 + 5269 + 3500 + 1000) * LANDED, 'OMTech 100W $7k; xTool P2S $3k; Carvera $5.3k; 4×8 router about $9k, estimate')
  add('Equipment', full ? 'Electronics: 24 seats (scope + supply per pair, iron per seat)' : 'Electronics: 16 seats', (full ? 12 * 908 + 24 * 310 + 4000 : 8 * 908 + 16 * 310 + 2500) * LANDED + (full ? 4800 : 3200), 'Rigol DHO804 $459; DP832 $449; Hakko $130')
  add('Equipment', full ? 'Wet lab (BSL-1): hood, BSC, PCR, centrifuges, autoclave, cold storage' : 'Wet lab starter: refurbished hood + BSC, PCR, centrifuge, cold storage', (full ? 34600 : 21000) * LANDED, 'Refurbished hood and BSC assumed, estimate')
  if (full) add('Equipment', 'Drone flight cage (6×6×4 m)', 4000, 'Estimate')
  add('Equipment', 'IT: Starlink + fibre, Wi-Fi, access control, CAD PCs, kiosk', full ? 13000 : 9000)
  // Fit-out
  add('Fit-out', 'Partitions, glazing, flooring, paint', full ? 42000 : 30000, 'Estimate, light conversion of an existing warehouse')
  add('Fit-out', 'Electrical upgrade, extraction, wet-lab plumbing, fire safety', full ? 33000 : 24000, 'Estimate')
  add('Fit-out', 'Furniture + café equipment', full ? 16000 : 12000, 'Estimate')
  // Power
  if (o.power === 'own') add('Power', full ? 'Solar 30 kWp + 60 kWh LFP + inverters' : 'Solar 20 kWp + 40 kWh LFP + inverters', ((full ? 30 : 20) * 1.3e6 + (full ? 60 : 40) * 315000) / FX, '₦1.3m/kWp; ₦315k/kWh')
  add('Power', 'Standby generator (refurbished 60 kVA) + changeover', 9000, 'Estimate')
  // Space
  if (o.space === 'lease') {
    const m2 = full ? 1120 : 800
    const rent = m2 * 55000
    add('Space', `Year-1 rent prepaid (${m2} m² × ₦55k), legal max 1 yr`, rent / FX, 'Yaba ₦50k to ₦127k per m² a year')
    add('Space', 'Agency + legal + caution (30% of rent)', (rent * 0.3) / FX, 'Lagos norms 10% each')
  }
  // Launch
  add('Launch', 'Opening stock: components, filament, sheet, café', full ? 12000 : 9000)
  add('Launch', 'Pre-opening: hiring, 6-week training, permits (incl. biosafety), marketing', full ? 15000 : 12000)
  const sub = L.reduce((s, l) => s + l.usd, 0)
  add('Launch', 'Contingency (5%)', sub * 0.05)
  return L
}

export interface Month { m: number; revenue: number; cogs: number; opex: number; ebitda: number; cash: number; byStream: Record<string, number> }

// Mature monthly revenue (₦), base case. See notes for each line.
export const STREAMS_MATURE = {
  Memberships: 5_775_000, // 35 Maker ₦75k + 15 Pro ₦130k + 40 Student ₦30k
  'Day passes': 2_080_000, // 10/day × 26 days × ₦8k blended
  'Team studios': 1_170_000, // 2 × ₦650k at 90%
  'Wet lab': 1_500_000, // bench-months + day benches
  'Machine time': 3_500_000, // printing ₦150/g, laser, CNC, PCB, cage
  'Parts shop': 6_000_000, // 25% gross margin
  Café: 4_500_000, // 40% COGS
  'Classes & practicals': 4_300_000, // kids Saturdays, bootcamps, university practicals
  'Partners & services': 3_000_000, // sponsored talent seats, prototyping for SMEs
  Events: 800_000,
}

const COGS_RATE: Record<string, number> = { 'Parts shop': 0.75, Café: 0.4, 'Machine time': 0.15, 'Classes & practicals': 0.1 }

export function opexMonthly(o: Options) {
  const full = o.scope === 'full'
  const staff = (600 + 550 + 450 + 2 * 180 + 150 + 150 + 2 * 120 + 2 * 85 + 2 * 85) * 1000 * 1.12 + 300_000
  const m2 = full ? 1120 : 800
  const rent = o.space === 'lease' ? (m2 * (55000 + 15000)) / 12 : (m2 * 15000) / 12 // partner space: service charge only
  const power = o.power === 'own' ? (full ? 2_150_000 : 1_700_000) : (full ? 2_450_000 : 1_950_000)
  const lines = {
    'Staff (14, incl. 12% on-costs)': staff,
    [o.space === 'lease' ? 'Rent + service charge' : 'Service charge (partner space)']: rent,
    [o.power === 'own' ? 'Power: grid + diesel top-up' : 'Power: solar lease + grid + diesel']: power,
    'Internet (Starlink + fibre)': 292_000,
    'Maintenance and spares, about 12% of kit a year': full ? 2_030_000 : 1_400_000,
    'Software, AI tools, insurance': 900_000,
    'Marketing, events, community': 600_000,
    'Cleaning, waste, admin': 800_000,
  }
  return lines
}

export const CASE_MULT: Record<Case, number> = { low: 0.7, base: 1, high: 1.25 }

export function project(o: Options, months = 48) {
  const cap = capex(o).reduce((s, l) => s + l.usd, 0) * FX
  const op = opexMonthly(o)
  const opex = Object.values(op).reduce((a, b) => a + b, 0)
  const scale = (o.scope === 'full' ? 1 : 0.72) * CASE_MULT[o.case]
  const out: Month[] = []
  let cash = -cap
  for (let m = 1; m <= months; m++) {
    const ramp = Math.min(1, 0.22 + (0.78 * (m - 1)) / 17)
    const byStream: Record<string, number> = {}
    let revenue = 0, cogs = 0
    for (const [k, v] of Object.entries(STREAMS_MATURE)) {
      const r = v * ramp * scale
      byStream[k] = r
      revenue += r
      cogs += r * (COGS_RATE[k] ?? 0)
    }
    const opexM = opex * (m <= 3 ? 0.92 : 1)
    const ebitda = revenue - cogs - opexM
    cash += ebitda
    out.push({ m, revenue, cogs, opex: opexM, ebitda, cash, byStream })
  }
  const breakeven = out.find((x) => x.ebitda > 0)?.m ?? null
  const payback = out.find((x) => x.cash > 0)?.m ?? null
  const mature = out[23]
  return { capexNgn: cap, capexUsd: cap / FX, opexLines: op, opex, months: out, breakeven, payback, mature }
}

export const IMPACT = [
  ['Builders with daily access', 'About 120 members and 250 day-pass users a year'],
  ['Students getting hands-on hours', 'About 400 a year, from practicals and bootcamps'],
  ['Kids in robotics classes', 'About 100 a year'],
  ['Hardware teams supported', '15 to 25 a year, 2 resident studios'],
  ['Direct jobs', '14 (6 of them non-technical roles trained on the AI tools)'],
  ['Diesel avoided by solar + battery', 'About 1,000 L a month against a generator-only site'],
] as const
