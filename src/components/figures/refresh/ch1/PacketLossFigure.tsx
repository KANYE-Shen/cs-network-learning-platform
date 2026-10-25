import { useMemo, useState } from 'react'
import * as k from '../../../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness } from '../../figureKit'
import { assembly, bed, projection, S, L, T, trackedKit } from './parts'

const drawKit = trackedKit(k)
const PLAN = { x: -122, y: -69, w: 244, d: 138, r: 7 }
const P = projection(PLAN, 58)
type Mode = 'stable' | 'burst'
const CAPACITY = 5
function trace(mode: Mode) {
  let queued = 2
  let dropped = 0
  const out: { queued: number; dropped: number; admitted: number; served: number; arrivals: number }[] = []
  for (let tick = 0; tick < 6; tick++) {
    const served = Math.min(1, queued)
    queued -= served
    const arrivals = mode === 'stable' ? 1 : 3
    const admitted = Math.min(arrivals, CAPACITY - queued)
    const lost = arrivals - admitted
    queued += admitted
    dropped += lost
    out.push({ queued, dropped, admitted, served, arrivals })
  }
  return out
}

export default function PacketLossFigure({ auditMode = 'burst', auditTime = 0 }: { auditMode?: Mode; auditTime?: number } = {}) {
  const [mode, setMode] = useState<Mode>(auditMode)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, auditTime)
  const tick = Math.floor((t % 7.2) / 1.2)
  const progress = (t % 1.2) / 1.2
  const record = trace(mode)[Math.min(tick, 5)]!
  const svg = useMemo(() => {
    const out: string[] = [bed(P, PLAN)]
    // The open queue has a supported floor, side cheeks and a low rear stop; slot marks are surface lines.
    const queue: string[] = []
    queue.push(S(drawKit.slabOf({ x: -54, y: -36, w: 118, d: 48, r: 4 }, 6, 2, P, 6), 'lo'))
    queue.push(S(drawKit.slabOf({ x: -52, y: -33, w: 114, d: 5, r: 2 }, 8, 12, P, 4), 'mid'))
    queue.push(S(drawKit.slabOf({ x: -52, y: -28, w: 5, d: 36, r: 2 }, 8, 12, P, 4), 'lo'))
    queue.push(S(drawKit.slabOf({ x: 57, y: -28, w: 5, d: 36, r: 2 }, 8, 12, P, 4), 'lo'))
    queue.push(S(drawKit.slabOf({ x: -52, y: 8, w: 114, d: 5, r: 2 }, 8, 12, P, 4), 'mid'))
    // Five marked positions show finite capacity without floating miniature packet boxes.
    for (let i = 0; i < CAPACITY; i++) {
      const x = -43 + i * 20
      queue.push(L(k.planOutline({ x: x - 8, y: -19, w: 16, d: 24, r: 1.5 }, 8.1, P), i < record.queued ? 'lit' : 'faint'))
      if (i < record.queued) {
        const mark = k.iso([x, -7, 9], P)
        queue.push(`<g data-anatomy-overlay="queued-packet-marker"><circle class="iso-face-text" cx="${mark[0].toFixed(1)}" cy="${mark[1].toFixed(1)}" r="5"/><text class="iso-face-text" x="${mark[0].toFixed(1)}" y="${(mark[1] + 2.5).toFixed(1)}" text-anchor="middle" font-size="6">包</text></g>`)
      }
    }
    queue.push(T([3, 24, 23], `队列 ${record.queued}/${CAPACITY}`, P, 8))
    out.push(assembly('finite-queue', queue.join('')))
    // A separate edge bin receives rejected tail arrivals.
    const bin: string[] = []
    bin.push(S(drawKit.slabOf({ x: -96, y: 12, w: 36, d: 22, r: 3 }, 6, 2, P, 5), 'lo'))
    bin.push(S(drawKit.slabOf({ x: -96, y: 12, w: 2, d: 22, r: .5 }, 8, 4, P, 4), 'mid'))
    bin.push(S(drawKit.slabOf({ x: -94, y: 32, w: 34, d: 2, r: .5 }, 8, 4, P, 4), 'mid'))
    out.push(assembly('tail-drop-bin', bin.join('')))
    // Router body rests on its mounting foot beside the egress.
    out.push(assembly('router',
      S(drawKit.slabOf({ x: 69, y: -41, w: 34, d: 45, r: 4 }, 6, 2, P, 5), 'lo') +
      S(drawKit.slabOf({ x: 72, y: -37, w: 28, d: 37, r: 3 }, 8, 14, P, 5, .6), 'mid') +
      T([86, -18, 23], '路由器', P, 8) + T([86, -18, 13], `丢弃 ${record.dropped}`, P, 7)))
    // A dashed logical route shows rejected arrivals diverting into the catch bin.
    out.push(`<g data-anatomy-overlay="tail-drop-route">${k.lineSvg(k.segment([-53, -18, 9], [-64, -8, 9], P), { tone: 'faint', dashed: true, free: true })}${k.lineSvg(k.segment([-64, -8, 9], [-76, 14, 9], P), { tone: 'faint', dashed: true, free: true })}</g>`)
    for (let n = 0; n < record.arrivals; n++) {
      const droppedNow = n >= record.admitted
      const x = droppedNow ? -54 - progress * 20 : -56 + progress * (16 + n * 7)
      const y = droppedNow ? -18 + progress * 34 : -18
      const marker = k.iso([x, y, 9], P)
      out.push(`<g data-anatomy-overlay="${droppedNow ? 'tail-dropped-packet' : 'admitted-packet'}"><circle class="iso-face-text" cx="${marker[0].toFixed(1)}" cy="${marker[1].toFixed(1)}" r="5"/><text class="iso-face-text" x="${marker[0].toFixed(1)}" y="${(marker[1] + 2.5).toFixed(1)}" text-anchor="middle" font-size="6">${droppedNow ? '×' : '包'}</text></g>`)
    }
    // One packet exits per time slot; the moving symbol follows the service outlet.
    const servedMarker = k.iso([65 + progress * 12, -18, 9], P)
    out.push(`<g data-anatomy-overlay="served-packet"><circle class="iso-face-text" cx="${servedMarker[0].toFixed(1)}" cy="${servedMarker[1].toFixed(1)}" r="4"/></g>`)
    out.push(`<g data-anatomy-overlay="service-egress-route">${k.lineSvg(k.segment([65, -18, 9], [78, -18, 9], P), { tone: 'lit', free: true })}</g>`)
    out.push(T([86, 17, 32], '处理速率 1/时隙', P, 7))
    return out.join('')
  }, [mode, tick, record.queued, record.dropped, record.admitted, record.arrivals, progress])
  const stage = mode === 'stable' ? '到达速率 = 处理速率，队列保持稳定' : record.dropped ? '缓冲区已满，新到分组在尾部丢弃' : '到达速率大于处理速率，队列增长'
  const explanation = mode === 'stable'
    ? '教学例：每个时隙到达 1 个、处理 1 个分组，初始队列 2 个；有限缓冲未满，因此本轮没有丢包。'
    : `教学例：每个时隙到达 3 个、处理 1 个，缓冲最多 5 个；当前已累计尾丢 ${record.dropped} 个。队列溢出丢包是容量/拥塞问题，不是链路比特差错。`
  return (
    <FigureCard
      fig="图 · 分组丢失"
      title="有限缓冲装满后，新分组被尾丢"
      subtitle="路由器以有限队列吸收短时突发；持续输入快于处理时，队尾新到达分组无法入队。"
      readout={<>{stage} · 本时隙模型结果 · 缓冲 {record.queued}/{CAPACITY} · 累计丢弃 {record.dropped} · 到达/处理 {record.arrivals}/1 每时隙</>}
      running={running}
      onToggle={() => setRunning(v => !v)}
      onReset={() => { setT(0); setRunning(false) }}
      extra={<select aria-label="队列负载" value={mode} onChange={e => { setMode(e.target.value as Mode); setT(0) }}><option value="burst">突发过载</option><option value="stable">速率平衡</option></select>}
      legend="左：到达与尾丢槽 · 中：有限缓冲 · 右：服务出口；亮包=本时隙分组动作"
      caption={`${explanation} 读数由本时隙的到达与服务计算；移动分组展示这些分组怎样入队或转向尾丢槽。`}>
      <Scene width={700} height={385} label="有五个缓冲槽的路由器队列、单分组服务机构及满队尾丢通道" svg={svg} />
    </FigureCard>
  )
}
