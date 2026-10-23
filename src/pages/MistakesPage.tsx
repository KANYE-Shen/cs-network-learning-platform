import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  db, getAttemptStats, removeMistake, setMistakeMastered, reAddMistake,
} from '../db/studyDB'
import { chapters, knowledgeById, questionById } from '../content/registry'
import { ContentRenderer } from '../components/content/ContentRenderer'
import { DIFFICULTY_LABEL, DIFFICULTY_STYLE, QUESTION_TYPE_LABEL, SOURCE_LABEL } from '../components/questions/labels'
import { Link } from 'react-router-dom'

export default function MistakesPage() {
  const [chapterFilter, setChapterFilter] = useState('all')
  const [showMastered, setShowMastered] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const entries = useLiveQuery(async () => db.mistakes.toArray(), [])
  const dismissed = useLiveQuery(async () => {
    const rows = await db.settings.toArray()
    return new Set(
      rows.filter((r) => r.key.startsWith('mistakeDismissed:')).map((r) => r.key.replace('mistakeDismissed:', '')),
    )
  }, [])

  /** 已从错题本移除、但仍保留作答记录的题目（可重新加入） */
  const removedItems = useMemo(() => {
    if (!dismissed) return []
    return [...dismissed]
      .map((id) => questionById.get(id))
      .filter((q): q is NonNullable<typeof q> => !!q)
  }, [dismissed])

  const items = useMemo(() => {
    if (!entries) return []
    return entries
      .filter((e) => !dismissed?.has(e.questionId))
      .filter((e) => (showMastered ? true : !e.mastered))
      .map((e) => {
        const q = questionById.get(e.questionId)
        return q ? { entry: e, question: q } : null
      })
      .filter(Boolean)
      .filter((x) => (chapterFilter === 'all' ? true : x!.question.chapterId === chapterFilter))
      .sort((a, b) => (a!.entry.mastered === b!.entry.mastered ? b!.entry.addedAt - a!.entry.addedAt : a!.entry.mastered ? 1 : -1))
  }, [entries, dismissed, chapterFilter, showMastered])

  const stats = useLiveQuery(async () => {
    if (!items) return null
    const rows = await Promise.all(
      items.map(async (x) => {
        const s = await getAttemptStats(x!.question.id)
        return { id: x!.question.id, ...s, mastered: x!.entry.mastered, auto: x!.entry.auto }
      }),
    )
    const totalAttempts = rows.reduce((n, r) => n + r.total, 0)
    const correctAttempts = rows.reduce((n, r) => n + r.correct, 0)
    return {
      rows,
      count: rows.length,
      masteredCount: rows.filter((r) => r.mastered).length,
      totalAttempts,
      accuracy: totalAttempts ? correctAttempts / totalAttempts : 0,
    }
  }, [items])

  return (
    <div className="space-y-5">
      <header className="card p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">错题本</h1>
        <p className="muted text-sm mt-1.5 leading-relaxed max-w-3xl">
          以<strong className="text-[var(--text)]">首次正式提交</strong>的作答结果为准：第一次答错自动进入本表，第一次答对则不进入。
          后续做错仍会保留完整作答记录，但不改变首次判定。移除错题不会删除原始作答记录。
        </p>
        {stats && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: '错题总数', value: String(stats.count) },
              { label: '已掌握', value: String(stats.masteredCount) },
              { label: '累计作答', value: String(stats.totalAttempts) },
              { label: '当前正确率', value: `${Math.round(stats.accuracy * 100)}%` },
            ].map((s) => (
              <div key={s.label} className="rounded-lg surface-2 px-3 py-2">
                <div className="text-[10px] muted">{s.label}</div>
                <div className="text-lg font-bold tabular-nums">{s.value}</div>
              </div>
            ))}
          </div>
        )}
      </header>

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs">
          <span className="muted">章节</span>
          <select
            value={chapterFilter}
            onChange={(e) => setChapterFilter(e.target.value)}
            className="px-2 py-1 rounded-md text-xs outline-none"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            <option value="all">全部</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5 text-xs cursor-pointer">
          <input type="checkbox" checked={showMastered} onChange={(e) => setShowMastered(e.target.checked)} className="accent-[var(--brand)]" />
          <span className="muted">显示已掌握的错题</span>
        </label>
      </div>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-3xl mb-2">🎉</div>
          <p className="text-sm muted">目前没有错题。去题库练一练吧。</p>
          <Link to="/questions" className="btn-primary mt-4 inline-flex">去题库</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((x) => {
            const { entry, question } = x!
            const st = stats?.rows.find((r) => r.id === question.id)
            const kInfo = question.knowledgeId ? knowledgeById.get(question.knowledgeId) : undefined
            const isOpen = expanded === question.id
            return (
              <div key={question.id} className="card overflow-hidden">
                <div className="px-4 py-3.5">
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="chip">{QUESTION_TYPE_LABEL[question.type]}</span>
                    <span className={`chip ${DIFFICULTY_STYLE[question.difficulty]}`}>{DIFFICULTY_LABEL[question.difficulty]}</span>
                    <span className="chip">{SOURCE_LABEL[question.source]}</span>
                    {entry.mastered && <span className="chip bg-emerald-500/12 text-emerald-700 dark:text-emerald-400">已掌握</span>}
                    {entry.auto && <span className="chip">首次答错自动加入</span>}
                    {!entry.auto && <span className="chip">手动加入</span>}
                    {st && (
                      <span className="text-[11px] muted ml-auto tabular-nums">
                        作答 {st.total} 次 · 正确率 {Math.round(st.accuracy * 100)}%
                      </span>
                    )}
                  </div>

                  <div className="text-[0.94rem] leading-relaxed font-medium">
                    <ContentRenderer blocks={question.stem} />
                  </div>

                  {kInfo && (
                    <div className="text-[11px] muted mt-1.5">
                      知识点：
                      <Link to={`/chapter/${kInfo.chapterId}/${kInfo.id}`} className="text-brand hover:underline">
                        {kInfo.title}
                      </Link>
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button onClick={() => setExpanded(isOpen ? null : question.id)} className="btn-ghost !py-1 text-xs">
                      {isOpen ? '收起解析' : '查看答案与解析'}
                    </button>
                    <button
                      onClick={() => setMistakeMastered(question.id, !entry.mastered)}
                      className="btn-outline !py-1 text-xs"
                    >
                      {entry.mastered ? '取消“已掌握”' : '标记为已掌握'}
                    </button>
                    <button
                      onClick={() => removeMistake(question.id)}
                      className="btn-outline !py-1 text-xs !text-rose-600 dark:!text-rose-400"
                      title="从错题本移除（不会删除作答记录）"
                    >
                      移除
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-3.5 pt-3.5 border-t space-y-3" style={{ borderColor: 'var(--border)' }}>
                      {st?.firstAttempt && (
                        <div className="rounded-lg px-3 py-2 text-sm" style={{ background: 'rgba(244,63,94,0.07)' }}>
                          <span className="font-semibold" style={{ color: '#e11d48' }}>首次错误选项：</span>
                          <span className="ml-1">
                            {Array.isArray(st.firstAttempt.answer)
                              ? st.firstAttempt.answer.join('、') || '（未选择）'
                              : st.firstAttempt.answer || '（未作答）'}
                          </span>
                          <span className="muted text-xs ml-2">
                            {new Date(st.firstAttempt.at).toLocaleString('zh-CN')}
                          </span>
                        </div>
                      )}
                      {question.type === 'single' || question.type === 'multiple' || question.type === 'judge' ? (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold muted">
                            正确答案：{question.answer.join('、')}
                          </div>
                          {question.options.map((o) => {
                            const isAns = question.answer.includes(o.key)
                            return (
                              <div
                                key={o.key}
                                className="rounded-lg px-3 py-2 text-[0.88rem] leading-relaxed"
                                style={{ background: isAns ? 'rgba(16,185,129,0.08)' : 'var(--surface-2)' }}
                              >
                                <span className="font-semibold mr-1.5" style={{ color: isAns ? '#059669' : 'var(--text-muted)' }}>
                                  {o.key}.
                                </span>
                                {o.text}
                                <div className="muted text-[0.85rem] mt-1">{o.explain}</div>
                              </div>
                            )
                          })}
                        </div>
                      ) : question.type === 'numeric' ? (
                        <div className="text-sm">
                          <div className="mb-1.5">
                            正确答案：<strong>{question.answer}</strong> {question.unit}
                          </div>
                          <ol className="list-decimal pl-5 space-y-1 text-[0.9rem]">
                            {question.solutionSteps.map((s, i) => (
                              <li key={i}><ContentRenderer blocks={[{ type: 'p', text: s }]} /></li>
                            ))}
                          </ol>
                        </div>
                      ) : (
                        <div className="text-sm">
                          <ContentRenderer blocks={question.type === 'short' ? question.referenceAnswer : []} />
                        </div>
                      )}
                      <div className="pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                        <div className="text-xs font-semibold muted mb-1.5">解析</div>
                        <ContentRenderer blocks={question.analysis} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {removedItems.length > 0 && (
        <section className="card p-5">
          <h2 className="text-sm font-semibold mb-1">已移除的错题</h2>
          <p className="muted text-xs mb-3">
            从错题本移除不会删除原始作答记录，这些题目在需要时可以重新加入。
          </p>
          <div className="space-y-2">
            {removedItems.map((q) => (
              <div key={q.id} className="flex items-center gap-3 rounded-lg surface-2 px-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-sm truncate">
                    {q.stem
                      .map((b) => (b.type === 'p' ? b.text : ''))
                      .join(' ')
                      .slice(0, 70)}
                  </div>
                  <div className="text-[11px] muted">{QUESTION_TYPE_LABEL[q.type]} · {q.tags.join(' / ')}</div>
                </div>
                <button onClick={() => reAddMistake(q.id)} className="btn-outline !py-1 text-xs shrink-0">
                  ↻ 重新加入
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
