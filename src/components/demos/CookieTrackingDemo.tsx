import { useMemo, useState } from 'react'
import { DemoFrame, ParamSlider, PlayControls, ResultGrid, StepNote, useStepMachine } from './DemoKit'

/**
 * Cookie 跟踪：nytimes.com → AdX.com → socks.com 的跨站追踪链路。
 * PPT 第 44~51 页。区分「第一方 Cookie」（用户主动访问的站点设置）与
 * 「第三方 Cookie」（用户没有主动访问的广告商设置）。
 */

type ActorId = 'nyt' | 'adx' | 'socks'

interface TrackStep {
  label: string
  detail: string
  actor: 'browser' | ActorId
  actorLabel: string
  action: string
  targetId: ActorId
  /** 该步骤设置 Cookie（AdX 的属于第三方） */
  cookieSet?: { owner: ActorId; ownerLabel: string; id: string; desc: string; firstParty: boolean; since: string }
  /** 该步骤携带 Cookie */
  cookieSent?: { id: string; to: string }
  firstParty: boolean
  risk: string
}

interface Actor {
  id: ActorId
  x: number
  y: number
  w: number
  h: number
  title: string
  sub: string
}

const ACTORS: Actor[] = [
  { id: 'nyt', x: 320, y: 20, w: 200, h: 62, title: 'nytimes.com', sub: '体育版页面 + 广告位' },
  { id: 'adx', x: 320, y: 148, w: 200, h: 62, title: 'AdX.com', sub: '广告服务器' },
  { id: 'socks', x: 320, y: 272, w: 200, h: 62, title: 'socks.com', sub: '在线袜店' },
]

const BROWSER = { x: 24, y: 96, w: 196, h: 76, title: '用户浏览器', sub: 'Susan 的 PC' }

export default function CookieTrackingDemo() {
  const [nytCookieId, setNytCookieId] = useState(1634)
  const [adxCookieId, setAdxCookieId] = useState(7493)
  const [showReferer, setShowReferer] = useState(true)
  const [onlyFirstParty, setOnlyFirstParty] = useState(false)
  const [adBlocker, setAdBlocker] = useState(false)

  // ---------- 步骤定义（随 cookie ID / Referer 开关变化） ----------
  const steps = useMemo<TrackStep[]>(
    () => [
      {
        label: '① 用户访问 nytimes.com',
        detail: '浏览器建立到 nytimes.com 的 HTTP 请求',
        actor: 'browser',
        actorLabel: '浏览器',
        action: `GET http://www.nytimes.com/ HTTP/1.1\nHost: www.nytimes.com`,
        targetId: 'nyt',
        firstParty: true,
        risk: '第一方访问：nytimes.com 可以看到你在浏览它自己的页面。',
      },
      {
        label: '② nytimes.com 设置第一方 Cookie',
        detail: '响应报文里带 Set-Cookie 首部行',
        actor: 'nyt',
        actorLabel: 'nytimes.com',
        action: `HTTP/1.1 200 OK\nContent-Type: text/html\nSet-Cookie: ${nytCookieId}=sports; path=/`,
        targetId: 'nyt',
        cookieSet: {
          owner: 'nyt',
          ownerLabel: 'nytimes.com',
          id: String(nytCookieId),
          desc: 'sports, 2/15/22',
          firstParty: true,
          since: '2/15/22',
        },
        firstParty: true,
        risk: `Cookie ${nytCookieId} 由用户“主动访问的网站”设置，属于第一方 Cookie；它只记录你在 nytimes.com 的浏览行为。`,
      },
      {
        label: '③ 页面含有 AdX 广告 → 浏览器请求 AdX',
        detail: '第三方广告的域不同，且携带 Referer',
        actor: 'browser',
        actorLabel: '浏览器',
        action: `GET http://adx.com/ads HTTP/1.1\nHost: adx.com${showReferer ? '\nReferer: http://www.nytimes.com/' : ''}`,
        targetId: 'adx',
        firstParty: false,
        risk: '用户并没有主动访问 AdX.com，这是一次第三方请求。',
      },
      {
        label: '④ AdX.com 设置第三方 Cookie',
        detail: 'AdX 给浏览器发一个属于它自己的 Cookie',
        actor: 'adx',
        actorLabel: 'AdX.com',
        action: `HTTP/1.1 200 OK\nSet-Cookie: ${adxCookieId}=NYTimes-sports; path=/`,
        targetId: 'adx',
        cookieSet: {
          owner: 'adx',
          ownerLabel: 'AdX.com',
          id: String(adxCookieId),
          desc: 'NY Times sports, 2/15/22',
          firstParty: false,
          since: '2/15/22',
        },
        firstParty: false,
        risk: `第三方 Cookie ${adxCookieId} 由用户没有主动访问的广告商设置，它携带了“你在 nytimes.com 看了什么”的信息。`,
      },
      {
        label: '⑤ 用户访问 socks.com（第二天）',
        detail: 'sock 商店的页面上也有 AdX 的广告',
        actor: 'browser',
        actorLabel: '浏览器',
        action: `GET http://www.socks.com/ HTTP/1.1\nHost: www.socks.com`,
        targetId: 'socks',
        firstParty: true,
        risk: '又是一次第一方访问，但这一次请求会引出第三方 Cookie。',
      },
      {
        label: '⑥ 浏览器向 AdX 发请求并带上第三方 Cookie',
        detail: '跨站追踪的关键一步',
        actor: 'browser',
        actorLabel: '浏览器',
        action: `GET http://adx.com/ads HTTP/1.1\nHost: adx.com${showReferer ? '\nReferer: http://www.socks.com/' : ''}\nCookie: ${adxCookieId}=NYTimes-sports`,
        targetId: 'adx',
        cookieSent: { id: String(adxCookieId), to: 'AdX.com' },
        firstParty: false,
        risk: `即使 AdX 的广告出现在 socks.com 上，浏览器仍然会带上 AdX 之前设置的 Cookie ${adxCookieId}。`,
      },
      {
        label: '⑦ AdX 认出跨站用户并定向投放',
        detail: 'AdX 掌握该用户在不同站点的浏览轨迹',
        actor: 'adx',
        actorLabel: 'AdX.com',
        action: `HTTP/1.1 200 OK\nSet-Cookie: ${adxCookieId}=socks.com; path=/\n返回定向广告：运动袜`,
        targetId: 'adx',
        cookieSet: {
          owner: 'adx',
          ownerLabel: 'AdX.com',
          id: String(adxCookieId),
          desc: 'socks.com, 2/16/22',
          firstParty: false,
          since: '2/16/22',
        },
        firstParty: false,
        risk: 'AdX 现在知道了：这个同一个人昨天在 nytimes.com 看体育版，今天在 socks.com 买袜子——于是可以跨站投放定向广告。',
      },
    ],
    [nytCookieId, adxCookieId, showReferer],
  )

  const machine = useStepMachine(
    steps.map((s) => ({ label: s.label, detail: s.detail })),
    { intervalMs: 1600 },
  )
  const { index, setIndex } = machine
  const cur = steps[Math.min(index, steps.length - 1)]

  /** 广告拦截器：第三方请求被拦下 → AdX 既收不到请求，也无法设置/回传第三方 Cookie */
  const blocked = (s: TrackStep) => adBlocker && !s.firstParty

  // ---------- 浏览器 cookie jar ----------
  const jar = useMemo(() => {
    const list: { owner: ActorId; ownerLabel: string; id: string; desc: string; firstParty: boolean; since: string }[] = []
    for (let i = 0; i <= index && i < steps.length; i++) {
      const s = steps[i]
      const c = s.cookieSet
      if (!c) continue
      if (blocked(s)) continue
      const existing = list.findIndex((x) => x.owner === c.owner)
      if (existing >= 0) list[existing] = { ...c }
      else list.push({ ...c })
    }
    return list
  }, [index, steps, adBlocker])

  const visibleJar = onlyFirstParty ? jar.filter((c) => c.firstParty) : jar
  const thirdParty = jar.filter((c) => !c.firstParty)

  /** 已实际发送出去的第三方 Cookie */
  const sentCookies = useMemo(() => {
    const out: { id: string; to: string }[] = []
    for (let i = 0; i <= index && i < steps.length; i++) {
      const s = steps[i]
      if (s.cookieSent && !blocked(s)) out.push(s.cookieSent)
    }
    return out
  }, [index, steps, adBlocker])

  const W = 560
  const H = 360

  const arrowFor = (s: TrackStep) => {
    const target = ACTORS.find((a) => a.id === s.targetId)!
    const from = s.actor === 'browser' ? BROWSER : ACTORS.find((a) => a.id === s.actor)!
    const to = s.actor === 'browser' ? target : BROWSER
    return {
      x1: from.x + from.w,
      y1: from.y + from.h / 2,
      x2: to.x,
      y2: to.y + to.h / 2,
    }
  }

  const colorOf = (s: TrackStep) => (s.firstParty ? '#4873e8' : '#dc7828')
  const involvedIds = new Set(steps.slice(0, index + 1).map((s) => s.targetId))

  return (
    <DemoFrame
      title="Cookie 跟踪：第三方 Cookie 如何跨站追踪用户"
      description="PPT 第 44~51 页。Cookie 让 HTTP 这类无状态协议“记住”用户；而广告商设置的第三方 Cookie 更是把用户在多个网站上的浏览轨迹串了起来。"
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
        { color: '#4873e8', label: '第一方 Cookie（用户主动访问的站点）' },
        { color: '#dc7828', label: '第三方 Cookie（用户未主动访问的广告商）' },
        { color: '#c8ced8', label: '其他站点' },
      ]}
    >
      <div className="space-y-4">
        {/* ---------- 参数 ---------- */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ParamSlider
            label="nytimes.com 的 cookie ID（第一方）"
            value={nytCookieId}
            onChange={setNytCookieId}
            min={1000}
            max={9999}
            step={1}
            unit=""
            hint="PPT 原值 1634"
          />
          <ParamSlider
            label="AdX.com 的 cookie ID（第三方）"
            value={adxCookieId}
            onChange={setAdxCookieId}
            min={1000}
            max={9999}
            step={1}
            unit=""
            hint="PPT 原值 7493"
          />
          <div className="flex flex-col gap-2 justify-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showReferer}
                onChange={(e) => setShowReferer(e.target.checked)}
                className="accent-[var(--brand)] cursor-pointer"
              />
              <span className="text-xs">报文里显示 Referer 首部</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={onlyFirstParty}
                onChange={(e) => setOnlyFirstParty(e.target.checked)}
                className="accent-[var(--brand)] cursor-pointer"
              />
              <span className="text-xs">浏览器只显示第一方 Cookie</span>
            </label>
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={adBlocker}
              onChange={(e) => setAdBlocker(e.target.checked)}
              className="mt-1 accent-[var(--brand)] cursor-pointer"
            />
            <span>
              <span className="text-xs font-medium">安装广告拦截器</span>
              <span className="block text-[10px] muted">
                拦截第三方广告请求，第三方 Cookie 将无法设置与回传
              </span>
            </span>
          </label>
        </div>

        {/* ---------- 拓扑图 + 当前步骤 ---------- */}
        <div className="grid lg:grid-cols-[1.25fr_1fr] gap-3">
          <div className="rounded-lg overflow-x-auto" style={{ border: '1px solid var(--border)' }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ minWidth: 460, width: '100%', height: 'auto' }}>
              <defs>
                <marker id="ck-fp" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
                  <path d="M0,0 L9,4.5 L0,9 z" fill="#4873e8" />
                </marker>
                <marker id="ck-tp" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto">
                  <path d="M0,0 L9,4.5 L0,9 z" fill="#dc7828" />
                </marker>
              </defs>

              {/* 页面内嵌广告的连线 */}
              <line x1={420} y1={82} x2={420} y2={148} style={{ stroke: 'var(--border)' }} strokeWidth={1.5} strokeDasharray="4 3" />
              <line x1={420} y1={210} x2={420} y2={272} style={{ stroke: 'var(--border)' }} strokeWidth={1.5} strokeDasharray="4 3" />
              <text x={426} y={118} style={{ fill: 'var(--text-muted)', fontSize: 9 }}>
                内嵌广告
              </text>
              <text x={426} y={245} style={{ fill: 'var(--text-muted)', fontSize: 9 }}>
                内嵌广告
              </text>

              {/* 浏览器 cookie jar */}
              <rect x={24} y={196} width={196} height={104} rx={8} style={{ fill: 'var(--surface)', stroke: 'var(--border)' }} strokeWidth={1.2} />
              <text x={122} y={214} textAnchor="middle" style={{ fill: 'var(--text)', fontSize: 11, fontWeight: 600 }}>
                浏览器 cookie jar
              </text>
              {visibleJar.length === 0 && (
                <text x={122} y={250} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 10 }}>
                  （空）
                </text>
              )}
              {visibleJar.map((c, i) => (
                <g key={`${c.owner}-${c.id}`}>
                  <rect
                    x={34}
                    y={222 + i * 34}
                    width={176}
                    height={28}
                    rx={5}
                    style={{
                      fill: c.firstParty ? 'rgba(72,115,232,0.10)' : 'rgba(220,120,40,0.12)',
                      stroke: c.firstParty ? '#4873e8' : '#dc7828',
                    }}
                    strokeWidth={1}
                  />
                  <text x={42} y={240 + i * 34} style={{ fill: 'var(--text)', fontSize: 10 }}>
                    {c.ownerLabel}: {c.id}
                  </text>
                  <text x={202} y={240 + i * 34} textAnchor="end" style={{ fill: 'var(--text-muted)', fontSize: 9 }}>
                    {c.firstParty ? '第一方' : '第三方'}
                  </text>
                </g>
              ))}

              {/* 服务器方框 */}
              {ACTORS.map((a) => {
                const involved = involvedIds.has(a.id)
                return (
                  <g key={a.id}>
                    <rect
                      x={a.x}
                      y={a.y}
                      width={a.w}
                      height={a.h}
                      rx={8}
                      style={{ fill: involved ? 'var(--surface)' : 'var(--surface-2)', stroke: 'var(--border)' }}
                      strokeWidth={1.2}
                    />
                    <text x={a.x + a.w / 2} y={a.y + 26} textAnchor="middle" style={{ fill: 'var(--text)', fontSize: 12.5, fontWeight: 600 }}>
                      {a.title}
                    </text>
                    <text x={a.x + a.w / 2} y={a.y + 45} textAnchor="middle" style={{ fill: 'var(--text-muted)', fontSize: 10 }}>
                      {a.sub}
                    </text>
                    {involved && (
                      <text x={a.x + a.w - 6} y={a.y + 12} textAnchor="end" style={{ fill: 'var(--brand)', fontSize: 9.5, fontWeight: 600 }}>
                        ✓ 参与
                      </text>
                    )}
                  </g>
                )
              })}

              {/* 当前箭头 */}
              {(() => {
                const a = arrowFor(cur)
                if (!a) return null
                if (blocked(cur)) {
                  return (
                    <g>
                      <line x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} style={{ stroke: '#dc7828' }} strokeWidth={2} strokeDasharray="5 4" />
                      <text
                        x={(a.x1 + a.x2) / 2}
                        y={(a.y1 + a.y2) / 2 - 8}
                        textAnchor="middle"
                        style={{ fill: '#dc7828', fontSize: 11, fontWeight: 700 }}
                      >
                        ✕ 已被拦截
                      </text>
                    </g>
                  )
                }
                const color = colorOf(cur)
                return (
                  <g>
                    <path
                      d={`M${a.x1},${a.y1} C${a.x1 + 60},${a.y1 - 18} ${a.x2 - 60},${a.y2 - 18} ${a.x2},${a.y2}`}
                      fill="none"
                      style={{ stroke: color }}
                      strokeWidth={3}
                      markerEnd={cur.firstParty ? 'url(#ck-fp)' : 'url(#ck-tp)'}
                    />
                    <text
                      x={(a.x1 + a.x2) / 2}
                      y={(a.y1 + a.y2) / 2 - 8}
                      textAnchor="middle"
                      style={{ fill: color, fontSize: 10.5, fontWeight: 600 }}
                    >
                      {cur.actor === 'browser' ? '请求' : '应答'}
                    </text>
                  </g>
                )
              })()}

              {/* 已发送的第三方 cookie 标记 */}
              {sentCookies.map((c, i) => (
                <g key={i}>
                  <circle cx={250} cy={126 + i * 16} r={6} style={{ fill: '#dc7828' }} />
                  <text x={262} y={130 + i * 16} style={{ fill: '#dc7828', fontSize: 9.5, fontWeight: 600 }}>
                    Cookie: {c.id} → {c.to}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* ---------- 当前步骤 + cookie jar ---------- */}
          <div className="space-y-3">
            <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <div className="flex items-start gap-2 flex-wrap">
                <span className="text-[10px] chip shrink-0" style={{ borderColor: colorOf(cur), color: colorOf(cur) }}>
                  {cur.firstParty ? '第一方' : '第三方'}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-semibold">{cur.label}</div>
                  <div className="text-[11px] muted">{cur.detail}</div>
                </div>
              </div>
              <pre
                className="mono text-[10.5px] leading-relaxed mt-2 p-2 rounded-md overflow-x-auto whitespace-pre-wrap"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                {blocked(cur) ? '—— 请求被广告拦截器挡下，没有发出去 ——' : cur.action}
              </pre>
              <div className="text-[11px] mt-2 leading-relaxed" style={{ color: colorOf(cur) }}>
                {blocked(cur)
                  ? '广告拦截器阻止了这一次第三方请求：AdX.com 既收不到请求，也无法设置或读到自己的第三方 Cookie，跨站追踪链条就此断开。'
                  : cur.risk}
              </div>
            </div>

            <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
              <div className="text-xs font-semibold mb-1.5">浏览器当前的 Cookie（{jar.length} 个）</div>
              {jar.length === 0 && <div className="text-[11px] muted">还没有任何 Cookie。</div>}
              <div className="space-y-1.5">
                {jar.map((c) => (
                  <div
                    key={c.owner}
                    className="rounded-md px-2 py-1.5"
                    style={{
                      background: c.firstParty ? 'rgba(72,115,232,0.09)' : 'rgba(220,120,40,0.10)',
                      border: `1px solid ${c.firstParty ? '#4873e8' : '#dc7828'}`,
                    }}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] mono font-semibold">
                        {c.ownerLabel}: {c.id}
                      </span>
                      <span className="text-[9.5px]" style={{ color: c.firstParty ? '#4873e8' : '#dc7828' }}>
                        {c.firstParty ? '第一方 Cookie' : '第三方 Cookie'}
                      </span>
                    </div>
                    <div className="text-[10px] muted">
                      内容：{c.desc} · 设置于 {c.since}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-[10px] muted mt-2 leading-relaxed">
                第一方 Cookie：由用户<strong>主动访问</strong>的站点设置（如 nytimes.com），只反映该站点内的浏览行为。
                第三方 Cookie：由用户<strong>没有主动访问</strong>的广告商设置（如 AdX.com），可跨站追踪。
              </div>
            </div>
          </div>
        </div>

        {/* ---------- 步骤列表 ---------- */}
        <div className="rounded-lg p-3" style={{ border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold mb-2">完整流程</div>
          <ol className="space-y-1.5">
            {steps.map((s, i) => (
              <li key={s.label}>
                <button
                  onClick={() => setIndex(i)}
                  className="w-full text-left rounded-md px-2.5 py-1.5 transition-colors"
                  style={{
                    background: i === index ? 'rgba(50,85,219,0.08)' : 'transparent',
                    border: `1px solid ${i === index ? 'var(--brand)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: i <= index ? colorOf(s) : 'var(--border)' }} />
                    <span className="text-[11.5px] font-medium">{s.label}</span>
                    <span className="text-[10px] muted">{s.detail}</span>
                    {blocked(s) && (
                      <span className="text-[9.5px]" style={{ color: '#dc7828' }}>
                        （已被拦截）
                      </span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <ResultGrid
          items={[
            { label: '第一方 Cookie', value: `${jar.filter((c) => c.firstParty).length} 个`, hint: 'nytimes.com 设置' },
            { label: '第三方 Cookie', value: `${thirdParty.length} 个`, highlight: true, hint: 'AdX.com 设置' },
            { label: '跨站泄漏的站点', value: '2 个', hint: 'nytimes.com + socks.com' },
            {
              label: '实际回传的第三方 Cookie',
              value: `${sentCookies.length} 次`,
              hint: adBlocker ? '被拦截器挡住' : '浏览器自动携带',
            },
          ]}
        />

        <StepNote
          tone={adBlocker ? 'ok' : 'warn'}
          text={
            adBlocker
              ? '装上广告拦截器后，浏览器不再把 AdX.com 嵌入的第三方请求发出去，第三方 Cookie 也就无法设置、无法在 socks.com 上被回传——跨站追踪链路被切断了。注意第一方 Cookie（nytimes.com 的那个）仍然存在，因为那是你主动访问过的站点设置的。'
              : `隐私风险在于：AdX.com 只是在 nytimes.com 和 socks.com 的页面里放了一条广告，浏览器却自动把 AdX 之前设置的第三方 Cookie 带了过去。于是 AdX 掌握了同一个用户跨站的行为轨迹（2/15 在 nytimes.com 看体育版，2/16 在 socks.com 买袜子），并据此返回定向广告——“广告商获得了跨站信息”。现代浏览器对第三方 Cookie 的拦截（Safari ITP、Chrome 的第三方 Cookie 弃用计划）正是为了封堵这条链路。`
          }
        />

        <div className="text-xs muted leading-relaxed">
          步骤 {Math.min(index + 1, steps.length)} / {steps.length}。
          提示：PPT 第 51 页还展示了“一天后”的情形——nytimes.com 又被访问时，浏览器会同时带上 nytimes 的第一方 Cookie 和 AdX 的第三方 Cookie，而 AdX 会把第三方 Cookie 的内容更新为最新一次访问的站点。
        </div>
      </div>
    </DemoFrame>
  )
}
