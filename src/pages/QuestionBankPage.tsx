import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { questions, chapters } from '../content/registry'
import { db } from '../db/studyDB'
import QuestionCard from '../components/questions/QuestionCard'
import { DIFFICULTY_LABEL, QUESTION_TYPE_LABEL } from '../components/questions/labels'

type SortMode = 'chapter' | 'difficulty' | 'random'

export default function QuestionBankPage() {
  const [chapterFilter, setChapterFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'unanswered' | 'wrong' | 'right'>('all')
  const [sort, setSort] = useState<SortMode>('chapter')
  const [seed, setSeed] = useState(1)

  const attemptInfo = useLiveQuery(async () => {
    const [attempts, mistakes, favorites] = await Promise.all([
      db.attempts.toArray(),
      db.mistakes.toArray(),
      db.favorites.toArray(),
    ])
    const byQ = new Map<string, { count: number; correct: number }>()
    for (const a of attempts) {
      const cur = byQ.get(a.questionId) ?? { count: 0, correct: 0 }
      cur.count++
      if (a.correct) cur.correct++
      byQ.set(a.questionId, cur)
    }
    return {
      byQ,
      mistakeSet: new Set(mistakes.map((m) => m.questionId)),
      favSet: new Set(favorites.map((f) => f.questionId)),
    }
  }, [])

  const allTags = useMemo(() => {
    const s = new Set<string>()
    questions.forEach((q) => q.tags.forEach((t) => s.add(t)))
    return [...s].sort()
  }, [])

  const filtered = useMemo(() => {
    let list = questions.filter((q) => {
      if (chapterFilter !== 'all' && q.chapterId !== chapterFilter) return false
      if (typeFilter !== 'all' && q.type !== typeFilter) return false
      if (difficultyFilter !== 'all' && q.difficulty !== difficultyFilter) return false
      if (tagFilter !== 'all' && !q.tags.includes(tagFilter)) return false
      if (statusFilter !== 'all' && attemptInfo) {
        const st = attemptInfo.byQ.get(q.id)
        if (statusFilter === 'unanswered' && st) return false
        if (statusFilter === 'wrong' && (!st || st.correct === st.count)) return false
        if (statusFilter === 'right' && (!st || st.correct === 0)) return false
      }
      return true
    })
    if (sort === 'difficulty') {
      const order = { easy: 0, medium: 1, hard: 2 }
      list = [...list].sort((a, b) => order[a.difficulty] - order[b.difficulty])
    } else if (sort === 'random') {
      // 确定性伪随机：seed 变化时重排，保证同一 seed 结果稳定
      list = [...list].sort((a, b) => {
        const ha = hash(a.id + seed)
        const hb = hash(b.id + seed)
        return ha - hb
      })
    }
    return list
  }, [chapterFilter, typeFilter, difficultyFilter, tagFilter, statusFilter, sort, seed, attemptInfo])

  const total = questions.length

  return (
    <div className="space-y-5">
      <header className="card p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">题库练习</h1>
        <p className="muted text-sm mt-1.5">
          共 {total} 道题，命中 {filtered.length} 道。提交前不显示答案，提交后展示每个选项的独立解析。
        </p>
      </header>

      <div className="card p-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <FilterSelect
          label="章节"
          value={chapterFilter}
          onChange={setChapterFilter}
          options={[
            { value: 'all', label: '全部章节' },
            ...chapters.map((c) => ({ value: c.id, label: c.title })),
          ]}
        />
        <FilterSelect
          label="题型"
          value={typeFilter}
          onChange={setTypeFilter}
          options={[
            { value: 'all', label: '全部题型' },
            ...Object.entries(QUESTION_TYPE_LABEL).map(([v, l]) => ({ value: v, label: l })),
          ]}
        />
        <FilterSelect
          label="难度"
          value={difficultyFilter}
          onChange={setDifficultyFilter}
          options={[
            { value: 'all', label: '全部难度' },
            ...Object.entries(DIFFICULTY_LABEL).map(([v, l]) => ({ value: v, label: l })),
          ]}
        />
        <FilterSelect
          label="考点"
          value={tagFilter}
          onChange={setTagFilter}
          options={[{ value: 'all', label: '全部考点' }, ...allTags.map((t) => ({ value: t, label: t }))]}
        />
        <FilterSelect
          label="作答状态"
          value={statusFilter}
          onChange={(v) => setStatusFilter(v as any)}
          options={[
            { value: 'all', label: '全部' },
            { value: 'unanswered', label: '未作答' },
            { value: 'wrong', label: '做错过的' },
            { value: 'right', label: '全对的' },
          ]}
        />
        <FilterSelect
          label="排序"
          value={sort}
          onChange={(v) => {
            setSort(v as SortMode)
            if (v === 'random') setSeed((s) => s + 1)
          }}
          options={[
            { value: 'chapter', label: '按章节' },
            { value: 'difficulty', label: '按难度' },
            { value: 'random', label: '随机排序' },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-8 text-center text-sm muted">没有符合条件的题目，试试放宽筛选条件。</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((q) => (
            <QuestionCard key={q.id} question={q} />
          ))}
        </div>
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium muted block mb-1">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2 py-1.5 rounded-md text-xs outline-none"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
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
