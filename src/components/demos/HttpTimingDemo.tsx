import { useEffect, useMemo, useState } from 'react'
import { DemoFrame, ParamSlider, PlayControls, ResultGrid, StepNote, useStepMachine } from './DemoKit'

/**
 * HTTP 响应时间：对比非持续 / 持续（无流水线）/ 持续 + 流水线三种模式的时间轴。
 *
 * 计算模型（与教材一致）：
 *   非持续：每个对象 = 2×RTT（建 TCP + 请求/应答）+ 传输时间
 *   持续无流水线：每个对象 = 1×RTT + 传输时间
 *   持续 + 流水线：全部对象 = 1×RTT + 全部传输时间
 */

type ModeKey = 'non' | 'persist' | 'pipe'

interface Seg {
  kind: 'rtt' | 'tx' | 'all'
  dur: number // ms
  label: string
  obj: number // 所属对象序号
}

interface Row {
  key: ModeKey
  title: string
  subtitle: string
  formula: string
  segs: Seg[]
  total: number
}

const FMT = (ms: number) => (ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${ms.toFixed(0)} ms`)

/**
 * 传输时间（ms）。
 * 单位推导：1 Kbit ÷ 1 Mbps = (1000 bit ÷ 1e6 bit/s) = 0.001 s = 1 ms
 * 所以 txMs(sizeKbit, rateMbps) = sizeKbit / rateMbps（毫秒）。
 */
const txMs = (sizeKbit: number, rateMbps: number) => sizeKbit / rateMbps

/** 轴刻度间隔：让整条时间轴大致落在 8 个刻度以内 */
function niceStep(max: number): number {
  const candidates = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000]
  for (const c of candidates) if (max / c <= 8) return c
  return candidates[candidates.length - 1]
}

export default function HttpTimingDemo() {
  const [rtt, setRtt] = useState(100) // ms
  const [rate, setRate] = useState(1) // Mbps
  const [htmlSize, setHtmlSize] = useState(100) // Kbit
  const [objCount, setObjCount] = useState(10) // 引用对象数（PPT 例题：10 个 jpeg）
  const [objSize, setObjSize] = useState(100) // Kbit

  const objects = useMemo(() => {
    const list: { name: string; size: number }[] = [{ name: 'base.html', size: htmlSize }]
    for (let i = 0; i < objCount; i++) list.push({ name: `object${i + 1}.jpg`, size: objSize })
    return list
  }, [htmlSize, objCount, objSize])

  const rows = useMemo<Row[]>(() => {
    const non: Seg[] = []
    const persist: Seg[] = []
    const pipe: Seg[] = []

    objects.forEach((o, i) => {
      const tx = txMs(o.size, rate)
      // ① 非持续：建 TCP（1 RTT）+ 请求/应答（1 RTT）+ 传输
      non.push({ kind: 'rtt', dur: rtt, label: `对象 ${i}：建立 TCP 连接（1 RTT）`, obj: i })
      non.push({ kind: 'rtt', dur: rtt, label: `对象 ${i}：HTTP 请求 / 应答（1 RTT）`, obj: i })
      non.push({ kind: 'tx', dur: tx, label: `对象 ${i}（${o.name}）：传输 ${o.size} Kbit`, obj: i })

      // ② 持续无流水线：首个对象含建 TCP，之后每个对象 1 RTT
      persist.push({
        kind: 'rtt',
        dur: rtt,
        label: i === 0 ? '建立 TCP 连接 + 首个请求/应答（1 RTT）' : `对象 ${i}：请求 / 应答（1 RTT）`,
        obj: i,
      })
      persist.push({ kind: 'tx', dur: tx, label: `对象 ${i}（${o.name}）：传输 ${o.size} Kbit`, obj: i })

      // ③ 流水线：先 1 个 RTT 把所有请求连发出去，然后服务器连续回传
      if (i === 0) {
        pipe.push({ kind: 'all', dur: rtt, label: '1 个 RTT 内把全部对象的请求连续发出', obj: i })
      }
      pipe.push({ kind: 'tx', dur: tx, label: `对象 ${i}（${o.name}）：传输 ${o.size} Kbit`, obj: i })
    })

    const sum = (arr: Seg[]) => arr.reduce((a, s) => a + s.dur, 0)

    return [
      {
        key: 'non',
        title: '① 非持续 HTTP',
        subtitle: '每个对象都要新建一条 TCP 连接',
        formula: `${objects.length}×(2×RTT) + Σ传输`,
        segs: non,
        total: sum(non),
      },
      {
        key: 'persist',
        title: '② 持续 HTTP（无流水线）',
        subtitle: '复用连接，但必须收到上一个响应才能发下一个请求',
        formula: `${objects.length}×(1×RTT) + Σ传输`,
        segs: persist,
        total: sum(persist),
      },
      {
        key: 'pipe',
        title: '③ 持续 HTTP + 流水线',
        subtitle: '请求不等应答，全部连发（HTTP/1.1 默认）',
        formula: '1×RTT + Σ传输',
        segs: pipe,
        total: sum(pipe),
      },
    ]
  }, [objects, rtt, rate])

  const steps = useMemo(
    () =>
      objects.map((o, i) => ({
        label: `对象 ${i}：${o.name}（${o.size} Kbit）`,
        detail: `传输时间 ${FMT(txMs(o.size, rate))}`,
      })),
    [objects, rate],
  )

  const machine = useStepMachine(steps, { intervalMs: 900 })
  const { index, setIndex } = machine

  useEffect(() => {
    if (index > steps.length - 1) setIndex(Math.max(0, steps.length - 1))
  }, [index, steps.length, setIndex])

  const maxTotal = Math.max(...rows.map((r) => r.total), 1)
  const tick = niceStep(maxTotal)

  // 每行每个片段的起始时刻
  const rowInfo = useMemo(() => {
    return rows.map((row) => {
      let t = 0
      const withStart = row.segs.map((s) => {
        const st = t
        t += s.dur
        return { ...s, start: st }
      })
      const objStart = (i: number) => withStart.find((s) => s.obj === i)?.start ?? 0
      return { row, withStart, objStart }
    })
  }, [rows])

  const elapsedOf = (info: (typeof rowInfo)[number]) => {
    if (index < 0 || index >= objects.length) return info.row.total
    return info.objStart(index)
  }

  const PLOT_X = 176
  const PLOT_W = 796
  const ROW_H = 44
  const rowTop = (i: number) => 46 + i * 78
  const axisY = rowTop(2) + ROW_H + 30

  const speedup = rows[0].total / Math.max(rows[2].total, 0.001)
  const saved = rows[0].total - rows[2].total

  return (
    <DemoFrame
      title="HTTP 响应时间：2RTT + 传输时间"
      description="PPT 例题：基础 HTML 文件引用 10 个 jpeg，共 11 个对象。改变 RTT、链路速率与对象大小，观察三种连接方式的响应时间差异。"
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
        { color: '#4873e8', label: 'RTT 往返（建立连接 / 请求应答）' },
        { color: '#16a078', label: '对象传输时间' },
        { color: '#c8ced8', label: '尚未到达的时间段' },
      ]}
    >
      <div className="space-y-4">
        {/* ---------- 参数 ---------- */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ParamSlider
            label="RTT（客户机 ↔ 服务器）"
            value={rtt}
            onChange={setRtt}
            min={10}
            max={500}
            step={10}
            unit="ms"
            hint="一次往返时延"
          />
          <ParamSlider
            label="客户机-服务器链路速率"
            value={rate}
            onChange={setRate}
            min={0.1}
            max={20}
            step={0.1}
            unit="Mbps"
            format={(v) => v.toFixed(1)}
            hint="传输时间 = 对象大小 ÷ 速率"
          />
          <ParamSlider
            label="引用对象数 N（另有 1 个基础 HTML）"
            value={objCount}
            onChange={setObjCount}
            min={0}
            max={20}
            unit="个"
            hint={`对象总数 ${objects.length}`}
          />
          <ParamSlider
            label="基础 HTML 文件大小"
            value={htmlSize}
            onChange={setHtmlSize}
            min={10}
            max={1000}
            step={10}
            unit="Kbit"
          />
          <ParamSlider
            label="每个引用对象大小"
            value={objSize}
            onChange={setObjSize}
            min={10}
            max={2000}
            step={10}
            unit="Kbit"
          />
        </div>

        {/* ---------- 时间轴 ---------- */}
        <div className="rounded-lg overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
          <svg viewBox={`0 0 1000 ${axisY + 26}`} style={{ minWidth: 760, width: '100%', height: 'auto' }}>
            {/* 1 个 RTT 的竖直参考线 */}
            <line
              x1={PLOT_X + (rtt / maxTotal) * PLOT_W}
              x2={PLOT_X + (rtt / maxTotal) * PLOT_W}
              y1={26}
              y2={axisY - 12}
              style={{ stroke: 'var(--brand)' }}
              strokeWidth={1.5}
              strokeDasharray="6 4"
            />
            <text
              x={PLOT_X + (rtt / maxTotal) * PLOT_W + 5}
              y={22}
              style={{ fill: 'var(--brand)', fontSize: 12, fontWeight: 600 }}
            >
              1 个 RTT
            </text>

            {rowInfo.map((info, ri) => {
              const elapsed = elapsedOf(info)
              const top = rowTop(ri)
              return (
                <g key={info.row.key}>
                  <text x={8} y={top + 15} style={{ fill: 'var(--text)', fontSize: 13, fontWeight: 600 }}>
                    {info.row.title}
                  </text>
                  <text x={8} y={top + 32} style={{ fill: 'var(--text-muted)', fontSize: 11 }}>
                    {info.row.subtitle}
                  </text>
                  <text x={8} y={top + 46} style={{ fill: 'var(--text-muted)', fontSize: 10 }}>
                    总响应 {FMT(info.row.total)}
                  </text>

                  {info.withStart.map((s, si) => {
                    const x = PLOT_X + (s.start / maxTotal) * PLOT_W
                    const w = Math.max((s.dur / maxTotal) * PLOT_W, 1.5)
                    const done = s.start + s.dur <= elapsed + 0.001
                    const isCur = !done && s.obj === index
                    const doneFill =
                      s.kind === 'tx' ? 'rgba(22,160,120,0.85)' : s.kind === 'all' ? 'rgba(72,115,232,0.9)' : 'rgba(72,115,232,0.55)'
                    const curFill = s.kind === 'tx' ? 'rgba(22,160,120,0.45)' : 'rgba(72,115,232,0.32)'
                    const fill = done ? doneFill : isCur ? curFill : 'var(--surface-2)'
                    const stroke = done || isCur ? (s.kind === 'tx' ? '#16a078' : '#4873e8') : 'var(--border)'
                    return (
                      <g key={si}>
                        <title>
                          {s.label} · {FMT(s.dur)}
                        </title>
                        <rect
                          x={x}
                          y={top}
                          width={w}
                          height={ROW_H}
                          rx={3}
                          style={{ fill, stroke }}
                          strokeWidth={isCur ? 1.8 : 1}
                          strokeDasharray={done || isCur ? undefined : '3 3'}
                        />
                        {w > 52 && (
                          <text
                            x={x + w / 2}
                            y={top + ROW_H / 2 + 4}
                            textAnchor="middle"
                            style={{
                              fill: done ? '#fff' : 'var(--text-muted)',
                              fontSize: 10,
                              pointerEvents: 'none',
                            }}
                          >
                            {s.kind === 'tx' ? FMT(s.dur) : 'RTT'}
                          </text>
                        )}
                      </g>
                    )
                  })}

                  {/* 全部对象到达标记 */}
                  <line
                    x1={PLOT_X + (info.row.total / maxTotal) * PLOT_W}
                    x2={PLOT_X + (info.row.total / maxTotal) * PLOT_W}
                    y1={top}
                    y2={top + ROW_H}
                    style={{ stroke: 'var(--text)' }}
                    strokeWidth={2}
                  />
                </g>
              )
            })}

            {/* 时间轴刻度 */}
            <line
              x1={PLOT_X}
              x2={PLOT_X + PLOT_W}
              y1={axisY - 12}
              y2={axisY - 12}
              style={{ stroke: 'var(--border)' }}
              strokeWidth={1}
            />
            {Array.from({ length: Math.floor(maxTotal / tick) + 1 }, (_, i) => i * tick).map((t) => {
              const x = PLOT_X + (t / maxTotal) * PLOT_W
              return (
                <g key={t}>
                  <line x1={x} x2={x} y1={axisY - 12} y2={axisY - 7} style={{ stroke: 'var(--border)' }} />
                  <text x={x} y={axisY + 4} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 10 }}>
                    {t >= 1000 ? `${t / 1000}s` : `${t}ms`}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        {/* ---------- 公式与结果 ---------- */}
        <div className="grid sm:grid-cols-3 gap-2">
          {rows.map((r) => (
            <div
              key={r.key}
              className="rounded-lg px-3 py-2"
              style={{
                background: r.key === 'pipe' ? 'rgba(50,85,219,0.10)' : 'var(--surface-2)',
                border: `1px solid ${r.key === 'pipe' ? 'var(--brand)' : 'var(--border)'}`,
              }}
            >
              <div className="text-[11px] font-semibold mb-0.5">{r.title}</div>
              <div className="text-[10px] muted mono leading-snug">{r.formula}</div>
              <div
                className="text-base font-semibold mono tabular-nums mt-1"
                style={{ color: r.key === 'pipe' ? 'var(--brand)' : undefined }}
              >
                {FMT(r.total)}
              </div>
              <div className="h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(r.total / maxTotal) * 100}%`,
                    background: r.key === 'pipe' ? 'var(--brand)' : 'var(--text-muted)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <ResultGrid
          items={[
            { label: '对象总数', value: `${objects.length} 个`, hint: '1 个 HTML + N 个引用对象' },
            { label: '非持续总响应时间', value: FMT(rows[0].total) },
            { label: '持续（无流水线）', value: FMT(rows[1].total) },
            {
              label: '持续 + 流水线',
              value: FMT(rows[2].total),
              highlight: true,
              hint: '1 个 RTT 拿到全部对象的请求',
            },
            { label: '相比非持续节省', value: FMT(saved) },
            { label: '加速比', value: `${speedup.toFixed(2)}×`, hint: '非持续 ÷ 流水线' },
          ]}
        />

        <StepNote
          tone={rows[2].total < rows[1].total ? 'ok' : 'warn'}
          text={`流水线模式只用 1 个 RTT 就把所有对象的请求发了出去，剩下的时间全部用于传输，因此总响应时间 = 1×RTT + 全部传输时间 = ${FMT(
            rows[2].total,
          )}。而持续但无流水线时，客户端必须等上一个响应回来才能发下一个请求，于是每个对象都要额外付出 1 个 RTT。`}
        />

        <div className="text-xs muted leading-relaxed">
          当前进度：{index < objects.length ? steps[index].label : '全部对象已到达'}。
          传输时间按 对象大小 ÷ 链路速率 计算：基础 HTML {FMT(txMs(htmlSize, rate))}，每个引用对象{' '}
          {FMT(txMs(objSize, rate))}。
        </div>
      </div>
    </DemoFrame>
  )
}
