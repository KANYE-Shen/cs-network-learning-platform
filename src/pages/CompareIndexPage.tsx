import { Link } from 'react-router-dom'
import { comparisons } from '../content/registry'
import { chapterById } from '../content/registry'

export default function CompareIndexPage() {
  return (
    <div className="space-y-5">
      <header className="card p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">相近知识点比较</h1>
        <p className="muted text-sm mt-1.5 max-w-3xl leading-relaxed">
          把最容易混淆的协议与机制放在一起逐维度对比，并附上核心目的、机制、特点、区别、使用场景与常见考点。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {comparisons.map((c) => (
          <Link key={c.id} to={`/compare/${c.id}`} className="card p-5 hover:border-brand/50 transition group">
            <h3 className="font-semibold leading-snug group-hover:text-brand transition mb-2">{c.title}</h3>
            {c.intro && <p className="text-[0.88rem] muted leading-relaxed mb-3">{c.intro}</p>}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {c.tags.map((t) => (
                <span key={t} className="chip text-[10px]">{t}</span>
              ))}
            </div>
            <div className="text-[11px] muted">
              对比对象：{c.subjects.join(' vs ')}
            </div>
            <div className="text-[11px] muted mt-1">
              来自 {c.chapterIds.map((id) => chapterById.get(id)?.title ?? id).join('、')}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
