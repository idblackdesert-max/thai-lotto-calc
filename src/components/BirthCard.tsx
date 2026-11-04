import { useState, type FormEvent } from 'react'
import type { BirthInput } from '../lib/engine/personal'
import type { GenerateResult } from '../lib/engine/generate'
import { daysInMonth, isoDate, parseIso, THAI_MONTHS, toBuddhistYear } from '../lib/thaiDate'

type Props = {
  birth: BirthInput | null
  remember: boolean
  cutKalakini: boolean
  thisYear: number
  personal: GenerateResult['context']['personal']
  drawDayIsKalakini: boolean
  onSubmit: (birth: BirthInput | null, remember: boolean) => void
  onCutKalakini: (value: boolean) => void
}

export function BirthCard(props: Props) {
  const initial = props.birth ? parseIso(props.birth.date) : null
  const [day, setDay] = useState(initial ? String(initial.day) : '')
  const [month, setMonth] = useState(initial ? String(initial.month) : '')
  const [beYear, setBeYear] = useState(initial ? String(toBuddhistYear(initial.year)) : '')
  const [wednesdayNight, setWednesdayNight] = useState(props.birth?.wednesdayNight ?? false)
  const [remember, setRemember] = useState(props.remember)

  const complete = day && month && beYear
  const maxDay = month && beYear ? daysInMonth(Number(beYear) - 543, Number(month)) : 31
  const invalid = complete && Number(day) > maxDay

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!complete) return props.onSubmit(null, remember)
    if (invalid) return
    props.onSubmit({ date: isoDate(Number(beYear) - 543, Number(month), Number(day)), wednesdayNight }, remember)
  }

  function clear() {
    setDay('')
    setMonth('')
    setBeYear('')
    setWednesdayNight(false)
    props.onSubmit(null, remember)
  }

  const years = Array.from({ length: 100 }, (_, i) => toBuddhistYear(props.thisYear) - i)
  const p = props.personal

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
      <label className="check">
        <input type="checkbox" checked={wednesdayNight} onChange={(e) => setWednesdayNight(e.target.checked)} />
        เกิดวันพุธกลางคืน (หลัง 18:00)
      </label>
      <label className="check">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        จำวันเกิด (เก็บในเครื่องนี้เท่านั้น)
      </label>
      <label className="check">
        <input type="checkbox" checked={props.cutKalakini} onChange={(e) => props.onCutKalakini(e.target.checked)} />
        ตัดเลขกาลกิณี
      </label>
      <div className="btn-row">
        <button type="submit" className="btn btn-primary">คำนวณเลข</button>
      </div>
      {props.birth && (
        <button type="button" className="btn btn-small" style={{ marginTop: 8 }} onClick={clear}>
          ล้างวันเกิด
        </button>
      )}
      <p className="muted small" style={{ margin: '8px 0 0' }}>
        {p
          ? `เกิดวัน${p.planetName} (${p.planet}) · ศรี ${p.sri} · เดช ${p.det} · กาลกิณี ${p.kalakini} · ผลรวมวันเกิด ${p.numerology}`
          : 'ยังไม่ได้กรอกวันเกิด — ระบบจะไม่ใช้คะแนนจากวันเกิด'}
        <br />
        วันเกิดคำนวณในเครื่องของคุณเท่านั้น ไม่ถูกส่งไปที่ใด
      </p>
      {props.drawDayIsKalakini && (
        <div className="warn">วันออกรางวัลงวดนี้ตรงกับวันกาลกิณีของคุณ (เป็นข้อสังเกตตามตำรา ไม่มีผลต่อการคำนวณ)</div>
      )}
    </form>
  )
}
