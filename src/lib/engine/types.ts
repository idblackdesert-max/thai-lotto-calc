import type { SignalKey } from '../config'

export const PRIZE_TYPES = ['first6', 'front3', 'last3', 'last2'] as const
export type PrizeType = (typeof PRIZE_TYPES)[number]

/** จำนวนหลักของแต่ละประเภท */
export const SLOT_COUNT: Record<PrizeType, number> = { first6: 6, front3: 3, last3: 3, last2: 2 }
/** จำนวนชุดที่ต้องสร้าง */
export const SET_COUNT: Record<PrizeType, number> = { first6: 1, front3: 2, last3: 2, last2: 1 }

export const PRIZE_LABELS: Record<PrizeType, string> = {
  first6: 'รางวัลที่ 1',
  front3: 'เลขหน้า 3 ตัว',
  last3: 'เลขท้าย 3 ตัว',
  last2: 'เลขท้าย 2 ตัว',
}

export const SIGNAL_LABELS: Record<SignalKey, string> = {
  statistics: 'สถิติ 24 งวด',
  dayPlanet: 'เลขประจำวัน',
  numerology: 'เลขศาสตร์วันที่',
  lunar: 'ข้างขึ้นข้างแรม',
  zodiac: 'ปีนักษัตร',
  personal: 'วันเกิดของคุณ',
}

/** คะแนนเลข 0–9 ช่วง 0..1 */
export type DigitScores = number[]

/** สัญญาณที่ให้คะแนนเท่ากันทุกตำแหน่ง (โหราศาสตร์/วันเกิด) พร้อมเหตุผลรายเลข */
export type UniformSignal = { scores: DigitScores; reasons: string[] }
