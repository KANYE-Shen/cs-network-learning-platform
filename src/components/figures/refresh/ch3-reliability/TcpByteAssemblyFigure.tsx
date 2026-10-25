import { useMemo, useState } from 'react'
import { FigureCard, Scene, initialTime, prefersStillness, usePlayClock } from '../../figureKit'
import { W, H, box, port, projection, seg3, stroke, text, wire, type P } from '../ch2/primitives'
const first = 1001, segmentBytes = 500
export const auditProjection = () => projection([[-230, -86, 0], [230, 86, 96]], 43, 31)
export const state = (phase: number) => { const seg = Math.min(2, Math.floor(phase / 4)), sub = phase % 4, arrived = Math.min(3, Math.floor((phase + 2) / 4)); return { seg, sub, arrived, seq: first + seg * segmentBytes, ack: first + arrived * segmentBytes } }
export function assertModel() { const expected = [1001, 1501, 2001], acks = [1001, 1501, 2001, 2501]; for (let i = 0;i < 3;i++) { if (state(i * 4 + 1).seq !== expected[i] || state(i * 4 + 1).ack !== acks[i] || state(i * 4 + 2).ack !== acks[i + 1] || state(i * 4 + 3).ack !== acks[i + 1]) throw Error(`TCP byte assembly transition ${i} failed`) } return true }
export function draw(t: number, P: P) {
  const o: string[] = []
  const phase = Math.floor(t % 12), fraction = t % 1, s = state(phase)
  o.push(box(P, -220, -72, 440, 144, 0, 10, 'lo', 'byte-measurement-bed', { ground: true }))
  o.push(box(P, -198, -37, 80, 74, 10, 35, 'mid', 'sender-assembly', { assembly: 'sender' }))
  o.push(box(P, -91, -34, 184, 68, 10, 18, 'hi', 'byte-sequence-ruler', { assembly: 'sequence-ruler' }))
  o.push(box(P, 118, -37, 80, 74, 10, 35, 'lo', 'receiver-assembly', { assembly: 'receiver' }))
  const print = (a: [number, number, number], b: [number, number, number], surfaceMark = false) => {
    const line = stroke(seg3(P, a, b), 'lo')
    return surfaceMark ? line.replace('<path', '<path data-free="both" data-line-role="surface-print"') : line
  }
  for (const xTick of [-70, 0, 70]) o.push(print([xTick, 34, 14], [xTick, 34, 25], true))
  o.push(print([-82, 34, 14], [82, 34, 14], true))
  o.push(print([-184, 37, 17], [-132, 37, 17]), print([-184, 37, 29], [-132, 37, 29]), print([-184, 37, 17], [-184, 37, 29]), print([-132, 37, 17], [-132, 37, 29]))
  o.push(print([132, 37, 17], [184, 37, 17]), print([132, 37, 29], [184, 37, 29]), print([132, 37, 17], [132, 37, 29]), print([184, 37, 17], [184, 37, 29]))
  o.push(text(P, [-70, 35, 24], '1001', 5), text(P, [0, 35, 24], '1501', 5), text(P, [70, 35, 24], '2001', 5))
  o.push(text(P, [-158, 0, 51], '发送端', 9))
  o.push(text(P, [158, 0, 51], '接收端', 9))
  o.push(text(P, [0, -2, 36], '字节序号 1001 → 1501 → 2001', 8))
  o.push(text(P, [158, 0, 58], `已收 ${s.arrived}/3 段`, 8))
  o.push(wire(P, [-158, 37, 40], [158, 37, 40], 'data-forward-logical-channel', 'mid'))
  o.push(wire(P, [158, 37, 36], [-158, 37, 36], 'ack-return-logical-channel', 'lo'))
  o.push(port(P, [-158, 37, 40], 'sender-data-port'), port(P, [158, 37, 40], 'receiver-data-port'))
  o.push(port(P, [158, 37, 36], 'receiver-ack-port'), port(P, [-158, 37, 36], 'sender-ack-port'))
  const moving = s.sub === 1 || s.sub === 3, back = s.sub === 3
  const from = back ? 158 : -158, to = back ? -158 : 158
  const x = moving ? from + (to - from) * fraction : (s.sub === 2 ? 158 : -158)
  if (back) {
    o.push(box(P, x - 9, 37, 18, 10, 36, 4, 'hi', 'cumulative-ack-packet', { logical: true }))
    o.push(text(P, [x, 43, 43], `ACK ${s.ack}`, 7))
  } else {
    o.push(box(P, x - 9, 37, 18, 12, 40, 5, 'hi', 'tcp-data-segment', { logical: true }))
    o.push(text(P, [x, 43, 47], `Seq ${s.seq} · 500 B`, 7))
  }
  o.push(text(P, [0, 57, 78], `接收端下一期待字节：${s.ack}`, 8))
  return o.join('')
}

export default function TcpByteAssemblyFigure() {
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, initialTime())
  const P = useMemo(() => auditProjection(), [])
  const phase = Math.floor(t % 12)
  const s = state(phase)
  const phaseName = ['报文段准备', '报文段在途', '接收端接受字节', '累计ACK返回'][s.sub]

  return <FigureCard
    fig="Fig 3.5.1"
    title="TCP 字节序号与接收装配尺"
    subtitle={`${phaseName} · Seq=${s.seq}, Len=${segmentBytes} B`}
    readout={<span>累计 ACK={s.ack}　·　下一个期望字节序号</span>}
    running={running}
    onToggle={() => setRunning(v => !v)}
    onReset={() => setT(0)}
    legend="左：发送端　·　中：字节序号尺　·　右：接收端　·　虚线：数据与累计ACK方向"
    caption="TCP 序号按字节计数；三个连续 500 字节段分别从 1001、1501、2001 开始。每段到达接收端后，累计 ACK 才推进到 1501、2001、2501。"
  >
    <Scene width={W} height={H} label={`TCP字节序号Seq ${s.seq}，Len ${segmentBytes}，累计ACK ${s.ack}`} svg={draw(t, P)} />
  </FigureCard>
}
