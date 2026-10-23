import type { ChapterSummary } from '../../types/content'

export const ch2Summary: ChapterSummary = {
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
          ['2.2 Web 与 HTTP', 'HTTP 基础', '网页怎么取、连接怎么开', 'URL、非持续/持续、流水线、$2\\,\\text{RTT}+T$'],
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
          '三条线索贯穿全章：',
      },
      {
        type: 'list',
        items: [
          '**分层线索**：应用层只关心消息语义，可靠性、时延与带宽交给传输层。',
          '**服务模型线索**：pull（HTTP、DNS 客户端侧）vs push（SMTP），以及 C/S vs P2P。',
          '**性能线索**：$\\text{RTT}$ 与传输时间决定用户体验，典型例子是 $2\\,\\text{RTT}+T$、缓存利用率与 DNS 委派。',
        ],
      },
    ],
    background: [
      {
        type: 'p',
        text:
          '本章每项技术都对应一个当时无法用现有手段解决的问题。',
      },
      {
        type: 'list',
        items: [
          '**应用层独立成层（k2.1.1）**：如果每种新应用都要改造网络核心，应用创新将被彻底扼杀。因此端系统承担应用逻辑，网络核心只搬运比特。',
          '**客户-服务器与 P2P（k2.1.2）**：服务器农场极其昂贵（单数据中心约 6 亿美元、50~100 兆瓦），服务器带宽成为分发瓶颈，于是有了让用户互相传文件的 P2P 思路。',
          '**TCP 与 UDP 并存（k2.1.6）**：实时音视频不能容忍重传带来的长时延，却能容忍丢包；文件传输正好相反。一套服务模型无法同时满足，于是分成“可靠有序”与“不可靠但快”两种。',
          '**HTTP 无状态（k2.2.2）**：服务器保存每个客户端的历史会造成状态不一致、崩溃难恢复、集群难扩展。于是把状态搬到客户端，用 Cookie 携带。',
          '**持久连接与流水线（k2.2.3）**：每个对象都要重新三次握手，代价 1 个 $\\text{RTT}$；页面有 11 个对象就是 11 次握手。改进方向是复用连接。',
          '**Web 缓存与条件 GET（k2.2.8、k2.2.9）**：接入链路只有 $1.54\\,\\text{Mbps}$ 却要承载 $1.50\\,\\text{Mbps}$ 的数据，利用率约 $97\\%$（PPT 记 $99\\%$）会导致排队时延暴涨。缓存用存储换带宽，条件 GET 用“只问变没变”换带宽。',
          '**FTP 的双连接（k2.3.1）**：文件传输可能持续很久，控制命令必须随时能被响应，因此数据与控制必须分开。',
          '**SMTP 与 MIME（k2.4.2、k2.4.3）**：邮件要求离线暂存，因此需要“推送 + 消息队列”；SMTP 又限定 7 位 ASCII，因此需要 MIME 来携带二进制与多媒体。',
          '**POP3 与 IMAP（k2.4.4）**：POP3 简单但换设备就丢历史；IMAP 把邮件留在服务器并保存用户状态，代价是更依赖网络。',
          '**分布式层次 DNS（k2.5.1、k2.5.3）**：集中式名字库有单点故障、流量、距离、维护四大问题；层次化 + 委派 + 缓存是唯一可行的答案。',
          '**P2P 分发与 BitTorrent（k2.6.1、k2.6.2）**：C/S 的分发时间随 $N$ 无界增长；BitTorrent 用分块、rarest first 与 tit-for-tat 让 P2P 的分发时间收敛到上界 $F/u$。',
        ],
      },
    ],
    mechanisms: [
      {
        type: 'p',
        text:
          '本章各协议的核心机制速览。PPT 第 124 页把本章概括为六步：应用体系结构、应用服务需求、互联网传输服务模型、具体协议、P2P、Socket 编程。',
      },
      {
        type: 'table',
        headers: ['协议/机制', '关键设计', '典型细节'],
        rows: [
          ['HTTP', '请求/响应、ASCII 文本、无状态', '请求行（方法+URL+版本）、首部行、实体主体；CRLF CRLF 结束首部'],
          ['HTTP 连接方式', '非持续 / 持续无流水线 / 持续有流水线', '11 个对象分别对应 22 / 12 / 2 个 $\\text{RTT}$'],
          ['Cookie', '响应 Set-Cookie + 请求 Cookie + 本地文件 + 后端数据库', '第一方 vs 第三方 Cookie；第三方可跨站跟踪'],
          ['Web 缓存', '代理服务器同时充当客户与服务器', '命中即返回；未命中则代表客户端去源站取'],
          ['条件 GET', '`If-modified-since` + `Last-Modified`（或 `If-None-Match` + `ETag`）', '未修改返回 304，只回首部不带实体'],
          ['FTP', '控制连接(21) + 数据连接(20)，带外控制', '命令 USER/PASS/LIST/RETR/STOR；返回码 331/125/425/452'],
          ['SMTP', '持久连接、端口 25、三阶段', 'HELO→MAIL FROM→RCPT TO→DATA→"."→QUIT'],
          ['MIME', '在首部加 MIME-Version/Content-Type/Content-Transfer-Encoding', '五大类型 text/image/audio/video/application；multipart 用 boundary 分隔'],
          ['POP3 / IMAP', 'POP3 下载即删、跨会话无状态；IMAP 邮件留服务器、保留文件夹状态', 'POP3：user/pass 授权，list/retr/dele/quit 事务'],
          ['DNS', '分布式层次数据库 + 委派 + 缓存', '根 → TLD → 权威；本地 DNS 对客户端递归、对层次迭代'],
          ['DNS 记录', '$\\text{RR} = (\\text{Name}, \\text{Value}, \\text{Type}, \\text{TTL})$', 'A=主机名→IP；NS=域→权威服务器；CNAME=别名→规范名；MX=邮件别名→邮件服务器'],
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
          '两个 $\\text{RTT}$ 分别是：建立 TCP 连接 1 个 $\\text{RTT}$ + 请求与首字节返回 1 个 $\\text{RTT}$。',
          '持续连接可省去后续请求的握手 $\\text{RTT}$；流水线可让多个对象的传输时间重叠。',
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
          '**装本地缓存（$h = 0.4$）**：$U = 0.6\\times1.50/1.54 = 0.58$，时延 = $0.6\\times2 + 0.4\\times\\approx0 \\approx 1.2$ 秒',
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
        title: 'P2P 分发例题（条件：$F/u = 1$ 小时，$u_s = 10u$，$d_{min} \\ge u_s$）',
        steps: [
          '$F/u_s = F/(10u) = 0.1$ 小时；$F/d_{min} \\le F/u_s = 0.1$ 小时 → 这两项不是瓶颈',
          'C/S：$D_{c-s} = NF/u_s = N/10$ 小时，**随 $N$ 无界增长**',
          'P2P（设所有对等端上传速率均为 $u$）：第三项 $= NF/(u_s+Nu) = 3600N/(N+10)$ 秒',
          '$N \\to \\infty$ 时 P2P $\\to 3600$ s = 1 小时，**有上界**；C/S $\\to \\infty$',
        ],
        answer: 'P2P 的分发时间收敛到 1 小时，C/S 随 $N$ 无限增长——这就是 P2P 架构在大规模分发中的根本优势。',
      },
      {
        type: 'callout',
        tone: 'warning',
        title: '公式勘误提醒',
        text:
          'PPT 第 100/101 页的分发时间公式存在排版问题：' +
          '$D_{c-s}$ 与 $D_{P2P}$ 的公式中，$>$ 应为 $=$；' +
          'P2P 式第三项分母 $u_s + \\sum u_i$ 应为 $u_s + \\sum_{i=1}^{N} u_i$（求和范围 $i = 1$ 到 $N$）。' +
          '正确的 P2P 公式为 $D_{P2P}=\\max\\{F/u_s,\\ F/d_{min},\\ NF/(u_s+\\sum_{i=1}^{N}u_i)\\}$。',
      },
    ],
    examPoints: [
      {
        type: 'list',
        items: [
          '**PPT 第 18 页传输服务需求表**：文件传输、邮件、Web、即时消息不能丢；实时音视频、存储音视频、交互式游戏可容忍丢失。',
          '同一张表还要求：实时音视频与交互式游戏时延敏感（数百毫秒），存储音视频时延要求几秒。',
          '**PPT 第 21 页应用-传输协议对应表**：SMTP/Telnet/HTTP/FTP 用 TCP；流媒体用 TCP 或 UDP；互联网电话通常用 UDP。',
          '**HTTP 方法表**（k2.2.5）：GET 读取、POST 添加信息、HEAD 读取首部、PUT 存储文档、DELETE 删除、TRACE 环回测试、CONNECT 代理、OPTION 选项信息。',
          '**HTTP 状态码**（k2.2.6）：200 OK、301 Moved Permanently、400 Bad Request、404 Not Found、505 HTTP Version Not Supported。',
          '**FTP 命令与返回码**（k2.3.1）：USER/PASS/LIST/RETR/STOR；331（要密码）、125（数据连接已开）、425（打不开数据连接）、452（写文件出错）。',
          '**SMTP 会话**（k2.4.2）：HELO → MAIL FROM → RCPT TO → DATA → "." → QUIT；响应为三位状态码 + 短语。',
          '**push vs pull**（k2.4.2）：HTTP 是 pull，SMTP 是 push；HTTP 每个对象一个响应报文，SMTP 多个对象可放一个 multipart 报文。',
          '**DNS 迭代 vs 递归**（k2.5.5）：客户端→本地 DNS 用递归，本地 DNS→根/TLD/权威用迭代。',
          '**BitTorrent 四个数字**（k2.6.2）：256 Kb 分块、前 4 名、每 10 秒重估、每 30 秒随机乐观解阻。',
          '**P2P 分发时间公式**（k2.6.1）：$D_{c-s}$ 与 $D_{P2P}$ 及其推导。',
          '**Cookie 四个组成部分**（k2.2.7）：响应首部、请求首部、用户主机上的 cookie 文件、Web 站点后端数据库。',
        ],
      },
      {
        type: 'callout',
        tone: 'exam',
        title: '两道 10 分大题（PPT 第 93、94 页）',
        text:
          'PPT 第 93 页（10 分）：列举 DNS 资源记录四种类型并简述含义。A（Name 是主机名，Value 是 IP 地址，3 分）、NS（Name 是域，Value 是该域权威 DNS 服务器主机名，3 分）、CNAME（Name 是主机别名，Value 是主机规范名，2 分）、MX（Name 是邮件服务器别名，Value 是邮件服务器规范名，2 分）。' +
          'PPT 第 94 页（10 分）：注册公司域名需要做哪些配置。① 分配网络标识：与 ISP 签约取得 IP 地址范围（2 分）；② 配置基本与辅助两台权威 DNS 服务器，存放所有机器的域名与 IP 映射，Web 站点的 A 记录输入其中（2+2 分）；③ 向注册机构提供基本、辅助权威 DNS 服务器的名字与 IP（2 分）；④ 注册机构在顶级域 DNS 服务器中为每个权威服务器写入一条 NS 和一条 A 记录（2 分）。',
      },
      {
        type: 'callout',
        tone: 'exam',
        title: '响应时间与缓存例题的必背数字',
        text:
          'HTTP 响应时间 $2\\,\\text{RTT}+T$（k2.2.4）：三段分别是握手 1 个 $\\text{RTT}$、请求响应 1 个 $\\text{RTT}$、传输时间 $L/R$。' +
          'Web 缓存例题三组数字（k2.2.8）：99%（严格 97%）/ 9.9% / 0.58；时延 2 秒 + 分钟 / ≈2 秒 / ≈1.2 秒。',
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
          ['根服务器 vs 顶级域服务器 vs 权威服务器', '根 = 指路到 TLD；TLD = 指路到权威；权威 = 给最终答案（$\\text{AA}=1$）。'],
          ['迭代查询 vs 递归查询', '迭代 = 被问者只给线索，**查询者**继续问；递归 = 被问者**替查询者**问到底。'],
          ['本地名称服务器 vs 权威服务器', '本地服务器是**层次之外**的代理与缓存；权威服务器是**数据的源**。'],
          ['第一方 Cookie vs 第三方 Cookie', '看**谁提供了你当前看的页面**，不是看谁设置的 Cookie。'],
          ['POP3 vs IMAP', 'POP3 下载即删、跨会话无状态、换设备读不到旧信；IMAP 邮件留服务器、支持文件夹、跨会话保留状态。'],
          ['C/S 分发 vs P2P 分发', 'C/S 瓶颈在服务器（$NF/u_s$）；P2P 瓶颈在聚合能力（$NF/(u_s+\\sum u_i)$）。两者都随 $N$ 线性增长，但 P2P 有上界。'],
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
          '**“HTTP 1.1: RFC 2068”** —— **错误**。HTTP/1.1 的正式标准是 RFC 2616（1999，已于 2022 年被 RFC 9110 / RFC 9112 取代）；RFC 2068（1997）是早期的 Proposed Standard，已被 RFC 2616 取代。（PPT 第 24、21 页）',
          '**“HTTP 1.1: RFC 2616”** —— 版本号本身没错，但**已不是现行标准**；现行是 RFC 9110（语义）+ RFC 9112（HTTP/1.1），另有 HTTP/2（RFC 7540）与 HTTP/3（RFC 9114）。',
          '**“MIME: RFC 2045, 2056”** —— **2056 应为 2046**（MIME Part Two：多部分媒体类型）；RFC 822 也已被 RFC 5322 取代。（PPT 第 72、71 页）',
          '**“SMTP [RFC 2821]”** —— 属实但已过时，现行为 RFC 5321；IMAP [RFC 1730] 为 1994 年初版，现行为 RFC 3501 / RFC 9051。（PPT 第 66、75 页）',
          '**“IP 地址足以标识一个进程”** —— **错误**。主机 IP 只有 32 位且一台主机可运行多个进程，必须用 IP 地址 + 端口号共同标识。',
          '**“HTTP 无状态 = 每次都要重新建连”** —— **错误**。无状态说的是应用层不保存历史，HTTP/1.1 默认使用持久连接。',
          '**“GET 是安全的，GET 不会改变服务器状态”** —— GET 语义上应当是安全的，但并非必然：不恰当的应用可以违反该约定。规范说法是“GET 应当是安全方法”。',
          '**“第三方 Cookie = 不安全的 Cookie”** —— **错误**。第一方/第三方描述的是来源站点与用户主动访问站点的关系，与安全性无关。',
          '**“DNS 根服务器掌握全网所有域名”** —— **错误**。根服务器只保存顶级域的指路信息，不保存任何具体主机地址。',
          '**“DNS 轰炸根服务器一直是主要威胁”** —— **不准确**。本地 DNS 缓存了 TLD 的 IP，可绕过根直轰 TLD，而 TLD 服务器数量远少于根服务器，潜在更危险。',
          '**“BitTorrent 是纯 P2P，所以没有服务器”** —— **不准确**。BitTorrent 使用 tracker 交换对等端列表；它只是不提供文件内容、不构成带宽瓶颈，因此不破坏自扩展性。',
          '**“SMTP 是用户发邮件用的协议”** —— **不完整**。SMTP 只负责服务器之间的投递；用户代理与服务器之间用的是 POP3/IMAP/HTTP。',
        ],
      },
      {
        type: 'callout',
        tone: 'warning',
        title: '计算题的两个陷阱',
        text:
          '“P2P 一定比 C/S 快”是错误的：$N$ 很小时 C/S 反而更快，P2P 要经过多跳转发，分界点在两边公式的交叉处。' +
          '“装了缓存后接入链路利用率是 $1.50/1.54$”也是错误的：有缓存时应按命中后的实际流量计算，$0.6\\times1.50/1.54 = 0.58$。',
      },
      {
        type: 'callout',
        tone: 'warning',
        title: 'TCP 的两个常见误解',
        text:
          '“TCP 可靠，所以实时视频应该用 TCP”是错误的：TCP 的可靠性以可变时延为代价，重传会让数据迟到几百毫秒，对实时语音毫无意义。' +
          '“TCP 有消息边界”也是错误的：TCP 是字节流，一次 send 可能被拆成多次 recv，应用必须自己定义消息边界。',
      },
    ],
    connections: [
      {
        type: 'list',
        items: [
          '**与第一章（导论）**：五层协议栈与封装（s1.5）解释了应用层消息如何被逐层加首部；时延与吞吐（s1.4）提供了 $\\text{RTT}$、$L/R$ 的定义，本章的响应时间模型直接建立在它之上；网络安全（s1.6）的 DNS 投毒与反射放大攻击在本章 k2.5.9 有对应内容。',
          '**与第三章（传输层）**：本章说“应用要求可靠传输/低时延”，第三章回答 TCP 如何做到——三次握手（s3.5.10）对应本章的 1 个 $\\text{RTT}$ 握手；端口号分用（s3.2）对应 k2.1.3 的“IP + 端口定位进程”；拥塞控制（s3.7）解释 k2.2.8 中接入链路利用率逼近 1 时排队时延暴涨的现象。',
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
          '**响应时间**：**一握手、一问答、一传输 = $2\\,\\text{RTT}+L/R$**。',
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
          '③ **然后练计算**：$2\\,\\text{RTT}+T$（k2.2.4）与两个分发时间公式（k2.6.1）必须能独立推导。' +
          '④ **最后串链路**：默写 PPT 第 26 页的 8 个事件，把 DNS → TCP → HTTP 串起来。' +
          '⑤ **动手实验**：用 telnet 手敲 HTTP 请求与 SMTP 会话，用 nslookup 逐层查询 DNS，' +
          '再动手写一个简易 Web 服务器——**这三个实验做完，本章就真的会了**。',
      },
    ],
}
