import { useMemo, useState } from 'react'
import * as k from '../../../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness } from '../../figureKit'
import { assembly, bed, controlKnob, projection, S, L, T, trackedKit } from './parts'

const drawKit = trackedKit(k)
const PLAN = { x: -116, y: -60, w: 232, d: 120, r: 6 }
const P = projection(PLAN, 56)

export default function ProtocolSequenceFigure({ auditMode = 'valid', auditTime = 0 }: { auditMode?: 'valid' | 'invalid'; auditTime?: number } = {}) {
  const [mode, setMode] = useState<'valid' | 'invalid'>(auditMode)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, auditTime)
  const step = Math.floor((t % 6) / 1.5)
  const u = (t % 1.5) / 1.5
  const permitted = mode === 'valid' ? step >= 2 : step === 3
  const phase = mode === 'invalid'
    ? ['服务端过早应答，被锁扣挡回', '客户端发出请求', '收到请求后服务端应答', '按完整顺序执行并复位'][Math.min(step, 3)]
    : ['客户端发出请求', '服务端收到请求后应答', '客户端收到应答并执行', '本轮完成，准备复位'][Math.min(step, 3)]
  const staticSvg = useMemo(() => {
    const out: string[] = [assembly('bench', bed(P, PLAN))]
    // Two distinct operator terminals: keyboard decks, raised screens, hinges, feet and side vents.
    for (const x of [-82, 45]) {
      const terminal: string[] = []
      terminal.push(S(drawKit.slabOf({ x, y: 8, w: 54, d: 17, r: 3 }, 6, 4, P, 6, 0.8), 'lo'))
      terminal.push(S(drawKit.slabOf({ x: x + 4, y: -34, w: 2, d: 8, r: .5 }, 6, 4, P, 3), 'mid'))
      terminal.push(S(drawKit.slabOf({ x: x + 48, y: -34, w: 2, d: 8, r: .5 }, 6, 4, P, 3), 'mid'))
      // The display frame is open; only its rim supports a thin, visible glass panel.
      terminal.push(S(drawKit.slabOf({ x: x + 3, y: -26, w: 3, d: 3, r: 1 }, 10, 23, P, 4), 'mid'))
      terminal.push(S(drawKit.slabOf({ x: x + 6, y: -26, w: 42, d: 3, r: 1 }, 10, 3, P, 4), 'mid'))
      terminal.push(S(drawKit.slabOf({ x: x + 6, y: -25, w: 42, d: 1, r: 0.3 }, 13, 17, P, 4), 'hi'))
      terminal.push(S(drawKit.slabOf({ x: x + 6, y: -26, w: 42, d: 3, r: 1 }, 30, 3, P, 4), 'mid'))
      terminal.push(S(drawKit.slabOf({ x: x + 48, y: -26, w: 3, d: 3, r: 1 }, 10, 23, P, 4), 'mid'))
      terminal.push(L(k.planOutline({ x: x + 8, y: -25, w: 38, d: 1, r: 0.3 }, 30, P), 'faint'))
      for (let i = 0; i < 9; i++) terminal.push(S(drawKit.slabOf({ x: x + 5 + i * 5.2, y: 12, w: 3.2, d: 5, r: 0.7 }, 10, 1.4, P, 3), i === 4 ? 'hi' : 'lo'))
      for (let i = 0; i < 5; i++) terminal.push(S(drawKit.slabOf({ x: x + 6 + i * 8, y: 19, w: 5, d: 2.8, r: 0.5 }, 10, 1.1, P, 3), 'mid'))
      out.push(assembly(x < 0 ? 'client-A' : 'server-B', terminal.join('')))
    }
    // Handshake interlock: three axial pins, a keyed drum, two spring loaded pawls and a stop.
    const interlock: string[] = []
    const pinCaps: string[] = []
    interlock.push(S(drawKit.slabOf({ x: -18, y: -4, w: 58, d: 32, r: 4 }, 6, 4, P, 6, 0.8), 'lo'))
    for (let i = 0; i < 3; i++) {
      interlock.push(S(drawKit.cylinder(-12 + i * 13, 5, 4.4, 10, 9, P, 20, 0.5), i < step ? 'hi' : 'mid'))
      interlock.push(L(k.sideArc(-12 + i * 13, 5, 4.3, 16, P, 16), 'faint'))
      pinCaps.push(S(drawKit.cylinder(-12 + i * 13, 5, 1.2, 19, 1, P, 10), 'lo'))
    }
    interlock.push(...pinCaps)
    for (const x of [-7, 7]) interlock.push(S(drawKit.slabOf({ x: x - 1.4, y: 13, w: 2.8, d: 12, r: 1 }, 10, 4, P, 4), 'mid'))
    // The stop is a slotted fork: the sliding bolt passes through its open center.
    interlock.push(S(drawKit.slabOf({ x: 25, y: -1, w: 8, d: 3, r: 1 }, 10, 6, P, 4), 'hi'))
    // The moving bolt sits between the rear and front rails in SVG painter order.
    interlock.push(S(drawKit.slabOf({ x: permitted ? 30 : 24, y: 2, w: 8, d: 4, r: 1 }, 12, 4, P, 4), permitted ? 'hi' : 'lo'))
    interlock.push(S(drawKit.slabOf({ x: 25, y: 7, w: 8, d: 10, r: 1 }, 10, 6, P, 4), 'hi'))
    interlock.push(controlKnob(36, 23, 10, P, permitted))
    out.push(assembly('sequence-interlock', interlock.join('')))
    out.push(assembly('message-track', S(drawKit.slabOf({ x: -38, y: 29, w: 80, d: 7, r: 2 }, 6, 4, P, 4), 'lo')))
    out.push(T([-61, 39, 37], 'A', P, 8), T([72, 39, 37], 'B', P, 8))
    return out.join('')
  }, [mode, permitted, step])
  // Keep the costly instrument geometry cached; only the traveling protocol message is rebuilt.
  let tokenX: number | null = null
  let tokenTone: k.LineTone = 'lit'
  if (mode === 'valid' && step === 0) tokenX = -33 + 73 * u // request A → B
  else if (mode === 'valid' && step === 1) tokenX = 40 - 73 * u // reply B → A
  else if (mode === 'invalid' && step === 0) {
    tokenX = 40 - Math.min(1, u * 7) * 6 // premature reply hits the server-side stop
    tokenTone = 'lo'
  } else if (mode === 'invalid' && step === 1) tokenX = -33 + 73 * u // request A → B
  else if (mode === 'invalid' && step === 2) tokenX = 40 - 73 * u // correctly ordered reply B → A
  const token = tokenX === null ? '' : assembly('moving-message',
    S(drawKit.slabOf({ x: tokenX - 4, y: 30, w: 8, d: 5, r: 1 }, 10, 3, P, 4), tokenTone === 'lo' ? 'mid' : 'hi') +
    L(k.planOutline({ x: tokenX - 2.4, y: 31.1, w: 4.8, d: 2.8, r: 0.4 }, 13, P), tokenTone))
  const svg = staticSvg + token
  return (
    <FigureCard
      fig="图 · 协议规则与顺序"
      title="两台终端用锁扣执行协议"
      subtitle="协议规定报文格式、先后顺序和收到报文后的动作；锁扣只在状态允许时放行。"
      readout={<>A 客户端 → B 服务端 · {phase} · 状态 {step + 1}/4</>}
      running={running}
      onToggle={() => setRunning((v) => !v)}
      onReset={() => { setT(0); setRunning(false) }}
      extra={<select aria-label="协议顺序" value={mode} onChange={(e) => { setMode(e.target.value as typeof mode); setT(0) }}><option value="valid">合法顺序</option><option value="invalid">乱序示例</option></select>}
      legend="左：客户端 A · 右：服务端 B · 中：顺序锁扣；亮框=当前报文"
      caption={mode === 'valid' ? 'A 客户端请求 → B 服务端应答 → A 客户端执行；接收方状态机只在预期消息到达后改变状态。' : '乱序模式先让 B 服务端应答到达，锁扣挡住它且状态不变；之后 A 客户端请求先到，只有随后的应答才放行执行。'}>
      <Scene width={700} height={385} label="客户端A与服务端B的协议顺序锁扣；过早应答停在服务端" svg={svg} />
    </FigureCard>
  )
}
