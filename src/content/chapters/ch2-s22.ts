import type { Subsection } from '../../types/content'

export const ch2S22: Subsection[] = [
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
                    'Web 页面（Web page）由若干==对象（object）==组成，对象可以是 HTML 文件、JPEG 图像、' +
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
                  text: '“引用—被引用”的结构决定了两个行为特征：',
                },
                {
                  type: 'list',
                  items: [
                    '浏览器解析完基础 HTML 才知道要取哪些对象，因此**对象请求必然晚于 HTML 到达**，存在天然的串行依赖。',
                    '互不依赖的对象可以**并行下载**，这是 HTTP 流水线与浏览器多连接并行的基础。',
                  ],
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
                  text: 'HTTP 的三个动作：**建连接 → 换消息 → 关连接**。中间那一步可以在一条连接上反复进行（持久连接）。',
                },
                { type: 'h', text: 'HTTP 是“无状态”的（stateless）' },
                {
                  type: 'p',
                  text:
                    '==无状态==的准确含义是：**服务器不维护关于客户端过去请求的任何信息**（PPT 第 27 页）。' +
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
                    'PPT 第 47 页把两种“记性”并列：**协议端点维持状态**（sender/receiver over multiple transactions）' +
                    '与 **Cookie 让 HTTP 消息携带状态**。HTTP 选择后者，因为它简单、健壮、易扩展。',
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
                    ['HTTP/1.1', 'PPT 写作 “RFC 2068”（有误）', 'HTTP/1.1 的正式标准是 **RFC 2616**（1999），已于 2022 年被 **RFC 9110 / RFC 9112** 废弃取代；**RFC 2068（1997）是 HTTP/1.1 早期的 Proposed Standard，已被 RFC 2616 取代**。'],
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
                    'RFC 2068 是 1997 年的 HTTP/1.1 早期 Proposed Standard，已被 RFC 2616 取代。' +
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
                  text: '非持续 HTTP 的代价可以归为三类，持续 HTTP 正针对它们改进：',
                },
                {
                  type: 'list',
                  items: [
                    '**时间**：每个对象 2 RTT。',
                    '**资源**：连接表、缓存、CPU。',
                    '**复杂度**：客户端自己管理并发连接。',
                  ],
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
              figureIds: ['f2.2.4-httptime'],
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
                    'HTTP 有两类报文：请求报文与响应报文（PPT 第 34 页）。' +
                    '请求报文采用 ASCII 人可读格式，由三部分组成（PPT 第 38 页）：' +
                    '开始行（start line）、首部行（header lines）与实体主体（entity body）。' +
                    '在请求报文中，开始行就是==请求行（request line）==。',
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
                    { k: '方法（Method）', v: '对所请求对象执行的操作，本质上是一条命令；请求报文的类型由所采用的方法决定。' },
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
                    '回到 PPT 第 34 页示例：`GET /index.html HTTP/1.1` 之后的行都是首部行。' +
                    '每个首部字段名后跟**冒号 + 空格**再写值，行尾是 CRLF。',
                },
                {
                  type: 'list',
                  items: [
                    '请求头：`Host`、`User-Agent` 与 `Accept` 系列字段（`Accept`、`Accept-Language`、`Accept-Encoding`、`Accept-Charset`）。',
                    '连接头：`Keep-Alive: 115` 表示希望保持连接并允许最多 115 次请求；`Connection: keep-alive` 明确要求持久连接。',
                  ],
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
                    '由开始行、首部行与实体主体组成。' +
                    '响应报文的开始行是==状态行（status line）==，包括三项内容：' +
                    'HTTP 的版本、状态码，以及解释状态码的简单短语。',
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
                    ['301', 'Moved Permanently', '请求的对象已永久移动，新位置由 Location 首部指定'],
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
                    '用 telnet 打开到 80 端口的 TCP 连接：`telnet cis.poly.edu 80`。连接建立后，你敲的每个字符都会送到 80 端口',
                    '输入完整的 GET 请求：`GET /~ross/ HTTP/1.1` 与 `Host: cis.poly.edu`，再回车两次',
                    '观察服务器返回的响应；也可以用 Wireshark 抓取 HTTP 请求/响应',
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
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '类比：Cookie 像游乐园手环',
                  text:
                    '再次入园时出示手环，工作人员据此认出你。' +
                    '不过手环只承载一个编号，购物车等真正的状态仍保存在园区数据库里。',
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
                    'LAN 利用率 = 1.50 Mbps / 1 Gbps = 0.0015 ≈ **0.15%**（PPT 记为 15%，应为笔误）',
                    '总时延 = 互联网时延 + 接入链路排队时延 + LAN 时延 = 2 秒 + 数分钟 + 微秒级',
                    '问题：接入链路几乎跑满，排队时延暴涨，用户体验极差',
                  ],
                  answer: 'LAN 利用率 0.15%，接入链路利用率 97%（PPT 记 99% 为近似），总时延 = 2 sec + minutes + usecs。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：99% 是怎么来的',
                  text:
                    '接入链路利用率 = 1.50 Mbps ÷ 1.54 Mbps = 0.974，即 **97.4%**；PPT 写 **99%** 是四舍五入的近似。' +
                    'LAN 利用率 = 1.50 Mbps ÷ 1 Gbps = **0.15%**；PPT 写 15% 偏大 100 倍，应视为笔误。' +
                    '答题时写公式与数值：接入链路 $1.50/1.54 \\approx 97\\%$，LAN $1.50/1000 = 0.15\\%$。',
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
                  '条件 GET：未修改时返回 304（仅首部），已修改时返回 200 + 新实体，资源不存在时返回 404。' +
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
                  text: '把条件 GET 与 k2.2.8 的缓存结合起来看，缓存的完整工作流分四种情况：',
                },
                {
                  type: 'list',
                  items: [
                    '**命中且新鲜**：直接返回（0 成本）。',
                    '**命中但可能过期**：先用旧副本响应用户，同时在后台发条件 GET 校验（revalidation）。',
                    '**收到 304**：更新新鲜度，继续用旧副本。',
                    '**收到 200 + 新实体**：用新实体替换旧副本。',
                  ],
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
]
