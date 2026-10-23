// ============================================================
// 演示通用组件：控制条、参数面板、状态显示
// 所有交互演示共用，保证交互一致（播放/暂停/重置/单步/调速/改参数）
// ============================================================
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export function DemoFrame({
  title,
  description,
  children,
  controls,
  status,
  legend,
}: {
  title: string
  description?: string
  children: ReactNode
  controls?: ReactNode
  status?: ReactNode
  legend?: { color: string; label: string }[]
}) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3.5 border-b flex flex-wrap items-center gap-3" style={{ borderColor: 'var(--border)' }}>
        <div className="min-w-0">
          <h3 className="font-semibold text-[0.97rem] leading-tight">{title}</h3>
          {description && <p className="muted text-xs mt-0.5 leading-relaxed">{description}</p>}
        </div>
        {controls && <div className="ml-auto flex flex-wrap items-center gap-2 no-print">{controls}</div>}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
      {status && (
        <div
          className="px-5 py-3 border-t text-sm mono leading-relaxed"
          style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
        >
          {status}
        </div>
      )}
      {legend && legend.length > 0 && (
        <div
          className="px-5 py-2.5 border-t flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] muted"
          style={{ borderColor: 'var(--border)' }}
        >
          {legend.map((l) => (
            <span key={l.label} className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export function PlayControls({
  playing,
  onPlay,
  onPause,
  onReset,
  onStep,
  onStepBack,
  speed,
  onSpeedChange,
  canStepBack = false,
  disabled = false,
}: {
  playing: boolean
  onPlay: () => void
  onPause: () => void
  onReset: () => void
  onStep: () => void
  onStepBack?: () => void
  speed: number
  onSpeedChange: (s: number) => void
  canStepBack?: boolean
  disabled?: boolean
}) {
  return (
    <>
      <button onClick={onReset} disabled={disabled} className="btn-ghost !px-2.5" title="重置">
        ↺
      </button>
      {canStepBack && (
        <button onClick={onStepBack} disabled={disabled} className="btn-ghost !px-2.5" title="上一步">
          ⏮
        </button>
      )}
      <button onClick={onStep} disabled={disabled} className="btn-ghost !px-2.5" title="单步执行">
        ⏭
      </button>
      <button
        onClick={playing ? onPause : onPlay}
        disabled={disabled}
        className="btn-primary !px-3"
        title={playing ? '暂停' : '播放'}
      >
        {playing ? '⏸ 暂停' : '▶ 播放'}
      </button>
      <label className="flex items-center gap-1.5 text-xs muted ml-1">
        速度
        <select
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className="px-1.5 py-1 rounded-md text-xs outline-none"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          <option value={0.5}>0.5×</option>
          <option value={1}>1×</option>
          <option value={2}>2×</option>
          <option value={4}>4×</option>
        </select>
      </label>
    </>
  )
}

export function ParamSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  format,
  hint,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  unit?: string
  format?: (v: number) => string
  hint?: string
}) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between gap-2 mb-1">
        <span className="text-xs font-medium">{label}</span>
        <span className="text-xs mono text-brand tabular-nums">
          {format ? format(value) : value}
          {unit ? ` ${unit}` : ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[var(--brand)] cursor-pointer"
      />
      {hint && <div className="text-[10px] muted mt-0.5">{hint}</div>}
    </label>
  )
}

export function ParamSelect({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  hint?: string
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium mb-1">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 rounded-md text-xs outline-none"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <div className="text-[10px] muted mt-0.5">{hint}</div>}
    </label>
  )
}

export function ParamToggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  return (
    <label className="flex items-start gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-[var(--brand)] cursor-pointer"
      />
      <span>
        <span className="text-xs font-medium">{label}</span>
        {hint && <span className="block text-[10px] muted">{hint}</span>}
      </span>
    </label>
  )
}

/** 步骤驱动的自动播放 hook：统一播放/暂停/单步/重置/速度语义 */
export function useStepMachine<T extends { label: string; detail?: string }>(
  steps: T[],
  { loop = false, intervalMs = 1200 }: { loop?: boolean; intervalMs?: number } = {},
) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  const reset = useCallback(() => {
    setIndex(0)
    setPlaying(false)
  }, [])

  const step = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= steps.length) {
        if (loop) return 0
        setPlaying(false)
        return i
      }
      return i + 1
    })
  }, [steps.length, loop])

  const stepBack = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  useEffect(() => {
    if (!playing) {
      if (timer.current) clearInterval(timer.current)
      timer.current = null
      return
    }
    timer.current = setInterval(() => {
      setIndex((i) => {
        if (i + 1 >= steps.length) {
          if (loop) return 0
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, intervalMs / speed)
    return () => {
      if (timer.current) clearInterval(timer.current)
      timer.current = null
    }
  }, [playing, speed, steps.length, loop, intervalMs])

  return { index, setIndex, playing, setPlaying, speed, setSpeed, reset, step, stepBack, stepCount: steps.length }
}

/** 高亮当前步骤说明的组件 */
export function StepNote({ text, tone = 'info' }: { text?: string; tone?: 'info' | 'warn' | 'ok' }) {
  if (!text) return null
  const bg =
    tone === 'warn' ? 'rgba(220,120,40,0.10)' : tone === 'ok' ? 'rgba(22,160,120,0.10)' : 'rgba(50,85,219,0.07)'
  const color = tone === 'warn' ? '#dc7828' : tone === 'ok' ? '#16a078' : 'var(--brand)'
  return (
    <div className="rounded-lg px-3 py-2 text-sm leading-relaxed" style={{ background: bg }}>
      <span className="font-semibold mr-1.5" style={{ color }}>
        {tone === 'warn' ? '⚠' : tone === 'ok' ? '✓' : '▸'}
      </span>
      {text}
    </div>
  )
}

/** 数值结果展示块 */
export function ResultGrid({ items }: { items: { label: string; value: string; highlight?: boolean; hint?: string }[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-lg px-3 py-2"
          style={{
            background: it.highlight ? 'rgba(50,85,219,0.10)' : 'var(--surface-2)',
            border: `1px solid ${it.highlight ? 'var(--brand)' : 'var(--border)'}`,
          }}
        >
          <div className="text-[10px] muted mb-0.5">{it.label}</div>
          <div className="text-sm font-semibold mono tabular-nums" style={it.highlight ? { color: 'var(--brand)' } : undefined}>
            {it.value}
          </div>
          {it.hint && <div className="text-[10px] muted mt-0.5 leading-snug">{it.hint}</div>}
        </div>
      ))}
    </div>
  )
}
