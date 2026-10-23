import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/studyDB'
import { chapters, coverageStats } from '../content/registry'
import Breadcrumb from '../components/layout/Breadcrumb'

export default function ProgressPage() {
  const cov = coverageStats()

  const readSet = useLiveQuery(
    async () => new Set((await db.progress.toArray()).filter((p) => p.read).map((p) => p.knowledgeId)),
    [],
  )

  const perChapter = chapters.map((ch) => {
    const sections = ch.sections.map((sec) => {
      const pts = sec.subsections.flatMap((s) => s.knowledge)
      const read = readSet ? pts.filter((p) => readSet.has(p.id)).length : 0
      return { id: sec.id, title: sec.title, total: pts.length, read }
    })
    return {
      chapterId: ch.id,
      title: ch.title,
      total: sections.reduce((n, s) => n + s.total, 0),
      read: sections.reduce((n, s) => n + s.read, 0),
      sections,
    }
  })

  const grandTotal = perChapter.reduce((n, c) => n + c.total, 0)
  const grandRead = perChapter.reduce((n, c) => n + c.read, 0)

  return (
    <div className="space-y-5">
      <Breadcrumb items={[{ label: '学习进度' }]} />

      <header className="card p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">学习进度</h1>
        <p className="muted text-sm mt-1.5 max-w-3xl leading-relaxed">
          进度依据「标记为已学完」记录，跨刷新保存在本机浏览器中，不随课程内容更新而丢失。
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${grandTotal ? (grandRead / grandTotal) * 100 : 0}%`, background: 'var(--brand)' }}
            />
          </div>
          <span className="text-sm mono tabular-nums shrink-0">
            {grandRead} / {grandTotal}
          </span>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {perChapter.map((c) => {
          const pct = c.total ? (c.read / c.total) * 100 : 0
          return (
            <div key={c.chapterId} className="card p-5">
              <div className="flex items-center justify-between mb-2 gap-2">
                <Link to={`/chapter/${c.chapterId}`} className="font-semibold hover:text-brand transition truncate">
                  {c.title}
                </Link>
                <span className="text-sm mono tabular-nums muted shrink-0">
                  {c.read}/{c.total}
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: 'var(--brand)' }}
                />
              </div>
              <div className="text-[11px] muted mt-2">{pct.toFixed(0)}% 已学完</div>
              <div className="mt-3 space-y-0.5">
                {c.sections.map((s) => (
                  <Link
                    key={s.id}
                    to={`/chapter/${c.chapterId}`}
                    className="flex items-center justify-between text-[11px] px-1 py-0.5 rounded hover:bg-[var(--surface-2)] transition"
                  >
                    <span className="truncate muted">{s.title}</span>
                    <span className="tabular-nums shrink-0">
                      {s.read}/{s.total}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="text-base font-semibold mb-3">内容覆盖情况</h2>
        <p className="text-sm muted mb-3">
          大纲共定义 {cov.total} 个知识点，已实现 {cov.implemented} 个（
          {Math.round((cov.implemented / cov.total) * 100)}%）。
          {cov.missing.length > 0 && ` 还有 ${cov.missing.length} 个待补充：`}
        </p>
        {cov.missing.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {cov.missing.map((m) => (
              <li key={m.id} className="flex items-center gap-2">
                <span className="chip text-[10px]">{m.id}</span>
                <span className="muted">{m.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">✓ 大纲知识点已全部实现。</p>
        )}
      </section>
    </div>
  )
}
