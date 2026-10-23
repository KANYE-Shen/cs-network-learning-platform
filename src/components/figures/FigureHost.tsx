import { Suspense } from 'react'
import '../iso/iso.css'
import { figureRegistry } from './registry'
import { BlockSkeleton } from '../layout/Skeleton'

export function FigureHost({ figureId }: { figureId: string }) {
  const Comp = figureRegistry[figureId]
  if (!Comp) {
    return (
      <div className="card p-5 text-sm muted">
        图解 <code>{figureId}</code> 尚未实现。
      </div>
    )
  }
  return (
    <Suspense fallback={<BlockSkeleton height="h-72" />}>
      <Comp />
    </Suspense>
  )
}
