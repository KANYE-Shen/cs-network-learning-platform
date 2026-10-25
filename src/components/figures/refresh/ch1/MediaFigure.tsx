import { useMemo, useState } from 'react'
import * as k from '../../../iso/iso-kit'
import { trackedKit } from './parts'
import { FigureCard, Scene, usePlayClock, prefersStillness } from '../../figureKit'
import { assembly, axialShell, bed, helicalWireSections, projection, S, L, T } from './parts'

const drawKit = trackedKit(k)
const PLAN = { x: -116, y: -64, w: 232, d: 128, r: 7 }
const P = projection(PLAN, 54)
type Mode = 'twisted' | 'coax' | 'fiber' | 'radio'

export default function MediaFigure({ auditMode = 'twisted', auditTime = 0 }: { auditMode?: Mode; auditTime?: number } = {}) {
  const [mode, setMode] = useState<Mode>(auditMode)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, auditTime)
  const phase = Math.floor((t % 4) / 1)
  const progress = t % 1
  const svg = useMemo(() => {
    const out: string[] = [bed(P, PLAN)]
    // Cutaway media are shown as separately supported samples so the radial structure is visible
    // without pretending that concentric layers occupy the same physical volume.
    if (mode === 'twisted') {
      const yy = 0, x0 = -84, x1 = 84, orbit = 5, cz = 27
      // Each insulated conductor is a real swept helix. Stanchions sit under its actual
      // low points; the exposed sample ends remain deliberately free.
      const pairParts: { svg: string; center: k.Point3; kind: 'support' | 'conductor' }[] = []
      for (const [index, phase] of [0, Math.PI].entries()) {
        const owner = `twisted-conductor-${index}`
        const turns = 3
        const lowPoints = Array.from({ length: turns }, (_, n) => {
          const angle = Math.PI * 1.5 - phase + Math.PI * 2 * n
          const u = (angle / (Math.PI * 2 * turns) + 1) % 1
          return x0 + u * (x1 - x0)
        }).filter((x) => x > x0 + 2 && x < x1 - 2)
        for (const x of lowPoints) {
          const svg = S(drawKit.cylinder(x, yy, 1.3, 6, cz - orbit - 2.3 - 6, P, 12), 'lo').replace('data-anatomy-part=', `data-anatomy-owner="${owner}" data-anatomy-part=`)
          pairParts.push({ svg, center: [x, yy, (6 + cz - orbit - 2.3) / 2], kind: 'support' })
        }
        pairParts.push(...helicalWireSections(x0, x1, yy, cz, orbit, turns, phase, 2.3, P, 8, owner, index === 0 ? 'blue' : 'red').map((part) => ({ ...part, kind: 'conductor' as const })))
      }
      out.push(assembly('twisted-pair-specimen', pairParts.sort((a, b) => Number(a.kind === 'conductor') - Number(b.kind === 'conductor') || k.depthOf(a.center, P) - k.depthOf(b.center, P)).map((part) => part.svg).join('')))
    } else if (mode === 'coax' || mode === 'fiber') {
      const coax = mode === 'coax'
      const layers = coax
        ? [
            { label: '护套', outer: 9, inner: 7.4, tone: 'lo' as const },
            { label: '外导体', outer: 6.2, inner: 5.1, tone: 'mid' as const },
            { label: '介质层', outer: 4.2, inner: 3.1, tone: 'hi' as const },
            { label: '中心导体', outer: 2.2, inner: 0, tone: 'mid' as const },
          ]
        : [
            { label: '护套', outer: 8.4, inner: 6.8, tone: 'lo' as const },
            { label: '涂覆层', outer: 5.8, inner: 4.6, tone: 'mid' as const },
            { label: '包层', outer: 3.8, inner: 2.1, tone: 'hi' as const },
            { label: '纤芯', outer: 1.3, inner: 0, tone: 'mid' as const },
          ]
      layers.forEach((layer, index) => {
        const y = 42 - index * 28, z = 20, x0 = -42, x1 = 42
        const postHeight = z - layer.outer - 6
        const posts = [-20, 20].map((x) => S(drawKit.cylinder(x, y, 1.25, 6, postHeight, P, 12), 'lo')).join('')
        const shell = axialShell(x0, x1, y, z, layer.outer, layer.inner, P, layer.tone)
        out.push(assembly(`${mode}-sample-layer-${index}`, `${posts}${shell}${T([0, y, z + layer.outer + 3], layer.label, P, 7)}`))
      })
      out.push(T([0, -59, 45], '拆件展示 · 由外向内排列（非同比例）', P, 7))
    } else {
      for (const [i, x] of [-42, 42].entries()) {
        out.push(assembly(`radio-endpoint-${i}`, [
          S(drawKit.slabOf({ x: x - 10, y: -8, w: 20, d: 20, r: 3 }, 6, 4, P, 5), 'lo'),
          S(drawKit.cylinder(x, 2, 2.4, 10, 23, P, 16), 'mid'),
          S(drawKit.cylinder(x, 2, 1.5, 33, 2, P, 12), 'hi'),
          T([x, 17, 22], i === 0 ? '发送天线' : '接收天线', P, 6),
        ].join('')))
      }
      const waveX = -42 + progress * 84
      for (const r of [8, 15, 22]) {
        const ring = Array.from({ length: 33 }, (_,i) => {
          const a = 2 * Math.PI * i / 32
          return k.iso([waveX, r * Math.cos(a), 36 + r * Math.sin(a)], P)
        })
        out.push(L(k.pathOf(ring, true), 'faint'))
      }
      out.push(T([0, 27, 39], '自由空间传播', P, 8))
    }
    if (mode !== 'radio') {
      const signalY = mode === 'fiber' ? -42 : mode === 'coax' ? -14 : 0
      const marker = mode === 'twisted'
        ? k.iso([-80 + progress * 160, signalY, 27], P)
        : k.iso([-38 + progress * 76, signalY, 20], P)
      out.push(`<g data-anatomy-overlay="media-signal"><circle cx="${marker[0].toFixed(1)}" cy="${marker[1].toFixed(1)}" r="4" fill="var(--anatomy-hi)"/></g>`)
    }
    return out.join('')
  }, [mode, phase, progress])
  const detail = mode === 'twisted' ? '双绞线由两根绝缘导体按相反相位交替绞合，可减弱外界干扰与串扰；亮点沿导体轴向移动，仅作传播示意。两端是样品自由切口，尺寸非比例。' : mode === 'coax' ? '同轴电缆：中心导体、绝缘介质、外导体与护套由内向外排列，外导体提供屏蔽。此处拆件陈列、非同比例，亮点示意电磁能量主要沿内外导体间的介质传播，不代表多条并行链路。' : mode === 'fiber' ? '光纤：纤芯导光，包层提供折射率边界；高容量、低损耗且不受电磁干扰。此处将护套、涂覆层、包层与纤芯拆件陈列、非同比例，亮点位于纤芯样品。' : '无线电介质：左侧发送天线向右侧接收天线传播电磁波；共享频谱、传播环境与距离会影响链路。传播速度描述到达快慢，不代表链路吞吐量。'
  const legend = mode === 'radio' ? '左：发送天线 · 右：接收天线；扩散波纹表示无线传播' : mode === 'twisted' ? '蓝/红：两根实体绝缘导体相绞；亮点沿双绞线轴向传播' : '拆件样品由支柱托住，按外到内排列；亮点表示介质中的信号'
  const rate = mode === 'fiber' ? '光信号' : mode === 'radio' ? '无线电波' : '电信号'
  return (
    <FigureCard
      fig="图 · 物理介质"
      title="介质改变信号怎样穿过链路"
      subtitle="切换查看双绞线、同轴、光纤样品与无线链路。"
      readout={<>{rate}沿介质前进 · 观察位置 {Math.round(progress * 100)}% · 阶段 {phase + 1}/4</>}
      running={running}
      onToggle={() => setRunning(v => !v)}
      onReset={() => { setT(0); setRunning(false) }}
      extra={<select aria-label="传输介质" value={mode} onChange={e => { setMode(e.target.value as Mode); setT(0) }}><option value="twisted">双绞线</option><option value="coax">同轴电缆</option><option value="fiber">光纤</option><option value="radio">无线电</option></select>}
      legend={legend}
      caption={detail}>
      <Scene width={700} height={385} label="双绞导体、同轴与光纤拆件样品及无线发送接收天线和传播路径" svg={svg} />
    </FigureCard>
  )
}
