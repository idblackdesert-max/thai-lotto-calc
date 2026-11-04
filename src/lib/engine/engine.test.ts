import { describe, expect, it } from 'vitest'
import drawsJson from '../../../public/data/draws.json'
import { astrology, defaults, type Weights } from '../config'
import { mulberry32 } from './prng'
import { drawsFileSchema, type DrawResult } from '../draws'
import { lunarOf, numerologyOf, reduceDigit, zodiacOf } from './astrology'
import { generate, normalizeWeights, type GenerateInput } from './generate'
import { birthPlanet, thaksa } from './personal'
import { computeStatistics } from './statistics'
import { PRIZE_TYPES, SET_COUNT, SLOT_COUNT } from './types'

const realDraws = drawsFileSchema.parse(drawsJson).draws
const baseInput: GenerateInput = {
  drawDate: '2026-11-16',
  draws: realDraws,
  weights: defaults.weights,
  birth: null,
  cutKalakini: true,
  nonce: 0,
}
const zeroWeights: Weights = { statistics: 0, dayPlanet: 0, numerology: 0, lunar: 0, zodiac: 0, personal: 0 }

describe('ทักษา (ครบ 8 ดาว)', () => {
  // วันเกิดตัวอย่าง: 15–21 พ.ย. 2026 = อาทิตย์–เสาร์
  it.each([
    ['อาทิตย์', '2026-11-15', false, 1, { เดช: 3, ศรี: 4, กาลกิณี: 6 }],
    ['จันทร์', '2026-11-16', false, 2, { เดช: 4, ศรี: 7, กาลกิณี: 1 }],
    ['อังคาร', '2026-11-17', false, 3, { เดช: 7, ศรี: 5, กาลกิณี: 2 }],
    ['พุธกลางวัน', '2026-11-18', false, 4, { เดช: 5, ศรี: 8, กาลกิณี: 3 }],
    ['พุธกลางคืน (ราหู)', '2026-11-18', true, 8, { เดช: 1, ศรี: 2, กาลกิณี: 5 }],
    ['พฤหัสบดี', '2026-11-19', false, 5, { เดช: 6, ศรี: 1, กาลกิณี: 7 }],
    ['ศุกร์', '2026-11-20', false, 6, { เดช: 2, ศรี: 3, กาลกิณี: 8 }],
    ['เสาร์', '2026-11-21', false, 7, { เดช: 8, ศรี: 6, กาลกิณี: 4 }],
  ])('เกิดวัน%s', (_name, date, night, planet, expected) => {
    const p = birthPlanet({ date, wednesdayNight: night })
    expect(p).toBe(planet)
    expect(thaksa(p)).toMatchObject(expected)
  })
  it('ติ๊กพุธกลางคืนแต่ไม่ได้เกิดวันพุธ → ไม่มีผล', () => {
    expect(birthPlanet({ date: '2026-11-15', wednesdayNight: true })).toBe(1)
  })
})

describe('ศาสตร์ของวันออกรางวัล', () => {
  it('ลดเลขเหลือหลักเดียว', () => {
    expect(reduceDigit(31)).toBe(4)
    expect(reduceDigit(99)).toBe(9)
    expect(reduceDigit(7)).toBe(7)
  })
  it('เลขศาสตร์ 16/11/2569 = 1+6+1+1+2+5+6+9 = 31 → 4', () => {
    expect(numerologyOf('2026-11-16')).toMatchObject({ total: 4, day: 7, month: 2, be: 2569 })
  })
  it('ปีนักษัตร 2569 = มะเมีย (7) · นับแบบสงกรานต์ ต้น เม.ย. ยังเป็นมะเส็ง', () => {
    expect(zodiacOf('2026-11-16')).toEqual({ number: 7, name: 'มะเมีย' })
    const songkran = { ...astrology, zodiac: { ...astrology.zodiac, yearStart: 'songkran' as const } }
    expect(zodiacOf('2026-04-01', songkran)).toEqual({ number: 6, name: 'มะเส็ง' })
    expect(zodiacOf('2026-04-13', songkran)).toEqual({ number: 7, name: 'มะเมีย' })
  })
  it('ข้างขึ้นข้างแรม: วันเพ็ญ 5 พ.ย. 2568 ≈ ขึ้น 14–15 ค่ำ · เดือนดับ 20 พ.ย. 2568 ≈ ขึ้น 1 ค่ำ', () => {
    const full = lunarOf('2025-11-05')
    expect(full.waxing).toBe(true)
    expect(full.day).toBeGreaterThanOrEqual(14)
    expect(lunarOf('2025-11-20')).toMatchObject({ waxing: true, day: 1 })
  })
})

describe('สถิติ', () => {
  const draws: DrawResult[] = [
    { drawDate: '2026-11-01', firstPrize: '000001', front3: ['012', '019'], last3: ['345', '345'], last2: '05', source: 'https://x.y/' },
    { drawDate: '2026-10-16', firstPrize: '900001', front3: ['112', '119'], last3: ['345', '340'], last2: '07', source: 'https://x.y/' },
  ]
  const stats = computeStatistics(draws, 0.5)
  it('นับครบทุกตัวอย่าง (เลขหน้า 3 ตัวใช้ 2 ชุดต่องวด)', () => {
    expect(stats.front3[0].counts[0]).toBe(2)
    expect(stats.front3[0].counts[1]).toBe(2)
    expect(stats.first6[0].counts[0]).toBe(1)
  })
  it('งวดใหม่หนักกว่างวดเก่า', () => {
    expect(stats.last2[1].weighted[5]).toBe(1)
    expect(stats.last2[1].weighted[7]).toBe(0.5)
    expect(stats.last2[1].hot[0]).toBe(5)
  })
  it('Laplace: ไม่มีเลขไหนคะแนนเป็น 0', () => {
    expect(Math.min(...stats.first6[3].scores)).toBeGreaterThan(0)
    expect(Math.max(...stats.first6[3].scores)).toBe(1)
  })
  it('เลขเย็น = หายนานสุด', () => {
    expect(stats.last2[1].cold.absentDraws).toBe(2)
  })
})

describe('generate', () => {
  it('ค่าเดิมได้เลขเดิมเสมอ', () => {
    const a = generate(baseInput)
    const b = generate({ ...baseInput, draws: [...realDraws] })
    expect(b.sets).toEqual(a.sets)
    const withBirth = { ...baseInput, birth: { date: '1985-03-12', wednesdayNight: false } }
    expect(generate(withBirth).sets).toEqual(generate(withBirth).sets)
  })

  it('จำนวนชุด/หลักถูกต้อง และเก็บเลขศูนย์นำหน้า', () => {
    const zeros: DrawResult[] = Array.from({ length: 24 }, (_, i) => ({
      drawDate: `2025-${String((i % 12) + 1).padStart(2, '0')}-${i < 12 ? '01' : '16'}`,
      firstPrize: '000000',
      front3: ['000', '001'],
      last3: ['000', '002'],
      last2: '00',
      source: 'https://x.y/',
    }))
    const r = generate({ ...baseInput, draws: zeros, weights: { ...zeroWeights, statistics: 100 } })
    for (const prize of PRIZE_TYPES) {
      expect(r.sets[prize]).toHaveLength(SET_COUNT[prize])
      for (const s of r.sets[prize]) expect(s.digits).toMatch(new RegExp(`^\\d{${SLOT_COUNT[prize]}}$`))
    }
    expect(r.sets.first6[0].digits).toBe('000000')
    expect(r.sets.last2[0].digits).toBe('00')
  })

  it('ชุดที่ 2 ไม่ซ้ำชุดที่ 1 (หลายวันเกิด หลาย nonce)', () => {
    const births = [null, { date: '1990-01-01', wednesdayNight: false }, { date: '1978-06-14', wednesdayNight: true }]
    for (const birth of births)
      for (let nonce = 0; nonce < 15; nonce++) {
        const r = generate({ ...baseInput, birth, nonce })
        expect(r.sets.front3[0].digits).not.toBe(r.sets.front3[1].digits)
        expect(r.sets.last3[0].digits).not.toBe(r.sets.last3[1].digits)
      }
  })

  it('ชุดที่ 2 ยังไม่ซ้ำแม้คะแนนกระจุกตัวมาก (fallback หลัง 50 ครั้ง)', () => {
    const r = generate({ ...baseInput, weights: { ...zeroWeights, dayPlanet: 100 } })
    expect(r.sets.front3[0].digits).toBe('222') // 16 พ.ย. 2569 = วันจันทร์ = 2
    expect(r.sets.front3[1].digits).not.toBe('222')
  })

  it('กด "สุ่มชุดใหม่" (nonce) แล้วได้ผลต่างจากชุดมาตรฐาน', () => {
    const a = generate(baseInput).sets
    const b = generate({ ...baseInput, nonce: 1 }).sets
    expect(JSON.stringify(b)).not.toBe(JSON.stringify(a))
  })

  it('ไม่กรอกวันเกิด → น้ำหนักวันเกิด 0 และที่เหลือรวม 100', () => {
    const p = normalizeWeights(defaults.weights, false)
    expect(p.personal).toBe(0)
    expect(Object.values(p).reduce((s, v) => s + v, 0)).toBeCloseTo(100)
    expect(p.statistics / p.dayPlanet).toBeCloseTo(defaults.weights.statistics / defaults.weights.dayPlanet)
  })

  it('เลื่อนแถบน้ำหนักขึ้น → ส่วนแบ่งของแหล่งนั้นเพิ่มขึ้นตาม (monotonic)', () => {
    let prevPct = -1
    for (const w of [0, 5, 15, 40, 80, 100]) {
      const pct = generate({ ...baseInput, weights: { ...defaults.weights, dayPlanet: w } }).percents.dayPlanet
      expect(pct).toBeGreaterThan(prevPct)
      prevPct = pct
    }
    const high = generate({ ...baseInput, weights: { ...defaults.weights, dayPlanet: 1000 } })
    expect(high.sets.first6[0].digits).toBe('222222')
  })

  it('ตัดเลขกาลกิณี: คำอธิบายแสดงคะแนนที่ถูกหัก', () => {
    // เกิดวันอาทิตย์ → กาลกิณี = 6 · ผลทุกงวดเป็น 6 ล้วน
    const sixes: DrawResult[] = realDraws.map((d) => ({ ...d, firstPrize: '666666' }))
    const input = {
      ...baseInput,
      draws: sixes,
      weights: { ...zeroWeights, statistics: 100 },
      birth: { date: '2026-11-15', wednesdayNight: false },
    }
    const cut = generate(input).sets.first6[0].explanations[0]
    expect(cut.digit).toBe(6)
    const penalty = cut.parts.find((p) => p.signal === 'kalakini')!
    expect(penalty.value).toBeLessThan(0)
    expect(cut.total).toBeCloseTo(100 * defaults.kalakiniPenalty, 0)
    const noCut = generate({ ...input, cutKalakini: false }).sets.first6[0].explanations[0]
    expect(noCut.parts.some((p) => p.signal === 'kalakini')).toBe(false)
  })

  it('แจ้งเมื่อวันออกรางวัลเป็นวันกาลกิณีของผู้ใช้', () => {
    // เกิดวันอังคาร → กาลกิณี = 2 = วันจันทร์ (16 พ.ย. 2569)
    const r = generate({ ...baseInput, birth: { date: '2026-11-17', wednesdayNight: false } })
    expect(r.context.drawDayIsKalakini).toBe(true)
  })

  it('คำอธิบายแต่ละหลักรวมคะแนนได้เท่ากับ total', () => {
    const r = generate({ ...baseInput, birth: { date: '1985-03-12', wednesdayNight: false } })
    for (const prize of PRIZE_TYPES)
      for (const set of r.sets[prize])
        for (const e of set.explanations) {
          expect(String(e.digit)).toBe(set.digits[e.position])
          expect(e.parts.reduce((s, p) => s + p.value, 0)).toBeCloseTo(e.total, 0)
        }
  })

  it('snapshot ผลลัพธ์งวด 16 พ.ย. 2569 (ข้อมูลจำลองคงที่ — ไม่ผูกกับ draws.json ที่อัปเดตทุกงวด)', () => {
    const rand = mulberry32(2569)
    const num = (n: number) => Array.from({ length: n }, () => Math.floor(rand() * 10)).join('')
    const fixture: DrawResult[] = Array.from({ length: 24 }, (_, i) => ({
      drawDate: `20${String(25 - Math.floor(i / 24)).padStart(2, '0')}-${String(12 - Math.floor(i / 2)).padStart(2, '0')}-${i % 2 ? '01' : '16'}`,
      firstPrize: num(6),
      front3: [num(3), num(3)],
      last3: [num(3), num(3)],
      last2: num(2),
      source: 'https://x.y/',
    }))
    const r = generate({ ...baseInput, draws: fixture, birth: { date: '1985-03-12', wednesdayNight: false } })
    expect(Object.fromEntries(PRIZE_TYPES.map((p) => [p, r.sets[p].map((s) => s.digits)]))).toMatchSnapshot()
  })
})
