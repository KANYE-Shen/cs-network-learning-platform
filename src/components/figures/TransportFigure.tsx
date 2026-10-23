// ============================================================
// 图解：传输层服务概览（k3.1.1）——两栋公寓楼 = 两台主机
// 亮灯房间 = 进程；楼前公路 = 主机到主机；两端邮局 = 传输层复用/分用
// 数值与正文一致：源端口 9157/5775 → 目的端口 6428/8080
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 460
const H = 340
const CYCLE = 20

const GROUND = { x: -225, y: -64, w: 450, d: 180, r: 10 }
const BLD_A = { x: -218, y: -58, w: 68, d: 108, r: 2 }
const BLD_B = { x: 150, y: -58, w: 68, d: 108, r: 2 }
const PO_A = { x: -192, y: 44, w: 42, d: 40, r: 2 }
const PO_B = { x: 150, y: 44, w: 42, d: 40, r: 2 }
const ROAD = { x: -200, y: 88, w: 400, d: 24, r: 3 }
const XA = -171
const XB = 171
const SHAFT_A = -180
const SHAFT_B = 180

type Room = { x: number; z: number; port: number; tone: 'blue' | 'green' | 'amber' }

const ROOMS_A: Room[] = [
  { x: -202, z: 47, port: 9157, tone: 'blue' },
  { x: -164, z: 81, port: 5775, tone: 'green' },
  { x: -202, z: 81, port: 5520, tone: 'amber' },
  { x: -164, z: 47, port: 6100, tone: 'amber' },
]
const ROOMS_B: Room[] = [
  { x: 192, z: 47, port: 6428, tone: 'blue' },
  { x: 208, z: 81, port: 8080, tone: 'green' },
  { x: 192, z: 81, port: 443, tone: 'amber' },
  { x: 208, z: 47, port: 53, tone: 'amber' },
]

const P = k.fitProjection(
  [
    ...k.boxCorners(GROUND, -8, 0),
    ...k.boxCorners(BLD_A, 0, 112),
    ...k.boxCorners(BLD_B, 0, 112),
    ...k.boxCorners(ROAD, 0, 4),
    [-200, 112, 12],
    [200, 112, 12],
  ],
  W,
  H,
  { pad: 8, azimuth: 30, elevation: 30 },
)

const S = (p: k.SolidPaths, s?: k.SolidStyle) => k.solidSvg(p, s)
const L = (d: string, s?: k.LineStyle) => k.lineSvg(d, s)
const at = (p: [number, number, number]) => k.iso(p, P)
const quad = (pts: [number, number, number][]) => k.pathOf(k.pointsAt(pts, P), true)
const txt = (x: number, y: number, text: string, size = 10) =>
  `<text class="iso-face-text" data-tone="hi" x="${x}" y="${y}" font-size="${size}" text-anchor="middle">${text}</text>`

const WARM: Record<Room['tone'], string> = { blue: '#8ab5ff', green: '#83f0b8', amber: '#f4c56d' }
const CONCRETE =
  '--anatomy-paper:#262d35;--anatomy-face:#323b45;--anatomy-top:#3d4853;--anatomy-shade-0:#1e242a;--anatomy-shade-1:#242b32;--anatomy-shade-2:#2a323b;--anatomy-shade-3:#303a44'
const POST =
  '--anatomy-paper:#2b333c;--anatomy-face:#38424d;--anatomy-top:#434e5a;--anatomy-shade-0:#222930;--anatomy-shade-1:#283039;--anatomy-shade-2:#2e3741;--anatomy-shade-3:#343e49'

function windowY(x0: number, x1: number, z0: number, z1: number, y: number, tone: Room['tone'] | null) {
  const out: string[] = []
  const pts: [number, number, number][] = [
    [x0, y, z0],
    [x1, y, z0],
    [x1, y, z1],
    [x0, y, z1],
  ]
  out.push(`<path d="${quad(pts)}" fill="${tone ? WARM[tone] : '#0d1116'}" opacity="${tone ? 0.88 : 0.9}"/>`)
  out.push(L(quad(pts), { tone: tone ? 'hi' : 'faint' }))
  const mx = (x0 + x1) / 2
  out.push(L(k.segment([mx, y, z0], [mx, y, z1], P), { tone: 'faint' }))
  out.push(L(k.segment([x0, y, (z0 + z1) / 2], [x1, y, (z0 + z1) / 2], P), { tone: 'faint' }))
  // 窗台（实体，贴墙外挑）
  out.push(S(k.slabOf({ x: x0 - 1.4, y, w: x1 - x0 + 2.8, d: 2.6, r: 0.4 }, z0 - 2, 2, P, 3, 0.3), { tone: 'mid' }))
  return out.join('')
}

function windowX(y0: number, y1: number, z0: number, z1: number, x: number, tone: Room['tone'] | null) {
  const out: string[] = []
  const pts: [number, number, number][] = [
    [x, y0, z0],
    [x, y1, z0],
    [x, y1, z1],
    [x, y0, z1],
  ]
  out.push(`<path d="${quad(pts)}" fill="${tone ? WARM[tone] : '#0d1116'}" opacity="${tone ? 0.88 : 0.9}"/>`)
  out.push(L(quad(pts), { tone: tone ? 'hi' : 'faint' }))
  out.push(L(k.segment([x, (y0 + y1) / 2, z0], [x, (y0 + y1) / 2, z1], P), { tone: 'faint' }))
  out.push(S(k.slabOf({ x, y: y0 - 1.4, w: 2.6, d: y1 - y0 + 2.8, r: 0.4 }, z0 - 2, 2, P, 3, 0.3), { tone: 'mid' }))
  return out.join('')
}

/** 一条外墙信件滑槽：底板 + 外侧护栏，贴在 +y 墙面 */
function trough(x0: number, x1: number, top: number) {
  const out: string[] = []
  out.push(S(k.slabOf({ x: x0, y: 51.5, w: x1 - x0, d: 5, r: 0.4 }, top - 2, 2, P, 3, 0.3), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: x0, y: 56.2, w: x1 - x0, d: 1.2, r: 0.2 }, top, 4.5, P, 2), { tone: 'mid' }))
  for (let x = x0 + 4; x < x1 - 2; x += 8) {
    out.push(L(k.segment([x, 53, top], [x, 53, top + 3.4], P), { tone: 'faint' }))
  }
  return out.join('')
}

/** 竖直信件井：背板 + 两侧板，正面敞开，信件可见 */
function shaft(cx: number, top: number) {
  const out: string[] = []
  out.push(S(k.slabOf({ x: cx - 4, y: 47.4, w: 8, d: 1.4, r: 0.2 }, 30, top - 30, P, 2), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: cx - 4, y: 48.6, w: 1.3, d: 7.4, r: 0.2 }, 30, top - 30, P, 2), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: cx + 2.7, y: 48.6, w: 1.3, d: 7.4, r: 0.2 }, 30, top - 30, P, 2), { tone: 'mid' }))
  for (const z of [46, 62, 78, 94]) {
    out.push(L(k.segment([cx - 4, 48.6, z], [cx + 4, 48.6, z], P), { tone: 'faint' }))
  }
  return out.join('')
}

function building(plan: typeof BLD_A, rooms: Room[], outerX: number, darkSide: boolean) {
  const out: string[] = []
  const { x, y, w, d } = plan
  // 基座、主体、压顶、女儿墙
  out.push(S(k.slabOf({ x: x - 3, y: y - 3, w: w + 6, d: d + 6, r: 3 }, 0, 5, P, 4, 0.6), { tone: 'lo' }))
  out.push(S(k.slabOf(plan, 5, 99, P, 4, 1.1), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x - 2, y: y - 2, w: w + 4, d: d + 4, r: 2 }, 104, 4, P, 4, 0.5), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: x, y: y + d - 3, w: w, d: 5, r: 1 }, 108, 6, P, 3, 0.4), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x, y, w, d: 4, r: 1 }, 108, 6, P, 3, 0.4), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: x + w - 3, y, w: 5, d, r: 1 }, 108, 6, P, 3, 0.4), { tone: 'mid' }))
  out.push(S(k.slabOf({ x, y, w: 4, d, r: 1 }, 108, 6, P, 3, 0.4), { tone: 'lo' }))
  // 楼层线、角柱
  for (const z of [5, 31, 57, 83]) {
    out.push(L(k.segment([x, y + d, z], [x + w, y + d, z], P), { tone: 'faint' }))
    out.push(L(k.segment([x + w, y, z], [x + w, y + d, z], P), { tone: 'faint' }))
  }
  for (const [px, py] of [
    [x + 1.5, y + d - 1.5],
    [x + w - 1.5, y + d - 1.5],
    [x + w - 1.5, y + 1.5],
  ]) {
    out.push(S(k.cylinder(px, py, 1.8, 5, 99, P, 10), { tone: 'lo' }))
  }
  // 屋顶水箱、通风帽、天线
  out.push(S(k.cylinder(x + w * 0.32, y + d * 0.52, 8, 108, 12, P, 22), { tone: 'mid' }))
  out.push(S(k.cylinder(x + w * 0.32, y + d * 0.52, 9.2, 120, 2, P, 22), { tone: 'hi' }))
  for (const [dx, dy] of [
    [-4, -4],
    [4, -4],
    [-4, 4],
    [4, 4],
  ]) {
    out.push(S(k.cylinder(x + w * 0.32 + dx, y + d * 0.52 + dy, 1.3, 108, 8, P, 8), { tone: 'lo' }))
  }
  out.push(S(k.cylinder(x + w * 0.72, y + 12, 4.5, 108, 5, P, 16), { tone: 'lo' }))
  out.push(L(k.segment([x + w * 0.5, y + 10, 108], [x + w * 0.5, y + 10, 130], P), { tone: 'mid' }))
  out.push(L(k.segment([x + w * 0.5 - 5, y + 10, 128], [x + w * 0.5 + 5, y + 10, 128], P), { tone: 'mid' }))
  // +y 立面窗
  for (const r of rooms) {
    const z0 = r.z - 9
    out.push(windowY(r.x - 8, r.x + 8, z0, z0 + 18, y + d, r.tone))
  }
  out.push(windowY(x + 8, x + 22, 33, 51, y + d, null))
  out.push(windowY(x + 8, x + 22, 61, 79, y + d, null))
  // 侧立面（+x）也开满房间窗
  for (const [a, b, tone] of [
    [y + 9, y + 27, 'amber'],
    [y + 58, y + 76, 'blue'],
  ] as const) {
    out.push(windowX(a, b, 38, 56, outerX, tone))
    out.push(windowX(a, b, 72, 90, outerX, tone === 'amber' ? 'amber' : 'green'))
  }
  if (darkSide) {
    out.push(windowX(y + 34, y + 50, 55, 73, outerX, null))
  }
  // 落水管
  out.push(S(k.cylinder(x + w - 2.2, y + d - 2.2, 1.1, 5, 99, P, 8), { tone: 'mid' }))
  // 入口门 + 雨棚 + 台阶
  const dx = x + w - 22
  out.push(`<path d="${quad([
    [dx - 7, y + d, 5],
    [dx + 7, y + d, 5],
    [dx + 7, y + d, 25],
    [dx - 7, y + d, 25],
  ])}" fill="#0d1116" opacity=".92"/>`)
  out.push(L(k.segment([dx, y + d, 5], [dx, y + d, 25], P), { tone: 'mid' }))
  out.push(L(quad([[dx - 7, y + d, 5], [dx + 7, y + d, 5], [dx + 7, y + d, 25], [dx - 7, y + d, 25]]), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: dx - 10, y: y + d, w: 20, d: 5, r: 0.5 }, 25, 2, P, 3, 0.3), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x + w / 2 - 18, y: y + d - 1, w: 36, d: 1.4, r: 0.4 }, 95, 8, P, 3, 0.3), { tone: 'hi' }))
  out.push(L(k.segment([x + w / 2 - 15, y + d + 0.5, 100], [x + w / 2 + 15, y + d + 0.5, 100], P), { tone: 'blue' }))
  return `<g style="${CONCRETE}">${out.join('')}</g>`
}

/** 邮局：分拣架 + 装卸台 + 屋顶料斗；shaftX 为信件井中心 */
function postOffice(plan: typeof PO_A, shaftX: number) {
  const out: string[] = []
  const { x, y, w, d } = plan
  const cx = x + w / 2
  out.push(S(k.slabOf({ x: x - 2, y: y - 2, w: w + 4, d: d + 4, r: 2 }, 0, 4, P, 3, 0.5), { tone: 'lo' }))
  out.push(S(k.slabOf(plan, 4, 26, P, 4, 0.9), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: x - 2, y: y - 2, w: w + 4, d: d + 4, r: 2 }, 30, 3, P, 4, 0.4), { tone: 'hi' }))
  // 正面卷帘门与门楣
  const doorPts: [number, number, number][] = [
    [cx - 9, y + d, 4],
    [cx + 9, y + d, 4],
    [cx + 9, y + d, 22],
    [cx - 9, y + d, 22],
  ]
  out.push(`<path d="${quad(doorPts)}" fill="#0d1116" opacity=".92"/>`)
  for (let z = 7; z < 22; z += 3) {
    out.push(L(k.segment([cx - 9, y + d, z], [cx + 9, y + d, z], P), { tone: 'faint' }))
  }
  out.push(L(quad(doorPts), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: cx - 12, y: y + d, w: 24, d: 5, r: 0.4 }, 23, 2, P, 3, 0.3), { tone: 'hi' }))
  // 装卸台与滚筒
  out.push(S(k.slabOf({ x: cx - 12, y: y + d, w: 24, d: 12, r: 0.5 }, 5, 5, P, 3, 0.4), { tone: 'lo' }))
  for (const ox of [-7, 0, 7]) {
    out.push(S(k.cylinder(cx + ox, y + d + 5, 2, 10, 2, P, 12), { tone: 'mid' }))
  }
  out.push(S(k.slabOf({ x: cx - 9, y: y + d + 10, w: 18, d: 8, r: 0.5 }, 8, 2, P, 3), { tone: 'mid' }))
  // 屋顶分拣架（鸽笼格）
  const rx = shaftX < cx ? cx + 2 : cx - 18
  out.push(S(k.slabOf({ x: rx, y: y + 8, w: 16, d: 3, r: 0.4 }, 33, 12, P, 2), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: rx, y: y + 26, w: 16, d: 3, r: 0.4 }, 33, 12, P, 2), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: rx, y: y + 8, w: 16, d: 21, r: 0.3 }, 33, 2, P, 2), { tone: 'mid' }))
  for (const ox of [0, 5.3, 10.6, 15.8]) {
    out.push(S(k.slabOf({ x: rx + ox - 0.4, y: y + 9, w: 0.8, d: 19, r: 0.2 }, 35, 9, P, 2), { tone: 'mid' }))
  }
  // 料斗（井底接件）
  out.push(S(k.slabOf({ x: shaftX - 5, y: 50, w: 10, d: 8, r: 0.6 }, 29, 4, P, 3, 0.4), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: shaftX - 3.5, y: 51.5, w: 7, d: 5, r: 0.4 }, 33, 2, P, 3), { tone: 'mid' }))
  // 门侧小灯
  out.push(S(k.cylinder(cx + 12, y + d - 0.5, 1.1, 18, 2, P, 8), { tone: 'hi', lit: true }))
  out.push(S(k.slabOf({ x: cx - 15, y: y + d - 3, w: 30, d: 1.4, r: 0.4 }, 33, 7, P, 3, 0.3), { tone: 'hi' }))
  return `<g style="${POST}">${out.join('')}</g>`
}

function truck(cx: number) {
  const out: string[] = []
  out.push(S(k.slabOf({ x: cx - 22, y: 92, w: 44, d: 16, r: 1 }, 5, 4, P, 3, 0.4), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: cx - 20, y: 92, w: 38, d: 16, r: 0.8 }, 9, 4, P, 3, 0.4), { tone: 'mid' }))
  // 货箱护栏
  for (const [x0, y0, w, d] of [
    [cx - 20, 92, 38, 1.2],
    [cx - 20, 106.8, 38, 1.2],
    [cx - 20, 92, 1.2, 16],
  ] as const) {
    out.push(S(k.slabOf({ x: x0, y: y0, w, d, r: 0.2 }, 13, 3, P, 2), { tone: 'mid' }))
  }
  // 驾驶室、挡风、车灯、轮
  out.push(S(k.slabOf({ x: cx + 12, y: 91, w: 15, d: 18, r: 1 }, 9, 15, P, 3, 0.5), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: cx + 12.5, y: 91.5, w: 14, d: 17, r: 1 }, 24, 2, P, 3), { tone: 'hi' }))
  out.push(`<path d="${quad([
    [cx + 27, 94, 14],
    [cx + 27, 106, 14],
    [cx + 27, 106, 21],
    [cx + 27, 94, 21],
  ])}" fill="#0d1116" opacity=".9"/>`)
  out.push(L(k.segment([cx + 27, 93, 12], [cx + 27, 107, 12], P), { tone: 'hi' }))
  for (const [ox, oy] of [
    [-15, 93],
    [-15, 107],
    [15, 93],
    [15, 107],
  ]) {
    out.push(S(k.cylinder(cx + ox, oy, 4, 0, 6, P, 16), { tone: 'faint' }))
  }
  out.push(k.dotsSvg([at([cx + 26.6, 96, 15.5]), at([cx + 26.6, 104, 15.5])], { size: 0.9, tone: 'hi' }))
  return out.join('')
}

function crate(x: number, y: number, z: number, tone: Room['tone']) {
  const out: string[] = []
  const lineTone: k.LineTone = tone === 'amber' ? 'hi' : tone
  out.push(S(k.slabOf({ x: x - 7, y: y - 4.5, w: 14, d: 9, r: 0.8 }, z - 4, 8, P, 3, 0.4), { tone: 'hi', lit: true }))
  // 标签牌（贴在箱子正面）
  out.push(`<path d="${quad([
    [x - 5.6, y + 4.5, z - 2.6],
    [x + 5.6, y + 4.5, z - 2.6],
    [x + 5.6, y + 4.5, z + 2.6],
    [x - 5.6, y + 4.5, z + 2.6],
  ])}" fill="#10151b" opacity=".9"/>`)
  out.push(L(quad([[x - 5.6, y + 4.5, z - 2.6], [x + 5.6, y + 4.5, z - 2.6], [x + 5.6, y + 4.5, z + 2.6], [x - 5.6, y + 4.5, z + 2.6]]), { tone: lineTone }))
  out.push(L(k.lineOnTop([x - 4.6, y], [x + 4.6, y], z + 4.1, P), { tone: lineTone }))
  return `<g style="--anatomy-paper:#b0976b;--anatomy-face:#c4ab7d;--anatomy-top:#d9c093;--anatomy-lit-top:#eed7ab;--anatomy-lit-shade:#b39a6d;--anatomy-shade-0:#8a7551;--anatomy-shade-1:#9c855d;--anatomy-shade-2:#ad946a;--anatomy-shade-3:#bea476">${out.join('')}</g>`
}

function pathAt(points: [number, number, number][], u: number): [number, number, number] {
  const spans: number[] = []
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!
    const b = points[i]!
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])
    spans.push(len)
    total += len
  }
  let target = Math.max(0, Math.min(1, u)) * total
  for (let i = 0; i < spans.length; i++) {
    if (target <= spans[i]!) {
      const a = points[i]!
      const b = points[i + 1]!
      const f = spans[i]! === 0 ? 0 : target / spans[i]!
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]
    }
    target -= spans[i]!
  }
  return points[points.length - 1]!
}

function aPath(room: Room): [number, number, number][] {
  const zl = room.z < 60 ? 37 : 71
  return [
    [room.x, 49, room.z],
    [room.x, 55, room.z],
    [room.x, 55, zl],
    [SHAFT_A, 55, zl],
    [SHAFT_A, 52, zl],
    [SHAFT_A, 52, 32],
  ]
}

function bPath(room: Room): [number, number, number][] {
  const zl = room.z < 60 ? 37 : 71
  return [
    [SHAFT_B, 52, 32],
    [SHAFT_B, 52, zl],
    [SHAFT_B, 55, zl],
    [room.x, 55, zl],
    [room.x, 55, room.z],
    [room.x, 49, room.z],
  ]
}

const ease = (x: number) => x * x * (3 - 2 * x)

export default function TransportFigure() {
  const [mode, setMode] = useState<'process' | 'host'>('process')
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const ph = t % CYCLE

  const svg = useMemo(() => {
    const out: string[] = []
    out.push(S(k.slabOf(GROUND, -8, 8, P, 10, 1), { tone: 'lo', halo: true }))
    // 楼前混凝土场坪与门到公路的步道
    out.push(`<g style="${CONCRETE}">`)
    out.push(S(k.slabOf({ x: -215, y: 48, w: 430, d: 62, r: 4 }, 0, 1.6, P, 6, 0.3), { tone: 'lo', crease: 'none' }))
    for (let x = -210; x < 212; x += 26) {
      out.push(L(k.lineOnTop([x, 50], [x, 108], 1.7, P), { tone: 'faint' }))
    }
    out.push(`</g>`)

    out.push(building(BLD_A, ROOMS_A, -150, false))
    out.push(building(BLD_B, ROOMS_B, 218, true))

    // 外墙滑槽（两层）
    out.push(trough(-218, -175, 34))
    out.push(trough(-218, -175, 68))
    out.push(trough(175, 218, 34))
    out.push(trough(175, 218, 68))

    // 邮局与竖直信件井
    out.push(postOffice(PO_A, SHAFT_A))
    out.push(postOffice(PO_B, SHAFT_B))
    out.push(shaft(SHAFT_A, 104))
    out.push(shaft(SHAFT_B, 104))

    // 公路：路面、路缘、标线、道钉
    out.push(
      `<g style="--anatomy-paper:#2d343c;--anatomy-face:#39424c;--anatomy-top:#47515c;--anatomy-shade-0:#252b32;--anatomy-shade-1:#2a3138;--anatomy-shade-2:#303840;--anatomy-shade-3:#353e47">`,
    )
    out.push(S(k.slabOf(ROAD, 0, 2.4, P, 4, 0.4), { tone: 'hi', crease: 'none' }))
    for (const y of [85, 112]) {
      out.push(S(k.slabOf({ x: ROAD.x, y, w: ROAD.w, d: 3, r: 1 }, 0, 5, P, 3, 0.4), { tone: 'hi' }))
    }
    out.push(`</g>`)
    out.push(L(k.lineOnTop([ROAD.x + 6, 90], [ROAD.x + ROAD.w - 6, 90], 2.6, P), { tone: 'mid' }))
    out.push(L(k.lineOnTop([ROAD.x + 6, 110], [ROAD.x + ROAD.w - 6, 110], 2.6, P), { tone: 'mid' }))
    for (let x = ROAD.x + 12; x < ROAD.x + ROAD.w - 8; x += 22) {
      out.push(L(k.lineOnTop([x, 100], [x + 11, 100], 2.6, P), { tone: 'hi' }))
    }
    for (let x = ROAD.x + 8; x < ROAD.x + ROAD.w; x += 32) {
      out.push(S(k.cylinder(x, 89.5, 1.4, 2, 1.6, P, 8), { tone: 'mid' }))
      out.push(S(k.cylinder(x, 110.5, 1.4, 2, 1.6, P, 8), { tone: 'mid' }))
    }

    // 路侧灯杆
    for (const lx of [-212, 212]) {
      out.push(S(k.cylinder(lx, 96, 4, 0, 3, P, 14), { tone: 'lo' }))
      out.push(S(k.cylinder(lx, 96, 1.5, 3, 32, P, 10), { tone: 'mid' }))
      out.push(S(k.slabOf({ x: lx - 2, y: 92, w: 4, d: 9, r: 0.4 }, 35, 1.6, P, 2), { tone: 'mid' }))
      out.push(S(k.slabOf({ x: lx - 3.5, y: 89, w: 7, d: 5, r: 0.5 }, 34, 2, P, 3), { tone: 'hi', lit: true }))
    }

    // 邮局同款装卸传送带（与车斗对接）
    for (const cx of [XA, XB]) {
      out.push(S(k.slabOf({ x: cx - 9, y: 83, w: 18, d: 13, r: 0.5 }, 9, 2, P, 3), { tone: 'mid' }))
      for (let yy = 85; yy < 96; yy += 4) {
        out.push(S(k.cylinder(cx, yy, 1.5, 11, 1.2, P, 8), { tone: 'lo' }))
      }
    }

    // 车辆
    let tx = XA
    if (ph >= 6 && ph < 11) tx = XA + (XB - XA) * ease((ph - 6) / 5)
    else if (ph >= 11 && ph < 16) tx = XB
    else if (ph >= 16) tx = XB + (XA - XB) * ease((ph - 16) / 4)
    out.push(truck(tx))

    // 运动主体：信件 / 密封主机数据包
    if (mode === 'process') {
      const aU = Math.min(1, ph / 4.2)
      if (ph < 4.2) {
        for (const room of ROOMS_A.slice(0, 2)) {
          const p = pathAt(aPath(room), aU)
          out.push(crate(p[0], p[1], p[2], room.tone))
        }
      }
      if (ph >= 5.4 && ph < 11.2) {
        out.push(crate(tx - 7, 100, 17, 'blue'))
        out.push(crate(tx + 7, 100, 17, 'green'))
      }
      if (ph >= 11.2 && ph < 16) {
        const bU = Math.min(1, (ph - 11.2) / 4.4)
        for (const room of ROOMS_B.slice(0, 2)) {
          const p = pathAt(bPath(room), bU)
          out.push(crate(p[0], p[1], p[2], room.tone))
        }
      }
    } else if (ph < 16) {
      out.push(S(k.slabOf({ x: tx - 10, y: 96, w: 20, d: 10, r: 0.6 }, 13, 10, P, 3, 0.4), { tone: 'hi', lit: true }))
      out.push(L(k.lineOnTop([tx - 7, 101], [tx + 7, 101], 23.2, P), { tone: 'blue' }))
    }

    // 四处标签：楼与邮局
    const la = at([-184, 51.5, 100])
    out.push(txt(la[0], la[1], '主机 A', 10))
    const lb = at([184, 51.5, 100])
    out.push(txt(lb[0], lb[1], '主机 B', 10))
    const pa = at([XA, 82.4, 37.6])
    out.push(txt(pa[0], pa[1], '复用邮局', 9))
    const pb = at([XB, 82.4, 37.6])
    out.push(txt(pb[0], pb[1], '分用邮局', 9))

    return out.join('')
  }, [ph, mode])

  const phaseText =
    mode === 'host'
      ? ph < 6
        ? '公路只读目的 IP，准备发车'
        : ph < 11
          ? '主机到主机：路由器只看到 IP'
          : ph < 16
            ? '到达目的主机，再交给传输层'
            : '空车返回'
      : ph < 4.2
        ? '复用：房间 → 邮局'
        : ph < 5.4
          ? '邮局把不同房间的信件装进同一辆车'
          : ph < 11.2
            ? '主机到主机：公路只认 IP'
            : ph < 16
              ? '分用：按目的端口送回房间'
              : '空车返回'

  const destA = ROOMS_A[0]!
  const destB = ROOMS_B[0]!
  const destA2 = ROOMS_A[1]!
  const destB2 = ROOMS_B[1]!

  return (
    <FigureCard
      fig="图 17 · 传输层服务概览"
      title="邮局把“主机到主机”变成“进程到进程”"
      subtitle="两栋楼是两台主机，亮灯房间是进程；楼前公路只负责主机之间送达，两端邮局用端口号把信件收发到具体房间。"
      readout={
        mode === 'process' ? (
          <>
            源端口 {destA.port}→目的端口 {destB.port}（P1→P3）· {destA2.port}→{destB2.port}（P2→P4）·
            端到端：是 · {phaseText}
          </>
        ) : (
          <>
            源 IP 10.0.0.5 → 目的 IP 10.0.0.20 · 端口号对网络层不可见 · 端到端：否（只到主机）· {phaseText}
          </>
        )
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
          onChange={(e) => {
            setMode(e.target.value as 'process' | 'host')
            setT(0)
          }}
          aria-label="选择观察层次"
        >
          <option value="process">进程到进程</option>
          <option value="host">主机到主机</option>
        </select>
      }
      caption={
        <>
          邮局 = 传输层：把 9157、5775 两个房间的信件复用进同一条公路，再在对面按目的端口 6428、8080
          分用回房间，这才是<strong>进程到进程</strong>。切到“主机到主机”后只剩 10.0.0.5 → 10.0.0.20
          的 IP 数据报，网络层看不到端口号；即便到了传输层，TCP/UDP 也<strong>不提供时延与带宽保证</strong>。
        </>
      }
    >
      <Scene width={W} height={H} label="传输层复用与分用：公寓楼、邮局与主机间公路" svg={svg} />
    </FigureCard>
  )
}
