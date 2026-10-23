// ============================================================
// 图解：封装与解封装（k1.5.5）
// 发送端逐层加首部，接收端逐层剥首部；PDU 名称随层次变化
// ============================================================
import { useMemo, useState } from 'react'
import * as k from '../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness, initialTime } from './figureKit'

const W = 820
const H = 300
const BENCH = { x: -170, y: -42, w: 340, d: 84, r: 6 }
const RX = 118 // 接收端位置
const P = k.fitProjection(
  [...k.boxCorners(BENCH, -8, 0), [-120, 0, 60], [150, 0, 42]],
  W,
  H,
  { pad: 14, azimuth: 34, elevation: 40 },
)

const S = (paths: k.SolidPaths, style?: k.SolidStyle) => k.solidSvg(paths, style)
const L = (d: string, style?: k.LineStyle) => k.lineSvg(d, style)
const at = (p: [number, number, number]) => k.iso(p, P)

type Layer = {
  key: string
  label: string
  x: number
  w: number
  h: number
  tone: 'hi' | 'mid' | 'lo'
}

// 最终顺序（左→右）：H2 H3 H4 H5 | data | T2
const LAYERS: Layer[] = [
  { key: 'H2', label: 'H2 链路首部', x: -62, w: 13, h: 18, tone: 'hi' },
  { key: 'H3', label: 'H3 网络首部', x: -49, w: 13, h: 17, tone: 'mid' },
  { key: 'H4', label: 'H4 传输首部', x: -36, w: 13, h: 16, tone: 'mid' },
  { key: 'H5', label: 'H5 应用首部', x: -23, w: 13, h: 15, tone: 'lo' },
  { key: 'T2', label: 'T2 尾部', x: 34, w: 8, h: 14, tone: 'hi' },
]
const DATA = { x: -10, w: 44, h: 12 }
const ORDER = ['H5', 'H4', 'H3', 'H2', 'T2']

// 阶段：0 message → 1 segment → 2 datagram → 3 frame → 4 传输 → 5..8 解封装 → 9 应用数据
const STAGES = [
  { name: '应用数据', pdu: 'message', layers: [] as string[], note: '应用程序产生数据，尚未加任何首部' },
  { name: '加 H5', pdu: 'message', layers: ['H5'], note: '应用层加上应用首部 H5' },
  { name: '加 H4', pdu: 'segment 报文段', layers: ['H5', 'H4'], note: '传输层加上 H4，成为报文段' },
  { name: '加 H3', pdu: 'datagram 数据报', layers: ['H5', 'H4', 'H3'], note: '网络层加上 H3，成为数据报' },
  { name: '加 H2 + T2', pdu: 'frame 帧', layers: ['H5', 'H4', 'H3', 'H2', 'T2'], note: '链路层加首部 H2 与尾部 T2，成为帧' },
  { name: '链路上传输', pdu: 'frame 帧（比特流）', layers: ['H5', 'H4', 'H3', 'H2', 'T2'], note: '帧被转换为比特流，经物理介质送到接收端' },
  { name: '剥去 H2/T2', pdu: 'datagram 数据报', layers: ['H5', 'H4', 'H3'], note: '接收方链路层剥去 H2 与 T2，交给网络层' },
  { name: '剥去 H3', pdu: 'segment 报文段', layers: ['H5', 'H4'], note: '网络层剥去 H3，交给传输层' },
  { name: '剥去 H4', pdu: 'message', layers: ['H5'], note: '传输层剥去 H4，交给应用层' },
  { name: '剥去 H5', pdu: '应用数据', layers: [], note: '应用层剥去 H5，把数据交给应用进程' },
]

export default function EnvelopeFigure() {
  const [running, setRunning] = useState(!prefersStillness())
  const [step, setStep] = useState(0)
  const [t, setT] = usePlayClock(running, initialTime())
  const stageIndex = Math.floor((t % 14) / 1.4) % STAGES.length
  const stage = STAGES[stageIndex]
  const receiving = stageIndex >= 6
  const baseX = stageIndex === 5 ? -40 : receiving ? RX : 0

  const svg = useMemo(() => {
    const out: string[] = []
    out.push(S(k.slabOf(BENCH, -8, 8, P, 8, 1), { tone: 'lo' }))
    out.push(L(k.planOutline(k.insetPlan(BENCH, 6), 0, P), { tone: 'faint' }))
    // 传送轨道
    out.push(L(k.lineOnTop([-140, 20], [150, 20], 0.6, P), { tone: 'faint', dashed: true }))
    for (let x = -130; x <= 150; x += 20) {
      out.push(S(k.cylinder(x, 20, 1.6, 0, 3, P, 12), { tone: 'lo' }))
    }

    const show = (key: string) => stage.layers.includes(key)
    // 数据块
    out.push(
      S(k.slabOf({ x: baseX + DATA.x, y: -DATA.w / 2, w: DATA.w, d: DATA.w, r: 1.5 }, 0, DATA.h, P, 3, 0.6), {
        tone: 'mid',
        lit: stage.layers.length === 0,
      }),
    )
    const dataLabel = at([baseX + DATA.x + DATA.w / 2, -DATA.w / 2 - 10, 4])
    out.push(`<text class="iso-face-text" data-tone="hi" x="${dataLabel[0]}" y="${dataLabel[1]}" font-size="10" text-anchor="middle">数据</text>`)

    const drop = 1 - Math.min(1, ((t % 1.4) / 1.4) * 3) // 新首部落下的动画
    for (const layer of LAYERS) {
      if (!show(layer.key)) continue
      const z = layer.key === ORDER[Math.min(ORDER.indexOf(layer.key), 4)] ? 0 : 0
      const zLift = layer.key === stage.layers[stage.layers.length - 1] ? 26 * Math.max(0, drop) : 0
      out.push(
        S(
          k.slabOf({ x: baseX + layer.x, y: -layer.w * 2, w: layer.w, d: layer.w * 4, r: 0.8 }, z + zLift, layer.h, P, 2, 0.4),
          { tone: layer.tone, lit: layer.key === 'H2' || layer.key === 'T2' },
        ),
      )
      const p = at([baseX + layer.x + layer.w / 2, -layer.w * 2 - 10, 4])
      out.push(
        `<text class="iso-face-text" data-tone="hi" x="${p[0]}" y="${p[1]}" font-size="10" text-anchor="middle">${layer.label}</text>`,
      )
    }

    // 两端主机
    for (const [x, name] of [
      [-116, '发送端'],
      [146, '接收端'],
    ] as const) {
      out.push(S(k.slabOf({ x: x - 12, y: -26, w: 24, d: 52, r: 2 }, 0, 34, P, 4, 0.8), { tone: 'mid' }))
      out.push(L(k.lineOnTop([x - 8, -18], [x + 8, -18], 34, P), { tone: 'faint' }))
      const p = at([x, -34, 40])
      out.push(`<text class="iso-face-text" data-tone="hi" x="${p[0]}" y="${p[1]}" font-size="10" text-anchor="middle">${name}</text>`)
    }
    return out.join('')
  }, [stage, step, t, baseX])

  return (
    <FigureCard
      fig="图 2 · 封装与解封装"
      title="数据每下一层，就多一个首部"
      subtitle="左端发送端逐层加首部，右端接收端逐层剥首部；色块标出当前步骤新加或刚剥去的首部。"
      readout={
        <>
          当前 PDU：{stage.pdu} · 可见首部：{stage.layers.length ? stage.layers.join(' / ') : '无'} · 步骤{' '}
          {stageIndex + 1}/{STAGES.length}
        </>
      }
      running={running}
      onToggle={() => setRunning((r) => !r)}
      onReset={() => {
        setT(0)
        setRunning(false)
      }}
      extra={
        <button
          className="btn-outline"
          onClick={() => {
            setRunning(false)
            setT((x) => {
              const cur = Math.floor((x % 14) / 1.4)
              return ((cur + 1) % STAGES.length) * 1.4 + 0.06
            })
            setStep((s) => s + 1)
          }}
        >
          单步 →
        </button>
      }
      caption={stage.note}
    >
      <Scene width={W} height={H} label="封装与解封装动画" svg={svg} />
    </FigureCard>
  )
}
