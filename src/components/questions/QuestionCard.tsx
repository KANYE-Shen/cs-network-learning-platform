import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import type { ChoiceQuestion, Question } from '../../types/content'
import { db, submitAttempt, toggleFavorite, getAttemptStats } from '../../db/studyDB'
import { ContentRenderer } from '../content/ContentRenderer'
import SourceBadges from '../content/SourceBadges'
import { DIFFICULTY_LABEL, DIFFICULTY_STYLE, QUESTION_TYPE_LABEL, SOURCE_LABEL, SOURCE_STYLE } from './labels'
import { knowledgeById, questionById } from '../../content/registry'

interface Props {
  question: Question
  /** 练习模式：隐藏答案，仅在提交后显示 */
  practice?: boolean
  /** 是否显示收藏按钮 */
  showFavorite?: boolean
  /** 题目来源路径（用于最近学习） */
  onAnswered?: (questionId: string, correct: boolean) => void
}

function isChoice(q: Question): q is ChoiceQuestion {
  return q.type === 'single' || q.type === 'multiple' || q.type === 'judge'
}

export default function QuestionCard({ question: q, practice = true, showFavorite = true, onAnswered }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [numeric, setNumeric] = useState('')
  const [shortText, setShortText] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const faved = useLiveQuery(async () => !!(await db.favorites.get(q.id)), [q.id])
  const stats = useLiveQuery(async () => getAttemptStats(q.id), [q.id])

  useEffect(() => {
    setSelected([])
    setNumeric('')
    setShortText('')
    setSubmitted(false)
    setCorrect(false)
    setMessage(null)
  }, [q.id])

  const kInfo = q.knowledgeId ? knowledgeById.get(q.knowledgeId) : undefined

  const isCorrect = useMemo(() => {
    if (q.type === 'numeric') {
      const v = Number(numeric)
      if (!numeric.trim() || Number.isNaN(v)) return false
      const tol = q.tolerance ?? 0
      return Math.abs(v - q.answer) <= tol
    }
    if (q.type === 'short') return shortText.trim().length > 0
    if (!isChoice(q)) return false
    const ans = [...q.answer].sort()
    const sel = [...selected].sort()
    return ans.length === sel.length && ans.every((a, i) => a === sel[i])
  }, [q, selected, numeric, shortText])

  const canSubmit = useMemo(() => {
    if (submitted) return false
    if (q.type === 'numeric') return numeric.trim() !== ''
    if (q.type === 'short') return shortText.trim() !== ''
    return selected.length > 0
  }, [q.type, selected, numeric, shortText, submitted])

  const handleSubmit = async () => {
    const answerPayload =
      q.type === 'numeric' ? numeric : q.type === 'short' ? shortText : selected
    setSubmitted(true)
    setCorrect(isCorrect)
    const rec = await submitAttempt(q.id, answerPayload, isCorrect)
    onAnswered?.(q.id, isCorrect)
    if (rec.first) {
      setMessage(isCorrect ? '首次作答正确，已记录。' : '首次作答错误，已自动加入错题本。')
    } else {
      setMessage(isCorrect ? '本次作答正确。' : '本次作答错误（首次判定不受影响）。')
    }
  }

  const handleReset = () => {
    setSelected([])
    setNumeric('')
    setShortText('')
    setSubmitted(false)
    setCorrect(false)
    setMessage(null)
  }

  const toggleOption = (key: string) => {
    if (submitted) return
    if (q.type === 'single' || q.type === 'judge') {
      setSelected([key])
    } else {
      setSelected((s) => (s.includes(key) ? s.filter((k) => k !== key) : [...s, key]))
    }
  }

  const optionState = (key: string): 'idle' | 'correct' | 'wrong' | 'missed' => {
    if (!submitted || !isChoice(q)) return 'idle'
    const isAns = q.answer.includes(key)
    const isSel = selected.includes(key)
    if (isAns) return 'correct'
    if (isSel) return 'wrong'
    return 'idle'
  }

  return (
    <div className="card overflow-hidden">
      {/* 题头 */}
      <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
          <span className="chip">{QUESTION_TYPE_LABEL[q.type]}</span>
          <span className={`chip ${DIFFICULTY_STYLE[q.difficulty]}`}>{DIFFICULTY_LABEL[q.difficulty]}</span>
          <span className={`chip ${SOURCE_STYLE[q.source]}`}>{SOURCE_LABEL[q.source]}</span>
          {q.tags.map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
          <span className="ml-auto flex items-center gap-2">
            {stats && stats.total > 0 && (
              <span className="text-[11px] muted">
                作答 {stats.total} 次 · 正确率 {Math.round(stats.accuracy * 100)}%
              </span>
            )}
            {showFavorite && (
              <button
                onClick={() => toggleFavorite(q.id)}
                className={`text-sm transition ${faved ? 'text-amber-500' : 'muted hover:text-amber-500'}`}
                title={faved ? '取消收藏' : '收藏本题'}
              >
                {faved ? '★' : '☆'}
              </button>
            )}
          </span>
        </div>

        <div className="text-[0.97rem] leading-relaxed">
          <ContentRenderer blocks={q.stem} />
        </div>

        {kInfo && (
          <div className="mt-2.5 text-[11px] muted">
            关联知识点：
            <Link to={`/chapter/${kInfo.chapterId}/${kInfo.id}`} className="text-brand hover:underline">
              {kInfo.title}
            </Link>
          </div>
        )}
        {q.sourceRef && (
          <div className="mt-2">
            <SourceBadges sources={[q.sourceRef]} />
          </div>
        )}
      </div>

      {/* 作答区 */}
      <div className="px-5 py-4">
        {isChoice(q) && (
          <div className="space-y-2">
            {q.options.map((opt) => {
              const st = optionState(opt.key)
              const isCorrectOpt = q.answer.includes(opt.key)
              return (
                <div key={opt.key}>
                  <button
                    onClick={() => toggleOption(opt.key)}
                    disabled={submitted}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg border transition flex items-start gap-2.5 ${
                      st === 'correct'
                        ? 'border-emerald-500 bg-emerald-500/8'
                        : st === 'wrong'
                          ? 'border-rose-500 bg-rose-500/8'
                          : selected.includes(opt.key)
                            ? 'border-brand bg-brand/8'
                            : 'hover:border-brand/40'
                    } ${submitted ? 'cursor-default' : 'cursor-pointer'}`}
                    style={st === 'idle' && !selected.includes(opt.key) ? { borderColor: 'var(--border)' } : undefined}
                  >
                    <span
                      className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-semibold mt-0.5 ${
                        st === 'correct'
                          ? 'bg-emerald-500 text-white'
                          : st === 'wrong'
                            ? 'bg-rose-500 text-white'
                            : selected.includes(opt.key)
                              ? 'bg-brand text-white'
                              : 'surface-2 muted'
                      }`}
                    >
                      {st === 'correct' ? '✓' : st === 'wrong' ? '✕' : opt.key}
                    </span>
                    <span className="flex-1 text-[0.94rem] leading-relaxed">
                      <ContentRenderer blocks={[{ type: 'p', text: opt.text }]} />
                    </span>
                  </button>
                  {submitted && (
                    <div
                      className="ml-7 mt-1.5 mb-2.5 text-[0.87rem] leading-relaxed rounded-lg px-3 py-2"
                      style={{
                        background: isCorrectOpt ? 'rgba(16,185,129,0.09)' : 'rgba(244,63,94,0.07)',
                      }}
                    >
                      <span
                        className="font-semibold mr-1.5"
                        style={{ color: isCorrectOpt ? '#059669' : '#e11d48' }}
                      >
                        {isCorrectOpt ? '✓ 正确选项' : '✕ 错误选项'}：
                      </span>
                      <ContentRenderer blocks={[{ type: 'p', text: opt.explain }]} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {q.type === 'numeric' && (
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="number"
                step="any"
                value={numeric}
                onChange={(e) => setNumeric(e.target.value)}
                disabled={submitted}
                placeholder="输入数值答案"
                className="px-3 py-2 rounded-lg text-sm outline-none w-44"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
              />
              {q.unit && <span className="muted text-sm">{q.unit}</span>}
            </div>
            {submitted && (
              <div
                className="mt-3 rounded-lg px-3 py-2 text-sm"
                style={{ background: correct ? 'rgba(16,185,129,0.09)' : 'rgba(244,63,94,0.07)' }}
              >
                <span className="font-semibold" style={{ color: correct ? '#059669' : '#e11d48' }}>
                  {correct ? '✓ 回答正确' : '✕ 回答错误'}
                </span>
                <span className="muted ml-2">
                  正确答案：{q.answer}
                  {q.unit ? ` ${q.unit}` : ''}
                </span>
                {q.solutionSteps.length > 0 && (
                  <ol className="mt-2.5 space-y-1 list-decimal pl-5 marker:text-brand text-[0.9rem]">
                    {q.solutionSteps.map((s, i) => (
                      <li key={i}>
                        <ContentRenderer blocks={[{ type: 'p', text: s }]} />
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}
          </div>
        )}

        {q.type === 'short' && (
          <div>
            <textarea
              value={shortText}
              onChange={(e) => setShortText(e.target.value)}
              disabled={submitted}
              rows={4}
              placeholder="写下你的答案要点…"
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-y"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
            {submitted && (
              <div className="mt-3 rounded-lg px-3 py-2.5 text-sm" style={{ background: 'rgba(50,85,219,0.07)' }}>
                <div className="font-semibold text-brand mb-1.5">参考答案</div>
                <ContentRenderer blocks={q.referenceAnswer} />
              </div>
            )}
          </div>
        )}

        {/* 解析 */}
        {submitted && isChoice(q) && (
          <div className="mt-4 pt-3.5 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="text-xs font-semibold muted uppercase tracking-wider mb-2">解析</div>
            <div className="text-[0.94rem] leading-relaxed">
              <ContentRenderer blocks={q.analysis} />
            </div>
          </div>
        )}

        {/* 操作 */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!submitted ? (
            <button onClick={handleSubmit} disabled={!canSubmit} className="btn-primary">
              提交答案
            </button>
          ) : (
            <button onClick={handleReset} className="btn-ghost">
              ↺ 重新作答
            </button>
          )}
          {message && (
            <span
              className="text-xs"
              style={{ color: correct ? '#059669' : '#e11d48' }}
            >
              {message}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
