import { describe, it, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import QuestionBankPage from '../pages/QuestionBankPage'
import CompareIndexPage from '../pages/CompareIndexPage'
import ComparePage from '../pages/ComparePage'
import BackupPage from '../pages/BackupPage'
import ProgressPage from '../pages/ProgressPage'
import ChapterPage from '../pages/ChapterPage'

async function settle(ms = 100) {
  await new Promise((r) => setTimeout(r, ms))
}

describe('页面级冒烟测试', () => {
  it('首页渲染章节与学习状态', async () => {
    render(<MemoryRouter><HomePage /></MemoryRouter>)
    await settle(150)
    const text = document.body.textContent ?? ''
    expect(text).toContain('计算机网络交互式学习平台')
    expect(text).toContain('第一章')
    expect(text).toContain('第三章')
    cleanup()
  })

  it('题库页渲染题目卡片', async () => {
    render(<MemoryRouter><QuestionBankPage /></MemoryRouter>)
    await settle(200)
    const text = document.body.textContent ?? ''
    expect(text).toContain('题库练习')
    expect(text.length).toBeGreaterThan(500)
    cleanup()
  })

  it('对比索引页列出全部对比表', async () => {
    render(<MemoryRouter><CompareIndexPage /></MemoryRouter>)
    await settle(100)
    const text = document.body.textContent ?? ''
    expect(text).toContain('相近知识点比较')
    expect(text).toContain('OSI')
    expect(text).toContain('TCP 与 UDP')
    cleanup()
  })

  it('对比详情页渲染表格', async () => {
    render(
      <MemoryRouter initialEntries={['/compare/c3.1.2-tcp-udp']}>
        <Routes>
          <Route path="/compare/:compareId" element={<ComparePage />} />
        </Routes>
      </MemoryRouter>,
    )
    await settle(100)
    const text = document.body.textContent ?? ''
    expect(text).toContain('TCP 与 UDP 对比')
    expect(text).toContain('常见考点')
    cleanup()
  })

  it('备份页渲染导入导出功能', async () => {
    render(<MemoryRouter><BackupPage /></MemoryRouter>)
    await settle(150)
    const text = document.body.textContent ?? ''
    expect(text).toContain('数据备份与恢复')
    expect(text).toContain('导出 JSON')
    cleanup()
  })

  it('进度页渲染覆盖统计', async () => {
    render(<MemoryRouter><ProgressPage /></MemoryRouter>)
    await settle(150)
    const text = document.body.textContent ?? ''
    expect(text).toContain('学习进度')
    expect(text).toContain('内容覆盖情况')
    cleanup()
  })

  it('章节知识点页渲染正文', async () => {
    render(
      <MemoryRouter initialEntries={['/chapter/ch3/k3.5.4']}>
        <Routes>
          <Route path="/chapter/:chapterId/:knowledgeId" element={<ChapterPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await settle(200)
    const text = document.body.textContent ?? ''
    expect(text).toContain('RTT 估计与超时重传时间')
    expect(text).toContain('EstimatedRTT')
    cleanup()
  })

  it('章节总结页渲染九部分结构', async () => {
    render(
      <MemoryRouter initialEntries={['/chapter/ch1/summary']}>
        <Routes>
          <Route path="/chapter/:chapterId/:knowledgeId" element={<ChapterPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await settle(200)
    const text = document.body.textContent ?? ''
    expect(text).toContain('章节总结')
    expect(text).toContain('知识框架')
    expect(text).toContain('记忆口诀')
    cleanup()
  })
})
