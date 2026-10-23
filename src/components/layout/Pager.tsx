import { Link } from 'react-router-dom'
import { getNavNeighbors } from '../../content/registry'

export default function Pager({ id }: { id: string }) {
  const { prev, next } = getNavNeighbors(id)
  if (!prev && !next) return null
  return (
    <nav className="no-print grid sm:grid-cols-2 gap-3 pt-2">
      {prev ? (
        <Link to={prev.path} className="card p-3.5 hover:border-brand/50 transition group">
          <div className="text-[11px] muted mb-0.5">← 上一节</div>
          <div className="text-sm font-medium group-hover:text-brand transition leading-snug">{prev.title}</div>
        </Link>
      ) : (
        <div />
      )}
      {next ? (
        <Link to={next.path} className="card p-3.5 hover:border-brand/50 transition group sm:text-right">
          <div className="text-[11px] muted mb-0.5">下一节 →</div>
          <div className="text-sm font-medium group-hover:text-brand transition leading-snug">{next.title}</div>
        </Link>
      ) : (
        <div />
      )}
    </nav>
  )
}
