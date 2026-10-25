import { createContext, Suspense, useEffect, useState } from 'react'
import '../iso/iso.css'
import { figureRegistry } from './registry'
import { BlockSkeleton } from '../layout/Skeleton'

export const FigureVisibilityContext = createContext(true)

export function FigureHost({ figureId }: { figureId: string }) {
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    if (!host) return
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return }
    const observer = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { rootMargin: '120px', threshold: 0 })
    observer.observe(host)
    return () => observer.disconnect()
  }, [host])
  const Comp = figureRegistry[figureId]
  if (!Comp) {
    return (
      <div className="card p-5 text-sm muted">
        图解 <code>{figureId}</code> 尚未实现。
      </div>
    )
  }
  return <div ref={setHost} data-in-view={inView} data-figure-id={figureId}>
    <FigureVisibilityContext.Provider value={inView}>
      <Suspense fallback={<BlockSkeleton height="h-72" />}><Comp /></Suspense>
    </FigureVisibilityContext.Provider>
  </div>
}
