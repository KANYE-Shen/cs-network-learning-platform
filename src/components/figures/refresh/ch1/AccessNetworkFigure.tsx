import { useMemo, useState } from 'react'
import * as k from '../../../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness } from '../../figureKit'
import { assembly, bed, controlKnob, projection, S, L, T, trackedKit } from './parts'

const drawKit = trackedKit(k)
const PLAN = { x: -120, y: -68, w: 240, d: 136, r: 7 }
const P = projection(PLAN, 57)
type Mode = 'dsl' | 'hfc' | 'wireless'

export default function AccessNetworkFigure({ auditMode = 'dsl', auditTime = 0 }: { auditMode?: Mode; auditTime?: number } = {}) {
  const [mode, setMode] = useState<Mode>(auditMode)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, auditTime)
  const phase = Math.floor((t % 4) / 1)
  const progress = (t % 1)
  const phaseNames = ['家庭终端发出接入请求', '数据沿接入介质上行', '局端/无线接入点收到数据', '应答沿同一接入路径下行']
  const svg = useMemo(() => {
    const out: string[] = [bed(P, PLAN)]
    const linkPath: k.Point3[] = mode === 'dsl'
      ? [[-57,-18,17],[-21,-18,17],[-15,6,17],[6,6,17],[6,31,17],[46,31,17]]
      : mode === 'hfc'
        ? [[-57,-18,18],[-23,-18,18],[-14,4,18],[80,4,18],[80,32,18],[42,32,18]]
        : [[-57,-18,17],[-32,-18,34],[5,18,40],[6,35,49],[46,31,32]]
    // Open-front home enclosure: a floor and three walls leave the mounted modem visible.
    const home: string[] = []
    home.push(S(drawKit.slabOf({ x: -105, y: -45, w: 48, d: 39, r: 3 }, 6, 2, P, 6), 'lo'))
    home.push(S(drawKit.slabOf({ x: -101, y: -42, w: 40, d: 2, r: 1 }, 8, 18, P, 4), 'mid'))
    home.push(S(drawKit.slabOf({ x: -101, y: -40, w: 2, d: 29, r: .5 }, 8, 18, P, 4), 'mid'))
    // Put the modem in the open room before drawing the front-right edge and roof.
    home.push(S(drawKit.slabOf({ x: -84, y: -27, w: 16, d: 12, r: 2 }, 8, 1.5, P, 4), 'lo'))
    home.push(S(drawKit.slabOf({ x: -84, y: -27, w: 16, d: 12, r: 2 }, 9.5, 8, P, 4, .6), 'hi'))
    home.push(S(drawKit.slabOf({ x: -63, y: -40, w: 2, d: 29, r: .5 }, 8, 18, P, 4), 'mid'))
    home.push(S(drawKit.slabOf({ x: -101, y: -42, w: 40, d: 33, r: 1 }, 26, 2, P, 4), 'lo'))
    home.push(L(k.planOutline({ x: -82, y: -25, w: 12, d: 1.2, r: .3 }, 17.5, P), 'faint'))
    home.push(T([-76, -22, 18], '调制解调器', P, 6))
    out.push(assembly('home-modem', home.join('')))
    out.push(controlKnob(-57, -19, 14, P))
    // ISP rack: an open frame and two floor-mounted network devices, rather than a solid cabinet.
    const rack: string[] = []
    rack.push(S(drawKit.slabOf({ x: 42, y: 27, w: 37, d: 29, r: 3 }, 6, 6, P, 5), 'lo'))
    rack.push(S(drawKit.slabOf({ x: 46, y: 30, w: 2, d: 21, r: .5 }, 12, 28, P, 4), 'lo'))
    rack.push(S(drawKit.slabOf({ x: 52, y: 35, w: 16, d: 12, r: 1.5 }, 12, 5, P, 4), phase === 2 ? 'hi' : 'mid'))
    rack.push(S(drawKit.slabOf({ x: 52, y: 35, w: 16, d: 12, r: 1.5 }, 17, 5, P, 4), phase === 2 ? 'mid' : 'lo'))
    rack.push(S(drawKit.slabOf({ x: 73, y: 30, w: 2, d: 21, r: .5 }, 12, 28, P, 4), 'lo'))
    rack.push(S(drawKit.slabOf({ x: 46, y: 51, w: 29, d: 2, r: .5 }, 12, 28, P, 4), 'mid'))
    rack.push(S(drawKit.slabOf({ x: 46, y: 30, w: 29, d: 23, r: 1 }, 40, 2, P, 4), 'mid'))
    rack.push(T([60, 42, 24], 'ISP', P, 7))
    // Connection plant changes with access technology: dedicated local copper pair, shared coax tree, or radio link.
    if (mode === 'dsl') {
      const node: string[] = []
      node.push(S(drawKit.slabOf({ x: -2, y: 31, w: 28, d: 21, r: 2 }, 6, 2, P, 5), 'lo'))
      node.push(S(drawKit.slabOf({ x: 1, y: 34, w: 22, d: 15, r: 1 }, 8, 11, P, 4), 'mid'))
      out.push(assembly('dsl-access-node', node.join('')))
      out.push(L(k.pathOf(linkPath.map(p => k.iso(p, P))), 'mid'))
      out.push(T([11, 46, 31], 'DSLAM', P, 7))
    } else if (mode === 'hfc') {
      // Three subscriber drops share one coax trunk from the optical node.
      for (let i = 0; i < 3; i++) {
        const x = 8 + i * 31
        const house: string[] = []
        house.push(S(drawKit.slabOf({ x, y: -48, w: 20, d: 18, r: 2 }, 6, 2, P, 5), 'lo'))
        house.push(S(drawKit.slabOf({ x: x + 2, y: -46, w: 16, d: 14, r: 1 }, 8, 17, P, 4), 'mid'))
        house.push(S(drawKit.slabOf({ x: x + 4, y: -44, w: 12, d: 10, r: 1 }, 25, 2, P, 4), 'hi'))
        out.push(assembly(`hfc-home-${i + 1}`, house.join('')))
      }
      const node: string[] = []
      node.push(S(drawKit.slabOf({ x: -3, y: 32, w: 26, d: 19, r: 2 }, 6, 2, P, 5), 'lo'))
      node.push(S(drawKit.slabOf({ x: 0, y: 35, w: 20, d: 13, r: 1 }, 8, 11, P, 4), 'hi'))
      out.push(assembly('hfc-fiber-node', node.join('')))
      out.push(L(k.pathOf(linkPath.map(p => k.iso(p, P))), 'hi'))
      for (const x of [18, 49, 80]) {
        out.push(L(k.segment([x, -30, 18], [x, 4, 18], P), 'mid'))
      }
      out.push(T([11, 50, 31], '光节点', P, 7))
    } else {
      const node: string[] = []
      node.push(S(drawKit.slabOf({ x: -4, y: 29, w: 20, d: 20, r: 2 }, 6, 2, P, 5), 'lo'))
      node.push(S(drawKit.cylinder(6, 35, 2, 8, 22, P, 12), 'hi'))
      out.push(assembly('wireless-access-point', node.join('')))
      out.push(L(k.segment([5, 35, 30], [5, 35, 40], P), 'lit'))
      for (const r of [7, 13, 19]) out.push(L(k.ring(5, 35, r, 43, P, 24), 'faint'))
      out.push(L(k.pathOf(linkPath.map(p=>k.iso(p,P))), 'hi'))
      out.push(T([5, 54, 34], '无线接入点', P, 7))
    }
    out.push(assembly('isp-rack', rack.join('')))
    // Packet marker follows the current segment so animation and displayed phase share one clock.
    const routeProgress = phase === 0 ? progress * .2 : phase === 1 ? .2 + progress * .55 : phase === 2 ? .75 + progress * .25 : progress
    const route = phase === 3 ? [...linkPath].reverse() : linkPath
    const ix = Math.min(route.length - 2, Math.floor(routeProgress * (route.length - 1)))
    const f = routeProgress * (route.length - 1) - ix
    const a = route[ix]!, b = route[ix + 1]!
    const pt = a.map((v, j) => v + (b[j]! - v) * f) as k.Point3
    const marker = k.iso(pt, P)
    out.push(`<g data-anatomy-overlay="logical-packet-marker"><circle class="iso-face-text" cx="${marker[0].toFixed(1)}" cy="${marker[1].toFixed(1)}" r="5"/><text class="iso-face-text" x="${marker[0].toFixed(1)}" y="${(marker[1] + 2.5).toFixed(1)}" text-anchor="middle" font-size="6">包</text></g>`)
    out.push(T([-78, -48, 43], '家庭', P, 7), T([61, 59, 47], '汇聚网络', P, 7))
    return out.join('')
  }, [mode, phase, progress])
  const detail = mode === 'dsl' ? 'DSL：铜双绞线在局端接 DSLAM；用户线段可为专线，但上游仍汇入共享网络。' : mode === 'hfc' ? 'HFC：光纤到光节点，之后多个家庭共享同一同轴电缆段；上行容量会竞争。' : '无线接入：终端经无线电链路到接入点/基站，再进入有线回传网。'
  return (
    <FigureCard
      fig="图 · 接入网"
      title="最后一段接入决定怎样连入 ISP"
      subtitle="在家庭、局端与运营网络之间切换接入结构。"
      readout={<>{phaseNames[phase]} · {mode.toUpperCase()} · 示例阶段 {phase + 1}/4</>}
      running={running}
      onToggle={() => setRunning(v => !v)}
      onReset={() => { setT(0); setRunning(false) }}
      extra={<select aria-label="接入技术" value={mode} onChange={e => { setMode(e.target.value as Mode); setT(0) }}><option value="dsl">DSL 铜线</option><option value="hfc">HFC 共享同轴</option><option value="wireless">无线接入</option></select>}
      legend="左：家庭终端 · 中：接入介质与分配节点 · 右：ISP；亮包=当前方向"
      caption={detail}>
      <Scene width={700} height={385} label="家庭接入设备、不同接入网及 ISP 汇聚机柜" svg={svg} />
    </FigureCard>
  )
}
