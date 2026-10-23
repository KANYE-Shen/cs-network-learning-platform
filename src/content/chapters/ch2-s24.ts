import type { Subsection } from '../../types/content'

export const ch2S24: Subsection[] = [
        {
          id: 's2.4.1',
          title: '邮件系统与 SMTP',
          knowledge: [
            {
              id: 'k2.4.1',
              title: '电子邮件三大组件',
              en: 'Mail Components',
              summary:
                '电子邮件系统由用户代理、邮件服务器、SMTP 三个组件构成：用户代理负责收发，邮件服务器含邮箱与消息队列，SMTP 负责投递（UA 提交与服务器间传送）。',
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
                  '② 邮件服务器（mail server）；' +
                  '③ **简单邮件传送协议（Simple Mail Transfer Protocol，SMTP）**。',
                mechanism:
                  '邮件服务器包含两部分（PPT 第 65 页）：邮箱（mailbox）存放发给该用户的收件消息；' +
                  '消息队列（message queue）存放待发送的出件。' +
                  'SMTP 运行在两个邮件服务器之间，**发送方服务器充当 SMTP 客户，接收方服务器充当 SMTP 服务器**。',
                comparison:
                  '注意 SMTP 的角色是相对的：在 A→B 的投递中，A 是客户、B 是服务器；' +
                  '但在 B→C 的投递中，B 又变成了客户。' +
                  '这与 Web 的“永远由浏览器当客户”不同，是本节最容易考的概念辨析。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '电子邮件系统由三个主要组件构成（PPT 第 64 页）：' +
                    '**用户代理、邮件服务器与简单邮件传送协议 SMTP**。',
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
                    'UA 只负责编辑与显示，真正的投递由邮件服务器完成。' +
                    '这也解释了 POP3/IMAP 这类“邮件访问协议”为何必须存在：UA 要把邮件从服务器上取回来（见 k2.4.4）。',
                },
                {
                  type: 'p',
                  text:
                    '类比：邮件服务器像快递驿站。寄件人把包裹交给驿站，驿站负责送达；收件人不在家时，包裹先存放在驿站，等收件人来取。' +
                    '边界：驿站只保管包裹，而邮件服务器还要按 SMTP 规则与对方服务器通信。',
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
                    'SMTP 协议在邮件服务器之间传送邮件消息。' +
                    '一次投递中，==发送方服务器是 SMTP 客户==（把邮件放进消息队列），' +
                    '接收方服务器是 SMTP 服务器（把邮件放进收件人邮箱）。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考试重点：SMTP 的角色是相对的',
                  text:
                    '“SMTP 客户端一定是用户的邮件客户端”是**错误**的说法。' +
                    'SMTP 客户是发送方邮件服务器，SMTP 服务器是接收方邮件服务器。' +
                    '读取邮件用邮件访问协议（POP3/IMAP/HTTP）；提交邮件时 UA 仍可用 SMTP（网页邮箱用 HTTP）。' +
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
                    '第 ② 步 Alice 的 UA 把邮件提交给自己的服务器（通常用 SMTP，网页邮箱用 HTTP），第 ⑥ 步 Bob 的 UA 从服务器取回邮件（POP3/IMAP/HTTP）。' +
                    '**SMTP 负责发送与投递，POP3/IMAP 负责读取。**' +
                    '所以“SMTP 是发邮件的协议”只说对了一半——它不负责取信。',
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
                  '这样一条链路上就能高效地把一封邮件依次传给多个中间服务器，而不需要每一跳都反向拉取。',
                coreIdea:
                  'SMTP 使用持久连接（persistent connection）；' +
                  '要求消息（首部与正文）必须是 7 位 ASCII；' +
                  '服务器用 CRLF.CRLF 判断消息结束。' +
                  '与 HTTP 的核心对比（PPT 第 70 页）：' +
                  '**HTTP 是 pull，SMTP 是 push**；' +
                  '两者都有 ASCII 命令/响应交互与状态码；' +
                  'HTTP 中每个对象封装在各自的响应报文中，SMTP 中多个对象可放在一个 multipart 报文中。',
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
                    '状态码同样是“三位数字 + 一句话”：220、250、354 是顺利进行的信号，221 是告别。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：DATA 命令后为什么以单独一行 "." 结束？',
                  text:
                    '因为邮件正文中**完全可能出现一行单独的 "."**（例如引用原文时用 "." 开头）。' +
                    'SMTP 规定：正文中的行首若为 "."，发送方要额外再加一个 "."（**透明化，dot-stuffing**），' +
                    '接收方看到连续两个 "." 时去掉一个还原。' +
                    '这是 SMTP 少数几个需要“转义”的地方。',
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
                    '推模型的必然结果是服务器需要消息队列——发件人离线时邮件也能排队等待发送。' +
                    '这是本章最经典的对比题。',
                },
                {
                  type: 'p',
                  text:
                    '408 联系：推模型中的“消息队列”在结构上就是数据结构课里的队列——新邮件入队，等 SMTP 会话取出投递。' +
                    '这种“先存后取”的思路与操作系统中的缓冲区相同。',
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
                  '**RFC 822**（现行为 RFC 5322）是文本消息格式标准：消息由首部行（header lines）和正文（body）组成，' +
                  '中间以一个空行分隔。首部行如 `To:`、`From:`、`Subject:`，' +
                  '与 SMTP 命令不同（SMTP 命令是 MAIL FROM、RCPT TO、DATA 等）。' +
                  '**MIME**（Multimedia Mail Extension，多媒体邮件扩展，RFC 2045、2046）在消息首部增加额外的行来声明 MIME 内容类型。',
                mechanism:
                  'MIME 的三个关键首部（PPT 第 72 页）：' +
                  'MIME-Version（MIME 版本）、Content-Transfer-Encoding（数据编码方法，如 base64、quoted-printable）、' +
                  'Content-Type（type/subtype; parameters，如 image/jpeg、multipart/mixed; boundary=98766789）。' +
                  '**接收方先看 Content-Type 判断如何处理，再按 Content-Transfer-Encoding 解码。**',
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
                {
                  type: 'p',
                  text:
                    '类比：RFC 822 像信封上固定格式的收件人、寄件人、主题栏；MIME 则像在信里附一张“说明书”，告诉收件人里面装的是图片还是文件、怎样解码。' +
                    '边界：信封与说明书是两件东西，而 MIME 首部与正文都在同一条 7 位 ASCII 消息里。',
                },
                { type: 'h', text: '二、MIME 扩展（PPT 第 72 页）' },
                {
                  type: 'p',
                  text:
                    '**MIME**（Multimedia Mail Extension，多媒体邮件扩展，PPT 标注 **RFC 2045、2056**）' +
                    '在消息首部增加额外的行（核心是 ==Content-Type==），从而声明内容类型、支持多媒体邮件。',
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
                    'PPT 第 72 页写的是 “MIME: multimedia mail extension, RFC 2045, 2056”。' +
                    '正确应为 **RFC 2045**（MIME Part One：格式与基本类型）与 **RFC 2046**（MIME Part Two：多部分媒体类型）。' +
                    'RFC 2056 并不存在与 MIME 相关的正式标准（MIME 相关标准还有 RFC 2047 编码非 ASCII 头、' +
                    'RFC 2048 媒体类型注册表、RFC 2049 MIME 格式总览）。' +
                    '同时 RFC 822 已被 RFC 5322 取代。',
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
                  type: 'list',
                  items: [
                    '**base64**：把任意二进制编码成 7 位可打印 ASCII（每 3 字节 → 4 字符，约膨胀 33%），用于二进制附件',
                    '**quoted-printable**：ASCII 字符近似原样、只转义非 ASCII 字符，主要用于文本',
                    '**7bit / 8bit / binary**：分别表示纯 7 位、含 8 位数据、直接二进制（需 8BITMIME 扩展）',
                  ],
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
                  '**POP**（Post Office Protocol，邮局协议，RFC 1939）：提供授权（authorization）与下载（download）。' +
                  '**IMAP**（Internet Mail Access Protocol，因特网邮件访问协议，RFC 1730）：' +
                  '功能更多，包括操作服务器上存储的消息（manipulation of stored msgs on server）。' +
                  '此外 HTTP 也可作为邮件访问协议（Gmail、Hotmail、Yahoo! Mail 等都基于 HTTP）。',
                mechanism:
                  'POP3 有两个阶段：**授权阶段（authorization phase）**——用户、密码；' +
                  '**事务阶段（transaction phase）**——list（列出消息编号）、retr（按编号取回）、' +
                  'dele（删除）、quit（退出）。' +
                  '服务器响应以 `+OK`（成功）或 `-ERR`（失败）开头。',
                comparison:
                  'POP3 有两种取回模式：download-and-delete（下载并删除）会删掉服务器上的副本，Bob 换客户端后无法重读旧邮件；' +
                  'download-and-keep（下载并保留）则在多个客户端保留副本。' +
                  '**POP3 跨会话无状态**（stateless across sessions）；' +
                  '**IMAP 把所有邮件留在服务器上**，支持把邮件组织到文件夹中，' +
                  '并跨会话保存用户状态（文件夹名、消息 ID 与文件夹的映射关系）。',
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
                    '另外注意 PPT 第 75 页写的 IMAP 是 RFC 1730，那是 1994 年的初版；' +
                    '现行标准是 RFC 3501（IMAP4rev1）与 RFC 9051（IMAP4rev2），' +
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
                    '响应以 `+OK` 表示成功、`-ERR` 表示失败；多行内容以单独一行的 `.` 结束（与 SMTP 的 DATA 结束方式一致）。',
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
                    'PPT 第 77 页指出：**POP3 跨会话是无状态的**（stateless across sessions）。' +
                    '每次会话都要重新授权，服务器不记得上次取到了哪里，也不保存已读位置、文件夹结构等用户状态。' +
                    '但会话内服务器仍要记住本次已删除的邮件编号，以便多行同步。',
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
                    '五个维度逐条对照（见下表）：POP3 偏向“取回本地”，IMAP 偏向“留在服务器管理”。' +
                    '考试时按维度分别作答，并说明原因。',
                },
                {
                  type: 'table',
                  caption: 'POP3 与 IMAP 的五个差异',
                  headers: ['对比维度', 'POP3', 'IMAP'],
                  rows: [
                    ['邮件存放位置', '下载到本地（可选择删除服务器副本）', '留在服务器'],
                    ['多设备同步', '需靠 download-and-keep 保留副本', '天然支持'],
                    ['文件夹管理', '不支持在服务器上组织邮件', '只有 IMAP 支持在服务器上建文件夹、组织邮件'],
                    ['跨会话状态', '无状态', '保留文件夹名，以及消息 ID 与文件夹的映射'],
                    ['存储与离线', '适合离线阅读', '节省客户端空间，但依赖网络'],
                  ],
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
]
