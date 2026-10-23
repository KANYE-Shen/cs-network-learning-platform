import type { Subsection } from '../../types/content'

export const ch2S21: Subsection[] = [
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
                  '一次典型通信要经过五层协议栈：发送方的数据自上而下依次经过传输层、网络层、链路层、物理层，' +
                  '每一层加上自己的首部；接收方逆向逐层解封装，最终把字节交给应用。应用层报文在网络中以“分组”为单位传输，' +
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
                    '通过在网络中交换消息（message）互相通信。典型例子：浏览器与 Web 服务器对话、' +
                    '邮件用户代理与邮件服务器对话、BitTorrent 客户端之间交换文件分块。',
                },
                { type: 'term', zh: '端系统', en: 'end system', abbr: 'host', def: '运行应用程序的主机，例如 PC、手机、服务器。互联网的通信端点都位于端系统上。' },
                { type: 'term', zh: '进程间通信', en: 'inter-process communication', abbr: 'IPC', def: '同一主机上两个进程之间的通信机制，由操作系统（OS）定义并实现。' },
                {
                  type: 'p',
                  text:
                    '同一主机内的进程通过操作系统定义的 IPC 通信；不同主机上的进程只能靠网络交换消息。' +
                    '后者正是本章的核心问题。',
                },
                {
                  type: 'p',
                  text:
                    '408 联系：操作系统课程讲的管道、消息队列、共享内存等，解决的正是同一台机器上进程之间的通信，即这里的 IPC；' +
                    '跨主机的通信则要靠本章的网络协议。',
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
                    '这十类应用在可靠性、时延、带宽上的需求差异很大，例如：',
                },
                {
                  type: 'list',
                  items: [
                    '可靠性：文件传输、Web 事务要求 100% 可靠传输，实时音视频却能容忍少量丢失',
                    '时延：互联网电话、交互式游戏必须低时延，邮件、点播视频可以慢慢传',
                  ],
                },
                {
                  type: 'p',
                  text: '需求差异如此之大，传输层才必须提供两种截然不同的服务模型。',
                },
                { type: 'h', text: '应用层在协议栈中的位置（PPT 第 6 页）' },
                {
                  type: 'p',
                  text:
                    '应用程序只使用它所在端系统上的协议栈。发送方与接收方的应用层、传输层、网络层、数据链路层、物理层一一对应；' +
                    '中间经过的路由器只实现到网络层，交换机只实现到数据链路层，' +
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
                  title: '通信场景对照',
                  items: [
                    { k: '同一主机', v: '进程 A ↔ 进程 B：由操作系统定义的 IPC 通信，不经过网络' },
                    { k: '不同主机', v: '进程 A ↔ 进程 B：只能通过网络交换消息，需要应用层协议定义消息格式' },
                    { k: '网络核心', v: '只实现到网络层（数据链路层），不运行任何用户应用' },
                  ],
                },
                {
                  type: 'p',
                  text:
                    '==应用层协议==就是不同主机上的进程之间约定的一套通信规则。' +
                    '它规定消息的类型、语法、语义，以及何时发送、如何响应。' +
                    '本章依次考察 HTTP、FTP、SMTP、DNS 这些真实协议，' +
                    '并用 Socket 编程把协议变成可运行的代码。',
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
                  '应用架构决定系统的扩展性、成本与可靠性形态。集中式服务器易管理，但受限于单点容量；' +
                  '纯 P2P 免服务器，但难管控、难保证服务质量；' +
                  '混合架构在“集中控制”与“分布传输”之间折中，是当今互联网的主流形态。',
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
                    '数据中心是能源密集型基础设施：单个数据中心 50~100 MW 的功率，相当于一座中型工厂的用电规模。',
                },
                {
                  type: 'p',
                  text:
                    '单体约 6 亿美元的成本、2007 年约 24 亿美元的新建投入，意味着' +
                    '**只有巨额流量的公司才养得起服务器农场**。' +
                    '这也是 P2P 架构的经济动因：用用户自己的带宽与存储换取分发能力。',
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
                    '在客户-服务器模型中，$N$ 个用户意味着服务器要承担 $N$ 倍负载，服务器必须无限扩容。',
                },
                {
                  type: 'p',
                  text:
                    '在 P2P 模型中，这 $N$ 个用户各自贡献了一条上行链路，系统总容量随用户数自动增长，理论上可无限扩展。' +
                    '代价是对等端不可控，主要有三点：',
                },
                {
                  type: 'list',
                  items: [
                    '可能随时离线',
                    '地址可能变化',
                    '可能只下载不上传（free-rider 问题）',
                  ],
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
                    '==混合架构==（hybrid of client-server and P2P）的思想是：' +
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
                    '混合架构 = “中心服务器当目录（黄页），数据走 P2P 高速公路”。' +
                    'Skype 的中心服务器只负责“拨号”，语音包走点对点；' +
                    '即时消息的中心服务器只负责“登记本子”，聊天内容点对点传递。',
                },
                {
                  type: 'p',
                  text:
                    '通用模式是：**中心服务器承担轻量级全局协调**（目录、索引、认证、地址映射），' +
                    '端系统之间承担重量级数据传输。这一模式在今天的 CDN、WebRTC、网状 VPN 中仍广泛使用。',
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
              figureIds: ['f2.1.3-sockets'],
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
                    '进程（process）是运行在主机中的程序实例。进程之间的通信只有两种情形：' +
                    '同一主机上的进程通过操作系统定义的进程间通信（IPC）完成；' +
                    '不同主机上的进程则通过在网络中交换消息（message）完成。',
                },
                {
                  type: 'list',
                  items: [
                    '客户进程（client process）：发起通信的进程',
                    '服务器进程（server process）：等待被联系的进程',
                    '关键提醒：P2P 架构的应用**同时具有客户进程和服务器进程**——Alice 给 Bob 传文件时，Alice 既是客户也是服务器',
                  ],
                },
                { type: 'h', text: '套接字：一扇“门”（PPT 第 14 页）' },
                {
                  type: 'p',
                  text:
                    '==套接字==是应用进程与其所在主机上传输层之间的接口。PPT 用“门（door）”作类比：' +
                    '发送进程把消息推出门，依靠“门另一侧的传输基础设施”把消息送到接收进程的门前；' +
                    '接收进程再从自己的门里取出消息。应用开发者永远不需要关心数据在网络上的具体路径。',
                },
                { type: 'h', text: '如何唯一地标识一个进程？（PPT 第 15 页）' },
                {
                  type: 'p',
                  text:
                    '一台主机拥有唯一的 32 位 IP 地址，但同一主机上可以同时运行许多进程。' +
                    '仅凭 IP 地址无法区分这些进程，每个进程还需要一个标识符。',
                },
                {
                  type: 'p',
                  text:
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
                    '端口号是一个 16 位无符号整数，取值 0~65535，可分为三段：',
                },
                {
                  type: 'list',
                  items: [
                    '0~1023：知名端口（well-known ports），需要特权才能绑定，HTTP(80)、SMTP(25)、FTP(21) 都属于这一类',
                    '1024~49151：注册端口',
                    '49152~65535：动态/私有端口，通常由客户端临时分配',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：端口号不是 PID',
                  text:
                    '操作系统给每个进程分配的 PID 只在本机内有效，不能用来标识远程进程；' +
                    '端口号属于传输层，作用是报文到达主机后，区分应交给哪个进程的套接字。两者不要混用。',
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
                  type: 'p',
                  text:
                    '408 联系：在 Linux/Unix 中，套接字在进程里以文件描述符（file descriptor）的形式出现，' +
                    '可以用 read、write 等系统调用收发数据，接口与读写文件基本一致。这也是 OS 课程中“一切皆文件”思想的典型体现。',
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
                    '==应用层协议==是不同主机上的进程之间通信的“语法与语义约定”。' +
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
                    '“公开”不等于“免费”：RFC 文档公开，协议背后可能仍有专利或商标，' +
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
                    '本章用四个真实协议验证这套框架：' +
                    'HTTP（拉取模型）、FTP（双连接 + 带外控制）、SMTP（推送模型）、DNS（分布式数据库查询）。',
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
                    '应用层协议并不自己实现可靠性与拥塞控制，它==只声明自己的需求==，' +
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
                    '① 实时音视频 vs 存储音视频：实时（直播/通话）时延敏感到几百毫秒；' +
                    '存储（点播）可以缓冲，几秒的启动延迟无妨。两者都是 loss-tolerant。' +
                    '② 交互式游戏：loss-tolerant，但时延敏感到几百毫秒——动作类游戏对延迟极其敏感，' +
                    '因此数据传输常用 UDP。' +
                    '③ 即时消息：数据不能丢（no loss），但“时延敏感”这一栏 PPT 写作 “yes and no”——' +
                    '因为聊天正文要求及时到达，而用户上线/状态通知等可以稍等，两者共存。' +
                    '这与它“不能丢”的属性组合起来，**正好说明即时消息常跑在 TCP 上**。',
                },
                {
                  type: 'p',
                  text:
                    '表中的规律很清楚：**不能丢数据的应用**（文件、邮件、Web、即时消息）' +
                    '吞吐量都是弹性的，时延要求大多不苛刻，用 TCP 就够了；' +
                    '**时延敏感的实时应用**（实时音视频、交互式游戏）都容忍丢包，' +
                    '可以放弃 TCP 的重传，改用 UDP 换取低时延。',
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
                  '应用需求五花八门，传输层却只提供两种服务模型，原因在于它位于网络核心与端系统之间，' +
                  '功能由内核实现，必须通用、高效，且能在网络核心实现（无状态或轻状态）。' +
                  'TCP 用“可靠有序字节流 + 拥塞控制”覆盖绝大多数“不能丢”的场景；' +
                  'UDP 把选择权交给应用，让实时应用自行实现可靠性与速率控制。',
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
                    'TCP 的可靠性是以可变的时延为代价的：丢包后重传（RTO）可能让数据迟到几百毫秒，' +
                    '对实时语音和视频毫无意义。此外 TCP 只提供尽力而为（best-effort）的服务，' +
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
                  text: 'UDP 把可靠性、速率控制等选择权交给应用，主要有四个理由：',
                },
                {
                  type: 'list',
                  items: [
                    '应用可以自己做可靠性：一个包在链路上丢失时，TCP 会把后面已到达的数据阻塞在接收缓存里（队头阻塞），对实时应用是灾难；应用自己做可靠性，只需丢弃坏帧即可',
                    '无连接、无状态：发送方无需握手，DNS 查询、DHCP 发现、NTP 时间同步等天然适合',
                    '应用自行控制速率：实时应用依据网络状况自行调节码率，比内核统一策略更贴合业务',
                    '开销小：UDP 首部仅 8 字节，TCP 首部至少 20 字节',
                  ],
                },
                {
                  type: 'p',
                  text:
                    '408 联系：“队头阻塞”的道理与数据结构中的队列一样：队首元素没出队，后面的元素都得等。' +
                    'TCP 按序交付时，丢失的一个包会让后面的数据卡在接收缓存里，正是这种情形。',
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
                  text: '这张表可以直接背，但更应该理解其==推导逻辑==：',
                },
                {
                  type: 'list',
                  items: [
                    '“不能丢数据”的应用（邮件、远程终端、Web、文件传输）都需要 TCP',
                    '“时延敏感、可以容忍丢失”的应用（互联网电话、部分流媒体）通常选 UDP',
                    '流媒体处于中间地带：点播视频偏向 TCP（要完整、要快进），直播偏向 UDP（要实时）',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：RFC 2616 已过时',
                  text:
                    'PPT 第 21 页把 HTTP 标注为 “HTTP [RFC 2616]”，第 24 页写成 “HTTP 1.1: RFC 2068”。' +
                    '**两处都已被现行标准取代**：HTTP/1.1 的正式标准是 RFC 2616（1999），已于 2022 年被' +
                    'RFC 9110（HTTP Semantics）与 RFC 9112（HTTP/1.1）取代；' +
                    'RFC 2068（1997）是更早的 Proposed Standard，已被 RFC 2616 取代。' +
                    '最新进展是 HTTP/2（RFC 7540，2015）与 HTTP/3（RFC 9114，基于 QUIC）。',
                },
                {
                  type: 'p',
                  text:
                    '教材与课件中的 RFC 编号有时会过时：答题时以现行 RFC 为准，并能说明旧编号为什么不再适用。' +
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
]
