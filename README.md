# Lagos Hardware Lab (working name: Forge Lagos)

A pitch kit for a hardware coworking lab in Yaba, Lagos: café + makerspace + components library + shared wet lab, run by a small team with AI ops tools.

## What's here

| Folder | What |
|---|---|
| `research/` | Market research (Nov 2026): landscape & comparables, Lagos economics, location & demand, stakeholders |
| `web/` | Playable 3D sim of the lab (Three.js + React). Deployed to https://lab.harunafaruk.com/sim/ |
| `design/` | Architecture: floor plan, zoning, equipment schedule |
| `model/` | Financial model (capex, opex, revenue, break-even) |
| `deck/` | Pitch deck material |

## Run the sim locally

```bash
cd web
npm install
npm run dev        # http://localhost:5173/sim/
npm run build && npx wrangler deploy   # deploy to Cloudflare
```

URL params: `?tour` starts the guided tour, `?live` skips the intro, `?ff=120` fast-forwards 120 sim minutes, `?q=low|medium|high` forces render quality.

The building layout lives in `web/src/data/layout.ts` and drives both the 3D sim and the plan drawings.
