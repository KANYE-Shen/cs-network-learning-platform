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
 * TCP 四次挥手（PPT 第 80-81 页）。
 *
 * 客户端（主动关闭方）：
 *   ESTAB → FIN_WAIT_1 → FIN_WAIT_2 → TIMED_WAIT → CLOSED
 * 服务端（被动关闭方）：
 *   ESTAB → CLOSE_WAIT → LAST_ACK → CLOSED
 *
 * 四个报文段：
 *   1) FIN (Seq=x)        客户端 → 服务端   「我这边没有数据要发了」
 *   2) ACK (ACKnum=x+1)  服务端 → 客户端   「收到你的 FIN」
 *   3) FIN (Seq=y)       服务端 → 客户端   「我这���也没有数据了」（可以和 2 合并，但通常分开）
 *   4) ACK (ACKnum=y+1)  客户端 → 服务端   「收到你的 FIN」
 *
 * 为什么需要 2×MSL 的 TIMED_WAIT：
 *  - 保证最后一个 ACK 能到达对方（对方重传的 FIN 还能被确认）
 *  - 让本连接在这个 TIME_WAIT 期间的所有「迷途报文」（duplicate segment）在网络中消散，
 *    避免它们被下一个使用相同 4 元组的新连接错误接收。
 */

type Side = '客户端' | '服务端'

interface TStep {
  n: number
  title: string
  detail: string
  cState: string
  sState: string
  wire?: string
  from?: Side
  tone: 'info' | 'ok' | 'warn'
}

export default function TeardownDemo() {
  const [clientSeq, setClientSeq] = useState(200)
  const [serverSeq, setServerSeq] = useState(700)
  const [combine, setCombine] = useState(false)
  const [showTmsl, setShowTmsl] = useState(false)

  const steps = useMemo<TStep[]>(() => {
    const out: TStep[] = []
    out.push({
      n: 1,
      title: `① 客户端发送 FIN：FIN=1, Seq=${clientSeq}`,
      detail: `客户端调用 close()，进入 FIN_WAIT_1，发出带 FIN 位的报文段。FIN 占用 1 个序号，所以服务端确认时要用 ACKnum=${clientSeq + 1}。`,
      cState: 'FIN_WAIT_1',
      sState: 'ESTABLISHED',
      wire: `FIN=1, Seq=${clientSeq}`,
      from: '客户端',
      tone: 'info',
    })
    out.push({
      n: 2,
      title: `② 服务端回复 ACK：ACK=1, ACKnum=${clientSeq + 1}`,
      detail: `服务端收到 FIN 后进入 CLOSE_WAIT 并立即确认。客户端收到这个 ACK 后进入 FIN_WAIT_2。注意此时服务端还可以继续发送数据（半关闭状态：它不能发，但还能收）。`,
      cState: 'FIN_WAIT_2',
      sState: 'CLOSE_WAIT',
      wire: `ACK=1, ACKnum=${clientSeq + 1}`,
      from: '服务端',
      tone: 'info',
    })
    if (combine) {
      out.push({
        n: 3,
        title: `③ 服务端的 ACK 与 FIN 合并：FIN=1, ACK=1, Seq=${serverSeq}, ACKnum=${clientSeq + 1}`,
        detail: `服务端的应用关闭后，把对客户端 FIN 的确认和自己的 FIN 放在同一个报文段里发出——这就是「三次挥手」（TCP 的 RST 场景）。`,
        cState: 'FIN_WAIT_2',
        sState: 'LAST_ACK',
        wire: `FIN=1, ACK=1, Seq=${serverSeq}, ACKnum=${clientSeq + 1}`,
        from: '服务端',
        tone: 'info',
      })
    } else {
      out.push({
        n: 3,
        title: `③ 服务端发送自己的 FIN：FIN=1, Seq=${serverSeq}`,
        detail: `服务端的应用处理完剩余数据后调用 close()，进入 LAST_ACK，发出自己的 FIN（序号 ${serverSeq}）。`,
        cState: 'FIN_WAIT_2',
        sState: 'LAST_ACK',
        wire: `FIN=1, Seq=${serverSeq}`,
        from: '服务端',
        tone: 'info',
      })
    }
    out.push({
      n: 4,
      title: `④ 客户端回复 ACK：ACK=1, ACKnum=${serverSeq + 1}`,
      detail: `客户端收到服务端的 FIN 后进入 TIMED_WAIT 并发出最后一个 ACK。服务端收到这个 ACK 后进入 CLOSED，连接彻底关闭。客户端还要在 TIMED_WAIT 中等待 2×MSL。`,
      cState: 'TIMED_WAIT',
      sState: 'CLOSED',
      wire: `ACK=1, ACKnum=${serverSeq + 1}`,
      from: '客户端',
      tone: 'ok',
    })
    return out
  }, [clientSeq, serverSeq, combine])

  const machine = useStepMachine(
    steps.map((s) => ({ label: s.title, detail: s.detail })),
    { intervalMs: 1700 },
  )
  const applied = Math.min(machine.index, steps.length)
  const current = applied > 0 ? steps[applied - 1] : null
  const next = applied < steps.length ? steps[applied] : null

  const cState = current?.cState ?? 'ESTABLISHED'
  const sState = current?.sState ?? 'ESTABLISHED'

  const C_FLOW = ['ESTABLISHED', 'FIN-WAIT-1', 'FIN-WAIT-2', 'TIMED-WAIT', 'CLOSED']
  const S_FLOW = ['ESTABLISHED', 'CLOSE-WAIT', 'LAST-ACK', 'CLOSED']

  /** 状态图（SVG）：画出两个状态机，当前状态高亮 */
  function StateGraph({
    title,
    flow,
    cur,
    accent,
    y,
    label,
  }: {
    title: string
    flow: string[]
    cur: string
    accent: string
    y: number
    label: string
  }) {
    const W = 420
    const boxW = 74
    const gap = (W - 20 - flow.length * boxW) / (flow.length - 1)
    const x0 = 10
    return (
      <g>
        <text x={10} y={y - 12} fontSize={9} fill={accent} fontWeight={600}>
          {title}
        </text>
        {flow.map((s, i) => {
          const x = x0 + i * (boxW + gap)
          const on = s === cur
          return (
            <g key={s}>
              <rect
                x={x}
                y={y}
                width={boxW}
                height={26}
                rx={5}
                fill={on ? accent : 'var(--surface)'}
                stroke={on ? accent : 'var(--border)'}
                strokeWidth={on ? 2 : 1}
              />
              <text
                x={x + boxW / 2}
                y={y + 16}
                textAnchor="middle"
                fontSize={8}
                fontFamily="ui-monospace, monospace"
                fill={on ? '#fff' : 'var(--text-muted)'}
              >
                {s}
              </text>
              {i < flow.length - 1 && (
                <line
                  x1={x + boxW + 2}
                  y1={y + 13}
                  x2={x + boxW + gap - 2}
                  y2={y + 13}
                  stroke="var(--border)"
                  strokeWidth={1}
                  markerEnd="url(#arr)"
                />
              )}
            </g>
          )
        })}
        <text x={W - 10} y={y + 17} textAnchor="end" fontSize={8} fill="var(--text-muted)">
          {label}
        </text>
      </g>
    )
  }

  return (
    <DemoFrame
      title="TCP 四次挥手：两个方向各自关闭"
      description="TCP 是全双工的，每个方向要单独关闭，所以需要 FIN / ACK / FIN / ACK 四个报文段。客户端最后要在 TIMED_WAIT 中等待 2×MSL。"
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
        { color: '#dc7828', label: 'FIN / 关闭相关报文' },
      ]}
    >
      <div className="space-y-4">
        {/* 参数 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ParamSlider
            label="客户端 FIN 的序号"
            value={clientSeq}
            onChange={(v) => {
              setClientSeq(v)
              machine.reset()
            }}
            min={0}
            max={999}
          />
          <ParamSlider
            label="服务端 FIN 的序号"
            value={serverSeq}
            onChange={(v) => {
              setServerSeq(v)
              machine.reset()
            }}
            min={0}
            max={999}
          />
          <div className="flex items-end">
            <ParamToggle
              label="把服务端的 ACK 与 FIN 合并"
              value={combine}
              onChange={(v) => {
                setCombine(v)
                machine.reset()
              }}
              hint="合并后就是「三次挥手」。"
            />
          </div>
          <div className="flex items-end">
            <ParamToggle
              label="展开 TIMED_WAIT 的 2×MSL 说明"
              value={showTmsl}
              onChange={setShowTmsl}
            />
          </div>
        </div>

        {/* 状态图 */}
        <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold mb-2">连接状态图</div>
          <svg viewBox="0 0 420 108" width="100%" style={{ display: 'block' }} role="img">
            <defs>
              <marker id="arr" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill="var(--border)" />
              </marker>
            </defs>
            <StateGraph title="客户端状态" flow={C_FLOW} cur={cState} accent="var(--brand)" y={20} label="主动关闭方" />
            <StateGraph title="服务端状态" flow={S_FLOW} cur={sState} accent="#16a078" y={72} label="被动关闭方" />
          </svg>
        </div>

        {/* 线上报文 */}
        <div
          className="rounded-lg px-3 py-2.5 text-xs mono flex items-center justify-between gap-3 flex-wrap"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <span className="muted">线上报文</span>
          <span
            className="font-semibold"
            style={{ color: current ? (current.tone === 'ok' ? '#16a078' : current.from === '客户端' ? 'var(--brand)' : '#dc7828') : 'var(--text-muted)' }}
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

        {/* 报文列表 */}
        <div>
          <div className="text-xs font-semibold mb-1.5">四个报文段</div>
          <ol className="space-y-1">
            {steps.map((s, i) => (
              <li
                key={s.n}
                className="rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed"
                style={{
                  background: i < applied ? 'var(--surface-2)' : 'transparent',
                  border: `1px solid ${i === applied ? 'var(--brand)' : 'var(--border)'}`,
                  opacity: i < applied ? 1 : 0.55,
                }}
              >
                <span className="font-semibold">{s.title}</span>
                <span className="muted"> — {s.detail}</span>
                <div className="muted text-[10px] mt-0.5">
                  客户端 → {s.cState} · 服务端 → {s.sState}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <ResultGrid
          items={[
            { label: '客户端状态', value: cState, highlight: true },
            { label: '服务端状态', value: sState, highlight: true },
            {
              label: '挥手报文数',
              value: combine ? '3 个（ACK+FIN 合并）' : '4 个',
              hint: 'TCP 全双工，两个方向各关一次',
            },
            {
              label: '客户端最后一个状态',
              value: 'TIMED_WAIT',
              hint: '等待 2×MSL',
            },
          ]}
        />

        {/* 状态说明表 */}
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ color: 'var(--text-muted)' }} className="text-left">
                <th className="py-1 pr-2 font-normal">状态</th>
                <th className="py-1 pr-2 font-normal">属方</th>
                <th className="py-1 pr-2 font-normal">含义</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['FIN_WAIT_1', '客户端', '已发出自己的 FIN，等待对方对自己 FIN 的 ACK'],
                ['FIN_WAIT_2', '客户端', '已收到对自己 FIN 的 ACK，等待对方也发来 FIN'],
                ['TIMED_WAIT', '客户端', '已收到对方的 FIN 并回了 ACK；等待 2×MSL 后才关闭'],
                ['CLOSE_WAIT', '服务端', '已收到对方的 FIN 并回了 ACK，但本端还可以继续发送数据'],
                ['LAST_ACK', '服务端', '已发出自己的 FIN，等待对方的最后一个 ACK'],
                ['CLOSED', '双方', '连接彻底关闭，4 元组可以被复用'],
              ].map(([st, side, mean]) => (
                <tr key={st} style={{ borderTop: '1px solid var(--border)' }}>
                  <td className="py-1 pr-2 mono font-semibold">{st}</td>
                  <td className="py-1 pr-2 muted">{side}</td>
                  <td className="py-1 pr-2">{mean}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showTmsl && (
          <div className="space-y-2">
            <StepNote
              tone="warn"
              text={`为什么客户端要在 TIMED_WAIT 里等 2×MSL（MSL = Maximum Segment Lifetime，报文段最大寿命，RFC 793 规定为 2 分钟）？两个原因：`}
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold mb-1.5">原因 1：保证最后一个 ACK 能到达</div>
                <div className="text-[11px] leading-relaxed">
                  最后一个 ACK 是不可靠的。如果它丢了，服务端会重传 FIN。此时客户端若已关闭，就无法再回 ACK，
                  服务端会一直卡在 LAST_ACK。留在 TIMED_WAIT 中，客户端还能对重传的 FIN 再次回 ACK。
                </div>
              </div>
              <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
                <div className="text-xs font-semibold mb-1.5">原因 2：让迷途报文消散</div>
                <div className="text-[11px] leading-relaxed">
                  连接关闭前可能还有「迷途报文」在网络中飞行。如果立刻用相同的 4 元组（IP + 端口）建立新连接，
                  这些旧报文可能被新连接错误接收。等待 2×MSL 保证旧报文全部过期消失。
                </div>
              </div>
            </div>
          </div>
        )}

        <StepNote
          tone="info"
          text={`TCP 是全双工的：每个方向的数据流要单独关闭，所以「关闭」不是一个动作而是两个。客户端发 FIN 后进入 FIN_WAIT_1 → FIN_WAIT_2 → TIMED_WAIT → CLOSED；服务端在 CLOSE_WAIT 时<b>还能继续发送数据</b>（它只是不能主动发起关闭），这正是 TIME_WAIT 存在的价值所在。`}
        />
      </div>
    </DemoFrame>
  )
}
