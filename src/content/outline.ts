// ============================================================
// 章节大纲：全局唯一的稳定 ID 契约。
// 内容、题目、演示、比较表、覆盖清单、用户记录都引用这里的 ID。
// 新增 PPT 时只追加新 ID，禁止复用或重排旧 ID。
// ============================================================

export interface OutlinePoint {
  id: string
  title: string
  en?: string
  /** PPT 幻灯片编号（1-based） */
  slides: number[]
}

export interface OutlineSub {
  id: string
  title: string
  points: OutlinePoint[]
}

export interface OutlineSection {
  id: string
  title: string
  en?: string
  /** PPT 幻灯片编号（1-based），供覆盖统计使用 */
  slides?: number[]
  subs: OutlineSub[]
}

// ------------------------------------------------------------
// Chapter 1 — Introduction（对应 Chapter1.pptx，116 页）
// ------------------------------------------------------------
export const ch1Outline: OutlineSection[] = [
  {
    id: 's1.1', title: '1.1 什么是互联网', en: 'What is the Internet?',
    slides: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    subs: [
      {
        id: 's1.1.1', title: '互联网的构成',
        points: [
          { id: 'k1.1.1', title: '互联网的“网、机、线”组成', en: 'Nuts and Bolts View', slides: [4, 5, 6, 7] },
          { id: 'k1.1.2', title: 'RFC、IETF 与互联网标准', en: 'Internet Standards', slides: [8] },
          { id: 'k1.1.3', title: '互联网的服务视图', en: 'Service View', slides: [9] },
        ],
      },
      {
        id: 's1.1.2', title: '协议',
        points: [
          { id: 'k1.1.4', title: '什么是协议', en: 'What is a Protocol?', slides: [10, 11] },
        ],
      },
    ],
  },
  {
    id: 's1.2', title: '1.2 网络边缘', en: 'Network Edge',
    slides: [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36],
    subs: [
      {
        id: 's1.2.1', title: '端系统与应用通信方式',
        points: [
          { id: 'k1.2.1', title: '整体结构：边缘、核心与接入', en: 'Network Structure Overview', slides: [13, 14, 15] },
          { id: 'k1.2.2', title: '客户/服务器方式与 P2P 方式', en: 'Client-Server & P2P', slides: [16] },
          { id: 'k1.2.3', title: '面向连接服务 TCP', en: 'Connection-Oriented: TCP', slides: [17] },
          { id: 'k1.2.4', title: '无连接服务 UDP', en: 'Connectionless: UDP', slides: [18] },
        ],
      },
      {
        id: 's1.2.2', title: '接入网',
        points: [
          { id: 'k1.2.5', title: '接入网概述', en: 'Access Networks', slides: [19] },
          { id: 'k1.2.6', title: 'DSL 数字用户线', en: 'DSL', slides: [20] },
          { id: 'k1.2.7', title: 'HFC 混合光纤同轴电缆网', en: 'HFC / Cable Modem', slides: [21, 22, 23, 24, 25, 26] },
          { id: 'k1.2.8', title: '家庭网、企业网与数据中心', en: 'Home / Enterprise / Data Center', slides: [27, 28, 29] },
          { id: 'k1.2.9', title: '无线接入网：WLAN 与蜂窝', en: 'Wireless Access', slides: [30] },
        ],
      },
      {
        id: 's1.2.3', title: '物理介质',
        points: [
          { id: 'k1.2.10', title: '导向介质：双绞线、同轴、光纤', en: 'Guided Media', slides: [31, 32, 33, 34] },
          { id: 'k1.2.11', title: '非导向介质：无线电与卫星', en: 'Unguided Media', slides: [35, 36] },
        ],
      },
    ],
  },
  {
    id: 's1.3', title: '1.3 网络核心', en: 'Network Core',
    slides: [37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58],
    subs: [
      {
        id: 's1.3.1', title: '交换方式',
        points: [
          { id: 'k1.3.1', title: '电路交换', en: 'Circuit Switching', slides: [38, 39, 40, 41] },
          { id: 'k1.3.2', title: '分组交换与存储转发', en: 'Packet Switching & Store-and-Forward', slides: [42, 43, 47] },
          { id: 'k1.3.3', title: '报文分段与管道化传输', en: 'Message Segmenting', slides: [48] },
          { id: 'k1.3.4', title: '电路交换与分组交换对比', en: 'Packet vs Circuit', slides: [45, 46] },
        ],
      },
      {
        id: 's1.3.2', title: '转发、路由与网络分类',
        points: [
          { id: 'k1.3.5', title: '转发与路由', en: 'Forwarding & Routing', slides: [44] },
          { id: 'k1.3.6', title: '数据报网与虚电路网', en: 'Datagram vs Virtual Circuit', slides: [49, 50] },
        ],
      },
      {
        id: 's1.3.3', title: '互联网的结构',
        points: [
          { id: 'k1.3.7', title: '网络的网络：ISP 层次结构', en: 'Network of Networks', slides: [51, 52, 53, 54, 55, 56, 57, 58] },
        ],
      },
    ],
  },
  {
    id: 's1.4', title: '1.4 时延、丢包与吞吐量', en: 'Delay, Loss and Throughput',
    slides: [59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71],
    subs: [
      {
        id: 's1.4.1', title: '吞吐量',
        points: [
          { id: 'k1.4.1', title: '吞吐量与瓶颈链路', en: 'Throughput & Bottleneck Link', slides: [60, 61, 62] },
        ],
      },
      {
        id: 's1.4.2', title: '时延',
        points: [
          { id: 'k1.4.2', title: '四种时延：处理、排队、发送、传播', en: 'Nodal Delay', slides: [65, 66] },
          { id: 'k1.4.3', title: '车队类比：发送时延与传播时延', en: 'Caravan Analogy', slides: [63, 64] },
          { id: 'k1.4.4', title: '排队时延与流量强度', en: 'Queueing Delay & Traffic Intensity', slides: [68] },
          { id: 'k1.4.5', title: 'RTT 与 traceroute 测量', en: 'RTT & Traceroute', slides: [67, 69, 70] },
        ],
      },
      {
        id: 's1.4.3', title: '丢包',
        points: [
          { id: 'k1.4.6', title: '丢包', en: 'Packet Loss', slides: [71] },
        ],
      },
    ],
  },
  {
    id: 's1.5', title: '1.5 协议层次与服务模型', en: 'Protocol Layers, Service Models',
    slides: [72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100],
    subs: [
      {
        id: 's1.5.1', title: '为什么要分层',
        points: [
          { id: 'k1.5.1', title: '分层的动机与航空类比', en: 'Why Layering', slides: [73, 74, 75, 76, 77] },
          { id: 'k1.5.2', title: '网络协议三要素与体系结构', en: 'Syntax, Semantics, Timing', slides: [78, 79, 80, 81, 82, 83] },
          { id: 'k1.5.3', title: 'OSI 七层与 TCP/IP：两个国际标准', en: 'OSI vs TCP/IP', slides: [79, 84, 85, 98, 99, 100] },
        ],
      },
      {
        id: 's1.5.2', title: '五层模型与数据流动',
        points: [
          { id: 'k1.5.4', title: 'Internet 五层协议栈', en: 'Internet Protocol Stack', slides: [85] },
          { id: 'k1.5.5', title: '封装与解封装', en: 'Encapsulation', slides: [86, 87, 88, 89, 90, 91, 92, 96, 97] },
          { id: 'k1.5.6', title: '逻辑通信与实体', en: 'Logical Communication', slides: [93, 94, 95] },
        ],
      },
    ],
  },
  {
    id: 's1.6', title: '1.6 网络安全', en: 'Networks Under Attack',
    slides: [101, 102, 103, 104, 105, 106, 107, 108, 109],
    subs: [
      {
        id: 's1.6.1', title: '网络威胁',
        points: [
          { id: 'k1.6.1', title: '恶意软件：病毒、蠕虫、特洛伊木马', en: 'Malware', slides: [102, 103, 104] },
          { id: 'k1.6.2', title: '拒绝服务攻击 DoS/DDoS', en: 'Denial of Service', slides: [105] },
          { id: 'k1.6.3', title: '包嗅探、IP 欺骗与记录重放', en: 'Sniffing, Spoofing, Playback', slides: [106, 107, 108, 109] },
        ],
      },
    ],
  },
  {
    id: 's1.7', title: '1.7 互联网历史', en: 'History',
    slides: [110, 111, 112, 113, 114, 115, 116],
    subs: [
      {
        id: 's1.7.1', title: '发展脉络',
        points: [
          { id: 'k1.7.1', title: '从 ARPAnet 到商业化互联网', en: 'Internet History', slides: [111, 112, 113, 114, 115, 116] },
        ],
      },
    ],
  },
]

// ------------------------------------------------------------
// Chapter 2 — Application Layer（对应 Chapter2.pptx，124 页）
// ------------------------------------------------------------
export const ch2Outline: OutlineSection[] = [
  {
    id: 's2.1', title: '2.1 网络应用原理', en: 'Principles of Network Applications',
    slides: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
    subs: [
      {
        id: 's2.1.1', title: '应用体系结构',
        points: [
          { id: 'k2.1.1', title: '网络应用是如何构成的', en: 'Creating a Network App', slides: [4, 5, 6] },
          { id: 'k2.1.2', title: '客户-服务器、P2P 与混合架构', en: 'Application Architectures', slides: [8, 9, 10, 11, 12] },
        ],
      },
      {
        id: 's2.1.2', title: '进程通信与套接字',
        points: [
          { id: 'k2.1.3', title: '进程、套接字与端口', en: 'Processes & Sockets', slides: [13, 14, 15] },
          { id: 'k2.1.4', title: '应用层协议定义了什么', en: 'App-Layer Protocol Defines', slides: [16] },
        ],
      },
      {
        id: 's2.1.3', title: '传输服务需求',
        points: [
          { id: 'k2.1.5', title: '应用对传输服务的需求', en: 'Transport Service Needs', slides: [17, 18] },
          { id: 'k2.1.6', title: 'TCP 与 UDP 提供的服务', en: 'Internet Transport Services', slides: [19, 20, 21] },
        ],
      },
    ],
  },
  {
    id: 's2.2', title: '2.2 Web 与 HTTP', en: 'Web and HTTP',
    slides: [23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59],
    subs: [
      {
        id: 's2.2.1', title: 'HTTP 基础',
        points: [
          { id: 'k2.2.1', title: 'Web 页面、对象与 URL', en: 'Web Jargon', slides: [23] },
          { id: 'k2.2.2', title: 'HTTP 概览与无状态协议', en: 'HTTP Overview & Stateless', slides: [24, 25, 26, 27] },
          { id: 'k2.2.3', title: '非持续连接与持续连接', en: 'Non-persistent & Persistent HTTP', slides: [28, 29, 30, 32, 33] },
          { id: 'k2.2.4', title: '响应时间模型 2RTT+T', en: 'Response Time Modeling', slides: [31] },
        ],
      },
      {
        id: 's2.2.2', title: 'HTTP 报文',
        points: [
          { id: 'k2.2.5', title: 'HTTP 请求报文', en: 'Request Message', slides: [34, 35, 36, 37, 38, 39] },
          { id: 'k2.2.6', title: 'HTTP 响应报文与状态码', en: 'Response & Status Codes', slides: [40, 41, 42, 43] },
        ],
      },
      {
        id: 's2.2.3', title: '用户状态与缓存',
        points: [
          { id: 'k2.2.7', title: 'Cookie 与用户跟踪', en: 'Cookies', slides: [44, 45, 46, 47, 48, 49, 50, 51] },
          { id: 'k2.2.8', title: 'Web 缓存（代理服务器）', en: 'Web Caching', slides: [52, 53, 54, 55, 56, 57] },
          { id: 'k2.2.9', title: '条件 GET', en: 'Conditional GET', slides: [58] },
        ],
      },
    ],
  },
  {
    id: 's2.3', title: '2.3 FTP', en: 'File Transfer Protocol',
    slides: [60, 61, 62, 63],
    subs: [
      {
        id: 's2.3.1', title: '文件传输协议',
        points: [
          { id: 'k2.3.1', title: 'FTP：控制连接与数据连接', en: 'FTP', slides: [60, 61, 62] },
        ],
      },
    ],
  },
  {
    id: 's2.4', title: '2.4 电子邮件', en: 'Electronic Mail',
    slides: [64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78],
    subs: [
      {
        id: 's2.4.1', title: '邮件系统与 SMTP',
        points: [
          { id: 'k2.4.1', title: '电子邮件三大组件', en: 'Mail Components', slides: [64, 65, 66, 67] },
          { id: 'k2.4.2', title: 'SMTP 协议与工作过程', en: 'SMTP', slides: [68, 69, 70] },
          { id: 'k2.4.3', title: '报文格式与 MIME 扩展', en: 'RFC822 & MIME', slides: [71, 72, 73, 74] },
        ],
      },
      {
        id: 's2.4.2', title: '邮件访问协议',
        points: [
          { id: 'k2.4.4', title: 'POP3 与 IMAP', en: 'POP3 & IMAP', slides: [75, 76, 77] },
        ],
      },
    ],
  },
  {
    id: 's2.5', title: '2.5 DNS', en: 'Domain Name System',
    slides: [79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97],
    subs: [
      {
        id: 's2.5.1', title: 'DNS 概述与结构',
        points: [
          { id: 'k2.5.1', title: '为什么用分布式层次 DNS', en: 'Why Distributed DNS', slides: [79] },
          { id: 'k2.5.2', title: 'DNS 提供的服务', en: 'DNS Services', slides: [79] },
          { id: 'k2.5.3', title: '层次名称服务器：根、顶级域、权威', en: 'Hierarchical DNS', slides: [80, 81, 82, 83] },
          { id: 'k2.5.4', title: '本地名称服务器', en: 'Local Name Server', slides: [84, 88] },
        ],
      },
      {
        id: 's2.5.2', title: '查询机制与记录',
        points: [
          { id: 'k2.5.5', title: '迭代查询与递归查询', en: 'Iterated & Recursive Query', slides: [85, 90, 91, 92] },
          { id: 'k2.5.6', title: 'DNS 资源记录', en: 'DNS Records', slides: [86, 93] },
          { id: 'k2.5.7', title: 'DNS 报文格式', en: 'DNS Messages', slides: [87, 89] },
          { id: 'k2.5.8', title: '记录注册到 DNS', en: 'Inserting Records into DNS', slides: [94, 95] },
          { id: 'k2.5.9', title: 'DNS 攻击', en: 'Attacking DNS', slides: [96] },
        ],
      },
    ],
  },
  {
    id: 's2.6', title: '2.6 P2P 文件分发', en: 'P2P File Sharing',
    slides: [98, 99, 100, 101, 102, 103, 104, 105, 106, 107],
    subs: [
      {
        id: 's2.6.1', title: '文件分发模型',
        points: [
          { id: 'k2.6.1', title: 'C/S 与 P2P 分发时间对比', en: 'Distribution Time', slides: [99, 100, 101, 102] },
        ],
      },
      {
        id: 's2.6.2', title: 'BitTorrent',
        points: [
          { id: 'k2.6.2', title: 'BitTorrent：tracker、分块与 tit-for-tat', en: 'BitTorrent', slides: [98, 103, 104, 105, 106] },
        ],
      },
    ],
  },
  {
    id: 's2.7', title: '2.7/2.8 Socket 编程', en: 'Socket Programming',
    slides: [108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124],
    subs: [
      {
        id: 's2.7.1', title: 'TCP/UDP 套接字',
        points: [
          { id: 'k2.7.1', title: 'Socket API 概念', en: 'Socket API', slides: [108, 109] },
          { id: 'k2.7.2', title: 'TCP 套接字编程', en: 'TCP Sockets', slides: [110, 111, 112, 113, 114, 115, 116] },
          { id: 'k2.7.3', title: 'UDP 套接字编程', en: 'UDP Sockets', slides: [118, 119, 120, 121, 122] },
          { id: 'k2.7.4', title: '构建简单 Web 服务器', en: 'Simple Web Server', slides: [123] },
        ],
      },
    ],
  },
]

// ------------------------------------------------------------
// Chapter 3 — Transport Layer（对应 Chapter3.pptx，107 页）
// ------------------------------------------------------------
export const ch3Outline: OutlineSection[] = [
  {
    id: 's3.1', title: '3.1 传输层服务', en: 'Transport-Layer Services',
    slides: [2, 3, 4, 5, 6, 7],
    subs: [
      {
        id: 's3.1.1', title: '服务与协议',
        points: [
          { id: 'k3.1.1', title: '传输层服务概览', en: 'Transport Services', slides: [4, 6] },
          { id: 'k3.1.2', title: '传输层 vs 网络层', en: 'Transport vs Network Layer', slides: [5] },
        ],
      },
    ],
  },
  {
    id: 's3.2', title: '3.2 复用与分用', en: 'Multiplexing & Demultiplexing',
    slides: [8, 9, 10, 11, 12, 13, 14, 15],
    subs: [
      {
        id: 's3.2.1', title: '分用机制',
        points: [
          { id: 'k3.2.1', title: '复用与分用的概念', en: 'Mux & Demux', slides: [8] },
          { id: 'k3.2.2', title: '分用如何工作：数据报与套接字', en: 'How Demux Works', slides: [9] },
          { id: 'k3.2.3', title: '无连接分用（UDP）', en: 'Connectionless Demux', slides: [10, 11] },
          { id: 'k3.2.4', title: '面向连接分用（TCP 四元组）', en: 'Connection-Oriented Demux', slides: [12, 13, 14] },
        ],
      },
    ],
  },
  {
    id: 's3.3', title: '3.3 UDP', en: 'Connectionless Transport: UDP',
    slides: [16, 17, 18, 19, 20],
    subs: [
      {
        id: 's3.3.1', title: 'UDP 与校验和',
        points: [
          { id: 'k3.3.1', title: 'UDP 概览：为什么存在 UDP', en: 'UDP Overview', slides: [16, 17] },
          { id: 'k3.3.2', title: 'UDP 首部结构', en: 'UDP Segment Header', slides: [17] },
          { id: 'k3.3.3', title: '因特网校验和', en: 'Internet Checksum', slides: [18, 19] },
        ],
      },
    ],
  },
  {
    id: 's3.4', title: '3.4 可靠数据传输原理', en: 'Principles of Reliable Data Transfer',
    slides: [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53],
    subs: [
      {
        id: 's3.4.1', title: 'RDT 问题设定与逐步协议',
        points: [
          { id: 'k3.4.1', title: 'RDT 复杂性与抽象', en: 'RDT Getting Started', slides: [21, 22, 23] },
          { id: 'k3.4.2', title: 'rdt1.0/2.0/2.1/2.2：差错检测与重传', en: 'RDT 0-2.x', slides: [24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34] },
          { id: 'k3.4.3', title: 'rdt3.0：处理丢包与定时器', en: 'RDT 3.0', slides: [35, 36, 37, 38] },
          { id: 'k3.4.4', title: 'rdt3.0 性能与停等', en: 'RDT 3.0 Performance', slides: [39, 40] },
        ],
      },
      {
        id: 's3.4.2', title: '流水线协议',
        points: [
          { id: 'k3.4.5', title: '流水线思想', en: 'Pipelining', slides: [41, 42, 43] },
          { id: 'k3.4.6', title: '后退 N 帧协议 GBN', en: 'Go-Back-N', slides: [44, 45, 46, 47] },
          { id: 'k3.4.7', title: '选择重传协议 SR', en: 'Selective Repeat', slides: [48, 49, 50, 51, 52] },
        ],
      },
    ],
  },
  {
    id: 's3.5', title: '3.5 TCP', en: 'Connection-Oriented Transport: TCP',
    slides: [54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79, 80, 81, 82],
    subs: [
      {
        id: 's3.5.1', title: '报文与序号确认',
        points: [
          { id: 'k3.5.1', title: 'TCP 概览', en: 'TCP Overview', slides: [54] },
          { id: 'k3.5.2', title: 'TCP 报文段结构', en: 'Segment Structure', slides: [55] },
          { id: 'k3.5.3', title: '序号与确认号（字节流编号）', en: 'Seq Numbers & ACKs', slides: [56, 57] },
        ],
      },
      {
        id: 's3.5.2', title: 'RTT 与超时',
        points: [
          { id: 'k3.5.4', title: 'RTT 估计与超时重传时间', en: 'RTT & Timeout', slides: [58, 59, 60] },
        ],
      },
      {
        id: 's3.5.3', title: '可靠传输机制',
        points: [
          { id: 'k3.5.5', title: 'TCP 可靠数据传输（简化发送方）', en: 'Reliable Transfer', slides: [62, 63, 64, 65, 66, 67] },
          { id: 'k3.5.6', title: 'ACK 生成策略', en: 'ACK Generation', slides: [68] },
          { id: 'k3.5.7', title: '快速重传', en: 'Fast Retransmit', slides: [69, 70, 71] },
        ],
      },
      {
        id: 's3.5.4', title: '流量控制',
        points: [
          { id: 'k3.5.8', title: 'TCP 流量控制与 rwnd', en: 'Flow Control', slides: [73, 74] },
        ],
      },
      {
        id: 's3.5.5', title: '连接管理',
        points: [
          { id: 'k3.5.9', title: '两次握手为什么失败', en: '2-Way Handshake Failure', slides: [77] },
          { id: 'k3.5.10', title: 'TCP 三次握手', en: '3-Way Handshake', slides: [76, 78, 79] },
          { id: 'k3.5.11', title: 'TCP 四次挥手释放连接', en: 'Closing a Connection', slides: [80, 81] },
        ],
      },
    ],
  },
  {
    id: 's3.6', title: '3.6 拥塞控制原理', en: 'Principles of Congestion Control',
    slides: [83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97],
    subs: [
      {
        id: 's3.6.1', title: '拥塞成因与方法',
        points: [
          { id: 'k3.6.1', title: '拥塞：成因与代价', en: 'Congestion: Causes & Costs', slides: [83, 84, 85, 86, 87, 88, 89, 90, 91, 92] },
          { id: 'k3.6.2', title: '端系统方法与网络辅助方法', en: 'Approaches', slides: [93] },
          { id: 'k3.6.3', title: '案例：ATM ABR 拥塞控制', en: 'ATM ABR Case Study', slides: [94, 95, 96, 97] },
        ],
      },
    ],
  },
  {
    id: 's3.7', title: '3.7 TCP 拥塞控制', en: 'TCP Congestion Control',
    slides: [98, 99, 100, 101, 102, 103, 104, 105, 106, 107],
    subs: [
      {
        id: 's3.7.1', title: 'AIMD 与四个阶段',
        points: [
          { id: 'k3.7.1', title: 'TCP 带宽探测：加法增大与乘法减小', en: 'Bandwidth Probing AIMD', slides: [98, 99] },
          { id: 'k3.7.2', title: '拥塞窗口机制全貌', en: 'Mechanism Details', slides: [100, 101, 102, 103] },
          { id: 'k3.7.3', title: 'TCP 拥塞控制 FSM', en: 'FSM', slides: [104, 106] },
          { id: 'k3.7.4', title: '流行 TCP 变体', en: 'TCP Flavors', slides: [105] },
        ],
      },
    ],
  },
]

export const chapterOutlines: Record<string, OutlineSection[]> = {
  ch1: ch1Outline,
  ch2: ch2Outline,
  ch3: ch3Outline,
}

/** 全部大纲知识点的扁平列表（供搜索、覆盖统计使用） */
export function flattenOutline(sections: OutlineSection[]) {
  const out: OutlinePoint[] = []
  for (const s of sections) for (const sub of s.subs) out.push(...sub.points)
  return out
}
