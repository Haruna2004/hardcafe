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

## Links

- Site + interactive numbers: https://lab.harunafaruk.com/
- Playable 3D sim (guided tour): https://lab.harunafaruk.com/sim/?tour
- Pitch deck (Claude Slides, private until shared): https://claude.ai/artifact/78fk1E992abGyK1gUThBRL

## Key findings (Nov 2026)

- **Is anyone building this in Lagos?** No café + makerspace + parts + wet lab found. Lagos has partial pieces (UNILAG FabLab, under-used; CcHUB's education kit; B2B print bureaus). Public lab money is going to Abuja and Ilorin. Miva + Terra's drone/robotics labs started in Abuja, so Lagos is open.
- **Can Nigerians pay?** Yes at day-pass level: ₦10k/day vs CafeOne ₦8,525. A CafeOne month (₦170,501) is 79% of median formal pay, so memberships sit at ₦75k–₦130k and partners sponsor seats.
- **Best location:** Yaba (scored 4.40/5): UNILAG + Yabatech ≈ 83k students, 3 CafeOne hubs, CcHUB, Red Line stop. Fallback: Ebute-Metta.
- **Cost:** ≈$304k with partner-provided space and leased solar; ≈$366k if we lease a warehouse (Lagos landlords want rent upfront). Year-2 EBITDA ≈ ₦161m (partner case), break-even month 7.
- **Biggest risks:** single-funder dependence (Gearbox), capex-heavy sites (TechShop), staffing/maintenance, diesel + FX swings.

Details and sources: `research/01-landscape.md`, `02-economics.md`, `03-location-demand.md`, `04-stakeholders.md`. Model: `web/src/data/model.ts` (`npx tsx model/run.ts`). Floor plan: `design/floor-plan.svg`.

## Run the sim locally

```bash
cd web
npm install
npm run dev        # http://localhost:5173/sim/
npm run build && npx wrangler deploy   # deploy to Cloudflare
```

URL params: `?tour` starts the guided tour, `?live` skips the intro, `?ff=120` fast-forwards 120 sim minutes, `?q=low|medium|high` forces render quality.

The building layout lives in `web/src/data/layout.ts` and drives both the 3D sim and the plan drawings.
