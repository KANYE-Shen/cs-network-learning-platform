import { useMemo, useState } from 'react'
import * as k from '../../../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness } from '../../figureKit'
import { assembly, bed, projection, S, L, T, trackedKit } from '../ch1/parts'

const drawKit = trackedKit(k)
const PLAN = { x: -122, y: -68, w: 244, d: 136, r: 7 }
const P = projection(PLAN, 60)
type Mode = 'two' | 'three' | 'close'
export function connectionStates(mode: Mode, step: number, progress: number) {
  const delivered = progress >= .85
  if (mode === 'two') {
    return { a: 'CLOSED', b: step === 0 ? 'LISTEN' : step < 3 || !delivered ? '误判 ESTABLISHED' : 'CLOSED' }
  }
  if (mode === 'three') {
    const a = step === 0 ? 'SYN-SENT' : step === 1 && !delivered ? 'SYN-SENT' : 'ESTABLISHED'
    const b = step === 0 ? delivered ? 'SYN-RECEIVED' : 'LISTEN' : step === 1 || (step === 2 && !delivered) ? 'SYN-RECEIVED' : 'ESTABLISHED'
    return { a, b }
  }
  const a = step === 0 ? 'FIN_WAIT_1' : step === 1 ? delivered ? 'FIN_WAIT_2' : 'FIN_WAIT_1' : step === 2 ? delivered ? 'TIME_WAIT' : 'FIN_WAIT_2' : 'TIME_WAIT'
  const b = step === 0 ? delivered ? 'CLOSE_WAIT' : 'ESTABLISHED' : step === 1 ? 'CLOSE_WAIT' : step === 2 ? 'LAST_ACK' : delivered ? 'CLOSED' : 'LAST_ACK'
  return { a, b }
}
const MESSAGES: Record<Mode, { name: string; packet: string; seq: number; ack: number | null; dir: 0|1; phase: string }[]> = {
  two: [
    { name:'旧副本 SYN', packet:'SYN', seq:100, ack:null, dir:0, phase:'延迟的旧连接请求抵达 B' },
    { name:'SYN-ACK', packet:'SYN · ACK', seq:500, ack:101, dir:1, phase:'两次握手假设下，B 错误地把发送确认当作已建立' },
    { name:'旧数据', packet:'DATA', seq:501, ack:101, dir:1, phase:'B 发出的数据到达 A，但 A 没有对应连接状态' },
    { name:'拒绝旧连接', packet:'RST', seq:101, ack:null, dir:0, phase:'A 拒绝不匹配的旧连接；两端状态不一致' },
  ],
  three: [
    { name:'客户端请求', packet:'SYN', seq:100, ack:null, dir:0, phase:'A 发送 SYN，消耗一个序号' },
    { name:'服务端应答', packet:'SYN · ACK', seq:500, ack:101, dir:1, phase:'B 的 ACK 确认 A 的 SYN；B 同时提出自己的初始序号' },
    { name:'客户端最终确认', packet:'ACK', seq:101, ack:501, dir:0, phase:'A 正在确认 B 的 SYN；ACK 到达后 B 才确认建立' },
    { name:'双向数据可传', packet:'DATA', seq:101, ack:501, dir:0, phase:'连接已确认，序号按字节前进' },
  ],
  close: [
    { name:'A 关闭发送方向', packet:'FIN · ACK', seq:101, ack:501, dir:0, phase:'A 发送带 ACK 的 FIN，关闭 A→B 方向并消耗一个序号' },
    { name:'B 确认并继续发送', packet:'ACK', seq:501, ack:102, dir:1, phase:'B 确认 A 的 FIN；B→A 方向仍可传数据' },
    { name:'B 关闭发送方向', packet:'FIN · ACK', seq:501, ack:102, dir:1, phase:'B 完成剩余数据后发送 FIN，并确认 A 的 FIN' },
    { name:'A 最终确认', packet:'ACK', seq:102, ack:502, dir:0, phase:'A 确认 B 的 FIN 并进入 TIME_WAIT' },
  ],
}

export default function ConnectionManagementFigure({ auditMode = 'three', auditTime = 0 }: { auditMode?: Mode; auditTime?: number } = {}) {
  const [mode, setMode] = useState<Mode>(auditMode)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, auditTime)
  const step = Math.floor((t % 6) / 1.5)
  const progress = (t % 1.5) / 1.5
  // A packet reaches its peer at 85% of the phase; the remaining interval is a
  // stable delivered state so endpoint state changes and packet position agree.
  const flight = Math.min(progress / .85, 1)
  const message = MESSAGES[mode][step]!
  const activeA = mode !== 'two' || step === 0 || step >= 2
  const activeB = mode === 'two' ? step > 0 && (step < 3 || progress < .85) : true
  const { a: stateA, b: stateB } = connectionStates(mode, step, progress)
  const directionOpen = (dir: 0 | 1) => {
    if (mode === 'two') return dir === 1 && step >= 1 && step < 3
    if (mode === 'three') return step >= 2 && (mode !== 'three' || stateB === 'ESTABLISHED' || (dir === 0 && step === 2))
    if (dir === 0) return false // A closes its sending half as soon as its FIN is sent.
    return step < 2
  }
  const svg = useMemo(() => {
    const out: string[] = [bed(P, PLAN)]
    // Each endpoint is a supported terminal: a grounded plinth carries one upright case.
    // Sequence wheels, ACK values and direction lamps are surface marks, not floating solids.
    for (const x of [-86, 53]) {
      out.push(assembly(`tcp-endpoint-${x}`, [
        S(drawKit.slabOf({ x: x - 19, y: -34, w: 38, d: 38, r: 4 }, 6, 4, P, 5), 'lo'),
        S(drawKit.slabOf({ x: x - 15, y: -29, w: 30, d: 28, r: 3 }, 10, 23, P, 5), 'mid'),
        L(k.planOutline({ x: x - 11, y: -27, w: 22, d: 2, r: 1 }, 29.2, P), 'hi'),
        T([x, -25, 25], x < 0 ? 'A' : 'B', P, 10),
        ...[-8, 8].flatMap((dx, side) => {
          const cx = x + dx, open = directionOpen((x < 0 ? side === 0 : side === 1) ? 0 : 1)
          return [L(k.ring(cx, -1, 5, 33.1, P, 24), side === message.dir ? 'lit' : 'lo'), T([cx, -1, 34], side === 0 ? 'seq' : 'ack', P, 5), L(k.ring(cx, 1, 1.6, 15.2, P, 12), open ? 'lit' : 'faint')]
        }),
        T([x, 20, 25], x < 0 ? stateA : stateB, P, 6, x < 0 ? activeA ? 'hi' : 'lo' : activeB ? 'hi' : 'lo'),
      ].join('')))
    }
    // The two lanes are logical TCP directions, drawn as paths rather than hardware.
    for (const y of [-13, 4]) out.push(`<g data-anatomy-overlay="logical-tcp-direction">${k.lineSvg(k.segment([-71, y, 18], [38, y, 18], P), { tone: y < 0 ? 'mid' : 'faint', free: true })}</g>`)
    // Message direction and ACK values come from the explicit state-machine row above.
    if (message.packet !== '—') {
      const from = message.dir === 0 ? -71 : 38
      const to = message.dir === 0 ? 38 : -71
      const x = from + (to - from) * flight
      const laneY = message.dir === 0 ? -13 : 4
      const marker = k.iso([x, laneY, 18], P)
      out.push(`<g data-anatomy-overlay="logical-tcp-packet"><circle cx="${marker[0].toFixed(1)}" cy="${marker[1].toFixed(1)}" r="5" fill="var(--anatomy-${mode === 'two' ? 'face' : 'hi'})"/><text x="${marker[0].toFixed(1)}" y="${(marker[1] + 2).toFixed(1)}" text-anchor="middle" font-size="5" fill="var(--anatomy-ink)">${message.packet}</text></g>`)
    }
    // TIME_WAIT timer exists at the active closer after the final ACK (2MSL is a teaching condition).
    if (mode === 'close' && step === 3) {
      out.push(S(drawKit.cylinder(-67, 25, 10, 6, 3, P, 32), 'lo'))
      out.push(L(k.ring(-67, 25, 7.5, 9.2, P, 28), 'hi'))
      for (let i = 0; i < 12; i++) {
        const a=i*Math.PI/6
        out.push(L(k.segment([-67+Math.cos(a)*6.5,25+Math.sin(a)*6.5,9.3],[-67+Math.cos(a)*8,25+Math.sin(a)*8,9.3],P),'faint'))
      }
      out.push(T([-67,25,10], '2MSL', P, 5, 'hi'))
    }
    out.push(T([-86,-47,50], '端点 A', P, 8), T([74,-47,50], '端点 B', P, 8))
    return out.join('')
  }, [mode, step, progress, flight, message, activeA, activeB])
  const read = mode === 'two'
    ? `seq=${message.seq || '—'} · ack=${message.ack ?? '—'} · ${message.name}`
    : `seq=${message.seq} · ack=${message.ack ?? '—'} · ${message.packet}`
  const caption = mode === 'two'
    ? '反例：两次消息被当作足够确认时，B 收到旧副本 SYN 后发送 SYN-ACK 并误判已建立；A 并未发起连接，拒绝随后到达的数据，双方状态因此不一致。三次握手等待 A 对 B 初始序号的确认。此处序号只作教学例。'
    : mode === 'three'
      ? 'SYN 消耗一个序号；SYN-ACK 中 ack=101 表示下一个期待字节/控制序号。第三次 ACK 确认服务端 SYN，双方才确认双向状态。'
      : 'FIN 与 SYN 一样各占一个序号；ACK 指向下一个期望序号。两个方向可分别关闭，主动关闭的一端在最后 ACK 后进入 TIME_WAIT（教材模型常以 2MSL 描述）。'
  return (
    <FigureCard
      fig="图 · TCP 连接管理"
      title="连接状态在两个方向分别建立和释放"
      subtitle="双端序号与 ACK 读数、独立方向灯演示建立、半关闭及 TIME_WAIT。"
      readout={<>{message.phase} · {read} · A={stateA} / B={stateB}</>}
      running={running}
      onToggle={() => setRunning(v => !v)}
      onReset={() => { setT(0); setRunning(false) }}
      extra={<select aria-label="TCP连接阶段" value={mode} onChange={e => { setMode(e.target.value as Mode); setT(0) }}><option value="two">两消息旧 SYN 反例</option><option value="three">三次握手建立</option><option value="close">四次挥手释放</option></select>}
      legend="左：客户端 A · 右：服务端 B · 中：双向逻辑路径；亮色=当前 TCP 报文"
      caption={caption}>
      <Scene width={700} height={385} label="TCP双端连接终端、序号与ACK标记、双向逻辑路径、FIN释放与TIME_WAIT计时器" svg={svg} />
    </FigureCard>
  )
}
