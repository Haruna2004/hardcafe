import { randomLook, type Look } from '../sim/Character'
import { BRAND } from '../brand'

export type Persona = 'hardware' | 'drone' | 'ev' | 'bio' | 'student' | 'designer' | 'mentor' | 'cafe' | 'shopper' | 'kid' | 'parent'
  | 'labManager' | 'scienceLead' | 'runner' | 'barista' | 'host' | 'clerk' | 'facilities'

export interface CastMember {
  id: string
  name: string
  title: string
  persona: Persona
  team?: string
  project?: string
  sector?: string
  bio: string
  plan: string // membership / how they pay
  arrive: number // minutes since midnight
  leave: number
  look: Partial<Look> & { fem?: boolean }
  seed: number
}

const staffTop = (c = BRAND.colors.yellow): Partial<Look> => ({ top: 'polo', topColor: c, bottom: 'trousers', bottomColor: '#1C1F24' })
const h = (hh: number, mm = 0) => Math.min(hh * 60 + mm, 19 * 60 + 55)

export const CLOSE = h(19, 55)
export const TEAMS: Record<string, { name: string; sector: string; pitch: string; color: string }> = {
  coldchain: { name: 'ColdChain', sector: 'Agriculture + Renewable energy', pitch: 'Solar cold-room sensors so Mile 12 tomato traders stop losing half a truckload to heat.', color: '#3FB6A8' },
  skyfarm: { name: 'SkyFarm', sector: 'Agriculture + Drones', pitch: 'Crop-scouting drones that spot armyworm early for smallholder farms in Kaduna.', color: '#5BA4CF' },
  kekebot: { name: 'Kekebot', sector: 'Transport', pitch: 'A bolt-on electric conversion kit for keke napep. Same tricycle, a fraction of the fuel bill.', color: '#F2C230' },
  malariadx: { name: 'MalariaDx', sector: 'Health', pitch: 'A ₦3,000 reader that turns a paper malaria test into a clinic-grade result on any phone.', color: '#E8546B' },
}

export const STAFF: CastMember[] = [
  { id: 'tunde', name: 'Tunde Bakare', title: 'Lab Manager', persona: 'labManager', bio: 'Ex-electronics engineer. Runs inductions, safety and the hard questions. One of two technical leads.', plan: 'Staff', arrive: h(7, 35), leave: h(20), look: { fem: false, hair: 'fade', glasses: true, beard: true, ...staffTop(BRAND.colors.green) }, seed: 11 },
  { id: 'hauwa', name: 'Dr. Hauwa Bello', title: 'Wet Lab Lead', persona: 'scienceLead', bio: 'Microbiologist. Owns biosafety, reagent ordering and wet-lab training. Second technical lead.', plan: 'Staff', arrive: h(8, 30), leave: h(18), look: { fem: true, hair: 'hijab', ...staffTop(BRAND.colors.green), ankaraSeed: 1 }, seed: 12 },
  { id: 'chiamaka', name: 'Chiamaka Obi', title: 'Ops Associate', persona: 'runner', bio: 'Non-technical hire. The ops app tells her where every part lives and how to fix the common faults.', plan: 'Staff', arrive: h(7, 40), leave: h(20), look: { fem: true, hair: 'braids', ...staffTop() }, seed: 13 },
  { id: 'musa', name: 'Musa Abdullahi', title: 'Ops Associate', persona: 'runner', bio: 'Non-technical hire, ex-logistics. Fastest picker in the library thanks to the AI route.', plan: 'Staff', arrive: h(8), leave: h(21, 30), look: { fem: false, hair: 'cap', ...staffTop(), ankaraSeed: 1 }, seed: 14 },
  { id: 'kemi', name: 'Kemi Adeyemi', title: 'Café Lead', persona: 'barista', bio: 'Runs the coffee bar and the jollof. The café pays for the free Wi-Fi.', plan: 'Staff', arrive: h(7, 30), leave: h(21, 45), look: { fem: true, hair: 'gele', top: 'tee', topColor: '#1C1F24', bottom: 'trousers', bottomColor: '#1C1F24', apron: BRAND.colors.yellow }, seed: 15 },
  { id: 'bola', name: 'Bola Ogun', title: 'Front Desk Host', persona: 'host', bio: 'First face you meet. Handles day passes, lockers and new-member tours.', plan: 'Staff', arrive: h(7, 30), leave: h(21), look: { fem: false, hair: 'fade', ...staffTop() }, seed: 16 },
  { id: 'ife', name: 'Ife Martins', title: 'Parts Shop', persona: 'clerk', bio: 'Sells boards and sensors to walk-ins, tests every item before it leaves the counter.', plan: 'Staff', arrive: h(8, 30), leave: h(19), look: { fem: true, hair: 'puff', ...staffTop(BRAND.colors.violet) }, seed: 17 },
  { id: 'ronke', name: 'Ronke Ajayi', title: 'Facilities', persona: 'facilities', bio: 'Keeps the space clean and stocked. The AI rota tells her which zone needs her next.', plan: 'Staff', arrive: h(7), leave: h(17), look: { fem: true, hair: 'gele', top: 'polo', topColor: '#9AA3AD', bottom: 'skirt', bottomColor: '#2B3A55', ankaraSeed: 3 }, seed: 18 },
]

export const MEMBERS: CastMember[] = [
  { id: 'adaeze', name: 'Adaeze Okafor', title: 'Founder, ColdChain', persona: 'hardware', team: 'coldchain', sector: 'Agriculture', project: 'Solar cold-room sensor v3', bio: 'Electrical engineer (UNILAG). Left a telco job to fix post-harvest loss.', plan: 'Team studio', arrive: h(8, 10), leave: h(19, 30), look: { fem: true, hair: 'braids', top: 'ankara', glasses: true }, seed: 101 },
  { id: 'yusuf', name: 'Yusuf Garba', title: 'Firmware, ColdChain', persona: 'hardware', team: 'coldchain', sector: 'Agriculture', project: 'LoRa firmware', bio: 'Self-taught embedded dev from Kano. Writes the code that keeps sensors alive on a coin cell.', plan: 'Team studio', arrive: h(9, 0), leave: h(20, 30), look: { fem: false, hair: 'fade', top: 'hoodie', topColor: '#2E5C8A' }, seed: 102 },
  { id: 'tolu', name: 'Tolu Ade', title: 'Design, ColdChain', persona: 'designer', team: 'coldchain', sector: 'Agriculture', project: 'IP54 enclosure', bio: 'Industrial designer. Lives between the CAD desks and the print wall.', plan: 'Team studio', arrive: h(9, 40), leave: h(18, 30), look: { fem: true, hair: 'afro', top: 'tee', topColor: '#F2C230' }, seed: 103 },
  { id: 'emeka', name: 'Emeka Nwosu', title: 'Founder, SkyFarm', persona: 'drone', team: 'skyfarm', sector: 'Agriculture', project: 'Scout drone airframe', bio: 'Aerospace grad. Tunes PID loops in the cage before field days in Kaduna.', plan: 'Team studio', arrive: h(8, 30), leave: h(19), look: { fem: false, hair: 'locs', top: 'shirt', topColor: '#0E7A4F' }, seed: 104 },
  { id: 'zainab', name: 'Zainab Lawal', title: 'Vision AI, SkyFarm', persona: 'drone', team: 'skyfarm', sector: 'Agriculture', project: 'Armyworm detector', bio: 'Trains tiny models that run on the drone, not in the cloud.', plan: 'Team studio', arrive: h(9, 15), leave: h(18), look: { fem: true, hair: 'hijab', top: 'blouse', topColor: '#7B5CD6', ankaraSeed: 4 }, seed: 105 },
  { id: 'femi', name: 'Femi Johnson', title: 'Founder, Kekebot', persona: 'ev', team: 'kekebot', sector: 'Transport', project: 'Motor mount v2', bio: 'Mechanic turned engineer. Knows every keke model on the mainland.', plan: 'Pro member', arrive: h(8, 45), leave: h(20), look: { fem: false, hair: 'bald', beard: true, top: 'polo', topColor: '#C8643B' }, seed: 106 },
  { id: 'ibrahim', name: 'Ibrahim Sule', title: 'Power electronics, Kekebot', persona: 'ev', team: 'kekebot', sector: 'Transport', project: 'Motor controller', bio: 'Designs the 3 kW controller. Has burnt exactly four MOSFETs this week.', plan: 'Pro member', arrive: h(10), leave: h(21), look: { fem: false, hair: 'cap', top: 'tee', topColor: '#1C1F24' }, seed: 107 },
  { id: 'ngozi', name: 'Dr. Ngozi Eze', title: 'Founder, MalariaDx', persona: 'bio', team: 'malariadx', sector: 'Health', project: 'Assay validation', bio: 'Medical lab scientist. Needed a BSL-1 bench without building a lab first.', plan: 'Wet-lab bench (monthly)', arrive: h(9), leave: h(17, 30), look: { fem: true, hair: 'bun', top: 'blouse', topColor: '#E8546B', glasses: true }, seed: 108 },
  { id: 'efe', name: 'Efe Okoro', title: 'Chemist, MalariaDx', persona: 'bio', team: 'malariadx', sector: 'Health', project: 'Reader optics', bio: 'Chemist who learned electronics here. Bridges the wet lab and the bench hall.', plan: 'Wet-lab bench (monthly)', arrive: h(10, 15), leave: h(19), look: { fem: false, hair: 'twists', top: 'shirt', topColor: '#5BA4CF' }, seed: 109 },
  { id: 'ime', name: 'Ime Udo', title: 'Founder, AquaCheck', persona: 'bio', sector: 'Health', project: 'Borehole water test kit', bio: 'Environmental scientist from Uyo. Tests water samples brought in from Ikorodu.', plan: 'Wet-lab day pass', arrive: h(11), leave: h(16, 30), look: { fem: true, hair: 'twists', top: 'tee', topColor: '#3FB6A8' }, seed: 110 },
  { id: 'dayo', name: 'Dayo Adebayo', title: 'Student, UNILAG Mech Eng', persona: 'student', sector: 'Education', project: 'Final-year robot arm', bio: 'Final-year project needs a laser cutter his department does not have.', plan: 'Student day pass', arrive: h(10, 30), leave: h(18), look: { fem: false, hair: 'afro', top: 'tee', topColor: '#E8546B' }, seed: 111 },
  { id: 'fatima', name: 'Fatima Musa', title: 'Student, Miva (Computing)', persona: 'student', sector: 'Education', project: 'IoT coursework', bio: 'Studies online, does her practicals here on Fridays.', plan: 'Miva practicals (sponsored)', arrive: h(11), leave: h(17), look: { fem: true, hair: 'hijab', top: 'blouse', topColor: '#F4F1EA', ankaraSeed: 5 }, seed: 112 },
  { id: 'obinna', name: 'Obinna Chukwu', title: 'Student, Yabatech Electrical', persona: 'student', sector: 'Education', project: 'Smart meter', bio: 'Builds prepaid-meter hacks for his estate. Wants a job at a hardware startup.', plan: 'Student monthly', arrive: h(12), leave: h(20, 30), look: { fem: false, hair: 'fade', top: 'hoodie', topColor: '#3A3F47' }, seed: 113 },
  { id: 'seun', name: 'Seun Lawson', title: 'Freelance PCB designer', persona: 'designer', sector: 'Services', project: 'Client boards', bio: 'Designs boards for clients in Lagos and Berlin. Mills test boards before paying for fab.', plan: 'Maker member', arrive: h(9, 30), leave: h(18, 30), look: { fem: false, hair: 'locs', top: 'ankara', ankaraSeed: 7 }, seed: 114 },
  { id: 'okon', name: 'Engr. Okon Bassey', title: 'Retired engineer, mentor', persona: 'mentor', sector: 'Mentorship', project: 'Office hours', bio: '30 years in oil & gas instrumentation. Mentors for free on Fridays.', plan: 'Mentor (free)', arrive: h(10), leave: h(15), look: { fem: false, hair: 'bald', beard: true, top: 'shirt', topColor: '#F4F1EA', glasses: true, hairColor: '#9a9a9a' }, seed: 115 },
  { id: 'kunle', name: 'Kunle Bello', title: 'Product designer', persona: 'designer', sector: 'Services', project: 'Solar lantern housing', bio: 'Designs consumer products for a Lagos solar brand. Prints iterations overnight.', plan: 'Maker member', arrive: h(13), leave: h(21), look: { fem: false, hair: 'twists', top: 'tee', topColor: '#0E7A4F' }, seed: 116 },
]

const FIRST_F = ['Amaka', 'Funke', 'Halima', 'Blessing', 'Ngozi', 'Temi', 'Uche', 'Aisha', 'Bisola', 'Ebere', 'Folake', 'Jumoke', 'Nkechi', 'Rukayat', 'Simi', 'Yetunde', 'Ifeoma', 'Mariam', 'Esther', 'Damilola']
const FIRST_M = ['Chidi', 'Segun', 'Abubakar', 'Tobi', 'Kelechi', 'Wale', 'Usman', 'Gbenga', 'Nnamdi', 'Bayo', 'Sola', 'Ikenna', 'Babatunde', 'Chinedu', 'Kayode', 'Sadiq', 'Ejike', 'Lanre', 'Victor', 'Daniel']
const LAST = ['Okeke', 'Adeyemi', 'Bello', 'Eze', 'Afolabi', 'Danjuma', 'Okafor', 'Balogun', 'Ibrahim', 'Nwankwo', 'Ogunleye', 'Yusuf', 'Etim', 'Akpan', 'Olawale', 'Onyeka', 'Fashola', 'Abiodun']

export function randomPerson(seed: number, persona: Persona) {
  let s = seed * 9301 + 49297
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280)
  const fem = r() > 0.5
  const kid = persona === 'kid'
  const first = fem ? FIRST_F[Math.floor(r() * FIRST_F.length)] : FIRST_M[Math.floor(r() * FIRST_M.length)]
  const last = LAST[Math.floor(r() * LAST.length)]
  const look = randomLook(seed * 7 + 3, { fem, ...(kid ? { child: true, bottom: fem ? 'skirt' : 'shorts' } : {}) })
  return { name: kid ? first : `${first} ${last}`, look, fem }
}
