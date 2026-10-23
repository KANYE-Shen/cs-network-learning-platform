import type { Subsection } from '../../types/content'

export const ch2S27: Subsection[] = [
        {
          id: 's2.7.1',
          title: 'TCP/UDP 套接字',
          knowledge: [
            {
              id: 'k2.7.1',
              title: 'Socket API 概念',
              en: 'Socket API',
              summary:
                '套接字是主机本地、由应用创建、由操作系统控制的一扇“门”，应用进程借它收发消息；Socket API 提供不可靠数据报与可靠字节流两类服务。',
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
                  '套接字是主机本地（host-local）的、应用创建的、由操作系统控制的接口，即一扇“门”：' +
                  '应用进程通过它向另一个应用进程发送消息，也从它接收消息。' +
                  'Socket API 提供两种传输服务：' +
                  '**不可靠数据报（unreliable datagram）**与可靠的、面向字节流的（reliable, byte stream-oriented）传输。',
                mechanism:
                  'PPT 第 109 页画出了职责划分：**套接字由应用开发者控制**；' +
                  '套接字之下的 TCP（含缓冲区与状态变量）由操作系统控制。' +
                  '应用面对的是一个流（stream）抽象：TCP 提供“从一个进程到另一个进程的可靠字节传输”，' +
                  '应用只需读写字节，不必关心分包、重组和丢包重传。',
                comparison:
                  '可靠字节流（TCP）保证不丢、不重、不乱序，但**不保留消息边界**：' +
                  '一次 send 可能被拆成多次 recv，应用必须自己定义消息边界。' +
                  '不可靠数据报（UDP）保留消息边界（一次 send 对应一个数据报），' +
                  '但可能丢失、乱序，也可能收到超过缓冲区长度的截断数据报。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '==Socket API== 是应用层程序访问网络的方式（PPT 第 108 页）。' +
                    '套接字由应用显式创建、使用与释放（explicitly created, used, released by apps），' +
                    '采用客户-服务器范式。Socket API 提供两类传输服务：' +
                    '不可靠数据报，以及可靠的、面向字节流的传输。',
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
                    'TCP 是**字节流**，不是消息流：' +
                    '应用连续发送两条消息时，接收方的一次 read 可能只读到半条，也可能一次读出两条。' +
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
                  type: 'p',
                  text:
                    '408 联系：在 Unix 类系统中，套接字在进程里以文件描述符（整数编号）的形式出现，因此也能用 read / write 读写它，这与操作系统中“进程通过文件描述符访问资源”的思路一致。' +
                    '但它不是普通磁盘文件，还需要 bind、listen、accept 等网络操作。',
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
                '服务器必须先运行并创建监听套接字；客户端创建套接字并指定服务器 IP 与端口发起连接；服务器 accept 后为每个客户端创建独立的连接套接字，靠源端口区分客户端。',
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
                  '服务器进程必须先运行，并先创建一个欢迎客户端连接的套接字（door）。' +
                  '客户端创建本地 TCP 套接字，并指定服务器进程的 IP 地址与端口号来联系服务器；' +
                  '当客户端创建套接字时，**客户端的 TCP 就与服务器的 TCP 建立了连接**。',
                mechanism:
                  '服务器被联系时，服务器的 TCP 为服务器进程创建一个新套接字，使服务器能同时与多个客户端对话。' +
                  '区分不同客户端靠的是源端口号（source port number）。' +
                  'TCP 向应用提供**可靠、有序的字节传输（“管道 pipe”）**，这是应用开发者看到的服务。',
                comparison:
                  '服务器的两个套接字：**监听套接字（serverSocket）**永远打开、只负责 accept；' +
                  '**连接套接字（connectionSocket）**每次 accept 产生一个、专门服务一个客户端、用完关闭。' +
                  '这是“单线程/多线程/事件驱动”三种服务器实现方式的共同基础。',
              },
              blocks: [
                { type: 'h', text: '一、服务器先就位，客户端再联系（PPT 第 110 页）' },
                {
                  type: 'list',
                  items: [
                    '**服务器进程必须先运行**（server process must first be running）',
                    '服务器必须**已经创建好套接字（门）**来欢迎客户端的连接',
                    '客户端通过两步联系服务器：① **创建客户端本地的 TCP 套接字**；' +
                    '② **指定服务器进程的 IP 地址与端口号**',
                    '当客户端创建套接字时，**客户端的 TCP 就与服务器的 TCP 建立了连接**',
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
                  type: 'p',
                  text:
                    '类比：监听套接字像一直开着的服务台，负责让新客户排队；accept() 相当于叫号，叫到一位就为他单独开一个窗口（连接套接字）。' +
                    '边界：排队实际发生在操作系统的监听队列（backlog）中，窗口何时关闭由应用自己决定。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '**服务器两把钥匙**：一把（==监听套接字==）负责“等人来”，另一把（连接套接字）负责“和人谈”。',
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
                { type: 'h', text: '五、Java 客户端与服务器示例（PPT 第 115、116 页）' },
                {
                  type: 'p',
                  text:
                    'PPT 第 115、116 页给出了 Java 版的客户端与服务器代码。Java 把套接字抽象为流，代码因此很直观：',
                },
                {
                  type: 'list',
                  items: [
                    '客户端：用 `Socket socket = new Socket(hostid, port)` 建立连接，再用 `PrintWriter outToServer` 与 `BufferedReader inFromServer` 读写',
                    '服务器：用 `ServerSocket` 监听端口，调用 `accept()` 得到 `Socket connectionSocket`，再包装成流进行通信',
                  ],
                },
                {
                  type: 'figure',
                  alt: 'Java TCP 客户端与服务器的核心代码结构',
                  caption: 'PPT 第 115、116 页：Example client/server (TCP)',
                  ascii:
                    '// —— 客户端（PPT 115）——\nSocket socket = new Socket(hostid, port);\nPrintWriter outToServer = new PrintWriter(socket.getOutputStream(), true);\nBufferedReader inFromServer = new BufferedReader(new InputStreamReader(socket.getInputStream()));\n// 读标准输入 → outToServer → 读 inFromServer → 打印\n\n// —— 服务器（PPT 116）——\nServerSocket serverSocket = new ServerSocket(port);\n// 一直保留，持续监听新客户；监听队列可排队多个待处理连接\nwhile (true) {\n  Socket connectionSocket = serverSocket.accept();   // 阻塞调用：\n  // 服务器停在这里，直到收到客户端的 TCP 连接请求\n  // 读 connectionSocket → 处理（如转大写）→ 写回 connectionSocket\n  // 1024 字节数据\n}',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：Java TCP 的四个关键 API',
                  text:
                    '`new Socket(host, port)` —— 客户端连接（内部完成三次握手）。' +
                    '`new ServerSocket(port)` —— 服务器监听（默认 backlog 通常为 50）。' +
                    '`serverSocket.accept()` —— 阻塞调用，返回与该客户端通信的 `Socket`（即 connectionSocket）。' +
                    '`socket.getInputStream()` / `getOutputStream()` —— 取得输入/输出流。' +
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
                  type: 'p',
                  text:
                    '408 联系：`accept()` 的阻塞对应操作系统中的进程阻塞与唤醒——进程进入等待队列，连接到达后由内核唤醒；' +
                    '因此多线程服务器还要处理线程同步与共享资源。',
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
                  'UDP 在客户与服务器之间没有连接，也没有握手（no handshaking）。' +
                  '发送方把目的 IP 地址与端口显式附加到每个分组上；' +
                  '服务器则必须从收到的分组中提取发送方的 IP 地址与端口，才能回复。' +
                  '从应用视角看，**UDP 提供的是不可靠的数据报（datagram）传输**：数据可能乱序到达或丢失。',
                mechanism:
                  '服务器创建绑定到端口的 `DatagramSocket`，调用 `receive()` 收到一个 `DatagramPacket`，' +
                  '从中读出数据、源 IP 与源端口。' +
                  '回复时构造新的 `DatagramPacket`，**显式填入客户端的 IP 与端口**，再调用 `send()`。' +
                  '客户端同理：创建 `DatagramSocket`，把数据装入 `DatagramPacket`，填入服务器地址后发送。',
                comparison:
                  'UDP 与 TCP 编程的三个关键差异：' +
                  '① 无连接：不需要 connect / accept，也就没有握手时延；' +
                  '② **必须显式指定对方地址**：UDP 的 send 需要提供目的 IP 与端口；' +
                  '③ **需自行处理丢包与乱序**：应用层可能要加序号、校验、超时重传等机制。',
              },
              blocks: [
                { type: 'h', text: '一、UDP 的主要特点（PPT 第 118 页）' },
                {
                  type: 'list',
                  items: [
                    'UDP 在客户与服务器之间**没有“连接”**',
                    '==没有握手（no handshaking）==',
                    '发送方要**显式附加目的 IP 与端口**到每个分组上',
                    '服务器必须从收到的分组中**提取发送方的 IP 地址与端口**（以便回复）',
                    'UDP 传输的数据**可能乱序到达，或丢失**',
                    '应用视角：UDP 提供**不可靠的数据报（datagram）传输**',
                  ],
                },
                {
                  type: 'p',
                  text:
                    '类比：UDP 像寄明信片——每张都要自己写清收件地址，投递后不确认对方收到，也不保证几张卡片按顺序到达。' +
                    '边界：现实中无法投递的信件可能被退回，UDP 不会通知发送方；需要可靠时只能由应用自己补确认与重传。',
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
                    'Java 里区分得最清楚：' +
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
                  text: '服务器的处理流程如下：',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '创建 `DatagramSocket` 并绑定端口',
                    '循环调用 `receive()`，从 `DatagramPacket` 中取出**数据**与**客户端地址**',
                    '处理请求',
                    '构造回复数据报，**填入客户端地址**，再调用 `send()`',
                  ],
                },
                {
                  type: 'p',
                  text:
                    '与 TCP 服务器最大的不同是：**不需要 accept，也不需要为每个客户端单独开线程**。' +
                    '因为 UDP 是无连接的，任何人往那个端口发包都会被处理。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：UDP 服务器要防“地址欺骗”与放大',
                  text:
                    '服务器直接从数据报中读取发送方地址并回信，因此**攻击者可以伪造源 IP**（即 IP spoofing），' +
                    '让服务器把回复发给无辜的第三方。这正是 k2.5.9 中“DNS 反射放大攻击”的原理。' +
                    '因此生产环境的 UDP 服务器通常会做**源地址验证**，并限制速率。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：UDP 上的可靠性可以自己做',
                  text:
                    '如果应用既要 UDP 的低时延，又需要一定的可靠性，有两条路：' +
                    '一是在应用层自己加**序号、校验、超时重传与确认**（类似 TCP，但更轻量）；' +
                    '二是直接采用 **QUIC**（HTTP/3 的基础，RFC 9000）。' +
                    'QUIC 在 UDP 之上实现了可靠字节流与多路复用，既拿到了 UDP 的无握手优势，又避免了 TCP 的队头阻塞。',
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
                  '为什么要专门讲“简易 Web 服务器”？因为它把前面的内容**串成一条可运行的链路**：' +
                  '套接字（k2.7.1）、HTTP 报文格式（k2.2.5、k2.2.6）、持续连接（k2.2.3）和响应时间模型（k2.2.4）。' +
                  '亲手写一个能返回网页的服务器，是把“协议”从纸面变成“可执行”的最佳方式。',
                coreIdea:
                  '简易 Web 服务器**只处理一个 HTTP 请求**（handles one HTTP request），依次完成五步：' +
                  '接受请求（accepts the request）、解析首部（parses header）、' +
                  '从服务器的文件系统中取得所请求的文件（obtains requested file from server’s file system）、' +
                  '创建 HTTP 响应报文：首部行 + 文件（header lines + file），最后把响应发送给客户端（sends response to client）。' +
                  '创建好服务器后，就可以用浏览器请求文件（PPT 以 IE Explorer 为例，现代浏览器同样适用）。',
                mechanism:
                  '实现要点：' +
                  '① 用 `ServerSocket` 监听 80 端口，`accept()` 拿到客户端连接；' +
                  '② 从流中**读出请求行**（如 `GET /index.html HTTP/1.1`）与首部行，' +
                  '解析出所请求的 URL/文件名；' +
                  '③ 用 `File` 打开服务器本地文件系统中的该文件，读取内容（文件不存在则返回 **404**）；' +
                  '④ 拼装响应：`HTTP/1.1 200 OK\\r\\n` + `Content-Type: ...\\r\\n` + `Content-Length: ...\\r\\n` + `\\r\\n` + 文件内容；' +
                  '⑤ 写回套接字并关闭连接。',
                comparison:
                  '与真实生产 Web 服务器（如 Apache、Nginx）相比，简易版缺少：' +
                  '持久连接与流水线处理、并发处理、缓存、虚拟主机、目录列表、范围请求、断点续传、压缩等。' +
                  '但它的**骨架与真实服务器完全一致**——这正是它的教学价值。',
              },
              blocks: [
                {
                  type: 'p',
                  text:
                    '构建简易 Web 服务器（PPT 第 123 页）是本章的综合实践。它==只处理一个 HTTP 请求==，流程如下：',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '接受请求（accepts the request）：调用 `accept()` 接受客户端的 TCP 连接',
                    '解析首部（parses header）：从请求行与首部行中解析出方法、URL、版本',
                    '从服务器的文件系统中取得所请求的文件（obtains requested file from server’s file system）',
                    '创建 HTTP 响应报文：首部行 + 文件（creates HTTP response message: header lines + file）',
                    '把响应发送给客户端（sends response to client）',
                    '创建好服务器之后，就可以用浏览器请求文件（PPT 以 IE Explorer 为例，现代浏览器同样适用）',
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
                    '五步依次是：接受请求、解析首部、取得文件、生成响应、发送响应。' +
                    '注意第 ④ 步的响应报文是“首部行 + 文件”，它对应 k2.2.6 中的“状态行 + 首部行 + 实体主体”——' +
                    '**“首部行 + 文件”就是状态行、首部行与实体主体的合称**。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：响应报文的三个必写内容',
                  text:
                    '① Content-Type：告诉浏览器如何渲染（text/html、image/jpeg…）；' +
                    '② Content-Length：告诉浏览器正文有多少字节，浏览器据此判断何时读完；' +
                    '③ **首部行之后必须有一个空行（\\r\\n\\r\\n）**，否则浏览器会把文件内容当成首部行而一直等待。' +
                    '另外，文件不存在时应返回 **404 Not Found**，而不是直接断开连接。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：这个练习把整章串起来了',
                  text:
                    '写这个服务器需要用到：k2.7.2 的 TCP 套接字（ServerSocket / accept / 流）；' +
                    'k2.2.5 的请求报文格式（请求行与首部行的解析）；' +
                    'k2.2.6 的响应报文格式（状态行 + 首部行 + 实体主体）；' +
                    'k2.2.3 的连接管理（一次请求后关闭连接还是保持）；' +
                    '以及 k2.2.4 的响应时间模型（为什么打开一个网页要等 2 RTT）。' +
                    '**写完它，HTTP 报文就不再只是纸面格式。**',
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
]
