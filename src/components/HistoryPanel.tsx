import type { DrawResult } from '../lib/draws'
import { PRIZE_LABELS, PRIZE_TYPES } from '../lib/engine/types'
import { checkTicket, type Ticket } from '../lib/tickets'
import { formatThaiShort } from '../lib/thaiDate'

/** ไฮไลต์หลักที่ตรงกับผลจริง */
function Digits({ value, hits }: { value: string; hits: number[] }) {
  return (
    <span>
      {[...value].map((d, i) => (
        <span key={i} className={hits.includes(i) ? 'hit' : undefined}>{d}</span>
      ))}
    </span>
  )
}

type Props = { tickets: Ticket[]; draws: DrawResult[]; onClear: () => void }

export function HistoryPanel({ tickets, draws, onClear }: Props) {
  const byDate = new Map(draws.map((d) => [d.drawDate, d]))
  return (
    <details className="card">
      <summary>ประวัติเลขของฉัน ({tickets.length} งวด)</summary>
      {tickets.length === 0 && <p className="muted small">ยังไม่มีงวดที่ผ่านมา — เลขที่ล็อกไว้จะมาแสดงที่นี่หลังออกรางวัล</p>}
      {tickets.map((t) => {
        const draw = byDate.get(t.drawDate)
        const checks = draw ? checkTicket(t, draw) : null
        return (
          <div key={t.drawDate} className="history-item">
            <strong>งวด {formatThaiShort(t.drawDate)}</strong>
            {!draw && <span className="muted small"> · ยังไม่มีผลรางวัล</span>}
            <div className="history-row" style={{ marginTop: 4 }}>
              {PRIZE_TYPES.map((prize) => {
                  const c = checks?.find((x) => x.prize === prize)
                  return (
                    <div key={prize} style={{ display: 'contents' }}>
                      <span className="muted">{PRIZE_LABELS[prize]}</span>
                      <span>
                        {t.sets[prize].map((s, i) => (
                          <span key={i}>
                            {i > 0 && ' · '}
                            <Digits value={s.digits} hits={c?.matchedPositions[i] ?? []} />
                          </span>
                        ))}
                        {c?.won && <span className="badge">ถูก!</span>}
                        {c && <span className="muted small"> (ออก {c.actual.join(' · ')})</span>}
                      </span>
                    </div>
                  )
                })}
            </div>
          </div>
        )
      })}
      <p className="muted small" style={{ margin: '8px 0' }}>
        ประวัติเก็บในเครื่องนี้เท่านั้น ไม่มีวันเกิดอยู่ในประวัติ · ตัวที่ไฮไลต์ = หลักที่ตรงกับผลจริง
      </p>
      <button
        type="button"
        className="btn btn-small"
        onClick={() => {
          if (window.confirm('ลบเลขที่ล็อกไว้และประวัติทั้งหมดในเครื่องนี้?')) onClear()
        }}
      >
        ลบประวัติทั้งหมด
      </button>
    </details>
  )
}
