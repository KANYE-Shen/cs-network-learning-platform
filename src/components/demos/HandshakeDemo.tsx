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
 * TCP 三次握手（PPT 第 76-79 页）。
 *
 * 正常流程：
 *   客户端 CLOSED → SYN_SENT → ESTAB
 *   服务端 LISTEN  → SYN_RCVD  → ESTAB
 *   1) SYN        : SYN=1, Seq=x            客户端 → 服务端
 *   2) SYN+ACK    : SYN=1, ACK=1, Seq=y, ACKnum=x+1   服务端 → 客户端
 *   3) ACK        : ACK=1, ACKnum=y+1        客户端 → 服务端
 *
 * 为什么需要第三次（PPT 第 77 页的两次握手失败场景）：
 *   场景：客户端的 SYN 丢失 → 服务端没收到 → 客户端超时重传 SYN。
 *   如果只要两次握手，服务端在收到重传的 SYN 后会进入 ESTAB 并发送 SYN+ACK，
 *   但客户端早已放弃（连接已终止）→ 服务端上留下一个<b>半开连接</b>，白白占用资源。
 *   第三次握手让客户端确认「服务端确实还活着」，并且让服务端知道客户端也还活着。
 */

type StepKind = 'syn' | 'synack' | 'ack' | 'note'

interface HStep {
  kind: StepKind
  title: string
  detail: string
  cState: string
  sState: string
  wire?: string
  tone: 'info' | 'ok' | 'warn'
}

const C_FLOW = ['CLOSED', 'SYN-SENT', 'ESTABLISHED']
const S_FLOW = ['LISTEN', 'SYN-RECEIVED', 'ESTABLISHED']

export default function HandshakeDemo() {
  const [clientISN, setClientISN] = useState(100)
  const [serverISN, setServerISN] = useState(500)
  const [twoWay, setTwoWay] = useState(false)
  const [synLost, setSynLost] = useState(false)

  const steps = useMemo<HStep[]>(() => {
    if (twoWay) {
      // PPT 第 77 页：两次握手的失败场景
      return [
        {
          kind: 'syn',
          title: '客户端发送 SYN(seq=x)',
          detail: `客户端从 CLOSED 进入 SYN-SENT，发送 SYN，Seq=${clientISN}。`,
          cState: 'SYN-SENT',
          sState: 'LISTEN',
          wire: `SYN=1, Seq=${clientISN}`,
          tone: 'info',
        },
        {
          kind: 'note',
          title: 'SYN 在网络中丢失，客户端超时后重传 SYN',
          detail:
            '客户端等待 SYN+ACK 超时 → 重传 SYN。这时服务端仍然处于 LISTEN。两次握手的要害就在这里。',
          cState: 'SYN-SENT',
          sState: 'LISTEN',
          tone: 'warn',
        },
        {
          kind: 'note',
          title: '【若只有两次握手】服务端收到重传的 SYN → 进入 ESTAB 并回 SYN+ACK',
          detail: `服务端认为连接建立，发送 SYN+ACK(seq=${serverISN}, ACKnum=${clientISN + 1})，并把这个连接记下来。`,
          cState: 'SYN-SENT',
          sState: 'ESTABLISHED',
          wire: `SYN=1, ACK=1, Seq=${serverISN}, ACKnum=${clientISN + 1}`,
          tone: 'warn',
        },
        {
          kind: 'note',
          title: '但客户端已经放弃了这次连接（终止）',
          detail:
            '客户端此前超时后已关闭，不会再发送第三个报文段。服务端的 SYN+ACK 变成「无人认领的报文段」。',
          cState: 'CLOSED',
          sState: 'ESTABLISHED',
          tone: 'warn',
        },
        {
          kind: 'note',
          title: '服务端上留下了一个半开连接（half open connection）',
          detail:
            '服务端以为自己连上了客户端（ESTAB），而客户端那边根本没有这个连接。这就是一个<b>半开连接</b>：白白占用服务端资源，还可能让服务端误以为「客户端还活着」。',
          cState: 'CLOSED',
          sState: 'ESTABLISHED',
          tone: 'warn',
        },
        {
          kind: 'note',
          title: '第三次握手如何避免：客户端必须用 ACK 确认 SYN+ACK',
          detail: `如果客户端还活着，它会回一个 ACK(ACKnum=${serverISN + 1})，服务端据此确认「客户端确实收到了 SYN+ACK，连接双向成立」。客户端若已放弃，则不会回这个 ACK，服务端就不会建立连接（或者在超时后清理）。`,
          cState: 'SYN-SENT',
          sState: 'ESTABLISHED',
          wire: `ACK=1, ACKnum=${serverISN + 1}`,
          tone: 'ok',
        },
      ]
    }
    return [
      {
        kind: 'syn',
        title: `① 客户端发送 SYN：SYN=1, Seq=${clientISN}`,
        detail: `客户端从 CLOSED 进入 SYN-SENT。它随机选择一个初始序号 ISN = ${clientISN}（序号空间从 ${clientISN} 开始）。SYN 报文段本身占用 1 个序号。`,
        cState: 'SYN-SENT',
        sState: 'LISTEN',
        wire: `SYN=1, Seq=${clientISN}`,
        tone: 'info',
      },
      {
        kind: 'synack',
        title: `② 服务端回复 SYN+ACK：SYN=1, ACK=1, Seq=${serverISN}, ACKnum=${clientISN + 1}`,
        detail: `服务端收到 SYN 后从 LISTEN 进入 SYN-RECEIVED。它选择自己的初始序号 ISN = ${serverISN}，并用 ACKnum=${clientISN + 1} 确认客户端的 SYN（SYN 占用 1 个序号，所以确认号要 +1）。这个报文段同时做了两件事：确认了客户端，也请求确认自己。`,
        cState: 'SYN-SENT',
        sState: 'SYN-RECEIVED',
        wire: `SYN=1, ACK=1, Seq=${serverISN}, ACKnum=${clientISN + 1}`,
        tone: 'info',
      },
      {
        kind: 'ack',
        title: `③ 客户端发送 ACK：ACK=1, ACKnum=${serverISN + 1}`,
        detail: `客户端收到 SYN+ACK 后进入 ESTABLISHED。它用 ACKnum=${serverISN + 1} 确认服务端的 SYN。收到这个 ACK，服务端也进入 ESTABLISHED。这个报文段还可以携带客户端的第一批数据。`,
        cState: 'ESTABLISHED',
        sState: 'ESTABLISHED',
        wire: `ACK=1, ACKnum=${serverISN + 1}`,
        tone: 'ok',
      },
    ]
  }, [twoWay, clientISN, serverISN])

  const machine = useStepMachine(
    steps.map((s) => ({ label: s.title, detail: s.detail })),
    { intervalMs: 1600 },
  )
  const applied = Math.min(machine.index, steps.length)
  const current = applied > 0 ? steps[applied - 1] : null
  const next = applied < steps.length ? steps[applied] : null

  const cState = current?.cState ?? 'CLOSED'
  const sState = current?.sState ?? 'LISTEN'

  /** 状态图：高亮当前状态 */
  function StateFlow({
    title,
    flow,
    cur,
    accent,
  }: {
    title: string
    flow: string[]
    cur: string
    accent: string
  }) {
    return (
      <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
        <div className="text-[11px] font-semibold mb-2" style={{ color: accent }}>
          {title}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {flow.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div
                className="rounded-md px-2 py-1 text-[10px] mono font-semibold transition-all"
                style={{
                  background: s === cur ? accent : 'var(--surface)',
                  color: s === cur ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${s === cur ? accent : 'var(--border)'}`,
                  boxShadow: s === cur ? `0 0 0 2px color-mix(in srgb, ${accent} 22%, transparent)` : 'none',
                }}
              >
                {s}
              </div>
              {i < flow.length - 1 && <span className="muted text-[11px]">→</span>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <DemoFrame
      title="TCP 三次握手：为什么要握手三次"
      description="握手让双方互相确认「对方还活着」并商定初始序号。少一次握手，就会留下半开连接。"
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
        { color: 'var(--brand)', label: '客户端状态' },
        { color: '#16a078', label: '服务端状态' },
        { color: '#dc7828', label: '失败场景 / 半开连接' },
      ]}
    >
      <div className="space-y-4">
        {/* 参数 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ParamSlider
            label="客户端初始序号 x"
            value={clientISN}
            onChange={(v) => {
              setClientISN(v)
              machine.reset()
            }}
            min={0}
            max={999}
            unit=""
          />
          <ParamSlider
            label="服务端初始序号 y"
            value={serverISN}
            onChange={(v) => {
              setServerISN(v)
              machine.reset()
            }}
            min={0}
            max={999}
            unit=""
          />
          <div className="flex items-end pb-1">
            <ParamToggle
              label="对比：只有两次握手会怎样？"
              value={twoWay}
              onChange={(v) => {
                setTwoWay(v)
                machine.reset()
              }}
              hint="PPT 第 77 页：SYN 丢失 → 重传 → 两次握手会留下半开连接。"
            />
          </div>
        </div>

        {/* 状态机 */}
        <div className="grid lg:grid-cols-2 gap-3">
          <StateFlow title="客户端状态" flow={C_FLOW} cur={cState} accent="var(--brand)" />
          <StateFlow title="服务端状态" flow={S_FLOW} cur={sState} accent="#16a078" />
        </div>

        {/* 报文 */}
        <div
          className="rounded-lg px-3 py-2.5 text-xs mono flex items-center justify-between gap-3 flex-wrap"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <span className="muted">线上报文</span>
          <span
            className="font-semibold"
            style={{
              color: current
                ? current.tone === 'warn'
                  ? '#dc7828'
                  : current.tone === 'ok'
                    ? '#16a078'
                    : 'var(--brand)'
                : 'var(--text-muted)',
            }}
          >
            {current?.wire ?? '（等待第一个报文段）'}
          </span>
          <span className="muted">
            {applied} / {steps.length} 步
          </span>
        </div>

        <StepNote
          tone={current ? current.tone : 'info'}
          text={current ? `${current.title} —— ${current.detail}` : next ? `下一步：${next.title}` : '点击「单步」或「播放」开始。'}
        />

        {/* 报文时间线 */}
        <div>
          <div className="text-xs font-semibold mb-1.5">握手报文</div>
          <ol className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {steps.map((s, i) => (
              <li
                key={i}
                className="rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed"
                style={{
                  background: i < applied ? 'var(--surface-2)' : 'transparent',
                  border: `1px solid ${i === applied ? 'var(--brand)' : 'var(--border)'}`,
                  opacity: i < applied ? 1 : 0.55,
                }}
              >
                <span className="font-semibold">{s.title}</span>
                {s.wire && <span className="mono muted"> · {s.wire}</span>}
                <span className="muted"> — {s.detail}</span>
              </li>
            ))}
          </ol>
        </div>

        <ResultGrid
          items={[
            { label: '客户端状态', value: cState, highlight: true },
            { label: '服务端状态', value: sState, highlight: true },
            {
              label: '握手报文数',
              value: twoWay ? '2（不足）' : '3 个',
              hint: twoWay ? '会留下半开连接' : 'SYN + SYN/ACK + ACK',
            },
            {
              label: '数据可携带于',
              value: '第 3 个报文段',
              hint: '客户端可在 ACK 中捎带数据',
            },
          ]}
        />

        <StepNote
          tone={twoWay ? 'warn' : 'ok'}
          text={
            twoWay
              ? `两次握手的失败场景（PPT 第 77 页）：SYN 丢失 → 客户端超时重传 → 服务端收到后进入 ESTAB 并回 SYN+ACK，但客户端早已终止 → 服务端留下一个<b>半开连接</b>。第三次握手的 ACK 让服务端确认「客户端还活着」，从而避免这种半开连接。`
              : `三次握手完成了两件必须的事：① 双方互相确认对方愿意并且还活着建立连接；② 双方各自选定初始序号，从而能对字节流编号（Seq=${clientISN} / Seq=${serverISN}）。注意 SYN 占用 1 个序号，所以 SYN+ACK 的确认号是 ${clientISN + 1}，第三个 ACK 的确认号是 ${serverISN + 1}。`
          }
        />
      </div>
    </DemoFrame>
  )
}
