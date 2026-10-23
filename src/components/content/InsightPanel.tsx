import type { InsightSet } from '../../types/content'
import { ContentRenderer } from './ContentRenderer'

const TABS = [
  { key: 'why', label: '为什么需要', icon: '❓' },
  { key: 'coreIdea', label: '核心设计思路', icon: '💡' },
  { key: 'mechanism', label: '内部工作机制', icon: '⚙️' },
  { key: 'comparison', label: '对比与局限', icon: '⚖️' },
] as const

export default function InsightPanel({ insight }: { insight: InsightSet }) {
  const available = TABS.filter((t) => insight[t.key])
  if (available.length === 0) return null

  return (
    <section className="card overflow-hidden">
      <div className="px-5 pt-4 pb-0">
        <div className="text-xs font-semibold muted uppercase tracking-wider mb-2.5">四问速览</div>
        <div className="flex flex-wrap gap-1.5">
          {available.map((t) => (
            <span key={t.key} className="chip">
              {t.icon} {t.label}
            </span>
          ))}
        </div>
      </div>
      <div className="p-5 pt-3 space-y-3.5">
        {available.map((t) => (
          <div key={t.key} className="grid sm:grid-cols-[104px_1fr] gap-2 sm:gap-3">
            <div className="text-xs font-semibold text-brand pt-0.5">{t.label}</div>
            <div className="text-[0.94rem] leading-relaxed">
              <ContentRenderer blocks={[{ type: 'p', text: insight[t.key]! }]} />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
