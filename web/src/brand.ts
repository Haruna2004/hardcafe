// Working brand. Change here and it flows through the sim, signage and UI.
export const BRAND = {
  name: 'FORGE',
  city: 'LAGOS',
  full: 'Forge Lagos',
  tagline: 'Where Lagos builds hardware',
  category: 'Hardware café · Makerspace · Lab',
  colors: {
    yellow: '#F2C230', // danfo yellow
    green: '#0E7A4F', // naija green
    ink: '#15171B',
    paper: '#F6F3EC',
    clay: '#C8643B', // laterite
    sky: '#5BA4CF',
    violet: '#7B5CD6',
    teal: '#3FB6A8',
    rose: '#E8546B',
  },
}

export const NAIRA = (n: number) => '₦' + Math.round(n).toLocaleString('en-NG')
export const NAIRA_SHORT = (n: number) => {
  const a = Math.abs(n)
  if (a >= 1e9) return '₦' + (n / 1e9).toFixed(2) + 'bn'
  if (a >= 1e6) return '₦' + (n / 1e6).toFixed(a >= 1e7 ? 1 : 2) + 'm'
  if (a >= 1e3) return '₦' + (n / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'k'
  return '₦' + Math.round(n)
}
