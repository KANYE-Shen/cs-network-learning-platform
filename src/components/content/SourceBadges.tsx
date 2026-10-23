import type { SourceRef } from '../../types/content'

const KIND_LABEL: Record<string, string> = {
  ppt: 'PPT 讲授',
  supplement: '补充说明',
  kaoyan: '考研考点',
  external: '外部资料',
}

const KIND_STYLE: Record<string, string> = {
  ppt: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  supplement: 'bg-sky-500/12 text-sky-700 dark:text-sky-400',
  kaoyan: 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
  external: 'bg-violet-500/12 text-violet-700 dark:text-violet-400',
}

export default function SourceBadges({ sources }: { sources?: SourceRef[] }) {
  if (!sources || sources.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {sources.map((s, i) => {
        const label = KIND_LABEL[s.kind] ?? s.kind
        const detail =
          s.kind === 'ppt' && s.ppt
            ? `${s.ppt}${s.slides?.length ? ` 第 ${s.slides.join('、')} 页` : ''}`
            : s.label ?? s.note ?? ''
        const content = (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              KIND_STYLE[s.kind] ?? 'chip'
            }`}
            title={s.note ?? detail}
          >
            <span className="opacity-70">{label}</span>
            {detail && <span className="opacity-90">· {detail}</span>}
          </span>
        )
        return s.url ? (
          <a key={i} href={s.url} target="_blank" rel="noreferrer noopener" className="hover:opacity-80">
            {content}
          </a>
        ) : (
          <span key={i}>{content}</span>
        )
      })}
    </div>
  )
}
