import { useMemo, useState } from 'react'
import {
  DemoFrame,
  ParamSelect,
  ParamSlider,
  ParamToggle,
  PlayControls,
  ResultGrid,
  StepNote,
  useStepMachine,
} from './DemoKit'

/**
 * Web 缓存（代理服务器）综合计算。
 *
 * PPT 给出的真实场景（SLIDE 54~57）：
 *   平均对象大小 100 Kbit；浏览器请求率 15 req/s；到浏览器的数据率 1.50 Mbps；
 *   到源站 RTT 2 sec；接入链路 1.54 Mbps；机构内部 LAN 1 Gbps。
 *
 * 三个方案：
 *   ① 无缓存        ：util = 1.50/1.54 ≈ 99%（教材记 99%），时延 = 2 sec + minutes + usecs
 *   ② 加宽接入链路  ：154 Mbps，util ≈ 0.97%，时延 = 2 sec + msecs（但很贵）
 *   ③ 本地缓存      ：命中率 h，util = (1-h)×1.50/1.54；h=0.4 时 = 0.58，
 *                     时延 = (1-h)×(~2 sec) + h×(~msecs) ≈ 1.2 sec（便宜）
 */

const CACHE_SERVICE = 0.005 // s，本地缓存命中时的服务开销（毫秒量级）

/** 利用率百分比的显示：小值保留更多位，避免 0.97% 被写成 1.0% */
const pct = (ratio: number) => {
  const v = ratio * 100
  if (v === 0) return '0%'
  return v < 10 ? `${v.toFixed(2)}%` : `${v.toFixed(1)}%`
}

interface Scheme {
  key: 'none' | 'fat' | 'cache'
  name: string
  desc: string
  util: number
  delay: number
  delayParts: { label: string; value: string }[]
  dataRate: number
  queue: number
  costMonthly: number
  costNote: string
}

export default function CacheDemo() {
  const [hitRate, setHitRate] = useState(0.4)
  const [accessRate, setAccessRate] = useState(1.54) // Mbps，现状接入链路
  const [fatRate, setFatRate] = useState(154) // Mbps，加宽后的接入链路
  const [lanRate, setLanRate] = useState(1000) // Mbps，机构内部 LAN
  const [reqRate, setReqRate] = useState(15) // req/s
  const [objKbit, setObjKbit] = useState(100) // Kbit
  const [rtt, setRtt] = useState(2) // s
  const [includeQueue, setIncludeQueue] = useState(false)
  const [bwPrice, setBwPrice] = useState(100) // 元 / Mbps / 月
  const [cacheCost, setCacheCost] = useState(800) // 元，缓存设备一次性成本

  const steps = useMemo(
    () => [
      { label: '方案① 无缓存', detail: '接入链路 1.54 Mbps，利用率逼近 100%' },
      { label: '方案② 加宽接入链路到 154 Mbps', detail: '利用率降到 1% 以下，代价是带宽费暴涨' },
      { label: '方案③ 安装本地缓存', detail: '命中率越高，接入链路越空闲，平均时延越低' },
    ],
    [],
  )
  const machine = useStepMachine(steps, { intervalMs: 1500 })
  const focus = machine.index

  // ---------- 基础量 ----------
  const objBits = objKbit * 1000
  const dataRate = (reqRate * objBits) / 1e6 // 到浏览器的数据率 Mbps
  const lanTx = objBits / (lanRate * 1e6) // LAN 上的发送时延（秒）

  /** 某接入速率下：链路能服务多少对象/秒 */
  const serviceRate = (rateMbps: number) => (rateMbps * 1e6) / objBits
  /** M/M/1 排队时延（秒）；利用率 ≥1 时视为发散 */
  const queueDelay = (rateMbps: number, load: number) => {
    const mu = serviceRate(rateMbps)
    if (load >= mu) return Infinity
    return 1 / (mu - load)
  }
  const txDelay = (rateMbps: number) => objBits / (rateMbps * 1e6)

  const schemes = useMemo<Scheme[]>(() => {
    // ① 无缓存
    const utilA = dataRate / accessRate
    const wqA = queueDelay(accessRate, reqRate)
    const txA = txDelay(accessRate)
    const delayA = rtt + (includeQueue ? wqA : 0) + txA + lanTx

    // ② 加宽接入链路
    const utilB = dataRate / fatRate
    const wqB = queueDelay(fatRate, reqRate)
    const txB = txDelay(fatRate)
    const delayB = rtt + (includeQueue ? wqB : 0) + txB + lanTx

    // ③ 本地缓存（命中率 h）
    const originLoad = (1 - hitRate) * reqRate
    const utilC = ((1 - hitRate) * dataRate) / accessRate
    const wqC = queueDelay(accessRate, originLoad)
    const txC = txDelay(accessRate)
    const cacheDelay = lanTx + CACHE_SERVICE
    const delaySimple = (1 - hitRate) * rtt + hitRate * cacheDelay
    const delayDetail = (1 - hitRate) * (rtt + wqC + txC) + hitRate * cacheDelay
    const delayC = includeQueue ? delayDetail : delaySimple

    return [
      {
        key: 'none',
        name: '① 无缓存',
        desc: '所有请求都到源站，接入链路满负荷',
        util: utilA,
        delay: delayA,
        dataRate,
        queue: wqA,
        delayParts: [
          { label: 'Internet 时延', value: `${rtt.toFixed(2)} s` },
          { label: '接入排队时延', value: includeQueue ? `${wqA.toFixed(2)} s` : '不计入（教材记为 minutes）' },
          { label: '接入发送时延', value: `${(txA * 1000).toFixed(1)} ms` },
          { label: 'LAN 时延', value: `${(lanTx * 1000).toFixed(2)} ms` },
        ],
        costMonthly: accessRate * bwPrice,
        costNote: '维持现状，无额外投入',
      },
      {
        key: 'fat',
        name: '② 加宽接入链路',
        desc: `${accessRate} Mbps → ${fatRate} Mbps`,
        util: utilB,
        delay: delayB,
        dataRate,
        queue: wqB,
        delayParts: [
          { label: 'Internet 时延', value: `${rtt.toFixed(2)} s` },
          { label: '接入排队时延', value: includeQueue ? `${(wqB * 1000).toFixed(2)} ms` : '≈ 0（不计入）' },
          { label: '接入发送时延', value: `${(txB * 1000).toFixed(2)} ms` },
          { label: 'LAN 时延', value: `${(lanTx * 1000).toFixed(2)} ms` },
        ],
        costMonthly: fatRate * bwPrice,
        costNote: '带宽费约为现状的 ' + (fatRate / accessRate).toFixed(0) + ' 倍，很贵',
      },
      {
        key: 'cache',
        name: '③ 本地缓存',
        desc: `命中率 h = ${(hitRate * 100).toFixed(0)}%`,
        util: utilC,
        delay: delayC,
        dataRate: (1 - hitRate) * dataRate,
        queue: wqC,
        delayParts: [
          { label: '未命中：(1-h)×源站时延', value: `${((1 - hitRate) * rtt).toFixed(3)} s` },
          { label: '命中：h×缓存时延', value: `${(hitRate * cacheDelay * 1000).toFixed(2)} ms` },
          {
            label: '教材简化式',
            value: `${(1 - hitRate).toFixed(1)}×(~${rtt.toFixed(1)} s) + ${hitRate.toFixed(1)}×(~msecs)`,
          },
        ],
        costMonthly: accessRate * bwPrice + cacheCost / 36,
        costNote: '带宽费不变 + 缓存设备（按 36 个月摊销），便宜',
      },
    ]
  }, [dataRate, accessRate, fatRate, reqRate, rtt, hitRate, includeQueue, lanTx, bwPrice, cacheCost])

  // ---------- 曲线数据：随命中率 h 变化 ----------
  const chartUtil = useMemo(() => {
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i <= 50; i++) {
      const h = i / 50
      pts.push({ x: h, y: ((1 - h) * dataRate) / accessRate })
    }
    return pts
  }, [dataRate, accessRate])

  const chartDelay = useMemo(() => {
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i <= 50; i++) {
      const h = i / 50
      pts.push({ x: h, y: (1 - h) * rtt + h * (lanTx + CACHE_SERVICE) })
    }
    return pts
  }, [rtt, lanTx])

  const utilNow = schemes[2].util
  const delayNow = schemes[2].delay
  const lanUtil = (dataRate / lanRate) * 100

  const utilMax = Math.max(1, schemes[0].util, schemes[1].util, utilNow) * 1.08
  const delayMax = Math.max(schemes[0].delay, schemes[1].delay, delayNow, rtt) * 1.12

  const focusScheme = schemes[Math.min(focus, 2)]

  return (
    <DemoFrame
      title="Web 缓存：链路利用率与时延计算"
      description="PPT 场景：平均对象 100 Kbit、请求率 15 次/秒、到浏览器数据率 1.50 Mbps、到源站 RTT 2 秒、接入链路 1.54 Mbps、LAN 1 Gbps。对比「无缓存 / 加宽接入链路 / 本地缓存」三种方案。"
      controls={
        <>
          <ParamSelect
            label="关注方案"
            value={String(focus)}
            onChange={(v) => machine.setIndex(Number(v))}
            options={[
              { value: '0', label: '① 无缓存' },
              { value: '1', label: '② 加宽接入链路' },
              { value: '2', label: '③ 本地缓存' },
            ]}
          />
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
        { color: '#4873e8', label: '本地缓存方案（随命中率变化）' },
        { color: '#16a078', label: '无缓存（水平线）' },
        { color: '#dc7828', label: '加宽接入链路（水平线）' },
      ]}
    >
      <div className="space-y-4">
        {/* ---------- 参数 ---------- */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ParamSlider
            label="缓存命中率 h"
            value={Math.round(hitRate * 100)}
            onChange={(v) => setHitRate(v / 100)}
            min={0}
            max={100}
            unit="%"
            hint="命中比例越高，接入链路越空闲"
          />
          <ParamSlider
            label="接入链路速率（现状）"
            value={accessRate}
            onChange={setAccessRate}
            min={0.5}
            max={20}
            step={0.02}
            unit="Mbps"
            format={(v) => v.toFixed(2)}
            hint="PPT 原值 1.54 Mbps"
          />
          <ParamSlider
            label="接入链路速率（加宽后）"
            value={fatRate}
            onChange={setFatRate}
            min={10}
            max={1000}
            step={1}
            unit="Mbps"
            format={(v) => v.toFixed(0)}
            hint="PPT 原值 154 Mbps"
          />
          <ParamSlider
            label="浏览器请求率"
            value={reqRate}
            onChange={setReqRate}
            min={1}
            max={50}
            unit="次/秒"
            hint="PPT 原值 15 次/秒"
          />
          <ParamSlider
            label="平均对象大小"
            value={objKbit}
            onChange={setObjKbit}
            min={10}
            max={1000}
            step={10}
            unit="Kbit"
            hint="PPT 原值 100 Kbit"
          />
          <ParamSlider
            label="到源站的 RTT"
            value={rtt}
            onChange={setRtt}
            min={0.1}
            max={10}
            step={0.1}
            unit="s"
            format={(v) => v.toFixed(1)}
            hint="PPT 原值 2 sec"
          />
          <ParamSlider
            label="机构内部 LAN 速率"
            value={lanRate}
            onChange={setLanRate}
            min={1}
            max={1000}
            step={1}
            unit="Mbps"
            format={(v) => v.toFixed(0)}
            hint="PPT 原值 1 Gbps；教材同时写“LAN 利用率 15%”，二者不自洽（见下方说明）"
          />
          <ParamSlider
            label="带宽月费单价（示意）"
            value={bwPrice}
            onChange={setBwPrice}
            min={10}
            max={500}
            step={10}
            unit="元/Mbps/月"
            format={(v) => v.toFixed(0)}
          />
          <ParamSlider
            label="本地缓存一次性成本（示意）"
            value={cacheCost}
            onChange={setCacheCost}
            min={0}
            max={20000}
            step={100}
            unit="元"
            format={(v) => v.toFixed(0)}
          />
          <ParamToggle
            label="总时延计入接入链路排队时延"
            value={includeQueue}
            onChange={setIncludeQueue}
            hint="关闭时按教材简化口径：2 sec + minutes + usecs"
          />
        </div>

        {/* ---------- 三个方案 ---------- */}
        <div className="grid md:grid-cols-3 gap-3">
          {schemes.map((s, i) => {
            const active = i === focus
            const over = s.util >= 1
            return (
              <div
                key={s.key}
                onClick={() => machine.setIndex(i)}
                className="rounded-lg p-3 cursor-pointer transition-all"
                style={{
                  background: active ? 'rgba(50,85,219,0.08)' : 'var(--surface-2)',
                  border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
                  boxShadow: active ? '0 0 0 1px var(--brand)' : undefined,
                }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <div className="text-sm font-semibold">{s.name}</div>
                  {active && (
                    <span className="text-[10px] chip" style={{ borderColor: 'var(--brand)', color: 'var(--brand)' }}>
                      当前
                    </span>
                  )}
                </div>
                <div className="text-[10px] muted mt-0.5">{s.desc}</div>

                <div className="mt-2">
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="muted">接入链路利用率</span>
                    <span className="mono font-semibold tabular-nums" style={{ color: over ? '#dc7828' : 'var(--brand)' }}>
                      {pct(s.util)}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: 'var(--border)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min(100, s.util * 100)}%`,
                        background: over ? '#dc7828' : s.key === 'cache' ? 'var(--brand)' : 'var(--text-muted)',
                      }}
                    />
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="muted">平均总时延</span>
                    <span className="mono font-semibold tabular-nums">{s.delay.toFixed(3)} s</span>
                  </div>
                </div>

                <div className="mt-2 space-y-0.5">
                  {s.delayParts.map((p) => (
                    <div key={p.label} className="flex items-baseline justify-between gap-2 text-[10px]">
                      <span className="muted">{p.label}</span>
                      <span className="mono tabular-nums text-right">{p.value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-2 pt-2" style={{ borderTop: '1px dashed var(--border)' }}>
                  <div className="flex items-baseline justify-between text-[11px]">
                    <span className="muted">月度成本（示意）</span>
                    <span className="mono font-semibold tabular-nums">¥{s.costMonthly.toFixed(0)}</span>
                  </div>
                  <div className="text-[10px] muted mt-0.5">{s.costNote}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* ---------- 曲线 ---------- */}
        <div className="grid lg:grid-cols-2 gap-3">
          <MiniChart
            title="接入链路利用率 vs 缓存命中率 h"
            xLabel="缓存命中率 h"
            yLabel="利用率"
            yMax={utilMax}
            unit="%"
            markerX={hitRate}
            series={[
              { label: '本地缓存', color: '#4873e8', pts: chartUtil, x: hitRate },
              { label: '无缓存', color: '#16a078', pts: [{ x: 0, y: schemes[0].util }, { x: 1, y: schemes[0].util }], dashed: true },
              { label: '加宽链路', color: '#dc7828', pts: [{ x: 0, y: schemes[1].util }, { x: 1, y: schemes[1].util }], dashed: true },
            ]}
            valueFormat={(v) => `${(v * 100).toFixed(0)}%`}
          />
          <MiniChart
            title="平均响应时延 vs 缓存命中率 h"
            xLabel="缓存命中率 h"
            yLabel="时延"
            yMax={delayMax}
            unit="s"
            markerX={hitRate}
            series={[
              { label: '本地缓存', color: '#4873e8', pts: chartDelay, x: hitRate },
              { label: '无缓存', color: '#16a078', pts: [{ x: 0, y: schemes[0].delay }, { x: 1, y: schemes[0].delay }], dashed: true },
              { label: '加宽链路', color: '#dc7828', pts: [{ x: 0, y: schemes[1].delay }, { x: 1, y: schemes[1].delay }], dashed: true },
            ]}
            valueFormat={(v) => `${v.toFixed(2)} s`}
          />
        </div>

        <ResultGrid
          items={[
            { label: '到浏览器的数据率', value: `${dataRate.toFixed(2)} Mbps`, hint: '15 次/秒 × 100 Kbit' },
            { label: '无缓存：接入链路利用率', value: pct(schemes[0].util), hint: '教材写作 99%（1.50/1.54）' },
            { label: '无缓存：LAN 利用率', value: `${lanUtil.toFixed(2)}%`, hint: '教材写作 15%' },
            { label: '缓存方案利用率', value: utilNow.toFixed(2), highlight: true, hint: '(1-h)×1.50/1.54 = 0.58' },
            { label: '缓存方案平均时延', value: `${delayNow.toFixed(2)} s`, highlight: true, hint: '(1-h)×~2 s + h×~ms ≈ 1.2 s' },
            { label: '加宽链路：利用率 / 时延', value: `${pct(schemes[1].util)} / ${schemes[1].delay.toFixed(2)} s` },
            { label: '月度成本比（缓存/加宽）', value: `${((schemes[2].costMonthly / Math.max(schemes[1].costMonthly, 1)) * 100).toFixed(1)}%` },
          ]}
        />

        <StepNote
          tone="ok"
          text={`当前命中率 h = ${(hitRate * 100).toFixed(0)}%：只有 ${((1 - hitRate) * 100).toFixed(0)}% 的请求需要占用接入链路，所以链路上的数据率降到 ${(
            (1 - hitRate) * dataRate
          ).toFixed(2)} Mbps，利用率 = ${((1 - hitRate) * dataRate).toFixed(2)}/${accessRate.toFixed(2)} = ${utilNow.toFixed(
            2,
          )}；平均时延 = ${(1 - hitRate).toFixed(1)}×(~${rtt.toFixed(1)} s) + ${hitRate.toFixed(1)}×(~毫秒) = ${delayNow.toFixed(
            2,
          )} s。教材结论是：装缓存比把接入链路加宽到 154 Mbps 更快（时延更低）而且更便宜——这里算出的 ${delayNow.toFixed(
            2,
          )} s 与加宽后的 ${schemes[1].delay.toFixed(2)} s 正好印证了这一点。`}
        />

        <div className="rounded-lg px-3 py-2 text-xs leading-relaxed" style={{ background: 'rgba(220,120,40,0.08)' }}>
          <strong style={{ color: '#dc7828' }}>关于教材数值的两处核对：</strong>
          <br />
          ① 接入链路利用率：按 PPT 给的 1.50 / 1.54 算出 <strong>{pct(dataRate / accessRate)}</strong>，
          PPT 记作 99%（四舍五入到整数仍成立）。缓存页 PPT 自己算的 0.6×1.50/1.54 = 0.58 与本页一致。
          <br />
          ② LAN 利用率：PPT 同时写了「1 Gbps LAN」和「LAN utilization: 15%」，但 1.50 Mbps / 1000 Mbps ={' '}
          <strong>{lanUtil.toFixed(3)}%</strong>，与 15% 对不上；15% 反而对应 10 Mbps 的 LAN（1.50/10 = 15%）。本页按 PPT
          明确给出的「1 Gbps」计算，并把 LAN 速率做成可调参数，你想复现教材的 15% 时把它调到 10 Mbps 即可。
        </div>

        <div className="text-xs muted leading-relaxed">
          当前关注：{focusScheme.name} —— {focusScheme.desc}。
          无缓存时接入链路利用率接近 100%，一旦流量有突发，排队时延会被急剧放大（教材写作 “2 sec + minutes + usecs”）；
          打开“计入排队时延”可以看到 M/M/1 近似下的具体数值（无缓存时约 {schemes[0].queue.toFixed(2)} s，已是发散趋势）。
        </div>
      </div>
    </DemoFrame>
  )
}

/* ------------------------------------------------------------------ */
/* 迷你折线图                                                          */
/* ------------------------------------------------------------------ */

interface Series {
  label: string
  color: string
  dashed?: boolean
  pts: { x: number; y: number }[]
  x?: number
}

function MiniChart({
  title,
  xLabel,
  yLabel,
  yMax,
  unit,
  markerX,
  series,
  valueFormat,
}: {
  title: string
  xLabel: string
  yLabel: string
  yMax: number
  unit: string
  markerX: number
  series: Series[]
  valueFormat: (v: number) => string
}) {
  const W = 520
  const H = 210
  const L = 54
  const R = 14
  const T = 18
  const B = 34
  const px = (x: number) => L + x * (W - L - R)
  const py = (y: number) => T + (1 - y / yMax) * (H - T - B)

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax)
  const xTicks = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
      <div className="text-xs font-semibold mb-1">{title}</div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 420, width: '100%', height: 'auto' }}>
          {yTicks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={py(t)} y2={py(t)} style={{ stroke: 'var(--border)' }} strokeWidth={1} />
              <text x={L - 6} y={py(t) + 3} textAnchor="end" style={{ fill: 'var(--text-muted)', fontSize: 9 }}>
                {valueFormat(t)}
              </text>
            </g>
          ))}
          {xTicks.map((t) => (
            <g key={t}>
              <line x1={px(t)} x2={px(t)} y1={T} y2={H - B} style={{ stroke: 'var(--border)' }} strokeWidth={0.5} opacity={0.6} />
              <text x={px(t)} y={H - B + 14} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 9 }}>
                {(t * 100).toFixed(0)}%
              </text>
            </g>
          ))}
          {/* 当前 h 标记线 */}
          <line
            x1={px(markerX)}
            x2={px(markerX)}
            y1={T}
            y2={H - B}
            style={{ stroke: 'var(--text)' }}
            strokeWidth={1}
            strokeDasharray="3 3"
            opacity={0.5}
          />

          {series.map((s) => {
            const mark =
              s.x !== undefined
                ? s.pts.reduce((best, p) => (Math.abs(p.x - s.x!) < Math.abs(best.x - s.x!) ? p : best), s.pts[0])
                : undefined
            return (
              <g key={s.label}>
                <polyline
                  points={s.pts.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')}
                  fill="none"
                  style={{ stroke: s.color }}
                  strokeWidth={2}
                  strokeDasharray={s.dashed ? '5 4' : undefined}
                />
                {mark && <circle cx={px(mark.x)} cy={py(mark.y)} r={3.5} style={{ fill: s.color }} />}
              </g>
            )
          })}

          <text x={W - R} y={H - 4} textAnchor="end" style={{ fill: 'var(--text-muted)', fontSize: 9 }}>
            {xLabel}
          </text>
          <text x={L - 44} y={12} style={{ fill: 'var(--text-muted)', fontSize: 9 }}>
            {yLabel}（{unit}）
          </text>
        </svg>
      </div>
    </div>
  )
}
