// ============================================================
// 五层封装与解封装
// 对应 PPT 第 86-97 页：message → segment → datagram → frame
// H5 应用层 / H4 运输层 / H3 网络层 / H2 链路层 / T2 链路层尾部
// ============================================================
import { useEffect, useMemo, useState } from 'react'
import { DemoFrame, PlayControls, ParamSlider, ResultGrid, StepNote, useStepMachine } from './DemoKit'

type Dir = 'send' | 'recv'

/** 固定的首部字节数（PPT 常用值） */
const H4_BYTES = 20 // TCP 最小首部
const H3_BYTES = 20 // IPv4 首部
const H2_BYTES = 14 // 以太网首部
const T2_BYTES = 4 // 以太网 FCS

/** 各层配色 */
const LAYERS = [
  { key: 'app', idx: 5, name: '应用层', pdu: 'message（报文）', color: '#16a078', desc: '应用协议产生应用程序数据' },
  { key: 'transport', idx: 4, name: '运输层', pdu: 'segment（报文段）', color: '#4873e8', desc: 'TCP/UDP 加 H4' },
  { key: 'network', idx: 3, name: '网络层', pdu: 'datagram（数据报）', color: '#8b5cf6', desc: 'IP 加 H3' },
  { key: 'link', idx: 2, name: '链路层', pdu: 'frame（帧）', color: '#e08a2e', desc: '以太网加 H2 与 T2' },
] as const

export default function EncapsulationDemo() {
  const [dir, setDir] = useState<Dir>('send')
  const [appData, setAppData] = useState(800) // 应用程序数据字节
  const [h5Bytes, setH5Bytes] = useState(0) // 应用层首部 H5 字节数

  // ---------- 步骤机 ----------
  // 发送方向：应用层 → 运输层 → 网络层 → 链路层 → 物理层
  // 接收方向：物理层 → 数据链路层 → 网络层 → 运输层 → 应用层
  const steps = useMemo(() => {
    const arr: { label: string; detail?: string }[] = []
    if (dir === 'send') {
      arr.push({ label: '应用层产生 message', detail: `应用程序数据 ${appData} 字节，加 H5 应用层首部` })
      arr.push({ label: '运输层加 H4 → segment', detail: `加 ${H4_BYTES} 字节 TCP 首部` })
      arr.push({ label: '网络层加 H3 → datagram', detail: `加 ${H3_BYTES} 字节 IP 首部` })
      arr.push({ label: '链路层加 H2/T2 → frame', detail: `加 ${H2_BYTES} 字节以太首部 + ${T2_BYTES} 字节 FCS` })
      arr.push({ label: '物理层发送比特流', detail: 'frame 变成比特流在线路上传输' })
    } else {
      arr.push({ label: '物理层收到比特流', detail: '交给数据链路层' })
      arr.push({ label: '数据链路层剥掉 H2 和 T2', detail: '把帧的数据部分交给网络层' })
      arr.push({ label: '网络层剥掉 H3', detail: '把分组的数据部分交给运输层' })
      arr.push({ label: '运输层剥掉 H4', detail: '把报文段的数据部分交给应用层' })
      arr.push({ label: '应用层剥掉 H5', detail: '应用程序数据交给应用进程' })
    }
    return arr
  }, [dir, appData])

  const machine = useStepMachine(steps, { intervalMs: 1100 })
  const { index, setIndex, playing, setPlaying, speed, setSpeed, reset, step, stepBack } = machine

  useEffect(() => {
    if (index >= steps.length) setIndex(steps.length - 1)
  }, [index, steps.length, setIndex])

  const switchDir = (d: Dir) => {
    setDir(d)
    reset()
  }

  // ---------- 统一的“当前 PDU 层级”模型 ----------
  // level = 0 裸应用程序数据 / 1 message / 2 segment / 3 datagram / 4 frame / 5 比特流
  // 发送方向 level 随层次下降而增大；接收方向 level 随剥除而减小——两者共用同一套内容规则
  const level = dir === 'send' ? Math.min(index + 1, 5) : Math.min(Math.max(4 - index, 0), 5)

  // 各层 PDU 的字节数
  const sizes = useMemo(() => {
    const app = appData
    const message = app + h5Bytes // H5 + M
    const segment = message + H4_BYTES // H4 + H5 + M
    const datagram = segment + H3_BYTES // H3 + H4 + H5 + M
    const frame = datagram + H2_BYTES + T2_BYTES // H2 + H3 + H4 + H5 + M + T2
    const overhead = h5Bytes + H4_BYTES + H3_BYTES + H2_BYTES + T2_BYTES
    return { app, message, segment, datagram, frame, overhead }
  }, [appData, h5Bytes])

  // ---------- 当前层级的首部开销（随层级变化） ----------
  const curOverhead = useMemo(() => {
    let o = 0
    if (level >= 1) o += h5Bytes
    if (level >= 2) o += H4_BYTES
    if (level >= 3) o += H3_BYTES
    if (level >= 4) o += H2_BYTES + T2_BYTES
    return o
  }, [level, h5Bytes])

  // ---------- 当前可见的 PDU 片段（外 → 内） ----------
  // 首部存在规则（两个方向统一）：H2/T2 在 level≥4，H3 在 level≥3，H4 在 level≥2，H5 在 level≥1
  const stack = useMemo(() => {
    type Seg = { kind: string; label: string; bytes: number; color: string }
    const out: Seg[] = []
    if (level >= 4) out.push({ kind: 'H2', label: 'H2 链路层首部', bytes: H2_BYTES, color: LAYERS[3].color })
    if (level >= 3) out.push({ kind: 'H3', label: 'H3 网络层首部', bytes: H3_BYTES, color: LAYERS[2].color })
    if (level >= 2) out.push({ kind: 'H4', label: 'H4 运输层首部', bytes: H4_BYTES, color: LAYERS[1].color })
    if (level >= 1) out.push({ kind: 'H5', label: 'H5 应用层首部', bytes: h5Bytes, color: LAYERS[0].color })
    out.push({ kind: 'DATA', label: '应用程序数据', bytes: appData, color: 'var(--text-muted)' })
    if (level >= 4) out.push({ kind: 'T2', label: 'T2 链路层尾部（FCS）', bytes: T2_BYTES, color: LAYERS[3].color })
    return out
  }, [level, appData, h5Bytes])

  // ---------- 当前 PDU 名称与总字节数 ----------
  const currentPdu = useMemo(() => {
    if (level >= 5) return { name: '比特流', bytes: sizes.frame }
    if (level === 4) return { name: 'frame（链路层帧）', bytes: sizes.frame }
    if (level === 3) return { name: 'datagram（网络层数据报）', bytes: sizes.datagram }
    if (level === 2) return { name: 'segment（运输层报文段）', bytes: sizes.segment }
    if (level === 1) return { name: 'message（应用层报文）', bytes: sizes.message }
    return { name: '应用程序数据', bytes: sizes.app }
  }, [level, sizes])

  // ---------- 五层栈的“已完成 / 当前处理”状态 ----------
  const layerDone = (li: number) => (dir === 'send' ? level >= li + 1 : level <= li)
  const layerActive = (li: number) => (dir === 'send' ? level === li + 1 : level === li + 1)

  // ---------- 步骤说明 ----------
  const note = useMemo(() => {
    if (dir === 'send') {
      const map = [
        `应用层把 ${appData} 字节数据交给运输层，加上 H5 应用层首部（${h5Bytes} 字节）后形成 ${sizes.message} 字节的 message。`,
        `运输层加 H4（${H4_BYTES} 字节 TCP 首部）→ ${sizes.segment} 字节的 segment。首部里带源/目的端口、序号与校验和，让接收方能把字节流交给正确的应用。`,
        `网络层加 H3（${H3_BYTES} 字节 IP 首部）→ ${sizes.datagram} 字节的 datagram。首部里带源/目的 IP 地址，中间路由器据此逐跳转发。`,
        `链路层加 H2（${H2_BYTES} 字节以太首部）与 T2（${T2_BYTES} 字节 FCS）→ ${sizes.frame} 字节的 frame。MAC 地址只对“这一跳”有意义，FCS 用于差错检测。`,
        `物理层把整个 frame 变成比特流推到线路上。每经过一台路由器，H2 和 T2 会被剥掉并换上新的 H2/T2——只有端系统才完整经历五层。`,
      ]
      return { tone: 'info' as const, text: map[Math.min(index, 4)] }
    }
    const map = [
      `物理层收到比特流，交给数据链路层处理。此时完整的一帧 = H2 + H3 + H4 + H5 + 数据 + T2，共 ${sizes.frame} 字节。`,
      `数据链路层剥掉 H2 和 T2（${H2_BYTES + T2_BYTES} 字节），把帧的数据部分交给网络层。此时剩下 H3 + H4 + H5 + 数据，共 ${sizes.datagram} 字节。`,
      `网络层剥掉 H3（${H3_BYTES} 字节），把分组的数据部分交给运输层。剩余 H4 + H5 + 数据，共 ${sizes.segment} 字节。`,
      `运输层剥掉 H4（${H4_BYTES} 字节），把报文段的数据部分交给应用层。剩余 H5 + 数据，共 ${sizes.message} 字节。`,
      `应用层剥掉 H5，把 ${appData} 字节应用程序数据交给应用进程——发送方和接收方的应用拿到的数据完全一样，中间的所有首部都被剥掉了。`,
    ]
    return { tone: 'info' as const, text: map[Math.min(index, 4)] }
  }, [dir, index, appData, h5Bytes, sizes])

  // ---------- 尺寸可视化 ----------
  const totalMax = Math.max(sizes.frame, 1)
  const barW = 520
  const scale = barW / totalMax

  return (
    <DemoFrame
      title="五层封装与解封装"
      description="发送方向逐层加首部（message → segment → datagram → frame），接收方向逐层剥除。每加一层，包就大一层——这就是“封装开销”。"
      controls={
        <>
          <PlayControls
            playing={playing}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onReset={reset}
            onStep={step}
            onStepBack={stepBack}
            canStepBack
            speed={speed}
            onSpeedChange={setSpeed}
          />
          <div className="inline-flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            <button
              onClick={() => switchDir('send')}
              className="px-2.5 py-1 text-xs font-medium"
              style={dir === 'send' ? { background: 'var(--brand)', color: '#fff' } : { background: 'var(--surface-2)', color: 'var(--text-muted)' }}
            >
              发送 ↓
            </button>
            <button
              onClick={() => switchDir('recv')}
              className="px-2.5 py-1 text-xs font-medium"
              style={dir === 'recv' ? { background: 'var(--brand)', color: '#fff' } : { background: 'var(--surface-2)', color: 'var(--text-muted)' }}
            >
              接收 ↑
            </button>
          </div>
        </>
      }
      legend={[
        { color: LAYERS[0].color, label: 'H5 应用层首部' },
        { color: LAYERS[1].color, label: `H4 运输层首部 (${H4_BYTES}B)` },
        { color: LAYERS[2].color, label: `H3 网络层首部 (${H3_BYTES}B)` },
        { color: LAYERS[3].color, label: `H2 链路层首部 (${H2_BYTES}B) + T2 (${T2_BYTES}B)` },
      ]}
    >
      <div className="space-y-4">
        {/* ---------------- 参数 ---------------- */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <ParamSlider
            label="应用程序数据长度"
            value={appData}
            onChange={setAppData}
            min={100}
            max={1400}
            step={20}
            unit="byte"
            format={(v) => v.toFixed(0)}
            hint="以太网 MTU = 1500 字节，减去各层首部后留给应用的空间"
          />
          <ParamSlider
            label="H5 应用层首部长度"
            value={h5Bytes}
            onChange={setH5Bytes}
            min={0}
            max={64}
            step={2}
            unit="byte"
            hint="取决于应用协议；默认按 0 字节计"
          />
          <div className="text-[11px] muted leading-relaxed self-end pb-1">
            固定首部：TCP {H4_BYTES} B、IPv4 {H3_BYTES} B、以太网 {H2_BYTES} B + FCS {T2_BYTES} B
          </div>
        </div>

        {/* ---------------- 五层结构图 ---------------- */}
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div
            className="px-3 py-2 text-xs flex flex-wrap items-center gap-x-4 gap-y-1"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}
          >
            <span className="font-semibold">{dir === 'send' ? '主机 1：逐层封装' : '主机 2：逐层解封装'}</span>
            <span className="mono muted">当前 PDU：{currentPdu.name}</span>
            <span className="mono muted">{currentPdu.bytes} byte</span>
          </div>

          <div className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-2">
              {/* 主机 1 */}
              <div className="shrink-0 text-center w-16 sm:w-20">
                <div
                  className="rounded-lg px-2 py-3 text-[11px] font-semibold"
                  style={{
                    background: dir === 'send' ? 'rgba(50,85,219,0.12)' : 'var(--surface-2)',
                    border: `1px solid ${dir === 'send' ? 'var(--brand)' : 'var(--border)'}`,
                  }}
                >
                  主机 1
                </div>
                <div className="text-[10px] muted mt-1">发送方</div>
              </div>

              {/* 五层栈 */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col-reverse gap-1">
                  {LAYERS.map((l, li) => {
                    const done = layerDone(li)
                    const active = layerActive(li)
                    const bytes =
                      l.key === 'app'
                        ? h5Bytes
                        : l.key === 'transport'
                          ? H4_BYTES
                          : l.key === 'network'
                            ? H3_BYTES
                            : H2_BYTES
                    return (
                      <div
                        key={l.key}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-all"
                        style={{
                          background: done ? `${l.color}1f` : 'var(--surface-2)',
                          border: `1px solid ${active ? l.color : done ? l.color + '66' : 'var(--border)'}`,
                          opacity: done ? 1 : 0.5,
                        }}
                      >
                        <span
                          className="w-6 h-6 shrink-0 rounded flex items-center justify-center text-[10px] font-bold"
                          style={{ background: done ? l.color : 'var(--border)', color: done ? '#fff' : 'var(--text-muted)' }}
                        >
                          {l.idx}
                        </span>
                        <span className="text-[11px] font-medium shrink-0 w-12 sm:w-14">{l.name}</span>
                        <span className="text-[10px] mono muted truncate hidden sm:block">{l.pdu}</span>
                        <span className="ml-auto text-[10px] mono shrink-0" style={{ color: done ? l.color : 'var(--text-muted)' }}>
                          {bytes > 0 ? `+${bytes} B` : '+0 B'}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* 主机 2 */}
              <div className="shrink-0 text-center w-16 sm:w-20">
                <div
                  className="rounded-lg px-2 py-3 text-[11px] font-semibold"
                  style={{
                    background: dir === 'recv' ? 'rgba(50,85,219,0.12)' : 'var(--surface-2)',
                    border: `1px solid ${dir === 'recv' ? 'var(--brand)' : 'var(--border)'}`,
                  }}
                >
                  主机 2
                </div>
                <div className="text-[10px] muted mt-1">接收方</div>
              </div>
            </div>
            <div className="text-[10px] muted mt-2 text-center">
              {dir === 'send'
                ? '从上到下逐层加首部：每层只把“数据部分”交给下一层，并附上自己的首部'
                : '从上到下逐层剥首部：每层只把“数据部分”交给上一层，自己剥掉首部'}
            </div>
          </div>
        </div>

        {/* ---------------- PDU 堆叠（每加一层，包大一层） ---------------- */}
        <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
          <div className="text-xs font-medium mb-2">当前数据单元的组成（从外到内）</div>
          <svg viewBox={`0 0 1000 ${stack.length * 30 + 46}`} className="w-full h-auto block" role="img" aria-label="PDU 组成堆叠">
            {stack.map((sg, i) => {
              const w = Math.max(3, sg.bytes * scale)
              const y = 14 + i * 30
              const isData = sg.kind === 'DATA'
              return (
                <g key={`${sg.kind}-${i}`}>
                  <text x={0} y={y + 18} fontSize={11} fill="var(--text-muted)">
                    {sg.label}
                  </text>
                  <rect
                    x={190}
                    y={y}
                    width={w}
                    height={24}
                    rx={4}
                    fill={isData ? 'rgba(150,160,175,0.45)' : sg.color}
                    opacity={isData ? 1 : 0.9}
                  />
                  <text x={196 + w} y={y + 17} fontSize={10} fill="var(--text-muted)">
                    {sg.bytes} B
                  </text>
                </g>
              )
            })}
            {/* 总量标尺 */}
            <line x1={190} y1={stack.length * 30 + 8} x2={190 + barW} y2={stack.length * 30 + 8} stroke="var(--border)" />
            <text x={190} y={stack.length * 30 + 26} fontSize={11} fill="var(--text)">
              当前 PDU 总量 = {currentPdu.bytes} byte（其中首部开销 {curOverhead} byte = {((curOverhead / currentPdu.bytes) * 100).toFixed(1)}%）
            </text>
          </svg>
        </div>

        {/* ---------------- 尺寸对比柱 ---------------- */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
            <div className="text-xs font-medium mb-2">每一层封装后的总字节数</div>
            <div className="space-y-1.5">
              {[
                { n: 'message', b: sizes.message, c: LAYERS[0].color },
                { n: 'segment', b: sizes.segment, c: LAYERS[1].color },
                { n: 'datagram', b: sizes.datagram, c: LAYERS[2].color },
                { n: 'frame', b: sizes.frame, c: LAYERS[3].color },
              ].map((x) => {
                const cur =
                  (x.n === 'message' && level === 1) ||
                  (x.n === 'segment' && level === 2) ||
                  (x.n === 'datagram' && level === 3) ||
                  (x.n === 'frame' && level >= 4)
                return (
                  <div key={x.n} className="flex items-center gap-2">
                    <span className="text-[10px] mono w-16 shrink-0" style={{ color: cur ? x.c : 'var(--text-muted)' }}>
                      {x.n}
                    </span>
                    <div className="flex-1 h-5 rounded" style={{ background: 'var(--surface-2)' }}>
                      <div
                        className="h-full rounded flex items-center justify-end pr-1.5"
                        style={{ width: `${Math.max(3, (x.b / totalMax) * 100)}%`, background: x.c, opacity: cur ? 0.95 : 0.45 }}
                      >
                        <span className="text-[9px] text-white mono">{x.b} B</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
            <div className="text-xs font-medium mb-2">各层首部字节数</div>
            <div className="space-y-1.5">
              {[
                { n: 'H5 应用层', b: h5Bytes, c: LAYERS[0].color },
                { n: 'H4 运输层 (TCP)', b: H4_BYTES, c: LAYERS[1].color },
                { n: 'H3 网络层 (IPv4)', b: H3_BYTES, c: LAYERS[2].color },
                { n: 'H2 链路层 (以太网)', b: H2_BYTES, c: LAYERS[3].color },
                { n: 'T2 尾部 (FCS)', b: T2_BYTES, c: LAYERS[3].color },
              ].map((x) => (
                <div key={x.n} className="flex items-center gap-2">
                  <span className="text-[10px] w-32 shrink-0" style={{ color: 'var(--text-muted)' }}>
                    {x.n}
                  </span>
                  <div className="flex-1 h-4 rounded" style={{ background: 'var(--surface-2)' }}>
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${Math.max(1.5, (x.b / Math.max(H4_BYTES, H3_BYTES, H2_BYTES, T2_BYTES, h5Bytes)) * 100)}%`,
                        background: x.c,
                        opacity: 0.85,
                      }}
                    />
                  </div>
                  <span className="text-[10px] mono muted w-8 text-right shrink-0">{x.b} B</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ---------------- 指标 ---------------- */}
        <ResultGrid
          items={[
            { label: '当前 PDU', value: currentPdu.name, highlight: true },
            { label: '当前总长度', value: `${currentPdu.bytes} byte`, hint: `应用数据 ${appData} B + 本层首部 ${curOverhead} B` },
            { label: '本层首部开销', value: `${curOverhead} byte`, hint: `全部 5 层封完后共 ${sizes.overhead} B` },
            { label: '开销占比', value: `${((curOverhead / currentPdu.bytes) * 100).toFixed(1)}%`, hint: '相对当前 PDU 大小' },
            { label: '封装放大系数', value: `${(currentPdu.bytes / sizes.app).toFixed(3)}×`, hint: '当前 PDU / 应用程序数据' },
            { label: '步进', value: `${Math.min(index + 1, steps.length)} / ${steps.length}`, hint: steps[Math.min(index, steps.length - 1)]?.label },
          ]}
        />

        <StepNote tone={note.tone} text={note.text} />

        {/* ---------------- 层间对照表 ---------------- */}
        <div className="rounded-lg overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
          <table className="w-full text-xs min-w-[520px]">
            <thead>
              <tr style={{ background: 'var(--surface-2)' }}>
                <th className="text-left px-3 py-2 font-semibold">层</th>
                <th className="text-left px-3 py-2 font-semibold">PDU 名称</th>
                <th className="text-left px-3 py-2 font-semibold">首部</th>
                <th className="text-left px-3 py-2 font-semibold">字节</th>
                <th className="text-left px-3 py-2 font-semibold">封装后总长</th>
              </tr>
            </thead>
            <tbody>
              {LAYERS.map((l) => {
                const row =
                  l.key === 'app'
                    ? { hdr: 'H5', bytes: h5Bytes, total: sizes.message }
                    : l.key === 'transport'
                      ? { hdr: 'H4', bytes: H4_BYTES, total: sizes.segment }
                      : l.key === 'network'
                        ? { hdr: 'H3', bytes: H3_BYTES, total: sizes.datagram }
                        : { hdr: 'H2 + T2', bytes: H2_BYTES + T2_BYTES, total: sizes.frame }
                return (
                  <tr key={l.key} style={{ borderTop: '1px solid var(--border)' }}>
                    <td className="px-3 py-1.5">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                        {l.idx} {l.name}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 mono">{l.pdu}</td>
                    <td className="px-3 py-1.5 mono">{row.hdr}</td>
                    <td className="px-3 py-1.5 mono tabular-nums">{row.bytes} B</td>
                    <td className="px-3 py-1.5 mono tabular-nums">{row.total} B</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <StepNote text="要点：每一层只关心自己的“对等层协议”——应用层把数据交给运输层，运输层加 H4 交给网络层，网络层加 H3 交给链路层，链路层加 H2/T2 交给物理层。每层首部里的地址只在相邻两层有意义：H4 里的端口号是端到端的，H3 里的 IP 地址是端到端的，H2 里的 MAC 地址只对“一跳”有效——经过路由器时 H2/T2 会被剥掉换上新的。" />
      </div>
    </DemoFrame>
  )
}
