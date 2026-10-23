import { useEffect, useMemo, useState } from 'react'
import {
  DemoFrame,
  ParamSelect,
  ParamSlider,
  PlayControls,
  ResultGrid,
  StepNote,
  useStepMachine,
} from './DemoKit'

/**
 * DNS 查询过程（www.baidu.com）。
 * 迭代查询：Resolver 依次问根、.com TLD、baidu.com 权威服务器，自己做 3 跳。
 * 递归查询：Resolver 只问根，根再去问 .com，.com 再去问权威服务器。
 * 另含「第二次查询命中本地 DNS 缓存」的情形。
 */

type NodeId = 'host' | 'resolver' | 'root' | 'tld' | 'auth'

interface Box {
  id: NodeId
  x: number
  y: number
  w: number
  h: number
  title: string
  sub: string
  dim?: boolean
}

const NODES: Record<NodeId, Box> = {
  host: { id: 'host', x: 24, y: 150, w: 178, h: 58, title: '主机', sub: '请求 www.baidu.com' },
  resolver: {
    id: 'resolver',
    x: 24,
    y: 268,
    w: 202,
    h: 62,
    title: '本地 DNS（Resolver）',
    sub: '默认名称服务器 / 代理',
  },
  root: { id: 'root', x: 340, y: 18, w: 204, h: 60, title: '根名称服务器', sub: '全球 13 台（a~m）' },
  tld: { id: 'tld', x: 340, y: 148, w: 204, h: 60, title: '.com 顶级域服务器', sub: 'a.servers.net' },
  auth: {
    id: 'auth',
    x: 340,
    y: 276,
    w: 214,
    h: 64,
    title: 'baidu.com 权威服务器',
    sub: 'ns.baidu.com',
  },
}

interface ArrowSpec {
  from: NodeId
  to: NodeId
  x1: number
  y1: number
  x2: number
  y2: number
  curve: number
}

interface DnsStep {
  label: string
  detail: string
  from: NodeId
  to: NodeId
  kind: 'query' | 'response'
  fromKnows: string
  reply: string
  rtt: number
  learn: NodeId[]
  queryCount: number
}

const ITER_STEPS: DnsStep[] = [
  {
    label: '主机 → 本地 DNS',
    detail: '第 1 步：客户端只认识自己的本地 DNS',
    from: 'host',
    to: 'resolver',
    kind: 'query',
    fromKnows: '主机只知道要查的域名 www.baidu.com，对 IP 一无所知',
    reply: '（尚无应答，查询已发出）',
    rtt: 0,
    learn: [],
    queryCount: 0,
  },
  {
    label: '本地 DNS → 根服务器',
    detail: '第 2 步：Resolver 第 1 跳查询',
    from: 'resolver',
    to: 'root',
    kind: 'query',
    fromKnows: 'Resolver 缓存里没有 www.baidu.com，必须向上查询',
    reply: '（尚无应答，查询已发出）',
    rtt: 0,
    learn: [],
    queryCount: 1,
  },
  {
    label: '根服务器 → 本地 DNS（推荐 .com）',
    detail: '第 3 步：根只知道顶级域服务器',
    from: 'root',
    to: 'resolver',
    kind: 'response',
    fromKnows: '根服务器只知道 .com 顶级域服务器的地址（a.servers.net），不知道 baidu.com',
    reply: '“我不知道 www.baidu.com，但 .com 服务器知道”——这是 referral（转介）',
    rtt: 1,
    learn: ['root'],
    queryCount: 1,
  },
  {
    label: '本地 DNS → .com 顶级域',
    detail: '第 4 步：Resolver 第 2 跳查询',
    from: 'resolver',
    to: 'tld',
    kind: 'query',
    fromKnows: 'Resolver 已经从根那里拿到了 .com 服务器的地址',
    reply: '（尚无应答，查询已发出）',
    rtt: 1,
    learn: [],
    queryCount: 2,
  },
  {
    label: '.com → 本地 DNS（给出权威服务器）',
    detail: '第 5 步：顶级域知道 NS 记录',
    from: 'tld',
    to: 'resolver',
    kind: 'response',
    fromKnows: '.com 服务器知道 baidu.com 由哪几台权威服务器管理，但不知道 www.baidu.com 的 IP',
    reply: 'NS 记录：baidu.com → ns1.baidu.com（及 ns.baidu.com 的 A 记录）',
    rtt: 2,
    learn: ['tld'],
    queryCount: 2,
  },
  {
    label: '本地 DNS → baidu.com 权威服务器',
    detail: '第 6 步：Resolver 第 3 跳查询',
    from: 'resolver',
    to: 'auth',
    kind: 'query',
    fromKnows: 'Resolver 已经拿到了权威服务器的地址',
    reply: '（尚无应答，查询已发出）',
    rtt: 2,
    learn: [],
    queryCount: 3,
  },
  {
    label: '权威服务器 → 本地 DNS（A 记录）',
    detail: '第 7 步：权威服务器知道最终答案',
    from: 'auth',
    to: 'resolver',
    kind: 'response',
    fromKnows: 'baidu.com 权威服务器知道 www.baidu.com → 39.156.66.10',
    reply: 'A 记录：www.baidu.com → 39.156.66.10（TTL = 3600 s）',
    rtt: 3,
    learn: ['auth'],
    queryCount: 3,
  },
  {
    label: '本地 DNS → 主机（缓存并返回）',
    detail: '第 8 步：Resolver 缓存结果后应答客户端',
    from: 'resolver',
    to: 'host',
    kind: 'response',
    fromKnows: 'Resolver 把 A 记录写入本地缓存（缓存：www.baidu.com → 39.156.66.10）',
    reply: 'HTTP 客户端拿到 IP：39.156.66.10，可以开始建立 TCP 连接',
    rtt: 4,
    learn: ['resolver'],
    queryCount: 3,
  },
]

const REC_STEPS: DnsStep[] = [
  {
    label: '主机 → 本地 DNS',
    detail: '第 1 步：客户端只认识自己的本地 DNS',
    from: 'host',
    to: 'resolver',
    kind: 'query',
    fromKnows: '主机只知道要查的域名 www.baidu.com，对 IP 一无所知',
    reply: '（尚无应答，查询已发出）',
    rtt: 0,
    learn: [],
    queryCount: 0,
  },
  {
    label: '本地 DNS → 根服务器（RD=1）',
    detail: '第 2 步：Resolver 只发 1 个查询，要求递归',
    from: 'resolver',
    to: 'root',
    kind: 'query',
    fromKnows: 'Resolver 缓存里没有 www.baidu.com；递归查询把解析负担交给对方',
    reply: '（尚无应答，查询已发出）',
    rtt: 0,
    learn: [],
    queryCount: 1,
  },
  {
    label: '根服务器 → .com 顶级域',
    detail: '第 3 步：根替 Resolver 继续往下查',
    from: 'root',
    to: 'tld',
    kind: 'query',
    fromKnows: '根服务器只知道 .com 顶级域服务器的地址，但被要求给出最终答案',
    reply: '（尚无应答，查询已发出）',
    rtt: 0,
    learn: [],
    queryCount: 1,
  },
  {
    label: '.com 顶级域 → baidu.com 权威服务器',
    detail: '第 4 步：.com 同样被要求给出最终答案',
    from: 'tld',
    to: 'auth',
    kind: 'query',
    fromKnows: '.com 服务器知道 baidu.com 的权威服务器，但被要求给出最终答案',
    reply: '（尚无应答，查询已发出）',
    rtt: 0,
    learn: [],
    queryCount: 1,
  },
  {
    label: '权威服务器 → .com（A 记录）',
    detail: '第 5 步：递归查询的终点在层次树最深处',
    from: 'auth',
    to: 'tld',
    kind: 'response',
    fromKnows: 'baidu.com 权威服务器知道 www.baidu.com → 39.156.66.10',
    reply: 'A 记录：www.baidu.com → 39.156.66.10（TTL = 3600 s）',
    rtt: 1,
    learn: ['auth'],
    queryCount: 1,
  },
  {
    label: '.com → 根服务器（回传）',
    detail: '第 6 步：答案沿递归链向上回传',
    from: 'tld',
    to: 'root',
    kind: 'response',
    fromKnows: '.com 已经拿到最终 A 记录，向上回传给根',
    reply: 'A 记录：www.baidu.com → 39.156.66.10',
    rtt: 2,
    learn: ['tld'],
    queryCount: 1,
  },
  {
    label: '根服务器 → 本地 DNS（最终答案）',
    detail: '第 7 步：根把答案交回 Resolver',
    from: 'root',
    to: 'resolver',
    kind: 'response',
    fromKnows: '根服务器把最终答案返回给提问者',
    reply: 'A 记录：www.baidu.com → 39.156.66.10',
    rtt: 3,
    learn: ['root'],
    queryCount: 1,
  },
  {
    label: '本地 DNS → 主机（缓存并返回）',
    detail: '第 8 步：Resolver 缓存结果后应答客户端',
    from: 'resolver',
    to: 'host',
    kind: 'response',
    fromKnows: 'Resolver 把 A 记录写入本地缓存（缓存：www.baidu.com → 39.156.66.10）',
    reply: 'HTTP 客户端拿到 IP：39.156.66.10，可以开始建立 TCP 连接',
    rtt: 4,
    learn: ['resolver'],
    queryCount: 1,
  },
]

const CACHE_STEPS: DnsStep[] = [
  {
    label: '主机 → 本地 DNS（查缓存）',
    detail: '第二次查询 www.baidu.com',
    from: 'host',
    to: 'resolver',
    kind: 'query',
    fromKnows: '主机再次需要 www.baidu.com 的 IP',
    reply: '（尚无应答，查询已发出）',
    rtt: 0,
    learn: [],
    queryCount: 0,
  },
  {
    label: '本地 DNS → 主机（直接命中缓存）',
    detail: '本地 DNS 已有该域名的记录，无需再向上查询',
    from: 'resolver',
    to: 'host',
    kind: 'response',
    fromKnows: '本地 DNS 缓存中已有：www.baidu.com → 39.156.66.10（TTL 3600 s 未过期）',
    reply: '直接返回缓存的 A 记录——没有向根 / .com / 权威服务器发出任何查询',
    rtt: 1,
    learn: [],
    queryCount: 0,
  },
]

const ARROWS: Record<string, ArrowSpec> = {
  'host>resolver': { from: 'host', to: 'resolver', x1: 113, y1: 208, x2: 113, y2: 268, curve: 16 },
  'resolver>host': { from: 'resolver', to: 'host', x1: 113, y1: 268, x2: 113, y2: 208, curve: -16 },
  'resolver>root': { from: 'resolver', to: 'root', x1: 226, y1: 285, x2: 340, y2: 48, curve: 26 },
  'root>resolver': { from: 'root', to: 'resolver', x1: 340, y1: 66, x2: 226, y2: 313, curve: -26 },
  'resolver>tld': { from: 'resolver', to: 'tld', x1: 226, y1: 294, x2: 340, y2: 178, curve: 22 },
  'tld>resolver': { from: 'tld', to: 'resolver', x1: 340, y1: 192, x2: 226, y2: 302, curve: -22 },
  'resolver>auth': { from: 'resolver', to: 'auth', x1: 226, y1: 308, x2: 340, y2: 308, curve: 20 },
  'auth>resolver': { from: 'auth', to: 'resolver', x1: 340, y1: 320, x2: 226, y2: 320, curve: -20 },
  'root>tld': { from: 'root', to: 'tld', x1: 442, y1: 78, x2: 442, y2: 148, curve: 20 },
  'tld>root': { from: 'tld', to: 'root', x1: 442, y1: 148, x2: 442, y2: 78, curve: -20 },
  'tld>auth': { from: 'tld', to: 'auth', x1: 447, y1: 208, x2: 447, y2: 276, curve: 20 },
  'auth>tld': { from: 'auth', to: 'tld', x1: 447, y1: 276, x2: 447, y2: 208, curve: -20 },
}

const arrowKey = (from: NodeId, to: NodeId) => `${from}>${to}`

export default function DnsQueryDemo() {
  const [mode, setMode] = useState<'iterative' | 'recursive'>('iterative')
  const [cached, setCached] = useState(false)
  const [rttMs, setRttMs] = useState(40) // 每一跳的典型 RTT

  const steps = cached ? CACHE_STEPS : mode === 'iterative' ? ITER_STEPS : REC_STEPS

  const machine = useStepMachine(
    steps.map((s) => ({ label: s.label, detail: s.detail })),
    { intervalMs: 1300 },
  )
  const { index, setIndex, reset } = machine

  useEffect(() => {
    reset()
  }, [mode, cached, reset])

  const cur = steps[Math.min(index, steps.length - 1)]
  const known = useMemo(() => {
    const set = new Set<NodeId>()
    for (let i = 0; i <= index && i < steps.length; i++) steps[i].learn.forEach((n) => set.add(n))
    return set
  }, [index, steps])

  // 已发生的箭头（按步骤累计）
  const shown = useMemo(() => {
    const arr: { spec: ArrowSpec; kind: 'query' | 'response'; active: boolean }[] = []
    for (let i = 0; i <= index && i < steps.length; i++) {
      const s = steps[i]
      const spec = ARROWS[arrowKey(s.from, s.to)]
      if (!spec) continue
      arr.push({ spec, kind: s.kind, active: i === index })
    }
    return arr
  }, [index, steps])

  const totalRtt = steps[steps.length - 1].rtt
  const resolverQueries = steps[steps.length - 1].queryCount

  const W = 760
  const H = 400

  return (
    <DemoFrame
      title="DNS 查询：www.baidu.com 的解析全过程"
      description="PPT 第 90~92 页：迭代查询时 Resolver 依次问根、.com 顶级域、baidu.com 权威服务器；递归查询时根去问 .com、.com 去问权威服务器。走到哪一步，下面的树就亮到哪一步。"
      controls={
        <>
          <ParamSelect
            label="查询方式"
            value={cached ? 'cache' : mode}
            onChange={(v) => {
              if (v === 'cache') {
                setCached(true)
              } else {
                setCached(false)
                setMode(v as 'iterative' | 'recursive')
              }
            }}
            options={[
              { value: 'iterative', label: '迭代查询（Resolver 自己查 3 跳）' },
              { value: 'recursive', label: '递归查询（Resolver 只查 1 跳）' },
              { value: 'cache', label: '第二次查询：命中本地 DNS 缓存' },
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
        { color: '#4873e8', label: '查询方向（Query）' },
        { color: '#16a078', label: '应答方向（Reply）' },
        { color: '#c8ced8', label: '层次树中未被访问的分支' },
      ]}
    >
      <div className="space-y-4">
        {/* ---------- 参数 ---------- */}
        <div className="grid sm:grid-cols-2 gap-3">
          <ParamSlider
            label="每一跳的典型 RTT"
            value={rttMs}
            onChange={setRttMs}
            min={5}
            max={200}
            step={5}
            unit="ms"
            hint="Resolver ↔ 根 ↔ .com ↔ 权威 服务器之间"
          />
          <div className="rounded-lg px-3 py-2" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="text-xs font-medium mb-1">当前方案</div>
            <div className="text-[11px] muted leading-relaxed">
              {cached
                ? '本地 DNS 缓存命中：不再向层次树查询，直接返回 A 记录。'
                : mode === 'iterative'
                  ? '迭代查询：被问到的服务器只回答“我不知道，但你可以去问这台”，查询负担留给客户端（Resolver）。'
                  : '递归查询：被问到的服务器负责给出最终答案，查询负担转移到被问服务器一侧。'}
            </div>
          </div>
        </div>

        {/* ---------- 层次树 + 箭头 ---------- */}
        <div className="rounded-lg overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
          <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 660, width: '100%', height: 'auto' }}>
            <defs>
              <marker id="dns-q" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
                <path d="M0,0 L9,4.5 L0,9 z" fill="#4873e8" />
              </marker>
              <marker id="dns-r" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
                <path d="M0,0 L9,4.5 L0,9 z" fill="#16a078" />
              </marker>
            </defs>

            {/* 层次树的静态连接线 */}
            <line x1={442} y1={78} x2={442} y2={148} style={{ stroke: 'var(--border)' }} strokeWidth={1.5} />
            <line x1={447} y1={208} x2={447} y2={276} style={{ stroke: 'var(--border)' }} strokeWidth={1.5} />
            {/* 旁支：.org / .edu（未参与本次解析） */}
            <line x1={544} y1={44} x2={584} y2={40} style={{ stroke: 'var(--border)' }} strokeWidth={1} />
            <line x1={544} y1={56} x2={584} y2={104} style={{ stroke: 'var(--border)' }} strokeWidth={1} />
            <g opacity={0.45}>
              <rect x={584} y={18} width={94} height={44} rx={6} style={{ fill: 'var(--surface-2)', stroke: 'var(--border)' }} />
              <text x={631} y={38} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 11 }}>
                .org 顶级域
              </text>
              <text x={631} y={53} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 9 }}>
                （本次未访问）
              </text>
              <rect x={584} y={82} width={94} height={44} rx={6} style={{ fill: 'var(--surface-2)', stroke: 'var(--border)' }} />
              <text x={631} y={102} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 11 }}>
                .edu 顶级域
              </text>
              <text x={631} y={117} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 9 }}>
                （本次未访问）
              </text>
            </g>

            {/* 查询 / 应答箭头 */}
            {shown.map((a, i) => {
              const s = a.spec
              const color = a.kind === 'query' ? '#4873e8' : '#16a078'
              const dx = s.x2 - s.x1
              const dy = s.y2 - s.y1
              const len = Math.max(Math.hypot(dx, dy), 1)
              const nx = -dy / len
              const ny = dx / len
              const sign = a.kind === 'query' ? 1 : -1
              const mx = (s.x1 + s.x2) / 2 + nx * s.curve * sign
              const my = (s.y1 + s.y2) / 2 + ny * s.curve * sign
              return (
                <path
                  key={i}
                  d={`M${s.x1},${s.y1} Q${mx},${my} ${s.x2},${s.y2}`}
                  fill="none"
                  style={{ stroke: color }}
                  strokeWidth={a.active ? 3 : 1.8}
                  strokeDasharray={a.kind === 'response' ? '6 4' : undefined}
                  opacity={a.active ? 1 : 0.55}
                  markerEnd={`url(#${a.kind === 'query' ? 'dns-q' : 'dns-r'})`}
                />
              )
            })}

            {/* 服务器方框 */}
            {(Object.keys(NODES) as NodeId[]).map((id) => {
              const n = NODES[id]
              const isActive = cur.from === id || cur.to === id
              const isKnown = known.has(id)
              const touched = shown.some((a) => a.spec.from === id || a.spec.to === id)
              return (
                <g key={id}>
                  <rect
                    x={n.x}
                    y={n.y}
                    width={n.w}
                    height={n.h}
                    rx={8}
                    style={{
                      fill: isActive ? 'rgba(50,85,219,0.10)' : 'var(--surface)',
                      stroke: isActive ? 'var(--brand)' : isKnown ? '#16a078' : 'var(--border)',
                    }}
                    strokeWidth={isActive ? 2 : 1.2}
                  />
                  <text
                    x={n.x + n.w / 2}
                    y={n.y + (n.h > 60 ? 26 : 24)}
                    textAnchor="middle"
                    style={{ fill: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}
                  >
                    {n.title}
                  </text>
                  <text x={n.x + n.w / 2} y={n.y + n.h - 14} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 10 }}>
                    {n.sub}
                  </text>
                  {isKnown && (
                    <text x={n.x + n.w - 6} y={n.y + 12} textAnchor="end" style={{ fill: '#16a078', fontSize: 9.5, fontWeight: 600 }}>
                      ✓ 已知
                    </text>
                  )}
                  {!touched && !isKnown && (
                    <text x={n.x + n.w / 2} y={n.y - 5} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 9.5 }}>
                      未访问
                    </text>
                  )}
                </g>
              )
            })}

            {/* 层次说明 */}
            <text x={24} y={36} style={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 600 }}>
              DNS 层次树
            </text>
            <text x={24} y={54} style={{ fill: 'var(--text-muted)', fontSize: 10 }}>
              根 → 顶级域 → 权威
            </text>
            <text x={24} y={118} style={{ fill: 'var(--text-muted)', fontSize: 10 }}>
              本地 DNS 不属于层次结构，
            </text>
            <text x={24} y={132} style={{ fill: 'var(--text-muted)', fontSize: 10 }}>
              它是客户端的“默认名称服务器”
            </text>
          </svg>
        </div>

        {/* ---------- 当前步骤说明 ---------- */}
        <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="flex items-start gap-2 flex-wrap">
            <span
              className="text-[10px] chip shrink-0"
              style={{
                borderColor: cur.kind === 'query' ? '#4873e8' : '#16a078',
                color: cur.kind === 'query' ? '#4873e8' : '#16a078',
              }}
            >
              {cur.kind === 'query' ? '查询 Query' : '应答 Reply'}
            </span>
            <div className="min-w-0">
              <div className="text-sm font-semibold">{cur.label}</div>
              <div className="text-[11px] muted">{cur.detail}</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[10px] muted">累计 RTT</div>
              <div className="mono text-sm font-semibold tabular-nums">
                {cur.rtt} 跳 ≈ {((cur.rtt * rttMs) / 1000).toFixed(2)} s
              </div>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 mt-2.5">
            <div className="rounded-md px-2.5 py-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-[10px] muted mb-0.5">发方此刻知道什么</div>
              <div className="text-xs leading-relaxed">{cur.fromKnows}</div>
            </div>
            <div className="rounded-md px-2.5 py-2" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-[10px] muted mb-0.5">回复了什么</div>
              <div className="text-xs leading-relaxed">{cur.reply}</div>
            </div>
          </div>
        </div>

        {/* ---------- 记录表 ---------- */}
        <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold mb-1.5">解析过程中遇到的资源记录（RR）</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] mono" style={{ minWidth: 420 }}>
              <thead>
                <tr className="muted text-left">
                  <th className="py-1 pr-3 font-normal">Name</th>
                  <th className="py-1 pr-3 font-normal">Value</th>
                  <th className="py-1 pr-3 font-normal">Type</th>
                  <th className="py-1 font-normal">TTL</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="py-1 pr-3">com</td>
                  <td className="py-1 pr-3">a.servers.net</td>
                  <td className="py-1 pr-3">NS</td>
                  <td className="py-1">86400</td>
                </tr>
                <tr>
                  <td className="py-1 pr-3">baidu.com</td>
                  <td className="py-1 pr-3">ns1.baidu.com</td>
                  <td className="py-1 pr-3">NS</td>
                  <td className="py-1">3600</td>
                </tr>
                <tr style={{ fontWeight: 600 }}>
                  <td className="py-1 pr-3">www.baidu.com</td>
                  <td className="py-1 pr-3">39.156.66.10</td>
                  <td className="py-1 pr-3">A</td>
                  <td className="py-1">3600</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <ResultGrid
          items={[
            { label: 'Resolver 发出的查询数', value: `${resolverQueries} 次`, highlight: true },
            { label: '端到端累计 RTT', value: `${totalRtt} 跳`, hint: `≈ ${((totalRtt * rttMs) / 1000).toFixed(2)} s` },
            { label: '层次树深度', value: '3 层', hint: '根 → .com → baidu.com' },
            { label: '涉及服务器数', value: cached ? '1 台' : '4 台', hint: '不含旁支 .org/.edu' },
          ]}
        />

        <StepNote
          tone={cached ? 'ok' : mode === 'iterative' ? 'info' : 'warn'}
          text={
            cached
              ? '本地 DNS 会把解析结果缓存起来（TTL = 3600 s）。第二次再查 www.baidu.com 时，Resolver 直接从缓存返回 A 记录，既不用问根也不用问权威服务器，省掉了整整 3 跳查询——这也是 DNS 层次树不会被打垮的原因之一。'
              : mode === 'iterative'
                ? `迭代查询：Resolver 一共发出 ${resolverQueries} 次查询，自己依次问根、.com、baidu.com 权威服务器。根只回一句“我不知道，但 .com 知道”，.com 只回“baidu.com 的权威服务器是 ns1.baidu.com”。优点是根服务器负担轻（还能被 TLD 服务器缓存绕过），缺点是客户端要多次往返，端到端累计 ${totalRtt} 个 RTT。`
                : `递归查询：Resolver 只发出 ${resolverQueries} 次查询，剩下的由被问服务器代劳——根去问 .com，.com 去问权威服务器，答案再沿链回传。好处是被问服务器可以自己缓存并加速后续查询；代价是根服务器要承担全部解析负担，而且端到端仍要 ${totalRtt} 个 RTT（递归不一定更快，只是把负担转移了）。`
          }
        />

        <div className="text-xs muted leading-relaxed">
          步骤 {Math.min(index + 1, steps.length)} / {steps.length}：{cur.label}。
          提示：真实 DNS 中本地 DNS 服务器会同时缓存 TLD 服务器的地址，因此根服务器常常可以被“绕过”。
        </div>
      </div>
    </DemoFrame>
  )
}
