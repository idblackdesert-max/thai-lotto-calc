import { describe, expect, it } from 'vitest'
import type { DrawResult } from './draws'
import { checkTicket, type Ticket } from './tickets'

const set = (digits: string) => ({ digits, explanations: [] })
const ticket: Ticket = {
  drawDate: '2026-11-16',
  lockedAt: '2026-11-04T10:00:00Z',
  personal: null,
  sets: { first6: [set('437274')], front3: [set('402'), set('022')], last3: [set('034'), set('492')], last2: [set('47')] },
}
const draw = (over: Partial<DrawResult>): DrawResult => ({
  drawDate: '2026-11-16',
  firstPrize: '000000',
  front3: ['111', '222'],
  last3: ['333', '444'],
  last2: '55',
  source: 'https://x.y/',
  ...over,
})

describe('checkTicket', () => {
  it('ไม่ถูกเลย', () => {
    expect(checkTicket(ticket, draw({})).some((c) => c.won)).toBe(false)
  })
  it('รางวัลที่ 1 ต้องตรงทั้ง 6 หลัก · ไฮไลต์หลักที่ตรง', () => {
    const near = checkTicket(ticket, draw({ firstPrize: '437270' }))[0]
    expect(near.won).toBe(false)
    expect(near.matchedPositions[0]).toEqual([0, 1, 2, 3, 4])
    expect(checkTicket(ticket, draw({ firstPrize: '437274' }))[0].won).toBe(true)
  })
  it('เลข 3 ตัว: ชุดที่ 2 ของเราตรงกับผลชุดที่ 1 ก็ถือว่าถูก', () => {
    const r = checkTicket(ticket, draw({ last3: ['492', '999'] }))
    expect(r.find((c) => c.prize === 'last3')!.won).toBe(true)
    expect(r.find((c) => c.prize === 'front3')!.won).toBe(false)
  })
  it('เลขท้าย 2 ตัว', () => {
    expect(checkTicket(ticket, draw({ last2: '47' })).find((c) => c.prize === 'last2')!.won).toBe(true)
  })
})
