import type { Subsection } from '../../types/content'

export const ch1S15: Subsection[] = [
        {
          id: 's1.5.1',
          title: '为什么要分层',
          knowledge: [
            {
              id: 'k1.5.1',
              title: '分层的动机与航空类比',
              en: 'Why Layering',
              summary:
                '网络极其复杂，分层把庞大复杂的问题转化为若干较小的局部问题；各层独立、灵活、易实现维护，并促进标准化。',
              tags: ['分层', '体系结构', '航空类比', '标准化'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [73, 74, 75, 76, 77] }],
              insight: {
                why: 'PPT 第 73 页列出了网络的众多部件：主机、路由器、各种介质的链路、应用、协议、硬件和软件。部件这么多，**不分层就无法组织、讨论或实现**。',
                coreIdea: '**分层（layering）**把庞大复杂的问题转化为若干较小的局部问题，每个局部问题更易研究和处理。每一层实现一种服务（service），内部通过本层的动作（actions）完成，依赖下层提供的服务，并向上层提供服务。',
                mechanism: 'PPT 第 74–75 页用航空旅行类比分层：买票、托运、登机、起飞、空中导航、降落、卸载、取行李等步骤各由不同角色完成，每一步依赖前一步的结果，并为下一步提供条件。第 76 页给出定义：体系结构（architecture）是这个计算机网络及其部件所应完成功能的精确定义；计算机网络的体系结构是各层及其协议的集合。',
                comparison: 'PPT 第 77 页列出分层的五条好处：各层独立、灵活、可分割、易于实现和维护、促进标准化。其中**层间独立**是前提：某层的内部实现变化（如以太网换成无线）只要对上层提供同样的服务，上层就无需改动。这正是互联网能容纳异构接入技术和异构设备的根本原因。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 73 页的标题是 "Protocol ‘Layers’"，开篇一句 "Networks are complex!"。',
                },
                {
                  type: 'list',
                  items: [
                    'hosts（主机）、routers（路由器）；',
                    'links of various media（各种介质的链路）；',
                    'applications（应用）、protocols（协议）；',
                    'hardware, software（硬件、软件）。',
                  ],
                },
                {
                  type: 'p',
                  text: '课件由此提问：网络的结构有没有希望组织起来？至少能让讨论有条理吗？',
                },
                {
                  type: 'h',
                  text: '航空类比：分层的原型',
                },
                {
                  type: 'p',
                  text: '第 74–75 页用“组织航空旅行”（Organization of air travel）作类比，第 74 页列出一串步骤：',
                },
                {
                  type: 'list',
                  items: [
                    '出发：ticket (purchase) 买票 → baggage (check) 行李托运 → gates (load) 登机口装载 → runway takeoff 跑道起飞 → airplane routing 空中导航；',
                    '途经中间的空中交通管制中心（intermediate air-traffic control centers）：airplane routing 空中导航；',
                    '到达：airplane routing 空中导航 → runway landing 跑道降落 → gates (unload) 登机口卸载 → baggage (claim) 提取行李 → ticket (complain) 办票投诉。',
                  ],
                },
                {
                  type: 'p',
                  text: '第 75 页把这些步骤按职责分层组织，并在右下角给出分层的定义：',
                },
                {
                  type: 'quote',
                  text: 'Layering of airline functionality: Layers: each layer implements a service via its own internal-layer actions, relying on services provided by layer below',
                  cite: 'Chapter1.pptx 第 75 页',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '航空类比中的两层关系',
                  text: '登机口层既使用下层（跑道、飞机）提供的服务：飞机停在哪个登机口、乘客登哪架飞机都由它安排；又向上层（行李、乘客）提供服务。**空中导航层对地面完全不可见**：乘客不需要知道飞机怎么飞、经过哪个管制中心，正如应用程序不需要知道分组走了哪些路由器。这就是“层间独立”的形象表达。',
                },
                {
                  type: 'h',
                  text: '中文定义（第 76 页）',
                },
                {
                  type: 'p',
                  text: 'PPT 第 76 页给出“计算机网络体系结构”的正式表述：',
                },
                {
                  type: 'list',
                  items: [
                    '相互通信的两个计算机系统必须高度协调工作，而这种协调相当复杂；',
                    '分层可将庞大而复杂的问题转化为若干较小的局部问题，这些局部问题更易于研究和处理；',
                    '体系结构（architecture）就是这个计算机网络及其部件所应完成功能的精确定义；',
                    '计算机网络的体系结构 = **各层及其协议的集合**。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '“计算机网络体系结构 = 各层及其协议的集合”几乎必背。相关的还有：分层把复杂问题转化为较小的局部问题；体系结构是对网络及其部件功能的精确定义。',
                },
                {
                  type: 'h',
                  text: '第 77 页：分层的五条好处',
                },
                {
                  type: 'p',
                  text: 'PPT 第 77 页 "Why layering?" 列出五条：',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '**各层之间是独立的**；',
                    '**灵活性好**；',
                    '**结构上可分割开**；',
                    '**易于实现和维护**；',
                    '**能促进标准化工作**。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '"独立"为什么是最重要的一条',
                  text: '因为它是其余四条的前提：==层间独立==即上层不依赖下层的内部实现。例如把家里的 DSL 换成光纤、把办公室的以太网换成 WiFi，应用层与传输层完全不知情，它们依赖的只是“链路层提供帧传输服务”这一抽象，而不是“用哪根线”。互联网能异构互联、持续演进，根基就在这里。反过来，若层与层耦合（应用必须知道底层是 WiFi 还是 5G），每次技术升级都会变成灾难。',
                },
                {
                  type: 'table',
                  caption: '分层的五条好处及其含义',
                  headers: ['好处（PPT 原文）', '含义', '带来的工程价值'],
                  rows: [
                    ['各层之间是独立的', '层只依赖下层提供的抽象服务', '底层换技术，上层不改代码'],
                    ['灵活性好', '可替换、可组合、可裁剪', '同一套协议栈能适配从传感器到数据中心的各种场景'],
                    ['结构上可分割开', '大问题被切成若干可分别处理的局部问题', '可分工、可并行开发、可分别研究'],
                    ['易于实现和维护', '每层职责单一、接口清晰', '局部出错局部修，定位与修复成本低'],
                    ['能促进标准化工作', '接口一旦标准化，不同厂商即可互通', '形成开放生态，互联网规模化的制度基础'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**分五好：独、灵、拆、易、标**。”——独立、灵活、可分割、易维护、促标准。',
                },
                {
                  type: 'p',
                  text: '分层也有代价：**层数越多，封装与解封装的开销越大**（每加一层首部，就多一份长度与处理时延）；跨层优化也更难，例如低时延应用想做跨层调度时，层间独立性反而成了障碍。所以“分几层”是权衡，不是越多越好。',
                },
              ],
              questionIds: ['q1.5.1-01', 'q1.5.1-02'],
              related: ['k1.5.2', 'k1.5.3', 'k1.5.4'],
            },
            {
              id: 'k1.5.2',
              title: '网络协议三要素与体系结构',
              en: 'Syntax, Semantics, Timing',
              summary:
                '协议三要素是语法、语义、同步；以主机传文件为例，模块可划分为文件传送、通信服务、网络接入三层，形成体系结构。',
              tags: ['协议三要素', '语法', '语义', '同步', '体系结构'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [78, 79, 80, 81, 82, 83] }],
              insight: {
                why: 'k1.1.4 用“格式、顺序、动作”（英文课件的说法）描述协议，中文教材则称为**语法、语义、同步**三要素。两套说法指同一件事，必须能互相映射，否则概念题无法得分。',
                coreIdea: '==协议三要素==是**语法**（数据与控制信息的结构或格式）、**语义**（需要发出何种控制信息、完成何种动作以及做出何种响应）和同步（事件实现顺序的详细说明）。',
                mechanism: 'PPT 第 80–83 页以“主机 1 向主机 2 通过网络发送文件”为例，逐页增加模块：文件传送（最高层）→ 通信服务（可靠送达）→ 网络接入（帧格式、帧长上限）。第 81 页看上去文件是沿水平虚线直接传过去的，即应用层像在对等通信。',
                comparison: '三层各管一件事：文件传送关心文件格式与语义，通信服务关心可靠、有序地送达，网络接入关心帧格式、帧长上限与接口电气特性。第 81 页的“水平方向的虚线”是逻辑通信概念的首次出现，k1.5.6 会完整展开。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 78 页（“协议与划分层次的必要性”）用中文给出协议的定义与前提：',
                },
                {
                  type: 'list',
                  items: [
                    '计算机网络中的数据交换必须遵守事先约定好的规则；',
                    '这些规则明确规定了所交换数据的格式，以及有关的同步问题（同步含有时序的意思）；',
                    '**网络协议（network protocol），简称为协议，是为进行网络中的数据交换而建立的规则、标准或约定。**',
                  ],
                },
                {
                  type: 'h',
                  text: '第 79 页：协议的三要素',
                },
                {
                  type: 'p',
                  text: 'PPT 第 79 页“网络协议的组成要素”列出三要素：',
                },
                {
                  type: 'table',
                  caption: '协议三要素（PPT 第 79 页）与英文课件表述的对应',
                  headers: ['要素', '定义（PPT 原文）', '英文课件对应', '例子'],
                  rows: [
                    ['语法', '数据与控制信息的结构或格式', 'format（格式）', 'IP 首部的字段顺序与长度、TCP 的标志位'],
                    ['语义', '需要发出何种控制信息，完成何种动作以及做出何种响应', 'actions（动作）', '收到 FIN 后进入 CLOSE_WAIT；HTTP 的 404 状态码含义'],
                    ['同步', '事件实现顺序的详细说明', 'order（顺序）', '三次握手的先后次序、超时与重传的时序'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示：三要素必须能默写并举例',
                  text: '**语法 = 格式；语义 = 含义与动作；同步 = 顺序与时序。** 这是本章最经典的填空与简答题。注意"同步"在此**含有时序的意思**（PPT 原文注释），不要误解成"时钟同步"。',
                },
                {
                  type: 'h',
                  text: '第 80–83 页：一个划分层次的实例',
                },
                {
                  type: 'p',
                  text: 'PPT 第 80 页给出任务：**主机 1 向主机 2 通过网络发送文件**，并把要做的工作分类：',
                },
                {
                  type: 'list',
                  items: [
                    '**第一类工作与传送文件直接有关**：确信对方已做好接收和存储文件的准备；双方协调好一致的文件格式；',
                    '**两个主机将文件传送模块作为最高的一层**，剩下的工作由下面的模块负责。',
                  ],
                },
                {
                  type: 'p',
                  text: '接下来的三页层层加模块：',
                },
                {
                  type: 'table',
                  caption: '第 81–83 页：逐层添加模块',
                  headers: ['页码', '新增模块', '该模块负责什么', 'PPT 关键表述'],
                  rows: [
                    ['81', '文件传送模块（最高层）', '文件格式协调、确认对方已准备好接收与存储', '只看这两个文件传送模块，好像文件及文件传送命令是按照水平方向的虚线传送的'],
                    ['82', '通信服务模块', '把文件可靠地传送到对方', '好像可以直接把文件可靠地传送到对方'],
                    ['83', '网络接入模块 + 通信网络', '与网络接口细节有关的工作：规定传输的帧格式、帧的最大长度等', '网络接入模块负责做与网络接口细节有关的工作'],
                  ],
                },
                {
                  type: 'figure',
                  alt: '第 81–83 页：逐层增加的模块结构',
                  ascii:
                    '  主机 1                        主机 2\n' +
                    '┌──────────────┐            ┌──────────────┐\n' +
                    '│ 文件传送模块  │ ════════▶ │ 文件传送模块  │   ← 第 81 页：只有这一对\n' +
                    '├──────────────┤            ├──────────────┤\n' +
                    '│ 通信服务模块  │ ════════▶ │ 通信服务模块  │   ← 第 82 页：可靠传送\n' +
                    '├──────────────┤            ├──────────────┤\n' +
                    '│ 网络接入模块  │ ════════▶ │ 网络接入模块  │   ← 第 83 页：帧格式、帧长\n' +
                    '└──────┬───────┘            └───────┬──────┘\n' +
                    '       └────── 通信网络 ──────────────┘',
                  caption: '按 PPT 第 81–83 页整理：每一层的"水平虚线"是一个抽象的服务',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么"水平方向的虚线"是整个分层思想的精髓',
                  text: '因为每一层向上一层提供的都是**"看起来像直接对话"的服务**。应用层把文件交给"文件传送模块"，对方的应用层就收到了文件——中间的可靠性、帧格式、网络路由**全被隐藏了**。物理上数据是从主机 1 一路走到主机 2 的，但**逻辑上**每一对同层模块之间都有一条"直连"的虚线。这正是 k1.5.6 **逻辑通信（logical communication）**要正式定义的概念，也是"层间独立"能成立的机制。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '网络接入模块为什么关心"帧的最大长度"',
                  text: '因为这是**下一层的约束**：底层链路能承载的最大帧长（MTU）限制了上层分组的大小。这也是为什么 TCP MSS 的协商（第三章）与 IP 分片（第一章 k1.3.3 提到的 1500 字节）存在——**上层必须适应下层的容量限制**。这又一次体现了"层间独立但存在约束"的关系。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '三要素口诀：“**语法说格式，语义说动作，同步说先后。**”三层模块口诀：“**传文件、要可靠、接网络**”（文件传送 / 通信服务 / 网络接入）。',
                },
                {
                  type: 'p',
                  text: '把第 79 页与第 80–83 页合起来看，**体系结构**就是：把通信任务划分为若干层，每层规定自己提供的服务与协议，层与层之间有明确接口。下一小节的 OSI 七层、TCP/IP 四层与教学五层模型，都是把这套思路具体化的标准体系。',
                },
              ],
              questionIds: ['q1.5.2-01', 'q1.5.2-02'],
              related: ['k1.1.4', 'k1.5.3', 'k1.5.6'],
            },
            {
              id: 'k1.5.3',
              title: 'OSI 七层与 TCP/IP：两个国际标准',
              en: 'OSI vs TCP/IP',
              summary:
                'OSI 是法律意义上的国际标准但未获市场认可；TCP/IP 不是国际标准却成为事实上的国际标准，OSI 失败的四条原因是无商业动力、实现复杂低效、周期太长、层次划分不合理。',
              tags: ['OSI', 'TCP/IP', '事实标准', '体系结构对比', '标准化'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [79, 84, 85, 98, 99, 100] }],
              insight: {
                why: '标准的成败不由技术优劣决定，而由**市场与产业**决定。OSI 在设计上更优雅，却输给了 TCP/IP——这是计算机网络史上最值得反复讲的一课。',
                coreIdea: '两套体系结构并存：**OSI** 是**法律上的国际标准**（ISO 与 ITU 的分层体系），但**没有得到市场的认可**；**TCP/IP** **不是国际标准**，却获得了最广泛的应用，因此**常被称为"事实上的国际标准"（de facto standard）**。',
                mechanism: 'PPT 第 79 页给出结论，第 84 页给出 OSI 市场化失败的**四条原因**：① **没有商业驱动力**；② **实现过分复杂、运行效率很低**；③ **制定周期太长**，按 OSI 标准生产的设备无法及时进入市场；④ **层次划分不太合理**，有些功能在多个层次重复出现。',
                comparison: '第 98 页给出 **TCP/IP 协议套件中的部分协议**（BGP、FTP、HTTP、SMTP、TELNET、SNMP、MIME 在应用层；TCP、UDP 在传输层；ICMP、IGMP、OSPF、RSVP 在网络层；IP 在网际层）。第 99 页是**网络通信协议图**（一张更完整的协议全景图，含 OSI 风格的七层划分：Application / Presentation / Session / Transport / Network / Data Link / Physical）。第 100 页介绍 **IPX/SPX**——由 Xerox 最初开发、后来用于 Novell NetWare 的协议栈，可像 TCP/IP 一样被路由，在 Windows NT 中称为 NWLlink。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 79 页除了讲协议三要素，也讲到了两套体系标准的结局，课件的措辞非常直接：',
                },
                {
                  type: 'list',
                  items: [
                    '**法律上的国际标准 OSI 并没有得到市场的认可**；',
                    '**是非国际标准 TCP/IP 现在获得了最广泛的应用**；',
                    '**TCP/IP 常被称为事实上的国际标准**。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '"事实上的国际标准"这个说法有多重要',
                  text: '它精确描述了互联网治理的**现实**：没有任何机构强制你用 TCP/IP，但==你几乎不可能不用==。这一地位来自先发优势、网络效应与需求吻合，而不是标准机构授予。协议一旦成为事实标准，其安全缺陷也会变成全世界的安全缺陷——RFC 2616 被 RFC 9110 取代后仍需长期迁移，就是例证。',
                },
                {
                  type: 'h',
                  text: '第 84 页：OSI 市场化失败的四条原因',
                },
                {
                  type: 'p',
                  text: 'PPT 第 84 页 **"OSI 市场化方面的失败"** 列出四条原因，逐条看：',
                },
                {
                  type: 'table',
                  caption: 'OSI 失败的四个原因（PPT 第 84 页）',
                  headers: ['#', '原因（PPT 原文）', '深层解读'],
                  rows: [
                    ['1', 'OSI 的专家们在完成 OSI 标准时**没有商业驱动力**', '没有企业愿意为"更完美的标准"买单，缺乏产业推动'],
                    ['2', 'OSI 的协议**实现起来过分复杂，且运行效率很低**', '理论完备但工程实现代价大，设备贵、性能差'],
                    ['3', 'OSI 标准的**制定周期太长**，因而使得按 OSI 标准生产的设备无法及时进入市场', '市场窗口期有限，等标准定稿时市场已被占据'],
                    ['4', 'OSI 的**层次划分并不太合理**，有些功能在多个层次中重复出现', '层次本身有冗余，层间独立性与效率都受损'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示（必背）',
                  text: '**OSI 失败的四条原因**是本章高频简答/填空题，PPT 原文表述要能还原：① 没有商业驱动力；② 实现过分复杂、运行效率低；③ 制定周期太长、错过市场时机；④ 层次划分不合理、功能在多层重复。配套要记：**OSI = 法律上的国际标准但市场不认；TCP/IP = 非国际标准但应用最广，称"事实上的国际标准"。**',
                },
                {
                  type: 'h',
                  text: '第 98 页：TCP/IP 协议套件一览',
                },
                {
                  type: 'p',
                  text: 'PPT 第 98 页 **"Some Protocols in TCP/IP Suite"** 用一张图列出了 TCP/IP 协议族中的常见协议及全称：',
                },
                {
                  type: 'table',
                  caption: 'TCP/IP 协议套件中的部分协议（PPT 第 98 页）',
                  headers: ['层次', '协议', '全称'],
                  rows: [
                    ['应用层', 'BGP', 'Border Gateway Protocol（边界网关协议）'],
                    ['应用层', 'FTP', 'File Transfer Protocol（文件传输协议）'],
                    ['应用层', 'HTTP', 'HyperText Transfer Protocol（超文本传输协议）'],
                    ['应用层', 'SMTP', 'Simple Mail Transfer Protocol（简单邮件传输协议）'],
                    ['应用层', 'TELNET', '远程登录协议'],
                    ['应用层', 'SNMP', 'Simple Network Management Protocol（简单网络管理协议）'],
                    ['应用层', 'MIME', 'Multi-Purpose Internet Mail Extension（多用途互联网邮件扩展）'],
                    ['传输层', 'TCP', 'Transmission Control Protocol（传输控制协议）'],
                    ['传输层', 'UDP', 'User Datagram Protocol（用户数据报协议）'],
                    ['网络层', 'ICMP', 'Internet Control Message Protocol（互联网控制报文协议）'],
                    ['网络层', 'IGMP', 'Internet Group Management Protocol（互联网组管理协议）'],
                    ['网络层', 'OSPF', 'Open Shortest Path First（开放式最短路径优先）'],
                    ['网络层', 'RSVP', 'Resource ReSerVation Protocol（资源预留协议）'],
                    ['网际层', 'IP', 'Internet Protocol（互联网协议）'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '注意 BGP 被放在应用层',
                  text: '这是 TCP/IP 分层的经典特点：**BGP 与 OSPF 是运行在 IP 之上的路由协议**，虽然它们工作在"网络层功能"的位置，但在 TCP/IP 体系里它们属于**应用层**。原因是 TCP/IP 的分层只关心"是不是运行在 IP 之上"，而不像 OSI 那样要求功能位置与层次严格对应。这也解释了 1.5.1 节说的"OSI 层次划分不合理、功能在多层重复"——**TCP/IP 用"位置即层次"的简单规则换来了清晰**，代价是无法精确描述功能归属。',
                },
                {
                  type: 'h',
                  text: '第 99 页：网络通信协议图',
                },
                {
                  type: 'p',
                  text: 'PPT 第 99 页 **"网络通信协议图"** 是一张更完整的协议全景图。它以 **Application / Presentation / Session / Transport / Network / Data Link / Physical** 的七层为骨架，把各类协议填入其中：',
                },
                {
                  type: 'list',
                  items: [
                    '**Application 层**：FTP、Telnet、SMTP、POP3、X-Window、HTTP；SCTP、COPS、SOCKS、SLP、WCCP、TFTP、NTP、CMOT、SNMP、TACACS+、RLOGIN、RSHELL、PRINT、REXEC、RWHO、IMAP4、GDP、HTTP-s、SSH、RADIUS、ISAKMP、RTSP；',
                    '**Presentation 层**：RTSP（跨会话层与表示层）；',
                    '**Session 层**：Net-BIOS-SSN、Net-BIOS-SN、DNS、LDAP、SS7、DSMCC (MPEG)；',
                    '**Transport 层**：TCP、UDP、X.25、XOT、ISO DE、DVMRP、TALI、RUDP、Net-BIOS-DGM、Mobile IP；',
                    '**Network 层**：IP、BGP、RIP、GRE、E-IGRP、NHRP、GGP、HSRP、EGP、IGRP、OSPF、NARP、ICMP、RSVP、VRRP、IMGP、PIM、TDP、MPLS、ESP AH；DHCP、BOOTP；',
                    '**Data Link 层**：ARP、RARP、IARP、SLARP、CSLIP、SLIP、RSRB、L2F、PPTP、L2TP、ATMP、Trailers、STUN-SDLC；',
                    '**Physical 层**。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '这张图该怎么用',
                  text: '它是一张**协议全景地图**，用于建立"某个协议属于哪一层"的定位感，而不是要求背诵。**考试的实用价值在于三点**：① 看到陌生协议能定位层次（如 BGP/OSPF 在应用层、ARP 在链路层、ICMP 在网络层）；② 理解**跨层协议**（如 RSVP 跨越网络层与传输层、DHCP 借用 UDP）；③ 理解**同一层可以有大量互不相关的协议**，进一步说明"层"是接口抽象而非功能清单。',
                },
                {
                  type: 'h',
                  text: '第 100 页：IPX/SPX——一个被时代淘汰的协议栈',
                },
                {
                  type: 'p',
                  text: 'PPT 第 100 页介绍 **IPX/SPX**，这是理解"标准化之争"的绝佳历史案例：',
                },
                {
                  type: 'list',
                  items: [
                    '**Developed by Xerox originally, be applied in Novell Netware OS later**——最初由 **Xerox** 开发，后来应用于 **Novell NetWare** 操作系统；',
                    '**Hosts that running Windows NT/XP/2000/98/95 can connect to Novell Netware by IPX/SPX**——运行 Windows NT/XP/2000/98/95 的主机可通过 IPX/SPX 连接 Novell NetWare；',
                    '**IPX/SPX is called NWLlink in Windows NT**——在 Windows NT 中 IPX/SPX 被称为 **NWLlink**；',
                    '**IPX/SPX can be routed like TCP/IP**——IPX/SPX 像 TCP/IP 一样**可以被路由**。',
                ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: 'IPX/SPX 说明了什么',
                  text: '技术上可行、又被市场大量采用的协议栈，也可能被时代淘汰。IPX/SPX 曾是 Novell 时代的"事实标准"，与 TCP/IP 同层、可路由、被操作系统原生支持；但互联网爆发后，**与 TCP/IP 不互通**就等于自绝于互联网，它因此迅速退场。这从反面印证了 k1.1.2 的结论：RFC/IETF 体系与 TCP/IP 的事实标准地位是互联网成功的制度基础。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① **OSI 与 TCP/IP 的地位对比**（法律标准 vs 事实标准）；② **OSI 失败的四条原因**；③ TCP/IP 协议套件中各协议的**层次归属**（尤其 BGP/OSPF 在应用层、IP 在网际层、ARP 在链路层）；④ **IPX/SPX 的来龙去脉**：Xerox 起源、Novell NetWare 主力、Windows 中叫 NWLlink、可路由、最终被 TCP/IP 淘汰。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**OSI 有法无市，TCP/IP 无法有实。**”失败四因：“**无商业、实现慢、周期长、层次乱**。”IPX/SPX：“**施乐出身、Novell 用、Windows 叫 NWLlink、能路由、被淘汰**。”',
                },
              ],
              questionIds: ['q1.5.3-01', 'q1.5.3-02'],
              related: ['k1.5.4', 'k1.5.2', 'k1.1.2'],
            },
          ],
        },
        {
          id: 's1.5.2',
          title: '五层模型与数据流动',
          knowledge: [
            {
              id: 'k1.5.4',
              title: 'Internet 五层协议栈',
              en: 'Internet Protocol Stack',
              summary:
                '互联网五层协议栈自上而下为应用层、传输层、网络层、链路层、物理层，各层有明确职责与代表协议。',
              tags: ['五层模型', '协议栈', '应用层', '传输层', '网络层', '链路层', '物理层'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [85] }],
              insight: {
                why: '现实中的 TCP/IP 通常说"四层"，但课程与教材用"五层"——因为把**物理层单独列出来**，讲解链路与介质时更直观。考试常问"五层模型各层名称与职责"，需要明确采用哪一种口径。',
                coreIdea: '五层模型从上到下：**application（应用层）— transport（传输层）— network（网络层）— link（链路层）— physical（物理层）**。每一层有自己的职责、自己的协议，并向上一层提供服务、依赖下一层的服务。',
                mechanism: 'PPT 第 85 页 **"Internet protocol stack"** 给出每层的职责与代表协议：① **application: supporting network applications**（支撑网络应用），协议 FTP、SMTP、HTTP；② **transport: host-host data transfer**（端到端/主机到主机的数据传输），协议 TCP、UDP；③ **network: routing of datagrams from source to destination**（数据报的路由转发），协议 IP、路由协议；④ **link: data transfer between neighboring network elements**（相邻网络元素间的数据传输），协议 PPP、Ethernet；⑤ **physical: bits "on the wire"**（在"线上"的比特）。',
                comparison: '注意 **link 与 physical 的分界**：链路层负责"相邻两点之间传一帧"（有帧格式、有差错检测、以太网 MAC 地址寻址），物理层只负责"把比特变成信号在介质上跑"（编码、电平、connector）。而 **network 与 transport 的分界**：网络层是**逐跳**（hop-by-hop，路由器之间），传输层是**端到端**（end-to-end，主机之间）。这两条分界线是本章最重要的结构知识。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 85 页 **"Internet protocol stack"** 用一张竖排的五层图和五段文字定义了互联网的协议栈。逐层看：',
                },
                {
                  type: 'table',
                  caption: '互联网五层协议栈（PPT 第 85 页）',
                  headers: ['层', '英文', '职责（PPT 原文）', '代表协议', '数据单位'],
                  rows: [
                    ['5 应用层', 'application', 'supporting network applications（支撑网络应用）', 'FTP, SMTP, HTTP', 'message（报文）'],
                    ['4 传输层', 'transport', 'host-host data transfer（主机到主机的数据传输）', 'TCP, UDP', 'segment（报文段）'],
                    ['3 网络层', 'network', 'routing of datagrams from source to destination（数据报从源到目的的路由）', 'IP, routing protocols', 'datagram（数据报/分组）'],
                    ['2 链路层', 'link', 'data transfer between neighboring network elements（相邻网络元素间的数据传输）', 'PPP, Ethernet', 'frame（帧）'],
                    ['1 物理层', 'physical', 'bits "on the wire"（在线路上的比特）', '—', 'bit（比特）'],
                  ],
                },
                {
                  type: 'p',
                  text: '这张表把"五层模型"和"PDU 名称"（message/segment/datagram/frame）一次对齐了——后者正是 k1.5.5 封装与解封装要展开的内容。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '两条最重要的分界线',
                  text: '**① 逐跳 vs 端到端**：链路层是**逐跳**的——每一段链路各自负责自己那一跳的帧传输，彼此不关心全局；网络层仍是**逐跳**的——每个路由器独立转发；**传输层才是端到端的**——只有源主机和目的主机之间有 TCP/UDP 会话，中间的路由器对 TCP 段一无所知（正是 TCP 首部里的端口号让端系统能分派，见 k1.2.4 与第三章）。**② 比特 vs 帧**：物理层只搬运比特，没有"帧"的概念；帧是链路层加上的结构。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '为什么"五层"而不是"四层"',
                  text: 'TCP/IP 官方四层模型把链路层与物理层合称"网络接口层"（Network Access Layer / Link Layer）。教学上拆成五层的好处是：讲双绞线、光纤、同轴电缆、无线电时（k1.2.10、k1.2.11）可以自然地归到物理层，讲以太网帧、MAC 地址时归到链路层，层次对应更整齐。**答题时以课件的五层口径为准即可，同时知道存在四层说法。**',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① **五层名称与顺序**（自上而下：应用、传输、网络、链路、物理）——必背；② 每层职责与代表协议（FTP/SMTP/HTTP、TCP/UDP、IP、PPP/Ethernet、bits on the wire）；③ **链路层与物理层**、**网络层与传输层**的分界依据；④ 五层与 OSI 七层、TCP/IP 四层的对应关系（见 k1.5.3 与章节总结的对比表）。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**应用传网链物**”（自上而下）。职责口诀：“**应用撑应用，传输主机间，网络管路由，链路管邻居，物理管比特**。”PDU 口诀：“**报文、段、报、帧**”（message / segment / datagram / frame）。',
                },
                {
                  type: 'p',
                  text: '再对照 1.3 节的交换方式与转发：**网络层**执行"转发与路由"（k1.3.5 的转发表就在这一层）；**链路层**把帧从本节点送到相邻节点；**物理层**负责信号在双绞线、光纤、无线电上的实际传输（k1.2.10、k1.2.11）。协议栈由此把 1.2 与 1.3 的内容装进了一个统一结构。',
                },
              ],
              questionIds: ['q1.5.4-01', 'q1.5.4-02'],
              related: ['k1.5.5', 'k1.5.6', 'k1.3.5'],
            },
            {
              id: 'k1.5.5',
              figureIds: ['f1.5.5-envelope'],
              title: '封装与解封装',
              en: 'Encapsulation',
              summary:
                '发送端逐层加首部（封装），接收端逐层剥首部（解封装）；各层数据单元依次为 message、segment、datagram、frame。',
              tags: ['封装', '解封装', '首部', 'PDU', 'message', 'segment', 'datagram', 'frame'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [86, 87, 88, 89, 90, 91, 92, 96, 97] }],
              insight: {
                why: '如果协议栈只有"层次"没有"数据怎么流"，那还是抽象。封装与解封装回答的是：**一个应用程序写出的字节，是怎样一步步变成线路上的比特，又怎样一步步变回应用程序可读的数据的？**',
                coreIdea: '**发送端 = 逐层加首部（封装，encapsulation）**；**接收端 = 逐层剥首部（解封装，decapsulation）**。每层向下层交付时加上自己的首部（有的还加尾部），形成该层的数据单元。',
                mechanism: 'PPT 第 86–92 页用连续七张图演示**主机 1 向主机 2 发送数据**的全过程，页面上标注 **注意观察加入或剥去首部（尾部）的层次**：',
                comparison: '各层的数据单元（PDU）名称：应用层 **message（报文）** → 传输层 **segment（报文段）** → 网络层 **datagram（数据报）** → 链路层 **frame（帧）**（第 96–97 页）。第 96 页还概括了分层数据流的通用规律：**Each layer takes data from above, adds header information to create new data unit, passes new data unit to layer below.** 链路层是唯一会同时加**首部 H 和尾部 T** 的一层（因为帧需要在物理介质上做定界与差错检测）。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 86 页到第 92 页是**一组连续动画**，把"主机 1 向主机 2 发送数据"从**应用数据**一路演到**比特流**，再反向演回来。页面上反复出现的一个提示是：**"注意观察加入或剥去首部（尾部）的层次"**。',
                },
                {
                  type: 'h',
                  text: '发送端（封装）：逐层加首部',
                },
                {
                  type: 'p',
                  text: '按 PPT 第 86 页的编号（图中每台主机标了 5 4 3 2 1 五个层次）：',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '**第 5 层 应用层**：应用程序产生 **应用程序数据**，加上 **H5（应用层首部）**；',
                    '**第 4 层 传输层**：加上 **H4（运输层首部）** —— 得到 **报文段（segment）**；',
                    '**第 3 层 网络层**：加上 **H3（网络层首部）** —— 得到 **数据报（datagram）**；',
                    '**第 2 层 链路层**：加上 **H2（链路层首部）** 和 **T2（链路层尾部）** —— 得到 **帧（frame）**；',
                    '**第 1 层 物理层**：变成 **比特流 10100110100101 110101110101** 在链路上传输。',
                  ],
                },
                {
                  type: 'h',
                  text: '接收端（解封装）：逐层剥首部',
                },
                {
                  type: 'p',
                  text: 'PPT 第 87–91 页逐层演示了接收方的动作，注意每一页都强调"**交给上一层**"：',
                },
                {
                  type: 'list',
                  items: [
                    '**第 87 页**："计算机 2 的物理层收到比特流后**交给数据链路层**"；',
                    '**第 88 页**："**数据链路层剥去帧首部和帧尾部后**，把帧的数据部分**交给网络层**"；',
                    '**第 89 页**："**网络层剥去分组首部后**，把分组的数据部分**交给运输层**"；',
                    '**第 90 页**："**运输层剥去报文首部后**，把报文的数据部分**交给应用层**"；',
                    '**第 91 页**："**应用层剥去应用层 PDU 首部后**，把应用程序数据**交给应用进程**"；',
                    '**第 92 页**：应用进程最终宣布：**"我收到了 AP1 发来的应用程序数据！"**',
                  ],
                },
                {
                  type: 'figure',
                  alt: '封装与解封装的完整流程',
                  ascii:
                    '发送端（主机1）                                  接收端（主机2）\n' +
                    ' 应用程序数据\n' +
                    '      │  ＋H5\n' +
                    '      ▼\n' +
                    '  [H5 | 应用程序数据]              应用层数据单元：message\n' +
                    '      │  ＋H4\n' +
                    '      ▼\n' +
                    '  [H4 | H5 | 数据]                传输层数据单元：segment\n' +
                    '      │  ＋H3\n' +
                    '      ▼\n' +
                    '  [H3 | H4 | H5 | 数据]           网络层数据单元：datagram\n' +
                    '      │  ＋H2 ＋T2\n' +
                    '      ▼\n' +
                    '  [H2 | H3 | H4 | H5 | 数据 | T2]  链路层数据单元：frame\n' +
                    '      │  比特化\n' +
                    '      ▼\n' +
                    '  10100110100101 110101110101 ────► 物理层比特流\n' +
                    '                                             │\n' +
                    '                     ┌───────────────────────┘\n' +
                    '                     ▼  剥 T2、H2  → 交给网络层\n' +
                    '                     ▼  剥 H3     →  交给传输层\n' +
                    '                     ▼  剥 H4     →  交给应用层\n' +
                    '                     ▼  剥 H5     →  交给应用进程 ✔',
                  caption: '按 PPT 第 86–92 页整理的封装/解封装全流程',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么封装是分层架构的"物理实现"',
                  text: '因为**首部是层与层之间的接口载体**。应用层不需要知道链路层用什么地址、IP 不需要知道 TCP 的端口怎么分配——每一层只解析属于自己的首部，把剩余部分当作"数据"原封不动地往下传或往上传。这正是**数据抽象**（把复杂实现隐藏，只暴露必要接口）的经典形态，也是"层间独立"在代码里的样子。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '为什么只有链路层有尾部 T2',
                  text: '因为**帧需要在物理介质上定界**（怎么知道一帧在哪里结束），而且链路层要基于整帧做**差错检测**（CRC），所以需要把校验信息放在尾部。IP 分组、TCP 段都只在前面加首部，没有尾部——这在答"为什么帧有尾部而分组没有"时是标准答案。',
                },
                {
                  type: 'h',
                  text: '第 96–97 页：各层数据单元的名称',
                },
                {
                  type: 'p',
                  text: 'PPT 第 96 页 **"Protocol layering and data"** 给出了分层的通用规律：',
                },
                {
                  type: 'quote',
                  text: 'Each layer takes data from above, adds header information to create new data unit, passes new data unit to layer below',
                  cite: 'Chapter1.pptx 第 96 页',
                },
                {
                  type: 'p',
                  text: '图中标出的四个数据单元名称就是各层的 PDU：',
                },
                {
                  type: 'table',
                  caption: '各层 PDU 名称（PPT 第 96–97 页）',
                  headers: ['层次', 'PDU 名称', '英文', '加上/剥去的首部'],
                  rows: [
                    ['应用层', '报文', 'message', 'Ht / 应用层首部'],
                    ['传输层', '报文段', 'segment', 'Ht'],
                    ['网络层', '数据报（分组）', 'datagram', 'Hn'],
                    ['链路层', '帧', 'frame', 'Hl（+ 尾部 T）'],
                  ],
                },
                {
                  type: 'p',
                  text: '第 97 页 **"Encapsulation"** 则把这条路径从**源**一直画到**目的**，中途特意标出了 **router（路由器）与 switch（交换机）**的位置——这是本节最重要的一处补充：**路由器只处理到网络层**（拆到 H3 就不再往下看），**交换机只处理到链路层**（拆到 H2/T2 就重新封装转发）。因此：',
                },
                {
                  type: 'list',
                  items: [
                    '**交换机（switch）**：工作在链路层，只剥到 **H2/T2**，其上的 H3、H4、H5 对它完全不透明；',
                    '**路由器（router）**：工作在网络层，剥到 **H3**，其后重新封装上新的 H2/T2 交给下一跳的链路；',
                    '**因此"端到端"字段（如 TCP 端口、IP 地址）在传输过程中始终不变**，而"逐跳"字段（如链路层帧首部的 MAC 地址）每跳都在变。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① **PDU 四名称对应四层：message / segment / datagram / frame**（必背）；② 封装与解封装的逐层动作（加 H5→H4→H3→H2/T2；反向剥）；③ **只有链路层加尾部**；④ **交换机 vs 路由器剥到哪一层**（这是第 97 页的核心考点）；⑤ 端到端字段 vs 逐跳字段。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① **"分组（packet）"不是某一层的专名**——它是"分组交换"的泛称，可指任意层的数据单元；严格对应层的名字是 message / segment / datagram / frame。② 不要说"传输层给数据加上 H5"——方向搞反了，**H5 是应用层加的**。③ 交换机的"转发"在链路层，与 k1.3.5 的"转发（forwarding）"在路由器网络层同名但不同事，注意区分。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**发时逐层加、收时逐层剥；报文、报文段、数据报、帧；只有帧带尾巴，交换机剥二层、路由器剥三层。**”',
                },
                {
                  type: 'p',
                  text: '这一节把前面的内容串起来了：k1.2.10/k1.2.11 的物理介质在物理层变成比特；k1.3.5 的转发与路由发生在链路层与网络层；k1.2.3/k1.2.4 的 TCP/UDP 在传输层加上首部；k1.3.3 的 1500 字节就是链路层帧数据部分上限（MTU）的量级。==封装是分层的"动词"==。',
                },
                {
                  type: 'demoRef',
                  demoId: 'd1.5.5-encapsulation',
                  label: '动手玩：五层封装与解封装——逐层加首部与剥首部',
                },
              ],
              questionIds: ['q1.5.5-01', 'q1.5.5-02'],
              demoIds: ['d1.5.5-encapsulation'],
              related: ['k1.5.4', 'k1.5.6', 'k1.3.5'],
            },
            {
              id: 'k1.5.6',
              title: '逻辑通信与实体',
              en: 'Logical Communication',
              summary:
                '每一层在每个结点上都有分布式实体，实体之间执行动作、交换消息；同层实体之间的"水平"通信是逻辑通信，物理上则要穿越所有下层。',
              tags: ['逻辑通信', '实体', 'entity', '对等', '邮局类比'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [93, 94, 95] }],
              insight: {
                why: '第 81 页那句"好像文件是按水平方向的虚线传送的"一直是个比喻。这一节把它**严格化**：层与层之间是"服务提供者—客户"关系，同层之间是"对等（peer）"关系，两者在物理上走的是完全不同的路径。',
                coreIdea: '**每一层在每个结点上都由若干分布式的"实体（entities）"实现该层的功能**；实体执行动作（actions）、与**对等实体（peer entities）**交换消息。这种同层实体之间的"直达"关系称为**逻辑通信（logical communication）**。',
                mechanism: 'PPT 第 93 页给出定义：**Each layer: distributed "entities" implement layer functions at each node; entities perform actions, exchange messages with peers.** 第 94 页以**传输层**为例说明一次逻辑通信：取来自应用的数据 → 加上寻址与可靠性检查信息形成 **datagram** → 把 datagram 发给对等实体 → 等待对等方确认（ack）。课件给出的类比是**邮局（post office）**：寄信人写信 → 邮局加上信封、地址、邮戳 → 送至收信人所在邮局 → 收信人取信。',
                comparison: '第 95 页 **"Layering: physical communication"** 对照展示：物理通信是**实际穿过所有中间层**的竖直路径（源向下走、逐层穿过物理层、逐层向上到达目的），而逻辑通信是同层之间的"水平"跳跃。**两者的差别就是"封装/解封装"这组动作**——物理路径上的这些加首部/剥首部的工作，正是为了让逻辑上的水平通信成为可能。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 93 页标题 **"Layering: logical communication"**，图上画着若干并排的协议栈，每一栈有五层：application、transport、network、link、physical。右侧给出定义：',
                },
                {
                  type: 'list',
                  items: [
                    '**Each layer: distributed "entities" implement layer functions at each node**——每一层在每个结点上由**分布式的实体**实现该层的功能；',
                    '**entities perform actions, exchange messages with peers**——实体执行动作，与**对等实体（peers）**交换消息。',
                  ],
                },
                {
                  type: 'p',
                  text: '图上还画出了**只有源端与目的端拥有完整五层、中间结点只有下三层的典型结构**——这是互联网的典型拓扑：中间的路由器只实现物理层、链路层、网络层，不实现传输层与应用层。',
                },
                {
                  type: 'h',
                  text: '第 94 页：以传输层为例',
                },
                {
                  type: 'p',
                  text: 'PPT 第 94 页 **"E.g.: transport"** 用四步描述一次传输层的逻辑通信：',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '**take data from app**——从应用层取来数据；',
                    '**add addressing, reliability check info to form "datagram"**——**加上寻址信息与可靠性检查信息**，形成 **datagram**；',
                    '**send datagram to peer**——把 datagram 发给**对等实体**；',
                    '**wait for peer to ack receipt**——等待对等方**确认（ack）**收到。',
                  ],
                },
                {
                  type: 'p',
                  text: '课件给出的类比是 **post office（邮局）**：写信人把信交给邮局 → 邮局加上**信封、地址、邮戳** → 送到收信人所在地的邮局 → 收信人取信。类比的关键是：**邮局（传输层）并不认识写信人与收信人**，只认"地址"与"收件可靠性"；寄信人也不需要知道中间经过了多少邮局。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '逻辑通信为什么能"跳层"',
                  text: '因为**下层提供的是服务，上层使用的是服务**。传输层的实体把 datagram 交给本地的网络层实体，网络层把它交给本地的链路层实体……数据沿物理路径逐层下行，在目的端再逐层上行，最终到达目的端的对等传输层实体。**对等的传输层实体之间"以为"自己直接对话**——它们感知到的只有"我的对等方发来了一个 datagram 并回了 ack"，中间发生了什么完全不可见。这与 k1.5.1 航空类比里"空中导航层对乘客不可见"是同一个道理。',
                },
                {
                  type: 'h',
                  text: '第 95 页：物理通信',
                },
                {
                  type: 'p',
                  text: '第 95 页 **"Layering: physical communication"** 画出的是**真实路径**：数据从源端的应用层出发，逐层向下穿过 transport、network、link、physical，**在物理介质上实际传输**，然后在目的端逐层向上回到应用层。图中的 data 标签沿着这条真实路径排列。',
                },
                {
                  type: 'table',
                  caption: '逻辑通信 vs 物理通信',
                  headers: ['维度', '逻辑通信 logical communication', '物理通信 physical communication'],
                  rows: [
                    ['路径', '同层实体之间的"水平"直达', '逐层向下 → 介质 → 逐层向上'],
                    ['中间结点角色', '不参与（看不见）', '路由器逐层剥/加首部转发'],
                    ['实现方式', '下层提供的服务 + 本层的消息交换', '封装（加首部）与解封装（剥首部）'],
                    ['类比', '邮局：写信人只与收信人对话', '实际邮路：车、船、传送带'],
                    ['对应概念', 'k1.5.1 第 81 页的"水平方向的虚线"', 'k1.5.5 的封装/解封装流程'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① **实体（entity）**：每层的功能由分布在各结点的实体实现；实体执行动作并与**对等实体**交换消息；② **逻辑通信 = 同层实体之间的消息交换**，中间结点不参与；③ 传输层逻辑通信四步（取数据 → 加寻址与可靠性信息成 datagram → 发给对等 → 等 ack）；④ **邮局类比**；⑤ 逻辑通信与物理通信的对照（这是本节最常考的辨析）。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① 不要把"逻辑通信"理解成"逻辑信道"（logical channel）——这里指的是**通信关系的抽象**，不是一条物理链路。② 中间结点**并非完全无关**：它们在**物理通信**中确实参与了封装/转发，只是在**逻辑通信**中不可见。③ "peer"是**同层**的对等，不是"客户—服务器"关系。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**同层实体互为对等，消息只在对等间流动；物理路径逐层穿行，封装解封装搭桥。**”邮局口诀：“**邮局只认地址与回执，不管写信人是谁**。”',
                },
                {
                  type: 'p',
                  text: '本章的技术链条由此闭合：协议（k1.1.4）规定格式、顺序与动作；分层（k1.5.1、k1.5.2）把协议组织成体系结构；五层协议栈（k1.5.4）给出具体层次；封装/解封装（k1.5.5）与==逻辑通信==（k1.5.6）说明数据如何在体系中流动。后续两节分别讨论体系在恶意环境中的安全问题（1.6）与互联网的演化历史（1.7）。',
                },
              ],
              questionIds: ['q1.5.6-01', 'q1.5.6-02'],
              related: ['k1.5.5', 'k1.5.4', 'k1.5.1'],
            },
          ],
        },
]
