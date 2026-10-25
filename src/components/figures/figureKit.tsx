// ============================================================
// 图解公共组件：主题适配、等距 SVG 容器、播放控制与读数
// 基于 anatomy kit（src/components/iso）的投影与实体渲染
// ============================================================
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { FigureVisibilityContext } from './FigureHost'

/** 跟随站点 <html class="dark"> 的浅/深主题 */
export function useIsoTheme(): 'light' | 'dark' {
  const read = () =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light'
  const [theme, setTheme] = useState<'light' | 'dark'>(read)
  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setTheme(read()))
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    setTheme(read())
    return () => observer.disconnect()
  }, [])
  return theme
}

/** 是否偏好减少动态效果 */
export function prefersStillness(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function usePageVisible(): boolean {
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || document.visibilityState !== 'hidden')
  useEffect(() => {
    const onVisibility = () => setPageVisible(document.visibilityState !== 'hidden')
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])
  return pageVisible
}

/** 等距 SVG 容器（iso.css 依赖 .iso 包裹层） */
export function Scene({
  width,
  height,
  label,
  svg,
}: {
  width: number
  height: number
  label: string
  svg: string
}) {
  const theme = useIsoTheme()
  return (
    <div
      className="iso"
      data-theme={theme}
      style={
        {
          background: 'var(--surface-2)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '2px 2px',
          '--anatomy-weight': '1.15px',
        } as React.CSSProperties
      }
    >
      <svg
        className="iso-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={label}
        focusable="false"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    </div>
  )
}

/** 图解卡片：标题、读数、播放控制、图注 */
export function FigureCard({
  fig,
  title,
  subtitle,
  readout,
  running,
  onToggle,
  onReset,
  extra,
  legend,
  caption,
  children,
}: {
  fig: string
  title: string
  subtitle?: string
  readout: ReactNode
  running: boolean
  onToggle: () => void
  onReset?: () => void
  extra?: ReactNode
  legend?: ReactNode
  caption?: ReactNode
  children: ReactNode
}) {
  const [reducedMotion, setReducedMotion] = useState(prefersStillness)
  const previousReducedMotion = useRef(reducedMotion)
  const inView = useContext(FigureVisibilityContext)
  const pageVisible = usePageVisible()
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(query.matches)
    query.addEventListener?.('change', update)
    return () => query.removeEventListener?.('change', update)
  }, [])
  useEffect(() => {
    if (reducedMotion && !previousReducedMotion.current && running) onToggle()
    previousReducedMotion.current = reducedMotion
  }, [reducedMotion])
  return (
    <figure className="card overflow-hidden figure-card" data-playing={running && inView && pageVisible}>
      <header className="px-4 sm:px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-wider muted mb-1">{fig}</div>
            <h3 className="font-semibold leading-snug">{title}</h3>
            {subtitle && <p className="text-xs muted mt-0.5 leading-relaxed">{subtitle}</p>}
          </div>
          <div className="figure-controls flex items-center gap-2 shrink-0">
            {extra}
            <button onClick={onToggle} className="btn-ghost" aria-pressed={running}>
              {running ? '❚❚ 暂停' : '▶ 播放'}
            </button>
            {onReset && (
              <button onClick={onReset} className="btn-outline" title="重置动画" aria-label="重置动画">
                ↺
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="px-3 sm:px-5 py-4">
        {children}
        {legend && <div className="figure-legend">{legend}</div>}
      </div>

      <div
        className="px-4 sm:px-5 py-3 border-t flex flex-wrap items-center gap-x-5 gap-y-2 text-xs"
        style={{ borderColor: 'var(--border)', background: 'var(--surface-2)' }}
      >
        <div className="font-mono tabular-nums" style={{ color: 'var(--text)' }}>
          {readout}
        </div>
        {caption && <div className="muted flex-1 min-w-[200px] leading-relaxed">{caption}</div>}
      </div>
    </figure>
  )
}

/** 调试用：?t=秒 指定动画初始时间，便于截图核对中间步骤 */
export function initialTime(fallback = 0): number {
  if (typeof window === 'undefined') return fallback
  const raw = new URLSearchParams(window.location.search).get('t')
  const value = raw === null ? NaN : Number(raw)
  return Number.isFinite(value) ? value : fallback
}

/** 纯函数动画时钟：running 时按 30fps 推进 t（秒） */
export function usePlayClock(
  running: boolean,
  initial = 0,
): [number, (updater: number | ((t: number) => number)) => void] {
  const [t, setT] = useState(initial)
  const inView = useContext(FigureVisibilityContext)
  const pageVisible = usePageVisible()
  useEffect(() => {
    if (!running || !inView || !pageVisible) return
    let raf = 0
    let last = 0
    let elapsed = 0
    const step = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.25) : 0
      last = now
      elapsed += dt
      if (elapsed >= 1 / 30) {
        setT((x) => x + elapsed)
        elapsed = 0
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [running, inView, pageVisible])
  return [t, setT]
}
