import type { DrawResult } from '../lib/draws'
import type { Statistics } from '../lib/engine/statistics'
import { PRIZE_LABELS, PRIZE_TYPES, type PrizeType } from '../lib/engine/types'
import { formatThaiShort } from '../lib/thaiDate'

function Heatmap({ prize, stats }: { prize: PrizeType; stats: Statistics }) {
  const slots = stats[prize]
  const max = Math.max(1, ...slots.flatMap((s) => s.counts))
  return (
    <div>
      <h3 className="small" style={{ margin: '0 0 4px' }}>{PRIZE_LABELS[prize]}</h3>
      <table className="heat">
        <caption className="sr-only">จำนวนครั้งที่เลข 0–9 ออกในแต่ละหลักของ{PRIZE_LABELS[prize]}</caption>
        <thead>
          <tr>
            <th scope="col">หลัก</th>
            {[...Array(10).keys()].map((d) => (
              <th key={d} scope="col">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {slots.map((slot, pos) => (
            <tr key={pos}>
              <th scope="row">{pos + 1}</th>
              {slot.counts.map((c, d) => (
                <td key={d} style={{ background: `rgba(var(--heat), ${(c / max) * 0.85})`, color: c / max > 0.55 ? '#fff' : undefined }}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="small muted" style={{ margin: '4px 0 0', paddingLeft: 18 }}>
        {slots.map((slot, pos) => (
          <li key={pos}>
            หลัก {pos + 1}: ร้อน <span className="num">{slot.hot.join(', ')}</span> · เย็น{' '}
            <span className="num">{slot.cold.digit}</span> (ไม่ออก {slot.cold.absentDraws} งวด)
          </li>
        ))}
      </ul>
    </div>
  )
}

export function StatsPanel({ stats, draws }: { stats: Statistics; draws: DrawResult[] }) {
  return (
    <details className="card">
      <summary>สถิติ {draws.length} งวด</summary>
      <div className="stats-grid">
        {PRIZE_TYPES.map((p) => (
          <Heatmap key={p} prize={p} stats={stats} />
        ))}
      </div>
      <h3 className="small" style={{ margin: '16px 0 4px' }}>ผลรางวัลที่ใช้คำนวณ (ใหม่สุดก่อน)</h3>
      <div className="table-wrap">
        <table className="draws">
          <thead>
            <tr>
              <th scope="col">งวด</th>
              <th scope="col">รางวัลที่ 1</th>
              <th scope="col">หน้า 3 ตัว</th>
              <th scope="col">ท้าย 3 ตัว</th>
              <th scope="col">ท้าย 2 ตัว</th>
              <th scope="col">ที่มา</th>
            </tr>
          </thead>
          <tbody>
            {draws.map((d) => (
              <tr key={d.drawDate}>
                <td>{formatThaiShort(d.drawDate)}</td>
                <td><strong>{d.firstPrize}</strong></td>
                <td>{d.front3.join(' ')}</td>
                <td>{d.last3.join(' ')}</td>
                <td>{d.last2}</td>
                <td>
                  <a href={d.source} target="_blank" rel="noopener noreferrer">ใบตรวจผล</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
