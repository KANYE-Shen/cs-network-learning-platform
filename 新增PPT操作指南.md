# 新增 PPT 的操作流程（增量更新）

本平台设计为**长期演进**：老师每讲完一章，把新的 PPT 放进工作区，站点内容随之更新，
而你的**收藏、错题、首次与历史作答记录、学习进度、最近位置全部保留**。

---

## 0. 为什么更新不会丢数据

关键在于**内容与用户数据完全分离**：

```
src/content/**          ← 课程内容（可随意重写、扩充、调整结构）
  ↓ 通过稳定 ID 引用
src/db/studyDB.ts       ← 用户数据（IndexedDB，与内容不在同一个存储里）
```

- 用户记录里存的是 `questionId` / `knowledgeId` 这类**字符串 ID**，不是内容本身。
- 只要 ID 不变，引用就一直有效。
- 因此更新的铁律是：**只追加新 ID，绝不修改或复用旧 ID。**

---

## 1. 常规流程（新增一章 PPT）

### 步骤 1 · 放入 PPT 并提取文本

把新的 `Chapter4.pptx` 放进项目根目录，然后：

```bash
node scripts/scan-ppt.mjs
```

脚本会解压 pptx、提取每页文本（含中英文），写入 `reference/ppt-text/Chapter4.txt`。

> 该脚本只用 Node 内置模块 + 系统 `unzip` 命令，无需安装任何依赖。

如果之前已经提取过同名文件，想看**新���了什么**：

```bash
node scripts/scan-ppt.mjs --diff
```

它会逐行对比 `reference/ppt-text/` 中的旧提取，列出新增与消失的文本行，但**不会覆盖**旧文件。

### 步骤 2 · 在大纲中登记新 ID

打开 `src/content/outline.ts`，追加新的章节：

```ts
export const ch4Outline: OutlineSection[] = [
  {
    id: 's4.1',
    title: '4.1 网络层',
    en: 'Network Layer',
    slides: [1, 2, 3],
    subs: [
      {
        id: 's4.1.1',
        title: '数据报网络',
        points: [
          { id: 'k4.1.1', title: 'IP 分组格式', en: 'IPv4 Datagram Format', slides: [4, 5] },
          // ...
        ],
      },
    ],
  },
]
```

并把新章节登记到 `chapterOutlines`：

```ts
export const chapterOutlines: Record<string, OutlineSection[]> = {
  ch1: ch1Outline,
  ch2: ch2Outline,
  ch3: ch3Outline,
  ch4: ch4Outline,   // ← 新增
}
```

> **ID 命名规则**：章节 `chN`，section `sN.M`，subsection `sN.M.K`，知识点 `kN.M.K`。
> 编号只增不减——即使删掉某个知识点，也**不要**把后面的编号往前挪。

### 步骤 3 · 撰写内容

新建 `src/content/chapters/ch4.ts`，严格遵循 `src/content/AUTHORING.md` 的规范：
- 每个知识点要有 `insight`（四问）与足够的 `blocks`。
- `sources` 标注 PPT 页码，保持可追溯。
- 公式用 `formula` + `vars` + `example` 三件套。

### 步骤 4 · 写题目

在 `src/content/questions.ts` 中追加，ID 用 `q{知识点ID去k}-NN`（如 `k4.1.1` → `q4.1.1-01`）。
每个选项都必须有独立的 `explain`。

### 步骤 5 · 注册章节

在 `src/content/registry.ts` 中导入并加入 `chapters` 数组：

```ts
import { ch4 } from './chapters/ch4'
export const chapters: Chapter[] = [ch1, ch2, ch3, ch4]
```

### 步骤 6 · 校验

```bash
node scripts/scan-ppt.mjs --check   # 检查 ID 契约、覆盖情况、题目 ID 唯一性
npm run typecheck                   # 类型检查
npm test                            # 自动化测试
```

`--check` 会明确列出哪个章节缺哪些知识点、题目是否有重复 ID。

### 步骤 7 · 构建与发布

```bash
npm run build
```

产物在 `dist/`，是纯静态文件，扔到任何静态服务器或本地打开即可。

---

## 2. 修改已有内容（而不是新增）

**允许**：
- 改写 `blocks` 正文、修正笔误、补充 `sources`。
- 给已有知识点**追加**新题目（用新的 `-NN` 序号）。
- 新增 `demoIds` / `related` 交叉引用。

**不允许**：
- 修改已有知识点的 `id`。
- 修改已有题目的 `id`。
- 复用已删除题目/知识点的 ID。

如果确实要废弃某个题目：**保留它的 ID 与内容**，把题干改成"（本题已随课程更新停用）"，
或干脆保留原题但加一个 `tags: ['已停用']`。这样用户已有的作答记录、收藏依然有归属，不会变成孤儿。

---

## 3. 数据迁移（改数据库结构时）

用户数据表在 `src/db/studyDB.ts` 中定义。若要改表结构，**必须**新增一个 version：

```ts
this.version(1).stores({ /* 旧结构 */ })
this.version(2).stores({
  attempts: '++id, questionId, at, [questionId+first]',
  mistakes: 'questionId, mastered, addedAt',
  favorites: 'questionId, addedAt',
  progress: 'knowledgeId, updatedAt',
  recent: 'id, at',
  settings: 'key',
  newTable: 'id',              // 新增表
}).upgrade(tx => {
  // 升级逻辑：迁移旧数据到新结构
})
```

Dexie/IndexedDB 会自动按版本顺序执行 upgrade，无需手动处理用户数据。
同时记得把 `USER_SCHEMA_VERSION` 加 1。

---

## 4. 换设备 / 备份迁移

数据只存在当前浏览器，**没有云同步**。迁移步骤：

1. 旧设备打开「数据备份」页 → **导出 JSON 备份**。
2. 把 JSON 文件传到新设备。
3. 新设备打开同一页面 → 选择该文件 → **合并模式**导入。

导入会校验文件格式与版本；版本不兼容时会明确拒绝并**保持现有数据不变**。

---

## 5. 常见问题

**Q：新增内容后，之前的收藏题"消失"了？**
A：不会。收藏记录存的是题目 ID，内容更新不会动它。刷新页面即可看到。
如果确实看不到，多半是导入备份时选了"覆盖模式"——用"合并模式"重导一次。

**Q：某道题被删了，错题本里那条怎么办？**
A：系统**不会自动删除**你的错题记录（宁可留一条也不丢学习数据）。
在「数据备份 → 版本与完整性」里可以看到指向已删除题目的记录数。

**Q：PPT 里的图我该怎么处理？**
A：优先用 `DemoFrame` + SVG 重绘成交互演示（更有价值）；确实不适合动画的，
用 `{ type: 'figure', ascii: '...' }` 画 ASCII 图，或 `{ type: 'table' }` 画对照表。
不要直接嵌入 PPT 截图——分辨率与主题都不可控。
