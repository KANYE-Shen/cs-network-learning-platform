import { useMemo, useState } from 'react'
import * as k from '../../../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness } from '../../figureKit'
import { assembly, bed, projection, S, L, T, trackedKit } from './parts'

const drawKit = trackedKit(k)
const PLAN = { x: -123, y: -69, w: 246, d: 138, r: 7 }
const P = projection(PLAN, 66)
type Mode = 'five' | 'osi' | 'tcp'
const MODEL: Record<Mode, { names: string[]; note: string }> = {
  five: { names: ['应用', '传输', '网络', '链路', '物理'], note: '教学五层：便于看见端到端、逐跳与比特传输的职责边界。' },
  osi: { names: ['应用', '表示', '会话', '传输', '网络', '数据链路', '物理'], note: 'OSI 七层是参考模型；表示、会话职责常由应用层实现承担。' },
  tcp: { names: ['应用', '传输', '互联网', '网络接口'], note: 'TCP/IP 四层模型把教学五层的链路与物理合并为网络接口层。' },
}
const COLORS = ['hi','mid','lo','mid','hi','lo','mid'] as const

export default function LayerServiceFigure({ auditMode = 'five', auditTime = 0 }: { auditMode?: Mode; auditTime?: number } = {}) {
  const [mode, setMode] = useState<Mode>(auditMode)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, auditTime)
  const names = MODEL[mode].names
  const stage = Math.floor((t % (names.length * 1.1)) / 1.1)
  const progress = (t % 1.1) / 1.1
  const headersAt = (layerIndex: number) => {
    const label = names[layerIndex]
    return label === '传输' ? 1 : ['网络', '互联网'].includes(label ?? '') ? 2 : ['链路', '数据链路', '网络接口', '物理'].includes(label ?? '') ? 3 : 0
  }
  const layerPosition = Math.min(names.length - 1, stage + progress)
  const headerCount = headersAt(Math.min(names.length - 1, Math.floor(layerPosition)))
  const svg = useMemo(() => {
    const out: string[] = [bed(P, PLAN)]
    const rowHeight = 5
    const baseZ = 8
    const endpointX = [-101, 52]
    for (const [side, bx] of endpointX.entries()) {
        const rack: string[] = []
        rack.push(S(drawKit.slabOf({ x: bx, y: -43, w: 44, d: 48, r: 3 }, 6, 2, P, 5), 'lo'))
        rack.push(S(drawKit.slabOf({ x: bx + 3, y: -41, w: 38, d: 2, r: .5 }, 8, names.length * rowHeight, P, 4), 'mid'))
        // The backplane meets the rear edge of the stack and carries the modules;
        // omit side rails whose projected faces obscure the layer blades.
        rack.push(S(drawKit.slabOf({ x: bx + 3, y: -39, w: 38, d: 2, r: .5 }, 8, names.length * rowHeight, P, 4), 'lo'))
        // One solid service blade per named layer; adjacent blades physically meet in the stack.
        // Lower physical modules are painted first, then upper service layers.
        for (let layer = names.length - 1; layer >= 0; layer--) {
          const layerZ = 8 + (names.length - 1 - layer) * rowHeight
          rack.push(S(drawKit.slabOf({ x: bx + 7, y: -37, w: 30, d: 29, r: 1.5 }, layerZ, rowHeight, P, 4), layer === stage ? 'hi' : COLORS[layer % COLORS.length]!))
          rack.push(T([bx + 22, -22, layerZ + 2.5], names[layer]!, P, 6, layer === stage ? 'hi' : 'mid'))
        }
        out.push(assembly(`endpoint-${side === 0 ? 'sender' : 'receiver'}`, rack.join('')))
    }
    for (let i = 0; i < names.length; i++) {
      const z = baseZ + (names.length - 1 - i) * rowHeight
      // Faint SVG paths encode logical peer protocols, not extra physical hardware.
      out.push(`<g data-anatomy-overlay="peer-protocol">${k.lineSvg(k.segment([-57, -22, z + 2.5], [58, -22, z + 2.5], P), { tone: i === stage ? 'lit' : 'faint', free: true })}</g>`)
    }
    // A small logical marker descends the sender stack; the text reports existing headers.
    const packetX = -79, packetY = -16
    const packetZ = baseZ + (names.length - 1 - layerPosition) * rowHeight
    const marker = k.iso([packetX, packetY, packetZ + 2.5], P)
    out.push(`<g data-anatomy-overlay="encapsulating-payload"><circle class="iso-face-text" cx="${marker[0].toFixed(1)}" cy="${marker[1].toFixed(1)}" r="5"/><text class="iso-face-text" x="${marker[0].toFixed(1)}" y="${(marker[1] + 2.5).toFixed(1)}" text-anchor="middle" font-size="6">${headerCount}H</text></g>`)
    out.push(T([packetX, 14, 19], `当前已有 ${headerCount} 个首部`, P, 7))
    out.push(T([-75, 47, 58], '发送端', P, 8), T([74, 47, 58], '接收端', P, 8))
    return out.join('')
  }, [mode, names, stage, progress])
  const current = names[stage] ?? names[0]
  return (
    <FigureCard
      fig="图 · 分层与服务接口"
      title="分层把复杂通信拆成可替换的模块"
      subtitle="可抽换协议板之间通过相邻服务接口交接；同层协议在两端逻辑通信。"
      readout={<>{mode === 'five' ? '教学五层' : mode === 'osi' ? 'OSI 七层' : 'TCP/IP 四层'} · 当前处理：{current} · 第 {stage + 1}/{names.length} 步 · 当前已有 {headerCount} 个首部</>}
      running={running}
      onToggle={() => setRunning(v => !v)}
      onReset={() => { setT(0); setRunning(false) }}
      extra={<select aria-label="协议分层模型" value={mode} onChange={e => { setMode(e.target.value as Mode); setT(0) }}><option value="five">教学五层</option><option value="osi">OSI 七层</option><option value="tcp">TCP/IP 四层</option></select>}
      legend="上：应用到物理层 · 中：两端协议板 · 下：逐层交接；亮板=当前处理层"
      caption={`${MODEL[mode].note} 图中纵向插接是相邻层的服务接口；两端同层端口间的淡线表示逻辑对等协议。示例只在传输、网络与链路/接口层增加首部；物理层把帧转换为比特，不再增加协议首部。`}>
      <Scene width={700} height={385} label="发送接收机架、可抽换协议板、同层对等端口与数据封装" svg={svg} />
    </FigureCard>
  )
}
