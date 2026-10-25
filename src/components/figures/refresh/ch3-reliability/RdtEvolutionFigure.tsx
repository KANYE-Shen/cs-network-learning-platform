import { useMemo, useState } from 'react'
import { FigureCard, Scene, initialTime, prefersStillness, usePlayClock } from '../../figureKit'
import { W, H, box, projection, round, seg3, stroke, text, wire, type P } from '../ch2/primitives'
type Version = 'rdt1' | 'rdt2' | 'rdt21' | 'rdt22' | 'rdt3'
type Packet = 'data' | 'damaged-data' | 'ack' | 'nak' | 'duplicate-data' | 'none'
export const auditProjection = () => projection([[-230, -86, 0], [230, 86, 100]], 43, 31)
type State = { title: string; from: number; to: number; kind: Packet; seq: number | null; ack: number | null; drop: boolean; corrupt: boolean; duplicateData: boolean; duplicateAck: boolean; deliveredCount: number; timer: string; mechanism: string }
const specs: Record<Version, { label: string; explain: string }> = { rdt1: { label: 'rdt1.0', explain: '假设底层信道可靠、不损坏、不丢失；数据分组只向接收应用交付，不需要检错或确认。' }, rdt2: { label: 'rdt2.0', explain: '信道可能破坏数据；校验和发现损坏后，接收端返回 NAK，发送端重传。此版假设反馈可靠。' }, rdt21: { label: 'rdt2.1', explain: '数据与ACK都可能损坏；序号区分重传副本，接收端丢弃已交付的重复分组，只再次确认。' }, rdt22: { label: 'rdt2.2', explain: '用对上一序号的重复ACK代替显式NAK；发送端据此重传当前序号分组。' }, rdt3: { label: 'rdt3.0', explain: '数据或反馈可能丢失；发送端启动计时器，超时后重传当前分组。' } }
export function state(v: Version, p: number, t: number): State {
  const u = (t % 2) / 2, arrived = Math.min(1, u / 0.82) >= 1
  if (v === 'rdt1') return [
    { title: '发送可靠信道中的数据', from: -98, to: -98, kind: 'data', seq: null, ack: null, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: 0, timer: '无计时器', mechanism: '仅发送数据' },
    { title: '数据向接收端传输', from: -98, to: 98, kind: 'data', seq: null, ack: null, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: 0, timer: '无计时器', mechanism: '可靠信道不需反馈' },
    { title: '数据交付接收应用', from: 98, to: 98, kind: 'data', seq: null, ack: null, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: 1, timer: '无计时器', mechanism: '完成一次交付' },
    { title: '接收应用保留一份数据', from: 98, to: 98, kind: 'none', seq: null, ack: null, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: 1, timer: '无计时器', mechanism: '无ACK / NAK' }
  ][p]! as State
  if (v === 'rdt2') return [
    { title: '发送带校验和的分组', from: -98, to: 98, kind: 'data', seq: null, ack: null, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: 0, timer: '无计时器', mechanism: '校验和随分组前进' },
    { title: '接收端检出损坏', from: 98, to: 98, kind: 'damaged-data', seq: null, ack: null, drop: false, corrupt: true, duplicateData: false, duplicateAck: false, deliveredCount: 0, timer: '无计时器', mechanism: '校验和不匹配' },
    { title: 'NAK 返回发送端', from: 98, to: -98, kind: 'nak', seq: null, ack: null, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: 0, timer: '无计时器', mechanism: '负确认请求重传' },
    { title: '重传后成功交付', from: -98, to: 98, kind: 'data', seq: null, ack: null, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: arrived ? 1 : 0, timer: '无计时器', mechanism: arrived ? '校验通过并交付' : '重传在途' }
  ][p]! as State
  if (v === 'rdt21') return [
    { title: '发送序号0分组', from: -98, to: 98, kind: 'data', seq: 0, ack: null, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: 0, timer: '无计时器', mechanism: '等待ACK 0' },
    { title: 'ACK 0 在返回路上损坏', from: 98, to: -98, kind: 'ack', seq: 0, ack: 0, drop: false, corrupt: true, duplicateData: false, duplicateAck: false, deliveredCount: 1, timer: '反馈受损', mechanism: '接收端已交付一次；发送端未确认' },
    { title: '发送方重传序号0', from: -98, to: 98, kind: 'data', seq: 0, ack: 0, drop: false, corrupt: false, duplicateData: true, duplicateAck: false, deliveredCount: 1, timer: '等待新ACK 0', mechanism: '相同序号副本在途' },
    { title: '接收端丢弃副本并重发ACK 0', from: 98, to: -98, kind: 'ack', seq: 0, ack: 0, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: 1, timer: '确认恢复', mechanism: '重复副本不再次交付' }
  ][p]! as State
  if (v === 'rdt22') return [
    { title: '发送序号0分组', from: -98, to: 98, kind: 'data', seq: 0, ack: null, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: 0, timer: '无计时器', mechanism: '等待ACK 0' },
    { title: '接收端发现分组损坏', from: 98, to: 98, kind: 'damaged-data', seq: 0, ack: null, drop: false, corrupt: true, duplicateData: false, duplicateAck: false, deliveredCount: 0, timer: '无计时器', mechanism: '损坏分组不交付' },
    { title: '重复ACK 1代替NAK', from: 98, to: -98, kind: 'ack', seq: 0, ack: 1, drop: false, corrupt: false, duplicateData: false, duplicateAck: true, deliveredCount: 0, timer: '无计时器', mechanism: '用前一序号ACK表示缺口' },
    { title: '发送端重传序号0', from: -98, to: 98, kind: 'data', seq: 0, ack: 1, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: arrived ? 1 : 0, timer: '无计时器', mechanism: arrived ? '重传校验通过并交付' : '同一序号分组重传' }
  ][p]! as State
  return [
    { title: '首次发送序号0途中丢失', from: -98, to: 98, kind: 'data', seq: 0, ack: null, drop: true, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: 0, timer: '运行', mechanism: '原始分组未到达接收端' },
    { title: '发送方等待RTO', from: -98, to: -98, kind: 'none', seq: 0, ack: null, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: 0, timer: '倒计时', mechanism: '没有ACK，计时器继续运行' },
    { title: '计时器到期后重传序号0', from: -98, to: 98, kind: 'data', seq: 0, ack: null, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: arrived ? 1 : 0, timer: 'RTO到期', mechanism: arrived ? '重传已交付' : '重传在途' },
    { title: 'ACK 0 返回发送方', from: 98, to: -98, kind: 'ack', seq: 0, ack: 0, drop: false, corrupt: false, duplicateData: false, duplicateAck: false, deliveredCount: 1, timer: arrived ? '停止' : '等待ACK', mechanism: arrived ? '发送方收到确认' : 'ACK仍在返回' }
  ][p]! as State
}
export function assertModel() {
  if (state('rdt1', 3, 6).ack !== null || state('rdt1', 3, 6).deliveredCount !== 1) throw Error('rdt1 must deliver once without ACK')
  if (state('rdt2', 1, 3).kind !== 'damaged-data' || state('rdt2', 2, 4).kind !== 'nak' || state('rdt2', 3, 5.9).deliveredCount !== 1) throw Error('rdt2 checksum/NAK/retransmit invariant failed')
  if (state('rdt21', 1, 3).corrupt !== true || state('rdt21', 2, 4).kind !== 'data' || !state('rdt21', 2, 5.8).duplicateData || state('rdt21', 3, 6).duplicateData || state('rdt21', 3, 6).deliveredCount !== 1) throw Error('rdt2.1 duplicate suppression invariant failed')
  if (state('rdt22', 2, 4).ack !== 1 || !state('rdt22', 2, 4).duplicateAck || state('rdt22', 3, 5.9).deliveredCount !== 1) throw Error('rdt2.2 duplicate ACK invariant failed')
  if (!state('rdt3', 0, 1).drop || state('rdt3', 1, 3).kind !== 'none' || state('rdt3', 2, 5.9).deliveredCount !== 1 || state('rdt3', 3, 5).timer !== '等待ACK' || state('rdt3', 3, 6).kind !== 'ack') throw Error('rdt3 timeout invariant failed')
  return true
}
export function draw(version: Version, t: number, P: P) {
  const o: string[] = []
  const phase = Math.floor(t % 8 / 2), u = (t % 2) / 2, flight = Math.min(1, u / 0.82), s = state(version, phase, t)
  o.push(box(P, -220, -72, 440, 144, 0, 10, 'lo', 'reliability-test-rig', { ground: true }))
  o.push(box(P, -190, -44, 92, 88, 10, 40, 'mid', 'sender-machine', { assembly: 'sender' }))
  o.push(box(P, 98, -44, 92, 88, 10, 40, 'hi', 'receiver-machine', { assembly: 'receiver' }))
  const print = (a: [number, number, number], b: [number, number, number], surfaceMark = false) => {
    const line = stroke(seg3(P, a, b), 'lo')
    return surfaceMark ? line.replace('<path', '<path data-free="both" data-line-role="surface-print"') : line
  }
  for (const [x0, x1] of [[-180, -108], [108, 180]] as const) {
    o.push(print([x0, 44, 18], [x1, 44, 18]), print([x1, 44, 18], [x1, 44, 42]), print([x1, 44, 42], [x0, 44, 42]), print([x0, 44, 42], [x0, 44, 18]))
    o.push(print([x0 + 8, 44, 27], [x1 - 8, 44, 27], true), print([x0 + 8, 44, 34], [x1 - 8, 44, 34], true))
  }
  o.push(text(P, [-144, -3, 58], '发送方', 9))
  o.push(text(P, [144, -3, 58], '接收方', 9))
  o.push(wire(P, [-98, 44, 50], [98, 44, 50], 'data-forward-logical-channel', 'mid'))
  if (version !== 'rdt1') {
    o.push(round(P, 0, 35, 18, 10, 28, 'hi', 'checksum-feedback-drum'))
    o.push(text(P, [0, 53, 23], 'CHECK', 6))
    o.push(text(P, [0, 37, 48], s.kind === 'nak' ? 'NAK' : s.ack === null ? 'ACK/NAK' : 'ACK', 8))
    o.push(wire(P, [98, 44, 43], [-98, 44, 43], 'feedback-reverse-logical-channel', 'lo'))
  }
  if (version === 'rdt3') o.push(round(P, -48, 52, 15, 10, 26, phase === 2 ? 'hi' : 'mid', 'retransmission-timer'))
  o.push(text(P, [-144, 10, 68], `已交付 ${s.deliveredCount} 份`, 8))
  o.push(text(P, [144, 10, 68], s.deliveredCount ? '数据已交付' : '等待有效数据', 8))
  o.push(text(P, [0, 60, 75], s.mechanism, 8))
  if (s.kind !== 'none' && !(s.drop && u > .82)) {
    const x = s.from + (s.to - s.from) * flight
    const laneY = 44, laneZ = s.kind === 'ack' || s.kind === 'nak' ? 43 : 50
    const label = s.kind === 'nak' ? 'NAK' : s.kind === 'ack' ? `ACK ${s.ack}` : s.seq === null ? 'DATA' : `Seq ${s.seq}`
    o.push(box(P, x - 7, laneY, 14, 10, laneZ, 5, s.corrupt ? 'hi' : s.kind === 'ack' || s.kind === 'nak' ? 'mid' : 'hi', `${s.kind}-packet`, { logical: true }))
    o.push(text(P, [x, laneY + 6, laneZ + 6], s.corrupt ? '×' : label, 7))
    if (s.duplicateData && s.kind === 'data' && flight >= 1) o.push(text(P, [88, -19, 72], '重复副本丢弃', 7))
  }
  if (s.drop && u > .82) o.push(text(P, s.to > 0 ? [75, -18, 70] : [-75, -18, 70], '丢失 ×', 8))
  return o.join('')
}

export default function RdtEvolutionFigure() {
  const [v, setV] = useState<Version>('rdt1')
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const P = useMemo(() => auditProjection(), [])
  const phase = Math.floor(t % 8 / 2)
  const s = state(v, phase, t)
  const titles = Array.from({ length: 4 }, (_, p) => state(v, p, p * 2).title)

  return <FigureCard
    fig="Fig 3.4.1"
    title="可靠传输协议演进检验台"
    subtitle={`${specs[v].label} · ${titles[phase]}`}
    readout={<span>{s.mechanism}　·　{v === 'rdt1'
      ? '无校验和与ACK'
      : s.kind === 'nak'
        ? 'NAK反向返回'
        : s.kind === 'ack'
          ? `ACK ${s.ack}反向返回`
          : v === 'rdt3'
            ? `计时器：${s.timer}`
            : `Seq ${s.seq ?? '—'}，已交付${s.deliveredCount}份`}</span>}
    running={running}
    onToggle={() => setRunning(x => !x)}
    onReset={() => setT(0)}
    extra={<div className="flex flex-wrap gap-1">
      {(['rdt1', 'rdt2', 'rdt21', 'rdt22', 'rdt3'] as Version[]).map(x => <button key={x} className="btn-outline" onClick={() => { setT(0); setV(x) }}>{specs[x].label}</button>)}
    </div>}
    caption={specs[v].explain}
    legend="左：发送方　·　中：校验与反馈机构（rdt1不使用）　·　右：接收方　·　虚线：逻辑信道"
  >
    <Scene width={W} height={H} label={`${specs[v].label}：${s.title}；${s.mechanism}`} svg={draw(v, t, P)} />
  </FigureCard>
}
