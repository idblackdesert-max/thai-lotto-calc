// localStorage อาจใช้ไม่ได้ (โหมดส่วนตัว/ถูกบล็อก) — ห่อ try/catch ทุกครั้ง ใช้ไม่ได้ก็ทำงานต่อได้ปกติ

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function save(key: string, value: unknown): void {
  try {
    if (value === null || value === undefined) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ไม่ต้องทำอะไร */
  }
}
