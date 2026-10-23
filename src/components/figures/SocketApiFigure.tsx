// ============================================================
// 图解：TCP 套接字接线台（k2.7.2）
// 服务器总机：插口 = 监听端口，票据 = 监听队列（backlog 50），
// accept 把一张票据取到独立工位（连接套接字）；客户端电话插头 = connect
// socket → bind → listen → connect → accept → read/write → close
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 720
const H = 460
const PHASE = 2
const BACKLOG = 50

const BENCH = { x: -205, y: -86, w: 410, d: 172, r: 12 }
const P = k.fitProjection(
  [
    ...k.boxCorners(BENCH, -8, 12),
    ...k.boxCorners({ x: -172, y: -52, w: 104, d: 82, r: 2 }, 0, 90),
    [172, -95, 40],
    [172, 95, 40],
  ],
  W,
  H,
  { pad: 16, azimuth: 34, elevation: 36 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)
const text3 = (
  p: [number, number, number],
  body: string,
  size = 9,
  tone = 'hi',
  anchor: 'start' | 'middle' | 'end' = 'middle',
) => {
  const [x, y] = at(p)
  return `<text class="iso-face-text" data-tone="${tone}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" text-anchor="${anchor}">${body}</text>`
}

type Col = { p: string; f: string; t: string; s: [string, string, string, string] }
const PAPER: Col = { p: '#c9ced6', f: '#d9dde4', t: '#eef1f5', s: ['#9aa0a8', '#a8aeb6', '#b6bcc4', '#c2c8d0'] }
const BLUE: Col = { p: '#2f6fd0', f: '#3b7de6', t: '#4a8ef0', s: ['#24579f', '#2a61b1', '#3169bf', '#3873cc'] }
const GREEN: Col = { p: '#2f9e6e', f: '#37ab79', t: '#44c08a', s: ['#237a54', '#2a8a60', '#31986a', '#38a574'] }
const AMBER: Col = { p: '#c98a2b', f: '#d99a35', t: '#e8ab45', s: ['#9a6a20', '#ad7626', '#bd822c', '#cc8f33'] }

const colorGroup = (c: Col) =>
  `<g style="--anatomy-paper:${c.p};--anatomy-face:${c.f};--anatomy-top:${c.t};--anatomy-shade-0:${c.s[0]};--anatomy-shade-1:${c.s[1]};--anatomy-shade-2:${c.s[2]};--anatomy-shade-3:${c.s[3]}">`

const ease = (u: number) => u * u * (3 - 2 * u)
const clamp01 = (u: number) => Math.max(0, Math.min(1, u))
const lerp3 = (a: [number, number, number], b: [number, number, number], u: number): [number, number, number] => [
  a[0] + (b[0] - a[0]) * u,
  a[1] + (b[1] - a[1]) * u,
  a[2] + (b[2] - a[2]) * u,
]

function onPath(points: [number, number][], s: number): [number, number] {
  const sealed = clamp01(s)
  const lens: number[] = [0]
  for (let i = 1; i < points.length; i++) {
    lens.push(lens[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]))
  }
  const total = lens[lens.length - 1] || 1
  const want = sealed * total
  for (let i = 1; i < points.length; i++) {
    if (want <= lens[i] || i === points.length - 1) {
      const span = lens[i] - lens[i - 1] || 1
      const u = clamp01((want - lens[i - 1]) / span)
      return [
        points[i - 1][0] + (points[i][0] - points[i - 1][0]) * u,
        points[i - 1][1] + (points[i][1] - points[i - 1][1]) * u,
      ]
    }
  }
  return points[points.length - 1]
}

function ticket(x: number, y: number, z: number, height = 15, label?: string) {
  const out: string[] = []
  out.push(
    colorGroup(PAPER) +
      S(k.slabOf({ x: x - 5.5, y: y - 0.9, w: 11, d: 1.8, r: 0.5 }, z, height, P, 2, 0.3), { tone: 'hi', lit: true }) +
      '</g>',
  )
  out.push(L(k.lineOnTop([x - 5, y + 0.1], [x + 5, y + 0.1], z + height, P), { tone: 'blue' }))
  if (label) out.push(text3([x, y - 0.2, z + height * 0.45], label, 7.2, 'mid'))
  return out.join('')
}

function plug(x: number, y: number, z: number, shell: Col = BLUE) {
  return (
    colorGroup(shell) +
    S(k.cylinder(x, y, 3.2, z, 3.6, P, 16), { tone: 'hi', lit: true }) +
    S(k.slabOf({ x: x - 3, y: y - 2, w: 6, d: 4, r: 1 }, z + 3.6, 2, P, 2, 0.3), { tone: 'mid' }) +
    '</g>' +
    L(k.ring(x, y, 3.3, z + 1.4, P, 16), { tone: 'blue' })
  )
}

export default function SocketApiFigure() {
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())

  const step = Math.floor(t / PHASE) % 7
  const u = (t % PHASE) / PHASE

  const queue = step < 3 ? 0 : step === 3 ? 3 : step === 4 && u < 0.52 ? 3 : 2
  const rail = step < 3 ? 0 : step === 3 ? 3 : 2
  const CALLS = ['socket()', 'bind()', 'listen(backlog=50)', 'connect()', 'accept()', 'read() / write()', 'close()']
  const CLIENT = ['已创建套接字', '已创建套接字', '等待连接', '已连接', '已连接', '收发字节流', '已关闭']

  // 客户端插头：托架 → 悬停 → 插入墙上插座 → 拔出
  const tray: [number, number, number] = [158, 67, 13]
  const hover: [number, number, number] = [122, 72, 26]
  const jack: [number, number, number] = [68, 61, 23]
  let cp = tray
  if (step === 0 && u > 0.5) cp = lerp3(tray, hover, ease((u - 0.5) / 0.5))
  else if (step === 1 || step === 2) cp = hover
  else if (step === 3) cp = lerp3(hover, jack, ease(clamp01(u / 0.7)))
  else if (step === 4 || step === 5) cp = jack
  else if (step === 6) cp = u < 0.4 ? jack : u < 0.8 ? lerp3(jack, tray, ease((u - 0.4) / 0.4)) : tray

  // 服务器端口插头：bind 时推入背板插口
  let bind = -34
  if (step === 1) bind = -34 - 13 * ease(clamp01(u / 0.7))
  else if (step > 1 && step < 6) bind = -47
  else if (step === 6) bind = u > 0.5 ? -34 : -47

  const leverDown = step >= 2 && !(step === 6 && u > 0.5)
  const handsetLift = step === 5 ? 2.6 : 0

  const svg = useMemo(() => {
    const out: string[] = []
    // 工作台
    out.push(S(k.slabOf(BENCH, -8, 8, P, 10, 1), { tone: 'lo', halo: true }))
    out.push(S(k.slabOf(k.insetPlan(BENCH, 6), 0, 12, P, 10, 1), { tone: 'hi' }))
    for (const [dx, dy] of [
      [-186, -68],
      [186, -68],
      [-186, 68],
      [186, 68],
    ]) {
      out.push(S(k.cylinder(dx, dy, 3.2, 0, 6, P, 12), { tone: 'mid' }))
    }
    out.push(L(k.lineOnTop([-190, -62], [190, -62], 12.2, P), { tone: 'faint' }))
    out.push(L(k.lineOnTop([-190, 62], [190, 62], 12.2, P), { tone: 'faint' }))

    // 数据电缆（从墙上插座到总机）
    const cable: [number, number][] = [
      [58, 58],
      [10, 46],
      [-30, 46],
      [-70, 24],
    ]
    const cp2 = cable.map(([x, y]) => at([x, y, 12.6]))
    out.push(
      k.wireSvg(cp2[0], cp2[cp2.length - 1], {
        via: cp2.slice(1, -1),
        tone: 'lo',
        size: 1.6,
        flow: step === 5,
      }),
    )
    for (const [x, y] of [
      [10, 46],
      [-30, 46],
    ]) {
      out.push(S(k.slabOf({ x: x - 4, y: y - 5, w: 8, d: 10, r: 1 }, 11, 4, P, 2, 0.3), { tone: 'mid' }))
    }
    if (step === 5) {
      if (u > 0.1 && u < 0.5) {
        const [tx, ty] = onPath(cable, (u - 0.1) / 0.4)
        out.push(
          colorGroup(BLUE) +
            S(k.slabOf({ x: tx - 3.4, y: ty - 3.4, w: 6.8, d: 6.8, r: 1 }, 12, 3.2, P, 2, 0.3), { tone: 'hi', lit: true }) +
            '</g>',
        )
      }
      if (u > 0.55 && u < 0.95) {
        const [tx, ty] = onPath([...cable].reverse(), (u - 0.55) / 0.4)
        out.push(
          colorGroup(AMBER) +
            S(k.slabOf({ x: tx - 3.4, y: ty - 3.4, w: 6.8, d: 6.8, r: 1 }, 12, 3.2, P, 2, 0.3), { tone: 'hi', lit: true }) +
            '</g>',
        )
      }
    }

    // 备件：成卷的线缆
    out.push(S(k.cylinder(-185, -64, 12.5, 12, 2.4, P, 24), { tone: 'mid' }))
    out.push(S(k.cylinder(-185, -64, 6.5, 14.4, 17, P, 18), { tone: 'lo' }))
    out.push(S(k.cylinder(-185, -64, 12.5, 31.4, 2.4, P, 24), { tone: 'hi' }))
    for (const z of [18, 22, 26, 30]) out.push(L(k.ring(-185, -64, 8.6, z, P, 24), { tone: 'faint' }))
    out.push(S(k.slabOf({ x: -190, y: -70, w: 10, d: 3, r: 1 }, 33.8, 2.4, P, 2, 0.3), { tone: 'mid' }))
    out.push(S(k.cylinder(-178, -68, 2.2, 33.8, 3.4, P, 12), { tone: 'hi' }))
    // 工单簿
    out.push(S(k.slabOf({ x: -198, y: 44, w: 36, d: 24, r: 2 }, 12, 2.4, P, 3, 0.3), { tone: 'lo' }))
    for (let i = 0; i < 3; i++) {
      out.push(
        colorGroup(PAPER) +
          S(k.slabOf({ x: -196 + i * 0.6, y: 45 + i * 0.6, w: 33, d: 21, r: 1.5 }, 14.4 + i * 1.1, 1, P, 2, 0.2), {
            tone: 'hi',
          }) +
          '</g>',
      )
    }
    out.push(L(k.lineOnTop([-192, 49], [-176, 49], 18.1, P), { tone: 'faint' }))
    out.push(S(k.cylinder(-158, 58, 1.8, 12, 8, P, 10), { tone: 'mid' }))

    // —— 服务器总机 ——
    out.push(S(k.slabOf({ x: -170, y: -52, w: 100, d: 80, r: 4 }, 12, 6, P, 4, 0.6), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: -166, y: -48, w: 92, d: 72, r: 3 }, 18, 42, P, 4, 0.8), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -170, y: -52, w: 100, d: 80, r: 3 }, 60, 4, P, 4, 0.6), { tone: 'hi' }))
    out.push(S(k.slabOf({ x: -164, y: -50, w: 88, d: 4, r: 1 }, 64, 26, P, 2, 0.5), { tone: 'mid' }))
    out.push(L(k.segment([-162, 23.7, 20], [-162, 23.7, 58], P), { tone: 'faint' }))
    out.push(L(k.segment([-78, 23.7, 20], [-78, 23.7, 58], P), { tone: 'faint' }))

    // 背板上的 5 个端口插口
    const ports = [-150, -132, -114, -96, -78]
    for (const px of ports) {
      const [sx, sy] = at([px, -45.8, 76])
      out.push(
        `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="4" fill="var(--anatomy-paper)" stroke="var(--anatomy-mid)" stroke-width="0.9"/>`,
      )
      out.push(L(k.segment([px, -45.6, 82], [px, -45.6, 84], P), { tone: 'faint' }))
    }
    out.push(text3([-120, -45.7, 86], '监听端口 x', 8, 'hi'))

    // 端口插头（bind 时插入）
    out.push(
      S(k.slabOf({ x: -119, y: bind, w: 10, d: 9, r: 1 }, 74, 5, P, 3, 0.4), { tone: 'hi', lit: true }),
    )
    out.push(S(k.cylinder(-114, bind + 5, 2.4, 79, 2.6, P, 12), { tone: 'mid' }))
    out.push(
      L(
        k.segment([-114, bind + 6, 81], [-114, -49.4, 66], P),
        { tone: 'lo' },
      ),
    )

    // 机身控制面板与按钮
    out.push(
      `<path d="${k.pathOf([
        at([-158, 23.8, 26]),
        at([-82, 23.8, 26]),
        at([-82, 23.8, 50]),
        at([-158, 23.8, 50]),
      ], true)}" fill="var(--anatomy-face)" opacity="0.95"/>`,
    )
    for (let row = 0; row < 2; row++) {
      for (let col = 0; col < 6; col++) {
        const [sx, sy] = at([-152 + col * 13, 24, 32 + row * 10])
        out.push(`<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="1.9" fill="var(--anatomy-lo)"/>`)
      }
    }

    // 话务员听筒挂在机身右侧
    out.push(S(k.slabOf({ x: -74.4, y: -10, w: 1.8, d: 20, r: 0.8 }, 30, 18, P, 2, 0.2), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: -72.4, y: -2, w: 2.6, d: 5, r: 1.2 }, 31, 18, P, 2, 0.3), { tone: 'hi' }))
    out.push(S(k.cylinder(-71.2, 0.5, 2.4, 31, 3, P, 12), { tone: 'mid' }))
    out.push(S(k.cylinder(-71.2, 0.5, 2.4, 46, 3, P, 12), { tone: 'mid' }))
    // 监听指示灯
    const lampOn = step >= 2 && !(step === 6 && u > 0.4)
    out.push(
      colorGroup(lampOn ? GREEN : PAPER) +
        S(k.cylinder(-158, -42, 3, 64, 4.5, P, 14), { tone: 'hi', lit: true }) +
        '</g>' +
        L(k.ring(-158, -42, 3.2, 68.6, P, 14), { tone: lampOn ? 'green' : 'faint' }),
    )

    // 拨杆限位板
    const quadPts = [at([-73.9, 6, 44]), at([-73.9, 34, 44]), at([-73.9, 34, 68]), at([-73.9, 6, 68])]
    out.push(`<path d="${k.pathOf(quadPts, true)}" fill="var(--anatomy-face)" opacity="0.95"/>`)
    for (const z of [48, 54, 60]) {
      out.push(L(k.segment([-73.8, 8, z], [-73.8, 15, z], P), { tone: 'faint' }))
    }
    // 监听拨杆
    const tip: [number, number, number] = leverDown ? [-56, 27, 52] : [-82, 20, 74]
    out.push(L(k.segment([-72, 20, 58], tip, P), { tone: 'hi' }))
    out.push(S(k.cylinder(-72, 20, 2.2, 56, 4, P, 12), { tone: 'mid' }))
    out.push(S(k.cylinder(tip[0], tip[1], 3.2, tip[2] - 2, 4.6, P, 12), { tone: 'hi', lit: true }))

    // 队列深度表盘（backlog 50）
    const dial = { cx: -150, cy: -30 }
    out.push(S(k.cylinder(dial.cx, dial.cy, 12, 64, 3, P, 24), { tone: 'mid' }))
    out.push(S(k.cylinder(dial.cx, dial.cy, 9.6, 67, 0.8, P, 24), { tone: 'hi' }))
    const ticks = k.radialTicks(dial.cx, dial.cy, 9.2, 5, 1, 67.9, [1.6, 3], P, -2.1, 2.1)
    out.push(L(ticks.minor, { tone: 'lo' }))
    out.push(L(ticks.major, { tone: 'mid' }))
    const needle = -2.1 + (queue / 5) * 2.1
    out.push(
      L(
        k.lineOnTop(
          [dial.cx, dial.cy],
          [dial.cx + Math.sin(needle) * 7.4, dial.cy - Math.cos(needle) * 7.4],
          68.2,
          P,
        ),
        { tone: 'red' },
      ),
    )
    out.push(k.dotsSvg([at([dial.cx, dial.cy, 68.3])], { size: 1.1, tone: 'hi' }))
    out.push(text3([dial.cx, dial.cy + 7.6, 67.4], String(BACKLOG), 6.2, 'mid'))

    // 监听队列：导轨与票据
    out.push(S(k.slabOf({ x: -44, y: -44, w: 84, d: 14, r: 1 }, 12, 3, P, 3, 0.3), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -46, y: -46, w: 88, d: 2, r: 0.6 }, 15, 3, P, 2, 0.2), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: -46, y: -32, w: 88, d: 2, r: 0.6 }, 15, 3, P, 2, 0.2), { tone: 'lo' }))
    out.push(text3([-44, -30, 23], '监听队列', 8.5, 'hi'))
    // 备用空白票据
    for (let i = 0; i < 4; i++) {
      out.push(
        colorGroup(PAPER) +
          S(k.slabOf({ x: 46 + i * 0.7, y: -24 + i * 0.7, w: 13, d: 8, r: 1 }, 12 + i * 0.9, 0.9, P, 2, 0.2), {
            tone: 'hi',
          }) +
          '</g>',
      )
    }
    const railOffset = step >= 4 ? 1 : 0
    for (let i = 0; i < 3; i++) {
      if (i >= rail) continue
      if (step === 3) {
        const grow = clamp01(u * 3 - i * 0.45)
        if (grow <= 0) continue
        out.push(ticket(-34 + i * 12.5, -37, 15 + 18 * grow, 18 * grow, `#${7 + i}`))
      } else {
        out.push(ticket(-34 + i * 12.5, -37, 15, 18, `#${7 + i + railOffset}`))
      }
    }

    // 取票机械臂
    let armX = 44
    if (step === 4) armX = 44 - 76 * ease(clamp01(u / 0.35))
    else if (step === 5) armX = -32
    else if (step === 6) armX = u > 0.5 ? -32 + 76 * ease((u - 0.5) / 0.5) : -32
    out.push(S(k.cylinder(-50, -40, 2.2, 15, 28, P, 12), { tone: 'mid' }))
    out.push(S(k.cylinder(46, -40, 2.2, 15, 28, P, 12), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -52, y: -42, w: 104, d: 3, r: 1 }, 42, 3.4, P, 2, 0.3), { tone: 'hi' }))
    out.push(S(k.slabOf({ x: armX - 6, y: -43, w: 12, d: 5, r: 1 }, 45, 3.4, P, 2, 0.3), { tone: 'mid' }))
    out.push(L(k.segment([armX, -40.5, 45], [armX, -40.5, 33], P), { tone: 'lo' }))
    out.push(S(k.cylinder(armX, -40.5, 2, 30, 3.2, P, 12), { tone: 'mid' }))

    // accept 工位：连接套接字
    out.push(S(k.slabOf({ x: -42, y: 26, w: 32, d: 16, r: 2 }, 12, 3, P, 3, 0.3), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -42, y: 25, w: 32, d: 2, r: 0.6 }, 15, 3, P, 2, 0.2), { tone: 'lo' }))
    out.push(S(k.slabOf({ x: -42, y: 40, w: 32, d: 2, r: 0.6 }, 15, 3, P, 2, 0.2), { tone: 'lo' }))
    out.push(text3([-26, 47, 14.5], 'accept 工位', 8.5, 'hi'))
    out.push(S(k.slabOf({ x: -20, y: 30, w: 10, d: 9, r: 1 }, 15, 7, P, 3, 0.3), { tone: 'hi' }))
    const [asx, asy] = at([-15, 34.5, 22.1])
    out.push(
      `<circle cx="${asx.toFixed(1)}" cy="${asy.toFixed(1)}" r="2.6" fill="var(--anatomy-paper)" stroke="var(--anatomy-mid)" stroke-width="0.8"/>`,
    )
    out.push(plug(-15, 34.5, 22.4, GREEN))

    // 活动票据：accept 时从队列移到工位，close 时落入完成盘
    let active: [number, number, number] | null = null
    if (step === 4) {
      const v = clamp01((u - 0.1) / 0.8)
      const base = lerp3([-34, -37, 15], [-34, 32, 15], ease(v))
      active = [base[0], base[1], base[2] + Math.sin(Math.PI * v) * 9]
    } else if (step === 5) active = [-34, 32, 15]
    else if (step === 6 && u < 0.45) active = [-34, 32, 15]
    if (active) out.push(ticket(active[0], active[1], active[2], 18, '#7'))

    // 完成盘
    out.push(S(k.slabOf({ x: 2, y: 52, w: 30, d: 14, r: 2 }, 12, 2.6, P, 3, 0.3), { tone: 'mid' }))
    if (step === 6 && u >= 0.45) {
      out.push(
        colorGroup(PAPER) +
          S(k.slabOf({ x: 12, y: 57, w: 10, d: 7, r: 1 }, 15, 0.8, P, 2, 0.2), { tone: 'hi', lit: true }) +
          '</g>',
      )
    }

    // 备用插头托盘
    out.push(S(k.slabOf({ x: -70, y: 56, w: 24, d: 14, r: 2 }, 12, 2, P, 3, 0.3), { tone: 'mid' }))
    out.push(plug(-63, 63, 14, BLUE))
    out.push(plug(-53, 63, 14, AMBER))

    // —— 客户端电话 ——
    const px = 132
    const py = 5
    out.push(S(k.slabOf({ x: px - 35, y: py - 26, w: 70, d: 52, r: 6 }, 12, 6, P, 4, 0.6), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: px - 31, y: py - 22, w: 62, d: 44, r: 5 }, 18, 2.6, P, 4, 0.5), { tone: 'hi' }))
    for (const dx of [-20, 20]) {
      out.push(S(k.slabOf({ x: px + dx - 4.5, y: py - 15, w: 9, d: 8, r: 1 }, 20.6, 4.4, P, 2, 0.3), { tone: 'lo' }))
    }
    // 话筒（读写时抬起）
    out.push(
      S(k.slabOf({ x: px - 27, y: py - 11, w: 54, d: 16, r: 7 }, 25 + handsetLift, 5.6, P, 6, 0.6), {
        tone: 'hi',
        lit: step === 5,
      }),
    )
    for (const dx of [-21, 21]) {
      out.push(S(k.cylinder(px + dx, py - 3, 4.6, 28.6 + handsetLift, 4, P, 16), { tone: 'mid' }))
    }
    // 键盘
    const keys: [number, number, number][] = []
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) keys.push([px - 10 + col * 10, py + 9 + row * 4.6, 20.7])
    }
    out.push(k.dotsSvg(keys.map((p) => at(p)), { size: 1.5, tone: 'mid' }))
    out.push(text3([px, py + 40, 14], '客户端', 9.5, 'hi'))

    // 电话卷线
    const coil = k.coil(76, 106, [34, 23], 3.2, 5, 'x', P, 14)
    out.push(L(coil.back, { tone: 'faint' }))
    out.push(L(coil.front, { tone: 'lo' }))

    // 墙上插座
    out.push(S(k.slabOf({ x: 58, y: 52, w: 20, d: 18, r: 2 }, 12, 8, P, 3, 0.4), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: 60, y: 54, w: 16, d: 14, r: 1 }, 20, 2, P, 3, 0.3), { tone: 'hi' }))
    const [jsx, jsy] = at([68, 61, 22.1])
    out.push(
      `<circle cx="${jsx.toFixed(1)}" cy="${jsy.toFixed(1)}" r="3.6" fill="var(--anatomy-paper)" stroke="var(--anatomy-mid)" stroke-width="0.9"/>`,
    )

    // 插头托架与可动插头
    out.push(S(k.slabOf({ x: 145, y: 60, w: 26, d: 14, r: 2 }, 12, 2, P, 3, 0.3), { tone: 'mid' }))
    out.push(
      L(
        k.segment([76, 34, 23], [cp[0], cp[1], cp[2] + 4], P),
        { tone: 'lo' },
      ),
    )
    out.push(plug(cp[0], cp[1], cp[2], BLUE))

    return out.join('')
  }, [step, u, queue, bind, leverDown, handsetLift, cp])

  return (
    <FigureCard
      fig="图 16 · TCP 套接字接线台"
      title="服务器守着一扇门，accept 才开出对话窗口"
      subtitle="总机背板的插口是监听端口，票据在监听队列里排队；accept 取走一张票，把它接到独立工位。客户端拨号插头相当于 connect。"
      readout={
        <>
          当前 {CALLS[step]} · 客户端 {CLIENT[step]} · 监听队列 {queue} · backlog = {BACKLOG}
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
          服务器先 <strong>socket → bind → listen(50)</strong>，再阻塞在 <strong>accept()</strong>：监听套接字永远开着，只负责等人来。
          accept 返回的是<strong>连接套接字</strong>，专门服务这一个客户端；不同客户端靠<strong>源端口</strong>区分。
          读写的是<strong>字节流</strong>，没有消息边界，应用要自己划分（例如按换行符）。队列长度与计数为示意，backlog 以正文的 50 为准。
        </>
      }
    >
      <Scene width={W} height={H} label="TCP 套接字编程：总机监听端口、票据队列与客户端电话" svg={svg} />
    </FigureCard>
  )
}
