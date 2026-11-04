import { useEffect, useMemo, useState } from 'react'
import { BirthCard } from './components/BirthCard'
import { NextDrawCard } from './components/NextDrawCard'
import { PrizeCard, type Selection } from './components/PrizeCards'
import { StatsPanel } from './components/StatsPanel'
import { TunePanel } from './components/TunePanel'
import { WhyPanel } from './components/WhyPanel'
import { useDraws } from './hooks/useDraws'
import { defaults, type Weights } from './lib/config'
import { nextDrawDate } from './lib/drawDate'
import type { DrawsFile } from './lib/draws'
import { generate } from './lib/engine/generate'
import type { BirthInput } from './lib/engine/personal'
import { PRIZE_TYPES, type PrizeType } from './lib/engine/types'
import { load, save } from './lib/storage'
import { toBangkok } from './lib/thaiDate'

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

  const [birth, setBirth] = useState<BirthInput | null>(() => load<BirthInput | null>('birth', null))
  const [remember, setRemember] = useState(() => birth !== null)
  const [cutKalakini, setCutKalakini] = useState(true)
  const [weights, setWeights] = useState<Weights>(defaults.weights)
  const [nonces, setNonces] = useState<Record<PrizeType, number>>({ first6: 0, front3: 0, last3: 0, last2: 0 })
  const [selected, setSelected] = useState<Selection>({ prize: 'first6', set: 0, position: 0 })
  const [whyOpen, setWhyOpen] = useState(false)

  const result = useMemo(() => {
    const input = { drawDate, draws: data.draws, weights, birth, cutKalakini, nonce: 0 }
    const base = generate(input)
    const sets = { ...base.sets }
    // "สุ่มชุดใหม่" ของแต่ละการ์ดเปลี่ยนเฉพาะการ์ดนั้น
    for (const prize of PRIZE_TYPES)
      if (nonces[prize] > 0) sets[prize] = generate({ ...input, nonce: nonces[prize] }).sets[prize]
    return { ...base, sets }
  }, [drawDate, data.draws, weights, birth, cutKalakini, nonces])

  function select(s: Selection) {
    setSelected(s)
    setWhyOpen(true)
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    requestAnimationFrame(() => document.getElementById('why')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' }))
  }

  const reroll = (prize: PrizeType) => setNonces((n) => ({ ...n, [prize]: n[prize] + 1 }))
  const explanation = result.sets[selected.prize][selected.set].explanations[selected.position]

  return (
    <>
      <div className="cols">
        <div className="col">
          <NextDrawCard drawDate={drawDate} today={today} newestDrawDate={data.newestDrawDate} context={result.context} />
          <BirthCard
            birth={birth}
            remember={remember}
            cutKalakini={cutKalakini}
            thisYear={Number(today.slice(0, 4))}
            personal={result.context.personal}
            drawDayIsKalakini={result.context.drawDayIsKalakini}
            onCutKalakini={setCutKalakini}
            onSubmit={(b, r) => {
              setBirth(b)
              setRemember(r)
              save('birth', r ? b : null)
              document.getElementById('results')?.scrollIntoView({ block: 'start' })
            }}
          />
          <TunePanel
            weights={weights}
            percents={result.percents}
            hasBirth={birth !== null}
            onChange={(key, value) => setWeights((w) => ({ ...w, [key]: value }))}
            onReset={() => setWeights(defaults.weights)}
          />
        </div>
        <div className="col">
          <div id="results" className="area-first" style={{ scrollMarginTop: 8 }}>
            <PrizeCard prize="first6" className="first-card" sets={result.sets.first6} selected={selected} onSelect={select} onReroll={() => reroll('first6')} />
          </div>
          <div className="pair area-three">
            <PrizeCard prize="front3" className="" sets={result.sets.front3} selected={selected} onSelect={select} onReroll={() => reroll('front3')} />
            <PrizeCard prize="last3" className="" sets={result.sets.last3} selected={selected} onSelect={select} onReroll={() => reroll('last3')} />
          </div>
          <PrizeCard prize="last2" className="area-two" sets={result.sets.last2} selected={selected} onSelect={select} onReroll={() => reroll('last2')} />
          <WhyPanel
            explanation={explanation}
            setIndex={selected.set}
            setCount={result.sets[selected.prize].length}
            open={whyOpen}
            onToggle={setWhyOpen}
          />
        </div>
      </div>
      <StatsPanel stats={result.statistics} draws={result.drawsUsed} />
    </>
  )
}
