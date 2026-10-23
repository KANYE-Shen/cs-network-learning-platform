# 计算机网络 · 交互式学习平台

基于哈工大威海《计算机网络：自顶向下方法》课程 PPT 构建的中文学习网站。  
不是 PPT 搬运站，而是把每章内容拆成**可检索的知识点 + 可操作的协议演示 + 可追溯的刷题系统**。

> 当前覆盖 **Chapter 1–3**：导论、应用层、传输层。  
> 107 个知识点 · 152 道题 · 25 个交互演示 · 21 张等距图解 · 15 张对比表。

---

## 它能做什么

| 模块 | 能力 |
|---|---|
| **系统学习** | 每个知识点按「为什么需要 → 核心思路 → 内部机制 → 与相似机制的差别」组织，保留 PPT 页码来源 |
| **交互演示** | 25 个协议/算法演示，统一支持播放、暂停、重置、单步、调速与参数调节 |
| **等距图解** | 21 张可播放的实体等距图（每个小节至少一张），用真实物件解释抽象机制，而非线条示意图 |
| **刷题** | 单选 / 多选 / 判断 / 计算 / 简答；每个选项都有独立解析 |
| **错题本** | 以**首次作答**判定是否自动收录；支持手动加入、标记掌握、重新加入 |
| **收藏与进度** | 收藏题本与错题本独立；知识点学习进度、最近学习位置自动记录 |
| **对比复习** | TCP vs UDP、GBN vs SR、三次握手 vs 四次挥手等 15 张对比表 |
| **章节总结** | 每章 9 部分：框架、背景、机制、公式、考点、易混、误区、联系、口诀 |
| **数据备份** | JSON 导出/导入，带格式与版本校验；非法文件拒绝且不破坏现有数据 |

所有学习数据保存在**浏览器 IndexedDB**，无账号、无云同步；换设备请使用备份文件。

---

## 快速开始

要求：Node.js 18+。

```bash
npm install
npm run dev        # http://localhost:5173
```

常用命令：

```bash
npm run build      # 生产构建，产物在 dist/
npm run preview    # 预览生产构建
npm test           # 41 个自动化测试
npm run typecheck  # TypeScript 类型检查
```

`dist/` 是纯静态文件，可直接放到任意静态服务器，也支持双击 `dist/index.html` 打开
（项目使用 Hash 路由，不需要服务器 rewrite 配置）。

---

## 项目结构

```text
src/
├── content/                 ★ 课程内容（纯数据，与 UI 解耦）
│   ├── outline.ts           ★ ID 契约：知识点/题目的唯一真相来源
│   ├── AUTHORING.md         内容编写规范
│   ├── chapters/            章节正文（ch3 因体量大拆分为 part1-3）
│   ├── questions/           题库（按章节拆分后聚合）
│   ├── comparisons.ts       对比表
│   ├── demos/index.ts       演示注册表（ID → 组件）
│   └── registry.ts          扁平化、搜索、覆盖统计、导航序列
├── components/
│   ├── content/             内容块渲染（KaTeX 公式）、洞察面板、来源徽章
│   ├── demos/               25 个交互演示 + DemoKit 统一控制条
│   ├── figures/             21 张等距图解（注册表 + 播放卡片）
│   ├── iso/                 anatomy 等距绘制工具包（相机/实体/React 组件）
│   ├── questions/           题目卡片与标签样式
│   └── layout/              侧边目录、顶栏搜索、面包屑、上下节翻页
├── db/studyDB.ts            ★ 用户数据层（Dexie / IndexedDB）
├── pages/                   各路由页面
├── types/content.ts         内容数据模型
└── test/                    自动化测试
scripts/                     PPT 扫描、覆盖校验、报告生成
reference/ppt-text/          PPT 全文提取（本地留存，不随仓库发布）
docs/设计文档.md             技术选型、数据模型、增量更新机制
```

---

## 核心设计

### 1. 内容与用户数据完全分离

课程内容是 TypeScript 纯数据；用户记录是 IndexedDB。两者只通过**稳定 ID** 关联：

```text
src/content/**  ──(questionId / knowledgeId)──▶  src/db/studyDB.ts
```

因此更新课程内容时，收藏、错题、首次与历史作答、进度、最近位置**全部保留**。

### 2. ID 契约

`src/content/outline.ts` 是所有知识点 ID 的唯一真相来源。

- 知识点：`k{章}.{节}.{序号}`，如 `k3.5.10`
- 题目：`q{知识点后缀}-{序号}`，如 `q3.5.10-01`
- 演示：`d{知识点后缀}-{名称}`
- 对比表：`c{知识点后缀}-{名称}`

铁律：**只追加新 ID，绝不修改或复用旧 ID**。

### 3. 错题本首次判定

- 首次正式提交答错 → 自动加入错题本
- 首次正式提交答对 → 不加入
- 后续作答保留记录，但不改变首次判定
- 手动移除不删除原始作答记录

### 4. 交互演示

演示组件位于 `src/components/demos/`，通过 `src/content/demos/index.ts` 注册。
统一复用 `DemoKit`（`PlayControls` / `ParamSlider` / `StepNote` / `ResultGrid`），
协议行为按课程定义实现，例如：

- GBN 丢弃乱序包、累积 ACK、超时整窗重传
- SR 缓存乱序包、只重传丢失包
- TCP 确认号 = 期望收到的下一个字节序号

---

## 更新课程内容

新增一章 PPT 的完整流程见 [`新增PPT操作指南.md`](./新增PPT操作指南.md)。简要步骤：

1. 把 `ChapterN.pptx` 放到项目根目录，运行 `node scripts/scan-ppt.mjs`
2. 在 `src/content/outline.ts` 追加章节与知识点 ID
3. 编写 `src/content/chapters/chN.ts` 与 `src/content/questions/*`
4. 在 `src/content/registry.ts` 注册章节
5. 运行 `node scripts/scan-ppt.mjs --check`、`npm run typecheck`、`npm test`
6. `npm run build`

重新生成覆盖报告：

```bash
node scripts/coverage-report.mjs
```

---

## 测试

| 文件 | 覆盖内容 |
|---|---|
| `src/test/studyDB.test.ts` | 首次判定、错题本、收藏、备份导出/导入、版本校验、内容更新后旧数据可访问 |
| `src/test/content.test.ts` | 对比表结构、ID 唯一性、交叉引用、大纲完整性 |
| `src/test/questions.test.ts` | 选项解析完整性、答案、ID 唯一性、知识点引用 |
| `src/test/demos.test.tsx` | 演示组件渲染 |
| `src/test/pages.test.tsx` | 页面级冒烟测试 |

---

## 技术栈

React 18 · TypeScript · Vite · Tailwind CSS · Dexie (IndexedDB) · KaTeX · React Router (Hash) · Vitest

---

## 版权说明

课程 PPT 与提取文本属于原课程/教师，**不包含在本仓库中**。
本仓库仅包含学习平台的源代码与原创讲解内容，供个人学习与技术交流使用。
