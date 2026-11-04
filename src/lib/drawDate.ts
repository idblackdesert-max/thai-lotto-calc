import { defaults, drawExceptions, type DrawExceptions } from './config'
import { daysInMonth, isoDate, toBangkok } from './thaiDate'

/** วันออกรางวัลของเดือนนั้น (เรียงน้อยไปมาก) ตามลำดับความสำคัญ: override รายปี > กฎรายเดือน > ค่าปกติ */
export function drawDaysOfMonth(year: number, month: number, rules: DrawExceptions = drawExceptions): number[] {
  const key = `${year}-${String(month).padStart(2, '0')}`
  const days = rules.yearMonthOverrides[key] ?? rules.monthRules[String(month)] ?? rules.defaultDays
  return [...days].filter((d) => d <= daysInMonth(year, month)).sort((a, b) => a - b)
}

/**
 * งวดถัดไปนับจากเวลาอ้างอิง (เวลาไทย)
 * ถ้าวันนี้เป็นวันออกรางวัลและยังไม่ถึง cutoffHour (16:00) ให้นับงวดวันนี้
 */
export function nextDrawDate(
  now: Date,
  rules: DrawExceptions = drawExceptions,
  cutoffHour: number = defaults.cutoffHour,
): string {
  const clock = toBangkok(now)
  let [year, month] = clock.date.split('-').map(Number)
  for (let i = 0; i < 24; i++) {
    for (const day of drawDaysOfMonth(year, month, rules)) {
      const candidate = isoDate(year, month, day)
      if (candidate > clock.date) return candidate
      if (candidate === clock.date && clock.hour < cutoffHour) return candidate
    }
    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }
  throw new Error('ไม่พบวันออกรางวัลใน 24 เดือนข้างหน้า — ตรวจไฟล์ config/draw-exceptions.json')
}
