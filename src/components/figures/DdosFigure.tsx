// ============================================================
// 图解：拒绝服务攻击 DoS / DDoS（k1.6.2）
// 有限吞吐的传送带 = 链路容量；被感染的僵尸主机同时往目标机柜送包裹
// 正文：选目标 → 入侵周围主机构成 botnet → 从被攻陷主机发包
// 速率数值为教学示意：正常 8 pkt/s，每台僵尸主机 6 pkt/s，容量 100 pkt/s
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 900
const H = 430
const CAPACITY = 100
const NORMAL = 8
const PER_BOT = 6
const PER_TIER = 8
const BOTS = 24

const GROUND = { x: -330, y: -142, w: 650, d: 282, r: 16 }
const BELT = { x: -222, y: -8, w: 372, d: 46, r: 6 }
const BODY = { x: 196, y: -26, w: 100, d: 110, r: 4 }
const TOPC = { x: 190, y: -32, w: 112, d: 122, r: 5 }
// 三级看台：24 台僵尸主机全部在传送带后方，不遮住链路
const TIERS = [
  { y: -42, z: 30 },
  { y: -72, z: 44 },
  { y: -102, z: 58 },
]
const BOT_X = Array.from({ length: PER_TIER }, (_, i) => -220 + i * 30)

const P = k.fitProjection(
  [...k.boxCorners(GROUND, -8, 0), [300, 92, 175], [-326, 92, 40], [-232, -116, 76]],
  W,
  H,
  { pad: 14, azimuth: 34, elevation: 37 },
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
  paper: '#b53f38', face: '#c94b43', top: '#dc5c53', s0: '#852e29', s1: '#94352f', s2: '#a23c35', s3: '#b0433b', hi: '#ef9a91', faint: '#63221e',
}
const BLUE: ColorSet = {
  paper: '#2f63b0', face: '#3d74c4', top: '#4e86d6', s0: '#224a86', s1: '#285494', s2: '#2e5ea3', s3: '#3569b2', hi: '#a3c4ee', faint: '#1b3a68',
}

const paint = (c: ColorSet, inner: string) =>
  `<g style="--anatomy-paper:${c.paper};--anatomy-face:${c.face};--anatomy-top:${c.top};--anatomy-shade-0:${c.s0};--anatomy-shade-1:${c.s1};--anatomy-shade-2:${c.s2};--anatomy-shade-3:${c.s3};--anatomy-hi:${c.hi};--anatomy-faint:${c.faint}">${inner}</g>`

const STEEL = '--anatomy-paper:#46505c;--anatomy-face:#505b68;--anatomy-top:#5c6878;--anatomy-shade-0:#2b333d;--anatomy-shade-1:#323b46;--anatomy-shade-2:#39434f;--anatomy-shade-3:#404b57;--anatomy-hi:#e0e8f0;--anatomy-faint:#68737f'
const IRON = '--anatomy-paper:#343d48;--anatomy-face:#3c4652;--anatomy-top:#46515e;--anatomy-shade-0:#232a33;--anatomy-shade-1:#29313b;--anatomy-shade-2:#2f3842;--anatomy-shade-3:#353e49;--anatomy-hi:#aab5c2;--anatomy-faint:#535e6a'
const steel = (inner: string) => `<g style="${STEEL}">${inner}</g>`
const iron = (inner: string) => `<g style="${IRON}">${inner}</g>`

const text = (p: [number, number, number], s: string, size = 10, anchor = 'middle', tone = 'hi') => {
  const [x, y] = at(p)
  return `<text class="iso-face-text" data-tone="${tone}" x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}">${s}</text>`
}

const cube = (x: number, y: number, z: number, size: number, c: ColorSet) =>
  paint(c, S(k.slabOf({ x: x - size / 2, y: y - size / 2, w: size, d: size, r: size * 0.25 }, z, size * 0.9, P, 3, 0.35), { tone: 'hi' }))

/** 一台被感染的僵尸主机：小机箱、通风口、屏幕、天线和发射槽 */
function botGeometry(x: number, y: number, z: number): string {
  return [
    steel(S(k.slabOf({ x: x - 6, y: y - 4.5, w: 12, d: 9, r: 1.5 }, z, 12, P, 3, 0.4), { tone: 'hi' })),
    steel(S(k.slabOf({ x: x - 5, y: y - 3.5, w: 10, d: 7, r: 1.5 }, z + 12, 2, P, 3, 0.4), { tone: 'hi' })),
    iron(S(k.slabOf({ x: x - 4, y: y + 4.5, w: 8, d: 1.4, r: 1 }, z + 5, 6, P, 3, 0.3), { tone: 'mid' })),
    S(k.slabOf({ x: x - 2, y: y + 5.4, w: 4, d: 3.5, r: 1 }, z + 6.5, 2.6, P, 3, 0.3), { tone: 'lo' }),
    S(k.cylinder(x + 5, y - 2, 0.7, z + 14, 6, P, 8), { tone: 'lo' }),
    L(k.lineOnTop([x - 4, y - 2], [x + 4, y - 2], z + 14.1, P), { tone: 'faint' }),
    L(k.lineOnTop([x - 4, y + 1], [x + 4, y + 1], z + 14.1, P), { tone: 'faint' }),
  ].join('')
}

/** 静态机身：地台、长凳、传送带、料斗、服务器机柜、溢料箱 */
function buildStatic(): string {
  const out: string[] = []
  out.push(S(k.slabOf(GROUND, -8, 8, P, 10, 1), { tone: 'lo' }))

  // ---- 合法用户的小桌 ----
  out.push(steel(S(k.slabOf({ x: -310, y: 36, w: 52, d: 30, r: 3 }, 12, 2.5, P, 4, 0.4), { tone: 'hi' })))
  for (const [x, y] of [
    [-306, 40],
    [-266, 40],
    [-306, 60],
    [-266, 60],
  ]) {
    out.push(S(k.cylinder(x, y, 1.8, 0, 12, P, 10), { tone: 'lo' }))
  }
  out.push(S(k.slabOf({ x: -300, y: 46, w: 20, d: 2, r: 1 }, 14.5, 16, P, 3, 0.3), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: -297, y: 48.3, w: 14, d: 1, r: 1 }, 18, 9, P, 3), { tone: 'faint' }))
  out.push(S(k.slabOf({ x: -276, y: 43, w: 16, d: 8, r: 1 }, 14.5, 1.6, P, 3, 0.3), { tone: 'hi' }))

  // ---- 三级看台与 24 台僵尸主机 ----
  for (let tier = 0; tier < TIERS.length; tier++) {
    const { y, z } = TIERS[tier]!
    out.push(steel(S(k.slabOf({ x: -234, y: y - 13, w: 244, d: 26, r: 4 }, z - 6, 6, P, 4, 0.5), { tone: 'hi' })))
    out.push(iron(S(k.slabOf({ x: -234, y: y - 16, w: 244, d: 3, r: 1 }, z, 16 + tier * 4, P, 3, 0.4), { tone: 'mid' })))
    for (const x of [-226, -150, -74, 2]) {
      for (const yy of [y - 7, y + 7]) out.push(iron(S(k.cylinder(x, yy, 2.4, 0, z - 6, P, 12), { tone: 'mid' })))
    }
    out.push(iron(S(k.slabOf({ x: -226, y: y - 10, w: 236, d: 3, r: 1 }, z - 14, 4, P, 3, 0.3), { tone: 'mid' })))
    for (let i = 0; i < PER_TIER; i++) out.push(botGeometry(BOT_X[i]!, y, z))
  }

  // ---- 传送带（有限容量链路） ----
  for (const x of [-190, -55, 80]) {
    for (const y of [-2, 30]) out.push(iron(S(k.cylinder(x, y, 3, 0, 20, P, 14), { tone: 'mid' })))
    out.push(iron(S(k.slabOf({ x: x - 4, y: -4, w: 8, d: 38, r: 2 }, 15, 6, P, 4, 0.5), { tone: 'mid' })))
  }
  out.push(iron(S(k.slabOf(BELT, 20, 6, P, 5, 0.5), { tone: 'mid' })))
  out.push(steel(S(k.slabOf({ x: -216, y: -4, w: 360, d: 38, r: 5 }, 26, 3, P, 5, 0.4), { tone: 'hi' })))
  out.push(steel(S(k.slabOf({ x: -220, y: -12, w: 368, d: 5, r: 2 }, 26, 12, P, 4, 0.5), { tone: 'hi' })))
  out.push(steel(S(k.slabOf({ x: -220, y: 33, w: 368, d: 5, r: 2 }, 26, 10, P, 4, 0.5), { tone: 'hi' })))
  // 滚轮
  for (let x = -206; x < 140; x += 22) {
    out.push(S(k.cylinder(x, -1, 2.2, 20, 7, P, 12), { tone: 'mid' }))
    out.push(S(k.cylinder(x, 31, 2.2, 20, 7, P, 12), { tone: 'mid' }))
  }
  // 驱动鼓与电机
  out.push(S(k.slabOf({ x: 120, y: -10, w: 32, d: 46, r: 5 }, 20, 16, P, 5, 0.6), { tone: 'mid' }))
  out.push(S(k.cylinder(136, 11, 9, 36, 2.4, P, 30), { tone: 'hi' }))
  out.push(S(k.cylinder(136, -26, 7, 0, 15, P, 24), { tone: 'mid' }))
  out.push(S(k.cylinder(136, -26, 7.4, 15, 1.6, P, 24), { tone: 'hi' }))
  out.push(L(k.knurl(136, -26, 7.2, 1.5, 14.5, 12, P), { tone: 'faint' }))
  out.push(L(k.segment([136, -19, 8], [136, -11, 30], P), { tone: 'faint' }))

  // ---- 料斗与绕到正面的进料槽 ----
  out.push(steel(S(k.slabOf({ x: 124, y: -14, w: 52, d: 58, r: 4 }, 36, 6, P, 5, 0.6), { tone: 'hi' })))
  out.push(S(k.slabOf({ x: 128, y: -10, w: 44, d: 50, r: 3 }, 42, 1.6, P, 4), { tone: 'faint' }))
  out.push(iron(S(k.slabOf({ x: 142, y: -2, w: 28, d: 34, r: 3 }, 18, 18, P, 4, 0.5), { tone: 'mid' })))
  for (const [x, y] of [
    [126, -12],
    [174, -12],
    [126, 40],
    [174, 40],
  ]) {
    out.push(iron(S(k.cylinder(x, y, 1.8, 36, 7, P, 10), { tone: 'mid' })))
  }
  // 90° 转角滑槽：从传送带末端绕到机柜正面进料口
  out.push(iron(S(k.slabOf({ x: 136, y: 40, w: 26, d: 27, r: 2 }, 29, 6, P, 4, 0.4), { tone: 'mid' })))
  out.push(iron(S(k.slabOf({ x: 136, y: 62, w: 64, d: 18, r: 2 }, 29, 6, P, 4, 0.4), { tone: 'mid' })))
  out.push(iron(S(k.slabOf({ x: 192, y: 62, w: 40, d: 24, r: 2 }, 29, 6, P, 4, 0.4), { tone: 'mid' })))
  out.push(L(k.planOutline({ x: 138, y: 42, w: 22, d: 23, r: 1 }, 35.2, P), { tone: 'faint' }))
  out.push(L(k.planOutline({ x: 138, y: 64, w: 60, d: 14, r: 1 }, 35.2, P), { tone: 'faint' }))
  out.push(L(k.planOutline({ x: 194, y: 64, w: 36, d: 20, r: 1 }, 35.2, P), { tone: 'faint' }))

  // ---- 目标服务器机柜 ----
  for (const [x, y] of [
    [202, -20],
    [290, -20],
    [202, 78],
    [290, 78],
  ]) {
    out.push(S(k.cylinder(x, y, 4, 0, 7, P, 14), { tone: 'lo' }))
  }
  out.push(iron(S(k.slabOf({ x: 190, y: -32, w: 112, d: 122, r: 5 }, 7, 7, P, 5, 0.6), { tone: 'mid' })))
  out.push(steel(S(k.slabOf(BODY, 14, 134, P, 4), { tone: 'hi' })))
  out.push(iron(L(k.sideSeam(BODY, 50, P), { tone: 'faint' })))
  out.push(steel(S(k.slabOf(TOPC, 148, 8, P, 5, 1), { tone: 'hi' })))
  out.push(steel(S(k.slabOf({ x: 196, y: -26, w: 100, d: 110, r: 4 }, 156, 2, P, 5, 0.4), { tone: 'hi' })))
  // 前面板
  out.push(iron(S(k.slabOf({ x: 200, y: 82, w: 90, d: 3, r: 2 }, 18, 128, P, 3, 0.4), { tone: 'mid' })))
  // 百叶散热片
  for (let i = 0; i < 6; i++) {
    out.push(steel(S(k.slabOf({ x: 240, y: 83.5, w: 46, d: 2.5, r: 1 }, 24 + i * 7, 4, P, 3, 0.3), { tone: 'hi' })))
  }
  // 三台机架单元 + 把手
  for (let i = 0; i < 3; i++) {
    const z = 76 + i * 11
    out.push(steel(S(k.slabOf({ x: 201, y: 83.5, w: 44, d: 3, r: 1 }, z, 8, P, 3, 0.3), { tone: 'hi' })))
    out.push(S(k.cylinder(205, 86, 1.2, z + 1.5, 4, P, 10), { tone: 'lo' }))
    out.push(S(k.cylinder(241, 86, 1.2, z + 1.5, 4, P, 10), { tone: 'lo' }))
  }
  // 状态灯
  const leds: [number, number, number][] = []
  for (let i = 0; i < 7; i++) leds.push([208 + i * 5, 85.6, 112])
  out.push(k.dotsSvg(leds, { size: 1.2, tone: 'hi' }))
  // 显示屏
  out.push(S(k.slabOf({ x: 252, y: 83, w: 30, d: 2, r: 1 }, 126, 14, P, 3, 0.3), { tone: 'hi' }))
  out.push(S(k.slabOf({ x: 255, y: 84.4, w: 24, d: 1, r: 1 }, 129, 8, P, 3), { tone: 'faint' }))
  out.push(k.dotsSvg([at([258, 85.2, 133]), at([263, 85.2, 133]), at([268, 85.2, 133])], { size: 0.8, tone: 'mid' }))
  // 右侧可见面的风扇
  const fan = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2
    return at([296, 6 + Math.cos(a) * 11, 92 + Math.sin(a) * 11])
  })
  out.push(L(k.pathOf(fan, true), { tone: 'faint' }))
  out.push(k.dotsSvg([at([296, 6, 92])], { size: 2.4, tone: 'mid' }))
  // 正面进料口：接住转角滑槽
  out.push(S(k.slabOf({ x: 198, y: 83.5, w: 34, d: 2.5, r: 2 }, 34, 26, P, 3, 0.4), { tone: 'faint' }))
  // 顶部指示灯座
  out.push(S(k.cylinder(250, -6, 5.5, 156, 2, P, 18), { tone: 'lo' }))

  // ---- 溢料箱 ----
  out.push(iron(S(k.slabOf({ x: 78, y: 56, w: 44, d: 30, r: 3 }, 0, 3, P, 4, 0.4), { tone: 'mid' })))
  out.push(steel(S(k.slabOf({ x: 78, y: 56, w: 44, d: 2, r: 1 }, 3, 14, P, 3, 0.3), { tone: 'hi' })))
  out.push(steel(S(k.slabOf({ x: 78, y: 84, w: 44, d: 2, r: 1 }, 3, 14, P, 3, 0.3), { tone: 'hi' })))
  out.push(steel(S(k.slabOf({ x: 78, y: 58, w: 2, d: 26, r: 1 }, 3, 14, P, 3, 0.3), { tone: 'hi' })))
  out.push(steel(S(k.slabOf({ x: 120, y: 58, w: 2, d: 26, r: 1 }, 3, 14, P, 3, 0.3), { tone: 'hi' })))


  // ---- 容量铭牌（钉在近侧护栏上） ----
  out.push(steel(S(k.slabOf({ x: -20, y: 32, w: 82, d: 8, r: 1 }, 36, 2, P, 3, 0.3), { tone: 'hi' })))
  for (let i = 0; i < 6; i++) {
    out.push(L(k.lineOnTop([-16 + i * 14, 33], [-16 + i * 14, 39], 38.2, P), { tone: 'faint' }))
  }

  // ---- 标签（4 个） ----
  out.push(text([-120, -104, 82], '僵尸主机 × 24'))
  out.push(text([21, 35, 43], '链路容量 100 pkt/s', 9.5))
  out.push(text([242, 30, 161], '目标服务器'))
  out.push(text([-284, 74, 37], '正常请求', 9.5))
  return out.join('')
}

const STATIC = buildStatic()

export default function DdosFigure() {
  const [mode, setMode] = useState<'ddos' | 'dos'>('ddos')
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())

  const sources = mode === 'ddos' ? BOTS : 1
  const attack = sources * PER_BOT
  const total = NORMAL + attack
  const load = total / CAPACITY
  const overloaded = load > 1
  // 静态机身很大，把动态层量化到 20 fps，避免每帧重解析整张 SVG
  const tq = Math.round(t * 20) / 20

  const svg = useMemo(() => {
    const out: string[] = [STATIC]

    // 传送带防滑条
    for (let i = 0; i < 23; i++) {
      const x = -214 + ((t * 26 + i * 16) % 360)
      out.push(L(k.lineOnTop([x, -2], [x, 32], 29.4, P), { tone: 'faint' }))
    }

    // 僵尸主机状态灯与攻击中的包裹
    for (let i = 0; i < BOTS; i++) {
      const tier = Math.floor(i / PER_TIER)
      const bx = BOT_X[i % PER_TIER]!
      const by = TIERS[tier]!.y
      const bz = TIERS[tier]!.z
      const active = mode === 'ddos' || i === 2
      const p = at([bx, by + 4.6, bz + 11.5])
      const blink = 0.55 + 0.45 * Math.sin(t * 7 + i * 1.7)
      out.push(
        `<circle cx="${p[0]}" cy="${p[1]}" r="1.5" fill="${active ? 'var(--anatomy-red)' : 'var(--anatomy-faint)'}" opacity="${active ? blink.toFixed(2) : 0.28}"/>`,
      )
      if (active) {
        const q = ((t * 0.55 + i * 0.173) % 1)
        if (q < 0.84) {
          const x = bx + 10 * q
          const y = by + 5 + (10 - (by + 5)) * q
          const z = bz + 13 + (30 - (bz + 13)) * q + Math.sin(Math.PI * q) * 13
          out.push(cube(x, y, z, 4, RED))
        }
      }
    }
    // 单源 DoS 时把唯一的攻击者染红，并在它头顶画一圈红环
    if (mode === 'dos') {
      const bx = BOT_X[2]!
      const by = TIERS[0]!.y
      const bz = TIERS[0]!.z
      out.push(
        `<g opacity="0.55">${paint(RED, S(k.slabOf({ x: bx - 6.2, y: by - 4.7, w: 12.4, d: 9.4, r: 1.6 }, bz, 12, P, 3, 0.4), { tone: 'hi' }))}</g>`,
      )
      out.push(L(k.ring(bx, by, 8, bz + 14.6, P, 24), { tone: 'red' }))
    }

    // 合法用户的蓝色请求
    for (let i = 0; i < 2; i++) {
      const q = ((t * 0.45 + i * 0.5) % 1)
      const x = -290 + 84 * q
      const y = 52 + (12 - 52) * q
      const z = 34 + (29.6 - 34) * q + Math.sin(Math.PI * q) * 8
      out.push(cube(x, y, z, 3.6, BLUE))
    }

    // 传送带上的到达流量
    const count = overloaded ? 30 : 5
    const spacing = 344 / count
    for (let i = 0; i < count; i++) {
      const x = -212 + ((t * 28 + i * spacing) % 344)
      const y = 2 + (i % 3) * 10
      const blue = i % (overloaded ? 15 : 2) === 0
      out.push(cube(x, y, 29.4, 4.2, blue ? BLUE : RED))
    }
    // 过载：入口前堆积的包裹
    if (overloaded) {
      for (let i = 0; i < 9; i++) {
        const x = 94 + (i % 3) * 8
        const y = 2 + (i % 4) * 7
        const z = 29.4 + (i > 5 ? 4.2 : 0)
        out.push(cube(x, y, z, 4.2, RED))
      }
      // 从近侧护栏掉进溢料箱
      for (let i = 0; i < 2; i++) {
        const q = ((t * 0.8 + i * 0.45) % 1)
        out.push(cube(100 + i * 7, 40 + q * 16, 30 - q * 26, 3.8, RED))
      }
      // 溢料箱里的包裹
      for (let i = 0; i < 6; i++) {
        out.push(cube(87 + (i % 3) * 9, 63 + Math.floor(i / 3) * 10, 3 + (i > 3 ? 4 : 0), 4, RED))
      }
    }

    // 压力表：读数来自到达量 / 容量
    const gx = 269
    const gz = 100
    const gr = 10
    out.push(L(faceCircle(gx, 84.6, gz, gr), { tone: 'mid' }))
    out.push(L(faceCircle(gx, 84.6, gz, gr - 2.4), { tone: 'faint' }))
    for (let i = 0; i <= 10; i++) {
      const a = (-150 + i * 30) * (Math.PI / 180)
      const inner = gr - (i % 2 === 0 ? 3.2 : 1.8)
      out.push(
        L(
          k.segment(
            [gx + Math.sin(a) * inner, 84.6, gz + Math.cos(a) * inner],
            [gx + Math.sin(a) * (gr - 0.8), 84.6, gz + Math.cos(a) * (gr - 0.8)],
            P,
          ),
          { tone: i >= 8 ? 'red' : 'mid' },
        ),
      )
    }
    const needle = (-150 + Math.min(load / 1.5, 1) * 300) * (Math.PI / 180)
    out.push(
      L(
        k.segment([gx, 84.9, gz], [gx + Math.sin(needle) * 7.6, 84.9, gz + Math.cos(needle) * 7.6], P),
        { tone: overloaded ? 'red' : 'green' },
      ),
    )
    out.push(k.dotsSvg([at([gx, 85, gz])], { size: 1.6, tone: 'hi' }))

    // 顶部告警灯
    const beacon = overloaded ? RED : BLUE
    out.push(paint(beacon, S(k.cylinder(250, -6, 4.6, 158, 5, P, 18), { tone: 'hi' })))
    if (overloaded) {
      for (let i = 0; i < 2; i++) {
        const q = ((t * 1.05 + i * 0.5) % 1)
        out.push(`<g opacity="${(1 - q).toFixed(2)}">${L(k.ring(250, -6, 5 + q * 13, 164, P, 24), { tone: 'red' })}</g>`)
      }
      // 电机过载纹
      for (let i = 0; i < 3; i++) {
        out.push(L(k.segment([129, -26, 17 + i * 2], [143, -26, 17 + i * 2], P), { tone: 'red' }))
      }
    }
    return out.join('')
  }, [tq, mode, load, overloaded])

  return (
    <FigureCard
      fig="图 8 · 拒绝服务 DoS / DDoS"
      title="流量挤爆入口，合法请求进不来"
      subtitle="传送带是有限容量的链路，包裹是数据包。僵尸主机同时向目标机柜输送流量，入口堆积、溢出。"
      readout={
        <>
          {mode === 'ddos' ? 'DDoS · 24 个源' : 'DoS · 1 个源'} · 正常 {NORMAL} pkt/s
          <br className="sm:hidden" /> · 攻击 {attack} pkt/s · 容量 {CAPACITY} pkt/s
          <br className="sm:hidden" /> · 到达 {total} pkt/s（{Math.round(load * 100)}%）·{' '}
          <span style={{ color: overloaded ? '#ff6b6b' : '#6be0a0' }}>{overloaded ? '过载' : '未过载'}</span>
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
          onChange={(e) => setMode(e.target.value as 'ddos' | 'dos')}
          aria-label="切换 DoS 与 DDoS"
        >
          <option value="ddos">DDoS（24 个源）</option>
          <option value="dos">DoS（1 个源）</option>
        </select>
      }
      caption={
        <>
          正文的攻击流程是<strong>选目标 → 入侵周围主机组成 botnet → 从被攻陷主机发包</strong>。数值为教学示意：正常请求 8
          pkt/s、每台僵尸主机 6 pkt/s、容量 100 pkt/s。单源 DoS 只有 14 pkt/s，未过载；DDoS 由 24
          台主机聚合到 152 pkt/s，超过容量，入口堆积并溢出——攻击流量随僵尸网络规模成倍放大。
        </>
      }
    >
      <Scene width={W} height={H} label="DDoS：僵尸主机向有限容量的目标机柜输送数据包" svg={svg} />
    </FigureCard>
  )
}

/** 竖直平面（y = 常数）上的圆，投影成等距椭圆 */
function faceCircle(cx: number, y: number, cz: number, r: number, steps = 30): string {
  const pts = Array.from({ length: steps + 1 }, (_, i) => {
    const a = (i / steps) * Math.PI * 2
    return at([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r])
  })
  return k.pathOf(pts)
}
