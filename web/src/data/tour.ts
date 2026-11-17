import type { Shot } from '../engine/CameraRig'
import type { WallMode } from '../world/Building'

export interface TourStop {
  kicker: string
  title: string
  body: string
  stats?: [string, string][]
  shot: Shot
  walls: WallMode
  time?: number
  speed?: number
  action?: 'outage' | 'drone' | 'dashboard'
  room?: string
  hold?: number
  orbit?: number
  flyTime?: number
  live?: 'library' | 'ops'
  cta?: boolean
}

// Numbers cite research/*.md (Nov 2026). Keep copy short: people read this on phones.
export const TOUR: TourStop[] = [
  {
    kicker: 'Yaba, Lagos',
    title: 'From the street, it’s a café',
    body: 'Coffee, Wi-Fi and a window bar. Look past the counter and the back wall is a row of working 3D printers.',
    stats: [['Site', '≈1,120 m² converted warehouse'], ['Hours', '7:30am – 10pm'], ['Near', 'UNILAG + Yabatech (≈83k students)']],
    shot: { target: [23, 2.6, 27.5], dist: 21, az: 0.78, pol: 1.32 }, walls: 'up', hold: 8, flyTime: 2.6,
  },
  {
    kicker: 'The plan',
    title: 'Lift the roof',
    body: 'One floor, nine zones. Public at the front, members in the middle, controlled labs at the back, so noise and chemicals stay far from the coffee.',
    stats: [['Bench seats', '24'], ['3D printers', '18'], ['Team studios', '2'], ['Wet lab + drone cage', '1 + 1']],
    shot: { target: [20, 0, 13.5], dist: 58, az: 0.5, pol: 0.74 }, walls: 'cutaway', hold: 10, orbit: 0.035, flyTime: 3,
  },
  {
    kicker: 'Front of house',
    title: 'The front door is a café',
    body: 'Anyone can walk in. Members tap in at the kiosk and pass the glass gate. A day pass costs about the same as a CafeOne pass, but includes a bench, a scope and a soldering iron.',
    stats: [['Day pass', '₦10,000'], ['CafeOne day pass', '₦8,525'], ['Student', '₦4,000'], ['Maker monthly', '₦75,000']],
    shot: { target: [21, 0.6, 23.4], dist: 15, az: 0.22, pol: 0.96 }, walls: 'cutaway', room: 'cafe', hold: 10,
  },
  {
    kicker: 'Print farm',
    title: 'A wall of printers, on show',
    body: '16 FDM and 2 resin printers face the café through glass. Members queue jobs from their phones. A camera AI pauses failed prints and pings staff.',
    stats: [['Printing', '₦120/g'], ['Material cost', '≈₦50/g'], ['Runs', 'overnight too']],
    shot: { target: [24.5, 1.3, 19.6], dist: 8.5, az: 0.05, pol: 1.2 }, walls: 'down', hold: 9,
  },
  {
    kicker: 'Bench hall',
    title: '24 seats, fully kitted',
    body: 'Every seat has an oscilloscope, bench supply, soldering station and fume extraction. Members pay for the seat, not the gear.',
    stats: [['Kit per 4-seat bench', '≈$4.8k'], ['Seats', '24'], ['Pro monthly', '₦130,000']],
    shot: { target: [23.5, 0.7, 15], dist: 12.5, az: 0.7, pol: 0.86 }, walls: 'cutaway', room: 'bench', hold: 9,
  },
  {
    kicker: 'Component library',
    title: 'No trip to Computer Village',
    body: 'Members order parts from their seat. A non-technical runner is routed to the exact aisle and bin and delivers to the bench. Low stock reorders itself.',
    shot: { target: [34.5, 0.7, 15.5], dist: 13, az: -0.62, pol: 0.9 }, walls: 'cutaway', room: 'library', hold: 10, live: 'library',
  },
  {
    kicker: 'Fabrication',
    title: 'Make it real',
    body: 'CO₂ and desktop lasers, a 4×8 ft CNC router, a desktop PCB mill and a small SMT line. Induction first, then book by the hour.',
    stats: [['CNC', '₦25k/hr'], ['Laser', '₦300/min'], ['PCB', '₦15k/board']],
    shot: { target: [18.5, 0.7, 4], dist: 15, az: 0.3, pol: 0.86 }, walls: 'cutaway', room: 'fab', hold: 9,
  },
  {
    kicker: 'Drone cage',
    title: 'Fly it indoors first',
    body: 'A netted 6×6×4 m cage for test flights and tuning. Nigerian drone makers are scaling fast: Terra Industries raised about $52M in 2026 and needs trained hardware talent.',
    stats: [['Cage time', '₦12k/hr'], ['Size', '6 × 6 × 4 m']],
    shot: { target: [29.5, 1.4, 4], dist: 12, az: 0.62, pol: 0.98 }, walls: 'cutaway', action: 'drone', hold: 10,
  },
  {
    kicker: 'Wet lab',
    title: 'Lagos has no shared wet lab',
    body: 'A BSL-1 lab with fume hood, biosafety cabinet, PCR and incubator, rented by the day. Health founders can test before raising money for their own lab.',
    stats: [['Bench day', '₦15,000'], ['Bench month', '₦180,000']],
    shot: { target: [5, 0.7, 4.6], dist: 12.5, az: -0.42, pol: 0.9 }, walls: 'cutaway', room: 'wetlab', hold: 9,
  },
  {
    kicker: 'Studios',
    title: 'Room to grow',
    body: 'Two lockable team studios and a boardroom. Teams that outgrow a bench move in here, a few steps from the machines.',
    stats: [['Team studio', '₦650k/month'], ['Boardroom', 'bookable']],
    shot: { target: [7, 0.7, 15.5], dist: 13, az: -0.5, pol: 0.86 }, walls: 'cutaway', room: 'studioA', hold: 8,
  },
  {
    kicker: 'Classroom',
    title: 'Robotics Saturdays',
    body: 'Kids’ robotics at weekends, bootcamps on weekdays, and practical sessions for online universities. Lagos parents already pay ₦45k–₦100k a month for coding classes.',
    stats: [['Kids session', '₦15,000'], ['Seats', '24']],
    shot: { target: [5, 0.7, 24], dist: 13, az: -0.28, pol: 0.92 }, walls: 'cutaway', room: 'classroom', hold: 8,
  },
  {
    kicker: 'Power',
    title: 'NEPA takes light. Nothing stops.',
    body: 'Solar on the roof, a 200 kWh battery, and a generator only as a last resort. Watch the ticker: we’re cutting the grid now.',
    stats: [['Solar', '≈50 kWp'], ['Battery', '200 kWh LFP'], ['Grid vs diesel', '₦209 vs ₦519–960 /kWh']],
    shot: { target: [36.5, 0.9, 3], dist: 12.5, az: 0.85, pol: 0.88 }, walls: 'cutaway', action: 'outage', hold: 11,
  },
  {
    kicker: 'AI operations',
    title: '2 technical leads, 6 non-technical staff',
    body: 'AI copilots tell staff where parts live, how to fix common faults and what to restock. Managers build small tools themselves when a new problem shows up.',
    shot: { target: [21, 0, 14], dist: 48, az: 0.5, pol: 0.72 }, walls: 'cutaway', action: 'dashboard', hold: 12, live: 'ops',
  },
  {
    kicker: 'Fridays, 6pm',
    title: 'Demo Night',
    body: 'Teams show prototypes to the community, press and investors. This is where Lagos hardware gets seen.',
    shot: { target: [28, 1.2, 23], dist: 12.5, az: -1.05, pol: 1.05 }, walls: 'cutaway', time: 17 * 60 + 58, speed: 2, hold: 14,
  },
  {
    kicker: 'The ask',
    title: 'Let’s build the first one',
    body: 'First site: about $300k (≈₦406m). We’re looking for partners: a bank, a university, a hardware company and the state.',
    shot: { target: [20, 0, 14], dist: 62, az: 0.75, pol: 0.82 }, walls: 'cutaway', hold: 999, orbit: 0.04, cta: true,
  },
]
