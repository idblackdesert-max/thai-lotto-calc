/** FNV-1a 32-bit — แปลงข้อความเป็น seed ตัวเลข */
export function hashString(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

/** mulberry32 — ตัวสุ่มที่ใส่ seed เดิมได้ผลเดิมเสมอ คืนค่า [0, 1) */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** สุ่มเลข 0–9 ตามน้ำหนัก (น้ำหนักรวม 0 = สุ่มเท่ากัน) */
export function weightedPick(weights: number[], rand: () => number): number {
  const total = weights.reduce((s, w) => s + Math.max(0, w), 0)
  if (total <= 0) return Math.floor(rand() * weights.length)
  let r = rand() * total
  for (let i = 0; i < weights.length; i++) {
    r -= Math.max(0, weights[i])
    if (r < 0) return i
  }
  return weights.length - 1
}
