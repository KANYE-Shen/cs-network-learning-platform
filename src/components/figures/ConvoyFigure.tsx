// ============================================================
// 图解：车队类比（k1.4.3）——收费站 = 发送时延，公路 = 传播时延
// 图中数字与正文一致：10 辆车、100 km、12 秒/辆、100 km/h
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 760
const H = 300
const N = 10

type Scenario = {
  name: string
  booth: number // 每辆车通过收费站的时间（秒）
  travel: number // 从第一个收费站到第二个收费站（秒）
  speed: string
  boothLabel: string
}

const SCENARIOS: Scenario[] = [
  { name: '10 辆车 · 100 km/h', booth: 12, travel: 3600, speed: '100 km/h', boothLabel: '12 秒/辆' },
  { name: '10 辆车 · 1000 km/h', booth: 60, travel: 360, speed: '1000 km/h', boothLabel: '1 分钟/辆' },
]

// 固定几何
const GROUND = { x: -272, y: -62, w: 452, d: 124, r: 8 }
const ROAD = { x: -264, y: -17, w: 436, d: 34, r: 3 }
const BOOTH_A = -150
const BOOTH_B = 152
const QUEUE_X = -172

const P = k.fitProjection(
  [
    ...k.boxCorners(GROUND, -8, 0),
    ...k.boxCorners({ ...ROAD, y: -20, d: 40 }, 0, 34),
    [BOOTH_B + 12, 0, 34],
    [QUEUE_X - N * 6, 0, 8],
  ],
  W,
  H,
  { pad: 10, azimuth: 26, elevation: 38 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)

function booth(x: number) {
  const out: string[] = []
  out.push(S(k.slabOf({ x: x - 13, y: -22, w: 26, d: 44, r: 2 }, 0, 3, P, 4, 0.5), { tone: 'mid' }))
  for (const y of [-15, 15]) {
    out.push(S(k.cylinder(x - 6, y, 2.2, 3, 22, P, 20), { tone: 'mid' }))
    out.push(S(k.cylinder(x + 6, y, 2.2, 3, 22, P, 20), { tone: 'mid' }))
  }
  out.push(S(k.slabOf({ x: x - 15, y: -23, w: 30, d: 46, r: 2 }, 27, 4, P, 4, 0.6), { tone: 'hi' }))
  out.push(L(k.planOutline(k.insetPlan({ x: x - 15, y: -23, w: 30, d: 46, r: 2 }, 3), 31, P), { tone: 'faint' }))
  out.push(S(k.slabOf({ x: x - 1.5, y: -5, w: 3, d: 10, r: 0.6 }, 11, 8, P, 2), { tone: 'lo' }))
  return out.join('')
}

function car(x: number, y: number, lit: boolean, state: 'wait' | 'booth' | 'travel') {
  const out: string[] = []
  out.push(S(k.slabOf({ x: x - 9, y: y - 6, w: 18, d: 12, r: 2 }, 0, 4.2, P, 3, 0.5), { tone: 'hi', lit }))
  out.push(S(k.slabOf({ x: x - 5, y: y - 4.5, w: 10, d: 9, r: 1.8 }, 4.2, 4, P, 3, 0.5), { tone: 'mid', lit }))
  const tone = state === 'travel' ? 'green' : state === 'booth' ? 'blue' : 'faint'
  out.push(L(k.lineOnTop([x - 6, y], [x + 6, y], 8.4, P), { tone }))
  out.push(
    k.dotsSvg(
      [
        at([x - 2.8, y - 2.8, 0.1]),
        at([x + 2.8, y - 2.8, 0.1]),
        at([x - 2.8, y + 2.8, 0.1]),
        at([x + 2.8, y + 2.8, 0.1]),
      ],
      { size: 0.5, tone: 'lo' },
    ),
  )
  return out.join('')
}

export default function ConvoyFigure() {
  const [scenarioIndex, setScenarioIndex] = useState(0)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const sc = SCENARIOS[scenarioIndex]

  const total = sc.booth * N + sc.travel
  const cycle = 12 // 秒：一个完整播放周期
  const T = ((t % cycle) / cycle) * total

  const svg = useMemo(() => {
    const out: string[] = []
    out.push(S(k.slabOf(GROUND, -8, 8, P, 8, 1), { tone: 'lo' }))
    out.push(S(k.slabOf(ROAD, 0, 0.8, P, 3), { tone: 'hi', crease: 'none' }))
    out.push(L(k.lineOnTop([ROAD.x + 8, 0], [ROAD.x + ROAD.w - 8, 0], 0.9, P), { tone: 'faint', dashed: true }))

    for (let x = ROAD.x + 14; x < ROAD.x + ROAD.w - 8; x += 26) {
    for (const y of [ROAD.y - 4, ROAD.y + ROAD.d + 4]) {
      out.push(S(k.cylinder(x, y, 1.4, 0, 6, P, 12), { tone: 'lo' }))
    }
  }
  out.push(booth(BOOTH_A))
    out.push(booth(BOOTH_B))

    const cars: { x: number; y: number; i: number; state: 'wait' | 'booth' | 'travel' }[] = []
    for (let i = 0; i < N; i++) {
      const enter = i * sc.booth
      const exit = (i + 1) * sc.booth
      let x: number
      if (T < enter) {
        x = QUEUE_X - (N - 1 - i) * 10.4
      } else if (T < exit) {
        x = BOOTH_A
      } else {
        const frac = Math.min((T - exit) / sc.travel, 1)
        x = BOOTH_A + frac * (BOOTH_B - BOOTH_A)
      }
      const state: 'wait' | 'booth' | 'travel' = T < enter ? 'wait' : T < exit ? 'booth' : 'travel'
      cars.push({ x, y: i % 2 === 0 ? -3 : 3, i, state })
    }
    cars.sort((a, b) => k.depthOf([a.x, a.y, 0], P) - k.depthOf([b.x, b.y, 0], P))
    for (const c of cars) out.push(car(c.x, c.y, c.i === N - 1, c.state))

    out.push(L(k.lineOnTop([BOOTH_A + 12, 22], [BOOTH_B - 12, 22], 0.9, P), { tone: 'faint', dashed: true }))
    const d = at([(BOOTH_A + BOOTH_B) / 2, 26, 1])
    out.push(`<text class="iso-face-text" data-tone="hi" x="${d[0]}" y="${d[1]}" font-size="10" text-anchor="middle">100 km</text>`)
    const q = at([QUEUE_X - N * 6, -26, 10])
    out.push(`<text class="iso-face-text" data-tone="hi" x="${q[0] - 12}" y="${q[1] + 12}" font-size="10">车队 ${N} 辆</text>`)
    return out.join('')
  }, [T, sc])

  const minutes = T / 60
  const through = Math.min(N, Math.floor(T / sc.booth))
  const firstArrive = (sc.booth + sc.travel) / 60
  const lastArrive = total / 60
  const allThrough = (N * sc.booth) / 60

  return (
    <FigureCard
      fig="图 1 · 车队类比"
      title="收费站是“发送”，公路是“传播”"
      subtitle="车 = 比特，车队 = 分组。通过收费站的时间对应发送时延，在公路上行驶的时间对应传播时延。"
      readout={
        <>
          t = {minutes.toFixed(1)} min · 已通过收费站 {through}/{N} · 首车抵达 {firstArrive.toFixed(1)} min · 末车抵达{' '}
          {lastArrive.toFixed(1)} min
        </>
      }
      running={running}
      onToggle={() => setRunning((r) => !r)}
      onReset={() => {
        setT(0)
        setRunning(false)
      }}
      extra={
        <select
          className="text-xs rounded-lg px-2 py-1.5 border bg-transparent"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          value={scenarioIndex}
          onChange={(e) => {
            setScenarioIndex(Number(e.target.value))
            setT(0)
          }}
          aria-label="选择车速与收费站速度"
        >
          {SCENARIOS.map((s, i) => (
            <option key={s.name} value={i}>
              {s.name}
            </option>
          ))}
        </select>
      }
      caption={
        <>
          当前：车速 {sc.speed}，收费站 {sc.boothLabel}。全部车辆通过第一个收费站需 <strong>{allThrough} 分钟</strong>
          ；首车抵达第二个收费站需 <strong>{firstArrive.toFixed(1)} 分钟</strong>，末车 <strong>{lastArrive.toFixed(1)} 分钟</strong>
          。切到 1000 km/h 时，传播比发送快，首车在全部车辆发完前就已抵达。
        </>
      }
    >
      <Scene width={W} height={H} label="车队类比：收费站与公路" svg={svg} />
    </FigureCard>
  )
}
