import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { chapterById } from '../../content/registry'

/**
 * 页面内标题定位 + 章节知识点索引（右栏）
 */
export default function KnowledgeIndex({
  chapterId,
  activeId,
}: {
  chapterId: string
  activeId?: string
}) {
  const chapter = chapterById.get(chapterId)
  const [activeHeading, setActiveHeading] = useState<string>('')
  const observerRef = useRef<IntersectionObserver | null>(null)

  // 页面内 h2/h3 标题定位
  useEffect(() => {
    const headings = Array.from(document.querySelectorAll('article h3, article h2'))
    if (!headings.length) return
    const onScroll = () => {
      let current = ''
      for (const h of headings) {
        const top = h.getBoundingClientRect().top
        if (top <= 120) current = h.textContent ?? ''
        else break
      }
      setActiveHeading(current)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [activeId])

  if (!chapter) return null

  const sections = chapter.sections.map((sec) => ({
    id: sec.id,
    title: sec.title,
    items: sec.subsections.flatMap((sub) =>
      sub.knowledge.map((k) => ({ id: k.id, title: k.title, sub: sub.title })),
    ),
  }))

  return (
    <aside className="no-print hidden xl:block w-[210px] shrink-0">
      <div className="sticky top-20 space-y-4">
        <div className="text-[11px] font-semibold muted uppercase tracking-wider">本章知识点</div>
        <nav className="space-y-2.5 max-h-[calc(100vh-140px)] overflow-y-auto pr-1">
          {sections.map((sec) => (
            <div key={sec.id}>
              <div className="text-[11px] font-medium text-brand mb-1">{sec.title}</div>
              <ul className="space-y-0.5 border-l pl-2" style={{ borderColor: 'var(--border)' }}>
                {sec.items.map((it) => (
                  <li key={it.id}>
                    <Link
                      to={`/chapter/${chapterId}/${it.id}`}
                      className={`block text-[11.5px] leading-snug py-0.5 transition ${
                        activeId === it.id ? 'text-brand font-medium' : 'muted hover:text-brand'
                      }`}
                    >
                      {it.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link
            to={`/chapter/${chapterId}/summary`}
            className="block text-[11.5px] py-0.5 text-brand hover:underline"
          >
            📋 章节总结
          </Link>
        </nav>
      </div>
    </aside>
  )
}
