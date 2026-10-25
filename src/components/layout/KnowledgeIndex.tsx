import { Link } from 'react-router-dom'
import { chapterById } from '../../content/registry'

/** 章节知识点索引；手机端折叠为本章导航。 */
export default function KnowledgeIndex({
  chapterId,
  activeId,
}: {
  chapterId: string
  activeId?: string
}) {
  const chapter = chapterById.get(chapterId)

  if (!chapter) return null

  const sections = chapter.sections.map((sec) => ({
    id: sec.id,
    title: sec.title,
    items: sec.subsections.flatMap((sub) =>
      sub.knowledge.map((k) => ({ id: k.id, title: k.title, sub: sub.title })),
    ),
  }))

  return (
    <>
    <details key={activeId ?? chapterId} className="no-print card xl:hidden w-full mobile-knowledge-index">
      <summary className="px-4 py-3 font-semibold text-sm">本章导航 · {chapter.title}</summary>
      <nav className="px-4 pb-4 max-h-[55vh] overflow-y-auto space-y-3">
        {sections.map((sec) => (
          <div key={sec.id}>
            <div className="text-xs font-semibold text-brand mb-1">{sec.title}</div>
            <ul className="space-y-1 border-l pl-3" style={{ borderColor: 'var(--border)' }}>
              {sec.items.map((it) => <li key={it.id}><Link to={`/chapter/${chapterId}/${it.id}`} className={`block text-sm leading-snug py-1 ${activeId === it.id ? 'text-brand font-semibold' : 'muted'}`}>{it.title}</Link></li>)}
            </ul>
          </div>
        ))}
        <Link to={`/chapter/${chapterId}/summary`} className="block text-sm py-1 text-brand">章节总结</Link>
      </nav>
    </details>
    </>
  )
}
