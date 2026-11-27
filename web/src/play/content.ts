// Play mode content: places, actions, projects. Money in naira, time in game minutes.
import type { AnimName } from '../world/props/common'
import type { Held } from '../sim/Character'

export type Skill = 'electronics' | 'making' | 'bio' | 'business'
export const SKILLS: { id: Skill; name: string }[] = [
  { id: 'electronics', name: 'Electronics' },
  { id: 'making', name: 'Making' },
  { id: 'bio', name: 'Bio lab' },
  { id: 'business', name: 'Business' },
]
// xp needed to reach level 2,3,4,5
export const LEVELS = [0, 100, 300, 600, 1000]
export const levelOf = (xp: number) => LEVELS.filter((t) => xp >= t).length

export type PlaceId = 'desk' | 'cafe' | 'bench' | 'cad' | 'print' | 'library' | 'fab' | 'wetlab' | 'drone' | 'classroom' | 'studio' | 'stage' | 'boardroom' | 'street'
export type Icon = 'door' | 'cup' | 'chip' | 'screen' | 'printer' | 'box' | 'spark' | 'flask' | 'drone' | 'book' | 'key' | 'mic' | 'people' | 'home'

export interface Place { id: PlaceId; name: string; icon: Icon; pin: [number, number]; line: string; lab?: boolean }

export const PLACES: Place[] = [
  { id: 'desk', name: 'Front desk', icon: 'door', pin: [23.6, 21.6], line: 'Passes, memberships and the members app.' },
  { id: 'cafe', name: 'Café', icon: 'cup', pin: [17.6, 24.2], line: 'Coffee, jollof and the people worth knowing.' },
  { id: 'bench', name: 'Bench hall', icon: 'chip', pin: [23.5, 14.9], line: '24 kitted seats. Scope, supply, iron.', lab: true },
  { id: 'cad', name: 'Design desks', icon: 'screen', pin: [12.9, 18.1], line: 'CAD, PCB layout and firmware.', lab: true },
  { id: 'print', name: 'Print wall', icon: 'printer', pin: [27.6, 19.1], line: '18 printers. Pay by the gram.', lab: true },
  { id: 'library', name: 'Parts library', icon: 'box', pin: [33.4, 15.5], line: 'Order parts. A runner brings them.', lab: true },
  { id: 'fab', name: 'Fab shop', icon: 'spark', pin: [18.5, 4.5], line: 'Lasers, CNC, PCB mill, SMT.', lab: true },
  { id: 'wetlab', name: 'Wet lab', icon: 'flask', pin: [5, 4.5], line: 'BSL-1 biology and chemistry.', lab: true },
  { id: 'drone', name: 'Drone cage', icon: 'drone', pin: [29.5, 4.2], line: 'Fly it indoors first.', lab: true },
  { id: 'classroom', name: 'Classroom', icon: 'book', pin: [5, 24], line: 'Short courses that level you up.' },
  { id: 'studio', name: 'Team studio', icon: 'key', pin: [3.6, 13.3], line: 'A lockable room for your team.', lab: true },
  { id: 'stage', name: 'Demo stage', icon: 'mic', pin: [29.2, 22.5], line: 'Fridays at 6pm. Show what you built.' },
  { id: 'boardroom', name: 'Boardroom', icon: 'people', pin: [13, 13.6], line: 'Mentors by day, investors after a good demo.', lab: true },
  { id: 'street', name: 'Head home', icon: 'home', pin: [22, 29.4], line: 'End the day and rest.' },
]

export interface Req {
  skill?: Partial<Record<Skill, number>>
  unlock?: string[]
  items?: string[]
  steps?: string[] // project steps done before this
  day?: number[] // 0 Mon … 6 Sun
  from?: number // minute of day
  to?: number
  progress?: number
}

export interface Gain {
  money?: number
  energy?: number
  xp?: Partial<Record<Skill, number>>
  progress?: number
  unlock?: string
  item?: string
  member?: number // days of membership
  pass?: boolean
  rep?: number
}

export interface Action {
  id: string
  place: PlaceId
  label: string
  verb: string // shown while doing it
  minutes: number
  cost: number
  energy: number // energy spent (negative = restores)
  slot?: string // slot kind the character walks to
  anim?: AnimName
  held?: Held
  req?: Req
  gain: Gain
  once?: boolean
  project?: string // only for this project
  step?: string // marks this project step done
  gig?: boolean
  target?: string // agent id for a chat
  risk?: number // chance a build step fails at the minimum skill level
}

const H = 60
export const OPEN = 8 * 60
export const CLOSE = 20 * 60

export const ACTIONS: Action[] = [
  // Front desk
  { id: 'pass', place: 'desk', label: 'Day pass', verb: 'Checking in', minutes: 5, cost: 10000, energy: 0, slot: 'kiosk', anim: 'standUse', gain: { pass: true } },
  { id: 'member', place: 'desk', label: 'Maker membership, 30 days', verb: 'Signing up', minutes: 10, cost: 75000, energy: 0, slot: 'receptionVisitor', anim: 'talk', gain: { member: 30, pass: true } },

  // Café
  { id: 'coffee', place: 'cafe', label: 'Coffee', verb: 'Coffee break', minutes: 15, cost: 3000, energy: -25, slot: 'barOrder', anim: 'drink', held: 'cup', gain: {} },
  { id: 'lunch', place: 'cafe', label: 'Jollof and chicken', verb: 'Lunch', minutes: 40, cost: 6500, energy: -45, slot: 'cafeSeat', anim: 'sitEat', held: 'plate', gain: {} },
  { id: 'network', place: 'cafe', label: 'Chat with other founders', verb: 'Networking', minutes: 30, cost: 0, energy: 5, slot: 'windowSeat', anim: 'sitTalk', gain: { xp: { business: 25 }, rep: 1 } },

  // Classroom
  { id: 'class_elec', place: 'classroom', label: 'Electronics 101', verb: 'In class: Electronics 101', minutes: 2 * H, cost: 15000, energy: 15, slot: 'classSeat', anim: 'sitType', gain: { xp: { electronics: 70 } } },
  { id: 'class_make', place: 'classroom', label: 'CAD and 3D printing basics', verb: 'In class: CAD basics', minutes: 2 * H, cost: 15000, energy: 15, slot: 'classSeat', anim: 'sitType', gain: { xp: { making: 70 } } },
  { id: 'class_bio', place: 'classroom', label: 'Lab techniques', verb: 'In class: lab techniques', minutes: 2 * H, cost: 15000, energy: 15, slot: 'classSeat', anim: 'sitType', gain: { xp: { bio: 70 } } },
  { id: 'class_pitch', place: 'classroom', label: 'Pitching workshop', verb: 'In class: pitching', minutes: 90, cost: 10000, energy: 10, slot: 'classSeat', anim: 'sitType', gain: { xp: { business: 70 } } },
  { id: 'teach_kids', place: 'classroom', label: 'Teach Robotics Saturday', verb: 'Teaching kids robotics', minutes: 2 * H, cost: 0, energy: 25, slot: 'teacher', anim: 'present', req: { skill: { electronics: 3 }, day: [5] }, gain: { money: 25000, xp: { business: 30 }, rep: 2 }, gig: true },

  // Bench hall
  { id: 'practice', place: 'bench', label: 'Practice soldering kit', verb: 'Practising soldering', minutes: 90, cost: 8000, energy: 15, slot: 'benchSeat', anim: 'sitSolder', gain: { xp: { electronics: 45 } } },
  { id: 'repair', place: 'bench', label: 'Repair a client’s board', verb: 'Repairing a client board', minutes: 2 * H, cost: 0, energy: 20, slot: 'benchSeat', anim: 'sitSolder', req: { skill: { electronics: 2 } }, gain: { money: 35000, xp: { electronics: 20 }, rep: 1 }, gig: true },

  // Design desks
  { id: 'cad_tut', place: 'cad', label: 'Follow a CAD tutorial', verb: 'Learning CAD', minutes: H, cost: 0, energy: 10, slot: 'cadSeat', anim: 'sitType', gain: { xp: { making: 35 } } },
  { id: 'cad_gig', place: 'cad', label: 'Design a part for a client', verb: 'Client CAD job', minutes: 2 * H, cost: 0, energy: 20, slot: 'cadSeat', anim: 'sitType', req: { skill: { making: 2 } }, gain: { money: 40000, xp: { making: 20 } }, gig: true },

  // Print wall
  { id: 'print_gig', place: 'print', label: 'Print parts for a client', verb: 'Running a client print', minutes: 45, cost: 0, energy: 8, slot: 'printer', anim: 'standUse', req: { skill: { making: 1 }, unlock: ['print'] }, gain: { money: 20000, xp: { making: 15 } }, gig: true },
  { id: 'print_intro', place: 'print', label: 'Printer walkthrough', verb: 'Learning the printers', minutes: 30, cost: 0, energy: 5, slot: 'printer', anim: 'standUse', once: true, gain: { unlock: 'print', xp: { making: 20 } } },

  // Inductions
  { id: 'ind_fab', place: 'fab', label: 'Laser and CNC induction', verb: 'Induction with Tunde', minutes: H, cost: 10000, energy: 10, slot: 'laser', anim: 'standUse', once: true, gain: { unlock: 'fab', xp: { making: 30 } } },
  { id: 'ind_wet', place: 'wetlab', label: 'Biosafety induction', verb: 'Biosafety induction with Dr. Hauwa', minutes: H, cost: 10000, energy: 10, slot: 'labIsland', anim: 'pipette', once: true, gain: { unlock: 'wet', xp: { bio: 30 } } },
  { id: 'ind_drone', place: 'drone', label: 'Cage safety briefing', verb: 'Drone safety briefing', minutes: 30, cost: 5000, energy: 5, slot: 'droneTable', anim: 'standUse', once: true, gain: { unlock: 'drone' } },
  { id: 'lab_gig', place: 'wetlab', label: 'Help run a client’s samples', verb: 'Running samples', minutes: 2 * H, cost: 0, energy: 20, slot: 'labIsland', anim: 'pipette', req: { skill: { bio: 2 }, unlock: ['wet'] }, gain: { money: 30000, xp: { bio: 20 } }, gig: true },

  // Studio + boardroom + stage
  { id: 'studio', place: 'studio', label: 'Rent a team studio, 30 days', verb: 'Signing the studio lease', minutes: 20, cost: 650000, energy: 0, slot: 'studioSeat', anim: 'sitTalk', req: { progress: 50 }, once: true, gain: { unlock: 'studio', rep: 2 } },
  { id: 'mentor', place: 'boardroom', label: 'Office hours with Engr. Okon', verb: 'Mentor session', minutes: 45, cost: 0, energy: 5, slot: 'meetingSeat', anim: 'sitTalk', req: { from: 10 * H, to: 15 * H }, gain: { xp: { business: 30, electronics: 15 } } },
  { id: 'pitch', place: 'stage', label: 'Pitch your prototype', verb: 'Pitching on stage', minutes: 15, cost: 0, energy: 20, slot: 'presenter', anim: 'present', req: { day: [4], from: 18 * H - 10, to: 19 * H + 30, progress: 100 }, once: true, gain: { rep: 5 } },
  { id: 'watch_demo', place: 'stage', label: 'Watch Demo Night', verb: 'Watching Demo Night', minutes: 50, cost: 0, energy: 5, slot: 'audience', anim: 'clap', req: { day: [4], from: 18 * H - 10, to: 19 * H + 30 }, gain: { xp: { business: 40 }, rep: 1 } },
  { id: 'investors', place: 'boardroom', label: 'Meet the investors', verb: 'Investor meeting', minutes: H, cost: 0, energy: 15, slot: 'meetingSeat', anim: 'sitTalk', req: { unlock: ['pitched'] }, once: true, gain: { rep: 3 } },

  // Home
  { id: 'home', place: 'street', label: 'Go home for the day', verb: 'Heading home', minutes: 10, cost: 0, energy: 0, gain: {} },
]

export interface Project {
  id: string
  name: string
  sector: string
  pitch: string
  steps: Action[]
  grant: number
}

const step = (project: string, a: Omit<Action, 'project' | 'step'>): Action => ({ ...a, project, step: a.id })

export const PROJECTS: Project[] = [
  {
    id: 'cold', name: 'Cold-chain sensor', sector: 'Agriculture', grant: 1500000,
    pitch: 'Solar sensors that stop tomato traders losing half a truck to heat.',
    steps: [
      step('cold', { id: 'cold_parts', place: 'library', label: 'Order sensor parts', verb: 'Collecting ESP32, probes and LoRa', minutes: 20, cost: 72000, energy: 5, slot: 'libPick', anim: 'reach', held: 'box', gain: { item: 'cold_parts' } }),
      step('cold', { id: 'cold_bread', place: 'bench', label: 'Breadboard the prototype', verb: 'Breadboarding the sensor', minutes: Math.round((2 * H) * 1.5), cost: 0, energy: 30, slot: 'benchSeat', anim: 'sitSolder', req: { items: ['cold_parts'], skill: { electronics: 1 } }, risk: 0.35, gain: { progress: 15, xp: { electronics: 40 } } }),
      step('cold', { id: 'cold_fw', place: 'cad', label: 'Write the LoRa firmware', verb: 'Writing firmware', minutes: Math.round((2 * H) * 1.5), cost: 0, energy: 30, slot: 'cadSeat', anim: 'sitType', req: { steps: ['cold_bread'], skill: { electronics: 2 } }, risk: 0.35, gain: { progress: 15, xp: { electronics: 40 } } }),
      step('cold', { id: 'cold_case', place: 'cad', label: 'Design the weatherproof case', verb: 'Modelling the case', minutes: Math.round((90) * 1.5), cost: 0, energy: 25, slot: 'cadSeat', anim: 'sitType', req: { steps: ['cold_bread'], skill: { making: 2 } }, risk: 0.35, gain: { progress: 10, xp: { making: 40 } } }),
      step('cold', { id: 'cold_print', place: 'print', label: 'Print the case, 120 g', verb: 'Printing the case', minutes: Math.round((H) * 1.5), cost: 27000, energy: 15, slot: 'printer', anim: 'standUse', req: { steps: ['cold_case'], unlock: ['print'] }, gain: { progress: 10, xp: { making: 20 } } }),
      step('cold', { id: 'cold_pcb', place: 'fab', label: 'Mill the PCB', verb: 'Milling the PCB', minutes: Math.round((90) * 1.5), cost: 22500, energy: 25, slot: 'desktopCnc', anim: 'standUse', req: { steps: ['cold_fw'], unlock: ['fab'], skill: { electronics: 3 } }, risk: 0.35, gain: { progress: 15, xp: { electronics: 30, making: 20 } } }),
      step('cold', { id: 'cold_test', place: 'wetlab', label: 'Cold test in the lab freezer', verb: 'Testing at minus 20', minutes: Math.round((H) * 1.5), cost: 7500, energy: 20, slot: 'fridge', anim: 'reach', req: { steps: ['cold_pcb', 'cold_print'], unlock: ['wet'] }, gain: { progress: 15, xp: { bio: 20 } } }),
      step('cold', { id: 'cold_units', place: 'bench', label: 'Assemble three demo units', verb: 'Building three units', minutes: Math.round((3 * H) * 1.5), cost: 45000, energy: 35, slot: 'benchSeat', anim: 'sitSolder', req: { steps: ['cold_test'], skill: { electronics: 3 } }, risk: 0.35, gain: { progress: 20, xp: { electronics: 40 } } }),
    ],
  },
  {
    id: 'drone', name: 'Crop-scouting drone', sector: 'Agriculture', grant: 2000000,
    pitch: 'A drone that spots armyworm early for smallholder farms.',
    steps: [
      step('drone', { id: 'drone_parts', place: 'library', label: 'Order motors, ESCs and LiPos', verb: 'Collecting drone parts', minutes: 20, cost: 192000, energy: 5, slot: 'libPick', anim: 'reach', held: 'box', gain: { item: 'drone_parts' } }),
      step('drone', { id: 'drone_frame', place: 'fab', label: 'Cut the frame on the CNC', verb: 'Cutting the frame', minutes: Math.round((90) * 1.5), cost: 37500, energy: 25, slot: 'cnc', anim: 'standUse', req: { items: ['drone_parts'], unlock: ['fab'] }, gain: { progress: 15, xp: { making: 40 } } }),
      step('drone', { id: 'drone_wire', place: 'bench', label: 'Wire the flight controller', verb: 'Wiring the flight controller', minutes: Math.round((2 * H) * 1.5), cost: 0, energy: 30, slot: 'benchSeat', anim: 'sitSolder', req: { steps: ['drone_frame'], skill: { electronics: 2 } }, risk: 0.35, gain: { progress: 20, xp: { electronics: 45 } } }),
      step('drone', { id: 'drone_hover', place: 'drone', label: 'First hover in the cage', verb: 'Hover test', minutes: Math.round((45) * 1.5), cost: 9000, energy: 20, slot: 'dronePilot', anim: 'phone', held: 'controller', req: { steps: ['drone_wire'], unlock: ['drone'] }, gain: { progress: 15, xp: { electronics: 25 } } }),
      step('drone', { id: 'drone_vision', place: 'cad', label: 'Train the pest model', verb: 'Training the vision model', minutes: Math.round((3 * H) * 1.5), cost: 0, energy: 35, slot: 'cadSeat', anim: 'sitType', req: { steps: ['drone_wire'], skill: { electronics: 3 } }, risk: 0.35, gain: { progress: 20, xp: { electronics: 40 } } }),
      step('drone', { id: 'drone_gimbal', place: 'print', label: 'Print the camera gimbal', verb: 'Printing the gimbal', minutes: Math.round((H) * 1.5), cost: 18000, energy: 15, slot: 'printer', anim: 'standUse', req: { steps: ['drone_hover'], unlock: ['print'], skill: { making: 2 } }, risk: 0.35, gain: { progress: 10, xp: { making: 20 } } }),
      step('drone', { id: 'drone_mission', place: 'drone', label: 'Fly a full mission', verb: 'Flying the mission', minutes: Math.round((H) * 1.5), cost: 9000, energy: 25, slot: 'dronePilot', anim: 'phone', held: 'controller', req: { steps: ['drone_vision', 'drone_gimbal'] }, gain: { progress: 20, xp: { electronics: 30, making: 20 } } }),
    ],
  },
  {
    id: 'malaria', name: 'Malaria test reader', sector: 'Health', grant: 1800000,
    pitch: 'A ₦3,000 reader that turns a paper test into a clinic-grade result.',
    steps: [
      step('malaria', { id: 'mal_parts', place: 'library', label: 'Order optics and reagents', verb: 'Collecting optics and reagents', minutes: 20, cost: 96000, energy: 5, slot: 'libPick', anim: 'reach', held: 'box', gain: { item: 'mal_parts' } }),
      step('malaria', { id: 'mal_assay', place: 'wetlab', label: 'Prepare the test strips', verb: 'Preparing strips', minutes: Math.round((2 * H) * 1.5), cost: 15000, energy: 30, slot: 'labIsland', anim: 'pipette', req: { items: ['mal_parts'], unlock: ['wet'], skill: { bio: 2 } }, risk: 0.35, gain: { progress: 20, xp: { bio: 45 } } }),
      step('malaria', { id: 'mal_optics', place: 'bench', label: 'Build the optical reader', verb: 'Building the reader', minutes: Math.round((2 * H) * 1.5), cost: 0, energy: 30, slot: 'benchSeat', anim: 'sitSolder', req: { items: ['mal_parts'], skill: { electronics: 1 } }, risk: 0.35, gain: { progress: 20, xp: { electronics: 40 } } }),
      step('malaria', { id: 'mal_app', place: 'cad', label: 'Write the phone app', verb: 'Coding the app', minutes: Math.round((2 * H) * 1.5), cost: 0, energy: 30, slot: 'cadSeat', anim: 'sitType', req: { steps: ['mal_optics'], skill: { electronics: 2 } }, risk: 0.35, gain: { progress: 15, xp: { electronics: 30 } } }),
      step('malaria', { id: 'mal_case', place: 'print', label: 'Print the reader case', verb: 'Printing the case', minutes: Math.round((H) * 1.5), cost: 22500, energy: 15, slot: 'printer', anim: 'standUse', req: { steps: ['mal_optics'], unlock: ['print'] }, gain: { progress: 10, xp: { making: 30 } } }),
      step('malaria', { id: 'mal_valid', place: 'wetlab', label: 'Validate against lab results', verb: 'Validating in the biosafety cabinet', minutes: Math.round((3 * H) * 1.5), cost: 22500, energy: 35, slot: 'bsc', anim: 'pipette', req: { steps: ['mal_assay', 'mal_app', 'mal_case'], skill: { bio: 3 } }, risk: 0.35, gain: { progress: 35, xp: { bio: 50 } } }),
    ],
  },
  {
    id: 'keke', name: 'Electric keke kit', sector: 'Transport', grant: 2500000,
    pitch: 'A bolt-on kit that turns a petrol keke electric.',
    steps: [
      step('keke', { id: 'keke_parts', place: 'library', label: 'Order motor and controller parts', verb: 'Collecting the motor parts', minutes: 20, cost: 240000, energy: 5, slot: 'libPick', anim: 'reach', held: 'box', gain: { item: 'keke_parts' } }),
      step('keke', { id: 'keke_brackets', place: 'fab', label: 'Cut aluminium brackets', verb: 'Cutting brackets', minutes: Math.round((90) * 1.5), cost: 37500, energy: 30, slot: 'cnc', anim: 'standUse', req: { items: ['keke_parts'], unlock: ['fab'] }, gain: { progress: 15, xp: { making: 45 } } }),
      step('keke', { id: 'keke_ctrl', place: 'bench', label: 'Build the 3 kW controller', verb: 'Building the controller', minutes: Math.round((3 * H) * 1.5), cost: 30000, energy: 35, slot: 'benchSeat', anim: 'sitSolder', req: { items: ['keke_parts'], skill: { electronics: 3 } }, risk: 0.35, gain: { progress: 25, xp: { electronics: 50 } } }),
      step('keke', { id: 'keke_mount', place: 'fab', label: 'Fit the motor mount', verb: 'Fitting the mount', minutes: Math.round((2 * H) * 1.5), cost: 0, energy: 35, slot: 'workbench', anim: 'standUse', req: { steps: ['keke_brackets'], skill: { making: 3 } }, risk: 0.35, gain: { progress: 20, xp: { making: 40 } } }),
      step('keke', { id: 'keke_pack', place: 'fab', label: 'Assemble the battery pack', verb: 'Building the battery pack', minutes: Math.round((2 * H) * 1.5), cost: 90000, energy: 30, slot: 'assembly', anim: 'sitSolder', req: { steps: ['keke_ctrl'] }, gain: { progress: 20, xp: { electronics: 30 } } }),
      step('keke', { id: 'keke_road', place: 'street', label: 'Road test on Herbert Macaulay', verb: 'Road testing', minutes: Math.round((90) * 1.5), cost: 7500, energy: 25, req: { steps: ['keke_mount', 'keke_pack'] }, gain: { progress: 20, xp: { making: 30, business: 20 } } }),
    ],
  },
]

export interface Look { id: string; skin: string; hair: string; top: string; fem: boolean }
export const LOOKS: Look[] = [
  { id: 'a', skin: '#6B4430', hair: 'braids', top: '#41A1CF', fem: true },
  { id: 'b', skin: '#4E3222', hair: 'fade', top: '#2C2C2C', fem: false },
  { id: 'c', skin: '#8D5B3E', hair: 'hijab', top: '#5E7D6A', fem: true },
  { id: 'd', skin: '#5A3825', hair: 'locs', top: '#B8875B', fem: false },
  { id: 'e', skin: '#7A4E36', hair: 'puff', top: '#D88A7C', fem: true },
  { id: 'f', skin: '#3F2A1D', hair: 'cap', top: '#7FA7C2', fem: false },
]

export const MORNING_EVENTS: { text: string; gain?: Gain }[] = [
  { text: 'A friend shared your project on X. Two people want to visit.', gain: { rep: 1 } },
  { text: 'The naira slipped overnight. Imported parts cost a little more today.' },
  { text: 'Engr. Okon has office hours today from 10am in the boardroom.' },
  { text: 'A client sent a board to fix. Look for repair work at the bench hall.' },
  { text: 'The café has a new zobo. Small things, good mood.', gain: { energy: 10 } },
  { text: 'A UNILAG student asked to shadow you. You explain your build and learn from it.', gain: { xp: { business: 15 } } },
]

export const START_MONEY = 1000000
