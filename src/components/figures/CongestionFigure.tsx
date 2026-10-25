// ============================================================
// 图解：拥塞的成因与代价（k3.6.1）—— 等距供水网络
// 4 台泵注入共享主管 → 蓄水池（队列）→ 单一出口
// 每泵 25 包/秒，出口 60 包/秒，缓存 240 包（示意值）
// λin > λout 时水位上涨直至溢流（丢包）
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 860
const H = 450
const PUMP_RATE = 25
const OUT_CAP = 60
const CAPACITY = 240
const LEVEL0 = 120
const PUMP_X = [-108, -36, 36, 108]
const PUMP_Y = -95

const GROUND = { x: -146, y: -134, w: 296, d: 258, r: 14 }
const MAIN = { x: -126, y: -64, w: 256, d: 12, r: 2 }
const PLINTH = { x: -64, y: 22, w: 140, d: 76, r: 6 }
const INNER = { x: -50, y: 34, w: 100, d: 52, r: 2 }
const TANK_BOTTOM = 8
const TANK_RIM = 34
const WATER_MAX = 24
const NOTCH_X = -11

const P = k.fitProjection(
  [
    ...k.boxCorners(GROUND, -14, 0),
    [-136, -64, 62],
    [136, -64, 62],
    [126, 94, 10],
  ],
  W,
  H,
  { pad: 22, azimuth: 34, elevation: 36 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)

const STEEL =
  '<g style="--anatomy-paper:#454d58;--anatomy-face:#4f5864;--anatomy-top:#5c6673;--anatomy-shade-0:#333a43;--anatomy-shade-1:#3a424c;--anatomy-shade-2:#414a54;--anatomy-shade-3:#48515c">'
const IRON =
  '<g style="--anatomy-paper:#343b44;--anatomy-face:#3c444f;--anatomy-top:#464f5a;--anatomy-shade-0:#272d35;--anatomy-shade-1:#2c333b;--anatomy-shade-2:#313941;--anatomy-shade-3:#373f48">'
const BLUE =
  '<g style="--anatomy-paper:#2f6fd0;--anatomy-face:#4a86e0;--anatomy-top:#5b95ea;--anatomy-shade-0:#245aad;--anatomy-shade-1:#2b66bd;--anatomy-shade-2:#3272cc;--anatomy-shade-3:#397edb">'
const GREEN =
  '<g style="--anatomy-paper:#2f8f4e;--anatomy-face:#3aa45c;--anatomy-top:#4bbd6c;--anatomy-shade-0:#257a40;--anatomy-shade-1:#298547;--anatomy-shade-2:#2e904e;--anatomy-shade-3:#359c57">'
const BRASS =
  '<g style="--anatomy-paper:#6f5527;--anatomy-face:#7d5f2c;--anatomy-top:#8f6c33;--anatomy-shade-0:#55401b;--anatomy-shade-1:#5f4920;--anatomy-shade-2:#684f25;--anatomy-shade-3:#75592a">'

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v))

function pumpUnit(x: number, on: boolean, angle: number): string {
  const out: string[] = []
  out.push(STEEL)
  out.push(S(k.slabOf({ x: x - 20, y: PUMP_Y - 16, w: 40, d: 32, r: 3 }, -1, 3, P, 6, 0.6), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: x - 17, y: PUMP_Y - 13, w: 34, d: 26, r: 3 }, 2, 16, P, 6, 1.1), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x - 14, y: PUMP_Y - 10, w: 28, d: 20, r: 2 }, 18, 1.4, P, 5, 0.4), { tone: 'hi' }))
  // 电机飞轮
  out.push(S(k.cylinder(x, PUMP_Y + 10, 7.5, 18, 2.8, P, 24, 0.9), { tone: 'mid' }))
  out.push(L(k.knurl(x, PUMP_Y + 10, 7.5, 18, 20.8, 20, P), { tone: 'faint' }))
  if (on) {
    for (let i = 0; i < 4; i++) {
      const a = angle + (i * Math.PI) / 2
      out.push(
        L(
          k.lineOnTop(
            [x + Math.cos(a) * 1.8, PUMP_Y + 10 + Math.sin(a) * 1.8],
            [x + Math.cos(a) * 6.6, PUMP_Y + 10 + Math.sin(a) * 6.6],
            21,
            P,
          ),
          { tone: 'hi' },
        ),
      )
    }
  }
  out.push(S(k.cylinder(x, PUMP_Y + 10, 2, 20.8, 1.4, P, 14, 0.5), { tone: 'hi' }))
  // 立管与法兰
  out.push(S(k.cylinder(x, PUMP_Y - 5, 3.4, 18, 28, P, 16, 0.6), { tone: 'mid' }))
  for (const z of [23, 33, 43]) out.push(S(k.cylinder(x, PUMP_Y - 5, 4, z, 1.2, P, 16), { tone: 'lo' }))
  // 出水支管接主管
  out.push(S(k.slabOf({ x: x - 3.3, y: PUMP_Y - 7, w: 6.6, d: 48, r: 1.5 }, 42, 6, P, 4, 0.7), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x - 5, y: MAIN.y - 5, w: 10, d: 20, r: 1 }, 44, 10, P, 4, 0.6), { tone: 'lo' }))
  if (on) out.push(L(k.lineOnTop([x, PUMP_Y - 2], [x, MAIN.y + 4], 48.2, P), { tone: 'blue', flow: true }))
  // 运行指示灯
  out.push(
    on
      ? `${GREEN}${S(k.cylinder(x - 12, PUMP_Y + 10, 1.8, 18, 1.5, P, 14, 0.4), { tone: 'hi' })}</g>`
      : S(k.cylinder(x - 12, PUMP_Y + 10, 1.8, 18, 0.8, P, 14, 0.4), { tone: 'lo' }),
  )
  out.push(
    k.dotsSvg(
      [
        at([x - 13, PUMP_Y - 9, 19.5]),
        at([x + 13, PUMP_Y - 9, 19.5]),
        at([x - 13, PUMP_Y + 5, 19.5]),
        at([x + 13, PUMP_Y + 5, 19.5]),
      ],
      { size: 0.9, tone: 'lo' },
    ),
  )
  out.push('</g>')
  return out.join('')
}

export default function CongestionFigure() {
  const [pumps, setPumps] = useState(3)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())

  const offered = pumps * PUMP_RATE
  const age = Math.max(0, t)
  const level = clamp(LEVEL0 + (offered - OUT_CAP) * age, 0, CAPACITY)
  const full = level >= CAPACITY - 1e-6
  const loss = full ? Math.max(0, offered - OUT_CAP) : 0
  const throughput = level > 0 ? OUT_CAP : Math.min(offered, OUT_CAP)
  const waterH = (level / CAPACITY) * WATER_MAX
  const surface = TANK_BOTTOM + waterH
  const spilling = loss > 0
  const state = spilling
    ? '缓存溢出 · 丢包'
    : offered > OUT_CAP
      ? '队列无界增长'
      : offered === OUT_CAP
        ? '临界 · 队列稳定'
        : level > 0
          ? '欠载 · 队列排空'
          : '欠载 · 无排队'

  const svg = useMemo(() => {
    const out: string[] = []

    // 地面
    out.push(IRON)
    out.push(S(k.slabOf(GROUND, -14, 2, P, 10, 1), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: GROUND.x + 14, y: GROUND.y + 14, w: GROUND.w - 28, d: GROUND.d - 28, r: 10 }, 0.2, 0.5, P, 8), { tone: 'faint' }))
    out.push('</g>')

    // 四台泵（背排）
    PUMP_X.forEach((x, i) => out.push(pumpUnit(x, i < pumps, t * 3 + i * 0.7)))

    // 共享主管、法兰与支墩
    out.push(STEEL)
    for (const x of [-100, -20, 60, 124]) {
      out.push(S(k.slabOf({ x: x - 4, y: MAIN.y - 6, w: 8, d: 20, r: 1.5 }, 0, 2.5, P, 4, 0.4), { tone: 'lo' }))
      out.push(S(k.cylinder(x, MAIN.y + 6, 2, 2.5, 43.5, P, 12, 0.5), { tone: 'mid' }))
      out.push(S(k.slabOf({ x: x - 5, y: MAIN.y - 8, w: 10, d: 20, r: 1.5 }, 44, 2, P, 4, 0.4), { tone: 'lo' }))
    }
    out.push(S(k.slabOf(MAIN, 46, 8, P, 5, 0.8), { tone: 'mid' }))
    for (const x of [-126, -108, -36, 36, 108, 130]) {
      out.push(S(k.slabOf({ x: x - 4, y: MAIN.y - 5, w: 8, d: 22, r: 1.5 }, 45, 10, P, 4, 0.7), { tone: 'lo' }))
    }
    out.push(L(k.lineOnTop([-120, MAIN.y + 6], [30, MAIN.y + 6], 54.3, P), { tone: 'blue', flow: true }))
    out.push(L(k.lineOnTop([124, MAIN.y + 6], [42, MAIN.y + 6], 54.3, P), { tone: 'blue', flow: true }))
    // 上游长管支墩
    out.push(S(k.slabOf({ x: 30, y: 4, w: 12, d: 12, r: 2 }, 0, 3, P, 4, 0.5), { tone: 'lo' }))
    out.push(S(k.cylinder(36, 10, 2.1, 3, 49, P, 12, 0.5), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: 31, y: 5, w: 10, d: 10, r: 2 }, 52, 2, P, 4, 0.4), { tone: 'lo' }))
    out.push('</g>')

    // 蓄水池：基座、池壁
    out.push(IRON)
    out.push(S(k.slabOf(PLINTH, 0, 8, P, 8, 1.2), { tone: 'mid' }))
    out.push('</g>')
    out.push(STEEL)
    out.push(S(k.slabOf({ x: -56, y: 28, w: 112, d: 64, r: 3 }, 8, 2, P, 5, 0.5), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: -56, y: 28, w: 112, d: 6, r: 1 }, 10, 24, P, 3, 0.5), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -56, y: 28, w: 6, d: 64, r: 1 }, 10, 24, P, 3, 0.5), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: 50, y: 28, w: 6, d: 64, r: 1 }, 10, 24, P, 3, 0.5), { tone: 'mid' }))
    out.push('</g>')

    // 池中水（水位 = 队列长度）
    if (waterH > 0.2) {
      out.push(BLUE)
      out.push(S(k.slabOf(INNER, TANK_BOTTOM, waterH, P, 6, 0.5), { tone: 'hi', crease: 'none' }))
      out.push('</g>')
      for (const wy of [44, 70]) {
        out.push(L(k.lineOnTop([-44, wy], [44, wy], surface + 0.2, P), { tone: 'blue' }))
      }
    }

    // 前壁（中间留溢流口）、池沿与角柱
    out.push(STEEL)
    out.push(S(k.slabOf({ x: -56, y: 86, w: 36, d: 6, r: 1 }, 10, 24, P, 3, 0.5), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -4, y: 86, w: 60, d: 6, r: 1 }, 10, 24, P, 3, 0.5), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -58, y: 26, w: 116, d: 4, r: 1 }, TANK_RIM, 2, P, 4, 0.4), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -58, y: 26, w: 4, d: 70, r: 1 }, TANK_RIM, 2, P, 4, 0.4), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: 54, y: 26, w: 4, d: 70, r: 1 }, TANK_RIM, 2, P, 4, 0.4), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -58, y: 88, w: 40, d: 4, r: 1 }, TANK_RIM, 2, P, 4, 0.4), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -2, y: 88, w: 60, d: 4, r: 1 }, TANK_RIM, 2, P, 4, 0.4), { tone: 'mid' }))
    for (const [cx, cy] of [
      [-56, 28],
      [56, 28],
      [-56, 92],
      [56, 92],
    ]) {
      out.push(S(k.cylinder(cx, cy, 3.2, TANK_RIM, 4, P, 14, 0.6), { tone: 'hi' }))
    }
    out.push('</g>')
    // 溢流口唇线（溢流时红色，平时是普通金属接缝）
    out.push(L(k.segment([-18, 92.1, TANK_RIM + 2.1], [-2, 92.1, TANK_RIM + 2.1], P), { tone: spilling ? 'red' : 'faint' }))
    // 池壁检修梯
    out.push(STEEL)
    for (const lx of [-46, -38]) {
      out.push(S(k.cylinder(lx, 93.2, 0.9, 2, 34, P, 10, 0.3), { tone: 'lo' }))
    }
    for (const lz of [6, 12, 18, 24, 30]) {
      out.push(L(k.segment([-46, 93.2, lz], [-38, 93.2, lz], P), { tone: 'mid' }))
    }
    out.push('</g>')

    // 前壁竖向加强肋
    out.push(STEEL)
    for (const rx of [-28, 40]) {
      out.push(S(k.slabOf({ x: rx, y: 92.1, w: 1.6, d: 1.1, r: 0.4 }, 10, 24, P, 3, 0.3), { tone: 'mid' }))
    }
    out.push('</g>')

    // 前壁外侧水位计
    out.push(STEEL)
    out.push(S(k.slabOf({ x: 16, y: 92.4, w: 12, d: 1.4, r: 1 }, 10, 24, P, 4, 0.3), { tone: 'mid' }))
    out.push('</g>')
    if (level > 0) {
      out.push(BLUE)
      out.push(S(k.slabOf({ x: 19, y: 93.8, w: 6, d: 0.8, r: 0.3 }, 10, Math.max(0.4, 22 * (level / CAPACITY)), P, 3), { tone: 'hi', crease: 'none' }))
      out.push('</g>')
    }
    for (const gz of [14, 19, 24, 29]) {
      out.push(L(k.segment([17.5, 94.7, gz], [22, 94.7, gz], P), { tone: 'faint' }))
    }

    // 上水长管、下注口与落水
    out.push(STEEL)
    out.push(S(k.cylinder(36, MAIN.y + 6, 4, 54, 6, P, 16, 0.7), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: 32, y: MAIN.y - 6, w: 8, d: 130, r: 3 }, 54, 6, P, 4, 0.7), { tone: 'mid' }))
    out.push(S(k.cylinder(36, 58, 3.5, 48, 8, P, 16, 0.6), { tone: 'mid' }))
    out.push(S(k.cylinder(36, 58, 4.4, 47.4, 1.4, P, 16), { tone: 'lo' }))
    out.push('</g>')
    if (offered > 0 && surface < 47) {
      out.push(BLUE)
      out.push(S(k.slabOf({ x: 34.6, y: 56.6, w: 2.8, d: 2.8, r: 0.8 }, surface, 47 - surface, P, 3), { tone: 'hi', crease: 'none' }))
      out.push('</g>')
      out.push(L(k.ring(36, 58, 3.6, surface + 0.1, P, 16), { tone: 'blue' }))
    }

    // 出口管、阀门与排水槽
    out.push(STEEL)
    out.push(S(k.slabOf({ x: 54, y: 64, w: 36, d: 12, r: 2 }, 10, 10, P, 4, 0.6), { tone: 'mid' }))
    out.push(S(k.cylinder(78, 70, 6.5, 20, 5, P, 20, 0.8), { tone: 'mid' }))
    out.push('</g>')
    out.push(BRASS)
    out.push(S(k.cylinder(78, 70, 8, 25, 2, P, 22, 0.8), { tone: 'hi' }))
    out.push(L(k.knurl(78, 70, 8, 25, 27, 20, P), { tone: 'faint' }))
    for (let i = 0; i < 4; i++) {
      const a = t * 0.8 + (i * Math.PI) / 2
      out.push(
        L(
          k.lineOnTop(
            [78 + Math.cos(a) * 1.8, 70 + Math.sin(a) * 1.8],
            [78 + Math.cos(a) * 7, 70 + Math.sin(a) * 7],
            27.1,
            P,
          ),
          { tone: 'hi' },
        ),
      )
    }
    out.push(S(k.cylinder(78, 70, 1.8, 27, 1.4, P, 14, 0.4), { tone: 'hi' }))
    out.push('</g>')
    if (level > 0) {
      out.push(L(k.lineOnTop([58, 70], [88, 70], 20.3, P), { tone: 'blue', flow: true }))
      out.push(BLUE)
      out.push(S(k.slabOf({ x: 88.6, y: 68.4, w: 2.8, d: 3.2, r: 0.6 }, 6.5, 4.2, P, 3), { tone: 'hi', crease: 'none' }))
      out.push('</g>')
    }
    out.push(IRON)
    out.push(S(k.slabOf({ x: 94, y: 56, w: 32, d: 36, r: 4 }, 0, 3, P, 5, 0.5), { tone: 'mid' }))
    for (const [bx, by, bw, bd] of [
      [94, 56, 32, 3],
      [94, 89, 32, 3],
      [94, 56, 3, 36],
      [123, 56, 3, 36],
    ]) {
      out.push(S(k.slabOf({ x: bx, y: by, w: bw, d: bd, r: 1 }, 3, 4, P, 3, 0.3), { tone: 'mid' }))
    }
    if (level > 0) {
      out.push(BLUE)
      out.push(S(k.slabOf({ x: 97, y: 59, w: 26, d: 30, r: 2 }, 3.4, 1.4, P, 4), { tone: 'hi', crease: 'none' }))
      out.push('</g>')
    }
    out.push('</g>')

    // 溢流：水柱、水珠与地面积水
    if (spilling) {
      out.push(BLUE)
      out.push(S(k.slabOf({ x: NOTCH_X - 1.5, y: 92.2, w: 3, d: 1.6, r: 0.5 }, 2, TANK_RIM - 2, P, 3), { tone: 'hi', crease: 'none' }))
      for (let i = 0; i < 4; i++) {
        const dz = 30 - ((t * 24 + i * 8) % 28)
        out.push(S(k.cylinder(NOTCH_X + Math.sin(t * 3 + i) * 1.1, 93.2, 1.3, dz, 1.8, P, 12, 0.5), { tone: 'hi' }))
      }
      out.push(S(k.slabOf({ x: -32, y: 97, w: 40, d: 20, r: 10 }, 0, 1.3, P, 10, 0.4), { tone: 'hi', crease: 'none' }))
      out.push('</g>')
    }

    // 标签（最多四个）：贴在物体表面或地坪上
    const l1 = at([-126, -92, 0.6])
    out.push(
      `<text class="iso-face-text" data-tone="${offered > OUT_CAP ? 'hi' : 'mid'}" x="${l1[0]}" y="${l1[1]}" font-size="9.5" text-anchor="end">水泵 ×${pumps}</text>`,
    )
    const l2 = at([70, MAIN.y + 6, 54.5])
    out.push(`<text class="iso-face-text" data-tone="hi" x="${l2[0]}" y="${l2[1] + 3}" font-size="9.5" text-anchor="middle">共享主管</text>`)
    const l3 = at([-36, 90, TANK_RIM + 2.4])
    out.push(`<text class="iso-face-text" data-tone="hi" x="${l3[0]}" y="${l3[1] + 3}" font-size="9.5" text-anchor="middle">蓄水池 ${CAPACITY} 包</text>`)
    const l4 = at([110, 62, 7.4])
    out.push(`<text class="iso-face-text" data-tone="hi" x="${l4[0]}" y="${l4[1] + 3}" font-size="9.5" text-anchor="middle">出口 ${OUT_CAP} 包/秒</text>`)

    return out.join('')
  }, [pumps, offered, t, level, waterH, surface, spilling, loss])

  return (
    <FigureCard
      fig="图 20 · 拥塞：成因与代价"
      title="四台泵灌一个池子，出口只有一个阀门"
      subtitle="水泵 = 发送方，主管 = 瓶颈链路，蓄水池 = 路由器缓存，溢流 = 丢包。"
      readout={
        <>
          offered load λin = {offered} 包/秒 · 吞吐 λout = {throughput} 包/秒 · 队列 {Math.round(level)}/{CAPACITY} 包 · 丢包{' '}
          {loss} 包/秒 · {state}
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
          value={pumps}
          onChange={(e) => {
            setPumps(Number(e.target.value))
            setT(0)
          }}
          aria-label="选择开启的水泵数量"
        >
          {[1, 2, 3, 4].map((n) => (
            <option key={n} value={n}>
              {n} 台泵（λin = {n * PUMP_RATE} 包/秒）
            </option>
          ))}
        </select>
      }
      caption={
        <>
          有积压时出口可达 60 包/秒；队列排空后，吞吐为 <strong>min(λin, 60)</strong>。输入低于能力时队列逐渐排空，输入高于能力时队列增长并在有限缓存满后丢包。示意值：每泵 25
          包/秒，缓存 240 包。
        </>
      }
    >
      <Scene width={W} height={H} label="拥塞成因：水泵、共享主管、蓄水池与单一出口" svg={svg} />
    </FigureCard>
  )
}
