import '@fontsource-variable/geist'
import '@fontsource/instrument-serif/400.css'
import './site.css'
import { MARK_SVG } from '../brand'

const WHATSAPP = '2348164475065'
const EMAIL = 'harunafaruk2004@gmail.com'

const LINKS: [string, string][] = [['/#inside', 'Inside'], ['/#plan', 'Plan'], ['/sim/', 'Play'], ['/build/', 'Build'], ['/landscape/', 'Landscape']]

export function mountChrome(active: string) {
  const nav = document.createElement('nav')
  nav.className = 'nav'
  nav.setAttribute('aria-label', 'Main')
  nav.innerHTML = `
    <a class="logo" href="/">${MARK_SVG('#2C2C2C', 20)}<span>Atoms</span></a>
    <div class="links">${LINKS.map(([h, t]) => `<a href="${h}" class="${t === active ? 'on' : ''}">${t}</a>`).join('')}</div>
    <a class="cta" href="/#contact">Talk to us</a>
    <button class="menu" aria-label="Menu"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8h16M4 16h16"/></svg></button>`
  document.body.prepend(nav)
  const sheet = document.createElement('div')
  sheet.className = 'sheetnav'
  sheet.innerHTML = `<button class="close" aria-label="Close"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 6l12 12M18 6 6 18"/></svg></button>${LINKS.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}<a href="/#contact">Talk to us</a>`
  document.body.append(sheet)
  nav.querySelector('.menu')!.addEventListener('click', () => sheet.classList.add('open'))
  sheet.querySelector('.close')!.addEventListener('click', () => sheet.classList.remove('open'))
  sheet.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => sheet.classList.remove('open')))

  const footer = document.createElement('footer')
  footer.innerHTML = `
    <div class="wrap">
      <div class="mk">${MARK_SVG('#2C2C2C', 26)}</div>
      <p class="big">Where Lagos builds hardware.</p>
      <div class="small">${LINKS.map(([h, t]) => `<a href="${h}">${t}</a>`).join('')}<a href="/#contact">Contact</a></div>
    </div>`
  document.body.append(footer)

  // gentle reveal on scroll
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }), { rootMargin: '0px 0px -8% 0px' })
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el))

  // Lagos clock
  const clock = document.getElementById('clock')
  if (clock) {
    const tick = () => {
      const t = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Africa/Lagos' })
      clock.innerHTML = `${t}<span>Yaba</span>`
    }
    tick()
    setInterval(tick, 20000)
  }
}

export function mountContact() {
  const form = document.querySelector<HTMLFormElement>('form.c')
  if (!form) return
  const reply = form.querySelector<HTMLDivElement>('.reply')!
  const go = form.querySelector<HTMLButtonElement>('.go')!
  const text = () => {
    const d = new FormData(form)
    const name = String(d.get('name') || '').trim()
    const org = String(d.get('org') || '').trim()
    const msg = String(d.get('msg') || '').trim()
    return `Hi Haruna, I'm ${name || 'interested in Atoms'}${org ? ` from ${org}` : ''}. ${msg}`.trim()
  }
  form.addEventListener('submit', (e) => {
    e.preventDefault()
    if (!form.reportValidity()) return
    go.style.display = 'none'
    reply.classList.add('on')
  })
  reply.querySelector<HTMLAnchorElement>('.wa')!.addEventListener('click', (e) => {
    ;(e.currentTarget as HTMLAnchorElement).href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text())}`
  })
  reply.querySelector<HTMLAnchorElement>('.em')!.addEventListener('click', (e) => {
    ;(e.currentTarget as HTMLAnchorElement).href = `mailto:${EMAIL}?subject=${encodeURIComponent('Atoms')}&body=${encodeURIComponent(text())}`
  })
}

export const CONTACT_HTML = `
  <section id="contact">
    <div class="wrap contact">
      <div>
        <div class="eyebrow">Contact</div>
        <h2 class="h2">Build it with us.</h2>
        <p class="lead">Banks, universities, hardware companies and the state each have a part in this. Tell us yours.</p>
      </div>
      <form class="c card" novalidate>
        <label class="field"><span>Your name</span><input name="name" required autocomplete="name"></label>
        <label class="field"><span>Organisation</span><input name="org" autocomplete="organization"></label>
        <label class="field"><span>What would you like to talk about?</span><textarea name="msg" rows="4" required></textarea></label>
        <button class="btn dark go" type="submit">Continue</button>
        <div class="reply">
          <p>How should we reply? Your message is filled in for you.</p>
          <a class="btn dark wa" href="#" target="_blank" rel="noopener">WhatsApp</a>
          <a class="btn outline em" href="#">Email</a>
        </div>
      </form>
    </div>
  </section>`
