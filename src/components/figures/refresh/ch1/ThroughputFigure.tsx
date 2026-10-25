import { useMemo, useState } from 'react'
import * as k from '../../../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness } from '../../figureKit'
import { assembly, bed, projection, S, L, T, trackedKit } from './parts'

const drawKit = trackedKit(k)
const PLAN = { x: -122, y: -69, w: 244, d: 138, r: 7 }
const P = projection(PLAN, 57)
type Mode = 'single' | 'shared' | 'bottleneck'
const PROFILES = {
  single: { demand: 6, links: [12, 8, 10], cross: 0, name: '单条流' },
  shared: { demand: 9, links: [12, 8, 10], cross: 4, name: '共享竞争' },
  bottleneck: { demand: 20, links: [12, 5, 14], cross: 0, name: '瓶颈变化' },
} as const

export default function ThroughputFigure({ auditMode = 'single', auditTime = 0 }: { auditMode?: Mode; auditTime?: number } = {}) {
  const [mode, setMode] = useState<Mode>(auditMode)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, auditTime)
  const sample = PROFILES[mode]
  const phase = Math.floor((t % 4) / 1)
  const throughput = Math.min(sample.demand, ...sample.links, Math.max(0, sample.links[1] - sample.cross))
  const outputCount = Math.floor(t * throughput)
  const svg = useMemo(() => {
    const out: string[] = [bed(P, PLAN)]
    // Input drive is a real mounted motor and feed roller.
    const drive: string[] = []
    drive.push(S(drawKit.slabOf({ x: -113, y: -15, w: 25, d: 30, r: 3 }, 6, 2, P, 5), 'lo'))
    drive.push(S(drawKit.slabOf({ x: -110, y: -12, w: 19, d: 24, r: 2 }, 8, 10, P, 4), 'mid'))
    drive.push(S(drawKit.cylinder(-100.5, 0, 6, 18, 3, P, 24), 'hi'))
    out.push(assembly('input-drive', drive.join('')))
    const xs = [-58, 0, 58]
    for (let i = 0; i < 3; i++) {
      const x = xs[i]!, cap = sample.links[i]!
      const aperture = 4 + cap * .8
      const lane: string[] = []
      lane.push(S(drawKit.slabOf({ x: x - 26, y: -18, w: 52, d: 36, r: 2.5 }, 6, 2, P, 5), 'lo'))
      // Two raised banks hold the channel; paired gate leaves leave a capacity-sized opening.
      lane.push(S(drawKit.slabOf({ x: x - 26, y: -18, w: 52, d: 2, r: .6 }, 8, 5, P, 4), 'mid'))
      const leafDepth = (32 - aperture) / 2
      lane.push(S(drawKit.slabOf({ x: x - 4, y: -16, w: 8, d: leafDepth, r: .7 }, 8, 5, P, 4), i === phase ? 'hi' : 'mid'))
      lane.push(S(drawKit.slabOf({ x: x - 4, y: aperture / 2, w: 8, d: leafDepth, r: .7 }, 8, 5, P, 4), i === phase ? 'hi' : 'mid'))
      lane.push(S(drawKit.slabOf({ x: x - 26, y: 16, w: 52, d: 2, r: .6 }, 8, 5, P, 4), 'mid'))
      lane.push(T([x, -23, 16], `容量 ${cap} Mb/s`, P, 7))
      out.push(assembly(`capacity-channel-${i + 1}`, lane.join('')))
    }
    // The shared competitor is a separate marked flow joining the middle link.
    // A separate logical competing flow joins the middle channel; it is not a physical tube.
    out.push(`<g data-anatomy-overlay="shared-competitor-flow">${k.lineSvg(k.segment([0, 42, 13], [0, 22, 10], P), { tone: mode === 'shared' ? 'lit' : 'faint', free: true })}</g>`)
    if (mode === 'shared') {
      const sharedMarker = k.iso([0, 31, 13], P)
      out.push(`<g data-anatomy-overlay="shared-traffic-marker"><circle class="iso-face-text" cx="${sharedMarker[0].toFixed(1)}" cy="${sharedMarker[1].toFixed(1)}" r="5"/><text class="iso-face-text" x="${sharedMarker[0].toFixed(1)}" y="${(sharedMarker[1] + 2.5).toFixed(1)}" text-anchor="middle" font-size="6">竞</text></g>`)
    }
    const flow = (t * throughput * 0.38) % 1
    const packetCount = Math.max(1, Math.min(throughput, 12))
    for (let n = 0; n < packetCount; n++) {
      const x = -84 + ((flow * 168 + n * 168 / packetCount) % 168)
      const marker = k.iso([x, 0, 10], P)
      out.push(`<g data-anatomy-overlay="flow-packet-marker"><circle class="iso-face-text" cx="${marker[0].toFixed(1)}" cy="${marker[1].toFixed(1)}" r="4"/></g>`)
    }
    out.push(L(k.segment([-88, 0, 10], [-84, 0, 10], P), 'mid'))
    out.push(L(k.segment([84, 0, 10], [89, 0, 10], P), 'mid'))
    out.push(T([-101, -22, 19], `输入 ${sample.demand} Mb/s`, P, 7), T([99, -22, 18], `已传 ${outputCount} Mbit`, P, 7))
    return out.join('')
  }, [sample, mode, t, throughput, phase, outputCount])
  const stage = [`链路 1：容量 ${sample.links[0]} Mb/s`, `链路 2：有效容量 ${sample.links[1] - sample.cross} Mb/s`, `链路 3：容量 ${sample.links[2]} Mb/s`, `接收端累计 ${outputCount} Mbit`][phase]
  const limiting = Math.min(...sample.links, sample.demand, sample.links[1] - sample.cross)
  return (
    <FigureCard
      fig="图 · 吞吐量"
      title="端到端吞吐量受最窄的有效通道限制"
      subtitle="三段带容量闸口的串联通道；包流速度与出口计数由有效吞吐量驱动。"
      readout={<>{stage} · min(需求 {sample.demand}, 链路 {sample.links.join('/')}，共享剩余 {sample.links[1] - sample.cross}) = {limiting} Mb/s</>}
      running={running}
      onToggle={() => setRunning(v => !v)}
      onReset={() => { setT(0); setRunning(false) }}
      extra={<select aria-label="吞吐量场景" value={mode} onChange={e => { setMode(e.target.value as Mode); setT(0) }}><option value="single">单流需求受限</option><option value="shared">共享链路竞争</option><option value="bottleneck">瓶颈链路变化</option></select>}
      legend="左：发送需求 · 中：容量闸口与开口宽度 · 右：接收计数；亮闸口=当前观察链路"
      caption={`本图是教学数值示例：吞吐量 = min(发送需求 ${sample.demand}, 各链路容量 ${sample.links.join(', ')}, 共享链路剩余 ${sample.links[1] - sample.cross}) = ${throughput} Mb/s。共享段剩余量按示例中的竞争负载扣除；这不是 TCP 必然或公平分配的公式。提高非瓶颈链路容量不会提高端到端上限。`}>
      <Scene width={700} height={385} label="三段有容量刻度的串联通道、容量闸口、共享竞争流量和吞吐读数" svg={svg} />
    </FigureCard>
  )
}
