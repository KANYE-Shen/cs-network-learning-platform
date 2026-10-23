// ============================================================
// 流量强度 ρ = La/R 与排队时延
// 对应 PPT 第 68 页：ρ≈0 时排队时延小；ρ→1 时延迟剧增；ρ>1 时平均排队时延趋于无穷
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DemoFrame, PlayControls, ParamSlider, ParamSelect, ResultGrid, StepNote } from './DemoKit'

const C_LOW = '#16a078'
const C_MID = '#e08a2e'
const C_HIGH = '#d64545'
const C_CURVE = '#4873e8'

function fmtTime(sec: number): string {
  if (!isFinite(sec)) return '∞'
  const a = Math.abs(sec)
  if (a === 0) return '0 s'
  if (a >= 1) return `${sec.toFixed(3)} s`
  if (a >= 1e-3) return `${(sec * 1e3).toFixed(3)} ms`
  if (a >= 1e-6) return `${(sec * 1e6).toFixed(3)} μs`
  return `${(sec * 1e9).toFixed(1)} ns`
}

function fmtRate(bps: number): string {
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(2)} Mbps`
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(2)} kbps`
  return `${bps.toFixed(0)} bps`
}

export default function QueueingDemo() {
  // ---------- 参数 ----------
  const [L, setL] = useState(1500) // 分组长度 bit
  const [R, setR] = useState(100e6) // 链路速率 bps
  const [a, setA] = useState(4000) // 平均到达率 分组/秒
  const [bufCap, setBufCap] = useState(50) // 缓冲容量（分组）

  // ---------- 模拟状态 ----------
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [queue, setQueue] = useState(0) // 当前队列长度（可为小数，便于连续演化）
  const [served, setServed] = useState(0) // 已发送分组数
  const [lost, setLost] = useState(0) // 因缓冲满而丢弃的分组数
  const [ticks, setTicks] = useState(0) // 已进行的“服务机会”数
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  // 用 ref 保存模拟累加器，避免在 setState 更新函数里做副作用
  const sim = useRef({ q: 0, served: 0, lost: 0, lostFrac: 0, ticks: 0 })

  // ---------- 派生量 ----------
  const serviceRate = R / L // 每秒能服务的分组数 μ
  const rho = (a * L) / R // 流量强度 La/R
  const tService = L / R // 一个分组的发送时延
  // M/M/1 近似排队时延：E[W] = ρ/(1−ρ) · 1/μ = ρ/(1−ρ) · (L/R)
  const queueDelay = rho < 1 ? (rho / (1 - rho)) * tService : Infinity
  const avgTotalDelay = rho < 1 ? tService + queueDelay : Infinity

  // 到达率滑块的范围：最多到服务能力的 1.25 倍
  const aMax = Math.max(50, Math.ceil(serviceRate * 1.25))
  const aStep = Math.max(1, Math.round(aMax / 200))

  // ---------- 模拟循环：每个 tick = 一个分组的发送时延 ----------
  const advance = useCallback(() => {
    // 一个发送时延内期望到达 ρ 个分组（泊松近似，加一点随机抖动）
    const jitter = Math.sqrt(Math.max(rho, 0)) * 0.8 * (Math.random() - 0.5)
    let q = sim.current.q + rho + jitter
    if (q < 0) q = 0
    // 服务：本 tick（一个发送时延）最多发走 1 个分组
    if (q >= 1) {
      q -= 1
      sim.current.served += 1
    }
    // 缓冲区溢出：超出容量的部分被丢弃（保留小数累计，避免每 tick 的零头被抹掉）
    if (q > bufCap) {
      sim.current.lostFrac += q - bufCap
      const whole = Math.floor(sim.current.lostFrac)
      sim.current.lost += whole
      sim.current.lostFrac -= whole
      q = bufCap
    }
    sim.current.q = q
    sim.current.ticks += 1
    setQueue(q)
    setServed(sim.current.served)
    setLost(sim.current.lost)
    setTicks(sim.current.ticks)
  }, [rho, bufCap])

  useEffect(() => {
    if (!playing) return
    timer.current = setInterval(advance, 400 / speed)
    return () => {
      if (timer.current) clearInterval(timer.current)
      timer.current = null
    }
  }, [playing, speed, advance])

  const reset = useCallback(() => {
    setPlaying(false)
    sim.current = { q: 0, served: 0, lost: 0, lostFrac: 0, ticks: 0 }
    setQueue(0)
    setServed(0)
    setLost(0)
    setTicks(0)
  }, [])

  const stepOnce = useCallback(() => {
    setPlaying(false)
    // 单步：确定性地到达 ρ 个分组
    let q = sim.current.q + rho
    if (q >= 1) {
      q -= 1
      sim.current.served += 1
    }
    if (q > bufCap) {
      sim.current.lostFrac += q - bufCap
      const whole = Math.floor(sim.current.lostFrac)
      sim.current.lost += whole
      sim.current.lostFrac -= whole
      q = bufCap
    }
    sim.current.q = q
    sim.current.ticks += 1
    setQueue(q)
    setServed(sim.current.served)
    setLost(sim.current.lost)
    setTicks(sim.current.ticks)
  }, [rho, bufCap])

  const setRho = (v: number) => {
    setA(Math.max(1, Math.round((v * R) / L)))
  }

  // ---------- 曲线图 ----------
  const CW = 1000
  const CH = 300
  const cPadL = 62
  const cPadR = 26
  const cPadT = 18
  const cPadB = 42
  const XMAX = 1.2
  const YMAX_U = 20 // 纵轴上限（以 L/R 为单位）
  const cx = (r: number) => cPadL + (r / XMAX) * (CW - cPadL - cPadR)
  const cy = (u: number) => cPadT + (1 - Math.min(u, YMAX_U) / YMAX_U) * (CH - cPadT - cPadB)

  const curve = useMemo(() => {
    const pts: string[] = []
    for (let i = 0; i <= 99; i++) {
      const r = i / 100
      const u = r / (1 - r)
      pts.push(`${cx(r).toFixed(2)},${cy(u).toFixed(2)}`)
    }
    return pts.join(' ')
  }, [cx, cy])

  // 分区着色背景
  const zones = [
    { from: 0, to: 0.8, fill: 'rgba(22,160,120,0.10)', label: 'ρ ≈ 0：排队时延小', color: C_LOW, anchor: 'start' as const },
    { from: 0.8, to: 1.0, fill: 'rgba(224,138,46,0.12)', label: 'ρ → 1：剧增', color: C_MID, anchor: 'middle' as const },
    { from: 1.0, to: XMAX, fill: 'rgba(214,69,69,0.12)', label: 'ρ > 1：队列无限增长', color: C_HIGH, anchor: 'end' as const },
  ]

  // ---------- 当前 ρ 所在区间 ----------
  const zone =
    rho < 0.8
      ? {
          color: C_LOW,
          name: '低负载',
          text: `到达率只有服务能力的 ${(rho * 100).toFixed(0)}%，分组几乎立即被转发，排队时延很小（${fmtTime(queueDelay)}）。`,
        }
      : rho < 1
        ? {
            color: C_MID,
            name: '接近饱和',
            text: `到达率已达服务能力的 ${(rho * 100).toFixed(0)}%，排队时延 ${fmtTime(queueDelay)} 急剧上升——越接近 ρ=1 它越趋于无穷。`,
          }
        : {
            color: C_HIGH,
            name: '过载',
            text: '到达速率超过服务速率，队列无限增长，平均排队时延趋于无穷。',
          }

  const queuePct = Math.min(100, (queue / bufCap) * 100)

  return (
    <DemoFrame
      title="流量强度 La/R 与排队时延：ρ → 1 时延迟剧增"
      description="ρ = (分组到达率 a) × (分组长度 L) ÷ (链路速率 R)。ρ 衡量链路有多“拥挤”：ρ≈0 时排队时延小，ρ→1 时延迟剧增，ρ>1 时平均排队时延趋于无穷。"
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
          <button onClick={() => setRho(0.5)} className="btn-ghost !px-2.5 text-[11px]">
            ρ=0.5
          </button>
          <button onClick={() => setRho(0.9)} className="btn-ghost !px-2.5 text-[11px]">
            ρ=0.9
          </button>
          <button onClick={() => setRho(1.2)} className="btn-ghost !px-2.5 text-[11px]">
            ρ=1.2
          </button>
        </>
      }
      legend={[
        { color: C_LOW, label: 'ρ ≈ 0 排队时延小' },
        { color: C_MID, label: 'ρ → 1 剧增' },
        { color: C_HIGH, label: 'ρ > 1 无穷' },
        { color: C_CURVE, label: 'M/M/1 近似曲线' },
      ]}
    >
      <div className="space-y-4">
        {/* ---------------- 参数 ---------------- */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ParamSlider
            label="分组长度 L"
            value={L}
            onChange={setL}
            min={100}
            max={8000}
            step={100}
            unit="bit"
          />
          <ParamSlider
            label="链路速率 R"
            value={R / 1e6}
            onChange={(v) => setR(v * 1e6)}
            min={1}
            max={1000}
            step={1}
            unit="Mbps"
            format={(v) => v.toFixed(0)}
          />
          <ParamSlider
            label="到达率 a"
            value={Math.min(a, aMax)}
            onChange={setA}
            min={1}
            max={aMax}
            step={aStep}
            unit="分组/秒"
            format={(v) => v.toFixed(0)}
            hint={`服务能力 ${serviceRate.toFixed(0)} 分组/秒`}
          />
          <ParamSlider
            label="流量强度 ρ = La/R（直接调节）"
            value={Math.min(rho, 1.2)}
            onChange={setRho}
            min={0.01}
            max={1.2}
            step={0.01}
            format={(v) => v.toFixed(2)}
            hint="由 a = ρR/L 反算得到"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <ParamSelect
            label="链路速率档位"
            value={String(R)}
            onChange={(v) => setR(Number(v))}
            options={[
              { value: '1000000', label: '1 Mbps（低速接入）' },
              { value: '100000000', label: '100 Mbps（以太网）' },
              { value: '1000000000', label: '1 Gbps（千兆）' },
              { value: '2500000000', label: '2.5 Gbps（10G）' },
            ]}
          />
          <ParamSlider
            label="缓冲容量"
            value={bufCap}
            onChange={setBufCap}
            min={5}
            max={200}
            step={5}
            unit="个分组"
            hint="超出容量的分组会被丢弃"
          />
        </div>

        {/* ---------------- 关键指标 ---------------- */}
        <ResultGrid
          items={[
            { label: '流量强度 ρ = La/R', value: rho.toFixed(3), highlight: true, hint: zone.name },
            { label: '服务速率 μ = R/L', value: `${serviceRate.toFixed(0)} 分组/秒` },
            { label: '到达率 a', value: `${a.toFixed(0)} 分组/秒` },
            { label: '排队时延（M/M/1）', value: fmtTime(queueDelay), hint: 'ρ/(1−ρ) · L/R' },
            { label: '总时延（含发送）', value: fmtTime(avgTotalDelay), hint: 'L/R + 排队时延' },
            { label: '当前队列长度', value: `${Math.floor(queue)} / ${bufCap}`, hint: `已服务 ${served}，已丢弃 ${lost}` },
          ]}
        />

        {/* ---------------- 曲线图 ---------------- */}
        <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
          <div className="text-xs font-medium mb-1">排队时延随流量强度 ρ 的变化（M/M/1 排队论近似）</div>
          <svg viewBox={`0 0 ${CW} ${CH}`} className="w-full h-auto block" role="img" aria-label="排队时延随 rho 变化的曲线">
            {/* 分区背景 */}
            {zones.map((z) => (
              <g key={z.label}>
                <rect x={cx(z.from)} y={cPadT} width={cx(z.to) - cx(z.from)} height={CH - cPadT - cPadB} fill={z.fill} />
                <text
                  x={z.anchor === 'start' ? cx(z.from) + 6 : z.anchor === 'end' ? cx(z.to) - 6 : (cx(z.from) + cx(z.to)) / 2}
                  y={cPadT + 14}
                  textAnchor={z.anchor}
                  fontSize={10}
                  fill={z.color}
                >
                  {z.label}
                </text>
              </g>
            ))}
            {/* 网格 */}
            {[0, 5, 10, 15, 20].map((u) => (
              <g key={u}>
                <line x1={cPadL} y1={cy(u)} x2={CW - cPadR} y2={cy(u)} stroke="var(--border)" strokeWidth={0.6} />
                <text x={cPadL - 6} y={cy(u) + 3} textAnchor="end" fontSize={9} fill="var(--text-muted)">
                  {u === 0 ? '0' : `${u}×L/R`}
                </text>
              </g>
            ))}
            {[0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2].map((r) => (
              <g key={r}>
                <line x1={cx(r)} y1={CH - cPadB} x2={cx(r)} y2={CH - cPadB + 4} stroke="var(--border)" />
                <text x={cx(r)} y={CH - cPadB + 16} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
                  {r.toFixed(1)}
                </text>
              </g>
            ))}
            {/* 轴 */}
            <line x1={cPadL} y1={CH - cPadB} x2={CW - cPadR} y2={CH - cPadB} stroke="var(--text-muted)" strokeWidth={1} />
            <line x1={cPadL} y1={cPadT} x2={cPadL} y2={CH - cPadB} stroke="var(--text-muted)" strokeWidth={1} />
            {/* ρ=1 渐近线 */}
            <line x1={cx(1)} y1={cPadT} x2={cx(1)} y2={CH - cPadB} stroke={C_HIGH} strokeWidth={1.5} strokeDasharray="6 4" />
            <text x={cx(1) + 5} y={cPadT + 62} fontSize={10} fill={C_HIGH} fontWeight={600}>
              ρ = 1（渐近线）
            </text>
            {/* 曲线 */}
            <polyline points={curve} fill="none" stroke={C_CURVE} strokeWidth={2.5} />
            {/* 当前点 */}
            {rho < 1 ? (
              <>
                <line x1={cx(rho)} y1={cy(rho / (1 - rho))} x2={cx(rho)} y2={CH - cPadB} stroke={zone.color} strokeWidth={1} strokeDasharray="3 3" />
                <circle cx={cx(rho)} cy={cy(rho / (1 - rho))} r={5} fill={zone.color} stroke="var(--surface)" strokeWidth={1.5} />
              </>
            ) : (
              <>
                <line x1={cx(1)} y1={cPadT} x2={cx(rho)} y2={CH - cPadB} stroke={C_HIGH} strokeWidth={1.5} strokeDasharray="4 3" />
                <circle cx={cx(rho)} cy={cy(YMAX_U)} r={5} fill={C_HIGH} stroke="var(--surface)" strokeWidth={1.5} />
                <text x={cx(rho)} y={cy(YMAX_U) - 10} textAnchor="middle" fontSize={10} fill={C_HIGH} fontWeight={700}>
                  ∞
                </text>
              </>
            )}
            <text x={(cPadL + CW - cPadR) / 2} y={CH - 6} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
              流量强度 ρ = La/R
            </text>
            <text
              x={14}
              y={(cPadT + CH - cPadB) / 2}
              fontSize={11}
              fill="var(--text-muted)"
              transform={`rotate(-90 14 ${(cPadT + CH - cPadB) / 2})`}
              textAnchor="middle"
            >
              平均排队时延
            </text>
          </svg>
          <div className="text-[10px] muted mt-1 leading-relaxed">
            采用的近似：<span className="mono">M/M/1</span> 排队模型（到达为泊松过程、服务为指数分布、单一服务器）。平均排队时延
            <span className="mono"> E[W] = ρ/(1−ρ) · (1/μ) = ρ/(1−ρ) · (L/R)</span>
            ，纵轴以 L/R 为单位。PPT 第 68 页给出的是定性趋势（ρ≈0 小、ρ→1 剧增、ρ&gt;1 无穷），本图用该公式把趋势定量化。
          </div>
        </div>

        {/* ---------------- 队列可视化 ---------------- */}
        <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="font-medium">队列实时演化（每 tick = 一个分组的发送时延）</span>
            <span className="mono muted">
              已服务 {served} · 已丢弃 {lost} · tick {ticks}
            </span>
          </div>
          <div className="relative h-16 rounded-lg overflow-hidden" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            {/* 缓冲区刻度 */}
            {Array.from({ length: Math.min(bufCap, 40) }, (_, i) => {
              const filled = i < queue
              const over = queue > bufCap
              return (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${(i / Math.min(bufCap, 40)) * 100}%`,
                    bottom: 0,
                    width: `${100 / Math.min(bufCap, 40)}%`,
                    height: filled ? `${Math.min(100, (queue / Math.max(bufCap, 1)) * 100)}%` : '0%',
                    background: over ? C_HIGH : filled ? C_CURVE : 'transparent',
                    opacity: filled ? 0.9 : 0,
                  }}
                />
              )
            })}
            {/* 队列前沿 */}
            <div
              className="absolute top-0 bottom-0"
              style={{
                left: `calc(${Math.min(100, queuePct)}% - 1px)`,
                width: '2px',
                background: zone.color,
              }}
            />
            <div className="absolute top-1 right-2 text-[10px] mono" style={{ color: zone.color }}>
              {Math.floor(queue)} / {bufCap}
            </div>
            <div className="absolute bottom-1 left-2 text-[10px] muted">
              {rho >= 1 ? '队列只增不减 → 平均排队时延趋于无穷' : '队列有增有减 → 排队时延稳定在有限值'}
            </div>
          </div>
        </div>

        <StepNote tone={zone.color === C_LOW ? 'ok' : 'warn'} text={zone.text} />
        {rho >= 1 && (
          <StepNote
            tone="warn"
            text="到达速率超过服务速率，队列无限增长，平均时延趋于无穷。分组还会因为缓冲满而被丢弃（loss）——这就是“拥塞”的直接后果。"
          />
        )}
        <StepNote
          text={
            `计算过程：ρ = L·a/R = ${L} × ${a.toFixed(0)} / ${R.toExponential(3)} = ${rho.toFixed(4)}；` +
            `μ = R/L = ${serviceRate.toFixed(0)} 分组/秒；` +
            (rho < 1
              ? `E[W] = ${rho.toFixed(3)}/(1−${rho.toFixed(3)}) × ${fmtTime(tService)} = ${fmtTime(queueDelay)}。`
              : 'ρ ≥ 1 时 M/M/1 公式的分母为负或为零，说明稳态不存在——队列无界增长。')
          }
        />
      </div>
    </DemoFrame>
  )
}
