import { describe, expect, it } from 'vitest'
import drawsJson from '../../public/data/draws.json'
import { defaults } from './config'
import { drawsFileSchema } from './draws'

describe('public/data/draws.json', () => {
  const file = drawsFileSchema.parse(drawsJson)

  it(`มีอย่างน้อย ${defaults.drawsUsed} งวดที่ถูกต้อง`, () => {
    expect(file.draws.length).toBeGreaterThanOrEqual(defaults.drawsUsed)
  })
  it('เรียงใหม่สุดก่อน ไม่มีงวดซ้ำ และ newestDrawDate ตรงกับงวดแรก', () => {
    const dates = file.draws.map((d) => d.drawDate)
    expect(new Set(dates).size).toBe(dates.length)
    expect([...dates].sort().reverse()).toEqual(dates)
    expect(file.newestDrawDate).toBe(dates[0])
  })
})
