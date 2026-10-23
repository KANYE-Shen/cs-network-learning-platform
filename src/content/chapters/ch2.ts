// ============================================================
// 第二章 应用层（Application Layer）—— 课程内容数据
// 对应 PPT：Chapter2.pptx（124 页）
// 所有 ID 契约见 src/content/outline.ts（ch2Outline）
// ============================================================
import type { Chapter } from '../../types/content'

export const ch2: Chapter = {
  id: 'ch2',
  order: 2,
  title: '第二章 应用层',
  en: 'Application Layer',
  pptFile: 'Chapter2.pptx',
  intro:
    '应用层是 OSI 参考模型与 TCP/IP 五层模型的最高层，直接面对用户，是“网络能做什么”的最终体现。' +
    '本章从应用体系结构出发，依次讲解 Web 与 HTTP、FTP、电子邮件（SMTP/POP3/IMAP）、DNS、P2P 文件分发，' +
    '最后落到 Socket 编程。核心线索是：应用层协议规定“消息长什么样、什么时候发、怎么响应”，' +
    '而可靠性、时延、带宽等服务质量需求则交由传输层（TCP/UDP）来保障或牺牲。' +
    '本章的学习目标（PPT 第 3 页）有四：① 理解网络应用协议的概念与实现；' +
    '② 掌握传输层的服务模型；③ 掌握客户-服务器范式与对等（P2P）范式；' +
    '④ 通过剖析 HTTP、FTP、SMTP/POP3/IMAP、DNS 等真实协议来学习协议是如何设计的，' +
    '并最终能够使用套接字 API 编写网络应用。',
  sections: [
    // ==========================================================
    // 2.1 网络应用原理
    // ==========================================================
    {
      id: 's2.1',
      title: '2.1 网络应用原理',
      en: 'Principles of Network Applications',
      subsections: [
        {
          id: 's2.1.1',
          title: '应用体系结构',
          knowledge: [
            {
              id: 'k2.1.1',
              title: '网络应用是如何构成的',
              en: 'Creating a Network App',
              summary:
                '应用层软件只运行在端系统上，网络核心不运行用户应用；开发网络应用 = 编写在不同端系统上运行、通过网络通信的程序。',
              tags: ['应用层', '端系统', '分层'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [4, 5, 6] },
                { kind: 'supplement', note: '补充：端系统与网络核心的职责划分，参见第一章 s1.1.1「网、机、线」' },
              ],
              insight: {
                why:
                  '为什么应用层不需要（也不能）让网络核心参与？如果每种新应用都要改造路由器、交换机，那么应用创新将被彻底扼杀。' +
                  '互联网之所以能快速演化出 Web、邮件、P2P 等大量新应用，根本原因在于端系统与网络核心之间有清晰的功能分界。',
                coreIdea:
                  '把“通信功能”封装在端系统内部的应用层进程里，网络核心只负责“搬运比特”。' +
                  '应用开发者只需面对两个接口：本地进程之间的 IPC（进程间通信），以及跨主机的套接字（Socket）。',
                mechanism:
                  '一次典型通信要跨越五层协议栈：发送方应用按序向下调用 transport → network → link → physical，' +
                  '每一层加上自己的首部；接收方反向解封装，最终把字节交给应用。应用层报文在网络中以“分组”为单位传输，' +
                  '但对应用开发者而言，抽象是“消息（message）”。',
                comparison:
                  '与传统的 OSI 模型相比，互联网把 OSI 的会话层与表示层合并进应用层；' +
                  '与“核心网络（core network）”相比，端系统承担了更多的智能（TCP 端到端拥塞控制等），' +
                  '这正是“端到端原则（end-to-end argument）”的体现。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '网络应用（network application）是运行在端系统（end system，又称主机 host）上的软件程序，' +
                    '它通过在网络中交换消息（message）来互相通信。典型例子：Web 服务器软件与浏览器软件之间的对话；' +
                    '邮件用户代理与邮件服务器之间的对话；BitTorrent 客户端之间直接交换文件分块。',
                },
                { type: 'term', zh: '端系统', en: 'end system', abbr: 'host', def: '运行应用程序的主机，例如 PC、手机、服务器。互联网的通信端点都位于端系统上。' },
                { type: 'term', zh: '进程间通信', en: 'inter-process communication', abbr: 'IPC', def: '同一主机上两个进程之间的通信机制，由操作系统（OS）定义并实现。' },
                {
                  type: 'p',
                  text:
                    '关键在于：同一主机内的两个进程通过操作系统定义的 IPC 通信；' +
                    '而不同主机上的两个进程，则只能通过在网络中交换消息来通信。' +
                    '后一种跨主机通信，正是本章要讨论的核心问题。',
                },
                { type: 'h', text: '常见网络应用一览（PPT 第 4 页）' },
                {
                  type: 'list',
                  items: [
                    '电子邮件（E-mail）',
                    '万维网（Web）',
                    '即时消息（Instant messaging）',
                    '远程登录（Remote login）',
                    'P2P 文件共享（P2P file sharing）',
                    '多人网络游戏（Multi-user network games）',
                    '流式点播视频（Streaming stored video clips）',
                    '互联网电话（Internet telephony）',
                    '实时视频会议（Real-time video conference）',
                    '大规模并行计算（Massive parallel computing）',
                  ],
                },
                {
                  type: 'p',
                  text:
                    '这十类应用在可靠性、时延、带宽需求上差异巨大：有的要求 100% 可靠传输（文件传输、Web 事务），' +
                    '有的却能容忍少量丢失（实时音视频）；有的必须低时延（互联网电话、交互式游戏），' +
                    '有的可以慢慢传（邮件、点播视频）。正因为需求异质，传输层才必须提供两种截然不同的服务模型。',
                },
                { type: 'h', text: '应用层在协议栈中的位置（PPT 第 6 页）' },
                {
                  type: 'p',
                  text:
                    '应用程序只使用它所在端系统上的协议栈。发送方与接收方的应用层、传输层、网络层、数据链路层、物理层' +
                    '一一对应，中间经过的网络核心设备（路由器、交换机）只实现到网络层（数据链路层）为止，' +
                    '**网络核心设备不运行用户应用程序**。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么这样划分',
                  text:
                    '把应用功能限制在端系统，有两个巨大好处：一是应用创新与传播极快——' +
                    '写好一个程序装到 PC/手机上就能全球使用，无需等待任何运营商升级网络；' +
                    '二是网络核心简单——路由器只做转发，不必理解 Web、邮件等语义，可扩展性极强。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点',
                  text:
                    '“网络核心不运行用户应用”是本章开篇的常考点。路由器运行的是网络层协议（IP），' +
                    '交换机运行的是数据链路层协议；一旦某个应用需要网络核心理解其语义，' +
                    '就会破坏分层、阻碍创新。',
                },
                {
                  type: 'kv',
                  title: '两种进程间通信场景',
                  items: [
                    { k: '同一主机', v: '进程 A ↔ 进程 B：由操作系统定义的 IPC 通信，不经过网络' },
                    { k: '不同主机', v: '进程 A ↔ 进程 B：只能通过网络交换消息，需要应用层协议定义消息格式' },
                    { k: '网络核心', v: '只实现到网络层（数据链路层），不运行任何用户应用' },
                  ],
                },
                {
                  type: 'p',
                  text:
                    '由此引出本章的核心命题：**应用层协议**就是不同主机上的进程之间约定的一套装信规则。' +
                    '它规定消息的类型、语法、语义，以及何时发送、如何响应。' +
                    '本章将依次考察 HTTP、FTP、SMTP、DNS 这些真实世界的应用层协议，' +
                    '并用 Socket 编程把“协议”变成可以运行的代码。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.1.3',
                  label: '相关：进程、套接字与端口',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.1.6',
                  label: '相关：TCP 与 UDP 提供的服务',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.1.3', 'k2.1.6', 'k2.1.2'],
            },
            {
              id: 'k2.1.2',
              title: '客户-服务器、P2P 与混合架构',
              en: 'Application Architectures',
              summary:
                '三大应用架构：客户-服务器（服务器 always-on + 永久 IP，客户端间歇连接 + 动态 IP）、纯 P2P（自扩展、管理复杂）、混合架构（Skype、即时消息）。',
              tags: ['客户-服务器', 'P2P', '混合架构', '数据中心'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [8, 9, 10, 11, 12] },
                { kind: 'supplement', note: '补充：Google 数据中心成本数据来自 2007 年前后公开报道' },
              ],
              insight: {
                why:
                  '为什么应用架构值得单独讨论？因为它决定了系统扩展性、成本与可靠性的基本形态。' +
                  '集中式服务器易管理但受限于单点容量；纯 P2P 免服务器但难以管控与保证服务质量；' +
                  '混合架构则在“集中控制”与“分布传输”之间取折中，是当今互联网的主流形态。',
                coreIdea:
                  '区分“架构”的关键在于：服务由谁提供、谁保持状态、瓶颈在哪。' +
                  '客户-服务器的瓶颈在服务器与接入链路；P2P 的瓶颈在“下载最慢的那个对等端”。',
                mechanism:
                  '客户-服务器架构中，服务器是 always-on host，拥有永久 IP 地址，通过“服务器农场（server farm）”横向扩展；' +
                  '客户端之间互不直接通信。P2P 架构中任意端系统可直接互相通信，' +
                  '新加入的对等端既带来新的服务能力也带来新的服务需求，因而系统规模可自扩展，' +
                  '但对等端间歇在线且 IP 动态变化，导致管理复杂。',
                comparison:
                  '混合架构用“中心服务器做索引/信令、端到端直接传输数据”的方式同时获得两者的优点：' +
                  'Skype 用中心服务器查找对方地址，但语音数据直连；即时消息中两用户聊天本身是 P2P，' +
                  '而“在线状态检测与地址查询”由中心服务器完成。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '应用体系结构（application architecture）指应用程序设计上的客户-服务器（client-server）、' +
                    '对等（peer-to-peer, P2P）以及二者混合三种形态。判断一个应用属于哪种架构，' +
                    '要看“服务由谁提供、状态由谁维护”，而不是看有没有服务器参与。',
                },
                { type: 'h', text: '一、客户-服务器架构（PPT 第 9 页）' },
                {
                  type: 'table',
                  caption: '客户-服务器架构中服务器与客户端的对照',
                  headers: ['角色', '特征'],
                  rows: [
                    ['服务器 server', 'always-on host（always-on 主机，始终开机在线）；拥有 permanent IP address（永久 IP 地址）；通过 server farms（服务器农场）实现规模化扩展'],
                    ['客户端 client', '与服务器通信；可能是 intermittently connected（间歇性连接）；可能是 dynamic IP addresses（动态 IP 地址）；客户端之间不直接通信'],
                  ],
                },
                {
                  type: 'p',
                  text:
                    '注意“服务器农场”不是“单个大机器”，而是由大量廉价机器组成的机群，' +
                    '前面挂一个负载均衡器（load balancer）分发请求。' +
                    '这正是 Google 等大型互联网公司的基础设施形态。',
                },
                { type: 'h', text: '二、Google 数据中心的规模（PPT 第 10 页）' },
                {
                  type: 'kv',
                  title: '数据中心成本与能耗',
                  items: [
                    { k: '单个数据中心估算成本', v: '约 6 亿美元（$600M）' },
                    { k: '2007 年新建数据中心总投入', v: '约 24 亿美元（$2.4B）' },
                    { k: '单个数据中心功率', v: '50 ~ 100 兆瓦（MW）' },
                  ],
                },
                {
                  type: 'p',
                  text:
                    '这组数字说明了什么？数据中心是极其昂贵的能源密集型基础设施。' +
                    '50~100 MW 的功率量级相当于一座中型工厂的用电规模；' +
                    '而“单个数据中心 6 亿美元、2007 年一年花 24 亿美元”意味着**只有像 Google 这样有巨额流量的公司才养得起服务器农场**。' +
                    '这正是 P2P 架构出现的经济动因：用用户自己的带宽与存储换取分发能力。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点',
                  text:
                    '服务器农场（server farm）的存在是为了解决“单台服务器的性能与可靠性上限”问题。' +
                    '答题时要分清三组概念：always-on host 是“始终在线的服务器”；' +
                    'permanent IP address 是“服务器有固定 IP，客户端动态 IP”；' +
                    'server farm 是“成百上千台服务器横向扩展”。',
                },
                { type: 'h', text: '三、纯 P2P 架构（PPT 第 11 页）' },
                {
                  type: 'list',
                  items: [
                    '没有 always-on server（不需要始终在线的服务器）',
                    '任意端系统直接互相通信（arbitrary end systems directly communicate）',
                    '对等端（peer）向别的对等端请求服务，同时也向别的对等端提供服务',
                    '自扩展性（self scalability）：新加入的对等端既带来新的服务能力，也带来新的服务需求',
                    '对等端间歇性在线，并且 IP 地址会变化',
                    '管理复杂（complex management）',
                  ],
                },
                {
                  type: 'p',
                  text:
                    'P2P 的关键洞察是：**服务需求与服务能力同步增长**。' +
                    '在客户-服务器模型中，N 个用户意味着服务器要承担 N 倍负载，服务器必须无限扩容；' +
                    '在 P2P 模型中，这 N 个用户各自贡献了一条上行链路，' +
                    '系统总容量随用户数自动增长，理论上可无限扩展。' +
                    '代价是对等端不可控：可能随时离线、可能地址变化、可能只下载不上传（free-rider 问题）。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：P2P 不是“无服务器”',
                  text:
                    '纯 P2P 架构中确实没有 always-on server，但现实中的 P2P 应用（BitTorrent）' +
                    '通常仍依赖一个 **tracker（跟踪服务器）**来交换对等端信息——' +
                    '它是“辅助的、临时的”，不是提供核心服务的中心服务器，因此不破坏 P2P 的自扩展特性。',
                },
                { type: 'h', text: '四、混合架构（PPT 第 12 页）' },
                {
                  type: 'p',
                  text:
                    '混合架构（hybrid of client-server and P2P）的思想是：' +
                    '**把“查找/协商”这类全局性的小数据交给中心服务器，把“大数据传输”交给端到端直连**。' +
                    '这样既避免了纯 P2P 的“找不到人”，又避免了纯 C/S 的“服务器带宽瓶颈”。',
                },
                {
                  type: 'table',
                  caption: 'Skype 与即时消息的混合架构',
                  headers: ['应用', '中心服务器负责', '端到端直连负责'],
                  rows: [
                    ['Skype（VoIP）', '查找远端对方的地址（finding address of remote party）', '客户端—客户端直接建立语音连接（不经过服务器）'],
                    ['即时消息', '客户端在线状态检测与位置服务（presence detection / location）；用户上线时向中心服务器登记自己的 IP 地址；联系中心服务器以查找好友（buddies）的 IP 地址', '两个用户之间的聊天本身是 P2P'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text:
                    '混合架构 = “中心服务器当_DIRECTORY_（黄页），数据走 P2P 高速公路”。' +
                    'Skype 的中心服务器只负责“拨号”，语音包走点对点；' +
                    '即时消息的中心服务器只负责“登记本子”，聊天内容点对点传递。',
                },
                {
                  type: 'p',
                  text:
                    '从这两个例子可以看出一个通用模式：**中心服务器承担轻量级的全局协调（目录、索引、认证、地址映射），' +
                    '端系统之间承担重量级的数据传输**。这一模式在今天的 CDN、WebRTC、网状 VPN 中依然广泛使用。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.6.2',
                  label: '相关：BitTorrent 与 tracker',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.1.6',
                  label: '相关：TCP 与 UDP 提供的服务',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.1.1', 'k2.6.2', 'k2.6.1'],
            },
          ],
        },
        {
          id: 's2.1.2',
          title: '进程通信与套接字',
          knowledge: [
            {
              id: 'k2.1.3',
              title: '进程、套接字与端口',
              en: 'Processes & Sockets',
              summary:
                '进程是主机上运行的程序；套接字类比“门”，进程从门里收发消息；仅有 32 位 IP 地址不够定位进程，还需端口号（HTTP 80、邮件 25）。',
              tags: ['进程', '套接字', '端口号', '多路复用'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [13, 14, 15] },
                { kind: 'supplement', note: '补充：端口号的完整分配见 IANA，知名端口 0-1023' },
              ],
              insight: {
                why:
                  '为什么需要端口号？因为一个主机上通常同时运行着几十上百个进程，' +
                  '都拥有同一个 32 位 IP 地址。如果只靠 IP 地址寻址，数据包到达后主机无法判断该交给哪个进程。' +
                  '端口号提供了主机内的第二级寻址，使“IP 地址 + 端口号”成为进程的全局唯一标识。',
                coreIdea:
                  '套接字（socket）是应用进程与传输层之间的一扇“门”：进程把消息推出门，' +
                  '传输层基础设施负责把消息送到对端进程的门前；接收进程再从门里取消息。' +
                  '门（端口号）由操作系统控制，而门里的缓冲区与状态变量由应用开发者控制。',
                mechanism:
                  '主机收到一个 IP 分组后，先按 IP 地址找到主机，再按端口号（传输层首部）' +
                  '做多路分用（demultiplexing），把数据交给绑定了该端口的套接字。' +
                  '源 IP + 源端口 + 目的 IP + 目的端口一起构成四元组，可唯一标识一条 TCP 连接。',
                comparison:
                  '与 IPC 相比，套接字的独特之处在于它可以跨主机，且屏蔽了底层网络细节；' +
                  '与“直接操作网卡”相比，套接字提供了可靠/不可靠、有序/无序等不同服务类型的选择。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '进程（process）是运行在主机中的程序实例。进程之间要通信只有两种情形：' +
                    '同一主机上的两个进程通过操作系统定义的进程间通信（IPC）通信；' +
                    '不同主机上的两个进程通过在网络中交换消息（message）通信。',
                },
                {
                  type: 'list',
                  items: [
                    '客户进程（client process）：发起通信的进程',
                    '服务器进程（server process）：等待被联系的进程',
                    '关键提醒：P2P 架构的应用**同时**具有客户进程和服务器进程——Alice 给 Bob 传文件时，Alice 既是客户也是服务器',
                  ],
                },
                { type: 'h', text: '套接字：一扇“门”（PPT 第 14 页）' },
                {
                  type: 'p',
                  text:
                    '套接字是应用进程与其所在主机上传输层之间的接口。PPT 用“门（door）”作类比：' +
                    '发送进程把消息从门里塞出去，依靠“门另一侧的传输基础设施”把消息送到接收进程的门前；' +
                    '接收进程再从自己的门里把消息取出来。应用开发者永远不需要关心数据在网络上的具体路径。',
                },
                { type: 'h', text: '如何唯一地标识一个进程？（PPT 第 15 页）' },
                {
                  type: 'p',
                  text:
                    '一个主机拥有唯一的 32 位 IP 地址。问题来了：**仅凭主机 IP 地址，够不够标识其上的进程？**' +
                    '答案是 **No**——同一主机上可以同时运行许多进程，每个进程都需要一个标识符。' +
                    '因此进程的标识符必须同时包含**主机 IP 地址**与**该主机上与进程关联的端口号（port number）**。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点：IP 地址不够，还要端口号',
                  text:
                    '这是本章最经典的判断题：' +
                    '“因为每台主机都有唯一的 IP 地址，所以 IP 地址足以标识一个进程。”——**错误**。' +
                    '正确表述是：进程标识 = IP 地址 + 端口号；' +
                    '对 TCP 连接而言还应加上源端口与源 IP，构成四元组' +
                    '（源 IP、源端口、目的 IP、目的端口）才唯一标识一条连接。',
                },
                {
                  type: 'table',
                  caption: '常见应用层服务使用的端口号',
                  headers: ['服务', '端口号', '协议'],
                  rows: [
                    ['HTTP 服务器', '80', 'TCP'],
                    ['邮件服务器（SMTP 收/发）', '25', 'TCP'],
                    ['FTP 控制连接', '21', 'TCP'],
                    ['FTP 数据连接', '20', 'TCP'],
                    ['DNS 服务器', '53', 'UDP 为主，TCP 用于区域传送/大响应'],
                  ],
                },
                {
                  type: 'p',
                  text:
                    '端口号是一个 16 位无符号整数，取值 0~65535。' +
                    '0~1023 为“知名端口（well-known ports）”，需要特权才能绑定，' +
                    'HTTP(80)、SMTP(25)、FTP(21) 都属于这一类；' +
                    '1024~49151 为注册端口；49152~65535 为动态/私有端口，通常由客户端临时分配。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text:
                    '知名端口顺口溜：**HTTP 八十，邮件二五，FTP 二十一控、二十传数据**。' +
                    '“八十、二十五、二十一、二十”在选择题里经常以数字形式出现。',
                },
                {
                  type: 'p',
                  text:
                    '回到“门”的比喻：主机上每个套接字占据一扇门，门牌号就是端口号；' +
                    '网络核心的路由器把分组按 IP 地址送到主机，主机操作系统再按端口号分派给对应的门。' +
                    '这一“按端口分派”的动作在传输层被称为**分用（demultiplexing）**，' +
                    '将在第三章 s3.2 详细展开。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.1.4',
                  label: '相关：应用层协议定义了什么',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.7.1',
                  label: '相关：Socket API 概念',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.1.4', 'k2.7.1', 'k3.2.2'],
            },
            {
              id: 'k2.1.4',
              title: '应用层协议定义了什么',
              en: 'App-Layer Protocol Defines',
              summary:
                '应用层协议规定消息类型、语法、语义与发送/响应规则；公开协议由 RFC 定义（HTTP、SMTP），私有协议如 Skype、PPStream。',
              tags: ['应用层协议', 'RFC', '语法', '语义', '互操作'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [16] },
                { kind: 'external', label: 'RFC 9110: HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110' },
              ],
              insight: {
                why:
                  '为什么需要把应用层协议“标准化”？因为跨主机的通信必须有一份双方都认可的“合同”。' +
                  '若每个厂商自定义一套消息格式，互联网就会退化成一个互不连通的网络。' +
                  '标准化的直接收益是**互操作性（interoperability）**。',
                coreIdea:
                  '一份应用层协议本质上规定四件事：交换哪些类型的消息、每种消息的语法（有哪些字段、如何分隔）、' +
                  '字段的语义（每个字段的含义）、以及发送与响应的规则（何时发、收到后怎么办）。' +
                  '这四件事恰好对应“语法—语义—时序”的协议三要素。',
                mechanism:
                  '协议既可以是公开的（由 RFC 定义，如 HTTP、SMTP、DNS），' +
                  '也可以是专有的（proprietary，如 Skype 早期协议、PPStream）。' +
                  '公开协议允许第三方实现（如 Apache、Nginx、curl 都是 HTTP 的实现），' +
                  '从而形成生态；专有协议则封闭但可以快速迭代。',
                comparison:
                  'RFC 不是“法律”，而是自愿遵守的技术文档；实践中 RFC 分为 Internet Standard、' +
                  'Proposed Standard、Informational 等成熟度级别。' +
                  '相比之下，私有协议无法被第三方独立实现，除非厂商开放 SDK。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '应用层协议是不同主机上的进程之间通信的“语法与语义约定”。' +
                    '一份完整的应用层协议必须规定以下四件事（对应 PPT 第 16 页的四条）：',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '交换的消息类型（types of messages exchanged）——例如请求报文与响应报文',
                    '消息类型的语法（syntax）——有哪些字段、字段之间如何界定',
                    '字段的语义（semantics）——各字段所承载信息的含义',
                    '进程何时发送消息、如何响应消息的规则（rules for when and how processes send & respond to messages）',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么这四条缺一不可',
                  text:
                    '只规定“消息类型”而不规定语法，接收方无法解析；' +
                    '只规定语法而不规定语义，双方对同一字段的理解不同；' +
                    '只规定语义而不规定时序规则，就会出现“客户端发出请求后不知道该等多久、' +
                    '重传几次、何时放弃”的问题。' +
                    '这四条合起来，正是第一章讲过的协议三要素（syntax、semantics、timing）在应用层的具体化。',
                },
                { type: 'h', text: '公开协议 vs 专有协议' },
                {
                  type: 'table',
                  headers: ['类别', '定义方式', '代表', '优点', '代价'],
                  rows: [
                    ['公开领域协议（public-domain）', '由 RFC 定义，如 HTTP、SMTP、DNS、FTP', 'HTTP / SMTP / FTP / DNS', '保证互操作性，第三方可独立实现，易形成生态', '变更需谨慎，兼容旧版本有包袱'],
                    ['专有协议（proprietary）', '厂商自行定义，不公开或不完整公开', 'Skype（早期）、PPStream', '可快速演进，贴合业务；可通过 SDK 授权第三方', '第三方实现受限，协议细节可能成为商业壁垒'],
                  ],
                },
                {
                  type: 'p',
                  text:
                    '需要注意的是，“公开”不等于“免费”：RFC 文档公开，协议背后可能仍有专利或商标；' +
                    '例如历史上 WebSocket 的专利纠纷。因此现代协议大量采用“开放标准 + 开放实现 + 专利许可”的组合。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点',
                  text:
                    '常考形式：给出一个协议，问它定义了哪些内容。' +
                    '标准答案是上面四条（消息类型 / 语法 / 语义 / 发送响应规则）。' +
                    '答题时如果漏掉“语义”或漏掉“规则”，都会扣分——' +
                    '因为语法只解决“怎么读懂”，语义解决“读懂后怎么做”，规则解决“什么时候做”。',
                },
                {
                  type: 'p',
                  text:
                    '接下来本章用四个真实协议来验证这套框架：' +
                    'HTTP（拉取模型）、FTP（双连接 + 带外控制）、SMTP（推送模型）、DNS（分布式数据库查询）。' +
                    '读完本章后再回头看这四条抽象，就能明白“协议为什么长这样”。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.1.3',
                  label: '相关：进程、套接字与端口',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.5',
                  label: '相关：HTTP 请求报文',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.1.3', 'k2.2.5', 'k2.4.2'],
            },
          ],
        },
        {
          id: 's2.1.3',
          title: '传输服务需求',
          knowledge: [
            {
              id: 'k2.1.5',
              title: '应用对传输服务的需求',
              en: 'Transport Service Needs',
              summary:
                '应用对传输层有四类需求：数据完整性（可靠/可容忍丢失）、时延、吞吐量、安全性；各应用需求差异由 PPT 第 18 页需求表总结。',
              tags: ['传输服务需求', '可靠性', '时延', '吞吐量', '安全性'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [17, 18] },
                { kind: 'kaoyan', note: '王道考研：应用层与传输层需求的对应关系常以选择题形式出现' },
              ],
              insight: {
                why:
                  '传输层存在的意义，就是为不同应用提供**差异化**的服务。' +
                  '如果没有传输层，所有应用都得自己在 IP 之上实现可靠传输、流量控制等，' +
                  '既重复劳动又难以互通。传输层把“可靠性/时延/带宽”抽象成两种服务模型，' +
                  '让应用按需求挑选。',
                coreIdea:
                  '不同应用对传输服务的三类核心诉求——数据完整性（data integrity）、时延（timing）、' +
                  '吞吐量（throughput）——构成一张“需求画像”。' +
                  '此外还有共性的安全需求（加密、完整性保护）。',
                mechanism:
                  '“可靠性”有两种极端：文件传输、Web 事务、邮件要求 100% 无丢失；' +
                  '实时音视频能容忍少量丢失（丢一个视频帧比等待重传更可接受）。' +
                  '“时延”敏感度同样两极：互联网电话和交互式游戏需要低时延才有“效果”，' +
                  '而邮件、文件传输对时延不敏感。' +
                  '“吞吐量”分为两类：多媒体有最低带宽要求（不够就“效果不佳”），弹性应用（elastic apps）' +
                  '则有多少用多少。',
                comparison:
                  '注意区分“数据丢失容忍度”与“时延敏感度”是两个独立维度：' +
                  '实时音视频**丢包可容忍**但**时延不可容忍**，这是它最反直觉的地方，' +
                  '也是为什么实时音视频通常不用 TCP。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '应用层协议并不自己实现可靠性与拥塞控制，它只声明自己的需求，' +
                    '由传输层（TCP/UDP）来满足或牺牲。本节先问四个问题：数据是否允许丢失？' +
                    '时延有多重要？吞吐量需要多少？是否需要安全保护？',
                },
                {
                  type: 'list',
                  items: [
                    '数据完整性（data integrity）：文件传输、Web 事务等要求 100% 可靠传输；音频等应用可以容忍少量丢失',
                    '时延（timing）：互联网电话、交互式游戏要求低时延才能“有效”（effective）；邮件、文件传输不敏感',
                    '吞吐量（throughput）：多媒体应用需要最低吞吐量才能“有效”；弹性应用（elastic apps）有多少用多少',
                    '安全性（security）：加密、数据完整性保护等需求，由应用层自行实现（如 HTTPS、TLS）',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀：可靠、实时、带宽三问',
                  text:
                    '见到一个应用，问三句：**丢不丢得起？等不等得起？快不够快？**' +
                    '“丢不起 + 等不起” = 必须 TCP；“等不起 + 丢得起” = 通常 UDP；' +
                    '“丢不起 + 等得起” = TCP（如邮件）；“丢得起 + 等得起” = UDP 也行（如点播）。',
                },
                { type: 'h', text: '常见应用的传输服务需求表（PPT 第 18 页）' },
                {
                  type: 'table',
                  caption: 'Transport service requirements of common apps（PPT 第 18 页原表）',
                  headers: ['应用', '数据丢失', '吞吐量', '时间敏感'],
                  rows: [
                    ['文件传输 file transfer', '不能丢失 no loss', '弹性 elastic', '否 no'],
                    ['电子邮件 e-mail', '不能丢失 no loss', '弹性 elastic', '否 no'],
                    ['Web 文档 Web documents', '不能丢失 no loss', '弹性 elastic', '否 no'],
                    ['实时音视频 real-time audio/video', '可容忍丢失 loss-tolerant', '音频 5 kbps ~ 1 Mbps；视频 10 kbps ~ 5 Mbps', '是，数百毫秒量级 yes, 100’s msec'],
                    ['存储音视频 stored audio/video', '可容忍丢失 loss-tolerant', '同上（same as above）', '是，几秒量级 yes, few secs'],
                    ['交互式游戏 interactive games', '可容忍丢失 loss-tolerant', '几 kbps 到（few kbps up）', '是，数百毫秒量级 yes, 100’s msec'],
                    ['即时消息 instant messaging', '不能丢失 no loss', '弹性 elastic', '是且否 yes and no'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：三个“易混应用”',
                  text:
                    '① **实时音视频 vs 存储音视频**：实时（直播/通话）时延敏感到几百毫秒；' +
                    '存储（点播）可以缓冲，几秒的启动延迟无妨。两者都是 loss-tolerant。' +
                    '② **交互式游戏**：loss-tolerant，但时延敏感到几百毫秒——动作类游戏对延迟极其敏感，' +
                    '因此数据传输常用 UDP。' +
                    '③ **即时消息**：数据不能丢（no loss），但“时延敏感”这一栏 PPT 写作 “yes and no”——' +
                    '因为**聊天正文**要求及时到达，而**用户上线/状态通知**等可以稍等，两者共存。' +
                    '这与它“不能丢”的属性组合起来，正好说明即时消息常跑在 TCP 上。',
                },
                {
                  type: 'p',
                  text:
                    '从表中可以看出一个规律：**凡是不能丢数据的应用（文件、邮件、Web、即时消息）' +
                    '吞吐量和时延要求都不苛刻**，用 TCP 就够了；' +
                    '而**凡是时延敏感的实时应用（实时音视频、交互式游戏）都容忍丢包**，' +
                    '因此可以放弃 TCP 的重传机制，改用 UDP 换取低时延。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点',
                  text:
                    '这张表是应用层最常被抽成选择题的一张表。典型问法：' +
                    '“下列应用中，对时延最敏感且可容忍丢包的是？”→ 交互式游戏 / 互联网电话；' +
                    '“下列应用中要求 100% 可靠传输的是？”→ 文件传输、邮件、Web；' +
                    '“属于弹性应用（elastic）的有？”→ 文件传输、邮件、Web、即时消息。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.1.6',
                  label: '相关：TCP 与 UDP 提供的服务',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.4',
                  label: '相关：HTTP 响应时间模型',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.1.6', 'k2.2.4', 'k2.6.1'],
            },
            {
              id: 'k2.1.6',
              title: 'TCP 与 UDP 提供的服务',
              en: 'Internet Transport Services',
              summary:
                'TCP 提供面向连接、可靠、流量控制与拥塞控制，但不保证时延与带宽；UDP 只提供不可靠数据报传送。应用层协议与传输层协议一一对应（PPT 第 21 页）。',
              tags: ['TCP', 'UDP', '应用层协议', '传输层'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [19, 20, 21] },
                { kind: 'kaoyan', note: '王道考研：应用层协议与传输层协议的对应关系常考' },
              ],
              insight: {
                why:
                  '既然应用需求五花八门，传输层为什么只提供两种服务模型？' +
                  '因为传输层位于网络核心与端系统之间，其功能由内核实现，必须通用、高效、' +
                  '且在网络核心可实现（无状态或轻状态）。TCP 用“可靠有序字节流 + 拥塞控制”' +
                  '覆盖了绝大多数“不能丢”的场景；UDP 则把选择权完全交给应用，' +
                    '让实时应用能自己实现定制化的可靠性与速率控制。',
                coreIdea:
                  'TCP = “可靠但不确定快”；UDP = “快但不保证”。' +
                  'TCP 的服务是**面向连接（connection-oriented）**的：需要先在客户端与服务器进程之间建立连接，' +
                  '提供可靠传输、流量控制、拥塞控制；它**不提供**时延保证与最小带宽保证。' +
                  'UDP 服务是**无连接、不可靠的数据报传送**，不提供连接建立、可靠性、流量控制、拥塞控制、时延与带宽保证。',
                mechanism:
                  'UDP 之所以存在（PPT 第 20 页提问：“为什么要费劲搞个 UDP？”）是因为：' +
                  '① 应用可以自己实现可靠性，避免 TCP 队头阻塞造成的等待；' +
                  '② 无连接、无状态，发送方不需要握手，适合“发一条就完事”的场景（DNS 查询、DHCP、实时音视频）；' +
                  '③ 应用自行做拥塞与速率控制（如 WebRTC 的 GCC），比内核统一控制更贴合业务；' +
                  '④ 报文开销小（首部仅 8 字节）。',
                comparison:
                  '应用层协议与底层传输协议的搭配并非随意：SMTP、Telnet、HTTP、FTP 都要求“不能丢”，' +
                  '因此全部跑在 TCP 上；流媒体（streaming multimedia）可以 TCP 或 UDP 皆可' +
                  '（点播偏向 TCP 保证完整性，直播偏向 UDP 保证实时性）；' +
                  '互联网电话（Internet telephony）通常用 UDP，因为时延比完整性更关键。',
              },
              blocks: [
                { type: 'h', text: '一、TCP 提供的服务（PPT 第 19 页）' },
                {
                  type: 'list',
                  items: [
                    '面向连接（connection-oriented）：客户端与服务器进程之间需要先建立连接',
                    '在发送进程与接收进程之间提供可靠传输（reliable transport）',
                    '流量控制（flow control）：发送方不会把接收方压垮',
                    '拥塞控制（congestion control）：网络过载时对发送方限速',
                    '**不提供**：时延保证（timing）、最小带宽保证（minimum bandwidth guarantees）',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点：TCP “不提供”什么',
                  text:
                    '“TCP 提供可靠传输，所以实时视频也该用 TCP”——**典型的错误理解**。' +
                    'TCP 的可靠性是以**可变的时延**为代价的：丢包后重传（RTO）可能让数据迟到几百毫秒，' +
                    '对实时语音/video 毫无意义。此外 TCP 只提供尽力而为（best-effort）的服务，' +
                    '**没有任何带宽或时延保证**。',
                },
                { type: 'h', text: '二、UDP 提供的服务（PPT 第 20 页）' },
                {
                  type: 'list',
                  items: [
                    '在发送进程与接收进程之间提供**不可靠**数据传送（unreliable data transfer）',
                    '**不提供**：连接建立、可靠性、流量控制、拥塞控制、时延保证、带宽保证',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么要费劲搞一个 UDP？',
                  text:
                    '① **应用可以自己做可靠性**。TCP 的重传在链路上丢一个包时，会把后面已经到达的数据一并阻塞在接收缓存里（队头阻塞），' +
                    '这对实时应用是灾难；应用层做可靠性只丢弃坏帧即可。' +
                    '② **无连接、无状态**：发送方无需握手，DNS 查询、DHCP 发现、NTP 时间同步等天然适合。' +
                    '③ **应用自行控制速率**：实时应用依据网络状况自行调节码率，比内核统一策略更贴合业务。' +
                    '④ **开销小**：UDP 首部仅 8 字节，TCP 首部至少 20 字节。',
                },
                { type: 'h', text: '三、应用层协议与传输层协议的对应（PPT 第 21 页）' },
                {
                  type: 'table',
                  caption: 'Internet apps: application layer protocol & underlying transport protocol',
                  headers: ['应用', '应用层协议', '底层传输协议'],
                  rows: [
                    ['电子邮件 e-mail', 'SMTP [RFC 2821]', 'TCP'],
                    ['远程终端访问 remote terminal access', 'Telnet [RFC 854]', 'TCP'],
                    ['Web', 'HTTP [RFC 2616]', 'TCP'],
                    ['文件传输 file transfer', 'FTP [RFC 959]', 'TCP'],
                    ['流媒体 streaming multimedia', '专有协议（proprietary），如 RealNetworks', 'TCP 或 UDP'],
                    ['互联网电话 Internet telephony', '专有协议（proprietary），如 Dialpad', '通常为 UDP（typically UDP）'],
                  ],
                },
                {
                  type: 'p',
                  text:
                    '这张表可以直接背，但更应该理解其**推导逻辑**：' +
                    '凡是“不能丢数据”的应用（邮件、远程终端、Web、文件传输）都需要 TCP；' +
                    '凡是“时延敏感、可以容忍丢失”的应用（互联网电话、部分流媒体）通常选 UDP；' +
                    '流媒体处于中间地带——点播视频偏向 TCP（要完整、要快进），直播偏向 UDP（要实时）。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：RFC 2616 已过时',
                  text:
                    'PPT 第 21 页把 HTTP 标注为 “HTTP [RFC 2616]”，第 24 页写成 “HTTP 1.1: RFC 2068”。' +
                    '**两处都已被现行标准取代**：HTTP/1.1 的正式标准是 **RFC 2616**，它已于 2015 年被' +
                    '**RFC 9110（HTTP Semantics）** 与 **RFC 9112（HTTP/1.1）** 废弃并取代；' +
                    '**RFC 2068 根本不是 HTTP/1.1 的标准**——它是 1997 年的一份早期草案，从未成为标准且早已作废。' +
                    '最新进展是 **HTTP/2（RFC 7540，2015）** 与 **HTTP/3（RFC 9114，基于 QUIC）**。',
                },
                {
                  type: 'p',
                  text:
                    '这提醒我们：教材与课件中的 RFC 编号有时会过时，' +
                    '答题时以现行 RFC 为准，同时要能说明“为什么旧编号不再适用”。' +
                    '本章在 k2.2.2 处还会专门讨论 HTTP/1.1 与 HTTP/2、HTTP/3 的差异。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.1.5',
                  label: '相关：应用对传输服务的需求',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.2',
                  label: '相关：HTTP 概览与无状态协议',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.1.5', 'k2.2.2', 'k2.7.3'],
            },
          ],
        },
      ],
    },
    // ==========================================================
    // 2.2 Web 与 HTTP
    // ==========================================================
    {
      id: 's2.2',
      title: '2.2 Web 与 HTTP',
      en: 'Web and HTTP',
      subsections: [
        {
          id: 's2.2.1',
          title: 'HTTP 基础',
          knowledge: [
            {
              id: 'k2.2.1',
              title: 'Web 页面、对象与 URL',
              en: 'Web Jargon',
              summary:
                'Web 页面由对象组成，基础对象是含引用其他对象的 HTML 文件；每个对象由 URL 唯一标识，URL 由主机名 + 路径名构成。',
              tags: ['Web', 'URL', '对象', 'HTML'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [23] },
                { kind: 'supplement', note: '补充：URL 的完整语法见 RFC 3986' },
              ],
              insight: {
                why:
                  '为什么先讲术语？因为 Web 的很多设计（缓存、流水线、无状态）都建立在“**页面 = 基础 HTML + 一堆被引用的对象**”这一结构之上。' +
                  '只有理解了对象与引用关系，才能明白为什么“取一个页面”会引发多次请求、' +
                  '为什么缓存单个对象比缓存整页更有效率。',
                coreIdea:
                  'Web 页面（Web page）由若干**对象（object）**组成；每个对象可以是 HTML 文件、JPEG 图像、' +
                  'Java Applet、音频文件等。基础 HTML 文件通过引用（reference）把其他对象“拉”进来。' +
                  '每个对象都有一个**统一资源定位符（URL）**作为唯一地址。',
                mechanism:
                  '浏览器解析基础 HTML 文件时，遇到 <img src="...">、<script src="..."> 等引用，' +
                  '就会对被引用对象的 URL 发起新的 HTTP 请求。' +
                  '因此一次“访问页面”在网络上实际是**多次独立的 HTTP 请求/响应**。',
                comparison:
                  '“页面”与“对象”的区分很重要：对象是可以独立缓存、独立寻址、独立传输的最小单位；' +
                  '而页面只是对象按引用关系组织起来的结果。' +
                  'URL 之于对象，正如文件名之于文件——是“引用”而非“内容”。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '在讲 HTTP 之前，先统一几个万维网（World Wide Web）的基本术语（PPT 第 23 页）。' +
                    'Web 页面（Web page）由若干**对象（object）**组成，对象可以是 HTML 文件、JPEG 图像、' +
                    'Java Applet、音频文件等等。',
                },
                {
                  type: 'p',
                  text:
                    '一个 Web 页面包含一个**基础 HTML 文件**（base HTML-file），该文件内部又引用了其他若干对象。' +
                    '每个对象都通过一个 **URL（Uniform Resource Locator，统一资源定位符）**来寻址。',
                },
                { type: 'term', zh: '统一资源定位符', en: 'Uniform Resource Locator', abbr: 'URL', def: '标识并定位网络中某个资源（对象）的字符串，通常写作 scheme://host/path 的形式。' },
                {
                  type: 'example',
                  title: 'URL 结构示例（PPT 第 23 页）',
                  steps: [
                    'PPT 给出的示例 URL：www.someschool.edu/someDept/pic.gif',
                    '主机名（host name）：www.someschool.edu —— 定位“哪一台主机”',
                    '路径名（path name）：/someDept/pic.gif —— 定位“该主机上的哪一个对象”',
                    '合起来即：协议 + 主机名 + 路径名 = 一个对象的唯一地址',
                  ],
                  answer: 'www.someschool.edu/someDept/pic.gif 中，www.someschool.edu 是主机名，/someDept/pic.gif 是路径名。',
                },
                {
                  type: 'table',
                  caption: 'URL 的常见组成（以 http://www.example.com/docs/index.html 为例）',
                  headers: ['组成部分', '示例', '作用'],
                  rows: [
                    ['协议 scheme', 'http（或 https）', '指定使用的应用层协议'],
                    ['主机名 host', 'www.example.com', '域名，需经 DNS 解析为 IP 地址'],
                    ['端口 port', '80（http 默认，可省略）', '定位主机上的服务进程'],
                    ['路径 path', '/docs/index.html', '定位主机上的具体资源对象'],
                    ['查询参数 query', '?id=7&t=abc', '传递给应用的附加参数'],
                    ['片段 fragment', '#section2', '在客户端内部定位，通常不发送给服务器'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点：URL 片段（fragment）不发给服务器',
                  text:
                    'URL 中 `#` 之后的部分称为片段标识符，它只在浏览器端生效，**不会随 HTTP 请求发送给服务器**。' +
                    '同理，`?` 之后的查询参数**会**发送给服务器。' +
                    '这一区别常以判断题形式出现。',
                },
                {
                  type: 'p',
                  text:
                    '这个“引用—被引用”的结构直接决定了 Web 的行为特征：' +
                    '浏览器拿到基础 HTML 后才知道要引用哪些对象，' +
                    '所以**对象的请求必然发生在 HTML 到达之后**，存在天然的串行依赖；' +
                    '而多个对象之间互不依赖时，就可以**并行下载**（这正是 HTTP 流水线与浏览器多连接并行的基础）。',
                },
                {
                  type: 'p',
                  text:
                    '同时，由于每个对象都有独立 URL，缓存就可以**以对象为粒度**工作：' +
                    '把常用的图片、脚本缓存在本地，后续访问同一页面时只需重新取回变化的基础 HTML。' +
                    '这一点将在 k2.2.8 的 Web 缓存中具体展开。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.3',
                  label: '相关：非持续连接与持续连接',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.1',
                  label: '相关：为什么用分布式层次 DNS',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.2.3', 'k2.2.8', 'k2.5.1'],
            },
            {
              id: 'k2.2.2',
              title: 'HTTP 概览与无状态协议',
              en: 'HTTP Overview & Stateless',
              summary:
                'HTTP 是 Web 的应用层协议，采用客户-服务器模型并使用 TCP 端口 80；HTTP 是无状态的，服务器不保存客户端历史请求的信息。',
              tags: ['HTTP', '无状态', 'TCP', '客户-服务器'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [24, 25, 26, 27] },
                { kind: 'external', label: 'RFC 9110: HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110' },
                { kind: 'external', label: 'RFC 9112: HTTP/1.1', url: 'https://www.rfc-editor.org/rfc/rfc9112' },
                { kind: 'kaoyan', note: '王道考研：HTTP 无状态与 Cookie 的关系常考' },
              ],
              insight: {
                why:
                  'HTTP 为什么要设计成**无状态（stateless）**？因为一旦服务器需要记住每个客户端的历史，' +
                  '服务器就必须为每个用户保存状态：内存成本高、故障恢复难、集群扩展难。' +
                  '无状态让服务器变成“**无记忆的应答机**”，可以任意水平扩展、可随时重启、可用负载均衡器分发。' +
                  '代价是每个请求都要自带足够信息（这正是 Cookie 的存在理由）。',
                coreIdea:
                  'HTTP（HyperText Transfer Protocol，超文本传输协议）是 Web 的应用层协议。' +
                  '它采用客户-服务器模型：客户是浏览器，负责请求、接收并“显示”Web 对象；' +
                  '服务器是 Web 服务器，按请求返回对象。' +
                  'HTTP **使用 TCP**：客户端发起 TCP 连接（创建套接字）到服务器的 80 端口，服务器接受连接，' +
                  '随后双方交换 HTTP 消息，最后关闭 TCP 连接。',
                mechanism:
                    '无状态的准确含义是：服务器不维护关于客户端过去请求的任何信息。' +
                    '维持状态的协议（stateful）复杂度高得多——历史状态必须被保存，' +
                    '如果服务器或客户端崩溃，双方对“状态”的认知可能不一致，需要额外的协调与恢复机制；' +
                    '而无状态协议只需把状态放进消息本身（Cookie、URL 参数）就能达到同样效果。',
                comparison:
                  'HTTP/1.0（RFC 1945）默认每个对象一次连接；HTTP/1.1（现行 RFC 9112，历史上 RFC 2616）' +
                  '默认持久连接并支持流水线；HTTP/2（RFC 7540）引入二进制分帧与多路复用，' +
                  '但语义仍是无状态的；HTTP/3（RFC 9114）基于 QUIC，在 UDP 之上实现，' +
                  '解决了队头阻塞问题。' +
                  '**“无状态”是应用层语义，与传输层是否保持连接无关**——HTTP/1.1 的持久连接照样是无状态的。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    'HTTP（HyperText Transfer Protocol，超文本传输协议）是 **Web 的应用层协议**（PPT 第 24 页）。' +
                    '它采用**客户-服务器（client/server）模型**：',
                },
                {
                  type: 'list',
                  items: [
                    '客户（client）：浏览器（browser），负责发送请求、接收并“显示”Web 对象',
                    '服务器（server）：Web 服务器，按请求把对象发送回客户',
                  ],
                },
                {
                  type: 'p',
                  text:
                    'PPT 第 24 页给出了典型部署示意：PC 上运行的 Firefox 浏览器、PC 上运行的 Apache Web 服务器、' +
                    '以及 iPhone 上运行的 Safari 浏览器。它们各自与服务器之间交换 HTTP 请求与 HTTP 响应。',
                },
                { type: 'h', text: '万维网的工作过程（PPT 第 25 页）' },
                {
                  type: 'figure',
                  alt: '万维网的工作过程：浏览器、HTTP 客户程序、服务器程序、因特网',
                  caption: 'PPT 第 25 页：万维网的工作过程（以 www.tsinghua.edu.cn 为例）',
                  ascii:
                    '   浏览器                HTTP 客户程序          因特网        服务器程序\n  ┌────────┐             ┌────────────┐                     ┌────────┐\n  │        │  ① 链接到   │            │  ② 建立 TCP 连接   │        │\n  │        │────URL 的超链►│            │──────────────────►│        │\n  │        │             │            │                     │        │\n  │        │             │ ③ 发送 HTTP 请求报文 ──────────►│        │\n  │        │             │            │                     │        │\n  │        │◄────────────│            │◄──── HTTP 响应报文 ──│        │\n  │ ④ 显示响应文档        │            │                     │        │\n  │        │             │            │  ⑤ 释放 TCP 连接 ──►│        │\n  └────────┘             └────────────┘                     └────────┘\n                     服务器：www.tsinghua.edu.cn（清华大学院系设置）',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '用户在浏览器中点击指向 www.tsinghua.edu.cn 的**超链接**',
                    '浏览器启动 **HTTP 客户程序**，与服务器建立 **TCP 连接**（HTTP 使用这条 TCP 连接）',
                    'HTTP 客户程序发送 **HTTP 请求报文**，请求文档',
                    '服务器程序返回 **HTTP 响应报文**，其中包含**响应文档**（清华大学院系设置页面）',
                    '浏览器**显示响应文档**；随后 **TCP 连接被释放**',
                  ],
                },
                { type: 'h', text: '用户点击鼠标后所发生的 8 个事件（PPT 第 26 页）' },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '浏览器分析超链指向页面的 **URL**',
                    '浏览器向 **DNS 请求**解析 www.tsinghua.edu.cn 的 **IP 地址**',
                    '**域名系统 DNS 解析出**清华大学服务器的 IP 地址',
                    '浏览器与服务器**建立 TCP 连接**',
                    '浏览器发出取文件命令：**`GET /chn/yxsz/index.htm`**',
                    '服务器给出响应，把文件 **index.htm** 发给浏览器',
                    '**TCP 连接释放**',
                    '浏览器显示“**清华大学院系设置**”文件 index.htm 中的所有文本',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：这 8 个事件串起了全章',
                  text:
                    '这 8 步把本章所有核心知识串成一条线：' +
                    '**第 2、3 步 → DNS（s2.5）**；**第 4、7 步 → TCP 连接管理（s2.2.3 / s3.5）**；' +
                    '**第 5 步 → HTTP 请求方法 GET（s2.2.5）**；**第 6 步 → HTTP 响应报文（s2.2.6）**。' +
                    '**URL → DNS → TCP → HTTP → 释放**，这五步就是访问一个网页的完整链路，务必能默写。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '注意第 5 步的请求行',
                  text:
                    'PPT 给出的具体请求行是 `GET /chn/yxsz/index.htm`，' +
                    '即“**方法 + 路径 + 版本**”的结构（版本在 PPT 图中省略）。' +
                    '这与 k2.2.5 的 `GET /index.html HTTP/1.1` 是同一种格式。',
                },
                { type: 'h', text: 'HTTP 使用 TCP（PPT 第 27 页）' },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '客户端向服务器的 80 端口发起 TCP 连接（即创建套接字）',
                    '服务器接受来自客户端的 TCP 连接',
                    '浏览器（HTTP 客户）与 Web 服务器（HTTP 服务器）之间交换 HTTP 消息（应用层协议消息）',
                    'TCP 连接关闭',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: 'HTTP 四步曲：**建连接 → 换消息 → 关连接**。中间那一步可以在一条连接上反复进行（持久连接）。',
                },
                { type: 'h', text: 'HTTP 是“无状态”的（stateless）' },
                {
                  type: 'p',
                  text:
                    '无状态的准确含义是：**服务器不维护关于客户端过去请求的任何信息**（PPT 第 27 页）。' +
                    '服务器不记录“这个客户端之前来过、之前要过什么”，每个请求都被当作独立的、完整的交易来处理。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么维持状态的协议很复杂？',
                  text:
                    '① 过去的历史（状态）必须被保存，占用服务器内存与存储；' +
                    '② 如果服务器/客户端崩溃，双方对“状态”的认知可能不一致，必须做**状态协调与恢复**；' +
                    '③ 服务器集群中请求可能落到不同节点，状态必须共享，扩展性变差。' +
                    '无状态协议把复杂度全部推给客户端（用 Cookie/URL 携带状态），服务器因此可以任意扩展。',
                },
                {
                  type: 'p',
                  text:
                    '这引出本章的一个核心对照（PPT 第 47 页）：' +
                    '**协议端点维持状态**（sender/receiver over multiple transactions）与' +
                    '**Cookie 让 HTTP 消息携带状态**，是两种不同的“记性”实现方式。' +
                    'HTTP 选择后者，正因为它简单、健壮、易扩展。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：无状态 ≠ 无连接',
                  text:
                    '“HTTP 是无状态的，所以每次请求都要重新建立 TCP 连接”——**错误**。' +
                    '“无状态”说的是**应用层不保存会话信息**；' +
                    '而 HTTP/1.1 默认使用**持久连接**，一条 TCP 连接上可以连续传输多个请求/响应。' +
                    '两件事分属不同层次，绝不可混淆。',
                },
                { type: 'h', text: 'HTTP 的版本（PPT 第 24 页）' },
                {
                  type: 'table',
                  headers: ['版本', 'PPT 标注', '说明与更正'],
                  rows: [
                    ['HTTP/1.0', 'RFC 1945', 'RFC 1945 属实（1996）。默认非持久连接，每个对象一条连接。'],
                    ['HTTP/1.1', 'PPT 写作 “RFC 2068”（有误）', 'HTTP/1.1 的正式标准是 **RFC 2616**（1997），已于 2015 年被 **RFC 9110 / RFC 9112** 废弃取代；**RFC 2068 只是早期草案，从未成为标准且已作废**。'],
                    ['HTTP/2', 'PPT 未涉及', 'RFC 7540（2015）。二进制分帧、多路复用、服务器推送、头部压缩。语义仍无状态。'],
                    ['HTTP/3', 'PPT 未涉及', 'RFC 9114（2022）。基于 QUIC（UDP 之上），解决应用层 + 传输层的队头阻塞。'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点：RFC 编号纠错',
                  text:
                    '若考卷或课件出现 “HTTP 1.1: RFC 2068”，**这是错误信息**。' +
                    '标准答法：HTTP/1.1 为 **RFC 2616**（现已由 RFC 9110/9112 取代）；' +
                    'RFC 2068 是 1997 年的 HTTP/1.1 早期草案，从未标准化、已废弃。' +
                    '同类需要记牢的编号：HTTP/1.0 = RFC 1945、SMTP = RFC 2821、Telnet = RFC 854、' +
                    'FTP = RFC 959、POP3 = RFC 1939、IMAP = RFC 1730（已被 RFC 3501/9051 取代）、' +
                    'MIME = RFC 2045/2046（课件写 2056）。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.7',
                  label: '相关：Cookie 与用户跟踪',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.3',
                  label: '相关：非持续连接与持续连接',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.2.7', 'k2.2.3', 'k2.1.6'],
            },
            {
              id: 'k2.2.3',
              title: '非持续连接与持续连接',
              en: 'Non-persistent & Persistent HTTP',
              summary:
                '非持续 HTTP 每取一个对象就新建并关闭一条 TCP 连接；持续 HTTP 在一条连接上传输多个对象，可进一步分为无流水线与有流水线两种。',
              tags: ['HTTP', '持续连接', '非持续连接', '流水线'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [28, 29, 30, 32, 33] },
              ],
              insight: {
                why:
                  '为什么要在意“持续还是非持续”？因为 TCP 连接的建立代价很高——' +
                  '一次 TCP 三次握手要花 **1 个 RTT**，而一次 HTTP 请求-响应至少要再花 1 个 RTT。' +
                  '若一个页面有 11 个对象（1 个 HTML + 10 张 JPEG），' +
                  '非持续连接要建 11 条 TCP 连接，握手开销被放大了 11 倍。',
                coreIdea:
                  '非持续 HTTP（non-persistent HTTP）：一条 TCP 连接上**最多发送一个对象**，然后关闭连接；' +
                  '要下载多个对象就得建立多条连接。' +
                  '持续 HTTP（persistent HTTP）：在客户端与服务器之间的一条 TCP 连接上**可以发送多个对象**，' +
                  '服务器发送完响应后保持连接打开。',
                mechanism:
                  '持续连接进一步分两种：' +
                  '**无流水线（without pipelining）**：客户端只有在收到前一个响应后才发出下一个请求，' +
                  '每个被引用对象仍需 1 个 RTT；' +
                  '**有流水线（with pipelining）**：客户端一遇到被引用对象就立刻发出请求，' +
                  '所有被引用对象**总共只需 1 个 RTT**。流水线是 HTTP/1.1 的默认模式。',
                comparison:
                  '非持续连接：简单、服务器资源占用少、故障隔离性好，但每个对象 2 RTT（握手 1 + 请求响应 1）。' +
                  '持续无流水线：每个对象 1 RTT，但客户端与服务器之间需同步，串行等待。' +
                  '持续有流水线：所有对象 1 RTT，吞吐最高，但**请求必须按顺序返回**，' +
                  '一个慢响应会阻塞其后所有响应——这是 HTTP/1.1 流水线的固有缺陷，' +
                  '也正是 HTTP/2 用多路复用取代流水线的原因。',
              },
              blocks: [
                { type: 'h', text: '一、两类连接方式（PPT 第 28 页）' },
                {
                  type: 'table',
                  headers: ['方式', '行为', '代价'],
                  rows: [
                    ['非持续 HTTP', '一条 TCP 连接上最多发送一个对象，发送完即关闭连接；下载多个对象需要多条连接', '每个对象都要重新握手（1 RTT）+ 请求响应（1 RTT）'],
                    ['持续 HTTP', '客户端与服务器之间一条 TCP 连接上可发送多个对象；服务器发送完响应后保持连接打开', '需要管理连接状态；但可显著减少握手开销'],
                  ],
                },
                { type: 'h', text: '二、非持续 HTTP 的完整流程（PPT 第 29、30 页）' },
                {
                  type: 'p',
                  text:
                    '设用户输入 URL：www.someSchool.edu/someDepartment/home.index，' +
                    '该 HTML 文件包含文本并引用了 10 张 JPEG 图像。',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    'HTTP 客户端向 www.someSchool.edu 的 80 端口发起 TCP 连接（1a）',
                    'HTTP 客户端把 HTTP 请求报文（内含 URL）写入 TCP 连接的套接字（2）；报文表明客户端想要 someDepartment/home.index 这个对象',
                    'HTTP 服务器在 80 端口等待 TCP 连接，接受该连接并通知客户端（1b）',
                    'HTTP 服务器收到请求报文，组织响应报文（含所请求对象），写入自己的套接字（3）',
                    'HTTP 服务器关闭 TCP 连接（4）',
                    'HTTP 客户端收到含 HTML 文件的响应报文，显示 HTML；解析 HTML 文件，发现 10 个被引用的 JPEG 对象（5）',
                    '对每个 JPEG 对象重复步骤 1~5（共 10 次）（6）',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '计算题：11 个对象要几次握手？',
                  text:
                    '1 个 HTML + 10 张 JPEG = 11 个对象。' +
                    '**非持续 HTTP**：11 条 TCP 连接 → 11 × 1 RTT 握手 + 11 × 1 RTT 请求响应 = 22 RTT（不含数据传输时间）。' +
                    '**持续 HTTP（无流水线）**：1 条连接 → 1 RTT 握手 + 11 RTT 请求响应 = 12 RTT。' +
                    '**持续 HTTP（有流水线）**：1 条连接 → 1 RTT 握手 + 1 RTT 发出全部请求并取回所有响应 = 2 RTT（理想情况）。' +
                    '这是本章最高频的计算题型。',
                },
                { type: 'h', text: '三、非持续 HTTP 的问题（PPT 第 32 页）' },
                {
                  type: 'list',
                  items: [
                    '每个对象需要 2 个 RTT（1 RTT 建 TCP 连接 + 1 RTT 请求响应）',
                    '每次建立 TCP 连接都有操作系统开销（OS overhead）',
                    '浏览器通常会**并行打开多条 TCP 连接**来同时获取被引用的对象（parallel TCP connections）',
                  ],
                },
                {
                  type: 'p',
                  text:
                    '这三条构成了非持续 HTTP 的完整代价画像：' +
                    '**时间代价（2 RTT/对象）+ 资源代价（连接表、缓存、CPU）+ 复杂度代价（客户端要自己管理并发连接）**。' +
                    '持续 HTTP 正是针对这三点提出的改进。',
                },
                { type: 'h', text: '四、持续 HTTP（PPT 第 32、33 页）' },
                {
                  type: 'list',
                  items: [
                    '服务器在发送完响应后保持连接打开（leaves connection open）',
                    '同一客户端与服务器之间的后续 HTTP 消息都在这条已打开的连接上发送',
                    '客户端一遇到被引用的对象就立即发出请求（as soon as it encounters a referenced object）',
                    '所有被引用对象**最少只需 1 个 RTT**',
                  ],
                },
                {
                  type: 'table',
                  caption: '三种 HTTP 模式的对比（假设页面含 1 个 HTML + 10 个 JPEG，共 11 个对象）',
                  headers: ['模式', 'TCP 连接数', '总 RTT（不含传输时间）', '特点'],
                  rows: [
                    ['非持续 HTTP', '11', '22', '简单、隔离性好，但握手开销巨大'],
                    ['持续 HTTP，无流水线', '1', '12', '每收到一个响应才能发下一个请求，严格串行'],
                    ['持续 HTTP，有流水线', '1', '2', 'HTTP/1.1 默认；所有请求背靠背发出，响应按序返回'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：流水线不是“并行”',
                  text:
                    '流水线（pipelining）指的是**请求可以背靠背连续发出**（省掉了等待响应再发下一个请求的 RTT），' +
                    '但**响应仍然必须按请求的先后顺序返回**。' +
                    '若第 1 个响应很慢，其后的响应即使已算好也必须等待。' +
                    '这叫“响应队头阻塞”。' +
                    'HTTP/2 的多路复用（multiplexing）才是真正的并行——响应可以乱序返回。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text:
                    '非持续：**一物一连**（一个对象一条连接）；' +
                    '持续：**一连多物**（一条连接多个对象）；' +
                    '流水线：**背靠背发、排队回**（请求连发、响应排队）。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.4',
                  label: '相关：响应时间模型 2RTT+T',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.9',
                  label: '相关：条件 GET',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.2.4', 'k2.2.9', 'k2.2.1'],
            },
            {
              id: 'k2.2.4',
              title: '响应时间模型 2RTT+T',
              en: 'Response Time Modeling',
              summary:
                'HTTP 响应时间 = 1 RTT 建立 TCP 连接 + 1 RTT 请求与首字节返回 + 文件传输时间，即 2RTT + 传输时间。',
              tags: ['RTT', '响应时间', 'HTTP', '计算'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [31] },
                { kind: 'supplement', note: '补充：RTT 定义与第一章 k1.4.5 一致' },
              ],
              insight: {
                why:
                  '为什么要建立“响应时间模型”？因为“感觉网页慢”太模糊，无法优化。' +
                  '把它拆成**建立连接 + 请求响应 + 传输数据**三段之后，' +
                  '才能判断瓶颈在 RTT（地理距离/拥塞）还是在传输速率（带宽/文件大小），' +
                  '进而决定是该用 CDN 缩短 RTT，还是该压缩文件提高传输速率。',
                coreIdea:
                    '**RTT（Round-Trip Time，往返时延）**的定义是：一个很小的数据包从客户端传到服务器再返回所需的时间。' +
                    'HTTP 响应时间由三段组成：① 1 个 RTT 用于发起 TCP 连接（三次握手）；' +
                    '② 1 个 RTT 用于 HTTP 请求以及响应首字节返回；③ 文件传输时间（transmit time）。' +
                    '因此总响应时间 = **2RTT + 文件传输时间**。',
                mechanism:
                  '第 ① 段之所以要 1 RTT，是因为 TCP 是面向连接的：客户端发 SYN，服务器回 SYN+ACK（1 RTT 后客户端收到），' +
                  '客户端再发 ACK；握手完成后客户端才能发 HTTP 请求。' +
                  '第 ② 段是“请求-响应”的一次往返。' +
                  '第 ③ 段是 $L/R$，其中 $L$ 是文件长度（bit），$R$ 是链路速率（bps）。',
                comparison:
                  '若采用**持续连接**，则第 ① 段（1 RTT）在后续请求上可以省去，' +
                  '此时每个后续对象的响应时间降为 **1 RTT + 传输时间**；' +
                  '若再叠加**流水线**，多个对象的传输时间可以重叠，总时间接近 1 RTT + 传输时间。' +
                  '这正是 k2.2.3 中 RTT 数从 22 → 12 → 2 的来源。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '本节建立一个用于分析和计算的**响应时间模型**（PPT 第 31 页）。' +
                    '先明确 RTT 的定义：**RTT 是把一个很小的数据包从客户端发送到服务器再返回所需的时间**。',
                },
                {
                  type: 'formula',
                  latex: 'T_{resp} = 2\\,RTT + T_{trans} = 2\\,RTT + \\frac{L}{R}',
                  caption: '非持续 HTTP 取得单个对象的响应时间',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: 'T_{resp}', meaning: '从发起请求到对象完整到达的总响应时间', unit: 's' },
                    { symbol: 'RTT', meaning: '往返时延（客户—服务器—客户）', unit: 's' },
                    { symbol: 'T_{trans}', meaning: '文件（对象）的传输时间', unit: 's' },
                    { symbol: 'L', meaning: '被传输对象的长度', unit: 'bit' },
                    { symbol: 'R', meaning: '客户端与服务器之间的链路速率', unit: 'bps' },
                  ],
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '第 1 段：1 个 RTT，用于发起 TCP 连接（客户端发 SYN → 服务器回 SYN+ACK）',
                    '第 2 段：1 个 RTT，用于 HTTP 请求以及 HTTP 响应首字节返回',
                    '第 3 段：文件传输时间 $T_{trans} = L/R$',
                    '合计：总响应时间 = 2 RTT + 传输时间',
                  ],
                },
                {
                  type: 'figure',
                  alt: 'HTTP 响应时间三段时间轴：发起 TCP 连接(RTT) → 请求(RTT) → 文件传输时间',
                  caption: 'PPT 第 31 页时间轴示意',
                  ascii:
                    '客户端                                   服务器\n  |------- SYN ------>|  第1段: 1 RTT 建立 TCP 连接\n  |<-- SYN+ACK -------|  (SYN+ACK 到达时已经过了 1 个 RTT)\n  |------- ACK ------>|\n  |------- 请求 ------>|  第2段: 1 RTT 请求与首字节返回\n  |<-- 响应首字节 -----|  (对象首字节到达时已过了又一个 RTT)\n  |<-- 对象数据 ------>|  第3段: 文件传输时间 L/R\n  时间轴:  |--1 RTT--|  |--1 RTT--|  |----L/R----|\n          总计 = 2 RTT + L/R',
                },
                {
                  type: 'example',
                  title: '例题 1：单对象响应时间',
                  steps: [
                    '已知：RTT = 100 ms，对象大小 L = 1 Mbit（1000 kb），链路速率 R = 10 Mbps',
                    '第 1 段：1 RTT = 100 ms',
                    '第 2 段：1 RTT = 100 ms',
                    '第 3 段：$T_{trans} = L/R = 1\\times10^{6}/10\\times10^{6} = 0.1$ s = 100 ms',
                    '合计：$2\\times100 + 100 = 300$ ms',
                  ],
                  answer: '总响应时间 = 2RTT + L/R = 200 ms + 100 ms = 300 ms。',
                },
                {
                  type: 'example',
                  title: '例题 2：11 个对象在三种模式下的总时间',
                  steps: [
                    '沿用例题 1 的参数：RTT = 100 ms，每个对象 L = 1 Mbit，R = 10 Mbps（单对象传输 100 ms）',
                    '非持续 HTTP：11 条 TCP 连接 → 11×(2 RTT + 传输时间) = 11×(200+100) = 3300 ms',
                    '持续 HTTP 无流水线：1 条连接 → 1×(2 RTT) + 11×(1 RTT + 传输时间) = 200 + 11×200 = 2400 ms',
                    '持续 HTTP 有流水线：1 条连接 → 2 RTT + 11×传输时间（传输可流水重叠）≈ 200 + 1100 = 1300 ms',
                  ],
                  answer: '非持续 3300 ms；持续无流水线 2400 ms；持续有流水线约 1300 ms。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点：2RTT 里各是哪两个 RTT',
                  text:
                    '问：“为什么取一个对象要 2 个 RTT？”——' +
                    '① 第一个 RTT 是 **TCP 三次握手**（严格说客户端收到 SYN+ACK 的时刻）；' +
                    '② 第二个 RTT 是 **HTTP 请求—响应往返**。' +
                    '不要说成“发两次请求”，也不要把 TCP 握手的 1.5 个 RTT 记成 2 个。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '**一握手、一问答、一传输** = 2 RTT + L/R。握手管“能不能说”，问答管“说什么”，传输管“说多少”。',
                },
                {
                  type: 'p',
                  text:
                    '这个模型还揭示了两个优化的方向：' +
                    '**减小 RTT**（CDN 把服务器放近用户、用 QUIC 把握手与数据融合到 1 RTT）' +
                    '与**减小 $L/R$**（压缩、缓存、CDN 边缘命中）。' +
                    'Web 缓存（k2.2.8）正是大幅缩短 RTT 与传输时间的手段。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd2.2.4-http-timing',
                  label: '打开演示：HTTP 响应时间 2RTT + 传输时间',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.3',
                  label: '相关：非持续连接与持续连接',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.8',
                  label: '相关：Web 缓存（代理服务器）',
                },
              ],
              questionIds: [],
              demoIds: ['d2.2.4-http-timing'],
              related: ['k2.2.3', 'k2.2.8', 'k1.4.5'],
            },
          ],
        },
        {
          id: 's2.2.2',
          title: 'HTTP 报文',
          knowledge: [
            {
              id: 'k2.2.5',
              title: 'HTTP 请求报文',
              en: 'Request Message',
              summary:
                'HTTP 请求报文为 ASCII 人可读格式，由请求行（方法 + URL + 版本）、首部行和可选实体主体三部分组成；常用方法有 GET/POST/HEAD/PUT/DELETE/TRACE/CONNECT/OPTION。',
              tags: ['HTTP', '请求报文', '方法', '首部'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [34, 35, 36, 37, 38, 39] },
                { kind: 'external', label: 'RFC 9110: HTTP Semantics (Methods)', url: 'https://www.rfc-editor.org/rfc/rfc9110#name-methods' },
              ],
              insight: {
                why:
                  '为什么要规定报文的格式？因为网络是“公共通道”，必须有一套人人看得懂、机器能解析的格式。' +
                  'HTTP 报文采用 **ASCII 人可读格式**，虽然传输效率略低，但带来巨大好处：' +
                  '可以手工用 telnet 敲出请求、用 Wireshark 直接看懂、便于调试与教学。',
                coreIdea:
                    'HTTP 有两类消息：**请求报文（request message）**和**响应报文（response message）**。' +
                    '请求报文的**开始行**叫**请求行（request line）**，格式为：`方法 URL 版本`。' +
                    '例如 `GET /index.html HTTP/1.1`。' +
                    '首部行（header lines）由若干 `首部字段名: 值` 组成，' +
                    '以一个**空行（CRLF CRLF）**结束首部；其后是可选的**实体主体（entity body）**。',
                mechanism:
                  '请求方法（method）本质上是“对所请求对象进行的操作”，因此请求报文的类型由它采用的方法决定。' +
                  '常见方法语义：GET 读取、POST 提交/添加信息（如注释）、HEAD 读取首部、PUT 在指定 URL 下存储文档、' +
                  'DELETE 删除、TRACE 环回测试、CONNECT 用于代理服务器建立隧道、OPTION 请求选项信息。',
                comparison:
                  'GET 与 POST 的经典对比：**GET 的参数放在 URL 中（可缓存、可收藏、可重复）且语义上应安全（idempotent）；' +
                  'POST 把数据放在实体主体中（不受 URL 长度限制、可携带任意类型），语义上不幂等。**' +
                  '注意：GET 并不保证“不会修改状态”——这是一个常见误解，真正的安全方法只有 GET/HEAD/OPTIONS/TRACE。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    'HTTP 有两类报文：**请求报文**与**响应报文**（PPT 第 34 页）。' +
                    '请求报文采用 **ASCII 人可读格式**，由三部分组成（PPT 第 38 页）：' +
                    '**开始行（start line）**、**首部行（header lines）**和**实体主体（entity body）**。' +
                    '在请求报文中，开始行就是**请求行（request line）**。',
                },
                {
                  type: 'figure',
                  alt: 'HTTP 请求报文通用格式：请求行 + 首部行 + 实体主体',
                  caption: 'PPT 第 34~39 页：HTTP 请求报文通用格式',
                  ascii:
                    '        请求行              首部行                  实体主体\n     (通常不用)\n   ┌──────────────┬───────────────────────┬─────────────┐\n   │ 方法 URL 版本 │ 首部字段名 : 值        │             │\n   │              │ 首部字段名 : 值        │             │\n   │              │ ...                   │             │\n   └──────────────┴───────────────────────┴─────────────┘\n        空格        回车换行(CRLF)          空行(CRLF CRLF)\n\n   例:\n   GET /index.html HTTP/1.1\\r\\n\n   Host: www-net.cs.umass.edu\\r\\n\n   User-Agent: Firefox/3.6.10\\r\\n\n   Accept: text/html,application/xhtml+xml\\r\\n\n   Accept-Language: en-us,en;q=0.5\\r\\n\n   Accept-Encoding: gzip,deflate\\r\\n\n   Accept-Charset: ISO-8859-1,utf-8;q=0.7\\r\\n\n   Keep-Alive: 115\\r\\n\n   Connection: keep-alive\\r\\n\n   \\r\\n',
                },
                {
                  type: 'kv',
                  title: '请求行三要素（PPT 第 35、37、39 页）',
                  items: [
                    { k: '方法（Method）', v: '面向对象技术中使用的专门名词，所谓“方法”就是对所请求的对象进行的操作，因此这些方法实际上也就是一些命令。请求报文的类型由它所采用的方法决定。' },
                    { k: 'URL', v: '所请求的资源的 URL。' },
                    { k: '版本（Version）', v: 'HTTP 的版本，如 HTTP/1.1、HTTP/2、HTTP/3。' },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀：CRLF 的两个作用',
                  text:
                    '**\\r\\n（回车 + 换行）** 用来分隔“每一行”；' +
                    '**\\r\\n\\r\\n（连续两个 CRLF）** 用来表示**首部行结束**，其后才是实体主体。' +
                    '判断“首部在哪里结束”只需找连续两个 CRLF。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：请求报文三个部分',
                  text:
                    '“报文由三个部分组成，即开始行、首部行和实体主体。在请求报文中，开始行就是请求行。”——' +
                    '这句话是 PPT 第 38 页的原文，直接对应填空/简答题。' +
                    '注意措辞：**请求报文**的开始行 = 请求行；**响应报文**的开始行 = 状态行。',
                },
                { type: 'h', text: 'HTTP 请求报文的常用方法（PPT 第 36 页）' },
                {
                  type: 'table',
                  caption: 'HTTP 请求方法一览（PPT 第 36 页）',
                  headers: ['方法', '意义'],
                  rows: [
                    ['OPTION', '请求一些选项的信息'],
                    ['GET', '请求读取由 URL 所标志的信息'],
                    ['HEAD', '请求读取由 URL 所标志的信息的首部'],
                    ['POST', '给服务器添加信息（例如，注释）'],
                    ['PUT', '在指明的 URL 下存储一个文档'],
                    ['DELETE', '删除指明的 URL 所标志的资源'],
                    ['TRACE', '用来进行环回测试的请求报文'],
                    ['CONNECT', '用于代理服务器'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：GET vs POST vs HEAD vs PUT',
                  text:
                    '① **GET 是读取，POST 是“给服务器添加信息”**（如发表评论），PPT 原文如此；' +
                    '不要把 POST 说成“上传文件”而不提它也可用于新增子资源。' +
                    '② **HEAD 只取首部不要实体**，常用于探测资源大小/是否可缓存。' +
                    '③ **PUT 是幂等的**（同一资源多次 PUT 结果相同），**POST 不幂等**。' +
                    '④ **TRACE 用于环回测试（loopback test）**，调试用；' +
                    '**CONNECT 用于代理服务器**建立隧道（因此 HTTPS 代理、HTTP/2 隧道都靠它）。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：幂等方法（RFC 9110）',
                  text:
                    'RFC 9110 定义了**安全方法**（safe：GET、HEAD、OPTIONS、TRACE，不应改变服务器状态）' +
                    '与**幂等方法**（idempotent：GET、HEAD、PUT、DELETE、OPTIONS、TRACE，重复执行效果相同）。' +
                    '**POST 既不安全也不幂等**。这个划分决定了浏览器能否自动重试、代理能否缓存。',
                },
                {
                  type: 'p',
                  text:
                    '回到 PPT 第 34 页示例：`GET /index.html HTTP/1.1` 之后的 `Host`、`User-Agent`、`Accept`、' +
                    '`Accept-Language`、`Accept-Encoding`、`Accept-Charset`、`Keep-Alive`、`Connection` 都是首部行，' +
                    '每个首部字段名后跟一个**冒号**和**空格**再写值，行尾是 CRLF。' +
                    '`Keep-Alive: 115` 表示希望保持连接并允许最多 115 次请求，`Connection: keep-alive` 明确要求持久连接。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.6',
                  label: '相关：HTTP 响应报文与状态码',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.7.4',
                  label: '相关：构建简单 Web 服务器',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.2.6', 'k2.7.4', 'k2.2.2'],
            },
            {
              id: 'k2.2.6',
              title: 'HTTP 响应报文与状态码',
              en: 'Response & Status Codes',
              summary:
                'HTTP 响应报文由状态行（版本 + 状态码 + 短语）、首部行和实体主体组成；常见状态码有 200/301/400/404/505。',
              tags: ['HTTP', '响应报文', '状态码'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [40, 41, 42, 43] },
                { kind: 'external', label: 'RFC 9110: HTTP Status Code Registry', url: 'https://www.rfc-editor.org/rfc/rfc9110#name-status-codes' },
              ],
              insight: {
                why:
                  '为什么需要状态码？因为客户端需要机器可读的**统一结果分类**：' +
                  '“成功了吗？”“要换个地方吗？”“是不是我请求写错了？”“资源不存在？”' +
                  '“你的 HTTP 版本我不懂？”——' +
                  '状态码把这些问题编码成三位数字，既简短又可扩展。',
                coreIdea:
                    'HTTP 响应报文的**开始行**叫**状态行（status line）**，包含三项内容：' +
                    '**HTTP 的版本、状态码（status code）、以及解释状态码的简单短语（status phrase）**，' +
                    '格式为 `HTTP/1.1 200 OK`。' +
                    '状态行之后是首部行，再之后是可选的实体主体（部分响应报文不用）。',
                mechanism:
                  '状态码分五类：1xx 信息、2xx 成功、3xx 重定向、4xx 客户端错误、5xx 服务器错误。' +
                    '客户端依据状态码决定后续行为：2xx 直接渲染；3xx 跟随 Location 首部重新请求；' +
                    '4xx 提示用户输入有误；5xx 提示服务器故障（可重试）。',
                comparison:
                  '状态码与**状态短语**要分清：短语是给人看的，可以自由改动（规范并未强制措辞），' +
                    '状态码是给机器看的，必须精确。' +
                    '例如 `200 OK`、`404 Not Found` 中的 OK / Not Found 都可以换说法，200 / 404 不能换。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    'HTTP 响应报文的结构与请求报文对称（PPT 第 40 页）：' +
                    '由**开始行**、**首部行**和**实体主体**组成。' +
                    '响应报文的开始行是**状态行（status line）**，它包括三项内容：' +
                    '**HTTP 的版本、状态码，以及解释状态码的简单短语**。',
                },
                {
                  type: 'figure',
                  alt: 'HTTP 响应报文通用格式：状态行 + 首部行 + 实体主体',
                  caption: 'PPT 第 40 页：HTTP 响应报文通用格式',
                  ascii:
                    '        状态行              首部行                  实体主体\n     (有些响应报文不用)\n   ┌──────────────┬───────────────────────┬─────────────┐\n   │ 版本 状态码 │ 首部字段名 : 值        │             │\n   │      短语   │ 首部字段名 : 值        │  data data  │\n   │             │ ...                   │  data data  │\n   └──────────────┴───────────────────────┴─────────────┘\n        空格        回车换行(CRLF)          空行(CRLF CRLF)\n\n   例:\n   HTTP/1.1 200 OK\\r\\n\n   Date: Sun, 26 Sep 2010 20:09:20 GMT\\r\\n\n   Server: Apache/2.0.52 (CentOS)\\r\\n\n   Last-Modified: Tue, 30 Oct 2007 17:00:02 GMT\\r\\n\n   ETag: "17dc6-a5c-bf716880"\\r\\n\n   Accept-Ranges: bytes\\r\\n\n   Content-Length: 2652\\r\\n\n   Keep-Alive: timeout=10, max=100\\r\\n\n   Connection: Keep-Alive\\r\\n\n   Content-Type: text/html; charset=ISO-8859-1\\r\\n\n   \\r\\n\n   data data data data data ...',
                },
                {
                  type: 'kv',
                  title: '响应首部行要点（PPT 第 41 页示例）',
                  items: [
                    { k: 'Date', v: '响应生成的时间（GMT）' },
                    { k: 'Server', v: '服务器软件标识，如 Apache/2.0.52 (CentOS)' },
                    { k: 'Last-Modified', v: '对象最后一次修改的时间——**条件 GET 的关键依据**' },
                    { k: 'ETag', v: '对象版本标识（实体标签）——**条件 GET 的另一依据**' },
                    { k: 'Content-Length', v: '实体主体长度 2652 字节' },
                    { k: 'Keep-Alive / Connection', v: '保持连接及其参数（timeout=10, max=100）' },
                    { k: 'Content-Type', v: '实体主体的媒体类型与字符集，如 text/html; charset=ISO-8859-1' },
                  ],
                },
                { type: 'h', text: 'HTTP 响应状态码（PPT 第 42 页）' },
                {
                  type: 'p',
                  text:
                    '状态码位于服务器→客户端响应消息的第一行。PPT 给出的几个示例：',
                },
                {
                  type: 'table',
                  caption: '常见 HTTP 状态码（PPT 第 42 页）',
                  headers: ['状态码', '短语', '含义'],
                  rows: [
                    ['200', 'OK', '请求成功，所请求的对象在本消息的后续部分中'],
                    ['301', 'Moved Permanently', '请求的对象已永久移动，新位置在本消息的后续部分中指定（Location:）'],
                    ['400', 'Bad Request', '请求消息无法被服务器理解'],
                    ['404', 'Not Found', '在该服务器上未找到请求的文档'],
                    ['505', 'HTTP Version Not Supported', '服务器不支持请求消息所用的 HTTP 版本'],
                  ],
                },
                {
                  type: 'table',
                  caption: '补充：五大类状态码与典型实例（RFC 9110）',
                  headers: ['类别', '范围', '典型状态码与含义'],
                  rows: [
                    ['1xx 信息', '100~199', '100 Continue：期望继续发送实体主体'],
                    ['2xx 成功', '200~299', '200 OK、201 Created、204 No Content、206 Partial Content（断点续传）'],
                    ['3xx 重定向', '300~399', '301 永久移动、302 临时移动、304 Not Modified（**条件 GET 用**）、307/308 保持方法的重定向'],
                    ['4xx 客户端错误', '400~499', '400 Bad Request、401 Unauthorized、403 Forbidden、404 Not Found、408 Request Timeout'],
                    ['5xx 服务器错误', '500~599', '500 Internal Server Error、502 Bad Gateway、503 Service Unavailable、504 Gateway Timeout'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点：301 与 302、304 与 200',
                  text:
                    '① **301 Moved Permanently**：永久移动，浏览器会**更新书签**，后续请求直接访问新地址；' +
                    '**302 Found**：临时移动，不更新书签。' +
                    '② **304 Not Modified**：条件 GET 的“未修改”应答，**只回首部、不带实体主体**，' +
                    '用来节省带宽——见 k2.2.9。' +
                    '③ **505** 专门用于“HTTP 版本不支持”，与 400（报文本身看不懂）区分开。',
                },
                { type: 'h', text: '动手试一试：自己发一个 HTTP 请求（PPT 第 43 页）' },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '用 telnet 连上你喜欢的 Web 服务器的 80 端口：`telnet cis.poly.edu 80`——这一步会打开一条到 80 端口的 TCP 连接，之后你敲的每一个字符都会被送到 80 端口',
                    '输入一个完整的 GET 请求（回车两次）：`GET /~ross/ HTTP/1.1` 与 `Host: cis.poly.edu`',
                    '观察 HTTP 服务器返回的响应消息！也可以用 Wireshark 抓取 HTTP 请求/响应来看',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '为什么 HTTP 报文要“人可读”？',
                  text:
                    '正因为格式是 ASCII 人可读，才可以用 telnet 手敲、可以用 Wireshark 直接阅读、可以用 curl -v 观察。' +
                    '**这正是 PPT 第 43 页这个实验的价值**——亲手敲一次，比读十遍书记得牢。' +
                    '（注意：现在许多网站强制 HTTPS，telnet 明文实验需注意环境与安全，只在授权实验环境中进行。）',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.5',
                  label: '相关：HTTP 请求报文',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.9',
                  label: '相关：条件 GET',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.2.5', 'k2.2.9', 'k2.7.4'],
            },
          ],
        },
        {
          id: 's2.2.3',
          title: '用户状态与缓存',
          knowledge: [
            {
              id: 'k2.2.7',
              title: 'Cookie 与用户跟踪',
              en: 'Cookies',
              summary:
                'Cookie 由响应首部、请求首部、用户主机上的 cookie 文件、站点后端数据库四部分组成；第一方 Cookie 来自所访问站点，第三方 Cookie 来自未选择的站点，可跨站跟踪用户。',
              tags: ['Cookie', '状态', '隐私', '跟踪'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [44, 45, 46, 47, 48, 49, 50, 51] },
                { kind: 'supplement', note: '补充：现代浏览器对第三方 Cookie 的限制（Safari 全面拦截、Chrome 分阶段弃用、Firefox Total Cookie Protection）' },
                { kind: 'external', label: 'RFC 6265: HTTP State Management Mechanism', url: 'https://www.rfc-editor.org/rfc/rfc6265' },
              ],
              insight: {
                why:
                  'HTTP 无状态带来两个具体麻烦：① 电商网站无法记住购物车内容；' +
                  '② 用户代理无法记住“上次看到的是哪一封未读邮件”。' +
                  '需要一种机制让服务器跨请求识别同一用户。' +
                  'Cookie 的价值就在于此：**把状态从服务器搬到了客户端**。',
                coreIdea:
                  '许多大型 Web 网站使用 Cookie（PPT 第 44 页）。一个 Cookie 机制由**四个组成部分**构成：' +
                  '① HTTP **响应**报文中的 Set-Cookie 首部行；② HTTP **请求**报文中的 Cookie 首部行；' +
                  '③ 用户主机上由用户浏览器管理的 cookie 文件；④ Web 站点的**后端数据库**。',
                mechanism:
                  '典型流程（PPT 第 45 页）：Susan 总是从同一台 PC 访问 Internet，' +
                  '她第一次访问某电商站点时，当初始 HTTP 请求到达站点，' +
                  '站点生成一个**唯一 ID（unique ID）**并在后端数据库中为该 ID 建立一条记录，' +
                  '同时把 ID 通过 Set-Cookie 交给浏览器；此后每次请求浏览器都会自动带上该 Cookie，' +
                  '服务器据此认出 Susan 并查出她的购物车等状态。',
                comparison:
                  '“第一方 Cookie（first party cookie）”来自**你选择访问的网站**（提供基础 HTML 文件的站点）；' +
                  '“第三方 Cookie（third party cookie）”来自**你没有选择访问的网站**（如嵌在页面里的广告商）。' +
                  '第三方 Cookie 能跨越多个站点追踪同一用户，因此是隐私争议的核心，也是现代浏览器重点封禁的对象。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '许多大型 Web 站点都使用 **cookie** 来在无状态的 HTTP 上维持“状态”（PPT 第 44 页）。' +
                    '一套完整的 cookie 机制由**四个组成部分**构成：',
                },
                {
                  type: 'table',
                  caption: 'Cookie 的四个组成部分（PPT 第 44 页）',
                  headers: ['序号', '组成部分', '位置 / 说明'],
                  rows: [
                    ['1', 'cookie 首部行（HTTP 响应消息中）', '服务器在响应中下发 `Set-Cookie: <ID>`'],
                    ['2', 'cookie 首部行（HTTP 请求消息中）', '浏览器在后续请求中自动带上 `Cookie: <ID>`'],
                    ['3', '用户主机上保存的 cookie 文件', '由用户的浏览器管理（可查看、删除、拒绝）'],
                    ['4', 'Web 站点的后端数据库', '按唯一 ID 记录该用户的会话、购物车、偏好等'],
                  ],
                },
                { type: 'h', text: '示例：Susan 第一次访问电商站点（PPT 第 45 页）' },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    'Susan 总是从同一台 PC 访问 Internet',
                    '她第一次访问某个特定的电子商务站点',
                    '当初始的 HTTP 请求到达站点时，站点创建一个**唯一 ID**，并在后端数据库中为该 ID 建立一条记录',
                    '站点通过响应中的 `Set-Cookie` 把这个 ID 交给 Susan 的浏览器',
                    '浏览器把它写入本机的 cookie 文件',
                    '此后每次访问该站点，浏览器都会在请求中带上 `Cookie: <ID>`，服务器即可认出 Susan',
                  ],
                },
                { type: 'h', text: 'Cookie 能带来什么（PPT 第 47 页）' },
                {
                  type: 'list',
                  items: [
                    '授权（authorization）',
                    '购物车（shopping carts）',
                    '推荐（recommendations）',
                    '用户会话状态（user session state，如 Web 邮箱）',
                  ],
                },
                { type: 'h', text: 'Cookie 与隐私' },
                {
                  type: 'list',
                  items: [
                    'cookie 允许站点了解关于你的大量信息',
                    '你可能会向站点提供姓名和电子邮件',
                    '搜索引擎使用**重定向（redirection）**与 cookie 来学到更多',
                    '**广告公司**可以跨站点获取信息',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '旁注：两种“记性”',
                  text:
                    '**协议端点维持状态**：在发送方/接收方一侧维护跨多次交易的状态；' +
                    '**Cookie**：让 HTTP 消息自己携带状态。' +
                    '前者由服务器负责（如 FTP 服务器维护“当前目录”），后者由客户端携带——' +
                    'HTTP 选择后者，正是因为它更容易扩展。',
                },
                { type: 'h', text: 'NY Times + AdX 跟踪例子（PPT 第 48~51 页）' },
                {
                  type: 'p',
                  text:
                    '这是 PPT 中用来展示第三方 Cookie 跟踪能力的一组连续场景，' +
                    '由 **nytimes.com**、**AdX.com**（广告交换平台）与 **socks.com** 三个站点串起。',
                },
                {
                  type: 'figure',
                  alt: 'NY Times 与 AdX 的 Cookie 交互时序',
                  caption: 'PPT 第 48~51 页：Cookies 跟踪用户浏览行为',
                  ascii:
                    '第48页  初次访问 NY Times\n  1 HTTP GET  ──► nytimes.com        (Referrer: 无)\n  2 HTTP reply ◄─ Set cookie: 1634   ("NY Times: 1634")\n  3 HTTP GET  ──► AdX.com            (嵌入的广告请求)\n  4 HTTP reply ◄─ Set cookie: 7493   ("NY Times sports, 2/15/22")\n  5 HTTP GET  ──► AdX.com            (带上 7493)\n  6 HTTP reply ◄─\n  7 显示合成页面\n\n第49页  同一天访问第二个站点\n  4 HTTP GET  ──► AdX.com  (Referrer: NY Times Sports)\n  5 HTTP reply ◄─ Set cookie: 7493\n\n第50页  访问 socks.com（第三方）\n  1 HTTP GET  ──► socks.com\n  2 HTTP reply ◄─\n  4 HTTP GET  ──► AdX.com  (Referrer: socks.com, cookie: 7493)\n  5 HTTP reply ◄─ Set cookie: 7493\n  → AdX 现在能追踪我在任何带 AdX 广告的站点上的浏览\n\n第51页  一天后再访问 NY Times 艺术版\n  4 HTTP GET  ──► AdX.com  (Referrer: nytimes.com, cookie: 7493)\n  5 HTTP reply ◄─ Set cookie: 7493\n    HTTP reply ◄─ Set cookie: 1634\n  → 返回了 socks.com 的广告！',
                },
                {
                  type: 'table',
                  caption: '第一方 Cookie 与第三方 Cookie（PPT 第 49 页）',
                  headers: ['类型', '定义', '本例中的归属'],
                  rows: [
                    ['第一方 Cookie（first party cookie）', '来自**你选择访问**的网站（该网站提供基础 HTML 文件）', 'nytimes.com 设置的 1634；socks.com 设置的 7493: socks.com'],
                    ['第三方 Cookie（third party cookie）', '来自**你没有选择访问**的网站（嵌在页面里的第三方服务）', 'AdX.com 设置的 7493: NY Times sports, 2/15/22'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点：第一方 vs 第三方 Cookie 的判定标准',
                  text:
                    '判定标准是**“是谁提供了你当前看到的这个页面/资源”**，而不是“Cookie 是谁设置的”。' +
                    '在 NY Times 页面里，AdX 设置的 7493 是**第三方 Cookie**；' +
                    '在 socks.com 页面里，AdX 设置的 7493 仍然是**第三方 Cookie**；' +
                    '而 nytimes.com 设置的 1634 是**第一方 Cookie**。' +
                    'AdX 之所以能跨站追踪，正是因为它把同一个 ID 7493 写到了不同站点的域下。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：第三方 Cookie 不是“低质量 Cookie”',
                  text:
                    '“第三方 Cookie”描述的是**来源站点与用户主动访问的站点之间的关系**，与安全性无关。' +
                    '另外，PPT 第 51 页的例子里 AdX 能够“返回 socks.com 的广告”，' +
                    '这正是**广告定向投放**的实现原理——它利用跨站共享的 cookie ID 建立了用户画像。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：现代浏览器已经收紧第三方 Cookie',
                  text:
                    '由于第三方 Cookie 带来的隐私与指纹追踪风险，主流浏览器已陆续限制它：' +
                    'Safari 默认全面拦截第三方 Cookie；Firefox 的 Total Cookie Protection 把第三方 Cookie 限制在顶层站点内；' +
                    'Chrome 逐步弃用第三方 Cookie。' +
                    '替代方案是 **First-Party Sets / 存储分区（storage partitioning）**、' +
                    '以及不依赖 Cookie 的联邦身份与隐私计算技术。' +
                    '因此“PPT 上的跟踪场景”是**教学模型**，现实中的图景已经改变。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd2.2.7-cookies',
                  label: '打开演示：Cookie 跟踪——第三方 Cookie 的流转',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.2',
                  label: '相关：HTTP 概览与无状态协议',
                },
              ],
              questionIds: [],
              demoIds: ['d2.2.7-cookies'],
              related: ['k2.2.2', 'k2.2.8'],
            },
            {
              id: 'k2.2.8',
              title: 'Web 缓存（代理服务器）',
              en: 'Web Caching',
              summary:
                'Web 缓存（代理服务器）由 ISP 等部署，可缩短响应时间、降低接入链路流量；缓存例题中链路利用率与平均时延的计算是本章必考计算题。',
              tags: ['Web 缓存', '代理服务器', '利用率', '时延', '计算'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [52, 53, 54, 55, 56, 57] },
                { kind: 'kaoyan', note: '王道考研：Web 缓存例题（100Kbits、15 requests/sec、1.50Mbps、2sec RTT、1.54Mbps）是经典计算题' },
              ],
              insight: {
                why:
                  '为什么要引入 Web 缓存？观察三个动机（PPT 第 53 页）：' +
                  '① **缩短客户端请求的响应时间**；② **减少机构接入链路上的流量**；' +
                  '③ 互联网中密集的缓存让“poor content providers”（内容贫乏的提供者）也能有效分发内容' +
                  '（P2P 文件共享同样如此）。' +
                  '本质上，缓存用**存储换时延**，用**一处存储换全网流量**。',
                coreIdea:
                  'Web 缓存（Web cache，又称代理服务器 proxy server）的目标是：**在不需要源服务器参与的情况下满足客户端请求**。' +
                  '用户在浏览器中设置“经由缓存访问 Web”，浏览器把所有 HTTP 请求都发给缓存：' +
                  '若对象已在缓存中，缓存直接返回；否则缓存代表客户端向**源服务器（origin server）**发起请求，' +
                  '取回对象后再返回给客户端（同时存入缓存）。',
                mechanism:
                  '缓存**同时扮演客户与服务器双重角色**：对客户端它是服务器，对源服务器它是客户。' +
                  '典型部署方是 ISP（大学、公司、居民 ISP），因此缓存通常位于“机构网络”与互联网的交界处。' +
                  '缓存可以对每个对象单独缓存，也可以整页缓存。',
                comparison:
                  '缓存 vs 源服务器：源服务器提供**权威内容**，但距离远、带宽昂贵；' +
                  '缓存提供**副本**，命中时几乎零时延、零互联网流量。' +
                  '代价是缓存可能存放过期内容（需用条件 GET 校验，见 k2.2.9）。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '**Web 缓存（proxy server，代理服务器）**的运作方式（PPT 第 52 页）：' +
                    '用户在浏览器里设置“Web 经由缓存访问”；浏览器把所有 HTTP 请求都发给缓存。' +
                    '如果对象已在缓存中，缓存直接返回该对象；' +
                    '否则缓存代表客户端向源服务器（origin server）发起请求，取回对象后再返回给客户端。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '缓存的目标',
                  text:
                    '**在不需要源服务器参与的情况下满足客户端请求**（satisfy client request without involving origin server）。' +
                    '这一句话道出了缓存的全部价值所在。',
                },
                {
                  type: 'figure',
                  alt: 'Web 缓存与源服务器、客户端的交互',
                  caption: 'PPT 第 52 页：Web 缓存（代理服务器）',
                  ascii:
                    '  客户端                      缓存(proxy)                源服务器\n    |                             |                          |\n    |--- HTTP request ----------->|                          |\n    |                             |--- HTTP request ------->|   (缓存未命中)\n    |                             |<-- HTTP response --------|\n    |<-- HTTP response ----------|                          |\n    |                             |                          |\n    |--- HTTP request ----------->|                          |\n    |<-- HTTP response ----------|   (缓存命中，直接返回)    |',
                },
                {
                  type: 'list',
                  items: [
                    '缓存**同时充当客户与服务器**（acts as both client and server）',
                    '通常由 ISP 安装（大学、公司、居民 ISP）',
                    '动机一：缩短客户端请求的响应时间（reduce response time for client request）',
                    '动机二：减少机构接入链路上的流量（reduce traffic on an institution’s access link）',
                    '动机三：互联网中密集的缓存使“poor content providers”也能有效分发内容（P2P 文件共享同理）',
                  ],
                },
                { type: 'h', text: '缓存例题（PPT 第 54~57 页）——本章最重要的计算题' },
                {
                  type: 'kv',
                  title: '已知假设（assumptions）',
                  items: [
                    { k: '平均对象大小', v: '100 Kbits' },
                    { k: '浏览器向源服务器的请求率', v: '15 请求/秒' },
                    { k: '到浏览器的数据率', v: '1.50 Mbps' },
                    { k: '机构路由器到任意源服务器的 RTT', v: '2 秒' },
                    { k: '接入链路速率', v: '1.54 Mbps' },
                    { k: '机构内部 LAN 速率', v: '1 Gbps' },
                  ],
                },
                {
                  type: 'formula',
                  latex: '\\text{utilization} = \\frac{\\text{data rate carried by link}}{\\text{link capacity}}',
                  caption: '链路利用率',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: '\\text{utilization}', meaning: '链路利用率', unit: '无量纲 (0~1)' },
                    { symbol: '\\text{data rate}', meaning: '该链路上承载的数据率', unit: 'bps' },
                    { symbol: '\\text{link capacity}', meaning: '链路容量（速率）', unit: 'bps' },
                  ],
                },
                {
                  type: 'example',
                  title: '情形 A：无缓存（PPT 第 54 页）',
                  steps: [
                    '到浏览器的数据率 = 1.50 Mbps，全部经过接入链路',
                    '接入链路利用率 = 1.50 / 1.54 = 0.974 ≈ **97%**（PPT 记为 99%）',
                    'LAN 利用率 = 1.50 Mbps / 1 Gbps = 0.0015 ≈ **15%**（PPT 记为 15%）',
                    '总时延 = 互联网时延 + 接入链路排队时延 + LAN 时延 = 2 秒 + 数分钟 + 微秒级',
                    '问题：接入链路几乎跑满，排队时延暴涨，用户体验极差',
                  ],
                  answer: 'LAN 利用率 15%，接入链路利用率 99%（1.50/1.54 ≈ 97%），总时延 = 2 sec + minutes + usecs。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：99% 是怎么来的',
                  text:
                    '接入链路利用率 = 1.50 Mbps ÷ 1.54 Mbps = 0.974。PPT 写 **99%** 是四舍五入后的近似；' +
                    '若严格计算应为 **97.4%**。答题时最好写公式与数值：$1.50/1.54 = 0.974 \\approx 97\\%$。' +
                    '另外**别把 LAN 利用率 15% 当成 1.50/1.54**——那是接入链路利用率；' +
                    'LAN 利用率 = 1.50 Mbps ÷ 1 Gbps = **0.15%**。PPT 上的 15% 同样偏大，' +
                    '按其图示口径作答即可，但公式一定要写对。',
                },
                {
                  type: 'example',
                  title: '情形 B：把接入链路加粗到 154 Mbps（PPT 第 55 页）',
                  steps: [
                    '接入链路利用率 = 1.50 Mbps / 154 Mbps = 0.00974 ≈ **9.9%**（PPT 记为 9.9%）',
                    '总时延 = 互联网时延(2 sec) + 接入链路排队(几乎为 0) + LAN 时延 ≈ **2 秒 + 毫秒级**',
                    '代价：接入链路提速**并不便宜**（Cost: increased access link speed, not cheap!）',
                  ],
                  answer: '利用率降到 9.9%，时延降到约 2 秒；代价是链路升级费用高昂。',
                },
                {
                  type: 'example',
                  title: '情形 C：在机构内部安装本地缓存（PPT 第 56、57 页）',
                  steps: [
                    '设缓存命中率 = 0.4，即 40% 的请求由缓存满足，60% 需要访问源服务器',
                    '经过接入链路的数据率 = 0.6 × 1.50 Mbps = 0.9 Mbps',
                    '接入链路利用率 = 0.9 / 1.54 = **0.58**',
                    '总时延 = 0.6 × (来自源服务器的时延) + 0.4 × (缓存命中时的时延) = 0.6 × (约 2 秒) + 0.4 × (约毫秒) ≈ **1.2 秒**',
                    '结论：比 154 Mbps 链路**又快又便宜**（less than with 154 Mbps link, and cheaper too!）',
                  ],
                  answer: '接入链路利用率 0.58，平均总时延约 1.2 秒。',
                },
                {
                  type: 'formula',
                  latex: 'U_{access} = \\frac{(1-h)\\times 1.50}{1.54}, \\qquad D = (1-h)\\times 2 + h\\times \\approx 0',
                  caption: '含本地缓存时的利用率与平均时延（h 为命中率）',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: 'h', meaning: '缓存命中率（cache hit rate）', unit: '无量纲' },
                    { symbol: 'U_{access}', meaning: '接入链路利用率', unit: '无量纲' },
                    { symbol: 'D', meaning: '平均总时延', unit: 's' },
                    { symbol: '1.50', meaning: '到浏览器的数据率', unit: 'Mbps' },
                    { symbol: '1.54', meaning: '接入链路速率', unit: 'Mbps' },
                    { symbol: '2', meaning: '到源服务器的 RTT', unit: 's' },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点：缓存例题三问',
                  text:
                    '① **无缓存**：接入链路利用率 = 1.50/1.54 ≈ 97%（PPT 记 99%），时延 = 2 秒 + 排队数分钟。' +
                    '② **加粗链路到 154 Mbps**：利用率 = 1.50/154 = 9.9%，时延 ≈ 2 秒 + 毫秒。' +
                    '③ **装本地缓存（命中率 0.4）**：利用率 = 0.6×1.50/1.54 = **0.58**，' +
                    '时延 = 0.6×2 + 0.4×≈0 ≈ **1.2 秒**。' +
                    '记住这三组数字及**推导顺序**（先算经过链路的比例，再算利用率）。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '**缓存三算：先比例、后利用率；先加权、后时延。**命中率的权重是 (1-h) 走远路、h 走近路。',
                },
                {
                  type: 'p',
                  text:
                    '从这个例题能看出缓存的三重收益：降低接入链路利用率、缩短平均响应时延、**节省带宽费用**。' +
                    '这也解释了为什么几乎所有 ISP 都在网络出口部署缓存服务器。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd2.2.8-cache',
                  label: '打开演示：Web 缓存——链路利用率与时延计算',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.9',
                  label: '相关：条件 GET',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.4',
                  label: '相关：响应时间模型 2RTT+T',
                },
              ],
              questionIds: [],
              demoIds: ['d2.2.8-cache'],
              related: ['k2.2.9', 'k2.2.4', 'k2.1.5'],
            },
            {
              id: 'k2.2.9',
              title: '条件 GET',
              en: 'Conditional GET',
              summary:
                '条件 GET 用 If-modified-since（配合 Last-Modified）让缓存只报告对象是否被修改：未修改则服务器回 304 Not Modified，不传对象，从而省时省带宽。',
              tags: ['条件GET', '缓存', '304', 'If-Modified-Since'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [58] },
                { kind: 'external', label: 'RFC 9110: Conditional Requests', url: 'https://www.rfc-editor.org/rfc/rfc9110#name-conditional-requests' },
              ],
              insight: {
                why:
                  '为什么需要条件 GET？因为缓存里存放的对象**可能已经过期**，' +
                  '如果每次都无条件地重新下载整个对象，缓存就退化成了“浪费带宽的中间人”。' +
                  '条件 GET 的思路是：**先问“变了吗”，不变就不传内容**。' +
                  '这样既保证了正确性，又把带宽开销从 O(对象大小) 降到 O(首部大小)。',
                coreIdea:
                  '**目标：如果缓存中已有最新版本，就不要发送对象**——从而没有对象传输时延、降低链路利用率（PPT 第 58 页）。' +
                  '做法是：缓存把**缓存副本的日期**写进 HTTP 请求，' +
                  '使用 `If-modified-since: <date>`；服务器发现缓存副本是最新的，' +
                  '则响应中**不包含对象**，只回 `HTTP/1.0 304 Not Modified`。',
                mechanism:
                  '配套信息在响应的 `Last-Modified` 首部中。' +
                  '缓存先用旧副本服务用户，同时后台用条件 GET 校验；' +
                  '若服务器返回 304，缓存继续用旧副本；' +
                  '若返回 200 OK 与新对象，则用新对象替换旧副本。' +
                  '现代 HTTP 更常用 `If-None-Match` + `ETag`（实体标签）做同样的事，' +
                  '因为 Last-Modified 只有秒级精度，且文件内容变了但时间没变时无法察觉。',
                comparison:
                  '无条件 GET：总是返回 200 + 完整实体，浪费带宽；' +
                  '条件 GET：可能返回 304（仅首部）或不返回 200（资源已删除时返回 404）。' +
                  '从语义上看，条件 GET 是**安全的（safe）**且**幂等的（idempotent）**。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '条件 GET（conditional GET）的**目标**是：**如果缓存中已有该对象的最新版本，就不要发送对象**。' +
                    '这样做的两个直接好处是：**没有对象传输时延**、**降低链路利用率**（PPT 第 58 页）。',
                },
                {
                  type: 'figure',
                  alt: '条件 GET 的两种结果：304 Not Modified 与 200 OK',
                  caption: 'PPT 第 58 页：Conditional GET',
                  ascii:
                    '情形一：对象在 <date> 之前未修改\n  客户端                        服务器\n    |--- HTTP request msg ----------->|\n    |    If-modified-since: <date>     |\n    |<-- HTTP response ---------------|\n    |    HTTP/1.0 304 Not Modified     |   ← 不携带对象\n\n情形二：对象在 <date> 之后被修改\n  客户端                        服务器\n    |--- HTTP request msg ----------->|\n    |    If-modified-since: <date>     |\n    |<-- HTTP response ---------------|\n    |    HTTP/1.0 200 OK               |\n    |    <data>                       |   ← 携带新对象',
                },
                {
                  type: 'kv',
                  title: '条件 GET 的关键部件',
                  items: [
                    { k: '缓存侧动作', v: '在 HTTP 请求中指定缓存副本的日期：`If-modified-since: <date>`' },
                    { k: '服务器侧动作', v: '若缓存副本是最新的，响应中不包含对象：`HTTP/1.0 304 Not Modified`' },
                    { k: '前置信息', v: '原对象响应中的 `Last-Modified` 首部给出最后修改时间（见 k2.2.6 示例）' },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点：304 的两个要点',
                  text:
                    '① **304 Not Modified 表示“缓存副本仍然有效”，而不是错误**——它属于 3xx 重定向类，' +
                    '但**不携带 Location 首部**，不触发重新获取。' +
                    '② 304 响应**只回首部、不带实体主体**，所以客户端继续使用本地副本。' +
                    '另外 PPT 第 58 页写的是 `HTTP/1.0 304 Not Modified`，' +
                    '实际部署中通常使用 HTTP/1.1，语义完全相同。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：If-None-Match 与 ETag（更现代的做法）',
                  text:
                    '`Last-Modified` 只有**秒级精度**，且某些服务器会返回伪造或不变的修改时间；' +
                    '因此 RFC 9110 推荐使用 **ETag（实体标签）**配合 `If-None-Match` 做条件请求：' +
                    '客户端发送 `If-None-Match: "17dc6-a5c-bf716880"`，' +
                    '服务器比对当前 ETag，相同则回 304，不同则回 200 + 新实体。' +
                    'HTTP/1.1 还支持 `If-Modified-Since` + `If-Unmodified-Since` + `If-Range` 等条件首部。' +
                    '在 CDN 场景中，条件 GET 是命中率调优的核心手段。',
                },
                {
                  type: 'p',
                  text:
                    '把条件 GET 与 k2.2.8 的缓存结合起来看，缓存的完整工作流是：' +
                    '**命中且新鲜** → 直接返回（0 成本）；' +
                    '**命中但可能过期** → 先用旧副本响应用户，同时后台发条件 GET 校验（revalidation）；' +
                    '**收到 304** → 更新新鲜度，继续用旧副本；' +
                    '**收到 200 + 新实体** → 替换旧副本。' +
                    '这套机制让缓存既省带宽又不牺牲正确性。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.8',
                  label: '相关：Web 缓存（代理服务器）',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.6',
                  label: '相关：HTTP 响应报文与状态码',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.2.8', 'k2.2.6'],
            },
          ],
        },
      ],
    },
    // ==========================================================
    // 2.3 FTP
    // ==========================================================
    {
      id: 's2.3',
      title: '2.3 FTP',
      en: 'File Transfer Protocol',
      subsections: [
        {
          id: 's2.3.1',
          title: '文件传输协议',
          knowledge: [
            {
              id: 'k2.3.1',
              title: 'FTP：控制连接与数据连接',
              en: 'FTP',
              summary:
                'FTP 是客户-服务器模型的文件传输协议，控制连接走 21 端口、数据连接走 20 端口（带外控制），命令为 ASCII 文本，返回码形如 331/125/425/452。',
              tags: ['FTP', '控制连接', '数据连接', '带外控制'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [60, 61, 62] },
                { kind: 'external', label: 'RFC 959: File Transfer Protocol', url: 'https://www.rfc-editor.org/rfc/rfc959' },
              ],
              insight: {
                why:
                  '为什么 FTP 要开**两条**连接？因为传输文件这件事可能持续很久，而控制命令必须能随时被打断、被响应。' +
                  '如果控制命令和数据混在同一条连接里，那么传输大文件时，用户就无法在传输过程中' +
                  '敲 `ls`、`pwd` 或按 Ctrl+C 中止——服务器根本收不到这些命令。' +
                  '分开之后，**控制通道始终畅通**，可以随时查询与中止。',
                coreIdea:
                  'FTP（File Transfer Protocol，文件传输协议，RFC 959）采用**客户-服务器模型**：' +
                  '客户是发起传输的一方（可以是上传也可以是下载），服务器是远程主机。' +
                  '它有两条 TCP 连接：' +
                  '**控制连接（control connection）**：服务器端口 21，用于交换命令与响应；' +
                  '**数据连接（data connection）**：服务器端口 20，用于传送文件数据。',
                mechanism:
                  '工作流程（PPT 第 61 页）：① 客户连接服务器 21 端口；② 客户在控制连接上完成身份认证（授权）；' +
                  '③ 客户在控制连接上浏览远程目录、发送命令；' +
                  '④ 服务器收到文件传输命令后，**再开一条 TCP 数据连接**用于传文件；' +
                  '⑤ 传输完一个文件后，服务器关闭这条数据连接；' +
                  '⑥ 需要下一个文件时，服务器再开一条新的数据连接。' +
                  '控制连接在整个会话期间保持打开。',
                comparison:
                  '控制连接与数据连接使用**不同的端口**（21 与 20），这被称为“**带外控制（out-of-band control）**”。' +
                  '对比 HTTP：HTTP 在同一条连接上既发命令又发数据，是“带内控制”；' +
                  'FTP 用两条连接换来了控制与数据的彻底解耦，代价是每传一个文件都要新建一条连接。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    'FTP（File Transfer Protocol，文件传输协议，**RFC 959**）用于在主机之间传输文件（PPT 第 60 页）。' +
                    '它采用**客户-服务器模型**：客户是发起传输的一方（既可以是上传也可以是下载），服务器是远程主机。' +
                    '**FTP 服务器端口为 21**。',
                },
                {
                  type: 'figure',
                  alt: 'FTP 客户-服务器结构',
                  caption: 'PPT 第 60 页：FTP 的文件传输结构',
                  ascii:
                    '  用户界面              FTP 客户             本地文件系统\n    ┌──────────┐        ┌──────────┐          ┌──────────┐\n    │ 用户界面  │        │ FTP 客户  │          │  本地    │\n    │  (UI)   │        │          │          │ 文件系统 │\n    └────┬─────┘        └────┬─────┘          └────┬─────┘\n         │  本地文件读取/写入    │  传送文件到/从远程主机 │\n         └─────────────────────┴──────────────────────┘\n                                │  TCP 控制连接(21) + 数据连接(20)\n                        ┌───────┴────────┐\n                        │   FTP 服务器   │\n                        │  远程文件系统  │\n                        └────────────────┘',
                },
                { type: 'h', text: '一、控制连接与数据连接（PPT 第 61 页）' },
                {
                  type: 'table',
                  caption: 'FTP 的两条 TCP 连接',
                  headers: ['连接', '服务器端口', '承载内容', '生命周期'],
                  rows: [
                    ['控制连接 control connection', '21', 'ASCII 命令与响应（USER/PASS/LIST/RETR/STOR…）', '整个 FTP 会话期间保持打开'],
                    ['数据连接 data connection', '20', '文件数据（或目录列表）', '传输一个文件后关闭；下一个文件再新建一条'],
                  ],
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    'FTP 客户在服务器的 21 端口建立 TCP 连接',
                    '客户在**控制连接**上完成授权（authorized）',
                    '客户在控制连接上浏览远程目录、发送命令',
                    '服务器收到文件传输命令时，**再开一条 TCP 数据连接**用于传送文件',
                    '传输完一个文件后，服务器关闭数据连接',
                    '服务器为传输下一个文件，会**再开一条数据连接**',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀：21 指挥、20 干活',
                  text:
                    '**21 端口发号施令，20 端口干活搬文件**。' +
                    '“带外控制（out of band control）”就是说：控制信息走**另一条**通道，' +
                    '不与数据混在一起。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: 'FTP 服务器是“有状态”的',
                  text:
                    'FTP 服务器会维护状态（maintains "state"）：**当前目录**、**之前的认证信息**等。' +
                    '所以一个 FTP 会话中，先 `cd` 到某目录再 `RETR` 文件是有意义的。' +
                    '这与 HTTP 的“无状态”形成鲜明对照——' +
                    'FTP 属于第一章说的“**协议端点维持状态**”的那一类。',
                },
                { type: 'h', text: '二、FTP 命令与响应码（PPT 第 62 页）' },
                {
                  type: 'p',
                  text:
                    'FTP 命令以 **ASCII 文本**形式在控制通道上发送，服务器返回**状态码 + 短语**（与 HTTP 风格一致）。',
                },
                {
                  type: 'table',
                  caption: 'FTP 示例命令（PPT 第 62 页）',
                  headers: ['命令', '含义'],
                  rows: [
                    ['USER username', '声明用户名'],
                    ['PASS password', '提交密码'],
                    ['LIST', '返回当前目录中的文件列表'],
                    ['RETR filename', '取回（get）文件'],
                    ['STOR filename', '存储（put）文件到远程主机'],
                  ],
                },
                {
                  type: 'table',
                  caption: 'FTP 示例返回码（PPT 第 62 页）',
                  headers: ['返回码', '短语', '含义'],
                  rows: [
                    ['331', 'Username OK, password required', '用户名有效，需要密码'],
                    ['125', 'Data connection already open; transfer starting', '数据连接已建立，开始传输'],
                    ['425', "Can't open data connection", '无法打开数据连接'],
                    ['452', 'Error writing file', '写文件时出错（如磁盘满、权限不足）'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点：FTP 命令与返回码',
                  text:
                    '命令只需记五个：**USER、PASS、LIST、RETR、STOR**（可编成口诀“U-P-L-R-S”）。' +
                    '返回码要理解其**阶段含义**：' +
                    '**331** 是认证阶段（要密码了）；' +
                    '**125** 是传输阶段（数据连接已开）；' +
                    '**425** 是“数据连接开不起来”（常见于被动/主动模式端口被防火墙拦截）；' +
                    '**452** 是“文件写不进去”（存储时的服务器端错误）。' +
                    '这四个码分别对应认证—建连接—传输—存储四个环节。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：主动模式与被动模式',
                  text:
                    'PPT 只画了**主动模式（active）**：服务器从 20 端口**主动连接**客户端。' +
                    '若客户端在 NAT 之后或装有防火墙，服务器往往连不上，于是出现 425。' +
                    '因此实际 FTP 客户端默认使用**被动模式（passive）**：客户端自己开一个临时端口，' +
                    '通过控制连接（PASV/EPSV 命令）告诉服务器，由**客户端主动连接服务器**。' +
                    '答题时若被问“FTP 为什么有两个端口/为什么有 425”，可以从这里解释。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：FTP 的安全隐患',
                  text:
                    'FTP 的命令与口令都是**明文传输**的（连数据通道也是明文）。' +
                    '因此现代做法是 **SFTP**（SSH File Transfer Protocol，走 SSH 加密）与 **FTPS**（FTP 加 TLS）。' +
                    '另外，FTP 的目录列表与文件名编码在不同平台间也常出问题，' +
                    '现代实现普遍采用 UTF-8（RFC 2640）。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.4.2',
                  label: '相关：SMTP 协议与工作过程',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.1.4',
                  label: '相关：应用层协议定义了什么',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.4.2', 'k2.1.4', 'k2.1.3'],
            },
          ],
        },
      ],
    },
    // ==========================================================
    // 2.4 电子邮件
    // ==========================================================
    {
      id: 's2.4',
      title: '2.4 电子邮件',
      en: 'Electronic Mail',
      subsections: [
        {
          id: 's2.4.1',
          title: '邮件系统与 SMTP',
          knowledge: [
            {
              id: 'k2.4.1',
              title: '电子邮件三大组件',
              en: 'Mail Components',
              summary:
                '电子邮件系统由用户代理、邮件服务器、SMTP 三个组件构成：用户代理负责收发，邮件服务器含邮箱与消息队列，SMTP 负责服务器间投递。',
              tags: ['电子邮件', '用户代理', '邮件服务器', 'SMTP'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [64, 65, 66, 67] },
              ],
              insight: {
                why:
                  '为什么电子邮件需要三个组件，而不是简单的“发信—收信”？' +
                  '因为**发件人和收件人通常不同时在线**。' +
                  '必须有一个“中间人”——邮件服务器——先把邮件**存起来**，等收件人上线再来取。' +
                  '这个“离线暂存”能力正是邮件系统区别于即时通信的根本。',
                coreIdea:
                  '电子邮件系统的三个主要组件（PPT 第 64 页）：' +
                  '① **用户代理（user agent，UA）**，又称“邮件阅读器（mail reader）”，负责撰写、编辑、阅读邮件；' +
                  '② **邮件服务器（mail server）**；' +
                  '③ **简单邮件传送协议（Simple Mail Transfer Protocol，SMTP）**。',
                mechanism:
                  '邮件服务器包含两部分（PPT 第 65 页）：**邮箱（mailbox）**存放发给该用户的收件消息；' +
                  '**消息队列（message queue）**存放待发送的出件。' +
                  'SMTP 运行在**两个邮件服务器之间**：SMTP 的**客户**是发送方服务器，' +
                  'SMTP 的**服务器**是接收方服务器。',
                comparison:
                  '注意 SMTP 的角色是相对的：在 A→B 的投递中，A 是客户、B 是服务器；' +
                  '但在 B→C 的投递中，B 又变成了客户。' +
                  '这与 Web 的“永远由浏览器当客户”不同，是本节最容易考的概念辨析。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '电子邮件系统由**三个主要组件**构成（PPT 第 64 页）：' +
                    '**用户代理**、**邮件服务器**、**简单邮件传送协议 SMTP**。',
                },
                { type: 'h', text: '一、用户代理（User Agent, UA）' },
                {
                  type: 'term',
                  zh: '用户代理',
                  en: 'user agent',
                  abbr: 'UA',
                  def: '又称“邮件阅读器（mail reader）”，运行在用户主机上的邮件客户端软件，负责撰写、编辑、读取邮件消息。',
                },
                {
                  type: 'list',
                  items: [
                    '功能：撰写（composing）、编辑（editing）、阅读（reading）邮件消息',
                    '早期代表软件：Eudora、Outlook、elm、Netscape Messenger',
                    '**发件与收件消息都存放在服务器上**（outgoing, incoming messages stored on server）——这是邮件系统与即时消息的关键差别',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '为什么邮件存在服务器上？',
                  text:
                    '因为**发件人与收件人通常不同时在线**。' +
                    'UA 只负责编辑与显示，真正的投递由邮件服务器完成。' +
                    '这也解释了为什么 POP3/IMAP 这类“邮件访问协议”必须存在：' +
                    'UA 需要一种方式从服务器上把邮件取回来（见 k2.4.4）。',
                },
                { type: 'h', text: '二、邮件服务器（Mail Server）' },
                {
                  type: 'table',
                  caption: '邮件服务器的两个存储区（PPT 第 65 页）',
                  headers: ['结构', '作用'],
                  rows: [
                    ['邮箱 mailbox', '包含发给该用户的收件消息（incoming messages）'],
                    ['消息队列 message queue', '包含待发送的出件消息（outgoing / to be sent mail messages）'],
                  ],
                },
                {
                  type: 'p',
                  text:
                    '**SMTP 协议在邮件服务器之间传送邮件消息**。' +
                    '在一次投递中，**SMTP 客户是发送方服务器**（把邮件放进消息队列的那一方），' +
                    '**SMTP 服务器是接收方服务器**（把邮件放进收件人邮箱的那一方）。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点：SMTP 的角色是相对的',
                  text:
                    '“SMTP 客户端一定是用户的邮件客户端”——**错误**。' +
                    'SMTP 客户是**发送方邮件服务器**，SMTP 服务器是**接收方邮件服务器**。' +
                    '用户代理与服务器之间用的是**邮件访问协议（POP3/IMAP/HTTP）**，不是 SMTP。' +
                    '角色会随投递方向互换：A→B 时 A 是客户，B→C 时 B 又成了客户。',
                },
                { type: 'h', text: '三、SMTP 协议概览（PPT 第 66 页）' },
                {
                  type: 'list',
                  items: [
                    '使用 **TCP** 可靠地把邮件消息从客户传到服务器，**端口 25**',
                    '**直接传输（direct transfer）**：发送服务器直接传到接收服务器',
                    '传输分**三个阶段**：握手（handshaking / greeting）、消息传输（transfer of messages）、关闭（closure）',
                    '命令/响应式交互：命令是 **ASCII 文本**，响应是**状态码 + 短语**',
                    '**消息必须是 7 位 ASCII**',
                  ],
                },
                {
                  type: 'figure',
                  alt: 'Alice 给 Bob 发邮件的完整过程',
                  caption: 'PPT 第 67 页：Scenario — Alice sends message to Bob',
                  ascii:
                    '  Alice 的 UA        Alice 的邮件服务器       Bob 的邮件服务器     Bob 的 UA\n       │                      │                        │               │\n  ① 写邮件 "to bob@someschool.edu"                     │               │\n       │---- ② 邮件放入消息队列 ------------------------>│               │\n       │                      │                        │               │\n       │                      │---- ③ 建立 SMTP(TCP:25) 连接 ----------->│               │\n       │                      │---- ④ SMTP 发送邮件 ------------------>│               │\n       │                      │                        │---- ⑤ 放入 Bob 邮箱               │\n       │                      │                        │               │---- ⑥ Bob 调用 UA 读取',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    'Alice 使用 UA 撰写消息，收件人为 bob@someschool.edu',
                    'Alice 的 UA 把消息发给她自己的邮件服务器；消息被放入**消息队列**',
                    'SMTP 的**客户端侧**（Alice 的邮件服务器）与 Bob 的邮件服务器打开 TCP 连接',
                    'SMTP 客户通过该 TCP 连接发送 Alice 的消息',
                    'Bob 的邮件服务器把消息放入 Bob 的**邮箱**',
                    'Bob 调用他的用户代理来读取消息',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '注意步骤 2 与步骤 6 的不对称',
                  text:
                    '第 ② 步 Alice 的 UA 把邮件交给**自己的**服务器——这用的是 POP3/IMAP/HTTP 之类；' +
                    '第 ⑥ 步 Bob 的 UA 从**服务器**取回邮件——这用的是 POP3/IMAP/HTTP。' +
                    '**只有服务器之间（第 ③④ 步）才用 SMTP。**' +
                    '所以“SMTP 是发邮件的协议”是不完整的说法。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.4.2',
                  label: '相关：SMTP 协议与工作过程',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.4.4',
                  label: '相关：POP3 与 IMAP',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.4.2', 'k2.4.4', 'k2.1.3'],
            },
            {
              id: 'k2.4.2',
              title: 'SMTP 协议与工作过程',
              en: 'SMTP',
              summary:
                'SMTP 使用持久 TCP 连接、端口 25，分握手/传输/关闭三阶段，命令为 ASCII 文本、响应为状态码+短语；与 HTTP 相比 SMTP 是 push 模型且可在一个报文中发送多个对象。',
              tags: ['SMTP', 'push', 'pull', '持久连接'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [68, 69, 70] },
                { kind: 'external', label: 'RFC 5321: Simple Mail Transfer Protocol', url: 'https://www.rfc-editor.org/rfc/rfc5321' },
              ],
              insight: {
                why:
                  'SMTP 为什么要设计成“**推（push）**”而不是 HTTP 的“拉（pull）”？' +
                  '因为邮件的目标是**把内容送到对方**，而不是“等待对方来取”。' +
                  '服务器主动把内容推给下一跳，' +
                  '这样一条链路上就能高效地把一封邮件**依次传给多个中间服务器**，而不需要每一跳都反向拉取。',
                coreIdea:
                  'SMTP 使用**持久连接（persistent connection）**；' +
                  '要求消息（首部与正文）必须是 **7 位 ASCII**；' +
                  '服务器用 **CRLF.CRLF** 判断消息结束。' +
                  '与 HTTP 的核心对比（PPT 第 70 页）：' +
                  '**HTTP 是 pull，SMTP 是 push**；' +
                  '两者都有 ASCII 命令/响应交互与状态码；' +
                  '**HTTP 中每个对象封装在各自的响应报文中，SMTP 中多个对象可放在一个 multipart 报文中**。',
                mechanism:
                  'SMTP 会话由三阶段组成：**握手（handshaking / greeting）→ 消息传输（transfer of messages）→ 关闭（closure）**。' +
                  '典型命令序列：HELO → MAIL FROM → RCPT TO → DATA → 正文（以单独一行的 "." 结束）→ QUIT。' +
                  '每条命令后服务器都返回一个三位状态码与短语。',
                comparison:
                  'push vs pull 是本章**最核心的辨析**：' +
                  'pull（HTTP）：客户端发起请求，服务器被动响应；服务器不知道也不关心客户端何时来取。' +
                  'push（SMTP）：发送方主动发起，把内容推给服务器；服务器立即接受并（可能）继续推给下一跳。' +
                  '推模型下服务器必须保存待发消息队列（message queue），这正是“发件人离线也能发信”能实现的原因。',
              },
              blocks: [
                { type: 'h', text: '一、SMTP 会话原文（PPT 第 68 页）' },
                {
                  type: 'figure',
                  alt: 'SMTP 会话示例：HELO / MAIL FROM / RCPT TO / DATA / QUIT',
                  caption: 'PPT 第 68 页：Sample SMTP interaction',
                  ascii:
                    'S: 220 hamburger.edu\nC: HELO crepes.fr\nS: 250  Hello crepes.fr, pleased to meet you\nC: MAIL FROM: <alice@crepes.fr>\nS: 250 alice@crepes.fr... Sender ok\nC: RCPT TO: <bob@hamburger.edu>\nS: 250 bob@hamburger.edu ... Recipient ok\nC: DATA\nS: 354 Enter mail, end with "." on a line by itself\nC: Do you like ketchup?\nC: How about pickles?\nC: .\nS: 250 Message accepted for delivery\nC: QUIT\nS: 221 hamburger.edu closing connection',
                },
                {
                  type: 'table',
                  caption: 'SMTP 命令逐条解释',
                  headers: ['行', '方向', '含义'],
                  rows: [
                    ['220 hamburger.edu', 'S→C', '服务就绪（220 = Service ready）'],
                    ['HELO crepes.fr', 'C→S', '问候并声明自己的域名（握手阶段）'],
                    ['250 Hello crepes.fr, pleased to meet you', 'S→C', '问候成功'],
                    ['MAIL FROM: <alice@crepes.fr>', 'C→S', '声明发件人地址'],
                    ['250 alice@crepes.fr... Sender ok', 'S→C', '发件人地址可接受'],
                    ['RCPT TO: <bob@hamburger.edu>', 'C→S', '声明收件人地址（可重复多次以发给多个收件人）'],
                    ['250 bob@hamburger.edu ... Recipient ok', 'S→C', '收件人地址可接受'],
                    ['DATA', 'C→S', '接下来发送邮件正文'],
                    ['354 Enter mail, end with "." on a line by itself', 'S→C', '请发送正文，以单独一行的 "." 结束'],
                    ['.', 'C→S', '正文结束标记'],
                    ['250 Message accepted for delivery', 'S→C', '邮件已被接受并进入消息队列'],
                    ['QUIT', 'C→S', '结束会话'],
                    ['221 hamburger.edu closing connection', 'S→C', '关闭连接'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text:
                    '**HELO 打招呼 → MAIL FROM 说我是谁 → RCPT TO 说寄给谁 → DATA 递正文 → . 收尾 → QUIT 告辞。**' +
                    '状态码同样是“三位数字 + 一句话”：**220/250/354** 是顺利进行的信号，' +
                    '**221** 是告别。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：DATA 命令后为什么以单独一行 "." 结束？',
                  text:
                    '因为邮件正文中**完全可能出现一行单独的 "."**（例如引用原文时用 "." 开头）。' +
                    'SMTP 规定：正文中的行首若为 "."，发送方要额外再加一个 "."（**透明化，dot-stuffing**），' +
                    '接收方看到连续两个 "." 时去掉一个还原。' +
                    '这是 SMTP 少数几个需要"转义"的地方。',
                },
                { type: 'h', text: '二、自己动手试 SMTP（PPT 第 69 页）' },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '`telnet servername 25`——连接到 SMTP 服务器',
                    '观察服务器的 **220** 应答',
                    '依次输入 **HELO、MAIL FROM、RCPT TO、DATA、QUIT** 命令',
                    '这样你就能在不借助邮件客户端（阅读器）的情况下发一封邮件',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '安全提示',
                  text:
                    '明文 SMTP 只应在**授权的实验环境**中测试；' +
                    '在公网服务器上用明文 SMTP 伪造发件人可能导致你的邮件被拒收或触发滥用检测。' +
                    '课程实验请使用课程提供的实验服务器。',
                },
                { type: 'h', text: '三、SMTP 的收尾与 HTTP 对比（PPT 第 70 页）' },
                {
                  type: 'list',
                  items: [
                    'SMTP 使用**持久连接**（persistent connections）',
                    'SMTP 要求消息（首部 & 正文）必须是 **7 位 ASCII**',
                    'SMTP 服务器用 **CRLF.CRLF** 判断消息结束',
                  ],
                },
                {
                  type: 'table',
                  caption: 'SMTP 与 HTTP 的对比（PPT 第 70 页）',
                  headers: ['对比维度', 'HTTP', 'SMTP'],
                  rows: [
                    ['交互模型', '**pull（拉）**', '**push（推）**'],
                    ['命令/响应格式', 'ASCII 命令/响应交互', 'ASCII 命令/响应交互'],
                    ['状态码', '有状态码（如 200/404）', '有状态码（如 250/354）'],
                    ['对象封装', '**每个对象封装在各自的响应报文中**', '**多个对象可放在一个 multipart 报文中**'],
                    ['传输层', 'TCP', 'TCP'],
                    ['使用场景', '取回网页、图片、脚本等资源', '投递邮件内容、附件、多部分正文'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点：push vs pull',
                  text:
                    '**HTTP = pull（客户拉取）**：客户端发起请求，服务器被动应答；服务器不关心客户何时来取。' +
                    '**SMTP = push（服务器推送）**：发送方主动把内容推给接收方，接收方服务器收到后存入邮箱（或继续推给下一跳）。' +
                    '推模型的必然结果是服务器需要**消息队列**——发件人离线时邮件也能排队等待发送。' +
                    '这是本章最经典的对比题。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：SMTP 的 RFC 版本',
                  text:
                    'PPT 第 66 页写的是 **SMTP [RFC 2821]**（2001），它取代了更早的 RFC 821（1982）。' +
                    '现行标准仍是 RFC 5321（2008），主要修订了国际化支持（EAI/SMTPUTF8）并与 RFC 5322 对齐；' +
                    'RFC 5322 取代了 RFC 822（PPT 第 71 页引用的报文格式标准）。' +
                    '答题时按现行 RFC 写，并说明历史沿革即可。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.4.3',
                  label: '相关：报文格式与 MIME 扩展',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.4.1',
                  label: '相关：电子邮件三大组件',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.4.1', 'k2.4.3', 'k2.2.6'],
            },
            {
              id: 'k2.4.3',
              title: '报文格式与 MIME 扩展',
              en: 'RFC822 & MIME',
              summary:
                'RFC 822 定义邮件消息格式（首部行 + 空行 + 正文）；MIME（RFC 2045/2046）通过 Content-Type 等扩展首部支持多媒体，含 text/image/audio/video/application 与 multipart 类型。',
              tags: ['RFC 822', 'MIME', 'Content-Type', 'multipart'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [71, 72, 73, 74] },
                { kind: 'external', label: 'RFC 5322: Internet Message Format', url: 'https://www.rfc-editor.org/rfc/rfc5322' },
                { kind: 'external', label: 'RFC 2045: MIME Part One', url: 'https://www.rfc-editor.org/rfc/rfc2045' },
              ],
              insight: {
                why:
                  '为什么要发明 MIME？因为 SMTP 规定**消息必须是 7 位 ASCII**，' +
                  '这意味着：不能发送二进制文件（如 JPEG）、不能携带非 ASCII 文字（中文），' +
                  '也不能在一个邮件里同时放文字和图片。' +
                  'MIME 的思路是：**保留原有的 ASCII 结构，额外加几行首部说明“这部分数据怎么解码”**。',
                coreIdea:
                  '**RFC 822**（现行为 RFC 5322）是文本消息格式标准：消息由**首部行（header lines）**和**正文（body）**组成，' +
                  '中间以一个**空行**分隔。首部行如 `To:`、`From:`、`Subject:`，' +
                  '**与 SMTP 命令不同**（SMTP 命令是 MAIL FROM、RCPT TO、DATA 等）。' +
                  '**MIME**（Multimedia Mail Extension，多媒体邮件扩展，RFC 2045、2046）在消息首部**增加额外的行**来声明 MIME 内容类型。',
                mechanism:
                  'MIME 的三个关键首部（PPT 第 72 页）：' +
                  '**MIME-Version**（MIME 版本）、**Content-Transfer-Encoding**（数据编码方法，如 base64、quoted-printable）、' +
                  '**Content-Type**（type/subtype; parameters，如 image/jpeg、multipart/mixed; boundary=98766789）。' +
                  '接收方先看 Content-Type 判断如何处理，再按 Content-Transfer-Encoding 解码。',
                comparison:
                  '**multipart 类型**允许一个邮件包含**多个不同类型的内容**：' +
                  '每部分有自己的 Content-Type 与 Content-Transfer-Encoding，' +
                  '用 `--boundary` 分隔、以 `--boundary--` 结束。' +
                  '这正是“多个对象放在一个 multipart 报文中”在邮件里的具体形态，' +
                  '也是 PPT 第 70 页 SMTP 特点的落地。',
              },
              blocks: [
                { type: 'h', text: '一、RFC 822 邮件消息格式（PPT 第 71 页）' },
                {
                  type: 'figure',
                  alt: 'RFC 822 邮件消息格式：首部 + 空行 + 正文',
                  caption: 'PPT 第 71 页：Mail message format',
                  ascii:
                    '┌───────────────────────────────────────────────┐\n│ 首部 header（若干首部行）                        │\n│   To: bob@hamburger.edu                         │\n│   From: alice@crepes.fr                         │\n│   Subject: Do you like ketchup?                 │\n│   ...                                            │\n├───────────────────────────────────────────────┤\n│ (空行 blank line —— 分隔首部与正文)               │\n├───────────────────────────────────────────────┤\n│ 正文 body（纯 ASCII 字符）                        │\n│   Do you like ketchup?                          │\n│   How about pickles?                            │\n└───────────────────────────────────────────────┘',
                },
                {
                  type: 'kv',
                  title: 'RFC 822 的组成',
                  items: [
                    { k: '首部 header', v: '若干首部行，例如 To:、From:、Subject:' },
                    { k: '正文 body', v: 'the “message”，仅 ASCII 字符' },
                    { k: '分隔', v: '首部与正文之间用一个空行（blank line）分开' },
                    { k: '与 SMTP 命令的区别', v: '首部行是**邮件内容的一部分**（由 UA 写好、随 DATA 发送），而 SMTP 命令（MAIL FROM / RCPT TO / DATA）是**传输协议的控制指令**' },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：邮件首部 ≠ SMTP 命令',
                  text:
                    '`From: alice@crepes.fr`（邮件首部行）与 `MAIL FROM: <alice@crepes.fr>`（SMTP 命令）' +
                    '**完全是两回事**：前者是邮件内容的一部分，由用户的 UA 编写；' +
                    '后者是 SMTP 会话中的控制命令，由服务器端程序生成。' +
                    '两者格式相似纯属历史巧合。',
                },
                { type: 'h', text: '二、MIME 扩展（PPT 第 72 页）' },
                {
                  type: 'p',
                  text:
                    '**MIME**（Multimedia Mail Extension，多媒体邮件扩展，PPT 标注 **RFC 2045、2056**）' +
                    '在消息首部**增加额外的行**来声明 MIME 内容类型，从而支持多媒体邮件。',
                },
                {
                  type: 'figure',
                  alt: 'MIME 邮件示例：MIME-Version、Content-Transfer-Encoding、Content-Type',
                  caption: 'PPT 第 72 页：Message format — multimedia extensions',
                  ascii:
                    'From: alice@crepes.fr\nTo: bob@hamburger.edu\nSubject: Picture of yummy crepe.\nMIME-Version: 1.0\nContent-Transfer-Encoding: base64\nContent-Type: image/jpeg\nbase64 encoded data .....\n.......................\n......base64 encoded data',
                },
                {
                  type: 'table',
                  caption: 'MIME 的三个关键首部',
                  headers: ['首部', '作用', 'PPT 第 72 页示例'],
                  rows: [
                    ['MIME-Version', '声明 MIME 版本', 'MIME-Version: 1.0'],
                    ['Content-Transfer-Encoding', '声明**编码数据的方法**', 'base64'],
                    ['Content-Type', '声明**类型、子类型与参数**', 'image/jpeg'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '关于 RFC 编号：PPT 的 2056 应为 2046',
                  text:
                    'PPT 第 72 页写的是 “MIME: multimedia mail extension, **RFC 2045, 2056**”。' +
                    '正确应为 **RFC 2045**（MIME Part One：格式与基本类型）与 **RFC 2046**（MIME Part Two：多部分媒体类型）。' +
                    'RFC 2056 并不存在与 MIME 相关的正式标准（MIME 相关标准还有 RFC 2047 编码非 ASCII 头、' +
                    'RFC 2048 媒体类型注册表、RFC 2049 MIME 格式总览）。' +
                    '同时 RFC 822 已被 **RFC 5322** 取代。',
                },
                { type: 'h', text: '三、MIME 的 Content-Type 类型（PPT 第 73 页）' },
                {
                  type: 'table',
                  caption: 'Content-Type: type/subtype; parameters',
                  headers: ['类型 type', '示例子类型 subtype', '说明'],
                  rows: [
                    ['Text', 'plain, html', '纯文本与 HTML'],
                    ['Image', 'jpeg, gif', '图像'],
                    ['Audio', 'basic（8 位 mu-law 编码）、32kadpcm（32 kbps 编码）', '音频'],
                    ['Video', 'mpeg, quicktime', '视频'],
                    ['Application', 'msword, octet-stream', '其他必须由阅读器处理后才能“查看”的数据'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：五大 MIME 顶层类型',
                  text:
                    '**text / image / audio / video / application**——五个顶层类型要能默写。' +
                    '特别地，`application/octet-stream` 表示“二进制流，阅读器不认识”，' +
                    '几乎所有“作为附件发来的任意文件”都会用这个类型。',
                },
                { type: 'h', text: '四、Multipart 类型（PPT 第 74 页）' },
                {
                  type: 'p',
                  text:
                    '**multipart** 类型允许一个邮件包含**多个不同类型的内容**。' +
                    '每个部分有自己的 Content-Type 与 Content-Transfer-Encoding，' +
                    '各部分用 `--boundary` 分隔，以 `--boundary--` 结束整个 multipart 正文。',
                },
                {
                  type: 'figure',
                  alt: 'multipart/mixed 邮件示例',
                  caption: 'PPT 第 74 页：Multipart Type',
                  ascii:
                    'From: alice@crepes.fr\nTo: bob@hamburger.edu\nSubject: Picture of yummy crepe.\nMIME-Version: 1.0\nContent-Type: multipart/mixed; boundary=98766789\n--98766789\nContent-Transfer-Encoding: quoted-printable\nContent-Type: text/plain\n\nDear Bob,\nPlease find a picture of a crepe.\n--98766789\nContent-Transfer-Encoding: base64\nContent-Type: image/jpeg\n\nbase64 encoded data .....\n.......................\n......base64 encoded data\n--98766789--',
                },
                {
                  type: 'list',
                  items: [
                    '顶层首部 `Content-Type: multipart/mixed; boundary=98766789` 声明这是一个多部分邮件，并给出分隔符',
                    '第一部分：`text/plain`，用 `quoted-printable` 编码，纯文字说明',
                    '第二部分：`image/jpeg`，用 `base64` 编码，二进制图片数据',
                    '结束标记 `--98766789--`（两个连字符）',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '这正是“一个报文里多个对象”的含义',
                  text:
                    'PPT 第 70 页说“SMTP: multiple objects sent in multipart msg”，' +
                    '而 HTTP 是“each object encapsulated in its own response msg”。' +
                    '**multipart 是把“邮件正文 + 附件”打包进一封邮件的机制**，' +
                    '也是把图片、视频等二进制塞进 7 位 ASCII 通道的桥梁。',
                },
                {
                  type: 'p',
                  text:
                    '最后补充编码知识：**base64** 把任意二进制编码成 7 位可打印 ASCII（每 3 字节 → 4 字符，约膨胀 33%），' +
                    '用于二进制附件；**quoted-printable** 对 ASCII 近似原样、只转义非 ASCII 字符，' +
                    '主要用于文本；**7bit/8bit/binary** 则分别表示纯 7 位、含 8 位数据、直接二进制（需 8BITMIME 扩展）。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.4.2',
                  label: '相关：SMTP 协议与工作过程',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.4.4',
                  label: '相关：POP3 与 IMAP',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.4.2', 'k2.4.4'],
            },
          ],
        },
        {
          id: 's2.4.2',
          title: '邮件访问协议',
          knowledge: [
            {
              id: 'k2.4.4',
              title: 'POP3 与 IMAP',
              en: 'POP3 & IMAP',
              summary:
                'SMTP 负责投递与存储到收件人服务器，POP3（RFC 1939）负责授权与下载且跨会话无状态，IMAP（RFC 1730）把所有邮件留在服务器上并支持文件夹管理与跨会话状态。',
              tags: ['POP3', 'IMAP', '邮件访问协议', 'download-and-delete'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [75, 76, 77] },
                { kind: 'external', label: 'RFC 1939: POP3', url: 'https://www.rfc-editor.org/rfc/rfc1939' },
                { kind: 'external', label: 'RFC 9051: IMAP4rev2（现行 IMAP 标准）', url: 'https://www.rfc-editor.org/rfc/rfc9051' },
              ],
              insight: {
                why:
                  '为什么要专门设计“邮件访问协议”？因为 SMTP 只负责**把邮件送到服务器并存储**，' +
                  '用户最终还要把邮件**取回本地阅读、跨设备同步、管理文件夹**。' +
                  '这个“取回与管理”的职责必须由另一个协议承担。',
                coreIdea:
                  '**POP**（Post Office Protocol，邮局协议，**RFC 1939**）：提供授权（authorization）与下载（download）。' +
                  '**IMAP**（Internet Mail Access Protocol，因特网邮件访问协议，**RFC 1730**）：' +
                  '功能更多，包括**操作服务器上存储的消息**（manipulation of stored msgs on server）。' +
                  '此外 **HTTP** 也可作为邮件访问协议（Gmail、Hotmail、Yahoo! Mail 等都基于 HTTP）。',
                mechanism:
                  'POP3 有两个阶段：**授权阶段（authorization phase）**——用户、密码；' +
                  '**事务阶段（transaction phase）**——list（列出消息编号）、retr（按编号取回）、' +
                  'dele（删除）、quit（退出）。' +
                  '服务器响应以 `+OK`（成功）或 `-ERR`（失败）开头。',
                comparison:
                  '两种模式的本质差异：**download-and-delete（下载并删除）**与 **download-and-keep（下载并保留）**。' +
                  '前者删掉服务器上的副本，Bob 换客户端后**无法重读旧邮件**；' +
                  '后者在多个客户端保留副本。' +
                  '**POP3 跨会话无状态**（stateless across sessions）；' +
                  '**IMAP 把所有邮件留在服务器上**，支持用户把邮件组织到文件夹中，' +
                  '并且**跨会话保存用户状态**（文件夹名、消息 ID 与文件夹的映射关系）。',
              },
              blocks: [
                { type: 'h', text: '一、邮件访问协议的定位（PPT 第 75 页）' },
                {
                  type: 'table',
                  caption: '邮件系统中的两类协议',
                  headers: ['协议', '职责', '标准'],
                  rows: [
                    ['SMTP', '**投递与存储**到接收方服务器（delivery/storage to receiver’s server）', 'RFC 5321（PPT 写 RFC 2821）'],
                    ['POP3', '授权 + 下载（authorization, download）', 'RFC 1939'],
                    ['IMAP', '功能更多，含**操作服务器上存储的消息**', 'RFC 1730（现行为 RFC 3501 / RFC 9051）'],
                    ['HTTP', 'Web 邮箱使用 HTTP 作为访问协议', 'HTTP/1.1、HTTP/2、HTTP/3'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：SMTP 与 POP3/IMAP 的分工',
                  text:
                    '**SMTP = 送到服务器；POP3/IMAP = 从服务器取。**' +
                    '完整链路是：UA →（SMTP 或 HTTP）→ 本地邮件服务器 →（SMTP）→ 远端邮件服务器 →（POP3/IMAP）→ 收件人 UA。' +
                    '另外注意 PPT 第 75 页写的 IMAP 是 **RFC 1730**，那是 1994 年的初版；' +
                    '现行标准是 **RFC 3501（IMAP4rev1）**与 **RFC 9051（IMAP4rev2）**，' +
                    '主要扩展了 UTF-8、条件存储、IDLE 等能力。',
                },
                { type: 'h', text: '二、POP3 协议细节（PPT 第 76 页）' },
                {
                  type: 'table',
                  caption: 'POP3 两个阶段',
                  headers: ['阶段', '客户端命令', '服务器响应'],
                  rows: [
                    ['授权阶段 authorization phase', '`user`（声明用户名）、`pass`（提交密码）', '`+OK` / `-ERR`'],
                    ['事务阶段 transaction phase', '`list`（列出消息编号）、`retr`（按编号取回）、`dele`（删除）、`quit`', '`+OK` / `-ERR`，多行数据以单独一行的 "." 结束'],
                  ],
                },
                {
                  type: 'figure',
                  alt: 'POP3 会话示例：授权阶段 + 事务阶段',
                  caption: 'PPT 第 76 页：POP3 protocol',
                  ascii:
                    'S: +OK POP3 server ready\nC: user bob\nS: +OK\nC: pass hungry\nS: +OK user successfully logged on\nC: list\nS: 1 498\nS: 2 912\nS: .\nC: retr 1\nS: <message 1 contents>\nS: .\nC: dele 1\nC: retr 2\nS: <message 1 contents>\nS: .\nC: dele 2\nC: quit\nS: +OK POP3 server signing off',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text:
                    '授权阶段 **user → pass**，事务阶段 **list → retr → dele → quit**。' +
                    '`list` 返回的 `1 498` 表示“第 1 封消息，498 字节长”。' +
                    '响应以 `+OK` 表示成功、`-ERR` 表示失败；多行内容以单独一行的 **`.`** 结束（与 SMTP 的 DATA 结束方式一致）。',
                },
                { type: 'h', text: '三、download-and-delete vs download-and-keep（PPT 第 77 页）' },
                {
                  type: 'table',
                  caption: 'POP3 的两种取回模式',
                  headers: ['模式', '行为', '后果'],
                  rows: [
                    ['download-and-delete（下载并删除）', '取回后从服务器删除', '**Bob 换了客户端就无法重读旧邮件**；多设备同步困难'],
                    ['download-and-keep（下载并保留）', '取回后在服务器保留副本', '多个客户端都有副本，可离线阅读'],
                  ],
                },
                {
                  type: 'p',
                  text:
                    'PPT 第 77 页明确指出：**POP3 跨会话是无状态的**（stateless across sessions）——' +
                    '每次会话都要重新授权，服务器不记得上次把邮件取到哪里了。' +
                    '这与 POP3 本身“无状态”无关——**POP3 服务器要记住已删除的邮件编号以便多行同步**，' +
                    '但**它不记住用户的会话状态**（如已读位置、文件夹结构）。',
                },
                { type: 'h', text: '四、IMAP（PPT 第 77 页）' },
                {
                  type: 'list',
                  items: [
                    '把所有邮件**集中保存在服务器上**（Keep all messages in one place: the server）',
                    '允许用户把邮件**组织到文件夹中**（organize messages in folders）',
                    '**跨会话保持用户状态**：文件夹名，以及消息 ID 与文件夹名之间的映射关系',
                    '只同步“状态”而非整个邮件体，因此更适合多设备与大邮箱',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：POP3 vs IMAP 的五个差异',
                  text:
                    '① **邮件存放位置**：POP3 下载到本地（可选择删除服务器副本），IMAP 留在服务器。' +
                    '② **多设备同步**：POP3 需靠 download-and-keep，IMAP 天然支持。' +
                    '③ **文件夹管理**：只有 IMAP 支持在服务器上建文件夹、组织邮件。' +
                    '④ **跨会话状态**：POP3 无状态，IMAP 保留文件夹名与消息 ID↔文件夹映射。' +
                    '⑤ **服务器存储 vs 客户端存储**：IMAP 节省客户端空间但依赖网络，POP3 适合离线阅读。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：现代事实上的选择',
                  text:
                    '今天 Gmail、Outlook.com、QQ 邮箱等主流 Web 邮箱**都走 HTTP API**（Gmail API、Microsoft Graph），' +
                    '而不是传统的 POP3/IMAP；但 POP3/IMAP 仍是重要的兼容协议，' +
                    '且 IMAP 仍是很多企业内部邮件网关的标配。' +
                    '此外 IMAP 支持服务器端搜索、条件获取（CONDSTORE）、IDLE（推送新邮件）等高级特性。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.4.1',
                  label: '相关：电子邮件三大组件',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.4.3',
                  label: '相关：报文格式与 MIME 扩展',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.4.1', 'k2.4.3'],
            },
          ],
        },
      ],
    },
    // ==========================================================
    // 2.5 DNS
    // ==========================================================
    {
      id: 's2.5',
      title: '2.5 DNS',
      en: 'Domain Name System',
      subsections: [
        {
          id: 's2.5.1',
          title: 'DNS 概述与结构',
          knowledge: [
            {
              id: 'k2.5.1',
              title: '为什么用分布式层次 DNS',
              en: 'Why Distributed DNS',
              summary:
                '集中式名字数据库不可行：单点故障、流量瓶颈、距离太远、维护困难；因此 DNS 采用分布式层次数据库。',
              tags: ['DNS', '分布式', '层次数据库', '单点故障'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [79] },
                { kind: 'supplement', note: '补充：DNS 协议本身为 RFC 1034/1035，现行为 RFC 1034/1035 + RFC 6891 等' },
              ],
              insight: {
                why:
                  '互联网需要一个“名字 → 地址”的目录服务。为什么不能做成一台中央服务器？' +
                  'PPT 第 79 页给出了四条硬伤：' +
                  '**单点故障（single point of failure）**——中央服务器宕机，整个互联网失去名字解析；' +
                  '**流量（traffic）**——全球查询都打到一处，带宽与处理能力无法承受；' +
                  '**距离（Distant）**——物理距离决定 RTT，地球另一端的用户查询延迟极大；' +
                  '**维护（Maintenance）**——一份巨大的目录难以保持同步与更新。',
                coreIdea:
                  '结论是：**集中式不能满足网络规模的需求，必须采用分布式层次数据库**。' +
                  'DNS 的做法是把“目录”按名字空间**分层切分**：' +
                  '根 → 顶级域 → 权威域。每一层只知道自己下一层的“指路人”，' +
                  '把全局问题转化为若干次局部查询。',
                mechanism:
                  '层次化带来两个关键性质：**可扩展性**（新增一个域只需在本域注册，不影响其他域）与' +
                  '**自治性**（各机构自行管理自己的区域数据）。' +
                  '代价是查询需要经过多层，因此引入缓存与本地名称服务器来降低开销。',
                comparison:
                  '与传统的 hosts 文件相比，DNS 支持层次命名、动态更新、分布式管理；' +
                  '与集中式数据库（如单台 LDAP 主服务器）相比，DNS 用“层次 + 缓存 + 委派”换取了可用性与扩展性。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    'DNS（Domain Name System，域名系统）是互联网的**分布式层次数据库**，' +
                    '它把主机名（hostname）映射为 IP 地址。' +
                    '在讲 DNS 的结构之前，先回答一个更根本的问题：**为什么不把名字目录做成集中式的？**',
                },
                { type: 'h', text: '为什么不能集中式？（PPT 第 79 页）' },
                {
                  type: 'table',
                  caption: '集中式名字数据库的四大问题',
                  headers: ['问题', '英文', '具体后果'],
                  rows: [
                    ['单点故障', 'single point of failure', '中央服务器一旦宕机或被攻击，全网无法解析域名'],
                    ['流量', 'traffic', '全球 DNS 查询集中到一处，带宽与处理能力成为瓶颈'],
                    ['距离', 'Distant', '查询者与中央服务器物理距离远，RTT 巨大（跨洋可达数百毫秒）'],
                    ['维护', 'Maintenance', '一份巨大的映射表难以保持一致、及时更新'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '结论',
                  text:
                    '**集中式不能满足网络规模的需求！采用分布式层次数据库！**' +
                    '这句话是 PPT 第 79 页的原文结论，也是本知识点的答题要点。',
                },
                { type: 'h', text: '分布式层次数据库如何解决这四个问题' },
                {
                  type: 'list',
                  items: [
                    '**单点故障** → 被拆散：没有一台“必须活着”的服务器，根服务器即使暂时不可达，本地缓存仍能服务大多数查询',
                    '**流量** → 被分流：查询被分层分发，根服务器只处理“顶级域是什么”，绝大多数请求在本地或下层就被解答',
                    '**距离** → 被缩短：解析链路上每一步都更靠近用户，且本地名称服务器直接就近应答',
                    '**维护** → 被自治：各域的权威数据由各机构自己维护，改一个域不影响其他域',
                  ],
                },
                {
                  type: 'p',
                  text:
                    '当然，层次化本身也带来新的代价：解析一个名字可能要跨多层，' +
                    '所以必须配合**缓存**（把结果存下来）与**本地名称服务器**（就近代理）才能把性能拉回可接受水平。' +
                    '这正是 k2.5.4 与 k2.5.5 要解决的问题。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：DNS 的标准文档',
                  text:
                    'DNS 核心标准是 **RFC 1034**（域名系统概念与设施）与 **RFC 1035**（实现与规范）；' +
                    '现行补充标准包括 **RFC 6891**（DNS 更新消息与特殊用途域名）、' +
                    '**RFC 8499**（DNS 术语）等。DNS 通常使用 **UDP 53 端口**，' +
                    '但在响应超过报文长度、区域传送等场景改用 **TCP 53**。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.3',
                  label: '相关：层次名称服务器：根、顶级域、权威',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.4',
                  label: '相关：本地名称服务器',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.5.2', 'k2.5.3', 'k2.5.4'],
            },
            {
              id: 'k2.5.2',
              title: 'DNS 提供的服务',
              en: 'DNS Services',
              summary:
                'DNS 提供四项服务：主机名到 IP 地址的转换、主机别名（规范名与别名）、邮件服务器别名、负载分配（一组 IP 地址对应一个规范名）。',
              tags: ['DNS', '别名', 'CNAME', 'MX', '负载分配'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [79] },
                { kind: 'supplement', note: '补充：四种服务分别对应 A/NS/CNAME/MX 四类资源记录，见 k2.5.6' },
              ],
              insight: {
                why:
                  '为什么 DNS 不止做“名字 → IP”这一件事？因为真实世界的命名需求远不止一种：' +
                  '一个网站可能有多个 IP（要负载均衡）、一个主机可能有好记的名字（要别名）、' +
                  '邮件投递不能直接用主机名（要 MX 记录）。' +
                  '把这些能力都放进 DNS 一棵树，才有了统一的、可委派的命名体系。',
                coreIdea:
                  'DNS 提供的服务有四项（PPT 第 79 页）：' +
                  '① **主机名到 IP 地址的转换**（hostname to IP address translation）；' +
                  '② **主机别名**（host aliasing）：规范名（canonical name）与别名（alias）；' +
                  '③ **邮件服务器别名**（mail server aliasing）；' +
                  '④ **负载分配**（load distribution）：复制的 Web 服务器，一个规范名对应一组 IP 地址。',
                mechanism:
                  '这四项服务分别由四类资源记录支撑（这正是 k2.5.6 的考点）：' +
                  '**A 记录** = 主机名 → IP；' +
                  '**NS 记录** = 域 → 权威 DNS 服务器主机名；' +
                  '**CNAME 记录** = 别名 → 规范名；' +
                  '**MX 记录** = 邮件服务器别名 → 邮件服务器规范名。',
                comparison:
                  '主机别名与邮件服务器别名的差别：' +
                  '**CNAME 指向“主机”**（如 www.ibm.com → servereast.backup2.ibm.com），' +
                  '解析后拿到的是 A 记录；' +
                  '**MX 指向“邮件服务器”**（如某域名 → mail.example.com），' +
                  '解析后还要再查一次 A 记录才知道 IP。' +
                  '所以“邮件发给 mail.example.com”不能只看 A 记录，必须查 MX。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    'DNS 是互联网的**分布式层次数据库**，向全网提供四项核心服务（PPT 第 79 页）。',
                },
                {
                  type: 'table',
                  caption: 'DNS 提供的四项服务（PPT 第 79 页）',
                  headers: ['服务', '英文', '说明', '对应 RR 类型'],
                  rows: [
                    ['主机名到 IP 地址转换', 'Hostname to IP address translation', '最基本的功能：www.sina.com → 60.215.128.150', 'A'],
                    ['主机别名', 'Host aliasing', '提供**规范名（canonical）**与**别名（alias）**两套名字', 'CNAME'],
                    ['邮件服务器别名', 'Mail server aliasing', '为邮件系统提供“域名 → 邮件服务器”的映射', 'MX'],
                    ['负载分配', 'Load distribution', '**复制的（replicated）Web 服务器**：一个规范名对应一组 IP 地址', '多个 A 记录'],
                  ],
                },
                {
                  type: 'p',
                  text:
                    '**关于主机别名**：现实中一个主机可能有很多名字（如 www.ibm.com、www.ibm.com.cn、' +
                    'IBM 的营销域名），但 DNS 记录是**从规范名（canonical name）出发**的。' +
                    '因此主机别名记录 **CNAME** 的 Name 字段是别名，Value 字段是规范名；' +
                    '客户端解析别名时会**继续追踪** CNAME 直到拿到 A 记录。',
                },
                {
                  type: 'p',
                  text:
                    '**关于邮件服务器别名**：邮件系统投递时先查该域的 **MX 记录**，' +
                    '得到邮件服务器的规范名，再查该名字的 **A 记录**得到 IP。' +
                    'MX 记录还带有**优先级（preference）**参数：多个 MX 时优先投递优先级数值小者。',
                },
                {
                  type: 'p',
                  text:
                    '**关于负载分配**：把同一个规范名（例如 www.example.com）配置**多个 A 记录**，' +
                    '指向一组内容相同的 Web 服务器（replicated Web servers）。' +
                    'DNS 服务器会把这几个 IP **轮转返回**，客户端每次解析可能拿到不同的 IP，' +
                    '从而把负载分散到多台机器上。这就是最简单的 DNS 轮询负载均衡。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：四种服务 ↔ 四类 RR 一一对应',
                  text:
                    '这是本章最核心的对应关系，PPT 第 93 页的 10 分考题正是考它：' +
                    '**主机名→IP = A；域→权威服务器 = NS；别名→规范名 = CNAME；邮件别名→邮件服务器 = MX。**' +
                    '注意别把 NS 与 CNAME 记混：NS 的 Name 是**域**（如 com、sina.com），' +
                    'CNAME 的 Name 是**主机别名**（如 www.ibm.com）。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：现代 DNS 还提供更多能力',
                  text:
                    '除了上述四项，DNS 还被广泛用于：' +
                    '**SRV 记录**（服务定位，如 _sip._tcp.example.com）、' +
                    '**TXT 记录**（域名所有权验证、SPF 邮件防伪、DMARC）、' +
                    '**CAA 记录**（限定哪些 CA 可为该域签发证书）、' +
                    '**DNSSEC**（对解析结果做数字签名，防伪造）。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.6',
                  label: '相关：DNS 资源记录（四元组与四种类型）',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.3',
                  label: '相关：层次名称服务器：根、顶级域、权威',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.5.6', 'k2.5.1', 'k2.5.8'],
            },
            {
              id: 'k2.5.3',
              title: '层次名称服务器：根、顶级域、权威',
              en: 'Hierarchical DNS',
              summary:
                'DNS 名称空间分为根、顶级域、权威三类服务器：13 个根名称服务器引导到顶级域服务器（com/org/edu/cn 等），顶级域再委派到各机构的权威服务器。',
              tags: ['DNS', '根服务器', '顶级域', '权威服务器', '委派'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [80, 81, 82, 83] },
                { kind: 'supplement', note: '补充：根服务器部署细节（任播 IP、anycast）' },
              ],
              insight: {
                why:
                  '为什么需要根服务器？既然层次化是为了分摊负载和缩短距离，' +
                  '那“最顶上”那一层怎么办？' +
                  '根服务器只回答一个非常有限的问题：**“.com 的 DNS 服务器在哪里？”**' +
                  '它不保存任何具体主机的地址，因此它的数据量极小、查询极快。' +
                  '这就是“委派（delegation）”思想的力量：每一层只保存下一层的**指路人**。',
                coreIdea:
                  '**根名称服务器（root name servers）** → **顶级域名称服务器（TLD servers）** → ' +
                  '**权威名称服务器（authoritative name servers）**。' +
                  '根服务器负责引导查询获取顶级域名称服务器的域名及对应的 IP 地址。',
                mechanism:
                  'PPT 第 80 页给出了 www.sina.com 的三级解析过程：' +
                  '① 客户端向根服务器查询，根服务器告知 **.com DNS 服务器**的位置；' +
                  '② 客户端向 com DNS 服务器查询，com 服务器告知 **sina.com DNS 服务器**（权威名称服务器，安置在网站）的位置；' +
                  '③ 客户端向 sina.com 的权威服务器查询，得到 www.sina.com 的 IP 地址。',
                comparison:
                  '三类服务器的差异：' +
                  '**根服务器**管理根域，全世界只有 13 个逻辑标识（a~m），通过 anycast 部署在成百上千个物理地点；' +
                  '**顶级域服务器**管理 com、org、net、edu 以及所有国家顶级域 cn、fr、ca、jp 等；' +
                  '**权威服务器**由组织自己维护（或委托给服务商），提供本组织服务器的“主机名 → IP”映射。' +
                  '只有**权威服务器**能给出最终答案，其余都只是“路标”。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    'DNS 的名字空间（namespace）是**层次化**的，由三类名称服务器构成（PPT 第 80~83 页）。' +
                    '以“客户端想要 www.sina.com 的 IP”为例，三步走：',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '客户端向**根服务器**查询以找到 **.com DNS 服务器（顶级域）**',
                    '客户端向 **com DNS 服务器（顶级域）**查询以得到 **sina.com DNS 服务器（权威名称服务器，安置在网站）**',
                    '客户端向 **sina.com DNS 服务器（权威名称服务器）**查询以得到 **www.sina.com 的 IP 地址**',
                  ],
                },
                {
                  type: 'figure',
                  alt: 'DNS 层次结构：根 → 顶级域 → 权威',
                  caption: 'PPT 第 80 页：Hierarchical DNS',
                  ascii:
                    '                        ┌──────────────┐\n                        │  根 DNS 服务器 │  (Root DNS Servers)\n                        └───────┬──────┘\n          ┌───────────────────┼───────────────────┐\n     ┌────▼─────┐        ┌────▼─────┐        ┌────▼─────┐\n     │ com DNS  │        │ org DNS  │        │ edu DNS  │\n     │ 服务器    │        │ 服务器    │        │ 服务器    │\n     └────┬─────┘        └────┬─────┘        └────┬─────┘\n          │                  │                  │\n     ┌────▼──────────┐  ┌────▼──────────┐  ┌────▼──────────┐\n     │ sina.com DNS  │  │ yahoo.com DNS │  │ poly.edu DNS   │\n     │ 服务器(权威)   │  │ 服务器(权威)   │  │ 服务器(权威)    │\n     └────┬──────────┘  └───────────────┘  └────┬──────────┘\n          │                                     │\n   ┌──────┴───────┐                     ┌──────┴───────┐\n   │ www.sina.com  │                     │  umass.edu    │\n   │ → IP 地址     │                     │  DNS 服务器   │\n   └──────────────┘                     └──────────────┘',
                },
                { type: 'h', text: '一、根名称服务器（PPT 第 81 页）' },
                {
                  type: 'p',
                  text:
                    '**全世界有 13 个根名称服务器**（逻辑标识 a~m）。' +
                    '由于全球流量巨大，它们通过**任播（anycast）**技术把同一 IP 部署在成百上千个物理位置，' +
                    '由 BGP 把用户路由到最近的副本。',
                },
                {
                  type: 'table',
                  caption: '13 个根名称服务器及其运营方（PPT 第 81 页）',
                  headers: ['标识', '运营方与地点'],
                  rows: [
                    ['a', 'Verisign, Dulles, VA（另有 11 个地点）'],
                    ['b', 'USC-ISI, Marina del Rey, CA'],
                    ['c', 'Cogent, Herndon, VA（另有 Los Angeles）'],
                    ['d', 'University of Maryland, College Park, MD'],
                    ['e', 'NASA, Mountain View, CA'],
                    ['f', 'Internet Software Consortium, Palo Alto, CA（另有 17 个地点）'],
                    ['g', 'US DoD, Vienna, VA'],
                    ['h', 'US Army Research Lab, Aberdeen, MD'],
                    ['i', 'Netnod, Stockholm（另有 3 个地点）'],
                    ['j', 'Verisign（另有 11 个地点）'],
                    ['k', 'RIPE NCC, London（另有 Amsterdam、Frankfurt）'],
                    ['l', 'ICANN, Los Angeles, CA'],
                    ['m', 'WIDE Project, Tokyo'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：根服务器到底做什么',
                  text:
                    '**根名称服务器负责引导查询获取顶级域名称服务器的域名及对应的顶级域服务器的 IP 地址**' +
                    '（例如 `.com` 的服务器名与 IP）。' +
                    '它**不保存** `www.sina.com` 这类具体主机的地址。' +
                    '这就是为什么根服务器能扛住全球流量：**它返回的数据极少，且结果可以长期缓存**。',
                },
                { type: 'h', text: '二、顶级域服务器（PPT 第 82 页）' },
                {
                  type: 'p',
                  text:
                    '**顶级域（Top-Level Domain, TLD）服务器**负责 `com`、`org`、`net`、`edu` 等通用顶级域，' +
                    '以及**所有国家顶级域**（如 `cn`、`fr`、`ca`、`jp` 等）。' +
                    '每个顶级域的服务器由相应机构运营，例如 `edu` 顶级域由 Educause 负责，' +
                    '`cn` 顶级域对应哈工大（威海）等国内高校与科研机构所在的域名体系。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：cn 顶级域的委派链',
                  text:
                    '以哈工大（威海）为例：`edu.cn` → `hitwh.edu.cn` → 权威服务器。' +
                    '这体现了 DNS 的**委派（delegation）**机制：' +
                    '父域的 NS 记录指定子域的权威服务器，子域再往下委派。' +
                    '每一级权威服务器同时保存着“下一级 NS 记录 + 对应 A 记录”，' +
                    '这就是它能当“路标”的原因。',
                },
                { type: 'h', text: '三、权威服务器（PPT 第 83 页）' },
                {
                  type: 'p',
                  text:
                    '**权威（authoritative）DNS 服务器**是**组织自己的 DNS 服务器**，' +
                    '提供本组织服务器的“主机名 → IP”映射，' +
                    '例如 Web 服务器 `news.sina.com.cn` 与邮件服务器 `mail.sina.com.cn` 各对应一条 A 记录。' +
                    '权威服务器**可以由组织自己维护，也可以委托给服务提供商**（如云厂商的 DNS 托管）。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：只有权威服务器能给出最终答案',
                  text:
                    '根服务器、顶级域服务器、本地名称服务器给出的都是**“转介”**（referral），' +
                    '只有**权威服务器**能给出**权威答案**（authoritative answer）。' +
                    'DNS 报文中有一个 **AA（authoritative answer）标志位**用于标识这一点，' +
                    '见 k2.5.7。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.4',
                  label: '相关：本地名称服务器',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.5',
                  label: '相关：迭代查询与递归查询',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.5.4', 'k2.5.5', 'k2.5.6'],
            },
            {
              id: 'k2.5.4',
              title: '本地名称服务器',
              en: 'Local Name Server',
              summary:
                '本地名称服务器不属于 DNS 层次，但每家 ISP 都有一个（“默认名称服务器”），主机把 DNS 查询发给它，它充当代理把查询转发进层次结构。',
              tags: ['DNS', '本地名称服务器', '缓存', 'nslookup'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [84, 88] },
                { kind: 'supplement', note: '补充：nslookup 的实际使用与常见输出字段解释' },
              ],
              insight: {
                why:
                  '为什么需要一个“层次之外”的本地名称服务器？' +
                  '因为如果每次查询都从根开始逐层走，用户至少要付出 2~4 个 RTT，' +
                  '而且根与顶级域服务器会承受全部流量。' +
                  '本地名称服务器把查询**就近消化**，并把结果**缓存**起来，' +
                  '使绝大多数重复查询在 0 个 RTT 内完成。',
                coreIdea:
                  '本地名称服务器（local name server）**严格来说不属于 DNS 层次**（does not strictly belong to hierarchy）。' +
                  '每家 ISP（居民 ISP、公司、大学）都有一个，叫**“默认名称服务器”（default name server）**。' +
                  '当主机发起 DNS 查询时，查询被发往它的本地名称服务器；' +
                  '本地名称服务器**充当代理（acts as proxy）**，把查询转发进 DNS 层次结构。',
                mechanism:
                  '典型配置：Windows 的“本地连接”设置里的“首选 DNS 服务器”填的就是本地名称服务器地址' +
                  '（PPT 第 84 页举例为 202.102.128.68）。' +
                  '本地名称服务器内部维护**缓存**：' +
                  '把查到的 A 记录按 TTL 缓存，也把“某顶级域服务器在哪里”这类转介结果缓存下来。' +
                  '缓存是 DNS 性能与可扩展性的关键。',
                comparison:
                  '与权威服务器的区别：**权威服务器是数据的“源”，本地名称服务器是数据的“缓存与代理”**。' +
                  '本地名称服务器可以回答大部分常见查询，' +
                  '只有缓存未命中或已过期时，才真正向层次结构发起查询。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '**本地名称服务器（local name server）**严格来说**不属于 DNS 层次结构**' +
                    '（does not strictly belong to hierarchy）（PPT 第 84 页）。' +
                    '每家 ISP——无论是居民 ISP、公司还是大学——都有一个本地名称服务器，' +
                    '它也称为**“默认名称服务器”（default name server）**。',
                },
                {
                  type: 'p',
                  text:
                    '在 Windows 中，“本地连接”设置里的**“首选 DNS 服务器”**填的就是本地名称服务器地址' +
                    '（PPT 第 84 页给出的实例是 202.102.128.68）。' +
                    '当主机发起 DNS 查询时，查询会先发给这个本地名称服务器；' +
                    '它**充当代理（acts as proxy）**，把查询转发进 DNS 层次结构。',
                },
                {
                  type: 'figure',
                  alt: '本地名称服务器在 DNS 解析中的位置',
                  caption: '本地名称服务器：层次之外的代理与缓存',
                  ascii:
                    '  主机 (host)                 本地名称服务器                层次结构\n  ┌────────┐                ┌────────────────┐        ┌──────────┐\n  │ 发起查询 │─── query ────►│ 1. 查缓存      │        │ 根 → TLD │\n  │        │                │ 2. 未命中则转发 │───────►│ → 权威   │\n  │        │                │ 3. 缓存结果     │◄───────│          │\n  │◄───────┼────────────────┤ 4. 返回答案     │        └──────────┘\n  └────────┘                └────────────────┘\n\n   缓存命中: 0 次网络往返，直接应答\n   缓存未命中: 代替主机完成整条层次查询',
                },
                {
                  type: 'list',
                  items: [
                    '**缓存命中**：绝大多数重复查询在本地直接完成，**0 个网络 RTT**，根/TLD 完全不受影响',
                    '**缓存未命中**：本地名称服务器代替主机走完“根 → 顶级域 → 权威”的全过程，再把答案返回主机',
                    '**转介缓存**：连“这个顶级域服务器在哪”这类中间结果也会按 TTL 缓存',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '本地名称服务器解决了什么问题',
                  text:
                    '① **性能**：把绝大多数查询的 RTT 降到接近 0；' +
                    '② **可扩展性**：根服务器与顶级域服务器只处理“第一次”或“缓存过期”的查询，流量骤降；' +
                    '③ **就近性**：用户只与本地服务器通信，物理距离短。' +
                    '**没有本地名称服务器，DNS 根本跑不起来**——这正是 k2.5.1 中“集中式流量问题”的现实答案。',
                },
                { type: 'h', text: '动手实验：用 NSLOOKUP 逐层查询（PPT 第 88 页作业）' },
                {
                  type: 'p',
                  text:
                    'PPT 第 88 页的作业要求：**在课余任选一个网络地址，' +
                    '利用 NSLOOKUP 命令对本地名称服务器中缓存该域名的 DNS 层次记录进行逐层查询并加以解释，' +
                    '以报告的形式提交。**',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '打开命令行（Windows：`nslookup`；macOS/Linux：`dig` 或 `host`）',
                    '查询某个域名，例如 `nslookup www.tsinghua.edu.cn`',
                    '观察输出的 **Server** 字段——这就是你配置的本地名称服务器地址',
                    '用 `nslookup -type=NS tsinghua.edu.cn` 查该域的 NS 记录（权威服务器）',
                    '用 `nslookup -type=A www.tsinghua.edu.cn` 查 A 记录',
                    '用 `nslookup -type=NS edu.cn`、`nslookup -type=NS cn` 继续向上逐层查询，直到根域',
                    '对每一层的输出做解释：这是哪一级服务器、返回的是权威答案还是转介',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '实验观察要点',
                  text:
                    '① `nslookup` 输出的第一行 **Server: 202.102.128.68** 就是本地名称服务器。' +
                    '② 用 `type=NS` 逐级上溯，可以把“根 → 顶级域 → 权威”的委派链**亲手走一遍**。' +
                    '③ 用 `type=A` 查到的才是最终 IP；查 CNAME 时会看到“别名 → 规范名 → IP”的两段结果。' +
                    '④ 加 `-trace` 参数（或用 `dig +trace`）可以打印**完整的逐跳查询过程**。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：nslookup 与 dig',
                  text:
                    '`nslookup` 是 Windows 自带的交互式工具，交互式界面不够直观；' +
                    '`dig`（Domain Information Groper）是 BIND 套件的命令行工具，' +
                    '输出更详细（带 SECTION 划分：HEADER、QUESTION、ANSWER、AUTHORITY、ADDITIONAL），' +
                    '是学习 DNS 报文格式的最佳工具（见 k2.5.7）。' +
                    '`host` 是更简洁的第三方工具。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.5',
                  label: '相关：迭代查询与递归查询',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.7',
                  label: '相关：DNS 报文格式',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.5.5', 'k2.5.7', 'k2.5.3'],
            },
          ],
        },
        {
          id: 's2.5.2',
          title: '查询机制与记录',
          knowledge: [
            {
              id: 'k2.5.5',
              title: '迭代查询与递归查询',
              en: 'Iterated & Recursive Query',
              summary:
                '迭代查询：被询问的服务器回复“去问这个服务器”，把查询负担留给客户端；递归查询：把名字解析的负担全部压在被询问的服务器上。本地 DNS 对客户端用递归、对层次用迭代。',
              tags: ['DNS', '迭代查询', '递归查询', '根服务器'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [85, 90, 91, 92] },
                { kind: 'kaoyan', note: '王道考研：迭代查询与递归查询的区别是高频考点' },
              ],
              insight: {
                why:
                  '为什么 DNS 同时需要迭代和递归两种查询方式？' +
                  '因为它们把“查询负担”放在不同的地方：' +
                  '递归把负担压给**被询问的服务器**，让**客户端**省事，但服务器负载重；' +
                  '迭代把负担还给**客户端**，服务器只回答“我不知道，你去问它”，但服务器负载轻。' +
                  'DNS 做了一个折中：**客户端—本地服务器用递归，本地服务器—层次结构用迭代**。',
                coreIdea:
                  '**迭代查询（iterated query）**：被联系的服务器**回复**给出“接下来该联系哪个服务器”的名字，' +
                  '就像说“我不认识这个名字，但你可以去问这个服务器”。' +
                  '**递归查询（recursive query）**：把名字解析的**全部负担**放到被联系的名称服务器身上' +
                  '（heavy load？——服务器负载会很重）。',
                mechanism:
                  '实际互联网的组合方式：' +
                  '① 主机 → 本地名称服务器：**递归查询**（本地服务器负责给出最终答案）；' +
                  '② 本地服务器 → 根服务器：**迭代查询**；' +
                  '③ 本地服务器 → 顶级域服务器：**迭代查询**；' +
                  '④ 本地服务器 → 权威服务器：**迭代查询**。' +
                  '这样，**客户端只发一个查询**（简单），而**层次结构中的服务器之间不需要彼此递归**（负载可控）。',
                comparison:
                  '迭代 vs 递归的根本区别是**“谁继续查”**：' +
                  '迭代——被问者只给线索，**查询者**继续问下一个；' +
                  '递归——被问者**继续问**直到有答案再回复你。' +
                  '注意 DNS 报文的 **RD（recursion desired）** 与 **RA（recursion available）** 两个标志位正是协商这两种方式。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    'DNS 有两种查询方式（PPT 第 85 页），二者的区别在于**查询的负担由谁承担**。',
                },
                {
                  type: 'table',
                  caption: '迭代查询与递归查询',
                  headers: ['对比维度', '迭代查询 Iterated query', '递归查询 Recursive query'],
                  rows: [
                    ['被询问服务器的行为', '回复给出**下一个该联系的服务器的名字**（“我不认识这个名字，但你可以去问这个服务器”）', '**把名字解析的全部负担**压在自己身上，直到拿到答案才回复'],
                    ['谁来继续查', '**查询发起者**（客户端）逐级向上问', '**被询问的服务器**代替查询者继续问'],
                    ['服务器负载', '轻（每次只回答一小段线索）', '**重（heavy load?）**——每次查询都要走完整条链'],
                    ['DNS 中的用法', '本地服务器 → 根 → 顶级域 → 权威', '主机 → 本地服务器'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：互联网实际用的是“混合”方式',
                  text:
                    '标准答案：**主机到本地 DNS 服务器是递归查询；本地 DNS 服务器到根、顶级域、权威服务器是迭代查询**。' +
                    '因此“DNS 用迭代查询”或“DNS 用递归查询”这种非此即彼的说法都是错的。' +
                    '混合方式的好处是：**客户端只发一次查询（省事），层次服务器之间互不递归（负载可控）**。',
                },
                { type: 'h', text: 'www.baidu.com 的三跳迭代查询（PPT 第 90~92 页）' },
                {
                  type: 'figure',
                  alt: 'www.baidu.com 的迭代查询三跳过程',
                  caption: 'PPT 第 85、90、91、92 页：迭代查询全过程',
                  ascii:
                    'Resolver（本地 DNS）  →  Root DNS server (198.41.0.4)      [第1跳, slide90]\n     Root: “我不知道 baidu.com，但你去问 .com 顶级域服务器”\n\nResolver             →  .com TLD server (a.servers.net)        [第2跳, slide91]\n     .com: “我不知道 www.baidu.com 的 IP，但 baidu.com 由这些权威服务器管：\n            ns1.baidu.com ...”\n\nResolver             →  权威服务器 ns1.sina.com / ns*.baidu.com [第3跳, slide92]\n     权威: “www.baidu.com 的 A 记录是 x.x.x.x”\n\nResolver 缓存这个结果，并返回给客户端\n\n图中另有：requesting host “Teacher LIU” → 本地 DNS 服务器 ns.sdjnptt.net.cn',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '**第 1 跳（slide 90）**：Resolver → Root 服务器。根服务器不知道 baidu.com，告诉 Resolver：**去问 .com 顶级域服务器**',
                    '**第 2 跳（slide 91）**：Resolver → .com TLD 服务器。.com 服务器只知道 baidu.com 由哪几台权威服务器管，**不知道 www.baidu.com 的 IP 地址**，于是把 baidu.com 的权威服务器信息返回给 Resolver',
                    '**第 3 跳（slide 92）**：Resolver → 权威服务器。拿到最终的 **A 记录**，**Resolver 缓存这个结果**，再返回给客户端',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么第 2 跳不能直接给出 IP？',
                  text:
                    '因为 .com 顶级域服务器**不保存** baidu.com 的主机记录，' +
                    '它只保存 **baidu.com 的 NS 记录 + 对应的 A 记录**（即“baidu.com 的权威服务器在哪”）。' +
                    '这是**委派机制**的直接体现：' +
                    '每一级只管自己这一段的“路标”，**数据的所有权归最下级的权威服务器**。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：迭代查询中的三个角色',
                  text:
                    '**Root** 回答“顶级域服务器在哪”；' +
                    '**TLD** 回答“该域的权威服务器在哪”；' +
                    '**权威服务器**回答“这个主机名的 IP 是多少”。' +
                    '只有最后一步是**权威答案（AA 标志置 1）**。' +
                    '若把第 2 跳说成“顶级域服务器返回 IP”，即为典型错误。',
                },
                {
                  type: 'p',
                  text:
                    '整个过程中，**本地名称服务器（Resolver）承担了全部的迭代动作**，' +
                    '主机只发出了一次递归查询。' +
                    '这也是为什么本地服务器必须有缓存：它把“根的转介”“TLD 的转介”“权威的答案”分别按 TTL 缓存，' +
                    '使得后续查询只需一跳甚至零跳。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd2.5.5-dns-query',
                  label: '打开演示：DNS 迭代查询全过程',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.7',
                  label: '相关：DNS 报文格式（RD/RA 标志）',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.4',
                  label: '相关：本地名称服务器',
                },
              ],
              questionIds: [],
              demoIds: ['d2.5.5-dns-query'],
              related: ['k2.5.4', 'k2.5.7', 'k2.5.3'],
            },
            {
              id: 'k2.5.6',
              title: 'DNS 资源记录',
              en: 'DNS Records',
              summary:
                'DNS 是存储资源记录（RR）的分布式数据库，RR 是四元组 (Name, Value, Type, TTL)；四种基本类型为 A、NS、CNAME、MX。',
              tags: ['DNS', '资源记录', 'RR', 'A', 'NS', 'CNAME', 'MX', 'TTL'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [86, 93] },
                { kind: 'external', label: 'RFC 1035: DNS Implementation and Specification', url: 'https://www.rfc-editor.org/rfc/rfc1035' },
                { kind: 'kaoyan', note: 'PPT 第 93 页把“列举 DNS 资源记录的四种类型并简述含义”列为 10 分考题' },
              ],
              insight: {
                why:
                  '为什么用“四元组”来描述一条 DNS 记录？因为 DNS 数据库里的每一行必须回答四个问题：' +
                  '**这条记录叫什么（Name）？它对应什么（Value）？它是哪一类（Type）？它能缓存多久（TTL）？**' +
                  '缺任何一个都无法完整表达 DNS 的语义。',
                coreIdea:
                  '**DNS 是存储资源记录（resource records, RR）的分布式数据库。**' +
                  'RR 的格式是四元组 **(Name, Value, Type, TTL)**：' +
                  'Name 是一条记录所描述的**名字**；' +
                  'Value 是该名字对应的**值**；' +
                  'Type 说明这条记录**是什么类型**（决定了 Name 与 Value 的含义）；' +
                  'TTL（Time To Live）是该记录可被缓存的**秒数**。',
                mechanism:
                  'Type 决定了 Name 与 Value 怎么解释，这就是“同一对 Name/Value 字符串在不同 Type 下含义完全不同”的原因。' +
                  '例如 Name = `www.sina.com`：' +
                  '若 Type = A，Value 必须是 IP 地址 `60.215.128.150`；' +
                  '若 Type = CNAME，Value 必须是另一个主机名（规范名）；' +
                  '若 Type = MX，Value 必须是邮件服务器的规范名。',
                comparison:
                  '四种基本类型的对比（这是 PPT 第 93 页 10 分考题的全部内容）：' +
                  '**A**——Name 是主机名，Value 是该主机名对应的 IP 地址（3 分）；' +
                  '**NS**——Name 是域，Value 是该域中权威 DNS 服务器的主机名（3 分）；' +
                  '**CNAME**——Name 是主机别名，Value 是主机规范名（2 分）；' +
                  '**MX**——Name 是邮件服务器别名，Value 是邮件服务器规范名（2 分）。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '**DNS 是一个存储资源记录（resource records, RR）的分布式数据库**（PPT 第 86 页）。' +
                    '资源记录的格式是一个四元组：',
                },
                {
                  type: 'formula',
                  latex: '\\text{RR} = (\\text{Name},\\ \\text{Value},\\ \\text{Type},\\ \\text{TTL})',
                  caption: 'DNS 资源记录的四元组',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: '\\text{Name}', meaning: '记录所描述的名字（主机名、域名或别名）', unit: '—' },
                    { symbol: '\\text{Value}', meaning: '该名字对应的值（IP 地址、服务器主机名或规范名，取决于 Type）', unit: '—' },
                    { symbol: '\\text{Type}', meaning: '记录类型：决定 Name 与 Value 的解释方式', unit: '—' },
                    { symbol: '\\text{TTL}', meaning: '该记录可被缓存的秒数（Time To Live）', unit: 's' },
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么 Type 必须存在？',
                  text:
                    '因为 DNS 的“Name→Value”不是单射。' +
                    '`www.sina.com` 既可以是一条 A 记录（值是 IP），' +
                    '也可以是一条 CNAME 记录（值是另一个主机名），' +
                    '也可以是一条 MX 记录（值是邮件服务器名）。' +
                    '**Type 就是告诉解析器“该怎么读这一对 Name/Value”**。',
                },
                { type: 'h', text: '四种基本资源记录（PPT 第 86、93 页）' },
                {
                  type: 'table',
                  caption: 'DNS 四种基本资源记录类型（PPT 第 86 页 / 第 93 页 10 分考题）',
                  headers: ['Type', 'Name 的含义', 'Value 的含义', 'PPT 示例'],
                  rows: [
                    ['A', '主机名（hostname）', '该主机名对应的 **IP 地址**', 'Name = www.sina.com；Value = 60.215.128.150'],
                    ['NS', '**域**（domain）', '该域中**权威 DNS 服务器的主机名**', 'Name = com；Value = a.servers.net'],
                    ['CNAME', '主机**别名**（alias name）', '主机的**规范名**（canonical name）', 'www.ibm.com 实际是 servereast.backup2.ibm.com'],
                    ['MX', '**邮件服务器别名**', '邮件服务器的**规范名**（really name of mailserver）', '某域名 → mail.example.com'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: 'PPT 第 93 页原题（10 分）',
                  text:
                    '**问题：列举 DNS 资源记录的四种类型，并简述各自类型的含义。（10 分）**' +
                    'DNS 资源记录是一个 4 元组：{Name, Value, Type, TTL}。' +
                    '（1）Type = A，Name 是主机名，Value 是该主机名对应的 IP 地址。【3 分】' +
                    '（2）Type = NS，Name 是域，Value 是该域中权威 DNS 服务器的主机名。【3 分】' +
                    '（3）Type = CNAME，Name 是主机别名，Value 是主机规范名。【2 分】' +
                    '（4）Type = MX，Name 是邮件服务器别名，Value 是邮件服务器规范名。【2 分】',
                },
                {
                  type: 'p',
                  text:
                    '按分值权重也能看出命题意图：**A 与 NS 各 3 分（最重要），CNAME 与 MX 各 2 分**。' +
                    '记忆时可以用一句口诀：**“A 是地址，NS 是服务器，C 是别名，M 是邮件”**。',
                },
                {
                  type: 'table',
                  caption: '易混淆的两个 Type：NS vs CNAME',
                  headers: ['对比点', 'NS', 'CNAME'],
                  rows: [
                    ['Name 是什么', '一个**域**（如 com、sina.com）', '一个**主机别名**（如 www.ibm.com）'],
                    ['Value 是什么', '该域**权威 DNS 服务器**的主机名', '该主机的**规范名**（另一个主机名）'],
                    ['在解析中的角色', '**转介**：告诉解析器“去问哪台服务器”', '**重定向**：告诉解析器“这个别名实际是谁”'],
                    ['能否继续解析', '对 Value 做 A 查询 → 得到权威服务器 IP', '对 Value 做 A 查询 → 得到最终主机的 IP'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：CNAME 后面不能再跟 CNAME',
                  text:
                    'RFC 1034 规定：同一条名字**不能同时拥有 CNAME 记录和其他其他类型的记录**。' +
                    '因此 `www.a.com` 若已有 CNAME，就不能再有 A 记录；' +
                    'CNAME 只能指向一个规范名，但那个规范名**可以再有自己的 A 记录**。' +
                    '这解释了实际 DNS 中常见的报错 “CNAME and other data records cannot coexist”。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：TTL 的作用与常见取值',
                  text:
                    'TTL 直接决定缓存行为：' +
                    '**值越大** → 缓存命中率高、解析更快，但内容更新传播慢（DNS 变更后用户要等更久才能看到）；' +
                    '**值越小** → 更新及时，但缓存命中率低、查询多、层次服务器压力大。' +
                    '常见取值：根服务器与 com 顶级域通常 24~48 小时（甚至更长），' +
                    '普通权威记录常为 300~3600 秒，CDN 动态记录常为 30~60 秒。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.2',
                  label: '相关：DNS 提供的服务',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.8',
                  label: '相关：记录注册到 DNS',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.5.2', 'k2.5.7', 'k2.5.8'],
            },
            {
              id: 'k2.5.7',
              title: 'DNS 报文格式',
              en: 'DNS Messages',
              summary:
                'DNS 报文分为查询与应答两种，格式相同：首部含 16 位标识号与标志位（QR、RD、RA、AA 等），后跟问题、应答、权威与附加四类区段。',
              tags: ['DNS', '报文格式', '标志位', '标识号', 'RD', 'RA', 'AA'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [87, 89] },
                { kind: 'external', label: 'RFC 1035: DNS Messages and Resource Records', url: 'https://www.rfc-editor.org/rfc/rfc1035#section-4.1' },
              ],
              insight: {
                why:
                  '为什么 DNS 要给自己的报文设计一套“消息格式”？' +
                  '因为 DNS 要同时支持**两种不同性质的消息**：' +
                  '**查询（query）**只带问题，**应答（reply）**要带上答案、权威说明与附加信息。' +
                  '用同一套格式承载两者，客户端只需一套解析代码；' +
                  '用标志位区分二者，服务器只需实现一套收发逻辑。',
                coreIdea:
                  'DNS 协议有**查询与应答（reply）两种消息，两者格式相同**。' +
                  '**首部（msg header）**中包含：' +
                  '**标识号（identification）：16 位**，查询用它编号，**应答使用相同的编号**来与查询匹配；' +
                  '**标志（flags）**：查询还是应答、**是否希望递归（recursion desired）**、' +
                  '**是否支持递归（recursion available）**、**应答是否为权威（authoritative）**。',
                mechanism:
                  '报文由首部加四个可选区段组成：' +
                  '**Question（问题）**：待查询的 Name 与 Type；' +
                  '**Answer（应答）**：查询的记录；' +
                  '**Authority（权威）**：权威服务器的记录（常放 NS 记录，即“转介”）；' +
                  '**Additional（附加）**：可能有用的补充信息（常放 NS 对应的 A 记录）。',
                comparison:
                  '**RD 与 RA 是协商机制**：' +
                  '客户端在查询中置 RD=1 表示“我希望递归，请把最终答案给我”；' +
                  '服务器用 RA=1 表示“我支持递归”。' +
                  '若两者不匹配，实际行为就退化为**迭代查询**——这正是 k2.5.5 中混合模式在报文层面的体现。' +
                  '**AA=1** 表示这是**权威答案**（来自该域的权威服务器），AA=0 表示这是转介。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    'DNS 协议有**查询（query）与应答（reply）两种消息，两者格式完全相同**（PPT 第 89 页）。' +
                    '这种设计让客户端只需实现一套解析逻辑。',
                },
                {
                  type: 'table',
                  caption: 'DNS 消息首部字段（PPT 第 89 页）',
                  headers: ['字段', '位数', '含义'],
                  rows: [
                    ['identification（标识号）', '**16 位**', '查询的编号；**应答使用相同的编号**，以便客户端把应答与查询配对'],
                    ['flags：query or reply', '1 位（QR）', '0 = 查询（query），1 = 应答（reply）'],
                    ['flags：recursion desired', '1 位（RD）', '查询方**希望**被询问的服务器代为递归解析'],
                    ['flags：recursion available', '1 位（RA）', '被询问的服务器**支持**递归'],
                    ['flags：reply is authoritative', '1 位（AA）', '应答中的答案是**权威答案**（来自权威服务器）'],
                  ],
                },
                {
                  type: 'p',
                  text:
                    '除了 PPT 列出的四个字段，完整的 DNS 首部还包括：' +
                    '**QDCOUNT**（问题数，通常为 1）、**ANCOUNT**（应答数）、' +
                    '**NSCOUNT**（权威记录数）、**ARCOUNT**（附加记录数），' +
                    '以及可选的 **Z/AD/CD** 标志（DNSSEC 认证数据、校验和、已验证数据）。',
                },
                {
                  type: 'figure',
                  alt: 'DNS 查询报文与应答报文的区段组成',
                  caption: 'PPT 第 87 页：DNS 协议中的查询与应答',
                  ascii:
                    '【查询消息】                          【应答消息】\n┌────────────────────────┐          ┌────────────────────────┐\n│ 报文首部                │          │ 报文首部                │\n│  ID (16 bit)            │          │  ID (16 bit)  ← 相同！ │\n│  Flags: QR RD RA ...    │          │  Flags: QR=1 RD RA AA  │\n├────────────────────────┤          ├────────────────────────┤\n│ Question                │          │ Question              │\n│  Name, Type             │          │  Name, Type           │\n│  (待查询的名字与类型)     │          │  (原样回显)            │\n├────────────────────────┤          ├────────────────────────┤\n│ (无)                    │          │ Answer                │\n│                        │          │  ← 查询的记录           │\n│                        │          ├────────────────────────┤\n│                        │          │ Authority             │\n│                        │          │  ← 权威服务器的记录      │\n│                        │          ├────────────────────────┤\n│                        │          │ Additional            │\n│                        │          │  ← 可能有用的补充信息    │\n└────────────────────────┘          └────────────────────────┘',
                },
                {
                  type: 'list',
                  items: [
                    '**Name、type 字段**：用于查询（Question 区段）',
                    '**应答中的 RRs（Resource Records）**：对查询的记录（Answer 区段）',
                    '**权威服务器的记录**（Authority 区段）：常放 NS 记录，即“转介”信息',
                    '**附加的“可能有用的”信息**（Additional 区段）：常放 NS 记录对应的 A 记录，让客户端无需再查一次',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：DNS 应答的四个区段',
                  text:
                    '**Question**：原样回显查询的问题；' +
                    '**Answer**：真正的答案（A 记录等）；' +
                    '**Authority**：权威信息/转介（NS 记录）；' +
                    '**Additional**：附加信息（常为 NS 的 A 记录）。' +
                    '**迭代查询**时，Answer 区常为空而 Authority 区有 NS 记录——' +
                    '因为此时还没有真正的 IP 答案，只有“去问谁”的线索。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '16 位标识号的意义：DNS over UDP 的可靠性',
                  text:
                    'DNS 通常跑在 **UDP 53** 上（无连接、可能丢包、可能乱序）。' +
                    '16 位标识号让客户端能**把应答与对应的查询配对**——' +
                    '如果一个客户端同时发了多个查询（浏览器会并发查多个域名），' +
                    '就靠这个 ID 区分谁是谁。' +
                    '但 16 位只有 65536 个可能值，理论上存在 ID 碰撞与**缓存投毒（Cache Poisoning）**风险，' +
                    '因此现代 DNS 普遍引入 **DNSSEC** 与**源端口随机化**。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：用 dig 看清 DNS 报文结构',
                  text:
                    '执行 `dig www.tsinghua.edu.cn`，输出会被划分为五个 SECTION：' +
                    'HEADER（含 ID、flags、QDCOUNT/ANCOUNT/NSCOUNT/ARCOUNT）、' +
                    'QUESTION、ANSWER、AUTHORITY、ADDITIONAL。' +
                    'flags 一行会显示 `qr rd ra` 等缩写——' +
                    '**qr=1** 是应答，**rd=1** 客户端要求递归，**ra=1** 服务器支持递归。' +
                    '这是把本节知识与实验结合起来的最佳方式。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.5',
                  label: '相关：迭代查询与递归查询',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.6',
                  label: '相关：DNS 资源记录',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.5.5', 'k2.5.6', 'k2.5.4'],
            },
            {
              id: 'k2.5.8',
              title: '记录注册到 DNS',
              en: 'Inserting Records into DNS',
              summary:
                '注册公司域名需四步：向 ISP 申请 IP 地址段、配置基本/辅助两台权威 DNS 服务器、向注册机构提供权威 DNS 名字与 IP、由注册机构在 TLD 写入 NS 与 A 记录。',
              tags: ['DNS', '域名注册', '权威服务器', 'NS记录', 'A记录'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [94, 95] },
                { kind: 'kaoyan', note: 'PPT 第 94 页把“注册公司域名需要做哪些配置”列为 10 分考题' },
              ],
              insight: {
                why:
                  '为什么要理解“注册一个域名要做哪些配置”？因为它把 DNS 的**委派机制**、' +
                  '**资源记录**、**权威与转介的区别**串成了一条完整的实践链条。' +
                  '理解了它，就理解了 DNS 是如何“长出”一个新域的。',
                coreIdea:
                  '要让互联网上的用户访问你的 Web 服务器，你必须完成四件事（PPT 第 94 页的 10 分题）：' +
                  '① **分配网络标识**：与本地 ISP 签约，由 ISP 分配一个 IP 地址范围，' +
                  '你在其中为 Web 服务器与权威 DNS 服务器分配 IP；' +
                  '② **配置两台 DNS 服务器**：基本（primary）与辅助（secondary）权威 DNS 服务器，' +
                  '存储公司向公网提供服务的所有机器的域名与 IP 的映射；' +
                  '③ **向注册登记机构提供**基本与辅助权威 DNS 服务器的**名字和 IP 地址**；' +
                  '④ **注册机构在顶级域 DNS 服务器中写入两条记录**：' +
                  '对该域的 **NS 记录** + 对权威服务器自身的 **A 记录**。',
                mechanism:
                  '第 ④ 步为什么需要**两条**记录？' +
                  '因为顶级域服务器（.com）要回答“networkutopia.com 的权威服务器在哪”，' +
                  '需要 NS 记录；而 NS 记录里存的是**主机名**（dns1.networkutopia.com），' +
                  '顶级域服务器还需要这个主机名的 **A 记录**（212.212.212.1）才能告诉别人“去这个 IP 问”。' +
                  '**NS + A 成对出现**，正是“转介”所需的最小数据集。',
                comparison:
                  '权威服务器与本地名称服务器在注册场景中的分工：' +
                  '**权威服务器**保存你自己域的数据（A、MX 等），由你控制；' +
                  '**本地名称服务器**只是缓存别人的数据，不参与注册。' +
                  '另外，basic + secondary 两台权威服务器是**冗余设计**：' +
                  '主服务器故障时从服务器顶上，同时通过 AXFR 区域传送保持数据同步。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '假设你创建了一个小型公司网络，包含一台对外提供产品与服务的公共 Web 服务器，' +
                    '希望互联网用户能从任何地点访问你的站点。' +
                    '**需要做哪些计算机网络方面的配置工作？**（PPT 第 94 页，10 分题）',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '**（1）分配网络标识（2 分）**：获得因特网连接——与本地互联网服务提供商（ISP）签订合同并接入；' +
                    '你的本地 ISP 会为你提供一个 **IP 地址范围**，你可以在这段地址范围内为 Web 服务器和权威 DNS 服务器分配 IP 地址',
                    '**（2）配置两台 DNS 服务器（2+2 分）**：作为你公司的**基本（primary）与辅助（secondary）权威 DNS 服务器**，' +
                    '里面存储有公司向公网提供服务的**所有机器的域名与 IP 地址的映射关系**；' +
                    '例如你的 Web 站点对应的 Web 服务器的 **A 资源记录**被输入到了你的权威 DNS 服务器中',
                    '**（3）向注册机构提供名字与 IP（2 分）**：当你向对应的**注册登记机构（registrar）**注册域名时，' +
                    '需要向该机构提供**基本、辅助权威 DNS 服务器的名字和 IP 地址**',
                    '**（4）注册机构写入 NS 与 A 记录（2 分）**：对这两个权威 DNS 服务器中的每一个，' +
                    '该注册机构确保把一个**类型 NS** 和一个**类型 A** 的记录输入到**顶级域 DNS 服务器**中',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '为什么是 NS + A 两条记录？',
                  text:
                    '顶级域（.com）服务器要当“路标”，就得知道两件事：' +
                    '**① 你的权威服务器叫什么**（NS 记录：networkutopia.com → dns1.networkutopia.com）；' +
                    '**② 你的权威服务器在哪**（A 记录：dns1.networkutopia.com → 212.212.212.1）。' +
                    '缺 NS，解析器不知道该问谁；缺 A，它只知道名字还要再查一次。' +
                    '**NS 与 A 必须成对**，这是本步骤的得分点。',
                },
                { type: 'h', text: '实例：Network Utopia（PPT 第 95 页）' },
                {
                  type: 'p',
                  text:
                    'PPT 给出的例子是新建的初创公司 **“Network Utopia”**，' +
                    '其域名是 networkutopia.com（PPT 原文写作 networkuptopia.com，是笔误）。完整流程如下：',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '在 DNS 注册商（registrar，如 Network Solutions）处注册名字 **networkutopia.com**',
                    '提供权威名称服务器（primary 和 secondary）的**名字与 IP 地址**',
                    '注册商把**两条 RR** 写入 .com 顶级域服务器：' +
                    '`(networkutopia.com, dns1.networkutopia.com, NS)` 和 `(dns1.networkutopia.com, 212.212.212.1, A)`',
                    '在自己的权威服务器上创建：`www.networkutopia.com` 的 **A 记录**（Web 服务器）、' +
                    '`networkutopia.com` 的 **MX 记录**（邮件服务器别名）',
                  ],
                },
                {
                  type: 'figure',
                  alt: 'Network Utopia 的 DNS 注册流程',
                  caption: 'PPT 第 95 页：Inserting records into DNS',
                  ascii:
                    '   公司自己的权威服务器                  .com 顶级域服务器\n   ┌──────────────────────────┐        ┌──────────────────────────┐\n   │ www.networkutopia.com     │        │ (networkutopia.com,      │\n   │   A → 212.212.212.2       │        │   dns1.networkutopia.com,│\n   │                          │        │   NS)                    │\n   │ networkutopia.com        │        │                          │\n   │   MX → mail.networkutopia │        │ (dns1.networkutopia.com, │\n   │   mail.… A → 212.212.212.3│        │   212.212.212.1, A)      │\n   └──────────────────────────┘        └──────────────────────────┘\n            ↑ 第③步：把名字和 IP 提供给注册商\n                       ↓ 第④步：注册商写入 .com 的 NS + A 记录',
                },
                {
                  type: 'table',
                  caption: '注册流程中的记录分布',
                  headers: ['记录', '存放位置', '作用'],
                  rows: [
                    ['(networkutopia.com, dns1.networkutopia.com, NS)', '**.com 顶级域服务器**', '告诉解析器“networkutopia.com 的权威服务器是 dns1.networkutopia.com”'],
                    ['(dns1.networkutopia.com, 212.212.212.1, A)', '**.com 顶级域服务器**', '告诉解析器“dns1 这台机器的 IP 是 212.212.212.1”'],
                    ['(www.networkutopia.com, 212.212.212.2, A)', '**公司自己的权威服务器**', '给出 Web 服务器的 IP'],
                    ['(networkutopia.com, mail.networkutopia.com, MX)', '**公司自己的权威服务器**', '指定该域的邮件服务器'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么“基本 + 辅助”两台权威服务器？',
                  text:
                    '**可用性**与**负载分担**：一台权威服务器宕机会导致整个域无法解析（新的缓存未命中的查询会失败）。' +
                    '两台服务器互为备份，主服务器通过 **AXFR/IXFR（区域传送）**把区域数据同步给从服务器。' +
                    '此外两台服务器可分布在不同机房/不同运营商，避免单机房故障。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：今天还多了一步（第 1 步的延伸）',
                  text:
                    '现代实践中，第 ① 步往往还包括：' +
                    '注册商处的 **DNSSEC 签名**、' +
                    '**NSEC/NSEC3 否定应答**（防域名接管）、' +
                    '以及把权威服务器放在不同网络的 **anycast** 或多 CDN 供应商上。' +
                    '但**四步主干不变**：IP 地址段 → 权威服务器 → 向注册商提供名字与 IP → 注册商写 NS+A。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.6',
                  label: '相关：DNS 资源记录',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.3',
                  label: '相关：层次名称服务器：根、顶级域、权威',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.5.6', 'k2.5.3', 'k2.5.9'],
            },
            {
              id: 'k2.5.9',
              title: 'DNS 攻击',
              en: 'Attacking DNS',
              summary:
                'DNS 面临 DDoS 轰炸（根服务器效果有限，顶级域服务器更危险）、流量过滤绕过、重定向与中间人、DNS 投毒，以及利用 DNS 放大反射发动 DDoS。',
              tags: ['DNS', 'DDoS', 'DNS投毒', '反射放大', '中间人'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [96] },
                { kind: 'external', label: 'RFC 5452: Caching DNS Security', url: 'https://www.rfc-editor.org/rfc/rfc5452' },
                { kind: 'supplement', note: '补充：DNSSEC、DoH/DoT 等现代防护手段' },
              ],
              insight: {
                why:
                  '攻击 DNS 为什么值得？**DNS 是互联网的“电话簿”**——' +
                  '把它打瘫，等于让全世界的人都查不到任何网址；' +
                  '把它投毒，等于可以把全网用户**引到你指定的服务器**，' +
                  '既可实施中间人窃听，也可用于钓鱼与 DDoS 放大。' +
                  '因此 DNS 是**单点故障风险最高**的基础服务之一。',
                coreIdea:
                  'PPT 第 96 页把 DNS 攻击分为四类：' +
                  '**① DDoS 攻击**：' +
                  '轰炸根服务器（迄今未成功，因为根服务器有任播冗余且本地缓存扛住了大部分流量）；' +
                  '**流量过滤**是常用绕过手段——本地 DNS 服务器缓存了顶级域服务器的 IP，' +
                  '于是攻击流量可以**绕过根服务器**，直接轰炸顶级域服务器，**潜在危险更大**；' +
                  '**② 重定向攻击 / 中间人**：截获查询并改写应答；' +
                  '**③ DNS 投毒**：向 DNS 服务器发送伪造应答，服务器会把假记录缓存下来；' +
                  '**④ 利用 DNS 发动 DDoS**：伪造源地址发送查询，利用**反射放大**攻击目标。',
                mechanism:
                  '反射放大的原理：攻击者向大量开放的 DNS 服务器发送查询，' +
                  '**源地址伪造成受害者 IP**；DNS 服务器把**体积大得多**的应答直接发给受害者。' +
                  '因为“请求小、应答大”，流量被放大了几十倍甚至上千倍（典型的放大因子 30~70），' +
                  '攻击者用很少的带宽就打垮了受害者。',
                comparison:
                  '**轰炸根 vs 轰炸顶级域**：' +
                  '根服务器有 13 个逻辑标识、成百上千个 anycast 物理副本，且**根服务器不保存具体主机记录**、' +
                  '本地 DNS 缓存了根的转介，因此根服务器能扛住常规攻击；' +
                  '而**顶级域服务器数量少得多**（如 .com 只有十来个机房），' +
                  '一旦被绕过根直接轰炸，**潜在危险更大**。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    'DNS 是全网基础设施，其安全问题被放大：一旦名字解析被劫持或瘫痪，影响面覆盖整个互联网。' +
                    'PPT 第 96 页总结了四类攻击。',
                },
                { type: 'h', text: '一、DDoS 攻击' },
                {
                  type: 'list',
                  items: [
                    '**轰炸根服务器**：用大量流量冲击根名称服务器——**迄今未成功**',
                    '**流量过滤（traffic filtering）**：本地 DNS 服务器缓存了顶级域服务器的 IP，' +
                    '因此可以**绕过根服务器**，直接轰炸顶级域服务器',
                    '**轰炸顶级域服务器潜在更危险（potentially more dangerous）**：顶级域服务器数量远少于根服务器',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么根服务器扛得住而顶级域扛不住？',
                  text:
                    '① **数量与冗余**：根服务器有 13 个逻辑标识，通过 anycast 部署在全球成百上千个地点；' +
                    '而 .com 的顶级域服务器只有十来个核心节点。' +
                    '② **缓存的作用**：本地 DNS 服务器缓存了“根服务器在哪”的转介，' +
                    '绝大多数查询**根本不接触根服务器**；' +
                    '而顶级域服务器虽然也被缓存，但缓存粒度更细、条目更多，仍有相当比例的查询直达。' +
                    '③ **数据量**：根服务器只保存顶级域的指路信息，单次响应极小。',
                },
                { type: 'h', text: '二、重定向攻击与中间人' },
                {
                  type: 'list',
                  items: [
                    '**重定向攻击（redirect attacks）**：把用户的 DNS 查询**重定向**到攻击者控制的地址',
                    '**中间人（man-in-the-middle）**：**截获查询**，在应答中替换成自己的地址',
                  ],
                },
                {
                  type: 'p',
                  text:
                    '这两类攻击依赖**“嗅探到明文的查询 + 抢先应答”**。' +
                    '由于 DNS 早期跑在 UDP 上、且事务 ID 只有 16 位，攻击者很容易伪造应答。',
                },
                { type: 'h', text: '三、DNS 投毒（DNS poisoning）' },
                {
                  type: 'p',
                  text:
                    '**向 DNS 服务器发送伪造的应答（bogus replies）**，该服务器会把这些假记录**缓存下来**，' +
                    '随后所有向它查询的用户都会得到错误的 IP。' +
                    '这比单纯的中间人更持久——**一次投毒，污染整个缓存条目，影响大量用户**。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：投毒 vs 中间人',
                  text:
                    '**中间人攻击**是**每次查询都实时拦截并篡改**，攻击者必须在线；' +
                    '**DNS 投毒**是**一次性把假记录写入缓存**，之后无需攻击者在线也持续生效。' +
                    '两者常被混为一谈，但攻击成本与持续性差别很大。',
                },
                { type: 'h', text: '四、利用 DNS 发动 DDoS（反射放大）' },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '攻击者**伪造源地址**（spoofed source address）为受害者的 IP，向大量开放的 DNS 服务器发送查询',
                    'DNS 服务器不知情，把**体积大得多的应答**直接发送给受害者',
                    '这称为**反射放大（amplification）**——攻击者不需要高带宽',
                  ],
                },
                {
                  type: 'formula',
                  latex: '\\text{amplification factor} = \\frac{\\text{size of DNS reply}}{\\text{size of DNS query}}',
                  caption: 'DNS 反射放大的放大因子',
                },
                {
                  type: 'vars',
                  items: [
                    { symbol: '\\text{amplification factor}', meaning: '放大因子：应答大小与查询大小之比', unit: '倍' },
                    { symbol: '\\text{size of DNS reply}', meaning: 'DNS 应答报文的字节数', unit: 'byte' },
                    { symbol: '\\text{size of DNS query}', meaning: 'DNS 查询报文的字节数', unit: 'byte' },
                  ],
                },
                {
                  type: 'example',
                  title: '反射放大算例',
                  steps: [
                    '攻击者伪造源 IP 为受害者，向开放 DNS 服务器发送查询：查询报文约 50 字节',
                    'DNS 服务器返回含多条记录的应答：约 500~4000 字节',
                    '放大因子 ≈ 500/50 ~ 4000/50 = 10 ~ 80 倍（DNS 反射攻击典型值 30~70 倍）',
                    '若攻击者以 1 Gbps 发出查询流量，理论上可在受害者处产生 30~70 Gbps 的入向流量',
                  ],
                  answer: 'DNS 反射放大的放大因子典型为 30~70 倍，是最廉价的 DDoS 武器之一。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：DNS 攻击的四种类型',
                  text:
                    '**① DDoS（轰炸根——未成功；流量过滤绕过根直轰 TLD——更危险）；' +
                    '② 重定向/中间人（截获查询并篡改应答）；' +
                    '③ DNS 投毒（发送伪造应答使其被缓存）；' +
                    '④ 利用 DNS 做 DDoS（伪造源地址 + 反射放大）。**' +
                    '注意第 4 项是“**利用 DNS 作为攻击跳板**”，与第 1 项“**直接攻击 DNS 服务器**”性质不同。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：现代防护手段',
                  text:
                    '① **DNSSEC**（RFC 4033~4035）：对 RR 集做数字签名，' +
                    '使解析器能验证应答真伪，杜绝投毒与篡改（但需整条链上都有签名才有效）。' +
                    '② **DNS over TLS（DoT, RFC 7858）** 与 **DNS over HTTPS（DoH, RFC 8484）**：' +
                    '加密 DNS 流量，防止中间人与嗅探。' +
                    '③ **源端口随机化 + 事务 ID 随机化 + 查询名随机化（0x20 encoding）**：' +
                    '提高盲猜难度。' +
                    '④ **RRL（响应速率限制）**、**自动黑洞**、**Anycast 分散**。' +
                    '⑤ **DNS Cookies（RFC 7873）**：用客户端 Cookie 验证应答确实来自被查询的服务器。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.3',
                  label: '相关：层次名称服务器：根、顶级域、权威',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.5.7',
                  label: '相关：DNS 报文格式',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.5.3', 'k2.5.7', 'k1.6.2'],
            },
          ],
        },
      ],
    },
    // ==========================================================
    // 2.6 P2P 文件分发
    // ==========================================================
    {
      id: 's2.6',
      title: '2.6 P2P 文件分发',
      en: 'P2P File Sharing',
      subsections: [
        {
          id: 's2.6.1',
          title: '文件分发模型',
          knowledge: [
            {
              id: 'k2.6.1',
              title: 'C/S 与 P2P 分发时间对比',
              en: 'Distribution Time',
              summary:
                '客户-服务器分发时间为 max{NF/u_s, F/d_min}，随 N 线性增长；P2P 分发时间为 max{F/u_s, F/d_min, NF/(u_s+Σu_i)}，可随 N 线性扩展。',
              tags: ['P2P', '文件分发', '分发时间', '公式'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [99, 100, 101, 102] },
                { kind: 'kaoyan', note: '王道考研：P2P 与 C/S 文件分发时间公式是必考计算题' },
              ],
              insight: {
                why:
                  '为什么要研究分发时间？因为这是衡量 P2P 架构价值的**量化指标**：' +
                  '在相同的文件大小与相同的用户规模下，**哪种架构能让用户更快拿到文件**？' +
                  '公式推导出的结论是：**C/S 随 N 线性增长，P2P 也随 N 线性增长，但两者的“斜率”不同**——' +
                  'P2P 把下载总能力从 $u_s$ 扩展到 $u_s + \\sum u_i$。',
                coreIdea:
                  '要向 N 个对等端分发大小为 F 的文件，问题归结为：**每个对等端的下载速率（download rate）是有限的资源**。' +
                  '**客户-服务器**：服务器必须顺序上传 N 份副本；' +
                  '**P2P**：服务器只需上传**至少一份**，其余由对等端之间互相上传完成。',
                mechanism:
                  '两条关键约束决定了公式的形式：' +
                  '① **每个客户必须下载一份完整副本**，因此最快也要 $F/d_{min}$（$d_{min}$ 是最小下载速率）；' +
                  '② **服务器的上传能力是有限的**：C/S 模式下服务器要上传 N 份，耗时 $NF/u_s$；' +
                  'P2P 模式下服务器至少要上传一份，耗时 $F/u_s$，' +
                  '而所有对等端**聚合起来**要下载 NF bit，最大可用上传能力是 $u_s + \\sum_{i=1}^{N} u_i$。',
                comparison:
                  'C/S 的 $D_{c-s} = \\max\\{NF/u_s,\\ F/d_{min}\\}$ 随 N **线性**增长，且瓶颈是**服务器**；' +
                  'P2P 的 $D_{P2P} = \\max\\{F/u_s,\\ F/d_{min},\\ NF/(u_s+\\sum_{i=1}^{N}u_i)\\}$ 同样线性增长，' +
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
                    '服务器必须**顺序发送（upload）N 份文件副本**：' +
                    '发送一份副本的时间是 $F/u_s$；发送 N 份需要 $NF/u_s$——**随 N 线性增长**。' +
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
                    '实际完成时间取两者的**较大者**——这是典型的“并行任务取瓶颈”结构，' +
                    '与第一章的“吞吐量受限于最慢链路”完全同构。',
                },
                { type: 'h', text: '二、P2P 模式（PPT 第 101 页）' },
                {
                  type: 'p',
                  text:
                    '在 P2P 模式中，服务器**只需上传至少一份副本**，耗时 $F/u_s$。' +
                    '其余的副本由对等端之间互相上传完成：' +
                    '所有客户端**聚合起来**需要下载 NF bit，' +
                    '而**最大上传速率（限制最大下载速率的量）是 $u_s + \\sum u_i$**——' +
                    '每个对等端都贡献了自己的服务能力，**这正是 P2P 自我扩展的数学表达**。',
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
                    '**求和范围是 i = 1 到 N**。' +
                    '正确的公式为：' +
                    '$D_{P2P} = \\max\\{F/u_s,\\ F/d_{min},\\ NF/(u_s+\\sum_{i=1}^{N}u_i)\\}$。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：两式对比怎么答',
                  text:
                    '① **C/S 随 N 线性增长**（$NF/u_s$ 项），瓶颈在**服务器**；' +
                    '② **P2P 也随 N 线性增长**（第三项），但**分母随 N 增大**（聚合上传能力），所以斜率更小；' +
                    '③ P2P 多出的两项 $F/u_s$ 与 $F/d_{min}$ 反映了“服务器至少要发一份”“最慢客户端至少要下一份”的下界；' +
                    '④ **C/S 与 P2P 的最优应用规模不同**：N 小用 C/S，N 大用 P2P。',
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
                    '结论非常直观：**P2P 的分发时间有上界（约为 $F/u$），而 C/S 随 N 无界增长**。' +
                    '这就是 P2P 架构在“大规模分发”场景下的根本优势，' +
                    '也解释了为什么 P2P 文件共享能在服务器昂贵的年代生存并发展起来。',
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
                  '因为新加入的对等端**不知道其他人在哪里**。' +
                  '没有中心节点就永远无法建立第一个连接。' +
                  'tracker 只做一件事——**交换对等端列表**——它不保存文件、不传输数据，' +
                  '因此不会成为带宽瓶颈，也就不会破坏 P2P 的自扩展性。',
                coreIdea:
                  '**torrent（种子）**：一群互相交换文件**分块（chunk）**的对等端。' +
                  '**tracker**：跟踪参与某个 torrent 的对等端。' +
                  '文件被切成 **256 Kb 的分块**。' +
                  '对等端从 tracker **获得对等端列表**，然后开始与列表中的对等端**交换文件分块**。',
                mechanism:
                  '**请求分块（requesting chunks）**：同一时刻不同对等端拥有不同的分块子集；' +
                  'Alice **周期性地**向每个对等端询问它们拥有哪些分块，并**优先请求最稀有的分块（rarest first）**——' +
                  '这样能让最稀有的分块在整个群体中尽快扩散，避免“最后一块没人有”的死锁。' +
                  '**发送分块（sending chunks）：tit-for-tat（以牙还牙）**：' +
                  'Alice 只向**当前向她发送分块速率最高的 4 个对等端**发送分块，其余被她 **choke（阻塞）**；' +
                  '**每 10 秒重估一次前 4 名**；**每 30 秒随机选一个对等端开始发送分块**，' +
                  '即**乐观解阻（optimistically unchoke）**，这个新选中的对等端可能因此进入前 4 名。',
                comparison:
                  '**纯 P2P 架构**（PPT 第 98 页）：无 always-on 服务器，任意端系统直接通信，' +
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
                    '典型应用：**文件分发（BitTorrent）**、**流媒体（KanKan）**、**VoIP（Skype）**',
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
                    '**churn（ churn）：对等端可能随时来、随时走**',
                    '**一旦拥有完整文件**，该对等端可以（自私地）离开，或（利他地）**留在 torrent 中继续做种（seeding）**',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: 'churn 为什么是难题',
                  text:
                    '对等端随时进出，意味着**你辛苦积累的分块可能“蒸发”**（你下了一半，对方离线了）。' +
                    '解决办法有两个：' +
                    '① **优先下最稀有的分块**（rarest first）——先拿走最容易被别人拿走的东西；' +
                    '② **分块冗余**：多个对等端都保有同一分块。' +
                    '这正是 BitTorrent 下一节的两个核心策略的由来。',
                },
                { type: 'h', text: '四、请求分块与发送分块（PPT 第 105 页）' },
                {
                  type: 'table',
                  caption: 'BitTorrent 的两个策略',
                  headers: ['策略', '具体做法', '目的'],
                  rows: [
                    ['请求：rarest first（优先最稀有）', '同一时刻不同对等端拥有不同的分块子集；Alice **周期性地**向每个对等端询问它们拥有哪些分块，并**优先请求最稀有的分块**', '让最稀有的分块在整个群体中**尽快扩散**，避免“最后一块没人有”的死锁'],
                    ['发送：tit-for-tat（以牙还牙）', 'Alice 向**当前向她发送分块速率最高的 4 个对等端**发送分块；其他对等端被她 **choke**（阻塞，不给它们分块）；**每 10 秒重估前 4 名**；**每 30 秒随机选一个对等端开始发送**，即**乐观解阻（optimistically unchoke）**，它可能因此进入前 4 名', '激励对等端互相上传（上传者得到更快的下载回报）'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：三个数字必须记牢',
                  text:
                    '**256 Kb**：文件分块大小。' +
                    '**前 4 名（top 4）**：tit-for-tat 中 Alice 只向上传给她最快的 4 个对等端上传。' +
                    '**每 10 秒**：重估前 4 名。' +
                    '**每 30 秒**：随机选一个对等端乐观解阻。' +
                    '这四个数字几乎每年都会出现在考题中。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么要有“乐观解阻”这么个 seemingly 亏本的设计？',
                  text:
                    '如果 Alice 永远只给固定的 4 个对等端上传，就可能陷入**局部最优**：' +
                    '固定的 4 个伙伴恰好下载速度慢，或者它们之间形成小团体互传，外面的高速对等端永远进不来。' +
                    '每 30 秒随机换一个“试用”对象，等于**定期做一次探索（exploration）**，' +
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
                    '经典 BitTorrent 依赖 tracker（**集中式索引**）；' +
                    '后来的 **Mainline DHT**（分布式哈希表）把索引也去中心化，' +
                    '使纯 P2P 无 tracker 也能工作；' +
                    '**磁力链接（magnet link）**就是通过哈希值在 DHT 中找到同一文件的所有对等端。' +
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
      ],
    },
    // ==========================================================
    // 2.7 / 2.8 Socket 编程
    // ==========================================================
    {
      id: 's2.7',
      title: '2.7/2.8 Socket 编程',
      en: 'Socket Programming',
      subsections: [
        {
          id: 's2.7.1',
          title: 'TCP/UDP 套接字',
          knowledge: [
            {
              id: 'k2.7.1',
              title: 'Socket API 概念',
              en: 'Socket API',
              summary:
                '套接字是主机本地、由应用创建、由操作系统控制的一扇“门”，应用进程可借此向另一应用进程收发消息；Socket API 提供不可靠数据报与可靠字节流两类传输服务。',
              tags: ['Socket', '套接字API', '字节流', '数据报'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [108, 109] },
                { kind: 'supplement', note: '补充：socket API 的历史（BSD sockets）与跨平台封装' },
              ],
              insight: {
                why:
                  '为什么要专门有 Socket API？前面说过，应用层协议规定了消息格式，' +
                  '但**怎么把字节真正送出去**由操作系统提供。' +
                  'Socket API 就是这套标准化的接口：' +
                  '它让应用开发者**不必自己处理 IP 分组、重传、拥塞控制**这些底层细节，' +
                  '只需调用 socket / bind / listen / accept / connect / send / recv 这几个函数。',
                coreIdea:
                  '套接字是**主机本地（host-local）的、应用创建的、由操作系统控制的接口**——' +
                  '一扇“门”，应用进程既可以**向另一个应用进程发送消息**，也可以**从另一个应用进程接收消息**。' +
                  'Socket API 提供**两种传输服务**：' +
                  '**不可靠数据报（unreliable datagram）** 与 **可靠的、面向字节流的（reliable, byte stream-oriented）**。',
                mechanism:
                  'PPT 第 109 页画出了职责划分：' +
                  '**套接字由应用开发者控制**，' +
                  '**套接字另一侧的 TCP（含缓冲区与状态变量）由操作系统控制**。' +
                  '应用开发者面对的是一个**流（stream）抽象**——' +
                  'TCP 提供“从一个进程到另一个进程的可靠字节传输”，' +
                  '应用只需读写字节，不必关心分包、重组、丢包重传。',
                comparison:
                  '两种服务的对比：' +
                  '**可靠字节流（TCP）**：保证不丢、不重、不乱序；但**不保留消息边界**——' +
                  '一次 send 可能被拆成多次 recv，**应用必须自己定义消息边界**。' +
                  '**不可靠数据报（UDP）**：保留消息边界（一次 send 对应一个数据报），' +
                  '但可能丢失、可能乱序、可能收到超过缓冲区长度的截断数据报。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '**Socket API** 是应用层程序访问网络的方式（PPT 第 108 页）。' +
                    '套接字是**显式创建、使用与释放**的（explicitly created, used, released by apps）。' +
                    '它采用**客户-服务器范式**，并通过 Socket API 提供**两种类型的传输服务**：' +
                    '**不可靠数据报** 与 **可靠的、面向字节流的传输**。',
                },
                {
                  type: 'term',
                  zh: '套接字',
                  en: 'socket',
                  def: '主机本地（host-local）的、由应用创建、由操作系统控制的接口——一扇“门”，应用进程可以通过它向另一个应用进程发送与接收消息。',
                },
                {
                  type: 'figure',
                  alt: '套接字是应用进程与端到端传输协议之间的门',
                  caption: 'PPT 第 109 页：Socket programming using TCP',
                  ascii:
                    '  主机或服务器进程                     主机或服务器进程\n  ┌───────────────────┐              ┌───────────────────┐\n  │                   │              │                   │\n  │   ┌───────────┐   │              │   ┌───────────┐   │\n  │   │   socket  │   │              │   │   socket  │   │\n  │   │ (由应用    │   │              │   │ (由应用    │   │\n  │   │  开发者    │   │              │   │  开发者    │   │\n  │   │  控制)    │   │              │   │  控制)    │   │\n  │   └─────┬─────┘   │              │   └─────┬─────┘   │\n  │         │         │              │         │         │\n  │   ┌─────▼─────┐   │              │   ┌─────▼─────┐   │\n  │   │TCP + 缓冲 │   │   互联网      │   │TCP + 缓冲 │   │\n  │   │区 + 变量  │   │◄────────────►│   │区 + 变量  │   │\n  │   │(由操作系统 │   │              │   │(由操作系统 │   │\n  │   │  控制)    │   │              │   │  控制)    │   │\n  │   └───────────┘   │              │   └───────────┘   │\n  └───────────────────┘              └───────────────────┘\n        socket：应用进程与端到端传输协议（UDP 或 TCP）之间的门',
                },
                {
                  type: 'list',
                  items: [
                    '**socket 由应用开发者控制**（controlled by application developer）',
                    '**socket 之下的 TCP（含缓冲区与状态变量）由操作系统控制**（controlled by operating system）',
                    'TCP 服务：**从一个进程到另一个进程的可靠字节传输**',
                    '**流（stream）概念**：流是流入或流出进程的一个字符序列',
                    '**输入流（input stream）**附加在进程的某个输入源上，如键盘或套接字',
                    '**输出流（output stream）**附加在进程的某个输出源上，如显示器或套接字',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：套接字的两侧分别由谁控制',
                  text:
                    '**应用开发者控制套接字本身**（创建、绑定、读写、关闭）；' +
                    '**操作系统控制套接字下方的传输层实体**（TCP/UDP 的缓冲区与状态变量）。' +
                    '这是“应用与传输层之间接口”的精确含义。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：字节流没有消息边界',
                  text:
                    'TCP 是**字节流**而不是**消息流**：' +
                    '应用连续发送两条消息，接收方的一次 read 可能读到**半条 + 一条半**，' +
                    '也可能一次读出两条。' +
                    '因此 **TCP 应用必须自己定义消息边界**（常见做法：定长、分隔符（如 "\\n"）、或长度前缀）。' +
                    '这是本章编程部分最容易出错的地方。',
                },
                {
                  type: 'table',
                  caption: 'Socket API 的两类传输服务对比',
                  headers: ['对比维度', '可靠字节流（TCP）', '不可靠数据报（UDP）'],
                  rows: [
                    ['连接', '需要建立连接（connect / accept）', '无连接，直接指定目的地址'],
                    ['可靠性', '不丢、不重、不乱序', '可能丢失、乱序、重复'],
                    ['消息边界', '**无边界**，需应用自行划分', '**保留边界**，一次发送 = 一个数据报'],
                    ['典型 API', 'Socket / ServerSocket（Java）、socket / bind / listen / accept（C）', 'DatagramSocket（Java）、socket / sendto / recvfrom（C）'],
                    ['适合的应用', 'HTTP、FTP、SMTP、POP3/IMAP、DNS（大响应）', 'DNS 查询、实时音视频、在线游戏、DHCP'],
                  ],
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.7.2',
                  label: '相关：TCP 套接字编程',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.7.3',
                  label: '相关：UDP 套接字编程',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.7.2', 'k2.7.3', 'k2.1.3'],
            },
            {
              id: 'k2.7.2',
              title: 'TCP 套接字编程',
              en: 'TCP Sockets',
              summary:
                'TCP 套接字编程中，服务器必须先运行并创建监听套接字，客户端创建套接字并指定服务器 IP 与端口发起连接；服务器 accept 后为每个客户端创建独立连接套接字，靠源端口区分客户端。',
              tags: ['TCP', '套接字编程', 'accept', 'connect', '字节流'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [110, 111, 112, 113, 114, 115, 116] },
              ],
              insight: {
                why:
                  '为什么 TCP 服务器比客户端复杂？因为**服务器必须先运行**——' +
                  '客户端要连接的目标必须已经在那儿“等着”。' +
                  '这带来一个结构性差异：服务器需要**两个套接字**：' +
                  '一个负责“等待新连接”（监听套接字），' +
                  '一个负责“与某个具体客户端对话”（连接套接字）。',
                coreIdea:
                  '**服务器端**：服务器进程必须先运行；服务器必须先创建一个**欢迎客户端连接的套接字**（door）。' +
                  '**客户端**：创建本地 TCP 套接字，并**指定服务器进程的 IP 地址与端口号**来联系服务器；' +
                  '**当客户端创建套接字时，客户端的 TCP 就与服务器的 TCP 建立了连接**。',
                mechanism:
                  '服务器被联系时，**服务器的 TCP 为服务器进程创建一个新套接字**，' +
                  '使服务器能**同时与多个客户端对话**；' +
                  '**通过源端口号（source port number）区分不同客户端**。' +
                  'TCP 提供**可靠的、有序的字节传输（“管道 pipe”）**，' +
                  '这是应用开发者视角下的服务。',
                comparison:
                  '服务器的两个套接字：**监听套接字（serverSocket）**永远打开、只负责 accept；' +
                  '**连接套接字（connectionSocket）**每次 accept 产生一个、专门服务一个客户端、用完关闭。' +
                  '这是“单线程/多线程/事件驱动”三种服务器实现方式的共同基础。',
              },
              blocks: [
                { type: 'h', text: '一、客户端必须先联系上服务器（PPT 第 110 页）' },
                {
                  type: 'list',
                  items: [
                    '**服务器进程必须先运行**（server process must first be running）',
                    '服务器必须**已经创建好套接字（门）**来欢迎客户端的连接',
                    '客户端通过两步联系服务器：① **创建客户端本地的 TCP 套接字**；' +
                    '② **指定服务器进程的 IP 地址与端口号**',
                    '**当客户端创建套接字时，客户端的 TCP 就与服务器的 TCP 建立了连接**',
                  ],
                },
                { type: 'h', text: '二、服务器如何同时服务多个客户端（PPT 第 111 页）' },
                {
                  type: 'list',
                  items: [
                    '服务器 TCP 被联系时，**为服务器进程创建一个新套接字**，用于与该客户端通信',
                    '这使服务器能**同时与多个客户端对话**',
                    '**通过源端口号区分不同客户端**（更多细节见第三章 s3.2.4）',
                    '从应用视角看，TCP 提供**可靠、有序的字节传输（像一根“管道 pipe”）**',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '**服务器两把钥匙**：一把（监听套接字）负责“等人来”，一把（连接套接字）负责“和人谈”。',
                },
                { type: 'h', text: '三、流（stream）术语（PPT 第 112 页）' },
                {
                  type: 'list',
                  items: [
                    '**流（stream）**：流入或流出进程的一个**字符序列**',
                    '**输入流（input stream）**：附加在进程的某个输入源上，例如键盘或套接字',
                    '**输出流（output stream）**：附加在进程的某个输出源上，例如显示器或套接字',
                  ],
                },
                { type: 'h', text: '四、示例应用（PPT 第 113 页）' },
                {
                  type: 'p',
                  text: '一个简单的客户-服务器应用，做的事是“**把用户输入的一行变成大写回显**”：',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '客户端从标准输入读取一行（**inFromUser 流**），通过套接字发给服务器（**outToServer 流**）',
                    '服务器从套接字读取这一行',
                    '服务器把该行转换为**大写**并送回客户端',
                    '客户端从套接字读取并打印修改后的行（**inFromServer 流**）',
                  ],
                },
                {
                  type: 'figure',
                  alt: 'TCP 客户/服务器套接字交互时序',
                  caption: 'PPT 第 114 页：Client/server socket interaction — TCP',
                  ascii:
                    '  服务器（运行在 hostid 上）                    客户端\n  ┌────────────────────────────┐            ┌─────────────────┐\n  │ 创建套接字，用于接收请求：   │            │ 创建套接字，      │\n  │ serverSocket = socket()     │            │ 连接到 hostid,   │\n  │  (port = x)                 │            │  port = x        │\n  │                            │            │ clientSocket=    │\n  │                            │            │  socket()        │\n  │                            │◄─── TCP 连接建立 ───►│                 │\n  │ 等待传入的连接请求          │            │                 │\n  │ connectionSocket =         │            │ 用 clientSocket  │\n  │   serverSocket.accept()    │            │  发送请求        │\n  │                            │◄───── 请求 ──────────│                 │\n  │ 从 connectionSocket 读请求  │            │                 │\n  │ 向 connectionSocket 写回复  │            │                 │\n  │                            │────── 回复 ─────────►│ 从 clientSocket │\n  │                            │            │  读回复          │\n  │ 关闭 connectionSocket       │            │ 关闭 clientSocket│\n  └────────────────────────────┘            └─────────────────┘',
                },
                { type: 'h', text: '五、Java 客户端示例（PPT 第 115 页）' },
                {
                  type: 'p',
                  text:
                    'PPT 第 115、116 页给出了 Java 版的客户端与服务器代码。' +
                    'Java 把套接字抽象为流，因此代码非常直观：' +
                    '客户端用 `Socket socket = new Socket(hostid, port)` 建立连接，' +
                    '再用 `PrintWriter outToServer` 与 `BufferedReader inFromServer` 读写；' +
                    '服务器用 `ServerSocket` 监听端口，' +
                    '调用 `accept()` 得到 `Socket connectionSocket`，再包装成流进行通信。',
                },
                {
                  type: 'figure',
                  alt: 'Java TCP 客户端与服务器的核心代码结构',
                  caption: 'PPT 第 115、116 页：Example client/server (TCP)',
                  ascii:
                    '// —— 客户端（PPT 115）——\nSocket socket = new Socket(hostid, port);\nPrintWriter outToServer = new PrintWriter(socket.getOutputStream(), true);\nBufferedReader inFromServer = new BufferedReader(new InputStreamReader(socket.getInputStream()));\n// 读标准输入 → outToServer → 读 inFromServer → 打印\n\n// —— 服务器（PPT 116）——\nServerSocket serverSocket = new ServerSocket(port);\n// 一直保留，持续监听新客户；最多排队 1 个待处理连接\nwhile (true) {\n  Socket connectionSocket = serverSocket.accept();   // 阻塞调用：\n  // 服务器停在这里，直到收到客户端的 TCP 连接请求\n  // 读 connectionSocket → 处理（如转大写）→ 写回 connectionSocket\n  // 1024 字节数据\n}',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：Java TCP 的四个关键 API',
                  text:
                    '**`new Socket(host, port)`** —— 客户端连接（内部完成三次握手）。' +
                    '**`new ServerSocket(port)`** —— 服务器监听（默认 backlog 通常为 50）。' +
                    '**`serverSocket.accept()`** —— **阻塞**调用，返回一个与该客户端通信的 `Socket`（即 connectionSocket）。' +
                    '**`socket.getInputStream()` / `getOutputStream()`** —— 取得输入/输出流。' +
                    '最常考的一句：**accept() 会阻塞**，因此服务器通常把它放在独立线程里（或用线程池）。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：TCP 的流没有消息边界',
                  text:
                    'Java 的 `BufferedReader.readLine()` 之所以能正确工作，' +
                    '是因为**应用自己定义了消息边界（以换行符结尾）**。' +
                    '如果直接用 `InputStream.read(byte[])` 读，**一次读到的字节数是不确定的**——' +
                    '可能读到半行。' +
                    '这就是“TCP 是字节流，应用要自己划分消息”的具体体现。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：并发服务器的两种写法',
                  text:
                    '① **线程式**：每次 accept 后新建一个线程处理该 connectionSocket；实现简单，是许多教材示例的做法。' +
                    '② **事件驱动式**：单线程用 `select`/`epoll` 轮询多个连接（PPT 第 123 页的简易 Web 服务器即采用类似思路）；' +
                    '适合连接数大但每个连接交互简单的场景。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.7.4',
                  label: '相关：构建简单 Web 服务器',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.7.1',
                  label: '相关：Socket API 概念',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.7.1', 'k2.7.3', 'k2.7.4'],
            },
            {
              id: 'k2.7.3',
              title: 'UDP 套接字编程',
              en: 'UDP Sockets',
              summary:
                'UDP 没有连接也没有握手：发送方在每个数据报上显式附加目的 IP 与端口，接收方必须从收到的数据报中提取源 IP 与端口；数据可能乱序或丢失。',
              tags: ['UDP', '套接字编程', 'DatagramSocket', '无连接'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [118, 119, 120, 121, 122] },
              ],
              insight: {
                why:
                  '为什么 UDP 编程反而更简单？因为**没有连接，也就没有握手**。' +
                  'TCP 编程中那一整套“建连接—accept—关连接”的仪式，在 UDP 中全部省掉了：' +
                  '发送方只要在每个数据报里写明目的地址，接收方只要能收到并回信就行。',
                coreIdea:
                  '**UDP 在客户与服务器之间没有“连接”**，**没有握手（no handshaking）**。' +
                  '**发送方显式地把目的 IP 地址与端口附加到每个分组上**；' +
                  '**服务器必须从收到的分组中提取发送方的 IP 地址与端口**（以便回复）。' +
                  '从应用视角看，**UDP 提供的是不可靠的字节组（datagram）传输**，数据可能乱序到达或丢失。',
                mechanism:
                  '服务器：创建一个 `DatagramSocket` 绑定到端口，调用 `receive()` 得到 `DatagramPacket`，' +
                  '从中读取**数据 + 源 IP + 源端口**；' +
                  '回复时构造一个新的 `DatagramPacket`，**显式填入客户端的 IP 与端口**，再 `send()`。' +
                  '客户端同理：创建 `DatagramSocket`，把数据打包成 `DatagramPacket` 并填入服务器地址后发送。',
                comparison:
                  'UDP 与 TCP 编程的三个关键差异：' +
                  '① **无连接**：不需要 connect/accept，也就没有握手时延；' +
                  '② **必须显式指定对方地址**：UDP 的 send 需要提供目的 IP 与端口；' +
                  '③ **需自行处理丢包与乱序**：应用层可能要加序号、校验、超时重传等机制。',
              },
              blocks: [
                { type: 'h', text: '一、UDP 的四个特点（PPT 第 118 页）' },
                {
                  type: 'list',
                  items: [
                    'UDP 在客户与服务器之间**没有“连接”**',
                    '**没有握手（no handshaking）**',
                    '**发送方显式地把目的 IP 地址与端口附加到每个分组上**',
                    '**服务器必须从收到的分组中提取发送方的 IP 地址与端口**',
                    'UDP 传输的数据**可能乱序到达，或丢失**',
                    '应用视角：UDP 提供**不可靠的字节组（datagram）传输**',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：UDP 编程中“地址”出现的位置',
                  text:
                    'TCP 编程里地址只在 **connect** 时指定一次；' +
                    '**UDP 编程里地址出现在每一个数据报上**：' +
                    '发送时必须填入目的 IP 与端口，' +
                    '接收时必须从数据报中读出来源的 IP 与端口（否则无法回复）。' +
                    '这是判断题高频点。',
                },
                { type: 'h', text: '二、客户/服务器套接字交互（PPT 第 119 页）' },
                {
                  type: 'figure',
                  alt: 'UDP 客户/服务器套接字交互',
                  caption: 'PPT 第 119 页：Client/server socket interaction — UDP',
                  ascii:
                    '  服务器（运行在 hostid 上）                    客户端\n  ┌────────────────────────────┐            ┌─────────────────┐\n  │ 创建套接字，用于接收请求：   │            │ 创建套接字：     │\n  │ serverSocket =              │            │ clientSocket =  │\n  │   DatagramSocket()          │            │  DatagramSocket()│\n  │                            │            │                 │\n  │ 从 serverSocket 读请求       │◄─── 请求 ──│ 用 clientSocket  │\n  │ （数据 + 源 IP + 源端口）    │   (含地址)  │  发送数据报      │\n  │                            │            │                 │\n  │ 向 serverSocket 写回复，      │            │                 │\n  │ **显式指定客户端主机地址      │──── 回复 ─►│ 从 clientSocket │\n  │   与端口号**                 │            │  读回复          │\n  │                            │            │ 关闭 clientSocket│\n  └────────────────────────────┘            └─────────────────┘',
                },
                {
                  type: 'figure',
                  alt: 'Java UDP 客户端核心代码结构',
                  caption: 'PPT 第 120、121 页：Example client (UDP)',
                  ascii:
                    '// —— Java UDP 客户端（PPT 120/121）——\nDatagramSocket clientSocket = new DatagramSocket();\n\nInetAddress serverIP = InetAddress.getByName(serverHostname);\nint serverPort = 6789;\nbyte[] data = "...".getBytes();\n\nDatagramPacket sendPacket = new DatagramPacket(data, data.length, serverIP, serverPort);\nclientSocket.send(sendPacket);           // 发送：输出一个“数据包”\n\nDatagramPacket receivePacket = new DatagramPacket(buffer, buffer.length);\nclientSocket.receive(receivePacket);       // 接收：一个“数据包”\nString s = new String(receivePacket.getData(), 0, receivePacket.getLength());\nclientSocket.close();',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀：TCP 传“流”，UDP 传“包”',
                  text:
                    '**Java 里区分得最清楚**：' +
                    'TCP 用 `getInputStream()` / `getOutputStream()` —— **字节流**；' +
                    'UDP 用 `DatagramPacket` —— **数据报**。' +
                    'PPT 第 120 页的图注也明确写着：' +
                    '“Output: sends packet (TCP sent ‘byte stream’)；Input: receives packet (TCP received ‘byte stream’)”。',
                },
                {
                  type: 'table',
                  caption: 'Java UDP 客户端 API 速查',
                  headers: ['API', '作用'],
                  rows: [
                    ['`new DatagramSocket()`', '创建客户端套接字（系统自动分配本地端口）'],
                    ['`new DatagramSocket(port)`', '创建并绑定到指定端口（服务器常用）'],
                    ['`new DatagramPacket(data, len, addr, port)`', '构造发送数据报，**显式携带目的地址**'],
                    ['`socket.send(packet)` / `socket.receive(packet)`', '发送 / 接收数据报（receive 会阻塞）'],
                    ['`packet.getAddress()` / `getPort()`', '**取出数据报来源的 IP 与端口**（服务器回复时必需）'],
                    ['`packet.getLength()`', '取实际数据长度（UDP 数据报可能被截断）'],
                  ],
                },
                { type: 'h', text: '三、Java UDP 服务器（PPT 第 122 页）' },
                {
                  type: 'p',
                  text:
                    '服务器的结构是：创建 `DatagramSocket` 并绑定端口 → 循环 `receive()` → ' +
                    '从 `DatagramPacket` 中取出**数据**与**客户端地址** → 处理 → ' +
                    '构造回复数据报（**填入客户端地址**）→ `send()`。' +
                    '与 TCP 服务器最大的不同是：**不需要 accept，也不需要为每个客户端单独开线程**——' +
                    '因为 UDP 是无连接的，任何人往那个端口发包都会被处理。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：UDP 服务器要防“地址欺骗”与放大',
                  text:
                    '因为服务器是从数据报里读出发送方地址并直接回信的，' +
                    '**攻击者可以伪造源 IP**（所谓 IP spoofing），' +
                    '使服务器把流量发给无辜的第三方——这就是 k2.5.9 中“**DNS 反射放大攻击**”的原理。' +
                    '因此生产环境的 UDP 服务器通常会做**源地址验证**与**速率限制**。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：UDP 上的可靠性可以自己做',
                  text:
                    '如果应用既需要 UDP 的低时延，又需要一定的可靠性，' +
                    '可以在应用层加**序号 + 校验 + 超时重传 + 确认**（类似 TCP 但更轻量），' +
                    '或直接采用 **QUIC**（HTTP/3 的基础，RFC 9000）——' +
                    '它在 UDP 之上实现了可靠字节流与多路复用，' +
                    '既拿到了 UDP 的无握手优势，又避免了 TCP 的队头阻塞。',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.7.1',
                  label: '相关：Socket API 概念',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.7.4',
                  label: '相关：构建简单 Web 服务器',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.7.1', 'k2.7.2', 'k2.2.2'],
            },
            {
              id: 'k2.7.4',
              title: '构建简单 Web 服务器',
              en: 'Simple Web Server',
              summary:
                '简易 Web 服务器处理一个 HTTP 请求：接受连接、解析首部、从文件系统取得所请求的文件、生成“首部行 + 文件”的 HTTP 响应报文并发回客户端。',
              tags: ['Web服务器', 'Socket编程', 'HTTP'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter2', slides: [123] },
              ],
              insight: {
                why:
                  '为什么要专门讲“简易 Web 服务器”？因为它把前面所有知识**串成一条可运行的链路**：' +
                  '套接字（k2.7.1）→ HTTP 报文格式（k2.2.5、k2.2.6）→ 持续连接（k2.2.3）→ 响应时间模型（k2.2.4）。' +
                  '亲手写一个能返回网页的服务器，是把“协议”从纸面变成“可执行”的最佳方式。',
                coreIdea:
                  '简易 Web 服务器**只处理一个 HTTP 请求**（handles one HTTP request），步骤是：' +
                  '① **接受请求**（accepts the request）；' +
                  '② **解析首部**（parses header）；' +
                  '③ **从服务器的文件系统中取得所请求的文件**（obtains requested file from server’s file system）；' +
                  '④ **创建 HTTP 响应报文**：**首部行 + 文件**（header lines + file）；' +
                  '⑤ **把响应发送给客户端**（sends response to client）。' +
                  '创建好服务器后，就可以**用浏览器请求文件**（例如 IE Explorer）。',
                mechanism:
                  '实现要点：' +
                  '① 用 `ServerSocket` 监听 80 端口，`accept()` 拿到客户端连接；' +
                  '② 从流中**读出请求行**（如 `GET /index.html HTTP/1.1`）与首部行，' +
                  '解析出**所请求的 URL/文件名**；' +
                  '③ 用 `File` 打开服务器本地文件系统中的该文件，读取内容（文件不存在则返回 **404**）；' +
                  '④ 拼装响应：`HTTP/1.1 200 OK\\r\\n` + `Content-Type: ...\\r\\n` + `Content-Length: ...\\r\\n` + `\\r\\n` + 文件内容；' +
                  '⑤ 写回套接字并关闭连接。',
                comparison:
                  '与真实生产 Web 服务器（如 Apache、Nginx）相比，简易版缺少：' +
                  '**持久连接与流水线处理、并发处理、缓存、虚拟主机、目录列表、范围请求、断点续传、压缩**等。' +
                  '但它的**骨架与真实服务器完全一致**——这正是它的教学价值。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '**构建一个简易 Web 服务器**（PPT 第 123 页）是本章的综合实践。它**处理一个 HTTP 请求**，流程是：',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '**接受请求**（accepts the request）：调用 `accept()` 接受客户端的 TCP 连接',
                    '**解析首部**（parses header）：从请求行与首部行中解析出方法、URL、版本',
                    '**从服务器的文件系统中取得所请求的文件**（obtains requested file from server’s file system）',
                    '**创建 HTTP 响应报文：首部行 + 文件**（creates HTTP response message: header lines + file）',
                    '**把响应发送给客户端**（sends response to client）',
                    '创建好服务器之后，就可以**用浏览器请求文件**（例如 IE Explorer）',
                  ],
                },
                {
                  type: 'figure',
                  alt: '简易 Web 服务器的处理流程',
                  caption: 'PPT 第 123 页：Building a simple Web server',
                  ascii:
                    '  浏览器                          简易 Web 服务器\n    │  ① TCP 连接 (port 80)          │\n    │──────────────────────────────►│  serverSocket.accept()\n    │                               │\n    │  ② GET /index.html HTTP/1.1    │\n    │──────────────────────────────►│  解析请求行与首部行\n    │                               │  读取请求的文件\n    │                               │  (File / FileInputStream)\n    │                               │\n    │  ③ HTTP/1.1 200 OK            │\n    │     Content-Type: text/html   │\n    │     Content-Length: 2652      │\n    │     (空行)                     │\n    │     <文件内容>                 │\n    │◄──────────────────────────────│  写回连接套接字并关闭\n    │  ④ 浏览器渲染页面              │',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：简易 Web 服务器的五步',
                  text:
                    '**接受请求 → 解析首部 → 取得文件 → 生成响应（首部行 + 文件）→ 发送响应**。' +
                    '注意第 ④ 步的响应报文结构是“**首部行 + 文件**”，' +
                    '与 k2.2.6 中的“状态行 + 首部行 + 实体主体”完全对应——' +
                    '**首部行 + 文件**就是状态行、首部行与实体主体的合称。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：三个必写的首部',
                  text:
                    '① **Content-Type**：告诉浏览器如何渲染（text/html、image/jpeg…）；' +
                    '② **Content-Length**：告诉浏览器正文有多少字节，浏览器据此判断何时读完；' +
                    '③ **首部行之后必须有一个空行（\\r\\n\\r\\n）**，否则浏览器会把文件内容当成首部行而一直等待。' +
                    '另外文件不存在时应返回 **404 Not Found**，而不是直接断开连接。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：这个练习把整章串起来了',
                  text:
                    '写这个服务器需要用到：' +
                    '**k2.7.2** 的 TCP 套接字（ServerSocket / accept / 流）、' +
                    '**k2.2.5** 的请求报文格式（请求行与首部行的解析）、' +
                    '**k2.2.6** 的响应报文格式（状态行 + 首部行 + 实体主体）、' +
                    '**k2.2.3** 的连接管理（一次请求后关闭连接还是保持）、' +
                    '以及 **k2.2.4** 的响应时间模型（为什么打开一个网页要等 2 RTT）。' +
                    '**写完它，你就真正理解 HTTP 了。**',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.7.2',
                  label: '相关：TCP 套接字编程',
                },
                {
                  type: 'knowledgeRef',
                  knowledgeId: 'k2.2.6',
                  label: '相关：HTTP 响应报文与状态码',
                },
              ],
              questionIds: [],
              demoIds: [],
              related: ['k2.7.2', 'k2.2.5', 'k2.2.6'],
            },
          ],
        },
      ],
    },
  ],
  summary: {
    id: 'sum-ch2',
    chapterId: 'ch2',
    title: '第二章 应用层 · 章节总结',
    questionIds: [],
    framework: [
      {
        type: 'p',
        text:
          '本章的逻辑主线是：**应用层协议规定“说什么、什么时候说”，传输层负责“可靠地、按时地送到”。**' +
          '全章 35 个知识点可以归纳为七个部分：',
      },
      {
        type: 'table',
        caption: '第二章知识框架',
        headers: ['层次', '小节', '核心问题', '代表协议/技术'],
        rows: [
          ['2.1 原理', '应用体系结构', '谁提供服务、谁维护状态', 'C/S、P2P、混合架构'],
          ['2.1 原理', '进程与套接字', '如何定位并连接到进程', '进程、socket、端口号（80/25/21/20）'],
          ['2.1 原理', '传输服务需求', '应用需要什么样的服务质量', '可靠性、时延、吞吐量、安全性'],
          ['2.1 原理', 'TCP 与 UDP', '传输层提供哪两种服务模型', 'TCP（可靠字节流）、UDP（不可靠数据报）'],
          ['2.2 Web 与 HTTP', 'HTTP 基础', '网页怎么取、连接怎么开', 'URL、非持续/持续、流水线、2RTT+T'],
          ['2.2 Web 与 HTTP', 'HTTP 报文', '消息长什么样', '请求行/状态行、方法表、状态码表'],
          ['2.2 Web 与 HTTP', '状态与缓存', '如何跨请求记住用户、如何加速', 'Cookie（4 组件）、Web 缓存、条件 GET'],
          ['2.3 FTP', '文件传输协议', '怎么传文件', '控制连接 21 / 数据连接 20、命令与返回码'],
          ['2.4 电子邮件', '邮件系统与 SMTP', '邮件怎么从发件人送到收件人', 'UA / 邮件服务器 / SMTP 三组件、三阶段'],
          ['2.4 电子邮件', '报文格式与访问', '邮件正文怎么表示、怎么被取走', 'RFC 822、MIME、POP3 vs IMAP'],
          ['2.5 DNS', '概述与结构', '名字怎么组织与定位', '分布式层次数据库、根/TLD/权威/本地'],
          ['2.5 DNS', '查询机制与记录', '怎么查、记录长什么样', '迭代 vs 递归、RR 四元组与 A/NS/CNAME/MX'],
          ['2.6 P2P', '文件分发', 'P2P 到底快不快', '$D_{c-s}$ 与 $D_{P2P}$ 公式'],
          ['2.6 P2P', 'BitTorrent', 'P2P 怎么落地', 'tracker、256Kb 分块、rarest first、tit-for-tat'],
          ['2.7/2.8 编程', 'Socket 编程', '怎么把协议写成代码', 'TCP/UDP 套接字、简易 Web 服务器'],
        ],
      },
      {
        type: 'p',
        text:
          '**贯穿全章的三条线**：' +
          '① **分层线索**——应用层只关心消息语义，可靠性/时延/带宽交给传输层；' +
          '② **服务模型线索**——pull（HTTP、DNS 客户端侧）vs push（SMTP）、C/S vs P2P；' +
          '③ **性能线索**——RTT 与传输时间如何决定用户体验（2RTT+T、缓存利用率、DNS 委派）。',
      },
    ],
    background: [
      {
        type: 'p',
        text:
          '本章各项技术都不是凭空出现的，每一项都对应一个具体的、当时无法用现有手段解决的问题。',
      },
      {
        type: 'list',
        items: [
          '**应用层独立成层（k2.1.1）**：如果每种新应用都要改造网络核心，应用创新将被彻底扼杀。因此端系统承担应用逻辑，网络核心只搬运比特。',
          '**客户-服务器与 P2P（k2.1.2）**：服务器农场极其昂贵（单数据中心约 6 亿美元、50~100 兆瓦），服务器带宽成为分发瓶颈，于是有了让用户互相传文件的 P2P 思路。',
          '**TCP 与 UDP 并存（k2.1.6）**：实时音视频**不能容忍**重传带来的长时延，却能容忍丢包；而文件传输正好相反。一套服务模型无法同时满足，于是分成“可靠有序”与“不可靠但快”两种。',
          '**HTTP 无状态（k2.2.2）**：服务器保存每个客户端的历史会造成状态不一致、崩溃难恢复、集群难扩展。于是把状态搬到客户端，用 Cookie 携带。',
          '**持久连接与流水线（k2.2.3）**：每个对象都要重新三次握手，代价 1 个 RTT；页面有 11 个对象就是 11 次握手。改进方向是复用连接。',
          '**Web 缓存与条件 GET（k2.2.8、k2.2.9）**：接入链路只有 1.54 Mbps 却要承载 1.50 Mbps 的数据，利用率 97% 会导致排队时延暴涨。缓存用存储换带宽，条件 GET 用“只问变没变”换带宽。',
          '**FTP 的双连接（k2.3.1）**：文件传输可能持续很久，控制命令必须随时能被响应，因此数据与控制必须分开。',
          '**SMTP 与 MIME（k2.4.2、k2.4.3）**：邮件要求离线暂存，因此需要“推送 + 消息队列”；SMTP 又限定 7 位 ASCII，因此需要 MIME 来携带二进制与多媒体。',
          '**POP3 与 IMAP（k2.4.4）**：POP3 简单但换设备就丢历史；IMAP 把邮件留在服务器并保存用户状态，代价是更依赖网络。',
          '**分布式层次 DNS（k2.5.1、k2.5.3）**：集中式名字库有单点故障、流量、距离、维护四大问题；层次化 + 委派 + 缓存是唯一可行的答案。',
          '**P2P 分发与 BitTorrent（k2.6.1、k2.6.2）**：C/S 的分发时间随 N 无界增长；BitTorrent 用分块、rarest first 与 tit-for-tat 让 P2P 的分发时间收敛到上界 $F/u$。',
        ],
      },
    ],
    mechanisms: [
      {
        type: 'p',
        text:
          '本章各协议的核心机制速览（PPT 第 124 页把本章概括为：应用体系结构 → 应用服务需求 → ' +
          '互联网传输服务模型 → 具体协议 → P2P → Socket 编程）：',
      },
      {
        type: 'table',
        headers: ['协议/机制', '关键设计', '典型细节'],
        rows: [
          ['HTTP', '请求/响应、ASCII 文本、无状态', '请求行（方法+URL+版本）、首部行、实体主体；CRLF CRLF 结束首部'],
          ['HTTP 连接方式', '非持续 / 持续无流水线 / 持续有流水线', '11 个对象分别对应 22 / 12 / 2 个 RTT'],
          ['Cookie', '响应 Set-Cookie + 请求 Cookie + 本地文件 + 后端数据库', '第一方 vs 第三方 Cookie；第三方可跨站跟踪'],
          ['Web 缓存', '代理服务器同时充当客户与服务器', '命中即返回；未命中则代表客户端去源站取'],
          ['条件 GET', '`If-modified-since` + `Last-Modified`（或 `If-None-Match` + `ETag`）', '未修改返回 304，只回首部不带实体'],
          ['FTP', '控制连接(21) + 数据连接(20)，带外控制', '命令 USER/PASS/LIST/RETR/STOR；返回码 331/125/425/452'],
          ['SMTP', '持久连接、端口 25、三阶段', 'HELO→MAIL FROM→RCPT TO→DATA→"."→QUIT'],
          ['MIME', '在首部加 MIME-Version/Content-Type/Content-Transfer-Encoding', '五大类型 text/image/audio/video/application；multipart 用 boundary 分隔'],
          ['POP3 / IMAP', 'POP3 下载即删、跨会话无状态；IMAP 邮件留服务器、保留文件夹状态', 'POP3：user/pass 授权，list/retr/dele/quit 事务'],
          ['DNS', '分布式层次数据库 + 委派 + 缓存', '根 → TLD → 权威；本地 DNS 对客户端递归、对层次迭代'],
          ['DNS 记录', 'RR = (Name, Value, Type, TTL)', 'A=主机名→IP；NS=域→权威服务器；CNAME=别名→规范名；MX=邮件别名→邮件服务器'],
          ['BitTorrent', 'tracker 换列表 + 256Kb 分块 + rarest first + tit-for-tat', '前 4 名每 10 秒重估，每 30 秒随机乐观解阻'],
          ['Socket', '主机本地的“门”，OS 控制底层 TCP/UDP', '字节流无消息边界 → 应用自行划分消息'],
        ],
      },
    ],
    formulas: [
      {
        type: 'p',
        text: '本章共有三组核心公式，全部与“时间/利用率”有关。',
      },
      {
        type: 'formula',
        latex: 'T_{resp} = 2\\,RTT + T_{trans} = 2\\,RTT + \\frac{L}{R}',
        caption: '① HTTP 响应时间模型（k2.2.4）',
      },
      {
        type: 'vars',
        items: [
          { symbol: 'RTT', meaning: '往返时延（客户→服务器→客户）', unit: 's' },
          { symbol: 'L', meaning: '被传输对象长度', unit: 'bit' },
          { symbol: 'R', meaning: '链路速率', unit: 'bps' },
        ],
      },
      {
        type: 'list',
        items: [
          '两个 RTT 分别是：**建立 TCP 连接** 1 个 RTT + **请求与首字节返回** 1 个 RTT。',
          '持续连接可省去后续请求的握手 RTT；流水线可让多个对象的传输时间重叠。',
        ],
      },
      {
        type: 'formula',
        latex: '\\text{utilization} = \\frac{\\text{data rate on link}}{\\text{link capacity}},\\qquad U_{access} = \\frac{(1-h)\\times 1.50}{1.54}',
        caption: '② Web 缓存例题的链路利用率（k2.2.8）',
      },
      {
        type: 'vars',
        items: [
          { symbol: 'h', meaning: '缓存命中率', unit: '无量纲' },
          { symbol: '1.50', meaning: '到浏览器的数据率', unit: 'Mbps' },
          { symbol: '1.54', meaning: '接入链路速率', unit: 'Mbps' },
          { symbol: 'D', meaning: '平均总时延 = $(1-h)\\times 2 + h\\times\\approx 0$', unit: 's' },
        ],
      },
      {
        type: 'example',
        title: '缓存例题三组必背数字',
        steps: [
          '**无缓存**：$U = 1.50/1.54 = 0.974 \\approx 97\\%$（PPT 记 99%），时延 = 2 秒 + 数分钟',
          '**加粗链路到 154 Mbps**：$U = 1.50/154 = 9.9\\%$，时延 ≈ 2 秒 + 毫秒',
          '**装本地缓存（h = 0.4）**：$U = 0.6\\times1.50/1.54 = 0.58$，时延 = $0.6\\times2 + 0.4\\times\\approx0 \\approx 1.2$ 秒',
        ],
        answer: '缓存不仅更快，而且比升级链路更便宜。',
      },
      {
        type: 'formula',
        latex: 'D_{c-s} = \\max\\left\\{ \\frac{NF}{u_s},\\ \\frac{F}{d_{min}} \\right\\},\\qquad D_{P2P} = \\max\\left\\{ \\frac{F}{u_s},\\ \\frac{F}{d_{min}},\\ \\frac{NF}{u_s + \\sum_{i=1}^{N} u_i} \\right\\}',
        caption: '③ 文件分发时间（k2.6.1）',
      },
      {
        type: 'vars',
        items: [
          { symbol: 'F', meaning: '文件大小', unit: 'bit' },
          { symbol: 'N', meaning: '接收副本的对等端数', unit: '个' },
          { symbol: 'u_s', meaning: '服务器上传速率', unit: 'bps' },
          { symbol: 'd_{min}', meaning: '最小的对等端下载速率', unit: 'bps' },
          { symbol: 'u_i', meaning: '第 i 个对等端的上传速率', unit: 'bps' },
          { symbol: '\\sum_{i=1}^{N}u_i', meaning: '所有对等端上传速率之和（聚合服务能力）', unit: 'bps' },
        ],
      },
      {
        type: 'example',
        title: 'P2P 分发例题（条件：F/u = 1 小时，u_s = 10u，d_min ≥ u_s）',
        steps: [
          '$F/u_s = F/(10u) = 0.1$ 小时；$F/d_{min} \\le F/u_s = 0.1$ 小时 → 这两项不是瓶颈',
          'C/S：$D_{c-s} = NF/u_s = N/10$ 小时，**随 N 无界增长**',
          'P2P（设所有对等端上传速率均为 $u$）：第三项 $= NF/(u_s+Nu) = 3600N/(N+10)$ 秒',
          '$N \\to \\infty$ 时 P2P $\\to 3600$ s = 1 小时，**有上界**；C/S $\\to \\infty$',
        ],
        answer: 'P2P 的分发时间收敛到 1 小时，C/S 随 N 无限增长——这就是 P2P 架构在大规模分发中的根本优势。',
      },
      {
        type: 'callout',
        tone: 'warning',
        title: '公式勘误提醒',
        text:
          'PPT 第 100/101 页的分发时间公式存在排版问题：' +
          '`Dc-s > max{...}` 与 `DP2P > max{...}` 中的 `>` 应为 `=`；' +
          'P2P 式第三项分母 `us + Sui` 应为 **$u_s + \\sum_{i=1}^{N} u_i$**（求和范围 i = 1 到 N）。' +
          '正确的 P2P 公式为 $D_{P2P}=\\max\\{F/u_s,\\ F/d_{min},\\ NF/(u_s+\\sum_{i=1}^{N}u_i)\\}$。',
      },
    ],
    examPoints: [
      {
        type: 'list',
        items: [
          '**PPT 第 18 页传输服务需求表**（10 分级大表）：文件传输/邮件/Web/即时消息 → **不能丢**；实时音视频/存储音视频/交互式游戏 → **可容忍丢失**；实时音视频与交互式游戏 → **时延敏感（数百毫秒）**；存储音视频 → 时延要求几秒。',
          '**PPT 第 21 页应用-传输协议对应表**：SMTP/Telnet/HTTP/FTP → **TCP**；流媒体 → **TCP 或 UDP**；互联网电话 → **通常 UDP**。',
          '**PPT 第 93 页（10 分）**：列举 DNS 资源记录四种类型并简述含义。A（Name 是主机名，Value 是 IP 地址，3 分）、NS（Name 是域，Value 是该域权威 DNS 服务器主机名，3 分）、CNAME（Name 是主机别名，Value 是主机规范名，2 分）、MX（Name 是邮件服务器别名，Value 是邮件服务器规范名，2 分）。',
          '**PPT 第 94 页（10 分）**：注册公司域名需要做哪些配置。① 分配网络标识：与 ISP 签约取得 IP 地址范围（2 分）；② 配置基本与辅助两台权威 DNS 服务器，存放所有机器的域名与 IP 映射，Web 站点的 A 记录输入其中（2+2 分）；③ 向注册机构提供基本、辅助权威 DNS 服务器的名字与 IP（2 分）；④ 注册机构在顶级域 DNS 服务器中为每个权威服务器写入一条 NS 和一条 A 记录（2 分）。',
          '**HTTP 响应时间 2RTT+T**（k2.2.4）：三段分别是握手 1 RTT、请求响应 1 RTT、传输时间 $L/R$。',
          '**Web 缓存例题三组数字**（k2.2.8）：99%（严格 97%）/ 9.9% / 0.58；时延 2 秒 + 分钟 / ≈2 秒 / ≈1.2 秒。',
          '**HTTP 方法表**（k2.2.5）：GET 读取、POST 添加信息、HEAD 读取首部、PUT 存储文档、DELETE 删除、TRACE 环回测试、CONNECT 代理、OPTION 选项信息。',
          '**HTTP 状态码**（k2.2.6）：200 OK、301 Moved Permanently、400 Bad Request、404 Not Found、505 HTTP Version Not Supported。',
          '**FTP 命令与返回码**（k2.3.1）：USER/PASS/LIST/RETR/STOR；331（要密码）、125（数据连接已开）、425（打不开数据连接）、452（写文件出错）。',
          '**SMTP 会话**（k2.4.2）：HELO → MAIL FROM → RCPT TO → DATA → "." → QUIT；响应为三位状态码 + 短语。',
          '**push vs pull**（k2.4.2）：HTTP 是 pull，SMTP 是 push；HTTP 每个对象一个响应报文，SMTP 多个对象可放一个 multipart 报文。',
          '**DNS 迭代 vs 递归**（k2.5.5）：客户端→本地 DNS 用**递归**，本地 DNS→根/TLD/权威用**迭代**。',
          '**BitTorrent 四个数字**（k2.6.2）：**256 Kb** 分块、**前 4 名**、**每 10 秒**重估、**每 30 秒**随机乐观解阻。',
          '**P2P 分发时间公式**（k2.6.1）：$D_{c-s}$ 与 $D_{P2P}$ 及其推导。',
          '**Cookie 四个组成部分**（k2.2.7）：响应首部、请求首部、用户主机上的 cookie 文件、Web 站点后端数据库。',
        ],
      },
      {
        type: 'callout',
        tone: 'exam',
        title: 'PPT 第 26 页的 8 个事件也要能默写',
        text:
          '浏览器分析超链 URL → 向 DNS 请求解析 IP → DNS 解析出服务器 IP → 建立 TCP 连接 → ' +
          '发出 `GET /chn/yxsz/index.htm` → 服务器返回 index.htm → 释放 TCP 连接 → 浏览器显示文本。',
      },
    ],
    confusions: [
      {
        type: 'table',
        caption: '易混概念辨析表',
        headers: ['易混对', '关键区分点'],
        rows: [
          ['无状态（HTTP） vs 无连接（HTTP/1.1）', '无状态 = 应用层不保存会话信息；无连接 = 传输层不复用 TCP 连接。HTTP/1.1 是**无状态但持久连接**的。'],
          ['HTTP pull vs SMTP push', 'pull 由客户端发起请求，服务器被动应答；push 由发送方主动推给接收方，服务器需维护消息队列。'],
          ['持久 HTTP vs 流水线', '持久 = 一条连接传多个对象；流水线 = 请求背靠背连发（响应仍按序返回）。流水线不是并行。'],
          ['NS vs CNAME', 'NS 的 Name 是**域**（com、sina.com），Value 是权威服务器主机名；CNAME 的 Name 是**主机别名**，Value 是规范名。'],
          ['CNAME vs MX', 'CNAME 指向**主机**（解析后得到 A 记录）；MX 指向**邮件服务器**（解析后还要再查 A 记录）。'],
          ['根服务器 vs 顶级域服务器 vs 权威服务器', '根 = 指路到 TLD；TLD = 指路到权威；权威 = 给最终答案（AA=1）。'],
          ['迭代查询 vs 递归查询', '迭代 = 被问者只给线索，**查询者**继续问；递归 = 被问者**替查询者**问到底。'],
          ['本地名称服务器 vs 权威服务器', '本地服务器是**层次之外**的代理与缓存；权威服务器是**数据的源**。'],
          ['第一方 Cookie vs 第三方 Cookie', '看**谁提供了你当前看的页面**，不是看谁设置的 Cookie。'],
          ['POP3 vs IMAP', 'POP3 下载即删、跨会话无状态、换设备读不到旧信；IMAP 邮件留服务器、支持文件夹、跨会话保留状态。'],
          ['C/S 分发 vs P2P 分发', 'C/S 瓶颈在服务器（$NF/u_s$）；P2P 瓶颈在聚合能力（$NF/(u_s+\\sum u_i)$）。两者都随 N 线性增长，但 P2P 有上界。'],
          ['socket vs 端口号', 'socket 是进程的“门”；端口号是门牌号。IP 地址定位主机，端口号定位主机上的进程。'],
          ['TCP 字节流 vs UDP 数据报', 'TCP 无消息边界（应用自行划分）；UDP 保留边界但可能丢失乱序。'],
          ['条件 GET vs 普通 GET', '普通 GET 总返回 200 + 实体；条件 GET 可能返回 304（只回首部、不带实体）。'],
          ['带宽（throughput） vs 时延（delay） vs 丢包（loss）', '三者互相独立，PPT 第 17 页的四类需求要分开判断。'],
        ],
      },
    ],
    misconceptions: [
      {
        type: 'list',
        items: [
          '**“HTTP 1.1: RFC 2068”** —— **错误**。HTTP/1.1 的正式标准是 **RFC 2616**（已于 2015 年被 RFC 9110 / RFC 9112 取代）；**RFC 2068 只是 1997 年的早期草案，从未成为标准且早已作废**。（PPT 第 24、21 页）',
          '**“HTTP 1.1: RFC 2616”** —— 版本号本身没错，但**已不是现行标准**；现行是 RFC 9110（语义）+ RFC 9112（HTTP/1.1），另有 HTTP/2（RFC 7540）与 HTTP/3（RFC 9114）。',
          '**“MIME: RFC 2045, 2056”** —— **2056 应为 2046**（MIME Part Two：多部分媒体类型）；RFC 822 也已被 **RFC 5322** 取代。（PPT 第 72、71 页）',
          '**“SMTP [RFC 2821]”** —— 属实但已过时，现行为 **RFC 5321**；**IMAP [RFC 1730]** 为 1994 年初版，现行为 **RFC 3501 / RFC 9051**。（PPT 第 66、75 页）',
          '**“IP 地址足以标识一个进程”** —— **错误**。主机 IP 只有 32 位且一台主机可运行多个进程，必须用 **IP 地址 + 端口号** 共同标识。',
          '**“HTTP 无状态 = 每次都要重新建连”** —— **错误**。无状态说的是应用层不保存历史，HTTP/1.1 默认使用**持久连接**。',
          '**“GET 是安全的，GET 不会改变服务器状态”** —— GET **语义上应当**是安全的，但**并非必然**：不恰当的应用可以违反该约定。规范说法是“GET **应当**是安全方法”。',
          '**“TCP 可靠，所以实时视频应该用 TCP”** —— **错误**。TCP 的可靠性以**可变时延**为代价，重传会让数据迟到几百毫秒，对实时语音毫无意义。',
          '**“P2P 一定比 C/S 快”** —— **错误**。当 N 很小时 C/S 反而更快；P2P 要经过多跳转发。分界点在两边公式的交叉处。',
          '**“装了缓存后接入链路利用率是 1.50/1.54”** —— **错误**。有缓存时应按**命中后的实际流量**计算：$0.6\\times1.50/1.54 = 0.58$。',
          '**“第三方 Cookie = 不安全的 Cookie”** —— **错误**。第一方/第三方描述的是**来源站点与用户主动访问站点的关系**，与安全性无关。',
          '**“DNS 根服务器掌握全网所有域名”** —— **错误**。根服务器只保存**顶级域的指路信息**，不保存任何具体主机地址。',
          '**“DNS 轰炸根服务器一直是主要威胁”** —— **不准确**。本地 DNS 缓存了 TLD 的 IP，可**绕过根直轰 TLD**，而 TLD 服务器数量远少于根服务器，**潜在更危险**。',
          '**“BitTorrent 是纯 P2P，所以没有服务器”** —— **不准确**。BitTorrent 使用 **tracker** 交换对等端列表；它只是不提供文件内容、不构成带宽瓶颈，因此不破坏自扩展性。',
          '**“TCP 有消息边界”** —— **错误**。TCP 是**字节流**，一次 send 可能被拆成多次 recv，应用必须自己定义消息边界。',
          '**“SMTP 是用户发邮件用的协议”** —— **不完整**。SMTP 只负责**服务器之间**的投递；用户代理与服务器之间用的是 POP3/IMAP/HTTP。',
        ],
      },
    ],
    connections: [
      {
        type: 'list',
        items: [
          '**与第一章（导论）**：五层协议栈与封装（s1.5）解释了应用层消息如何被逐层加首部；时延与吞吐（s1.4）提供了 RTT、$L/R$ 的定义，本章的响应时间模型直接建立在它之上；网络安全（s1.6）的 DNS 投毒与反射放大攻击在本章 k2.5.9 有对应内容。',
          '**与第三章（传输层）**：本章说“应用要求可靠传输/低时延”，第三章回答 TCP 如何做到——三次握手（s3.5.10）对应本章的 1 RTT 握手；端口号分用（s3.2）对应 k2.1.3 的“IP + 端口定位进程”；拥塞控制（s3.7）解释 k2.2.8 中接入链路利用率逼近 1 时排队时延暴涨的现象。',
          '**与 DNS 的双向联系**：k2.2.2 的第 2、3 步（向 DNS 请求解析 IP）就是 k2.5 的应用场景；而 DNS 自身也跑在 UDP/TCP 之上，DNS 报文的 RD/RA 标志（k2.5.7）正是迭代与递归（k2.5.5）的协商机制。',
          '**与缓存原理的呼应**：Web 缓存（k2.2.8）、条件 GET（k2.2.9）与 DNS 缓存（k2.5.4）本质相同——**用 TTL 换时间**，用空间换带宽。',
          '**与分层的呼应**：本章反复强调“应用层不管可靠传输”，正是第一章 s1.5.6“逻辑通信与实体”的具体化；Socket API（k2.7.1）是应用与传输层之间唯一的接口。',
          '**与 Web 技术的延伸**：本章讲的是 HTTP/1.1；HTTP/2 的多路复用是对 HTTP/1.1 流水线“响应必须按序返回”这一缺陷的修正，HTTP/3 基于 QUIC 解决了传输层队头阻塞——这三条线索都从 k2.2.3 与 k2.7.1 出发。',
        ],
      },
      {
        type: 'knowledgeRef',
        knowledgeId: 'k1.4.5',
        label: '相关（第一章）：RTT 与 traceroute 测量',
      },
    ],
    mnemonics: [
      {
        type: 'list',
        items: [
          '**端口号**：**HTTP 八十、邮件二五、FTP 二十一控二十传**、DNS 五十三。',
          '**HTTP 方法**：**G 读、P 加、H 读头、U 存、D 删、T 追踪、C 隧道、O 选项**。',
          '**HTTP 状态码**：**2 成功、3 转向、4 我错、5 它错**；**304 = 没变**、**301 = 永久搬家**、**404 = 没有**、**505 = 版本不懂**。',
          '**FTP 命令**：**U-P-L-R-S**（USER/PASS/LIST/RETR/STOR）；返回码 **331 要密码、125 已开传、425 连不上、452 写不进**。',
          '**SMTP 会话**：**HELO 打招呼、MAIL FROM 报家门、RCPT TO 指收件、DATA 递正文、点号收尾、QUIT 告辞**。',
          '**DNS 四记录**：**A 是地址、NS 是服务器、C 是别名、M 是邮件**（对应 PPT 第 93 页 10 分题）。',
          '**DNS 查询**：**根指顶级、顶级指权威、权威给答案**；**客户端递归、本地迭代**。',
          '**BitTorrent**：**tracker 找人、torrent 是群、chunk 256K、rarest first 抢稀有、tit-for-tat 前四名、十秒重估、三十秒试新**。',
          '**缓存三算**：**先比例后利用率，先加权后时延**。',
          '**响应时间**：**一握手、一问答、一传输 = 2RTT + L/R**。',
          '**P2P 公式**：**C/S 分母 $u_s$ 分子 $NF$；P2P 分母 $u_s+\\sum u_i$**。',
          '**DNS 记录四元组**：**名、值、类、寿（Name, Value, Type, TTL）**。',
        ],
      },
      {
        type: 'callout',
        tone: 'tip',
        title: '复习建议',
        text:
          '① **先背三张表**：应用传输服务需求表（PPT 18）、应用-传输协议对应表（PPT 21）、HTTP 方法与状态码表（k2.2.5/6）。' +
          '② **再背三组数字**：缓存例题的 99%/9.9%/0.58 与 2 秒/≈2 秒/1.2 秒；BitTorrent 的 256K/4/10/30；端口号 80/25/21/20。' +
          '③ **然后练计算**：2RTT+T（k2.2.4）与两个分发时间公式（k2.6.1）必须能独立推导。' +
          '④ **最后串链路**：默写 PPT 第 26 页的 8 个事件，把 DNS → TCP → HTTP 串起来。' +
          '⑤ **动手实验**：用 telnet 手敲 HTTP 请求与 SMTP 会话，用 nslookup 逐层查询 DNS，' +
          '再动手写一个简易 Web 服务器——**这三个实验做完，本章就真的会了**。',
      },
    ],
  },
}
