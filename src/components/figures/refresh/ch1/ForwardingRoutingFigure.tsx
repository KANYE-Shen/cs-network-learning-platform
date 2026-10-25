import { useMemo, useState } from 'react'
import * as k from '../../../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness } from '../../figureKit'
import { bed, controlKnob, projection, S, L, T, trackedKit } from './parts'

const drawKit = trackedKit(k)
const PLAN = { x: -120, y: -67, w: 240, d: 134, r: 7 }
const P = projection(PLAN, 59)
type Mode = 'datagram' | 'virtual'

export default function ForwardingRoutingFigure({ auditMode = 'datagram', auditTime = 0 }: { auditMode?: Mode; auditTime?: number } = {}) {
  const [mode, setMode] = useState<Mode>(auditMode)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, auditTime)
  const hop = Math.floor((t % 5) / 1.25)
  const phase = (t % 1.25) / 1.25
  const svg = useMemo(() => {
    const out: string[] = [bed(P, PLAN)]
    const assembly = (name: string, children: string[]) => `<g data-anatomy-assembly="${name}">${children.join('')}</g>`
    // A parcel sorting bench: feed chute, three router bodies, destination bins and a return crank.
    const feed: string[] = [
      S(drawKit.slabOf({ x: -107, y: -44, w: 35, d: 32, r: 3 }, 6, 4, P, 5), 'lo'),
      S(drawKit.slabOf({ x: -103, y: -40, w: 27, d: 24, r: 2 }, 10, 1, P, 4), 'mid'),
      S(drawKit.slabOf({ x: -103, y: -40, w: 1.5, d: 24, r: .5 }, 11, 8, P, 3), 'lo'),
      S(drawKit.slabOf({ x: -101.5, y: -40, w: 22, d: 1.5, r: .5 }, 11, 8, P, 3), 'mid'),
    ]
    for (let i = 0; i < 4; i++) feed.push(S(drawKit.slabOf({ x: -100 + i * 5, y: -34, w: 4, d: 6, r: .5 }, 11, 2.2, P, 3), i === hop ? 'hi' : 'mid'))
    feed.push(S(drawKit.slabOf({ x: -78.5, y: -40, w: 1.5, d: 24, r: .5 }, 11, 8, P, 3), 'lo'))
    out.push(assembly('input-feed-tray', feed))
    for (let r = 0; r < 3; r++) {
      const x = -48 + r * 47, y = r === 1 ? 5 : -5
      const router: string[] = [
        S(drawKit.slabOf({ x: x - 13, y: y - 15, w: 28, d: 30, r: 3 }, 6, 4, P, 6), 'lo'),
        S(drawKit.slabOf({ x: x - 10, y: y - 12, w: 22, d: 24, r: 2 }, 10, 1, P, 4), 'mid'),
        S(drawKit.slabOf({ x: x - 11, y: y - 12, w: 2, d: 24, r: .5 }, 11, 21, P, 4), 'lo'),
        S(drawKit.slabOf({ x: x - 9, y: y - 12, w: 18, d: 1.5, r: .5 }, 11, 21, P, 3), 'mid'),
      ]
      for (let i = 0; i < 4; i++) router.push(S(drawKit.cylinder(x - 6 + i * 4, y + 3, 1.15, 11, 1.4, P, 10), i === (hop + r) % 4 ? 'hi' : 'lo'))
      router.push(S(drawKit.slabOf({ x: x - 7, y: y + 7, w: 14, d: 5, r: 1 }, 11, 1, P, 3), r === hop ? 'hi' : 'mid'))
      router.push(S(drawKit.slabOf({ x: x + 10, y: y - 12, w: 2, d: 24, r: .5 }, 11, 21, P, 4), 'lo'))
      router.push(S(drawKit.slabOf({ x: x - 11, y: y - 12, w: 22, d: 24, r: 2 }, 32, 1, P, 4), 'mid'))
      router.push(controlKnob(x + 3, y + 4, 33, P, r === hop))
      out.push(assembly(`router-${r + 1}`, router))
    }
    // Lookup-card rack physically attached to router 2; the selector plate contains finite route slots.
    const lookup: string[] = [S(drawKit.slabOf({ x: -4, y: 27, w: 53, d: 23, r: 3 }, 6, 4, P, 5), 'lo')]
    for (let i = 0; i < 4; i++) {
      lookup.push(S(drawKit.slabOf({ x: i * 12, y: 29, w: 10, d: 18, r: 1.2 }, 10, 1.2, P, 4), i === hop % 4 ? 'hi' : 'mid'))
      // Engraved lookup marks sit on the upper face of each physical slot.
      out.push(L(k.segment([i * 12 + .5, 31, 11.2], [i * 12 + 9.5, 31, 11.2], P), 'faint'))
    }
    out.push(assembly('forwarding-lookup-table', lookup))
    // Two alternate outputs are physical bins. Per-datagram forwarding can select anew at every router;
    // virtual-circuit labels pass through pre-established setting on each switch.
    const bins: string[] = []
    for (const [x, label] of [[-85, 'A'], [70, 'B']] as const) {
      bins.push(S(drawKit.slabOf({ x, y: 32, w: 37, d: 21, r: 3 }, 6, 4, P, 5), 'lo'))
      bins.push(S(drawKit.slabOf({ x: x + 3, y: 35, w: 31, d: 15, r: 2 }, 10, 1, P, 4), 'mid'))
      bins.push(S(drawKit.slabOf({ x: x + 3, y: 35, w: 2, d: 15, r: .5 }, 11, 14, P, 4), 'lo'))
      bins.push(S(drawKit.slabOf({ x: x + 5, y: 35, w: 27, d: 2, r: .5 }, 11, 14, P, 4), 'mid'))
      bins.push(S(drawKit.slabOf({ x: x + 5, y: 48, w: 27, d: 2, r: .5 }, 11, 7, P, 4), 'mid'))
      bins.push(S(drawKit.slabOf({ x: x + 32, y: 35, w: 2, d: 15, r: .5 }, 11, 14, P, 4), 'lo'))
      out.push(T([x + 18, 50, 31], `出口 ${label}`, P, 7))
    }
    out.push(assembly('destination-bins', bins))
    // Both forwarding models carry traffic to the same destination. The contrast is
    // the lookup key used at each hop, not an inherently different chosen endpoint.
    const centers: k.Point3[] = [[-84,-28,19],[-34,-5,25],[13,5,29],[60,-5,25],[-66,52,24]]
    const index = Math.min(3, hop)
    const path = centers
    const [a, b] = [path[index]!, path[index + 1]!]
    const point = a.map((value, j) => value + (b[j]! - value) * phase) as k.Point3
    for (let i = 0; i < path.length - 1; i++) out.push(L(k.segment(path[i]!, path[i + 1]!, P), i === index ? 'lit' : mode === 'virtual' ? 'mid' : 'faint'))
    // Animate an outlined parcel marker on the route instead of a floating solid.
    out.push(L(k.planOutline({ x: point[0] - 2.2, y: point[1] - 1.2, w: 4.4, d: 2.4, r: .5 }, point[2] + 3, P), 'lit'))
    out.push(T([-82,-50,41], mode === 'datagram' ? '目的地址' : '虚电路标签', P, 7))
    return out.join('')
  }, [mode, hop, phase])
  const stage = ['读取目的地址/标签', '路由器 1 查表并转发', '路由器 2 按本地映射转发', '路由器 3 送往目标出口'][hop] ?? '分组抵达目标网络'
  return <FigureCard fig="图 · 转发与路由" title="逐跳转发读取目的地址或虚电路标签" subtitle="同一目的网络上的分组经过三台路由器，拨片展示每一跳采用的本地查表动作。" readout={<>{stage} · 节点 {Math.min(hop + 1, 3)}/3</>} running={running} onToggle={() => setRunning(v => !v)} onReset={() => { setT(0); setRunning(false) }} extra={<select aria-label="网络服务模式" value={mode} onChange={e => { setMode(e.target.value as Mode); setT(0) }}><option value="datagram">数据报网络</option><option value="virtual">虚电路网络</option></select>} legend="左：入口 · 中：三台路由器与查表拨片 · 右：目标网；亮包=当前跳" caption={mode === 'datagram' ? '数据报携带目标网络地址，每台路由器按本地转发表查下一跳；图中用相同目的地说明逐跳查表，不演示不同分组的负载均衡。' : '虚电路分组携带短标签，路由器按本地已安装的标签映射选择下一跳。图中假定路径映射已经配置，不演示连接建立控制过程。'}><Scene width={700} height={385} label="路由器查表拨片、数据报分拣机构和虚电路标签转发" svg={svg}/></FigureCard>
}
