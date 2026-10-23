export const QUESTION_TYPE_LABEL: Record<string, string> = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题',
  numeric: '计算题',
  short: '简答题',
}

export const DIFFICULTY_LABEL: Record<string, string> = {
  easy: '基础',
  medium: '进阶',
  hard: '挑战',
}

export const DIFFICULTY_STYLE: Record<string, string> = {
  easy: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  medium: 'bg-amber-500/12 text-amber-700 dark:text-amber-400',
  hard: 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
}

export const SOURCE_LABEL: Record<string, string> = {
  ppt: 'PPT 原题',
  original: '原创补充',
  kaoyan: '王道考点',
}

export const SOURCE_STYLE: Record<string, string> = {
  ppt: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-400',
  original: 'bg-sky-500/12 text-sky-700 dark:text-sky-400',
  kaoyan: 'bg-rose-500/12 text-rose-700 dark:text-rose-400',
}
