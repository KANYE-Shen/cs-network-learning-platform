import { describe, it, expect } from 'vitest'
import { questions } from '../content/questions'
import { chapterOutlines, flattenOutline } from '../content/outline'
import { questionById } from '../content/registry'

const validKnowledgeIds = new Set(
  Object.values(chapterOutlines).flatMap(flattenOutline).map((p) => p.id),
)

describe('题库数据完整性', () => {
  it('题目 ID 唯一且非空', () => {
    const ids = questions.map((q) => q.id)
    expect(ids.length).toBeGreaterThan(0)
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id.trim()).toBeTruthy()
  })

  it('每道题的知识点引用有效、章节一致', () => {
    for (const q of questions) {
      expect(q.knowledgeId, `${q.id} 缺少 knowledgeId`).toBeTruthy()
      expect(validKnowledgeIds.has(q.knowledgeId!), `${q.id} 的 knowledgeId 无效: ${q.knowledgeId}`).toBe(true)
      expect(q.chapterId, `${q.id} 缺少 chapterId`).toBeTruthy()
      expect(q.chapterId.startsWith('ch'), `${q.id} 的 chapterId 格式异常`).toBe(true)
      // 章节号应与知识点 ID 的章节号一致
      const kChapter = 'ch' + q.knowledgeId!.slice(1, 2)
      expect(q.chapterId, `${q.id} 章节与知识点不一致`).toBe(kChapter)
    }
  })

  it('每个大纲知识点至少有一道题', () => {
    const covered = new Set(questions.map((q) => q.knowledgeId))
    const missing = [...validKnowledgeIds].filter((id) => !covered.has(id))
    expect(missing, `以下知识点没有题目: ${missing.join(', ')}`).toHaveLength(0)
  })

  it('选择题的每个选项都有独立解析', () => {
    for (const q of questions) {
      if (q.type === 'single' || q.type === 'multiple' || q.type === 'judge') {
        expect(q.options.length, `${q.id} 选项过少`).toBeGreaterThanOrEqual(2)
        for (const o of q.options) {
          expect(o.explain?.trim().length ?? 0, `${q.id} 选项 ${o.key} 缺少解析`).toBeGreaterThan(4)
          expect(o.text?.trim().length ?? 0, `${q.id} 选项 ${o.key} 缺少文本`).toBeGreaterThan(0)
        }
        // 答案中的 key 必须存在
        for (const a of q.answer) {
          expect(q.options.some((o) => o.key === a), `${q.id} 答案 ${a} 不在选项中`).toBe(true)
        }
        expect(q.answer.length, `${q.id} 答案为空`).toBeGreaterThan(0)
        if (q.type === 'single' || q.type === 'judge') {
          expect(q.answer.length, `${q.id} 单选/判断题应只有一个答案`).toBe(1)
        }
        if (q.type === 'multiple') {
          expect(q.answer.length, `${q.id} 多选题应至少两个答案`).toBeGreaterThanOrEqual(2)
        }
      }
    }
  })

  it('判断题的选项固定为 A=正确 / B=错误', () => {
    for (const q of questions) {
      if (q.type === 'judge') {
        expect(q.options.map((o) => o.key).sort(), `${q.id} 判断题选项应为 A、B`).toEqual(['A', 'B'])
      }
    }
  })

  it('题干不泄露答案', () => {
    for (const q of questions) {
      const stemText = q.stem.map((b) => ('text' in b ? b.text : '')).join(' ')
      expect(stemText.trim().length, `${q.id} 题干为空`).toBeGreaterThan(4)
      expect(/正确答案|答案是|答案[:：]\s*[A-D]/i.test(stemText), `${q.id} 题干疑似泄露答案`).toBe(false)
    }
  })

  it('计算题有分步计算过程与答案', () => {
    for (const q of questions) {
      if (q.type === 'numeric') {
        expect(typeof q.answer, `${q.id} 数值题答案应为 number`).toBe('number')
        expect(Number.isFinite(q.answer)).toBe(true)
        expect(q.solutionSteps.length, `${q.id} 数值题缺少分步计算`).toBeGreaterThan(0)
        for (const s of q.solutionSteps) expect(s.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('简答题有参考答案', () => {
    for (const q of questions) {
      if (q.type === 'short') {
        expect(q.referenceAnswer.length, `${q.id} 简答题缺少参考答案`).toBeGreaterThan(0)
      }
    }
  })

  it('每道题都有解析总述', () => {
    for (const q of questions) {
      expect(q.analysis.length, `${q.id} 缺少解析`).toBeGreaterThan(0)
    }
  })

  it('题目标签与难度完整', () => {
    for (const q of questions) {
      expect(['easy', 'medium', 'hard']).toContain(q.difficulty)
      expect(['ppt', 'original', 'kaoyan']).toContain(q.source)
      expect(q.tags.length, `${q.id} 缺少考点标签`).toBeGreaterThan(0)
    }
  })

  it('注册表与题目数组一致', () => {
    expect(questionById.size).toBe(questions.length)
  })
})
