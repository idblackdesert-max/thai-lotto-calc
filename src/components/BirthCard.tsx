import { useState, type FormEvent } from 'react'
import type { BirthInput } from '../lib/engine/personal'
import type { Ticket } from '../lib/tickets'
import { daysInMonth, formatThaiShort, isoDate, parseIso, THAI_MONTHS, toBangkok, toBuddhistYear } from '../lib/thaiDate'

type Props = {
  drawDate: string
  /** ตั๋วของงวดนี้ (ล็อกแล้ว) หรือ null */
  ticket: Ticket | null
  /** วันเกิดที่ผู้ใช้เลือกให้จำไว้ (ใช้เติมฟอร์มงวดถัดไป) */
  rememberedBirth: BirthInput | null
  thisYear: number
  drawDayIsKalakini: boolean
  onLock: (birth: BirthInput | null, remember: boolean) => void
}

export function BirthCard(props: Props) {
  const initial = props.rememberedBirth ? parseIso(props.rememberedBirth.date) : null
  const [day, setDay] = useState(initial ? String(initial.day) : '')
  const [month, setMonth] = useState(initial ? String(initial.month) : '')
  const [beYear, setBeYear] = useState(initial ? String(toBuddhistYear(initial.year)) : '')
  const [wednesdayNight, setWednesdayNight] = useState(props.rememberedBirth?.wednesdayNight ?? false)
  const [remember, setRemember] = useState(props.rememberedBirth !== null)

  const t = props.ticket
  if (t) {
    const p = t.personal
    return (
      <section className="card area-user" aria-labelledby="birth-title">
        <h2 id="birth-title">เลขของคุณงวดนี้</h2>
        <div className="locked">
          <span aria-hidden="true">🔒</span>
          <span>
            ล็อกแล้วเมื่อ {formatThaiShort(toBangkok(new Date(t.lockedAt)).date)} — เปิดวันไหนก็ได้เลขเดิมจนถึงงวด {formatThaiShort(t.drawDate)}
          </span>
        </div>
        <p className="muted small" style={{ margin: '8px 0 0' }}>
          {p
            ? `เกิดวัน${p.planetName} (${p.planet}) · ศรี ${p.sri} · เดช ${p.det} · กาลกิณี ${p.kalakini} · ผลรวมวันเกิด ${p.numerology}`
            : 'คำนวณโดยไม่ใช้วันเกิด'}
          <br />
          งวดหน้าจะคำนวณใหม่ได้หลังออกรางวัล 16:00 น.
        </p>
        {props.drawDayIsKalakini && (
          <div className="warn">วันออกรางวัลงวดนี้ตรงกับวันกาลกิณีของคุณ (เป็นข้อสังเกตตามตำรา ไม่มีผลต่อการคำนวณ)</div>
        )}
      </section>
    )
  }

  const complete = day && month && beYear
  const partial = (day || month || beYear) && !complete
  const maxDay = month && beYear ? daysInMonth(Number(beYear) - 543, Number(month)) : 31
  const invalid = complete && Number(day) > maxDay

  function submit(e: FormEvent) {
    e.preventDefault()
    if (partial || invalid) return
    props.onLock(complete ? { date: isoDate(Number(beYear) - 543, Number(month), Number(day)), wednesdayNight } : null, remember)
  }

  const years = Array.from({ length: 100 }, (_, i) => toBuddhistYear(props.thisYear) - i)

  return (
    <form className="card area-user" onSubmit={submit} aria-labelledby="birth-title">
      <h2 id="birth-title">วันเกิดของคุณ (ไม่บังคับ)</h2>
      <div className="field-row" role="group" aria-label="วันเกิด">
        <select aria-label="วันที่" value={day} onChange={(e) => setDay(e.target.value)}>
          <option value="">วัน</option>
          {Array.from({ length: 31 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{i + 1}</option>
          ))}
        </select>
        <select aria-label="เดือน" value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="">เดือน</option>
          {THAI_MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>{m}</option>
          ))}
        </select>
        <select aria-label="ปี พ.ศ." value={beYear} onChange={(e) => setBeYear(e.target.value)}>
          <option value="">ปี พ.ศ.</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>
      {invalid && <div className="warn">เดือนนี้มีแค่ {maxDay} วัน</div>}
      {partial && <div className="warn">กรอกวัน เดือน ปี ให้ครบ หรือเว้นว่างทั้งหมด</div>}
      <label className="check">
        <input type="checkbox" checked={wednesdayNight} onChange={(e) => setWednesdayNight(e.target.checked)} />
        เกิดวันพุธกลางคืน (หลัง 18:00)
      </label>
      <label className="check">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        จำวันเกิดไว้ใช้งวดหน้า (เก็บในเครื่องนี้เท่านั้น)
      </label>
      <button type="submit" className="btn btn-primary">คำนวณเลขงวด {formatThaiShort(props.drawDate)}</button>
      <p className="muted small" style={{ margin: '8px 0 0' }}>
        กดแล้ว<strong>เลขงวดนี้จะถูกล็อก</strong> เปลี่ยนไม่ได้จนออกรางวัล · วันเกิดคำนวณในเครื่องของคุณเท่านั้น ไม่ถูกส่งไปที่ใด
      </p>
    </form>
  )
}
