// "ตั๋ว" = เลขที่ล็อกไว้ของแต่ละงวด เก็บใน localStorage ของเครื่องผู้ใช้เท่านั้น
// ไม่เก็บวันเดือนปีเกิด — เก็บแค่เลขที่ได้และดาว/ทักษาที่ใช้แสดงผล
import { z } from 'zod'
import type { DrawResult } from './draws'
import type { GenerateResult } from './engine/generate'
import { PRIZE_TYPES, type PrizeType } from './engine/types'
import { load, save } from './storage'

const KEY = 'tickets'
const MAX_TICKETS = 48

export type Ticket = {
  drawDate: string
  lockedAt: string
  personal: GenerateResult['context']['personal']
  sets: GenerateResult['sets']
}

// ตรวจรูปแบบคร่าว ๆ — ข้อมูลเสียในเครื่องให้ทิ้งไป ไม่ให้หน้าเว็บพัง
const ticketSchema = z.object({
  drawDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  lockedAt: z.string(),
  personal: z.any(),
  sets: z.object(Object.fromEntries(PRIZE_TYPES.map((p) => [p, z.array(z.object({ digits: z.string(), explanations: z.array(z.any()) }))]))),
})

export function loadTickets(): Record<string, Ticket> {
  const raw = load<unknown>(KEY, {})
  if (typeof raw !== 'object' || raw === null) return {}
  const out: Record<string, Ticket> = {}
  for (const [date, t] of Object.entries(raw)) {
    const parsed = ticketSchema.safeParse(t)
    if (parsed.success && parsed.data.drawDate === date) out[date] = parsed.data as Ticket
  }
  return out
}

/** บันทึกตั๋วใหม่ — ถ้างวดนั้นล็อกไว้แล้วจะไม่ทับ */
export function addTicket(tickets: Record<string, Ticket>, ticket: Ticket): Record<string, Ticket> {
  if (tickets[ticket.drawDate]) return tickets
  const next = { ...tickets, [ticket.drawDate]: ticket }
  const keep = Object.keys(next).sort().reverse().slice(0, MAX_TICKETS)
  const trimmed = Object.fromEntries(keep.map((d) => [d, next[d]]))
  save(KEY, trimmed)
  return trimmed
}

export function clearTickets(): void {
  save(KEY, null)
}

export type PrizeCheck = { prize: PrizeType; mine: string[]; actual: string[]; won: boolean; matchedPositions: number[][] }

/** เทียบเลขในตั๋วกับผลจริง: รางวัลที่ 1 ตรงทั้ง 6 หลัก · เลข 3 ตัว ชุดใดชุดหนึ่งตรงกับผลชุดใดชุดหนึ่ง · 2 ตัวตรงกัน */
export function checkTicket(ticket: Ticket, draw: DrawResult): PrizeCheck[] {
  const actualOf: Record<PrizeType, string[]> = {
    first6: [draw.firstPrize],
    front3: draw.front3,
    last3: draw.last3,
    last2: [draw.last2],
  }
  return PRIZE_TYPES.map((prize) => {
    const mine = ticket.sets[prize].map((s) => s.digits)
    const actual = actualOf[prize]
    return {
      prize,
      mine,
      actual,
      won: mine.some((m) => actual.includes(m)),
      // ตำแหน่งที่เลขตรงกับผลจริง (เทียบทุกชุดของผลจริง) — ใช้ไฮไลต์
      matchedPositions: mine.map((m) => [...m].flatMap((d, i) => (actual.some((a) => a[i] === d) ? [i] : []))),
    }
  })
}
