import { useMemo, useState } from 'react'
import { FigureCard, Scene, initialTime, prefersStillness, usePlayClock } from '../../figureKit'
import { W, H, box, projection, round, text, wire, type P } from './primitives'

type Service = 'tcp' | 'udp'

export const auditProjection = () => projection([[-220, -85, 0], [220, 85, 30]], 38, 30)

const needs = [
  { name: '可靠交付' },
  { name: '吞吐量' },
  { name: '时延' },
  { name: '安全性' },
]

export function draw(service: Service, stage: number, P: P) {
  const o: string[] = []
  o.push(box(P, -210, -72, 420, 144, 0, 10, 'lo', 'selection-board', { ground: true }))
  o.push(box(P, -184, -44, 104, 88, 10, 3, 'mid', 'application-needs-station'))
  o.push(box(P, -47, -44, 94, 88, 10, 3, 'mid', 'protocol-choice-station'))
  o.push(box(P, 80, -44, 104, 88, 10, 3, 'mid', 'service-result-station'))
  o.push(text(P, [-132, -4, 14], '应用需求', 24))
  o.push(text(P, [0, -4, 14], '传输协议', 24))
  o.push(text(P, [132, -4, 14], '服务保证', 24))
  // The dashed transfer traces are etched on the workbench top and meet both stations.
  o.push(wire(P, [-79.8, -3, 13], [-47.2, -3, 13], 'requirement-to-choice', 'mid', true))
  o.push(wire(P, [47.2, -3, 13], [79.8, -3, 13], 'choice-to-service', stage === 0 && service === 'tcp' ? 'hi' : 'mid', true))
  o.push(round(P, 0, 24, 12, 13, 9, service === 'tcp' ? 'hi' : 'mid', 'protocol-selector'))
  return o.join('')
}
export default function TransportServiceFigure({
  auditMode,
  auditTime,
}: {
  auditMode?: Service
  auditTime?: number
} = {}) {
  const [service, setService] = useState<Service>(auditMode ?? 'tcp')
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, auditTime ?? initialTime())
  const P = useMemo(() => auditProjection(), [])
  const stage = Math.floor((t % 8) / 2)
  const req = needs[stage]!

  const result = stage === 0
    ? service === 'tcp'
      ? 'TCP 提供可靠、有序的字节流；UDP 不提供这项保证。'
      : 'UDP 不保证可靠、有序交付；TCP 提供可靠、有序的字节流。'
    : stage === 1
      ? 'TCP 和 UDP 都不承诺固定吞吐率；实际吞吐受路径容量与拥塞影响。'
      : stage === 2
        ? 'UDP 不保证低时延；握手与重传行为会影响端到端时延。'
        : 'TCP、UDP 本身都不提供加密；可结合 TLS 或 DTLS。'

  return (
    <FigureCard
      fig="Fig 2.1.3"
      title="传输服务需求选择台"
      subtitle={`${req.name} · ${service.toUpperCase()}`}
      readout={<span>{service.toUpperCase()} · {req.name}</span>}
      running={running}
      onToggle={() => setRunning((value) => !value)}
      onReset={() => setT(0)}
      extra={
        <div className="flex gap-1">
          <button className="btn-outline" aria-pressed={service === 'tcp'} onClick={() => { setT(0); setService('tcp') }}>TCP</button>
          <button className="btn-outline" aria-pressed={service === 'udp'} onClick={() => { setT(0); setService('udp') }}>UDP</button>
        </div>
      }
      caption="需求逐项出现；切换 TCP / UDP 查看服务能力边界。"
      legend="左：应用需求　·　中：协议　·　右：服务能力"
    >
      <div className="transport-service-sheet">
        <div><span>应用需求</span><strong>{req.name}</strong></div>
        <div><span>当前协议</span><strong>{service.toUpperCase()}</strong></div>
        <div><span>结果</span><p>{result}</p></div>
      </div>
      <Scene
        width={W}
        height={H}
        label={`传输服务选择：${service}，${req.name}`}
        svg={draw(service, stage, P)}
      />
    </FigureCard>
  )
}
