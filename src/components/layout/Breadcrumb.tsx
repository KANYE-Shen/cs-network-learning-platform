import { Link } from 'react-router-dom'

export default function Breadcrumb({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs muted flex-wrap">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="opacity-50">/</span>}
          {it.to ? (
            <Link to={it.to} className="hover:text-brand transition">
              {it.label}
            </Link>
          ) : (
            <span className="text-[var(--text)] font-medium">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
