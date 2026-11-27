// Atoms brand. GIC-inspired: warm parchment, quiet serif, hairlines, one clear blue.
export const BRAND = {
  name: 'Atoms',
  city: 'Lagos',
  full: 'Atoms Lagos',
  tagline: 'Where Lagos builds hardware',
  category: 'Café, workshop and lab',
  colors: {
    // legacy keys kept so 3D props keep compiling; values follow the new system
    yellow: '#41A1CF', // signal blue, the single accent
    green: '#5E7D6A', // sage, from the green tinted hairlines
    ink: '#1F1F29', // dusk
    paper: '#FEFFFC', // parchment
    clay: '#B8875B', // timber
    sky: '#7FA7C2',
    violet: '#8C7BC0',
    teal: '#5FA89C',
    rose: '#D88A7C',
    parchment: '#FEFFFC',
    linen: '#F9FAF7',
    graphite: '#2C2C2C',
    charcoal: '#444141',
    ash: '#646464',
    mist: '#DEE2DE',
    twilight: '#282834',
    blue: '#41A1CF',
    cerulean: '#0081C0',
    timber: '#B8875B',
  },
}

export const DANFO = '#F2C230'
export const NAIJA_GREEN = '#0E7A4F'

export const NAIRA = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG')
export const NAIRA_SHORT = (n: number) => {
  const a = Math.abs(n)
  const s = n < 0 ? '-' : ''
  if (a >= 1e9) return s + '₦' + (a / 1e9).toFixed(2) + 'bn'
  if (a >= 1e6) return s + '₦' + (a / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'm'
  if (a >= 1e3) return s + '₦' + (a / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'k'
  return s + '₦' + Math.round(a)
}

// Inline SVG mark: a nucleus and one orbit, hairline. Used in nav, favicon and signage.
export const MARK_SVG = (stroke = '#2C2C2C', size = 22) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><ellipse cx="12" cy="12" rx="10" ry="4.2" transform="rotate(-28 12 12)" stroke="${stroke}" stroke-width="1.2"/><circle cx="12" cy="12" r="2.2" fill="${stroke}"/></svg>`
