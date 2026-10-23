// ============================================================
// 吞吐量：瞬时 vs 平均、瓶颈链路
// 对应 PPT 第 60-62 页
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DemoFrame, PlayControls, ParamSlider, ResultGrid, StepNote } from './DemoKit'

const C_BOTTLE = '#d64545'
const C_LINK = '#4873e8'
const C_LINK2 = '#16a078'

interface Link {
  name: string
  rate: number // bps
}

/** 瓶颈场景预设：对应 PPT 第 62 页的 Rs < Rc 与 Rs > Rc 两种情形 */
const PRESETS: { key: string; name: string; desc: string; rates: number[] }[] = [
  {
    key: 'rs_lt_rc',
    name: 'Rs < Rc（第一跳是瓶颈）',
    desc: '源到接收方的第一跳更慢：端到端吞吐量被第一条链路限制',
    rates: [1.5e6, 10e6, 10e6, 10e6],
  },
  {
    key: 'rs_gt_rc',
    name: 'Rs > Rc（最后跳是瓶颈）',
    desc: '接入链路很快，但最后一条链路更慢：吞吐量被接收方的接入链路限制',
    rates: [10e6, 10e6, 10e6, 1.5e6],
  },
  {
    key: 'uniform',
    name: '全链路等速',
    desc: '四条链路速率相同，此时瓶颈不唯一',
    rates: [5e6, 5e6, 5e6, 5e6],
  },
]

function fmtRate(bps: number): string {
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(2)} Mbps`
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(2)} kbps`
  return `${bps.toFixed(0)} bps`
}

export default function ThroughputDemo() {
  const [links, setLinks] = useState<Link[]>([
    { name: '链路 1（源→R1）', rate: 1.5e6 },
    { name: '链路 2（R1→R2）', rate: 10e6 },
    { name: '链路 3（R2→R3）', rate: 10e6 },
    { name: '链路 4（R3→目的）', rate: 10e6 },
  ])
  const [mode, setMode] = useState<'instant' | 'average'>('average')
  const [fileSize, setFileSize] = useState(10) // MB
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [t, setT] = useState(0) // 模拟经过的"服务机会"数
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const rates = useMemo(() => links.map((l) => l.rate), [links])
  const bottleneckRate = Math.min(...rates)
  const bottleneckIdx = rates.indexOf(bottleneckRate)
  const maxRate = Math.max(...rates)

  // 平均吞吐量：长期看，端到端吞吐量受最慢链路限制
  const avgThroughput = bottleneckRate
  // 瞬时吞吐量：某一瞬间的传输速率（这里用"此刻链路上真正在传数据的那一跳"）
  const [flickerIdx, setFlickerIdx] = useState(0)
  const instantThroughput = rates[flickerIdx % rates.length]
  const shownThroughput = mode === 'average' ? avgThroughput : instantThroughput

  // ---------- 模拟：分组依次通过各条链路 ----------
  useEffect(() => {
    if (!playing) return
    timer.current = setInterval(() => {
      setT((v) => v + 1)
      setFlickerIdx((v) => (v + 1) % rates.length)
    }, 500 / speed)
    return () => {
      if (timer.current) clearInterval(timer.current)
      timer.current = null
    }
  }, [playing, speed, rates.length])

  const reset = useCallback(() => {
    setPlaying(false)
    setT(0)
    setFlickerIdx(0)
  }, [])

  const stepOnce = useCallback(() => {
    setPlaying(false)
    setT((v) => v + 1)
    setFlickerIdx((v) => (v + 1) % rates.length)
  }, [rates.length])

  const setRate = (i: number, rate: number) => {
    setLinks((ls) => ls.map((l, k) => (k === i ? { ...l, rate } : l)))
  }

  const applyPreset = (key: string) => {
    const p = PRESETS.find((x) => x.key === key)
    if (!p) return
    setLinks((ls) => ls.map((l, i) => ({ ...l, rate: p.rates[i] ?? l.rate })))
    reset()
  }

  // ---------- 速率档位 ----------
  const RATE_STEPS = [0.5e6, 1.5e6, 2e6, 5e6, 10e6, 20e6, 50e6, 100e6, 200e6, 500e6, 1e9]

  // ---------- 端到端传输耗时（用瓶颈算） ----------
  // 文件大小按 MB（10^6 字节）计，换算成比特再除以瓶颈速率
  const transferTime = (fileSize * 8 * 1e6) / bottleneckRate // 秒

  // ---------- 条形图 ----------
  const BW = 1000
  const BH = 260
  const bPadL = 168
  const bPadR = 92
  const bPadT = 16
  const bPadB = 30
  const rowH = (BH - bPadT - bPadB) / links.length
  const bx = (r: number) => bPadL + (r / maxRate) * (BW - bPadL - bPadR)

  // ---------- 端到端流水线示意图 ----------
  const PW = 1000
  const PH = 190
  const nodeXs = [70, 300, 530, 760, 930]

  return (
    <DemoFrame
      title="瓶颈链路与端到端吞吐量"
      description="吞吐量是单位时间内传输的比特数。端到端路径上的多条链路速率各不相同，端到端吞吐量不可能超过最慢的那一条——它就是瓶颈链路。"
      controls={
        <>
          <PlayControls
            playing={playing}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onReset={reset}
            onStep={stepOnce}
            speed={speed}
            onSpeedChange={setSpeed}
          />
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'instant' | 'average')}
            className="px-2 py-1 rounded-md text-xs outline-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <option value="average">平均吞吐量</option>
            <option value="instant">瞬时吞吐量</option>
          </select>
        </>
      }
      legend={[
        { color: C_BOTTLE, label: '瓶颈链路（最慢）' },
        { color: C_LINK, label: '其它链路' },
        { color: C_LINK2, label: '端到端吞吐量' },
      ]}
    >
      <div className="space-y-4">
        {/* ---------------- 预设 ---------------- */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs muted">场景预设：</span>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key)}
              className="btn-ghost !px-2.5 !py-1 text-[11px]"
              title={p.desc}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* ---------------- 链路速率调节 ---------------- */}
        <div className="grid sm:grid-cols-2 gap-4">
          {links.map((l, i) => {
            const isBottle = i === bottleneckIdx
            return (
              <div
                key={l.name}
                className="rounded-lg px-3 py-2"
                style={{
                  background: isBottle ? 'rgba(214,69,69,0.08)' : 'var(--surface-2)',
                  border: `1px solid ${isBottle ? C_BOTTLE : 'var(--border)'}`,
                }}
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className="text-xs font-medium">
                    {l.name}
                    {isBottle && (
                      <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(214,69,69,0.15)', color: C_BOTTLE }}>
                        瓶颈
                      </span>
                    )}
                  </span>
                  <span className="text-xs mono tabular-nums" style={{ color: isBottle ? C_BOTTLE : 'var(--brand)' }}>
                    {fmtRate(l.rate)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={RATE_STEPS.length - 1}
                  step={1}
                  value={Math.max(0, RATE_STEPS.indexOf(l.rate))}
                  onChange={(e) => setRate(i, RATE_STEPS[Number(e.target.value)])}
                  className="w-full accent-[var(--brand)] cursor-pointer"
                />
                <div className="text-[10px] muted">
                  {fmtRate(RATE_STEPS[0])} ← → {fmtRate(RATE_STEPS[RATE_STEPS.length - 1])}
                </div>
              </div>
            )
          })}
        </div>

        {/* ---------------- 关键指标 ---------------- */}
        <ResultGrid
          items={[
            { label: '端到端吞吐量（平均）', value: fmtRate(avgThroughput), highlight: true, hint: '= min(各链路速率)' },
            { label: '瓶颈链路', value: links[bottleneckIdx].name, hint: fmtRate(bottleneckRate) },
            { label: '最慢 / 最快', value: `${fmtRate(bottleneckRate)} / ${fmtRate(maxRate)}` },
            { label: '利用率浪费', value: `${(((maxRate - bottleneckRate) / maxRate) * 100).toFixed(0)}%`, hint: '其余链路的余量被浪费' },
            { label: '当前显示', value: fmtRate(shownThroughput), hint: mode === 'average' ? '长期平均速率' : `瞬时：此刻 ${links[flickerIdx % links.length].name}` },
            { label: `传输 ${fileSize} MB 耗时`, value: `${transferTime.toFixed(3)} s`, hint: '由瓶颈链路决定' },
          ]}
        />

        {/* ---------------- 条形图 ---------------- */}
        <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
          <div className="text-xs font-medium mb-1">各链路速率与端到端吞吐量</div>
          <svg viewBox={`0 0 ${BW} ${BH}`} className="w-full h-auto block" role="img" aria-label="各链路速率条形图">
            {links.map((l, i) => {
              const y = bPadT + i * rowH + rowH * 0.18
              const h = rowH * 0.5
              const isBottle = i === bottleneckIdx
              const w = Math.max(2, bx(l.rate) - bPadL)
              return (
                <g key={l.name}>
                  <text x={bPadL - 8} y={y + h / 2 + 4} textAnchor="end" fontSize={11} fill={isBottle ? C_BOTTLE : 'var(--text-muted)'}>
                    {l.name.replace('（', ' (')}
                  </text>
                  <rect x={bPadL} y={y} width={BW - bPadL - bPadR} height={h} rx={4} fill="var(--surface-2)" />
                  <rect x={bPadL} y={y} width={w} height={h} rx={4} fill={isBottle ? C_BOTTLE : C_LINK} opacity={isBottle ? 0.9 : 0.75} />
                  <text x={bPadL + w + 6} y={y + h / 2 + 4} fontSize={11} fill={isBottle ? C_BOTTLE : 'var(--text-muted)'} fontWeight={isBottle ? 700 : 400}>
                    {fmtRate(l.rate)}
                  </text>
                </g>
              )
            })}
            {/* 端到端吞吐量参考线 */}
            <line x1={bx(avgThroughput)} y1={bPadT} x2={bx(avgThroughput)} y2={BH - bPadB} stroke={C_LINK2} strokeWidth={2} strokeDasharray="6 4" />
            <text x={bx(avgThroughput)} y={bPadT - 3} textAnchor="middle" fontSize={11} fill={C_LINK2} fontWeight={700}>
              端到端 {fmtRate(avgThroughput)}
            </text>
            <text x={bPadL} y={BH - 8} fontSize={10} fill="var(--text-muted)">
              横轴：链路速率（0 → {fmtRate(maxRate)}）
            </text>
          </svg>
        </div>

        {/* ---------------- 端到端流水线示意图 ---------------- */}
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div
            className="px-3 py-2 text-xs flex flex-wrap items-center gap-x-4 gap-y-1"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}
          >
            <span className="font-semibold">一个分组依次经过 {links.length} 条链路</span>
            <span className="mono muted">round {t}</span>
          </div>
          <svg viewBox={`0 0 ${PW} ${PH}`} className="w-full h-auto block" role="img" aria-label="分组通过各条链路">
            {/* 链路 */}
            {links.map((l, i) => {
              const x0 = nodeXs[i] + 32
              const x1 = nodeXs[i + 1] - 32
              const isBottle = i === bottleneckIdx
              return (
                <g key={`lk-${i}`}>
                  <line x1={x0} y1={92} x2={x1} y2={92} stroke="var(--border)" strokeWidth={isBottle ? 9 : 6} strokeLinecap="round" />
                  <text x={(x0 + x1) / 2} y={78} textAnchor="middle" fontSize={11} fill={isBottle ? C_BOTTLE : 'var(--text-muted)'} fontWeight={isBottle ? 700 : 400}>
                    {fmtRate(l.rate)}
                  </text>
                  {isBottle && (
                    <text x={(x0 + x1) / 2} y={128} textAnchor="middle" fontSize={11} fill={C_BOTTLE} fontWeight={700}>
                      瓶颈
                    </text>
                  )}
                </g>
              )
            })}
            {/* 节点 */}
            {nodeXs.map((x, i) => {
              const label = i === 0 ? '源' : i === nodeXs.length - 1 ? '目的' : `R${i}`
              const isEnd = i === 0 || i === nodeXs.length - 1
              return (
                <g key={`nd-${i}`}>
                  {isEnd ? (
                    <rect x={x - 32} y={72} width={64} height={40} rx={9} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={1.5} />
                  ) : (
                    <circle cx={x} cy={92} r={24} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={1.5} />
                  )}
                  <text x={x} y={97} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--text)">
                    {label}
                  </text>
                </g>
              )
            })}
            {/* 在途分组：按各链路的速率决定前进速度（瓶颈处慢下来） */}
            {links.map((_, i) => {
              const x0 = nodeXs[i] + 32
              const x1 = nodeXs[i + 1] - 32
              // 用相对速率决定这一段走完需要多少拍：速率越低拍数越多
              const beats = Math.max(1, Math.round((maxRate / rates[i]) * 1.2))
              const period = 6 * beats
              const ph = (t % period) / period
              const x = x0 + (x1 - x0) * ph
              return (
                <g key={`pk-${i}`}>
                  <rect
                    x={x - 11}
                    y={81}
                    width={22}
                    height={22}
                    rx={5}
                    fill={i === bottleneckIdx ? C_BOTTLE : C_LINK2}
                    stroke="var(--surface)"
                    strokeWidth={1.5}
                  />
                </g>
              )
            })}
            <text x={70} y={165} fontSize={11} fill="var(--text-muted)">
              分组在最慢的那条链路上停留最久——所以端到端吞吐量 = 瓶颈链路的速率
            </text>
            <text x={70} y={183} fontSize={11} fill="var(--text-muted)">
              其余链路的带宽即使富余也无法让文件传得更快（多出来的只是“闲置容量”）
            </text>
          </svg>
        </div>

        <ParamSlider
          label="文件大小（用于估算传输耗时）"
          value={fileSize}
          onChange={setFileSize}
          min={1}
          max={1000}
          step={1}
          unit="MB"
          format={(v) => v.toFixed(0)}
        />

        <StepNote
          tone={bottleneckIdx === 0 ? 'warn' : 'info'}
          text={
            bottleneckIdx === 0
              ? `当前是 PPT 第 62 页的 Rs < Rc 情形：第一跳（${fmtRate(bottleneckRate)}）比后面都慢，所以平均端到端吞吐量 = ${fmtRate(bottleneckRate)}，等于 Rs 而不是 Rc。`
              : bottleneckIdx === links.length - 1
                ? `当前是 Rs > Rc 情形：接入链路很快，但最后一条链路只有 ${fmtRate(bottleneckRate)}，它成了瓶颈，端到端吞吐量 = ${fmtRate(bottleneckRate)} 而不是更快的 Rs。`
                : `瓶颈链路是${links[bottleneckIdx].name}（${fmtRate(bottleneckRate)}）。端到端吞吐量 = min(各链路速率) = ${fmtRate(avgThroughput)}。`
          }
        />
        <StepNote
          tone="info"
          text={`瞬时吞吐量 = 某一瞬间的传输速率；平均吞吐量 = 更长时间内的平均速率。长期平均下两者都受瓶颈约束：不管瞬时速率在链路上怎么波动，平均端到端吞吐量 ≤ 瓶颈链路速率 = ${fmtRate(bottleneckRate)}。`}
        />
        <StepNote
          text={`要点：提高吞吐量只有两条路——(1) 把瓶颈链路提速（这是唯一的限制因素）；(2) 增加并行路径（多流/多 TCP 连接）绕开瓶颈。单纯加快非瓶颈链路不会改变端到端吞吐量。`}
        />
      </div>
    </DemoFrame>
  )
}
