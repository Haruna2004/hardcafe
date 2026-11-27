import { createRoot } from 'react-dom/client'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import '@fontsource-variable/geist'
import './ui/styles.css'
import { App } from './ui/App'
import { useUI } from './ui/store'

const ui = document.getElementById('ui')!
createRoot(ui).render(<App />)

// Defer the heavy 3D boot one frame so the intro paints first.
requestAnimationFrame(async () => {
  await document.fonts.ready.catch(() => {})
  const { Game } = await import('./engine/Game')
  let game
  try {
    game = new Game(document.getElementById('app')!)
  } catch (e) {
    console.error(e)
    useUI.getState().set({ glLost: true })
    return
  }
  ;(window as any).game = game
  ;(window as any).atoms = { game, Play: (await import('./play/Play')).Play, ui: useUI }
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
