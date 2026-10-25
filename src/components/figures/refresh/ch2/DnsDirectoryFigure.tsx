import { useMemo, useState } from 'react'
import { FigureCard, Scene, initialTime, prefersStillness, usePlayClock } from '../../figureKit'
import { W, H, box, projection, seg3, stroke, text, wire, type P } from './primitives'
type RecordKind = 'A' | 'NS' | 'MX'
export const auditProjection = () => projection([[-230, -86, 0], [230, 86, 124]], 42, 32)
const recordData: Record<RecordKind, string> = { A: 'www.example.com → 192.0.2.1', NS: 'example.com → ns1.example.net', MX: 'example.com → mail.example.net' }
const printLine = (P: P, a: [number, number, number], b: [number, number, number], surfaceMark = false) => {
  const line = stroke(seg3(P, a, b), 'lo')
  return surfaceMark ? line.replace('<path', '<path data-free="both" data-line-role="surface-print"') : line
}
const printFrame = (P: P, x0: number, x1: number, y: number, z0: number, z1: number) => [
  printLine(P, [x0, y, z0], [x1, y, z0]), printLine(P, [x1, y, z0], [x1, y, z1]),
  printLine(P, [x1, y, z1], [x0, y, z1]), printLine(P, [x0, y, z1], [x0, y, z0]),
].join('')
export function model(t: number) {
  const phase = Math.floor((t % 14) / 2), u = (t % 2) / 2
  const steps = [
    { title: '递归解析器询问根服务器', from: [-78, 32, 54], to: [-56, 32, 54], action: 'resolver → root：查询 example.com 的委派' },
    { title: '根服务器返回 TLD 委派', from: [-56, 32, 54], to: [-78, 32, 54], action: 'root → resolver：返回 .com 名称服务器线索' },
    { title: '解析器询问 .com TLD', from: [-78, 32, 54], to: [20, 32, 54], action: 'resolver → TLD：查询 example.com 的权威服务器' },
    { title: 'TLD 返回权威委派', from: [20, 32, 54], to: [-78, 32, 54], action: 'TLD → resolver：返回权威服务器线索' },
    { title: '解析器询问权威服务器', from: [-78, 32, 54], to: [96, 32, 54], action: 'resolver → authority：查询所需资源记录' },
    { title: '权威服务器返回资源记录', from: [96, 32, 54], to: [-78, 32, 54], action: 'authority → resolver：返回 A、NS 或 MX 记录' },
    { title: '解析器缓存并答复客户端', from: [-132, 32, 54], to: [-154, 32, 44], action: '解析器缓存结果，再答复客户端' }
  ]
  const s = steps[phase]!
  return { phase, u, ...s, recordVisible: phase >= 6 }
}
export function draw(kind: RecordKind, t: number, P: P) {
  const o: string[] = [], s = model(t)
  // Distinct client, recursive resolver, root, TLD and authority devices.
  o.push(box(P, -220, -74, 440, 148, 0, 10, 'lo', 'directory-base', { ground: true }))
  const devices = [
    { x: -208, w: 54, h: 34, name: 'dns-client', label: '客户端' },
    { x: -132, w: 54, h: 44, name: 'recursive-resolver', label: '递归解析器' },
    { x: -56, w: 54, h: 44, name: 'root-server', label: '根' },
    { x: 20, w: 54, h: 44, name: 'tld-server', label: '.com TLD' },
    { x: 96, w: 54, h: 44, name: 'authoritative-server', label: '权威' },
  ]
  for (const device of devices) {
    o.push(box(P, device.x, -32, device.w, 64, 10, device.h, device.name.includes('resolver') ? 'mid' : 'hi', device.name, { assembly: device.name }))
    const x0 = device.x + 6, x1 = device.x + device.w - 6, y = 32, z0 = 16, z1 = 10 + device.h - 5
    o.push(printFrame(P, x0, x1, y, z0, z1))
    if (device.name === 'dns-client') {
      o.push(printLine(P, [x0 + 4, y, z0 + 7], [x1 - 4, y, z0 + 7], true))
      o.push(text(P, [device.x + device.w / 2, y + 1, z1 - 4], 'QUERY', 5))
    } else if (device.name === 'recursive-resolver') {
      for (const z of [z0 + 6, z0 + 14, z0 + 22]) o.push(printLine(P, [x0 + 3, y, z], [x1 - 3, y, z], true))
      o.push(text(P, [device.x + device.w / 2, y + 1, z1 - 3], 'CACHE', 5))
    } else if (device.name === 'root-server') {
      const cx = device.x + device.w / 2, cz = (z0 + z1) / 2
      o.push(printLine(P, [cx, y, cz - 8], [cx, y, cz + 6], true))
      o.push(printLine(P, [cx, y, cz + 4], [x0 + 4, y, cz + 10], true))
      o.push(printLine(P, [cx, y, cz + 4], [x1 - 4, y, cz + 10], true))
      o.push(text(P, [cx, y + 1, z1 - 3], 'REF', 5))
    } else if (device.name === 'tld-server') {
      for (const z of [z0 + 6, z0 + 14, z0 + 22]) o.push(printLine(P, [x0 + 3, y, z], [x1 - 3, y, z], true))
      o.push(text(P, [device.x + device.w / 2, y + 1, z1 - 3], '.COM', 5))
    } else {
      for (const z of [z0 + 7, z0 + 16]) o.push(printLine(P, [x0 + 3, y, z], [x1 - 3, y, z], true))
      o.push(printLine(P, [device.x + device.w / 2, y, z0 + 4], [device.x + device.w / 2, y, z1 - 3], true))
      o.push(text(P, [device.x + device.w / 2, y + 1, z1 - 3], 'ZONE', 5))
    }
    o.push(text(P, [device.x + device.w / 2, 0, 17 + device.h], device.label, 7))
  }
  const [x, y, z] = s.from.map((v, i) => v + (s.to[i]! - v) * s.u) as [number, number, number]
  o.push(box(P, x - 6, y - 5, 12, 10, z, 5, 'hi', 'query-or-resource-record', { logical: true }))
  if (s.recordVisible) o.push(box(P, -121, 12, 30, 18, 62, 5, 'hi', 'cached-resource-record', { logical: true }))
  o.push(text(P, [0, 57, 84], s.recordVisible ? recordData[kind] : `输入：${kind === 'A' ? 'www.example.com' : 'example.com'}`, 8))
  // The query follows resolver-originated arrows; root and TLD only return
  // referrals. The authoritative server returns the selected resource record.
  o.push(wire(P, [-78, 32, 54], [-56, 32, 54], 'resolver-root-logical-path', 'mid'))
  o.push(wire(P, [-78, 32, 54], [20, 32, 54], 'resolver-tld-logical-path', 'mid'))
  o.push(wire(P, [-78, 32, 54], [96, 32, 54], 'resolver-authority-logical-path', 'mid'))
  o.push(wire(P, [-132, 32, 54], [-154, 32, 44], 'resolver-client-logical-path', 'mid'))
  return o.join('')
}
export default function DnsDirectoryFigure() {
  const [kind, setKind] = useState<RecordKind>('A')
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const P = useMemo(() => auditProjection(), [])
  const s = model(t)

  return <FigureCard
    fig="Fig 2.5.1"
    title="DNS 分布式目录与权威边界"
    subtitle={`${s.title} · 根 → TLD → 权威服务`}
    readout={<span>{s.action}　|　{recordData[kind]}</span>}
    running={running}
    onToggle={() => setRunning(v => !v)}
    onReset={() => setT(0)}
    extra={<div className="flex gap-1">
      {(['A', 'NS', 'MX'] as RecordKind[]).map(x => <button className="btn-outline" key={x} onClick={() => { setT(0); setKind(x) }}>{x} 记录</button>)}
    </div>}
    caption="递归解析器分别询问根、TLD 与权威服务器；上游返回委派线索，根服务器不会代替解析器继续查询。解析器获得记录后缓存并答复客户端。输入是域名而非 URL，A/NS/MX 是不同资源记录。"
    legend="左：客户端与递归解析器　·　右：根、TLD 与权威服务器　·　虚线：解析器发起的查询"
  >
    <Scene width={W} height={H} label={`DNS 递归解析器依次查询根、TLD、权威服务并取得 ${kind} 记录`} svg={draw(kind, t, P)} />
  </FigureCard>
}
