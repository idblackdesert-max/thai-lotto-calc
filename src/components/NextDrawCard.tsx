import type { CSSProperties } from 'react'
import { defaults } from '../lib/config'
import type { GenerateResult } from '../lib/engine/generate'
import { daysBetween, formatThaiLong, formatThaiShort } from '../lib/thaiDate'

type Props = { drawDate: string; today: string; newestDrawDate: string | null; context: GenerateResult['context'] }

export function NextDrawCard({ drawDate, today, newestDrawDate, context }: Props) {
  const { day, numerology, lunar, zodiac } = context
  const stale = newestDrawDate !== null && daysBetween(newestDrawDate, today) > defaults.staleDays
  return (
    <section className="card next-card area-next" style={{ '--day-color': day.color } as CSSProperties} aria-labelledby="next-title">
      <div id="next-title" className="muted small">งวดถัดไป</div>
      <div className="next-date">
        <span className="sr-only">{formatThaiLong(drawDate)}</span>
        <span aria-hidden="true">{formatThaiShort(drawDate)}</span>
      </div>
      <div className="chips">
        <span className="chip">เลขประจำวัน {day.number}</span>
        <span className="chip">
          <span className="swatch" style={{ background: day.color }} aria-hidden="true" />
          สีประจำวัน{day.colorName}
        </span>
        <span className="chip">{lunar.label} (โดยประมาณ)</span>
        <span className="chip">ปี{zodiac.name} ({zodiac.number})</span>
        <span className="chip">เลขศาสตร์ {numerology.total}</span>
      </div>
      <p className="muted small" style={{ margin: '8px 0 0' }}>
        ข้อมูลล่าสุดถึงงวด {newestDrawDate ? formatThaiShort(newestDrawDate) : '—'}
      </p>
      {stale && <div className="warn">ข้อมูลผลรางวัลเก่ากว่า {defaults.staleDays} วัน อาจยังไม่อัปเดต</div>}
    </section>
  )
}
