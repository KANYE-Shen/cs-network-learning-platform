// ============================================================
// 图解：DNS 迭代 / 递归查询（k2.5.5）
// 一栋实体的三层档案楼：顶层根服务器、中层 .com TLD、底层权威服务器，
// 旁边是本地名称服务器（前台）。查询包裹沿实体升降轿厢与楼层辊道移动。
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 820
const H = 480
const CYCLE = 20
const GROUND = { x: -330, y: -90, w: 700, d: 180, r: 12 }
const BUILD = { x: -270, y: -62, w: 250, d: 120, r: 3 }
const FLOOR_Z = [0, 52, 100]
const COUNTER_TOP = [16, 68, 116]

const CONCRETE =
  '--anatomy-paper:#3d4651;--anatomy-face:#49535f;--anatomy-top:#57626f;--anatomy-lit-top:#697788;--anatomy-lit-shade:#4e5a68;--anatomy-shade-0:#2e3640;--anatomy-shade-1:#343d47;--anatomy-shade-2:#3a4450;--anatomy-shade-3:#414b57;--anatomy-lit:#ffffff'
const STEEL =
  '--anatomy-paper:#4a5563;--anatomy-face:#566270;--anatomy-top:#657283;--anatomy-lit-top:#788799;--anatomy-lit-shade:#5b6878;--anatomy-shade-0:#38424d;--anatomy-shade-1:#3e4955;--anatomy-shade-2:#444f5c;--anatomy-shade-3:#4a5664;--anatomy-lit:#ffffff'
const WOOD =
  '--anatomy-paper:#6a5638;--anatomy-face:#7a6544;--anatomy-top:#8c7650;--anatomy-lit-top:#9d8660;--anatomy-lit-shade:#7d6847;--anatomy-shade-0:#503d25;--anatomy-shade-1:#58442a;--anatomy-shade-2:#5f4b30;--anatomy-shade-3:#665137;--anatomy-lit:#ffffff'
const DARK =
  '--anatomy-paper:#20262d;--anatomy-face:#272e36;--anatomy-top:#2e3640;--anatomy-shade-0:#171c22;--anatomy-shade-1:#1b2128;--anatomy-shade-2:#20262d;--anatomy-shade-3:#242b33'
const PLATE =
  '--anatomy-paper:#343d48;--anatomy-face:#3e4854;--anatomy-top:#4a5461;--anatomy-lit-top:#4a5461;--anatomy-lit-shade:#3e4854;--anatomy-shade-0:#272e36;--anatomy-shade-1:#2d353e;--anatomy-shade-2:#323b45;--anatomy-shade-3:#38414c;--anatomy-lit:#ffffff'
const QUERY =
  '--anatomy-paper:#2f6fd0;--anatomy-face:#3d7de0;--anatomy-top:#4b8bea;--anatomy-shade-0:#245aad;--anatomy-shade-1:#2b66bd;--anatomy-shade-2:#3272cc;--anatomy-shade-3:#397edb;--anatomy-lit-top:#6ea4f2;--anatomy-lit-shade:#3a71c8;--anatomy-lit:#ffffff'
const ANSWER =
  '--anatomy-paper:#2c8a63;--anatomy-face:#38a073;--anatomy-top:#45b382;--anatomy-shade-0:#216d4d;--anatomy-shade-1:#257856;--anatomy-shade-2:#29835e;--anatomy-shade-3:#2d8e66;--anatomy-lit-top:#67c79d;--anatomy-lit-shade:#329a6f;--anatomy-lit:#ffffff'

const P = k.fitProjection(
  [...k.boxCorners(GROUND, -12, 0), [-300, -70, 172], [290, 70, 60], [-2, 40, 172]],
  W,
  H,
  { pad: 12, azimuth: 44, elevation: 34 },
)
const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)
const ease = (x: number) => {
  const v = Math.max(0, Math.min(1, x))
  return v * v * (3 - 2 * v)
}
type P3 = [number, number, number]
const mix = (a: P3, b: P3, u: number): P3 => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]

type Key = [number, P3]
type Mode = 'iter' | 'rec'
const HOST: P3 = [236, 36, 16]
const LOCAL: P3 = [89, 36, 16]
const LIFT_REST: P3 = [-2, 36, 16]
const LIFT_ROOT: P3 = [-2, 36, 116]
const LIFT_TLD: P3 = [-2, 36, 68]
const LIFT_AUTH: P3 = [-2, 36, 16]
const ROOT_C: P3 = [-170, 36, 116]
const TLD_C: P3 = [-170, 36, 68]
const AUTH_C: P3 = [-170, 36, 16]

const ITER_KEYS: Key[] = [
  [0, HOST], [2, LOCAL], [2.8, LIFT_REST], [4.3, LIFT_ROOT], [5.0, ROOT_C], [5.8, ROOT_C],
  [6.4, LIFT_ROOT], [7.5, LIFT_REST], [8.1, LOCAL], [8.7, LIFT_REST], [10.1, LIFT_TLD],
  [10.8, TLD_C], [11.6, TLD_C], [12.2, LIFT_TLD], [13.3, LIFT_REST], [13.9, LOCAL],
  [14.5, LIFT_AUTH], [15.2, AUTH_C], [16.0, AUTH_C], [16.6, LIFT_AUTH], [17.4, LIFT_REST],
  [18.0, LOCAL], [19.3, HOST], [20, HOST],
]
const REC_KEYS: Key[] = [
  [0, HOST], [2, LOCAL], [2.8, LIFT_REST], [4.3, LIFT_ROOT], [5.0, ROOT_C], [6.0, LIFT_ROOT],
  [6.8, LIFT_TLD], [7.4, TLD_C], [8.4, LIFT_TLD], [9.2, LIFT_AUTH], [9.8, AUTH_C],
  [11.2, AUTH_C], [11.8, LIFT_AUTH], [13.0, LIFT_TLD], [13.6, TLD_C], [14.2, LIFT_TLD],
  [14.8, LIFT_ROOT], [15.4, ROOT_C], [16.0, LIFT_ROOT], [16.8, LIFT_REST], [17.4, LOCAL],
  [18.6, HOST], [20, HOST],
]
type NumKey = [number, number]
const ITER_CAR: NumKey[] = [
  [0, 16], [2.8, 16], [4.3, 116], [6.4, 116], [7.5, 16], [10.1, 68], [12.2, 68],
  [13.3, 16], [14.5, 16], [16.6, 16], [17.4, 16], [20, 16],
]
const REC_CAR: NumKey[] = [
  [0, 16], [2.8, 16], [4.3, 116], [6.0, 116], [6.8, 68], [8.4, 68], [9.2, 16], [11.8, 16],
  [13.0, 68], [14.8, 116], [16.0, 116], [16.8, 16], [20, 16],
]

function sample(keys: Key[], x: number): P3 {
  if (x <= keys[0]![0]) return keys[0]![1]
  for (let i = 1; i < keys.length; i++) {
    const [t1, p1] = keys[i]!
    const [t0, p0] = keys[i - 1]!
    if (x <= t1) return mix(p0, p1, ease((x - t0) / (t1 - t0 || 1)))
  }
  return keys[keys.length - 1]![1]
}
function sampleNum(keys: NumKey[], x: number): number {
  if (x <= keys[0]![0]) return keys[0]![1]
  for (let i = 1; i < keys.length; i++) {
    const [t1, v1] = keys[i]!
    const [t0, v0] = keys[i - 1]!
    if (x <= t1) return v0 + (v1 - v0) * ease((x - t0) / (t1 - t0 || 1))
  }
  return keys[keys.length - 1]![1]
}

type Info = { end: number; server: string; result: string }
const ITER_STEPS: Info[] = [
  { end: 2, server: '本地名称服务器', result: '收到主机的递归查询' },
  { end: 5.8, server: '根服务器 198.41.0.4', result: '转介：去问 .com 顶级域服务器' },
  { end: 8.1, server: '本地名称服务器', result: '缓存 .com TLD 转介' },
  { end: 11.6, server: '.com TLD a.servers.net', result: '转介：baidu.com 的权威服务器' },
  { end: 13.9, server: '本地名称服务器', result: '缓存权威服务器转介' },
  { end: 16, server: '权威 ns1.baidu.com', result: 'A 记录答复（AA=1）' },
  { end: 18.6, server: '本地名称服务器', result: '缓存答案并回送主机' },
  { end: 20, server: '主机', result: '得到 www.baidu.com 的 A 记录' },
]
const REC_STEPS: Info[] = [
  { end: 2, server: '本地名称服务器', result: '收到主机的递归查询' },
  { end: 5, server: '根服务器 198.41.0.4', result: '递归：根继续代问下一层' },
  { end: 7.4, server: '.com TLD a.servers.net', result: '递归：TLD 继续代问' },
  { end: 9.8, server: '权威 ns1.baidu.com', result: 'A 记录答复（AA=1）' },
  { end: 14.8, server: '沿原链返回', result: '权威 → TLD → 根，逐层回送' },
  { end: 16.8, server: '本地名称服务器', result: '递归答案回到 Resolver' },
  { end: 18.6, server: '主机', result: '一次查询得到最终答案' },
  { end: 20, server: '—', result: '完成' },
]

export default function DnsTreeFigure() {
  const [mode, setMode] = useState<Mode>('iter')
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const tt = t % CYCLE
  const steps = mode === 'iter' ? ITER_STEPS : REC_STEPS
  const info = steps.find((s) => tt < s.end) ?? steps[steps.length - 1]!
  const parcel = sample(mode === 'iter' ? ITER_KEYS : REC_KEYS, tt)
  const carTop = sampleNum(mode === 'iter' ? ITER_CAR : REC_CAR, tt)
  const answered = mode === 'iter' ? tt >= 15.2 : tt >= 9.8
  const active = info.server.startsWith('根')
    ? 'root'
    : info.server.startsWith('.com')
      ? 'tld'
      : info.server.startsWith('权威')
        ? 'auth'
        : info.server.startsWith('本地')
          ? 'local'
          : info.server.startsWith('主机')
            ? 'host'
            : 'none'
  const referrals = mode === 'iter' ? (tt >= 11.6 ? 2 : tt >= 5.8 ? 1 : 0) : 0

  const svg = useMemo(() => {
    const out: string[] = []
    const mat = (style: string, build: () => void) => {
      out.push(`<g style="${style}">`)
      build()
      out.push('</g>')
    }
    const slab = (plan: k.Plan, z: number, h: number, tone: k.Tone = 'mid', opt?: k.SolidStyle) =>
      out.push(S(k.slabOf(plan, z, h, P, 4, 0.7), { tone, ...opt }))
    const cyl = (x: number, y: number, r: number, z: number, h: number, tone: k.Tone = 'lo') =>
      out.push(S(k.cylinder(x, y, r, z, h, P, 20), { tone }))
    const line = (x1: number, y1: number, x2: number, y2: number, z: number, tone: k.LineTone = 'faint') =>
      out.push(L(k.lineOnTop([x1, y1], [x2, y2], z, P), { tone }))
    const lamp = (x: number, y: number, z: number, on: boolean, color: string) => {
      const p = at([x, y, z])
      out.push(`<circle cx="${p[0]}" cy="${p[1]}" r="${on ? 4.5 : 2.4}" fill="${color}" opacity="${on ? 1 : 0.24}"/>`)
    }

    // 地面与基座
    mat(DARK, () => {
      slab(GROUND, -12, 12, 'lo', { crease: 'faint' })
      out.push(L(k.planOutline(k.insetPlan(GROUND, 12), -0.2, P), { tone: 'faint' }))
    })
    mat(CONCRETE, () => {
      slab({ x: -282, y: -74, w: 274, d: 144, r: 4 }, -10, 10, 'lo')
      slab({ x: BUILD.x, y: BUILD.y, w: BUILD.w, d: 8, r: 0 }, 0, 150, 'mid')
      slab({ x: BUILD.x, y: BUILD.y + 8, w: 10, d: BUILD.d - 8, r: 0 }, 0, 150, 'mid')
      for (const x of [-218, -158, -98]) {
        slab({ x: x - 3, y: BUILD.y + 8, w: 6, d: 6, r: 1 }, 0, 150, 'hi')
      }
    })

    // 三层：地板、档案柜、机柜、柜台、辊道、名牌（自下而上）
    for (let i = 0; i < 3; i++) {
      const z = FLOOR_Z[i]!
      const top = COUNTER_TOP[i]!
      mat(CONCRETE, () => {
        slab({ x: BUILD.x, y: BUILD.y + 8, w: BUILD.w, d: BUILD.d - 8, r: 0 }, z - 4, 4, 'mid')
        slab({ x: BUILD.x, y: BUILD.y + BUILD.d - 6, w: BUILD.w, d: 6, r: 0 }, z - 4, 8, 'hi')
        slab({ x: BUILD.x + BUILD.w - 10, y: BUILD.y + 8, w: 10, d: BUILD.d - 8, r: 0 }, z, 8, 'mid')
      })
      // 后墙档案柜：实心柜体 + 六只抽屉
      mat(WOOD, () => {
        slab({ x: -196, y: -54, w: 112, d: 30, r: 2 }, z + 2, 34, 'mid')
        for (let row = 0; row < 2; row++) {
          for (let col = 0; col < 3; col++) {
            const x = -193 + col * 36
            slab({ x, y: -25.2, w: 33, d: 2.4, r: 1 }, z + 5 + row * 15, 12, 'hi')
            out.push(S(k.slabOf({ x: x + 10, y: -24, w: 13, d: 2, r: 0.6 }, z + 10 + row * 15, 2.2, P, 2), { tone: 'hi' }))
            out.push(S(k.slabOf({ x: x + 33.2, y: -25.1, w: 1.6, d: 1.2, r: 0.3 }, z + 5 + row * 15, 12, P, 2), { tone: 'faint' }))
          }
        }
        out.push(S(k.slabOf({ x: -193, y: -25.1, w: 105, d: 1.2, r: 0.3 }, z + 18, 1.6, P, 2), { tone: 'faint' }))
      })
      // 服务器机柜：实心高柜、散热槽、顶盖与状态灯
      mat(STEEL, () => {
        slab({ x: -256, y: -48, w: 40, d: 38, r: 2 }, z + 2, 38, 'mid')
        slab({ x: -259, y: -51, w: 46, d: 44, r: 2 }, z + 40, 3, 'hi')
        for (let v = 0; v < 4; v++) {
          out.push(S(k.slabOf({ x: -250, y: -10.6, w: 28, d: 1.4, r: 0.4 }, z + 9 + v * 8, 4.4, P, 2), { tone: 'faint' }))
        }
        cyl(-226, -34, 2.2, z + 43, 2, 'hi')
      })
      lamp(-226, -34, z + 47, active === (['auth', 'tld', 'root'] as const)[i], '#6b9bff')
      // 柜台：实心柜体 + 台面 + 三只抽屉
      mat(WOOD, () => {
        slab({ x: -212, y: 8, w: 88, d: 38, r: 2 }, z + 2, 10, 'mid')
        slab({ x: -215, y: 5, w: 94, d: 44, r: 2 }, top - 4, 4, 'hi')
        for (let d = 0; d < 3; d++) {
          slab({ x: -205 + d * 29, y: 46.2, w: 26, d: 2, r: 1 }, z + 4, 7, 'hi')
          out.push(S(k.slabOf({ x: -198 + d * 29, y: 48, w: 12, d: 2, r: 0.5 }, z + 6, 2, P, 2), { tone: 'hi' }))
        }
      })
      // 楼层辊道与支脚
      mat(STEEL, () => {
        slab({ x: -128, y: 26, w: 116, d: 20, r: 1 }, top - 4, 4, 'mid')
        for (let x = -120; x <= -18; x += 14) {
          out.push(S(k.cylinder(x, 36, 2.2, top - 1, 1.6, P, 14), { tone: 'hi' }))
        }
        for (const x of [-112, -56]) {
          for (const y of [28, 42]) out.push(S(k.cylinder(x, y, 1.8, z + 2, top - 6 - z, P, 12), { tone: 'lo' }))
        }
      })
      // 实体楼层名牌
      mat(PLATE, () => {
        slab({ x: -204, y: 55.5, w: 96, d: 3, r: 1 }, z + 3, 13, 'hi')
      })
    }

    // 屋顶、女儿墙、通风帽、天线
    mat(CONCRETE, () => {
      slab({ x: -280, y: -72, w: 270, d: 140, r: 3 }, 140, 10, 'hi')
      for (const p of [
        { x: -280, y: -72, w: 270, d: 5, r: 1 },
        { x: -280, y: 63, w: 270, d: 5, r: 1 },
        { x: -280, y: -67, w: 5, d: 130, r: 1 },
        { x: -15, y: -67, w: 5, d: 130, r: 1 },
      ]) {
        slab(p, 150, 5, 'mid')
      }
      slab({ x: -236, y: -34, w: 30, d: 24, r: 2 }, 150, 8, 'mid')
      slab({ x: -233, y: -31, w: 24, d: 18, r: 1 }, 158, 2, 'hi')
      slab({ x: -168, y: 4, w: 22, d: 20, r: 2 }, 150, 6, 'mid')
      cyl(-240, -40, 4, 150, 10, 'lo')
    })
    mat(STEEL, () => {
      cyl(-100, 30, 2.2, 150, 22, 'mid')
    })
    lamp(-100, 30, 174, true, '#f3c969')

    // 近侧角柱（实体），保留剖切开口
    mat(CONCRETE, () => {
      slab({ x: -38, y: 50, w: 10, d: 10, r: 1 }, 0, 150, 'mid')
    })

    // 井道与实体升降轿厢
    mat(STEEL, () => {
      slab({ x: -20, y: 27, w: 34, d: 3, r: 0 }, 0, 150, 'lo')
      slab({ x: -17, y: 31, w: 4, d: 4, r: 0 }, 0, 150, 'mid')
      slab({ x: 9, y: 31, w: 4, d: 4, r: 0 }, 0, 150, 'mid')
      cyl(-20, 43, 2, 0, 150, 'mid')
      cyl(-2, 43, 4, 146, 3, 'mid')
      out.push(L(k.segment([-2, 43, carTop + 18], [-2, 43, 148], P), { tone: 'lo' }))
      slab({ x: -26, y: 38, w: 6, d: 10, r: 1 }, 44, 14, 'lo')
      slab({ x: -14, y: 30, w: 26, d: 26, r: 2 }, carTop - 3, 3, 'hi')
      slab({ x: -14, y: 30, w: 26, d: 4, r: 0.4 }, carTop, 16, 'mid')
      slab({ x: -14, y: 34, w: 4, d: 22, r: 0.4 }, carTop, 16, 'mid')
      slab({ x: -17, y: 28, w: 32, d: 9, r: 1 }, carTop + 16, 3, 'hi')
      cyl(-2, 36, 1.4, carTop + 18, 4, 'lo')
    })
    // 随车方向旗
    {
      const ahead = sampleNum(mode === 'iter' ? ITER_CAR : REC_CAR, Math.min(CYCLE, tt + 0.12))
      const behind = sampleNum(mode === 'iter' ? ITER_CAR : REC_CAR, Math.max(0, tt - 0.12))
      if (Math.abs(ahead - behind) > 0.3) {
        const tip = at([-2, 36, carTop + 22])
        const sy = ahead > behind ? -1 : 1
        out.push(
          `<path d="M${tip[0]},${tip[1]} L${tip[0] + 10},${tip[1] + sy * 6} L${tip[0] + 10},${tip[1] + sy * 1} Z" fill="${answered ? '#6be0a0' : '#6b9bff'}" opacity="0.95"/>`,
        )
      }
    }

    // 本地名称服务器前台：实体柜体、台面、显示器、托盘、椅子
    mat(WOOD, () => {
      slab({ x: 54, y: 2, w: 70, d: 46, r: 2 }, 0, 10, 'mid')
      slab({ x: 51, y: -1, w: 76, d: 52, r: 2 }, 12, 4, 'hi')
      for (let d = 0; d < 2; d++) {
        slab({ x: 62 + d * 30, y: 48.2, w: 26, d: 2, r: 1 }, 3, 6, 'hi')
      }
    })
    mat(STEEL, () => {
      slab({ x: 96, y: 8, w: 22, d: 5, r: 1 }, 16, 12, 'mid')
      slab({ x: 98, y: 7, w: 18, d: 2, r: 0.5 }, 18, 8, 'hi', { lit: active === 'local' })
      slab({ x: 62, y: 24, w: 30, d: 18, r: 1 }, 16, 2, 'mid')
      for (let i = 0; i < referrals; i++) {
        slab({ x: 65 + i * 4, y: 27 + i * 3, w: 22, d: 11, r: 0.5 }, 18 + i * 1.6, 1.4, 'hi')
      }
      cyl(72, 16, 2.6, 16, 5, 'lo')
    })
    lamp(114, 12, 29, active === 'local', '#5fe0a0')
    mat(WOOD, () => {
      for (const [x, y] of [
        [66, -12],
        [84, -12],
        [66, -2],
        [84, -2],
      ]) {
        cyl(x, y, 1.6, 0, 10, 'lo')
      }
      slab({ x: 60, y: -16, w: 30, d: 16, r: 2 }, 10, 3, 'mid')
      slab({ x: 60, y: -20, w: 30, d: 4, r: 1 }, 13, 13, 'mid')
    })
    // 主机 / 客户端工位
    mat(WOOD, () => {
      slab({ x: 196, y: 2, w: 64, d: 46, r: 2 }, 0, 10, 'mid')
      slab({ x: 193, y: -1, w: 70, d: 52, r: 2 }, 12, 4, 'hi')
      slab({ x: 202, y: 8, w: 22, d: 4, r: 1 }, 16, 9, 'mid')
      slab({ x: 204, y: 6, w: 18, d: 2, r: 0.5 }, 18, 6, 'hi', { lit: active === 'host' })
      slab({ x: 204, y: 18, w: 26, d: 12, r: 1 }, 16, 1.6, 'mid')
      for (const [x, y] of [
        [206, -12],
        [232, -12],
        [206, -2],
        [232, -2],
      ]) {
        cyl(x, y, 1.6, 0, 10, 'lo')
      }
      slab({ x: 202, y: -16, w: 32, d: 16, r: 2 }, 10, 3, 'mid')
      slab({ x: 202, y: -20, w: 32, d: 4, r: 1 }, 13, 13, 'mid')
    })
    mat(STEEL, () => {
      cyl(250, 22, 2.8, 16, 5, 'lo')
      slab({ x: 240, y: 16, w: 18, d: 4, r: 1 }, 16, 2, 'hi')
    })
    lamp(252, 12, 29, active === 'host', '#f3c969')

    // 工位到升降台的辊道
    mat(STEEL, () => {
      slab({ x: 126, y: 30, w: 64, d: 16, r: 1 }, 12, 4, 'mid')
      slab({ x: 12, y: 30, w: 40, d: 16, r: 1 }, 12, 4, 'mid')
      for (const x of [16, 30, 42, 140, 166, 184]) {
        out.push(S(k.cylinder(x, 38, 2, 15, 1.6, P, 14), { tone: 'hi' }))
      }
    })

    // 查询包裹：蓝 = 查询，绿 = 答案
    mat(answered ? ANSWER : QUERY, () => {
      const [px, py, pz] = parcel
      slab({ x: px - 12, y: py - 8, w: 24, d: 16, r: 1 }, pz, 13, 'hi')
      slab({ x: px - 8, y: py - 6, w: 16, d: 10, r: 0.5 }, pz + 13, 1.6, 'hi')
      line(px - 4, py - 1, px + 4, py - 1, pz + 15, 'lit')
    })

    // 四个标签：根 / 顶级域 / 权威 / 本地名称服务器
    const label = (x: number, y: number, z: number, text: string) => {
      const p = at([x, y, z])
      out.push(
        `<text x="${p[0]}" y="${p[1]}" font-family="ui-monospace, Menlo, monospace" font-size="12" text-anchor="middle" fill="#f2f5f8" style="paint-order:stroke;stroke:#10151a;stroke-width:1.8px;stroke-linejoin:round">${text}</text>`,
      )
    }
    label(-156, 54, 112, '根服务器')
    label(-156, 54, 64, '顶级域 .com')
    label(-156, 54, 12, '权威服务器')
    label(89, 55, 2, '本地名称服务器')
    return out.join('')
  }, [mode, tt, parcel[0], parcel[1], parcel[2], carTop, answered, active, referrals])

  return (
    <FigureCard
      fig="图 14 · 迭代与递归查询"
      title="同一栋 DNS 档案楼，两种“谁继续查”的分工"
      subtitle="包裹是查询：蓝色代表提问，绿色代表拿到答案。迭代时包裹每问一层都回到前台；递归时由服务器带着包裹逐层代问到底。"
      readout={
        <>
          模式 {mode === 'iter' ? '迭代查询' : '递归查询'} · 域名 www.baidu.com · 当前 {info.server} · {info.result}
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
          onChange={(e) => {
            setMode(e.target.value as Mode)
            setT(0)
          }}
          aria-label="选择迭代查询或递归查询"
        >
          <option value="iter">迭代查询（本地逐跳发问）</option>
          <option value="rec">递归查询（服务器代问到底）</option>
        </select>
      }
      caption={
        <>
          迭代：本地名称服务器逐跳去问根、.com TLD、权威，<strong>每一跳都回到前台</strong>，线索（转介）由它自己继续追。
          递归：被问的服务器<strong>替提问者继续查到底</strong>才回复。真实互联网采用混合方式：主机 → 本地服务器是递归，本地服务器 → 根 /
          TLD / 权威是迭代。
        </>
      }
    >
      <Scene width={W} height={H} label="DNS 迭代查询与递归查询：实体档案楼与本地名称服务器" svg={svg} />
    </FigureCard>
  )
}
