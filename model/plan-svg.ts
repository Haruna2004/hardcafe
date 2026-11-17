// Writes the floor plan as standalone SVG files (for the deck and print).  Run: npx tsx model/plan-svg.ts
import { writeFileSync, mkdirSync } from 'node:fs'
import { planSVG } from '../web/src/site/plan'

const style = `<style>
.room{stroke:none}.furn{fill:#EDE8DD;stroke:#8A8F96;stroke-width:0.8}.furn.dash{fill:none;stroke-dasharray:4 3}
.wall{stroke:#15171B;stroke-width:4;stroke-linecap:square}.wall.ext{stroke-width:7}.wall.glass{stroke:#4D8FB0;stroke-width:2.5}
.wall.window{stroke:#4D8FB0;stroke-width:3}.wall.counter{stroke:#15171B;stroke-width:2;stroke-dasharray:5 3}.wall.roller{stroke:#C8643B;stroke-width:3;stroke-dasharray:6 3}
.door{fill:none;stroke:#8A8F96;stroke-width:1}.street{stroke:#8A8F96;stroke-width:1;stroke-dasharray:8 6}.arrow{fill:#C8643B}
.north circle{fill:none;stroke:#15171B;stroke-width:1}.north path{fill:#15171B}.sb{fill:#EDE8DD;stroke:#15171B;stroke-width:0.8}.sb.dark{fill:#15171B}
.rl{font:700 11px Inter,Arial,sans-serif;fill:#15171B;text-anchor:middle}.ra{font:9.5px Inter,Arial,sans-serif;fill:#6C7178;text-anchor:middle}
.north text{font:700 11px Inter,Arial,sans-serif;text-anchor:middle;fill:#15171B}
</style>`

mkdirSync('design', { recursive: true })
// Labelled version (for print / docs)
const full = planSVG().replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/(<svg[^>]*>)/, `$1${style}`).replace(/<title>[^<]*<\/title>/g, '')
writeFileSync('design/floor-plan.svg', full)
// Text-free version (slides add their own labels)
const bare = planSVG({ compact: true }).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/(<svg[^>]*>)/, `$1${style}`).replace(/<text[^>]*>[^<]*<\/text>/g, '').replace(/<title>[^<]*<\/title>/g, '')
writeFileSync('design/floor-plan-bare.svg', bare)
console.log('full', full.length, 'bare', bare.length)
