import { describe, it, expect } from 'vitest'
import { fireEvent, render, cleanup } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import QuestionBankPage from '../pages/QuestionBankPage'
import CompareIndexPage from '../pages/CompareIndexPage'
import ComparePage from '../pages/ComparePage'
import BackupPage from '../pages/BackupPage'
import ProgressPage from '../pages/ProgressPage'
import ChapterPage from '../pages/ChapterPage'
import { db } from '../db/studyDB'

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

  it('最近学习中的知识点链接回其真实所属章节', async () => {
    await db.recent.clear()
    await db.recent.put({ kind: 'knowledge', id: 'k1.1.1', title: '互联网的“网、机、线”组成', at: Date.now() })
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/chapter/:chapterId/:knowledgeId" element={<ChapterPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await settle(180)
    const recentLink = Array.from(document.querySelectorAll('a')).find((link) => link.textContent?.includes('互联网的“网、机、线”组成'))
    expect(recentLink).toHaveAttribute('href', '/chapter/ch1/k1.1.1')
    fireEvent.click(recentLink!)
    await settle(180)
    expect(document.body.textContent).toContain('互联网的“网、机、线”组成')
    expect(document.body.textContent).toContain('快速学习')
    cleanup()
    await db.recent.clear()
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

  it('知识点页先展示精简要点，并可展开完整讲解', async () => {
    render(
      <MemoryRouter initialEntries={['/chapter/ch1/k1.1.1']}>
        <Routes>
          <Route path="/chapter/:chapterId/:knowledgeId" element={<ChapterPage />} />
        </Routes>
      </MemoryRouter>,
    )
    await settle(200)
    expect(document.body.textContent).toContain('快速学习')
    expect(document.body.textContent).toContain('端系统运行应用，链路承载比特')
    expect(document.querySelector('.learning-path mark')).toBeInTheDocument()
    const toggle = Array.from(document.querySelectorAll('summary')).find((el) =>
      el.textContent?.includes('查看完整讲解、推导与来源'),
    )
    expect(toggle).toBeDefined()
    expect(toggle?.parentElement).not.toHaveAttribute('open')
    fireEvent.click(toggle!)
    expect(toggle?.parentElement).toHaveAttribute('open')
    expect(document.body.textContent).toContain('PPT 第 5 页给出经典的')
    cleanup()
  })

  it('切换知识点后完整讲解默认收起且图示提示跟随当前页', async () => {
    render(
      <MemoryRouter initialEntries={['/chapter/ch1/k1.1.1']}>
        <Routes><Route path="/chapter/:chapterId/:knowledgeId" element={<ChapterPage />} /></Routes>
      </MemoryRouter>,
    )
    await settle(150)
    const fullLesson = document.querySelector('.full-lesson')!
    fireEvent.click(fullLesson.querySelector('summary')!)
    expect(fullLesson).toHaveAttribute('open')

    const next = Array.from(document.querySelectorAll('a')).find((link) => link.textContent?.includes('RFC、IETF 与互联网标准'))
    expect(next).toBeDefined()
    fireEvent.click(next!)
    await settle(100)

    expect(document.querySelector('.full-lesson')).not.toHaveAttribute('open')
    expect(document.querySelector('.learning-path')?.textContent).toContain('RFC')
    expect(document.querySelector('.learning-figure-context')?.textContent).toContain('协议标签')
    cleanup()
  })

  it('从移动端章节导航跳转后菜单收起并显示新知识点', async () => {
    render(
      <MemoryRouter initialEntries={['/chapter/ch1/k1.1.1']}>
        <Routes><Route path="/chapter/:chapterId/:knowledgeId" element={<ChapterPage />} /></Routes>
      </MemoryRouter>,
    )
    await settle(120)
    const nav = document.querySelector('.mobile-knowledge-index')!
    fireEvent.click(nav.querySelector('summary')!)
    expect(nav).toHaveAttribute('open')
    const target = nav.querySelector<HTMLAnchorElement>('a[href="/chapter/ch1/k1.1.2"]')!
    fireEvent.click(target)
    await settle(100)
    expect(document.querySelector('h1')?.textContent).toContain('RFC、IETF 与互联网标准')
    expect(document.querySelector('.mobile-knowledge-index')).not.toHaveAttribute('open')
    cleanup()
  })

  it('快速路径使用行内数学排版，不丢关键公式', async () => {
    render(
      <MemoryRouter initialEntries={['/chapter/ch1/k1.3.2']}>
        <Routes><Route path="/chapter/:chapterId/:knowledgeId" element={<ChapterPage />} /></Routes>
      </MemoryRouter>,
    )
    await settle(200)
    expect(document.querySelectorAll('.learning-path .katex').length).toBeGreaterThanOrEqual(3)
    expect(document.querySelector('.learning-path mark')).toBeInTheDocument()
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
