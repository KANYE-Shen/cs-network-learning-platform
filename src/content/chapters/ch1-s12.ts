import type { Subsection } from '../../types/content'

export const ch1S12: Subsection[] = [
        {
          id: 's1.2.1',
          title: '端系统与应用通信方式',
          knowledge: [
            {
              id: 'k1.2.1',
              figureIds: ['f1.2.1-tiers'],
              title: '整体结构：边缘、核心与接入',
              en: 'Network Structure Overview',
              summary:
                '互联网在结构上分成网络边缘（应用与主机）、网络核心（互联的路由器）和接入网络与物理介质（通信链路）三大部分。',
              tags: ['网络边缘', '网络核心', '接入网', '数据中心'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [13, 14, 15] }],
              insight: {
                why: '互联网同时包含"数以十亿计的终端设备"和"数十万台高速路由器"，如果不把结构分块，就无法用一套统一的语言讨论问题，也无法解释"为什么应用开发者几乎从不关心路由器"。',
                coreIdea: '把互联网切成==边缘、核心、接入==三块：边缘（应用与主机）、核心（互联的路由器）、接入（接入网与物理介质）。它们分别回答"谁在通信""分组怎么在中间走""怎么接入"三个问题。',
                mechanism: '网络边缘包含运行应用的客户端与服务器主机，服务器常集中在数据中心（data centers）；网络核心是互联的路由器构成的网络之网络；接入网络与物理介质提供通信链路。一条端到端路径依次经过：源主机、接入网、若干核心路由器、接入网、目的主机。',
                comparison: '边缘是"内容与状态所在的地方"，核心是"只做转发、不关心内容的地方"。这个分工就是**端到端原则**的物理体现：核心保持简单（无状态、尽力而为），复杂功能（可靠性、加密、压缩）尽量放在边缘的端系统里，因此中间盒子升级慢也不会拖垮新应用的创新。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 13–15 页连续三页用同一张结构图，标题为 "A closer look at network structure"。图上的三块内容正是本章 1.2、1.3 两节的主线：',
                },
                {
                  type: 'table',
                  caption: '互联网的三块结构（PPT 第 13–15 页）',
                  headers: ['结构块', '英文', '包含什么', '在本章对应内容'],
                  rows: [
                    ['网络边缘', 'network edge', '应用与主机：客户端（clients）与服务器（servers），服务器常位于数据中心', '1.2.1 – 1.2.3'],
                    ['网络核心', 'network core', '互联的路由器（interconnected routers），即“网络的网络”', '1.3'],
                    ['接入与介质', 'access networks, physical media', '通信链路：接入网络与物理介质', '1.2.2 – 1.2.3'],
                  ],
                },
                {
                  type: 'p',
                  text: '**网络边缘（network edge）**包含所有应用与主机，主机分为客户端与服务器两类。课件特别指出，服务器通常集中在数据中心（"servers often in data centers"）。1.2.8 节会展开家庭网、企业网、数据中心三种接入形态；1.3.7 节的互联网结构图则体现为 "content provider network" 与 "datacenter network" 两个区块。',
                },
                {
                  type: 'p',
                  text: '**网络核心（network core）**由互联的路由器构成，即"网络的网络"。路由器的关键特征是：只把分组从一个端口转到另一个端口，不关心分组里装的是什么。1.3.5 节讲的转发（forwarding，查本地转发表）与路由（routing，运行路由算法）正是核心仅有的两项职能。',
                },
                {
                  type: 'p',
                  text: '**接入网络与物理介质（access networks, physical media）**提供通信链路，把边缘主机接入核心。1.2.2 节详细比较 DSL、HFC、家庭网、企业网、数据中心、无线接入六种接入形态，1.2.3 节讨论承载这些流量的物理介质。',
                },
                {
                  type: 'p',
                  text: '类比：把互联网想象成城市交通，住宅与办公楼相当于边缘，主干道与立交网络相当于核心，小区门口的支路相当于接入网。边界：道路不会像路由器那样逐个分组查表选路，这个类比只用来说明三块的分工。',
                },
                {
                  type: 'figure',
                  alt: '互联网结构示意图：边缘主机通过接入网连入由路由器构成的核心',
                  ascii:
                    '   ┌──────────── 网络边缘 ────────────┐\n' +
                    '   │  客户端主机        服务器主机(数据中心) │\n' +
                    '   └───────┬───────────────────┬──────┘\n' +
                    '           │ 接入网             │ 接入网\n' +
                    '           ▼                   ▼\n' +
                    '   ┌──────────── 网络核心 ────────────┐\n' +
                    '   │      路由器 ── 路由器 ── 路由器    │\n' +
                    '   │   (互联的路由器 = 网络的网络)      │\n' +
                    '   └──────────── 物理介质 ────────────┘',
                  caption: '按 PPT 第 13–15 页结构整理的示意图',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么这个划分是"导论"里最重要的结构性判断',
                  text: '它决定了后续章节的"分工"：应用层问题（HTTP、DNS、P2P）在边缘解决；时延、丢包、吞吐量的优化在核心解决；接入速率与链路质量则属于接入网与介质。后面学到的拥塞控制主要写在端系统（TCP）里而不是路由器里，原因正是**核心被刻意设计成"薄"的**，这就是端到端原则。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '常见填空/选择：网络边缘包含应用与主机；网络核心是互联的路由器；接入网络与物理介质提供通信链路。易错点：把"核心路由器"和"边缘服务器"混为一谈；忽略"服务器常在数据中心"这一事实（它同时解释了为什么 1.3.7 节 ISP 结构图里会有 content provider network 与 datacenter network 两个区块）。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**边（应用主机）—核（互联路由）—接（接入介质）**”，路径口诀：“**主机进、核心走、链路载**”。',
                },
                {
                  type: 'p',
                  text: '三块的**规模差异**很大：边缘端系统数以十亿计（手机、电脑、IoT 设备），核心路由器在数十万量级，接入网则是"数亿条链路的集合"。这一差异带来的直接后果是：核心必须无状态（否则路由表大到无法维护），边缘却可以保存复杂状态（比如 TCP 连接表、浏览器缓存）。',
                },
              ],
              questionIds: ['q1.2.1-01'],
              related: ['k1.1.1', 'k1.2.2', 'k1.2.8', 'k1.3.7'],
            },
            {
              id: 'k1.2.2',
              title: '客户/服务器方式与 P2P 方式',
              en: 'Client-Server & P2P',
              summary:
                '端系统之间有两种通信范式：客户/服务器方式由 always-on 的专用服务器提供服务；P2P 方式几乎不用专用服务器，由对等端互为客户与服务器。',
              tags: ['客户/服务器', 'P2P', 'always-on', 'Skype', 'BitTorrent'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [16] }],
              insight: {
                why: '两端要交换数据，最自然的想法是"一方请求、一方应答"，但服务器是否必须 always-on、是否必须专用，会直接决定应用的成本模型与可扩展性。因此必须先把两种范式讲清楚。',
                coreIdea: '**客户/服务器（client/server）**：always-on 的服务器随时待命，客户端主动发起请求；**对等（peer-to-peer, P2P）**：最小（或完全不用）依赖专用服务器，==任何对等端既可以是客户也可以是服务器==。',
                mechanism: '客户/服务器方式中，客户端主机向服务器**请求并接收服务**；服务器必须 always-on，才能保证客户端任何时刻都能连上。P2P 方式中，节点既是服务提供方也是服务消费方，请求可以任意发起，服务能力随在线节点数增长。',
                comparison: 'C/S：优点是服务集中、易管理、易做一致性与安全控制；缺点是服务器既是单点又是瓶颈，成本随用户数线性增长（DDoS 正是利用这一弱点，见 1.6.2）。P2P：优点是自扩展（用户增加同时增加供给与需求）、成本低、没有中心单点；缺点是管理困难、难以保证一致性与安全，并且需要额外机制解决"如何找到对等端"的问题（如 tracker、DHT）。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 16 页标题为 "The network edge"，聚焦端系统（hosts）。课件先给出端系统的特征：运行应用程序（Web、邮件等），位于"网络边缘"（at "edge of network"）。然后引出两种通信范式。',
                },
                {
                  type: 'h',
                  text: '一、客户/服务器方式（client/server model）',
                },
                {
                  type: 'p',
                  text: 'PPT 原文为 "client host requests, receives service from always-on server"：客户端主机请求并接收来自 always-on（始终在线）服务器的服务。课件举的例子是 Web（浏览器/服务器）与电子邮件（邮件客户端/服务器）。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么强调 always-on',
                  text: '它规定了**谁主动、谁被动**。服务器必须始终开机，否则客户端的请求会扑空；服务器还要在"一直等待"和"开始服务"之间切换状态，这正是 1.2.3 节 TCP **握手（handshaking）** 要解决的问题，用一次往返换取双方状态同步。理解 always-on，就能理解为什么需要握手、为什么连接是有状态的。',
                },
                {
                  type: 'h',
                  text: '二、对等方式（peer-to-peer model）',
                },
                {
                  type: 'p',
                  text: 'PPT 原文为 "minimal (or no) use of dedicated servers"：最小程度（甚至完全不使用）依赖专用服务器。课件举的例子是 Skype 与 BitTorrent，其中 Skype 是 "Sky-Peer to Peer" 的缩写。',
                },
                {
                  type: 'table',
                  caption: '两种通信范式对照',
                  headers: ['维度', '客户/服务器方式', 'P2P 方式'],
                  rows: [
                    ['角色划分', '固定：客户端只消费，服务器只提供', '动态：每个对等端既是客户也是服务器'],
                    ['服务器要求', 'always-on 的专用服务器', '最小或不使用专用服务器'],
                    ['典型例子', 'Web 浏览器/服务器、邮件客户端/服务器', 'Skype、BitTorrent'],
                    ['成本随用户数', '线性增长（服务器要扩容）', '近似次线性增长（用户即容量）'],
                    ['扩展性瓶颈', '服务器带宽与处理能力', '查找对等端、状态一致性'],
                    ['典型攻击面', 'DDoS 放大攻击（见 k1.6.2）', '内容分发中毒（seed 污染）'],
                  ],
                },
                {
                  type: 'p',
                  text: '第 16 页的图以 "client/server" 标注两类角色：左侧成排的图标是客户端主机，右侧的方盒子是服务器主机。理解两种范式只需抓住两条线：**谁开机（always-on）**，以及**谁既是客户又是服务器**。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 两种范式的**定义**（尤其"always-on server"与"minimal use of dedicated servers"这两句原文表述）；② 例子：Web、邮件 → C/S；Skype、BitTorrent → P2P；③ 第三章 2.6 节会深入 P2P 文件分发（BitTorrent 的分块与 tit-for-tat），第二章 2.1.2 会讲混合架构。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '不要把"P2P"等同于"没有服务器"。BitTorrent 依赖 tracker 协助发现对等端，Skype 依赖中心化的用户目录服务器——这叫**混合架构（hybrid architecture）**，在第二章会专门讲。P2P 的准确含义是"**最小化对专用服务器的依赖**"，而非"完全没有服务器"。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**客请服，应永远；点对点，互为师**。”判断题技巧：题干出现"always-on"多半在考 C/S，出现"专用服务器最少"多半在考 P2P。',
                },
                {
                  type: 'p',
                  text: '无论 C/S 还是 P2P，底层用的仍是 TCP（可靠）或 UDP（尽力而为）这套传输服务。**应用架构（谁向谁请求）与传输服务（数据怎么交付）是正交的两件事**：BitTorrent 用 TCP，架构却是 P2P；Skype 用 UDP（低时延），架构接近 C/S。两条线不要混。',
                },
                {
                  type: 'p',
                  text: '类比：C/S 像去餐厅点菜，厨房（服务器）必须一直营业，顾客随到随点；P2P 像朋友之间换书，每个人既能借出也能借入，不需要中心图书馆。边界：餐厅厨房是固定的，而 P2P 的角色按每次请求动态变化。',
                },
                {
                  type: 'p',
                  text: '408 联系：DHT 的思想可以对照数据结构中的哈希表。用键的哈希值决定数据存放在哪个节点，就不必依赖一台集中目录来查找。',
                },
              ],
              questionIds: ['q1.2.2-01', 'q1.2.2-02'],
              related: ['k1.2.3', 'k1.2.4', 'k1.6.2'],
            },
            {
              id: 'k1.2.3',
              title: '面向连接服务 TCP',
              en: 'Connection-Oriented: TCP',
              summary:
                'TCP 通过握手在两端建立状态，提供可靠有序的字节流服务，并内建确认重传、流量控制与拥塞控制三大机制。',
              tags: ['TCP', '握手', '可靠传输', '流量控制', '拥塞控制'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [17] }],
              insight: {
                why: '许多应用需要"要么完整到达、要么不要"的保证（文件、网页、邮件）。若由应用自己处理丢失与乱序，实现复杂且性能差，因此需要由传输层统一提供可靠交付。',
                coreIdea: '面向连接服务分两步：==先握手建立状态，再传输数据==。TCP 把"可靠性"拆成三个正交机制，分别解决三个问题：丢包 → 确认与重传；压垮接收方 → 流量控制；压垮网络 → 拥塞控制。',
                mechanism: '握手（对应 PPT 第 11 页的人类协议 "Hello, hello back"）在两台通信主机上建立状态（set up "state"），为数据传输做准备。传输阶段有四项机制：可靠有序的字节流传输（reliable, in-order byte-stream data transfer）；确认与重传（应对丢包）；流量控制（保证发送方不会压垮接收方）；拥塞控制（网络拥塞时让发送方"放慢发送速率"）。',
                comparison: '与 UDP 相比，TCP 多出了握手、开销与时延，但换来可靠性与有序性；与电路交换相比，TCP 是"软件层面的可靠"，并不预留网络资源，因此**无法保证带宽**（这正是 1.3.4 节"如何提供电路式行为"至今没有完美答案的原因）。TCP 的三个机制解决的是不同层次的过载问题：流量控制针对**接收方**，拥塞控制针对**网络**。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 17 页标题为 "Network edge: connection-oriented service"，页首点明目标："Goal: data transfer between end systems"（在端系统之间传输数据），然后进入 TCP。',
                },
                {
                  type: 'term',
                  zh: '面向连接服务',
                  en: 'connection-oriented service',
                  def: '传输服务的一种：数据传输前先进行握手（handshaking），在通信双方建立状态（state），然后在该连接上传输数据。TCP 是互联网的面向连接传输层协议，标准文档为 RFC 793。',
                },
                {
                  type: 'term',
                  zh: '握手',
                  en: 'handshaking',
                  def: '数据传输开始之前的准备过程，用于在两个通信主机之间建立状态。PPT 用人类协议的 "Hello, hello back" 来类比——两次往返不是为了传数据，而是为了确认双方就绪。',
                },
                {
                  type: 'p',
                  text: '课件强调握手的作用是 "setup (prepare for) data transfer ahead of time"，并在两台通信主机上 "set up ‘state’"。这里的"状态"指协议在两端保存的连接信息，如序号、确认号、接收窗口、拥塞窗口等。第三章会看到，三次握手正是通过三次报文交换来同步这些状态。',
                },
                {
                  type: 'h',
                  text: 'TCP 的服务清单：三个机制，各管一件事',
                },
                {
                  type: 'p',
                  text: 'PPT 列出的 TCP 服务（TCP service [RFC 793]）可以整理为"一条主线 + 三个机制"。主线是 reliable, in-order byte-stream data transfer（可靠、有序的字节流数据传输）。',
                },
                {
                  type: 'p',
                  text: '注意"字节流（byte-stream）"这一限定：TCP 提供连续字节流，**不保留应用报文的边界**；应用写两次，协议栈可能合并成一个报文段发出。这与第二章 HTTP 的报文（message）、第三章 TCP 的报文段（segment）是两个层次。',
                },
                {
                  type: 'table',
                  caption: 'TCP 服务与三大机制（PPT 第 17 页）',
                  headers: ['机制', '英文', '对付的问题', '做法', '归属'],
                  rows: [
                    ['可靠有序字节流', 'reliable, in-order byte-stream', '丢包 / 乱序', '序号 + 确认 + 重传', '端到端'],
                    ['流量控制', 'flow control', '发送方压垮接收方', '接收方通告窗口，发送方限速', '针对接收方'],
                    ['拥塞控制', 'congestion control', '发送方压垮网络', '网络拥塞时发送方“放慢发送速率”', '针对网络'],
                  ],
                },
                {
                  type: 'list',
                  items: [
                    '**loss: acknowledgements and retransmissions**——丢包靠**确认（acknowledgements）与重传（retransmissions）**解决。发送方给每段编号，接收方回确认号，发送方超时或收到重复确认就重传。',
                    '**flow control: sender won\'t overwhelm receiver**——流量控制保证发送方**不会把接收方压垮**。接收方通过通告窗口告诉发送方"我还能接收多少"。',
                    '**congestion control: senders "slow down sending rate" when network congested**——拥塞控制保证网络拥塞时发送方**主动放慢发送速率**。注意课件的措辞是"当网络拥塞时"，这正是它与流量控制的分界线。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '流量控制与拥塞控制为什么必须分开',
                  text: '它们防的是两种不同的"过载"：接收方缓冲区小，网络带宽紧张。两种情况都会造成数据丢失，但原因和办法不同。前者由**接收方**通过 $rwnd$ 窗口告诉发送方"你最多能发这么多"；后者由发送方**自行探测**网络容量并调节 $cwnd$。如果只有流量控制，接收方窗口很大而网络已经拥塞时，发送方仍会大量灌包，造成全网拥塞，这正是"拥塞窗口"存在的理由（第三章）。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: 'TCP 的四大特性需要熟记：面向连接（需握手）、可靠（确认 + 重传）、有序（字节流有序）、流量控制与拥塞控制。常考陷阱：① 把流量控制说成"防止网络拥塞"（错，那是拥塞控制）；② 把 TCP 说成"提供报文边界"（错，TCP 是字节流）；③ 认为 TCP 能保证带宽（不能，见 k1.3.4）。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：TCP 的“可靠”不等于“准时”',
                  text: 'TCP 保证**最终送达且顺序正确**，但**不保证时延**。如果链路拥塞，TCP 的可靠交付反而会让排队时延急剧上升（见 k1.4.4）。所以"可靠"和"低时延"在网络里往往是对立的，这是 1.2.4 节 UDP 存在的理由。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“先握手，后传数；可靠有序字节流。”“流控管接收，拥控管网络。”也可以记：**丢失靠重传，压垮接收靠流控，压垮网络靠拥控**。',
                },
                {
                  type: 'p',
                  text: '时效性提示：课件标注的 RFC 793 是 TCP 的原始标准（1981 年）。之后有不少重要修订，尤其是拥塞控制部分：**RFC 5681** 规定了慢启动、拥塞避免等拥塞控制行为，**RFC 9293** 则把 TCP 的完整规范重新整理发布。考试按课件与教材口径作答即可，但要知道规范一直在演进。',
                },
                {
                  type: 'p',
                  text: '408 联系：$rwnd$ 与 $cwnd$ 共同决定发送窗口，它本质上是数据结构与算法课中的滑动窗口：窗口内的数据可以在确认前发送，确认到达后窗口向前滑动。',
                },
              ],
              questionIds: ['q1.2.3-01', 'q1.2.3-02'],
              related: ['k1.2.4', 'k1.3.4', 'k1.5.4'],
            },
            {
              id: 'k1.2.4',
              title: '无连接服务 UDP',
              en: 'Connectionless: UDP',
              summary:
                'UDP 不需要握手，直接发送独立报文；不提供可靠交付、流量控制与拥塞控制，换来低时延与低开销。',
              tags: ['UDP', '无连接', '尽力而为', '低时延', 'RFC 768'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [18] }],
              insight: {
                why: '并非所有应用都需要可靠性。实时音视频、DNS 查询等应用宁可丢包也不愿等待重传；游戏宁可收到旧数据也不要迟到的数据。若让它们使用 TCP，握手与重传会引入无法接受的时延与队头阻塞。',
                coreIdea: 'UDP 采取"少即是多"：==不握手、不维护连接状态、不保证送达==，只提供"尽力而为"的数据报交付，把可靠性完全交给应用自己处理（或干脆不要）。',
                mechanism: 'UDP（RFC 768）是无连接的：发送方直接发出独立报文（message），接收方按目的端口分派。课件列出 UDP **没有**的三项：no flow control、no congestion control、unreliable data transfer。是否需要重传、排序、限速，由应用层自行决定。',
                comparison: '与 TCP 相比：UDP 开销小（首部仅 8 字节）、无握手往返、时延低、无队头阻塞；代价是无可靠性、无流量/拥塞控制，容易造成网络拥塞。与"电路式行为"相比（1.3.4），UDP 连"尽力而为"都不承诺更多。真实应用中常见折中：用 UDP 传数据、用应用层的 ACK/重传补齐可靠性（如 QUIC 之于 HTTP/3）。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 18 页标题为 "Network edge: connectionless service"。页首一句 "Goal: data transfer between end systems — same as before!" 点明目标与 TCP 相同，**区别只在手段**。',
                },
                {
                  type: 'term',
                  zh: '无连接服务',
                  en: 'connectionless service',
                  def: '传输服务的一种：发送数据前不进行握手，双方不维持连接状态，每个报文独立传输、独立到达（可能丢失、可能乱序）。UDP 是互联网的无连接传输层协议，标准文档为 RFC 768。',
                },
                {
                  type: 'p',
                  text: 'UDP 的四条特性如下：',
                },
                {
                  type: 'list',
                  items: [
                    '**connectionless（无连接）**：发送前不需要握手，不需要在两端维护连接状态。',
                    '**unreliable data transfer（不可靠的数据传输）**：不保证到达、不保证顺序、不保证不重复。',
                    '**no flow control（无流量控制）**：不管接收方是否来得及处理。',
                    '**no congestion control（无拥塞控制）**：网络拥塞时不主动降速（这也是 UDP 应用容易造成丢包的根源，见 k1.4.4 / k1.4.6）。',
                  ],
                },
                {
                  type: 'p',
                  text: '课件随后给出**应用选择**的清单：',
                },
                {
                  type: 'table',
                  caption: 'PPT 第 18 页：使用 TCP 与 UDP 的应用',
                  headers: ['使用 TCP 的应用', '使用 UDP 的应用'],
                  rows: [
                    ['HTTP（Web）', '流媒体（streaming media）'],
                    ['FTP（文件传输）', '远程会议（teleconferencing）'],
                    ['Telnet（远程登录）', 'DNS（域名解析）'],
                    ['SMTP（电子邮件）', '互联网电话（Internet telephony）'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么这些应用偏爱 UDP',
                  text: '共同点是**"迟到的正确数据不如没有数据"**。流媒体丢一帧，播放器跳过去即可，但要等 TCP 重传则会出现卡顿；互联网电话与远程会议中，200 ms 才到的旧语音已经失去对话意义；DNS 查询通常很小且很快，宁可重发一次也不愿付出握手开销。TCP 的可靠机制在这类场景下反而成了包袱。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① UDP 四特性（无连接、不可靠、无流量控制、无拥塞控制）；② **RFC 768**；③ 应用清单要能正着背反着背——注意 Telnet 用 TCP（它是交互式但需要可靠逐字符），而"远程会议/流媒体/DNS/互联网电话"用 UDP；④ UDP 首部只有 8 字节（源端口、目的端口、长度、校验和各 2 字节），这是常考的数字。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：TCP / UDP 不是"可靠/不可靠"的二选一',
                  text: 'TCP 的可靠是端到端保证，但它保证不了时延，也保证不了带宽。UDP 的不可靠只是"网络层不替你做事"，应用层完全可以自己做可靠性（例如 QUIC 在 UDP 之上实现了可靠传输与拥塞控制）。所以准确的说法是：**UDP 提供的是尽力而为服务，可靠性可以由应用在其上重建。**',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**U 不 U，U 要少（服务）**”：UDP = User Datagram Protocol（用户数据报协议）。口诀版：“不握手、不保证、不流控、不拥控；实时、DNS、电话爱用它。”对照 TCP：“要握手、保证、流控、拥控。”',
                },
                {
                  type: 'p',
                  text: '课件把 UDP 称为"互联网的无连接服务"，这一表述在教材时代是准确的。今天的 QUIC（HTTP/3 的底层）**建立在 UDP 之上，自行实现了可靠传输、加密与拥塞控制**。',
                },
                {
                  type: 'p',
                  text: '这说明 UDP 的"薄"设计给应用留下了很大自由度。"UDP = 不可靠"的说法，更准确的理解是"UDP 只提供数据报原语"。',
                },
                {
                  type: 'p',
                  text: '408 联系：UDP 不做流量控制，接收端缓冲区满时报文只能被丢弃，这与操作系统中缓冲区溢出的处理是同一类问题，也正是 TCP 流量控制存在的动机。',
                },
              ],
              questionIds: ['q1.2.4-01'],
              related: ['k1.2.3', 'k1.3.4', 'k1.5.4'],
            },
          ],
        },
        {
          id: 's1.2.2',
          title: '接入网',
          knowledge: [
            {
              id: 'k1.2.5',
              title: '接入网概述',
              en: 'Access Networks',
              summary:
                '接入网回答“端系统如何连上边缘路由器”，分为住宅、机构与移动三类；评价接入网看两个指标：带宽多少、是否独享。',
              tags: ['接入网', 'DSL', 'HFC', 'WiFi', '5G', '带宽', '共享'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [19] }],
              insight: {
                why: '核心路由器再好，如果最后一段"入户"链路很慢，用户体验依然很差。接入网是用户实际"触摸"到的网络，也是家庭宽带与运营商利润的战场，因此必须单独研究。',
                coreIdea: '接入网是端系统与"边缘路由器"之间的那段网络。按接入对象分三类：住宅接入网（ADSL、FTTH）、机构接入网（以太网、WiFi）、移动接入网（4G/5G、卫星）。',
                mechanism: '无论形态如何，评价接入网只需看==带宽与共享/独享两个维度==（PPT 明确提出 "Keep in mind"）：带宽是多少（bits per second）？是共享还是独享（shared or dedicated）？前者决定"能跑多快"，后者决定"和别人共享时会不会互相拖累"。',
                comparison: '独享（dedicated）接入：速率有保证、不受邻居影响，但成本高——DSL 的 ADSL 段相对独享，而 HFC 上下游共享。共享（shared）接入：成本低、扩展性好，但在忙时速率骤降——这正是 HFC 在晚上 8 点看视频卡顿的物理原因。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 19 页标题为 "Access networks and physical media"，页首的提问是 "Q: How to connect end systems to edge router?"（端系统如何连接到边缘路由器？）',
                },
                {
                  type: 'term',
                  zh: '接入网',
                  en: 'access network',
                  def: '把端系统连接到网络边缘（边缘路由器）的那一段网络。广义上包括接入链路、接入设备（调制解调器、AP、基站）以及从用户侧到运营商局端的全部设施。',
                },
                {
                  type: 'p',
                  text: '课件把接入网分成三类，各自列举了典型技术：',
                },
                {
                  type: 'table',
                  caption: '三类接入网（PPT 第 19 页）',
                  headers: ['类别', '英文', '典型技术', '特点'],
                  rows: [
                    ['住宅接入网', 'residential access nets', 'ADSL、FTTH', '面向家庭用户，多为共享'],
                    ['机构接入网', 'institutional access networks', 'Ethernet、WiFi', '面向企业/校园，通常独享且带宽高'],
                    ['移动接入网', 'mobile access networks', '4G/5G、Satellite', '通过基站接入，无线共享'],
                  ],
                },
                {
                  type: 'h',
                  text: '记住任何一个接入网，只需问两个问题',
                },
                {
                  type: 'p',
                  text: '页末 "Keep in mind" 给出两个考察维度：',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '**带宽（bandwidth）是多少？**——单位 bit/s。这决定了你"理论上能跑多快"。',
                    '**是共享还是独享（shared or dedicated）？**——这决定了你"在别人 busy 的时候会不会变慢"。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么"共享/独享"这个维度比速率数字更值得记',
                  text: '因为速率数字会随技术进步快速过时（DSL 的 16 Mbps 早已远低于千兆光纤），而"共享还是独享"是**结构性属性**，不会过时。HFC 的下行 30 Mbps 是**共享**的：同一频段被几百到几千户人家分，所以峰值速率再高，繁忙时段的实际体验也可能很差；而企业专线是独享的，速率有保证。把这两条一起用，才能解释"为什么运营商广告里的带宽和我测速结果不一样"。',
                },
                {
                  type: 'p',
                  text: '这两个问题贯穿本章后续内容，各类接入的情况如下：',
                },
                {
                  type: 'list',
                  items: [
                    'DSL 的 ADSL 段是独享的（每户有自己的频段），下行是共享的。',
                    'HFC 的上下行都共享。',
                    '家庭网内部的 WiFi 也是共享的。',
                    '数据中心内部则是高带宽独享或高速互连。',
                  ],
                },
                {
                  type: 'p',
                  text: '1.4.1 节讲吞吐量的"瓶颈链路"时，会再次用到"哪一段最慢决定整体"的思路。',
                },
                {
                  type: 'p',
                  text: '408 联系：HFC 的共享频段、WiFi 的共享信道，与计算机组成原理中的总线相似：同一条总线被多个部件分时使用，使用者越多，每个部件分到的带宽越少。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 接入网的三类划分及其技术（住宅 ADSL/FTTH、机构 Ethernet/WiFi、移动 4G-5G/卫星）；② "带宽 + 共享/独享"这两个评价维度必须能默写；③ 接入网与"边缘路由器"的边界（接入网到边缘路由器为止，再往里就是核心）。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**接入三兄弟：住、机、动**”（住宅 ADSL/FTTH，机构以太网/WiFi，移动 4G/5G/卫星）；评价两问：“**多快、共享否**”。',
                },
                {
                  type: 'p',
                  text: '接入网的速率跨度极大：家庭铜线 DSL 约几十 Mbps，光纤入户可达 Gbps 乃至 10 Gbps，企业万兆以太网，数据中心内部 10s–100s Gbps，卫星几十 Mbps 但时延 270 ms。**速率与时延必须一起看**（详见 1.4 节），这也是课件把 "access networks and physical media" 放在一起讲的原因。',
                },
              ],
              questionIds: ['q1.2.5-01'],
              related: ['k1.2.6', 'k1.2.7', 'k1.2.9', 'k1.4.1'],
            },
            {
              id: 'k1.2.6',
              title: 'DSL 数字用户线',
              en: 'DSL',
              summary:
                'DSL 复用既有电话线：数据走 DSL 线路进入互联网，语音走电话网；上行 3.5–16 Mbps、下行 24–52 Mbps，上下行均独占。',
              tags: ['DSL', 'ADSL', 'DSLAM', '电话线', '非对称'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [20] }],
              insight: {
                why: '铺设新光缆到每一户成本极高，但电话公司手里已经遍布全球的铜质电话线是现成资源。DSL 的思路就是"用旧电话线传新数据"。',
                coreIdea: '在既有电话线的频谱上划分频段：==高频段传数据，低频段传语音==，两者互不干扰，从而实现电话与宽带"同线共存"。',
                mechanism: '用户侧的 DSL 调制解调器把数字数据调制到高频段，经电话线到达**局端 DSLAM**（Digital Subscriber Line Access Multiplexer，数字用户线接入复用器），再由 DSLAM 接入互联网；语音则沿原电话网进入运营商电话局。速率**非对称**：下行 24–52 Mbps（独享），上行 3.5–16 Mbps（独享）。',
                comparison: '与 HFC 相比：DSL 的独享性带来速率保证，HFC 共享；DSL 速率受铜线长度与串扰限制（距离越长衰减越大），HFC 覆盖距离长且可同时提供电视。DSL 是"存量电话线"方案，HFC 是"存量有线电视线"方案——两者都是典型的"用存量资源做增量服务"。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 20 页标题为 "Digital Subscriber Line (DSL)"，图中的关键一句是 use existing telephone line to central office DSLAM（复用既有电话线连到局端的 DSLAM）。',
                },
                {
                  type: 'term',
                  zh: 'DSL',
                  en: 'Digital Subscriber Line',
                  abbr: 'DSL',
                  def: '数字用户线：在既有电话线（双绞线）上通过频分复用同时承载语音与数据的接入技术。文中速率指 ADSL（非对称 DSL）。',
                },
                {
                  type: 'term',
                  zh: 'DSLAM',
                  en: 'Digital Subscriber Line Access Multiplexer',
                  abbr: 'DSLAM',
                  def: '数字用户线接入复用器：位于运营商局端的设备，把众多用户 DSL 线路上的数据汇聚、复用后接入运营商骨干网络。它是 DSL 网络里"用户侧的局端"，与电话局（central office）是同一个地点概念。',
                },
                {
                  type: 'p',
                  text: '页面的核心内容是**两条数据流在一条电话线里并行**（PPT 用两条分开的箭头表示）：',
                },
                {
                  type: 'list',
                  items: [
                    '**data over DSL phone line goes to Internet**——数据走 DSL 线路进入互联网；',
                    '**voice over DSL phone line goes to telephone net**——语音走电话线进入传统电话网。',
                  ],
                },
                {
                  type: 'p',
                  text: '这一分离靠**频分**实现：语音占用 300 Hz–3.4 kHz 的低频段，数据占用高频段，互不干扰。这也是为什么"打电话时上网会掉速"——干扰主要来自同线电话的振铃与摘机脉冲，而不是线路本身被占满。',
                },
                {
                  type: 'p',
                  text: '类比：一条电话线像被划出两条"车道"的道路，低频车道专跑语音，高频车道专跑数据，互不占道。边界：这里划分的是频谱而不是物理车道，需要调制解调器与局端设备来区分两者。',
                },
                {
                  type: 'h',
                  text: '速率：非对称，且下行独占',
                },
                {
                  type: 'p',
                  text: '课件给出两个速率，注意措辞是 **dedicated（专用/独占）**：',
                },
                {
                  type: 'table',
                  caption: 'DSL 速率（PPT 第 20 页）',
                  headers: ['方向', '速率', '英文原文', '是否独占'],
                  rows: [
                    ['上行（upstream）', '3.5 – 16 Mbps', '3.5-16 Mbps dedicated upstream transmission rate', 'dedicated（独占）'],
                    ['下行（downstream）', '24 – 52 Mbps', '24-52 Mbps dedicated downstream transmission rate', 'dedicated（独占）'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么要做成"非对称"',
                  text: '因为用户的典型行为是**下行多、上行少**：下载视频、收网页是下行；发邮件、发消息、上传照片是上行。为上行分配过多频谱既浪费又抬高成本，因此把带宽向下行倾斜。同样的非对称逻辑在 HFC 上更极端（30 Mbps 下行 vs 2 Mbps 上行）。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① DSL 的两个速率数字与"dedicated"属性，**与 HFC 的共享形成对比，是必考对比题**；② DSLAM 的含义与位置；③ 数据与语音走不同网络（数据进 Internet，语音进电话网）；④ DSL 复用既有电话线。易错：把 DSL 说成"共享接入"；把 DSLAM 说成"用户家里的设备"（它在局端）。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：DSL 是"双绞线"技术，不要与"接入网=共享"混为一谈',
                  text: '1.2.7 节的 HFC 明确写 "unlike DSL, which has dedicated access"（不像 DSL 拥有独占接入）。因此比较两者时：DSL 独享、HFC 共享；DSL 上下行速率差距较小（16 vs 52），HFC 差距极大（2 vs 30）。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**高频传数据，低频打电话；上行小、下行大、且独占**。”对比记：“**HFC 上行 2、下行 30，还共享**。”',
                },
                {
                  type: 'p',
                  text: '时效性补充：这些速率是 PPT 讲授年代的 ADSL 水平。今天住宅接入的主流是 FTTH（光纤到户）与 DOCSIS 3.1 有线宽带（理论下行可达 1 Gbps 量级），DSL 在多数国家已属存量技术。',
                },
                {
                  type: 'p',
                  text: '不过，"上行远小于下行"的非对称性与"数据与语音分频"的频分思想，在其他接入技术（如 5G 固定无线接入、OFDM 调制）中仍然延续。',
                },
              ],
              questionIds: ['q1.2.6-01'],
              related: ['k1.2.7', 'k1.2.5', 'k1.2.10'],
            },
            {
              id: 'k1.2.7',
              title: 'HFC 混合光纤同轴电缆网',
              en: 'HFC / Cable Modem',
              summary:
                'HFC 复用有线电视的同轴电缆 + 光纤，用 FDM 把下行频谱切成 8 个频道；下行最高 30 Mbps、上行 2 Mbps，且由众多家庭共享。',
              tags: ['HFC', 'Cable Modem', 'FDM', '共享', '有线电视'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter1', slides: [21, 22, 23, 24, 25, 26] },
                { kind: 'supplement', note: '第 22 页关于“SONET 光纤环自带硬件 50 毫秒自愈保护”的说明为教师课堂补充的中文内容，非英文原课件文字。' },
              ],
              insight: {
                why: '与 DSL 的"复用电话线"平行，有线电视公司手里有另一种存量资源——同轴电缆。它同样能承载宽带，且不需要重新铺线。',
                coreIdea: '**HFC（Hybrid Fiber-Coax，混合光纤同轴）**：骨干用光纤，末端入户用同轴电缆，用 Cable Modem 接入。频谱通过 **FDM** 划分成多个频道，各频道承载不同业务（电视、宽带数据）。',
                mechanism: '结构上分三段：家庭（home）、电缆分配网（cable distribution network）、有线电视前站（cable headend，即局端），前站再连到 server(s)。前站把整个频谱按 FDM 切成==8 个频道（1–8）==，其中多个是 VIDEO（电视）频道、DATA（数据）频道，还有 CONTROL（控制）频道。上下行速率不对称：下行最高 30 Mbps，上行 2 Mbps。',
                comparison: '与 DSL 相比：HFC **不使用电话基础设施**（改用有线电视基础设施）；HFC 的下行更快但**不独占**，通常 500–5000 户共享一条接入；DSL 上行更宽裕且独占。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 21 页讲清了 HFC 的定位与速率：',
                },
                {
                  type: 'list',
                  items: [
                    '**Does not use telephone infrastructure**——不使用电话基础设施；',
                    '**Instead uses cable TV infrastructure**——改用有线电视基础设施；',
                    '**HFC: hybrid fiber coax 混合光纤同轴网**；',
                    '**network of cable and fiber attaches homes to ISP router**——由电缆与光纤组成的网络把家庭接到 ISP 路由器；',
                    '**homes share access to router**——**家庭共享**到路由器的接入；',
                    '**unlike DSL, which has dedicated access**——与拥有独占接入的 DSL 形成对比。',
                  ],
                },
                {
                  type: 'table',
                  caption: 'HFC 速率与共享性（PPT 第 21 页）',
                  headers: ['方向', '速率', '英文原文'],
                  rows: [
                    ['下行（downstream）', '最高 30 Mbps', 'up to 30Mbps downstream'],
                    ['上行（upstream）', '2 Mbps', '2 Mbps upstream'],
                  ],
                },
                {
                  type: 'p',
                  text: '注意 PPT 的措辞是 "up to 30Mbps"（最高可达）。HFC 是共享的，所以"最高"与"共享"要一起理解：这是**理论峰值**，忙时实际拿到的远小于 30 Mbps。',
                },
                {
                  type: 'h',
                  text: '电缆网络架构：从家庭到前站',
                },
                {
                  type: 'p',
                  text: 'PPT 第 23–25 页用三张逐步展开的图讲 "Cable Network Architecture: Overview"，三页共有的三个位置是：',
                },
                {
                  type: 'list',
                  items: [
                    '**home（家庭）**——用户的 Cable Modem 所在处；',
                    '**cable headend（有线电视前站 / 局端）**——网络的中心节点，所有用户的信号在这里汇聚与交换；',
                    '**cable distribution network（电缆分配网）**——连接家庭与前站的那一段 coax 树状网络。',
                  ],
                },
                {
                  type: 'p',
                  text: '三页逐步补充细节：',
                },
                {
                  type: 'list',
                  items: [
                    '第 23 页标注 "Typically 500 to 5,000 homes"（通常接入 500 到 5000 户），这正是"共享"的量化含义。',
                    '第 24 页补上 server(s)，前站再向上连到服务器与运营商网络。',
                    '第 25 页回到简化视图，强调这仍是一张"树 + 汇聚"的结构，而不是全连接的网。',
                  ],
                },
                {
                  type: 'figure',
                  alt: 'HFC 电缆网络架构示意图',
                  ascii:
                    '        server(s)\n' +
                    '             │\n' +
                    '      ┌──────┴───────┐\n' +
                    '      │ cable headend │   ← 局端：汇聚、交换、接入 ISP 路由器\n' +
                    '      └──────┬───────┘\n' +
                    '             │  cable distribution network（分配网）\n' +
                    '    ┌────────┼────────┬─────────┐\n' +
                    '   home     home      home    home   …（典型 500–5000 户）\n' +
                    '  (modem)  (modem)   (modem)  (modem)',
                  caption: '按 PPT 第 23–25 页整理的 HFC 架构',
                },
                {
                  type: 'h',
                  text: 'FDM：把频谱切成 8 个频道',
                },
                {
                  type: 'p',
                  text: 'PPT 第 26 页用一张频谱图讲 **FDM（Frequency Division Multiplexing，频分复用）**。图中横轴是频率，从低到高标出编号 1 到 8 的八个频道：频道 1–6 标为 VIDEO（电视业务），频道 7、8 标为 DATA（数据业务），另有一个 CONTROL（控制）频道负责上行与控制信令。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示：HFC 的频谱划分',
                  text: '必记：**HFC 用 FDM 把频谱划分为 8 个频道**（1–6 电视、7–8 数据，另有控制频道）。这是 PPT 第 26 页的核心图，常以"共几个频道、各频道干什么"出题。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么 HFC 一定要用 FDM',
                  text: '因为 coax 电缆的频谱资源是**一段连续的带宽区间**，而这个区间里必须同时塞下：几十路模拟电视信号、宽带数据下行、数据上行、以及头端控制信令。FDM 把频谱按频率切开，各业务各占一段，互不干扰地共享同一根线。这与 1.3.1 节电路交换中的 FDM 是**同一个物理思想**，只是这里用于"一条物理链路上的多业务复用"，那里用于"电路交换的链路资源划分"。',
                },
                {
                  type: 'h',
                  text: '教师补充：SONET 光纤环的 50 毫秒自愈保护',
                },
                {
                  type: 'p',
                  text: 'PPT 第 22 页在 HFC 的图上叠加了一段中文说明（这是**教师课堂补充的中文内容**，非英文原课件文字）：',
                },
                {
                  type: 'quote',
                  text: 'SONET 光纤环自带硬件 50 毫秒自愈保护，光纤断了业务自动绕路，保障电视和宽带不中断。',
                  cite: 'Chapter1.pptx 第 22 页（教师补充）',
                },
                {
                  type: 'p',
                  text: '这句话补充了 HFC 骨干侧的一个关键工程事实：HFC 的"光纤 + 同轴"混合结构里，**光纤段通常采用 SONET（同步数字体系）环网**。SONET 环是自愈的——某段光纤被挖断时，环上设备在约 **50 毫秒**内检测到故障，并把业务切换到反方向的另一条路径（保护倒换），电视与宽带业务因此不中断。',
                },
                {
                  type: 'p',
                  text: '50 毫秒对视频业务可以接受（约 1 帧多一点的缓冲），对语音仍属明显损伤（ITU-T G.114 建议单向时延小于 150 ms）。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '术语补充',
                  text: '**SONET（Synchronous Optical Network，同步光网络）** 是北美标准的同步数字体系，典型速率 STS-1 为 51.84 Mb/s；其欧洲/国际对应标准是 **SDH（Synchronous Digital Hierarchy，同步数字体系）**。两者的关键工程特性是"环 + 自动保护倒换（APS）"，倒换时间典型在 50 ms 量级。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① HFC 的定位与速率（下行最高 30 Mbps、上行 2 Mbps）、**共享**属性、500–5000 户；② FDM 8 个频道的划分；③ **SONET 光纤环 50 毫秒自愈保护**（教师补充，属于光纤段可靠性的工程常识）。易错：把 HFC 说成"独占接入"；把下行 30 Mbps 说成"保证可达"。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**HFC：电话线不碰，有线电视线；上 2 下 30，共享不独享；FDM 八频道，前站汇所有；光纤 SONET 环，断了 50 毫秒换路通。**”',
                },
                {
                  type: 'p',
                  text: '时效性补充：PPT 描述的是 DOCSIS 有线宽带的早期形态。DOCSIS 3.0/3.1 通过更宽的下行频谱（OFDM 多载波）与更高阶调制，把共享 HFC 的单户下行推到了 1 Gbps 量级；但**共享属性与上行受限**这两点没有变，因此"用 HFC 上行做视频会议会卡"这个体验至今仍然成立。',
                },
              ],
              questionIds: ['q1.2.7-01', 'q1.2.7-02'],
              related: ['k1.2.6', 'k1.2.8', 'k1.3.1'],
            },
            {
              id: 'k1.2.8',
              title: '家庭网、企业网与数据中心',
              en: 'Home / Enterprise / Data Center',
              summary:
                '接入网的三种典型形态：家庭网以路由器为中心汇聚多种接入，企业网是混合有线/无线的交换机与路由器，数据中心用 10s–100s Gbps 高速链路连接成百上千台服务器。',
              tags: ['家庭网', '企业网', '数据中心', 'Ethernet', 'WiFi'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [27, 28, 29] }],
              insight: {
                why: '接入网不是只有"宽带入户"一种形态。公司、校园、数据中心的接入需求完全不同：家庭网追求易用与低成本，企业网追求覆盖与混合介质，数据中心追求极致带宽与低时延。',
                coreIdea: '三者共用同一套"边缘 + 接入 + 核心"的结构骨架，差别在于**接入的介质组合、带宽量级与设备数量**。',
                mechanism: '**家庭网**：一台家用路由器把 Cable Modem / DSL 调制解调器、以太网交换机、WiFi 接入点集成在一起（常常还在同一个盒子里），构成"箱中之箱"。**企业网**：有线与无线混合，交换机与路由器组合，把公司/学校的众多主机接入。**数据中心**：高带宽链路（10s 到 100s Gbps）把成百上千台服务器互联，并连向互联网。',
                comparison: '速率量级：家庭网 WiFi 接入点 54/450 Mbps、有线以太网 1 Gbps；企业网以太网 100 Mbps / 1 Gbps / 10 Gbps、WiFi 11/54/450 Mbps；数据中心 10s–100s Gbps。规模量级：家庭网几台设备，企业网数百台，数据中心成百上千台。**数据中心的特殊之处在于它既在"边缘"（服务器是端系统）又有"核心"的味道（内部高速互联与大量转发）**。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 27–29 页连续讲三种接入形态。它们在结构图上都是"边缘"的一部分，但内部组织方式差别很大。',
                },
                {
                  type: 'h',
                  text: '一、家庭网（home networks）',
                },
                {
                  type: 'p',
                  text: '第 27 页只有一句标题 **"Access networks: home networks"**，内容全在图里。图中是一个典型的家庭网络：',
                },
                {
                  type: 'list',
                  items: [
                    '中心是一台**路由器（router, firewall, NAT）**——注意 PPT 图上把这三个功能都标在了同一个方框里；',
                    '左边是 **WiFi 无线接入点（54, 450 Mbps）**，常常与路由器**合并在同一个盒子**中（图中标注 "often combined in single box"）；',
                    '右边是 **有线以太网（1 Gbps）** 端口，接的是家里的 PC、打印机等；',
                    '上方连接各种**无线与有线设备**：手机、笔记本、台式机、冰箱等；',
                    '路由器右侧通过 **cable or DSL modem** 连到前站或局端（"to/from headend or central office"）。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '顺带认识三个家庭网关功能',
                  text: '**NAT（Network Address Translation，网络地址转换）**：把家庭内网的私有地址转换成运营商分配的公网地址，是家用 IPv4 接入的必需品；**防火墙（firewall）**：按规则过滤进出流量；路由器：在家庭网与接入网之间转发分组。这三者合在"箱子里"是家庭网最典型的特征。',
                },
                {
                  type: 'h',
                  text: '二、企业网（enterprise networks）',
                },
                {
                  type: 'p',
                  text: 'PPT 第 28 页标题 **"Access networks: enterprise networks (companies, universities, etc)"**，要点两句：',
                },
                {
                  type: 'list',
                  items: [
                    '**mix of wired, wireless link technologies, connecting a mix of switches and routers**——有线与无线链路技术混合，连接交换机与路由器的混合体；',
                    '**Ethernet: wired access at 100Mbps, 1Gbps, 10Gbps**——以太网有线接入速率 100 Mbps、1 Gbps、10 Gbps；',
                    '**WiFi: wireless access points at 11, 54, 450 Mbps**——WiFi 无线接入点速率 11、54、450 Mbps。',
                  ],
                },
                {
                  type: 'p',
                  text: '企业网与家庭网的关键差别是**规模与管理**：企业网面向成百上千名员工，需要统一部署的认证、策略与带宽保障；而家庭网的路由器是"即插即用"的消费级设备。另一个差别是企业网**几乎全部使用有线以太网作为主干**，无线主要用来覆盖办公区。',
                },
                {
                  type: 'h',
                  text: '三、数据中心（data center networks）',
                },
                {
                  type: 'p',
                  text: 'PPT 第 29 页只有一句：**"high-bandwidth links (10s to 100s Gbps) connect hundreds to thousands of servers together, and to Internet"**。',
                },
                {
                  type: 'p',
                  text: '高带宽链路（**10 到 100 Gbps 量级**）把**数百到数千台服务器**互联起来，并把它们连向互联网。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '数据中心为什么值得单独讲',
                  text: '因为它是互联网流量的**汇聚点与发动机**：今天绝大多数互联网内容（视频、网页、云服务）都产生于数据中心。前面 k1.1.1 提到的"全球互联网拓扑"上那些被大量用户访问的站点，物理上就坐落在数据中心里。理解数据中心，就能理解为什么 1.3.7 节的互联网结构图里会专门画出 content provider network 与 datacenter network 两个区块。',
                },
                {
                  type: 'table',
                  caption: '三种接入形态对照（PPT 第 27–29 页）',
                  headers: ['维度', '家庭网', '企业网', '数据中心'],
                  rows: [
                    ['典型规模', '个位数到十几台设备', '数百台主机', '数百到数千台服务器'],
                    ['有线速率', 'Ethernet 1 Gbps', 'Ethernet 100 Mbps / 1 Gbps / 10 Gbps', '10s–100s Gbps 高速链路'],
                    ['无线速率', 'WiFi 54 / 450 Mbps', 'WiFi 11 / 54 / 450 Mbps', '基本不用无线接入服务器'],
                    ['核心设备', '家用路由器（路由+防火墙+NAT 合一）', '交换机与路由器混合', '高速交换/路由设备 + 分布式结构'],
                    ['管理取向', '易用、即插即用', '策略统一、带宽保障', '极致吞吐与低时延'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 三种形态的速率数字必须记住：家庭网 WiFi 54/450 Mbps、以太网 1 Gbps；企业网以太网 100M/1G/10G、WiFi 11/54/450 Mbps；数据中心 10s–100s Gbps、数百到数千台服务器；② 家庭路由器常把**路由、防火墙、NAT** 合一；③ 无线接入点速率 **11 / 54 / 450 Mbps**（对应 802.11b/g/n）在 PPT 中反复出现，是高频数字。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：WiFi 速率不等于 WiFi 吞吐',
                  text: '**54 Mbps / 450 Mbps 是 802.11g/n 的理论传输速率（signal rate）**，是物理层极限；实际吞吐量要打折，因为还有协议开销、争用退避、信道共享与信号干扰。PPT 第 27 页家庭网图上标注的 "WiFi wireless access point (54, 450 Mbps)" 也是链路速率。这与 1.4.1 节"吞吐量受带宽限制"是同一件事的两面。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**家用盒子三合一（路由、防火墙、NAT）；企业百兆到万兆；数据中心几十上百 Gbps**。”WiFi 三个数：“**11、54、450**”，对应 b/g/n。',
                },
                {
                  type: 'p',
                  text: '三种形态回答的是同一个问题的不同规模版本：**如何把一堆主机用足够便宜、足够快的链路接到互联网核心上**。',
                },
                {
                  type: 'p',
                  text: '家庭用 WiFi 和百兆光纤，企业用万兆以太网，数据中心用 100 Gbps 互联并直接对接 ISP 路由器，从而绕过公网中转、降低时延与成本。这也是大型 CDN 大量部署边缘节点的原因。',
                },
              ],
              questionIds: ['q1.2.8-01'],
              related: ['k1.2.5', 'k1.2.9', 'k1.3.7', 'k1.4.1'],
            },
            {
              id: 'k1.2.9',
              title: '无线接入网：WLAN 与蜂窝',
              en: 'Wireless Access',
              summary:
                '无线接入网通过基站把端系统接入路由器：WLAN（802.11b/g/n，11/54/450 Mbps）与广域蜂窝（3G 384 kbps、4G 1–10 Mbps、5G 100 Mbps–1 Gbps）。',
              tags: ['无线接入', 'WLAN', '802.11', '3G', '4G', '5G', '基站'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [30] }],
              insight: {
                why: '最后一段接入不再依赖"拉一根线"。无线接入摆脱了布线约束，是手机、IoT、移动性负载的接入方式，也是时延与速率最难同时优化的场景。',
                coreIdea: '无线接入网是**共享**的：所有终端通过**基站（base station，又称接入点 access point）**接入路由器。按覆盖范围分 **WLAN（局域无线）** 与 **蜂窝广域网** 两类。',
                mechanism: '共享无线接入网把端系统经基站连到路由器。WLAN 使用 802.11b/g/n（WiFi）协议，速率 11 / 54 / 450 Mbps；广域蜂窝接入网由**电信运营商**提供，覆盖 10 公里量级：3G 为 384 kbps，4G 为 1–10 Mbps，5G 用户体验速率可达 100 Mbps 至 1 Gbps（约为 4G 的 10–100 倍）。',
                comparison: 'WLAN 覆盖小（室内/楼宇）、速率高、无运营商月租；蜂窝覆盖广（公里级）、速率相对低、需运营商网络与资费。共同点是**无线频谱是共享资源**：同一基站下用户越多，单个用户可用速率越低，且无线链路还额外面临干扰、遮挡与隐藏终端问题（详见 1.6.3 的嗅探）。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 30 页标题 **"Wireless Access Networks：局域/广域"**。开头的定义句非常精炼：**"shared wireless access network connects end system to router via base station aka ‘access point’"**——共享的无线接入网通过基站（也叫接入点）把端系统连到路由器。',
                },
                {
                  type: 'term',
                  zh: '基站 / 接入点',
                  en: 'base station / access point',
                  abbr: 'AP',
                  def: '无线接入网中与端系统无线通信、并把流量转发到路由器的设备。WLAN 中称为接入点（access point，AP），蜂窝网中称为基站（base station）。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '注意 "shared" 这个词',
                  text: '课件在定义里就写明了 **shared**（共享）——无线频谱是有限的，所有连到同一基站的终端共享它。这意味着无线接入的速率是**峰值而非保证值**，且用户数越多人均速率越低。这与 1.2.5 节提出的"带宽 + 共享/独享"两个评价维度完全对应。',
                },
                {
                  type: 'h',
                  text: '一、WLAN：802.11b/g/n',
                },
                {
                  type: 'p',
                  text: '课件给出的 WLAN 速率是 **802.11b/g/n (WiFi): 11, 54, 450 Mbps transmission rate**。这三个数字分别对应三代主流 WiFi 标准的**物理层峰值传输速率**：',
                },
                {
                  type: 'table',
                  caption: 'PPT 第 30 页：无线接入速率',
                  headers: ['技术', '代次', '传输速率', '英文原文'],
                  rows: [
                    ['WiFi 802.11b', '第一代主流', '11 Mbps', '802.11b/g/n (WiFi): 11, 54, 450 Mbps'],
                    ['WiFi 802.11g', '第二代主流', '54 Mbps', '同上'],
                    ['WiFi 802.11n', '第三代主流', '450 Mbps', '同上'],
                    ['3G 蜂窝', '广域', '384 kbps', '3G :384 kbps'],
                    ['4G 蜂窝', '广域', '1–10 Mbps', '4G: 1-10Mbps'],
                    ['5G 蜂窝', '广域', '100 Mbps – 1 Gbps', 'next up (?): 5G 用户体验速率可达 100Mbps 至 1Gbps'],
                  ],
                },
                {
                  type: 'p',
                  text: '课件还给了一句评价：**"next up (?)：5G 用户体验速率可达 100 Mbps 至 1 Gbps，比如今的 4G 至少快 10 倍——100 倍"**。注意这里说的是 **用户体验速率**（user experience rate），即用户在应用层真正感受到的速率，而不是实验室峰值。这一点与 1.4.1 节的吞吐量概念相扣。',
                },
                {
                  type: 'h',
                  text: '二、广域蜂窝接入网',
                },
                {
                  type: 'p',
                  text: '课件指出广域蜂窝接入网覆盖范围达 **10 公里（10\'s km）** 量级，由**电信运营商（telco operator）**提供。速率从 3G 的 384 kbps，到 4G 的 1–10 Mbps，再到 5G 的 100 Mbps–1 Gbps，呈大约每代 10 倍的跃升。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: 'PPT 思考题（务必掌握）',
                  text: 'PPT 第 30 页页脚留了一道思考题：**“在家中，手机通过 wifi 和 5G 刷抖音，数据走的路径一样吗？”** 这是一道极好的综合题：答案的骨架是——**前半段不一样，后半段一样**。',
                },
                {
                  type: 'p',
                  text: '**前半段（接入段）不一样**：通过 WiFi 时，手机把请求交给家里的无线接入点（AP），再经家用路由器/NAT 由有线宽带（DSL 或 HFC）出去；通过 5G 时，手机直接以无线方式接入运营商基站，运营商再做回传（backhaul）到核心。',
                },
                {
                  type: 'p',
                  text: '两条路都是**先到"边缘路由器/接入点"再进入核心**。',
                },
                {
                  type: 'p',
                  text: '**后半段（核心段）基本一样**：一旦进入运营商骨干，数据沿 1.3.7 节讲的 ISP 层次结构穿越若干跳，最终到达内容提供方的数据中心。',
                },
                {
                  type: 'list',
                  items: [
                    '**WiFi 路径**：手机 → 家庭 WiFi AP → 家用路由器（NAT/防火墙）→ 接入网（DSL 或 HFC）→ 运营商接入路由器 → ISP 骨干 → … → 数据中心；',
                    '**5G 路径**：手机 → 5G 基站 → 运营商接入网/回传 → 运营商骨干（可能经 IXP）→ … → 数据中心。',
                    '**相同点**：两者最终都进入同一个"网络之网络"的核心。',
                    '**不同点（接入段）**：接入技术不同，时延也不同——5G 无线段时延通常优于弱 WiFi，但 4G/5G 的核心回传时延可能大于家庭宽带。',
                    '**不同点（策略）**：带宽计费与可用性策略不同。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 无线接入的速率组：WLAN 11 / 54 / 450 Mbps、3G 384 kbps、4G 1–10 Mbps、5G 100 Mbps–1 Gbps；② 蜂窝由**电信运营商**提供，覆盖 10 公里量级；③ **"WiFi 路径 vs 5G 路径"的思考题**要能画出两条路径，并说明相同点与不同点。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：WiFi 属于“局域网”还是“广域网”',
                  text: 'WiFi（802.11）是 **WLAN（无线局域网）**，覆盖范围是室内/楼宇（几十到几百米）；**3G/4G/5G 是广域蜂窝网**，覆盖公里级。PPT 标题里的"局域/广域"就是在区分这两者，答题时不要把 450 Mbps 的 WiFi 与 4G 的 1–10 Mbps 搞混到同一个技术族里。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**无线两兄弟：局域 WiFi（11/54/450），广域蜂窝（384k → 1~10M → 100M~1G）**。”蜂窝代际口诀：“**3G 几百 k，4G 几 M，5G 百 M 到 G**。”',
                },
                {
                  type: 'p',
                  text: 'PPT 中的速率是**接入链路速率**，不是应用层吞吐量：中间还隔着 TCP/HTTP 开销、无线争用与运营商回传瓶颈。这正是 1.4 节要衡量的对象。',
                },
                {
                  type: 'p',
                  text: '无线介质比有线多出三类传播效应：**反射（reflection）、物体遮挡（obstruction by objects）、干扰（interference）**（见 k1.2.11）。这些效应导致无线链路的速率波动，也带来 1.6.3 节将要讨论的嗅探风险。',
                },
              ],
              questionIds: ['q1.2.9-01', 'q1.2.9-02'],
              related: ['k1.2.5', 'k1.2.11', 'k1.4.1', 'k1.4.2'],
            },
          ],
        },
        {
          id: 's1.2.3',
          title: '物理介质',
          knowledge: [
            {
              id: 'k1.2.10',
              title: '导向介质：双绞线、同轴、光纤',
              en: 'Guided Media',
              summary:
                '导向介质让信号沿固体介质传播：双绞线（Cat3 10 Mbps、Cat5 100 Mbps）、同轴电缆（基带/宽带）、光纤（多模 MMF 与单模 SMF）。',
              tags: ['双绞线', '同轴电缆', '光纤', 'MMF', 'SMF', 'Cat5'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [31, 32, 33, 34] }],
              insight: {
                why: '链路再抽象也必须落在真实介质上。介质的物理特性（导电性、光学、电磁干扰）直接决定了链路的速率上限、传输距离与误码率，因此必须理解每种介质的适用场景。',
                coreIdea: '**导向介质（guided media）**：信号在固体介质中传播——铜缆、光纤、同轴。信号被约束在介质内部，因此抗干扰能力与速率上限更高。',
                mechanism: '双绞线是两根绝缘铜线，把两根线**互相绞合**是为了让外界干扰在两根线上感应的信号相互抵消，从而抑制噪声。类别（Category）决定支持的最高频率与速率：Cat3 支持 10 Mbps 以太网，Cat5 支持 100 Mbps 以太网。同轴电缆是两根同心的铜导体，可支持基带（单频道）或宽带（多频道，HFC 用）。光纤用玻璃纤芯承载光脉冲，每个光脉冲代表一个比特。',
                comparison: '速率与距离：光纤 ≫ 同轴 ≫ 双绞线。同轴支持长距离但速率有限；双绞线便宜易部署但距离短（100 m）。光纤分**多模（MMF）**与**单模（SMF）**：多模纤芯粗、光线以多条模式传播、存在模间色散，适合短距；单模纤芯细、只有一种模式传播、可支持极高速率与超长距离，适合长距骨干。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 31 页先给出物理介质的总框架：**"Bit: propagates between transmitter/rcvr pairs"**——比特在发送器与接收器对之间传播；**physical link: what lies between transmitter & receiver**——物理链路就是发送器与接收器之间的那一段实体。然后一分为二：',
                },
                {
                  type: 'list',
                  items: [
                    '**guided media（导向介质）**：signals propagate in solid media: copper, fiber, coax——信号在固体介质（铜、光纤、同轴）中传播；',
                    '**unguided media（非导向介质）**：signals propagate freely, e.g., radio——信号自由传播，例如无线电（见 k1.2.11）。',
                  ],
                },
                {
                  type: 'h',
                  text: '一、双绞线（Twisted Pair, TP）',
                },
                {
                  type: 'p',
                  text: '第 31 页给出双绞线的定义与两个类别：',
                },
                {
                  type: 'list',
                  items: [
                    '**two insulated copper wires**——两根绝缘铜线；',
                    '**Category 3**: traditional phone wires, 10 Mbps Ethernet——传统电话线，10 Mbps 以太网；',
                    '**Category 5**: 100 Mbps Ethernet——100 Mbps 以太网。',
                  ],
                },
                {
                  type: 'p',
                  text: '第 32 页补充了双绞线的两个标准版本：**STP（Shielded Twisted Pair，屏蔽双绞线）** 与 **UTP（Unshielded Twisted Pair，非屏蔽双绞线）**。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么要把两根线绞起来',
                  text: '外部电磁场对两根线的干扰几乎相同（它们挨得很近），如果两线不绞合，干扰信号会同相叠加到信号上；把两线**周期性互换位置**，干扰在两根线上感应的相位相反，叠加后相互抵消，从而大幅提高抗噪能力。STP 额外加一层金属屏蔽网，抗噪更强但更贵、更难施工，因此绝大多数办公楼用的是 UTP。',
                },
                {
                  type: 'table',
                  caption: '双绞线类别（PPT 第 31 页）',
                  headers: ['类别', '英文', '典型用途', '以太网速率'],
                  rows: [
                    ['Cat 3', 'Category 3', 'traditional phone wires（传统电话线）', '10 Mbps'],
                    ['Cat 5', 'Category 5', '通用办公布线', '100 Mbps'],
                  ],
                },
                {
                  type: 'h',
                  text: '二、同轴电缆（coax）',
                },
                {
                  type: 'p',
                  text: 'PPT 第 33 页：**two concentric copper conductors**（两根同心铜导体），**bidirectional**（双向）。同轴电缆的两种工作方式：',
                },
                {
                  type: 'table',
                  caption: '同轴电缆的两种模式（PPT 第 33 页）',
                  headers: ['模式', '英文', '含义', '典型用途'],
                  rows: [
                    ['基带', 'baseband', 'single channel on cable——线缆上只有一个频道', 'legacy Ethernet（早期以太网）'],
                    ['宽带', 'broadband', 'multiple channel on cable——线缆上有多个频道', 'HFC（有线电视与宽带混传）'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '把这里和 HFC 连起来',
                  text: 'PPT 第 21–26 页讲的 HFC，其同轴段正是工作在**宽带**模式：整段频谱被 FDM 切成 8 个频道（k1.2.7），各频道分别跑电视、数据与控制信令。**基带与宽带是同一根线缆的两种用法**，前者是"独占了整条线"，后者是"把线切成多份共享"。',
                },
                {
                  type: 'h',
                  text: '三、光纤（fiber optic cable）',
                },
                {
                  type: 'p',
                  text: '第 33 页给出光纤的三个要点：',
                },
                {
                  type: 'list',
                  items: [
                    '**glass fiber carrying light pulses, each pulse a bit**——玻璃纤维承载光脉冲，每个脉冲代表一个比特；',
                    '**high-speed operation**: high-speed point-to-point transmission (e.g., 5 Gps)——高速点到点传输（例：5 Gbps）；',
                    '**low error rate**: repeaters spaced far apart; immune to electromagnetic noise——误码率低，中继器可以间隔很远，且不受电磁干扰。',
                  ],
                },
                {
                  type: 'p',
                  text: '第 34 页进一步区分了两种光纤：**MMF 多模光纤** 与 **SMF 单模光纤**。',
                },
                {
                  type: 'table',
                  caption: '多模光纤 vs 单模光纤',
                  headers: ['维度', 'MMF 多模光纤', 'SMF 单模光纤'],
                  rows: [
                    ['芯径', '较粗（50/62.5 μm 级）', '很细（约 8–10 μm 级）'],
                    ['传播模式', '光以多条模式传播，存在模间色散', '只有一种模式传播，无模间色散'],
                    ['典型距离', '短距（楼宇内、机房内）', '长距（城域、跨洋骨干）'],
                    ['光源', 'LED 或 VCSEL（成本低）', '激光（成本高、速率高）'],
                    ['优势场景', '高密度、低成本互联', '超高速、超长距传输'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么"免疫电磁干扰"这么重要',
                  text: '因为它同时解决了两件事：① **速率**——带宽不受铜线电容与衰减限制；② **安全与可用性**——光纤无法被"搭线窃听"，也不会像铜缆那样把干扰引入机房。加上"中继器可以拉得很开"，光纤是长距离骨干的唯一现实选择。也正因如此，PPT 第 22 页才要强调 SONET 光纤环的 50 毫秒自愈保护对 HFC 骨干的意义。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 导向介质三兄弟：双绞线、同轴、光纤；② 双绞线 Cat3 = 10 Mbps、Cat5 = 100 Mbps，分 STP / UTP；③ 同轴分基带（legacy Ethernet）与宽带（HFC）；④ 光纤优点：高速度、低误码、不受电磁干扰，分 MMF / SMF。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① **"5 Gps"** 是 PPT 上的写法，指 5 Gbps 的点到点传输速率，不是"5 千兆每秒"或某种协议；② 同轴电缆的"双向"指它既能发送也能接收，不代表是全双工交换；③ 双绞线类别与以太网速率的对应是 Cat3→10 Mbps、Cat5→100 Mbps，不要与"Cat6/Cat6a 支持 10 Gbps"的现网事实混淆——按课件口径作答。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**绞、同、光**”三兄弟：“**绞线绞着抗干扰，三类十兆五类百；同轴分基带宽带，光纤单模跑长途**。”',
                },
                {
                  type: 'p',
                  text: '在真实的网络地图上，双绞线统治**最后一公里**（家里、办公室），同轴统治有线电视宽带的分配段，光纤统治骨干、数据中心内部以及多数运营商的回传。',
                },
                {
                  type: 'p',
                  text: '介质选择的本质是**速率-距离-成本**的三角权衡：没有最好的介质，只有在给定距离与预算下最合适的选择。',
                },
              ],
              questionIds: ['q1.2.10-01'],
              related: ['k1.2.11', 'k1.2.6', 'k1.2.7', 'k1.5.5'],
            },
            {
              id: 'k1.2.11',
              title: '非导向介质：无线电与卫星',
              en: 'Unguided Media',
              summary:
                '无线电把信号载在电磁频谱上自由传播，受反射、遮挡与干扰影响；地面微波、WiFi、蜂窝与卫星各有速率与时延特点，卫星端到端时延约 270 毫秒。',
              tags: ['无线电', '微波', '卫星', '270ms', '星链'],
              sources: [
                { kind: 'ppt', ppt: 'Chapter1', slides: [35, 36] },
                { kind: 'supplement', note: '第 36 页"当前实际（2026）"的星链在轨数量为教师补充的最新数据。' },
              ],
              insight: {
                why: '非导向介质不依赖任何"线"，因此是唯一能跨越海洋、荒漠与移动场景的接入手段；也是"最后一公里"和"跨洋链路"绕不开的方案。代价是频谱共享与传播环境不确定。',
                coreIdea: '**无线电（radio）**：信号承载在电磁频谱上，没有物理"线"，双向传播。传播环境会造成**反射（reflection）、物体遮挡（obstruction）、干扰（interference）**三种效应。',
                mechanism: '按链路类型分四类：**地面微波（terrestrial microwave）**，如 45 Mbps 频道；**LAN（如 WiFi）**，11 Mbps / 54 Mbps；**广域（如蜂窝）**，3G 数百 kbps；**卫星（satellite）**，45 Mbps 频道（或多个较小频道），端到端时延 **270 毫秒**。卫星又分**地球同步（geosynchronous）**与**低轨（low altitude）**两类。',
                comparison: '卫星 vs 地面无线：卫星覆盖全球但时延大（270 ms 量级，因为信号要跑地球-卫星-地球）；低轨星座（如星链）通过大量近地轨道卫星把时延压到几十毫秒量级，但覆盖随卫星移动而"漂移"，需要庞大星座维持连续覆盖。星链（Starlink）正是低轨星座的代表。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 35 页标题 **"Physical media: radio"**，要点如下：',
                },
                {
                  type: 'list',
                  items: [
                    '**signal carried in electromagnetic spectrum**——信号承载在电磁频谱上；',
                    '**no physical "wire"**——没有物理的"线"；',
                    '**bidirectional**——双向的；',
                    '**propagation environment effects: reflection / obstruction by objects / interference**——传播环境效应：**反射、物体遮挡、干扰**。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '三种传播效应各自带来什么后果',
                  text: '**反射**：信号遇到墙面等物体后反弹，可能造成多径叠加或信号抵消（衰落）；**物体遮挡**：低频信号更容易绕过障碍，高频信号（如毫米波 5G）几乎无法绕过，所以 5G 基站密度必须很大；干扰：其他发射源（邻居 WiFi、同一频段的微波链路）占用同一频段，导致速率波动。结论：无线的速率天然是波动的，这正是它与有线介质的根本差别。',
                },
                {
                  type: 'h',
                  text: '四类无线电链路',
                },
                {
                  type: 'table',
                  caption: '无线电链路类型（PPT 第 35 页）',
                  headers: ['类型', '英文', '示例', '速率'],
                  rows: [
                    ['地面微波', 'terrestrial microwave', '点对点回传、骨干接力', 'up to 45 Mbps channels'],
                    ['局域网', 'LAN', 'WiFi', '11Mbps, 54Mbps'],
                    ['广域', 'wide-area', '蜂窝（3G）', 'e.g. 3G: hundreds of kbps'],
                    ['卫星', 'satellite', '同步轨道 / 低轨', 'up to 45Mbps channel (or multiple smaller channels)，270 msec end-end delay'],
                  ],
                },
                {
                  type: 'p',
                  text: '关于卫星，PPT 给出了两个必须记住的要点：**270 msec 端到端时延**，以及 **geosynchronous versus low altitude**（地球同步 vs 低轨）两类。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '270 毫秒是从哪来的',
                  text: '信号要走"地上 → 卫星 → 地上"两段。以地球同步卫星（约 35,786 km 高）为例，光速单程约 120 ms，来回约 240 ms，加上地面处理与协议开销，就得到 **270 ms** 左右的量级。这个数字远大于互联网内典型的几十毫秒 RTT，因此**卫星链路上的实时语音与在线游戏体验明显逊于地面网络**，这是卫星接入的固有代价，也解释了为什么低轨星座（如星链）要用大量卫星把高度降到 550 km，把单程传播时延压到约 2 ms 量级。',
                },
                {
                  type: 'h',
                  text: '星链计划（PPT 第 36 页）',
                },
                {
                  type: 'p',
                  text: 'PPT 第 36 页是中文补充页，标题为 **"马斯克的星链计划 2015"**，内容包括：',
                },
                {
                  type: 'list',
                  items: [
                    '该计划旨在通过建设**由数以万计的星链人造卫星组成的网络**，使所有卫星连成一个"**星座**"，为全世界每个角落提供可靠的互联网连接；',
                    'SpaceX 已发射了**近 600 颗** Starlink 卫星上天，目前已有 **1584 颗**将部署在**地球上空 550 千米处的近地轨道**；',
                    '在已发射的 1584 颗基础上再增加 **3 万颗**，最终使卫星总量达到约 **4.2 万颗**。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '教师补充的最新数据（2026）',
                  text: '课件在同一页补充了 **"当前实际（2026）"** 的状态：累计发射约 12400 + 颗；部分卫星退役陨落；在轨运行约 11000 颗，活跃工作约 10700 颗。这组数字说明：星座规模已经比 PPT 原始数据（600/1584 颗）扩大了约一个数量级，同时也说明**低轨星座需要持续补网**——卫星寿命有限、还会主动规避碎片而"退役陨落"。',
                },
                {
                  type: 'table',
                  caption: '星链规模数据对照（PPT 第 36 页）',
                  headers: ['时点', '累计发射', '在轨运行', '活跃工作', '规划总量'],
                  rows: [
                    ['PPT 原始数据（2015 计划期）', '近 600 颗 + 1584 颗已部署', '—', '—', '再增 3 万颗 → 约 4.2 万颗'],
                    ['教师补充（2026 实际）', '约 12400+ 颗', '约 11000 颗', '约 10700 颗', '—'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '星链为什么用"低轨 + 超大规模"而不是"高轨少量大卫星"',
                  text: '时延与覆盖是一对矛盾：地球同步轨道只需少量卫星就能覆盖全球，但时延固定在约 270 ms；低轨（550 km）时延低得多，代价是卫星相对地面高速移动，单颗卫星的"服务小区"很快掠过，必须靠**成千上万颗**卫星接力才能维持连续覆盖。==星座==就是用数量换时延与连续性。代价是拓扑不断变化，需要星间链路与地面关口站配合，本质上是一个不断变化拓扑的分组网络。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 无线电的**三种传播环境效应**：reflection / obstruction by objects / interference；② 四类无线电链路及速率（45 Mbps 微波、11/54 Mbps WiFi、3G 数百 kbps、卫星 45 Mbps）；③ **卫星端到端时延 270 msec**；④ 同步轨道 vs 低轨的取舍；⑤ 星链的低轨 550 km、星座规模与"2026 实际约 12400+ 颗发射、11000 颗在轨、10700 颗活跃"。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：卫星的 45 Mbps 与 270 ms 要分开记',
                  text: '**45 Mbps 是频道速率（channel rate），270 ms 是端到端时延**。PPT 原文写的是 "up to 45Mbps channel (or multiple smaller channels)"——即可以用多个较小频道聚合。速率高但时延大，正是卫星接入的典型画像；把它当成"又快又低时延"的无线就错了。另外，"270 msec"在题目里通常考的是**数量级与成因（信号往返地面-卫星）**，而不是精确到小数。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**无线无电线，三效反射遮干扰；微波 45、WiFi 11/54、卫星 45 但 270 毫秒**。”“**同步远而迟，低轨多而快**。”',
                },
                {
                  type: 'p',
                  text: '卫星是移动接入网的一种（k1.2.5），其 270 ms 时延是 1.4 节"时延"讨论中的反例：**提高带宽并不能消除传播时延**。',
                },
                {
                  type: 'p',
                  text: '同样，WiFi 的 54 Mbps 只是最后一公里的接入能力，骨干时延仍由光速与路由跳数决定。这就是"网速快"和"延迟低"是两回事的原因。',
                },
              ],
              questionIds: ['q1.2.11-01', 'q1.2.11-02'],
              related: ['k1.2.9', 'k1.2.10', 'k1.4.2', 'k1.4.5'],
            },
          ],
        },
]
