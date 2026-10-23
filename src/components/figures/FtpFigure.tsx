// ============================================================
// 图解：FTP 控制连接（21）与数据连接（20）（k2.3.1）
// 两台机柜之间铺两条实体管道：细控制管常开、粗数据管按传输开合。
// 控制票据 USER/PASS/LIST/RETR 走 21；文件箱/目录列表走 20。
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 620
const H = 390
const CLIENT_X = -176
const SERVER_X = 176
const CTRL_Y = -16
const DATA_Y = 10
const GATE_X = 92

type Cargo = 'listing' | 'file' | null
type Phase = {
  cmd: string
  detail: string
  code: string
  openData: boolean
  cargo: Cargo
  dur: number
  closing?: boolean
}

const PHASES: Phase[] = [
  { cmd: 'USER', detail: '声明用户名', code: '331 Username OK, password required', openData: false, cargo: null, dur: 2.2 },
  { cmd: 'PASS', detail: '提交密码', code: '认证完成', openData: false, cargo: null, dur: 2.2 },
  { cmd: 'LIST', detail: '列出远程目录', code: '125 Data connection open; transfer starting', openData: true, cargo: 'listing', dur: 2.8 },
  { cmd: 'RETR', detail: '取回文件', code: '125 Data connection open; transfer starting', openData: true, cargo: 'file', dur: 3.0 },
  { cmd: '—', detail: '传输完成，关闭数据连接', code: '控制连接 21 仍保持打开', openData: false, cargo: null, dur: 2.0, closing: true },
]
const DURATIONS = PHASES.map((p) => p.dur)
const CYCLE = DURATIONS.reduce((a, b) => a + b, 0)

const GROUND = { x: -240, y: -80, w: 480, d: 160, r: 14 }
const P = k.fitProjection(
  [...k.boxCorners(GROUND, -8, 0), [-238, 0, 0], [238, 0, 0], [0, 0, 96], [0, 22, 66]],
  W,
  H,
  { pad: 12, azimuth: 32, elevation: 36 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)
const lerp = (a: number, b: number, t: number) => a + (b - a) * Math.max(0, Math.min(1, t))
const led = (p: [number, number, number], color: 'green' | 'red', r = 1.2) => {
  const [x, y] = at(p)
  return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${r}" fill="var(--anatomy-${color})"/>`
}
const smooth = (x: number) => {
  const v = Math.max(0, Math.min(1, x))
  return v * v * (3 - 2 * v)
}

function cabinet(cx: number, server: boolean, dataOpen: boolean) {
  const out: string[] = []
  for (const dx of [-34, 34]) {
    for (const dy of [-26, 26]) out.push(S(k.cylinder(cx + dx, dy, 3.6, 0, 4, P, 12), { tone: 'lo' }))
  }
  out.push(S(k.slabOf({ x: cx - 40, y: -34, w: 80, d: 68, r: 4 }, 4, 5, P, 4, 0.8), { tone: 'lo' }))
  out.push(S(k.slabOf({ x: cx - 36, y: -30, w: 72, d: 60, r: 3 }, 9, 76, P, 4, 1), { tone: 'mid' }))
  out.push(S(k.slabOf({ x: cx - 40, y: -34, w: 80, d: 68, r: 4 }, 85, 5, P, 4, 1), { tone: 'hi' }))
  for (const x of [-32, 4]) {
    out.push(S(k.slabOf({ x: cx + x, y: 30, w: 28, d: 2.4, r: 2 }, 13, 68, P, 3, 0.6), { tone: 'hi' }))
  }
  for (const x of [-4, 4]) {
    out.push(S(k.cylinder(cx + x, 35, 1.3, 45, 10, P, 10), { tone: 'hi' }))
  }
  // 右门散热栅
  for (let i = 0; i < 5; i++) {
    out.push(S(k.slabOf({ x: cx + 9, y: 32.2, w: 18, d: 1.2, r: 1 }, 58 + i * 5, 1.6, P, 2), { tone: 'lo' }))
  }
  for (let i = 0; i < 4; i++) {
    out.push(L(k.lineOnTop([cx - 30, -22 + i * 9], [cx + 30, -22 + i * 9], 90.2, P), { tone: 'faint' }))
  }
  out.push(led([cx + 22, 31.6, 73], 'green', 1.1), led([cx + 28, 31.6, 73], 'green', 1.1))
  if (server) {
    out.push(led([cx + 16, 31.8, 50], dataOpen ? 'green' : 'red', 1.4))
    // 端口铭牌：21（控制）与 20（数据）
    out.push(S(k.slabOf({ x: cx - 30, y: 30.8, w: 16, d: 1.4, r: 1.2 }, 56, 10, P, 2, 0.4), { tone: 'hi' }))
    out.push(k.faceTextSvg(k.sideMatrix([cx - 22, 31.6], 62.5, P, 'left'), '21', { size: 4, tone: 'hi', anchor: 'middle' }))
    out.push(S(k.slabOf({ x: cx - 30, y: 30.8, w: 16, d: 1.4, r: 1.2 }, 28, 10, P, 2, 0.4), { tone: 'hi' }))
    out.push(k.faceTextSvg(k.sideMatrix([cx - 22, 31.6], 34.5, P, 'left'), '20', { size: 4, tone: 'hi', anchor: 'middle' }))
  }
  return out
}

function fileBox(x: number, kind: Exclude<Cargo, null>) {
  const out: string[] = []
  if (kind === 'listing') {
    out.push(S(k.slabOf({ x: x - 7, y: DATA_Y - 5, w: 14, d: 10, r: 1 }, 45, 1.4, P, 2, 0.3), { tone: 'hi', lit: true }))
    out.push(L(k.lineOnTop([x - 4, DATA_Y - 3], [x + 4, DATA_Y - 3], 46.6, P), { tone: 'faint' }))
    out.push(L(k.lineOnTop([x - 4, DATA_Y], [x + 3, DATA_Y], 46.6, P), { tone: 'faint' }))
  } else {
    out.push(S(k.slabOf({ x: x - 11, y: DATA_Y - 7, w: 22, d: 14, r: 2 }, 45, 11, P, 3, 1), { tone: 'mid', lit: true }))
    out.push(S(k.slabOf({ x: x - 8, y: DATA_Y - 4, w: 16, d: 8, r: 1 }, 56, 1, P, 2), { tone: 'hi', flat: true }))
    out.push(L(k.lineOnTop([x - 8, DATA_Y - 7], [x - 8, DATA_Y + 7], 56.2, P), { tone: 'faint' }))
    out.push(L(k.lineOnTop([x + 8, DATA_Y - 7], [x + 8, DATA_Y + 7], 56.2, P), { tone: 'faint' }))
  }
  return out
}

export default function FtpFigure() {
  const frozen = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('t')
  const [running, setRunning] = useState(!prefersStillness() && !frozen)
  const [t, setT] = usePlayClock(running, initialTime())

  const clock = ((t % CYCLE) + CYCLE) % CYCLE
  let acc = 0
  let phaseIndex = 0
  for (let i = 0; i < PHASES.length; i++) {
    if (clock < acc + PHASES[i]!.dur) {
      phaseIndex = i
      break
    }
    acc += PHASES[i]!.dur
    phaseIndex = i
  }
  const phase = PHASES[phaseIndex]!
  const p = Math.max(0, Math.min(1, (clock - acc) / phase.dur))
  const open = phase.openData

  // 闸门升程：打开时抬起，传输结束的阶段落下
  const lift = open ? 12 * smooth(p * 5) : phase.closing ? 12 * (1 - smooth(p * 3)) : 0
  // 货物沿数据管从服务器送往客户端
  let cargoKind: Cargo = null
  let cargoX = 112
  if (open) {
    cargoKind = phase.cargo
    cargoX = lerp(110, -112, smooth((p - 0.22) / 0.6))
  } else if (phase.closing) {
    cargoKind = 'file'
    cargoX = -112
  }
  // 控制票据由客户端送往服务器
  const showTicket = phase.cmd !== '—'
  const ticketX = lerp(-108, 108, Math.min(p * 1.25, 1))

  const svg = useMemo(() => {
    const out: string[] = []
    out.push(S(k.slabOf(GROUND, -8, 8, P, 10, 1), { tone: 'lo' }))

    // 控制管的支撑（细、靠后）
    for (const x of [-64, 0, 64]) {
      out.push(S(k.cylinder(x, CTRL_Y, 5, 0, 3, P, 12), { tone: 'lo' }))
      out.push(S(k.cylinder(x, CTRL_Y, 2.4, 3, 53, P, 10), { tone: 'mid' }))
      out.push(S(k.slabOf({ x: x - 5, y: CTRL_Y - 7, w: 10, d: 14, r: 2 }, 54, 4, P, 2), { tone: 'mid' }))
    }
    // 细控制管：21 端口，常开
    out.push(S(k.slabOf({ x: -140, y: CTRL_Y - 6, w: 280, d: 12, r: 5 }, 58, 8, P, 5, 1.4), { tone: 'mid' }))
    out.push(L(k.lineOnTop([-128, CTRL_Y], [128, CTRL_Y], 66.2, P), { tone: 'green', flow: running }))
    for (const x of [-96, -48, 0, 48, 96]) {
      out.push(S(k.slabOf({ x: x - 2, y: CTRL_Y - 8, w: 4, d: 16, r: 1 }, 57, 9, P, 2, 0.4), { tone: 'hi' }))
    }

    // 数据管支撑（粗、靠前）
    for (const x of [-112, 112]) {
      out.push(S(k.slabOf({ x: x - 10, y: DATA_Y - 14, w: 20, d: 30, r: 2 }, 0, 4, P, 3), { tone: 'lo' }))
      out.push(S(k.slabOf({ x: x - 6, y: DATA_Y - 8, w: 12, d: 18, r: 2 }, 4, 22, P, 3), { tone: 'mid' }))
    }
    // 粗数据管：20 端口
    out.push(S(k.slabOf({ x: -140, y: DATA_Y - 13, w: 280, d: 26, r: 8 }, 26, 18, P, 6, 1.8), { tone: 'mid' }))
    out.push(S(k.slabOf({ x: -128, y: DATA_Y - 8, w: 256, d: 16, r: 4 }, 43, 2, P, 5), { tone: 'lo' }))
    for (const x of [-84, -28, 28, 84]) {
      out.push(S(k.slabOf({ x: x - 2.5, y: DATA_Y - 15, w: 5, d: 30, r: 2 }, 25, 21, P, 3, 0.6), { tone: 'mid' }))
    }
    if (open || phase.closing) {
      out.push(L(k.lineOnTop([-118, DATA_Y], [118, DATA_Y], 45.4, P), { tone: 'blue', flow: running }))
      out.push(L(k.lineOnTop([GATE_X - 4, DATA_Y], [GATE_X + 4, DATA_Y], 45.6, P), { tone: 'green' }))
    }

    // 货物
    if (cargoKind) out.push(...fileBox(cargoX, cargoKind))

    // 数据管闸门与导轨
    out.push(S(k.cylinder(GATE_X - 8, DATA_Y, 1.5, 43, 19, P, 10), { tone: 'hi' }))
    out.push(S(k.cylinder(GATE_X + 8, DATA_Y, 1.5, 43, 19, P, 10), { tone: 'hi' }))
    out.push(S(k.slabOf({ x: GATE_X - 6, y: DATA_Y - 9, w: 12, d: 18, r: 2 }, 44.2 + lift, 2.4, P, 3, 0.5), { tone: 'hi', lit: lift > 1 }))
    out.push(S(k.cylinder(GATE_X, DATA_Y, 1.2, 46.6 + lift, 4, P, 10), { tone: 'mid' }))

    // 控制票据
    if (showTicket) {
      out.push(S(k.slabOf({ x: ticketX - 6, y: CTRL_Y - 4, w: 12, d: 8, r: 1 }, 66.4, 1.2, P, 2, 0.3), { tone: 'hi', lit: true }))
      out.push(k.faceTextSvg(k.topMatrix([ticketX, CTRL_Y], 68, P), phase.cmd, { size: 3.4, tone: 'hi', anchor: 'middle' }))
    }

    // 两台机柜（画在管道之后，让管口插入柜体）
    out.push(...cabinet(CLIENT_X, false, open))
    out.push(...cabinet(SERVER_X, true, open))

    const c = at([CLIENT_X, 48, 1])
    out.push(`<text class="iso-face-text" data-tone="hi" x="${c[0]}" y="${c[1]}" font-size="10" text-anchor="middle">客户端</text>`)
    const s = at([SERVER_X, 48, 1])
    out.push(`<text class="iso-face-text" data-tone="hi" x="${s[0]}" y="${s[1]}" font-size="10" text-anchor="middle">服务器</text>`)
    return out.join('')
  }, [open, phase, lift, cargoKind, cargoX, showTicket, ticketX, running])

  return (
    <FigureCard
      fig="图 12 · FTP 控制连接与数据连接"
      title="21 端口一路指挥，20 端口按需搬文件"
      subtitle="左边机柜是客户端，右边是服务器。细管走 ASCII 命令票据，粗管搬文件箱；控制管常开，数据管每传一次开一次。"
      readout={
        <>
          控制连接 21：已连接（常开） · 数据连接 20：{open ? '已打开，传输中' : phase.closing ? '正在关闭' : '已关闭'} · 当前命令{' '}
          {phase.cmd === '—' ? '无' : phase.cmd} · 端口 21 / 20
        </>
      }
      running={running}
      onToggle={() => setRunning((r) => !r)}
      onReset={() => {
        setT(0)
        setRunning(false)
      }}
      extra={
        <button
          className="btn-outline"
          onClick={() => {
            setRunning(false)
            setT(acc + phase.dur + 0.02)
          }}
        >
          下一步 →
        </button>
      }
      caption={
        <>
          {phase.detail}（{phase.code}）。FTP 把命令与数据分到两条连接：控制连接使用服务器 <strong>21</strong> 端口并在整个会话中保持打开；
          数据连接使用 <strong>20</strong> 端口，只在 LIST / RETR / STOR 时新开，传完一个文件立即关闭——这就是<strong>带外控制</strong>。
        </>
      }
    >
      <Scene width={W} height={H} label="FTP 控制连接 21 与数据连接 20：两台机柜与两条管道" svg={svg} />
    </FigureCard>
  )
}
