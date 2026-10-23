// ============================================================
// 图解：SMTP 投递（k2.4.2）——邮局分拣线：写字桌 → 发件服务器
// → 传送带/邮车 → 收件服务器邮箱格架 → 收件人桌面
// 读数与正文一致：TCP 25、HELO / MAIL FROM / RCPT TO / DATA / .
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 820
const H = 430
const CYCLE = 21

const GROUND = { x: -320, y: -72, w: 632, d: 144, r: 12 }
const SEND_BODY = { x: -232, y: -32, w: 76, d: 64, r: 4 }
const RECV_BODY = { x: 112, y: -36, w: 88, d: 72, r: 4 }
const BELT = { x: -200, y: -13, w: 100, d: 26, r: 2 }
const CELL_W = 26
const CELL_D = 20
const RACK = { x: 118, y: -30, w: 78, d: 60 }
const CELL: [number, number, number] = [RACK.x + CELL_W + CELL_W / 2, RACK.y + CELL_D + CELL_D / 2, 55]

const CONCRETE =
  '--anatomy-paper:#3a434e;--anatomy-face:#46515d;--anatomy-top:#55616e;--anatomy-lit-top:#677585;--anatomy-lit-shade:#4c5765;--anatomy-shade-0:#2c343d;--anatomy-shade-1:#323b45;--anatomy-shade-2:#384250;--anatomy-shade-3:#3f4955;--anatomy-lit:#ffffff'
const STEEL =
  '--anatomy-paper:#4a5563;--anatomy-face:#566270;--anatomy-top:#657283;--anatomy-lit-top:#788799;--anatomy-lit-shade:#5b6878;--anatomy-shade-0:#38424d;--anatomy-shade-1:#3e4955;--anatomy-shade-2:#444f5c;--anatomy-shade-3:#4a5664;--anatomy-lit:#ffffff'
const WOOD =
  '--anatomy-paper:#6a5638;--anatomy-face:#7a6544;--anatomy-top:#8c7650;--anatomy-lit-top:#9d8660;--anatomy-lit-shade:#7d6847;--anatomy-shade-0:#503d25;--anatomy-shade-1:#58442a;--anatomy-shade-2:#5f4b30;--anatomy-shade-3:#665137;--anatomy-lit:#ffffff'
const DARK =
  '--anatomy-paper:#20262d;--anatomy-face:#272e36;--anatomy-top:#2e3640;--anatomy-shade-0:#171c22;--anatomy-shade-1:#1b2128;--anatomy-shade-2:#20262d;--anatomy-shade-3:#242b33'
const PAPER =
  '--anatomy-paper:#d3ccbc;--anatomy-face:#e0dacb;--anatomy-top:#eee8da;--anatomy-lit-top:#fffdf6;--anatomy-lit-shade:#e6dfd0;--anatomy-shade-0:#b0a897;--anatomy-shade-1:#bdb5a4;--anatomy-shade-2:#c9c1b1;--anatomy-shade-3:#d6cebe;--anatomy-lit:#ffffff'

const P = k.fitProjection(
  [...k.boxCorners(GROUND, -8, 0), [-310, -40, 66], [330, 50, 70], [157, 0, 72], [-186, 0, 62]],
  W,
  H,
  { pad: 14, azimuth: 44, elevation: 34 },
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

type Step = { end: number; cmd: string; resp: string; phase: string; tone: 'green' | 'blue' | 'hi' }
const STEPS: Step[] = [
  { end: 3, cmd: '— 撰写邮件', resp: 'Alice 的 UA', phase: '准备', tone: 'hi' },
  { end: 4.5, cmd: 'HELO crepes.fr', resp: '250 Hello crepes.fr', phase: '握手', tone: 'green' },
  { end: 6, cmd: 'MAIL FROM: <alice@crepes.fr>', resp: '250 Sender ok', phase: '握手', tone: 'green' },
  { end: 7.5, cmd: 'RCPT TO: <bob@hamburger.edu>', resp: '250 Recipient ok', phase: '握手', tone: 'green' },
  { end: 12, cmd: 'DATA', resp: '354 Enter mail', phase: '传输', tone: 'blue' },
  { end: 16.5, cmd: '正文经 TCP 25 传输', resp: 'persistent connection', phase: '传输', tone: 'blue' },
  { end: 18, cmd: '.', resp: '250 Message accepted', phase: '传输', tone: 'blue' },
  { end: 19.5, cmd: 'QUIT', resp: '221 closing connection', phase: '关闭', tone: 'hi' },
  { end: 21, cmd: '— Bob 读取邮件', resp: 'POP3 / IMAP', phase: '完成', tone: 'green' },
]

export default function SmtpFigure() {
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const tt = t % CYCLE
  const step = STEPS.find((s) => tt < s.end) ?? STEPS[STEPS.length - 1]!

  const moving = tt < 12 ? 0 : tt < 15 ? (tt - 12) / 3 : 1
  const tx = -84 + 82 * ease(moving)
  const truck: P3 = [tx + 27, 0, 46]

  const envAt = (x: number): P3 => {
    const desk: P3 = [-278, 2, 24]
    const table: P3 = [-186, 0, 38]
    const beltEnd: P3 = [-104, 0, 38]
    if (x < 3) return desk
    if (x < 4.5) return mix(desk, table, ease((x - 3) / 1.5))
    if (x < 7.5) return table
    if (x < 10.5) return mix(table, beltEnd, ease((x - 7.5) / 3))
    if (x < 12) return mix(beltEnd, truck, ease((x - 10.5) / 1.5))
    if (x < 16.5) return truck
    if (x < 17.4) return mix(truck, [102, 0, 46], ease((x - 16.5) / 0.9))
    if (x < 18) return mix([102, 0, 46], [157, 0, 58], ease((x - 17.4) / 0.6))
    if (x < 18.4) return mix([157, 0, 58], CELL, ease((x - 18) / 0.4))
    return CELL
  }

  const svg = useMemo(() => {
    const out: string[] = []
    const mat = (style: string, build: () => void) => {
      out.push(`<g style="${style}">`)
      build()
      out.push('</g>')
    }
    const env = envAt(tt)
    const lampOn = step.phase === '握手' ? 0 : step.phase === '传输' ? 1 : step.phase === '关闭' ? 2 : 3
    const lampColors = ['#5fe0a0', '#59a8ff', '#f0f2f5', '#f3c969']
    const accepted = tt > 17.8
    const beltOn = tt > 7.5 && tt < 12
    const shift = beltOn ? (tt * 22) % 16 : 0

    const slab = (plan: k.Plan, z: number, h: number, tone: k.Tone = 'mid', opt?: k.SolidStyle) =>
      out.push(S(k.slabOf(plan, z, h, P, 4, 0.7), { tone, ...opt }))
    const cyl = (x: number, y: number, r: number, z: number, h: number, tone: k.Tone = 'lo') =>
      out.push(S(k.cylinder(x, y, r, z, h, P, 18), { tone }))
    const tray = (plan: k.Plan, z: number, floor: number, wall: number, tone: k.Tone) => {
      slab(plan, z, floor, tone)
      const rim: k.Plan[] = [
        { ...plan, d: 2 },
        { x: plan.x, y: plan.y + plan.d - 2, w: plan.w, d: 2, r: 0.5 },
        { x: plan.x, y: plan.y + 2, w: 2, d: plan.d - 4, r: 0.5 },
        { x: plan.x + plan.w - 2, y: plan.y + 2, w: 2, d: plan.d - 4, r: 0.5 },
      ]
      for (const w of rim) slab(w, z + floor, wall, 'mid')
    }

    // 地面与铁轨
    mat(DARK, () => {
      slab(GROUND, -10, 10, 'lo', { crease: 'faint' })
      out.push(L(k.planOutline(k.insetPlan(GROUND, 10), -0.2, P), { tone: 'faint' }))
      for (let sx = -74; sx <= 64; sx += 22) {
        slab({ x: sx - 3, y: -27, w: 6, d: 54, r: 0.6 }, -1, 2, 'faint')
      }
    })
    mat(CONCRETE, () => {
      for (const y of [-25, 21]) slab({ x: -88, y, w: 186, d: 4, r: 1 }, 0, 2, 'mid')
    })

    // 发件人写字桌：实体桌体 + 抽屉
    mat(WOOD, () => {
      slab({ x: -306, y: -24, w: 56, d: 48, r: 3 }, 20, 4, 'hi')
      slab({ x: -304, y: -18, w: 22, d: 36, r: 2 }, 0, 20, 'mid')
      for (let d = 0; d < 2; d++) {
        slab({ x: -303, y: 18.2, w: 20, d: 1.6, r: 0.6 }, 4 + d * 7, 5, 'hi')
        out.push(S(k.slabOf({ x: -298, y: 19.4, w: 10, d: 1.6, r: 0.5 }, 6 + d * 7, 1.8, P, 2), { tone: 'hi' }))
      }
      for (const [x, y] of [
        [-258, -18],
        [-258, 18],
      ]) {
        cyl(x, y, 2.2, 0, 20, 'mid')
      }
      slab({ x: -299, y: -12, w: 24, d: 22, r: 1 }, 24, 1.5, 'hi')
      cyl(-302, 14, 3, 24, 7, 'mid')
      cyl(-291, 14, 1.4, 24, 12, 'lo')
    })
    mat(WOOD, () => {
      for (const [x, y] of [
        [-282, 30],
        [-264, 30],
        [-282, 40],
        [-264, 40],
      ]) {
        cyl(x, y, 1.6, 0, 12, 'lo')
      }
      slab({ x: -286, y: 26, w: 26, d: 18, r: 2 }, 12, 3, 'mid')
      slab({ x: -286, y: 40, w: 26, d: 4, r: 1 }, 15, 14, 'mid')
    })

    // 发件服务器：厚机柜、分拣台、控制面板、发件筐
    mat(STEEL, () => {
      for (const [x, y] of [
        [-226, -32],
        [-162, -32],
        [-226, 32],
        [-162, 32],
      ]) {
        cyl(x, y, 2.6, -8, 8, 'lo')
      }
      slab(SEND_BODY, 0, 30, 'mid')
      slab({ x: -230, y: -30, w: 72, d: 60, r: 2 }, 30, 4, 'hi')
      for (let d = 0; d < 2; d++) {
        slab({ x: -228, y: 32.2, w: 68, d: 1.8, r: 0.6 }, 4 + d * 9, 8, 'hi')
        slab({ x: -208, y: 34, w: 28, d: 1.8, r: 0.5 }, 7 + d * 9, 2.4, 'hi')
        out.push(L(k.segment([-228, 32.2, 4 + d * 9], [-160, 32.2, 4 + d * 9], P), { tone: 'faint' }))
      }
      slab({ x: -224, y: 32.2, w: 42, d: 2, r: 1 }, 22, 5, 'mid')
      slab({ x: -228, y: -28, w: 72, d: 56, r: 2 }, 34, 2, 'hi')
      slab({ x: -226, y: -26, w: 26, d: 22, r: 2 }, 36, 14, 'mid')
      slab({ x: -223, y: -23, w: 20, d: 16, r: 1 }, 50, 1, 'faint')
      for (const [x, y] of [
        [-225, -25],
        [-201, -25],
        [-225, -5],
        [-201, -5],
      ]) {
        slab({ x, y, w: 2, d: 2, r: 0.4 }, 36, 16, 'mid')
      }
      cyl(-166, -12, 6, 34, 2, 'hi')
      cyl(-166, -12, 4.6, 36, 1, 'lo')
    })
    for (let i = 0; i < 3; i++) {
      const p = at([-218 + i * 14, 33.8, 25])
      out.push(`<circle cx="${p[0]}" cy="${p[1] - 1}" r="3.4" fill="${lampColors[i]}" opacity="${lampOn === i ? 1 : 0.25}"/>`)
    }
    mat(WOOD, () => {
      slab({ x: -222, y: -22, w: 18, d: 13, r: 0.6 }, 50, 1, 'hi', { lit: true })
      slab({ x: -220, y: -20, w: 16, d: 12, r: 0.6 }, 51.4, 1, 'hi', { lit: true })
      slab({ x: -217, y: -17, w: 15, d: 10, r: 0.6 }, 52.8, 1, 'hi', { lit: true })
    })

    // 传送带：厚机架、侧轨、滚轮与支脚
    mat(STEEL, () => {
      slab(BELT, 34, 4, 'mid')
      for (const y of [-14, 10]) slab({ x: BELT.x, y, w: BELT.w, d: 2, r: 0.5 }, 34, 6, 'hi')
      for (let x = BELT.x + 8 + shift; x < BELT.x + BELT.w - 4; x += 16) {
        slab({ x: x - 1, y: -10, w: 2, d: 20, r: 0.4 }, 38, 1.2, 'faint')
      }
      for (const x of [-198, -170, -142, -114]) cyl(x, 0, 3, 38, 1.4, 'hi')
      for (const x of [-124, -108]) {
        for (const y of [-11, 11]) cyl(x, y, 2, 0, 34, 'lo')
      }
    })

    // 收件服务器：厚机柜 + 实心邮件格架 + 抽屉
    mat(STEEL, () => {
      for (const [x, y] of [
        [120, -36],
        [192, -36],
        [120, 38],
        [192, 38],
      ]) {
        cyl(x, y, 2.6, -8, 8, 'lo')
      }
      slab(RECV_BODY, 0, 42, 'mid')
      slab({ x: 116, y: -32, w: 82, d: 64, r: 2 }, 42, 3, 'hi')
      for (let d = 0; d < 2; d++) {
        slab({ x: 120, y: 36.2, w: 74, d: 1.8, r: 0.6 }, 6 + d * 10, 8, 'hi')
        slab({ x: 143, y: 38, w: 26, d: 1.8, r: 0.5 }, 9 + d * 10, 2.4, 'hi')
      }
      slab({ x: RACK.x, y: RACK.y, w: RACK.w, d: RACK.d, r: 2 }, 45, 10, 'mid')
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          slab(
            k.insetPlan({ x: RACK.x + col * CELL_W, y: RACK.y + row * CELL_D, w: CELL_W, d: CELL_D, r: 0.6 }, 2),
            55,
            1,
            'faint',
          )
        }
      }
      for (let col = 0; col <= 3; col++) {
        slab({ x: RACK.x + col * CELL_W - 1, y: RACK.y, w: 2, d: RACK.d, r: 0.3 }, 55, 6, 'hi')
      }
      for (let row = 0; row <= 3; row++) {
        slab({ x: RACK.x, y: RACK.y + row * CELL_D - 1, w: RACK.w, d: 2, r: 0.3 }, 55, 6, 'hi')
      }
    })
    const rl = at([198, 38, 30])
    out.push(`<circle cx="${rl[0]}" cy="${rl[1]}" r="4" fill="#5fe0a0" opacity="${accepted ? 1 : 0.2}"/>`)

    // 收件人的桌面：实体桌体 + 显示器
    mat(WOOD, () => {
      slab({ x: 236, y: -24, w: 56, d: 48, r: 3 }, 18, 4, 'hi')
      slab({ x: 238, y: -18, w: 20, d: 36, r: 2 }, 0, 18, 'mid')
      for (const [x, y] of [
        [284, -18],
        [284, 18],
      ]) {
        cyl(x, y, 2, 0, 18, 'mid')
      }
      slab({ x: 250, y: -4, w: 24, d: 6, r: 1 }, 22, 13, 'mid')
      slab({ x: 252, y: -6, w: 20, d: 2, r: 0.6 }, 24, 9, 'hi', { lit: accepted })
      slab({ x: 252, y: 8, w: 22, d: 8, r: 1 }, 22, 1.5, 'mid')
      cyl(272, 20, 3, 22, 5, 'lo')
    })

    // 邮车：厚底盘、实心货箱、驾驶室、轮子
    mat(STEEL, () => {
      slab({ x: tx, y: -24, w: 96, d: 48, r: 3 }, 8, 6, 'mid')
      for (const [dx, dy] of [
        [16, -29],
        [60, -29],
        [16, 29],
        [60, 29],
      ]) {
        cyl(tx + dx, dy, 4.8, 0, 9, 'lo')
      }
      slab({ x: tx + 2, y: -24, w: 62, d: 48, r: 3 }, 14, 30, 'mid')
      slab({ x: tx + 6, y: -20, w: 54, d: 40, r: 2 }, 44, 2, 'hi')
      for (let r = 0; r < 3; r++) {
        out.push(L(k.segment([tx + 10 + r * 20, -23.8, 20], [tx + 10 + r * 20, -23.8, 40], P), { tone: 'faint' }))
      }
      slab({ x: tx + 64, y: -20, w: 30, d: 40, r: 3 }, 14, 24, 'hi')
      slab({ x: tx + 64, y: -20, w: 30, d: 40, r: 3 }, 38, 2, 'mid')
      slab({ x: tx + 92, y: -16, w: 3, d: 32, r: 1 }, 21, 12, 'lo')
      cyl(tx + 88, -14, 2.6, 36, 2.5, 'hi')
      tray({ x: tx + 10, y: -14, w: 34, d: 28, r: 2 }, 44, 2, 6, 'hi')
      slab({ x: tx + 16, y: -25, w: 20, d: 2, r: 0.6 }, 24, 8, 'lo')
    })
    const port = at([tx + 26, -25.6, 28])
    out.push(`<text class="iso-face-text" data-tone="hi" x="${port[0]}" y="${port[1]}" font-size="9" text-anchor="middle">25</text>`)

    // 收件台（邮车与邮箱格架之间）
    mat(STEEL, () => {
      slab({ x: 94, y: -14, w: 18, d: 28, r: 2 }, 42, 4, 'mid')
      for (const y of [-14, 12]) cyl(103, y, 2, 0, 42, 'lo')
    })

    // 信件与 SMTP 命令小票（主体，最后画）
    mat(PAPER, () => {
      slab({ x: env[0] - 9, y: env[1] - 6, w: 18, d: 12, r: 0.8 }, env[2], 2.4, 'hi', { lit: true })
      out.push(L(k.lineOnTop([env[0] - 9, env[1] - 6], [env[0], env[1] + 1], env[2] + 2.4, P), { tone: 'faint' }))
      out.push(L(k.lineOnTop([env[0] + 9, env[1] - 6], [env[0], env[1] + 1], env[2] + 2.4, P), { tone: 'faint' }))
      slab({ x: env[0] + 1, y: env[1] - 5, w: 6, d: 5, r: 0.5 }, env[2] + 2.4, 1, 'mid')
      slab({ x: env[0] + 10, y: env[1] - 12, w: 16, d: 10, r: 0.5 }, env[2] + 0.6, 1, 'hi')
      out.push(L(k.lineOnTop([env[0] + 12, env[1] - 10], [env[0] + 24, env[1] - 10], env[2] + 1.8, P), { tone: step.tone }))
      out.push(L(k.lineOnTop([env[0] + 12, env[1] - 7], [env[0] + 22, env[1] - 7], env[2] + 1.8, P), { tone: 'faint' }))
      out.push(L(k.lineOnTop([env[0] + 12, env[1] - 4.5], [env[0] + 20, env[1] - 4.5], env[2] + 1.8, P), { tone: 'faint' }))
    })

    // 四个实体标签
    const label = (x: number, y: number, z: number, text: string) => {
      const p = at([x, y, z])
      out.push(
        `<text x="${p[0]}" y="${p[1]}" font-family="ui-monospace, Menlo, monospace" font-size="12" text-anchor="middle" fill="#f2f5f8" style="paint-order:stroke;stroke:#10151a;stroke-width:1.8px;stroke-linejoin:round">${text}</text>`,
      )
    }
    label(-280, 44, 2, '发件人')
    label(-186, 50, 2, '发件服务器')
    label(156, 50, 2, '收件服务器')
    label(264, 42, 2, '收件人')
    return out.join('')
  }, [tt, step])

  const pct = Math.round((tt / CYCLE) * 100)
  return (
    <FigureCard
      fig="图 13 · SMTP 投递"
      title="邮局分拣线：一封信沿 TCP 25 被“推”到收件服务器"
      subtitle="信件是消息实体，随信小票记录当前 SMTP 命令；HELO / MAIL FROM / RCPT TO 建立会话，DATA 之后正文被推过传送带与邮车。"
      readout={
        <>
          命令 {step.cmd} · 响应 {step.resp} · 阶段 {step.phase} · 端口 25 · {pct}%
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
          SMTP 是 <strong>push（推）</strong>模型：发件服务器主动把消息推给收件服务器（端口 25）。会话分
          <strong>握手 → 传输 → 关闭</strong>三段；正文以单独一行 “.” 结束，收件服务器回 250 后放入邮箱。
        </>
      }
    >
      <Scene width={W} height={H} label="SMTP 投递过程：写字桌、分拣机柜、传送带、邮车与邮箱格架" svg={svg} />
    </FigureCard>
  )
}
