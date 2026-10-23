import type { Question } from '../../types/content'
import { ch1Questions } from './ch1'
import { ch2Questions } from './ch2'
import { ch3aQuestions } from './ch3a'
import { ch3bQuestions } from './ch3b'

/**
 * 全站题库。
 * 按章节/分段拆成多个文件，便于分批维护；此处合并导出。
 */
export const questions: Question[] = [
  ...ch1Questions,
  ...ch2Questions,
  ...ch3aQuestions,
  ...ch3bQuestions,
]
