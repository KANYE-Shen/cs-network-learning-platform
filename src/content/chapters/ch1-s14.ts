import type { Subsection } from '../../types/content'

export const ch1S14: Subsection[] = [
        {
          id: 's1.4.1',
          title: '吞吐量',
          knowledge: [
            {
              id: 'k1.4.1',
              title: '吞吐量与瓶颈链路',
              en: 'Throughput & Bottleneck Link',
              summary:
                '吞吐量是单位时间实际通过的数据量，分瞬时与平均；端到端吞吐量受路径上最慢的瓶颈链路限制，而不是由各段速率相加。',
              tags: ['吞吐量', '带宽', '瓶颈链路', '平均', '瞬时'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [60, 61, 62] }],
              insight: {
                why: '用户花钱买的是"带宽"，抱怨的却是"网速慢"。二者差距从何而来？答案是**吞吐量**。只有把吞吐量与带宽区分清楚，才能解释"为什么 100 Mbps 的宽带实际只有几 Mbps""为什么下载速度不随链路速率线性提升"。',
                coreIdea: '**吞吐量（throughput）**表示单位时间内通过某个网络（或信道、接口）的数据量。带宽（bandwidth）是链路的==能力上限==，吞吐量才是实际跑出来的量。',
                mechanism: '吞吐量有两个口径：瞬时吞吐量（instantaneous）是某一时刻的速率；平均吞吐量（average）是较长一段时间内的速率。端到端吞吐量的瓶颈是**瓶颈链路（bottleneck link）**——路径上速率最低的那一段。',
                comparison: '第 62 页给出了两个情形：若 $R_s < R_c$（发送方比接收方慢），端到端平均吞吐量是 $R_s$；若 $R_s > R_c$（接收方更慢），则是 $R_c$。核心结论：**吞吐量取"沿途最小值"，绝不取平均值或总和**。多段并行链路（如多流下载）可以聚合带宽，但单流路径仍受最慢段限制——这是"带宽叠加 ≠ 速度叠加"的原因。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 60 页是中文页，给出了吞吐量这一概念的权威表述：',
                },
                {
                  type: 'quote',
                  text: '吞吐量（throughput）表示在单位时间内通过某个网络（或信道、接口）的数据量。吞吐量更经常地用于对现实世界中的网络的一种测量，以便知道实际上到底有多少数据量能够通过网络。吞吐量受网络的带宽或网络的额定速率的限制。',
                  cite: 'Chapter1.pptx 第 60 页',
                },
                {
                  type: 'p',
                  text: '这段话有三个层次：① 定义：单位时间通过的数据量；② 用途：更多用于对现实网络做测量，知道实际有多少数据能通过；③ 限制：受网络带宽或额定速率限制。',
                },
                {
                  type: 'term',
                  zh: '吞吐量',
                  en: 'throughput',
                  def: '单位时间内实际通过某个网络、信道或接口的数据量，单位 bit/s。它是**测量值**，而带宽是链路的**能力上限**。吞吐量受带宽限制，但两者通常不相等。',
                },
                {
                  type: 'h',
                  text: '第 61 页：瞬时与平均',
                },
                {
                  type: 'p',
                  text: 'PPT 第 61 页给出定义：**"throughput: rate (bits/time unit) at which bits transferred between sender/receiver"**，并区分两种口径：',
                },
                {
                  type: 'table',
                  caption: '吞吐量的两种口径',
                  headers: ['口径', '英文', '含义', '特点'],
                  rows: [
                    ['瞬时吞吐量', 'instantaneous', '给定时刻的速率', '波动大，受拥塞、慢启动、协议状态影响'],
                    ['平均吞吐量', 'average', '较长时间段内的平均速率', '稳定，是评价链路与路径的常用指标'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么"瞬时"和"平均"要分开',
                  text: '因为 TCP 有慢启动、拥塞窗口涨落和超时重传，**瞬时速率是一条剧烈波动的曲线**；而用户和运营商关心的"这宽带到底多快"，通常指一段时间的平均值。题目若问"平均端到端吞吐量"，默认取时间平均值；只说"吞吐量"时，语境通常也是平均值。',
                },
                {
                  type: 'h',
                  text: '第 62 页：瓶颈链路',
                },
                {
                  type: 'p',
                  text: '第 62 页 "Throughput (more)" 画出两种情形，结论只有一句：**"link on end-end path that constrains end-end throughput"**——端到端路径上限制端到端吞吐量的那条链路，就是 **bottleneck link（瓶颈链路）**。',
                },
                {
                  type: 'figure',
                  alt: '两种吞吐率情形与瓶颈链路',
                  ascii:
                    '情形 A：Rs < Rc（发送方是瓶颈）\n' +
                    '   [发送端 Rs] ──────────────► [接收端 Rc]\n' +
                    '      慢                         快\n' +
                    '   端到端平均吞吐量 = Rs\n\n' +
                    '情形 B：Rs > Rc（接收方是瓶颈）\n' +
                    '   [发送端 Rs] ──────────────► [接收端 Rc]\n' +
                    '      快                         慢\n' +
                    '   端到端平均吞吐量 = Rc  ← 瓶颈链路在这一侧\n\n' +
                    '   多段路径：吞吐量 = min( R1, R2, ..., Rn )',
                  caption: '按 PPT 第 62 页整理的两种情形',
                },
                {
                  type: 'formula',
                  latex: 'Throughput_{end\\text{-}end} = \\min_{i} \\left\\{ R_i \\right\\}, \\qquad R_s = \\text{发送速率},\\ R_c = \\text{接收速率}',
                  caption: '端到端吞吐量由路径上最慢的链路（瓶颈链路）决定',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: 'R_s', meaning: '发送端速率（sender rate）', unit: 'bit/s' },
                    { symbol: 'R_c', meaning: '接收端速率（receiver rate）', unit: 'bit/s' },
                    { symbol: 'R_i', meaning: '端到端路径上第 i 段链路的速率', unit: 'bit/s' },
                    { symbol: 'Throughput_{end-end}', meaning: '端到端平均吞吐量', unit: 'bit/s' },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 吞吐量的定义（单位时间通过的数据量）与单位 bit/s；② 瞬时 vs 平均；③ **带宽 ≠ 吞吐量**：带宽是能力上限，吞吐量是实际值，且受带宽限制；④ **瓶颈链路 = 路径上最慢的一段**，端到端吞吐量取最小值而非平均值；⑤ 第 60 页那句"吞吐量受网络的带宽或网络的额定速率的限制"常被单独考。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① 不要把端到端吞吐量算成各段速率的**平均值**或**总和**——单流路径只能取最小值（这是"水桶效应"）；② 不要把带宽当成"网速"，带宽是链路上限；③ 区分"链路的额定速率"（能力）与"实际测量速率"（吞吐），第 60 页特意强调吞吐量"更经常地用于对现实世界中的网络的一种测量"。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**带宽是天花板，吞吐是实测量；单流看瓶颈，取小不取和。**”',
                },
                {
                  type: 'p',
                  text: '把这一节与前文连起来：k1.2.9 的"WiFi 54 Mbps 是链路速率不是应用速率"、k1.2.8 的"数据中心 100 Gbps 内部链路"、k1.3.3 的"分组越小首部开销越大"，都会体现在**实际吞吐量低于名义带宽**上。而下一个知识点 k1.4.2 要讲的**四种时延**，正是解释"为什么带宽再高，时延也降不下来"的钥匙。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd1.4.1-throughput',
                  label: '动手玩：瓶颈链路——端到端吞吐量受限于最慢的一段',
                },
              ],
              questionIds: ['q1.4.1-01', 'q1.4.1-02'],
              demoIds: ['d1.4.1-throughput'],
              related: ['k1.4.2', 'k1.2.9', 'k1.2.8'],
            },
          ],
        },
        {
          id: 's1.4.2',
          title: '时延',
          knowledge: [

            {
              id: 'k1.4.2',
              title: '四种时延：处理、排队、发送、传播',
              en: 'Nodal Delay',
              summary:
                '结点时延由处理时延、排队时延、发送时延和传播时延四部分组成；发送时延为 $L/R$，传播时延为 $d/s$，总时延为四者之和。',
              tags: ['时延', '处理时延', '排队时延', '发送时延', '传播时延', 'L/R', 'd/s'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [65, 66] }],
              insight: {
                why: '"网速慢"是个笼统的抱怨。要诊断问题，必须能拆开"慢"由哪一部分造成：是自己算得慢（处理）、是前面排了队（排队）、是链路窄（发送）、还是路太长（传播）？四者只有一部分能靠"换更快的链路"改善。',
                coreIdea: '**结点时延（nodal delay）** = 处理时延 + 排队时延 + 发送时延 + 传播时延。前两者发生在结点内部，后两者发生在链路上；==发送时延由链路速率决定，传播时延由距离与传播速度决定==。',
                mechanism: 'PPT 第 66 页逐条给出四个分量：$d_{proc}$（处理时延，通常几微秒或更少）、$d_{queue}$（排队时延，取决于拥塞）、$d_{trans}$（发送时延，$d_{trans} = L/R$，对低速链路显著）、$d_{prop}$（传播时延，从几微秒到几百毫秒）。',
                comparison: '因果链如下：发送时延与分组长度成正比、与链路速率成反比（减小分组或提高速率可改善）；传播时延与距离成正比、与传播速度成反比（**换更快的链路无效**，只能缩短距离或换介质——光速是上限）；排队时延取决于拥塞程度（靠扩容与拥塞控制改善）；处理时延通常是四项中最小的一项。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 65 页用一张从**结点 A 向结点 B 发送数据**的图，把时延的产生位置标得一清二楚：',
                },
                {
                  type: 'list',
                  items: [
                    '**在发送器产生传输时延（即发送时延）**——发生在发送器把比特推上链路时；',
                    '**在结点 A 中产生处理时延和排队时延**——发生在结点内部；',
                    '**在链路上产生传播时延**——比特在链路上飞的那段时间。',
                  ],
                },
                {
                  type: 'figure',
                  alt: '四种时延的产生位置',
                  ascii:
                    '   比特流 1 0 1 1 0 0 1 …\n' +
                    '   ┌────────┐                    ┌────────┐\n' +
                    '   │ 发送器 │══ 链 路 ══════════►│ 结点 B │\n' +
                    '   └────────┘                    └────────┘\n' +
                    '      ▲                ▲\n' +
                    '      │                │\n' +
                    '   ① 发送时延        ③ 传播时延\n' +
                    '      (dtrans = L/R)      (dprop = d/s)\n' +
                    '   ┌────────┐\n' +
                    '   │  队列  │ ← ② 排队时延 (dqueue) 取决于拥塞\n' +
                    '   └────────┘\n' +
                    '   结点 A 内：+ ④ 处理时延 (dproc)',
                  caption: '按 PPT 第 65 页整理的四种时延位置图',
                },
                {
                  type: 'p',
                  text: 'PPT 第 66 页 **"Nodal delay"** 给出四个分量的定义与量级：',
                },
                {
                  type: 'table',
                  caption: '四种时延（PPT 第 66 页）',
                  headers: ['符号', '英文', '中文', '量级 / 特点', '取决于'],
                  rows: [
                    ['$d_{proc}$', 'processing delay', '处理时延', 'typically a few microsecs or less（通常几微秒或更少）', '结点处理能力'],
                    ['$d_{queue}$', 'queuing delay', '排队时延', 'depends on congestion（取决于拥塞程度）', '队列长度、到达率'],
                    ['$d_{trans}$', 'transmission delay', '发送时延', '= $L/R$, significant for low-speed links（对低速链路显著）', '分组长度 $L$、链路速率 $R$'],
                    ['$d_{prop}$', 'propagation delay', '传播时延', 'a few microsecs to hundreds of msecs（几微秒到几百毫秒）', '距离 $d$、传播速度 $s$'],
                  ],
                },
                {
                  type: 'formula',
                  latex: 'd = d_{proc} + d_{queue} + d_{trans} + d_{prop}',
                  caption: '结点总时延 = 处理时延 + 排队时延 + 发送时延 + 传播时延',
                },
                {
                  type: 'formula',
                  latex: 'd_{trans} = \\frac{L}{R}, \\qquad d_{prop} = \\frac{d}{s}',
                  caption: '发送时延与传播时延的计算公式',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: 'd', meaning: '结点总时延（nodal delay）', unit: 's' },
                    { symbol: 'd_{proc}', meaning: '处理时延：检查分组首部、查转发表、决定下一跳所需的时间', unit: 's' },
                    { symbol: 'd_{queue}', meaning: '排队时延：分组在输出队列中等待前一个分组发完的时间', unit: 's' },
                    { symbol: 'd_{trans}', meaning: '发送时延：把 L 比特全部推上链路所需的时间', unit: 's' },
                    { symbol: 'd_{prop}', meaning: '传播时延：比特在链路中传播 $d$ 距离所需的时间', unit: 's' },
                    { symbol: 'L', meaning: '分组长度', unit: 'bit' },
                    { symbol: 'R', meaning: '链路传输速率（带宽）', unit: 'bps' },
                    { symbol: 'd', meaning: '链路物理长度（注意与总时延 $d$ 符号重名，答题时最好分别写成 $d_{dist}$ 与 $d_{total}$）', unit: 'm / km' },
                    { symbol: 's', meaning: '信号传播速度（在光纤中约 $2\\times10^8$ m/s，即真空光速的约 2/3）', unit: 'm/s' },
                  ],
                },
                {
                  type: 'example',
                  title: '四类时延的典型计算',
                  steps: [
                    '**发送时延**：一个 1500 bit 的分组经过 10 Mbps 链路，$d_{trans} = 1500 / 10\\times10^6 = 0.15$ ms。',
                    '**传播时延**：信号在光纤中以 $s \\approx 2\\times10^8$ m/s 传播 5000 km，$d_{prop} = 5\\times10^6 / 2\\times10^8 = 25$ ms。',
                    '**排队时延**：若前面还有 20 个同类分组在队列中，$d_{queue} = 20 \\times 0.15 = 3$ ms（拥塞时可能远大于此）。',
                    '**处理时延**：假设查表耗时 2 μs，则 $d_{proc} = 0.002$ ms。',
                    '总时延：$d = 0.002 + 3 + 0.15 + 25 = 28.152$ ms —— 注意传播时延占了绝大部分。',
                  ],
                  answer: '$d \\approx 28.15$ ms，其中 $d_{prop} = 25$ ms 为主导项（距离与光速决定，升级带宽无法改善）',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '本节的真正价值：分清"能治的"和"治不了的"',
                  text: '发送时延：换更快的链路、减小分组 → 有效。**排队时延**：扩容 + 拥塞控制 → 有效。处理时延：更快的硬件 → 有效。传播时延：只能缩短距离或换更快的传播介质——而电磁波在光纤中的速度已接近光速，这是物理上限。所以跨洋链路的 100 ms 往返（k1.4.5 的 RTT）是**物理约束，不是工程不足**。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 总时延公式 $d = d_{proc}+d_{queue}+d_{trans}+d_{prop}$；② $d_{trans} = L/R$ 与 $d_{prop} = d/s$ 的变量、单位与适用条件；③ 四个分量的产生位置（发送器 / 结点内部 / 链路）；④ 量级：处理几微秒、传播几微秒到几百毫秒、发送对低速链路显著、排队取决于拥塞；⑤ 单位换算：1 Mbps $= 10^6$ bit/s，1 ms $= 10^{-3}$ s。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：最经典的三个陷阱',
                  text: '① 混淆发送时延与传播时延：发送时延是"把比特推上链路"的时间（$L/R$），传播时延是"比特在链路里跑"的时间（$d/s$）；前者由速率决定，后者由距离决定。② 符号 $d$ 一符两义：总时延常记作 $d$，距离也常记作 $d$；答题时把距离写成 $d_{dist}$、总时延写成 $d_{total}$ 可避免歧义。③ 忘记 $s$ 不是 $3\\times10^8$ m/s：光在光纤中的传播速度约为真空光速的 2/3，即 $2\\times10^8$ m/s。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**处理排队在结点，发送在发送器，传播在路上飞；发送看长度和速率，传播看距离和光速；总时延四相加。**”',
                },
                {
                  type: 'p',
                  text: '注意 PPT 第 65 页图上那一串 "1 0 1 1 0 0 1 …"——它提醒我们时延是**逐比特**发生的：一个比特被推上链路用 $1/R$ 秒，传播用 $d/s$ 秒。**"最后一个比特到达"的时间 = 发送时延 + 传播时延**，这正是 k1.4.3 车队类比要回答的问题。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd1.4.2-nodal-delay',
                  label: '动手玩：四种时延计算器——分解处理/排队/发送/传播时延',
                },
              ],
              questionIds: ['q1.4.2-01', 'q1.4.2-02', 'q1.4.2-03'],
              demoIds: ['d1.4.2-nodal-delay'],
              related: ['k1.4.3', 'k1.4.4', 'k1.4.5'],
            },

            {
              id: 'k1.4.3',
              figureIds: ['f1.4.3-convoy'],
              title: '车队类比：发送时延与传播时延',
              en: 'Caravan Analogy',
              summary:
                '十车车队以 100 km/hr 行驶、收费站 12 秒：全部通过第一个收费站需 120 秒，末车行驶 100 km 需 1 小时，故 62 分钟后到第二个收费站；提速到 1000 km/hr 后 7 分钟即可到达。',
              tags: ['车队类比', '发送时延', '传播时延', '流水线', '62 分钟'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [63, 64] }],
              insight: {
                why: '"发送时延"和"传播时延"的分界在公式里很清楚，但在直觉上很容易混。车队类比用一个生活化的场景把两者分开：**收费站是"发送"，公路是"传播"**。',
                coreIdea: '**car ~ bit（车对应比特），caravan ~ packet（车队对应分组）**。收费站服务一辆车的时间 = 比特发送时间（$L/R$）；车队在公路上行驶的时间 = 传播时延（$d/s$）。整支车队"铺满"在收费站与公路上，就是流水线。',
                mechanism: '第 63 页设定：车以 100 km/hr 传播，收费站处理一辆车要 12 秒，两收费站相距 100 km，车队共 10 辆车。问题：**车队什么时候在第二个收费站前排成一队？**',
                comparison: '**第 63 页**：把 10 辆车全部"推"过第一个收费站需要 $12 \\times 10 = 120$ 秒；最后一辆车从第一个收费站开到第二个收费站需要 $100\\text{ km} / (100\\text{ km/hr}) = 1$ 小时。由于车队是流水线，前车已经在路上，只需追踪最后一辆车：它在 $t=120$ 秒驶离收费站，再行驶 1 小时，故 $t = 1\\text{ h} + 2\\text{ min} = 62$ 分钟。**第 64 页**：车速提到 1000 km/hr、收费站耗时 1 分钟，传播比发送快得多（7 分钟 vs 10 分钟），所以车队能在全部发完之前就开始抵达第二个收费站——这揭示了何时是发送时延主导、何时是传播时延主导。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 63 页 **"Caravan analogy"** 给出类比的对应关系：cars "propagate" at 100 km/hr（车以 100 km/hr "传播"）、toll booth takes 12 sec to service car (bit transmission time)（收费站处理一辆车 12 秒 = 比特发送时间）、car ~ bit; caravan ~ packet（车对应比特，车队对应分组）。图上有两个收费站（toll booth）、中间 100 km 路段、一支 ten-car caravan（十车车队）。',
                },
                {
                  type: 'h',
                  text: '第 63 页的计算：62 分钟是怎么来的',
                },
                {
                  type: 'p',
                  text: '问题：**Q: How long until caravan is lined up before 2nd toll booth?**（到什么时候，车队会在第二个收费站前排成一队？）',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '**time to "push" entire caravan through toll booth onto highway = 12 × 10 = 120 sec**——把整支车队推过第一个收费站进入公路，需要 $12 \\times 10 = 120$ 秒；',
                    '**time for last car to propagate from 1st to 2nd toll booth: 100 km / (100 km/hr) = 1 hr**——最后一辆车从第一个收费站传播到第二个收费站需要 $100\\text{ km} / (100\\text{ km/hr}) = 1$ 小时。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '关键：流水线只让前车提前上路',
                  text: '关键是分清"谁在等谁"。第一辆车在 $t=12$ 秒驶离第一个收费站，最后一辆车要到 $t=120$ 秒才驶离；问题问的是**最后一辆车**抵达第二个收费站的时刻。它要先排完 120 秒的队（含自身 12 秒服务），再在公路上跑 3600 秒，所以 $t = 120 + 3600 = 3720$ 秒 $= 62$ 分钟。**车队是流水线：前车提前上路，但最后一辆车要先排完 120 秒的队，再跑完 3600 秒，这两段时间在它身上是串行的。**',
                },
                {
                  type: 'formula',
                  latex: 't_{total} = \\frac{d}{s} + \\frac{N \\cdot L}{R} \\quad (\\text{当 } \\frac{d}{s} > \\frac{NL}{R})',
                  caption: '车队类比：末车抵达时刻 = 传播时间 + 车队通过第一个收费站的时间',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: 'd', meaning: '两个收费站之间的距离', unit: 'km' },
                    { symbol: 's', meaning: '车队的传播速度（100 km/hr）', unit: 'km/hr' },
                    { symbol: 'N', meaning: '车队车辆数（10 辆，对应分组数或比特数）', unit: '辆' },
                    { symbol: 'L', meaning: '每辆车占用的长度（对应每比特长度）', unit: '—' },
                    { symbol: 'R', meaning: '收费站的"发送速率"（每秒放行 1/12 辆）', unit: '辆/秒' },
                  ],
                },
                {
                  type: 'example',
                  title: 'PPT 第 63 页例题',
                  steps: [
                    '车队在公路上的传播时间：$100\\text{ km} / (100\\text{ km/hr}) = 1$ 小时 $= 3600$ 秒。',
                    '整支车队通过第一个收费站：$12\\text{ s/辆} \\times 10\\text{ 辆} = 120$ 秒。',
                    '两者是流水线关系：最后一辆车在 $t = 120$ 秒进入公路，在 $t = 120 + 3600 = 3720$ 秒抵达第二个收费站。',
                    '$3720$ 秒 $= 62$ 分钟。',
                  ],
                  answer: 'A: 62 minutes（62 分钟）',
                },
                {
                  type: 'h',
                  text: '第 64 页：什么时候是发送时延主导',
                },
                {
                  type: 'p',
                  text: '第 64 页把条件改了：**cars now "propagate" at 1000 km/hr**（车速 1000 km/hr）、toll booth now takes one min to service a car（收费站耗时 1 分钟），距离仍是 100 km、车队仍是 10 辆。问题变成：**Q: Will cars arrive to 2nd booth before all cars serviced at first booth?**（车会在第一个收费站把全部车服务完之前到达第二个收费站吗？）',
                },
                {
                  type: 'p',
                  text: '关键是比较两个时间：全部车辆通过第一个收费站需要 10 分钟，而首车走完全程只要 6 分钟。',
                },
                {
                  type: 'list',
                  items: [
                    '全部 10 辆车通过第一个收费站需要：$1\\text{ min/辆} \\times 10\\text{ 辆} = 10$ 分钟；',
                    '第一辆车从第一个收费站开到第二个收费站需要：$100\\text{ km} / (1000\\text{ km/hr}) = 0.1$ 小时 $= 6$ 分钟。',
                    '所以第一辆车在 $t = 1$ 分钟进入公路、$t = 1 + 6 = 7$ 分钟时抵达第二个收费站——**而此时第一个收费站才处理完 7 辆车，还有 3 辆没放行**。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示（这是第 64 页的核心）',
                  text: 'PPT 原文答案：**"A: Yes! after 7 min, 1st car arrives at second booth; three cars still at 1st booth."**——7 分钟后第一辆车到达第二个收费站，此时第一个收费站还有三辆车没被服务。数字要背准：7 分钟、还有 3 辆车。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '这一页想说明什么',
                  text: '第 63 页与第 64 页构成一组对照：传播慢于发送时（100 km/hr、12 秒/车），总时间由传播主导，车队像一条长龙铺在路上；发送慢于传播时（1000 km/hr、1 分钟/车），总时间由发送主导，公路上只有零星几辆车。这两页正好对应 k1.4.2 中"发送时延 vs 传播时延"哪个是瓶颈的判断。',
                },
                {
                  type: 'table',
                  caption: '两页车队类比对照',
                  headers: ['条件', '第 63 页', '第 64 页'],
                  rows: [
                    ['车速（传播速度）', '100 km/hr', '1000 km/hr'],
                    ['收费站耗时（发送时间）', '12 秒/辆', '1 分钟/辆'],
                    ['距离', '100 km', '100 km'],
                    ['车队规模', '10 辆', '10 辆'],
                    ['传播时间', '1 小时 = 60 分钟', '6 分钟'],
                    ['全部发送时间', '120 秒 = 2 分钟', '10 分钟'],
                    ['答案', '62 分钟（到第二个收费站排成一队）', '7 分钟后第一辆车到达，此时还有 3 辆在第一个收费站'],
                    ['主导因素', '传播时延主导', '发送时延主导'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① 第 63 页答案是 **62 分钟**而不是 60 分钟——最后一辆车要等到 $t=120$ 秒才驶离第一个收费站。② 第 64 页的 **7 分钟**是"第一辆车抵达第二收费站"的时刻，不是"全部抵达"的时刻。③ 流水线只让前车提前上路；对最后一辆车而言，通过收费站的 120 秒与行驶的 3600 秒仍是先后发生的。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**收费站是发送，公路是传播；一百公里一小时，十二秒一辆，十二乘十秒，最后要六十二。**”“**千速一分七分到，三辆还在一号亭**。”',
                },
                {
                  type: 'p',
                  text: '把车队类比映射回网络：车 = 比特，收费站 = 路由器，收费 12 秒 = 发送时延 $L/R$，公路 100 km = 链路长度，100 km/hr = 传播速度。于是"车队到齐"对应"整个分组全部通过链路"，"车流铺满公路"对应"流水线"。这个类比在第三章讲 TCP 流水线（GBN/SR）时会再次出现。',
                },
              ],
              questionIds: ['q1.4.3-01', 'q1.4.3-02'],
              related: ['k1.4.2', 'k1.3.3', 'k1.3.2'],
            },

            {
              id: 'k1.4.4',
              title: '排队时延与流量强度',
              en: 'Queueing Delay & Traffic Intensity',
              summary:
                '流量强度 $\\rho = La/R$：$\\rho \\to 0$ 时排队时延很小，$\\rho \\to 1$ 时急剧变大，$\\rho > 1$ 时到达的"工作量"多于能服务的，平均时延趋于无穷。',
              tags: ['排队时延', '流量强度', 'La/R', '拥塞', '缓冲区'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [68] }],
              insight: {
                why: '排队时延是四项时延中唯一**不可预测、可能爆炸**的一项：它由网络负载决定，与硬件无关。要能管理拥塞，就必须有一个指标把"负载"和"容量"放到同一个刻度上比较。',
                coreIdea: '**流量强度（traffic intensity）** $\\rho = La/R$：到达率与链路服务率之比。它把"负载"无量纲化——**$\\rho$ 越接近 1，排队时延越急剧膨胀**。',
                mechanism: '$R$ = 链路带宽（bps），$L$ = 分组长度（bit），$a$ = 平均分组到达率（分组/秒）。于是 $La$ 是比特到达率（bit/s），与链路速率 $R$ 直接可比。三种情形：① $La/R \\sim 0$：排队时延很小；② $La/R \\to 1$：时延变得很大；③ $La/R > 1$：到达的"工作量"多于链路能服务的量，平均时延趋于无穷。',
                comparison: '这三个情形就是拥塞的完整判据。**$\\rho < 1$ 时系统稳定**（服务能力大于到达率），但 $\\rho$ 逼近 1 时排队时延不是线性增长，而是**急剧上升**（排队论中的 $1/(1-\\rho)$ 量级）；$\\rho \\ge 1$ 时队列持续增长，缓冲区最终填满导致丢包（k1.4.6），且平均时延发散。这解释了为什么"带宽利用率"不能无限逼近 100%——运营者必须留出余量来吸收突发流量。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 68 页标题 **"Queueing delay (revisited)"**，把三个变量和判据一次列清：',
                },
                {
                  type: 'list',
                  items: [
                    '**$R$ = link bandwidth (bps)**——链路带宽；',
                    '**$L$ = packet length (bits)**——分组长度；',
                    '**$a$ = average packet arrival rate**——平均分组到达率；',
                    '**traffic intensity = $La/R$**——流量强度。',
                  ],
                },
                {
                  type: 'formula',
                  latex: '\\rho = \\frac{La}{R}',
                  caption: '流量强度（traffic intensity）：比特到达率与链路服务率之比',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: '\\rho', meaning: '流量强度，无量纲。$\\rho < 1$ 系统稳定，$\\rho \\to 1$ 时延急剧上升，$\\rho > 1$ 时延发散', unit: '—' },
                    { symbol: 'L', meaning: '分组长度', unit: 'bit' },
                    { symbol: 'a', meaning: '平均分组到达率（单位时间到达的分组个数）', unit: '分组/秒' },
                    { symbol: 'La', meaning: '比特到达率（$La$，即 $L \\times a$），必须与链路速率 $R$ 可比才有意义', unit: 'bit/s' },
                    { symbol: 'R', meaning: '链路带宽（传输速率）', unit: 'bps' },
                  ],
                },
                {
                  type: 'p',
                  text: '**为什么 $L$ 要乘进公式？** 因为到达率 $a$ 的单位是"分组/秒"，只有乘上每个分组的比特数 $L$，才得到"比特/秒"，才能与链路速率 $R$ 直接比较。这个换算是本题最容易出错的地方，也是教材把它单独列出来讲的原因。',
                },
                {
                  type: 'h',
                  text: '三种情形',
                },
                {
                  type: 'table',
                  caption: '流量强度的三种情形（PPT 第 68 页）',
                  headers: ['条件', 'PPT 原文', '物理含义', '工程结论'],
                  rows: [
                    ['$\\rho \\approx 0$', 'La/R ~ 0: average queueing delay small', '链路很空闲，分组几乎不用排队', '时延主要由传播时延决定'],
                    ['$\\rho \\to 1$', 'La/R -> 1: delays become large', '链路刚好饱和，队列极不稳定', '**必须避免**：时延急剧上升'],
                    ['$\\rho > 1$', 'La/R > 1: more "work" arriving than can be serviced, average delay infinite!', '到达的工作量超过服务能力', '队列持续增长 → 缓冲满 → 丢包'],
                  ],
                },
                {
                  type: 'example',
                  title: '流量强度计算示例',
                  steps: [
                    '设链路带宽 $R = 10$ Mbps，分组长度 $L = 1000$ bit，平均到达率 $a = 8000$ 分组/秒。',
                    '比特到达率：$La = 1000 \\times 8000 = 8\\times10^6$ bit/s $= 8$ Mbps。',
                    '流量强度：$\\rho = La/R = 8/10 = 0.8$。',
                    '结论：$\\rho = 0.8$ 尚属稳定，但已相当接近 1，排队时延会明显；若到达率升到 10000 分组/秒，则 $La = 10$ Mbps，$\\rho = 1$，队列持续增长。',
                  ],
                  answer: '$\\rho = 0.8$（稳定但接近饱和）；$\\rho = 1$ 时到达工作量恰好等于服务能力，队列开始无限增长',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么接近饱和时，时延"急剧"上升',
                  text: '排队论的经典结论是：平均排队时延大致与 $\\rho/(1-\\rho)$（或 $1/(1-\\rho)$）成正比。$\\rho = 0.5$ 时，$(1-\\rho)^{-1} = 2$；$\\rho = 0.9$ 时是 10；$\\rho = 0.99$ 时是 100；$\\rho = 0.999$ 时是 1000。**越接近 1，时延被放大得越厉害**——这就是"链路利用率不能跑到 100%"的数学原因，也是运营商要预留容量、TCP 要做拥塞控制的原因。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 流量强度 $\\rho = La/R$ 的公式与三个变量的含义、单位；② 三个情形（$\\rho \\approx 0$ / $\\rho \\to 1$ / $\\rho > 1$）及其后果；③ 关键句："more work arriving than can be serviced, average delay infinite"；④ $\\rho > 1$ 与丢包（k1.4.6）的因果关系。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① **$a$ 是分组到达率，不是比特率**——所以必须乘 $L$；② 单位要一致：$L$ 用 bit、$R$ 用 bps、$a$ 用分组/秒；③ 不要把 $\\rho$ 说成"链路利用率"后就不管它了——正因如此才有"利用率越高时延越差"这条经典结论；④ $\\rho > 1$ 时的正确表述是"平均时延趋于无穷"（队列无界增长），而不是"时延变大"。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**流量强度 $La$ 比 $R$**：小则不排，近一则炸，过一则无穷。”配一句工程版：“**利用率别跑满，一满就遭殃。**”',
                },
                {
                  type: 'p',
                  text: '把这一节与前面连起来：k1.3.2 说过"分组到达速率超过链路速率时会排队、缓冲区满会丢包"，这一节给出了那个"超过"的**定量判据**；k1.4.6 的丢包正是 $\\rho \\ge 1$ 的必然后果；而 TCP 的拥塞控制（k1.2.3）本质就是让端系统主动把 $\\rho$ 控制在 1 以下。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd1.4.4-queueing',
                  label: '动手玩：流量强度——观察排队时延如何在利用率接近 1 时急剧上升',
                },
              ],
              questionIds: ['q1.4.4-01', 'q1.4.4-02'],
              demoIds: ['d1.4.4-queueing'],
              related: ['k1.4.6', 'k1.3.2', 'k1.2.3'],
            },

            {
              id: 'k1.4.5',
              title: 'RTT 与 traceroute 测量',
              en: 'RTT & Traceroute',
              summary:
                'RTT 是从发送到收到确认的总时间，往返时间带宽积决定"在途数据量"；traceroute 用三个探测包逐跳测量真实路径时延。',
              tags: ['RTT', '往返时间', '带宽积', 'traceroute', '时延测量'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [67, 69, 70] }],
              insight: {
                why: 'RTT 是衡量"网络快慢"最常用的单一指标，也是 TCP 拥塞控制与超时重传的时钟基准。traceroute 则让用户能亲手看到这条路径。',
                coreIdea: '**RTT（Round-Trip Time，往返时间）**：从发送端发送数据开始，到发送端收到来自接收端的确认（接收端收到数据后立即发送确认）所经历的总时间。**往返时间带宽积（bandwidth-delay product）** = RTT × 带宽，表示"在途（inflight）的数据量"。',
                mechanism: '**Traceroute** 程序从源到目的沿路径逐跳测量时延：对所有 $i$，发出三个将到达路径上第 $i$ 个路由器的探测包，路由器把包返回发送端，发送端测量从发出到收到回复的时间间隔。三个探测包用于抵抗丢包。',
                comparison: 'RTT 与 k1.4.2 的四项时延是**叠加**关系：一次 RTT 包含去程与回程的发送时延、传播时延、排队时延、处理时延。带宽积这个概念解释了为什么"带宽高 + RTT 长"的链路（如卫星）需要大窗口才能跑满带宽——窗口不够，发出去的数据还没回来确认，链路就空转了。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 67 页是中文页，对 RTT 的定义写得非常完整：',
                },
                {
                  type: 'quote',
                  text: '往返时间 RTT (Round-Trip Time) 表示从发送端发送数据开始，到发送端收到来自接收端的确认（接收端收到数据后立即发送确认）总共经历的时间。',
                  cite: 'Chapter1.pptx 第 67 页',
                },
                {
                  type: 'p',
                  text: '这一定义里有三个关键限定，答题时要能说出来：**① 起点是"发送端发出数据"；② 终点是"发送端收到确认"；③ 接收端收到数据后"立即"发送确认**——所以 RTT ≈ 去程时延 + 回程时延 + 两次处理/排队开销。',
                },
                {
                  type: 'term',
                  zh: '往返时间',
                  en: 'Round-Trip Time',
                  abbr: 'RTT',
                  def: '从发送端发出数据到发送端收到接收端确认所经历的总时间。它是衡量网络时延的标准指标，也是 TCP 超时重传与拥塞控制的基本时钟单位。',
                },
                {
                  type: 'term',
                  zh: '往返时间带宽积',
                  en: 'bandwidth-delay product',
                  abbr: 'BDP',
                  def: 'RTT 与链路带宽的乘积，表示"在途未确认的数据量"的尺度：链路带宽 × RTT。它决定了传输窗口至少要开多大才能跑满链路。',
                },
                {
                  type: 'formula',
                  latex: 'BDP = R_{link} \\times RTT',
                  caption: '往返时间带宽积：在途数据量 = 带宽 × 往返时间',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: 'BDP', meaning: '往返时间带宽积，表示在途（inflight）数据量的尺度', unit: 'bit' },
                    { symbol: 'R_{link}', meaning: '链路带宽', unit: 'bit/s' },
                    { symbol: 'RTT', meaning: '往返时间', unit: 's' },
                  ],
                },
                {
                  type: 'example',
                  title: '带宽积与窗口大小',
                  steps: [
                    '一条 100 Mbps 的链路，RTT = 100 ms（典型跨洋时延）。',
                    'BDP $= 100\\times10^6 \\times 0.1 = 10^7$ bit $= 10$ Mbit $= 1.25$ MB。',
                    '结论：发送窗口若小于 1.25 MB，链路就跑不满——因为数据发出去后要等 RTT 才收到确认，窗口不够时链路上没有足够数据可发。',
                    '这正是 TCP 需要**足够大的拥塞窗口**、以及卫星链路（270 ms 时延）特别吃带宽积的原因。',
                  ],
                  answer: 'BDP = 10 Mbit（1.25 MB）——窗口必须不小于这个量级才能跑满 100 Mbps',
                },
                {
                  type: 'h',
                  text: 'PPT 第 69 页：traceroute 怎么测',
                },
                {
                  type: 'p',
                  text: '第 69 页标题 **"‘Real’ Internet delays and routes"**，先问 **"What do ‘real’ Internet delay & loss look like?"**，然后给出 traceroute 的原理：',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    'Traceroute program: provides delay measurement from source to router along end-end Internet path towards destination——提供从源到路径上各路由器的时延测量；',
                    '**For all i: sends three packets that will reach router i on path towards destination**——对每个 $i$，发出**三个**将到达第 $i$ 个路由器的探测包；',
                    '**router i will return packets to sender**——第 $i$ 个路由器把包返回给发送端；',
                    '**sender times interval between transmission and reply**——发送端测量"发出 → 收到回复"之间的时间间隔。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么每个路由器要发三个探测包',
                  text: '探测包可能被丢弃：IP 不保证一定返回 ICMP 差错报文，路由器对 TTL 超时的响应速率也有限。发三个包、取其中的最小值（或中位数），是常用的抗干扰做法。这也解释了 traceroute 输出里的 `* * *`——它表示该跳的探测包全部无响应（被丢弃或路由器不回复），**不等于路径断了**，只说明这一跳"没测出来"。',
                },
                {
                  type: 'h',
                  text: 'PPT 第 70 页：真实的互联网时延与路径',
                },
                {
                  type: 'p',
                  text: '第 70 页给出了一次真实的 traceroute：从 **gaia.cs.umass.edu** 到 **www.eurecom.fr**。数据节选：',
                },
                {
                  type: 'table',
                  caption: 'traceroute 实测数据（PPT 第 70 页节选）',
                  headers: ['跳数', '路由器', '三次探测时延'],
                  rows: [
                    ['1', 'cs-gw (128.119.240.254)', '1 ms / 1 ms / 2 ms'],
                    ['2', 'border1-rt-fa5-1-0.gw.umass.edu (128.119.3.145)', '1 ms / 1 ms / 2 ms'],
                    ['3', 'cht-vbns.gw.umass.edu (128.119.3.130)', '6 ms / 5 ms / 5 ms'],
                    ['4', 'jn1-at1-0-0-19.wor.vbns.net (204.147.132.129)', '16 ms / 11 ms / 13 ms'],
                    ['5', 'jn1-so7-0-0-0.wae.vbns.net (204.147.136.136)', '21 ms / 18 ms / 18 ms'],
                    ['6', 'abilene-vbns.abilene.ucaid.edu (198.32.11.9)', '22 ms / 18 ms / 22 ms'],
                    ['7', 'nycm-wash.abilene.ucaid.edu (198.32.8.46)', '22 ms / 22 ms / 22 ms'],
                    ['8', '62.40.103.253', '104 ms / 109 ms / 106 ms'],
                    ['9', 'de2-1.de1.de.geant.net (62.40.96.129)', '109 ms / 102 ms / 104 ms'],
                    ['10', 'de.fr1.fr.geant.net (62.40.96.50)', '113 ms / 121 ms / 114 ms'],
                    ['15', 'eurecom-valbonne.r3t2.ft.net (193.48.50.54)', '135 ms / 128 ms / 133 ms'],
                    ['17–18', '* * *', '无响应（探测包丢失，路由器未回复）'],
                    ['19', 'fantasia.eurecom.fr (193.55.113.142)', '132 ms / 128 ms / 136 ms'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '这张表里的三个观察',
                  text: '① 第 8 跳是跨大西洋链路（trans-oceanic link）：时延从第 7 跳的 22 ms 突增到 104 ms，一次跳就多了 80 ms——**这 80 ms 几乎全是传播时延**（k1.4.2 的 $d_{prop}$），再多带宽也降不下来。② 同一次测量三个探测包数值不同（如 104/109/106 ms），说明路由与排队有抖动。③ 第 17、18 跳的 `* * *` 是"没测到"而非"不通"。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① RTT 的完整定义（发出 → 收到确认，含"接收端立即确认"这一条件）；② **往返时间带宽积 = 带宽 × RTT**，意义是决定窗口大小；③ traceroute 的三步原理（发三个包 → 逐跳路由器回包 → 发送端测时间）；④ traceroute 输出中 `*` 的含义（探测包丢失或路由器不回复）；⑤ 能读懂真实 traceroute 表并指出"哪一跳是跨洋链路"。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① **RTT 是"往返"，不是"单程"**——单程时延约为 RTT 的一半（对称路径假设）；② 不要把 BDP 说成"带宽除以 RTT"；③ traceroute 测的是逐跳时延，不是"应用层响应时间"；④ traceroute 显示的路径可能不是数据实际走的路径——因为后续探测包可能走不同的路由（负载分担）。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**RTT 出去又回来，带宽积在途量；三包测一跳，星号是没测到。**”',
                },
                {
                  type: 'p',
                  text: '把这一节串起来：RTT 是应用和协议感知时延的主要指标（用户点一下按钮到看到响应，体验的是 RTT 的若干倍）；BDP 是传输层协议设计的输入（第三章的 TCP 发送窗口与拥塞窗口都要考虑）；traceroute 是诊断时延位置的工具（定位到哪一段慢）。三者分别对应"感知、参数、诊断"，是本章性能部分的三件套。',
                },
              ],
              questionIds: ['q1.4.5-01', 'q1.4.5-02'],
              related: ['k1.4.2', 'k1.4.3', 'k1.2.11'],
            }
],
        },
        {
          id: 's1.4.3',
          title: '丢包',
          knowledge: [
            {
              id: 'k1.4.6',
              title: '丢包',
              en: 'Packet Loss',
              summary:
                '链路前的缓冲区容量有限，分组到达时若缓冲区已满就被丢弃；丢失的分组可能由前一结点、源主机重传，也可能根本不重传。',
              tags: ['丢包', '缓冲区', '拥塞', '重传', 'buffer'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [71] }],
              insight: {
                why: '在"尽力而为"的网络里，丢包是常态而非异常。要正确理解它，必须知道它**发生在哪儿**、为什么发生、以及谁来负责修复——这三个问题分别对应缓冲区、拥塞与重传机制。',
                coreIdea: '**丢包（packet loss）**：链路前的队列（缓冲区）容量有限，当分组到达时若缓冲区已满，该分组就被**丢弃（dropped / lost）**。',
                mechanism: 'PPT 第 71 页的图给出三个关键元素：A（正在发送分组的结点）、B（下游结点）、buffer（waiting area，等待区）。三个状态：packet being transmitted（正在被发送的分组）、packet arriving to full buffer is lost（到达已满缓冲区的分组被丢弃）、buffer。丢包发生在**缓冲区满**的那一刻。',
                comparison: '丢了以后怎么办？PPT 列出三种可能：lost packet may be retransmitted by previous node（由前一结点重传）、by source end system（由源端系统重传）、or not retransmitted at all（根本不重传）。三者的选择取决于协议：**TCP 会重传**（可靠交付）；**UDP 不重传**（尽力而为）。丢包本身不是错误，"丢了不重传"才是应用不可靠的根源。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 71 页 **"Packet loss"** 的正文只有三句，但逻辑极其完整：',
                },
                {
                  type: 'list',
                  items: [
                    '**queue (aka buffer) preceding link in buffer has finite capacity**——链路前的队列（也叫缓冲区）**容量有限**；',
                    '**when packet arrives to full queue, packet is dropped (aka lost)**——当分组到达时队列已满，分组被**丢弃（也就是丢失）**；',
                    '**lost packet may be retransmitted by previous node, by source end system, or not retransmitted at all**——丢失的分组可能由前一结点重传、可能由源端系统重传、也可能根本不重传。',
                  ],
                },
                {
                  type: 'figure',
                  alt: '缓冲区满导致分组被丢弃',
                  ascii:
                    '            链路（R）\n' +
                    '  ┌──────┐         ┌──────┐\n' +
                    '  │  A   │════════►│  B   │\n' +
                    '  └──────┘         └──────┘\n' +
                    '      ▲\n' +
                    '      │  packet being transmitted（正在发送）\n' +
                    '      └──► buffer (waiting area)  ← 容量有限\n' +
                    '             packet arriving to full buffer is lost（到达满缓冲区 → 丢弃）',
                  caption: '按 PPT 第 71 页整理的丢包示意',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '丢包是拥塞的直接后果',
                  text: '把这一节和 k1.4.4 的流量强度连起来看，链条就完整了：**$\\rho = La/R > 1$ → 到达速率超过服务速率 → 队列持续增长 → 缓冲区填满 → 分组被丢弃 → 丢包。** 因此"丢包率"是衡量拥塞最灵敏的指标（比时延更灵敏，因为时延在缓冲区满之前就开始上升了）。TCP 把丢包当作"网络拥塞的信号"，据此调整拥塞窗口——这是第三章的核心机制。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 丢包的直接原因是缓冲区满（队列容量有限）；② 丢包的三种后续处理：前一结点重传 / 源端系统重传 / 不重传；③ 丢包是拥塞的结果（$\\rho > 1$）；④ **TCP 重传、UDP 不重传**——这条对比是本章最常考的推论题。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① 丢包不只发生在缓冲区满这一种情况——实际网络中还有链路误码（物理层比特翻转）、路由变化导致的丢弃等；但按课件口径，"缓冲区满"是本知识点要说的原因。② 不要说"丢包是协议的 bug"——它是尽力而为网络在拥塞时的正常行为：如果路由器不丢包而无限排队，时延会趋于无穷（k1.4.4 的 $\\rho > 1$ 情形），网络就彻底瘫痪了。**丢包其实是网络的自救机制。**',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**缓冲有限装不下，丢包就此产生；前跳重传源重传，UDP 不管 TCP 心疼。**”',
                },
                {
                  type: 'p',
                  text: '回到第 45 页那个分组交换的例子：35 个用户时"同时活跃超过 10 人的概率"约 0.0004。**这个概率描述的是拥塞发生的可能性，不等于每个分组都会丢**——它表示链路容量不足的情况极少发生。当用户数升到 36、40，这个概率迅速上升（第 45 页的追问），拥塞与丢包才开始变得频繁，网络就需要更完善的拥塞控制与资源扩容。',
                },
              ],
              questionIds: ['q1.4.6-01'],
              related: ['k1.4.4', 'k1.2.3', 'k1.2.4'],
            },
          ],
        },
]
