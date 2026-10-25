// ============================================================
// 图解：拥塞窗口机制全貌（k3.7.2 / 图 21）
// 控制台：粗管道 + 可开合阀门（cwnd）；仪表盘读数；纸带记录仪
// 数值与正文一致：初始 cwnd = 1 MSS、ssthresh = 20 MSS
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 820
const H = 440
const LAST = 22
const CYCLE = 24

type Phase = 'slow-start' | 'ca' | 'fast-recovery'

const PHASE_LABEL: Record<Phase, string> = {
  'slow-start': '慢启动',
  ca: '拥塞避免',
  'fast-recovery': '快恢复',
}

const INK: Record<Phase, string> = {
  'slow-start': '#2c4f8c',
  ca: '#2f6b4f',
  'fast-recovery': '#a15a1e',
}

interface Step {
  rtt: number
  cwnd: number
  ssthresh: number
  phase: Phase
  event?: string
}

// 教学模型（正文例题）：1→2→4→8→16→32 翻倍越过 ssthresh=20；
// RTT 10 三个重复 ACK；RTT 17 超时回到 1。
const STEPS: Step[] = [
  { rtt: 0, cwnd: 1, ssthresh: 20, phase: 'slow-start' },
  { rtt: 1, cwnd: 2, ssthresh: 20, phase: 'slow-start' },
  { rtt: 2, cwnd: 4, ssthresh: 20, phase: 'slow-start' },
  { rtt: 3, cwnd: 8, ssthresh: 20, phase: 'slow-start' },
  { rtt: 4, cwnd: 16, ssthresh: 20, phase: 'slow-start' },
  { rtt: 5, cwnd: 32, ssthresh: 20, phase: 'ca', event: '转入拥塞避免' },
  { rtt: 6, cwnd: 33, ssthresh: 20, phase: 'ca' },
  { rtt: 7, cwnd: 34, ssthresh: 20, phase: 'ca' },
  { rtt: 8, cwnd: 35, ssthresh: 20, phase: 'ca' },
  { rtt: 9, cwnd: 36, ssthresh: 20, phase: 'ca' },
  {
    rtt: 10,
    cwnd: 21,
    ssthresh: 18,
    phase: 'fast-recovery',
    event: '3 个重复 ACK',
  },
  { rtt: 11, cwnd: 22, ssthresh: 18, phase: 'fast-recovery', event: '快恢复：重复 ACK' },
  { rtt: 12, cwnd: 18, ssthresh: 18, phase: 'ca', event: '新 ACK，退出快恢复' },
  { rtt: 13, cwnd: 19, ssthresh: 18, phase: 'ca' },
  { rtt: 14, cwnd: 20, ssthresh: 18, phase: 'ca' },
  { rtt: 15, cwnd: 21, ssthresh: 18, phase: 'ca' },
  { rtt: 16, cwnd: 22, ssthresh: 18, phase: 'ca' },
  {
    rtt: 17,
    cwnd: 1,
    ssthresh: 11,
    phase: 'slow-start',
    event: '超时，cwnd 回到 1',
  },
  { rtt: 18, cwnd: 2, ssthresh: 11, phase: 'slow-start' },
  { rtt: 19, cwnd: 4, ssthresh: 11, phase: 'slow-start' },
  { rtt: 20, cwnd: 8, ssthresh: 11, phase: 'slow-start' },
  { rtt: 21, cwnd: 16, ssthresh: 11, phase: 'ca', event: '再次转入拥塞避免' },
  { rtt: 22, cwnd: 17, ssthresh: 11, phase: 'ca' },
]

const TOP_Z = 16.5
const BASE = { x: -170, y: -80, w: 340, d: 160, r: 10 }
const CABINET = { x: -160, y: -72, w: 320, d: 144, r: 8 }
const DECK = { x: -152, y: -64, w: 304, d: 128, r: 6 }
const PLATEN = { x: -158, y: -2, w: 316, d: 78, r: 5 }
const PAPER = { x: -136, y: 4, w: 272, d: 68, r: 2 }
const INK_Z = 21.35
const DIAL = { cx: -100, cy: -38 }
const PIPE = { cx: 100, cy: -34, r: 18 }
const PORT = { x: 125.6, y: -34, z: 73, r: 12.5 }

const P = k.fitProjection(
  [
    ...k.boxCorners(BASE, -26, 0),
    [-168, 0, 0],
    [168, 0, 0],
    [PIPE.cx, PIPE.cy, 118],
    [DIAL.cx, DIAL.cy, 82],
    [DIAL.cx, DIAL.cy - 36, 74],
    [-142, 38, 36],
    [142, 38, 36],
    [0, 38, 44],
  ],
  W,
  H,
  { pad: 14, azimuth: 38, elevation: 35 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)

const px = (rtt: number) => -120 + (rtt / LAST) * 240
const py = (value: number) => 67 - (value / 40) * 57
const pp = (rtt: number, value: number) => at([px(rtt), py(value), INK_Z])

function T(
  p: k.Flat,
  text: string,
  size = 9,
  fill = 'var(--anatomy-hi)',
  anchor: 'start' | 'middle' | 'end' = 'middle',
  dy = 0,
) {
  return `<text x="${p[0].toFixed(1)}" y="${(p[1] + dy).toFixed(1)}" font-size="${size}" text-anchor="${anchor}" fill="${fill}" font-family="ui-monospace, Menlo, monospace">${text}</text>`
}

function ink(d: string, color: string, width = 2.2, opacity = 1, dash?: string) {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"${
    opacity < 1 ? ` opacity="${opacity}"` : ''
  }${dash ? ` stroke-dasharray="${dash}"` : ''}/>`
}

function paperShape(rtt: number, value: number, radius: number, fill: string, opacity = 1) {
  const cx = px(rtt)
  const cy = py(value)
  const pts = Array.from({ length: 18 }, (_, i) => {
    const a = (i / 18) * Math.PI * 2
    return at([cx + radius * Math.cos(a), cy + radius * Math.sin(a), INK_Z])
  })
  return `<path d="${k.pathOf(pts, true)}" fill="${fill}"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`
}

function paperRing(rtt: number, value: number, radius: number, color: string, width = 1.3) {
  const cx = px(rtt)
  const cy = py(value)
  const pts = Array.from({ length: 22 }, (_, i) => {
    const a = (i / 22) * Math.PI * 2
    return at([cx + radius * Math.cos(a), cy + radius * Math.sin(a), INK_Z])
  })
  return ink(k.pathOf(pts, true), color, width)
}

const dirOf = (angle: number): k.Plane => [Math.sin(angle), -Math.cos(angle)]
const dialAngle = (value: number) => ((-135 + (value / 40) * 270) * Math.PI) / 180

export default function CwndFigure() {
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())

  const cursor = Math.min(LAST, t % CYCLE)
  const index = Math.min(LAST, Math.max(0, Math.floor(cursor)))
  const frac = Math.min(1, cursor - index)
  const step = STEPS[index]!
  const nextStep = STEPS[Math.min(LAST, index + 1)]!

  // 平滑驱动阀门/指针；读数仍按整数 RTT 对齐，保证数字与正文一致
  const cwndAt = index >= LAST ? step.cwnd : step.cwnd + (nextStep.cwnd - step.cwnd) * frac
  const opening = Math.max(0.02, Math.min(1, cwndAt / 40))

  const svg = useMemo(() => {
    const out: string[] = []

    // ---------------- 底座与机柜 ----------------
    for (const [fx, fy] of [
      [-148, -60],
      [148, -60],
      [-148, 60],
      [148, 60],
    ]) {
      out.push(S(k.cylinder(fx, fy, 6, -22, 10, P, 16), { tone: 'lo' }))
    }
    out.push(S(k.slabOf(BASE, -12, 12, P, 10, 1.2), { tone: 'lo', halo: true }))
    out.push(S(k.slabOf(CABINET, 0, 12, P, 8, 1), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -158, y: -70, w: 316, d: 140, r: 7 }, 12, 1.4, P, 6, 0.5), { tone: 'lo' }))
    out.push(S(k.slabOf(DECK, 13.4, 3.1, P, 6, 0.6), { tone: 'hi' }))
    // 侧面散热槽
    for (let i = 0; i < 5; i++) {
      const z = 3.2 + i * 1.7
      out.push(L(k.segment([160.1, -40, z], [160.1, 40, z], P), { tone: 'faint' }))
    }
    // 台面角落螺钉
    out.push(
      k.dotsSvg(
        [
          at([-145, -57, TOP_Z + 0.1]),
          at([145, -57, TOP_Z + 0.1]),
          at([-145, 57, TOP_Z + 0.1]),
          at([145, 57, TOP_Z + 0.1]),
        ],
        { size: 0.7, tone: 'lo' },
      ),
    )
    // 中部铭牌（三条刻线 + 螺钉）
    out.push(S(k.slabOf({ x: -45, y: -48, w: 64, d: 17, r: 2 }, TOP_Z, 1.4, P, 4, 0.3), { tone: 'mid' }))
    for (const y of [-44, -40, -36]) {
      out.push(L(k.lineOnTop([-39, y], [13, y], TOP_Z + 1.5, P), { tone: 'faint' }))
    }
    out.push(k.dotsSvg([at([-41, -45, TOP_Z + 1.5]), at([11, -45, TOP_Z + 1.5])], { size: 0.5, tone: 'lo' }))

    // ---------------- 仪表盘（cwnd） ----------------
    out.push(S(k.cylinder(DIAL.cx, DIAL.cy, 15, TOP_Z, 4, P, 26, 0.4), { tone: 'mid' }))
    out.push(S(k.cylinder(DIAL.cx, DIAL.cy, 5.5, TOP_Z + 4, 44, P, 16), { tone: 'mid' }))
    out.push(S(k.cylinder(DIAL.cx, DIAL.cy, 20, TOP_Z + 46, 2.6, P, 30), { tone: 'lo' }))
    out.push(S(k.cylinder(DIAL.cx, DIAL.cy, 36, 64, 7, P, 44, 0.9), { tone: 'mid' }))
    out.push(S(k.cylinder(DIAL.cx, DIAL.cy, 32, 71, 1.8, P, 44), { tone: 'hi', lit: true }))
    // 刻度：0–40 MSS，每 10 格一根主刻度
    const ticks = k.radialTicks(DIAL.cx, DIAL.cy, 30, 40, 10, 73.1, [2.6, 4.8], P, dialAngle(0), (270 * Math.PI) / 180)
    out.push(L(ticks.minor, { tone: 'lo' }))
    out.push(L(ticks.major, { tone: 'hi' }))
    for (const value of [0, 10, 20, 30, 40]) {
      const a = dialAngle(value)
      const [dx, dy] = dirOf(a)
      out.push(
        T(at([DIAL.cx + dx * 22, DIAL.cy + dy * 22, 73.4]), String(value), 8, 'var(--anatomy-hi)'),
      )
    }
    // 指针
    const na = dialAngle(cwndAt)
    const [nx, ny] = dirOf(na)
    const [pxp, pyp] = [-ny, nx]
    const needleRing: k.Plane[] = [
      [DIAL.cx + nx * 27, DIAL.cy + ny * 27],
      [DIAL.cx - nx * 2 + pxp * 2.6, DIAL.cy - ny * 2 + pyp * 2.6],
      [DIAL.cx - nx * 2 - pxp * 2.6, DIAL.cy - ny * 2 - pyp * 2.6],
    ]
    out.push(S(k.extrude(needleRing, 73.2, 2.1, P), { tone: 'hi', lit: true }))
    out.push(S(k.cylinder(DIAL.cx, DIAL.cy, 4.8, 73.2, 2.8, P, 18), { tone: 'hi', lit: true }))
    // ssthresh 红色游标
    const sa = dialAngle(step.ssthresh)
    const [sx, sy] = dirOf(sa)
    const [tx, ty] = [-sy, sx]
    const marker: k.Plane[] = [
      [DIAL.cx + sx * 26.5, DIAL.cy + sy * 26.5],
      [DIAL.cx + sx * 32.5 + tx * 2.8, DIAL.cy + sy * 32.5 + ty * 2.8],
      [DIAL.cx + sx * 32.5 - tx * 2.8, DIAL.cy + sy * 32.5 - ty * 2.8],
    ]
    const markerSolid = k.extrude(marker, 72.9, 1.6, P)
    out.push(`<path d="${markerSolid.fill}" fill="#c0392b" stroke="#7f241b" stroke-width="0.5"/>`)
    out.push(T(at([DIAL.cx, DIAL.cy + 12, 73.5]), 'cwnd', 10, 'var(--anatomy-hi)'))

    // ---------------- 粗管道与阀门 ----------------
    out.push(S(k.cylinder(PIPE.cx, PIPE.cy, 26, TOP_Z, 6, P, 34, 0.7), { tone: 'mid' }))
    out.push(
      k.dotsSvg(
        [0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2 + Math.PI / 6
          return at([PIPE.cx + Math.cos(a) * 21, PIPE.cy + Math.sin(a) * 21, TOP_Z + 6.1])
        }),
        { size: 0.55, tone: 'lo' },
      ),
    )
    out.push(S(k.cylinder(PIPE.cx, PIPE.cy, PIPE.r, TOP_Z + 6, 36, P, 38), { tone: 'mid' }))
    out.push(S(k.cylinder(PIPE.cx, PIPE.cy, 22, 34, 3, P, 34), { tone: 'hi' }))
    // 圆形阀体
    out.push(S(k.cylinder(PIPE.cx, PIPE.cy, 29, 55, 4, P, 38, 0.5), { tone: 'hi' }))
    out.push(S(k.cylinder(PIPE.cx, PIPE.cy, 26, 59, 29, P, 38), { tone: 'mid' }))
    out.push(L(k.ring(PIPE.cx, PIPE.cy, 26, 66, P, 38), { tone: 'faint' }))
    out.push(L(k.ring(PIPE.cx, PIPE.cy, 26, 81, P, 38), { tone: 'faint' }))
    out.push(S(k.cylinder(PIPE.cx, PIPE.cy, 29, 88, 4, P, 38, 0.5), { tone: 'hi' }))
    out.push(S(k.cylinder(PIPE.cx, PIPE.cy, 19, 92, 2.5, P, 28), { tone: 'mid' }))
    out.push(
      k.dotsSvg(
        [0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const a = (i / 8) * Math.PI * 2
          return at([PIPE.cx + Math.cos(a) * 24, PIPE.cy + Math.sin(a) * 24, 92.1])
        }),
        { size: 0.5, tone: 'lo' },
      ),
    )
    // 阀杆与手轮（开度改变高度与转角）
    const stemTop = 102 + opening * 6
    out.push(S(k.cylinder(PIPE.cx, PIPE.cy, 6.5, 94.5, 4.5, P, 20), { tone: 'lo' }))
    out.push(S(k.cylinder(PIPE.cx, PIPE.cy, 2.6, 99, stemTop - 99, P, 16), { tone: 'hi' }))
    out.push(S(k.cylinder(PIPE.cx, PIPE.cy, 15, stemTop, 3, P, 34, 0.5), { tone: 'mid' }))
    out.push(S(k.cylinder(PIPE.cx, PIPE.cy, 5, stemTop + 3, 3.4, P, 18), { tone: 'hi', lit: true }))
    const wheelAngle = opening * 1.5
    for (let i = 0; i < 4; i++) {
      const a = wheelAngle + (i * Math.PI) / 2
      const ux = Math.cos(a)
      const uy = Math.sin(a)
      const vx = -uy
      const vy = ux
      const ring: k.Plane[] = [
        [PIPE.cx + ux * 11.5 + vx * 1.5, PIPE.cy + uy * 11.5 + vy * 1.5],
        [PIPE.cx + ux * 11.5 - vx * 1.5, PIPE.cy + uy * 11.5 - vy * 1.5],
        [PIPE.cx - ux * 3 - vx * 1.5, PIPE.cy - uy * 3 - vy * 1.5],
        [PIPE.cx - ux * 3 + vx * 1.5, PIPE.cy - uy * 3 + vy * 1.5],
      ]
      out.push(S(k.extrude(ring, stemTop + 3.1, 0.9, P), { tone: 'mid' }))
    }
    const wheelTicks = k.radialTicks(PIPE.cx, PIPE.cy, 14.4, 24, 6, stemTop + 3.05, [1.3, 2.4], P)
    out.push(L(wheelTicks.minor, { tone: 'faint' }))
    out.push(L(wheelTicks.major, { tone: 'mid' }))

    // 阀体视窗（+x 面）——夹口开度 = cwnd
    const portPts = (radius: number) =>
      Array.from({ length: 30 }, (_, i) => {
        const a = (i / 30) * Math.PI * 2
        return at([PORT.x, PORT.y + radius * Math.cos(a), PORT.z + radius * Math.sin(a)])
      })
    out.push(`<defs><clipPath id="cwnd-port"><path d="${k.pathOf(portPts(PORT.r), true)}"/></clipPath></defs>`)
    out.push(`<path d="${k.pathOf(portPts(PORT.r), true)}" fill="#10151a" stroke="none"/>`)
    const gap = PORT.r * 2 * opening * 0.92
    const jaw = (z0: number, z1: number) =>
      k.pathOf(
        [
          at([PORT.x - 0.7, PORT.y - 10.5, z0]),
          at([PORT.x - 0.7, PORT.y + 10.5, z0]),
          at([PORT.x - 0.7, PORT.y + 10.5, z1]),
          at([PORT.x - 0.7, PORT.y - 10.5, z1]),
        ],
        true,
      )
    out.push(
      `<g clip-path="url(#cwnd-port)"><path d="${jaw(PORT.z - PORT.r - 2, PORT.z - gap / 2)}" fill="#8794a1"/><path d="${jaw(
        PORT.z + gap / 2,
        PORT.z + PORT.r + 2,
      )}" fill="#8794a1"/><path d="${jaw(PORT.z - gap / 2 - 0.9, PORT.z - gap / 2)}" fill="#c9d2da"/><path d="${jaw(
        PORT.z + gap / 2,
        PORT.z + gap / 2 + 0.9,
      )}" fill="#c9d2da"/><path d="${k.pathOf([
        at([PORT.x - 0.9, PORT.y - 2.4, PORT.z + gap / 2]),
        at([PORT.x - 0.9, PORT.y + 2.4, PORT.z + gap / 2]),
        at([PORT.x - 0.9, PORT.y + 2.4, PORT.z + PORT.r + 2]),
        at([PORT.x - 0.9, PORT.y - 2.4, PORT.z + PORT.r + 2]),
      ], true)}" fill="#6d7986"/></g>`,
    )
    out.push(`<path d="${k.pathOf(portPts(PORT.r), true)}" fill="rgba(140,190,220,0.10)" stroke="none"/>`)
    out.push(L(k.pathOf(portPts(PORT.r), true), { tone: 'hi' }))
    out.push(L(k.pathOf(portPts(PORT.r + 3.2), true), { tone: 'lo' }))
    const glint: k.Flat[] = []
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * 0.75 + (i / 8) * Math.PI * 0.55
      glint.push(at([PORT.x + 0.15, PORT.y + Math.cos(a) * 8.4, PORT.z + Math.sin(a) * 8.4]))
    }
    out.push(ink(k.pathOf(glint), 'rgba(220,240,255,0.45)', 1.1))
    out.push(
      k.dotsSvg(
        Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2
          return at([PORT.x + 0.2, PORT.y + Math.cos(a) * 17, PORT.z + Math.sin(a) * 17])
        }),
        { size: 0.5, tone: 'lo' },
      ),
    )

    // ---------------- 记录仪：滚筒、纸带、龙门笔架 ----------------
    out.push(S(k.slabOf(PLATEN, 16.5, 3.5, P, 5, 0.7), { tone: 'mid' }))
    const paperVars =
      '--anatomy-paper:#e8e0cc;--anatomy-face:#efe8d6;--anatomy-top:#f5efdd;--anatomy-shade-0:#cfc5aa;--anatomy-shade-1:#d8cfb7;--anatomy-shade-2:#e0d8c2;--anatomy-shade-3:#e8dfcc'
    out.push(`<g style="${paperVars}">`)
    out.push(S(k.slabOf(PAPER, 20, 1.2, P, 3, 0.25), { tone: 'hi' }))
    out.push(`</g>`)
    out.push(L(k.planOutline(PAPER, 21.25, P, 3), { tone: 'faint' }))

    // 网格与刻度
    for (const value of [0, 10, 20, 30, 40]) {
      out.push(ink(k.pathOf([pp(0, value), pp(LAST, value)]), 'rgba(92,80,60,0.30)', 0.7))
      out.push(T(at([-127, py(value), INK_Z]), String(value), 8.5, '#6b6152', 'end', 3))
    }
    for (const rtt of [0, 5, 10, 15, 20]) {
      out.push(ink(k.pathOf([pp(rtt, 0), pp(rtt, 40)]), 'rgba(92,80,60,0.22)', 0.7))
      out.push(T(at([px(rtt), 70.6, INK_Z]), String(rtt), 8.5, '#6b6152', 'middle'))
    }

    // ssthresh 阶梯（红墨虚线）
    let sPath = ''
    let prevS = STEPS[0]!.ssthresh
    for (let i = 1; i <= index; i++) {
      const s = STEPS[i]!.ssthresh
      sPath += `M${pp(i - 1, prevS)[0]},${pp(i - 1, prevS)[1]}L${pp(i, prevS)[0]},${pp(i, prevS)[1]}`
      if (s !== prevS) sPath += `M${pp(i, prevS)[0]},${pp(i, prevS)[1]}L${pp(i, s)[0]},${pp(i, s)[1]}`
      prevS = s
    }
    sPath += `M${pp(index, prevS)[0]},${pp(index, prevS)[1]}L${pp(cursor, prevS)[0]},${pp(cursor, prevS)[1]}`
    out.push(ink(sPath, '#a23b2f', 1.6, 0.95, '4 3'))

    // cwnd 墨迹：整段 + 当前笔尖的半段
    for (let i = 0; i < index; i++) {
      const a = STEPS[i]!
      const b = STEPS[i + 1]!
      const color = INK[b.phase]
      const d = k.pathOf([pp(a.rtt, a.cwnd), pp(b.rtt, b.cwnd)])
      out.push(ink(d, color, 6, 0.15))
      out.push(ink(d, color, 2.6))
    }
    if (index < LAST && frac > 0) {
      const b = STEPS[index + 1]!
      const d = k.pathOf([pp(index, step.cwnd), pp(index + frac, cwndAt)])
      out.push(ink(d, INK[b.phase], 6, 0.15))
      out.push(ink(d, INK[b.phase], 2.6))
    }
    for (let i = 0; i <= index; i++) {
      const s = STEPS[i]!
      out.push(paperShape(s.rtt, s.cwnd, 1, INK[s.phase], 0.9))
    }
    out.push(paperShape(cursor, cwndAt, 2.3, INK[step.phase]))

    // 事件记号：到达该 RTT 才在纸带上落墨
    if (index >= 10) out.push(paperRing(10, 36, 3.4, '#a23b2f', 1.5))
    if (index >= 17) {
      out.push(ink(k.pathOf([pp(17, 20.2), pp(17, 23.8)]), '#a23b2f', 1.8))
      out.push(ink(k.pathOf([pp(16.5, 22), pp(17.5, 22)]), '#a23b2f', 1.8))
    }

    // 左右纸卷（立式滚筒）
    for (const [x, drum] of [
      [-142, 9.5],
      [142, 11],
    ] as const) {
      out.push(S(k.cylinder(x, 38, 13.5, 20, 2, P, 28), { tone: 'mid' }))
      out.push(`<g style="${paperVars}">`)
      out.push(S(k.cylinder(x, 38, drum, 22, 9.5, P, 32), { tone: 'hi' }))
      out.push(`</g>`)
      for (const z of [24, 27, 30]) {
        out.push(L(k.ring(x, 38, drum + 0.1, z, P, 28), { tone: 'faint' }))
      }
      out.push(S(k.cylinder(x, 38, 13.5, 31.5, 2, P, 28), { tone: 'mid' }))
      out.push(S(k.cylinder(x, 38, 4, 33.5, 3, P, 16), { tone: 'hi' }))
    }

    // 龙门轨道与立柱
    for (const y of [0, 76]) {
      out.push(S(k.slabOf({ x: -124, y: y - 1.6, w: 248, d: 3.2, r: 1.4 }, 26, 2, P, 3, 0.3), { tone: 'mid' }))
      for (const x of [-120, 120]) {
        out.push(S(k.cylinder(x, y, 2.8, 20, 6, P, 14), { tone: 'lo' }))
        out.push(S(k.slabOf({ x: x - 3, y: y - 3, w: 6, d: 6, r: 1 }, 26, 1.3, P, 3), { tone: 'hi' }))
      }
    }
    // 可移动龙门笔架
    const gx = Math.max(-118, Math.min(118, px(cursor)))
    for (const y of [0, 76]) {
      out.push(S(k.slabOf({ x: gx - 2.2, y: y - 2.2, w: 4.4, d: 4.4, r: 1 }, 28, 10, P, 3, 0.4), { tone: 'hi' }))
      out.push(S(k.cylinder(gx, y, 2.4, 29, 1.4, P, 14), { tone: 'lo' }))
    }
    out.push(S(k.slabOf({ x: gx - 2.4, y: 0, w: 4.8, d: 76, r: 1.4 }, 38, 3, P, 3, 0.4), { tone: 'hi', lit: true }))
    out.push(S(k.slabOf({ x: gx - 2.8, y: 34.5, w: 5.6, d: 7, r: 1.2 }, 33, 5, P, 3, 0.4), { tone: 'mid' }))
    out.push(S(k.cylinder(gx, 38, 1.7, 22.4, 11, P, 14), { tone: 'lo' }))
    out.push(
      `<g style="--anatomy-paper:${INK[step.phase]};--anatomy-face:${INK[step.phase]};--anatomy-top:${
        INK[step.phase]
      };--anatomy-shade-0:${INK[step.phase]};--anatomy-shade-1:${INK[step.phase]};--anatomy-shade-2:${
        INK[step.phase]
      };--anatomy-shade-3:${INK[step.phase]}">${S(k.cylinder(gx, 38, 2.2, 21.3, 2.6, P, 14), { tone: 'hi' })}</g>`,
    )

    return out.join('')
  }, [cursor, index, frac, step, cwndAt, opening])

  return (
    <FigureCard
      fig="图 21 · 拥塞窗口 cwnd"
      title="阀门开度就是拥塞窗口，纸带记下它每次试探"
      subtitle="粗管道上的阀门开度对应 cwnd（在途数据上限）；仪表盘读数，纸带记录每个 RTT 后的窗口大小。"
      readout={
        <>
          RTT {index} · {PHASE_LABEL[step.phase]} · cwnd {step.cwnd} MSS · ssthresh {step.ssthresh} MSS ·{' '}
          {step.event ?? '稳定增长'}
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
            setT((x) => {
              const c = x % CYCLE
              return c >= LAST ? 0 : Math.floor(c) + 1
            })
          }}
        >
          下一步 →
        </button>
      }
      caption={
        <>
          <p>慢启动将 cwnd 每 RTT 翻倍，越过 ssthresh 后转为线性增长。3 个重复 ACK 触发快速重传/恢复；超时会把 cwnd 重置为 1 MSS。</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-brand text-xs font-medium">展开这条教学轨迹的参数与计算</summary>
            <p className="mt-2">初始 cwnd = 1 MSS、ssthresh = 20 MSS：1→2→4→8→16→32 后转入拥塞避免（+1 MSS/RTT）。第 10 个 RTT 收到 3 个重复 ACK：ssthresh = 36/2 = 18，cwnd = 18+3 = 21；第 17 个 RTT 超时：ssthresh = 22/2 = 11，cwnd 回到 1 MSS。纸带红圈标出 3 个重复 ACK，红叉标出超时。</p>
          </details>
        </>
      }
    >
      <Scene width={W} height={H} label="拥塞窗口控制台：阀门、仪表盘与纸带记录仪" svg={svg} />
    </FigureCard>
  )
}
