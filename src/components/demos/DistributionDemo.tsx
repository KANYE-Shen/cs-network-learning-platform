import { useEffect, useMemo, useState } from 'react'
import { DemoFrame, ParamSlider, PlayControls, ResultGrid, StepNote, useStepMachine } from './DemoKit'

/**
 * 文件分发时间：C/S vs P2P。
 *
 *   Dc-s  = max{ N·F/u_s , F/d_min }
 *   DP2P  = max{ F/u_s , F/d_min , N·F/(u_s + Σu_i) }
 *
 * PPT 例题条件（SLIDE 102）：u = 1 Mbps，F/u = 1 hour → F = 3600 Mbit；
 * u_s = 10u = 10 Mbps，d_min ≥ u_s。
 */

const FMT_H = (sec: number) => {
  if (!isFinite(sec)) return '∞'
  const h = sec / 3600
  // ≥0.1 h 用小时，保证 C/S 与 P2P 在同一量纲下可直接比较
  if (h >= 0.1) return `${h.toFixed(2)} h`
  if (h * 60 >= 1) return `${(h * 60).toFixed(1)} min`
  return `${sec.toFixed(1)} s`
}

const MAX_N = 100

export default function DistributionDemo() {
  const [u, setU] = useState(1) // 单个客户端的上传速率 Mbps
  const [fileSizeMb, setFileSizeMb] = useState(3600) // Mbit
  const [us, setUs] = useState(10) // 服务器上传速率 Mbps
  const [dmin, setDmin] = useState(10) // 最慢客户端下载速率 Mbps
  const [peerUploadFactor, setPeerUploadFactor] = useState(1) // 每个客户端上传率 = factor × u

  const F = fileSizeMb // Mbit

  /** C/S 分发时间（秒） */
  const dcs = (N: number) => Math.max((N * F) / us, F / dmin)
  /** P2P 分发时间（秒） */
  const dp2p = (N: number) => {
    const sui = N * u * peerUploadFactor
    return Math.max(F / us, F / dmin, (N * F) / (us + sui))
  }

  const steps = useMemo(
    () =>
      Array.from({ length: MAX_N }, (_, i) => ({
        label: `N = ${i + 1} 个客户端`,
        detail: `C/S ${FMT_H(dcs(i + 1))} vs P2P ${FMT_H(dp2p(i + 1))}`,
      })),
    [F, us, dmin, u, peerUploadFactor],
  )

  const machine = useStepMachine(steps, { intervalMs: 260 })
  const { index, setIndex } = machine
  /** 唯一的 N：由步骤机驱动，卡片与曲线共用，绝不会互相打架 */
  const n = Math.min(index + 1, MAX_N)

  // 初始停在 PPT 例题的 N = 10
  const [booted, setBooted] = useState(false)
  useEffect(() => {
    if (!booted) {
      setIndex(9)
      setBooted(true)
    }
  }, [booted, setIndex])

  // ---------- 曲线 ----------
  const curve = useMemo(() => {
    const cs: { x: number; y: number }[] = []
    const p2p: { x: number; y: number }[] = []
    for (let i = 1; i <= MAX_N; i++) {
      cs.push({ x: i, y: dcs(i) })
      p2p.push({ x: i, y: dp2p(i) })
    }
    return { cs, p2p }
  }, [F, us, dmin, u, peerUploadFactor])

  const yMax = Math.max(...curve.cs.map((p) => p.y), ...curve.p2p.map((p) => p.y)) * 1.05

  const sui = n * u * peerUploadFactor

  const W = 620
  const H = 320
  const L = 66
  const R = 18
  const T = 20
  const B = 40
  const px = (x: number) => L + (x / MAX_N) * (W - L - R)
  const py = (y: number) => T + (1 - y / yMax) * (H - T - B)

  const csNow = dcs(n)
  const p2pNow = dp2p(n)
  const ratio = csNow / Math.max(p2pNow, 1e-9)
  const bottleneck = csNow >= (n * F) / us ? '服务器上传带宽' : '最慢客户端下载带宽'
  const bottleneckP2P =
    p2pNow >= F / us && p2pNow >= F / dmin
      ? '服务器上传带宽 / 最慢客户端'
      : p2pNow >= (n * F) / (us + sui)
        ? '聚合上传带宽'
        : '最慢客户端下载带宽'

  return (
    <DemoFrame
      title="C/S 与 P2P 文件分发时间"
      description="PPT 第 100~102 页。服务器上传带宽 u_s 是稀缺资源：C/S 下服务器要顺序发出 N 份拷贝；P2P 下每个 peer 既下载也上传，随 N 增长聚合带宽越来越大。"
      controls={
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
      }
      legend={[
        { color: '#dc7828', label: 'C/S：max{N·F/u_s, F/d_min}（线性增长）' },
        { color: '#4873e8', label: 'P2P：max{F/u_s, F/d_min, N·F/(u_s+Σu_i)}（增长更缓）' },
        { color: '#16a078', label: '当前 N 的取值位置' },
      ]}
    >
      <div className="space-y-4">
        {/* ---------- 参数 ---------- */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ParamSlider
            label="文件大小 F"
            value={fileSizeMb}
            onChange={setFileSizeMb}
            min={100}
            max={20000}
            step={100}
            unit="Mbit"
            format={(v) => v.toFixed(0)}
            hint="PPT 例题：F/u = 1 hour，F = 3600 Mbit"
          />
          <ParamSlider
            label="服务器上传速率 u_s"
            value={us}
            onChange={setUs}
            min={0.5}
            max={100}
            step={0.5}
            unit="Mbps"
            format={(v) => v.toFixed(1)}
            hint="PPT 例题：u_s = 10u = 10 Mbps"
          />
          <ParamSlider
            label="最慢客户端下载速率 d_min"
            value={dmin}
            onChange={setDmin}
            min={0.5}
            max={100}
            step={0.5}
            unit="Mbps"
            format={(v) => v.toFixed(1)}
            hint="PPT 条件：d_min ≥ u_s"
          />
          <ParamSlider
            label="单客户端上传速率 u"
            value={u}
            onChange={setU}
            min={0.1}
            max={50}
            step={0.1}
            unit="Mbps"
            format={(v) => v.toFixed(1)}
            hint="PPT 例题：u = 1 Mbps"
          />
          <ParamSlider
            label="客户端上传率倍率（Σu_i = N×u×倍率）"
            value={peerUploadFactor}
            onChange={setPeerUploadFactor}
            min={0}
            max={5}
            step={0.1}
            unit="×u"
            format={(v) => v.toFixed(1)}
            hint="0 表示 peer 只下载不上传（退化为 C/S）"
          />
        </div>

        {/* ---------- 公式 ---------- */}
        <div className="grid md:grid-cols-2 gap-3">
          <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: '#dc7828' }}>
              C/S：{FMT_H(csNow)}
            </div>
            <div className="text-xs mono">D(c-s) = max[ N·F/u_s , F/d_min ]</div>
            <div className="text-[11px] muted mt-1 leading-relaxed">
              服务器必须<strong>顺序</strong>发出 N 份拷贝：NF/u_s = {(n * F).toFixed(0)}/{us} ={' '}
              {FMT_H((n * F) / us)}；最慢客户端下载需 F/d_min = {FMT_H(F / dmin)}。
              取二者较大者，瓶颈是 <strong>{bottleneck}</strong>。
            </div>
          </div>
          <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-semibold mb-1" style={{ color: '#4873e8' }}>
              P2P：{FMT_H(p2pNow)}
            </div>
            <div className="text-xs mono">D(P2P) = max[ F/u_s , F/d_min , N·F/(u_s + Σu_i) ]</div>
            <div className="text-[11px] muted mt-1 leading-relaxed">
              服务器只需发出 1 份：F/u_s = {FMT_H(F / us)}；最慢客户端 F/d_min = {FMT_H(F / dmin)}；
              聚合上传 u_s + Σu_i = {us} + {sui.toFixed(1)} = {(us + sui).toFixed(1)} Mbps，
              N·F/(u_s+Σu_i) = {FMT_H((n * F) / (us + sui))}。瓶颈是 <strong>{bottleneckP2P}</strong>。
            </div>
          </div>
        </div>

        {/* ---------- 曲线 ---------- */}
        <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
            <div className="text-xs font-semibold">分发时间 vs 客户端数 N</div>
            <div className="text-[11px] muted">
              横轴 N（1~{MAX_N}） · 纵轴分发时间 · 竖线为当前 N = {n}
            </div>
          </div>
          <div className="overflow-x-auto">
            <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 480, width: '100%', height: 'auto' }}>
              {/* 纵轴刻度 */}
              {Array.from({ length: 5 }, (_, i) => i / 4).map((f) => {
                const v = f * yMax
                return (
                  <g key={f}>
                    <line x1={L} x2={W - R} y1={py(v)} y2={py(v)} style={{ stroke: 'var(--border)' }} strokeWidth={1} />
                    <text x={L - 6} y={py(v) + 3} textAnchor="end" style={{ fill: 'var(--text-muted)', fontSize: 9 }}>
                      {FMT_H(v)}
                    </text>
                  </g>
                )
              })}
              {/* 横轴刻度 */}
              {[1, 10, 20, 40, 60, 80, 100].map((t) => (
                <g key={t}>
                  <line x1={px(t)} x2={px(t)} y1={T} y2={H - B} style={{ stroke: 'var(--border)' }} strokeWidth={0.5} opacity={0.6} />
                  <text x={px(t)} y={H - B + 14} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 9 }}>
                    {t}
                  </text>
                </g>
              ))}

              {/* 曲线 */}
              <polyline
                points={curve.cs.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')}
                fill="none"
                style={{ stroke: '#dc7828' }}
                strokeWidth={2.5}
              />
              <polyline
                points={curve.p2p.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')}
                fill="none"
                style={{ stroke: '#4873e8' }}
                strokeWidth={2.5}
              />

              {/* 当前 N 竖线 + 交点 */}
              <line
                x1={px(n)}
                x2={px(n)}
                y1={T}
                y2={H - B}
                style={{ stroke: '#16a078' }}
                strokeWidth={1.5}
                strokeDasharray="4 3"
              />
              <circle cx={px(n)} cy={py(dcs(n))} r={4} style={{ fill: '#dc7828' }} />
              <circle cx={px(n)} cy={py(dp2p(n))} r={4} style={{ fill: '#4873e8' }} />
              <text x={px(n)} y={py(dcs(n)) - 8} textAnchor="middle" style={{ fill: '#dc7828', fontSize: 9.5, fontWeight: 600 }}>
                {FMT_H(dcs(n))}
              </text>
              <text
                x={px(n)}
                y={py(dp2p(n)) + 14}
                textAnchor="middle"
                style={{ fill: '#4873e8', fontSize: 9.5, fontWeight: 600 }}
              >
                {FMT_H(dp2p(n))}
              </text>

              <text x={W - R} y={H - 4} textAnchor="end" style={{ fill: 'var(--text-muted)', fontSize: 9 }}>
                客户端数 N
              </text>
              <text x={4} y={12} style={{ fill: 'var(--text-muted)', fontSize: 9 }}>
                分发时间
              </text>
            </svg>
          </div>
          <div className="mt-2">
            <ParamSlider
              label="在曲线上关注的 N"
              value={n}
              onChange={(v) => setIndex(v - 1)}
              min={1}
              max={MAX_N}
              unit="个"
            />
          </div>
        </div>

        <ResultGrid
          items={[
            { label: `C/S 分发时间（N=${n}）`, value: FMT_H(csNow), hint: '服务器要发 N 份拷贝' },
            { label: `P2P 分发时间（N=${n}）`, value: FMT_H(p2pNow), highlight: true, hint: 'peer 互相分发' },
            { label: 'P2P 加速比', value: `${ratio.toFixed(2)}×`, hint: 'C/S ÷ P2P' },
            { label: '聚合上传带宽', value: `${(us + sui).toFixed(1)} Mbps`, hint: `u_s ${us} + Σu_i ${sui.toFixed(1)}` },
            { label: '节省的时间', value: FMT_H(csNow - p2pNow) },
            { label: 'F/u_s（服务器发 1 份）', value: FMT_H(F / us) },
          ]}
        />

        <StepNote
          tone="ok"
          text={`N = ${n} 时，P2P 只需 ${FMT_H(p2pNow)}，比 C/S 的 ${FMT_H(csNow)} 快 ${ratio.toFixed(
            2,
          )} 倍。原因是 C/S 下服务器的 ${us} Mbps 必须串行发 ${n} 份拷贝（NF/u_s = ${FMT_H((n * F) / us)}，随 N 线性增长）；而 P2P 下每个 peer 下载的同时也上传一部分，聚合速率变成 u_s + Σu_i = ${(
            us + sui
          ).toFixed(1)} Mbps，N·F/(u_s+Σu_i) 这一项增长得慢得多，最终趋向 F/u_s = ${FMT_H(F / us)} 这个常数。`}
        />

        <div className="text-xs muted leading-relaxed">
          当前关注 N = {n}（C/S {FMT_H(dcs(n))}，P2P {FMT_H(dp2p(n))}）。
          把「客户端上传率倍率」拉到 0 可以看到 P2P 曲线与 C/S 曲线重合——因为这时 peer 只下载不上传，P2P 退化成了 C/S。
          点播放可以沿着曲线自动扫过 N = 1…{MAX_N}。
        </div>
      </div>
    </DemoFrame>
  )
}
