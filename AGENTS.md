# AGENTS.md

本文件面向在此仓库工作的 AI 编程助手与贡献者。开始修改前请先读完本文件，
并阅读 `src/content/AUTHORING.md`（内容编写规范）。

## 项目定位

计算机网络中文交互式学习平台（React + TypeScript + Vite）。
内容依据课程 PPT，当前覆盖 Chapter 1–3。产物是纯静态站点，学习数据存于浏览器 IndexedDB。

## 常用命令

```bash
npm install
npm run dev        # Vite 开发服务器
npm run typecheck  # 必须通过
npm test           # 必须全过（当前 41 个）
npm run build      # 类型检查 + 生产构建
node scripts/scan-ppt.mjs --check       # 大纲/内容/题目 ID 校验
node scripts/coverage-report.mjs        # 重新生成覆盖报告
```

提交前至少执行：`npm run typecheck && npm test && npm run build`。

## 不可违反的规则

1. **ID 契约**
   - `src/content/outline.ts` 是所有知识点 ID 的唯一真相来源。
   - ID 一旦发布**永不修改、永不复用**；新增只追加。
   - 知识点 `k{ch}.{sec}.{seq}`、题目 `q{...}-NN`、演示 `d{...}`、对比表 `c{...}`。
2. **内容与数据分离**
   - 课程内容只能是 `src/content/**` 下的纯数据。
   - 不得为了内容更新修改 `src/db/studyDB.ts` 的表结构或清空用户数据；
     确需改表结构时新增 Dexie version 并写 upgrade。
3. **内容质量**
   - 每个知识点必须有 `insight`（why / coreIdea / mechanism / comparison 至少一项）与足够正文。
   - 每道选择题的**每个选项**必须有独立 `explain`，解释为什么对/错。
   - 题干不得泄露答案。
   - 公式使用 `formula` + `vars` + `example`；KaTeX 反斜杠需转义（如 `'\\frac'`）。
   - 区分 PPT 原意、补充知识、考研考点；发现 PPT 笔误要在 `sources.note` 标注而非默默照抄。
4. **演示准确性**
   - 演示必须反映协议真实行为，不做只供观赏的动画。
   - 新演示统一复用 `src/components/demos/DemoKit.tsx` 的控制条与步骤说明。
   - 等距图解放在 `src/components/figures/`，用 `figureKit` 的 `FigureCard` 与 `Scene`；
     图中每个数字必须与正文一致。图解 ID 形如 `f{知识点后缀}-{名称}`，在
     `components/figures/registry.ts` 注册，并通过知识点的 `figureIds` 引用。
     每小节至少一张，必须是实体物件（禁止横竖线拼成的线框示意图）。
     绘制可参考 anatomy skill 的 `SKILL.md` 与项目内 `components/iso/` 工具包。
5. **路由与部署**
   - 保持 HashRouter，确保 `dist/index.html` 可双击直接打开。

## 目录与代码约定

- 内容：`src/content/chapters/*.ts`、`src/content/questions/*.ts`、`comparisons.ts`、`demos/index.ts`
- 用户数据：`src/db/studyDB.ts`
- 页面：`src/pages/`；通用组件：`src/components/`
- 图解：`src/components/figures/`（注册表 + 组件）；等距工具包：`src/components/iso/`（不要修改工具包）
- 类型：`src/types/content.ts`
- 测试：`src/test/`

正文行内语法：`**加粗**` 表示结论，`==高亮==` 表示核心术语，`$...$` / `$$...$$` 表示公式。
多字母下标（`d_{trans}`）会自动转为正体；裸数学符号必须包进 `$...$`，`presentation.test.ts` 会检查。

大文件拆分：章节正文或题库单文件过长时，按 part 拆分后用一个聚合文件导出，
参考 `chapters/ch3.ts` 与 `questions/index.ts`。

## 新增一章的流程

1. `node scripts/scan-ppt.mjs` 提取 PPT 文本（PPT 不提交到仓库）。
2. 在 `outline.ts` 追加章节、小节、知识点 ID，并登记到 `chapterOutlines`。
3. 新建 `chapters/chN.ts`，遵循 `AUTHORING.md`。
4. 新建/追加 `questions/*`，选项解析齐全。
5. 在 `registry.ts` 注册章节。
6. 如需演示：实现组件 → 在 `content/demos/index.ts` 注册。
7. 运行校验命令，更新覆盖报告。

## 已知坑

- 单次写超大文件容易失败：单文件尽量控制在 1000 行以内，超长就拆分。
- `comparisons.ts` 的 `rows[i]` 长度必须等于 `subjects.length`，测试会拦截。
- KaTeX 字符串中的反斜杠要写双份。
- README/设计文档中的“24 个演示”为旧数据，实际是 25 个；修改时不要沿用。
- 课程 PPT 与 `reference/ppt-text/` 受版权保护，**不得提交**（已在 `.gitignore` 中排除）。

## 完成标准

- 类型检查 0 错误，测试全过，构建成功。
- 新内容有 PPT 页码来源，覆盖报告同步更新。
- 不破坏既有 ID 与用户数据兼容性。
