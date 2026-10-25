import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, markRecent, setProgress } from '../db/studyDB'
import {
  chapterById, flatKnowledge, getNavNeighbors, knowledgeById, questionById, demoById, comparisonById,
} from '../content/registry'
import { ContentRenderer } from '../components/content/ContentRenderer'
import Breadcrumb from '../components/layout/Breadcrumb'
import Pager from '../components/layout/Pager'
import KnowledgeIndex from '../components/layout/KnowledgeIndex'
import InsightPanel from '../components/content/InsightPanel'
import SourceBadges from '../components/content/SourceBadges'
import { DemoHost } from '../components/demos/DemoHost'
import { FigureHost } from '../components/figures/FigureHost'
import QuestionCard from '../components/questions/QuestionCard'
import { QUESTION_TYPE_LABEL, DIFFICULTY_LABEL } from '../components/questions/labels'
import { learningBriefs, subsectionFigures } from '../content/learning'

export default function ChapterPage() {
  const { chapterId = 'ch1', knowledgeId } = useParams()
  const navigate = useNavigate()
  const chapter = chapterById.get(chapterId)
  const k = knowledgeId && knowledgeId !== 'summary' ? knowledgeById.get(knowledgeId) : undefined
  const isSummary = knowledgeId === 'summary'

  const demoRegistry = useMemo(() => demoById, [])

  useEffect(() => {
    if (k) {
      markRecent({ kind: 'knowledge', id: k.id, title: k.title })
    } else if (isSummary && chapter) {
      markRecent({ kind: 'summary', id: chapter.summary.id, title: `${chapter.title} 章节总结` })
    }
  }, [k?.id, isSummary, chapter?.id])

  const isRead = useLiveQuery(async () => {
    if (!k) return false
    const p = await db.progress.get(k.id)
    return !!p?.read
  }, [k?.id])

  if (!chapter) {
    return <div className="card p-6">未找到该章节。</div>
  }

  // ---------------- 章节总结页 ----------------
  if (isSummary) {
    const s = chapter.summary
    const sections: { key: keyof typeof s; title: string; icon: string }[] = [
      { key: 'framework', title: '一、本章知识框架', icon: '🗂' },
      { key: 'background', title: '二、技术提出的背景', icon: '📜' },
      { key: 'mechanisms', title: '三、核心协议与工作机制', icon: '⚙️' },
      { key: 'formulas', title: '四、重点公式与变量', icon: '🧮' },
      { key: 'examPoints', title: '五、高频考点与典型题型', icon: '🎯' },
      { key: 'confusions', title: '六、易混知识辨析', icon: '⚖️' },
      { key: 'misconceptions', title: '七、常见错误理解与纠正', icon: '❗' },
      { key: 'connections', title: '八、与其他章节的联系', icon: '🔗' },
      { key: 'mnemonics', title: '九、记忆口诀与复习建议', icon: '🧠' },
    ]
    const relatedQuestions = (s.questionIds ?? []).map((id) => questionById.get(id)).filter(Boolean)

    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: chapter.title, to: `/chapter/${chapter.id}` }, { label: '章节总结' }]} />
        <header className="card p-6 sm:p-8">
          <div className="text-xs chip mb-3">章节总结</div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{s.title}</h1>
          <p className="muted mt-2 text-sm leading-relaxed">{chapter.intro}</p>
        </header>

        {sections.map((sec) => {
          const blocks = s[sec.key] as any
          if (!blocks || !Array.isArray(blocks) || blocks.length === 0) return null
          return (
            <section key={sec.key} className="card p-5 sm:p-6">
              <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <span>{sec.icon}</span>
                {sec.title}
              </h2>
              <ContentRenderer blocks={blocks} onNavigate={(id) => navigate(resolveNav(id))} demoRegistry={demoRegistry} />
            </section>
          )
        })}

        {relatedQuestions.length > 0 && (
          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-semibold mb-3">本章配套练习</h2>
            <div className="space-y-4">
              {relatedQuestions.map((q) => q && <QuestionCard key={q.id} question={q} />)}
            </div>
          </section>
        )}

        <Pager id={s.id} />
      </div>
    )
  }

  if (!k) {
    return (
      <div className="space-y-6">
        <Breadcrumb items={[{ label: chapter.title, to: `/chapter/${chapter.id}` }]} />
        <header className="card p-6 sm:p-8">
          <div className="text-xs chip mb-3">PPT：{chapter.pptFile}</div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{chapter.title}</h1>
          <p className="muted mt-2 text-sm leading-relaxed">{chapter.intro}</p>
        </header>
        <div className="grid gap-4 sm:grid-cols-2">
          {chapter.sections.map((sec) => (
            <div key={sec.id} className="card p-5">
              <h3 className="font-semibold mb-2">{sec.title}</h3>
              <p className="muted text-xs mb-3">{sec.en}</p>
              <ul className="space-y-1.5">
                {sec.subsections.flatMap((sub) =>
                  sub.knowledge.map((kp) => (
                    <li key={kp.id}>
                      <Link
                        to={`/chapter/${chapter.id}/${kp.id}`}
                        className="text-sm hover:text-brand transition flex items-start gap-1.5"
                      >
                        <span className="text-brand mt-1">·</span>
                        {kp.title}
                      </Link>
                    </li>
                  )),
                )}
              </ul>
            </div>
          ))}
        </div>
        <Link to={`/chapter/${chapter.id}/summary`} className="btn-primary">
          📋 查看本章完整总结
        </Link>
      </div>
    )
  }

  // ---------------- 知识点页 ----------------
  const kFlat = flatKnowledge.find((x) => x.id === k.id)!
  const relatedQs = (k.questionIds ?? []).map((id) => questionById.get(id)).filter(Boolean)
  const demos = (k.demoIds ?? []).map((id) => demoById.get(id)).filter(Boolean)
  const figureEntry = subsectionFigures[kFlat.subsectionId]
  const brief = learningBriefs[k.id] ?? []
  const related = (k.related ?? []).map((id) => knowledgeById.get(id)).filter(Boolean)

  return (
    <div className="flex flex-col xl:flex-row gap-6 items-start">
      <div className="order-2 xl:order-1 flex-1 min-w-0 w-full space-y-5">
      <Breadcrumb
        items={[
          { label: chapter.title, to: `/chapter/${chapter.id}` },
          { label: kFlat.subsectionTitle },
          { label: k.title },
        ]}
      />

      <header className="knowledge-heading">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          {kFlat.slides.length > 0 && (
            <span className="chip">PPT {chapter.pptFile?.replace('.pptx', '')} · 第 {kFlat.slides[0]}{kFlat.slides.length > 1 ? `-${kFlat.slides[kFlat.slides.length - 1]}` : ''} 页</span>
          )}
          {(k.tags ?? []).map((t) => (
            <span key={t} className="chip">{t}</span>
          ))}
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{k.title}</h1>
        {k.en && <p className="muted mt-1 text-xs italic">{k.en}</p>}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setProgress(k.id, !isRead)}
            className={isRead ? 'btn-ghost' : 'btn-primary'}
          >
            {isRead ? '✓ 已标记学完' : '标记为已学完'}
          </button>
          {k.sources?.length ? <details key={k.id} className="source-details"><summary>来源 · {k.sources.length}</summary><SourceBadges sources={k.sources} /></details> : null}
        </div>
      </header>

      {figureEntry && (
        <section className="learning-feature" aria-label="本小节图解与快速学习">
          <div className="learning-figure" aria-label="本小节相关图解">
            <div className="learning-figure-context"><span className="text-xs font-semibold text-brand">图解提示</span><span className="text-sm leading-relaxed">{figureEntry.contextByKnowledge[k.id]}</span></div>
            <FigureHost figureId={figureEntry.figureId} />
          </div>
          <section className="card p-4 sm:p-5 learning-path" aria-labelledby="learning-path-title">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div><p className="text-xs font-semibold tracking-wide text-brand">本小节 · 快速路径</p><h2 id="learning-path-title" className="text-lg font-semibold mt-1">快速学习</h2></div>
              <span className="chip">{brief.length} 个要点</span>
            </div>
            <ul className="learning-brief-list">
              {brief.map((item, index) => (
                <li key={`${k.id}-${index}`}><span className="learning-brief-index">{String(index + 1).padStart(2, '0')}</span><span><ContentRenderer blocks={[{ type: 'p', text: item }]} /></span></li>
              ))}
            </ul>
          </section>
        </section>
      )}

      {demos.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">交互式演示</h2>
          {demos.map((d) => d && <DemoHost key={d.id} demoId={d.id} />)}
        </section>
      )}

      <details key={k.id} className="card full-lesson">
        <summary className="full-lesson-summary">查看完整讲解、推导与来源</summary>
        <div className="full-lesson-content space-y-5">
          {k.insight && <InsightPanel insight={k.insight} />}
          <article className="prose-cn">
            <ContentRenderer blocks={k.blocks} onNavigate={(id) => navigate(resolveNav(id))} demoRegistry={demoRegistry} />
          </article>
        </div>
      </details>

      {related.length > 0 && (
        <section className="card p-5">
          <h2 className="text-sm font-semibold muted mb-2.5">相关知识点</h2>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => r && (
              <Link key={r.id} to={`/chapter/${r.chapterId}/${r.id}`} className="chip hover:text-brand transition">
                → {r.title}
              </Link>
            ))}
          </div>
        </section>
      )}

      {relatedQs.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">配套练习</h2>
          {relatedQs.map((q) => q && <QuestionCard key={q.id} question={q} />)}
        </section>
      )}

      <Pager id={k.id} />
      </div>
      <div className="order-1 xl:order-2 w-full xl:w-auto"><KnowledgeIndex chapterId={chapter.id} activeId={k.id} /></div>
    </div>
  )
}

/** 解析内部引用 ID → 路由路径 */
export function resolveNav(id: string): string {
  if (comparisonById.has(id)) return `/compare/${id}`
  if (demoById.has(id)) return `/demo/${id}`
  if (questionById.has(id)) return `/question/${id}`
  const k = knowledgeById.get(id)
  if (k) return `/chapter/${k.chapterId}/${k.id}`
  return `/`
}
