import { Link, useParams } from 'react-router-dom'
import { comparisonById, knowledgeById } from '../content/registry'
import { ContentRenderer } from '../components/content/ContentRenderer'
import Breadcrumb from '../components/layout/Breadcrumb'

export default function ComparePage() {
  const { compareId = '' } = useParams()
  const c = comparisonById.get(compareId)

  if (!c) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm muted">未找到该对比表。</p>
        <Link to="/compare" className="btn-primary mt-4 inline-flex">返回对比列表</Link>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: '知识对比', to: '/compare' }, { label: c.title }]} />

      <header className="card p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">{c.title}</h1>
        {c.intro && <p className="muted text-sm mt-2 leading-relaxed max-w-3xl">{c.intro}</p>}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {c.tags.map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
      </header>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--surface-2)' }}>
              <th className="px-4 py-3 text-left font-semibold whitespace-nowrap w-28">对比维度</th>
              {c.subjects.map((s) => (
                <th key={s} className="px-4 py-3 text-left font-semibold">{s}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {c.rows.map((row, ri) => (
              <tr key={ri} className="border-t align-top" style={{ borderColor: 'var(--border)' }}>
                <td className="px-4 py-3 font-medium whitespace-nowrap">{c.dimensions[ri]}</td>
                {row.map((cell, ci) => (
                  <td key={ci} className="px-4 py-3 leading-relaxed">
                    <ContentRenderer blocks={[{ type: 'p', text: cell }]} />
                  </td>
                ))}
              </tr>
            ))}
            {c.summary && c.summary.length > 0 && (
              <tr className="border-t" style={{ borderColor: 'var(--border)', background: 'rgba(50,85,219,0.05)' }}>
                <td className="px-4 py-3 font-semibold">一句话总结</td>
                {c.subjects.map((s, ci) => (
                  <td key={s} className="px-4 py-3 leading-relaxed font-medium">
                    {c.summary![ci] ?? ''}
                  </td>
                ))}
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {c.examNotes && c.examNotes.length > 0 && (
        <section className="card p-5">
          <h2 className="text-sm font-semibold muted uppercase tracking-wider mb-2">常见考点</h2>
          <ul className="space-y-1.5">
            {c.examNotes.map((n, i) => (
              <li key={i} className="text-[0.93rem] leading-relaxed flex gap-2">
                <span className="text-brand shrink-0">•</span>
                <ContentRenderer blocks={[{ type: 'p', text: n }]} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {c.relatedKnowledge && c.relatedKnowledge.length > 0 && (
        <section className="card p-5">
          <h2 className="text-sm font-semibold muted uppercase tracking-wider mb-2.5">相关知识点</h2>
          <div className="flex flex-wrap gap-2">
            {c.relatedKnowledge.map((id) => {
              const k = knowledgeById.get(id)
              if (!k) return null
              return (
                <Link key={id} to={`/chapter/${k.chapterId}/${k.id}`} className="chip hover:text-brand transition">
                  → {k.title}
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
