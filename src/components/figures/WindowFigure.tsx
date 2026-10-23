// ============================================================
// 图解：GBN 后退 N 帧（k3.4.6）
// 示例窗口 N = 4，序号 0–7；分组 2 丢失后演示累积 ACK 与整窗重传
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 880
const H = 300
const SLOTS = 8
const N = 4
const BELT = { x: -124, y: -30, w: 300, d: 60, r: 6 }
const STEP = 35
const SLOT_X = (i: number) => -104 + i * STEP

const P = k.fitProjection(
  [...k.boxCorners(BELT, -8, 0), [-150, 0, 62], [160, 0, 62]],
  W,
  H,
  { pad: 14, azimuth: 30, elevation: 38 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)

type Snap = {
  base: number
  next: number
  acked: number[]
  inFlight: number[]
  lost: number[]
  ack: number
  note: string
}

const SNAPS: Snap[] = [
  {
    base: 0,
    next: 4,
    acked: [],
    inFlight: [0, 1, 2, 3],
    lost: [],
    ack: 0,
    note: '发送窗口 [0,3]：一次性发出 4 个分组，接收方尚未确认。',
  },
  {
    base: 2,
    next: 6,
    acked: [0, 1],
    inFlight: [2, 3, 4, 5],
    lost: [],
    ack: 2,
    note: '收到 ACK1（累积确认 0、1）→ base=2，窗口滑到 [2,5]，继续发送 4、5。',
  },
  {
    base: 2,
    next: 6,
    acked: [0, 1],
    inFlight: [3, 4, 5],
    lost: [2],
    ack: 2,
    note: '分组 2 丢失；3、4、5 乱序到达，接收方一律丢弃，重复回 ACK1。',
  },
  {
    base: 2,
    next: 6,
    acked: [0, 1],
    inFlight: [],
    lost: [2],
    ack: 2,
    note: 'base=2 的定时器超时 → GBN 把窗口内所有未确认分组 2、3、4、5 全部重传。',
  },
  {
    base: 6,
    next: 7,
    acked: [0, 1, 2, 3, 4, 5],
    inFlight: [6],
    lost: [],
    ack: 6,
    note: '重传后全部按序到达，ACK5 使 base=6，窗口滑到 [6,9]，发送 6。',
  },
  {
    base: 6,
    next: 7,
    acked: [0, 1, 2, 3, 4, 5],
    inFlight: [6],
    lost: [],
    ack: 6,
    note: '代价：只丢了 1 个分组，却重传了 4 个——这就是 GBN 的“重传放大”。',
  },
]

function slotState(i: number, s: Snap): 'acked' | 'lost' | 'flight' | 'unsent' | 'waiting' {
  if (s.lost.includes(i)) return 'lost'
  if (s.acked.includes(i)) return 'acked'
  if (s.inFlight.includes(i)) return 'flight'
  if (i >= s.base && i < s.base + N) return 'waiting'
  return 'unsent'
}

export default function WindowFigure() {
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const index = Math.floor((t % 15) / 2.5) % SNAPS.length
  const snap = SNAPS[index]

  const svg = useMemo(() => {
    const out: string[] = []
    out.push(S(k.slabOf(BELT, -8, 8, P, 8, 1), { tone: 'lo' }))
    // 传送带条纹
    for (let x = BELT.x + 10; x < BELT.x + BELT.w - 6; x += 14) {
      out.push(L(k.lineOnTop([x, BELT.y + 4], [x, BELT.y + BELT.d - 4], 0.9, P), { tone: 'faint' }))
    }
    // 两端设备
    for (const [x, name] of [
      [-146, '发送方'],
      [156, '接收方'],
    ] as const) {
      out.push(S(k.slabOf({ x: x - 12, y: -24, w: 24, d: 48, r: 2 }, 0, 30, P, 4, 0.8), { tone: 'mid' }))
      out.push(S(k.cylinder(x, 6, 3, 30, 8, P, 18), { tone: 'mid' }))
      const p = at([x, -30, 40])
      out.push(`<text class="iso-face-text" data-tone="hi" x="${p[0]}" y="${p[1]}" font-size="10" text-anchor="middle">${name}</text>`)
    }

    // 8 个分组
    for (let i = 0; i < SLOTS; i++) {
      const state = slotState(i, snap)
      const tone = state === 'acked' ? 'hi' : state === 'lost' ? 'mid' : state === 'flight' ? 'hi' : 'mid'
      const lit = state === 'flight' || state === 'lost'
      const x = SLOT_X(i)
      out.push(S(k.slabOf({ x: x - 10, y: -13, w: 20, d: 26, r: 2 }, 0, state === 'lost' ? 3 : 7, P, 3, 0.6), { tone, lit }))
      // 顶部状态色条
      const lineTone =
        state === 'acked' ? 'green' : state === 'lost' ? 'red' : state === 'flight' ? 'blue' : 'faint'
      out.push(L(k.lineOnTop([x - 7, 0], [x + 7, 0], state === 'lost' ? 3.6 : 7.6, P), { tone: lineTone }))
      const p = at([x, -20, 2])
      out.push(`<text class="iso-face-text" data-tone="hi" x="${p[0]}" y="${p[1]}" font-size="10" text-anchor="middle">${i}</text>`)
      if (state === 'lost') {
        const q = at([x, 0, 18])
        out.push(`<text class="iso-face-text" data-tone="red" x="${q[0]}" y="${q[1]}" font-size="10" text-anchor="middle">丢失</text>`)
      }
    }

    // 发送窗口框
    const left = SLOT_X(snap.base) - 15
    const right = SLOT_X(Math.min(snap.base + N - 1, SLOTS - 1)) + 15
    const z = 14
    out.push(
      L(
        [
          `M${at([left, -18, z])[0]},${at([left, -18, z])[1]}`,
          `L${at([right, -18, z])[0]},${at([right, -18, z])[1]}`,
          `L${at([right, 18, z])[0]},${at([right, 18, z])[1]}`,
          `L${at([left, 18, z])[0]},${at([left, 18, z])[1]}Z`,
        ].join(''),
        { tone: 'lit' },
      ),
    )
    const wl = at([left, -20, z + 6])
    out.push(
      `<text class="iso-face-text" data-tone="hi" x="${wl[0]}" y="${wl[1]}" font-size="10">窗口 [${snap.base}, ${snap.base + N - 1}]</text>`,
    )
    return out.join('')
  }, [snap])

  return (
    <FigureCard
      fig="图 3 · GBN 滑动窗口"
      title="一个分组丢失，整个窗口重传"
      subtitle="示例窗口 N = 4，序号 0–7。绿=已确认，蓝=在途，红=丢失；白框是发送窗口。"
      readout={
        <>
          base = {snap.base} · nextseqnum = {snap.next} · 收到的 ACK = {snap.ack} · 事件 {index + 1}/{SNAPS.length}
        </>
      }
      running={running}
      onToggle={() => setRunning((r) => !r)}
      onReset={() => {
        setT(0)
        setRunning(false)
      }}
      extra={
        <button
          className="btn-outline"
          onClick={() => {
            setRunning(false)
            setT((x) => ((Math.floor((x % 15) / 2.5) + 1) % SNAPS.length) * 2.5 + 0.05)
          }}
        >
          下一步 →
        </button>
      }
      caption={snap.note}
    >
      <Scene width={W} height={H} label="GBN 滑动窗口与重传" svg={svg} />
    </FigureCard>
  )
}
