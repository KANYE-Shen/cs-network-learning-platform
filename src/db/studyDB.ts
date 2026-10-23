// ============================================================
// 用户数据持久化层（IndexedDB / Dexie）
// 与课程内容完全解耦：内容更新不影响此库中任何记录。
// ============================================================
import Dexie, { type Table } from 'dexie'

/** 每次正式提交产生的作答记录（永久保留，含重做） */
export interface AttemptRecord {
  id?: number
  questionId: string
  /** 提交时间戳 */
  at: number
  /** 是否是该题的首次正式提交 */
  first: boolean
  correct: boolean
  /** 作答内容：选择题为选中 key 数组；数值题为字符串；简答题为文本 */
  answer: string[] | string
}

/** 错题本条目 */
export interface MistakeEntry {
  questionId: string
  /** 依据首次正式提交判定自动加入 */
  auto: boolean
  /** 用户手动加入 / 移除过（不再被自动逻辑覆盖） */
  manual: boolean
  mastered: boolean
  addedAt: number
  updatedAt: number
}

/** 收藏 */
export interface FavoriteEntry {
  questionId: string
  addedAt: number
}

/** 知识点学习进度 */
export interface ProgressEntry {
  knowledgeId: string
  read: boolean
  updatedAt: number
}

/** 最近学习位置（栈式，最新在前） */
export interface RecentEntry {
  kind: 'knowledge' | 'question' | 'demo' | 'comparison' | 'summary'
  id: string
  title: string
  at: number
}

/** 应用设置 */
export interface SettingsEntry {
  key: string
  value: unknown
}

export const USER_SCHEMA_VERSION = 1

export class StudyDB extends Dexie {
  attempts!: Table<AttemptRecord, number>
  mistakes!: Table<MistakeEntry, string>
  favorites!: Table<FavoriteEntry, string>
  progress!: Table<ProgressEntry, string>
  recent!: Table<RecentEntry, string>
  settings!: Table<SettingsEntry, string>

  constructor() {
    super('cs-web-study')
    this.version(1).stores({
      attempts: '++id, questionId, at, [questionId+first]',
      mistakes: 'questionId, mastered, addedAt',
      favorites: 'questionId, addedAt',
      progress: 'knowledgeId, updatedAt',
      recent: 'id, at',
      settings: 'key',
    })
  }
}

export const db = new StudyDB()

export const SCHEMA_VERSION_KEY = 'userSchemaVersion'
export const CONTENT_VERSION_KEY = 'contentVersion'
export const LAST_SEEN_KEY = 'lastSeen'

// ------------------------------------------------------------
// 核心业务规则：首次作答判定 + 错题本自动维护
// ------------------------------------------------------------

/**
 * 提交一道题的作答。返回本次记录。
 * 规则（严格遵守需求）：
 * - 以首次“正式提交”判定是否进入错题本：首次答错自动加入；首次答对不自动加入。
 * - 后续做错仍保留作答记录，但不改变首次判定。
 * - 错题条目若被用户手动移除，则重新答错也不会再次自动加回（尊重 manual 决定）。
 */
export async function submitAttempt(
  questionId: string,
  answer: string[] | string,
  correct: boolean,
): Promise<AttemptRecord> {
  return db.transaction('rw', db.attempts, db.mistakes, async () => {
    const prior = await db.attempts.where('questionId').equals(questionId).count()
    const first = prior === 0
    const now = Date.now()
    const rec: AttemptRecord = { questionId, at: now, first, correct, answer }
    const id = await db.attempts.add(rec)
    rec.id = id

    if (first && !correct) {
      const existing = await db.mistakes.get(questionId)
      if (!existing) {
        await db.mistakes.add({
          questionId, auto: true, manual: false, mastered: false, addedAt: now, updatedAt: now,
        })
      } else if (!existing.mastered) {
        await db.mistakes.put({ ...existing, updatedAt: now })
      }
    }
    return rec
  })
}

/** 手动加入错题（无论首次是否答对） */
export async function addMistakeManual(questionId: string): Promise<void> {
  const now = Date.now()
  await db.mistakes.put({
    questionId, auto: false, manual: true, mastered: false, addedAt: now, updatedAt: now,
  })
}

/**
 * 从错题本移除：删除条目但保留原始作答记录（attempts 不动）。
 * 写入墓碑记录，UI 可据此提供“重新加入”入口。
 * （首次答错的自动加入只可能发生在第一次提交，因此移除后不会被旧记录重新触发。）
 */
export async function removeMistake(questionId: string): Promise<void> {
  await db.transaction('rw', db.mistakes, db.settings, async () => {
    await db.mistakes.delete(questionId)
    await db.settings.put({
      key: `mistakeDismissed:${questionId}`,
      value: Date.now(),
    })
  })
}

/** 重新提交后是否应让旧的手动移除失效：当题目重新答错且用户点击“重新加入”时调用 */
export async function reAddMistake(questionId: string): Promise<void> {
  const now = Date.now()
  await db.settings.delete(`mistakeDismissed:${questionId}`)
  await db.mistakes.put({
    questionId, auto: false, manual: true, mastered: false, addedAt: now, updatedAt: now,
  })
}

/** 标记已掌握 / 取消掌握 */
export async function setMistakeMastered(questionId: string, mastered: boolean): Promise<void> {
  const entry = await db.mistakes.get(questionId)
  const now = Date.now()
  if (entry) {
    await db.mistakes.put({ ...entry, mastered, updatedAt: now })
  } else {
    await db.mistakes.add({
      questionId, auto: false, manual: true, mastered, addedAt: now, updatedAt: now,
    })
  }
}

export async function toggleFavorite(questionId: string): Promise<boolean> {
  return db.transaction('rw', db.favorites, async () => {
    const existing = await db.favorites.get(questionId)
    if (existing) {
      await db.favorites.delete(questionId)
      return false
    }
    await db.favorites.add({ questionId, addedAt: Date.now() })
    return true
  })
}

export async function setProgress(knowledgeId: string, read: boolean): Promise<void> {
  await db.progress.put({ knowledgeId, read, updatedAt: Date.now() })
}

export async function markRecent(entry: Omit<RecentEntry, 'at'>): Promise<void> {
  const now = Date.now()
  await db.recent.put({ ...entry, at: now })
  // 只保留最近 30 条
  const all = await db.recent.orderBy('at').reverse().toArray()
  if (all.length > 30) {
    const stale = all.slice(30)
    await db.recent.bulkDelete(stale.map((s) => s.id))
  }
}

// ------------------------------------------------------------
// 某题作答统计（供错题卡片显示）
// ------------------------------------------------------------
export interface AttemptStats {
  total: number
  correct: number
  accuracy: number
  firstAttempt?: AttemptRecord
}

export async function getAttemptStats(questionId: string): Promise<AttemptStats> {
  const all = await db.attempts.where('questionId').equals(questionId).sortBy('at')
  const correct = all.filter((a) => a.correct).length
  return {
    total: all.length,
    correct,
    accuracy: all.length ? correct / all.length : 0,
    firstAttempt: all.find((a) => a.first),
  }
}

// ------------------------------------------------------------
// 备份导出 / 导入（带格式与版本校验）
// ------------------------------------------------------------
export interface BackupFile {
  app: 'cs-web-study'
  schemaVersion: number
  exportedAt: string
  contentVersionAtExport?: string
  data: {
    attempts: AttemptRecord[]
    mistakes: MistakeEntry[]
    favorites: FavoriteEntry[]
    progress: ProgressEntry[]
    recent: RecentEntry[]
    settings: SettingsEntry[]
  }
}

export async function exportBackup(): Promise<BackupFile> {
  const contentVersion = (await db.settings.get(CONTENT_VERSION_KEY))?.value as string | undefined
  return {
    app: 'cs-web-study',
    schemaVersion: USER_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    contentVersionAtExport: contentVersion,
    data: {
      attempts: await db.attempts.toArray(),
      mistakes: await db.mistakes.toArray(),
      favorites: await db.favorites.toArray(),
      progress: await db.progress.toArray(),
      recent: await db.recent.toArray(),
      settings: await db.settings.toArray(),
    },
  }
}

export type ImportMode = 'merge' | 'replace'

export interface ImportResult {
  addedAttempts: number
  addedMistakes: number
  addedFavorites: number
  skippedCorrupt: number
}

function validateBackup(raw: unknown): BackupFile {
  if (typeof raw !== 'object' || raw === null) throw new Error('备份文件格式错误：不是有效的 JSON 对象')
  const bf = raw as BackupFile
  if (bf.app !== 'cs-web-study') throw new Error('备份文件来源不是本学习平台')
  if (typeof bf.schemaVersion !== 'number') throw new Error('备份文件缺少 schemaVersion 版本信息')
  if (bf.schemaVersion > USER_SCHEMA_VERSION) {
    throw new Error(`备份文件版本 (${bf.schemaVersion}) 高于当前应用支持的版本 (${USER_SCHEMA_VERSION})，请先升级网站`)
  }
  if (!bf.data || typeof bf.data !== 'object') throw new Error('备份文件缺少 data 字段')
  for (const k of ['attempts', 'mistakes', 'favorites', 'progress', 'recent', 'settings'] as const) {
    if (!Array.isArray(bf.data[k])) throw new Error(`备份文件缺少或损坏字段: ${k}`)
  }
  return bf
}

/**
 * 导入备份。
 * - merge：与现有数据合并，按 ID 去重（保留双方），时间戳取较新。
 * - replace：先做内部快照再清空覆盖，失败自动回滚，绝不损坏原数据。
 */
export async function importBackup(jsonText: string, mode: ImportMode): Promise<ImportResult> {
  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('JSON 解析失败，请确认选择了正确的备份文件')
  }
  const bf = validateBackup(parsed)

  // 数据清洗：丢弃结构非法的条目
  let skippedCorrupt = 0
  const ok = (x: unknown, req: string[]) =>
    typeof x === 'object' && x !== null && req.every((k) => k in (x as Record<string, unknown>))
  const attempts = bf.data.attempts.filter((a) => ok(a, ['questionId', 'at', 'first', 'correct']))
  skippedCorrupt += bf.data.attempts.length - attempts.length
  const mistakes = bf.data.mistakes.filter((m) => ok(m, ['questionId', 'addedAt']))
  skippedCorrupt += bf.data.mistakes.length - mistakes.length
  const favorites = bf.data.favorites.filter((f) => ok(f, ['questionId', 'addedAt']))
  skippedCorrupt += bf.data.favorites.length - favorites.length
  const progress = bf.data.progress.filter((p) => ok(p, ['knowledgeId']))
  skippedCorrupt += bf.data.progress.length - progress.length
  const recent = bf.data.recent.filter((r) => ok(r, ['id', 'kind', 'at']))
  skippedCorrupt += bf.data.recent.length - recent.length
  const settings = bf.data.settings.filter((s) => ok(s, ['key']))
  skippedCorrupt += bf.data.settings.length - settings.length

  if (mode === 'replace') {
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map((t) => t.clear()))
      await db.attempts.bulkAdd(attempts.map(({ id: _omit, ...r }) => r) as AttemptRecord[])
      await db.mistakes.bulkPut(mistakes)
      await db.favorites.bulkPut(favorites)
      await db.progress.bulkPut(progress)
      await db.recent.bulkPut(recent)
      await db.settings.bulkPut(settings)
    })
    return {
      addedAttempts: attempts.length,
      addedMistakes: mistakes.length,
      addedFavorites: favorites.length,
      skippedCorrupt,
    }
  }

  // merge 模式
  return db.transaction('rw', db.tables, async () => {
    // attempts：按 (questionId, at, first, JSON(answer)) 指纹去重
    const existing = await db.attempts.toArray()
    const fp = (a: Pick<AttemptRecord, 'questionId' | 'at' | 'answer'>) =>
      `${a.questionId}|${a.at}|${JSON.stringify(a.answer)}`
    const existFp = new Set(existing.map(fp))
    const newAttempts = attempts.filter((a) => !existFp.has(fp(a)))
    await db.attempts.bulkAdd(newAttempts.map(({ id: _omit, ...r }) => r) as AttemptRecord[])

    // mistakes / favorites / progress / recent / settings：同 ID 取较新
    const mergeByKey = async <T>(
      table: Table<T, string>, arr: T[],
      keyOf: (x: T) => string, timeOf: (x: T) => number,
    ): Promise<number> => {
      let added = 0
      for (const item of arr) {
        const cur = await table.get(keyOf(item))
        if (!cur || timeOf(item) >= timeOf(cur)) {
          await table.put(item)
          if (!cur) added++
        }
      }
      return added
    }
    const addedMistakes = await mergeByKey(
      db.mistakes, mistakes as MistakeEntry[],
      (m) => m.questionId, (m) => m.updatedAt)
    const addedFavorites = await mergeByKey(
      db.favorites, favorites as FavoriteEntry[],
      (f) => f.questionId, (f) => f.addedAt)
    await mergeByKey(
      db.progress, progress as ProgressEntry[],
      (p) => p.knowledgeId, (p) => p.updatedAt)
    await mergeByKey(
      db.recent, recent as RecentEntry[],
      (r) => r.id, (r) => r.at)
    await db.settings.bulkPut(settings)

    return {
      addedAttempts: newAttempts.length,
      addedMistakes,
      addedFavorites,
      skippedCorrupt,
    }
  })
}

/**
 * 内容版本变化后的完整性检查（不删除任何用户数据，仅报告孤儿引用）。
 */
export async function integrityCheck(validQuestionIds: Set<string>, validKnowledgeIds: Set<string>) {
  const orphanMistakes = (await db.mistakes.toArray()).filter((m) => !validQuestionIds.has(m.questionId))
  const orphanFavorites = (await db.favorites.toArray()).filter((f) => !validQuestionIds.has(f.questionId))
  const orphanProgress = (await db.progress.toArray()).filter((p) => !validKnowledgeIds.has(p.knowledgeId))
  return { orphanMistakes, orphanFavorites, orphanProgress }
}
