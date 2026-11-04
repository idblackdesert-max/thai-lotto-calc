import type { DrawResult } from '../draws'
import { PRIZE_TYPES, SLOT_COUNT, type DigitScores, type PrizeType } from './types'

export type SlotStats = {
  /** จำนวนครั้งที่เลขนี้ออกในตำแหน่งนี้ (ไม่ถ่วงน้ำหนัก) — ใช้แสดง heatmap */
  counts: number[]
  /** ความถี่ถ่วงน้ำหนักให้งวดใหม่มากกว่า */
  weighted: number[]
  /** คะแนน 0..1 (Laplace +1 แล้วหารด้วยค่าสูงสุด) */
  scores: DigitScores
  /** 3 เลขที่ออกบ่อยสุด (ถ่วงน้ำหนัก) */
  hot: number[]
  /** เลขที่หายไปนานสุด และจำนวนงวดที่หายไป */
  cold: { digit: number; absentDraws: number }
}

export type Statistics = Record<PrizeType, SlotStats[]>

/** ตัวอย่างเลขของแต่ละประเภทในหนึ่งงวด (เลขหน้า/ท้าย 3 ตัวมี 2 ชุดต่องวด) */
export function samplesOf(draw: DrawResult, prize: PrizeType): string[] {
  switch (prize) {
    case 'first6':
      return [draw.firstPrize]
    case 'front3':
      return draw.front3
    case 'last3':
      return draw.last3
    case 'last2':
      return [draw.last2]
  }
}

/** draws ต้องเรียงใหม่สุดก่อน (ageIndex 0 = งวดล่าสุด) */
export function computeStatistics(draws: DrawResult[], decay: number): Statistics {
  const result = {} as Statistics
  for (const prize of PRIZE_TYPES) {
    result[prize] = Array.from({ length: SLOT_COUNT[prize] }, (_, pos) => {
      const counts = Array(10).fill(0)
      const weighted = Array(10).fill(0)
      const lastSeen: (number | null)[] = Array(10).fill(null)
      draws.forEach((draw, age) => {
        for (const sample of samplesOf(draw, prize)) {
          const d = Number(sample[pos])
          counts[d] += 1
          weighted[d] += decay ** age
          if (lastSeen[d] === null) lastSeen[d] = age
        }
      })
      const smoothed = weighted.map((w) => w + 1)
      const max = Math.max(...smoothed)
      const order = [...Array(10).keys()].sort((a, b) => weighted[b] - weighted[a] || a - b)
      const absent = lastSeen.map((age) => age ?? draws.length)
      const coldDigit = [...Array(10).keys()].sort((a, b) => absent[b] - absent[a] || a - b)[0]
      return {
        counts,
        weighted,
        scores: smoothed.map((s) => s / max),
        hot: order.slice(0, 3),
        cold: { digit: coldDigit, absentDraws: absent[coldDigit] },
      }
    })
  }
  return result
}
