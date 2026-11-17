// Single source of truth for the building. Used by the 3D sim and the plan drawings.
// Units: metres. x runs west→east (0..40), z runs north→south (0..28). Street is south (z > 28).
// Prop rotation is in degrees; rot 0 means the prop's front faces +z (south, toward the street).

export type Vec2 = [number, number]
export interface Rect { x: number; z: number; w: number; d: number }

export type FloorKind =
  | 'wood' | 'concrete' | 'epoxy' | 'epoxyLab' | 'tile' | 'carpet' | 'rubber' | 'shop' | 'kids' | 'terrazzo'

export type Access = 'public' | 'member' | 'controlled' | 'staff'

export type ZoneId =
  | 'cafe' | 'bench' | 'design' | 'meeting' | 'studioA' | 'studioB' | 'library' | 'parts'
  | 'classroom' | 'wc' | 'prayer' | 'fab' | 'drone' | 'wetlab' | 'power' | 'store' | 'labstreet' | 'westhall'

export interface Room {
  id: ZoneId
  name: string
  rect: Rect
  floor: FloorKind
  access: Access
  accent: string
  blurb: string
  capacity?: number
}

export type OpeningKind = 'door' | 'window' | 'gate' | 'roller' | 'counter' | 'open'
export interface Opening { at: number; w: number; kind: OpeningKind; sill?: number; head?: number }
export type WallKind = 'ext' | 'int' | 'glass' | 'net'
export interface Wall { a: Vec2; b: Vec2; kind: WallKind; openings?: Opening[] }

export interface PropPlacement {
  type: string
  x: number
  z: number
  rot?: number
  id?: string
  opts?: Record<string, unknown>
}

export const BUILDING = { w: 40, d: 28, wallH: 3.6, extH: 4.6, roofY: 4.4 }

export const ROOMS: Room[] = [
  { id: 'cafe', name: 'Café & Demo Stage', rect: { x: 13, z: 20, w: 18, d: 8 }, floor: 'wood', access: 'public', accent: '#F2C230',
    blurb: 'Open to the street. Coffee, jollof and Wi-Fi by day, demo nights and meetups by evening. The front door and the funnel.', capacity: 40 },
  { id: 'bench', name: 'Open Bench Hall', rect: { x: 16, z: 11, w: 15, d: 9 }, floor: 'epoxy', access: 'member', accent: '#0E7A4F',
    blurb: '24 ESD-safe electronics seats with scope, bench supply, soldering and fume extraction at every pair.', capacity: 24 },
  { id: 'design', name: 'CAD & Design Desks', rect: { x: 10, z: 16, w: 6, d: 4 }, floor: 'carpet', access: 'member', accent: '#5BA4CF',
    blurb: 'Workstations with big monitors for CAD, PCB layout and firmware.', capacity: 4 },
  { id: 'meeting', name: 'Boardroom', rect: { x: 10, z: 11, w: 6, d: 5 }, floor: 'carpet', access: 'member', accent: '#5BA4CF',
    blurb: 'Bookable 8-seat room for investor calls, design reviews and partner meetings.', capacity: 8 },
  { id: 'studioA', name: 'Team Studio A', rect: { x: 0, z: 11, w: 7.5, d: 4.5 }, floor: 'carpet', access: 'controlled', accent: '#C8643B',
    blurb: 'Private lockable studio for a hardware startup team. Monthly lease.', capacity: 6 },
  { id: 'studioB', name: 'Team Studio B', rect: { x: 0, z: 15.5, w: 7.5, d: 4.5 }, floor: 'carpet', access: 'controlled', accent: '#C8643B',
    blurb: 'Private lockable studio for a hardware startup team. Monthly lease.', capacity: 6 },
  { id: 'westhall', name: 'Studio Corridor', rect: { x: 7.5, z: 11, w: 2.5, d: 9 }, floor: 'concrete', access: 'member', accent: '#9aa3ad',
    blurb: 'Quiet corridor to the studios and the classroom.' },
  { id: 'library', name: 'Component Library', rect: { x: 31, z: 11, w: 9, d: 9 }, floor: 'epoxy', access: 'staff', accent: '#7B5CD6',
    blurb: '4,000+ SKUs in labelled bins. Staff pick with an AI app that shows the exact aisle and bin.' },
  { id: 'parts', name: 'Parts Shop', rect: { x: 31, z: 20, w: 9, d: 8 }, floor: 'terrazzo', access: 'public', accent: '#7B5CD6',
    blurb: 'Street-facing counter selling boards, sensors and kits to anyone. Computer Village quality control, Yaba convenience.' },
  { id: 'classroom', name: 'Classroom', rect: { x: 0, z: 20, w: 10, d: 8 }, floor: 'kids', access: 'public', accent: '#E8546B',
    blurb: 'Kids robotics Saturdays, bootcamps for students, corporate training. Own street entrance.', capacity: 24 },
  { id: 'wc', name: 'Restrooms', rect: { x: 10, z: 20, w: 3, d: 4 }, floor: 'tile', access: 'public', accent: '#9aa3ad', blurb: 'Restrooms.' },
  { id: 'prayer', name: 'Prayer & Quiet Room', rect: { x: 10, z: 24, w: 3, d: 4 }, floor: 'carpet', access: 'public', accent: '#9aa3ad', blurb: 'A calm room for prayer and rest.' },
  { id: 'fab', name: 'Fabrication Shop', rect: { x: 10, z: 0, w: 16, d: 9 }, floor: 'shop', access: 'controlled', accent: '#F2C230',
    blurb: 'CO2 and diode lasers, 4×8 ft CNC router, desktop CNC/PCB mill, saws, drill press. Induction required.' },
  { id: 'drone', name: 'Drone Cage', rect: { x: 26, z: 0, w: 7, d: 9 }, floor: 'rubber', access: 'controlled', accent: '#E8546B',
    blurb: 'Netted indoor flight cage for safe test flights of drones and robots.' },
  { id: 'wetlab', name: 'Wet Lab (BSL-1)', rect: { x: 0, z: 0, w: 10, d: 9 }, floor: 'epoxyLab', access: 'controlled', accent: '#3FB6A8',
    blurb: 'Shared bio and chemistry lab: fume hood, biosafety cabinet, PCR, centrifuge, incubator, autoclave.', capacity: 8 },
  { id: 'power', name: 'Power Room', rect: { x: 33, z: 0, w: 7, d: 4.5 }, floor: 'concrete', access: 'staff', accent: '#3FB6A8',
    blurb: 'Hybrid inverters, lithium battery bank and network rack. Solar on the roof, generator as last resort.' },
  { id: 'store', name: 'Stores & Loading', rect: { x: 33, z: 4.5, w: 7, d: 4.5 }, floor: 'concrete', access: 'staff', accent: '#9aa3ad',
    blurb: 'Receiving, stock and materials. Roller door to the side yard.' },
  { id: 'labstreet', name: 'Lab Street', rect: { x: 0, z: 9, w: 40, d: 2 }, floor: 'concrete', access: 'member', accent: '#9aa3ad',
    blurb: 'The service spine connecting every workshop.' },
]

export const WALLS: Wall[] = [
  // ── exterior ──
  { a: [0, 0], b: [40, 0], kind: 'ext' },
  { a: [40, 0], b: [40, 28], kind: 'ext', openings: [{ at: 5, w: 3, kind: 'roller' }] },
  { a: [0, 28], b: [40, 28], kind: 'ext', openings: [
    { at: 1.0, w: 3.0, kind: 'window', sill: 0.9, head: 2.7 },
    { at: 5.0, w: 1.2, kind: 'door' },
    { at: 6.8, w: 2.4, kind: 'window', sill: 0.9, head: 2.7 },
    { at: 13.6, w: 6.8, kind: 'window', sill: 0.35, head: 3.1 },
    { at: 21.0, w: 2.0, kind: 'door' },
    { at: 23.4, w: 7.2, kind: 'window', sill: 0.35, head: 3.1 },
    { at: 31.6, w: 4.6, kind: 'window', sill: 0.8, head: 3.1 },
    { at: 36.8, w: 1.4, kind: 'door' },
  ] },
  { a: [0, 0], b: [0, 28], kind: 'ext' },

  // ── north band / lab street ──
  { a: [0, 9], b: [10, 9], kind: 'int', openings: [
    { at: 1.5, w: 4.0, kind: 'window', sill: 1.0, head: 2.4 },
    { at: 7.6, w: 1.2, kind: 'door' },
  ] },
  { a: [10, 9], b: [26, 9], kind: 'glass', openings: [{ at: 6.0, w: 2.0, kind: 'door' }] },
  { a: [26, 9], b: [33, 9], kind: 'glass', openings: [{ at: 4.6, w: 1.2, kind: 'door' }] },
  { a: [33, 9], b: [40, 9], kind: 'int', openings: [{ at: 1.0, w: 1.6, kind: 'door' }] },
  { a: [10, 0], b: [10, 9], kind: 'int' },
  { a: [26, 0], b: [26, 9], kind: 'glass' },
  { a: [33, 0], b: [33, 9], kind: 'int' },
  { a: [33, 4.5], b: [40, 4.5], kind: 'int', openings: [{ at: 1.2, w: 1.0, kind: 'door' }] },

  // ── middle band ──
  { a: [0, 11], b: [7.5, 11], kind: 'int' },
  { a: [10, 11], b: [16, 11], kind: 'int' },
  { a: [31, 11], b: [40, 11], kind: 'int', openings: [{ at: 1.2, w: 1.2, kind: 'door' }] },
  { a: [7.5, 11], b: [7.5, 20], kind: 'glass', openings: [
    { at: 1.2, w: 1.0, kind: 'door' },
    { at: 5.6, w: 1.0, kind: 'door' },
  ] },
  { a: [0, 15.5], b: [7.5, 15.5], kind: 'int' },
  { a: [10, 11], b: [10, 16], kind: 'glass' },
  { a: [16, 11], b: [16, 16], kind: 'glass', openings: [{ at: 3.6, w: 1.0, kind: 'door' }] },
  { a: [10, 16], b: [16, 16], kind: 'glass' },
  { a: [31, 11], b: [31, 20], kind: 'int', openings: [
    { at: 3.0, w: 3.0, kind: 'counter', sill: 1.05 },
    { at: 7.2, w: 1.0, kind: 'door' },
  ] },

  // ── café line ──
  { a: [0, 20], b: [10, 20], kind: 'int', openings: [{ at: 7.9, w: 1.2, kind: 'door' }] },
  { a: [10, 20], b: [13, 20], kind: 'int' },
  { a: [13, 20], b: [31, 20], kind: 'glass', openings: [{ at: 8.0, w: 2.0, kind: 'gate' }] },
  { a: [31, 20], b: [40, 20], kind: 'int', openings: [{ at: 4.0, w: 1.0, kind: 'door' }] },

  // ── south band ──
  { a: [10, 20], b: [10, 28], kind: 'int' },
  { a: [13, 20], b: [13, 28], kind: 'int', openings: [
    { at: 1.2, w: 1.0, kind: 'door' },
    { at: 5.6, w: 1.0, kind: 'door' },
  ] },
  { a: [10, 24], b: [13, 24], kind: 'int' },
  { a: [31, 20], b: [31, 28], kind: 'glass', openings: [{ at: 4.6, w: 2.0, kind: 'open' }] },
]

// Bench hall grid
const BENCH_X = [18.7, 23.5, 28.3]
const BENCH_Z = [13.3, 16.6]
const PRINT_UNITS_X = [17.0, 18.25, 19.5, 23.9, 25.15, 26.4, 27.65, 28.9, 30.15]

export const PROPS: PropPlacement[] = [
  // ── Café ──
  { type: 'cafeBar', x: 17.6, z: 21.9, id: 'bar' },
  { type: 'menuBoard', x: 17.6, z: 21.35, id: 'menu' },
  { type: 'checkinKiosk', x: 20.4, z: 20.75, id: 'kiosk' },
  { type: 'receptionDesk', x: 24.1, z: 21.7, rot: 270, id: 'reception' },
  { type: 'cafeTable4', x: 15.6, z: 24.6, id: 'ct1' },
  { type: 'cafeTable4', x: 18.6, z: 24.6, id: 'ct2' },
  { type: 'cafeTable2', x: 15.6, z: 26.9, id: 'ct3' },
  { type: 'sofaSet', x: 18.9, z: 26.9, id: 'lounge' },
  { type: 'cafeTable2', x: 25.4, z: 23.3, id: 'ct4' },
  { type: 'cafeTable2', x: 27.5, z: 23.3, id: 'ct5' },
  { type: 'cafeTable2', x: 25.4, z: 25.3, id: 'ct6' },
  { type: 'cafeTable2', x: 27.5, z: 25.3, id: 'ct7' },
  { type: 'windowBar', x: 27.1, z: 27.45, id: 'wbar' },
  { type: 'stage', x: 29.8, z: 22.5, rot: 270, id: 'stage' },
  { type: 'plant', x: 13.6, z: 27.4, opts: { size: 1.2 } },
  { type: 'plant', x: 20.6, z: 27.4, opts: { size: 1.0 } },
  { type: 'plant', x: 23.3, z: 20.5, opts: { size: 0.8 } },
  { type: 'plant', x: 30.6, z: 25.0, opts: { size: 0.9 } },

  // ── Print wall (bench-hall side of café glass) ──
  ...PRINT_UNITS_X.map((x, i) => ({ type: 'printerRack', x, z: 19.62, rot: 180, id: `pr${i}` })),

  // ── Bench hall ──
  ...BENCH_Z.flatMap((z, r) => BENCH_X.map((x, c) => ({ type: 'elecBench', x, z, id: `b${r}${c}` }))),
  { type: 'plant', x: 16.5, z: 11.6, opts: { size: 0.9 } },
  { type: 'toolCart', x: 21.1, z: 11.6 },
  { type: 'whiteboardStand', x: 30.4, z: 11.7, rot: 180 },

  // ── CAD / design ──
  { type: 'cadDesk', x: 11.6, z: 16.9, id: 'cad1' },
  { type: 'cadDesk', x: 14.2, z: 16.9, id: 'cad2' },
  { type: 'cadDesk', x: 11.6, z: 19.35, rot: 180, id: 'cad3' },
  { type: 'cadDesk', x: 14.2, z: 19.35, rot: 180, id: 'cad4' },

  // ── Boardroom ──
  { type: 'meetingTable', x: 13.0, z: 13.7, id: 'board' },
  { type: 'wallTV', x: 13.0, z: 11.12, id: 'boardtv' },

  // ── Studios ──
  { type: 'studioTable', x: 3.6, z: 13.3, id: 'stA', opts: { proto: 'drone' } },
  { type: 'studioTable', x: 3.6, z: 17.8, id: 'stB', opts: { proto: 'sensor' } },
  { type: 'whiteboard', x: 0.08, z: 13.3, rot: 90 },
  { type: 'whiteboard', x: 0.08, z: 17.8, rot: 90 },
  { type: 'shelf', x: 3.6, z: 11.3 },
  { type: 'shelf', x: 3.6, z: 15.8 },
  { type: 'plant', x: 6.9, z: 11.6, opts: { size: 0.7 } },
  { type: 'plant', x: 6.9, z: 19.4, opts: { size: 0.7 } },
  { type: 'plant', x: 8.75, z: 15.6, opts: { size: 0.8 } },

  // ── Component library ──
  { type: 'binShelf', x: 33.9, z: 13.0, rot: 90, id: 'aisleA1', opts: { aisle: 'A' } },
  { type: 'binShelf', x: 33.9, z: 15.5, rot: 90, id: 'aisleA2', opts: { aisle: 'A' } },
  { type: 'binShelf', x: 36.1, z: 13.0, rot: 90, id: 'aisleB1', opts: { aisle: 'B' } },
  { type: 'binShelf', x: 36.1, z: 15.5, rot: 90, id: 'aisleB2', opts: { aisle: 'B' } },
  { type: 'binShelf', x: 38.3, z: 13.0, rot: 90, id: 'aisleC1', opts: { aisle: 'C' } },
  { type: 'binShelf', x: 38.3, z: 15.5, rot: 90, id: 'aisleC2', opts: { aisle: 'C' } },
  { type: 'libraryDesk', x: 32.1, z: 15.5, rot: 270, id: 'libdesk' },
  { type: 'pickCart', x: 37.2, z: 18.6 },

  // ── Parts shop ──
  { type: 'shopCounter', x: 36.0, z: 22.3, id: 'shopcounter' },
  { type: 'displayShelf', x: 39.6, z: 24.0, rot: 270 },
  { type: 'displayShelf', x: 39.6, z: 26.1, rot: 270 },
  { type: 'displayTable', x: 34.4, z: 25.6 },
  { type: 'neonSign', x: 36.0, z: 20.12, opts: { text: 'PARTS' } },

  // ── Classroom ──
  ...[3.4, 6.0, 8.6].flatMap((x) => [22.7, 25.5].map((z) => ({ type: 'kidsTable', x, z }))),
  { type: 'teacherScreen', x: 0.1, z: 24.1, rot: 90 },
  { type: 'kitShelf', x: 3.0, z: 20.3 },
  { type: 'kitShelf', x: 5.3, z: 20.3 },

  // ── WC + prayer ──
  { type: 'wcStalls', x: 11.5, z: 21.0 },
  { type: 'prayerMats', x: 11.5, z: 26.0 },

  // ── Fabrication shop ──
  { type: 'laserCO2', x: 12.4, z: 1.55, id: 'laser1' },
  { type: 'laserDesktop', x: 15.7, z: 1.25, id: 'laser2' },
  { type: 'cncRouter', x: 20.3, z: 2.3, id: 'cnc' },
  { type: 'desktopCNC', x: 24.6, z: 1.35, id: 'carvera' },
  { type: 'pcbBench', x: 25.2, z: 4.7, rot: 270, id: 'pcb' },
  { type: 'workbench', x: 12.6, z: 6.6, id: 'workbench' },
  { type: 'pegboard', x: 10.06, z: 6.5, rot: 90 },
  { type: 'materialRack', x: 10.45, z: 3.6, rot: 90 },
  { type: 'bandsaw', x: 15.7, z: 5.2, id: 'bandsaw' },
  { type: 'drillPress', x: 17.1, z: 5.2, id: 'drill' },
  { type: 'assemblyTable', x: 20.3, z: 6.7, id: 'assembly' },
  { type: 'dustCollector', x: 23.4, z: 8.1 },
  { type: 'safetyStation', x: 18.9, z: 8.8, rot: 180 },

  // ── Drone cage ──
  { type: 'droneCage', x: 29.5, z: 3.6, id: 'cage' },
  { type: 'droneTable', x: 28.2, z: 7.55, id: 'dronetable' },

  // ── Wet lab ──
  { type: 'fumeHood', x: 2.2, z: 0.5, id: 'hood' },
  { type: 'bioCabinet', x: 5.0, z: 0.45, id: 'bsc' },
  { type: 'labFridge', x: 7.2, z: 0.45, id: 'fridge' },
  { type: 'labFreezer', x: 8.15, z: 0.45, id: 'freezer' },
  { type: 'labWallBench', x: 0.38, z: 4.4, rot: 90, id: 'wallbench' },
  { type: 'labIsland', x: 5.4, z: 4.6, id: 'island' },
  { type: 'labSideBench', x: 9.6, z: 3.4, rot: 270, id: 'sidebench' },
  { type: 'labSink', x: 5.6, z: 8.6, rot: 180, id: 'sink' },
  { type: 'safetyShower', x: 9.55, z: 7.6 },
  { type: 'chemCabinet', x: 0.45, z: 7.9, rot: 90 },
  { type: 'coatHooks', x: 9.3, z: 8.9, rot: 180 },

  // ── Power room ──
  { type: 'inverterWall', x: 34.9, z: 0.18, id: 'inverters' },
  { type: 'batteryBank', x: 38.0, z: 0.45, id: 'battery' },
  { type: 'serverRack', x: 39.5, z: 3.2, rot: 270, id: 'rack' },
  { type: 'distBoard', x: 33.08, z: 2.4, rot: 90 },

  // ── Store ──
  { type: 'palletRack', x: 33.55, z: 6.6, rot: 90 },
  { type: 'boxStack', x: 36.6, z: 6.4 },
  { type: 'boxStack', x: 37.6, z: 7.6, opts: { n: 2 } },

  // ── Lab street ──
  { type: 'plant', x: 0.6, z: 10.0, opts: { size: 0.7 } },
  { type: 'fireExt', x: 9.75, z: 9.15 },
  { type: 'fireExt', x: 26.2, z: 9.15 },
  { type: 'fireExt', x: 31.2, z: 19.8 },
]

// Exterior props (outside the building footprint)
export const EXTERIOR_PROPS: PropPlacement[] = [
  { type: 'generator', x: 43.6, z: 2.4, id: 'genset' },
  { type: 'acUnit', x: 40.7, z: 12.5, rot: 90 },
  { type: 'acUnit', x: 40.7, z: 14.0, rot: 90 },
  { type: 'acUnit', x: 40.7, z: 15.5, rot: 90 },
  { type: 'deliveryVan', x: 44.2, z: 7.2, rot: 90, id: 'van' },
  { type: 'palm', x: 2.5, z: 29.6 },
  { type: 'palm', x: 12.2, z: 29.6 },
  { type: 'palm', x: 32.6, z: 29.6 },
  { type: 'palm', x: 45.5, z: 29.6 },
  { type: 'streetLamp', x: 8.0, z: 30.6 },
  { type: 'streetLamp', x: 27.0, z: 30.6 },
  { type: 'streetLamp', x: 46.0, z: 30.6 },
  { type: 'vendorStall', x: 6.4, z: 29.9, id: 'vendor' },
  { type: 'kekeParked', x: 40.5, z: 30.2, rot: 90 },
  { type: 'bikeRack', x: 18.0, z: 29.0 },
  { type: 'planterBox', x: 23.9, z: 28.55 },
  { type: 'planterBox', x: 30.2, z: 28.55 },
]

export const STREET = { sidewalkZ: [28, 31] as Vec2, roadZ: [31, 38] as Vec2, farSidewalkZ: [38, 41] as Vec2, laneZ: [33.2, 35.8] }

// Named points used by agents for routing
export const POINTS = {
  spawnWest: [-6, 29.8] as Vec2,
  spawnEast: [50, 29.8] as Vec2,
  entrance: [22, 28.9] as Vec2,
  entranceIn: [22, 27.2] as Vec2,
  gateOut: [22, 20.7] as Vec2,
  gateIn: [22, 19.2] as Vec2,
  classroomDoor: [5.6, 28.9] as Vec2,
  partsDoor: [37.5, 28.9] as Vec2,
  rollerOut: [41.6, 6.5] as Vec2,
  barOrder: [17.6, 22.85] as Vec2,
  libCounterOut: [30.35, 15.5] as Vec2,
  libCounterIn: [31.7, 15.5] as Vec2,
  wcDoor: [13.6, 21.7] as Vec2,
  prayerDoor: [13.6, 26.1] as Vec2,
  stageFront: [27.2, 22.5] as Vec2,
}

export function roomAt(x: number, z: number): Room | undefined {
  // smallest room containing the point
  let best: Room | undefined
  for (const r of ROOMS) {
    const { rect } = r
    if (x >= rect.x && x <= rect.x + rect.w && z >= rect.z && z <= rect.z + rect.d) {
      if (!best || rect.w * rect.d < best.rect.w * best.rect.d) best = r
    }
  }
  return best
}

export const ROOM_BY_ID: Record<string, Room> = Object.fromEntries(ROOMS.map((r) => [r.id, r]))

export function totalArea() {
  return ROOMS.reduce((s, r) => s + r.rect.w * r.rect.d, 0)
}
