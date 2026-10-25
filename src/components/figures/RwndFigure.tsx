// ============================================================
// 图解：TCP 流量控制 rwnd（k3.5.8）
// 水箱 = 接收缓冲区；水位 = 已缓存未读；剩余空间 = rwnd
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 820
const H = 340
const RCV_BUFFER = 4096
const SEND_RATE = 2400 // 发送方灌入速率（字节/秒，示意值）
const READ_RATES = [512, 1024, 2048, 0]
const READ_LABELS = ['慢速读取 512 B/s', '中速读取 1024 B/s', '快速读取 2048 B/s', '暂停读取 0 B/s']

const TANK = { cx: 0, cy: 0, r: 40, h: 110 }
const GROUND = { x: -180, y: -70, w: 350, d: 150, r: 10 }

const P = k.fitProjection(
  [
    ...k.boxCorners(GROUND, -8, 0),
    [TANK.cx + TANK.r, TANK.cy, TANK.h + 8],
    [-170, 0, 56],
    [150, 0, 56],
  ],
  W,
  H,
  { pad: 12, azimuth: 34, elevation: 36 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)

export default function RwndFigure() {
  const [rateIndex, setRateIndex] = useState(0)
  const seedT = initialTime()
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const buffered = useRef(seedLevel(initialTime(), READ_RATES[0]))
  const last = useRef(seedT)
  const [, force] = useState(0)

  const readRate = READ_RATES[rateIndex]

  useEffect(() => {
    const dt = Math.min(Math.max(t - last.current, 0), 0.12)
    last.current = t
    if (dt > 0) {
      const rwnd = RCV_BUFFER - buffered.current
      // 发送方只在 rwnd > 0 时灌入；应用按固定速率读走
      if (rwnd > 0) buffered.current = Math.min(RCV_BUFFER, buffered.current + SEND_RATE * dt)
      buffered.current = Math.max(0, buffered.current - readRate * dt)
      force((x) => x + 1)
    }
  }, [t, readRate])

  const used = Math.round(buffered.current)
  const rwnd = RCV_BUFFER - used
  const sending = rwnd > 0

  const svg = useMemo(() => {
    const out: string[] = []
    out.push(S(k.slabOf(GROUND, -8, 8, P, 10, 1), { tone: 'lo' }))

    // 支架与水箱
    for (const [x, y] of [
      [TANK.cx - 30, TANK.cy - 30],
      [TANK.cx + 30, TANK.cy - 30],
      [TANK.cx - 30, TANK.cy + 30],
      [TANK.cx + 30, TANK.cy + 30],
    ]) {
      out.push(S(k.cylinder(x, y, 3, 0, 14, P, 14), { tone: 'mid' }))
    }
    out.push(S(k.cylinder(TANK.cx, TANK.cy, TANK.r, 14, 4, P, 36), { tone: 'mid' }))
    for (const ang of [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]) {
      const px = TANK.cx + Math.cos(ang) * TANK.r
      const py = TANK.cy + Math.sin(ang) * TANK.r
      out.push(S(k.cylinder(px, py, 1.8, 14, TANK.h, P, 12), { tone: 'mid' }))
    }
    out.push(S(k.cylinder(TANK.cx, TANK.cy, TANK.r, TANK.h + 14, 3, P, 36), { tone: 'hi' }))
    // 水体（变量高度）
    const waterH = Math.max(0.5, (used / RCV_BUFFER) * (TANK.h - 18))
    out.push(
      `<g style="--anatomy-paper:#2f6fd0;--anatomy-face:#4a86e0;--anatomy-top:#5b95ea;--anatomy-shade-0:#245aad;--anatomy-shade-1:#2b66bd;--anatomy-shade-2:#3272cc;--anatomy-shade-3:#397edb">`,
    )
    out.push(S(k.cylinder(TANK.cx, TANK.cy, TANK.r - 3, 18, waterH, P, 40), { tone: 'hi', crease: 'none' }))
    out.push(`</g>`)
    // 透明罐体的刻度环（高度标尺）
    for (const frac of [0.25, 0.5, 0.75, 1]) {
      const z = 18 + frac * (TANK.h - 8)
      out.push(L(k.ring(TANK.cx, TANK.cy, TANK.r, z, P, 40), { tone: frac === 1 ? 'hi' : 'faint' }))
      const a = at([TANK.cx - TANK.r - 4, TANK.cy, z])
      const b = at([TANK.cx - TANK.r - 12, TANK.cy, z])
      out.push(L(`M${a[0]},${a[1]}L${b[0]},${b[1]}`, { tone: 'mid' }))
      out.push(
        `<text class="iso-face-text" data-tone="mid" x="${b[0] - 4}" y="${b[1] + 3}" font-size="9" text-anchor="end">${Math.round(
          frac * RCV_BUFFER,
        )}</text>`,
      )
    }
    // 进水与出水
    out.push(L(k.segment([-150, 0, 96], [TANK.cx - 22, TANK.cy, 96], P), { tone: 'blue', flow: running }))
    out.push(L(k.segment([-150, 0, 96], [-150, 0, 48], P), { tone: 'blue' }))
    out.push(S(k.slabOf({ x: -166, y: -18, w: 26, d: 36, r: 3 }, 0, 48, P, 4, 0.8), { tone: 'mid' }))
    out.push(L(k.segment([TANK.cx + TANK.r - 6, TANK.cy, 22], [158, 0, 22], P), { tone: 'blue', flow: running }))
    out.push(S(k.slabOf({ x: 146, y: -18, w: 26, d: 36, r: 3 }, 0, 26, P, 4, 0.8), { tone: 'mid' }))

    const sp = at([-153, -26, 58])
    out.push(`<text class="iso-face-text" data-tone="hi" x="${sp[0]}" y="${sp[1]}" font-size="10" text-anchor="middle">发送方</text>`)
    const ap = at([159, -26, 36])
    out.push(`<text class="iso-face-text" data-tone="hi" x="${ap[0]}" y="${ap[1]}" font-size="10" text-anchor="middle">应用</text>`)
    const tp = at([TANK.cx, -TANK.r - 12, TANK.h + 6])
    out.push(
      `<text class="iso-face-text" data-tone="hi" x="${tp[0]}" y="${tp[1]}" font-size="10" text-anchor="middle">接收缓冲区 ${RCV_BUFFER} B</text>`,
    )
    const wp = at([TANK.cx + TANK.r + 16, 0, 18 + waterH * 0.85])
    out.push(
      `<text class="iso-face-text" data-tone="hi" x="${wp[0]}" y="${wp[1]}" font-size="10">水位 ${used} B</text>`,
    )
    return out.join('')
  }, [used, running])

  return (
    <FigureCard
      fig="图 4 · 流量控制 rwnd"
      title="接收方用剩余缓冲区给发送方“限速”"
      subtitle="水箱是接收缓冲区，水位是已收到但应用还没读走的数据；剩余空间就是 rwnd。"
      readout={
        <>
          已缓存未读 {used} B · rwnd = {rwnd} B · 发送方 {sending ? '正在发送' : '零窗口，暂停发送'}
        </>
      }
      running={running}
      onToggle={() => setRunning((r) => !r)}
      onReset={() => {
        buffered.current = 0
        setT(0)
        setRunning(false)
        force((x) => x + 1)
      }}
      extra={
        <select
          className="text-xs rounded-lg px-2 py-1.5 border bg-transparent"
          style={{ borderColor: 'var(--border)', color: 'var(--text)' }}
          value={rateIndex}
          onChange={(e) => setRateIndex(Number(e.target.value))}
          aria-label="选择应用读取速率"
        >
          {READ_LABELS.map((label, i) => (
            <option key={label} value={i}>
              {label}
            </option>
          ))}
        </select>
      }
      caption={
        <>
          接收方通告 <strong>rwnd = {RCV_BUFFER} − 已缓存未读</strong>，发送方保证在途未确认数据不超过 rwnd。暂停读取时缓冲区逐渐填满，rwnd 降为
          0，发送方必须停下；恢复读取后 rwnd 回升，发送恢复。图中用恒定速率和离散采样近似缓冲变化。发送方实际窗口还要与拥塞窗口取小：
          <strong> min(rwnd, cwnd)</strong>。
        </>
      }
    >
      <Scene width={W} height={H} label="TCP 流量控制：接收缓冲区与 rwnd" svg={svg} />
    </FigureCard>
  )
}


/** 调试用：把初始时间内的流量控制过程预跑一遍，得到初始水位 */
function seedLevel(seconds: number, readRate: number): number {
  let level = 0
  const step = 0.05
  for (let x = 0; x < seconds; x += step) {
    if (level < RCV_BUFFER) level = Math.min(RCV_BUFFER, level + SEND_RATE * step)
    level = Math.max(0, level - readRate * step)
  }
  return level
}
