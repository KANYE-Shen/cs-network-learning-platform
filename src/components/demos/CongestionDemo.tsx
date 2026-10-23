import { useMemo, useState } from 'react'
import {
  DemoFrame,
  ParamSelect,
  ParamSlider,
  PlayControls,
  ResultGrid,
  StepNote,
  useStepMachine,
} from './DemoKit'

/**
 * TCP 拥塞控制（PPT 第 98-106 页）。
 *
 * 四个阶段（教材 FSM）：
 *  1) 慢启动 slow start：      cwnd < ssthresh，cwnd 每 RTT 翻倍（指数增长）
 *  2) 拥塞避免 congestion avoidance：cwnd ≥ ssthresh，cwnd += MSS²/cwnd（每 RTT 约 +1 MSS，线性增长）
 *  3) 快重传 + 快恢复 fast recovery：收到 3 个重复 ACK 时
 *       ssthresh = cwnd/2;  cwnd = ssthresh + 3·MSS
 *     之后每收到一个重复 ACK 再 cwnd += 1·MSS；收到被重传分段的确认（新 ACK）时 cwnd = ssthresh
 *  4) 超时 timeout：ssthresh = cwnd/2;  cwnd = 1·MSS;  dupACKcount = 0 → 回到慢启动
 *
 * ⚠ 教学简化模型：真实 Linux 使用 CUBIC / BBR 等算法，且 ssthresh、cwnd 的粒度、
 *   恢复细节与此处并不完全一致。本演示用于建立「四个阶段 + cwnd 曲线」的整体直觉。
 */

type Phase = 'slow-start' | 'congestion-avoidance' | 'fast-recovery'

const PHASE_META: Record<Phase, { label: string; color: string; desc: string }> = {
  'slow-start': {
    label: '慢启动 Slow Start',
    color: 'var(--brand)',
    desc: 'cwnd < ssthresh：cwnd 每 RTT 翻倍（指数增长），快速探测网络容量。',
  },
  'congestion-avoidance': {
    label: '拥塞避免 Congestion Avoidance',
    color: '#16a078',
    desc: 'cwnd ≥ ssthresh：cwnd += MSS²/cwnd，每 RTT 约 +1 MSS（线性增长），温和探测。',
  },
  'fast-recovery': {
    label: '快恢复 Fast Recovery',
    color: '#dc7828',
    desc: '3 个重复 ACK 触发快重传：ssthresh = cwnd/2，cwnd = ssthresh + 3·MSS，之后每个重复 ACK 再 +1·MSS。',
  },
}

const MSS_BYTES = 1460 // 典型以太网 MSS
const INITIAL_CWND_MSS = 1 // 初始拥塞窗口 = 1 MSS
const INITIAL_SSTHRESH_BYTES = 64 * 1024 // 教材初始 ssthresh = 64 KB

interface LossEvent {
  rtt: number
  type: 'dupack' | 'timeout'
}

interface Tick {
  rtt: number
  phaseBefore: Phase
  phaseAfter: Phase
  cwndBefore: number // MSS
  cwndAfter: number // MSS
  ssthresh: number // MSS
  title: string
  detail: string
  tone: 'info' | 'ok' | 'warn'
  event?: 'fast-retransmit' | 'timeout' | 'fr-dupack' | 'fr-newack'
}

interface SimOut {
  ticks: Tick[]
  cwndPts: { rtt: number; cwnd: number; phase: Phase }[]
  ssthreshPts: { rtt: number; value: number }[]
  maxCwnd: number
}

function simulate(lossPlan: LossEvent[], duration: number): SimOut {
  let c = INITIAL_CWND_MSS // cwnd，单位 MSS
  let ssthresh = INITIAL_SSTHRESH_BYTES / MSS_BYTES // 单位 MSS
  let phase: Phase = 'slow-start'
  let frTicks = 0
  let dupCount = 0

  const ticks: Tick[] = []
  const cwndPts: { rtt: number; cwnd: number; phase: Phase }[] = [
    { rtt: 0, cwnd: c, phase },
  ]
  const ssthreshPts: { rtt: number; value: number }[] = [{ rtt: 0, value: ssthresh }]
  let maxCwnd = c

  for (let rtt = 1; rtt <= duration; rtt++) {
    const phaseBefore = phase
    const cwndBefore = c
    let title = ''
    let detail = ''
    let tone: Tick['tone'] = 'info'
    let event: Tick['event']

    const loss = lossPlan.find((l) => l.rtt === rtt)

    if (loss?.type === 'timeout') {
      // 超时：最严厉的拥塞信号
      ssthresh = Math.max(cwndBefore / 2, 2)
      c = 1
      phase = 'slow-start'
      dupCount = 0
      frTicks = 0
      event = 'timeout'
      title = `超时：ssthresh = ${ssthresh.toFixed(2)} MSS，cwnd = 1 MSS，回到慢启动`
      detail = `超时意味着「网络很可能严重拥塞」，必须大幅退避：ssthresh 减半（${cwndBefore.toFixed(2)} → ${ssthresh.toFixed(2)}），cwnd 直接砍到 1 MSS，然后重新慢启动。`
      tone = 'warn'
    } else if (loss?.type === 'dupack') {
      // 3 个重复 ACK：快重传 + 快恢复
      ssthresh = Math.max(cwndBefore / 2, 2)
      c = ssthresh + 3
      phase = 'fast-recovery'
      dupCount = 3
      frTicks = 0
      event = 'fast-retransmit'
      title = `3 个重复 ACK：快重传，ssthresh = ${ssthresh.toFixed(2)}，cwnd = ssthresh + 3·MSS = ${c.toFixed(2)}`
      detail = `重复 ACK 说明「只是个别分段丢失，网络并没有严重拥塞」。因此 ssthresh 只减半（${cwndBefore.toFixed(2)} → ${ssthresh.toFixed(2)}），而 cwnd 只退到 ssthresh + 3·MSS（而不是 1 MSS），这样能立刻继续发送。`
      tone = 'warn'
    } else if (phase === 'fast-recovery') {
      frTicks++
      if (frTicks === 1) {
        // 恢复期间又收到一个重复 ACK
        c = cwndBefore + 1
        event = 'fr-dupack'
        title = `快恢复中：又收到 1 个重复 ACK，cwnd += 1·MSS = ${c.toFixed(2)}`
        detail = `在快恢复阶段，每多一个重复 ACK 说明又有一个后续分段越过了缺口，发送方可以再多发 1 个 MSS 的新数据。`
        tone = 'info'
      } else {
        // 被重传分段的确认终于到达 → 退出快恢复
        c = ssthresh
        phase = 'congestion-avoidance'
        dupCount = 0
        event = 'fr-newack'
        title = `收到新 ACK：cwnd = ssthresh = ${c.toFixed(2)}，退出快恢复`
        detail = `被重传的分段终于被确认，缺口已填补。发送方把 cwnd 收缩回 ssthresh，并进入拥塞避免阶段（因为 cwnd = ssthresh 满足 cwnd ≥ ssthresh）。`
        tone = 'ok'
      }
    } else if (phase === 'slow-start') {
      c = cwndBefore * 2
      if (c >= ssthresh) {
        phase = 'congestion-avoidance'
        title = `慢启动：cwnd ${cwndBefore.toFixed(2)} → ${c.toFixed(2)} MSS（翻倍），已 ≥ ssthresh，转入拥塞避免`
        detail = `慢启动期间每收到一个 ACK 就把 cwnd 加 1 个 MSS，一个 RTT 内有 cwnd 个 ACK 到达，于是 cwnd 翻倍：${cwndBefore.toFixed(2)} → ${c.toFixed(2)}。现在 cwnd ≥ ssthresh（${ssthresh.toFixed(2)}），切换到线性增长。`
        tone = 'info'
      } else {
        title = `慢启动：cwnd ${cwndBefore.toFixed(2)} → ${c.toFixed(2)} MSS（翻倍）`
        detail = `cwnd（${cwndBefore.toFixed(2)}）< ssthresh（${ssthresh.toFixed(2)}），继续指数增长：每个 ACK 加 1 MSS，一个 RTT 内翻倍。`
        tone = 'info'
      }
    } else {
      // 拥塞避免：cwnd += MSS²/cwnd，每 RTT 约 +1 MSS
      c = cwndBefore + 1 / cwndBefore
      title = `拥塞避免：cwnd ${cwndBefore.toFixed(2)} → ${c.toFixed(2)} MSS（+1/cwnd ≈ +1 MSS/RTT）`
      detail = `规则 cwnd += MSS²/cwnd：每收到一个 ACK 加 MSS²/cwnd，一个 RTT 内共加约 1 个 MSS。增长是<b>线性</b>的——慢启动是指数增长，这里是温和探测。`
      tone = 'info'
    }

    maxCwnd = Math.max(maxCwnd, c)
    ticks.push({
      rtt,
      phaseBefore,
      phaseAfter: phase,
      cwndBefore,
      cwndAfter: c,
      ssthresh: ssthresh,
      title,
      detail,
      tone,
      event,
    })
    cwndPts.push({ rtt, cwnd: c, phase })
    ssthreshPts.push({ rtt, value: ssthresh })
  }

  return { ticks, cwndPts, ssthreshPts, maxCwnd }
}

export default function CongestionDemo() {
  const [duration, setDuration] = useState(20)
  const [lossPlan, setLossPlan] = useState<LossEvent[]>([{ rtt: 8, type: 'dupack' }])

  const sim = useMemo(() => simulate(lossPlan, duration), [lossPlan, duration])

  const machine = useStepMachine(
    sim.ticks.map((t) => ({ label: t.title, detail: t.detail })),
    { intervalMs: 900 },
  )
  const applied = Math.min(machine.index, sim.ticks.length)
  const current = applied > 0 ? sim.ticks[applied - 1] : null
  const next = applied < sim.ticks.length ? sim.ticks[applied] : null

  const phase: Phase = current ? current.phaseAfter : 'slow-start'
  const cwndMss = current ? current.cwndAfter : INITIAL_CWND_MSS
  const ssthreshMss = current ? current.ssthresh : INITIAL_SSTHRESH_BYTES / MSS_BYTES

  const nextRtt = applied + 1

  const inject = (type: LossEvent['type'], rtt: number) => {
    if (rtt > duration) return
    setLossPlan((p) => [...p.filter((l) => l.rtt !== rtt), { rtt, type }].sort((a, b) => a.rtt - b.rtt))
  }

  const clearLoss = () => setLossPlan([])

  /* ---------------- 图表 ---------------- */
  const chart = useMemo(() => {
    const W = 420
    const H = 232
    const pad = { l: 46, r: 14, t: 16, b: 30 }
    const iw = W - pad.l - pad.r
    const ih = H - pad.t - pad.b
    const ymax = Math.max(sim.maxCwnd * 1.12, 8)
    const x = (rtt: number) => pad.l + (rtt / duration) * iw
    const y = (c: number) => pad.t + ih - (c / ymax) * ih
    const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * ymax)
    return { W, H, pad, iw, ih, ymax, x, y, yTicks }
  }, [sim.maxCwnd, duration])

  /** cwnd 折线：每段按当时的阶段着色 */
  const cwndSegments = useMemo(() => {
    const out: { x1: number; y1: number; x2: number; y2: number; color: string; phase: Phase }[] = []
    for (let i = 0; i < sim.cwndPts.length - 1; i++) {
      const a = sim.cwndPts[i]
      const b = sim.cwndPts[i + 1]
      const segPhase = b.phase
      out.push({
        x1: chart.x(a.rtt),
        y1: chart.y(a.cwnd),
        x2: chart.x(b.rtt),
        y2: chart.y(b.cwnd),
        color: PHASE_META[segPhase].color,
        phase: segPhase,
      })
    }
    return out
  }, [sim.cwndPts, chart])

  /** ssthresh 阶梯线 */
  const ssthreshPath = useMemo(() => {
    if (sim.ssthreshPts.length === 0) return ''
    let d = ''
    let prev = sim.ssthreshPts[0]
    d += `M${chart.x(prev.rtt).toFixed(1)},${chart.y(prev.value).toFixed(1)}`
    for (let i = 1; i < sim.ssthreshPts.length; i++) {
      const cur = sim.ssthreshPts[i]
      d += ` L${chart.x(cur.rtt).toFixed(1)},${chart.y(prev.value).toFixed(1)}`
      if (cur.value !== prev.value) {
        d += ` L${chart.x(cur.rtt).toFixed(1)},${chart.y(cur.value).toFixed(1)}`
      }
      prev = cur
    }
    d += ` L${chart.x(duration).toFixed(1)},${chart.y(prev.value).toFixed(1)}`
    return d
  }, [sim.ssthreshPts, chart, duration])

  const lossMarks = useMemo(
    () =>
      lossPlan
        .filter((l) => l.rtt <= applied)
        .map((l) => ({
          ...l,
          cx: chart.x(l.rtt),
          cy: chart.y(sim.cwndPts.find((p) => p.rtt === l.rtt)?.cwnd ?? 0),
        })),
    [lossPlan, applied, chart, sim.cwndPts],
  )

  const preset = useMemo(() => {
    const l = lossPlan[0]
    if (!l) return 'none'
    return `${l.type}-${l.rtt}`
  }, [lossPlan])

  const presetOptions = useMemo(() => {
    const opts = [{ value: 'none', label: '不注入丢包' }]
    for (const t of ['dupack', 'timeout'] as const) {
      for (const r of [4, 8, 12, 16]) {
        if (r <= duration) {
          opts.push({
            value: `${t}-${r}`,
            label: `第 ${r} 个 RTT：${t === 'dupack' ? '3 个重复 ACK（快重传）' : '超时'}`,
          })
        }
      }
    }
    return opts
  }, [duration])

  const applyPreset = (v: string) => {
    if (v === 'none') {
      clearLoss()
      return
    }
    const [type, rtt] = v.split('-')
    setLossPlan([{ rtt: Number(rtt), type: type as LossEvent['type'] }])
  }

  const cwndKB = (cwndMss * MSS_BYTES) / 1024
  const ssthreshKB = (ssthreshMss * MSS_BYTES) / 1024

  return (
    <DemoFrame
      title="TCP 拥塞控制：cwnd 随时间的四阶段变化"
      description="cwnd 决定发送方能塞进网络多少数据。慢启动指数增长 → 拥塞避免线性增长 → 3 个重复 ACK 快重传快恢复 → 超时退回慢启动。"
      controls={
        <>
          <PlayControls
            playing={machine.playing}
            onPlay={() => machine.setPlaying(true)}
            onPause={() => machine.setPlaying(false)}
            onReset={() => {
              clearLoss()
              machine.reset()
            }}
            onStep={machine.step}
            onStepBack={machine.stepBack}
            canStepBack
            speed={machine.speed}
            onSpeedChange={machine.setSpeed}
          />
        </>
      }
      legend={[
        { color: PHASE_META['slow-start'].color, label: '慢启动（指数增长）' },
        { color: PHASE_META['congestion-avoidance'].color, label: '拥塞避免（线性增长）' },
        { color: PHASE_META['fast-recovery'].color, label: '快恢复' },
      ]}
    >
      <div className="space-y-4">
        {/* 阶段说明 */}
        <div className="grid sm:grid-cols-3 gap-2">
          {(Object.keys(PHASE_META) as Phase[]).map((p) => {
            const m = PHASE_META[p]
            const on = phase === p
            return (
              <div
                key={p}
                className="rounded-lg px-3 py-2 transition-all"
                style={{
                  background: on ? `${m.color}1a` : 'var(--surface-2)',
                  border: `1px solid ${on ? m.color : 'var(--border)'}`,
                }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
                  <span className="text-[11px] font-semibold">{m.label}</span>
                </div>
                <div className="text-[10px] muted mt-1 leading-snug">{m.desc}</div>
              </div>
            )
          })}
        </div>

        {/* 参数与注入 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ParamSlider
            label="模拟时长"
            value={duration}
            onChange={(v) => {
              setDuration(v)
              setLossPlan((p) => p.filter((l) => l.rtt <= v))
            }}
            min={6}
            max={40}
            unit="个 RTT"
          />
          <ParamSelect
            label="预设丢包事件"
            value={preset}
            onChange={applyPreset}
            options={presetOptions}
            hint="也可以在播放过程中直接点击下方按钮注入。"
          />
          <div className="space-y-1.5">
            <div className="text-xs font-medium">立即注入（作用于第 {nextRtt} 个 RTT）</div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => inject('dupack', nextRtt)}
                disabled={nextRtt > duration}
                className="btn-outline !px-2 !py-1 !text-[11px]"
              >
                3 重复 ACK
              </button>
              <button
                onClick={() => inject('timeout', nextRtt)}
                disabled={nextRtt > duration}
                className="btn-outline !px-2 !py-1 !text-[11px]"
              >
                超时
              </button>
              <button onClick={clearLoss} className="btn-ghost !px-2 !py-1 !text-[11px]">
                清除
              </button>
            </div>
          </div>
          <div className="rounded-lg px-3 py-2 text-[10px] leading-relaxed" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="font-semibold text-[11px] mb-1">模型参数</div>
            <div className="mono">MSS = {MSS_BYTES} 字节</div>
            <div className="mono">初始 cwnd = 1 MSS</div>
            <div className="mono">初始 ssthresh = 64 KB ≈ {(INITIAL_SSTHRESH_BYTES / MSS_BYTES).toFixed(1)} MSS</div>
          </div>
        </div>

        {/* 图表 */}
        <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold mb-1.5">cwnd 与 ssthresh 随时间（RTT）的变化</div>
          <svg viewBox={`0 0 ${chart.W} ${chart.H}`} width="100%" style={{ display: 'block' }} role="img">
            {chart.yTicks.map((t, i) => (
              <g key={i}>
                <line
                  x1={chart.pad.l}
                  y1={chart.y(t)}
                  x2={chart.W - chart.pad.r}
                  y2={chart.y(t)}
                  stroke="var(--border)"
                  strokeWidth={1}
                />
                <text
                  x={chart.pad.l - 5}
                  y={chart.y(t) + 3}
                  textAnchor="end"
                  fontSize={8}
                  fill="var(--text-muted)"
                  fontFamily="ui-monospace, monospace"
                >
                  {t.toFixed(0)}
                </text>
              </g>
            ))}
            {/* x 轴刻度 */}
            {Array.from({ length: duration + 1 }, (_, rtt) => (
              <g key={`x${rtt}`}>
                <line
                  x1={chart.x(rtt)}
                  y1={chart.pad.t}
                  x2={chart.x(rtt)}
                  y2={chart.pad.t + chart.ih}
                  stroke="var(--border)"
                  strokeWidth={0.5}
                  opacity={0.5}
                />
                {rtt % Math.ceil(duration / 10) === 0 && (
                  <text
                    x={chart.x(rtt)}
                    y={chart.H - 12}
                    textAnchor="middle"
                    fontSize={8}
                    fill="var(--text-muted)"
                    fontFamily="ui-monospace, monospace"
                  >
                    {rtt}
                  </text>
                )}
              </g>
            ))}
            {/* ssthresh 阶梯线 */}
            <path d={ssthreshPath} fill="none" stroke="#dc7828" strokeWidth={1.5} strokeDasharray="5 3" opacity={0.85} />
            {/* cwnd 折线 */}
            {cwndSegments.map((s, i) => (
              <line
                key={i}
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
            ))}
            {/* 顶点 */}
            {sim.cwndPts.map((p, i) =>
              i <= applied ? (
                <circle key={i} cx={chart.x(p.rtt)} cy={chart.y(p.cwnd)} r={2.6} fill={PHASE_META[p.phase].color} />
              ) : null,
            )}
            {/* 丢包标记 */}
            {lossMarks.map((l) => (
              <g key={`${l.type}-${l.rtt}`}>
                <circle cx={l.cx} cy={l.cy} r={5.5} fill="none" stroke="#dc7828" strokeWidth={1.5} />
                <text x={l.cx} y={l.cy - 8} textAnchor="middle" fontSize={7.5} fill="#dc7828">
                  {l.type === 'dupack' ? '3dupACK' : 'timeout'}
                </text>
              </g>
            ))}
            {/* 坐标轴说明 */}
            <text x={chart.pad.l} y={chart.H - 2} fontSize={8} fill="var(--text-muted)">
              RTT →
            </text>
            <text
              x={10}
              y={chart.pad.t + 4}
              fontSize={8}
              fill="var(--text-muted)"
              transform={`rotate(-90 10 ${chart.pad.t + 4})`}
              textAnchor="end"
            >
              cwnd (个 MSS)
            </text>
            <text x={chart.W - chart.pad.r} y={chart.pad.t + 4} textAnchor="end" fontSize={8} fill="#dc7828">
              - - ssthresh
            </text>
          </svg>
          <div className="text-[10px] muted mt-1 leading-relaxed">
            纵轴单位是「个 MSS」（1 MSS = {MSS_BYTES} 字节）。橙色虚线是 ssthresh，曲线颜色表示所处阶段。
            曲线右端为尚未播放到的部分（不显示）。
          </div>
        </div>

        {/* 事件列表 */}
        <div>
          <div className="text-xs font-semibold mb-1.5">逐 RTT 过程</div>
          <ol className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {sim.ticks.map((t, i) => (
              <li
                key={t.rtt}
                className="rounded-lg px-2.5 py-1.5 text-[11px] leading-relaxed"
                style={{
                  background: i < applied ? 'var(--surface-2)' : 'transparent',
                  border: `1px solid ${i === applied ? 'var(--brand)' : 'var(--border)'}`,
                  opacity: i < applied ? 1 : 0.5,
                }}
              >
                <span className="mono muted">RTT {t.rtt} · </span>
                <span
                  className="font-semibold"
                  style={{ color: t.tone === 'warn' ? '#dc7828' : t.tone === 'ok' ? '#16a078' : 'var(--text)' }}
                >
                  {t.title}
                </span>
                <span className="muted"> — {t.detail.replace(/<\/?b>/g, '')}</span>
              </li>
            ))}
          </ol>
        </div>

        <StepNote
          tone={current ? current.tone : 'info'}
          text={
            current
              ? `RTT ${current.rtt}：${current.title} —— ${current.detail.replace(/<\/?b>/g, '')}`
              : next
                ? `下一步（RTT ${next.rtt}）：${next.title}`
                : '点击「播放」或「单步」开始。'
          }
        />

        <ResultGrid
          items={[
            { label: '当前 cwnd', value: `${cwndMss.toFixed(2)} MSS`, highlight: true, hint: `${cwndKB.toFixed(1)} KB` },
            { label: '当前 ssthresh', value: `${ssthreshMss.toFixed(2)} MSS`, hint: `${ssthreshKB.toFixed(1)} KB` },
            { label: '所处阶段', value: PHASE_META[phase].label, highlight: true },
            { label: '已模拟', value: `${applied} / ${duration} RTT` },
          ]}
        />

        <StepNote
          tone="info"
          text={`核心规则回顾：cwnd < ssthresh → 慢启动（每 RTT 翻倍）；cwnd ≥ ssthresh → 拥塞避免（每 RTT 加约 1 MSS）；3 个重复 ACK → ssthresh = cwnd/2、cwnd = ssthresh + 3·MSS；超时 → ssthresh = cwnd/2、cwnd = 1 MSS。快重传之所以比超时温和，正是因为它把 cwnd 从 1 MSS 一下拉回到 ssthresh + 3·MSS。`}
        />

        <div
          className="rounded-lg px-3 py-2.5 text-[11px] leading-relaxed"
          style={{ background: 'rgba(220,120,40,0.10)', color: '#dc7828' }}
        >
          ⚠ <b>教学简化模型声明</b>：本演示实现的是教材里的经典 AIMD / Reno 风格四阶段 FSM，用于建立直觉。它<b>不是</b>真实 Linux 的实现——现代 Linux 默认使用 <b>CUBIC</b>（以及 BBR 等基于带宽/时延测量的算法），CUBIC 用三次函数拟合窗口增长、在 ssthresh 之上还能继续大幅探测，窗口形状与这里明显不同。此外真实 TCP 还有 pacing、RTT 独立估计器（Linux 的 RTO 估计不依赖 cwnd）、EACK/SACK、以及 cwnd 初始值（Linux 的 initcwnd 为 10 个包）等细节，本演示均未涉及。
        </div>
      </div>
    </DemoFrame>
  )
}
