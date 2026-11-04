import { describe, expect, it, vi } from 'vitest'
import type { DrawResult } from '../src/lib/draws.ts'
import { updateDraws } from './fetch-draws.ts'
import type { DrawSource } from './sources/types.ts'

vi.setConfig({ testTimeout: 30_000 })

const draw = (drawDate: string, overrides: Partial<DrawResult> = {}): DrawResult => ({
  drawDate,
  firstPrize: '123456',
  front3: ['012', '345'],
  last3: ['678', '901'],
  last2: '05',
  source: 'https://www.glo.or.th/',
  ...overrides,
})

function fakeSource(datesByYear: Record<number, string[]>, bad: string[] = []): DrawSource & { calls: string[] } {
  const calls: string[] = []
  return {
    name: 'fake',
    calls,
    async listDrawDates(year) {
      return datesByYear[year] ?? []
    },
    async getDraw(date) {
      calls.push(date)
      return bad.includes(date) ? draw(date, { firstPrize: '12A45' }) : draw(date)
    },
  }
}

const now = new Date('2026-11-04T12:00:00+07:00')

describe('updateDraws', () => {
  it('ดึงเฉพาะงวดที่ยังไม่มี แล้วเรียงใหม่สุดก่อน', async () => {
    const src = fakeSource({ 2026: ['2026-11-01', '2026-10-16', '2026-10-01'] })
    const { draws, added } = await updateDraws(src, [draw('2026-10-16'), draw('2026-10-01')], now)
    expect(src.calls).toEqual(['2026-11-01'])
    expect(added).toEqual(['2026-11-01'])
    expect(draws.map((d) => d.drawDate)).toEqual(['2026-11-01', '2026-10-16', '2026-10-01'])
  })

  it('ข้อมูลไม่ผ่าน schema ถูกทิ้ง ไม่ถูกเดา', async () => {
    const src = fakeSource({ 2026: ['2026-11-01', '2026-10-16'] }, ['2026-11-01'])
    const { draws, rejected } = await updateDraws(src, [], now)
    expect(rejected).toEqual(['2026-11-01'])
    expect(draws.map((d) => d.drawDate)).toEqual(['2026-10-16'])
  })

  it('ไม่นับงวดในอนาคต และไม่มีรายการซ้ำ', async () => {
    const src = fakeSource({ 2026: ['2026-11-16', '2026-11-01', '2026-11-01'] })
    const { draws } = await updateDraws(src, [], now)
    expect(draws.map((d) => d.drawDate)).toEqual(['2026-11-01'])
  })

  it('แหล่งข้อมูลล่ม → โยน error ให้ main คงไฟล์เดิม', async () => {
    const src: DrawSource = {
      name: 'down',
      listDrawDates: async () => {
        throw new Error('network')
      },
      getDraw: async () => draw('2026-11-01'),
    }
    await expect(updateDraws(src, [], now)).rejects.toThrow('network')
  })
})
