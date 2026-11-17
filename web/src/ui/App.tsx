import { useEffect, useMemo, useState } from 'react'
import { useUI, type Snap, type SelView } from './store'
import { TOUR } from '../data/tour'
import { BRAND, NAIRA, NAIRA_SHORT } from '../brand'
import { STREAM_LABEL, type Stream } from '../data/pricing'
import { ZONE_SHOTS } from '../engine/Game'

const SPEED_ICONS = ['❚❚', '▶', '▶▶', '▶▶▶']

function Spark() {
  return (
    <svg width="22" height="22" viewBox="0 0 40 40" aria-hidden>
      <path d="M20 2 L24 16 L38 20 L24 24 L20 38 L16 24 L2 20 L16 16 Z" fill={BRAND.colors.yellow} />
    </svg>
  )
}

function Intro() {
  const game = useUI((s) => s.game)
  const set = useUI((s) => s.set)
  const ready = useUI((s) => s.ready)
  return (
    <div className="intro">
      <div className="intro-card">
        <div className="brandmark"><Spark /> <b>{BRAND.name}</b> <span>{BRAND.city}</span></div>
        <h1>{BRAND.tagline}.</h1>
        <p>A playable model of a hardware café, makerspace and lab for Yaba. Every person, machine and naira in here is simulated.</p>
        <div className="intro-actions">
          <button className="btn primary" disabled={!ready} onClick={() => game?.startTour(0)}>{ready ? '▶  Take the 3-minute tour' : 'Loading the lab…'}</button>
          <button className="btn ghost" disabled={!ready} onClick={() => { set({ mode: 'live' }); game?.endTour() }}>Explore freely</button>
        </div>
        <div className="hint">Drag to move · Scroll or pinch to zoom · Right-drag to rotate · Click anyone</div>
      </div>
    </div>
  )
}

function TopBar({ s }: { s: Snap }) {
  const game = useUI((x) => x.game)
  const mode = useUI((x) => x.mode)
  const set = useUI((x) => x.set)
  const dashboard = useUI((x) => x.dashboard)
  return (
    <div className="topbar">
      <div className="brandmark small" onClick={() => game?.flyZone('overview')}><Spark /> <b>{BRAND.name}</b> <span>{BRAND.city}</span></div>
      <div className="seg">
        <button className={mode === 'tour' ? 'on' : ''} onClick={() => game?.startTour(useUI.getState().tourIndex)}>Tour</button>
        <button className={mode === 'live' ? 'on' : ''} onClick={() => game?.endTour()}>Live</button>
      </div>
      <div className="clock">
        <div className="time"><span className="day">{s.day}</span> {s.time}</div>
        <div className="speeds">
          {SPEED_ICONS.map((ic, i) => (
            <button key={i} className={s.speedIdx === i ? 'on' : ''} onClick={() => game?.setSpeed(i)} aria-label={i === 0 ? 'Pause' : `Speed ${i}`}>{ic}</button>
          ))}
        </div>
      </div>
      <div className="pills">
        <div className={`pill ${s.grid ? '' : 'warn'}`} title="Power">
          {s.grid ? '⚡ Grid' : s.gen ? '🛢️ Generator' : '🔋 Battery'} <b>{Math.round(s.soc * 100)}%</b>
          <span className="muted"> ☀ {s.solar.toFixed(0)} kW</span>
        </div>
        <div className="pill" title="People inside now">👥 <b>{s.people}</b></div>
        <button className={`pill money ${dashboard ? 'on' : ''}`} onClick={() => set({ dashboard: !dashboard })} title="Open the ops dashboard">
          ₦ <b>{NAIRA_SHORT(s.total).slice(1)}</b> <span className="muted">today</span>
        </button>
      </div>
    </div>
  )
}

const ZONES: [keyof typeof ZONE_SHOTS, string][] = [
  ['overview', 'Whole floor'], ['street', 'Street view'], ['cafe', 'Café & stage'], ['bench', 'Bench hall'], ['library', 'Component library'],
  ['fab', 'Fabrication'], ['drone', 'Drone cage'], ['wetlab', 'Wet lab'], ['studios', 'Studios'], ['classroom', 'Classroom'], ['power', 'Power room'],
]

function LeftRail({ s }: { s: Snap }) {
  const game = useUI((x) => x.game)
  const [open, setOpen] = useState(window.innerWidth > 900)
  return (
    <div className={`rail ${open ? 'open' : ''}`}>
      <button className="rail-toggle" onClick={() => setOpen(!open)}>{open ? '✕' : '☰ Zones'}</button>
      {open && (
        <>
          <div className="rail-h">Go to</div>
          {ZONES.map(([id, label]) => (
            <button key={id} className="rail-btn" onClick={() => { game?.flyZone(id); if (id === 'street') game?.setWalls('up'); else if (s.walls === 'up') game?.setWalls('cutaway') }}>{label}</button>
          ))}
          <div className="rail-h">Walls</div>
          <div className="seg small">
            {(['up', 'cutaway', 'down'] as const).map((m) => (
              <button key={m} className={s.walls === m ? 'on' : ''} onClick={() => game?.setWalls(m)}>{m === 'cutaway' ? 'Cut' : m === 'up' ? 'Up' : 'Down'}</button>
            ))}
          </div>
          <div className="rail-h">Try it</div>
          <button className="rail-btn act" onClick={() => game?.triggerOutage()} disabled={!s.grid}>⚡ Cut the grid</button>
          <button className="rail-btn act" onClick={() => { game?.jumpTo(17 * 60 + 58); game?.setSpeed(2); game?.flyZone('cafe') }}>🎤 Jump to Demo Night</button>
        </>
      )}
    </div>
  )
}

function Bar({ v, tone = 'ok' }: { v: number; tone?: string }) {
  return <div className="meter"><div className={`fill ${tone}`} style={{ width: `${Math.round(Math.max(0, Math.min(1, v)) * 100)}%` }} /></div>
}

function Inspector({ sel }: { sel: SelView }) {
  const game = useUI((x) => x.game)
  return (
    <div className="inspector">
      <button className="close" onClick={() => game?.select(null)} aria-label="Close">✕</button>
      <div className="insp-kicker" style={sel.accent ? { color: 'var(--ink)' } : undefined}>
        {sel.kind === 'agent' ? 'Person' : sel.kind === 'prop' ? 'Equipment' : 'Zone'}{sel.accent && <span className="dot" style={{ background: sel.accent }} />}
      </div>
      <h3>{sel.title}</h3>
      <div className="insp-sub">{sel.subtitle}</div>
      {sel.status && <div className={`status ${sel.status.tone}`}>{sel.status.label}</div>}
      {sel.doing && <div className="doing"><span className="pulse" />{sel.doing}</div>}
      {sel.team && (
        <div className="team" style={{ borderColor: sel.team.color }}>
          <b>{sel.team.name}</b> <span className="muted">· {sel.team.sector}</span>
          <div>{sel.team.pitch}</div>
        </div>
      )}
      {sel.body && <p className="insp-body">{sel.body}</p>}
      <dl>
        {sel.rows.map(([k, v]) => (
          <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
        ))}
      </dl>
      {sel.progress !== undefined && (
        <div className="prog"><span>{sel.kind === 'agent' ? 'Project progress' : 'Job progress'}</span><Bar v={sel.progress} /></div>
      )}
      {sel.needs && (
        <div className="needs">
          {sel.needs.map(([k, v]) => (
            <div key={k} className="need"><span>{k}</span><Bar v={v} tone={v < 0.3 ? 'warn' : 'ok'} /></div>
          ))}
        </div>
      )}
      {sel.kind === 'agent' && (
        <div className="insp-actions">
          <button className="btn small" onClick={() => game?.followSelected()}>🎥 Follow</button>
        </div>
      )}
    </div>
  )
}

function TickerFeed({ s }: { s: Snap }) {
  const items = s.ticker.slice(0, 5)
  return (
    <div className="ticker">
      {items.map((t) => (
        <div key={t.id} className={`tick ${t.kind ?? ''}`}>
          <span className="ic">{t.icon}</span>
          <span className="tt">{t.text}</span>
        </div>
      ))}
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
  const liveStats: [string, string][] = stop.live === 'library'
    ? [['Requests done today', String(s.reqDone)], ['Avg fetch time', s.avgFetch ? `${s.avgFetch.toFixed(0)} min` : '—'], ['In the queue now', String(s.reqOpen)]]
    : stop.live === 'ops'
      ? [['Faults auto-detected', String(s.ticketsDone + s.ticketsOpen)], ['Avg fix time', s.avgFix ? `${s.avgFix.toFixed(0)} min` : '—'], ['Machines running', `${s.machinesActive}/${s.machinesTotal}`]]
      : []
  const stats = [...(stop.stats ?? []), ...liveStats]
  return (
    <div className="tourcard">
      <div className="tour-progress">{TOUR.map((_, i) => <span key={i} className={i <= idx ? 'on' : ''} onClick={() => game?.applyTourStop(i)} />)}</div>
      <div className="kicker">{stop.kicker} · {idx + 1}/{TOUR.length}</div>
      <h2>{stop.title}</h2>
      <p>{stop.body}</p>
      {stats.length > 0 && (
        <div className="stats">
          {stats.map(([k, v]) => <div key={k} className="stat"><b>{v}</b><span>{k}</span></div>)}
        </div>
      )}
      {stop.cta ? (
        <div className="tour-nav">
          <button className="btn primary" onClick={() => game?.endTour()}>Explore it live</button>
          <a className="btn ghost" href="../#numbers">See the numbers</a>
          <a className="btn ghost" href="../#plan">Floor plan</a>
        </div>
      ) : (
        <div className="tour-nav">
          <button className="btn ghost small" disabled={idx === 0} onClick={() => game?.applyTourStop(idx - 1)}>‹ Back</button>
          <button className="btn ghost small" onClick={() => set({ autoplay: !autoplay })}>{autoplay ? '❚❚ Auto' : '▶ Auto'}</button>
          <button className="btn primary small" onClick={() => game?.applyTourStop(idx + 1)}>Next ›</button>
          <button className="btn link small" onClick={() => game?.endTour()}>Skip tour</button>
        </div>
      )}
    </div>
  )
}

function RevenueBars({ s }: { s: Snap }) {
  const rows = (Object.entries(s.revenue) as [Stream, number][]).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...rows.map(([, v]) => v))
  if (!rows.length) return <div className="empty">No sales yet today. Doors open at 7:30.</div>
  return (
    <div className="rbars" role="table" aria-label="Revenue today by stream">
      {rows.map(([k, v]) => (
        <div key={k} className="rbar" role="row" title={`${STREAM_LABEL[k]}: ${NAIRA(v)}`}>
          <span className="rl" role="cell">{STREAM_LABEL[k]}</span>
          <span className="rt"><span className="rf" style={{ width: `${(v / max) * 100}%` }} /></span>
          <span className="rv" role="cell">{NAIRA_SHORT(v)}</span>
        </div>
      ))}
    </div>
  )
}

function HourColumns({ data, label, fmt }: { data: number[]; label: string; fmt: (n: number) => string }) {
  const hours = data.slice(7, 23)
  const max = Math.max(1, ...hours)
  const W = 300, H = 92, bw = 12, gap = (W - hours.length * bw) / (hours.length - 1)
  return (
    <svg className="cols" viewBox={`0 0 ${W} ${H + 16}`} role="img" aria-label={label}>
      <line x1="0" x2={W} y1={H} y2={H} className="axis" />
      {hours.map((v, i) => {
        const h = Math.max(v > 0 ? 3 : 0, (v / max) * (H - 6))
        const x = i * (bw + gap)
        const hr = i + 7
        return (
          <g key={i}>
            <rect x={x - gap / 2} y={0} width={bw + gap} height={H} fill="transparent"><title>{`${hr % 12 === 0 ? 12 : hr % 12}${hr >= 12 ? 'pm' : 'am'}: ${fmt(v)}`}</title></rect>
            {h > 0 && <path d={`M${x},${H} v${-(h - 4)} q0,-4 4,-4 h${bw - 8} q4,0 4,4 v${h - 4} z`} className="col"><title>{`${hr % 12 === 0 ? 12 : hr % 12}${hr >= 12 ? 'pm' : 'am'}: ${fmt(v)}`}</title></path>}
            {hr % 4 === 0 && <text x={x + bw / 2} y={H + 13} className="tick-label">{hr === 12 ? '12pm' : hr > 12 ? `${hr - 12}pm` : `${hr}am`}</text>}
          </g>
        )
      })}
    </svg>
  )
}

function Dashboard({ s }: { s: Snap }) {
  const set = useUI((x) => x.set)
  return (
    <div className="dash">
      <div className="dash-head">
        <div>
          <div className="kicker">Ops dashboard · live</div>
          <h3>{s.day}, {s.time}</h3>
        </div>
        <button className="close" onClick={() => set({ dashboard: false })} aria-label="Close">✕</button>
      </div>
      <div className="kpis">
        <div className="kpi"><b>{NAIRA_SHORT(s.total)}</b><span>Revenue today</span></div>
        <div className="kpi"><b>{s.checkins}</b><span>Check-ins</span></div>
        <div className="kpi"><b>{s.benchUsed}/{s.benchTotal}</b><span>Bench seats in use</span></div>
        <div className="kpi"><b>{s.machinesActive}/{s.machinesTotal}</b><span>Machines running</span></div>
      </div>
      <div className="dash-grid">
        <section>
          <h4>Revenue today, by stream</h4>
          <RevenueBars s={s} />
        </section>
        <section>
          <h4>Revenue by hour</h4>
          <HourColumns data={s.byHour} label="Revenue by hour today" fmt={(n) => NAIRA(n)} />
        </section>
        <section>
          <h4>AI ops queue <span className="muted">(staff copilots)</span></h4>
          {s.queue.length ? s.queue.map((q, i) => (
            <div key={i} className="qrow"><span className={`qs ${q.state}`}>{q.state}</span><span className="qw">{q.who}</span><span className="qt">{q.what}</span></div>
          )) : <div className="empty">Queue clear.</div>}
          <div className="mini">
            <span>Parts delivered: <b>{s.reqDone}</b> · avg <b>{s.avgFetch ? s.avgFetch.toFixed(0) : '—'} min</b></span>
            <span>Faults fixed: <b>{s.ticketsDone}</b> · avg <b>{s.avgFix ? s.avgFix.toFixed(0) : '—'} min</b></span>
          </div>
        </section>
        <section>
          <h4>Power</h4>
          <div className="power">
            <div className={`pw ${s.grid ? 'ok' : 'warn'}`}><b>{s.grid ? 'On' : 'Off'}</b><span>Grid</span></div>
            <div className="pw"><b>{s.solar.toFixed(0)} kW</b><span>Solar now</span></div>
            <div className="pw"><b>{s.load.toFixed(0)} kW</b><span>Load</span></div>
            <div className={`pw ${s.gen ? 'warn' : ''}`}><b>{s.gen ? 'Running' : 'Off'}</b><span>Generator</span></div>
          </div>
          <div className="prog"><span>Battery {Math.round(s.soc * 100)}%</span><Bar v={s.soc} tone={s.soc < 0.3 ? 'warn' : 'ok'} /></div>
          <div className="mini"><span>Outages today: <b>{s.outages}</b> · work stopped: <b>0 min</b></span></div>
        </section>
        {s.lowStock.length > 0 && (
          <section>
            <h4>Low stock <span className="muted">(draft POs waiting for approval)</span></h4>
            {s.lowStock.slice(0, 4).map((l) => <div key={l.name} className="qrow"><span className="qs warn">low</span><span className="qt">{l.name}: {l.stock} left (min {l.min})</span></div>)}
          </section>
        )}
      </div>
    </div>
  )
}

export function App() {
  const s = useUI((x) => x.snap)
  const mode = useUI((x) => x.mode)
  const sel = useUI((x) => x.sel)
  const dashboard = useUI((x) => x.dashboard)
  const narrow = useMemo(() => window.innerWidth < 760, [])
  useEffect(() => { document.body.dataset.mode = mode }, [mode])
  if (!s) return <Intro />
  return (
    <>
      <TopBar s={s} />
      {mode === 'intro' && <Intro />}
      {mode === 'live' && <LeftRail s={s} />}
      {mode === 'live' && !(narrow && (sel || dashboard)) && <TickerFeed s={s} />}
      {mode === 'tour' && <TourCard s={s} />}
      {sel && !(mode === 'tour' && narrow) && <Inspector sel={sel} />}
      {dashboard && <Dashboard s={s} />}
      {s.demo && mode === 'live' && <div className="banner">🎤 Demo Night is live on the café stage</div>}
      {!s.grid && <div className="banner warn">⚡ Grid outage · running on battery {s.gen ? '+ generator' : ''} · nothing stopped</div>}
    </>
  )
}
