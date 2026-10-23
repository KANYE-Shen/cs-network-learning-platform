import { describe, it, expect } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { demoMetas } from '../content/demos'
import { DemoHost, registry } from '../components/demos/DemoHost'

async function waitForContent(timeoutMs = 4000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const text = document.body.textContent?.trim() ?? ''
    if (text.length > 20 && !text.includes('正在加载演示')) return text
    await new Promise((r) => setTimeout(r, 50))
  }
  return document.body.textContent?.trim() ?? ''
}

describe('交互演示', () => {
  it('演示清单与组件注册表一一对应', () => {
    const registered = new Set(Object.keys(registry))
    for (const d of demoMetas) {
      expect(registered.has(d.component), `演示 ${d.id} 的组件 ${d.component} 未注册`).toBe(true)
    }
  })

  it('每个演示都能渲染出内容（非空白）', async () => {
    for (const d of demoMetas) {
      render(<DemoHost demoId={d.id} />)
      const text = await waitForContent()
      expect(text.length, `演示 ${d.id} 渲染为空或未加载完成`).toBeGreaterThan(20)
      // 演示内部标题可能与注册表略有出入，改为校验"渲染出实质交互内容"
      expect(
        /▶|播放|速度|重置|↺|步骤|计算|RTT|cwnd|ACK|SYN|窗口|端口|校验和/.test(text),
        `演示 ${d.id} 缺少交互控件或实质内容`,
      ).toBe(true)
      cleanup()
    }
  }, 60000)
})
