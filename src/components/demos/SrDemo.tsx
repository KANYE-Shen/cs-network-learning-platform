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
 * 选择重传（Selective Repeat, SR）滑动窗口。
 *
 * 与 GBN 的关键差异：
 *  - 接收方<b>缓存</b>乱序分组，等前面的分组到达后按序交付
 *  - 接收方对<b>每个</b>分组单独确认（ACK(n) 确认分组 n 本身，不是累计确认）
 *  - 发送方为<b>每个</b>在途分组各有一个定时器，超时只重传那一个分组
 *  → 重传量不会放大
 *
 * 序号空间约束（PPT 第 52 页的 dilemma）：窗口大小 N 时，序号空间必须 ≥ 2N，
 * 否则接收方无法区分「新分组」与「旧分组的重传副本」。
 */

const D_TX = 1
const D_PROP = 1
const ACK_TX = 0.5
const TIMEOUT = 4.5

interface SrSnap {
  sendBase: number
  nextSeq: number
  unacked: number[]
  expected: number
  recvBuf: number[]
  acked: number[]
}

interface SrEvent {
  id: number
  time: number
  kind: 'send' | 'timeout' | 'deliver' | 'buffer' | 'dup' | 'ack' | 'ackarr' | 'pktdrop' | 'ackdrop'
  side: '发送方' | '接收方' | '信道'
  title: string
  detail: string
  tone: 'info' | 'ok' | 'warn'
  snap: SrSnap
}

interface SrSim {
  events: SrEvent[]
  finalTime: number
  retransmissions: number
  lostPackets: number
  discardedOld: number
  /** 交付给上层应用的数据分组总数（一次事件可能交付多个分组） */
  deliveredCount: number
  /** 被重复交付的分组数（序号空间不足导致接收方误把旧副本当新分组时 > 0） */
  duplicateDeliveries: number
}

function simulateSr(cfg: {
  N: number
  seqBits: number
  numPkts: number
  lossData: number | null
  lossAck: boolean
}): SrSim {
  const { N, seqBits, numPkts, lossData, lossAck } = cfg
  const seqMod = 1 << seqBits

  interface Sched {
    time: number
    order: number
    kind: 'pkt' | 'ack' | 'timer'
    abs: number
    drop: boolean
    retx: boolean
  }
  const q: Sched[] = []
  const events: SrEvent[] = []
  let t = 0
  let order = 0

  let sendBase = 0
  let nextSeq = 0
  let expected = 0
  const unacked: number[] = []
  const acked: number[] = []
  const recvBuf: number[] = []
  const timers = new Map<number, number>() // 分组 → 到期时刻
  const firstTx = new Set<number>()
  const deliveredOnce = new Set<number>()
  // 交付记录（含重复）：用来检测「序号空间不足时把旧副本误当新分组交付」的 dilemma
  const deliveredList: number[] = []

  let retransmissions = 0
  let lostPackets = 0
  let lostAcks = 0
  let discardedOld = 0
  let ackCount = 0

  const push = (time: number, kind: Sched['kind'], abs: number, drop = false, retx = false) => {
    q.push({ time, order: order++, kind, abs, drop, retx })
  }
  const snap = (): SrSnap => ({
    sendBase,
    nextSeq,
    unacked: [...unacked],
    expected,
    recvBuf: [...recvBuf],
    acked: [...acked],
  })
  const record = (e: Omit<SrEvent, 'id' | 'snap'>) => {
    events.push({ ...e, id: events.length + 1, snap: snap() })
  }

  let guard = 0
  while (guard++ < 3000 && events.length < 500) {
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
        detail: `窗口内未确认分组 ${unacked.length} 个（上限 N=${N}）。SR 为每个在途分组各设一个定时器。`,
        tone: 'info',
      })
      push(t + D_TX + D_PROP, 'pkt', p, drop, !isFirst)
      unacked.push(p)
      // SR 为每个在途分组各设一个定时器，并把它排入事件队列
      timers.set(p, t + TIMEOUT)
      push(t + TIMEOUT, 'timer', p)
      nextSeq++
    }
    if (q.length === 0) break

    q.sort((a, b) => a.time - b.time || a.order - b.order)
    const e = q.shift()!
    if (e.time > t) t = e.time

    // ---------- 定时器 ----------
    if (e.kind === 'timer') {
      if (!timers.has(e.abs) || timers.get(e.abs)! !== e.time) continue // 过时
      if (!unacked.includes(e.abs)) continue
      timers.delete(e.abs)
      record({
        time: t,
        kind: 'timeout',
        side: '发送方',
        title: `超时：只重传分组 ${e.abs}（线序号 ${e.abs % seqMod}）`,
        detail: `SR 只重传这一个分组，不牵连后面的分组。其余 ${unacked.length - 1} 个在途分组继续等待各自的确认。`,
        tone: 'warn',
      })
      retransmissions++
      push(t + D_TX + D_PROP, 'pkt', e.abs, false, true)
      // 重传后重启该分组的定时器
      timers.set(e.abs, t + TIMEOUT)
      push(t + TIMEOUT, 'timer', e.abs)
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
          detail: '接收方毫无察觉，只能等发送方超时重传。',
          tone: 'warn',
        })
        continue
      }
      const wire = e.abs % seqMod
      // 序号空间是模 seqMod 的循环的。教材把接收方能接收的分组分成三个区域：
      //   ① 当前窗口 [rcvbase, rcvbase+N-1]        —— 接受（新分组）
      //   ② 之前的窗口 [rcvbase-N, rcvbase-1]      —— 重复分组，丢弃但仍回 ACK
      //   ③ 其他                                    —— 忽略
      // 用模距离来判断落在哪个区域（要求 2N ≤ 2^k，否则两个区域会重叠——正是 dilemma 所说的）。
      const dFwd = (e.abs - expected + seqMod) % seqMod // 向前的距离
      const dBwd = (expected - e.abs + seqMod) % seqMod // 向后的距离
      if (dFwd >= N && dBwd < N) {
        // 落在之前的窗口：这是已交付过的分组的旧副本
        discardedOld++
        record({
          time: t,
          kind: 'dup',
          side: '接收方',
          title: `收到旧副本 分组 ${e.abs}（序号 ${wire}）→ 丢弃`,
          detail: `接收方已交付过它（序号落在接收窗口 [${expected % seqMod}, ${(expected + N - 1) % seqMod}] 之外）→ 识别为重复，不交付上层，但仍回送 ACK。`,
          tone: 'warn',
        })
        // SR 对重复分组也要回 ACK（RFC 风格）
        q.push({ time: t + ACK_TX + D_PROP, order: order++, kind: 'ack', abs: e.abs, drop: false, retx: false })
        continue
      }
      if (dFwd >= N) {
        // 落在窗口之外：无法判断是新分组还是旧副本
        discardedOld++
        record({
          time: t,
          kind: 'dup',
          side: '接收方',
          title: `收到窗口外分组 ${e.abs}（序号 ${wire}）→ 丢弃`,
          detail: `超出接收窗口 [${expected % seqMod}, ${(expected + N - 1) % seqMod}]，无法判断是新分组还是旧副本 → 丢弃。`,
          tone: 'warn',
        })
        continue
      }
      if (dFwd === 0) {
        // 正好是期望序号：交付
        expected++
        deliveredOnce.add(e.abs)
        const toDeliver = [e.abs]
        // 交付缓存中后续连续的分组。
        // 注意：缓存里存的是绝对序号，expected 也是绝对序号，但比较时必须按模 seqMod
        // （否则序号回绕后缓存里的分组永远匹配不上）。
        for (;;) {
          const expWire = ((expected % seqMod) + seqMod) % seqMod
          const idx = recvBuf.findIndex((b) => (((b % seqMod) + seqMod) % seqMod) === expWire)
          if (idx < 0) break
          toDeliver.push(recvBuf[idx])
          recvBuf.splice(idx, 1)
          expected++
        }
        for (const d of toDeliver) {
          deliveredOnce.add(d)
          deliveredList.push(d)
        }
        record({
          time: t,
          kind: 'deliver',
          side: '接收方',
          title: `收到分组 ${e.abs}（序号 ${wire}）→ 交付上层应用`,
          detail:
            toDeliver.length > 1
              ? `按序交付 ${toDeliver.length} 个分组：${toDeliver.map((d) => d % seqMod).join('、')}（含之前缓存的乱序分组）。`
              : '序号正好等于期望值，直接交付给上层。',
          tone: 'ok',
        })
        // SR 对每个收到的分组单独确认：刚交付的分组 + 刚从缓存中交付的分组都要发 ACK
        for (const d of toDeliver) {
          q.push({ time: t + ACK_TX + D_PROP, order: order++, kind: 'ack', abs: d, drop: false, retx: false })
        }
        // 缓存中剩余（尚未交付的）分组也已经单独确认过，这里无需重复
      } else {
        // 乱序但合法：缓存
        recvBuf.push(e.abs)
        record({
          time: t,
          kind: 'buffer',
          side: '接收方',
          title: `收到乱序分组 ${e.abs}（期望 ${expected % seqMod}）→ 缓存`,
          detail: `SR 接收方<b>缓存</b>乱序分组（缓冲区中现有 ${recvBuf.length} 个），等前面的分组到达后按序交付。`,
          tone: 'warn',
        })
        q.push({ time: t + ACK_TX + D_PROP, order: order++, kind: 'ack', abs: e.abs, drop: false, retx: false })
      }
      continue
    }

    // ---------- ACK 到达发送方 ----------
    if (e.kind === 'ack') {
      const isFirstAck = ackCount === 0
      ackCount++
      if (lossAck && isFirstAck) {
        lostAcks++
        record({
          time: t,
          kind: 'ackdrop',
          side: '信道',
          title: `ACK(${e.abs % seqMod}) 在信道中丢失`,
          detail: '发送方收不到确认 → 该分组的定时器到期后重传。',
          tone: 'warn',
        })
        continue
      }
      if (unacked.includes(e.abs)) {
        unacked.splice(unacked.indexOf(e.abs), 1)
        timers.delete(e.abs)
        if (!acked.includes(e.abs)) acked.push(e.abs)
        // 窗口前移
        while (!unacked.includes(sendBase) && sendBase < nextSeq) sendBase++
        record({
          time: t,
          kind: 'ackarr',
          side: '发送方',
          title: `收到 ACK(${e.abs % seqMod}) → 确认分组 ${e.abs}`,
          detail: `SR 对<b>单个</b>分组确认，不是累计确认。分组 ${e.abs} 的定时器停止。`,
          tone: 'ok',
        })
      } else {
        record({
          time: t,
          kind: 'ackarr',
          side: '发送方',
          title: `收到 ACK(${e.abs % seqMod}) → 分组已确认，忽略`,
          detail: '重复确认（常见于重传后），无需处理。',
          tone: 'info',
        })
      }
      continue
    }
  }

  const finalTime = events.length ? events[events.length - 1].time : 1
  return {
    events,
    finalTime: Math.max(finalTime, 1),
    retransmissions,
    lostPackets,
    discardedOld,
    deliveredCount: deliveredList.length,
    duplicateDeliveries: deliveredList.length - deliveredOnce.size,
  }
}

/** 窗口可视化 */
function WinStrip({
  title,
  seqMod,
  numPkts,
  base,
  len,
  status,
  note,
  accent,
  extraLegend,
}: {
  title: string
  seqMod: number
  numPkts: number
  base: number
  len: number
  status: (wire: number) => { fill: string; text: string; label: string }
  note: string
  accent: string
  extraLegend?: { label: string; color: string }[]
}) {
  const W = 400
  const cw = W / seqMod
  const win = new Set(Array.from({ length: len }, (_, i) => (base + i) % seqMod))
  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-[11px] font-semibold" style={{ color: accent }}>
          {title}
        </span>
        <span className="text-[10px] mono muted">
          [{base} … {((base + len - 1) % seqMod)}] · 序号空间 {seqMod}
        </span>
      </div>
      <svg viewBox={`0 0 ${W} 48`} width="100%" style={{ display: 'block' }} role="img">
        {Array.from({ length: seqMod }, (_, i) => {
          const st = status(i)
          const inWin = win.has(i)
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
                stroke={inWin ? accent : 'var(--border)'}
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
              {i < numPkts && st.label && (
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
      </svg>
      <div className="text-[10px] muted mt-1 leading-snug">{note}</div>
      {extraLegend && extraLegend.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
          {extraLegend.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1 text-[10px] muted">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SrDemo() {
  const [N, setN] = useState(3)
  const [seqBits, setSeqBits] = useState(2)
  const [numPkts, setNumPkts] = useState(5)
  const [lossData, setLossData] = useState('1')
  const [lossAck, setLossAck] = useState(false)
  const [showDilemma, setShowDilemma] = useState(false)

  const seqMod = 1 << seqBits
  const dilemma = seqMod < 2 * N

  const sim = useMemo(
    () =>
      simulateSr({
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
  const cur = current
    ? current.snap
    : { sendBase: 0, nextSeq: 0, unacked: [], expected: 0, recvBuf: [], acked: [] }

  // 累计交付的分组数（一次交付事件可能交付多个分组）
  const deliveredSoFar = sim.events
    .slice(0, applied)
    .filter((e) => e.kind === 'deliver')
    .reduce((acc, e) => {
      const m = e.title.match(/按序交付 (\d+) 个分组/)
      return acc + (m ? Number(m[1]) : 1)
    }, 0)
  const bufSoFar = cur.recvBuf.length
  const retxSoFar = sim.events.slice(0, applied).filter((e) => e.kind === 'timeout').length

  const senderStatus = (wire: number) => {
    // wire 是线序号（模 seqMod），这里映射回绝对序号来查状态
    const abs = cur.acked.concat(cur.unacked).find((a) => a % seqMod === wire)
    if (abs === undefined) return { fill: 'var(--surface)', text: 'var(--text-muted)', label: '' }
    if (cur.acked.includes(abs)) return { fill: 'rgba(22,160,120,0.20)', text: 'var(--text)', label: '已确认' }
    if (cur.unacked.includes(abs)) return { fill: 'rgba(50,85,219,0.24)', text: 'var(--text)', label: '在途' }
    return { fill: 'var(--surface)', text: 'var(--text-muted)', label: '' }
  }
  const recvStatus = (wire: number) => {
    const expWire = ((cur.expected % seqMod) + seqMod) % seqMod
    const bufWire = cur.recvBuf.map((b) => ((b % seqMod) + seqMod) % seqMod)
    const delWire = cur.acked.map((b) => ((b % seqMod) + seqMod) % seqMod)
    if (wire === expWire) return { fill: 'rgba(50,85,219,0.24)', text: 'var(--text)', label: '期望' }
    if (bufWire.includes(wire)) return { fill: 'rgba(220,120,40,0.30)', text: 'var(--text)', label: '缓存' }
    if (delWire.includes(wire)) return { fill: 'rgba(22,160,120,0.16)', text: 'var(--text-muted)', label: '已交付' }
    return { fill: 'var(--surface)', text: 'var(--text-muted)', label: '' }
  }

  return (
    <DemoFrame
      title="选择重传（SR）：只重传丢掉的那一个"
      description="SR 的接收方缓存乱序分组并按序交付，发送方为每个在途分组各设一个定时器。代价是需要更大的序号空间。"
      controls={
        <PlayControls
          playing={machine.playing}
          onPlay={() => machine.setPlaying(true)}
          onPause={() => machine.setPlaying(false)}
          onReset={machine.reset}
          onStep={machine.step}
          onStepBack={machine.stepBack}
          canStepBack
          speed={machine.speed}
          onSpeedChange={machine.setSpeed}
        />
      }
      legend={[
        { color: 'var(--brand)', label: '发送方窗口 / 期望序号' },
        { color: '#16a078', label: '已确认 / 已交付' },
        { color: '#dc7828', label: '接收方缓存的乱序分组' },
      ]}
    >
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ParamSlider
            label="窗口大小 N"
            value={N}
            onChange={(v) => {
              setN(v)
              machine.reset()
            }}
            min={1}
            max={7}
            unit="个分组"
            hint="发送方最多 N 个在途分组；接收方窗口同样为 N。"
          />
          <ParamSlider
            label="序号位数 k"
            value={seqBits}
            onChange={(v) => {
              setSeqBits(v)
              machine.reset()
            }}
            min={2}
            max={4}
            unit="位"
            hint={`序号空间 2^${seqBits} = ${seqMod} 个序号。`}
          />
          <ParamSlider
            label="要发送的分组总数"
            value={numPkts}
            onChange={(v) => {
              setNumPkts(v)
              machine.reset()
            }}
            min={1}
            max={8}
            unit="个"
          />
          <div className="space-y-2">
            <ParamSelect
              label="注入故障"
              value={lossData}
              onChange={(v) => {
                setLossData(v)
                machine.reset()
              }}
              options={[
                { value: 'none', label: '不丢失任何分组' },
                ...Array.from({ length: numPkts }, (_, i) => ({
                  value: String(i),
                  label: `丢失第 ${i + 1} 个分组（序号 ${i % seqMod}）`,
                })),
              ]}
            />
            <ParamToggle
              label="同时丢失第一个 ACK"
              value={lossAck}
              onChange={(v) => {
                setLossAck(v)
                machine.reset()
              }}
            />
          </div>
        </div>

        {/* 序号空间约束警告 */}
        {dilemma && (
          <div
            className="rounded-lg px-3 py-2.5 text-xs leading-relaxed"
            style={{ background: 'rgba(220,120,40,0.10)', color: '#dc7828' }}
          >
            ⚠ <b>序号空间不足</b>：当前 2^{seqBits} = {seqMod} 个序号，窗口 N = {N}，而 SR 要求 2^k ≥ 2N = {2 * N}。
            序号空间不足时，接收方无法区分「新的分组」与「旧分组的重传副本」——因为旧序号会在窗口内循环回来，
            被误当成新分组交付给上层，造成重复数据。下面的演示中把 N 调大就能看到这个现象。
          </div>
        )}

        {/* 窗口 */}
        <div className="grid lg:grid-cols-2 gap-3">
          <WinStrip
            title="发送方窗口（N 个在途分组，各有独立定时器）"
            seqMod={seqMod}
            numPkts={numPkts}
            base={cur.sendBase % seqMod}
            len={N}
            status={senderStatus}
            note={`最老的未确认分组 = ${cur.sendBase % seqMod}；在途未确认 ${cur.unacked.length} 个。`}
            accent="var(--brand)"
          />
          <WinStrip
            title="接收方窗口（缓存乱序分组，按序交付）"
            seqMod={seqMod}
            numPkts={numPkts}
            base={cur.expected % seqMod}
            len={N}
            status={recvStatus}
            note={`期望序号 = ${cur.expected % seqMod}；缓冲区中缓存了 ${cur.recvBuf.length} 个乱序分组：${
              cur.recvBuf.length ? cur.recvBuf.map((b) => b % seqMod).join('、') : '无'
            }。`}
            accent="#16a078"
            extraLegend={[{ label: '缓存的乱序分组', color: 'rgba(220,120,40,0.6)' }]}
          />
        </div>

        {/* 事件 */}
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
            { label: '重传分组数', value: `${sim.retransmissions} 个`, hint: '只重传丢失的那一个，不放大' },
            { label: '接收方缓冲区', value: `${bufSoFar} 个分组`, hint: 'SR 需要缓存乱序分组' },
            {
              label: '序号空间约束',
              value: `2^${seqBits} ${dilemma ? '<' : '≥'} 2N`,
              hint: dilemma ? '违反！会出现重复' : '满足',
            },
          ]}
        />

        {sim.duplicateDeliveries > 0 && (
          <div
            className="rounded-lg px-3 py-2.5 text-xs leading-relaxed"
            style={{ background: 'rgba(220,120,40,0.10)', color: '#dc7828' }}
          >
            ⚠ <b>实测到重复交付 {sim.duplicateDeliveries} 次</b>：因为 2^{seqBits} = {seqMod} &lt; 2N ={' '}
            {2 * N}，「当前接收窗口」与「之前的窗口」在模序号空间里<b>重叠</b>了——接收方无法判断收到的分组是新分组还是旧分组的重传副本，
            于是把旧副本当新分组交付给了上层应用。把「序号位数 k」调大到满足 2^k ≥ 2N 就能消除这个现象。
          </div>
        )}

        {/* Dilemma 演示 */}
        <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="text-xs font-semibold">Dilemma：为什么序号空间必须 ≥ 2N？</div>
            <button onClick={() => setShowDilemma((v) => !v)} className="btn-ghost !px-2.5 !text-xs">
              {showDilemma ? '收起' : '展开对照'}
            </button>
          </div>
          {showDilemma && (
            <div className="space-y-3">
              <div className="text-[11px] leading-relaxed">
                取教科书上的例子：序号 0、1、2、3，窗口大小 N = 3。接收方现在期望序号 <b>0</b>。
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="rounded-lg p-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="text-[11px] font-semibold mb-1.5" style={{ color: '#16a078' }}>
                    场景 (a)：分组 0 丢失，后来才补到
                  </div>
                  <div className="text-[11px] mono space-y-1">
                    <div>发送 0（丢失）</div>
                    <div>发送 1 → 接收方缓存</div>
                    <div>发送 2 → 接收方缓存</div>
                    <div>重传 0 → 接收方期望 0，✓ 接受并交付</div>
                    <div className="muted">窗口滑到 1、2、3</div>
                  </div>
                </div>
                <div className="rounded-lg p-2.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                  <div className="text-[11px] font-semibold mb-1.5" style={{ color: '#dc7828' }}>
                    场景 (b)：分组 0 其实早就到了（ACK 丢了）
                  </div>
                  <div className="text-[11px] mono space-y-1">
                    <div>发送 0 → 已交付，期望变 1</div>
                    <div>发送 1 → 缓存</div>
                    <div>发送 2 → 缓存</div>
                    <div>重传 0 → 序号 0 又落在窗口内！</div>
                    <div className="muted">接收方无法分辨 → 误当新分组 → 重复交付</div>
                  </div>
                </div>
              </div>
              <StepNote
                tone={dilemma ? 'warn' : 'ok'}
                text={
                  dilemma
                    ? `接收方在场景 (a) 和 (b) 中看到的序号序列<b>完全一样</b>，无法区分。根本原因是 2^k = ${seqMod} < 2N = ${2 * N}：当发送窗口滑到 3 时，旧序号 0 又回到了接收窗口 [0,2] 之内。解决办法：保证 2^k ≥ 2N，也就是窗口最大只能用到序号空间的一半。`
                    : `当前 2^k = ${seqMod} ≥ 2N = ${2 * N}，条件满足。发送窗口永远不会用满整个序号空间，因此旧序号回绕时一定落在接收窗口之外，接收方能可靠地识别重复分组。`
                }
              />
            </div>
          )}
        </div>

        <StepNote
          tone="info"
          text={`对比 GBN：本次只丢了 ${sim.lostPackets} 个分组，SR 只重传了 ${sim.retransmissions} 个（1:1，无放大）；而 GBN 会把丢失分组之后的所有分组统统重传。代价是 SR 需要接收方缓冲区（当前缓存 ${bufSoFar} 个分组）和更大的序号空间。`}
        />
      </div>
    </DemoFrame>
  )
}
