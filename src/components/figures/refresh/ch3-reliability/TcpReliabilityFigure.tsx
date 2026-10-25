import { useMemo, useState } from 'react'
import { FigureCard, Scene, initialTime, prefersStillness, usePlayClock } from '../../figureKit'
import { W, H, box, port, projection, seg3, stroke, text, wire, type P } from '../ch2/primitives'
type Mode = 'fast' | 'timeout' | 'ackloss'
type Kind = 'data' | 'ack' | 'repair' | 'none'
type State = { title: string; from: number; to: number; kind: Kind; seq: number | null; ack: number; senderAck: number; receiverNext: number; packetAck: number | null; dups: number; receiverSlots: number[]; drop: boolean; arrived: boolean; timer: string; action: string }
const names: Record<Mode, string> = { fast: '快速重传', timeout: '超时重传', ackloss: 'ACK 丢失' }
export const auditProjection = () => projection([[-230, -86, 0], [230, 86, 110]], 43, 31)
function withAcknowledgements(mode: Mode, phase: number, t: number, s: Omit<State, 'senderAck' | 'receiverNext' | 'packetAck'>): State {
  const arrived = Math.min(1, (t % 2) / 2 / 0.82) >= 1
  let senderAck = 1501, receiverNext = 1501, packetAck: number | null = null
  if (mode === 'fast') {
    receiverNext = phase >= 8 || phase === 7 && arrived ? 3501 : 1501
    packetAck = phase === 2 || phase === 4 || phase === 6 ? 1501 : phase === 8 ? 3501 : null
    if (phase === 8 && arrived) senderAck = 3501
  } else if (mode === 'timeout') {
    receiverNext = phase === 3 || phase === 2 && arrived ? 2001 : 1501
    packetAck = phase === 3 ? 2001 : null
    if (phase === 3 && arrived) senderAck = 2001
  } else {
    receiverNext = phase === 3 || phase === 2 && arrived ? 2501 : phase >= 1 ? 2001 : arrived ? 2001 : 1501
    packetAck = phase === 1 ? 2001 : phase === 3 ? 2501 : null
    if (phase === 3 && arrived) senderAck = 2501
  }
  return { ...s, ack: senderAck, senderAck, receiverNext, packetAck }
}
export function state(mode: Mode, phase: number, t: number): State {
  const u = (t % 2) / 2, flight = Math.min(1, u / 0.82), arrived = flight >= 1
  if (mode === 'fast') return withAcknowledgements(mode, phase, t, [
    { title: 'Seq 1501 丢失', from: -153, to: 153, kind: 'data', seq: 1501, ack: 1501, dups: 0, receiverSlots: [0, 0, 0, 0], drop: true, arrived: false, timer: 'RTO运行', action: '缺失段在网络中丢失' },
    { title: 'Seq 2001 乱序到达', from: -153, to: 153, kind: 'data', seq: 2001, ack: 1501, dups: 0, receiverSlots: arrived ? [0, 1, 0, 0] : [0, 0, 0, 0], drop: false, arrived, timer: 'RTO运行', action: arrived ? '接收端缓存并生成ACK 1501' : '后续段前进' },
    { title: '第1个重复 ACK 返回', from: 153, to: -153, kind: 'ack', seq: null, ack: 1501, dups: arrived ? 1 : 0, receiverSlots: [0, 1, 0, 0], drop: false, arrived, timer: 'RTO运行', action: arrived ? '第1个重复ACK抵达发送端' : 'ACK 1501反向传输' },
    { title: 'Seq 2501 乱序到达', from: -153, to: 153, kind: 'data', seq: 2501, ack: 1501, dups: 1, receiverSlots: arrived ? [0, 1, 1, 0] : [0, 1, 0, 0], drop: false, arrived, timer: 'RTO运行', action: arrived ? '接收端缓存并生成ACK 1501' : '后续段前进' },
    { title: '第2个重复 ACK 返回', from: 153, to: -153, kind: 'ack', seq: null, ack: 1501, dups: arrived ? 2 : 1, receiverSlots: [0, 1, 1, 0], drop: false, arrived, timer: 'RTO运行', action: arrived ? '第2个重复ACK抵达发送端' : 'ACK 1501反向传输' },
    { title: 'Seq 3001 乱序到达', from: -153, to: 153, kind: 'data', seq: 3001, ack: 1501, dups: 2, receiverSlots: arrived ? [0, 1, 1, 1] : [0, 1, 1, 0], drop: false, arrived, timer: 'RTO运行', action: arrived ? '接收端缓存并生成ACK 1501' : '后续段前进' },
    { title: '第3个重复 ACK 返回', from: 153, to: -153, kind: 'ack', seq: null, ack: 1501, dups: arrived ? 3 : 2, receiverSlots: [0, 1, 1, 1], drop: false, arrived, timer: '快速重传阈值', action: arrived ? '第3个重复ACK抵达，触发快速重传' : 'ACK 1501反向传输' },
    { title: '重传Seq 1501填补缺口', from: -153, to: 153, kind: 'repair', seq: 1501, ack: arrived ? 3501 : 1501, dups: 3, receiverSlots: arrived ? [1, 1, 1, 1] : [0, 1, 1, 1], drop: false, arrived, timer: arrived ? '缺口补齐' : '等待重传到达', action: arrived ? '按序交付1501–3500字节' : '重传分组前进' },
    { title: 'ACK 3501返回发送端', from: 153, to: -153, kind: 'ack', seq: null, ack: arrived ? 3501 : 1501, dups: 3, receiverSlots: [1, 1, 1, 1], drop: false, arrived, timer: arrived ? '窗口前移' : '等待ACK返回', action: arrived ? '累计确认推进到3501' : 'ACK 3501反向传输' }
  ][phase]! as Omit<State, 'senderAck' | 'receiverNext' | 'packetAck'>)
  const rows = mode === 'timeout' ? [
    { title: 'Seq 1501 首发丢失', from: -153, to: 153, kind: 'data', seq: 1501, ack: 1501, dups: 0, receiverSlots: [0, 0, 0, 0], drop: true, arrived: false, timer: 'RTO启动', action: '首次发送途中丢失' },
    { title: '等待重传计时器', from: -153, to: -153, kind: 'none', seq: 1501, ack: 1501, dups: 0, receiverSlots: [0, 0, 0, 0], drop: false, arrived: false, timer: '运行', action: '没有重复ACK触发快速重传' },
    { title: 'RTO后重传Seq 1501', from: -153, to: 153, kind: 'data', seq: 1501, ack: arrived ? 2001 : 1501, dups: 0, receiverSlots: arrived ? [1, 0, 0, 0] : [0, 0, 0, 0], drop: false, arrived, timer: 'RTO到期', action: arrived ? '接收端接受该段' : '超时重传' },
    { title: 'ACK 2001 返回', from: 153, to: -153, kind: 'ack', seq: null, ack: arrived ? 2001 : 1501, dups: 0, receiverSlots: [1, 0, 0, 0], drop: false, arrived, timer: arrived ? '停止' : '等待ACK返回', action: arrived ? '累计确认推进到2001' : 'ACK 2001反向传输' }
  ] : [
    { title: 'Seq 1501抵达并生成ACK 2001', from: -153, to: 153, kind: 'data', seq: 1501, ack: 2001, dups: 0, receiverSlots: arrived ? [1, 0, 0, 0] : [0, 0, 0, 0], drop: false, arrived, timer: 'RTO运行', action: arrived ? '接收端交付并生成ACK 2001' : '数据段在途' },
    { title: 'ACK 2001反向丢失', from: 153, to: -153, kind: 'ack', seq: null, ack: 2001, dups: 0, receiverSlots: [1, 0, 0, 0], drop: true, arrived: true, timer: '尚未到期', action: '接收端已有数据，ACK未抵达发送端' },
    { title: 'Seq 2001抵达并生成ACK 2501', from: -153, to: 153, kind: 'data', seq: 2001, ack: 2501, dups: 0, receiverSlots: arrived ? [1, 1, 0, 0] : [1, 0, 0, 0], drop: false, arrived, timer: 'RTO运行', action: arrived ? '接收端累计确认到2501' : '新数据在途' },
    { title: 'ACK 2501反向返回', from: 153, to: -153, kind: 'ack', seq: null, ack: arrived ? 2501 : 2001, dups: 0, receiverSlots: [1, 1, 0, 0], drop: false, arrived, timer: arrived ? '窗口前移' : '等待累计ACK', action: arrived ? '累计ACK覆盖先前确认' : 'ACK 2501反向传输' }
  ]
  return withAcknowledgements(mode, phase, t, rows[Math.min(phase, 3)]! as Omit<State, 'senderAck' | 'receiverNext' | 'packetAck'>)
}
export function assertModel() {
  const f0 = state('fast', 0, 1), f1 = state('fast', 1, 3.9), f2 = state('fast', 2, 5.9), f3 = state('fast', 6, 13.9), f4 = state('fast', 7, 15.9), f5 = state('fast', 8, 17.9)
  if (!f0.drop || f1.seq !== 2001 || f1.ack !== 1501 || f2.dups !== 1 || f3.dups !== 3 || !f4.arrived || f4.receiverNext !== 3501 || f4.senderAck !== 1501 || f4.receiverSlots.some(x => !x) || f5.senderAck !== 3501) throw Error('fast recovery state invariant failed')
  const preAck = draw('fast', 7, 14, auditProjection()), ackReturn = draw('fast', 8, 16, auditProjection())
  if (preAck.includes('cumulative-ack-3501') || !ackReturn.includes('cumulative-ack-3501')) throw Error('fast draw must show ACK 3501 only in its return phase')
  if (!preAck.includes('Seq 1501–2000') || !preAck.includes('retransmitted-seq-1501') || !preAck.includes('data-x="-160"') || !ackReturn.includes('cumulative-ack-3501') || !ackReturn.includes('data-x="146"')) throw Error('drawn packets must use the dashed channel endpoints and retransmit only the missing segment')
  for (const mode of ['fast', 'timeout', 'ackloss'] as Mode[]) {
    const forward = state(mode, mode === 'fast' ? 1 : 0, 1)
    const backward = state(mode, mode === 'fast' ? 2 : 3, mode === 'fast' ? 5 : 7)
    if (forward.from !== -153 || forward.to !== 153 || backward.from !== 153 || backward.to !== -153) throw Error(`${mode} packet endpoints must match the dashed channel`)
  }
  const fastInFlight = state('fast', 8, 16.2), timeoutInFlight = state('timeout', 3, 6.2), lossInFlight = state('ackloss', 3, 6.2)
  if (fastInFlight.senderAck !== 1501 || fastInFlight.packetAck !== 3501 || timeoutInFlight.senderAck !== 1501 || timeoutInFlight.packetAck !== 2001 || lossInFlight.senderAck !== 1501 || lossInFlight.packetAck !== 2501 || state('ackloss', 1, 3).senderAck !== 1501) throw Error('sender window must wait for the returned ACK packet')
  const to = state('timeout', 3, 7.9); if (to.ack !== 2001 || to.receiverSlots[0] !== 1) throw Error('timeout recovery state invariant failed')
  const al = state('ackloss', 3, 7.9); if (!state('ackloss', 1, 3).drop || al.ack !== 2501 || !al.arrived) throw Error('ACK-loss recovery state invariant failed')
  return true
}
export function draw(mode: Mode, phase: number, t: number, P: P) {
  const o: string[] = []
  const s = state(mode, phase, t), u = (t % 2) / 2, flight = Math.min(1, u / 0.82)
  o.push(box(P, -220, -72, 440, 144, 0, 10, 'lo', 'tcp-recovery-base', { ground: true }))
  o.push(box(P, -190, -42, 74, 84, 10, 40, 'mid', 'tcp-send-cabinet', { assembly: 'sender' }))
  o.push(box(P, -70, -30, 140, 60, 10, 14, 'lo', 'acknowledgement-instrument', { assembly: 'ack-instrument' }))
  o.push(box(P, 116, -42, 74, 84, 10, 48, 'hi', 'tcp-receive-cabinet', { assembly: 'receiver' }))
  const print = (a: [number, number, number], b: [number, number, number], surfaceMark = false) => {
    const line = stroke(seg3(P, a, b), 'lo')
    return surfaceMark ? line.replace('<path', '<path data-free="both" data-line-role="surface-print"') : line
  }
  for (const [x0, x1, y, z0, z1] of [[-180, -126, 42, 18, 43], [126, 180, 42, 18, 43], [-62, 62, 30, 12, 22]] as const) {
    o.push(print([x0, y, z0], [x1, y, z0]), print([x1, y, z0], [x1, y, z1]), print([x1, y, z1], [x0, y, z1]), print([x0, y, z1], [x0, y, z0]))
  }
  for (const xTick of [-48, -24, 0, 24, 48]) o.push(print([xTick, 30, 13], [xTick, 30, 21], true))
  o.push(print([-54, 30, 17], [54, 30, 17], true))
  o.push(text(P, [-153, -3, 57], '发送缓存', 9))
  o.push(text(P, [153, -3, 65], '接收缓存', 9))
  o.push(text(P, [0, -3, 31], `重复ACK ${s.dups}/3`, 8))
  o.push(text(P, [153, -20, 75], s.receiverSlots.map(slot => slot ? '■' : '□').join(' '), 8))
  o.push(text(P, [-153, 16, 68], `发送端ACK ${s.senderAck}`, 8))
  o.push(text(P, [153, 16, 75], `接收端期待 ${s.receiverNext}`, 8))
  o.push(text(P, [0, 59, 76], s.timer, 8))
  o.push(wire(P, [-153, 42, 50], [153, 42, 50], 'data-forward-logical-path', 'mid'))
  o.push(wire(P, [153, 42, 43], [-153, 42, 43], 'ack-return-logical-path', 'lo'))
  o.push(port(P, [-153, 42, 50], 'sender-data-port'), port(P, [153, 42, 50], 'receiver-data-port'))
  o.push(port(P, [153, 42, 43], 'receiver-ack-port'), port(P, [-153, 42, 43], 'sender-ack-port'))
  const move = (from: number, to: number) => from + (to - from) * flight
  if (mode === 'fast' && phase === 8) {
    const x = move(153, -153)
    o.push(box(P, x - 7, 42, 14, 9, 43, 4, 'hi', 'cumulative-ack-3501', { logical: true }))
    o.push(text(P, [x, 48, 49], `ACK ${s.packetAck}`, 7))
  } else if (mode === 'fast' && phase === 7) {
    const x = move(-153, 153)
    o.push(box(P, x - 7, 42, 14, 10, 50, 5, 'hi', 'retransmitted-seq-1501', { logical: true }))
    o.push(text(P, [x, 48, 56], 'Seq 1501–2000', 7))
  } else if (s.kind !== 'none' && !(s.drop && flight >= 1)) {
    const x = move(s.from, s.to)
    const label = s.kind === 'ack' ? `ACK ${s.packetAck}` : `Seq ${s.seq}`
    const laneY = 42, laneZ = s.kind === 'ack' ? 43 : 50
    o.push(box(P, x - 7, laneY, 14, 10, laneZ, 5, s.kind === 'ack' ? 'hi' : 'mid', `${s.kind}-packet`, { logical: true }))
    o.push(text(P, [x, laneY + 6, laneZ + 6], label, 7))
  }
  if (s.drop && flight >= 1) o.push(text(P, s.to > 0 ? [80, -24, 78] : [-80, -24, 78], '丢失 ×', 8))
  return o.join('')
}
export default function TcpReliabilityFigure() {
  const [mode, setMode] = useState<Mode>('fast')
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const P = useMemo(() => auditProjection(), [])
  const phase = Math.floor(t % (mode === 'fast' ? 18 : 8) / 2)
  const s = state(mode, phase, t)
  return <FigureCard
    fig="Fig 3.5.3"
    title="TCP 发送缓存与恢复机构"
    subtitle={`${names[mode]} · ${s.title}`}
    readout={<span>{s.action}　|　Seq {s.seq ?? '—'}　|　发送端ACK {s.senderAck}　|　接收端期待{s.receiverNext}　|　{s.timer}</span>}
    running={running}
    onToggle={() => setRunning(v => !v)}
    onReset={() => setT(0)}
    extra={<div className="flex flex-wrap gap-1">{(['fast', 'timeout', 'ackloss'] as Mode[]).map(m => <button className="btn-outline" key={m} onClick={() => { setT(0); setMode(m) }}>{names[m]}</button>)}</div>}
    caption={mode === 'fast'
      ? 'Seq 1501丢失；Seq 2001、2501、3001与各自ACK 1501依次往返，第三个重复ACK抵达后快速重传。重传填补缺口后，1501–3500按序交付并确认ACK 3501。'
      : mode === 'timeout'
        ? 'Seq 1501首次发送丢失且无重复ACK；RTO到期后重传，到达后ACK 2001返回发送方。'
        : 'ACK 2001在返回路上丢失，发送端窗口仍停在1501；Seq 2001抵达后产生ACK 2501，只有ACK 2501返回后窗口才推进。'}
    legend="左：发送缓存与发送端ACK　·　中：重复ACK计数　·　右：接收缓存与下一个期待字节　·　虚线：数据及ACK方向"
  >
    <Scene width={W} height={H} label={`TCP恢复${names[mode]}：${s.title}，发送端ACK ${s.senderAck}，接收端期待 ${s.receiverNext}`} svg={draw(mode, phase, t, P)} />
  </FigureCard>
}
