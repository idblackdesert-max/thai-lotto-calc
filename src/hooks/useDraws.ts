import { useEffect, useState } from 'react'
import { drawsFileSchema, type DrawsFile } from '../lib/draws'

type State = { status: 'loading' } | { status: 'ready'; data: DrawsFile } | { status: 'error'; message: string }

/** อ่าน data/draws.json (ไฟล์ static ที่ GitHub Actions อัปเดตให้) */
export function useDraws(): State {
  const [state, setState] = useState<State>({ status: 'loading' })
  useEffect(() => {
    let alive = true
    fetch(`${import.meta.env.BASE_URL}data/draws.json`, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json) => alive && setState({ status: 'ready', data: drawsFileSchema.parse(json) }))
      .catch((err: Error) => alive && setState({ status: 'error', message: err.message }))
    return () => {
      alive = false
    }
  }, [])
  return state
}
