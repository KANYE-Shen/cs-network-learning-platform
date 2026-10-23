// ============================================================
// 存储转发与报文分段：端到端时延从 15 秒降到 5.002 秒
// 对应 PPT 第 47-48 页：store-and-forward → delay = 3L/R
//                    Message Segmenting → 5000 包 × 1500 bit → 5.002 sec
// ============================================================
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DemoFrame, PlayControls, ParamSlider, ResultGrid, StepNote } from './DemoKit'

/** 分组配色（固定色板，深浅主题均可读） */
const PKT_COLORS = ['#4873e8', '#e08a2e', '#16a078', '#8b5cf6', '#d64545', '#0ea5b7']

/** 参数边界 */
const L_MAX = 30 // Mbit
const L_MIN = 0.05 // Mbit
const M_MAX = 20000 // 个分组
const M_MIN = 100 // 个分组

/** 统一的时间格式化：自动切换 s / ms / μs */
function fmtTime(sec: number): string {
  if (!isFinite(sec)) return '∞'
  const a = Math.abs(sec)
  if (a === 0) return '0 s'
  if (a >= 1) return `${sec.toFixed(3)} s`
  if (a >= 1e-3) return `${(sec * 1e3).toFixed(3)} ms`
  if (a >= 1e-6) return `${(sec * 1e6).toFixed(3)} μs`
  return `${(sec * 1e9).toFixed(1)} ns`
}

/** 数字格式化（保留有效位） */
function fmtNum(x: number, digits = 3): string {
  if (!isFinite(x)) return '∞'
  const a = Math.abs(x)
  if (a >= 1e6) return `${(x / 1e6).toFixed(digits)} M`
  if (a >= 1e3) return `${(x / 1e3).toFixed(digits)} k`
  return x.toFixed(digits)
}

export default function StoreForwardDemo() {
  // ---------- 参数（三者始终保持 L = M × pktLen） ----------
  const [pktLen, setPktLen] = useState(1500) // 每分组长度 (bit)
  const [M, setM] = useState(5000) // 分组数
  const [Rmb, setRmb] = useState(1.5) // 链路速率 (Mbps)
  const [links, setLinks] = useState(3) // 链路条数 K（源→R1→…→目的）
  const [propMs, setPropMs] = useState(0) // 每跳传播时延 (ms)

  const Lmb = (M * pktLen) / 1e6 // 报文长度 (Mbit) —— 由 M 与 pktLen 推导
  const Lbits = M * pktLen
  const Rbps = Rmb * 1e6

  // M 的上限受报文长度上限约束：M × pktLen ≤ L_MAX
  const mMax = Math.max(M_MIN, Math.min(M_MAX, Math.floor((L_MAX * 1e6) / pktLen)))

  const setLmbFrom = (v: number) => {
    const m = Math.min(mMax, Math.max(M_MIN, Math.round((v * 1e6) / pktLen)))
    setM(m)
  }
  const setPktLenFrom = (p: number) => {
    setPktLen(p)
    // 若新长度会让报文超过上限，则同时收缩分组数
    const maxM = Math.max(M_MIN, Math.min(M_MAX, Math.floor((L_MAX * 1e6) / p)))
    setM((m) => Math.min(m, maxM))
  }
  const setMFrom = (m: number) => setM(Math.min(mMax, Math.max(M_MIN, m)))

  // ---------- 动画状态 ----------
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [tick, setTick] = useState(0) // 虚拟时钟，单位 = 一个分组的发送时延
  const [phase, setPhase] = useState(0) // 分组在链路上的滑动相位

  // ---------- 派生量 ----------
  const tTx = pktLen / Rbps // 单个分组的发送时延 (s)
  const tAll = Lbits / Rbps // 整个报文一次推完的发送时延 (s)
  const dProp = propMs / 1000 // 每跳传播时延 (s)
  const totalTicks = M + links - 1 // 流水线走完所需的分组发送时延个数

  // 不分段：K 条链路串行，每条都要推完整个报文
  const dNoSeg = links * tAll + links * dProp
  // 分段 + 流水线：M 个分组 + (K−1) 个流水线填充时延（K 条链路同时工作）
  const dSeg = (M + links - 1) * tTx + links * dProp
  const speedup = dSeg > 0 ? dNoSeg / dSeg : 0

  // 分组少时逐包精确播放，分组多时按整体推进
  const packetMode = M <= 40
  const stepSize = totalTicks <= 40 ? 1 : Math.ceil(totalTicks / 80)

  // ---------- 播放循环（间隔随速度调节） ----------
  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setTick((t) => Math.min(totalTicks, t + stepSize))
      setPhase((p) => (p + 0.08 * speed) % 1)
    }, 100 / speed)
    return () => clearInterval(id)
  }, [playing, stepSize, totalTicks, speed])

  useEffect(() => {
    if (tick >= totalTicks) setPlaying(false)
  }, [tick, totalTicks])

  const reset = useCallback(() => {
    setPlaying(false)
    setTick(0)
    setPhase(0)
  }, [])

  const stepFwd = useCallback(() => setTick((t) => Math.min(totalTicks, t + stepSize)), [stepSize, totalTicks])
  const stepBack = useCallback(() => setTick((t) => Math.max(0, t - stepSize)), [stepSize])
  const jumpEnd = useCallback(() => setTick(totalTicks), [totalTicks])

  // ---------- 流水线状态：每条链路上"正在传输"的分组 ----------
  // 链路 i（0 起）上的第 j 个分组占用时间区间 [j−1+i, j+i)
  // 即：同一时刻，下游链路携带的是编号更小的分组——这正是流水线
  const wave = useMemo(() => {
    const arr: { link: number; j: number; frac: number }[] = []
    for (let i = 0; i < links; i++) {
      const j = Math.floor(tick) - i + 1
      if (j >= 1 && j <= M) {
        arr.push({ link: i, j, frac: packetMode ? tick - Math.floor(tick) : phase })
      }
    }
    return arr
  }, [tick, links, M, packetMode, phase])

  // 流水线模式下额外画一列"更早的分组"，形成流动的分组流
  const stream = useMemo(() => {
    if (packetMode) return []
    const arr: { link: number; j: number; frac: number }[] = []
    for (let i = 0; i < links; i++) {
      const base = Math.floor(tick) - i + 1
      for (let k = 0; k < 4; k++) {
        const j = base - k
        if (j >= 1 && j <= M) arr.push({ link: i, j, frac: (phase + k * 0.25) % 1 })
      }
    }
    return arr
  }, [tick, links, M, packetMode, phase])

  // 已交付（到达目的主机）的分组数：第 j 个分组在 j−1+K 时刻到达
  const delivered = Math.max(0, Math.min(M, Math.floor(tick) - links + 1))
  const tNow = tick * tTx

  // ---------- 布局常量 ----------
  const W = 1000
  const padL = 64
  const padR = 64
  const nodeXs = useMemo(() => {
    const n = links + 1
    return Array.from({ length: n }, (_, i) => padL + (i * (W - padL - padR)) / (n - 1))
  }, [links])
  const nodeNames = useMemo(
    () => ['源', ...Array.from({ length: links - 1 }, (_, i) => `R${i + 1}`), '目的'],
    [links],
  )

  // ---------- 全程时间线 ----------
  const TL_W = 1000
  const TL_H = 150
  const tlPadL = 74
  const tlPadR = 24
  const tlTop = 46
  const tlRowH = 46
  const T = Math.max(dNoSeg, dSeg) * 1.03 || 1
  const tx = useCallback((t: number) => tlPadL + (t / T) * (TL_W - tlPadL - tlPadR), [T])

  // ---------- 流水线填充放大图（前 12 个分组） ----------
  const ZOOM_N = Math.min(M, 12)
  const ZOOM_W = 1000
  const ZOOM_H = 170
  const zPadL = 78
  const zPadR = 20
  const zTicks = ZOOM_N + links - 1
  const zx = useCallback((tk: number) => zPadL + (tk / Math.max(1, zTicks)) * (ZOOM_W - zPadL - zPadR), [zTicks])

  return (
    <DemoFrame
      title="存储转发与报文分段：延迟从 15 秒降到 5 秒"
      description="路由器必须先把整个分组收完（L/R 秒）才能转发到下一条链路——存储转发。报文分段后各链路可以流水并行，端到端时延从 3L/R 降到 (M+K−1)×(分组长度/R)。"
      controls={
        <>
          <PlayControls
            playing={playing}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onReset={reset}
            onStep={stepFwd}
            onStepBack={stepBack}
            canStepBack
            speed={speed}
            onSpeedChange={setSpeed}
          />
          <button onClick={jumpEnd} className="btn-ghost !px-2.5" title="直接跳到最后一个分组到达">
            ⏭ 末尾
          </button>
        </>
      }
      legend={[
        { color: PKT_COLORS[0], label: '正在传输的分组' },
        { color: '#d64545', label: '不分段（K·L/R）' },
        { color: '#16a078', label: '分段 + 流水线' },
      ]}
    >
      <div className="space-y-4">
        {/* ---------------- 参数区 ---------------- */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ParamSlider
            label="报文长度 L"
            value={Lmb}
            onChange={setLmbFrom}
            min={L_MIN}
            max={L_MAX}
            step={0.05}
            unit="Mbit"
            format={(v) => v.toFixed(2)}
            hint="L = M × 分组长度（联动）"
          />
          <ParamSlider
            label="链路速率 R"
            value={Rmb}
            onChange={setRmb}
            min={0.1}
            max={10}
            step={0.1}
            unit="Mbps"
            format={(v) => v.toFixed(1)}
          />
          <ParamSlider
            label="每分组长度"
            value={pktLen}
            onChange={setPktLenFrom}
            min={500}
            max={3000}
            step={50}
            unit="bit"
            hint="以太网典型 1500 bit"
          />
          <ParamSlider
            label="分组数 M"
            value={M}
            onChange={setMFrom}
            min={M_MIN}
            max={mMax}
            step={100}
            unit="个"
            hint={`M = L / 分组长度（联动，上限 ${mMax}）`}
          />
          <ParamSlider
            label="链路条数 K"
            value={links}
            onChange={setLinks}
            min={2}
            max={6}
            step={1}
            unit="条"
            hint="K=3 对应 PPT 的 3L/R；K=4 即 源→R1→R2→R3→目的"
          />
          <ParamSlider
            label="每跳传播时延"
            value={propMs}
            onChange={setPropMs}
            min={0}
            max={50}
            step={0.5}
            unit="ms"
            format={(v) => v.toFixed(1)}
          />
        </div>

        {/* ---------------- 流水线动画 ---------------- */}
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div
            className="px-3 py-2 text-xs flex flex-wrap items-center gap-x-4 gap-y-1"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}
          >
            <span className="mono" style={{ color: 'var(--text)' }}>
              t = {fmtTime(tNow)}
            </span>
            <span>已到达目的：{delivered} / {M} 个分组</span>
            <span>分组发送时延 = {fmtTime(tTx)}</span>
            <span className="muted">路由器必须收完整个分组才转发</span>
          </div>
          <svg viewBox={`0 0 ${W} 210`} className="w-full h-auto block" role="img" aria-label="分组在链路上的流水线动画">
            {/* 链路 */}
            {nodeXs.slice(0, -1).map((x, i) => (
              <g key={`link-${i}`}>
                <line
                  x1={x + 42}
                  y1={92}
                  x2={nodeXs[i + 1] - 42}
                  y2={92}
                  stroke="var(--border)"
                  strokeWidth={6}
                  strokeLinecap="round"
                />
                <text x={(x + 42 + nodeXs[i + 1] - 42) / 2} y={76} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
                  链路{i + 1} · {fmtTime(tTx)}
                </text>
              </g>
            ))}
            {/* 节点 */}
            {nodeXs.map((x, i) => {
              const isEnd = i === 0 || i === nodeXs.length - 1
              const label = nodeNames[i]
              const rx = isEnd ? 42 : 24
              return (
                <g key={`node-${i}`}>
                  {isEnd ? (
                    <rect
                      x={x - rx}
                      y={92 - 21}
                      width={rx * 2}
                      height={42}
                      rx={10}
                      fill="var(--surface-2)"
                      stroke="var(--border)"
                      strokeWidth={1.5}
                    />
                  ) : (
                    <circle cx={x} cy={92} r={rx} fill="var(--surface-2)" stroke="var(--border)" strokeWidth={1.5} />
                  )}
                  <text x={x} y={97} textAnchor="middle" fontSize={13} fontWeight={600} fill="var(--text)">
                    {label}
                  </text>
                  {/* 指示灯：该路由器是否已收完过完整分组 */}
                  {!isEnd && (
                    <circle cx={x + 14} cy={78} r={5} fill={tick >= i + 1 ? '#16a078' : 'var(--border)'} />
                  )}
                </g>
              )
            })}
            {/* 在途分组（分组多时画成一列流动的分组流） */}
            {stream.map((w) => {
              const x0 = nodeXs[w.link] + 42
              const x1 = nodeXs[w.link + 1] - 42
              const x = x0 + (x1 - x0) * w.frac
              return (
                <rect
                  key={`s-${w.link}-${w.j}`}
                  x={x - 9}
                  y={82}
                  width={18}
                  height={20}
                  rx={4}
                  fill={PKT_COLORS[w.j % PKT_COLORS.length]}
                  opacity={0.85}
                  stroke="var(--surface)"
                  strokeWidth={1}
                />
              )
            })}
            {wave.map((w) => {
              const x0 = nodeXs[w.link] + 42
              const x1 = nodeXs[w.link + 1] - 42
              const x = x0 + (x1 - x0) * w.frac
              const color = PKT_COLORS[w.j % PKT_COLORS.length]
              return (
                <g key={`pkt-${w.link}-${w.j}`}>
                  <rect x={x - 13} y={79} width={26} height={26} rx={6} fill={color} stroke="var(--surface)" strokeWidth={1.5} />
                  <text x={x} y={97} textAnchor="middle" fontSize={11} fontWeight={700} fill="#fff">
                    {w.j}
                  </text>
                </g>
              )
            })}
            {/* 底部说明 */}
            <text x={padL} y={150} fontSize={11} fill="var(--text-muted)">
              分组在链路上从头推到尾 = 一次发送时延；下一条链路要等上游把整个分组收完才能开始
            </text>
            <text x={padL} y={172} fontSize={11} fill="var(--text-muted)">
              流水线效果：第 i 条链路传第 j 个分组时，第 i+1 条链路正在传第 j−1 个（编号更小 = 出发更早）
            </text>
            <text x={padL} y={194} fontSize={11} fill="var(--text-muted)">
              {packetMode
                ? '分组数较少，逐包显示编号'
                : `分组数 ${M} 较多，动画以"分组流"的形式呈现；把 M 调到 40 以下可逐包看编号`}
            </text>
          </svg>
        </div>

        {/* ---------------- 结果 ---------------- */}
        <ResultGrid
          items={[
            { label: '不分段总时延 (K·L/R)', value: fmtTime(dNoSeg), hint: `${links} × ${fmtTime(tAll)}` },
            { label: '分段总时延（流水线）', value: fmtTime(dSeg), highlight: true, hint: '(M+K−1) × 分组发送时延' },
            { label: '加速比', value: `${speedup.toFixed(2)}×`, hint: '不分段 ÷ 分段' },
            { label: '分组数 M', value: `${M} 个`, hint: `${fmtNum(Lbits, 2)} bit ÷ ${pktLen} bit` },
            { label: '整个报文发送时延 L/R', value: fmtTime(tAll), hint: '不分段时一条链路就要这么久' },
            { label: '每跳传播时延', value: fmtTime(dProp), hint: `× ${links} 条链路` },
          ]}
        />

        {/* ---------------- 时间线对比 ---------------- */}
        <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
          <div className="text-xs font-medium mb-1">全程时间线对比（同一时间轴）</div>
          <svg viewBox={`0 0 ${TL_W} ${TL_H}`} className="w-full h-auto block" role="img" aria-label="不分段与分段的时间线对比">
            {/* 轴 */}
            <line x1={tlPadL} y1={tlTop + tlRowH * 2 - 6} x2={TL_W - tlPadR} y2={tlTop + tlRowH * 2 - 6} stroke="var(--border)" strokeWidth={1} />
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <g key={f}>
                <line
                  x1={tx(T * f)}
                  y1={tlTop + tlRowH * 2 - 6}
                  x2={tx(T * f)}
                  y2={tlTop + tlRowH * 2 - 2}
                  stroke="var(--border)"
                />
                <text x={tx(T * f)} y={tlTop + tlRowH * 2 + 10} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
                  {fmtTime(T * f)}
                </text>
              </g>
            ))}
            {/* 不分段 */}
            <text x={8} y={tlTop + 16} fontSize={11} fill="var(--text-muted)">
              不分段
            </text>
            {Array.from({ length: links }, (_, i) => {
              const t0 = i * tAll + i * dProp
              const t1 = (i + 1) * tAll + (i + 1) * dProp
              return (
                <rect
                  key={`ns-${i}`}
                  x={tx(t0)}
                  y={tlTop}
                  width={Math.max(1, tx(t1) - tx(t0))}
                  height={26}
                  rx={4}
                  fill="rgba(214,69,69,0.35)"
                  stroke="#d64545"
                />
              )
            })}
            <text
              x={tx(dNoSeg) + 6 > TL_W - tlPadR - 70 ? tx(dNoSeg) - 6 : tx(dNoSeg) + 6}
              y={tlTop + 18}
              textAnchor={tx(dNoSeg) + 6 > TL_W - tlPadR - 70 ? 'end' : 'start'}
              fontSize={11}
              fill="#d64545"
              fontWeight={600}
            >
              {fmtTime(dNoSeg)}
            </text>
            {/* 分段 */}
            <text x={8} y={tlTop + tlRowH + 16} fontSize={11} fill="var(--text-muted)">
              分段
            </text>
            {Array.from({ length: links }, (_, i) => {
              const t0 = i * tTx + i * dProp
              const t1 = (M + i) * tTx + (i + 1) * dProp
              return (
                <g key={`sg-${i}`}>
                  <rect
                    x={tx(t0)}
                    y={tlTop + tlRowH}
                    width={Math.max(1, tx(t1) - tx(t0))}
                    height={26}
                    rx={4}
                    fill="rgba(22,160,120,0.30)"
                    stroke="#16a078"
                  />
                  <circle cx={tx(t1)} cy={tlTop + tlRowH + 13} r={5} fill="#16a078" />
                </g>
              )
            })}
            <text
              x={tx(dSeg) + 6 > TL_W - tlPadR - 70 ? tx(dSeg) - 6 : tx(dSeg) + 6}
              y={tlTop + tlRowH + 18}
              textAnchor={tx(dSeg) + 6 > TL_W - tlPadR - 70 ? 'end' : 'start'}
              fontSize={11}
              fill="#16a078"
              fontWeight={600}
            >
              {fmtTime(dSeg)}
            </text>
          </svg>
        </div>

        {/* ---------------- 流水线填充放大图 ---------------- */}
        <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
          <div className="text-xs font-medium mb-1">流水线填充放大（前 {ZOOM_N} 个分组，每格 = 一个分组的发送时延）</div>
          <svg viewBox={`0 0 ${ZOOM_W} ${ZOOM_H}`} className="w-full h-auto block" role="img" aria-label="流水线填充阶梯图">
            {Array.from({ length: links }, (_, i) => {
              const y = 20 + i * 34
              return (
                <g key={`z-${i}`}>
                  <text x={8} y={y + 20} fontSize={11} fill="var(--text-muted)">
                    链路{i + 1}
                  </text>
                  <line x1={zPadL} y1={y + 12} x2={ZOOM_W - zPadR} y2={y + 12} stroke="var(--border)" strokeWidth={1} />
                  {Array.from({ length: ZOOM_N }, (_, j) => {
                    const s = j + i
                    const e = j + 1 + i
                    const color = PKT_COLORS[(j + 1) % PKT_COLORS.length]
                    return (
                      <g key={`zp-${i}-${j}`}>
                        <rect
                          x={zx(s)}
                          y={y}
                          width={Math.max(1, zx(e) - zx(s) - 1)}
                          height={24}
                          rx={3}
                          fill={color}
                          opacity={0.85}
                        />
                        {i === 0 && (
                          <text x={(zx(s) + zx(e)) / 2} y={y + 17} textAnchor="middle" fontSize={10} fill="#fff" fontWeight={600}>
                            {j + 1}
                          </text>
                        )}
                      </g>
                    )
                  })}
                </g>
              )
            })}
            <text x={zPadL} y={ZOOM_H - 12} fontSize={11} fill="var(--text-muted)">
              阶梯状：第 1 个分组要走完 {links} 条链路，第 2 个分组晚 1 格出发——流水线由此形成
            </text>
          </svg>
        </div>

        <StepNote
          tone={speedup > 1.2 ? 'ok' : 'warn'}
          text={
            speedup > 1.2
              ? `分段把端到端时延从 ${fmtTime(dNoSeg)} 降到 ${fmtTime(dSeg)}，约 ${speedup.toFixed(2)} 倍。原因不是“发得更快”，而是 K 条链路同时在传不同的分组（流水线），最后一个分组只多付了 K−1=${links - 1} 个分组发送时延。`
              : `当前参数下分段收益很小：M=${M}、K=${links}，分组发送时延 ${fmtTime(tTx)} 相对整个报文 ${fmtTime(tAll)} 已经很小，说明报文本来就被切得很碎。`
          }
        />

        {/* ---------------- 公式与验算 ---------------- */}
        <div
          className="rounded-lg px-4 py-3 mono text-xs leading-relaxed overflow-x-auto"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
        >
          <div className="font-semibold mb-1.5" style={{ color: 'var(--text)' }}>
            两条公式与数值验算
          </div>
          <div className="whitespace-pre">
{`不分段（存储转发，K 条链路串行）：
  d = K · L/R = ${links} × ${fmtNum(Lbits, 0)} bit / ${fmtNum(Rbps, 0)} bps = ${fmtTime(dNoSeg)}

分段 + 流水线：
  d = M · (pktLen/R) + (K−1) · (pktLen/R) + K · dprop
    = ${M} × ${fmtTime(tTx)} + ${links - 1} × ${fmtTime(tTx)} + ${links} × ${fmtTime(dProp)}
    = ${fmtTime(M * tTx)} + ${fmtTime((links - 1) * tTx)} + ${fmtTime(links * dProp)}
    = ${fmtTime(dSeg)}      （= (M+K−1) × pktLen/R = ${M + links - 1} × ${fmtTime(tTx)}）`}
          </div>
          <div className="mt-2 text-[11px] leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            注：流水线中 K 条链路是同时工作的，发送开销已经包含在 M × (pktLen/R) 里，
            不应再叠加 K × (pktLen/R)；否则会重复计入流水线填充而得到偏大的结果。
            PPT 的 5.002 s 正是 (5000 + 2) × 1 ms，即“5000×1 ms 推完全部分组 + 2×1 ms 流水线填充”。
          </div>
        </div>
      </div>
    </DemoFrame>
  )
}
