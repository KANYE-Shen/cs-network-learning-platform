import { useMemo, useState } from 'react'
import * as k from '../../../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness } from '../../figureKit'
import { bed, controlKnob, projection, S, L, T, trackedKit } from './parts'

const drawKit = trackedKit(k)
const PLAN = { x: -124, y: -67, w: 248, d: 134, r: 7 }
const P = projection(PLAN, 62)
type Mode = 'customer' | 'peer' | 'upstream'

export default function IspHierarchyFigure({ auditMode = 'customer', auditTime = 0 }: { auditMode?: Mode; auditTime?: number } = {}) {
  const [mode, setMode] = useState<Mode>(auditMode)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, auditTime)
  const phase = Math.floor((t % 4) / 1)
  const svg = useMemo(() => {
    const out: string[] = [bed(P, PLAN)]
    const assembly = (name: string, children: string[]) => `<g data-anatomy-assembly="${name}">${children.join('')}</g>`
    const rack = (id: string, x: number, y: number, w: number, h: number, lit: boolean) => {
      const parts: string[] = []
      const depth = 28
      // An open-front cabinet has a plinth, two upright rails, a rear panel, and
      // two mounting shelves. Each shelf carries one visible network appliance.
      parts.push(S(drawKit.slabOf({ x, y, w, d: depth, r: 2 }, 6, 4, P, 5), 'lo'))
      parts.push(S(drawKit.slabOf({ x: x + 1, y: y + 3, w: 2, d: depth - 6, r: .5 }, 10, h + 1, P, 3), 'lo'))
      parts.push(S(drawKit.slabOf({ x: x + 3, y: y + 2, w: w - 6, d: 1, r: .4 }, 10, h + 1, P, 3), 'mid'))
      for (const [tier, z] of [11, 21].entries()) {
        const unitTop = z + 1
        parts.push(S(drawKit.slabOf({ x: x + 3, y: y + 6, w: w - 6, d: 17, r: .5 }, z, 1, P, 3), 'lo'))
        parts.push(S(drawKit.slabOf({ x: x + 7, y: y + 8, w: w - 14, d: 10, r: 1 }, unitTop, 4, P, 4), lit && phase === tier ? 'hi' : 'mid'))
        for (let n = 0; n < 4; n++) {
          const ledX = x + 11 + n * (w - 26) / 4
          parts.push(L(k.segment([ledX, y + 8, unitTop + 4.1], [ledX + 1.4, y + 8, unitTop + 4.1], P), lit && phase === tier && n === phase ? 'lit' : 'faint'))
        }
      }
      // The near-side upright is drawn last so it naturally covers the shelf ends;
      // the open top keeps the mounted appliances visible from the camera.
      parts.push(S(drawKit.slabOf({ x: x + w - 3, y: y + 3, w: 2, d: depth - 6, r: .5 }, 10, h + 1, P, 3), 'lo'))
      out.push(assembly(id, parts))
    }
    // Several non-tree peering links make the ISP structure visibly meshed, not a strict hierarchy.
    rack('access-isp-cabinet', -105, -43, 47, 34, mode === 'customer')
    rack('regional-isp-cabinet', -42, -11, 55, 45, phase === 1)
    rack('backbone-isp-cabinet', 29, -44, 52, 40, mode === 'upstream')
    rack('peer-isp-cabinet', 62, 16, 43, 30, false)
    rack('exchange-isp-cabinet', -18, 20, 43, 28, false)
    // End links on the mounted appliances, rather than on empty cabinet edges.
    const access: k.Point3 = [-81,-30,14], region: k.Point3 = [-17,2,24], exchange: k.Point3 = [3,33,24], backbone: k.Point3 = [55,-31,24], peer: k.Point3 = [83,29,24]
    const links: [k.Point3,k.Point3,string][] = [
      [access,region,'mid'], [region,backbone,'mid'], [region,exchange,'hi'],
      [exchange,backbone,'hi'], [backbone,peer,'lit'],
    ]
    for (const [a,b,tone] of links) out.push(L(k.pathOf([a,b].map(p => k.iso(p,P))), tone as k.LineStyle['tone']))
    // Customer access modem and two household terminals.
    for (const [x,y] of [[-102,20],[-67,36]] as const) {
      out.push(S(drawKit.slabOf({ x, y, w: 20, d: 14, r: 2 }, 6, 12, P, 4), 'mid'))
      out.push(S(drawKit.slabOf({ x: x + 3, y: y + 2, w: 14, d: 8, r: .5 }, 18, 1, P, 4), 'hi'))
      out.push(controlKnob(x + 10, y, 19, P))
    }
    const route = mode === 'customer' ? [access,region,exchange,backbone,peer] : mode === 'peer' ? [backbone,peer] : [access,region,backbone]
    const along = Math.min(route.length - 1e-6, (t % 4) / 4 * (route.length - 1))
    const index = Math.floor(along), fraction = along - index
    const from = route[index]!, to = route[index + 1]!
    const point = from.map((value,j) => value + (to[j]! - value) * fraction) as k.Point3
    out.push(L(k.planOutline({ x: point[0] - 2.5, y: point[1] - 2, w: 5, d: 4, r: 1 }, point[2] + 2, P), 'lit'))
    out.push(T([-81,-49,48], '接入 ISP', P, 7), T([-15,-53,60], '区域 ISP', P, 7), T([54,-54,55], '骨干网', P, 7))
    return out.join('')
  }, [mode, phase, t])
  const stage = mode === 'peer' ? '沿骨干 ISP 与对等网络间的直连传送' : mode === 'upstream' ? ['用户流量进入接入 ISP', '区域 ISP 转送到骨干', '沿上游链路转送', '目标网络接收'][phase] : ['用户流量进入接入 ISP', '区域 ISP 按互联关系转送', '沿骨干网络转送', '目标网络接收'][phase]
  const caption = mode === 'customer' ? '接入 ISP 聚合用户流量，再通过对等互联或上游连接到其他网络。' : mode === 'peer' ? '图中只显示骨干 ISP 与对等网络之间的直连；对等互联让双方交换流量，不展示路径计算。' : '图中展示接入 ISP 经区域网络连接骨干和上游；“层次”是常见组织模型，不代表绝对树形。'
  return <FigureCard fig="图 · ISP 的互联结构" title="ISP 通过对等与上游连接成网" subtitle="机柜和跳接端口组成多路径网络；层次描述常见组织关系，互联边仍可横向相连。" readout={<>{stage} · 可见路由域 5 · 阶段 {phase + 1}/4</>} running={running} onToggle={() => setRunning(v => !v)} onReset={() => { setT(0); setRunning(false) }} extra={<select aria-label="观察 ISP 关系" value={mode} onChange={e => { setMode(e.target.value as Mode); setT(0) }}><option value="customer">用户到 ISP</option><option value="peer">对等互联</option><option value="upstream">上游连接</option></select>} legend="左：接入 ISP · 中：区域/骨干 ISP · 右：对等或上游；亮线=当前路径" caption={caption}><Scene width={700} height={385} label="接入、区域、骨干 ISP 机柜及对等互联和上游链路" svg={svg}/></FigureCard>
}
