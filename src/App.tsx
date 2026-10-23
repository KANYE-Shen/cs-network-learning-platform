import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import Sidebar from './components/layout/Sidebar'
import TopBar from './components/layout/TopBar'
import { useTheme } from './hooks/useTheme'
import { db, CONTENT_VERSION_KEY } from './db/studyDB'

import HomePage from './pages/HomePage'
import ChapterPage from './pages/ChapterPage'
import QuestionPage from './pages/QuestionPage'
import QuestionBankPage from './pages/QuestionBankPage'
import FavoritesPage from './pages/FavoritesPage'
import MistakesPage from './pages/MistakesPage'
import ComparePage from './pages/ComparePage'
import CompareIndexPage from './pages/CompareIndexPage'
import ProgressPage from './pages/ProgressPage'
import BackupPage from './pages/BackupPage'
import DemoPage from './pages/DemoPage'
import NotFoundPage from './pages/NotFoundPage'

function ScrollManager() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

function BackToTop() {
  const { pathname } = useLocation()
  const [show, setShow] = useState(false)
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 500)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  useEffect(() => setShow(false), [pathname])
  if (!show) return null
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="no-print fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full card shadow-lg flex items-center justify-center hover:text-brand transition"
      title="返回顶部"
    >
      ↑
    </button>
  )
}

export default function App() {
  const { theme, toggle } = useTheme()

  useEffect(() => {
    db.settings.put({ key: CONTENT_VERSION_KEY, value: new Date().toISOString().slice(0, 10) })
  }, [])

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar theme={theme} onToggleTheme={toggle} />
        <ScrollManager />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1420px] w-full mx-auto">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/chapter/:chapterId" element={<ChapterPage />} />
            <Route path="/chapter/:chapterId/:knowledgeId" element={<ChapterPage />} />
            <Route path="/question/:questionId" element={<QuestionPage />} />
            <Route path="/questions" element={<QuestionBankPage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/mistakes" element={<MistakesPage />} />
            <Route path="/compare" element={<CompareIndexPage />} />
            <Route path="/compare/:compareId" element={<ComparePage />} />
            <Route path="/demo/:demoId" element={<DemoPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/backup" element={<BackupPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        <footer className="no-print border-t py-4 text-center text-xs muted" style={{ borderColor: 'var(--border)' }}>
          计算机网络交互式学习平台 · 内容依据哈工大威海《计算机网络：自顶向下方法》课程 PPT · 学习数据保存在本机浏览器
        </footer>
      </div>
      <BackToTop />
    </div>
  )
}
