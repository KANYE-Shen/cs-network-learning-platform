# 课程内容编写规范（Authoring Spec）

本项目的内容**全部是数据**，组件只负责渲染。所有内容文件位于 `src/content/`。

## 0. 铁律

1. **ID 一旦发布永不改变**。`src/content/outline.ts` 是 ID 契约的唯一真相来源。
   - 知识点 ID 形如 `k1.3.2`（章节号 + 大纲序号），必须与 outline.ts 中已定义的 ID **完全一致**。
   - 题目 ID 形如 `q1.3.2-01`（对应知识点 ID + `-序号`）。
   - 演示 ID 形如 `d1.3.2-storeforward`。
   - 对比表 ID 形如 `c1.5.3-layers`。
2. **PPT 内容不可遗漏**。outline.ts 中每个知识点对应的 slides 数组列出了 PPT 页码，
   该页码的**所有**知识点（文字、图示、表格、强调点）都必须体现在内容中。
3. **不编造教材原文、不虚构页码**。可以原创讲解，但不得声称"教材第 X 页说"。
4. **区分内容来源**：`sources` 字段用 `kind` 区分：
   - `ppt`：PPT 已讲授内容（必须填 `ppt` 与 `slides`）
   - `supplement`：为理解 PPT 补充的基础知识
   - `kaoyan`：王道常见考点/易错点/题型
   - `external`：RFC / 公开课 / 权威资料（必须填 `label` 与 `url`）
5. **每个知识点必须回答四类问题**（`insight` 字段）：
   - `why`：为什么需要这项技术？原先存在什么问题？
   - `coreIdea`：核心设计思路是什么？
   - `mechanism`：内部工作过程和具体机制是什么？
   - `comparison`：与类似机制相比有什么区别、局限和适用场景？
   四个字段可按知识点重要性取舍，但**不得全部为空**。
6. **术语准确**：首次出现时用 `{ type: 'term', zh, en, abbr, def }` 块标注英文名与缩写。
7. **公式正确**：用 `{ type: 'formula', latex }`，并配 `{ type: 'vars' }` 解释每个变量，
   至少一个 `{ type: 'example' }` 给出代入计算过程。变量含义、单位、前提条件必须准确。
8. **禁止空壳**：每个 `blocks` 至少有 6 个块；每个知识点内容总字数 ≥ 400 中文字符。

## 1. 文件格式

### 1.1 知识点（章节文件）

`src/content/chapters/ch1.ts`：

```ts
import type { Chapter } from '../../types/content'

export const ch1: Chapter = {
  id: 'ch1',
  order: 1,
  title: '第一章 导论',
  en: 'Introduction',
  pptFile: 'Chapter1.pptx',
  intro: '本章导言……',
  sections: [
    {
      id: 's1.1',
      title: '1.1 什么是互联网',
      en: 'What is the Internet?',
      subsections: [
        {
          id: 's1.1.1',
          title: '互联网的构成',
          knowledge: [
            {
              id: 'k1.1.1',            // 必须来自 outline.ts
              title: '互联网的"网、机、线"组成',
              en: 'Nuts and Bolts View',
              summary: '一句话概括这个知识点（60 字内，用于导航和搜索）',
              tags: ['互联网', '端系统'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter1', slides: [4, 5] },
              ],
              insight: {
                why: '……为什么需要它',
                coreIdea: '……核心思路',
                mechanism: '……内部机制',
                comparison: '……对比与局限',
              },
              blocks: [
                { type: 'p', text: '正文段落，支持 $LaTeX$ 行内公式。' },
                { type: 'term', zh: '端系统', en: 'end system', abbr: 'host', def: '……' },
                { type: 'h', text: '小节标题' },
                { type: 'list', items: ['要点一', '要点二'] },
                { type: 'callout', tone: 'why', title: '为什么这样设计', text: '……' },
                { type: 'callout', tone: 'exam', title: '考试重点', text: '……' },
                { type: 'callout', tone: 'warning', title: '易错点', text: '……' },
                { type: 'callout', tone: 'tip', title: '记忆口诀', text: '……' },
                { type: 'formula', latex: 'd_{trans} = \\frac{L}{R}', caption: '发送时延' },
                { type: 'vars', items: [{ symbol: 'L', meaning: '分组长度', unit: 'bit' }] },
                { type: 'example', title: '例题', steps: ['步骤一', '步骤二'], answer: '最终答案' },
                { type: 'table', headers: ['维度', 'A', 'B'], rows: [['x', 'y', 'z']] },
                { type: 'kv', title: '要点', items: [{ k: '键', v: '值' }] },
                { type: 'quote', text: '引用', cite: '出处' },
                { type: 'demoRef', demoId: 'd1.3.2-storeforward', label: '打开存储转发演示' },
                { type: 'knowledgeRef', knowledgeId: 'k1.3.5', label: '相关：转发与路由' },
                { type: 'compareRef', compareId: 'c1.3.4-switching', label: '查看三种交换方式对比' },
              ],
              questionIds: ['q1.3.2-01'],
              demoIds: ['d1.3.2-storeforward'],
              related: ['k1.3.5'],
            },
          ],
        },
      ],
    },
  ],
  summary: { /* 见 §1.4 */ },
}
```

### 1.2 题目（`src/content/questions.ts`）

```ts
import type { Question } from '../types/content'

export const questions: Question[] = [
  {
    id: 'q1.3.2-01',            // 唯一、稳定
    type: 'single',              // single | multiple | judge | numeric | short
    chapterId: 'ch1',
    knowledgeId: 'k1.3.2',
    tags: ['存储转发', '时延计算'],
    difficulty: 'medium',        // easy | medium | hard
    source: 'ppt',               // ppt | original | kaoyan
    sourceRef: { kind: 'ppt', ppt: 'Chapter1', slides: [47] },
    stem: [
      { type: 'p', text: '题干正文。' },
      { type: 'formula', latex: 'd = \\frac{3L}{R}' },
    ],
    options: [
      { key: 'A', text: '选项 A 文本', explain: 'A 为什么对/为什么错——每个选项都必须有独立解析' },
      { key: 'B', text: '选项 B 文本', explain: '……' },
    ],
    answer: ['A'],               // 数组；multiple 可有多个
    analysis: [
      { type: 'p', text: '解析总述：为什么正确答案是 A。' },
    ],
  },
]
```

**硬性要求**：
- **每个选项都必须有 `explain`**，且解释"为什么这个选项对/错"，不能只写"选 A，因为 A 正确"。
- 提交前不得泄露答案：`stem` 中不能出现答案信息。
- `judge` 类型的 options 固定为 A=正确 / B=错误。
- `numeric` 类型：`answer: number`、`tolerance?`、`unit?`、`solutionSteps: string[]`（规范分步计算）。
- `short` 类型：`referenceAnswer: ContentBlock[]`。
- 题干与解析中可用 `$...$` 行内 LaTeX。

### 1.3 对比表（`src/content/comparisons.ts`）

```ts
import type { ComparisonTable } from '../types/content'

export const comparisons: ComparisonTable[] = [
  {
    id: 'c1.5.3-layers',
    title: 'OSI 七层 / TCP/IP 四层 / 教学五层模型对比',
    chapterIds: ['ch1'],
    tags: ['分层', '体系结构'],
    intro: '一句话导语',
    dimensions: ['层次数', '核心目的', '机制', '特点', '区别', '使用场景', '常见考点'],
    subjects: ['OSI 七层', 'TCP/IP 四层', '教学五层'],
    rows: [
      ['7 层', '……', '……'],
      ['……', '……', '……'],
    ],
    summary: ['……', '……', '……'],       // 每个 subject 一句话总结（与 subjects 等长）
    examNotes: ['……'],
    relatedKnowledge: ['k1.5.3', 'k1.5.4'],
  },
]
```

`rows[i]` 对应 `dimensions[i]`，每行长度必须等于 `subjects.length`。

### 1.4 章节总结（章节文件的 `summary` 字段）

必须包含 **9 个部分**，每个都是 `ContentBlock[]`：

| 字段 | 内容 |
|---|---|
| `framework` | 本章完整知识框架及层级关系（用 list / table 表达层级） |
| `background` | 本章各项重要技术的提出背景 |
| `mechanisms` | 核心协议、算法及工作机制 |
| `formulas` | 重点公式、变量与应用条件 |
| `examPoints` | 高频考点及典型题型 |
| `confusions` | 容易混淆的知识及辨析表 |
| `misconceptions` | 常见错误理解及纠正 |
| `connections` | 与其他章节知识的联系 |
| `mnemonics` | 记忆口诀和复习建议 |

另外 `summary` 对象含 `id`（如 `sum-ch1`）、`chapterId`、`title`、`questionIds`。

## 2. 覆盖追踪

`src/content/coverage.md` 由作者维护，用于列出：
- 每个知识点 → PPT 页码 → 是否实现 → 关联题目 → 关联演示
- 无法提取/暂缺的 PPT 页必须**明确记录原因**

## 3. 文风要求

- 中文为主，专业术语首次出现标注英文名与缩写。
- **先讲"为什么"再讲"是什么"**，强调因果逻辑。
- 避免教科书定义的机械堆砌；解释设计动机与权衡。
- 对 PPT 中可能过时的表述要**核实并适当注释**（如课程提到 RFC 2616 是 HTTP/1.1，现行为 RFC 9110/9112）。
- 区分**课堂教学模型**与**真实互联网实现**（如"TCP 拥塞控制 4 个状态"是教学简化，真实实现有 CUBIC/BBR 等）。
- 每章结尾给出复习建议与自测方法。
