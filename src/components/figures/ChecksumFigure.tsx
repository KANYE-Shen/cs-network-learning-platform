// ============================================================
// 图解：因特网校验和（k3.3.3）—— 一台有厚度的十六进制加法机
// A = 0xE666，B = 0xD555
// 相加 0x1BBBB → 进位回卷 0xBBBC → 按位取反 0x4443
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 780
const H = 410
const PHASE = 3 // 每个步骤 3 秒

const BASE = { x: -110, y: -76, w: 220, d: 148, r: 10 }
const HOUSING = { x: -72, y: -58, w: 144, d: 116, r: 8 }
const FACE = { x: -64, y: -52, w: 128, d: 104, r: 5 }
const FLOOR = { x: -120, y: -86, w: 240, d: 168, r: 12 }

const ROW_Y = [-36, -12, 12, 36]
const COL_X = [-40.5, -13.5, 13.5, 40.5]
const ROW_NAME = ['A', 'B', '和', '校验和']
const A_DIGITS = 'E666'
const B_DIGITS = 'D555'

const CARRY_PATH: [number, number][] = [
  [-48.5, 12],
  [-64, 12],
  [-76, 4],
  [-86, -12],
  [-86, -60],
  [-55, -69],
  [0, -71],
  [55, -69],
  [86, -60],
  [86, -12],
  [76, 4],
  [64, 12],
  [48.5, 12],
]

const CARRY_LEN: number[] = [0]
for (let i = 1; i < CARRY_PATH.length; i++) {
  const [ax, ay] = CARRY_PATH[i - 1]
  const [bx, by] = CARRY_PATH[i]
  CARRY_LEN.push(CARRY_LEN[i - 1] + Math.hypot(bx - ax, by - ay))
}
const CARRY_TOTAL = CARRY_LEN[CARRY_LEN.length - 1]

function carryAt(u: number): [number, number] {
  const target = Math.max(0, Math.min(1, u)) * CARRY_TOTAL
  let i = 1
  while (i < CARRY_LEN.length - 1 && CARRY_LEN[i] < target) i++
  const span = CARRY_LEN[i] - CARRY_LEN[i - 1] || 1
  const f = (target - CARRY_LEN[i - 1]) / span
  const [ax, ay] = CARRY_PATH[i - 1]
  const [bx, by] = CARRY_PATH[i]
  return [ax + (bx - ax) * f, ay + (by - ay) * f]
}

const P = k.fitProjection(
  [
    ...k.boxCorners(FLOOR, -15, 0),
    [-88, -12, 42],
    [88, -12, 42],
    [0, 0, 44],
  ],
  W,
  H,
  { pad: 14, azimuth: 33, elevation: 38 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)

const AMBER =
  '<g style="--anatomy-paper:#c98a2e;--anatomy-face:#d89a3c;--anatomy-top:#e8ad4f;--anatomy-shade-0:#a96f1d;--anatomy-shade-1:#b97c26;--anatomy-shade-2:#c98a2e;--anatomy-shade-3:#d89a3c">'
const BRASS =
  '<g style="--anatomy-paper:#6f5527;--anatomy-face:#7d5f2c;--anatomy-top:#8f6c33;--anatomy-shade-0:#55401b;--anatomy-shade-1:#5f4920;--anatomy-shade-2:#684f25;--anatomy-shade-3:#75592a">'
const STEEL =
  '<g style="--anatomy-paper:#454d58;--anatomy-face:#4f5864;--anatomy-top:#5c6673;--anatomy-shade-0:#333a43;--anatomy-shade-1:#3a424c;--anatomy-shade-2:#414a54;--anatomy-shade-3:#48515c">'
const IRON =
  '<g style="--anatomy-paper:#343b44;--anatomy-face:#3c444f;--anatomy-top:#464f5a;--anatomy-shade-0:#272d35;--anatomy-shade-1:#2c333b;--anatomy-shade-2:#313941;--anatomy-shade-3:#373f48">'

const smooth = (x: number) => {
  const c = Math.max(0, Math.min(1, x))
  return c * c * (3 - 2 * c)
}

function railBar(a: [number, number], b: [number, number], z: number, height: number, width: number) {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const len = Math.hypot(dx, dy) || 1
  const nx = (-dy / len) * (width / 2)
  const ny = (dx / len) * (width / 2)
  const ring: k.Plane[] = [
    [a[0] + nx, a[1] + ny],
    [b[0] + nx, b[1] + ny],
    [b[0] - nx, b[1] - ny],
    [a[0] - nx, a[1] - ny],
  ]
  return k.extrude(ring, z, height, P, { convex: true })
}

function wheel(cx: number, cy: number, digit: string, active: boolean, angle: number) {
  const out: string[] = []
  out.push(S(k.cylinder(cx, cy, 9.4, 24.6, 2.2, P, 28, 0.5), { tone: 'lo' }))
  out.push(S(k.cylinder(cx, cy, 8.2, 26.8, 5, P, 30, 0.8), { tone: active ? 'hi' : 'lo' }))
  const ticks = k.radialTicks(cx, cy, 8.1, 12, 3, 32, [1.1, 2.2], P)
  out.push(L(ticks.minor, { tone: 'faint' }))
  out.push(L(ticks.major, { tone: 'mid' }))
  const ix = cx + Math.sin(angle) * 5.6
  const iy = cy - Math.cos(angle) * 5.6
  const ox = cx + Math.sin(angle) * 8.1
  const oy = cy - Math.cos(angle) * 8.1
  out.push(L(k.lineOnTop([ix, iy], [ox, oy], 32.1, P), { tone: active ? 'lit' : 'mid' }))
  const p = at([cx, cy, 32.5])
  out.push(
    `<text class="iso-face-text" data-tone="hi" x="${p[0]}" y="${p[1] + 3.6}" font-size="11" font-weight="700" text-anchor="middle">${digit}</text>`,
  )
  return `${BRASS}${out.join('')}</g>`
}

export default function ChecksumFigure() {
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())

  const cycle = t % (PHASE * 4)
  const phase = Math.floor(cycle / PHASE)
  const local = (cycle % PHASE) / PHASE
  const ballU = phase < 2 ? 0 : phase === 2 ? smooth(local) : 1
  const wrapped = phase > 2 || (phase === 2 && ballU > 0.86)

  const sumDigits = phase === 0 ? '0000' : wrapped ? 'BBBC' : 'BBBB'
  const sumNow = phase === 0 ? '0x0000' : wrapped ? '0xBBBC' : '0x1BBBB'
  const ckDigits = phase === 3 ? '4443' : '----'

  const svg = useMemo(() => {
    const out: string[] = []
    const activeRow = phase === 3 ? 3 : phase === 0 ? -1 : 2
    const angle = t * (phase === 3 ? 2.2 : 0.25) + (phase === 0 ? 0.4 : 0)

    // 地面与底座
    out.push(S(k.slabOf(FLOOR, -15, 2, P, 10, 1), { tone: 'faint' }))
    out.push(IRON)
    for (const [x, y] of [
      [BASE.x + 12, BASE.y + 12],
      [BASE.x + BASE.w - 12, BASE.y + 12],
      [BASE.x + 12, BASE.y + BASE.d - 12],
      [BASE.x + BASE.w - 12, BASE.y + BASE.d - 12],
    ]) {
      out.push(S(k.cylinder(x, y, 5.2, -10, 6, P, 16, 0.7), { tone: 'lo' }))
    }
    out.push(S(k.slabOf(BASE, -4, 7, P, 10, 1.2), { tone: 'lo' }))
    out.push('</g>')
    out.push(STEEL)
    out.push(S(k.slabOf(HOUSING, 2, 20, P, 8, 1.2), { tone: 'mid' }))
    out.push(S(k.slabOf(FACE, 21.6, 2.4, P, 7, 0.7), { tone: 'mid' }))
    out.push('</g>')
    out.push(L(k.planOutline(k.insetPlan(FACE, 4), 24.1, P), { tone: 'faint' }))

    // 底座角螺丝与检修盖
    out.push(
      k.dotsSvg(
        [
          at([BASE.x + 10, BASE.y + 8, 3.1]),
          at([BASE.x + BASE.w - 10, BASE.y + 8, 3.1]),
          at([BASE.x + 10, BASE.y + BASE.d - 8, 3.1]),
          at([BASE.x + BASE.w - 10, BASE.y + BASE.d - 8, 3.1]),
        ],
        { size: 1.2, tone: 'lo' },
      ),
    )
    out.push(
      L(k.lineOnTop([-34, 62], [34, 62], 3.05, P), { tone: 'faint' }),
      L(k.lineOnTop([-34, 65], [24, 65], 3.05, P), { tone: 'faint' }),
    )

    // 四排数位轮
    ROW_Y.forEach((y, row) => {
      const active = row === activeRow
      const digits = row === 0 ? A_DIGITS : row === 1 ? B_DIGITS : row === 2 ? sumDigits : ckDigits
      out.push(S(k.slabOf({ x: -53, y: y - 10.2, w: 106, d: 20.4, r: 5 }, 24.2, 0.9, P, 6, 0.35), { tone: 'lo' }))
      for (let i = 0; i < 4; i++) out.push(wheel(COL_X[i], y, digits[i], active, angle + i * 0.5))
      if (active) {
        out.push(L(k.planOutline({ x: -53, y: y - 10.2, w: 106, d: 20.4, r: 5 }, 25.4, P), { tone: 'blue' }))
      }
      const lp = at([-62, y, 25.4])
      out.push(
        `<text class="iso-face-text" data-tone="${active ? 'hi' : 'mid'}" x="${lp[0]}" y="${lp[1] + 3.4}" font-size="9.5" text-anchor="end">${ROW_NAME[row]}</text>`,
      )
    })

    // 进位指示灯（第 17 位）
    const carryOn = phase === 1 || phase === 2
    out.push(S(k.cylinder(57.5, -36, 3.6, 24.2, 2.2, P, 20, 0.5), { tone: 'lo' }))
    out.push(
      carryOn
        ? `${AMBER}${S(k.cylinder(57.5, -36, 2.5, 26.4, 2, P, 18, 0.6), { tone: 'hi' })}</g>`
        : S(k.cylinder(57.5, -36, 2.5, 26.4, 2, P, 18, 0.6), { tone: 'lo' }),
    )

    // 进位回卷轨道：实体方管 + 立柱
    out.push(STEEL)
    for (let i = 1; i < CARRY_PATH.length; i++) {
      out.push(S(railBar(CARRY_PATH[i - 1], CARRY_PATH[i], 33.6, 2.6, 5.4), { tone: 'mid' }))
    }
    for (const [x, y] of [
      [-86, -30],
      [-86, -60],
      [0, -71],
      [86, -60],
      [86, -30],
      [-76, 4],
      [76, 4],
    ]) {
      out.push(S(k.cylinder(x, y, 2.2, 2, 6, P, 12, 0.5), { tone: 'lo' }))
      out.push(S(k.cylinder(x, y, 1.5, 8, 25.6, P, 12), { tone: 'mid' }))
      out.push(S(k.cylinder(x, y, 2.4, 33, 0.9, P, 12), { tone: 'hi' }))
    }
    // 轨道两端承接杯
    for (const x of [-48.5, 48.5]) {
      out.push(S(k.cylinder(x, 12, 4.2, 33.2, 3, P, 20, 0.8), { tone: 'lo' }))
      out.push(L(k.ring(x, 12, 4.2, 36.3, P, 20), { tone: 'mid' }))
    }
    out.push('</g>')

    // 回卷小球
    const [bx, by] = carryAt(ballU)
    const hop = phase === 2 ? Math.sin(Math.PI * ballU) * 1.6 : 0
    out.push(`${AMBER}${S(k.cylinder(bx, by, 2.7, 36.4 + hop, 3.1, P, 18, 1.1), { tone: 'hi' })}</g>`)

    // 右侧取反手轮
    out.push(STEEL)
    out.push(S(k.cylinder(87, 38, 9, 2, 5, P, 24, 0.8), { tone: 'mid' }))
    out.push(L(k.knurl(87, 38, 9, 2, 7, 22, P), { tone: 'faint' }))
    for (let i = 0; i < 4; i++) {
      const a = angle * 0.4 + (i * Math.PI) / 2
      out.push(
        L(k.lineOnTop([87 + Math.cos(a) * 2, 38 + Math.sin(a) * 2], [87 + Math.cos(a) * 7.2, 38 + Math.sin(a) * 7.2], 7.1, P), {
          tone: 'lo',
        }),
      )
    }
    out.push(S(k.cylinder(87, 38, 2.2, 7, 2.2, P, 14, 0.6), { tone: 'hi' }))
    out.push('</g>')

    // 前面板铭牌：三条刻线与两颗螺钉
    out.push(S(k.slabOf({ x: -30, y: 68, w: 60, d: 6, r: 1.2 }, 3, 0.6, P, 4), { tone: 'mid' }))
    for (let i = 0; i < 3; i++) out.push(L(k.lineOnTop([-19, 70 + i * 1.35], [19 - i * 5, 70 + i * 1.35], 3.7, P), { tone: 'faint' }))
    out.push(
      k.dotsSvg([at([-26, 71, 3.7]), at([26, 71, 3.7])], { size: 0.9, tone: 'lo' }),
    )

    // 进位 1 的蓝色小水线：直观表示多出的第 17 位
    if (carryOn) {
      const p0 = at([48.5, -30, 25.2])
      const p1 = at([60, -30, 25.2])
      out.push(`<path class="iso-line" data-tone="blue" d="M${p0[0]},${p0[1]}L${p1[0]},${p1[1]}"/>`)
    }
    return out.join('')
  }, [phase, ballU, sumDigits, ckDigits, t])

  const stepName = ['装入 A、B', '直接相加', '回卷进位', '按位取反'][phase]

  return (
    <FigureCard
      fig="图 19 · 因特网校验和"
      title="一台会回卷进位的十六进制加法机"
      subtitle="A = 0xE666，B = 0xD555。1 的补码加法：最高位进位像小球一样回卷到最低位，再按位取反。"
      readout={
        <>
          步骤 {phase + 1}/4 · {stepName} · 和 {sumNow} · 校验和 {phase === 3 ? '0x4443' : '—'}
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
            setT(((phase + 1) % 4) * PHASE + 0.05)
          }}
        >
          下一步 →
        </button>
      }
      caption={
        <>
          A + B = <strong>0xE666 + 0xD555 = 0x1BBBB</strong>；最高位进位回卷，得{' '}
          <strong>0xBBBC</strong>；按位取反得到校验和 <strong>0x4443</strong>。接收端把含校验和的内容再求和，结果为 0xFFFF
          即未检测到差错；校验和可能漏检某些错误，不构成无差错证明。
        </>
      }
    >
      <Scene width={W} height={H} label="因特网校验和：十六进制加法机与回卷进位" svg={svg} />
    </FigureCard>
  )
}
