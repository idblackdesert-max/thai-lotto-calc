import type { DigitExplanation } from '../lib/engine/generate'
import { PRIZE_LABELS } from '../lib/engine/types'
import { SIGNAL_COLORS } from '../lib/signalColors'

type Props = { explanation: DigitExplanation; setIndex: number; setCount: number; open: boolean; onToggle: (open: boolean) => void }

export function WhyPanel({ explanation: e, setIndex, setCount, open, onToggle }: Props) {
  const positive = e.parts.filter((p) => p.value > 0)
  const gross = positive.reduce((s, p) => s + p.value, 0)
  const top = [...positive].sort((a, b) => b.value - a.value)[0]
  const where = `${PRIZE_LABELS[e.prize]}${setCount > 1 ? ` ชุดที่ ${setIndex + 1}` : ''} หลักที่ ${e.position + 1}`

  return (
    <details id="why" className="card area-why" open={open} onToggle={(ev) => onToggle((ev.target as HTMLDetailsElement).open)}>
      <summary>ทำไมได้เลขนี้</summary>
      <p style={{ margin: 0 }}>
        <strong className="num" style={{ fontSize: '1.5rem', color: 'var(--accent)' }}>{e.digit}</strong>{' '}
        — {where} ได้ <span className="num">{e.total}</span> คะแนน
        {top && <> ส่วนใหญ่มาจาก<strong>{top.label}</strong>{top.reason ? ` (${top.reason})` : ''}</>}
      </p>
      <div className="stack" role="img" aria-label={positive.map((p) => `${p.label} ${p.value} คะแนน`).join(', ')}>
        {positive.map((p) => (
          <span key={p.signal} style={{ width: `${(p.value / gross) * 100}%`, background: SIGNAL_COLORS[p.signal] }} title={`${p.label} ${p.value}`} />
        ))}
      </div>
      <ul className="legend">
        {e.parts.map((p) => (
          <li key={p.signal}>
            <i style={{ background: SIGNAL_COLORS[p.signal] }} aria-hidden="true" />
            <span>
              {p.label}
              {p.reason && <span className="muted small"> · {p.reason}</span>}
            </span>
            <span className="num">{p.value > 0 ? `+${p.value}` : p.value}</span>
          </li>
        ))}
      </ul>
      <p className="muted small" style={{ margin: '8px 0 0' }}>แตะตัวเลขใดก็ได้ด้านบนเพื่อดูที่มาของเลขนั้น</p>
    </details>
  )
}
