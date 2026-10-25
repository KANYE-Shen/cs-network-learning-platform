import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/studyDB'
import { chapters, coverageStats, knowledgeById } from '../content/registry'
import { CONTENT_VERSION } from '../content/registry'

const chapterTeasers: Record<string, string> = {
  ch1: '认识互联网的组成与数据传送过程，再解释时延、吞吐量和分层。',
  ch2: '围绕 HTTP、DNS、电子邮件与 P2P，观察应用协议怎样交换内容。',
  ch3: '从 UDP 与 TCP 出发，理解复用、可靠传输、流量控制和拥塞控制。',
}

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
      readIds: new Set(progress.filter((p) => p.read).map((p) => p.knowledgeId)),
      totalKnowledge,
      recent: recent.filter((entry) => entry.kind !== 'knowledge' || knowledgeById.has(entry.id)),
    }
  }, [])

  const cov = coverageStats()

  useEffect(() => {
    void db.settings.put({ key: 'lastSeen', value: new Date().toISOString() })
  }, [])

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-copy">
          <div className="text-xs font-semibold tracking-widest text-brand uppercase mb-3">HIT · NETWORKING · 01—03</div>
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight leading-tight">
            计算机网络交互式学习平台
          </h1>
          <p className="muted mt-3 max-w-2xl text-sm sm:text-base leading-relaxed">
            从应用到传输层，沿着真实协议的因果过程学习。每个知识点先看图与要点，再展开完整讲解、推导和练习。
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link to="/chapter/ch1" className="btn-primary">从第一章开始 <span aria-hidden="true">→</span></Link>
            <Link to="/questions" className="btn-outline">练习题库</Link>
          </div>
        </div>
        <div className="home-hero-count" aria-label="课程包含三章">
          <span>3</span><small>课程章节</small>
          <div className="home-chapter-strokes"><i /><i /><i /></div>
        </div>
      </section>

      {/* 学习状态 */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: '已学知识点', value: `${stats?.readCount ?? 0} / ${stats?.totalKnowledge ?? 0}`, to: '/progress', code: '01' },
          { label: '待复习错题', value: stats?.mistakes ?? 0, to: '/mistakes', code: '02' },
          { label: '收藏题目', value: stats?.favorites ?? 0, to: '/favorites', code: '03' },
          { label: '内容覆盖率', value: `${Math.round((cov.implemented / cov.total) * 100)}%`, to: '/progress', code: '04' },
        ].map((s) => (
          <Link key={s.label} to={s.to} className="card p-4 hover:border-brand/50 transition group">
            <div className="text-[11px] muted mb-1 flex items-center gap-1.5">
              <span className="home-stat-code">{s.code}</span>
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
            const read = stats?.readIds
              ? ch.sections.reduce((n, s) => n + s.subsections.reduce((m, sub) => m + sub.knowledge.filter((k) => stats.readIds.has(k.id)).length, 0), 0)
              : 0
            return (
              <div key={ch.id} className="card home-chapter-card">
                <div className="flex items-start gap-3 mb-2">
                  <span className="home-chapter-number">{String(ch.order).padStart(2, '0')}</span>
                  <div><h3 className="font-semibold leading-snug">{ch.title}</h3>{ch.en && <p className="muted text-xs italic mt-1">{ch.en}</p>}</div>
                </div>
                <p className="text-sm leading-relaxed muted mb-4">{chapterTeasers[ch.id] ?? ch.intro}</p>
                <div className="home-progress" aria-label={`已学 ${read} / ${total}`}><span style={{ width: `${Math.min(100, (read / total) * 100)}%` }} /></div>
                <div className="flex items-center justify-between text-xs muted mt-2 mb-4"><span>{read} / {total} 个知识点</span><span>PPT {ch.pptFile}</span></div>
                <div className="flex items-center gap-2 mt-auto">
                  <Link to={`/chapter/${ch.id}`} className="home-chapter-link">
                    进入学习 <span aria-hidden="true">→</span>
                  </Link>
                  <Link to={`/chapter/${ch.id}/summary`} className="btn-outline !py-1.5" aria-label={`${ch.title}章节总结`}>
                    总结 ↗
                  </Link>
                </div>
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
              const chapterId = r.kind === 'knowledge' ? knowledgeById.get(r.id)?.chapterId : undefined
              const path =
                r.kind === 'knowledge' && chapterId
                  ? `/chapter/${chapterId}/${r.id}`
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
                    {{ knowledge: '知', question: '题', demo: '演', comparison: '比', summary: '章' }[r.kind]}
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
