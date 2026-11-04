import { useEffect, useMemo, useState } from 'react'
import { BirthCard } from './components/BirthCard'
import { NextDrawCard } from './components/NextDrawCard'
import { PrizeCard, type Selection } from './components/PrizeCards'
import { StatsPanel } from './components/StatsPanel'
import { TunePanel } from './components/TunePanel'
import { WhyPanel } from './components/WhyPanel'
import { useDraws } from './hooks/useDraws'
import { HistoryPanel } from './components/HistoryPanel'
import { defaults } from './lib/config'
import { nextDrawDate } from './lib/drawDate'
import type { DrawsFile } from './lib/draws'
import { generate, normalizeWeights } from './lib/engine/generate'
import type { BirthInput } from './lib/engine/personal'
import { load, save } from './lib/storage'
import { formatThaiShort, toBangkok } from './lib/thaiDate'
import { addTicket, clearTickets, loadTickets, type Ticket } from './lib/tickets'

const REPO_URL = 'https://github.com/idblackdesert-max/thai-lotto-calc'
const DISCLAIMER = 'ผลลัพธ์นี้จัดทำเพื่อความบันเทิง ผลสลากเป็นการสุ่ม ไม่มีวิธีใดเพิ่มโอกาสถูกรางวัล'
type Theme = 'light' | 'dark'

function systemTheme(): Theme {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => load<Theme | null>('theme', null) ?? systemTheme())
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])
  const draws = useDraws()

  return (
    <>
      <header className="topbar">
        <h1>เลขงวดหน้า</h1>
        <button
          type="button"
          className="icon-btn"
          aria-label={theme === 'dark' ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'}
          onClick={() => {
            const next = theme === 'dark' ? 'light' : 'dark'
            setTheme(next)
            save('theme', next)
          }}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>
      </header>
      <main className="page">
        {draws.status === 'loading' && <div className="card">กำลังโหลดข้อมูลผลรางวัล…</div>}
        {draws.status === 'error' && (
          <div className="card warn">โหลดข้อมูลผลรางวัลไม่สำเร็จ ({draws.message}) ลองเปิดใหม่อีกครั้ง</div>
        )}
        {draws.status === 'ready' && <Calculator data={draws.data} />}
      </main>
      <footer>
        <p className="disclaimer">{DISCLAIMER}</p>
        <p>
          ข้อมูลผลรางวัล: สำนักงานสลากกินแบ่งรัฐบาล (glo.or.th) · ตรวจเทียบกับ Sanook · แนวคิดเดิมจาก Thai Lotto API (rayriffy)
          <br />
          {draws.status === 'ready' && <>อัปเดตข้อมูลล่าสุด {new Date(draws.data.generatedAt).toLocaleString('th-TH')} · </>}
          <a href={REPO_URL} target="_blank" rel="noopener noreferrer">ซอร์สโค้ดบน GitHub</a>
        </p>
      </footer>
    </>
  )
}

function Calculator({ data }: { data: DrawsFile }) {
  const [now] = useState(() => new Date())
  const today = toBangkok(now).date
  const drawDate = useMemo(() => nextDrawDate(now), [now])

  const [tickets, setTickets] = useState<Record<string, Ticket>>(loadTickets)
  const [rememberedBirth, setRememberedBirth] = useState<BirthInput | null>(() => load<BirthInput | null>('birth', null))
  const [selected, setSelected] = useState<Selection>({ prize: 'first6', set: 0, position: 0 })
  const [whyOpen, setWhyOpen] = useState(false)
  const ticket = tickets[drawDate] ?? null

  // ข้อมูลงวด (วัน/ข้างขึ้นแรม/สถิติ) ไม่ขึ้นกับวันเกิด — เลขที่แสดงมาจากตั๋วที่ล็อกไว้เท่านั้น
  const base = useMemo(
    () => generate({ drawDate, draws: data.draws, weights: defaults.weights, birth: null, cutKalakini: true }),
    [drawDate, data.draws],
  )
  const hasBirth = ticket?.personal != null
  const history = Object.values(tickets)
    .filter((t) => t.drawDate < drawDate)
    .sort((a, b) => (a.drawDate < b.drawDate ? 1 : -1))

  function lock(birth: BirthInput | null, remember: boolean) {
    const r = generate({ drawDate, draws: data.draws, weights: defaults.weights, birth, cutKalakini: true })
    setTickets((prev) => addTicket(prev, { drawDate, lockedAt: new Date().toISOString(), personal: r.context.personal, sets: r.sets }))
    const keep = remember ? birth : null
    save('birth', keep)
    setRememberedBirth(keep)
    requestAnimationFrame(() => document.getElementById('results')?.scrollIntoView({ block: 'start' }))
  }

  function select(s: Selection) {
    setSelected(s)
    setWhyOpen(true)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => document.getElementById('why')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }))
  }

  return (
    <>
      <div className="cols">
        <div className="col">
          <NextDrawCard drawDate={drawDate} today={today} newestDrawDate={data.newestDrawDate} context={base.context} />
          <BirthCard
            key={ticket ? 'locked' : 'open'}
            drawDate={drawDate}
            ticket={ticket}
            rememberedBirth={rememberedBirth}
            thisYear={Number(today.slice(0, 4))}
            drawDayIsKalakini={ticket?.personal?.kalakini === base.context.day.number}
            onLock={lock}
          />
          <TunePanel percents={normalizeWeights(defaults.weights, hasBirth)} hasBirth={hasBirth} />
        </div>
        <div className="col">
          {ticket ? (
            <>
              <div id="results" className="area-first" style={{ scrollMarginTop: 8 }}>
                <PrizeCard prize="first6" className="first-card" sets={ticket.sets.first6} selected={selected} onSelect={select} />
              </div>
              <div className="pair area-three">
                <PrizeCard prize="front3" className="" sets={ticket.sets.front3} selected={selected} onSelect={select} />
                <PrizeCard prize="last3" className="" sets={ticket.sets.last3} selected={selected} onSelect={select} />
              </div>
              <PrizeCard prize="last2" className="area-two" sets={ticket.sets.last2} selected={selected} onSelect={select} />
              <WhyPanel
                explanation={ticket.sets[selected.prize][selected.set].explanations[selected.position]}
                setIndex={selected.set}
                setCount={ticket.sets[selected.prize].length}
                open={whyOpen}
                onToggle={setWhyOpen}
              />
            </>
          ) : (
            <section id="results" className="card first-card area-first">
              <h2>เลขงวด {formatThaiShort(drawDate)}</h2>
              <p className="muted" style={{ margin: 0 }}>
                กรอกวันเกิด (หรือเว้นว่าง) แล้วกด "คำนวณเลข" — ได้เลขแล้วจะล็อกไว้ เปิดวันไหนก็ได้เลขเดิมจนออกรางวัล
              </p>
            </section>
          )}
        </div>
      </div>
      <HistoryPanel
        tickets={history}
        draws={data.draws}
        onClear={() => {
          clearTickets()
          setTickets({})
        }}
      />
      <StatsPanel stats={base.statistics} draws={base.drawsUsed} />
    </>
  )
}
