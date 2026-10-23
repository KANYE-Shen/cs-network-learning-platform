import { useMemo, useState } from 'react'
import {
  DemoFrame,
  ParamSelect,
  ParamSlider,
  ParamToggle,
  PlayControls,
  ResultGrid,
  StepNote,
  useStepMachine,
} from './DemoKit'

/**
 * 后退 N 帧（Go-Back-N, GBN）滑动窗口。
 *
 * 协议要点（严格按教材）：
 *  - 发送方：窗口内最多 N 个未确认分组；只有一个定时器（针对最老的未确认分组）。
 *  - 超时 timeout(n)：重传分组 n 以及其后所有未确认分组 ← 这是 GBN 的核心代价。
 *  - 接收方：只发<b>累计确认</b>，且只确认「已按序收到的最高序号」。
 *  - 接收方遇到乱序分组：<b>直接丢弃，不缓存</b> → 接收方无需缓冲区。
 *  - 因此一旦丢失一个分组，其后所有分组即使到达也会被丢弃并触发重复 ACK。
 */

/** 离散事件仿真的时间参数（单位：ms） */
const D_TX = 1 // MSS 发送时延
const D_PROP = 1 // 单向传播时延
const ACK_TX = 0.5 // ACK 发送时延
const TIMEOUT = 4.5 // 超时定时器（必须 > RTT = 3.5）

interface Snap {
  sendBase: number // 最老的未确认分组（绝对序号）
  nextSeq: number // 下一个要发送的分组（绝对序号）
  unacked: number[] // 在途未确认分组（绝对序号，升序）
  expected: number // 接收方期望的下一个序号（绝对）
  acked: number[] // 已被累计确认的分组
}

interface GbnEvent {
  id: number
  time: number
  kind: 'send' | 'timeout' | 'deliver' | 'discard' | 'pktdrop' | 'ack' | 'dupack' | 'ackarr' | 'ackdrop'
  side: '发送方' | '接收方' | '信道'
  title: string
  detail: string
  tone: 'info' | 'ok' | 'warn'
  snap: Snap
  wire?: string
}

interface Bar {
  kind: 'data' | 'ack'
  abs: number
  start: number
  end: number
  retx: boolean
  lost: boolean
}

interface GbnSim {
  events: GbnEvent[]
  bars: Bar[]
  finalTime: number
  delivered: number[]
  discards: number
  retransmissions: number
  lostPackets: number
  lostAcks: number
  amp: number
  /** 交付给上层应用的数据分组总数 */
  deliveredCount: number
}
interface Sched {
  time: number
  order: number
  kind: 'pkt' | 'ack' | 'timer'
  abs: number
  drop: boolean
  retx: boolean
}

function simulateGbn(cfg: {
  N: number
  seqBits: number
  numPkts: number
  lossData: number | null
  lossAck: boolean
}): GbnSim {
  const { N, seqBits, numPkts, lossData, lossAck } = cfg
  const seqMod = 1 << seqBits

  let t = 0
  let order = 0
  const q: Sched[] = []
  const events: GbnEvent[] = []
  const bars: Bar[] = []
  const firstTx = new Set<number>()

  let sendBase = 0
  let nextSeq = 0
  let expected = 0
  const unacked: number[] = []
  const acked: number[] = []
  let timerFor: number | null = null

  let discards = 0
  let retransmissions = 0
  let lostPackets = 0
  let lostAcks = 0
  let ackCount = 0
  const deliveredOnce = new Set<number>()

  const push = (time: number, kind: Sched['kind'], abs: number, drop = false, retx = false) => {
    q.push({ time, order: order++, kind, abs, drop, retx })
  }

  const snap = (): Snap => ({
    sendBase,
    nextSeq,
    unacked: [...unacked],
    expected,
    acked: [...acked],
  })

  const record = (
    e: Omit<GbnEvent, 'id' | 'snap'>,
  ) => {
    events.push({ ...e, id: events.length + 1, snap: snap() })
  }

  const ensureTimer = (now: number) => {
    if (unacked.length === 0) {
      timerFor = null
      return
    }
    const base = unacked[0]
    if (timerFor !== base) {
      push(now + TIMEOUT, 'timer', base)
      timerFor = base
    }
  }

  const sendAck = (now: number, ackAbs: number, dup: boolean) => {
    const drop = lossAck && ackCount === 0
    ackCount++
    bars.push({ kind: 'ack', abs: ackAbs, start: now, end: now + ACK_TX + D_PROP, retx: false, lost: drop })
    push(now + ACK_TX + D_PROP, 'ack', ackAbs, drop, false)
    record({
      time: now,
      kind: dup ? 'dupack' : 'ack',
      side: '接收方',
      title: dup
        ? `发送重复确认 ACK(${((ackAbs % seqMod) + seqMod) % seqMod})`
        : `发送累计确认 ACK(${((ackAbs % seqMod) + seqMod) % seqMod})`,
      detail: dup
        ? `接收方只确认了「已按序收到的最高序号」。当前期望 ${expected % seqMod}，乱序分组被丢弃，只能重复确认上一次的最高序号。`
        : `累计确认：确认 ${ackAbs % seqMod} 及之前的所有分组。`,
      tone: dup ? 'warn' : 'ok',
      wire: dup ? `dup ACK ${((ackAbs % seqMod) + seqMod) % seqMod}` : `ACK ${((ackAbs % seqMod) + seqMod) % seqMod}`,
    })
  }

  let guard = 0
  while (guard++ < 2000 && events.length < 400) {
    // 发送方填充窗口
    while (nextSeq < numPkts && nextSeq - sendBase < N) {
      const p = nextSeq
      const isFirst = !firstTx.has(p)
      firstTx.add(p)
      const drop = isFirst && p === lossData
      record({
        time: t,
        kind: 'send',
        side: '发送方',
        title: `发送分组 ${p}（线序号 ${p % seqMod}）`,
        detail:
          nextSeq - sendBase + 1 <= N
            ? `窗口内未确认分组数 ${nextSeq - sendBase + 1} ≤ N=${N}，允许发送。`
            : '',
        tone: 'info',
        wire: `DATA ${p % seqMod}`,
      })
      bars.push({ kind: 'data', abs: p, start: t, end: t + D_TX + D_PROP, retx: !isFirst, lost: drop })
      push(t + D_TX + D_PROP, 'pkt', p, drop, !isFirst)
      unacked.push(p)
      nextSeq++
      ensureTimer(t)
    }
    if (q.length === 0) break

    q.sort((a, b) => a.time - b.time || a.order - b.order)
    const e = q.shift()!

    if (e.time > t) t = e.time

    // ---------- 定时器 ----------
    if (e.kind === 'timer') {
      if (!unacked.includes(e.abs)) continue // 过时的定时器
      const lost = unacked.filter((p) => p >= e.abs)
      record({
        time: t,
        kind: 'timeout',
        side: '发送方',
        title: `超时！重传 ${lost.join('、')} 号分组（${lost.length} 个）`,
        detail: `GBN 的定时器针对最老的未确认分组 ${e.abs}。超时后必须重传它<b>以及其后所有</b>未确认分组——即使这些分组其实已经到达了接收方。`,
        tone: 'warn',
        wire: `重传 ${lost.length} 个分组`,
      })
      for (const p of lost) {
        retransmissions++
        bars.push({ kind: 'data', abs: p, start: t, end: t + D_TX + D_PROP, retx: true, lost: false })
        push(t + D_TX + D_PROP, 'pkt', p, false, true)
      }
      timerFor = null
      ensureTimer(t)
      continue
    }

    // ---------- 数据分组到达接收方 ----------
    if (e.kind === 'pkt') {
      if (e.drop) {
        lostPackets++
        record({
          time: t,
          kind: 'pktdrop',
          side: '信道',
          title: `分组 ${e.abs}（序号 ${e.abs % seqMod}）在信道中丢失`,
          detail: '底层不可靠信道把整个分组丢掉了。接收方毫无察觉。',
          tone: 'warn',
        })
        continue
      }
      // GBN 接收方只记住「期望序号」一个状态：等于就交付，不等就丢弃（不缓存）。
      // 用模 seqMod 的比较，避免序号回绕时出错。
      const wireSeq = ((e.abs % seqMod) + seqMod) % seqMod
      const expSeq = ((expected % seqMod) + seqMod) % seqMod
      if (wireSeq === expSeq) {
        expected++
        deliveredOnce.add(e.abs)
        record({
          time: t,
          kind: 'deliver',
          side: '接收方',
          title: `收到分组 ${e.abs}（序号 ${wireSeq}）→ 交付上层应用`,
          detail: `序号正好等于期望值 ${expSeq}，立即交付给上层，并推进期望序号。`,
          tone: 'ok',
          wire: `DATA ${wireSeq}`,
        })
        sendAck(t, expected - 1, false)
      } else {
        discards++
        record({
          time: t,
          kind: 'discard',
          side: '接收方',
          title: `收到乱序分组 ${e.abs}（期望 ${expSeq}）→ 直接丢弃`,
          detail:
            'GBN 接收方<b>不缓存</b>乱序分组：序号不对就丢弃。因此接收方完全不需要缓冲区。',
          tone: 'warn',
          wire: `DATA ${wireSeq}`,
        })
        sendAck(t, expected - 1, true)
      }
      continue
    }

    // ---------- ACK 到达发送方 ----------
    if (e.kind === 'ack') {
      if (e.drop) {
        lostAcks++
        record({
          time: t,
          kind: 'ackdrop',
          side: '信道',
          title: `ACK(${e.abs % seqMod}) 在信道中丢失`,
          detail: '接收方其实已经收到并交付了数据，但确认报文丢了 → 发送方只能等超时重传。',
          tone: 'warn',
        })
        continue
      }
      // 累计确认：ACK(n) 确认 n 及之前的所有分组。用绝对序号比较（同一窗口内不回绕）。
      const removed = unacked.filter((p) => p <= e.abs)
      if (removed.length > 0) {
        for (const p of removed) {
          if (!acked.includes(p)) acked.push(p)
        }
        unacked.splice(0, removed.length)
        sendBase = unacked.length > 0 ? unacked[0] : nextSeq
        record({
          time: t,
          kind: 'ackarr',
          side: '发送方',
          title: `收到累计确认 ACK(${e.abs % seqMod}) → 确认 ${removed.join('、')} 号分组`,
          detail: '累计确认一次性确认了它之前的所有分组，窗口整体前移。',
          tone: 'ok',
          wire: `ACK ${e.abs % seqMod}`,
        })
      } else {
        record({
          time: t,
          kind: 'ackarr',
          side: '发送方',
          title: `收到重复确认 ACK(${e.abs % seqMod}) → 没有确认任何新分组`,
          detail: '这是乱序分组引起的重复 ACK，发送方据此判断「有分组丢失了」。',
          tone: 'warn',
          wire: `dup ACK ${e.abs % seqMod}`,
        })
      }
      ensureTimer(t)
      continue
    }
  }

  const delivered = events.filter((e) => e.kind === 'deliver').map((e) => e.snap.expected - 1)
  const finalTime = events.length ? events[events.length - 1].time : 1

  return {
    events,
    bars,
    finalTime: Math.max(finalTime, 1),
    delivered,
    deliveredCount: deliveredOnce.size,
    discards,
    retransmissions,
    lostPackets,
    lostAcks,
    amp: lostPackets > 0 ? retransmissions / lostPackets : 0,
  }
}

/** 序号带（SVG）：显示窗口范围与每个序号的状态 */
function SeqStrip({
  title,
  seqMod,
  numPkts,
  windowStart,
  windowLen,
  cellStatus,
  note,
  accent,
}: {
  title: string
  seqMod: number
  numPkts: number
  windowStart: number
  windowLen: number
  cellStatus: (wire: number) => { fill: string; stroke: string; text: string; label: string }
  note: string
  accent: string
}) {
  const W = 400
  const cw = W / seqMod
  const cells = Array.from({ length: seqMod }, (_, i) => i)
  const winCells = new Set(
    Array.from({ length: windowLen }, (_, i) => (windowStart + i) % seqMod),
  )
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-semibold" style={{ color: accent }}>
          {title}
        </span>
        <span className="text-[10px] mono muted">
          窗口 [{windowStart} … {((windowStart + windowLen - 1) % seqMod)}] · 共 {seqMod} 个序号
        </span>
      </div>
      <svg viewBox={`0 0 ${W} 46`} width="100%" style={{ display: 'block' }} role="img">
        {cells.map((i) => {
          const st = cellStatus(i)
          const inWin = winCells.has(i)
          const x = i * cw
          return (
            <g key={i}>
              <rect
                x={x + 1}
                y={16}
                width={cw - 2}
                height={26}
                rx={4}
                fill={st.fill}
                stroke={inWin ? accent : st.stroke}
                strokeWidth={inWin ? 2 : 1}
              />
              <text
                x={x + cw / 2}
                y={33}
                textAnchor="middle"
                fontSize={10}
                fill={st.text}
                fontFamily="ui-monospace, monospace"
              >
                {i}
              </text>
              {i < numPkts && (
                <text
                  x={x + cw / 2}
                  y={11}
                  textAnchor="middle"
                  fontSize={8}
                  fill="var(--text-muted)"
                  fontFamily="ui-monospace, monospace"
                >
                  {st.label}
                </text>
              )}
            </g>
          )
        })}
        <text x={2} y={9} fontSize={8} fill="var(--text-muted)">
          序号 →
        </text>
      </svg>
      <div className="text-[10px] muted mt-1 leading-snug">{note}</div>
    </div>
  )
}

/** 时间线（SVG）：数据分组与 ACK 的传输区间 */
function Timeline({
  bars,
  finalTime,
  now,
  seqMod,
}: {
  bars: Bar[]
  finalTime: number
  now: number
  seqMod: number
}) {
  const W = 400
  const H = 96
  const x = (t: number) => (t / finalTime) * W
  const dataY = 24
  const ackY = 58
  const bw = 3
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img">
      <line x1={0} y1={dataY - 6} x2={W} y2={dataY - 6} stroke="var(--border)" strokeWidth={1} />
      <text x={2} y={dataY - 10} fontSize={8} fill="var(--text-muted)">
        数据分组
      </text>
      <line x1={0} y1={ackY - 6} x2={W} y2={ackY - 6} stroke="var(--border)" strokeWidth={1} />
      <text x={2} y={ackY - 10} fontSize={8} fill="var(--text-muted)">
        确认报文 ACK
      </text>
      {bars
        .filter((b) => b.kind === 'data')
        .map((b, i) => (
          <rect
            key={`d${i}`}
            x={x(b.start)}
            y={dataY}
            width={Math.max(2, x(b.end) - x(b.start))}
            height={bw * 4}
            rx={2}
            fill={b.lost ? 'rgba(220,120,40,0.85)' : b.retx ? 'rgba(220,120,40,0.45)' : 'var(--brand)'}
            stroke={b.lost ? '#dc7828' : 'none'}
            strokeDasharray={b.lost ? '3 2' : undefined}
          >
            <title>{`分组 ${b.abs % seqMod}${b.retx ? '（重传）' : ''}${b.lost ? '（丢失）' : ''}`}</title>
          </rect>
        ))}
      {bars
        .filter((b) => b.kind === 'ack')
        .map((b, i) => (
          <rect
            key={`a${i}`}
            x={x(b.start)}
            y={ackY}
            width={Math.max(2, x(b.end) - x(b.start))}
            height={bw * 2}
            rx={2}
            fill={b.lost ? 'rgba(220,120,40,0.85)' : 'rgba(22,160,120,0.75)'}
          >
            <title>{`ACK ${b.abs % seqMod}${b.lost ? '（丢失）' : ''}`}</title>
          </rect>
        ))}
      <line
        x1={x(now)}
        y1={14}
        x2={x(now)}
        y2={H - 6}
        stroke="var(--brand)"
        strokeWidth={1.5}
      />
      <text x={x(now) + 3} y={H - 1} fontSize={8} fill="var(--brand)" fontFamily="ui-monospace, monospace">
        now = {now.toFixed(1)}ms
      </text>
    </svg>
  )
}

export default function GbnDemo() {
  const [N, setN] = useState(4)
  const [seqBits, setSeqBits] = useState(3)
  const [numPkts, setNumPkts] = useState(6)
  const [lossData, setLossData] = useState<string>('1')
  const [lossAck, setLossAck] = useState(false)

  const sim = useMemo(
    () =>
      simulateGbn({
        N,
        seqBits,
        numPkts,
        lossData: lossData === 'none' ? null : Number(lossData),
        lossAck,
      }),
    [N, seqBits, numPkts, lossData, lossAck],
  )

  const machine = useStepMachine(
    sim.events.map((e) => ({ label: e.title, detail: e.detail })),
    { intervalMs: 1000 },
  )
  const applied = Math.min(machine.index, sim.events.length)
  const current = applied > 0 ? sim.events[applied - 1] : null
  const next = applied < sim.events.length ? sim.events[applied] : null
  const cur = current ? current.snap : { sendBase: 0, nextSeq: 0, unacked: [], expected: 0, acked: [] }
  const seqMod = 1 << seqBits

  const reset = () => machine.reset()

  const lossOptions = [
    { value: 'none', label: '不丢失任何分组' },
    ...Array.from({ length: numPkts }, (_, i) => ({ value: String(i), label: `丢失第 ${i + 1} 个分组（序号 ${i % seqMod}）` })),
  ]

  const deliveredSoFar = sim.events.slice(0, applied).filter((e) => e.kind === 'deliver').length
  const discardSoFar = sim.events.slice(0, applied).filter((e) => e.kind === 'discard').length
  const retxSoFar = sim.events.slice(0, applied).filter((e) => e.kind === 'timeout').length

  const cellStatusSender = (wire: number): { fill: string; stroke: string; text: string; label: string } => {
    // wire 是线序号（模 seqMod），映射回绝对序号来查状态
    const abs = cur.acked.concat(cur.unacked).find((a) => a % seqMod === wire)
    if (abs === undefined) return { fill: 'var(--surface)', stroke: 'var(--border)', text: 'var(--text-muted)', label: '' }
    if (cur.acked.includes(abs)) return { fill: 'rgba(22,160,120,0.18)', stroke: 'var(--border)', text: 'var(--text)', label: '已确认' }
    if (cur.unacked.includes(abs)) return { fill: 'rgba(50,85,219,0.22)', stroke: 'var(--border)', text: 'var(--text)', label: '在途' }
    return { fill: 'rgba(22,160,120,0.10)', stroke: 'var(--border)', text: 'var(--text-muted)', label: '已发' }
  }

  const cellStatusReceiver = (wire: number): { fill: string; stroke: string; text: string; label: string } => {
    const expWire = ((cur.expected % seqMod) + seqMod) % seqMod
    if (wire === expWire) return { fill: 'rgba(50,85,219,0.22)', stroke: 'var(--border)', text: 'var(--text)', label: '期望' }
    const received = cur.acked.map((a) => ((a % seqMod) + seqMod) % seqMod)
    if (received.includes(wire)) return { fill: 'rgba(22,160,120,0.16)', stroke: 'var(--border)', text: 'var(--text-muted)', label: '已收' }
    return { fill: 'var(--surface)', stroke: 'var(--border)', text: 'var(--text-muted)', label: '' }
  }

  const ampNow = sim.lostPackets > 0 ? (sim.retransmissions / sim.lostPackets).toFixed(1) : '—'

  return (
    <DemoFrame
      title="后退 N 帧（GBN）：一次丢包，代价是多少？"
      description="GBN 允许发送方有 N 个在途分组，但接收方不缓存乱序分组。一旦丢失一个分组，发送方超时后必须重传它及其后所有分组。"
      controls={
        <PlayControls
          playing={machine.playing}
          onPlay={() => machine.setPlaying(true)}
          onPause={() => machine.setPlaying(false)}
          onReset={reset}
          onStep={machine.step}
          onStepBack={machine.stepBack}
          canStepBack
          speed={machine.speed}
          onSpeedChange={machine.setSpeed}
        />
      }
      legend={[
        { color: 'var(--brand)', label: '发送方窗口 / 首次传输' },
        { color: '#16a078', label: '已确认' },
        { color: '#dc7828', label: '重传 / 丢弃 / 丢失' },
      ]}
    >
      <div className="space-y-4">
        {/* 参数 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ParamSlider
            label="窗口大小 N"
            value={N}
            onChange={(v) => {
              setN(v)
              reset()
            }}
            min={1}
            max={Math.min(7, seqMod)}
            unit="个分组"
            hint="发送方最多允许 N 个未确认分组在途。"
          />
          <ParamSlider
            label="序号位数 k"
            value={seqBits}
            onChange={(v) => {
              setSeqBits(v)
              setNumPkts((n) => Math.min(n, 1 << v))
              reset()
            }}
            min={2}
            max={4}
            unit="位"
            hint={`序号空间 2^${seqBits} = ${1 << seqBits} 个序号。`}
          />
          <ParamSlider
            label="要发送的分组总数"
            value={numPkts}
            onChange={(v) => {
              setNumPkts(v)
              reset()
            }}
            min={1}
            max={seqMod}
            unit="个"
          />
          <div className="space-y-2">
            <ParamSelect
              label="注入故障"
              value={lossData}
              onChange={(v) => {
                setLossData(v)
                reset()
              }}
              options={lossOptions}
            />
            <ParamToggle
              label="同时丢失第一个 ACK"
              value={lossAck}
              onChange={(v) => {
                setLossAck(v)
                reset()
              }}
              hint="观察：ACK 丢失同样会导致重传。"
            />
          </div>
        </div>

        {/* 窗口 */}
        <div className="grid lg:grid-cols-2 gap-3">
          <SeqStrip
            title="发送方窗口（最多 N 个在途分组）"
            seqMod={seqMod}
            numPkts={numPkts}
            windowStart={cur.sendBase % seqMod}
            windowLen={N}
            cellStatus={cellStatusSender}
            note={`最老的未确认分组 = ${cur.sendBase % seqMod}，已发出到 ${cur.nextSeq % seqMod}，窗口内未确认 ${cur.unacked.length} 个。`}
            accent="var(--brand)"
          />
          <SeqStrip
            title="接收方窗口（GBN 不缓存乱序分组）"
            seqMod={seqMod}
            numPkts={numPkts}
            windowStart={cur.expected % seqMod}
            windowLen={1}
            cellStatus={cellStatusReceiver}
            note={`接收方只记住「期望序号 ${cur.expected % seqMod}」一个状态，收到别的序号直接丢弃 → 无需缓冲区。`}
            accent="#16a078"
          />
        </div>

        {/* 时间线 */}
        <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold mb-1.5">信道时间线</div>
          <Timeline bars={sim.bars} finalTime={sim.finalTime} now={current ? current.time : 0} seqMod={seqMod} />
        </div>

        {/* 事件列表 */}
        <div>
          <div className="text-xs font-semibold mb-1.5">事件</div>
          <ol className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {sim.events.map((e, i) => (
              <li
                key={e.id}
                className="rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed"
                style={{
                  background: i < applied ? 'var(--surface-2)' : 'transparent',
                  border: `1px solid ${i === applied ? 'var(--brand)' : 'var(--border)'}`,
                  opacity: i < applied ? 1 : 0.55,
                }}
              >
                <span className="mono muted">
                  {e.time.toFixed(1)}ms · {e.side}
                </span>{' '}
                <span
                  className="font-semibold"
                  style={{ color: e.tone === 'warn' ? '#dc7828' : e.tone === 'ok' ? '#16a078' : 'var(--text)' }}
                >
                  {e.title}
                </span>
                {e.detail && <span className="muted"> — {e.detail.replace(/<\/?b>/g, '')}</span>}
              </li>
            ))}
          </ol>
        </div>

        <StepNote
          tone={current ? current.tone : 'info'}
          text={
            current
              ? `${current.title} —— ${current.detail.replace(/<\/?b>/g, '')}`
              : next
                ? `下一步：${next.title}`
                : '点击「单步」或「播放」开始。'
          }
        />

        <ResultGrid
          items={[
            { label: '已交付上层', value: `${deliveredSoFar} / ${numPkts} 个`, highlight: true },
            { label: '接收方丢弃的乱序分组', value: `${discardSoFar} 个`, hint: 'GBN 接收方不缓存' },
            { label: '重传分组数', value: `${sim.retransmissions} 个`, hint: `其中 ${retxSoFar} 次超时触发` },
            {
              label: '重传放大倍数',
              value: sim.lostPackets > 0 ? `${ampNow}×` : '—',
              hint: sim.lostPackets > 0 ? `丢了 ${sim.lostPackets} 个却重传了 ${sim.retransmissions} 个` : '无丢包',
            },
          ]}
        />

        <StepNote
          tone={sim.lostPackets > 0 && sim.retransmissions > sim.lostPackets ? 'warn' : 'info'}
          text={
            sim.lostPackets > 0
              ? `本次丢失 ${sim.lostPackets} 个分组，发送方却重传了 ${sim.retransmissions} 个分组（放大 ${ampNow} 倍）。原因是 GBN 的超时动作是「重传最老未确认分组及其后所有分组」。接收方还会白白丢弃 ${sim.discards} 个乱序分组——它们其实完好无损，却因为前面的分组丢失而被扔掉。`
              : '没有丢包时 GBN 效率很高：流水线传输，接收方逐个交付。试试注入丢包，看看代价。'
          }
        />
      </div>
    </DemoFrame>
  )
}
