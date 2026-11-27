import { useEffect, useState } from 'react'
import { useUI, type Snap, type SelView, type PlaySnap } from './store'
import { TOUR } from '../data/tour'
import { NAIRA, NAIRA_SHORT, MARK_SVG } from '../brand'
import { STREAM_LABEL, type Stream } from '../data/pricing'
import { ZONE_SHOTS } from '../engine/Game'
import { PLACES, PROJECTS, LOOKS, START_MONEY, type Action, type PlaceId } from '../play/content'
import { Play } from '../play/Play'
import { ICONS, UI_ICONS } from '../play/icons'

const Svg = ({ html, className = 'ic' }: { html: string; className?: string }) => <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
const dur = (m: number) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 >= 1 ? ` ${Math.round(m % 60)}m` : ''}` : `${Math.max(1, Math.round(m))}m`)
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function Brand() {
  return <a className="brand" href="/" aria-label="Atoms home"><Svg html={MARK_SVG('#2C2C2C', 20)} className="mark" /><span>Atoms</span></a>
}

function Modes() {
  const game = useUI((x) => x.game)
  const mode = useUI((x) => x.mode)
  const set = useUI((x) => x.set)
  return (
    <div className="seg" role="tablist">
      <button className={mode === 'play' ? 'on' : ''} onClick={() => { if (mode !== 'play') set({ mode: 'intro', modal: 'setup' }) }}>Play</button>
      <button className={mode === 'tour' ? 'on' : ''} onClick={() => game?.startTour(0)}>Tour</button>
      <button className={mode === 'live' ? 'on' : ''} onClick={() => game?.endTour()}>Watch</button>
    </div>
  )
}

function Intro() {
  const ready = useUI((x) => x.ready)
  const game = useUI((x) => x.game)
  const set = useUI((x) => x.set)
  const saved = ready ? Play.load() : null
  const resume = saved && !saved.s.ended
  return (
    <div className="hero-card">
      <h1>Step inside Atoms.</h1>
      <p>A café, workshop and lab in Yaba. Start with ₦1,000,000 and build something real, or take the tour.</p>
      <div className="row">
        {resume && <button className="btn dark" disabled={!ready} onClick={() => game?.startPlay(saved!)}>Continue, day {saved!.s.day + 1}</button>}
        <button className={resume ? 'btn outline' : 'btn dark'} disabled={!ready} onClick={() => set({ modal: 'setup' })}>{resume ? 'New game' : 'Play'}</button>
        <button className="btn outline" disabled={!ready} onClick={() => game?.startTour(0)}>Take the tour</button>
        <button className="btn ghost" disabled={!ready} onClick={() => game?.endTour()}>Just watch</button>
      </div>
      {!ready && <div className="loading"><i /> Opening the doors</div>}
    </div>
  )
}

const NAMES = ['Ada', 'Tobi', 'Zainab', 'Chidi', 'Amaka', 'Seyi', 'Ife', 'Musa', 'Kemi', 'Obinna']

function Setup() {
  const game = useUI((x) => x.game)
  const set = useUI((x) => x.set)
  const [name, setName] = useState(() => NAMES[Math.floor(Math.random() * NAMES.length)])
  const [look, setLook] = useState(LOOKS[0].id)
  const [project, setProject] = useState(PROJECTS[0].id)
  const start = () => {
    Play.clear()
    const p = new Play({ name: name.trim().slice(0, 18) || 'Ada', look, project })
    p.save()
    game?.startPlay(p)
  }
  return (
    <div className="scrim">
      <div className="modal setup">
        <button className="x" onClick={() => set({ modal: null })} aria-label="Close"><Svg html={UI_ICONS.close} /></button>
        <h2>Who are you?</h2>
        <div className="who">
          <label className="field"><span>Name</span><input value={name} maxLength={18} onChange={(e) => setName(e.target.value)} /></label>
          <div className="looks" role="radiogroup" aria-label="Look">
            {LOOKS.map((l) => (
              <button key={l.id} role="radio" aria-checked={look === l.id} className={`look ${look === l.id ? 'on' : ''}`} onClick={() => setLook(l.id)} aria-label={`Look ${l.id}`}>
                <span className="face" style={{ background: l.skin }} /><span className="shirt" style={{ background: l.top }} />
              </button>
            ))}
          </div>
        </div>
        <h3>What will you build?</h3>
        <div className="projects">
          {PROJECTS.map((p) => (
            <button key={p.id} className={`project ${project === p.id ? 'on' : ''}`} onClick={() => setProject(p.id)}>
              <span className="tag">{p.sector}</span>
              <b>{p.name}</b>
              <span>{p.pitch}</span>
            </button>
          ))}
        </div>
        <div className="foot">
          <div className="balance"><span>You start with</span><b>{NAIRA(START_MONEY)}</b></div>
          <button className="btn dark" onClick={start}>Start day one <Svg html={UI_ICONS.arrow} /></button>
        </div>
      </div>
    </div>
  )
}

function PlayTop({ p }: { p: PlaySnap }) {
  const L = LOOKS.find((l) => l.id === p.look) ?? LOOKS[0]
  return (
    <div className="playtop">
      <div className="pill me">
        <span className="avatar" style={{ background: L.top }}><span style={{ background: L.skin }} /></span>
        <div><b>{p.name}</b><small>Day {p.dayNo}, {p.day.slice(0, 3)} {p.time}</small></div>
      </div>
      <div className="pill wallet">
        <b className="money">{NAIRA(p.money)}</b>
        <div className="needs">
          <div className="need" title={`Energy ${Math.round(p.energy)}`}><Svg html={UI_ICONS.bolt} /><i><em style={{ width: `${p.energy}%` }} className={p.energy < 25 ? 'low' : ''} /></i></div>
          <div className="need" title={`Fed ${Math.round(p.fed)}`}><Svg html={ICONS.cup} /><i><em style={{ width: `${p.fed}%` }} className={p.fed < 25 ? 'low' : ''} /></i></div>
          <span className={`mood ${p.mood.tone}`}>{p.mood.label}</span>
        </div>
      </div>
    </div>
  )
}

function Goal({ p }: { p: PlaySnap }) {
  const set = useUI((x) => x.set)
  const [open, setOpen] = useState(false)
  return (
    <div className="goal">
      {p.current ? (
        <div className="doing-now">
          <div className="dn-top"><span>{p.current.verb}</span><small>{dur(p.current.left)} left</small></div>
          <i className="bar"><em style={{ width: `${p.current.progress * 100}%` }} /></i>
        </div>
      ) : (
        <button className="next" onClick={() => set({ sheet: p.goal.place })}>
          <span className="lbl">Next</span>
          <span className="txt">{p.goal.text}</span>
          <Svg html={UI_ICONS.arrow} />
        </button>
      )}
      <button className="build" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{p.projectName}</span>
        <span className="dots">{p.steps.map((s) => <i key={s.id} className={s.done ? 'on' : ''} />)}</span>
        <b>{p.progress}%</b>
      </button>
      {open && (
        <div className="stats">
          <ol className="steps">{p.steps.map((s) => <li key={s.id} className={s.done ? 'done' : ''}>{s.label}</li>)}</ol>
          <div className="skills">
            {p.skills.map((k) => (
              <div key={k.id} className="skill"><span>{k.name}</span><b>{k.level}</b><i><em style={{ width: `${k.pct * 100}%` }} /></i></div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function Controls() {
  const game = useUI((x) => x.game)
  const snap = useUI((x) => x.snap)
  const [paused, setPaused] = useState(false)
  const toggle = () => {
    if (!game) return
    game.director.userPaused = !paused
    game.sim.speedIdx = paused ? 1 : 0
    setPaused(!paused)
  }
  return (
    <div className="controls">
      {snap && snap.speedIdx === 3 && <span className="ff">Skipping ahead</span>}
      <button className="round" onClick={() => game?.director.findMe()} aria-label="Find me"><Svg html={UI_ICONS.locate} /></button>
      <button className="round" onClick={toggle} aria-label={paused ? 'Resume' : 'Pause'}><Svg html={paused ? UI_ICONS.play : UI_ICONS.pause} /></button>
    </div>
  )
}

function Sheet({ place }: { place: PlaceId }) {
  const game = useUI((x) => x.game)
  const set = useUI((x) => x.set)
  useUI((x) => x.play)
  const P = game?.director.play
  if (!P || !game) return null
  const pl = PLACES.find((x) => x.id === place)!
  const minute = game.sim.minute % 1440
  const list = place === 'street' ? [] : P.actionsFor(place)
  const busy = !!P.current || P.queue.length > 0
  const gains = (a: Action) => {
    const g: string[] = []
    if (a.gain.money) g.push(`+${NAIRA_SHORT(a.gain.money)}`)
    if (a.gain.progress) g.push(`+${a.gain.progress}% build`)
    for (const [k, v] of Object.entries(a.gain.xp ?? {})) g.push(`+${v} ${k}`)
    if (a.energy < 0) g.push(`+${-a.energy} energy`)
    if (a.gain.unlock && a.gain.unlock !== 'pitched') g.push('unlocks machines')
    if (a.gain.member) g.push(`${a.gain.member} days access`)
    if (a.id === 'pitch') g.push('grant on the line')
    return g
  }
  return (
    <div className="sheet" role="dialog" aria-label={pl.name}>
      <div className="sheet-head">
        <Svg html={ICONS[pl.icon]} className="ic big" />
        <div><h3>{pl.name}</h3><p>{pl.line}</p></div>
        <button className="x" onClick={() => set({ sheet: null })} aria-label="Close"><Svg html={UI_ICONS.close} /></button>
      </div>
      <div className="rows">
        {place === 'street' ? (
          <button className="act" onClick={() => { game.director.goHome(); set({ sheet: null }) }} disabled={busy}>
            <div className="a-main"><b>Go home for the day</b><span className="meta"><span>See your recap</span></span></div>
          </button>
        ) : list.map((a) => {
          const c = P.check(a, minute)
          const ok = c.ok && !busy
          return (
            <button key={a.id} className={`act${a.step ? ' step' : ''}${a.gig ? ' gig' : ''}`} disabled={!ok} onClick={() => game.director.doAction(a)}>
              <div className="a-main">
                <b>{a.label}</b>
                <span className="meta">
                  <span><Svg html={UI_ICONS.clock} />{dur(a.minutes)}</span>
                  {a.cost > 0 && <span>{NAIRA(a.cost)}</span>}
                  {a.energy > 0 && <span><Svg html={UI_ICONS.bolt} />{a.energy}</span>}
                </span>
                {!c.ok && <span className="why"><Svg html={UI_ICONS.lock} />{c.why}</span>}
              </div>
              <div className="gains">{gains(a).map((g) => <span key={g}>{g}</span>)}</div>
            </button>
          )
        })}
        {busy && <p className="empty">Finish what you are doing first.</p>}
      </div>
    </div>
  )
}

function Morning() {
  const game = useUI((x) => x.game)
  const P = game?.director.play
  if (!P) return null
  const opts: { id: 'danfo' | 'walk' | 'bolt'; t: string; d: string }[] = [
    { id: 'danfo', t: 'Danfo', d: '₦500, a little tiring' },
    { id: 'walk', t: 'Walk', d: 'Free, costs energy' },
    { id: 'bolt', t: 'Bolt', d: '₦4,500, arrive fresh' },
  ]
  return (
    <div className="scrim soft">
      <div className="modal small">
        <span className="eyebrow">Day {P.s.day + 1}</span>
        <h2>{DAYS[P.s.day % 7]} morning.</h2>
        {P.s.today.notes.map((n) => <p key={n} className="note">{n}</p>)}
        <h3>How are you getting in?</h3>
        <div className="choices">
          {opts.map((o) => <button key={o.id} className="choice" onClick={() => game?.director.startDay(o.id)}><b>{o.t}</b><span>{o.d}</span></button>)}
        </div>
      </div>
    </div>
  )
}

function Recap() {
  const game = useUI((x) => x.game)
  const r = game?.director.recap
  const P = game?.director.play
  if (!r || !P) return null
  const net = r.earned - r.spent
  return (
    <div className="scrim">
      <div className="modal small">
        <span className="eyebrow">Day {r.day + 1} done</span>
        <h2>{net >= 0 ? 'A good day.' : r.progress > 0 ? 'A building day.' : 'Rest up.'}</h2>
        <div className="kv">
          <div><span>Earned</span><b>{NAIRA(r.earned)}</b></div>
          <div><span>Spent</span><b>{NAIRA(r.spent)}</b></div>
          <div><span>Balance</span><b>{NAIRA(P.s.money)}</b></div>
          <div><span>Build</span><b>{P.s.progress}%</b></div>
        </div>
        {Object.keys(r.xp).length > 0 && <div className="chips">{Object.entries(r.xp).map(([k, v]) => <span key={k}>+{v} {k}</span>)}</div>}
        <button className="btn dark wide" onClick={() => game?.director.nextDay()}>Next day <Svg html={UI_ICONS.arrow} /></button>
      </div>
    </div>
  )
}

function Ending({ p }: { p: PlaySnap }) {
  const set = useUI((x) => x.set)
  return (
    <div className="scrim">
      <div className="modal small">
        <span className="eyebrow">Day {p.dayNo}</span>
        <h2>You raised ₦15m.</h2>
        <p className="note">From a day pass to a funded {p.projectName.toLowerCase()} in {p.dayNo} days.</p>
        <div className="kv">
          <div><span>Grant</span><b>{NAIRA(p.grant)}</b></div>
          <div><span>Balance</span><b>{NAIRA(p.money)}</b></div>
          {p.skills.map((k) => <div key={k.id}><span>{k.name}</span><b>Level {k.level}</b></div>)}
        </div>
        <div className="row">
          <button className="btn dark" onClick={() => { Play.clear(); set({ modal: 'setup', mode: 'intro' }) }}>Play again</button>
          <a className="btn outline" href="/#contact">Talk to the team</a>
        </div>
      </div>
    </div>
  )
}

function Toasts() {
  const toasts = useUI((x) => x.toasts)
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.money ? <b>+{NAIRA_SHORT(t.money)}</b> : null}<span>{t.text}</span></div>)}
    </div>
  )
}

function TourCard({ s }: { s: Snap }) {
  const game = useUI((x) => x.game)
  const idx = useUI((x) => x.tourIndex)
  const autoplay = useUI((x) => x.autoplay)
  const set = useUI((x) => x.set)
  const stop = TOUR[idx]
  if (!stop) return null
  const live: [string, string][] = stop.live === 'library' ? [['Parts delivered today', String(s.reqDone)]] : []
  const stats = [...(stop.stats ?? []), ...live]
  return (
    <div className="tour">
      <div className="progress">{TOUR.map((_, i) => <i key={i} className={i <= idx ? 'on' : ''} onClick={() => game?.applyTourStop(i)} />)}</div>
      <span className="eyebrow">{stop.kicker}</span>
      <h2>{stop.title}</h2>
      <p>{stop.body}</p>
      {stats.length > 0 && <div className="stats">{stats.map(([k, v]) => <div key={k}><b>{v}</b><span>{k}</span></div>)}</div>}
      {stop.cta ? (
        <div className="row">
          <button className="btn dark" onClick={() => set({ modal: 'setup', mode: 'intro' })}>Play Atoms</button>
          <a className="btn outline" href="/build">See the plan</a>
        </div>
      ) : (
        <div className="row">
          <button className="btn ghost" disabled={idx === 0} onClick={() => game?.applyTourStop(idx - 1)}>Back</button>
          <button className="btn ghost" onClick={() => set({ autoplay: !autoplay })}>{autoplay ? 'Pause' : 'Auto'}</button>
          <button className="btn dark" onClick={() => game?.applyTourStop(idx + 1)}>Next <Svg html={UI_ICONS.arrow} /></button>
        </div>
      )}
    </div>
  )
}

const ZONES: [keyof typeof ZONE_SHOTS, string][] = [
  ['overview', 'Whole floor'], ['street', 'Street'], ['cafe', 'Café'], ['bench', 'Bench hall'], ['library', 'Parts library'],
  ['fab', 'Fab shop'], ['drone', 'Drone cage'], ['wetlab', 'Wet lab'], ['studios', 'Studios'], ['classroom', 'Classroom'],
]

function Watch({ s }: { s: Snap }) {
  const game = useUI((x) => x.game)
  const set = useUI((x) => x.set)
  const dashboard = useUI((x) => x.dashboard)
  const [open, setOpen] = useState(() => window.innerWidth > 900)
  return (
    <>
      <div className={`rail ${open ? 'open' : ''}`}>
        <button className="rail-t" onClick={() => setOpen(!open)}>{open ? 'Hide' : 'Places'}</button>
        {open && ZONES.map(([id, label]) => (
          <button key={id} onClick={() => { game?.flyZone(id); game?.setWalls(id === 'street' ? 'up' : 'cutaway') }}>{label}</button>
        ))}
        {open && <button className="accent" onClick={() => { game?.jumpTo(17 * 60 + 58); game?.setSpeed(2); game?.flyZone('cafe') }}>Friday Demo Night</button>}
      </div>
      <div className="watchbar">
        <span className="clock">{s.day.slice(0, 3)} {s.time}</span>
        {[0, 1, 2, 3].map((i) => (
          <button key={i} className={s.speedIdx === i ? 'on' : ''} onClick={() => game?.setSpeed(i)} aria-label={i === 0 ? 'Pause' : `Speed ${[0, 1, 3, 8][i]}x`}>{i === 0 ? <Svg html={UI_ICONS.pause} /> : `${[0, 1, 3, 8][i]}×`}</button>
        ))}
        <button className={`money ${dashboard ? 'on' : ''}`} onClick={() => set({ dashboard: !dashboard })}>{NAIRA_SHORT(s.total)}</button>
      </div>
    </>
  )
}

function Inspector({ sel }: { sel: SelView }) {
  const game = useUI((x) => x.game)
  const mode = useUI((x) => x.mode)
  return (
    <div className="inspector">
      <button className="x" onClick={() => game?.select(null)} aria-label="Close"><Svg html={UI_ICONS.close} /></button>
      <span className="eyebrow">{sel.subtitle}</span>
      <h3>{sel.title}</h3>
      {sel.doing && <p className="doing"><i />{sel.doing}</p>}
      {sel.team ? <p className="body">{sel.team.pitch}</p> : sel.body ? <p className="body">{sel.body}</p> : null}
      {sel.status && <span className={`status ${sel.status.tone}`}>{sel.status.label}</span>}
      {mode !== 'play' && sel.rows.length > 0 && <dl>{sel.rows.slice(0, 3).map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>}
      {mode === 'play' && sel.kind === 'agent' && sel.id !== 'you' && <button className="btn outline wide" onClick={() => game?.director.chatWith(sel.id)}>Say hello</button>}
      {mode === 'live' && sel.kind === 'agent' && <button className="btn ghost" onClick={() => game?.followSelected()}>Follow</button>}
    </div>
  )
}

function Dashboard({ s }: { s: Snap }) {
  const set = useUI((x) => x.set)
  const rows = (Object.entries(s.revenue) as [Stream, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...rows.map(([, v]) => v))
  return (
    <div className="dash">
      <button className="x" onClick={() => set({ dashboard: false })} aria-label="Close"><Svg html={UI_ICONS.close} /></button>
      <span className="eyebrow">Today at Atoms</span>
      <h3>{NAIRA(s.total)}</h3>
      <div className="kv">
        <div><span>Check-ins</span><b>{s.checkins}</b></div>
        <div><span>Seats in use</span><b>{s.benchUsed}/{s.benchTotal}</b></div>
        <div><span>Machines running</span><b>{s.machinesActive}/{s.machinesTotal}</b></div>
        <div><span>Parts delivered</span><b>{s.reqDone}</b></div>
      </div>
      <div className="bars" role="table" aria-label="Revenue today by stream">
        {rows.map(([k, v]) => (
          <div key={k} className="bar" role="row" title={`${STREAM_LABEL[k]}: ${NAIRA(v)}`}>
            <span role="cell">{STREAM_LABEL[k]}</span><i><em style={{ width: `${(v / max) * 100}%` }} /></i><b role="cell">{NAIRA_SHORT(v)}</b>
          </div>
        ))}
        {!rows.length && <p className="empty">Doors open at 8am.</p>}
      </div>
    </div>
  )
}

function GLLost() {
  return (
    <div className="scrim">
      <div className="modal small">
        <h2>This device needs a lighter view.</h2>
        <p className="note">The 3D scene asked for more graphics memory than your browser allows.</p>
        <div className="row">
          <a className="btn dark" href="?q=low">Open light mode</a>
          <a className="btn outline" href="/">Back to Atoms</a>
        </div>
      </div>
    </div>
  )
}

export function App() {
  const s = useUI((x) => x.snap)
  const mode = useUI((x) => x.mode)
  const modal = useUI((x) => x.modal)
  const sheet = useUI((x) => x.sheet)
  const sel = useUI((x) => x.sel)
  const play = useUI((x) => x.play)
  const dashboard = useUI((x) => x.dashboard)
  const glLost = useUI((x) => x.glLost)
  useEffect(() => { document.body.dataset.mode = mode }, [mode])
  const ended = mode === 'play' && play && (modal === 'end' || (play.ended && !modal))
  return (
    <>
      <div className="topbar"><Brand />{s && <Modes />}</div>
      {mode === 'intro' && !modal && <Intro />}
      {modal === 'setup' && <Setup />}
      {mode === 'play' && play && (
        <>
          <PlayTop p={play} />
          {!modal && !sheet && <Goal p={play} />}
          {!modal && <Controls />}
          <Toasts />
        </>
      )}
      {mode === 'play' && modal === 'morning' && <Morning />}
      {mode === 'play' && modal === 'recap' && <Recap />}
      {ended && play && <Ending p={play} />}
      {mode === 'play' && sheet && !modal && <Sheet place={sheet} />}
      {mode === 'tour' && s && <TourCard s={s} />}
      {mode === 'live' && s && <Watch s={s} />}
      {sel && !sheet && !modal && mode !== 'tour' && mode !== 'intro' && <Inspector sel={sel} />}
      {mode === 'live' && dashboard && s && <Dashboard s={s} />}
      {glLost && <GLLost />}
    </>
  )
}
