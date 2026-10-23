import type { Subsection } from '../../types/content'

/** 第三章 3.4：可靠数据传输原理 */
export const ch3Part2: Subsection[] = [
  {
    id: 's3.4.1',
    title: 'RDT 问题设定与逐步协议',
    knowledge: [
      {
        id: 'k3.4.1',
        title: 'RDT 复杂性与抽象',
        en: 'RDT Getting Started',
        summary:
          '可靠数据传输（reliable data transfer）是网络中最重要的问题之一：如何在一条不可靠的信道之上，为上层提供可靠的数据交付。信道越不可靠，协议越复杂。',
        tags: ['可靠传输', 'rdt', 'FSM'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [21, 22, 23] }],
        insight: {
          why: 'IP 层是不可靠的（丢包、乱序、比特差错都可能发生），而文件传输、邮件、Web 等应用要求 100% 可靠。必须有协议把这些不可靠变成可靠——该问题在应用层、传输层、链路层都存在，是"网络主题 top-10"之一。',
          coreIdea: '把"不可靠信道 + 可靠协议"的问题抽象成有限状态机（FSM），从理想信道出发，逐步加入差错、丢包，逐步升级协议（rdt1.0 → 2.0 → 2.1 → 2.2 → 3.0），每一步只解决一个新问题。',
          mechanism:
            '协议通过四个原语与外界交互：rdt_send（上层调用，发数据）、udt_send（调用下层，发分组）、rdt_rcv（分组到达）、deliver_data（把数据交给上层）。FSM 用「状态 + 事件 → 动作 + 新状态」描述协议行为。',
          comparison:
            '信道的不可靠程度决定协议复杂度：理想信道（rdt1.0）什么都不用做；有比特差错（rdt2.x）需要校验和 + 反馈 + 重传 + 序号；有丢包（rdt3.0）还需要定时器。这是"复杂性与信道质量"之间的根本权衡。',
        },
        blocks: [
          { type: 'term', zh: '有限状态机', en: 'Finite State Machine, FSM', def: '用有限个状态及"事件→动作→新状态"的转移规则描述协议行为的模型。' },
          {
            type: 'p',
            text: '可靠数据传输（rdt）问题：下层信道不可靠（比特差错、丢包、乱序），上层却要求数据**不错、不丢、不乱序**地交付。我们只研究**单向**数据传输（数据从发送方流向接收方），但控制信息（ACK/NAK）会双向流动。',
          },
          {
            type: 'table',
            caption: 'rdt 协议接口原语',
            headers: ['原语', '调用方', '含义'],
            rows: [
              ['rdt_send(data)', '上层（应用）', '把数据交给可靠传输协议发送'],
              ['udt_send(packet)', 'rdt 协议', '通过不可靠信道把分组发送出去'],
              ['rdt_rcv(packet)', '下层（信道）', '分组到达协议层'],
              ['deliver_data(data)', 'rdt 协议', '把正确数据交付给上层'],
            ],
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '高频考点：FSM 三要素（状态、事件、动作）；以及"rdt 协议演进的主线"——每遇到一种新的信道缺陷，就增加一种新机制（校验和→反馈→序号→定时器）。',
          },
        ],
        questionIds: ['q3.4.1-01'],
        related: ['k3.4.2', 'k3.4.3'],
      },
      {
        id: 'k3.4.2',
        title: 'rdt1.0/2.0/2.1/2.2：差错检测与重传',
        en: 'RDT 1.0 ~ 2.2',
        summary:
          'rdt1.0 假设信道完美；rdt2.0 引入校验和与 ACK/NAK 应对比特差错，但 ACK/NAK 本身损坏时会出错；rdt2.1 给分组加序号位解决重复问题；rdt2.2 去掉 NAK 只用带序号的 ACK。',
        tags: ['rdt', 'ACK', 'NAK', '序号'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34] }],
        insight: {
          why: '现实中比特在传输中会翻转（噪声、干扰）。若接收方把错的数据交给上层，后果严重；必须能**发现**错误（校验和）并**恢复**（重传）。',
          coreIdea: '差错恢复的三件套：① 校验和（检测）② 接收方反馈 ACK/NAK（告知）③ 发送方收到 NAK 重传（恢复）。',
          mechanism:
            'rdt2.0 发送方发一个包后停下等 ACK/NAK（停等）。但若 ACK/NAK 在传输中被损坏，发送方不知道结果，直接重传又可能造成**重复**。rdt2.1 的解法：给分组加 1 位序号（0/1 交替），接收方收到重复分组时丢弃（不交付）但重新 ACK。rdt2.2 进一步优化：不用 NAK，改为"对最后一个正确收到的分组发 ACK，并注明序号"，发送方收到重复 ACK 时重传——效果等价于 NAK。',
          comparison:
            'rdt2.0 → 2.1 → 2.2 的核心区别：2.0 无序号（ACK/NAK 损坏即崩溃）；2.1 有 1 位序号 + ACK/NAK；2.2 有 1 位序号 + 只用 ACK。停等（stop-and-wait）是三者共同的局限：一次只发一个分组，效率极低。',
        },
        blocks: [
          {
            type: 'h',
            text: 'rdt1.0：可靠信道上的可靠传输',
          },
          {
            type: 'p',
            text: '底层信道**完美可靠**（无比特差错、无丢包），协议只需：发送方从上层取数据打包（make_pkt）→ udt_send；接收方收到分组 → 提取数据（extract）→ deliver_data。无需反馈、无需重传。',
          },
          {
            type: 'h',
            text: 'rdt2.0：信道可能翻转比特',
          },
          {
            type: 'list',
            items: [
              '新机制一：**差错检测**——用校验和（checksum）检测比特差错；',
              '新机制二：**接收方反馈**——ACK（positive acknowledgement，肯定确认："收到且无误"）与 NAK（negative acknowledgement，否定确认："收到但有误"）；',
              '发送方收到 NAK 就重传该分组。',
            ],
          },
          {
            type: 'callout',
            tone: 'warning',
            title: 'rdt2.0 的致命缺陷（PPT 第 29 页）',
            text: 'ACK 或 NAK 本身也可能在传输中被损坏！此时发送方不知道接收方到底收没收到、收到的对不对。若盲目重传，可能产生**重复分组**（接收方无法区分新旧）。解决之道：给每个分组加**序号**（sequence number），接收方据此丢弃重复。',
          },
          {
            type: 'h',
            text: 'rdt2.1：加入 1 位序号',
          },
          {
            type: 'list',
            items: [
              '分组携带 1 位序号 0/1 交替（停等协议只需 2 个序号）；',
              '发送方状态翻倍：等待 ACK/NAK 0 与等待 ACK/NAK 1 两个状态，用于记住"当前分组序号"；',
              '接收方状态翻倍：期望收到 0 与期望收到 1 两个状态；',
              '收到损坏的 ACK/NAK：发送方重传当前分组；接收方若发现是重复分组（序号不对），**丢弃但重新发 ACK**。',
            ],
          },
          {
            type: 'h',
            text: 'rdt2.2：无 NAK 协议',
          },
          {
            type: 'p',
            text: '功能与 rdt2.1 完全等价，但**只用 ACK**：接收方对最后一个正确收到的分组发 ACK 并**明确携带该分组的序号**。发送方收到**重复的 ACK**（对上一分组的 ACK）时，采取与收到 NAK 相同的动作——重传当前分组。这样协议少了一种报文类型。',
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '必考链：① rdt2.0 的缺陷是什么（ACK/NAK 损坏）？② 为什么加序号能解决重复（接收方按序号识别重复分组）？③ 为什么停等协议 2 个序号就够（收发双方只需区分"当前"与"上一个"）。',
          },
          {
            type: 'demoRef',
            demoId: 'd3.4.2-rdt2',
            label: '交互演示：rdt2.x 状态机（可注入位错误）',
          },
        ],
        questionIds: ['q3.4.2-01', 'q3.4.2-02'],
        demoIds: ['d3.4.2-rdt2'],
        related: ['k3.4.3', 'k3.4.5'],
      },
      {
        id: 'k3.4.3',
        title: 'rdt3.0：处理丢包与定时器',
        en: 'RDT 3.0',
        summary:
          'rdt3.0 在 rdt2.2 基础上新增假设：信道还会**丢包**（数据分组或 ACK 都可能丢）。解法是倒计时定时器：等待"合理时间"未收到 ACK 就重传。',
        tags: ['rdt', '定时器', '超时重传', '丢包'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [35, 36, 37, 38] }],
        insight: {
          why: '真实网络不只翻转比特，还会**丢弃**分组（路由器缓存满）或让分组"消失"（链路故障）。如果发送方只是干等 ACK，而 ACK 永远不来，协议就死锁了。',
          coreIdea: '用**时间**作为最后的兜底：发送方启动定时器，超时未收到 ACK 就认为（数据或 ACK）丢了，重传。',
          mechanism:
            '发送方每发一个分组就启动倒计时定时器：① 定时器超时 → 重传该分组并重启定时器；② 收到损坏 ACK 或错序号的 ACK → 忽略（继续等定时器）；③ 收到正确 ACK → 停止定时器。若分组只是**延迟**而非丢失，重传会产生重复——但序号机制（rdt2.1 引入）已经能处理重复。',
          comparison:
            'rdt3.0 vs rdt2.2：唯一新增是**定时器 + 超时重传**。rdt3.0 是"正确但性能差"的协议：一次只允许一个分组在途（停等），链路利用率极低。',
        },
        blocks: [
          {
            type: 'p',
            text: 'rdt3.0 发送方 FSM 的关键动作（PPT 第 36 页）：',
          },
          {
            type: 'list',
            items: [
              'rdt_send(data) → make_pkt(0/1, data, checksum) → udt_send → **start_timer** → 进入"等待 ACK0/1"状态；',
              '**timeout**（超时事件）→ udt_send（重传同一分组）→ start_timer（重启定时器）；',
              '收到损坏 ACK 或对上一分组的 ACK → 忽略，继续等待（定时器仍在走）；',
              '收到正确的 ACK → stop_timer → 回到"等待上层调用"状态。',
            ],
          },
          {
            type: 'callout',
            tone: 'warning',
            title: '易错点',
            text: '超时后必须**重启定时器**（对重传的分组重新计时）；收到损坏 ACK 时**不重传**（继续等超时）——这是 FSM 里最常考的两条转移。',
          },
          {
            type: 'demoRef',
            demoId: 'd3.4.3-rdt3',
            label: '交互演示：rdt3.0 定时器与重传（可注入丢包）',
          },
        ],
        questionIds: ['q3.4.3-01'],
        demoIds: ['d3.4.3-rdt3'],
        related: ['k3.4.2', 'k3.4.4', 'k3.5.5'],
      },
      {
        id: 'k3.4.4',
        title: 'rdt3.0 性能与停等',
        en: 'RDT 3.0 Performance',
        summary:
          'rdt3.0 正确但性能极差：停等（stop-and-wait）机制让发送方大部分时间在空等。在 1 Gbps、15 ms 传播时延的链路上，利用率只有约 2.6%。',
        tags: ['停等', '利用率', '流水线'],
        sources: [
          {
            kind: 'ppt',
            ppt: 'Chapter3',
            slides: [39, 40],
            note: 'PPT 原文写 "33kB/sec thruput over 1 Gbps link"，其含义是每秒仅约 33 KB（即 267 kbps），链路利用率约 2.6%，这正是 PPT 说"performance stinks"的原因。',
          },
        ],
        insight: {
          why: '为什么一个"正确"的协议会被认为不可用？因为网络资源的利用效率同样重要——1 Gbps 的链路只跑出 267 kbps，就像高铁轨道上只跑一辆牛车。',
          coreIdea: '利用率 = 发送时延 ÷ RTT。发送方每发一个分组就要空等整个 RTT，等待时间远大于发送时间，利用率自然低。解法是**流水线**：不等 ACK 就连续发多个分组。',
          mechanism:
            '发送利用率 $U_{sender} = \\frac{L/R}{RTT + L/R}$（L/R 为传输时延）。若 RTT ≫ L/R，则 $U_{sender} \\approx \\frac{L/R}{RTT}$。PPT 例题：L=8000 bit，R=1 Gbps → $L/R = 8000/10^9 = 8\\ \\mu s$；RTT = 30 ms（15 ms 传播 × 2）。则 $U = 8\\ \\mu s / 30.008\\ ms \\approx 0.00027$，即约 **0.027%**。每秒能发的分组数 = 1/0.03 ≈ 33.3 个，每个 8000 bit → 吞吐 ≈ 33.3 × 8000 = 266.7 kbps。',
          comparison:
            'PPT 中的 "33 kB/sec"（33 KB/s ≈ 267 kbps）与 1 Gbps 相比，利用率约 0.027%——注意是千分之 0.27，非常低。停等协议的正确性没有问题，问题在效率；这也正是下一节引入流水线（GBN/SR）的动机。',
        },
        blocks: [
          { type: 'term', zh: '停等协议', en: 'stop-and-wait', def: '发送方每发出一个分组就停下来等待该分组的 ACK，收到 ACK 后才发下一个分组。' },
          { type: 'term', zh: '发送利用率', en: 'sender utilization', def: '发送方实际用于发送数据的时间占总时间的比例：U = (L/R) / (RTT + L/R)。' },
          {
            type: 'formula',
            latex: 'U_{sender} = \\frac{L/R}{RTT + L/R}',
            caption: '停等协议的发送利用率（L：分组长度，R：链路速率）',
          },
          {
            type: 'example',
            title: '例题：PPT 第 39 页的数值（已核实）',
            steps: [
              '链路速率 $R = 1$ Gbps = $10^9$ bps，传播时延 15 ms（单程），分组长度 $L = 8000$ bit；',
              '传输时延 $D_{trans} = L/R = 8000 / 10^9 = 8\\ \\mu s$；',
              '往返时延 $RTT = 2 \\times 15 = 30$ ms；',
              '利用率 $U = \\frac{8\\ \\mu s}{30\\ ms + 8\\ \\mu s} \\approx 0.00027 = 0.027\\%$；',
              '每 30 ms 发一个 8000 bit（=1000 字节）的分组 → 吞吐 $= 1000\\ B / 0.03\\ s \\approx 33.3\\ KB/s \\approx 267\\ kbps$，仅占 1 Gbps 链路的约 0.027%。',
            ],
            answer: '吞吐 ≈ 33.3 KB/s，利用率 ≈ 0.027%——"性能很差"（PPT 原文：performance stinks）',
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '利用率公式 $U = \\frac{L/R}{RTT + L/R}$ 是高频计算考点；结论"停等协议在高速长距离链路上利用率极低"及其原因（一个 RTT 只发一个分组）必考。',
          },
        ],
        questionIds: ['q3.4.4-01'],
        related: ['k3.4.5', 'k1.4.2'],
      },
    ],
  },
  {
    id: 's3.4.2',
    title: '流水线协议',
    knowledge: [
      {
        id: 'k3.4.5',
        title: '流水线思想',
        en: 'Pipelining',
        summary:
          '流水线允许发送方在未收到 ACK 时连续发送多个分组（in-flight），大幅提高利用率；代价是序号空间要扩大、收发双方需要缓存，并引入 GBN 与 SR 两种协议形式。',
        tags: ['流水线', 'in-flight', '滑动窗口'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [41, 42, 43] }],
        insight: {
          why: '停等协议把链路的绝大部分时间浪费在等待 ACK 上。只要让发送方"不等了"，连续把分组推出去，链路就能被填满。',
          coreIdea: '允许 N 个未确认分组同时在途（in-flight）；发送方维护一个可滑动的窗口，收到 ACK 就向前滑动。',
          mechanism:
            '发送方不必等 ACK，可连续发送多个分组。序号范围必须扩大（不再只有 0/1），收发双方都需要缓存（发送方缓存未确认的分组以备重传，接收方视协议缓存乱序分组）。',
          comparison:
            '两种流水线协议：**GBN**（后退 N 帧，Go-Back-N）——接收方不缓存乱序分组、累积 ACK、超时整段重传；**SR**（选择重传，Selective Repeat）——接收方缓存乱序分组、逐个 ACK、只重传丢失的分组。前者简单，后者高效。',
        },
        blocks: [
          {
            type: 'formula',
            latex: 'U_{pipelined} \\approx N \\cdot U_{stop\\text{-}and\\text{-}wait}',
            caption: '流水线使利用率近似提高到停等的 N 倍（N 为窗口大小）',
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '常考：流水线带来的三个代价——序号空间扩大、发送方缓存、接收方缓存；以及"流水线协议分 GBN 与 SR 两种"。',
          },
          {
            type: 'compareRef',
            compareId: 'c3.4.6-gbn-sr',
            label: '对比：GBN 与 SR',
          },
        ],
        questionIds: ['q3.4.5-01'],
        related: ['k3.4.6', 'k3.4.7', 'k3.4.4'],
      },
      {
        id: 'k3.4.6',
        title: '后退 N 帧协议 GBN',
        en: 'Go-Back-N',
        summary:
          'GBN 允许最多 N 个未确认分组在途；接收方只做累积 ACK、**丢弃乱序分组**（不缓存）；发送方对最老未确认分组设一个定时器，超时后**重传该分组及之后所有分组**。',
        tags: ['GBN', '滑动窗口', '累积ACK'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [44, 45, 46, 47] }],
        insight: {
          why: 'GBN 用"宁可多传、不可复杂"的策略换实现简单：接收方不需要缓存和排序逻辑，只要记住"下一个期望的序号"。',
          coreIdea: '发送窗口 + 累积 ACK + 单一定时器：ACK(n) 表示"n 及之前全部收到"；超时即回退到最老未确认分组，把窗口内的都重发一遍。',
          mechanism:
            '发送方维护窗口 [base, base+N-1]：① 收到 ACK(n)（n>base）→ base = n，窗口前滑；② 超时 → 重传从 base 开始的**所有**未确认分组。接收方：① 收到期望序号的分组 → 交付并回发累积 ACK；② 收到乱序分组（序号超前）→ **直接丢弃**，回发"最后一个按序收到的分组"的 ACK（可能产生重复 ACK）。',
          comparison:
            'GBN vs SR：GBN 一个分组丢失会导致其后已正确到达的分组全部被丢弃重传（**重传放大**），但接收方零缓存、实现简单；SR 只重传丢失的那个，但接收方要缓存与排序。GBN 序号空间只需 ≥ N+1（接收窗口为 1），SR 需要 ≥ 2N。',
        },
        blocks: [
          {
            type: 'list',
            items: [
              'k 位序号字段 → 序号空间 $2^k$，发送窗口大小 N 满足 $2^k \\ge N + 1$；',
              'ACK(n)：**累积确认**——"n 及之前的分组都收到了"；',
              '定时器：对**最老的未确认分组**（base）设一个（可视为对每个在途分组各设一个）；',
              '超时 → 重传 base 及窗口内所有更高序号的分组。',
            ],
          },
          {
            type: 'callout',
            tone: 'warning',
            title: '易错点',
            text: '① GBN 接收方**丢弃**乱序分组而不是缓存（这是它与 SR 的根本区别）；② 超时后重传的是"窗口内所有未确认分组"，不只是丢失的那一个；③ 接收方收到乱序分组也要回发 ACK（重复 ACK），不能沉默。',
          },
          {
            type: 'demoRef',
            demoId: 'd3.4.6-gbn',
            label: '交互演示：GBN 滑动窗口与整段重传',
          },
        ],
        questionIds: ['q3.4.6-01', 'q3.4.6-02'],
        demoIds: ['d3.4.6-gbn'],
        related: ['k3.4.7', 'k3.4.5', 'k3.5.5'],
      },
      {
        id: 'k3.4.7',
        title: '选择重传协议 SR',
        en: 'Selective Repeat',
        summary:
          'SR 让接收方**缓存乱序分组**并逐个 ACK，发送方只为每个未确认分组单独设定时器，超时只重传**那一个**分组；代价是序号空间必须 ≥ 2N。',
        tags: ['SR', '滑动窗口', '乱序缓存'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [48, 49, 50, 51, 52] }],
        insight: {
          why: 'GBN 在丢包率高时浪费惊人（丢 1 个包重传 N 个）。SR 的目标是：**谁的 ACK 没来，就重传谁**。',
          coreIdea: '发送方为每个分组单独计时；接收方缓存乱序分组，凑齐后按序交付。',
          mechanism:
            '发送方：① 收到 ACK(n) 且 n 在窗口内 → 标记该分组已收到；若 n 是最小未确认分组，窗口前滑到下一个未确认序号；② 超时(n) → 只重传分组 n 并重启其定时器。接收方：① 收到窗口内分组 → 逐个 ACK；乱序则缓存；按序到达时**连同缓存中后续连续分组一起交付**，窗口前滑；② 收到窗口前的旧分组（重复）→ 仍回 ACK（否则发送方窗口无法前滑）。',
          comparison:
            'SR 与 GBN 的接收方行为恰好相反：GBN 丢弃乱序、SR 缓存乱序。SR 的代价：序号空间必须 $2^k \\ge 2N$（收发窗口各为 N），否则接收方无法区分"窗口内的新分组"与"上一轮的旧分组"（PPT 第 52 页的 dilemma：序号 0-3、窗口 3 时，旧 0 与新 0 无法区分，会重复交付）。',
        },
        blocks: [
          {
            type: 'callout',
            tone: 'warning',
            title: 'SR 的窗口大小约束（必考）',
            text: '序号空间（$2^k$）必须 ≥ 发送窗口 + 接收窗口 = 2N。PPT 第 52 页的两个场景：接收方无法区分"旧分组 0 的重传"与"新分组 0"——若窗口过大，重复数据会被当成新数据错误交付。',
          },
          {
            type: 'example',
            title: '例题：SR 的窗口约束',
            steps: [
              '序号位数 $k = 3$，则序号空间为 $2^3 = 8$（0~7）；',
              '窗口大小 N 必须满足 $N \\le 2^k / 2 = 4$；',
              '若把 N 设为 5：发送窗口 [0,4]、接收窗口 [0,4]，当分组 0-4 全部丢失重传时，接收方无法区分"旧 0"与"新 0"，导致重复交付——协议失效。',
            ],
            answer: 'k=3 时 SR 最大窗口 N = 4（GBN 则允许 N = 7）',
          },
          {
            type: 'demoRef',
            demoId: 'd3.4.7-sr',
            label: '交互演示：SR 只重传丢失分组',
          },
        ],
        questionIds: ['q3.4.7-01', 'q3.4.7-02'],
        demoIds: ['d3.4.7-sr'],
        related: ['k3.4.6', 'k3.5.7'],
      },
    ],
  },
]
