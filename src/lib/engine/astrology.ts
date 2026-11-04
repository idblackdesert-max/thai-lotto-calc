import { MoonPhase } from 'astronomy-engine'
import { astrology, type Astrology } from '../config'
import { dayOfWeek, parseIso, toBuddhistYear } from '../thaiDate'
import type { UniformSignal } from './types'

/** บวกเลขทุกหลักซ้ำจนเหลือหลักเดียว (1–9) */
export function reduceDigit(n: number): number {
  let x = Math.abs(n)
  while (x > 9) x = String(x).split('').reduce((s, c) => s + Number(c), 0)
  return x
}

export const digitSum = (text: string) => text.split('').reduce((s, c) => s + Number(c), 0)

/** สร้างสัญญาณจากรายการ (เลข, ความแรง, เหตุผล) แล้วปรับให้อยู่ช่วง 0..1 */
export function buildSignal(boosts: { digit: number; strength: number; reason: string }[]): UniformSignal {
  const scores = Array(10).fill(0)
  const reasons: string[][] = Array.from({ length: 10 }, () => [])
  for (const b of boosts) {
    scores[b.digit] += b.strength
    reasons[b.digit].push(b.reason)
  }
  const max = Math.max(...scores)
  return { scores: scores.map((s) => (max > 0 ? s / max : 0)), reasons: reasons.map((r) => r.join(' + ')) }
}

export function dayInfo(iso: string, config: Astrology = astrology) {
  return config.days.find((d) => d.dayOfWeek === dayOfWeek(iso))!
}

/** (ก) เลขประจำวันของวันออกรางวัล — ออกรางวัลตอนบ่าย วันพุธจึงใช้ 4 */
export function dayPlanetSignal(drawIso: string, config: Astrology = astrology): UniformSignal {
  const day = dayInfo(drawIso, config)
  return buildSignal([{ digit: day.number, strength: config.strengths.primary, reason: `วัน${day.name} = ${day.number}` }])
}

/** (ข) เลขศาสตร์ของวันที่: วัน+เดือน+ปี พ.ศ. (หลัก) · วันอย่างเดียว · เดือนอย่างเดียว (รอง) */
export function numerologyOf(drawIso: string) {
  const { year, month, day } = parseIso(drawIso)
  const be = toBuddhistYear(year)
  return {
    total: reduceDigit(digitSum(`${day}${month}${be}`)),
    day: reduceDigit(day),
    month: reduceDigit(month),
    be,
  }
}

export function numerologySignal(drawIso: string, config: Astrology = astrology): UniformSignal {
  const n = numerologyOf(drawIso)
  const { primary, secondary } = config.strengths
  return buildSignal([
    { digit: n.total, strength: primary, reason: `ผลรวมวันที่ ${drawIso.slice(8)}/${drawIso.slice(5, 7)}/${n.be} = ${n.total}` },
    { digit: n.day, strength: secondary, reason: `วันที่ = ${n.day}` },
    { digit: n.month, strength: secondary, reason: `เดือน = ${n.month}` },
  ])
}

/** (ค) ข้างขึ้นข้างแรมโดยประมาณ จากมุมดวงจันทร์ (1 ค่ำ ≈ 12°) ณ 16:00 น. วันออกรางวัล */
export function lunarOf(drawIso: string) {
  const angle = MoonPhase(new Date(`${drawIso}T16:00:00+07:00`))
  const waxing = angle < 180
  const day = Math.min(15, Math.floor((waxing ? angle : angle - 180) / 12) + 1)
  return { waxing, day, label: `${waxing ? 'ข้างขึ้น' : 'ข้างแรม'} ${day} ค่ำ` }
}

export function lunarSignal(drawIso: string, config: Astrology = astrology): UniformSignal {
  const l = lunarOf(drawIso)
  return buildSignal([{ digit: l.day % 10, strength: config.strengths.primary, reason: `${l.label} (โดยประมาณ) → ${l.day % 10}` }])
}

/** (ง) ปีนักษัตร ชวด=1 … กุน=12 ใช้เลขหลักหน่วย */
export function zodiacOf(drawIso: string, config: Astrology = astrology) {
  const { year, month, day } = parseIso(drawIso)
  const beforeSongkran = month < 4 || (month === 4 && day < 13)
  const zodiacYear = config.zodiac.yearStart === 'songkran' && beforeSongkran ? year - 1 : year
  const index = (((zodiacYear - config.zodiac.ratYear) % 12) + 12) % 12
  return { number: index + 1, name: config.zodiac.names[index] }
}

export function zodiacSignal(drawIso: string, config: Astrology = astrology): UniformSignal {
  const z = zodiacOf(drawIso, config)
  return buildSignal([{ digit: z.number % 10, strength: config.strengths.primary, reason: `ปี${z.name} (${z.number}) → ${z.number % 10}` }])
}
