import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { markRecent } from '../db/studyDB'
import { questionById } from '../content/registry'
import QuestionCard from '../components/questions/QuestionCard'
import Breadcrumb from '../components/layout/Breadcrumb'

export default function QuestionPage() {
  const { questionId = '' } = useParams()
  const q = questionById.get(questionId)

  useEffect(() => {
    if (q) markRecent({ kind: 'question', id: q.id, title: q.stem.map((b) => (b.type === 'p' ? b.text : '')).join(' ').slice(0, 40) })
  }, [q?.id])

  if (!q) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm muted">未找到该题目（ID：{questionId}）。</p>
        <Link to="/questions" className="btn-primary mt-4 inline-flex">返回题库</Link>
      </div>
    )
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <Breadcrumb items={[{ label: '题库', to: '/questions' }, { label: q.id }]} />
      <QuestionCard question={q} />
    </div>
  )
}
