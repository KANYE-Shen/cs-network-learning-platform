// ============================================================
// 图解：电路交换（k1.3.1）
// 老式电话交换机 + 4 条电路的链路：建立连接 → 预留资源 → 独占传输
// 正文数字：每条链路切成 4 条电路；空闲电路也不共享
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 880
const H = 390
const CYCLE = 14
const NCH = 4

const GROUND = { x: -272, y: -78, w: 528, d: 158, r: 12 }
const PLINTH = { x: -248, y: -60, w: 132, d: 108, r: 4 }
const BODY = { x: -243, y: -54, w: 122, d: 96, r: 3 }
const TOPC = { x: -249, y: -61, w: 134, d: 110, r: 4 }
const PANEL = { x: -235, y: 40, w: 106, d: 2.5, r: 1 }
const TROUGH = { x: -110, y: 17, w: 340, d: 50, r: 4 }
const CABLE_Y = [24, 34, 44, 54]
const SHELF = { x: -212, y: 68, w: 96, d: 24, r: 3 }

const P = k.fitProjection(
  [...k.boxCorners(GROUND, -8, 0), [-250, -62, 168], [236, 70, 64], [-212, 98, 18]],
  W,
  H,
  { pad: 16, azimuth: 34, elevation: 36 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)

type ColorSet = {
  paper: string
  face: string
  top: string
  s0: string
  s1: string
  s2: string
  s3: string
  hi: string
  faint: string
}

const RED: ColorSet = {
  paper: '#a83a34', face: '#bd4942', top: '#cf5b52', s0: '#7d2a26', s1: '#8c312c', s2: '#9b3832', s3: '#a9413a', hi: '#e58d84', faint: '#5e201d',
}
const BLUE: ColorSet = {
  paper: '#2f63b0', face: '#3d74c4', top: '#4e86d6', s0: '#224a86', s1: '#285494', s2: '#2e5ea3', s3: '#3569b2', hi: '#9dc0ec', faint: '#1b3a68',
}
const GREEN: ColorSet = {
  paper: '#2d8557', face: '#379b66', top: '#45ae77', s0: '#206442', s1: '#256f4a', s2: '#2a7a51', s3: '#308558', hi: '#93d8b2', faint: '#194e33',
}
const AMBER: ColorSet = {
  paper: '#a8792c', face: '#bd8b36', top: '#d19c43', s0: '#7d5a21', s1: '#8a6426', s2: '#986e2a', s3: '#a6792f', hi: '#e8c88a', faint: '#5e451a',
}
const CABLES = [RED, BLUE, GREEN, AMBER]
const SILVER: ColorSet = {
  paper: '#8d97a3', face: '#9da8b4', top: '#b4bfca', s0: '#5f6872', s1: '#68727d', s2: '#717c87', s3: '#7a8591', hi: '#eaf0f6', faint: '#494f57',
}

const paint = (c: ColorSet, inner: string) =>
  `<g style="--anatomy-paper:${c.paper};--anatomy-face:${c.face};--anatomy-top:${c.top};--anatomy-shade-0:${c.s0};--anatomy-shade-1:${c.s1};--anatomy-shade-2:${c.s2};--anatomy-shade-3:${c.s3};--anatomy-hi:${c.hi};--anatomy-faint:${c.faint}">${inner}</g>`

const STEEL = '--anatomy-paper:#46505c;--anatomy-face:#505b68;--anatomy-top:#5c6878;--anatomy-shade-0:#2b333d;--anatomy-shade-1:#323b46;--anatomy-shade-2:#39434f;--anatomy-shade-3:#404b57;--anatomy-hi:#e0e8f0;--anatomy-faint:#68737f'
const IRON = '--anatomy-paper:#333b46;--anatomy-face:#3b4551;--anatomy-top:#45505d;--anatomy-shade-0:#222932;--anatomy-shade-1:#28303a;--anatomy-shade-2:#2e3741;--anatomy-shade-3:#343d48;--anatomy-hi:#a7b3c0;--anatomy-faint:#525d69'
const steel = (inner: string) => `<g style="${STEEL}">${inner}</g>`
const iron = (inner: string) => `<g style="${IRON}">${inner}</g>`

const text = (p: [number, number, number], s: string, size = 10, anchor = 'middle', tone = 'hi') => {
  const [x, y] = at(p)
  return `<text class="iso-face-text" data-tone="${tone}" x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}">${s}</text>`
}

const textRed = (p: [number, number, number], s: string, size = 10, anchor = 'middle') => {
  const [x, y] = at(p)
  return `<text class="iso-face-text" style="fill:var(--anatomy-red)" x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}">${s}</text>`
}

/** 竖直面板（y = 常数）上的圆，投影成等距椭圆 */
const faceCircle = (cx: number, y: number, cz: number, r: number, steps = 28) =>
  k.pathOf(
    Array.from({ length: steps + 1 }, (_, i) => {
      const a = (i / steps) * Math.PI * 2
      return at([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r])
    }),
  )

/** 静态机身：机柜、配线面板、链路槽、4 条电路粗缆、等待台 */
function buildStatic(): string {
  const out: string[] = []
  out.push(S(k.slabOf(GROUND, -8, 8, P, 10, 1), { tone: 'lo' }))

  // ---- 老式交换机机柜 ----
  for (const [x, y] of [
    [-241, -58],
    [-129, -58],
    [-241, 40],
    [-129, 40],
  ]) {
    out.push(S(k.cylinder(x, y, 4.4, 0, 7, P, 14), { tone: 'lo' }))
  }
  out.push(iron(S(k.slabOf(PLINTH, 7, 8, P, 5, 0.6), { tone: 'mid' })))
  out.push(steel(S(k.slabOf(BODY, 15, 130, P, 4), { tone: 'hi' })))
  out.push(iron(L(k.sideSeam(BODY, 48, P), { tone: 'faint' })))
  // 侧面散热缝（两端都落在柜体棱边上）
  for (let i = 0; i < 6; i++) {
    const y = -38 + i * 13
    out.push(iron(L(k.segment([-243, y, 34], [-243, y, 66], P), { tone: 'faint' })))
  }
  out.push(steel(S(k.slabOf(TOPC, 145, 8, P, 5, 1), { tone: 'hi' })))
  out.push(steel(S(k.slabOf({ x: -243, y: -54, w: 122, d: 96, r: 3 }, 153, 2.5, P, 5, 0.4), { tone: 'hi' })))

  // 配线面板与插孔
  out.push(iron(S(k.slabOf(PANEL, 28, 92, P, 3, 0.4), { tone: 'mid' })))
  out.push(steel(S(k.slabOf({ x: -239, y: 38, w: 114, d: 4, r: 1 }, 120, 4, P, 3, 0.4), { tone: 'hi' })))
  const jacks: [number, number, number][] = []
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 3; row++) jacks.push([-228 + col * 24, 42.8, 44 + row * 20])
  }
  out.push(k.dotsSvg(jacks, { size: 3.4, tone: 'hi' }))
  out.push(k.dotsSvg(jacks, { size: 1.5, tone: 'faint' }))
  // 面板上的两只机械表
  for (const cx of [-214, -178]) {
    out.push(L(faceCircle(cx, 42.7, 104, 8.5), { tone: 'hi' }))
    out.push(L(faceCircle(cx, 42.7, 104, 7), { tone: 'faint' }))
    for (let i = 0; i <= 8; i++) {
      const a = (-140 + i * 35) * (Math.PI / 180)
      out.push(
        L(
          k.segment(
            [cx + Math.sin(a) * 5.4, 42.7, 104 + Math.cos(a) * 5.4],
            [cx + Math.sin(a) * 7.2, 42.7, 104 + Math.cos(a) * 7.2],
            P,
          ),
          { tone: 'mid' },
        ),
      )
    }
    out.push(L(k.segment([cx, 42.7, 104], [cx + 4.4, 42.7, 108.4], P), { tone: 'red' }))
    out.push(k.dotsSvg([at([cx, 42.7, 104])], { size: 1, tone: 'hi' }))
  }
  // 铭牌与三道刻线
  out.push(steel(S(k.slabOf({ x: -232, y: 42.8, w: 54, d: 1.6, r: 1 }, 30, 9, P, 3, 0.3), { tone: 'hi' })))
  for (let i = 0; i < 3; i++) {
    const z = 32.5 + i * 2.4
    out.push(L(k.lineOnTop([-227 + i * 2, 43.2], [-186, 43.2], z, P), { tone: 'faint' }))
  }
  // 顶部两只拨号盘 + 话筒
  for (const [cx, cy] of [
    [-208, -2],
    [-180, -2],
  ] as const) {
    out.push(steel(S(k.cylinder(cx, cy, 10, 155.5, 1.8, P, 36), { tone: 'hi' })))
    out.push(L(k.radialTicks(cx, cy, 9, 12, 3, 157.6, [1.8, 3.6], P).minor, { tone: 'faint' }))
    out.push(L(k.radialTicks(cx, cy, 9, 12, 3, 157.6, [1.8, 3.6], P).major, { tone: 'mid' }))
    out.push(S(k.cylinder(cx, cy, 3.2, 157.3, 2.6, P, 20), { tone: 'lo' }))
  }
  for (const y of [-38, -18]) out.push(S(k.cylinder(-232, y, 4.2, 155.5, 4, P, 20), { tone: 'mid' }))
  out.push(steel(S(k.slabOf({ x: -234, y: -34, w: 4, d: 20, r: 2 }, 157.5, 3.6, P, 4, 0.5), { tone: 'hi' })))
  // 顶部接线柱
  for (let i = 0; i < 4; i++) {
    out.push(S(k.cylinder(-150 + i * 8, 34, 2.2, 153, 4.5, P, 14), { tone: 'mid' }))
  }

  // ---- 链路承重台 ----
  for (const x of [-52, 148]) {
    for (const y of [22, 58]) out.push(iron(S(k.cylinder(x, y, 3, 0, 17, P, 14), { tone: 'mid' })))
    out.push(iron(S(k.slabOf({ x: x - 4, y: 20, w: 8, d: 42, r: 2 }, 17, 7, P, 4, 0.5), { tone: 'mid' })))
  }
  out.push(iron(S(k.slabOf(TROUGH, 24, 6, P, 5, 0.5), { tone: 'mid' })))
  // 远端护栏（先画，缆线压在上面）
  out.push(steel(S(k.slabOf({ x: -112, y: 13, w: 344, d: 4.5, r: 2 }, 27, 14, P, 4, 0.5), { tone: 'hi' })))
  // 三条分隔棱
  for (const y of [29, 39, 49]) {
    out.push(iron(S(k.slabOf({ x: -106, y: y - 0.9, w: 332, d: 1.8, r: 0.9 }, 30, 4, P, 3), { tone: 'lo' })))
  }
  // 4 条不同颜色的粗缆：一条链路被切成 4 条电路
  CABLES.forEach((c, i) => {
    const y = CABLE_Y[i]
    out.push(paint(c, S(k.slabOf({ x: -108, y: y - 4, w: 336, d: 8, r: 4 }, 30, 6, P, 8, 0.8), { tone: 'hi' })))
    // 缆线端头
    out.push(S(k.cylinder(-106, y, 4.4, 29.5, 7, P, 18), { tone: 'lo' }))
  })
  // 近端护栏（压住缆线根部）
  out.push(steel(S(k.slabOf({ x: -112, y: 63.5, w: 344, d: 4.5, r: 2 }, 27, 8, P, 4, 0.4), { tone: 'hi' })))
  // 护栏上的铆钉
  for (let i = 0; i < 9; i++) {
    out.push(k.dotsSvg([at([-100 + i * 40, 65.7, 35])], { size: 1.1, tone: 'lo' }))
  }
  // 末端接线端子
  out.push(steel(S(k.slabOf({ x: 222, y: 20, w: 8, d: 42, r: 2 }, 27, 12, P, 4, 0.5), { tone: 'hi' })))
  for (const y of CABLE_Y) out.push(S(k.cylinder(226, y, 3.4, 39, 3, P, 16), { tone: 'lo' }))

  // ---- 等待台 ----
  out.push(iron(S(k.slabOf(SHELF, 0, 7, P, 4, 0.6), { tone: 'mid' })))
  out.push(steel(S(k.slabOf(k.insetPlan(SHELF, 3), 7, 1.4, P, 4, 0.3), { tone: 'hi' })))
  for (let i = 0; i < 3; i++) {
    out.push(S(k.cylinder(SHELF.x + 12 + i * 30, SHELF.y + 12, 1.6, 8.4, 1, P, 10), { tone: 'lo' }))
  }

  // ---- 标签（4 个，放在物体表面） ----
  out.push(text([-205, 42.9, 37], '老式交换机', 10))
  out.push(text([30, 66, 62], '链路 = 4 条电路', 11))
  out.push(text([-215, 98, 9], '等待用户', 10, 'end'))
  return out.join('')
}

const STATIC = buildStatic()

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x))

export default function CircuitFigure() {
  const [mode, setMode] = useState<'circuit' | 'shared'>('circuit')
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())

  const shared = mode === 'shared'
  const ph = t % CYCLE
  const stage = ph < 4 ? '建立连接' : ph < 9 ? '预留资源' : '独占传输'
  const reserved = shared ? 3 : 4
  const waiting = shared ? 2 : 3
  const silent = shared ? 0 : 1

  const svg = useMemo(() => {
    const out: string[] = [STATIC]

    // 4 路呼叫的接插线：建立阶段有信令流动
    for (let i = 0; i < NCH; i++) {
      const p0 = at([-228 + i * 24, 42.9, 66])
      const p1 = at([-81, CABLE_Y[i]!, 42])
      const via = [at([-160 + i * 10, 58 + i * 3, 100])]
      out.push(k.wireSvg(p0, p1, { via, tone: 'hi', flow: ph < 4.5, ends: 'both', size: 1.2 }))
    }

    // 4 个专用通道的接线夹：依次落到缆线上
    for (let i = 0; i < NCH; i++) {
      const drop = 24 * (1 - ease((ph - (0.9 + i * 0.5)) / 1.0))
      const cy = CABLE_Y[i]!
      const isShared = shared && i === 3
      const lit = ph > 0.9 + i * 0.5
      out.push(S(k.slabOf({ x: -88, y: cy - 4.5, w: 16, d: 9, r: 2 }, 36 + drop, 5, P, 4, 0.6), { tone: 'hi' }))
      out.push(S(k.slabOf({ x: -86, y: cy - 6, w: 10, d: 2, r: 1 }, 34 + drop, 8, P, 3, 0.4), { tone: 'lo' }))
      out.push(S(k.slabOf({ x: -86, y: cy + 4, w: 10, d: 2, r: 1 }, 34 + drop, 8, P, 3, 0.4), { tone: 'lo' }))
      const lamp = isShared ? SILVER : CABLES[i]!
      out.push(
        paint(
          lit ? lamp : { ...lamp, paper: '#2c3138', face: '#343a42', top: '#3d444d', s0: '#23272d', s1: '#272c32', s2: '#2b3037', s3: '#2f343b', hi: '#4a525c', faint: '#1d2126' },
          S(k.cylinder(-80, cy, 2.4, 41 + drop, 1.6, P, 14), { tone: 'hi' }),
        ),
      )
      if (isShared) {
        out.push(k.dotsSvg([at([-80, cy, 43.2 + drop])], { size: 1, tone: 'mid' }))
      }
    }

    // 静默电路 / 共享电路上的数据块
    if (t > 5.5) {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 2; j++) {
          const x = -70 + ((t - 5.5) * 52 + i * 38 + j * 150) % 290
          const cy = CABLE_Y[i]!
          out.push(paint(CABLES[i]!, S(k.slabOf({ x: x - 3.5, y: cy - 2.5, w: 7, d: 5, r: 1.5 }, 36.2, 3.4, P, 4, 0.5), { tone: 'hi' })))
        }
      }
      if (shared && ph > 6) {
        const x = -70 + ((t - 6) * 46) % 280
        out.push(paint(SILVER, S(k.slabOf({ x: x - 3.5, y: CABLE_Y[3]! - 2.5, w: 7, d: 5, r: 1.5 }, 36.2, 3.4, P, 4, 0.5), { tone: 'hi' })))
      }
    }

    // 空闲指示灯：电路交换下 4 盏全亮，共享对比下第 4 盏熄灭
    for (let i = 0; i < NCH; i++) {
      const on = !shared || i < 3
      const c = CABLES[i]!
      out.push(S(k.cylinder(-236 + i * 20, 28, 3.1, 153, 1.6, P, 14), { tone: 'lo' }))
      out.push(
        paint(
          on ? c : { ...c, paper: '#252a30', face: '#2c3239', top: '#333a42', s0: '#1e2227', s1: '#21262b', s2: '#252a30', s3: '#292f36', hi: '#464e58', faint: '#191d21' },
          S(k.cylinder(-236 + i * 20, 28, 2.4, 154.6, 2.6, P, 14), { tone: 'hi' }),
        ),
      )
    }

    // 等待用户：3 个令牌（共享对比下只剩 2 个）
    for (let i = 0; i < waiting; i++) {
      out.push(paint(SILVER, S(k.slabOf({ x: -200 + i * 30 - 7, y: 73, w: 14, d: 14, r: 2.5 }, 8.4, 8, P, 4, 0.6), { tone: 'hi' })))
      out.push(L(k.lineOnTop([-205 + i * 30, 80], [-193 + i * 30, 80], 16.6, P), { tone: 'red' }))
    }

    // 动态标签：第 4 条电路的命运
    out.push(
      shared
        ? text([210, 30, 68], '第 4 路：被复用', 10, 'end')
        : textRed([210, 30, 68], '第 4 路：静默仍占用', 10, 'end'),
    )
    return out.join('')
  }, [ph, shared, waiting, t])

  return (
    <FigureCard
      fig="图 7 · 电路交换"
      title="先接通、再预留，最后独占传输"
      subtitle="老式交换机把一条链路的带宽切成 4 条电路；每次呼叫独占其中一条，静默时也不让给别人。"
      readout={
        <>
          阶段 {stage} · 已预留 {reserved}/4 · 静默仍占用 {silent}
          <br className="sm:hidden" /> · 等待用户 {waiting}
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
          value={mode}
          onChange={(e) => setMode(e.target.value as 'circuit' | 'shared')}
          aria-label="切换电路交换与空闲共享对比"
        >
          <option value="circuit">电路交换（默认）</option>
          <option value="shared">空闲共享（对比）</option>
        </select>
      }
      caption={
        shared ? (
          <>
            对比状态：假设静默电路允许复用，第 4 条被等待用户接管，<strong>已预留 3/4</strong>、等待用户降到 2。电路交换不允许这样做——
            空闲电路仍归原呼叫所有，这正是“性能确定”要付的<strong>资源浪费</strong>代价。
          </>
        ) : (
          <>
            链路被切成 <strong>4 条电路</strong>，4 路呼叫各占一条；其中第 4 路静默，但电路交换
            <strong>空闲也不共享</strong>，等待用户仍进不来。切到“空闲共享”对比可看到：若允许复用，静默电路本可承载别的呼叫。
          </>
        )
      }
    >
      <Scene width={W} height={H} label="电路交换：老式交换机与 4 条专用电路" svg={svg} />
    </FigureCard>
  )
}
