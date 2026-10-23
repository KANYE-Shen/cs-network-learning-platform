// ============================================================
// 网络的网络：ISP 层次结构的演化
// 对应 PPT 第 51-58 页：全互联(O(N²)) → 单一全球 ISP → 竞争 + IXP + peering + Tier-1
// ============================================================
import { useEffect, useMemo, useState } from 'react'
import { DemoFrame, PlayControls, ParamSlider, ResultGrid, StepNote, useStepMachine } from './DemoKit'

type Scheme = 'all' | 'single' | 'multi'

/** 固定色板：接入 ISP / 全球 ISP / IXP / Tier-1 四类节点 */
const C_ACCESS = '#17a8c4'
const C_GLOBAL = '#4873e8'
const C_IXP = '#1e40af'
const C_TIER1 = '#16a078'
const C_PEER = '#d64545'

const SCHEME_META: Record<Scheme, { name: string; desc: string }> = {
  all: {
    name: '方案一：接入 ISP 两两直连',
    desc: '每个接入 ISP 都直接和其它每一个接入 ISP 相连，任何两个主机都能通信。',
  },
  single: {
    name: '方案二：全部连到一个全球 ISP',
    desc: '接入 ISP 只和唯一的全球 ISP 相连，由它转发所有跨网流量。',
  },
  multi: {
    name: '方案三：竞争的全球 ISP + IXP + Tier-1',
    desc: '多个全球 ISP 互联互通，经 IXP 交换流量，并由 Tier-1 骨干兜底。',
  },
}

/** 组合数 C(n,2) */
function pairs(n: number): number {
  return (n * (n - 1)) / 2
}

export default function IspTopologyDemo() {
  const [scheme, setScheme] = useState<Scheme>('all')
  const [N, setN] = useState(8) // 接入 ISP 数量
  const [G, setG] = useState(3) // 全球 ISP 数量（方案三）
  const [T, setT] = useState(1) // Tier-1 ISP 数量（方案三）
  const [focus, setFocus] = useState<number | null>(null) // 高亮的全球 ISP 下标
  const [flash, setFlash] = useState(false) // 新增全球 ISP 时的提示

  // ---------- 步骤机 ----------
  const steps = useMemo(() => {
    const arr: { label: string; detail?: string }[] = []
    if (scheme === 'all') {
      arr.push({ label: '空的网络', detail: '还没有任何 ISP' })
      for (let i = 1; i <= N; i++) {
        arr.push({
          label: `加入第 ${i} 个接入 ISP`,
          detail: `为了和已有 ISP 通信，它必须新增 ${i - 1} 条直连链路（累计 ${pairs(i)} 条）`,
        })
      }
    } else if (scheme === 'single') {
      arr.push({ label: '空的网络' })
      arr.push({ label: '唯一的全球 ISP 上线', detail: '所有接入 ISP 的流量都汇集到这里' })
      for (let i = 1; i <= N; i++) {
        arr.push({ label: `第 ${i} 个接入 ISP 接入`, detail: `只需 1 条客户链路，累计 ${i} 条` })
      }
    } else {
      arr.push({ label: '空的网络' })
      for (let g = 1; g <= G; g++) {
        arr.push({
          label: `全球 ISP ${'ABCDE'[g - 1]} 上线`,
          detail:
            g > 1
              ? `为了和已有的 ${g - 1} 个全球 ISP 互通，必须新增 ${g - 1} 条 IXP 互连`
              : '此时它是唯一的全球 ISP——没有竞争，也没有备份',
        })
      }
      arr.push({ label: 'Tier-1 骨干接入', detail: '全球 ISP 接入全球骨干，跨洲流量有了第二条路' })
      for (let i = 1; i <= N; i++) {
        arr.push({ label: `第 ${i} 个接入 ISP 接入`, detail: '接入 ISP 只和它的提供商相连' })
      }
    }
    return arr
  }, [scheme, N, G])

  const machine = useStepMachine(steps, { intervalMs: 900 })
  const { index, setIndex, playing, setPlaying, speed, setSpeed, reset, step, stepBack } = machine

  // 步骤数变化时把 index 拉回合法范围
  useEffect(() => {
    if (index >= steps.length) setIndex(steps.length - 1)
  }, [index, steps.length, setIndex])

  const switchScheme = (s: Scheme) => {
    setScheme(s)
    setFocus(null)
    reset()
  }

  // ---------- 当前步骤对应的可见状态 ----------
  const visible = useMemo(() => {
    if (scheme === 'all') {
      return { access: Math.min(index, N), globals: 0, tier: false, ixp: 0 }
    }
    if (scheme === 'single') {
      return { access: Math.max(0, Math.min(index - 1, N)), globals: index >= 1 ? 1 : 0, tier: false, ixp: 0 }
    }
    const globals = Math.min(index, G)
    const tier = index >= G + 1
    const access = Math.max(0, Math.min(index - (G + 1), N))
    return { access, globals, tier, ixp: globals >= 2 ? pairs(globals) : 0 }
  }, [scheme, index, N, G])

  // ---------- 完整拓扑的连接数（边数） ----------
  const connAll = pairs(N) // 方案一：C(N,2) 条接入 ISP 之间的直连
  const connSingle = N // 方案二：N 条客户链路
  const connMulti = N + pairs(G) + G * T + pairs(T) // 客户 + IXP互连 + 接骨干 + 骨干互连

  // 当前动画已建立的连接数
  const connNow = useMemo(() => {
    if (scheme === 'all') return pairs(visible.access)
    if (scheme === 'single') return visible.access
    return visible.access + visible.ixp + (visible.tier ? visible.globals * T + pairs(T) : 0)
  }, [scheme, visible])

  // ---------- 布局 ----------
  const VW = 1000
  const VH = 490
  const accessPos = useMemo(() => {
    if (scheme === 'multi') {
      const x0 = 55
      const x1 = VW - 55
      const step = N > 1 ? (x1 - x0) / (N - 1) : 0
      return Array.from({ length: N }, (_, i) => ({ x: x0 + i * step, y: 42 }))
    }
    const cx = VW / 2
    const cy = 250
    const rad = 190
    return Array.from({ length: N }, (_, i) => {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2
      return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) }
    })
  }, [scheme, N])

  const globalPos = useMemo(() => {
    if (scheme === 'multi') {
      const g = Math.max(G, 1)
      const x0 = 180
      const x1 = VW - 180
      const step = g > 1 ? (x1 - x0) / (g - 1) : 0
      return Array.from({ length: g }, (_, i) => ({ x: x0 + i * step, y: 145 }))
    }
    return [{ x: VW / 2, y: 250 }]
  }, [scheme, G])

  // 全球 ISP 之间的 IXP 互连：用向下的二次贝塞尔弧，弧顶放 IXP 节点
  const ixpArcs = useMemo(() => {
    if (scheme !== 'multi') return []
    const arr: { a: number; b: number; mx: number; apex: number; cy: number }[] = []
    for (let a = 0; a < G; a++) {
      for (let b = a + 1; b < G; b++) {
        const mx = (globalPos[a].x + globalPos[b].x) / 2
        const apex = 215 + (b - a - 1) * 18
        arr.push({ a, b, mx, apex, cy: 2 * apex - 175 })
      }
    }
    return arr
  }, [scheme, G, globalPos])

  const tierPos = useMemo(() => {
    if (scheme !== 'multi') return []
    const t = Math.max(T, 1)
    const x0 = VW / 2 - ((t - 1) * 240) / 2
    return Array.from({ length: t }, (_, i) => ({ x: x0 + i * 240, y: 425 }))
  }, [scheme, T])

  // 椭圆边界上的连接点（方案二：接入 ISP 连到全球 ISP 椭圆边缘）
  const ellipseEdge = (cx: number, cy: number, rx: number, ry: number, tx: number, ty: number) => {
    const dx = tx - cx
    const dy = ty - cy
    const t = 1 / Math.sqrt((dx / rx) ** 2 + (dy / ry) ** 2)
    return { x: cx + t * dx, y: cy + t * dy }
  }

  // ---------- 增长曲线（连接数 vs N） ----------
  const growth = useMemo(() => {
    const NMAX = 24
    const pts = Array.from({ length: NMAX - 3 }, (_, i) => i + 4)
    const series = [
      { name: '方案一 O(N²)', color: C_PEER, fn: (n: number) => pairs(n), dash: '5 3' as string | undefined },
      { name: '方案二 O(N)', color: C_GLOBAL, fn: (n: number) => n, dash: undefined },
      { name: '方案三 O(N)', color: C_TIER1, fn: (n: number) => n + pairs(G) + G * T + pairs(T), dash: undefined },
    ]
    return { pts, series, yMax: pairs(NMAX) }
  }, [G, T])

  const GW = 1000
  const GH = 240
  const gPadL = 58
  const gPadR = 30
  const gPadT = 20
  const gPadB = 36
  const gx = (n: number) => gPadL + ((n - 4) / (24 - 4)) * (GW - gPadL - gPadR)
  const gy = (v: number) => gPadT + (1 - v / growth.yMax) * (GH - gPadT - gPadB)

  // ---------- 方案说明 ----------
  const note = useMemo(() => {
    if (scheme === 'all') {
      return {
        tone: 'warn' as const,
        text: `每加入一个接入 ISP，都要和已有的所有 ISP 各连一条链路：连接数 = N(N−1)/2 = ${connAll}（N=${N}）。N 翻倍，链路数变成 4 倍——O(N²) 的代价让这种结构无法扩展到数百万个接入 ISP。`,
      }
    }
    if (scheme === 'single') {
      return {
        tone: 'warn' as const,
        text: `连接数降到 ${connSingle} 条（N=${N}），扩展性问题解决了。但这个全球 ISP 是单点故障：它一挂掉，所有跨网流量全部中断；而且没有竞争者，缺少商业上的压力去提升服务质量与覆盖范围。`,
      }
    }
    return {
      tone: 'ok' as const,
      text: `现在有 ${G} 个竞争的全球 ISP，彼此通过 IXP 互连（${pairs(G)} 条），并接入 ${T} 个 Tier-1 骨干。接入 ISP 数量 N 增长时，每新增一个接入 ISP 只多 1 条客户链路，规模上完全可行；同时任一全球 ISP 故障，还有其它路径可绕行。`,
    }
  }, [scheme, N, G, T, connAll, connSingle])

  // ---------- 新增 / 移除全球 ISP ----------
  const addGlobal = () => {
    if (G >= 5) return
    const nextG = G + 1
    setG(nextG)
    setFocus(nextG - 1)
    setFlash(true)
    setTimeout(() => setFlash(false), 2200)
    reset()
    setIndex(nextG)
  }
  const removeGlobal = () => {
    if (G <= 2) return
    setG(G - 1)
    setFocus(null)
    reset()
  }

  const cur = steps[Math.min(index, steps.length - 1)]

  return (
    <DemoFrame
      title="网络的网络：ISP 层次结构的演化"
      description="接入 ISP 之间必须互相连接，任何两个主机才能通信。连接方式从 O(N²) 全互联 → 单一全球 ISP → 竞争的全球 ISP + IXP + Tier-1 骨干，逐步解决了规模与竞争问题。"
      controls={
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
      }
      legend={[
        { color: C_ACCESS, label: '接入 ISP (access net)' },
        { color: C_GLOBAL, label: '全球 ISP' },
        { color: C_IXP, label: 'IXP 交换中心' },
        { color: C_TIER1, label: 'Tier-1 骨干' },
        { color: C_PEER, label: '全球 ISP 之间的 IXP 互连' },
      ]}
    >
      <div className="space-y-4">
        {/* ---------------- 方案切换 ---------------- */}
        <div className="grid sm:grid-cols-3 gap-2">
          {(Object.keys(SCHEME_META) as Scheme[]).map((s) => {
            const active = scheme === s
            return (
              <button
                key={s}
                onClick={() => switchScheme(s)}
                className="text-left rounded-lg px-3 py-2 transition-all"
                style={{
                  background: active ? 'rgba(50,85,219,0.10)' : 'var(--surface-2)',
                  border: `1px solid ${active ? 'var(--brand)' : 'var(--border)'}`,
                }}
              >
                <div className="text-xs font-semibold" style={active ? { color: 'var(--brand)' } : undefined}>
                  {SCHEME_META[s].name}
                </div>
                <div className="text-[10px] muted mt-0.5 leading-snug">{SCHEME_META[s].desc}</div>
              </button>
            )
          })}
        </div>

        {/* ---------------- 参数 ---------------- */}
        <div className="grid sm:grid-cols-3 gap-4">
          <ParamSlider
            label="接入 ISP 数量 N"
            value={N}
            onChange={(v) => {
              setN(v)
              reset()
            }}
            min={4}
            max={12}
            step={1}
            unit="个"
          />
          {scheme === 'multi' ? (
            <>
              <ParamSlider
                label="全球 ISP 数量 G"
                value={G}
                onChange={(v) => {
                  setG(v)
                  setFocus(null)
                  reset()
                }}
                min={2}
                max={5}
                step={1}
                unit="个"
              />
              <ParamSlider
                label="Tier-1 骨干数量 T"
                value={T}
                onChange={(v) => {
                  setT(v)
                  reset()
                }}
                min={1}
                max={3}
                step={1}
                unit="个"
              />
            </>
          ) : (
            <div className="text-[11px] muted leading-relaxed self-end pb-1">
              提示：切到“全球 ISP 竞争”方案后，可以新增/删除全球 ISP，观察它必须与其它全球 ISP 互连。
            </div>
          )}
        </div>

        {/* ---------------- 方案三：新增全球 ISP ---------------- */}
        {scheme === 'multi' && (
          <div
            className="flex flex-wrap items-center gap-2 rounded-lg px-3 py-2"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            <button onClick={addGlobal} disabled={G >= 5} className="btn-primary !px-3 !py-1.5 text-xs">
              + 新增全球 ISP
            </button>
            <button onClick={removeGlobal} disabled={G <= 2} className="btn-ghost !px-3 !py-1.5 text-xs">
              − 移除一个
            </button>
            <span className="text-[11px] muted">
              新增一个全球 ISP，必须与已有的 G−1 个全球 ISP 各建一条互连（IXP），因此新增互连数随 G 线性增长。
            </span>
          </div>
        )}

        {/* ---------------- 拓扑图 ---------------- */}
        <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          <div
            className="px-3 py-2 text-xs flex flex-wrap items-center gap-x-4 gap-y-1"
            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}
          >
            <span className="font-semibold">{SCHEME_META[scheme].name}</span>
            <span className="mono muted">已建立连接 {connNow} 条</span>
            {focus !== null && scheme === 'multi' && (
              <span className="mono" style={{ color: 'var(--brand)' }}>
                焦点：全球 ISP {'ABCDE'[focus]}
              </span>
            )}
            {flash && <span style={{ color: C_PEER }}>⚠ 新增全球 ISP 必须与其它全球 ISP 互连！</span>}
          </div>

          <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-auto block" role="img" aria-label="ISP 拓扑结构演化图">
            <defs>
              <marker id="arrowPeer" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill={C_PEER} />
              </marker>
              <marker id="arrowTier" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto">
                <path d="M0,0 L7,3.5 L0,7 z" fill={C_TIER1} />
              </marker>
            </defs>

            {/* ---- 方案一：全互联边 ---- */}
            {scheme === 'all' &&
              visible.access >= 2 &&
              Array.from({ length: visible.access }, (_, i) =>
                Array.from({ length: visible.access - i - 1 }, (_, j) => {
                  const a = accessPos[i]
                  const b = accessPos[i + j + 1]
                  return (
                    <line
                      key={`e-${i}-${j}`}
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke="var(--text-muted)"
                      strokeWidth={0.8}
                      opacity={0.35}
                    />
                  )
                }),
              )}

            {/* ---- 方案二：接入 ISP → 全球 ISP ---- */}
            {scheme === 'single' &&
              visible.globals === 1 &&
              accessPos.slice(0, visible.access).map((p, i) => {
                const e = ellipseEdge(VW / 2, 250, 118, 62, p.x, p.y)
                return (
                  <line key={`c-${i}`} x1={p.x} y1={p.y} x2={e.x} y2={e.y} stroke="var(--text-muted)" strokeWidth={1} opacity={0.55} />
                )
              })}

            {/* ---- 方案三：客户链路 / IXP 互连 / Tier-1 ---- */}
            {scheme === 'multi' && (
              <>
                {/* 接入 ISP → 所属全球 ISP（轮流分配） */}
                {accessPos.slice(0, visible.access).map((p, i) => {
                  const gi = visible.globals > 0 ? i % visible.globals : 0
                  const g = globalPos[gi]
                  const focused = focus === gi
                  return (
                    <line
                      key={`cust-${i}`}
                      x1={p.x}
                      y1={p.y + 15}
                      x2={g.x}
                      y2={g.y - 30}
                      stroke={focused ? C_GLOBAL : 'var(--text-muted)'}
                      strokeWidth={focused ? 1.8 : 1}
                      opacity={focused ? 0.9 : 0.5}
                    />
                  )
                })}
                {/* 全球 ISP ↔ 全球 ISP（经 IXP） */}
                {ixpArcs.slice(0, visible.ixp).map((it) => {
                  const ga = globalPos[it.a]
                  const gb = globalPos[it.b]
                  const hot = focus === it.a || focus === it.b
                  return (
                    <path
                      key={`ixp-${it.a}-${it.b}`}
                      d={`M ${ga.x},175 Q ${it.mx},${it.cy} ${gb.x},175`}
                      fill="none"
                      stroke={hot ? C_PEER : 'var(--text-muted)'}
                      strokeWidth={hot ? 2.4 : 1.2}
                      opacity={hot ? 1 : 0.45}
                      markerEnd="url(#arrowPeer)"
                    />
                  )
                })}
                {/* 全球 ISP → Tier-1 */}
                {visible.tier &&
                  globalPos.slice(0, visible.globals).map((g, i) =>
                    tierPos.map((t, j) => (
                      <line
                        key={`tier-${i}-${j}`}
                        x1={g.x}
                        y1={g.y + 30}
                        x2={t.x}
                        y2={t.y - 20}
                        stroke={C_TIER1}
                        strokeWidth={1.2}
                        strokeDasharray="5 3"
                        opacity={0.75}
                        markerEnd="url(#arrowTier)"
                      />
                    )),
                  )}
                {/* Tier-1 互连 */}
                {visible.tier &&
                  tierPos.slice(0, T - 1).map((t, i) => (
                    <line
                      key={`t1t1-${i}`}
                      x1={t.x}
                      y1={t.y}
                      x2={tierPos[i + 1].x}
                      y2={tierPos[i + 1].y}
                      stroke={C_TIER1}
                      strokeWidth={1.4}
                      opacity={0.8}
                      markerEnd="url(#arrowTier)"
                    />
                  ))}
              </>
            )}

            {/* ---- 接入 ISP 节点 ---- */}
            {accessPos.slice(0, visible.access).map((p, i) => (
              <g key={`acc-${i}`}>
                <rect
                  x={p.x - 26}
                  y={p.y - 15}
                  width={52}
                  height={30}
                  rx={13}
                  fill="rgba(23,168,196,0.18)"
                  stroke={C_ACCESS}
                  strokeWidth={1.5}
                />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="var(--text)">
                  接入{i + 1}
                </text>
              </g>
            ))}

            {/* ---- 全球 ISP 节点 ---- */}
            {globalPos.slice(0, visible.globals).map((g, i) => {
              const isFocus = focus === i
              const rx = scheme === 'multi' ? 58 : 118
              const ry = scheme === 'multi' ? 30 : 62
              return (
                <g key={`glob-${i}`} onClick={() => setFocus(isFocus ? null : i)} style={{ cursor: 'pointer' }}>
                  <ellipse
                    cx={g.x}
                    cy={g.y}
                    rx={rx}
                    ry={ry}
                    fill="rgba(72,115,232,0.20)"
                    stroke={C_GLOBAL}
                    strokeWidth={isFocus ? 3 : 1.8}
                  />
                  <text x={g.x} y={g.y + (scheme === 'multi' ? -2 : 4)} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">
                    {scheme === 'multi' ? `全球 ISP ${'ABCDE'[i]}` : '全球 ISP'}
                  </text>
                  {scheme === 'multi' && (
                    <text x={g.x} y={g.y + 14} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
                      客户 + 骨干
                    </text>
                  )}
                </g>
              )
            })}

            {/* ---- IXP 节点（位于互连弧的弧顶） ---- */}
            {scheme === 'multi' &&
              ixpArcs.slice(0, visible.ixp).map((it) => {
                const hot = focus === it.a || focus === it.b
                return (
                  <g key={`ixpn-${it.a}-${it.b}`}>
                    <ellipse cx={it.mx} cy={it.apex} rx={25} ry={13} fill="rgba(30,64,175,0.22)" stroke={C_IXP} strokeWidth={hot ? 2.4 : 1.5} />
                    <text x={it.mx} y={it.apex + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="var(--text)">
                      IXP
                    </text>
                  </g>
                )
              })}

            {/* ---- Tier-1 节点 ---- */}
            {scheme === 'multi' &&
              visible.tier &&
              tierPos.slice(0, T).map((t, i) => (
                <g key={`tiern-${i}`}>
                  <rect x={t.x - 60} y={t.y - 22} width={120} height={44} rx={8} fill="rgba(22,160,120,0.18)" stroke={C_TIER1} strokeWidth={1.8} />
                  <text x={t.x} y={t.y - 3} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--text)">
                    Tier-1 骨干
                  </text>
                  <text x={t.x} y={t.y + 13} textAnchor="middle" fontSize={10} fill="var(--text-muted)">
                    客户接入 / 骨干互联
                  </text>
                </g>
              ))}

            {/* 空状态提示（放在圆心附近，避免大片空白） */}
            {visible.access === 0 && visible.globals === 0 && (
              <>
                <circle cx={VW / 2} cy={250} r={190} fill="none" stroke="var(--border)" strokeWidth={1} strokeDasharray="6 6" />
                <text x={VW / 2} y={244} textAnchor="middle" fontSize={13} fill="var(--text-muted)">
                  点击 ▶ 播放，开始逐个加入接入 ISP
                </text>
                <text x={VW / 2} y={266} textAnchor="middle" fontSize={11} fill="var(--text-muted)">
                  每加入 1 个就要新增 N−1 条直连链路
                </text>
              </>
            )}
          </svg>
        </div>

        {/* ---------------- 指标 ---------------- */}
        <ResultGrid
          items={[
            {
              label: '本方案完整连接数',
              value: `${scheme === 'all' ? connAll : scheme === 'single' ? connSingle : connMulti} 条`,
              highlight: true,
            },
            { label: '接入 ISP 数 N', value: `${N} 个` },
            {
              label: '增长量级',
              value: scheme === 'all' ? 'O(N²)' : 'O(N)',
              hint: scheme === 'all' ? '每加 1 个要多连 N−1 条' : '每加 1 个只多连 1 条',
            },
            {
              label: '是否可扩展',
              value: scheme === 'all' ? '不可扩展' : '可扩展',
              hint: scheme === 'all' ? `N=12 时已达 ${pairs(12)} 条` : '接入 ISP 可以持续增长',
            },
            { label: '单点故障', value: scheme === 'single' ? '有（唯一全球 ISP）' : '无', hint: scheme === 'single' ? '它一挂全网跨网中断' : '多条互连路径' },
            { label: '是否有竞争', value: scheme === 'multi' ? '有' : '无', hint: scheme === 'multi' ? '多个全球 ISP 相互竞争' : '全球 ISP 是垄断' },
          ]}
        />

        {/* ---------------- 增长曲线 ---------------- */}
        <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-1">
            <span className="text-xs font-medium">连接数随接入 ISP 数量 N 的增长</span>
            {growth.series.map((s) => (
              <span key={s.name} className="inline-flex items-center gap-1.5 text-[10px] muted">
                <span className="w-4 h-0.5 rounded" style={{ background: s.color }} />
                {s.name}
              </span>
            ))}
          </div>
          <svg viewBox={`0 0 ${GW} ${GH}`} className="w-full h-auto block" role="img" aria-label="连接数随 N 增长的曲线">
            {[0, 0.25, 0.5, 0.75, 1].map((f) => (
              <g key={f}>
                <line x1={gPadL} y1={gy(growth.yMax * f)} x2={GW - gPadR} y2={gy(growth.yMax * f)} stroke="var(--border)" strokeWidth={0.6} />
                <text x={gPadL - 6} y={gy(growth.yMax * f) + 3} textAnchor="end" fontSize={9} fill="var(--text-muted)">
                  {Math.round(growth.yMax * f)}
                </text>
              </g>
            ))}
            {[4, 8, 12, 16, 20, 24].map((n) => (
              <g key={n}>
                <line x1={gx(n)} y1={GH - gPadB} x2={gx(n)} y2={GH - gPadB + 4} stroke="var(--border)" />
                <text x={gx(n)} y={GH - gPadB + 15} textAnchor="middle" fontSize={9} fill="var(--text-muted)">
                  {n}
                </text>
              </g>
            ))}
            <line x1={gPadL} y1={GH - gPadB} x2={GW - gPadR} y2={GH - gPadB} stroke="var(--text-muted)" strokeWidth={1} />
            <line x1={gPadL} y1={gPadT} x2={gPadL} y2={GH - gPadB} stroke="var(--text-muted)" strokeWidth={1} />
            {growth.series.map((s) => (
              <g key={s.name}>
                <polyline
                  points={growth.pts.map((n) => `${gx(n)},${gy(s.fn(n))}`).join(' ')}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={2}
                  strokeDasharray={s.dash}
                />
                <circle cx={gx(N)} cy={gy(s.fn(N))} r={4} fill={s.color} />
              </g>
            ))}
            <text x={gPadL} y={12} fontSize={9} fill="var(--text-muted)">
              纵轴：链路连接条数（圆点标出当前 N = {N} 处）；横轴：接入 ISP 数量 N
            </text>
          </svg>
        </div>

        <StepNote tone={note.tone} text={note.text} />
        <StepNote text={`当前步骤：${cur?.label ?? ''}${cur?.detail ? ' —— ' + cur.detail : ''}`} />
      </div>
    </DemoFrame>
  )
}
