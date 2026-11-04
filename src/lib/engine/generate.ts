import { defaults, signalKeys, type SignalKey, type Weights } from '../config'
import type { DrawResult } from '../draws'
import { dayInfo, dayPlanetSignal, lunarOf, lunarSignal, numerologyOf, numerologySignal, zodiacOf, zodiacSignal } from './astrology'
import { personalOf, personalSignal, type BirthInput } from './personal'
import { hashString, mulberry32, weightedPick } from './prng'
import { computeStatistics, type Statistics } from './statistics'
import { PRIZE_TYPES, SET_COUNT, SIGNAL_LABELS, SLOT_COUNT, type PrizeType, type UniformSignal } from './types'

export type GenerateInput = {
  drawDate: string
  /** เรียงใหม่สุดก่อน — ใช้ defaults.drawsUsed งวดแรก */
  draws: DrawResult[]
  weights: Weights
  birth: BirthInput | null
  /** ลดคะแนนเลขกาลกิณี */
  cutKalakini: boolean
}

export type Part = { signal: SignalKey | 'kalakini'; label: string; value: number; reason: string }
export type DigitExplanation = { slot: string; prize: PrizeType; position: number; digit: number; total: number; parts: Part[] }
export type PrizeSet = { digits: string; explanations: DigitExplanation[] }

export type GenerateResult = {
  sets: Record<PrizeType, PrizeSet[]>
  /** น้ำหนักจริงที่ใช้ (รวม 100) หลังตัดวันเกิดออกถ้าไม่ได้กรอก */
  percents: Weights
  statistics: Statistics
  drawsUsed: DrawResult[]
  context: {
    day: ReturnType<typeof dayInfo>
    numerology: ReturnType<typeof numerologyOf>
    lunar: ReturnType<typeof lunarOf>
    zodiac: ReturnType<typeof zodiacOf>
    personal: ReturnType<typeof personalOf> | null
    /** วันออกรางวัลตรงกับดาวกาลกิณีของผู้ใช้ */
    drawDayIsKalakini: boolean
  }
}

/** ปรับน้ำหนักให้รวมเป็น 100 — ไม่มีวันเกิด = แบ่งน้ำหนักวันเกิดให้ตัวอื่นตามสัดส่วน */
export function normalizeWeights(weights: Weights, hasBirth: boolean): Weights {
  const effective = { ...weights, personal: hasBirth ? weights.personal : 0 }
  const keys = signalKeys.filter((k) => hasBirth || k !== 'personal')
  const sum = keys.reduce((s, k) => s + Math.max(0, effective[k]), 0)
  return Object.fromEntries(
    signalKeys.map((k) => [k, !keys.includes(k) ? 0 : sum > 0 ? (Math.max(0, effective[k]) / sum) * 100 : 100 / keys.length]),
  ) as Weights
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function generate(input: GenerateInput): GenerateResult {
  const drawsUsed = input.draws.slice(0, defaults.drawsUsed)
  const statistics = computeStatistics(drawsUsed, defaults.decay)
  const percents = normalizeWeights(input.weights, input.birth !== null)
  const personal = input.birth ? personalOf(input.birth) : null
  const day = dayInfo(input.drawDate)

  const uniform: Partial<Record<SignalKey, UniformSignal>> = {
    dayPlanet: dayPlanetSignal(input.drawDate),
    numerology: numerologySignal(input.drawDate),
    lunar: lunarSignal(input.drawDate),
    zodiac: zodiacSignal(input.drawDate),
  }
  if (input.birth) uniform.personal = personalSignal(input.birth)
  const kalakini = personal && input.cutKalakini ? personal.kalakini : null

  /** คะแนนรวมของเลข d ที่ตำแหน่งนั้น พร้อมที่มาของคะแนน */
  function explain(prize: PrizeType, position: number, digit: number): DigitExplanation {
    const parts: Part[] = []
    const stat = statistics[prize][position]
    parts.push({
      signal: 'statistics',
      label: SIGNAL_LABELS.statistics,
      value: percents.statistics * stat.scores[digit],
      reason: `ออก ${stat.counts[digit]} ครั้งในตำแหน่งนี้`,
    })
    for (const key of signalKeys) {
      const sig = uniform[key]
      if (!sig || key === 'statistics') continue
      parts.push({ signal: key, label: SIGNAL_LABELS[key], value: percents[key] * sig.scores[digit], reason: sig.reasons[digit] })
    }
    let total = parts.reduce((s, p) => s + p.value, 0)
    if (digit === kalakini) {
      const cut = total * (1 - defaults.kalakiniPenalty)
      parts.push({ signal: 'kalakini', label: 'ตัดเลขกาลกิณี', value: -cut, reason: `กาลกิณี = ${kalakini}` })
      total -= cut
    }
    return {
      slot: `${prize}[${position}]`,
      prize,
      position,
      digit,
      total: round1(total),
      parts: parts.filter((p) => p.value !== 0).map((p) => ({ ...p, value: round1(p.value) })),
    }
  }

  // ตารางคะแนนเต็มทุกตำแหน่ง (ใช้ค่าไม่ปัดเศษในการเลือก)
  const table = {} as Record<PrizeType, { totals: number[]; stats: number[] }[]>
  for (const prize of PRIZE_TYPES) {
    table[prize] = Array.from({ length: SLOT_COUNT[prize] }, (_, pos) => {
      const totals = Array.from({ length: 10 }, (_, d) => {
        let t = percents.statistics * statistics[prize][pos].scores[d]
        for (const key of signalKeys) if (key !== 'statistics' && uniform[key]) t += percents[key] * uniform[key]!.scores[d]
        return d === kalakini ? t * defaults.kalakiniPenalty : t
      })
      return { totals, stats: statistics[prize][pos].scores }
    })
  }

  /** เลขที่ดีที่สุด (เสมอกัน → คะแนนสถิติสูงกว่า → เลขน้อยกว่า) */
  const ranked = (slot: { totals: number[]; stats: number[] }) =>
    [...Array(10).keys()].sort((a, b) => slot.totals[b] - slot.totals[a] || slot.stats[b] - slot.stats[a] || a - b)

  const seedBase = [
    input.drawDate,
    input.birth ? `${input.birth.date}${input.birth.wednesdayNight ? 'N' : ''}` : 'none',
    signalKeys.map((k) => input.weights[k]).join(','),
    input.cutKalakini ? 'K' : '',
  ].join('|')

  const sets = {} as Record<PrizeType, PrizeSet[]>
  for (const prize of PRIZE_TYPES) {
    const slots = table[prize]
    const rand = mulberry32(hashString(`${seedBase}|${prize}`))
    const sample = () => slots.map((slot) => weightedPick(slot.totals, rand))
    const chosen: number[][] = []

    // ชุดที่ 1: คะแนนสูงสุด
    chosen.push(slots.map((slot) => ranked(slot)[0]))

    // ชุดที่ 2: สุ่มถ่วงน้ำหนัก ห้ามซ้ำชุดแรก
    if (SET_COUNT[prize] > 1) {
      const first = chosen[0].join('')
      let second: number[] | null = null
      for (let i = 0; i < 50 && !second; i++) {
        const s = sample()
        if (s.join('') !== first) second = s
      }
      if (!second) {
        // ไม่สำเร็จใน 50 ครั้ง → เปลี่ยนตำแหน่งที่ "มั่นใจน้อยสุด" เป็นเลขอันดับถัดไป
        const margins = slots.map((slot) => {
          const [a, b] = ranked(slot)
          return slot.totals[a] - slot.totals[b]
        })
        const weakest = margins.indexOf(Math.min(...margins))
        second = [...chosen[0]]
        second[weakest] = ranked(slots[weakest]).find((d) => d !== chosen[0][weakest])!
      }
      chosen.push(second)
    }

    sets[prize] = chosen.map((digits) => ({
      digits: digits.join(''),
      explanations: digits.map((d, pos) => explain(prize, pos, d)),
    }))
  }

  return {
    sets,
    percents,
    statistics,
    drawsUsed,
    context: {
      day,
      numerology: numerologyOf(input.drawDate),
      lunar: lunarOf(input.drawDate),
      zodiac: zodiacOf(input.drawDate),
      personal,
      drawDayIsKalakini: personal !== null && personal.kalakini === day.number,
    },
  }
}
