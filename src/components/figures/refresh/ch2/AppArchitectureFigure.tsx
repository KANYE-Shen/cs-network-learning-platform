import { useMemo, useState } from 'react'
import * as k from '../../../iso/iso-kit'
import { FigureCard, Scene, initialTime, prefersStillness, usePlayClock } from '../../figureKit'
import { W, H, box, depthSortSvg, port, projection, round, text, wire, type P } from './primitives'

type Mode = 'cs' | 'p2p'
export const auditProjection = () => projection([[-230, -90, 0], [230, 90, 115]])
const MODE = {
  cs: { title: '客户端—服务器', explanation: '服务器持续在线并集中提供服务；客户端发起请求。服务器承担服务端职责，客户端承担使用端职责。' },
  p2p: { title: '对等式 P2P', explanation: '每个在线主机既能请求资源，也能向其他主机提供资源；没有必须常在线的中央内容服务器。' },
}
export function model(mode: Mode, t: number, P: P) {
  const out: string[] = []
  const phase = Math.floor((t % 8) / 2)
  const u = (t % 2) / 2
  const ease = (x: number) => x * x * (3 - 2 * x)
  const mix = (a: number, b: number, x: number) => a + (b - a) * ease(x)
  out.push(box(P, -218, -84, 436, 168, 0, 10, 'lo', 'architecture-bench-base', { ground: true }))
  // The server is an open rack: rails and shelves leave the working parts visible.
  if (mode === 'cs') {
    const assembly = 'server-rack'
    out.push(box(P, -178, -32, 5, 66, 10, 76, 'mid', 'rack-left-upright', { assembly }))
    out.push(box(P, -173, -32, 66, 5, 10, 76, 'lo', 'rack-back-panel', { assembly }))
    for (let i = 0;i < 4;i++) {
      const z = 26 + i * 13
      out.push(box(P, -173, -25, 66, 54, z, 3, 'mid', `server-shelf-${i}`, { assembly }))
      out.push(box(P, -166, -21, 24, 40, z + 3, 7, 'hi', `compute-blade-${i}`, { assembly }))
      out.push(box(P, -137, -21, 24, 40, z + 3, 7, 'lo', `storage-module-${i}`, { assembly }))
    }
    // This upright sits on the foreground side of the equipment in projection.
    out.push(box(P, -107, -32, 5, 66, 10, 76, 'mid', 'rack-right-upright', { assembly }))
  }
  for (let n = 0;n < 4;n++) {
    const x = 24 + (n % 2) * 118
    const y = -52 + Math.floor(n / 2) * 92
    const assembly = `terminal-${n}`
    out.push(box(P, x, y - 16, 66, 58, 10, 10, 'lo', `terminal-${n}-base`, { assembly }))
    out.push(box(P, x + 17, y - 13, 32, 10, 20, 2, 'hi', `terminal-${n}-keyboard`, { assembly }))
    out.push(box(P, x + 8, y + 9, 50, 24, 20, 26, 'mid', `terminal-${n}-monitor`, { assembly }))
    out.push(box(P, x + 12, y + 13, 42, 16, 46, 1.4, mode === 'cs' ? 'hi' : 'mid', `terminal-${n}-display`, { assembly }))
  }
  // Cable routes join actual terminal ports. In P2P, the resource server leaves the scene.
  const routes: [k.Point3, k.Point3][] = mode === 'cs'
    ? [[[-104.5, 34, 18], [57, -10, 18]]]
    : [[[90, -10, 18], [142, -10, 18]], [[57, -10, 18], [57, 34, 18]], [[175, -10, 18], [175, 34, 18]], [[90, 61, 18], [142, 61, 18]]]
  for (let i = 0;i < routes.length;i++) {
    const [a, b] = routes[i]!
    out.push(wire(P, a, b, `ethernet-cable-${i}`, 'mid'))
    out.push(port(P, a, `ethernet-port-${i}-a`), port(P, b, `ethernet-port-${i}-b`))
  }
  const client: k.Point3 = mode === 'cs' ? [57, -10, 18] : [90, -10, 18]
  const server: k.Point3 = mode === 'cs' ? [-104.5, 34, 18] : [142, -10, 18]
  let from = client, to = server
  if (mode === 'cs' && phase === 1) { from = server; to = server }
  if (mode === 'cs' && phase === 2) { from = server; to = client }
  if (mode === 'cs' && phase === 3) { from = client; to = client }
  if (mode === 'p2p') {
    const a: k.Point3 = [90, -10, 18], b: k.Point3 = [142, -10, 18]
    if (phase === 0) { from = a; to = b }
    if (phase === 1) { from = b; to = b }
    if (phase === 2) { from = b; to = a }
    if (phase === 3) { from = a; to = a }
  }
  const px = mix(from[0], to[0], u)
  const py = mix(from[1], to[1], u)
  const pz = mix(from[2], to[2], u)
  out.push(box(P, px - 6, py - 4, 12, 8, pz, 6, 'hi', 'service-data-chunk', { logical: true }))
  out.push(box(P, px - 4, py - 3, 8, 1, pz + 6, 1, 'lo', 'chunk-header', { logical: true }))
  if (mode === 'cs') out.push(text(P, [-137, 38, 96], '服务资源机柜', 11))
  out.push(text(P, [112, 34, 68], mode === 'cs' ? '客户端' : '对等主机', 11))
  return depthSortSvg(out.join(''), P)
}

export default function AppArchitectureFigure() {
  const [mode, setMode] = useState<Mode>('cs')
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const points: k.Point3[] = [[-230, -90, 0], [230, 90, 115]]
  const P = useMemo(() => auditProjection(), [])
  const svg = useMemo(() => model(mode, t, P), [mode, t, P])
  const current = MODE[mode]
  const step = Math.floor((t % 8) / 2)
  const phaseTitles = mode === 'cs'
    ? ['客户端发出请求', '服务器处理请求', '服务器返回数据', '客户端接收完成']
    : ['Peer A 请求分块', 'Peer B 准备资源', 'Peer B 返回分块', 'Peer A 接收完成']
  return <FigureCard fig="Fig 2.1.1" title="应用体系：服务如何分布在主机之间" subtitle={`${current.title} · ${phaseTitles[step]}`} readout={<span>{phaseTitles[step]}　·　{mode === 'cs' ? (step === 1 ? '请求在服务器驻留处理' : '请求/响应沿同一连接往返') : step < 2 ? 'A请求，B准备资源' : 'B返回，A接收'}</span>} running={running} onToggle={() => setRunning((v) => !v)} onReset={() => setT(0)} extra={<div className="flex gap-1"><button className="btn-outline" aria-pressed={mode === 'cs'} onClick={() => { setT(0); setMode('cs') }}>C/S</button><button className="btn-outline" aria-pressed={mode === 'p2p'} onClick={() => { setT(0); setMode('p2p') }}>P2P</button></div>} caption={current.explanation} legend={mode === 'cs' ? '左上：常在线服务器　·　右下：四个客户端　·　虚线：客户端到服务器的通信路径' : '四台主机互为对等端　·　虚线：主机之间可用的通信路径'}>
    <Scene width={W} height={H} label={`应用体系结构：${current.title}，机柜与桌面终端`} svg={svg} />
  </FigureCard>
}
