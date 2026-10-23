import { describe, it, expect } from 'vitest'
import { comparisons } from '../content/comparisons'
import { chapterOutlines, flattenOutline } from '../content/outline'
import { demoMetas } from '../content/demos'

describe('内容数据完整性', () => {
  it('所有对比表：行数与维度数一致，每行长度与被比较项数一致', () => {
    for (const c of comparisons) {
      expect(c.rows.length, `${c.id} 行数应等于维度数`).toBe(c.dimensions.length)
      c.rows.forEach((row, i) => {
        expect(row.length, `${c.id} 第 ${i} 行长度应等于 subjects 长度`).toBe(c.subjects.length)
      })
      if (c.summary) {
        expect(c.summary.length, `${c.id} summary 长度应等于 subjects 长度`).toBe(c.subjects.length)
      }
      expect(c.dimensions.length, `${c.id} 维度不应为空`).toBeGreaterThan(0)
      expect(c.subjects.length, `${c.id} 被比较项不应为空`).toBeGreaterThan(1)
    }
  })

  it('所有对比表：ID 唯一', () => {
    const ids = comparisons.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('所有对比表：关联的知识点 ID 存在于大纲中', () => {
    const valid = new Set(Object.values(chapterOutlines).flatMap(flattenOutline).map((p) => p.id))
    for (const c of comparisons) {
      for (const k of c.relatedKnowledge ?? []) {
        expect(valid.has(k), `${c.id} 引用了不存在的知识点 ${k}`).toBe(true)
      }
    }
  })

  it('所有演示：ID 唯一、组件名已声明、关联知识点存在', () => {
    const ids = demoMetas.map((d) => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    const valid = new Set(Object.values(chapterOutlines).flatMap(flattenOutline).map((p) => p.id))
    for (const d of demoMetas) {
      expect(d.component, `${d.id} 缺少 component`).toBeTruthy()
      expect(d.summary, `${d.id} 缺少 summary`).toBeTruthy()
      if (d.knowledgeId) {
        expect(valid.has(d.knowledgeId), `${d.id} 引用了不存在的知识点 ${d.knowledgeId}`).toBe(true)
      }
    }
  })

  it('大纲：章节 ID 与知识点 ID 全局唯一', () => {
    const all = Object.values(chapterOutlines).flatMap(flattenOutline)
    const ids = all.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const p of all) {
      expect(p.title, `${p.id} 缺少标题`).toBeTruthy()
      expect(p.slides.length, `${p.id} 应至少关联一页 PPT`).toBeGreaterThan(0)
    }
  })
})
