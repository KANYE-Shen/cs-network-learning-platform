import type { ChapterSummary } from '../../types/content'

export const ch3Summary: ChapterSummary = {
    id: 'sum-ch3',
    chapterId: 'ch3',
    title: '第三章 传输层 · 章节总结',
    framework: [
      {
        type: 'p',
        text: '本章内容分三层递进：传输层服务、可靠传输原理、TCP 实现。',
      },
      {
        type: 'table',
        caption: '知识框架与知识点编号',
        headers: ['层级', '内容', '对应知识点'],
        rows: [
          ['第一块：传输层服务与复用分用', '传输层提供进程间的逻辑通信；复用与分用靠端口号；UDP 是不加修饰的尽力而为服务（8 字节首部 + 校验和）', '3.1-3.3'],
          ['第二块：可靠数据传输原理', '从理想信道逐步加机制：rdt1.0 假设无差错无丢包；rdt2.x 加入校验和、ACK/NAK 与序号，处理比特差错；rdt3.0 加入定时器，处理丢包。停等效率太低，引出流水线，流水线下有 GBN（丢弃乱序、整段重传）与 SR（缓存乱序、逐个重传）两种方案', '3.4'],
          ['第三块：TCP 实例', '报文段结构（序号与确认号按字节编号）；RTT 估计与超时；可靠传输（累积 ACK、单一定时器、快重传）；流量控制（$rwnd$）；连接管理（三次握手、四次挥手）；拥塞控制（AIMD、慢启动、拥塞避免、快恢复）', '3.5-3.7'],
        ],
      },
      {
        type: 'table',
        caption: '本章核心机制一览',
        headers: ['机制', '解决什么问题', '关键变量/规则'],
        rows: [
          ['复用/分用', '同一台主机上多个进程共享网络层', 'UDP 2 元组；TCP 4 元组'],
          ['校验和', '检测比特差错', '16 位 1 的补码加法，进位回卷'],
          ['序号/确认号', '字节流的可靠有序交付', '确认号即期望收到的下一个字节的序号'],
          ['超时重传', '分组或 ACK 丢失', '$TimeoutInterval = EstimatedRTT + 4 \\times DevRTT$'],
          ['快速重传', '不等超时提前恢复丢包', '3 个重复 ACK 触发'],
          ['流量控制', '发送方别淹没接收方', '$rwnd$，窗口 $= \\min(rwnd, cwnd)$'],
          ['拥塞控制', '别让网络过载', '$cwnd$、$ssthresh$、AIMD'],
          ['连接管理', '同步状态与序号', '三次握手、四次挥手、$2 \\times MSL$'],
        ],
      },
    ],
    background: [
      {
        type: 'list',
        items: [
          '为什么需要端口号？IP 地址只能定位主机，主机上同时运行多个进程，**没有端口号，数据就送不到正确的进程**。',
          '为什么需要校验和？物理噪声会翻转比特，**接收方必须能发现错误**。',
          '为什么 rdt 要一路演进？现实信道同时存在比特差错、丢包和乱序，**每类问题需要一类机制**：校验和检测差错，ACK/NAK 反馈，序号去重，定时器兜底。',
          '为什么停等不够用？1 Gbps 链路上利用率只有 0.027%，**必须流水线**。',
          '为什么 TCP 超时值要自适应？RTT 随排队波动，**固定超时要么过早、要么过晚**。',
          '为什么要三次握手？**两次握手挡不住“延迟的 SYN 报文”造成的半开连接**。',
          '为什么关闭要四次？TCP 是全双工，**两个方向各自独立关闭**。',
          '为什么要拥塞控制？发送方看不见网络，人人抢发会集体丢包，**AIMD 是分布式合作中简单而有效的折中**。',
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
          'GBN（后退 N 帧）：累积 ACK；接收方丢弃乱序分组；超时后重传窗口内全部未确认分组；序号空间 $\\ge N+1$。',
          'SR（选择重传）：逐个 ACK；接收方缓存乱序分组并按序交付；超时只重传丢失的分组；序号空间 $\\ge 2N$。',
          'TCP 可靠传输：单一重传定时器对最老未确认段计时；超时或 3 个重复 ACK 触发重传；累积 ACK。',
          '三次握手报文：SYN（$seq=x$）；SYN+ACK（$seq=y$，$ack=x+1$）；ACK（$ack=y+1$）。',
          '三次握手状态：客户端依次经过 CLOSED、SYN SENT、ESTAB；服务器依次经过 LISTEN、SYN RCVD、ESTAB。',
          '四次挥手：依次为 FIN、ACK、FIN、ACK；主动关闭方最后在 $\\text{TIME\\_WAIT}$ 中等 $2 \\times MSL$。',
          '拥塞控制：慢启动阶段 $cwnd$ 指数增长，转入拥塞避免后线性增长。',
          '超时：$cwnd=1$，回到慢启动。',
          '3 个重复 ACK：进入快恢复，$cwnd=ssthresh+3$。',
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
        caption: '停等协议利用率（1 Gbps 链路、15 ms 传播、8000 bit 分组）：仅约 0.027%',
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
          '初始 $EstimatedRTT = 100$ ms、$DevRTT = 10$ ms，样本 $SampleRTT = 120$ ms；',
          '$EstimatedRTT = 0.875 \\times 100 + 0.125 \\times 120 = 102.5$ ms；',
          '$DevRTT = 0.75 \\times 10 + 0.25 \\times 17.5 = 11.875$ ms；',
          '$TimeoutInterval = 102.5 + 4 \\times 11.875 = 150$ ms。',
        ],
        answer: '$TimeoutInterval = 150$ ms',
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
          '计算题：RTT 三项公式迭代计算；停等/流水线利用率；GBN/SR 窗口与序号空间约束（$2^k \\ge N+1$ 与 $2^k \\ge 2N$）；拥塞窗口 $cwnd$ 逐 RTT 演进；校验和计算（注意回卷进位）。',
          '辨析题：TCP vs UDP；流量控制 vs 拥塞控制；GBN vs SR；慢启动 vs 拥塞避免；快重传 vs 超时重传；UDP 2 元组 vs TCP 4 元组分用。',
          '简答题：为什么需要三次握手（两次握手的失败场景）；为什么 TIME_WAIT 要 $2 \\times MSL$；为什么 TCP 没有消息边界；rdt 演进每一步解决了什么问题。',
          '状态题：三次握手/四次挥手的状态序列；拥塞控制 FSM 的转移条件与动作。',
        ],
      },
      {
        type: 'callout',
        tone: 'exam',
        title: '考试提示',
        text: '计算题先写公式再代入，单位（ms、bit、字节、MSS）先统一再算。',
      },
    ],
    confusions: [
      {
        type: 'p',
        text: '易混点集中在成对的相似机制上，逐对辨析如下：',
      },
      {
        type: 'table',
        caption: '高频辨析表',
        headers: ['对比项', '第一方', '第二方', '关键区分点'],
        rows: [
          ['TCP vs UDP', '面向连接、可靠有序字节流、流量控制和拥塞控制、首部 20 字节', '无连接、不可靠、保留报文边界、首部 8 字节', '字节流 vs 数据报；有没有连接'],
          ['流量控制 vs 拥塞控制', '保护接收方，$rwnd$，端到端', '保护网络，$cwnd$，全局', '$\\min(rwnd, cwnd)$'],
          ['GBN vs SR', '丢弃乱序、累积 ACK、整段重传、序号 $\\ge N+1$', '缓存乱序、逐个 ACK、单个重传、序号 $\\ge 2N$', '接收方是否缓存乱序分组'],
          ['慢启动 vs 拥塞避免', '$cwnd < ssthresh$，指数增长', '$cwnd \\ge ssthresh$，线性增长', '每 RTT 翻倍 vs 每 RTT 增加 1 MSS'],
          ['超时重传 vs 快重传', '定时器超时，$cwnd$ 归 1', '3 重复 ACK，$cwnd = ssthresh+3$', '减半归一 vs 减半加三'],
          ['UDP 分用 vs TCP 分用', '目的 IP、目的端口（2 元组）', '源 IP、源端口、目的 IP、目的端口（4 元组）', 'UDP 不区分客户端'],
          ['$EstimatedRTT$ vs $SampleRTT$', '平滑估计值', '实测样本', '重传段不采样'],
        ],
      },
    ],
    misconceptions: [
      {
        type: 'p',
        text: '常见错误理解，逐条纠正：',
      },
      {
        type: 'list',
        items: [
          '❌ “网络层提供端到端可靠通信” → ✅ 网络层（IP）只提供尽力而为的数据报投递，可靠性由传输层（TCP）在端系统实现。',
          '❌ “TCP 确认号是已收到的字节数” → ✅ 确认号是**期望收到的下一个字节**的序号（即最后收到的字节序号加 1）。',
          '❌ “TCP 按报文段编号” → ✅ TCP 按**字节**编号；一个 1460 字节的段之后，下一个段的序号要加 $1460$。',
          '❌ “UDP 只按目的端口分用” → ✅ UDP 按**目的 IP + 目的端口（2 元组）**分用。',
          '❌ “GBN 接收方缓存乱序分组” → ✅ GBN 接收方**直接丢弃**乱序分组；缓存乱序的是 SR。',
          '❌ “超时与 3 个重复 ACK 后 $cwnd$ 一样” → ✅ 超时 $cwnd=1$ MSS 回慢启动；3 重复 ACK 时 $cwnd=ssthresh+3$ MSS 进快恢复。',
          '❌ “校验和能检测并纠正所有错误” → ✅ 校验和只能**检测**（且可能漏检），不能纠正。',
          '❌ “四次挥手必须四个报文” → ✅ 若服务器没有更多数据要发，ACK 与 FIN 可合并，此时为 3 个报文。',
          '❌ “慢启动很慢” → ✅ 名字有误导性：慢启动是**指数增长**（每 RTT 翻倍），是 $cwnd$ 增长最快的阶段。',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        title: '易错提醒',
        text: 'TCP 的序号与确认号按字节计，不按报文段计；做题时先确认题目给的是字节数还是段数。',
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
          '与第一章（导论）：TCP/UDP 是 1.2 节“网络边缘”服务的展开；时延四元组（1.4 节）中的排队时延正是拥塞的表现；分层与封装（1.5 节）定义了传输层 PDU（报文段）。',
          '与第二章（应用层）：应用按需求选传输协议（HTTP/FTP/SMTP 用 TCP，DNS/流媒体用 UDP）；套接字（2.7 节）是应用使用传输层服务的接口；端口号是分用的钥匙。',
          '与后续章节（网络层）：TCP 的拥塞控制依赖网络层丢包作为信号；网络层提供的尽力而为服务正是传输层要“增强”的对象；ECN（网络辅助拥塞控制）需要网络层配合。',
          '与后续章节（链路层）：校验和在链路层同样存在；rdt 原理在链路层（如 802.11 的 ARQ）同样适用——可靠传输是“跨层反复出现”的主题。',
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
          'rdt 演进口诀：“错加检（校验和），坏加反（ACK/NAK），乱加序（序号），丢加时（定时器）”。',
          '握手挥手口诀：“三握手四挥手，全双工才要分开走”。',
          '客户端状态依次为 CLOSED、SYN SENT、ESTAB、FIN_WAIT_1、FIN_WAIT_2、TIME_WAIT、CLOSED，对应口诀“关、发、建、等1、等2、时待、关”。',
          '拥塞控制口诀：“慢启动翻倍，避免加一；超时归一，三重复加三”。',
          '① 先默画 rdt 演进图（每一步的新机制与缺陷）。',
          '② 用 PPT 第 57 页 telnet 例子亲手算一遍 Seq 与 ACK。',
          '③ 用 100 ms、10 ms、120 ms 算一遍 RTT 三项公式。',
          '④ 画一张 GBN vs SR 对比表。',
          '⑤ 从 CLOSED 回到 CLOSED，完整走一遍连接生命周期（握手、传数据、挥手）。',
        ],
      },
    ],
    questionIds: [],
}
