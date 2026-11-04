// แหล่งข้อมูล: API ทางการของสำนักงานสลากกินแบ่งรัฐบาล (www.glo.or.th)
// หมายเหตุ: เดิมสเปกใช้ lotto.api.rayriffy.com แต่ repo ถูก archive และโดเมนปิดแล้ว (ตรวจ 2026-11-04)
import type { DrawResult } from '../../src/lib/draws.ts'
import type { DrawSource } from './types.ts'

const BASE = 'https://www.glo.or.th/api'

type GloNumber = { round: number; value: string }
type GloPrize = { number: GloNumber[] }

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'thai-lotto-calc (github.com/idblackdesert-max/thai-lotto-calc)' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`GLO ${path} HTTP ${res.status}`)
  return (await res.json()) as T
}

/** เรียงตาม round แล้วคืนค่าเลข — ไม่เดา ถ้าไม่มีก็คืน [] ให้ zod ตีตก */
const values = (prize: GloPrize | undefined) =>
  [...(prize?.number ?? [])].sort((a, b) => a.round - b.round).map((n) => n.value)

export const gloSource: DrawSource = {
  name: 'glo.or.th',

  async listDrawDates(year: number): Promise<string[]> {
    const json = await post<{ response: { result: { date: string }[] } | null }>('/lottery/getPeriodsByYear', {
      year: String(year),
      type: 'CHECKED',
    })
    return [...new Set((json.response?.result ?? []).map((r) => r.date))].sort().reverse()
  },

  async getDraw(drawDate: string): Promise<DrawResult> {
    const [year, month, day] = drawDate.split('-')
    const json = await post<{
      response: { result: { date: string; pdf_url?: string; data: Record<string, GloPrize> } } | null
    }>(
      '/checking/getLotteryResult',
      { date: day, month, year },
    )
    const result = json.response?.result
    if (!result) throw new Error(`GLO ไม่มีผลงวด ${drawDate}`)
    const data = result.data
    return {
      drawDate: result.date,
      firstPrize: values(data.first)[0],
      front3: values(data.last3f) as [string, string],
      last3: values(data.last3b) as [string, string],
      last2: values(data.last2)[0],
      // ใบตรวจผลฉบับทางการ (PDF) ของงวดนั้น
      source: result.pdf_url ?? 'https://www.glo.or.th/',
    }
  },
}
