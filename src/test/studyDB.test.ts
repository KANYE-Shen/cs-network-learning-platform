import 'fake-indexeddb/auto'
import { beforeEach, describe, it, expect } from 'vitest'
import {
  db, submitAttempt, toggleFavorite, removeMistake, setMistakeMastered,
  reAddMistake, getAttemptStats, exportBackup, importBackup, addMistakeManual,
} from '../db/studyDB'

beforeEach(async () => {
  await db.transaction('rw', db.tables, async () => {
    await Promise.all(db.tables.map((t) => t.clear()))
  })
})

describe('首次作答判定与错题本', () => {
  it('首次答错 → 自动加入错题本', async () => {
    await submitAttempt('q-1', ['B'], false)
    const m = await db.mistakes.get('q-1')
    expect(m).toBeTruthy()
    expect(m!.auto).toBe(true)
    expect(m!.mastered).toBe(false)
  })

  it('首次答对 → 不加入错题本', async () => {
    await submitAttempt('q-2', ['A'], true)
    expect(await db.mistakes.get('q-2')).toBeUndefined()
  })

  it('后续做错仍保留记录，但不改变首次判定（不重复加入）', async () => {
    await submitAttempt('q-3', ['A'], true) // 首次答对
    await submitAttempt('q-3', ['B'], false) // 之后答错
    const attempts = await db.attempts.where('questionId').equals('q-3').toArray()
    expect(attempts.length).toBe(2)
    expect(attempts.filter((a) => a.first).length).toBe(1)
    expect(attempts.find((a) => a.first)!.correct).toBe(true)
    // 首次答对的题不应因后续答错而进入错题本
    expect(await db.mistakes.get('q-3')).toBeUndefined()
  })

  it('首次答错后重复答对，错题仍保留在错题本中', async () => {
    await submitAttempt('q-4', ['A'], false)
    await submitAttempt('q-4', ['B'], true)
    expect(await db.mistakes.get('q-4')).toBeTruthy()
    const stats = await getAttemptStats('q-4')
    expect(stats.total).toBe(2)
    expect(stats.correct).toBe(1)
    expect(stats.accuracy).toBe(0.5)
    expect(stats.firstAttempt!.correct).toBe(false)
  })

  it('移除错题不删除原始作答记录', async () => {
    await submitAttempt('q-5', ['A'], false)
    expect(await db.attempts.where('questionId').equals('q-5').count()).toBe(1)
    await removeMistake('q-5')
    expect(await db.mistakes.get('q-5')).toBeUndefined()
    expect(await db.attempts.where('questionId').equals('q-5').count()).toBe(1)
  })

  it('可手动加入 / 重新加入错题', async () => {
    await addMistakeManual('q-6')
    const m = await db.mistakes.get('q-6')
    expect(m).toBeTruthy()
    expect(m!.auto).toBe(false)
    expect(m!.manual).toBe(true)

    await removeMistake('q-6')
    expect(await db.mistakes.get('q-6')).toBeUndefined()

    await reAddMistake('q-6')
    expect(await db.mistakes.get('q-6')).toBeTruthy()
  })

  it('可标记已掌握并取消', async () => {
    await submitAttempt('q-7', ['A'], false)
    await setMistakeMastered('q-7', true)
    expect((await db.mistakes.get('q-7'))!.mastered).toBe(true)
    await setMistakeMastered('q-7', false)
    expect((await db.mistakes.get('q-7'))!.mastered).toBe(false)
  })
})

describe('收藏', () => {
  it('收藏与取消收藏可切换', async () => {
    expect(await toggleFavorite('q-8')).toBe(true)
    expect(await db.favorites.get('q-8')).toBeTruthy()
    expect(await toggleFavorite('q-8')).toBe(false)
    expect(await db.favorites.get('q-8')).toBeUndefined()
  })

  it('收藏与错题本相互独立，同一题可同时存在', async () => {
    await toggleFavorite('q-9')
    await submitAttempt('q-9', ['A'], false)
    expect(await db.favorites.get('q-9')).toBeTruthy()
    expect(await db.mistakes.get('q-9')).toBeTruthy()
  })
})

describe('备份导出与导入', () => {
  it('导出包含全部学习数据', async () => {
    await submitAttempt('q-10', ['A'], false)
    await toggleFavorite('q-11')
    await db.progress.put({ knowledgeId: 'k1.1.1', read: true, updatedAt: Date.now() })
    const b = await exportBackup()
    expect(b.app).toBe('cs-web-study')
    expect(b.data.attempts.length).toBe(1)
    expect(b.data.favorites.length).toBe(1)
    expect(b.data.progress.length).toBe(1)
    expect(b.data.mistakes.length).toBe(1)
  })

  it('合并模式导入不会丢失现有数据', async () => {
    await submitAttempt('q-12', ['A'], false)
    const b = await exportBackup()
    await db.attempts.clear()
    await db.favorites.clear()
    await db.mistakes.clear()
    const r = await importBackup(JSON.stringify(b), 'merge')
    expect(r.addedAttempts).toBe(1)
    expect(await db.attempts.count()).toBe(1)
    expect(await db.mistakes.count()).toBe(1)
  })

  it('覆盖模式导入完全替换', async () => {
    await submitAttempt('q-13', ['A'], false)
    const b = await exportBackup()
    await submitAttempt('q-14', ['B'], true)
    await importBackup(JSON.stringify(b), 'replace')
    const ids = (await db.attempts.toArray()).map((a) => a.questionId)
    expect(ids).toContain('q-13')
    expect(ids).not.toContain('q-14')
  })

  it('拒绝格式非法的备份文件，且不破坏现有数据', async () => {
    await submitAttempt('q-15', ['A'], false)
    await expect(importBackup('not json', 'merge')).rejects.toThrow(/JSON/)
    await expect(importBackup('{"foo":1}', 'merge')).rejects.toThrow(/来源/)
    await expect(importBackup('{"app":"cs-web-study","schemaVersion":999}', 'merge')).rejects.toThrow(/版本/)
    expect(await db.attempts.count()).toBe(1)
  })

  it('导入时跳过损坏记录而非整体失败', async () => {
    const b = await exportBackup()
    const broken = {
      ...b,
      data: { ...b.data, attempts: [{ questionId: 'q-16', at: 1, first: true, correct: true, answer: [] }, { bogus: true }] },
    }
    const r = await importBackup(JSON.stringify(broken), 'merge')
    expect(r.skippedCorrupt).toBe(1)
    expect(r.addedAttempts).toBe(1)
  })

  it('内容更新后旧数据仍可访问（增量更新兼容性）', async () => {
    await submitAttempt('q-legacy', ['A'], false)
    await toggleFavorite('q-legacy')
    await db.progress.put({ knowledgeId: 'k-legacy', read: true, updatedAt: Date.now() })

    // 模拟内容更新：重新导出再导入，记录 ID 不变
    const b = await exportBackup()
    await db.attempts.clear()
    await importBackup(JSON.stringify(b), 'merge')

    const m = await db.mistakes.get('q-legacy')
    expect(m).toBeTruthy()
    expect(await db.favorites.get('q-legacy')).toBeTruthy()
    expect(await db.progress.get('k-legacy')).toBeTruthy()
  })
})
