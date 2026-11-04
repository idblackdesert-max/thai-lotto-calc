import { useState } from 'react'
import type { PrizeSet } from '../lib/engine/generate'
import { PRIZE_LABELS, type PrizeType } from '../lib/engine/types'

export type Selection = { prize: PrizeType; set: number; position: number }

type CardProps = {
  prize: PrizeType
  sets: PrizeSet[]
  selected: Selection
  onSelect: (s: Selection) => void
  onReroll: () => void
  className: string
}

export function PrizeCard({ prize, sets, selected, onSelect, onReroll, className }: CardProps) {
  const [copied, setCopied] = useState(false)
  const label = PRIZE_LABELS[prize]

  async function copy() {
    try {
      await navigator.clipboard.writeText(`${label}: ${sets.map((s) => s.digits).join(', ')}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* เบราว์เซอร์ไม่อนุญาต — ไม่ต้องทำอะไร */
    }
  }

  return (
    <section className={`card ${className}`} aria-label={label}>
      <div className="card-head">
        <h2>{label}</h2>
        <div className="btn-row">
          <button type="button" className="btn btn-small" onClick={copy} aria-label={`คัดลอก${label}`}>
            {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
          </button>
          <button type="button" className="btn btn-small" onClick={onReroll} aria-label={`สุ่มชุดใหม่ ${label}`}>
            สุ่มชุดใหม่
          </button>
        </div>
      </div>
      <div className="set-list">
        {sets.map((set, si) => (
          <div key={si}>
            {sets.length > 1 && <div className="set-label">ชุดที่ {si + 1}</div>}
            <div className="digits">
              {set.digits.split('').map((d, pos) => {
                const active = selected.prize === prize && selected.set === si && selected.position === pos
                return (
                  <button
                    key={pos}
                    type="button"
                    className="digit"
                    aria-pressed={active}
                    aria-label={`${label}${sets.length > 1 ? ` ชุดที่ ${si + 1}` : ''} หลักที่ ${pos + 1} เลข ${d} — ดูเหตุผล`}
                    onClick={() => onSelect({ prize, set: si, position: pos })}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
