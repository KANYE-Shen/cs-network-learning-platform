// ============================================================
// 图解：互联网整体结构——边缘、接入与核心（k1.2.1）
// 带院子的房子（边缘）→ 光纤接入线（接入）→ ISP 机房机架（核心）
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 900
const H = 460
const CYCLE = 9
const HW = { x0: -390, x1: -210, y0: -70, y1: 60 }
const EAVE_Z = 74
const RIDGE_Z = 104
const RIDGE_Y = -5
const EAVE_F = 72
const EAVE_B = -82
const POLE_Z = 86

type P3 = k.Point3

const P = k.fitProjection(
  [
    ...k.boxCorners({ x: -400, y: -120, w: 800, d: 240, r: 14 }, -8, 0),
    [HW.x0, HW.y1, EAVE_Z],
    [HW.x1, RIDGE_Y, RIDGE_Z + 4],
    [-120, 78, 94],
    [350, 60, 128],
    [124, 64, 128],
    [340, 60, 8],
  ],
  W,
  H,
  { pad: 12, azimuth: 34, elevation: 26 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: P3) => k.iso(p, P)

function smooth(points: P3[], per = 8): P3[] {
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

const CABLE_ROUTE: P3[] = [
  [-286, 88, 31],
  [-274, 96, 33],
  [-258, 86, 31],
  [-246, 74, 27],
  [-236, 66, 20],
  [-231, 66, 30],
  [-228, 68, 52],
  [-222, 71, 66],
  [-212, 73, 76],
  [-185, 75, 79],
  [-160, 76, 81],
  [-120, 78, 87],
  [-95, 78, 84],
  [-65, 78, 79],
  [-35, 78, 83],
  [-10, 78, 87],
  [18, 72, 80],
  [50, 66, 74],
  [85, 60, 68],
  [115, 56, 64],
  [145, 52, 63],
  [180, 46, 64],
  [215, 40, 65],
  [250, 38, 66],
]
const CABLE_CURVE = smooth(CABLE_ROUTE, 9)
const CABLE_CUM = [0]
for (let i = 1; i < CABLE_CURVE.length; i++) {
  CABLE_CUM.push(
    CABLE_CUM[i - 1] +
      Math.hypot(
        CABLE_CURVE[i][0] - CABLE_CURVE[i - 1][0],
        CABLE_CURVE[i][1] - CABLE_CURVE[i - 1][1],
        CABLE_CURVE[i][2] - CABLE_CURVE[i - 1][2],
      ),
  )
}
const CABLE_TOTAL = CABLE_CUM[CABLE_CUM.length - 1]

function pointAlong(f: number): P3 {
  const target = Math.max(0, Math.min(1, f)) * CABLE_TOTAL
  let i = 1
  while (i < CABLE_CURVE.length - 1 && CABLE_CUM[i] < target) i++
  const span = CABLE_CUM[i] - CABLE_CUM[i - 1] || 1
  const u = (target - CABLE_CUM[i - 1]) / span
  const a = CABLE_CURVE[i - 1], b = CABLE_CURVE[i]
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]
}

const face = (points: P3[], fill: string, stroke = 'var(--anatomy-lo)') =>
  `<path d="${k.pathOf(points.map((p) => at(p)), true)}" style="fill:${fill};stroke:${stroke};stroke-width:var(--anatomy-weight);stroke-linejoin:round"/>`

const faceY = (x0: number, x1: number, y: number, z0: number, z1: number, fill: string, stroke = 'none') =>
  face(
    [
      [x0, y, z0],
      [x1, y, z0],
      [x1, y, z1],
      [x0, y, z1],
    ],
    fill,
    stroke,
  )

const faceX = (y0: number, y1: number, x: number, z0: number, z1: number, fill: string, stroke = 'none') =>
  face(
    [
      [x, y0, z0],
      [x, y1, z0],
      [x, y1, z1],
      [x, y0, z1],
    ],
    fill,
    stroke,
  )

function ellipseY(cx: number, cz: number, r: number, y: number, fill: string, stroke = 'none', seg = 18) {
  const pts: P3[] = []
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2
    pts.push([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r])
  }
  return `<path d="${k.pathOf(pts.map(at), true)}" style="fill:${fill};stroke:${stroke};stroke-width:var(--anatomy-weight)"/>`
}

function ellipseX(cy: number, cz: number, r: number, x: number, fill: string, stroke = 'none', seg = 18) {
  const pts: P3[] = []
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2
    pts.push([x, cy + Math.cos(a) * r, cz + Math.sin(a) * r])
  }
  return `<path d="${k.pathOf(pts.map(at), true)}" style="fill:${fill};stroke:${stroke};stroke-width:var(--anatomy-weight)"/>`
}

function fanY(cx: number, cz: number, r: number, y: number) {
  let out = ellipseY(cx, cz, r, y, 'none', 'var(--anatomy-mid)')
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5
    out += L(
      k.pathOf([at([cx, y, cz]), at([cx + Math.cos(a) * r * 0.8, y, cz + Math.sin(a) * r * 0.8])]),
      { tone: 'mid' },
    )
  }
  out += ellipseY(cx, cz, 2.6, y, 'var(--anatomy-mid)')
  return out
}

function fanX(cy: number, cz: number, r: number, x: number) {
  let out = ellipseX(cy, cz, r, x, 'none', 'var(--anatomy-mid)')
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5
    out += L(
      k.pathOf([at([x, cy, cz]), at([x, cy + Math.cos(a) * r * 0.8, cz + Math.sin(a) * r * 0.8])]),
      { tone: 'mid' },
    )
  }
  out += ellipseX(cy, cz, 2.6, x, 'var(--anatomy-mid)')
  return out
}

function cable(points: P3[], width = 3.4, tone = 'var(--anatomy-lo)') {
  const d = k.pathOf(points.map(at))
  return (
    `<path d="${d}" fill="none" stroke="var(--anatomy-shade-0)" stroke-width="${width + 2.4}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" style="stroke:${tone};stroke-width:${width}" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<path d="${d}" fill="none" stroke="var(--anatomy-mid)" stroke-width="${Math.max(0.7, width * 0.28)}" opacity=".5" stroke-linecap="round" stroke-linejoin="round" transform="translate(-0.6 -0.8)"/>`
  )
}

function packet(p: P3) {
  const [sx, sy] = at(p)
  return (
    `<circle cx="${sx}" cy="${sy - 7}" r="11" fill="var(--anatomy-blue)" opacity=".22"/>` +
    `<g style="--anatomy-paper:#dce6f5;--anatomy-face:#e9f1fc;--anatomy-top:#f6f9ff;--anatomy-shade-0:#7d8ea8;--anatomy-shade-1:#93a5bf;--anatomy-shade-2:#aab9d1;--anatomy-shade-3:#c3d0e4;--anatomy-lit:#ffffff">` +
    S(k.slabOf({ x: p[0] - 4.2, y: p[1] - 4.2, w: 8.4, d: 8.4, r: 1.4 }, p[2] + 1, 5, P, 3, 0.6), { tone: 'hi', lit: true }) +
    `</g>` +
    L(k.lineOnTop([p[0] - 2, p[1]], [p[0] + 2, p[1]], p[2] + 6.4, P), { tone: 'blue' })
  )
}

function pole(cx: number, cy: number) {
  const out: string[] = []
  out.push(S(k.cylinder(cx, cy, 5, 0, 6, P, 18), { tone: 'lo' }))
  out.push(S(k.cylinder(cx, cy, 2.6, 0, POLE_Z, P, 16), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: cx - 15, y: cy - 4, w: 30, d: 8, r: 2 }, 82, 3, P, 3), { tone: 'mid' }))
  for (const dx of [-11, 11]) out.push(S(k.cylinder(cx + dx, cy, 1.7, 85, 6, P, 12), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: cx + 2, y: cy + 4, w: 9, d: 7, r: 1 }, 48, 14, P, 3), { tone: 'lo' }))
  for (const z of [18, 30, 42, 54]) out.push(k.dotsSvg([at([cx + 3, cy - 3, z])], { size: 1.1, tone: 'mid' }))
  return out.join('')
}

function buildBase(): string {
  const out: string[] = []

  // 地面、道路、路面标线
  out.push(S(k.slabOf({ x: -400, y: -120, w: 800, d: 240, r: 14 }, -8, 8, P, 10), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: -190, y: 80, w: 330, d: 30, r: 3 }, 0, 1.4, P, 4), { tone: 'mid', crease: 'none' }))
  for (let x = -178; x < 130; x += 26) {
    out.push(L(k.lineOnTop([x, 95], [x + 13, 95], 1.5, P), { tone: 'faint' }))
  }
  // 步道与草地纹理
  for (const x of [-170, -145, -55, 25, 105]) {
    out.push(L(k.segment([x, 76, 1], [x - 5, 70, 1], P), { tone: 'faint' }))
    out.push(L(k.segment([x, 76, 1], [x + 4, 69, 1], P), { tone: 'faint' }))
  }

  // 树：树干 + 三层树冠
  out.push(S(k.cylinder(-390, 110, 3.5, 0, 32, P, 12), { tone: 'mid' }))
  out.push(S(k.cylinder(-390, 110, 15, 30, 16, P, 18), { tone: 'lo' }))
  out.push(S(k.cylinder(-390, 110, 12, 45, 13, P, 18), { tone: 'mid' }))
  out.push(S(k.cylinder(-390, 110, 8, 57, 12, P, 16), { tone: 'lo' }))
  for (const [dx, dz] of [[-13, 34], [12, 36], [-9, 48]] as const) {
    out.push(L(k.segment([-390, 110, 24], [-390 + dx, 110, dz], P), { tone: 'faint' }))
  }
  out.push(k.dotsSvg([at([-399, 105, 40]), at([-381, 116, 52]), at([-394, 103, 59])], { size: 1.1, tone: 'lo' }))
  // 灌木
  for (const [x, y, r, h] of [[-372, 70, 9, 12], [-356, 67, 7, 9], [-204, 72, 8, 10]] as const) {
    out.push(S(k.cylinder(x, y, r, 0, h, P, 14), { tone: 'mid' }))
  }
  // 邮箱
  out.push(S(k.slabOf({ x: -205, y: 100, w: 4, d: 4, r: 1 }, 0, 20, P, 2), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -212, y: 95, w: 18, d: 10, r: 4 }, 19, 9, P, 3, 0.5), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: -211, y: 94, w: 3, d: 12, r: 1 }, 28, 6, P, 2), { tone: 'lo' }))
  // 路灯
  out.push(S(k.cylinder(60, 112, 3, 0, 5, P, 12), { tone: 'lo' }))
  out.push(S(k.cylinder(60, 112, 1.6, 0, 46, P, 10), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: 56, y: 104, w: 12, d: 5, r: 2 }, 44, 3, P, 2), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: 52, y: 100, w: 18, d: 12, r: 3 }, 40, 5, P, 3, 0.4), { tone: 'hi' }))

  // 房屋：地基、墙体、横向壁板缝
  out.push(S(k.slabOf({ x: -398, y: -78, w: 196, d: 146, r: 3 }, 0, 5, P, 4), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: HW.x0, y: HW.y0, w: HW.x1 - HW.x0, d: HW.y1 - HW.y0, r: 2 }, 4, 70, P, 3, 0.6), { tone: 'mid' }))
  for (let z = 14; z <= 68; z += 9) out.push(L(k.segment([HW.x0 + 2, HW.y1 + 0.2, z], [HW.x1 - 2, HW.y1 + 0.2, z], P), { tone: 'faint' }))

  // 坡屋顶：后坡、两端山墙、前坡、屋脊、瓦缝
  out.push(face([[HW.x0 - 8, EAVE_B, EAVE_Z], [HW.x1 + 8, EAVE_B, EAVE_Z], [HW.x1 + 8, RIDGE_Y, RIDGE_Z], [HW.x0 - 8, RIDGE_Y, RIDGE_Z]], 'var(--anatomy-shade-0)'))
  out.push(face([[HW.x0 - 8, EAVE_B, EAVE_Z], [HW.x0 - 8, EAVE_F, EAVE_Z], [HW.x0 - 8, RIDGE_Y, RIDGE_Z]], 'var(--anatomy-shade-1)'))
  out.push(face([[HW.x1 + 8, EAVE_B, EAVE_Z], [HW.x1 + 8, EAVE_F, EAVE_Z], [HW.x1 + 8, RIDGE_Y, RIDGE_Z]], 'var(--anatomy-shade-2)'))
  out.push(face([[HW.x0 - 8, EAVE_F, EAVE_Z], [HW.x1 + 8, EAVE_F, EAVE_Z], [HW.x1 + 8, RIDGE_Y, RIDGE_Z], [HW.x0 - 8, RIDGE_Y, RIDGE_Z]], 'var(--anatomy-shade-2)'))
  for (let f = 1; f <= 4; f++) {
    const u = f / 5
    out.push(L(k.segment([HW.x0 - 6, EAVE_F + (RIDGE_Y - EAVE_F) * u, EAVE_Z + (RIDGE_Z - EAVE_Z) * u], [HW.x1 + 6, EAVE_F + (RIDGE_Y - EAVE_F) * u, EAVE_Z + (RIDGE_Z - EAVE_Z) * u], P), { tone: 'faint' }))
  }
  for (const x of [-380, -340, -300, -260, -220]) {
    out.push(L(k.segment([x, EAVE_F, EAVE_Z], [x, RIDGE_Y, RIDGE_Z], P), { tone: 'faint' }))
  }
  out.push(S(k.slabOf({ x: HW.x0 - 10, y: RIDGE_Y - 4, w: HW.x1 - HW.x0 + 20, d: 8, r: 2 }, RIDGE_Z, 3, P, 3, 0.4), { tone: 'mid' }))

  // 烟囱
  out.push(S(k.slabOf({ x: -360, y: 6, w: 22, d: 20, r: 1 }, 74, 44, P, 2, 0.4), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -364, y: 2, w: 30, d: 28, r: 2 }, 118, 4, P, 2, 0.4), { tone: 'hi' }))
  out.push(S(k.cylinder(-349, 16, 4, 122, 6, P, 12), { tone: 'lo' }))
  for (const z of [84, 94, 104]) out.push(L(k.segment([-356, 26.2, z], [-342, 26.2, z], P), { tone: 'faint' }))

  // 檐沟、落水管、支架
  out.push(S(k.slabOf({ x: -400, y: 70, w: 200, d: 5, r: 2 }, 71, 4, P, 3), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: -214, y: 67, w: 5, d: 5, r: 1 }, 0, 74, P, 2), { tone: 'lo' }))
  for (const z of [18, 38, 58]) out.push(S(k.slabOf({ x: -218, y: 62, w: 9, d: 6, r: 1 }, z, 3, P, 2), { tone: 'mid' }))

  // 门、门槛、门框、门把手
  out.push(S(k.slabOf({ x: -334, y: 60, w: 42, d: 3, r: 1 }, 4, 44, P, 2, 0.4), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -331, y: 62, w: 36, d: 2, r: 1 }, 5, 41, P, 2, 0.3), { tone: 'hi' }))
  out.push(faceY(-327, -301, 64.3, 31, 42, 'var(--anatomy-shade-1)'))
  out.push(faceY(-327, -301, 64.3, 15, 27, 'var(--anatomy-shade-1)'))
  out.push(k.dotsSvg([at([-304, 64.6, 24])], { size: 1.4, tone: 'hi' }))
  out.push(S(k.slabOf({ x: -340, y: 64, w: 52, d: 12, r: 2 }, 0, 4, P, 3), { tone: 'lo' }))

  // 正面两扇窗 + 侧面一扇窗
  out.push(S(k.slabOf({ x: -295, y: 60, w: 46, d: 3, r: 1 }, 26, 28, P, 2, 0.4), { tone: 'hi' }))
  out.push(faceY(-291, -256, 63.3, 29, 51, '#0b141c', 'var(--anatomy-lo)'))
  out.push(L(k.segment([-274, 63.4, 29], [-274, 63.4, 51], P), { tone: 'mid' }))
  out.push(L(k.segment([-291, 63.4, 40], [-256, 63.4, 40], P), { tone: 'mid' }))
  out.push(L(k.segment([-288, 63.5, 47], [-264, 63.5, 34], P), { tone: 'blue' }))
  out.push(S(k.slabOf({ x: -298, y: 59, w: 52, d: 8, r: 2 }, 23, 3, P, 3), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -246, y: 60, w: 32, d: 3, r: 1 }, 28, 22, P, 2, 0.4), { tone: 'hi' }))
  out.push(faceY(-243, -217, 63.3, 30, 48, '#0b141c', 'var(--anatomy-lo)'))
  out.push(L(k.segment([-230, 63.4, 30], [-230, 63.4, 48], P), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -249, y: 59, w: 38, d: 8, r: 2 }, 25, 3, P, 3), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -210, y: -44, w: 3, d: 40, r: 1 }, 27, 26, P, 2, 0.4), { tone: 'hi' }))
  out.push(faceX(-40, -4, -206.6, 29, 51, '#0b141c', 'var(--anatomy-lo)'))
  out.push(L(k.segment([-206.5, -40, 40], [-206.5, -4, 40], P), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -213, y: -47, w: 8, d: 46, r: 2 }, 24, 3, P, 3), { tone: 'mid' }))

  // 壁挂电视、游戏机、门灯
  out.push(S(k.slabOf({ x: -390, y: 60, w: 46, d: 5, r: 2 }, 27, 28, P, 2, 0.4), { tone: 'hi' }))
  out.push(faceY(-386, -348, 65.3, 30, 52, '#0a1017', 'var(--anatomy-lo)'))
  out.push(faceY(-382, -352, 65.5, 44, 49, 'rgba(90,150,255,.16)', 'var(--anatomy-blue)'))
  for (const z of [38, 34]) out.push(L(k.segment([-382, 65.5, z], [-356, 65.5, z], P), { tone: 'blue' }))
  out.push(S(k.slabOf({ x: -374, y: 58, w: 12, d: 4, r: 1 }, 22, 5, P, 2), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: -382, y: 60, w: 26, d: 10, r: 2 }, 4, 9, P, 2, 0.4), { tone: 'mid' }))
  out.push(faceY(-378, -360, 70.2, 7, 9, '#05080c'))
  out.push(k.dotsSvg([at([-365, 70.3, 11])], { size: 1, tone: 'hi' }))
  out.push(S(k.slabOf({ x: -320, y: 60, w: 10, d: 6, r: 2 }, 57, 6, P, 2), { tone: 'hi' }))

  // 院子/露台、圆桌、笔记本、手机
  out.push(S(k.slabOf({ x: -350, y: 62, w: 126, d: 48, r: 5 }, 0, 6, P, 5, 0.5), { tone: 'mid' }))
  out.push(S(k.cylinder(-280, 88, 24, 24, 3, P, 26), { tone: 'hi' }))
  out.push(L(k.ring(-280, 88, 24, 27.1, P, 26), { tone: 'faint' }))
  out.push(S(k.cylinder(-280, 88, 2.6, 6, 18, P, 12), { tone: 'mid' }))
  out.push(S(k.cylinder(-280, 88, 10, 6, 2, P, 18), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -299, y: 71, w: 28, d: 18, r: 2 }, 27, 2.2, P, 3, 0.4), { tone: 'hi' }))
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) out.push(S(k.slabOf({ x: -295 + c * 6, y: 74 + r * 5, w: 4.5, d: 3.6, r: 0.6 }, 29.2, 0.6, P, 2), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: -299, y: 71, w: 28, d: 3, r: 1 }, 29.2, 16, P, 2, 0.4), { tone: 'hi' }))
  out.push(faceY(-295, -275, 74.3, 32, 43, '#0a1017', 'var(--anatomy-lo)'))
  out.push(L(k.segment([-293, 74.4, 40], [-277, 74.4, 40], P), { tone: 'blue' }))
  out.push(S(k.slabOf({ x: -270, y: 86, w: 12, d: 20, r: 2 }, 27, 2, P, 3, 0.4), { tone: 'hi' }))
  out.push(`<path d="${k.planOutline({ x: -268, y: 88, w: 8, d: 16, r: 2 }, 29.1, P)}" style="fill:#0a1017;stroke:var(--anatomy-faint);stroke-width:var(--anatomy-weight)"/>`)

  // ONT 光猫：门旁壁挂盒、面板、指示灯、墙面卡扣
  out.push(S(k.slabOf({ x: -240, y: 60, w: 18, d: 6, r: 2 }, 10, 12, P, 2, 0.3), { tone: 'hi' }))
  out.push(faceY(-236, -224, 66.2, 12, 20, 'var(--anatomy-shade-1)'))
  out.push(k.dotsSvg([at([-234, 66.3, 18]), at([-230, 66.3, 18]), at([-226, 66.3, 18])], { size: 0.9, tone: 'hi' }))
  for (const z of [34, 50]) out.push(S(k.slabOf({ x: -234, y: 64, w: 5, d: 3, r: 1 }, z, 2, P, 2), { tone: 'mid' }))

  // 两根电杆 + 拉线
  out.push(pole(-120, 78))
  out.push(pole(-10, 78))
  out.push(cable(smooth([[-120, 78, 86], [-142, 90, 40], [-160, 100, 2]], 5), 1.1))
  out.push(S(k.slabOf({ x: -164, y: 96, w: 8, d: 8, r: 1 }, 0, 3, P, 2), { tone: 'lo' }))

  // ISP 机房：地面、后墙、侧墙、前梁、女儿墙压顶
  out.push(S(k.slabOf({ x: 124, y: -96, w: 228, d: 158, r: 4 }, 0, 6, P, 5), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: 128, y: -94, w: 220, d: 6, r: 1 }, 6, 116, P, 3, 0.4), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: 128, y: -94, w: 6, d: 158, r: 1 }, 6, 116, P, 3, 0.4), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: 342, y: -94, w: 6, d: 158, r: 1 }, 6, 116, P, 3, 0.4), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: 128, y: 56, w: 220, d: 8, r: 1 }, 100, 22, P, 3, 0.4), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: 124, y: -100, w: 228, d: 14, r: 2 }, 122, 4, P, 3), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: 124, y: 58, w: 228, d: 14, r: 2 }, 122, 4, P, 3), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: 124, y: -100, w: 14, d: 172, r: 2 }, 122, 4, P, 3), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: 344, y: -100, w: 14, d: 172, r: 2 }, 122, 4, P, 3), { tone: 'hi' }))
  // 机房侧墙百叶 + 排风扇
  for (let z = 45; z <= 81; z += 9) out.push(L(k.segment([348, 20, z], [348, 46, z], P), { tone: 'faint' }))
  out.push(fanX(6, 90, 16, 348.5))
  // 门头招牌
  out.push(S(k.slabOf({ x: 196, y: 64, w: 76, d: 4, r: 2 }, 104, 13, P, 3, 0.4), { tone: 'hi' }))
  out.push(`<text class="iso-face-text" data-tone="hi" x="${at([234, 68.4, 111])[0]}" y="${at([234, 68.4, 111])[1]}" font-size="9" text-anchor="middle">ISP</text>`)

  // 机架：脚轮、底座、顶框、四立柱、侧横撑
  for (const [x, y] of [[172, -38], [288, -38], [172, 32], [288, 32]] as const) {
    out.push(S(k.cylinder(x, y, 3, 0, 6, P, 10), { tone: 'lo' }))
  }
  out.push(S(k.slabOf({ x: 166, y: -44, w: 130, d: 86, r: 3 }, 6, 5, P, 3), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: 164, y: -48, w: 134, d: 94, r: 3 }, 108, 5, P, 3), { tone: 'mid' }))
  for (const [x, y] of [[168, -42], [290, -42], [168, 36], [290, 36]] as const) {
    out.push(S(k.slabOf({ x, y, w: 6, d: 6, r: 1 }, 11, 97, P, 2), { tone: 'mid' }))
  }
  for (const z of [30, 58, 86]) out.push(S(k.slabOf({ x: 288, y: -42, w: 4, d: 80, r: 1 }, z, 3, P, 2), { tone: 'lo' }))

  // 机架设备：交换机、路由器、配线架、服务器、电源
  const units = [20, 36, 52, 68, 84]
  for (const z of units) out.push(S(k.slabOf({ x: 176, y: 20, w: 106, d: 16, r: 1 }, z, 13, P, 3, 0.5), { tone: 'mid' }))
  // 交换机端口
  for (let i = 0; i < 12; i++) {
    const x = 182 + i * 8
    out.push(faceY(x - 2.6, x + 2.6, 36.2, 24, 29, '#05080c'))
    out.push(k.dotsSvg([at([x, 36.4, 31])], { size: 0.9, tone: 'hi' }))
  }
  // 路由器端口与两个风扇
  for (const x of [184, 194, 204, 214]) out.push(faceY(x - 2.4, x + 2.4, 36.2, 40, 45, '#05080c'))
  out.push(fanY(238, 42.5, 5.5, 36.3))
  out.push(fanY(258, 42.5, 5.5, 36.3))
  out.push(k.dotsSvg([at([272, 36.4, 44])], { size: 1, tone: 'hi' }))
  // 配线架
  for (let i = 0; i < 8; i++) {
    const x = 182 + i * 11.4
    out.push(faceY(x - 3, x + 3, 36.2, 56, 61, '#05080c'))
  }
  // 服务器盘位与散热缝
  for (let i = 0; i < 4; i++) out.push(faceY(182 + i * 13, 192 + i * 13, 36.2, 71, 78, 'var(--anatomy-shade-1)', 'var(--anatomy-faint)'))
  for (let z = 72; z <= 78; z += 2) out.push(L(k.segment([246, 36.3, z], [268, 36.3, z], P), { tone: 'faint' }))
  out.push(k.dotsSvg([at([274, 36.4, 75]), at([274, 36.4, 72])], { size: 1, tone: 'hi' }))
  // 电源单元
  out.push(faceY(184, 200, 36.2, 88, 93, '#05080c'))
  out.push(faceY(208, 224, 36.2, 88, 93, '#05080c'))
  out.push(S(k.slabOf({ x: 258, y: 36, w: 10, d: 2, r: 1 }, 88, 5, P, 2), { tone: 'hi' }))
  out.push(k.dotsSvg([at([276, 36.4, 92])], { size: 1, tone: 'hi' }))
  // 机架标签
  out.push(S(k.slabOf({ x: 196, y: 36, w: 58, d: 1.6, r: 1 }, 99, 5, P, 2), { tone: 'hi' }))
  out.push(k.faceTextSvg(k.topMatrix([214, 34], 104.1, P), 'CORE', { size: 3.6, tone: 'mid' }))
  // 机房内：UPS 机柜、地板走线槽、配电箱、地面分缝
  for (const [x, y] of [[306, -36], [332, -36], [306, 18], [332, 18]] as const) {
    out.push(S(k.cylinder(x, y, 2.5, 6, 5, P, 10), { tone: 'lo' }))
  }
  out.push(S(k.slabOf({ x: 302, y: -40, w: 34, d: 64, r: 2 }, 11, 61, P, 3, 0.5), { tone: 'mid' }))
  out.push(faceY(306, 332, 24.3, 16, 66, 'var(--anatomy-shade-1)'))
  for (let i = 0; i < 4; i++) out.push(faceY(308, 330, 24.5, 20 + i * 10, 26 + i * 10, '#05080c'))
  out.push(S(k.slabOf({ x: 308, y: 24, w: 20, d: 2, r: 1 }, 58, 4, P, 2), { tone: 'hi' }))
  out.push(k.dotsSvg([at([314, 24.7, 53]), at([322, 24.7, 53])], { size: 1, tone: 'hi' }))
  for (const z of [14, 26, 38, 50]) out.push(L(k.segment([303, 23.9, z], [333, 23.9, z], P), { tone: 'faint' }))
  out.push(S(k.slabOf({ x: 300, y: -42, w: 38, d: 68, r: 2 }, 72, 3, P, 3), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: 216, y: -92, w: 12, d: 50, r: 1 }, 6, 3, P, 2), { tone: 'lo' }))
  for (let y = -88; y <= -46; y += 8) out.push(L(k.segment([216, y, 9.1], [228, y, 9.1], P), { tone: 'faint' }))
  for (const y of [-20, 20]) out.push(L(k.segment([140, y, 6.1], [338, y, 6.1], P), { tone: 'faint' }))
  out.push(S(k.slabOf({ x: 134, y: -24, w: 5, d: 26, r: 1 }, 78, 20, P, 2, 0.3), { tone: 'hi' }))
  for (let i = 0; i < 3; i++) out.push(faceX(-20 + i * 7, -14 + i * 7, 139.4, 88, 92, '#05080c'))
  out.push(k.dotsSvg([at([139.6, -8, 82])], { size: 1, tone: 'hi' }))
  // 配线架到交换机的彩色跳线
  for (let i = 0; i < 4; i++) {
    const x1 = 186 + i * 22
    const x2 = 190 + i * 20
    const tone = i % 2 === 0 ? 'var(--anatomy-blue)' : 'var(--anatomy-green)'
    out.push(cable(smooth([[x1, 39, 57], [x1 + 8, 42, 40], [x2, 39, 26]], 6), 1.5, tone))
  }

  // 入户光纤：ONT → 电杆 → ISP 配线架，带余缆卡扣与吊线
  out.push(cable(CABLE_CURVE, 3.2))
  const lash: [number, number][] = []
  for (let i = 3; i < CABLE_CURVE.length - 3; i += 4) {
    const [x, y] = at(CABLE_CURVE[i])
    lash.push([x, y])
  }
  out.push(k.dotsSvg(lash, { size: 0.9, tone: 'mid' }))
  out.push(S(k.slabOf({ x: -236, y: 64, w: 8, d: 6, r: 1 }, 16, 5, P, 2), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: 246, y: 36, w: 8, d: 6, r: 1 }, 61, 6, P, 2), { tone: 'lo' }))

  // 标签：贴在地面/路面上
  const l1 = at([-345, 118, 2])
  out.push(`<text class="iso-face-text" data-tone="hi" x="${l1[0]}" y="${l1[1]}" font-size="10" text-anchor="middle">网络边缘</text>`)
  const l2 = at([-55, 112, 2])
  out.push(`<text class="iso-face-text" data-tone="hi" x="${l2[0]}" y="${l2[1]}" font-size="10" text-anchor="middle">接入网 · 光纤</text>`)
  const l3 = at([238, 112, 2])
  out.push(`<text class="iso-face-text" data-tone="hi" x="${l3[0]}" y="${l3[1]}" font-size="10" text-anchor="middle">网络核心 · ISP 机房</text>`)
  return out.join('')
}

const BASE = buildBase()

export default function EdgeCoreFigure() {
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())

  const q = (t / CYCLE) % 1
  const head = pointAlong(q)
  const zone = head[0] < -210 ? '网络边缘' : head[0] < 128 ? '接入网' : '网络核心'

  const live = useMemo(() => {
    const out: string[] = []
    const qq = (t / CYCLE) % 1
    for (const offset of [0, 0.44]) {
      const f = (qq + offset) % 1
      const p = pointAlong(f)
      const alpha = Math.min(1, f * 14, (1 - f) * 18)
      out.push(`<g opacity="${alpha.toFixed(3)}">${packet(p)}</g>`)
    }
    // 机架设备指示灯
    const leds: [number, number, number][] = [
      [182, 36.5, 31], [198, 36.5, 31], [214, 36.5, 31], [230, 36.5, 31], [246, 36.5, 31], [262, 36.5, 31],
      [272, 36.5, 44], [274, 36.5, 75], [274, 36.5, 72], [276, 36.5, 92],
    ]
    leds.forEach(([x, y, z], i) => {
      const glow = 0.2 + 0.8 * Math.pow(0.5 + 0.5 * Math.sin(t * 3.1 + i * 1.7), 3)
      const p = at([x, y, z])
      out.push(`<circle cx="${p[0]}" cy="${p[1]}" r="1.4" fill="var(--anatomy-green)" opacity="${glow.toFixed(2)}"/>`)
    })
    // 配线架跳线上的信号点
    for (let i = 0; i < 4; i++) {
      const f = ((t / 2.4) + i * 0.24) % 1
      const x = 186 + i * 22 + Math.sin(f * Math.PI) * 5
      const z = 57 - f * 31
      const p = at([x, 40, z])
      out.push(`<circle cx="${p[0]}" cy="${p[1]}" r="1.3" fill="var(--anatomy-blue)" opacity="${(0.25 + 0.6 * Math.sin(f * Math.PI)).toFixed(2)}"/>`)
    }
    return out.join('')
  }, [t])

  return (
    <FigureCard
      fig="图 6 · 边缘、接入与核心"
      title="数据从家里的设备进入 ISP 机房"
      subtitle="院子里的设备属于网络边缘；光纤沿电杆进入接入网；ISP 机架里的多层交换机与路由器构成网络核心。"
      readout={
        <>
          区域：{zone} · 端系统 4 · 接入链路 1 · 核心设备 5
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
          端到端路径依次经过：源主机 → 接入网 → 若干核心路由器 → 接入网 → 目的主机。核心只负责逐跳转发分组，应用与状态留在边缘；图中的光猫、架空光纤、ISP 机架分别对应这三段。
        </>
      }
    >
      <Scene width={W} height={H} label="网络结构：家庭边缘、光纤接入与 ISP 核心机架" svg={BASE + live} />
    </FigureCard>
  )
}
