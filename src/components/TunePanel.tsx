import { signalKeys, type Weights } from '../lib/config'
import { SIGNAL_LABELS } from '../lib/engine/types'
import { SIGNAL_COLORS } from '../lib/signalColors'

/** แสดงสูตรที่ใช้ (แก้ไม่ได้ — เลขต้องขึ้นกับงวดและวันเกิดเท่านั้น จึงได้เลขเดิมทุกเครื่อง) */
export function TunePanel({ percents, hasBirth }: { percents: Weights; hasBirth: boolean }) {
  return (
    <details className="card area-tune">
      <summary>สูตรที่ใช้</summary>
      {signalKeys.map((key) => (
        <div key={key} className="slider">
          <span>
            <span className="swatch" style={{ background: SIGNAL_COLORS[key] }} aria-hidden="true" />
            {SIGNAL_LABELS[key]}
            {key === 'personal' && !hasBirth && <span className="muted small"> (ไม่ได้กรอกวันเกิด)</span>}
          </span>
          <span className="num">{Math.round(percents[key])}%</span>
          <div className="bar" aria-hidden="true">
            <span style={{ width: `${percents[key]}%`, background: SIGNAL_COLORS[key] }} />
          </div>
        </div>
      ))}
      <p className="muted small" style={{ margin: '8px 0 0' }}>
        สูตรเหมือนกันทุกคน เลขจึงขึ้นกับงวดและวันเกิดเท่านั้น — วันเกิดเดียวกันได้เลขเดียวกันทุกเครื่อง และหักคะแนนเลขกาลกิณีเสมอ
      </p>
    </details>
  )
}
