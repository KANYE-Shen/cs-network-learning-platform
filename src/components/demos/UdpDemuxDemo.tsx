import { useMemo, useState } from 'react'
import { DemoFrame, ParamSelect, PlayControls, ResultGrid, StepNote, useStepMachine } from './DemoKit'

/**
 * UDP 分用（Demultiplexing）：数据报到达接收主机后，如何找到正确的套接字。
 * - 无连接：接收方只看「目的端口号」→ 2 元组分用
 * - 有连接：接收方要看「源 IP、源端口、目的 IP、目的端口」→ 4 元组分用
 * 演示时可以真的发送数据报，观察它落到哪个套接字（或被丢弃）。
 */

type Mode = 'udp' | 'tcp'

/** 接收主机上的套接字 */
interface Sock {
  id: string
  name: string
  /** 本地端口号（= 到达数据报的目的端口） */
  port: number
  /** TCP 连接的对端 IP / 端口（UDP 模式下为空） */
  peerIP?: string
  peerPort?: number
}

/** 一个数据报 */
interface Dg {
  id: number
  srcIP: string
  srcPort: number
  dstIP: string
  dstPort: number
  payload: string
}

/** 无连接分用：接收主机按目的端口绑定的套接字 */
const UDP_SOCKETS: Sock[] = [
  { id: 'srv', name: '服务器套接字 serverSocket', port: 6428 },
  { id: 'my1', name: '客户端套接字 mySocket1', port: 5775 },
  { id: 'my2', name: '客户端套接字 mySocket2', port: 9157 },
]

/** 有连接分用：同一台服务器上，连接套接字由 4 元组唯一标识 */
const TCP_SOCKETS: Sock[] = [
  { id: 't1', name: '连接套接字（客户端 A）', port: 6428, peerIP: '10.0.0.1', peerPort: 5000 },
  { id: 't2', name: '连接套接字（客户端 B）', port: 6428, peerIP: '10.0.0.3', peerPort: 6000 },
  { id: 't3', name: '连接套接字（客户端 B）', port: 9157, peerIP: '10.0.0.3', peerPort: 6001 },
]

const DST_IP = '10.0.0.2' // 接收主机

/** 分用：找出应当接收该数据报的套接字 */
function demux(mode: Mode, dg: Dg, sockets: Sock[]): Sock | null {
  if (mode === 'udp') {
    // 无连接：只看目的端口（目的 IP 已由 IP 层送到本机）
    return sockets.find((s) => s.port === dg.dstPort) ?? null
  }
  // 有连接：必须 4 元组完全一致
  return (
    sockets.find(
      (s) =>
        s.port === dg.dstPort && s.peerIP === dg.srcIP && s.peerPort === dg.srcPort,
    ) ?? null
  )
}

export default function UdpDemuxDemo() {
  const [mode, setMode] = useState<Mode>('udp')
  const [srcIP, setSrcIP] = useState('10.0.0.1')
  const [srcPort, setSrcPort] = useState(5000)
  const [dstPort, setDstPort] = useState(6428)
  const [payload, setPayload] = useState('Hello')
  const [sent, setSent] = useState<Dg[]>([])

  const sockets = mode === 'udp' ? UDP_SOCKETS : TCP_SOCKETS

  const steps = useMemo(
    () =>
      sent.map((dg, i) => {
        const s = demux(mode, dg, sockets)
        return {
          label: `数据报 #${i + 1} 到达并被分派`,
          detail: s ? `交付给套接字 ${s.name}` : '没有匹配的套接字 → 丢弃',
        }
      }),
    [sent, mode, sockets],
  )

  const machine = useStepMachine(steps, { intervalMs: 1200 })

  // 已送达（index 之前）与在途（index 当前位置）
  const delivered = useMemo(
    () => sent.slice(0, machine.index).map((dg) => ({ dg, sock: demux(mode, dg, sockets) })),
    [sent, machine.index, mode, sockets],
  )
  const inFlight = sent[machine.index] ?? null

  const receivedBy = useMemo(() => {
    const map: Record<string, { count: number; last: string }> = {}
    for (const s of sockets) map[s.id] = { count: 0, last: '—' }
    for (const d of delivered) {
      if (!d.sock) continue
      const cur = map[d.sock.id]
      map[d.sock.id] = { count: cur.count + 1, last: d.dg.payload }
    }
    return map
  }, [delivered, sockets])

  const droppedCount = delivered.filter((d) => !d.sock).length

  const send = () => {
    const dg: Dg = {
      id: sent.length + 1,
      srcIP,
      srcPort,
      dstIP: DST_IP,
      dstPort,
      payload,
    }
    const wasAtEnd = machine.index >= sent.length
    setSent((s) => [...s, dg])
    if (wasAtEnd) machine.setPlaying(true)
  }

  const reset = () => {
    setSent([])
    machine.reset()
  }

  const dur = 1.2 / machine.speed
  const key =
    mode === 'udp'
      ? `目的 IP ${DST_IP} + 目的端口 ${dstPort}（2 元组）`
      : `源 ${srcIP}:${srcPort} → 目的 ${DST_IP}:${dstPort}（4 元组）`

  return (
    <DemoFrame
      title="UDP 分用：端口号如何找到套接字"
      description="主机收到 IP 数据报后，传输层必须把它交给正确的套接字。无连接时靠 2 元组（目的 IP + 目的端口），有连接时靠 4 元组。"
      controls={
        <PlayControls
          playing={machine.playing}
          onPlay={() => machine.setPlaying(true)}
          onPause={() => machine.setPlaying(false)}
          onReset={reset}
          onStep={machine.step}
          onStepBack={machine.stepBack}
          canStepBack
          speed={machine.speed}
          onSpeedChange={machine.setSpeed}
        />
      }
      legend={[
        { color: 'var(--brand)', label: '在途数据报' },
        { color: '#16a078', label: '已交付套接字' },
        { color: '#dc7828', label: '无匹配套接字 → 丢弃' },
      ]}
    >
      <div className="space-y-4">
        <style>{`@keyframes udpFlyX { 0% { left: 4%; } 100% { left: 96%; } }`}</style>

        {/* 模式切换 */}
        <div className="grid sm:grid-cols-2 gap-3">
          <button
            onClick={() => {
              setMode('udp')
              setSent([])
              machine.reset()
            }}
            className="btn-outline !py-2 text-left"
            style={
              mode === 'udp'
                ? { borderColor: 'var(--brand)', background: 'rgba(50,85,219,0.08)' }
                : undefined
            }
          >
            <span className="block text-sm font-semibold">UDP：2 元组分用</span>
            <span className="block text-[11px] muted mt-0.5">
              只看「目的 IP + 目的端口」。同一端口的所有数据报进入同一个套接字。
            </span>
          </button>
          <button
            onClick={() => {
              setMode('tcp')
              setSent([])
              machine.reset()
            }}
            className="btn-outline !py-2 text-left"
            style={
              mode === 'tcp'
                ? { borderColor: 'var(--brand)', background: 'rgba(50,85,219,0.08)' }
                : undefined
            }
          >
            <span className="block text-sm font-semibold">TCP：4 元组分用</span>
            <span className="block text-[11px] muted mt-0.5">
              源 IP、源端口、目的 IP、目的端口。四者都相同才算同一个连接。
            </span>
          </button>
        </div>

        {/* 发送方 */}
        <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold mb-2">发送主机 P1（应用层进程）</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <ParamSelect
              label="源 IP 地址"
              value={srcIP}
              onChange={setSrcIP}
              options={
                mode === 'udp'
                  ? [{ value: '10.0.0.1', label: '10.0.0.1（客户端 A）' }]
                  : [
                      { value: '10.0.0.1', label: '10.0.0.1（客户端 A）' },
                      { value: '10.0.0.3', label: '10.0.0.3（客户端 B）' },
                    ]
              }
            />
            <ParamSelect
              label="源端口号"
              value={String(srcPort)}
              onChange={(v) => setSrcPort(Number(v))}
              options={
                mode === 'udp'
                  ? [
                      { value: '5000', label: '5000' },
                      { value: '6000', label: '6000' },
                    ]
                  : [
                      { value: '5000', label: '5000（客户端 A）' },
                      { value: '6000', label: '6000（客户端 B）' },
                      { value: '6001', label: '6001（客户端 B）' },
                    ]
              }
            />
            <ParamSelect
              label="目的端口号"
              value={String(dstPort)}
              onChange={(v) => setDstPort(Number(v))}
              options={
                mode === 'udp'
                  ? [
                      { value: '6428', label: '6428（serverSocket）' },
                      { value: '5775', label: '5775（mySocket1）' },
                      { value: '9157', label: '9157（mySocket2）' },
                      { value: '9999', label: '9999（无人绑定）' },
                    ]
                  : [
                      { value: '6428', label: '6428' },
                      { value: '9157', label: '9157' },
                    ]
              }
            />
            <div>
              <div className="text-xs font-medium mb-1">应用数据</div>
              <div className="flex gap-2">
                <input
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  maxLength={12}
                  className="flex-1 min-w-0 px-2 py-1.5 rounded-md text-xs outline-none mono"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                />
                <button onClick={send} className="btn-primary !px-3 !text-xs whitespace-nowrap">
                  发送数据报
                </button>
              </div>
              <div className="text-[10px] muted mt-1">
                发送方必须显式指定目的 IP 与目的端口；源端口由本地套接字给出。
              </div>
            </div>
          </div>
        </div>

        {/* 链路 */}
        <div>
          <div className="text-xs muted mb-1.5">网络层（IP 数据报）→ 传输层（UDP 报文段 / TCP 报文段）</div>
          <div
            className="relative rounded-lg"
            style={{ height: 96, background: 'var(--surface-2)', border: '1px solid var(--border)' }}
          >
            {/* 两端主机 */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] mono muted">P1</div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] mono muted">P4</div>
            <div
              className="absolute left-1/2 -translate-x-1/2 bottom-1 text-[10px] muted"
              style={{ transform: 'translate(-50%, 0)' }}
            >
              不可靠信道（可能丢包/损坏）
            </div>

            {inFlight ? (
              <div
                key={inFlight.id}
                className="absolute top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-[10px] mono shadow-sm"
                style={{
                  background: 'var(--brand)',
                  color: '#fff',
                  animation: `udpFlyX ${dur}s linear`,
                  animationPlayState: machine.playing ? 'running' : 'paused',
                }}
              >
                源端口 {inFlight.srcPort} → 目的端口 {inFlight.dstPort}
                <span className="ml-1 opacity-80">“{inFlight.payload}”</span>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-xs muted">
                {sent.length === 0 ? '点击「发送数据报」开始' : '所有数据报已处理完毕'}
              </div>
            )}
          </div>
        </div>

        {/* 接收主机 */}
        <div className="rounded-lg p-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
          <div className="text-xs font-semibold mb-2">接收主机 P4 · 分用表</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {sockets.map((s) => {
              const info = receivedBy[s.id]
              const isTarget =
                inFlight !== null &&
                (mode === 'udp'
                  ? s.port === inFlight.dstPort
                  : s.port === inFlight.dstPort &&
                    s.peerIP === inFlight.srcIP &&
                    s.peerPort === inFlight.srcPort)
              return (
                <div
                  key={s.id}
                  className="rounded-lg px-3 py-2 transition-all"
                  style={{
                    background: isTarget ? 'rgba(50,85,219,0.10)' : 'var(--surface)',
                    border: `1px solid ${isTarget ? 'var(--brand)' : 'var(--border)'}`,
                  }}
                >
                  <div className="text-[11px] font-semibold truncate">{s.name}</div>
                  <div className="text-[10px] mono muted mt-0.5">
                    端口 {s.port}
                    {mode === 'tcp' && s.peerIP ? ` ← ${s.peerIP}:${s.peerPort}` : ''}
                  </div>
                  <div className="text-[11px] mt-1">
                    <span className="mono font-semibold text-brand">{info.count}</span>
                    <span className="muted"> 个数据报</span>
                    {info.last !== '—' && <span className="muted"> · 最近 “{info.last}”</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <ResultGrid
          items={[
            { label: '已发送数据报', value: `${sent.length} 个` },
            { label: '已交付套接字', value: `${delivered.length - droppedCount} 个`, highlight: true },
            { label: '被丢弃', value: `${droppedCount} 个`, hint: droppedCount > 0 ? '没有匹配的套接字' : '' },
          ]}
        />

        <StepNote
          tone={droppedCount > 0 ? 'warn' : 'info'}
          text={
            mode === 'udp'
              ? `无连接分用只看目的端口 ${dstPort}：源 IP ${srcIP}、源端口 ${srcPort} 完全不影响投递结果。${
                  droppedCount > 0
                    ? '本次目的端口无人绑定，数据报被丢弃（UDP 不返回任何错误）。'
                    : '注意：来自不同源端口的数据报会进同一个套接字。'
                }`
              : `有连接分用必须 4 元组全部匹配：${key}。同一个本地端口 6428 上可以并存多个连接套接字。`
          }
        />

        {steps.length > 0 && (
          <div>
            <div className="text-xs font-semibold mb-1.5">处理记录</div>
            <ol className="space-y-1">
              {steps.map((s, i) => (
                <li
                  key={i}
                  className="text-[11px] mono rounded px-2 py-1"
                  style={{
                    background: i < machine.index ? 'var(--surface-2)' : 'transparent',
                    color: i < machine.index ? 'var(--text-muted)' : 'var(--text)',
                    opacity: i === machine.index ? 1 : 0.75,
                  }}
                >
                  {i < machine.index ? '✓' : '•'} {s.label} —— {s.detail}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </DemoFrame>
  )
}
