// ============================================================
// 四种时延：dproc / dqueue / dtrans = L/R / dprop = d/s
// 对应 PPT 第 65-66 页
// ============================================================
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DemoFrame, PlayControls, ParamSlider, ResultGrid, StepNote } from './DemoKit'

/** 时延配色（固定色板） */
const C_PROC = '#8b5cf6'
const C_QUEUE = '#e08a2e'
const C_TRANS = '#4873e8'
const C_PROP = '#16a078'
const C_PKT = '#4873e8'

function fmtTime(sec: number): string {
  if (!isFinite(sec)) return '∞'
  const a = Math.abs(sec)
  if (a === 0) return '0 s'
  if (a >= 1) return `${sec.toFixed(3)} s`
  if (a >= 1e-3) return `${(sec * 1e3).toFixed(3)} ms`
  if (a >= 1e-6) return `${(sec * 1e6).toFixed(3)} μs`
  return `${(sec * 1e9).toFixed(1)} ns`
}

/** 速率格式化 */
function fmtRate(bps: number): string {
  if (bps >= 1e9) return `${(bps / 1e9).toFixed(2)} Gbps`
  if (bps >= 1e6) return `${(bps / 1e6).toFixed(2)} Mbps`
  if (bps >= 1e3) return `${(bps / 1e3).toFixed(2)} kbps`
  return `${bps.toFixed(0)} bps`
}

interface Preset {
  key: string
  name: string
  desc: string
  L: number
  R: number
  d: number
  s: number
}

const PRESETS: Preset[] = [
  { key: 'sat', name: '卫星链路', desc: '3 Mbps、2.5 万 km 几何距离', L: 1500, R: 3e6, d: 25000, s: 3e5 },
  { key: 'dsl', name: 'ADSL 接入', desc: '3.6 Mbps、5 km 到局端（铜缆 200000 km/s）', L: 1500, R: 3.6e6, d: 5, s: 2e8 },
  { key: 'lan', name: '千兆局域网', desc: '1 Gbps、50 m 到对端主机', L: 1500, R: 1e9, d: 0.05, s: 2e8 },
]

export default function NodalDelayDemo() {
  // ---------- 参数 ----------
  const [L, setL] = useState(1500) // 分组长度 bit
  const [R, setR] = useState(1.5e6) // 链路速率 bps
  const [dist, setDist] = useState(200) // 距离 km
  const [speed, setSpeed] = useState(2e8) // 传播速度 m/s
  const [queueLen, setQueueLen] = useState(3) // 队列中已有分组数
  const [bufCap, setBufCap] = useState(10) // 缓冲区容量（分组）
  const [dprocUs, setDprocUs] = useState(5) // 处理时延 μs

  // ---------- 动画 ----------
  const [playing, setPlaying] = useState(false)
  const [speedMul, setSpeedMul] = useState(1)
  const [progress, setProgress] = useState(0) // 一个周期内的相位 0..1
  const raf = useRef<number | null>(null)
  const lastTs = useRef<number>(0)

  // ---------- 计算 ----------
  const dproc = dprocUs / 1e6
  const dtrans = L / R
  const dprop = (dist * 1000) / speed // km → m
  const dqueue = queueLen * dtrans // 前面 queueLen 个分组，每个要 L/R 才能推出去
  const total = dproc + dqueue + dtrans + dprop
  const overflow = queueLen > bufCap

  // 周期内各阶段的边界（归一化到 0..1）
  const bounds = useMemo(() => {
    const t = total > 0 ? total : 1
    return {
      t0: dproc / t,
      t1: (dproc + dqueue) / t,
      t2: (dproc + dqueue + dtrans) / t,
    }
  }, [dproc, dqueue, dtrans, total])

  // 当前阶段（由 progress 直接推导，避免状态不同步）
  const stage = progress < bounds.t0 ? 0 : progress < bounds.t1 ? 1 : progress < bounds.t2 ? 2 : 3

  // ---------- 动画循环（requestAnimationFrame，真实时间推进） ----------
  useEffect(() => {
    if (!playing) return
    lastTs.current = 0
    const CYCLE = 3400 // 一个完整周期的真实毫秒数
    const loop = (ts: number) => {
      if (!lastTs.current) lastTs.current = ts
      const dt = ts - lastTs.current
      lastTs.current = ts
      setProgress((p) => {
        const np = p + (dt / CYCLE) * speedMul
        return np >= 1 ? np - 1 : np
      })
      raf.current = requestAnimationFrame(loop)
    }
    raf.current = requestAnimationFrame(loop)
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current)
      raf.current = null
    }
  }, [playing, speedMul])

  const reset = useCallback(() => {
    setPlaying(false)
    setProgress(0)
  }, [])

  // 单步：跳到下一阶段的起点
  const stepOnce = useCallback(() => {
    setPlaying(false)
    setProgress((p) => {
      if (p < bounds.t0) return bounds.t0
      if (p < bounds.t1) return bounds.t1
      if (p < bounds.t2) return bounds.t2
      return 0
    })
  }, [bounds])

  // ---------- 链路布局：线性时间刻度（宽度 ∝ 时延） ----------
  const VW = 1000
  const VH = 260
  const senderX = 40
  const queueX = 140
  const linkX = 240
  const DIAG_X1 = 900 // 结点 B 之前的可用右边界
  const AVAIL = DIAG_X1 - linkX
  const MINW = 55

  const rawLink = AVAIL * (dtrans / (dtrans + dprop || 1))
  const rawProp = AVAIL - rawLink
  const linkPx = Math.max(MINW, Math.min(AVAIL - MINW, rawLink))
  const linkClipped = rawLink < MINW || rawLink > AVAIL - MINW
  const propClipped = rawProp < MINW
  const linkEnd = linkX + linkPx
  const nodeBX = DIAG_X1 + 30

  // 分组被推出的比例（0..1）：传输阶段线性增长
  const pushedFrac =
    stage === 0 ? 0 : stage === 1 ? Math.min(1, (progress - bounds.t0) / Math.max(1e-9, bounds.t1 - bounds.t0)) : 1

  // 分组在传播段的移动比例
  const moveFrac = stage >= 2 ? Math.min(1, (progress - bounds.t1) / Math.max(1e-9, bounds.t2 - bounds.t1)) : 0

  // ---------- 四块推导（可展开） ----------
  const [open, setOpen] = useState<string | null>('dtrans')
  const toggle = (k: string) => setOpen((o) => (o === k ? null : k))

  const parts = [
    {
      key: 'dproc',
      name: '处理时延 dproc',
      color: C_PROC,
      value: dproc,
      where: '在结点 A 中产生',
      formula: 'dproc = 处理一个分组所需的时间（查表、检验首部、查找出口）',
      steps: [`处理时延取值 ${dprocUs} μs`, '结点读取分组首部、决定下一跳', '通常只有几微秒甚至更小'],
    },
    {
      key: 'dqueue',
      name: '排队时延 dqueue',
      color: C_QUEUE,
      value: dqueue,
      where: '在结点 A 中产生（等待队首）',
      formula: 'dqueue ≈ q × (L/R)',
      steps: [
        `队列中前面还有 ${queueLen} 个分组`,
        `每个分组都要 ${fmtTime(dtrans)} 才能被推出去`,
        `dqueue = ${queueLen} × ${fmtTime(dtrans)} = ${fmtTime(dqueue)}`,
        overflow
          ? `⚠ 队列 ${queueLen} > 缓冲容量 ${bufCap}：分组会被丢弃`
          : `队列 ${queueLen} ≤ 缓冲容量 ${bufCap}：暂不丢包`,
      ],
    },
    {
      key: 'dtrans',
      name: '发送时延 dtrans',
      color: C_TRANS,
      value: dtrans,
      where: '在发送器产生',
      formula: 'dtrans = L / R',
      steps: [
        `L = ${L} bit，R = ${fmtRate(R)}`,
        `dtrans = ${L} / ${R.toExponential(3)} = ${fmtTime(dtrans)}`,
        '低速链路上 L/R 会变得很大——这就是“发送时延在低速链路上显著”',
      ],
    },
    {
      key: 'dprop',
      name: '传播时延 dprop',
      color: C_PROP,
      value: dprop,
      where: '在链路上产生',
      formula: 'dprop = d / s',
      steps: [
        `距离 d = ${dist} km = ${(dist * 1000).toFixed(0)} m`,
        `传播速度 s = ${(speed / 1000).toFixed(0)} km/s`,
        `dprop = ${(dist * 1000).toFixed(0)} / ${speed.toExponential(3)} = ${fmtTime(dprop)}`,
        '传播时延与“推出去”无关：比特一旦进入链路就已开始向远端移动',
      ],
    },
  ]

  return (
    <DemoFrame
      title="四种时延计算器：dproc + dqueue + dtrans + dprop"
      description="在结点 A 把一个分组送过一条链路到结点 B，总时延由四部分构成：处理、排队、发送（L/R）、传播（d/s）。发送时延在低速链路上可能占绝对主导。"
      controls={
        <PlayControls
          playing={playing}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onReset={reset}
          onStep={stepOnce}
          speed={speedMul}
          onSpeedChange={setSpeedMul}
        />
      }
      legend={[
        { color: C_PROC, label: '处理时延' },
        { color: C_QUEUE, label: '排队时延' },
        { color: C_TRANS, label: '发送时延 L/R' },
        { color: C_PROP, label: '传播时延 d/s' },
      ]}
    >
      <div className="space-y-4">
        {/* ---------------- 参数 ---------------- */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ParamSlider
            label="分组长度 L"
            value={L}
            onChange={setL}
            min={100}
            max={8000}
            step={100}
            unit="bit"
            hint="以太网典型 1500 bit"
          />
          <ParamSlider
            label="链路速率 R"
            value={R / 1e6}
            onChange={(v) => setR(v * 1e6)}
            min={0.5}
            max={1000}
            step={0.5}
            unit="Mbps"
            format={(v) => v.toFixed(1)}
            hint="低速链路 → 发送时延显著"
          />
          <ParamSlider
            label="链路距离 d"
            value={dist}
            onChange={setDist}
            min={0.05}
            max={40000}
            step={0.05}
            unit="km"
            format={(v) => (v < 1 ? (v * 1000).toFixed(0) + ' m' : v.toFixed(2))}
          />
          <ParamSlider
            label="传播速度 s"
            value={speed / 1000}
            onChange={(v) => setSpeed(v * 1000)}
            min={100}
            max={300000}
            step={100}
            unit="km/s"
            format={(v) => v.toFixed(0)}
            hint="光纤 ≈ 200000 km/s"
          />
          <ParamSlider
            label="队列中已有分组数 q"
            value={queueLen}
            onChange={setQueueLen}
            min={0}
            max={Math.max(1, bufCap)}
            step={1}
            unit="个"
          />
          <ParamSlider
            label="缓冲区容量"
            value={bufCap}
            onChange={setBufCap}
            min={1}
            max={40}
            step={1}
            unit="个分组"
          />
          <ParamSlider
            label="处理时延 dproc"
            value={dprocUs}
            onChange={setDprocUs}
            min={0}
            max={200}
            step={1}
            unit="μs"
          />
        </div>

        {/* ---------------- 场景预设 ---------------- */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs muted">典型场景：</span>
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => {
                setL(p.L)
                setR(p.R)
                setDist(p.d)
                setSpeed(p.s)
                reset()
              }}
              className="btn-ghost !px-2.5 !py-1 text-[11px]"
              title={p.desc}
            >
              {p.name}
            </button>
          ))}
          <span className="text-[10px] muted">对比不同场景下“发送时延 vs 传播时延”的相对大小</span>
        </div>

        {/* ---------------- 链路动画 ---------------- */}
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div
            className="px-3 py-2 text-xs flex flex-wrap items-center gap-x-4 gap-y-1"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}
          >
            <span className="font-semibold">一个分组的旅程</span>
            <span className="mono muted">
              阶段：{['① 排队等待', '② 链路传输（发送时延）', '③ 链路传播（传播时延）', '✓ 已到达结点 B'][stage]}
            </span>
            <span className="mono muted">总时延 {fmtTime(total)}</span>
          </div>
          <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto block" role="img" aria-label="分组从发送器经队列、链路到结点 B">
            {/* 发送器 */}
            <rect x={senderX} y={95} width={74} height={52} rx={8} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={1.5} />
            <text x={senderX + 37} y={118} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--text)">
              发送器
            </text>
            <text x={senderX + 37} y={133} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
              结点 A
            </text>

            {/* 队列 */}
            <rect x={queueX} y={62} width={64} height={118} rx={8} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={1.5} />
            <text x={queueX + 32} y={54} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
              队列 {queueLen}/{bufCap}
            </text>
            {Array.from({ length: Math.min(queueLen, 12) }, (_, i) => (
              <rect
                key={`q-${i}`}
                x={queueX + 12}
                y={72 + i * 8}
                width={40}
                height={6}
                rx={2}
                fill={overflow ? '#d64545' : C_QUEUE}
                opacity={0.85}
              />
            ))}
            {queueLen > 12 && (
              <text x={queueX + 32} y={172} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
                +{queueLen - 12}
              </text>
            )}
            {/* 队首的分组 */}
            <rect
              x={queueX + 8}
              y={stage === 0 ? 40 : 24}
              width={48}
              height={18}
              rx={4}
              fill={C_PKT}
              opacity={stage === 0 ? 1 : 0.25}
            />
            <text x={queueX + 32} y={53} textAnchor="middle" fontSize={9} fill="#fff">
              {L} bit
            </text>

            {/* 链路（宽度 ∝ dtrans） */}
            <line x1={linkX} y1={121} x2={linkEnd} y2={121} stroke="var(--border)" strokeWidth={10} strokeLinecap="round" />
            <line
              x1={linkX}
              y1={121}
              x2={linkX + linkPx * pushedFrac}
              y2={121}
              stroke={C_TRANS}
              strokeWidth={10}
              strokeLinecap="round"
            />
            <text x={linkX} y={104} fontSize={11} fill="var(--text-muted)">
              链路 R = {fmtRate(R)}
            </text>
            <text x={linkX} y={150} fontSize={11} fill={C_TRANS} fontWeight={600}>
              dtrans = L/R = {fmtTime(dtrans)}
            </text>
            <text x={linkX} y={168} fontSize={10} fill="var(--text-muted)">
              链路宽度按发送时延比例绘制{linkClipped ? '（已设最小宽度）' : ''}
            </text>

            {/* 传播段（宽度 ∝ dprop） */}
            <line x1={linkEnd} y1={121} x2={DIAG_X1} y2={121} stroke="var(--border)" strokeWidth={10} strokeLinecap="round" />
            <line
              x1={linkEnd}
              y1={121}
              x2={linkEnd + (DIAG_X1 - linkEnd) * moveFrac}
              y2={121}
              stroke={C_PROP}
              strokeWidth={10}
              strokeLinecap="round"
            />
            <text x={linkEnd} y={150} fontSize={11} fill={C_PROP} fontWeight={600}>
              dprop = d/s = {fmtTime(dprop)}
            </text>
            {propClipped && (
              <text x={linkEnd} y={168} fontSize={10} fill="var(--text-muted)">
                传播段已设最小宽度
              </text>
            )}

            {/* 结点 B */}
            <rect x={nodeBX - 32} y={95} width={74} height={52} rx={8} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={1.5} />
            <text x={nodeBX + 5} y={118} textAnchor="middle" fontSize={12} fontWeight={600} fill="var(--text)">
              结点 B
            </text>
            <text x={nodeBX + 5} y={133} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
              接收方
            </text>

            {/* 底部时间标尺（宽度 ∝ 各阶段耗时，总宽 = 总时延） */}
            {(() => {
              const scale = 660 / Math.max(total, 1e-12)
              let x = 240
              const segs = [
                { w: dproc, c: C_PROC, l: 'dproc' },
                { w: dqueue, c: C_QUEUE, l: 'dqueue' },
                { w: dtrans, c: C_TRANS, l: 'dtrans' },
                { w: dprop, c: C_PROP, l: 'dprop' },
              ]
              return (
                <g>
                  <text x={240} y={205} fontSize={10} fill="var(--text-muted)">
                    时间标尺（宽度 ∝ 各阶段耗时，总宽 = 总时延 {fmtTime(total)}）
                  </text>
                  {segs.map((sg) => {
                    const w = Math.max(3, sg.w * scale)
                    const el = (
                      <g key={sg.l}>
                        <rect x={x} y={212} width={w} height={16} fill={sg.c} opacity={0.85} />
                        {w > 34 && (
                          <text x={x + w / 2} y={224} textAnchor="middle" fontSize={9} fill="#fff">
                            {sg.l}
                          </text>
                        )}
                      </g>
                    )
                    x += w
                    return el
                  })}
                </g>
              )
            })()}
          </svg>
        </div>

        {/* ---------------- 四种时延分块 ---------------- */}
        <div className="grid sm:grid-cols-2 gap-2">
          {parts.map((p) => {
            const isOpen = open === p.key
            const pct = (p.value / total) * 100
            return (
              <div key={p.key} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <button
                  onClick={() => toggle(p.key)}
                  className="w-full text-left px-3 py-2 flex items-center gap-2"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: p.color }} />
                  <span className="text-xs font-semibold">{p.name}</span>
                  <span className="ml-auto mono text-xs tabular-nums" style={{ color: p.color }}>
                    {fmtTime(p.value)}
                  </span>
                  <span className="text-[10px] muted mono">{pct.toFixed(1)}%</span>
                  <span className="text-[10px] muted">{isOpen ? '▾' : '▸'}</span>
                </button>
                <div className="px-3 pb-2.5">
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: p.color }} />
                  </div>
                  {isOpen && (
                    <div className="mt-2 space-y-1">
                      <div className="text-[11px] mono" style={{ color: p.color }}>
                        {p.formula}
                      </div>
                      {p.steps.map((s, i) => (
                        <div key={i} className="text-[11px] muted leading-relaxed">
                          · {s}
                        </div>
                      ))}
                      <div className="text-[10px] muted">产生位置：{p.where}</div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* ---------------- 结果 ---------------- */}
        <ResultGrid
          items={[
            { label: '总时延 d', value: fmtTime(total), highlight: true, hint: 'dproc+dqueue+dtrans+dprop' },
            { label: '发送时延 L/R', value: fmtTime(dtrans), hint: `占比 ${((dtrans / total) * 100).toFixed(1)}%` },
            { label: '传播时延 d/s', value: fmtTime(dprop), hint: `占比 ${((dprop / total) * 100).toFixed(1)}%` },
            { label: '排队时延', value: fmtTime(dqueue), hint: `${queueLen} 个分组在前面` },
            { label: '处理时延', value: fmtTime(dproc), hint: '通常只有几微秒' },
            { label: '时延×带宽积', value: `${((total * R) / 8 / 1024).toFixed(2)} KB`, hint: '这段时间能发送多少数据' },
          ]}
        />

        {/* ---------------- 条形图 ---------------- */}
        <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
          <div className="text-xs font-medium mb-2">四种时延的占比对比（横轴为线性刻度）</div>
          <div className="space-y-1.5">
            {parts.map((p) => {
              const pct = (p.value / total) * 100
              const w = (p.value / Math.max(...parts.map((x) => x.value))) * 100
              return (
                <div key={p.key} className="flex items-center gap-2">
                  <span className="text-[10px] mono w-16 shrink-0" style={{ color: p.color }}>
                    {p.key}
                  </span>
                  <div className="flex-1 h-5 rounded" style={{ background: 'var(--surface-2)' }}>
                    <div
                      className="h-full rounded flex items-center justify-end pr-1.5"
                      style={{
                        width: `${Math.max(2, w)}%`,
                        background: p.color,
                        opacity: 0.85,
                      }}
                    >
                      {w > 14 && <span className="text-[9px] text-white mono">{pct.toFixed(1)}%</span>}
                    </div>
                  </div>
                  <span className="text-[10px] mono muted w-20 text-right shrink-0">{fmtTime(p.value)}</span>
                </div>
              )
            })}
          </div>
          <div className="text-[10px] muted mt-1.5">
            占比很小时条形几乎看不见——这正是要点：某个时延可以相对总时延小到可以忽略。
          </div>
        </div>

        <StepNote
          tone={dtrans / total > 0.5 ? 'warn' : 'info'}
          text={
            dtrans / total > 0.5
              ? `当前链路上发送时延占了总时延的 ${((dtrans / total) * 100).toFixed(1)}%——低速链路（${fmtRate(R)}）上 L/R 非常大，发送时延成为主导因素。把 R 提高 10 倍，总时延立刻下降。`
              : `当前链路上发送时延只占 ${((dtrans / total) * 100).toFixed(1)}%，传播时延占 ${((dprop / total) * 100).toFixed(1)}%。试着切到“卫星链路”或“ADSL 接入”预设，看看发送时延如何成为主导。`
          }
        />
        {overflow && (
          <StepNote
            tone="warn"
            text={`队列中已有 ${queueLen} 个分组，超过缓冲区容量 ${bufCap}：多出的分组会被丢弃（loss）。队列越长，排队时延越大——这正是拥塞的表现。`}
          />
        )}
        <StepNote
          text="要点：dtrans = L/R 只取决于“分组多长”和“链路多快”；dprop = d/s 只取决于“多远”和“多快”。两者互不影响：再快的链路也要 L/R 才能把一个分组推出去，再远的距离也挡不住比特在链路里以光速前进。"
        />
      </div>
    </DemoFrame>
  )
}
