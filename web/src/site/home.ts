import { mountChrome, mountContact, CONTACT_HTML } from './shared'
import { planSVG } from './plan'
import { ROOMS } from '../data/layout'

document.getElementById('contact-slot')!.outerHTML = CONTACT_HTML
mountChrome('')
mountContact()

const plan = document.getElementById('plan-svg')!
plan.innerHTML = planSVG()
const legend = document.getElementById('legend')!
legend.innerHTML = ROOMS.filter((r) => !['labstreet', 'westhall', 'wc', 'prayer'].includes(r.id))
  .map((r) => `<div class="lg" data-room="${r.id}"><span class="sw" style="background:${r.accent}"></span>${r.name.replace(' (BSL-1)', '')}<small>${(r.rect.w * r.rect.d).toFixed(0)} m²</small></div>`)
  .join('')
const hl = (id: string | null) => plan.querySelectorAll('.room').forEach((el) => el.classList.toggle('hl', el.getAttribute('data-room') === id))
legend.addEventListener('mouseover', (e) => hl((e.target as HTMLElement).closest('.lg')?.getAttribute('data-room') ?? null))
legend.addEventListener('mouseleave', () => hl(null))
plan.addEventListener('mouseover', (e) => hl((e.target as Element).closest('.room')?.getAttribute('data-room') ?? null))
plan.addEventListener('mouseleave', () => hl(null))
