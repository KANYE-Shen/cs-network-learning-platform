import type { Subsection } from '../../types/content'

export const ch1S13: Subsection[] = [
        {
          id: 's1.3.1',
          title: '交换方式',
          knowledge: [
            {
              id: 'k1.3.1',
              title: '电路交换',
              en: 'Circuit Switching',
              summary:
                '电路交换为每次通话预留端到端专用资源，用 FDM 或 TDM 把带宽切片专属分配；片空闲也不共享，性能有保证但利用率低。',
              tags: ['电路交换', 'FDM', 'TDM', '专用资源', '电话网'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [38, 39, 40, 41] }],
              insight: {
                why: '打电话最怕的是**时延不可预测、被他人干扰**。电路交换为此而生：给每次通话划出专属资源，用"独占"换"确定"。',
                coreIdea: '在通信开始前，为这次"呼叫（call）"**预留并分配端到端资源**；链路带宽被划分成若干"片（piece）"，每片归一次通话所有，==空闲时也不共享==。',
                mechanism: '把一条链路的带宽用两种方式切成片：**FDM（频分）**按频率切，**TDM（时分）**按时间切。通话期间该片专属于这次呼叫，中途即使没有数据也在占着（传统电话网的做法）。',
                comparison: '优点：性能可保证（circuit-like / guaranteed performance）、无排队时延、时延恒定。缺点：**资源闲置浪费**——一个静默的通话仍占着整片带宽；建立连接需要时间、需要信令；突发性数据（web、file sharing）效率极低。PPT 第 41 页用 4 个用户的例子画出 FDM 与 TDM 两种切法。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 38 页 **"The Network Core"** 先提出全章的核心问题：**"how is data transferred through net?"**——数据究竟怎样在网络里传输？随后给出两条答案线：circuit switching（电路交换，典型是电话网）与 packet-switching（分组交换，数据以离散的"块"穿过网络）。',
                },
                {
                  type: 'p',
                  text: '第 39 页 **"Network Core: Circuit Switching"** 给出了电路交换的完整定义：',
                },
                {
                  type: 'list',
                  items: [
                    '**end-end resources allocated to, reserved for "call" between source & dest**——为源与目的之间的这次"呼叫"分配并预留端到端资源；',
                    '**In diagram, each link has four circuits. call gets 2nd circuit in top link and 1st circuit in right link.**——图中每条链路有 4 条电路；这次呼叫在上方链路取第 2 条、在右侧链路取第 1 条；',
                    '**dedicated resources: no sharing**——资源专用，不共享；',
                    '**circuit-like (guaranteed) performance**——性能像电路一样有保证；',
                    '**circuit segment idle if not used by call (no sharing)**——没有被呼叫使用的电路片保持空闲（不共享）；',
                    '**Commonly used in traditional telephone networks**——传统电话网普遍使用它。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '核心矛盾：预留 vs 利用率',
                  text: '电路交换把"性能保证"和"资源浪费"绑定在了一起。打电话时线路被占着，即使你一句话不说——这是"预留"的必然代价。反过来，如果允许空闲电路被别人抢用，就无法保证你的通话质量。**这种取舍在 1.3.4 节与分组交换的对比中会看得更清楚。**',
                },
                {
                  type: 'h',
                  text: '链路带宽怎么切成"片"：FDM 与 TDM',
                },
                {
                  type: 'p',
                  text: 'PPT 第 40 页给出思路：**network resources (e.g., bandwidth) divided into "pieces"**，再把片分配给各个呼叫；**resource piece idle if not used by owning call (no sharing)**——未被所属呼叫使用的片保持空闲。',
                },
                {
                  type: 'p',
                  text: '切分方式有两种：frequency division（频分）与 time division（时分）；第 41 页用 4 users（4 个用户）的例子画出两种切法。',
                },
                {
                  type: 'table',
                  caption: 'FDM 与 TDM 切分链路带宽',
                  headers: ['维度', 'FDM 频分复用', 'TDM 时分复用'],
                  rows: [
                    ['英文', 'Frequency Division Multiplexing', 'Time Division Multiplexing'],
                    ['切分依据', '频率：不同用户占不同频带，同时传输', '时间：不同用户占不同时间片，交替传输'],
                    ['图上的坐标', '纵轴频率 / 横轴时间', '纵轴频率 / 横轴时间'],
                    ['特点', '各用户带宽恒定，但需预留保护频带', '各用户轮流使用全带宽'],
                    ['时延特征', '恒定，无排队', '存在排队（等待自己的时隙）'],
                    ['典型应用', 'HFC 电缆网、无线（OFDM）、传统广播', 'T1/E1 数字载波、SDH/SONET、PCM 传输'],
                  ],
                },
                {
                  type: 'figure',
                  alt: 'FDM 与 TDM 划分 4 条电路的示意图',
                  ascii:
                    'FDM（按频率切，4 个用户同时在线）\n' +
                    '  频率 ↑\n' +
                    '        ┌─────┐┌─────┐┌─────┐┌─────┐\n' +
                    '  用户1 │     ││     ││     ││     │\n' +
                    '        └─────┘└─────┘└─────┘└─────┘\n' +
                    '  时间 →\n\n' +
                    'TDM（按时间切，4 个用户轮流使用）\n' +
                    '  频率 ↑\n' +
                    '        ┌───────────────┐\n' +
                    '  用户1 │  时隙 1        │\n' +
                    '        ├──────┬────────┤\n' +
                    '  用户2 │时隙2 │        │\n' +
                    '        ├──────┴────────┤\n' +
                    '  用户3 │  时隙 3       │\n' +
                    '        ├───────────────┤\n' +
                    '  用户4 │  时隙 4       │\n' +
                    '        └───────────────┘\n' +
                    '  时间 →',
                  caption: '按 PPT 第 41 页 "4 users" 示例整理的 FDM / TDM 示意',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '注意 TDM 的“等待”',
                  text: 'FDM 下各用户**同时**占用自己的频带，时延恒定；TDM 下各用户**轮流**占用整条链路，一个用户即使没数据，它的时隙也被浪费掉了（除非做统计复用——那已经是分组交换的思想）。传统数字载波（T1/E1）用的是固定 TDM（PCM），后来发展的统计时分复用（STDM）本质上就是分组交换。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 电路交换的定义关键词：**为呼叫预留端到端资源、专用不共享、性能有保证、空闲不共享**；② **FDM 与 TDM** 的切分方式与适用场景；③ 电路交换的优点（时延确定）与缺点（资源浪费、需建立连接、突发数据效率低）；④ 与分组交换的对比（见 k1.3.4）。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① 电路交换**不是"一条物理线路独占"**，而是**带宽被切成片，一片一次呼叫**——多条呼叫可以共享同一条物理链路，这正是 FDM/TDM 的意义。② "空闲不共享"指的是空闲的那一片不分配给别人，不是说整条链路空闲。③ 传统电话网用电路交换，但现代 VoIP 早已改用分组交换。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**电路预留不共享，FDM 按频 TDM 按时；空闲照样占着，性能保证代价浪费**。”',
                },
                {
                  type: 'p',
                  text: '回到"为什么互联网不用电路交换"这个问题：互联网的主要负载是 web 浏览、视频与文件传输，**突发性强**。一个用户浏览网页时，95% 的时间链路是空的；如果为它预留一整片，网络容量就得按"最忙时刻的并发用户数"来配置，成本会急剧上升。',
                },
                {
                  type: 'p',
                  text: '**分组交换的统计复用正是为了解决这个问题**，这也是下一节 k1.3.2 的出发点。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd1.3.1-circuit-switch',
                  label: '动手玩：电路交换——链路资源如何被切块，空闲时隙为什么不共享',
                },
              ],
              questionIds: ['q1.3.1-01', 'q1.3.1-02'],
              demoIds: ['d1.3.1-circuit-switch'],
              related: ['k1.3.2', 'k1.3.4'],
            },
            {
              id: 'k1.3.2',
              title: '分组交换与存储转发',
              en: 'Packet Switching & Store-and-Forward',
              summary:
                '分组交换按需占用链路带宽，以统计复用提高利用率；存储转发要求结点收完整分组才能转发，三条链路时延为 $3L/R$。',
              tags: ['分组交换', '存储转发', '统计复用', '3L/R', '排队'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [42, 43, 47] }],
              insight: {
                why: '电路交换的浪费不适用于突发数据；而"边收边发"不可行——按存储转发机制，路由器要等整个分组收完，才能把它完整地发到下一条链路。因此必须回答：路由器到底要等多久？',
                coreIdea: '**分组交换（packet switching）**：把端到端数据流切成分组（packets），各用户的分组共享网络资源，每个分组独占整条链路的全部带宽在链路上传输，**按需使用（used as needed）**资源。',
                mechanism: '核心机制是**存储转发（store and forward）**：路由器必须收完整分组才能把它转发到下一条链路，因此分组在路由器中"一跳一跳"地前进。当到达速率（比特）超过链路传输速率时，分组会排队等待，缓冲区满则**丢弃（丢包）**。',
                comparison: '与电路交换相比：分组交换不需要建立连接、资源按需使用、链路利用率高，但会带来排队时延与丢包，且**无法提供电路式的性能保证**（1.3.4 节末尾提出的悬而未决问题）。与"边收边发"相比，存储转发多了等待时间，却保证了下一跳能立即发送；路由器收到完整首部即可查表，但通常要等整个分组收完才转发。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 42 页 **"Network Core: Packet Switching"** 逐条列出了分组交换的机制：',
                },
                {
                  type: 'list',
                  items: [
                    '**each end-end data stream divided into packets**——每个端到端数据流被分成若干分组；',
                    '**user A, B packets share network resources**——用户 A、B 的分组共享网络资源；',
                    '**each packet uses full link bandwidth**——每个分组在链路上传输时**独占该链路的全部带宽**；',
                    '**resources used as needed**——资源**按需使用**；',
                    '**resource contention: aggregate resource demand can exceed amount available**——资源竞争：总需求可能超过可用量；',
                    '**congestion: packets queue, wait for link use**——拥塞：分组排队等待链路；',
                    '**store and forward: packets move one hop at a time; node receives complete packet before forwarding**——存储转发：分组一跳一跳前进，**结点收完整分组后才能转发**。',
                  ],
                },
                {
                  type: 'term',
                  zh: '存储转发',
                  en: 'store and forward',
                  def: '分组交换中的转发方式：路由器先完整接收一个分组（存入缓冲区），再根据首部信息决定下一跳并发送。因此每个分组在每条链路上都要花费完整的发送时间，形成"串行化"的开销。',
                },
                {
                  type: 'p',
                  text: 'PPT 第 43 页补充了 **"Packet Switching: Statistical Multiplexing"**（统计复用）的后果：',
                },
                {
                  type: 'list',
                  items: [
                    '**If arrival rate (in bits) to link exceeds transmission rate of link for a period of time: packets will queue, wait to be transmitted on link**——若一段时间内到达链路的比特率超过链路的传输速率，分组就会排队等待；',
                    '**packets can be dropped (lost) if memory (buffer) fills up**——若存储器（缓冲区）填满，分组会被丢弃（丢失）。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '统计复用：分组交换效率高的根本原因',
                  text: '**统计复用**是指链路容量不按"最坏情况"预留，而是按各用户的平均需求配置——因为用户不会同时满速发送。A 用户在下载、B 用户在打字、C 用户空闲，实际占用只有平均负载的一部分，剩下的容量被分时复用。这正是 k1.3.4 的核心结论：同样一条 1 Mb/s 链路，分组交换能容纳 35 个用户，电路交换只能容纳 10 个。',
                },
                {
                  type: 'h',
                  text: '存储转发的时延：$3L/R$',
                },
                {
                  type: 'p',
                  text: 'PPT 第 47 页 **"Packet-switching: store-and-forward"** 给出公式推导：',
                },
                {
                  type: 'p',
                  text: '**Takes L/R seconds to transmit (push out) packet of L bits onto link as R bps**——把 $L$ 比特的分组推上速率为 $R$ bps 的链路，需要 $L/R$ 秒。',
                },
                {
                  type: 'p',
                  text: '**Entire packet must arrive at router before it can be transmitted on next link: store and forward**——整个分组必须先到达路由器，才能在下一条链路上发送。',
                },
                {
                  type: 'formula',
                  latex: 'd_{store\\text{-}forward} = \\frac{3L}{R}',
                  caption: '三段链路（源→A→B→目的）上单个分组端到端的存储转发时延',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: 'L', meaning: '分组长度（每个分组包含的比特数）', unit: 'bit' },
                    { symbol: 'R', meaning: '链路传输速率（三段链路速率相同）', unit: 'bps' },
                    { symbol: 'd_{store-forward}', meaning: '存储转发端到端时延 = 3 × L/R', unit: 's' },
                  ],
                },
                {
                  type: 'p',
                  text: '公式的直观理解：数据要经过 **3 段链路**（源到结点 A、A 到结点 B、B 到目的），每段都要**完整地存一次、完整地发一次**，每段的发送时间是 $L/R$，共 $3 \\times L/R$。若链路数为 $n$，则时延为 $nL/R$。',
                },
                {
                  type: 'example',
                  title: 'PPT 第 47 页例题',
                  steps: [
                    '已知：分组长度 $L = 7.5$ Mbits = $7.5 \\times 10^6$ bit；链路速率 $R = 1.5$ Mbps = $1.5 \\times 10^6$ bps；经过 3 段链路。',
                    '每段链路的发送时延：$L/R = 7.5\\times10^6 / 1.5\\times10^6 = 5$ 秒。',
                    '三段链路依次存储转发，总时延：$3 \\times L/R = 3 \\times 5 = 15$ 秒。',
                  ],
                  answer: 'delay = 15 sec（$d = 3L/R = 3 \\times 7.5\\text{Mbit} / 1.5\\text{Mbps} = 15$ 秒）',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：存储转发时延 ≠ 发送时延',
                  text: '最常见的错误是只算 $L/R$。**存储转发要多算"等下一跳"的次数**：3 条链路就是 3 个 $L/R$，而不是 1 个。另一个常见错误是单位换算——$7.5$ Mbit 与 $1.5$ Mbps 一比就是 5 秒，注意 bit 与 Byte 大小写不同（Mbit = 兆比特，MB = 兆字节，差 8 倍）。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 存储转发时延 = $3L/R$（3 条链路情形），推广为 $nL/R$；② 分组交换的四大要点：分成分组、共享资源、每分组占满链路带宽、按需使用资源；③ **统计复用**与**拥塞 → 排队 → 丢包**的因果链。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**分组切小按需用，存完才走一跳一个 $L/R$；三段链路三倍时，7.5 除 1.5 等于 5，再乘 3 得 15**。”',
                },
                {
                  type: 'p',
                  text: '$3L/R$ 之所以大（15 秒），是因为**分组太大**。如果把这个 7.5 Mbit 的消息切成一堆小包（PPT 第 48 页的做法），时延会骤降到 5.002 秒。这不是"分组交换更快"，而是**流水线效应**——这正是 k1.3.3 的主题。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd1.3.2-storeforward',
                  label: '动手玩：存储转发与报文分段——实时看存储转发与流水线时延',
                },
              ],
              questionIds: ['q1.3.2-01', 'q1.3.2-02'],
              demoIds: ['d1.3.2-storeforward'],
              related: ['k1.3.3', 'k1.3.4', 'k1.4.2'],
            },
            {
              id: 'k1.3.3',
              title: '报文分段与管道化传输',
              en: 'Message Segmenting',
              summary:
                '把大报文切成 5000 个 1500 bit 的分组，让各链路并行工作（流水线），端到端时延从 15 秒降到 5.002 秒。',
              tags: ['报文分段', '流水线', 'Pipelining', '5.002'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [48] }],
              insight: {
                why: '存储转发的 $3L/R$ 时延在长报文、大分组场景下高得离谱（15 秒传一个文件）。必须想办法让链路"不空转"——这在数学上等价于让多段链路**并行**工作。',
                coreIdea: '**分段 + 流水线（pipelining）**：把一条长报文切成许多小分组，让各条链路同时处理不同的分组（像流水线工厂一样），而不是串行等待。',
                mechanism: 'PPT 第 48 页的设定：把 7.5 Mbit 报文切成 5000 个分组，每组 1500 bit（$7.5\\times10^6 / 1500 = 5000$，正好整除）；每条链路发送一个分组需 1 msec（$1500\\text{bit} / 1.5\\text{Mbps} = 1\\text{ms}$）；pipelining: each link works in parallel——各链路并行工作。时延因此**从 15 秒降到 5.002 秒**。',
                comparison: '不切分：$d = 3L/R = 15$ s。切分后：$d = 3 \\times 1\\text{ms} + (5000-1) \\times 1\\text{ms} = 5.002$ s。结论：**分组越小，存储转发开销越小，但分组数量越多，首部开销与路由器处理压力越大**——这是全章贯穿的经典权衡（MTU、路由器缓存、转发查表开销都由此而来）。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 48 页 **"Packet Switching: Message Segmenting"** 用四句话讲完了这一节：',
                },
                {
                  type: 'list',
                  items: [
                    '**Now break up the message into 5000 packets**——把这条消息切成 **5000 个分组**；',
                    '**Each packet 1,500 bits**——每个分组 **1500 bit**；',
                    '**1 msec to transmit packet on one link**——在一条链路上发送一个分组需 **1 毫秒**；',
                    '**pipelining: each link works in parallel**——流水线：各条链路**并行**工作；',
                    '**Delay reduced from 15 sec to 5.002 sec**——时延**从 15 秒降到 5.002 秒**。',
                  ],
                },
                {
                  type: 'formula',
                  latex: 'd_{pipeline} = \\frac{3L_{\\text{pkt}}}{R} + \\left(\\frac{L}{L_{\\text{pkt}}} - 1\\right)\\frac{L_{\\text{pkt}}}{R}',
                  caption: '三段链路、分组数为 n 时的流水线端到端时延',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: 'L', meaning: '原始报文总长度', unit: 'bit' },
                    { symbol: 'L_{pkt}', meaning: '分组长度（= 1500 bit）', unit: 'bit' },
                    { symbol: 'n', meaning: '分组个数（= $L / L_{pkt}$ = 5000）', unit: '个' },
                    { symbol: 'R', meaning: '链路速率（= 1.5 Mbps）', unit: 'bps' },
                    { symbol: 'L_{pkt}/R', meaning: '单个分组在一条链路上的发送时延（= 1 msec）', unit: 's' },
                  ],
                },
                {
                  type: 'example',
                  title: '按 PPT 数据核算 5.002 秒',
                  steps: [
                    '单个分组的发送时延：$1500\\text{ bit} / 1.5\\times10^6\\text{ bps} = 1$ ms。',
                    '流水线"填充"开销：第一个分组要依次经过 3 段链路，贡献 $3 \\times 1 = 3$ ms。',
                    '后续分组以每 1 ms 一个的速度连续从最后一段链路流出，共 5000 个分组，贡献约 $(5000 - 1) \\times 1 = 4999$ ms。',
                    '合计：$3 + 4999 = 5002$ ms $= 5.002$ 秒。相比不切分的 $3L/R = 15$ 秒，时延下降约 $2/3$。',
                  ],
                  answer: 'Delay reduced from 15 sec to 5.002 sec（流水线把"串行等待"变成了"并行流动"）',
                },
                {
                  type: 'figure',
                  alt: '分段 + 流水线后各链路并行工作的示意图',
                  ascii:
                    '时刻 t0:  [P1]→  ·  ·        链路1 正在发第 1 个包\n' +
                    '时刻 t1:  [P2]→  [P1]→   链路1 发 P2，链路2 发 P1（并行！）\n' +
                    '时刻 t2:  [P3]→  [P2]→  [P1]→  三段链路同时工作\n' +
                    '   …\n' +
                    '时刻 t5001:                              最后一包到达\n\n' +
                    '  链路1 ═══►  链路2 ═══►  链路3 ═══►  目的\n' +
                    '   (串行等待被流水线填满)',
                  caption: '流水线：各段链路同时处理不同分组',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '流水线带来的真正改变',
                  text: '这里改变的**不是"数据跑得更快"，而是"链路不再空转"**。不切分时，链路 2 要等链路 1 把整个 7.5 Mbit 收完才开始工作，大部分时间空闲；切分后，链路 2 收到第 1 个包就可以开始发送它，同时链路 1 继续发送第 2 个包，链路利用率接近满。**时延从 15 s 降到 5.002 s 的本质，是把串行变成了并行。**',
                },
                {
                  type: 'p',
                  text: '408 联系：这与计算机组成原理的指令流水线同构——多条指令分处取指、译码、执行等不同阶段并行推进，理想加速比受最慢一级限制。区别是这里的"级"是链路，而不是 CPU 流水段。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 流水线 = 各链路并行；② PPT 的四个数字必须能复述：5000 个分组、每个 1500 bit、每包 1 msec、**5.002 秒**；③ 分段后时延公式 $d = 3L_{pkt}/R + (n-1)L_{pkt}/R$；④ 结论：**分组越小，存储转发延迟越低，但分组数越多、首部开销越大**（这一权衡后面讲 MTU、路由器缓存时的核心论据）。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① 不要把 5.002 秒写成 5 秒或 5002 秒（单位换算）；② 不要以为"分组小 = 一定快"——分组太小会让**首部占比**（每包 40–60 字节首部）急剧上升，浪费带宽并加重路由器负担；③ 注意"5.002 s"里包含**流水线的填充开销**，不是简单的 $5000 \\times 1\\text{ms} = 5$ s。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**大包等得久，切小跑流水；5000 包 1500 比特，每包 1 毫秒，15 秒变 5.002**。”',
                },
                {
                  type: 'p',
                  text: '这个知识点在真实互联网中的对应物是**MTU（Maximum Transmission Unit，最大传输单元）**。以太网的标准 MTU 是 1500 字节（注意：**字节**，不是比特）——正是 PPT 这里 1500 这个数字的来源。互联网中的分组还要再被路由器切分成更小的片以适配不同链路的 MTU，IPv4 首部里那个"分片偏移量"字段就是为此存在（IPv6 干脆取消了路由器分片，改由源主机用路径 MTU 发现来做）。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd1.3.2-storeforward',
                  label: '动手玩：调整报文长度与分段数，看时延如何变化',
                },
              ],
              questionIds: ['q1.3.3-01'],
              demoIds: ['d1.3.2-storeforward'],
              related: ['k1.3.2', 'k1.4.2'],
            },
            {
              id: 'k1.3.4',
              title: '电路交换与分组交换对比',
              en: 'Packet vs Circuit',
              summary:
                '1 Mb/s 链路上每位用户 100 kb/s、10% 时间活跃：电路交换最多 10 个用户，分组交换可支持 35 个用户（同时活跃超 10 个的概率约 0.00042）。',
              tags: ['分组交换', '电路交换', '统计复用', '0.0004', '二项分布'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [45, 46] }],
              insight: {
                why: '这是全章最经典的定量对比题。它用一组具体数字回答一个商业问题：**同样的带宽，分组交换能服务多少用户？**答案的量级差异，也是互联网选择分组交换的根本原因。',
                coreIdea: '同样的链路容量下，**电路交换的用户数被"预留"锁死，分组交换的用户数被"统计复用"放开**。差别来自"资源是否独占"这一条。',
                mechanism: '设 1 Mb/s 链路，每位用户活跃时需 100 kb/s、活跃时间占 10%。电路交换：每用户独占 100 kb/s，故最多 $1000/100 = 10$ 用户。分组交换：只要"同时活跃的用户数"不超过 10 就能正常服务；用二项分布计算，$N = 35$ 时同时活跃超过 10 人的概率约为 $4.2\\times10^{-4}$。',
                comparison: '分组交换优势：适合突发数据、资源共享、无需呼叫建立、更简单。分组交换代价：过度拥塞会导致**时延与丢包**，因此需要额外的协议来做可靠传输与拥塞控制。PPT 第 46 页还留下一个至今未解的开放问题：**如何提供电路式（circuit-like）行为？**音视频应用需要带宽保证，"still an unsolved problem"。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 45 页 **"Packet switching versus circuit switching"** 给出的例题条件非常具体：',
                },
                {
                  type: 'table',
                  caption: '例题条件（PPT 第 45 页）',
                  headers: ['项目', '条件'],
                  rows: [
                    ['链路容量', '1 Mb/s link（1 兆比特/秒）'],
                    ['每用户需求', '100 kb/s when "active"（活跃时 100 千比特/秒）'],
                    ['活跃比例', 'active 10% of time（每个用户只有 10% 的时间活跃）'],
                    ['电路交换结果', '10 users（最多 10 个用户）'],
                    ['分组交换结果', 'with 35 users, probability > 10 active at same time is less than .0004'],
                  ],
                },
                {
                  type: 'h',
                  text: '一、电路交换：为什么是 10 个用户',
                },
                {
                  type: 'formula',
                  latex: 'N_{circuit} = \\frac{R_{link}}{r_{user}} = \\frac{1000\\ \\text{kbps}}{100\\ \\text{kbps}} = 10',
                  caption: '电路交换可容纳的用户数 = 链路容量 / 每用户预留速率',
                },
                {
                  type: 'p',
                  text: '理由很直接：电路交换为每个用户**预留** 100 kb/s，用户哪怕不活跃，这 100 kb/s 也被占着（"idle if not used, no sharing"）。所以链路上一旦排满 10 个用户，就再也挤不进来第 11 个——**哪怕其余 9 个此刻都没在说话**。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '电路交换的浪费有多大',
                  text: '由于每个用户只有 10% 时间活跃，10 个用户中平均只有 **1 个**处于活跃状态。**链路的平均利用率只有 10%**，90% 的容量被"预留但闲置"。这就是电路交换无法承载互联网负载的根本原因。',
                },
                {
                  type: 'h',
                  text: '二、分组交换：为什么 35 个用户可以',
                },
                {
                  type: 'p',
                  text: '分组交换不预留资源，只要求**同时活跃的用户数不超过 10**。把 $N$ 个用户看作独立的伯努利试验（每个用户以 0.1 的概率活跃），同时活跃人数 $X$ 服从**二项分布**：',
                },
                {
                  type: 'formula',
                  latex: 'X \\sim B(N, 0.1), \\qquad P(X = k) = \\binom{N}{k} (0.1)^k (0.9)^{N-k}',
                  caption: '同时活跃用户数的二项分布模型',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: 'N', meaning: '接入该链路的用户总数（分组交换情形取 35）', unit: '个' },
                    { symbol: 'k', meaning: '同时活跃的用户数', unit: '个' },
                    { symbol: '0.1', meaning: '单个用户处于活跃状态的概率（活跃时间占比 10%）', unit: '—' },
                    { symbol: 'X', meaning: '同时活跃的用户数随机变量', unit: '个' },
                  ],
                },
                {
                  type: 'p',
                  text: '**拥塞发生（活跃人数 > 10）的概率**就是这条二项分布的尾部概率：',
                },
                {
                  type: 'formula',
                  latex: 'P(X > 10) = \\sum_{k=11}^{N} \\binom{N}{k} (0.1)^k (0.9)^{N-k}',
                  caption: '$N = 35$ 时同时活跃人数超过 10 的概率',
                },
                {
                  type: 'example',
                  title: '核算 PPT 的 0.0004',
                  steps: [
                    '取 $N = 35$、$p = 0.1$，用二项分布求和：',
                    '$P(X=11) = \\binom{35}{11}(0.1)^{11}(0.9)^{24} \\approx 3.328 \\times 10^{-4}$',
                    '$P(X=12) = \\binom{35}{12}(0.1)^{12}(0.9)^{23} \\approx 7.396 \\times 10^{-5}$',
                    '更高阶的项迅速衰减，累加得 $P(X > 10) \\approx 4.243 \\times 10^{-4}$，约为 $0.00042$；PPT 简写为 "less than .0004"，二者属同一量级。',
                    '对比：$N = 36$ 时 $P(X>10) \\approx 5.56\\times10^{-4}$；$N = 40$ 时 $\\approx 1.47\\times10^{-3}$ —— 用户继续增加就突破了 0.0004 的门槛（这正是 PPT 追问 "what happens if > 35 users?"）。',
                  ],
                  answer: 'P(X > 10) ≈ 0.000424（PPT 简写为 "less than .0004"；35 个用户时拥塞概率很低）',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示：这是必考计算题',
                  text: '必须会做的三步：① 由 $N = R/r$ 算出电路交换的用户数（10）；② 写出二项分布 $P(X=k)=\\binom{N}{k}p^k(1-p)^{N-k}$；③ 用"活跃人数 > 容量人数"的尾部概率说明分组交换可容纳更多用户。答题时**要写清"为什么电路交换是 10 个"**（预留），**不能只写"分组交换支持 35 个"**。',
                },
                {
                  type: 'h',
                  text: '三、第 46 页：分组交换的代价与未解问题',
                },
                {
                  type: 'p',
                  text: 'PPT 第 46 页把分组交换的优劣摊开讲：',
                },
                {
                  type: 'table',
                  caption: '分组交换的优势与代价（PPT 第 46 页）',
                  headers: ['优势', '代价'],
                  rows: [
                    ['Great for bursty data（适合突发数据）', 'Excessive congestion: packet delay and loss（过度拥塞导致时延与丢包）'],
                    ['resource sharing（资源共享）', 'protocols needed for reliable data transfer, congestion control（需要额外协议做可靠传输与拥塞控制）'],
                    ['simpler, no call setup（更简单，无需呼叫建立）', 'Q: How to provide circuit-like behavior?（如何提供电路式行为？）'],
                  ],
                },
                {
                  type: 'p',
                  text: '课件最后连问两个问题，并给出两句判断：**"bandwidth guarantees needed for audio/video apps"**（音视频应用需要带宽保证）与 **"still an unsolved problem (chapter 7)"**（至今仍无解的问题）。',
                },
                {
                  type: 'p',
                  text: '这个"未解问题"的准确含义是：**在分组交换的网络里，如何让某个应用获得"电路式"的确定性服务质量保证**，而不破坏统计复用带来的整体效率。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '如何提供电路式行为：后来的答案是 QoS 与资源预留',
                  text: '现代网络的答案是**服务质量（QoS）**这一族机制：区分服务（DiffServ）、集成服务（IntServ）与 RSVP 资源预留、流量工程（MPLS），以及数据中心里的 RDMA/无损网络等。这些都是在"分组交换 + 尽力而为"之上叠加的**确定性保障层**，并没有改变分组交换本身——因为改变分组交换就等于回到电路交换，代价是效率。这条线索在 PPT 第 98 页的协议图里能看到 RSVP 的身影。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**电路预留十用户，分组复用三十五；二项分布算尾巴，拥塞概率万分之四**。”配套口诀：“**突发数据分组赢，时延丢包是代价，带宽保证仍未解**。”',
                },
                {
                  type: 'p',
                  text: '最后回到那个根本问题："Is packet switching a \'slam dunk winner\'?"（分组交换是不是毫无悬念的赢家？）课件的答案是有保留的——它在突发数据的世界里是压倒性胜利，但引入了拥塞、丢包和 QoS 这个持续至今的难题。**这道题也提醒我们：互联网的很多后续工作（TCP 拥塞控制、区分服务、CDN 调度）本质上都是在补分组交换的这个短板。**',
                },
              ],
              questionIds: ['q1.3.4-01', 'q1.3.4-02'],
              related: ['k1.3.1', 'k1.3.2', 'k1.4.4', 'k1.5.3'],
            },
          ],
        },
        {
          id: 's1.3.2',
          title: '转发、路由与网络分类',
          knowledge: [
            {
              id: 'k1.3.5',
              title: '转发与路由',
              en: 'Forwarding & Routing',
              summary:
                '转发是路由器内部按转发表把分组从入端口送到出端口（毫秒级、逐跳进行）；路由是计算分组所走路径的分布式过程（秒级、全网协同）。',
              tags: ['转发', '路由', '转发表', '最长前缀匹配', '分层'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [44] }],
              insight: {
                why: '一个分组要在网络中走完十几跳，每一跳都要决定"下一跳走哪条链路"。这个决策被拆成两个层次：**局部的、快速的**（转发）和**全局的、缓慢的**（路由）。分层的目的是让路由器硬件能做前者，而后者交给算法与控制平面。',
                coreIdea: '**转发（forwarding）**：把分组从路由器的输入端口移到合适的输出端口，是本地动作，由本地转发表（local forwarding table）决定，粒度是每个分组（microseconds–milliseconds）。**路由（routing）**：决定分组从源到目的所走的路径，是全局过程，由路由算法（routing algorithm）计算，时间尺度是秒级。',
                mechanism: '到达分组的首部里有目的地址（dest address in arriving packet\'s header），路由器用它查本地转发表，得到输出链路（output link）。PPT 第 44 页的例子：首部值 $0111$ 映射到输出链路 3；表中 $0100\\to2$、$0101\\to2$、$0111\\to3$、$1001\\to1$。**路由算法计算并下发这张表，转发只负责照表执行**。',
                comparison: '分层的技术意义：**数据平面（转发）用硬件做、做到极快；控制平面（路由）用软件做、周期性地做**。这样即使路由算法复杂、收敛慢（秒级），也不影响每个分组在路由器内部的转发速度（微秒–毫秒级）。这正是现代 SDN 把控制平面与数据平面分离的思想源头。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 44 页标题 **"Two key network-core functions"**，明确指出网络核心只有两项关键功能：',
                },
                {
                  type: 'table',
                  caption: '转发 vs 路由（PPT 第 44 页）',
                  headers: ['维度', '转发 forwarding', '路由 routing'],
                  rows: [
                    ['英文定义', 'move packets from router\'s input to appropriate router output', 'determines source-destination route taken by packets'],
                    ['作用范围', '路由器内部，单跳', '全网，端到端'],
                    ['决定者', 'local forwarding table（本地转发表）', 'routing algorithm（路由算法）'],
                    ['输入', '到达分组首部的目的地址', '全网拓扑与可达性信息'],
                    ['输出', 'output link（输出链路）', '源到目的的路径'],
                    ['时间尺度', '微秒–毫秒级，每分组进行', '秒级，周期性或事件驱动'],
                    ['平面归属', '数据平面（data plane）', '控制平面（control plane）'],
                  ],
                },
                {
                  type: 'h',
                  text: '转发表是怎么用的',
                },
                {
                  type: 'p',
                  text: 'PPT 第 44 页的图给出了完整的查表过程：',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '分组到达路由器某个输入端口，读出其首部中的**目的地址（dest address in arriving packet\'s header）**；',
                    '用该地址去查**本地转发表（local forwarding table）**；',
                    '从表项读出**输出链路（output link）**，把分组从该链路发出去。',
                  ],
                },
                {
                  type: 'figure',
                  alt: '本地转发表：首部值到输出链路的映射',
                  ascii:
                    '   到达分组首部值   →   本地转发表        →   输出链路\n' +
                    '        0100        →   表项 0100       →   2\n' +
                    '        0101        →   表项 0101       →   2\n' +
                    '   dest 0111        →   表项 0111       →   3\n' +
                    '        1001        →   表项 1001       →   1\n\n' +
                    '   （表中还标出了到目的网络的下一跳距离/跳数 3、2、2、1、1、2、3）',
                  caption: '按 PPT 第 44 页整理的转发表示意',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么一定要把"转发"和"路由"分开',
                  text: '因为它们的时间尺度差了几个数量级。**每个分组在每跳路由器里都要做一次转发**，全网每秒要做上亿次，必须由专用硬件（ASIC）在微秒级完成；而**路由计算**涉及全网拓扑、链路状态与策略，复杂且可能振荡，只能周期性地做（秒级）。把两者混为一谈，就会误以为"路由器每来一个包都要重新算路"——实际上它只是查表。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '转发表里存的到底是什么',
                  text: 'PPT 图中的映射是"首部值 → 输出链路"。真实互联网里，路由器查的是**最长前缀匹配（Longest Prefix Match, LPM）**：转发表存"网络前缀 → 出接口/下一跳"，收到分组后按最长前缀匹配。例如目的地址 8.8.8.8 同时命中 8.0.0.0/8 和 8.8.8.0/24 时，以 /24 为准。转发要快（哪怕是数亿条表项），靠的正是 TCAM 等硬件与最长前缀匹配。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① **转发 = 本地动作、查表、逐跳，快（微秒–毫秒）**；**路由 = 全局过程、算法，慢（秒级）**；② 转发表由路由算法计算并下发；③ 路由算法是第 4 章的内容（PPT 第 49 页说 "we\'ll study several path selection (i.e. routing) algorithms (chapter 4)"）。易错：把两者说成同一件事；把转发说成"每跳重新计算路径"。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**转发是查表，快；路由是算路，慢。转发表由路由算，转发只管照表干。**”',
                },
                {
                  type: 'p',
                  text: '这一节还预告了后面的分类：**第 49 页会把"转发"分成两种实现方式**——数据报网（靠目的地址查表，路径可能中途改变）与虚电路网（靠 VCI 标签查表，路径在建立时固定）。同一个"转发"动作，不同的转发依据，就分出了两大类网络。',
                },
              ],
              questionIds: ['q1.3.5-01'],
              related: ['k1.3.6', 'k1.3.7', 'k1.5.5'],
            },
            {
              id: 'k1.3.6',
              title: '数据报网与虚电路网',
              en: 'Datagram vs Virtual Circuit',
              summary:
                '数据报网按目的地址转发、路径可中途改变；虚电路网按 VC 标签转发、建立时固定路径且路由器维护逐呼叫状态。互联网两种都提供。',
              tags: ['数据报', '虚电路', 'VC', 'VCI', '无状态'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [49, 50] }],
              insight: {
                why: '同样是"分组 + 路由器"，有两种截然不同的组织方式：一种像寄快递（写清地址就寄，收件人临时决定路线），一种像打电话（先接通一条线路，再按约定通话）。二者的区别决定了网络的状态量与故障行为。',
                coreIdea: '**数据报网（datagram network）**：每个分组自带目的地址，路由器按地址查表决定下一跳；路径在会话期间可能改变。**虚电路网（virtual circuit network）**：建立连接时确定一条固定路径，每个分组携带 VC 标签（virtual circuit ID），路由器按标签转发；路由器为每条虚电路维护状态。',
                mechanism: '数据报的类比是**开车问路（driving, asking directions）**——每到一个路口重新决定往哪走；虚电路则是**打电话**——先接通，再按约定线路通话。虚电路的"建立"过程叫 call setup，会在沿途路由器上创建状态并分配标签。',
                comparison: '数据报网：无状态（stateless）路由器，故障适应性强（某条链路断了，后续分组自动改路），但分组可能乱序；虚电路网：有状态，建立连接有额外时延，但路径固定、可做 QoS 保证与流量整形，天然不会乱序。PPT 第 50 页的分类图把网络分为：电信网络 → 电路交换（FDM/TDM）；分组交换网络 → 有虚电路的网络 / 数据报网络。互联网同时提供面向连接（TCP）与无连接（UDP）两种服务给应用。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 49 页 **"Packet-switched networks: forwarding"** 的目标写得很清楚：**"Goal: move packets through routers from source to destination"**，并预告第 4 章会研究若干路径选择（即路由）算法。核心是两种转发方式。',
                },
                {
                  type: 'h',
                  text: '一、数据报网（datagram network）',
                },
                {
                  type: 'list',
                  items: [
                    '**destination address in packet determines next hop**——分组中的**目的地址**决定下一跳；',
                    '**routes may change during session**——**会话期间路径可能改变**；',
                    '**analogy: driving, asking directions**——类比：**开车问路**。',
                  ],
                },
                {
                  type: 'p',
                  text: '类比之所以贴切，是因为"开车问路"里每个路口的选择都可能是新的：某条路堵了就绕道，**但只要最终能到目的地就行**。数据报网正是这样——每个分组独立决策，可能走不同的路径，于是**到达顺序可能与发送顺序不同**（乱序），而且中间一条链路断开时后续分组会自动改路。',
                },
                {
                  type: 'h',
                  text: '二、虚电路网（virtual circuit network）',
                },
                {
                  type: 'list',
                  items: [
                    '**each packet carries tag (virtual circuit ID), tag determines next hop**——每个分组携带**标签（虚电路号）**，标签决定下一跳；',
                    '**fixed path determined at call setup time, remains fixed thru call**——路径在**呼叫建立时确定，并在整个呼叫期间保持不变**；',
                    '**routers maintain per-call state**——**路由器为每个呼叫维护状态**。',
                  ],
                },
                {
                  type: 'table',
                  caption: '数据报网 vs 虚电路网',
                  headers: ['维度', '数据报网', '虚电路网'],
                  rows: [
                    ['转发依据', '分组首部的目的地址', '分组的 VC 标签（VCI）'],
                    ['路径', '会话期间可能改变', '建立时固定，全程不变'],
                    ['路由器状态', '无状态（stateless）', '逐呼叫维护状态'],
                    ['建立开销', '无需连接建立', '需要 call setup（有额外时延）'],
                    ['乱序', '可能乱序', '天然按序'],
                    ['故障适应', '强（后续分组自动改路）', '弱（需重新建立连接）'],
                    ['服务保证', '难以提供确定性保证', '易于提供 QoS 保证'],
                    ['类比', '开车问路（driving, asking directions）', '打电话（先接通再通话）'],
                  ],
                },
                {
                  type: 'h',
                  text: '三、PPT 第 50 页：网络分类图',
                },
                {
                  type: 'p',
                  text: '第 50 页 **"Network Taxonomy"** 给出了一棵分类树：',
                },
                {
                  type: 'figure',
                  alt: 'PPT 第 50 页的网络分类树',
                  ascii:
                    'Networks（网络）\n' +
                    '   ├── Telecommunication networks（电信网络）\n' +
                    '   │      └── Circuit-switched networks（电路交换网络）\n' +
                    '   │             ├── FDM\n' +
                    '   │             └── TDM\n' +
                    '   └── Packet-switched networks（分组交换网络）\n' +
                    '          ├── Networks with VCs（带虚电路的网络）\n' +
                    '          └── Datagram Networks（数据报网络）',
                  caption: '按 PPT 第 50 页整理的网络分类',
                },
                {
                  type: 'p',
                  text: '第 50 页最后一行还写了一句把整章串起来的话：**"Internet provides both connection-oriented (TCP) and connectionless services (UDP) to apps."**——互联网向应用同时提供面向连接（TCP）与无连接（UDP）两种服务。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么互联网选数据报，ATM 却选虚电路',
                  text: '这是通信史上的关键对决：ATM（异步传输模式）选择了虚电路，追求确定性的服务质量；互联网选择了数据报，追求极简、自治、无状态路由器与尽力而为（PPT 第 112 页的 Cerf-Kahn 原则）。结果互联网赢了——因为在规模面前，虚电路的"每呼叫状态"会成为灾难：路由器要记住海量连接，任何拓扑变化都要重排所有状态；而无状态路由器只维护"前缀 → 出接口"，可以增量更新。**虚电路的思路后来并未消失，而是被搬到了边缘**：MPLS、GRE/VXLAN 隧道、ATM 承载业务等仍在使用。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 数据报的转发依据是目的地址，虚电路的是 VC 标签/VCI；② "routes may change during session" 与 "fixed path" 是必须记住的对照；③ 数据报网 = 无状态，虚电路网 = 逐呼叫有状态；④ 网络分类树：网络 → 电信网络（电路交换：FDM/TDM）/ 分组交换网络（虚电路网 / 数据报网）；⑤ **TCP 是逻辑上的面向连接，IP 层仍是数据报**——这是最常被追问的一层关系。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：TCP 的"面向连接"≠ IP 的"虚电路"',
                  text: 'TCP 的连接是端系统之间的逻辑连接，它的可靠性由端系统软件（序号、确认、重传）实现；**中间的 IP 层完全无状态**，不知道任何连接的存在，每个分组独立转发、路径可能不同。**虚电路则是网络层（甚至链路层）真的有逐呼叫状态**。所以"互联网是基于虚电路的"是错的——它俩分属不同层次。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**数据报：写地址，问路走；虚电路：先接通，按标签行。分类树记：电信→电路(FDM/TDM)，分组→虚电/数据报**。”',
                },
                {
                  type: 'p',
                  text: '把这一节和 1.4 节连起来：数据报网的"路径可能改变 + 无状态"这两个特点，同时解释了为什么会有丢包（1.4.6，分组到得太挤就被丢）、为什么 TCP 必须自己做拥塞控制（1.2.3），也是理解 1.3.7 节"ISP 层次结构"中路由信息如何逐级收敛的前提。',
                },
              ],
              questionIds: ['q1.3.6-01', 'q1.3.6-02'],
              related: ['k1.3.5', 'k1.2.3', 'k1.2.4', 'k1.4.6'],
            },
          ],
        },
        {
          id: 's1.3.3',
          title: '互联网的结构',
          knowledge: [
            {
              id: 'k1.3.7',
              title: '网络的网络：ISP 层次结构',
              en: 'Network of Networks',
              summary:
                '互联网是"网络的网络"：接入 ISP 互联成 ISP 层次，全球骨干 + 区域 ISP + IXP 构成结构，演进由经济与国家政策驱动。',
              tags: ['ISP', 'IXP', '对等', 'POP', '网络之网络'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [51, 52, 53, 54, 55, 56, 57, 58] }],
              insight: {
                why: '全球有数百万家接入 ISP。如果让它们两两直连，连接数将是 $O(N^2)$——完全不可扩展。所以必须设计一种可扩展的互联结构，而现实答案是：**分层 + 对等 + 交换中心**。',
                coreIdea: '互联网是**分层松散（loosely hierarchical）**的"网络的网络"：接入 ISP 互联以保证任意两台主机能互通；结构由**经济与国家政策**驱动演化，而不是由单一规划者设计。',
                mechanism: '演化路线：① 全部互联（$O(N^2)$，不可扩展）→ ② 接入 ISP 连到全球骨干 ISP（有商业可行性）→ ③ 出现竞争者 → ④ 各骨干 ISP 互联，并出现区域 ISP 把接入网接到骨干上 → ⑤ 出现 **IXP（Internet Exchange Point，因特网交换点）**，通过 peering link（对等链路）互联。最终形态是 Tier-1 ISP 骨干 + 区域 ISP + 接入 ISP + IXP 的层次结构，每个 ISP 在若干 POP（Point of Presence，网络 POP 点）部署设备。',
                comparison: '客户-提供者关系（customer-provider）：下级 ISP 向上级 ISP 购买带宽，是商业合同关系；**对等（peering）**关系：规模相当的 ISP 互连，通常**免费交换流量**——因为双方都是对方内容的客户，双向流量才是对等的。IXP 则是中立交换点，让多家 ISP 在同一物理设施上以对等方式互联，是全球互联网流量的重要交汇枢纽。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 51 页 **"Internet structure: network of networks"** 开门见山：',
                },
                {
                  type: 'list',
                  items: [
                    '**End systems connect to Internet via access ISPs**——端系统通过**接入 ISP** 接入互联网（住宅、公司、大学 ISP）；',
                    '**Access ISPs in turn must be interconnected. So that any two hosts can send packets to each other**——接入 ISP 之间**必须互联**，以保证任意两台主机都能互发分组；',
                    '**Resulting network of networks is very complex**——由此形成的"网络之网络"**极其复杂**；',
                    '**Evolution was driven by economics and national policies**——这一结构的演化**由经济与国家政策驱动**。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么说"由经济和国家政策驱动"',
                  text: '因为互联网**没有中央规划者**。它长成什么样，取决于谁的商业模式能活下来、哪些国家允许跨境流量、哪些地区形成了监管市场。所以你在拓扑图上看到的"结构"，本质上是**商业合同的投影**。这也解释了为什么"互联网是分层的"这种说法要加"loosely（松散地）"——每一层的边界其实都很模糊。',
                },
                {
                  type: 'h',
                  text: '第 52–53 页：第一个方案与它的失败',
                },
                {
                  type: 'p',
                  text: '第 52 页提出问题：**"Question: given millions of access ISPs, how to connect them together?"**（有数百万家接入 ISP 时，该怎么把它们连起来？）第 53 页给出第一个直觉方案——**让每家接入 ISP 与其他每一家接入 ISP 直连**，图上画满了 $N$ 个 access net 与它们之间的连线。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '关键结论：$O(N^2)$ 不可扩展',
                  text: 'PPT 明确写道：**"connecting each access ISP to each other directly doesn\'t scale: O(N2) connections."** 这是全章第一个"结构性不可能"的论证：链路数随接入 ISP 数量平方增长。每家 ISP 要维护 $N-1$ 条对等链路，每条链路都要独立谈判带宽与计费——成本与管理复杂度都不可承受。**任何可扩展的互联网结构都必须避免全互联。**',
                },
                {
                  type: 'h',
                  text: '第 54–55 页：全球骨干 ISP 与它的竞争者',
                },
                {
                  type: 'p',
                  text: '第 54 页给出第二个方案：**connect each access ISP to a global transit ISP**——所有接入 ISP 都连到一家全球骨干 ISP。课件特别指出这背后是经济协议（economic agreement）：接入 ISP 是骨干 ISP 的客户（customer），骨干 ISP 是提供者（provider）。',
                },
                {
                  type: 'p',
                  text: '第 55 页立刻提出反驳：**"But if one global ISP is viable business, there will be competitors…"**——如果一家全球 ISP 的生意做得成，就一定会出现竞争者。而一旦出现竞争者，它们**也必须互相连接**（"which must be interconnected"），于是回到了互联问题。',
                },
                {
                  type: 'figure',
                  alt: 'ISP 层次结构的演化：从全互联到全球 ISP',
                  ascii:
                    '方案一（第 53 页）：全互联 O(N²) —— 不可扩展\n' +
                    '   access◄──►access   access◄──►access   ... （N(N-1)/2 条链路）\n\n' +
                    '方案二（第 54 页）：全球骨干 ISP\n' +
                    '        ┌──────────────┐\n' +
                    '        │  Global ISP  │  ← 接入 ISP 购买它的带宽\n' +
                    '   ┌────┼────┬─────────┼────┐\n' +
                    '   ▼    ▼    ▼        ▼    ▼\n' +
                    ' access access access access access\n\n' +
                    '方案三（第 55–56 页）：竞争者出现 → 必须互联 → IXP + 对等链路',
                  caption: '按 PPT 第 53–56 页整理的 ISP 结构演化',
                },
                {
                  type: 'h',
                  text: '第 56 页：IXP 与对等链路',
                },
                {
                  type: 'p',
                  text: '第 56 页给出了最终形态的图：ISP A、ISP B、ISP C 三个骨干 ISP，各自连到接入网，并通过 **IXP（Internet exchange point，因特网交换点）** 与 **peering link（对等链路）** 互联。图中标注了 "access net"、"ISP A/B/C"、"IXP"、"peering link"、"Internet exchange point"。',
                },
                {
                  type: 'term',
                  zh: 'IXP',
                  en: 'Internet Exchange Point',
                  abbr: 'IXP',
                  def: '因特网交换点：中立的交换设施，让多家 ISP 在同一地点以**对等方式**交换流量，通常不互相收费（因为双方互为客户）。全球著名者如 AMS-IX、DE-CIX、HKIX、China Telecom 主导的国内交换中心等。',
                },
                {
                  type: 'term',
                  zh: '对等',
                  en: 'peering',
                  def: '两家规模相当的 ISP 之间的**对等互联**关系：双方互相提供对方的可达性，通常**不互相付费**，因为流量是双向的，商业上互惠。这种关系与"客户—提供者"的付费关系不同。',
                },
                {
                  type: 'h',
                  text: '第 57–58 页：区域 ISP 与 Tier-1 骨干',
                },
                {
                  type: 'p',
                  text: '第 57 页：**"…and regional networks may arise to connect access nets to ISPs"**——区域网络随之出现，把接入网接到 ISP 上。第 58 页展示了更完整的骨干结构，课件特别点出 **Tier-1 ISP: e.g., Sprint**（一级 ISP，例如 Sprint），图上标注了三类链路：',
                },
                {
                  type: 'list',
                  items: [
                    '**to/from customers**——通向/来自客户（接入 ISP 与区域 ISP）的链路；',
                    '**peering**——与同级 ISP 的对等链路；',
                    '**to/from backbone**——通向/来自骨干网的链路。',
                  ],
                },
                {
                  type: 'p',
                  text: '第 58 页还引入了两个必须知道的术语：**POP（Point of Presence，网络 POP 点）**——ISP 在某个城市部署的一整套网络设备（路由器、链路、机房），是 ISP 在该地的"存在点"。全球互联的实际数据就来自这些 POP 的路由器。',
                },
                {
                  type: 'table',
                  caption: '互联网结构中的角色（综合 PPT 第 51–58 页）',
                  headers: ['角色', '英文', '在结构中的位置', '商业关系'],
                  rows: [
                    ['接入 ISP', 'access ISP', '最靠近用户：住宅、公司、大学', '向区域/骨干 ISP 购买带宽（客户）'],
                    ['区域 ISP', 'regional ISP', '把接入网连到骨干', '客户（对下）/ 对等或提供（对上）'],
                    ['Tier-1 骨干 ISP', 'Tier-1 ISP（如 Sprint）', '全球骨干，覆盖多个大洲', '对下游为提供者，对同级为对等'],
                    ['IXP', 'Internet Exchange Point', '多家 ISP 汇聚交换流量的中立枢纽', '通常免费对等交换'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 互联网是 "network of networks"，**松散分层（loosely hierarchical）**；② $O(N^2)$ 全互联不可扩展（必考）；③ 骨干 ISP 的竞争者也必须互联，催生 IXP 与对等（peering）；④ 客户-提供者与对等两种商业关系的区别；⑤ Tier-1 ISP 与 POP 的含义；⑥ 结构演化由经济与国家政策驱动。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① **对等 ≠ 免费白用**：peering 通常是流量互换，商业上是互惠而非无偿。② IXP 不是"第三层"：它是物理设施上的汇聚点，本身不构成新的层级。③ "分层"不等于"严格的树"：同一对 ISP 之间可能同时有客户关系和对等关系，结构其实是**有重叠的图**。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**全连方根不可扩，全球骨干被竞争，骨干互联生 IXP，区域接入连骨干，一级骨干加 POP。**”商业关系口诀：“**客户付费，对等互换**。”',
                },
                {
                  type: 'p',
                  text: '最后把这个结构图和 1.1.1 节的"全球互联网拓扑图"对上：那些被大量用户访问的站点（google.com 等）访问快，很大程度上是因为它们部署在**靠近用户的 IXP 附近或直接接入骨干**——这正是 CDN 的技术基础。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd1.3.7-isps',
                  label: '动手玩：ISP 层次结构演化——从"全互联"到 IXP',
                },
              ],
              questionIds: ['q1.3.7-01', 'q1.3.7-02'],
              demoIds: ['d1.3.7-isps'],
              related: ['k1.2.8', 'k1.3.5', 'k1.1.1'],
            },
          ],
        },
]
