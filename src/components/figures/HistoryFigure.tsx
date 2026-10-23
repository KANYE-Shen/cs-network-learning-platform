// ============================================================
// 图解：从 ARPAnet 到商业化互联网（k1.7.1）
// 博物馆陈列台 + 轨道聚光灯，四件展品按年份依次被照亮
// 年份与事件严格取自 ch1-s17.ts
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 940
const H = 400
const BASE = 42.5
const STATIONS = [-210, -70, 70, 210]
const SEG = 4.5
const CYCLE = SEG * STATIONS.length

const EXHIBITS = [
  { year: '1969', event: '第一个 ARPAnet 节点投入运行' },
  { year: '1983', event: 'TCP/IP 部署；DNS 定义' },
  { year: '1990s', event: 'Mosaic / Netscape 让 Web 走向大众' },
  { year: '2007', event: '约 5 亿台主机；无线与移动性兴起' },
]

const GROUND = { x: -292, y: -90, w: 584, d: 184, r: 12 }
const TABLE = { x: -262, y: -56, w: 524, d: 112, r: 4 }
const TABLE_Z = 34
const RAIL_Z = 150
const RAIL_Y = -66

const P = k.fitProjection(
  [
    ...k.boxCorners(GROUND, -10, 0),
    ...k.boxCorners({ x: -276, y: RAIL_Y - 5, w: 552, d: 10, r: 0 }, RAIL_Z, RAIL_Z + 7),
    [-210, 0, 108],
    [210, 0, 108],
  ],
  W,
  H,
  { pad: 14, azimuth: 32, elevation: 35 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)

const BLUE =
  '<g style="--anatomy-paper:#1b3050;--anatomy-face:#26466f;--anatomy-top:#2d507c;--anatomy-shade-0:#152640;--anatomy-shade-1:#1a2d4b;--anatomy-shade-2:#1f3456;--anatomy-shade-3:#243b61">'
const METAL =
  '--anatomy-paper:#414a55;--anatomy-face:#525d69;--anatomy-top:#67727f;--anatomy-shade-0:#343d46;--anatomy-shade-1:#3a434d;--anatomy-shade-2:#404a55;--anatomy-shade-3:#47515c;--anatomy-lit-top:#8492a0;--anatomy-lit-shade:#5f6b78;--anatomy-hi:#eef2f7'

/* ---------------- 展品 ---------------- */

function imp(x: number, lit: boolean) {
  const out: string[] = []
  for (const [dx, dy] of [
    [-11, -7],
    [11, -7],
    [-11, 7],
    [11, 7],
  ] as const) {
    out.push(S(k.cylinder(x + dx, dy, 2.4, BASE, 3, P, 12), { tone: 'lo' }))
  }
  out.push(S(k.slabOf({ x: x - 15, y: -10, w: 30, d: 20, r: 1.5 }, BASE + 3, 19, P, 4, 0.8), { tone: 'mid', lit }))
  out.push(S(k.slabOf({ x: x - 16, y: -11, w: 32, d: 22, r: 1.6 }, BASE + 22, 3, P, 4, 0.9), { tone: 'hi', lit }))
  // 顶部操作台与指示灯
  out.push(S(k.slabOf({ x: x - 12, y: 4, w: 24, d: 5, r: 0.8 }, BASE + 25, 2, P, 3, 0.3), { tone: 'mid' }))
  for (let i = 0; i < 8; i++) {
    out.push(S(k.cylinder(x - 9 + i * 2.9, 6.5, 1.1, BASE + 27, 1.1, P, 10), { tone: i % 3 === 0 ? 'hi' : 'lo' }))
  }
  // 两台磁带机
  for (const dx of [-8, 8]) {
    out.push(S(k.cylinder(x + dx, -4, 5.5, BASE + 25, 1.6, P, 22), { tone: 'lo' }))
    out.push(L(k.ring(x + dx, -4, 2.2, BASE + 26.6, P, 16), { tone: 'faint' }))
  }
  // 前面板散热线
  for (let i = 0; i < 5; i++) {
    out.push(L(k.segment([x - 9, 10.2, BASE + 7 + i * 2.6], [x + 9, 10.2, BASE + 7 + i * 2.6], P), { tone: 'faint' }))
  }
  // 两侧提手
  for (const dx of [-16.6, 16.6]) {
    out.push(S(k.slabOf({ x: x + dx - 1, y: -3, w: 2, d: 6, r: 0.5 }, BASE + 18, 2, P, 2), { tone: 'lo' }))
  }
  return out.join('')
}

function binder(x: number, lit: boolean) {
  const out: string[] = []
  out.push(S(k.slabOf({ x: x - 12, y: -8, w: 24, d: 16, r: 1 }, BASE, 2, P, 3, 0.3), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: x - 9, y: -4, w: 18, d: 8, r: 0.4 }, BASE + 2, 22, P, 2, 0.2), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: x - 11, y: 5, w: 22, d: 2, r: 0.5 }, BASE + 2, 25, P, 2, 0.3), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x - 11, y: -7, w: 22, d: 2, r: 0.5 }, BASE + 2, 25, P, 2, 0.4), { tone: 'hi', lit }))
  out.push(S(k.slabOf({ x: x - 11, y: -7, w: 3, d: 14, r: 0.4 }, BASE + 2, 25, P, 2, 0.3), { tone: 'lo' }))
  // 封面标签与书脊压条
  out.push(S(k.slabOf({ x: x - 6, y: -7.7, w: 13, d: 0.7, r: 0.2 }, BASE + 12, 6, P, 2), { tone: 'lo' }))
  for (const z of [BASE + 8, BASE + 16, BASE + 23]) {
    out.push(L(k.segment([x - 11.2, -6, z], [x - 8.2, -6, z], P), { tone: 'faint' }))
  }
  // 顶部装订环与索引页签
  for (const dx of [-6, 0, 6]) out.push(L(k.ring(x + dx, -1, 2.4, BASE + 27.2, P, 16), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x + 7, y: -5, w: 3, d: 2, r: 0.3 }, BASE + 10, 4, P, 2), { tone: 'mid' }))
  return out.join('')
}

function desktop(x: number, lit: boolean) {
  const out: string[] = []
  out.push(S(k.cylinder(x, 3, 9, BASE, 2, P, 20), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x - 2.5, y: 2, w: 5, d: 4, r: 0.6 }, BASE + 2, 6, P, 2), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: x - 16, y: -1, w: 32, d: 2.6, r: 1 }, BASE + 8, 21, P, 3, 0.6), { tone: 'mid', lit }))
  out.push(
    BLUE +
      S(k.slabOf({ x: x - 13.5, y: 1.7, w: 27, d: 0.6, r: 0.4 }, BASE + 10.5, 16.5, P, 3), { tone: 'hi', crease: 'none' }) +
      '</g>',
  )
  out.push(S(k.slabOf({ x: x - 16, y: 1.5, w: 32, d: 0.7, r: 0.3 }, BASE + 8, 2, P, 2), { tone: 'lo' }))
  // 键盘与鼠标
  out.push(S(k.slabOf({ x: x - 20, y: 14, w: 30, d: 9, r: 1 }, BASE, 1.8, P, 3, 0.3), { tone: 'hi' }))
  out.push(k.dotsSvg(k.dotGrid(x - 18, 15.5, 8, 3, 3, BASE + 1.9, P), { size: 0.55, tone: 'faint' }))
  out.push(S(k.slabOf({ x: x - 26, y: 16, w: 5, d: 4, r: 1.5 }, BASE, 1.2, P, 2), { tone: 'mid' }))
  // 主机箱
  out.push(S(k.slabOf({ x: x + 15, y: 4, w: 11, d: 14, r: 1 }, BASE, 22, P, 3, 0.5), { tone: 'mid' }))
  for (let i = 0; i < 3; i++) {
    out.push(L(k.segment([x + 17, 18.1, BASE + 6 + i * 4], [x + 21, 18.1, BASE + 6 + i * 4], P), { tone: 'faint' }))
  }
  out.push(k.dotsSvg([at([x + 23.5, 18.1, BASE + 4])], { size: 1, tone: 'mid' }))
  return out.join('')
}

function phone(x: number, lit: boolean) {
  const out: string[] = []
  out.push(S(k.slabOf({ x: x - 7, y: 9, w: 14, d: 5, r: 1 }, BASE, 1.6, P, 2), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x - 1.2, y: 3, w: 2.4, d: 7, r: 0.5 }, BASE, 11, P, 2), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: x - 7, y: -2, w: 14, d: 2.6, r: 1.4 }, BASE + 8, 25, P, 3, 0.7), { tone: 'hi', lit }))
  out.push(
    BLUE +
      S(k.slabOf({ x: x - 5.6, y: 0.75, w: 11.2, d: 0.5, r: 0.4 }, BASE + 11, 18, P, 3), { tone: 'hi', crease: 'none' }) +
      '</g>',
  )
  out.push(k.dotsSvg([at([x, 1.15, BASE + 9.4])], { size: 1.4, tone: 'mid' }))
  out.push(L(k.segment([x - 2, 1.15, BASE + 31], [x + 2, 1.15, BASE + 31], P), { tone: 'lo' }))
  out.push(k.dotsSvg([at([x - 4.2, 1.15, BASE + 30])], { size: 0.8, tone: 'lo' }))
  out.push(S(k.slabOf({ x: x + 7, y: -1.2, w: 0.9, d: 2, r: 0.2 }, BASE + 22, 4, P, 2), { tone: 'lo' }))
  return out.join('')
}

/* ---------------- 主体 ---------------- */

export default function HistoryFigure() {
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())

  const raw = ((t % CYCLE) + CYCLE) % CYCLE
  const current = Math.floor(raw / SEG) % STATIONS.length
  const local = raw % SEG
  const from = current === 0 ? 0 : current - 1
  const ease = Math.min(local / 1.3, 1)
  const e = ease * ease * (3 - 2 * ease)
  const lampX = STATIONS[from] + (STATIONS[current] - STATIONS[from]) * e
  const stationX = STATIONS[current]

  const svg = useMemo(() => {
    const out: string[] = []
    out.push(S(k.slabOf(GROUND, -10, 10, P, 10, 1), { tone: 'lo' }))

    // 展台与桌腿
    out.push(
      S(k.slabOf({ x: TABLE.x + 8, y: TABLE.y + 8, w: TABLE.w - 16, d: TABLE.d - 16, r: 3 }, TABLE_Z - 6, 6, P, 5), {
        tone: 'lo',
      }),
    )
    for (const x of [-238, -160, -80, 0, 80, 160, 238]) {
      for (const y of [-36, 36]) out.push(S(k.cylinder(x, y, 3.4, 0, TABLE_Z - 6, P, 14), { tone: 'mid' }))
    }
    for (const y of [-36, 36]) {
      out.push(S(k.slabOf({ x: -238, y: y - 2, w: 476, d: 4, r: 1 }, 8, 3, P, 3), { tone: 'mid' }))
    }
    out.push(S(k.slabOf(TABLE, TABLE_Z, 5, P, 6, 0.8), { tone: 'hi' }))

    // 展品转台
    for (const x of STATIONS) {
      out.push(S(k.cylinder(x, 0, 28, TABLE_Z + 5, 3.5, P, 30), { tone: 'mid' }))
      out.push(L(k.ring(x, 0, 28, TABLE_Z + 8.5, P, 30), { tone: 'faint' }))
      out.push(L(k.ring(x, 0, 23.5, TABLE_Z + 8.6, P, 30), { tone: 'faint' }))
    }

    // 后方灯轨与立柱（先画，位于展品之后）
    for (const x of [-270, 270]) {
      out.push(S(k.slabOf({ x: x - 7, y: RAIL_Y - 5, w: 14, d: 10, r: 1 }, 0, 6, P, 3, 0.4), { tone: 'mid' }))
      out.push(
        S(k.slabOf({ x: x - 4.5, y: RAIL_Y - 3.5, w: 9, d: 7, r: 1 }, 6, RAIL_Z - 6, P, 3, 0.5), { tone: 'lo' }),
      )
    }
    out.push(S(k.slabOf({ x: -278, y: RAIL_Y - 4.5, w: 556, d: 9, r: 2 }, RAIL_Z, 7, P, 4, 0.6), { tone: 'hi' }))

    // 四件展品与年份铭牌（由远及近）
    const plaques: string[] = []
    for (let i = 0; i < STATIONS.length; i++) {
      const x = STATIONS[i]
      const lit = i === current
      plaques.push(S(k.slabOf({ x: x - 19, y: 45, w: 38, d: 9, r: 1 }, TABLE_Z + 5, 2.4, P, 3, 0.4), { tone: 'lo' }))
      plaques.push(S(k.slabOf({ x: x - 16, y: 46.2, w: 32, d: 6.6, r: 0.8 }, TABLE_Z + 7.4, 1.4, P, 3, 0.3), { tone: 'mid' }))
      const py = at([x, 49.8, TABLE_Z + 9.2])
      plaques.push(
        `<text class="iso-face-text" data-tone="hi" x="${py[0]}" y="${py[1]}" font-size="10" text-anchor="middle">${EXHIBITS[i].year}</text>`,
      )

      // 展品放大 1.9 倍并以底座中心为锚点，让实体细节可辨
      const c = at([x, 0, BASE])
      const wrap = `<g transform="translate(${c[0]} ${c[1]}) scale(1.9) translate(${-c[0]} ${-c[1]})" style="${METAL}">`
      if (i === 0) out.push(wrap + imp(x, lit) + '</g>')
      else if (i === 1) out.push(wrap + binder(x, lit) + '</g>')
      else if (i === 2) out.push(wrap + desktop(x, lit) + '</g>')
      else out.push(wrap + phone(x, lit) + '</g>')
    }
    // 铭牌位于展品前方，最后绘制，避免被放大后的展品遮挡
    out.push(...plaques)

    // 聚光灯滑车、悬臂、灯罩
    out.push(`<g style="${METAL}">`)
    out.push(
      S(k.slabOf({ x: lampX - 8, y: RAIL_Y - 7, w: 16, d: 14, r: 1 }, RAIL_Z - 1, 9, P, 3, 0.4), { tone: 'mid' }),
    )
    for (const dx of [-5, 5]) {
      out.push(S(k.cylinder(lampX + dx, RAIL_Y - 9, 2, RAIL_Z + 2, 3, P, 12), { tone: 'lo' }))
    }
    out.push(S(k.slabOf({ x: lampX - 2, y: RAIL_Y + 2, w: 4, d: 64, r: 1 }, RAIL_Z + 1, 3, P, 2, 0.3), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: lampX - 4, y: 0, w: 8, d: 7, r: 1 }, RAIL_Z - 5, 4, P, 2), { tone: 'mid' }))
    out.push(S(k.cylinder(lampX, 2.5, 7.5, RAIL_Z - 17, 10, P, 22), { tone: 'hi' }))
    out.push(S(k.cylinder(lampX, 2.5, 5.5, RAIL_Z - 19, 2.5, P, 22), { tone: 'mid' }))
    out.push(L(k.ring(lampX, 2.5, 7.5, RAIL_Z - 7, P, 22), { tone: 'faint' }))
    out.push('</g>')

    // 光锥与台面光斑
    const apex = at([lampX, 2.5, RAIL_Z - 19])
    const foot = [
      [stationX - 31, -31],
      [stationX + 31, -31],
      [stationX + 31, 31],
      [stationX - 31, 31],
    ].map(([x, y]) => at([x, y, BASE + 1]))
    out.push(
      `<path d="M${apex[0]} ${apex[1]}L${foot[0][0]} ${foot[0][1]}L${foot[1][0]} ${foot[1][1]}L${foot[2][0]} ${foot[2][1]}L${foot[3][0]} ${foot[3][1]}Z" fill="#fff" fill-opacity="0.14"/>`,
    )
    const glow = k.circleRing(stationX, 0, 27, 32).map(([x, y]) => at([x, y, BASE + 0.5]))
    out.push(`<path d="${k.pathOf(glow, true)}" fill="#fff" fill-opacity="0.14"/>`)

    return out.join('')
  }, [current, lampX, stationX])

  const item = EXHIBITS[current]

  return (
    <FigureCard
      fig="图 9 · 互联网发展年表"
      title="四件展品，一条时间线"
      subtitle="轨道聚光灯按 1969 → 1983 → 1990s → 2007 依次停在展品上；年份与事件取自本章正文。"
      readout={
        <>
          {item.year} · {item.event} · 展品 {current + 1}/{EXHIBITS.length}
        </>
      }
      running={running}
      onToggle={() => setRunning((r) => !r)}
      onReset={() => {
        setT(0)
        setRunning(false)
      }}
      caption={
        <>
          1969 年第一个 ARPAnet 节点运行；1983 年 TCP/IP 部署、DNS 定义，成为互联网的分水岭；1990s Web 随 Mosaic / Netscape
          走向大众；2007 年约 5 亿台主机，无线与移动性兴起。
        </>
      }
    >
      <Scene width={W} height={H} label="从 ARPAnet 到商业化互联网的博物馆陈列台" svg={svg} />
    </FigureCard>
  )
}
