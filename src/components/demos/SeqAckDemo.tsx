import { useMemo, useState } from 'react'
import { DemoFrame, ParamSlider, PlayControls, ResultGrid, StepNote, useStepMachine } from './DemoKit'

/**
 * TCP 的序号（Seq）与确认号（ACK）。
 *
 * 关键点（PPT 第 56-57 页）：
 *  - Seq = 本段数据中<b>第一个字节</b>在字节流中的编号
 *  - ACK = 期望从对方收到的<b>下一个字节</b>的编号（不是「已经收到的最后一个字节」！）
 *  - ACK 是<b>累计确认</b>：ACK = N 表示 N 之前的所有字节都已正确收到
 *  - TCP 是字节流，没有消息边界
 *
 * 教材里的 telnet 例子：
 *  主机 A: Seq=42, ACK=79, data='C'   （A 已把 'C' 发给 B，B 的下一个期望字节是 79）
 *  主机 B: Seq=79, ACK=43,  data='C'   （B 回显 'C'，并确认 A 的 42 号字节，即下一个期望 43）
 *  主机 A: Seq=43, ACK=80              （A 收到回显后确认，下一个期望 80）
 */

/** 一个 TCP 报文段 */
interface Seg {
  kind: 'data' | 'ack-only'
  seq: number
  ack: number
  data: string
  from: 'A' | 'B'
  note?: string
}

interface Step {
  label: string
  detail?: string
}

const ASCII_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/**
 * 连接运行状态：
 *  - sndA / sndB：各自方向上「下一个将要发送的字节」序号
 *  - rcvA / rcvB：各自方向上「期望收到的下一个字节」序号（也就是它发出的 ACK 值）
 */
interface ConnState {
  sndA: number
  sndB: number
  rcvA: number // A 期望从 B 收到的下一个字节（A 发出的 ACK 值）
  rcvB: number // B 期望从 A 收到的下一个字节（B 发出的 ACK 值）
}

export default function SeqAckDemo() {
  const [initSeqA, setInitSeqA] = useState(42)
  const [initSeqB, setInitSeqB] = useState(79)
  const [dataLen, setDataLen] = useState(3)
  const [echoLen, setEchoLen] = useState(1)
  const [steps, setSteps] = useState<Step[]>([])
  const [log, setLog] = useState<{ seg: Seg; cum: boolean }[]>([])
  const [conn, setConn] = useState<ConnState>({
    sndA: 42,
    sndB: 79,
    rcvA: 79,
    rcvB: 42,
  })

  const reset = (a = initSeqA, b = initSeqB) => {
    setSteps([])
    setLog([])
    setConn({ sndA: a, sndB: b, rcvA: b, rcvB: a })
  }

  const push = (s: Step) => setSteps((prev) => [...prev, s])

  const machine = useStepMachine(steps, { intervalMs: 1400 })

  /** 发送 A → B 的数据 */
  const sendAtoB = () => {
    const data = ASCII_LETTERS.slice(0, dataLen)
    const seg: Seg = {
      kind: 'data',
      seq: conn.sndA,
      ack: conn.rcvA, // A 期望从 B 收到的下一个字节
      data,
      from: 'A',
    }
    push({
      label: `A → B：Seq=${seg.seq}, ACK=${seg.ack}, data='${seg.data}'`,
      detail: `Seq=${seg.seq} 是本段数据第一个字节的编号；ACK=${seg.ack} 表示「我期望从你那里收到的下一个字节是 ${seg.ack}」。数据长度 ${dataLen} 字节，占用序号 ${seg.seq} ~ ${seg.seq + dataLen - 1}。`,
    })
    setLog((l) => [...l, { seg, cum: true }])
    setConn((c) => ({ ...c, sndA: c.sndA + dataLen }))
  }

  /** B 回显数据并确认 */
  const sendBtoA = () => {
    const data = ASCII_LETTERS.slice(0, echoLen)
    const seg: Seg = {
      kind: 'data',
      seq: conn.sndB,
      ack: conn.rcvB, // B 累计确认 A 的字节：期望的下一个字节
      data,
      from: 'B',
      note: '回显',
    }
    push({
      label: `B → A：Seq=${seg.seq}, ACK=${seg.ack}, data='${seg.data}'`,
      detail: `B 把收到的数据回显给用户，同时用 ACK=${seg.ack} 累计确认 A 发来的字节——注意 ACK 是「下一个期望字节」= ${seg.ack}，而不是 ${seg.ack - 1}。`,
    })
    setLog((l) => [...l, { seg, cum: true }])
    // B 收到了 A 的数据 → rcvB 前移；B 发出了回显 → sndB 前移
    setConn((c) => ({
      ...c,
      sndB: c.sndB + data.length,
      rcvB: c.rcvB + dataLen,
    }))
  }

  /** A 单独发一个纯 ACK */
  const sendAckOnly = () => {
    const seg: Seg = {
      kind: 'ack-only',
      seq: conn.sndA,
      ack: conn.rcvA,
      data: '',
      from: 'A',
    }
    push({
      label: `A → B：Seq=${seg.seq}, ACK=${seg.ack}（纯确认，无数据）`,
      detail: `A 收到了 B 的回显，用纯 ACK 确认：ACK=${seg.ack} = B 数据的下一个期望字节。这正是 PPT 第 57 页 telnet 例子中的第三个报文段。`,
    })
    setLog((l) => [...l, { seg, cum: false }])
    // A 收到了 B 的回显 → rcvA 前移
    setConn((c) => ({ ...c, rcvA: c.rcvA + echoLen }))
  }

  /** 载入教材原例 */
  const loadPptExample = () => {
    setInitSeqA(42)
    setInitSeqB(79)
    setDataLen(1)
    setEchoLen(1)
    reset(42, 79)
    setSteps([
      {
        label: `A → B：Seq=42, ACK=79, data='C'`,
        detail: '用户 A 敲入字符 C，TCP 把 "C" 封装成一个字节的报文段发给 B。Seq=42 是这个字节的编号；ACK=79 表示 A 期望从 B 收到的下一个字节是 79。',
      },
      {
        label: `B → A：Seq=79, ACK=43, data='C'`,
        detail: 'B 的应用层（telnet）把收到的 C 回显给用户。B 回发的数据用 B 自己的序号空间（从 79 开始），并用 ACK=43 确认「A 的 42 号字节已收到，下一个期望 43」。',
      },
      {
        label: `A → B：Seq=43, ACK=80`,
        detail: 'A 收到回显后发一个纯 ACK：ACK=80 表示「B 的 79 号字节已收到，下一个期望 80」。至此一次 telnet 交互共 3 个报文段、2 个 RTT。',
      },
    ])
    setLog([
      { seg: { kind: 'data', seq: 42, ack: 79, data: 'C', from: 'A' }, cum: true },
      { seg: { kind: 'data', seq: 79, ack: 43, data: 'C', from: 'B' }, cum: true },
      { seg: { kind: 'ack-only', seq: 43, ack: 80, data: '', from: 'A' }, cum: false },
    ])
    // 三段报文走完之后的状态：A 已发 1 字节（sndA=43）、B 已发 1 字节（sndB=80）
    setConn({ sndA: 43, sndB: 80, rcvA: 80, rcvB: 43 })
  }

  const applied = Math.min(machine.index, steps.length)
  const current = applied > 0 ? steps[applied - 1] : null
  const next = applied < steps.length ? steps[applied] : null

  /** 字节流可视化：把序号空间按字节展开（跟随连接运行状态） */
  const byteRange = useMemo(() => {
    const start = Math.min(initSeqA, initSeqB)
    const end = Math.max(conn.sndA, conn.sndB)
    const lo = Math.max(start, end - 24)
    const hi = end + 2
    const arr: number[] = []
    for (let i = lo; i <= hi; i++) arr.push(i)
    return arr
  }, [initSeqA, initSeqB, conn.sndA, conn.sndB])

  // A 已发出的字节：initSeqA .. conn.sndA-1
  const dataBytes = useMemo(
    () => new Set(Array.from({ length: Math.max(0, conn.sndA - initSeqA) }, (_, i) => initSeqA + i)),
    [initSeqA, conn.sndA],
  )
  // B 已发出的字节：initSeqB .. conn.sndB-1
  const echoBytes = useMemo(
    () => new Set(Array.from({ length: Math.max(0, conn.sndB - initSeqB) }, (_, i) => initSeqB + i)),
    [initSeqB, conn.sndB],
  )

  return (
    <DemoFrame
      title="TCP 序号与确认号：按字节编号"
      description="TCP 把字节流按字节编号。Seq 是本段第一个字节的编号，ACK 是期望收到的下一个字节的编号（累计确认）。"
      controls={
        <>
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
        </>
      }
      legend={[
        { color: 'var(--brand)', label: 'A → B 的数据字节' },
        { color: '#16a078', label: 'B → A 的回显字节' },
        { color: '#dc7828', label: '下一个期望字节（ACK 值）' },
      ]}
    >
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ParamSlider
            label="A 的初始序号 (ISN)"
            value={initSeqA}
            onChange={(v) => {
              setInitSeqA(v)
              reset(v, initSeqB)
            }}
            min={0}
            max={100}
            unit="字节"
            hint="三次握手时双方商定的初始序号。"
          />
          <ParamSlider
            label="B 的初始序号 (ISN)"
            value={initSeqB}
            onChange={(v) => {
              setInitSeqB(v)
              reset(initSeqA, v)
            }}
            min={0}
            max={100}
            unit="字节"
          />
          <ParamSlider
            label="A 发送的数据长度"
            value={dataLen}
            onChange={(v) => {
              setDataLen(v)
              reset()
            }}
            min={1}
            max={6}
            unit="字节"
            hint="TCP 是字节流，没有消息边界——这里的「一条消息」可以是任意长度。"
          />
          <ParamSlider
            label="B 回显的数据长度"
            value={echoLen}
            onChange={(v) => {
              setEchoLen(v)
              reset()
            }}
            min={1}
            max={6}
            unit="字节"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex flex-wrap gap-2">
          <button onClick={sendAtoB} className="btn-primary !text-xs">
            A 发送数据给 B
          </button>
          <button onClick={sendBtoA} className="btn-primary !text-xs">
            B 回显并确认
          </button>
          <button onClick={sendAckOnly} className="btn-outline !text-xs">
            A 发送纯 ACK
          </button>
          <button onClick={loadPptExample} className="btn-ghost !text-xs">
            载入 PPT 第 57 页 telnet 原例
          </button>
        </div>

        {/* 字节流可视化 */}
        <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold mb-2">字节流编号空间</div>
          <div className="overflow-x-auto">
            <div className="flex gap-1 min-w-max">
              {byteRange.map((b) => {
                const isData = dataBytes.has(b)
                const isEcho = echoBytes.has(b)
                const isNextA = b === conn.sndA
                const isNextB = b === conn.sndB
                return (
                  <div key={b} className="text-center">
                    <div
                      className="w-8 h-8 rounded flex items-center justify-center text-[10px] mono font-semibold"
                      style={{
                        background: isData
                          ? 'color-mix(in srgb, var(--brand) 85%, transparent)'
                          : isEcho
                            ? 'rgba(22,160,120,0.85)'
                            : 'var(--surface)',
                        border: `1px solid ${
                          isNextA || isNextB ? '#dc7828' : isData || isEcho ? 'transparent' : 'var(--border)'
                        }`,
                        color: isData || isEcho ? '#fff' : 'var(--text-muted)',
                      }}
                    >
                      {isData ? ASCII_LETTERS[(b - initSeqA) % 26] : isEcho ? ASCII_LETTERS[(b - initSeqB) % 26] : ''}
                    </div>
                    <div className="text-[9px] mono muted mt-0.5">{b}</div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="text-[10px] muted mt-2 leading-relaxed">
            蓝=A 发出的字节（占用序号 {initSeqA} ~ {conn.sndA - 1}）；绿=B 发出的字节（占用序号 {initSeqB} ~{' '}
            {conn.sndB - 1}）；橙框 = 对方的「下一个期望字节」，也就是 ACK 字段的值。
            A 的下一个期望字节 = <b className="mono">{conn.rcvA}</b>，B 的下一个期望字节 ={' '}
            <b className="mono">{conn.rcvB}</b>。
          </div>
        </div>

        {/* 报文段列表 */}
        <div>
          <div className="text-xs font-semibold mb-1.5">报文段</div>
          {log.length === 0 ? (
            <div className="text-[11px] muted">还没有发送任何报文段。</div>
          ) : (
            <div className="space-y-1.5">
              {log.map((l, i) => (
                <div
                  key={i}
                  className="rounded-lg px-2.5 py-2 text-[11px] mono"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  <span className="font-semibold" style={{ color: l.seg.from === 'A' ? 'var(--brand)' : '#16a078' }}>
                    主机 {l.seg.from}
                  </span>
                  <span className="muted"> → </span>
                  <span className="font-semibold">{l.seg.from === 'A' ? '主机 B' : '主机 A'}</span>
                  <span className="muted"> · </span>
                  <span>Seq={l.seg.seq}</span>
                  <span className="muted">, </span>
                  <span>ACK={l.seg.ack}</span>
                  {l.seg.data ? (
                    <>
                      <span className="muted">, data='{l.seg.data}'</span>
                      <span className="muted">（占用 {l.seg.data.length} 个序号：{l.seg.seq} ~ {l.seg.seq + l.seg.data.length - 1}）</span>
                    </>
                  ) : (
                    <span className="muted">（无数据，纯 ACK）</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <StepNote
          tone={current ? 'info' : 'info'}
          text={
            current
              ? `${current.label} —— ${current.detail ?? ''}`
              : next
                ? `下一步：${next.label}`
                : '点击上方按钮构造报文段，或载入教材原例。'
          }
        />

        <ResultGrid
          items={[
            { label: 'A 的下一个期望字节', value: `${conn.rcvA}`, highlight: true, hint: 'A 发出 ACK = 此值' },
            { label: 'B 的下一个期望字节', value: `${conn.rcvB}`, highlight: true, hint: 'B 发出 ACK = 此值' },
            { label: 'A 的下一个发送序号', value: `${conn.sndA}`, hint: 'A 下次发数据用 Seq = 此值' },
            { label: 'B 的下一个发送序号', value: `${conn.sndB}`, hint: 'B 下次发数据用 Seq = 此值' },
          ]}
        />

        <StepNote
          tone="ok"
          text={`最容易错的一点：ACK 不是「刚收到的最后一个字节」，而是「<b>期望收到的下一个字节</b>」。所以 A 发 1 字节（Seq=42）之后，确认它的 ACK 是 43 而不是 42。Seq 和 ACK 是<b>两个不同方向</b>的编号空间，各自独立计数。`}
        />
      </div>
    </DemoFrame>
  )
}
