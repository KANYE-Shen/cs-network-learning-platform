import { useMemo, useState } from 'react'
import { DemoFrame, ParamSlider, PlayControls, ResultGrid, StepNote, useStepMachine } from './DemoKit'

/**
 * TCP 的 RTT 估计与超时时间设置（PPT 第 58-60 页）。
 *
 * 公式（必须严格正确）：
 *   EstimatedRTT = (1-α)·EstimatedRTT + α·SampleRTT          （α = 0.125）
 *   DevRTT       = (1-β)·DevRTT + β·|SampleRTT − EstimatedRTT| （β = 0.25）
 *   TimeoutInterval = EstimatedRTT + 4·DevRTT
 *
 * 注意 DevRTT 里用的是<b>更新后的</b> EstimatedRTT（Kurose 教材的伪代码即如此）。
 * 初值：EstimatedRTT = 第一个 SampleRTT，DevRTT = 0（教材建议用前几个样本的平均值）。
 */

interface Sample {
  i: number
  sample: number
  est: number
  dev: number
  timeout: number
}

const PRESETS: { label: string; samples: number[] }[] = [
  { label: '稳定（约 100 ms）', samples: [100, 100, 100, 100, 100, 100] },
  { label: '逐渐变大', samples: [80, 100, 120, 140, 160, 180] },
  { label: '抖动大', samples: [50, 150, 60, 180, 70, 200] },
  { label: '一次超时后恢复', samples: [100, 100, 300, 100, 100, 100] },
]

export default function RttTimeoutDemo() {
  const [samples, setSamples] = useState<number[]>([100, 100, 100, 100, 100, 100])
  const [alpha, setAlpha] = useState(0.125)
  const [beta, setBeta] = useState(0.25)
  const [input, setInput] = useState('100')

  /** 逐步计算：EstimatedRTT / DevRTT / TimeoutInterval */
  const calc = useMemo(() => {
    const rows: Sample[] = []
    let est = 0
    let dev = 0
    samples.forEach((s, i) => {
      if (i === 0) {
        est = s
        dev = 0
      } else {
        est = (1 - alpha) * est + alpha * s
        dev = (1 - beta) * dev + beta * Math.abs(s - est)
      }
      rows.push({ i: i + 1, sample: s, est, dev, timeout: est + 4 * dev })
    })
    return rows
  }, [samples, alpha, beta])

  const steps = useMemo(
    () =>
      calc.map((r) => ({
        label: `样本 ${r.i}: SampleRTT = ${r.sample} ms`,
        detail: `EstimatedRTT = ${r.est.toFixed(2)} ms，DevRTT = ${r.dev.toFixed(2)} ms，TimeoutInterval = ${r.timeout.toFixed(2)} ms`,
      })),
    [calc],
  )
  const machine = useStepMachine(steps, { intervalMs: 1100 })
  const applied = Math.min(machine.index, calc.length)
  const cur = applied > 0 ? calc[applied - 1] : null
  const next = applied < calc.length ? calc[applied] : null

  const last = calc.length ? calc[calc.length - 1] : null

  /** 曲线图（SVG）：EstimatedRTT / DevRTT / TimeoutInterval 随样本序号变化 */
  const chart = useMemo(() => {
    const W = 420
    const H = 170
    const pad = { l: 42, r: 12, t: 14, b: 26 }
    const iw = W - pad.l - pad.r
    const ih = H - pad.t - pad.b
    if (calc.length === 0) return null
    const maxY = Math.max(...calc.map((r) => r.timeout), 10) * 1.15
    const maxX = Math.max(calc.length - 1, 1)
    const x = (i: number) => pad.l + (i / maxX) * iw
    const y = (v: number) => pad.t + ih - (v / maxY) * ih
    const path = (key: 'est' | 'dev' | 'timeout') =>
      calc.map((r, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(r[key]).toFixed(1)}`).join(' ')
    const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * maxY)
    return { W, H, pad, iw, ih, maxY, x, y, path, ticks }
  }, [calc])

  const addSample = () => {
    const v = Number(input)
    if (!Number.isFinite(v) || v <= 0) return
    setSamples((s) => [...s, v])
    machine.reset()
  }

  const setPreset = (p: { label: string; samples: number[] }) => {
    setSamples(p.samples)
    machine.reset()
  }

  const resetAll = () => {
    setSamples(PRESETS[0].samples)
    machine.reset()
  }

  return (
    <DemoFrame
      title="RTT 估计与超时时间：EWMA 如何平滑抖动"
      description="SampleRTT 是实测值，会剧烈抖动。EstimatedRTT 用指数加权滑动平均把它平滑掉；DevRTT 度量抖动幅度；超时时间 = 估计值 + 4 倍安全余量。"
      controls={
        <PlayControls
          playing={machine.playing}
          onPlay={() => machine.setPlaying(true)}
          onPause={() => machine.setPlaying(false)}
          onReset={resetAll}
          onStep={machine.step}
          onStepBack={machine.stepBack}
          canStepBack
          speed={machine.speed}
          onSpeedChange={machine.setSpeed}
        />
      }
      legend={[
        { color: 'var(--brand)', label: 'EstimatedRTT' },
        { color: '#dc7828', label: 'DevRTT' },
        { color: '#16a078', label: 'TimeoutInterval' },
      ]}
    >
      <div className="space-y-4">
        {/* 公式 */}
        <div
          className="rounded-lg px-3 py-2.5 text-[11px] mono overflow-x-auto"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <div>EstimatedRTT = (1−α)·EstimatedRTT + α·SampleRTT</div>
          <div>DevRTT = (1−β)·DevRTT + β·|SampleRTT − EstimatedRTT|</div>
          <div>TimeoutInterval = EstimatedRTT + 4·DevRTT</div>
        </div>

        {/* 参数 */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ParamSlider
            label="α（EstimatedRTT 的权重）"
            value={alpha}
            onChange={(v) => {
              setAlpha(v)
              machine.reset()
            }}
            min={0.05}
            max={0.5}
            step={0.025}
            format={(v) => v.toFixed(3)}
            hint="典型值 α = 0.125。越小越平滑，但对突发变化反应越慢。"
          />
          <ParamSlider
            label="β（DevRTT 的权重）"
            value={beta}
            onChange={(v) => {
              setBeta(v)
              machine.reset()
            }}
            min={0.05}
            max={0.5}
            step={0.025}
            format={(v) => v.toFixed(3)}
            hint="典型值 β = 0.25。"
          />
          <div>
            <div className="text-xs font-medium mb-1">加入一个样本 SampleRTT</div>
            <div className="flex gap-2">
              <input
                type="number"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                min={1}
                className="flex-1 min-w-0 px-2 py-1.5 rounded-md text-xs outline-none mono"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
              <button onClick={addSample} className="btn-primary !px-3 !text-xs whitespace-nowrap">
                加入
              </button>
            </div>
            <div className="text-[10px] muted mt-1">单位 ms。重传过的分段不计入 SampleRTT。</div>
          </div>
          <div>
            <div className="text-xs font-medium mb-1">预设样本序列</div>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <button key={p.label} onClick={() => setPreset(p)} className="btn-ghost !px-2 !py-1 !text-[11px]">
                  {p.label}
                </button>
              ))}
            </div>
            <button onClick={resetAll} className="btn-outline !px-2 !py-1 !text-[11px] mt-1.5">
              清除样本
            </button>
          </div>
        </div>

        {/* 曲线图 */}
        {chart && (
          <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-1.5">估计值随样本的变化</div>
            <svg viewBox={`0 0 ${chart.W} ${chart.H}`} width="100%" style={{ display: 'block' }} role="img">
              {chart.ticks.map((t, i) => (
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
              {/* 样本柱 */}
              {calc.map((r, i) => (
                <g key={`s${i}`}>
                  <rect
                    x={chart.x(i) - 3}
                    y={chart.y(r.sample)}
                    width={6}
                    height={chart.pad.t + chart.ih - chart.y(r.sample)}
                    fill="var(--border)"
                    opacity={0.8}
                  >
                    <title>{`SampleRTT ${r.sample} ms`}</title>
                  </rect>
                </g>
              ))}
              <path d={chart.path('timeout')} fill="none" stroke="#16a078" strokeWidth={2} />
              <path d={chart.path('est')} fill="none" stroke="var(--brand)" strokeWidth={2} />
              <path d={chart.path('dev')} fill="none" stroke="#dc7828" strokeWidth={2} strokeDasharray="4 2" />
              {calc.map((r, i) =>
                i < applied ? (
                  <g key={`p${i}`}>
                    <circle cx={chart.x(i)} cy={chart.y(r.est)} r={3} fill="var(--brand)" />
                    <circle cx={chart.x(i)} cy={chart.y(r.timeout)} r={3} fill="#16a078" />
                    <circle cx={chart.x(i)} cy={chart.y(r.dev)} r={3} fill="#dc7828" />
                  </g>
                ) : null,
              )}
              {calc.map((r, i) => (
                <text
                  key={`x${i}`}
                  x={chart.x(i)}
                  y={chart.H - 8}
                  textAnchor="middle"
                  fontSize={8}
                  fill="var(--text-muted)"
                  fontFamily="ui-monospace, monospace"
                >
                  {i + 1}
                </text>
              ))}
              <text x={chart.pad.l} y={chart.H - 0.5} fontSize={8} fill="var(--text-muted)">
                样本序号 →
              </text>
              <text
                x={4}
                y={chart.pad.t + 6}
                fontSize={8}
                fill="var(--text-muted)"
                transform={`rotate(-90 4 ${chart.pad.t + 6})`}
              >
                ms
              </text>
            </svg>
            <div className="text-[10px] muted mt-1">
              灰色竖条 = 实测 SampleRTT（抖动源）；三条曲线分别是 EstimatedRTT、DevRTT 与 TimeoutInterval。
            </div>
          </div>
        )}

        {/* 逐步表格 */}
        <div>
          <div className="text-xs font-semibold mb-1.5">逐步计算</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] mono">
              <thead>
                <tr className="text-left" style={{ color: 'var(--text-muted)' }}>
                  <th className="py-1 pr-2 font-normal">#</th>
                  <th className="py-1 pr-2 font-normal">SampleRTT</th>
                  <th className="py-1 pr-2 font-normal">EstimatedRTT</th>
                  <th className="py-1 pr-2 font-normal">DevRTT</th>
                  <th className="py-1 pr-2 font-normal">TimeoutInterval</th>
                  <th className="py-1 font-normal">说明</th>
                </tr>
              </thead>
              <tbody>
                {calc.map((r, i) => {
                  const on = i < applied
                  const isCur = i === applied - 1
                  return (
                    <tr
                      key={r.i}
                      style={{
                        background: isCur ? 'rgba(50,85,219,0.08)' : 'transparent',
                        opacity: on ? 1 : 0.5,
                      }}
                    >
                      <td className="py-1 pr-2">{r.i}</td>
                      <td className="py-1 pr-2">{r.sample}</td>
                      <td className="py-1 pr-2" style={{ color: 'var(--brand)' }}>
                        {r.est.toFixed(2)}
                      </td>
                      <td className="py-1 pr-2" style={{ color: '#dc7828' }}>
                        {r.dev.toFixed(2)}
                      </td>
                      <td className="py-1 pr-2" style={{ color: '#16a078' }}>
                        {r.timeout.toFixed(2)}
                      </td>
                      <td className="py-1 muted" style={{ fontFamily: 'inherit' }}>
                        {r.i === 1 ? '初值：EstimatedRTT = 首个样本，DevRTT = 0' : 'EWMA 更新'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <StepNote
          tone={cur ? 'info' : 'info'}
          text={
            cur
              ? `样本 ${cur.i}：SampleRTT = ${cur.sample} ms。${
                  cur.i === 1
                    ? '这是第一个样本，用它作为 EstimatedRTT 的初值，DevRTT 初始化为 0。'
                    : `EstimatedRTT = (1−${alpha})×${(calc[cur.i - 2].est).toFixed(2)} + ${alpha}×${cur.sample} = ${cur.est.toFixed(2)} ms；DevRTT = (1−${beta})×${(calc[cur.i - 2].dev).toFixed(2)} + ${beta}×|${cur.sample} − ${cur.est.toFixed(2)}| = ${cur.dev.toFixed(2)} ms。`
                }`
              : next
                ? `下一步：样本 ${next.i}，SampleRTT = ${next.sample} ms`
                : '加入样本或选择预设序列后，点击「单步」查看每一步的计算。'
          }
        />

        <ResultGrid
          items={[
            { label: 'EstimatedRTT', value: last ? `${last.est.toFixed(2)} ms` : '—', highlight: true },
            { label: 'DevRTT', value: last ? `${last.dev.toFixed(2)} ms` : '—' },
            { label: 'TimeoutInterval', value: last ? `${last.timeout.toFixed(2)} ms` : '—', highlight: true },
            { label: '样本数', value: `${calc.length} 个` },
          ]}
        />

        <StepNote
          tone="info"
          text={`为什么是 +4·DevRTT？超时值必须明显大于 RTT，否则会「过早超时」造成无谓重传；但也不能太大，否则丢失分段后要等很久才能被发现。安全余量取 4 倍 DevRTT：EstimatedRTT 波动越大，DevRTT 越大，余量就留得越宽。`}
        />
      </div>
    </DemoFrame>
  )
}
