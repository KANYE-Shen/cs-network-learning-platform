import type { Chapter } from '../../types/content'
import { ch3Part1 } from './ch3-part1'
import { ch3Part2 } from './ch3-part2'
import { ch3Part3 } from './ch3-part3'

export const ch3: Chapter = {
  id: 'ch3',
  order: 3,
  title: '第三章 传输层',
  en: 'Transport Layer',
  pptFile: 'Chapter3.pptx',
  intro:
    '传输层是协议栈中第一个"端到端"的层次：它把网络层"主机到主机"的尽力而为服务，升级为"进程到进程"的可靠（TCP）或轻量（UDP）服务。本章沿两条主线展开——可靠数据传输的原理（rdt 演进、流水线、GBN/SR）与其实例化（TCP 的序号确认、超时重传、快重传、流量控制、连接管理、拥塞控制）。',
  sections: [
    { id: 's3.1', title: '3.1 传输层服务', en: 'Transport-Layer Services', subsections: ch3Part1.slice(0, 1) },
    { id: 's3.2', title: '3.2 复用与分用', en: 'Multiplexing & Demultiplexing', subsections: ch3Part1.slice(1, 2) },
    { id: 's3.3', title: '3.3 UDP', en: 'Connectionless Transport: UDP', subsections: ch3Part1.slice(2, 3) },
    { id: 's3.4', title: '3.4 可靠数据传输原理', en: 'Principles of Reliable Data Transfer', subsections: ch3Part2 },
    { id: 's3.5', title: '3.5 TCP', en: 'Connection-Oriented Transport: TCP', subsections: ch3Part3.slice(0, 5) },
    {
      id: 's3.6',
      title: '3.6 拥塞控制原理',
      en: 'Principles of Congestion Control',
      subsections: ch3Part3.slice(5, 6),
    },
    {
      id: 's3.7',
      title: '3.7 TCP 拥塞控制',
      en: 'TCP Congestion Control',
      subsections: ch3Part3.slice(6, 7),
    },
  ],
  summary: {
    id: 'sum-ch3',
    chapterId: 'ch3',
    title: '第三章 传输层 · 章节总结',
    framework: [
      {
        type: 'p',
        text: '本章知识框架分三大块，层层递进：**服务模型 → 通用原理 → TCP 实例**。',
      },
      {
        type: 'list',
        items: [
          '**第一块：传输层服务与复用分用（3.1-3.3）**——传输层提供进程间逻辑通信；复用/分用靠端口号；UDP 是无修饰的尽力而为服务（8 字节首部 + 校验和）。',
          '**第二块：可靠数据传输原理（3.4）**——从理想信道出发逐步加码：rdt1.0（无差错无丢包）→ rdt2.x（比特差错：校验和 + ACK/NAK + 序号）→ rdt3.0（丢包：定时器）；停等效率太低 → 流水线 → GBN（丢弃乱序、整段重传）与 SR（缓存乱序、逐个重传）。',
          '**第三块：TCP 实例（3.5-3.7）**——报文段结构（序号/确认号按字节编号）；RTT 估计与超时；可靠传输（累积 ACK、单一定时器、快重传）；流量控制（rwnd）；连接管理（三次握手、四次挥手）；拥塞控制（AIMD、慢启动/拥塞避免/快恢复）。',
        ],
      },
      {
        type: 'table',
        caption: '本章核心机制一览',
        headers: ['机制', '解决什么问题', '关键变量/规则'],
        rows: [
          ['复用/分用', '同一台主机上多个进程共享网络层', 'UDP 2 元组；TCP 4 元组'],
          ['校验和', '检测比特差错', '16 位 1 的补码加法，进位回卷'],
          ['序号/确认号', '字节流的可靠有序交付', 'ACK = 期望的下一个字节序号'],
          ['超时重传', '分组或 ACK 丢失', 'TimeoutInterval = EstimatedRTT + 4×DevRTT'],
          ['快速重传', '不等超时提前恢复丢包', '3 个重复 ACK 触发'],
          ['流量控制', '发送方别淹没接收方', 'rwnd，窗口 = min(rwnd, cwnd)'],
          ['拥塞控制', '别让网络过载', 'cwnd、ssthresh、AIMD'],
          ['连接管理', '同步状态与序号', '三次握手、四次挥手、2×MSL'],
        ],
      },
    ],
    background: [
      {
        type: 'p',
        text: '传输层每一套机制背后都有一个具体的问题逼出来的：',
      },
      {
        type: 'list',
        items: [
          '**为什么需要端口号？**——IP 地址只能定位主机，主机上有几十个进程同时通信，没有端口号数据就"送错门"。',
          '**为什么需要校验和？**——物理噪声会翻转比特，接收方必须能发现错误。',
          '**为什么 rdt 要一路演进？**——现实信道同时存在比特差错、丢包、乱序，协议只能一层层加机制：检测（校验和）→ 反馈（ACK/NAK）→ 去重（序号）→ 兜底（定时器）。',
          '**为什么停等不够用？**——1 Gbps 链路上利用率只有 0.027%，必须流水线。',
          '**为什么 TCP 超时值要自适应？**——RTT 随排队波动，固定超时要么过早要么过晚。',
          '**为什么要三次握手？**——两次握手挡不住"延迟的 SYN 报文"造成半开连接。',
          '**为什么关闭要四次？**——TCP 全双工，两方向独立关闭。',
          '**为什么要拥塞控制？**——发送方看不见网络，人人抢发会集体丢包，AIMD 是分布式合作的最优折中。',
        ],
      },
    ],
    mechanisms: [
      {
        type: 'p',
        text: '本章最核心的协议与算法：',
      },
      {
        type: 'list',
        items: [
          '**GBN（后退 N 帧）**：累积 ACK；接收方丢弃乱序分组；超时后重传窗口内全部未确认分组；序号空间 ≥ N+1。',
          '**SR（选择重传）**：逐个 ACK；接收方缓存乱序分组按序交付；超时只重传丢失分组；序号空间 ≥ 2N。',
          '**TCP 可靠传输**：单一重传定时器对最老未确认段计时；超时或 3 个重复 ACK 触发重传；累积 ACK。',
          '**三次握手**：SYN(seq=x) → SYN+ACK(seq=y, ack=x+1) → ACK(ack=y+1)，客户端 CLOSED→SYN SENT→ESTAB，服务器 LISTEN→SYN RCVD→ESTAB。',
          '**四次挥手**：FIN → ACK → FIN → ACK；主动关闭方最后在 TIME_WAIT 等 2×MSL。',
          '**拥塞控制**：慢启动（指数）→ 拥塞避免（线性）；超时 → cwnd=1 回慢启动；3 重复 ACK → 快恢复（cwnd=ssthresh+3）。',
        ],
      },
    ],
    formulas: [
      {
        type: 'formula',
        latex: 'EstimatedRTT = (1 - \\alpha) \\cdot EstimatedRTT + \\alpha \\cdot SampleRTT \\quad (\\alpha = 0.125)',
        caption: 'RTT 平滑估计：历史影响按指数衰减',
      },
      {
        type: 'formula',
        latex: 'DevRTT = (1 - \\beta) \\cdot DevRTT + \\beta \\cdot |SampleRTT - EstimatedRTT| \\quad (\\beta = 0.25)',
        caption: 'RTT 偏差估计',
      },
      {
        type: 'formula',
        latex: 'TimeoutInterval = EstimatedRTT + 4 \\cdot DevRTT',
        caption: '超时时间：均值加 4 倍偏差的安全余量',
      },
      {
        type: 'formula',
        latex: 'U_{sender} = \\frac{L/R}{RTT + L/R}',
        caption: '停等协议利用率：1 Gbps 链路 + 15ms 传播 + 8000bit 分组 → 仅约 0.027%',
      },
      {
        type: 'formula',
        latex: '\\text{发送窗口} = \\min(rwnd,\\ cwnd)',
        caption: '发送窗口受接收方与网络双重约束',
      },
      {
        type: 'example',
        title: '代入计算示例：RTT 三项公式',
        steps: [
          '初始 EstimatedRTT = 100 ms、DevRTT = 10 ms，样本 SampleRTT = 120 ms；',
          'EstimatedRTT = 0.875×100 + 0.125×120 = 102.5 ms；',
          'DevRTT = 0.75×10 + 0.25×17.5 = 11.875 ms；',
          'TimeoutInterval = 102.5 + 4×11.875 = 150 ms。',
        ],
        answer: 'TimeoutInterval = 150 ms',
      },
    ],
    examPoints: [
      {
        type: 'p',
        text: '本章是考研与期末的高频出题区，重点题型如下：',
      },
      {
        type: 'list',
        items: [
          '**计算题**：RTT 三项公式迭代计算；停等/流水线利用率；GBN/SR 窗口与序号空间约束（$2^k \\ge N+1$ 与 $2^k \\ge 2N$）；拥塞窗口 cwnd 逐 RTT 演进；校验和计算（注意回卷进位）。',
          '**辨析题**：TCP vs UDP；流量控制 vs 拥塞控制；GBN vs SR；慢启动 vs 拥塞避免；快重传 vs 超时重传；UDP 2 元组 vs TCP 4 元组分用。',
          '**简答题**：为什么需要三次握手（两次握手的失败场景）；为什么 TIME_WAIT 要 2×MSL；为什么 TCP 没有消息边界；rdt 演进每一步解决了什么问题。',
          '**状态题**：三次握手/四次挥手的状态序列；拥塞控制 FSM 的转移条件与动作。',
        ],
      },
    ],
    confusions: [
      {
        type: 'p',
        text: '本章易混概念集中在"两个相似机制"的对比上，务必逐对辨析：',
      },
      {
        type: 'table',
        caption: '高频辨析表',
        headers: ['对比项', '第一方', '第二方', '关键区分点'],
        rows: [
          ['TCP vs UDP', '面向连接、可靠有序字节流、流控+拥塞控制、首部 20 字节', '无连接、不可靠、保留报文边界、首部 8 字节', '字节流 vs 数据报；有没有连接'],
          ['流量控制 vs 拥塞控制', '保护接收方，rwnd，端到端', '保护网络，cwnd，全局', 'min(rwnd, cwnd)'],
          ['GBN vs SR', '丢弃乱序、累积 ACK、整段重传、序号 ≥ N+1', '缓存乱序、逐个 ACK、单个重传、序号 ≥ 2N', '接收方是否缓存乱序分组'],
          ['慢启动 vs 拥塞避免', 'cwnd < ssthresh，指数增长', 'cwnd ≥ ssthresh，线性增长', '每 RTT 翻倍 vs 每 RTT +1 MSS'],
          ['超时重传 vs 快重传', '定时器超时，cwnd 归 1', '3 重复 ACK，cwnd = ssthresh+3', '减半归一 vs 减半加三'],
          ['UDP 分用 vs TCP 分用', '目的 IP+目的端口（2 元组）', '源 IP+源端口+目的 IP+目的端口（4 元组）', 'UDP 不区分客户端'],
          ['EstimatedRTT vs SampleRTT', '平滑估计值', '实测样本', '重传段不采样'],
        ],
      },
    ],
    misconceptions: [
      {
        type: 'p',
        text: '以下错误理解在考试与实践中反复出现，请对照纠正：',
      },
      {
        type: 'list',
        items: [
          '❌ "网络层提供端到端可靠通信" → ✅ 网络层（IP）只提供尽力而为的数据报投递，可靠性由传输层（TCP）在端系统实现。',
          '❌ "TCP 确认号是已收到的字节数" → ✅ 确认号是**期望收到的下一个字节**的序号（最后一个收到字节 +1）。',
          '❌ "TCP 按报文段编号" → ✅ TCP 按**字节**编号；一个 1460 字节的段之后，下一个段序号 +1460。',
          '❌ "UDP 按源端口和目的端口分用" → ✅ UDP 只按**目的端口**分用。',
          '❌ "GBN 接收方缓存乱序分组" → ✅ GBN 接收方**直接丢弃**乱序分组；缓存乱序的是 SR。',
          '❌ "超时与 3 个重复 ACK 后 cwnd 一样" → ✅ 超时 cwnd=1 MSS 回慢启动；3 重复 ACK cwnd=ssthresh+3 MSS 进快恢复。',
          '❌ "校验和能检测并纠正所有错误" → ✅ 校验和只能**检测**（且可能漏检），不能纠正。',
          '❌ "四次挥手固定四步" → ✅ 中间两步（ACK 与 FIN）在同时关闭时可合并，所以有时只有 3 个报文。',
          '❌ "慢启动很慢" → ✅ 名字有误导性：慢启动是**指数增长**（每 RTT 翻倍），是 cwnd 增长最快的阶段。',
        ],
      },
    ],
    connections: [
      {
        type: 'p',
        text: '传输层与其它章节的联系：',
      },
      {
        type: 'list',
        items: [
          '**与第一章（导论）**：TCP/UDP 是 1.2 节"网络边缘"服务的展开；时延四元组（1.4 节）中的排队时延正是拥塞的表现；分层与封装（1.5 节）定义了传输层 PDU（报文段）。',
          '**与第二章（应用层）**：应用按需求选传输协议（HTTP/FTP/SMTP 用 TCP，DNS/流媒体用 UDP）；套接字（2.7 节）是应用使用传输层服务的接口；端口号是分用的钥匙。',
          '**与后续章节（网络层）**：TCP 的拥塞控制依赖网络层丢包作为信号；网络层提供的尽力而为服务正是传输层要"增强"的对象；ECN（网络辅助拥塞控制）需要网络层配合。',
          '**与后续章节（链路层）**：校验和在链路层同样存在；rdt 原理在链路层（如 802.11 的 ARQ）同样适用——可靠传输是"跨层反复出现"的主题。',
        ],
      },
    ],
    mnemonics: [
      {
        type: 'p',
        text: '记忆口诀与复习建议：',
      },
      {
        type: 'list',
        items: [
          '**rdt 演进口诀**："错加检（校验和），坏加反（ACK/NAK），乱加序（序号），丢加时（定时器）"。',
          '**握手挥手口诀**："三握手四挥手，全双工才要分开走"；状态序列：客户端"关、发、建、等1、等2、时待、关"（CLOSED→SYN SENT→ESTAB→FIN_WAIT_1→FIN_WAIT_2→TIME_WAIT→CLOSED）。',
          '**拥塞控制口诀**："慢启动翻倍，避免加一；超时归一，三重复加三"。',
          '**复习建议**：① 先默画 rdt 演进图（每一步的新机制与缺陷）；② 用 PPT 第 57 页 telnet 例子亲手算一遍 Seq/ACK；③ 用 100ms/10ms/120ms 算一遍 RTT 三项公式；④ 画一张 GBN vs SR 对比表；⑤ 从 CLOSED 到 CLOSED 完整走一遍连接生命周期（握手→传数据→挥手）。',
        ],
      },
    ],
    questionIds: [],
  },
}
