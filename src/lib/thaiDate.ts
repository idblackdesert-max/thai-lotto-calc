// วันที่ทั้งหมดในระบบเป็นสตริง ISO "YYYY-MM-DD" (ปฏิทินสากล) ตามเวลาไทย UTC+7

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]
export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]
export const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']

export type BangkokClock = { date: string; hour: number; minute: number }

/** แปลงเวลาจริง (instant) เป็นวันที่และเวลาตามเวลาไทย */
export function toBangkok(instant: Date): BangkokClock {
  const shifted = new Date(instant.getTime() + BANGKOK_OFFSET_MS)
  return {
    date: shifted.toISOString().slice(0, 10),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  }
}

export function isoDate(year: number, month: number, day: number): string {
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function parseIso(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split('-').map(Number)
  return { year, month, day }
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** 0 = อาทิตย์ */
export function dayOfWeek(iso: string): number {
  const { year, month, day } = parseIso(iso)
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay()
}

export function daysBetween(fromIso: string, toIso: string): number {
  const a = parseIso(fromIso)
  const b = parseIso(toIso)
  return Math.round((Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86_400_000)
}

export const toBuddhistYear = (year: number) => year + 543

/** "วันจันทร์ที่ 16 พฤศจิกายน 2569" */
export function formatThaiLong(iso: string): string {
  const { year, month, day } = parseIso(iso)
  return `วัน${THAI_DAYS[dayOfWeek(iso)]}ที่ ${day} ${THAI_MONTHS[month - 1]} ${toBuddhistYear(year)}`
}

/** "จันทร์ 16 พ.ย. 2569" */
export function formatThaiShort(iso: string): string {
  const { year, month, day } = parseIso(iso)
  return `${THAI_DAYS[dayOfWeek(iso)]} ${day} ${THAI_MONTHS_SHORT[month - 1]} ${toBuddhistYear(year)}`
}
