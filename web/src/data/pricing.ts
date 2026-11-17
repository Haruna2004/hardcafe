// Pricing used by the sim. Benchmarked against research/02-economics.md (Nov 2026):
// CafeOne day pass ₦8,525 (₦6,310 Sterling cardholders), month ₦170,501; median formal pay ₦217k/month;
// PLA material cost ≈ ₦50/g; FX ≈ ₦1,354/$.
export const FX = 1354

export const PRICES = {
  dayPass: 10000, // bench + tools + Wi-Fi + power; consumables extra
  studentDay: 4000,
  makerMonthly: 75000,
  proMonthly: 130000, // 24/7, locker, ₦20k machine credit
  studioMonthly: 650000, // private team studio, 4–6 people
  wetBenchDay: 15000,
  wetBenchMonthly: 180000,
  print3dPerGram: 120,
  laserPerMin: 300,
  cncPerHour: 25000,
  pcbMillPerBoard: 15000,
  smtPerBoard: 9000,
  droneCagePerHour: 12000,
  kidsSession: 15000,
  bootcamp: 250000,
  coffee: 3000,
  jollof: 6500,
  snack: 1800,
}

export type Stream = 'passes' | 'members' | 'machines' | 'parts' | 'cafe' | 'studios' | 'lab' | 'training' | 'events'

export const STREAM_LABEL: Record<Stream, string> = {
  passes: 'Day passes',
  members: 'Memberships',
  machines: 'Machine time',
  parts: 'Parts shop',
  cafe: 'Café',
  studios: 'Team studios',
  lab: 'Wet lab',
  training: 'Classes',
  events: 'Events',
}

export const STREAM_COLOR: Record<Stream, string> = {
  passes: '#F2C230',
  members: '#0E7A4F',
  machines: '#C8643B',
  parts: '#7B5CD6',
  cafe: '#E8546B',
  studios: '#5BA4CF',
  lab: '#3FB6A8',
  training: '#F07F2D',
  events: '#9AA3AD',
}

export interface Sku { id: string; name: string; aisle: 'A' | 'B' | 'C'; bin: number; price: number; stock: number; min: number }

// A slice of the component library (prices ₦, local retail is often ~2× US list)
export const SKUS: Sku[] = [
  { id: 'esp32s3', name: 'ESP32-S3 dev board', aisle: 'A', bin: 12, price: 14000, stock: 38, min: 15 },
  { id: 'uno', name: 'Arduino Uno R4', aisle: 'A', bin: 3, price: 52000, stock: 12, min: 5 },
  { id: 'rp2040', name: 'Raspberry Pi Pico W', aisle: 'A', bin: 7, price: 12000, stock: 30, min: 10 },
  { id: 'pi5', name: 'Raspberry Pi 5 (4GB)', aisle: 'A', bin: 1, price: 125000, stock: 6, min: 3 },
  { id: 'lora', name: 'LoRa SX1276 module', aisle: 'A', bin: 18, price: 11000, stock: 22, min: 8 },
  { id: 'ds18b20', name: 'DS18B20 temp probe', aisle: 'B', bin: 4, price: 2500, stock: 80, min: 30 },
  { id: 'bme280', name: 'BME280 sensor', aisle: 'B', bin: 6, price: 6500, stock: 26, min: 10 },
  { id: 'mpu6050', name: 'MPU-6050 IMU', aisle: 'B', bin: 9, price: 4000, stock: 31, min: 10 },
  { id: 'gps', name: 'u-blox GPS module', aisle: 'B', bin: 14, price: 18000, stock: 11, min: 5 },
  { id: 'lipo', name: 'LiPo 3S 2200mAh', aisle: 'C', bin: 2, price: 32000, stock: 9, min: 6 },
  { id: 'esc', name: '30A ESC', aisle: 'C', bin: 5, price: 15000, stock: 16, min: 8 },
  { id: 'motor', name: '2207 brushless motor', aisle: 'C', bin: 8, price: 17000, stock: 20, min: 8 },
  { id: 'solar10', name: '10W solar panel', aisle: 'C', bin: 20, price: 16000, stock: 14, min: 5 },
  { id: 'resistors', name: 'Resistor kit (600 pcs)', aisle: 'B', bin: 1, price: 7000, stock: 25, min: 10 },
  { id: 'caps', name: 'Capacitor kit', aisle: 'B', bin: 2, price: 8000, stock: 18, min: 8 },
  { id: 'mosfet', name: 'Logic MOSFETs (10)', aisle: 'B', bin: 12, price: 5000, stock: 40, min: 15 },
  { id: 'pla', name: 'PLA filament 1 kg', aisle: 'C', bin: 30, price: 50000, stock: 24, min: 10 },
  { id: 'acrylic', name: 'Acrylic sheet 3 mm', aisle: 'C', bin: 32, price: 18000, stock: 15, min: 6 },
  { id: 'tips', name: 'Pipette tips (rack)', aisle: 'B', bin: 22, price: 9000, stock: 40, min: 12 },
  { id: 'agar', name: 'Agar plates (10)', aisle: 'B', bin: 24, price: 12000, stock: 20, min: 8 },
]
