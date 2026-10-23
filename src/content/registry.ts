// ============================================================
// 内容注册中心：汇总所有章节、题目、对比表、演示
// 内容以数据形式存在于此，组件只负责渲染
// ============================================================
import type { Chapter, ComparisonTable, DemoMeta, KnowledgePoint, Question } from '../types/content'
import { chapterOutlines, flattenOutline } from './outline'

import { ch1 } from './chapters/ch1'
import { ch2 } from './chapters/ch2'
import { ch3 } from './chapters/ch3'
import { questions } from './questions/index'
import { comparisons } from './comparisons'
import { demoMetas } from './demos'

export const chapters: Chapter[] = [ch1, ch2, ch3]

export { comparisons, questions }

export const chapterById = new Map(chapters.map((c) => [c.id, c]))

/** 扁平化所有知识点，带上章节/小节信息，便于搜索与交叉引用 */
export interface FlatKnowledge extends KnowledgePoint {
  chapterId: string
  chapterTitle: string
  sectionId: string
  sectionTitle: string
  subsectionId: string
  subsectionTitle: string
  slides: number[]
  pptFile?: string
}

export const flatKnowledge: FlatKnowledge[] = chapters.flatMap((ch) =>
  ch.sections.flatMap((sec) =>
    sec.subsections.flatMap((sub) =>
      sub.knowledge.map((k) => {
        const outline = chapterOutlines[ch.id]?.flatMap((s) => s.subs).find((s) => s.id === sub.id)
        const point = outline?.points.find((p) => p.id === k.id)
        return {
          ...k,
          chapterId: ch.id,
          chapterTitle: ch.title,
          sectionId: sec.id,
          sectionTitle: sec.title,
          subsectionId: sub.id,
          subsectionTitle: sub.title,
          slides: point?.slides ?? [],
          pptFile: ch.pptFile,
        }
      }),
    ),
  ),
)

export const knowledgeById = new Map(flatKnowledge.map((k) => [k.id, k]))

export const questionById = new Map<string, Question>(questions.map((q) => [q.id, q]))
export const comparisonById = new Map<string, ComparisonTable>(comparisons.map((c) => [c.id, c]))
export const demoById = new Map<string, DemoMeta>(demoMetas.map((d) => [d.id, d]))

export const validQuestionIds = new Set(questionById.keys())
export const validKnowledgeIds = new Set(knowledgeById.keys())

/** 每个知识点按顺序展开后的“阅读序列”，用于上一节/下一节导航 */
export interface NavNode {
  kind: 'knowledge' | 'summary' | 'demo' | 'comparison'
  id: string
  title: string
  chapterId: string
  path: string
}

export const navNodes: NavNode[] = chapters.flatMap((ch) => {
  const nodes: NavNode[] = []
  for (const sec of ch.sections) {
    for (const sub of sec.subsections) {
      for (const k of sub.knowledge) {
        nodes.push({
          kind: 'knowledge',
          id: k.id,
          title: k.title,
          chapterId: ch.id,
          path: `/chapter/${ch.id}/${k.id}`,
        })
      }
    }
  }
  nodes.push({
    kind: 'summary',
    id: ch.summary.id,
    title: `${ch.title} · 章节总结`,
    chapterId: ch.id,
    path: `/chapter/${ch.id}/summary`,
  })
  return nodes
})

export const navIndex = new Map(navNodes.map((n, i) => [n.id, i]))

export function getNavNeighbors(id: string): { prev?: NavNode; next?: NavNode } {
  const i = navIndex.get(id)
  if (i === undefined) return {}
  return { prev: navNodes[i - 1], next: navNodes[i + 1] }
}

/** 章节中的全部知识点 ID（用于章节总结和章节进度） */
export function chapterKnowledgeIds(chapterId: string): string[] {
  const ch = chapterById.get(chapterId)
  if (!ch) return []
  return ch.sections.flatMap((s) => s.subsections.flatMap((sub) => sub.knowledge.map((k) => k.id)))
}

/** 某个知识点的关联题目 */
export function questionsForKnowledge(knowledgeId: string): Question[] {
  return questions.filter((q) => q.knowledgeId === knowledgeId)
}

/** 全局搜索：知识点 + 题目 */
export interface SearchHit {
  kind: 'knowledge' | 'question'
  id: string
  title: string
  subtitle: string
  path: string
  score: number
}

export function search(query: string, limit = 30): SearchHit[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const hits: SearchHit[] = []

  for (const k of flatKnowledge) {
    const hay = `${k.title} ${k.en ?? ''} ${k.summary} ${(k.tags ?? []).join(' ')}`.toLowerCase()
    const idx = hay.indexOf(q)
    if (idx >= 0) {
      hits.push({
        kind: 'knowledge',
        id: k.id,
        title: k.title,
        subtitle: `${k.chapterTitle} · ${k.subsectionTitle}`,
        path: `/chapter/${k.chapterId}/${k.id}`,
        score: idx === 0 ? 100 : 60 - Math.min(30, idx / 4),
      })
    }
  }
  for (const question of questions) {
    const stem = question.stem
      .map((b) => (b.type === 'p' ? b.text : b.type === 'h' ? b.text : ''))
      .join(' ')
    const hay = `${stem} ${question.tags.join(' ')}`.toLowerCase()
    const idx = hay.indexOf(q)
    if (idx >= 0) {
      hits.push({
        kind: 'question',
        id: question.id,
        title: stem.slice(0, 60) + (stem.length > 60 ? '…' : ''),
        subtitle: `题目 · ${question.tags.join(' / ')}`,
        path: `/question/${question.id}`,
        score: 40,
      })
    }
  }
  for (const c of comparisons) {
    const hay = `${c.title} ${c.tags.join(' ')} ${c.subjects.join(' ')}`.toLowerCase()
    if (hay.includes(q)) {
      hits.push({
        kind: 'knowledge',
        id: c.id,
        title: c.title,
        subtitle: '对比表',
        path: `/compare/${c.id}`,
        score: 50,
      })
    }
  }
  return hits.sort((a, b) => b.score - a.score).slice(0, limit)
}

/** 覆盖统计 */
export function coverageStats() {
  const outlinePoints = Object.values(chapterOutlines).flatMap(flattenOutline)
  const implemented = new Set(flatKnowledge.map((k) => k.id))
  const missing = outlinePoints.filter((p) => !implemented.has(p.id))
  const perChapter = Object.entries(chapterOutlines).map(([cid, sections]) => {
    const pts = flattenOutline(sections)
    return {
      chapterId: cid,
      total: pts.length,
      implemented: pts.filter((p) => implemented.has(p.id)).length,
    }
  })
  return { total: outlinePoints.length, implemented: implemented.size, missing, perChapter }
}

/** 内容版本号：随内容更新变化，用于记录用户数据对应的内容版本 */
export const CONTENT_VERSION = '2026.10.22-v1'
