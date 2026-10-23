// ============================================================
// 展示层回归测试：行内富文本、公式归一化、图解注册、裸数学符号
// ============================================================
import { describe, expect, it } from 'vitest'
import { isValidElement, type ReactNode } from 'react'
import { normalizeLatex, renderWithMath } from '../components/content/ContentRenderer'
import { figureRegistry } from '../components/figures/registry'
import { chapters, flatKnowledge } from '../content/registry'
import type { ContentBlock } from '../types/content'

/** 递归收集内容块中的所有字符串字段 */
function collectStrings(node: unknown, out: string[] = []): string[] {
  if (typeof node === 'string') out.push(node)
  else if (Array.isArray(node)) node.forEach((n) => collectStrings(n, out))
  else if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node)) {
      // latex / symbol / unit 是纯数学或单位字段，不参与正文检查
      if (['latex', 'symbol', 'unit', 'id', 'ppt', 'url', 'kind'].includes(key)) continue
      collectStrings(value, out)
    }
  }
  return out
}

/** 去掉 $...$ 与 $$...$$ 后，检查是否仍残留“字母_{字母}”形式的裸下标 */
function bareSubscripts(text: string): string[] {
  const stripped = text.replace(/\$\$[\s\S]+?\$\$|\$[^$\n]+?\$/g, ' ')
  // 只匹配独立出现的数学下标：排除 FIN_WAIT_1 这类状态名与 rdt_send 这类函数名
  return (
    stripped.match(/(?<![A-Za-z0-9_$\\])[A-Za-zρλμ]_\{?[A-Za-z][A-Za-z0-9]*\}?(?![A-Za-z0-9_(])/g) ?? []
  )
}

describe('行内富文本', () => {
  it('**加粗** 渲染为 strong 元素', () => {
    const nodes = renderWithMath('结论是**三次握手**完成')
    const strong = nodes.find((n) => isValidElement(n) && n.type === 'strong')
    expect(strong).toBeTruthy()
  })

  it('==高亮== 渲染为 mark 元素', () => {
    const nodes = renderWithMath('核心是==流量强度==')
    const mark = nodes.find((n) => isValidElement(n) && n.type === 'mark')
    expect(mark).toBeTruthy()
  })

  it('普通文本原样保留，不产生多余标签', () => {
    const nodes = renderWithMath('没有任何强调标记的句子')
    expect(nodes).toEqual(['没有任何强调标记的句子'])
  })

  it('加粗内部可以嵌套公式', () => {
    const nodes = renderWithMath('**速率 $R$**')
    const strong = nodes.find((n) => isValidElement(n) && n.type === 'strong') as
      | { props: { children: ReactNode } }
      | undefined
    expect(strong).toBeTruthy()
    expect(Array.isArray(strong!.props.children) || isValidElement(strong!.props.children)).toBe(true)
  })
})

describe('公式归一化', () => {
  it('多字母下标转为正体', () => {
    expect(normalizeLatex('d_{trans} = \\frac{L}{R}')).toBe('d_{\\mathrm{trans}} = \\frac{L}{R}')
    expect(normalizeLatex('d_{store\\text{-}forward}')).toBe('d_{store\\text{-}forward}')
  })

  it('单字母下标保持斜体', () => {
    expect(normalizeLatex('R_i + x_{k}')).toBe('R_i + x_{k}')
  })
})

describe('图解注册', () => {
  it('内容中引用的每个 figureId 都已注册组件', () => {
    const referenced = flatKnowledge.flatMap((k) => k.figureIds ?? [])
    const missing = referenced.filter((id) => !figureRegistry[id])
    expect(missing).toEqual([])
  })

  it('已注册的图解 ID 都被某个知识点引用（避免孤立组件）', () => {
    const referenced = new Set(flatKnowledge.flatMap((k) => k.figureIds ?? []))
    const orphan = Object.keys(figureRegistry).filter((id) => !referenced.has(id))
    expect(orphan).toEqual([])
  })
})

describe('裸数学符号', () => {
  it('正文中的下标必须包在 $...$ 内（否则不会渲染为公式）', () => {
    const problems: string[] = []
    for (const ch of chapters) {
      const blocks: ContentBlock[][] = [ch.summary.framework, ch.summary.formulas, ch.summary.mechanisms]
      for (const k of flatKnowledge.filter((x) => x.chapterId === ch.id)) {
        blocks.push(k.blocks)
      }
      for (const group of blocks) {
        for (const s of collectStrings(group)) {
          const hits = bareSubscripts(s)
          if (hits.length) problems.push(`${s.slice(0, 40)}… => ${hits.join(' ')}`)
        }
      }
    }
    expect(problems.slice(0, 20)).toEqual([])
  })
})
