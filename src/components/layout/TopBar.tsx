import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { search, type SearchHit } from '../../content/registry'
import { useSidebar } from '../../hooks/useSidebar'

export default function TopBar({ theme, onToggleTheme }: { theme: string; onToggleTheme: () => void }) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [hits, setHits] = useState<SearchHit[]>([])
  const [cursor, setCursor] = useState(0)
  const navigate = useNavigate()
  const boxRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setHits(q.trim() ? search(q) : [])
    setCursor(0)
  }, [q])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const go = (h: SearchHit) => {
    navigate(h.path)
    setOpen(false)
    setQ('')
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!hits.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => (c + 1) % hits.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => (c - 1 + hits.length) % hits.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(hits[cursor])
    }
  }

  return (
    <header
      className="no-print sticky top-0 z-30 h-14 flex items-center gap-3 px-4 border-b"
      style={{ background: 'color-mix(in srgb, var(--surface) 88%, transparent)', backdropFilter: 'blur(10px)', borderColor: 'var(--border)' }}
    >
      <button
        onClick={() => useSidebar.getState().setOpen(true)}
        className="lg:hidden btn-ghost !px-2 !py-1.5"
        title="打开目录"
      >
        ☰
      </button>
      <div ref={boxRef} className="relative flex-1 max-w-xl">
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="搜索知识点、题目、协议名…"
          className="w-full px-3.5 py-1.5 rounded-lg text-sm outline-none transition"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)' }}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] muted pointer-events-none hidden sm:block">
          <span className="kbd">⌘K</span>
        </span>
        {open && hits.length > 0 && (
          <div
            className="absolute top-full left-0 right-0 mt-1.5 card overflow-hidden z-50 max-h-[70vh] overflow-y-auto"
            style={{ boxShadow: '0 12px 32px rgba(16,24,40,0.14)' }}
          >
            {hits.map((h, i) => (
              <button
                key={h.kind + h.id + i}
                onMouseEnter={() => setCursor(i)}
                onClick={() => go(h)}
                className={`w-full text-left px-3 py-2 border-b last:border-0 transition ${
                  i === cursor ? 'bg-[var(--surface-2)]' : ''
                }`}
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="text-sm flex items-center gap-2">
                  <span className="chip text-[10px] py-0 px-1 shrink-0">
                    {h.kind === 'question' ? '题' : '知'}
                  </span>
                  <span className="truncate">{h.title}</span>
                </div>
                <div className="text-[11px] muted mt-0.5 truncate pl-1">{h.subtitle}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <button onClick={onToggleTheme} className="btn-ghost !px-2 text-xs" aria-label={theme === 'dark' ? '切换浅色主题' : '切换深色主题'} title={theme === 'dark' ? '切换浅色主题' : '切换深色主题'}>
          <span aria-hidden="true" className="font-semibold">{theme === 'dark' ? '深' : '浅'}</span><span className="hidden sm:inline">色模式</span>
        </button>
      </div>
    </header>
  )
}
