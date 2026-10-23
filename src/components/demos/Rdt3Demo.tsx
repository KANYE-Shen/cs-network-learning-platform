import { useMemo, useState } from 'react'
import { DemoFrame, ParamSelect, ParamSlider, PlayControls, ResultGrid, StepNote, useStepMachine } from './DemoKit'

/**
 * rdt3.0：信道会出错也会丢包。
 * 新增机制：
 *  - 发送方为每个在途分组启动一个倒计时器（超时则重传）
 *  - 分组带 0/1 序号；ACK 也必须显式带上被确认分组的序号
 *  - 若只是延迟（而非丢失）导致的重传，接收方靠序号识别重复分组并丢弃
 */

type ErrKind = 'none' | 'data' | 'dropData' | 'dropAck' | 'delayAck'

interface Ev {
  kind: 'send' | 'ack' | 'timeout' | 'retransmit' | 'dup' | 'deliver'
  seq: number
  text: string
  detail: string
  timer?: number
  tone: 'info' | 'ok' | 'warn'
}

interface SimOut {
  events: Ev[]
  delivered: string[]
  dupDropped: number
  retransmissions: number
  rttMs: number
}

/** 一次完整的 rdt3.0 传输：两个分组，各经历若干轮次 */
function simulate(err: ErrKind, timeoutMs: number, rttMs: number): SimOut {
  const events: Ev[] = []
  const delivered: string[] = []
  let dupDropped = 0
  let retransmissions = 0
  let t = 0

  const data = ['data0', 'data1']
  // 接收方当前期望的序号（运行状态）：收到并交付 seq 0 后期望 1，收到 seq 1 后期望 0
  let rcvExpected = 0

  for (let idx = 0; idx < data.length; idx++) {
    const seq = idx % 2
    let attempt = 0
    let acked = false
    let guard = 0
    // 接收方期望的序号：交替 0/1
    while (!acked && guard++ < 8) {
      attempt++
      const isRetx = attempt > 1
      const corruptThis = err === 'data' && attempt === 1
      const dropThis = err === 'dropData' && attempt === 1
      const dropAckThis = err === 'dropAck' && attempt === 1
      const delayAckThis = err === 'delayAck' && attempt === 1

      events.push({
        kind: isRetx ? 'retransmit' : 'send',
        seq,
        text: isRetx
          ? `重传 DATA(seq=${seq}, ${data[idx]})`
          : `发送 DATA(seq=${seq}, ${data[idx]})`,
        detail: isRetx
          ? `倒计时器超时，发送方重新发送当前分组（重传次数 +1）。`
          : corruptThis
            ? '数据分组的比特被翻转。'
            : dropThis
              ? '数据分组在信道中被丢弃（丢包）。'
              : '分组进入信道。',
        timer: timeoutMs,
        tone: isRetx ? 'warn' : 'info',
      })
      if (isRetx) retransmissions++
      t += 1

      if (corruptThis) {
        // 接收方检测到比特错误 → 回 NAK（rdt3.0 中 ACK/NAK 都可带序号）
        events.push({
          kind: 'ack',
          seq,
          text: `收到 NAK(seq=${seq})`,
          detail: '接收方校验和检查失败，知道分组序号，回送 NAK 请求重传。',
          timer: timeoutMs,
          tone: 'warn',
        })
        t += 1
        continue
      }

      if (dropThis) {
        events.push({
          kind: 'timeout',
          seq,
          text: `超时：DATA(seq=${seq}) 的 ACK 未在 ${timeoutMs} ms 内到达`,
          detail: '发送方倒计时器到期，判定分组丢失 → 重传。',
          timer: 0,
          tone: 'warn',
        })
        continue
      }

      // 接收方收到分组：用运行状态判断是「新分组」还是「重复副本」
      if (seq !== rcvExpected) {
        dupDropped++
        events.push({
          kind: 'dup',
          seq,
          text: `收到重复分组 DATA(seq=${seq}) → 丢弃`,
          detail: `接收方当前期望 seq=${rcvExpected}，收到的是已交付过的分组副本 → 不重复交付给上层。`,
          timer: timeoutMs,
          tone: 'warn',
        })
      } else {
        delivered.push(data[idx])
        rcvExpected = 1 - rcvExpected
        events.push({
          kind: 'deliver',
          seq,
          text: `收到 DATA(seq=${seq}) → 交付上层应用`,
          detail: `序号匹配，交付 ${data[idx]} 给上层应用。`,
          timer: timeoutMs,
          tone: 'ok',
        })
      }

      if (dropAckThis) {
        events.push({
          kind: 'timeout',
          seq,
          text: `超时：ACK(seq=${seq}) 在信道中被丢弃`,
          detail: '接收方其实已经收到并交付了数据，但 ACK 丢失 → 发送方超时重传。',
          timer: 0,
          tone: 'warn',
        })
        continue
      }

      if (delayAckThis) {
        // ACK 只是迟到（不是丢失）：发送方会超时重传，重传副本被接收方按序号丢弃
        events.push({
          kind: 'timeout',
          seq,
          text: `超时：ACK(seq=${seq}) 延迟到达（超过 ${timeoutMs} ms）`,
          detail: 'ACK 只是迟到而非丢失。发送方超时重传，接收方靠序号识别重复分组 → 不会重复交付。',
          timer: 0,
          tone: 'warn',
        })
        // 迟到的 ACK 到达时，发送方已经超时重传过了，这个 ACK 已经过时
        events.push({
          kind: 'ack',
          seq,
          text: `迟到的 ACK(seq=${seq}) 到达（已过时）`,
          detail: '发送方早已超时重传，这个迟到的 ACK 到达时分组已经被确认过了。',
          timer: timeoutMs,
          tone: 'info',
        })
        // 继续循环 → 下一轮 attempt 就是重传，重传副本到达接收方时会被按序号丢弃
        continue
      }

      events.push({
        kind: 'ack',
        seq,
        text: `收到 ACK(seq=${seq})`,
        detail: '发送方停表，推进到下一个分组。',
        timer: 0,
        tone: 'ok',
      })
      acked = true
      t += 1
    }
  }

  return { events, delivered, dupDropped, retransmissions, rttMs }
}

export default function Rdt3Demo() {
  const [err, setErr] = useState<ErrKind>('none')
  const [timeoutMs, setTimeoutMs] = useState(200)
  const [rttMs, setRttMs] = useState(100)

  const sim = useMemo(() => simulate(err, timeoutMs, rttMs), [err, timeoutMs, rttMs])
  const machine = useStepMachine(
    sim.events.map((e) => ({ label: e.text, detail: e.detail })),
    { intervalMs: 1100 },
  )

  const applied = Math.min(machine.index, sim.events.length)
  const current = applied > 0 ? sim.events[applied - 1] : null
  const next = applied < sim.events.length ? sim.events[applied] : null

  // 倒计时器可视化：当前是否有一个在途分组在计时
  const timerActive = current?.timer !== undefined && current.timer > 0

  // 已完成的交付 / 重复丢弃
  const deliveredSoFar = sim.events.slice(0, applied).filter((e) => e.kind === 'deliver').length
  const dupSoFar = sim.events.slice(0, applied).filter((e) => e.kind === 'dup').length
  const retxSoFar = sim.events.slice(0, applied).filter((e) => e.kind === 'retransmit').length

  // 理论利用率：stop-and-wait 的 U = (L/R) / (L/R + 2*RTT + timeout)
  const transmissionMs = 8 // 假定 8000 bit / 1 Gbps ≈ 8 µs，这里放大为 8 ms 便于观察
  const utilization =
    (transmissionMs / (transmissionMs + 2 * rttMs + (timeoutMs > rttMs ? timeoutMs : rttMs))) * 100

  return (
    <DemoFrame
      title="rdt3.0：丢包、超时与重传"
      description="发送方为每个在途分组启动倒计时器，超时即重传。分组与 ACK 都带 0/1 序号，因此「延迟而非丢失」导致的重传不会造成重复交付。"
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
        { color: 'var(--brand)', label: '正常发送' },
        { color: '#16a078', label: '成功交付 / 确认' },
        { color: '#dc7828', label: '丢包 / 超时 / 重复' },
      ]}
    >
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ParamSelect
            label="注入故障"
            value={err}
            onChange={(v) => {
              setErr(v as ErrKind)
              machine.reset()
            }}
            options={[
              { value: 'none', label: '无故障（只有延迟）' },
              { value: 'data', label: '数据分组比特翻转 → NAK' },
              { value: 'dropData', label: '数据分组丢失 → 超时' },
              { value: 'dropAck', label: 'ACK 丢失 → 超时重传' },
              { value: 'delayAck', label: 'ACK 延迟 → 超时重传（重复）' },
            ]}
          />
          <ParamSlider
            label="超时定时器 TimeoutInterval"
            value={timeoutMs}
            onChange={(v) => {
              setTimeoutMs(v)
              machine.reset()
            }}
            min={50}
            max={500}
            step={10}
            unit="ms"
            hint="定时器长度应略大于 RTT，否则会「过早超时」造成无谓重传。"
          />
          <ParamSlider
            label="往返时延 RTT"
            value={rttMs}
            onChange={(v) => {
              setRttMs(v)
              machine.reset()
            }}
            min={20}
            max={400}
            step={10}
            unit="ms"
            hint="单向传播时延的 2 倍（简化模型）。"
          />
        </div>

        {/* 定时器可视化 */}
        <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-semibold">发送方倒计时器（每个在途分组一个）</div>
            <div className="text-[11px] mono muted">TimeoutInterval = {timeoutMs} ms</div>
          </div>
          <div className="h-4 rounded-full overflow-hidden relative" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            {timerActive ? (
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all"
                style={{
                  width: '100%',
                  background:
                    current?.kind === 'timeout' ? 'rgba(220,120,40,0.85)' : 'color-mix(in srgb, var(--brand) 75%, transparent)',
                }}
              />
            ) : (
              <div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: '0%', background: 'var(--border)' }}
              />
            )}
          </div>
          <div className="flex justify-between text-[10px] mono muted mt-1">
            <span>启动定时器</span>
            <span>超时 → 重传</span>
          </div>
          {rttMs > timeoutMs && (
            <div className="text-[11px] mt-1.5" style={{ color: '#dc7828' }}>
              ⚠ RTT ({rttMs} ms) &gt; TimeoutInterval ({timeoutMs} ms)：定时器会在 ACK 回来之前就到期，导致无谓的重传。
            </div>
          )}
        </div>

        {/* 事件流 */}
        <div>
          <div className="text-xs font-semibold mb-1.5">事件时间线</div>
          <ol className="space-y-1 max-h-80 overflow-y-auto pr-1">
            {sim.events.map((e, i) => (
              <li
                key={i}
                className="rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed flex items-start gap-2"
                style={{
                  background: i < applied ? 'var(--surface-2)' : 'transparent',
                  border: `1px solid ${i === applied ? 'var(--brand)' : 'var(--border)'}`,
                  opacity: i < applied ? 1 : 0.55,
                }}
              >
                <span className="mono muted shrink-0 w-12">{i + 1}.</span>
                <span className="mono font-semibold shrink-0" style={{ color: e.tone === 'warn' ? '#dc7828' : e.tone === 'ok' ? '#16a078' : 'var(--brand)' }}>
                  {e.text}
                </span>
                <span className="muted hidden sm:inline">{e.detail}</span>
              </li>
            ))}
          </ol>
        </div>

        <StepNote
          tone={current ? current.tone : 'info'}
          text={
            current
              ? `${current.text} —— ${current.detail}`
              : next
                ? `下一步：${next.text} —— ${next.detail}`
                : '点击「单步」或「播放」开始。'
          }
        />

        <ResultGrid
          items={[
            { label: '已交付上层', value: `${deliveredSoFar} / 2 组`, highlight: true },
            { label: '重复分组被丢弃', value: `${dupSoFar} 个`, hint: '序号机制保证了不重复交付' },
            { label: '重传次数', value: `${retxSoFar} 次`, hint: retxSoFar > 0 ? '因丢包/超时' : '无' },
            { label: 'stop-and-wait 利用率', value: `${utilization.toFixed(1)}%`, hint: 'rdt3.0 正确但效率低' },
          ]}
        />

        <StepNote
          tone={retxSoFar > 0 ? 'warn' : 'info'}
          text={
            retxSoFar > 0
              ? `本次传输共重传 ${retxSoFar} 次。关键在于：即使重传的分组是「重复」的，接收方也因为序号不匹配而<b>不会</b>再次交付给上层应用——所以 rdt3.0 是可靠的。`
              : `rdt3.0 是 stop-and-wait：发送方发一个分组就停下来等 ACK，链路利用率很低。带宽利用率 = (L/R) / (L/R + 2·RTT + 超时时间)。`
          }
        />
      </div>
    </DemoFrame>
  )
}
