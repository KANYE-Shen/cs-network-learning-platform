// ============================================================
// 图解：HTTP 响应时间 2RTT + T（k2.2.4）
// 两张办公桌之间架起一条真实轨道：控制小车跑两个来回，数据小车运一个货箱。
// 数字与正文一致：RTT = 100 ms，L = 1 Mbit，R = 10 Mbps → T = 100 ms
// 非持续：2RTT + T = 300 ms；持久连接复用后的对象：1RTT + T = 200 ms
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 600
const H = 360
const RTT = 100
const RATE = 10 // Mbps
const LEN = 1 // Mbit
const T = (LEN / RATE) * 1000 // 100 ms

type ModeKey = 'nonpersistent' | 'persistent'
const MODES: { key: ModeKey; label: string; total: number }[] = [
  { key: 'nonpersistent', label: '非持续连接（新取一个对象）', total: 2 * RTT + T },
  { key: 'persistent', label: '持久连接（复用已建连接）', total: RTT + T },
]

const GROUND = { x: -238, y: -74, w: 476, d: 148, r: 14 }
const CLIENT_X = -176
const SERVER_X = 176
const INNER = 42 // 轨道立柱距桌心
const TRACK_Z = 72
const LANE_CTRL = -18
const LANE_DATA = 18
const PARK_A = -118
const PARK_B = 118

const P = k.fitProjection(
  [...k.boxCorners(GROUND, -8, 0), [-238, 0, 0], [238, 0, 0], [0, 0, 98], [-176, 0, 74]],
  W,
  H,
  { pad: 12, azimuth: 32, elevation: 36 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t))

type Parcel = 'syn' | 'ack' | 'request' | 'response' | 'data' | null
type Frame = {
  stageNo: number
  stageCount: number
  stage: string
  detail: string
  ctrlX: number
  parcel: Parcel
  dataX: number
  dataHot: boolean
}

function timeline(m: number, persistent: boolean): Frame {
  // 持久连接复用已建连接，请求阶段从 0 开始；非持续连接先花 1 RTT 握手
  const requestStart = persistent ? 0 : RTT
  if (!persistent && m < RTT) {
    const p = m / RTT
    return p < 0.5
      ? {
          stageNo: 1,
          stageCount: 3,
          stage: '建立 TCP 连接',
          detail: 'SYN → 服务器',
          ctrlX: lerp(PARK_A, PARK_B, p * 2),
          parcel: 'syn',
          dataX: PARK_B,
          dataHot: false,
        }
      : {
          stageNo: 1,
          stageCount: 3,
          stage: '建立 TCP 连接',
          detail: 'SYN+ACK → 客户端（已满 1 RTT）',
          ctrlX: lerp(PARK_B, PARK_A, (p - 0.5) * 2),
          parcel: 'ack',
          dataX: PARK_B,
          dataHot: false,
        }
  }
  if (m < requestStart + RTT) {
    const p = (m - requestStart) / RTT
    const first = !persistent
    return p < 0.5
      ? {
          stageNo: first ? 2 : 1,
          stageCount: first ? 3 : 2,
          stage: 'HTTP 请求 / 响应',
          detail: 'GET 请求 → 服务器',
          ctrlX: lerp(PARK_A, PARK_B, p * 2),
          parcel: 'request',
          dataX: PARK_B,
          dataHot: false,
        }
      : {
          stageNo: first ? 2 : 1,
          stageCount: first ? 3 : 2,
          stage: 'HTTP 请求 / 响应',
          detail: '响应首字节 → 客户端（已满第 2 个 RTT）',
          ctrlX: lerp(PARK_B, PARK_A, (p - 0.5) * 2),
          parcel: 'response',
          dataX: PARK_B,
          dataHot: false,
        }
  }
  const p = (m - requestStart - RTT) / T
  return {
    stageNo: persistent ? 2 : 3,
    stageCount: persistent ? 2 : 3,
    stage: '传输文件',
    detail: '数据箱由服务器送往客户端，耗时 T = L/R',
    ctrlX: PARK_A,
    parcel: null,
    dataX: lerp(PARK_B, PARK_A, p),
    dataHot: true,
  }
}

function desk(cx: number, side: number) {
  const out: string[] = []
  for (const dx of [-44, 44]) {
    for (const dy of [-28, 28]) {
      out.push(S(k.cylinder(cx + dx, dy, 4, 0, 4, P, 12), { tone: 'lo' }))
      out.push(S(k.cylinder(cx + dx, dy, 3.2, 4, 39, P, 12), { tone: 'mid' }))
    }
  }
  out.push(S(k.slabOf({ x: cx - 52, y: -36, w: 104, d: 72, r: 5 }, 43, 6, P, 6, 1.2), { tone: 'hi' }))
  out.push(L(k.planOutline({ x: cx - 46, y: -30, w: 92, d: 60, r: 4 }, 49.2, P), { tone: 'faint' }))
  out.push(S(k.slabOf({ x: cx - 44, y: 25, w: 88, d: 5, r: 2 }, 16, 27, P, 4), { tone: 'mid' }))
  // 抽屉柜（放在外侧，避开轨道立柱）
  const dx0 = cx + side * 18
  out.push(S(k.slabOf({ x: dx0, y: -10, w: 30, d: 42, r: 3 }, 4, 39, P, 4, 0.8), { tone: 'mid' }))
  for (let i = 0; i < 3; i++) {
    out.push(S(k.slabOf({ x: dx0 + 3, y: -6, w: 24, d: 34, r: 2 }, 9 + i * 10, 8, P, 3, 0.5), { tone: 'hi' }))
    out.push(k.dotsSvg([at([dx0 + 24, -6.4, 13 + i * 10])], { size: 1.1, tone: 'lo' }))
  }
  // 显示器
  out.push(S(k.slabOf({ x: cx - 16, y: -30, w: 32, d: 9, r: 2 }, 49, 2, P, 3), { tone: 'mid' }))
  out.push(S(k.cylinder(cx, -25, 1.6, 51, 11, P, 10), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: cx - 17, y: -30, w: 34, d: 8, r: 2 }, 61, 21, P, 3, 0.7), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: cx - 13, y: -25.6, w: 26, d: 1.2, r: 1 }, 65, 13, P, 2), { tone: 'lo' }))
  out.push(L(k.planOutline({ x: cx - 13, y: -25.6, w: 26, d: 1.2, r: 1 }, 78.2, P), { tone: 'faint' }))
  // 键盘、杯子、纸堆
  out.push(S(k.slabOf({ x: cx - 20, y: -8, w: 34, d: 12, r: 2 }, 49, 1.6, P, 3), { tone: 'hi', flat: true }))
  out.push(S(k.cylinder(cx + 46, -22, 4.2, 49, 7, P, 16), { tone: 'hi' }))
  out.push(L(k.ring(cx + 46, -22, 4.2, 55.8, P, 16), { tone: 'faint' }))
  out.push(S(k.slabOf({ x: cx - 46, y: 2, w: 17, d: 21, r: 1 }, 49, 1.2, P, 2), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: cx - 43, y: 6, w: 14, d: 16, r: 1 }, 50.2, 1, P, 2), { tone: 'mid' }))
  return out
}

function carriage(x: number, y: number, lit: boolean) {
  const out: string[] = []
  for (const dx of [-6, 6]) {
    for (const dy of [-5, 5]) {
      out.push(S(k.cylinder(x + dx, y + dy, 2.3, 74.4, 3, P, 10), { tone: 'lo' }))
    }
  }
  out.push(S(k.slabOf({ x: x - 11, y: y - 9, w: 22, d: 18, r: 3 }, 77, 6, P, 4, 0.7), { tone: 'hi', lit }))
  out.push(L(k.lineOnTop([x - 8, y], [x + 8, y], 83.2, P), { tone: lit ? 'green' : 'faint' }))
  return out
}

function cargo(x: number, y: number, parcel: Parcel, hot: boolean) {
  const out: string[] = []
  if (parcel === 'syn' || parcel === 'ack') {
    out.push(S(k.cylinder(x, y, 6, 83, 3, P, 18), { tone: 'hi', lit: true }))
    out.push(L(k.ring(x, y, 6, 86.1, P, 18), { tone: parcel === 'syn' ? 'blue' : 'green' }))
    out.push(
      k.faceTextSvg(k.topMatrix([x, y], 86.4, P), parcel === 'syn' ? 'SYN' : 'SYN+ACK', { size: 2.2, tone: 'hi', anchor: 'middle' }),
    )
  } else if (parcel === 'request' || parcel === 'response') {
    out.push(S(k.slabOf({ x: x - 10, y: y - 6, w: 20, d: 12, r: 1 }, 83, 2, P, 3, 0.4), { tone: 'hi', lit: true }))
    out.push(L(k.lineOnTop([x - 10, y - 6], [x + 10, y + 6], 85.2, P), { tone: parcel === 'request' ? 'blue' : 'green' }))
    out.push(L(k.lineOnTop([x - 10, y + 6], [x + 10, y - 6], 85.2, P), { tone: 'faint' }))
    out.push(
      k.faceTextSvg(k.topMatrix([x, y], 85.7, P), parcel === 'request' ? 'GET' : '200', { size: 3.4, tone: 'hi', anchor: 'middle' }),
    )
  } else if (parcel === 'data') {
    out.push(S(k.slabOf({ x: x - 13, y: y - 8, w: 26, d: 16, r: 2 }, 83, 13, P, 3, 1), { tone: 'mid', lit: hot }))
    out.push(S(k.slabOf({ x: x - 9, y: y - 5, w: 18, d: 10, r: 1 }, 96, 1, P, 2), { tone: 'hi', flat: true }))
    out.push(L(k.lineOnTop([x - 9, y - 8], [x - 9, y + 8], 96.2, P), { tone: 'faint' }))
    out.push(L(k.lineOnTop([x + 9, y - 8], [x + 9, y + 8], 96.2, P), { tone: 'faint' }))
    out.push(k.faceTextSvg(k.topMatrix([x, y], 97.5, P), '1 Mbit', { size: 3.4, tone: 'hi', anchor: 'middle' }))
  }
  return out
}

export default function HttpTimeFigure() {
  const frozen = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('t')
  const [modeIndex, setModeIndex] = useState(0)
  const [running, setRunning] = useState(!prefersStillness() && !frozen)
  const [t, setT] = usePlayClock(running, initialTime())
  const mode = MODES[modeIndex]!
  const total = mode.total
  const progress = Math.min((t % 6) / 5, 1)
  const m = progress * total
  const frame = timeline(m, mode.key === 'persistent')

  const svg = useMemo(() => {
    const out: string[] = []
    out.push(S(k.slabOf(GROUND, -8, 8, P, 10, 1), { tone: 'lo' }))
    // 两张办公桌
    out.push(...desk(CLIENT_X, -1))
    out.push(...desk(SERVER_X, 1))

    // 轨道立柱与托架
    for (const cx of [CLIENT_X + INNER, SERVER_X - INNER]) {
      out.push(S(k.cylinder(cx, 0, 3.4, 49, 21, P, 14), { tone: 'mid' }))
      out.push(S(k.cylinder(cx, 0, 5, 48, 2, P, 14), { tone: 'hi' }))
      out.push(S(k.slabOf({ x: cx - 8, y: -23, w: 16, d: 46, r: 2 }, 68, 4, P, 3), { tone: 'mid' }))
    }
    // 枕木 + 双轨
    for (let x = -130; x <= 130; x += 22) {
      out.push(S(k.slabOf({ x: x - 2, y: -21, w: 4, d: 42, r: 1 }, 70, 2.2, P, 2), { tone: 'lo' }))
    }
    for (const y of [LANE_CTRL, LANE_DATA]) {
      out.push(S(k.slabOf({ x: -134, y: y - 2.6, w: 268, d: 5.2, r: 2 }, TRACK_Z, 3, P, 4), { tone: 'mid' }))
      out.push(L(k.lineOnTop([-132, y], [132, y], TRACK_Z + 3.1, P), { tone: 'faint' }))
    }
    for (const x of [-136, 136]) {
      out.push(S(k.slabOf({ x: x - 2, y: -26, w: 4, d: 52, r: 2 }, 70, 6, P, 3, 0.6), { tone: 'mid' }))
    }

    // 数据小车（货运）
    out.push(...carriage(frame.dataX, LANE_DATA, frame.dataHot))
    out.push(...cargo(frame.dataX, LANE_DATA, 'data', frame.dataHot))
    // 控制小车（消息）
    out.push(...carriage(frame.ctrlX, LANE_CTRL, frame.parcel !== null))
    out.push(...cargo(frame.ctrlX, LANE_CTRL, frame.parcel, frame.parcel !== null))

    const c = at([CLIENT_X, 48, 1])
    out.push(`<text class="iso-face-text" data-tone="hi" x="${c[0]}" y="${c[1]}" font-size="10" text-anchor="middle">客户端</text>`)
    const s = at([SERVER_X, 48, 1])
    out.push(`<text class="iso-face-text" data-tone="hi" x="${s[0]}" y="${s[1]}" font-size="10" text-anchor="middle">服务器</text>`)
    return out.join('')
  }, [frame])

  return (
    <FigureCard
      fig="图 11 · HTTP 响应时间 2RTT+T"
      title="一辆消息小车跑两个来回，货运小车再运一箱数据"
      subtitle="两张办公桌 = 客户端与服务器；上层轻轨跑请求/响应，下层轨道运文件。RTT = 100 ms，T = L/R = 100 ms。"
      readout={
        <>
          t = {Math.round(m)} / {total} ms · 阶段 {frame.stageNo}/{frame.stageCount} · {frame.stage} · {frame.detail}
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
          value={modeIndex}
          onChange={(e) => {
            setModeIndex(Number(e.target.value))
            setT(0)
          }}
          aria-label="选择连接方式"
        >
          {MODES.map((item, index) => (
            <option key={item.key} value={index}>
              {item.label}
            </option>
          ))}
        </select>
      }
      caption={
        <>
          取一个对象：<strong>2RTT + T</strong> = 100 + 100 + 100 = <strong>300 ms</strong>。持久连接复用已建连接时省去第一次握手，
          后续对象降为 <strong>1RTT + T = 200 ms</strong>。其中 T = L/R = 1 Mbit ÷ 10 Mbps = 100 ms。
        </>
      }
    >
      <Scene width={W} height={H} label="HTTP 响应时间 2RTT 加传输时间：两台办公桌与轨道小车" svg={svg} />
    </FigureCard>
  )
}
