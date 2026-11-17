// Prints scenario results from web/src/data/model.ts.  Run: npx tsx model/run.ts
import { project, capex, type Options } from '../web/src/data/model'

const combos: Options[] = [
  { space: 'lease', power: 'own', scope: 'full', case: 'base' },
  { space: 'lease', power: 'lease', scope: 'full', case: 'base' },
  { space: 'partner', power: 'lease', scope: 'full', case: 'base' },
  { space: 'lease', power: 'lease', scope: 'lean', case: 'base' },
  { space: 'partner', power: 'own', scope: 'full', case: 'base' },
  { space: 'lease', power: 'lease', scope: 'full', case: 'low' },
  { space: 'partner', power: 'lease', scope: 'full', case: 'low' },
  { space: 'lease', power: 'lease', scope: 'full', case: 'high' },
]
for (const o of combos) {
  const p = project(o)
  const m = p.mature
  console.log(
    `${o.space}/${o.power}/${o.scope}/${o.case}: capex $${Math.round(p.capexUsd / 1000)}k | opex ₦${(p.opex / 1e6).toFixed(1)}m/mo | M24 rev ₦${(m.revenue / 1e6).toFixed(1)}m ebitda ₦${(m.ebitda / 1e6).toFixed(1)}m ($${Math.round((m.ebitda * 12) / 1355 / 1000)}k/yr) | BE m${p.breakeven} | payback m${p.payback}`,
  )
}
const g: Record<string, number> = {}
for (const l of capex(combos[1])) g[l.group] = (g[l.group] || 0) + l.usd
console.log(g)

console.log('--- 60-month payback + partner case breakdown ---')
for (const o of combos) {
  const p = project(o, 72)
  console.log(`${o.space}/${o.power}/${o.scope}/${o.case}: payback m${p.payback} | yr2 ebitda ₦${((p.mature.ebitda * 12) / 1e6).toFixed(0)}m | M24 cogs ₦${(p.mature.cogs / 1e6).toFixed(1)}m`)
}
const partner = combos[2]
const pg: Record<string, number> = {}
for (const l of capex(partner)) pg[l.group] = (pg[l.group] || 0) + l.usd
console.log('partner groups', pg)
const pp = project(partner)
console.log('revenue mix M24', Object.fromEntries(Object.entries(pp.mature.byStream).map(([k, v]) => [k, Math.round(v / 1e5) / 10])))
console.log('opex lines', Object.fromEntries(Object.entries(pp.opexLines).map(([k, v]) => [k, Math.round(v / 1e5) / 10])))
