import { ch1Briefs } from './learning/ch1'
import { ch2Briefs } from './learning/ch2'
import { ch3Briefs } from './learning/ch3'
import { ch1Figures } from './learning/figures-ch1'
import { ch2Figures } from './learning/figures-ch2'
import { ch3Figures } from './learning/figures-ch3'
import type { SubsectionFigure } from './learning/types'

/** 手工编辑的首屏要点；完整讲解继续保存在各知识点正文中。 */
export const learningBriefs: Record<string, string[]> = {
  ...ch1Briefs,
  ...ch2Briefs,
  ...ch3Briefs,
}

/** 按 outline 小节共享图示，并为当前知识点提供具体观察提示。 */
export const subsectionFigures: Record<string, SubsectionFigure> = {
  ...ch1Figures,
  ...ch2Figures,
  ...ch3Figures,
}
