// ============================================================
// 内容数据模型 —— 与用户数据完全解耦
// 所有知识点、演示、题目、比较、总结都是纯数据文件（TS/JSON），
// 通过稳定 ID 引用，更新内容不会破坏用户学习记录。
// ============================================================

/** 内容来源标签：区分 PPT 原文 / 为理解补充 / 王道考点 / 外部核实 */
export type SourceKind = 'ppt' | 'supplement' | 'kaoyan' | 'external'

export interface SourceRef {
  kind: SourceKind
  /** PPT 文件标识，如 "Chapter1" */
  ppt?: string
  /** 幻灯片编号数组 */
  slides?: number[]
  /** 外部来源名称 */
  label?: string
  url?: string
  note?: string
}

/** 内容块 —— 知识点正文由这些块按顺序组成，避免把富文本硬编码进组件 */
export type ContentBlock =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string; level?: 3 | 4 }
  | { type: 'list'; ordered?: boolean; items: string[] }
  | { type: 'callout'; tone: 'note' | 'warning' | 'exam' | 'tip' | 'why'; title?: string; text: string }
  | { type: 'formula'; latex: string; caption?: string; display?: boolean }
  | { type: 'vars'; items: { symbol: string; meaning: string; unit?: string }[] }
  | { type: 'example'; title?: string; steps: string[]; answer?: string }
  | { type: 'table'; caption?: string; headers: string[]; rows: string[][] }
  | { type: 'term'; zh: string; en: string; abbr?: string; def: string }
  | { type: 'kv'; title?: string; items: { k: string; v: string }[] }
  | { type: 'quote'; text: string; cite?: string }
  | { type: 'compareRef'; compareId: string; label?: string }
  | { type: 'demoRef'; demoId: string; label?: string }
  | { type: 'knowledgeRef'; knowledgeId: string; label?: string }
  | { type: 'figure'; src?: string; alt: string; caption?: string; ascii?: string }

/** 四类核心问题的回答（为什么需要 / 核心设计 / 内部机制 / 对比局限） */
export interface InsightSet {
  why?: string
  coreIdea?: string
  mechanism?: string
  comparison?: string
}

export interface KnowledgePoint {
  id: string
  title: string
  en?: string
  summary: string
  tags?: string[]
  sources?: SourceRef[]
  insight?: InsightSet
  blocks: ContentBlock[]
  /** 关联练习题 ID */
  questionIds?: string[]
  /** 关联演示 ID */
  demoIds?: string[]
  /** 相关知识点 ID（超链接跳转） */
  related?: string[]
}

export interface Subsection {
  id: string
  title: string
  en?: string
  knowledge: KnowledgePoint[]
}

export interface Section {
  id: string
  title: string
  en?: string
  subsections: Subsection[]
}

export interface Chapter {
  id: string
  order: number
  title: string
  en?: string
  intro: string
  /** 对应 PPT 文件名 */
  pptFile?: string
  sections: Section[]
  /** 章节总结页 */
  summary: ChapterSummary
}

export interface ChapterSummary {
  id: string
  chapterId: string
  title: string
  framework: ContentBlock[]
  background: ContentBlock[]
  mechanisms: ContentBlock[]
  formulas: ContentBlock[]
  examPoints: ContentBlock[]
  confusions: ContentBlock[]
  misconceptions: ContentBlock[]
  connections: ContentBlock[]
  mnemonics: ContentBlock[]
  questionIds?: string[]
}

// ============================================================
// 题库
// ============================================================

export type QuestionType = 'single' | 'multiple' | 'judge' | 'numeric' | 'short'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuestionSource = 'ppt' | 'original' | 'kaoyan'

export interface ChoiceOption {
  key: string
  text: string
  /** 每个选项的独立解析 */
  explain: string
}

export interface BaseQuestion {
  /** 稳定唯一 ID，题目文本改变也不变 */
  id: string
  type: QuestionType
  chapterId: string
  /** 关联知识点 ID */
  knowledgeId?: string
  /** 考点标签 */
  tags: string[]
  difficulty: Difficulty
  source: QuestionSource
  sourceRef?: SourceRef
  stem: ContentBlock[]
  /** 解析总述（提交后显示） */
  analysis: ContentBlock[]
}

export interface ChoiceQuestion extends BaseQuestion {
  type: 'single' | 'multiple' | 'judge'
  options: ChoiceOption[]
  /** 正确答案 key 数组 */
  answer: string[]
}

export interface NumericQuestion extends BaseQuestion {
  type: 'numeric'
  /** 正确答案数值 */
  answer: number
  /** 允许误差 */
  tolerance?: number
  unit?: string
  /** 分步计算 */
  solutionSteps: string[]
}

export interface ShortQuestion extends BaseQuestion {
  type: 'short'
  referenceAnswer: ContentBlock[]
}

export type Question = ChoiceQuestion | NumericQuestion | ShortQuestion

// ============================================================
// 相近知识点对比
// ============================================================

export interface ComparisonTable {
  id: string
  title: string
  chapterIds: string[]
  tags: string[]
  intro?: string
  /** 表头第一列固定为“对比维度” */
  dimensions: string[]
  /** 被比较项 */
  subjects: string[]
  /** rows[i] 对应 dimensions[i]，长度 = subjects.length */
  rows: string[][]
  /** 每项的一句话总结 */
  summary?: string[]
  examNotes?: string[]
  relatedKnowledge?: string[]
}

// ============================================================
// 演示注册（实际实现在 demos/ 组件中，用 demoId 关联）
// ============================================================

export interface DemoMeta {
  id: string
  title: string
  chapterId: string
  knowledgeId?: string
  summary: string
  /** 组件 key，渲染层据此选择组件 */
  component: string
  tags: string[]
}
