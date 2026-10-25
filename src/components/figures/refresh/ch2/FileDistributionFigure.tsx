import { useMemo, useState } from 'react'
import { FigureCard, Scene, initialTime, prefersStillness, usePlayClock } from '../../figureKit'
import { W, H, box, projection, seg3, stroke, text, wire, type P } from './primitives'
type Mode = 'cs' | 'p2p'
export const auditProjection = () => projection([[-230, -85, 0], [230, 85, 85]], 43, 31)
const F = 1000, N = 4, dmin = 30, ui = 25
const lowerBound = (mode: Mode, upload: number) => mode === 'cs' ? Math.max(N * F / upload, F / dmin) : Math.max(F / upload, N * F / (upload + N * ui), F / dmin)
const printLine = (P: P, a: [number, number, number], b: [number, number, number], surfaceMark = false) => {
  const line = stroke(seg3(P, a, b), 'lo')
  return surfaceMark ? line.replace('<path', '<path data-free="both" data-line-role="surface-print"') : line
}
const printFrame = (P: P, x0: number, x1: number, y: number, z0: number, z1: number) => [
  printLine(P, [x0, y, z0], [x1, y, z0]), printLine(P, [x1, y, z0], [x1, y, z1]),
  printLine(P, [x1, y, z1], [x0, y, z1]), printLine(P, [x0, y, z1], [x0, y, z0]),
].join('')
export function draw(mode: Mode, t: number, P: P, upload: number) {
  const o: string[] = []
  // One seed source and four receiving hosts are real, separate objects.
  o.push(box(P, -220, -72, 440, 144, 0, 10, 'lo', 'distribution-platform', { ground: true }))
  o.push(box(P, -202, -28, 54, 56, 10, 34, 'hi', 'origin-server', { assembly: 'distribution-origin' }))
  o.push(printFrame(P, -196, -154, 28, 14, 40))
  for (const z of [20, 27, 34]) o.push(printLine(P, [-193, 28, z], [-157, 28, z], true))
  o.push(text(P, [-175, 29, 37], 'SEED', 5))
  const positions: [number, number][] = [[-128, -22], [-56, -22], [16, -22], [88, -22]]
  positions.forEach(([x, y], i) => {
    o.push(box(P, x, y, 52, 44, 10, 30, mode === 'p2p' ? 'hi' : 'mid', `client-${i}-host`, { assembly: `distribution-client-${i}` }))
    o.push(printFrame(P, x + 6, x + 46, y + 44, 15, 33))
    o.push(printLine(P, [x + 10, y + 44, 20], [x + 42, y + 44, 20], true))
    o.push(printLine(P, [x + 10, y + 44, 26], [x + 42, y + 44, 26], true))
    o.push(text(P, [x + 26, y + 45, 30], 'FILE', 5))
    o.push(text(P, [x + 26, y + 1, 48], `peer ${i + 1}`, 7))
  })
  o.push(text(P, [-175, 1, 49], '源站', 8))
  // C/S connects the source to each client. P2P shows peer exchange after seeding.
  const links: [[number, number, number], [number, number, number]][] = mode === 'cs'
    ? positions.map(([x, y]) => [[-148, 28, 27], [x + 26, y + 44, 25]])
    : positions.slice(0, 3).map(([x, y], i) => [[x + 52, y + 22, 25], [positions[i + 1]![0], positions[i + 1]![1] + 22, 25]])
  for (let i = 0;i < links.length;i++) o.push(wire(P, links[i]![0], links[i]![1], `distribution-logical-link-${i}`, 'mid', true))
  const pair = links[mode === 'cs' ? 0 : 0]!
  const u = (t * 40 / lowerBound(mode, upload) / 12) % 1
  const [x, y, z] = pair[0].map((v, i) => v + (pair[1][i]! - v) * u) as [number, number, number]
  const progress = `${Math.round(u * 100)}%`
  o.push(box(P, x - 5, y - 4, 10, 8, z, 5, 'hi', 'file-chunk', { logical: true }))
  o.push(text(P, [0, 56, 79], `F=1 Gbit · N=4 · uₛ=${upload} Mbit/s`, 8))
  o.push(text(P, [0, -63, 79], `${lowerBound(mode, upload).toFixed(1)} s 模型下界 · 单个分块路径 ${progress}`, 8))
  return o.join('')
}
export default function FileDistributionFigure() {
  const [mode, setMode] = useState<Mode>('cs')
  const [upload, setUpload] = useState(100)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const P = useMemo(() => auditProjection(), [])
  const value = lowerBound(mode, upload)
  const progress = Math.round((t * 40 / value / 12) % 1 * 100)
  const formula = mode === 'cs' ? 'max(NF/uₛ, F/dmin)' : 'max(F/uₛ, NF/(uₛ+Σuᵢ), F/dmin)'

  return <FigureCard
    fig="Fig 2.6.1"
    title="文件分发：源站与对等分发台"
    subtitle={`${mode === 'cs' ? '客户端—服务器' : 'P2P'} · 模型下界 ${value.toFixed(1)} s · 分块路径 ${progress}%`}
    readout={<span>{formula} = {value.toFixed(1)} s　·　uₛ={upload} Mbit/s　·　单个示意分块路径 {progress}%　·　理论下界</span>}
    running={running}
    onToggle={() => setRunning(v => !v)}
    onReset={() => setT(0)}
    extra={<div className="flex flex-wrap gap-1">
      <button className="btn-outline" onClick={() => { setT(0); setMode('cs') }}>C/S</button>
      <button className="btn-outline" onClick={() => { setT(0); setMode('p2p') }}>P2P</button>
      {[50, 100, 200].map(x => <button key={x} className="btn-outline" aria-pressed={upload === x} onClick={() => { setT(0); setUpload(x) }}>uₛ {x}</button>)}
    </div>}
    caption="示例假设 F=1 Gbit、N=4、最小下载速率 dmin=30 Mbit/s、每个 peer 上传 uᵢ=25 Mbit/s。P2P画面展示客户端已获得部分初始分块后，继续互传补齐文件。动画使用压缩时间，分块速度仅作相对示意；公式给出模型下界，不代表完整分发的实测耗时。调节源站上传能力会改变模型下界和显示速度。"
    legend={mode === 'cs' ? '左：文件源站　·　右：4个接收客户端　·　虚线：源站分发路径' : '客户端已有部分初始分块　·　虚线：客户端间继续互传补齐'}
  >
    <Scene width={W} height={H} label={`${mode === 'cs' ? '客户端服务器' : 'P2P'}分发，服务器上传 ${upload} Mbit/s，模型下界 ${value.toFixed(1)} 秒`} svg={draw(mode, t, P, upload)} />
  </FigureCard>
}
