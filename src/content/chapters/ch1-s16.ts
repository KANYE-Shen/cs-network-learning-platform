import type { Subsection } from '../../types/content'

export const ch1S16: Subsection[] = [
        {
          id: 's1.6.1',
          title: '网络威胁',
          knowledge: [
            {
              id: 'k1.6.1',
              title: '恶意软件：病毒、蠕虫、特洛伊木马',
              en: 'Malware',
              summary:
                '病毒需依附宿主并主动执行才传播，蠕虫是能自我传播的独立程序，木马伪装成有用软件但不做感染扩散；恶意软件还会组建僵尸网络。',
              tags: ['恶意软件', '病毒', '蠕虫', '木马', '僵尸网络', '间谍软件'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [102, 103, 104] }],
              insight: {
                why: '互联网把数百万台设备连在一起，这既是它的价值，也是它的弱点：**任何一台被感染的机器都可能成为攻击的跳板**。所以"主机安全"是网络安全的起点。',
                coreIdea: '恶意软件（malware）通过互联网进入主机，主要有三种形态：病毒（virus）、蠕虫（worm）、特洛伊木马（trojan horse）。三者的核心区别是**传播方式**与**是否需要宿主**。',
                mechanism: '**病毒**是一段寄生代码，不能单独存在，必须挂在 Word 文档或程序上；打开带毒文件才会激活，并把自身复制到其他文件。它依靠“接收对象后主动执行”传播。**蠕虫**是独立完整的程序，不需要人操作，能自行利用系统漏洞扫描全网、入侵其他电脑，属于“被动接收对象后自行执行”。木马隐藏在表面有用的软件中（如今常藏在 Active-X 或网页插件里），目标是欺骗入侵、窃取控制，不做感染扩散。',
                comparison: '除了三者，PPT 还提到 **Spyware（间谍软件）**——记录击键、访问过的网站，并把信息上传到收集站点；被感染的主机还会被编入 **botnet（僵尸网络）**，用于发送垃圾邮件和发动 DDoS 攻击。Sapphire 蠕虫是经典案例：据 CAIDA 与 UWisc 的数据，它在爆发最初 5 分钟内的聚合扫描速率达到了惊人的量级。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 102 页 **"Network Security"** 先框定了这门学科的三个问题：',
                },
                {
                  type: 'list',
                  items: [
                    '**how bad guys can attack computer networks**——坏人如何攻击计算机网络；',
                    '**how we can defend networks against attacks**——我们如何防御网络免受攻击；',
                    '**how to design architectures that are immune to attacks**——如何设计对攻击免疫的体系结构。',
                  ],
                },
                {
                  type: 'p',
                  text: '课件给出一个根本性的历史判断：“Internet not originally designed with (much) security in mind”，原始愿景是“a group of mutually trusting users attached to a transparent network”（一群==互相信任==的用户接在一个透明网络上）。因此协议设计者一直在“追赶补课”（playing catch-up），结论是**安全考量必须贯穿所有层**（security considerations in all layers）。',
                },
                {
                  type: 'p',
                  text: '类比：病毒像必须寄生在宿主细胞里的生物病毒，蠕虫像能自行繁殖扩散的物种，木马则像伪装成礼物的间谍。区别在于，这组类比只对应传播方式，不代表破坏力大小。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '"互相信任"这句话解释了整个互联网的安全债',
                  text: '原始设计假设网络里的用户彼此善意，因此 IP 不做源身份认证、可以随意声明源地址（这正是 k1.6.3 的 IP 欺骗得以成功的前提）、路由器不检查分组内容。这套假设在"少量可信研究机构"的年代成立，在数十亿互不信任的主机接入后就彻底破产了。**今天的 TLS、IPsec、DNSSEC、RPKI，都是在这笔债上慢慢还的。**',
                },
                {
                  type: 'h',
                  text: '第 103 页：恶意软件的进入与后果',
                },
                {
                  type: 'p',
                  text: 'PPT 第 103 页 **"Bad guys can put malware into hosts via Internet"** 的四条要点：',
                },
                {
                  type: 'list',
                  items: [
                    '**Malware can get in host from a virus, worm, or trojan horse**——恶意软件可以借助病毒、蠕虫或木马进入主机；',
                    '**Spyware malware can record keystrokes, web sites visited, upload info to collection site**——间谍软件能记录击键、访问过的网站，并把信息上传到收集站点；',
                    '**Infected host can be enrolled in a botnet, used for spam and DDoS attacks**——被感染的主机可以被编入**僵尸网络**，用于发送垃圾邮件和发动 DDoS 攻击；',
                    '**Malware is often self-replicating: from an infected host, seeks entry into other hosts**——恶意软件通常是自我复制的：从被感染的主机出发，寻求进入其他主机的途径。',
                  ],
                },
                {
                  type: 'h',
                  text: '第 104 页：病毒、蠕虫、木马的三分',
                },
                {
                  type: 'p',
                  text: 'PPT 第 104 页用中英对照给出了三种恶意软件的核心特征。**这是本章最重要的辨析题**，务必分清"是否需要宿主""是否需要人操作""是否主动扩散"三个维度：',
                },
                {
                  type: 'table',
                  caption: '病毒 / 蠕虫 / 木马 三者对照（PPT 第 104 页）',
                  headers: ['维度', '病毒 Virus', '蠕虫 Worm', '木马 Trojan Horse'],
                  rows: [
                    ['本质', '一段**寄生代码**，不能单独存在', '**独立完整的程序**', '隐藏在表面有用的软件中'],
                    ['依附对象', '必须挂靠在 Word 文档、软件程序上', '不依附任何宿主程序', '依附于某个正常软件或网页插件'],
                    ['触发条件', '**打开这个带毒文件**、病毒才会激活', '**不需要人操作**，可自行利用系统漏洞', '用户主动运行被伪装的有用软件'],
                    ['传播方式', '感染后把自身**复制到电脑里其他文件**', '**自己利用系统漏洞扫描全网**，主动入侵别的电脑', '**不感染、不扩散**，只做欺骗与窃取'],
                    ['感染方式', '**主动执行**：接收到对象并主动执行', '**被动接收对象**且其自行执行', '用户主动安装/打开'],
                    ['核心目标', '**破坏、感染文件**', '**传播、占用资源**', '**欺骗入侵、窃取控制**（而不是到处感染扩散）'],
                    ['典型形态', '宏病毒、文件型病毒', 'Sapphire 蠕虫、红色代码、Conficker', 'Active-X、浏览器插件、盗版软件'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示：三者区别必须能默写',
                  text: '**病毒 = 寄生代码，需依附文件/程序，需打开被感染文件才激活，复制到其他文件；蠕虫 = 独立完整程序，不需人操作，自行利用漏洞扫描全网主动入侵；木马 = 伪装成有用软件，不感染扩散，只做欺骗与控制。** 最常见考法是给出场景判断属于哪一种：用邮件附件打开文档后其他文件也坏了 → 病毒；不点任何链接、机器自己开始扫网 → 蠕虫；装了个"加速器"结果被控 → 木马。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: 'Sapphire 蠕虫：一个量级感的经典案例',
                  text: 'PPT 引用 CAIDA 与 UWisc 的数据：**Sapphire 蠕虫在爆发最初 5 分钟内的聚合扫描速率（aggregate scans/sec）达到惊人量级**。这个案例的教学意义在于：蠕虫的破坏力来自传播速度——在管理员反应过来之前，扫描范围已经覆盖了互联网的很大一部分。**蠕虫的“武器”不是破坏力，而是速度。**',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① **病毒必须依附宿主且需人为触发**，蠕虫不需要——这是最常被答反的一条。② 木马不做感染扩散（PPT 原文括号里专门写了“欺骗入侵、窃取控制，而不是到处感染扩散”）。③ botnet（僵尸网络）不是第四种病毒，而是被感染主机组成的网络，其成员往往本身是蠕虫感染的受害者。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**病毒要宿主、开会才发作；蠕虫独立身、自己扫全网；木马披羊皮、只骗不扩散。**”',
                },
                {
                  type: 'p',
                  text: '恶意软件的三种形态对应三种传播动力学：病毒靠**人的注意力**（打开附件），蠕虫靠**网络可达性与漏洞**，木马靠信任与社会工程。三种入口不同，防御也必须分层，所以现代安全策略是补丁管理、最小权限、用户教育与检测响应四管齐下，而不是只靠防火墙。',
                },
              ],
              questionIds: ['q1.6.1-01', 'q1.6.1-02'],
              related: ['k1.6.2', 'k1.6.3'],
            },
            {
              id: 'k1.6.2',
              title: '拒绝服务攻击 DoS/DDoS',
              en: 'Denial of Service',
              summary:
                'DoS 用伪造流量淹没服务器或链路使其不可用；DDoS 借助 botnet 从大量被攻陷主机同时发起攻击，威力呈倍数放大。',
              tags: ['DoS', 'DDoS', '僵尸网络', '拒绝服务', '放大攻击'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [105] }],
              insight: {
                why: '与前面三类"偷偷摸摸"的攻击不同，DoS 的目的是**公开地让服务不可用**。它不需要技术上的精妙，只需要足够的流量——因此它是对**可用性**最直接的威胁，也是最难彻底解决的一类攻击。',
                coreIdea: '**DoS（Denial of Service，拒绝服务）**：攻击者用伪造的（bogus）流量淹没资源（服务器、带宽），使合法流量无法得到服务。**DDoS** 则是借助 botnet（僵尸网络）从大量被攻陷的主机同时发起。',
                mechanism: 'PPT 第 105 页给出三步流程：① select target（选定目标）；② break into hosts around the network (see botnet)（入侵网络周围的主机，组成僵尸网络）；③ send packets toward target from compromised hosts（从被攻陷的主机向目标发送数据包）。图上标出了 target（目标）。',
                comparison: '单点 DoS 受限于攻击者自身的带宽；DDoS 借助 botnet 把 $N$ 台主机的带宽聚合，攻击流量放大 $N$ 倍，而且**攻击源分散、难以溯源和清除**。这也解释了 k1.2.2 节的 C/S 架构弱点：**服务器是集中式的，它的所有带宽都可以被同时打满**。防御手段主要是速率限制、清洗/过滤、Anycast 分散、CDN 缓存等（详见第 8 章）。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 105 页标题“Bad guys can attack servers and network infrastructure”，给出定义：**DoS 是用伪造流量（bogus traffic）淹没资源**，使合法流量无法得到服务。资源包括服务器与带宽。',
                },
                {
                  type: 'h',
                  text: '攻击流程三步',
                },
                {
                  type: 'list',
                  ordered: true,
                  items: [
                    '**select target**——**选定目标**；',
                    '**break into hosts around the network (see botnet)**——**入侵网络周围的主机**（见 botnet），把它们变成"肉鸡"；',
                    '**send packets toward target from compromised hosts**——**从被攻陷的主机向目标发送数据包**。',
                  ],
                },
                {
                  type: 'p',
                  text: '类比：DDoS 像成千上万辆货车同时堵住通往一家超市的所有道路——超市本身没坏，顾客却进不来。区别在于，网络攻击不必真的“堵路”，只要耗光目标或链路的处理能力即可。',
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么 DDoS 特别难对付',
                  text: '因为它同时具备三个性质：① **规模大**——攻击流量可以是目标服务能力的几十上百倍；② **来源分散**——botnet 成员遍布全球，逐一封禁无从下手；③ 成本不对称——发起攻击的边际成本极低（感染一批主机即可），防御成本却极高（清洗设备、扩容带宽）。真正的防御思路不是“堵住攻击”，而是让攻击打不到关键资源，这就是 CDN、Anycast、缓存与限流成为主流手段的原因。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: 'DoS 不只是"打网站"',
                  text: 'PPT 提到的是 servers and network infrastructure（服务器与网络基础设施），因此 DoS 有两个层面：**应用层 DoS** 打垮服务器处理能力（如耗尽数据库连接），**网络层 DoS** 占满带宽（如 UDP 洪泛、TCP SYN 洪泛）。前者靠限流与缓存缓解，后者靠带宽冗余与流量清洗。放大攻击（amplification）是网络层常用手法：利用 NTP、memcached 等协议“小请求大响应”的特性，把流量放大后反射给受害者。',
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① **DoS 的定义**：用伪造流量淹没资源，使合法流量不可用；② **DDoS 的三步流程**：选目标 → 入侵周围主机组成 botnet → 从被攻陷主机发包；③ DoS 攻击的是可用性（availability）；④ DDoS 依托 botnet（与 k1.6.1 联动）。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① 不要把 DoS 与“病毒感染”混为一谈：它利用**大量流量**淹没资源，不需要在被攻击主机上执行任何代码；② DoS 攻击**可用性**，窃取密码破坏机密性，篡改数据破坏完整性；③ bot 是被控主机，botnet 是这些主机组成的网络。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**选目标、养肉鸡、群殴之。**”“**DoS 打可用性，DDoS 靠僵尸网。**”',
                },
                {
                  type: 'p',
                  text: '本节与 k1.2.2 的 C/S 架构呼应：服务器集中且总是可用，因此既是单点故障，也是 DDoS 的理想目标。现代网络的基本对策，是用分布式冗余（CDN、Anycast、负载均衡）稀释集中式攻击的效果，用“多点服务”替代“单点服务”。DDoS 攻击的正是==可用性（availability）==。',
                },
              ],
              questionIds: ['q1.6.2-01'],
              related: ['k1.6.1', 'k1.6.3'],
            },
            {
              id: 'k1.6.3',
              title: '包嗅探、IP 欺骗与记录重放',
              en: 'Sniffing, Spoofing, Playback',
              summary:
                '嗅探用混杂模式网卡读取经过的全部包；IP 欺骗用虚假源地址发送包；记录重放则先把敏感信息录下来稍后重放冒充本人。',
              tags: ['嗅探', 'IP 欺骗', '重放', '混杂模式', 'Wireshark'],
              sources: [{ kind: 'ppt', ppt: 'Chapter1', slides: [106, 107, 108, 109] }],
              insight: {
                why: '前两类攻击（恶意软件、DDoS）是“从外部猛攻”，而这一类是“在链路上旁听与冒充”。它们利用的正是互联网原始设计中的两个根本缺陷：**广播介质上谁都能收包**、**IP 不做源地址认证**。',
                coreIdea: '**包嗅探（packet sniffing）**：在广播介质（共享以太网、无线）上，用混杂模式（promiscuous mode）的网络接口读取并记录经过的所有包（包括明文口令！）。**IP 欺骗（IP spoofing）**：发送源地址为假的包。记录重放（record-and-playback）：嗅探到敏感信息（如口令）后稍后使用——从系统角度看，此时的“口令持有者”就是那位用户本人。',
                mechanism: 'PPT 第 106 页指出嗅探的物理前提是 **broadcast media（shared Ethernet, wireless）**——共享以太网与无线是广播介质，所有帧都经过所有节点，因此网卡只要进入混杂模式就能收下别人的流量；**Wireshark** 这款免费抓包软件就是这样的嗅探器，课件还说明它被用于章末实验。',
                comparison: '第 107 页的 IP 欺骗利用的是 IP 协议**不验证源地址**这一原始设计缺陷（见 k1.6.1 的“mutually trusting”），防御需要 IPsec 的源地址认证或 RPKI/BGP 路由验证。第 108 页的记录重放则绕过“加密但没有防重放”的情形：即使通信被加密，只要攻击者先录下密文并在之后重放，仍可冒充用户；防御需要**随机数、时间戳或序列号**这类抗重放机制。',
              },
              blocks: [
                {
                  type: 'p',
                  text: 'PPT 第 106–109 页连续讲三类“被动监听与冒充”式攻击。包嗅探之所以可行，前提是==混杂模式（promiscuous mode）==的网卡。',
                },
                {
                  type: 'h',
                  text: '一、包嗅探（packet sniffing）',
                },
                {
                  type: 'list',
                  items: [
                    '**broadcast media (shared Ethernet, wireless)**——前提是**广播介质**：共享以太网与无线；',
                    '**promiscuous network interface reads/records all packets (e.g., including passwords!) passing by**——**混杂模式**的网络接口读取并记录所有经过的包（包括口令）；',
                    '**Wireshark software used for end-of-chapter labs is a (free) packet-sniffer**——章末实验用的 Wireshark 就是一个（免费的）嗅探器。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '为什么"广播介质"是嗅探的前提',
                  text: '在**交换式以太网**中，交换机按 MAC 地址把帧定向转发到目标端口，其他端口收不到（后来被 ARP 欺骗、MAC 泛洪等手段绕过）；在共享以太网与无线中，信号本身是**广播**的，任何节点都能收到。因此无线加密（WPA2/WPA3）格外重要：没有加密的 WiFi 上，明文口令等于在空气中公开广播。',
                },
                {
                  type: 'p',
                  text: '类比：共享介质像一间没有隔断的会议室，谁说话所有人都听得见；交换机则像把座位隔成小间。区别在于，无线信号仍会溢出到“小间”之外。',
                },
                {
                  type: 'h',
                  text: '二、IP 欺骗（IP spoofing）',
                },
                {
                  type: 'p',
                  text: 'PPT 第 107 页 “The bad guys can use false source addresses”：**“IP spoofing: send packet with false source address”**——发送**源地址为假**的分组。',
                },
                {
                  type: 'p',
                  text: '这要连回 k1.6.1 第 102 页那句话：“a group of mutually trusting users attached to a transparent network”。原始 IP 协议**假定源地址可信**，路由器不验证源地址，接收方也难以分辨。',
                },
                {
                  type: 'p',
                  text: '攻击者只要伪造源地址，就能冒充他人，例如冒充内网主机骗过基于 IP 的访问控制，或把反射攻击的流量引向受害者。',
                },
                {
                  type: 'callout',
                  tone: 'note',
                  title: '防御手段（补充）',
                  text: '① **IPsec 的源地址认证**（ESP 认证模式）；② **出口侧过滤（ingress/egress filtering）**：运营商在网络边缘丢弃源地址不属于自己客户前缀的包（BCP 38），可有效阻断伪造；③ RPKI 与 BGPsec 用来保证路由通告的合法性。核心思路是让“声称的来源”必须能被验证。',
                },
                {
                  type: 'h',
                  text: '三、记录重放（record-and-playback）',
                },
                {
                  type: 'p',
                  text: 'PPT 第 108 页 **"The bad guys can record and playback"**：',
                },
                {
                  type: 'list',
                  items: [
                    '**record-and-playback: sniff sensitive info (e.g., password), and use later**——录下敏感信息（如口令）并在**稍后使用**；',
                    '**password holder is that user from system point of view**——**从系统的角度看，此时的口令持有者就是那位用户本人**。',
                  ],
                },
                {
                  type: 'callout',
                  tone: 'why',
                  title: '重放攻击说明了什么',
                  text: '它说明**“保密”与“防重放”是不同的问题**：攻击者即使读不懂密文，只要能**原封不动地重放之前录下的密文**，就可以冒充用户完成认证。因此安全协议需要随机数、时间戳或序列号来保证新鲜性——新鲜性是独立于机密性的一条安全属性，第 8 章讲认证时会再次出现。',
                },
                {
                  type: 'p',
                  text: '408 联系：TCP 用序列号识别重复与乱序报文，认证协议用随机数或时间戳保证新鲜性，思路都是给报文一个不可复用的一次性标识。',
                },
                {
                  type: 'table',
                  caption: '三类攻击对照',
                  headers: ['攻击', '英文', '手段', '利用的缺陷', '针对的安全属性'],
                  rows: [
                    ['包嗅探', 'packet sniffing', '混杂模式网卡读取广播介质上的所有包', '共享介质上流量对所有人可见；明文传输', '机密性'],
                    ['IP 欺骗', 'IP spoofing', '用虚假源地址发送分组', 'IP 不验证源地址（原始设计假定互信）', '身份认证 / 完整性'],
                    ['记录重放', 'record-and-playback', '录下敏感信息，稍后原样使用', '协议缺少新鲜性保证（无随机数/时间戳）', '身份认证 / 会话新鲜性'],
                  ],
                },
                {
                  type: 'callout',
                  tone: 'exam',
                  title: '考点提示',
                  text: '① 嗅探的前提是**广播介质**（共享以太网、无线）与**混杂模式网卡**；② IP 欺骗指发送源地址为假的分组，根因是 IP 不做源认证；③ 记录重放指录下敏感信息稍后使用，从系统看口令持有者仍是该用户；④ 三类攻击针对的安全属性不同：机密性、认证、新鲜性。',
                },
                {
                  type: 'callout',
                  tone: 'warning',
                  title: '易错点',
                  text: '① 嗅探不等于“破解加密”：它在明文协议（如 HTTP、Telnet）上直接有效，在加密协议上只能录下密文，后者正是重放攻击的素材。② **IP 欺骗只伪造源地址**，不改目的地址。③ 从系统角度看，重放者仍像合法用户。',
                },
                {
                  type: 'callout',
                  tone: 'tip',
                  title: '记忆口诀',
                  text: '“**共享介质好偷听，源地址随便填，录下来以后也能用。**”安全属性对照：“**嗅探破机密，欺骗冒身份，重放破新鲜。**”',
                },
                {
                  type: 'h',
                  text: '第 109 页：本课程后续还会继续讲安全',
                },
                {
                  type: 'p',
                  text: 'PPT 第 109 页 “Network Security” 指出：more throughout this course（安全会在全课程中反复出现），并预告**chapter 8: focus on security**，内容包括 cryptographic techniques: obvious uses and not so obvious uses（密码学技术的明显用途与不明显的用途）。',
                },
                {
                  type: 'p',
                  text: '第 102 页说安全考量贯穿所有层。对照五层模型，每一层都有自己的安全问题与应对手段：',
                },
                {
                  type: 'table',
                  caption: '五层模型中的代表性安全问题',
                  headers: ['层次', '典型攻击', '应对手段'],
                  rows: [
                    ['物理层', '窃听线路', '光纤、加密的物理层方案'],
                    ['链路层', 'WEP 破解、ARP 欺骗', 'WPA2/WPA3、802.1X'],
                    ['网络层', 'IP 欺骗', 'IPsec、出口过滤'],
                    ['传输层', '会话劫持、TCP 序列号预测', 'TLS、随机化 ISN'],
                    ['应用层', '钓鱼、恶意网页', '应用层认证与完整性'],
                  ],
                },
              ],
              questionIds: ['q1.6.3-01', 'q1.6.3-02'],
              related: ['k1.6.1', 'k1.6.2', 'k1.5.4'],
            },
          ],
        },
]
