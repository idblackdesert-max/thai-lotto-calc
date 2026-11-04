import { describe, expect, it } from 'vitest'
import { drawDaysOfMonth, nextDrawDate } from './drawDate'
import { formatThaiLong, formatThaiShort } from './thaiDate'

/** สร้างเวลาจริงจากเวลาไทย เช่น bkk('2026-11-16', 15, 59) */
const bkk = (iso: string, hour = 12, minute = 0) =>
  new Date(`${iso}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00+07:00`)

describe('drawDaysOfMonth', () => {
  it('เดือนปกติออกวันที่ 1 และ 16', () => {
    expect(drawDaysOfMonth(2026, 11)).toEqual([1, 16])
  })
  it('มกราคมออกวันที่ 2 และ 17', () => {
    expect(drawDaysOfMonth(2026, 1)).toEqual([2, 17])
  })
  it('พฤษภาคมออกวันที่ 2 และ 16', () => {
    expect(drawDaysOfMonth(2026, 5)).toEqual([2, 16])
  })
  it('override รายปี: ม.ค. 2567 ออกวันที่ 17 อย่างเดียว / ธ.ค. 2566 มีงวด 30', () => {
    expect(drawDaysOfMonth(2024, 1)).toEqual([17])
    expect(drawDaysOfMonth(2023, 12)).toEqual([1, 16, 30])
    expect(drawDaysOfMonth(2023, 7)).toEqual([1, 16, 31])
    expect(drawDaysOfMonth(2023, 8)).toEqual([16])
  })
})

describe('nextDrawDate', () => {
  it('กลางเดือน → งวด 16', () => {
    expect(nextDrawDate(bkk('2026-11-04'))).toBe('2026-11-16')
  })
  it('วันออกรางวัลก่อน 16:00 → งวดวันนี้', () => {
    expect(nextDrawDate(bkk('2026-11-16', 15, 59))).toBe('2026-11-16')
  })
  it('วันออกรางวัลตั้งแต่ 16:00 → งวดถัดไป', () => {
    expect(nextDrawDate(bkk('2026-11-16', 16, 0))).toBe('2026-12-01')
  })
  it('รอยต่อเดือน', () => {
    expect(nextDrawDate(bkk('2026-10-31'))).toBe('2026-11-01')
    expect(nextDrawDate(bkk('2026-02-28'))).toBe('2026-03-01')
  })
  it('รอยต่อปี: หลังงวด 16 ธ.ค. → 2 ม.ค. ปีถัดไป', () => {
    expect(nextDrawDate(bkk('2026-12-16', 17))).toBe('2027-01-02')
    expect(nextDrawDate(bkk('2026-12-31', 23, 59))).toBe('2027-01-02')
  })
  it('มกราคม: 1 ม.ค. ไม่ใช่วันออกรางวัล', () => {
    expect(nextDrawDate(bkk('2027-01-01', 10))).toBe('2027-01-02')
    expect(nextDrawDate(bkk('2027-01-02', 16, 30))).toBe('2027-01-17')
    expect(nextDrawDate(bkk('2027-01-16'))).toBe('2027-01-17')
  })
  it('พฤษภาคม: 1 พ.ค. เลื่อนเป็น 2 พ.ค.', () => {
    expect(nextDrawDate(bkk('2026-04-16', 16))).toBe('2026-05-02')
    expect(nextDrawDate(bkk('2026-05-01'))).toBe('2026-05-02')
  })
  it('override รายปี ธ.ค. 2566 มีงวด 30 และ ม.ค. 2567 ไม่มีงวด 2', () => {
    expect(nextDrawDate(bkk('2023-12-16', 17))).toBe('2023-12-30')
    expect(nextDrawDate(bkk('2023-12-30', 17))).toBe('2024-01-17')
  })
  it('ใช้เวลาไทย ไม่ใช่เวลา UTC: 23:30 UTC ของ 15 พ.ย. = 06:30 วันที่ 16 ไทย', () => {
    expect(nextDrawDate(new Date('2026-11-15T23:30:00Z'))).toBe('2026-11-16')
    expect(nextDrawDate(new Date('2026-11-16T09:00:00Z'))).toBe('2026-12-01')
  })
})

describe('รูปแบบวันที่ไทย', () => {
  it('แบบยาวและแบบสั้น ใช้ปี พ.ศ.', () => {
    expect(formatThaiLong('2026-11-16')).toBe('วันจันทร์ที่ 16 พฤศจิกายน 2569')
    expect(formatThaiShort('2026-11-16')).toBe('จันทร์ 16 พ.ย. 2569')
  })
})
