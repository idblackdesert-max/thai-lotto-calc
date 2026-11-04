// ดึงผลสลากล่าสุดลง public/data/draws.json — รันใน GitHub Actions (หรือ npm run fetch-data)
// กฎ: ผลย้อนหลังไม่เปลี่ยน ดึงเฉพาะงวดที่ยังไม่มี · ข้อมูลไม่ผ่าน schema = ทิ้ง ไม่เดา
//      แหล่งข้อมูลล่ม = เก็บไฟล์เดิมไว้ + เตือน แต่ไม่ทำให้ build ล้ม
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { defaults } from '../src/lib/config.ts'
import { drawResultSchema, drawsFileSchema, normalizeDraws, type DrawResult, type DrawsFile } from '../src/lib/draws.ts'
import { toBangkok } from '../src/lib/thaiDate.ts'
import { gloSource } from './sources/glo.ts'
import type { DrawSource } from './sources/types.ts'

const OUT = 'public/data/draws.json'
const MIN_INTERVAL_MS = 500 // ไม่เกิน ~2 คำขอ/วินาที
const MAX_YEARS_BACK = 4

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
let lastRequest = 0

async function throttled<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= 3; attempt++) {
    const wait = lastRequest + MIN_INTERVAL_MS - Date.now()
    if (wait > 0) await sleep(wait)
    lastRequest = Date.now()
    try {
      return await fn()
    } catch (err) {
      lastError = err
      if (attempt < 3) await sleep(1000 * 2 ** attempt)
    }
  }
  throw lastError
}

function readExisting(): DrawsFile | null {
  if (!existsSync(OUT)) return null
  const parsed = drawsFileSchema.safeParse(JSON.parse(readFileSync(OUT, 'utf8')))
  if (!parsed.success) {
    console.warn(`::warning::${OUT} เดิมไม่ผ่าน schema — จะสร้างใหม่ทั้งไฟล์`)
    return null
  }
  return parsed.data
}

export async function updateDraws(source: DrawSource, existing: DrawResult[], now: Date) {
  const have = new Set(existing.map((d) => d.drawDate))
  const today = toBangkok(now).date
  const year = Number(today.slice(0, 4))

  // รวบรวมวันออกรางวัลที่ประกาศแล้ว ย้อนหลังจนพอ drawsStored
  const dates: string[] = []
  for (let y = year; y > year - MAX_YEARS_BACK && dates.length < defaults.drawsStored; y--) {
    const list = await throttled(() => source.listDrawDates(y))
    dates.push(...list.filter((d) => d <= today))
  }
  const wanted = dates.sort().reverse().slice(0, defaults.drawsStored)
  const missing = wanted.filter((d) => !have.has(d))

  const fetched: DrawResult[] = []
  const rejected: string[] = []
  for (const date of missing) {
    try {
      const raw = await throttled(() => source.getDraw(date))
      const parsed = drawResultSchema.safeParse(raw)
      if (parsed.success) fetched.push(parsed.data)
      else {
        rejected.push(date)
        console.warn(`::warning::งวด ${date} ข้อมูลไม่ถูกต้อง — ข้าม: ${parsed.error.issues.map((i) => i.message).join('; ')}`)
      }
    } catch (err) {
      rejected.push(date)
      console.warn(`::warning::ดึงงวด ${date} ไม่สำเร็จ: ${(err as Error).message}`)
    }
  }
  const draws = normalizeDraws([...fetched, ...existing]).slice(0, defaults.drawsStored)
  return { draws, added: fetched.map((d) => d.drawDate), rejected }
}

async function main() {
  const existing = readExisting()
  try {
    const { draws, added, rejected } = await updateDraws(gloSource, existing?.draws ?? [], new Date())
    if (added.length === 0 && existing) {
      console.log(`ไม่มีงวดใหม่ (ล่าสุด ${existing.newestDrawDate}) — ไม่แก้ไฟล์`)
      return
    }
    const file: DrawsFile = {
      generatedAt: new Date().toISOString(),
      source: gloSource.name,
      newestDrawDate: draws[0]?.drawDate ?? null,
      draws,
    }
    mkdirSync(dirname(OUT), { recursive: true })
    writeFileSync(OUT, JSON.stringify(file, null, 2) + '\n')
    console.log(`บันทึก ${draws.length} งวด (เพิ่ม ${added.length}: ${added.join(', ')}) ล่าสุด ${file.newestDrawDate}`)
    if (rejected.length) console.warn(`::warning::ข้าม ${rejected.length} งวด: ${rejected.join(', ')}`)
    if (draws.length < defaults.drawsUsed) console.warn(`::warning::มีเพียง ${draws.length} งวด (ต้องการ ${defaults.drawsUsed})`)
  } catch (err) {
    console.warn(`::warning::แหล่งข้อมูล ${gloSource.name} ใช้ไม่ได้ (${(err as Error).message}) — คงไฟล์เดิมไว้`)
  }
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/fetch-draws.ts')) await main()
