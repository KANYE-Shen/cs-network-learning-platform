import { useState } from 'react'
import { DemoFrame, ParamSlider, ParamToggle, ResultGrid, StepNote } from './DemoKit'

/**
 * 电路交换：链路资源被划分为多个"电路"。
 * 演示 FDM（按频率切）与 TDM（按时隙切），对比空闲时隙不共享的特点。
 */
export default function CircuitSwitchDemo() {
  const [mode, setMode] = useState<'fdm' | 'tdm'>('fdm')
  const [numCircuits, setNumCircuits] = useState(4)
  const [active, setActive] = useState<Record<number, boolean>>({ 0: true, 1: true, 2: false, 3: false })
  const [frames, setFrames] = useState(0)

  const circuits = Array.from({ length: numCircuits }, (_, i) => i)
  const activeCount = circuits.filter((c) => active[c]).length
  const utilization = numCircuits ? (activeCount / numCircuits) * 100 : 0

  const toggleCall = (i: number) => {
    setActive((a) => ({ ...a, [i]: !a[i] }))
  }

  return (
    <DemoFrame
      title="电路交换：链路资源如何被“切块”"
      description="电路交换把链路带宽预先划分成若干条“电路”，每条通话独占其一。空闲的电路不能被别人使用——这是它与分组交换最本质的差别。"
      controls={
        <>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as 'fdm' | 'tdm')}
            className="px-2 py-1 rounded-md text-xs outline-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <option value="fdm">FDM 频分复用</option>
            <option value="tdm">TDM 时分复用</option>
          </select>
          <button onClick={() => setFrames((f) => f + 1)} className="btn-ghost !px-2.5">
            推进一步时间
          </button>
          <button onClick={() => setFrames(0)} className="btn-ghost !px-2.5">
            ↺
          </button>
        </>
      }
      legend={[
        { color: '#4873e8', label: '正在使用的电路' },
        { color: '#c8ced8', label: '空闲电路（不可共享）' },
      ]}
    >
      <div className="space-y-4">
        <div className="grid sm:grid-cols-[1fr_180px] gap-4 items-end">
          <ParamSlider
            label="链路上的电路数"
            value={numCircuits}
            onChange={(v) => {
              setNumCircuits(v)
              setActive((a) => {
                const next: Record<number, boolean> = {}
                for (let i = 0; i < v; i++) next[i] = a[i] ?? false
                return next
              })
            }}
            min={2}
            max={8}
            unit="条"
          />
          <ParamToggle
            label="所有电路都占用"
            value={activeCount === numCircuits}
            onChange={(v) => {
              const next: Record<number, boolean> = {}
              for (let i = 0; i < numCircuits; i++) next[i] = v
              setActive(next)
            }}
          />
        </div>

        {/* 链路示意 */}
        <div>
          <div className="text-xs muted mb-1.5">
            {mode === 'fdm' ? '频谱' : '时间轴'} · 帧 {frames}
          </div>
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
            {mode === 'fdm' ? (
              <div className="flex" style={{ height: 130 }}>
                {circuits.map((i) => {
                  const on = active[i]
                  const isCarrier = frames % 2 === 0
                  return (
                    <button
                      key={i}
                      onClick={() => toggleCall(i)}
                      className="flex-1 relative flex items-center justify-center transition-all"
                      style={{
                        background: on
                          ? isCarrier
                            ? 'rgba(72,115,232,0.85)'
                            : 'rgba(72,115,232,0.55)'
                          : 'rgba(200,206,216,0.35)',
                        borderRight: i < numCircuits - 1 ? '1px solid var(--surface)' : 'none',
                      }}
                      title={on ? `电路 ${i}：通话中，点击挂断` : `电路 ${i}：空闲，点击接入`}
                    >
                      <div className="text-center px-1">
                        <div className="text-[10px] font-semibold" style={{ color: on ? '#fff' : 'var(--text-muted)' }}>
                          {on ? '通话中' : '空闲'}
                        </div>
                        {mode === 'fdm' && (
                          <div className="text-[9px] mono opacity-80" style={{ color: on ? '#fff' : 'var(--text-muted)' }}>
                            {on && isCarrier ? 'f=1' : 'f=0'}
                          </div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div className="p-3">
                <div className="flex gap-1 mb-1.5">
                  {circuits.map((i) => (
                    <div key={i} className="flex-1 text-center text-[10px] muted">电路{i}</div>
                  ))}
                </div>
                <div className="space-y-1">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="flex gap-1">
                      {circuits.map((i) => {
                        const slotTurn = (frames + row) % numCircuits === i
                        const on = active[i] && slotTurn
                        return (
                          <button
                            key={i}
                            onClick={() => toggleCall(i)}
                            className="flex-1 h-8 rounded transition-all"
                            style={{
                              background: on ? 'rgba(72,115,232,0.85)' : 'rgba(200,206,216,0.3)',
                            }}
                            title={on ? `${i} 号电路在本时隙传送数据` : '本时隙空闲'}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] muted mt-1.5 text-center">
                  每行是一个时隙帧；每条电路在自己的时隙独占传输
                </div>
              </div>
            )}
          </div>
        </div>

        <ResultGrid
          items={[
            { label: '电路总数', value: `${numCircuits} 条` },
            { label: '正在使用', value: `${activeCount} 条`, highlight: true },
            { label: '带宽利用率', value: `${utilization.toFixed(0)}%`, hint: '空闲电路不共享' },
          ]}
        />

        <StepNote
          tone={utilization < 100 ? 'warn' : 'ok'}
          text={
            utilization < 100
              ? `当前有 ${numCircuits - activeCount} 条电路空闲。电路交换下这些带宽无法被其他用户使用——即使有用户想发起通话也用不上。`
              : '所有电路都被占用。新用户想通话只能等待，无法抢占已有通话的资源。'
          }
        />
      </div>
    </DemoFrame>
  )
}
