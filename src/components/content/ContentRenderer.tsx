// ============================================================
// 内容块渲染器：把结构化 ContentBlock 渲染为富文本
// 行内语法：$...$ 与 $$...$$（LaTeX）、**加粗**（关键结论）、==高亮==（核心术语）
// ============================================================
import { memo, useMemo } from 'react'
import katex from 'katex'
import 'katex/dist/katex.min.css'
import type { ContentBlock } from '../../types/content'

/**
 * 公式归一化：多字母下标使用正体，例如 d_{trans} → d_{\mathrm{trans}}。
 * 单字母下标（如 R_i）保持斜体，符合数学排版习惯。
 */
export function normalizeLatex(latex: string): string {
  return latex.replace(/_\{([A-Za-z]{2,}(?:-[A-Za-z]+)?)\}/g, '_{\\mathrm{$1}}')
}

/** 只处理 $...$ 与 $$...$$，返回 React 节点 */
function renderMath(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g
  let last = 0
  let match: RegExpExecArray | null
  let i = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const raw = match[0]
    const display = raw.startsWith('$$')
    const latex = normalizeLatex(display ? raw.slice(2, -2) : raw.slice(1, -1))
    try {
      const html = katex.renderToString(latex, {
        displayMode: display,
        throwOnError: false,
        strict: 'ignore',
        output: 'html',
      })
      nodes.push(
        <span
          key={`${keyPrefix}-${i++}`}
          className={display ? 'block' : 'inline-block'}
          dangerouslySetInnerHTML={{ __html: html }}
        />,
      )
    } catch {
      nodes.push(raw)
    }
    last = match.index + raw.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

/**
 * 解析行内富文本：**加粗** 与 ==高亮== 可以包含 $...$ 公式。
 * 普通文本段落交给 renderMath 处理。
 */
export function renderWithMath(text: string, keyPrefix = 'm'): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const emphasis = /(\*\*[^*\n]+?\*\*|==[^=\n]+?==)/g
  let last = 0
  let match: RegExpExecArray | null
  let i = 0
  while ((match = emphasis.exec(text)) !== null) {
    if (match.index > last) nodes.push(...renderMath(text.slice(last, match.index), `${keyPrefix}-t${i}`))
    const raw = match[0]
    const isBold = raw.startsWith('**')
    const inner = raw.slice(2, -2)
    const key = `${keyPrefix}-e${i++}`
    nodes.push(
      isBold ? (
        <strong key={key} className="font-semibold">
          {renderMath(inner, key)}
        </strong>
      ) : (
        <mark key={key} className="hl">
          {renderMath(inner, key)}
        </mark>
      ),
    )
    last = match.index + raw.length
  }
  if (last < text.length) nodes.push(...renderMath(text.slice(last), `${keyPrefix}-t${i}`))
  return nodes
}

export function Inline({ text }: { text: string }) {
  const nodes = useMemo(() => renderWithMath(text), [text])
  return <>{nodes}</>
}

const TONE_STYLE: Record<string, { bg: string; border: string; label: string }> = {
  note: { bg: 'rgba(50,85,219,0.07)', border: 'var(--brand)', label: '说明' },
  why: { bg: 'rgba(22,160,120,0.09)', border: '#16a078', label: '为什么' },
  warning: { bg: 'rgba(220,120,40,0.10)', border: '#dc7828', label: '易错' },
  exam: { bg: 'rgba(200,60,120,0.09)', border: '#c83c78', label: '考点' },
  tip: { bg: 'rgba(140,90,200,0.09)', border: '#8c5ac8', label: '记忆' },
}

export const ContentRenderer = memo(function ContentRenderer({
  blocks,
  onNavigate,
  demoRegistry,
}: {
  blocks: ContentBlock[]
  onNavigate?: (id: string) => void
  demoRegistry?: Map<string, { title: string }>
}) {
  if (!blocks || blocks.length === 0) {
    return <p className="muted text-sm italic">（该部分内容正在整理中）</p>
  }
  return (
    <div className="prose-cn">
      {blocks.map((b, idx) => {
        const key = `blk-${idx}`
        switch (b.type) {
          case 'p':
            return (
              <p key={key} className="leading-relaxed">
                <Inline text={b.text} />
              </p>
            )
          case 'h':
            return (
              <h3
                key={key}
                className={b.level === 4 ? 'text-base font-semibold mt-5 mb-1.5' : 'text-lg font-semibold mt-6 mb-2'}
              >
                <Inline text={b.text} />
              </h3>
            )
          case 'list':
            return b.ordered ? (
              <ol key={key} className="list-decimal pl-6 space-y-1.5 my-2 marker:text-brand">
                {b.items.map((it, i) => (
                  <li key={i} className="leading-relaxed">
                    <Inline text={it} />
                  </li>
                ))}
              </ol>
            ) : (
              <ul key={key} className="list-disc pl-6 space-y-1.5 my-2 marker:text-brand">
                {b.items.map((it, i) => (
                  <li key={i} className="leading-relaxed">
                    <Inline text={it} />
                  </li>
                ))}
              </ul>
            )
          case 'callout': {
            const st = TONE_STYLE[b.tone] ?? TONE_STYLE.note
            return (
              <div
                key={key}
                className="my-3 rounded-r-lg border-l-4 py-2.5 px-3.5 text-[0.95rem]"
                style={{ background: st.bg, borderColor: st.border }}
              >
                <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                  <span
                    className="text-[11px] px-1.5 py-0.5 rounded"
                    style={{ background: st.border, color: '#fff' }}
                  >
                    {st.label}
                  </span>
                  {b.title && <span><Inline text={b.title} /></span>}
                </div>
                <div className="leading-relaxed">
                  <Inline text={b.text} />
                </div>
              </div>
            )
          }
          case 'formula':
            return (
              <figure key={key} className="my-4">
                <div className="rounded-lg surface-2 px-4 py-3 overflow-x-auto">
                  <Formula latex={b.latex} display={b.display !== false} />
                </div>
                {b.caption && (
                  <figcaption className="muted text-xs mt-1.5 text-center">
                    <Inline text={b.caption} />
                  </figcaption>
                )}
              </figure>
            )
          case 'vars':
            return (
              <div key={key} className="my-3 surface rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="surface-2 text-left">
                      <th className="px-3 py-2 font-semibold w-32">符号</th>
                      <th className="px-3 py-2 font-semibold">含义</th>
                      <th className="px-3 py-2 font-semibold w-24">单位</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.items.map((v, i) => (
                      <tr key={i} className="border-t" style={{ borderColor: 'var(--border)' }}>
                        <td className="px-3 py-1.5 align-top">
                          <Formula latex={v.symbol} inline />
                        </td>
                        <td className="px-3 py-1.5 align-top leading-relaxed">
                          <Inline text={v.meaning} />
                        </td>
                        <td className="px-3 py-1.5 align-top muted">
                          {v.unit ? <Inline text={v.unit} /> : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'example':
            return (
              <div key={key} className="my-3 card p-4">
                {b.title && (
                  <div className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                    <Inline text={b.title} />
                  </div>
                )}
                <ol className="space-y-2 list-decimal pl-5 marker:text-brand marker:text-sm">
                  {b.steps.map((s, i) => (
                    <li key={i} className="text-[0.94rem] leading-relaxed">
                      <Inline text={s} />
                    </li>
                  ))}
                </ol>
                {b.answer && (
                  <div
                    className="mt-3 rounded-lg px-3 py-2 text-sm"
                    style={{ background: 'rgba(22,160,120,0.09)' }}
                  >
                    <span className="font-semibold text-[#16a078]">答案：</span>
                    <Inline text={b.answer} />
                  </div>
                )}
              </div>
            )
          case 'table':
            return (
              <figure key={key} className="my-4">
                <div className="surface rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="surface-2">
                        {b.headers.map((h, i) => (
                          <th key={i} className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                            <Inline text={h} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {b.rows.map((row, ri) => (
                        <tr key={ri} className="border-t" style={{ borderColor: 'var(--border)' }}>
                          {row.map((cell, ci) => (
                            <td key={ci} className="px-3 py-2 align-top leading-relaxed">
                              <Inline text={cell} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {b.caption && (
                  <figcaption className="muted text-xs mt-1.5 text-center">
                    <Inline text={b.caption} />
                  </figcaption>
                )}
              </figure>
            )
          case 'term':
            return (
              <div key={key} className="my-2.5">
                <span className="font-semibold">{b.zh}</span>
                <span className="muted text-sm ml-2">
                  {b.en}
                  {b.abbr ? ` (${b.abbr})` : ''}
                </span>
                <div className="text-[0.94rem] mt-0.5 leading-relaxed">
                  <Inline text={b.def} />
                </div>
              </div>
            )
          case 'kv':
            return (
              <div key={key} className="my-3 card p-4">
                {b.title && (
                  <div className="font-semibold text-sm mb-2">
                    <Inline text={b.title} />
                  </div>
                )}
                <dl className="space-y-2 text-sm">
                  {b.items.map((it, i) => (
                    <div key={i} className="flex flex-col sm:flex-row gap-1 sm:gap-3">
                      <dt className="font-medium shrink-0 sm:w-40 muted">
                        <Inline text={it.k} />
                      </dt>
                      <dd className="flex-1 leading-relaxed">
                        <Inline text={it.v} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )
          case 'quote':
            return (
              <blockquote
                key={key}
                className="my-3 pl-4 border-l-2 italic muted"
                style={{ borderColor: 'var(--brand)' }}
              >
                <Inline text={b.text} />
                {b.cite && (
                  <div className="text-xs not-italic mt-1">
                    —— <Inline text={b.cite} />
                  </div>
                )}
              </blockquote>
            )
          case 'compareRef':
            return (
              <button
                key={key}
                onClick={() => onNavigate?.(b.compareId)}
                className="my-2 inline-flex items-center gap-1.5 chip hover:text-brand"
              >
                <span className="text-brand">⇄</span>
                {b.label ?? '查看对比表'}
              </button>
            )
          case 'demoRef':
            return (
              <button
                key={key}
                onClick={() => onNavigate?.(b.demoId)}
                className="my-2 inline-flex items-center gap-1.5 chip hover:text-brand"
              >
                <span className="text-brand">▶</span>
                {b.label ?? demoRegistry?.get(b.demoId)?.title ?? '打开交互演示'}
              </button>
            )
          case 'knowledgeRef':
            return (
              <button
                key={key}
                onClick={() => onNavigate?.(b.knowledgeId)}
                className="my-2 inline-flex items-center gap-1.5 chip hover:text-brand"
              >
                <span className="text-brand">→</span>
                {b.label ?? '跳转到相关知识点'}
              </button>
            )
          case 'figure':
            return (
              <figure key={key} className="my-4">
                {b.ascii ? (
                  <pre
                    className="surface-2 rounded-lg p-4 text-xs overflow-x-auto leading-relaxed mono"
                    style={{ color: 'var(--text)' }}
                  >
                    {b.ascii}
                  </pre>
                ) : b.src ? (
                  <img src={b.src} alt={b.alt} className="rounded-lg surface w-full" />
                ) : null}
                <figcaption className="muted text-xs mt-1.5 text-center">
                  <Inline text={b.caption ?? b.alt} />
                </figcaption>
              </figure>
            )
          default:
            return null
        }
      })}
    </div>
  )
})

export function Formula({ latex, display = true, inline = false }: { latex: string; display?: boolean; inline?: boolean }) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(normalizeLatex(latex), {
        displayMode: display && !inline,
        throwOnError: false,
        strict: 'ignore',
        output: 'html',
      })
    } catch {
      return `<code>${latex}</code>`
    }
  }, [latex, display, inline])
  return <span dangerouslySetInnerHTML={{ __html: html }} />
}
