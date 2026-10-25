import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/studyDB'
import { chapters } from '../../content/registry'
import { useSidebar } from '../../hooks/useSidebar'

function ChapterTree({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => Object.fromEntries(
    chapters.flatMap((chapter) => [chapter.id, ...chapter.sections.map((section) => section.id)]).map((id) => [id, true]),
  ))
  const readIds =
    useLiveQuery(async () => new Set((await db.progress.toArray()).filter((p) => p.read).map((p) => p.knowledgeId)), []) ??
    new Set<string>()

  const activeChapter = location.pathname.match(/^\/chapter\/(ch\d)/)?.[1]
  const activeKnowledge = location.pathname.match(/\/(k\d+\.\d+\.\d+)$/)?.[1]
  const activeSection = activeKnowledge
    ? chapters.flatMap((chapter) => chapter.sections).find((section) => section.subsections.some((sub) => sub.knowledge.some((point) => point.id === activeKnowledge)))?.id
    : undefined

  useEffect(() => {
    if (activeChapter) setCollapsed((c) => ({ ...c, [activeChapter]: false, ...(activeSection ? { [activeSection]: false } : {}) }))
  }, [activeChapter, activeSection])

  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }))

  return (
    <nav className="space-y-1">
      {chapters.map((ch) => {
        const isOpen = !collapsed[ch.id]
        const chTotal = ch.sections.reduce(
          (n, s) => n + s.subsections.reduce((m, sub) => m + sub.knowledge.length, 0), 0)
        const chRead = ch.sections.reduce(
          (n, s) => n + s.subsections.reduce((m, sub) => m + sub.knowledge.filter((k) => readIds.has(k.id)).length, 0), 0)
        return (
          <div key={ch.id}>
            <div className="flex items-center gap-1">
              <button
                onClick={() => toggle(ch.id)}
                className="flex-1 flex items-center gap-2 px-2 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--surface-2)] transition text-left"
              >
                <span className={`transition-transform text-muted text-xs ${isOpen ? 'rotate-90' : ''}`}>▶</span>
                <span className="truncate">{ch.title}</span>
              </button>
              <span className="text-[10px] muted tabular-nums pr-1">{chRead}/{chTotal}</span>
            </div>
            {isOpen && (
              <div className="ml-3 pl-3 border-l" style={{ borderColor: 'var(--border)' }}>
                {ch.sections.map((sec) => {
                  const secOpen = !collapsed[sec.id]
                  return (
                    <div key={sec.id} className="mt-0.5">
                      <button
                        onClick={() => toggle(sec.id)}
                        className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[13px] font-medium muted hover:text-brand transition text-left"
                      >
                        <span className={`transition-transform text-[10px] ${secOpen ? 'rotate-90' : ''}`}>▶</span>
                        <span className="truncate">{sec.title}</span>
                      </button>
                      {secOpen && (
                        <div className="ml-3">
                          {sec.subsections.map((sub) => (
                            <div key={sub.id} className="my-1">
                              <div className="px-2 py-0.5 text-[11px] muted/80 font-medium truncate">{sub.title}</div>
                              {sub.knowledge.map((k) => {
                                const isRead = readIds.has(k.id)
                                return (
                                  <NavLink
                                    key={k.id}
                                    to={`/chapter/${ch.id}/${k.id}`}
                                    onClick={onNavigate}
                                    className={({ isActive }) =>
                                      `flex items-start gap-1.5 px-2 py-1 rounded-md text-[13px] transition ${
                                        isActive
                        ? 'bg-[var(--surface-2)] text-brand font-semibold border-l-2 border-brand'
                                          : 'hover:bg-[var(--surface-2)]'
                                      }`
                                    }
                                  >
                                    <span
                                      className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${
                                        isRead ? 'bg-emerald-500' : 'bg-transparent border'
                                      }`}
                                      style={isRead ? undefined : { borderColor: 'var(--border)' }}
                                    />
                                    <span className="leading-snug">{k.title}</span>
                                  </NavLink>
                                )
                              })}
                            </div>
                          ))}
                          <NavLink
                            to={`/chapter/${ch.id}/summary`}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                              `block px-2 py-1 rounded-md text-[13px] transition ${
                                isActive ? 'bg-[var(--surface-2)] text-brand font-medium' : 'hover:bg-[var(--surface-2)]'
                              }`
                            }
                          >
                            章节总结
                          </NavLink>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

export default function Sidebar() {
  const { open, setOpen } = useSidebar()
  const stats = useLiveQuery(async () => {
    const [mistakes, favorites] = await Promise.all([db.mistakes.count(), db.favorites.count()])
    return { mistakes, favorites }
  }, [])

  const groups = [
    { label: '学习', links: [{ to: '/', label: '课程首页', code: '01' }] },
    { label: '练习', links: [
      { to: '/questions', label: '题库练习', code: '02' },
      { to: '/favorites', label: '收藏题本', code: '03', badge: stats?.favorites },
      { to: '/mistakes', label: '错题本', code: '04', badge: stats?.mistakes },
      { to: '/compare', label: '知识对比', code: '05' },
    ] },
    { label: '记录', links: [
      { to: '/progress', label: '学习进度', code: '06' },
      { to: '/backup', label: '数据备份', code: '07' },
    ] },
  ]

  const content = (
    <>
      <div className="sidebar-brand"><span className="sidebar-mark">N</span><span><b>网络学习</b><small>自顶向下 · 交互课程</small></span></div>
      <div className="space-y-3 mb-4">
        {groups.map((group) => <div key={group.label}>
          <div className="sidebar-group-label">{group.label}</div>
          <div className="space-y-0.5">{group.links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}>
              <span className="sidebar-link-code">{l.code}</span><span className="flex-1">{l.label}</span>
              {l.badge ? <span className="chip text-[10px] py-0 px-1.5">{l.badge}</span> : null}
            </NavLink>
          ))}</div>
        </div>)}
      </div>

      <div className="border-t pt-3" style={{ borderColor: 'var(--border)' }}>
        <div className="px-2 pb-1.5 text-[11px] font-semibold muted uppercase tracking-wider flex items-center justify-between"><span>课程目录</span><span className="font-normal">3 章 · 21 节</span></div>
        <ChapterTree onNavigate={() => setOpen(false)} />
      </div>
    </>
  )

  return (
    <>
      {/* 桌面端固定侧栏 */}
      <aside
        className="no-print hidden lg:block w-[264px] shrink-0 h-screen sticky top-0 overflow-y-auto border-r px-3 py-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {content}
      </aside>

      {/* 移动端抽屉 */}
      {open && (
        <div className="no-print lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/45" onClick={() => setOpen(false)} />
          <aside
            className="relative w-[80%] max-w-[300px] h-full overflow-y-auto border-r px-3 py-4 shadow-2xl"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm">课程目录</span>
              <button onClick={() => setOpen(false)} className="btn-ghost !px-2 !py-1 text-sm">✕</button>
            </div>
            {content}
          </aside>
        </div>
      )}
    </>
  )
}
