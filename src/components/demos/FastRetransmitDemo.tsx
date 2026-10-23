import { useMemo, useState } from 'react'
import {
  DemoFrame,
  ParamSlider,
  ParamToggle,
  PlayControls,
  ResultGrid,
  StepNote,
  useStepMachine,
} from './DemoKit'

/**
 * TCP 快速重传（PPT 第 69-71 页）。
 *
 * 教材给出的算法（照搬）：
 *   event: ACK received, with ACK field value of y
 *   if (y > SendBase) {
 *       SendBase = y
 *       if (there are currently not-yet-acknowledged segments) start timer
 *   } else {
 *       increment count of dup ACKs received for y
 *       if (count of dup ACKs received for y = 3) {
 *           resend segment with sequence number y
 *       }
 *   }
 *
 * 原理：超时时间往往比较长，等超时再重传浪费了时间。发送方往往背靠背发很多分段，
 * 一旦某个分段丢失，后面到达的分段会让接收方连发重复 ACK（dup ACK）。
 * 收到 3 个重复 ACK（triple duplicate ACKs）就立即重传那个最小的未确认分段，不等超时。
 */

const D_TX = 1
const D_PROP = 1
const ACK_TX = 0.5
const INIT_SEQ = 100

interface SimState {
  sendBase: number
  nextSeq: number
  outstanding: number[]
  rcvNxt: number
  dupAckValue: number | null
  dupCount: number
  buffered: number[]
  delivered: number[]
  lost: number[]
  retransmitted: number[]
}

interface Ev {
  id: number
  time: number
  kind: 'send' | 'pktdrop' | 'deliver' | 'buffer' | 'ack' | 'dupack' | 'ackarr' | 'fastretx' | 'timeout'
  side: '发送方' | '接收方' | '信道'
  title: string
  detail: string
  tone: 'info' | 'ok' | 'warn'
  st: SimState
}

function simulate(cfg: {
  numSeg: number
  lossIndex: number
  rto: number
  fastRetransmit: boolean
}): {
  events: Ev[]
  finalTime: number
  recoveryTime: number | null
  timeoutUsed: boolean
  retransmitted: number[]
} {
  const { numSeg, lossIndex, rto, fastRetransmit } = cfg

  interface Sched {
    time: number
    order: number
    kind: 'pkt' | 'ack' | 'timer'
    seq: number
    drop: boolean
    retx: boolean
    rwnd?: number
  }
  const q: Sched[] = []
  const events: Ev[] = []
  let t = 0
  let order = 0

  const st: SimState = {
    sendBase: INIT_SEQ,
    nextSeq: INIT_SEQ,
    outstanding: [],
    rcvNxt: INIT_SEQ,
    dupAckValue: null,
    dupCount: 0,
    buffered: [],
    delivered: [],
    lost: [],
    retransmitted: [],
  }

  let timerExpiry = 0
  let recoveryTime: number | null = null
  let timeoutUsed = false

  const push = (time: number, kind: Sched['kind'], seq: number, drop = false, retx = false) => {
    q.push({ time, order: order++, kind, seq, drop, retx })
  }
  const snap = (): SimState => ({
    ...st,
    outstanding: [...st.outstanding],
    buffered: [...st.buffered],
    delivered: [...st.delivered],
    lost: [...st.lost],
    retransmitted: [...st.retransmitted],
  })
  const record = (e: Omit<Ev, 'id' | 'st'>) => {
    events.push({ ...e, id: events.length + 1, st: snap() })
  }

  // 发送方一次性把 numSeg 个分段全部发出（背靠背）
  for (let i = 0; i < numSeg; i++) {
    const seq = INIT_SEQ + i
    const drop = i === lossIndex
    record({
      time: t,
      kind: 'send',
      side: '发送方',
      title: `发送分段 Seq=${seq}${drop ? '（将在信道中丢失）' : ''}`,
      detail:
        i === 0
          ? '发送方背靠背连续发送多个分段，第一个分段启动重传定时器（只针对最老的未确认分段）。'
          : `第 ${i + 1} 个分段在途。`,
      tone: drop ? 'warn' : 'info',
    })
    push(t + D_TX + D_PROP, 'pkt', seq, drop, false)
    st.outstanding.push(seq)
    st.nextSeq++
  }
  timerExpiry = t + rto
  push(timerExpiry, 'timer', INIT_SEQ)

  let guard = 0
  while (q.length && guard++ < 500 && events.length < 300) {
    q.sort((a, b) => a.time - b.time || a.order - b.order)
    const e = q.shift()!
    if (e.time > t) t = e.time

    // ---------- 定时器 ----------
    if (e.kind === 'timer') {
      if (st.outstanding.length === 0) continue
      if (e.time !== timerExpiry) continue // 过时
      timeoutUsed = true
      const target = st.outstanding[0]
      record({
        time: t,
        kind: 'timeout',
        side: '发送方',
        title: `超时！重传分段 Seq=${target}`,
        detail: `等待 ${rto} ms 仍未收到 ACK，超时定时器到期 → 重传最老的未确认分段 Seq=${target}。`,
        tone: 'warn',
      })
      st.retransmitted.push(target)
      push(t + D_TX + D_PROP, 'pkt', target, false, true)
      if (recoveryTime === null) recoveryTime = t
      timerExpiry = t + rto
      push(timerExpiry, 'timer', st.outstanding[0] ?? target)
      continue
    }

    // ---------- 数据分段到达接收方 ----------
    if (e.kind === 'pkt') {
      if (e.drop) {
        st.lost.push(e.seq)
        record({
          time: t,
          kind: 'pktdrop',
          side: '信道',
          title: `分段 Seq=${e.seq} 在信道中丢失`,
          detail: '接收方毫无察觉，它只会对后面到达的分段回送重复 ACK。',
          tone: 'warn',
        })
        continue
      }
      if (e.seq === st.rcvNxt) {
        st.delivered.push(e.seq)
        st.rcvNxt++
        // 交付缓存中后续连续的字节
        while (st.buffered.includes(st.rcvNxt)) {
          const idx = st.buffered.indexOf(st.rcvNxt)
          st.delivered.push(st.buffered[idx])
          st.buffered.splice(idx, 1)
          st.rcvNxt++
        }
        record({
          time: t,
          kind: 'deliver',
          side: '接收方',
          title: `收到分段 Seq=${e.seq} → 交付上层应用`,
          detail: `序号正好等于期望值，交付给上层。接收方现在期望 Seq=${st.rcvNxt}。`,
          tone: 'ok',
        })
        push(t + ACK_TX + D_PROP, 'ack', st.rcvNxt)
      } else {
        // 乱序：缓存并立刻回送重复 ACK
        if (!st.buffered.includes(e.seq)) st.buffered.push(e.seq)
        const dupVal = st.rcvNxt
        record({
          time: t,
          kind: 'buffer',
          side: '接收方',
          title: `收到乱序分段 Seq=${e.seq}（期望 ${st.rcvNxt}）→ 缓存并回送重复 ACK`,
          detail: `检测到缺口：接收方立即回送 dup ACK=${st.rcvNxt}（= 期望的下一个字节），这是快速重传的信号来源。`,
          tone: 'warn',
        })
        push(t + ACK_TX + D_PROP, 'ack', dupVal)
      }
      continue
    }

    // ---------- ACK 到达发送方 ----------
    if (e.kind === 'ack') {
      const y = e.seq
      if (y > st.sendBase) {
        record({
          time: t,
          kind: 'ackarr',
          side: '发送方',
          title: `收到 ACK=${y}（新确认）→ SendBase = ${y}`,
          detail: `y > SendBase：确认了新的字节，SendBase 前移，并重启定时器。`,
          tone: 'ok',
        })
        st.sendBase = y
        st.outstanding = st.outstanding.filter((s) => s >= y)
        // RFC 5681：新 ACK 到达时重复 ACK 计数清零
        st.dupCount = 0
        st.dupAckValue = null
        if (st.outstanding.length > 0) {
          timerExpiry = t + rto
          push(timerExpiry, 'timer', st.outstanding[0])
        }
      } else {
        // 重复 ACK
        if (st.dupAckValue !== y) {
          st.dupAckValue = y
          st.dupCount = 0
        }
        st.dupCount++
        record({
          time: t,
          kind: 'dupack',
          side: '发送方',
          title: `收到重复 ACK=${y}（第 ${st.dupCount} 个）`,
          detail: `y = ${y} ≤ SendBase = ${st.sendBase}：这是重复 ACK，说明接收方还在等 Seq=${y}，即该分段很可能已丢失。`,
          tone: 'warn',
        })
        if (fastRetransmit && st.dupCount === 3) {
          record({
            time: t,
            kind: 'fastretx',
            side: '发送方',
            title: `收到 3 个重复 ACK → 立即重传 Seq=${y}（快重传）`,
            detail: `不等待超时，立刻重传未确认分段中序号最小的那个（Seq=${y}）。这比等超时快得多。`,
            tone: 'ok',
          })
          st.retransmitted.push(y)
          push(t + D_TX + D_PROP, 'pkt', y, false, true)
          if (recoveryTime === null) recoveryTime = t
        }
      }
      continue
    }
  }

  const finalTime = events.length ? events[events.length - 1].time : 1
  return { events, finalTime: Math.max(finalTime, 1), recoveryTime, timeoutUsed, retransmitted: st.retransmitted }
}

export default function FastRetransmitDemo() {
  const [numSeg, setNumSeg] = useState(8)
  const [lossIndex, setLossIndex] = useState(2)
  const [rto, setRto] = useState(8)
  const [fastRetransmit, setFastRetransmit] = useState(true)

  const sim = useMemo(
    () => simulate({ numSeg, lossIndex, rto, fastRetransmit }),
    [numSeg, lossIndex, rto, fastRetransmit],
  )
  const simNoFast = useMemo(
    () => simulate({ numSeg, lossIndex, rto, fastRetransmit: false }),
    [numSeg, lossIndex, rto],
  )

  const machine = useStepMachine(
    sim.events.map((e) => ({ label: e.title, detail: e.detail })),
    { intervalMs: 900 },
  )
  const applied = Math.min(machine.index, sim.events.length)
  const current = applied > 0 ? sim.events[applied - 1] : null
  const next = applied < sim.events.length ? sim.events[applied] : null
  const st = current ? current.st : sim.events[0]?.st ?? null

  const dupEvents = sim.events.filter((e) => e.kind === 'dupack')
  const dupSoFar = dupEvents.filter((_, i) => i < applied).length
  const saved = sim.recoveryTime !== null && simNoFast.recoveryTime !== null
    ? simNoFast.recoveryTime - sim.recoveryTime
    : null

  // 分段状态条
  const segs = Array.from({ length: numSeg }, (_, i) => INIT_SEQ + i)

  return (
    <DemoFrame
      title="TCP 快速重传：三个重复 ACK 就重传，不等超时"
      description="超时时间通常很长。发送方背靠背发多个分段，一旦某个丢失，接收方会连发重复 ACK；收到第 3 个重复 ACK 就立即重传。"
      controls={
        <>
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
        </>
      }
      legend={[
        { color: 'var(--brand)', label: '正常分段 / 新 ACK' },
        { color: '#16a078', label: '交付 / 快重传成功' },
        { color: '#dc7828', label: '丢失 / 重复 ACK / 超时' },
      ]}
    >
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ParamSlider
            label="发送的分段数"
            value={numSeg}
            onChange={(v) => {
              setNumSeg(v)
              setLossIndex((l) => Math.min(l, v - 1))
              machine.reset()
            }}
            min={3}
            max={12}
            unit="个"
            hint="背靠背连发，越多越容易产生 3 个重复 ACK。"
          />
          <ParamSlider
            label="丢失第几个分段"
            value={lossIndex + 1}
            onChange={(v) => {
              setLossIndex(v - 1)
              machine.reset()
            }}
            min={1}
            max={numSeg}
            unit="个"
            format={(v) => `第 ${v} 个（Seq=${INIT_SEQ + v - 1}）`}
          />
          <ParamSlider
            label="超时时间 RTO"
            value={rto}
            onChange={(v) => {
              setRto(v)
              machine.reset()
            }}
            min={3}
            max={30}
            unit="ms"
            hint="TCP 的超时时间通常「相对较长」，这就是需要快重传的原因。"
          />
          <div className="flex items-end">
            <ParamToggle
              label="启用快速重传"
              value={fastRetransmit}
              onChange={(v) => {
                setFastRetransmit(v)
                machine.reset()
              }}
              hint="关闭后只能等超时重传，可直接对比两者的恢复时刻。"
            />
          </div>
        </div>

        {/* 分段状态条 */}
        <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold mb-2">分段状态</div>
          <div className="flex gap-1 flex-wrap">
            {segs.map((seq) => {
              const isLost = st?.lost.includes(seq) ?? false
              const isRetx = st?.retransmitted.includes(seq) ?? false
              const isDelivered = st?.delivered.includes(seq) ?? false
              const isOutstanding = st?.outstanding.includes(seq) ?? false
              const isBuffered = st?.buffered.includes(seq) ?? false
              const bg = isDelivered
                ? 'rgba(22,160,120,0.85)'
                : isLost
                  ? 'rgba(220,120,40,0.85)'
                  : isRetx
                    ? 'rgba(220,120,40,0.45)'
                    : isOutstanding
                      ? 'color-mix(in srgb, var(--brand) 75%, transparent)'
                      : isBuffered
                        ? 'color-mix(in srgb, var(--brand) 35%, transparent)'
                        : 'var(--surface)'
              return (
                <div
                  key={seq}
                  className="w-14 rounded px-1 py-1 text-center"
                  style={{
                    background: bg,
                    border: `1px solid ${isRetx ? '#dc7828' : 'var(--border)'}`,
                    color: isDelivered || isLost || isOutstanding ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  <div className="text-[10px] mono font-semibold">{seq}</div>
                  <div className="text-[9px]">
                    {isDelivered ? '已交付' : isLost ? '丢失' : isRetx ? '重传中' : isBuffered ? '已缓存' : isOutstanding ? '在途' : '—'}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="text-[10px] muted mt-2">
            SendBase = {st?.sendBase ?? INIT_SEQ}（最老的未确认字节）· 接收方期望的下一个字节 = {st?.rcvNxt ?? INIT_SEQ}
            · 重复 ACK 计数 = {st?.dupCount ?? 0}（针对 ACK={st?.dupAckValue ?? '—'}）
          </div>
        </div>

        {/* dupACK 计数 */}
        <div className="grid sm:grid-cols-3 gap-3">
          <div
            className="rounded-lg px-3 py-2"
            style={{
              background: 'var(--surface-2)',
              border: `1px solid ${(st?.dupCount ?? 0) >= 3 ? '#dc7828' : 'var(--border)'}`,
            }}
          >
            <div className="text-[10px] muted">重复 ACK 计数</div>
            <div className="text-sm font-semibold mono tabular-nums" style={{ color: (st?.dupCount ?? 0) >= 3 ? '#dc7828' : 'var(--brand)' }}>
              {st?.dupCount ?? 0} / 3
            </div>
            <div className="text-[10px] muted mt-0.5">达到 3 就触发快重传</div>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] muted">快重传恢复时刻</div>
            <div className="text-sm font-semibold mono tabular-nums">
              {sim.recoveryTime !== null ? `${sim.recoveryTime.toFixed(1)} ms` : '未触发'}
            </div>
            <div className="text-[10px] muted mt-0.5">仅超时重传时：{simNoFast.recoveryTime !== null ? `${simNoFast.recoveryTime.toFixed(1)} ms` : '—'}</div>
          </div>
          <div className="rounded-lg px-3 py-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="text-[10px] muted">恢复速度优势</div>
            <div className="text-sm font-semibold mono tabular-nums" style={{ color: 'var(--brand)' }}>
              {saved !== null && saved > 0 ? `快 ${saved.toFixed(1)} ms` : '—'}
            </div>
            <div className="text-[10px] muted mt-0.5">
              {saved !== null && saved > 0 ? '不用等 RTO 到期' : '关闭快重传才可比较'}
            </div>
          </div>
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
                <span className="muted"> — {e.detail}</span>
              </li>
            ))}
          </ol>
        </div>

        <StepNote
          tone={current ? current.tone : 'info'}
          text={
            current
              ? `${current.title} —— ${current.detail}`
              : next
                ? `下一步：${next.title}`
                : '点击「单步」或「播放」开始。'
          }
        />

        <ResultGrid
          items={[
            { label: '重复 ACK 数量', value: `${dupEvents.length} 个`, highlight: true, hint: `已收到 ${dupSoFar} 个` },
            { label: '重传的分段', value: `Seq=${sim.retransmitted.join(', ') || '无'}` },
            { label: '重传触发方式', value: fastRetransmit ? '快重传（3 dup ACK）' : '超时', hint: fastRetransmit ? '不等 RTO' : `RTO = ${rto} ms` },
            { label: '是否发生超时', value: sim.timeoutUsed ? '是' : '否', hint: sim.timeoutUsed ? '快重传没能救回来' : '快重传先起作用' },
          ]}
        />

        <StepNote
          tone="info"
          text={
            fastRetransmit
              ? `教材算法（照搬）：收到 ACK=y 时，若 y > SendBase 则 SendBase = y 并重启定时器；否则把 y 的重复 ACK 计数加 1，计数<b>恰好等于 3</b> 时重传序号为 y 的分段（y 就是接收方还在等的那个字节，即最小未确认分段的首字节）。`
              : `当前关闭了快重传：即使收到 ${dupEvents.length} 个重复 ACK，发送方也只是干等 RTO = ${rto} ms 到期才重传。这就是 TCP 为什么需要快速重传——它把恢复时间从「RTO 级」压到「RTT 级」。`
          }
        />

        <StepNote
          tone="warn"
          text={`注意：重复 ACK 不等于「发送方已经知道丢的是哪个分段」——它只知道「接收方还在等 ACK=${sim.events.find((e) => e.kind === 'dupack')?.st.dupAckValue ?? '—'}」。另外 TCP 规范并不规定接收方如何处理乱序分段（教材原话：「up to implementor」），本演示采用现代 TCP 常见的做法：缓存乱序分段并按序交付。`}
        />
      </div>
    </DemoFrame>
  )
}
