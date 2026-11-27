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
  action?: 'drone'
  room?: string
  hold?: number
  orbit?: number
  flyTime?: number
  live?: 'library'
  cta?: boolean
}

// Short on purpose: most people read this on a phone.
export const TOUR: TourStop[] = [
  {
    kicker: 'Yaba, Lagos',
    title: 'From the street, it is a café.',
    body: 'Coffee and a window bar. Past the counter, a wall of 3D printers is already working.',
    shot: { target: [23, 2.6, 27.5], dist: 21, az: 0.78, pol: 1.32 }, walls: 'up', hold: 8, flyTime: 2.6,
  },
  {
    kicker: 'The plan',
    title: 'Lift the roof.',
    body: 'Public at the front, members in the middle, loud and chemical work at the back.',
    stats: [['Floor', '1,120 m²'], ['Open', '8am to 8pm']],
    shot: { target: [20, 0, 13.5], dist: 58, az: 0.5, pol: 0.74 }, walls: 'cutaway', hold: 9, orbit: 0.035, flyTime: 3,
  },
  {
    kicker: 'Front of house',
    title: 'The front door is a café.',
    body: 'Anyone can walk in. Members tap in at the kiosk and pass the glass gate.',
    stats: [['Day pass', '₦10,000'], ['Membership', '₦75,000 a month']],
    shot: { target: [21, 0.6, 23.4], dist: 15, az: 0.22, pol: 0.96 }, walls: 'cutaway', room: 'cafe', hold: 8,
  },
  {
    kicker: 'Print wall',
    title: 'Printers on show.',
    body: 'Eighteen printers face the café through glass. Members queue prints from their phones.',
    shot: { target: [24.5, 1.3, 19.6], dist: 8.5, az: 0.05, pol: 1.2 }, walls: 'down', hold: 8,
  },
  {
    kicker: 'Bench hall',
    title: 'Every seat is a full bench.',
    body: 'A scope, a bench supply and a soldering iron at every seat. Twenty four of them.',
    shot: { target: [23.5, 0.7, 15], dist: 12.5, az: 0.7, pol: 0.86 }, walls: 'cutaway', room: 'bench', hold: 8,
  },
  {
    kicker: 'Parts library',
    title: 'Parts come to you.',
    body: 'Order from your seat. A runner with the stock app walks to the right bin and brings it over.',
    shot: { target: [34.5, 0.7, 15.5], dist: 13, az: -0.62, pol: 0.9 }, walls: 'cutaway', room: 'library', hold: 9, live: 'library',
  },
  {
    kicker: 'Fab shop',
    title: 'Make it real.',
    body: 'Lasers, a 4×8 CNC, a PCB mill and a small assembly line. Induction first.',
    shot: { target: [18.5, 0.7, 4], dist: 15, az: 0.3, pol: 0.86 }, walls: 'cutaway', room: 'fab', hold: 8,
  },
  {
    kicker: 'Drone cage',
    title: 'Fly it indoors first.',
    body: 'A netted cage for first hovers, tuning and mission tests.',
    shot: { target: [29.5, 1.4, 4], dist: 12, az: 0.62, pol: 0.98 }, walls: 'cutaway', action: 'drone', hold: 9,
  },
  {
    kicker: 'Wet lab',
    title: 'A shared wet lab.',
    body: 'Biology and chemistry benches, rented by the day. Test before you build your own lab.',
    shot: { target: [5, 0.7, 4.6], dist: 12.5, az: -0.42, pol: 0.9 }, walls: 'cutaway', room: 'wetlab', hold: 8,
  },
  {
    kicker: 'Studios and classroom',
    title: 'Room to grow.',
    body: 'Lockable studios for teams. A classroom for short courses and Robotics Saturdays.',
    shot: { target: [6, 0.7, 19], dist: 16, az: -0.4, pol: 0.86 }, walls: 'cutaway', hold: 8,
  },
  {
    kicker: 'Fridays, 6pm',
    title: 'Demo Night.',
    body: 'Teams show what they built to the community and to investors.',
    shot: { target: [28, 1.2, 23], dist: 12.5, az: -1.05, pol: 1.05 }, walls: 'cutaway', time: 17 * 60 + 58, speed: 2, hold: 12,
  },
  {
    kicker: 'Your turn',
    title: 'Now build something.',
    body: 'Start with ₦1,000,000, pick a product, and see how far you get.',
    shot: { target: [20, 0, 14], dist: 62, az: 0.75, pol: 0.82 }, walls: 'cutaway', hold: 999, orbit: 0.04, cta: true,
  },
]
