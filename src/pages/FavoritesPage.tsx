import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '../db/studyDB'
import { chapters, knowledgeById, questionById } from '../content/registry'
import type { Question } from '../types/content'
import { ContentRenderer } from '../components/content/ContentRenderer'
import { DIFFICULTY_LABEL, DIFFICULTY_STYLE, QUESTION_TYPE_LABEL, SOURCE_LABEL } from '../components/questions/labels'

type Mode = 'practice' | 'answer'
type Order = 'chapter' | 'random'

export default function FavoritesPage() {
  const [mode, setMode] = useState<Mode>('practice')
  const [order, setOrder] = useState<Order>('chapter')
  const [scope, setScope] = useState<string>('all')
  const [seed, setSeed] = useState(1)
  const [answers, setAnswers] = useState<Record<string, string[]>>({})
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const favs = useLiveQuery(async () => db.favorites.toArray(), [])

  const items = useMemo(() => {
    if (!favs) return []
    let list = favs
      .map((f) => questionById.get(f.questionId))
      .filter((q): q is NonNullable<typeof q> => !!q)
    if (scope !== 'all') list = list.filter((q) => q.chapterId === scope)
    if (order === 'random') {
      list = [...list].sort((a, b) => hash(a.id + seed) - hash(b.id + seed))
    }
    return list
  }, [favs, scope, order, seed])

  /** 按章节 / 知识点自动分类 */
  const grouped = useMemo(() => {
    const byChapter = new Map<string, typeof items>()
    for (const q of items) {
      const arr = byChapter.get(q.chapterId) ?? []
      arr.push(q)
      byChapter.set(q.chapterId, arr)
    }
    const byKnowledge = new Map<string, typeof items>()
    for (const q of items) {
      if (!q.knowledgeId) continue
      const arr = byKnowledge.get(q.knowledgeId) ?? []
      arr.push(q)
      byKnowledge.set(q.knowledgeId, arr)
    }
    return { byChapter, byKnowledge }
  }, [items])

  const toggle = (qid: string, key: string) => {
    setAnswers((a) => {
      const q = questionById.get(qid)!
      const cur = a[qid] ?? []
      if (q.type === 'single' || q.type === 'judge') return { ...a, [qid]: [key] }
      return { ...a, [qid]: cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key] }
    })
  }

  const isCorrect = (qid: string) => {
    const q = questionById.get(qid)!
    if (q.type !== 'single' && q.type !== 'multiple' && q.type !== 'judge') return false
    const sel = [...(answers[qid] ?? [])].sort()
    const ans = [...q.answer].sort()
    return sel.length === ans.length && ans.every((a, i) => a === sel[i])
  }

  const exportHtml = () => {
    const html = buildBookHtml(items, answers, checked)
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `我的优质题本-${new Date().toISOString().slice(0, 10)}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  const printPage = () => {
    window.print()
  }

  return (
    <div className="space-y-5">
      <header className="card p-5 sm:p-6 no-print">
        <h1 className="text-2xl font-bold tracking-tight">收藏题本</h1>
        <p className="muted text-sm mt-1.5 leading-relaxed max-w-3xl">
          收藏的题目按章节与知识点自动分类，并可直接生成一份可练习的个人题本。
          题本与错题本相互独立，同一道题可以同时存在于两者之中。
        </p>
      </header>

      {items.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="text-3xl mb-2">⭐</div>
          <p className="text-sm muted">还没有收藏任何题目。在题库中点击题目右上角的 ☆ 即可收藏。</p>
          <Link to="/questions" className="btn-primary mt-4 inline-flex">去题库</Link>
        </div>
      ) : (
        <>
          <div className="card p-4 flex flex-wrap items-center gap-3 no-print">
            <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: 'var(--surface-2)' }}>
              <button
                onClick={() => setMode('practice')}
                className={`px-3 py-1 rounded-md text-xs transition ${mode === 'practice' ? 'bg-[var(--surface)] font-medium shadow-sm' : 'muted'}`}
              >
                练习模式
              </button>
              <button
                onClick={() => setMode('answer')}
                className={`px-3 py-1 rounded-md text-xs transition ${mode === 'answer' ? 'bg-[var(--surface)] font-medium shadow-sm' : 'muted'}`}
              >
                答案解析模式
              </button>
            </div>

            <label className="flex items-center gap-1.5 text-xs">
              <span className="muted">范围</span>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="px-2 py-1 rounded-md text-xs outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="all">全部收藏（{items.length}）</option>
                {chapters.map((c) => {
                  const n = grouped.byChapter.get(c.id)?.length ?? 0
                  return (
                    <option key={c.id} value={c.id} disabled={n === 0}>
                      {c.title}（{n}）
                    </option>
                  )
                })}
              </select>
            </label>

            <label className="flex items-center gap-1.5 text-xs">
              <span className="muted">排序</span>
              <select
                value={order}
                onChange={(e) => {
                  setOrder(e.target.value as Order)
                  if (e.target.value === 'random') setSeed((s) => s + 1)
                }}
                className="px-2 py-1 rounded-md text-xs outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              >
                <option value="chapter">按章节排序</option>
                <option value="random">随机排序</option>
              </select>
            </label>

            <div className="ml-auto flex items-center gap-2">
              <button onClick={printPage} className="btn-outline !py-1 text-xs">🖨 打印</button>
              <button onClick={exportHtml} className="btn-primary !py-1 text-xs">⬇ 导出 HTML</button>
            </div>
          </div>

          {/* 分类概览 */}
          <div className="grid gap-4 lg:grid-cols-[1fr_260px]">
            <div className="space-y-4">
              {items.map((q, idx) => {
                const kInfo = q.knowledgeId ? knowledgeById.get(q.knowledgeId) : undefined
                const showAnswer = mode === 'answer' || checked[q.id]
                return (
                  <div key={q.id} className="card p-4 print:break-inside-avoid">
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <span className="chip">第 {idx + 1} 题</span>
                      <span className="chip">{QUESTION_TYPE_LABEL[q.type]}</span>
                      <span className={`chip ${DIFFICULTY_STYLE[q.difficulty]}`}>{DIFFICULTY_LABEL[q.difficulty]}</span>
                      <span className="chip">{SOURCE_LABEL[q.source]}</span>
                      {q.tags.map((t) => <span key={t} className="chip">{t}</span>)}
                    </div>
                    <div className="text-[0.94rem] leading-relaxed font-medium mb-2.5">
                      <ContentRenderer blocks={q.stem} />
                    </div>

                    {q.type === 'single' || q.type === 'multiple' || q.type === 'judge' ? (
                      <div className="space-y-1.5">
                        {q.options.map((o) => {
                          const isAns = q.answer.includes(o.key)
                          const sel = answers[q.id]?.includes(o.key)
                          return (
                            <div key={o.key}>
                              <button
                                onClick={() => toggle(q.id, o.key)}
                                className={`w-full text-left px-3 py-1.5 rounded-lg border text-sm transition flex items-start gap-2 ${
                                  showAnswer && isAns
                                    ? 'border-emerald-500 bg-emerald-500/8'
                                    : sel
                                      ? 'border-brand bg-brand/8'
                                      : 'hover:border-brand/40'
                                }`}
                                style={!showAnswer && !sel ? { borderColor: 'var(--border)' } : undefined}
                              >
                                <span className="font-semibold shrink-0 w-4">{o.key}</span>
                                <span className="flex-1">{o.text}</span>
                                {showAnswer && isAns && <span className="text-emerald-600 dark:text-emerald-400 text-xs shrink-0">✓ 正确</span>}
                              </button>
                              {showAnswer && (
                                <div className="ml-6 mt-1 text-[0.83rem] leading-relaxed muted">{o.explain}</div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : q.type === 'numeric' ? (
                      <div className="text-sm">
                        {showAnswer ? (
                          <>
                            <div className="mb-1.5">正确答案：<strong>{q.answer}</strong> {q.unit}</div>
                            <ol className="list-decimal pl-5 space-y-1 text-[0.9rem]">
                              {q.solutionSteps.map((s, i) => (
                                <li key={i}><ContentRenderer blocks={[{ type: 'p', text: s }]} /></li>
                              ))}
                            </ol>
                          </>
                        ) : (
                          <div className="text-muted text-sm">（计算题，答案解析模式下显示）</div>
                        )}
                      </div>
                    ) : (
                      <div className="text-sm">
                        {showAnswer ? (
                          <ContentRenderer blocks={q.type === 'short' ? q.referenceAnswer : []} />
                        ) : (
                          <div className="text-muted text-sm">（简答题，答案解析模式下显示）</div>
                        )}
                      </div>
                    )}

                    {mode === 'practice' && (
                      <div className="mt-2.5 flex items-center gap-2 no-print">
                        <button onClick={() => setChecked((c) => ({ ...c, [q.id]: !c[q.id] }))} className="btn-ghost !py-1 text-xs">
                          {checked[q.id] ? '隐藏答案' : '显示答案'}
                        </button>
                        {checked[q.id] && (q.type === 'single' || q.type === 'multiple' || q.type === 'judge') && (
                          <span className="text-xs" style={{ color: isCorrect(q.id) ? '#059669' : '#e11d48' }}>
                            {isCorrect(q.id) ? '✓ 你的答案正确' : '✕ 你的答案不正确'}
                          </span>
                        )}
                      </div>
                    )}

                    {showAnswer && (
                      <div className="mt-2.5 pt-2.5 border-t text-[0.88rem] leading-relaxed" style={{ borderColor: 'var(--border)' }}>
                        <span className="text-xs font-semibold muted">解析：</span>
                        <ContentRenderer blocks={q.analysis} />
                      </div>
                    )}

                    {kInfo && (
                      <div className="mt-2 text-[11px] muted no-print">
                        知识点：
                        <Link to={`/chapter/${kInfo.chapterId}/${kInfo.id}`} className="text-brand hover:underline">
                          {kInfo.title}
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* 分类侧栏 */}
            <aside className="space-y-3 no-print lg:sticky lg:top-20 lg:self-start">
              <div className="card p-4">
                <h3 className="text-xs font-semibold muted uppercase tracking-wider mb-2">按章节分类</h3>
                <div className="space-y-1">
                  {chapters.map((c) => {
                    const list = grouped.byChapter.get(c.id) ?? []
                    return (
                      <button
                        key={c.id}
                        onClick={() => setScope(scope === c.id ? 'all' : c.id)}
                        className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs transition ${
                          scope === c.id ? 'bg-brand/10 text-brand font-medium' : 'hover:bg-[var(--surface-2)]'
                        }`}
                      >
                        <span className="truncate text-left">{c.title}</span>
                        <span className="tabular-nums muted shrink-0">{list.length}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="card p-4">
                <h3 className="text-xs font-semibold muted uppercase tracking-wider mb-2">按知识点分类</h3>
                <div className="space-y-1 max-h-[360px] overflow-y-auto">
                  {[...grouped.byKnowledge.entries()].map(([kid, list]) => {
                    const k = knowledgeById.get(kid)
                    return (
                      <div key={kid} className="flex items-center justify-between gap-2 px-2 py-1 text-xs">
                        <span className="truncate muted" title={k?.title}>{k?.title ?? kid}</span>
                        <span className="tabular-nums muted shrink-0">{list.length}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </div>
  )
}

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** 生成可独立打开/打印的题本 HTML */
function buildBookHtml(
  items: Question[],
  answers: Record<string, string[]>,
  checked: Record<string, boolean>,
) {
  const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]!))
  const body = items
    .map((q, i) => {
      const hasOptions = q.type === 'single' || q.type === 'multiple' || q.type === 'judge'
      const answerKeys = hasOptions ? (q as { answer: string[] }).answer : []
      const opts = (hasOptions ? q.options : [])
        .map(
          (o) =>
            `<li><b>${esc(o.key)}.</b> ${esc(o.text)} ${
              checked[q.id] && answerKeys.includes(o.key) ? '<b style="color:#059669">✓</b>' : ''
            }</li>`,
        )
        .join('')
      const expl = checked[q.id] && hasOptions
        ? `<div style="margin-top:6px;font-size:12px;color:#555">${(q as { options: { key: string; explain: string }[] }).options
            .map((o) => `<div>${esc(o.key)}：${esc(o.explain)}</div>`)
            .join('')}</div>`
        : ''
      const stemText = q.stem.map((b) => (b.type === 'p' ? b.text : '')).join(' ')
      return `<div class="q"><div class="meta">第 ${i + 1} 题 · ${esc(q.type)} · ${esc(q.difficulty)}</div>
        <div class="stem">${esc(stemText)}</div>
        <ul>${opts}</ul>${expl}</div>`
    })
    .join('\n')
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<title>我的优质题本</title>
<style>
body{font-family:-apple-system,"PingFang SC","Microsoft YaHei",sans-serif;max-width:760px;margin:32px auto;padding:0 16px;line-height:1.8;color:#1b2430}
h1{font-size:22px;margin-bottom:4px}
.meta{font-size:12px;color:#888;margin-bottom:6px}
.q{border:1px solid #e4e8ef;border-radius:10px;padding:14px 16px;margin-bottom:12px;break-inside:avoid}
.stem{font-weight:600;margin-bottom:8px}
ul{margin:0;padding-left:20px}
li{margin:2px 0}
@media print{body{margin:0}.q{border-color:#ccc}}
</style></head><body>
<h1>我的优质题本</h1>
<p style="color:#666;font-size:13px">导出时间：${new Date().toLocaleString('zh-CN')} · 共 ${items.length} 题</p>
${body}</body></html>`
}
