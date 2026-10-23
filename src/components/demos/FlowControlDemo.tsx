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
 * TCP 流量控制（PPT 第 73-74 页）。
 *
 * 机制：
 *  - 接收方在「接收方 → 发送方」的报文段首部里通告 rwnd（receive window），
 *    即接收缓冲区中还剩多少可用空间。
 *  - 发送方把「已发送但未被确认的字节数」（in-flight 数据）限制在 rwnd 以内：
 *        LastByteSent − LastByteAcked ≤ rwnd
 *  - 这样接收缓冲区永远不会溢出。
 *
 * 演示要点：
 *  - rwnd 动态收缩（应用读取慢 → 缓冲区占用高 → rwnd 变小 → 发送方窗口收缩 → 必须停下）
 *  - 缓冲区满时发送方必须停止发送（这就是「必须停下」）
 */

const MSS = 100 // 每段 MSS 字节
const D_PROP = 1 // 单向传播时延

interface Ev {
  id: number
  time: number
  kind: 'send' | 'deliver' | 'ack' | 'ackarr' | 'winupdate' | 'blocked' | 'read'
  side: '发送方' | '接收方'
  title: string
  detail: string
  tone: 'info' | 'ok' | 'warn'
  inFlight: number
  /** 发送方所知道的通告窗口 sndwnd（发送方的约束依据） */
  sndWnd: number
  /** 接收方当前计算出的窗口（尚未通告出去时可能与 sndWnd 不同） */
  rwnd: number
  bufUsed: number
  bufSize: number
}

interface SimCfg {
  bufSize: number
  segSize: number
  numSeg: number
  readEvery: number // 每接收几个段，应用读取一次（释放缓冲区）
  rwndShrink: boolean
}

function simulate(cfg: SimCfg): { events: Ev[]; finalTime: number; blockedCount: number; maxInFlight: number } {
  const { bufSize, segSize, numSeg, readEvery, rwndShrink } = cfg

  interface Sched {
    time: number
    order: number
    kind: 'pkt' | 'ack'
    seq: number
    bytes: number
    rwnd?: number
  }
  const q: Sched[] = []
  const events: Ev[] = []
  let t = 0
  let order = 0

  let nextSeq = 0 // 已发送的字节数
  let lastAcked = 0 // 已被确认的字节数
  let bufUsed = 0 // 接收缓冲区已占用
  let rwnd = bufSize // 接收方当前计算出的窗口（尚未通告出去）
  // 发送方所知道的 rwnd：只有收到携带该值的报文后才更新（RFC 1122 的 sndwnd）
  let sndWnd = bufSize
  let received = 0
  let blockedCount = 0
  let maxInFlight = 0
  let order_ = 0

  const push = (time: number, kind: Sched['kind'], seq: number, bytes: number, rwndVal?: number) => {
    q.push({ time, order: order_++, kind, seq, bytes, rwnd: rwndVal })
  }
  const record = (e: Omit<Ev, 'id'>) => {
    events.push({ ...e, id: events.length + 1 })
  }

  const inFlightNow = () => nextSeq - lastAcked

  let guard = 0
  while (guard++ < 400 && events.length < 300) {
    // 发送方：只要不超出 rwnd 就继续发
    let sentThisRound = 0
    while (nextSeq < numSeg * segSize && sentThisRound < 4) {
      const inFlight = inFlightNow()
      if (inFlight + segSize > sndWnd) {
        blockedCount++
        record({
          time: t,
          kind: 'blocked',
          side: '发送方',
          title: `发送方停下：在途数据 ${inFlight} 字节 + MSS ${segSize} > rwnd ${sndWnd}`,
          detail:
            '接收方通告的窗口已经用满：再发就会溢出接收缓冲区。发送方<b>必须等待</b>窗口更新（收到新的 ACK / 窗口通告）后才能继续。这是流量控制的目的。',
          tone: 'warn',
          inFlight,
          sndWnd,
          rwnd: sndWnd,
          bufUsed,
          bufSize,
        })
        break
      }
      const seq = nextSeq
      record({
        time: t,
        kind: 'send',
        side: '发送方',
        title: `发送第 ${seq / segSize + 1} 段（${segSize} 字节，Seq=${seq}）`,
        detail: `发送前检查：在途未确认数据 ${inFlight} 字节 ≤ 通告窗口 rwnd=${sndWnd}，允许发送。`,
        tone: 'info',
        inFlight,
        sndWnd,
        rwnd: sndWnd,
        bufUsed,
        bufSize,
      })
      nextSeq += segSize
      sentThisRound++
      maxInFlight = Math.max(maxInFlight, inFlightNow())
      push(t + D_PROP, 'pkt', seq, segSize)
    }

    if (q.length === 0) break
    q.sort((a, b) => a.time - b.time || a.order - b.order)
    const e = q.shift()!
    if (e.time > t) t = e.time

    if (e.kind === 'pkt') {
      bufUsed += e.bytes
      received++
      record({
        time: t,
        kind: 'deliver',
        side: '接收方',
        title: `收到第 ${e.seq / segSize + 1} 段（${e.bytes} 字节）→ 缓冲区占用 ${bufUsed}/${bufSize}`,
        detail:
          bufUsed > bufSize
            ? '⚠ 缓冲区溢出！'
            : `缓冲区还剩 ${bufSize - bufUsed} 字节可用。`,
        tone: bufUsed > bufSize ? 'warn' : 'info',
        inFlight: inFlightNow(),
        sndWnd,
        rwnd,
        bufUsed,
        bufSize,
      })
      // 应用读取
      if (readEvery > 0 && received % readEvery === 0) {
        bufUsed = 0
        record({
          time: t,
          kind: 'read',
          side: '接收方',
          title: `应用读取了数据 → 缓冲区清空`,
          detail: '应用把数据取走了，缓冲区腾出空间，于是可以通告一个更大的 rwnd。',
          tone: 'ok',
          inFlight: inFlightNow(),
          sndWnd,
          rwnd,
          bufUsed,
          bufSize,
        })
      }
      // 计算新的 rwnd 并通告
      const newRwnd = bufSize - bufUsed
      const changed = newRwnd !== rwnd
      rwnd = newRwnd
      // ACK 报文段携带本次通告的 rwnd，发送方收到后才知道新的窗口大小
      push(t + D_PROP, 'ack', e.seq + e.bytes, e.bytes, rwnd)
      record({
        time: t,
        kind: changed ? 'winupdate' : 'ack',
        side: '接收方',
        title: changed
          ? `通告窗口更新：rwnd = ${rwnd}（缓冲区剩余 ${rwnd} 字节）`
          : `发送 ACK=${e.seq + e.bytes}（rwnd = ${rwnd} 不变）`,
        detail: changed
          ? `接收方在报文首部通告新的 rwnd。发送方看到后会把可发送量限制在 ${rwnd} 字节以内。`
          : '确认号 = 期望收到的下一个字节；同时携带当前的 rwnd。',
        tone: changed ? 'info' : 'ok',
        inFlight: inFlightNow(),
        sndWnd,
        rwnd,
        bufUsed,
        bufSize,
      })
      continue
    }

    // ACK 到达发送方：更新 sndwnd（发送方此时才知道新的通告窗口）
    lastAcked = Math.max(lastAcked, e.seq)
    const advertised = e.rwnd ?? rwnd
    const shrunk = advertised < sndWnd
    sndWnd = advertised
    record({
      time: t,
      kind: 'ackarr',
      side: '发送方',
      title: `收到 ACK=${e.seq}（rwnd = ${sndWnd}）`,
      detail: `已确认到 ${lastAcked} 字节，在途未确认数据降为 ${inFlightNow()} 字节。${
        shrunk ? '注意 rwnd 已经收缩，发送窗口随之变小。' : ''
      }`,
      tone: shrunk ? 'warn' : 'ok',
      inFlight: inFlightNow(),
      sndWnd,
      rwnd: sndWnd,
      bufUsed,
      bufSize,
    })
  }

  const finalTime = events.length ? events[events.length - 1].time : 1
  return { events, finalTime: Math.max(finalTime, 1), blockedCount, maxInFlight }
}

export default function FlowControlDemo() {
  const [bufSize, setBufSize] = useState(1000)
  const [segSize, setSegSize] = useState(250)
  const [numSeg, setNumSeg] = useState(6)
  const [readEvery, setReadEvery] = useState(0)
  const [dynamic, setDynamic] = useState(true)

  const sim = useMemo(
    () =>
      simulate({
        bufSize,
        segSize,
        numSeg,
        readEvery,
        rwndShrink: dynamic,
      }),
    [bufSize, segSize, numSeg, readEvery, dynamic],
  )

  const machine = useStepMachine(
    sim.events.map((e) => ({ label: e.title, detail: e.detail })),
    { intervalMs: 900 },
  )
  const applied = Math.min(machine.index, sim.events.length)
  const current = applied > 0 ? sim.events[applied - 1] : null
  const next = applied < sim.events.length ? sim.events[applied] : null
  const st = current ?? sim.events[0] ?? null

  const inFlight = st?.inFlight ?? 0
  // 发送方真正依据的是它收到的通告窗口 sndwnd
  const rwnd = st?.sndWnd ?? bufSize
  const bufUsed = st?.bufUsed ?? 0

  // 缓冲区占用条
  const bufPct = Math.min(100, (bufUsed / Math.max(1, bufSize)) * 100)
  const winPct = Math.min(100, (inFlight / Math.max(1, rwnd || bufSize)) * 100)

  return (
    <DemoFrame
      title="TCP 流量控制：rwnd 如何把发送方限制住"
      description="接收方在报文首部通告 rwnd（接收缓冲区剩余空间）。发送方必须保证「在途未确认数据 ≤ rwnd」，否则接收缓冲区就会溢出。"
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
        { color: 'var(--brand)', label: '发送的数据（在途）' },
        { color: '#16a078', label: '接收缓冲区已占用' },
        { color: '#dc7828', label: '发送方被阻塞' },
      ]}
    >
      <div className="space-y-4">
        {/* 参数 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ParamSlider
            label="接收缓冲区 RcvBuffer"
            value={bufSize}
            onChange={(v) => {
              setBufSize(v)
              machine.reset()
            }}
            min={200}
            max={2000}
            step={100}
            unit="字节"
            hint="教材给出的典型默认值是 4096 字节；现代操作系统通常可自动调整。"
          />
          <ParamSlider
            label="每段 MSS"
            value={segSize}
            onChange={(v) => {
              setSegSize(v)
              machine.reset()
            }}
            min={50}
            max={500}
            step={50}
            unit="字节"
          />
          <ParamSlider
            label="要发送的段数"
            value={numSeg}
            onChange={(v) => {
              setNumSeg(v)
              machine.reset()
            }}
            min={1}
            max={12}
            unit="段"
          />
          <div className="space-y-2">
            <ParamSlider
              label="应用每隔几段读取一次（释放缓冲区）"
              value={readEvery}
              onChange={(v) => {
                setReadEvery(v)
                machine.reset()
              }}
              min={0}
              max={4}
              unit="段"
              format={(v) => (v === 0 ? '不读取（应用很慢）' : `${v} 段`)}
              hint="设为 0 表示应用一直不取数据，缓冲区很快被占满。"
            />
            <ParamToggle
              label="启用动态 rwnd 收缩"
              value={dynamic}
              onChange={(v) => {
                setDynamic(v)
                machine.reset()
              }}
              hint="关闭后 rwnd 固定为缓冲区大小，发送方不会被限制。"
            />
          </div>
        </div>

        {/* 缓冲区占用条 */}
        <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold mb-2">接收缓冲区占用</div>
          <div className="h-6 rounded-lg overflow-hidden relative" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${bufPct}%`,
                background:
                  bufPct > 90 ? 'rgba(220,120,40,0.85)' : bufPct > 60 ? 'rgba(220,120,40,0.5)' : 'rgba(22,160,120,0.75)',
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[11px] mono font-semibold">
              {bufUsed} / {bufSize} 字节（{bufPct.toFixed(0)}%）
            </div>
          </div>
          <div className="text-[10px] muted mt-1">
            剩余可用空间 = 缓冲区大小 − 已占用 = <b className="mono">{Math.max(0, bufSize - bufUsed)}</b> 字节
          </div>
        </div>

        {/* 发送窗口 */}
        <div className="grid lg:grid-cols-2 gap-3">
          <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-2">发送方窗口（由 rwnd 限定）</div>
            <div className="h-6 rounded-lg overflow-hidden relative" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${winPct}%`, background: 'color-mix(in srgb, var(--brand) 75%, transparent)' }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[11px] mono font-semibold">
                在途未确认 {inFlight} / rwnd {rwnd} 字节
              </div>
            </div>
            <div className="text-[10px] muted mt-1 leading-relaxed">
              约束条件：LastByteSent − LastByteAcked ≤ rwnd。发送方每发一个字节都要检查这条不等式。
            </div>
          </div>

          <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-2">通告的 rwnd</div>
            <div className="h-6 rounded-lg overflow-hidden relative" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (rwnd / Math.max(1, bufSize)) * 100)}%`,
                  background: 'rgba(22,160,120,0.7)',
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center text-[11px] mono font-semibold">
                rwnd = {rwnd} 字节（缓冲区初始 {bufSize}）
              </div>
            </div>
            <div className="text-[10px] muted mt-1 leading-relaxed">
              rwnd 随缓冲区占用动态变化：应用读得越慢，rwnd 越小，发送方窗口收缩得越厉害。
            </div>
          </div>
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
                <span className="muted"> — {e.detail.replace(/<\/?b>/g, '')}</span>
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
            { label: '当前 rwnd', value: `${rwnd} 字节`, highlight: true, hint: '接收方通告' },
            { label: '在途未确认数据', value: `${inFlight} 字节`, hint: `≤ rwnd ${rwnd}` },
            { label: '接收缓冲区占用', value: `${bufUsed} / ${bufSize}`, hint: `${bufPct.toFixed(0)}%` },
            { label: '发送方被阻塞次数', value: `${sim.blockedCount} 次`, hint: sim.blockedCount > 0 ? '窗口用满，必须停下' : '未被阻塞' },
          ]}
        />

        <StepNote
          tone={sim.blockedCount > 0 ? 'warn' : 'ok'}
          text={
            sim.blockedCount > 0
              ? `发送方被阻塞了 ${sim.blockedCount} 次：因为「在途未确认数据 + MSS > rwnd」。这就是流量控制的意义——接收方的缓冲区永远不会被写溢出，代价是发送方必须等待。流量控制保护的是<b>接收方</b>，与拥塞控制保护的是<b>网络</b>，两者完全不同。`
              : `本次没有阻塞：缓冲区够大或者应用及时读取，发送方始终能填满窗口。试试把 RcvBuffer 调小、或把「应用每隔几段读取一次」设为 0（应用不读数据），就能看到发送方被迫停下。`
          }
        />
      </div>
    </DemoFrame>
  )
}
