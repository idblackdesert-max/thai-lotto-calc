import type { DrawResult } from '../../src/lib/draws.ts'

/** แหล่งข้อมูลผลสลาก — สลับแหล่งได้โดยเขียนตัวใหม่ตาม interface นี้ */
export interface DrawSource {
  name: string
  /** วันออกรางวัลที่ประกาศผลแล้วของปี (ค.ศ.) เรียงใหม่สุดก่อน รูปแบบ YYYY-MM-DD */
  listDrawDates(year: number): Promise<string[]>
  getDraw(drawDate: string): Promise<DrawResult>
}
