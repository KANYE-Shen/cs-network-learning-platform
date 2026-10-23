import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  db, exportBackup, importBackup, integrityCheck, USER_SCHEMA_VERSION,
  type ImportMode,
} from '../db/studyDB'
import { CONTENT_VERSION, validKnowledgeIds, validQuestionIds } from '../content/registry'
import { chapters } from '../content/registry'

export default function BackupPage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<ImportMode>('merge')
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const counts = useLiveQuery(async () => {
    const [attempts, mistakes, favorites, progress, recent] = await Promise.all([
      db.attempts.count(),
      db.mistakes.count(),
      db.favorites.count(),
      db.progress.count(),
      db.recent.count(),
    ])
    return { attempts, mistakes, favorites, progress, recent }
  }, [])

  const integrity = useLiveQuery(async () => {
    const r = await integrityCheck(validQuestionIds, validKnowledgeIds)
    return {
      orphanMistakes: r.orphanMistakes.length,
      orphanFavorites: r.orphanFavorites.length,
      orphanProgress: r.orphanProgress.length,
    }
  }, [])

  const doExport = async () => {
    const backup = await exportBackup()
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cs-web-学习数据备份-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    setMsg({ kind: 'ok', text: '备份文件已导出，请妥善保存。' })
  }

  const doImport = async (file: File) => {
    setBusy(true)
    try {
      const text = await file.text()
      const r = await importBackup(text, mode)
      setMsg({
        kind: 'ok',
        text: `导入完成：新增作答 ${r.addedAttempts} 条、错题 ${r.addedMistakes} 条、收藏 ${r.addedFavorites} 条${r.skippedCorrupt ? `；跳过 ${r.skippedCorrupt} 条损坏记录` : ''}。`,
      })
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : '导入失败' })
    } finally {
      setBusy(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const clearAll = async () => {
    if (!confirm('确定清空全部学习数据？收藏、错题、作答记录、进度都会被删除，且不可撤销。建议先导出备份。')) return
    await db.transaction('rw', db.tables, async () => {
      await Promise.all(db.tables.map((t) => t.clear()))
    })
    setMsg({ kind: 'ok', text: '已清空全部学习数据。' })
  }

  return (
    <div className="space-y-5">
      <header className="card p-5 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight">数据备份与恢复</h1>
        <p className="muted text-sm mt-1.5 max-w-3xl leading-relaxed">
          本平台为纯本地架构，学习数据（收藏、错题、首次与历史作答记录、掌握状态、学习进度、最近位置）只保存在
          <strong className="text-[var(--text)]">当前浏览器与设备</strong>中，没有账号也没有云同步。
          换设备或清理浏览器数据前，请先导出 JSON 备份，再到新设备导入恢复。
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: '作答记录', value: counts?.attempts ?? 0, hint: '含首次与历史' },
          { label: '错题条目', value: counts?.mistakes ?? 0, hint: '含掌握状态' },
          { label: '收藏题目', value: counts?.favorites ?? 0, hint: '生成优质题本' },
          { label: '学习进度', value: counts?.progress ?? 0, hint: '知识点已读标记' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-[11px] muted">{s.label}</div>
            <div className="text-xl font-bold tabular-nums">{s.value}</div>
            <div className="text-[10px] muted">{s.hint}</div>
          </div>
        ))}
      </div>

      <section className="card p-5 sm:p-6">
        <h2 className="text-base font-semibold mb-3">导出备份</h2>
        <p className="text-sm muted mb-3">
          导出为标准 JSON，包含全部学习记录与版本信息，可用于跨设备迁移或长期存档。
        </p>
        <button onClick={doExport} className="btn-primary">⬇ 导出 JSON 备份</button>
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="text-base font-semibold mb-3">导入恢复</h2>
        <p className="text-sm muted mb-3">
          导入时会校验文件格式与版本；格式非法或版本高于当前应用时会拒绝导入并提示，<strong className="text-[var(--text)]">不会覆盖或损坏现有数据</strong>。
        </p>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {([
              { v: 'merge' as ImportMode, label: '合并模式（推荐）', desc: '与现有数据合并，同 ID 取较新记录，保留双方内容' },
              { v: 'replace' as ImportMode, label: '覆盖模式', desc: '清空后完全使用备份内容（自动快照，失败回滚）' },
            ]).map((o) => (
              <button
                key={o.v}
                onClick={() => setMode(o.v)}
                className={`text-left px-3.5 py-2.5 rounded-lg border transition flex-1 min-w-[220px] ${
                  mode === o.v ? 'border-brand bg-brand/8' : 'hover:border-brand/40'
                }`}
                style={mode !== o.v ? { borderColor: 'var(--border)' } : undefined}
              >
                <div className="text-sm font-medium">{o.label}</div>
                <div className="text-[11px] muted mt-0.5">{o.desc}</div>
              </button>
            ))}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void doImport(f)
            }}
            disabled={busy}
            className="block w-full text-sm muted file:mr-3 file:btn file:btn-ghost file:text-xs file:px-3 file:py-1.5 file:rounded-md file:border-0"
          />
          {busy && <p className="text-xs muted">正在导入…</p>}
        </div>
      </section>

      {msg && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{
            background: msg.kind === 'ok' ? 'rgba(16,185,129,0.09)' : 'rgba(244,63,94,0.08)',
            color: msg.kind === 'ok' ? '#059669' : '#e11d48',
          }}
        >
          {msg.kind === 'ok' ? '✓ ' : '✕ '}
          {msg.text}
        </div>
      )}

      <section className="card p-5 sm:p-6">
        <h2 className="text-base font-semibold mb-3">版本与完整性</h2>
        <dl className="text-sm space-y-1.5">
          <div className="flex justify-between gap-4">
            <dt className="muted">数据 schema 版本</dt>
            <dd className="mono">v{USER_SCHEMA_VERSION}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="muted">内容版本</dt>
            <dd className="mono">{CONTENT_VERSION}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="muted">课程章节数</dt>
            <dd className="mono">{chapters.length}</dd>
          </div>
          {integrity && (
            <>
              <div className="flex justify-between gap-4">
                <dt className="muted">指向已删除题目的错题</dt>
                <dd className="mono">{integrity.orphanMistakes}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="muted">指向已删除题目的收藏</dt>
                <dd className="mono">{integrity.orphanFavorites}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="muted">指向已删除知识点的进度</dt>
                <dd className="mono">{integrity.orphanProgress}</dd>
              </div>
            </>
          )}
        </dl>
        <p className="text-[11px] muted mt-3 leading-relaxed">
          说明：新增 PPT 后内容 ID 保持稳定，历史记录不会失效。若某个知识点被删除，对应的收藏/错题条目会被保留
          （不会丢失学习数据），仅在上面的完整性统计中提示。
        </p>
      </section>

      <section className="card p-5 sm:p-6 border-rose-500/30">
        <h2 className="text-base font-semibold mb-2 !text-rose-600 dark:!text-rose-400">危险操作</h2>
        <p className="text-sm muted mb-3">清空本机所有学习数据，操作不可撤销。</p>
        <button onClick={clearAll} className="btn-outline !text-rose-600 dark:!text-rose-400 !border-rose-500/40">
          清空全部学习数据
        </button>
      </section>
    </div>
  )
}
