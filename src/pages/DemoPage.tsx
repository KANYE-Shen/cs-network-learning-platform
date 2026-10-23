import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { markRecent } from '../db/studyDB'
import { demoById, knowledgeById } from '../content/registry'
import { DemoHost } from '../components/demos/DemoHost'
import Breadcrumb from '../components/layout/Breadcrumb'

export default function DemoPage() {
  const { demoId = '' } = useParams()
  const meta = demoById.get(demoId)

  useEffect(() => {
    if (meta) markRecent({ kind: 'demo', id: meta.id, title: meta.title })
  }, [meta?.id])

  if (!meta) {
    return (
      <div className="card p-8 text-center">
        <p className="text-sm muted">未找到该演示（ID：{demoId}）。</p>
        <Link to="/" className="btn-primary mt-4 inline-flex">返回首页</Link>
      </div>
    )
  }

  const k = meta.knowledgeId ? knowledgeById.get(meta.knowledgeId) : undefined

  return (
    <div className="space-y-5">
      <Breadcrumb
        items={[
          ...(k ? [{ label: k.chapterTitle, to: `/chapter/${k.chapterId}` }] : []),
          { label: meta.title },
        ]}
      />
      <header className="card p-5">
        <div className="text-xs chip mb-2">交互式演示</div>
        <h1 className="text-xl font-bold tracking-tight">{meta.title}</h1>
        <p className="muted text-sm mt-1.5 leading-relaxed">{meta.summary}</p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          {meta.tags.map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
        {k && (
          <Link
            to={`/chapter/${k.chapterId}/${k.id}`}
            className="text-xs text-brand hover:underline inline-block mt-3"
          >
            → 回到知识点：{k.title}
          </Link>
        )}
      </header>
      <DemoHost demoId={meta.id} />
    </div>
  )
}
