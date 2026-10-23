import type { Subsection } from '../../types/content'

export const ch2S26: Subsection[] = [
        {
          id: 's2.6.1',
          title: '文件分发模型',
          knowledge: [
            {
              id: 'k2.6.1',
              title: 'C/S 与 P2P 分发时间对比',
              en: 'Distribution Time',
              summary:
                '客户-服务器分发时间为 $\max\{NF/u_s,\ F/d_{min}\}$，随 N 线性增长；P2P 分发时间为 $\max\{F/u_s,\ F/d_{min},\ NF/(u_s+\sum u_i)\}$，随 N 增长但增速逐渐放缓，并趋于上界。',
              tags: ['P2P', '文件分发', '分发时间', '公式'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [99, 100, 101, 102] },
                { kind: 'kaoyan', note: '王道考研：P2P 与 C/S 文件分发时间公式是必考计算题' },
              ],
              insight: {
                why:
                  '为什么要研究分发时间？因为这是衡量 P2P 架构价值的量化指标：' +
                  '在相同的文件大小与相同的用户规模下，**哪种架构能让用户更快拿到文件**？' +
                  '公式推导出的结论是：**C/S 随 N 线性增长；P2P 虽然也增长，但远慢于线性，且有上界**——' +
                  'P2P 把可用的总上传能力从 $u_s$ 扩展到 $u_s + \\sum u_i$。',
                coreIdea:
                  '要向 N 个对等端分发大小为 F 的文件，问题归结为：每个对等端的下载速率（download rate）是有限的资源。' +
                  '客户-服务器：服务器必须顺序上传 N 份副本；' +
                  'P2P：服务器只需上传**至少一份**，其余由对等端之间互相上传完成。',
                mechanism:
                  '两条关键约束决定了公式的形式：' +
                  '① 每个客户必须下载一份完整副本，因此最快也要 $F/d_{min}$（$d_{min}$ 是最小下载速率）；' +
                  '② 服务器的上传能力是有限的：C/S 模式下服务器要上传 N 份，耗时 $NF/u_s$；' +
                  'P2P 模式下服务器至少要上传一份，耗时 $F/u_s$，' +
                  '而所有对等端聚合起来要下载 NF bit，最大可用上传能力是 $u_s + \\sum_{i=1}^{N} u_i$。',
                comparison:
                  'C/S 的 $D_{c-s} = \\max\\{NF/u_s,\\ F/d_{min}\\}$ 随 N 线性增长，且瓶颈是服务器；' +
                  'P2P 的 $D_{P2P} = \\max\\{F/u_s,\\ F/d_{min},\\ NF/(u_s+\\sum_{i=1}^{N}u_i)\\}$ 增长远慢于线性，' +
                  '但**分母随 N 增大**，所以斜率更小、扩展性更好。' +
                  '当 N 很大时，P2P 明显占优；当 N 很小时，C/S 反而更快（P2P 要经过多跳转发）。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '**问题：把大小为 F 的文件分发给 N 个对等端（peer），需要多长时间？**（PPT 第 99 页）' +
                    '关键前提：**对等端的上传/下载能力是有限的资源**。',
                },
                { type: 'h', text: '一、客户-服务器模式（PPT 第 100 页）' },
                {
                  type: 'p',
                  text:
                    '服务器必须顺序上传（upload）N 份文件副本：' +
                    '发送一份副本的时间是 $F/u_s$；发送 N 份需要 $NF/u_s$，**随 N 线性增长**。' +
                    '同时，每个客户端都必须下载一份完整副本，因此最短下载时间是 $F/d_{min}$，' +
                    '其中 $d_{min}$ 是**最小客户端下载速率**（min client download rate）。',
                },
                {
                  type: 'formula',
                  latex: 'D_{c-s} = \\max\\left\\{ \\frac{NF}{u_s},\\ \\frac{F}{d_{min}} \\right\\}',
                  caption: '客户-服务器模式下的文件分发时间',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: 'D_{c-s}', meaning: '使用客户-服务器方式把 F 分发给 N 个客户端所需的时间', unit: 's' },
                    { symbol: 'F', meaning: '文件大小', unit: 'bit' },
                    { symbol: 'N', meaning: '需要接收文件副本的客户端数量', unit: '个' },
                    { symbol: 'u_s', meaning: '服务器的上传速率（server upload rate）', unit: 'bps' },
                    { symbol: 'd_{min}', meaning: '所有客户端中**最小**的下载速率', unit: 'bps' },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '两项取 max 的含义',
                  text:
                    '$\\frac{NF}{u_s}$ 约束的是**服务器**（它要发 N 份）；' +
                    '$\\frac{F}{d_{min}}$ 约束的是**客户端**（最慢的那个也得下完一整份）。' +
                    '实际完成时间取两者的较大者——这是典型的“并行任务取瓶颈”结构，' +
                    '与第一章的“吞吐量受限于最慢链路”思路一致。',
                },
                { type: 'h', text: '二、P2P 模式（PPT 第 101 页）' },
                {
                  type: 'p',
                  text:
                    '在 P2P 模式中，服务器**只需上传至少一份副本**，耗时 $F/u_s$。' +
                    '其余副本由对等端之间互相上传完成：所有客户端合计需要下载 NF bit，' +
                    '可用的总上传能力（==聚合上传能力==）为 $u_s + \\sum u_i$。' +
                    '每个对等端都贡献自己的上传能力，**这正是 P2P 自我扩展的数学表达**。',
                },
                {
                  type: 'formula',
                  latex: 'D_{P2P} = \\max\\left\\{ \\frac{F}{u_s},\\ \\frac{F}{d_{min}},\\ \\frac{NF}{u_s + \\sum_{i=1}^{N} u_i} \\right\\}',
                  caption: 'P2P 模式下的文件分发时间',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: 'D_{P2P}', meaning: '使用 P2P 方式把 F 分发给 N 个对等端所需的时间', unit: 's' },
                    { symbol: 'u_i', meaning: '第 i 个对等端的上传速率（peer upload rate）', unit: 'bps' },
                    { symbol: '\\sum_{i=1}^{N} u_i', meaning: '所有对等端上传速率之和（聚合服务能力）', unit: 'bps' },
                    { symbol: '其余符号', meaning: '与 $D_{c-s}$ 相同：F、N、$u_s$、$d_{min}$', unit: '—' },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: 'PPT 排版勘误：$D_{P2P}$ 的第三项',
                  text:
                    'PPT 第 100、101 页的原文写作 `Dc-s > max{NF/us,,F/dmin}` 与 `DP2P > max{F/us,,F/dmin,,NF/(us + Sui)}`，' +
                    '其中存在两处**排版/录入问题**：' +
                    '① 两式的 `>` 应为 `=`（等号被误输入为大于号）；' +
                    '② P2P 式的第三项分母 `us + Sui` 应为 **$u_s + \\sum_{i=1}^{N} u_i$**，' +
                    '其中 `Sui` 是求和符号 $\\sum$ 与上下标 $u_i$ 合并后的错位显示，' +
                    '求和范围是 i = 1 到 N。' +
                    '正确的公式为：' +
                    '$D_{P2P} = \\max\\{F/u_s,\\ F/d_{min},\\ NF/(u_s+\\sum_{i=1}^{N}u_i)\\}$。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：两式对比怎么答',
                  text:
                    '① **C/S 随 N 线性增长**（$NF/u_s$ 项），瓶颈在**服务器**；' +
                    '② P2P 的第三项随 N 增大但分母也随 N 增大（聚合上传能力），因此增长远慢于线性并趋于上界；' +
                    '③ P2P 公式中的 $F/u_s$ 与 $F/d_{min}$ 反映了“服务器至少要发一份”“最慢客户端至少要下一份”的下界；' +
                    '④ C/S 与 P2P 的最优应用规模不同：N 小用 C/S，N 大用 P2P。',
                },
                { type: 'h', text: '三、例题（PPT 第 102 页）' },
                {
                  type: 'p',
                  text:
                    'PPT 第 102 页给出的条件是：**客户上传速率 $u$，$F/u$ = 1 小时，$u_s = 10u$，$d_{min} \\ge u_s$**。' +
                    '即：单个对等端的上传速率是 $u$，传完一份文件要 1 小时；' +
                    '服务器的上传速率是单个对等端的 10 倍；所有客户中最慢的下载速率不低于服务器上传速率。',
                },
                {
                  type: 'example',
                  title: '推导：$F/u_s$ 与 $F/d_{min}$',
                  steps: [
                    '由 $F/u = 1$ 小时得 $F/u = 3600$ s，故 $F = 3600u$',
                    '$u_s = 10u$，所以 $F/u_s = 3600u / 10u = 360$ s = **0.1 小时**',
                    '$d_{min} \\ge u_s = 10u$，所以 $F/d_{min} \\le F/u_s = 360$ s',
                    '结论：$F/u_s = 0.1$ h 与 $F/d_{min} \\le 0.1$ h，这两项都**不是瓶颈**',
                  ],
                  answer: '$F/u_s = 0.1$ 小时，$F/d_{min} \\le 0.1$ 小时。',
                },
                {
                  type: 'example',
                  title: 'C/S 模式：找 N 的临界值',
                  steps: [
                    '$D_{c-s} = \\max\\{NF/u_s,\\ F/d_{min}\\}$，而 $F/d_{min} \\le F/u_s$',
                    '当 $N \\ge 1$ 时 $NF/u_s \\ge F/u_s \\ge F/d_{min}$，所以 $D_{c-s} = NF/u_s = N \\times 0.1$ 小时',
                    '代入具体数值：$D_{c-s} = NF/(10u) = N \\times (F/u)/10 = N/10$ 小时',
                    '例如 N = 10 时 $D_{c-s} = 1$ 小时；N = 100 时 10 小时',
                  ],
                  answer: '$D_{c-s} = N/10$ 小时（因为 $F/u_s = 0.1$ 小时且它不小于 $F/d_{min}$）。',
                },
                {
                  type: 'example',
                  title: 'P2P 模式：对比同一组 N',
                  steps: [
                    '设所有对等端上传速率相同，均为 $u$（标准假设），则 $\\sum_{i=1}^{N} u_i = Nu$',
                    '$u_s + \\sum u_i = 10u + Nu = u(10+N)$',
                    '第三项 $= \\dfrac{NF}{u(10+N)} = \\dfrac{N \\times 3600u}{u(10+N)} = \\dfrac{3600N}{10+N}$ 秒',
                    '取 N = 10：$\\dfrac{3600\\times10}{20} = 1800$ s = 0.5 小时；' +
                    '而 C/S 需要 1 小时 → **P2P 更快**',
                    '取 N = 100：$\\dfrac{3600\\times100}{110} \\approx 3273$ s ≈ 0.91 小时；' +
                    '而 C/S 需要 10 小时 → **P2P 快约 11 倍**',
                    '当 N → ∞ 时，$\\dfrac{3600N}{N+10} \\to 3600$ s = 1 小时；' +
                    '而 C/S 的 $N/10$ 小时 → 无穷大。**P2P 的分发时间收敛到 1 小时，C/S 无限增长。**',
                  ],
                  answer: 'C/S：$D_{c-s}=N/10$ 小时（无上界）；P2P：$D_{P2P}=\\max\\{0.1,\\ \\le0.1,\\ 3600N/(N+10)\\}$ 小时，当 N 较大时第三项占主导且**有上界 1 小时**。',
                },
                {
                  type: 'table',
                  caption: '同一组 N 的分发时间对比（$F/u = 1$ 小时，$u_s = 10u$，各对等端上传速率均为 $u$）',
                  headers: ['对等端数 N', 'C/S 分发时间', 'P2P 分发时间（第三项）', '比较'],
                  rows: [
                    ['10', '1 小时', '0.5 小时', 'P2P 更快'],
                    ['100', '10 小时', '约 0.91 小时', 'P2P 约快 11 倍'],
                    ['趋于无穷', '无上界（N/10 小时）', '趋于 1 小时', 'P2P 有上界'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text:
                    '**C/S 靠服务器：分母是 $u_s$，分子是 $NF$；P2P 靠大家：分母是 $u_s+\\sum u_i$。**' +
                    '求和上下标记牢：**$\\sum_{i=1}^{N} u_i$**（从 1 到 N）。',
                },
                {
                  type: 'p',
                  text:
                    '结论：在上述假设下，**P2P 的分发时间有上界（约为 $F/u$），而 C/S 随 N 无界增长**。' +
                    '这是 P2P 架构在大规模分发场景下的根本优势。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd2.6.1-distribution',
                  label: '打开演示：C/S 与 P2P 文件分发时间',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.6.2',
                  label: '相关：BitTorrent：tracker、分块与 tit-for-tat',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.1.2',
                  label: '相关：客户-服务器、P2P 与混合架构',
                },
              ],
              questionIds: [],
              demoIds: ['d2.6.1-distribution'],
              related: ['k2.6.2', 'k2.1.2', 'k2.1.5'],
            },
          ],
        },
        {
          id: 's2.6.2',
          title: 'BitTorrent',
          knowledge: [
            {
              id: 'k2.6.2',
              figureIds: ['f2.6.2-bittorrent'],
              title: 'BitTorrent：tracker、分块与 tit-for-tat',
              en: 'BitTorrent',
              summary:
                'BitTorrent 用 tracker 交换对等端列表、文件按 256Kb 分块交换；请求分块“rarest first”，发送采用 tit-for-tat：每 10 秒重估前 4 名，每 30 秒随机乐观解阻一个对等端。',
              tags: ['BitTorrent', 'tracker', '分块', 'tit-for-tat', 'churn'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [98, 103, 104, 105, 106] },
                { kind: 'supplement', note: '补充：torrent 文件（扩展名 .torrent）与 tracker 协议的实际实现' },
              ],
              insight: {
                why:
                  '为什么纯 P2P 需要一个 **tracker（跟踪服务器）**？' +
                  '因为新加入的对等端不知道其他人在哪里。' +
                  '没有中心节点就永远无法建立第一个连接。' +
                  'tracker 只做一件事——**交换对等端列表**——它不保存文件、不传输数据，' +
                  '因此不会成为带宽瓶颈，也就不会破坏 P2P 的自扩展性。',
                coreIdea:
                  '**torrent（种子）**：一群互相交换文件分块（chunk）的对等端。' +
                  '**tracker**：跟踪参与某个 torrent 的对等端。' +
                  '文件被切成 256 Kb 的分块。' +
                  '对等端从 tracker 获得对等端列表，然后开始与列表中的对等端交换文件分块。',
                mechanism:
                  '请求分块：同一时刻不同对等端拥有不同的分块子集；' +
                  'Alice 周期性地向每个对等端询问它们拥有哪些分块，并优先请求**最稀有的分块（rarest first）**——' +
                  '这样能让最稀有的分块在整个群体中尽快扩散，避免“最后一块没人有”的死锁。' +
                  '发送分块采用 **tit-for-tat（以牙还牙）**：' +
                  'Alice 只向当前向她发送分块速率最高的 4 个对等端发送分块，其余被她 choke（阻塞）；' +
                  '每 10 秒重估一次前 4 名；每 30 秒随机选一个对等端开始发送分块，' +
                  '即乐观解阻（optimistically unchoke），这个新选中的对等端可能因此进入前 4 名。',
                comparison:
                  '纯 P2P 架构（PPT 第 98 页）：无 always-on 服务器，任意端系统直接通信，' +
                  '对等端间歇在线且 IP 会变化；典型应用有文件分发（BitTorrent）、流媒体（KanKan）、VoIP（Skype）。' +
                  '**tit-for-tat 的博弈论意义**：它是对“对等端也上传”这种利他行为的激励相容设计——' +
                  '你对我好，我对你更好；上传速率越高，越容易进入对方的前 4 名，' +
                  '所以**高上传速率能换来更快的下载速度**（find better trading partners, get file faster）。',
              },
              blocks: [
                { type: 'h', text: '一、纯 P2P 架构回顾（PPT 第 98 页）' },
                {
                  type: 'list',
                  items: [
                    '**没有 always-on 服务器**',
                    '**任意端系统直接互相通信**',
                    '对等端间歇性连接，并且会改变 IP 地址',
                    '典型应用：文件分发（BitTorrent）、流媒体（KanKan）、VoIP（Skype）',
                  ],
                },
                { type: 'h', text: '二、BitTorrent 的三个基本概念（PPT 第 103 页）' },
                {
                  type: 'table',
                  caption: 'BitTorrent 的核心概念',
                  headers: ['概念', '英文', '含义'],
                  rows: [
                    ['跟踪服务器', 'tracker', '**跟踪参与该 torrent 的对等端**，提供对等端列表'],
                    ['种子', 'torrent', '**一群互相交换文件分块的对等端**（一个“群组”）'],
                    ['分块', 'chunk', '文件被切分成 **256 Kb 的分块**在对等端之间传输'],
                  ],
                },
                {
                  type: 'figure',
                  alt: 'Alice 加入 BitTorrent torrent 的过程',
                  caption: 'PPT 第 103 页：P2P file distribution — BitTorrent',
                  ascii:
                    '   Alice 到达\n       │\n       ├──► 向 tracker 注册 / 请求对等端列表 ──► tracker\n       │        tracker 返回该 torrent 中的对等端列表\n       ├──► 连接其中的若干对等端（neighbors）\n       └──► 开始与 torrent 中的对等端交换文件分块\n\n   文件 = [chunk1][chunk2][chunk3] ... [chunkN]   每个 chunk = 256 Kb',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '**tracker 找人，torrent 是群，chunk 是块，块 256K。**',
                },
                { type: 'h', text: '三、对等端加入 torrent（PPT 第 104 页）' },
                {
                  type: 'list',
                  items: [
                    '新加入的对等端**没有任何分块**，但会随时间从其他对等端**逐渐积累**分块',
                    '向 tracker **注册**，获取对等端列表，并连接其中的一个子集（称为**邻居 neighbors**）',
                    '**在下载的同时，对等端也向其他对等端上传分块**',
                    '对等端可以**更换**与之交换分块的对象（peer may change peers）',
                    '**churn**：对等端可能随时来、随时走',
                    '**一旦拥有完整文件**，该对等端可以（自私地）离开，或（利他地）**留在 torrent 中继续做种（seeding）**',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: 'churn 为什么是难题',
                  text:
                    '对等端随时进出，意味着你辛苦积累的分块可能“蒸发”（你下了一半，对方离线了）。' +
                    '解决办法有两个：' +
                    '① **优先下最稀有的分块**（rarest first）——先拿走最容易被别人拿走的东西；' +
                    '② **分块冗余**：多个对等端都保有同一分块。' +
                    '这正是 BitTorrent 下一节两个核心策略的由来。',
                },
                { type: 'h', text: '四、请求分块与发送分块（PPT 第 105 页）' },
                {
                  type: 'table',
                  caption: 'BitTorrent 的两个策略',
                  headers: ['策略', '具体做法', '目的'],
                  rows: [
                    ['请求：rarest first（优先最稀有）', '同一时刻不同对等端拥有不同的分块子集；Alice 周期性地向每个对等端询问它们拥有哪些分块，并**优先请求最稀有的分块**', '让最稀有的分块在整个群体中**尽快扩散**，避免“最后一块没人有”的死锁'],
                    ['发送：tit-for-tat（以牙还牙）', 'Alice 向**当前向她发送分块速率最高的 4 个对等端**发送分块；其他对等端被她 choke（阻塞，不给它们分块）；**每 10 秒重估前 4 名**；每 30 秒随机选一个对等端开始发送，即乐观解阻（optimistically unchoke），它可能因此进入前 4 名', '激励对等端互相上传（上传者得到更快的下载回报）'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：三个数字必须记牢',
                  text:
                    '`256 Kb`：文件分块大小。' +
                    '`前 4 名（top 4）`：tit-for-tat 中 Alice 只向上传给她最快的 4 个对等端上传。' +
                    '`每 10 秒`：重估前 4 名。' +
                    '`每 30 秒`：随机选一个对等端乐观解阻。' +
                    '这四个数字几乎每年都会出现在考题中。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么要有“乐观解阻”这种看似亏本的设计？',
                  text:
                    '如果 Alice 永远只给固定的 4 个对等端上传，就可能陷入**局部最优**：' +
                    '固定的 4 个伙伴恰好下载速度慢，或者它们之间形成小团体互传，外面的高速对等端永远进不来。' +
                    '每 30 秒随机换一个“试用”对象，等于定期做一次探索（exploration），' +
                    '有可能发现上传速率高得多的新伙伴，从而提升自己的下载速度。' +
                    '这是经典的 **explore/exploit 权衡**。',
                },
                { type: 'h', text: '五、tit-for-tat 的完整闭环（PPT 第 106 页）' },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    'Alice **乐观解阻（optimistically unchokes）** Bob',
                    'Alice 成为 Bob 的**前四名提供者**之一，Bob 以此回报（reciprocates）',
                    'Bob 成为 Alice 的**前四名提供者**之一',
                    '**上传速率越高 → 找到更好的交易伙伴 → 文件拿得更快！**',
                  ],
                },
                {
                  type: 'figure',
                  alt: 'tit-for-tat 的互惠闭环',
                  caption: 'PPT 第 106 页：BitTorrent — tit-for-tat',
                  ascii:
                    '   Alice ──乐观解阻──► Bob\n     ▲                  │\n     │                  │ Bob 成为 Alice 的前 4 名提供者\n     │                  ▼\n     └──── Alice 成为 Bob 的前 4 名提供者 ────┘\n\n   结果：上传越快 → 越容易进入对方前 4 名 → 下载越快',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：现实中还有 DHT 与无 tracker 模式',
                  text:
                    '经典 BitTorrent 依赖 tracker（集中式索引）；' +
                    '后来的 **Mainline DHT**（分布式哈希表）把索引也去中心化，' +
                    '使纯 P2P 无 tracker 也能工作；' +
                    '磁力链接（magnet link）就是通过哈希值在 DHT 中找到同一文件的所有对等端。' +
                    '本章 PPT 第 124 页的总结页也提到了 “P2P: BitTorrent, DHT”。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd2.6.1-distribution',
                  label: '打开演示：P2P 文件分发时间（含 BitTorrent 场景）',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.6.1',
                  label: '相关：C/S 与 P2P 分发时间对比',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.1.2',
                  label: '相关：客户-服务器、P2P 与混合架构',
                },
              ],
              questionIds: [],
              demoIds: ['d2.6.1-distribution'],
              related: ['k2.6.1', 'k2.1.2'],
            },
          ],
        },
]
