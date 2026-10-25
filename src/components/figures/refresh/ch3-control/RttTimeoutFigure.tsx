import { useMemo, useState } from 'react'
import * as k from '../../../iso/iso-kit'
import { FigureCard, Scene, usePlayClock, prefersStillness } from '../../figureKit'
import { assembly, bed, projection, S, L, T, trackedKit } from '../ch1/parts'

const drawKit = trackedKit(k)
const PLAN = { x: -120, y: -66, w: 240, d: 132, r: 7 }
const P = projection(PLAN, 61)
const samples = [40, 58, 45, 80]
type Mode = 'sample' | 'estimate' | 'timer'
function estimates() {
  let est = 50, dev = 5
  return samples.map(sample => {
    dev = .75 * dev + .25 * Math.abs(sample - est)
    est = .875 * est + .125 * sample
    return { sample, est, dev, rto: est + 4 * dev }
  })
}
const series = estimates()

export default function RttTimeoutFigure({ auditMode = 'sample', auditAckMode = 'received', auditTime = 0 }: { auditMode?: Mode; auditAckMode?: 'received' | 'lost'; auditTime?: number } = {}) {
  const [mode, setMode] = useState<Mode>(auditMode)
  const [ackMode, setAckMode] = useState<'received' | 'lost'>(auditAckMode)
  const [running, setRunning] = useState(!prefersStillness())
  const [t, setT] = usePlayClock(running, auditTime)
  const index = Math.floor((t % 8) / 2)
  const progress = (t % 2) / 2
  const current = series[index]!
  const windowMs = Math.max(current.rto, current.sample) * 1.25
  const elapsedMs = progress * (mode === 'timer' ? windowMs : current.sample)
  const ackReceived = ackMode === 'received' && elapsedMs >= current.sample
  const timedOut = mode === 'timer' && !ackReceived && elapsedMs >= current.rto
  const phase = mode === 'timer'
    ? timedOut ? 'RTO 到期且 ACK 未到，触发重传' : ackReceived ? 'ACK 在 RTO 到期前到达，停止定时器' : '等待 ACK；定时器仍在计时'
    : progress < .5 ? '探测报文前往远端' : '回显返回并形成 RTT 样本'
  const svg = useMemo(() => {
    const out: string[] = [bed(P, PLAN)]
    // Sender/receiver boxes and the clock sit directly on the same instrument bed.
    for (const x of [-96, 74]) {
      out.push(assembly(`rtt-endpoint-${x}`, [
        S(drawKit.slabOf({ x: x - 13, y: -25, w: 26, d: 30, r: 3 }, 6, 4, P, 5), 'lo'),
        S(drawKit.slabOf({ x: x - 10, y: -21, w: 20, d: 22, r: 2 }, 10, 19, P, 5), 'mid'),
        L(k.planOutline({ x: x - 7, y: -20, w: 14, d: 2, r: .6 }, 29.2, P), 'hi'),
        T([x, -19, 24], x < 0 ? '发送端' : '接收端', P, 6),
      ].join('')))
    }
    const cx = -7, cy = 8, r = 33
    out.push(S(drawKit.cylinder(cx, cy, r + 4, 6, 4, P, 56, .8), 'lo'))
    out.push(L(k.ring(cx, cy, r, 10.2, P, 56), 'hi'))
    for (let i = 0; i < 40; i++) {
      const a = i * 2 * Math.PI / 40
      const r1 = r - 3, r2 = i % 5 === 0 ? r - 10 : r - 6
      // Printed dial divisions begin on the actual bezel ring; only the engraved tip is free.
      out.push(k.lineSvg(k.segment([cx + Math.cos(a)*r, cy + Math.sin(a)*r, 10.2], [cx + Math.cos(a)*r2, cy + Math.sin(a)*r2, 10.2], P), { tone: i % 5 === 0 ? 'mid' : 'faint', free: 'end' }))
    }
    for (const a of [-Math.PI/2, 0, Math.PI/2, Math.PI]) {
      const x = cx + Math.cos(a) * (r - 15), y = cy + Math.sin(a) * (r - 15)
      out.push(L(k.ring(x, y, 1.2, 10.4, P, 10), 'lo'))
    }
    const angle = -Math.PI/2 + (mode === 'sample' ? current.sample / 100 : mode === 'estimate' ? current.est / 100 : current.rto / 300) * Math.PI * 1.5
    const tip: k.Point3 = [cx + Math.cos(angle) * (r - 10), cy + Math.sin(angle) * (r - 10), 10.5]
    out.push(k.lineSvg(k.segment([cx + Math.cos(angle) * 2, cy + Math.sin(angle) * 2, 10.6], tip, P), { tone: 'lit', free: 'end' }))
    out.push(L(k.ring(cx, cy, 2, 10.6, P, 12), 'hi'))
    // These are logical outbound and return paths, not physical conduits.
    const outPath: k.Point3[] = [[-83,-10,18],[-60,37,17],[-23,42,16],[28,42,16],[48,15,17],[61,-10,18]]
    const backPath = [...outPath].reverse()
    let path = outPath
    let u = 0
    if (mode === 'timer' && ackMode === 'lost') {
      if (timedOut) {
        path = outPath
        u = (elapsedMs - current.rto) / Math.max(1, windowMs - current.rto)
      } else {
        path = outPath
        u = Math.min(1, elapsedMs / Math.max(1, current.sample / 2))
      }
    } else if (mode === 'timer') {
      if (elapsedMs < current.sample / 2) {
        path = outPath
        u = elapsedMs / Math.max(1, current.sample / 2)
      } else if (elapsedMs < current.sample) {
        path = backPath
        u = (elapsedMs - current.sample / 2) / Math.max(1, current.sample / 2)
      } else {
        path = backPath
        u = 1
      }
    } else if (elapsedMs < current.sample / 2) {
      path = outPath
      u = elapsedMs / Math.max(1, current.sample / 2)
    } else if (elapsedMs < current.sample) {
      path = backPath
      u = (elapsedMs - current.sample / 2) / Math.max(1, current.sample / 2)
    } else {
      path = backPath
      u = 1
    }
    // Logical probe paths are drawn to the visible side ports on both endpoint boxes.
    out.push(`<g data-anatomy-overlay="logical-rtt-paths">${k.lineSvg(k.pathOf(outPath.map(p=>k.iso(p,P))), { tone: 'faint' })}${k.lineSvg(k.pathOf(backPath.map(p=>k.iso(p,P))), { tone: 'mid' })}</g>`)
    u = Math.max(0, Math.min(1, u))
    const j = Math.min(path.length - 2, Math.floor(u * (path.length - 1)))
    const f = u * (path.length - 1) - j
    const a=path[j]!,b=path[j+1]!
    const px=a[0]+(b[0]-a[0])*f, py=a[1]+(b[1]-a[1])*f, pz=a[2]+(b[2]-a[2])*f
    const token = k.iso([px, py, pz], P)
    out.push(`<g data-anatomy-overlay="logical-rtt-probe"><circle cx="${token[0].toFixed(1)}" cy="${token[1].toFixed(1)}" r="4" fill="var(--anatomy-hi)"/></g>`)
    return out.join('')
  }, [mode, ackMode, current, index, progress, elapsedMs, windowMs, timedOut])
  const heading = mode === 'sample' ? `RTT 样本 ${current.sample} ms` : mode === 'estimate' ? `EstimatedRTT ${current.est.toFixed(1)} ms` : `RTO 教学示例 ${current.rto.toFixed(1)} ms`
  const caption = mode === 'timer'
    ? `当前模型 elapsed=${elapsedMs.toFixed(1)} ms，RTO=${current.rto.toFixed(1)} ms，样本=${current.sample} ms，ACK ${ackMode === 'lost' ? '未到达' : '按样本时刻返回'}。只有 ACK 未到且 elapsed ≥ RTO 才触发重传；${ackMode === 'lost' ? '本场景到期后重发。' : '本场景样本先到，定时器被取消。'}教材常用 EstimatedRTT + 4×DevRTT 作估计；RFC 6298 还规定初始值、下界与时钟粒度处理。`
    : mode === 'estimate'
      ? '教学示例从 EstimatedRTT=50 ms、DevRTT=5 ms 开始，采用 α=1/8、β=1/4 逐样本平滑；估计同时参考历史和当前观测。'
      : 'RTT 从发送探测到收到对应回显计时，样本可波动；重传后若确认无法区分对应副本，TCP 使用 Karn 算法避免把歧义样本用于估计。'
  return (
    <FigureCard
      fig="图 · RTT 与超时"
      title="RTT 计时和超时阈值解决不同问题"
      subtitle="发送端计时盘记录探测与回显的逻辑往返时间，并把样本平滑为重传等待阈值。"
      readout={<span style={{ overflowWrap: 'anywhere' }}>{heading} · {phase}{mode === 'timer' ? ` · ${elapsedMs.toFixed(1)} ms` : ''}</span>}
      running={running}
      onToggle={() => setRunning(v => !v)}
      onReset={() => { setT(0); setRunning(false) }}
      extra={<><select aria-label="RTT观察内容" value={mode} onChange={e => { setMode(e.target.value as Mode); setT(0) }}><option value="sample">观测 RTT</option><option value="estimate">平滑估计</option><option value="timer">RTO 与超时</option></select>{mode === 'timer' && <select aria-label="ACK是否返回" value={ackMode} onChange={e => { setAckMode(e.target.value as typeof ackMode); setT(0) }}><option value="received">ACK 按样本返回</option><option value="lost">ACK 丢失</option></select>}</>}
      legend="左：发送端 · 中：落地计时盘 · 右：接收端；亮点=逻辑探测报文"
      caption={caption}>
      <Scene width={700} height={385} label="发送接收端、落地计时盘刻度、RTT指针和依据ACK/RTO触发的逻辑重传" svg={svg} />
    </FigureCard>
  )
}
