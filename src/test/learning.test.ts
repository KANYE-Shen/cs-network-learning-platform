import { describe, expect, it } from 'vitest'
import { chapters } from '../content/registry'
import { chapterOutlines, flattenOutline } from '../content/outline'
import { figureRegistry } from '../components/figures/registry'
import { learningBriefs, subsectionFigures } from '../content/learning'
import { auditProjection, draw as drawHttpMessage, messageModel } from '../components/figures/refresh/ch2/HttpMessageFigure'

describe('学习路径与小节图示', () => {
  const allPoints = Object.values(chapterOutlines).flatMap(flattenOutline)

  it('为每个知识点提供经编辑的精简学习要点', () => {
    expect(Object.keys(learningBriefs).sort()).toEqual(allPoints.map((point) => point.id).sort())

    for (const point of allPoints) {
      const brief = learningBriefs[point.id]
      expect(brief, `${point.id} 缺少精简要点`).toBeDefined()
      expect(brief.length, `${point.id} 要点应为 2–4 条`).toBeGreaterThanOrEqual(2)
      expect(brief.length, `${point.id} 要点应为 2–4 条`).toBeLessThanOrEqual(4)
      expect(brief.every((item) => item.trim().length >= 12), `${point.id} 含有空泛或过短的要点`).toBe(true)
    }
  })

  it('为 41 个小节映射已注册图示，并为每个知识点提供对应说明', () => {
    const subsections = Object.values(chapters).flatMap((chapter) =>
      chapter.sections.flatMap((section) => section.subsections),
    )
    expect(Object.keys(subsectionFigures).sort()).toEqual(subsections.map((sub) => sub.id).sort())

    for (const subsection of subsections) {
      const entry = subsectionFigures[subsection.id]
      expect(figureRegistry[entry.figureId], `${subsection.id} 图示未注册`).toBeDefined()
      expect(Object.keys(entry.contextByKnowledge).sort()).toEqual(
        subsection.knowledge.map((point) => point.id).sort(),
      )
      for (const point of subsection.knowledge) {
        expect(entry.contextByKnowledge[point.id].trim().length, `${point.id} 缺少当前知识点的图示说明`).toBeGreaterThan(10)
      }
    }
  })

  it('为大纲中的 107 个知识点提供章节内容入口', () => {
    const implemented = new Set(chapters.flatMap((chapter) =>
      chapter.sections.flatMap((section) => section.subsections.flatMap((sub) => sub.knowledge.map((point) => point.id))),
    ))
    expect(implemented).toEqual(new Set(allPoints.map((point) => point.id)))
  })

  it('保留考试关键变量公式与协议边界说明', () => {
    expect(learningBriefs['k1.3.2'].join(' ')).toContain('$NL/R$')
    expect(learningBriefs['k1.4.2'].join(' ')).toContain('$L/R$')
    expect(learningBriefs['k1.4.2'].join(' ')).toContain('$d/s$')
    expect(learningBriefs['k1.4.4'].join(' ')).toContain('$\\rho = La/R$')
    expect(learningBriefs['k3.5.4'].join(' ')).toContain('简化估计')
    expect(learningBriefs['k3.5.10'].join(' ')).toContain('第三个 ACK 确认服务器的 ISN')
    expect(learningBriefs['k3.5.11'].join(' ')).toContain('进入 TIME_WAIT')
  })
})

describe('HTTP 报文图的定界状态', () => {
  it('GET 与 304 在正文阶段保持无消息体标记', () => {
    const get = messageModel('fields', 3)
    expect(get.start).toBe('GET /resource HTTP/1.1')
    expect(get.hasBody).toBe(false)
    const getStage3 = drawHttpMessage('fields', 6, auditProjection())
    expect(getStage3).toContain('GET 无正文')
    expect(getStage3).not.toContain('响应实体')
    expect(getStage3).not.toContain('POST 正文')

    const notModified = messageModel('response', 3, '304 Not Modified')
    expect(notModified.status).toBe('304 Not Modified')
    expect(notModified.hasBody).toBe(false)
    expect(notModified.headers.some((header) => header.startsWith('Content-Length:'))).toBe(false)
  })

  it('响应状态在四阶段固定，且有正文时 Content-Length 对应实际字节数', () => {
    for (const status of ['200 OK', '404 Not Found'] as const) {
      const stages = [0, 1, 2, 3].map((stage) => messageModel('response', stage, status))
      expect(new Set(stages.map((model) => model.status))).toEqual(new Set([status]))
      for (const model of stages) {
        const contentLength = model.headers.find((header) => header.startsWith('Content-Length:'))
        expect(contentLength).toBe(`Content-Length: ${new TextEncoder().encode(model.body).length}`)
      }
    }
    expect(drawHttpMessage('response', 4, auditProjection(), '200 OK')).toContain('CRLF')
  })
})
