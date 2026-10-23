// ============================================================
// 图解：互联网的“网、机、线”组成（k1.1.1）
// 等距网络工作台：4 台端系统 → 4 条真实网线 → 1 台分组交换机
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 820
const H = 470
const CYCLE = 4
const BENCH = { x: -260, y: -120, w: 520, d: 240, r: 10 }
const FLOOR_Z = -124
const HOSTS = 4
const LINKS = 4
const SWITCHES = 1

type P3 = k.Point3

const PORTS = [-20, -2, 16, 34, 52, 66]

// 每条链路：端系统接口 → 桌面上弯曲走线 → 交换机端口
const ROUTES: { points: P3[]; port: number }[] = [
  { port: -20, points: [[-100, -43, 3], [-78, 20, 3], [-60, 85, 3], [-20, 52, 3]] },
  { port: -2, points: [[-150, 70, 3], [-105, 95, 3], [-55, 98, 3], [-2, 52, 3]] },
  { port: 34, points: [[180, -34, 3], [150, -8, 3], [150, 76, 3], [34, 76, 3], [34, 52, 3]] },
  { port: 52, points: [[203, 60, 3], [190, 92, 3], [60, 90, 3], [52, 52, 3]] },
]

const P = k.fitProjection(
  [
    ...k.boxCorners(BENCH, FLOOR_Z, 0),
    [-216, -62, 58],
    [20, 62, 30],
    [228, 84, 8],
    [-238, -114, 69],
  ],
  W,
  H,
  { pad: 14, azimuth: 34, elevation: 30 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: P3) => k.iso(p, P)

function smooth(points: P3[], per = 7): P3[] {
  if (points.length < 3) return points
  const p: P3[] = [points[0], ...points, points[points.length - 1]]
  const out: P3[] = []
  for (let i = 1; i < p.length - 2; i++) {
    const p0 = p[i - 1], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2]
    for (let j = 0; j < per; j++) {
      const s = j / per, s2 = s * s, s3 = s2 * s
      const f = (a: number, b: number, c: number, d: number) =>
        0.5 * (2 * b + (-a + c) * s + (2 * a - 5 * b + 4 * c - d) * s2 + (-a + 3 * b - 3 * c + d) * s3)
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1]), f(p0[2], p1[2], p2[2], p3[2])])
    }
  }
  out.push(points[points.length - 1])
  return out
}

const CURVES = ROUTES.map((route) => smooth(route.points, 9))
const CURVE_DATA = CURVES.map((curve) => {
  const cum = [0]
  for (let i = 1; i < curve.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(curve[i][0] - curve[i - 1][0], curve[i][1] - curve[i - 1][1], curve[i][2] - curve[i - 1][2]))
  }
  return { curve, cum, total: cum[cum.length - 1] }
})

function pointAlong(data: { curve: P3[]; cum: number[]; total: number }, f: number): P3 {
  const target = Math.max(0, Math.min(1, f)) * data.total
  let i = 1
  while (i < data.curve.length - 1 && data.cum[i] < target) i++
  const span = data.cum[i] - data.cum[i - 1] || 1
  const u = (target - data.cum[i - 1]) / span
  const a = data.curve[i - 1], b = data.curve[i]
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]
}

const faceRect = (x0: number, x1: number, y: number, z0: number, z1: number, fill: string, stroke = 'none') =>
  `<path d="${k.pathOf(
    [
      [x0, y, z0],
      [x1, y, z0],
      [x1, y, z1],
      [x0, y, z1],
    ].map((p) => k.iso(p as P3, P)),
    true,
  )}" style="fill:${fill};stroke:${stroke};stroke-width:var(--anatomy-weight)"/>`

function cable(curve: P3[], width = 3.4) {
  const d = k.pathOf(curve.map((p) => at(p)))
  return (
    `<path d="${d}" fill="none" stroke="var(--anatomy-shade-0)" stroke-width="${width + 2.6}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="var(--anatomy-lo)" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="var(--anatomy-mid)" stroke-width="${Math.max(0.8, width * 0.3)}" opacity=".55" stroke-linecap="round" stroke-linejoin="round" transform="translate(-0.7 -0.9)"/>`
  )
}

function connector(p: P3) {
  return (
    S(k.slabOf({ x: p[0] - 3.4, y: p[1] - 3.4, w: 6.8, d: 6.8, r: 1.2 }, Math.max(0, p[2] - 1.8), 3.2, P, 3, 0.4), { tone: 'lo' }) +
    S(k.slabOf({ x: p[0] - 1.5, y: p[1] - 1.5, w: 3, d: 3, r: 0.6 }, p[2] + 1.4, 2, P, 2), { tone: 'mid' })
  )
}

function packet(p: P3) {
  const [sx, sy] = at(p)
  return (
    `<circle cx="${sx}" cy="${sy - 5}" r="8" fill="var(--anatomy-blue)" opacity=".2"/>` +
    `<g style="--anatomy-paper:#dce6f5;--anatomy-face:#e9f1fc;--anatomy-top:#f6f9ff;--anatomy-shade-0:#7d8ea8;--anatomy-shade-1:#93a5bf;--anatomy-shade-2:#aab9d1;--anatomy-shade-3:#c3d0e4;--anatomy-lit:#ffffff">` +
    S(k.slabOf({ x: p[0] - 3.4, y: p[1] - 3.4, w: 6.8, d: 6.8, r: 1.2 }, p[2] + 1.1, 4.2, P, 3, 0.6), { tone: 'hi', lit: true }) +
    `</g>` +
    L(k.lineOnTop([p[0] - 1.5, p[1]], [p[0] + 1.5, p[1]], p[2] + 5.5, P), { tone: 'blue' })
  )
}

function buildBase(): string {
  const out: string[] = []
  out.push(S(k.slabOf({ x: -300, y: -150, w: 600, d: 300, r: 14 }, FLOOR_Z, 6, P, 10), { tone: 'lo' }))

  // 工作台：四条腿、脚垫、横撑、下层搁板、前挡板、台面
  for (const x of [-232, 232]) {
    for (const y of [-96, 96]) {
      out.push(S(k.slabOf({ x: x - 8, y: y - 8, w: 16, d: 16, r: 2 }, FLOOR_Z + 6, 112, P, 3, 0.6), { tone: 'mid' }))
      out.push(S(k.slabOf({ x: x - 11, y: y - 11, w: 22, d: 22, r: 2 }, FLOOR_Z + 6, 5, P, 3, 0.5), { tone: 'lo' }))
    }
  }
  for (const y of [-96, 88]) {
    out.push(S(k.slabOf({ x: -224, y, w: 448, d: 8, r: 2 }, -66, 6, P, 3), { tone: 'mid' }))
  }
  out.push(S(k.slabOf({ x: -238, y: -112, w: 476, d: 224, r: 6 }, -90, 6, P, 6), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -252, y: 100, w: 504, d: 12, r: 3 }, -26, 16, P, 4, 0.6), { tone: 'mid' }))
  out.push(S(k.slabOf(BENCH, -10, 10, P, 8, 1), { tone: 'mid' }))

  // 靠背穿孔板 + 顶沿 + 挂钩
  out.push(S(k.slabOf({ x: -238, y: -118, w: 476, d: 6, r: 2 }, 0, 64, P, 3, 0.5), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: -242, y: -121, w: 484, d: 8, r: 2 }, 62, 5, P, 3, 0.5), { tone: 'mid' }))
  const holes: [number, number, number][] = []
  for (let x = -220; x <= 220; x += 28) {
    for (let z = 12; z <= 56; z += 14) holes.push([x, -111.7, z])
  }
  out.push(k.dotsSvg(holes.map((p) => k.iso(p, P)), { size: 0.9, tone: 'lo' }))
  for (const x of [-80, 70]) {
    out.push(S(k.slabOf({ x: x - 5, y: -116, w: 10, d: 6, r: 1 }, 44, 3, P, 2), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: x - 1, y: -114, w: 2, d: 4, r: 0.5 }, 38, 8, P, 2), { tone: 'lo' }))
  }

  // 插线板：4 个插座、总开关、电源线
  out.push(S(k.slabOf({ x: -20, y: -110, w: 112, d: 20, r: 3 }, 0, 8, P, 4, 0.5), { tone: 'mid' }))
  for (let i = 0; i < 4; i++) {
    const x = -10 + i * 24
    out.push(`<path d="${k.planOutline({ x: x - 7, y: -104, w: 14, d: 8, r: 2 }, 8.2, P)}" style="fill:#0a0f14;stroke:var(--anatomy-faint);stroke-width:var(--anatomy-weight)"/>`)
  }
  out.push(S(k.slabOf({ x: 79, y: -106, w: 8, d: 8, r: 2 }, 8, 3, P, 3), { tone: 'hi' }))
  out.push(L(k.segment([-16, -110, 4], [-42, -128, 4], P), { tone: 'lo' }))

  // 线轴
  out.push(S(k.cylinder(115, -86, 14, 0, 2, P, 20), { tone: 'mid' }))
  out.push(S(k.cylinder(115, -86, 5, 2, 9, P, 14), { tone: 'lo' }))
  out.push(S(k.cylinder(115, -86, 14, 11, 2, P, 20), { tone: 'mid' }))
  for (const z of [3, 6, 9]) out.push(L(k.ring(115, -86, 9, z, P, 20), { tone: 'mid' }))

  // 工具箱：箱体、盖、提手、锁扣
  out.push(S(k.slabOf({ x: -252, y: -84, w: 34, d: 24, r: 2 }, 0, 14, P, 3, 0.6), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -254, y: -86, w: 38, d: 28, r: 3 }, 14, 4, P, 3, 0.5), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: -243, y: -74, w: 16, d: 4, r: 2 }, 18, 4, P, 2), { tone: 'mid' }))
  out.push(k.dotsSvg([at([-246, -59.8, 9]), at([-224, -59.8, 9])], { size: 1, tone: 'mid' }))
  // 马克杯：杯身、杯口、把手
  out.push(S(k.cylinder(-240, 40, 6, 0, 10, P, 16), { tone: 'mid' }))
  out.push(L(k.ring(-240, 40, 4.6, 10.1, P, 16), { tone: 'faint' }))
  out.push(S(k.slabOf({ x: -233, y: 37, w: 5, d: 6, r: 2 }, 3, 5, P, 2), { tone: 'mid' }))
  // 挂在孔板上的成卷网线
  for (const [dx, zTop] of [[-96, 40], [-87, 40], [-78, 40]] as const) {
    out.push(
      cable(
        [
          [dx, -111, zTop],
          [dx - 7, -111, zTop - 13],
          [dx, -111, zTop - 25],
          [dx + 7, -111, zTop - 13],
          [dx, -111, zTop],
        ],
        2.4,
      ),
    )
  }

  // 台式机主机
  out.push(S(k.slabOf({ x: -108, y: -88, w: 36, d: 46, r: 3 }, 0, 52, P, 4, 0.8), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: -104, y: -44.6, w: 28, d: 2, r: 1 }, 27, 4, P, 3), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: -104, y: -44.6, w: 28, d: 2, r: 1 }, 34, 4, P, 3), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: -104, y: -44.6, w: 12, d: 2, r: 1 }, 42, 3, P, 3), { tone: 'lo' }))
  out.push(k.dotsSvg([at([-96, -44.1, 47])], { size: 1.1, tone: 'hi' }))
  const fan = at([-69.6, -65, 35])
  out.push(`<circle cx="${fan[0]}" cy="${fan[1]}" r="8.5" fill="none" stroke="var(--anatomy-faint)" stroke-width="1"/>`)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    out.push(L(`M${fan[0]},${fan[1]}L${fan[0] + Math.cos(a) * 7},${fan[1] + Math.sin(a) * 7}`, { tone: 'faint' }))
  }
  for (let i = 0; i < 3; i++) {
    out.push(L(k.segment([-69.6, -80 + i * 9, 16], [-69.6, -72 + i * 9, 16], P), { tone: 'faint' }))
  }
  out.push(S(k.slabOf({ x: -110, y: -86, w: 6, d: 6, r: 1 }, 0, 3, P, 2), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: -76, y: -50, w: 6, d: 6, r: 1 }, 0, 3, P, 2), { tone: 'lo' }))

  // 显示器：底座、立柱、厚面板、屏幕
  out.push(S(k.slabOf({ x: -208, y: -38, w: 50, d: 26, r: 5 }, 0, 3, P, 4, 0.6), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -189, y: -46, w: 10, d: 10, r: 2 }, 3, 12, P, 3, 0.4), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -216, y: -62, w: 66, d: 8, r: 2 }, 14, 42, P, 3, 0.8), { tone: 'hi' }))
  out.push(faceRect(-209, -160, -53.7, 20, 51, '#0a1017'))
  out.push(faceRect(-205, -190, -53.5, 44, 49, 'rgba(90,150,255,.14)', 'var(--anatomy-blue)'))
  out.push(faceRect(-188, -164, -53.5, 44, 49, 'rgba(90,150,255,.08)', 'var(--anatomy-blue)'))
  for (const z of [38, 33, 28]) out.push(L(k.pathOf([k.iso([-205, -53.4, z], P), k.iso([-170 + (z % 9), -53.4, z], P)]), { tone: 'blue' }))
  out.push(k.dotsSvg([at([-160, -53.5, 22])], { size: 1, tone: 'hi' }))

  // 笔记本：底座、键盘、触控板、立起的屏幕、铰链
  out.push(S(k.slabOf({ x: -222, y: 32, w: 74, d: 50, r: 4 }, 0, 5, P, 4, 0.8), { tone: 'hi' }))
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      out.push(S(k.slabOf({ x: -216 + c * 10, y: 38 + r * 6.6, w: 8, d: 5, r: 1 }, 5, 1, P, 2), { tone: 'mid' }))
    }
  }
  out.push(S(k.slabOf({ x: -207, y: 63, w: 26, d: 13, r: 2 }, 5, 0.8, P, 3), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -222, y: 32, w: 74, d: 5, r: 2 }, 5, 34, P, 3, 0.6), { tone: 'hi' }))
  out.push(faceRect(-216, -158, 37.15, 10, 36, '#0a1017'))
  out.push(faceRect(-212, -184, 37.3, 30, 34, 'rgba(90,150,255,.12)', 'var(--anatomy-blue)'))
  out.push(faceRect(-180, -162, 37.3, 30, 34, 'rgba(90,150,255,.07)', 'var(--anatomy-blue)'))
  for (const z of [25, 21, 17]) out.push(L(k.pathOf([k.iso([-212, 37.4, z], P), k.iso([-172, 37.4, z], P)]), { tone: 'blue' }))
  out.push(S(k.slabOf({ x: -220, y: 30, w: 8, d: 6, r: 2 }, 4, 5, P, 2), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -156, y: 30, w: 8, d: 6, r: 2 }, 4, 5, P, 2), { tone: 'mid' }))

  // 手机：平放、屏幕、摄像头、扬声器条
  out.push(S(k.slabOf({ x: 202, y: 42, w: 26, d: 42, r: 5 }, 0, 2.4, P, 4, 0.5), { tone: 'hi' }))
  out.push(`<path d="${k.planOutline({ x: 205, y: 45, w: 20, d: 36, r: 4 }, 2.5, P)}" style="fill:#0a1017;stroke:var(--anatomy-faint);stroke-width:var(--anatomy-weight)"/>`)
  out.push(k.dotsSvg([at([215, 47.6, 2.6])], { size: 1.1, tone: 'lo' }))
  out.push(L(k.lineOnTop([210, 79], [220, 79], 2.6, P), { tone: 'mid' }))

  // NAS / 小型服务器：机身、4 个盘位、指示灯、顶盖散热缝
  out.push(S(k.slabOf({ x: 145, y: -95, w: 70, d: 52, r: 3 }, 0, 42, P, 4, 0.8), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: 150, y: -43.4, w: 60, d: 1.6, r: 1 }, 6, 30, P, 3), { tone: 'lo' }))
  for (let i = 0; i < 4; i++) {
    out.push(S(k.slabOf({ x: 153 + i * 14, y: -42.2, w: 10, d: 1.4, r: 1 }, 8, 20, P, 2), { tone: 'mid' }))
    out.push(k.dotsSvg([at([158 + i * 14, -41.4, 31])], { size: 1, tone: 'hi' }))
  }
  out.push(L(k.lineOnTop([168, -41.5], [212, -41.5], 33, P), { tone: 'faint' }))
  for (let y = -84; y <= -58; y += 6) out.push(L(k.lineOnTop([150, y], [210, y], 42.1, P), { tone: 'faint' }))
  out.push(S(k.slabOf({ x: 147, y: -93, w: 6, d: 6, r: 1 }, 0, 3, P, 2), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: 207, y: -55, w: 6, d: 6, r: 1 }, 0, 3, P, 2), { tone: 'lo' }))

  // 分组交换机：厚机身、散热格栅、前面板、6 个端口、橡胶脚垫
  for (const [x, y] of [[-24, -4], [62, -4], [-24, 40], [62, 40]]) {
    out.push(S(k.slabOf({ x, y, w: 10, d: 8, r: 2 }, 0, 3, P, 2), { tone: 'lo' }))
  }
  out.push(S(k.slabOf({ x: -30, y: -10, w: 100, d: 60, r: 4 }, 3, 15, P, 4, 0.8), { tone: 'mid' }))
  for (let y = -2; y <= 42; y += 5) out.push(L(k.lineOnTop([-24, y], [64, y], 18.1, P), { tone: 'faint' }))
  out.push(faceRect(-26, 66, 50.15, 5, 17, 'var(--anatomy-shade-1)'))
  for (const px of PORTS) {
    out.push(S(k.slabOf({ x: px - 4, y: 50.1, w: 8, d: 1.8, r: 1 }, 6.4, 7, P, 2), { tone: 'lo' }))
    out.push(faceRect(px - 2.6, px + 2.6, 52, 7.6, 12.3, '#05080c'))
  }
  out.push(k.dotsSvg([at([-26, 52.2, 15])], { size: 1.2, tone: 'hi' }))
  out.push(k.faceTextSvg(k.topMatrix([-24, 34], 18.1, P), 'SW-8', { size: 4, tone: 'mid' }))

  // 机箱端口、连接器与线缆
  out.push(connector([-100, -43, 3]))
  out.push(connector([-150, 70, 3]))
  out.push(connector([180, -34, 3]))
  out.push(connector([203, 60, 3]))
  out.push(connector([-20, 52, 3]))
  out.push(connector([-2, 52, 3]))
  out.push(connector([34, 52, 3]))
  out.push(connector([52, 52, 3]))
  for (const curve of CURVES) out.push(cable(curve))
  // 理线夹
  for (const [i, f] of [[0, 0.55], [1, 0.55], [2, 0.5], [3, 0.5]] as const) {
    const p = pointAlong(CURVE_DATA[i], f)
    out.push(S(k.slabOf({ x: p[0] - 4, y: p[1] - 1.6, w: 8, d: 3.2, r: 1 }, 3.2, 2.4, P, 2), { tone: 'mid' }))
  }

  // 标签贴在台面 / 物体表面
  const l1 = at([-238, 84, 0.8])
  out.push(`<text class="iso-face-text" data-tone="hi" x="${l1[0]}" y="${l1[1]}" font-size="10" text-anchor="end">端系统 ×${HOSTS}</text>`)
  const l2 = at([96, 112, 0.8])
  out.push(`<text class="iso-face-text" data-tone="hi" x="${l2[0]}" y="${l2[1]}" font-size="10" text-anchor="middle">通信链路</text>`)
  const l3 = at([20, 66, 0.8])
  out.push(`<text class="iso-face-text" data-tone="hi" x="${l3[0]}" y="${l3[1]}" font-size="10" text-anchor="middle">分组交换机</text>`)
  return out.join('')
}

const BASE = buildBase()

export default function NutsFigure() {
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())

  const live = useMemo(() => {
    const out: string[] = []
    ROUTES.forEach((route, i) => {
      const f = ((t / CYCLE) + i * 0.21) % 1
      const p = pointAlong(CURVE_DATA[i], f)
      const alpha = Math.min(1, f * 12, (1 - f) * 18)
      out.push(`<g opacity="${alpha.toFixed(3)}">${packet(p)}</g>`)
      void route
    })
    PORTS.forEach((px) => {
      const linked = ROUTES.findIndex((r) => r.port === px)
      let glow = 0.18
      if (linked >= 0) {
        const f = ((t / CYCLE) + linked * 0.21) % 1
        glow = 0.18 + 0.82 * Math.exp(-(1 - f) * 16)
      } else {
        glow = 0.14 + 0.4 * (0.5 + 0.5 * Math.sin(t * 2.4 + px))
      }
      const q = at([px, 52.2, 15])
      out.push(`<circle cx="${q[0]}" cy="${q[1]}" r="1.7" fill="var(--anatomy-green)" opacity="${glow.toFixed(2)}"/>`)
      if (glow > 0.55) {
        out.push(`<circle cx="${q[0]}" cy="${q[1]}" r="4.4" fill="var(--anatomy-green)" opacity="${(glow * 0.16).toFixed(2)}"/>`)
      }
    })
    return out.join('')
  }, [t])

  return (
    <FigureCard
      fig="图 5 · 网、机、线"
      title="端系统、通信链路与分组交换机"
      subtitle="电脑、笔记本、手机和 NAS 都是端系统；它们由真实网线经端口连到同一台分组交换机。"
      readout={
        <>
          端系统 {HOSTS} · 通信链路 {LINKS} · 分组交换机 {SWITCHES} · 在途分组 {LINKS}
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
          端系统生成数据；链路以带宽搬运比特；分组交换机把完整分组从入端口转发到出端口。图中四台端系统各用一条链路接入一台八口交换机（四条在用、两条空闲），端口指示灯随分组到达而亮起。
        </>
      }
    >
      <Scene width={W} height={H} label="网络工作台：端系统、网线与分组交换机" svg={BASE + live} />
    </FigureCard>
  )
}
