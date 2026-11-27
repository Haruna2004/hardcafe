import '@fontsource-variable/geist'
import '@fontsource/instrument-serif/400.css'
import './site.css'
import { planSVG, ACCESS_LABEL } from './plan'
import { ROOMS } from '../data/layout'
import { capex, project, FX, type Options } from '../data/model'

const $ = <T extends HTMLElement = HTMLElement>(s: string) => document.querySelector(s) as T
const N = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG')
const NS = (n: number) => {
  const a = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (a >= 1e9) return sign + '₦' + (a / 1e9).toFixed(2) + 'bn'
  if (a >= 1e6) return sign + '₦' + (a / 1e6).toFixed(1) + 'm'
  if (a >= 1e3) return sign + '₦' + Math.round(a / 1e3) + 'k'
  return sign + '₦' + Math.round(a)
}
const USD = (n: number) => '$' + (n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : Math.round(n / 1000) + 'k')

// ── plan ──
$('#plan-svg').innerHTML = planSVG()
const legend = $('#plan-legend')
legend.innerHTML = ROOMS.filter((r) => !['labstreet', 'westhall', 'wc', 'prayer'].includes(r.id))
  .map((r) => `<div class="lg" data-room="${r.id}"><span class="sw" style="background:${r.accent}"></span><b>${r.name}</b><span>${(r.rect.w * r.rect.d).toFixed(0)} m² · ${ACCESS_LABEL[r.access]}</span></div>`)
  .join('')
legend.addEventListener('mouseover', (e) => {
  const id = (e.target as HTMLElement).closest('.lg')?.getAttribute('data-room')
  document.querySelectorAll('.plan .room').forEach((el) => el.classList.toggle('hl', el.getAttribute('data-room') === id))
})
legend.addEventListener('mouseleave', () => document.querySelectorAll('.plan .room').forEach((el) => el.classList.remove('hl')))

// ── numbers ──
const opts: Options = { space: 'partner', power: 'lease', scope: 'full', case: 'base' }
document.querySelectorAll<HTMLButtonElement>('.toggle button').forEach((b) => {
  b.addEventListener('click', () => {
    const k = b.parentElement!.dataset.key as keyof Options
    ;(opts as any)[k] = b.dataset.v
    render()
  })
})

function bars(rows: [string, number, string?][], fmt: (n: number) => string, cls = '') {
  const max = Math.max(1, ...rows.map((r) => r[1]))
  return `<div class="hbars ${cls}">${rows
    .map(([k, v, note]) => `<div class="hb" title="${k}: ${fmt(v)}${note ? ' · ' + note : ''}"><span class="hl">${k}</span><span class="ht"><span class="hf" style="width:${(v / max) * 100}%"></span></span><span class="hv">${fmt(v)}</span></div>`)
    .join('')}</div>`
}

function cashChart(months: { m: number; cash: number }[]) {
  const W = 640, H = 220, pl = 52, pr = 64, pt = 14, pb = 28
  const min = Math.min(0, ...months.map((x) => x.cash))
  const max = Math.max(0, ...months.map((x) => x.cash))
  const sx = (m: number) => pl + ((m - 1) / (months.length - 1)) * (W - pl - pr)
  const sy = (v: number) => pt + ((max - v) / (max - min || 1)) * (H - pt - pb)
  const d = months.map((x, i) => `${i ? 'L' : 'M'}${sx(x.m).toFixed(1)},${sy(x.cash).toFixed(1)}`).join('')
  const area = `${d} L${sx(months[months.length - 1].m)},${sy(0)} L${sx(1)},${sy(0)} Z`
  const ticks: number[] = []
  const step = Math.pow(10, Math.floor(Math.log10(Math.max(Math.abs(min), Math.abs(max))))) * (Math.max(Math.abs(min), max) / Math.pow(10, Math.floor(Math.log10(Math.max(Math.abs(min), max)))) > 4 ? 2 : 1)
  for (let v = Math.ceil(min / step) * step; v <= max; v += step) ticks.push(v)
  const last = months[months.length - 1]
  const pay = months.find((x) => x.cash > 0)
  let s = `<svg viewBox="0 0 ${W} ${H}" class="cash" role="img" aria-label="Cumulative cash position by month">`
  for (const t of ticks) s += `<line x1="${pl}" x2="${W - pr}" y1="${sy(t)}" y2="${sy(t)}" class="${t === 0 ? 'zero' : 'grid'}"/><text x="${pl - 8}" y="${sy(t) + 4}" class="yl">${NS(t)}</text>`
  for (const m of [1, 12, 24, 36, 48, 60]) if (m <= last.m) s += `<text x="${sx(m)}" y="${H - 8}" class="xl">${m === 1 ? 'Month 1' : 'M' + m}</text>`
  s += `<path d="${area}" class="area"/><path d="${d}" class="line"/>`
  if (pay) s += `<circle cx="${sx(pay.m)}" cy="${sy(pay.cash)}" r="5" class="dot"/><text x="${sx(pay.m)}" y="${sy(pay.cash) - 12}" class="ann">Payback · M${pay.m}</text>`
  s += `<circle cx="${sx(last.m)}" cy="${sy(last.cash)}" r="4.5" class="dot"/><text x="${sx(last.m) + 8}" y="${sy(last.cash) + 4}" class="endl">${NS(last.cash)}</text>`
  // hover targets
  for (const x of months) s += `<rect x="${sx(x.m) - (W - pl - pr) / months.length / 2}" y="${pt}" width="${(W - pl - pr) / months.length}" height="${H - pt - pb}" fill="transparent"><title>Month ${x.m}: ${NS(x.cash)} cumulative</title></rect>`
  return s + '</svg>'
}

function render() {
  document.querySelectorAll<HTMLButtonElement>('.toggle button').forEach((b) => b.classList.toggle('on', (opts as any)[b.parentElement!.dataset.key!] === b.dataset.v))
  const p = project(opts, 60)
  const m = p.mature
  $('#k-capex').textContent = USD(p.capexUsd)
  $('#k-capex-n').textContent = NS(p.capexNgn)
  $('#k-rev').textContent = NS(m.revenue)
  $('#k-opex').textContent = NS(p.opex)
  $('#k-ebitda').textContent = NS(m.ebitda * 12)
  $('#k-ebitda-u').textContent = USD((m.ebitda * 12) / FX) + ' a year'
  $('#k-be').textContent = p.breakeven ? `Month ${p.breakeven}` : 'Not in 5 yrs'
  $('#k-pay').textContent = p.payback ? `Month ${p.payback}` : 'Beyond 5 yrs'
  $('#cash-chart').innerHTML = cashChart(p.months)
  const groups: Record<string, number> = {}
  for (const l of capex(opts)) groups[l.group] = (groups[l.group] ?? 0) + l.usd
  $('#use-funds').innerHTML = bars(Object.entries(groups).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]), (n) => USD(n))
  $('#capex-lines').innerHTML = capex(opts).map((l) => `<tr><td>${l.group}</td><td>${l.label}${l.note ? `<small>${l.note}</small>` : ''}</td><td>${USD(l.usd)}</td></tr>`).join('')
  $('#rev-mix').innerHTML = bars(Object.entries(m.byStream).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]), NS)
  $('#opex-lines').innerHTML = bars(Object.entries(p.opexLines).sort((a, b) => b[1] - a[1]).map(([k, v]) => [k, v]), NS, 'muted')
}
render()

// ── location scorecard ──
const loc: [string, number][] = [['Yaba', 4.4], ['Ebute-Metta / Oyingbo', 3.55], ['Ikeja', 3.15], ['Surulere', 3.1], ['Lekki', 2.45], ['Victoria Island', 2.1]]
$('#loc-bars').innerHTML = bars(loc, (n) => n.toFixed(2) + ' / 5')

void N
