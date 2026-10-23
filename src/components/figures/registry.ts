// ============================================================
// 图解注册表：figureId → 懒加载的 SVG 等距示意图组件
// 图解 ID 与知识点 ID 对应：f{知识点后缀}-{名称}，如 f1.4.3-convoy
// ============================================================
import { lazy } from 'react'

export const figureRegistry: Record<string, React.LazyExoticComponent<React.ComponentType>> = {
  'f1.4.3-convoy': lazy(() => import('./ConvoyFigure')),
  'f1.5.5-envelope': lazy(() => import('./EnvelopeFigure')),
  'f3.4.6-window': lazy(() => import('./WindowFigure')),
  'f3.5.8-rwnd': lazy(() => import('./RwndFigure')),
}
