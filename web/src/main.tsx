import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter'
import '@fontsource-variable/bricolage-grotesque'
import './ui/styles.css'
import { App } from './ui/App'
import { useUI } from './ui/store'

const ui = document.getElementById('ui')!
createRoot(ui).render(<App />)

// Defer the heavy 3D boot one frame so the intro paints first.
requestAnimationFrame(async () => {
  await document.fonts.ready.catch(() => {})
  const { Game } = await import('./engine/Game')
  const game = new Game(document.getElementById('app')!)
  ;(window as any).game = game
  game.pushUI(true)
  useUI.getState().set({ ready: true })
  const params = new URLSearchParams(location.search)
  if (params.has('ff')) game.fastForward(Number(params.get('ff')) || 120)
  if (params.has('tour')) game.startTour(Number(params.get('tour')) || 0)
  else if (params.has('live')) game.endTour()
  if (params.has('shot')) {
    const { ZONE_SHOTS } = await import('./engine/Game')
    const sh = ZONE_SHOTS[params.get('shot') as string]
    if (sh) game.rig.cut(sh)
    if (params.get('walls')) game.setWalls(params.get('walls') as any)
  }
})
