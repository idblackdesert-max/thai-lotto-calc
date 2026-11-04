import { astrology, type Astrology } from '../config'
import { dayOfWeek, parseIso, toBuddhistYear } from '../thaiDate'
import { buildSignal, digitSum, reduceDigit } from './astrology'
import type { UniformSignal } from './types'

export type BirthInput = { date: string; wednesdayNight: boolean }

/** เลขดาวประจำวันเกิด (วันพุธหลัง 18:00 = ราหู 8) */
export function birthPlanet(birth: BirthInput, config: Astrology = astrology): number {
  const dow = dayOfWeek(birth.date)
  if (dow === 3 && birth.wednesdayNight) return config.wednesdayNightNumber
  return config.days.find((d) => d.dayOfWeek === dow)!.number
}

/** ทักษา: เริ่มนับจากดาววันเกิด เรียงตามวงทักษา คืนค่า ตำแหน่ง → เลขดาว */
export function thaksa(planet: number, config: Astrology = astrology): Record<string, number> {
  const start = config.thaksaOrder.indexOf(planet)
  if (start < 0) throw new Error(`ไม่มีดาว ${planet} ในวงทักษา`)
  return Object.fromEntries(
    config.thaksaRoles.map((role, i) => [role, config.thaksaOrder[(start + i) % config.thaksaOrder.length]]),
  )
}

export function personalOf(birth: BirthInput, config: Astrology = astrology) {
  const planet = birthPlanet(birth, config)
  const { year, month, day } = parseIso(birth.date)
  const t = thaksa(planet, config)
  return {
    planet,
    planetName: config.planetNames[String(planet)],
    numerology: reduceDigit(digitSum(`${day}${month}${toBuddhistYear(year)}`)),
    thaksa: t,
    sri: t['ศรี'],
    det: t['เดช'],
    kalakini: t['กาลกิณี'],
  }
}

/** เลขวันเกิด (หลัก) · เลขศาสตร์วันเกิด (รอง) · ศรี (หลัก) · เดช (รอง) */
export function personalSignal(birth: BirthInput, config: Astrology = astrology): UniformSignal {
  const p = personalOf(birth, config)
  const { primary, secondary } = config.strengths
  return buildSignal([
    { digit: p.planet, strength: primary, reason: `เกิดวัน${p.planetName} = ${p.planet}` },
    { digit: p.numerology, strength: secondary, reason: `ผลรวมวันเกิด = ${p.numerology}` },
    { digit: p.sri, strength: primary, reason: `ศรี = ${p.sri}` },
    { digit: p.det, strength: secondary, reason: `เดช = ${p.det}` },
  ])
}
