# Atoms

A café, a workshop and a shared lab in Yaba, Lagos. This repo holds the pitch kit: the website, a playable 3D sim, the floor plan, the financial model and the research behind it.

## Links

- Site: https://atomslab.harunafaruk.com/
- Sim, guided tour: https://atomslab.harunafaruk.com/sim/?tour
- Sim, play from ₦1,000,000: https://atomslab.harunafaruk.com/sim/
- The plan and numbers: https://atomslab.harunafaruk.com/build/
- The landscape, verified facts: https://atomslab.harunafaruk.com/landscape/

## What's here

| Folder | What |
|---|---|
| `web/` | The site and the sim (Vite, TypeScript, Three.js, React) |
| `web/src/data/layout.ts` | The building. Drives the 3D sim and the plan drawings |
| `web/src/data/model.ts` | Financial model: build cost, running cost, revenue, break-even |
| `web/src/play/` | Play mode: money, energy, skills, projects, Demo Night |
| `design/` | Floor plan drawings |
| `model/` | `npx tsx model/run.ts` prints every scenario |
| `research/` | `00-verified.md` holds the facts used in public. The other files are working notes from November 2026 |

## Headline numbers (base case)

- About $304k to build and open in a partner's building with leased solar. About $366k in a leased warehouse.
- About ₦12m a month to run in the partner case, with a first profitable month around month 7.

These are estimates until a quantity surveyor prices a real building.

## Run locally

```bash
cd web
npm install
npm run dev                            # http://localhost:5173
npm run build && npx wrangler deploy   # Cloudflare, atomslab.harunafaruk.com
```

Sim URL params: `?tour` starts the tour, `?live` skips the intro, `?ff=120` fast-forwards 120 sim minutes, `?q=low|medium|high` forces render quality.

Images in `web/public/img/gen/` were generated with FLUX through Runware. `manifest.json` holds their alt text and captions.
