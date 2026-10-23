import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/studyDB'
import { chapters, coverageStats } from '../content/registry'
import { CONTENT_VERSION } from '../content/registry'

export default function HomePage() {
  const stats = useLiveQuery(async () => {
    const [mistakes, favorites, progress, recent] = await Promise.all([
      db.mistakes.count(),
      db.favorites.count(),
      db.progress.toArray(),
      db.recent.orderBy('at').reverse().limit(6).toArray(),
    ])
    const totalKnowledge = chapters.reduce(
      (n, c) => n + c.sections.reduce((m, s) => m + s.subsections.reduce((k, sub) => k + sub.knowledge.length, 0), 0),
      0,
    )
    return {
      mistakes,
      favorites,
      readCount: progress.filter((p) => p.read).length,
      totalKnowledge,
      recent,
    }
  }, [])

  const cov = coverageStats()

  useEffect(() => {
    void db.settings.put({ key: 'lastSeen', value: new Date().toISOString() })
  }, [])

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="card relative overflow-hidden p-7 sm:p-9">
        <div
          className="absolute inset-0 opacity-[0.055] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 12% 20%, var(--brand) 0, transparent 42%), radial-gradient(circle at 88% 70%, #16a078 0, transparent 45%)',
          }}
        />
        <div className="relative">
          <div className="chip mb-3">哈工大威海 · 计算机网络（自顶向下方法）</div>
          <h1 className="text-2xl sm:text-[2rem] font-bold tracking-tight leading-snug">
            计算机网络交互式学习平台
          </h1>
          <p className="muted mt-2.5 max-w-2xl text-[0.96rem] leading-relaxed">
            依据课程 PPT 完整重建的知识体系：每个知识点都讲清“为什么需要它 / 核心思路 / 内部机制 / 与类似机制的差别”，
            配合可操作的协议演示、逐选项解析的题库、基于首次作答的错题本与收藏题本。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/chapter/ch1" className="btn-primary">开始学习 →</Link>
            <Link to="/questions" className="btn-outline">进入题库</Link>
            <Link to="/compare" className="btn-outline">知识对比</Link>
          </div>
        </div>
      </section>

      {/* 学习状态 */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '已学知识点', value: `${stats?.readCount ?? 0} / ${stats?.totalKnowledge ?? 0}`, to: '/progress', icon: '📖' },
          { label: '待复习错题', value: stats?.mistakes ?? 0, to: '/mistakes', icon: '📕' },
          { label: '收藏题目', value: stats?.favorites ?? 0, to: '/favorites', icon: '⭐' },
          { label: '内容覆盖率', value: `${Math.round((cov.implemented / cov.total) * 100)}%`, to: '/progress', icon: '✅' },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="card p-4 hover:border-brand/50 transition group">
            <div className="text-[11px] muted mb-1 flex items-center gap-1.5">
              <span>{s.icon}</span>
              {s.label}
            </div>
            <div className="text-xl font-bold tabular-nums group-hover:text-brand transition">{s.value}</div>
          </Link>
        ))}
      </section>

      {/* 章节 */}
      <section>
        <h2 className="text-lg font-semibold mb-3">课程章节</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {chapters.map((ch) => {
            const total = ch.sections.reduce(
              (n, s) => n + s.subsections.reduce((m, sub) => m + sub.knowledge.length, 0), 0)
            const read = stats?.recent ? 0 : 0
            return (
              <div key={ch.id} className="card p-5 flex flex-col">
                <div className="flex items-start gap-2 mb-1.5">
                  <span className="chip shrink-0">{ch.order}</span>
                  <h3 className="font-semibold leading-snug">{ch.title}</h3>
                </div>
                {ch.en && <p className="muted text-xs italic mb-3">{ch.en}</p>}
                <p className="text-[0.9rem] leading-relaxed muted flex-1 mb-3">{ch.intro}</p>
                <div className="flex flex-wrap gap-1.5 mb-3.5">
                  {ch.sections.slice(0, 4).map((s) => (
                    <span key={s.id} className="chip text-[10px]">{s.title.split(' ')[0]}</span>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <Link to={`/chapter/${ch.id}`} className="btn-primary !py-1.5 flex-1 text-center justify-center">
                    进入学习
                  </Link>
                  <Link to={`/chapter/${ch.id}/summary`} className="btn-outline !py-1.5">
                    总结
                  </Link>
                </div>
                <div className="text-[11px] muted mt-2.5">{total} 个知识点 · PPT {ch.pptFile}</div>
              </div>
            )
          })}
        </div>
      </section>

      {/* 最近学习 */}
      {stats && stats.recent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3">最近学习</h2>
          <div className="card divide-y overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            {stats.recent.map((r) => {
              const path =
                r.kind === 'knowledge'
                  ? `/chapter/${r.id.split('.')[0] === 'k' ? `ch${r.id[1]}` : ''}/${r.id}`
                  : r.kind === 'summary'
                    ? `/chapter/${r.id.replace('sum-', '')}/summary`
                    : r.kind === 'question'
                      ? `/question/${r.id}`
                      : r.kind === 'demo'
                        ? `/demo/${r.id}`
                        : `/compare/${r.id}`
              return (
                <Link key={r.id + r.at} to={path} className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition">
                  <span className="chip text-[10px] shrink-0">
                    {{ knowledge: '知识', question: '题目', demo: '演示', comparison: '对比', summary: '总结' }[r.kind]}
                  </span>
                  <span className="flex-1 text-sm truncate">{r.title}</span>
                  <span className="text-[11px] muted shrink-0">{new Date(r.at).toLocaleDateString('zh-CN')}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      <p className="text-[11px] muted text-center pt-2">
        内容版本 {CONTENT_VERSION} · 学习数据保存在本浏览器本地（IndexedDB），可在「数据备份」页导出 JSON 迁移到其它设备
      </p>
    </div>
  )
}
