import { useMemo, useState } from 'react'
import { FigureCard, Scene, initialTime, prefersStillness, usePlayClock } from '../../figureKit'
import { W, H, box, projection, seg3, stroke, text, wire, type P } from './primitives'
type Mode = 'cookie' | 'cache' | 'conditional'
export const auditProjection = () => projection([[-220, -82, 0], [220, 82, 94]], 44, 32)
const info: Record<Mode, { title: string; explain: string }> = { cookie: { title: 'Cookie 状态关联', explain: '服务器通过 Set-Cookie 让浏览器保存标识，之后浏览器按作用域规则在请求中携带 Cookie；它用于关联请求，不代表服务器必然掌握真实身份。' }, cache: { title: '缓存命中 / 未命中', explain: '新鲜缓存命中时浏览器可直接复用副本；未命中则向源站请求并保存可缓存响应。缓存是否可用受 Cache-Control 等指令约束。' }, conditional: { title: '条件 GET 验证', explain: '副本过期后，客户端可用 If-None-Match 或 If-Modified-Since 验证；未变化时服务器返回 304，不带实体正文，客户端继续使用已有副本。' } }
const printLine = (P: P, a: [number, number, number], b: [number, number, number], surfaceMark = false) => {
  const line = stroke(seg3(P, a, b), 'lo')
  return surfaceMark ? line.replace('<path', '<path data-free="both" data-line-role="surface-print"') : line
}
const printFrame = (P: P, x0: number, x1: number, y: number, z0: number, z1: number) => [
  printLine(P, [x0, y, z0], [x1, y, z0]), printLine(P, [x1, y, z0], [x1, y, z1]),
  printLine(P, [x1, y, z1], [x0, y, z1]), printLine(P, [x0, y, z1], [x0, y, z0]),
].join('')
function phaseState(mode: Mode, phase: number) {
  if (mode === 'cookie') return [
    { from: [56, 52, 64], to: [-102, 48, 58], kind: 'Set-Cookie', body: 'session token', copies: 0 },
    { from: [-102, 48, 58], to: [-102, 48, 58], kind: 'browser stores cookie', body: 'saved token', copies: 1 },
    { from: [-102, 48, 58], to: [56, 52, 64], kind: 'Cookie request header', body: 'ticket only', copies: 1 },
  ][phase]!
  if (mode === 'cache') return [
    { from: [-102, 48, 58], to: [56, 52, 64], kind: 'cache miss → origin GET', body: 'request', copies: 0 },
    { from: [56, 52, 64], to: [-102, 48, 58], kind: '200 response stored locally', body: 'entity body', copies: 1 },
    { from: [-102, 48, 58], to: [-102, 48, 58], kind: 'fresh cache hit', body: 'local entity body', copies: 1 },
  ][phase]!
  return [
    { from: [-102, 48, 58], to: [56, 52, 64], kind: 'conditional GET', body: 'If-None-Match', copies: 1 },
    { from: [56, 52, 64], to: [56, 52, 64], kind: 'origin validates entity tag', body: 'comparison only', copies: 1 },
    { from: [56, 52, 64], to: [-102, 48, 58], kind: '304 headers; body read from cache', body: '304 has no body', copies: 1 },
  ][phase]!
}
export function draw(mode: Mode, t: number, P: P) {
  const o: string[] = []
  // Four distinct, open-top devices are kept as simple physical bodies. Labels
  // and moving protocol tokens remain overlays, so the model does not imply
  // that a request or cookie is a freestanding cabinet part.
  o.push(box(P, -210, -70, 420, 140, 0, 10, 'lo', 'web-lab-foundation', { ground: true }))
  o.push(box(P, -190, -48, 88, 96, 10, 48, 'mid', 'browser-workstation', { assembly: 'browser' }))
  o.push(box(P, -80, -40, 58, 80, 10, 24, 'hi', 'cookie-ticket-drawer', { assembly: 'cookie-store' }))
  o.push(box(P, -2, -32, 38, 64, 10, 32, 'lo', 'cache-cabinet', { assembly: 'local-cache' }))
  o.push(box(P, 56, -52, 128, 104, 10, 54, 'mid', 'origin-server-rack', { assembly: 'origin' }))
  o.push(printFrame(P, -182, -110, 48, 20, 52))
  o.push(printLine(P, [-178, 48, 25], [-114, 48, 25], true))
  o.push(text(P, [-146, 49, 45], 'WEB', 6))
  o.push(printFrame(P, -74, -28, 40, 14, 30))
  o.push(printLine(P, [-72, 40, 22], [-30, 40, 22], true))
  o.push(text(P, [-51, 41, 26], 'ID', 5))
  o.push(printFrame(P, 1, 33, 32, 13, 39))
  o.push(printLine(P, [2, 32, 22], [32, 32, 22], true))
  o.push(printLine(P, [2, 32, 31], [32, 32, 31], true))
  o.push(printFrame(P, 62, 178, 52, 15, 58))
  for (const z of [23, 33, 43, 53]) o.push(printLine(P, [66, 52, z], [174, 52, z], true))
  o.push(text(P, [120, 53, 56], 'ORIGIN', 6))
  o.push(text(P, [-146, -2, 62], '浏览器', 9))
  o.push(text(P, [-51, -2, 39], 'Cookie', 9))
  o.push(text(P, [17, -2, 47], '本地缓存', 8))
  o.push(text(P, [120, -2, 69], '源站', 9))
  o.push(wire(P, [-102, 48, 58], [56, 52, 64], 'browser-to-origin-logical-path', 'mid'))
  const phase = Math.floor(t % 9 / 3), u = (t % 3) / 3, state = phaseState(mode, phase)
  const [x, y, z] = state.from.map((v, i) => v + (state.to[i]! - v) * u) as [number, number, number]
  const ticketVisible = mode === 'cookie' && phase >= 1
  const cachedVisible = mode === 'cache' && phase >= 2 || mode === 'conditional'
  if (ticketVisible) o.push(box(P, -145, -10, 15, 10, 65, 5, 'hi', 'persisted-browser-cookie', { logical: true }))
  if (cachedVisible) o.push(box(P, 8, 10, 18, 12, 45, 5, 'hi', 'cached-entity-copy', { logical: true }))
  const moving = state.from[0] !== state.to[0]
  if (moving) {
    o.push(box(P, x - 6, y - 5, 12, 10, z, 5, mode === 'cookie' ? 'hi' : 'mid', mode === 'cookie' ? 'identity-ticket' : 'http-resource-message', { logical: true }))
    o.push(box(P, x - 4, y - 3, 8, 1, z + 5, 1, 'lo', 'message-field', { logical: true }))
  }
  const label = state.kind
  o.push(text(P, [0, -67, 84], label, 9))
  return o.join('')
}
export default function CookieCacheFigure() {
  const [mode, setMode] = useState<Mode>('cookie')
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const P = useMemo(() => auditProjection(), [])
  const stage = Math.floor(t % 9 / 3)
  const phaseTitle = mode === 'cookie'
    ? ['源站发 Set-Cookie', '浏览器保存票据', '浏览器在后续请求发送 Cookie'][stage]
    : mode === 'cache'
      ? ['本地未命中并访问源站', '源站返回 200 并保存副本', '浏览器直接复用新鲜副本'][stage]
      : ['浏览器发送条件 GET', '源站比较验证器', '源站发 304 头；正文来自本地副本'][stage]
  const state = phaseState(mode, stage)

  return <FigureCard
    fig="Fig 2.2.3"
    title="Cookie 与缓存检验台"
    subtitle={`${info[mode].title} · ${phaseTitle}`}
    readout={<span>{state.kind}　·　{state.body}{mode === 'conditional' && stage === 2 ? ' · response entity absent' : ''}</span>}
    running={running}
    onToggle={() => setRunning(v => !v)}
    onReset={() => setT(0)}
    extra={<div className="flex gap-1">
      {(['cookie', 'cache', 'conditional'] as Mode[]).map(m => <button className="btn-outline" key={m} onClick={() => { setT(0); setMode(m) }}>{info[m].title}</button>)}
    </div>}
    caption={info[mode].explain}
    legend="左：浏览器　·　中：Cookie 保存与本地缓存　·　右：源站　·　虚线：请求/响应路径"
  >
    <Scene width={W} height={H} label={`${info[mode].title}：浏览器、Cookie存储、缓存与源站`} svg={draw(mode, t, P)} />
  </FigureCard>
}
