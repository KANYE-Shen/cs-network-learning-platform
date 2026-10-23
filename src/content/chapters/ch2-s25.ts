import type { Subsection } from '../../types/content'

export const ch2S25: Subsection[] = [
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
                  'PPT 第 79 页给出四条硬伤——**单点故障、流量、距离、维护**：' +
                  '单点故障（single point of failure）指中央服务器宕机，整个互联网失去名字解析；' +
                  '流量（traffic）指全球查询都打到一处，带宽与处理能力无法承受；' +
                  '距离（Distant）指物理距离决定 RTT，地球另一端的用户查询延迟极大；' +
                  '维护（Maintenance）指一份巨大的目录难以保持同步与更新。',
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
                    '层次化也有代价：解析一个名字可能要跨多层。' +
                    '因此需要**缓存**与**本地名称服务器**（就近代理）把性能拉回可接受水平，这正是 k2.5.4 与 k2.5.5 要解决的问题。',
                },
                {
                  type: 'p',
                  text:
                    '408 联系：DNS 的层次结构可以看作一棵**树**（数据结构中的树）。查询沿“根 → 下级节点”逐层下行，缓存相当于在中间节点记住已经走过的路径。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：DNS 的标准文档',
                  text:
                    'DNS 核心标准是 RFC 1034（域名系统概念与设施）与 RFC 1035（实现与规范）；' +
                    '现行补充标准包括 RFC 6891（EDNS(0)，DNS 扩展机制）、' +
                    'RFC 8499（DNS 术语）等。DNS 通常使用 **UDP 53 端口**，' +
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
                  '① 主机名到 IP 地址的转换（hostname to IP address translation）；' +
                  '② 主机别名（host aliasing）：规范名（canonical name）与别名（alias）；' +
                  '③ 邮件服务器别名（mail server aliasing）；' +
                  '④ 负载分配（load distribution）：复制的 Web 服务器，一个规范名对应一组 IP 地址。',
                mechanism:
                  '这四项服务分别由四类资源记录支撑（这正是 k2.5.6 的考点）：' +
                  'A 记录 = 主机名 → IP；NS 记录 = 域 → 权威 DNS 服务器主机名；' +
                  'CNAME 记录 = 别名 → 规范名；MX 记录 = 邮件服务器别名 → 邮件服务器规范名。',
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
                    '**关于主机别名**：一个主机可能有很多名字（如 www.ibm.com、www.ibm.com.cn 等 IBM 的营销域名），' +
                    '但 DNS 记录从规范名（canonical name）出发。' +
                    'CNAME 记录的 Name 字段是别名，Value 字段是规范名；' +
                    '客户端解析别名时会继续追踪 CNAME，直到拿到 A 记录。',
                },
                {
                  type: 'p',
                  text:
                    '**关于邮件服务器别名**：邮件投递时先查该域的 MX 记录，' +
                    '得到邮件服务器的规范名，再查该名字的 A 记录得到 IP。' +
                    'MX 记录还带有优先级（preference）参数：多个 MX 时优先投递优先级数值小者。',
                },
                {
                  type: 'p',
                  text:
                    '**关于负载分配**：把同一个规范名（例如 www.example.com）配置多个 A 记录，' +
                    '指向一组内容相同的 Web 服务器（replicated Web servers）。' +
                    'DNS 服务器会轮转返回这几个 IP，客户端每次解析可能拿到不同的 IP，' +
                    '从而把负载分散到多台机器上。这就是最简单的 DNS 轮询负载均衡。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：四种服务 ↔ 四类 RR 一一对应',
                  text:
                    '这是本章最核心的对应关系，PPT 第 93 页的 10 分考题正是考它：' +
                    '**主机名→IP = A；域→权威服务器 = NS；别名→规范名 = CNAME；邮件别名→邮件服务器 = MX。**' +
                    '注意别把 NS 与 CNAME 记混：NS 的 Name 是域（如 com、sina.com），' +
                    'CNAME 的 Name 是主机别名（如 www.ibm.com）。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：现代 DNS 还提供更多能力',
                  text:
                    '除了上述四项，DNS 还被广泛用于：' +
                    'SRV 记录（服务定位，如 _sip._tcp.example.com）、' +
                    'TXT 记录（域名所有权验证、SPF 邮件防伪、DMARC）、' +
                    'CAA 记录（限定哪些 CA 可为该域签发证书）、' +
                    'DNSSEC（对解析结果做数字签名，防伪造）。',
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
                  '层次为：**根名称服务器（root name servers）→ 顶级域名称服务器（TLD servers）→ 权威名称服务器（authoritative name servers）**。' +
                  '根服务器负责引导查询获取顶级域名称服务器的域名及对应的 IP 地址。',
                mechanism:
                  'PPT 第 80 页给出了 www.sina.com 的三级解析过程：' +
                  '① 客户端向根服务器查询，根服务器告知 **.com DNS 服务器**的位置；' +
                  '② 客户端向 com DNS 服务器查询，com 服务器告知 **sina.com DNS 服务器**（权威名称服务器，安置在网站）的位置；' +
                  '③ 客户端向 sina.com 的权威服务器查询，得到 www.sina.com 的 IP 地址。',
                comparison:
                  '三类服务器的差异：' +
                  '根服务器管理根域，全世界只有 13 个逻辑标识（a~m），通过 anycast 部署在成百上千个物理地点；' +
                  '顶级域服务器管理 com、org、net、edu 以及所有国家顶级域 cn、fr、ca、jp 等；' +
                  '权威服务器由组织自己维护（或委托给服务商），提供本组织服务器的“主机名 → IP”映射。' +
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
                    '它不保存 `www.sina.com` 这类具体主机的地址。' +
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
                    '**权威（authoritative）DNS 服务器**保存本组织服务器的“主机名 → IP”映射，' +
                    '例如 Web 服务器 `news.sina.com.cn` 与邮件服务器 `mail.sina.com.cn` 各对应一条 A 记录。' +
                    '权威服务器可以由组织自己维护，也可以委托给服务提供商（如云厂商的 DNS 托管）。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：只有权威服务器能给出最终答案',
                  text:
                    '根服务器、顶级域服务器、本地名称服务器给出的都是“转介”（referral），' +
                    '只有**权威服务器**能给出**权威答案**（authoritative answer）。' +
                    'DNS 报文中有一个 AA（authoritative answer）标志位用于标识这一点，' +
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
                  '每家 ISP（居民 ISP、公司、大学）都有一个，叫“默认名称服务器”（default name server）。' +
                  '当主机发起 DNS 查询时，查询被发往它的本地名称服务器；' +
                  '本地名称服务器充当代理（acts as proxy），把查询转发进 DNS 层次结构。',
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
                    '本地名称服务器（local name server）不属于 DNS 层次结构' +
                    '（does not strictly belong to hierarchy）（PPT 第 84 页）。' +
                    '每家 ISP——无论是居民 ISP、公司还是大学——都会部署一台，' +
                    '它也称为**默认名称服务器**（default name server）。',
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
                  tone: 'warning',
                  title: '易错：本地名称服务器不在 DNS 层次中',
                  text:
                    '本地名称服务器**不属于**根—顶级域—权威这套层次结构，它是 ISP 或组织自己部署的代理。' +
                    '把它称作“根服务器”或“权威服务器”都是错的。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '本地名称服务器解决了什么问题',
                  text:
                    '① 性能：把绝大多数查询的 RTT 降到接近 0；' +
                    '② 可扩展性：根服务器与顶级域服务器只处理“第一次”或“缓存过期”的查询，流量骤降；' +
                    '③ 就近性：用户只与本地服务器通信，物理距离短。' +
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
                    '① `nslookup` 输出的第一行 Server: 202.102.128.68 就是本地名称服务器。' +
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
              figureIds: ['f2.5.5-dnstree'],
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
                  '递归把负担压给被询问的服务器，让客户端省事，但服务器负载重；' +
                  '迭代把负担还给客户端，服务器只回答“我不知道，你去问它”，但服务器负载轻。' +
                  'DNS 做了一个折中：**客户端—本地服务器用递归，本地服务器—层次结构用迭代**。',
                coreIdea:
                  '**迭代查询（iterated query）**：被联系的服务器回复“接下来该联系哪个服务器”，' +
                  '就像说“我不认识这个名字，但你可以去问这个服务器”。' +
                  '**递归查询（recursive query）**：把名字解析的全部负担放到被联系的名称服务器身上' +
                  '（heavy load——服务器负载会很重）。',
                mechanism:
                  '实际互联网的组合方式：' +
                  '① 主机 → 本地名称服务器：递归查询（本地服务器负责给出最终答案）；' +
                  '② 本地服务器 → 根服务器：迭代查询；' +
                  '③ 本地服务器 → 顶级域服务器：迭代查询；' +
                  '④ 本地服务器 → 权威服务器：迭代查询。' +
                  '这样，客户端只发一个查询（简单），而层次结构中的服务器之间不需要彼此递归（负载可控）。',
                comparison:
                  '迭代 vs 递归的根本区别是“谁继续查”：' +
                  '迭代——被问者只给线索，查询者继续问下一个；' +
                  '递归——被问者继续问直到有答案再回复你。' +
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
                    ['服务器负载', '轻（每次只回答一小段线索）', '**重（heavy load）**——每次查询都要走完整条链'],
                    ['DNS 中的用法', '本地服务器 → 根 → 顶级域 → 权威', '主机 → 本地服务器'],
                  ],
                },
                {
                  type: 'p',
                  text:
                    '类比：迭代查询像向路人问路，路人只说“去问那边的保安”，接下来都要你自己去问；递归查询像请朋友替你跑腿，他问到答案才回来告诉你。' +
                    '边界：朋友会替你走完全程，而 DNS 的本地服务器只代为转发，RD/RA 也只是协商用的标志位。',
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
                    '**第 3 跳（slide 92）**：Resolver → 权威服务器。拿到最终的 **A 记录**，Resolver 缓存这个结果，再返回给客户端',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么第 2 跳不能直接给出 IP？',
                  text:
                    '因为 .com 顶级域服务器**不保存** baidu.com 的主机记录，' +
                    '它只保存 baidu.com 的 NS 记录 + 对应的 A 记录（即“baidu.com 的权威服务器在哪”）。' +
                    '这是委派机制的直接体现：' +
                    '每一级只管自己这一段的“路标”，**数据的所有权归最下级的权威服务器**。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点：迭代查询中的三个角色',
                  text:
                    'Root 回答“顶级域服务器在哪”；' +
                    'TLD 回答“该域的权威服务器在哪”；' +
                    '权威服务器回答“这个主机名的 IP 是多少”。' +
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
                  'DNS 是存储资源记录（resource records, RR）的分布式数据库。' +
                  'RR 的格式是四元组 **(Name, Value, Type, TTL)**：' +
                  'Name 是记录所描述的名字；Value 是该名字对应的值；' +
                  'Type 说明记录是什么类型（决定 Name 与 Value 的含义）；' +
                  'TTL（Time To Live）是该记录可被缓存的秒数。',
                mechanism:
                  'Type 决定了 Name 与 Value 怎么解释，这就是“同一对 Name/Value 字符串在不同 Type 下含义完全不同”的原因。' +
                  '例如 Name = `www.sina.com`：' +
                  '若 Type = A，Value 必须是 IP 地址 `60.215.128.150`；' +
                  '若 Type = CNAME，Value 必须是另一个主机名（规范名）；' +
                  '若 Type = MX，Value 必须是邮件服务器的规范名。',
                comparison:
                  '四种基本类型（PPT 第 93 页 10 分考题）：' +
                  'A 记录把主机名映射到 IP 地址（3 分）；' +
                  'NS 记录把域指向该域中权威 DNS 服务器的主机名（3 分）；' +
                  'CNAME 记录把主机别名指向主机规范名（2 分）；' +
                  'MX 记录把邮件服务器别名指向邮件服务器规范名（2 分）。',
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
                    'RFC 1034 规定：同一条名字**不能同时拥有 CNAME 记录和其他类型的记录**。' +
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
                  '因为 DNS 要同时支持两种不同性质的消息：' +
                  '**查询（query）**只带问题，**应答（reply）**要带上答案、权威说明与附加信息。' +
                  '用同一套格式承载两者，客户端只需一套解析代码；' +
                  '用标志位区分二者，服务器只需实现一套收发逻辑。',
                coreIdea:
                  'DNS 协议有查询与应答（reply）两种消息，**两者格式相同**。' +
                  '首部（msg header）包含：' +
                  '**标识号（identification）**：16 位，查询用它编号，应答使用相同的编号来与查询匹配；' +
                  '标志（flags）：查询还是应答、是否希望递归（recursion desired）、' +
                  '是否支持递归（recursion available）、应答是否为权威（authoritative）。',
                mechanism:
                  '报文由首部加四个可选区段组成：' +
                  'Question（问题）：待查询的 Name 与 Type；' +
                  'Answer（应答）：查询的记录；' +
                  'Authority（权威）：权威服务器的记录（常放 NS 记录，即“转介”）；' +
                  'Additional（附加）：可能有用的补充信息（常放 NS 对应的 A 记录）。',
                comparison:
                  'RD 与 RA 是协商机制：' +
                  '客户端在查询中置 RD=1 表示“我希望递归，请把最终答案给我”；' +
                  '服务器用 RA=1 表示“我支持递归”。' +
                  '若两者不匹配，实际行为就退化为迭代查询——这正是 k2.5.5 中混合模式在报文层面的体现。' +
                  '**AA=1** 表示这是权威答案（来自该域的权威服务器），AA=0 表示这是转介。',
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
                    '除了 PPT 列出的四个字段，完整的 DNS 首部还包括 ' +
                    'QDCOUNT（问题数，通常为 1）、ANCOUNT（应答数）、' +
                    'NSCOUNT（权威记录数）、ARCOUNT（附加记录数），' +
                    '以及可选的 Z/AD/CD 标志（DNSSEC 认证数据、校验和、已验证数据）。',
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
                    'Question：原样回显查询的问题；' +
                    'Answer：真正的答案（A 记录等）；' +
                    'Authority：权威信息/转介（NS 记录）；' +
                    'Additional：附加信息（常为 NS 的 A 记录）。' +
                    '迭代查询时，**Answer 区常为空而 Authority 区有 NS 记录**——' +
                    '因为此时还没有真正的 IP 答案，只有“去问谁”的线索。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '16 位标识号的意义：DNS over UDP 的可靠性',
                  text:
                    'DNS 通常跑在 UDP 53 上（无连接、可能丢包、可能乱序）。' +
                    '16 位标识号让客户端能**把应答与对应的查询配对**——' +
                    '如果一个客户端同时发了多个查询（浏览器会并发查多个域名），' +
                    '就靠这个 ID 区分谁是谁。' +
                    '但 16 位只有 65536 个可能值，理论上存在 ID 碰撞与缓存投毒（Cache Poisoning）风险，' +
                    '因此现代 DNS 普遍引入 DNSSEC 与源端口随机化。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：用 dig 看清 DNS 报文结构',
                  text:
                    '执行 `dig www.tsinghua.edu.cn`，输出会被划分为五个 SECTION：' +
                    'HEADER（含 ID、flags、QDCOUNT/ANCOUNT/NSCOUNT/ARCOUNT）、' +
                    'QUESTION、ANSWER、AUTHORITY、ADDITIONAL。' +
                    'flags 一行会显示 `qr rd ra` 等缩写：' +
                    '`qr=1` 是应答，`rd=1` 客户端要求递归，`ra=1` 服务器支持递归。' +
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
                  '为什么要理解“注册一个域名要做哪些配置”？因为它把 DNS 的委派机制、' +
                  '资源记录、权威与转介的区别串成了一条完整的实践链条。' +
                  '理解了它，就理解了 DNS 是如何“长出”一个新域的。',
                coreIdea:
                  '要让互联网上的用户访问你的 Web 服务器，你必须完成四件事（PPT 第 94 页的 10 分题）：' +
                  '① 分配网络标识：与本地 ISP 签约，由 ISP 分配一个 IP 地址范围，' +
                  '你在其中为 Web 服务器与权威 DNS 服务器分配 IP；' +
                  '② 配置两台 DNS 服务器：基本（primary）与辅助（secondary）权威 DNS 服务器，' +
                  '存储公司向公网提供服务的所有机器的域名与 IP 映射；' +
                  '③ 向注册登记机构提供基本与辅助权威 DNS 服务器的名字和 IP 地址；' +
                  '④ 注册机构在顶级域 DNS 服务器中写入两条记录：' +
                  '对该域的 NS 记录 + 对权威服务器自身的 A 记录。',
                mechanism:
                  '第 ④ 步为什么需要两条记录？' +
                  '因为顶级域服务器（.com）要回答“networkutopia.com 的权威服务器在哪”，' +
                  '需要 NS 记录；而 NS 记录里存的是主机名（dns1.networkutopia.com），' +
                  '顶级域服务器还需要这个主机名的 A 记录（212.212.212.1）才能告诉别人“去这个 IP 问”。' +
                  '**NS + A 成对出现**，正是“转介”所需的最小数据集。',
                comparison:
                  '权威服务器与本地名称服务器在注册场景中的分工：' +
                  '权威服务器保存你自己域的数据（A、MX 等），由你控制；' +
                  '本地名称服务器只是缓存别人的数据，不参与注册。' +
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
                    '**（2）配置两台 DNS 服务器（2+2 分）**：部署基本（primary）与辅助（secondary）两台权威 DNS 服务器，' +
                    '存储公司向公网提供服务的所有机器的域名与 IP 映射；' +
                    '例如把 Web 服务器对应的 A 资源记录写入你的权威 DNS 服务器',
                    '**（3）向注册机构提供名字与 IP（2 分）**：注册域名时，' +
                    '需要向注册登记机构（registrar）提供基本、辅助权威 DNS 服务器的名字和 IP 地址',
                    '**（4）注册机构写入 NS 与 A 记录（2 分）**：注册机构为每个权威 DNS 服务器，' +
                    '向顶级域 DNS 服务器写入一条类型 NS 和一条类型 A 的记录',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '为什么是 NS + A 两条记录？',
                  text:
                    '顶级域（.com）服务器要当“路标”，就得知道两件事：' +
                    '① 你的权威服务器叫什么（NS 记录：networkutopia.com → dns1.networkutopia.com）；' +
                    '② 你的权威服务器在哪（A 记录：dns1.networkutopia.com → 212.212.212.1）。' +
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
                    '两台服务器互为备份，主服务器通过 AXFR/IXFR（区域传送）把区域数据同步给从服务器。' +
                    '此外两台服务器可分布在不同机房/不同运营商，避免单机房故障。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：今天还多了一步（第 1 步的延伸）',
                  text:
                    '现代实践中，第 ① 步往往还包括：' +
                    '注册商处的 DNSSEC 签名、' +
                    'NSEC/NSEC3 否定应答（防域名接管）、' +
                    '以及把权威服务器放在不同网络的 anycast 或多 CDN 供应商上。' +
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
                  '把它投毒，等于可以把全网用户引到你指定的服务器，' +
                  '既可实施中间人窃听，也可用于钓鱼与 DDoS 放大。' +
                  '因此 DNS 是**单点故障风险最高**的基础服务之一。',
                coreIdea:
                  'PPT 第 96 页把 DNS 攻击分为四类：' +
                  '① DDoS 攻击：轰炸根服务器（迄今未成功，因为根服务器有任播冗余且本地缓存扛住了大部分流量）；' +
                  '流量过滤是常用绕过手段——本地 DNS 服务器缓存了顶级域服务器的 IP，' +
                  '于是攻击流量可以绕过根服务器，直接轰炸顶级域服务器，潜在危险更大；' +
                  '② 重定向攻击 / 中间人：截获查询并改写应答；' +
                  '③ DNS 投毒：向 DNS 服务器发送伪造应答，服务器会把假记录缓存下来；' +
                  '④ 利用 DNS 发动 DDoS：伪造源地址发送查询，利用反射放大攻击目标。',
                mechanism:
                  '反射放大的原理：攻击者向大量开放的 DNS 服务器发送查询，' +
                  '**源地址伪造成受害者 IP**；DNS 服务器把**体积大得多**的应答直接发给受害者。' +
                  '因为“请求小、应答大”，流量被放大了几十倍甚至上千倍（典型的放大因子 30~70），' +
                  '攻击者用很少的带宽就打垮了受害者。',
                comparison:
                  '轰炸根 vs 轰炸顶级域：' +
                  '根服务器有 13 个逻辑标识、成百上千个 anycast 物理副本，且不保存具体主机记录、' +
                  '本地 DNS 缓存了根的转介，因此根服务器能扛住常规攻击；' +
                  '而顶级域服务器数量少得多（如 .com 只有十来个机房），' +
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
                    '① 数量与冗余：根服务器有 13 个逻辑标识，通过 anycast 部署在全球成百上千个地点；' +
                    '而 .com 的顶级域服务器只有十来个核心节点。' +
                    '② 缓存的作用：本地 DNS 服务器缓存了“根服务器在哪”的转介，' +
                    '绝大多数查询根本不接触根服务器；' +
                    '而顶级域服务器虽然也被缓存，但缓存粒度更细、条目更多，仍有相当比例的查询直达。' +
                    '③ 数据量：根服务器只保存顶级域的指路信息，单次响应极小。',
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
                    '**向 DNS 服务器发送伪造的应答（bogus replies）**，该服务器会把这些假记录缓存下来，' +
                    '随后所有向它查询的用户都会得到错误的 IP。' +
                    '这比单纯的中间人更持久——**一次投毒，污染整个缓存条目，影响大量用户**。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点：投毒 vs 中间人',
                  text:
                    '中间人攻击是每次查询都实时拦截并篡改，攻击者必须在线；' +
                    'DNS 投毒是**一次性把假记录写入缓存**，之后无需攻击者在线也持续生效。' +
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
                    '注意第 4 项是“利用 DNS 作为攻击跳板”，与第 1 项“直接攻击 DNS 服务器”性质不同。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '补充：现代防护手段',
                  text:
                    '① DNSSEC（RFC 4033~4035）：对 RR 集做数字签名，' +
                    '使解析器能验证应答真伪，杜绝投毒与篡改（但需整条链上都有签名才有效）。' +
                    '② DNS over TLS（DoT, RFC 7858）与 DNS over HTTPS（DoH, RFC 8484）：' +
                    '加密 DNS 流量，防止中间人与嗅探。' +
                    '③ 源端口随机化 + 事务 ID 随机化 + 查询名随机化（0x20 encoding）：' +
                    '提高盲猜难度。' +
                    '④ RRL（响应速率限制）、自动黑洞、Anycast 分散。' +
                    '⑤ DNS Cookies（RFC 7873）：用客户端 Cookie 验证应答确实来自被查询的服务器。',
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
]
