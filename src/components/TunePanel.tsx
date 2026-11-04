import { signalKeys, type SignalKey, type Weights } from '../lib/config'
import { SIGNAL_LABELS } from '../lib/engine/types'
import { SIGNAL_COLORS } from '../lib/signalColors'

type Props = {
  weights: Weights
  percents: Weights
  hasBirth: boolean
  onChange: (key: SignalKey, value: number) => void
  onReset: () => void
}

export function TunePanel({ weights, percents, hasBirth, onChange, onReset }: Props) {
  return (
    <details className="card area-tune">
      <summary>ปรับสูตร</summary>
      {signalKeys.map((key) => {
        const disabled = key === 'personal' && !hasBirth
        return (
          <label key={key} className="slider">
            <span>
              <span className="swatch" style={{ background: SIGNAL_COLORS[key] }} aria-hidden="true" />
              {SIGNAL_LABELS[key]}
              {disabled && <span className="muted small"> (ยังไม่ได้กรอกวันเกิด)</span>}
            </span>
            <span className="num">{Math.round(percents[key])}%</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={weights[key]}
              disabled={disabled}
              onChange={(e) => onChange(key, Number(e.target.value))}
              aria-valuetext={`${Math.round(percents[key])} เปอร์เซ็นต์`}
            />
          </label>
        )
      })}
      <button type="button" className="btn btn-small" onClick={onReset}>
        ค่าเริ่มต้น
      </button>
      <p className="muted small" style={{ margin: '8px 0 0' }}>ระบบปรับรวมให้เป็น 100% อัตโนมัติ ผลลัพธ์เปลี่ยนทันที</p>
    </details>
  )
}
