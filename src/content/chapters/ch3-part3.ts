import type { Subsection } from '../../types/content'

/** 第三章 3.5 - 3.7：TCP、拥塞控制原理、TCP 拥塞控制 */
export const ch3Part3: Subsection[] = [
  {
    id: 's3.5.1',
    title: '报文与序号确认',
    knowledge: [
      {
        id: 'k3.5.1',
        title: 'TCP 概览',
        en: 'TCP Overview',
        summary:
          'TCP（RFC 793 等）是面向连接、全双工、点对点的可靠有序字节流协议；流量控制与拥塞控制共同决定发送窗口；字节流没有消息边界。',
        tags: ['TCP', '全双工', '字节流', 'MSS'],
        sources: [
          { kind: 'ppt', ppt: 'Chapter3', slides: [54] },
          { kind: 'external', label: 'RFC 793', url: 'https://www.rfc-editor.org/rfc/rfc793' },
        ],
        insight: {
          why: '应用需要"像文件读写一样"可靠有序的字节流，而 IP 只提供不可靠数据报。TCP 用连接管理、序号确认、重传、流控、拥塞控制一整套机制，在不可靠的 IP 之上构造出可靠的字节流管道。',
          coreIdea: '把两端之间的通信抽象成一条双向字节流管道：应用写入什么顺序的字节，对端就按同样顺序读出什么字节。',
          mechanism:
            '点对点（一个发送方一个接收方）；全双工（同一连接双向数据流）；面向连接（握手初始化双方状态）；可靠有序字节流；流水线发送（TCP 拥塞控制与流量控制共同设定窗口大小）；MSS（最大报文段长度）限制单个报文段的负载。',
          comparison:
            'TCP 的"字节流"意味着**没有消息边界**：应用发两次"AB"+"CD"，对端可能一次收到"ABCD"（或"ABC"+"D"）。UDP 则保留边界。这是二者最本质的语义差别之一。',
        },
        blocks: [
          { type: 'term', zh: '最大报文段长度', en: 'Maximum Segment Size, MSS', def: 'TCP 报文段中应用数据的最大长度，由链路层 MTU 与 TCP/IP 首部大小决定。典型值约 1460 字节：以太网 MTU 为 1500 字节，减去 IP 与 TCP 首部各 20 字节。' },
          {
            type: 'list',
            items: [
              '**点对点**：一个发送方、一个接收方（不支持多播）；',
              '**全双工**：同一连接上双向数据流（两端都能收发）；',
              '**可靠、有序的字节流**：==没有消息边界==；',
              '**流水线**：TCP 拥塞控制与流量控制共同设置窗口大小；',
              '**连接导向**：握手初始化发送方/接收方状态；',
              '**面向字节流**：序号按**字节**编号，而不是按报文段编号。',
            ],
          },
          {
            type: 'p',
            text: '类比：TCP 像一根水管，应用把水灌进去，对端只看到连续的水流，分不清你一次灌了几桶；UDP 则像一件件分开的包裹，边界清楚。边界：水管本身不会丢水，TCP 的可靠性要靠序号、确认与重传来实现。',
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '"TCP 没有消息边界"是最高频考点之一——TCP 是字节流（stream），不是报文（message）流。',
          },
          {
            type: 'knowledgeRef',
            knowledgeId: 'k1.2.3',
            label: '相关：第一章 TCP 服务',
          },
        ],
        questionIds: ['q3.5.1-01'],
        related: ['k3.5.2', 'k1.2.3'],
      },
      {
        id: 'k3.5.2',
        title: 'TCP 报文段结构',
        en: 'Segment Structure',
        summary:
          'TCP 首部至少 20 字节：源/目的端口、32 位序号、32 位确认号、首部长度、6 个标志位（含 SYN/FIN/ACK）、接收窗口、校验和、紧急指针，以及可选项。',
        tags: ['TCP', '报文段', '首部'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [55] }],
        insight: {
          why: 'TCP 的每个机制（可靠、流控、连接管理）都需要在报文段里"记账"：序号与确认号管可靠性，窗口字段管流控，SYN/FIN 管连接，校验和管差错。',
          coreIdea: '一个紧凑的 20 字节首部承载全部控制信息，数据跟在首部之后。',
          mechanism:
            '关键字段：序号（本段数据第一个字节的编号）、确认号（期望收到的下一个字节编号）、首部长度（4 位，单位 4 字节）、标志位（URG/ACK/PSH/RST/SYN/FIN）、接收窗口（rwnd，用于流量控制）、校验和、紧急指针。选项区长度可变（如 MSS 协商、时间戳）。',
          comparison:
            'TCP 首部 20 字节，UDP 首部 8 字节。TCP 多出的序号、确认号、窗口与标志位字段，是它实现可靠传输与流量控制的基础。',
        },
        blocks: [
          {
            type: 'table',
            caption: 'TCP 首部关键字段',
            headers: ['字段', '位数', '作用'],
            rows: [
              ['源端口号 / 目的端口号', '各 16', '标识发送/接收进程，用于分用'],
              ['序号 Sequence Number', '32', '本报文段数据部分第一个字节的编号'],
              ['确认号 ACK Number', '32', '期望收到的下一个字节的序号（累积确认）'],
              ['首部长度', '4', '以 4 字节为单位，最小 5（即 20 字节）'],
              ['标志位', '6', 'URG / ACK / PSH / RST / SYN / FIN'],
              ['接收窗口 rwnd', '16', '接收方通告的可用缓冲区（流量控制）'],
              ['校验和', '16', '覆盖首部与数据的 1 的补码校验和'],
              ['紧急指针', '16', '与 URG 标志配合使用'],
            ],
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '==SYN 与 FIN 各消耗一个序号==；只带 ACK 标志的报文段（纯确认）不消耗序号。注意：ACK 标志位与确认号字段是两回事，确认号字段只在 ACK=1 时有效。',
          },
        ],
        questionIds: ['q3.5.2-01'],
        related: ['k3.5.3', 'k3.3.2'],
      },
      {
        id: 'k3.5.3',
        title: '序号与确认号（字节流编号）',
        en: 'Seq Numbers & ACKs',
        summary:
          'TCP 按字节编号：序号是报文段中第一个数据字节的编号；确认号是期望收到的下一个字节的编号（累积确认）。乱序段如何处理，TCP 规范未作规定，由实现决定。',
        tags: ['序号', '确认号', '累积确认'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [56, 57] }],
        insight: {
          why: 'TCP 是字节流：确认必须精确到字节，才能知道"哪些字节已被可靠接收"。',
          coreIdea: '序号 = 第一个数据字节编号；ACK = 期望的下一个字节编号；一次 ACK 隐含确认了之前所有字节（累积确认）。',
          mechanism:
            'PPT 第 57 页 telnet 例子：主机 A 发「Seq=42, ACK=79, data=字母C」（A 的第 42 字节是该字母，A 期望收到 B 的第 79 字节）；B 回「Seq=79, ACK=43, data=字母C」（B 的第 79 字节是回显的字母，B 期望 A 的第 43 字节——因为 A 的 42 号字节已收到）；A 再回「Seq=43, ACK=80」（纯确认，无数据）。',
          comparison:
            '累积确认：ACK=80 表示"79 及之前都收到了"，而不是"只收到 79"。乱序段（序号超前）到达时如何处理——PPT 明确回答："TCP 规范没有规定，由实现者决定"（可以缓存，也可以丢弃）。',
        },
        blocks: [
          {
            type: 'example',
            title: '例题：telnet 回显场景（PPT 第 57 页）',
            steps: [
              '用户敲入字符（设为字母C）：主机 A 发送 Seq=42, ACK=79, data=该字母（A 的第 42 个字节是它）；',
              '主机 B 收到后回显：发送 Seq=79, ACK=43, data=该字母（确认号 43 = 42+1，表示期望收到 A 的下一个字节 43；B 自己的序号从 79 开始）；',
              '主机 A 确认收到回显：发送 Seq=43, ACK=80（无数据，纯确认）。',
            ],
            answer: '确认号 = 已收到的最后一个字节序号 + 1 = 期望收到的下一个字节序号',
          },
          {
            type: 'callout',
            tone: 'warning',
            title: '易错点',
            text: '① 确认号不是"已收到的字节数"，而是"期望的下一个字节序号"；② 序号按字节而非报文段编号——一个 1460 字节的段之后，下一个段的序号增加 1460；③ SYN/FIN 各占一个序号。',
          },
          {
            type: 'demoRef',
            demoId: 'd3.5.3-seq-ack',
            label: '交互演示：序号与确认号',
          },
        ],
        questionIds: ['q3.5.3-01', 'q3.5.3-02'],
        demoIds: ['d3.5.3-seq-ack'],
        related: ['k3.5.2', 'k3.5.5'],
      },
    ],
  },
  {
    id: 's3.5.2',
    title: 'RTT 与超时',
    knowledge: [
      {
        id: 'k3.5.4',
        title: 'RTT 估计与超时重传时间',
        en: 'RTT & Timeout',
        summary:
          '超时定时器的取值必须随 RTT 波动自适应：EstimatedRTT 用指数加权移动平均（α=0.125）平滑样本，DevRTT（β=0.25）衡量波动，超时时间 = EstimatedRTT + 4×DevRTT。',
        tags: ['RTT', '超时', 'EWMA'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [58, 59, 60] }],
        insight: {
          why: '超时该设多长？太短 → 过早超时、无谓重传；太长 → 对丢包反应迟钝。RTT 本身在波动（排队时延变化），所以超时值必须**动态跟踪** RTT。',
          coreIdea: '用指数加权移动平均（EWMA）估计 RTT 的均值与波动，再加安全余量得到超时时间。',
          mechanism:
            'SampleRTT：测量"发出段 → 收到 ACK"的时间，**重传的段不采样**（无法区分 ACK 对应哪一次发送）。EstimatedRTT = (1−α)·EstimatedRTT + α·SampleRTT，α 典型值 0.125，历史样本影响按指数衰减。DevRTT = (1−β)·DevRTT + β·|SampleRTT − EstimatedRTT|，β 典型值 0.25。TimeoutInterval = EstimatedRTT + 4×DevRTT（安全余量随波动增大）。',
          comparison:
            '超时重传 vs 快速重传（k3.5.7）：超时是"最后手段"，等待时间长；快速重传用 3 个重复 ACK 提前判断丢包，反应快得多。',
        },
        blocks: [
          {
            type: 'formula',
            latex: 'EstimatedRTT = (1 - \\alpha) \\cdot EstimatedRTT + \\alpha \\cdot SampleRTT',
            caption: 'RTT 估计（指数加权移动平均，α 典型值 0.125）',
          },
          {
            type: 'formula',
            latex: 'DevRTT = (1 - \\beta) \\cdot DevRTT + \\beta \\cdot |SampleRTT - EstimatedRTT|',
            caption: 'RTT 偏差估计（β 典型值 0.25）',
          },
          {
            type: 'formula',
            latex: 'TimeoutInterval = EstimatedRTT + 4 \\cdot DevRTT',
            caption: '超时重传时间：估计值加 4 倍偏差的安全余量',
          },
          {
            type: 'example',
            title: '例题：计算 TimeoutInterval（数值已验算）',
            steps: [
              '初始：EstimatedRTT = 100 ms，DevRTT = 10 ms；测得新样本 SampleRTT = 120 ms；',
              '更新估计：$EstimatedRTT = 0.875 \\times 100 + 0.125 \\times 120 = 87.5 + 15 = 102.5$ ms；',
              '更新偏差：$DevRTT = 0.75 \\times 10 + 0.25 \\times |120 - 102.5| = 7.5 + 4.375 = 11.875$ ms；',
              '超时时间：$TimeoutInterval = 102.5 + 4 \\times 11.875 = 102.5 + 47.5 = 150$ ms。',
            ],
            answer: 'TimeoutInterval = 150 ms',
          },
          {
            type: 'callout',
            tone: 'warning',
            title: '易错点',
            text: '① 重传的段不能用于采样（SampleRTT 只对无歧义的 ACK 测量）；② α=0.125、β=0.25 是 PPT 给的典型值（实际 TCP 用 α=1/8，β=1/4，等价）；③ 4×DevRTT 的"4"是工程经验值。',
          },
          {
            type: 'demoRef',
            demoId: 'd3.5.4-rtt-timeout',
            label: '交互演示：输入样本 RTT，实时计算三项',
          },
        ],
        questionIds: ['q3.5.4-01', 'q3.5.4-02'],
        demoIds: ['d3.5.4-rtt-timeout'],
        related: ['k3.5.5', 'k3.5.7'],
      },
    ],
  },
  {
    id: 's3.5.3',
    title: '可靠传输机制',
    knowledge: [
      {
        id: 'k3.5.5',
        title: 'TCP 可靠数据传输（简化发送方）',
        en: 'Reliable Transfer',
        summary:
          'TCP 在 IP 的不可靠服务之上构造可靠传输：流水线报文段 + 累积 ACK + 单一重传定时器；重传由超时或重复 ACK 触发。',
        tags: ['可靠传输', '累积ACK', '重传定时器'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [62, 63, 64, 65, 66, 67] }],
        insight: {
          why: 'TCP 不能照搬 rdt3.0（停等效率太低），也不完全等于 GBN 或 SR——它是二者的混合：累积 ACK 像 GBN，但只重传一个段（快重传）又像 SR。',
          coreIdea: '管道化 + 累积 ACK + 单一定时器：定时器针对**最老的未确认段**；超时只重传那个段。',
          mechanism:
            '简化发送方的三个事件：① 数据来自应用 → 建段（序号=第一个数据字节编号）→ 若定时器未运行则启动；② 超时 → 重传引起超时的段，重启定时器；③ 收到 ACK → 若确认了新的字节（y > SendBase）则更新 SendBase，仍有未确认段则重启定时器。',
          comparison:
            '与 GBN 的差别：TCP 超时后通常只重传**一个**段（而非窗口内全部）；与 SR 的差别：TCP 只用**一个**定时器（而非每段一个）、接收方可以丢弃乱序段（而非必须缓存）。TCP 是实用的折中。',
        },
        blocks: [
          {
            type: 'list',
            items: [
              'TCP 发送方事件一（收到应用数据）：创建报文段（序号 = 第一个数据字节编号）；定时器未运行时启动（对最老未确认段计时）；',
              '事件二（超时）：重传引起超时的段；**重启定时器**；',
              '事件三（收到 ACK）：若 ACK 确认了此前未确认的段 → 更新已确认信息（SendBase 前移）；仍有未确认段则**重启**定时器。',
            ],
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '高频考点：TCP 使用==单一重传定时器==（与 SR 的每段一个定时器对比）；重传由超时事件与重复 ACK 触发；累积 ACK 的语义。',
          },
        ],
        questionIds: ['q3.5.5-01'],
        related: ['k3.5.6', 'k3.5.7', 'k3.4.6'],
      },
      {
        id: 'k3.5.6',
        title: 'ACK 生成策略',
        en: 'ACK Generation',
        summary:
          'RFC 1122/2581 规定接收方四种 ACK 生成策略：期望序号到达可延迟 500ms；有两个段待确认时立即发累积 ACK；乱序段立即发重复 ACK；缺口被填补立即 ACK。',
        tags: ['ACK', '延迟ACK', '重复ACK'],
        sources: [
          { kind: 'ppt', ppt: 'Chapter3', slides: [68] },
          { kind: 'external', label: 'RFC 2581', url: 'https://www.rfc-editor.org/rfc/rfc2581' },
        ],
        insight: {
          why: '每个段都立即 ACK 会产生大量纯确认流量。接收方希望"少发 ACK、合并 ACK"，但乱序到达时又必须**立即**发重复 ACK——因为发送方要靠它触发快重传。',
          coreIdea: '正常情况下延迟/合并 ACK 省流量；异常情况（乱序）立即反馈帮助发送方快速恢复。',
          mechanism:
            '四种情况（PPT 第 68 页表格）：① 期望序号的段到达、且此前都已确认 → **延迟 ACK**（最多等 500ms，希望与后续段合并）；② 期望序号的段到达、且另有一个段待确认 → **立即**发一个累积 ACK（一次确认两个）；③ 乱序段到达（高于期望序号，出现缺口）→ **立即发重复 ACK**（告知期望序号）；④ 缺口被部分或完全填补 → **立即 ACK**（只要该段从缺口下沿开始）。',
          comparison:
            '重复 ACK 不是"错误"，而是精心设计的信号：它告诉发送方"后续段已到达但某一段缺失"——快重传（k3.5.7）正是靠连续 3 个重复 ACK 触发的。',
        },
        blocks: [
          {
            type: 'table',
            caption: 'TCP 接收方 ACK 生成策略（RFC 1122 / RFC 2581，PPT 第 68 页）',
            headers: ['接收方事件', 'TCP 接收方动作'],
            rows: [
              ['期望序号的段到达，且之前所有数据都已确认', '延迟 ACK：最多等 500 ms，若没有下一个段到达则发送 ACK'],
              ['期望序号的段到达，且另有一个段待确认', '立即发送单个累积 ACK，一次确认两个按序段'],
              ['乱序段到达（序号高于期望，出现缺口）', '立即发送重复 ACK，指出期望字节的序号'],
              ['缺口被部分或完全填补的段到达', '立即发送 ACK（只要该段从缺口下沿开始）'],
            ],
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '四种策略常以多选题形式出现；"延迟 ACK 最多 500 ms"与"乱序立即发重复 ACK"是最高频的两个。',
          },
        ],
        questionIds: ['q3.5.6-01'],
        related: ['k3.5.5', 'k3.5.7'],
      },
      {
        id: 'k3.5.7',
        title: '快速重传',
        en: 'Fast Retransmit',
        summary:
          '超时周期通常很长；快速重传利用重复 ACK 提前发现丢包：发送方收到**3 个重复 ACK**（triple duplicate ACKs）就立即重传未确认段中序号最小的段，不等超时。',
        tags: ['快速重传', '重复ACK'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [69, 70, 71] }],
        insight: {
          why: '超时时间往往比 RTT 长得多，等超时意味着长时间停顿。但丢包时后续段还在源源到达——它们触发的重复 ACK 就是"丢包警报"，为什么不等超时就行动？',
          coreIdea: '3 个重复 ACK = 强丢包信号：说明该 ACK 之后至少已有 3 个段到达，丢的那个段大概率真的丢了。',
          mechanism:
            '发送方连续发送多个段，某段丢失后，接收方对每个后续到达的乱序段都回发相同的重复 ACK。发送方收到第 3 个重复 ACK 时（即"triple duplicate ACKs"），立即重传未确认段中**序号最小**的那个。算法（PPT 第 71 页）：if (y > SendBase) { SendBase = y; ... } else { dupACKcount++; if (dupACKcount == 3) resend(segment y); }',
          comparison:
            '快速重传 vs 超时重传：触发条件不同（3 个重复 ACK vs 定时器超时）；速度不同（快重传接近 1 个 RTT，超时要等 TimeoutInterval）；后续动作不同（快重传后进入快恢复，cwnd 减半；超时后 cwnd 归 1，回慢启动）。',
        },
        blocks: [
          {
            type: 'p',
            text: '为什么是 3 个而不是 1 个？因为**乱序本身**也会产生重复 ACK（两个段互换到达顺序）。1-2 个重复 ACK 可能只是乱序，3 个重复 ACK 则强烈暗示丢包——这是经验阈值。',
          },
          {
            type: 'callout',
            tone: 'warning',
            title: '易错点',
            text: '① 重复 ACK 的计数是针对**同一个 ACK 值**的（对同一期望序号）；② 快重传重传的是"未确认段中序号最小的"，不是任意一个；③ 快重传之后 TCP 不会把 cwnd 降到 1（那是超时的行为），而是进入快恢复。',
          },
          {
            type: 'demoRef',
            demoId: 'd3.5.7-fast-retransmit',
            label: '交互演示：3 个重复 ACK 触发快重传',
          },
          {
            type: 'compareRef',
            compareId: 'c3.5.4-timeouts',
            label: '对比：超时重传与快速重传',
          },
        ],
        questionIds: ['q3.5.7-01'],
        demoIds: ['d3.5.7-fast-retransmit'],
        related: ['k3.5.4', 'k3.5.5', 'k3.7.3'],
      },
    ],
  },
  {
    id: 's3.5.4',
    title: '流量控制',
    knowledge: [
      {
        id: 'k3.5.8',
        figureIds: ['f3.5.8-rwnd'],
        title: 'TCP 流量控制与 rwnd',
        en: 'Flow Control',
        summary:
          '流量控制防止发送方淹没接收方：接收方在报文段首部通告剩余缓冲区 rwnd，发送方把在途未确认数据量限制在 rwnd 以内。',
        tags: ['流量控制', 'rwnd', '接收缓冲'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [73, 74] }],
        insight: {
          why: '接收方应用可能读得慢（忙于处理、磁盘写入），而发送方可以瞬间灌满接收缓冲区。缓冲区溢出后到达的段只能丢弃——又触发无谓重传，恶性循环。',
          coreIdea: '让接收方"报数"：每发一个段就通告自己还剩多少缓冲区（rwnd），发送方据此限速。',
          mechanism:
            '接收方在发给发送方的每个段的首部中通告 rwnd = RcvBuffer − (已接收未读数据)。发送方保证在途未确认数据量 ≤ rwnd（注意：发送方还要考虑"已发送但未确认"的部分）。RcvBuffer 大小由 socket 选项设定，典型默认 4096 字节，很多操作系统会自适应调整。',
          comparison:
            '流量控制 vs 拥塞控制：前者针对**接收方**（端到端），用 rwnd；后者针对**网络**（全局），用 cwnd。发送方实际窗口 = min(rwnd, cwnd)。rwnd 在 TCP 首部中显式传输，cwnd 只存在于发送方内部。',
        },
        blocks: [
          {
            type: 'formula',
            latex: 'rwnd = RcvBuffer - (\\text{已接收但未被应用读走的数据量})',
            caption: '接收窗口的计算',
          },
          {
            type: 'formula',
            latex: '\\text{发送方实际可发送窗口} = \\min(rwnd,\\ cwnd)',
            caption: '发送窗口同时受接收方与网络约束',
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '必考辨析：流量控制（rwnd，保护接收方）vs 拥塞控制（cwnd，保护网络）；以及 min(rwnd, cwnd) 公式；"典型 RcvBuffer 默认 4096 字节"。',
          },
          {
            type: 'demoRef',
            demoId: 'd3.5.8-flow-control',
            label: '交互演示：rwnd 如何限制发送方',
          },
          {
            type: 'compareRef',
            compareId: 'c3.5.8-flow-congestion',
            label: '对比：流量控制与拥塞控制',
          },
        ],
        questionIds: ['q3.5.8-01'],
        demoIds: ['d3.5.8-flow-control'],
        related: ['k3.6.1', 'k3.7.2'],
      },
    ],
  },
  {
    id: 's3.5.5',
    title: '连接管理',
    knowledge: [
      {
        id: 'k3.5.9',
        title: '两次握手为什么失败',
        en: '2-Way Handshake Failure',
        summary:
          '两次握手无法处理延迟或重复的连接请求：可能留下半开连接，或让服务器建立一条客户端并不认可的错误连接。',
        tags: ['握手', '半开连接'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [77] }],
        insight: {
          why: '如果两次握手就够，TCP 不会自我麻烦做三次。两次握手的缺陷来自网络的**不可靠**：请求报文可能延迟、可能重复到达。',
          coreIdea: 'TCP 需要双方各自证明"我的请求对方收到了"且"对方的状态是新鲜的"——这至少需要三次交换。',
          mechanism:
            '问题出在请求报文可能**延迟或重复**：服务器收到 SYN 时，无法判断它是新的请求，还是早已失效的旧请求。两次交换不足以让双方确认"对方当前的状态是新鲜的"。',
          comparison:
            '三次握手如何解决：服务器的 SYN+ACK 既确认了客户端的 SYN，又让服务器保持"半开"状态直到收到客户端的最终 ACK；客户端最终 ACK 证明"客户端确实还在"。迟到的旧 SYN 到达时，服务器回 SYN+ACK 后收不到最终 ACK（客户端发现序号陈旧会回 RST），半开连接不会长期存在。',
        },
        blocks: [
          {
            type: 'list',
            items: [
              '**场景一（客户端发出请求后终止）**：客户端发送 req_conn(x) 后不再响应，服务器若已按两次握手建立连接，就会留下**半开连接**，白白维护状态；',
              '**场景二（旧请求延迟到达）**：连接 x 已完成并关闭后，延迟的 req_conn(x) 才到达服务器。服务器误以为客户端要新建连接，回复确认后进入 ESTAB；但客户端并不认这个连接，结果是一条==错误连接==。',
            ],
          },
          {
            type: 'p',
            text: '类比：朋友寄来一封很久以前的聚会邀请，你回一句“收到”并不代表聚会今天仍然有效；还要再问一次“现在还算数吗”。边界：网络里靠序号判断新旧，现实里靠当面确认。',
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '"为什么需要三次握手？"的标准答案：防止已失效的连接请求报文（延迟或重复的 SYN）让服务器建立错误的或半开的连接。',
          },
        ],
        questionIds: ['q3.5.9-01'],
        related: ['k3.5.10', 'k3.5.11'],
      },
      {
        id: 'k3.5.10',
        title: 'TCP 三次握手',
        en: '3-Way Handshake',
        summary:
          '三次握手：客户端发 SYN(seq=x)，服务器回 SYN+ACK(seq=y, ack=x+1)，客户端再发 ACK(ack=y+1)。双方各自确认对方在线，并同步初始序号。',
        tags: ['三次握手', 'SYN', '状态机'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [76, 78, 79] }],
        insight: {
          why: '建立连接要解决两件事：① 双方确认彼此在线且愿意通信；② 同步双方的初始序号（序号是可靠传输的基础，必须防"旧数据"混入）。',
          coreIdea: '三次报文完成双向的"请求-确认"闭环，并交换双方的初始序号。',
          mechanism:
            '① 客户端：CLOSED → 发送 SYN(seq=x) → SYN SENT；② 服务器：LISTEN → 收到 SYN → 发送 SYN+ACK(seq=y, ack=x+1) → SYN RCVD；③ 客户端收到 SYN+ACK → 发送 ACK(ack=y+1) → ESTAB（该 ACK 可以携带数据）；④ 服务器收到 ACK → ESTAB。',
          comparison:
            '对比两次握手：第三次 ACK 让客户端确认"服务器收到了我的 SYN"（即服务器证明了自己的状态是新鲜的），同时向服务器证明"客户端还活着"。SYN 消耗一个序号（x 与 y 是各自初始序号）。',
        },
        blocks: [
          {
            type: 'table',
            caption: '三次握手状态迁移',
            headers: ['阶段', '客户端状态', '服务器状态', '报文'],
            rows: [
              ['初始', 'CLOSED', 'LISTEN', '—'],
              ['第一次握手', '→ SYN SENT', '（等待）', 'SYN, seq=x'],
              ['第二次握手', '（等待）', '→ SYN RCVD', 'SYN+ACK, seq=y, ack=x+1'],
              ['第三次握手', '→ ESTAB（可带数据）', '→ ESTAB', 'ACK, ack=y+1'],
            ],
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '必考：① 三个报文段的标志位与序号/确认号关系；② 状态顺序（CLOSED→SYN SENT→ESTAB；LISTEN→SYN RCVD→ESTAB）；③ 第三次握手可以携带数据；④ SYN 消耗一个序号。',
          },
          {
            type: 'demoRef',
            demoId: 'd3.5.10-handshake',
            label: '交互演示：三次握手状态机',
          },
        ],
        questionIds: ['q3.5.10-01', 'q3.5.10-02'],
        demoIds: ['d3.5.10-handshake'],
        related: ['k3.5.9', 'k3.5.11'],
      },
      {
        id: 'k3.5.11',
        title: 'TCP 四次挥手释放连接',
        en: 'Closing a Connection',
        summary:
          'TCP 是全双工连接，两端各自关闭自己的发送方向：FIN → ACK → FIN → ACK 共四次（中间两次可合并）；客户端最后进入 TIME_WAIT，等待 2×MSL 后关闭。',
        tags: ['四次挥手', 'FIN', 'TIME_WAIT'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [80, 81] }],
        insight: {
          why: '为什么关闭要四次而建立只要三次？因为 TCP 是**全双工**：客户端关掉自己的发送方向（FIN）后，服务器可能还有数据要发。服务器先 ACK（确认收到 FIN），等自己发完数据再发自己的 FIN——两次 FIN 不能总合并。',
          coreIdea: '每个方向独立关闭：FIN 表示"我不再发数据"，ACK 表示"我知道了"；双方各关各的。',
          mechanism:
            '① 客户端：ESTAB → 发 FIN(seq=x) → FIN_WAIT_1；② 服务器收到 FIN → 回 ACK(ack=x+1) → CLOSE_WAIT（服务器还能继续发数据，客户端仍能收）；③ 客户端收到 ACK → FIN_WAIT_2（等待服务器关闭）；④ 服务器发完数据 → 发 FIN(seq=y) → LAST_ACK；⑤ 客户端回 ACK(ack=y+1) → TIME_WAIT（等待 2×MSL）→ CLOSED；⑥ 服务器收到 ACK → CLOSED。',
          comparison:
            '同时关闭（simultaneous close）时双方的 ACK 与 FIN 可合并，总报文数少于四次。TIME_WAIT 只在主动关闭方出现，两个理由：① 确保最后的 ACK 能到达对方（丢了对方会重发 FIN，需要能再次 ACK）；② 让本连接的旧报文在网络中消亡（2×MSL 后不会被新连接误收）。',
        },
        blocks: [
          {
            type: 'table',
            caption: '四次挥手状态迁移（客户端主动关闭）',
            headers: ['步骤', '客户端状态', '服务器状态', '报文'],
            rows: [
              ['初始', 'ESTAB', 'ESTAB', '—'],
              ['第一次挥手', '→ FIN_WAIT_1', '（等待）', 'FIN, seq=x'],
              ['第二次挥手', '→ FIN_WAIT_2', '→ CLOSE_WAIT（仍可发数据）', 'ACK, ack=x+1'],
              ['第三次挥手', '（等待）', '→ LAST_ACK', 'FIN, seq=y'],
              ['第四次挥手', '→ TIME_WAIT（2×MSL）→ CLOSED', '→ CLOSED', 'ACK, ack=y+1'],
            ],
          },
          {
            type: 'callout',
            tone: 'warning',
            title: '易错点',
            text: '① 客户端最后不直接 CLOSED 而是 TIME_WAIT（2×MSL，典型 60 秒左右）；② 服务器没有 TIME_WAIT（只有主动关闭方有）；③ 服务器在 CLOSE_WAIT 状态还能继续发数据（客户端仍能接收）；④ 四次挥手中间两步可以合并，所以有时只看到 3 个报文。',
          },
          {
            type: 'demoRef',
            demoId: 'd3.5.11-teardown',
            label: '交互演示：四次挥手状态机',
          },
        ],
        questionIds: ['q3.5.11-01', 'q3.5.11-02'],
        demoIds: ['d3.5.11-teardown'],
        related: ['k3.5.9', 'k3.5.10'],
      },
    ],
  },
  {
    id: 's3.6.1',
    title: '拥塞成因与方法',
    knowledge: [
      {
        id: 'k3.6.1',
        figureIds: ['f3.6.1-congestion'],
        title: '拥塞：成因与代价',
        en: 'Congestion: Causes & Costs',
        summary:
          '拥塞是"太多源以太快速度发送太多数据"导致的网络过载，表现为丢包与长时延；代价包括无效的重传浪费与吞吐崩溃。它与流量控制（端到端）本质不同。',
        tags: ['拥塞', '丢包', '时延'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [83, 84, 85, 86, 87, 88, 89, 90, 91, 92] }],
        insight: {
          why: '网络资源（链路带宽、路由器缓存）有限，而发送方彼此独立、无法看到全网状态。当总需求超过总供给时，拥塞必然发生。',
          coreIdea: '拥塞是**全局**问题：发送方必须合作性地限制注入网络的速率，否则人人抢发，人人遭殃。',
          mechanism:
            'PPT 用三个场景刻画成因与代价：**场景1**（两个发送方共享瓶颈链路）——重传导致"有效吞吐"远低于链路容量，且拥塞下的重传占用额外资源；**场景2**（三节点、两段链路）——路由器缓存满丢包，丢的包之前消耗的传输资源全部浪费；**场景3**（突发流量与多跳）——分组占用的每一跳资源在它最终被丢弃时都成了沉没成本，拥塞可以自我加剧（发送方越重传，网络越拥塞）。',
          comparison:
            '拥塞控制（针对网络，全局）vs 流量控制（针对接收方，端到端）。拥塞的表现：丢包（路由器缓存溢出）与长时延（路由器排队）。拥塞的代价：为已丢失分组浪费的传输资源、重传本身加剧拥塞的恶性循环。',
        },
        blocks: [
          {
            type: 'list',
            items: [
              '拥塞的非正式定义："太多源以太快速度发送太多数据，网络处理不过来"；',
              '表现：**丢包**（路由器缓存溢出）与**长时延**（路由器排队）；',
              '拥塞是 top-10 网络问题之一；',
              '代价一：拥塞时重传的包可能又在路上被丢——**资源浪费叠加**；',
              '代价二：多跳路径上，一个分组在前几跳消耗的传输与排队资源，在最后一跳被丢弃时全部作废；',
              '代价三：重传流量进一步挤占带宽，形成==拥塞 → 丢包 → 重传 → 更拥塞==的恶性循环。',
            ],
          },
          {
            type: 'p',
            text: '408 联系：路由器缓存相当于一个队列，缓存满后新到的分组被丢弃，类似操作系统里缓冲区满时写入失败。',
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '高频考点：拥塞与流量控制的区别；拥塞的两种表现（丢包、长时延）；拥塞的代价（重传浪费、有效吞吐下降、恶性循环）。',
          },
        ],
        questionIds: ['q3.6.1-01'],
        related: ['k3.5.8', 'k3.6.2', 'k1.4.4'],
      },
      {
        id: 'k3.6.2',
        title: '端到端与网络辅助方法',
        en: 'Approaches',
        summary:
          '拥塞控制的两种大思路：端到端（发送方从丢包与时延自行推断拥塞，TCP 采用）与网络辅助（路由器给发送方显式反馈，如 DECbit、ECN、ATM ABR）。',
        tags: ['拥塞控制', '端到端', 'ECN'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [93] }],
        insight: {
          why: '互联网的设计哲学（智能在边缘、核心保持简单）决定了端到端方法成为主流；但路由器其实"看得最清楚"，所以网络辅助方法能更精确。',
          coreIdea: '端到端：没有显式反馈，从观察到的丢包与延迟**推断**拥塞；网络辅助：路由器提供反馈——单比特拥塞指示或显式速率。',
          mechanism:
            '端到端拥塞控制（TCP）：发送方把丢包当作拥塞信号，调整速率。网络辅助：① 路由器用 1 个比特标记拥塞（SNA、DECbit、TCP/IP 的 ECN、ATM）；② 路由器告知发送方应该使用的显式速率（ATM ABR）。',
          comparison:
            '端到端方法无需网络支持、部署容易（TCP 的成功证明）；网络辅助方法反馈更准确但需要全网设备配合（部署困难）。ECN 是现实中的折中：路由器标记拥塞，接收方通过 ACK 把信息带回发送方。',
        },
        blocks: [
          {
            type: 'table',
            caption: '两类拥塞控制方法',
            headers: ['方法', '拥塞信号从哪来', '典型代表', '部署特点'],
            rows: [
              ['端到端', '发送方根据丢包、时延自行推断', 'TCP', '无需网络设备支持，部署容易'],
              ['网络辅助（单比特）', '路由器在分组上标记拥塞', 'SNA、DECbit、ECN、ATM', '需要路由器支持'],
              ['网络辅助（显式速率）', '路由器直接告知应使用的发送速率', 'ATM ABR', '需要全网设备配合'],
            ],
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '必考：==端到端==与网络辅助拥塞控制的定义及典型代表（TCP 对应前者，ECN、ATM ABR、DECbit 对应后者）。',
          },
        ],
        questionIds: ['q3.6.2-01'],
        related: ['k3.6.3', 'k3.7.1'],
      },
      {
        id: 'k3.6.3',
        title: '案例：ATM ABR 拥塞控制',
        en: 'ATM ABR Case Study',
        summary:
          'ATM 的 ABR（可用比特率）服务是网络辅助拥塞控制的经典案例：RM 资源管理信元携带 NI/CI 拥塞指示位与 2 字节 ER 显式速率字段，由交换机沿途修改，反馈给发送方。',
        tags: ['ATM', 'ABR', '网络辅助'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [94, 95, 96, 97] }],
        insight: {
          why: 'ATM 面向连接、提供 QoS 保障，因此需要比 TCP 更精细的速率控制机制——由网络直接告诉发送方该发多快。',
          coreIdea: '发送方定期发送 RM（Resource Management）信元探路；沿途交换机在信元上"留言"（降低 ER、置位 CI/NI）；接收方把信元原样返回，发送方按"沿途最窄处"的速率发送。',
          mechanism:
            'RM 信元夹在数据信元之间发送：交换机可修改其中字段——**NI 位**（No Increase：轻微拥塞，别再加速率）、**CI 位**（Congestion Indication：拥塞，降速）；**ER 字段**（2 字节 Explicit Rate，显式速率）：拥塞的交换机把 ER 改小，发送方最终以"路径上最小的 ER"为上限；数据信元中的 **EFCI 位**：拥塞的交换机置 1，接收方看到后把返回的 RM 信元中的 CI 位置 1。',
          comparison:
            'ABR vs TCP：ABR 是网络辅助（显式反馈、精确速率），TCP 是端到端（隐式推断）；ABR 依赖 ATM 的面向连接架构（信元按固定路径走），TCP 在无连接 IP 上工作。',
        },
        blocks: [
          {
            type: 'list',
            items: [
              '**RM 信元**（Resource Management）：发送方定期发出，夹在数据信元之间沿途探路；',
              '**NI 位**（No Increase）：轻微拥塞，交换机置位，提示发送方别再加速率；',
              '**CI 位**（Congestion Indication）：拥塞，交换机置位，要求发送方降速；',
              '**ER 字段**（2 字节 Explicit Rate）：显式速率，拥塞交换机把它改小，发送方取路径上最小的 ER 作上限；',
              '**EFCI 位**：数据信元中的拥塞标记，交换机置 1；接收方看到后，把返回的 RM 信元中的 CI 位置 1。',
            ],
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '这五个术语常在选择题中出现，注意区分各自的作用与修改者：交换机可改 ER、NI、CI、EFCI，接收方根据 EFCI 置 CI。',
          },
        ],
        questionIds: ['q3.6.3-01'],
        related: ['k3.6.2', 'k3.7.1'],
      },
    ],
  },
  {
    id: 's3.7.1',
    title: 'AIMD 与四个阶段',
    knowledge: [
      {
        id: 'k3.7.1',
        title: 'TCP 带宽探测：加法增大与乘法减小',
        en: 'Bandwidth Probing AIMD',
        summary:
          'TCP 发送方不断"探测"可用带宽：收到 ACK 就增大速率（加法增大），发生丢包就减半（乘法减小）——AIMD 让多个连接收敛到公平共享瓶颈带宽。',
        tags: ['AIMD', '拥塞控制', '带宽探测'],
        sources: [
          { kind: 'ppt', ppt: 'Chapter3', slides: [98, 99] },
          { kind: 'supplement', note: 'AIMD 的收敛性（多个连接公平共享瓶颈）是拥塞控制理论的重要结论，PPT 第 99 页的锯齿图展示的就是这一过程。' },
        ],
        insight: {
          why: '发送方不知道网络容量是多少，也不知道其它连接用了多少。唯一可行的策略：像"试水温"一样逐步加码，撞到拥塞（丢包）就大幅退让。',
          coreIdea: '隐式反馈：ACK = 网络通畅 → 加法增大（每 RTT 加 1 MSS）；丢包 = 拥塞 → 乘法减小（窗口减半）。',
          mechanism:
            'TCP 发送方基于隐式反馈自我调节：每收到 ACK（好事，网络没拥塞）→ 增大发送速率；发生丢包（坏事，假定拥塞）→ 减小发送速率。窗口随时间呈锯齿形：线性爬升、减半跌落，反复探测。',
          comparison:
            'AIMD（加法增大、乘法减小）是 TCP 拥塞控制的基本哲学；真实 Linux TCP 用 CUBIC（基于三次函数增长）等更复杂算法，但"试探-退让"的思想不变。',
        },
        blocks: [
          {
            type: 'list',
            items: [
              '收到 ACK（网络通畅）→ **加法增大**：每个 RTT 把 cwnd 加 1 个 MSS；',
              '检测到丢包（假定拥塞）→ **乘法减小**：把 cwnd 减半；',
              '窗口曲线因此呈**锯齿形**：线性爬升，遇丢包减半跌落，随后继续爬升；',
              '全程是**隐式反馈**：没有路由器显式通知，只能靠 ACK 与丢包推断网络状态。',
            ],
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '必考：AIMD 的含义（Additive Increase, Multiplicative Decrease）；TCP 是端到端拥塞控制，基于隐式反馈（ACK/丢包）。',
          },
        ],
        questionIds: ['q3.7.1-01'],
        related: ['k3.7.2', 'k3.6.2'],
      },
      {
        id: 'k3.7.2',
        figureIds: ['f3.7.2-cwnd'],
        title: '拥塞窗口机制全貌',
        en: 'Mechanism Details',
        summary:
          'TCP 用拥塞窗口 cwnd 限制在途数据量：慢启动阶段 cwnd 每 RTT 翻倍（指数增长），超过阈值 ssthresh 后进入拥塞避免，cwnd 每 RTT 增加 1 个 MSS（线性增长）。',
        tags: ['cwnd', 'ssthresh', '慢启动', '拥塞避免'],
        sources: [
          { kind: 'ppt', ppt: 'Chapter3', slides: [100, 101, 102, 103] },
          { kind: 'supplement', note: '教学四状态模型是简化：真实 Linux TCP 采用 CUBIC/BBR 等更复杂的增长函数，但"慢启动 + 拥塞避免"两阶段是共有的框架。' },
        ],
        insight: {
          why: '连接刚建立时不知道网络容量，若用线性增长"爬"会浪费大量时间；若一直指数增长又必然很快撞车。折中方案：先用指数增长快速逼近（慢启动），接近疑似容量后转线性增长精细探测（拥塞避免）。',
          coreIdea: '用 cwnd（拥塞窗口）与 ssthresh（慢启动阈值）两个变量划分两个增长阶段：cwnd < ssthresh → 指数增长；cwnd ≥ ssthresh → 线性增长。',
          mechanism:
            '慢启动：每收到一个 ACK，cwnd += MSS，等价于每个 RTT cwnd **翻倍**（1→2→4→8…），指数增长。拥塞避免：每个 RTT cwnd += MSS × (MSS/cwnd)，等价于每个 RTT 只加 1 个 MSS，线性增长。发送方实际窗口 = min(cwnd, rwnd)。',
          comparison:
            '慢启动 vs 拥塞避免（k3.7.3 对比表）：增长方式（指数 vs 线性）、目的（快速逼近 vs 精细探测）、触发（cwnd < ssthresh vs cwnd ≥ ssthresh）。',
        },
        blocks: [
          {
            type: 'formula',
            latex: 'cwnd_{next} = cwnd + MSS \\quad (\\text{慢启动：每收到一个 ACK})',
            caption: '慢启动增长规则（等价于每 RTT 翻倍）',
          },
          {
            type: 'formula',
            latex: 'cwnd_{next} = cwnd + MSS \\cdot \\frac{MSS}{cwnd} \\quad (\\text{拥塞避免：每个 RTT})',
            caption: '拥塞避免增长规则（等价于每 RTT 加 1 个 MSS）',
          },
          {
            type: 'example',
            title: '例题：cwnd 的演进',
            steps: [
              '初始 cwnd = 1 MSS，ssthresh = 20 MSS；慢启动每个 RTT 翻倍，依次为 1, 2, 4, 8, 16…；',
              '下一次翻倍会达到 32，越过 ssthresh，于是转入拥塞避免；此后每个 RTT 只增加 1 个 MSS；',
              '若此时发生超时：ssthresh = cwnd/2，cwnd = 1 MSS，重新从慢启动开始。',
            ],
            answer: '慢启动指数增长（每 RTT 翻倍），拥塞避免线性增长（每 RTT +1 MSS）',
          },
          {
            type: 'demoRef',
            demoId: 'd3.7.2-congestion',
            label: '交互演示：cwnd 随时间变化的四阶段曲线',
          },
        ],
        questionIds: ['q3.7.2-01', 'q3.7.2-02'],
        demoIds: ['d3.7.2-congestion'],
        related: ['k3.7.1', 'k3.7.3', 'k3.5.8'],
      },
      {
        id: 'k3.7.3',
        title: 'TCP 拥塞控制 FSM',
        en: 'FSM',
        summary:
          '教学模型用 4 个状态刻画 TCP 拥塞控制：慢启动、拥塞避免、快恢复，加上超时与 3 个重复 ACK 两类丢包事件各自的转移动作。',
        tags: ['FSM', '快恢复', '超时', '重复ACK'],
        sources: [
          { kind: 'ppt', ppt: 'Chapter3', slides: [104, 106] },
          { kind: 'supplement', note: '这是教学简化的四状态模型；真实 Linux TCP 使用 CUBIC/BBR 等更复杂的增长函数与恢复策略。' },
        ],
        insight: {
          why: '同样是丢包，超时与 3 个重复 ACK 的含义不同：超时意味着网络状况可能很糟（连 ACK 都断了），要保守地重新慢启动；3 个重复 ACK 意味着只是丢了几个段（后续段还在到达），网络基本通畅，只需温和地减半。',
          coreIdea: '区分两类丢包事件：超时 → 重置到慢启动（cwnd=1）；3 个重复 ACK → 快恢复（cwnd = ssthresh + 3）。',
          mechanism:
            'FSM 转移（PPT 第 104 页，数值已核实）：超时 → ssthresh = cwnd/2，cwnd = 1 MSS，dupACKcount = 0；3 个重复 ACK → ssthresh = cwnd/2，cwnd = ssthresh + 3 MSS，重传缺失段（快重传 + 快恢复）；拥塞避免中收到新 ACK → cwnd += MSS·(MSS/cwnd)；慢启动中收到新 ACK → cwnd += MSS；快恢复中每收到一个重复 ACK → cwnd += MSS；收到新 ACK（快恢复结束）→ cwnd = ssthresh。',
          comparison:
            '超时 vs 3 重复 ACK 的对比（对比表 c3.5.4-timeouts）：超时是最后手段（ACK 都等不到），恢复慢、代价大；3 重复 ACK 是快速路径，恢复快、代价小。快恢复（Fast Recovery）与慢启动、拥塞避免并列，是教学 FSM 的第四个状态。',
        },
        blocks: [
          {
            type: 'table',
            caption: 'TCP 拥塞控制 FSM 转移（PPT 第 104 页）',
            headers: ['当前状态', '事件', '动作', '下一状态'],
            rows: [
              ['慢启动', '收到新 ACK', 'cwnd += MSS（每 RTT 翻倍）；dupACKcount = 0', 'cwnd ≥ ssthresh → 拥塞避免'],
              ['拥塞避免', '收到新 ACK', 'cwnd += MSS·(MSS/cwnd)（每 RTT +1 MSS）', '拥塞避免'],
              ['任意', '3 个重复 ACK', 'ssthresh = cwnd/2；cwnd = ssthresh + 3 MSS；重传缺失段', '快恢复'],
              ['任意', '超时', 'ssthresh = cwnd/2；cwnd = 1 MSS；dupACKcount = 0；重传缺失段', '慢启动'],
              ['快恢复', '收到重复 ACK', 'cwnd += MSS', '快恢复'],
              ['快恢复', '收到新 ACK', 'cwnd = ssthresh；dupACKcount = 0', '拥塞避免'],
            ],
          },
          {
            type: 'callout',
            tone: 'warning',
            title: '易错点',
            text: '① 超时后 cwnd = 1 MSS（回到慢启动），3 重复 ACK 后 cwnd = ssthresh + 3 MSS（快恢复）——两条路径的窗口值完全不同；② 无论哪类丢包，ssthresh 都 = cwnd/2。',
          },
          {
            type: 'callout',
            tone: 'tip',
            title: '记忆口诀',
            text: '超时"减半归一"（ssthresh 减半、cwnd 归一），三重复 ACK"减半加三"（ssthresh 减半、cwnd = 新 ssthresh + 3）。',
          },
        ],
        questionIds: ['q3.7.3-01', 'q3.7.3-02'],
        related: ['k3.7.2', 'k3.5.7', 'k3.7.4'],
      },
      {
        id: 'k3.7.4',
        title: '流行 TCP 变体',
        en: 'TCP Flavors',
        summary:
          'TCP 拥塞控制有多个变体：Tahoe、Reno、NewReno、SACK 等，主要区别在于对超时与重复 ACK 的响应方式（是否快恢复、恢复是否激进）。',
        tags: ['TCP Tahoe', 'TCP Reno', '拥塞控制变体'],
        sources: [{ kind: 'ppt', ppt: 'Chapter3', slides: [105] }],
        insight: {
          why: '不同网络环境（丢包率、RTT、带宽）需要不同的拥塞控制策略；TCP 变体是"同样的问题，不同的取舍"。',
          coreIdea: '以超时/重复 ACK 的响应策略区分各变体。',
          mechanism:
            'TCP Tahoe：超时或 3 重复 ACK 都回到慢启动（cwnd=1），无快恢复；TCP Reno：3 重复 ACK 进入快恢复（cwnd 减半加 3），超时才回慢启动——即我们学习的教学模型；NewReno：改进 Reno 快恢复期间又丢包的处理；SACK：选择性确认（告知哪些段已收到），避免不必要的重传。',
          comparison:
            '教学 FSM 对应的是 Reno 的行为。真实 Linux TCP 默认 CUBIC（用三次函数在丢包后更高效地恢复到高带宽），Google 的 BBR 则完全绕开丢包信号、基于瓶颈带宽与 RTT 建模。',
        },
        blocks: [
          {
            type: 'table',
            caption: '常见 TCP 拥塞控制变体',
            headers: ['变体', '对超时 / 重复 ACK 的响应', '关键区别'],
            rows: [
              ['Tahoe', '超时或 3 个重复 ACK 都回到慢启动（cwnd = 1）', '没有快恢复'],
              ['Reno', '3 个重复 ACK 进入快恢复（cwnd 减半加 3），超时才回慢启动', '有快恢复；教学模型就是 Reno'],
              ['NewReno', '改进 Reno 在快恢复期间再次丢包时的处理', '一次恢复多个丢包'],
              ['SACK', '选择性确认，告知发送方哪些段已收到', '避免不必要的重传'],
            ],
          },
          {
            type: 'callout',
            tone: 'exam',
            title: '考试重点',
            text: '常考：Tahoe 与 Reno 的区别（有无快恢复）；以及==教学模型 = Reno 行为==的对应关系。',
          },
        ],
        questionIds: ['q3.7.4-01'],
        related: ['k3.7.3'],
      },
    ],
  },
]
