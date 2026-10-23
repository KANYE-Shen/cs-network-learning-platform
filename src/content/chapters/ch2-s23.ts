import type { Subsection } from '../../types/content'

export const ch2S23: Subsection[] = [
        {
          id: 's2.3.1',
          title: '文件传输协议',
          knowledge: [
            {
              id: 'k2.3.1',
              figureIds: ['f2.3.1-ftp'],
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
                    '它采用**客户-服务器模型**：客户发起传输（可上传也可下载），服务器是远程主机。' +
                    '控制连接使用服务器的 21 端口，数据连接使用 20 端口；控制与数据分离，称为==带外控制（out-of-band control）==。',
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
]
