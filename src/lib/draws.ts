import { z } from 'zod'

const digits = (n: number) => z.string().regex(new RegExp(`^\\d{${n}}$`), `ต้องเป็นตัวเลข ${n} หลัก`)

export const drawResultSchema = z.object({
  drawDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  firstPrize: digits(6),
  front3: z.tuple([digits(3), digits(3)]),
  last3: z.tuple([digits(3), digits(3)]),
  last2: digits(2),
  source: z.string().url(),
})

export const drawsFileSchema = z.object({
  generatedAt: z.string(),
  source: z.string(),
  newestDrawDate: z.string().nullable(),
  draws: z.array(drawResultSchema),
})

export type DrawResult = z.infer<typeof drawResultSchema>
export type DrawsFile = z.infer<typeof drawsFileSchema>

/** ตัดตัวซ้ำตาม drawDate (ตัวแรกชนะ) แล้วเรียงงวดใหม่สุดก่อน */
export function normalizeDraws(draws: DrawResult[]): DrawResult[] {
  const byDate = new Map<string, DrawResult>()
  for (const d of draws) if (!byDate.has(d.drawDate)) byDate.set(d.drawDate, d)
  return [...byDate.values()].sort((a, b) => (a.drawDate < b.drawDate ? 1 : -1))
}
